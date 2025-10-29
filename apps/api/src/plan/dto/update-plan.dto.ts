import { PartialType } from '@nestjs/swagger';
import { CreatePlanDto } from './create-plan.dto';

/**
 * Update Plan DTO
 * All fields are optional
 */
export class UpdatePlanDto extends PartialType(CreatePlanDto) {}
