import { Module, Global } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { SecretsService } from './secrets.service';

/**
 * Global configuration module that provides:
 * - Environment variable loading
 * - AWS Secrets Manager integration
 * - Configuration validation
 */
@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),
  ],
  providers: [SecretsService],
  exports: [SecretsService],
})
export class ConfigModule {}
