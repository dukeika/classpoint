import {
  Controller,
  Get,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import {
  EnrollmentAnalyticsQueryDto,
  AttendanceReportQueryDto,
  PerformanceMetricsQueryDto,
  FeeStatusReportQueryDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';
import { UserRole } from '@classpoint/db';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Get enrollment analytics
   * GET /analytics/enrollment
   */
  @Get('enrollment')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.BURSAR
  )
  async getEnrollmentAnalytics(
    @TenantId() tenantId: string,
    @Query() query: EnrollmentAnalyticsQueryDto
  ) {
    this.logger.log(`Getting enrollment analytics for tenant: ${tenantId}`);
    return this.analyticsService.getEnrollmentAnalytics(tenantId, query);
  }

  /**
   * Get attendance reports
   * GET /analytics/attendance
   */
  @Get('attendance')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.EXAMS_OFFICER
  )
  async getAttendanceReport(
    @TenantId() tenantId: string,
    @Query() query: AttendanceReportQueryDto
  ) {
    this.logger.log(`Getting attendance report for tenant: ${tenantId}`);
    return this.analyticsService.getAttendanceReport(tenantId, query);
  }

  /**
   * Get performance metrics
   * GET /analytics/performance
   */
  @Get('performance')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.EXAMS_OFFICER
  )
  async getPerformanceMetrics(
    @TenantId() tenantId: string,
    @Query() query: PerformanceMetricsQueryDto
  ) {
    this.logger.log(`Getting performance metrics for tenant: ${tenantId}`);
    return this.analyticsService.getPerformanceMetrics(tenantId, query);
  }

  /**
   * Get fee status reports
   * GET /analytics/fee-status
   */
  @Get('fee-status')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_ADMIN,
    UserRole.BURSAR
  )
  async getFeeStatusReport(
    @TenantId() tenantId: string,
    @Query() query: FeeStatusReportQueryDto
  ) {
    this.logger.log(`Getting fee status report for tenant: ${tenantId}`);
    return this.analyticsService.getFeeStatusReport(tenantId, query);
  }
}
