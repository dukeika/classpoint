import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CommentService } from './comment.service';
import { CreateCommentDto, UpdateCommentDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';
import { UserRole } from '@classpoint/db';

@ApiTags('Comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Create a comment' })
  @ApiResponse({ status: 201, description: 'Comment created' })
  create(@Body() createCommentDto: CreateCommentDto) {
    return this.commentService.create(createCommentDto);
  }

  @Post('bulk')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Bulk create comments for multiple students' })
  @ApiResponse({ status: 201, description: 'Comments created' })
  bulkCreate(
    @Body() body: {
      termId: string;
      studentIds: string[];
      authorId: string;
      type: string;
      text: string;
    }
  ) {
    return this.commentService.bulkCreate(
      body.termId,
      body.studentIds,
      body.authorId,
      body.type,
      body.text
    );
  }

  @Get('student/:studentId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get all comments for a student' })
  @ApiResponse({ status: 200, description: 'Comments retrieved' })
  findByStudent(@Param('studentId') studentId: string, @Query('termId') termId?: string) {
    return this.commentService.findByStudent(studentId, termId);
  }

  @Get('student/:studentId/type/:type')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT)
  @ApiOperation({ summary: 'Get comments by type for a student' })
  @ApiResponse({ status: 200, description: 'Comments retrieved' })
  findByType(
    @Param('studentId') studentId: string,
    @Query('termId') termId: string,
    @Param('type') type: string
  ) {
    return this.commentService.findByType(studentId, termId, type);
  }

  @Get('term/:termId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all comments for a term' })
  @ApiResponse({ status: 200, description: 'Comments retrieved' })
  findByTerm(@Param('termId') termId: string, @Query('type') type?: string) {
    return this.commentService.findByTerm(termId, type);
  }

  @Get('term/:termId/statistics')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get comment statistics for a term' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  getTermStatistics(@Param('termId') termId: string) {
    return this.commentService.getTermStatistics(termId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT)
  @ApiOperation({ summary: 'Get a comment by ID' })
  @ApiResponse({ status: 200, description: 'Comment retrieved' })
  findOne(@Param('id') id: string) {
    return this.commentService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Update a comment' })
  @ApiResponse({ status: 200, description: 'Comment updated' })
  update(@Param('id') id: string, @Req() req: any, @Body() updateCommentDto: UpdateCommentDto) {
    const userId = req.user.id;
    return this.commentService.update(id, userId, updateCommentDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiResponse({ status: 200, description: 'Comment deleted' })
  remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    const isAdmin = [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN].includes(req.user.role);
    return this.commentService.remove(id, userId, isAdmin);
  }
}
