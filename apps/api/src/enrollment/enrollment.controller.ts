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
import { EnrollmentService } from './enrollment.service';
import { CreateEnrollmentDto, UpdateEnrollmentDto, BulkEnrollDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles, CurrentUser } from '../auth/decorators';
import { UserRole } from '@classpoint/db';
import { TenantId } from '../common/decorators';

@ApiTags('Enrollment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('enrollments')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Enroll a student in a class for a term' })
  @ApiResponse({ status: 201, description: 'Enrollment created successfully' })
  @ApiResponse({ status: 400, description: 'Class at capacity or invalid data' })
  @ApiResponse({ status: 404, description: 'Student, term, or class not found' })
  @ApiResponse({ status: 409, description: 'Student already enrolled for this term' })
  create(@TenantId() tenantId: string, @Body() createEnrollmentDto: CreateEnrollmentDto) {
    return this.enrollmentService.create(tenantId, createEnrollmentDto);
  }

  @Post('bulk')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Bulk enroll students for a term' })
  @ApiResponse({ status: 201, description: 'Bulk enrollment completed' })
  @ApiResponse({ status: 404, description: 'Term not found' })
  bulkEnroll(@TenantId() tenantId: string, @Body() bulkEnrollDto: BulkEnrollDto) {
    return this.enrollmentService.bulkEnroll(tenantId, bulkEnrollDto);
  }

  @Post('promote/bulk')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Bulk promote students' })
  @ApiResponse({ status: 200, description: 'Students promoted successfully' })
  bulkPromote(
    @TenantId() tenantId: string,
    @CurrentUser('sub') userId: string,
    @Body() body: { enrollmentIds: string[] }
  ) {
    return this.enrollmentService.bulkPromote(tenantId, body.enrollmentIds, userId);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all enrollments with filtering' })
  @ApiResponse({ status: 200, description: 'Enrollments retrieved successfully' })
  findAll(
    @TenantId() tenantId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('termId') termId?: string,
    @Query('studentId') studentId?: string,
    @Query('classId') classId?: string,
    @Query('isPromoted') isPromoted?: string
  ) {
    return this.enrollmentService.findAll(tenantId, {
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      termId,
      studentId,
      classId,
      isPromoted: isPromoted ? isPromoted === 'true' : undefined,
    });
  }

  @Get('student/:studentId/current')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT)
  @ApiOperation({ summary: 'Get student current term enrollment' })
  @ApiResponse({ status: 200, description: 'Current enrollment retrieved' })
  @ApiResponse({ status: 404, description: 'No enrollment found for current term' })
  getCurrentEnrollment(
    @TenantId() tenantId: string,
    @Param('studentId') studentId: string
  ) {
    return this.enrollmentService.getCurrentEnrollment(tenantId, studentId);
  }

  @Get('student/:studentId/history')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT)
  @ApiOperation({ summary: 'Get student enrollment history' })
  @ApiResponse({ status: 200, description: 'Enrollment history retrieved' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  getStudentHistory(@TenantId() tenantId: string, @Param('studentId') studentId: string) {
    return this.enrollmentService.getStudentHistory(tenantId, studentId);
  }

  @Get('class/:classId/roster')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get class roster for a term' })
  @ApiResponse({ status: 200, description: 'Class roster retrieved' })
  @ApiResponse({ status: 404, description: 'Class or term not found' })
  getClassRoster(
    @TenantId() tenantId: string,
    @Param('classId') classId: string,
    @Query('termId') termId: string
  ) {
    if (!termId) {
      throw new Error('termId query parameter is required');
    }
    return this.enrollmentService.getClassRoster(tenantId, classId, termId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get a specific enrollment' })
  @ApiResponse({ status: 200, description: 'Enrollment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.enrollmentService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update an enrollment (change class or promotion status)' })
  @ApiResponse({ status: 200, description: 'Enrollment updated successfully' })
  @ApiResponse({ status: 400, description: 'New class at capacity' })
  @ApiResponse({ status: 404, description: 'Enrollment or new class not found' })
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateEnrollmentDto: UpdateEnrollmentDto
  ) {
    return this.enrollmentService.update(tenantId, id, updateEnrollmentDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Delete an enrollment' })
  @ApiResponse({ status: 200, description: 'Enrollment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.enrollmentService.remove(tenantId, id);
  }
}
