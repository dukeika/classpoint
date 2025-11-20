import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateTermDto } from './create-term.dto';

/**
 * Update Term DTO
 * All fields are optional for partial updates
 * SessionId cannot be changed after creation
 */
export class UpdateTermDto extends PartialType(
  OmitType(CreateTermDto, ['sessionId'] as const)
) {}
