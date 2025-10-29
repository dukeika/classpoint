import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator';

export class CreateSubmissionDto {
  @IsString()
  assignmentId!: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}

export class GradeSubmissionDto {
  @IsNumber()
  score!: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}
