import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
/**
 * Prisma Service
 *
 * Manages database connections and provides Prisma client instance.
 * Includes connection pooling, logging, and graceful shutdown.
 */
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    /**
     * Clean database (use with caution - for testing only!)
     */
    cleanDatabase(): Promise<any[]>;
    /**
     * Enable query logging for debugging
     */
    enableQueryLogging(): void;
}
