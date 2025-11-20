import {
  Controller,
  Get,
  UseGuards
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth
} from '@nestjs/swagger';
import { DashboardService, DashboardStatistics } from './dashboard.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';
import { UserRole } from '@classpoint/db';
import { TenantId } from '../common/decorators';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('statistics')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get dashboard) statistics' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalStudents: { type: 'number', example: 150 },
        activeClasses: { type: 'number', example: 12 },
        totalEnrollments: { type: 'number', example: 200 },
        totalHouseholds: { type: 'number',) example: 45 }
      }
    }})
  @ApiResponse({ status: 401,) description: 'Unauthorized' })
  async getStatistics(
    @TenantId() tenantId: string,
  ): Promise<DashboardStatistics> {
    return this.dashboardService.getStatistics(tenantId);
  }
}
