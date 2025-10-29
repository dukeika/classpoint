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
import { NewsService } from '../services';
import { CreateNewsDto, UpdateNewsDto } from '../dto';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/decorators';
import { UserRole, NewsStatus } from '@classpoint/db';

@ApiTags('CMS - News')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cms/news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Create news article' })
  @ApiResponse({ status: 201, description: 'News article created' })
  create(@Req() req: any, @Body() createNewsDto: CreateNewsDto) {
    const tenantId = req.user.tenantId;
    return this.newsService.create(tenantId, createNewsDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all news articles' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: NewsStatus })
  @ApiQuery({ name: 'isFeatured', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'News articles retrieved' })
  findAll(
    @Req() req: any,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('status') status?: NewsStatus,
    @Query('isFeatured') isFeatured?: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.newsService.findAll(tenantId, {
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      status,
      isFeatured: isFeatured ? isFeatured === 'true' : undefined,
    });
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get news article by ID' })
  @ApiResponse({ status: 200, description: 'News article retrieved' })
  @ApiResponse({ status: 404, description: 'News article not found' })
  findOne(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.newsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Update news article' })
  @ApiResponse({ status: 200, description: 'News article updated' })
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateNewsDto: UpdateNewsDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.newsService.update(tenantId, id, updateNewsDto);
  }

  @Patch(':id/publish')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Publish news article' })
  @ApiResponse({ status: 200, description: 'News article published' })
  publish(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.newsService.publish(tenantId, id);
  }

  @Patch(':id/unpublish')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Unpublish news article' })
  @ApiResponse({ status: 200, description: 'News article unpublished' })
  unpublish(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.newsService.unpublish(tenantId, id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Delete news article' })
  @ApiResponse({ status: 200, description: 'News article deleted' })
  remove(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.newsService.remove(tenantId, id);
  }
}
