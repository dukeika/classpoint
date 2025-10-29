import { IsEnum, IsString, IsBoolean, IsOptional } from 'class-validator';
import { ExportEntity } from './export.dto';

export class ImportDto {
  @IsEnum(ExportEntity)
  entity!: ExportEntity;

  @IsString()
  fileData!: string; // Base64 encoded CSV data

  @IsOptional()
  @IsBoolean()
  dryRun?: boolean; // Test import without saving

  @IsOptional()
  @IsBoolean()
  skipErrors?: boolean; // Continue on errors
}

export class ImportResultDto {
  success!: number;
  failed!: number;
  skipped!: number;
  errors!: { row: number; error: string }[];
  dryRun!: boolean;
}
