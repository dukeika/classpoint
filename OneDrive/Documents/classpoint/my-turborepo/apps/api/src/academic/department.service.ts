import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@classpoint/db';
import { Department, Prisma } from '@classpoint/db';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentService {
  private readonly logger = new Logger(DepartmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new department
   */
  async create(
    tenantId: string,
    createDepartmentDto: CreateDepartmentDto
  ): Promise<Department> {
    this.logger.log(`Creating department for tenant: ${tenantId}`);

    // Check if department with this name already exists for tenant
    const existing = await this.prisma.department.findFirst({
      where: {
        tenantId,
        name: createDepartmentDto.name,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Department '${createDepartmentDto.name}' already exists for this tenant`
      );
    }

    try {
      const department = await this.prisma.department.create({
        data: {
          tenantId,
          name: createDepartmentDto.name,
          description: createDepartmentDto.description,
        },
        include: {
          _count: {
            select: { subjects: true },
          },
        },
      });

      this.logger.log(`Department created successfully: ${department.id}`);
      return department;
    } catch (error) {
      this.logger.error(`Failed to create department: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Get all departments for a tenant
   */
  async findAll(
    tenantId: string,
    params?: {
      skip?: number;
      take?: number;
      search?: string;
    }
  ): Promise<{ data: Department[]; total: number }> {
    const { skip = 0, take = 50, search } = params || {};

    const where: Prisma.DepartmentWhereInput = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [departments, total] = await Promise.all([
      this.prisma.department.findMany({
        where,
        skip,
        take,
        include: {
          _count: {
            select: { subjects: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.department.count({ where }),
    ]);

    return {
      data: departments,
      total,
    };
  }

  /**
   * Get a single department by ID
   */
  async findOne(tenantId: string, id: string): Promise<Department> {
    const department = await this.prisma.department.findFirst({
      where: { id, tenantId },
      include: {
        subjects: true,
        _count: {
          select: { subjects: true },
        },
      },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID '${id}' not found`);
    }

    return department;
  }

  /**
   * Update a department
   */
  async update(
    tenantId: string,
    id: string,
    updateDepartmentDto: UpdateDepartmentDto
  ): Promise<Department> {
    this.logger.log(`Updating department: ${id}`);

    // Verify department exists
    await this.findOne(tenantId, id);

    // Check for name conflict if name is being updated
    if (updateDepartmentDto.name) {
      const existing = await this.prisma.department.findFirst({
        where: {
          tenantId,
          name: updateDepartmentDto.name,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Department '${updateDepartmentDto.name}' already exists for this tenant`
        );
      }
    }

    try {
      const department = await this.prisma.department.update({
        where: { id },
        data: updateDepartmentDto,
        include: {
          _count: {
            select: { subjects: true },
          },
        },
      });

      this.logger.log(`Department updated successfully: ${id}`);
      return department;
    } catch (error) {
      this.logger.error(`Failed to update department: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Delete a department
   */
  async remove(tenantId: string, id: string): Promise<void> {
    this.logger.log(`Deleting department: ${id}`);

    // Verify department exists
    await this.findOne(tenantId, id);

    // Check if department has subjects
    const subjectCount = await this.prisma.subject.count({
      where: { departmentId: id },
    });

    if (subjectCount > 0) {
      throw new BadRequestException(
        `Cannot delete department with existing subjects. Please reassign or remove all subjects first. Current count: ${subjectCount}`
      );
    }

    try {
      await this.prisma.department.delete({
        where: { id },
      });

      this.logger.log(`Department deleted successfully: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete department: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Get all subjects for a department
   */
  async getDepartmentSubjects(tenantId: string, departmentId: string) {
    // Verify department exists
    await this.findOne(tenantId, departmentId);

    const subjects = await this.prisma.subject.findMany({
      where: { departmentId, tenantId },
      orderBy: { name: 'asc' },
    });

    return subjects;
  }
}
