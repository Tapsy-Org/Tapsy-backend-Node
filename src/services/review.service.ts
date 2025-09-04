import type { Prisma, ReviewRating, Status } from '@prisma/client';

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

      // Determine status based on rating
      let status: Status;
      if (data.rating === 'ONE' || data.rating === 'TWO') {
        status = 'PENDING';
      } else {
        status = 'ACTIVE';
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
          status: status,
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
      status?: Status;
      page?: number;
      limit?: number;
      sortBy?: 'createdAt' | 'views' | 'rating';
      sortOrder?: 'asc' | 'desc';
      search?: string;
    } = {},
  ) {
    try {
      const { userId, businessId, rating, status, page = 1, limit = 10, search } = filters;
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

      // Filter by status - default to only show ACTIVE and PENDING reviews
      if (status) {
        where.status = status;
      } else {
        where.status = { in: ['ACTIVE', 'PENDING'] };
      }

      // Add search functionality
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { caption: { contains: search, mode: 'insensitive' } },
          { hashtags: { has: search } },
        ];
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
        where: {
          id: reviewId,
          status: { not: 'DELETED' },
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
        where: {
          id: reviewId,
          status: { not: 'DELETED' },
        },
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
        where: {
          id: reviewId,
          status: { not: 'DELETED' },
        },
        select: { userId: true },
      });

      if (!review) {
        throw new AppError('Review not found', 404);
      }

      if (review.userId !== userId) {
        throw new AppError('You can only delete your own reviews', 403);
      }

      // Soft delete by setting status to DELETED
      await prisma.review.update({
        where: { id: reviewId },
        data: { status: 'DELETED' },
      });

      return { message: 'Review deleted successfully' };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete review', 500, { originalError: error });
    }
  }

  // Method to update review status (useful for admin approval)
  async updateReviewStatus(reviewId: string, status: Status, adminUserId: string) {
    try {
      // Check if admin user exists and has appropriate permissions
      const adminUser = await prisma.user.findUnique({
        where: {
          id: adminUserId,
          status: 'ACTIVE',
          user_type: 'ADMIN', // Assuming you have ADMIN user type
        },
        select: { id: true },
      });

      if (!adminUser) {
        throw new AppError('Admin user not found or unauthorized', 403);
      }

      // Check if review exists
      const review = await prisma.review.findUnique({
        where: {
          id: reviewId,
          status: { not: 'DELETED' },
        },
        select: { id: true, status: true },
      });

      if (!review) {
        throw new AppError('Review not found', 404);
      }

      // Update review status
      const updatedReview = await prisma.review.update({
        where: { id: reviewId },
        data: { status },
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
        },
      });

      return updatedReview;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update review status', 500, { originalError: error });
    }
  }

  async getBusinessReviews(
    businessId: string,
    filters: {
      page?: number;
      limit?: number;
      status?: Status;
      sortBy?: 'createdAt' | 'views' | 'rating';
      sortOrder?: 'asc' | 'desc';
      search?: string;
    } = {},
  ) {
    try {
      const { page = 1, limit = 5, status, search } = filters;
      const skip = (page - 1) * limit;

      // Validate business exists
      const business = await prisma.user.findUnique({
        where: {
          id: businessId,
          status: 'ACTIVE',
          user_type: 'BUSINESS',
        },
        select: { id: true },
      });

      if (!business) {
        throw new AppError('Business not found or inactive', 404);
      }

      const where: Prisma.ReviewWhereInput = {
        businessId,
        status: status ? status : 'ACTIVE',
      };

      // Add search functionality
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { caption: { contains: search, mode: 'insensitive' } },
          { hashtags: { has: search } },
        ];
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
              },
            },
            business: {
              select: {
                id: true,
                username: true,
                logo_url: true,
                user_type: true,
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
      throw new AppError('Failed to fetch business reviews', 500, { originalError: error });
    }
  }
}
