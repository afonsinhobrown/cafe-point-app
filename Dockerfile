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

# Verify the build
RUN echo "==> Verifying build..." && \
    ls -la dist/ && \
    test -f dist/src/index.js || (echo "ERROR: dist/src/index.js not found!" && exit 1) && \
    echo "==> Build verified"

# Start command - sequential with explicit error handling
CMD ["/bin/sh", "-c", "\
  echo '==> CafePoint Deployment Starting' && \
  echo '==> DATABASE_URL:' $DATABASE_URL && \
  echo '==> Pushing schema to database...' && \
  npx prisma db push --accept-data-loss --skip-generate && \
  echo '==> Schema pushed successfully' && \
  echo '==> Running seed (optional)...' && \
  (node dist/prisma/seed.js || echo '==> Seed skipped') && \
  echo '==> Starting Node.js server...' && \
  node dist/src/index.js \
"]
