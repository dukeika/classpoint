import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@classpoint/db';
import { Comment, Prisma } from '@classpoint/db';
import { CreateCommentDto, UpdateCommentDto } from './dto';

@Injectable()
export class CommentService {
  private readonly logger = new Logger(CommentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new comment
   */
  async create(createCommentDto: CreateCommentDto): Promise<Comment> {
    this.logger.log(`Creating ${createCommentDto.type} comment for student: ${createCommentDto.studentId}`);

    // Verify student and term exist
    const [student, term] = await Promise.all([
      this.prisma.student.findUnique({ where: { id: createCommentDto.studentId } }),
      this.prisma.term.findUnique({ where: { id: createCommentDto.termId } }),
    ]);

    if (!student) throw new NotFoundException('Student not found');
    if (!term) throw new NotFoundException('Term not found');

    const comment = await this.prisma.comment.create({
      data: createCommentDto,
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        author: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    this.logger.log(`Comment created: ${comment.id}`);
    return comment;
  }

  /**
   * Get all comments for a student in a term
   */
  async findByStudent(studentId: string, termId?: string) {
    const where: Prisma.CommentWhereInput = { studentId };
    if (termId) where.termId = termId;

    return this.prisma.comment.findMany({
      where,
      include: {
        author: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get comments by type (teacher, principal, housemaster)
   */
  async findByType(studentId: string, termId: string, type: string) {
    return this.prisma.comment.findMany({
      where: { studentId, termId, type },
      include: {
        author: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all comments for a term (admin/teacher view)
   */
  async findByTerm(termId: string, type?: string) {
    const where: Prisma.CommentWhereInput = { termId };
    if (type) where.type = type;

    return this.prisma.comment.findMany({
      where,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
        author: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: [{ student: { lastName: 'asc' } }, { createdAt: 'desc' }],
    });
  }

  /**
   * Get a single comment
   */
  async findOne(id: string): Promise<Comment> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        author: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!comment) throw new NotFoundException('Comment not found');
    return comment;
  }

  /**
   * Update a comment (only by original author)
   */
  async update(id: string, userId: string, updateCommentDto: UpdateCommentDto): Promise<Comment> {
    const comment = await this.findOne(id);

    // Only the original author can update
    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only update your own comments');
    }

    const updated = await this.prisma.comment.update({
      where: { id },
      data: updateCommentDto,
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        author: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    this.logger.log(`Comment updated: ${id}`);
    return updated;
  }

  /**
   * Delete a comment (only by original author or admin)
   */
  async remove(id: string, userId: string, isAdmin: boolean = false): Promise<void> {
    const comment = await this.findOne(id);

    // Only the original author or admin can delete
    if (!isAdmin && comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.comment.delete({ where: { id } });
    this.logger.log(`Comment deleted: ${id}`);
  }

  /**
   * Get comment statistics for a term
   */
  async getTermStatistics(termId: string) {
    const [total, byType] = await Promise.all([
      this.prisma.comment.count({ where: { termId } }),
      this.prisma.comment.groupBy({
        by: ['type'],
        where: { termId },
        _count: true,
      }),
    ]);

    const statistics = {
      total,
      byType: byType.reduce((acc, item) => {
        acc[item.type] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };

    return statistics;
  }

  /**
   * Bulk create comments for multiple students
   */
  async bulkCreate(
    termId: string,
    studentIds: string[],
    authorId: string,
    type: string,
    text: string
  ) {
    this.logger.log(`Bulk creating ${studentIds.length} comments`);

    const results = {
      successful: [] as Comment[],
      failed: [] as { studentId: string; error: string }[],
    };

    for (const studentId of studentIds) {
      try {
        const comment = await this.create({
          studentId,
          termId,
          authorId,
          type,
          text,
        } as CreateCommentDto);

        results.successful.push(comment);
      } catch (error) {
        results.failed.push({ studentId, error: error.message });
      }
    }

    this.logger.log(`Bulk comments complete: ${results.successful.length} successful, ${results.failed.length} failed`);
    return results;
  }
}
