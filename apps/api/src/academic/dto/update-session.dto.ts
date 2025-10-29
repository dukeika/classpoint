import { PartialType } from '@nestjs/swagger';
import { CreateSessionDto } from './create-session.dto';

/**
 * Update Session DTO
 * All fields are optional for partial updates
 */
export class UpdateSessionDto extends PartialType(CreateSessionDto) {}
