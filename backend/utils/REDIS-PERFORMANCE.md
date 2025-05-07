# Redis Performance Measurement Utilities

This document explains the Redis performance measurement utilities added to the ShelfX application to help measure and compare API response times with and without Redis caching.

## Features Added

1. **Automatic Performance Logging in Middleware**
   - All GET requests now automatically log performance metrics to the console
   - Shows cache hits, misses, and response times in milliseconds
   - No configuration needed - works automatically with existing caching system

2. **Benchmark Utility**
   - Located in `cacheManager.js`
   - Allows explicit testing of Redis performance for any endpoint
   - Compares cached vs. uncached response times
   - Calculates performance improvement percentage

3. **Benchmark Script**
   - Located at `utils/redisBenchmark.js`
   - Demonstrates how to use the benchmark utility
   - Can be run directly to test sample endpoints

## How to Use

### Automatic Performance Logging

The middleware automatically logs performance data for all GET requests. You'll see output like this in your console:

```
[REDIS PERFORMANCE] Cache MISS: /api/books - Response time: 120.45ms
[REDIS PERFORMANCE] Cache HIT: /api/books - Response time: 5.23ms
```

### Running the Benchmark Utility

#### Option 1: Use the provided script

```bash
node backend/utils/redisBenchmark.js
```

#### Option 2: Use the utility directly in your code

```javascript
import cacheManager from './utils/cacheManager.js';

// Test a specific endpoint with 5 iterations
const results = await cacheManager.benchmarkCache('/api/books', 5);
console.log(results);
```

## Sample Output

The benchmark utility produces detailed output like this:

```
===== REDIS CACHE PERFORMANCE BENCHMARK =====
Testing URL: /api/books
Iterations: 5
-------------------------------------------

Testing without cache:
Uncached response time: 105.67ms

Testing with cache:
Cached response time (iteration 1): 3.45ms
Cached response time (iteration 2): 2.98ms
Cached response time (iteration 3): 3.12ms
Cached response time (iteration 4): 2.87ms
Cached response time (iteration 5): 3.05ms

===== BENCHMARK RESULTS =====
Average uncached response time: 105.67ms
Average cached response time: 3.09ms
Performance improvement: 97.08%
==============================
```

## Understanding the Results

- **Uncached response time**: Time taken to fetch data without Redis cache
- **Cached response time**: Time taken when data is retrieved from Redis
- **Performance improvement**: Percentage improvement when using Redis

Typically, you should see significant performance improvements (often 90%+) when using Redis caching for database-heavy operations.