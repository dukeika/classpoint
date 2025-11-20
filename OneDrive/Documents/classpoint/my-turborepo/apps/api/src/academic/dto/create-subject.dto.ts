import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

/**
 * Create Subject DTO
 * Academic subjects offered by the school
 */
export class CreateSubjectDto {
  @ApiProperty({
    description: 'Subject code (unique identifier)',
    example: 'MATH101',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  code!: string;

  @ApiProperty({
    description: 'Subject name',
    example: 'Mathematics',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    description: 'Department ID this subject belongs to',
    example: 'cm4dept123',
    required: false,
  })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiProperty({
    description: 'Subject description',
    example: 'Core Mathematics curriculum covering algebra, geometry, and calculus',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description: string;
}
