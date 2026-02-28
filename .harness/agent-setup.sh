#!/usr/bin/env bash
# =============================================================================
# Agent Setup — PRP-001-data-contract-schemas
# Bootstrap para o agente de desenvolvimento na worktree isolada.
# Executar da raiz da worktree: bash .harness/agent-setup.sh
# =============================================================================
set -euo pipefail

WT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "=== Agent Setup: PRP-001-data-contract-schemas ==="
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
echo "  Instalando dependencias..."
$PKG_MGR install 2>&1 || echo "WARN: falha ao instalar dependencias"

# --- Docker (skip se nao houver docker-compose) ---
echo "[3/4] Verificando Docker..."
if [ -f "$WT_DIR/docker-compose.yml" ] || [ -f "$WT_DIR/docker-compose.yaml" ]; then
  if command -v docker &>/dev/null; then
    echo "  Docker compose encontrado — skip (schemas nao dependem de docker)"
  else
    echo "  Docker nao disponivel — skip"
  fi
else
  echo "  Sem docker-compose — skip"
fi

# --- Smoke test ---
echo "[4/4] Smoke test..."
node -e "console.log('  Node OK:', process.version)" 2>&1 || echo "  WARN: Node.js nao disponivel"

# Verificar zod
if node -e "import('zod').then(z => console.log('  Zod OK:', typeof z.z.string))" 2>/dev/null; then
  :
else
  echo "  Zod nao instalado (esperado antes de F-001)"
fi

echo ""
echo "=== Resumo ==="
echo "  Worktree:  $WT_DIR"
echo "  Branch:    $(git branch --show-current)"
echo "  Node:      $(node --version 2>/dev/null || echo 'N/A')"
echo "  Pkg mgr:   $PKG_MGR"
echo "  PREFIX:    ${PREFIX:-N/A}"
echo ""
echo "  Testes: node --test .harness/schemas/validate.test.mjs"
