#!/usr/bin/env bash
# scripts/secrets.sh — Encrypt/decrypt .env with SOPS + age
# Uso: bash scripts/secrets.sh encrypt [environment]
#      bash scripts/secrets.sh decrypt [environment]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

ACTION="${1:-}"
ENV="${2:-development}"
ENC_FILE="$ROOT_DIR/.env.${ENV}.enc"
PLAINTEXT="$ROOT_DIR/.env"
KEY_FILE="$ROOT_DIR/.enc.key"

# ---------------------------------------------------------------------------
# Validacao
# ---------------------------------------------------------------------------
if [[ "$ACTION" != "encrypt" && "$ACTION" != "decrypt" ]]; then
  echo "Uso: bash scripts/secrets.sh <encrypt|decrypt> [development|staging|production]"
  exit 1
fi

for cmd in sops age; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "Erro: '$cmd' nao encontrado. Instale com:"
    echo "  scoop install extras/age main/sops    # Windows"
    echo "  brew install age sops                 # macOS"
    echo "  apt install age sops                  # Linux"
    exit 1
  fi
done

# ---------------------------------------------------------------------------
# Resolucao da chave age (3 niveis)
# ---------------------------------------------------------------------------
resolve_key() {
  # 1. Env var
  if [[ -n "${SOPS_AGE_KEY:-}" ]]; then
    return 0
  fi

  # 2. Arquivo local
  if [[ -f "$KEY_FILE" ]]; then
    export SOPS_AGE_KEY
    SOPS_AGE_KEY="$(cat "$KEY_FILE" | tr -d '\r\n')"
    return 0
  fi

  # 3. Prompt interativo
  echo "Chave age nao encontrada."
  echo "  - Defina SOPS_AGE_KEY como env var, ou"
  echo "  - Crie o arquivo .enc.key com a chave privada"
  echo ""
  read -rp "Cole a chave age (AGE-SECRET-KEY-...): " key
  if [[ -z "$key" ]]; then
    echo "Erro: chave vazia."
    exit 1
  fi
  export SOPS_AGE_KEY="$key"

  read -rp "Salvar em .enc.key para proximas vezes? [S/n] " save
  if [[ "${save,,}" != "n" ]]; then
    echo "$key" > "$KEY_FILE"
    echo "Salvo em .enc.key (gitignored)."
  fi
}

# ---------------------------------------------------------------------------
# Encrypt
# ---------------------------------------------------------------------------
do_encrypt() {
  if [[ ! -f "$PLAINTEXT" ]]; then
    echo "Erro: $PLAINTEXT nao encontrado."
    exit 1
  fi

  resolve_key

  # CRLF -> LF (Windows compat)
  local tmp
  tmp="$(mktemp)"
  tr -d '\r' < "$PLAINTEXT" > "$tmp"

  sops --encrypt \
    --input-type dotenv \
    --output-type dotenv \
    "$tmp" > "$ENC_FILE"

  rm -f "$tmp"
  echo "Encriptado: $ENC_FILE"
}

# ---------------------------------------------------------------------------
# Decrypt
# ---------------------------------------------------------------------------
do_decrypt() {
  if [[ ! -f "$ENC_FILE" ]]; then
    echo "Erro: $ENC_FILE nao encontrado."
    echo "Ambientes disponiveis:"
    ls -1 "$ROOT_DIR"/.env.*.enc 2>/dev/null | sed 's/.*\.env\.\(.*\)\.enc/  \1/' || echo "  (nenhum)"
    exit 1
  fi

  resolve_key

  sops --decrypt \
    --input-type dotenv \
    --output-type dotenv \
    "$ENC_FILE" > "$PLAINTEXT"

  echo "Decriptado: $PLAINTEXT (de $ENV)"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
case "$ACTION" in
  encrypt) do_encrypt ;;
  decrypt) do_decrypt ;;
esac
