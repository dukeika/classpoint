import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@classpoint/db';
import { AssignmentService } from './assignment.service';
import { ResourceService } from './resource.service';
import { StorageService } from './storage.service';
import { AssignmentController } from './assignment.controller';
import { ResourceController } from './resource.controller';

/**
 * Resource Management Module
 *
 * Provides comprehensive resource and assignment management for:
 * - Assignment creation, publishing, and submission
 * - Student submission and teacher grading
 * - Resource library with file uploads (documents, videos, links, images)
 * - S3 integration for secure file storage
 * - Storage management and statistics
 *
 * All endpoints are protected with RBAC and tenant isolation.
 */
@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [AssignmentController, ResourceController],
  providers: [AssignmentService, ResourceService, StorageService],
  exports: [AssignmentService, ResourceService, StorageService],
})
export class ResourcesModule {}
