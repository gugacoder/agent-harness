#!/usr/bin/env bash
# =============================================================================
# Agent Setup - merged (Wave 4 + 5 + 6)
# Bootstrap para o agente na worktree isolada.
# Executar da raiz da worktree: bash .harness/agent-setup.sh
# =============================================================================
set -euo pipefail

WT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "=== Agent Setup ==="
echo ""

# --- Carregar .env ---
if [ -f "$WT_DIR/.env" ]; then
  set -a; source "$WT_DIR/.env"; set +a
  echo "[1/5] .env carregado (PREFIX=${PREFIX:-N/A})"
else
  echo "[1/5] WARN: .env nao encontrado"
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
echo "[2/5] Package manager: $PKG_MGR"
if [ -f "package.json" ]; then
  echo "  Instalando dependencias..."
  $PKG_MGR install 2>&1 | tail -5 || echo "WARN: falha ao instalar dependencias"
else
  echo "  Sem package.json - pulando instalacao"
fi

# --- Docker (platform) ---
echo "[3/5] Verificando Docker..."
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

# --- Build schemas (dependencia compartilhada) ---
echo "[4/5] Build schemas..."
if [ -d "$WT_DIR/packages/shared/schemas" ]; then
  cd "$WT_DIR/packages/shared/schemas"
  $PKG_MGR run build 2>&1 | tail -3 || echo "  WARN: falha ao buildar schemas"
  cd "$WT_DIR"
else
  echo "  Sem packages/shared/schemas - skip"
fi

# --- Smoke test ---
echo "[5/5] Smoke test..."
node -e "console.log('  Node OK:', process.version)" 2>&1 || echo "  WARN: Node.js nao disponivel"

# Health check backbone se estiver rodando
BACKBONE_PORT="${BACKBONE_PORT:-2005}"
if command -v curl &>/dev/null; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "http://localhost:$BACKBONE_PORT/health" 2>/dev/null || echo "000")
  echo "  Backbone (port $BACKBONE_PORT): HTTP $HTTP_CODE"
fi

# Health check PostgreSQL
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
if command -v pg_isready &>/dev/null; then
  pg_isready -h localhost -p "$POSTGRES_PORT" 2>/dev/null && echo "  PostgreSQL (port $POSTGRES_PORT): OK" || echo "  PostgreSQL (port $POSTGRES_PORT): DOWN"
else
  echo "  pg_isready nao disponivel - skip check PostgreSQL"
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
echo ""
echo "  Dev commands:"
echo "    npm run dev:backbone    # Hono API (port ${BACKBONE_PORT:-3405})"
echo "    npm run dev:central     # Central (port ${CENTRAL_PORT:-3402})"
echo "    npm run db:generate     # Generate Drizzle migration"
echo "    npm run db:migrate      # Apply migrations"
echo ""
echo "=== Setup completo ==="
