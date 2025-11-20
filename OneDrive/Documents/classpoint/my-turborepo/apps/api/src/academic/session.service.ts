import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@classpoint/db';
import { Session, Prisma } from '@classpoint/db';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new academic session
   */
  async create(tenantId: string, createSessionDto: CreateSessionDto): Promise<Session> {
    this.logger.log(`Creating session for tenant: ${tenantId}`);

    // Validate year range
    if (createSessionDto.endYear <= createSessionDto.startYear) {
      throw new BadRequestException('End year must be after start year');
    }

    // Check if session with this name already exists for tenant
    const existing = await this.prisma.session.findFirst({
      where: {
        tenantId,
        name: createSessionDto.name,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Session '${createSessionDto.name}' already exists for this tenant`
      );
    }

    try {
      const session = await this.prisma.session.create({
        data: {
          tenantId,
          name: createSessionDto.name,
          startYear: createSessionDto.startYear,
          endYear: createSessionDto.endYear,
        },
        include: {
          terms: true,
          _count: {
            select: { terms: true },
          },
        },
      });

      this.logger.log(`Session created successfully: ${session.id}`);
      return session;
    } catch (error) {
      this.logger.error(`Failed to create session: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Get all sessions for a tenant with optional filtering
   */
  async findAll(
    tenantId: string,
    params?: {
      skip?: number;
      take?: number;
      year?: number;
    }
  ): Promise<{ data: Session[]; total: number }> {
    const { skip = 0, take = 50, year } = params || {};

    const where: Prisma.SessionWhereInput = { tenantId };

    if (year) {
      where.OR = [
        { startYear: year },
        { endYear: year },
      ];
    }

    const [sessions, total] = await Promise.all([
      this.prisma.session.findMany({
        where,
        skip,
        take,
        include: {
          terms: true,
          _count: {
            select: { terms: true },
          },
        },
        orderBy: { startYear: 'desc' },
      }),
      this.prisma.session.count({ where }),
    ]);

    return {
      data: sessions,
      total,
    };
  }

  /**
   * Get a single session by ID
   */
  async findOne(tenantId: string, id: string): Promise<Session> {
    const session = await this.prisma.session.findFirst({
      where: { id, tenantId },
      include: {
        terms: {
          orderBy: { startDate: 'asc' },
        },
        _count: {
          select: { terms: true },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID '${id}' not found`);
    }

    return session;
  }

  /**
   * Get the current active session (based on current date)
   */
  async getCurrentSession(tenantId: string): Promise<Session | null> {
    const currentYear = new Date().getFullYear();

    const session = await this.prisma.session.findFirst({
      where: {
        tenantId,
        OR: [
          { startYear: currentYear },
          { endYear: currentYear },
          {
            AND: [
              { startYear: { lte: currentYear } },
              { endYear: { gte: currentYear } },
            ],
          },
        ],
      },
      include: {
        terms: {
          where: { isCurrent: true },
          orderBy: { startDate: 'asc' },
        },
        _count: {
          select: { terms: true },
        },
      },
      orderBy: { startYear: 'desc' },
    });

    return session;
  }

  /**
   * Update a session
   */
  async update(
    tenantId: string,
    id: string,
    updateSessionDto: UpdateSessionDto
  ): Promise<Session> {
    this.logger.log(`Updating session: ${id}`);

    // Verify session exists
    await this.findOne(tenantId, id);

    // Validate year range if both are being updated
    if (updateSessionDto.startYear && updateSessionDto.endYear) {
      if (updateSessionDto.endYear <= updateSessionDto.startYear) {
        throw new BadRequestException('End year must be after start year');
      }
    }

    // Check for name conflict if name is being updated
    if (updateSessionDto.name) {
      const existing = await this.prisma.session.findFirst({
        where: {
          tenantId,
          name: updateSessionDto.name,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Session '${updateSessionDto.name}' already exists for this tenant`
        );
      }
    }

    try {
      const session = await this.prisma.session.update({
        where: { id },
        data: updateSessionDto,
        include: {
          terms: true,
          _count: {
            select: { terms: true },
          },
        },
      });

      this.logger.log(`Session updated successfully: ${id}`);
      return session;
    } catch (error) {
      this.logger.error(`Failed to update session: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Delete a session
   */
  async remove(tenantId: string, id: string): Promise<void> {
    this.logger.log(`Deleting session: ${id}`);

    // Verify session exists
    await this.findOne(tenantId, id);

    // Check if session has active terms
    const termCount = await this.prisma.term.count({
      where: { sessionId: id },
    });

    if (termCount > 0) {
      throw new BadRequestException(
        `Cannot delete session with existing terms. Please delete all terms first. Current count: ${termCount}`
      );
    }

    try {
      await this.prisma.session.delete({
        where: { id },
      });

      this.logger.log(`Session deleted successfully: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete session: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Get all terms for a specific session
   */
  async getSessionTerms(tenantId: string, sessionId: string) {
    // Verify session exists
    await this.findOne(tenantId, sessionId);

    const terms = await this.prisma.term.findMany({
      where: { sessionId, tenantId },
      orderBy: { startDate: 'asc' },
    });

    return terms;
  }
}
