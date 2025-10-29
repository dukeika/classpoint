import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@classpoint/db';
import {
  EnrollmentAnalyticsQueryDto,
  EnrollmentAnalyticsResponseDto,
  AttendanceReportQueryDto,
  AttendanceReportResponseDto,
  PerformanceMetricsQueryDto,
  PerformanceMetricsResponseDto,
  FeeStatusReportQueryDto,
  FeeStatusReportResponseDto,
} from './dto';
import { AttendanceStatus, Prisma } from '@classpoint/db';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get enrollment analytics
   */
  async getEnrollmentAnalytics(
    tenantId: string,
    query: EnrollmentAnalyticsQueryDto
  ): Promise<EnrollmentAnalyticsResponseDto> {
    this.logger.log(`Generating enrollment analytics for tenant: ${tenantId}`);

    const where: Prisma.EnrollmentWhereInput = { tenantId };

    if (query.sessionId) {
      where.session = { id: query.sessionId };
    }

    if (query.classId) {
      where.classId = query.classId;
    }

    if (query.startDate || query.endDate) {
      where.enrolledAt = {};
      if (query.startDate) {
        where.enrolledAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.enrolledAt.lte = new Date(query.endDate);
      }
    }

    // Get total and active enrollments
    const [totalEnrollments, enrollments] = await Promise.all([
      this.prisma.enrollment.count({ where }),
      this.prisma.enrollment.findMany({
        where,
        include: {
          student: true,
          class: true,
        },
      }),
    ]);

    const activeEnrollments = enrollments.length;

    // Enrollments by class
    const enrollmentsByClass = await this.prisma.class.findMany({
      where: { tenantId },
      include: {
        enrollments: {
          where: query.sessionId ? { session: { id: query.sessionId } } : {},
        },
      },
    });

    const enrollmentsByClassData = enrollmentsByClass.map((classItem) => ({
      classId: classItem.id,
      className: `${classItem.level}${classItem.arm ? ' ' + classItem.arm : ''}`,
      level: classItem.level,
      arm: classItem.arm,
      capacity: classItem.capacity,
      enrolled: classItem.enrollments.length,
      utilizationRate: classItem.capacity
        ? (classItem.enrollments.length / classItem.capacity) * 100
        : 0,
    }));

    // Enrollment trend (daily counts)
    const enrollmentTrend = await this.getEnrollmentTrend(tenantId, query);

    // Gender distribution
    const students = await this.prisma.student.findMany({
      where: {
        tenantId,
        enrollments: {
          some: where,
        },
      },
      select: { gender: true },
    });

    const genderDistribution = {
      male: students.filter((s) => s.gender === 'MALE').length,
      female: students.filter((s) => s.gender === 'FEMALE').length,
      other: students.filter((s) => s.gender === 'OTHER').length,
    };

    // Capacity status
    const totalCapacity = enrollmentsByClass.reduce(
      (sum, c) => sum + (c.capacity || 0),
      0
    );
    const totalEnrolled = enrollmentsByClass.reduce(
      (sum, c) => sum + c.enrollments.length,
      0
    );
    const classesAtCapacity = enrollmentsByClass.filter(
      (c) => c.capacity && c.enrollments.length >= c.capacity
    ).length;
    const classesNearCapacity = enrollmentsByClass.filter(
      (c) =>
        c.capacity &&
        c.enrollments.length >= c.capacity * 0.9 &&
        c.enrollments.length < c.capacity
    ).length;

    return {
      totalEnrollments,
      activeEnrollments,
      enrollmentsByClass: enrollmentsByClassData,
      enrollmentTrend,
      genderDistribution,
      capacityStatus: {
        totalCapacity,
        totalEnrolled,
        overallUtilization: totalCapacity
          ? (totalEnrolled / totalCapacity) * 100
          : 0,
        classesAtCapacity,
        classesNearCapacity,
      },
    };
  }

  /**
   * Get enrollment trend data
   */
  private async getEnrollmentTrend(
    tenantId: string,
    query: EnrollmentAnalyticsQueryDto
  ): Promise<{ date: string; count: number }[]> {
    const where: Prisma.EnrollmentWhereInput = { tenantId };

    if (query.sessionId) {
      where.session = { id: query.sessionId };
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where,
      select: { enrolledAt: true },
      orderBy: { enrolledAt: 'asc' },
    });

    // Group by date
    const trendMap = new Map<string, number>();
    enrollments.forEach((enrollment) => {
      const date = enrollment.enrolledAt.toISOString().split('T')[0];
      trendMap.set(date, (trendMap.get(date) || 0) + 1);
    });

    return Array.from(trendMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get attendance reports
   */
  async getAttendanceReport(
    tenantId: string,
    query: AttendanceReportQueryDto
  ): Promise<AttendanceReportResponseDto> {
    this.logger.log(`Generating attendance report for tenant: ${tenantId}`);

    const where: Prisma.AttendanceWhereInput = { tenantId };

    if (query.classId) {
      where.classId = query.classId;
    }

    if (query.studentId) {
      where.studentId = query.studentId;
    }

    if (query.session) {
      where.session = query.session;
    }

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) {
        where.date.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.date.lte = new Date(query.endDate);
      }
    }

    // Get all attendance records
    const attendanceRecords = await this.prisma.attendance.findMany({
      where,
      include: {
        student: {
          include: {
            user: true,
          },
        },
        class: true,
      },
    });

    // Summary
    const totalRecords = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(
      (a) => a.status === AttendanceStatus.PRESENT
    ).length;
    const absentCount = attendanceRecords.filter(
      (a) => a.status === AttendanceStatus.ABSENT
    ).length;
    const lateCount = attendanceRecords.filter(
      (a) => a.status === AttendanceStatus.LATE
    ).length;
    const excusedCount = attendanceRecords.filter(
      (a) => a.status === AttendanceStatus.EXCUSED
    ).length;

    const uniqueStudents = new Set(attendanceRecords.map((a) => a.studentId));
    const totalStudents = uniqueStudents.size;
    const averageAttendanceRate = totalRecords
      ? (presentCount / totalRecords) * 100
      : 0;

    // By class
    const byClass = await this.getAttendanceByClass(tenantId, query);

    // By student
    const byStudent = await this.getAttendanceByStudent(tenantId, query);

    // Daily trend
    const dailyTrend = await this.getAttendanceDailyTrend(tenantId, query);

    return {
      summary: {
        totalStudents,
        totalRecords,
        averageAttendanceRate,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
      },
      byClass,
      byStudent,
      dailyTrend,
    };
  }

  /**
   * Get attendance by class
   */
  private async getAttendanceByClass(
    tenantId: string,
    query: AttendanceReportQueryDto
  ) {
    const where: Prisma.AttendanceWhereInput = { tenantId };

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) {
        where.date.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.date.lte = new Date(query.endDate);
      }
    }

    const classes = await this.prisma.class.findMany({
      where: { tenantId },
      include: {
        attendances: { where },
        enrollments: true,
      },
    });

    return classes.map((classItem) => {
      const totalRecords = classItem.attendances.length;
      const presentCount = classItem.attendances.filter(
        (a) => a.status === AttendanceStatus.PRESENT
      ).length;
      const attendanceRate = totalRecords
        ? (presentCount / totalRecords) * 100
        : 0;

      return {
        classId: classItem.id,
        className: `${classItem.level}${classItem.arm ? ' ' + classItem.arm : ''}`,
        attendanceRate,
        totalStudents: classItem.enrollments.length,
        averagePresent: classItem.enrollments.length
          ? presentCount / classItem.enrollments.length
          : 0,
      };
    });
  }

  /**
   * Get attendance by student
   */
  private async getAttendanceByStudent(
    tenantId: string,
    query: AttendanceReportQueryDto
  ) {
    const where: Prisma.AttendanceWhereInput = { tenantId };

    if (query.classId) {
      where.classId = query.classId;
    }

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) {
        where.date.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.date.lte = new Date(query.endDate);
      }
    }

    const attendances = await this.prisma.attendance.findMany({
      where,
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    // Group by student
    const studentMap = new Map<
      string,
      {
        studentId: string;
        studentName: string;
        records: typeof attendances;
      }
    >();

    attendances.forEach((attendance) => {
      if (!studentMap.has(attendance.studentId)) {
        studentMap.set(attendance.studentId, {
          studentId: attendance.studentId,
          studentName: `${attendance.student.user.firstName} ${attendance.student.user.lastName}`,
          records: [],
        });
      }
      studentMap.get(attendance.studentId)!.records.push(attendance);
    });

    return Array.from(studentMap.values()).map((student) => {
      const totalRecords = student.records.length;
      const presentCount = student.records.filter(
        (a) => a.status === AttendanceStatus.PRESENT
      ).length;
      const absentCount = student.records.filter(
        (a) => a.status === AttendanceStatus.ABSENT
      ).length;
      const lateCount = student.records.filter(
        (a) => a.status === AttendanceStatus.LATE
      ).length;
      const excusedCount = student.records.filter(
        (a) => a.status === AttendanceStatus.EXCUSED
      ).length;

      return {
        studentId: student.studentId,
        studentName: student.studentName,
        attendanceRate: totalRecords ? (presentCount / totalRecords) * 100 : 0,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
      };
    });
  }

  /**
   * Get daily attendance trend
   */
  private async getAttendanceDailyTrend(
    tenantId: string,
    query: AttendanceReportQueryDto
  ) {
    const where: Prisma.AttendanceWhereInput = { tenantId };

    if (query.classId) {
      where.classId = query.classId;
    }

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) {
        where.date.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.date.lte = new Date(query.endDate);
      }
    }

    const attendances = await this.prisma.attendance.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    // Group by date
    const dailyMap = new Map<
      string,
      { present: number; absent: number; total: number }
    >();

    attendances.forEach((attendance) => {
      const date = attendance.date.toISOString().split('T')[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { present: 0, absent: 0, total: 0 });
      }
      const day = dailyMap.get(date)!;
      day.total++;
      if (attendance.status === AttendanceStatus.PRESENT) {
        day.present++;
      } else if (attendance.status === AttendanceStatus.ABSENT) {
        day.absent++;
      }
    });

    return Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        attendanceRate: data.total ? (data.present / data.total) * 100 : 0,
        presentCount: data.present,
        absentCount: data.absent,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(
    tenantId: string,
    query: PerformanceMetricsQueryDto
  ): Promise<PerformanceMetricsResponseDto> {
    this.logger.log(`Generating performance metrics for tenant: ${tenantId}`);

    const where: Prisma.GradeWhereInput = { tenantId };

    if (query.termId) {
      where.assessment = { termId: query.termId };
    }

    if (query.classId) {
      where.student = {
        enrollments: {
          some: { classId: query.classId },
        },
      };
    }

    if (query.subjectId) {
      where.assessment = {
        ...where.assessment,
        subjectId: query.subjectId,
      };
    }

    if (query.assessmentType) {
      where.assessment = {
        ...where.assessment,
        type: query.assessmentType,
      };
    }

    // Get all grades
    const grades = await this.prisma.grade.findMany({
      where,
      include: {
        assessment: {
          include: {
            subject: true,
            term: true,
          },
        },
        student: {
          include: {
            user: true,
            enrollments: {
              include: {
                class: true,
              },
            },
          },
        },
      },
    });

    // Overall metrics
    const totalGrades = grades.length;
    const totalAssessments = new Set(grades.map((g) => g.assessmentId)).size;
    const averageScore =
      totalGrades > 0
        ? grades.reduce((sum, g) => sum + g.score, 0) / totalGrades
        : 0;
    const passRate =
      totalGrades > 0
        ? (grades.filter((g) => g.score >= 50).length / totalGrades) * 100
        : 0;
    const excellenceRate =
      totalGrades > 0
        ? (grades.filter((g) => g.score >= 80).length / totalGrades) * 100
        : 0;

    // By subject
    const bySubject = await this.getPerformanceBySubject(grades);

    // By class
    const byClass = await this.getPerformanceByClass(grades);

    // By assessment type
    const byAssessmentType = await this.getPerformanceByAssessmentType(grades);

    // Top performers (average >= 80)
    const topPerformers = await this.getTopPerformers(tenantId, query);

    // Students needing support (average < 50)
    const needsSupport = await this.getStudentsNeedingSupport(tenantId, query);

    return {
      overall: {
        totalAssessments,
        totalGrades,
        averageScore,
        passRate,
        excellenceRate,
      },
      bySubject,
      byClass,
      byAssessmentType,
      topPerformers,
      needsSupport,
    };
  }

  /**
   * Get performance by subject
   */
  private async getPerformanceBySubject(grades: any[]) {
    const subjectMap = new Map<
      string,
      {
        subjectId: string;
        subjectName: string;
        subjectCode: string;
        scores: number[];
      }
    >();

    grades.forEach((grade) => {
      const subjectId = grade.assessment.subjectId;
      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          subjectId,
          subjectName: grade.assessment.subject.name,
          subjectCode: grade.assessment.subject.code,
          scores: [],
        });
      }
      subjectMap.get(subjectId)!.scores.push(grade.score);
    });

    return Array.from(subjectMap.values()).map((subject) => {
      const totalGrades = subject.scores.length;
      const averageScore =
        totalGrades > 0
          ? subject.scores.reduce((sum, s) => sum + s, 0) / totalGrades
          : 0;
      const passRate =
        totalGrades > 0
          ? (subject.scores.filter((s) => s >= 50).length / totalGrades) * 100
          : 0;

      return {
        subjectId: subject.subjectId,
        subjectName: subject.subjectName,
        subjectCode: subject.subjectCode,
        averageScore,
        passRate,
        totalGrades,
        highestScore: Math.max(...subject.scores, 0),
        lowestScore: Math.min(...subject.scores, 100),
      };
    });
  }

  /**
   * Get performance by class
   */
  private async getPerformanceByClass(grades: any[]) {
    const classMap = new Map<
      string,
      {
        classId: string;
        className: string;
        scores: number[];
        students: Set<string>;
      }
    >();

    grades.forEach((grade) => {
      const enrollment = grade.student.enrollments[0];
      if (!enrollment) return;

      const classId = enrollment.classId;
      const className = `${enrollment.class.level}${enrollment.class.arm ? ' ' + enrollment.class.arm : ''}`;

      if (!classMap.has(classId)) {
        classMap.set(classId, {
          classId,
          className,
          scores: [],
          students: new Set(),
        });
      }
      const classData = classMap.get(classId)!;
      classData.scores.push(grade.score);
      classData.students.add(grade.studentId);
    });

    return Array.from(classMap.values()).map((classData) => {
      const totalGrades = classData.scores.length;
      const averageScore =
        totalGrades > 0
          ? classData.scores.reduce((sum, s) => sum + s, 0) / totalGrades
          : 0;
      const passRate =
        totalGrades > 0
          ? (classData.scores.filter((s) => s >= 50).length / totalGrades) * 100
          : 0;

      return {
        classId: classData.classId,
        className: classData.className,
        averageScore,
        passRate,
        totalStudents: classData.students.size,
      };
    });
  }

  /**
   * Get performance by assessment type
   */
  private async getPerformanceByAssessmentType(grades: any[]) {
    const typeMap = new Map<string, number[]>();

    grades.forEach((grade) => {
      const type = grade.assessment.type;
      if (!typeMap.has(type)) {
        typeMap.set(type, []);
      }
      typeMap.get(type)!.push(grade.score);
    });

    return Array.from(typeMap.entries()).map(([type, scores]) => ({
      type: type as any,
      averageScore:
        scores.length > 0
          ? scores.reduce((sum, s) => sum + s, 0) / scores.length
          : 0,
      count: scores.length,
    }));
  }

  /**
   * Get top performers
   */
  private async getTopPerformers(
    tenantId: string,
    query: PerformanceMetricsQueryDto
  ) {
    const where: Prisma.GradeWhereInput = { tenantId };

    if (query.termId) {
      where.assessment = { termId: query.termId };
    }

    const grades = await this.prisma.grade.findMany({
      where,
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    // Group by student
    const studentScores = new Map<
      string,
      { name: string; scores: number[] }
    >();

    grades.forEach((grade) => {
      if (!studentScores.has(grade.studentId)) {
        studentScores.set(grade.studentId, {
          name: `${grade.student.user.firstName} ${grade.student.user.lastName}`,
          scores: [],
        });
      }
      studentScores.get(grade.studentId)!.scores.push(grade.score);
    });

    // Calculate averages and filter
    const topPerformers = Array.from(studentScores.entries())
      .map(([studentId, data]) => ({
        studentId,
        studentName: data.name,
        averageScore:
          data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length,
        totalAssessments: data.scores.length,
      }))
      .filter((student) => student.averageScore >= 80)
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 10); // Top 10

    return topPerformers;
  }

  /**
   * Get students needing support
   */
  private async getStudentsNeedingSupport(
    tenantId: string,
    query: PerformanceMetricsQueryDto
  ) {
    const where: Prisma.GradeWhereInput = { tenantId };

    if (query.termId) {
      where.assessment = { termId: query.termId };
    }

    const grades = await this.prisma.grade.findMany({
      where,
      include: {
        student: {
          include: {
            user: true,
          },
        },
        assessment: {
          include: {
            subject: true,
          },
        },
      },
    });

    // Group by student and subject
    const studentData = new Map<
      string,
      {
        name: string;
        subjectScores: Map<string, number[]>;
      }
    >();

    grades.forEach((grade) => {
      if (!studentData.has(grade.studentId)) {
        studentData.set(grade.studentId, {
          name: `${grade.student.user.firstName} ${grade.student.user.lastName}`,
          subjectScores: new Map(),
        });
      }
      const student = studentData.get(grade.studentId)!;
      const subjectId = grade.assessment.subjectId;
      if (!student.subjectScores.has(subjectId)) {
        student.subjectScores.set(subjectId, []);
      }
      student.subjectScores.get(subjectId)!.push(grade.score);
    });

    // Calculate averages and count failed subjects
    const needsSupport = Array.from(studentData.entries())
      .map(([studentId, data]) => {
        const subjectAverages = Array.from(data.subjectScores.values()).map(
          (scores) => scores.reduce((sum, s) => sum + s, 0) / scores.length
        );
        const overallAverage =
          subjectAverages.reduce((sum, avg) => sum + avg, 0) /
          subjectAverages.length;
        const failedSubjects = subjectAverages.filter((avg) => avg < 50).length;

        return {
          studentId,
          studentName: data.name,
          averageScore: overallAverage,
          failedSubjects,
        };
      })
      .filter((student) => student.averageScore < 50 || student.failedSubjects > 0)
      .sort((a, b) => a.averageScore - b.averageScore)
      .slice(0, 20); // Bottom 20

    return needsSupport;
  }

  /**
   * Get fee status reports
   */
  async getFeeStatusReport(
    tenantId: string,
    query: FeeStatusReportQueryDto
  ): Promise<FeeStatusReportResponseDto> {
    this.logger.log(`Generating fee status report for tenant: ${tenantId}`);

    const where: Prisma.FeeStatusWhereInput = { tenantId };

    if (query.termId) {
      where.termId = query.termId;
    }

    if (query.classId) {
      where.student = {
        enrollments: {
          some: { classId: query.classId },
        },
      };
    }

    if (query.status) {
      where.status = query.status;
    }

    // Get all fee status records
    const feeStatuses = await this.prisma.feeStatus.findMany({
      where,
      include: {
        student: {
          include: {
            user: true,
            enrollments: {
              include: {
                class: true,
              },
            },
          },
        },
        term: {
          include: {
            session: true,
          },
        },
      },
    });

    // Summary
    const uniqueStudents = new Set(feeStatuses.map((fs) => fs.studentId));
    const totalStudents = uniqueStudents.size;
    const fullPayment = feeStatuses.filter((fs) => fs.status === 'FULL').length;
    const partialPayment = feeStatuses.filter(
      (fs) => fs.status === 'PARTIAL'
    ).length;
    const noPayment = feeStatuses.filter((fs) => fs.status === 'NONE').length;

    // By class
    const byClass = await this.getFeeStatusByClass(tenantId, query);

    // By term
    const byTerm = await this.getFeeStatusByTerm(tenantId, query);

    // Outstanding students (students with NONE or PARTIAL status)
    const outstandingStudents = await this.getOutstandingStudents(
      tenantId,
      query
    );

    return {
      summary: {
        totalStudents,
        fullPayment,
        partialPayment,
        noPayment,
        fullPaymentRate: totalStudents
          ? (fullPayment / feeStatuses.length) * 100
          : 0,
        partialPaymentRate: totalStudents
          ? (partialPayment / feeStatuses.length) * 100
          : 0,
        noPaymentRate: totalStudents
          ? (noPayment / feeStatuses.length) * 100
          : 0,
      },
      byClass,
      byTerm,
      outstandingStudents,
    };
  }

  /**
   * Get fee status by class
   */
  private async getFeeStatusByClass(
    tenantId: string,
    query: FeeStatusReportQueryDto
  ) {
    const classes = await this.prisma.class.findMany({
      where: { tenantId },
      include: {
        enrollments: {
          include: {
            student: {
              include: {
                feeStatuses: {
                  where: query.termId ? { termId: query.termId } : {},
                },
              },
            },
          },
        },
      },
    });

    return classes.map((classItem) => {
      const feeStatuses = classItem.enrollments.flatMap(
        (e) => e.student.feeStatuses
      );
      const totalStudents = classItem.enrollments.length;
      const fullPayment = feeStatuses.filter((fs) => fs.status === 'FULL').length;
      const partialPayment = feeStatuses.filter(
        (fs) => fs.status === 'PARTIAL'
      ).length;
      const noPayment = feeStatuses.filter((fs) => fs.status === 'NONE').length;

      return {
        classId: classItem.id,
        className: `${classItem.level}${classItem.arm ? ' ' + classItem.arm : ''}`,
        totalStudents,
        fullPayment,
        partialPayment,
        noPayment,
        fullPaymentRate: totalStudents
          ? (fullPayment / feeStatuses.length) * 100
          : 0,
      };
    });
  }

  /**
   * Get fee status by term
   */
  private async getFeeStatusByTerm(
    tenantId: string,
    query: FeeStatusReportQueryDto
  ) {
    const terms = await this.prisma.term.findMany({
      where: { tenantId },
      include: {
        session: true,
        feeStatuses: {
          where: query.classId
            ? {
                student: {
                  enrollments: {
                    some: { classId: query.classId },
                  },
                },
              }
            : {},
        },
      },
    });

    return terms.map((term) => ({
      termId: term.id,
      termName: term.name,
      sessionName: term.session.name,
      fullPayment: term.feeStatuses.filter((fs) => fs.status === 'FULL').length,
      partialPayment: term.feeStatuses.filter((fs) => fs.status === 'PARTIAL')
        .length,
      noPayment: term.feeStatuses.filter((fs) => fs.status === 'NONE').length,
    }));
  }

  /**
   * Get outstanding students
   */
  private async getOutstandingStudents(
    tenantId: string,
    query: FeeStatusReportQueryDto
  ) {
    const where: Prisma.FeeStatusWhereInput = {
      tenantId,
      status: { in: ['PARTIAL', 'NONE'] },
    };

    if (query.termId) {
      where.termId = query.termId;
    }

    const feeStatuses = await this.prisma.feeStatus.findMany({
      where,
      include: {
        student: {
          include: {
            user: true,
            enrollments: {
              include: {
                class: true,
              },
            },
          },
        },
      },
    });

    // Group by student
    const studentMap = new Map<
      string,
      {
        studentId: string;
        studentName: string;
        className: string;
        status: string;
        terms: number;
      }
    >();

    feeStatuses.forEach((fs) => {
      if (!studentMap.has(fs.studentId)) {
        const enrollment = fs.student.enrollments[0];
        studentMap.set(fs.studentId, {
          studentId: fs.studentId,
          studentName: `${fs.student.user.firstName} ${fs.student.user.lastName}`,
          className: enrollment
            ? `${enrollment.class.level}${enrollment.class.arm ? ' ' + enrollment.class.arm : ''}`
            : 'N/A',
          status: fs.status,
          terms: 0,
        });
      }
      studentMap.get(fs.studentId)!.terms++;
    });

    return Array.from(studentMap.values())
      .sort((a, b) => b.terms - a.terms)
      .slice(0, 50); // Top 50 outstanding
  }
}
