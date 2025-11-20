/**
 * Database Package
 *
 * Exports Prisma client, database module, and services.
 */
export * from '.prisma/client';
export { PrismaService } from './prisma.service';
export { DatabaseModule } from './database.module';
export { DatabaseModule as PrismaModule } from './database.module';
