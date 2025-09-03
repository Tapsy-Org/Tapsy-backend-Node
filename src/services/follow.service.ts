import type { Prisma, UserType } from '@prisma/client';

import prisma from '../config/db';
import AppError from '../utils/AppError';

export class FollowService {
  async followUser(followerId: string, followingUserId: string, followType: string = 'FOLLOW') {
    try {
      // Check if user is trying to follow themselves
      if (followerId === followingUserId) {
        throw new AppError('Users cannot follow themselves', 400);
      }

      // Check if follower exists and is active
      const follower = await prisma.user.findUnique({
        where: { id: followerId, status: 'ACTIVE' },
        select: { id: true, user_type: true },
      });

      if (!follower) {
        throw new AppError('Follower not found or inactive', 404);
      }

      // Check if user to follow exists and is active
      const followingUser = await prisma.user.findUnique({
        where: { id: followingUserId, status: 'ACTIVE' },
        select: { id: true, user_type: true },
      });

      if (!followingUser) {
        throw new AppError('User to follow not found or inactive', 404);
      }

      // Check if already following
      const existingFollow = await prisma.follow.findUnique({
        where: {
          followerId_followingUserId: {
            followerId,
            followingUserId,
          },
        },
      });

      if (existingFollow) {
        throw new AppError('Already following this user', 400);
      }

      // Create follow relationship
      const follow = await prisma.follow.create({
        data: {
          followerId,
          followingUserId,
          followType,
        },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              user_type: true,
              logo_url: true,
            },
          },
          following: {
            select: {
              id: true,
              username: true,
              user_type: true,
              logo_url: true,
            },
          },
        },
      });

      return follow;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to follow user', 500, { originalError: error });
    }
  }

  async unfollowUser(followerId: string, followingUserId: string) {
    try {
      // Check if follow relationship exists
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingUserId: {
            followerId,
            followingUserId,
          },
        },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              user_type: true,
              logo_url: true,
            },
          },
          following: {
            select: {
              id: true,
              username: true,
              user_type: true,
              logo_url: true,
            },
          },
        },
      });

      if (!follow) {
        throw new AppError('Follow relationship not found', 404);
      }

      // Check if user is trying to unfollow their own follow
      if (follow.followerId !== followerId) {
        throw new AppError('You can only unfollow your own follows', 403);
      }

      // Delete follow relationship
      await prisma.follow.delete({
        where: {
          followerId_followingUserId: {
            followerId,
            followingUserId,
          },
        },
      });

      return { message: 'Successfully unfollowed user' };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to unfollow user', 500, { originalError: error });
    }
  }

  async checkFollowStatus(followerId: string, followingUserId: string) {
    try {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingUserId: {
            followerId,
            followingUserId,
          },
        },
        select: {
          id: true,
          followType: true,
          createdAt: true,
        },
      });

      return {
        isFollowing: !!follow,
        followType: follow?.followType || null,
        followedAt: follow?.createdAt || null,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to check follow status', 500, { originalError: error });
    }
  }

  async getFollowers(userId: string, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId, status: 'ACTIVE' },
        select: { id: true },
      });

      if (!user) {
        throw new AppError('User not found or inactive', 404);
      }

      const [followers, total] = await Promise.all([
        prisma.follow.findMany({
          where: { followingUserId: userId },
          include: {
            follower: {
              select: {
                id: true,
                username: true,
                user_type: true,
                logo_url: true,
                about: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.follow.count({ where: { followingUserId: userId } }),
      ]);

      return {
        followers: followers.map((f) => f.follower),
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
      throw new AppError('Failed to fetch followers', 500, { originalError: error });
    }
  }

  async getFollowing(userId: string, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId, status: 'ACTIVE' },
        select: { id: true },
      });

      if (!user) {
        throw new AppError('User not found or inactive', 404);
      }

      const [following, total] = await Promise.all([
        prisma.follow.findMany({
          where: { followerId: userId },
          include: {
            following: {
              select: {
                id: true,
                username: true,
                user_type: true,
                logo_url: true,
                about: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.follow.count({ where: { followerId: userId } }),
      ]);

      return {
        following: following.map((f) => f.following),
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
      throw new AppError('Failed to fetch following list', 500, { originalError: error });
    }
  }

  async getFollowCounts(userId: string) {
    try {
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId, status: 'ACTIVE' },
        select: { id: true },
      });

      if (!user) {
        throw new AppError('User not found or inactive', 404);
      }

      const [followersCount, followingCount] = await Promise.all([
        prisma.follow.count({ where: { followingUserId: userId } }),
        prisma.follow.count({ where: { followerId: userId } }),
      ]);

      return {
        followers: followersCount,
        following: followingCount,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch follow counts', 500, { originalError: error });
    }
  }

  async getMutualFollowers(userId1: string, userId2: string) {
    try {
      // Check if both users exist
      const [user1, user2] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId1, status: 'ACTIVE' },
          select: { id: true },
        }),
        prisma.user.findUnique({
          where: { id: userId2, status: 'ACTIVE' },
          select: { id: true },
        }),
      ]);

      if (!user1 || !user2) {
        throw new AppError('One or both users not found or inactive', 404);
      }

      // Get users that both userId1 and userId2 follow
      const mutualFollowing = await prisma.follow.findMany({
        where: {
          AND: [
            { followerId: userId1 },
            { followingUserId: { in: await this.getFollowingUserIds(userId2) } },
          ],
        },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              user_type: true,
              logo_url: true,
              about: true,
            },
          },
        },
      });

      return {
        mutualFollowers: mutualFollowing.map((f) => f.following),
        count: mutualFollowing.length,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch mutual followers', 500, { originalError: error });
    }
  }

  private async getFollowingUserIds(userId: string): Promise<string[]> {
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingUserId: true },
    });
    return following.map((f) => f.followingUserId);
  }

  async searchUsers(
    query: string,
    currentUserId: string,
    page: number = 1,
    limit: number = 20,
    userType?: string,
    followStatus?: string,
  ) {
    try {
      const skip = (page - 1) * limit;

      // Build base where conditions
      const andConditions: Prisma.UserWhereInput[] = [
        { status: 'ACTIVE' },
        { id: { not: currentUserId } }, // Exclude current user
        {
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { about: { contains: query, mode: 'insensitive' } },
          ],
        },
      ];

      // Add user type filter if specified
      if (userType && ['INDIVIDUAL', 'BUSINESS', 'ADMIN'].includes(userType)) {
        andConditions.push({ user_type: userType as UserType });
      }

      // Add follow status filter if specified
      if (followStatus && ['followers', 'following', 'not_following'].includes(followStatus)) {
        if (followStatus === 'followers') {
          // Only show users who follow the current user
          const followerIds = await this.getFollowerIds(currentUserId);
          andConditions.push({ id: { in: followerIds } });
        } else if (followStatus === 'following') {
          // Only show users that the current user follows
          const followingIds = await this.getFollowingUserIds(currentUserId);
          andConditions.push({ id: { in: followingIds } });
        } else if (followStatus === 'not_following') {
          // Only show users that the current user doesn't follow
          const followingIds = await this.getFollowingUserIds(currentUserId);
          andConditions.push({ id: { notIn: followingIds } });
        }
      }

      const whereConditions: Prisma.UserWhereInput = {
        AND: andConditions,
      };

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: whereConditions,
          select: {
            id: true,
            username: true,
            user_type: true,
            logo_url: true,
            about: true,
            createdAt: true,
          },
          orderBy: { username: 'asc' },
          skip,
          take: limit,
        }),
        prisma.user.count({ where: whereConditions }),
      ]);

      // Add follow status for each user
      const usersWithFollowStatus = await Promise.all(
        users.map(async (user) => {
          const followStatus = await this.checkFollowStatus(currentUserId, user.id);
          return {
            ...user,
            ...followStatus,
          };
        }),
      );

      return {
        users: usersWithFollowStatus,
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
      throw new AppError('Failed to search users', 500, { originalError: error });
    }
  }

  // Helper method to get follower IDs
  private async getFollowerIds(userId: string): Promise<string[]> {
    const followers = await prisma.follow.findMany({
      where: { followingUserId: userId },
      select: { followerId: true },
    });
    return followers.map((f) => f.followerId);
  }
}
