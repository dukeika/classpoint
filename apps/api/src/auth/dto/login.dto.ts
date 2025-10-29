import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * Login DTO
 * User authentication with email and password
 */
export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@greenvalley.edu',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePass123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string;
}
