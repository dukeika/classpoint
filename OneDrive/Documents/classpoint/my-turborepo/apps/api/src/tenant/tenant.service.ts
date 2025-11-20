import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@classpoint/db';
import { Tenant, TenantStatus, Prisma } from '@classpoint/db';
import {
  CreateTenantDto,
  UpdateTenantDto,
  TenantResponseDto,
} from './dto';

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new tenant (school)
   */
  async create(createTenantDto: CreateTenantDto): Promise<TenantResponseDto> {
    this.logger.log(`Creating tenant with code: ${createTenantDto.code}`);

    // Check if tenant with this slug already exists
    const existing = await this.prisma.tenant.findUnique({
      where: { slug: createTenantDto.code },
    });

    if (existing) {
      throw new ConflictException(
        `Tenant with code '${createTenantDto.code}' already exists`
      );
    }

    // Validate plan if provided
    if (createTenantDto.planId) {
      const plan = await this.prisma.plan.findUnique({
        where: { id: createTenantDto.planId },
      });

      if (!plan) {
        throw new NotFoundException(
          `Plan with ID '${createTenantDto.planId}' not found`
        );
      }
    }

    try {
      const tenant = await this.prisma.tenant.create({
        data: {
          schoolName: createTenantDto.name,
          slug: createTenantDto.code,
          email: createTenantDto.email,
          phone: createTenantDto.phone,
          address: createTenantDto.address,
          website: createTenantDto.website,
          planId: createTenantDto.planId,
          isActive: true,
        },
        include: {
          plan: true,
          _count: {
            select: { students: true },
          },
        },
      });

      this.logger.log(`Tenant created successfully: ${tenant.id}`);
      return TenantResponseDto.fromEntity(tenant);
    } catch (error) {
      this.logger.error(`Failed to create tenant: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Get all tenants with optional filtering
   */
  async findAll(params?: {
    skip?: number;
    take?: number;
    isActive?: boolean;
    search?: string;
  }): Promise<{ data: TenantResponseDto[]; total: number }> {
    const { skip = 0, take = 50, isActive, search } = params || {};

    const where: Prisma.TenantWhereInput = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { schoolName: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip,
        take,
        include: {
          plan: true,
          _count: {
            select: { students: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      data: tenants.map((tenant: any) => TenantResponseDto.fromEntity(tenant)),
      total,
    };
  }

  /**
   * Get a single tenant by ID
   */
  async findOne(id: string): Promise<TenantResponseDto> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        plan: true,
        _count: {
          select: { students: true },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID '${id}' not found`);
    }

    return TenantResponseDto.fromEntity(tenant);
  }

  /**
   * Get a tenant by code (slug)
   */
  async findByCode(code: string): Promise<TenantResponseDto> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: code },
      include: {
        plan: true,
        _count: {
          select: { students: true },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with code '${code}' not found`);
    }

    return TenantResponseDto.fromEntity(tenant);
  }

  /**
   * Update a tenant
   */
  async update(
    id: string,
    updateTenantDto: UpdateTenantDto
  ): Promise<TenantResponseDto> {
    this.logger.log(`Updating tenant: ${id}`);

    // Verify tenant exists
    await this.findOne(id);

    // Validate plan if being updated
    if (updateTenantDto.planId) {
      const plan = await this.prisma.plan.findUnique({
        where: { id: updateTenantDto.planId },
      });

      if (!plan) {
        throw new NotFoundException(
          `Plan with ID '${updateTenantDto.planId}' not found`
        );
      }

      // Check if new plan's student cap would be violated
      const currentEnrollment = await this.prisma.student.count({
        where: { tenantId: id },
      });

      if (currentEnrollment > plan.studentCap) {
        throw new BadRequestException(
          `Cannot change to this plan. Current enrollment (${currentEnrollment}) exceeds plan's student cap (${plan.studentCap})`
        );
      }
    }

    try {
      const tenant = await this.prisma.tenant.update({
        where: { id },
        data: updateTenantDto,
        include: {
          plan: true,
          _count: {
            select: { students: true },
          },
        },
      });

      this.logger.log(`Tenant updated successfully: ${id}`);
      return TenantResponseDto.fromEntity(tenant);
    } catch (error) {
      this.logger.error(`Failed to update tenant: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Delete a tenant (soft delete by changing status)
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Deleting tenant: ${id}`);

    // Verify tenant exists
    await this.findOne(id);

    // Check if tenant has active students
    const studentCount = await this.prisma.student.count({
      where: { tenantId: id },
    });

    if (studentCount > 0) {
      throw new BadRequestException(
        `Cannot delete tenant with active students. Please transfer or remove all students first. Current count: ${studentCount}`
      );
    }

    try {
      // Soft delete by setting isActive to false
      await this.prisma.tenant.update({
        where: { id },
        data: { isActive: false },
      });

      this.logger.log(`Tenant deactivated successfully: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete tenant: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Permanently delete a tenant (hard delete - use with caution)
   */
  async hardDelete(id: string): Promise<void> {
    this.logger.warn(`HARD DELETING tenant: ${id}`);

    // Verify tenant exists
    await this.findOne(id);

    // Check if tenant has any related data
    const [studentCount, staffCount, enrollmentCount] = await Promise.all([
      this.prisma.student.count({ where: { tenantId: id } }),
      this.prisma.staff.count({ where: { tenantId: id } }),
      this.prisma.enrollment.count({ where: { tenantId: id } }),
    ]);

    if (studentCount > 0 || staffCount > 0 || enrollmentCount > 0) {
      throw new BadRequestException(
        `Cannot permanently delete tenant with related data. Students: ${studentCount}, Staff: ${staffCount}, Enrollments: ${enrollmentCount}`
      );
    }

    try {
      await this.prisma.tenant.delete({
        where: { id },
      });

      this.logger.warn(`Tenant permanently deleted: ${id}`);
    } catch (error) {
      this.logger.error(
        `Failed to hard delete tenant: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  /**
   * Activate a suspended tenant
   */
  async activate(id: string): Promise<TenantResponseDto> {
    this.logger.log(`Activating tenant: ${id}`);

    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: { isActive: true },
      include: {
        plan: true,
        _count: {
          select: { students: true },
        },
      },
    });

    this.logger.log(`Tenant activated successfully: ${id}`);
    return TenantResponseDto.fromEntity(tenant);
  }

  /**
   * Suspend a tenant
   */
  async suspend(id: string): Promise<TenantResponseDto> {
    this.logger.log(`Suspending tenant: ${id}`);

    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: { isActive: false },
      include: {
        plan: true,
        _count: {
          select: { students: true },
        },
      },
    });

    this.logger.log(`Tenant suspended successfully: ${id}`);
    return TenantResponseDto.fromEntity(tenant);
  }

  /**
   * Check if tenant has reached student enrollment cap
   */
  async isAtCapacity(tenantId: string): Promise<boolean> {
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
      throw new NotFoundException(`Tenant with ID '${tenantId}' not found`);
    }

    if (!tenant.plan) {
      // No plan means no cap
      return false;
    }

    return tenant._count.students >= tenant.plan.studentCap;
  }

  /**
   * Get remaining enrollment capacity
   */
  async getRemainingCapacity(tenantId: string): Promise<number> {
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
      throw new NotFoundException(`Tenant with ID '${tenantId}' not found`);
    }

    if (!tenant.plan) {
      // No plan means unlimited capacity
      return Infinity;
    }

    return Math.max(0, tenant.plan.studentCap - tenant._count.students);
  }
}
