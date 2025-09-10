import queueConfig from '../config/queue';
import RedisConfig from '../config/redis';
import AppError from '../utils/AppError';

export class RedisService {
  private redis: RedisConfig;

  constructor() {
    this.redis = RedisConfig.getInstance();
  }

  /**
   * Mark a review as seen by a user
   * @param userId - The user ID
   * @param reviewId - The review ID
   * @param ttl - Time to live in seconds (default: 30 days)
   */
  async markReviewAsSeen(
    userId: string,
    reviewId: string,
    ttl: number = 30 * 24 * 60 * 60,
  ): Promise<void> {
    try {
      const client = await this.redis.connect();
      const key = `seen_reviews:${userId}`;

      // Add review ID to the set with TTL
      await client.sAdd(key, reviewId);
      await client.expire(key, ttl);

      console.log(`Marked review ${reviewId} as seen by user ${userId}`);
    } catch (error) {
      console.error('Error marking review as seen:', error);
      throw new AppError('Failed to mark review as seen', 500, { originalError: error });
    }
  }

  /**
   * Mark multiple reviews as seen by a user
   * @param userId - The user ID
   * @param reviewIds - Array of review IDs
   * @param ttl - Time to live in seconds (default: 30 days)
   */
  async markReviewsAsSeen(
    userId: string,
    reviewIds: string[],
    ttl: number = 30 * 24 * 60 * 60,
  ): Promise<void> {
    try {
      const client = await this.redis.connect();
      const key = `seen_reviews:${userId}`;

      if (reviewIds.length === 0) return;

      // Add all review IDs to the set with TTL
      await client.sAdd(key, reviewIds);
      await client.expire(key, ttl);

      console.log(`Marked ${reviewIds.length} reviews as seen by user ${userId}`);
    } catch (error) {
      console.error('Error marking reviews as seen:', error);
      throw new AppError('Failed to mark reviews as seen', 500, { originalError: error });
    }
  }

  /**
   * Get all seen review IDs for a user
   * @param userId - The user ID
   * @returns Array of seen review IDs
   */
  async getSeenReviewIds(userId: string): Promise<string[]> {
    try {
      const client = await this.redis.connect();
      const key = `seen_reviews:${userId}`;

      const seenIds = await client.sMembers(key);
      return seenIds || [];
    } catch (error) {
      console.error('Error getting seen review IDs:', error);
      // Return empty array on error to not break the feed
      return [];
    }
  }

  /**
   * Check if a review has been seen by a user
   * @param userId - The user ID
   * @param reviewId - The review ID
   * @returns Boolean indicating if the review has been seen
   */
  async isReviewSeen(userId: string, reviewId: string): Promise<boolean> {
    try {
      const client = await this.redis.connect();
      const key = `seen_reviews:${userId}`;

      const isSeen = await client.sIsMember(key, reviewId);
      return Boolean(isSeen);
    } catch (error) {
      console.error('Error checking if review is seen:', error);
      // Return false on error to not break the feed
      return false;
    }
  }

  /**
   * Remove a review from seen list (useful for testing or if user wants to see it again)
   * @param userId - The user ID
   * @param reviewId - The review ID
   */
  async removeSeenReview(userId: string, reviewId: string): Promise<void> {
    try {
      const client = await this.redis.connect();
      const key = `seen_reviews:${userId}`;

      await client.sRem(key, reviewId);
      console.log(`Removed review ${reviewId} from seen list for user ${userId}`);
    } catch (error) {
      console.error('Error removing seen review:', error);
      throw new AppError('Failed to remove seen review', 500, { originalError: error });
    }
  }

  /**
   * Clear all seen reviews for a user
   * @param userId - The user ID
   */
  async clearSeenReviews(userId: string): Promise<void> {
    try {
      const client = await this.redis.connect();
      const key = `seen_reviews:${userId}`;

      await client.del(key);
      console.log(`Cleared all seen reviews for user ${userId}`);
    } catch (error) {
      console.error('Error clearing seen reviews:', error);
      throw new AppError('Failed to clear seen reviews', 500, { originalError: error });
    }
  }

  /**
   * Get the count of seen reviews for a user
   * @param userId - The user ID
   * @returns Number of seen reviews
   */
  async getSeenReviewsCount(userId: string): Promise<number> {
    try {
      const client = await this.redis.connect();
      const key = `seen_reviews:${userId}`;

      const count = await client.sCard(key);
      return count || 0;
    } catch (error) {
      console.error('Error getting seen reviews count:', error);
      return 0;
    }
  }

  /**
   * Schedules a pending review for automatic approval using BullMQ.
   * @param reviewId - The ID of the review to schedule.
   */
  async scheduleReviewApproval(reviewId: string): Promise<void> {
    try {
      // Get delay from environment variables (defaults to 24 hours)
      const approvalDelay = parseInt(process.env.REVIEW_APPROVAL_DELAY || '24');

      await queueConfig.reviewApprovalQueue.add(
        'approve-review',
        { reviewId },
        { delay: approvalDelay },
      );
      console.log(`Successfully scheduled review ${reviewId} for approval.`);
    } catch (error) {
      console.error('Error scheduling review for approval:', error);
      throw new AppError('Failed to schedule review for approval', 500, { originalError: error });
    }
  }

  /**
   * Health check for Redis connection
   * @returns Boolean indicating if Redis is connected
   */
  async isHealthy(): Promise<boolean> {
    try {
      const client = await this.redis.connect();
      await client.ping();
      return true;
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }
}
