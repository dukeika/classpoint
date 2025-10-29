/**
 * Database Package
 *
 * Exports Prisma client, database module, and services.
 */

// Re-export everything from the generated Prisma client
export * from '.prisma/client/default';

// Export database service and module
export { PrismaService } from './prisma.service';
export { DatabaseModule } from './database.module';
export { DatabaseModule as PrismaModule } from './database.module'; // Alias for backward compatibility
