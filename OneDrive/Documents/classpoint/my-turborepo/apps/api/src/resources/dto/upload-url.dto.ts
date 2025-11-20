import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ResourceType } from './create-resource.dto';

export class GenerateUploadUrlDto {
  @IsString()
  fileName!: string;

  @IsString()
  contentType!: string;

  @IsNumber()
  fileSize!: number;

  @IsEnum(ResourceType)
  resourceType!: ResourceType;

  @IsOptional()
  @IsString()
  subjectId?: string;

  @IsOptional()
  @IsString()
  classId?: string;
}

export class GenerateUploadUrlResponseDto {
  uploadUrl!: string;
  key!: string;
  expiresIn!: number;
}
