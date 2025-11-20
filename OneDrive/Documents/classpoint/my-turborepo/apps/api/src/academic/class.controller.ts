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
import { ClassService } from './class.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { JwtAuthGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';
import { RolesGuard } from '../auth/guards';
import { UserRole } from '@classpoint/db';
import { TenantId } from '../common/decorators';

@ApiTags('Academic - Classes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('classes')
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Create a new class' })
  @ApiResponse({ status: 201, description: 'Class created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Class already exists' })
  create(@TenantId() tenantId: string, @Body() createClassDto: CreateClassDto) {
    return this.classService.create(tenantId, createClassDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all classes for tenant' })
  @ApiResponse({ status: 200, description: 'Classes retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @TenantId() tenantId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('level') level?: string
  ) {
    return this.classService.findAll(tenantId, {
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      level,
    });
  }

  @Get('levels')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all unique class levels' })
  @ApiResponse({ status: 200, description: 'Levels retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getLevels(@TenantId() tenantId: string) {
    return this.classService.getLevels(tenantId);
  }

  @Get('level/:level')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all classes for a specific level' })
  @ApiResponse({ status: 200, description: 'Classes retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findByLevel(@TenantId() tenantId: string, @Param('level') level: string) {
    return this.classService.findByLevel(tenantId, level);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get a specific class' })
  @ApiResponse({ status: 200, description: 'Class retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.classService.findOne(tenantId, id);
  }

  @Get(':id/capacity')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get class capacity information' })
  @ApiResponse({ status: 200, description: 'Capacity info retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  getCapacityInfo(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.classService.getCapacityInfo(tenantId, id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update a class' })
  @ApiResponse({ status: 200, description: 'Class updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  @ApiResponse({ status: 409, description: 'Class already exists' })
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateClassDto: UpdateClassDto
  ) {
    return this.classService.update(tenantId, id, updateClassDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Delete a class' })
  @ApiResponse({ status: 200, description: 'Class deleted successfully' })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete class with existing enrollments or teachers',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.classService.remove(tenantId, id);
  }
}
