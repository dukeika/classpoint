import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateTenantDto } from './create-tenant.dto';

/**
 * Update Tenant DTO
 * All fields are optional, code cannot be updated (immutable)
 */
export class UpdateTenantDto extends PartialType(
  OmitType(CreateTenantDto, ['code'] as const)
) {}
