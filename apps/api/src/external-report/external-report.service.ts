import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@classpoint/db';
import { ExternalReport, Prisma } from '@classpoint/db';
import { CreateExternalReportDto, UpdateExternalReportDto, GeneratePresignedUrlDto, PresignedUrlAction } from './dto';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ExternalReportService {
  private readonly logger = new Logger(ExternalReportService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION') || 'us-east-1',
    });
    this.bucketName = this.configService.get('S3_REPORTS_BUCKET') || 'classpoint-reports';
  }

  /**
   * Generate presigned URL for upload or download
   */
  async generatePresignedUrl(tenantId: string, generatePresignedUrlDto: GeneratePresignedUrlDto) {
    const { studentId, termId, fileName, mimeType, action, fileSize } = generatePresignedUrlDto;

    // Verify student and term exist and belong to tenant
    const [student, term] = await Promise.all([
      this.prisma.student.findFirst({ where: { id: studentId, tenantId } }),
      this.prisma.term.findFirst({ where: { id: termId, tenantId } }),
    ]);

    if (!student) throw new NotFoundException('Student not found');
    if (!term) throw new NotFoundException('Term not found');

    // Validate file type
    const allowedMimeTypes = ['application/pdf', 'image/png', 'image/jpeg'];
    if (!allowedMimeTypes.includes(mimeType)) {
      throw new BadRequestException('Only PDF and image files are allowed');
    }

    // Generate S3 key
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const s3Key = `reports/${tenantId}/${termId}/${studentId}/${timestamp}_${sanitizedFileName}`;

    let command;
    if (action === PresignedUrlAction.UPLOAD) {
      command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        ContentType: mimeType,
      });
    } else {
      command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });
    }

    const presignedUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 }); // 1 hour

    this.logger.log(`Generated presigned URL for ${action}: ${s3Key}`);

    return {
      presignedUrl,
      s3Key,
      expiresIn: 3600,
    };
  }

  /**
   * Create external report record after successful upload
   */
  async create(tenantId: string, createExternalReportDto: CreateExternalReportDto): Promise<ExternalReport> {
    this.logger.log(`Creating external report for student: ${createExternalReportDto.studentId}`);

    // Verify student and term exist and belong to tenant
    const [student, term] = await Promise.all([
      this.prisma.student.findFirst({ where: { id: createExternalReportDto.studentId, tenantId } }),
      this.prisma.term.findFirst({ where: { id: createExternalReportDto.termId, tenantId } }),
    ]);

    if (!student) throw new NotFoundException('Student not found');
    if (!term) throw new NotFoundException('Term not found');

    const externalReport = await this.prisma.externalReport.create({
      data: {
        ...createExternalReportDto,
        tenantId,
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
        term: { select: { id: true, name: true } },
      },
    });

    this.logger.log(`External report created: ${externalReport.id}`);
    return externalReport;
  }

  /**
   * Get all external reports for a student
   */
  async findByStudent(tenantId: string, studentId: string, termId?: string) {
    const where: Prisma.ExternalReportWhereInput = { tenantId, studentId };
    if (termId) where.termId = termId;

    return this.prisma.externalReport.findMany({
      where,
      include: {
        term: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all external reports for a term
   */
  async findByTerm(tenantId: string, termId: string) {
    return this.prisma.externalReport.findMany({
      where: { tenantId, termId },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
      },
      orderBy: [{ student: { lastName: 'asc' } }, { createdAt: 'desc' }],
    });
  }

  /**
   * Get a single external report
   */
  async findOne(tenantId: string, id: string): Promise<ExternalReport> {
    const externalReport = await this.prisma.externalReport.findFirst({
      where: { id, tenantId },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
        term: { select: { id: true, name: true } },
      },
    });

    if (!externalReport) throw new NotFoundException('External report not found');
    return externalReport;
  }

  /**
   * Generate download URL for an existing report
   */
  async getDownloadUrl(tenantId: string, id: string) {
    const externalReport = await this.findOne(tenantId, id);

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: externalReport.s3Key,
    });

    const downloadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });

    this.logger.log(`Generated download URL for report: ${id}`);

    return {
      downloadUrl,
      expiresIn: 3600,
      fileName: externalReport.name,
      mimeType: externalReport.mimeType,
      fileSize: externalReport.fileSize,
    };
  }

  /**
   * Update external report metadata
   */
  async update(tenantId: string, id: string, updateExternalReportDto: UpdateExternalReportDto): Promise<ExternalReport> {
    await this.findOne(tenantId, id); // Check existence

    const updated = await this.prisma.externalReport.update({
      where: { id },
      data: updateExternalReportDto,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
        term: { select: { id: true, name: true } },
      },
    });

    this.logger.log(`External report updated: ${id}`);
    return updated;
  }

  /**
   * Delete external report and S3 file
   */
  async remove(tenantId: string, id: string): Promise<void> {
    const externalReport = await this.findOne(tenantId, id);

    // Delete from S3
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: externalReport.s3Key,
      });
      await this.s3Client.send(deleteCommand);
      this.logger.log(`Deleted S3 object: ${externalReport.s3Key}`);
    } catch (error) {
      this.logger.error(`Failed to delete S3 object: ${(error as Error).message}`, (error as Error).stack);
      // Continue with database deletion even if S3 deletion fails
    }

    // Delete from database
    await this.prisma.externalReport.delete({ where: { id } });
    this.logger.log(`External report deleted: ${id}`);
  }

  /**
   * Get statistics for external reports
   */
  async getStatistics(tenantId: string, termId?: string) {
    const where: Prisma.ExternalReportWhereInput = { tenantId };
    if (termId) where.termId = termId;

    const [total, totalSize] = await Promise.all([
      this.prisma.externalReport.count({ where }),
      this.prisma.externalReport.aggregate({
        where,
        _sum: { fileSize: true },
      }),
    ]);

    return {
      total,
      totalSizeBytes: totalSize._sum.fileSize || 0,
      totalSizeMB: Math.round((totalSize._sum.fileSize || 0) / (1024 * 1024) * 100) / 100,
    };
  }
}
