import { IsString, IsNotEmpty, IsNumber, IsPositive, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PresignedUrlAction {
  UPLOAD = 'upload',
  DOWNLOAD = 'download',
}

export class GeneratePresignedUrlDto {
  @ApiProperty({ description: 'Student ID' })
  @IsString()
  @IsNotEmpty()
  studentId!: string;

  @ApiProperty({ description: 'Term ID' })
  @IsString()
  @IsNotEmpty()
  termId!: string;

  @ApiProperty({ description: 'File name' })
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @ApiProperty({ description: 'File MIME type', example: 'application/pdf' })
  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @ApiProperty({ description: 'Action type', enum: PresignedUrlAction })
  @IsEnum(PresignedUrlAction)
  action!: PresignedUrlAction;

  @ApiProperty({ description: 'File size in bytes (for upload)', required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  fileSize?: number;
}
