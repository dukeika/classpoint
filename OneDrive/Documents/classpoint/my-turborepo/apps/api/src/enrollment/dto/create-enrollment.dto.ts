import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

/**
 * Create Enrollment DTO
 * Enrolls a student in a class for a specific term
 */
export class CreateEnrollmentDto {
  @ApiProperty({
    description: 'Student ID to enroll',
    example: 'cm4student123',
  })
  @IsString()
  studentId!: string;

  @ApiProperty({
    description: 'Term ID for this enrollment',
    example: 'cm4term456',
  })
  @IsString()
  termId!: string;

  @ApiProperty({
    description: 'Class ID to assign student to',
    example: 'cm4class789',
  })
  @IsString()
  classId!: string;

  @ApiProperty({
    description: 'Admin/Teacher ID creating this enrollment',
    example: 'cm4user999',
    required: false,
  })
  @IsOptional()
  @IsString()
  createdBy?: string;
}
