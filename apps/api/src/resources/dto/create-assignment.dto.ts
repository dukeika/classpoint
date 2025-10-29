import { IsString, IsOptional, IsDateString, IsNumber, IsArray, IsEnum } from 'class-validator';

export enum AssignmentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CLOSED = 'CLOSED',
}

export class CreateAssignmentDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsString()
  classId!: string;

  @IsString()
  subjectId!: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsNumber()
  maxScore?: number;

  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}
