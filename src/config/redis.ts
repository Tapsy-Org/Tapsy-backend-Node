import { createClient, RedisClientType } from 'redis';

class RedisConfig {
  private static instance: RedisConfig;
  private client: RedisClientType | null = null;

  private constructor() {}

  public static getInstance(): RedisConfig {
    if (!RedisConfig.instance) {
      RedisConfig.instance = new RedisConfig();
    }
    return RedisConfig.instance;
  }

  public async connect(): Promise<RedisClientType> {
    if (this.client && this.client.isOpen) {
      return this.client;
    }

    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        password: process.env.REDIS_PASSWORD,
        socket: {
          connectTimeout: 10000,
        },
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      this.client.on('connect', () => {
        console.log('Connected to Redis');
      });

      this.client.on('disconnect', () => {
        console.log('Disconnected from Redis');
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client && this.client.isOpen) {
      await this.client.destroy();
      this.client = null;
    }
  }

  public getClient(): RedisClientType | null {
    return this.client;
  }
}

export default RedisConfig;
