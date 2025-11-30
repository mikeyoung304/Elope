/**
 * In-Memory Cache Adapter
 *
 * Development/testing cache implementation.
 * No persistence, cleared on restart.
 *
 * Features:
 * - Simple Map-based storage
 * - TTL support with automatic expiration
 * - Pattern matching for flush operations
 * - Statistics tracking for monitoring
 */

import type { CacheServicePort } from '../../lib/ports';
import { DEFAULT_CACHE_TTL_SECONDS } from '../../lib/ports';
import { logger } from '../../lib/core/logger';

interface CacheEntry {
  value: any;
  expiresAt: number;
}

export class InMemoryCacheAdapter implements CacheServicePort {
  private cache = new Map<string, CacheEntry>();
  private hitCount = 0;
  private missCount = 0;

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.missCount++;
      return null;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

    this.hitCount++;
    return entry.value as T;
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    // Apply default TTL if not provided to prevent indefinite caching
    const ttl = ttlSeconds ?? DEFAULT_CACHE_TTL_SECONDS;

    const entry: CacheEntry = {
      value,
      expiresAt: Date.now() + ttl * 1000,
    };

    this.cache.set(key, entry);
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async flush(pattern?: string): Promise<void> {
    // If no pattern provided, flush all keys
    if (!pattern) {
      const count = this.cache.size;
      this.cache.clear();
      if (count > 0) {
        logger.debug({ count }, 'In-memory cache flushed all keys');
      }
      return;
    }

    // Convert pattern to regex (simple pattern matching)
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');

    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }

    if (keysToDelete.length > 0) {
      logger.debug({ pattern, count: keysToDelete.length }, 'In-memory cache keys flushed');
    }
  }

  async isConnected(): Promise<boolean> {
    return true; // In-memory cache is always available
  }

  async getStats(): Promise<{
    hits: number;
    misses: number;
    keys: number;
    totalRequests: number;
    hitRate: string;
  }> {
    // Clean up expired entries before counting
    this.cleanupExpired();

    const keys = this.cache.size;
    const totalRequests = this.hitCount + this.missCount;
    const hitRate =
      totalRequests > 0 ? ((this.hitCount / totalRequests) * 100).toFixed(2) + '%' : '0%';

    return {
      hits: this.hitCount,
      misses: this.missCount,
      keys,
      totalRequests,
      hitRate,
    };
  }

  /**
   * Clear all cache entries (for testing)
   */
  clear(): void {
    this.cache.clear();
    logger.debug('In-memory cache cleared');
  }

  /**
   * Reset statistics counters (for testing)
   */
  resetStats(): void {
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * Cleanup expired entries (garbage collection)
   * Called periodically and before getStats()
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }

    if (keysToDelete.length > 0) {
      logger.debug({ count: keysToDelete.length }, 'Expired cache entries cleaned up');
    }
  }
}
