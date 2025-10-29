import { Module } from '@nestjs/common';
import { PrismaModule } from '@classpoint/db';
import { FeeStatusService } from './fee-status.service';
import { FeeStatusController } from './fee-status.controller';

/**
 * Fee Status Module
 *
 * Manages student fee payment status including:
 * - Fee status tracking (FULL, PARTIAL, NONE)
 * - Bulk updates via CSV import
 * - Term-wise fee summaries
 * - Audit logging for all status changes
 * - Status badges and indicators
 * - Optional amount tracking
 */
@Module({
  imports: [PrismaModule],
  controllers: [FeeStatusController],
  providers: [FeeStatusService],
  exports: [FeeStatusService],
})
export class FeeStatusModule {}
