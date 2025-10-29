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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnnouncementService } from './announcement.service';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';
import { UserRole, AnnouncementAudience } from '@classpoint/db';
import { TenantId } from '../common/decorators';

@ApiTags('Announcements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('announcements')
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Create an announcement' })
  @ApiResponse({ status: 201, description: 'Announcement created' })
  create(@TenantId() tenantId: string, @Body() createAnnouncementDto: CreateAnnouncementDto) {
    return this.announcementService.create(tenantId, createAnnouncementDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all announcements' })
  @ApiResponse({ status: 200, description: 'Announcements retrieved' })
  @ApiQuery({ name: 'audience', required: false, enum: AnnouncementAudience })
  @ApiQuery({ name: 'classId', required: false, type: String })
  @ApiQuery({ name: 'published', required: false, type: Boolean })
  findAll(
    @TenantId() tenantId: string,
    @Query('audience') audience?: AnnouncementAudience,
    @Query('classId') classId?: string,
    @Query('published') published?: string
  ) {
    const isPublished = published === 'true' ? true : published === 'false' ? false : undefined;
    return this.announcementService.findAll(tenantId, audience, classId, isPublished);
  }

  @Get('school-wide')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get school-wide announcements' })
  @ApiResponse({ status: 200, description: 'School-wide announcements retrieved' })
  findSchoolWide(@TenantId() tenantId: string) {
    return this.announcementService.findSchoolWide(tenantId);
  }

  @Get('class/:classId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get announcements for a class' })
  @ApiResponse({ status: 200, description: 'Class announcements retrieved' })
  findByClass(@TenantId() tenantId: string, @Param('classId') classId: string) {
    return this.announcementService.findByClass(tenantId, classId);
  }

  @Get('statistics')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get announcement statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  getStatistics(@TenantId() tenantId: string) {
    return this.announcementService.getStatistics(tenantId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get an announcement by ID' })
  @ApiResponse({ status: 200, description: 'Announcement retrieved' })
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.announcementService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Update an announcement' })
  @ApiResponse({ status: 200, description: 'Announcement updated' })
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateAnnouncementDto: UpdateAnnouncementDto
  ) {
    return this.announcementService.update(tenantId, id, updateAnnouncementDto);
  }

  @Patch(':id/publish')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Publish an announcement' })
  @ApiResponse({ status: 200, description: 'Announcement published' })
  publish(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.announcementService.publish(tenantId, id);
  }

  @Patch(':id/unpublish')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Unpublish an announcement' })
  @ApiResponse({ status: 200, description: 'Announcement unpublished' })
  unpublish(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.announcementService.unpublish(tenantId, id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Delete an announcement' })
  @ApiResponse({ status: 200, description: 'Announcement deleted' })
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.announcementService.remove(tenantId, id);
  }
}
