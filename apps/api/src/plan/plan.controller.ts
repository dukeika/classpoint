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
import { PlanService } from './plan.service';
import { CreatePlanDto, UpdatePlanDto, PlanResponseDto } from './dto';

@ApiTags('plans')
@Controller('plans')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new plan' })
  @ApiResponse({
    status: 201,
    description: 'Plan created successfully',
    type: PlanResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Plan with this name already exists' })
  async create(@Body() createPlanDto: CreatePlanDto): Promise<PlanResponseDto> {
    return this.planService.create(createPlanDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all plans' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (1-indexed)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    enum: ['name', 'studentCap', 'createdAt'],
    description: 'Field to order by',
  })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
  })
  @ApiResponse({
    status: 200,
    description: 'List of plans retrieved successfully',
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('orderBy') orderBy?: 'name' | 'studentCap' | 'createdAt',
    @Query('order') order?: 'asc' | 'desc',
  ): Promise<{
    data: PlanResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const result = await this.planService.findAll({
      skip,
      take: limit,
      orderBy,
      order,
    });

    return {
      ...result,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a plan by ID' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({
    status: 200,
    description: 'Plan retrieved successfully',
    type: PlanResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async findOne(@Param('id') id: string): Promise<PlanResponseDto> {
    return this.planService.findOne(id);
  }

  @Get(':id/tenants')
  @ApiOperation({
    summary: 'Get tenants using this plan',
    description: 'Returns list of tenants with their enrollment statistics',
  })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({
    status: 200,
    description: 'Tenants retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async getTenantsUsingPlan(@Param('id') id: string): Promise<Array<{
    id: string;
    name: string;
    code: string;
    currentEnrollment: number;
    capUsagePercentage: number;
  }>> {
    return this.planService.getTenantsUsingPlan(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a plan' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({
    status: 200,
    description: 'Plan updated successfully',
    type: PlanResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 409, description: 'Plan name already exists' })
  @ApiResponse({
    status: 400,
    description: 'Cannot reduce cap - some tenants exceed new limit',
  })
  async update(
    @Param('id') id: string,
    @Body() updatePlanDto: UpdatePlanDto,
  ): Promise<PlanResponseDto> {
    return this.planService.update(id, updatePlanDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a plan',
    description: 'Cannot delete if any tenants are using this plan',
  })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({ status: 204, description: 'Plan deleted successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 400, description: 'Plan is in use by tenants' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.planService.remove(id);
  }
}
