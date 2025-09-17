/**
 * Security Utilities for AB Holistic Interview Portal
 *
 * This module provides:
 * - Input sanitization and validation
 * - Rate limiting mechanisms
 * - Security headers and CORS configuration
 * - IP-based access control
 * - Request validation middleware
 * - CSRF protection utilities
 * - Data encryption/decryption helpers
 */

import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import crypto from 'crypto';
import { Logger } from './logger';
import { RateLimitError, ValidationError, AuthorizationError } from './errors';

// Rate limiting configuration
export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (event: APIGatewayProxyEvent) => string;
}

// Rate limiting storage (in-memory for Lambda)
interface RateLimitEntry {
  count: number;
  windowStart: number;
  lastRequest: number;
}

class RateLimitStore {
  private static store = new Map<string, RateLimitEntry>();
  private static cleanupInterval = 60000; // 1 minute
  private static lastCleanup = Date.now();

  static get(key: string): RateLimitEntry | undefined {
    this.cleanup();
    return this.store.get(key);
  }

  static set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry);
  }

  static delete(key: string): void {
    this.store.delete(key);
  }

  private static cleanup(): void {
    const now = Date.now();
    if (now - this.lastCleanup < this.cleanupInterval) {
      return;
    }

    const cutoff = now - (60000 * 5); // Remove entries older than 5 minutes
    for (const [key, entry] of this.store.entries()) {
      if (entry.lastRequest < cutoff) {
        this.store.delete(key);
      }
    }

    this.lastCleanup = now;
  }
}

/**
 * Rate Limiter Class
 */
export class RateLimiter {
  private config: RateLimitConfig;
  private logger: Logger;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.logger = new Logger('RateLimiter');
  }

  /**
   * Check if request is within rate limits
   */
  checkLimit(event: APIGatewayProxyEvent): { allowed: boolean; resetTime?: number; remaining?: number } {
    const key = this.getKey(event);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    let entry = RateLimitStore.get(key);

    // If no entry exists or window has expired, create new entry
    if (!entry || entry.windowStart < windowStart) {
      entry = {
        count: 1,
        windowStart: now,
        lastRequest: now
      };
      RateLimitStore.set(key, entry);

      return {
        allowed: true,
        resetTime: now + this.config.windowMs,
        remaining: this.config.maxRequests - 1
      };
    }

    // Update entry
    entry.count++;
    entry.lastRequest = now;
    RateLimitStore.set(key, entry);

    // Check if over limit
    if (entry.count > this.config.maxRequests) {
      this.logger.securityAudit(
        'rate_limit_exceeded',
        'api_endpoint',
        'blocked',
        'medium',
        this.getClientIP(event),
        event.headers['User-Agent'],
        { key, count: entry.count, limit: this.config.maxRequests }
      );

      return {
        allowed: false,
        resetTime: entry.windowStart + this.config.windowMs,
        remaining: 0
      };
    }

    return {
      allowed: true,
      resetTime: entry.windowStart + this.config.windowMs,
      remaining: this.config.maxRequests - entry.count
    };
  }

  /**
   * Generate rate limiting key
   */
  private getKey(event: APIGatewayProxyEvent): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(event);
    }

    // Default: IP + User-Agent + Path
    const ip = this.getClientIP(event);
    const userAgent = event.headers['User-Agent'] || 'unknown';
    const path = event.path;

    return crypto
      .createHash('sha256')
      .update(`${ip}:${userAgent}:${path}`)
      .digest('hex');
  }

  /**
   * Extract client IP from event
   */
  private getClientIP(event: APIGatewayProxyEvent): string {
    // Check various headers for real IP
    const headers = event.headers;

    return headers['X-Forwarded-For']?.split(',')[0] ||
           headers['X-Real-IP'] ||
           headers['X-Client-IP'] ||
           event.requestContext?.identity?.sourceIp ||
           'unknown';
  }
}

/**
 * Input Sanitizer Class
 */
export class InputSanitizer {
  private static logger = new Logger('InputSanitizer');

  /**
   * Sanitize string input
   */
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      throw new ValidationError('Input must be a string');
    }

    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/data:/gi, '') // Remove data: protocols
      .replace(/vbscript:/gi, ''); // Remove vbscript: protocols
  }

  /**
   * Sanitize HTML content (basic)
   */
  static sanitizeHTML(input: string): string {
    const allowedTags = ['b', 'i', 'u', 'p', 'br', 'strong', 'em'];
    const allowedAttrs: string[] = [];

    // Simple HTML sanitization (for production, use a library like DOMPurify)
    let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    sanitized = sanitized.replace(/on\w+="[^"]*"/gi, ''); // Remove event handlers

    return sanitized;
  }

  /**
   * Sanitize email address
   */
  static sanitizeEmail(email: string): string {
    const sanitized = this.sanitizeString(email).toLowerCase();

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized)) {
      throw new ValidationError('Invalid email format');
    }

    return sanitized;
  }

  /**
   * Sanitize phone number
   */
  static sanitizePhone(phone: string): string {
    const sanitized = phone.replace(/[^\d+\-\s()]/g, '');

    if (sanitized.length < 10 || sanitized.length > 20) {
      throw new ValidationError('Invalid phone number length');
    }

    return sanitized;
  }

  /**
   * Sanitize URL
   */
  static sanitizeURL(url: string): string {
    const sanitized = this.sanitizeString(url);

    try {
      const urlObj = new URL(sanitized);

      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new ValidationError('Invalid URL protocol');
      }

      return urlObj.toString();
    } catch {
      throw new ValidationError('Invalid URL format');
    }
  }

  /**
   * Sanitize file name
   */
  static sanitizeFileName(fileName: string): string {
    const sanitized = fileName
      .replace(/[^a-zA-Z0-9.\-_]/g, '') // Only allow alphanumeric, dots, dashes, underscores
      .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
      .replace(/^\.+|\.+$/g, ''); // Remove leading/trailing dots

    if (sanitized.length === 0) {
      throw new ValidationError('Invalid file name');
    }

    if (sanitized.length > 255) {
      throw new ValidationError('File name too long');
    }

    return sanitized;
  }

  /**
   * Sanitize object recursively
   */
  static sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
    const sanitized = {} as T;

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key as keyof T] = this.sanitizeString(value) as T[keyof T];
      } else if (Array.isArray(value)) {
        sanitized[key as keyof T] = value.map(item =>
          typeof item === 'string' ? this.sanitizeString(item) : item
        ) as T[keyof T];
      } else if (value && typeof value === 'object') {
        sanitized[key as keyof T] = this.sanitizeObject(value as Record<string, unknown>) as T[keyof T];
      } else {
        sanitized[key as keyof T] = value as T[keyof T];
      }
    }

    return sanitized;
  }
}

/**
 * Security Headers Manager
 */
export class SecurityHeaders {
  /**
   * Get security headers for API responses
   */
  static getSecurityHeaders(): Record<string, string> {
    return {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'",
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    };
  }

  /**
   * Get CORS headers
   */
  static getCORSHeaders(allowedOrigins: string[] = ['*']): Record<string, string> {
    return {
      'Access-Control-Allow-Origin': allowedOrigins.includes('*') ? '*' : allowedOrigins[0],
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400'
    };
  }
}

/**
 * IP Access Control
 */
export class IPAccessControl {
  private static blockedIPs = new Set<string>();
  private static allowedIPs = new Set<string>();
  private static logger = new Logger('IPAccessControl');

  /**
   * Check if IP is allowed
   */
  static isIPAllowed(ip: string): boolean {
    // If IP is explicitly blocked
    if (this.blockedIPs.has(ip)) {
      this.logger.securityAudit(
        'ip_access_check',
        'api_endpoint',
        'blocked',
        'high',
        ip,
        undefined,
        { reason: 'blocked_ip' }
      );
      return false;
    }

    // If we have an allow list and IP is not in it
    if (this.allowedIPs.size > 0 && !this.allowedIPs.has(ip)) {
      this.logger.securityAudit(
        'ip_access_check',
        'api_endpoint',
        'blocked',
        'medium',
        ip,
        undefined,
        { reason: 'not_in_allowlist' }
      );
      return false;
    }

    return true;
  }

  /**
   * Block an IP address
   */
  static blockIP(ip: string, reason?: string): void {
    this.blockedIPs.add(ip);
    this.logger.securityAudit(
      'ip_blocked',
      'security_system',
      'success',
      'high',
      ip,
      undefined,
      { reason }
    );
  }

  /**
   * Allow an IP address
   */
  static allowIP(ip: string): void {
    this.allowedIPs.add(ip);
    this.logger.securityAudit(
      'ip_allowed',
      'security_system',
      'success',
      'low',
      ip
    );
  }

  /**
   * Check for suspicious patterns
   */
  static checkSuspiciousActivity(event: APIGatewayProxyEvent): boolean {
    const userAgent = event.headers['User-Agent'] || '';
    const ip = event.headers['X-Forwarded-For']?.split(',')[0] ||
               event.requestContext?.identity?.sourceIp || '';

    // Check for bot patterns in User-Agent
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /curl/i, /wget/i, /postman/i
    ];

    const isSuspiciousUserAgent = botPatterns.some(pattern => pattern.test(userAgent));

    // Check for suspicious IP patterns (basic)
    const isSuspiciousIP = /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(ip) &&
                          process.env.NODE_ENV === 'production';

    if (isSuspiciousUserAgent || isSuspiciousIP) {
      this.logger.securityAudit(
        'suspicious_activity_detected',
        'api_endpoint',
        'blocked',
        'medium',
        ip,
        userAgent,
        { isSuspiciousUserAgent, isSuspiciousIP }
      );
      return true;
    }

    return false;
  }
}

/**
 * Request Validator
 */
export class RequestValidator {
  private static logger = new Logger('RequestValidator');

  /**
   * Validate request size
   */
  static validateRequestSize(body: string, maxSize: number = 1024 * 1024): boolean {
    if (body.length > maxSize) {
      this.logger.securityAudit(
        'request_size_exceeded',
        'api_endpoint',
        'blocked',
        'medium',
        undefined,
        undefined,
        { bodySize: body.length, maxSize }
      );
      throw new ValidationError(`Request body too large. Maximum size: ${maxSize} bytes`);
    }
    return true;
  }

  /**
   * Validate Content-Type
   */
  static validateContentType(contentType: string | undefined, allowedTypes: string[]): boolean {
    if (!contentType || !allowedTypes.includes(contentType)) {
      this.logger.securityAudit(
        'invalid_content_type',
        'api_endpoint',
        'blocked',
        'low',
        undefined,
        undefined,
        { contentType, allowedTypes }
      );
      throw new ValidationError(`Invalid content type. Allowed: ${allowedTypes.join(', ')}`);
    }
    return true;
  }

  /**
   * Validate required headers
   */
  static validateHeaders(headers: Record<string, string | undefined>, requiredHeaders: string[]): boolean {
    const missing = requiredHeaders.filter(header => !headers[header]);

    if (missing.length > 0) {
      this.logger.securityAudit(
        'missing_required_headers',
        'api_endpoint',
        'blocked',
        'low',
        undefined,
        undefined,
        { missingHeaders: missing }
      );
      throw new ValidationError(`Missing required headers: ${missing.join(', ')}`);
    }
    return true;
  }

  /**
   * Validate request method
   */
  static validateMethod(method: string, allowedMethods: string[]): boolean {
    if (!allowedMethods.includes(method)) {
      this.logger.securityAudit(
        'invalid_http_method',
        'api_endpoint',
        'blocked',
        'medium',
        undefined,
        undefined,
        { method, allowedMethods }
      );
      throw new ValidationError(`Method not allowed: ${method}`);
    }
    return true;
  }
}

/**
 * CSRF Protection
 */
export class CSRFProtection {
  private static tokenStore = new Map<string, { token: string; expires: number }>();
  private static logger = new Logger('CSRFProtection');

  /**
   * Generate CSRF token
   */
  static generateToken(sessionId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + (60 * 60 * 1000); // 1 hour

    this.tokenStore.set(sessionId, { token, expires });
    return token;
  }

  /**
   * Validate CSRF token
   */
  static validateToken(sessionId: string, providedToken: string): boolean {
    const stored = this.tokenStore.get(sessionId);

    if (!stored) {
      this.logger.securityAudit(
        'csrf_token_missing',
        'api_endpoint',
        'blocked',
        'high',
        undefined,
        undefined,
        { sessionId }
      );
      return false;
    }

    if (Date.now() > stored.expires) {
      this.tokenStore.delete(sessionId);
      this.logger.securityAudit(
        'csrf_token_expired',
        'api_endpoint',
        'blocked',
        'medium',
        undefined,
        undefined,
        { sessionId }
      );
      return false;
    }

    if (stored.token !== providedToken) {
      this.logger.securityAudit(
        'csrf_token_invalid',
        'api_endpoint',
        'blocked',
        'high',
        undefined,
        undefined,
        { sessionId }
      );
      return false;
    }

    return true;
  }
}

/**
 * Data Encryption Utilities
 */
export class DataEncryption {
  private static algorithm = 'aes-256-gcm';
  private static keyLength = 32;

  /**
   * Encrypt sensitive data
   */
  static encrypt(text: string, key?: string): { encrypted: string; iv: string; tag: string } {
    const encryptionKey = key ?
      crypto.scryptSync(key, 'salt', this.keyLength) :
      crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', this.keyLength);

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, encryptionKey);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = (cipher as crypto.CipherGCM).getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  /**
   * Decrypt sensitive data
   */
  static decrypt(encrypted: string, iv: string, tag: string, key?: string): string {
    const encryptionKey = key ?
      crypto.scryptSync(key, 'salt', this.keyLength) :
      crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', this.keyLength);

    const decipher = crypto.createDecipher(this.algorithm, encryptionKey);
    (decipher as crypto.DecipherGCM).setAuthTag(Buffer.from(tag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Hash password with salt
   */
  static hashPassword(password: string): { hash: string; salt: string } {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');

    return { hash, salt };
  }

  /**
   * Verify password
   */
  static verifyPassword(password: string, hash: string, salt: string): boolean {
    const computed = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return computed === hash;
  }
}

/**
 * Security Middleware Factory
 */
export interface SecurityMiddlewareOptions {
  rateLimitConfig?: RateLimitConfig;
  allowedOrigins?: string[];
  requireAuth?: boolean;
  validateIP?: boolean;
  maxRequestSize?: number;
  allowedContentTypes?: string[];
  requiredHeaders?: string[];
}

export class SecurityMiddleware {
  static create(options: SecurityMiddlewareOptions = {}) {
    const rateLimiter = options.rateLimitConfig ? new RateLimiter(options.rateLimitConfig) : null;
    const logger = new Logger('SecurityMiddleware');

    return {
      before: (event: APIGatewayProxyEvent, context: Context) => {
        const requestLogger = logger.child(`request-${context.awsRequestId}`);

        try {
          // IP validation
          if (options.validateIP) {
            const ip = event.headers['X-Forwarded-For']?.split(',')[0] ||
                      event.requestContext?.identity?.sourceIp || '';

            if (!IPAccessControl.isIPAllowed(ip)) {
              throw new AuthorizationError('IP not allowed');
            }

            if (IPAccessControl.checkSuspiciousActivity(event)) {
              throw new AuthorizationError('Suspicious activity detected');
            }
          }

          // Rate limiting
          if (rateLimiter) {
            const { allowed, resetTime, remaining } = rateLimiter.checkLimit(event);

            if (!allowed) {
              throw new RateLimitError('Rate limit exceeded', {
                resetTime,
                remaining
              });
            }
          }

          // Request size validation
          if (event.body && options.maxRequestSize) {
            RequestValidator.validateRequestSize(event.body, options.maxRequestSize);
          }

          // Content type validation
          if (options.allowedContentTypes && event.httpMethod !== 'GET') {
            RequestValidator.validateContentType(
              event.headers['Content-Type'],
              options.allowedContentTypes
            );
          }

          // Required headers validation
          if (options.requiredHeaders) {
            RequestValidator.validateHeaders(event.headers, options.requiredHeaders);
          }

          // HTTP method validation (basic)
          const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
          RequestValidator.validateMethod(event.httpMethod, allowedMethods);

          requestLogger.info('Security validation passed', {
            path: event.path,
            method: event.httpMethod,
            ip: event.headers['X-Forwarded-For']?.split(',')[0] || event.requestContext?.identity?.sourceIp
          });

        } catch (error) {
          requestLogger.error('Security validation failed', { error });
          throw error;
        }
      }
    };
  }
}

// Export commonly used rate limit configurations
export const RateLimitConfigs = {
  // Very strict for authentication endpoints
  AUTH_STRICT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5
  },

  // Normal for general API endpoints
  API_NORMAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100
  },

  // Lenient for public read-only endpoints
  PUBLIC_LENIENT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000
  }
};