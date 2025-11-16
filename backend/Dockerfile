FROM node:18-alpine AS builder

WORKDIR /app

# Copy base tsconfig from root
COPY tsconfig.base.json /tsconfig.base.json

# Copy package files
COPY backend/package*.json ./
COPY backend/tsconfig.json ./

# Install dependencies (skip Puppeteer browser download to avoid network timeouts)
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm install

# Copy source code
COPY backend/src ./src

# Build TypeScript
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Install Docker CLI for local lab deployments
RUN apk add --no-cache docker-cli

# Install production dependencies only
COPY backend/package*.json ./
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm install --omit=dev

# Copy tsconfig files for path resolution at runtime
COPY backend/tsconfig.runtime.json ./tsconfig.json
COPY tsconfig.base.json /tsconfig.base.json

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Create storage directories
RUN mkdir -p /app/storage/reports /app/storage/uploads /app/storage/logs /app/storage/temp

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 4000

# Use the runtime tsconfig for path resolution
ENV NODE_PATH=/app/dist
CMD ["node", "-r", "tsconfig-paths/register", "dist/server.js"]
