import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, MinLength, MaxLength, Min } from 'class-validator';

/**
 * Create Class DTO
 * Represents a class level with optional arm (e.g., "Primary 1 A", "JSS 2 B")
 */
export class CreateClassDto {
  @ApiProperty({
    description: 'Class level (e.g., "Primary 1", "JSS 1", "SSS 3")',
    example: 'Primary 1',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  level!: string;

  @ApiProperty({
    description: 'Class arm/section (e.g., "A", "B", "Gold")',
    example: 'A',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  arm?: string;

  @ApiProperty({
    description: 'Maximum student capacity for the class',
    example: 40,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}
