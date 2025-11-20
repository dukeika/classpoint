import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract tenant ID from request
 * Usage: @TenantId() tenantId: string
 */
export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantId;
  },
);

/**
 * Decorator to extract full tenant object from request
 * Usage: @CurrentTenant() tenant: { id: string, code: string }
 */
export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenant;
  },
);
