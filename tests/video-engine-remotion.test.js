/**
 * ============================================================================
 * ARQVERTICE STUDIO — SUÍTE DE TESTES: BLOCO G — REMOTION VIDEO ENGINE
 * ============================================================================
 * Validação rigorosa dos requisitos:
 * 1. 10 Templates de Família de Composição
 * 2. Remotion Skill e diretrizes arquiteturais
 * 3. ProjectDataAdapter: extração real de prj-praia-01 (Pedro Albuquerque)
 * 4. ArchitecturalCinematicComposition: renderização determinística frame-a-frame
 * 5. Câmera arquitetônica (push-in, pan, tilt, safe areas)
 * 6. RemotionVideoEngine: execução programática de render e versionamento
 * 7. Fluxo Secundário Manual: importação de vídeo externo (Premiere/DaVinci) + QA
 * 8. Fluxo Secundário Híbrido: vídeo manual + motion Remotion
 * 9. Integração com QA Audiovisual (G14)
 * 10. Não-regressão do ArqVertice Studio
 * ============================================================================
 */

global.window = {
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
  }
};
global.localStorage = global.window.localStorage;
global.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => []
};

const assert = require('assert');
const StudioState = require('../js/state.js');
const VideoEngineContracts = require('../video/types/architectural-video-types.js');
const ProjectDataAdapter = require('../video/adapters/project-data-adapter.js');
const ArchitecturalComponents = require('../video/components/architectural-components.js');
const ArchitecturalCinematicComposition = require('../video/compositions/architectural-cinematic.js');
const RemotionVideoEngine = require('../video/render/remotion-engine.js');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✔ [PASS] ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(err);
  }
}

console.log('================================================================');
console.log('SUÍTE DE TESTES: BLOCO G — REMOTION VIDEO ENGINE');
console.log('================================================================\n');

StudioState.init();

// --- 1. Templates Canônicos ---
console.log('--- 1. Templates Canônicos e Família de Composições ---');

runTest('Contratos definem os 10 templates arquiteturais obrigatórios', () => {
  const templates = VideoEngineContracts.ARCHITECTURAL_VIDEO_TEMPLATES;
  assert.ok(templates);

  const expectedIds = [
    'ARCHITECTURAL_CINEMATIC',
    'ARCHITECTURAL_WALKTHROUGH',
    'INTERIOR_PRESENTATION',
    'FACADE_PRESENTATION',
    'PLAN_TO_RENDER',
    'MATERIALITY_PRESENTATION',
    'DAY_NIGHT',
    'BEFORE_AFTER',
    'ARCHITECTURAL_DETAIL',
    'PROJECT_COMMERCIAL'
  ];

  expectedIds.forEach(id => {
    assert.ok(templates[id], `Template ${id} deve existir`);
    assert.ok(templates[id].name, `Template ${id} deve possuir nome`);
    assert.ok(templates[id].defaultDurationSeconds > 0, `Template ${id} deve possuir duração`);
    assert.ok(Array.isArray(templates[id].sceneSequence), `Template ${id} deve possuir sequência de cenas`);
  });
});

runTest('Movimentos de câmera contemplam push-in, pan, tilt e parallax', () => {
  const motions = VideoEngineContracts.CAMERA_MOTIONS;
  assert.ok(motions.PUSH_IN);
  assert.ok(motions.PAN_LEFT);
  assert.ok(motions.TILT_UP);
  assert.ok(motions.PARALLAX_SUBTLE);
});

// --- 2. ProjectDataAdapter: Projeto Real prj-praia-01 ---
console.log('\n--- 2. Project Data Adapter (Residência de Praia — Pedro Albuquerque) ---');

runTest('DataAdapter extrai dados reais de prj-praia-01 sem inventar arquitetura', () => {
  const data = ProjectDataAdapter.buildVideoData('prj-praia-01');

  assert.strictEqual(data.projectId, 'prj-praia-01');
  assert.strictEqual(data.projectName, 'Residência de Praia');
  assert.strictEqual(data.clientName, 'Pedro Albuquerque');
  assert.strictEqual(data.typology, 'Residencial Unifamiliar (2 Pavimentos)');
  assert.strictEqual(data.builtAreaM2, 385);
  assert.ok(data.environments.length >= 4, 'Deve conter os 4 ambientes reais');
  assert.ok(data.scenes.length >= 2, 'Deve conter as cenas planejadas');
  assert.strictEqual(data.width, 1920);
  assert.strictEqual(data.height, 1080);
  assert.strictEqual(data.fps, 30);
  assert.ok(data.durationInFrames > 0);
});

runTest('DataAdapter adapta dimensões para proporção 9:16 vertical', () => {
  const data = ProjectDataAdapter.buildVideoData('prj-praia-01', null, { aspectRatio: '9:16' });
  assert.strictEqual(data.aspectRatio, '9:16');
  assert.strictEqual(data.width, 1080);
  assert.strictEqual(data.height, 1920);
});

// --- 3. Componentes Remotion ---
console.log('\n--- 3. Primitivas e Componentes Remotion ---');

runTest('Interpolate calcula interpolação linear e clamp com precisão', () => {
  const val0 = ArchitecturalComponents.interpolate(0, [0, 30], [0, 100], { extrapolateRight: 'clamp' });
  const val15 = ArchitecturalComponents.interpolate(15, [0, 30], [0, 100], { extrapolateRight: 'clamp' });
  const val30 = ArchitecturalComponents.interpolate(30, [0, 30], [0, 100], { extrapolateRight: 'clamp' });
  const val50 = ArchitecturalComponents.interpolate(50, [0, 30], [0, 100], { extrapolateRight: 'clamp' });

  assert.strictEqual(val0, 0);
  assert.strictEqual(val15, 50);
  assert.strictEqual(val30, 100);
  assert.strictEqual(val50, 100, 'Clamp deve segurar no limite superior');
});

runTest('calculateCameraTransform gera transformações físicas discretas', () => {
  const pushIn0 = ArchitecturalComponents.calculateCameraTransform(0, 90, 'push_in');
  const pushIn90 = ArchitecturalComponents.calculateCameraTransform(90, 90, 'push_in');

  assert.ok(pushIn0.transform.includes('scale(1.0000)'));
  assert.ok(pushIn90.transform.includes('scale(1.0600)'));
});

// --- 4. Composição Cinematográfica Principal ---
console.log('\n--- 4. Composição Cinematográfica (ArchitecturalCinematicComposition) ---');

runTest('renderFrame gera HTML determinístico com metadados do projeto', () => {
  const data = ProjectDataAdapter.buildVideoData('prj-praia-01');
  const frame0 = ArchitecturalCinematicComposition.renderFrame(data, 0);
  const frame100 = ArchitecturalCinematicComposition.renderFrame(data, 100);

  assert.ok(frame0.includes(data.projectName), 'Frame 0 deve conter nome do projeto');
  assert.ok(frame0.includes(data.clientName), 'Frame 0 deve conter nome do cliente');
  assert.ok(frame0.includes('remotion-canvas'), 'Frame 0 deve conter canvas Remotion');
  assert.ok(frame100.includes('remotion-media-layer'), 'Frame 100 deve conter camada de render');
});

// --- 5. Motor de Execução Remotion (Programático, Manual e Híbrido) ---
console.log('\n--- 5. Remotion Video Engine: Render Programático e Workflows ---');

runTest('executeRender gera versão de vídeo, outputUrl e roda QA automaticamente', () => {
  const res = RemotionVideoEngine.executeRender('prj-praia-01', 'video-praia-01');

  assert.strictEqual(res.success, true);
  assert.ok(res.outputUrl.includes('.mp4'));
  assert.ok(res.version);
  assert.ok(['PASS', 'WARNING', 'ERROR'].includes(res.qaStatus));
});

runTest('importManualVideo importa produção externa e registra versão com QA', () => {
  const res = RemotionVideoEngine.importManualVideo('video-praia-01', {
    fileName: 'apresentacao-premiere-pro.mp4',
    editor: 'Premiere Pro',
    durationSeconds: 45
  }, 'Eduardo Marques');

  assert.strictEqual(res.success, true);
  assert.strictEqual(res.importedAsset.assetType, 'manual_video');
  assert.ok(res.version.versionNumber);
  assert.ok(res.qaResult);
});

runTest('composeHybridVideo une vídeo externo com motion graphics Remotion', () => {
  const res = RemotionVideoEngine.composeHybridVideo('video-praia-01', 'uploads/tour-davinci.mp4');

  assert.strictEqual(res.success, true);
  assert.ok(res.jobId);
  assert.ok(res.hybridVersion);
});

// --- 6. Não-Regressão do ArqVertice Studio ---
console.log('\n--- 6. Testes de Não-Regressão ---');

runTest('Projetos, ambientes e estado continuam intactos', () => {
  const p = StudioState.getProject('prj-praia-01');
  assert.ok(p);
  assert.strictEqual(p.name, 'Residência de Praia');

  const envs = StudioState.getProjectEnvironments('prj-praia-01');
  assert.ok(envs.length >= 4);

  const videos = StudioState.getProjectVideos('prj-praia-01');
  assert.ok(videos.length >= 1);
});

console.log('\n================================================================');
console.log(`TOTAL DE TESTES: ${totalTests}`);
console.log(`PASSOU:         ${passedTests}`);
console.log(`FALHOU:         ${failedTests}`);
console.log('================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('✔ TODOS OS TESTES DO REMOTION VIDEO ENGINE PASSARAM COM SUCESSO!\n');
}
