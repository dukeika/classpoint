import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export enum ContactSubject {
  ADMISSIONS = 'ADMISSIONS',
  GENERAL = 'GENERAL',
  SUPPORT = 'SUPPORT',
  FEEDBACK = 'FEEDBACK',
  OTHER = 'OTHER',
}

export class CreateContactDto {
  @ApiProperty({ description: 'Full name of the sender' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ description: 'Email address of the sender' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ description: 'Phone number of the sender', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({
    description: 'Subject/category of the inquiry',
    enum!: ContactSubject,
  })
  @IsEnum(ContactSubject)
  @IsNotEmpty()
  subject!: ContactSubject;

  @ApiProperty({ description: 'Message content' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  message!: string;
}
