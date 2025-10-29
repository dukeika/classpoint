import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { AssessmentType } from '@classpoint/db';

/**
 * Create Assessment DTO
 * Define an assessment for a subject in a term
 */
export class CreateAssessmentDto {
  @ApiProperty({
    description: 'Term ID',
    example: 'cm4term123',
  })
  @IsString()
  termId!: string;

  @ApiProperty({
    description: 'Subject ID',
    example: 'cm4subject456',
  })
  @IsString()
  subjectId!: string;

  @ApiProperty({
    description: 'Assessment type',
    enum!: AssessmentType,
    example!: AssessmentType.CA1,
  })
  @IsEnum(AssessmentType)
  type!: AssessmentType;

  @ApiProperty({
    description: 'Weight percentage (e.g., 10, 20, 70)',
    example: 10,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  weight!: number;

  @ApiProperty({
    description: 'Maximum score for this assessment',
    example: 10,
  })
  @IsNumber()
  @Min(0)
  maxScore!: number;
}
