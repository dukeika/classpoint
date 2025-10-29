import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsEnum,
  IsOptional,
} from 'class-validator';

/**
 * User roles in the system
 * SUPER_ADMIN: Platform administrator (ClassPoint staff)
 * SCHOOL_ADMIN: School administrator (principal, IT admin)
 * TEACHER: Teaching staff
 * PARENT: Parent/Guardian
 * STUDENT: Student (limited access)
 */
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',
  TEACHER = 'TEACHER',
  PARENT = 'PARENT',
  STUDENT = 'STUDENT',
}

/**
 * Register DTO
 * User registration with role-based signup
 */
export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@greenvalley.edu',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'User password (min 8 chars, must include uppercase, lowercase, number, special char)',
    example: 'SecurePass123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    }
  )
  password!: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName!: string;

  @ApiProperty({
    description: 'User phone number (optional)',
    example: '+27821234567',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message?: 'Phone number must be in valid international format',
  })
  phoneNumber?: string;

  @ApiProperty({
    description: 'User role',
    enum!: UserRole,
    example!: UserRole.TEACHER,
  })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiProperty({
    description: 'Tenant (school) ID - required for school-specific roles',
    example: 'cm4abc123xyz',
    required: false,
  })
  @IsOptional()
  @IsString()
  tenantId?: string;
}
