import { NextFunction, Response } from 'express';

import { SearchService } from '../services/search.service';
import { AuthRequest } from '../types/express';
import AppError from '../utils/AppError';

const searchService = new SearchService();

export default class SearchController {
  /**
   * Search for businesses
   */
  static async searchBusinesses(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { query, categoryIds, rating, radius } = req.body;
      const { page, limit, latitude, longitude } = req.body;

      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        throw new AppError('Search query is required', 400);
      }

      // Validate pagination parameters
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 20;

      if (pageNum < 1) {
        throw new AppError('Page must be a positive number', 400);
      }

      if (limitNum < 1 || limitNum > 100) {
        throw new AppError('Limit must be between 1 and 100', 400);
      }

      // Validate location parameters
      let locationData;
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

        locationData = { latitude: lat, longitude: lng };
      }

      // Validate rating filter
      if (rating !== undefined) {
        const ratingNum = parseFloat(rating);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
          throw new AppError('Rating must be between 1 and 5', 400);
        }
      }

      // Validate radius
      if (radius !== undefined) {
        const radiusNum = parseInt(radius);
        if (isNaN(radiusNum) || radiusNum < 1 || radiusNum > 50000) {
          throw new AppError('Radius must be between 1 and 50000 meters', 400);
        }
      }

      const filters = {
        categoryIds: Array.isArray(categoryIds) ? categoryIds : [],
        rating: rating ? parseFloat(rating) : undefined,
        radius: radius ? parseInt(radius) : undefined,
      };

      const options = {
        page: pageNum,
        limit: limitNum,
        latitude: locationData?.latitude,
        longitude: locationData?.longitude,
      };

      const result = await searchService.searchBusinesses(userId, query.trim(), filters, options);

      return res.success(result, 'Search completed successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recent searches from Redis
   */
  static async getRecentSearches(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const recentSearches = await searchService.getRecentSearches(userId);

      return res.success(
        {
          searches: recentSearches,
          count: recentSearches.length,
        },
        'Recent searches fetched successfully',
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get search history from database
   */
  static async getSearchHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { page, limit } = req.query;

      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 20;

      if (pageNum < 1) {
        throw new AppError('Page must be a positive number', 400);
      }

      if (limitNum < 1 || limitNum > 100) {
        throw new AppError('Limit must be between 1 and 100', 400);
      }

      const result = await searchService.getSearchHistory(userId, {
        page: pageNum,
        limit: limitNum,
      });

      return res.success(result, 'Search history fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clear recent searches
   */
  static async clearRecentSearches(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      await searchService.clearRecentSearches(userId);

      return res.success(
        {
          userId,
          message: 'Recent searches cleared successfully',
        },
        'Recent searches cleared successfully',
      );
    } catch (error) {
      next(error);
    }
  }
}
