import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddMemberDto {
  @ApiProperty({
    description: 'Relationship to) student (e.g., Father, Mother, Guardian)',
    example: 'Father',
    minLength: 2,
    maxLength: 50})
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  relationship: string;

  @ApiPropertyOptional({
    description: 'User ID if this member has a login account',
   ) example: 'clx1234567890'})
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Student ID to link to this household',
   ) example: 'clx0987654321'})
  @IsOptional()
  @IsString()
  studentId?: string;
}
