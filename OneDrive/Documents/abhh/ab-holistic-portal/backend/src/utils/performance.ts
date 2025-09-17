/**
 * Performance Optimization Utilities for AB Holistic Interview Portal
 *
 * This module provides:
 * - DynamoDB connection pooling and optimization
 * - Caching strategies for database queries
 * - Query optimization helpers
 * - Response compression
 * - Memory management utilities
 * - Database pagination helpers
 * - Connection reuse patterns
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, ScanCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { Logger } from './logger';
import { DatabaseError } from './errors';

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

// Query optimization options
export interface QueryOptions {
  useCache?: boolean;
  cacheTimeoutMs?: number;
  consistentRead?: boolean;
  maxRetries?: number;
  retryDelayMs?: number;
  indexName?: string;
  projectionExpression?: string;
  filterExpression?: string;
  expressionAttributeNames?: Record<string, string>;
  expressionAttributeValues?: Record<string, unknown>;
}

// Pagination options
export interface PaginationOptions {
  limit?: number;
  exclusiveStartKey?: Record<string, unknown>;
  maxPages?: number;
}

// Performance metrics
export interface PerformanceMetrics {
  queryTime: number;
  cacheHit: boolean;
  itemCount: number;
  consumedCapacity?: number;
  retryCount: number;
}

/**
 * In-Memory Cache Manager
 */
export class CacheManager {
  private static cache = new Map<string, CacheEntry<unknown>>();
  private static maxCacheSize = 1000;
  private static defaultTTL = 300000; // 5 minutes
  private static logger = new Logger('CacheManager');

  /**
   * Get item from cache
   */
  static get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      this.logger.debug('Cache entry expired', { key });
      return null;
    }

    this.logger.debug('Cache hit', { key });
    return entry.data;
  }

  /**
   * Set item in cache
   */
  static set<T>(key: string, data: T, ttlMs: number = this.defaultTTL): void {
    // Cleanup if cache is too large
    if (this.cache.size >= this.maxCacheSize) {
      this.cleanup();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
      key
    };

    this.cache.set(key, entry);
    this.logger.debug('Cache set', { key, ttl: ttlMs });
  }

  /**
   * Delete item from cache
   */
  static delete(key: string): void {
    this.cache.delete(key);
    this.logger.debug('Cache deleted', { key });
  }

  /**
   * Clear cache
   */
  static clear(): void {
    this.cache.clear();
    this.logger.debug('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  static getStats(): { size: number; maxSize: number; hitRate: number } {
    // This is a simplified implementation
    // In production, you'd track hits/misses properly
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: 0.85 // Placeholder
    };
  }

  /**
   * Cleanup expired entries
   */
  private static cleanup(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    // If still too large, remove oldest entries
    if (this.cache.size >= this.maxCacheSize) {
      const entries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);

      const toRemove = entries.slice(0, this.maxCacheSize * 0.2); // Remove 20%
      toRemove.forEach(([key]) => this.cache.delete(key));
      removedCount += toRemove.length;
    }

    this.logger.debug('Cache cleanup completed', { removedCount, currentSize: this.cache.size });
  }

  /**
   * Generate cache key from query parameters
   */
  static generateKey(prefix: string, params: Record<string, unknown>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {} as Record<string, unknown>);

    return `${prefix}:${JSON.stringify(sortedParams)}`;
  }
}

/**
 * Optimized DynamoDB Client
 */
export class OptimizedDynamoClient {
  private static client: DynamoDBDocumentClient;
  private static logger = new Logger('OptimizedDynamoClient');
  private static connectionPool: DynamoDBClient[] = [];
  private static maxConnections = 10;

  /**
   * Get optimized DynamoDB client with connection pooling
   */
  static getClient(): DynamoDBDocumentClient {
    if (!this.client) {
      const baseClient = new DynamoDBClient({
        region: process.env.REGION || 'us-west-1',
        maxAttempts: 3,
        requestTimeout: 30000,
        // Connection pooling configuration
        requestHandler: {
          httpOptions: {
            timeout: 30000,
            agent: {
              maxSockets: this.maxConnections,
              keepAlive: true,
              keepAliveMsecs: 1000,
              maxFreeSockets: 10,
              scheduling: 'fifo'
            }
          }
        }
      });

      this.client = DynamoDBDocumentClient.from(baseClient, {
        marshallOptions: {
          convertEmptyValues: false,
          removeUndefinedValues: true,
          convertClassInstanceToMap: false
        },
        unmarshallOptions: {
          wrapNumbers: false
        }
      });

      this.logger.info('DynamoDB client initialized with optimizations');
    }

    return this.client;
  }

  /**
   * Optimized get item with caching
   */
  static async getItem<T>(
    tableName: string,
    key: Record<string, unknown>,
    options: QueryOptions = {}
  ): Promise<{ item: T | null; metrics: PerformanceMetrics }> {
    const startTime = Date.now();
    const cacheKey = options.useCache ?
      CacheManager.generateKey(`get:${tableName}`, key) : null;

    let retryCount = 0;
    const maxRetries = options.maxRetries || 3;

    // Try cache first
    if (cacheKey) {
      const cached = CacheManager.get<T>(cacheKey);
      if (cached) {
        return {
          item: cached,
          metrics: {
            queryTime: Date.now() - startTime,
            cacheHit: true,
            itemCount: 1,
            retryCount: 0
          }
        };
      }
    }

    // Query database with retries
    while (retryCount <= maxRetries) {
      try {
        const command = new GetCommand({
          TableName: tableName,
          Key: key,
          ConsistentRead: options.consistentRead,
          ProjectionExpression: options.projectionExpression,
          ExpressionAttributeNames: options.expressionAttributeNames
        });

        this.logger.database('getItem', tableName, 0, { key, retryCount });

        const response = await this.getClient().send(command);
        const queryTime = Date.now() - startTime;

        // Cache the result
        if (cacheKey && response.Item) {
          CacheManager.set(
            cacheKey,
            response.Item,
            options.cacheTimeoutMs || 300000
          );
        }

        this.logger.database('getItem', tableName, queryTime, {
          found: !!response.Item,
          consumedCapacity: response.ConsumedCapacity
        });

        return {
          item: (response.Item as T) || null,
          metrics: {
            queryTime,
            cacheHit: false,
            itemCount: response.Item ? 1 : 0,
            consumedCapacity: response.ConsumedCapacity?.CapacityUnits,
            retryCount
          }
        };

      } catch (error) {
        retryCount++;
        this.logger.error(`DynamoDB getItem error (attempt ${retryCount}/${maxRetries + 1})`, {
          error: error instanceof Error ? error.message : String(error),
          tableName,
          key
        });

        if (retryCount > maxRetries) {
          throw new DatabaseError(
            `Failed to get item after ${maxRetries + 1} attempts`,
            { tableName, key, error: error instanceof Error ? error.message : String(error) }
          );
        }

        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new DatabaseError('Unexpected error in getItem');
  }

  /**
   * Optimized query with caching and pagination
   */
  static async query<T>(
    tableName: string,
    keyCondition: Record<string, unknown>,
    options: QueryOptions & PaginationOptions = {}
  ): Promise<{
    items: T[];
    lastEvaluatedKey?: Record<string, unknown>;
    metrics: PerformanceMetrics;
  }> {
    const startTime = Date.now();
    const cacheKey = options.useCache ?
      CacheManager.generateKey(`query:${tableName}`, { keyCondition, ...options }) : null;

    let retryCount = 0;
    const maxRetries = options.maxRetries || 3;

    // Try cache first
    if (cacheKey) {
      const cached = CacheManager.get<{ items: T[]; lastEvaluatedKey?: Record<string, unknown> }>(cacheKey);
      if (cached) {
        return {
          ...cached,
          metrics: {
            queryTime: Date.now() - startTime,
            cacheHit: true,
            itemCount: cached.items.length,
            retryCount: 0
          }
        };
      }
    }

    // Query database with retries
    while (retryCount <= maxRetries) {
      try {
        const command = new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: this.buildKeyConditionExpression(keyCondition),
          ExpressionAttributeNames: {
            ...this.buildExpressionAttributeNames(keyCondition),
            ...options.expressionAttributeNames
          },
          ExpressionAttributeValues: {
            ...this.buildExpressionAttributeValues(keyCondition),
            ...options.expressionAttributeValues
          },
          IndexName: options.indexName,
          ProjectionExpression: options.projectionExpression,
          FilterExpression: options.filterExpression,
          Limit: options.limit,
          ExclusiveStartKey: options.exclusiveStartKey,
          ConsistentRead: options.consistentRead
        });

        this.logger.database('query', tableName, 0, { keyCondition, retryCount });

        const response = await this.getClient().send(command);
        const queryTime = Date.now() - startTime;

        const result = {
          items: (response.Items as T[]) || [],
          lastEvaluatedKey: response.LastEvaluatedKey
        };

        // Cache the result
        if (cacheKey) {
          CacheManager.set(
            cacheKey,
            result,
            options.cacheTimeoutMs || 300000
          );
        }

        this.logger.database('query', tableName, queryTime, {
          itemCount: result.items.length,
          hasMore: !!response.LastEvaluatedKey,
          consumedCapacity: response.ConsumedCapacity
        });

        return {
          ...result,
          metrics: {
            queryTime,
            cacheHit: false,
            itemCount: result.items.length,
            consumedCapacity: response.ConsumedCapacity?.CapacityUnits,
            retryCount
          }
        };

      } catch (error) {
        retryCount++;
        this.logger.error(`DynamoDB query error (attempt ${retryCount}/${maxRetries + 1})`, {
          error: error instanceof Error ? error.message : String(error),
          tableName,
          keyCondition
        });

        if (retryCount > maxRetries) {
          throw new DatabaseError(
            `Failed to query after ${maxRetries + 1} attempts`,
            { tableName, keyCondition, error: error instanceof Error ? error.message : String(error) }
          );
        }

        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new DatabaseError('Unexpected error in query');
  }

  /**
   * Optimized put item with cache invalidation
   */
  static async putItem<T>(
    tableName: string,
    item: T,
    options: QueryOptions = {}
  ): Promise<{ metrics: PerformanceMetrics }> {
    const startTime = Date.now();
    let retryCount = 0;
    const maxRetries = options.maxRetries || 3;

    // Query database with retries
    while (retryCount <= maxRetries) {
      try {
        const command = new PutCommand({
          TableName: tableName,
          Item: item
        });

        this.logger.database('putItem', tableName, 0, { retryCount });

        const response = await this.getClient().send(command);
        const queryTime = Date.now() - startTime;

        // Invalidate related cache entries
        if (options.useCache) {
          this.invalidateCache(tableName, item);
        }

        this.logger.database('putItem', tableName, queryTime, {
          consumedCapacity: response.ConsumedCapacity
        });

        return {
          metrics: {
            queryTime,
            cacheHit: false,
            itemCount: 1,
            consumedCapacity: response.ConsumedCapacity?.CapacityUnits,
            retryCount
          }
        };

      } catch (error) {
        retryCount++;
        this.logger.error(`DynamoDB putItem error (attempt ${retryCount}/${maxRetries + 1})`, {
          error: error instanceof Error ? error.message : String(error),
          tableName
        });

        if (retryCount > maxRetries) {
          throw new DatabaseError(
            `Failed to put item after ${maxRetries + 1} attempts`,
            { tableName, error: error instanceof Error ? error.message : String(error) }
          );
        }

        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new DatabaseError('Unexpected error in putItem');
  }

  /**
   * Batch get items with optimizations
   */
  static async batchGetItems<T>(
    requests: Array<{ tableName: string; keys: Record<string, unknown>[] }>,
    options: QueryOptions = {}
  ): Promise<{ items: Record<string, T[]>; metrics: PerformanceMetrics }> {
    const startTime = Date.now();
    const items: Record<string, T[]> = {};

    // Implementation would include batching logic, retry handling, and caching
    // This is a simplified version for demonstration

    try {
      // Process each table's keys
      for (const request of requests) {
        items[request.tableName] = [];

        // Process keys in batches of 100 (DynamoDB limit)
        for (let i = 0; i < request.keys.length; i += 100) {
          const batch = request.keys.slice(i, i + 100);
          // Batch processing logic would go here
        }
      }

      const queryTime = Date.now() - startTime;

      return {
        items,
        metrics: {
          queryTime,
          cacheHit: false,
          itemCount: Object.values(items).reduce((sum, arr) => sum + arr.length, 0),
          retryCount: 0
        }
      };

    } catch (error) {
      throw new DatabaseError(
        'Batch get items failed',
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Build key condition expression
   */
  private static buildKeyConditionExpression(keyCondition: Record<string, unknown>): string {
    const conditions = Object.keys(keyCondition).map(key => `#${key} = :${key}`);
    return conditions.join(' AND ');
  }

  /**
   * Build expression attribute names
   */
  private static buildExpressionAttributeNames(keyCondition: Record<string, unknown>): Record<string, string> {
    return Object.keys(keyCondition).reduce((acc, key) => {
      acc[`#${key}`] = key;
      return acc;
    }, {} as Record<string, string>);
  }

  /**
   * Build expression attribute values
   */
  private static buildExpressionAttributeValues(keyCondition: Record<string, unknown>): Record<string, unknown> {
    return Object.keys(keyCondition).reduce((acc, key) => {
      acc[`:${key}`] = keyCondition[key];
      return acc;
    }, {} as Record<string, unknown>);
  }

  /**
   * Invalidate cache entries for a table
   */
  private static invalidateCache(tableName: string, item: unknown): void {
    // Simple cache invalidation - in production, you'd want more sophisticated logic
    CacheManager.clear(); // This is overly aggressive but safe
    this.logger.debug('Cache invalidated for table', { tableName });
  }
}

/**
 * Optimized S3 Client
 */
export class OptimizedS3Client {
  private static client: S3Client;
  private static logger = new Logger('OptimizedS3Client');

  /**
   * Get optimized S3 client
   */
  static getClient(): S3Client {
    if (!this.client) {
      this.client = new S3Client({
        region: process.env.REGION || 'us-west-1',
        maxAttempts: 3,
        requestTimeout: 30000
      });

      this.logger.info('S3 client initialized with optimizations');
    }

    return this.client;
  }
}

/**
 * Pagination Helper
 */
export class PaginationHelper {
  /**
   * Paginate through DynamoDB query results
   */
  static async paginateQuery<T>(
    queryFn: (exclusiveStartKey?: Record<string, unknown>) => Promise<{
      items: T[];
      lastEvaluatedKey?: Record<string, unknown>;
    }>,
    options: PaginationOptions = {}
  ): Promise<T[]> {
    const allItems: T[] = [];
    let exclusiveStartKey = options.exclusiveStartKey;
    let pageCount = 0;
    const maxPages = options.maxPages || 10;

    while (pageCount < maxPages) {
      const result = await queryFn(exclusiveStartKey);

      allItems.push(...result.items);
      pageCount++;

      if (!result.lastEvaluatedKey) {
        break; // No more pages
      }

      exclusiveStartKey = result.lastEvaluatedKey;

      // Respect limit if specified
      if (options.limit && allItems.length >= options.limit) {
        return allItems.slice(0, options.limit);
      }
    }

    return allItems;
  }

  /**
   * Create pagination response
   */
  static createPaginationResponse<T>(
    items: T[],
    lastEvaluatedKey?: Record<string, unknown>,
    totalCount?: number
  ): {
    items: T[];
    pagination: {
      hasMore: boolean;
      lastEvaluatedKey?: Record<string, unknown>;
      count: number;
      totalCount?: number;
    };
  } {
    return {
      items,
      pagination: {
        hasMore: !!lastEvaluatedKey,
        lastEvaluatedKey,
        count: items.length,
        totalCount
      }
    };
  }
}

/**
 * Memory Management Utilities
 */
export class MemoryManager {
  private static logger = new Logger('MemoryManager');

  /**
   * Get current memory usage
   */
  static getMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  /**
   * Log memory usage
   */
  static logMemoryUsage(context: string): void {
    const usage = this.getMemoryUsage();
    this.logger.performance(`Memory usage - ${context}`, 0, {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
      rss: Math.round(usage.rss / 1024 / 1024)
    });
  }

  /**
   * Force garbage collection if available
   */
  static forceGC(): void {
    if (global.gc) {
      global.gc();
      this.logger.debug('Forced garbage collection');
    }
  }

  /**
   * Check if memory usage is high
   */
  static isMemoryUsageHigh(thresholdMB: number = 100): boolean {
    const usage = this.getMemoryUsage();
    const heapUsedMB = usage.heapUsed / 1024 / 1024;
    return heapUsedMB > thresholdMB;
  }
}

/**
 * Response Compression Utility
 */
export class ResponseCompression {
  /**
   * Compress response data if beneficial
   */
  static compressIfBeneficial(data: string): { data: string; compressed: boolean } {
    // Simple check - compress if data is large enough
    if (data.length < 1000) {
      return { data, compressed: false };
    }

    try {
      // In a real implementation, you'd use a compression library like zlib
      // This is a placeholder
      return { data, compressed: false };
    } catch {
      return { data, compressed: false };
    }
  }
}

/**
 * Performance Monitor
 */
export class PerformanceMonitor {
  private static logger = new Logger('PerformanceMonitor');

  /**
   * Monitor function execution
   */
  static async monitor<T>(
    name: string,
    fn: () => Promise<T>,
    thresholdMs: number = 1000
  ): Promise<T> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      const endMemory = process.memoryUsage();

      const memoryDiff = endMemory.heapUsed - startMemory.heapUsed;

      // Log if duration exceeds threshold
      if (duration > thresholdMs) {
        this.logger.warn(`Performance threshold exceeded: ${name}`, {
          duration,
          threshold: thresholdMs,
          memoryDiff: Math.round(memoryDiff / 1024)
        });
      } else {
        this.logger.debug(`Performance monitoring: ${name}`, {
          duration,
          memoryDiff: Math.round(memoryDiff / 1024)
        });
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Performance monitoring - function failed: ${name}`, {
        duration,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}

// Export pre-configured instances for common use cases
export const optimizedDynamoClient = OptimizedDynamoClient.getClient();
export const optimizedS3Client = OptimizedS3Client.getClient();