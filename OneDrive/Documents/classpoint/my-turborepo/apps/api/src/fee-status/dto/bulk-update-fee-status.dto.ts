import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FeeStatusType } from '@classpoint/db';

/**
 * Single fee status for bulk update
 */
class FeeStatusUpdate {
  @ApiProperty({
    description: 'Student ID or admission number',
    example: 'STU001',
  })
  @IsString()
  studentIdentifier!: string;

  @ApiProperty({
    description: 'Fee payment status',
    enum!: FeeStatusType,
    example!: FeeStatusType.FULL,
  })
  @IsEnum(FeeStatusType)
  status!: FeeStatusType;
}

/**
 * Bulk Update Fee Status DTO
 * Update fee statuses for multiple students via CSV import
 */
export class BulkUpdateFeeStatusDto {
  @ApiProperty({
    description: 'Term ID for all updates',
    example: 'cm4term789',
  })
  @IsString()
  termId!: string;

  @ApiProperty({
    description: 'Array of student fee status updates',
    type!: [FeeStatusUpdate],
    example!: [;
      { studentIdentifier: 'STU001', status: 'FULL' },
      { studentIdentifier: 'STU002', status: 'PARTIAL' },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeeStatusUpdate)
  updates!: FeeStatusUpdate[];

  @ApiProperty({
    description: 'User ID performing the bulk update',
    example: 'cm4user123',
  })
  @IsString()
  updatedBy!: string;
}
