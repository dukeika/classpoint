import { IsString, IsEmail, IsOptional, IsEnum, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({
    description: 'School name',
    example: 'Green Valley High School',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    description: 'Unique school code (alphanumeric, no spaces)',
    example: 'GVHS001',
    minLength: 3,
    maxLength: 20,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[A-Z0-9]+$/, {
    message: 'School code must be uppercase alphanumeric with no spaces',
  })
  code!: string;

  @ApiPropertyOptional({
    description: 'School email address',
    example: 'admin@greenvalley.edu',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'School phone number',
    example: '+27123456789',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'School address',
    example: '123 Education Street, Cape Town',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({
    description: 'School website URL',
    example: 'https://greenvalley.edu',
  })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({
    description: 'Plan ID for the school',
    example: 'clx1234567890',
  })
  @IsOptional()
  @IsString()
  planId?: string;
}
