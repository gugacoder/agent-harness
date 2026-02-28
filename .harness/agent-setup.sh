#!/usr/bin/env bash
# =============================================================================
# Agent Setup — PRP-001-foundation-schemas-database
# Bootstrap para o agente coder na worktree isolada.
# Executar da raiz da worktree: bash .harness/agent-setup.sh
# =============================================================================
set -euo pipefail

WT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "=== Agent Setup: PRP-001-foundation-schemas-database ==="
echo ""

# --- 1. Carregar .env ---
if [ -f "$WT_DIR/.env" ]; then
  set -a; source "$WT_DIR/.env"; set +a
  echo "[1/4] .env carregado (PREFIX=${PREFIX:-N/A})"
else
  echo "[1/4] WARN: .env nao encontrado"
fi

# --- 2. Detectar package manager e instalar dependencias ---
cd "$WT_DIR"
if [ -f "pnpm-lock.yaml" ]; then
  PKG_MGR="pnpm"
elif [ -f "yarn.lock" ]; then
  PKG_MGR="yarn"
elif [ -f "bun.lockb" ] || [ -f "bun.lock" ]; then
  PKG_MGR="bun"
else
  PKG_MGR="npm"
fi
echo "[2/4] Package manager: $PKG_MGR"
if [ -f "package.json" ]; then
  echo "  Instalando dependencias..."
  $PKG_MGR install 2>&1 | tail -5 || echo "  WARN: falha ao instalar dependencias"
else
  echo "  Sem package.json — pulando instalacao"
fi

# --- 3. Verificar Docker (platform) ---
echo "[3/4] Verificando Docker..."
if command -v docker &>/dev/null; then
  if [ -f "$WT_DIR/docker-compose.platform.yml" ]; then
    COMPOSE_STATUS=$(docker compose -f docker-compose.platform.yml ps --format '{{.Name}} {{.Status}}' 2>/dev/null || echo "")
    if [ -n "$COMPOSE_STATUS" ]; then
      echo "  Platform containers:"
      echo "$COMPOSE_STATUS" | while read -r line; do echo "    $line"; done
    else
      echo "  Platform nao esta rodando. Suba com:"
      echo "    docker compose -f docker-compose.platform.yml -f docker-compose.platform.dev-ports.yml up -d"
    fi
  else
    echo "  docker-compose.platform.yml nao encontrado"
  fi
else
  echo "  Docker nao disponivel — skip"
fi

# --- 4. Smoke test ---
echo "[4/4] Smoke test..."
node -e "console.log('  Node OK:', process.version)" 2>&1 || echo "  WARN: Node.js nao disponivel"

echo ""
echo "=== Resumo ==="
echo "  Worktree:  $WT_DIR"
echo "  Branch:    $(git branch --show-current 2>/dev/null || echo 'N/A')"
echo "  Node:      $(node --version 2>/dev/null || echo 'N/A')"
echo "  Pkg mgr:   $PKG_MGR"
echo "  PREFIX:    ${PREFIX:-N/A}"
echo "  Session:   PRP-001-foundation-schemas-database--cc"
echo "  Agent:     coder"
echo "  Runs dir:  D:/sources/_unowned/agent-harness/.harness/runs/PRP-001-foundation-schemas-database--cc/"
echo ""
echo "=== Setup completo ==="
