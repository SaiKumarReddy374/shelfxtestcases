import redisClient, { clearCache } from '../config/redis.js';

/**
 * Cache Manager Utility
 * Provides functions to manage Redis cache for the ShelfX application
 * Includes performance measurement utilities
 */

// Clear cache for specific routes when data changes
const cacheManager = {
  // Clear all book-related caches
  clearBookCache: async () => {
    await clearCache('books');
    await clearCache('api/books');
  },

  // Clear user-specific caches
  clearUserCache: async (userId) => {
    await clearCache(`users/${userId}`);
    await clearCache(`api/users/${userId}`);
  },

  // Clear seller-specific caches
  clearSellerCache: async (sellerId) => {
    await clearCache(`sellers/${sellerId}`);
    await clearCache(`api/sellers/${sellerId}`);
  },

  // Clear buyer-specific caches
  clearBuyerCache: async (buyerId) => {
    await clearCache(`buyers/${buyerId}`);
    await clearCache(`api/buyers/${buyerId}`);
  },

  // Clear admin-related caches
  clearAdminCache: async () => {
    await clearCache('admin');
    await clearCache('api/admin');
  },

  // Clear all caches
  clearAllCache: async () => {
    await clearCache();
  },

  // Get cache status
  getCacheStatus: async () => {
    try {
      if (!redisClient.isOpen) {
        await redisClient.connect();
      }
      const info = await redisClient.info();
      return {
        connected: redisClient.isOpen,
        info
      };
    } catch (error) {
      console.error('Error getting cache status:', error);
      return {
        connected: false,
        error: error.message
      };
    }
  },
  
  // Performance benchmark utility
  benchmarkCache: async (url, iterations = 5) => {
    try {
      if (!redisClient.isOpen) {
        await redisClient.connect();
      }
      
      // Ensure the cache key follows the same pattern as in middleware
      const key = `shelfx:${url}`;
      
      // Clear any existing cache for this URL
      await redisClient.del(key);
      
      console.log('\n===== REDIS CACHE PERFORMANCE BENCHMARK =====');
      console.log(`Testing URL: ${url}`);
      console.log(`Iterations: ${iterations}`);
      console.log('-------------------------------------------');
      
      // Simulate uncached requests (first request)
      console.log('\nTesting without cache:');
      const uncachedTimes = [];
      
      // Mock data for testing
      const testData = { test: 'data', timestamp: Date.now() };
      
      // First request - no cache
      const uncachedStart = performance.now();
      // Simulate database operation
      await new Promise(resolve => setTimeout(resolve, 100));
      await redisClient.setEx(key, 3600, JSON.stringify(testData));
      const uncachedEnd = performance.now();
      const uncachedTime = uncachedEnd - uncachedStart;
      uncachedTimes.push(uncachedTime);
      console.log(`Uncached response time: ${uncachedTime.toFixed(2)}ms`);
      
      // Simulate cached requests
      console.log('\nTesting with cache:');
      const cachedTimes = [];
      
      for (let i = 0; i < iterations; i++) {
        const cachedStart = performance.now();
        const cachedData = await redisClient.get(key);
        const parsedData = JSON.parse(cachedData);
        const cachedEnd = performance.now();
        const cachedTime = cachedEnd - cachedStart;
        cachedTimes.push(cachedTime);
        console.log(`Cached response time (iteration ${i+1}): ${cachedTime.toFixed(2)}ms`);
      }
      
      // Calculate and display statistics
      const avgUncachedTime = uncachedTimes.reduce((a, b) => a + b, 0) / uncachedTimes.length;
      const avgCachedTime = cachedTimes.reduce((a, b) => a + b, 0) / cachedTimes.length;
      const improvement = ((avgUncachedTime - avgCachedTime) / avgUncachedTime) * 100;
      
      console.log('\n===== BENCHMARK RESULTS =====');
      console.log(`Average uncached response time: ${avgUncachedTime.toFixed(2)}ms`);
      console.log(`Average cached response time: ${avgCachedTime.toFixed(2)}ms`);
      console.log(`Performance improvement: ${improvement.toFixed(2)}%`);
      console.log('==============================\n');
      
      return {
        uncachedTime: avgUncachedTime,
        cachedTime: avgCachedTime,
        improvement: improvement
      };
    } catch (error) {
      console.error('Error during cache benchmark:', error);
      return {
        error: error.message
      };
    }
  }
};

export default cacheManager;