import { IsOptional, IsString, IsDateString } from 'class-validator';

export class EnrollmentAnalyticsQueryDto {
  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class EnrollmentAnalyticsResponseDto {
  totalEnrollments!: number;
  activeEnrollments!: number;
  enrollmentsByClass!: {
    classId!: string;
    className!: string;
    level!: string;
    arm!: string | null;
    capacity!: number | null;
    enrolled!: number;
    utilizationRate!: number;
  }[];
  enrollmentTrend!: {
    date!: string;
    count!: number;
  }[];
  genderDistribution!: {
    male!: number;
    female!: number;
    other!: number;
  };
  capacityStatus!: {
    totalCapacity!: number;
    totalEnrolled!: number;
    overallUtilization!: number;
    classesAtCapacity!: number;
    classesNearCapacity: number; // > 90%
  };
}
