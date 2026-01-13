#!/bin/bash
# Script de Build para Render.com (Monolito)

set -e # Parar em caso de erro

echo "🚀 Iniciando Build para Render..."

# 1. Build do Frontend
echo "📦 Instalando e construindo Frontend..."
cd frontend
npm install
npm run build
cd ..

# 2. Copiar Arquivos
echo "📂 Copiando dist do Frontend para Backend public..."
rm -rf backend/public
mkdir -p backend/public
cp -r frontend/dist/* backend/public/

# 3. Build do Backend
echo "⚙️ Instalando e construindo Backend..."
cd backend
npm install
npx prisma generate
npm run build

echo "✅ Build Completo!"
