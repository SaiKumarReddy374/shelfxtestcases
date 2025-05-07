/**
 * Redis Performance Benchmark Utility
 * 
 * This script demonstrates how to use the Redis cache performance measurement utilities
 * to compare response times with and without Redis caching.
 */

import cacheManager from './cacheManager.js';

// Example usage of the benchmarking utility
const runBenchmark = async () => {
  console.log('Starting Redis cache performance benchmark...');
  
  // Test with a sample API endpoint
  // You can replace this with any actual endpoint in your application
  const testEndpoints = [
    '/api/books',
    '/api/users',
    '/api/sellers'
  ];
  
  // Run benchmark for each endpoint
  for (const endpoint of testEndpoints) {
    console.log(`\nBenchmarking endpoint: ${endpoint}`);
    await cacheManager.benchmarkCache(endpoint, 5);
  }
  
  console.log('\nBenchmark complete!');
  console.log('Note: The middleware will automatically log performance metrics for all GET requests.');
  console.log('Check your server logs to see real-world performance differences.');
};

// Execute the benchmark
runBenchmark().catch(error => {
  console.error('Benchmark error:', error);
});

/**
 * How to use this utility:
 * 
 * 1. Run this script directly with Node.js:
 *    node utils/redisBenchmark.js
 * 
 * 2. Or import and use in your application:
 *    import { runBenchmark } from './utils/redisBenchmark.js';
 *    runBenchmark();
 * 
 * 3. For real-world metrics, the cacheMiddleware will automatically log
 *    performance data for all GET requests in your application.
 */