#!/usr/bin/env bash
# =============================================================================
# Agent Setup — PRP-003-central-empresa (Wave 1 — Central da Empresa)
# Bootstrap para o agente coder na worktree isolada.
# Executar da raiz da worktree: bash .harness/agent-setup.sh
# =============================================================================
set -euo pipefail

WT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "=== Agent Setup: PRP-003-central-empresa ==="
echo "  Central da Empresa — painel operador desktop-first PWA"
echo ""

# --- Carregar .env ---
if [ -f "$WT_DIR/.env" ]; then
  set -a; source "$WT_DIR/.env"; set +a
  echo "[1/5] .env carregado (PREFIX=${PREFIX:-N/A})"
else
  echo "[1/5] WARN: .env nao encontrado — usando PREFIX=33"
  export PREFIX=33
fi

# --- Detectar package manager e instalar (root) ---
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
  echo "  Instalando dependencias (root)..."
  $PKG_MGR install 2>&1 | tail -5 || echo "WARN: falha ao instalar dependencias root"
else
  echo "  Sem package.json na root — pulando instalacao"
fi

# --- Instalar dependencias apps/central ---
echo "[3/5] Verificando apps/central/..."
if [ -f "$WT_DIR/apps/central/package.json" ]; then
  echo "  package.json encontrado — instalando dependencias..."
  cd "$WT_DIR/apps/central"
  $PKG_MGR install 2>&1 | tail -5 || echo "WARN: falha ao instalar dependencias de apps/central"
  cd "$WT_DIR"
else
  echo "  apps/central/package.json nao encontrado — sera criado por F-001"
fi

# --- Docker (platform) ---
echo "[4/5] Verificando Docker..."
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
echo "[5/5] Smoke test..."
node -e "console.log('  Node OK:', process.version)" 2>&1 || echo "  WARN: Node.js nao disponivel"

# Health check Kong (Supabase gateway)
KONG="${KONG_HTTP_PORT:-${PREFIX}30}"
if command -v curl &>/dev/null; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "http://localhost:$KONG" 2>/dev/null || echo "000")
  echo "  Kong (port $KONG): HTTP $HTTP_CODE"
fi

# Health check Backbone API
BACKBONE_PORT="${PREFIX}01"
if command -v curl &>/dev/null; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "http://localhost:$BACKBONE_PORT/api/health" 2>/dev/null || echo "000")
  echo "  Backbone API (port $BACKBONE_PORT): HTTP $HTTP_CODE"
fi

# Check Vite dev server port availability
CENTRAL_PORT="${PREFIX}02"
echo "  Central dev port: $CENTRAL_PORT (esperado livre)"

echo ""
echo "=== Resumo ==="
echo "  Worktree:    $WT_DIR"
echo "  Branch:      $(git branch --show-current)"
echo "  Node:        $(node --version 2>/dev/null || echo 'N/A')"
echo "  Pkg mgr:     $PKG_MGR"
echo "  PREFIX:      ${PREFIX:-33}"
echo "  Backbone:    http://localhost:${PREFIX}01"
echo "  Central:     http://localhost:${PREFIX}02"
echo "  Kong:        http://localhost:${KONG}"
echo "  Branding:    primary=#222e6e secondary=#1dace7 accent=#fca322"
echo "  Session:     PRP-003-central-empresa--cc"
echo "  Runs dir:    .harness/runs/PRP-003-central-empresa--cc/ (ROOT)"
echo ""
echo "=== Setup completo ==="
