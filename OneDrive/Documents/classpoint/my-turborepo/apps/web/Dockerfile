# Multi-stage build for Next.js with Turborepo
# Using regular Next.js server (not standalone mode)
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat

# Install dependencies
FROM base AS deps
WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy all package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build the application
FROM base AS builder
WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy installed dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps ./apps
COPY --from=deps /app/packages ./packages

# Copy source code
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web ./apps/web
COPY packages/ui ./packages/ui
COPY packages/typescript-config ./packages/typescript-config
COPY packages/eslint-config ./packages/eslint-config

# Build Next.js app from the web directory
WORKDIR /app/apps/web
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# Debug: Show build output
RUN echo "=== Build output ===" && \
    ls -la .next/ && \
    echo "=== .next/server ===" && \
    ls -la .next/server/ || echo "No server directory"

# Production image - use regular Next.js server with pnpm
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN apk add --no-cache libc6-compat

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy the entire built application and dependencies
COPY --from=builder --chown=nextjs:nodejs /app ./

# Debug: Show what's in the container
RUN echo "=== Container structure ===" && \
    ls -la /app && \
    echo "=== apps/web structure ===" && \
    ls -la /app/apps/web && \
    echo "=== .next directory ===" && \
    ls -la /app/apps/web/.next

USER nextjs

EXPOSE 3000

# Use Next.js built-in server with workspace context
# Run from workspace root so pnpm can resolve workspace dependencies
WORKDIR /app
CMD ["pnpm", "--filter", "web", "start"]
