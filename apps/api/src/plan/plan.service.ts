import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@classpoint/db';
import { Plan, Prisma } from '@classpoint/db';
import { CreatePlanDto, UpdatePlanDto, PlanResponseDto } from './dto';

@Injectable()
export class PlanService {
  private readonly logger = new Logger(PlanService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new plan
   */
  async create(createPlanDto: CreatePlanDto): Promise<PlanResponseDto> {
    this.logger.log(`Creating plan: ${createPlanDto.name}`);

    // Check for duplicate plan name
    const existing = await this.prisma.plan.findFirst({
      where: { name: createPlanDto.name },
    });

    if (existing) {
      throw new ConflictException(
        `Plan with name '${createPlanDto.name}' already exists`
      );
    }

    try {
      const plan = await this.prisma.plan.create({
        data: {
          name: createPlanDto.name,
          studentCap: createPlanDto.studentCap,
          description: createPlanDto.description,
        },
        include: {
          _count: {
            select: { tenants: true },
          },
        },
      });

      this.logger.log(`Plan created successfully: ${plan.id}`);
      return PlanResponseDto.fromEntity(plan);
    } catch (error) {
      this.logger.error(`Failed to create plan: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Get all plans
   */
  async findAll(params?: {
    skip?: number;
    take?: number;
    orderBy?: 'name' | 'studentCap' | 'createdAt';
    order?: 'asc' | 'desc';
  }): Promise<{ data: PlanResponseDto[]; total: number }> {
    const {
      skip = 0,
      take = 50,
      orderBy = 'createdAt',
      order = 'desc',
    } = params || {};

    const [plans, total] = await Promise.all([
      this.prisma.plan.findMany({
        skip,
        take,
        include: {
          _count: {
            select: { tenants: true },
          },
        },
        orderBy: { [orderBy]: order },
      }),
      this.prisma.plan.count(),
    ]);

    return {
      data: plans.map(plan: any => PlanResponseDto.fromEntity(plan)),
      total,
    };
  }

  /**
   * Get a single plan by ID
   */
  async findOne(id: string): Promise<PlanResponseDto> {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      include: {
        _count: {
          select: { tenants: true },
          },
      },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID '${id}' not found`);
    }

    return PlanResponseDto.fromEntity(plan);
  }

  /**
   * Update a plan
   */
  async update(id: string, updatePlanDto: UpdatePlanDto): Promise<PlanResponseDto> {
    this.logger.log(`Updating plan: ${id}`);

    // Verify plan exists
    await this.findOne(id);

    // Check for name conflict if name is being updated
    if (updatePlanDto.name) {
      const existing = await this.prisma.plan.findFirst({
        where: {
          name: updatePlanDto.name,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Plan with name '${updatePlanDto.name}' already exists`
        );
      }
    }

    // If reducing student cap, verify no tenant exceeds new cap
    if (updatePlanDto.studentCap !== undefined) {
      const tenantsWithPlan = await this.prisma.tenant.findMany({
        where: { planId: id },
        include: {
          _count: {
            select: { students: true },
          },
        },
      });

      const violatingTenants = tenantsWithPlan.filter(
        tenant: any => tenant._count.students > updatePlanDto.studentCap!
      );

      if (violatingTenants.length > 0) {
        const tenantNames = violatingTenants.map(t => t.name).join(', ');
        throw new BadRequestException(
          `Cannot reduce student cap to ${updatePlanDto.studentCap}. ` +
          `The following tenants exceed this limit: ${tenantNames}`
        );
      }
    }

    try {
      const plan = await this.prisma.plan.update({
        where: { id },
        data: updatePlanDto,
        include: {
          _count: {
            select: { tenants: true },
          },
        },
      });

      this.logger.log(`Plan updated successfully: ${id}`);
      return PlanResponseDto.fromEntity(plan);
    } catch (error) {
      this.logger.error(`Failed to update plan: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Delete a plan
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Deleting plan: ${id}`);

    // Verify plan exists
    await this.findOne(id);

    // Check if any tenants are using this plan
    const tenantCount = await this.prisma.tenant.count({
      where: { planId: id },
    });

    if (tenantCount > 0) {
      throw new BadRequestException(
        `Cannot delete plan. ${tenantCount} tenant(s) are currently using this plan. ` +
        `Please reassign tenants to a different plan first.`
      );
    }

    try {
      await this.prisma.plan.delete({
        where: { id },
      });

      this.logger.log(`Plan deleted successfully: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete plan: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Get tenants using a specific plan
   */
  async getTenantsUsingPlan(planId: string): Promise<Array<{
    id: string;
    name: string;
    code: string;
    currentEnrollment: number;
    capUsagePercentage: number;
  }>> {
    // Verify plan exists
    await this.findOne(planId);

    const tenants = await this.prisma.tenant.findMany({
      where: { planId },
      include: {
        _count: {
          select: { students: true },
        },
        plan: true,
      },
    });

    return tenants.map(tenant: any => ({
      id: tenant.id,
      name: tenant.name,
      code: tenant.code,
      currentEnrollment: tenant._count.students,
      capUsagePercentage: Math.round(
        (tenant._count.students / tenant.plan!.studentCap) * 100
      ),
    }));
  }
}
