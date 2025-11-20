import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@classpoint/db';
import { Announcement, AnnouncementAudience, Prisma } from '@classpoint/db';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from './dto';
import { NotificationService, NotificationChannel } from '@classpoint/comms';

@Injectable()
export class AnnouncementService {
  private readonly logger = new Logger(AnnouncementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Create a new announcement
   */
  async create(tenantId: string, createAnnouncementDto: CreateAnnouncementDto): Promise<Announcement> {
    this.logger.log(`Creating announcement: ${createAnnouncementDto.title}`);

    // Validate class requirement
    if (createAnnouncementDto.audience === AnnouncementAudience.CLASS) {
      if (!createAnnouncementDto.classId) {
        throw new BadRequestException('Class ID is required for CLASS audience');
      }

      // Verify class exists and belongs to tenant
      const classEntity = await this.prisma.class.findFirst({
        where: { id: createAnnouncementDto.classId, tenantId },
      });

      if (!classEntity) throw new NotFoundException('Class not found');
    }

    const announcement = await this.prisma.announcement.create({
      data: {
        ...createAnnouncementDto,
        tenantId,
      },
      include: {
        creator: { select: { id: true, email: true, firstName: true, lastName: true } },
        class: true,
      },
    });

    this.logger.log(`Announcement created: ${announcement.id}`);

    // Send notifications if any channels are enabled
    // Fire and forget - don't wait for notifications to complete
    this.sendNotifications(announcement).catch((error) => {
      this.logger.error(`Failed to send notifications for announcement ${announcement.id}`, error);
    });

    return announcement;
  }

  /**
   * Get all announcements (with optional filters)
   */
  async findAll(
    tenantId: string,
    audience?: AnnouncementAudience,
    classId?: string,
    published?: boolean
  ) {
    const where: Prisma.AnnouncementWhereInput = { tenantId };

    if (audience) where.audience = audience;
    if (classId) where.classId = classId;
    if (published !== undefined) {
      if (published) {
        where.publishedAt = { not: null };
      } else {
        where.publishedAt = null;
      }
    }

    return this.prisma.announcement.findMany({
      where,
      include: {
        creator: { select: { id: true, email: true, firstName: true, lastName: true } },
        class: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get announcements for a specific class
   */
  async findByClass(tenantId: string, classId: string) {
    return this.prisma.announcement.findMany({
      where: {
        tenantId,
        OR: [
          { audience: AnnouncementAudience.SCHOOL_WIDE },
          { audience: AnnouncementAudience.CLASS, classId },
        ],
        publishedAt: { not: null }, // Only published
      },
      include: {
        creator: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { publishedAt: 'desc' },
    });
  }

  /**
   * Get school-wide announcements
   */
  async findSchoolWide(tenantId: string) {
    return this.prisma.announcement.findMany({
      where: {
        tenantId,
        audience: AnnouncementAudience.SCHOOL_WIDE,
        publishedAt: { not: null },
      },
      include: {
        creator: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { publishedAt: 'desc' },
    });
  }

  /**
   * Get a single announcement
   */
  async findOne(tenantId: string, id: string): Promise<Announcement> {
    const announcement = await this.prisma.announcement.findFirst({
      where: { id, tenantId },
      include: {
        creator: { select: { id: true, email: true, firstName: true, lastName: true } },
        class: { select: { id: true, name: true, code: true } },
      },
    });

    if (!announcement) throw new NotFoundException('Announcement not found');
    return announcement;
  }

  /**
   * Update an announcement
   */
  async update(tenantId: string, id: string, updateAnnouncementDto: UpdateAnnouncementDto): Promise<Announcement> {
    await this.findOne(tenantId, id); // Check existence

    // Validate class requirement if audience is being changed to CLASS
    if (updateAnnouncementDto.audience === AnnouncementAudience.CLASS) {
      if (!updateAnnouncementDto.classId) {
        throw new BadRequestException('Class ID is required for CLASS audience');
      }

      const classEntity = await this.prisma.class.findFirst({
        where: { id: updateAnnouncementDto.classId, tenantId },
      });

      if (!classEntity) throw new NotFoundException('Class not found');
    }

    const updated = await this.prisma.announcement.update({
      where: { id },
      data: updateAnnouncementDto,
      include: {
        creator: { select: { id: true, email: true, firstName: true, lastName: true } },
        class: { select: { id: true, name: true, code: true } },
      },
    });

    this.logger.log(`Announcement updated: ${id}`);
    return updated;
  }

  /**
   * Publish an announcement
   */
  async publish(tenantId: string, id: string): Promise<Announcement> {
    const announcement = await this.findOne(tenantId, id);

    if (announcement.publishedAt) {
      throw new BadRequestException('Announcement is already published');
    }

    const published = await this.prisma.announcement.update({
      where: { id },
      data: { publishedAt: new Date() },
      include: {
        creator: { select: { id: true, email: true, firstName: true, lastName: true } },
        class: { select: { id: true, name: true, code: true } },
      },
    });

    this.logger.log(`Announcement published: ${id}`);

    // Send notifications when published
    // Fire and forget - don't wait for notifications to complete
    this.sendNotifications(published).catch((error) => {
      this.logger.error(`Failed to send notifications for published announcement ${id}`, error);
    });

    return published;
  }

  /**
   * Unpublish an announcement
   */
  async unpublish(tenantId: string, id: string): Promise<Announcement> {
    const announcement = await this.findOne(tenantId, id);

    if (!announcement.publishedAt) {
      throw new BadRequestException('Announcement is not published');
    }

    const unpublished = await this.prisma.announcement.update({
      where: { id },
      data: { publishedAt: null },
      include: {
        creator: { select: { id: true, email: true, firstName: true, lastName: true } },
        class: { select: { id: true, name: true, code: true } },
      },
    });

    this.logger.log(`Announcement unpublished: ${id}`);
    return unpublished;
  }

  /**
   * Delete an announcement
   */
  async remove(tenantId: string, id: string): Promise<void> {
    await this.findOne(tenantId, id); // Check existence

    await this.prisma.announcement.delete({ where: { id } });
    this.logger.log(`Announcement deleted: ${id}`);
  }

  /**
   * Get announcement statistics
   */
  async getStatistics(tenantId: string) {
    const [total, published, byAudience, byChannel] = await Promise.all([
      this.prisma.announcement.count({ where: { tenantId } }),
      this.prisma.announcement.count({ where: { tenantId, publishedAt: { not: null } } }),
      this.prisma.announcement.groupBy({
        by: ['audience'],
        where: { tenantId },
        _count: true,
      }),
      this.prisma.announcement.aggregate({
        where: { tenantId },
        _count: {
          inApp: true,
          email: true,
          sms: true,
        },
      }),
    ]);

    return {
      total,
      published,
      draft: total - published,
      byAudience: byAudience.reduce((acc, item) => {
        acc[item.audience] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byChannel: {
        inApp: byChannel._count.inApp,
        email: byChannel._count.email,
        sms: byChannel._count.sms,
      },
    };
  }

  /**
   * Get recipients for an announcement based on audience
   */
  private async getRecipients(
    tenantId: string,
    audience: AnnouncementAudience,
    classId?: string,
  ) {
    const recipients: Array<{ email?: string; phone?: string; name?: string }> = [];

    switch (audience) {
      case AnnouncementAudience.SCHOOL_WIDE:
        // Get all users (staff) and households in the school
        const [users, households] = await Promise.all([
          this.prisma.user.findMany({
            where: { tenantId },
            select: { email: true, phone: true, firstName: true, lastName: true },
          }),
          this.prisma.householdMember.findMany({
            where: { household: { tenantId } },
            select: { email: true, phone: true, firstName: true, lastName: true },
          }),
        ]);

        recipients.push(
          ...users.map((u) => ({
            email: u.email || undefined,
            phone: u.phone || undefined,
            name: `${u.firstName} ${u.lastName}`,
          })),
          ...households.map((h) => ({
            email: h.email || undefined,
            phone: h.phone || undefined,
            name: `${h.firstName} ${h.lastName}`,
          })),
        );
        break;

      case AnnouncementAudience.CLASS:
        if (!classId) break;

        // Get students in the class and their households
        const enrollments = await this.prisma.enrollment.findMany({
          where: { classId, student: { tenantId } },
          include: {
            student: {
              include: {
                householdMembers: {
                  include: {
                    household: {
                      include: {
                        members: {
                          where: { relationshipType: 'PARENT' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });

        // Get parent/guardian contacts
        for (const enrollment of enrollments) {
          for (const hm of enrollment.student.householdMembers) {
            for (const parent of hm.household.members) {
              recipients.push({
                email: parent.email || undefined,
                phone: parent.phone || undefined,
                name: `${parent.firstName} ${parent.lastName}`,
              });
            }
          }
        }
        break;

      case AnnouncementAudience.CUSTOM_GROUP:
        // For custom groups, implement custom logic here
        // For now, send to all staff
        const staff = await this.prisma.user.findMany({
          where: { tenantId },
          select: { email: true, phone: true, firstName: true, lastName: true },
        });

        recipients.push(
          ...staff.map((s) => ({
            email: s.email || undefined,
            phone: s.phone || undefined,
            name: `${s.firstName} ${s.lastName}`,
          })),
        );
        break;
    }

    return recipients;
  }

  /**
   * Send notifications for an announcement
   */
  private async sendNotifications(announcement: Announcement) {
    try {
      // Determine which channels to use
      const channels: NotificationChannel[] = [];
      if (announcement.inApp) channels.push(NotificationChannel.IN_APP);
      if (announcement.email) channels.push(NotificationChannel.EMAIL);
      if (announcement.sms) channels.push(NotificationChannel.SMS);

      if (channels.length === 0) {
        this.logger.debug('No notification channels enabled for this announcement');
        return;
      }

      // Get recipients based on audience
      const recipients = await this.getRecipients(
        announcement.tenantId,
        announcement.audience,
        announcement.classId || undefined,
      );

      if (recipients.length === 0) {
        this.logger.warn('No recipients found for announcement');
        return;
      }

      this.logger.log(
        `Sending notifications to ${recipients.length} recipient(s) via ${channels.join(', ')}`,
      );

      // Send notifications
      const results = await this.notificationService.sendAnnouncementNotification({
        title: announcement.title,
        content: announcement.content,
        channels: channels.filter((c) => c !== NotificationChannel.IN_APP), // IN_APP handled separately
        recipients,
      });

      // Log results
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.length - successCount;

      this.logger.log(
        `Notification results: ${successCount} successful, ${failureCount} failed`,
      );

      if (failureCount > 0) {
        this.logger.warn(
          `Failed notifications: ${results.filter((r) => !r.success).map((r) => r.error).join(', ')}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to send notifications: ${(error as Error).message}`,
        (error as Error).stack,
      );
      // Don't throw - notification failures shouldn't break announcement creation
    }
  }
}
