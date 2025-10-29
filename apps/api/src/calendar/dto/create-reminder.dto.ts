import { IsString, IsEnum, IsNumber, Min } from 'class-validator';

export enum ReminderType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  IN_APP = 'IN_APP',
  PUSH = 'PUSH',
}

export class CreateReminderDto {
  @IsString()
  eventId!: string;

  @IsEnum(ReminderType)
  type!: ReminderType;

  @IsNumber()
  @Min(5)
  minutesBefore!: number; // At least 5 minutes notice
}

export class BulkCreateReminderDto {
  @IsString()
  eventId!: string;

  @IsEnum(ReminderType, { each: true })
  types!: ReminderType[];

  @IsNumber()
  @Min(5)
  minutesBefore!: number;
}
