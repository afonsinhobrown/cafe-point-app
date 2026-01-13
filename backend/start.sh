#!/bin/bash
set -e

echo "Running database migrations..."
npx prisma db push --accept-data-loss

echo "Starting application..."
node dist/index.js
