import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  Query,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
  Res,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import { CalendarService } from './calendar.service';
import { ReminderService } from './reminder.service';
import {
  CalendarQueryDto,
  EventRangeQueryDto,
  CreateReminderDto,
  BulkCreateReminderDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@classpoint/db';

@Controller('calendar')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CalendarController {
  private readonly logger = new Logger(CalendarController.name);

  constructor(
    private readonly calendarService: CalendarService,
    private readonly reminderService: ReminderService
  ) {}

  /**
   * Get calendar view (month, week, day, agenda)
   * GET /calendar/view
   */
  @Get('view')
  async getCalendarView(
    @TenantId() tenantId: string,
    @Query() query: CalendarQueryDto
  ) {
    this.logger.log(`Getting calendar view for tenant: ${tenantId}`);
    return this.calendarService.getCalendarView(tenantId, query);
  }

  /**
   * Get events in date range
   * GET /calendar/events
   */
  @Get('events')
  async getEventsInRange(
    @TenantId() tenantId: string,
    @Query() query: EventRangeQueryDto
  ) {
    return this.calendarService.getEventsInRange(tenantId, query);
  }

  /**
   * Export calendar to ICS file
   * GET /calendar/export/ics
   */
  @Get('export/ics')
  @Header('Content-Type', 'text/calendar')
  async exportToICS(
    @TenantId() tenantId: string,
    @Query() query: EventRangeQueryDto,
    @Res() res: Response
  ) {
    this.logger.log(`Exporting calendar to ICS for tenant: ${tenantId}`);

    const icsContent = await this.calendarService.exportToICS(tenantId, query);

    const filename = `calendar-${new Date().toISOString().split('T')[0]}.ics`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(icsContent);
  }

  /**
   * Check for event conflicts
   * GET /calendar/conflicts
   */
  @Get('conflicts')
  async getConflictingEvents(
    @TenantId() tenantId: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
    @Query('excludeEventId') excludeEventId?: string
  ) {
    return this.calendarService.getConflictingEvents(
      tenantId,
      new Date(startTime),
      new Date(endTime),
      excludeEventId
    );
  }

  /**
   * Get calendar statistics
   * GET /calendar/stats
   */
  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async getCalendarStats(
    @TenantId() tenantId: string,
    @Query('termId') termId?: string
  ) {
    return this.calendarService.getCalendarStats(tenantId, termId);
  }

  /**
   * Create a reminder for an event
   * POST /calendar/reminders
   */
  @Post('reminders')
  async createReminder(
    @CurrentUser('id') userId: string,
    @Body() createReminderDto: CreateReminderDto
  ) {
    return this.reminderService.create(userId, createReminderDto);
  }

  /**
   * Create multiple reminders at once
   * POST /calendar/reminders/bulk
   */
  @Post('reminders/bulk')
  async createBulkReminders(
    @CurrentUser('id') userId: string,
    @Body() bulkCreateDto: BulkCreateReminderDto
  ) {
    return this.reminderService.createBulk(userId, bulkCreateDto);
  }

  /**
   * Get user's reminders
   * GET /calendar/reminders
   */
  @Get('reminders')
  async getMyReminders(
    @CurrentUser('id') userId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('upcomingOnly') upcomingOnly?: string
  ) {
    return this.reminderService.findByUser(userId, {
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      upcomingOnly: upcomingOnly === 'true',
    });
  }

  /**
   * Get reminders for an event
   * GET /calendar/reminders/event/:eventId
   */
  @Get('reminders/event/:eventId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async getEventReminders(@Param('eventId') eventId: string) {
    return this.reminderService.findByEvent(eventId);
  }

  /**
   * Get reminder statistics
   * GET /calendar/reminders/stats
   */
  @Get('reminders/stats')
  async getReminderStats(@CurrentUser('id') userId: string) {
    return this.reminderService.getStats(userId);
  }

  /**
   * Delete a reminder
   * DELETE /calendar/reminders/:id
   */
  @Delete('reminders/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteReminder(
    @CurrentUser('id') userId: string,
    @Param('id') id: string
  ) {
    await this.reminderService.remove(userId, id);
  }

  /**
   * Process pending reminders (admin/cron only)
   * POST /calendar/reminders/process
   */
  @Post('reminders/process')
  @Roles(UserRole.SUPER_ADMIN)
  async processPendingReminders() {
    return this.reminderService.processPendingReminders();
  }
}
