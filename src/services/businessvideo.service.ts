import { BusinessVideo, Prisma, Status } from '@prisma/client';

import prisma from '../config/db';
import AppError from '../utils/AppError';

export class BusinessVideoService {
  async createBusinessVideo(data: {
    businessId: string;
    title: string;
    caption?: string;
    hashtags: string[];
    status: Status;
    video_url: string;
  }): Promise<BusinessVideo> {
    return await prisma.businessVideo.create({
      data,
    });
  }

  async getBusinessVideoById(id: string) {
    return await prisma.businessVideo.findUnique({
      where: { id },
    });
  }

  async getVideosByBusinessId(businessId: string, page: number, limit: number, hashtag?: string) {
    const skip = (page - 1) * limit;

    const where: Prisma.BusinessVideoWhereInput = {
      businessId,
      status: Status.ACTIVE,
    };

    if (hashtag) {
      where.hashtags = { has: hashtag };
    }

    const [videos, total] = await Promise.all([
      prisma.businessVideo.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.businessVideo.count({ where }),
    ]);

    return {
      videos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateBusinessVideo(id: string, updateData: Partial<BusinessVideo>, businessId: string) {
    const existingBusinessVideo = await prisma.businessVideo.findUnique({ where: { id } });
    if (!existingBusinessVideo) {
      throw new AppError('Business video not found', 404);
    }
    if (existingBusinessVideo.businessId !== businessId) {
      throw new AppError('You can only update your own business videos', 403);
    }
    return await prisma.businessVideo.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteBusinessVideo(id: string, userId: string, user_type: string) {
    const businessVideo = await prisma.businessVideo.findUnique({
      where: {
        id,
        status: Status.ACTIVE,
      },
    });

    if (!businessVideo) {
      throw new AppError('Business video not found', 404);
    }

    if (businessVideo?.businessId !== userId && user_type !== 'ADMIN') {
      throw new AppError('You can only delete your own business videos', 403);
    }

    return await prisma.businessVideo.delete({
      where: { id },
    });
  }
}
