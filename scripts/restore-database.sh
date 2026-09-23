#!/usr/bin/env bash
# ==============================================================================
# ARQVERTICE STUDIO — PROCEDIMENTO DE RECUPERAÇÃO DE DESASTRE (RESTORE)
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

CONFIRMATION="${1:-}"
BACKUP_FILE="${2:-}"

if [ -z "${CONFIRMATION}" ]; then
  echo "❌ ERRO: É necessário fornecer a palavra de confirmação 'CONFIRMO_RESTORE'."
  echo "Uso: ./scripts/restore-database.sh CONFIRMO_RESTORE [caminho_do_backup]"
  exit 1
fi

node "${ROOT_DIR}/scripts/db/restore.js" "${CONFIRMATION}" "${BACKUP_FILE}"
