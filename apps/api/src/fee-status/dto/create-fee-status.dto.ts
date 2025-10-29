import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsNumber, IsArray, Min } from 'class-validator';
import { FeeStatusType } from '@classpoint/db';

/**
 * Create Fee Status DTO
 * Track student fee payment status for a term
 */
export class CreateFeeStatusDto {
  @ApiProperty({
    description: 'Student ID',
    example: 'cm4student123',
  })
  @IsString()
  studentId!: string;

  @ApiProperty({
    description: 'Term ID',
    example: 'cm4term456',
  })
  @IsString()
  termId!: string;

  @ApiProperty({
    description: 'Fee payment status',
    enum!: FeeStatusType,
    example!: FeeStatusType.FULL,
  })
  @IsEnum(FeeStatusType)
  status!: FeeStatusType;

  @ApiProperty({
    description: 'Total billed amount (optional)',
    example: 50000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  billedAmount?: number;

  @ApiProperty({
    description: 'Amount received (optional)',
    example: 50000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  receivedAmount?: number;

  @ApiProperty({
    description: 'Outstanding amount (optional)',
    example: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  outstandingAmount?: number;

  @ApiProperty({
    description: 'Additional notes',
    example: 'Payment received via bank transfer',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'S3 keys for evidence files',
    example!: ['evidence/payment-receipt-123.pdf'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @ApiProperty({
    description: 'User ID who created/updated this status',
    example: 'cm4user789',
  })
  @IsString()
  updatedBy!: string;
}
