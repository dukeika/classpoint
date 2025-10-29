import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@classpoint/db';
import { Reminder, Prisma } from '@classpoint/db';
import { CreateReminderDto, BulkCreateReminderDto, ReminderType } from './dto';

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a reminder for an event
   */
  async create(
    userId: string,
    createReminderDto: CreateReminderDto
  ): Promise<Reminder> {
    this.logger.log(`Creating reminder for user: ${userId}`);

    // Verify event exists
    const event = await this.prisma.event.findUnique({
      where: { id: createReminderDto.eventId },
    });

    if (!event) {
      throw new NotFoundException(
        `Event with ID '${createReminderDto.eventId}' not found`
      );
    }

    // Check if event has already passed
    if (event.startTime < new Date()) {
      throw new BadRequestException('Cannot create reminder for past events');
    }

    // Check if reminder time would be in the past
    const reminderTime = new Date(
      event.startTime.getTime() - createReminderDto.minutesBefore * 60000
    );

    if (reminderTime < new Date()) {
      throw new BadRequestException(
        'Reminder time would be in the past. Choose fewer minutes or create for a future event.'
      );
    }

    // Check for duplicate
    const existing = await this.prisma.reminder.findFirst({
      where: {
        eventId: createReminderDto.eventId,
        userId,
        type: createReminderDto.type,
        minutesBefore: createReminderDto.minutesBefore,
      },
    });

    if (existing) {
      throw new BadRequestException('Reminder already exists');
    }

    try {
      const reminder = await this.prisma.reminder.create({
        data: {
          eventId: createReminderDto.eventId,
          userId,
          type: createReminderDto.type,
          minutesBefore: createReminderDto.minutesBefore,
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              startTime: true,
              location: true,
            },
          },
        },
      });

      this.logger.log(`Reminder created successfully: ${reminder.id}`);
      return reminder;
    } catch (error) {
      this.logger.error(
        `Failed to create reminder: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  /**
   * Create multiple reminders at once
   */
  async createBulk(
    userId: string,
    bulkCreateDto: BulkCreateReminderDto
  ): Promise<Reminder[]> {
    this.logger.log(`Creating bulk reminders for user: ${userId}`);

    const reminders: Reminder[] = [];

    for (const type of bulkCreateDto.types) {
      try {
        const reminder = await this.create(userId, {
          eventId: bulkCreateDto.eventId,
          type,
          minutesBefore: bulkCreateDto.minutesBefore,
        });
        reminders.push(reminder);
      } catch (error) {
        this.logger.warn(
          `Failed to create ${type} reminder: ${(error as Error).message}`
        );
        // Continue with other types even if one fails
      }
    }

    return reminders;
  }

  /**
   * Get user's reminders
   */
  async findByUser(
    userId: string,
    params?: {
      skip?: number;
      take?: number;
      upcomingOnly?: boolean;
    }
  ): Promise<{ data: Reminder[]; total: number }> {
    const { skip = 0, take = 50, upcomingOnly = false } = params || {};

    const where: Prisma.ReminderWhereInput = { userId };

    if (upcomingOnly) {
      where.isSent = false;
      where.event = {
        startTime: { gte: new Date() },
      };
    }

    const [reminders, total] = await Promise.all([
      this.prisma.reminder.findMany({
        where,
        skip,
        take,
        include: {
          event: {
            select: {
              id: true,
              title: true,
              startTime: true,
              endTime: true,
              location: true,
            },
          },
        },
        orderBy: [{ isSent: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.reminder.count({ where }),
    ]);

    return { data: reminders, total };
  }

  /**
   * Get reminders for an event
   */
  async findByEvent(eventId: string): Promise<Reminder[]> {
    return this.prisma.reminder.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  /**
   * Delete a reminder
   */
  async remove(userId: string, id: string): Promise<void> {
    this.logger.log(`Deleting reminder: ${id}`);

    const reminder = await this.prisma.reminder.findFirst({
      where: { id, userId },
    });

    if (!reminder) {
      throw new NotFoundException('Reminder not found');
    }

    if (reminder.isSent) {
      throw new BadRequestException('Cannot delete sent reminders');
    }

    try {
      await this.prisma.reminder.delete({
        where: { id },
      });

      this.logger.log(`Reminder deleted successfully: ${id}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete reminder: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  /**
   * Get pending reminders that need to be sent
   * This method would be called by a scheduled job
   */
  async getPendingReminders(): Promise<Reminder[]> {
    const now = new Date();

    // Get reminders that haven't been sent and whose reminder time has passed
    const reminders = await this.prisma.reminder.findMany({
      where: {
        isSent: false,
        event: {
          startTime: { gte: now }, // Event hasn't started yet
        },
      },
      include: {
        event: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // Filter reminders whose time has come
    return reminders.filter((reminder) => {
      const reminderTime = new Date(
        reminder.event.startTime.getTime() - reminder.minutesBefore * 60000
      );
      return reminderTime <= now;
    });
  }

  /**
   * Mark reminder as sent
   * This would be called after successfully sending a notification
   */
  async markAsSent(id: string): Promise<Reminder> {
    return this.prisma.reminder.update({
      where: { id },
      data: {
        isSent: true,
        sentAt: new Date(),
      },
    });
  }

  /**
   * Process pending reminders and send notifications
   * This should be called by a scheduled job every minute
   */
  async processPendingReminders(): Promise<{
    processed: number;
    sent: number;
    failed: number;
  }> {
    this.logger.log('Processing pending reminders...');

    const pendingReminders = await this.getPendingReminders();
    let sent = 0;
    let failed = 0;

    for (const reminder of pendingReminders) {
      try {
        // Here you would integrate with NotificationService
        // For now, we'll just mark as sent
        await this.markAsSent(reminder.id);
        sent++;

        this.logger.log(
          `Sent ${reminder.type} reminder to ${reminder.user.email} for event: ${reminder.event.title}`
        );

        // TODO: Integrate with NotificationService
        // await this.notificationService.sendReminderNotification(reminder);
      } catch (error) {
        failed++;
        this.logger.error(
          `Failed to send reminder ${reminder.id}: ${(error as Error).message}`
        );
      }
    }

    this.logger.log(
      `Processed ${pendingReminders.length} reminders: ${sent} sent, ${failed} failed`
    );

    return {
      processed: pendingReminders.length,
      sent,
      failed,
    };
  }

  /**
   * Get reminder statistics
   */
  async getStats(userId: string) {
    const [total, pending, sent] = await Promise.all([
      this.prisma.reminder.count({ where: { userId } }),
      this.prisma.reminder.count({
        where: {
          userId,
          isSent: false,
          event: { startTime: { gte: new Date() } },
        },
      }),
      this.prisma.reminder.count({
        where: {
          userId,
          isSent: true,
        },
      }),
    ]);

    return {
      total,
      pending,
      sent,
      expired: total - pending - sent,
    };
  }
}
