/**
 * ============================================================================
 * ARQVERTICE STUDIO — SUÍTE DE TESTES AUTOMATIZADOS (D05)
 * SISTEMA DE CÂMERAS E ENQUADRAMENTOS POR AMBIENTE
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

const { CameraSystemModule } = require('../js/camera-system-module.js');

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
console.log('ARQVERTICE STUDIO — TESTES D05 (SISTEMA DE CÂMERAS E ENQUADRAMENTOS)');
console.log('====================================================================\n');

StudioState.init();

const testProject = StudioState.data.projects[0];
const testEnv = StudioState.data.environments.find(e => e.projectId === testProject.id);

console.log(`Projeto Ativo: ${testProject.name} (${testProject.id})`);
console.log(`Ambiente Ativo: ${testEnv.name} (${testEnv.id})\n`);

// --- 1. Inicialização e Constantes Canônicas ---
console.log('--- 1. Inicialização e Constantes Canônicas ---');

it('Deve disponibilizar as coleções e constantes canônicas do sistema de câmeras', () => {
  assert.ok(Array.isArray(StudioState.data.environmentCameras), 'environmentCameras deve ser array');
  assert.ok(Array.isArray(StudioState.data.environmentCameraVersions), 'environmentCameraVersions deve ser array');

  assert.ok(StudioState.CAMERA_ORIGINS.includes('REVIT'));
  assert.ok(StudioState.CAMERA_ORIGINS.includes('MANUAL'));
  assert.ok(StudioState.CAMERA_ORIGINS.includes('REFERENCIA'));
  assert.ok(StudioState.CAMERA_ORIGINS.includes('SUGESTAO_IA'));

  assert.ok(StudioState.CAMERA_STATUSES.includes('DRAFT'));
  assert.ok(StudioState.CAMERA_STATUSES.includes('APPROVED'));
  assert.ok(StudioState.CAMERA_STATUSES.includes('LOCKED'));
  assert.ok(StudioState.CAMERA_STATUSES.includes('ARCHIVED'));
  assert.ok(StudioState.CAMERA_STATUSES.includes('REJECTED'));

  assert.ok(StudioState.CAMERA_FRAMINGS.includes('AMPLO_GERAL'));
  assert.ok(StudioState.CAMERA_FRAMINGS.includes('PLANO_MEDIO'));
  assert.ok(StudioState.CAMERA_FRAMINGS.includes('DETALHE_CLOSEUP'));

  assert.ok(StudioState.CAMERA_PURPOSES.includes('APRESENTACAO'));
  assert.ok(StudioState.CAMERA_PURPOSES.includes('TECNICA'));
  assert.ok(StudioState.CAMERA_PURPOSES.includes('CLIENTE'));
});

// --- 2. Criação de Câmera e Nomenclatura Canônica ---
console.log('\n--- 2. Criação de Câmera e Nomenclatura Canônica ---');

it('Deve conter as câmeras de exemplo canônicas no ambiente inicial', () => {
  const cameras = StudioState.getEnvironmentCameras(testProject.id, testEnv.id);
  assert.ok(cameras.length >= 3, 'Deve conter pelo menos 3 câmeras de exemplo');

  const c01 = cameras.find(c => c.cameraCode === 'C01');
  const c02 = cameras.find(c => c.cameraCode === 'C02');
  const c03 = cameras.find(c => c.cameraCode === 'C03');

  assert.ok(c01, 'C01 deve existir');
  assert.ok(c01.name.includes('Sala olhando para painel'), 'C01 deve ter nome canônico');
  assert.strictEqual(c01.origin, 'REVIT');

  assert.ok(c02, 'C02 deve existir');
  assert.ok(c02.name.includes('Painel olhando para jantar'), 'C02 deve ter nome canônico');
  assert.strictEqual(c02.origin, 'MANUAL');

  assert.ok(c03, 'C03 deve existir');
  assert.ok(c03.name.includes('Jantar olhando para cozinha'), 'C03 deve ter nome canônico');
  assert.strictEqual(c03.origin, 'REFERENCIA');
});

it('Deve criar nova câmera registrando todos os campos técnicos reais sem inventar dados', () => {
  const newCam = StudioState.createEnvironmentCamera({
    projectId: testProject.id,
    environmentId: testEnv.id,
    cameraCode: 'C04',
    name: 'C04 — Varanda olhando para deck da piscina',
    description: 'Tomada em plano geral valorizando a transição do piso interno com o deck de madeira',
    origin: 'MANUAL',
    framing: 'AMPLO_GERAL',
    purpose: 'APRESENTACAO',
    focalLength: '24mm',
    cameraHeightM: 1.60,
    targetDirection: 'Sul-Sudoeste para Piscina',
    positionDesc: 'Limite entre living e sacada integrada',
    aspectRatio: '16:9'
  });

  assert.ok(newCam.id);
  assert.strictEqual(newCam.cameraCode, 'C04');
  assert.strictEqual(newCam.status, 'DRAFT');
  assert.strictEqual(newCam.focalLength, '24mm');
  assert.strictEqual(newCam.cameraHeightM, 1.60);
  assert.strictEqual(newCam.currentVersion, 'V01');

  // Versão V01 inicial deve ser criada automaticamente
  const versions = StudioState.getCameraVersions(newCam.id);
  assert.strictEqual(versions.length, 1);
  assert.strictEqual(versions[0].versionTag, 'V01');
  assert.strictEqual(versions[0].framing, 'AMPLO_GERAL');
});

// --- 3. Referência Fotográfica (CAMERA_REFERENCE) ---
console.log('\n--- 3. Referência Fotográfica (CAMERA_REFERENCE) ---');

it('Deve associar imagem-referência de enquadramento (CAMERA_REFERENCE) à câmera', () => {
  const cameras = StudioState.getEnvironmentCameras(testProject.id, testEnv.id);
  const targetCam = cameras.find(c => c.cameraCode === 'C04');

  const refUrl = 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80';
  const updated = StudioState.associateCameraReference(targetCam.id, refUrl, 'Referência para tomada ampla com luz natural');

  assert.strictEqual(updated.cameraReferenceUrl, refUrl);
  assert.strictEqual(updated.origin, 'REFERENCIA');

  // Verifica persistência ao buscar novamente
  const refetched = StudioState.getEnvironmentCamera(targetCam.id);
  assert.strictEqual(refetched.cameraReferenceUrl, refUrl);
});

// --- 4. Relação com Versões: Alteração de Enquadramento sem Substituição Silenciosa ---
console.log('\n--- 4. Relação com Versões e Versionamento de Enquadramento ---');

it('Alteração de parâmetros de enquadramento deve criar nova versão sem sobrescrever a anterior', () => {
  const cameras = StudioState.getEnvironmentCameras(testProject.id, testEnv.id);
  const cam = cameras.find(c => c.cameraCode === 'C04');
  const initialVersionsCount = StudioState.getCameraVersions(cam.id).length;

  // Modifica parâmetros de enquadramento: focal muda de 24mm para 35mm
  const updatedResult = StudioState.updateEnvironmentCamera(cam.id, {
    framing: 'PLANO_MEDIO',
    focalLength: '35mm',
    cameraHeightM: 1.50,
    targetDirection: 'Foco exclusivo nas espreguiçadeiras do deck',
    versionNotes: 'Ajuste de enquadramento para plano médio focado no mobiliário solto'
  });

  const updatedCam = StudioState.getEnvironmentCamera(cam.id);
  assert.strictEqual(updatedCam.currentVersion, 'V02', 'A versão atual deve evoluir para V02');
  assert.strictEqual(updatedCam.focalLength, '35mm', 'A lente ativa deve ser atualizada para 35mm');

  // O histórico de versões deve conter tanto a V01 quanto a V02
  const allVersions = StudioState.getCameraVersions(cam.id);
  assert.strictEqual(allVersions.length, initialVersionsCount + 1, 'Total de versões deve incrementar');

  const v01 = allVersions.find(v => v.versionTag === 'V01');
  const v02 = allVersions.find(v => v.versionTag === 'V02');

  assert.ok(v01, 'Versão V01 deve continuar existindo no histórico');
  assert.strictEqual(v01.focalLength, '24mm', 'Versão V01 original deve preservar a focal de 24mm');

  assert.ok(v02, 'Versão V02 deve estar registrada');
  assert.strictEqual(v02.focalLength, '35mm', 'Versão V02 deve registrar a nova focal');
});

// --- 5. Fluxo de Aprovação e Bloqueio (APPROVE CAMERA & LOCK) ---
console.log('\n--- 5. Homologação (APPROVE CAMERA) e Bloqueio (LOCKED) ---');

it('Deve aprovar câmera tornando-a referência oficial e registrando decisão de memória', () => {
  const cameras = StudioState.getEnvironmentCameras(testProject.id, testEnv.id);
  const cam = cameras.find(c => c.cameraCode === 'C04');

  const approved = StudioState.approveCamera(cam.id, 'Pedro (Cliente Titular)', 'Enquadramento e lente 35mm aprovados');

  assert.strictEqual(approved.status, 'APPROVED');
  assert.strictEqual(approved.approvedBy, 'Pedro (Cliente Titular)');
  assert.ok(approved.approvedAt);

  // Verifica se memória do projeto C06 registrou a homologação
  const memories = StudioState.getProjectMemories ? StudioState.getProjectMemories(testProject.id) : (StudioState.data.projectMemories || []).filter(m => m.projectId === testProject.id);
  const camMemory = memories.find(m => m.elementKey === 'camera_c04_aprovada');
  assert.ok(camMemory, 'Memória institucional de câmera aprovada deve ser registrada');
});

it('Deve permitir bloquear câmera (LOCKED) e rejeitar alterações em câmeras bloqueadas', () => {
  const cameras = StudioState.getEnvironmentCameras(testProject.id, testEnv.id);
  const cam = cameras.find(c => c.cameraCode === 'C01');

  // C01 já é locked
  assert.strictEqual(cam.isLocked, true);

  // Tentar alterar enquadramento em câmera bloqueada deve lançar erro
  assert.throws(() => {
    StudioState.updateEnvironmentCamera(cam.id, {
      focalLength: '50mm'
    });
  }, /bloqueada/i, 'Deve bloquear modificações em câmera LOCKED');
});

// --- 6. Sugestão por IA sem Modificar Câmeras Bloqueadas ---
console.log('\n--- 6. Sugestão por IA com Salvaguarda de Câmeras Bloqueadas ---');

it('IA deve sugerir novos enquadramentos sem alterar as câmeras bloqueadas existentes', () => {
  const initialCameras = StudioState.getEnvironmentCameras(testProject.id, testEnv.id);
  const lockedInitial = initialCameras.filter(c => c.isLocked).map(c => ({ id: c.id, focal: c.focalLength, ver: c.currentVersion }));

  const result = StudioState.suggestCamerasByAI(testProject.id, testEnv.id);

  assert.strictEqual(result.success, true);
  assert.ok(result.suggestedCameras.length >= 2, 'Deve gerar sugestões');
  assert.ok(result.suggestedCameras.every(c => c.origin === 'SUGESTAO_IA'), 'Todas sugestões devem ter origin = SUGESTAO_IA');

  // As câmeras bloqueadas iniciais devem continuar exatamente iguais
  lockedInitial.forEach(lockedBefore => {
    const checkAfter = StudioState.getEnvironmentCamera(lockedBefore.id);
    assert.strictEqual(checkAfter.isLocked, true, 'Deve permanecer bloqueada');
    assert.strictEqual(checkAfter.focalLength, lockedBefore.focal, 'Lente não pode ser alterada');
    assert.strictEqual(checkAfter.currentVersion, lockedBefore.ver, 'Versão não pode ser alterada');
  });
});

// --- 7. Operações de Organização (Ordenar, Duplicar, Renomear, Arquivar, Rejeitar) ---
console.log('\n--- 7. Operações de Organização e Governança ---');

it('Deve permitir duplicar câmera gerando código subsequente', () => {
  const cameras = StudioState.getEnvironmentCameras(testProject.id, testEnv.id);
  const toDupl = cameras.find(c => c.cameraCode === 'C02');

  const duplicated = StudioState.duplicateCamera(toDupl.id);
  assert.ok(duplicated.id);
  assert.ok(duplicated.name.includes('Cópia de'));
  assert.strictEqual(duplicated.focalLength, toDupl.focalLength);
  assert.strictEqual(duplicated.status, 'DRAFT');
  assert.strictEqual(duplicated.isLocked, false);
});

it('Deve renomear câmera livre de bloqueio', () => {
  const cameras = StudioState.getEnvironmentCameras(testProject.id, testEnv.id);
  const toRename = cameras.find(c => c.cameraCode === 'C02');

  const renamed = StudioState.renameCamera(toRename.id, 'C02 — Painel TV com Foco no Jantar Formal');
  assert.strictEqual(renamed.name, 'C02 — Painel TV com Foco no Jantar Formal');
});

it('Deve reordenar câmeras atualizando orderIndex', () => {
  const cameras = StudioState.getEnvironmentCameras(testProject.id, testEnv.id);
  const ids = cameras.map(c => c.id).reverse(); // Inverte a ordem

  const reordered = StudioState.reorderCameras(testEnv.id, ids);
  assert.strictEqual(reordered[0].id, ids[0], 'Primeiro item deve coincidir com nova ordem');
  assert.strictEqual(reordered[0].orderIndex, 1);
});

it('Deve permitir arquivar câmera e rejeitar com justificativa formal', () => {
  const cameras = StudioState.getEnvironmentCameras(testProject.id, testEnv.id);
  const toArchive = cameras[cameras.length - 1];

  // Rejeição
  const rejected = StudioState.rejectCamera(toArchive.id, 'Eduardo Marques', 'Ângulo redundante com a tomada C01');
  assert.strictEqual(rejected.status, 'REJECTED');
  assert.strictEqual(rejected.rejectionReason, 'Ângulo redundante com a tomada C01');

  // Arquivamento
  const archived = StudioState.archiveCamera(toArchive.id);
  assert.strictEqual(archived.status, 'ARCHIVED');

  // Consulta padrão sem includeArchived não deve listar arquivada
  const activeCameras = StudioState.getEnvironmentCameras(testProject.id, testEnv.id);
  assert.ok(!activeCameras.some(c => c.id === toArchive.id), 'Câmera arquivada não deve constar na listagem ativa');
});

// --- 8. Módulo de Interface CameraSystemModule ---
console.log('\n--- 8. Módulo de Interface CameraSystemModule ---');

it('CameraSystemModule.render deve produzir HTML completo do sistema de câmeras', () => {
  const html = CameraSystemModule.render(testEnv, testProject);
  assert.ok(typeof html === 'string', 'Render deve retornar string HTML');
  assert.ok(html.includes('camera-system-container'), 'Deve conter container do sistema de câmeras');
  assert.ok(html.includes('D05 CAMERA_SYSTEM'), 'Deve conter tag identificadora do D05');
  assert.ok(html.includes('camera-cards-grid'), 'Deve renderizar grid de câmeras');
  assert.ok(html.includes('modal-camera-create'), 'Deve incluir modal de criação');
  assert.ok(html.includes('modal-camera-version'), 'Deve incluir modal de versão');
  assert.ok(html.includes('modal-camera-reference'), 'Deve incluir modal de referência');
});

// ====================================================================
// RESULTADOS DA EXECUÇÃO
// ====================================================================

console.log('\n====================================================================');
console.log(`TOTAL DE TESTES D05 EXECUTADOS: ${totalTests}`);
console.log(`PASSOU: ${passedTests}`);
console.log(`FALHOU: ${failedTests}`);
console.log('====================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('✓ TODOS OS TESTES DO BLOCO D05 PASSARAM COM SUCESSO!\n');
}
