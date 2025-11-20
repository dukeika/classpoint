import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@classpoint/db';
import { ContactSubmission, ContactStatus, Prisma } from '@classpoint/db';
import { NotificationService, NotificationChannel } from '@classpoint/comms';
import { CreateContactDto, ContactResponseDto } from './dto';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Create a new contact submission (public endpoint)
   */
  async create(
    tenantId: string,
    createContactDto: CreateContactDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<ContactResponseDto> {
    this.logger.log(
      `Creating contact submission for tenant: ${tenantId}, from: ${createContactDto.email}`,
    );

    try {
      // Create the contact submission
      const submission = await this.prisma.contactSubmission.create({
        data: {
          tenantId,
          name: createContactDto.name,
          email: createContactDto.email,
          phone: createContactDto.phone,
          subject: createContactDto.subject,
          message: createContactDto.message,
          ipAddress,
          userAgent,
          status: 'NEW',
        },
      });

      // Send email notification to school
      await this.sendNotificationToSchool(tenantId, submission);

      // Send confirmation email to sender
      await this.sendConfirmationEmail(submission);

      this.logger.log(`Contact submission created: ${submission.id}`);
      return ContactResponseDto.fromEntity(submission);
    } catch (error) {
      this.logger.error(
        `Failed to create contact submission: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Get all contact submissions for a tenant (admin only)
   */
  async findAll(params?: {
    tenantId: string;
    skip?: number;
    take?: number;
    status?: ContactStatus;
    search?: string;
  }): Promise<{ data: ContactResponseDto[]; total: number }> {
    const { tenantId, skip = 0, take = 50, status, search } = params || {};

    const where: Prisma.ContactSubmissionWhereInput = {
      tenantId,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [submissions, total] = await Promise.all([
      this.prisma.contactSubmission.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contactSubmission.count({ where }),
    ]);

    return {
      data: submissions.map((s) => ContactResponseDto.fromEntity(s)),
      total,
    };
  }

  /**
   * Get a single contact submission by ID
   */
  async findOne(id: string, tenantId: string): Promise<ContactResponseDto> {
    const submission = await this.prisma.contactSubmission.findUnique({
      where: { id },
    });

    if (!submission || submission.tenantId !== tenantId) {
      throw new NotFoundException(`Contact submission with ID '${id}' not found`);
    }

    // Mark as read if it's NEW
    if (submission.status === 'NEW') {
      await this.markAsRead(id, tenantId);
      submission.status = 'READ';
    }

    return ContactResponseDto.fromEntity(submission);
  }

  /**
   * Mark submission as read
   */
  async markAsRead(id: string, tenantId: string): Promise<ContactResponseDto> {
    const submission = await this.prisma.contactSubmission.findUnique({
      where: { id },
    });

    if (!submission || submission.tenantId !== tenantId) {
      throw new NotFoundException(`Contact submission with ID '${id}' not found`);
    }

    const updated = await this.prisma.contactSubmission.update({
      where: { id },
      data: { status: 'READ' },
    });

    return ContactResponseDto.fromEntity(updated);
  }

  /**
   * Mark submission as replied
   */
  async markAsReplied(
    id: string,
    tenantId: string,
    repliedBy: string,
  ): Promise<ContactResponseDto> {
    const submission = await this.prisma.contactSubmission.findUnique({
      where: { id },
    });

    if (!submission || submission.tenantId !== tenantId) {
      throw new NotFoundException(`Contact submission with ID '${id}' not found`);
    }

    const updated = await this.prisma.contactSubmission.update({
      where: { id },
      data: {
        status: 'REPLIED',
        repliedAt: new Date(),
        repliedBy,
      },
    });

    return ContactResponseDto.fromEntity(updated);
  }

  /**
   * Close a submission
   */
  async close(id: string, tenantId: string): Promise<ContactResponseDto> {
    const submission = await this.prisma.contactSubmission.findUnique({
      where: { id },
    });

    if (!submission || submission.tenantId !== tenantId) {
      throw new NotFoundException(`Contact submission with ID '${id}' not found`);
    }

    const updated = await this.prisma.contactSubmission.update({
      where: { id },
      data: { status: 'CLOSED' },
    });

    return ContactResponseDto.fromEntity(updated);
  }

  /**
   * Delete a contact submission
   */
  async remove(id: string, tenantId: string): Promise<void> {
    const submission = await this.prisma.contactSubmission.findUnique({
      where: { id },
    });

    if (!submission || submission.tenantId !== tenantId) {
      throw new NotFoundException(`Contact submission with ID '${id}' not found`);
    }

    await this.prisma.contactSubmission.delete({
      where: { id },
    });

    this.logger.log(`Contact submission deleted: ${id}`);
  }

  /**
   * Get submission statistics for a tenant
   */
  async getStats(tenantId: string): Promise<{
    total: number;
    new: number;
    read: number;
    replied: number;
    closed: number;
    bySubject: Record<string, number>;
  }> {
    const [total, byStatus, bySubject] = await Promise.all([
      this.prisma.contactSubmission.count({ where: { tenantId } }),
      this.prisma.contactSubmission.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: true,
      }),
      this.prisma.contactSubmission.groupBy({
        by: ['subject'],
        where: { tenantId },
        _count: true,
      }),
    ]);

    const stats = {
      total,
      new: 0,
      read: 0,
      replied: 0,
      closed: 0,
      bySubject: {} as Record<string, number>,
    };

    byStatus.forEach((item) => {
      const status = item.status.toLowerCase();
      stats[status as 'new' | 'read' | 'replied' | 'closed'] = item._count;
    });

    bySubject.forEach((item) => {
      stats.bySubject[item.subject] = item._count;
    });

    return stats;
  }

  /**
   * Send email notification to school
   */
  private async sendNotificationToSchool(
    tenantId: string,
    submission: ContactSubmission,
  ): Promise<void> {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { schoolName: true, email: true },
      });

      if (!tenant?.email) {
        this.logger.warn(`No email configured for tenant: ${tenantId}`);
        return;
      }

      const subjectLabel = this.getSubjectLabel(submission.subject);

      await this.notificationService.send({
        channel: NotificationChannel.EMAIL,
        to: [tenant.email],
        subject: `New Contact Form Submission: ${subjectLabel}`,
        body: `
          <h2>New Contact Form Submission</h2>
          <p><strong>From:</strong> ${submission.name} (${submission.email})</p>
          ${submission.phone ? `<p><strong>Phone:</strong> ${submission.phone}</p>` : ''}
          <p><strong>Subject:</strong> ${subjectLabel}</p>
          <p><strong>Message:</strong></p>
          <p>${submission.message.replace(/\n/g, '<br>')}</p>
          <hr>
          <p><em>Submitted at: ${submission.createdAt.toLocaleString()}</em></p>
        `,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send notification to school: ${(error as Error).message}`,
      );
      // Don't throw - email failure shouldn't block submission
    }
  }

  /**
   * Send confirmation email to sender
   */
  private async sendConfirmationEmail(
    submission: ContactSubmission,
  ): Promise<void> {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: submission.tenantId },
        select: { schoolName: true },
      });

      if (!tenant) {
        return;
      }

      await this.notificationService.send({
        channel: NotificationChannel.EMAIL,
        to: [submission.email],
        subject: `Thank you for contacting ${tenant.schoolName}`,
        body: `
          <h2>Thank you for your message</h2>
          <p>Dear ${submission.name},</p>
          <p>We have received your message and will get back to you as soon as possible.</p>
          <p><strong>Your message:</strong></p>
          <p>${submission.message.replace(/\n/g, '<br>')}</p>
          <hr>
          <p>Best regards,<br>${tenant.schoolName}</p>
        `,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send confirmation email: ${(error as Error).message}`,
      );
      // Don't throw - email failure shouldn't block submission
    }
  }

  /**
   * Get human-readable subject label
   */
  private getSubjectLabel(subject: string): string {
    const labels: Record<string, string> = {
      ADMISSIONS: 'Admissions Inquiry',
      GENERAL: 'General Information',
      SUPPORT: 'Student Support',
      FEEDBACK: 'Feedback',
      OTHER: 'Other',
    };
    return labels[subject] || subject;
  }
}
