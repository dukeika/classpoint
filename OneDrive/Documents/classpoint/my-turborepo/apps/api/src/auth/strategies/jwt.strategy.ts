import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';

/**
 * JWT Strategy
 *
 * Validates JWT tokens from Cognito
 * Extracts user information and attaches to request
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: (request, rawJwtToken, done) => {
        // For Cognito tokens, we'll use the Cognito public keys
        // This is a simplified version - in production, use jwks-rsa
        const secret = configService.get<string>('JWT_SECRET', 'dev-secret-key');
        done(null, secret);
      },
      audience: configService.get<string>('COGNITO_CLIENT_ID'),
      issuer: `https://cognito-idp.${configService.get<string>('AWS_REGION', 'af-south-1')}.amazonaws.com/${configService.get<string>('COGNITO_USER_POOL_ID')}`,
    });
  }

  /**
   * Validate JWT payload
   * This method is called automatically by Passport after token verification
   */
  async validate(payload: any) {
    try {
      // Validate user exists in database
      const user = await this.authService.validateUser(payload);

      // Return user object - will be attached to request as req.user
      return user;
    } catch (error) {
      throw new UnauthorizedException('Invalid token or user not found');
    }
  }
}
