import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, ValidateNested, IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { PromotionMappingDto } from './promotion-preview.dto';

/**
 * Execute Promotion DTO
 * Execute a promotion with optional force override
 */
export class ExecutePromotionDto {
  @ApiProperty({
    description: 'Current term ID (where students are currently enrolled)',
    example: 'cm4term123',
  })
  @IsString()
  fromTermId!: string;

  @ApiProperty({
    description: 'Target term ID (where students will be enrolled after promotion)',
    example: 'cm4term456',
  })
  @IsString()
  toTermId!: string;

  @ApiProperty({
    description: 'Array of promotion mappings (from class to class)',
    type!: [PromotionMappingDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromotionMappingDto)
  mappings!: PromotionMappingDto[];

  @ApiProperty({
    description: 'User ID of the person executing the promotion',
    example: 'cm4user789',
  })
  @IsString()
  promotedBy!: string;

  @ApiProperty({
    description: 'Force promotion even if there are capacity conflicts',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;

  @ApiProperty({
    description: 'Notes about this promotion (e.g., "End of 2024/2025 academic year")',
    example: 'Promoted all students to next class for 2025/2026 session',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * Execute Promotion Response
 * Result of executing a promotion
 */
export interface ExecutePromotionResponse {
  success!: boolean;
  totalPromoted!: number;
  totalFailed!: number;
  promotedStudents!: {;
    studentId!: string;
    studentName!: string;
    fromClass!: string;
    toClass!: string;
    oldEnrollmentId!: string;
    newEnrollmentId!: string;
  }[];
  failedPromotions!: {;
    studentId!: string;
    studentName!: string;
    fromClass!: string;
    toClass!: string;
    error!: string;
  }[];
  auditLogId!: string;
  promotedBy!: string;
  promotedAt!: Date;
  notes?: string;
}
