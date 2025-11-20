import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@classpoint/db';
import { Attendance, AttendanceStatus, Prisma } from '@classpoint/db';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mark attendance for a student
   */
  async create(createAttendanceDto: CreateAttendanceDto): Promise<Attendance> {
    this.logger.log(`Creating attendance for student: ${createAttendanceDto.studentId}`);

    // Verify student exists
    const student = await this.prisma.student.findUnique({
      where: { id: createAttendanceDto.studentId },
    });

    if (!student) {
      throw new NotFoundException(
        `Student with ID '${createAttendanceDto.studentId}' not found`
      );
    }

    // Verify class exists
    const classEntity = await this.prisma.class.findUnique({
      where: { id: createAttendanceDto.classId },
    });

    if (!classEntity) {
      throw new NotFoundException(
        `Class with ID '${createAttendanceDto.classId}' not found`
      );
    }

    // Check if attendance already exists
    const existing = await this.prisma.attendance.findUnique({
      where: {
        studentId_classId_date_session: {
          studentId: createAttendanceDto.studentId,
          classId: createAttendanceDto.classId,
          date: new Date(createAttendanceDto.date),
          session: createAttendanceDto.session,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Attendance already marked for this student, class, date, and session`
      );
    }

    try {
      const attendance = await this.prisma.attendance.create({
        data: {
          studentId: createAttendanceDto.studentId,
          classId: createAttendanceDto.classId,
          date: new Date(createAttendanceDto.date),
          session: createAttendanceDto.session,
          status: createAttendanceDto.status,
          reason: createAttendanceDto.reason,
          markedBy: createAttendanceDto.markedBy,
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              admissionNumber: true,
            },
          },
          class: {
            select: {
              id: true,
              level: true,
              arm: true,
            },
          },
        },
      });

      this.logger.log(`Attendance created successfully: ${attendance.id}`);
      return attendance;
    } catch (error) {
      this.logger.error(`Failed to create attendance: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Bulk mark attendance for multiple students
   */
  async bulkCreate(bulkAttendanceDto: BulkAttendanceDto) {
    this.logger.log(`Bulk marking attendance for ${bulkAttendanceDto.attendances.length} students`);

    // Verify class exists
    const classEntity = await this.prisma.class.findUnique({
      where: { id: bulkAttendanceDto.classId },
    });

    if (!classEntity) {
      throw new NotFoundException(
        `Class with ID '${bulkAttendanceDto.classId}' not found`
      );
    }

    const results = {
      successful: [] as Attendance[],
      failed: [] as { studentId: string; error: string }[],
    };

    const date = new Date(bulkAttendanceDto.date);

    // Process each attendance record
    for (const record of bulkAttendanceDto.attendances) {
      try {
        const attendance = await this.prisma.attendance.upsert({
          where: {
            studentId_classId_date_session: {
              studentId: record.studentId,
              classId: bulkAttendanceDto.classId,
              date,
              session: bulkAttendanceDto.session,
            },
          },
          update: {
            status: record.status,
            markedBy: bulkAttendanceDto.markedBy,
          },
          create: {
            studentId: record.studentId,
            classId: bulkAttendanceDto.classId,
            date,
            session: bulkAttendanceDto.session,
            status: record.status,
            markedBy: bulkAttendanceDto.markedBy,
          },
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        results.successful.push(attendance);
      } catch (error) {
        results.failed.push({
          studentId: record.studentId,
          error: error.message,
        });
      }
    }

    this.logger.log(
      `Bulk attendance complete: ${results.successful.length} successful, ${results.failed.length} failed`
    );

    return results;
  }

  /**
   * Get attendance records with filtering
   */
  async findAll(params?: {
    skip?: number;
    take?: number;
    studentId?: string;
    classId?: string;
    dateFrom?: string;
    dateTo?: string;
    session?: string;
    status?: AttendanceStatus;
  }): Promise<{ data: Attendance[]; total: number }> {
    const { skip = 0, take = 50, studentId, classId, dateFrom, dateTo, session, status } = params || {};

    const where: Prisma.AttendanceWhereInput = {};

    if (studentId) where.studentId = studentId;
    if (classId) where.classId = classId;
    if (session) where.session = session;
    if (status) where.status = status;

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    const [attendances, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        skip,
        take,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              admissionNumber: true,
            },
          },
          class: {
            select: {
              id: true,
              level: true,
              arm: true,
            },
          },
        },
        orderBy: [{ date: 'desc' }, { session: 'asc' }],
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return {
      data: attendances,
      total,
    };
  }

  /**
   * Get a single attendance record
   */
  async findOne(id: string): Promise<Attendance> {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
      include: {
        student: true,
        class: true,
      },
    });

    if (!attendance) {
      throw new NotFoundException(`Attendance with ID '${id}' not found`);
    }

    return attendance;
  }

  /**
   * Update an attendance record
   */
  async update(id: string, updateAttendanceDto: UpdateAttendanceDto): Promise<Attendance> {
    this.logger.log(`Updating attendance: ${id}`);

    // Verify attendance exists
    await this.findOne(id);

    try {
      const attendance = await this.prisma.attendance.update({
        where: { id },
        data: updateAttendanceDto,
        include: {
          student: true,
          class: true,
        },
      });

      this.logger.log(`Attendance updated successfully: ${id}`);
      return attendance;
    } catch (error) {
      this.logger.error(`Failed to update attendance: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Delete an attendance record
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Deleting attendance: ${id}`);

    // Verify attendance exists
    await this.findOne(id);

    try {
      await this.prisma.attendance.delete({
        where: { id },
      });

      this.logger.log(`Attendance deleted successfully: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete attendance: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Get class attendance for a specific date
   */
  async getClassAttendance(classId: string, date: string, session: string) {
    // Verify class exists
    const classEntity = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
    });

    if (!classEntity) {
      throw new NotFoundException(`Class with ID '${classId}' not found`);
    }

    // Get all attendance records for this class/date/session
    const attendances = await this.prisma.attendance.findMany({
      where: {
        classId,
        date: new Date(date),
        session,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNumber: true,
          },
        },
      },
      orderBy: {
        student: {
          lastName: 'asc',
        },
      },
    });

    // Get counts by status
    const summary = {
      total: attendances.length,
      present: attendances.filter(a => a.status === AttendanceStatus.PRESENT).length,
      absent: attendances.filter(a => a.status === AttendanceStatus.ABSENT).length,
      late: attendances.filter(a => a.status === AttendanceStatus.LATE).length,
      excused: attendances.filter(a => a.status === AttendanceStatus.EXCUSED).length,
    };

    return {
      class: classEntity,
      date: new Date(date),
      session,
      attendances,
      summary,
    };
  }

  /**
   * Get student attendance summary
   */
  async getStudentSummary(studentId: string, dateFrom?: string, dateTo?: string) {
    // Verify student exists
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID '${studentId}' not found`);
    }

    const where: Prisma.AttendanceWhereInput = { studentId };

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    const attendances = await this.prisma.attendance.findMany({
      where,
      include: {
        class: true,
      },
      orderBy: { date: 'desc' },
    });

    const summary = {
      total: attendances.length,
      present: attendances.filter(a => a.status === AttendanceStatus.PRESENT).length,
      absent: attendances.filter(a => a.status === AttendanceStatus.ABSENT).length,
      late: attendances.filter(a => a.status === AttendanceStatus.LATE).length,
      excused: attendances.filter(a => a.status === AttendanceStatus.EXCUSED).length,
    };

    const attendanceRate = summary.total > 0
      ? ((summary.present + summary.late) / summary.total) * 100
      : 0;

    return {
      student,
      dateRange: {
        from: dateFrom ? new Date(dateFrom) : null,
        to: dateTo ? new Date(dateTo) : null,
      },
      attendances,
      summary,
      attendanceRate: Math.round(attendanceRate * 100) / 100, // Round to 2 decimals
    };
  }

  /**
   * Get attendance report for a date range
   */
  async getAttendanceReport(
    classId: string,
    dateFrom: string,
    dateTo: string,
    session?: string
  ) {
    // Verify class exists
    const classEntity = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classEntity) {
      throw new NotFoundException(`Class with ID '${classId}' not found`);
    }

    const where: Prisma.AttendanceWhereInput = {
      classId,
      date: {
        gte: new Date(dateFrom),
        lte: new Date(dateTo),
      },
    };

    if (session) {
      where.session = session;
    }

    const attendances = await this.prisma.attendance.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNumber: true,
          },
        },
      },
      orderBy: [{ date: 'asc' }, { session: 'asc' }],
    });

    // Group by student
    const studentSummaries = new Map();

    for (const attendance of attendances) {
      const studentId = attendance.studentId;

      if (!studentSummaries.has(studentId)) {
        studentSummaries.set(studentId, {
          student: attendance.student,
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
        });
      }

      const summary = studentSummaries.get(studentId);
      summary.total++;
      summary[attendance.status.toLowerCase()]++;
    }

    const summaries = Array.from(studentSummaries.values()).map(s: any => ({
      ...s,
      attendanceRate: s.total > 0 ? ((s.present + s.late) / s.total) * 100 : 0,
    }));

    return {
      class: classEntity,
      dateRange: {
        from: new Date(dateFrom),
        to: new Date(dateTo),
      },
      session,
      studentSummaries: summaries,
    };
  }
}
