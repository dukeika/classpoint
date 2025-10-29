import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Tenant } from '@classpoint/db';

export class TenantResponseDto {
  @ApiProperty({ example: 'clx1234567890' })
  id: string;

  @ApiProperty({ example: 'Green Valley High School' })
  schoolName: string;

  @ApiProperty({ example: 'green-valley-hs' })
  slug: string;

  @ApiPropertyOptional({ example: 'admin@greenvalley.edu' })
  email?: string | null;

  @ApiPropertyOptional({ example: '+27123456789' })
  phone?: string | null;

  @ApiPropertyOptional({ example: '123 Education Street, Cape Town' })
  address?: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiPropertyOptional({ example: 'clx0987654321' })
  planId?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Current student enrollment count',
    example: 450,
  })
  currentEnrollment?: number;

  @ApiPropertyOptional({
    description: 'Maximum student cap from plan',
    example: 500,
  })
  studentCap?: number;

  @ApiPropertyOptional({
    description: 'Percentage of cap used',
    example: 90,
  })
  capUsagePercentage?: number;

  constructor(partial: Partial<TenantResponseDto>) {
    Object.assign(this, partial);
  }

  static fromEntity(tenant: Tenant & {
    _count?: { enrollments?: number };
    plan?: { cap: number } | null;
  }): TenantResponseDto {
    const currentEnrollment = tenant._count?.enrollments ?? 0;
    const studentCap = tenant.plan?.cap ?? null;
    const capUsagePercentage = studentCap
      ? Math.round((currentEnrollment / studentCap) * 100)
      : null;

    return new TenantResponseDto({
      id: tenant.id,
      schoolName: tenant.schoolName,
      slug: tenant.slug,
      email: tenant.email,
      phone: tenant.phone,
      address: tenant.address,
      isActive: tenant.isActive,
      planId: tenant.planId,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      currentEnrollment: currentEnrollment,
      studentCap: studentCap ?? undefined,
      capUsagePercentage: capUsagePercentage ?? undefined,
    });
  }
}
