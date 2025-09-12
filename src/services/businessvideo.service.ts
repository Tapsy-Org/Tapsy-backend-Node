import { BusinessVideo, Prisma, Status } from '@prisma/client';

import prisma from '../config/db';

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

  async updateBusinessVideo(id: string, businessVideo: BusinessVideo) {
    return await prisma.businessVideo.update({
      where: { id },
      data: businessVideo,
    });
  }

  async deleteBusinessVideo(id: string) {
    return await prisma.businessVideo.delete({
      where: { id },
    });
  }
}
