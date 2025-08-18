#!/bin/bash

# Script de deploy otimizado para Vercel
set -e

echo "🚀 Iniciando deploy para Vercel..."

# Verificações pré-deploy
echo "🔍 Executando verificações pré-deploy..."

# Verificar Node.js version
NODE_VERSION=$(node --version)
echo "Node.js version: $NODE_VERSION"

# Verificar npm version
NPM_VERSION=$(npm --version)
echo "npm version: $NPM_VERSION"

# Limpar cache
echo "🧹 Limpando cache..."
rm -rf dist
rm -rf node_modules/.cache
npm cache clean --force

# Instalar dependências
echo "📦 Instalando dependências..."
npm ci

# Verificar tipos TypeScript
echo "🔍 Verificando tipos TypeScript..."
npx tsc --noEmit

# Verificar build
echo "🔨 Verificando build..."
npm run build

# Verificar tamanho do bundle
echo "📏 Verificando tamanho do bundle..."
if [ -d "dist/public/assets" ]; then
  BUNDLE_SIZE=$(du -sh dist/public/assets/ | cut -f1)
  echo "Tamanho do bundle: $BUNDLE_SIZE"
fi

# Deploy para Vercel
echo "🚀 Fazendo deploy para Vercel..."

if [ "$1" = "production" ]; then
  echo "🎯 Deploy para PRODUÇÃO..."
  vercel --prod --confirm
else
  echo "🧪 Deploy para PREVIEW..."
  vercel --confirm
fi

echo "✅ Deploy concluído com sucesso!"

# Verificar deploy
echo "🔍 Verificando deploy..."
DEPLOYMENT_URL=$(vercel ls --limit 1 | grep -o 'https://[^ ]*' | head -1)
echo "URL do deployment: $DEPLOYMENT_URL"

echo "🎉 Deploy completado com sucesso!"
