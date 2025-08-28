import type { Prisma, ReviewRating } from '@prisma/client';

import prisma from '../config/db';
import AppError from '../utils/AppError';

export class ReviewService {
  async createReview(data: {
    userId: string;
    rating: ReviewRating;
    badges?: string;
    caption?: string;
    hashtags?: string[];
    title?: string;
    video_url?: string;
    businessId?: string;
  }) {
    try {
      // Validate required fields
      if (!data.userId || !data.rating) {
        throw new AppError('User ID and rating are required', 400);
      }

      // Validate rating enum
      const validRatings = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'];
      if (!validRatings.includes(data.rating)) {
        throw new AppError('Invalid rating value', 400);
      }

      // Check if user exists and is active
      const user = await prisma.user.findUnique({
        where: { id: data.userId, status: 'ACTIVE' },
        select: { id: true, user_type: true },
      });

      if (!user) {
        throw new AppError('User not found or inactive', 404);
      }

      // If businessId is provided, validate it exists
      if (data.businessId) {
        const business = await prisma.user.findUnique({
          where: { id: data.businessId, status: 'ACTIVE', user_type: 'BUSINESS' },
          select: { id: true },
        });

        if (!business) {
          throw new AppError('Business not found or inactive', 404);
        }
      }

      // Create the review
      const review = await prisma.review.create({
        data: {
          userId: data.userId,
          rating: data.rating,
          badges: data.badges,
          caption: data.caption,
          hashtags: data.hashtags || [],
          title: data.title,
          video_url: data.video_url,
          businessId: data.businessId,
          views: 0,
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
          business: data.businessId
            ? {
                select: {
                  id: true,
                  username: true,
                  user_type: true,
                  logo_url: true,
                },
              }
            : undefined,
        },
      });

      return review;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create review', 500, { originalError: error });
    }
  }

  async getReviews(
    filters: {
      userId?: string;
      businessId?: string;
      rating?: ReviewRating;
      page?: number;
      limit?: number;
    } = {},
  ) {
    try {
      const { userId, businessId, rating, page = 1, limit = 10 } = filters;
      const skip = (page - 1) * limit;

      const where: Prisma.ReviewWhereInput = {};

      if (userId) {
        where.userId = userId;
      }

      if (businessId) {
        where.businessId = businessId;
      }

      if (rating) {
        where.rating = rating;
      }

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                user_type: true,
                logo_url: true,
              },
            },
            business: {
              select: {
                id: true,
                username: true,
                user_type: true,
                logo_url: true,
              },
            },
            likes: {
              select: {
                id: true,
                userId: true,
              },
            },
            comments: {
              select: {
                id: true,
                comment: true,
                createdAt: true,
                user: {
                  select: {
                    id: true,
                    username: true,
                    logo_url: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.review.count({ where }),
      ]);

      return {
        reviews,
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
      throw new AppError('Failed to fetch reviews', 500, { originalError: error });
    }
  }

  async getReviewById(reviewId: string) {
    try {
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              user_type: true,
              logo_url: true,
            },
          },
          business: {
            select: {
              id: true,
              username: true,
              user_type: true,
              logo_url: true,
            },
          },
          likes: {
            select: {
              id: true,
              userId: true,
            },
          },
          comments: {
            select: {
              id: true,
              comment: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  logo_url: true,
                },
              },
            },
          },
        },
      });

      if (!review) {
        throw new AppError('Review not found', 404);
      }

      return review;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch review', 500, { originalError: error });
    }
  }

  async updateReviewViews(reviewId: string) {
    try {
      const review = await prisma.review.update({
        where: { id: reviewId },
        data: {
          views: {
            increment: 1,
          },
        },
      });

      return review;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update review views', 500, { originalError: error });
    }
  }

  async deleteReview(reviewId: string, userId: string) {
    try {
      // Check if review exists and belongs to user
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
        select: { userId: true },
      });

      if (!review) {
        throw new AppError('Review not found', 404);
      }

      if (review.userId !== userId) {
        throw new AppError('You can only delete your own reviews', 403);
      }

      // Delete related records first (likes, comments)
      await prisma.$transaction([
        prisma.like.deleteMany({ where: { reviewId } }),
        prisma.comment.deleteMany({ where: { reviewId } }),
        prisma.review.delete({ where: { id: reviewId } }),
      ]);

      return { message: 'Review deleted successfully' };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete review', 500, { originalError: error });
    }
  }
}
