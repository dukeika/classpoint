import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { GalleryService } from '../services';
import {
  CreateGalleryDto,
  UpdateGalleryDto,
  AddGalleryImageDto,
  UpdateGalleryImageDto,
} from '../dto';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/decorators';
import { UserRole } from '@classpoint/db';

@ApiTags('CMS - Gallery')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cms/galleries')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  // ==================== Gallery Operations ====================

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Create gallery' })
  @ApiResponse({ status: 201, description: 'Gallery created' })
  createGallery(@Req() req: any, @Body() createGalleryDto: CreateGalleryDto) {
    const tenantId = req.user.tenantId;
    return this.galleryService.createGallery(tenantId, createGalleryDto);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.PARENT,
    UserRole.STUDENT,
  )
  @ApiOperation({ summary: 'Get all galleries' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Galleries retrieved' })
  findAllGalleries(
    @Req() req: any,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.galleryService.findAllGalleries(tenantId, {
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
    });
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.PARENT,
    UserRole.STUDENT,
  )
  @ApiOperation({ summary: 'Get gallery by ID' })
  @ApiResponse({ status: 200, description: 'Gallery retrieved' })
  @ApiResponse({ status: 404, description: 'Gallery not found' })
  findOneGallery(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.galleryService.findOneGallery(tenantId, id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Update gallery' })
  @ApiResponse({ status: 200, description: 'Gallery updated' })
  updateGallery(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateGalleryDto: UpdateGalleryDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.galleryService.updateGallery(tenantId, id, updateGalleryDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Delete gallery (and all images)' })
  @ApiResponse({ status: 200, description: 'Gallery deleted' })
  removeGallery(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.galleryService.removeGallery(tenantId, id);
  }

  // ==================== Image Operations ====================

  @Post(':id/images')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Add image to gallery' })
  @ApiResponse({ status: 201, description: 'Image added' })
  addImage(
    @Req() req: any,
    @Param('id') galleryId: string,
    @Body() addImageDto: AddGalleryImageDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.galleryService.addImage(tenantId, galleryId, addImageDto);
  }

  @Patch(':galleryId/images/:imageId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Update gallery image' })
  @ApiResponse({ status: 200, description: 'Image updated' })
  updateImage(
    @Req() req: any,
    @Param('galleryId') galleryId: string,
    @Param('imageId') imageId: string,
    @Body() updateImageDto: UpdateGalleryImageDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.galleryService.updateImage(
      tenantId,
      galleryId,
      imageId,
      updateImageDto,
    );
  }

  @Delete(':galleryId/images/:imageId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Delete image from gallery' })
  @ApiResponse({ status: 200, description: 'Image deleted' })
  removeImage(
    @Req() req: any,
    @Param('galleryId') galleryId: string,
    @Param('imageId') imageId: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.galleryService.removeImage(tenantId, galleryId, imageId);
  }

  // ==================== Upload Operations ====================

  @Post('upload-url')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get presigned URL for image upload' })
  @ApiResponse({
    status: 200,
    description: 'Presigned URL generated',
    schema: {
      type: 'object',
      properties: {
        uploadUrl: { type: 'string' },
        imageUrl: { type: 'string' },
      },
    },
  })
  getUploadUrl(
    @Req() req: any,
    @Body() body: { filename: string; contentType: string },
  ) {
    const tenantId = req.user.tenantId;
    return this.galleryService.getUploadUrl(
      tenantId,
      body.filename,
      body.contentType,
    );
  }
}
