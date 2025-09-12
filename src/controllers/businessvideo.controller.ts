import { Status } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';

import { BusinessVideoService } from '../services/businessvideo.service';
import { AuthRequest } from '../types/express';
import AppError from '../utils/AppError';
import { uploadFileToS3 } from '../utils/s3';
const businessVideoService = new BusinessVideoService();

export default class BusinessVideoController {
  static async createBusinessVideo(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.unauthorized('Business user not authenticated');
      }

      const { title, caption, hashtags } = req.body;

      // Validate required fields
      if (!title || !hashtags) {
        return res.fail('Title and hashtags are required', 400);
      }

      // Convert hashtags to array if it comes as comma-separated string
      const hashtagsArray = Array.isArray(hashtags)
        ? hashtags
        : hashtags.split(',').map((tag: string) => tag.trim());

      // Validate file
      if (!req.file) {
        return res.fail('Video file is required', 400);
      }

      const { buffer, originalname, mimetype } = req.file;

      // Upload file to S3
      const { publicUrl } = await uploadFileToS3(buffer, originalname, mimetype, 'gallery', userId);

      // Save record in DB
      await businessVideoService.createBusinessVideo({
        title,
        caption,
        hashtags: hashtagsArray,
        video_url: publicUrl,
        businessId: userId,
        status: Status.ACTIVE,
      });

      return res.created('Business video uploaded successfully');
    } catch (error) {
      console.error('Error creating business video:', error);
      return res.fail('Failed to create business video', 500);
    }
  }

  static async getBusinessVideoById(req: Request, res: Response, next: NextFunction) {
    try {
      const businessVideoId = req.params.id;
      const businessVideo = await businessVideoService.getBusinessVideoById(businessVideoId);
      res.success(businessVideo, 'Business video fetched successfully');
    } catch (error) {
      next(error);
    }
  }
  static async getAllBusinessVideosByBusinessId(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.params.businessId;

      // Default to 1 and 10 if missing or invalid
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;

      const hashtag = req.query.hashtag as string;

      const businessVideos = await businessVideoService.getVideosByBusinessId(
        businessId,
        page,
        limit,
        hashtag,
      );

      res.success(businessVideos, 'Business videos fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateBusinessVideo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const businessVideoId = req.params.id;
      const businessId = req.user?.userId;
      const updateData = req.body;

      if (!businessVideoId || !businessId || !updateData) {
        throw new AppError('Invalid request', 400);
      }

      // Validate status if provided
      if (updateData.status) {
        const validStatus = ['ACTIVE', 'INACTIVE', 'DELETED'];
        if (!validStatus.includes(updateData.status)) {
          throw new AppError('Invalid status value', 400);
        }
      }

      // Handle video file upload if provided
      if (req.file) {
        const { buffer, originalname, mimetype } = req.file;
        const { publicUrl } = await uploadFileToS3(
          buffer,
          originalname,
          mimetype,
          'gallery',
          businessId,
        );
        updateData.video_url = publicUrl;
      }

      // Convert hashtags string to array if necessary
      if (updateData.hashtags) {
        updateData.hashtags = Array.isArray(updateData.hashtags)
          ? updateData.hashtags
          : updateData.hashtags.split(',').map((tag: string) => tag.trim());
      }

      // Trim title and caption
      if (updateData.title) updateData.title = updateData.title.trim();
      if (updateData.caption) updateData.caption = updateData.caption.trim();

      // Call service to update
      const updatedBusinessVideo = await businessVideoService.updateBusinessVideo(
        businessVideoId,
        updateData,
        businessId,
      );

      res.success(updatedBusinessVideo, 'Business video updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteBusinessVideo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const businessVideoId = req.params.id;
      const { userId, user_type } = req.user!;

      await businessVideoService.deleteBusinessVideo(businessVideoId, userId, user_type);

      res.success('Business video deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
