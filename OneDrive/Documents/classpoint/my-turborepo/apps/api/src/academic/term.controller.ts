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
import { TermService } from './term.service';
import { CreateTermDto } from './dto/create-term.dto';
import { UpdateTermDto } from './dto/update-term.dto';
import { JwtAuthGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';
import { RolesGuard } from '../auth/guards';
import { UserRole } from '@classpoint/db';
import { TenantId } from '../common/decorators';

@ApiTags('Academic - Terms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('terms')
export class TermController {
  constructor(private readonly termService: TermService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Create a new academic term' })
  @ApiResponse({ status: 201, description: 'Term created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data or date overlap' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 409, description: 'Term dates overlap with existing term' })
  create(@TenantId() tenantId: string, @Body() createTermDto: CreateTermDto) {
    return this.termService.create(tenantId, createTermDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all academic terms for tenant' })
  @ApiResponse({ status: 200, description: 'Terms retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @TenantId() tenantId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('sessionId') sessionId?: string,
    @Query('isCurrent') isCurrent?: string
  ) {
    return this.termService.findAll(tenantId, {
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      sessionId,
      isCurrent: isCurrent ? isCurrent === 'true' : undefined,
    });
  }

  @Get('current')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get the current active term' })
  @ApiResponse({ status: 200, description: 'Current term retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'No current term found' })
  getCurrentTerm(@TenantId() tenantId: string) {
    return this.termService.getCurrentTerm(tenantId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get a specific academic term' })
  @ApiResponse({ status: 200, description: 'Term retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Term not found' })
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.termService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update an academic term' })
  @ApiResponse({ status: 200, description: 'Term updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data or date overlap' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Term not found' })
  @ApiResponse({ status: 409, description: 'Term dates overlap with existing term' })
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateTermDto: UpdateTermDto
  ) {
    return this.termService.update(tenantId, id, updateTermDto);
  }

  @Patch(':id/set-current')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Set a term as the current active term' })
  @ApiResponse({ status: 200, description: 'Term set as current successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Term not found' })
  setAsCurrent(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.termService.setAsCurrent(tenantId, id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Delete an academic term' })
  @ApiResponse({ status: 200, description: 'Term deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete term with existing enrollments' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Term not found' })
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.termService.remove(tenantId, id);
  }
}
