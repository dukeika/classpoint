/**
 * Comprehensive Logging System for AB Holistic Interview Portal
 *
 * This module provides:
 * - Structured logging with JSON format
 * - Multiple log levels with filtering
 * - Request correlation and tracing
 * - Performance monitoring
 * - Security audit logging
 * - AWS CloudWatch integration ready
 */

import { Context } from 'aws-lambda';

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

// Log categories for better organization
export enum LogCategory {
  APPLICATION = 'application',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  DATABASE = 'database',
  EXTERNAL_API = 'external_api',
  BUSINESS_LOGIC = 'business_logic',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  AUDIT = 'audit'
}

// Base log entry interface
export interface LogEntry {
  timestamp: string;
  level: string;
  category: LogCategory;
  message: string;
  context: string;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
  performance?: PerformanceMetrics;
  security?: SecurityContext;
  error?: ErrorContext;
}

// Performance metrics for monitoring
export interface PerformanceMetrics {
  duration: number;
  memoryUsed: number;
  memoryTotal: number;
  dbQueryCount?: number;
  dbQueryDuration?: number;
  externalApiCalls?: number;
  externalApiDuration?: number;
}

// Security context for audit logging
export interface SecurityContext {
  ipAddress?: string;
  userAgent?: string;
  action: string;
  resource: string;
  result: 'success' | 'failure' | 'blocked';
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  additionalInfo?: Record<string, unknown>;
}

// Error context for detailed error logging
export interface ErrorContext {
  errorCode: string;
  errorType: string;
  stackTrace?: string;
  previousError?: string;
  recovery?: string;
}

/**
 * Main Logger Class
 */
export class Logger {
  private context: string;
  private requestId?: string;
  private userId?: string;
  private sessionId?: string;
  private correlationId?: string;
  private startTime: number;
  private performanceCounters: Map<string, number> = new Map();

  // Current log level (configurable via environment)
  private static currentLevel: LogLevel = this.getLogLevelFromEnv();

  constructor(context: string) {
    this.context = context;
    this.startTime = Date.now();
  }

  /**
   * Set request context for correlation
   */
  setRequestContext(
    requestId: string,
    userId?: string,
    sessionId?: string,
    correlationId?: string
  ): void {
    this.requestId = requestId;
    this.userId = userId;
    this.sessionId = sessionId;
    this.correlationId = correlationId;
  }

  /**
   * Create logger from Lambda context
   */
  static fromLambdaContext(context: Context, loggerName: string): Logger {
    const logger = new Logger(loggerName);
    logger.setRequestContext(
      context.awsRequestId,
      undefined,
      undefined,
      context.awsRequestId
    );
    return logger;
  }

  /**
   * Debug level logging
   */
  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, LogCategory.APPLICATION, message, metadata);
  }

  /**
   * Info level logging
   */
  info(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, LogCategory.APPLICATION, message, metadata);
  }

  /**
   * Warning level logging
   */
  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, LogCategory.APPLICATION, message, metadata);
  }

  /**
   * Error level logging
   */
  error(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, LogCategory.APPLICATION, message, metadata);
  }

  /**
   * Critical level logging
   */
  critical(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.CRITICAL, LogCategory.APPLICATION, message, metadata);
  }

  /**
   * Security audit logging
   */
  securityAudit(
    action: string,
    resource: string,
    result: 'success' | 'failure' | 'blocked',
    riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low',
    ipAddress?: string,
    userAgent?: string,
    additionalInfo?: Record<string, unknown>
  ): void {
    const securityContext: SecurityContext = {
      action,
      resource,
      result,
      riskLevel,
      ipAddress,
      userAgent,
      additionalInfo
    };

    const level = result === 'failure' || result === 'blocked' ? LogLevel.WARN : LogLevel.INFO;
    this.log(
      level,
      LogCategory.SECURITY,
      `Security event: ${action} on ${resource} - ${result}`,
      undefined,
      undefined,
      securityContext
    );
  }

  /**
   * Performance logging
   */
  performance(
    operation: string,
    duration: number,
    metadata?: Record<string, unknown>
  ): void {
    const performanceMetrics: PerformanceMetrics = {
      duration,
      memoryUsed: process.memoryUsage().heapUsed,
      memoryTotal: process.memoryUsage().heapTotal,
      dbQueryCount: this.performanceCounters.get('dbQueryCount') || 0,
      dbQueryDuration: this.performanceCounters.get('dbQueryDuration') || 0,
      externalApiCalls: this.performanceCounters.get('externalApiCalls') || 0,
      externalApiDuration: this.performanceCounters.get('externalApiDuration') || 0
    };

    this.log(
      LogLevel.INFO,
      LogCategory.PERFORMANCE,
      `Performance: ${operation} completed in ${duration}ms`,
      metadata,
      performanceMetrics
    );
  }

  /**
   * Database operation logging
   */
  database(
    operation: string,
    table: string,
    duration: number,
    metadata?: Record<string, unknown>
  ): void {
    this.incrementCounter('dbQueryCount');
    this.incrementCounter('dbQueryDuration', duration);

    this.log(
      LogLevel.DEBUG,
      LogCategory.DATABASE,
      `Database: ${operation} on ${table} (${duration}ms)`,
      { operation, table, duration, ...metadata }
    );
  }

  /**
   * External API call logging
   */
  externalApi(
    service: string,
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number,
    metadata?: Record<string, unknown>
  ): void {
    this.incrementCounter('externalApiCalls');
    this.incrementCounter('externalApiDuration', duration);

    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.DEBUG;
    this.log(
      level,
      LogCategory.EXTERNAL_API,
      `External API: ${method} ${service}${endpoint} - ${statusCode} (${duration}ms)`,
      { service, endpoint, method, statusCode, duration, ...metadata }
    );
  }

  /**
   * Business logic logging
   */
  business(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, LogCategory.BUSINESS_LOGIC, message, metadata);
  }

  /**
   * Authentication logging
   */
  authentication(
    event: string,
    success: boolean,
    userId?: string,
    metadata?: Record<string, unknown>
  ): void {
    const level = success ? LogLevel.INFO : LogLevel.WARN;
    this.log(
      level,
      LogCategory.AUTHENTICATION,
      `Authentication: ${event} - ${success ? 'success' : 'failure'}`,
      { event, success, userId, ...metadata }
    );
  }

  /**
   * Authorization logging
   */
  authorization(
    action: string,
    resource: string,
    granted: boolean,
    userId?: string,
    metadata?: Record<string, unknown>
  ): void {
    const level = granted ? LogLevel.INFO : LogLevel.WARN;
    this.log(
      level,
      LogCategory.AUTHORIZATION,
      `Authorization: ${action} on ${resource} - ${granted ? 'granted' : 'denied'}`,
      { action, resource, granted, userId, ...metadata }
    );
  }

  /**
   * Validation logging
   */
  validation(
    field: string,
    valid: boolean,
    errorMessage?: string,
    metadata?: Record<string, unknown>
  ): void {
    const level = valid ? LogLevel.DEBUG : LogLevel.WARN;
    this.log(
      level,
      LogCategory.VALIDATION,
      `Validation: ${field} - ${valid ? 'valid' : 'invalid'}${errorMessage ? `: ${errorMessage}` : ''}`,
      { field, valid, errorMessage, ...metadata }
    );
  }

  /**
   * Time a function execution
   */
  async timeAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    category: LogCategory = LogCategory.PERFORMANCE
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      this.performance(operation, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.log(
        LogLevel.ERROR,
        category,
        `${operation} failed after ${duration}ms`,
        { error: error instanceof Error ? error.message : String(error) }
      );
      throw error;
    }
  }

  /**
   * Time a synchronous function execution
   */
  timeSync<T>(
    operation: string,
    fn: () => T,
    category: LogCategory = LogCategory.PERFORMANCE
  ): T {
    const startTime = Date.now();
    try {
      const result = fn();
      const duration = Date.now() - startTime;
      this.performance(operation, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.log(
        LogLevel.ERROR,
        category,
        `${operation} failed after ${duration}ms`,
        { error: error instanceof Error ? error.message : String(error) }
      );
      throw error;
    }
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    metadata?: Record<string, unknown>,
    performance?: PerformanceMetrics,
    security?: SecurityContext,
    error?: ErrorContext
  ): void {
    // Skip if below current log level
    if (level < Logger.currentLevel) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      category,
      message,
      context: this.context,
      requestId: this.requestId,
      userId: this.userId,
      sessionId: this.sessionId,
      correlationId: this.correlationId,
      metadata,
      performance,
      security,
      error
    };

    // Output to console (AWS Lambda logs go to CloudWatch)
    const output = JSON.stringify(logEntry, null, process.env.NODE_ENV === 'development' ? 2 : 0);

    switch (level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        console.log(output);
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(output);
        break;
    }
  }

  /**
   * Increment performance counter
   */
  private incrementCounter(name: string, value: number = 1): void {
    const current = this.performanceCounters.get(name) || 0;
    this.performanceCounters.set(name, current + value);
  }

  /**
   * Get log level from environment variable
   */
  private static getLogLevelFromEnv(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    switch (envLevel) {
      case 'DEBUG': return LogLevel.DEBUG;
      case 'INFO': return LogLevel.INFO;
      case 'WARN': return LogLevel.WARN;
      case 'ERROR': return LogLevel.ERROR;
      case 'CRITICAL': return LogLevel.CRITICAL;
      default: return LogLevel.INFO;
    }
  }

  /**
   * Create child logger with additional context
   */
  child(additionalContext: string): Logger {
    const childLogger = new Logger(`${this.context}:${additionalContext}`);
    childLogger.setRequestContext(
      this.requestId || '',
      this.userId,
      this.sessionId,
      this.correlationId
    );
    return childLogger;
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return {
      duration: Date.now() - this.startTime,
      memoryUsed: process.memoryUsage().heapUsed,
      memoryTotal: process.memoryUsage().heapTotal,
      dbQueryCount: this.performanceCounters.get('dbQueryCount') || 0,
      dbQueryDuration: this.performanceCounters.get('dbQueryDuration') || 0,
      externalApiCalls: this.performanceCounters.get('externalApiCalls') || 0,
      externalApiDuration: this.performanceCounters.get('externalApiDuration') || 0
    };
  }

  /**
   * Log request start
   */
  logRequestStart(method: string, path: string, metadata?: Record<string, unknown>): void {
    this.info(`Request started: ${method} ${path}`, {
      httpMethod: method,
      path,
      ...metadata
    });
  }

  /**
   * Log request end
   */
  logRequestEnd(method: string, path: string, statusCode: number, metadata?: Record<string, unknown>): void {
    const duration = Date.now() - this.startTime;
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;

    this.log(
      level,
      LogCategory.APPLICATION,
      `Request completed: ${method} ${path} - ${statusCode} (${duration}ms)`,
      {
        httpMethod: method,
        path,
        statusCode,
        duration,
        ...metadata
      },
      this.getPerformanceMetrics()
    );
  }
}

/**
 * Request logging middleware
 */
export interface RequestLoggerOptions {
  skipPaths?: string[];
  logHeaders?: boolean;
  logBody?: boolean;
  maxBodySize?: number;
}

export class RequestLogger {
  private static defaultOptions: RequestLoggerOptions = {
    skipPaths: ['/health', '/ping'],
    logHeaders: false,
    logBody: false,
    maxBodySize: 1000
  };

  static create(options: RequestLoggerOptions = {}): (event: unknown, context: Context) => Logger {
    const opts = { ...this.defaultOptions, ...options };

    return (event: unknown, context: Context): Logger => {
      const logger = Logger.fromLambdaContext(context, 'RequestLogger');

      // Extract request information (assuming API Gateway event)
      const apiEvent = event as { httpMethod?: string; path?: string; headers?: Record<string, string>; body?: string };

      if (apiEvent.httpMethod && apiEvent.path) {
        // Skip logging for certain paths
        if (opts.skipPaths?.includes(apiEvent.path)) {
          return logger;
        }

        const metadata: Record<string, unknown> = {};

        if (opts.logHeaders && apiEvent.headers) {
          // Filter sensitive headers
          const safeHeaders = { ...apiEvent.headers };
          delete safeHeaders.Authorization;
          delete safeHeaders.authorization;
          delete safeHeaders['x-api-key'];
          metadata.headers = safeHeaders;
        }

        if (opts.logBody && apiEvent.body) {
          const bodyStr = apiEvent.body;
          if (bodyStr.length <= (opts.maxBodySize || 1000)) {
            try {
              metadata.body = JSON.parse(bodyStr);
            } catch {
              metadata.body = bodyStr;
            }
          } else {
            metadata.body = `[Body too large: ${bodyStr.length} characters]`;
          }
        }

        logger.logRequestStart(apiEvent.httpMethod, apiEvent.path, metadata);
      }

      return logger;
    };
  }
}

// Export singleton logger for global use
export const globalLogger = new Logger('Global');

// Export utility functions
export const createLogger = (context: string): Logger => new Logger(context);
export const createRequestLogger = (options?: RequestLoggerOptions) => RequestLogger.create(options);