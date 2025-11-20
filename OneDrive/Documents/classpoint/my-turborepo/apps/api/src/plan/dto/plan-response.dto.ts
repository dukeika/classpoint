import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Plan } from '@classpoint/db';

export class PlanResponseDto {
  @ApiProperty({ example: 'clx1234567890' })
  id: string;

  @ApiProperty({ example: 'Standard Plan' })
  name: string;

  @ApiProperty({ example: 500 })
  studentCap: number;

  @ApiPropertyOptional({ example: 'Suitable for medium-sized schools' })
  description: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Number of tenants using this plan',
    example: 15,
  })
  tenantCount?: number;

  constructor(partial: Partial<PlanResponseDto>) {
    Object.assign(this, partial);
  }

  static fromEntity(plan: Plan & { _count?: { tenants: number } }): PlanResponseDto {
    return new PlanResponseDto({
      id: plan.id,
      name: plan.name,
      studentCap: plan.studentCap,
      description: plan.description,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      tenantCount: plan._count?.tenants ?? 0,
    });
  }
}
