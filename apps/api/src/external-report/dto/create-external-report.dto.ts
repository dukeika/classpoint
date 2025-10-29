import { IsString, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExternalReportDto {
  @ApiProperty({ description: 'Student ID' })
  @IsString()
  @IsNotEmpty()
  studentId!: string;

  @ApiProperty({ description: 'Term ID' })
  @IsString()
  @IsNotEmpty()
  termId!: string;

  @ApiProperty({ description: 'Report name/title' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'S3 object key for the uploaded file' })
  @IsString()
  @IsNotEmpty()
  s3Key!: string;

  @ApiProperty({ description: 'File MIME type', example: 'application/pdf' })
  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @ApiProperty({ description: 'File size in bytes' })
  @IsNumber()
  @IsPositive()
  fileSize!: number;

  @ApiProperty({ description: 'User ID who uploaded the report' })
  @IsString()
  @IsNotEmpty()
  uploadedBy!: string;
}
