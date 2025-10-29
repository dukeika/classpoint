import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
  Req,
  UseGuards,
} from '@nestjs/swagger';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { ContactService } from './contact.service';
import { CreateContactDto, ContactResponseDto } from './dto';
import { ContactStatus } from '@classpoint/db';
import { AuthGuard } from '../common/guards/auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { UserId } from '../common/decorators/user-id.decorator';
import { UserRole } from '@classpoint/db';

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit a contact form (public endpoint)',
    description: 'Submit a contact form from the school landing page. No authentication required.',
  })
  @ApiResponse({
    status: 201,
    description: 'Contact submission created successfully',
    type: ContactResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(
    @Body() createContactDto: CreateContactDto,
    @Query('tenantId') tenantId: string,
    @Req() request: Request,
  ): Promise<ContactResponseDto> {
    const ipAddress = request.ip || request.socket.remoteAddress;
    const userAgent = request.headers['user-agent'];

    return this.contactService.create(
      tenantId,
      createContactDto,
      ipAddress,
      userAgent,
    );
  }

  @Get()
  @UseGuards(AuthGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all contact submissions (admin only)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ContactStatus })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'List of contact submissions',
  })
  async findAll(
    @TenantId() tenantId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('status') status?: ContactStatus,
    @Query('search') search?: string,
  ): Promise<{
    data: ContactResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const result = await this.contactService.findAll({
      tenantId,
      skip,
      take: limit,
      status,
      search,
    });

    return {
      ...result,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }

  @Get('stats')
  @UseGuards(AuthGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get contact submission statistics (admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Contact submission statistics',
  })
  async getStats(@TenantId() tenantId: string): Promise<{
    total: number;
    new: number;
    read: number;
    replied: number;
    closed: number;
    bySubject: Record<string, number>;
  }> {
    return this.contactService.getStats(tenantId);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get a contact submission by ID (admin only)',
  })
  @ApiParam({ name: 'id', description: 'Contact submission ID' })
  @ApiResponse({
    status: 200,
    description: 'Contact submission retrieved successfully',
    type: ContactResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Contact submission not found' })
  async findOne(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ): Promise<ContactResponseDto> {
    return this.contactService.findOne(id, tenantId);
  }

  @Patch(':id/read')
  @UseGuards(AuthGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mark contact submission as read (admin only)',
  })
  @ApiParam({ name: 'id', description: 'Contact submission ID' })
  @ApiResponse({
    status: 200,
    description: 'Marked as read successfully',
    type: ContactResponseDto,
  })
  async markAsRead(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ): Promise<ContactResponseDto> {
    return this.contactService.markAsRead(id, tenantId);
  }

  @Patch(':id/replied')
  @UseGuards(AuthGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mark contact submission as replied (admin only)',
  })
  @ApiParam({ name: 'id', description: 'Contact submission ID' })
  @ApiResponse({
    status: 200,
    description: 'Marked as replied successfully',
    type: ContactResponseDto,
  })
  async markAsReplied(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @UserId() userId: string,
  ): Promise<ContactResponseDto> {
    return this.contactService.markAsReplied(id, tenantId, userId);
  }

  @Patch(':id/close')
  @UseGuards(AuthGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Close a contact submission (admin only)',
  })
  @ApiParam({ name: 'id', description: 'Contact submission ID' })
  @ApiResponse({
    status: 200,
    description: 'Contact submission closed successfully',
    type: ContactResponseDto,
  })
  async close(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ): Promise<ContactResponseDto> {
    return this.contactService.close(id, tenantId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a contact submission (admin only)',
  })
  @ApiParam({ name: 'id', description: 'Contact submission ID' })
  @ApiResponse({ status: 204, description: 'Contact submission deleted' })
  @ApiResponse({ status: 404, description: 'Contact submission not found' })
  async remove(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ): Promise<void> {
    return this.contactService.remove(id, tenantId);
  }
}
