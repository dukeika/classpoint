import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';

/**
 * Create Grade DTO
 * Enter a grade for a student's assessment
 */
export class CreateGradeDto {
  @ApiProperty({
    description: 'Student ID',
    example: 'cm4student123',
  })
  @IsString()
  studentId!: string;

  @ApiProperty({
    description: 'Subject ID',
    example: 'cm4subject456',
  })
  @IsString()
  subjectId!: string;

  @ApiProperty({
    description: 'Assessment ID',
    example: 'cm4assessment789',
  })
  @IsString()
  assessmentId!: string;

  @ApiProperty({
    description: 'Score achieved',
    example: 8.5,
  })
  @IsNumber()
  @Min(0)
  score!: number;

  @ApiProperty({
    description: 'User ID who entered the grade',
    example: 'cm4user999',
  })
  @IsString()
  enteredBy!: string;

  @ApiProperty({
    description: 'Is grade published to students/parents',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiProperty({
    description: 'Is grade locked (cannot be edited)',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;
}
