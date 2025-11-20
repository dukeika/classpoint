import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Single student grade
 */
class StudentGrade {
  @ApiProperty({
    description: 'Student ID or admission number',
    example: 'STU001',
  })
  @IsString()
  studentIdentifier!: string;

  @ApiProperty({
    description: 'Score achieved',
    example: 8.5,
  })
  @IsNumber()
  @Min(0)
  score!: number;
}

/**
 * Bulk Grades DTO
 * Enter grades for multiple students for an assessment
 */
export class BulkGradesDto {
  @ApiProperty({
    description: 'Assessment ID',
    example: 'cm4assessment789',
  })
  @IsString()
  assessmentId!: string;

  @ApiProperty({
    description: 'Subject ID',
    example: 'cm4subject456',
  })
  @IsString()
  subjectId!: string;

  @ApiProperty({
    description: 'Array of student grades',
    type!: [StudentGrade],
    example!: [;
      { studentIdentifier: 'STU001', score: 8.5 },
      { studentIdentifier: 'STU002', score: 7.0 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentGrade)
  grades!: StudentGrade[];

  @ApiProperty({
    description: 'User ID who entered the grades',
    example: 'cm4user999',
  })
  @IsString()
  enteredBy!: string;
}
