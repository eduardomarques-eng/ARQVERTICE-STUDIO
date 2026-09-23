/**
 * ============================================================================
 * ARQVERTICE STUDIO — SUÍTE DE TESTES: BLOCO G12 — VIDEO TIMELINE EDITOR
 * ============================================================================
 * Validação rigorosa dos requisitos de G12:
 * 1. Constantes de Faixas (TIMELINE_TRACKS: VIDEO, AUDIO, VOICE, TEXT, TRANSITIONS)
 * 2. Criação de Timeline com herança de resolução/FPS do projeto de vídeo
 * 3. Adição de clipes com posicionamento automático
 * 4. Mover clipes (edição não destrutiva)
 * 5. Cortar clipes em ponto arbitrário (split)
 * 6. Duplicar clipes (preservando referência ao source)
 * 7. Excluir clipes SEM destruir assets originais
 * 8. Ajustar duração (resize)
 * 9. Reorganizar clipes (reorder)
 * 10. Geração automática a partir do Storyboard
 * 11. Metadados exibidos: duração total, FPS, resolução, proporção
 * 12. Bloqueio de timeline impede edição
 * 13. Renderização da interface do VideoTimelineModule
 * ============================================================================
 */

global.window = {
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
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
const VideoTimelineModule = require('../js/video-timeline-module.js');

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
console.log('SUÍTE DE TESTES: BLOCO G12 — VIDEO TIMELINE EDITOR');
console.log('================================================================\n');

StudioState.init();

// Seed projeto para testes
if (!StudioState.data.projects) StudioState.data.projects = [];
StudioState.data.projects.push({
  id: 'prj-timeline-g12-test',
  name: 'Projeto Timeline G12',
  client: 'Teste G12',
  status: 'em_andamento'
});

// Criar projeto de vídeo auxiliar
const video = StudioState.createVideoProject({
  projectId: 'prj-timeline-g12-test',
  title: 'Vídeo Timeline Test',
  type: 'tour_ambiente',
  aspectRatio: '16:9',
  fps: 30
});

// Gerar narrativa e storyboard para testes de auto-geração
StudioState.suggestNarrativeForVideo(video.id, { user: 'Teste G12' });
StudioState.generateStoryboardFromNarrative(video.id, { user: 'Teste G12' });

// ===========================================================================
// 1. Constantes de Faixas (TIMELINE_TRACKS)
// ===========================================================================
console.log('\n--- 1. Constantes de Faixas ---');

runTest('TIMELINE_TRACKS contém as 5 faixas obrigatórias', () => {
  const tracks = StudioState.TIMELINE_TRACKS;
  assert.ok(Array.isArray(tracks), 'TIMELINE_TRACKS deve ser um array');
  assert.ok(tracks.includes('VIDEO'), 'Deve conter VIDEO');
  assert.ok(tracks.includes('AUDIO'), 'Deve conter AUDIO');
  assert.ok(tracks.includes('VOICE'), 'Deve conter VOICE');
  assert.ok(tracks.includes('TEXT'), 'Deve conter TEXT');
  assert.ok(tracks.includes('TRANSITIONS'), 'Deve conter TRANSITIONS');
  assert.strictEqual(tracks.length, 5, 'Deve ter exatamente 5 faixas');
});

runTest('TIMELINE_TRACK_CONFIG define configuração visual para cada faixa', () => {
  const config = StudioState.TIMELINE_TRACK_CONFIG;
  assert.ok(config, 'TIMELINE_TRACK_CONFIG deve existir');
  StudioState.TIMELINE_TRACKS.forEach(track => {
    assert.ok(config[track], `Configuração para ${track} deve existir`);
    assert.ok(config[track].label, `${track} deve ter label`);
    assert.ok(config[track].color, `${track} deve ter color`);
  });
});

runTest('TIMELINE_TRANSITIONS define ao menos 5 tipos de transição', () => {
  const transitions = StudioState.TIMELINE_TRANSITIONS;
  assert.ok(Array.isArray(transitions), 'TIMELINE_TRANSITIONS deve ser array');
  assert.ok(transitions.length >= 5, `Deve ter ao menos 5 transições, tem ${transitions.length}`);
  const ids = transitions.map(t => t.id);
  assert.ok(ids.includes('crossfade'), 'Deve conter crossfade');
  assert.ok(ids.includes('cut'), 'Deve conter cut');
  assert.ok(ids.includes('fade_black'), 'Deve conter fade_black');
});

// ===========================================================================
// 2. Criação de Timeline
// ===========================================================================
console.log('\n--- 2. Criação de Timeline ---');

runTest('Criar timeline herda FPS, resolução e proporção do projeto de vídeo', () => {
  const tl = StudioState.createTimeline({ videoProjectId: video.id, user: 'Teste G12' });
  assert.ok(tl, 'Timeline deve ser criada');
  assert.ok(tl.id, 'Deve ter ID');
  assert.strictEqual(tl.videoProjectId, video.id, 'Deve pertencer ao vídeo');
  assert.strictEqual(tl.fps, 30, 'FPS deve herdar do projeto');
  assert.strictEqual(tl.aspectRatio, '16:9', 'Proporção deve herdar do projeto');
  assert.strictEqual(tl.resolutionWidth, 1920, 'Largura padrão 1920');
  assert.strictEqual(tl.resolutionHeight, 1080, 'Altura padrão 1080');
  assert.strictEqual(tl.isLocked, false, 'Não deve estar bloqueada');
  assert.strictEqual(tl.totalDurationSeconds, 0, 'Duração inicial 0');
});

// ===========================================================================
// 3. Adição de Clipes
// ===========================================================================
console.log('\n--- 3. Adição de Clipes ---');

let testTimeline;
runTest('Adicionar clipes com posicionamento automático ao final da track', () => {
  testTimeline = StudioState.getProjectTimeline(video.id);
  
  const clip1 = StudioState.addTimelineClip(testTimeline.id, {
    track: 'VIDEO',
    durationSeconds: 5.0,
    sourceLabel: 'Cena Abertura',
    sourceType: 'scene'
  });
  assert.ok(clip1, 'Clipe 1 deve ser criado');
  assert.strictEqual(clip1.track, 'VIDEO');
  assert.strictEqual(clip1.positionSeconds, 0, 'Primeiro clipe na posição 0');
  assert.strictEqual(clip1.durationSeconds, 5.0);

  const clip2 = StudioState.addTimelineClip(testTimeline.id, {
    track: 'VIDEO',
    durationSeconds: 3.0,
    sourceLabel: 'Cena Interior'
  });
  assert.strictEqual(clip2.positionSeconds, 5.0, 'Segundo clipe posicionado após o primeiro');

  const tl = StudioState.getTimeline(testTimeline.id);
  assert.strictEqual(tl.totalDurationSeconds, 8, 'Duração total deve ser 8s');
});

runTest('Rejeitar track inválido', () => {
  assert.throws(() => {
    StudioState.addTimelineClip(testTimeline.id, {
      track: 'INVALID_TRACK',
      durationSeconds: 2.0,
      sourceLabel: 'Invalido'
    });
  }, /Track inválido/, 'Deve lançar erro para track inválido');
});

// ===========================================================================
// 4. Mover Clipes
// ===========================================================================
console.log('\n--- 4. Mover Clipes ---');

runTest('Mover clipe para nova posição sem alterar source original', () => {
  const clips = StudioState.getTimelineClips(testTimeline.id, 'VIDEO');
  const clipToMove = clips[0];
  const originalSourceId = clipToMove.sourceId;
  const originalAssetUrl = clipToMove.assetUrl;

  const moved = StudioState.moveTimelineClip(clipToMove.id, 10.0);
  assert.strictEqual(moved.positionSeconds, 10, 'Posição deve ser 10');
  assert.strictEqual(moved.sourceId, originalSourceId, 'Source não deve mudar');
  assert.strictEqual(moved.assetUrl, originalAssetUrl, 'Asset URL não deve mudar');
});

// ===========================================================================
// 5. Cortar Clipes (Split)
// ===========================================================================
console.log('\n--- 5. Cortar Clipes (Split) ---');

runTest('Cortar clipe em ponto arbitrário gera duas partes', () => {
  // Adicionar um clipe de 10s para cortar
  const clip = StudioState.addTimelineClip(testTimeline.id, {
    track: 'VIDEO',
    durationSeconds: 10.0,
    sourceLabel: 'Cena Longa',
    sourceType: 'scene',
    positionSeconds: 20
  });

  const result = StudioState.splitTimelineClip(clip.id, 4.0);
  assert.ok(result.firstPart, 'Deve ter primeira parte');
  assert.ok(result.secondPart, 'Deve ter segunda parte');
  assert.strictEqual(result.firstPart.durationSeconds, 4.0, 'Primeira parte = 4s');
  assert.strictEqual(result.secondPart.durationSeconds, 6.0, 'Segunda parte = 6s');
  assert.strictEqual(result.secondPart.positionSeconds, 24.0, 'Segunda parte inicia em 24s');
  // Ambas as partes referenciam o mesmo source
  assert.strictEqual(result.firstPart.sourceType, result.secondPart.sourceType, 'Mesmo sourceType');
});

runTest('Rejeitar ponto de corte inválido', () => {
  const clips = StudioState.getTimelineClips(testTimeline.id, 'VIDEO');
  const lastClip = clips[clips.length - 1];
  assert.throws(() => {
    StudioState.splitTimelineClip(lastClip.id, 0);
  }, /Ponto de corte inválido/, 'Deve rejeitar corte em 0');
});

// ===========================================================================
// 6. Duplicar Clipes
// ===========================================================================
console.log('\n--- 6. Duplicar Clipes ---');

runTest('Duplicar clipe posiciona cópia após o original', () => {
  const clips = StudioState.getTimelineClips(testTimeline.id, 'VIDEO');
  const source = clips[0];

  const dup = StudioState.duplicateTimelineClip(source.id);
  assert.ok(dup, 'Duplicata deve ser criada');
  assert.notStrictEqual(dup.id, source.id, 'IDs devem ser diferentes');
  assert.strictEqual(dup.sourceType, source.sourceType, 'sourceType preservado');
  assert.strictEqual(dup.sourceId, source.sourceId, 'sourceId preservado');
  assert.ok(dup.sourceLabel.includes('(cópia)'), 'Label deve indicar cópia');
  assert.strictEqual(dup.positionSeconds, source.positionSeconds + source.durationSeconds, 'Posiciona após o original');
});

// ===========================================================================
// 7. Excluir Clipes Sem Destruir Assets Originais
// ===========================================================================
console.log('\n--- 7. Excluir Clipes (Non-Destructive) ---');

runTest('Excluir clipe remove da timeline e preserva asset original', () => {
  const clipsBefore = StudioState.getTimelineClips(testTimeline.id, 'VIDEO');
  const clipToDelete = clipsBefore[clipsBefore.length - 1];

  const result = StudioState.deleteTimelineClip(clipToDelete.id);
  assert.strictEqual(result.deleted, true, 'deleted deve ser true');
  assert.strictEqual(result.assetPreserved, true, 'assetPreserved deve ser true');

  const clipsAfter = StudioState.getTimelineClips(testTimeline.id, 'VIDEO');
  assert.strictEqual(clipsAfter.length, clipsBefore.length - 1, 'Deve ter um clipe a menos');
  assert.ok(!clipsAfter.find(c => c.id === clipToDelete.id), 'Clipe removido não deve existir mais');
});

// ===========================================================================
// 8. Ajustar Duração (Resize)
// ===========================================================================
console.log('\n--- 8. Ajustar Duração (Resize) ---');

runTest('Resize altera duração do clipe e recalcula duração total', () => {
  const clips = StudioState.getTimelineClips(testTimeline.id, 'VIDEO');
  const clip = clips[0];

  const resized = StudioState.resizeTimelineClip(clip.id, 15.0);
  assert.strictEqual(resized.durationSeconds, 15.0, 'Duração deve ser 15s');

  assert.throws(() => {
    StudioState.resizeTimelineClip(clip.id, 0);
  }, /Duração deve ser maior que zero/, 'Deve rejeitar duração 0');

  assert.throws(() => {
    StudioState.resizeTimelineClip(clip.id, -5);
  }, /Duração deve ser maior que zero/, 'Deve rejeitar duração negativa');
});

// ===========================================================================
// 9. Reorganizar Clipes (Reorder)
// ===========================================================================
console.log('\n--- 9. Reorganizar Clipes (Reorder) ---');

runTest('Reordenar clipes na mesma faixa atualiza posição sequencialmente', () => {
  // Adicionar mais clipes para reordenar
  StudioState.addTimelineClip(testTimeline.id, {
    track: 'AUDIO',
    durationSeconds: 3.0,
    sourceLabel: 'Trilha A'
  });
  StudioState.addTimelineClip(testTimeline.id, {
    track: 'AUDIO',
    durationSeconds: 5.0,
    sourceLabel: 'Trilha B'
  });
  StudioState.addTimelineClip(testTimeline.id, {
    track: 'AUDIO',
    durationSeconds: 2.0,
    sourceLabel: 'Trilha C'
  });

  const audioClips = StudioState.getTimelineClips(testTimeline.id, 'AUDIO');
  assert.strictEqual(audioClips.length, 3, 'Deve ter 3 clipes de áudio');

  // Reordenar: C, A, B
  const reversedIds = [audioClips[2].id, audioClips[0].id, audioClips[1].id];
  const reordered = StudioState.reorderTimelineClips(testTimeline.id, 'AUDIO', reversedIds);
  assert.strictEqual(reordered[0].sourceLabel, 'Trilha C', 'Primeiro deve ser Trilha C');
  assert.strictEqual(reordered[0].positionSeconds, 0, 'Trilha C inicia em 0');
  assert.strictEqual(reordered[1].sourceLabel, 'Trilha A', 'Segundo deve ser Trilha A');
  assert.strictEqual(reordered[1].positionSeconds, 2, 'Trilha A inicia em 2 (após 2s de C)');
});

// ===========================================================================
// 10. Geração Automática a partir do Storyboard
// ===========================================================================
console.log('\n--- 10. Geração Automática do Storyboard ---');

runTest('Gerar timeline automaticamente a partir do storyboard', () => {
  // Criar novo vídeo para teste limpo
  const video2 = StudioState.createVideoProject({
    projectId: 'prj-timeline-g12-test',
    title: 'Vídeo Auto-Gen Test',
    type: 'tour_ambiente',
    aspectRatio: '16:9',
    fps: 24
  });
  StudioState.suggestNarrativeForVideo(video2.id, { user: 'Test' });
  StudioState.generateStoryboardFromNarrative(video2.id, { user: 'Test' });

  const frames = StudioState.getStoryboardFrames(video2.id);
  assert.ok(frames.length > 0, 'Deve ter quadros de storyboard');

  const tl = StudioState.generateTimelineFromStoryboard(video2.id, { user: 'Test' });
  assert.ok(tl, 'Timeline deve ser gerada');
  assert.ok(tl.totalDurationSeconds > 0, 'Duração total deve ser > 0');

  const videoClips = StudioState.getTimelineClips(tl.id, 'VIDEO');
  assert.strictEqual(videoClips.length, frames.length, 'Cada quadro do storyboard deve gerar um clipe de vídeo');

  // Verificar que as cenas foram mapeadas corretamente
  videoClips.forEach((clip, idx) => {
    assert.strictEqual(clip.sourceType, 'storyboard_frame', 'sourceType deve ser storyboard_frame');
    assert.ok(clip.durationSeconds > 0, 'Duração de cada clipe deve ser > 0');
    assert.strictEqual(clip.track, 'VIDEO', 'Track deve ser VIDEO');
  });

  // Verificar faixa de narração
  const voiceClips = StudioState.getTimelineClips(tl.id, 'VOICE');
  assert.ok(voiceClips.length > 0, 'Deve ter clipes de narração');
});

// ===========================================================================
// 11. Metadados: Duração, FPS, Resolução, Proporção
// ===========================================================================
console.log('\n--- 11. Metadados da Timeline ---');

runTest('getTimelineMetadata retorna duração formatada, FPS, resolução e proporção', () => {
  const metadata = StudioState.getTimelineMetadata(testTimeline.id);
  assert.ok(metadata, 'Metadata deve existir');
  assert.ok(typeof metadata.totalDurationSeconds === 'number', 'totalDurationSeconds deve ser number');
  assert.ok(metadata.totalDurationFormatted, 'totalDurationFormatted deve existir');
  assert.ok(metadata.totalDurationFormatted.includes(':'), 'Formato MM:SS esperado');
  assert.strictEqual(metadata.fps, 30, 'FPS deve ser 30');
  assert.strictEqual(metadata.resolution, '1920x1080', 'Resolução deve ser 1920x1080');
  assert.strictEqual(metadata.aspectRatio, '16:9', 'Proporção deve ser 16:9');
  assert.ok(typeof metadata.totalClips === 'number', 'totalClips deve ser number');
  assert.ok(metadata.tracks, 'tracks deve existir');
  assert.ok(metadata.tracks.VIDEO, 'tracks.VIDEO deve existir');
  assert.ok(typeof metadata.tracks.VIDEO.count === 'number', 'VIDEO.count deve ser number');
});

// ===========================================================================
// 12. Bloqueio de Timeline
// ===========================================================================
console.log('\n--- 12. Bloqueio de Timeline ---');

runTest('Timeline bloqueada impede todas as operações de edição', () => {
  // Bloquear a timeline
  StudioState.updateTimeline(testTimeline.id, { isLocked: true });
  const lockedTl = StudioState.getTimeline(testTimeline.id);
  assert.strictEqual(lockedTl.isLocked, true, 'Timeline deve estar bloqueada');

  // Tentar adicionar clipe
  assert.throws(() => {
    StudioState.addTimelineClip(testTimeline.id, { track: 'VIDEO', durationSeconds: 2.0, sourceLabel: 'Teste Bloqueio' });
  }, /bloqueada/, 'Deve rejeitar adição em timeline bloqueada');

  // Tentar editar clipe existente
  const clips = StudioState.getTimelineClips(testTimeline.id, 'VIDEO');
  if (clips.length > 0) {
    assert.throws(() => {
      StudioState.updateTimelineClip(clips[0].id, { durationSeconds: 99 });
    }, /bloqueada/, 'Deve rejeitar edição em timeline bloqueada');

    assert.throws(() => {
      StudioState.deleteTimelineClip(clips[0].id);
    }, /bloqueada/, 'Deve rejeitar exclusão em timeline bloqueada');

    assert.throws(() => {
      StudioState.duplicateTimelineClip(clips[0].id);
    }, /bloqueada/, 'Deve rejeitar duplicação em timeline bloqueada');

    assert.throws(() => {
      StudioState.splitTimelineClip(clips[0].id, 1.0);
    }, /bloqueada/, 'Deve rejeitar corte em timeline bloqueada');
  }

  // Desbloquear para não afetar outros testes
  // Precisamos manipular diretamente pois updateTimeline checa isLocked
  const tlIdx = StudioState.data.videoTimelines.findIndex(t => t.id === testTimeline.id);
  if (tlIdx >= 0) StudioState.data.videoTimelines[tlIdx].isLocked = false;
});

// ===========================================================================
// 13. Renderização da Interface do VideoTimelineModule
// ===========================================================================
console.log('\n--- 13. Renderização da Interface ---');

runTest('VideoTimelineModule.render retorna HTML com timeline, faixas e metadados', () => {
  const html = VideoTimelineModule.render(video.id);
  assert.ok(html, 'HTML deve ser gerado');
  assert.ok(typeof html === 'string', 'Deve ser string');
  assert.ok(html.includes('timeline-editor-container'), 'Deve conter container principal');
  assert.ok(html.includes('FPS'), 'Deve exibir FPS');
  assert.ok(html.includes('16:9'), 'Deve exibir proporção');
  assert.ok(html.includes('1920x1080'), 'Deve exibir resolução');
  assert.ok(html.includes('VIDEO') || html.includes('Vídeo'), 'Deve exibir faixa de vídeo');
  assert.ok(html.includes('AUDIO') || html.includes('Áudio'), 'Deve exibir faixa de áudio');
  assert.ok(html.includes('Edição Não Destrutiva'), 'Deve indicar edição não destrutiva');
});

runTest('VideoTimelineModule.render mostra mensagem quando não há vídeo', () => {
  const html = VideoTimelineModule.render('inexistente');
  assert.ok(html.includes('Selecione') || html.includes('crie'), 'Deve mostrar mensagem orientativa');
});

// ===========================================================================
// RESULTADO FINAL
// ===========================================================================
console.log('\n================================================================');
console.log(`RESULTADO: ${passedTests}/${totalTests} testes passaram`);
if (failedTests > 0) {
  console.log(`           ${failedTests} teste(s) FALHARAM`);
}
console.log('================================================================\n');

if (failedTests > 0) process.exit(1);
