import { Module } from '@nestjs/common';
import { PrismaModule } from '@classpoint/db';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';

/**
 * Comment Module
 *
 * Manages teacher, principal, and housemaster comments on student reports including:
 * - Comment creation (teacher, principal, housemaster)
 * - Comment retrieval by student/term/type
 * - Comment updates (only by author)
 * - Comment deletion (author or admin)
 * - Bulk comment creation
 * - Term statistics
 */
@Module({
  imports: [PrismaModule],
  controllers: [CommentController],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}
