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
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import {
  CreateAssignmentDto,
  UpdateAssignmentDto,
  CreateSubmissionDto,
  GradeSubmissionDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, AssignmentStatus } from '@classpoint/db';

@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentController {
  private readonly logger = new Logger(AssignmentController.name);

  constructor(private readonly assignmentService: AssignmentService) {}

  /**
   * Create a new assignment
   * POST /assignments
   */
  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async create(
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() createAssignmentDto: CreateAssignmentDto
  ) {
    this.logger.log(`Creating assignment for tenant: ${tenantId}`);
    return this.assignmentService.create(tenantId, userId, createAssignmentDto);
  }

  /**
   * Get all assignments
   * GET /assignments
   */
  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async findAll(
    @TenantId() tenantId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('classId') classId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('status') status?: AssignmentStatus
  ) {
    return this.assignmentService.findAll(tenantId, {
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      classId,
      subjectId,
      status,
    });
  }

  /**
   * Get a single assignment
   * GET /assignments/:id
   */
  @Get(':id')
  async findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.assignmentService.findOne(tenantId, id);
  }

  /**
   * Update an assignment
   * PATCH /assignments/:id
   */
  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateAssignmentDto: UpdateAssignmentDto
  ) {
    return this.assignmentService.update(tenantId, id, userId, updateAssignmentDto);
  }

  /**
   * Publish an assignment
   * PATCH /assignments/:id/publish
   */
  @Patch(':id/publish')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async publish(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    return this.assignmentService.publish(tenantId, id, userId);
  }

  /**
   * Close an assignment
   * PATCH /assignments/:id/close
   */
  @Patch(':id/close')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async close(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    return this.assignmentService.close(tenantId, id, userId);
  }

  /**
   * Delete an assignment
   * DELETE /assignments/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async remove(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    await this.assignmentService.remove(tenantId, id, userId);
  }

  /**
   * Get submissions for an assignment
   * GET /assignments/:id/submissions
   */
  @Get(':id/submissions')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async getSubmissions(@Param('id') id: string) {
    return this.assignmentService.getSubmissions(id);
  }

  /**
   * Submit an assignment (student)
   * POST /assignments/submit
   */
  @Post('submit')
  @Roles(UserRole.STUDENT)
  async submit(
    @CurrentUser('studentId') studentId: string,
    @Body() createSubmissionDto: CreateSubmissionDto
  ) {
    return this.assignmentService.submit(studentId, createSubmissionDto);
  }

  /**
   * Grade a submission (teacher)
   * PATCH /assignments/submissions/:id/grade
   */
  @Patch('submissions/:id/grade')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async gradeSubmission(
    @Param('id') submissionId: string,
    @CurrentUser('id') userId: string,
    @Body() gradeSubmissionDto: GradeSubmissionDto
  ) {
    return this.assignmentService.gradeSubmission(
      submissionId,
      userId,
      gradeSubmissionDto
    );
  }

  /**
   * Get student's own submissions
   * GET /assignments/my-submissions
   */
  @Get('my-submissions')
  @Roles(UserRole.STUDENT)
  async getMySubmissions(@CurrentUser('studentId') studentId: string) {
    return this.assignmentService.getStudentSubmissions(studentId);
  }
}
