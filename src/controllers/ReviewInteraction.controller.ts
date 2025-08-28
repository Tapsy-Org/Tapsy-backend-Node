import { NextFunction, Request, Response } from 'express';

import { InteractionService } from '../services/ReviewInteraction.service';
import { AuthRequest } from '../types/express';
import AppError from '../utils/AppError';

const interactionService = new InteractionService();

export default class InteractionController {
  static async toggleLike(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { reviewId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      if (!reviewId) {
        throw new AppError('Review ID is required', 400);
      }

      const result = await interactionService.toggleLike(reviewId, userId);

      return res.success(
        result,
        result.liked ? 'Review liked successfully' : 'Review unliked successfully',
      );
    } catch (error) {
      next(error);
    }
  }

  static async getReviewLikes(req: Request, res: Response, next: NextFunction) {
    try {
      const { reviewId } = req.params;
      const { page = '1', limit = '20' } = req.query;

      if (!reviewId) {
        throw new AppError('Review ID is required', 400);
      }

      const filters = {
        reviewId,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
      };

      const result = await interactionService.getReviewLikes(filters);

      return res.success(result, 'Review likes fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  static async checkUserLike(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { reviewId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      if (!reviewId) {
        throw new AppError('Review ID is required', 400);
      }

      const result = await interactionService.checkUserLike(reviewId, userId);

      return res.success(result, 'User like status checked successfully');
    } catch (error) {
      next(error);
    }
  }

  // Add comment to a review
  static async addComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { reviewId } = req.params;
      const { comment, parentCommentId } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      if (!reviewId) {
        throw new AppError('Review ID is required', 400);
      }

      if (!comment || comment.trim().length === 0) {
        throw new AppError('Comment text is required', 400);
      }

      const commentData = {
        reviewId,
        userId,
        comment: comment.trim(),
        parentCommentId: parentCommentId || null,
      };

      const result = await interactionService.addComment(commentData);

      return res.created(result, 'Comment added successfully');
    } catch (error) {
      next(error);
    }
  }

  // Get all comments for a review
  static async getReviewComments(req: Request, res: Response, next: NextFunction) {
    try {
      const { reviewId } = req.params;
      const { page = '1', limit = '20' } = req.query;

      if (!reviewId) {
        throw new AppError('Review ID is required', 400);
      }

      const filters = {
        reviewId,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
      };

      const result = await interactionService.getReviewComments(filters);

      return res.success(result, 'Review comments fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  // Update a comment
  static async updateComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.params;
      const { comment } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      if (!commentId) {
        throw new AppError('Comment ID is required', 400);
      }

      if (!comment || comment.trim().length === 0) {
        throw new AppError('Comment text is required', 400);
      }

      const result = await interactionService.updateComment(commentId, userId, comment.trim());

      return res.success(result, 'Comment updated successfully');
    } catch (error) {
      next(error);
    }
  }

  // Delete a comment
  static async deleteComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      if (!commentId) {
        throw new AppError('Comment ID is required', 400);
      }

      const result = await interactionService.deleteComment(commentId, userId);

      return res.success(result, 'Comment deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // Get comment replies
  static async getCommentReplies(req: Request, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.params;
      const { page = '1', limit = '20' } = req.query;

      if (!commentId) {
        throw new AppError('Comment ID is required', 400);
      }

      const filters = {
        commentId,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
      };

      const result = await interactionService.getCommentReplies(filters);

      return res.success(result, 'Comment replies fetched successfully');
    } catch (error) {
      next(error);
    }
  }
}
