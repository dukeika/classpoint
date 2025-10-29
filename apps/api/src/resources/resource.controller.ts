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
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ResourceService } from './resource.service';
import { StorageService } from './storage.service';
import {
  CreateResourceDto,
  UpdateResourceDto,
  GenerateUploadUrlDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, ResourceType } from '@classpoint/db';

@Controller('resources')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResourceController {
  private readonly logger = new Logger(ResourceController.name);

  constructor(
    private readonly resourceService: ResourceService,
    private readonly storageService: StorageService
  ) {}

  /**
   * Generate presigned URL for file upload
   * POST /resources/upload-url
   */
  @Post('upload-url')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async generateUploadUrl(
    @TenantId() tenantId: string,
    @Body() generateUploadUrlDto: GenerateUploadUrlDto
  ) {
    this.logger.log(`Generating upload URL for tenant: ${tenantId}`);

    const key = this.storageService.generateKey(
      tenantId,
      generateUploadUrlDto.resourceType,
      generateUploadUrlDto.fileName
    );

    const { uploadUrl } = await this.storageService.generateUploadUrl(
      key,
      generateUploadUrlDto.contentType,
      3600 // 1 hour
    );

    return {
      uploadUrl,
      key,
      expiresIn: 3600,
    };
  }

  /**
   * Create a new resource
   * POST /resources
   */
  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async create(
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() createResourceDto: CreateResourceDto
  ) {
    this.logger.log(`Creating resource for tenant: ${tenantId}`);
    return this.resourceService.create(tenantId, userId, createResourceDto);
  }

  /**
   * Get all resources
   * GET /resources
   */
  @Get()
  async findAll(
    @TenantId() tenantId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('type') type?: ResourceType,
    @Query('subjectId') subjectId?: string,
    @Query('classId') classId?: string,
    @Query('isPublic') isPublic?: string,
    @Query('search') search?: string
  ) {
    return this.resourceService.findAll(tenantId, {
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      type,
      subjectId,
      classId,
      isPublic: isPublic !== undefined ? isPublic === 'true' : undefined,
      search,
    });
  }

  /**
   * Get storage statistics
   * GET /resources/stats
   */
  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async getStats(@TenantId() tenantId: string) {
    return this.resourceService.getStorageStats(tenantId);
  }

  /**
   * Get a single resource
   * GET /resources/:id
   */
  @Get(':id')
  async findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.resourceService.findOne(tenantId, id);
  }

  /**
   * Get download URL for a resource
   * GET /resources/:id/download
   */
  @Get(':id/download')
  async getDownloadUrl(
    @TenantId() tenantId: string,
    @Param('id') id: string
  ) {
    const resource = await this.resourceService.findOne(tenantId, id);

    // Extract S3 key from URL (assuming format: https://bucket.s3.region.amazonaws.com/key)
    const urlParts = resource.url.split('/');
    const key = urlParts.slice(3).join('/');

    const downloadUrl = await this.storageService.generateDownloadUrl(key, 3600);

    // Increment download count
    await this.resourceService.incrementDownloads(id);

    return {
      downloadUrl,
      expiresIn: 3600,
    };
  }

  /**
   * Update a resource
   * PATCH /resources/:id
   */
  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateResourceDto: UpdateResourceDto
  ) {
    return this.resourceService.update(tenantId, id, userId, updateResourceDto);
  }

  /**
   * Delete a resource
   * DELETE /resources/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async remove(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    const resource = await this.resourceService.findOne(tenantId, id);

    // Delete from S3
    const urlParts = resource.url.split('/');
    const key = urlParts.slice(3).join('/');
    await this.storageService.deleteFile(key);

    // Delete from database
    await this.resourceService.remove(tenantId, id, userId);
  }
}
