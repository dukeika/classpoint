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

export interface AttendanceSummaryDto {
  totalStudents: number;
  totalRecords: number;
  averageAttendanceRate: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
}

export interface AttendanceClassBreakdownDto {
  classId: string;
  className: string;
  attendanceRate: number;
  totalStudents: number;
  averagePresent: number;
}

export interface AttendanceStudentBreakdownDto {
  studentId: string;
  studentName: string;
  attendanceRate: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
}

export interface AttendanceTrendPointDto {
  date: string;
  attendanceRate: number;
  presentCount: number;
  absentCount: number;
}

export class AttendanceReportResponseDto {
  summary!: AttendanceSummaryDto;
  byClass!: AttendanceClassBreakdownDto[];
  byStudent!: AttendanceStudentBreakdownDto[];
  dailyTrend!: AttendanceTrendPointDto[];
}
