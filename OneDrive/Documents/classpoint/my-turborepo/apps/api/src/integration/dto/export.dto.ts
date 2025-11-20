import { IsEnum, IsOptional, IsDateString, IsString } from 'class-validator';

export enum ExportFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  JSON = 'json',
}

export enum ExportEntity {
  STUDENTS = 'students',
  STAFF = 'staff',
  CLASSES = 'classes',
  ENROLLMENTS = 'enrollments',
  ATTENDANCE = 'attendance',
  GRADES = 'grades',
  FEE_STATUS = 'fee_status',
  EVENTS = 'events',
}

export class ExportQueryDto {
  @IsEnum(ExportEntity)
  entity!: ExportEntity;

  @IsEnum(ExportFormat)
  format!: ExportFormat;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  termId?: string;

  @IsOptional()
  @IsString()
  classId?: string;
}
