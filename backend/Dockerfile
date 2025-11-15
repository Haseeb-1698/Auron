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

# Install production dependencies only
COPY backend/package*.json ./
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm install --omit=dev

# Copy tsconfig files for path resolution at runtime
COPY backend/tsconfig.json ./tsconfig.json
COPY tsconfig.base.json /tsconfig.base.json

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 4000

CMD ["node", "-r", "tsconfig-paths/register", "dist/server.js"]
