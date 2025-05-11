# Redis Caching for Shortly

This document describes the Redis caching implementation for the Shortly URL shortening service.

## Overview

Redis is used to improve performance and scalability of the URL redirection system by:

1. Caching frequently accessed shortened URLs
2. Providing fast click counting
3. Reducing database load for high-traffic URLs

## Configuration

Redis is configured through environment variables:

```
REDIS_HOST=redis        # Redis server hostname
REDIS_PORT=6379         # Redis server port
REDIS_PASSWORD=         # Redis password (if required)
REDIS_URL=redis://redis:6379  # Redis connection URL
REDIS_TTL=3600          # Default TTL for cached items (in seconds)
```

## Implementation Details

### Redis Service

The Redis service (`redis.service.ts`) provides a simple interface for interacting with Redis:

- `get<T>(key: string)`: Get a value from the cache
- `set(key: string, value: any, ttl?: number)`: Set a value in the cache
- `del(key: string)`: Delete a value from the cache
- `exists(key: string)`: Check if a key exists in the cache
- `increment(key: string, increment?: number)`: Increment a counter
- `flushAll()`: Clear all data from Redis

### Caching Strategy

#### URL Lookups

When a user visits a shortened URL:

1. The system first checks Redis for the URL data using the key pattern `url:{short_code}`
2. If found, the URL data is returned directly from Redis
3. If not found, the system queries the database and caches the result in Redis
4. The TTL for cached URLs is set to 1 hour by default (configurable via `REDIS_TTL`)

#### Click Counting

For click counting:

1. When a URL is clicked, the click is first recorded in Redis using the key pattern `clicks:{url_id}`
2. The click is also recorded in the database for permanent storage
3. When retrieving click counts, the system first checks Redis for the count
4. If not found, it queries the database and caches the result

### Cache Invalidation

The cache is invalidated in the following scenarios:

1. When a URL is deleted, its cache entry is removed
2. When a URL is created, its data is immediately cached

## Performance Benefits

The Redis caching implementation provides several performance benefits:

1. **Reduced Database Load**: Frequently accessed URLs are served from Redis, reducing database queries
2. **Faster Response Times**: Redis lookups are significantly faster than database queries
3. **Improved Scalability**: The system can handle more concurrent requests with the same resources
4. **Real-time Click Counting**: Click counts can be updated and retrieved quickly without database overhead

## Monitoring

Performance metrics are logged to help monitor and optimize the caching system:

- URL lookup times are logged with `console.debug`
- Redis errors are logged with `console.error` and the system falls back to database queries

## Future Improvements

Potential future improvements to the caching system:

1. **Distributed Rate Limiting**: Use Redis to implement rate limiting for API endpoints
2. **Cache Preloading**: Preload popular URLs into the cache during startup
3. **Cache Analytics**: Track cache hit/miss rates for optimization
4. **Adaptive TTL**: Adjust TTL based on URL popularity
5. **Cluster Support**: Configure Redis for high availability with Redis Cluster
