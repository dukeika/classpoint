import { IsOptional, IsDateString, IsEnum, IsNumber, IsString, IsBoolean } from 'class-validator';

export enum CalendarView {
  MONTH = 'month',
  WEEK = 'week',
  DAY = 'day',
  AGENDA = 'agenda',
}

export class CalendarQueryDto {
  @IsDateString()
  date!: string; // The focal date for the view

  @IsEnum(CalendarView)
  view!: CalendarView;

  @IsOptional()
  @IsString()
  termId?: string;

  @IsOptional()
  @IsBoolean()
  publicOnly?: boolean;
}

export class EventRangeQueryDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsString()
  termId?: string;

  @IsOptional()
  @IsBoolean()
  publicOnly?: boolean;
}
