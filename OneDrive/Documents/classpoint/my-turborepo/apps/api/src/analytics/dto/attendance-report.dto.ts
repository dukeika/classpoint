import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';
import { AttendanceSession } from '@classpoint/db';

export class AttendanceReportQueryDto {
  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsString()
  studentId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(AttendanceSession)
  session?: AttendanceSession;
}

export class AttendanceReportResponseDto {
  summary!: {
    totalStudents!: number;
    totalRecords!: number;
    averageAttendanceRate!: number;
    presentCount!: number;
    absentCount!: number;
    lateCount!: number;
    excusedCount!: number;
  };
  byClass!: {
    classId!: string;
    className!: string;
    attendanceRate!: number;
    totalStudents!: number;
    averagePresent!: number;
  }[];
  byStudent!: {
    studentId!: string;
    studentName!: string;
    attendanceRate!: number;
    presentCount!: number;
    absentCount!: number;
    lateCount!: number;
    excusedCount!: number;
  }[];
  dailyTrend!: {
    date!: string;
    attendanceRate!: number;
    presentCount!: number;
    absentCount!: number;
  }[];
}
