import { Module } from '@nestjs/common';
import { DatabaseModule } from '@classpoint/db';
import { ExportService } from './export.service';
import { ImportService } from './import.service';
import { IntegrationController } from './integration.controller';

/**
 * Integration Module
 *
 * Provides system integration features:
 * - Data export (CSV, Excel, JSON)
 * - Bulk data import with validation
 * - Import templates generation
 * - Support for multiple entities (students, staff, classes, grades, etc.)
 *
 * All endpoints are protected with RBAC and tenant isolation.
 */
@Module({
  imports: [DatabaseModule],
  controllers: [IntegrationController],
  providers: [ExportService, ImportService],
  exports: [ExportService, ImportService],
})
export class IntegrationModule {}
