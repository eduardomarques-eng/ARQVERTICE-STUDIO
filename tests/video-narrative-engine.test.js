/**
 * Suíte de Testes Automatizados — Bloco G04: Narrative Engine do ArqVertice Studio
 *
 * Validações exigidas:
 * - Estrutura Padrão (9 beats):
 *   ABERTURA -> CONTEXTO -> CONCEITO -> AMBIENTE -> DETALHES -> MATERIAIS -> COMPOSIÇÃO -> RESULTADO -> ENCERRAMENTO.
 * - Estruturas Flexíveis:
 *   - Vídeo de Ambiente (8 beats):
 *     ABERTURA -> PLANTA -> ENTRADA -> VISTA PRINCIPAL -> DETALHES -> MATERIAIS -> MOBILIÁRIO -> ENCERRAMENTO.
 *   - Vídeo de Projeto (7 beats):
 *     CONTEXTO -> CONCEITO -> PLANTA -> AMBIENTES -> PERSPECTIVAS -> MATERIAIS -> RESULTADO.
 *   - Vídeo de Moodboard (7 beats):
 *     REFERÊNCIA -> PALETA -> MATERIAL -> MOBILIÁRIO -> TEXTURA -> ATMOSFERA -> RESULTADO.
 * - Campos obrigatórios da entidade NarrativeScene:
 *   id, videoProjectId, sequence, title, purpose, duration, assetIds, text, voiceover, transition, notes.
 * - Operações de Edição Narrativa:
 *   - Rearranjo (reordenação sequencial)
 *   - Duplicação (clonagem contígua)
 *   - Exclusão (remoção com recálculo de sequências)
 *   - Inserir nova cena (em qualquer posição)
 * - Sugestão de Narrativa por IA (Roteiro, voz, tempo e amarração com ativos do G03)
 * - Regra de Governança Estrita:
 *   - "Nunca substituir automaticamente narrativa aprovada."
 * - Visualização em Timeline Interativa (VideoNarrativeEngineModule)
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
const VideoNarrativeEngineModule = require('../js/video-narrative-engine-module.js');

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
console.log('SUÍTE DE TESTES: BLOCO G04 — NARRATIVE ENGINE DO VÍDEO');
console.log('================================================================\n');

// 1. Estruturas Narrativas Canônicas
runTest('Deve conter a Estrutura Padrão com os 9 atos canônicos', () => {
  const expected = [
    'ABERTURA',
    'CONTEXTO',
    'CONCEITO',
    'AMBIENTE',
    'DETALHES',
    'MATERIAIS',
    'COMPOSIÇÃO',
    'RESULTADO',
    'ENCERRAMENTO'
  ];

  assert.ok(StudioState.NARRATIVE_STANDARD_STRUCTURE, 'NARRATIVE_STANDARD_STRUCTURE deve existir');
  assert.strictEqual(StudioState.NARRATIVE_STANDARD_STRUCTURE.length, 9);
  assert.deepStrictEqual(StudioState.NARRATIVE_STANDARD_STRUCTURE, expected);
});

runTest('Deve conter a Estrutura para Vídeo de Ambiente com 8 atos', () => {
  const expected = [
    'ABERTURA',
    'PLANTA',
    'ENTRADA',
    'VISTA PRINCIPAL',
    'DETALHES',
    'MATERIAIS',
    'MOBILIÁRIO',
    'ENCERRAMENTO'
  ];

  assert.ok(StudioState.NARRATIVE_ENVIRONMENT_STRUCTURE, 'NARRATIVE_ENVIRONMENT_STRUCTURE deve existir');
  assert.strictEqual(StudioState.NARRATIVE_ENVIRONMENT_STRUCTURE.length, 8);
  assert.deepStrictEqual(StudioState.NARRATIVE_ENVIRONMENT_STRUCTURE, expected);
});

runTest('Deve conter a Estrutura para Vídeo de Projeto com 7 atos', () => {
  const expected = [
    'CONTEXTO',
    'CONCEITO',
    'PLANTA',
    'AMBIENTES',
    'PERSPECTIVAS',
    'MATERIAIS',
    'RESULTADO'
  ];

  assert.ok(StudioState.NARRATIVE_PROJECT_STRUCTURE, 'NARRATIVE_PROJECT_STRUCTURE deve existir');
  assert.strictEqual(StudioState.NARRATIVE_PROJECT_STRUCTURE.length, 7);
  assert.deepStrictEqual(StudioState.NARRATIVE_PROJECT_STRUCTURE, expected);
});

runTest('Deve conter a Estrutura para Vídeo de Moodboard com 7 atos', () => {
  const expected = [
    'REFERÊNCIA',
    'PALETA',
    'MATERIAL',
    'MOBILIÁRIO',
    'TEXTURA',
    'ATMOSFERA',
    'RESULTADO'
  ];

  assert.ok(StudioState.NARRATIVE_MOODBOARD_STRUCTURE, 'NARRATIVE_MOODBOARD_STRUCTURE deve existir');
  assert.strictEqual(StudioState.NARRATIVE_MOODBOARD_STRUCTURE.length, 7);
  assert.deepStrictEqual(StudioState.NARRATIVE_MOODBOARD_STRUCTURE, expected);
});

// 2. Resolução Dinâmica de Estrutura por Tipo de Vídeo
runTest('getNarrativeStructureForVideo deve resolver a estrutura correta para cada tipo de vídeo', () => {
  const structAmbiente = StudioState.getNarrativeStructureForVideo('apresentacao_ambiente');
  assert.strictEqual(structAmbiente.length, 8);
  assert.strictEqual(structAmbiente[2], 'ENTRADA');

  const structProjeto = StudioState.getNarrativeStructureForVideo('apresentacao_projeto');
  assert.strictEqual(structProjeto.length, 7);
  assert.strictEqual(structProjeto[0], 'CONTEXTO');

  const structMoodboard = StudioState.getNarrativeStructureForVideo('video_moodboard');
  assert.strictEqual(structMoodboard.length, 7);
  assert.strictEqual(structMoodboard[0], 'REFERÊNCIA');

  const structStandard = StudioState.getNarrativeStructureForVideo('outro_tipo');
  assert.strictEqual(structStandard.length, 9);
  assert.strictEqual(structStandard[0], 'ABERTURA');
});

// 3. Geração de Narrativa por IA e Campos do Modelo NarrativeScene
runTest('IA deve gerar cenas estruturadas com todos os campos obrigatórios de NarrativeScene', () => {
  const projectId = 'prj-praia-01';
  const video = StudioState.createVideoProject({
    projectId,
    title: 'Vídeo Narrativa Padrão — Teste G04',
    type: 'apresentacao_completa'
  });

  // Prepara seleção de ativos no G03
  StudioState.collectProjectVideoAssets(projectId, video.id);

  // Sugere narrativa
  const scenes = StudioState.suggestNarrativeForVideo(video.id);

  assert.ok(Array.isArray(scenes));
  assert.ok(scenes.length > 0, 'Deve gerar cenas');

  const sample = scenes[0];
  assert.ok(sample.id, 'Deve conter id');
  assert.strictEqual(sample.videoProjectId, video.id, 'Deve vincular ao videoProjectId');
  assert.strictEqual(sample.sequence, 1, 'Primeira cena deve ter sequence = 1');
  assert.ok(sample.title, 'Deve conter title');
  assert.ok(sample.purpose, 'Deve conter purpose');
  assert.strictEqual(typeof sample.duration, 'number', 'duration deve ser número');
  assert.ok(sample.duration > 0, 'duration deve ser positiva');
  assert.ok(Array.isArray(sample.assetIds), 'assetIds deve ser array');
  assert.strictEqual(typeof sample.text, 'string', 'text deve ser string');
  assert.strictEqual(typeof sample.voiceover, 'string', 'voiceover deve ser string');
  assert.ok(sample.voiceover.length > 0, 'voiceover deve ter conteúdo textual');
  assert.ok(sample.transition, 'transition deve existir');
  assert.strictEqual(typeof sample.notes, 'string', 'notes deve ser string');
  assert.strictEqual(sample.isApproved, false, 'Nova cena deve iniciar não aprovada');
});

// 4. Operações: Inserção de Nova Cena
runTest('Deve permitir inserir nova cena narrativa em posição específica', () => {
  const projectId = 'prj-praia-01';
  const video = StudioState.createVideoProject({ projectId, title: 'Vídeo Teste Inserção' });
  StudioState.collectProjectVideoAssets(projectId, video.id);
  StudioState.suggestNarrativeForVideo(video.id);

  const initialCount = StudioState.getNarrativeScenes(video.id).length;

  // Inserir na posição 2
  const updated = StudioState.insertNarrativeScene(video.id, {
    title: 'Tomada Aérea da Falésia e Acesso',
    purpose: 'CONTEXTO',
    duration: 7.0,
    text: 'Entorno Litorâneo Privilegiado',
    voiceover: 'Vista panorâmica conectando a topografia ao mar.'
  }, 2, 'Arquiteto');

  assert.strictEqual(updated.length, initialCount + 1, 'Total de cenas deve ter aumentado em 1');
  const inserted = updated.find(s => s.sequence === 2);
  assert.ok(inserted);
  assert.strictEqual(inserted.title, 'Tomada Aérea da Falésia e Acesso');

  // Verifica que a cena anterior continuou 1 e a que era 2 virou 3
  const scene1 = updated.find(s => s.sequence === 1);
  const scene3 = updated.find(s => s.sequence === 3);
  assert.ok(scene1);
  assert.ok(scene3);
});

// 5. Operações: Duplicação de Cena
runTest('Deve permitir duplicar cena narrativa mantendo atributos e gerando sequência adjacente', () => {
  const projectId = 'prj-praia-01';
  const video = StudioState.createVideoProject({ projectId, title: 'Vídeo Teste Duplicação' });
  StudioState.collectProjectVideoAssets(projectId, video.id);
  const scenes = StudioState.suggestNarrativeForVideo(video.id);
  const target = scenes[0];

  const updated = StudioState.duplicateNarrativeScene(target.id, 'Arquiteto');
  assert.strictEqual(updated.length, scenes.length + 1);

  const dup = updated.find(s => s.sequence === 2);
  assert.ok(dup);
  assert.ok(dup.title.includes('(Cópia)'));
  assert.strictEqual(dup.purpose, target.purpose);
  assert.strictEqual(dup.duration, target.duration);
});

// 6. Operações: Exclusão de Cena
runTest('Deve permitir excluir cena narrativa e reordenar sequências subsequentes', () => {
  const projectId = 'prj-praia-01';
  const video = StudioState.createVideoProject({ projectId, title: 'Vídeo Teste Exclusão' });
  StudioState.collectProjectVideoAssets(projectId, video.id);
  const scenes = StudioState.suggestNarrativeForVideo(video.id);
  const targetId = scenes[1].id; // cena 2
  const originalLength = scenes.length;

  const updated = StudioState.deleteNarrativeScene(targetId, 'Arquiteto');
  assert.strictEqual(updated.length, originalLength - 1);

  // Garante que não existem buracos nas sequências (1, 2, 3...)
  updated.forEach((s, idx) => {
    assert.strictEqual(s.sequence, idx + 1, `Cena no índice ${idx} deve ter sequence = ${idx + 1}`);
  });
});

// 7. Operações: Rearranjo (Reordenação)
runTest('Deve permitir rearranjar a sequência narrativa das cenas', () => {
  const projectId = 'prj-praia-01';
  const video = StudioState.createVideoProject({ projectId, title: 'Vídeo Teste Rearranjo' });
  StudioState.collectProjectVideoAssets(projectId, video.id);
  const scenes = StudioState.suggestNarrativeForVideo(video.id);

  const id1 = scenes[0].id;
  const id2 = scenes[1].id;
  const id3 = scenes[2].id;

  // Nova ordem: cena 3, cena 1, cena 2, ...
  const newOrder = [id3, id1, id2, ...scenes.slice(3).map(s => s.id)];
  const reordered = StudioState.reorderNarrativeScenes(video.id, newOrder, 'Arquiteto');

  assert.strictEqual(reordered.find(s => s.id === id3).sequence, 1);
  assert.strictEqual(reordered.find(s => s.id === id1).sequence, 2);
  assert.strictEqual(reordered.find(s => s.id === id2).sequence, 3);
});

// 8. Regra Crítica de Governança: NUNCA substituir automaticamente narrativa aprovada
runTest('Nunca deve substituir automaticamente narrativa aprovada', () => {
  const projectId = 'prj-praia-01';
  const video = StudioState.createVideoProject({ projectId, title: 'Vídeo Narrativa Homologada' });
  StudioState.collectProjectVideoAssets(projectId, video.id);
  StudioState.suggestNarrativeForVideo(video.id);

  // Aprova a narrativa
  StudioState.approveNarrative(video.id, 'Arquiteto Titular');

  const approvedScenes = StudioState.getNarrativeScenes(video.id);
  assert.ok(approvedScenes.every(s => s.isApproved === true), 'Todas as cenas devem estar aprovadas');

  // Tentativa de substituição automática deve lançar erro bloqueante
  assert.throws(() => {
    StudioState.suggestNarrativeForVideo(video.id);
  }, /Operação bloqueada: A narrativa do vídeo .* já foi aprovada e NÃO pode ser substituída automaticamente/);

  // Tentativa de excluir cena aprovada sem flag explícita também deve ser bloqueada
  assert.throws(() => {
    StudioState.deleteNarrativeScene(approvedScenes[0].id, 'Sistema', false);
  }, /está aprovada e não pode ser excluída sem confirmação expressa/);
});

// 9. Visualização em Timeline e Interface (VideoNarrativeEngineModule)
runTest('VideoNarrativeEngineModule deve renderizar a visualização em timeline e lista de cenas', () => {
  const projectId = 'prj-praia-01';
  const video = StudioState.createVideoProject({
    projectId,
    title: 'Vídeo Timeline Render',
    type: 'video_ambiente'
  });
  StudioState.collectProjectVideoAssets(projectId, video.id);
  StudioState.suggestNarrativeForVideo(video.id);

  const html = VideoNarrativeEngineModule.renderNarrativeEngine(video.id, projectId);

  assert.ok(html.includes('BLOCO G04'), 'Deve conter cabeçalho G04');
  assert.ok(html.includes('Visualização em Timeline Audiovisual'), 'Deve conter bloco de timeline');
  assert.ok(html.includes('timeline-track'), 'Deve conter a faixa horizontal de timeline');
  assert.ok(html.includes('Sequência Roteirizada de Cenas'), 'Deve listar cenas detalhadas');
  assert.ok(html.includes('Texto em Tela (Legenda / Lettering)'), 'Deve exibir lettering');
  assert.ok(html.includes('Locução / Voiceover Roteirizada'), 'Deve exibir voiceover');
  assert.ok(html.includes('Duplicar'), 'Deve conter botão de duplicação');
  assert.ok(html.includes('Homologar & Finalizar G04 →') || html.includes('Finalizar G04'), 'Deve conter ação de conclusão de G04');
});

console.log('\n================================================================');
console.log(`RESULTADO DOS TESTES G04:`);
console.log(`  Sucessos: ${testsPassed}`);
console.log(`  Falhas:   ${testsFailed}`);
console.log('================================================================');

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log('Todos os testes do Bloco G04 passaram com 100% de conformidade!\n');
}
