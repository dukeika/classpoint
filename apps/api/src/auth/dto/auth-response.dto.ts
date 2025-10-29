import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from './register.dto';

/**
 * Authentication Response DTO
 * Returned after successful login or token refresh
 */
export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token for obtaining new access tokens',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Token type (always Bearer)',
    example: 'Bearer',
  })
  tokenType: string;

  @ApiProperty({
    description: 'Access token expiration in seconds',
    example: 3600,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'User information',
  })
  user: {;
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    tenantId?: string;
    tenant?: {
      id: string;
      code: string;
      name: string;
    };
  };

  constructor(partial: Partial<AuthResponseDto>) {
    Object.assign(this, partial);
    this.tokenType = 'Bearer';
  }
}
