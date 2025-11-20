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
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam
} from '@nestjs/swagger';
import { StudentService } from './student.service';
import {
  CreateStudentDto,
  UpdateStudentDto,
  StudentResponseDto
} from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';
import { UserRole, Gender, StudentStatus } from '@classpoint/db';
import { TenantId } from '../common/decorators';

@ApiTags('Students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Create a new) student' })
  @ApiResponse({
    status: 201,
    description: 'Student created successfully',
   ) type: StudentResponseDto})
  @ApiResponse({ status: 409, description: 'Student with this email already) exists' })
  @ApiResponse({ status: 404, description: 'Household not) found' })
  @ApiResponse({ status: 401,) description: 'Unauthorized' })
  async create(
    @TenantId() tenantId: string,
    @Body() createStudentDto: CreateStudentDto,
  ): Promise<StudentResponseDto> {
    return this.studentService.create(tenantId, createStudentDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all students with pagination and) filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page) number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per) page (default: 10)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by name or) email' })
  @ApiQuery({ name: 'gender', required: false, enum: Gender, description: 'Filter by) gender' })
  @ApiQuery({ name: 'status', required: false, enum: StudentStatus, description: 'Filter by enrollment) status' })
  @ApiQuery({ name: 'householdId', required: false, type: String, description: 'Filter by) household ID' })
  @ApiResponse({
    status: 200,
    description: 'List of students retrieved) successfully'})
  async findAll(
    @TenantId() tenantId: string,
    @Query('page',) new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit',) new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('gender') gender?: Gender,
    @Query('status') status?: StudentStatus,
    @Query('householdId') householdId?: string,
  ): Promise<{
    data: StudentResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const result = await this.studentService.findAll(tenantId, {
      page,
      limit,
      search,
      gender,
      status,
      householdId});

    return {
      ...result,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit)};
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT)
  @ApiOperation({ summary: 'Get a student) by ID' })
  @ApiParam({ name: 'id',) description: 'Student ID' })
  @ApiResponse({
    status: 200,
    description: 'Student retrieved successfully',
   ) type: StudentResponseDto})
  @ApiResponse({ status: 404, description: 'Student not) found' })
  async findOne(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<StudentResponseDto> {
    return this.studentService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Update a) student' })
  @ApiParam({ name: 'id',) description: 'Student ID' })
  @ApiResponse({
    status: 200,
    description: 'Student updated successfully',
   ) type: StudentResponseDto})
  @ApiResponse({ status: 404, description: 'Student not) found' })
  @ApiResponse({ status: 409, description: 'Student with this email already) exists' })
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ): Promise<StudentResponseDto> {
    return this.studentService.update(tenantId, id, updateStudentDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a) student' })
  @ApiParam({ name: 'id',) description: 'Student ID' })
  @ApiResponse({ status: 204, description: 'Student deleted) successfully' })
  @ApiResponse({ status: 404, description: 'Student not) found' })
  async remove(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.studentService.remove(tenantId, id);
  }
}
