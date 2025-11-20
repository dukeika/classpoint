import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { BrandingService, NewsService, EventService, GalleryService } from '../services';

/**
 * Public CMS Controller
 * No authentication required - for public school websites
 */
@ApiTags('CMS - Public')
@Controller('public/cms')
export class PublicCmsController {
  constructor(
    private readonly brandingService: BrandingService,
    private readonly newsService: NewsService,
    private readonly eventService: EventService,
    private readonly galleryService: GalleryService,
  ) {}

  // ==================== School Info ====================

  @Get('schools/:slug')
  @ApiOperation({
    summary: 'Get school branding by slug (public)',
    description: 'Retrieve school branding and info using school slug. No authentication required.',
  })
  @ApiParam({ name: 'slug', description: 'School slug', example: 'st-michael-school' })
  @ApiResponse({ status: 200, description: 'School branding retrieved' })
  @ApiResponse({ status: 404, description: 'School not found' })
  async getSchoolBySlug(@Param('slug') slug: string) {
    const branding = await this.brandingService.getBrandingBySlug(slug);

    if (!branding) {
      throw new NotFoundException(`School with slug '${slug}' not found`);
    }

    return branding;
  }

  @Get('domain/:domain')
  @ApiOperation({
    summary: 'Get school branding by custom domain (public)',
    description: 'Retrieve school info using custom domain. For sites like www.myschool.com',
  })
  @ApiParam({ name: 'domain', description: 'Custom domain', example: 'www.myschool.com' })
  @ApiResponse({ status: 200, description: 'School branding retrieved' })
  @ApiResponse({ status: 404, description: 'Domain not found' })
  async getSchoolByDomain(@Param('domain') domain: string) {
    const branding = await this.brandingService.getBrandingByDomain(domain);

    if (!branding) {
      throw new NotFoundException(`School with domain '${domain}' not found`);
    }

    return branding;
  }

  // ==================== News ====================

  @Get('schools/:slug/news')
  @ApiOperation({
    summary: 'Get public news articles',
    description: 'Get published news articles for a school. No authentication required.',
  })
  @ApiParam({ name: 'slug', description: 'School slug' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'featured', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'News articles retrieved' })
  async getPublicNews(
    @Param('slug') slug: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('featured') featured?: string,
  ) {
    // Get tenant ID from slug
    const branding = await this.brandingService.getBrandingBySlug(slug);

    if (!branding) {
      throw new NotFoundException(`School with slug '${slug}' not found`);
    }

    return this.newsService.findPublic(branding.tenantId, {
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      featured: featured ? featured === 'true' : undefined,
    });
  }

  @Get('schools/:slug/news/:newsSlug')
  @ApiOperation({
    summary: 'Get public news article by slug',
    description: 'Get single published news article. No authentication required.',
  })
  @ApiParam({ name: 'slug', description: 'School slug' })
  @ApiParam({ name: 'newsSlug', description: 'News article slug' })
  @ApiResponse({ status: 200, description: 'News article retrieved' })
  @ApiResponse({ status: 404, description: 'News article not found' })
  async getPublicNewsBySlug(
    @Param('slug') slug: string,
    @Param('newsSlug') newsSlug: string,
  ) {
    const branding = await this.brandingService.getBrandingBySlug(slug);

    if (!branding) {
      throw new NotFoundException(`School with slug '${slug}' not found`);
    }

    return this.newsService.findBySlug(branding.tenantId, newsSlug);
  }

  // ==================== Events ====================

  @Get('schools/:slug/events')
  @ApiOperation({
    summary: 'Get public events',
    description: 'Get public events for a school. No authentication required.',
  })
  @ApiParam({ name: 'slug', description: 'School slug' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Events retrieved' })
  async getPublicEvents(
    @Param('slug') slug: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const branding = await this.brandingService.getBrandingBySlug(slug);

    if (!branding) {
      throw new NotFoundException(`School with slug '${slug}' not found`);
    }

    return this.eventService.findPublic(branding.tenantId, {
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('schools/:slug/events/upcoming')
  @ApiOperation({
    summary: 'Get upcoming public events',
    description: 'Get upcoming public events. No authentication required.',
  })
  @ApiParam({ name: 'slug', description: 'School slug' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 5 })
  @ApiResponse({ status: 200, description: 'Upcoming events retrieved' })
  async getUpcomingEvents(
    @Param('slug') slug: string,
    @Query('limit') limit?: string,
  ) {
    const branding = await this.brandingService.getBrandingBySlug(slug);

    if (!branding) {
      throw new NotFoundException(`School with slug '${slug}' not found`);
    }

    return this.eventService.findUpcoming(
      branding.tenantId,
      limit ? parseInt(limit) : 5,
    );
  }

  // ==================== Galleries ====================

  @Get('schools/:slug/galleries')
  @ApiOperation({
    summary: 'Get public galleries',
    description: 'Get public photo galleries for a school. No authentication required.',
  })
  @ApiParam({ name: 'slug', description: 'School slug' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Galleries retrieved' })
  async getPublicGalleries(
    @Param('slug') slug: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const branding = await this.brandingService.getBrandingBySlug(slug);

    if (!branding) {
      throw new NotFoundException(`School with slug '${slug}' not found`);
    }

    return this.galleryService.findPublicGalleries(branding.tenantId, {
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
    });
  }

  @Get('schools/:slug/galleries/:galleryId')
  @ApiOperation({
    summary: 'Get public gallery by ID',
    description: 'Get single public gallery with all images. No authentication required.',
  })
  @ApiParam({ name: 'slug', description: 'School slug' })
  @ApiParam({ name: 'galleryId', description: 'Gallery ID' })
  @ApiResponse({ status: 200, description: 'Gallery retrieved' })
  @ApiResponse({ status: 404, description: 'Gallery not found' })
  async getPublicGallery(
    @Param('slug') slug: string,
    @Param('galleryId') galleryId: string,
  ) {
    const branding = await this.brandingService.getBrandingBySlug(slug);

    if (!branding) {
      throw new NotFoundException(`School with slug '${slug}' not found`);
    }

    const gallery = await this.galleryService.findOneGallery(
      branding.tenantId,
      galleryId,
    );

    // Verify gallery is public
    if (!gallery.isPublic) {
      throw new NotFoundException(`Gallery '${galleryId}' not found`);
    }

    return gallery;
  }
}
