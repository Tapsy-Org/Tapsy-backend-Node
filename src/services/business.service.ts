import type { Prisma } from '@prisma/client';

import prisma from '../config/db';
import AppError from '../utils/AppError';

export class BusinessService {
  /**
   * Get businesses by category with optional filters
   */
  async getBusinessesByCategory(
    categoryIds: string[],
    filters: {
      rating?: number;
      location?: {
        latitude: number;
        longitude: number;
        radius: number; // in meters
      };
      search?: string;
    } = {},
    options: {
      page?: number;
      limit?: number;
      sortBy?: 'rating' | 'reviews' | 'name' | 'distance';
      sortOrder?: 'asc' | 'desc';
    } = {},
  ) {
    try {
      const { page = 1, limit = 20, sortBy = 'rating', sortOrder = 'desc' } = options;
      const skip = (page - 1) * limit;

      const where: Prisma.UserWhereInput = {
        user_type: 'BUSINESS',
        status: 'ACTIVE',
        categories: {
          some: {
            categoryId: { in: categoryIds },
          },
        },
      };

      // Add search filter
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { username: { contains: filters.search, mode: 'insensitive' } },
          { about: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      // Add rating filter
      if (filters.rating) {
        where.AND = [
          { review_count: { gt: 0 } },
          {
            rating_sum: {
              gte: filters.rating * 1,
            },
          },
        ];
      }

      // Add location filter if provided
      if (filters.location) {
        // For location-based filtering, we'll use a bounding box approach
        // This is a simplified version - for production, consider using PostGIS for better performance
        const { latitude, longitude, radius } = filters.location;
        const earthRadius = 6371000; // Earth's radius in meters

        // Calculate bounding box
        const latDelta = (radius / earthRadius) * (180 / Math.PI);
        const lngDelta =
          (radius / (earthRadius * Math.cos((latitude * Math.PI) / 180))) * (180 / Math.PI);

        where.locations = {
          some: {
            latitude: {
              gte: latitude - latDelta,
              lte: latitude + latDelta,
            },
            longitude: {
              gte: longitude - lngDelta,
              lte: longitude + lngDelta,
            },
          },
        };
      }

      // Build order by clause
      let orderBy: Prisma.UserOrderByWithRelationInput[] = [];
      switch (sortBy) {
        case 'rating':
          orderBy = [{ rating_sum: sortOrder }, { review_count: 'desc' }];
          break;
        case 'reviews':
          orderBy = [{ review_count: sortOrder }];
          break;
        case 'name':
          orderBy = [{ name: sortOrder }];
          break;
        default:
          orderBy = [{ rating_sum: 'desc' }, { review_count: 'desc' }];
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
          skip,
          take: limit,
          orderBy,
        }),
        prisma.user.count({ where }),
      ]);

      // Calculate distance and rating for each business
      const businessesWithDetails = businesses.map((business) => {
        const rating =
          business.review_count > 0
            ? Number((business.rating_sum / business.review_count).toFixed(1))
            : null;

        let distance = null;
        if (filters.location && (business as any).locations && (business as any).locations[0]) {
          distance = this.calculateDistance(
            filters.location.latitude,
            filters.location.longitude,
            (business as any).locations[0].latitude,
            (business as any).locations[0].longitude,
          );
        }

        return {
          ...business,
          rating,
          ratingCount: business.review_count,
          distance,
        };
      });

      // Sort by distance if requested
      if (sortBy === 'distance' && filters.location) {
        businessesWithDetails.sort((a, b) => {
          if (!a.distance) return 1;
          if (!b.distance) return -1;
          return sortOrder === 'asc' ? a.distance - b.distance : b.distance - a.distance;
        });
      }

      return {
        businesses: businessesWithDetails,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        filters,
        categoryIds,
      };
    } catch (error) {
      console.error('Error getting businesses by category:', error);
      throw new AppError('Failed to get businesses by category', 500, { originalError: error });
    }
  }

  /**
   * Get business details by ID
   */
  async getBusinessById(businessId: string) {
    try {
      const business = await prisma.user.findUnique({
        where: {
          id: businessId,
          user_type: 'BUSINESS',
          status: 'ACTIVE',
        },
        select: {
          id: true,
          username: true,
          name: true,
          logo_url: true,
          about: true,
          email: true,
          website: true,
          video_url: true,
          rating_sum: true,
          review_count: true,
          createdAt: true,
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
            orderBy: { updatedAt: 'desc' },
          },
          _count: {
            select: {
              businessReviews: true,
              followers: true,
              businessVideos: true,
            },
          },
        },
      });

      if (!business) {
        throw new AppError('Business not found', 404);
      }

      const rating =
        business.review_count > 0
          ? Number((business.rating_sum / business.review_count).toFixed(1))
          : null;

      return {
        ...business,
        rating,
        ratingCount: business.review_count,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error getting business by ID:', error);
      throw new AppError('Failed to get business details', 500, { originalError: error });
    }
  }

  /**
   * Search businesses using Google Places API
   */
  async searchGooglePlaces(
    query: string,
    location?: { latitude: number; longitude: number; radius?: number },
  ) {
    try {
      const googleMapsKey = process.env.GOOGLE_API_KEY;
      if (!googleMapsKey) {
        throw new AppError('Google Maps API key not configured', 500);
      }

      let url: URL;

      if (location) {
        // Use Nearby Search for location-based queries
        url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
        url.searchParams.set('location', `${location.latitude},${location.longitude}`);
        url.searchParams.set('radius', (location.radius || 5000).toString());
        url.searchParams.set('keyword', query);
      } else {
        // Use Text Search for general queries
        url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
        url.searchParams.set('query', query);
      }

      url.searchParams.set('key', googleMapsKey);
      url.searchParams.set('type', 'establishment');

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('Google Places API error:', data.error_message);
        throw new AppError('Google Places API error', 500, { details: data.error_message });
      }

      return (
        data.results?.map((place: any) => ({
          place_id: place.place_id,
          name: place.name,
          formatted_address: place.formatted_address,
          rating: place.rating || null,
          user_ratings_total: place.user_ratings_total || 0,
          price_level: place.price_level || null,
          types: place.types || [],
          geometry: place.geometry,
          photos:
            place.photos?.map((photo: any) => ({
              photo_reference: photo.photo_reference,
              width: photo.width,
              height: photo.height,
              html_attributions: photo.html_attributions,
            })) || [],
          opening_hours: place.opening_hours
            ? {
                open_now: place.opening_hours.open_now,
                weekday_text: place.opening_hours.weekday_text,
              }
            : null,
        })) || []
      );
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Google Places search error:', error);
      throw new AppError('Failed to search Google Places', 500, { originalError: error });
    }
  }

  /**
   * Get popular businesses (trending)
   */
  async getPopularBusinesses(
    options: {
      limit?: number;
      categoryIds?: string[];
      timeframe?: 'day' | 'week' | 'month';
    } = {},
  ) {
    try {
      const { limit = 10, categoryIds, timeframe = 'week' } = options;

      // Calculate date threshold for trending
      const now = new Date();
      let dateThreshold: Date;
      switch (timeframe) {
        case 'day':
          dateThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          dateThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      const where: Prisma.UserWhereInput = {
        user_type: 'BUSINESS',
        status: 'ACTIVE',
        review_count: { gt: 0 },
      };

      if (categoryIds && categoryIds.length > 0) {
        where.categories = {
          some: {
            categoryId: { in: categoryIds },
          },
        };
      }

      const businesses = await prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          name: true,
          logo_url: true,
          about: true,
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
              businessReviews: {
                where: {
                  createdAt: { gte: dateThreshold },
                },
              },
              followers: true,
            },
          },
        },
        orderBy: [{ review_count: 'desc' }, { rating_sum: 'desc' }],
        take: limit * 2, // Get more to filter by recent activity
      });

      // Calculate trending score and filter
      const businessesWithTrending = businesses
        .map((business) => {
          const rating =
            business.review_count > 0
              ? Number((business.rating_sum / business.review_count).toFixed(1))
              : 0;

          const recentReviews = business._count?.businessReviews || 0;
          const totalReviews = business.review_count;
          const followersCount = business._count?.followers || 0;

          // Calculate trending score (combination of recent activity and overall quality)
          const trendingScore = recentReviews * 3 + rating * totalReviews + followersCount * 0.5;

          return {
            ...business,
            rating,
            ratingCount: business.review_count,
            recentReviews,
            trendingScore,
          };
        })
        .filter((business) => business.recentReviews > 0) // Only include businesses with recent activity
        .sort((a, b) => b.trendingScore - a.trendingScore)
        .slice(0, limit);

      return {
        businesses: businessesWithTrending,
        timeframe,
        total: businessesWithTrending.length,
      };
    } catch (error) {
      console.error('Error getting popular businesses:', error);
      throw new AppError('Failed to get popular businesses', 500, { originalError: error });
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance); // Return distance in meters
  }

  /**
   * Get total business count
   */
  async getTotalBusinessCount(): Promise<number> {
    try {
      return await prisma.user.count({
        where: {
          user_type: 'BUSINESS',
          status: 'ACTIVE',
        },
      });
    } catch (error) {
      console.error('Error getting total business count:', error);
      throw new AppError('Failed to get business count', 500, { originalError: error });
    }
  }

  /**
   * Get new business count since a specific date
   */
  async getNewBusinessCount(since: Date): Promise<number> {
    try {
      return await prisma.user.count({
        where: {
          user_type: 'BUSINESS',
          status: 'ACTIVE',
          createdAt: {
            gte: since,
          },
        },
      });
    } catch (error) {
      console.error('Error getting new business count:', error);
      throw new AppError('Failed to get new business count', 500, { originalError: error });
    }
  }

  /**
   * Get average business rating across all businesses
   */
  async getAverageBusinessRating(): Promise<number> {
    try {
      const result = await prisma.user.aggregate({
        where: {
          user_type: 'BUSINESS',
          status: 'ACTIVE',
          review_count: { gt: 0 },
        },
        _avg: {
          rating_sum: true,
        },
        _sum: {
          review_count: true,
        },
      });

      if (!result._avg.rating_sum || !result._sum.review_count) {
        return 0;
      }

      // Calculate weighted average: total rating sum / total review count
      const totalRatingSum = result._avg.rating_sum * (await this.getTotalBusinessCount());
      const totalReviews = result._sum.review_count;

      return Number((totalRatingSum / totalReviews).toFixed(2));
    } catch (error) {
      console.error('Error getting average business rating:', error);
      throw new AppError('Failed to get average rating', 500, { originalError: error });
    }
  }

  /**
   * Get total review count across all businesses
   */
  async getTotalReviewCount(): Promise<number> {
    try {
      const result = await prisma.review.count({
        where: {
          status: 'ACTIVE',
          business: {
            user_type: 'BUSINESS',
            status: 'ACTIVE',
          },
        },
      });

      return result;
    } catch (error) {
      console.error('Error getting total review count:', error);
      throw new AppError('Failed to get review count', 500, { originalError: error });
    }
  }
}
