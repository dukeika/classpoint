import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Promotion Mapping DTO
 * Maps students from one class to another for promotions
 */
export class PromotionMappingDto {
  @ApiProperty({
    description: 'Current class ID (source)',
    example: 'cm4class123',
  })
  @IsString()
  fromClassId!: string;

  @ApiProperty({
    description: 'Target class ID (destination)',
    example: 'cm4class456',
  })
  @IsString()
  toClassId!: string;

  @ApiProperty({
    description: 'Specific student IDs to promote (optional - if not provided, all students in class are promoted)',
    example!: ['cm4student1', 'cm4student2'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  studentIds?: string[];
}

/**
 * Promotion Preview Request DTO
 * Request to preview a promotion before executing it
 */
export class PromotionPreviewDto {
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
}

/**
 * Promotion Preview Response
 * Shows what will happen if promotion is executed
 */
export interface PromotionPreviewResponse {
  fromTerm!: {;
    id!: string;
    name!: string;
    session!: {;
      id!: string;
      name!: string;
    };
  };
  toTerm!: {;
    id!: string;
    name!: string;
    session!: {;
      id!: string;
      name!: string;
    };
  };
  totalStudents!: number;
  promotions!: {;
    studentId!: string;
    studentName!: string;
    admissionNumber!: string;
    fromClass!: string;
    toClass!: string;
    currentEnrollmentId!: string;
  }[];
  conflicts!: {;
    type: 'CAPACITY_EXCEEDED' | 'STUDENT_ALREADY_ENROLLED' | 'CLASS_NOT_FOUND';
    message!: string;
    studentId?: string;
    classId?: string;
  }[];
  summary!: {;
    canProceed!: boolean;
    totalPromotions!: number;
    totalConflicts!: number;
    classBreakdown!: {;
      fromClass!: string;
      toClass!: string;
      studentCount!: number;
      targetCapacity!: number | null;
      availableSlots!: number | null;
    }[];
  };
}
