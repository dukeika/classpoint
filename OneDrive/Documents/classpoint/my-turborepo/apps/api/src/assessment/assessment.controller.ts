import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AssessmentService } from './assessment.service';
import { CreateAssessmentDto, CreateGradeDto, BulkGradesDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';
import { UserRole } from '@classpoint/db';
import { TenantId } from '../common/decorators';

@ApiTags('Assessment & Grading')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assessments')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  // Assessment endpoints
  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Create an assessment' })
  @ApiResponse({ status: 201, description: 'Assessment created' })
  createAssessment(@TenantId() tenantId: string, @Body() createAssessmentDto: CreateAssessmentDto) {
    return this.assessmentService.createAssessment(tenantId, createAssessmentDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get assessments' })
  @ApiResponse({ status: 200, description: 'Assessments retrieved' })
  findAssessments(@Query('termId') termId?: string, @Query('subjectId') subjectId?: string) {
    return this.assessmentService.findAssessments(termId, subjectId);
  }

  // Grade endpoints
  @Post('grades')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Enter a grade' })
  @ApiResponse({ status: 201, description: 'Grade entered' })
  createGrade(@Body() createGradeDto: CreateGradeDto) {
    return this.assessmentService.createGrade(createGradeDto);
  }

  @Post('grades/bulk')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Bulk enter grades' })
  @ApiResponse({ status: 201, description: 'Grades entered' })
  bulkCreateGrades(@TenantId() tenantId: string, @Body() bulkGradesDto: BulkGradesDto) {
    return this.assessmentService.bulkCreateGrades(tenantId, bulkGradesDto);
  }

  @Get('student/:studentId/results')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get student results' })
  @ApiResponse({ status: 200, description: 'Results retrieved' })
  getStudentResults(
    @Param('studentId') studentId: string,
    @Query('termId') termId?: string,
    @Query('subjectId') subjectId?: string
  ) {
    return this.assessmentService.getStudentResults(studentId, termId, subjectId);
  }

  @Patch(':assessmentId/publish')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Publish/unpublish grades' })
  @ApiResponse({ status: 200, description: 'Grades published/unpublished' })
  publishGrades(@Param('assessmentId') assessmentId: string, @Body() body: { isPublished: boolean }) {
    return this.assessmentService.publishGrades(assessmentId, body.isPublished);
  }
}
