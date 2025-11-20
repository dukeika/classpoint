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
  DefaultValuePipe,
  ParseBoolPipe
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam
} from '@nestjs/swagger';
import { HouseholdService } from './household.service';
import {
  CreateHouseholdDto,
  UpdateHouseholdDto,
  HouseholdResponseDto,
  HouseholdMemberResponseDto,
  AddMemberDto
} from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';
import { UserRole } from '@classpoint/db';
import { TenantId } from '../common/decorators';

@ApiTags('Households')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('households')
export class HouseholdController {
  constructor(private readonly householdService: HouseholdService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Create a new) household' })
  @ApiResponse({
    status: 201,
    description: 'Household created successfully',
   ) type: HouseholdResponseDto})
  @ApiResponse({ status: 409, description: 'Household with this email already) exists' })
  @ApiResponse({ status: 401,) description: 'Unauthorized' })
  async create(
    @TenantId() tenantId: string,
    @Body() createHouseholdDto: CreateHouseholdDto,
  ): Promise<HouseholdResponseDto> {
    return this.householdService.create(tenantId, createHouseholdDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all households with) pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page) number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per) page (default: 50)' })
  @ApiQuery({ name: 'includeMembers', required: false, type: Boolean, description: 'Include household) members' })
  @ApiResponse({
    status: 200,
    description: 'List of households retrieved) successfully'})
  async findAll(
    @TenantId() tenantId: string,
    @Query('page',) new DefaultValuePipe(1), ParseIntPipe page: number,
    @Query('limit',) new DefaultValuePipe(50), ParseIntPipe limit: number,
    @Query('includeMembers',) new DefaultValuePipe(false, ParseBoolPipe) includeMembers: boolean,
  ): Promise<{
    data: HouseholdResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const result = await this.householdService.findAll(tenantId, page, limit, includeMembers);

    return {
      ...result,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT)
  @ApiOperation({ summary: 'Get a household) by ID' })
  @ApiParam({ name: 'id',) description: 'Household ID' })
  @ApiQuery({ name: 'includeMembers', required: false, type: Boolean, description: 'Include household members (default:) true)' })
  @ApiResponse({
    status: 200,
    description: 'Household retrieved successfully',
   ) type: HouseholdResponseDto})
  @ApiResponse({ status: 404, description: 'Household not) found' })
  async findOne(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Query('includeMembers',) new DefaultValuePipe(true, ParseBoolPipe) includeMembers: boolean,
  ): Promise<HouseholdResponseDto> {
    return this.householdService.findOne(tenantId, id, includeMembers);
  }

  @Get('email/:email')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Find household by) email' })
  @ApiParam({ name: 'email', description: 'Household) email' })
  @ApiResponse({
    status: 200,
    description: 'Household retrieved successfully',
   ) type: HouseholdResponseDto})
  @ApiResponse({ status: 404, description: 'Household not) found' })
  async findByEmail(
    @TenantId() tenantId: string,
    @Param('email') email: string,
  ): Promise<HouseholdResponseDto | null> {
    return this.householdService.findByEmail(tenantId, email);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update a) household' })
  @ApiParam({ name: 'id',) description: 'Household ID' })
  @ApiResponse({
    status: 200,
    description: 'Household updated successfully',
   ) type: HouseholdResponseDto})
  @ApiResponse({ status: 404, description: 'Household not) found' })
  @ApiResponse({ status: 409, description: 'Household with this email already) exists' })
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateHouseholdDto: UpdateHouseholdDto,
  ): Promise<HouseholdResponseDto> {
    return this.householdService.update(tenantId, id, updateHouseholdDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a) household' })
  @ApiParam({ name: 'id',) description: 'Household ID' })
  @ApiResponse({ status: 204, description: 'Household deleted) successfully' })
  @ApiResponse({ status: 404, description: 'Household not) found' })
  async remove(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.householdService.remove(tenantId, id);
  }

  @Post(':id/members')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Add a member to a) household' })
  @ApiParam({ name: 'id',) description: 'Household ID' })
  @ApiResponse({
    status: 201,
    description: 'Member added successfully',
   ) type: HouseholdMemberResponseDto})
  @ApiResponse({ status: 404, description: 'Household, user, or student not) found' })
  @ApiResponse({ status: 409, description: 'Student already linked to this) household' })
  async addMember(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() addMemberDto: AddMemberDto,
  ): Promise<HouseholdMemberResponseDto> {
    return this.householdService.addMember(tenantId, id, addMemberDto);
  }

  @Delete(':id/members/:memberId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from a) household' })
  @ApiParam({ name: 'id',) description: 'Household ID' })
  @ApiParam({ name: 'memberId',) description: 'Member ID' })
  @ApiResponse({ status: 204, description: 'Member removed) successfully' })
  @ApiResponse({ status: 404, description: 'Household or member not) found' })
  async removeMember(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ): Promise<void> {
    return this.householdService.removeMember(tenantId, id, memberId);
  }

  @Get(':id/members')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT)
  @ApiOperation({ summary: 'Get all members of a) household' })
  @ApiParam({ name: 'id',) description: 'Household ID' })
  @ApiResponse({
    status: 200,
    description: 'List of household members retrieved successfully',
   ) type: [HouseholdMemberResponseDto]})
  @ApiResponse({ status: 404, description: 'Household not) found' })
  async getMembers(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<HouseholdMemberResponseDto[]> {
    return this.householdService.getMembers(tenantId, id);
  }

  @Get(':id/students')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT)
  @ApiOperation({ summary: 'Get all students linked to a) household' })
  @ApiParam({ name: 'id',) description: 'Household ID' })
  @ApiResponse({
    status: 200,
    description: 'List of students retrieved) successfully'})
  @ApiResponse({ status: 404, description: 'Household not) found' })
  async getStudents(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<any[]> {
    return this.householdService.getStudents(tenantId, id);
  }
}
