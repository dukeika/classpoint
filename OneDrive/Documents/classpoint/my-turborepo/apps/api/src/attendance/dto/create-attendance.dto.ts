import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { AttendanceStatus } from '@classpoint/db';

/**
 * Create Attendance DTO
 * Mark student attendance for a specific date and session
 */
export class CreateAttendanceDto {
  @ApiProperty({
    description: 'Student ID',
    example: 'cm4student123',
  })
  @IsString()
  studentId!: string;

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
    description: 'Attendance status',
    enum!: AttendanceStatus,
    example!: AttendanceStatus.PRESENT,
  })
  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @ApiProperty({
    description: 'Reason for absence or lateness',
    example: 'Doctor appointment',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    description: 'User ID who marked attendance',
    example: 'cm4user789',
  })
  @IsString()
  markedBy!: string;
}
