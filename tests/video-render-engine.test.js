/**
 * ============================================================================
 * ARQVERTICE STUDIO — SUÍTE DE TESTES: BLOCO G13 — VIDEO RENDER ENGINE
 * ============================================================================
 * Validação rigorosa dos requisitos de G13:
 * 1. Formatos com MP4 como prioridade e preparação para outros (WebM, MOV, ProRes)
 * 2. Configurações: resolução, FPS, bitrate, áudio, codec, proporção
 * 3. 5 Presets canônicos (WEB, SOCIAL_VERTICAL, SOCIAL_HORIZONTAL, CLIENT_PRESENTATION, HIGH_QUALITY)
 * 4. Resoluções: 1080p padrão inicial e suporte arquitetural para 4K
 * 5. Heterogeneidade de IA: detecção e normalização de resoluções divergentes de providers
 * 6. Fila de processamento, progresso, tempo e status
 * 7. Ciclo de vida de status (queued, processing, completed, failed, cancelled)
 * 8. Resiliência a falhas: não perder projeto/timeline e permitir retry
 * 9. Versionamento de vídeo (v1.0, v1.1...)
 * 10. Renderização da interface do VideoRenderEngineModule
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
const VideoRenderEngineModule = require('../js/video-render-engine-module.js');

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
console.log('SUÍTE DE TESTES: BLOCO G13 — VIDEO RENDER ENGINE');
console.log('================================================================\n');

StudioState.init();

// Seed projeto base para testes
if (!StudioState.data.projects) StudioState.data.projects = [];
StudioState.data.projects.push({
  id: 'prj-render-g13-test',
  name: 'Projeto Render G13',
  client: 'Teste G13',
  status: 'em_andamento'
});

// Criar projeto de vídeo auxiliar
const video = StudioState.createVideoProject({
  projectId: 'prj-render-g13-test',
  title: 'Vídeo Render Test',
  type: 'tour_ambiente',
  aspectRatio: '16:9',
  fps: 30
});

// Criar timeline com clipes de teste
const timeline = StudioState.createTimeline({
  videoProjectId: video.id,
  user: 'Teste G13'
});

StudioState.addTimelineClip(timeline.id, {
  track: 'VIDEO',
  durationSeconds: 6,
  sourceLabel: 'Cena Luma 720p',
  metadata: { provider: 'Luma', resolution: '720p', width: 1280, height: 720 }
});

StudioState.addTimelineClip(timeline.id, {
  track: 'VIDEO',
  durationSeconds: 8,
  sourceLabel: 'Cena Runway 1080p',
  metadata: { provider: 'Runway', resolution: '1080p', width: 1920, height: 1080 }
});

// ===========================================================================
// 1. Presets Canônicos de Exportação
// ===========================================================================
console.log('\n--- 1. Presets Canônicos ---');

runTest('VIDEO_RENDER_PRESETS contém os 5 presets canônicos obrigatórios', () => {
  const presets = StudioState.VIDEO_RENDER_PRESETS;
  assert.ok(presets, 'VIDEO_RENDER_PRESETS deve existir');
  assert.ok(presets.WEB, 'Deve conter preset WEB');
  assert.ok(presets.SOCIAL_VERTICAL, 'Deve conter preset SOCIAL_VERTICAL');
  assert.ok(presets.SOCIAL_HORIZONTAL, 'Deve conter preset SOCIAL_HORIZONTAL');
  assert.ok(presets.CLIENT_PRESENTATION, 'Deve conter preset CLIENT_PRESENTATION');
  assert.ok(presets.HIGH_QUALITY, 'Deve conter preset HIGH_QUALITY');
});

runTest('Preset WEB está configurado para 1080p, 30fps, H.264 MP4', () => {
  const web = StudioState.VIDEO_RENDER_PRESETS.WEB;
  assert.strictEqual(web.format, 'mp4');
  assert.strictEqual(web.codec, 'h264');
  assert.strictEqual(web.resolution, '1080p');
  assert.strictEqual(web.resolutionWidth, 1920);
  assert.strictEqual(web.resolutionHeight, 1080);
  assert.strictEqual(web.aspectRatio, '16:9');
  assert.strictEqual(web.fps, 30);
  assert.strictEqual(web.bitrateKbps, 8000);
});

runTest('Preset SOCIAL_VERTICAL está configurado para proporção 9:16 (1080x1920)', () => {
  const sv = StudioState.VIDEO_RENDER_PRESETS.SOCIAL_VERTICAL;
  assert.strictEqual(sv.format, 'mp4');
  assert.strictEqual(sv.aspectRatio, '9:16');
  assert.strictEqual(sv.resolutionWidth, 1080);
  assert.strictEqual(sv.resolutionHeight, 1920);
  assert.strictEqual(sv.fps, 30);
});

runTest('Preset CLIENT_PRESENTATION está configurado para 60 FPS e áudio 320 kbps', () => {
  const cp = StudioState.VIDEO_RENDER_PRESETS.CLIENT_PRESENTATION;
  assert.strictEqual(cp.fps, 60);
  assert.strictEqual(cp.audioBitrateKbps, 320);
  assert.strictEqual(cp.bitrateKbps, 16000);
});

runTest('Preset HIGH_QUALITY está configurado para 4K UHD (3840x2160) e H.265', () => {
  const hq = StudioState.VIDEO_RENDER_PRESETS.HIGH_QUALITY;
  assert.strictEqual(hq.resolution, '4K');
  assert.strictEqual(hq.resolutionWidth, 3840);
  assert.strictEqual(hq.resolutionHeight, 2160);
  assert.strictEqual(hq.codec, 'h265');
  assert.strictEqual(hq.fps, 60);
  assert.strictEqual(hq.bitrateKbps, 35000);
});

// ===========================================================================
// 2. Formatos e Codecs
// ===========================================================================
console.log('\n--- 2. Formatos e Codecs ---');

runTest('VIDEO_RENDER_FORMATS define MP4 como prioritário', () => {
  const formats = StudioState.VIDEO_RENDER_FORMATS;
  assert.ok(formats.mp4, 'MP4 deve existir');
  assert.strictEqual(formats.mp4.isPrimary, true, 'MP4 deve ser o formato primário');
  assert.ok(formats.webm, 'WebM deve estar preparado');
  assert.ok(formats.mov, 'MOV deve estar preparado');
  assert.ok(formats.prores, 'ProRes deve estar preparado');
});

runTest('VIDEO_RENDER_CODECS suporta H.264, H.265, VP9 e ProRes', () => {
  const codecs = StudioState.VIDEO_RENDER_CODECS;
  assert.ok(codecs.h264, 'Deve suportar H.264');
  assert.ok(codecs.h265, 'Deve suportar H.265');
  assert.ok(codecs.vp9, 'Deve suportar VP9');
  assert.ok(codecs.prores, 'Deve suportar ProRes');
});

runTest('VIDEO_RENDER_STATUSES define os 5 status canônicos', () => {
  const statuses = StudioState.VIDEO_RENDER_STATUSES;
  assert.ok(statuses.queued, 'queued');
  assert.ok(statuses.processing, 'processing');
  assert.ok(statuses.completed, 'completed');
  assert.ok(statuses.failed, 'failed');
  assert.ok(statuses.cancelled, 'cancelled');
});

// ===========================================================================
// 3. Fila de Renderização e Criação de Job
// ===========================================================================
console.log('\n--- 3. Fila de Renderização ---');

let testJobId = null;

runTest('createRenderJob cria job na fila com status queued e progresso 0', () => {
  const job = StudioState.createRenderJob({
    videoProjectId: video.id,
    preset: 'WEB'
  }, 'Teste G13');

  assert.ok(job, 'Job deve ser retornado');
  assert.ok(job.id, 'Job deve ter id');
  assert.strictEqual(job.videoProjectId, video.id);
  assert.strictEqual(job.status, 'queued');
  assert.strictEqual(job.progressPercent, 0);
  assert.strictEqual(job.preset, 'WEB');
  assert.strictEqual(job.format, 'mp4');
  assert.strictEqual(job.resolution, '1080p');
  assert.strictEqual(job.targetVersion, 'v1.0');
  testJobId = job.id;
});

runTest('getRenderJob retorna job com campos enriquecidos e tempo estimado', () => {
  const job = StudioState.getRenderJob(testJobId);
  assert.ok(job);
  assert.strictEqual(job.id, testJobId);
  assert.strictEqual(job.statusLabel, 'Na Fila');
  assert.ok(job.estimatedTimeSeconds > 0, 'Deve ter estimativa de tempo');
});

runTest('getRenderJobs lista jobs do projeto ordenados por data', () => {
  const jobs = StudioState.getRenderJobs(video.id);
  assert.ok(Array.isArray(jobs));
  assert.ok(jobs.length >= 1);
  assert.strictEqual(jobs[0].id, testJobId);
});

// ===========================================================================
// 4. Ciclo de Vida: Processing ➔ Progress ➔ Completed
// ===========================================================================
console.log('\n--- 4. Ciclo de Vida do Job ---');

runTest('processRenderJob altera status de queued para processing', () => {
  const job = StudioState.processRenderJob(testJobId, 'Teste G13');
  assert.strictEqual(job.status, 'processing');
  assert.ok(job.startedAt, 'startedAt deve ser registrado');
  assert.ok(job.progressPercent > 0, 'Progresso deve ser iniciado');
});

runTest('updateRenderJobProgress atualiza percentual e fase atual', () => {
  const updated = StudioState.updateRenderJobProgress(testJobId, 55.5, 'Codificando faixas H.264');
  assert.strictEqual(updated.progressPercent, 55.5);
  assert.strictEqual(updated.currentPhase, 'Codificando faixas H.264');
});

runTest('completeRenderJob finaliza job com status completed e gera VideoRenderVersion', () => {
  const result = StudioState.completeRenderJob(testJobId, {
    outputUrl: 'https://arqvertice.storage/renders/test_video_v1.0.mp4'
  }, 'Teste G13');

  assert.ok(result.job);
  assert.strictEqual(result.job.status, 'completed');
  assert.strictEqual(result.job.progressPercent, 100);
  assert.ok(result.job.completedAt);
  assert.strictEqual(result.job.outputUrl, 'https://arqvertice.storage/renders/test_video_v1.0.mp4');

  // Versão gerada
  assert.ok(result.version);
  assert.strictEqual(result.version.versionNumber, 'v1.0');
  assert.strictEqual(result.version.format, 'mp4');
  assert.strictEqual(result.version.renderJobId, testJobId);
  assert.strictEqual(result.version.isPrimary, true);
});

// ===========================================================================
// 5. Versionamento de Vídeo
// ===========================================================================
console.log('\n--- 5. Versionamento de Vídeo ---');

runTest('getVideoVersions lista versões geradas em ordem decrescente', () => {
  const versions = StudioState.getVideoVersions(video.id);
  assert.ok(Array.isArray(versions));
  assert.strictEqual(versions.length, 1);
  assert.strictEqual(versions[0].versionNumber, 'v1.0');
});

runTest('Segundo render gera automaticamente versão incremental v1.1', () => {
  const job2 = StudioState.createRenderJob({
    videoProjectId: video.id,
    preset: 'SOCIAL_VERTICAL'
  }, 'Teste G13');

  assert.strictEqual(job2.targetVersion, 'v1.1', 'Segunda versão deve ser v1.1');

  StudioState.processRenderJob(job2.id);
  const res2 = StudioState.completeRenderJob(job2.id, {}, 'Teste G13');

  assert.strictEqual(res2.version.versionNumber, 'v1.1');

  const allVersions = StudioState.getVideoVersions(video.id);
  assert.strictEqual(allVersions.length, 2);
});

runTest('setPrimaryVideoVersion altera versão primária com exclusividade', () => {
  const versions = StudioState.getVideoVersions(video.id);
  const target = versions.find(v => v.versionNumber === 'v1.1');
  assert.ok(target);

  StudioState.setPrimaryVideoVersion(target.id, 'Teste G13');

  const updatedTarget = StudioState.getVideoVersion(target.id);
  assert.strictEqual(updatedTarget.isPrimary, true);

  const v1 = versions.find(v => v.versionNumber === 'v1.0');
  const updatedV1 = StudioState.getVideoVersion(v1.id);
  assert.strictEqual(updatedV1.isPrimary, false);
});

// ===========================================================================
// 6. Resiliência: Falha e Retry sem perda de dados
// ===========================================================================
console.log('\n--- 6. Resiliência: Falha e Retry ---');

let failedJobId = null;

runTest('failRenderJob registra erro MAS preserva projeto, timeline e clipes intactos', () => {
  const failJob = StudioState.createRenderJob({
    videoProjectId: video.id,
    preset: 'HIGH_QUALITY'
  }, 'Teste G13');
  failedJobId = failJob.id;

  StudioState.processRenderJob(failedJobId);
  const failed = StudioState.failRenderJob(failedJobId, 'Erro de timeout no servidor de encode', { code: 504 });

  assert.strictEqual(failed.status, 'failed');
  assert.strictEqual(failed.errorMessage, 'Erro de timeout no servidor de encode');

  // SALVAGUARDA: Projeto de vídeo ainda existe e está intacto
  const projCheck = StudioState.getVideoProject(video.id);
  assert.ok(projCheck, 'Projeto de vídeo NÃO pode ser perdido após falha no render');

  // Timeline ainda existe e mantém todos os clipes
  const tlCheck = StudioState.getTimeline(timeline.id);
  assert.ok(tlCheck, 'Timeline NÃO pode ser perdida após falha no render');
  const clipsCheck = StudioState.getTimelineClips(timeline.id);
  assert.strictEqual(clipsCheck.length, 2, 'Clipes da timeline devem permanecer intactos');
});

runTest('retryRenderJob permite retry de job com falha, incrementando retryCount', () => {
  const retried = StudioState.retryRenderJob(failedJobId, 'Teste G13');

  assert.strictEqual(retried.status, 'queued');
  assert.strictEqual(retried.progressPercent, 0);
  assert.strictEqual(retried.retryCount, 1);
  assert.strictEqual(retried.errorMessage, null);
});

runTest('cancelRenderJob permite cancelamento de job na fila', () => {
  const cancelJob = StudioState.createRenderJob({
    videoProjectId: video.id,
    preset: 'WEB'
  }, 'Teste G13');

  const cancelled = StudioState.cancelRenderJob(cancelJob.id, 'Cancelamento teste');
  assert.strictEqual(cancelled.status, 'cancelled');
  assert.strictEqual(cancelled.errorMessage, 'Cancelamento teste');
});

// ===========================================================================
// 7. Heterogeneidade de Provedores de IA & Normalização
// ===========================================================================
console.log('\n--- 7. Normalização de Resoluções de IA ---');

runTest('normalizeProviderResolution calcula upscale para clipe 720p em target 1080p', () => {
  const norm = StudioState.normalizeProviderResolution(
    { width: 1280, height: 720 },
    { width: 1920, height: 1080 }
  );

  assert.strictEqual(norm.action, 'upscale');
  assert.strictEqual(norm.scaleFactor, 1.5);
  assert.strictEqual(norm.scaledDimensions.width, 1920);
  assert.strictEqual(norm.scaledDimensions.height, 1080);
});

runTest('normalizeProviderResolution aplica letterbox quando proporção do clipe difere', () => {
  const norm = StudioState.normalizeProviderResolution(
    { width: 1920, height: 800 }, // 2.4:1 anamórfico
    { width: 1920, height: 1080 } // 16:9 target
  );

  assert.strictEqual(norm.letterbox, true);
  assert.ok(norm.padding.topBottom > 0);
});

runTest('detectTimelineProviderResolutions analisa clipes e mapeia normalizações', () => {
  const analysis = StudioState.detectTimelineProviderResolutions(timeline.id, { width: 1920, height: 1080 });
  assert.ok(analysis.detected);
  assert.strictEqual(analysis.detected.length, 2);
  assert.ok(analysis.normalizations);
  assert.strictEqual(analysis.normalizations.length, 2);
});

// ===========================================================================
// 8. Módulo de Interface do Usuário (VideoRenderEngineModule)
// ===========================================================================
console.log('\n--- 8. Módulo de Interface ---');

runTest('VideoRenderEngineModule renderiza interface com presets, fila e versões', () => {
  const html = VideoRenderEngineModule.render(video.id);
  assert.ok(typeof html === 'string');
  assert.ok(html.includes('Bloco G13 • Pipeline de Render'));
  assert.ok(html.includes('Presets Canônicos de Exportação'));
  assert.ok(html.includes('Web Padrão'));
  assert.ok(html.includes('Social Vertical (9:16)'));
  assert.ok(html.includes('Alta Qualidade (4K Master)'));
  assert.ok(html.includes('Versionamento de Vídeo Exportado'));
});

// ===========================================================================
// RESUMO FINAL
// ===========================================================================
console.log('\n================================================================');
console.log(`TOTAL DE TESTES: ${totalTests}`);
console.log(`PASSOU:         ${passedTests}`);
console.log(`FALHOU:         ${failedTests}`);
console.log('================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('✔ TODOS OS TESTES DE G13 FORAM EXECUTADOS COM SUCESSO!\n');
}
