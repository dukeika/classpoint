import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Req,
  Post,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BrandingService } from '../services';
import { UpdateBrandingDto } from '../dto';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/decorators';
import { UserRole } from '@classpoint/db';

@ApiTags('CMS - Branding')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cms/branding')
export class BrandingController {
  constructor(private readonly brandingService: BrandingService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get school branding' })
  @ApiResponse({ status: 200, description: 'Branding retrieved' })
  getBranding(@Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.brandingService.getBranding(tenantId);
  }

  @Put()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update school branding' })
  @ApiResponse({ status: 200, description: 'Branding updated' })
  updateBranding(@Req() req: any, @Body() updateBrandingDto: UpdateBrandingDto) {
    const tenantId = req.user.tenantId;
    return this.brandingService.updateBranding(tenantId, updateBrandingDto);
  }

  @Post('verify-domain')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Verify custom domain (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Domain verified' })
  verifyDomain(@Req() req: any, @Body() body: { domain: string }) {
    const tenantId = req.user.tenantId;
    return this.brandingService.verifyCustomDomain(tenantId, body.domain);
  }
}
