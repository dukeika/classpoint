import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@classpoint/db';

/**
 * EnrollmentGuard
 *
 * Enforces student enrollment caps based on tenant's plan
 *
 * Usage:
 * @UseGuards(EnrollmentGuard)
 * @CheckEnrollmentCap() // Optional: Use decorator to enable for specific routes
 * async createStudent(@Body() dto: CreateStudentDto, @TenantId() tenantId: string)
 *
 * The guard will:
 * 1. Check if tenant has a plan with student cap
 * 2. Get current enrollment count
 * 3. Block enrollment if cap is reached
 * 4. Allow enrollment if below cap or no cap exists
 */
@Injectable()
export class EnrollmentGuard implements CanActivate {
  private readonly logger = new Logger(EnrollmentGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route has @CheckEnrollmentCap decorator
    const checkCap = this.reflector.get<boolean>(
      'checkEnrollmentCap',
      context.getHandler(),
    );

    // If decorator not present, allow by default
    if (checkCap === undefined) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId;

    if (!tenantId) {
      this.logger.warn('No tenant context in request for enrollment check');
      // If no tenant context, let it through - auth guard will catch it
      return true;
    }

    try {
      // Fetch tenant with plan and current enrollment count
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
          plan: true,
          _count: {
            select: { students: true },
          },
        },
      });

      if (!tenant) {
        throw new BadRequestException('Tenant not found');
      }

      // If no plan, no cap enforcement
      if (!tenant.plan) {
        this.logger.debug(
          `Tenant ${tenant.code} has no plan - no cap enforcement`
        );
        return true;
      }

      const currentEnrollment = tenant._count.students;
      const studentCap = tenant.plan.studentCap;

      // Check if at capacity
      if (currentEnrollment >= studentCap) {
        const remaining = studentCap - currentEnrollment;
        this.logger.warn(
          `Enrollment cap reached for tenant ${tenant.code}: ${currentEnrollment}/${studentCap}`
        );

        throw new BadRequestException(
          `Student enrollment cap reached. ` +
          `Current enrollment: ${currentEnrollment}, ` +
          `Maximum allowed: ${studentCap}. ` +
          `Please upgrade your plan or remove inactive students.`
        );
      }

      const remaining = studentCap - currentEnrollment;
      this.logger.debug(
        `Enrollment check passed for tenant ${tenant.code}: ` +
        `${currentEnrollment}/${studentCap} (${remaining} remaining)`
      );

      // Attach enrollment info to request for logging/monitoring
      request.enrollmentInfo = {
        current: currentEnrollment,
        cap: studentCap,
        remaining,
        percentage: Math.round((currentEnrollment / studentCap) * 100),
      };

      return true;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `Error in enrollment guard: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw new BadRequestException('Failed to check enrollment capacity');
    }
  }
}

/**
 * Decorator to enable enrollment cap checking
 * Use on routes that create new students
 */
export const CheckEnrollmentCap = () => {
  const Reflector = require('@nestjs/core').Reflector;
  return Reflector.createDecorator<boolean>({ key: 'checkEnrollmentCap', value: true });
};
