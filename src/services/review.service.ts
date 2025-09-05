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

      // Build the complex query to get feed reviews
      const feedQuery = `
        WITH review_scores AS (
          SELECT 
            r.id,
            r."userId",
            r.rating,
            r.badges,
            r.caption,
            r.hashtags,
            r.title,
            r.video_url,
            r."businessId",
            r.views,
            r."createdAt",
            r.status,
            
            -- Social signals score (30% weight)
            CASE 
              WHEN r."userId" = ANY($1::uuid[]) THEN 100  -- From followed users
              ELSE 0 
            END as social_score,
            
            -- Category relevance score (25% weight)
            CASE 
              WHEN r."businessId" IS NOT NULL AND EXISTS (
                SELECT 1 FROM "UserCategory" uc 
                WHERE uc."userId" = r."businessId" 
                AND uc."categoryId" = ANY($2::uuid[])
              ) THEN 80
              ELSE 10
            END as category_score,
            
            -- Location proximity score (20% weight) - only if user location available
            CASE 
              WHEN $3::float IS NOT NULL AND $4::float IS NOT NULL AND r."businessId" IS NOT NULL THEN
                GREATEST(0, 100 - (
                  SELECT MIN(
                    SQRT(
                      POW(69.1 * (l.latitude - $3::float), 2) + 
                      POW(69.1 * ($4::float - l.longitude) * COS(l.latitude / 57.3), 2)
                    ) * 1.60934  -- Convert to km
                  ) 
                  FROM "Location" l 
                  WHERE l."userId" = r."businessId"
                ) * 2)  -- Scale distance impact
              ELSE 30  -- Default score when no location data
            END as location_score,
            
            -- Popularity/engagement score (15% weight)
            LEAST(100, (
              COALESCE(r.views, 0) * 0.1 + 
              COALESCE(like_count.count, 0) * 2 + 
              COALESCE(comment_count.count, 0) * 3
            )) as engagement_score,
            
            -- Freshness score (10% weight)
            CASE 
              WHEN r."createdAt" >= NOW() - INTERVAL '1 day' THEN 100
              WHEN r."createdAt" >= NOW() - INTERVAL '3 days' THEN 80
              WHEN r."createdAt" >= NOW() - INTERVAL '7 days' THEN 60
              WHEN r."createdAt" >= NOW() - INTERVAL '30 days' THEN 40
              ELSE 20
            END as freshness_score,
            
            like_count.count as likes_count,
            comment_count.count as comments_count
            
          FROM "Review" r
          LEFT JOIN (
            SELECT "reviewId", COUNT(*) as count 
            FROM "Like" 
            GROUP BY "reviewId"
          ) like_count ON r.id = like_count."reviewId"
          LEFT JOIN (
            SELECT "reviewId", COUNT(*) as count 
            FROM "Comment" 
            GROUP BY "reviewId"
          ) comment_count ON r.id = comment_count."reviewId"
          
          WHERE r.status = 'ACTIVE'
          AND r."userId" != $5::uuid  -- Exclude user's own reviews
          AND r.video_url IS NOT NULL  -- Only reviews with videos for TikTok-like experience
        ),
        scored_reviews AS (
          SELECT 
            *,
            -- Calculate final weighted score
            (
              social_score * 0.30 +
              category_score * 0.25 +
              location_score * 0.20 +
              engagement_score * 0.15 +
              freshness_score * 0.10
            ) as final_score
          FROM review_scores
        )
        SELECT * FROM scored_reviews
        ORDER BY 
          final_score DESC,
          "createdAt" DESC
        LIMIT $6 OFFSET $7
      `;

      // Execute the complex feed query
      const reviewsData = (await prisma.$queryRawUnsafe(
        feedQuery,
        followingUserIds,
        userCategoryIds,
        userLat,
        userLng,
        userId,
        limit,
        skip,
      )) as Array<{
        id: string;
        userId: string;
        rating: string;
        badges: string | null;
        caption: string | null;
        hashtags: string[];
        title: string | null;
        video_url: string | null;
        businessId: string | null;
        views: number;
        createdAt: Date;
        status: string;
        final_score: number;
      }>;

      // Get detailed review information with relations
      const reviewIds = reviewsData.map((r) => r.id);

      const detailedReviews = await prisma.review.findMany({
        where: {
          id: { in: reviewIds },
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
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });

      // Preserve the order from our scoring algorithm
      const orderedReviews = reviewIds
        .map((id) => detailedReviews.find((review) => review.id === id))
        .filter(Boolean);

      // Get total count for pagination
      const totalCountQuery = `
        SELECT COUNT(*) as total
        FROM "Review" r
        WHERE r.status = 'ACTIVE'
        AND r."userId" != $1::uuid
        AND r.video_url IS NOT NULL
      `;

      const totalResult = (await prisma.$queryRawUnsafe(totalCountQuery, userId)) as Array<{
        total: string;
      }>;
      const total = parseInt(totalResult[0]?.total || '0');

      return {
        reviews: orderedReviews,
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
