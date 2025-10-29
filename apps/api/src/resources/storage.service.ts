import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION') || 'af-south-1',
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID')!,
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY')!,
      },
    });

    this.bucketName = this.configService.get<string>('S3_BUCKET_NAME') || 'classpoint-resources';
  }

  /**
   * Generate presigned URL for file upload
   */
  async generateUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600
  ): Promise<{ uploadUrl: string; key: string }> {
    this.logger.log(`Generating upload URL for key: ${key}`);

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      return { uploadUrl, key };
    } catch (error) {
      this.logger.error(
        `Failed to generate upload URL: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  /**
   * Generate presigned URL for file download
   */
  async generateDownloadUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    this.logger.log(`Generating download URL for key: ${key}`);

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const downloadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      return downloadUrl;
    } catch (error) {
      this.logger.error(
        `Failed to generate download URL: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key: string): Promise<void> {
    this.logger.log(`Deleting file from S3: ${key}`);

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete file: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  /**
   * Generate S3 key for resource
   */
  generateKey(
    tenantId: string,
    resourceType: string,
    fileName: string
  ): string {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${tenantId}/${resourceType}/${timestamp}-${sanitizedFileName}`;
  }
}
