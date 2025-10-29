import { IsString, IsInt, Min, IsOptional, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlanDto {
  @ApiProperty({
    description: 'Plan name',
    example: 'Standard Plan',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    description: 'Maximum number of students allowed',
    example: 500,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  studentCap!: number;

  @ApiPropertyOptional({
    description: 'Plan description',
    example: 'Suitable for medium-sized schools with up to 500 students',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description: string;
}
