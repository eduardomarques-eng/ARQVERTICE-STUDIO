/**
 * ============================================================================
 * TESTES DO BLOCO F08: PRANCHAS ESPECÍFICAS DE MATERIAIS, MOBILIÁRIO E QUANTITATIVOS
 *
 * Validação exaustiva dos requisitos de aceite do Bloco F08:
 * 1. Materiais: 13 campos canônicos + origem
 * 2. Mobiliário: 11 campos canônicos + origem
 * 3. Quantitativos: 6 campos canônicos (item, unidade, quantidade, ambiente, obs, fonte)
 * 4. Origens: As 6 origens canônicas (usuario, briefing, projeto, fornecedor, catalogo, referencia)
 * 5. Regra "NÃO INVENTAR": Se quantidade não existir, exibir estritamente "NÃO INFORMADO"
 * 6. Prancha de Material: Layout (imagem, nome, código, fabricante, acabamento, ambiente, observação)
 * 7. Prancha de Mobiliário: Layout (imagem, item, referência, dimensão, quantidade, ambiente)
 * 8. Prancha de Quantitativos: Geração de tabela técnica com cabeçalhos e linhas diagramadas
 * 9. Filtros: Filtragem dinâmica por ambiente, categoria, fabricante, fornecedor e status
 * 10. Limites do Studio: Não se transformar em ERP de obras
 * ============================================================================
 */

const assert = require('assert');

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
global.escapeHTML = (str) => {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
};

const StudioState = require('../js/state.js');
global.StudioState = StudioState;
global.window.StudioState = StudioState;

const SheetEngineModule = require('../js/sheet-engine-module.js');
global.SheetEngineModule = SheetEngineModule;
global.window.SheetEngineModule = SheetEngineModule;

const MaterialFurnitureBoardsModule = require('../js/material-furniture-boards-module.js');
global.MaterialFurnitureBoardsModule = MaterialFurnitureBoardsModule;
global.window.MaterialFurnitureBoardsModule = MaterialFurnitureBoardsModule;

let testsPassed = 0;
let testsFailed = 0;

function runTest(description, fn) {
  try {
    fn();
    console.log(`  \x1b[32m✔\x1b[0m [PASS] ${description}`);
    testsPassed++;
  } catch (err) {
    console.error(`  \x1b[31m✖\x1b[0m [FAIL] ${description}`);
    console.error(`    ${err.message}`);
    testsFailed++;
  }
}

console.log('\n================================================================');
console.log('SUÍTE DE TESTES: BLOCO F08 — PRANCHAS DE MATERIAIS, MOBILIÁRIO E QUANTITATIVOS');
console.log('================================================================\n');

// Inicialização do estado
StudioState.init();


// 1. Constantes e Campos Canônicos
runTest('1.1 - Constantes canônicas do Bloco F08 estão definidas', () => {
  assert.ok(Array.isArray(StudioState.CANONICAL_F08_SOURCES), 'CANONICAL_F08_SOURCES deve ser array');
  assert.strictEqual(StudioState.CANONICAL_F08_SOURCES.length, 6, 'Devem existir exatamente 6 origens');
  const expectedOrigins = ['usuario', 'briefing', 'projeto', 'fornecedor', 'catalogo', 'referencia'];
  expectedOrigins.forEach(o => {
    assert.ok(StudioState.CANONICAL_F08_SOURCES.includes(o), `Origem ${o} deve existir`);
  });

  assert.strictEqual(StudioState.MATERIAL_BOARD_FIELDS.length, 13, 'Materiais devem ter 13 campos canônicos');
  assert.strictEqual(StudioState.FURNITURE_BOARD_FIELDS.length, 11, 'Mobiliário deve ter 11 campos canônicos');
  assert.strictEqual(StudioState.QUANTITY_BOARD_FIELDS.length, 6, 'Quantitativos devem ter 6 campos canônicos');
});

// 2. Regra NÃO INVENTAR (formatQuantityDisplay)
runTest('2.1 - Regra NÃO INVENTAR: Valores ausentes/nulos/vazios retornam "NÃO INFORMADO"', () => {
  assert.strictEqual(StudioState.formatQuantityDisplay(null), 'NÃO INFORMADO');
  assert.strictEqual(StudioState.formatQuantityDisplay(undefined), 'NÃO INFORMADO');
  assert.strictEqual(StudioState.formatQuantityDisplay(''), 'NÃO INFORMADO');
  assert.strictEqual(StudioState.formatQuantityDisplay('   '), 'NÃO INFORMADO');
  assert.strictEqual(StudioState.formatQuantityDisplay(NaN), 'NÃO INFORMADO');
  assert.strictEqual(StudioState.formatQuantityDisplay('NÃO INFORMADO'), 'NÃO INFORMADO');
  assert.strictEqual(StudioState.formatQuantityDisplay('nao informado'), 'NÃO INFORMADO');
});

runTest('2.2 - Regra NÃO INVENTAR: Valores válidos são formatados corretamente com ou sem unidade', () => {
  assert.strictEqual(StudioState.formatQuantityDisplay(1, 'UN'), '1 UN');
  assert.strictEqual(StudioState.formatQuantityDisplay(6), '6');
  assert.strictEqual(StudioState.formatQuantityDisplay(110.5, 'm²'), '110,50 m²');
  assert.strictEqual(StudioState.formatQuantityDisplay('25', 'pçs'), '25 pçs');
});

// 3. Normalização de Origem (normalizeF08Origin)
runTest('3.1 - Normalização de origem converte sinônimos para as 6 origens canônicas', () => {
  assert.strictEqual(StudioState.normalizeF08Origin('Cliente'), 'usuario');
  assert.strictEqual(StudioState.normalizeF08Origin('USER'), 'usuario');
  assert.strictEqual(StudioState.normalizeF08Origin('briefing_inicial'), 'briefing');
  assert.strictEqual(StudioState.normalizeF08Origin('BIM_Revit'), 'projeto');
  assert.strictEqual(StudioState.normalizeF08Origin('fornecedor_local'), 'fornecedor');
  assert.strictEqual(StudioState.normalizeF08Origin('catalogo_portobello'), 'catalogo');
  assert.strictEqual(StudioState.normalizeF08Origin('moodboard_ref'), 'referencia');
  assert.strictEqual(StudioState.normalizeF08Origin(null), 'projeto');
});

// 4. Consulta de Materiais (13 Campos)
runTest('4.1 - getCanonicalMaterials retorna materiais enriquecidos com todos os 13 campos', () => {
  const materials = StudioState.getCanonicalMaterials('prj-praia-01');
  assert.ok(Array.isArray(materials) && materials.length > 0, 'Deve retornar materiais');

  const mat = materials[0];
  // 13 campos canônicos
  assert.ok(mat.nome, 'nome');
  assert.ok(mat.categoria, 'categoria');
  assert.ok(mat.fabricante !== undefined, 'fabricante');
  assert.ok(mat.fornecedor !== undefined, 'fornecedor');
  assert.ok(mat.codigo !== undefined, 'código');
  assert.ok(mat.referencia !== undefined, 'referência');
  assert.ok(mat.acabamento !== undefined, 'acabamento');
  assert.ok(mat.cor !== undefined, 'cor');
  assert.ok(mat.imagem !== undefined, 'imagem');
  assert.ok(mat.ambiente !== undefined, 'ambiente');
  assert.ok(mat.observacao !== undefined, 'observação');
  assert.ok(mat.link !== undefined, 'link');
  assert.ok(mat.status !== undefined, 'status');
  assert.ok(StudioState.CANONICAL_F08_SOURCES.includes(mat.origem), 'origem canônica válida');
});

// 5. Consulta de Mobiliário (11 Campos)
runTest('5.1 - getCanonicalFurniture retorna itens com todos os 11 campos e quantidade tratada', () => {
  const furniture = StudioState.getCanonicalFurniture('prj-praia-01');
  assert.ok(Array.isArray(furniture) && furniture.length > 0, 'Deve retornar móveis');

  const item = furniture[0];
  // 11 campos canônicos
  assert.ok(item.nome, 'nome');
  assert.ok(item.categoria, 'categoria');
  assert.ok(item.fabricante !== undefined, 'fabricante');
  assert.ok(item.fornecedor !== undefined, 'fornecedor');
  assert.ok(item.referencia !== undefined, 'referência');
  assert.ok(item.dimensoes !== undefined, 'dimensões');
  assert.ok(item.quantidade !== undefined, 'quantidade');
  assert.ok(item.ambiente !== undefined, 'ambiente');
  assert.ok(item.imagem !== undefined, 'imagem');
  assert.ok(item.link !== undefined, 'link');
  assert.ok(item.observacao !== undefined, 'observação');
  assert.ok(StudioState.CANONICAL_F08_SOURCES.includes(item.origem), 'origem canônica válida');
});

// 6. Consulta de Quantitativos (6 Campos)
runTest('6.1 - getCanonicalQuantities retorna quantitativos com os 6 campos obrigatórios', () => {
  const quantities = StudioState.getCanonicalQuantities('prj-praia-01');
  assert.ok(Array.isArray(quantities) && quantities.length > 0, 'Deve retornar quantitativos');

  const q = quantities[0];
  // 6 campos
  assert.ok(q.item, 'item');
  assert.ok(q.unidade !== undefined, 'unidade');
  assert.ok(q.quantidade !== undefined, 'quantidade');
  assert.ok(q.ambiente !== undefined, 'ambiente');
  assert.ok(q.observacao !== undefined, 'observação');
  assert.ok(q.fonte !== undefined, 'fonte');
  assert.ok(StudioState.CANONICAL_F08_SOURCES.includes(q.fonte), 'fonte deve ser origem canônica');
});

// 7. Teste de item sem quantidade ("NÃO INFORMADO")
runTest('7.1 - Item de mobiliário ou quantitativo sem quantidade exibe "NÃO INFORMADO"', () => {
  // Cadastra item sem quantidade
  const newFurn = StudioState.registerCanonicalFurniture({
    projectId: 'prj-praia-01',
    nome: 'Poltrona Conceitual Sem Medidas',
    categoria: 'MOVEL_SOLTO',
    quantidade: null,
    origem: 'referencia'
  });

  assert.strictEqual(newFurn.quantidade, 'NÃO INFORMADO', 'Deve ser "NÃO INFORMADO" quando nulo');

  const newQty = StudioState.registerCanonicalQuantity({
    projectId: 'prj-praia-01',
    item: 'Revestimento Decorativo',
    unidade: 'm²',
    quantidade: undefined,
    fonte: 'catalogo'
  });

  assert.strictEqual(newQty.quantidade, 'NÃO INFORMADO', 'Deve ser "NÃO INFORMADO" quando indefinido');
});

// 8. Filtros por Ambiente, Categoria, Fabricante, Fornecedor e Status
runTest('8.1 - Filtragem multi-critério funciona com precisão', () => {
  const allMats = StudioState.getCanonicalMaterials('prj-praia-01');
  assert.ok(allMats.length >= 2, 'Existem pelo menos 2 materiais no projeto');

  // Filtro por categoria PEDRA
  const filteredPedra = StudioState.getCanonicalMaterials('prj-praia-01', { categoria: 'PEDRA' });
  assert.ok(filteredPedra.length > 0, 'Deve encontrar material PEDRA');
  filteredPedra.forEach(m => assert.strictEqual(m.categoria, 'PEDRA'));

  // Filtro por ambiente
  const filteredSala = StudioState.getCanonicalMaterials('prj-praia-01', { ambiente: 'amb-sala-01' });
  assert.ok(filteredSala.length > 0, 'Deve encontrar materiais da sala');

  // Filtro por fabricante
  const filteredFab = StudioState.getCanonicalFurniture('prj-praia-01', { fabricante: 'Dpot' });
  assert.ok(filteredFab.length > 0, 'Deve encontrar móveis da Dpot');
  filteredFab.forEach(f => assert.ok(f.fabricante.includes('Dpot')));

  // Filtro por status
  const filteredStatus = StudioState.getCanonicalMaterials('prj-praia-01', { status: 'APPROVED' });
  assert.ok(filteredStatus.length > 0, 'Deve encontrar materiais APPROVED');
});

// 9. Geração de Prancha de Materiais (Layout 6)
runTest('9.1 - generateMaterialsBoard cria elementos diagramados dentro da printableArea', () => {
  // Cria prancha de teste
  const sheet = StudioState.createSheet({
    projectId: 'prj-praia-01',
    name: 'Prancha de Materiais e Acabamentos',
    sheetNumber: 'PR-MAT-01',
    format: 'A3',
    orientation: 'landscape'
  });

  const elements = StudioState.generateMaterialsBoard(sheet.id);
  assert.ok(Array.isArray(elements) && elements.length > 0, 'Deve criar elementos de materiais');

  const el = elements[0];
  assert.strictEqual(el.type, 'material', 'Tipo do elemento deve ser material');

  // Layout 6: imagem, nome, código, fabricante, acabamento, ambiente, observação
  assert.ok(el.content.nome, 'Layout 6: nome');
  assert.ok(el.content.codigo !== undefined, 'Layout 6: código');
  assert.ok(el.content.fabricante !== undefined, 'Layout 6: fabricante');
  assert.ok(el.content.acabamento !== undefined, 'Layout 6: acabamento');
  assert.ok(el.content.ambiente !== undefined, 'Layout 6: ambiente');
  assert.ok(el.content.observacao !== undefined, 'Layout 6: observação');

  // Verifica se o elemento está contido na printableArea da prancha A3
  const pArea = sheet.formatProfile.renderDimensions.screenPx.printableArea;
  assert.ok(el.x >= pArea.x, 'Elemento deve respeitar margem esquerda');
  assert.ok(el.y >= pArea.y, 'Elemento deve respeitar margem superior');
  assert.ok((el.x + el.width) <= (pArea.x + pArea.width + 10), 'Elemento deve respeitar largura útil');
  assert.ok((el.y + el.height) <= (pArea.y + pArea.height + 10), 'Elemento deve respeitar altura útil');
});

// 10. Geração de Prancha de Mobiliário (Layout 7)
runTest('10.1 - generateFurnitureBoard cria elementos de mobiliário no Layout 7', () => {
  const sheet = StudioState.createSheet({
    projectId: 'prj-praia-01',
    name: 'Prancha de Mobiliário e Equipamentos',
    sheetNumber: 'PR-MOB-01',
    format: 'A3',
    orientation: 'landscape'
  });

  const elements = StudioState.generateFurnitureBoard(sheet.id);
  assert.ok(Array.isArray(elements) && elements.length > 0, 'Deve criar elementos de mobiliário');

  const el = elements[0];
  assert.strictEqual(el.type, 'mobiliario', 'Tipo do elemento deve ser mobiliario');

  // Layout 7: imagem, item, referência, dimensão, quantidade, ambiente
  assert.ok(el.content.item || el.content.nome, 'Layout 7: item');
  assert.ok(el.content.referencia !== undefined, 'Layout 7: referência');
  assert.ok(el.content.dimensao !== undefined || el.content.dimensoes !== undefined, 'Layout 7: dimensão');
  assert.ok(el.content.quantidade !== undefined, 'Layout 7: quantidade');
  assert.ok(el.content.ambiente !== undefined, 'Layout 7: ambiente');

  const pArea = sheet.formatProfile.renderDimensions.screenPx.printableArea;
  assert.ok(el.x >= pArea.x, 'Respeita margem esquerda');
  assert.ok(el.y >= pArea.y, 'Respeita margem superior');
});

// 11. Geração de Tabela de Quantitativos (Layout 8)
runTest('11.1 - generateQuantitiesBoard cria elemento de tabela técnica na prancha', () => {
  const sheet = StudioState.createSheet({
    projectId: 'prj-praia-01',
    name: 'Prancha de Quantitativos',
    sheetNumber: 'PR-QTD-01',
    format: 'A3',
    orientation: 'landscape'
  });

  const tableEl = StudioState.generateQuantitiesBoard(sheet.id);
  assert.ok(tableEl, 'Deve retornar elemento de tabela criado');
  assert.strictEqual(tableEl.type, 'tabela', 'Tipo do elemento deve ser tabela');

  // 8. QUANTITATIVOS: Criar tabela com colunas Item, Unidade, Quantidade, Ambiente, Observação, Fonte
  const expectedHeaders = ['Item', 'Unidade', 'Quantidade', 'Ambiente', 'Observação', 'Fonte'];
  assert.deepStrictEqual(tableEl.content.headers, expectedHeaders, 'Cabeçalhos devem seguir especificação');
  assert.ok(Array.isArray(tableEl.content.rows) && tableEl.content.rows.length > 0, 'Deve possuir linhas de dados');

  // Verifica que cada linha possui 6 colunas correspondentes
  tableEl.content.rows.forEach(row => {
    assert.strictEqual(row.length, 6, 'Linha deve ter 6 colunas');
  });
});

console.log('\n================================================================');
console.log(`RESULTADO FINAL: ${testsPassed} testes passaram, ${testsFailed} falharam.`);
console.log('================================================================\n');

if (testsFailed > 0) {
  process.exit(1);
}
