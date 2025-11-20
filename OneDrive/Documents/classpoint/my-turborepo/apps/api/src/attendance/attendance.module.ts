import { Module } from '@nestjs/common';
import { PrismaModule } from '@classpoint/db';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';

/**
 * Attendance Module
 *
 * Manages student attendance including:
 * - Daily attendance marking (AM/PM sessions)
 * - Subject-wise attendance tracking
 * - Bulk attendance operations
 * - Attendance reports and analytics
 * - Student attendance summaries
 * - Class attendance reports
 * - Attendance rate calculations
 */
@Module({
  imports: [PrismaModule],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
