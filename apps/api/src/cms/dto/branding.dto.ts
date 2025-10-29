import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, IsHexColor } from 'class-validator';

/**
 * Create/Update School Branding DTO
 */
export class UpdateBrandingDto {
  @ApiProperty({
    description: 'Primary brand color (hex)',
    example: '#1e40af',
    required: false,
  })
  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @ApiProperty({
    description: 'Secondary brand color (hex)',
    example: '#64748b',
    required: false,
  })
  @IsOptional()
  @IsHexColor()
  secondaryColor?: string;

  @ApiProperty({
    description: 'Accent brand color (hex)',
    example: '#f59e0b',
    required: false,
  })
  @IsOptional()
  @IsHexColor()
  accentColor?: string;

  @ApiProperty({
    description: 'Logo URL (S3)',
    example: 'https://s3.amazonaws.com/bucket/logo.png',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiProperty({
    description: 'Favicon URL (S3)',
    example: 'https://s3.amazonaws.com/bucket/favicon.ico',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  faviconUrl?: string;

  @ApiProperty({
    description: 'Banner image URL (S3)',
    example: 'https://s3.amazonaws.com/bucket/banner.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  bannerUrl?: string;

  @ApiProperty({
    description: 'Custom domain for school site',
    example: 'www.myschool.com',
    required: false,
  })
  @IsOptional()
  @IsString()
  customDomain?: string;

  @ApiProperty({
    description: 'SEO meta title',
    example: 'Welcome to St. Michael School',
    required: false,
  })
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiProperty({
    description: 'SEO meta description',
    example: 'A leading school in Lagos providing quality education',
    required: false,
  })
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiProperty({
    description: 'SEO meta keywords',
    example: 'school, education, Lagos, Nigeria',
    required: false,
  })
  @IsOptional()
  @IsString()
  metaKeywords?: string;

  @ApiProperty({
    description: 'Facebook profile URL',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  facebookUrl?: string;

  @ApiProperty({
    description: 'Twitter profile URL',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  twitterUrl?: string;

  @ApiProperty({
    description: 'Instagram profile URL',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  instagramUrl?: string;

  @ApiProperty({
    description: 'LinkedIn profile URL',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  linkedinUrl?: string;

  @ApiProperty({
    description: 'About text (rich text/HTML)',
    required: false,
  })
  @IsOptional()
  @IsString()
  aboutText?: string;

  @ApiProperty({
    description: 'Mission statement',
    required: false,
  })
  @IsOptional()
  @IsString()
  missionText?: string;

  @ApiProperty({
    description: 'Vision statement',
    required: false,
  })
  @IsOptional()
  @IsString()
  visionText?: string;
}
