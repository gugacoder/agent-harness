#!/usr/bin/env bash
# =============================================================================
# Agent Setup — PRP-002-backend-api-sse (Wave 1 — Backend API + Auth + SSE)
# Bootstrap para o agente na worktree isolada.
# Executar da raiz da worktree: bash .harness/agent-setup.sh
# =============================================================================
set -euo pipefail

WT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "=== Agent Setup: PRP-002-backend-api-sse ==="
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
  echo "  Sem package.json — pulando instalacao"
fi

# --- Docker (platform) ---
echo "[3/4] Verificando Docker..."
if [ -f "$WT_DIR/docker-compose.platform.yml" ]; then
  if command -v docker &>/dev/null; then
    echo "  Docker compose encontrado — subindo platform..."
    docker compose -f docker-compose.platform.yml -f docker-compose.platform.dev-ports.yml up -d 2>&1 | tail -5
    echo "  Aguardando servicos (10s)..."
    sleep 10
  else
    echo "  Docker nao disponivel — skip"
  fi
elif [ -f "$WT_DIR/docker-compose.yml" ]; then
  if command -v docker &>/dev/null; then
    echo "  docker-compose.yml encontrado — subindo..."
    docker compose up -d 2>&1 | tail -5
    sleep 10
  else
    echo "  Docker nao disponivel — skip"
  fi
else
  echo "  Sem docker-compose — skip"
fi

# --- Smoke test ---
echo "[4/4] Smoke test..."
node -e "console.log('  Node OK:', process.version)" 2>&1 || echo "  WARN: Node.js nao disponivel"

# Health check Kong (Supabase gateway) se portas configuradas
KONG="${KONG_HTTP_PORT:-3208}"
if command -v curl &>/dev/null; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "http://localhost:$KONG" 2>/dev/null || echo "000")
  echo "  Kong (port $KONG): HTTP $HTTP_CODE"
fi

# Verificar estrutura backbone
if [ -d "$WT_DIR/apps/backbone" ]; then
  echo "  apps/backbone/ existe"
  if [ -d "$WT_DIR/apps/backbone/src" ]; then
    echo "  apps/backbone/src/ existe"
  else
    echo "  WARN: apps/backbone/src/ nao encontrado (sera criado por F-001)"
  fi
else
  echo "  WARN: apps/backbone/ nao encontrado (prerequisito PRP-001)"
fi

# Verificar schemas compartilhados
if [ -d "$WT_DIR/packages/shared/schemas" ]; then
  echo "  packages/shared/schemas/ existe"
else
  echo "  WARN: packages/shared/schemas/ nao encontrado (prerequisito PRP-001)"
fi

echo ""
echo "=== Resumo ==="
echo "  Worktree:  $WT_DIR"
echo "  Branch:    $(git branch --show-current)"
echo "  Node:      $(node --version 2>/dev/null || echo 'N/A')"
echo "  Pkg mgr:   $PKG_MGR"
echo "  PREFIX:    ${PREFIX:-N/A}"
echo "  Session:   PRP-002-backend-api-sse--cc"
echo "  Runs dir:  .harness/runs/PRP-002-backend-api-sse--cc/ (ROOT)"
echo "  Scope:     apps/backbone/src/ (API + Auth + SSE)"
echo ""
echo "=== Setup completo ==="
