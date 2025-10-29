import { Module } from '@nestjs/common';
import { PrismaModule } from '@classpoint/db';
import { ConfigModule } from '@nestjs/config';
import { ExternalReportService } from './external-report.service';
import { ExternalReportController } from './external-report.controller';

/**
 * External Report Module
 *
 * Manages external report uploads (PDFs, images) to S3 including:
 * - Presigned URL generation for secure uploads/downloads
 * - Report metadata management
 * - S3 file storage and retrieval
 * - Report listing by student/term
 * - File deletion (S3 + database)
 * - Storage statistics
 */
@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [ExternalReportController],
  providers: [ExternalReportService],
  exports: [ExternalReportService],
})
export class ExternalReportModule {}
