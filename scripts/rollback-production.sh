#!/usr/bin/env bash
# ==============================================================================
# ARQVERTICE STUDIO — PROTOCOLO DE ROLLBACK INSTANTÂNEO (PRODUÇÃO)
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

node "${ROOT_DIR}/scripts/deploy/rollback-engine.js" "$@"
