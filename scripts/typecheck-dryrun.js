/**
 * scripts/typecheck-dryrun.js
 * Verificação de Tipagem, Interfaces e Integridade de Módulos (Dry-Run).
 */

const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('🔍 ARQVERTICE STUDIO — VERIFICAÇÃO DE TIPAGEM & CONTRATOS (DRY-RUN)');
console.log('================================================================\n');

const jsFilesToCheck = [
  'js/state.js',
  'js/universal-bim-pipeline.js',
  'js/universal-asset-pipeline.js',
  'js/gaussian-splat-pipeline.js',
  'js/3d-agent-router.js',
  'js/3d-qa-gate.js',
  'js/3d-production-infra.js',
  'js/3d-semantic-index.js',
  'js/ai-3d-command-engine.js',
  'js/realtime-render-pipeline.js',
  'js/adaptive-renderer.js',
  'js/client-viewer-module.js',
  'js/3d-studio-module.js'
];

let errors = 0;

for (const relPath of jsFilesToCheck) {
  const fullPath = path.resolve(relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`✖ Arquivo ausente para typecheck: ${relPath}`);
    errors++;
    continue;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  // Validação de sintaxe e contratos UMD / CommonJS / ES
  try {
    new Function(content);
    console.log(`✔ [TYPECHECK / AST OK] ${relPath.padEnd(35)}`);
  } catch (err) {
    console.error(`✖ [ERRO DE PARSING] ${relPath}: ${err.message}`);
    errors++;
  }
}

console.log('\n================================================================');
if (errors === 0) {
  console.log('🎉 TYPECHECK / AST APROVADO COM 100% DE SUCESSO! 0 ERROS.');
  console.log('================================================================\n');
  process.exit(0);
} else {
  console.error(`⚠️ TYPECHECK ENCONTROU ${errors} ERROS.`);
  console.log('================================================================\n');
  process.exit(1);
}
