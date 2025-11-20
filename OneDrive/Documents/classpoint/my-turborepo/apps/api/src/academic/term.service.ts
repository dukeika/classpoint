import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@classpoint/db';
import { Term, Prisma } from '@classpoint/db';
import { CreateTermDto } from './dto/create-term.dto';
import { UpdateTermDto } from './dto/update-term.dto';

@Injectable()
export class TermService {
  private readonly logger = new Logger(TermService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new academic term
   */
  async create(tenantId: string, createTermDto: CreateTermDto): Promise<Term> {
    this.logger.log(`Creating term for session: ${createTermDto.sessionId}`);

    // Verify session exists and belongs to tenant
    const session = await this.prisma.session.findFirst({
      where: {
        id: createTermDto.sessionId,
        tenantId,
      },
    });

    if (!session) {
      throw new NotFoundException(
        `Session with ID '${createTermDto.sessionId}' not found for this tenant`
      );
    }

    // Validate dates
    const startDate = new Date(createTermDto.startDate);
    const endDate = new Date(createTermDto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Check for overlapping terms in the same session
    const overlapping = await this.prisma.term.findFirst({
      where: {
        sessionId: createTermDto.sessionId,
        OR: [
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: startDate } },
            ],
          },
          {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: endDate } },
            ],
          },
          {
            AND: [
              { startDate: { gte: startDate } },
              { endDate: { lte: endDate } },
            ],
          },
        ],
      },
    });

    if (overlapping) {
      throw new ConflictException(
        `Term dates overlap with existing term '${overlapping.name}'`
      );
    }

    // If this term is set as current, unset other current terms in the same session
    if (createTermDto.isCurrent) {
      await this.prisma.term.updateMany({
        where: {
          sessionId: createTermDto.sessionId,
          isCurrent: true,
        },
        data: {
          isCurrent: false,
        },
      });
    }

    try {
      const term = await this.prisma.term.create({
        data: {
          tenantId,
          sessionId: createTermDto.sessionId,
          name: createTermDto.name,
          startDate,
          endDate,
          isCurrent: createTermDto.isCurrent || false,
        },
        include: {
          session: true,
        },
      });

      this.logger.log(`Term created successfully: ${term.id}`);
      return term;
    } catch (error) {
      this.logger.error(`Failed to create term: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Get all terms for a tenant with optional filtering
   */
  async findAll(
    tenantId: string,
    params?: {
      skip?: number;
      take?: number;
      sessionId?: string;
      isCurrent?: boolean;
    }
  ): Promise<{ data: Term[]; total: number }> {
    const { skip = 0, take = 50, sessionId, isCurrent } = params || {};

    const where: Prisma.TermWhereInput = { tenantId };

    if (sessionId) {
      where.sessionId = sessionId;
    }

    if (isCurrent !== undefined) {
      where.isCurrent = isCurrent;
    }

    const [terms, total] = await Promise.all([
      this.prisma.term.findMany({
        where,
        skip,
        take,
        include: {
          session: true,
          _count: {
            select: {
              enrollments: true,
              assessments: true,
            },
          },
        },
        orderBy: { startDate: 'desc' },
      }),
      this.prisma.term.count({ where }),
    ]);

    return {
      data: terms,
      total,
    };
  }

  /**
   * Get a single term by ID
   */
  async findOne(tenantId: string, id: string): Promise<Term> {
    const term = await this.prisma.term.findFirst({
      where: { id, tenantId },
      include: {
        session: true,
        _count: {
          select: {
            enrollments: true,
            assessments: true,
            events: true,
          },
        },
      },
    });

    if (!term) {
      throw new NotFoundException(`Term with ID '${id}' not found`);
    }

    return term;
  }

  /**
   * Get the current active term for a tenant
   */
  async getCurrentTerm(tenantId: string): Promise<Term | null> {
    const term = await this.prisma.term.findFirst({
      where: {
        tenantId,
        isCurrent: true,
      },
      include: {
        session: true,
      },
      orderBy: { startDate: 'desc' },
    });

    return term;
  }

  /**
   * Update a term
   */
  async update(
    tenantId: string,
    id: string,
    updateTermDto: UpdateTermDto
  ): Promise<Term> {
    this.logger.log(`Updating term: ${id}`);

    // Verify term exists
    const existingTerm = await this.findOne(tenantId, id);

    // Validate dates if being updated
    if (updateTermDto.startDate || updateTermDto.endDate) {
      const startDate = updateTermDto.startDate
        ? new Date(updateTermDto.startDate)
        : existingTerm.startDate;
      const endDate = updateTermDto.endDate
        ? new Date(updateTermDto.endDate)
        : existingTerm.endDate;

      if (endDate <= startDate) {
        throw new BadRequestException('End date must be after start date');
      }

      // Check for overlapping terms (excluding current term)
      const overlapping = await this.prisma.term.findFirst({
        where: {
          sessionId: existingTerm.sessionId,
          id: { not: id },
          OR: [
            {
              AND: [
                { startDate: { lte: startDate } },
                { endDate: { gte: startDate } },
              ],
            },
            {
              AND: [
                { startDate: { lte: endDate } },
                { endDate: { gte: endDate } },
              ],
            },
            {
              AND: [
                { startDate: { gte: startDate } },
                { endDate: { lte: endDate } },
              ],
            },
          ],
        },
      });

      if (overlapping) {
        throw new ConflictException(
          `Term dates overlap with existing term '${overlapping.name}'`
        );
      }
    }

    // If setting this term as current, unset other current terms in the same session
    if (updateTermDto.isCurrent) {
      await this.prisma.term.updateMany({
        where: {
          sessionId: existingTerm.sessionId,
          isCurrent: true,
          id: { not: id },
        },
        data: {
          isCurrent: false,
        },
      });
    }

    try {
      // Convert date strings to Date objects if present
      const data: any = { ...updateTermDto };
      if (data.startDate) {
        data.startDate = new Date(data.startDate);
      }
      if (data.endDate) {
        data.endDate = new Date(data.endDate);
      }

      const term = await this.prisma.term.update({
        where: { id },
        data,
        include: {
          session: true,
        },
      });

      this.logger.log(`Term updated successfully: ${id}`);
      return term;
    } catch (error) {
      this.logger.error(`Failed to update term: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Delete a term
   */
  async remove(tenantId: string, id: string): Promise<void> {
    this.logger.log(`Deleting term: ${id}`);

    // Verify term exists
    await this.findOne(tenantId, id);

    // Check if term has active enrollments
    const enrollmentCount = await this.prisma.enrollment.count({
      where: { termId: id },
    });

    if (enrollmentCount > 0) {
      throw new BadRequestException(
        `Cannot delete term with existing enrollments. Please remove all enrollments first. Current count: ${enrollmentCount}`
      );
    }

    try {
      await this.prisma.term.delete({
        where: { id },
      });

      this.logger.log(`Term deleted successfully: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete term: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Set a term as the current active term
   */
  async setAsCurrent(tenantId: string, id: string): Promise<Term> {
    this.logger.log(`Setting term as current: ${id}`);

    // Verify term exists
    const term = await this.findOne(tenantId, id);

    // Unset other current terms in the same session
    await this.prisma.term.updateMany({
      where: {
        sessionId: term.sessionId,
        isCurrent: true,
        id: { not: id },
      },
      data: {
        isCurrent: false,
      },
    });

    // Set this term as current
    const updatedTerm = await this.prisma.term.update({
      where: { id },
      data: { isCurrent: true },
      include: {
        session: true,
      },
    });

    this.logger.log(`Term set as current successfully: ${id}`);
    return updatedTerm;
  }
}
