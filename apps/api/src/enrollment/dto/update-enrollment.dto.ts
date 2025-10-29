import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsDateString } from 'class-validator';

/**
 * Update Enrollment DTO
 * Allows updating class assignment and promotion status
 */
export class UpdateEnrollmentDto {
  @ApiProperty({
    description: 'New class ID (for mid-term class changes)',
    example: 'cm4class999',
    required: false,
  })
  @IsOptional()
  @IsString()
  classId?: string;

  @ApiProperty({
    description: 'Promotion status',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPromoted?: boolean;

  @ApiProperty({
    description: 'User who promoted the student',
    example: 'cm4user123',
    required: false,
  })
  @IsOptional()
  @IsString()
  promotedBy?: string;

  @ApiProperty({
    description: 'When the student was promoted',
    example: '2025-01-25T10:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  promotedAt?: string;
}
