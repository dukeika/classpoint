import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AnnouncementAudience } from '@classpoint/db';

export class UpdateAnnouncementDto {
  @ApiProperty({ description: 'Announcement title', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Announcement content', required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ description: 'Target audience', enum: AnnouncementAudience, required: false })
  @IsOptional()
  @IsEnum(AnnouncementAudience)
  audience?: AnnouncementAudience;

  @ApiProperty({ description: 'Class ID', required: false })
  @IsOptional()
  @IsString()
  classId?: string;

  @ApiProperty({ description: 'Show in app', required: false })
  @IsOptional()
  @IsBoolean()
  inApp?: boolean;

  @ApiProperty({ description: 'Send via email', required: false })
  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @ApiProperty({ description: 'Send via SMS', required: false })
  @IsOptional()
  @IsBoolean()
  sms?: boolean;
}
