import prisma from '../../../config/db';
import { FollowService } from '../../../services/follow.service';
import AppError from '../../../utils/AppError';

// Mock Prisma
jest.mock('../../../config/db', () => ({
  user: {
    findUnique: jest.fn(),
  },
  follow: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
  },
}));

// Get the mocked prisma client
const mockPrisma = jest.mocked(prisma);

describe('FollowService', () => {
  let followService: FollowService;

  beforeEach(() => {
    followService = new FollowService();
    jest.clearAllMocks();
  });

  describe('followUser', () => {
    const mockFollowerId = 'follower-123';
    const mockFollowingUserId = 'following-123';

    it('should create follow relationship successfully', async () => {
      // Mock users exist
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({
          id: mockFollowerId,
          user_type: 'INDIVIDUAL',
        } as any)
        .mockResolvedValueOnce({
          id: mockFollowingUserId,
          user_type: 'BUSINESS',
        } as any);

      // Mock no existing follow
      mockPrisma.follow.findUnique.mockResolvedValue(null);

      // Mock follow creation
      const mockFollow = {
        id: 'follow-123',
        followerId: mockFollowerId,
        followingUserId: mockFollowingUserId,
        createdAt: new Date(),
        follower: {
          id: mockFollowerId,
          username: 'follower',
          user_type: 'INDIVIDUAL',
          logo_url: null,
        },
        following: {
          id: mockFollowingUserId,
          username: 'following',
          user_type: 'BUSINESS',
          logo_url: null,
        },
      };
      mockPrisma.follow.create.mockResolvedValue(mockFollow as any);

      const result = await followService.toggleFollow(mockFollowerId, mockFollowingUserId);

      expect(result).toEqual(mockFollow);
      expect(mockPrisma.follow.create).toHaveBeenCalledWith({
        data: {
          followerId: mockFollowerId,
          followingUserId: mockFollowingUserId,
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
    });

    it('should throw error if user tries to follow themselves', async () => {
      await expect(followService.toggleFollow(mockFollowerId, mockFollowerId)).rejects.toThrow(
        new AppError('Users cannot follow themselves', 400),
      );
    });

    it('should throw error if follower not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(followService.toggleFollow(mockFollowerId, mockFollowingUserId)).rejects.toThrow(
        new AppError('Follower not found or inactive', 404),
      );
    });

    it('should throw error if user to follow not found', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({
          id: mockFollowerId,
          user_type: 'INDIVIDUAL',
        } as any)
        .mockResolvedValueOnce(null);

      await expect(followService.toggleFollow(mockFollowerId, mockFollowingUserId)).rejects.toThrow(
        new AppError('User to follow not found or inactive', 404),
      );
    });

    it('should throw error if already following', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({
          id: mockFollowerId,
          user_type: 'INDIVIDUAL',
        } as any)
        .mockResolvedValueOnce({
          id: mockFollowingUserId,
          user_type: 'BUSINESS',
        } as any);

      mockPrisma.follow.findUnique.mockResolvedValue({
        id: 'existing-follow',
      } as any);

      await expect(followService.toggleFollow(mockFollowerId, mockFollowingUserId)).rejects.toThrow(
        new AppError('Already following this user', 400),
      );
    });
  });

  describe('unfollowUser', () => {
    const mockFollowerId = 'follower-123';
    const mockFollowingUserId = 'following-123';

    it('should unfollow user successfully', async () => {
      // Mock follow relationship exists
      const mockFollow = {
        id: 'follow-123',
        followerId: mockFollowerId,
        followingUserId: mockFollowingUserId,
        follower: {
          id: mockFollowerId,
          username: 'follower',
          user_type: 'INDIVIDUAL',
          logo_url: null,
        },
        following: {
          id: mockFollowingUserId,
          username: 'following',
          user_type: 'BUSINESS',
          logo_url: null,
        },
      };
      mockPrisma.follow.findUnique.mockResolvedValue(mockFollow as any);

      // Mock follow deletion
      mockPrisma.follow.delete.mockResolvedValue(mockFollow as any);

      const result = await followService.toggleFollow(mockFollowerId, mockFollowingUserId);

      expect(result).toEqual({ message: 'Successfully unfollowed user' });
      expect(mockPrisma.follow.delete).toHaveBeenCalledWith({
        where: {
          followerId_followingUserId: {
            followerId: mockFollowerId,
            followingUserId: mockFollowingUserId,
          },
        },
      });
    });

    it('should throw error if follow relationship not found', async () => {
      mockPrisma.follow.findUnique.mockResolvedValue(null);

      await expect(followService.toggleFollow(mockFollowerId, mockFollowingUserId)).rejects.toThrow(
        new AppError('Follow relationship not found', 404),
      );
    });

    it("should throw error if user tries to unfollow someone else's follow", async () => {
      const mockFollow = {
        id: 'follow-123',
        followerId: 'different-user',
        followingUserId: mockFollowingUserId,
      };
      mockPrisma.follow.findUnique.mockResolvedValue(mockFollow as any);

      await expect(followService.toggleFollow(mockFollowerId, mockFollowingUserId)).rejects.toThrow(
        new AppError('You can only unfollow your own follows', 403),
      );
    });
  });

  describe('checkFollowStatus', () => {
    const mockFollowerId = 'follower-123';
    const mockFollowingUserId = 'following-123';

    it('should return follow status when following', async () => {
      const mockFollow = {
        id: 'follow-123',
        createdAt: new Date('2024-01-01'),
      };
      mockPrisma.follow.findUnique.mockResolvedValue(mockFollow as any);

      const result = await followService.checkFollowStatus(mockFollowerId, mockFollowingUserId);

      expect(result).toEqual({
        isFollowing: true,
        followedAt: mockFollow.createdAt,
      });
    });

    it('should return not following status when not following', async () => {
      mockPrisma.follow.findUnique.mockResolvedValue(null);

      const result = await followService.checkFollowStatus(mockFollowerId, mockFollowingUserId);

      expect(result).toEqual({
        isFollowing: false,
        followedAt: null,
      });
    });
  });

  describe('getFollowers', () => {
    const mockUserId = 'user-123';

    it('should return followers with pagination', async () => {
      // Mock user exists
      mockPrisma.user.findUnique.mockResolvedValue({
        id: mockUserId,
      } as any);

      // Mock followers
      const mockFollowers = [
        {
          follower: {
            id: 'follower-1',
            username: 'follower1',
            user_type: 'INDIVIDUAL',
            logo_url: null,
            about: 'About follower 1',
            createdAt: new Date(),
          },
        },
        {
          follower: {
            id: 'follower-2',
            username: 'follower2',
            user_type: 'BUSINESS',
            logo_url: 'logo2.jpg',
            about: 'About follower 2',
            createdAt: new Date(),
          },
        },
      ];
      mockPrisma.follow.findMany.mockResolvedValue(mockFollowers as any);
      mockPrisma.follow.count.mockResolvedValue(2);

      const result = await followService.getFollowers(mockUserId, 1, 20);

      expect(result.followers).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
    });

    it('should throw error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(followService.getFollowers(mockUserId, 1, 20)).rejects.toThrow(
        new AppError('User not found or inactive', 404),
      );
    });
  });

  describe('getFollowing', () => {
    const mockUserId = 'user-123';

    it('should return following list with pagination', async () => {
      // Mock user exists
      mockPrisma.user.findUnique.mockResolvedValue({
        id: mockUserId,
      } as any);

      // Mock following
      const mockFollowing = [
        {
          following: {
            id: 'following-1',
            username: 'following1',
            user_type: 'INDIVIDUAL',
            logo_url: null,
            about: 'About following 1',
            createdAt: new Date(),
          },
        },
      ];
      mockPrisma.follow.findMany.mockResolvedValue(mockFollowing as any);
      mockPrisma.follow.count.mockResolvedValue(1);

      const result = await followService.getFollowing(mockUserId, 1, 20);

      expect(result.following).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('getFollowCounts', () => {
    const mockUserId = 'user-123';

    it('should return follow counts', async () => {
      // Mock user exists
      mockPrisma.user.findUnique.mockResolvedValue({
        id: mockUserId,
      } as any);

      // Mock counts
      mockPrisma.follow.count
        .mockResolvedValueOnce(10) // followers
        .mockResolvedValueOnce(5); // following

      const result = await followService.getFollowCounts(mockUserId);

      expect(result).toEqual({
        followers: 10,
        following: 5,
      });
    });
  });

  describe('searchUsers', () => {
    const mockCurrentUserId = 'current-user-123';
    const mockQuery = 'john';

    it('should return users with follow status', async () => {
      // Mock users found
      const mockUsers = [
        {
          id: 'user-1',
          username: 'john_doe',
          user_type: 'INDIVIDUAL',
          logo_url: null,
          about: 'About John',
          createdAt: new Date(),
        },
      ];
      mockPrisma.user.findMany.mockResolvedValue(mockUsers as any);

      // Mock follow status check
      jest.spyOn(followService, 'checkFollowStatus').mockResolvedValue({
        isFollowing: false,
        followedAt: null,
      });

      const result = await followService.searchUsers(mockQuery, mockCurrentUserId, 1, 20);

      expect(result.users).toHaveLength(1);
      expect(result.users[0].username).toBe('john_doe');
      expect(result.users[0].isFollowing).toBe(false);
    });

    it('should throw error if query is too short', async () => {
      await expect(followService.searchUsers('a', mockCurrentUserId, 1, 20)).rejects.toThrow(
        new AppError('Search query must be at least 2 characters long', 400),
      );
    });
  });

  describe('getMutualFollowers', () => {
    const mockUserId1 = 'user-1';
    const mockUserId2 = 'user-2';

    it('should return mutual followers', async () => {
      // Mock both users exist
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: mockUserId1 } as any)
        .mockResolvedValueOnce({ id: mockUserId2 } as any);

      // Mock mutual following
      const mockMutualFollowing = [
        {
          following: {
            id: 'mutual-1',
            username: 'mutual1',
            user_type: 'INDIVIDUAL',
            logo_url: null,
            about: 'About mutual 1',
          },
        },
      ];
      mockPrisma.follow.findMany.mockResolvedValue(mockMutualFollowing as any);

      // Mock getFollowingUserIds
      jest
        .spyOn(followService as any, 'getFollowingUserIds')
        .mockResolvedValue(['user-3', 'user-4']);

      const result = await followService.getMutualFollowers(mockUserId1, mockUserId2);

      expect(result.mutualFollowers).toHaveLength(1);
      expect(result.count).toBe(1);
    });

    it('should throw error if one or both users not found', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: mockUserId1 } as any)
        .mockResolvedValueOnce(null);

      await expect(followService.getMutualFollowers(mockUserId1, mockUserId2)).rejects.toThrow(
        new AppError('One or both users not found or inactive', 404),
      );
    });
  });
});
