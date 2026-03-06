# Multi-stage build for CafePoint Monolith
FROM node:18-alpine AS builder

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy all package files
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma/

# Install dependencies for both
WORKDIR /app/frontend
RUN npm ci

WORKDIR /app/backend
RUN npm ci

# Build frontend
WORKDIR /app
COPY frontend ./frontend
WORKDIR /app/frontend
RUN npm run build

# Build backend
WORKDIR /app
COPY backend ./backend
WORKDIR /app/backend

# Copy frontend build to backend public folder
RUN rm -rf public && mkdir -p public
RUN cp -r /app/frontend/dist/* ./public/

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy built backend and node_modules
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/package*.json ./
COPY --from=builder /app/backend/prisma ./prisma
COPY --from=builder /app/backend/public ./public

# Expose port
EXPOSE 5000

# Set environment
ENV NODE_ENV=production

# Regenerate Prisma Client in production stage
RUN npx prisma generate

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "🚀 Starting CafePoint deployment..."' >> /app/start.sh && \
    echo 'echo "📂 Current directory: $(pwd)"' >> /app/start.sh && \
    echo 'echo "📁 Checking files..."' >> /app/start.sh && \
    echo 'ls -la dist/ || echo "dist folder issue"' >> /app/start.sh && \
    echo 'echo "🔧 Running Prisma migration..."' >> /app/start.sh && \
    echo 'npx prisma db push --accept-data-loss || { echo "❌ Prisma migration failed"; exit 1; }' >> /app/start.sh && \
    echo 'echo "🌱 Running seed..."' >> /app/start.sh && \
    echo 'node dist/prisma/seed.js || echo "⚠️ Seed skipped or failed"' >> /app/start.sh && \
    echo 'echo "🚀 Starting Node server..."' >> /app/start.sh && \
    echo 'exec node dist/src/index.js' >> /app/start.sh && \
    chmod +x /app/start.sh

# Start command
CMD ["/app/start.sh"]
