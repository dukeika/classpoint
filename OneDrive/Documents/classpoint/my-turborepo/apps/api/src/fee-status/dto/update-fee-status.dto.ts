import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateFeeStatusDto } from './create-fee-status.dto';

/**
 * Update Fee Status DTO
 * All fields except studentId and termId are optional
 */
export class UpdateFeeStatusDto extends PartialType(
  OmitType(CreateFeeStatusDto, ['studentId', 'termId'] as const)
) {}
