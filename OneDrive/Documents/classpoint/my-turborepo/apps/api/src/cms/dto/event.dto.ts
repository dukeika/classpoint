import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';

/**
 * Create Event DTO
 */
export class CreateEventDto {
  @ApiProperty({
    description: 'Event title',
    example: 'Parent-Teacher Meeting',
  })
  @IsString()
  title!: string;

  @ApiProperty({
    description: 'Event description',
    example: 'Discuss student progress with teachers',
    required: false,
  })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Event location',
    example: 'School Hall',
    required: false,
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    description: 'Event start time (ISO 8601)',
    example: '2025-02-15T09:00:00.000Z',
  })
  @IsDateString()
  startTime!: string;

  @ApiProperty({
    description: 'Event end time (ISO 8601)',
    example: '2025-02-15T15:00:00.000Z',
  })
  @IsDateString()
  endTime!: string;

  @ApiProperty({
    description: 'Term ID (if event is term-specific)',
    example: 'cm4term123',
    required: false,
  })
  @IsOptional()
  @IsString()
  termId?: string;

  @ApiProperty({
    description: 'Public event (visible on public site)',
    example: true,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

/**
 * Update Event DTO
 */
export class UpdateEventDto {
  @ApiProperty({
    description: 'Event title',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Event description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Event location',
    required: false,
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    description: 'Event start time (ISO 8601)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiProperty({
    description: 'Event end time (ISO 8601)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiProperty({
    description: 'Term ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  termId?: string;

  @ApiProperty({
    description: 'Public visibility',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
