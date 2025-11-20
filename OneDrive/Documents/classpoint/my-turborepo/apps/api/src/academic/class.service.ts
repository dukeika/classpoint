import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@classpoint/db';
import { Class, Prisma } from '@classpoint/db';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@Injectable()
export class ClassService {
  private readonly logger = new Logger(ClassService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new class
   */
  async create(tenantId: string, createClassDto: CreateClassDto): Promise<Class> {
    this.logger.log(`Creating class for tenant: ${tenantId}`);

    // Check if class with this level and arm already exists for tenant
    const existing = await this.prisma.class.findUnique({
      where: {
        tenantId_level_arm: {
          tenantId,
          level: createClassDto.level,
          arm: createClassDto.arm || null,
        },
      },
    });

    if (existing) {
      const className = createClassDto.arm
        ? `${createClassDto.level} ${createClassDto.arm}`
        : createClassDto.level;
      throw new ConflictException(
        `Class '${className}' already exists for this tenant`
      );
    }

    try {
      const classEntity = await this.prisma.class.create({
        data: {
          tenantId,
          level: createClassDto.level,
          arm: createClassDto.arm,
          capacity: createClassDto.capacity,
        },
        include: {
          _count: {
            select: {
              enrollments: true,
              teacherClasses: true,
            },
          },
        },
      });

      this.logger.log(`Class created successfully: ${classEntity.id}`);
      return classEntity;
    } catch (error) {
      this.logger.error(`Failed to create class: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Get all classes for a tenant with optional filtering
   */
  async findAll(
    tenantId: string,
    params?: {
      skip?: number;
      take?: number;
      level?: string;
    }
  ): Promise<{ data: Class[]; total: number }> {
    const { skip = 0, take = 50, level } = params || {};

    const where: Prisma.ClassWhereInput = { tenantId };

    if (level) {
      where.level = { contains: level, mode: 'insensitive' };
    }

    const [classes, total] = await Promise.all([
      this.prisma.class.findMany({
        where,
        skip,
        take,
        include: {
          _count: {
            select: {
              enrollments: true,
              teacherClasses: true,
              attendances: true,
            },
          },
        },
        orderBy: [{ level: 'asc' }, { arm: 'asc' }],
      }),
      this.prisma.class.count({ where }),
    ]);

    return {
      data: classes,
      total,
    };
  }

  /**
   * Get a single class by ID
   */
  async findOne(tenantId: string, id: string): Promise<Class> {
    const classEntity = await this.prisma.class.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: {
            enrollments: true,
            teacherClasses: true,
            attendances: true,
            announcements: true,
          },
        },
      },
    });

    if (!classEntity) {
      throw new NotFoundException(`Class with ID '${id}' not found`);
    }

    return classEntity;
  }

  /**
   * Get classes by level
   */
  async findByLevel(tenantId: string, level: string): Promise<Class[]> {
    const classes = await this.prisma.class.findMany({
      where: {
        tenantId,
        level,
      },
      include: {
        _count: {
          select: {
            enrollments: true,
            teacherClasses: true,
          },
        },
      },
      orderBy: { arm: 'asc' },
    });

    return classes;
  }

  /**
   * Update a class
   */
  async update(
    tenantId: string,
    id: string,
    updateClassDto: UpdateClassDto
  ): Promise<Class> {
    this.logger.log(`Updating class: ${id}`);

    // Verify class exists
    const existingClass = await this.findOne(tenantId, id);

    // Check if new arm would create a conflict
    if (updateClassDto.arm !== undefined) {
      const conflict = await this.prisma.class.findUnique({
        where: {
          tenantId_level_arm: {
            tenantId,
            level: existingClass.level,
            arm: updateClassDto.arm || null,
          },
        },
      });

      if (conflict && conflict.id !== id) {
        const className = updateClassDto.arm
          ? `${existingClass.level} ${updateClassDto.arm}`
          : existingClass.level;
        throw new ConflictException(
          `Class '${className}' already exists for this tenant`
        );
      }
    }

    // Validate capacity reduction
    if (updateClassDto.capacity !== undefined) {
      const currentEnrollment = await this.prisma.enrollment.count({
        where: { classId: id },
      });

      if (updateClassDto.capacity < currentEnrollment) {
        throw new BadRequestException(
          `Cannot reduce capacity to ${updateClassDto.capacity}. Current enrollment is ${currentEnrollment}`
        );
      }
    }

    try {
      const classEntity = await this.prisma.class.update({
        where: { id },
        data: updateClassDto,
        include: {
          _count: {
            select: {
              enrollments: true,
              teacherClasses: true,
            },
          },
        },
      });

      this.logger.log(`Class updated successfully: ${id}`);
      return classEntity;
    } catch (error) {
      this.logger.error(`Failed to update class: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Delete a class
   */
  async remove(tenantId: string, id: string): Promise<void> {
    this.logger.log(`Deleting class: ${id}`);

    // Verify class exists
    await this.findOne(tenantId, id);

    // Check if class has active enrollments
    const enrollmentCount = await this.prisma.enrollment.count({
      where: { classId: id },
    });

    if (enrollmentCount > 0) {
      throw new BadRequestException(
        `Cannot delete class with existing enrollments. Please remove all enrollments first. Current count: ${enrollmentCount}`
      );
    }

    // Check if class has teacher assignments
    const teacherCount = await this.prisma.teacherClass.count({
      where: { classId: id },
    });

    if (teacherCount > 0) {
      throw new BadRequestException(
        `Cannot delete class with assigned teachers. Please remove all teacher assignments first. Current count: ${teacherCount}`
      );
    }

    try {
      await this.prisma.class.delete({
        where: { id },
      });

      this.logger.log(`Class deleted successfully: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete class: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Get class capacity information
   */
  async getCapacityInfo(tenantId: string, id: string) {
    const classEntity = await this.findOne(tenantId, id);

    const enrollmentCount = await this.prisma.enrollment.count({
      where: { classId: id },
    });

    return {
      classId: id,
      level: classEntity.level,
      arm: classEntity.arm,
      capacity: classEntity.capacity,
      currentEnrollment: enrollmentCount,
      availableSlots: classEntity.capacity
        ? Math.max(0, classEntity.capacity - enrollmentCount)
        : null,
      isAtCapacity: classEntity.capacity
        ? enrollmentCount >= classEntity.capacity
        : false,
    };
  }

  /**
   * Get all unique levels for a tenant
   */
  async getLevels(tenantId: string): Promise<string[]> {
    const classes = await this.prisma.class.findMany({
      where: { tenantId },
      select: { level: true },
      distinct: ['level'],
      orderBy: { level: 'asc' },
    });

    return classes.map((c: any) => c.level);
  }
}
