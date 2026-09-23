#!/usr/bin/env bash
# ==============================================================================
# ARQVERTICE STUDIO — ROTINA DE BACKUP AUTOMATIZADO COM ROTAÇÃO
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

node "${ROOT_DIR}/scripts/db/backup.js"
