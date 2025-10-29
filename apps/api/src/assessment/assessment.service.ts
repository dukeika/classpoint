import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@classpoint/db';
import { Assessment, Grade, Prisma } from '@classpoint/db';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { CreateGradeDto } from './dto/create-grade.dto';
import { BulkGradesDto } from './dto/bulk-grades.dto';

@Injectable()
export class AssessmentService {
  private readonly logger = new Logger(AssessmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // ASSESSMENT METHODS
  // ============================================

  /**
   * Create a new assessment
   */
  async createAssessment(tenantId: string, createAssessmentDto: CreateAssessmentDto): Promise<Assessment> {
    this.logger.log(`Creating assessment for term: ${createAssessmentDto.termId}`);

    // Verify term and subject exist
    const [term, subject] = await Promise.all([
      this.prisma.term.findFirst({ where: { id: createAssessmentDto.termId, tenantId } }),
      this.prisma.subject.findFirst({ where: { id: createAssessmentDto.subjectId, tenantId } }),
    ]);

    if (!term) throw new NotFoundException(`Term not found`);
    if (!subject) throw new NotFoundException(`Subject not found`);

    const assessment = await this.prisma.assessment.create({
      data: createAssessmentDto,
      include: { term: true, subject: true },
    });

    this.logger.log(`Assessment created: ${assessment.id}`);
    return assessment;
  }

  /**
   * Get assessments for a term/subject
   */
  async findAssessments(termId?: string, subjectId?: string) {
    const where: Prisma.AssessmentWhereInput = {};
    if (termId) where.termId = termId;
    if (subjectId) where.subjectId = subjectId;

    return this.prisma.assessment.findMany({
      where,
      include: { term: true, subject: true, _count: { select: { grades: true } } },
      orderBy: [{ term: { startDate: 'desc' } }, { type: 'asc' }],
    });
  }

  // ============================================
  // GRADE METHODS
  // ============================================

  /**
   * Create/update a single grade
   */
  async createGrade(createGradeDto: CreateGradeDto): Promise<Grade> {
    this.logger.log(`Creating grade for student: ${createGradeDto.studentId}`);

    // Verify assessment exists and get max score
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: createGradeDto.assessmentId },
    });

    if (!assessment) throw new NotFoundException(`Assessment not found`);

    // Validate score doesn't exceed max
    if (createGradeDto.score > assessment.maxScore) {
      throw new BadRequestException(
        `Score ${createGradeDto.score} exceeds maximum ${assessment.maxScore}`
      );
    }

    const grade = await this.prisma.grade.upsert({
      where: {
        studentId_assessmentId: {
          studentId: createGradeDto.studentId,
          assessmentId: createGradeDto.assessmentId,
        },
      },
      update: {
        score: createGradeDto.score,
        enteredBy: createGradeDto.enteredBy,
        isPublished: createGradeDto.isPublished ?? false,
        isLocked: createGradeDto.isLocked ?? false,
      },
      create: createGradeDto,
      include: { student: { select: { id: true, firstName: true, lastName: true } }, assessment: true },
    });

    this.logger.log(`Grade created/updated: ${grade.id}`);
    return grade;
  }

  /**
   * Bulk create/update grades
   */
  async bulkCreateGrades(tenantId: string, bulkGradesDto: BulkGradesDto) {
    this.logger.log(`Bulk creating ${bulkGradesDto.grades.length} grades`);

    const assessment = await this.prisma.assessment.findUnique({
      where: { id: bulkGradesDto.assessmentId },
    });

    if (!assessment) throw new NotFoundException(`Assessment not found`);

    const results = {
      successful: [] as Grade[],
      failed: [] as { studentIdentifier: string; error: string }[],
    };

    for (const gradeData of bulkGradesDto.grades) {
      try {
        // Find student
        const student = await this.prisma.student.findFirst({
          where: {
            tenantId,
            OR: [
              { admissionNumber: gradeData.studentIdentifier },
              { id: gradeData.studentIdentifier },
            ],
          },
        });

        if (!student) {
          results.failed.push({ studentIdentifier: gradeData.studentIdentifier, error: 'Student not found' });
          continue;
        }

        if (gradeData.score > assessment.maxScore) {
          results.failed.push({ studentIdentifier: gradeData.studentIdentifier, error: `Score exceeds maximum ${assessment.maxScore}` });
          continue;
        }

        const grade = await this.prisma.grade.upsert({
          where: {
            studentId_assessmentId: {
              studentId: student.id,
              assessmentId: bulkGradesDto.assessmentId,
            },
          },
          update: {
            score: gradeData.score,
            enteredBy: bulkGradesDto.enteredBy,
          },
          create: {
            studentId: student.id,
            subjectId: bulkGradesDto.subjectId,
            assessmentId: bulkGradesDto.assessmentId,
            score: gradeData.score,
            enteredBy: bulkGradesDto.enteredBy,
          },
          include: { student: { select: { id: true, firstName: true, lastName: true } } },
        });

        results.successful.push(grade);
      } catch (error) {
        results.failed.push({ studentIdentifier: gradeData.studentIdentifier, error: error.message });
      }
    }

    this.logger.log(`Bulk grades complete: ${results.successful.length} successful, ${results.failed.length} failed`);
    return results;
  }

  /**
   * Get student results for a term/subject
   */
  async getStudentResults(studentId: string, termId?: string, subjectId?: string) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException(`Student not found`);

    const where: Prisma.GradeWhereInput = { studentId };

    // Build complex filter for term
    if (termId || subjectId) {
      where.assessment = {};
      if (termId) where.assessment.termId = termId;
      if (subjectId) where.assessment.subjectId = subjectId;
    }

    const grades = await this.prisma.grade.findMany({
      where,
      include: {
        assessment: {
          include: {
            term: true,
            subject: true,
          },
        },
      },
      orderBy: [{ assessment: { term: { startDate: 'desc' } } }, { assessment: { type: 'asc' } }],
    });

    // Calculate totals by subject
    const subjectTotals = new Map();

    for (const grade of grades) {
      const subjectId = grade.assessment.subjectId;

      if (!subjectTotals.has(subjectId)) {
        subjectTotals.set(subjectId, {
          subject: grade.assessment.subject,
          totalScore: 0,
          totalWeight: 0,
          grades: [],
        });
      }

      const subjectData = subjectTotals.get(subjectId);
      const weightedScore = (grade.score / grade.assessment.maxScore) * grade.assessment.weight;

      subjectData.totalScore += weightedScore;
      subjectData.totalWeight += grade.assessment.weight;
      subjectData.grades.push({
        ...grade,
        percentage: (grade.score / grade.assessment.maxScore) * 100,
      });
    }

    const results = Array.from(subjectTotals.values()).map(data: any => ({
      ...data,
      finalScore: data.totalWeight > 0 ? Math.round((data.totalScore / data.totalWeight) * 100 * 100) / 100 : 0,
    }));

    return { student, results };
  }

  /**
   * Publish/unpublish grades
   */
  async publishGrades(assessmentId: string, isPublished: boolean) {
    const result = await this.prisma.grade.updateMany({
      where: { assessmentId },
      data: { isPublished },
    });

    this.logger.log(`${result.count} grades ${isPublished ? 'published' : 'unpublished'}`);
    return { count: result.count, isPublished };
  }
}
