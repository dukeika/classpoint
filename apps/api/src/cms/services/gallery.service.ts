import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@classpoint/db';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { Gallery, GalleryImage, Prisma } from '@classpoint/db';
import {
  CreateGalleryDto,
  UpdateGalleryDto,
  AddGalleryImageDto,
  UpdateGalleryImageDto,
} from '../dto';

@Injectable()
export class GalleryService {
  private readonly logger = new Logger(GalleryService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(private readonly prisma: PrismaService) {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'af-south-1',
    });
    this.bucketName =
      process.env.S3_UPLOADS_BUCKET || 'classpoint-uploads-dev';
  }

  /**
   * Create gallery
   */
  async createGallery(
    tenantId: string,
    createGalleryDto: CreateGalleryDto,
  ): Promise<Gallery> {
    this.logger.log(`Creating gallery: ${createGalleryDto.name}`);

    try {
      const gallery = await this.prisma.gallery.create({
        data: {
          tenantId,
          ...createGalleryDto,
        },
      });

      this.logger.log(`Gallery created successfully: ${gallery.id}`);
      return gallery;
    } catch (error) {
      this.logger.error(
        `Failed to create gallery: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Find all galleries
   */
  async findAllGalleries(
    tenantId: string,
    params?: {
      skip?: number;
      take?: number;
      isPublic?: boolean;
    },
  ): Promise<{ data: Gallery[]; total: number }> {
    const { skip = 0, take = 20, isPublic } = params || {};

    const where: Prisma.GalleryWhereInput = { tenantId };

    if (isPublic !== undefined) where.isPublic = isPublic;

    const [galleries, total] = await Promise.all([
      this.prisma.gallery.findMany({
        where,
        skip,
        take,
        include: {
          images: {
            take: 1,
            orderBy: { order: 'asc' },
            select: {
              id: true,
              thumbnailUrl: true,
              imageUrl: true,
            },
          },
          _count: {
            select: { images: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.gallery.count({ where }),
    ]);

    return { data: galleries, total };
  }

  /**
   * Find public galleries
   */
  async findPublicGalleries(
    tenantId: string,
    params?: { skip?: number; take?: number },
  ): Promise<{ data: Gallery[]; total: number }> {
    return this.findAllGalleries(tenantId, {
      ...params,
      isPublic: true,
    });
  }

  /**
   * Find one gallery by ID
   */
  async findOneGallery(tenantId: string, id: string): Promise<Gallery> {
    const gallery = await this.prisma.gallery.findFirst({
      where: { id, tenantId },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!gallery) {
      throw new NotFoundException(`Gallery with ID '${id}' not found`);
    }

    return gallery;
  }

  /**
   * Update gallery
   */
  async updateGallery(
    tenantId: string,
    id: string,
    updateGalleryDto: UpdateGalleryDto,
  ): Promise<Gallery> {
    this.logger.log(`Updating gallery: ${id}`);

    // Verify gallery exists
    await this.findOneGallery(tenantId, id);

    try {
      const gallery = await this.prisma.gallery.update({
        where: { id },
        data: updateGalleryDto,
        include: {
          images: {
            orderBy: { order: 'asc' },
          },
        },
      });

      this.logger.log(`Gallery updated successfully: ${id}`);
      return gallery;
    } catch (error) {
      this.logger.error(
        `Failed to update gallery: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Delete gallery (and all images)
   */
  async removeGallery(tenantId: string, id: string): Promise<void> {
    this.logger.log(`Deleting gallery: ${id}`);

    // Verify gallery exists and get images
    const gallery = await this.findOneGallery(tenantId, id);

    try {
      // Delete S3 objects for all images
      for (const image of gallery.images || []) {
        await this.deleteS3Image(image.imageUrl);
        if (image.thumbnailUrl) {
          await this.deleteS3Image(image.thumbnailUrl);
        }
      }

      // Delete gallery (cascade will delete images)
      await this.prisma.gallery.delete({
        where: { id },
      });

      this.logger.log(`Gallery deleted successfully: ${id}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete gallery: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Add image to gallery
   */
  async addImage(
    tenantId: string,
    galleryId: string,
    addImageDto: AddGalleryImageDto,
  ): Promise<GalleryImage> {
    this.logger.log(`Adding image to gallery: ${galleryId}`);

    // Verify gallery exists
    await this.findOneGallery(tenantId, galleryId);

    try {
      const image = await this.prisma.galleryImage.create({
        data: {
          galleryId,
          ...addImageDto,
        },
      });

      this.logger.log(`Image added successfully: ${image.id}`);
      return image;
    } catch (error) {
      this.logger.error(
        `Failed to add image: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Update gallery image
   */
  async updateImage(
    tenantId: string,
    galleryId: string,
    imageId: string,
    updateImageDto: UpdateGalleryImageDto,
  ): Promise<GalleryImage> {
    this.logger.log(`Updating gallery image: ${imageId}`);

    // Verify image belongs to gallery
    const image = await this.prisma.galleryImage.findFirst({
      where: {
        id: imageId,
        galleryId,
        gallery: { tenantId },
      },
    });

    if (!image) {
      throw new NotFoundException(`Image with ID '${imageId}' not found`);
    }

    try {
      const updatedImage = await this.prisma.galleryImage.update({
        where: { id: imageId },
        data: updateImageDto,
      });

      this.logger.log(`Image updated successfully: ${imageId}`);
      return updatedImage;
    } catch (error) {
      this.logger.error(
        `Failed to update image: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Delete image from gallery
   */
  async removeImage(
    tenantId: string,
    galleryId: string,
    imageId: string,
  ): Promise<void> {
    this.logger.log(`Deleting gallery image: ${imageId}`);

    // Verify image belongs to gallery
    const image = await this.prisma.galleryImage.findFirst({
      where: {
        id: imageId,
        galleryId,
        gallery: { tenantId },
      },
    });

    if (!image) {
      throw new NotFoundException(`Image with ID '${imageId}' not found`);
    }

    try {
      // Delete S3 objects
      await this.deleteS3Image(image.imageUrl);
      if (image.thumbnailUrl) {
        await this.deleteS3Image(image.thumbnailUrl);
      }

      // Delete database record
      await this.prisma.galleryImage.delete({
        where: { id: imageId },
      });

      this.logger.log(`Image deleted successfully: ${imageId}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete image: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Generate presigned URL for image upload
   */
  async getUploadUrl(
    tenantId: string,
    filename: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; imageUrl: string }> {
    this.logger.log(`Generating upload URL for: ${filename}`);

    const key = `galleries/${tenantId}/${Date.now()}-${filename}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    const imageUrl = `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'af-south-1'}.amazonaws.com/${key}`;

    return { uploadUrl, imageUrl };
  }

  /**
   * Delete image from S3
   */
  private async deleteS3Image(url: string): Promise<void> {
    try {
      // Extract key from URL
      const urlParts = url.split('.amazonaws.com/');
      if (urlParts.length < 2) {
        this.logger.warn(`Invalid S3 URL: ${url}`);
        return;
      }

      const key = urlParts[1];

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`S3 object deleted: ${key}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete S3 object: ${(error as Error).message}`,
      );
      // Don't throw - allow DB deletion to proceed
    }
  }
}
