import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@classpoint/db';
import { Subject, Prisma } from '@classpoint/db';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectService {
  private readonly logger = new Logger(SubjectService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new subject
   */
  async create(
    tenantId: string,
    createSubjectDto: CreateSubjectDto
  ): Promise<Subject> {
    this.logger.log(`Creating subject for tenant: ${tenantId}`);

    // Check if subject with this code already exists for tenant
    const existing = await this.prisma.subject.findUnique({
      where: {
        tenantId_code: {
          tenantId,
          code: createSubjectDto.code,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Subject with code '${createSubjectDto.code}' already exists for this tenant`
      );
    }

    // Validate department if provided
    if (createSubjectDto.departmentId) {
      const department = await this.prisma.department.findFirst({
        where: {
          id: createSubjectDto.departmentId,
          tenantId,
        },
      });

      if (!department) {
        throw new NotFoundException(
          `Department with ID '${createSubjectDto.departmentId}' not found for this tenant`
        );
      }
    }

    try {
      const subject = await this.prisma.subject.create({
        data: {
          tenantId,
          code: createSubjectDto.code,
          name: createSubjectDto.name,
          departmentId: createSubjectDto.departmentId,
          description: createSubjectDto.description,
        },
        include: {
          department: true,
          _count: {
            select: {
              assessments: true,
              grades: true,
            },
          },
        },
      });

      this.logger.log(`Subject created successfully: ${subject.id}`);
      return subject;
    } catch (error) {
      this.logger.error(`Failed to create subject: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Get all subjects for a tenant with optional filtering
   */
  async findAll(
    tenantId: string,
    params?: {
      skip?: number;
      take?: number;
      departmentId?: string;
      search?: string;
    }
  ): Promise<{ data: Subject[]; total: number }> {
    const { skip = 0, take = 50, departmentId, search } = params || {};

    const where: Prisma.SubjectWhereInput = { tenantId };

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [subjects, total] = await Promise.all([
      this.prisma.subject.findMany({
        where,
        skip,
        take,
        include: {
          department: true,
          _count: {
            select: {
              assessments: true,
              grades: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.subject.count({ where }),
    ]);

    return {
      data: subjects,
      total,
    };
  }

  /**
   * Get a single subject by ID
   */
  async findOne(tenantId: string, id: string): Promise<Subject> {
    const subject = await this.prisma.subject.findFirst({
      where: { id, tenantId },
      include: {
        department: true,
        _count: {
          select: {
            assessments: true,
            grades: true,
          },
        },
      },
    });

    if (!subject) {
      throw new NotFoundException(`Subject with ID '${id}' not found`);
    }

    return subject;
  }

  /**
   * Get a subject by code
   */
  async findByCode(tenantId: string, code: string): Promise<Subject> {
    const subject = await this.prisma.subject.findUnique({
      where: {
        tenantId_code: {
          tenantId,
          code,
        },
      },
      include: {
        department: true,
        _count: {
          select: {
            assessments: true,
            grades: true,
          },
        },
      },
    });

    if (!subject) {
      throw new NotFoundException(`Subject with code '${code}' not found`);
    }

    return subject;
  }

  /**
   * Update a subject
   */
  async update(
    tenantId: string,
    id: string,
    updateSubjectDto: UpdateSubjectDto
  ): Promise<Subject> {
    this.logger.log(`Updating subject: ${id}`);

    // Verify subject exists
    await this.findOne(tenantId, id);

    // Validate department if being updated
    if (updateSubjectDto.departmentId) {
      const department = await this.prisma.department.findFirst({
        where: {
          id: updateSubjectDto.departmentId,
          tenantId,
        },
      });

      if (!department) {
        throw new NotFoundException(
          `Department with ID '${updateSubjectDto.departmentId}' not found for this tenant`
        );
      }
    }

    try {
      const subject = await this.prisma.subject.update({
        where: { id },
        data: updateSubjectDto,
        include: {
          department: true,
          _count: {
            select: {
              assessments: true,
              grades: true,
            },
          },
        },
      });

      this.logger.log(`Subject updated successfully: ${id}`);
      return subject;
    } catch (error) {
      this.logger.error(`Failed to update subject: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Delete a subject
   */
  async remove(tenantId: string, id: string): Promise<void> {
    this.logger.log(`Deleting subject: ${id}`);

    // Verify subject exists
    await this.findOne(tenantId, id);

    // Check if subject has assessments or grades
    const [assessmentCount, gradeCount] = await Promise.all([
      this.prisma.assessment.count({ where: { subjectId: id } }),
      this.prisma.grade.count({ where: { subjectId: id } }),
    ]);

    if (assessmentCount > 0 || gradeCount > 0) {
      throw new BadRequestException(
        `Cannot delete subject with existing assessments or grades. Assessments: ${assessmentCount}, Grades: ${gradeCount}`
      );
    }

    try {
      await this.prisma.subject.delete({
        where: { id },
      });

      this.logger.log(`Subject deleted successfully: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete subject: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Get subjects by department
   */
  async findByDepartment(tenantId: string, departmentId: string): Promise<Subject[]> {
    // Verify department exists
    const department = await this.prisma.department.findFirst({
      where: { id: departmentId, tenantId },
    });

    if (!department) {
      throw new NotFoundException(
        `Department with ID '${departmentId}' not found for this tenant`
      );
    }

    const subjects = await this.prisma.subject.findMany({
      where: {
        departmentId,
        tenantId,
      },
      include: {
        _count: {
          select: {
            assessments: true,
            grades: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return subjects;
  }
}
