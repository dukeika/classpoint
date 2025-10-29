import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@classpoint/db';
import { CognitoService } from './cognito.service';
import { LoginDto, RegisterDto, AuthResponseDto, UserRole } from '../dto';

/**
 * AuthService
 *
 * Main authentication service that coordinates between Cognito and database
 * Handles user registration, login, token refresh, and user management
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly cognitoService: CognitoService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Login user
   */
  async login(loginDto: LoginDto, role: UserRole): Promise<AuthResponseDto> {
    try {
      // Authenticate with Cognito
      const tokens = await this.cognitoService.authenticate(
        loginDto.email,
        loginDto.password,
        role
      );

      // Decode ID token to get user info
      const decoded = this.jwtService.decode(tokens.idToken) as any;

      // Fetch or create user in database
      let user = await this.prisma.user.findUnique({
        where: { email: loginDto.email },
        include: {
          tenant: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      });

      if (!user) {
        // Create user record from Cognito data
        user = await this.prisma.user.create({
          data: {
            email: loginDto.email,
            cognitoSub: decoded.sub,
            firstName: decoded.given_name || '',
            lastName: decoded.family_name || '',
            role: role,
            tenantId: decoded['custom:tenantId'],
          },
          include: {
            tenant: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        });
      }

      this.logger.log(`User logged in: ${user.email} (${user.role})`);

      return new AuthResponseDto({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        tokenType: 'Bearer',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role as UserRole,
          tenantId: user.tenantId || undefined,
          tenant: user.tenant || undefined,
        },
      });
    } catch (error) {
      this.logger.error(`Login failed for ${loginDto.email}: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Register new user
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    try {
      // Validate tenant exists if provided
      if (registerDto.tenantId) {
        const tenant = await this.prisma.tenant.findUnique({
          where: { id: registerDto.tenantId },
        });

        if (!tenant) {
          throw new BadRequestException('Invalid tenant ID');
        }

        if (tenant.status !== 'ACTIVE') {
          throw new BadRequestException('Tenant is not active');
        }
      }

      // Check if user already exists in database
      const existingUser = await this.prisma.user.findUnique({
        where: { email: registerDto.email },
      });

      if (existingUser) {
        throw new BadRequestException('User with this email already exists');
      }

      // Create user in Cognito (admin create for auto-verification)
      const cognitoUser = await this.cognitoService.adminCreateUser(
        registerDto.email,
        registerDto.firstName,
        registerDto.lastName,
        registerDto.role,
        registerDto.tenantId,
        registerDto.phoneNumber
      );

      // Set permanent password
      await this.cognitoService.adminSetUserPassword(
        registerDto.email,
        registerDto.password,
        registerDto.role,
        true
      );

      // Get Cognito user details to get sub
      const cognitoDetails = await this.cognitoService.getUser(
        registerDto.email,
        registerDto.role
      );

      // Create user in database
      const user = await this.prisma.user.create({
        data: {
          email: registerDto.email,
          cognitoSub: cognitoDetails.attributes!.sub,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          phoneNumber: registerDto.phoneNumber,
          role: registerDto.role,
          tenantId: registerDto.tenantId,
        },
        include: {
          tenant: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      });

      this.logger.log(`User registered: ${user.email} (${user.role})`);

      // Auto-login after registration
      const tokens = await this.cognitoService.authenticate(
        registerDto.email,
        registerDto.password,
        registerDto.role
      );

      return new AuthResponseDto({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        tokenType: 'Bearer',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role as UserRole,
          tenantId: user.tenantId || undefined,
          tenant: user.tenant || undefined,
        },
      });
    } catch (error) {
      this.logger.error(
        `Registration failed for ${registerDto.email}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string, email: string): Promise<AuthResponseDto> {
    try {
      // Get user from database
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: {
          tenant: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Refresh token with Cognito
      const tokens = await this.cognitoService.refreshToken(
        refreshToken,
        user.role as UserRole
      );

      this.logger.log(`Token refreshed for: ${user.email}`);

      return new AuthResponseDto({
        accessToken: tokens.accessToken,
        refreshToken: refreshToken, // Same refresh token
        expiresIn: tokens.expiresIn,
        tokenType: 'Bearer',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role as UserRole,
          tenantId: user.tenantId || undefined,
          tenant: user.tenant || undefined,
        },
      });
    } catch (error) {
      this.logger.error(`Token refresh failed: ${(error as Error).message}`, (error as Error).stack);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      role: user.role,
      tenantId: user.tenantId,
      tenant: user.tenant,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Validate JWT token and return user
   */
  async validateUser(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { email: payload.email },
      include: {
        tenant: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      tenant: user.tenant,
    };
  }

  /**
   * Global sign out
   */
  async signOut(accessToken: string) {
    await this.cognitoService.globalSignOut(accessToken);
    this.logger.log('User signed out');
  }
}
