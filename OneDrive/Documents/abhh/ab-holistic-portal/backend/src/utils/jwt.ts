import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-client';
import { CognitoIdentityProviderClient, GetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { JWTPayload, UserRole, Permission } from '../types';
import { Logger } from './logger';

const logger = new Logger('JWTUtil');

export interface CognitoTokenPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  given_name?: string;
  family_name?: string;
  'cognito:groups'?: string[];
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  token_use: 'access' | 'id';
}

export interface TokenValidationResult {
  isValid: boolean;
  payload?: JWTPayload;
  error?: string;
}

export class JWTUtil {
  private static instance: JWTUtil;
  private cognitoClient: CognitoIdentityProviderClient;
  private jwtSecret: string;
  private userPoolId: string;
  private userPoolWebClientId: string;
  private region: string;
  private jwksClient: jwksClient.JwksClient;

  private constructor() {
    this.region = process.env.REGION || 'us-west-1';
    this.cognitoClient = new CognitoIdentityProviderClient({
      region: this.region
    });
    this.jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    this.userPoolId = process.env.COGNITO_USER_POOL_ID || process.env.USER_POOL_ID || '';
    this.userPoolWebClientId = process.env.COGNITO_USER_POOL_WEB_CLIENT_ID || '';

    // Initialize JWKS client for Cognito
    const jwksUri = `https://cognito-idp.${this.region}.amazonaws.com/${this.userPoolId}/.well-known/jwks.json`;
    this.jwksClient = jwksClient({
      jwksUri,
      cache: true,
      cacheMaxAge: 600000, // 10 minutes
      cacheMaxEntries: 5,
      timeout: 30000
    });

    if (!process.env.JWT_SECRET) {
      logger.warn('JWT_SECRET not set in environment variables, using fallback');
    }

    if (!this.userPoolId) {
      logger.error('COGNITO_USER_POOL_ID not set in environment variables');
    }

    if (!this.userPoolWebClientId) {
      logger.error('COGNITO_USER_POOL_WEB_CLIENT_ID not set in environment variables');
    }
  }

  public static getInstance(): JWTUtil {
    if (!JWTUtil.instance) {
      JWTUtil.instance = new JWTUtil();
    }
    return JWTUtil.instance;
  }

  /**
   * Validates an access token from AWS Cognito
   */
  public async validateAccessToken(token: string): Promise<TokenValidationResult> {
    try {
      // Remove 'Bearer ' prefix if present
      const cleanToken = token.replace(/^Bearer\s+/i, '');

      // Verify token format
      if (!cleanToken || cleanToken.split('.').length !== 3) {
        return {
          isValid: false,
          error: 'Invalid token format'
        };
      }

      // First verify the token with Cognito
      const cognitoValidation = await this.validateCognitoToken(cleanToken);
      if (!cognitoValidation.isValid) {
        return cognitoValidation;
      }

      // Convert Cognito payload to our JWT payload format
      const cognitoPayload = cognitoValidation.payload as unknown as CognitoTokenPayload;
      const cognitoGroups = cognitoPayload['cognito:groups'] || [];
      const userRole = this.mapCognitoGroupToRole(cognitoGroups);
      const permissions = this.mapRoleToPermissions(userRole);

      logger.info('Converting Cognito payload to JWT payload', {
        userId: cognitoPayload.sub,
        cognitoGroups,
        mappedRole: userRole,
        mappedPermissions: permissions
      });

      const jwtPayload: JWTPayload = {
        sub: cognitoPayload.sub,
        email: cognitoPayload.email,
        role: userRole,
        permissions: permissions,
        iat: cognitoPayload.iat,
        exp: cognitoPayload.exp,
        iss: cognitoPayload.iss,
        aud: cognitoPayload.aud
      };

      return {
        isValid: true,
        payload: jwtPayload
      };

    } catch (error) {
      logger.error('Token validation error:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Token validation failed'
      };
    }
  }

  /**
   * Get signing key from JWKS
   */
  private async getSigningKey(kid: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.jwksClient.getSigningKey(kid, (err, key) => {
        if (err) {
          logger.error('Failed to get signing key from JWKS:', err);
          reject(err);
          return;
        }

        const signingKey = key?.getPublicKey();
        if (!signingKey) {
          reject(new Error('No signing key found'));
          return;
        }

        resolve(signingKey);
      });
    });
  }

  /**
   * Validates a Cognito JWT token using JWKS
   */
  private async validateCognitoToken(token: string): Promise<TokenValidationResult> {
    try {
      // Decode token without verification first to get header and payload
      const decoded = jwt.decode(token, { complete: true });

      if (!decoded || typeof decoded === 'string') {
        return {
          isValid: false,
          error: 'Invalid token structure'
        };
      }

      const header = decoded.header;
      const payload = decoded.payload as CognitoTokenPayload;

      // Verify token has key ID in header
      if (!header.kid) {
        return {
          isValid: false,
          error: 'Token missing key ID'
        };
      }

      // Get the signing key for this token
      const signingKey = await this.getSigningKey(header.kid);

      // Verify the token signature
      const expectedIssuer = `https://cognito-idp.${this.region}.amazonaws.com/${this.userPoolId}`;

      const verifyOptions: jwt.VerifyOptions = {
        issuer: expectedIssuer,
        audience: this.userPoolWebClientId,
        algorithms: ['RS256'],
        clockTolerance: 300 // Allow 5 minutes clock skew
      };

      // Verify token signature and claims
      const verifiedPayload = jwt.verify(token, signingKey, verifyOptions) as CognitoTokenPayload;

      // Additional validations
      if (verifiedPayload.token_use !== 'access' && verifiedPayload.token_use !== 'id') {
        return {
          isValid: false,
          error: 'Invalid token use'
        };
      }

      // For access tokens, optionally verify against Cognito (more intensive)
      // For now, we'll trust the JWKS validation
      if (verifiedPayload.token_use === 'access' && process.env.VERIFY_WITH_COGNITO === 'true') {
        try {
          const getUserCommand = new GetUserCommand({
            AccessToken: token
          });
          await this.cognitoClient.send(getUserCommand);
        } catch (cognitoError) {
          logger.error('Cognito token verification failed:', cognitoError);
          return {
            isValid: false,
            error: 'Token rejected by Cognito'
          };
        }
      }

      return {
        isValid: true,
        payload: verifiedPayload
      };

    } catch (error) {
      logger.error('Cognito token validation error:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Token validation failed'
      };
    }
  }

  /**
   * Maps Cognito groups to our UserRole enum
   */
  private mapCognitoGroupToRole(groups?: string[]): UserRole {
    if (!groups || groups.length === 0) {
      return UserRole.APPLICANT;
    }

    logger.info('Mapping Cognito groups to role', { groups });

    // Check for highest privilege first
    if (groups.includes('SuperAdmins') || groups.includes('superadmin') || groups.includes('super_admin')) {
      return UserRole.SUPER_ADMIN;
    }
    if (groups.includes('Admins') || groups.includes('admins') || groups.includes('admin')) {
      return UserRole.ADMIN;
    }
    if (groups.includes('Applicants') || groups.includes('applicants') || groups.includes('applicant')) {
      return UserRole.APPLICANT;
    }

    // Default to applicant if no recognized groups
    logger.warn('No recognized groups found, defaulting to APPLICANT', { groups });
    return UserRole.APPLICANT;
  }

  /**
   * Maps user roles to permissions
   */
  private mapRoleToPermissions(role: UserRole): Permission[] {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return Object.values(Permission);

      case UserRole.ADMIN:
        return [
          Permission.CREATE_JOB,
          Permission.UPDATE_JOB,
          Permission.VIEW_ALL_JOBS,
          Permission.VIEW_ALL_APPLICATIONS,
          Permission.UPDATE_APPLICATION_STAGE,
          Permission.ASSIGN_INTERVIEWER,
          Permission.VIEW_TEST_SUBMISSIONS,
          Permission.GRADE_TESTS,
          Permission.VIEW_ANALYTICS
        ];

      case UserRole.APPLICANT:
      default:
        return [];
    }
  }

  /**
   * Generates a custom JWT token for internal use
   */
  public generateCustomToken(payload: Partial<JWTPayload>, expiresIn: string = '24h'): string {
    const tokenPayload: JWTPayload = {
      sub: payload.sub || '',
      email: payload.email || '',
      role: payload.role || UserRole.APPLICANT,
      permissions: payload.permissions || [],
      iat: Math.floor(Date.now() / 1000),
      exp: 0, // Will be set by jwt.sign
      iss: 'ab-holistic-portal',
      aud: 'ab-holistic-portal-api'
    };

    return jwt.sign(tokenPayload, this.jwtSecret, {
      expiresIn,
      issuer: 'ab-holistic-portal',
      audience: 'ab-holistic-portal-api'
    });
  }

  /**
   * Verifies a custom JWT token
   */
  public verifyCustomToken(token: string): TokenValidationResult {
    try {
      const payload = jwt.verify(token, this.jwtSecret, {
        issuer: 'ab-holistic-portal',
        audience: 'ab-holistic-portal-api'
      }) as JWTPayload;

      return {
        isValid: true,
        payload
      };

    } catch (error) {
      logger.error('Custom token verification failed:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Token verification failed'
      };
    }
  }

  /**
   * Extracts token from Authorization header
   */
  public static extractTokenFromHeader(authorizationHeader?: string): string | null {
    if (!authorizationHeader) {
      return null;
    }

    const parts = authorizationHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * Checks if user has specific permission
   */
  public static hasPermission(userPayload: JWTPayload, requiredPermission: Permission): boolean {
    return userPayload.permissions?.includes(requiredPermission) || false;
  }

  /**
   * Checks if user has admin role
   */
  public static isAdmin(userPayload: JWTPayload): boolean {
    return userPayload.role === UserRole.ADMIN || userPayload.role === UserRole.SUPER_ADMIN;
  }

  /**
   * Checks if user has super admin role
   */
  public static isSuperAdmin(userPayload: JWTPayload): boolean {
    return userPayload.role === UserRole.SUPER_ADMIN;
  }
}

export default JWTUtil;