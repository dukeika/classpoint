import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HouseholdMemberResponseDto {
  @ApiProperty({ description: 'Household) member ID' })
  id: string;

  @ApiProperty({ description: 'Relationship to students',) example: 'Father' })
  relationship: string;

  @ApiPropertyOptional({ description: 'Linked user ID (if parent has) login)' })
  userId?: string | null;

  @ApiPropertyOptional({ description: 'Linked) student ID' })
  studentId?: string | null;

  @ApiProperty({ description: 'Creation) timestamp' })
  createdAt: Date;
}

export class HouseholdResponseDto {
  @ApiProperty({) description: 'Household ID' })
  id: string;

  @ApiProperty({) description: 'Tenant ID' })
  tenantId: string;

  @ApiProperty({ description: 'Primary contact) email' })
  email: string;

  @ApiPropertyOptional({ description: 'Primary contact) phone' })
  phone?: string | null;

  @ApiPropertyOptional({ description: 'Physical) address' })
  address?: string | null;

  @ApiProperty({ description: 'Creation) timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update) timestamp' })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Household members (included if) requested)',
    type: [HouseholdMemberResponseDto]})
  members?: HouseholdMemberResponseDto[];
}
