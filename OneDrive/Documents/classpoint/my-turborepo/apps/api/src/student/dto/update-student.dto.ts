import { PartialType } from '@nestjs/swagger';
import { CreateStudentDto } from './create-student.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StudentStatus } from '@classpoint/db';

export class UpdateStudentDto extends PartialType(CreateStudentDto) {
  @ApiPropertyOptional({
    description: 'Student enrollment status',
    enum: StudentStatus,
   ) example: StudentStatus.ENROLLED})
  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;
}
