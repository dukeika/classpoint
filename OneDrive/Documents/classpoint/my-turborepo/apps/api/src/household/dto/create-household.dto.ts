import { IsString, IsEmail, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHouseholdDto {
  @ApiProperty({
    description: 'Primary contact email for the household',
   ) example: 'parent@example.com'})
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Primary contact phone number',
   ) example: '+27123456789'})
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Household physical address',
   ) example: '123 Main Street, Cape Town, 8000'})
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;
}
