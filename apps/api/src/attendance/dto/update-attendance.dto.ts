import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateAttendanceDto } from './create-attendance.dto';

/**
 * Update Attendance DTO
 * Update attendance status or reason
 * studentId, classId, date, and session cannot be changed
 */
export class UpdateAttendanceDto extends PartialType(
  OmitType(CreateAttendanceDto, ['studentId', 'classId', 'date', 'session'] as const)
) {}
