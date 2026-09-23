#!/usr/bin/env bash
# ==============================================================================
# ARQVERTICE STUDIO — EXECUTOR DE MIGRAÇÕES DE BANCO (PRODUÇÃO)
# ==============================================================================
set -euo pipefail

echo "================================================================"
echo "🚀 ARQVERTICE STUDIO — INICIANDO EXECUÇÃO DE MIGRAÇÕES"
echo "================================================================"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Execução do motor determinístico em Node.js
node "${ROOT_DIR}/scripts/db/migrate.js"

echo "✔ Migrações concluídas com sucesso."
