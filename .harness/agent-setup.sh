#!/usr/bin/env bash
# =============================================================================
# Agent Setup - wave-4 (Seguranca, Login OTP, Perfil, Avatar, User Mgmt)
# Bootstrap para o agente na worktree isolada.
# Executar da raiz da worktree: bash .harness/agent-setup.sh
# =============================================================================
set -euo pipefail

WT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "=== Agent Setup: wave-4 ==="
echo ""

# --- Carregar .env ---
if [ -f "$WT_DIR/.env" ]; then
  set -a; source "$WT_DIR/.env"; set +a
  echo "[1/4] .env carregado (PREFIX=${PREFIX:-N/A})"
else
  echo "[1/4] WARN: .env nao encontrado"
fi

# --- Detectar package manager e instalar ---
cd "$WT_DIR"
if [ -f "bun.lockb" ] || [ -f "bun.lock" ]; then
  PKG_MGR="bun"
elif [ -f "pnpm-lock.yaml" ]; then
  PKG_MGR="pnpm"
elif [ -f "yarn.lock" ]; then
  PKG_MGR="yarn"
else
  PKG_MGR="npm"
fi
echo "[2/4] Package manager: $PKG_MGR"
if [ -f "package.json" ]; then
  echo "  Instalando dependencias..."
  $PKG_MGR install 2>&1 | tail -5 || echo "WARN: falha ao instalar dependencias"
else
  echo "  Sem package.json - pulando instalacao"
fi

# --- Docker (platform) ---
echo "[3/4] Verificando Docker..."
if [ -f "$WT_DIR/docker-compose.platform.yml" ]; then
  if command -v docker &>/dev/null; then
    echo "  Docker compose encontrado - subindo platform..."
    docker compose -f docker-compose.platform.yml -f docker-compose.platform.dev-ports.yml up -d 2>&1 | tail -5
    echo "  Aguardando servicos (10s)..."
    sleep 10
  else
    echo "  Docker nao disponivel - skip"
  fi
elif [ -f "$WT_DIR/docker-compose.yml" ]; then
  if command -v docker &>/dev/null; then
    echo "  docker-compose.yml encontrado - subindo..."
    docker compose up -d 2>&1 | tail -5
    sleep 10
  else
    echo "  Docker nao disponivel - skip"
  fi
else
  echo "  Sem docker-compose - skip"
fi

# --- Smoke test ---
echo "[4/4] Smoke test..."
node -e "console.log('  Node OK:', process.version)" 2>&1 || echo "  WARN: Node.js nao disponivel"

# Health check Kong (Supabase gateway) se portas configuradas
KONG="${KONG_HTTP_PORT:-3430}"
if command -v curl &>/dev/null; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "http://localhost:$KONG" 2>/dev/null || echo "000")
  echo "  Kong (port $KONG): HTTP $HTTP_CODE"
fi

# Check Drizzle schema files
SCHEMA_COUNT=$(ls "$WT_DIR"/apps/backbone/db/schema/*.ts 2>/dev/null | wc -l)
echo "  Drizzle schemas: $SCHEMA_COUNT files"

# Check existing migrations
MIGRATION_COUNT=$(ls "$WT_DIR"/apps/backbone/db/migrations/*.sql 2>/dev/null | wc -l)
echo "  Existing migrations: $MIGRATION_COUNT files"

echo ""
echo "=== Resumo ==="
echo "  Worktree:  $WT_DIR"
echo "  Branch:    $(git branch --show-current)"
echo "  Node:      $(node --version 2>/dev/null || echo 'N/A')"
echo "  Pkg mgr:   $PKG_MGR"
echo "  PREFIX:    ${PREFIX:-N/A}"
echo "  Session:   wave-4--cc"
echo "  Runs dir:  .harness/runs/wave-4--cc/ (ROOT)"
echo ""
echo "  Dev commands:"
echo "    npm run dev:backbone    # Hono API (port ${BACKBONE_PORT:-3405})"
echo "    npm run dev:central     # Central (port ${CENTRAL_PORT:-3402})"
echo "    npm run db:generate     # Generate Drizzle migration"
echo "    npm run db:migrate      # Apply migrations"
echo ""
echo "=== Setup completo ==="
