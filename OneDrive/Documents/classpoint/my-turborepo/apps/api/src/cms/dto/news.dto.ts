import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEnum, IsUrl } from 'class-validator';
import { NewsStatus } from '@classpoint/db';

/**
 * Create News DTO
 */
export class CreateNewsDto {
  @ApiProperty({
    description: 'News title',
    example: 'Annual Sports Day 2025',
  })
  @IsString()
  title!: string;

  @ApiProperty({
    description: 'Short excerpt/summary',
    example: 'Join us for our annual sports day celebration',
    required: false,
  })
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiProperty({
    description: 'Full content (HTML/rich text)',
    example: '<p>We are excited to announce...</p>',
  })
  @IsString()
  content!: string;

  @ApiProperty({
    description: 'Cover image URL (S3)',
    example: 'https://s3.amazonaws.com/bucket/sports-day.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  coverImage?: string;

  @ApiProperty({
    description: 'Author user ID',
    example: 'cm4user123',
  })
  @IsString()
  authorId!: string;

  @ApiProperty({
    description: 'Publication status',
    enum!: NewsStatus,
    example!: NewsStatus.DRAFT,
    required: false,
    default!: NewsStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(NewsStatus)
  status?: NewsStatus;

  @ApiProperty({
    description: 'Featured news (shown prominently)',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiProperty({
    description: 'Public (visible on public site)',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

/**
 * Update News DTO
 */
export class UpdateNewsDto {
  @ApiProperty({
    description: 'News title',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Short excerpt/summary',
    required: false,
  })
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiProperty({
    description: 'Full content (HTML/rich text)',
    required: false,
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({
    description: 'Cover image URL (S3)',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  coverImage?: string;

  @ApiProperty({
    description: 'Publication status',
    enum!: NewsStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(NewsStatus)
  status?: NewsStatus;

  @ApiProperty({
    description: 'Featured news',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiProperty({
    description: 'Public visibility',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
