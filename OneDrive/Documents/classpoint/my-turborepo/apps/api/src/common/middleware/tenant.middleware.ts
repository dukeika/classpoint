import { Injectable, NestMiddleware, Logger, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '@classpoint/db';

// Extend Express Request type to include tenant data
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      tenant?: {
        id: string;
        code: string;
        name: string;
        status: string;
      };
      user?: {
        sub: string;
        email: string;
        tenantId: string;
        role: string;
        [key: string]: any;
      };
    }
  }
}

/**
 * Multi-tenancy Middleware
 *
 * Extracts tenant information from:
 * 1. JWT token (user.tenantId) - Primary method
 * 2. X-Tenant-Code header - Fallback for system operations
 * 3. X-Tenant-ID header - Direct tenant ID
 *
 * Validates tenant exists and is active
 * Attaches tenant info to request object for downstream use
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      let tenantId: string | undefined;
      let tenantCode: string | undefined;

      // Priority 1: Get tenant from JWT user object (set by auth guard)
      if (req.user?.tenantId) {
        tenantId = req.user.tenantId;
        this.logger.debug(`Tenant ID from JWT: ${tenantId}`);
      }

      // Priority 2: Get tenant from X-Tenant-ID header
      if (!tenantId && req.headers['x-tenant-id']) {
        tenantId = req.headers['x-tenant-id'] as string;
        this.logger.debug(`Tenant ID from header: ${tenantId}`);
      }

      // Priority 3: Get tenant from X-Tenant-Code header
      if (!tenantId && req.headers['x-tenant-code']) {
        tenantCode = req.headers['x-tenant-code'] as string;
        this.logger.debug(`Tenant code from header: ${tenantCode}`);
      }

      // If we have tenant information, fetch and validate the tenant
      if (tenantId || tenantCode) {
        const tenant = await this.prisma.tenant.findUnique({
          where: tenantId ? { id: tenantId } : { code: tenantCode },
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
          },
        });

        if (!tenant) {
          this.logger.warn(
            `Tenant not found: ${tenantId || tenantCode}`
          );
          throw new UnauthorizedException('Invalid tenant');
        }

        if (tenant.status !== 'ACTIVE') {
          this.logger.warn(
            `Tenant not active: ${tenant.code} (${tenant.status})`
          );
          throw new UnauthorizedException(
            `Tenant is ${tenant.status.toLowerCase()}. Please contact support.`
          );
        }

        // Attach tenant info to request
        req.tenantId = tenant.id;
        req.tenant = tenant;

        this.logger.debug(
          `Tenant context set: ${tenant.code} (${tenant.id})`
        );
      } else {
        // No tenant context - this is okay for public routes or tenant management routes
        this.logger.debug('No tenant context in request');
      }

      next();
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error(
        `Error in tenant middleware: ${(error as Error).message}`,
        (error as Error).stack
      );
      next(error);
    }
  }
}
