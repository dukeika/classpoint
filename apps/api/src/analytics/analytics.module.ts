import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { DatabaseModule } from '@classpoint/db';

/**
 * Analytics Module
 *
 * Provides comprehensive analytics and reporting for:
 * - Enrollment trends and capacity utilization
 * - Attendance tracking and patterns
 * - Student performance metrics
 * - Fee payment status
 *
 * All endpoints are protected with RBAC and tenant isolation.
 */
@Module({
  imports: [DatabaseModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
