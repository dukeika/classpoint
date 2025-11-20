import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { PromotionService } from './promotion.service';
import { PromotionPreviewDto, ExecutePromotionDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';
import { UserRole } from '@classpoint/db';

@ApiTags('Promotions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('promotions')
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Post('preview')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.EXAMS_OFFICER)
  @ApiOperation({
    summary: 'Preview a promotion',
    description:
      'Generates a preview of what will happen when students are promoted from one term/class to another. Shows conflicts like capacity issues or existing enrollments.',
  })
  @ApiResponse({
    status: 200,
    description: 'Promotion preview generated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  @ApiResponse({ status: 404, description: 'Term or class not found' })
  preview(@Req() req: any, @Body() previewDto: PromotionPreviewDto) {
    const tenantId = req.user.tenantId;
    return this.promotionService.preview(tenantId, previewDto);
  }

  @Post('execute')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.EXAMS_OFFICER)
  @ApiOperation({
    summary: 'Execute a promotion',
    description:
      'Promotes students from current term to next term. Marks old enrollments as promoted and creates new enrollments. Creates audit log. Use force=true to override capacity conflicts.',
  })
  @ApiResponse({
    status: 201,
    description: 'Promotion executed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Promotion has conflicts (use force=true to override)',
  })
  @ApiResponse({ status: 404, description: 'Term or class not found' })
  execute(@Req() req: any, @Body() executeDto: ExecutePromotionDto) {
    const tenantId = req.user.tenantId;
    return this.promotionService.execute(tenantId, executeDto);
  }

  @Get('student/:studentId/history')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.EXAMS_OFFICER,
    UserRole.PARENT,
  )
  @ApiOperation({
    summary: 'Get promotion history for a student',
    description:
      'Returns all promotions for a student, showing which classes they were promoted from and when.',
  })
  @ApiParam({
    name: 'studentId',
    description: 'Student ID',
    example: 'cm4student123',
  })
  @ApiResponse({
    status: 200,
    description: 'Student promotion history retrieved',
  })
  @ApiResponse({ status: 404, description: 'Student not found' })
  getStudentPromotionHistory(
    @Req() req: any,
    @Param('studentId') studentId: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.promotionService.getStudentPromotionHistory(
      tenantId,
      studentId,
    );
  }

  @Get('term/:termId/statistics')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.EXAMS_OFFICER,
  )
  @ApiOperation({
    summary: 'Get promotion statistics for a term',
    description:
      'Returns promotion statistics including total students, promoted count, promotion rate, and breakdown by class.',
  })
  @ApiParam({
    name: 'termId',
    description: 'Term ID',
    example: 'cm4term123',
  })
  @ApiResponse({
    status: 200,
    description: 'Term promotion statistics retrieved',
  })
  @ApiResponse({ status: 404, description: 'Term not found' })
  getTermPromotionStatistics(
    @Req() req: any,
    @Param('termId') termId: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.promotionService.getTermPromotionStatistics(tenantId, termId);
  }

  @Post('rollback/:auditLogId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({
    summary: 'Rollback a promotion',
    description:
      'Reverses a promotion by deleting new enrollments and unmarking old enrollments. Creates a rollback audit log. Use with caution!',
  })
  @ApiParam({
    name: 'auditLogId',
    description: 'Audit log ID of the promotion to rollback',
    example: 'cm4audit123',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        rolledBackBy: {
          type: 'string',
          description: 'User ID performing the rollback',
          example: 'cm4user789',
        },
      },
      required: ['rolledBackBy'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Promotion rolled back successfully',
  })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  rollback(
    @Req() req: any,
    @Param('auditLogId') auditLogId: string,
    @Body() body: { rolledBackBy: string },
  ) {
    const tenantId = req.user.tenantId;
    return this.promotionService.rollback(
      tenantId,
      auditLogId,
      body.rolledBackBy,
    );
  }
}
