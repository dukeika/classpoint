import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@classpoint/db';
import { SchoolBranding } from '@classpoint/db';
import { UpdateBrandingDto } from '../dto';

@Injectable()
export class BrandingService {
  private readonly logger = new Logger(BrandingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get school branding (creates default if not exists)
   */
  async getBranding(tenantId: string): Promise<SchoolBranding> {
    this.logger.log(`Getting branding for tenant: ${tenantId}`);

    let branding = await this.prisma.schoolBranding.findUnique({
      where: { tenantId },
    });

    // Create default branding if it doesn't exist
    if (!branding) {
      this.logger.log(`Creating default branding for tenant: ${tenantId}`);
      branding = await this.prisma.schoolBranding.create({
        data: {
          tenantId,
          primaryColor: '#1e40af',
          secondaryColor: '#64748b',
          accentColor: '#f59e0b',
        },
      });
    }

    return branding;
  }

  /**
   * Update school branding
   */
  async updateBranding(
    tenantId: string,
    updateBrandingDto: UpdateBrandingDto,
  ): Promise<SchoolBranding> {
    this.logger.log(`Updating branding for tenant: ${tenantId}`);

    // Get or create branding first
    await this.getBranding(tenantId);

    try {
      const branding = await this.prisma.schoolBranding.update({
        where: { tenantId },
        data: updateBrandingDto,
      });

      this.logger.log(`Branding updated successfully for tenant: ${tenantId}`);
      return branding;
    } catch (error) {
      this.logger.error(
        `Failed to update branding: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Verify custom domain (admin action)
   */
  async verifyCustomDomain(
    tenantId: string,
    domain: string,
  ): Promise<SchoolBranding> {
    this.logger.log(`Verifying custom domain ${domain} for tenant: ${tenantId}`);

    const branding = await this.prisma.schoolBranding.update({
      where: { tenantId },
      data: {
        customDomain: domain,
        domainVerified: true,
      },
    });

    this.logger.log(`Custom domain verified: ${domain}`);
    return branding;
  }

  /**
   * Get branding by custom domain (public access)
   */
  async getBrandingByDomain(domain: string): Promise<SchoolBranding | null> {
    this.logger.log(`Looking up branding by domain: ${domain}`);

    const branding = await this.prisma.schoolBranding.findUnique({
      where: {
        customDomain: domain,
        domainVerified: true,
      },
      include: {
        tenant: {
          select: {
            id: true,
            schoolName: true,
            slug: true,
            address: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    return branding;
  }

  /**
   * Get branding by school slug (public access)
   */
  async getBrandingBySlug(slug: string): Promise<SchoolBranding | null> {
    this.logger.log(`Looking up branding by slug: ${slug}`);

    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      include: {
        schoolBranding: true,
      },
    });

    return tenant?.schoolBranding || null;
  }
}
