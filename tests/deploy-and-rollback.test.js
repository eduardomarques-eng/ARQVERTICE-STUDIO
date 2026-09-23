/**
 * tests/deploy-and-rollback.test.js
 * ArqVértice Studio — Suíte de Testes Automatizados para o Bloco K09
 * Testa o Deploy Zero-Downtime Blue-Green, Protocolo de Rollback e AuditLedger.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const DeployOrchestrator = require('../scripts/deploy/deploy-engine');
const RollbackEngine = require('../scripts/deploy/rollback-engine');

const testDir = path.resolve(__dirname, '..', 'storage', 'test-deploy-env');
const testAuditDir = path.join(testDir, 'audit');
const testAuditFile = path.join(testAuditDir, 'deployments.audit.json');
const testStateFile = path.join(testDir, 'active-deployment.json');

function cleanup() {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 SUÍTE DE TESTES: BLOCO K09 — DEPLOY ZERO-DOWNTIME & ROLLBACK');
  console.log('================================================================\n');

  cleanup();

  // --------------------------------------------------------------------------
  console.log('--- 1. Deploy Zero-Downtime (Dry-Run / Simulação) ---');
  // --------------------------------------------------------------------------
  const deployer = new DeployOrchestrator({
    rootDir: path.resolve(__dirname, '..'),
    auditDir: testAuditDir,
    auditFile: testAuditFile,
    stateFile: testStateFile,
    dryRun: true,
    author: 'sre-engineer'
  });

  const deployRes1 = await deployer.deploy('v1.1.0');
  assert.strictEqual(deployRes1.success, true, 'Deploy inicial deve ter sucesso');
  assert.strictEqual(deployRes1.state.version, 'v1.1.0', 'Versão ativa deve ser atualizada para v1.1.0');
  assert.strictEqual(deployRes1.state.activeSlot, 'green', 'Primeiro switch deve alternar de blue para green');
  assert.strictEqual(deployRes1.auditEntry.status, 'SUCCESS', 'Audit status deve ser SUCCESS');
  assert.strictEqual(deployRes1.auditEntry.healthcheckVerified, true, 'Healthcheck deve ser verificado');
  console.log('  ✔ [PASS] Deploy inicial Blue ➔ Green executado com sucesso e registrado no AuditLedger');

  // --------------------------------------------------------------------------
  console.log('\n--- 2. Deploy Sequencial e Alternância de Slot (Green ➔ Blue) ---');
  // --------------------------------------------------------------------------
  const deployRes2 = await deployer.deploy('v1.2.0');
  assert.strictEqual(deployRes2.success, true, 'Segundo deploy deve ter sucesso');
  assert.strictEqual(deployRes2.state.version, 'v1.2.0', 'Versão ativa deve ser atualizada para v1.2.0');
  assert.strictEqual(deployRes2.state.activeSlot, 'blue', 'Segundo switch deve alternar de green para blue');
  assert.strictEqual(deployRes2.auditEntry.previousVersion, 'v1.1.0', 'Versão anterior deve ser v1.1.0');
  console.log('  ✔ [PASS] Segundo deploy Green ➔ Blue executado com integridade de slots');

  // --------------------------------------------------------------------------
  console.log('\n--- 3. Tratamento de Falha de Healthcheck no Warmup & Auto-Rollback ---');
  // --------------------------------------------------------------------------
  const failedDeployRes = await deployer.deploy('v1.3.0-bad', { mockHealthFailure: true });
  assert.strictEqual(failedDeployRes.success, false, 'Deploy com healthcheck defeituoso deve falhar');
  assert.strictEqual(failedDeployRes.rolledBack, true, 'Deve sinalizar acionamento de rollback');
  assert.strictEqual(failedDeployRes.auditEntry.status, 'FAILED', 'AuditLedger deve registrar status FAILED');
  
  // O estado ativo não deve ter sido corrompido pela falha
  const activeStateAfterFail = deployer.getActiveState();
  assert.strictEqual(activeStateAfterFail.version, 'v1.2.0', 'Versão ativa deve continuar v1.2.0');
  console.log('  ✔ [PASS] Falha de healthcheck interceptada preventivamente sem corromper o slot ativo');

  // --------------------------------------------------------------------------
  console.log('\n--- 4. Protocolo de Rollback Instantâneo Manual ---');
  // --------------------------------------------------------------------------
  const rollbackEngine = new RollbackEngine({
    rootDir: path.resolve(__dirname, '..'),
    auditDir: testAuditDir,
    auditFile: testAuditFile,
    stateFile: testStateFile,
    dryRun: true,
    author: 'incident-commander',
    reason: 'Teste de estresse e validação de reversão'
  });

  const rbRes1 = await rollbackEngine.rollback('v1.1.0');
  assert.strictEqual(rbRes1.success, true, 'Rollback manual deve ser concluído com sucesso');
  assert.strictEqual(rbRes1.state.version, 'v1.1.0', 'Versão ativa deve retornar para v1.1.0');
  assert.strictEqual(rbRes1.auditEntry.action, 'ROLLBACK_EXECUTED', 'Ação no AuditLedger deve ser ROLLBACK_EXECUTED');
  assert.strictEqual(rbRes1.auditEntry.status, 'ROLLED_BACK', 'Status de rollback confirmado');
  console.log('  ✔ [PASS] Rollback manual para versão v1.1.0 executado instantaneamente');

  // --------------------------------------------------------------------------
  console.log('\n--- 5. Rollback Automático Resolvendo Versão do AuditLedger ---');
  // --------------------------------------------------------------------------
  const lastKnown = rollbackEngine.findLastSuccessfulVersion();
  assert.ok(lastKnown, 'Deve identificar versão anterior no AuditLedger');
  
  const rbRes2 = await rollbackEngine.rollback(null, { reason: 'Auto rollback test' });
  assert.strictEqual(rbRes2.success, true, 'Rollback automático deve suceder');
  console.log(`  ✔ [PASS] Rollback automático resolveu versão estável anterior (${rbRes2.state.version})`);

  // --------------------------------------------------------------------------
  console.log('\n--- 6. Integridade do AuditLedger ---');
  // --------------------------------------------------------------------------
  const ledger = deployer.getAuditLedger();
  assert.ok(ledger.length >= 4, 'AuditLedger deve conter todos os eventos registrados');
  for (const entry of ledger) {
    assert.ok(entry.id, 'Entrada de auditoria deve conter ID');
    assert.ok(entry.timestamp, 'Entrada de auditoria deve conter timestamp ISO');
    assert.ok(entry.author, 'Entrada de auditoria deve conter autor');
    assert.ok(entry.version, 'Entrada de auditoria deve conter versão');
    assert.ok(entry.status, 'Entrada de auditoria deve conter status');
  }
  console.log(`  ✔ [PASS] AuditLedger validado com ${ledger.length} eventos imutáveis registrados`);

  // --------------------------------------------------------------------------
  console.log('\n--- 7. Verificação de Arquivos de Produção & Scripts ---');
  // --------------------------------------------------------------------------
  const deployScript = path.resolve(__dirname, '..', 'scripts', 'deploy-production.sh');
  const rollbackScript = path.resolve(__dirname, '..', 'scripts', 'rollback-production.sh');
  const playbook = path.resolve(__dirname, '..', 'docs', 'production', 'K09_DEPLOY_ROLLBACK_PLAYBOOK.md');

  assert.ok(fs.existsSync(deployScript), 'scripts/deploy-production.sh deve existir');
  assert.ok(fs.existsSync(rollbackScript), 'scripts/rollback-production.sh deve existir');
  assert.ok(fs.existsSync(playbook), 'docs/production/K09_DEPLOY_ROLLBACK_PLAYBOOK.md deve existir');

  const playbookContent = fs.readFileSync(playbook, 'utf8');
  assert.ok(playbookContent.includes('Blue-Green'), 'Playbook deve documentar Blue-Green');
  assert.ok(playbookContent.includes('healthz/ready'), 'Playbook deve documentar healthcheck de aquecimento');
  assert.ok(playbookContent.includes('AuditLedger'), 'Playbook deve documentar AuditLedger');
  console.log('  ✔ [PASS] Scripts operacionais e Playbook de Emergência K09 validados');

  cleanup();

  console.log('\n================================================================');
  console.log('🎉 TODOS OS 7 TESTES DO BLOCO K09 PASSARAM COM SUCESSO!');
  console.log('================================================================\n');
}

if (require.main === module) {
  runTests().catch(err => {
    console.error('❌ Falha nos testes de Deploy/Rollback:', err);
    process.exit(1);
  });
}

module.exports = runTests;
