/**
 * ============================================================================
 * ARQVERTICE STUDIO — SUÍTE DE TESTES AUTOMATIZADOS (D03)
 * MOTOR DE GERAÇÃO DE PLANTA HUMANIZADA
 * ============================================================================
 */

const memoryStore = {};
global.localStorage = {
  getItem: (k) => memoryStore[k] || null,
  setItem: (k, v) => { memoryStore[k] = String(v); },
  removeItem: (k) => { delete memoryStore[k]; },
  clear: () => { Object.keys(memoryStore).forEach(k => delete memoryStore[k]); }
};
global.window = global;
global.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  body: {
    appendChild: () => {}
  }
};
global.escapeHTML = function (str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};
global.formatDateBR = (d) => d || '';
global.formatRelativeDate = (d) => 'recente';

const assert = require('assert');
const StudioState = require('../js/state.js');
global.StudioState = StudioState;

// Mock de StudioApp
global.StudioApp = {
  showToast: () => {},
  navigateTo: () => {},
  openEnvironmentWorkspace: () => {},
  openEnvironmentVisualization: () => {}
};

const { HumanizedPlanModule } = require('../js/humanized-plan-module.js');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function it(desc, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${desc}`);
  } catch (err) {
    failedTests++;
    console.error(`  ✗ ${desc}`);
    console.error(`    Erro: ${err.message}`);
  }
}

console.log('\n====================================================================');
console.log('ARQVERTICE STUDIO — TESTES D03 (MOTOR DE PLANTA HUMANIZADA)');
console.log('====================================================================\n');

// 1. Inicialização do Estado
StudioState.init();
const testProject = StudioState.data.projects[0];
const testEnv = StudioState.data.environments.find(e => e.projectId === testProject.id);

console.log(`Projeto de Teste: ${testProject.name} (${testProject.id})`);
console.log(`Ambiente de Teste: ${testEnv.name} (${testEnv.id})\n`);

// ====================================================================
// TESTES DO BLOCO D03
// ====================================================================

console.log('--- 1. Inicialização, Modos e Preservação de Escala ---');

it('Deve inicializar coleções humanizedPlans, humanizedPlanVersions e humanizedPlanGenerations', () => {
  assert.ok(Array.isArray(StudioState.data.humanizedPlans), 'humanizedPlans deve ser array');
  assert.ok(Array.isArray(StudioState.data.humanizedPlanVersions), 'humanizedPlanVersions deve ser array');
  assert.ok(Array.isArray(StudioState.data.humanizedPlanGenerations), 'humanizedPlanGenerations deve ser array');
});

it('Deve conter os modos canônicos e status de planta humanizada', () => {
  const modes = StudioState.HUMANIZED_PLAN_MODES;
  assert.ok(modes.includes('MODE_A_TRANSFORMATION'), 'Deve conter Modo A');
  assert.ok(modes.includes('MODE_B_HYBRID_COMPOSITION'), 'Deve conter Modo B');

  const statuses = StudioState.HUMANIZED_PLAN_STATUSES;
  assert.ok(statuses.includes('DRAFT'));
  assert.ok(statuses.includes('IN_REVIEW'));
  assert.ok(statuses.includes('APPROVED'));
  assert.ok(statuses.includes('REJECTED'));
  assert.ok(statuses.includes('SUPERSEDED'));
});

it('Deve preservar metadados técnicos de escala, dimensões e resolução', () => {
  const plan = StudioState.getHumanizedPlan(testProject.id, testEnv.id);
  assert.ok(plan, 'Plano humanizado deve existir');
  assert.strictEqual(plan.scaleNominal, '1:50', 'Escala original deve ser 1:50');
  assert.ok(plan.dimensionsM, 'Dimensões em metros devem estar registradas');
  assert.strictEqual(plan.unit, 'METERS', 'Unidade deve ser METERS');
  assert.strictEqual(plan.dpi, 300, 'Resolução deve ser 300 DPI');
  assert.ok(plan.sourceAsset, 'Fonte original técnica deve estar vinculada');
});

console.log('\n--- 2. Rastreabilidade da Fonte Geométrica (SOURCE -> HUMANIZED) ---');

it('Cada versão gerada deve manter vínculo com a versão da fonte geométrica do Revit', () => {
  const plan = StudioState.getHumanizedPlan(testProject.id, testEnv.id);
  assert.ok(plan.versions.length >= 1, 'Deve ter versões de teste');

  plan.versions.forEach(v => {
    assert.strictEqual(v.sourcePlanVersion, 'V01', `Versão ${v.versionTag} deve rastrear fonte geométrica`);
    assert.ok(v.planId === plan.id, 'Deve estar vinculada ao plano mestre');
    assert.ok(v.imageUrl, 'Deve ter URL de renderização');
  });
});

console.log('\n--- 3. Comandos do Motor (GERAR, REGENERAR, VARIAR, DUPLICAR) ---');

it('Deve gerar nova versão de planta humanizada (GERAR) com Modo A ou Modo B', () => {
  const plan = StudioState.getHumanizedPlan(testProject.id, testEnv.id);
  const initialCount = plan.versions.length;

  const result = StudioState.generateHumanizedPlan(plan.id, {
    mode: 'MODE_B_HYBRID_COMPOSITION',
    visualStyle: 'Contemporâneo Minimalista'
  });

  assert.ok(result.version, 'Deve retornar nova versão gerada');
  assert.strictEqual(result.version.mode, 'MODE_B_HYBRID_COMPOSITION');
  assert.strictEqual(result.version.status, 'IN_REVIEW');

  const updatedPlan = StudioState.getHumanizedPlan(testProject.id, testEnv.id);
  assert.strictEqual(updatedPlan.versions.length, initialCount + 1);
  assert.strictEqual(updatedPlan.currentVersionId, result.version.id);
});

it('Deve permitir regeneração (REGENERAR) mantendo histórico de IA', () => {
  const plan = StudioState.getHumanizedPlan(testProject.id, testEnv.id);
  const targetVer = plan.currentVersion;

  const regenResult = StudioState.regenerateHumanizedPlan(targetVer.id);
  assert.strictEqual(regenResult.version.id, targetVer.id);
  assert.ok(regenResult.generation, 'Deve registrar nova geração de IA');
  assert.strictEqual(regenResult.generation.status, 'SUCCESS');
});

it('Deve criar variação (CRIAR VARIAÇÃO) vinculada à versão pai', () => {
  const plan = StudioState.getHumanizedPlan(testProject.id, testEnv.id);
  const parentVer = plan.currentVersion;

  const varResult = StudioState.createHumanizedPlanVariation(parentVer.id, 'Variação com deck amadeirado', 'Mude somente o piso.');
  assert.ok(varResult.version, 'Deve gerar versão derivada');
  assert.strictEqual(varResult.version.parentVersionId, parentVer.id);
  assert.strictEqual(varResult.version.localizedInstruction, 'Mude somente o piso.');
});

it('Deve permitir duplicar versão como rascunho independente (DUPLICAR)', () => {
  const plan = StudioState.getHumanizedPlan(testProject.id, testEnv.id);
  const ver = plan.currentVersion;

  const cloned = StudioState.duplicateHumanizedPlanVersion(ver.id);
  assert.ok(cloned.id !== ver.id, 'ID duplicado deve ser novo');
  assert.strictEqual(cloned.status, 'DRAFT', 'Clonada deve iniciar como DRAFT');
  assert.ok(cloned.versionTag.includes('-CLONE'), 'Tag deve indicar clonagem');
});

console.log('\n--- 4. Comandos Pontuais (Pré-D07 Targeting) ---');

it('Deve compilar e registrar comandos pontuais específicos (ex: "Mude somente o piso.")', () => {
  const prompt = StudioState.buildHumanizedPlanPrompt(testProject.id, testEnv.id, {
    localizedInstruction: 'Mude somente o piso.'
  });

  assert.ok(prompt.includes('Mude somente o piso.'), 'Prompt deve conter instrução localizada');
  assert.ok(prompt.includes('PRESERVAÇÃO OBRIGATÓRIA'), 'Prompt deve conter salvaguarda de preservação');
  assert.ok(prompt.includes('Revit'), 'Prompt deve referenciar o modelo BIM');
});

console.log('\n--- 5. Governança de IA sem Chaves no Frontend ---');

it('Deve registrar execuções de IA com parâmetros e proibir chaves de API', () => {
  const gens = StudioState.data.humanizedPlanGenerations;
  assert.ok(gens.length >= 1, 'Deve haver registros de geração');

  gens.forEach(g => {
    assert.ok(g.provider, 'Deve registrar provider');
    assert.ok(g.model, 'Deve registrar model');
    assert.ok(g.prompt, 'Deve registrar prompt');
    assert.ok(g.parameters, 'Deve registrar parameters');
    // Verifica que não há chaves de API salvas
    const genStr = JSON.stringify(g);
    assert.ok(!genStr.includes('api_key') && !genStr.includes('apiKey') && !genStr.includes('sk-'), 'Proibido salvar API Keys');
  });
});

console.log('\n--- 6. Tratamento de Falha e Retry Seguro ---');

it('Falha na geração não deve corromper versão aprovada anterior e deve permitir retry', () => {
  const plan = StudioState.getHumanizedPlan(testProject.id, testEnv.id);
  const version = plan.currentVersion;

  const failureSim = StudioState.simulateGenerationFailureAndRetry(version.id);
  assert.strictEqual(failureSim.failedGeneration.status, 'FAILED');
  assert.ok(failureSim.failedGeneration.errorMessage.includes('Timeout'), 'Deve detalhar erro');

  // Versão falhada não pode ser aprovada
  const updatedVer = StudioState.getHumanizedPlanVersion(version.id);
  assert.ok(updatedVer.status !== 'APPROVED', 'Versão com falha não pode estar aprovada');

  // Executa retry com sucesso
  const retryResult = failureSim.retryAction();
  assert.strictEqual(retryResult.status, 'SUCCESS');
  assert.strictEqual(retryResult.retryCount, 2);
});

console.log('\n--- 7. Ciclo de Aprovação e Rejeição ---');

it('Ao aprovar uma versão, versões anteriores devem passar para SUPERSEDED', () => {
  const plan = StudioState.getHumanizedPlan(testProject.id, testEnv.id);
  const v1 = plan.versions[1] || plan.versions[0];
  const v2 = plan.versions[0];

  // Aprova v1 primeiro
  StudioState.approveHumanizedPlanVersion(v1.id, 'Cliente Pedro', 'Aprovado inicial');
  assert.strictEqual(StudioState.getHumanizedPlanVersion(v1.id).status, 'APPROVED');

  // Aprova v2 e verifica se v1 virou SUPERSEDED
  StudioState.approveHumanizedPlanVersion(v2.id, 'Cliente Pedro', 'Aprovada versão definitiva');
  assert.strictEqual(StudioState.getHumanizedPlanVersion(v2.id).status, 'APPROVED');
  assert.strictEqual(StudioState.getHumanizedPlanVersion(v1.id).status, 'SUPERSEDED');
});

it('Deve registrar motivo formal ao rejeitar uma versão', () => {
  const plan = StudioState.getHumanizedPlan(testProject.id, testEnv.id);
  const v = plan.versions[0];

  StudioState.rejectHumanizedPlanVersion(v.id, 'Arquiteto', 'Tom da madeira escuro demais');
  const rejected = StudioState.getHumanizedPlanVersion(v.id);
  assert.strictEqual(rejected.status, 'REJECTED');
  assert.strictEqual(rejected.rejectionReason, 'Tom da madeira escuro demais');

  // Restaura para aprovada para manter estado de teste saudável
  StudioState.approveHumanizedPlanVersion(v.id, 'Cliente Pedro', 'Restaurado para teste');
});

console.log('\n--- 8. Comparador Visual e Interface de Usuário ---');

it('Deve fornecer dados estruturados para comparação Original vs Humanizada e V01 vs V02', () => {
  const plan = StudioState.getHumanizedPlan(testProject.id, testEnv.id);

  // Original vs Humanizada
  const compOrig = StudioState.getPlanComparisonData(plan.id, 'ORIGINAL_VS_HUMANIZED');
  assert.strictEqual(compOrig.compareType, 'ORIGINAL_VS_HUMANIZED');
  assert.ok(compOrig.left.title.includes('Original'));
  assert.ok(compOrig.right.title.includes('Humanizada'));

  // V01 vs V02
  const compVers = StudioState.getPlanComparisonData(plan.id, 'VERSION_VS_VERSION');
  assert.strictEqual(compVers.compareType, 'VERSION_VS_VERSION');
  assert.ok(compVers.left.title.includes('V0'));
  assert.ok(compVers.right.title.includes('V0'));
});

it('HumanizedPlanModule.render deve produzir HTML completo com controles do motor e modais', () => {
  const html = HumanizedPlanModule.render(testEnv, testProject);
  assert.ok(typeof html === 'string', 'Render deve retornar string HTML');
  assert.ok(html.includes('hplan-container'), 'Deve conter container do motor');
  assert.ok(html.includes('HUMANIZED_PLAN_ENGINE'), 'Deve conter identificador do motor');
  assert.ok(html.includes('Modo A') || html.includes('Modo B'), 'Deve exibir badge de modo');
  assert.ok(html.includes('Comandos Pontuais'), 'Deve exibir painel de comandos pontuais');
  assert.ok(html.includes('Versões Geradas'), 'Deve listar histórico de versões');
  assert.ok(html.includes('modal-hplan-compare'), 'Deve incluir modal de comparação');
  assert.ok(html.includes('modal-hplan-generate'), 'Deve incluir modal de geração');
});

// ====================================================================
// RESULTADOS DA EXECUÇÃO
// ====================================================================

console.log('\n====================================================================');
console.log(`TOTAL DE TESTES D03 EXECUTADOS: ${totalTests}`);
console.log(`PASSOU: ${passedTests}`);
console.log(`FALHOU: ${failedTests}`);
console.log('====================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('✓ TODOS OS TESTES DO BLOCO D03 PASSARAM COM SUCESSO!\n');
}
