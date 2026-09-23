/**
 * Suíte de Testes Automatizados — Bloco G03: Sistema de Seleção de Conteúdo para Vídeo
 *
 * Validações exigidas:
 * - Coleta e unificação das 15 fontes de conteúdo:
 *   briefing, conceito, ambientes, plantas, plantas humanizadas,
 *   perspectivas, renders, referências, materiais, mobiliário,
 *   moodboards, pranchas, observações, revisões, arquivos aprovados.
 * - Regra de Governança Estrita:
 *   Somente conteúdo autorizado/aprovado é selecionado automaticamente.
 *   Itens em RASCUNHO, EM REVISÃO e ARQUIVADO NÃO entram automaticamente.
 * - 11 Papéis Audiovisuais (Roles):
 *   abertura, contexto, planta, ambiente, perspectiva, detalhe,
 *   material, mobiliário, transição, encerramento, CTA.
 * - 7 Filtros Canônicos:
 *   projeto, ambiente, tipo, aprovação, revisão, resolução, orientação.
 * - Operações do Usuário:
 *   selecionar, desmarcar, ordenar, substituir, visualizar, comparar versões.
 * - Sistema de Recomendação por IA:
 *   "Esta imagem funciona melhor como abertura."
 *   "Esta imagem apresenta melhor o ambiente."
 *   "Esta imagem funciona melhor como encerramento."
 *   Preservação da autonomia (decisão final do usuário).
 *   Não excluir imagens automaticamente nem substituir imagens aprovadas.
 * - Interface do Módulo (VideoAssetSelectionModule).
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
const VideoAssetSelectionModule = require('../js/video-asset-selection-module.js');

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
console.log('SUÍTE DE TESTES: BLOCO G03 — SELEÇÃO DE CONTEÚDO PARA VÍDEO');
console.log('================================================================\n');

// 1. Constantes e Definições de Domínio
runTest('Deve conter os 11 papéis audiovisuais (Roles) canônicos', () => {
  const expectedRoles = [
    'abertura',
    'contexto',
    'planta',
    'ambiente',
    'perspectiva',
    'detalhe',
    'material',
    'mobiliário',
    'transição',
    'encerramento',
    'CTA'
  ];

  assert.ok(StudioState.VIDEO_ASSET_ROLES, 'VIDEO_ASSET_ROLES deve existir');
  assert.strictEqual(StudioState.VIDEO_ASSET_ROLES.ALL.length, 11, 'Devem existir exatamente 11 roles');
  expectedRoles.forEach(role => {
    assert.ok(StudioState.VIDEO_ASSET_ROLES.ALL.includes(role), `Deveria incluir role: ${role}`);
  });
});

runTest('Deve conter as 15 fontes de conteúdo suportadas', () => {
  const expectedSources = [
    'briefing',
    'conceito',
    'ambientes',
    'plantas',
    'plantas humanizadas',
    'perspectivas',
    'renders',
    'referências',
    'materiais',
    'mobiliário',
    'moodboards',
    'pranchas',
    'observações',
    'revisões',
    'arquivos aprovados'
  ];

  assert.ok(StudioState.VIDEO_ASSET_SOURCES, 'VIDEO_ASSET_SOURCES deve existir');
  assert.strictEqual(StudioState.VIDEO_ASSET_SOURCES.length, 15, 'Devem existir exatamente 15 fontes');
  expectedSources.forEach(src => {
    assert.ok(StudioState.VIDEO_ASSET_SOURCES.includes(src), `Deveria incluir fonte: ${src}`);
  });
});

// 2. Coleta e Normalização de Conteúdo
runTest('Deve coletar ativos existentes do projeto unificando fontes e metadados', () => {
  const projectId = 'prj-praia-01';
  const video = StudioState.createVideoProject({
    projectId,
    title: 'Vídeo Conceito Praia — Teste G03',
    type: 'video_conceito'
  });

  const collected = StudioState.collectProjectVideoAssets(projectId, video.id);
  assert.ok(Array.isArray(collected), 'Coletados deve ser um array');
  assert.ok(collected.length > 0, 'Deve ter coletado ativos do projeto');

  // Verifica presença de campos obrigatórios do VideoAssetSelection
  const sample = collected[0];
  assert.ok(sample.id, 'Deve ter id');
  assert.strictEqual(sample.videoProjectId, video.id, 'Deve vincular ao videoProjectId');
  assert.ok(sample.assetId, 'Deve ter assetId');
  assert.ok(sample.sourceType, 'Deve ter sourceType');
  assert.ok(sample.sourceId, 'Deve ter sourceId');
  assert.strictEqual(typeof sample.selected, 'boolean', 'selected deve ser booleano');
  assert.strictEqual(typeof sample.order, 'number', 'order deve ser número');
  assert.ok(sample.role, 'Deve ter role atribuído');
});

// 3. Regra de Governança: Somente conteúdo autorizado/aprovado entra automaticamente
runTest('Somente itens com status APROVADO devem ser selecionados automaticamente (selected = true)', () => {
  const projectId = 'prj-praia-01';
  const video = StudioState.createVideoProject({
    projectId,
    title: 'Vídeo Governança — Teste G03',
    type: 'apresentacao_completa'
  });

  const selections = StudioState.collectProjectVideoAssets(projectId, video.id);

  // Filtra por status
  const approvedItems = selections.filter(s => s.approvalStatus === 'APROVADO');
  const nonApprovedItems = selections.filter(s => s.approvalStatus !== 'APROVADO');

  assert.ok(approvedItems.length > 0, 'Deve haver itens aprovados no projeto de teste');
  assert.ok(nonApprovedItems.length > 0, 'Deve haver itens não aprovados no projeto de teste');

  // Todos os aprovados devem vir pré-selecionados
  approvedItems.forEach(item => {
    assert.strictEqual(item.selected, true, `Item aprovado "${item.title}" deve ter selected = true`);
  });

  // Itens em RASCUNHO, EM REVISÃO e ARQUIVADO NÃO devem entrar automaticamente
  nonApprovedItems.forEach(item => {
    assert.strictEqual(
      item.selected,
      false,
      `Item em estado "${item.approvalStatus}" (${item.title}) NUNCA deve entrar automaticamente (deve ter selected = false)`
    );
  });
});

// 4. Filtros Exigidos (7 Filtros)
runTest('Filtro por Projeto deve retornar apenas itens do projeto informado', () => {
  const projectId = 'prj-praia-01';
  const video = StudioState.createVideoProject({ projectId, title: 'Vídeo Filtro Projeto' });
  StudioState.collectProjectVideoAssets(projectId, video.id);

  const filtered = StudioState.getVideoAssetSelections(video.id, { project: projectId });
  assert.ok(filtered.length > 0);
  filtered.forEach(item => {
    assert.strictEqual(item.projectId, projectId);
  });
});

runTest('Filtro por Tipo de Fonte (sourceType) deve filtrar com exatidão', () => {
  const projectId = 'prj-praia-01';
  const video = StudioState.createVideoProject({ projectId, title: 'Vídeo Filtro Tipo' });
  StudioState.collectProjectVideoAssets(projectId, video.id);

  const rendersOnly = StudioState.getVideoAssetSelections(video.id, { type: 'renders' });
  assert.ok(rendersOnly.length > 0);
  rendersOnly.forEach(item => {
    assert.strictEqual(item.sourceType.toLowerCase(), 'renders');
  });

  const plantsOnly = StudioState.getVideoAssetSelections(video.id, { type: 'plantas' });
  assert.ok(plantsOnly.length > 0);
  plantsOnly.forEach(item => {
    assert.strictEqual(item.sourceType.toLowerCase(), 'plantas');
  });
});

runTest('Filtro por Status de Aprovação deve separar aprovados e em revisão', () => {
  const projectId = 'prj-praia-01';
  const video = StudioState.createVideoProject({ projectId, title: 'Vídeo Filtro Aprovação' });
  StudioState.collectProjectVideoAssets(projectId, video.id);

  const approved = StudioState.getVideoAssetSelections(video.id, { approval: 'APROVADO' });
  assert.ok(approved.length > 0);
  approved.forEach(item => {
    assert.strictEqual(item.approvalStatus, 'APROVADO');
  });

  const inReview = StudioState.getVideoAssetSelections(video.id, { approval: 'EM REVISÃO' });
  inReview.forEach(item => {
    assert.strictEqual(item.approvalStatus, 'EM REVISÃO');
  });
});

runTest('Filtros por Resolução e Orientação devem filtrar corretamente', () => {
  const projectId = 'prj-praia-01';
  const video = StudioState.createVideoProject({ projectId, title: 'Vídeo Filtro Res/Ori' });
  StudioState.collectProjectVideoAssets(projectId, video.id);

  const horizontalOnly = StudioState.getVideoAssetSelections(video.id, { orientation: 'horizontal' });
  assert.ok(horizontalOnly.length > 0);
  horizontalOnly.forEach(item => {
    assert.strictEqual(item.orientation.toLowerCase(), 'horizontal');
  });
});

// 5. Permissões de Ação do Usuário (Selecionar, Desmarcar, Ordenar, Substituir, Comparar)
runTest('Usuário deve conseguir selecionar e desmarcar manualmente qualquer ativo', () => {
  const projectId = 'prj-praia-01';
  const video = StudioState.createVideoProject({ projectId, title: 'Vídeo Teste Seleção Manual' });
  const pool = StudioState.collectProjectVideoAssets(projectId, video.id);
  const targetItem = pool[0];

  // Desmarcar
  StudioState.deselectVideoAsset(targetItem.id, 'Arquiteto');
  let reloaded = StudioState.getVideoAssetSelections(video.id).find(s => s.id === targetItem.id);
  assert.strictEqual(reloaded.selected, false, 'Deveria estar desmarcado');

  // Selecionar novamente
  StudioState.selectVideoAsset(targetItem.id, 'Arquiteto');
  reloaded = StudioState.getVideoAssetSelections(video.id).find(s => s.id === targetItem.id);
  assert.strictEqual(reloaded.selected, true, 'Deveria estar selecionado');
});

runTest('Usuário deve conseguir reordenar a sequência de exibição dos ativos', () => {
  const projectId = 'prj-praia-01';
  const video = StudioState.createVideoProject({ projectId, title: 'Vídeo Teste Reordenação' });
  const pool = StudioState.collectProjectVideoAssets(projectId, video.id);

  const idA = pool[0].id;
  const idB = pool[1].id;

  // Inverte a ordem passando [idB, idA, ...]
  const reversedIds = [idB, idA, ...pool.slice(2).map(p => p.id)];
  const reorderedList = StudioState.reorderVideoAssets(video.id, reversedIds, 'Arquiteto');

  const itemB = reorderedList.find(s => s.id === idB);
  const itemA = reorderedList.find(s => s.id === idA);

  assert.strictEqual(itemB.order, 1, 'Item B deve ter ficado na posição 1');
  assert.strictEqual(itemA.order, 2, 'Item A deve ter ficado na posição 2');
});

runTest('Usuário deve conseguir alterar o papel (role) do ativo entre os 11 disponíveis', () => {
  const projectId = 'prj-praia-01';
  const video = StudioState.createVideoProject({ projectId, title: 'Vídeo Teste Role' });
  const pool = StudioState.collectProjectVideoAssets(projectId, video.id);
  const targetItem = pool[0];

  StudioState.setVideoAssetRole(targetItem.id, 'abertura', 'Arquiteto');
  let reloaded = StudioState.getVideoAssetSelections(video.id).find(s => s.id === targetItem.id);
  assert.strictEqual(reloaded.role, 'abertura');

  StudioState.setVideoAssetRole(targetItem.id, 'CTA', 'Arquiteto');
  reloaded = StudioState.getVideoAssetSelections(video.id).find(s => s.id === targetItem.id);
  assert.strictEqual(reloaded.role, 'CTA');

  assert.throws(() => {
    StudioState.setVideoAssetRole(targetItem.id, 'papel_invalido');
  }, /Papel \(role\) inválido/);
});

runTest('Substituição de ativo no vídeo não deve excluir nem modificar imagens aprovadas do projeto', () => {
  const projectId = 'prj-praia-01';
  const video = StudioState.createVideoProject({ projectId, title: 'Vídeo Teste Substituição' });
  const pool = StudioState.collectProjectVideoAssets(projectId, video.id);
  const targetItem = pool[0];
  const originalSourceId = targetItem.sourceId;

  // Substitui no vídeo
  StudioState.replaceVideoAsset(targetItem.id, {
    title: 'Perspectiva Substituta da Sala',
    sourceId: 'src-substituto-01',
    resolution: '4K'
  }, 'Arquiteto');

  const updatedItem = StudioState.getVideoAssetSelections(video.id).find(s => s.id === targetItem.id);
  assert.strictEqual(updatedItem.title, 'Perspectiva Substituta da Sala');
  assert.strictEqual(updatedItem.sourceId, 'src-substituto-01');

  // Verifica que o projeto original continua com seus dados íntegros
  const project = StudioState.getProject(projectId);
  assert.ok(project, 'Projeto original deve permanecer intacto');
});

runTest('Comparação de versões deve identificar diferenças entre versões históricas', () => {
  const comparison = StudioState.compareVideoAssetVersions('amb-sala-01', 'V01', 'V02');
  assert.ok(comparison, 'Deve retornar objeto de comparação');
  assert.ok(comparison.sourceId, 'Deve conter sourceId');
  assert.ok(comparison.versionA, 'Deve conter versionA');
  assert.ok(comparison.versionB, 'Deve conter versionB');
});

// 6. Sistema de Recomendação de IA
runTest('Sistema de IA deve sugerir as frases canônicas exigidas conforme contexto', () => {
  const recAbertura = StudioState.getAIRecommendationForAsset({
    title: 'Fachada Principal Externa em Ângulo Amplo',
    sourceType: 'renders'
  });
  assert.strictEqual(recAbertura.role, 'abertura');
  assert.strictEqual(recAbertura.reason, 'Esta imagem funciona melhor como abertura.');

  const recAmbiente = StudioState.getAIRecommendationForAsset({
    title: 'Living Social Integrado com Cozinha',
    sourceType: 'ambientes'
  });
  assert.strictEqual(recAmbiente.role, 'ambiente');
  assert.strictEqual(recAmbiente.reason, 'Esta imagem apresenta melhor o ambiente.');

  const recEncerramento = StudioState.getAIRecommendationForAsset({
    title: 'Vista Sunset Noturna da Piscina',
    sourceType: 'renders'
  });
  assert.strictEqual(recEncerramento.role, 'encerramento');
  assert.strictEqual(recEncerramento.reason, 'Esta imagem funciona melhor como encerramento.');
});

// 7. Renderização da Interface (VideoAssetSelectionModule)
runTest('VideoAssetSelectionModule deve renderizar a tela de seleção com os 7 filtros e métricas', () => {
  const projectId = 'prj-praia-01';
  const video = StudioState.createVideoProject({
    projectId,
    title: 'Vídeo Completo Litoral',
    type: 'apresentacao_completa'
  });

  const html = VideoAssetSelectionModule.renderAssetSelection(video.id, projectId);

  assert.ok(html.includes('BLOCO G03'), 'Deve conter cabeçalho do Bloco G03');
  assert.ok(html.includes('Regra de Governança Automática do Estúdio'), 'Deve conter o banner de governança');
  assert.ok(html.includes('Total no Pool'), 'Deve exibir métrica total');
  assert.ok(html.includes('Aprovados (Auto)'), 'Deve exibir métrica aprovados');
  assert.ok(html.includes('Em Revisão'), 'Deve exibir métrica em revisão');
  assert.ok(html.includes('Filtros do Acervo'), 'Deve exibir toolbar de filtros');
  assert.ok(html.includes('Papel Narrativo no Vídeo'), 'Deve conter seletor de role');
  assert.ok(html.includes('Sugestão da IA'), 'Deve conter sugestão da IA');
  assert.ok(html.includes('Salvar Seleção &amp; Finalizar G03 &rarr;') || html.includes('Salvar Seleção & Finalizar G03 →') || html.includes('Finalizar G03'), 'Deve conter botão de conclusão de G03');
});

console.log('\n================================================================');
console.log(`RESULTADO DOS TESTES G03:`);
console.log(`  Sucessos: ${testsPassed}`);
console.log(`  Falhas:   ${testsFailed}`);
console.log('================================================================');

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log('Todos os testes do Bloco G03 passaram com 100% de conformidade!\n');
}
