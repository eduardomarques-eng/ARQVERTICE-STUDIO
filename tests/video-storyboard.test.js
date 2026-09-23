/**
 * Suíte de Testes Automatizados — Bloco G06: Storyboard Visual do ArqVertice Studio
 *
 * Validações exigidas:
 * - Objetivo: Visualizar o vídeo antes da produção para validar a narrativa (sem gerar vídeo final).
 * - Cada quadro possui 11 campos obrigatórios:
 *   número, cena, duração, imagem, vídeo, movimento, texto, narração, áudio, transição, observações.
 * - Visual com numeração formatada em grid [01] [02] [03] [04] / [05] [06] [07] [08].
 * - Cada quadro pode ser arrastado (reorder).
 * - Permitir operações:
 *   - reorder
 *   - duplicar
 *   - excluir
 *   - editar
 *   - substituir asset
 * - Criar Preview Sequencial (player modal).
 * - Indicador de Duração Total e Warning quando ultrapassar duração configurada.
 * - "Não apagar automaticamente conteúdo".
 * - "Ajustar Automaticamente" somente mediante confirmação explícita.
 * - Renderização da Interface (VideoStoryboardModule).
 */

// Mock de ambiente para execução em Node.js
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
  querySelectorAll: () => [],
  addEventListener: () => {}
};

const assert = require('assert');
const StudioState = require('../js/state.js');
const VideoStoryboardModule = require('../js/video-storyboard-module.js');

StudioState.init();

let testsPassed = 0;
let testsFailed = 0;

function runTest(testName, testFn) {
  try {
    testFn();
    console.log(`  ✔ [PASS] ${testName}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${testName}`);
    console.error(err);
    testsFailed++;
  }
}

console.log('================================================================');
console.log('SUÍTE DE TESTES: BLOCO G06 — STORYBOARD VISUAL');
console.log('================================================================\n');

runTest('Deve conter o catálogo de movimentos de câmera (STORYBOARD_MOVEMENTS)', () => {
  assert.ok(StudioState.STORYBOARD_MOVEMENTS, 'STORYBOARD_MOVEMENTS deve estar definido');
  const ids = StudioState.STORYBOARD_MOVEMENTS.map(m => m.id);
  assert.ok(ids.includes('static'), 'Deve conter static');
  assert.ok(ids.includes('pan_left'), 'Deve conter pan_left');
  assert.ok(ids.includes('pan_right'), 'Deve conter pan_right');
  assert.ok(ids.includes('tilt_up'), 'Deve conter tilt_up');
  assert.ok(ids.includes('tilt_down'), 'Deve conter tilt_down');
  assert.ok(ids.includes('zoom_in'), 'Deve conter zoom_in');
  assert.ok(ids.includes('zoom_out'), 'Deve conter zoom_out');
  assert.ok(ids.includes('dolly_forward'), 'Deve conter dolly_forward');
  assert.ok(ids.includes('dolly_backward'), 'Deve conter dolly_backward');
  assert.ok(ids.includes('orbit'), 'Deve conter orbit');
});

runTest('Deve gerar storyboard com os 11 campos obrigatórios para cada quadro', () => {
  const projectId = 'prj-praia-01';
  const video = StudioState.createVideoProject({
    projectId,
    title: 'Vídeo Residência Praia - Storyboard Test',
    type: 'apresentacao_projeto',
    targetDuration: 45
  });

  const storyboard = StudioState.generateStoryboardFromNarrative(video.id);
  assert.ok(storyboard, 'Storyboard deve ser gerado');
  assert.equal(storyboard.videoProjectId, video.id);
  assert.ok(storyboard.frames.length > 0, 'Deve conter quadros');

  const frame = storyboard.frames[0];
  // 11 campos:
  assert.ok('frameNumber' in frame, 'Deve conter número');
  assert.ok('sceneName' in frame, 'Deve conter cena');
  assert.ok('duration' in frame, 'Deve conter duração');
  assert.ok('imageUrl' in frame, 'Deve conter imagem');
  assert.ok('videoUrl' in frame, 'Deve conter vídeo');
  assert.ok('movement' in frame, 'Deve conter movimento');
  assert.ok('screenText' in frame, 'Deve conter texto');
  assert.ok('voiceoverText' in frame, 'Deve conter narração');
  assert.ok('audioTrack' in frame, 'Deve conter áudio');
  assert.ok('transition' in frame, 'Deve conter transição');
  assert.ok('notes' in frame, 'Deve conter observações');

  assert.equal(frame.frameNumber, 1, 'Primeiro quadro deve ser número 1');
  assert.equal(typeof frame.duration, 'number', 'Duração deve ser numérica');
});

runTest('Deve reordenar (reorder) quadros e atualizar numeração sequencial', () => {
  const projectId = 'prj-praia-01';
  const video = StudioState.createVideoProject({
    projectId,
    title: 'Vídeo Reorder Test',
    type: 'apresentacao_projeto'
  });

  const sb = StudioState.generateStoryboardFromNarrative(video.id);
  const initialFrame0Id = sb.frames[0].id;
  const initialFrame1Id = sb.frames[1].id;

  // Move frame 0 to position 1
  const updatedSb = StudioState.reorderStoryboardFrames(video.id, 0, 1);
  assert.equal(updatedSb.frames[0].id, initialFrame1Id, 'O antigo frame 1 agora deve ser o primeiro');
  assert.equal(updatedSb.frames[1].id, initialFrame0Id, 'O antigo frame 0 agora deve ser o segundo');
  assert.equal(updatedSb.frames[0].frameNumber, 1, 'Novo primeiro quadro deve ser renumerado como 1');
  assert.equal(updatedSb.frames[1].frameNumber, 2, 'Novo segundo quadro deve ser renumerado como 2');
});

runTest('Deve duplicar quadro mantendo atributos e renumerando a sequência', () => {
  const projectId = 'prj-praia-01';
  const video = StudioState.createVideoProject({
    projectId,
    title: 'Vídeo Duplicate Test',
    type: 'apresentacao_projeto'
  });

  const sb = StudioState.generateStoryboardFromNarrative(video.id);
  const initialCount = sb.frames.length;
  const targetFrame = sb.frames[0];

  const updatedSb = StudioState.duplicateStoryboardFrame(video.id, targetFrame.id);
  assert.equal(updatedSb.frames.length, initialCount + 1, 'Quantidade de quadros deve aumentar em 1');
  
  const duplicated = updatedSb.frames[1];
  assert.equal(duplicated.sceneName, targetFrame.sceneName, 'Cena deve ser idêntica');
  assert.equal(duplicated.duration, targetFrame.duration, 'Duração deve ser idêntica');
  assert.equal(duplicated.movement, targetFrame.movement, 'Movimento deve ser preservado');
  assert.equal(duplicated.frameNumber, 2, 'Posição do quadro duplicado deve ser 2');
  assert.ok(duplicated.notes.includes('(Cópia)'), 'Observações devem indicar que é uma cópia');
});

runTest('Deve excluir quadro e renumerar os quadros restantes', () => {
  const projectId = 'prj-praia-01';
  const video = StudioState.createVideoProject({
    projectId,
    title: 'Vídeo Delete Test',
    type: 'apresentacao_projeto'
  });

  const sb = StudioState.generateStoryboardFromNarrative(video.id);
  const initialCount = sb.frames.length;
  const frameToDeleteId = sb.frames[0].id;
  const secondFrameId = sb.frames[1].id;

  const updatedSb = StudioState.deleteStoryboardFrame(video.id, frameToDeleteId);
  assert.equal(updatedSb.frames.length, initialCount - 1, 'Quantidade de quadros deve diminuir em 1');
  assert.equal(updatedSb.frames[0].id, secondFrameId, 'Segundo quadro agora é o primeiro');
  assert.equal(updatedSb.frames[0].frameNumber, 1, 'Primeiro quadro agora deve ter número 1');
});

runTest('Deve permitir editar campos do quadro', () => {
  const projectId = 'prj-praia-01';
  const video = StudioState.createVideoProject({
    projectId,
    title: 'Vídeo Edit Test',
    type: 'apresentacao_projeto'
  });

  const sb = StudioState.generateStoryboardFromNarrative(video.id);
  const frameId = sb.frames[0].id;

  const updatedSb = StudioState.updateStoryboardFrame(video.id, frameId, {
    duration: 8.5,
    movement: 'orbit',
    screenText: 'Texto Customizado em Tela',
    voiceoverText: 'Locução personalizada de teste',
    audioTrack: 'Trilha Orquestrada Suave',
    transition: 'fade_to_white',
    notes: 'Atenção aos reflexos solares no vidro'
  });

  const edited = updatedSb.frames.find(f => f.id === frameId);
  assert.equal(edited.duration, 8.5);
  assert.equal(edited.movement, 'orbit');
  assert.equal(edited.screenText, 'Texto Customizado em Tela');
  assert.equal(edited.voiceoverText, 'Locução personalizada de teste');
  assert.equal(edited.audioTrack, 'Trilha Orquestrada Suave');
  assert.equal(edited.transition, 'fade_to_white');
  assert.equal(edited.notes, 'Atenção aos reflexos solares no vidro');
});

runTest('Deve permitir substituir asset de um quadro sem apagar outras informações', () => {
  const projectId = 'prj-praia-01';
  const video = StudioState.createVideoProject({
    projectId,
    title: 'Vídeo Replace Asset Test',
    type: 'apresentacao_projeto'
  });

  const sb = StudioState.generateStoryboardFromNarrative(video.id);
  const frameId = sb.frames[0].id;
  const originalVoiceover = sb.frames[0].voiceoverText;

  const newImageUrl = 'https://images.unsplash.com/photo-test-substituicao.jpg';
  const updatedSb = StudioState.replaceStoryboardFrameAsset(video.id, frameId, {
    imageUrl: newImageUrl,
    videoUrl: 'https://video.test/preview-01.mp4'
  });

  const frame = updatedSb.frames.find(f => f.id === frameId);
  assert.equal(frame.imageUrl, newImageUrl, 'Imagem deve ser substituída');
  assert.equal(frame.videoUrl, 'https://video.test/preview-01.mp4', 'Vídeo deve ser atualizado');
  assert.equal(frame.voiceoverText, originalVoiceover, 'Locução original deve ser estritamente preservada');
});

runTest('Deve calcular Duração Total e disparar Warning se ultrapassar meta', () => {
  const projectId = 'prj-praia-01';
  const targetDuration = 20; // Meta restrita de 20s
  const video = StudioState.createVideoProject({
    projectId,
    title: 'Vídeo Warning Test',
    type: 'apresentacao_projeto',
    targetDuration: targetDuration
  });

  const sb = StudioState.generateStoryboardFromNarrative(video.id);
  // Narrative creates frames typically totaling ~35s
  assert.ok(sb.totalDuration > targetDuration, 'Duração total deve ultrapassar a meta');
  assert.equal(sb.isDurationExceeded, true, 'isDurationExceeded deve ser true');

  // Ajustando manualmente para ficar abaixo
  sb.frames.forEach(f => { f.duration = 2; });
  const recalculated = StudioState.recalculateStoryboardMetrics(sb);
  assert.ok(recalculated.totalDuration <= targetDuration, 'Nova duração deve ser <= meta');
  assert.equal(recalculated.isDurationExceeded, false, 'Warning deve ser desligado quando dentro da meta');
});

runTest('"Ajustar Automaticamente" deve exigir confirmação explícita e NÃO apagar conteúdo', () => {
  const projectId = 'prj-praia-01';
  const targetDuration = 30;
  const video = StudioState.createVideoProject({
    projectId,
    title: 'Vídeo Auto Adjust Test',
    type: 'apresentacao_projeto',
    targetDuration: targetDuration
  });

  const sb = StudioState.generateStoryboardFromNarrative(video.id);
  const initialFrameCount = sb.frames.length;

  // Sem confirmação deve lançar erro
  assert.throws(() => {
    StudioState.adjustStoryboardDurationAutomatically(video.id, false);
  }, /confirmação explícita/, 'Deve recusar ajuste automático sem confirmação');

  // Com confirmação explícita
  const adjustedSb = StudioState.adjustStoryboardDurationAutomatically(video.id, true);
  
  // Regra crítica: "Não apagar automaticamente conteúdo"
  assert.equal(adjustedSb.frames.length, initialFrameCount, 'NENHUM quadro deve ser apagado no ajuste automático');
  assert.ok(Math.abs(adjustedSb.totalDuration - targetDuration) <= 2, 'Duração total ajustada deve convergir para a meta configurada');
  assert.equal(adjustedSb.isDurationExceeded, false, 'Warning deve ser limpo após ajuste');
});

runTest('VideoStoryboardModule deve renderizar o visual em grid [01] [02] [03] [04] e preview', () => {
  const projectId = 'prj-praia-01';
  const video = StudioState.createVideoProject({
    projectId,
    title: 'Vídeo UI Storyboard Render',
    type: 'apresentacao_projeto',
    targetDuration: 60
  });

  const html = VideoStoryboardModule.renderStoryboard(video.id, projectId);

  assert.ok(html.includes('BLOCO G06'), 'Deve conter identificação G06');
  assert.ok(html.includes('Storyboard Visual'), 'Deve conter título Storyboard Visual');
  assert.ok(html.includes('DURAÇÃO TOTAL:'), 'Deve exibir indicador de Duração Total');
  assert.ok(html.includes('META:'), 'Deve exibir indicador de Meta');
  assert.ok(html.includes('grid-template-columns: repeat(4, 1fr)'), 'Deve conter grid visual com 4 colunas');
  assert.ok(html.includes('[01]'), 'Deve formatar numeração do primeiro quadro como [01]');
  assert.ok(html.includes('Preview Sequencial'), 'Deve conter botão de Preview Sequencial');
  assert.ok(html.includes('Ajustar Automaticamente'), 'Deve conter botão de Ajustar Automaticamente');
  assert.ok(html.includes('draggable="true"'), 'Cards devem ser arrastáveis');
  assert.ok(html.includes('Substituir Asset'), 'Deve conter opção de substituir asset');
  assert.ok(html.includes('Duplicar'), 'Deve conter opção de duplicar');
  assert.ok(html.includes('Excluir'), 'Deve conter opção de excluir');
  assert.ok(html.includes('Aguardando Bloco G07') || html.includes('G07'), 'Deve indicar prontidão e espera por G07');
});

runTest('VideoStoryboardModule preview modal deve montar o player sequencial sem renderizar vídeo final', () => {
  const projectId = 'prj-praia-01';
  const video = StudioState.createVideoProject({
    projectId,
    title: 'Vídeo Preview Modal Test',
    type: 'apresentacao_projeto'
  });

  const html = VideoStoryboardModule.renderPreviewModal(video.id);
  assert.ok(html.includes('PREVIEW SEQUENCIAL'), 'Modal deve conter cabeçalho Preview Sequencial');
  assert.ok(html.includes('Validação de Narrativa e Ritmo'), 'Deve deixar explícito objetivo de validar narrativa');
  assert.ok(html.includes('Reproduzir'), 'Deve conter botão Reproduzir');
  assert.ok(html.includes('Próximo'), 'Deve conter controle de avanço');
  assert.ok(html.includes('Anterior'), 'Deve conter controle de retrocesso');
  assert.ok(html.includes('progress-bar'), 'Deve conter barra de tempo/progresso');
});

console.log('\n================================================================');
console.log(`RESULTADO DOS TESTES G06:`);
console.log(`  Sucessos: ${testsPassed}`);
console.log(`  Falhas:   ${testsFailed}`);
console.log('================================================================');

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log('Todos os testes do Bloco G06 passaram com 100% de conformidade!\n');
}
