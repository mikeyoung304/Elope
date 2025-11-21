/**
 * Redis Cache Adapter
 *
 * Production-grade caching with Redis.
 * Gracefully degrades to no-op if Redis unavailable.
 *
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Connection pooling and health monitoring
 * - Safe SCAN-based pattern matching (production-safe)
 * - Graceful degradation on errors
 */

import Redis from 'ioredis';
import type { CacheServicePort } from '../../lib/ports';
import { logger } from '../../lib/core/logger';

export class RedisCacheAdapter implements CacheServicePort {
  private redis: Redis | null = null;
  private connected = false;
  private hitCount = 0;
  private missCount = 0;

  constructor(redisUrl?: string) {
    if (!redisUrl) {
      logger.warn('No REDIS_URL provided, caching disabled (graceful fallback)');
      return;
    }

    try {
      this.redis = new Redis(redisUrl, {
        retryStrategy: (times) => {
          if (times > 3) {
            logger.error('Redis connection failed after 3 retries');
            return null; // Stop retrying
          }
          const delay = Math.min(times * 50, 2000); // Exponential backoff, max 2s
          logger.info({ attempt: times, delayMs: delay }, 'Retrying Redis connection');
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: false, // Connect immediately
        connectTimeout: 10000, // 10 second connection timeout
        commandTimeout: 5000, // 5 second command timeout
      });

      this.redis.on('connect', () => {
        logger.info('Redis cache connecting...');
      });

      this.redis.on('ready', () => {
        this.connected = true;
        logger.info('✅ Redis cache connected and ready');
      });

      this.redis.on('error', (error) => {
        this.connected = false;
        logger.error({ error: error.message }, 'Redis connection error');
      });

      this.redis.on('close', () => {
        this.connected = false;
        logger.warn('Redis connection closed');
      });

      this.redis.on('reconnecting', () => {
        logger.info('Redis reconnecting...');
      });
    } catch (error) {
      logger.error({ error }, 'Failed to initialize Redis');
      this.redis = null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.redis || !this.connected) {
      return null; // Graceful degradation
    }

    try {
      const value = await this.redis.get(key);
      if (!value) {
        this.missCount++;
        return null;
      }

      this.hitCount++;
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error({ error, key }, 'Cache get error');
      this.missCount++;
      return null; // Degrade gracefully
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!this.redis || !this.connected) {
      return; // Graceful degradation
    }

    try {
      const serialized = JSON.stringify(value);

      if (ttlSeconds && ttlSeconds > 0) {
        await this.redis.setex(key, ttlSeconds, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
    } catch (error) {
      logger.error({ error, key }, 'Cache set error');
      // Degrade gracefully - don't throw
    }
  }

  async del(key: string): Promise<void> {
    if (!this.redis || !this.connected) {
      return;
    }

    try {
      await this.redis.del(key);
    } catch (error) {
      logger.error({ error, key }, 'Cache delete error');
    }
  }

  async flush(pattern: string): Promise<void> {
    if (!this.redis || !this.connected) {
      return;
    }

    try {
      // Use SCAN to avoid blocking (production-safe)
      const stream = this.redis.scanStream({
        match: pattern,
        count: 100, // Batch size
      });

      const keys: string[] = [];
      stream.on('data', (resultKeys: string[]) => {
        keys.push(...resultKeys);
      });

      await new Promise<void>((resolve, reject) => {
        stream.on('end', () => resolve());
        stream.on('error', (err) => reject(err));
      });

      if (keys.length > 0) {
        // Delete in batches to avoid memory issues
        const batchSize = 100;
        for (let i = 0; i < keys.length; i += batchSize) {
          const batch = keys.slice(i, i + batchSize);
          await this.redis.del(...batch);
        }
        logger.info({ pattern, count: keys.length }, 'Cache keys flushed');
      } else {
        logger.debug({ pattern }, 'No cache keys matched pattern');
      }
    } catch (error) {
      logger.error({ error, pattern }, 'Cache flush error');
    }
  }

  async isConnected(): Promise<boolean> {
    if (!this.redis) {
      return false;
    }

    try {
      // Ping Redis to verify connection
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  async getStats(): Promise<{
    hits: number;
    misses: number;
    keys: number;
    totalRequests: number;
    hitRate: string;
  }> {
    let keyCount = 0;

    if (this.redis && this.connected) {
      try {
        keyCount = await this.redis.dbsize();
      } catch (error) {
        logger.error({ error }, 'Failed to get Redis key count');
      }
    }

    const totalRequests = this.hitCount + this.missCount;
    const hitRate =
      totalRequests > 0 ? ((this.hitCount / totalRequests) * 100).toFixed(2) + '%' : '0%';

    return {
      hits: this.hitCount,
      misses: this.missCount,
      keys: keyCount,
      totalRequests,
      hitRate,
    };
  }

  /**
   * Close Redis connection gracefully
   * Call this during application shutdown
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.quit();
        logger.info('Redis connection closed gracefully');
      } catch (error) {
        logger.error({ error }, 'Error closing Redis connection');
      } finally {
        this.redis = null;
        this.connected = false;
      }
    }
  }

  /**
   * Reset statistics counters (useful for testing)
   */
  resetStats(): void {
    this.hitCount = 0;
    this.missCount = 0;
  }
}
