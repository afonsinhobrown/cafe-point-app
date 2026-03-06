# Multi-stage build for CafePoint Monolith
FROM node:18-alpine AS builder

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

# Start command: push schema, seed database (if not already seeded), and start server
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && (node dist/prisma/seed.js || echo 'Seed skipped or already done') && node dist/src/index.js"]
