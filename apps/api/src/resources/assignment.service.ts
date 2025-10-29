import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@classpoint/db';
import { Assignment, Submission, Prisma } from '@classpoint/db';
import {
  CreateAssignmentDto,
  UpdateAssignmentDto,
  CreateSubmissionDto,
  GradeSubmissionDto,
  AssignmentStatus,
} from './dto';

@Injectable()
export class AssignmentService {
  private readonly logger = new Logger(AssignmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new assignment
   */
  async create(
    tenantId: string,
    userId: string,
    createAssignmentDto: CreateAssignmentDto
  ): Promise<Assignment> {
    this.logger.log(`Creating assignment for tenant: ${tenantId}`);

    // Verify class and subject exist
    const [classEntity, subject] = await Promise.all([
      this.prisma.class.findUnique({
        where: { id: createAssignmentDto.classId },
      }),
      this.prisma.subject.findUnique({
        where: { id: createAssignmentDto.subjectId },
      }),
    ]);

    if (!classEntity) {
      throw new NotFoundException(
        `Class with ID '${createAssignmentDto.classId}' not found`
      );
    }

    if (!subject) {
      throw new NotFoundException(
        `Subject with ID '${createAssignmentDto.subjectId}' not found`
      );
    }

    try {
      const assignment = await this.prisma.assignment.create({
        data: {
          tenantId,
          classId: createAssignmentDto.classId,
          subjectId: createAssignmentDto.subjectId,
          title: createAssignmentDto.title,
          description: createAssignmentDto.description,
          instructions: createAssignmentDto.instructions,
          dueDate: createAssignmentDto.dueDate
            ? new Date(createAssignmentDto.dueDate)
            : null,
          maxScore: createAssignmentDto.maxScore,
          status: createAssignmentDto.status || AssignmentStatus.DRAFT,
          attachments: createAssignmentDto.attachments || [],
          createdBy: userId,
        },
        include: {
          class: true,
          subject: true,
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              submissions: true,
            },
          },
        },
      });

      this.logger.log(`Assignment created successfully: ${assignment.id}`);
      return assignment;
    } catch (error) {
      this.logger.error(
        `Failed to create assignment: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  /**
   * Get all assignments for a tenant
   */
  async findAll(
    tenantId: string,
    params?: {
      skip?: number;
      take?: number;
      classId?: string;
      subjectId?: string;
      status?: AssignmentStatus;
    }
  ): Promise<{ data: Assignment[]; total: number }> {
    const { skip = 0, take = 50, classId, subjectId, status } = params || {};

    const where: Prisma.AssignmentWhereInput = { tenantId };

    if (classId) {
      where.classId = classId;
    }

    if (subjectId) {
      where.subjectId = subjectId;
    }

    if (status) {
      where.status = status;
    }

    const [assignments, total] = await Promise.all([
      this.prisma.assignment.findMany({
        where,
        skip,
        take,
        include: {
          class: true,
          subject: true,
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              submissions: true,
            },
          },
        },
        orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.assignment.count({ where }),
    ]);

    return {
      data: assignments,
      total,
    };
  }

  /**
   * Get a single assignment by ID
   */
  async findOne(tenantId: string, id: string): Promise<Assignment> {
    const assignment = await this.prisma.assignment.findFirst({
      where: { id, tenantId },
      include: {
        class: true,
        subject: true,
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        submissions: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException(`Assignment with ID '${id}' not found`);
    }

    return assignment;
  }

  /**
   * Update an assignment
   */
  async update(
    tenantId: string,
    id: string,
    userId: string,
    updateAssignmentDto: UpdateAssignmentDto
  ): Promise<Assignment> {
    this.logger.log(`Updating assignment: ${id}`);

    // Verify assignment exists and user has permission
    const existingAssignment = await this.findOne(tenantId, id);

    if (existingAssignment.createdBy !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this assignment'
      );
    }

    try {
      const assignment = await this.prisma.assignment.update({
        where: { id },
        data: {
          ...updateAssignmentDto,
          dueDate: updateAssignmentDto.dueDate
            ? new Date(updateAssignmentDto.dueDate)
            : undefined,
        },
        include: {
          class: true,
          subject: true,
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              submissions: true,
            },
          },
        },
      });

      this.logger.log(`Assignment updated successfully: ${id}`);
      return assignment;
    } catch (error) {
      this.logger.error(
        `Failed to update assignment: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  /**
   * Publish an assignment
   */
  async publish(tenantId: string, id: string, userId: string): Promise<Assignment> {
    this.logger.log(`Publishing assignment: ${id}`);

    const assignment = await this.findOne(tenantId, id);

    if (assignment.createdBy !== userId) {
      throw new ForbiddenException(
        'You do not have permission to publish this assignment'
      );
    }

    if (assignment.status === AssignmentStatus.PUBLISHED) {
      throw new BadRequestException('Assignment is already published');
    }

    return this.prisma.assignment.update({
      where: { id },
      data: {
        status: AssignmentStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      include: {
        class: true,
        subject: true,
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Close an assignment (no more submissions accepted)
   */
  async close(tenantId: string, id: string, userId: string): Promise<Assignment> {
    this.logger.log(`Closing assignment: ${id}`);

    const assignment = await this.findOne(tenantId, id);

    if (assignment.createdBy !== userId) {
      throw new ForbiddenException(
        'You do not have permission to close this assignment'
      );
    }

    return this.prisma.assignment.update({
      where: { id },
      data: {
        status: AssignmentStatus.CLOSED,
      },
    });
  }

  /**
   * Delete an assignment
   */
  async remove(tenantId: string, id: string, userId: string): Promise<void> {
    this.logger.log(`Deleting assignment: ${id}`);

    const assignment = await this.findOne(tenantId, id);

    if (assignment.createdBy !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this assignment'
      );
    }

    // Check if there are submissions
    const submissionCount = await this.prisma.submission.count({
      where: { assignmentId: id },
    });

    if (submissionCount > 0 && assignment.status === AssignmentStatus.PUBLISHED) {
      throw new BadRequestException(
        `Cannot delete published assignment with ${submissionCount} submissions. Close it instead.`
      );
    }

    try {
      await this.prisma.assignment.delete({
        where: { id },
      });

      this.logger.log(`Assignment deleted successfully: ${id}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete assignment: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  /**
   * Submit an assignment (student)
   */
  async submit(
    studentId: string,
    createSubmissionDto: CreateSubmissionDto
  ): Promise<Submission> {
    this.logger.log(
      `Student ${studentId} submitting assignment ${createSubmissionDto.assignmentId}`
    );

    // Verify assignment exists and is published
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: createSubmissionDto.assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException(
        `Assignment with ID '${createSubmissionDto.assignmentId}' not found`
      );
    }

    if (assignment.status !== AssignmentStatus.PUBLISHED) {
      throw new BadRequestException('Assignment is not published yet');
    }

    if (assignment.status === AssignmentStatus.CLOSED) {
      throw new BadRequestException('Assignment is closed for submissions');
    }

    // Check if already submitted (update instead of create)
    const existingSubmission = await this.prisma.submission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId: createSubmissionDto.assignmentId,
          studentId,
        },
      },
    });

    try {
      if (existingSubmission) {
        // Update existing submission
        return this.prisma.submission.update({
          where: { id: existingSubmission.id },
          data: {
            content: createSubmissionDto.content,
            attachments: createSubmissionDto.attachments || [],
            submittedAt: new Date(),
          },
          include: {
            assignment: true,
            student: {
              include: {
                user: true,
              },
            },
          },
        });
      } else {
        // Create new submission
        return this.prisma.submission.create({
          data: {
            assignmentId: createSubmissionDto.assignmentId,
            studentId,
            content: createSubmissionDto.content,
            attachments: createSubmissionDto.attachments || [],
          },
          include: {
            assignment: true,
            student: {
              include: {
                user: true,
              },
            },
          },
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to submit assignment: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  /**
   * Grade a submission (teacher)
   */
  async gradeSubmission(
    submissionId: string,
    userId: string,
    gradeSubmissionDto: GradeSubmissionDto
  ): Promise<Submission> {
    this.logger.log(`Grading submission: ${submissionId}`);

    // Verify submission exists
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: true,
      },
    });

    if (!submission) {
      throw new NotFoundException(`Submission with ID '${submissionId}' not found`);
    }

    // Validate score
    if (submission.assignment.maxScore && gradeSubmissionDto.score > submission.assignment.maxScore) {
      throw new BadRequestException(
        `Score cannot exceed maximum score of ${submission.assignment.maxScore}`
      );
    }

    try {
      return this.prisma.submission.update({
        where: { id: submissionId },
        data: {
          score: gradeSubmissionDto.score,
          feedback: gradeSubmissionDto.feedback,
          gradedAt: new Date(),
          gradedBy: userId,
        },
        include: {
          assignment: true,
          student: {
            include: {
              user: true,
            },
          },
          grader: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to grade submission: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  /**
   * Get submissions for an assignment
   */
  async getSubmissions(assignmentId: string): Promise<Submission[]> {
    return this.prisma.submission.findMany({
      where: { assignmentId },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        grader: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  /**
   * Get student's submissions
   */
  async getStudentSubmissions(studentId: string): Promise<Submission[]> {
    return this.prisma.submission.findMany({
      where: { studentId },
      include: {
        assignment: {
          include: {
            class: true,
            subject: true,
          },
        },
        grader: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }
}
