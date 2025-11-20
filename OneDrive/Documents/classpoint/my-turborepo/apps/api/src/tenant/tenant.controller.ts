import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import {
  CreateTenantDto,
  UpdateTenantDto,
  TenantResponseDto,
} from './dto';
import { TenantStatus } from '@classpoint/db';

@ApiTags('tenants')
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tenant (school)' })
  @ApiResponse({
    status: 201,
    description: 'Tenant created successfully',
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Tenant with this code already exists' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async create(@Body() createTenantDto: CreateTenantDto): Promise<TenantResponseDto> {
    return this.tenantService.create(createTenantDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tenants with optional filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (1-indexed)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'status', required: false, enum: TenantStatus })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by name, code, or email' })
  @ApiResponse({
    status: 200,
    description: 'List of tenants retrieved successfully',
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('status') status?: TenantStatus,
    @Query('search') search?: string,
  ): Promise<{
    data: TenantResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const result = await this.tenantService.findAll({
      skip,
      take: limit,
      status,
      search,
    });

    return {
      ...result,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tenant by ID' })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiResponse({
    status: 200,
    description: 'Tenant retrieved successfully',
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async findOne(@Param('id') id: string): Promise<TenantResponseDto> {
    return this.tenantService.findOne(id);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get a tenant by code' })
  @ApiParam({ name: 'code', description: 'Tenant code' })
  @ApiResponse({
    status: 200,
    description: 'Tenant retrieved successfully',
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async findByCode(@Param('code') code: string): Promise<TenantResponseDto> {
    return this.tenantService.findByCode(code);
  }

  @Get('by-slug/:slug')
  @ApiOperation({ summary: 'Get a tenant by slug (public endpoint for school landing pages)' })
  @ApiParam({ name: 'slug', description: 'Tenant slug (subdomain)' })
  @ApiResponse({
    status: 200,
    description: 'Tenant retrieved successfully',
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async findBySlug(@Param('slug') slug: string): Promise<TenantResponseDto> {
    return this.tenantService.findByCode(slug);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tenant' })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiResponse({
    status: 200,
    description: 'Tenant updated successfully',
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tenant or Plan not found' })
  @ApiResponse({ status: 400, description: 'Invalid update data or cap violation' })
  async update(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ): Promise<TenantResponseDto> {
    return this.tenantService.update(id, updateTenantDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a tenant (soft delete)',
    description: 'Suspends the tenant. Cannot delete if tenant has active students.',
  })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiResponse({ status: 204, description: 'Tenant suspended successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiResponse({ status: 400, description: 'Tenant has active students' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.tenantService.remove(id);
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Permanently delete a tenant',
    description: 'WARNING: This action cannot be undone. All related data will be deleted.',
  })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiResponse({ status: 204, description: 'Tenant permanently deleted' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiResponse({ status: 400, description: 'Tenant has related data' })
  async hardDelete(@Param('id') id: string): Promise<void> {
    return this.tenantService.hardDelete(id);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate a suspended tenant' })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiResponse({
    status: 200,
    description: 'Tenant activated successfully',
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async activate(@Param('id') id: string): Promise<TenantResponseDto> {
    return this.tenantService.activate(id);
  }

  @Patch(':id/suspend')
  @ApiOperation({ summary: 'Suspend an active tenant' })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiResponse({
    status: 200,
    description: 'Tenant suspended successfully',
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async suspend(@Param('id') id: string): Promise<TenantResponseDto> {
    return this.tenantService.suspend(id);
  }

  @Get(':id/capacity')
  @ApiOperation({ summary: 'Check tenant enrollment capacity' })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiResponse({
    status: 200,
    description: 'Capacity information retrieved',
  })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async getCapacity(@Param('id') id: string): Promise<{
    isAtCapacity: boolean;
    remainingCapacity: number;
  }> {
    const [isAtCapacity, remainingCapacity] = await Promise.all([
      this.tenantService.isAtCapacity(id),
      this.tenantService.getRemainingCapacity(id),
    ]);

    return {
      isAtCapacity,
      remainingCapacity,
    };
  }
}
