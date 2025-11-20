import { IsString, IsNotEmpty, IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AnnouncementAudience } from '@classpoint/db';

export class CreateAnnouncementDto {
  @ApiProperty({ description: 'Announcement title' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ description: 'Announcement content' })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiProperty({
    description: 'Target audience',
    enum!: AnnouncementAudience,
    example!: AnnouncementAudience.SCHOOL_WIDE;
  })
  @IsEnum(AnnouncementAudience)
  audience!: AnnouncementAudience;

  @ApiProperty({ description: 'Class ID (required if audience is CLASS)', required: false })
  @IsOptional()
  @IsString()
  classId?: string;

  @ApiProperty({ description: 'Show in app', default: true })
  @IsOptional()
  @IsBoolean()
  inApp?: boolean;

  @ApiProperty({ description: 'Send via email', default: false })
  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @ApiProperty({ description: 'Send via SMS', default: false })
  @IsOptional()
  @IsBoolean()
  sms?: boolean;

  @ApiProperty({ description: 'User ID who created the announcement' })
  @IsString()
  @IsNotEmpty()
  createdBy!: string;
}
