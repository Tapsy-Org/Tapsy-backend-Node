import type { Prisma, ReviewRating, Status } from '@prisma/client';

import prisma from '../config/db';
import AppError from '../utils/AppError';
import { RedisService } from './redis.service';

export class ReviewService {
  private redisService: RedisService;

  constructor() {
    this.redisService = new RedisService();
  }
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

  async getReviewFeed(
    userId: string,
    options: {
      cursor?: string;
      limit?: number;
      latitude?: number;
      longitude?: number;
    } = {},
  ) {
    try {
      const { cursor, limit = 10, latitude, longitude } = options;

      // --- User and Preference fetching ---
      const user = await prisma.user.findUnique({
        where: { id: userId, status: 'ACTIVE' },
        include: {
          categories: { include: { category: true } },
          following: { select: { followingUserId: true } },
          locations: {
            select: { latitude: true, longitude: true },
            orderBy: { updatedAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!user) throw new AppError('User not found', 404);

      const userLat = latitude || user.locations[0]?.latitude;
      const userLng = longitude || user.locations[0]?.longitude;

      const userCategoryIds = user.categories.map((uc) => uc.categoryId);
      const followingUserIds = user.following.map((f) => f.followingUserId);

      const seenReviewIds = await this.redisService.getSeenReviewIds(userId);

      const baseReviews = await prisma.review.findMany({
        where: {
          status: 'ACTIVE',
          userId: { not: userId },
          video_url: { not: null },
          id: { notIn: seenReviewIds.length > 0 ? seenReviewIds : [] },
        },
        include: {
          user: {
            select: { id: true, username: true, name: true, user_type: true, logo_url: true },
          },
          business: {
            select: {
              id: true,
              username: true,
              name: true,
              user_type: true,
              logo_url: true,
              categories: { select: { categoryId: true } },
              locations: { select: { latitude: true, longitude: true }, take: 1 },
            },
          },
          _count: { select: { likes: true, comments: true } },
        },
        take: 100, // Fetch a larger candidate pool for better scoring
        orderBy: [{ createdAt: 'desc' }],
      });

      // --- Full Scoring Logic ---
      const scoredReviews = baseReviews.map((review) => {
        // Social signals score (30% weight)
        const socialScore = followingUserIds.includes(review.userId) ? 100 : 0;

        // Category relevance score (25% weight)
        let categoryScore = 10;
        if (review.business?.categories) {
          const businessCategoryIds = review.business.categories.map((cat) => cat.categoryId);
          const hasMatchingCategory = businessCategoryIds.some((catId) =>
            userCategoryIds.includes(catId),
          );
          if (hasMatchingCategory) {
            categoryScore = 80;
          }
        }

        // Location Proximity Score (20% weight) ---
        let locationScore = 30; // Default score
        if (userLat && userLng && review.business?.locations?.[0]) {
          const businessLat = review.business.locations[0].latitude;
          const businessLng = review.business.locations[0].longitude;
          const distance =
            Math.sqrt(
              Math.pow(69.1 * (businessLat - userLat), 2) +
                Math.pow(69.1 * (userLng - businessLng) * Math.cos(businessLat / 57.3), 2),
            ) * 1.60934;
          locationScore = Math.max(0, 100 - distance * 2);
        }
        // --- END OF ADDED SECTION ---

        // Popularity/Engagement Score (15% weight) ---
        const engagementScore = Math.min(
          100,
          (review.views || 0) * 0.1 + review._count.likes * 2 + review._count.comments * 3,
        );
        // --- END OF ADDED SECTION ---

        // Freshness Score (10% weight) ---
        const now = new Date();
        const reviewDate = new Date(review.createdAt);
        const hoursSinceCreation = (now.getTime() - reviewDate.getTime()) / (1000 * 60 * 60);
        let freshnessScore = 20; // Default for old content
        if (hoursSinceCreation <= 24) freshnessScore = 100;
        else if (hoursSinceCreation <= 72) freshnessScore = 80;
        else if (hoursSinceCreation <= 168) freshnessScore = 60;
        else if (hoursSinceCreation <= 720) freshnessScore = 40;
        // --- END OF ADDED SECTION ---

        // Calculate final weighted score with ALL components
        const finalScore =
          socialScore * 0.3 +
          categoryScore * 0.25 +
          locationScore * 0.2 +
          engagementScore * 0.15 +
          freshnessScore * 0.1;

        return { ...review, finalScore };
      });

      // --- Sorting and Cursor Logic (Using the more efficient findIndex/slice method) ---
      const sortedReviews = scoredReviews.sort((a, b) => {
        if (b.finalScore !== a.finalScore) {
          return b.finalScore - a.finalScore;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      let startIndex = 0;
      if (cursor) {
        const decodedCursor = Buffer.from(cursor, 'base64').toString('ascii');
        const [cursorScore, cursorCreatedAt] = decodedCursor.split('_');
        const score = parseFloat(cursorScore);
        const date = new Date(cursorCreatedAt);
        const cursorIndex = sortedReviews.findIndex(
          (review) => review.finalScore === score && review.createdAt.getTime() === date.getTime(),
        );
        if (cursorIndex !== -1) {
          startIndex = cursorIndex + 1;
        }
      }

      const reviews = sortedReviews.slice(startIndex, startIndex + limit);

      let nextCursor: string | null = null;
      if (reviews.length === limit) {
        const lastReview = reviews[reviews.length - 1];
        if (lastReview) {
          const cursorPayload = `${lastReview.finalScore}_${lastReview.createdAt.toISOString()}`;
          nextCursor = Buffer.from(cursorPayload).toString('base64');
        }
      }

      return {
        reviews,
        pagination: {
          nextCursor,
          hasNextPage: !!nextCursor,
        },
        algorithm_info: {
          user_following_count: followingUserIds.length,
          user_categories_count: userCategoryIds.length,
          location_based: !!(userLat && userLng),
          seen_reviews_excluded: seenReviewIds.length,
          algorithm_version: 'Tapsy-Algorithm-V1.0',
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch review feed', 500, { originalError: error });
    }
  }

  // Mark review as seen and increment view count
  async markReviewAsSeenAndIncrementView(userId: string, reviewId: string) {
    try {
      // Import services here to avoid circular dependency
      const { RedisService } = await import('./redis.service');
      const { ReviewInteractionService } = await import('./ReviewInteraction.service');

      const redisService = new RedisService();
      const reviewInteractionService = new ReviewInteractionService();

      // Mark review as seen in Redis
      await redisService.markReviewAsSeen(userId, reviewId);

      // Increment view count using existing service
      const viewResult = await reviewInteractionService.incrementView(reviewId);

      return {
        reviewId: viewResult.reviewId,
        viewCount: viewResult.viewCount,
        userId,
        message: 'Review marked as seen and view count incremented successfully',
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to mark review as seen and increment view', 500, {
        originalError: error,
      });
    }
  }
}
