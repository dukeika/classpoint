import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@classpoint/db';
import { FeeStatus, FeeStatusType, Prisma } from '@classpoint/db';
import { CreateFeeStatusDto } from './dto/create-fee-status.dto';
import { UpdateFeeStatusDto } from './dto/update-fee-status.dto';
import { BulkUpdateFeeStatusDto } from './dto/bulk-update-fee-status.dto';

@Injectable()
export class FeeStatusService {
  private readonly logger = new Logger(FeeStatusService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new fee status record
   */
  async create(tenantId: string, createFeeStatusDto: CreateFeeStatusDto): Promise<FeeStatus> {
    this.logger.log(`Creating fee status for student: ${createFeeStatusDto.studentId}`);

    // Verify student exists and belongs to tenant
    const student = await this.prisma.student.findFirst({
      where: {
        id: createFeeStatusDto.studentId,
        tenantId,
      },
    });

    if (!student) {
      throw new NotFoundException(
        `Student with ID '${createFeeStatusDto.studentId}' not found`
      );
    }

    // Verify term exists and belongs to tenant
    const term = await this.prisma.term.findFirst({
      where: {
        id: createFeeStatusDto.termId,
        tenantId,
      },
    });

    if (!term) {
      throw new NotFoundException(`Term with ID '${createFeeStatusDto.termId}' not found`);
    }

    // Check if fee status already exists for this student and term
    const existing = await this.prisma.feeStatus.findUnique({
      where: {
        studentId_termId: {
          studentId: createFeeStatusDto.studentId,
          termId: createFeeStatusDto.termId,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Fee status already exists for this student and term. Use update instead.`
      );
    }

    try {
      const feeStatus = await this.prisma.feeStatus.create({
        data: {
          studentId: createFeeStatusDto.studentId,
          termId: createFeeStatusDto.termId,
          status: createFeeStatusDto.status,
          billedAmount: createFeeStatusDto.billedAmount,
          receivedAmount: createFeeStatusDto.receivedAmount,
          outstandingAmount: createFeeStatusDto.outstandingAmount,
          notes: createFeeStatusDto.notes,
          attachments: createFeeStatusDto.attachments || [],
          updatedBy: createFeeStatusDto.updatedBy,
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
              session: true,
            },
          },
        },
      });

      // Create audit log
      await this.createAuditLog(
        feeStatus.id,
        createFeeStatusDto.updatedBy,
        'CREATED',
        null,
        createFeeStatusDto.status,
        `Fee status created: ${createFeeStatusDto.status}`
      );

      this.logger.log(`Fee status created successfully: ${feeStatus.id}`);
      return feeStatus;
    } catch (error) {
      this.logger.error(`Failed to create fee status: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Get all fee statuses with filtering
   */
  async findAll(
    tenantId: string,
    params?: {
      skip?: number;
      take?: number;
      termId?: string;
      studentId?: string;
      status?: FeeStatusType;
    }
  ): Promise<{ data: FeeStatus[]; total: number }> {
    const { skip = 0, take = 50, termId, studentId, status } = params || {};

    // Build where clause - need to check student's tenantId
    const where: Prisma.FeeStatusWhereInput = {
      student: {
        tenantId,
      },
    };

    if (termId) where.termId = termId;
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;

    const [feeStatuses, total] = await Promise.all([
      this.prisma.feeStatus.findMany({
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
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.feeStatus.count({ where }),
    ]);

    return {
      data: feeStatuses,
      total,
    };
  }

  /**
   * Get a single fee status by ID
   */
  async findOne(tenantId: string, id: string): Promise<FeeStatus> {
    const feeStatus = await this.prisma.feeStatus.findFirst({
      where: {
        id,
        student: {
          tenantId,
        },
      },
      include: {
        student: true,
        term: {
          include: {
            session: true,
          },
        },
      },
    });

    if (!feeStatus) {
      throw new NotFoundException(`Fee status with ID '${id}' not found`);
    }

    return feeStatus;
  }

  /**
   * Get fee status for a student in a specific term
   */
  async findByStudentAndTerm(
    tenantId: string,
    studentId: string,
    termId: string
  ): Promise<FeeStatus | null> {
    // Verify student belongs to tenant
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, tenantId },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID '${studentId}' not found`);
    }

    const feeStatus = await this.prisma.feeStatus.findUnique({
      where: {
        studentId_termId: {
          studentId,
          termId,
        },
      },
      include: {
        student: true,
        term: true,
      },
    });

    return feeStatus;
  }

  /**
   * Update a fee status
   */
  async update(
    tenantId: string,
    id: string,
    updateFeeStatusDto: UpdateFeeStatusDto
  ): Promise<FeeStatus> {
    this.logger.log(`Updating fee status: ${id}`);

    // Verify fee status exists
    const existing = await this.findOne(tenantId, id);

    const oldStatus = existing.status;
    const newStatus = updateFeeStatusDto.status || oldStatus;

    try {
      const feeStatus = await this.prisma.feeStatus.update({
        where: { id },
        data: updateFeeStatusDto,
        include: {
          student: true,
          term: true,
        },
      });

      // Create audit log if status changed
      if (oldStatus !== newStatus) {
        await this.createAuditLog(
          id,
          updateFeeStatusDto.updatedBy!,
          'STATUS_CHANGED',
          oldStatus,
          newStatus,
          updateFeeStatusDto.notes || `Status changed from ${oldStatus} to ${newStatus}`
        );
      } else if (updateFeeStatusDto.updatedBy) {
        await this.createAuditLog(
          id,
          updateFeeStatusDto.updatedBy,
          'UPDATED',
          null,
          null,
          updateFeeStatusDto.notes || 'Fee status updated'
        );
      }

      this.logger.log(`Fee status updated successfully: ${id}`);
      return feeStatus;
    } catch (error) {
      this.logger.error(`Failed to update fee status: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Delete a fee status
   */
  async remove(tenantId: string, id: string): Promise<void> {
    this.logger.log(`Deleting fee status: ${id}`);

    // Verify fee status exists
    await this.findOne(tenantId, id);

    try {
      await this.prisma.feeStatus.delete({
        where: { id },
      });

      this.logger.log(`Fee status deleted successfully: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete fee status: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Bulk update fee statuses (CSV import)
   */
  async bulkUpdate(tenantId: string, bulkUpdateDto: BulkUpdateFeeStatusDto) {
    this.logger.log(`Bulk updating ${bulkUpdateDto.updates.length} fee statuses`);

    // Verify term exists
    const term = await this.prisma.term.findFirst({
      where: {
        id: bulkUpdateDto.termId,
        tenantId,
      },
    });

    if (!term) {
      throw new NotFoundException(`Term with ID '${bulkUpdateDto.termId}' not found`);
    }

    const results = {
      successful: [] as FeeStatus[],
      failed: [] as { studentIdentifier: string; error: string }[],
    };

    // Process each update
    for (const update of bulkUpdateDto.updates) {
      try {
        // Find student by admission number or ID
        const student = await this.prisma.student.findFirst({
          where: {
            tenantId,
            OR: [
              { admissionNumber: update.studentIdentifier },
              { id: update.studentIdentifier },
            ],
          },
        });

        if (!student) {
          results.failed.push({
            studentIdentifier: update.studentIdentifier,
            error: 'Student not found',
          });
          continue;
        }

        // Check if fee status exists
        const existing = await this.prisma.feeStatus.findUnique({
          where: {
            studentId_termId: {
              studentId: student.id,
              termId: bulkUpdateDto.termId,
            },
          },
        });

        let feeStatus: FeeStatus;

        if (existing) {
          // Update existing
          feeStatus = await this.prisma.feeStatus.update({
            where: { id: existing.id },
            data: {
              status: update.status,
              updatedBy: bulkUpdateDto.updatedBy,
            },
            include: {
              student: true,
              term: true,
            },
          });

          // Audit log
          if (existing.status !== update.status) {
            await this.createAuditLog(
              feeStatus.id,
              bulkUpdateDto.updatedBy,
              'STATUS_CHANGED',
              existing.status,
              update.status,
              'Bulk update via CSV'
            );
          }
        } else {
          // Create new
          feeStatus = await this.prisma.feeStatus.create({
            data: {
              studentId: student.id,
              termId: bulkUpdateDto.termId,
              status: update.status,
              updatedBy: bulkUpdateDto.updatedBy,
            },
            include: {
              student: true,
              term: true,
            },
          });

          // Audit log
          await this.createAuditLog(
            feeStatus.id,
            bulkUpdateDto.updatedBy,
            'CREATED',
            null,
            update.status,
            'Created via bulk CSV import'
          );
        }

        results.successful.push(feeStatus);
      } catch (error) {
        results.failed.push({
          studentIdentifier: update.studentIdentifier,
          error: error.message,
        });
      }
    }

    this.logger.log(
      `Bulk update complete: ${results.successful.length} successful, ${results.failed.length} failed`
    );

    return results;
  }

  /**
   * Get fee status summary for a term
   */
  async getTermSummary(tenantId: string, termId: string) {
    // Verify term exists
    const term = await this.prisma.term.findFirst({
      where: { id: termId, tenantId },
    });

    if (!term) {
      throw new NotFoundException(`Term with ID '${termId}' not found`);
    }

    // Get counts by status
    const [fullCount, partialCount, noneCount, totalStudents] = await Promise.all([
      this.prisma.feeStatus.count({
        where: {
          termId,
          status: FeeStatusType.FULL,
          student: { tenantId },
        },
      }),
      this.prisma.feeStatus.count({
        where: {
          termId,
          status: FeeStatusType.PARTIAL,
          student: { tenantId },
        },
      }),
      this.prisma.feeStatus.count({
        where: {
          termId,
          status: FeeStatusType.NONE,
          student: { tenantId },
        },
      }),
      this.prisma.enrollment.count({
        where: {
          termId,
          tenantId,
        },
      }),
    ]);

    const totalWithStatus = fullCount + partialCount + noneCount;
    const missingStatus = totalStudents - totalWithStatus;

    return {
      term,
      summary: {
        totalStudents,
        totalWithStatus,
        missingStatus,
        full: fullCount,
        partial: partialCount,
        none: noneCount,
      },
      percentages: {
        full: totalStudents > 0 ? (fullCount / totalStudents) * 100 : 0,
        partial: totalStudents > 0 ? (partialCount / totalStudents) * 100 : 0,
        none: totalStudents > 0 ? (noneCount / totalStudents) * 100 : 0,
      },
    };
  }

  /**
   * Get audit history for a fee status
   */
  async getAuditHistory(tenantId: string, feeStatusId: string) {
    // Verify fee status exists
    await this.findOne(tenantId, feeStatusId);

    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        entityType: 'FeeStatus',
        entityId: feeStatusId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return auditLogs;
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(
    feeStatusId: string,
    userId: string,
    action: string,
    oldValue: string | null,
    newValue: string | null,
    description: string
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          entityType: 'FeeStatus',
          entityId: feeStatusId,
          action,
          userId,
          oldValue,
          newValue,
          description,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${(error as Error).message}`, (error as Error).stack);
      // Don't throw - audit log failure shouldn't fail the main operation
    }
  }
}
