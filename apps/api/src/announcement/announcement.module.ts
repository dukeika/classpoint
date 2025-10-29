import { Module } from '@nestjs/common';
import { PrismaModule } from '@classpoint/db';
import { NotificationService } from '@classpoint/comms';
import { AnnouncementService } from './announcement.service';
import { AnnouncementController } from './announcement.controller';

/**
 * Announcement Module
 *
 * Manages school-wide and class-specific announcements including:
 * - Announcement creation (school-wide, class, custom group)
 * - Multi-channel delivery (in-app, email, SMS via AWS SES/SNS)
 * - Publishing workflow (draft → published)
 * - Audience targeting
 * - Announcement statistics
 */
@Module({
  imports: [PrismaModule],
  controllers: [AnnouncementController],
  providers: [AnnouncementService, NotificationService],
  exports: [AnnouncementService],
})
export class AnnouncementModule {}
