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
import { ExternalReportService } from './external-report.service';
import { CreateExternalReportDto, UpdateExternalReportDto, GeneratePresignedUrlDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';
import { UserRole } from '@classpoint/db';
import { TenantId } from '../common/decorators';

@ApiTags('External Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('external-reports')
export class ExternalReportController {
  constructor(private readonly externalReportService: ExternalReportService) {}

  @Post('presigned-url')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Generate presigned URL for upload/download' })
  @ApiResponse({ status: 201, description: 'Presigned URL generated' })
  generatePresignedUrl(
    @TenantId() tenantId: string,
    @Body() generatePresignedUrlDto: GeneratePresignedUrlDto
  ) {
    return this.externalReportService.generatePresignedUrl(tenantId, generatePresignedUrlDto);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Create external report record' })
  @ApiResponse({ status: 201, description: 'External report created' })
  create(@TenantId() tenantId: string, @Body() createExternalReportDto: CreateExternalReportDto) {
    return this.externalReportService.create(tenantId, createExternalReportDto);
  }

  @Get('student/:studentId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get external reports for a student' })
  @ApiResponse({ status: 200, description: 'Reports retrieved' })
  findByStudent(
    @TenantId() tenantId: string,
    @Param('studentId') studentId: string,
    @Query('termId') termId?: string
  ) {
    return this.externalReportService.findByStudent(tenantId, studentId, termId);
  }

  @Get('term/:termId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all external reports for a term' })
  @ApiResponse({ status: 200, description: 'Reports retrieved' })
  findByTerm(@TenantId() tenantId: string, @Param('termId') termId: string) {
    return this.externalReportService.findByTerm(tenantId, termId);
  }

  @Get('statistics')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get external report statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  getStatistics(@TenantId() tenantId: string, @Query('termId') termId?: string) {
    return this.externalReportService.getStatistics(tenantId, termId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get an external report by ID' })
  @ApiResponse({ status: 200, description: 'Report retrieved' })
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.externalReportService.findOne(tenantId, id);
  }

  @Get(':id/download')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get download URL for an external report' })
  @ApiResponse({ status: 200, description: 'Download URL generated' })
  getDownloadUrl(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.externalReportService.getDownloadUrl(tenantId, id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Update external report metadata' })
  @ApiResponse({ status: 200, description: 'Report updated' })
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateExternalReportDto: UpdateExternalReportDto
  ) {
    return this.externalReportService.update(tenantId, id, updateExternalReportDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Delete external report' })
  @ApiResponse({ status: 200, description: 'Report deleted' })
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.externalReportService.remove(tenantId, id);
  }
}
