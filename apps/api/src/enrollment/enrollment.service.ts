import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@classpoint/db';
import { Enrollment, Prisma } from '@classpoint/db';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { BulkEnrollDto } from './dto/bulk-enroll.dto';

@Injectable()
export class EnrollmentService {
  private readonly logger = new Logger(EnrollmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new enrollment
   */
  async create(
    tenantId: string,
    createEnrollmentDto: CreateEnrollmentDto
  ): Promise<Enrollment> {
    this.logger.log(`Creating enrollment for student: ${createEnrollmentDto.studentId}`);

    // Verify student exists and belongs to tenant
    const student = await this.prisma.student.findFirst({
      where: {
        id: createEnrollmentDto.studentId,
        tenantId,
      },
    });

    if (!student) {
      throw new NotFoundException(
        `Student with ID '${createEnrollmentDto.studentId}' not found for this tenant`
      );
    }

    // Verify term exists and belongs to tenant
    const term = await this.prisma.term.findFirst({
      where: {
        id: createEnrollmentDto.termId,
        tenantId,
      },
    });

    if (!term) {
      throw new NotFoundException(
        `Term with ID '${createEnrollmentDto.termId}' not found for this tenant`
      );
    }

    // Verify class exists and belongs to tenant
    const classEntity = await this.prisma.class.findFirst({
      where: {
        id: createEnrollmentDto.classId,
        tenantId,
      },
    });

    if (!classEntity) {
      throw new NotFoundException(
        `Class with ID '${createEnrollmentDto.classId}' not found for this tenant`
      );
    }

    // Check if enrollment already exists for this student and term
    const existingEnrollment = await this.prisma.enrollment.findUnique({
      where: {
        studentId_termId: {
          studentId: createEnrollmentDto.studentId,
          termId: createEnrollmentDto.termId,
        },
      },
    });

    if (existingEnrollment) {
      throw new ConflictException(
        `Student is already enrolled for this term in class '${existingEnrollment.classId}'`
      );
    }

    // Check class capacity
    if (classEntity.capacity) {
      const currentEnrollment = await this.prisma.enrollment.count({
        where: { classId: createEnrollmentDto.classId },
      });

      if (currentEnrollment >= classEntity.capacity) {
        throw new BadRequestException(
          `Class '${classEntity.level} ${classEntity.arm || ''}' is at full capacity (${classEntity.capacity}/${classEntity.capacity})`
        );
      }
    }

    try {
      const enrollment = await this.prisma.enrollment.create({
        data: {
          tenantId,
          studentId: createEnrollmentDto.studentId,
          termId: createEnrollmentDto.termId,
          classId: createEnrollmentDto.classId,
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              admissionNumber: true,
            },
          },
          term: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
            },
          },
          class: {
            select: {
              id: true,
              level: true,
              arm: true,
              capacity: true,
            },
          },
        },
      });

      this.logger.log(`Enrollment created successfully: ${enrollment.id}`);
      return enrollment;
    } catch (error) {
      this.logger.error(`Failed to create enrollment: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Bulk enrollment creation
   */
  async bulkEnroll(tenantId: string, bulkEnrollDto: BulkEnrollDto) {
    this.logger.log(`Bulk enrolling ${bulkEnrollDto.enrollments.length} students`);

    // Verify term exists
    const term = await this.prisma.term.findFirst({
      where: {
        id: bulkEnrollDto.termId,
        tenantId,
      },
    });

    if (!term) {
      throw new NotFoundException(`Term with ID '${bulkEnrollDto.termId}' not found`);
    }

    const results = {
      successful: [] as Enrollment[],
      failed: [] as { studentId: string; classId: string; error: string }[],
    };

    // Process each enrollment
    for (const enrollment of bulkEnrollDto.enrollments) {
      try {
        const created = await this.create(tenantId, {
          studentId: enrollment.studentId,
          termId: bulkEnrollDto.termId,
          classId: enrollment.classId,
        });
        results.successful.push(created);
      } catch (error) {
        results.failed.push({
          studentId: enrollment.studentId,
          classId: enrollment.classId,
          error: error.message,
        });
      }
    }

    this.logger.log(
      `Bulk enrollment complete: ${results.successful.length} successful, ${results.failed.length} failed`
    );

    return results;
  }

  /**
   * Get all enrollments for a tenant with filtering
   */
  async findAll(
    tenantId: string,
    params?: {
      skip?: number;
      take?: number;
      termId?: string;
      studentId?: string;
      classId?: string;
      isPromoted?: boolean;
    }
  ): Promise<{ data: Enrollment[]; total: number }> {
    const { skip = 0, take = 50, termId, studentId, classId, isPromoted } = params || {};

    const where: Prisma.EnrollmentWhereInput = { tenantId };

    if (termId) where.termId = termId;
    if (studentId) where.studentId = studentId;
    if (classId) where.classId = classId;
    if (isPromoted !== undefined) where.isPromoted = isPromoted;

    const [enrollments, total] = await Promise.all([
      this.prisma.enrollment.findMany({
        where,
        skip,
        take,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              admissionNumber: true,
            },
          },
          term: {
            select: {
              id: true,
              name: true,
              session: true,
            },
          },
          class: {
            select: {
              id: true,
              level: true,
              arm: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.enrollment.count({ where }),
    ]);

    return {
      data: enrollments,
      total,
    };
  }

  /**
   * Get a single enrollment by ID
   */
  async findOne(tenantId: string, id: string): Promise<Enrollment> {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id, tenantId },
      include: {
        student: true,
        term: {
          include: {
            session: true,
          },
        },
        class: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID '${id}' not found`);
    }

    return enrollment;
  }

  /**
   * Get student's enrollment for current term
   */
  async getCurrentEnrollment(tenantId: string, studentId: string) {
    // Get current term
    const currentTerm = await this.prisma.term.findFirst({
      where: {
        tenantId,
        isCurrent: true,
      },
    });

    if (!currentTerm) {
      return null;
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        studentId_termId: {
          studentId,
          termId: currentTerm.id,
        },
      },
      include: {
        term: true,
        class: true,
      },
    });

    return enrollment;
  }

  /**
   * Update an enrollment
   */
  async update(
    tenantId: string,
    id: string,
    updateEnrollmentDto: UpdateEnrollmentDto
  ): Promise<Enrollment> {
    this.logger.log(`Updating enrollment: ${id}`);

    // Verify enrollment exists
    const existingEnrollment = await this.findOne(tenantId, id);

    // If changing class, verify new class and check capacity
    if (updateEnrollmentDto.classId) {
      const newClass = await this.prisma.class.findFirst({
        where: {
          id: updateEnrollmentDto.classId,
          tenantId,
        },
      });

      if (!newClass) {
        throw new NotFoundException(
          `Class with ID '${updateEnrollmentDto.classId}' not found`
        );
      }

      // Check capacity if moving to different class
      if (updateEnrollmentDto.classId !== existingEnrollment.classId) {
        if (newClass.capacity) {
          const currentEnrollment = await this.prisma.enrollment.count({
            where: { classId: updateEnrollmentDto.classId },
          });

          if (currentEnrollment >= newClass.capacity) {
            throw new BadRequestException(
              `New class '${newClass.level} ${newClass.arm || ''}' is at full capacity`
            );
          }
        }
      }
    }

    // Handle promotion
    const data: any = { ...updateEnrollmentDto };
    if (updateEnrollmentDto.isPromoted && !updateEnrollmentDto.promotedAt) {
      data.promotedAt = new Date();
    }
    if (data.promotedAt && typeof data.promotedAt === 'string') {
      data.promotedAt = new Date(data.promotedAt);
    }

    try {
      const enrollment = await this.prisma.enrollment.update({
        where: { id },
        data,
        include: {
          student: true,
          term: true,
          class: true,
        },
      });

      this.logger.log(`Enrollment updated successfully: ${id}`);
      return enrollment;
    } catch (error) {
      this.logger.error(`Failed to update enrollment: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Delete an enrollment
   */
  async remove(tenantId: string, id: string): Promise<void> {
    this.logger.log(`Deleting enrollment: ${id}`);

    // Verify enrollment exists
    await this.findOne(tenantId, id);

    try {
      await this.prisma.enrollment.delete({
        where: { id },
      });

      this.logger.log(`Enrollment deleted successfully: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete enrollment: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Get class roster (all students enrolled in a class for a term)
   */
  async getClassRoster(tenantId: string, classId: string, termId: string) {
    // Verify class and term exist
    const [classEntity, term] = await Promise.all([
      this.prisma.class.findFirst({ where: { id: classId, tenantId } }),
      this.prisma.term.findFirst({ where: { id: termId, tenantId } }),
    ]);

    if (!classEntity) {
      throw new NotFoundException(`Class with ID '${classId}' not found`);
    }

    if (!term) {
      throw new NotFoundException(`Term with ID '${termId}' not found`);
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        classId,
        termId,
        tenantId,
      },
      include: {
        student: {
          include: {
            household: {
              select: {
                id: true,
                primaryContact: true,
                secondaryContact: true,
              },
            },
          },
        },
      },
      orderBy: {
        student: {
          lastName: 'asc',
        },
      },
    });

    return {
      class: classEntity,
      term,
      students: enrollments,
      count: enrollments.length,
      capacity: classEntity.capacity,
      availableSlots: classEntity.capacity
        ? Math.max(0, classEntity.capacity - enrollments.length)
        : null,
    };
  }

  /**
   * Get student's enrollment history
   */
  async getStudentHistory(tenantId: string, studentId: string) {
    // Verify student exists
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, tenantId },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID '${studentId}' not found`);
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        studentId,
        tenantId,
      },
      include: {
        term: {
          include: {
            session: true,
          },
        },
        class: true,
      },
      orderBy: {
        term: {
          startDate: 'desc',
        },
      },
    });

    return {
      student,
      enrollments,
      totalEnrollments: enrollments.length,
      promotedCount: enrollments.filter(e => e.isPromoted).length,
    };
  }

  /**
   * Promote students in bulk
   */
  async bulkPromote(
    tenantId: string,
    enrollmentIds: string[],
    promotedBy: string
  ) {
    this.logger.log(`Bulk promoting ${enrollmentIds.length} students`);

    const results = await this.prisma.enrollment.updateMany({
      where: {
        id: { in: enrollmentIds },
        tenantId,
      },
      data: {
        isPromoted: true,
        promotedBy,
        promotedAt: new Date(),
      },
    });

    this.logger.log(`Bulk promotion complete: ${results.count} students promoted`);

    return {
      count: results.count,
      promotedBy,
      promotedAt: new Date(),
    };
  }
}
