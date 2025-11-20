import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateClassDto } from './create-class.dto';

/**
 * Update Class DTO
 * All fields are optional for partial updates
 * Level cannot be changed after creation (use arm for reorganization)
 */
export class UpdateClassDto extends PartialType(
  OmitType(CreateClassDto, ['level'] as const)
) {}
