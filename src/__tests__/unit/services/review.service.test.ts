import prisma from '../../../config/db';
import { ReviewService } from '../../../services/review.service';
import AppError from '../../../utils/AppError';

// Mock Prisma
jest.mock('../../../config/db', () => ({
  user: {
    findUnique: jest.fn(),
  },
  review: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  like: {
    deleteMany: jest.fn(),
  },
  comment: {
    deleteMany: jest.fn(),
  },
  $transaction: jest.fn(),
}));

// Get the mocked prisma client
const mockPrisma = jest.mocked(prisma);

describe('ReviewService', () => {
  let reviewService: ReviewService;

  beforeEach(() => {
    reviewService = new ReviewService();
    jest.clearAllMocks();
  });

  describe('createReview', () => {
    const mockReviewData = {
      userId: 'user-123',
      rating: 'FIVE' as const,
      badges: undefined,
      caption: 'Great service!',
      hashtags: ['#great', '#service'],
      title: 'Amazing Experience',
      video_url: undefined,
      businessId: 'business-123',
    };

    it('should create a review successfully', async () => {
      // Mock user exists
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        user_type: 'INDIVIDUAL',
      } as any);

      // Mock business exists
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({
          id: 'user-123',
          user_type: 'INDIVIDUAL',
        } as any)
        .mockResolvedValueOnce({
          id: 'business-123',
          user_type: 'BUSINESS',
        } as any);

      // Mock review creation
      const mockCreatedReview = {
        id: 'review-123',
        ...mockReviewData,
        status: 'ACTIVE', // Status is automatically set based on rating
        views: 0,
        createdAt: new Date(),
      };
      mockPrisma.review.create.mockResolvedValue(mockCreatedReview as any);

      const result = await reviewService.createReview(mockReviewData);

      expect(result).toEqual(mockCreatedReview);
      expect(mockPrisma.review.create).toHaveBeenCalledWith({
        data: {
          ...mockReviewData,
          status: 'ACTIVE', // Status is automatically set based on rating
          views: 0,
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
        },
      });
    });

    it('should throw error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(reviewService.createReview(mockReviewData)).rejects.toThrow(
        new AppError('User not found or inactive', 404),
      );
    });

    it('should throw error if business not found when businessId provided', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({
          id: 'user-123',
          user_type: 'INDIVIDUAL',
        } as any)
        .mockResolvedValueOnce(null);

      await expect(reviewService.createReview(mockReviewData)).rejects.toThrow(
        new AppError('Business not found or inactive', 404),
      );
    });

    it('should throw error if rating is invalid', async () => {
      const invalidData = { ...mockReviewData, rating: 'INVALID' as any };

      await expect(reviewService.createReview(invalidData)).rejects.toThrow(
        new AppError('Invalid rating value', 400),
      );
    });

    it('should set status to PENDING for ratings ONE and TWO', async () => {
      // Mock user exists
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        user_type: 'INDIVIDUAL',
      } as any);

      // Mock business exists
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({
          id: 'user-123',
          user_type: 'INDIVIDUAL',
        } as any)
        .mockResolvedValueOnce({
          id: 'business-123',
          user_type: 'BUSINESS',
        } as any);

      const lowRatingData = { ...mockReviewData, rating: 'ONE' as const };
      const mockCreatedReview = {
        id: 'review-123',
        ...lowRatingData,
        status: 'PENDING',
        views: 0,
        createdAt: new Date(),
      };
      mockPrisma.review.create.mockResolvedValue(mockCreatedReview as any);

      await reviewService.createReview(lowRatingData);

      expect(mockPrisma.review.create).toHaveBeenCalledWith({
        data: {
          ...lowRatingData,
          status: 'PENDING',
          views: 0,
        },
        include: expect.any(Object),
      });
    });
  });

  describe('getReviews', () => {
    it('should fetch reviews with filters', async () => {
      const mockReviews = [
        { id: 'review-1', rating: 'FIVE' },
        { id: 'review-2', rating: 'FOUR' },
      ];
      const mockTotal = 2;

      mockPrisma.review.findMany.mockResolvedValue(mockReviews as any);
      mockPrisma.review.count.mockResolvedValue(mockTotal);

      const result = await reviewService.getReviews({
        userId: 'user-123',
        page: 1,
        limit: 10,
      });

      expect(result.reviews).toEqual(mockReviews);
      expect(result.pagination.total).toBe(mockTotal);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });
  });

  describe('getReviewById', () => {
    it('should fetch review by ID', async () => {
      const mockReview = { id: 'review-123', rating: 'FIVE' };
      mockPrisma.review.findUnique.mockResolvedValue(mockReview as any);

      const result = await reviewService.getReviewById('review-123');

      expect(result).toEqual(mockReview);
    });

    it('should throw error if review not found', async () => {
      mockPrisma.review.findUnique.mockResolvedValue(null);

      await expect(reviewService.getReviewById('review-123')).rejects.toThrow(
        new AppError('Review not found', 404),
      );
    });
  });

  describe('deleteReview', () => {
    it('should delete review successfully', async () => {
      mockPrisma.review.findUnique.mockResolvedValue({
        id: 'review-123',
        userId: 'user-123',
      } as any);

      mockPrisma.$transaction.mockResolvedValue([{}, {}, {}]);

      const result = await reviewService.deleteReview('review-123', 'user-123');

      expect(result.message).toBe('Review deleted successfully');
    });

    it('should throw error if review not found', async () => {
      mockPrisma.review.findUnique.mockResolvedValue(null);

      await expect(reviewService.deleteReview('review-123', 'user-123')).rejects.toThrow(
        new AppError('Review not found', 404),
      );
    });

    it('should throw error if user is not the owner', async () => {
      mockPrisma.review.findUnique.mockResolvedValue({
        id: 'review-123',
        userId: 'other-user',
      } as any);

      await expect(reviewService.deleteReview('review-123', 'user-123')).rejects.toThrow(
        new AppError('You can only delete your own reviews', 403),
      );
    });
  });

  describe('updateReviewStatus', () => {
    it('should update review status successfully for admin user', async () => {
      // Mock admin user exists
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'admin-123',
        user_type: 'ADMIN',
        status: 'ACTIVE',
      } as any);

      // Mock review exists
      mockPrisma.review.findUnique.mockResolvedValue({
        id: 'review-123',
        status: 'PENDING',
      } as any);

      // Mock status update
      const mockUpdatedReview = {
        id: 'review-123',
        status: 'ACTIVE',
        user: { id: 'user-123', username: 'john_doe' },
        business: null,
      };
      mockPrisma.review.update.mockResolvedValue(mockUpdatedReview as any);

      const result = await reviewService.updateReviewStatus('review-123', 'ACTIVE', 'admin-123');

      expect(result).toEqual(mockUpdatedReview);
      expect(mockPrisma.review.update).toHaveBeenCalledWith({
        where: { id: 'review-123' },
        data: { status: 'ACTIVE' },
        include: expect.any(Object),
      });
    });

    it('should throw error if admin user not found or unauthorized', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        reviewService.updateReviewStatus('review-123', 'ACTIVE', 'admin-123'),
      ).rejects.toThrow(new AppError('Admin user not found or unauthorized', 403));
    });

    it('should throw error if review not found', async () => {
      // Mock admin user exists
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'admin-123',
        user_type: 'ADMIN',
        status: 'ACTIVE',
      } as any);

      // Mock review not found
      mockPrisma.review.findUnique.mockResolvedValue(null);

      await expect(
        reviewService.updateReviewStatus('review-123', 'ACTIVE', 'admin-123'),
      ).rejects.toThrow(new AppError('Review not found', 404));
    });
  });
});
