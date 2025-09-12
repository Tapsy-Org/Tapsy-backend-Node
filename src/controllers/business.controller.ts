import { NextFunction, Response } from 'express';

import { BusinessService } from '../services/business.service';
import { GoogleMapsService } from '../services/googlemaps.service';
import { AuthRequest } from '../types/express';
import AppError from '../utils/AppError';

const businessService = new BusinessService();
const googleMapsService = new GoogleMapsService();

export default class BusinessController {
  /**
   * Get businesses by category
   */
  static async getBusinessesByCategory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { categoryIds } = req.body;
      const { rating, search, latitude, longitude, radius } = req.body;
      const { page, limit, sortBy, sortOrder } = req.body;

      if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
        throw new AppError('Category IDs are required', 400);
      }

      // Validate pagination
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 20;

      if (pageNum < 1) {
        throw new AppError('Page must be a positive number', 400);
      }

      if (limitNum < 1 || limitNum > 100) {
        throw new AppError('Limit must be between 1 and 100', 400);
      }

      // Validate sort parameters
      const validSortBy = ['rating', 'reviews', 'name', 'distance'];
      const validSortOrder = ['asc', 'desc'];

      if (sortBy && !validSortBy.includes(sortBy)) {
        throw new AppError(`Sort by must be one of: ${validSortBy.join(', ')}`, 400);
      }

      if (sortOrder && !validSortOrder.includes(sortOrder)) {
        throw new AppError('Sort order must be asc or desc', 400);
      }

      // Build filters
      const filters: {
        rating?: number;
        search?: string;
        location?: {
          latitude: number;
          longitude: number;
          radius: number;
        };
      } = {};

      if (rating !== undefined) {
        const ratingNum = parseFloat(rating);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
          throw new AppError('Rating must be between 1 and 5', 400);
        }
        filters.rating = ratingNum;
      }

      if (search && typeof search === 'string') {
        filters.search = search.trim();
      }

      // Handle location filter
      if (latitude !== undefined && longitude !== undefined) {
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        if (isNaN(lat) || isNaN(lng)) {
          throw new AppError('Invalid latitude or longitude', 400);
        }

        if (lat < -90 || lat > 90) {
          throw new AppError('Latitude must be between -90 and 90', 400);
        }

        if (lng < -180 || lng > 180) {
          throw new AppError('Longitude must be between -180 and 180', 400);
        }

        filters.location = {
          latitude: lat,
          longitude: lng,
          radius: radius ? parseInt(radius) : 5000, // Default 5km
        };
      }

      const options = {
        page: pageNum,
        limit: limitNum,
        sortBy: sortBy || 'rating',
        sortOrder: sortOrder || 'desc',
      };

      const result = await businessService.getBusinessesByCategory(categoryIds, filters, options);

      return res.success(result, 'Businesses fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get business details by ID
   */
  static async getBusinessDetails(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { businessId } = req.params;

      if (!businessId) {
        throw new AppError('Business ID is required', 400);
      }

      const business = await businessService.getBusinessById(businessId);

      return res.success(business, 'Business details fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get popular/trending businesses
   */
  static async getPopularBusinesses(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { limit, categoryIds, timeframe } = req.query;

      const limitNum = parseInt(limit as string) || 10;
      if (limitNum < 1 || limitNum > 50) {
        throw new AppError('Limit must be between 1 and 50', 400);
      }

      const validTimeframes = ['day', 'week', 'month'];
      const timeframeValue = (timeframe as string) || 'week';
      if (!validTimeframes.includes(timeframeValue)) {
        throw new AppError(`Timeframe must be one of: ${validTimeframes.join(', ')}`, 400);
      }

      const options = {
        limit: limitNum,
        categoryIds: categoryIds
          ? Array.isArray(categoryIds)
            ? (categoryIds as string[])
            : [categoryIds as string]
          : undefined,
        timeframe: timeframeValue as 'day' | 'week' | 'month',
      };

      const result = await businessService.getPopularBusinesses(options);

      return res.success(result, 'Popular businesses fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search Google Places directly
   */
  static async searchGooglePlaces(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { query, latitude, longitude, radius } = req.body;

      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        throw new AppError('Search query is required', 400);
      }

      let location;
      if (latitude !== undefined && longitude !== undefined) {
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        if (isNaN(lat) || isNaN(lng)) {
          throw new AppError('Invalid latitude or longitude', 400);
        }

        if (lat < -90 || lat > 90) {
          throw new AppError('Latitude must be between -90 and 90', 400);
        }

        if (lng < -180 || lng > 180) {
          throw new AppError('Longitude must be between -180 and 180', 400);
        }

        location = {
          latitude: lat,
          longitude: lng,
          radius: radius ? parseInt(radius) : 5000,
        };
      }

      const results = await googleMapsService.searchBusinessesByText(query.trim());

      return res.success(
        {
          places: results,
          query: query.trim(),
          location,
          count: results.length,
        },
        'Google Places search completed successfully',
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get nearby businesses using location
   */
  static async getNearbyBusinesses(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { latitude, longitude, radius, categoryIds, rating, limit } = req.body;

      if (!latitude || !longitude) {
        throw new AppError('Latitude and longitude are required', 400);
      }

      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      if (isNaN(lat) || isNaN(lng)) {
        throw new AppError('Invalid latitude or longitude', 400);
      }

      if (lat < -90 || lat > 90) {
        throw new AppError('Latitude must be between -90 and 90', 400);
      }

      if (lng < -180 || lng > 180) {
        throw new AppError('Longitude must be between -180 and 180', 400);
      }

      const filters: {
        rating?: number;
        location: {
          latitude: number;
          longitude: number;
          radius: number;
        };
      } = {
        location: {
          latitude: lat,
          longitude: lng,
          radius: radius ? parseInt(radius) : 5000, // Default 5km
        },
      };

      if (rating !== undefined) {
        const ratingNum = parseFloat(rating);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
          throw new AppError('Rating must be between 1 and 5', 400);
        }
        filters.rating = ratingNum;
      }

      const options = {
        page: 1,
        limit: limit ? parseInt(limit) : 20,
        sortBy: 'distance' as const,
        sortOrder: 'asc' as const,
      };

      const categoryFilter = categoryIds && Array.isArray(categoryIds) ? categoryIds : [];
      const result = await businessService.getBusinessesByCategory(
        categoryFilter,
        filters,
        options,
      );

      return res.success(result, 'Nearby businesses fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get business categories with stats
   */
  static async getBusinessStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { timeframe } = req.query;

      const validTimeframes = ['day', 'week', 'month', 'year'];
      const timeframeValue = (timeframe as string) || 'month';

      if (!validTimeframes.includes(timeframeValue)) {
        throw new AppError(`Timeframe must be one of: ${validTimeframes.join(', ')}`, 400);
      }

      // Calculate date threshold
      const now = new Date();
      let dateThreshold: Date;
      switch (timeframeValue) {
        case 'day':
          dateThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          dateThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          dateThreshold = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          dateThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Get business statistics
      const stats = {
        totalBusinesses: await businessService.getTotalBusinessCount(),
        newBusinesses: await businessService.getNewBusinessCount(dateThreshold),
        averageRating: await businessService.getAverageBusinessRating(),
        totalReviews: await businessService.getTotalReviewCount(),
        timeframe: timeframeValue,
        generatedAt: new Date().toISOString(),
      };

      return res.success(stats, 'Business statistics fetched successfully');
    } catch (error) {
      next(error);
    }
  }
}
