import { Module } from '@nestjs/common';
import { PrismaModule } from '@classpoint/db';
import { EnrollmentService } from './enrollment.service';
import { EnrollmentController } from './enrollment.controller';

/**
 * Enrollment Module
 *
 * Manages student enrollments including:
 * - Student registration in classes for terms
 * - Class assignment with capacity checking
 * - Bulk enrollment operations
 * - Promotion tracking
 * - Class rosters
 * - Student enrollment history
 */
@Module({
  imports: [PrismaModule],
  controllers: [EnrollmentController],
  providers: [EnrollmentService],
  exports: [EnrollmentService],
})
export class EnrollmentModule {}
