import { Queue } from 'bullmq';
import IORedis from 'ioredis';

import AppError from '../utils/AppError';

class QueueConfig {
  private static instance: QueueConfig;
  private connection: IORedis;

  public readonly reviewApprovalQueue: Queue;

  private constructor() {
    try {
      this.connection = new IORedis(process.env.REDIS_URL!, {
        // This is a robust setting for production workers
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        connectTimeout: 10000,
      });

      // Add event listeners for clear logging, just like in your RedisConfig
      this.connection.on('connect', () => {
        console.log('BullMQ connected to Redis via ioredis');
      });

      this.connection.on('error', (err) => {
        console.error('BullMQ Redis (ioredis) connection error:', err);
      });

      // --- Instantiate all your queues here ---
      this.reviewApprovalQueue = new Queue('review-approval', {
        connection: this.connection,
      });

      // this.anotherQueue = new Queue('another-job', { connection: this.connection });
    } catch (error) {
      console.error('Failed to initialize QueueConfig:', error);
      throw new AppError('Could not establish queue connections', 500, { originalError: error });
    }
  }

  /**
   * Gets the singleton instance of the QueueConfig.
   */
  public static getInstance(): QueueConfig {
    if (!QueueConfig.instance) {
      QueueConfig.instance = new QueueConfig();
    }
    return QueueConfig.instance;
  }

  /**
   * Returns the underlying ioredis connection instance.
   * Useful for the worker file.
   */
  public getConnection(): IORedis {
    return this.connection;
  }
}

export default QueueConfig.getInstance();
