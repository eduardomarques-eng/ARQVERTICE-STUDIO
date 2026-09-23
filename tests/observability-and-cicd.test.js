/**
 * Test Suite: K07/K08 — Observabilidade, Telemetria e Quality Gates CI/CD
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { StructuredLogger, sanitize } = require('../js/observability/logger.js');
const ClientTelemetryBeacon = require('../js/observability/client-telemetry-beacon.js');

console.log('🧪 Iniciando testes dos Blocos K07/K08 — Observabilidade & CI/CD...\n');

// 1. Teste do StructuredLogger e Sanitização de Secrets (K07)
console.log('Test 1: StructuredLogger & Sanitização de Secrets...');
const logger = new StructuredLogger('test-service');
const logEntry = logger.info('Teste de log estruturado', {
  action: 'TEST_ACTION',
  apiKey: 'sk-ant-test-secret-12345',
  password: 'super_secret_password',
  user: 'arquiteto@arqvertice.com'
}, 'cid_test_01', 12.34);

assert.strictEqual(logEntry.level, 'INFO');
assert.strictEqual(logEntry.service, 'test-service');
assert.strictEqual(logEntry.correlationId, 'cid_test_01');
assert.strictEqual(logEntry.durationMs, 12.34);
assert.strictEqual(logEntry.metadata.apiKey, '[REDACTED]', 'apiKey deve ser mascarada');
assert.strictEqual(logEntry.metadata.password, '[REDACTED]', 'password deve ser mascarada');
assert.strictEqual(logEntry.metadata.user, 'arquiteto@arqvertice.com');
console.log('  ✅ StructuredLogger registrou formato JSON e mascarou segredos com sucesso.');

// 2. Teste do ClientTelemetryBeacon e Opt-Out (K07)
console.log('\nTest 2: ClientTelemetryBeacon & Política de Opt-Out...');
const beacon = new ClientTelemetryBeacon({ projectId: 'prj-test-telemetry' });
assert.strictEqual(beacon.isOptedOut, false);

const sampleMetrics = beacon.recordFrameMetrics({
  fps: 59.4,
  frameTimeMs: 16.8,
  drawCalls: 42,
  gpuContextLost: false,
  ttfpMs: 350
});

assert.ok(sampleMetrics, 'Deve gerar registro de métricas');
assert.strictEqual(sampleMetrics.fps, 59.4);
assert.strictEqual(sampleMetrics.timeToFirstPixelMs, 350);

// Teste de Opt-Out
beacon.setOptOut(true);
assert.strictEqual(beacon.isOptedOut, true);
const optedOutMetrics = beacon.recordFrameMetrics({ fps: 60 });
assert.strictEqual(optedOutMetrics, null, 'Quando opted-out, não deve coletar métricas');
console.log('  ✅ ClientTelemetryBeacon e chave de Opt-Out validados com sucesso.');

// 3. Teste de Validação dos Workflows CI/CD (K08)
console.log('\nTest 3: Validação de Sintaxe e Estrutura dos Workflows GitHub Actions...');
const ciWorkflowPath = path.resolve('.github/workflows/ci.yml');
assert.ok(fs.existsSync(ciWorkflowPath), '.github/workflows/ci.yml deve existir');
const ciContent = fs.readFileSync(ciWorkflowPath, 'utf8');
assert.ok(ciContent.includes('npm run lint'), 'CI deve executar lint');
assert.ok(ciContent.includes('npm run typecheck'), 'CI deve executar typecheck');
assert.ok(ciContent.includes('npm test'), 'CI deve executar testes automatizados');
assert.ok(ciContent.includes('gitleaks'), 'CI deve executar escaneamento de segredos com gitleaks');

const cdWorkflowPath = path.resolve('.github/workflows/cd-release.yml');
assert.ok(fs.existsSync(cdWorkflowPath), '.github/workflows/cd-release.yml deve existir');
const cdContent = fs.readFileSync(cdWorkflowPath, 'utf8');
assert.ok(cdContent.includes('ghcr.io'), 'CD deve publicar no GitHub Container Registry');
assert.ok(cdContent.includes('docker/build-push-action'), 'CD deve usar build-push-action');
console.log('  ✅ Workflows .github/workflows/ci.yml e cd-release.yml validados com sucesso.');

console.log('\n🎉 TODOS OS TESTES DOS BLOCOS K07/K08 FORAM APROVADOS COM SUCESSO!\n');
