import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Single student enrollment for bulk operation
 */
class StudentEnrollment {
  @ApiProperty({
    description: 'Student ID',
    example: 'cm4student123',
  })
  @IsString()
  studentId!: string;

  @ApiProperty({
    description: 'Class ID to assign',
    example: 'cm4class456',
  })
  @IsString()
  classId!: string;
}

/**
 * Bulk Enrollment DTO
 * Enroll multiple students in classes for a specific term
 */
export class BulkEnrollDto {
  @ApiProperty({
    description: 'Term ID for all enrollments',
    example: 'cm4term789',
  })
  @IsString()
  termId!: string;

  @ApiProperty({
    description: 'Array of student-class assignments',
    type!: [StudentEnrollment],
    example!: [;
      { studentId: 'cm4student1', classId: 'cm4class1' },
      { studentId: 'cm4student2', classId: 'cm4class2' },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentEnrollment)
  enrollments!: StudentEnrollment[];
}
