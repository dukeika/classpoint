import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean } from 'class-validator';

export enum ResourceType {
  DOCUMENT = 'DOCUMENT',
  VIDEO = 'VIDEO',
  LINK = 'LINK',
  IMAGE = 'IMAGE',
  OTHER = 'OTHER',
}

export class CreateResourceDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsEnum(ResourceType)
  type!: ResourceType;

  @IsString()
  url!: string;

  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsString()
  subjectId?: string;

  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
