import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateSubjectDto } from './create-subject.dto';

/**
 * Update Subject DTO
 * All fields except code are optional for partial updates
 * Subject code cannot be changed after creation
 */
export class UpdateSubjectDto extends PartialType(
  OmitType(CreateSubjectDto, ['code'] as const)
) {}
