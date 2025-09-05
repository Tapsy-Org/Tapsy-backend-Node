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
              name: true,
              user_type: true,
              logo_url: true,
            },
          },
          business: data.businessId
            ? {
                select: {
                  id: true,
                  username: true,
                  name: true,
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
    } = {},
  ) {
    try {
      const { userId, businessId, rating, status, page = 1, limit = 10 } = filters;
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
            _count: {
              select: {
                likes: true,
                comments: true,
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
              name: true,
              user_type: true,
              logo_url: true,
            },
          },
          business: {
            select: {
              id: true,
              username: true,
              name: true,
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
              parent_comment_id: true,
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
              name: true,
              user_type: true,
              logo_url: true,
            },
          },
          business: {
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

      return updatedReview;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update review status', 500, { originalError: error });
    }
  }

  async getReviewFeed(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      latitude?: number;
      longitude?: number;
    } = {},
  ) {
    try {
      const { page = 1, limit = 10, latitude, longitude } = options;
      const skip = (page - 1) * limit;

      // Get user's profile and preferences
      const user = await prisma.user.findUnique({
        where: { id: userId, status: 'ACTIVE' },
        include: {
          categories: {
            include: {
              category: true,
            },
          },
          following: {
            select: {
              followingUserId: true,
            },
          },
          locations: {
            select: {
              latitude: true,
              longitude: true,
            },
            orderBy: {
              updatedAt: 'desc',
            },
            take: 1,
          },
        },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Use provided coordinates or user's saved location
      const userLat = latitude || user.locations[0]?.latitude;
      const userLng = longitude || user.locations[0]?.longitude;

      // Get user's interested category IDs
      const userCategoryIds = user.categories.map((uc) => uc.categoryId);

      // Get followed users IDs
      const followingUserIds = user.following.map((f) => f.followingUserId);

      // Fast algorithm using Prisma with computed scoring
      // Step 1: Get base reviews with all needed data
      const baseReviews = await prisma.review.findMany({
        where: {
          status: 'ACTIVE',
          userId: { not: userId },
          video_url: { not: null },
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
          business: {
            select: {
              id: true,
              username: true,
              name: true,
              user_type: true,
              logo_url: true,
              categories: {
                select: {
                  categoryId: true,
                },
              },
              locations: {
                select: {
                  latitude: true,
                  longitude: true,
                },
                take: 1,
              },
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        take: limit * 3, // Get more than needed for better algorithm results
        orderBy: [
          { createdAt: 'desc' }, // Start with recent content
          { views: 'desc' }, // Then by popularity
        ],
      });

      // Filter out any reviews with invalid IDs to prevent UUID errors (defensive programming)
      const validReviews = baseReviews.filter((review) => {
        const hasValidId = review.id && typeof review.id === 'string' && review.id.length === 36;
        const hasValidUserId =
          review.userId && typeof review.userId === 'string' && review.userId.length === 36;
        return hasValidId && hasValidUserId;
      });

      // Step 2: Calculate scores for each review
      const scoredReviews = validReviews.map((review) => {
        // Social signals score (30% weight)
        const socialScore = followingUserIds.includes(review.userId) ? 100 : 0;

        // Category relevance score (25% weight)
        let categoryScore = 10; // default
        if (review.business?.categories) {
          const businessCategoryIds = review.business.categories.map((cat) => cat.categoryId);
          const hasMatchingCategory = businessCategoryIds.some((catId) =>
            userCategoryIds.includes(catId),
          );
          if (hasMatchingCategory) {
            categoryScore = 80;
          }
        }

        // Location proximity score (20% weight)
        let locationScore = 30; // default
        if (userLat && userLng && review.business?.locations?.[0]) {
          const businessLat = review.business.locations[0].latitude;
          const businessLng = review.business.locations[0].longitude;

          // Calculate distance using Haversine formula (in km)
          const distance =
            Math.sqrt(
              Math.pow(69.1 * (businessLat - userLat), 2) +
                Math.pow(69.1 * (userLng - businessLng) * Math.cos(businessLat / 57.3), 2),
            ) * 1.60934;

          locationScore = Math.max(0, 100 - distance * 2);
        }

        // Popularity/engagement score (15% weight)
        const engagementScore = Math.min(
          100,
          (review.views || 0) * 0.1 + review._count.likes * 2 + review._count.comments * 3,
        );

        // Freshness score (10% weight)
        const now = new Date();
        const reviewDate = new Date(review.createdAt);
        const hoursSinceCreation = (now.getTime() - reviewDate.getTime()) / (1000 * 60 * 60);

        let freshnessScore = 20; // default for old content
        if (hoursSinceCreation <= 24) freshnessScore = 100;
        else if (hoursSinceCreation <= 72) freshnessScore = 80;
        else if (hoursSinceCreation <= 168) freshnessScore = 60;
        else if (hoursSinceCreation <= 720) freshnessScore = 40;

        // Calculate final weighted score
        const finalScore =
          socialScore * 0.3 +
          categoryScore * 0.25 +
          locationScore * 0.2 +
          engagementScore * 0.15 +
          freshnessScore * 0.1;

        return {
          ...review,
          finalScore,
        };
      });

      // Step 3: Sort by final score and apply pagination
      const sortedReviews = scoredReviews
        .sort((a, b) => {
          if (b.finalScore !== a.finalScore) {
            return b.finalScore - a.finalScore;
          }
          // Tie-breaker: more recent content wins
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
        .slice(skip, skip + limit);

      // Step 4: Clean up the response (remove scoring metadata)
      const reviews = sortedReviews.map(({ finalScore: _finalScore, ...review }) => review);

      // Step 5: Get total count for pagination
      const total = await prisma.review.count({
        where: {
          status: 'ACTIVE',
          userId: { not: userId },
          video_url: { not: null },
        },
      });

      return {
        reviews,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        algorithm_info: {
          user_following_count: followingUserIds.length,
          user_categories_count: userCategoryIds.length,
          location_based: !!(userLat && userLng),
          algorithm_version: 'fast_prisma_v1',
          note: 'TikTok-style personalized feed with full scoring algorithm',
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch review feed', 500, { originalError: error });
    }
  }
}
