import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@classpoint/db';
import { ExportQueryDto, ExportEntity, ExportFormat } from './dto';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Export data based on entity and format
   */
  async exportData(
    tenantId: string,
    query: ExportQueryDto
  ): Promise<{ data: string; filename: string; contentType: string }> {
    this.logger.log(
      `Exporting ${query.entity} as ${query.format} for tenant: ${tenantId}`
    );

    let data: any[];
    let headers: string[];

    switch (query.entity) {
      case ExportEntity.STUDENTS:
        ({ data, headers } = await this.exportStudents(tenantId, query));
        break;
      case ExportEntity.STAFF:
        ({ data, headers } = await this.exportStaff(tenantId));
        break;
      case ExportEntity.CLASSES:
        ({ data, headers } = await this.exportClasses(tenantId));
        break;
      case ExportEntity.ENROLLMENTS:
        ({ data, headers } = await this.exportEnrollments(tenantId, query));
        break;
      case ExportEntity.ATTENDANCE:
        ({ data, headers } = await this.exportAttendance(tenantId, query));
        break;
      case ExportEntity.GRADES:
        ({ data, headers } = await this.exportGrades(tenantId, query));
        break;
      case ExportEntity.FEE_STATUS:
        ({ data, headers } = await this.exportFeeStatus(tenantId, query));
        break;
      case ExportEntity.EVENTS:
        ({ data, headers } = await this.exportEvents(tenantId, query));
        break;
      default:
        throw new BadRequestException('Invalid export entity');
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${query.entity}-${timestamp}.${query.format}`;

    switch (query.format) {
      case ExportFormat.CSV:
        return {
          data: this.generateCSV(data, headers),
          filename,
          contentType: 'text/csv',
        };
      case ExportFormat.JSON:
        return {
          data: JSON.stringify(data, null, 2),
          filename,
          contentType: 'application/json',
        };
      case ExportFormat.EXCEL:
        // For Excel, we'll return CSV for now (can be enhanced with Excel library)
        return {
          data: this.generateCSV(data, headers),
          filename: filename.replace('.excel', '.csv'),
          contentType: 'text/csv',
        };
      default:
        throw new BadRequestException('Invalid export format');
    }
  }

  /**
   * Export students
   */
  private async exportStudents(tenantId: string, query: ExportQueryDto) {
    const students = await this.prisma.student.findMany({
      where: { tenantId },
      include: {
        householdMembers: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    const headers = [
      'Admission Number',
      'First Name',
      'Last Name',
      'Middle Name',
      'Date of Birth',
      'Gender',
      'Email',
      'Phone',
      'Address',
      'Status',
      'Guardian Names',
      'Guardian Emails',
      'Guardian Phones',
    ];

    const data = students.map((student) => ({
      'Admission Number': student.admissionNumber,
      'First Name': student.firstName,
      'Last Name': student.lastName,
      'Middle Name': student.middleName || '',
      'Date of Birth': student.dateOfBirth.toISOString().split('T')[0],
      Gender: student.gender,
      Email: student.email || '',
      Phone: student.phone || '',
      Address: student.address || '',
      Status: student.status,
      'Guardian Names': student.householdMembers
        .map((hm) => `${hm.user.firstName} ${hm.user.lastName}`)
        .join('; '),
      'Guardian Emails': student.householdMembers
        .map((hm) => hm.user.email)
        .join('; '),
      'Guardian Phones': student.householdMembers
        .map((hm) => hm.user.phone || '')
        .join('; '),
    }));

    return { data, headers };
  }

  /**
   * Export staff
   */
  private async exportStaff(tenantId: string) {
    const staff = await this.prisma.user.findMany({
      where: {
        tenantId,
        roles: {
          hasSome: ['SCHOOL_ADMIN', 'TEACHER', 'BURSAR', 'EXAMS_OFFICER'],
        },
      },
    });

    const headers = [
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Roles',
      'Active',
      'Created At',
    ];

    const data = staff.map((user) => ({
      'First Name': user.firstName,
      'Last Name': user.lastName,
      Email: user.email,
      Phone: user.phone || '',
      Roles: user.roles.join(', '),
      Active: user.isActive ? 'Yes' : 'No',
      'Created At': user.createdAt.toISOString().split('T')[0],
    }));

    return { data, headers };
  }

  /**
   * Export classes
   */
  private async exportClasses(tenantId: string) {
    const classes = await this.prisma.class.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: {
            enrollments: true,
            teacherClasses: true,
          },
        },
      },
    });

    const headers = [
      'Level',
      'Arm',
      'Capacity',
      'Current Enrollment',
      'Teachers Assigned',
    ];

    const data = classes.map((classItem) => ({
      Level: classItem.level,
      Arm: classItem.arm || '',
      Capacity: classItem.capacity || 'Unlimited',
      'Current Enrollment': classItem._count.enrollments,
      'Teachers Assigned': classItem._count.teacherClasses,
    }));

    return { data, headers };
  }

  /**
   * Export enrollments
   */
  private async exportEnrollments(tenantId: string, query: ExportQueryDto) {
    const where: any = { tenantId };
    if (query.termId) where.termId = query.termId;
    if (query.classId) where.classId = query.classId;

    const enrollments = await this.prisma.enrollment.findMany({
      where,
      include: {
        student: true,
        class: true,
        term: {
          include: {
            session: true,
          },
        },
      },
    });

    const headers = [
      'Student Name',
      'Admission Number',
      'Class',
      'Term',
      'Session',
      'Enrolled At',
      'Is Promoted',
    ];

    const data = enrollments.map((enrollment) => ({
      'Student Name': `${enrollment.student.firstName} ${enrollment.student.lastName}`,
      'Admission Number': enrollment.student.admissionNumber,
      Class: `${enrollment.class.level}${enrollment.class.arm ? ' ' + enrollment.class.arm : ''}`,
      Term: enrollment.term.name,
      Session: enrollment.term.session.name,
      'Enrolled At': enrollment.createdAt.toISOString().split('T')[0],
      'Is Promoted': enrollment.isPromoted ? 'Yes' : 'No',
    }));

    return { data, headers };
  }

  /**
   * Export attendance
   */
  private async exportAttendance(tenantId: string, query: ExportQueryDto) {
    const where: any = { tenantId };
    if (query.startDate) where.date = { gte: new Date(query.startDate) };
    if (query.endDate)
      where.date = { ...where.date, lte: new Date(query.endDate) };
    if (query.classId) where.classId = query.classId;

    const attendances = await this.prisma.attendance.findMany({
      where,
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            admissionNumber: true,
          },
        },
        class: {
          select: {
            level: true,
            arm: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    const headers = [
      'Date',
      'Student Name',
      'Admission Number',
      'Class',
      'Session',
      'Status',
      'Reason',
    ];

    const data = attendances.map((attendance) => ({
      Date: attendance.date.toISOString().split('T')[0],
      'Student Name': `${attendance.student.firstName} ${attendance.student.lastName}`,
      'Admission Number': attendance.student.admissionNumber,
      Class: `${attendance.class.level}${attendance.class.arm ? ' ' + attendance.class.arm : ''}`,
      Session: attendance.session,
      Status: attendance.status,
      Reason: attendance.reason || '',
    }));

    return { data, headers };
  }

  /**
   * Export grades
   */
  private async exportGrades(tenantId: string, query: ExportQueryDto) {
    const where: any = { tenantId };
    if (query.termId) where.assessment = { termId: query.termId };

    const grades = await this.prisma.grade.findMany({
      where,
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            admissionNumber: true,
          },
        },
        assessment: {
          include: {
            subject: true,
            term: {
              include: {
                session: true,
              },
            },
          },
        },
      },
    });

    const headers = [
      'Student Name',
      'Admission Number',
      'Subject',
      'Assessment Type',
      'Term',
      'Session',
      'Score',
      'Max Score',
      'Weight',
      'Percentage',
    ];

    const data = grades.map((grade) => ({
      'Student Name': `${grade.student.firstName} ${grade.student.lastName}`,
      'Admission Number': grade.student.admissionNumber,
      Subject: grade.assessment.subject.name,
      'Assessment Type': grade.assessment.type,
      Term: grade.assessment.term.name,
      Session: grade.assessment.term.session.name,
      Score: grade.score,
      'Max Score': grade.assessment.maxScore,
      Weight: grade.assessment.weight,
      Percentage: ((grade.score / grade.assessment.maxScore) * 100).toFixed(2),
    }));

    return { data, headers };
  }

  /**
   * Export fee status
   */
  private async exportFeeStatus(tenantId: string, query: ExportQueryDto) {
    const where: any = { tenantId };
    if (query.termId) where.termId = query.termId;

    const feeStatuses = await this.prisma.feeStatus.findMany({
      where,
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            admissionNumber: true,
          },
        },
        term: {
          include: {
            session: true,
          },
        },
      },
    });

    const headers = [
      'Student Name',
      'Admission Number',
      'Term',
      'Session',
      'Status',
      'Updated At',
      'Updated By',
    ];

    const data = feeStatuses.map((feeStatus) => ({
      'Student Name': `${feeStatus.student.firstName} ${feeStatus.student.lastName}`,
      'Admission Number': feeStatus.student.admissionNumber,
      Term: feeStatus.term.name,
      Session: feeStatus.term.session.name,
      Status: feeStatus.status,
      'Updated At': feeStatus.updatedAt.toISOString().split('T')[0],
      'Updated By': feeStatus.updatedBy,
    }));

    return { data, headers };
  }

  /**
   * Export events
   */
  private async exportEvents(tenantId: string, query: ExportQueryDto) {
    const where: any = { tenantId };
    if (query.startDate) where.startTime = { gte: new Date(query.startDate) };
    if (query.endDate)
      where.endTime = { ...where.endTime, lte: new Date(query.endDate) };
    if (query.termId) where.termId = query.termId;

    const events = await this.prisma.event.findMany({
      where,
      include: {
        term: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    const headers = [
      'Title',
      'Description',
      'Location',
      'Start Time',
      'End Time',
      'Term',
      'Is Public',
      'Is Recurring',
    ];

    const data = events.map((event) => ({
      Title: event.title,
      Description: event.description || '',
      Location: event.location || '',
      'Start Time': event.startTime.toISOString(),
      'End Time': event.endTime.toISOString(),
      Term: event.term?.name || '',
      'Is Public': event.isPublic ? 'Yes' : 'No',
      'Is Recurring': event.isRecurring ? 'Yes' : 'No',
    }));

    return { data, headers };
  }

  /**
   * Generate CSV from data
   */
  private generateCSV(data: any[], headers: string[]): string {
    if (data.length === 0) {
      return headers.join(',') + '\n';
    }

    const rows = data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Escape commas and quotes in values
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }
}
