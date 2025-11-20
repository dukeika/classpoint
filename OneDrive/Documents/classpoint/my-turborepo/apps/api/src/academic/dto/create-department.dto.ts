import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

/**
 * Create Department DTO
 * Departments organize subjects (e.g., "Sciences", "Languages", "Arts")
 */
export class CreateDepartmentDto {
  @ApiProperty({
    description: 'Department name',
    example: 'Sciences',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    description: 'Department description',
    example: 'Natural and Applied Sciences',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description: string;
}
