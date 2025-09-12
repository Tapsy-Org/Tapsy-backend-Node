import { Status } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';

import { BusinessVideoService } from '../services/businessvideo.service';
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

  static async updateBusinessVideo(req: Request, res: Response) {
    const businessVideo = await businessVideoService.updateBusinessVideo(req.params.id, req.body);
    res.status(200).json(businessVideo);
  }

  static async deleteBusinessVideo(req: Request, res: Response) {
    const businessVideo = await businessVideoService.deleteBusinessVideo(req.params.id);
    res.status(200).json(businessVideo);
  }
}
