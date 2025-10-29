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
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto, UpdateAttendanceDto, BulkAttendanceDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';
import { UserRole, AttendanceStatus } from '@classpoint/db';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Mark attendance for a student' })
  @ApiResponse({ status: 201, description: 'Attendance marked successfully' })
  @ApiResponse({ status: 404, description: 'Student or class not found' })
  @ApiResponse({ status: 409, description: 'Attendance already exists' })
  create(@Body() createAttendanceDto: CreateAttendanceDto) {
    return this.attendanceService.create(createAttendanceDto);
  }

  @Post('bulk')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Bulk mark attendance for a class' })
  @ApiResponse({ status: 201, description: 'Bulk attendance marked' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  bulkCreate(@Body() bulkAttendanceDto: BulkAttendanceDto) {
    return this.attendanceService.bulkCreate(bulkAttendanceDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get attendance records with filtering' })
  @ApiResponse({ status: 200, description: 'Attendance records retrieved' })
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('studentId') studentId?: string,
    @Query('classId') classId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('session') session?: string,
    @Query('status') status?: AttendanceStatus
  ) {
    return this.attendanceService.findAll({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(skip, 10) : undefined,
      studentId,
      classId,
      dateFrom,
      dateTo,
      session,
      status,
    });
  }

  @Get('class/:classId/date/:date')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get class attendance for a specific date' })
  @ApiResponse({ status: 200, description: 'Class attendance retrieved' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  getClassAttendance(
    @Param('classId') classId: string,
    @Param('date') date: string,
    @Query('session') session: string
  ) {
    if (!session) {
      throw new Error('session query parameter is required');
    }
    return this.attendanceService.getClassAttendance(classId, date, session);
  }

  @Get('student/:studentId/summary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT)
  @ApiOperation({ summary: 'Get student attendance summary' })
  @ApiResponse({ status: 200, description: 'Student summary retrieved' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  getStudentSummary(
    @Param('studentId') studentId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string
  ) {
    return this.attendanceService.getStudentSummary(studentId, dateFrom, dateTo);
  }

  @Get('class/:classId/report')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get attendance report for a class' })
  @ApiResponse({ status: 200, description: 'Report generated' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  getAttendanceReport(
    @Param('classId') classId: string,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('session') session?: string
  ) {
    if (!dateFrom || !dateTo) {
      throw new Error('dateFrom and dateTo query parameters are required');
    }
    return this.attendanceService.getAttendanceReport(classId, dateFrom, dateTo, session);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get a specific attendance record' })
  @ApiResponse({ status: 200, description: 'Attendance retrieved' })
  @ApiResponse({ status: 404, description: 'Attendance not found' })
  findOne(@Param('id') id: string) {
    return this.attendanceService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Update an attendance record' })
  @ApiResponse({ status: 200, description: 'Attendance updated' })
  @ApiResponse({ status: 404, description: 'Attendance not found' })
  update(@Param('id') id: string, @Body() updateAttendanceDto: UpdateAttendanceDto) {
    return this.attendanceService.update(id, updateAttendanceDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Delete an attendance record' })
  @ApiResponse({ status: 200, description: 'Attendance deleted' })
  @ApiResponse({ status: 404, description: 'Attendance not found' })
  remove(@Param('id') id: string) {
    return this.attendanceService.remove(id);
  }
}
