import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateExternalReportDto {
  @ApiProperty({ description: 'Report name/title', required: false })
  @IsOptional()
  @IsString()
  name?: string;
}
