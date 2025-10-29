import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './services/auth.service';
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  AuthResponseDto,
  UserRole,
} from './dto';
import { Public, CurrentUser, Roles } from './decorators';
import { JwtAuthGuard, RolesGuard } from './guards';

/**
 * Authentication Controller
 *
 * Handles user authentication, registration, and profile management
 */
@ApiTags('auth')
@Controller('auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Login endpoint
   * Authenticates user with email and password
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Query('role') role: UserRole = UserRole.TEACHER,
  ): Promise<AuthResponseDto> {
    return this.authService.login(loginDto, role);
  }

  /**
   * Register endpoint
   * Creates new user account
   */
  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register new user account' })
  @ApiResponse({
    status: 201,
    description: 'Registration successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input or user already exists' })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  /**
   * Refresh token endpoint
   * Obtains new access token using refresh token
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Query('email') email: string,
  ): Promise<AuthResponseDto> {
    return this.authService.refreshToken(refreshTokenDto.refreshToken, email);
  }

  /**
   * Get current user profile
   */
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser('sub') userId: string) {
    return this.authService.getProfile(userId);
  }

  /**
   * Sign out (invalidate all tokens)
   */
  @Post('signout')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Sign out user (invalidate all tokens)' })
  @ApiResponse({ status: 204, description: 'Signed out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async signOut(@CurrentUser() user: any) {
    // Extract access token from user object
    // Note: In real implementation, extract from request headers
    return this.authService.signOut(user.accessToken);
  }

  /**
   * Test endpoint - Admin only
   */
  @Get('admin-test')
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Test endpoint for admin users' })
  @ApiResponse({ status: 200, description: 'Access granted' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async adminTest(@CurrentUser() user: any) {
    return {
      message: 'Admin access granted',
      user: {
        id: user.sub,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Test endpoint - Teacher and above
   */
  @Get('teacher-test')
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Test endpoint for teachers and admins' })
  @ApiResponse({ status: 200, description: 'Access granted' })
  @ApiResponse({ status: 403, description: 'Forbidden - Teacher role or higher required' })
  async teacherTest(@CurrentUser() user: any) {
    return {
      message: 'Teacher access granted',
      user: {
        id: user.sub,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Test endpoint - Public (no authentication required)
   */
  @Public()
  @Get('public-test')
  @ApiOperation({ summary: 'Public test endpoint (no auth required)' })
  @ApiResponse({ status: 200, description: 'Public access granted' })
  async publicTest() {
    return {
      message: 'Public endpoint - no authentication required',
      timestamp: new Date().toISOString(),
    };
  }
}
