#!/usr/bin/env bash
# ==============================================================================
# ARQVERTICE STUDIO — PIPELINE DE OTIMIZAÇÃO E COMPRESSÃO DE ASSETS 3D
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "================================================================"
echo "🚀 ARQVERTICE STUDIO — EXECUTANDO PIPELINE DE ASSETS 3D"
echo "================================================================"

node "${ROOT_DIR}/scripts/3d/optimize-assets.js"

echo "✔ Processamento de assets 3D concluído com sucesso."
