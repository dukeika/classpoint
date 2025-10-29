import { IsOptional, IsString, IsEnum } from 'class-validator';
import { AssessmentType } from '@classpoint/db';

export class PerformanceMetricsQueryDto {
  @IsOptional()
  @IsString()
  termId?: string;

  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsString()
  subjectId?: string;

  @IsOptional()
  @IsEnum(AssessmentType)
  assessmentType?: AssessmentType;
}

export class PerformanceMetricsResponseDto {
  overall!: {
    totalAssessments!: number;
    totalGrades!: number;
    averageScore!: number;
    passRate: number; // >= 50%
    excellenceRate: number; // >= 80%
  };
  bySubject!: {
    subjectId!: string;
    subjectName!: string;
    subjectCode!: string;
    averageScore!: number;
    passRate!: number;
    totalGrades!: number;
    highestScore!: number;
    lowestScore!: number;
  }[];
  byClass!: {
    classId!: string;
    className!: string;
    averageScore!: number;
    passRate!: number;
    totalStudents!: number;
  }[];
  byAssessmentType!: {
    type!: AssessmentType;
    averageScore!: number;
    count!: number;
  }[];
  topPerformers!: {
    studentId!: string;
    studentName!: string;
    averageScore!: number;
    totalAssessments!: number;
  }[];
  needsSupport!: {
    studentId!: string;
    studentName!: string;
    averageScore!: number;
    failedSubjects!: number;
  }[];
}
