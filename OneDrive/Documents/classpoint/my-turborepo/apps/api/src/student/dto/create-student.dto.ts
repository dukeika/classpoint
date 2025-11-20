import { IsString, IsEmail, IsOptional, IsEnum, IsDateString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@classpoint/db';

export class CreateStudentDto {
  @ApiProperty({
    description: 'Student first name',
    example: 'John',
    minLength: 2,
   ) maxLength: 100})
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({
    description: 'Student last name',
    example: 'Doe',
    minLength: 2,
   ) maxLength: 100})
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({
    description: 'Student middle name',
    example: 'Michael',
   ) maxLength: 100})
  @IsOptional()
  @IsString()
  @MaxLength(100)
  middleName?: string;

  @ApiProperty({
    description: 'Student date of birth',
   ) example: '2010-01-15'})
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({
    description: 'Student gender',
    enum: Gender,
   ) example: Gender.MALE})
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional({
    description: 'Student email address',
   ) example: 'john.doe@student.example.com'})
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Student phone number',
    example: '+27123456789',
   ) maxLength: 20})
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Household ID if student belongs to a household',
   ) example: 'clxxx-xxxx-xxxx-xxxx'})
  @IsOptional()
  @IsString()
  householdId?: string;
}
