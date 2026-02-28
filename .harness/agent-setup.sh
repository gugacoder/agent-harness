#!/usr/bin/env bash
# =============================================================================
# Agent Setup — PRP-004-app-lojista (Wave 1 — App do Lojista PWA)
# Bootstrap para o agente coder na worktree isolada.
# Executar da raiz da worktree: bash .harness/agent-setup.sh
# =============================================================================
set -euo pipefail

WT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "=== Agent Setup: PRP-004-app-lojista ==="
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
  echo "  Instalando dependencias (root)..."
  $PKG_MGR install 2>&1 | tail -5 || echo "WARN: falha ao instalar dependencias root"
else
  echo "  Sem package.json na raiz — pulando instalacao root"
fi

# --- Instalar dependencias do app lojista ---
echo "[3/5] Instalando dependencias do app lojista..."
if [ -d "$WT_DIR/apps/lojista" ] && [ -f "$WT_DIR/apps/lojista/package.json" ]; then
  cd "$WT_DIR/apps/lojista"
  $PKG_MGR install 2>&1 | tail -5 || echo "WARN: falha ao instalar dependencias do lojista"
  cd "$WT_DIR"
else
  echo "  apps/lojista/ ainda nao tem package.json — sera criado na F-001"
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

# Health check Kong (Supabase gateway) se portas configuradas
KONG="${KONG_HTTP_PORT:-3430}"
if command -v curl &>/dev/null; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "http://localhost:$KONG" 2>/dev/null || echo "000")
  echo "  Kong (port $KONG): HTTP $HTTP_CODE"
fi

# Health check backend (Hono API)
BACKBONE_PORT="${BACKBONE_PORT:-3401}"
if command -v curl &>/dev/null; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "http://localhost:$BACKBONE_PORT/api/health" 2>/dev/null || echo "000")
  echo "  Backbone API (port $BACKBONE_PORT): HTTP $HTTP_CODE"
fi

echo ""
echo "=== Resumo ==="
echo "  Worktree:  $WT_DIR"
echo "  Branch:    $(git branch --show-current)"
echo "  Node:      $(node --version 2>/dev/null || echo 'N/A')"
echo "  Pkg mgr:   $PKG_MGR"
echo "  PREFIX:    ${PREFIX:-N/A}"
echo "  App:       apps/lojista/ (porta ${PREFIX:-34}03)"
echo "  Session:   PRP-004-app-lojista--cc"
echo "  Runs dir:  .harness/runs/PRP-004-app-lojista--cc/ (ROOT)"
echo ""
echo "=== Setup completo ==="
