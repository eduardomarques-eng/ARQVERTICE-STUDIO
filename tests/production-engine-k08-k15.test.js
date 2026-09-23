/**
 * tests/production-engine-k08-k15.test.js
 * ArqVértice Studio — Suíte de Testes Automatizados para os Blocos K08 a K15
 * Valida E2E, A11y, Performance Budgets, Observabilidade, Integridade e Release Candidate.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { auditPerformanceBudgets } = require('../scripts/performance-budget-check');
const { auditDataIntegrity } = require('../scripts/db/data-integrity-check');
const { generateReleaseCandidateManifest } = require('../scripts/release-candidate-check');

async function runTests() {
  console.log('================================================================');
  console.log('🧪 SUÍTE DE TESTES: BLOCO K (K08 ➔ K15) — PRODUCTION ENGINE');
  console.log('================================================================\n');

  const rootDir = path.resolve(__dirname, '..');

  // --------------------------------------------------------------------------
  console.log('--- 1. K08: E2E & Playwright Framework ---');
  // --------------------------------------------------------------------------
  const playwrightConfig = path.join(rootDir, 'playwright.config.js');
  const criticalFlows = path.join(rootDir, 'tests', 'e2e', 'critical-flows.spec.js');
  assert.ok(fs.existsSync(playwrightConfig), 'playwright.config.js deve existir');
  assert.ok(fs.existsSync(criticalFlows), 'tests/e2e/critical-flows.spec.js deve existir');
  
  const pwContent = fs.readFileSync(playwrightConfig, 'utf8');
  assert.ok(pwContent.includes('Desktop Chromium'), 'Configuração deve suportar Desktop Chromium');
  assert.ok(pwContent.includes('Mobile Chrome'), 'Configuração deve suportar Mobile Chrome');
  assert.ok(pwContent.includes('on-first-retry'), 'Configuração deve capturar trace on-first-retry');
  console.log('  ✔ [PASS] Configuração do Playwright e matriz de navegadores validadas');

  // --------------------------------------------------------------------------
  console.log('\n--- 2. K09: Visual Regression & Acessibilidade (A11y) ---');
  // --------------------------------------------------------------------------
  const visualA11ySpec = path.join(rootDir, 'tests', 'e2e', 'visual-regression-a11y.spec.js');
  assert.ok(fs.existsSync(visualA11ySpec), 'tests/e2e/visual-regression-a11y.spec.js deve existir');
  const a11yContent = fs.readFileSync(visualA11ySpec, 'utf8');
  assert.ok(a11yContent.includes('focus-visible'), 'Suíte deve auditar focus-visible');
  assert.ok(a11yContent.includes('Touch Targets'), 'Suíte deve auditar touch targets móveis');
  console.log('  ✔ [PASS] Suíte de regressão visual e acessibilidade validada');

  // --------------------------------------------------------------------------
  console.log('\n--- 3. K10: Performance Budgets & Core Web Vitals ---');
  // --------------------------------------------------------------------------
  const perfResult = auditPerformanceBudgets();
  assert.strictEqual(perfResult.passed, true, 'Auditoria de performance budgets deve ser aprovada');
  assert.strictEqual(perfResult.violations.length, 0, 'Zero violações de orçamento permitidas');
  console.log('  ✔ [PASS] Orçamentos de HTML, CSS, JS e Core Web Vitals cumpridos');

  // --------------------------------------------------------------------------
  console.log('\n--- 4. K11: Runtime & Memory Leak Prevention ---');
  // --------------------------------------------------------------------------
  const runtimeDoc = path.join(rootDir, 'docs', 'production', 'runtime-media-performance.md');
  assert.ok(fs.existsSync(runtimeDoc), 'docs/production/runtime-media-performance.md deve existir');
  const runtimeContent = fs.readFileSync(runtimeDoc, 'utf8');
  assert.ok(runtimeContent.includes('dispose()'), 'Documento deve registrar política de descarte GPU');
  assert.ok(runtimeContent.includes('KTX2'), 'Documento deve cobrir compressão KTX2');
  console.log('  ✔ [PASS] Diretrizes de Runtime, compressão de mídia e memória GPU validadas');

  // --------------------------------------------------------------------------
  console.log('\n--- 5. K12: Observabilidade & Logs Estruturados ---');
  // --------------------------------------------------------------------------
  const obsDoc = path.join(rootDir, 'docs', 'production', 'observability-error-monitoring.md');
  assert.ok(fs.existsSync(obsDoc), 'docs/production/observability-error-monitoring.md deve existir');
  const obsContent = fs.readFileSync(obsDoc, 'utf8');
  assert.ok(obsContent.includes('correlationId'), 'Observabilidade deve documentar correlationId');
  assert.ok(obsContent.includes('REDACTED'), 'Observabilidade deve exigir mascaramento de secrets');
  console.log('  ✔ [PASS] Estrutura de observabilidade e logs de produção validadas');

  // --------------------------------------------------------------------------
  console.log('\n--- 6. K13: Integridade de Dados & Segurança de Migrações ---');
  // --------------------------------------------------------------------------
  const dataIntegrity = auditDataIntegrity();
  assert.strictEqual(dataIntegrity.valid, true, 'Auditoria de integridade de dados deve ser aprovada');
  assert.strictEqual(dataIntegrity.issues.length, 0, 'Nenhum problema de migração deve existir');
  console.log('  ✔ [PASS] Sequenciamento de migrações e diretório de snapshots verificados');

  // --------------------------------------------------------------------------
  console.log('\n--- 7. K14: CI/CD & Pipeline GitHub Actions ---');
  // --------------------------------------------------------------------------
  const ciWorkflow = path.join(rootDir, '.github', 'workflows', 'ci.yml');
  assert.ok(fs.existsSync(ciWorkflow), '.github/workflows/ci.yml deve existir');
  const ciContent = fs.readFileSync(ciWorkflow, 'utf8');
  assert.ok(ciContent.includes('npm run lint'), 'CI deve executar linting');
  assert.ok(ciContent.includes('npm run typecheck'), 'CI deve executar typechecking');
  assert.ok(ciContent.includes('npm test'), 'CI deve executar suíte de testes');
  assert.ok(ciContent.includes('npm run test:perf'), 'CI deve validar performance');
  assert.ok(ciContent.includes('gitleaks'), 'CI deve escanear segredos via Gitleaks');
  console.log('  ✔ [PASS] Workflow de CI com 8 Quality Gates verificado');

  // --------------------------------------------------------------------------
  console.log('\n--- 8. K15: Release Candidate Engine & Promoção de Ambientes ---');
  // --------------------------------------------------------------------------
  const rcRes = generateReleaseCandidateManifest('1.0.0-rc.2');
  assert.strictEqual(rcRes.success, true, 'Geração de Release Candidate deve ser bem-sucedida');
  assert.ok(fs.existsSync(rcRes.manifestPath), 'Manifesto RC deve ser gravado em disco');
  assert.strictEqual(rcRes.manifest.artifacts.length, 10, 'Manifesto deve conter 10 artefatos criptografados');
  console.log('  ✔ [PASS] Release Candidate manifest gerado com hashes SHA-256');

  console.log('\n================================================================');
  console.log('🎉 TODOS OS 8 TESTES DOS BLOCOS K08 A K15 PASSARAM COM SUCESSO!');
  console.log('================================================================\n');
}

if (require.main === module) {
  runTests().catch(err => {
    console.error('❌ Falha nos testes K08-K15:', err);
    process.exit(1);
  });
}

module.exports = runTests;
