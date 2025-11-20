import { Module } from '@nestjs/common';
import { PrismaModule } from '@classpoint/db';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { TermService } from './term.service';
import { TermController } from './term.controller';
import { ClassService } from './class.service';
import { ClassController } from './class.controller';
import { DepartmentService } from './department.service';
import { DepartmentController } from './department.controller';
import { SubjectService } from './subject.service';
import { SubjectController } from './subject.controller';

/**
 * Academic Module
 *
 * Manages academic structure including:
 * - Academic sessions (school years)
 * - Academic terms (terms/semesters)
 * - Classes (levels and arms)
 * - Subjects and departments
 * - Grading schemes
 */
@Module({
  imports: [PrismaModule],
  controllers: [
    SessionController,
    TermController,
    ClassController,
    DepartmentController,
    SubjectController,
  ],
  providers: [
    SessionService,
    TermService,
    ClassService,
    DepartmentService,
    SubjectService,
  ],
  exports: [
    SessionService,
    TermService,
    ClassService,
    DepartmentService,
    SubjectService,
  ],
})
export class AcademicModule {}
