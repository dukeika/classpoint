import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@classpoint/db';
import { Resource, ResourceType, Prisma } from '@classpoint/db';
import { CreateResourceDto, UpdateResourceDto } from './dto';

@Injectable()
export class ResourceService {
  private readonly logger = new Logger(ResourceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new resource
   */
  async create(
    tenantId: string,
    userId: string,
    createResourceDto: CreateResourceDto
  ): Promise<Resource> {
    this.logger.log(`Creating resource for tenant: ${tenantId}`);

    try {
      const resource = await this.prisma.resource.create({
        data: {
          tenantId,
          title: createResourceDto.title,
          description: createResourceDto.description,
          type: createResourceDto.type,
          url: createResourceDto.url,
          fileSize: createResourceDto.fileSize,
          mimeType: createResourceDto.mimeType,
          subjectId: createResourceDto.subjectId,
          classId: createResourceDto.classId,
          isPublic: createResourceDto.isPublic || false,
          uploadedBy: userId,
        },
        include: {
          subject: true,
          class: true,
          uploader: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      this.logger.log(`Resource created successfully: ${resource.id}`);
      return resource;
    } catch (error) {
      this.logger.error(
        `Failed to create resource: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  /**
   * Get all resources for a tenant
   */
  async findAll(
    tenantId: string,
    params?: {
      skip?: number;
      take?: number;
      type?: ResourceType;
      subjectId?: string;
      classId?: string;
      isPublic?: boolean;
      search?: string;
    }
  ): Promise<{ data: Resource[]; total: number }> {
    const { skip = 0, take = 50, type, subjectId, classId, isPublic, search } =
      params || {};

    const where: Prisma.ResourceWhereInput = { tenantId };

    if (type) {
      where.type = type;
    }

    if (subjectId) {
      where.subjectId = subjectId;
    }

    if (classId) {
      where.classId = classId;
    }

    if (isPublic !== undefined) {
      where.isPublic = isPublic;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [resources, total] = await Promise.all([
      this.prisma.resource.findMany({
        where,
        skip,
        take,
        include: {
          subject: true,
          class: true,
          uploader: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
      }),
      this.prisma.resource.count({ where }),
    ]);

    return {
      data: resources,
      total,
    };
  }

  /**
   * Get a single resource by ID
   */
  async findOne(tenantId: string, id: string): Promise<Resource> {
    const resource = await this.prisma.resource.findFirst({
      where: { id, tenantId },
      include: {
        subject: true,
        class: true,
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!resource) {
      throw new NotFoundException(`Resource with ID '${id}' not found`);
    }

    return resource;
  }

  /**
   * Update a resource
   */
  async update(
    tenantId: string,
    id: string,
    userId: string,
    updateResourceDto: UpdateResourceDto
  ): Promise<Resource> {
    this.logger.log(`Updating resource: ${id}`);

    // Verify resource exists and user has permission
    const existingResource = await this.findOne(tenantId, id);

    if (existingResource.uploadedBy !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this resource'
      );
    }

    try {
      const resource = await this.prisma.resource.update({
        where: { id },
        data: updateResourceDto,
        include: {
          subject: true,
          class: true,
          uploader: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      this.logger.log(`Resource updated successfully: ${id}`);
      return resource;
    } catch (error) {
      this.logger.error(
        `Failed to update resource: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  /**
   * Delete a resource
   */
  async remove(tenantId: string, id: string, userId: string): Promise<void> {
    this.logger.log(`Deleting resource: ${id}`);

    const resource = await this.findOne(tenantId, id);

    if (resource.uploadedBy !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this resource'
      );
    }

    try {
      await this.prisma.resource.delete({
        where: { id },
      });

      this.logger.log(`Resource deleted successfully: ${id}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete resource: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  /**
   * Increment download count
   */
  async incrementDownloads(id: string): Promise<void> {
    await this.prisma.resource.update({
      where: { id },
      data: {
        downloads: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(tenantId: string) {
    const resources = await this.prisma.resource.findMany({
      where: { tenantId },
      select: {
        type: true,
        fileSize: true,
      },
    });

    const totalSize = resources.reduce(
      (sum, r) => sum + (r.fileSize || 0),
      0
    );
    const totalCount = resources.length;

    const byType = resources.reduce((acc: any, r) => {
      if (!acc[r.type]) {
        acc[r.type] = { count: 0, size: 0 };
      }
      acc[r.type].count++;
      acc[r.type].size += r.fileSize || 0;
      return acc;
    }, {});

    return {
      totalSize,
      totalCount,
      totalSizeFormatted: this.formatBytes(totalSize),
      byType: Object.entries(byType).map(([type, stats]: [string, any]) => ({
        type,
        count: stats.count,
        size: stats.size,
        sizeFormatted: this.formatBytes(stats.size),
      })),
    };
  }

  /**
   * Format bytes to human-readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
