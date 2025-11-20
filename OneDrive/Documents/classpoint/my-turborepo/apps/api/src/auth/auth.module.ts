import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '@classpoint/db';
import { AuthController } from './auth.controller';
import { AuthService, CognitoService } from './services';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard, RolesGuard } from './guards';

/**
 * Authentication Module
 *
 * Provides authentication and authorization functionality
 * - Cognito integration for user management
 * - JWT token validation
 * - Role-based access control (RBAC)
 * - Login, registration, and profile management
 */
@Module({
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'dev-secret-key'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION', '1h'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    CognitoService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    AuthService,
    CognitoService,
    JwtAuthGuard,
    RolesGuard,
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}
