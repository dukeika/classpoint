import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, StudentStatus } from '@classpoint/db';

export class StudentResponseDto {
  @ApiProperty({
    description: 'Student unique identifier',
   ) example: 'clxxx-xxxx-xxxx-xxxx'})
  id: string;

  @ApiProperty({
    description: 'Tenant ID',
   ) example: 'clxxx-xxxx-xxxx-xxxx'})
  tenantId: string;

  @ApiProperty({
    description: 'Student first name',
   ) example: 'John'})
  firstName: string;

  @ApiProperty({
    description: 'Student last name',
   ) example: 'Doe'})
  lastName: string;

  @ApiPropertyOptional({
    description: 'Student middle name',
   ) example: 'Michael'})
  middleName?: string | null;

  @ApiProperty({
    description: 'Student date of birth',
   ) example: '2010-01-15T00:00:00.000Z'})
  dateOfBirth: Date;

  @ApiProperty({
    description: 'Student gender',
    enum: Gender,
   ) example: Gender.MALE})
  gender: Gender;

  @ApiProperty({
    description: 'Student enrollment status',
    enum: StudentStatus,
   ) example: StudentStatus.ENROLLED})
  status: StudentStatus;

  @ApiPropertyOptional({
    description: 'Student email address',
   ) example: 'john.doe@student.example.com'})
  email?: string | null;

  @ApiPropertyOptional({
    description: 'Student phone number',
   ) example: '+27123456789'})
  phone?: string | null;

  @ApiPropertyOptional({
    description: 'Household ID if student belongs to a household',
   ) example: 'clxxx-xxxx-xxxx-xxxx'})
  householdId?: string | null;

  @ApiProperty({
    description: 'Date student was created',
   ) example: '2025-01-06T10:00:00.000Z'})
  createdAt: Date;

  @ApiProperty({
    description: 'Date student was last updated',
   ) example: '2025-01-06T10:00:00.000Z'})
  updatedAt: Date;
}
