import prisma from '../../../config/db';
import { ReviewInteractionService } from '../../../services/ReviewInteraction.service';
import AppError from '../../../utils/AppError';

// Mock Prisma
jest.mock('../../../config/db', () => ({
  user: {
    findUnique: jest.fn(),
  },
  review: {
    findUnique: jest.fn(),
  },
  like: {
    findFirst: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  comment: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
}));

// Get the mocked prisma client
const mockPrisma = jest.mocked(prisma);

describe('ReviewInteractionService', () => {
  let reviewInteractionService: ReviewInteractionService;

  beforeEach(() => {
    reviewInteractionService = new ReviewInteractionService();
    jest.clearAllMocks();
  });

  describe('toggleLike', () => {
    const mockReviewId = 'review-123';
    const mockUserId = 'user-123';

    it('should like a review when user has not liked it before', async () => {
      // Mock review exists
      mockPrisma.review.findUnique.mockResolvedValue({
        id: mockReviewId,
      } as any);

      // Mock user exists
      mockPrisma.user.findUnique.mockResolvedValue({
        id: mockUserId,
      } as any);

      // Mock no existing like
      mockPrisma.like.findFirst.mockResolvedValue(null);

      // Mock like creation
      mockPrisma.like.create.mockResolvedValue({
        id: 'like-123',
        userId: mockUserId,
        reviewId: mockReviewId,
      } as any);

      const result = await reviewInteractionService.toggleLike(mockReviewId, mockUserId);

      expect(result).toEqual({
        liked: true,
        message: 'Review liked successfully',
      });
      expect(mockPrisma.like.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          reviewId: mockReviewId,
        },
      });
    });

    it('should unlike a review when user has already liked it', async () => {
      // Mock review exists
      mockPrisma.review.findUnique.mockResolvedValue({
        id: mockReviewId,
      } as any);

      // Mock user exists
      mockPrisma.user.findUnique.mockResolvedValue({
        id: mockUserId,
      } as any);

      // Mock existing like
      mockPrisma.like.findFirst.mockResolvedValue({
        id: 'like-123',
        userId: mockUserId,
        reviewId: mockReviewId,
      } as any);

      const result = await reviewInteractionService.toggleLike(mockReviewId, mockUserId);

      expect(result).toEqual({
        liked: false,
        message: 'Review unliked successfully',
      });
      expect(mockPrisma.like.delete).toHaveBeenCalledWith({
        where: {
          id: 'like-123',
        },
      });
    });

    it('should throw error when review not found', async () => {
      // Mock review not found
      mockPrisma.review.findUnique.mockResolvedValue(null);

      await expect(reviewInteractionService.toggleLike(mockReviewId, mockUserId)).rejects.toThrow(
        new AppError('Review not found', 404),
      );
    });

    it('should throw error when user not found', async () => {
      // Mock review exists
      mockPrisma.review.findUnique.mockResolvedValue({
        id: mockReviewId,
      } as any);

      // Mock user not found
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(reviewInteractionService.toggleLike(mockReviewId, mockUserId)).rejects.toThrow(
        new AppError('User not found or inactive', 404),
      );
    });
  });

  describe('addComment', () => {
    const mockReviewId = 'review-123';
    const mockUserId = 'user-123';
    const mockComment = 'Great review!';

    it('should add a comment successfully', async () => {
      // Mock review exists
      mockPrisma.review.findUnique.mockResolvedValue({
        id: mockReviewId,
      } as any);

      // Mock user exists
      mockPrisma.user.findUnique.mockResolvedValue({
        id: mockUserId,
      } as any);

      // Mock comment creation
      const mockCreatedComment = {
        id: 'comment-123',
        reviewId: mockReviewId,
        userId: mockUserId,
        comment: mockComment,
        parent_comment_id: null,
        createdAt: new Date(),
        user: {
          id: mockUserId,
          username: 'testuser',
          user_type: 'INDIVIDUAL',
          logo_url: null,
        },
      };
      mockPrisma.comment.create.mockResolvedValue(mockCreatedComment as any);

      const result = await reviewInteractionService.addComment({
        reviewId: mockReviewId,
        userId: mockUserId,
        comment: mockComment,
      });

      expect(result).toEqual(mockCreatedComment);
      expect(mockPrisma.comment.create).toHaveBeenCalledWith({
        data: {
          reviewId: mockReviewId,
          userId: mockUserId,
          comment: mockComment,
          parent_comment_id: undefined,
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
        },
      });
    });

    it('should add a reply comment successfully', async () => {
      const parentCommentId = 'parent-comment-123';

      // Mock review exists
      mockPrisma.review.findUnique.mockResolvedValue({
        id: mockReviewId,
      } as any);

      // Mock user exists
      mockPrisma.user.findUnique.mockResolvedValue({
        id: mockUserId,
      } as any);

      // Mock parent comment exists
      mockPrisma.comment.findUnique.mockResolvedValue({
        id: parentCommentId,
        reviewId: mockReviewId,
      } as any);

      // Mock comment creation
      const mockCreatedComment = {
        id: 'comment-123',
        reviewId: mockReviewId,
        userId: mockUserId,
        comment: mockComment,
        parent_comment_id: parentCommentId,
        createdAt: new Date(),
        user: {
          id: mockUserId,
          username: 'testuser',
          user_type: 'INDIVIDUAL',
          logo_url: null,
        },
      };
      mockPrisma.comment.create.mockResolvedValue(mockCreatedComment as any);

      const result = await reviewInteractionService.addComment({
        reviewId: mockReviewId,
        userId: mockUserId,
        comment: mockComment,
        parentCommentId,
      });

      expect(result).toEqual(mockCreatedComment);
      expect(mockPrisma.comment.create).toHaveBeenCalledWith({
        data: {
          reviewId: mockReviewId,
          userId: mockUserId,
          comment: mockComment,
          parent_comment_id: parentCommentId,
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
        },
      });
    });

    it('should throw error when comment text is empty', async () => {
      await expect(
        reviewInteractionService.addComment({
          reviewId: mockReviewId,
          userId: mockUserId,
          comment: '',
        }),
      ).rejects.toThrow(new AppError('Comment text is required', 400));
    });
  });

  describe('getReviewLikes', () => {
    const mockReviewId = 'review-123';

    it('should get review likes with pagination', async () => {
      // Mock review exists
      mockPrisma.review.findUnique.mockResolvedValue({
        id: mockReviewId,
      } as any);

      // Mock likes data
      const mockLikes = [
        {
          id: 'like-1',
          userId: 'user-1',
          reviewId: mockReviewId,
          createdAt: new Date(),
          user: {
            id: 'user-1',
            username: 'user1',
            user_type: 'INDIVIDUAL',
            logo_url: null,
          },
        },
      ];
      const mockTotal = 1;

      mockPrisma.like.findMany.mockResolvedValue(mockLikes as any);
      mockPrisma.like.count.mockResolvedValue(mockTotal);

      const result = await reviewInteractionService.getReviewLikes({
        reviewId: mockReviewId,
        page: 1,
        limit: 20,
      });

      expect(result).toEqual({
        likes: mockLikes,
        pagination: {
          page: 1,
          limit: 20,
          total: mockTotal,
          totalPages: 1,
        },
      });
    });
  });

  describe('getReviewComments', () => {
    const mockReviewId = 'review-123';

    it('should get review comments with nested replies', async () => {
      // Mock review exists
      mockPrisma.review.findUnique.mockResolvedValue({
        id: mockReviewId,
      } as any);

      // Mock comments data
      const mockComments = [
        {
          id: 'comment-1',
          reviewId: mockReviewId,
          userId: 'user-1',
          comment: 'Great review!',
          parent_comment_id: undefined,
          createdAt: new Date(),
          user: {
            id: 'user-1',
            username: 'user1',
            user_type: 'INDIVIDUAL',
            logo_url: null,
          },
          replies: [],
        },
      ];
      const mockTotal = 1;

      mockPrisma.comment.findMany.mockResolvedValue(mockComments as any);
      mockPrisma.comment.count.mockResolvedValue(mockTotal);

      const result = await reviewInteractionService.getReviewComments({
        reviewId: mockReviewId,
        page: 1,
        limit: 20,
      });

      expect(result).toEqual({
        comments: mockComments,
        pagination: {
          page: 1,
          limit: 20,
          total: mockTotal,
          totalPages: 1,
        },
      });
    });
  });
});
