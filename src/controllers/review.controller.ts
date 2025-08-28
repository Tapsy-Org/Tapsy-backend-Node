import { ReviewRating } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';

import { ReviewService } from '../services/review.service';
import { AuthRequest } from '../types/express';
import AppError from '../utils/AppError';
import { uploadFileToS3 } from '../utils/s3';

const reviewService = new ReviewService();

export default class ReviewController {
  static async createReview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { rating, badges, caption, hashtags, title, businessId } = req.body;

      // Debug logging
      console.log('Received form data:', {
        rating,
        badges,
        caption,
        hashtags,
        title,
        businessId,
        hashtagsType: typeof hashtags,
        hashtagsIsArray: Array.isArray(hashtags),
        fileReceived: !!req.file,
        fileSize: req.file?.size,
        fileMimeType: req.file?.mimetype,
      });

      // Get user ID from authenticated request
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      // Validate required fields
      if (!rating) {
        throw new AppError('Rating is required', 400);
      }

      // Validate rating enum
      const validRatings = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'];
      if (!validRatings.includes(rating)) {
        throw new AppError('Invalid rating value. Must be ONE, TWO, THREE, FOUR, or FIVE', 400);
      }

      // Parse and validate hashtags
      let parsedHashtags: string[] = [];
      if (hashtags) {
        try {
          if (typeof hashtags === 'string') {
            // Check if it's a JSON array string first
            if (hashtags.trim().startsWith('[') && hashtags.trim().endsWith(']')) {
              parsedHashtags = JSON.parse(hashtags);
            } else if (hashtags.includes(',')) {
              // Handle comma-separated hashtags
              parsedHashtags = hashtags
                .split(',')
                .map((tag) => tag.trim())
                .filter((tag) => tag.length > 0);
            } else {
              // Single hashtag
              parsedHashtags = [hashtags.trim()];
            }
          } else if (Array.isArray(hashtags)) {
            parsedHashtags = hashtags;
          } else {
            throw new AppError(
              'Hashtags must be a valid JSON array, comma-separated string, or array',
              400,
            );
          }
          // Validate that parsed result is an array
          if (!Array.isArray(parsedHashtags)) {
            throw new AppError('Hashtags must be an array', 400);
          }
          // Validate each hashtag is a string and not empty
          if (!parsedHashtags.every((tag) => typeof tag === 'string' && tag.trim().length > 0)) {
            throw new AppError('All hashtags must be non-empty strings', 400);
          }
          // Clean hashtags (ensure they start with # if not already)
          parsedHashtags = parsedHashtags.map((tag) => {
            const cleanTag = tag.trim();
            return cleanTag.startsWith('#') ? cleanTag : `#${cleanTag}`;
          });
        } catch (parseError) {
          if (parseError instanceof AppError) {
            throw parseError;
          }
          throw new AppError(
            'Invalid hashtags format. Must be a valid JSON array, comma-separated string, or array',
            400,
          );
        }
      }

      // Validate businessId format if provided
      if (businessId && typeof businessId === 'string') {
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(businessId)) {
          throw new AppError('Invalid business ID format. Must be a valid UUID', 400);
        }
      }

      // Process video upload if provided
      let video_url: string | undefined;
      if (req.file) {
        try {
          // Validate AWS environment variables
          if (
            !process.env.AWS_REGION ||
            !process.env.AWS_ACCESS_KEY_ID ||
            !process.env.AWS_SECRET_ACCESS_KEY ||
            !process.env.AWS_BUCKET_NAME
          ) {
            throw new AppError(
              'AWS configuration is incomplete. Please check environment variables.',
              500,
            );
          }

          // Generate unique filename
          const timestamp = Date.now();
          const originalName = req.file.originalname;
          const fileExtension = originalName.split('.').pop();
          const fileName = `review-${timestamp}.${fileExtension}`;

          // Upload directly to S3
          const { publicUrl } = await uploadFileToS3(
            req.file.buffer,
            fileName,
            req.file.mimetype,
            'review',
            userId,
          );

          video_url = publicUrl;
          console.log('Video uploaded successfully:', { fileName, publicUrl });
        } catch (uploadError) {
          console.error('Video upload error:', uploadError);
          throw new AppError('Failed to process video upload', 500, { originalError: uploadError });
        }
      }

      // Create review data
      const reviewData = {
        userId,
        rating,
        badges: badges || null,
        caption: caption || null,
        hashtags: parsedHashtags,
        title: title || null,
        video_url,
        businessId: businessId || null,
      };

      // Create the review
      const review = await reviewService.createReview(reviewData);

      // Return only id and video_url
      const responseData = {
        id: review.id,
        video_url: review.video_url,
      };

      return res.created(responseData, 'Review created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, businessId, rating, page = '1', limit = '10' } = req.query;

      const filters = {
        userId: userId as string,
        businessId: businessId as string,
        rating: rating as ReviewRating,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
      };

      const result = await reviewService.getReviews(filters);

      return res.success(result, 'Reviews fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getReviewById(req: Request, res: Response, next: NextFunction) {
    try {
      const { reviewId } = req.params;

      if (!reviewId) {
        throw new AppError('Review ID is required', 400);
      }

      const review = await reviewService.getReviewById(reviewId);

      // Update view count
      await reviewService.updateReviewViews(reviewId);

      return res.success({ review }, 'Review fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteReview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { reviewId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      if (!reviewId) {
        throw new AppError('Review ID is required', 400);
      }

      const result = await reviewService.deleteReview(reviewId, userId);

      return res.success(result, 'Review deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getMyReviews(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { page = '1', limit = '10' } = req.query;

      const filters = {
        userId,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
      };

      const result = await reviewService.getReviews(filters);

      return res.success(result, 'Your reviews fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateReviewStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { reviewId } = req.params;
      const { status } = req.body;
      const adminUserId = req.user?.userId;

      if (!adminUserId) {
        throw new AppError('User not authenticated', 401);
      }

      if (!reviewId) {
        throw new AppError('Review ID is required', 400);
      }

      if (!status) {
        throw new AppError('Status is required', 400);
      }

      // Validate status enum
      const validStatuses = ['ACTIVE', 'PENDING', 'INACTIVE'];
      if (!validStatuses.includes(status)) {
        throw new AppError('Invalid status value. Must be ACTIVE, PENDING, or INACTIVE', 400);
      }

      const updatedReview = await reviewService.updateReviewStatus(reviewId, status, adminUserId);

      return res.success(updatedReview, 'Review status updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
