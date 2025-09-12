import { type Prisma, Status } from '@prisma/client';

import prisma from '../config/db';
import AppError from '../utils/AppError';
import { RedisService } from '../utils/redis';
import { GoogleMapsService, type SearchBusinessResult } from './googlemaps.service';

export class SearchService {
  private redisService: RedisService;
  private googleMapsService: GoogleMapsService;
  private readonly maxRecentSearches = 10;

  constructor() {
    this.redisService = new RedisService();
    this.googleMapsService = new GoogleMapsService();
  }

  /**
   * Perform comprehensive business search
   * @param userId - The user performing the search
   * @param query - Search query
   * @param filters - Optional filters for the search
   * @param options - Pagination and location options
   */
  async searchBusinesses(
    userId: string,
    query: string,
    filters: {
      categoryIds?: string[];
      rating?: number;
      radius?: number;
    } = {},
    options: {
      page?: number;
      limit?: number;
      latitude?: number;
      longitude?: number;
    } = {},
  ) {
    try {
      const { page = 1, limit = 20, latitude, longitude } = options;
      const skip = (page - 1) * limit;

      // Save search to history (both Redis and database)
      await Promise.all([
        this.redisService.saveRecentSearch(userId, query, this.maxRecentSearches),
        this.saveSearchToDatabase(userId, query),
      ]);

      // Search in local database
      const localResults = await this.searchLocalBusinesses(query, filters, { skip, limit });

      // Search in Google Maps if location provided
      let googleResults: SearchBusinessResult[] = [];
      if (latitude && longitude) {
        googleResults = await this.googleMapsService.searchBusinesses(query, {
          latitude,
          longitude,
          radius: filters.radius || 5000, // 5km default
        });
      }

      // Combine and deduplicate results
      const combinedResults = this.combineSearchResults(localResults.businesses, googleResults);

      return {
        businesses: combinedResults.slice(0, limit),
        pagination: {
          page,
          limit,
          total: localResults.total + googleResults.length,
          totalPages: Math.ceil((localResults.total + googleResults.length) / limit),
        },
        sources: {
          local: localResults.businesses.length,
          google: googleResults.length,
        },
        query,
        filters,
      };
    } catch (error) {
      console.error('Search error:', error);
      throw new AppError('Failed to perform search', 500, { originalError: error });
    }
  }

  /**
   * Save search to database for analytics
   */
  private async saveSearchToDatabase(userId: string, query: string): Promise<void> {
    try {
      await prisma.recentSearch.create({
        data: {
          userId,
          status: Status.ACTIVE,
          searchText: query,
        },
      });
    } catch (error) {
      console.error('Error saving search to database:', error);
      // Don't throw error as this is not critical
    }
  }

  /**
   * Search local database for businesses
   */
  private async searchLocalBusinesses(
    query: string,
    filters: { categoryIds?: string[]; rating?: number },
    options: { skip: number; limit: number },
  ): Promise<{
    businesses: SearchBusinessResult[];
    total: number;
  }> {
    const where: Prisma.UserWhereInput = {
      user_type: 'BUSINESS',
      status: 'ACTIVE',
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { username: { contains: query, mode: 'insensitive' } },
        { about: { contains: query, mode: 'insensitive' } },
      ],
    };

    // Add category filter
    if (filters.categoryIds && filters.categoryIds.length > 0) {
      where.categories = {
        some: {
          categoryId: { in: filters.categoryIds },
        },
      };
    }

    // Add rating filter
    if (filters.rating) {
      where.AND = [
        { review_count: { gt: 0 } },
        {
          rating_sum: {
            gte: filters.rating * 1, // At least the specified rating
          },
        },
      ];
    }

    const [businesses, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          name: true,
          logo_url: true,
          about: true,
          email: true,
          website: true,
          rating_sum: true,
          review_count: true,
          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          locations: {
            select: {
              id: true,
              address: true,
              latitude: true,
              longitude: true,
              city: true,
              state: true,
              country: true,
            },
            take: 1,
            orderBy: { updatedAt: 'desc' },
          },
          _count: {
            select: {
              businessReviews: true,
              followers: true,
            },
          },
        },
        skip: options.skip,
        take: options.limit,
        orderBy: [
          { review_count: 'desc' }, // Prioritize businesses with more reviews
          { rating_sum: 'desc' },
          { name: 'asc' },
        ],
      }),
      prisma.user.count({ where }),
    ]);

    // Calculate rating for each business and format as SearchBusinessResult
    const businessesWithRating: SearchBusinessResult[] = businesses.map((business) => {
      const rating =
        business.review_count > 0
          ? Number((business.rating_sum / business.review_count).toFixed(1))
          : null;

      return {
        id: business.id,
        name: business.name,
        username: business.username,
        logo_url: business.logo_url,
        about: business.about,
        email: business.email,
        website: business.website,
        rating,
        ratingCount: business.review_count,
        categories: business.categories,
        locations: business.locations.map((location) => ({
          ...location,
          address: location.address || '',
        })),
        _count: business._count,
        source: 'local' as const,
      };
    });

    return {
      businesses: businessesWithRating,
      total,
    };
  }

  /**
   * Combine and deduplicate search results from local and Google
   * Uses improved deduplication logic based on name similarity and location proximity
   */
  private combineSearchResults(
    localResults: SearchBusinessResult[],
    googleResults: SearchBusinessResult[],
  ): SearchBusinessResult[] {
    // Create a map to track businesses by name to avoid duplicates
    const businessMap = new Map<string, SearchBusinessResult>();

    // Add local results first (they have priority)
    localResults.forEach((business) => {
      const key = this.generateBusinessKey(business);
      if (key && !businessMap.has(key)) {
        businessMap.set(key, business);
      }
    });

    // Add Google results that don't duplicate local ones
    googleResults.forEach((business) => {
      const key = this.generateBusinessKey(business);
      if (key && !this.isDuplicateBusiness(business, Array.from(businessMap.values()))) {
        businessMap.set(key, business);
      }
    });

    return Array.from(businessMap.values());
  }

  /**
   * Generate a unique key for business deduplication
   */
  private generateBusinessKey(business: SearchBusinessResult): string {
    return (
      business.name
        ?.toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '') || business.id
    );
  }

  /**
   * Check if a business is a duplicate of any existing business
   * Uses name similarity and location proximity
   */
  private isDuplicateBusiness(
    newBusiness: SearchBusinessResult,
    existingBusinesses: SearchBusinessResult[],
  ): boolean {
    const newName = newBusiness.name?.toLowerCase().trim();
    const newLocation = newBusiness.locations?.[0];

    if (!newName) return false;

    return existingBusinesses.some((existing) => {
      const existingName = existing.name?.toLowerCase().trim();
      const existingLocation = existing.locations?.[0];

      // Check name similarity (simple approach - can be enhanced with fuzzy matching)
      if (existingName && this.isNameSimilar(newName, existingName)) {
        // If names are similar, check location proximity (within 100 meters)
        if (newLocation && existingLocation) {
          const distance = this.googleMapsService.calculateDistance(
            newLocation.latitude,
            newLocation.longitude,
            existingLocation.latitude,
            existingLocation.longitude,
          );
          return distance <= 100; // Within 100 meters
        }
        return true; // Names are similar and no location to compare
      }
      return false;
    });
  }

  /**
   * Check if two business names are similar
   */
  private isNameSimilar(name1: string, name2: string): boolean {
    // Remove common business suffixes and normalize
    const normalize = (name: string) =>
      name
        .toLowerCase()
        .replace(
          /\b(inc|llc|ltd|corp|corporation|company|co|restaurant|cafe|bar|grill|pizza|shop|store)\b/g,
          '',
        )
        .replace(/[^a-z0-9]/g, '')
        .trim();

    const normalized1 = normalize(name1);
    const normalized2 = normalize(name2);

    // Check if one name is contained in the other or they're exactly the same
    return (
      normalized1 === normalized2 ||
      normalized1.includes(normalized2) ||
      normalized2.includes(normalized1) ||
      this.calculateLevenshteinDistance(normalized1, normalized2) <= 2
    );
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private calculateLevenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator, // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Get recent searches for a user from Redis
   */
  async getRecentSearches(userId: string): Promise<string[]> {
    return await this.redisService.getRecentSearches(userId);
  }

  /**
   * Get search history from database with pagination
   */
  async getSearchHistory(userId: string, options: { page?: number; limit?: number } = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      const skip = (page - 1) * limit;

      const [searches, total] = await Promise.all([
        prisma.recentSearch.findMany({
          where: { userId },
          select: {
            id: true,
            searchText: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.recentSearch.count({ where: { userId } }),
      ]);

      return {
        searches,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error getting search history from database:', error);
      throw new AppError('Failed to get search history', 500, { originalError: error });
    }
  }

  /**
   * Clear recent searches for a user
   */
  async clearRecentSearches(userId: string): Promise<void> {
    return await this.redisService.clearRecentSearches(userId);
  }
}
