#!/bin/bash
# Déploiement de react-barbu-v3 (barbu.vjdev.tech)
#
# Usage : ./scripts/deploy.sh
# Pré-requis : être dans /var/www/vincent/react-barbu-v3

set -e

cd "$(dirname "$0")/.."

echo "→ git pull..."
git pull origin master

echo "→ npm install (frontend)..."
npm install

echo "→ npm run build (frontend Vite)..."
npm run build

echo "→ npm install (backend)..."
cd src/backend
npm install

echo "→ npm run build (backend TypeScript)..."
npm run build
cd ../..

echo "→ pm2 restart (ou start si absent)..."
pm2 startOrRestart ecosystem.config.cjs

echo "✓ Déploiement terminé."
echo "  Frontend : dist/ servi par nginx"
echo "  Backend  : barbu-api via PM2 sur :4003"
