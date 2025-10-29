import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FeeStatusService } from './fee-status.service';
import { CreateFeeStatusDto, UpdateFeeStatusDto, BulkUpdateFeeStatusDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';
import { UserRole, FeeStatusType } from '@classpoint/db';
import { TenantId } from '../common/decorators';

@ApiTags('Fee Status')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fee-status')
export class FeeStatusController {
  constructor(private readonly feeStatusService: FeeStatusService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Create a fee status record' })
  @ApiResponse({ status: 201, description: 'Fee status created successfully' })
  @ApiResponse({ status: 404, description: 'Student or term not found' })
  @ApiResponse({ status: 409, description: 'Fee status already exists' })
  create(@TenantId() tenantId: string, @Body() createFeeStatusDto: CreateFeeStatusDto) {
    return this.feeStatusService.create(tenantId, createFeeStatusDto);
  }

  @Post('bulk-update')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Bulk update fee statuses via CSV import' })
  @ApiResponse({ status: 200, description: 'Bulk update completed' })
  @ApiResponse({ status: 404, description: 'Term not found' })
  bulkUpdate(
    @TenantId() tenantId: string,
    @Body() bulkUpdateDto: BulkUpdateFeeStatusDto
  ) {
    return this.feeStatusService.bulkUpdate(tenantId, bulkUpdateDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all fee statuses with filtering' })
  @ApiResponse({ status: 200, description: 'Fee statuses retrieved successfully' })
  findAll(
    @TenantId() tenantId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('termId') termId?: string,
    @Query('studentId') studentId?: string,
    @Query('status') status?: FeeStatusType
  ) {
    return this.feeStatusService.findAll(tenantId, {
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      termId,
      studentId,
      status,
    });
  }

  @Get('term/:termId/summary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get fee status summary for a term' })
  @ApiResponse({ status: 200, description: 'Summary retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Term not found' })
  getTermSummary(@TenantId() tenantId: string, @Param('termId') termId: string) {
    return this.feeStatusService.getTermSummary(tenantId, termId);
  }

  @Get('student/:studentId/term/:termId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT)
  @ApiOperation({ summary: 'Get fee status for a student in a specific term' })
  @ApiResponse({ status: 200, description: 'Fee status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  findByStudentAndTerm(
    @TenantId() tenantId: string,
    @Param('studentId') studentId: string,
    @Param('termId') termId: string
  ) {
    return this.feeStatusService.findByStudentAndTerm(tenantId, studentId, termId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get a specific fee status' })
  @ApiResponse({ status: 200, description: 'Fee status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Fee status not found' })
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.feeStatusService.findOne(tenantId, id);
  }

  @Get(':id/audit-history')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get audit history for a fee status' })
  @ApiResponse({ status: 200, description: 'Audit history retrieved' })
  @ApiResponse({ status: 404, description: 'Fee status not found' })
  getAuditHistory(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.feeStatusService.getAuditHistory(tenantId, id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update a fee status' })
  @ApiResponse({ status: 200, description: 'Fee status updated successfully' })
  @ApiResponse({ status: 404, description: 'Fee status not found' })
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateFeeStatusDto: UpdateFeeStatusDto
  ) {
    return this.feeStatusService.update(tenantId, id, updateFeeStatusDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Delete a fee status' })
  @ApiResponse({ status: 200, description: 'Fee status deleted successfully' })
  @ApiResponse({ status: 404, description: 'Fee status not found' })
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.feeStatusService.remove(tenantId, id);
  }
}
