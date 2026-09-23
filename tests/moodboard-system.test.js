/**
 * ============================================================================
 * SUÍTE DE TESTES: BLOCO E04 — SISTEMA DE MOODBOARDS VISUAL E TÉCNICO
 * Validação rigorosa dos 16 critérios de aceite da especificação E04
 * ============================================================================
 */

const assert = require('assert');

// Mocking ambiente de navegador antes de carregar StudioState
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
  addEventListener: () => {}
};

const StudioState = require('../js/state.js');
global.StudioState = StudioState;
global.window.StudioState = StudioState;
const MoodboardSystemModule = require('../js/moodboard-system-module.js');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

console.log('====================================================================');
console.log('ARQVERTICE STUDIO — SUÍTE DE TESTES E04 (MOODBOARDS)');
console.log('====================================================================');

// Inicialização do Estado
StudioState.init();

// Mock rápido de projeto e ambiente para testes
const testProject = {
  id: 'proj-test-e04',
  name: 'Residência Teste E04',
  typology: 'Residencial Unifamiliar'
};
if (!StudioState.data.projects) StudioState.data.projects = [];
StudioState.data.projects.push(testProject);

const testEnv = {
  id: 'env-living-test',
  projectId: testProject.id,
  name: 'Living Integrado',
  areaM2: 45.5
};
if (!StudioState.data.environments) StudioState.data.environments = [];
StudioState.data.environments.push(testEnv);

// 1. Moodboard por Ambiente
test('1. Deve criar e consultar moodboard por ambiente', () => {
  const mb = StudioState.createMoodboard({
    projectId: testProject.id,
    environmentId: testEnv.id,
    title: 'Moodboard Living E04',
    type: StudioState.MOODBOARD_TYPES.ENVIRONMENT
  });

  assert.ok(mb, 'Moodboard criado com sucesso');
  assert.strictEqual(mb.type, 'MOODBOARD_ENVIRONMENT');
  assert.strictEqual(mb.environmentId, testEnv.id);
  assert.strictEqual(mb.version, 'V01');
  assert.strictEqual(mb.status, 'DRAFT');

  const envBoards = StudioState.getEnvironmentMoodboards(testProject.id, testEnv.id);
  assert.ok(envBoards.length >= 1, 'Deve retornar ao menos um moodboard para o ambiente');
});

// 2. Moodboard Global do Projeto
test('2. Deve permitir criação e consulta de moodboard global do projeto', () => {
  const mbGlobal = StudioState.createMoodboard({
    projectId: testProject.id,
    environmentId: null,
    title: 'Moodboard Global da Obra',
    type: StudioState.MOODBOARD_TYPES.PROJECT
  });

  assert.ok(mbGlobal, 'Moodboard global criado');
  assert.strictEqual(mbGlobal.type, 'MOODBOARD_PROJECT');
  assert.strictEqual(mbGlobal.environmentId, null);

  const projBoards = StudioState.getProjectMoodboards(testProject.id);
  assert.ok(projBoards.length >= 2, 'Deve listar todos os moodboards do projeto');
});

// 3. Cartão de Material e Especificações
test('3. Deve suportar itens do tipo MATERIAL com seus dados de especificação', () => {
  const boards = StudioState.getEnvironmentMoodboards(testProject.id, testEnv.id);
  const mbId = boards[0].id;

  const matItem = StudioState.addMoodboardItem(mbId, {
    itemType: StudioState.MOODBOARD_ITEM_TYPES.MATERIAL,
    title: 'Travertino Navona Levigado',
    category: 'PEDRA',
    product: 'Placa Especial',
    manufacturer: 'Pedras Nobres',
    commercialCode: 'TRV-NAV-01',
    finish: 'Levigado Escovado',
    dimensions: '120 x 120 x 2 cm',
    supplier: 'Marmoraria Vertice',
    gridWidth: 'THIRD',
    cardSize: 'MEDIUM'
  });

  assert.strictEqual(matItem.itemType, 'MATERIAL');
  assert.strictEqual(matItem.commercialCode, 'TRV-NAV-01');

  const enriched = StudioState.getMoodboard(mbId);
  const found = enriched.items.find(i => i.id === matItem.id);
  assert.ok(found, 'Item material deve estar presente no moodboard enriquecido');
  assert.strictEqual(found.product, 'Placa Especial');
});

// 4. Cartão de Mobiliário
test('4. Deve suportar itens do tipo FURNITURE com medidas e fabricante', () => {
  const boards = StudioState.getEnvironmentMoodboards(testProject.id, testEnv.id);
  const mbId = boards[0].id;

  const furnItem = StudioState.addMoodboardItem(mbId, {
    itemType: StudioState.MOODBOARD_ITEM_TYPES.FURNITURE,
    title: 'Sofá Modular Orgânico',
    category: 'ESTOFADO',
    manufacturer: 'Dpot Arquitetura',
    model: 'Linha Terra',
    dimensions: '340 x 115 x 75 cm',
    quantity: 1,
    supplier: 'Mobiliário Design SP',
    gridWidth: 'HALF',
    cardSize: 'LARGE'
  });

  assert.strictEqual(furnItem.itemType, 'FURNITURE');
  assert.strictEqual(furnItem.dimensions, '340 x 115 x 75 cm');

  const enriched = StudioState.getMoodboard(mbId);
  const found = enriched.items.find(i => i.id === furnItem.id);
  assert.ok(found, 'Item de mobiliário deve estar presente');
  assert.strictEqual(found.quantity, 1);
});

// 5. Paleta de Cores
test('5. Deve permitir configurar paleta de cores (hex, nome, código, uso)', () => {
  const boards = StudioState.getEnvironmentMoodboards(testProject.id, testEnv.id);
  const mbId = boards[0].id;

  const palette = [
    { name: 'Nude Seda', hex: '#EDE8E1', code: 'SW 7004', usage: 'Paredes' },
    { name: 'Nogueira Natural', hex: '#634735', code: 'Pantone 7519 C', usage: 'Painel Marcenaria' }
  ];

  const updated = StudioState.updateMoodboard(mbId, { colorPalette: palette });
  assert.strictEqual(updated.colorPalette.length, 2);
  assert.strictEqual(updated.colorPalette[0].hex, '#EDE8E1');
});

// 6. Destaque de Render Aprovado
test('6. Deve suportar bloco RENDER destacado como imagem principal', () => {
  const boards = StudioState.getEnvironmentMoodboards(testProject.id, testEnv.id);
  const mbId = boards[0].id;

  const renderItem = StudioState.addMoodboardItem(mbId, {
    itemType: StudioState.MOODBOARD_ITEM_TYPES.RENDER,
    title: 'Perspectiva Principal do Living',
    imageUrl: 'assets/renders/living_hero.jpg',
    isFeatured: true,
    gridWidth: 'FULL',
    cardSize: 'HERO'
  });

  assert.strictEqual(renderItem.itemType, 'RENDER');
  assert.strictEqual(renderItem.isFeatured, true);
  assert.strictEqual(renderItem.cardSize, 'HERO');
});

// 7. Integração de Quantitativos
test('7. Deve suportar bloco de quantitativo numérico (QUANTITY)', () => {
  const boards = StudioState.getEnvironmentMoodboards(testProject.id, testEnv.id);
  const mbId = boards[0].id;

  const qtyItem = StudioState.addMoodboardItem(mbId, {
    itemType: StudioState.MOODBOARD_ITEM_TYPES.QUANTITY,
    title: 'Área Total de Piso Travertino',
    quantity: 45.5,
    unit: 'm²',
    gridWidth: 'THIRD'
  });

  assert.strictEqual(qtyItem.itemType, 'QUANTITY');
  assert.strictEqual(qtyItem.quantity, 45.5);
  assert.strictEqual(qtyItem.unit, 'm²');
});

// 8. Fichas e Bloqueio de Inventar Informações (Campos nulos preservados)
test('8. Não deve preencher lacunas inventando informação em cartões', () => {
  const boards = StudioState.getEnvironmentMoodboards(testProject.id, testEnv.id);
  const mbId = boards[0].id;

  const sparseItem = StudioState.addMoodboardItem(mbId, {
    itemType: 'MATERIAL',
    title: 'Pintura Acrílica Fosca',
    category: 'PINTURA'
    // Sem fabricante, dimensões ou código comercial
  });

  assert.strictEqual(sparseItem.manufacturer, null);
  assert.strictEqual(sparseItem.commercialCode, null);
  assert.strictEqual(sparseItem.dimensions, null);
});

// 9. Layout em Blocos e Reordenação
test('9. Deve reordenar blocos do layout mantendo sortOrder consistente', () => {
  const boards = StudioState.getEnvironmentMoodboards(testProject.id, testEnv.id);
  const mbId = boards[0].id;

  const before = StudioState.getMoodboard(mbId);
  const ids = before.items.map(i => i.id);
  assert.ok(ids.length >= 3, 'Deve haver ao menos 3 itens para reordenar');

  const reversedIds = [...ids].reverse();
  StudioState.reorderMoodboardItems(mbId, reversedIds);

  const after = StudioState.getMoodboard(mbId);
  assert.strictEqual(after.items[0].id, reversedIds[0], 'Primeiro item deve coincidir com nova ordem');
  assert.strictEqual(after.items[after.items.length - 1].id, reversedIds[reversedIds.length - 1]);
});

// 10. Formatos A4/A3/A2/A1
test('10. Deve suportar formatos físicos A4, A3, A2 e A1', () => {
  const boards = StudioState.getEnvironmentMoodboards(testProject.id, testEnv.id);
  const mbId = boards[0].id;

  ['A4', 'A3', 'A2', 'A1'].forEach(fmt => {
    const updated = StudioState.updateMoodboard(mbId, { pageFormat: fmt });
    assert.strictEqual(updated.pageFormat, fmt);
  });
});

// 11. Orientação Retrato e Paisagem
test('11. Deve suportar orientações LANDSCAPE e PORTRAIT', () => {
  const boards = StudioState.getEnvironmentMoodboards(testProject.id, testEnv.id);
  const mbId = boards[0].id;

  const landscape = StudioState.updateMoodboard(mbId, { orientation: 'LANDSCAPE' });
  assert.strictEqual(landscape.orientation, 'LANDSCAPE');

  const portrait = StudioState.updateMoodboard(mbId, { orientation: 'PORTRAIT' });
  assert.strictEqual(portrait.orientation, 'PORTRAIT');
});

// 12. Identidade ArqVértice e Tipografia Centralizada
test('12. Deve aplicar identidade ArqVértice e temas tipográficos centrais', () => {
  const boards = StudioState.getEnvironmentMoodboards(testProject.id, testEnv.id);
  const mbId = boards[0].id;

  const updated = StudioState.updateMoodboard(mbId, {
    showLogo: true,
    showHeader: true,
    showFooter: true,
    typographyTheme: StudioState.MOODBOARD_TYPOGRAPHY_THEMES.ELEGANT_SERIF
  });

  assert.strictEqual(updated.showLogo, true);
  assert.strictEqual(updated.typographyTheme, 'ELEGANT_SERIF');
});

// 13. Governança e Bloqueio de Edição em Versões Aprovadas
test('13. Não deve permitir edição silenciosa de versão aprovada (APPROVED)', () => {
  const boards = StudioState.getEnvironmentMoodboards(testProject.id, testEnv.id);
  const mbId = boards[0].id;

  // Aprovar o moodboard
  StudioState.approveMoodboard(mbId, 'Arquiteto Responsável', 'Aprovado em reunião executiva.');
  const approvedMb = StudioState.getMoodboard(mbId);
  assert.strictEqual(approvedMb.status, 'APPROVED');
  assert.strictEqual(approvedMb.isApproved, true);

  // Tentar atualizar campos deve lançar erro
  assert.throws(() => {
    StudioState.updateMoodboard(mbId, { title: 'Tentativa de Edição Silenciosa' });
  }, /Não é permitido editar silenciosamente um moodboard aprovado/);

  // Tentar adicionar item deve lançar erro
  assert.throws(() => {
    StudioState.addMoodboardItem(mbId, { title: 'Novo Item Não Permitido' });
  }, /Não é permitido adicionar itens a um moodboard aprovado/);
});

// 14. Versionamento Formal (V01 -> V02)
test('14. Deve gerar nova versão formal V02 preservando o histórico', () => {
  const boards = StudioState.getEnvironmentMoodboards(testProject.id, testEnv.id);
  const mbId = boards[0].id;

  const v2 = StudioState.versionMoodboard(mbId, { subtitle: 'Revisão com ajustes de acabamentos' });
  assert.strictEqual(v2.version, 'V02');
  assert.strictEqual(v2.versionNumber, 2);
  assert.strictEqual(v2.status, 'DRAFT');
  assert.strictEqual(v2.isApproved, false);

  // A versão original agora deve ser SUPERSEDED
  const original = StudioState.getMoodboard(mbId);
  assert.strictEqual(original.status, 'SUPERSEDED');

  // V02 deve herdar todos os itens da prancha anterior
  assert.strictEqual(v2.items.length, original.items.length);
});

// 15. Memória do Projeto e Contexto
test('15. Aprovação de Moodboard deve alimentar a memória do projeto (projectMemories)', () => {
  const boards = StudioState.getEnvironmentMoodboards(testProject.id, testEnv.id);
  const v2 = boards.find(m => m.version === 'V02');
  assert.ok(v2, 'V02 deve existir');

  StudioState.approveMoodboard(v2.id, 'Diretor de Projetos', 'Homologação final da V02.');

  const memories = StudioState.data.projectMemories.filter(m => m.projectId === testProject.id && m.category === 'MOODBOARD_APPROVED');
  assert.ok(memories.length >= 1, 'Memória do projeto deve ter registrado a aprovação formal');
});

// 16. Renderização HTML e Módulo de Interface
test('16. MoodboardSystemModule deve renderizar HTML válido sem falhas', () => {
  const boards = StudioState.getEnvironmentMoodboards(testProject.id, testEnv.id);
  const currentMb = boards[0];

  const html = MoodboardSystemModule.render(testEnv, testProject);
  assert.ok(html.includes('moodboard-system-container'), 'HTML deve conter o container raiz');
  assert.ok(html.includes('moodboard-sheet'), 'HTML deve conter a prancha de desenho');
  assert.ok(html.includes('ARQVÉRTICE'), 'HTML deve conter o branding ArqVértice');

  const projectHtml = MoodboardSystemModule.renderProjectMoodboards(testProject);
  assert.ok(projectHtml.includes('Moodboards Visuais e Técnicos do Projeto'), 'HTML de visão geral do projeto deve renderizar');
});

console.log('====================================================================');
console.log(`TOTAL DE TESTES E04: ${totalTests} | APROVADOS: ${passedTests} | FALHAS: ${totalTests - passedTests}`);
console.log('====================================================================');

if (passedTests === totalTests) {
  console.log('>>> TODOS OS 16 CRITÉRIOS DE ACEITE DO BLOCO E04 FORAM HOMOLOGADOS COM SUCESSO! <<<');
  process.exit(0);
} else {
  console.error('>>> FALHA NA SUÍTE DE TESTES E04 <<<');
  process.exit(1);
}
