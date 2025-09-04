import prisma from '../config/db';
import AppError from '../utils/AppError';

export class ReviewInteractionService {
  // Toggle like/unlike for a review
  async toggleLike(reviewId: string, userId: string) {
    try {
      // Check if review exists and is active
      const review = await prisma.review.findUnique({
        where: {
          id: reviewId,
          status: { not: 'DELETED' },
        },
        select: { id: true },
      });

      if (!review) {
        throw new AppError('Review not found', 404);
      }

      // Check if user exists and is active
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
          status: 'ACTIVE',
        },
        select: { id: true },
      });

      if (!user) {
        throw new AppError('User not found or inactive', 404);
      }

      // Check if like already exists
      const existingLike = await prisma.like.findFirst({
        where: {
          userId,
          reviewId,
        },
      });

      if (existingLike) {
        // Unlike: remove the like
        await prisma.like.delete({
          where: {
            id: existingLike.id,
          },
        });

        return { liked: false, message: 'Review unliked successfully' };
      } else {
        // Like: create new like
        await prisma.like.create({
          data: {
            userId,
            reviewId,
          },
        });

        return { liked: true, message: 'Review liked successfully' };
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to toggle like', 500, { originalError: error });
    }
  }

  // Get all likes for a review with user details
  async getReviewLikes(filters: { reviewId: string; page?: number; limit?: number }) {
    try {
      const { reviewId, page = 1, limit = 20 } = filters;
      const skip = (page - 1) * limit;

      // Check if review exists
      const review = await prisma.review.findUnique({
        where: {
          id: reviewId,
          status: { not: 'DELETED' },
        },
        select: { id: true },
      });

      if (!review) {
        throw new AppError('Review not found', 404);
      }

      const [likes, total] = await Promise.all([
        prisma.like.findMany({
          where: { reviewId },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                user_type: true,
                logo_url: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.like.count({ where: { reviewId } }),
      ]);

      return {
        likes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch review likes', 500, { originalError: error });
    }
  }

  // Check if user has liked a review
  async checkUserLike(reviewId: string, userId: string) {
    try {
      const like = await prisma.like.findFirst({
        where: {
          userId,
          reviewId,
        },
        select: { id: true, createdAt: true },
      });

      return {
        hasLiked: !!like,
        likedAt: like?.createdAt || null,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to check user like', 500, { originalError: error });
    }
  }

  // Add comment to a review
  async addComment(data: {
    reviewId: string;
    userId: string;
    comment: string;
    parentCommentId?: string | null;
  }) {
    try {
      const { reviewId, userId, comment, parentCommentId } = data;

      // Check if review exists and is active
      const review = await prisma.review.findUnique({
        where: {
          id: reviewId,
          status: { not: 'DELETED' },
        },
        select: { id: true },
      });

      if (!review) {
        throw new AppError('Review not found', 404);
      }

      // Check if user exists and is active
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
          status: 'ACTIVE',
        },
        select: { id: true },
      });

      if (!user) {
        throw new AppError('User not found or inactive', 404);
      }

      // If parent comment is provided, validate it exists and belongs to the same review
      if (parentCommentId) {
        const parentComment = await prisma.comment.findUnique({
          where: {
            id: parentCommentId,
            reviewId,
          },
          select: { id: true },
        });

        if (!parentComment) {
          throw new AppError('Parent comment not found or does not belong to this review', 404);
        }
      }

      const newComment = await prisma.comment.create({
        data: {
          reviewId,
          userId,
          comment,
          parent_comment_id: parentCommentId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              user_type: true,
              logo_url: true,
            },
          },
        },
      });

      return newComment;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to add comment', 500, { originalError: error });
    }
  }

  // Reply to a specific comment (dedicated method for replies)
  async replyToComment(commentId: string, userId: string, comment: string) {
    try {
      // Check if parent comment exists
      const parentComment = await prisma.comment.findUnique({
        where: {
          id: commentId,
        },
        select: { id: true, reviewId: true },
      });

      if (!parentComment) {
        throw new AppError('Parent comment not found', 404);
      }

      // Check if user exists and is active
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
          status: 'ACTIVE',
        },
        select: { id: true },
      });

      if (!user) {
        throw new AppError('User not found or inactive', 404);
      }

      // Create the reply
      const reply = await prisma.comment.create({
        data: {
          reviewId: parentComment.reviewId,
          userId,
          comment,
          parent_comment_id: commentId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              user_type: true,
              logo_url: true,
            },
          },
        },
      });

      return reply;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to add reply', 500, { originalError: error });
    }
  }

  // Get all comments for a review
  async getReviewComments(filters: { reviewId: string; page?: number; limit?: number }) {
    try {
      const { reviewId, page = 1, limit = 20 } = filters;
      const skip = (page - 1) * limit;

      // Check if review exists
      const review = await prisma.review.findUnique({
        where: {
          id: reviewId,
          status: { not: 'DELETED' },
        },
        select: { id: true },
      });

      if (!review) {
        throw new AppError('Review not found', 404);
      }

      const [comments, total] = await Promise.all([
        prisma.comment.findMany({
          where: {
            reviewId,
            parent_comment_id: null, // Only top-level comments
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                user_type: true,
                logo_url: true,
              },
            },
            replies: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    user_type: true,
                    logo_url: true,
                  },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.comment.count({
          where: {
            reviewId,
            parent_comment_id: null,
          },
        }),
      ]);

      return {
        comments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch review comments', 500, { originalError: error });
    }
  }

  // Update a comment
  async updateComment(commentId: string, userId: string, newComment: string) {
    try {
      // Check if comment exists and belongs to user
      const comment = await prisma.comment.findUnique({
        where: {
          id: commentId,
          userId,
        },
        select: { id: true, comment: true },
      });

      if (!comment) {
        throw new AppError('Comment not found or you are not authorized to edit it', 404);
      }

      const updatedComment = await prisma.comment.update({
        where: { id: commentId },
        data: { comment: newComment },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              user_type: true,
              logo_url: true,
            },
          },
        },
      });

      return updatedComment;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update comment', 500, { originalError: error });
    }
  }

  // Delete a comment
  async deleteComment(commentId: string, userId: string) {
    try {
      // Check if comment exists and belongs to user
      const comment = await prisma.comment.findUnique({
        where: {
          id: commentId,
          userId,
        },
        select: { id: true },
      });

      if (!comment) {
        throw new AppError('Comment not found or you are not authorized to delete it', 404);
      }

      // Delete the comment and all its replies
      await prisma.comment.deleteMany({
        where: {
          OR: [{ id: commentId }, { parent_comment_id: commentId }],
        },
      });

      return { message: 'Comment and replies deleted successfully' };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete comment', 500, { originalError: error });
    }
  }

  // Get comment replies
  async getCommentReplies(filters: { commentId: string; page?: number; limit?: number }) {
    try {
      const { commentId, page = 1, limit = 20 } = filters;
      const skip = (page - 1) * limit;

      // Check if parent comment exists
      const parentComment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: { id: true },
      });

      if (!parentComment) {
        throw new AppError('Parent comment not found', 404);
      }

      const [replies, total] = await Promise.all([
        prisma.comment.findMany({
          where: { parent_comment_id: commentId },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                user_type: true,
                logo_url: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
          skip,
          take: limit,
        }),
        prisma.comment.count({
          where: { parent_comment_id: commentId },
        }),
      ]);

      return {
        replies,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch comment replies', 500, { originalError: error });
    }
  }

  // Get like count for a review
  async getReviewLikeCount(reviewId: string) {
    try {
      // Check if review exists
      const review = await prisma.review.findUnique({
        where: {
          id: reviewId,
          status: { not: 'DELETED' },
        },
        select: { id: true },
      });

      if (!review) {
        throw new AppError('Review not found', 404);
      }

      const likeCount = await prisma.like.count({
        where: { reviewId },
      });

      return { likeCount };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch review like count', 500, { originalError: error });
    }
  }

  // Get comment count for a review (including replies)
  async getReviewCommentCount(reviewId: string) {
    try {
      // Check if review exists
      const review = await prisma.review.findUnique({
        where: {
          id: reviewId,
          status: { not: 'DELETED' },
        },
        select: { id: true },
      });

      if (!review) {
        throw new AppError('Review not found', 404);
      }

      const commentCount = await prisma.comment.count({
        where: { reviewId },
      });

      return { commentCount };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch review comment count', 500, { originalError: error });
    }
  }
}
