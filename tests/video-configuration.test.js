/**
 * Suíte de Testes Automatizados — Bloco G02: Configurador de Vídeo
 *
 * Validações exigidas:
 * - 12 Tipos de vídeo canônicos com seus objetivos
 * - Proporções de tela (16:9, 9:16, 1:1, 4:5)
 * - Durações predefinidas (15s, 30s, 45s, 60s, 90s, 120s) e personalizada sem limites artificiais
 * - Resoluções (720p, 1080p, 2K, 4K) e orientações (horizontal, vertical, quadrado)
 * - Ritmo dos cortes (lento_contemplativo, suave_moderado, dinamico_rapido)
 * - Estilo narrativo (institucional, sensorial, tecnico, comercial, minimalista)
 * - Parâmetros audiovisuais (presença de voz, música, textos, legendas)
 * - Quantidade de cenas planejadas
 * - Aplicação de Presets prontos
 * - Regra mandatória: Não gerar automaticamente vídeo antes da confirmação
 * - Confirmação de configuração e transição para narrativa (confirmVideoConfig)
 * - Renderização da tela "Configuração do vídeo" com o botão obrigatório "CONTINUAR PARA NARRATIVA"
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
const VideoConfiguratorModule = require('../js/video-configurator-module.js');

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
console.log('SUÍTE DE TESTES: BLOCO G02 — CONFIGURADOR DE VÍDEO');
console.log('================================================================\n');

const testProjectId = 'prj-praia-01';

// 1. Cobertura dos 12 Tipos Canônicos de Vídeo
runTest('1.1 - Cobertura dos 12 tipos canônicos de vídeo no configurador', () => {
  const expectedTypes = [
    'APRESENTAÇÃO COMPLETA',
    'APRESENTAÇÃO POR AMBIENTE',
    'VÍDEO DE CONCEITO',
    'WALKTHROUGH',
    'REEL',
    'SHORT',
    'APRESENTAÇÃO PARA CLIENTE',
    'VÍDEO INSTITUCIONAL',
    'ANTES/DEPOIS',
    'VÍDEO DE MOODBOARD',
    'VÍDEO DE AMBIENTE',
    'VÍDEO DE DETALHES'
  ];

  assert.strictEqual(StudioState.VIDEO_CONFIG_TYPES.length, 12, 'Exatamente 12 tipos canônicos');
  expectedTypes.forEach(t => {
    assert.ok(StudioState.VIDEO_CONFIG_TYPES.includes(t), `Tipo configurável presente: ${t}`);
    const meta = StudioState.VIDEO_CONFIG_TYPES_META[t];
    assert.ok(meta, `Metadados do tipo ${t} definidos`);
    assert.ok(meta.name, 'Nome amigável');
    assert.ok(meta.description, 'Descrição de escopo');
    assert.ok(meta.defaultRatio, 'Proporção padrão');
  });
});

// 2. Proporções e Orientações
runTest('2.1 - Cobertura das 4 proporções obrigatórias e orientações espaciais', () => {
  const expectedRatios = ['16:9', '9:16', '1:1', '4:5'];

  expectedRatios.forEach(r => {
    const video = StudioState.createVideoProject({
      projectId: testProjectId,
      title: `Teste Proporção ${r}`,
      aspectRatio: r
    });

    const enriched = StudioState.getVideoProject(video.id);
    assert.strictEqual(enriched.aspectRatio, r);

    if (r === '16:9') assert.strictEqual(enriched.orientation, 'horizontal');
    else if (r === '9:16' || r === '4:5') assert.strictEqual(enriched.orientation, 'vertical');
    else if (r === '1:1') assert.strictEqual(enriched.orientation, 'quadrado');
  });
});

// 3. Durações Predefinidas e Personalizada sem Limites Artificiais
runTest('3.1 - Suporte a todas as durações predefinidas (15s, 30s, 45s, 60s, 90s, 120s)', () => {
  const predefinedDurations = [
    { dur: '15s', sec: 15 },
    { dur: '30s', sec: 30 },
    { dur: '45s', sec: 45 },
    { dur: '60s', sec: 60 },
    { dur: '90s', sec: 90 },
    { dur: '120s', sec: 120 }
  ];

  predefinedDurations.forEach(({ dur, sec }) => {
    const video = StudioState.createVideoProject({
      projectId: testProjectId,
      title: `Vídeo ${dur}`,
      duration: dur,
      durationSeconds: sec
    });

    const config = StudioState.getVideoConfig(video.id);
    assert.strictEqual(config.duration, dur);
    assert.strictEqual(config.durationSeconds, sec);
    assert.strictEqual(config.isCustomDuration, false);
  });
});

runTest('3.2 - Duração personalizada suporta valores estendidos sem limitação artificial', () => {
  const video = StudioState.createVideoProject({
    projectId: testProjectId,
    title: 'Walkthrough Longo Personalizado'
  });

  // Aplica duração personalizada de 300 segundos (5 minutos)
  StudioState.saveVideoConfig(video.id, {
    isCustomDuration: true,
    duration: '300s',
    durationSeconds: 300
  });

  const config = StudioState.getVideoConfig(video.id);
  assert.strictEqual(config.isCustomDuration, true);
  assert.strictEqual(config.duration, '300s');
  assert.strictEqual(config.durationSeconds, 300);
});

// 4. Ritmo (Pacing) e Estilo Narrativo
runTest('4.1 - Cobertura de ritmo dos cortes e estilos narrativos', () => {
  const pacings = ['lento_contemplativo', 'suave_moderado', 'dinamico_rapido'];
  const styles = ['institucional', 'sensorial', 'tecnico', 'comercial', 'minimalista'];

  assert.strictEqual(StudioState.VIDEO_PACING_OPTIONS.length, 3);
  assert.strictEqual(StudioState.VIDEO_NARRATIVE_STYLES.length, 5);

  const video = StudioState.createVideoProject({
    projectId: testProjectId,
    title: 'Vídeo Ritmo e Estilo'
  });

  pacings.forEach(p => {
    StudioState.saveVideoConfig(video.id, { pacing: p });
    const c = StudioState.getVideoConfig(video.id);
    assert.strictEqual(c.pacing, p);
  });

  styles.forEach(s => {
    StudioState.saveVideoConfig(video.id, { narrativeStyle: s });
    const c = StudioState.getVideoConfig(video.id);
    assert.strictEqual(c.narrativeStyle, s);
  });
});

// 5. Parâmetros Audiovisuais (Voz, Música, Textos, Legendas, Cenas)
runTest('5.1 - Configuração individual de voz, música, textos, legendas e quantidade de cenas', () => {
  const video = StudioState.createVideoProject({
    projectId: testProjectId,
    title: 'Vídeo Parâmetros Audiovisuais'
  });

  StudioState.saveVideoConfig(video.id, {
    hasVoiceover: true,
    hasMusic: true,
    hasTextOverlays: false,
    hasSubtitles: true,
    scenesCount: 7
  });

  const config = StudioState.getVideoConfig(video.id);
  assert.strictEqual(config.hasVoiceover, true, 'Presença de voz ativada');
  assert.strictEqual(config.hasMusic, true, 'Presença de música ativada');
  assert.strictEqual(config.hasTextOverlays, false, 'Presença de textos desativada');
  assert.strictEqual(config.hasSubtitles, true, 'Presença de legendas ativada');
  assert.strictEqual(config.scenesCount, 7, '7 cenas planejadas');
});

// 6. Presets Prontos
runTest('6.1 - Carregar e aplicar presets prontos (Reel Dinâmico, Walkthrough Cinemático, etc.)', () => {
  const presets = StudioState.getVideoConfigPresets();
  assert.ok(presets.length >= 5, 'Presets prontos disponíveis');

  const video = StudioState.createVideoProject({
    projectId: testProjectId,
    title: 'Vídeo Base para Preset'
  });

  // Aplica preset de Reel Dinâmico
  const appliedReel = StudioState.applyVideoPreset(video.id, 'reel_dinamico');
  assert.strictEqual(appliedReel.type, 'REEL');
  assert.strictEqual(appliedReel.aspectRatio, '9:16');
  assert.strictEqual(appliedReel.orientation, 'vertical');
  assert.strictEqual(appliedReel.durationSeconds, 30);
  assert.strictEqual(appliedReel.pacing, 'dinamico_rapido');
  assert.strictEqual(appliedReel.hasMusic, true);

  // Aplica preset de Walkthrough Cinemático
  const appliedWalk = StudioState.applyVideoPreset(video.id, 'walkthrough_cinematico');
  assert.strictEqual(appliedWalk.type, 'WALKTHROUGH');
  assert.strictEqual(appliedWalk.aspectRatio, '16:9');
  assert.strictEqual(appliedWalk.durationSeconds, 90);
  assert.strictEqual(appliedWalk.resolution, '4K');
  assert.strictEqual(appliedWalk.hasVoiceover, true);
});

// 7. Regra Mandatória: Não Gerar Automaticamente Vídeo Antes da Confirmação
runTest('7.1 - Vídeo permanece em rascunho com configConfirmed=false antes da confirmação', () => {
  const video = StudioState.createVideoProject({
    projectId: testProjectId,
    title: 'Vídeo Não Confirmado',
    type: 'REEL'
  });

  const config = StudioState.getVideoConfig(video.id);
  assert.strictEqual(config.configConfirmed, false, 'Configuração ainda não confirmada');
  assert.strictEqual(video.status, 'rascunho', 'Status inicial rascunho');

  // Assegura que nenhuma cena ou render automático foi gerado sem o consentimento
  const timeline = StudioState.getVideoTimeline(video.id);
  assert.strictEqual(timeline.scenes.length, 0, 'Nenhuma cena gerada automaticamente');
});

// 8. Confirmação de Configuração e Transição para Narrativa
runTest('8.1 - confirmVideoConfig homologa parâmetros e avança status para planejamento', () => {
  const video = StudioState.createVideoProject({
    projectId: testProjectId,
    title: 'Vídeo para Homologação de Configuração',
    type: 'APRESENTAÇÃO PARA CLIENTE'
  });

  StudioState.saveVideoConfig(video.id, {
    aspectRatio: '16:9',
    duration: '120s',
    durationSeconds: 120,
    pacing: 'suave_moderado',
    narrativeStyle: 'institucional',
    hasVoiceover: true,
    hasMusic: true,
    hasTextOverlays: true,
    hasSubtitles: true,
    scenesCount: 8
  });

  const confirmed = StudioState.confirmVideoConfig(video.id, 'Arquiteto Responsável');
  assert.strictEqual(confirmed.configConfirmed, true, 'configConfirmed true');
  assert.ok(confirmed.configConfirmedAt, 'Data de confirmação registrada');
  assert.strictEqual(confirmed.status, 'planejamento', 'Status promovido para planejamento');

  // Não permite alterar configuração se o vídeo for aprovado formalmente
  StudioState.approveVideoProject(video.id, 'Arquiteto Titular');
  assert.throws(() => {
    StudioState.saveVideoConfig(video.id, { duration: '30s' });
  }, /protegido contra alterações diretas/i);
});

// 9. Renderização da Interface: Tela "Configuração do vídeo" e Botão "CONTINUAR PARA NARRATIVA"
runTest('9.1 - Interface: Renderiza tela "Configuração do vídeo" com todos os 12 tipos e opções', () => {
  const video = StudioState.createVideoProject({
    projectId: testProjectId,
    title: 'Vídeo Teste UI Configurator',
    type: 'WALKTHROUGH'
  });

  const html = VideoConfiguratorModule.renderConfigurator(video.id, testProjectId);

  // Título da tela obrigatório
  assert.ok(html.includes('Configuração do vídeo'), 'Título da tela "Configuração do vídeo" presente');

  // Presença de tipos canônicos no HTML
  assert.ok(html.includes('APRESENTAÇÃO COMPLETA'), 'Tipo APRESENTAÇÃO COMPLETA');
  assert.ok(html.includes('WALKTHROUGH') || html.includes('Walkthrough'), 'Tipo WALKTHROUGH');
  assert.ok(html.includes('REEL') || html.includes('Reel'), 'Tipo REEL');
  assert.ok(html.includes('SHORT') || html.includes('Short'), 'Tipo SHORT');
  assert.ok(html.includes('ANTES/DEPOIS') || html.includes('Antes / Depois'), 'Tipo ANTES/DEPOIS');
  assert.ok(html.includes('VÍDEO DE MOODBOARD') || html.includes('Moodboard'), 'Tipo VÍDEO DE MOODBOARD');
  assert.ok(html.includes('VÍDEO DE DETALHES') || html.includes('Detalhes'), 'Tipo VÍDEO DE DETALHES');

  // Opções técnicas
  assert.ok(html.includes('16:9'), 'Proporção 16:9');
  assert.ok(html.includes('9:16'), 'Proporção 9:16');
  assert.ok(html.includes('1:1'), 'Proporção 1:1');
  assert.ok(html.includes('4:5'), 'Proporção 4:5');
  assert.ok(html.includes('Presença de Voz'), 'Opção de Voz');
  assert.ok(html.includes('Presença de Música'), 'Opção de Música');
  assert.ok(html.includes('Presença de Textos'), 'Opção de Textos');
  assert.ok(html.includes('Presença de Legendas'), 'Opção de Legendas');

  // BOTÃO OBRIGATÓRIO EXIGIDO NO PROMPT
  assert.ok(html.includes('CONTINUAR PARA NARRATIVA'), 'Botão "CONTINUAR PARA NARRATIVA" presente na interface');
});

console.log('\n----------------------------------------------------------------');
console.log(`TOTAL DE TESTES: ${testsPassed + testsFailed}`);
console.log(`PASSOU: ${testsPassed}`);
console.log(`FALHOU: ${testsFailed}`);
console.log('----------------------------------------------------------------\n');

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log('✔ TODOS OS TESTES DO BLOCO G02 PASSARAM COM SUCESSO!\n');
}
