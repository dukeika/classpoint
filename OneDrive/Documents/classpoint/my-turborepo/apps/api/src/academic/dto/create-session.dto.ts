import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Min, Max, MinLength, MaxLength } from 'class-validator';

/**
 * Create Session DTO
 * Academic session/year (e.g., "2024/2025")
 */
export class CreateSessionDto {
  @ApiProperty({
    description: 'Academic session name',
    example: '2024/2025',
  })
  @IsString()
  @MinLength(7)
  @MaxLength(20)
  name!: string;

  @ApiProperty({
    description: 'Start year of the session',
    example: 2024,
  })
  @IsInt()
  @Min(2000)
  @Max(2100)
  startYear!: number;

  @ApiProperty({
    description: 'End year of the session',
    example: 2025,
  })
  @IsInt()
  @Min(2000)
  @Max(2100)
  endYear!: number;
}
