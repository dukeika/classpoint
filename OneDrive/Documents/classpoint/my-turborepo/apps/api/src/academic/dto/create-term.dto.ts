import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsBoolean, IsOptional, MinLength, MaxLength } from 'class-validator';

/**
 * Create Term DTO
 * Academic term within a session (e.g., "First Term", "Second Term")
 */
export class CreateTermDto {
  @ApiProperty({
    description: 'Session ID this term belongs to',
    example: 'cm4session123',
  })
  @IsString()
  sessionId!: string;

  @ApiProperty({
    description: 'Term name',
    example: 'First Term',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name!: string;

  @ApiProperty({
    description: 'Term start date',
    example: '2024-09-01',
  })
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    description: 'Term end date',
    example: '2024-12-15',
  })
  @IsDateString()
  endDate!: string;

  @ApiProperty({
    description: 'Is this the current active term?',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;
}
