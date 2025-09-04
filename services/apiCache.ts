interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheOptions {
  ttl?: number; // Default 5 minutes
  key?: string; // Custom cache key
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate a cache key from URL and params
   */
  private generateKey(url: string, params?: Record<string, any>): string {
    const paramStr = params ? JSON.stringify(params) : '';
    return `${url}${paramStr}`;
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Get cached data if available and not expired
   */
  get<T>(url: string, params?: Record<string, any>): T | null {
    const key = this.generateKey(url, params);
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set data in cache
   */
  set<T>(url: string, data: T, options: CacheOptions = {}, params?: Record<string, any>): void {
    const key = options.key || this.generateKey(url, params);
    const ttl = options.ttl || this.defaultTTL;

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Clear specific cache entry
   */
  clear(url: string, params?: Record<string, any>): void {
    const key = this.generateKey(url, params);
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Clean expired entries
   */
  clean(): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((entry, key) => {
      if (this.isExpired(entry)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Execute function with caching
   */
  async executeWithCache<T>(
    fn: () => Promise<T>,
    url: string,
    options: CacheOptions = {},
    params?: Record<string, any>
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.get<T>(url, params);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn();
    this.set(url, result, options, params);
    return result;
  }
}

// Singleton instance
export const apiCache = new APICache();

// Auto-clean expired entries every 5 minutes
setInterval(() => {
  apiCache.clean();
}, 5 * 60 * 1000);
