import { Module } from '@nestjs/common';
import { DatabaseModule } from '@classpoint/db';
import { CalendarService } from './calendar.service';
import { ReminderService } from './reminder.service';
import { CalendarController } from './calendar.controller';

/**
 * Calendar Module
 *
 * Provides comprehensive calendar and event management:
 * - Calendar views (month, week, day, agenda)
 * - ICS/iCalendar export for external calendar apps
 * - Event conflict detection
 * - Reminder system with multiple notification types
 * - Calendar statistics and analytics
 *
 * Integrates with existing Event model from CMS module.
 * All endpoints are protected with RBAC and tenant isolation.
 */
@Module({
  imports: [DatabaseModule],
  controllers: [CalendarController],
  providers: [CalendarService, ReminderService],
  exports: [CalendarService, ReminderService],
})
export class CalendarModule {}
