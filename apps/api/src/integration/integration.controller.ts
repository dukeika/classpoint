import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Logger,
  Res,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';
import { ImportService } from './import.service';
import { ExportQueryDto, ImportDto, ExportEntity } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';
import { UserRole } from '@classpoint/db';

@Controller('integration')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IntegrationController {
  private readonly logger = new Logger(IntegrationController.name);

  constructor(
    private readonly exportService: ExportService,
    private readonly importService: ImportService
  ) {}

  /**
   * Export data
   * GET /integration/export
   */
  @Get('export')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async exportData(
    @TenantId() tenantId: string,
    @Query() query: ExportQueryDto,
    @Res() res: Response
  ) {
    this.logger.log(`Exporting ${query.entity} for tenant: ${tenantId}`);

    const result = await this.exportService.exportData(tenantId, query);

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.data);
  }

  /**
   * Import data
   * POST /integration/import
   */
  @Post('import')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async importData(
    @TenantId() tenantId: string,
    @Body() importDto: ImportDto
  ) {
    this.logger.log(`Importing ${importDto.entity} for tenant: ${tenantId}`);
    return this.importService.importData(tenantId, importDto);
  }

  /**
   * Get import template
   * GET /integration/template/:entity
   */
  @Get('template')
  @Header('Content-Type', 'text/csv')
  async getImportTemplate(
    @Query('entity') entity: ExportEntity,
    @Res() res: Response
  ) {
    const template = await this.importService.generateTemplate(entity);
    const filename = `${entity}-template.csv`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(template);
  }
}
