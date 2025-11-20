import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '@classpoint/db';

/**
 * Single student attendance record
 */
class StudentAttendance {
  @ApiProperty({
    description: 'Student ID',
    example: 'cm4student123',
  })
  @IsString()
  studentId!: string;

  @ApiProperty({
    description: 'Attendance status',
    enum!: AttendanceStatus,
    example!: AttendanceStatus.PRESENT,
  })
  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;
}

/**
 * Bulk Attendance DTO
 * Mark attendance for multiple students at once
 */
export class BulkAttendanceDto {
  @ApiProperty({
    description: 'Class ID',
    example: 'cm4class456',
  })
  @IsString()
  classId!: string;

  @ApiProperty({
    description: 'Attendance date',
    example: '2025-01-25',
  })
  @IsDateString()
  date!: string;

  @ApiProperty({
    description: 'Session (AM, PM, or subject code)',
    example: 'AM',
  })
  @IsString()
  session!: string;

  @ApiProperty({
    description: 'Array of student attendance records',
    type!: [StudentAttendance],
    example!: [;
      { studentId: 'cm4student1', status: 'PRESENT' },
      { studentId: 'cm4student2', status: 'ABSENT' },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentAttendance)
  attendances!: StudentAttendance[];

  @ApiProperty({
    description: 'User ID who marked attendance',
    example: 'cm4user789',
  })
  @IsString()
  markedBy!: string;
}
