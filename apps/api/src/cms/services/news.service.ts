import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@classpoint/db';
import { News, NewsStatus, Prisma } from '@classpoint/db';
import { CreateNewsDto, UpdateNewsDto } from '../dto';

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate URL-friendly slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Create news article
   */
  async create(
    tenantId: string,
    createNewsDto: CreateNewsDto,
  ): Promise<News> {
    this.logger.log(`Creating news article: ${createNewsDto.title}`);

    // Generate slug
    const baseSlug = this.generateSlug(createNewsDto.title);
    let slug = baseSlug;
    let counter = 1;

    // Ensure slug is unique for this tenant
    while (
      await this.prisma.news.findUnique({
        where: { tenantId_slug: { tenantId, slug } },
      })
    ) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    try {
      const news = await this.prisma.news.create({
        data: {
          tenantId,
          slug,
          ...createNewsDto,
          publishedAt:
            createNewsDto.status === NewsStatus.PUBLISHED
              ? new Date()
              : null,
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      this.logger.log(`News article created successfully: ${news.id}`);
      return news;
    } catch (error) {
      this.logger.error(
        `Failed to create news article: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Find all news articles with filtering
   */
  async findAll(
    tenantId: string,
    params?: {
      skip?: number;
      take?: number;
      status?: NewsStatus;
      isFeatured?: boolean;
      authorId?: string;
    },
  ): Promise<{ data: News[]; total: number }> {
    const { skip = 0, take = 20, status, isFeatured, authorId } = params || {};

    const where: Prisma.NewsWhereInput = { tenantId };

    if (status) where.status = status;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (authorId) where.authorId = authorId;

    const [news, total] = await Promise.all([
      this.prisma.news.findMany({
        where,
        skip,
        take,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.news.count({ where }),
    ]);

    return { data: news, total };
  }

  /**
   * Find public news articles (for public site)
   */
  async findPublic(
    tenantId: string,
    params?: {
      skip?: number;
      take?: number;
      featured?: boolean;
    },
  ): Promise<{ data: News[]; total: number }> {
    const { skip = 0, take = 20, featured } = params || {};

    const where: Prisma.NewsWhereInput = {
      tenantId,
      status: NewsStatus.PUBLISHED,
      isPublic: true,
    };

    if (featured !== undefined) where.isFeatured = featured;

    const [news, total] = await Promise.all([
      this.prisma.news.findMany({
        where,
        skip,
        take,
        include: {
          author: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { publishedAt: 'desc' },
      }),
      this.prisma.news.count({ where }),
    ]);

    return { data: news, total };
  }

  /**
   * Find one news article by ID
   */
  async findOne(tenantId: string, id: string): Promise<News> {
    const news = await this.prisma.news.findFirst({
      where: { id, tenantId },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!news) {
      throw new NotFoundException(`News article with ID '${id}' not found`);
    }

    return news;
  }

  /**
   * Find one news article by slug (public)
   */
  async findBySlug(tenantId: string, slug: string): Promise<News> {
    const news = await this.prisma.news.findUnique({
      where: {
        tenantId_slug: { tenantId, slug },
        status: NewsStatus.PUBLISHED,
        isPublic: true,
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!news) {
      throw new NotFoundException(`News article with slug '${slug}' not found`);
    }

    return news;
  }

  /**
   * Update news article
   */
  async update(
    tenantId: string,
    id: string,
    updateNewsDto: UpdateNewsDto,
  ): Promise<News> {
    this.logger.log(`Updating news article: ${id}`);

    // Verify news exists
    await this.findOne(tenantId, id);

    const data: any = { ...updateNewsDto };

    // If publishing for the first time, set publishedAt
    if (
      updateNewsDto.status === NewsStatus.PUBLISHED &&
      data.publishedAt === undefined
    ) {
      const existing = await this.prisma.news.findUnique({
        where: { id },
      });
      if (existing?.status !== NewsStatus.PUBLISHED) {
        data.publishedAt = new Date();
      }
    }

    try {
      const news = await this.prisma.news.update({
        where: { id },
        data,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      this.logger.log(`News article updated successfully: ${id}`);
      return news;
    } catch (error) {
      this.logger.error(
        `Failed to update news article: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Publish news article
   */
  async publish(tenantId: string, id: string): Promise<News> {
    this.logger.log(`Publishing news article: ${id}`);

    return this.update(tenantId, id, {
      status: NewsStatus.PUBLISHED,
    });
  }

  /**
   * Unpublish news article
   */
  async unpublish(tenantId: string, id: string): Promise<News> {
    this.logger.log(`Unpublishing news article: ${id}`);

    return this.update(tenantId, id, {
      status: NewsStatus.DRAFT,
    });
  }

  /**
   * Delete news article
   */
  async remove(tenantId: string, id: string): Promise<void> {
    this.logger.log(`Deleting news article: ${id}`);

    // Verify news exists
    await this.findOne(tenantId, id);

    try {
      await this.prisma.news.delete({
        where: { id },
      });

      this.logger.log(`News article deleted successfully: ${id}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete news article: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }
}
