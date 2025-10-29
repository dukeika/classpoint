import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

interface JwtSecrets {
  JWT_SECRET: string;
  JWT_EXPIRATION: string;
}

interface DatabaseSecrets {
  DATABASE_URL: string;
}

/**
 * Service for securely retrieving secrets from AWS Secrets Manager
 * Falls back to environment variables in development
 */
@Injectable()
export class SecretsService {
  private readonly logger = new Logger(SecretsService.name);
  private readonly client: SecretsManagerClient;
  private readonly region: string;
  private readonly isProduction: boolean;
  private jwtSecretsCache?: JwtSecrets;
  private databaseSecretsCache?: DatabaseSecrets;

  constructor(private configService: ConfigService) {
    this.region = this.configService.get('AWS_REGION', 'af-south-1');
    this.isProduction =
      this.configService.get('NODE_ENV') === 'production';

    this.client = new SecretsManagerClient({ region: this.region });
    this.logger.log(`SecretsService initialized for region: ${this.region}`);
    this.logger.log(`Environment: ${this.isProduction ? 'production' : 'development'}`);
  }

  /**
   * Retrieves JWT secrets from Secrets Manager or environment variables
   */
  async getJwtSecrets(): Promise<JwtSecrets> {
    // Return cached value if available
    if (this.jwtSecretsCache) {
      return this.jwtSecretsCache;
    }

    // In development, use environment variables
    if (!this.isProduction) {
      this.logger.debug('Using JWT secrets from environment variables');
      this.jwtSecretsCache = {
        JWT_SECRET: this.configService.get(
          'JWT_SECRET',
          'dev-secret-change-me',
        ),
        JWT_EXPIRATION: this.configService.get('JWT_EXPIRATION', '1d'),
      };
      return this.jwtSecretsCache;
    }

    // In production, fetch from Secrets Manager
    try {
      const secretName = this.configService.get(
        'JWT_SECRET_NAME',
        'classpoint/prod/jwt-secret',
      );

      this.logger.log(`Fetching JWT secrets from Secrets Manager: ${secretName}`);

      const command = new GetSecretValueCommand({ SecretId: secretName });
      const response = await this.client.send(command);

      if (!response.SecretString) {
        throw new Error('Secret value is empty');
      }

      this.jwtSecretsCache = JSON.parse(response.SecretString) as JwtSecrets;
      this.logger.log('Successfully retrieved JWT secrets from Secrets Manager');

      return this.jwtSecretsCache;
    } catch (error) {
      this.logger.error('Failed to retrieve JWT secrets from Secrets Manager', error);

      // Fallback to environment variables
      this.logger.warn('Falling back to environment variables for JWT secrets');
      this.jwtSecretsCache = {
        JWT_SECRET: this.configService.get(
          'JWT_SECRET',
          'dev-secret-change-me',
        ),
        JWT_EXPIRATION: this.configService.get('JWT_EXPIRATION', '1d'),
      };

      return this.jwtSecretsCache;
    }
  }

  /**
   * Retrieves database secrets from Secrets Manager or environment variables
   */
  async getDatabaseSecrets(): Promise<DatabaseSecrets> {
    // Return cached value if available
    if (this.databaseSecretsCache) {
      return this.databaseSecretsCache;
    }

    // In development, use environment variables
    if (!this.isProduction) {
      this.logger.debug('Using database secrets from environment variables');
      this.databaseSecretsCache = {
        DATABASE_URL: this.configService.get('DATABASE_URL', ''),
      };
      return this.databaseSecretsCache;
    }

    // In production, fetch from Secrets Manager
    try {
      const secretName = this.configService.get(
        'DATABASE_SECRET_NAME',
        'classpoint/prod/database',
      );

      this.logger.log(`Fetching database secrets from Secrets Manager: ${secretName}`);

      const command = new GetSecretValueCommand({ SecretId: secretName });
      const response = await this.client.send(command);

      if (!response.SecretString) {
        throw new Error('Secret value is empty');
      }

      this.databaseSecretsCache = JSON.parse(
        response.SecretString,
      ) as DatabaseSecrets;
      this.logger.log('Successfully retrieved database secrets from Secrets Manager');

      return this.databaseSecretsCache;
    } catch (error) {
      this.logger.error('Failed to retrieve database secrets from Secrets Manager', error);

      // Fallback to environment variables
      this.logger.warn('Falling back to environment variables for database secrets');
      this.databaseSecretsCache = {
        DATABASE_URL: this.configService.get('DATABASE_URL', ''),
      };

      return this.databaseSecretsCache;
    }
  }

  /**
   * Clears the secrets cache (useful for testing or rotation)
   */
  clearCache(): void {
    this.logger.log('Clearing secrets cache');
    this.jwtSecretsCache = undefined;
    this.databaseSecretsCache = undefined;
  }

  /**
   * Gets a specific secret value by key from JWT secrets
   */
  async getJwtSecret(key: keyof JwtSecrets): Promise<string> {
    const secrets = await this.getJwtSecrets();
    return secrets[key];
  }

  /**
   * Gets the database URL
   */
  async getDatabaseUrl(): Promise<string> {
    const secrets = await this.getDatabaseSecrets();
    return secrets.DATABASE_URL;
  }
}
