import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsUrl, IsInt, Min } from 'class-validator';

/**
 * Create Gallery DTO
 */
export class CreateGalleryDto {
  @ApiProperty({
    description: 'Gallery name',
    example: 'Sports Day 2025',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Gallery description',
    example: 'Photos from our annual sports day event',
    required: false,
  })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Public gallery (visible on public site)',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

/**
 * Update Gallery DTO
 */
export class UpdateGalleryDto {
  @ApiProperty({
    description: 'Gallery name',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Gallery description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Public visibility',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

/**
 * Add Image to Gallery DTO
 */
export class AddGalleryImageDto {
  @ApiProperty({
    description: 'Image title',
    example: 'Winners of 100m race',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Image description',
    example: 'Students celebrating their victory',
    required: false,
  })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Image URL (S3)',
    example: 'https://s3.amazonaws.com/bucket/image.jpg',
  })
  @IsUrl()
  imageUrl!: string;

  @ApiProperty({
    description: 'Thumbnail URL (S3, optimized)',
    example: 'https://s3.amazonaws.com/bucket/image-thumb.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @ApiProperty({
    description: 'Display order',
    example: 0,
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

/**
 * Update Gallery Image DTO
 */
export class UpdateGalleryImageDto {
  @ApiProperty({
    description: 'Image title',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Image description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Display order',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
