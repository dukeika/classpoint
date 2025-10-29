import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@classpoint/db';
import { Event, Prisma } from '@classpoint/db';
import { CreateEventDto, UpdateEventDto } from '../dto';

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create event
   */
  async create(tenantId: string, createEventDto: CreateEventDto): Promise<Event> {
    this.logger.log(`Creating event: ${createEventDto.title}`);

    // Validate dates
    const startTime = new Date(createEventDto.startTime);
    const endTime = new Date(createEventDto.endTime);

    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    // Verify term if provided
    if (createEventDto.termId) {
      const term = await this.prisma.term.findFirst({
        where: {
          id: createEventDto.termId,
          tenantId,
        },
      });

      if (!term) {
        throw new NotFoundException(
          `Term with ID '${createEventDto.termId}' not found`,
        );
      }
    }

    try {
      const event = await this.prisma.event.create({
        data: {
          tenantId,
          ...createEventDto,
          startTime,
          endTime,
        },
        include: {
          term: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      this.logger.log(`Event created successfully: ${event.id}`);
      return event;
    } catch (error) {
      this.logger.error(
        `Failed to create event: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Find all events with filtering
   */
  async findAll(
    tenantId: string,
    params?: {
      skip?: number;
      take?: number;
      termId?: string;
      startDate?: Date;
      endDate?: Date;
      isPublic?: boolean;
    },
  ): Promise<{ data: Event[]; total: number }> {
    const { skip = 0, take = 50, termId, startDate, endDate, isPublic } =
      params || {};

    const where: Prisma.EventWhereInput = { tenantId };

    if (termId) where.termId = termId;
    if (isPublic !== undefined) where.isPublic = isPublic;

    // Date range filter
    if (startDate || endDate) {
      where.AND = [];
      if (startDate) {
        where.AND.push({ startTime: { gte: startDate } });
      }
      if (endDate) {
        where.AND.push({ endTime: { lte: endDate } });
      }
    }

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        skip,
        take,
        include: {
          term: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { startTime: 'asc' },
      }),
      this.prisma.event.count({ where }),
    ]);

    return { data: events, total };
  }

  /**
   * Find public events (for calendar/public site)
   */
  async findPublic(
    tenantId: string,
    params?: {
      skip?: number;
      take?: number;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<{ data: Event[]; total: number }> {
    return this.findAll(tenantId, {
      ...params,
      isPublic: true,
    });
  }

  /**
   * Find upcoming events
   */
  async findUpcoming(
    tenantId: string,
    limit: number = 10,
  ): Promise<Event[]> {
    const now = new Date();

    const events = await this.prisma.event.findMany({
      where: {
        tenantId,
        startTime: { gte: now },
      },
      take: limit,
      orderBy: { startTime: 'asc' },
      include: {
        term: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return events;
  }

  /**
   * Find one event by ID
   */
  async findOne(tenantId: string, id: string): Promise<Event> {
    const event = await this.prisma.event.findFirst({
      where: { id, tenantId },
      include: {
        term: {
          select: {
            id: true,
            name: true,
            session: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID '${id}' not found`);
    }

    return event;
  }

  /**
   * Update event
   */
  async update(
    tenantId: string,
    id: string,
    updateEventDto: UpdateEventDto,
  ): Promise<Event> {
    this.logger.log(`Updating event: ${id}`);

    // Verify event exists
    await this.findOne(tenantId, id);

    // Validate dates if provided
    const data: any = { ...updateEventDto };

    if (updateEventDto.startTime) {
      data.startTime = new Date(updateEventDto.startTime);
    }
    if (updateEventDto.endTime) {
      data.endTime = new Date(updateEventDto.endTime);
    }

    // Check date logic if both provided
    if (data.startTime && data.endTime && data.endTime <= data.startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    // Verify term if changing
    if (updateEventDto.termId) {
      const term = await this.prisma.term.findFirst({
        where: {
          id: updateEventDto.termId,
          tenantId,
        },
      });

      if (!term) {
        throw new NotFoundException(
          `Term with ID '${updateEventDto.termId}' not found`,
        );
      }
    }

    try {
      const event = await this.prisma.event.update({
        where: { id },
        data,
        include: {
          term: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      this.logger.log(`Event updated successfully: ${id}`);
      return event;
    } catch (error) {
      this.logger.error(
        `Failed to update event: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Delete event
   */
  async remove(tenantId: string, id: string): Promise<void> {
    this.logger.log(`Deleting event: ${id}`);

    // Verify event exists
    await this.findOne(tenantId, id);

    try {
      await this.prisma.event.delete({
        where: { id },
      });

      this.logger.log(`Event deleted successfully: ${id}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete event: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }
}
