import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
  AdminDeleteUserCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  GlobalSignOutCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../dto/register.dto';

/**
 * CognitoService
 *
 * Handles all AWS Cognito operations for user authentication
 * Supports multiple user pools for different user types (staff, household, student)
 */
@Injectable()
export class CognitoService {
  private readonly logger = new Logger(CognitoService.name);
  private readonly cognitoClient: CognitoIdentityProviderClient;

  // User pool configuration
  private readonly staffPoolId: string;
  private readonly staffClientId: string;
  private readonly householdPoolId: string;
  private readonly householdClientId: string;
  private readonly studentPoolId: string;
  private readonly studentClientId: string;

  constructor(private readonly configService: ConfigService) {
    // Initialize Cognito client
    this.cognitoClient = new CognitoIdentityProviderClient({
      region: this.configService.get<string>('AWS_REGION', 'af-south-1'),
    });

    // Load pool configurations from environment
    this.staffPoolId = this.configService.get<string>('COGNITO_STAFF_POOL_ID', '');
    this.staffClientId = this.configService.get<string>('COGNITO_STAFF_CLIENT_ID', '');
    this.householdPoolId = this.configService.get<string>('COGNITO_HOUSEHOLD_POOL_ID', '');
    this.householdClientId = this.configService.get<string>('COGNITO_HOUSEHOLD_CLIENT_ID', '');
    this.studentPoolId = this.configService.get<string>('COGNITO_STUDENT_POOL_ID', '');
    this.studentClientId = this.configService.get<string>('COGNITO_STUDENT_CLIENT_ID', '');
  }

  /**
   * Get appropriate user pool based on role
   */
  private getUserPool(role: UserRole): { poolId: string; clientId: string } {
    switch (role) {
      case UserRole.SUPER_ADMIN:
      case UserRole.SCHOOL_ADMIN:
      case UserRole.TEACHER:
        return { poolId: this.staffPoolId, clientId: this.staffClientId };

      case UserRole.PARENT:
        return { poolId: this.householdPoolId, clientId: this.householdClientId };

      case UserRole.STUDENT:
        return { poolId: this.studentPoolId, clientId: this.studentClientId };

      default:
        throw new BadRequestException('Invalid user role');
    }
  }

  /**
   * Authenticate user with email and password
   */
  async authenticate(email: string, password: string, role: UserRole) {
    try {
      const { clientId } = this.getUserPool(role);

      const command = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: clientId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      });

      const response = await this.cognitoClient.send(command);

      if (!response.AuthenticationResult) {
        throw new UnauthorizedException('Authentication failed');
      }

      this.logger.log(`User authenticated successfully: ${email}`);

      return {
        accessToken: response.AuthenticationResult.AccessToken!,
        refreshToken: response.AuthenticationResult.RefreshToken!,
        idToken: response.AuthenticationResult.IdToken!,
        expiresIn: response.AuthenticationResult.ExpiresIn!,
      };
    } catch (error) {
      this.logger.error(`Authentication failed for ${email}: ${(error as Error).message}`, (error as Error).stack);

      if (error.name === 'NotAuthorizedException') {
        throw new UnauthorizedException('Invalid email or password');
      }
      if (error.name === 'UserNotFoundException') {
        throw new UnauthorizedException('User not found');
      }
      if (error.name === 'UserNotConfirmedException') {
        throw new UnauthorizedException('User email not confirmed');
      }

      throw new UnauthorizedException('Authentication failed');
    }
  }

  /**
   * Register new user (self-signup)
   */
  async signUp(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: UserRole,
    tenantId?: string,
    phoneNumber?: string
  ) {
    try {
      const { clientId } = this.getUserPool(role);

      const userAttributes = [
        { Name: 'email', Value: email },
        { Name: 'given_name', Value: firstName },
        { Name: 'family_name', Value: lastName },
        { Name: 'custom:role', Value: role },
      ];

      if (tenantId) {
        userAttributes.push({ Name: 'custom:tenantId', Value: tenantId });
      }

      if (phoneNumber) {
        userAttributes.push({ Name: 'phone_number', Value: phoneNumber });
      }

      const command = new SignUpCommand({
        ClientId: clientId,
        Username: email,
        Password: password,
        UserAttributes: userAttributes,
      });

      const response = await this.cognitoClient.send(command);

      this.logger.log(`User signed up successfully: ${email}`);

      return {
        userSub: response.UserSub!,
        userConfirmed: response.UserConfirmed,
      };
    } catch (error) {
      this.logger.error(`Sign up failed for ${email}: ${(error as Error).message}`, (error as Error).stack);

      if (error.name === 'UsernameExistsException') {
        throw new BadRequestException('User with this email already exists');
      }
      if (error.name === 'InvalidPasswordException') {
        throw new BadRequestException('Password does not meet requirements');
      }

      throw new BadRequestException('Sign up failed');
    }
  }

  /**
   * Create user as admin (no password required, auto-verified)
   */
  async adminCreateUser(
    email: string,
    firstName: string,
    lastName: string,
    role: UserRole,
    tenantId?: string,
    phoneNumber?: string,
    temporaryPassword?: string
  ) {
    try {
      const { poolId } = this.getUserPool(role);

      const userAttributes = [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'given_name', Value: firstName },
        { Name: 'family_name', Value: lastName },
        { Name: 'custom:role', Value: role },
      ];

      if (tenantId) {
        userAttributes.push({ Name: 'custom:tenantId', Value: tenantId });
      }

      if (phoneNumber) {
        userAttributes.push({ Name: 'phone_number', Value: phoneNumber });
      }

      const command = new AdminCreateUserCommand({
        UserPoolId: poolId,
        Username: email,
        UserAttributes: userAttributes,
        TemporaryPassword: temporaryPassword,
        MessageAction: temporaryPassword ? 'SUPPRESS' : 'RESEND',
      });

      const response = await this.cognitoClient.send(command);

      this.logger.log(`User created by admin: ${email}`);

      return {
        username: response.User!.Username!,
        enabled: response.User!.Enabled,
        userStatus: response.User!.UserStatus,
      };
    } catch (error) {
      this.logger.error(`Admin create user failed for ${email}: ${(error as Error).message}`, (error as Error).stack);

      if (error.name === 'UsernameExistsException') {
        throw new BadRequestException('User with this email already exists');
      }

      throw new BadRequestException('Failed to create user');
    }
  }

  /**
   * Set permanent password for user (admin)
   */
  async adminSetUserPassword(
    email: string,
    password: string,
    role: UserRole,
    permanent: boolean = true
  ) {
    try {
      const { poolId } = this.getUserPool(role);

      const command = new AdminSetUserPasswordCommand({
        UserPoolId: poolId,
        Username: email,
        Password: password,
        Permanent: permanent,
      });

      await this.cognitoClient.send(command);

      this.logger.log(`Password set for user: ${email}`);
    } catch (error) {
      this.logger.error(`Set password failed for ${email}: ${(error as Error).message}`, (error as Error).stack);
      throw new BadRequestException('Failed to set password');
    }
  }

  /**
   * Get user details
   */
  async getUser(email: string, role: UserRole) {
    try {
      const { poolId } = this.getUserPool(role);

      const command = new AdminGetUserCommand({
        UserPoolId: poolId,
        Username: email,
      });

      const response = await this.cognitoClient.send(command);

      return {
        username: response.Username,
        enabled: response.Enabled,
        userStatus: response.UserStatus,
        attributes: response.UserAttributes?.reduce((acc, attr) => {
          acc[attr.Name] = attr.Value;
          return acc;
        }, {} as Record<string, string>),
      };
    } catch (error) {
      this.logger.error(`Get user failed for ${email}: ${(error as Error).message}`, (error as Error).stack);
      throw new BadRequestException('User not found');
    }
  }

  /**
   * Update user attributes
   */
  async updateUserAttributes(
    email: string,
    role: UserRole,
    attributes: Record<string, string>
  ) {
    try {
      const { poolId } = this.getUserPool(role);

      const userAttributes = Object.entries(attributes).map(([key, value]) => ({
        Name: key,
        Value: value,
      }));

      const command = new AdminUpdateUserAttributesCommand({
        UserPoolId: poolId,
        Username: email,
        UserAttributes: userAttributes,
      });

      await this.cognitoClient.send(command);

      this.logger.log(`User attributes updated: ${email}`);
    } catch (error) {
      this.logger.error(`Update user failed for ${email}: ${(error as Error).message}`, (error as Error).stack);
      throw new BadRequestException('Failed to update user');
    }
  }

  /**
   * Delete user
   */
  async deleteUser(email: string, role: UserRole) {
    try {
      const { poolId } = this.getUserPool(role);

      const command = new AdminDeleteUserCommand({
        UserPoolId: poolId,
        Username: email,
      });

      await this.cognitoClient.send(command);

      this.logger.log(`User deleted: ${email}`);
    } catch (error) {
      this.logger.error(`Delete user failed for ${email}: ${(error as Error).message}`, (error as Error).stack);
      throw new BadRequestException('Failed to delete user');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string, role: UserRole) {
    try {
      const { clientId } = this.getUserPool(role);

      const command = new InitiateAuthCommand({
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: clientId,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
      });

      const response = await this.cognitoClient.send(command);

      if (!response.AuthenticationResult) {
        throw new UnauthorizedException('Token refresh failed');
      }

      return {
        accessToken: response.AuthenticationResult.AccessToken!,
        idToken: response.AuthenticationResult.IdToken!,
        expiresIn: response.AuthenticationResult.ExpiresIn!,
      };
    } catch (error) {
      this.logger.error(`Token refresh failed: ${(error as Error).message}`, (error as Error).stack);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Confirm user signup (verify email)
   */
  async confirmSignUp(email: string, confirmationCode: string, role: UserRole) {
    try {
      const { clientId } = this.getUserPool(role);

      const command = new ConfirmSignUpCommand({
        ClientId: clientId,
        Username: email,
        ConfirmationCode: confirmationCode,
      });

      await this.cognitoClient.send(command);

      this.logger.log(`User confirmed: ${email}`);
    } catch (error) {
      this.logger.error(`Confirm signup failed for ${email}: ${(error as Error).message}`, (error as Error).stack);
      throw new BadRequestException('Invalid confirmation code');
    }
  }

  /**
   * Initiate password reset
   */
  async forgotPassword(email: string, role: UserRole) {
    try {
      const { clientId } = this.getUserPool(role);

      const command = new ForgotPasswordCommand({
        ClientId: clientId,
        Username: email,
      });

      await this.cognitoClient.send(command);

      this.logger.log(`Password reset initiated for: ${email}`);
    } catch (error) {
      this.logger.error(`Forgot password failed for ${email}: ${(error as Error).message}`, (error as Error).stack);
      throw new BadRequestException('Failed to initiate password reset');
    }
  }

  /**
   * Confirm password reset
   */
  async confirmForgotPassword(
    email: string,
    confirmationCode: string,
    newPassword: string,
    role: UserRole
  ) {
    try {
      const { clientId } = this.getUserPool(role);

      const command = new ConfirmForgotPasswordCommand({
        ClientId: clientId,
        Username: email,
        ConfirmationCode: confirmationCode,
        Password: newPassword,
      });

      await this.cognitoClient.send(command);

      this.logger.log(`Password reset confirmed for: ${email}`);
    } catch (error) {
      this.logger.error(`Confirm password reset failed for ${email}: ${(error as Error).message}`, (error as Error).stack);
      throw new BadRequestException('Failed to reset password');
    }
  }

  /**
   * Sign out user globally (invalidate all tokens)
   */
  async globalSignOut(accessToken: string) {
    try {
      const command = new GlobalSignOutCommand({
        AccessToken: accessToken,
      });

      await this.cognitoClient.send(command);

      this.logger.log('User signed out globally');
    } catch (error) {
      this.logger.error(`Global sign out failed: ${(error as Error).message}`, (error as Error).stack);
      throw new UnauthorizedException('Sign out failed');
    }
  }
}
