import { IsOptional, IsString, IsEnum } from 'class-validator';
import { FeeStatus } from '@classpoint/db';

export class FeeStatusReportQueryDto {
  @IsOptional()
  @IsString()
  termId?: string;

  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsEnum(FeeStatus)
  status?: FeeStatus;
}

export class FeeStatusReportResponseDto {
  summary!: {
    totalStudents!: number;
    fullPayment!: number;
    partialPayment!: number;
    noPayment!: number;
    fullPaymentRate!: number;
    partialPaymentRate!: number;
    noPaymentRate!: number;
  };
  byClass!: {
    classId!: string;
    className!: string;
    totalStudents!: number;
    fullPayment!: number;
    partialPayment!: number;
    noPayment!: number;
    fullPaymentRate!: number;
  }[];
  byTerm!: {
    termId!: string;
    termName!: string;
    sessionName!: string;
    fullPayment!: number;
    partialPayment!: number;
    noPayment!: number;
  }[];
  outstandingStudents!: {
    studentId!: string;
    studentName!: string;
    className!: string;
    status!: FeeStatus;
    termCount!: number;
  }[];
}

export class FeeStatusReportDto {
  termId!: string;
  summary!: {
    totalStudents!: number;
    fullPayment!: number;
    partialPayment!: number;
    noPayment!: number;
  };
  byClass!: {
    classId!: string;
    className!: string;
    fullPayment!: number;
    partialPayment!: number;
    noPayment!: number;
  }[];
}
