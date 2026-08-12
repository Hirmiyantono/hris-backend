import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { getRedisConfig } from '../../config/redis.config';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly redisClient: Redis;
  private isConnected = false;

  constructor(configService: ConfigService) {
    const config = getRedisConfig(configService);
    this.redisClient = new Redis(config);

    this.redisClient.on('connect', () => {
      this.logger.log('Redis client connected');
      this.isConnected = true;
    });

    this.redisClient.on('ready', () => {
      this.logger.log('Redis client ready');
      this.isConnected = true;
    });

    this.redisClient.on('error', (error: Error) => {
      this.logger.error(`Redis client error: ${error.message}`);
      this.isConnected = false;
    });

    this.redisClient.on('close', () => {
      this.logger.warn('Redis client connection closed');
      this.isConnected = false;
    });

    this.redisClient.on('reconnecting', () => {
      this.logger.log('Redis client reconnecting...');
    });
  }

  /**
   * Get value from Redis cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Error getting key "${key}": ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Set value in Redis cache with optional TTL
   * @param key Cache key
   * @param value Value to store
   * @param ttl Time to live in seconds (default: no expiration)
   */
  async set(key: string, value: unknown, ttl?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.redisClient.setex(key, ttl, serialized);
      } else {
        await this.redisClient.set(key, serialized);
      }
      return true;
    } catch (error) {
      this.logger.error(`Error setting key "${key}": ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Delete key from Redis cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      await this.redisClient.del(key);
      return true;
    } catch (error) {
      this.logger.error(`Error deleting key "${key}": ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redisClient.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      return await this.redisClient.del(...keys);
    } catch (error) {
      this.logger.error(`Error deleting pattern "${pattern}": ${(error as Error).message}`);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redisClient.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking key existence "${key}": ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Set expiration time for a key
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.redisClient.expire(key, ttl);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error setting expiration for key "${key}": ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Get remaining time to live for a key
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.redisClient.ttl(key);
    } catch (error) {
      this.logger.error(`Error getting TTL for key "${key}": ${(error as Error).message}`);
      return -1;
    }
  }

  /**
   * Health check for Redis connection
   */
  async ping(): Promise<boolean> {
    try {
      const result = await this.redisClient.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.error(`Redis ping failed: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Get Redis connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected && this.redisClient.status === 'ready';
  }

  /**
   * Get Redis client info
   */
  async getInfo(): Promise<string | null> {
    try {
      return await this.redisClient.info();
    } catch (error) {
      this.logger.error(`Error getting Redis info: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Closing Redis connection...');
    await this.redisClient.quit();
  }
}
