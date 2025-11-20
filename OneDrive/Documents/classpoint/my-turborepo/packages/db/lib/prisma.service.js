"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require(".prisma/client");
/**
 * Prisma Service
 *
 * Manages database connections and provides Prisma client instance.
 * Includes connection pooling, logging, and graceful shutdown.
 */
let PrismaService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = client_1.PrismaClient;
    var PrismaService = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            PrismaService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        logger = new common_1.Logger(PrismaService.name);
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
                    this.$on('query', (e) => {
                        if (e.duration > 1000) {
                            this.logger.warn(`Slow query detected (${e.duration}ms): ${e.query}`);
                        }
                    });
                }
            }
            catch (error) {
                this.logger.error('❌ Failed to connect to database', error);
                throw error;
            }
        }
        async onModuleDestroy() {
            try {
                await this.$disconnect();
                this.logger.log('Database connection closed');
            }
            catch (error) {
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
            const models = Reflect.ownKeys(this).filter(key => typeof key === 'string' && key[0] !== '_' && key !== 'constructor');
            return Promise.all(models.map(modelKey => {
                const model = this[modelKey];
                if (model && typeof model === 'object' && 'deleteMany' in model) {
                    return model.deleteMany();
                }
            }));
        }
        /**
         * Enable query logging for debugging
         */
        enableQueryLogging() {
            this.$on('query', (e) => {
                this.logger.debug(`Query: ${e.query}`);
                this.logger.debug(`Duration: ${e.duration}ms`);
            });
        }
    };
    return PrismaService = _classThis;
})();
exports.PrismaService = PrismaService;
