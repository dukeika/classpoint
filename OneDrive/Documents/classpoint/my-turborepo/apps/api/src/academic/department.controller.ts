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
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { JwtAuthGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';
import { RolesGuard } from '../auth/guards';
import { UserRole } from '@classpoint/db';
import { TenantId } from '../common/decorators';

@ApiTags('Academic - Departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('departments')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Create a new department' })
  @ApiResponse({ status: 201, description: 'Department created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Department already exists' })
  create(
    @TenantId() tenantId: string,
    @Body() createDepartmentDto: CreateDepartmentDto
  ) {
    return this.departmentService.create(tenantId, createDepartmentDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all departments for tenant' })
  @ApiResponse({ status: 200, description: 'Departments retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @TenantId() tenantId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string
  ) {
    return this.departmentService.findAll(tenantId, {
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      search,
    });
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get a specific department' })
  @ApiResponse({ status: 200, description: 'Department retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.departmentService.findOne(tenantId, id);
  }

  @Get(':id/subjects')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all subjects for a specific department' })
  @ApiResponse({ status: 200, description: 'Subjects retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  getDepartmentSubjects(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.departmentService.getDepartmentSubjects(tenantId, id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update a department' })
  @ApiResponse({ status: 200, description: 'Department updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  @ApiResponse({ status: 409, description: 'Department name already exists' })
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto
  ) {
    return this.departmentService.update(tenantId, id, updateDepartmentDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Delete a department' })
  @ApiResponse({ status: 200, description: 'Department deleted successfully' })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete department with existing subjects',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.departmentService.remove(tenantId, id);
  }
}
