import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/**
 * Refresh Token DTO
 * Used to obtain new access token using refresh token
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token obtained from login',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  refreshToken!: string;
}
