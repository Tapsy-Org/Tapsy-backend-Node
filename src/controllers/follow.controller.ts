import { NextFunction, Response } from 'express';

import { FollowService } from '../services/follow.service';
import { AuthRequest } from '../types/express';
import AppError from '../utils/AppError';

const followService = new FollowService();

export default class FollowController {
  static async followUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { followingUserId } = req.params;
      const { followType = 'FOLLOW' } = req.body;
      const followerId = req.user?.userId;

      if (!followerId) {
        throw new AppError('User not authenticated', 401);
      }

      if (!followingUserId) {
        throw new AppError('User ID to follow is required', 400);
      }

      const result = await followService.followUser(followerId, followingUserId, followType);

      return res.created(result, 'Successfully followed user');
    } catch (error) {
      next(error);
    }
  }

  static async unfollowUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { followingUserId } = req.params;
      const followerId = req.user?.userId;

      if (!followerId) {
        throw new AppError('User not authenticated', 401);
      }

      if (!followingUserId) {
        throw new AppError('User ID to unfollow is required', 400);
      }

      const result = await followService.unfollowUser(followerId, followingUserId);

      return res.success(result, 'Successfully unfollowed user');
    } catch (error) {
      next(error);
    }
  }

  static async checkFollowStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { followingUserId } = req.params;
      const followerId = req.user?.userId;

      if (!followerId) {
        throw new AppError('User not authenticated', 401);
      }

      if (!followingUserId) {
        throw new AppError('User ID to check is required', 400);
      }

      const result = await followService.checkFollowStatus(followerId, followingUserId);

      return res.success(result, 'Follow status retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getFollowers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { page = '1', limit = '20' } = req.query;

      if (!userId) {
        throw new AppError('User ID is required', 400);
      }

      const result = await followService.getFollowers(
        userId,
        parseInt(page as string, 10),
        parseInt(limit as string, 10),
      );

      return res.success(result, 'Followers retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getFollowing(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { page = '1', limit = '20' } = req.query;

      if (!userId) {
        throw new AppError('User ID is required', 400);
      }

      const result = await followService.getFollowing(
        userId,
        parseInt(page as string, 10),
        parseInt(limit as string, 10),
      );

      return res.success(result, 'Following list retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getFollowCounts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      if (!userId) {
        throw new AppError('User ID is required', 400);
      }

      const result = await followService.getFollowCounts(userId);

      return res.success(result, 'Follow counts retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getMutualFollowers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId1, userId2 } = req.params;
      const currentUserId = req.user?.userId;

      if (!currentUserId) {
        throw new AppError('User not authenticated', 401);
      }

      if (!userId1 || !userId2) {
        throw new AppError('Both user IDs are required', 400);
      }

      // Ensure current user is one of the users being compared
      if (currentUserId !== userId1 && currentUserId !== userId2) {
        throw new AppError(
          'You can only check mutual followers for yourself or with another user',
          403,
        );
      }

      const result = await followService.getMutualFollowers(userId1, userId2);

      return res.success(result, 'Mutual followers retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async searchUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { query } = req.query;
      const { page = '1', limit = '20' } = req.query;
      const currentUserId = req.user?.userId;

      if (!currentUserId) {
        throw new AppError('User not authenticated', 401);
      }

      if (!query || typeof query !== 'string') {
        throw new AppError('Search query is required', 400);
      }

      if (query.trim().length < 2) {
        throw new AppError('Search query must be at least 2 characters long', 400);
      }

      const result = await followService.searchUsers(
        query.trim(),
        currentUserId,
        parseInt(page as string, 10),
        parseInt(limit as string, 10),
      );

      return res.success(result, 'Users search completed successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getMyFollowers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const currentUserId = req.user?.userId;
      const { page = '1', limit = '20' } = req.query;

      if (!currentUserId) {
        throw new AppError('User not authenticated', 401);
      }

      const result = await followService.getFollowers(
        currentUserId,
        parseInt(page as string, 10),
        parseInt(limit as string, 10),
      );

      return res.success(result, 'Your followers retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getMyFollowing(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const currentUserId = req.user?.userId;
      const { page = '1', limit = '20' } = req.query;

      if (!currentUserId) {
        throw new AppError('User not authenticated', 401);
      }

      const result = await followService.getFollowing(
        currentUserId,
        parseInt(page as string, 10),
        parseInt(limit as string, 10),
      );

      return res.success(result, 'Your following list retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getMyFollowCounts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const currentUserId = req.user?.userId;

      if (!currentUserId) {
        throw new AppError('User not authenticated', 401);
      }

      const result = await followService.getFollowCounts(currentUserId);

      return res.success(result, 'Your follow counts retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
