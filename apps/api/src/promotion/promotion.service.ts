import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@classpoint/db';
import { Prisma, AuditAction } from '@classpoint/db';
import {
  PromotionPreviewDto,
  PromotionPreviewResponse,
  ExecutePromotionDto,
  ExecutePromotionResponse,
} from './dto';

@Injectable()
export class PromotionService {
  private readonly logger = new Logger(PromotionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Preview a promotion before executing it
   * Shows which students will be promoted and any potential conflicts
   */
  async preview(
    tenantId: string,
    previewDto: PromotionPreviewDto
  ): Promise<PromotionPreviewResponse> {
    this.logger.log('Generating promotion preview');

    // Verify terms exist and belong to tenant
    const [fromTerm, toTerm] = await Promise.all([
      this.prisma.term.findFirst({
        where: { id: previewDto.fromTermId, tenantId },
        include: { session: true },
      }),
      this.prisma.term.findFirst({
        where: { id: previewDto.toTermId, tenantId },
        include: { session: true },
      }),
    ]);

    if (!fromTerm) {
      throw new NotFoundException(
        `Source term with ID '${previewDto.fromTermId}' not found`
      );
    }

    if (!toTerm) {
      throw new NotFoundException(
        `Target term with ID '${previewDto.toTermId}' not found`
      );
    }

    // Ensure toTerm is after fromTerm
    if (toTerm.startDate <= fromTerm.endDate) {
      throw new BadRequestException(
        'Target term must start after the source term ends'
      );
    }

    const promotions: PromotionPreviewResponse['promotions'] = [];
    const conflicts: PromotionPreviewResponse['conflicts'] = [];
    const classBreakdown: PromotionPreviewResponse['summary']['classBreakdown'] = [];

    // Process each mapping
    for (const mapping of previewDto.mappings) {
      // Verify classes exist
      const [fromClass, toClass] = await Promise.all([
        this.prisma.class.findFirst({
          where: { id: mapping.fromClassId, tenantId },
        }),
        this.prisma.class.findFirst({
          where: { id: mapping.toClassId, tenantId },
        }),
      ]);

      if (!fromClass) {
        conflicts.push({
          type: 'CLASS_NOT_FOUND',
          message: `Source class with ID '${mapping.fromClassId}' not found`,
          classId: mapping.fromClassId,
        });
        continue;
      }

      if (!toClass) {
        conflicts.push({
          type: 'CLASS_NOT_FOUND',
          message: `Target class with ID '${mapping.toClassId}' not found`,
          classId: mapping.toClassId,
        });
        continue;
      }

      // Get students to promote
      const whereClause: Prisma.EnrollmentWhereInput = {
        tenantId,
        termId: previewDto.fromTermId,
        classId: mapping.fromClassId,
      };

      if (mapping.studentIds && mapping.studentIds.length > 0) {
        whereClause.studentId = { in: mapping.studentIds };
      }

      const enrollments = await this.prisma.enrollment.findMany({
        where: whereClause,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              admissionNumber: true,
            },
          },
        },
      });

      // Check target class capacity
      const currentTargetEnrollment = await this.prisma.enrollment.count({
        where: {
          classId: mapping.toClassId,
          termId: previewDto.toTermId,
        },
      });

      const availableSlots = toClass.capacity
        ? Math.max(0, toClass.capacity - currentTargetEnrollment)
        : null;

      // Add to class breakdown
      classBreakdown.push({
        fromClass: `${fromClass.level}${fromClass.arm ? ' ' + fromClass.arm : ''}`,
        toClass: `${toClass.level}${toClass.arm ? ' ' + toClass.arm : ''}`,
        studentCount: enrollments.length,
        targetCapacity: toClass.capacity,
        availableSlots,
      });

      // Process each student
      for (const enrollment of enrollments) {
        // Check if student is already enrolled in target term
        const existingEnrollment = await this.prisma.enrollment.findUnique({
          where: {
            studentId_termId: {
              studentId: enrollment.studentId,
              termId: previewDto.toTermId,
            },
          },
        });

        if (existingEnrollment) {
          conflicts.push({
            type: 'STUDENT_ALREADY_ENROLLED',
            message: `Student ${enrollment.student.firstName} ${enrollment.student.lastName} is already enrolled in target term`,
            studentId: enrollment.studentId,
          });
          continue;
        }

        // Check capacity
        if (toClass.capacity && availableSlots !== null && availableSlots <= 0) {
          conflicts.push({
            type: 'CAPACITY_EXCEEDED',
            message: `Target class ${toClass.level}${toClass.arm ? ' ' + toClass.arm : ''} is at full capacity`,
            studentId: enrollment.studentId,
            classId: toClass.id,
          });
          continue;
        }

        // Add to promotions list
        promotions.push({
          studentId: enrollment.studentId,
          studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
          admissionNumber: enrollment.student.admissionNumber,
          fromClass: `${fromClass.level}${fromClass.arm ? ' ' + fromClass.arm : ''}`,
          toClass: `${toClass.level}${toClass.arm ? ' ' + toClass.arm : ''}`,
          currentEnrollmentId: enrollment.id,
        });

        // Decrement available slots for next iteration
        if (availableSlots !== null) {
          classBreakdown[classBreakdown.length - 1].availableSlots! -= 1;
        }
      }
    }

    const response: PromotionPreviewResponse = {
      fromTerm: {
        id: fromTerm.id,
        name: fromTerm.name,
        session: {
          id: fromTerm.session.id,
          name: fromTerm.session.name,
        },
      },
      toTerm: {
        id: toTerm.id,
        name: toTerm.name,
        session: {
          id: toTerm.session.id,
          name: toTerm.session.name,
        },
      },
      totalStudents: promotions.length + conflicts.length,
      promotions,
      conflicts,
      summary: {
        canProceed: conflicts.length === 0,
        totalPromotions: promotions.length,
        totalConflicts: conflicts.length,
        classBreakdown,
      },
    };

    this.logger.log(
      `Preview generated: ${promotions.length} students to promote, ${conflicts.length} conflicts`
    );

    return response;
  }

  /**
   * Execute a promotion
   * Marks current enrollments as promoted and creates new enrollments for target term
   */
  async execute(
    tenantId: string,
    executeDto: ExecutePromotionDto
  ): Promise<ExecutePromotionResponse> {
    this.logger.log('Executing promotion');

    // First, get a preview to validate
    const preview = await this.preview(tenantId, {
      fromTermId: executeDto.fromTermId,
      toTermId: executeDto.toTermId,
      mappings: executeDto.mappings,
    });

    // If there are conflicts and force is not enabled, throw error
    if (preview.conflicts.length > 0 && !executeDto.force) {
      throw new BadRequestException({
        message: 'Promotion has conflicts. Use force=true to override.',
        conflicts: preview.conflicts,
      });
    }

    const promotedStudents: ExecutePromotionResponse['promotedStudents'] = [];
    const failedPromotions: ExecutePromotionResponse['failedPromotions'] = [];

    // Execute promotions in a transaction
    await this.prisma.$transaction(async (tx) => {
      // Process each promotion
      for (const promotion of preview.promotions) {
        try {
          // Get the class ID for the new enrollment
          const mapping = executeDto.mappings.find((m) => {
            const hasStudent =
              !m.studentIds ||
              m.studentIds.length === 0 ||
              m.studentIds.includes(promotion.studentId);
            return (
              m.fromClassId === preview.promotions[0].currentEnrollmentId &&
              hasStudent
            );
          });

          if (!mapping) {
            throw new Error('Mapping not found for student');
          }

          // Mark old enrollment as promoted
          await tx.enrollment.update({
            where: { id: promotion.currentEnrollmentId },
            data: {
              isPromoted: true,
              promotedBy: executeDto.promotedBy,
              promotedAt: new Date(),
            },
          });

          // Create new enrollment in target term
          const newEnrollment = await tx.enrollment.create({
            data: {
              tenantId,
              studentId: promotion.studentId,
              termId: executeDto.toTermId,
              classId: mapping.toClassId,
            },
          });

          promotedStudents.push({
            studentId: promotion.studentId,
            studentName: promotion.studentName,
            fromClass: promotion.fromClass,
            toClass: promotion.toClass,
            oldEnrollmentId: promotion.currentEnrollmentId,
            newEnrollmentId: newEnrollment.id,
          });
        } catch (error) {
          this.logger.error(
            `Failed to promote student ${promotion.studentId}: ${(error as Error).message}`
          );
          failedPromotions.push({
            studentId: promotion.studentId,
            studentName: promotion.studentName,
            fromClass: promotion.fromClass,
            toClass: promotion.toClass,
            error: error.message,
          });
        }
      }

      // Create audit log
      const auditLog = await tx.auditLog.create({
        data: {
          tenantId,
          userId: executeDto.promotedBy,
          action: 'PROMOTE' as AuditAction,
          entity: 'Enrollment',
          entityId: executeDto.fromTermId, // Reference the source term
          changes: {
            type: 'BULK_PROMOTION',
            fromTermId: executeDto.fromTermId,
            toTermId: executeDto.toTermId,
            totalPromoted: promotedStudents.length,
            totalFailed: failedPromotions.length,
            force: executeDto.force || false,
            notes: executeDto.notes,
            promotedStudents: promotedStudents.map((s) => ({
              studentId: s.studentId,
              fromClass: s.fromClass,
              toClass: s.toClass,
            })),
          } as any,
        },
      });

      // Return audit log ID for response
      return auditLog.id;
    });

    const response: ExecutePromotionResponse = {
      success: failedPromotions.length === 0,
      totalPromoted: promotedStudents.length,
      totalFailed: failedPromotions.length,
      promotedStudents,
      failedPromotions,
      auditLogId: '', // Will be set by transaction
      promotedBy: executeDto.promotedBy,
      promotedAt: new Date(),
      notes: executeDto.notes,
    };

    this.logger.log(
      `Promotion executed: ${promotedStudents.length} promoted, ${failedPromotions.length} failed`
    );

    return response;
  }

  /**
   * Get promotion history for a student
   */
  async getStudentPromotionHistory(tenantId: string, studentId: string) {
    // Verify student exists
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, tenantId },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID '${studentId}' not found`);
    }

    const promotions = await this.prisma.enrollment.findMany({
      where: {
        studentId,
        tenantId,
        isPromoted: true,
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
        promotedAt: 'desc',
      },
    });

    return {
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        admissionNumber: student.admissionNumber,
      },
      totalPromotions: promotions.length,
      promotions: promotions.map((p) => ({
        id: p.id,
        term: p.term.name,
        session: p.term.session.name,
        class: `${p.class.level}${p.class.arm ? ' ' + p.class.arm : ''}`,
        promotedBy: p.promotedBy,
        promotedAt: p.promotedAt,
      })),
    };
  }

  /**
   * Get promotion statistics for a term
   */
  async getTermPromotionStatistics(tenantId: string, termId: string) {
    // Verify term exists
    const term = await this.prisma.term.findFirst({
      where: { id: termId, tenantId },
      include: { session: true },
    });

    if (!term) {
      throw new NotFoundException(`Term with ID '${termId}' not found`);
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        termId,
        tenantId,
      },
      include: {
        class: true,
      },
    });

    const promoted = enrollments.filter((e) => e.isPromoted);
    const notPromoted = enrollments.filter((e) => !e.isPromoted);

    // Group by class
    const byClass = enrollments.reduce(
      (acc, enrollment) => {
        const className = `${enrollment.class.level}${enrollment.class.arm ? ' ' + enrollment.class.arm : ''}`;
        if (!acc[className]) {
          acc[className] = { total: 0, promoted: 0, notPromoted: 0 };
        }
        acc[className].total++;
        if (enrollment.isPromoted) {
          acc[className].promoted++;
        } else {
          acc[className].notPromoted++;
        }
        return acc;
      },
      {} as Record<string, { total: number; promoted: number; notPromoted: number }>
    );

    return {
      term: {
        id: term.id,
        name: term.name,
        session: term.session.name,
      },
      totalStudents: enrollments.length,
      totalPromoted: promoted.length,
      totalNotPromoted: notPromoted.length,
      promotionRate: enrollments.length > 0
        ? Math.round((promoted.length / enrollments.length) * 100)
        : 0,
      byClass: Object.entries(byClass).map(([className, stats]) => ({
        className,
        ...stats,
        promotionRate: stats.total > 0
          ? Math.round((stats.promoted / stats.total) * 100)
          : 0,
      })),
    };
  }

  /**
   * Rollback a promotion (in case of mistakes)
   * This marks students as not promoted and deletes target enrollments
   */
  async rollback(
    tenantId: string,
    auditLogId: string,
    rolledBackBy: string
  ): Promise<{ success: boolean; message: string; studentsAffected: number }> {
    this.logger.log(`Rolling back promotion from audit log: ${auditLogId}`);

    // Get audit log
    const auditLog = await this.prisma.auditLog.findFirst({
      where: {
        id: auditLogId,
        tenantId,
        action: 'PROMOTE' as AuditAction,
      },
    });

    if (!auditLog) {
      throw new NotFoundException(`Promotion audit log with ID '${auditLogId}' not found`);
    }

    const details = auditLog.changes as any;
    let studentsAffected = 0;

    // Rollback in transaction
    await this.prisma.$transaction(async (tx) => {
      // For each promoted student, reverse the promotion
      for (const student of details.promotedStudents || []) {
        // Find and delete the new enrollment in target term
        const newEnrollments = await tx.enrollment.findMany({
          where: {
            studentId: student.studentId,
            termId: details.toTermId,
            tenantId,
          },
        });

        for (const enrollment of newEnrollments) {
          await tx.enrollment.delete({ where: { id: enrollment.id } });
        }

        // Find and unmark old enrollment
        const oldEnrollments = await tx.enrollment.findMany({
          where: {
            studentId: student.studentId,
            termId: details.fromTermId,
            tenantId,
            isPromoted: true,
          },
        });

        for (const enrollment of oldEnrollments) {
          await tx.enrollment.update({
            where: { id: enrollment.id },
            data: {
              isPromoted: false,
              promotedBy: null,
              promotedAt: null,
            },
          });
        }

        studentsAffected++;
      }

      // Create rollback audit log
      await tx.auditLog.create({
        data: {
          tenantId,
          userId: rolledBackBy,
          action: 'UPDATE' as AuditAction,
          entity: 'Enrollment',
          entityId: details.fromTermId,
          changes: {
            type: 'PROMOTION_ROLLBACK',
            originalAuditLogId: auditLogId,
            studentsAffected,
            rolledBackAt: new Date(),
          } as any,
        },
      });
    });

    this.logger.log(`Promotion rolled back: ${studentsAffected} students affected`);

    return {
      success: true,
      message: `Successfully rolled back promotion for ${studentsAffected} students`,
      studentsAffected,
    };
  }
}
