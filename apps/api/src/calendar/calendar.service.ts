import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@classpoint/db';
import { Event, Prisma } from '@classpoint/db';
import {
  CalendarQueryDto,
  CalendarView,
  EventRangeQueryDto,
} from './dto';

interface CalendarEventData {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startTime: Date;
  endTime: Date;
  isPublic: boolean;
  isRecurring: boolean;
  recurrenceRule?: string | null;
  term?: {
    id: string;
    name: string;
  } | null;
}

interface CalendarResponse {
  events: CalendarEventData[];
  period: {
    start: Date;
    end: Date;
    label: string;
  };
  view: CalendarView;
}

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get calendar view (month, week, day, or agenda)
   */
  async getCalendarView(
    tenantId: string,
    query: CalendarQueryDto
  ): Promise<CalendarResponse> {
    this.logger.log(`Getting ${query.view} calendar view for tenant: ${tenantId}`);

    const focalDate = new Date(query.date);
    const period = this.calculatePeriod(focalDate, query.view);

    const where: Prisma.EventWhereInput = {
      tenantId,
      AND: [
        { startTime: { lte: period.end } },
        { endTime: { gte: period.start } },
      ],
    };

    if (query.termId) {
      where.termId = query.termId;
    }

    if (query.publicOnly) {
      where.isPublic = true;
    }

    const events = await this.prisma.event.findMany({
      where,
      include: {
        term: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return {
      events,
      period,
      view: query.view,
    };
  }

  /**
   * Get events in date range
   */
  async getEventsInRange(
    tenantId: string,
    query: EventRangeQueryDto
  ): Promise<Event[]> {
    const where: Prisma.EventWhereInput = {
      tenantId,
      AND: [
        { startTime: { lte: new Date(query.endDate) } },
        { endTime: { gte: new Date(query.startDate) } },
      ],
    };

    if (query.termId) {
      where.termId = query.termId;
    }

    if (query.publicOnly) {
      where.isPublic = true;
    }

    return this.prisma.event.findMany({
      where,
      include: {
        term: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  /**
   * Export events to ICS (iCalendar) format
   */
  async exportToICS(
    tenantId: string,
    query: EventRangeQueryDto
  ): Promise<string> {
    this.logger.log(`Exporting events to ICS for tenant: ${tenantId}`);

    const events = await this.getEventsInRange(tenantId, query);
    const schoolInfo = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        schoolName: true,
        email: true,
      },
    });

    return this.generateICS(events, schoolInfo?.schoolName || 'School Calendar');
  }

  /**
   * Generate ICS file content
   */
  private generateICS(events: Event[], calendarName: string): string {
    const lines: string[] = [];

    // Calendar header
    lines.push('BEGIN:VCALENDAR');
    lines.push('VERSION:2.0');
    lines.push('PRODID:-//ClassPoint//School Calendar//EN');
    lines.push('CALSCALE:GREGORIAN');
    lines.push('METHOD:PUBLISH');
    lines.push(`X-WR-CALNAME:${this.escapeICS(calendarName)}`);
    lines.push(`X-WR-TIMEZONE:Africa/Johannesburg`);

    // Add each event
    events.forEach((event) => {
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${event.id}@classpoint.ng`);
      lines.push(`DTSTAMP:${this.formatICSDate(new Date())}`);
      lines.push(`DTSTART:${this.formatICSDate(event.startTime)}`);
      lines.push(`DTEND:${this.formatICSDate(event.endTime)}`);
      lines.push(`SUMMARY:${this.escapeICS(event.title)}`);

      if (event.description) {
        lines.push(`DESCRIPTION:${this.escapeICS(event.description)}`);
      }

      if (event.location) {
        lines.push(`LOCATION:${this.escapeICS(event.location)}`);
      }

      if (event.recurrenceRule) {
        lines.push(`RRULE:${event.recurrenceRule}`);
      }

      lines.push(`STATUS:CONFIRMED`);
      lines.push(`TRANSP:OPAQUE`);
      lines.push('END:VEVENT');
    });

    // Calendar footer
    lines.push('END:VCALENDAR');

    return lines.join('\r\n');
  }

  /**
   * Format date for ICS (yyyyMMddTHHmmssZ)
   */
  private formatICSDate(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');

    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  }

  /**
   * Escape special characters for ICS format
   */
  private escapeICS(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '');
  }

  /**
   * Calculate period based on view type
   */
  private calculatePeriod(
    focalDate: Date,
    view: CalendarView
  ): { start: Date; end: Date; label: string } {
    const start = new Date(focalDate);
    const end = new Date(focalDate);

    switch (view) {
      case CalendarView.MONTH:
        // First day of month to last day of month
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        return {
          start,
          end,
          label: focalDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
          }),
        };

      case CalendarView.WEEK:
        // Start of week (Sunday) to end of week (Saturday)
        const dayOfWeek = focalDate.getDay();
        start.setDate(focalDate.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        end.setDate(focalDate.getDate() + (6 - dayOfWeek));
        end.setHours(23, 59, 59, 999);
        return {
          start,
          end,
          label: `Week of ${start.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}`,
        };

      case CalendarView.DAY:
        // Same day, midnight to 11:59:59 PM
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return {
          start,
          end,
          label: focalDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        };

      case CalendarView.AGENDA:
        // Next 30 days
        start.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() + 30);
        end.setHours(23, 59, 59, 999);
        return {
          start,
          end,
          label: 'Next 30 Days',
        };

      default:
        // Default to month view
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        return {
          start,
          end,
          label: 'Month View',
        };
    }
  }

  /**
   * Get events conflicting with a time slot
   */
  async getConflictingEvents(
    tenantId: string,
    startTime: Date,
    endTime: Date,
    excludeEventId?: string
  ): Promise<Event[]> {
    const where: Prisma.EventWhereInput = {
      tenantId,
      AND: [
        { startTime: { lt: endTime } },
        { endTime: { gt: startTime } },
      ],
    };

    if (excludeEventId) {
      where.NOT = { id: excludeEventId };
    }

    return this.prisma.event.findMany({
      where,
      include: {
        term: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  /**
   * Get calendar statistics
   */
  async getCalendarStats(tenantId: string, termId?: string) {
    const where: Prisma.EventWhereInput = { tenantId };
    if (termId) {
      where.termId = termId;
    }

    const now = new Date();

    const [totalEvents, upcomingEvents, pastEvents, publicEvents] =
      await Promise.all([
        this.prisma.event.count({ where }),
        this.prisma.event.count({
          where: {
            ...where,
            startTime: { gte: now },
          },
        }),
        this.prisma.event.count({
          where: {
            ...where,
            endTime: { lt: now },
          },
        }),
        this.prisma.event.count({
          where: {
            ...where,
            isPublic: true,
          },
        }),
      ]);

    return {
      totalEvents,
      upcomingEvents,
      pastEvents,
      publicEvents,
      privateEvents: totalEvents - publicEvents,
    };
  }
}
