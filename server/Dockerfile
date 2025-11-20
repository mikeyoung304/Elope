# =============================================================================
# STAGE 1: Base Image with Common Dependencies
# =============================================================================
FROM node:20-alpine AS base

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Set working directory
WORKDIR /app

# Copy workspace configuration (root-level)
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/shared/package.json ./packages/shared/

# =============================================================================
# STAGE 2: Development Dependencies Builder
# =============================================================================
FROM base AS builder

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy source code for all workspaces
COPY packages/ ./packages/
COPY server/ ./server/

# Build shared packages first (contracts and shared)
WORKDIR /app/packages/contracts
RUN npm run build

WORKDIR /app/packages/shared
RUN npm run build

# Build server (TypeScript compilation)
WORKDIR /app/server
RUN npm run build

# Generate Prisma Client (critical for production)
RUN npx prisma generate

# =============================================================================
# STAGE 3: Production Dependencies Only
# =============================================================================
FROM base AS production-deps

# Install ONLY production dependencies
RUN npm ci --omit=dev --workspace=server --workspace=@macon/contracts --workspace=@macon/shared

# =============================================================================
# STAGE 4: Final Production Image
# =============================================================================
FROM node:20-alpine AS production

# Security: Run as non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Copy production dependencies from stage 3
COPY --from=production-deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=production-deps --chown=nodejs:nodejs /app/server/node_modules ./server/node_modules
COPY --from=production-deps --chown=nodejs:nodejs /app/packages ./packages

# Copy built artifacts from builder
COPY --from=builder --chown=nodejs:nodejs /app/server/dist ./server/dist
COPY --from=builder --chown=nodejs:nodejs /app/server/node_modules/.prisma ./server/node_modules/.prisma
COPY --from=builder --chown=nodejs:nodejs /app/packages/contracts/dist ./packages/contracts/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared/dist ./packages/shared/dist

# Copy Prisma schema (needed for migrations in production)
COPY --from=builder --chown=nodejs:nodejs /app/server/prisma ./server/prisma

# Copy package.json files (needed for runtime resolution)
COPY --chown=nodejs:nodejs package.json ./
COPY --chown=nodejs:nodejs server/package.json ./server/

# Switch to non-root user
USER nodejs

# Expose API port (configurable via environment)
EXPOSE 3001

# Health check endpoint (assuming /health/live exists)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health/live', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Set working directory to server
WORKDIR /app/server

# Start the application
CMD ["node", "dist/index.js"]
