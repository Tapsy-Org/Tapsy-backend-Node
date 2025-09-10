import { NextFunction, Response } from 'express';

import { ReviewInteractionService } from '../services/ReviewInteraction.service';
import { AuthRequest } from '../types/express';
import AppError from '../utils/AppError';

const reviewInteractionService = new ReviewInteractionService();

export default class ReviewInteractionController {
  // Like/Unlike a review
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

      const result = await reviewInteractionService.toggleLike(reviewId, userId);

      return res.success(
        result,
        result.liked ? 'Review liked successfully' : 'Review unliked successfully',
      );
    } catch (error) {
      next(error);
    }
  }

  // Get all likes for a review
  static async getReviewLikes(req: AuthRequest, res: Response, next: NextFunction) {
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

      const result = await reviewInteractionService.getReviewLikes(filters);

      return res.success(result, 'Review likes fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  // Check if user has liked a review
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

      const result = await reviewInteractionService.checkUserLike(reviewId, userId);

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

      const result = await reviewInteractionService.addComment(commentData);

      return res.created(result, 'Comment added successfully');
    } catch (error) {
      next(error);
    }
  }

  // Get all comments for a review
  static async getReviewComments(req: AuthRequest, res: Response, next: NextFunction) {
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

      const result = await reviewInteractionService.getReviewComments(filters);

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

      const result = await reviewInteractionService.updateComment(
        commentId,
        userId,
        comment.trim(),
      );

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

      const result = await reviewInteractionService.deleteComment(commentId, userId);

      return res.success(result, 'Comment deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // Get comment replies
  static async getCommentReplies(req: AuthRequest, res: Response, next: NextFunction) {
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

      const result = await reviewInteractionService.getCommentReplies(filters);

      return res.success(result, 'Comment replies fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  // Reply to a comment (specific endpoint for replying)
  static async replyToComment(req: AuthRequest, res: Response, next: NextFunction) {
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

      const result = await reviewInteractionService.replyToComment(
        commentId,
        userId,
        comment.trim(),
      );

      return res.created(result, 'Reply added successfully');
    } catch (error) {
      next(error);
    }
  }

  // Get like count for a review
  static async getReviewLikeCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { reviewId } = req.params;

      if (!reviewId) {
        throw new AppError('Review ID is required', 400);
      }

      const result = await reviewInteractionService.getReviewLikeCount(reviewId);

      return res.success(result, 'Review like count fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  // Get comment count for a review (including replies)
  static async getReviewCommentCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { reviewId } = req.params;

      if (!reviewId) {
        throw new AppError('Review ID is required', 400);
      }

      const result = await reviewInteractionService.getReviewCommentCount(reviewId);

      return res.success(result, 'Review comment count fetched successfully');
    } catch (error) {
      next(error);
    }
  }
  // Increment view count for a review
  static async incrementView(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { reviewId } = req.params;

      if (!reviewId) {
        throw new AppError('Review ID is required', 400);
      }

      const result = await reviewInteractionService.incrementView(reviewId);

      return res.success(result, 'View count incremented successfully');
    } catch (error) {
      next(error);
    }
  }

  // Get view count for a review
  static async getReviewViewCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { reviewId } = req.params;

      if (!reviewId) {
        throw new AppError('Review ID is required', 400);
      }

      const result = await reviewInteractionService.getReviewViewCount(reviewId);

      return res.success(result, 'Review view count fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  // Get detailed view statistics for a review (optional: with user info if admin)
  static async getReviewViewStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { reviewId } = req.params;
      const { includeUserInfo = 'false' } = req.query;

      if (!reviewId) {
        throw new AppError('Review ID is required', 400);
      }

      const result = await reviewInteractionService.getReviewViewStats(
        reviewId,
        includeUserInfo === 'true',
      );

      return res.success(result, 'Review view statistics fetched successfully');
    } catch (error) {
      next(error);
    }
  }
}
