/**
 * Application-level caching service (Legacy/Deprecated)
 *
 * DEPRECATED: Use CacheServicePort adapters instead (RedisCacheAdapter or InMemoryCacheAdapter)
 * This class is kept for backward compatibility with existing code during migration.
 *
 * New code should use the async CacheServicePort interface from ports.ts
 */

import NodeCache from 'node-cache';
import { logger } from './core/logger';

export class CacheService {
  private cache: NodeCache;
  private hitCount = 0;
  private missCount = 0;

  constructor(ttlSeconds: number = 300) {
    this.cache = new NodeCache({
      stdTTL: ttlSeconds,
      checkperiod: ttlSeconds * 0.2,
      useClones: false, // Return references for performance
    });

    // Log cache stats periodically in non-production
    if (process.env.NODE_ENV !== 'production') {
      setInterval(() => {
        const stats = this.getStats();
        if (stats.totalRequests > 0) {
          logger.debug({
            hits: stats.hits,
            misses: stats.misses,
            hitRate: stats.hitRate,
            keys: stats.keys,
          }, 'Cache statistics');
        }
      }, 60000); // Log every minute
    }
  }

  get<T>(key: string): T | undefined {
    const value = this.cache.get<T>(key);
    if (value !== undefined) {
      this.hitCount++;
      logger.debug({ key }, 'Cache HIT');
    } else {
      this.missCount++;
      logger.debug({ key }, 'Cache MISS');
    }
    return value;
  }

  set<T>(key: string, value: T, ttl?: number): boolean {
    const success = this.cache.set(key, value, ttl || 0);
    if (success) {
      logger.debug({ key, ttl: ttl || 'default' }, 'Cache SET');
    }
    return success;
  }

  del(key: string): number {
    const deleted = this.cache.del(key);
    if (deleted > 0) {
      logger.debug({ key }, 'Cache DELETE');
    }
    return deleted;
  }

  delMultiple(keys: string[]): number {
    const deleted = this.cache.del(keys);
    if (deleted > 0) {
      logger.debug({ keys, count: deleted }, 'Cache DELETE multiple');
    }
    return deleted;
  }

  flush(): void {
    this.cache.flushAll();
    logger.info('Cache flushed');
  }

  getStats(): {
    hits: number;
    misses: number;
    keys: number;
    totalRequests: number;
    hitRate: string;
  } {
    const keys = this.cache.keys().length;
    const totalRequests = this.hitCount + this.missCount;
    const hitRate = totalRequests > 0
      ? ((this.hitCount / totalRequests) * 100).toFixed(2) + '%'
      : '0%';

    return {
      hits: this.hitCount,
      misses: this.missCount,
      keys,
      totalRequests,
      hitRate,
    };
  }

  resetStats(): void {
    this.hitCount = 0;
    this.missCount = 0;
  }
}
