#!/usr/bin/env bash
# =============================================================================
# Agent Setup — PRP-wave-1-close (Wave Close)
# Bootstrap para o agente na worktree isolada.
# Executar da raiz da worktree: bash .harness/agent-setup.sh
# =============================================================================
set -euo pipefail

WT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "=== Agent Setup: PRP-wave-1-close ==="
echo ""

# --- Carregar .env ---
if [ -f "$WT_DIR/.env" ]; then
  set -a; source "$WT_DIR/.env"; set +a
  echo "[1/3] .env carregado (PREFIX=${PREFIX:-N/A})"
else
  echo "[1/3] WARN: .env nao encontrado"
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
echo "[2/3] Package manager: $PKG_MGR"
if [ -f "package.json" ]; then
  echo "  Instalando dependencias..."
  $PKG_MGR install 2>&1 | tail -5 || echo "WARN: falha ao instalar dependencias"
else
  echo "  Sem package.json — pulando instalacao"
fi

# --- Smoke test ---
echo "[3/3] Smoke test..."
node -e "console.log('  Node OK:', process.version)" 2>&1 || echo "  WARN: Node.js nao disponivel"
git --version 2>&1 || echo "  WARN: git nao disponivel"

echo ""
echo "=== Resumo ==="
echo "  Worktree:  $WT_DIR"
echo "  Branch:    $(git branch --show-current)"
echo "  Node:      $(node --version 2>/dev/null || echo 'N/A')"
echo "  Pkg mgr:   $PKG_MGR"
echo "  PREFIX:    ${PREFIX:-N/A}"
echo "  Session:   PRP-wave-1-close--cc"
echo "  Runs dir:  .harness/runs/PRP-wave-1-close--cc/ (ROOT)"
echo "  Type:      wave-close (no app implementation)"
echo ""
echo "=== Setup completo ==="
