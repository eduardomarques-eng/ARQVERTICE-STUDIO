/**
 * Suíte de Testes Automatizados — Bloco G01: Fundação do Módulo de Produção Audiovisual
 *
 * Validações exigidas:
 * - Criar vídeo (VideoProject) com todos os campos mínimos
 * - Validar tipos canônicos (13 tipos) e status (9 status)
 * - Editar vídeo
 * - Duplicar vídeo
 * - Arquivar vídeo
 * - Restaurar vídeo
 * - Criar versão (V00 -> V01 -> V02...) e histórico imutável
 * - Não sobrescrever versão aprovada (blindagem contra mutação direta)
 * - Alterar status
 * - Associar projeto
 * - Associar apresentação
 * - Relação Projeto -> VideoProject -> Scenes -> Shots -> Assets -> Audio -> Captions -> Versions
 * - Renderização da Interface: área "Vídeo do Projeto", cards com atributos mínimos, botões de ação e estado opcional
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
const VideoStudioModule = require('../js/video-studio-module.js');

StudioState.init();

let testsPassed = 0;
let testsFailed = 0;

function runTest(testName, testFn) {
  try {
    testFn();
    console.log(`  ✔ [PASS] ${testName}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ✖ [FAIL] ${testName}`);
    console.error(`    ${err.message}\n`);
    testsFailed++;
  }
}

console.log('================================================================');
console.log('SUÍTE DE TESTES: BLOCO G01 — FUNDAÇÃO DO MÓDULO AUDIOVISUAL');
console.log('================================================================\n');

const testProjectId = 'prj-praia-01';

// 1. Criação e Campos Mínimos
runTest('1.1 - Criar VideoProject com todos os campos mínimos', () => {
  const video = StudioState.createVideoProject({
    projectId: testProjectId,
    title: 'Tour Arquitetônico — Casa da Praia',
    description: 'Apresentação imersiva dos ambientes sociais e integração externa.',
    type: 'vídeo de walkthrough',
    objective: 'Demonstrar circulação e iluminação natural ao cliente',
    audience: 'Cliente titular e família',
    duration: 120,
    aspectRatio: '16:9',
    resolution: '4K',
    environmentId: 'env-social-01'
  });

  assert.ok(video.id, 'ID gerado');
  assert.strictEqual(video.projectId, testProjectId, 'projectId correto');
  assert.strictEqual(video.title, 'Tour Arquitetônico — Casa da Praia');
  assert.strictEqual(video.type, 'vídeo de walkthrough');
  assert.strictEqual(video.objective, 'Demonstrar circulação e iluminação natural ao cliente');
  assert.strictEqual(video.audience, 'Cliente titular e família');
  assert.strictEqual(video.duration, 120);
  assert.strictEqual(video.aspectRatio, '16:9');
  assert.strictEqual(video.resolution, '4K');
  assert.strictEqual(video.status, 'rascunho', 'Status inicial rascunho');
  assert.strictEqual(video.revision, 'V00', 'Revisão inicial V00');
  assert.ok(video.createdAt, 'Data de criação');
  assert.ok(video.updatedAt, 'Data de atualização');
  assert.strictEqual(video.isApproved, false);
});

// 2. Validação de Tipos e Status Canônicos
runTest('2.1 - Cobertura dos 13 tipos canônicos de vídeo', () => {
  const expectedTypes = [
    'apresentação de projeto',
    'apresentação de ambiente',
    'apresentação para cliente',
    'vídeo de conceito',
    'vídeo de estudo',
    'vídeo de walkthrough',
    'vídeo para redes sociais',
    'vídeo institucional',
    'vídeo vertical',
    'vídeo horizontal',
    'teaser',
    'reel',
    'short'
  ];

  assert.strictEqual(StudioState.VIDEO_PROJECT_TYPES.length, 13);
  expectedTypes.forEach(t => {
    assert.ok(StudioState.VIDEO_PROJECT_TYPES.includes(t), `Tipo presente: ${t}`);
  });
});

runTest('2.2 - Cobertura dos 9 status canônicos de vídeo', () => {
  const expectedStatuses = [
    'rascunho',
    'planejamento',
    'roteiro',
    'storyboard',
    'produção',
    'revisão',
    'aprovado',
    'finalizado',
    'arquivado'
  ];

  assert.strictEqual(StudioState.VIDEO_PROJECT_STATUSES.length, 9);
  expectedStatuses.forEach(s => {
    assert.ok(StudioState.VIDEO_PROJECT_STATUSES.includes(s), `Status presente: ${s}`);
  });
});

// 3. Edição do Vídeo
runTest('3.1 - Editar dados de um VideoProject não aprovado', () => {
  const video = StudioState.createVideoProject({
    projectId: testProjectId,
    title: 'Vídeo Inicial',
    type: 'teaser',
    duration: 30
  });

  const updated = StudioState.updateVideoProject(video.id, {
    title: 'Vídeo Oficial Atualizado',
    duration: 45,
    objective: 'Teaser de lançamento imobiliário'
  });

  assert.strictEqual(updated.title, 'Vídeo Oficial Atualizado');
  assert.strictEqual(updated.duration, 45);
  assert.strictEqual(updated.objective, 'Teaser de lançamento imobiliário');
  assert.ok(new Date(updated.updatedAt) >= new Date(video.createdAt));
});

// 4. Duplicação de Vídeo
runTest('4.1 - Duplicar vídeo com reset de revisão para V00 e status para rascunho', () => {
  const original = StudioState.createVideoProject({
    projectId: testProjectId,
    title: 'Vídeo Base',
    type: 'reel',
    duration: 60,
    aspectRatio: '9:16',
    status: 'produção'
  });

  // Adicionar cena e shot para verificar cópia em cascata
  StudioState.addVideoScene(original.id, { title: 'Cena 01 - Abertura', orderIndex: 1 });

  const duplicated = StudioState.duplicateVideoProject(original.id, 'Vídeo Base (Versão Social)');

  assert.notStrictEqual(duplicated.id, original.id, 'Novo ID gerado');
  assert.strictEqual(duplicated.title, 'Vídeo Base (Versão Social)');
  assert.strictEqual(duplicated.type, original.type);
  assert.strictEqual(duplicated.aspectRatio, '9:16');
  assert.strictEqual(duplicated.revision, 'V00', 'Reset de revisão para V00');
  assert.strictEqual(duplicated.status, 'rascunho', 'Reset de status para rascunho');
  assert.strictEqual(duplicated.isApproved, false);

  // Cenas duplicadas
  const scenes = StudioState.getVideoScenes(duplicated.id);
  assert.strictEqual(scenes.length, 1);
  assert.strictEqual(scenes[0].title, 'Cena 01 - Abertura');
  assert.strictEqual(scenes[0].videoId, duplicated.id);
});

// 5. Arquivar e Restaurar
runTest('5.1 - Arquivar vídeo e restaurar', () => {
  const video = StudioState.createVideoProject({
    projectId: testProjectId,
    title: 'Vídeo Descartável',
    type: 'vídeo de estudo'
  });

  const archived = StudioState.archiveVideoProject(video.id);
  assert.strictEqual(archived.status, 'arquivado');
  assert.strictEqual(archived.isArchived, true);

  // Na listagem padrão do projeto, o arquivado fica separado se includeArchived for false
  const activeVideos = StudioState.getProjectVideos(testProjectId, { includeArchived: false });
  assert.ok(!activeVideos.find(v => v.id === video.id));

  const allVideos = StudioState.getProjectVideos(testProjectId, { includeArchived: true });
  assert.ok(allVideos.find(v => v.id === video.id));

  // Restaurar
  const restored = StudioState.restoreVideoProject(video.id);
  assert.strictEqual(restored.status, 'rascunho');
  assert.strictEqual(restored.isArchived, false);
});

// 6. Criar Versão e Preservação Histórica
runTest('6.1 - Sistema de versão progressiva (V00 -> V01 -> V02)', () => {
  const video = StudioState.createVideoProject({
    projectId: testProjectId,
    title: 'Vídeo em Evolução',
    type: 'apresentação para cliente',
    duration: 90
  });

  assert.strictEqual(video.revision, 'V00');

  // Criar V01
  const v01 = StudioState.createVideoVersion(video.id, {
    changeLog: 'Adicionado corte de transição e novo áudio guia'
  });
  assert.strictEqual(v01.revision, 'V01');

  // Criar V02
  const v02 = StudioState.createVideoVersion(video.id, {
    changeLog: 'Ajuste de enquadramento da perspectiva do living'
  });
  assert.strictEqual(v02.revision, 'V02');

  const history = StudioState.getVideoVersions(video.id);
  assert.strictEqual(history.length, 2);
  assert.strictEqual(history[0].versionTag, 'V01', 'Versão mais recente primeiro no histórico');
  assert.strictEqual(history[1].versionTag, 'V00', 'Versão inicial preservada no histórico');
});

runTest('6.2 - Não sobrescrever uma versão aprovada (bloqueio de mutação)', () => {
  const video = StudioState.createVideoProject({
    projectId: testProjectId,
    title: 'Vídeo para Aprovação',
    type: 'apresentação de projeto'
  });

  // Aprovar vídeo
  const approved = StudioState.approveVideoProject(video.id, {
    approvedBy: 'Erick Santiago - Arquiteto Titular',
    notes: 'Aprovado pelo cliente em reunião'
  });

  assert.strictEqual(approved.status, 'aprovado');
  assert.strictEqual(approved.isApproved, true);
  assert.ok(approved.approvedAt);

  // Tentativa de alterar campos de conteúdo diretamente deve lançar erro
  assert.throws(() => {
    StudioState.updateVideoProject(video.id, {
      title: 'Tentativa de alteração não autorizada',
      duration: 300
    });
  }, /protegido contra alterações diretas/i);

  // Porém é permitido criar uma nova versão (ex: V01) para continuar trabalhando
  const nextVer = StudioState.createVideoVersion(video.id, {
    changeLog: 'Nova rodada de ajustes solicitada pós-aprovação preliminar'
  });
  assert.strictEqual(nextVer.revision, 'V01');
  assert.strictEqual(nextVer.isApproved, false, 'Nova versão inicia desbloqueada');
});

// 7. Alteração de Status e Cálculo de Progresso
runTest('7.1 - Alterar status e calcular progresso percentual', () => {
  const video = StudioState.createVideoProject({
    projectId: testProjectId,
    title: 'Pipeline Audiovisual',
    type: 'vídeo de walkthrough'
  });

  assert.strictEqual(video.status, 'rascunho');
  assert.strictEqual(video.progressPercent, 10);

  const stRoteiro = StudioState.setVideoStatus(video.id, 'roteiro');
  assert.strictEqual(stRoteiro.status, 'roteiro');
  assert.strictEqual(stRoteiro.progressPercent, 35);

  const stProd = StudioState.setVideoStatus(video.id, 'produção');
  assert.strictEqual(stProd.status, 'produção');
  assert.strictEqual(stProd.progressPercent, 65);

  const stFin = StudioState.setVideoStatus(video.id, 'finalizado');
  assert.strictEqual(stFin.status, 'finalizado');
  assert.strictEqual(stFin.progressPercent, 100);
});

// 8. Associação com Projeto e Apresentação
runTest('8.1 - Associar projeto e apresentação (presentationId)', () => {
  const dummyPresentationId = 'pres-test-xyz';

  const video = StudioState.createVideoProject({
    projectId: testProjectId,
    presentationId: dummyPresentationId,
    title: 'Apresentação em Vídeo Integrada'
  });

  assert.strictEqual(video.projectId, testProjectId);
  assert.strictEqual(video.presentationId, dummyPresentationId);

  // Alterar associação
  const updated = StudioState.linkVideoPresentation(video.id, 'pres-novo-999');
  assert.strictEqual(updated.presentationId, 'pres-novo-999');
});

// 9. Relação Completa: Projeto -> VideoProject -> Scenes -> Shots -> Assets -> Audio -> Captions -> Versions
runTest('9.1 - Árvore de entidades filhas (Scenes, Shots, Assets, Audio, Captions)', () => {
  const video = StudioState.createVideoProject({
    projectId: testProjectId,
    title: 'Projeto Estrutura Completa',
    type: 'apresentação de projeto'
  });

  // Scene
  const scene = StudioState.addVideoScene(video.id, {
    title: 'Cena 01: Fachada Principal',
    description: 'Aproximação suave da entrada ao entardecer',
    duration: 10,
    orderIndex: 1
  });
  assert.ok(scene.id);
  assert.strictEqual(scene.videoId, video.id);

  // Shot
  const shot = StudioState.addVideoShot(scene.id, {
    videoId: video.id,
    cameraType: 'travelling frontal',
    movement: 'push-in lento',
    duration: 5,
    orderIndex: 1
  });
  assert.ok(shot.id);
  assert.strictEqual(shot.sceneId, scene.id);

  // Asset (imagem aprovada, render, etc.)
  const asset = StudioState.addVideoAsset(video.id, {
    sceneId: scene.id,
    shotId: shot.id,
    assetType: 'render',
    sourceUrl: '/renders/fachada-sunset.png',
    title: 'Render Fachada Sunset'
  });
  assert.ok(asset.id);
  assert.strictEqual(asset.videoId, video.id);

  // Audio (trilha sonora, voz, narração)
  const audio = StudioState.addVideoAudio(video.id, {
    audioType: 'trilha sonora',
    title: 'Ambient Acoustic Warmth',
    volume: 80
  });
  assert.ok(audio.id);
  assert.strictEqual(audio.videoId, video.id);

  // Captions (legendas, títulos, especificações)
  const caption = StudioState.addVideoCaption(video.id, {
    sceneId: scene.id,
    startTime: 0,
    endTime: 4,
    text: 'Residência Alphaville • Vista Frontal'
  });
  assert.ok(caption.id);
  assert.strictEqual(caption.videoId, video.id);

  // Timeline agregada
  const timeline = StudioState.getVideoTimeline(video.id);
  assert.strictEqual(timeline.scenes.length, 1);
  assert.strictEqual(timeline.shots.length, 1);
  assert.strictEqual(timeline.assets.length, 1);
  assert.strictEqual(timeline.audios.length, 1);
  assert.strictEqual(timeline.captions.length, 1);
});

// 10. Validação da Interface (VideoStudioModule)
runTest('10.1 - Interface: Renderiza área "Vídeo do Projeto" e estado opcional', () => {
  const emptyProject = { id: 'prj-sem-video', name: 'Projeto Sem Vídeos' };
  const emptyHtml = VideoStudioModule.renderProjectVideos(emptyProject);

  assert.ok(emptyHtml.includes('Vídeo do Projeto'), 'Título da área');
  assert.ok(emptyHtml.includes('opcional') || emptyHtml.includes('Opcional'), 'Mensagem de opcionalidade');
  assert.ok(emptyHtml.includes('Criar Primeiro Vídeo'), 'Botão de início opcional');
});

runTest('10.2 - Interface: Card com atributos mínimos e botões de ação', () => {
  const project = StudioState.getProject(testProjectId);
  const video = StudioState.createVideoProject({
    projectId: project.id,
    title: 'Vídeo para Teste de UI',
    type: 'apresentação de ambiente',
    duration: 60,
    aspectRatio: '16:9',
    resolution: '1080p'
  });

  const html = VideoStudioModule.renderProjectVideos(project);

  // Atributos obrigatórios presentes no HTML
  assert.ok(html.includes('Vídeo para Teste de UI'), 'Título');
  assert.ok(html.toLowerCase().includes('apresentação de ambiente'), 'Tipo');
  assert.ok(html.includes('16:9'), 'Formato / Proporção');
  assert.ok(html.includes('V00'), 'Revisão');
  assert.ok(html.includes('rascunho'), 'Status');
  assert.ok(html.includes('progresso') || html.includes('Progresso') || html.includes('Maturidade'), 'Progresso');

  // Botões de ação exigidos
  assert.ok(html.includes('Continuar'), 'Botão continuar');
  assert.ok(html.includes('Duplicar'), 'Botão duplicar');
  assert.ok(html.includes('Nova Versão'), 'Botão criar nova versão');
});

console.log('\n----------------------------------------------------------------');
console.log(`TOTAL DE TESTES: ${testsPassed + testsFailed}`);
console.log(`PASSOU: ${testsPassed}`);
console.log(`FALHOU: ${testsFailed}`);
console.log('----------------------------------------------------------------\n');

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log('✔ TODOS OS TESTES DO BLOCO G01 PASSARAM COM SUCESSO!\n');
}
