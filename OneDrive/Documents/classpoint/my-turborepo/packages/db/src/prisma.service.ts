import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '.prisma/client';

/**
 * Prisma Service
 *
 * Manages database connections and provides Prisma client instance.
 * Includes connection pooling, logging, and graceful shutdown.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],
      errorFormat: 'pretty',
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connection established successfully');

      // Log slow queries in development
      if (process.env.NODE_ENV === 'development') {
        this.$on('query' as never, (e: any) => {
          if (e.duration > 1000) {
            this.logger.warn(`Slow query detected (${e.duration}ms): ${e.query}`);
          }
        });
      }
    } catch (error) {
      this.logger.error('❌ Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Database connection closed');
    } catch (error) {
      this.logger.error('Error disconnecting from database', error);
    }
  }

  /**
   * Clean database (use with caution - for testing only!)
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production!');
    }

    const models = Reflect.ownKeys(this).filter(
      key => typeof key === 'string' && key[0] !== '_' && key !== 'constructor'
    );

    return Promise.all(
      models.map(modelKey => {
        const model = this[modelKey as keyof typeof this];
        if (model && typeof model === 'object' && 'deleteMany' in model) {
          return (model as any).deleteMany();
        }
      })
    );
  }

  /**
   * Enable query logging for debugging
   */
  enableQueryLogging() {
    this.$on('query' as never, (e: any) => {
      this.logger.debug(`Query: ${e.query}`);
      this.logger.debug(`Duration: ${e.duration}ms`);
    });
  }
}
