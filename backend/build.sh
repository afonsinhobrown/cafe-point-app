#!/bin/bash
set -e

echo "Installing dependencies..."
npm ci --only=production

echo "Generating Prisma Client..."
npx prisma generate

echo "Compiling TypeScript..."
npx tsc

echo "Build completed successfully!"
