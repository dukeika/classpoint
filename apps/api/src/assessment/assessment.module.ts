import { Module } from '@nestjs/common';
import { PrismaModule } from '@classpoint/db';
import { AssessmentService } from './assessment.service';
import { AssessmentController } from './assessment.controller';

/**
 * Assessment Module
 *
 * Manages assessments and grading including:
 * - Assessment creation (CA1, CA2, CA3, EXAM, PROJECT, PRACTICAL)
 * - Grade entry with validation
 * - Bulk grade entry
 * - Result compilation and calculation
 * - Grade publishing/unpublishing
 * - Student result reports
 * - Weighted score calculations
 */
@Module({
  imports: [PrismaModule],
  controllers: [AssessmentController],
  providers: [AssessmentService],
  exports: [AssessmentService],
})
export class AssessmentModule {}
