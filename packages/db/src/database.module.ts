import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Database Module
 *
 * Global module that provides Prisma service across the application.
 * Import this module once in your root AppModule.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
