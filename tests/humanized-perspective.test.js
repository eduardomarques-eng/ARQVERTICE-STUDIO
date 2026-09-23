/**
 * ============================================================================
 * ARQVERTICE STUDIO — SUÍTE DE TESTES AUTOMATIZADOS (D04)
 * MOTOR DE GERAÇÃO DE PERSPECTIVAS HUMANIZADAS
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

const { HumanizedPerspectiveModule } = require('../js/humanized-perspective-module.js');

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
console.log('ARQVERTICE STUDIO — TESTES D04 (MOTOR DE PERSPECTIVAS HUMANIZADAS)');
console.log('====================================================================\n');

StudioState.init();

const testProject = StudioState.data.projects[0];
const testEnv = StudioState.data.environments.find(e => e.projectId === testProject.id);

console.log(`Projeto Ativo: ${testProject.name} (${testProject.id})`);
console.log(`Ambiente Ativo: ${testEnv.name} (${testEnv.id})`);

// --- 1. Inicialização e Presença dos Dados Base do Revit ---
console.log('\n--- 1. Inicialização e Perspectivas Base do Revit ---');

it('Deve inicializar coleções humanizedPerspectives, humanizedPerspectiveVersions e approvedVisualOutputs', () => {
  assert.ok(Array.isArray(StudioState.data.humanizedPerspectives), 'humanizedPerspectives deve ser um array');
  assert.ok(Array.isArray(StudioState.data.humanizedPerspectiveVersions), 'humanizedPerspectiveVersions deve ser um array');
  assert.ok(Array.isArray(StudioState.data.approvedVisualOutputs), 'approvedVisualOutputs deve ser um array');
  assert.ok(StudioState.data.humanizedPerspectives.length > 0, 'Deve conter seeds de perspectivas');
});

it('Deve recuperar perspectivas humanizadas de um ambiente específico', () => {
  const persps = StudioState.getHumanizedPerspectives(testProject.id, testEnv.id);
  assert.ok(persps.length > 0, 'Deve encontrar perspectivas para amb-sala-01');
  const p = persps[0];
  assert.strictEqual(p.environmentId, testEnv.id);
  assert.ok(p.baseImageUrl, 'Deve ter URL da perspectiva base original');
  assert.ok(p.cameraReference, 'Deve possuir câmera de referência associada');
});

// --- 2. Matrizes de Preservação e Camadas Editáveis ---
console.log('\n--- 2. Matrizes de Preservação e Camadas Editáveis ---');

it('Deve disponibilizar constantes oficiais de elementos preservados e editáveis', () => {
  const preserved = StudioState.PERSPECTIVE_PRESERVED_ELEMENTS;
  const editable = StudioState.PERSPECTIVE_EDITABLE_ELEMENTS;

  assert.ok(preserved.includes('paredes'), 'Deve preservar paredes');
  assert.ok(preserved.includes('aberturas'), 'Deve preservar aberturas');
  assert.ok(preserved.includes('proporcoes'), 'Deve preservar proporcoes');
  assert.ok(preserved.includes('teto'), 'Deve preservar teto');
  assert.ok(preserved.includes('piso'), 'Deve preservar piso');
  assert.ok(preserved.includes('layout'), 'Deve preservar layout');
  assert.ok(preserved.includes('elementos_fixos'), 'Deve preservar elementos_fixos');

  assert.ok(editable.includes('mobiliario'), 'Mobiliário deve ser editável');
  assert.ok(editable.includes('decoracao'), 'Decoração deve ser editável');
  assert.ok(editable.includes('materiais'), 'Materiais devem ser editáveis');
  assert.ok(editable.includes('iluminacao'), 'Iluminação deve ser editável');
  assert.ok(editable.includes('objetos'), 'Objetos devem ser editáveis');
  assert.ok(editable.includes('paisagismo'), 'Paisagismo deve ser editável');
});

// --- 3. Parâmetros de Realismo, Iluminação e Atmosfera ---
console.log('\n--- 3. Parâmetros de Realismo, Iluminação e Atmosfera ---');

it('Deve validar e registrar os níveis oficiais de realismo', () => {
  const levels = StudioState.PERSPECTIVE_REALISM_LEVELS;
  assert.ok(levels.includes('APRESENTACAO'));
  assert.ok(levels.includes('REALISTA'));
  assert.ok(levels.includes('FOTOREALISTA'));
});

it('Deve validar e registrar os cenários oficiais de iluminação', () => {
  const setups = StudioState.PERSPECTIVE_LIGHTING_SETUPS;
  assert.ok(setups.includes('DIA'));
  assert.ok(setups.includes('MANHA'));
  assert.ok(setups.includes('TARDE'));
  assert.ok(setups.includes('NOITE'));
  assert.ok(setups.includes('ILUMINACAO_INTERNA'));
  assert.ok(setups.includes('ILUMINACAO_NATURAL_PREDOMINANTE'));
});

it('Deve validar e registrar as atmosferas permitidas sem alterar arquitetura', () => {
  const atms = StudioState.PERSPECTIVE_ATMOSPHERES;
  assert.ok(atms.includes('ACONCHEGANTE'));
  assert.ok(atms.includes('SOFISTICADA'));
  assert.ok(atms.includes('NATURAL'));
  assert.ok(atms.includes('CONTEMPORANEA'));
  assert.ok(atms.includes('DRAMATICA'));
  assert.ok(atms.includes('LEVE'));
  assert.ok(atms.includes('OUTRA'));
});

// --- 4. Geração de Perspectiva Humanizada com Metadados ---
console.log('\n--- 4. Geração de Perspectiva Humanizada com Metadados ---');

it('Deve gerar nova versão de perspectiva com metadados estruturados e prompt sintetizado', () => {
  const persp = StudioState.getHumanizedPerspectives(testProject.id, testEnv.id)[0];
  const initialVersionsCount = StudioState.getHumanizedPerspectiveVersions(persp.id).length;

  const newVersion = StudioState.generateHumanizedPerspective(persp.id, {
    realismLevel: 'FOTOREALISTA',
    lightingSetup: 'TARDE',
    atmosphere: 'SOFISTICADA',
    customNotes: 'Enfatizar textura do piso de madeira e reflexos no vidro da sacada',
    model: 'Gemini Imagen 3 Architect Pro'
  });

  assert.ok(newVersion.id, 'Versão gerada deve possuir ID');
  assert.strictEqual(newVersion.perspectiveId, persp.id);
  assert.strictEqual(newVersion.realismLevel, 'FOTOREALISTA');
  assert.strictEqual(newVersion.lightingSetup, 'TARDE');
  assert.strictEqual(newVersion.atmosphere, 'SOFISTICADA');
  assert.ok(newVersion.prompt, 'Deve possuir prompt de síntese gerado');
  assert.ok(newVersion.prompt.includes('PRESERVAÇÃO INVIOLÁVEL: paredes, aberturas'), 'Prompt deve impor preservação');
  assert.ok(newVersion.prompt.includes('ELEMENTOS HUMANIZADOS E EDITÁVEIS: mobiliario, decoracao'), 'Prompt deve especificar camadas editáveis');
  assert.ok(newVersion.baseImageUrl, 'Versão deve registrar URL da imagem base');
  assert.ok(newVersion.generatedImageUrl, 'Versão deve conter imagem gerada');

  const afterCount = StudioState.getHumanizedPerspectiveVersions(persp.id).length;
  assert.strictEqual(afterCount, initialVersionsCount + 1, 'Total de versões deve incrementar em 1');
});

// --- 5. Imutabilidade da Imagem-Base ---
console.log('\n--- 5. Imutabilidade da Imagem-Base ---');

it('A imagem-base do Revit NUNCA deve ser alterada ou substituída pelas novas gerações', () => {
  const persp = StudioState.getHumanizedPerspectives(testProject.id, testEnv.id)[0];
  const originalBaseUrl = persp.baseImageUrl;

  // Realiza outra geração
  StudioState.generateHumanizedPerspective(persp.id, {
    realismLevel: 'APRESENTACAO',
    lightingSetup: 'NOITE',
    atmosphere: 'DRAMATICA'
  });

  const perspRefetched = StudioState.getHumanizedPerspective(persp.id);
  assert.strictEqual(perspRefetched.baseImageUrl, originalBaseUrl, 'URL da perspectiva base deve continuar exatamente a mesma');
});

// --- 6. Variações sem Destruição da Versão Anterior ---
console.log('\n--- 6. Ramificação de Variações Não Destrutivas ---');

it('Deve gerar variação ramificada a partir de uma versão sem destruir a anterior', () => {
  const persp = StudioState.getHumanizedPerspectives(testProject.id, testEnv.id)[0];
  const versions = StudioState.getHumanizedPerspectiveVersions(persp.id);
  const parentVersion = versions[0];

  const variation = StudioState.createPerspectiveVariation(parentVersion.id, {
    lightingSetup: 'MANHA',
    atmosphere: 'NATURAL',
    variationNotes: 'Variação com luz suave matinal e folhagens adicionais'
  });

  assert.ok(variation.id, 'Variação deve possuir ID');
  assert.ok(variation.versionNumber.includes('-VAR') || variation.versionNumber.includes('.'), 'Número de versão deve indicar variação');
  assert.strictEqual(variation.parentVersionId, parentVersion.id, 'Deve manter link para a versão pai');
  assert.strictEqual(variation.lightingSetup, 'MANHA');
  assert.strictEqual(variation.atmosphere, 'NATURAL');

  // A versão pai deve continuar intacta
  const parentCheck = StudioState.getHumanizedPerspectiveVersion(parentVersion.id);
  assert.ok(parentCheck, 'Versão pai deve continuar existindo intacta');
});

// --- 7. Aprovação e Integração no APPROVED_VISUAL_OUTPUT ---
console.log('\n--- 7. Aprovação e APPROVED_VISUAL_OUTPUT ---');

it('Aprovação de versão de perspectiva deve registrar em APPROVED_VISUAL_OUTPUT e gerar memória', () => {
  const persp = StudioState.getHumanizedPerspectives(testProject.id, testEnv.id)[0];
  const versions = StudioState.getHumanizedPerspectiveVersions(persp.id);
  const targetVersion = versions[versions.length - 1];

  const approved = StudioState.approvePerspectiveVersion(
    targetVersion.id,
    'Arquiteta Camila',
    'Excelente definição de texturas e fidelidade aos vãos do Revit'
  );

  assert.strictEqual(approved.status, 'APPROVED');
  assert.strictEqual(approved.approvedBy, 'Arquiteta Camila');
  assert.ok(approved.approvalDate);

  // Verifica se o parent perspective teve activeVersionId atualizado
  const updatedPersp = StudioState.getHumanizedPerspective(persp.id);
  assert.strictEqual(updatedPersp.activeVersionId, approved.id);

  // Verifica APPROVED_VISUAL_OUTPUT
  const approvedOutputs = StudioState.getApprovedVisualOutputs(testProject.id, testEnv.id);
  assert.ok(approvedOutputs.length > 0, 'APPROVED_VISUAL_OUTPUT deve conter item aprovado');
  const foundOutput = approvedOutputs.find(o => o.versionId === approved.id);
  assert.ok(foundOutput, 'Saída aprovada deve estar registrada no catálogo global');
  assert.strictEqual(foundOutput.type, 'HUMANIZED_PERSPECTIVE');
  assert.strictEqual(foundOutput.realismLevel, approved.realismLevel);

  // Verifica se memória do projeto C06 recebeu registro
  const memories = StudioState.getProjectMemories ? StudioState.getProjectMemories(testProject.id) : (StudioState.data.projectMemories || []).filter(m => m.projectId === testProject.id);
  const memoryApproved = memories.find(m => m.category === 'APPROVED_OUTPUT' && (m.subject || '').includes('Perspectiva Humanizada Aprovada'));
  assert.ok(memoryApproved, 'Memória do projeto deve registrar aprovação de saída visual homologada');
});

// --- 8. Rejeição com Motivo e Auditoria ---
console.log('\n--- 8. Rejeição com Motivo e Auditoria ---');

it('Deve permitir rejeição formal de versão registrando motivo sem excluir a versão', () => {
  const persp = StudioState.getHumanizedPerspectives(testProject.id, testEnv.id)[0];
  // Cria nova versão para ser rejeitada
  const toReject = StudioState.generateHumanizedPerspective(persp.id, {
    realismLevel: 'APRESENTACAO',
    lightingSetup: 'NOITE',
    atmosphere: 'DRAMATICA'
  });

  const rejected = StudioState.rejectPerspectiveVersion(
    toReject.id,
    'Cliente Pedro',
    'Iluminação noturna ficou escura demais para a proposta praiana'
  );

  assert.strictEqual(rejected.status, 'REJECTED');
  assert.strictEqual(rejected.rejectedBy, 'Cliente Pedro');
  assert.strictEqual(rejected.rejectionReason, 'Iluminação noturna ficou escura demais para a proposta praiana');

  // A versão continua existindo para consulta e auditoria
  const check = StudioState.getHumanizedPerspectiveVersion(toReject.id);
  assert.ok(check, 'Versão rejeitada não deve ser deletada');
  assert.strictEqual(check.status, 'REJECTED');
});

// --- 9. Comparador Visual (Revit Base vs Humanizada e Versões) ---
console.log('\n--- 9. Comparador Visual Estruturado ---');

it('Deve fornecer dados comparativos estruturados entre Revit Base vs Humanizada', () => {
  const persp = StudioState.getHumanizedPerspectives(testProject.id, testEnv.id)[0];
  const comp = StudioState.getPerspectiveComparisonData(persp.id, 'BASE_VS_HUMANIZED');

  assert.strictEqual(comp.compareType, 'BASE_VS_HUMANIZED');
  assert.ok(comp.left, 'Lado esquerdo deve existir');
  assert.ok(comp.right, 'Lado direito deve existir');
  assert.ok(comp.left.badge.includes('Revit Base') || comp.left.badge.includes('Base Original'));
  assert.ok(comp.right.badge.includes('Humanizada') || comp.right.badge.includes('V0'));
  assert.ok(comp.left.url, 'Lado esquerdo deve ter URL');
  assert.ok(comp.right.url, 'Lado direito deve ter URL');
});

it('Deve fornecer dados comparativos estruturados entre duas versões geradas', () => {
  const persp = StudioState.getHumanizedPerspectives(testProject.id, testEnv.id)[0];
  const comp = StudioState.getPerspectiveComparisonData(persp.id, 'VERSION_VS_VERSION');

  assert.strictEqual(comp.compareType, 'VERSION_VS_VERSION');
  assert.ok(comp.left, 'Lado esquerdo deve existir');
  assert.ok(comp.right, 'Lado direito deve existir');
  assert.ok(comp.left.badge.includes('V0'));
  assert.ok(comp.right.badge.includes('V0'));
});

// --- 10. Módulo de Interface HumanizedPerspectiveModule ---
console.log('\n--- 10. Módulo de Interface HumanizedPerspectiveModule ---');

it('HumanizedPerspectiveModule.render deve produzir HTML completo do motor de perspectiva', () => {
  const html = HumanizedPerspectiveModule.render(testEnv, testProject);
  assert.ok(typeof html === 'string', 'Render deve retornar string HTML');
  assert.ok(html.includes('hpersp-container'), 'Deve conter container hpersp-container');
  assert.ok(html.includes('HUMANIZED_PERSPECTIVE_ENGINE'), 'Deve conter identificador do motor D04');
  assert.ok(html.includes('Preservação Arquitetônica Inviolável'), 'Deve exibir banner de preservação');
  assert.ok(html.includes('Camadas Editáveis'), 'Deve listar camadas editáveis');
  assert.ok(html.includes('Histórico de Versões'), 'Deve renderizar histórico de versões');
  assert.ok(html.includes('hpersp-compare-modal') || html.includes('modal-hpersp-compare'), 'Deve conter modal de comparação');
  assert.ok(html.includes('hpersp-gen-modal') || html.includes('modal-hpersp-generate'), 'Deve conter modal de geração');
  assert.ok(html.includes('APPROVED_VISUAL_OUTPUT'), 'Deve conter destino homologado');
});

// ====================================================================
// RESULTADOS DA EXECUÇÃO
// ====================================================================

console.log('\n====================================================================');
console.log(`TOTAL DE TESTES D04 EXECUTADOS: ${totalTests}`);
console.log(`PASSOU: ${passedTests}`);
console.log(`FALHOU: ${failedTests}`);
console.log('====================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('✓ TODOS OS TESTES DO BLOCO D04 PASSARAM COM SUCESSO!\n');
}
