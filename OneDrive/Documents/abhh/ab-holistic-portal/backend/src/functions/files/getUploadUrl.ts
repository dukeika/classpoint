import { APIGatewayProxyHandler } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { successResponse, errorResponse, validationErrorResponse, forbiddenResponse } from '../../utils/response';
import { validateSchema, fileSchemas } from '../../utils/validation';
import { DatabaseService } from '../../services/database';
import { FileType } from '../../types';
import { Logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const logger = new Logger('GetUploadUrlFunction');
const s3Client = new S3Client({
  region: process.env.REGION || 'us-west-1'
});
const dbService = DatabaseService.getInstance();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    logger.info('Processing file upload URL request');

    // Extract user context from authorizer
    const userContext = event.requestContext.authorizer;
    if (!userContext || !userContext.userId) {
      return forbiddenResponse('Authorization required to upload files');
    }

    // Parse and validate request body
    const body = JSON.parse(event.body || '{}');
    const validatedData = validateSchema(fileSchemas.uploadUrl, body);
    const { fileName, fileType, fileSize, context } = validatedData;

    // Generate unique file key
    const fileExtension = getFileExtension(fileName);
    const sanitizedFileName = sanitizeFileName(fileName);
    const uniqueKey = generateFileKey(context, userContext.userId, sanitizedFileName, fileExtension);

    // Determine S3 bucket based on context
    const bucketName = getBucketName(context);
    if (!bucketName) {
      return errorResponse(
        {
          code: 'INVALID_FILE_CONTEXT',
          message: 'Invalid file context provided',
        },
        400
      );
    }

    // Generate presigned URL for upload
    const uploadUrl = await generatePresignedUploadUrl(
      bucketName,
      uniqueKey,
      fileType,
      fileSize
    );

    // Create file metadata record
    const fileId = dbService.generateId();
    const fileMetadata = await createFileMetadata({
      fileId,
      originalName: fileName,
      fileName: uniqueKey,
      fileType: context as FileType,
      mimeType: fileType,
      size: fileSize,
      uploadedBy: userContext.userId,
      bucketName,
      associatedEntityId: validatedData.associatedEntityId,
      associatedEntityType: validatedData.associatedEntityType
    });

    logger.info('File upload URL generated successfully', {
      fileId,
      fileName,
      fileType,
      context,
      userId: userContext.userId
    });

    return successResponse({
      uploadUrl,
      fileId,
      fileName: uniqueKey,
      expiresIn: 3600, // 1 hour
      maxFileSize: 100 * 1024 * 1024, // 100MB
      allowedTypes: getAllowedMimeTypes(context)
    }, 'Upload URL generated successfully');

  } catch (error) {
    logger.error('File upload URL generation error:', error as Record<string, unknown>);

    if (error instanceof Error) {
      if (error.name === 'ValidationError') {
        return validationErrorResponse(error.message, (error as any).details);
      }
    }

    return errorResponse(
      {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while generating upload URL',
      },
      500
    );
  }
};

/**
 * Generate presigned URL for S3 upload
 */
async function generatePresignedUploadUrl(
  bucketName: string,
  key: string,
  contentType: string,
  contentLength: number
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
    ServerSideEncryption: 'AES256',
    Metadata: {
      uploadedAt: new Date().toISOString()
    }
  });

  const signedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 3600 // 1 hour
  });

  return signedUrl;
}

/**
 * Create file metadata record in database
 */
async function createFileMetadata(metadata: {
  fileId: string;
  originalName: string;
  fileName: string;
  fileType: FileType;
  mimeType: string;
  size: number;
  uploadedBy: string;
  bucketName: string;
  associatedEntityId?: string;
  associatedEntityType?: string;
}) {
  const now = dbService.getTimestamp();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

  const fileRecord = {
    fileId: metadata.fileId,
    originalName: metadata.originalName,
    fileName: metadata.fileName,
    fileType: metadata.fileType,
    mimeType: metadata.mimeType,
    size: metadata.size,
    uploadedBy: metadata.uploadedBy,
    uploadedAt: now,
    url: `https://${metadata.bucketName}.s3.${process.env.REGION}.amazonaws.com/${metadata.fileName}`,
    expiresAt,
    isPublic: false,
    associatedEntityId: metadata.associatedEntityId,
    associatedEntityType: metadata.associatedEntityType,
    virusScanStatus: 'pending',
    createdAt: now,
    updatedAt: now,
    EntityType: 'FileMetadata'
  };

  // Store in a files table (would need to be added to serverless.yml)
  // For now, we'll skip database storage and just return the metadata
  return fileRecord;
}

/**
 * Get S3 bucket name based on file context
 */
function getBucketName(context: string): string | null {
  switch (context) {
    case 'resume':
      return process.env.S3_BUCKET_RESUMES || null;
    case 'video':
      return process.env.S3_BUCKET_VIDEOS || null;
    case 'other':
      return process.env.S3_BUCKET_RESUMES || null; // Use resumes bucket for other files
    default:
      return null;
  }
}

/**
 * Generate unique file key for S3
 */
function generateFileKey(context: string, userId: string, fileName: string, extension: string): string {
  const timestamp = Date.now();
  const randomId = uuidv4().substr(0, 8);
  return `${context}/${userId}/${timestamp}-${randomId}-${fileName}.${extension}`;
}

/**
 * Extract file extension from filename
 */
function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) return '';
  return fileName.substring(lastDot + 1).toLowerCase();
}

/**
 * Sanitize filename for safe storage
 */
function sanitizeFileName(fileName: string): string {
  // Remove extension and sanitize
  const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
  return nameWithoutExt
    .replace(/[^a-zA-Z0-9.-_]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 100); // Limit length
}

/**
 * Get allowed MIME types for context
 */
function getAllowedMimeTypes(context: string): string[] {
  switch (context) {
    case 'resume':
      return [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
    case 'video':
      return [
        'video/webm',
        'video/mp4',
        'video/quicktime'
      ];
    case 'other':
      return [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/gif'
      ];
    default:
      return [];
  }
}
