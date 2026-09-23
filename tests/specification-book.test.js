/**
 * ============================================================================
 * SUÍTE DE TESTES: BLOCO E05 — CADERNO DE ESPECIFICAÇÕES, LISTAS E FICHAS
 * Validação rigorosa dos critérios de aceite da especificação E05
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

// Carrega função auxiliar escapeHTML usada pelo módulo de UI
global.escapeHTML = (str) => {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
};
global.formatDateBR = (isoStr) => {
  try { return new Date(isoStr).toLocaleDateString('pt-BR'); } catch(e) { return isoStr; }
};

const SpecificationBookModule = require('../js/specification-book-module.js');

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
console.log('ARQVERTICE STUDIO — SUÍTE DE TESTES E05 (CADERNO DE ESPECIFICAÇÕES)');
console.log('====================================================================');

// Inicialização do Estado
StudioState.init();

// Mock de projeto e ambiente para testes
const testProject = {
  id: 'proj-test-e05',
  name: 'Residência Teste E05',
  typology: 'Residencial Unifamiliar',
  stages: [
    { key: 'especificacoes', label: 'Especificações', status: 'disponivel' }
  ]
};
if (!Array.isArray(StudioState.data.projects)) StudioState.data.projects = [];
StudioState.data.projects.push(testProject);

const testEnv = {
  id: 'env-sala-e05',
  projectId: testProject.id,
  name: 'Sala de Estar E05',
  areaM2: 38.5
};
if (!Array.isArray(StudioState.data.environments)) StudioState.data.environments = [];
StudioState.data.environments.push(testEnv);

// Mock de dados E01 (Móveis)
if (!Array.isArray(StudioState.data.furnitureItems)) StudioState.data.furnitureItems = [];
StudioState.data.furnitureItems.push({
  id: 'furn-e05-01',
  projectId: testProject.id,
  environmentId: testEnv.id,
  name: 'Sofá Modular L',
  model: 'Sofá Modular Linhares',
  category: 'ESTOFADO',
  manufacturer: 'Breton',
  supplier: 'Casapronta',
  code: 'BRT-SML-001',
  finish: 'Couro Natural Bege',
  width: 280, depth: 100, height: 85, dimensionUnit: 'CM',
  quantity: 1, quantityUnit: 'UN',
  status: 'APPROVED',
  url: 'https://breton.com.br/sofa-modular'
});
StudioState.data.furnitureItems.push({
  id: 'furn-e05-02',
  projectId: testProject.id,
  environmentId: testEnv.id,
  name: 'Luminária Pendente Sfera',
  category: 'ILUMINACAO',
  manufacturer: 'Lumini',
  supplier: 'Lumiere',
  code: 'LMN-SPH-003',
  finish: 'Dourado Escovado',
  quantity: 3, quantityUnit: 'UN',
  status: 'DRAFT',
  isAiSuggestion: true
});

// Mock de dados E02 (Materiais)
if (!Array.isArray(StudioState.data.projectMaterials)) StudioState.data.projectMaterials = [];
StudioState.data.projectMaterials.push({
  id: 'mat-e05-01',
  projectId: testProject.id,
  environmentId: testEnv.id,
  name: 'Porcelanato Travertino Romano',
  category: 'REVESTIMENTO_PISO',
  manufacturer: 'Portobello',
  commercialCode: 'PTB-TRV-120',
  finish: 'Polido',
  dimensions: '120 x 120 CM',
  quantityValue: 38.5,
  quantityUnit: 'M2',
  status: 'APPROVED'
});

// Mock de dados E03 (Quantitativos)
if (!Array.isArray(StudioState.data.projectQuantities)) StudioState.data.projectQuantities = [];
StudioState.data.projectQuantities.push({
  id: 'qty-e05-01',
  projectId: testProject.id,
  environmentId: testEnv.id,
  category: 'PISO',
  itemName: 'Porcelanato Travertino (Piso Sala)',
  baseQuantity: 38.5,
  finalQuantity: 42.35,
  unit: 'M2',
  lossPercentage: 10,
  formulaText: 'Área x (1 + 0.10)',
  originType: 'CALCULATED',
  status: 'ACTIVE'
});

// ==========================================================================
// TESTES
// ==========================================================================

// 1. Criação de Caderno de Especificações por Ambiente
test('1. Deve criar caderno de especificações por ambiente', () => {
  const book = StudioState.createSpecificationBook({
    projectId: testProject.id,
    environmentId: testEnv.id,
    docType: 'CADERNO_GERAL',
    title: 'Caderno de Especificações — Sala de Estar E05'
  });

  assert.ok(book, 'Caderno criado com sucesso');
  assert.ok(book.id, 'Possui ID gerado');
  assert.strictEqual(book.projectId, testProject.id);
  assert.strictEqual(book.environmentId, testEnv.id);
  assert.strictEqual(book.version, 'V01');
  assert.strictEqual(book.status, 'DRAFT');
  assert.strictEqual(book.isApproved, false);
});

// 2. Criação de Caderno Geral do Projeto (sem environmentId)
test('2. Deve criar caderno geral do projeto (escopo obra inteira)', () => {
  const book = StudioState.createSpecificationBook({
    projectId: testProject.id,
    docType: 'CADERNO_GERAL',
    title: 'Caderno Geral — Projeto Residência E05'
  });

  assert.ok(book, 'Caderno geral criado');
  assert.strictEqual(book.environmentId, null, 'Sem vínculo de ambiente');
  assert.strictEqual(book.docType, 'CADERNO_GERAL');
});

// 3. Constantes de tipos de documentos
test('3. Deve disponibilizar os 8 tipos de documentos canônicos', () => {
  const types = StudioState.SPECIFICATION_DOC_TYPES;
  assert.ok(types, 'SPECIFICATION_DOC_TYPES existe');
  assert.strictEqual(types.ALL.length, 8, 'Exatamente 8 tipos disponíveis');
  assert.ok(types.ALL.includes('LISTA_MOVEIS'));
  assert.ok(types.ALL.includes('LISTA_MATERIAIS'));
  assert.ok(types.ALL.includes('QUANTITATIVO'));
  assert.ok(types.ALL.includes('LISTA_EQUIPAMENTOS'));
  assert.ok(types.ALL.includes('LISTA_ILUMINACAO'));
  assert.ok(types.ALL.includes('LISTA_FORNECEDORES'));
  assert.ok(types.ALL.includes('LISTA_PRODUTOS'));
  assert.ok(types.ALL.includes('CADERNO_GERAL'));
});

// 4. Constantes de rastreabilidade de origem
test('4. Deve rastrear origem de dados (CONFIRMADO, CALCULADO, ESTIMADO, SUGERIDO)', () => {
  const origins = StudioState.SPECIFICATION_ORIGINS;
  assert.ok(origins, 'SPECIFICATION_ORIGINS existe');
  assert.strictEqual(origins.ALL.length, 4, '4 tipos de origem');
  assert.strictEqual(origins.CONFIRMADO, 'CONFIRMADO');
  assert.strictEqual(origins.CALCULADO, 'CALCULADO');
  assert.strictEqual(origins.ESTIMADO, 'ESTIMADO');
  assert.strictEqual(origins.SUGERIDO, 'SUGERIDO');
});

// 5. Adição de entradas com rastreabilidade de origem
test('5. Deve adicionar entrada com rastreabilidade de origem rigorosa', () => {
  const books = StudioState.getEnvironmentSpecificationBooks(testProject.id, testEnv.id);
  const book = books[0];

  const entry = StudioState.addSpecificationEntry(book.id, {
    category: 'ESTOFADO',
    itemName: 'Sofá Modular L',
    productName: 'Sofá Modular Linhares',
    manufacturerName: 'Breton',
    supplierName: 'Casapronta',
    commercialCode: 'BRT-SML-001',
    finish: 'Couro Natural Bege',
    dimensions: '280 x 100 x 85 CM',
    quantity: 1,
    unit: 'UN',
    origin: 'CONFIRMADO',
    furnitureId: 'furn-e05-01'
  });

  assert.ok(entry, 'Entrada criada');
  assert.strictEqual(entry.origin, 'CONFIRMADO', 'Origem rastreada corretamente');
  assert.strictEqual(entry.furnitureId, 'furn-e05-01', 'Vínculo com E01');
  assert.strictEqual(entry.specificationBookId, book.id, 'Vínculo com caderno');
});

// 6. Enriquecimento de caderno com entradas e agrupamentos
test('6. Deve enriquecer caderno com agrupamento por categoria, ambiente e fornecedor', () => {
  const books = StudioState.getEnvironmentSpecificationBooks(testProject.id, testEnv.id);
  const book = books[0];

  assert.ok(book.entries, 'Tem array de entries');
  assert.ok(book.entries.length > 0, 'Tem entradas');
  assert.ok(book.byCategory, 'Agrupado por categoria');
  assert.ok(book.byEnvironment, 'Agrupado por ambiente');
  assert.ok(book.bySupplier, 'Agrupado por fornecedor');
});

// 7. Histórico de criação registrado automaticamente
test('7. Deve registrar histórico de criação automaticamente', () => {
  const books = StudioState.getEnvironmentSpecificationBooks(testProject.id, testEnv.id);
  const book = books[0];

  assert.ok(book.history, 'Histórico presente');
  assert.ok(book.history.length > 0, 'Pelo menos 1 entrada no histórico');
  const created = book.history.find(h => h.action === 'CREATED');
  assert.ok(created, 'Ação CREATED registrada');
});

// 8. Atualização de caderno DRAFT
test('8. Deve permitir atualização de caderno em rascunho (DRAFT)', () => {
  const books = StudioState.getEnvironmentSpecificationBooks(testProject.id, testEnv.id);
  const book = books[0];

  const updated = StudioState.updateSpecificationBook(book.id, {
    title: 'Caderno Atualizado — Sala de Estar E05',
    notes: 'Revisão de projeto finalizada'
  });

  assert.strictEqual(updated.title, 'Caderno Atualizado — Sala de Estar E05');
  assert.strictEqual(updated.notes, 'Revisão de projeto finalizada');
  const histUpdate = updated.history.find(h => h.action === 'UPDATED');
  assert.ok(histUpdate, 'Ação UPDATED registrada');
});

// 9. Aprovação formal do caderno com memória de projeto
test('9. Deve aprovar caderno formalmente e alimentar memória do projeto', () => {
  const books = StudioState.getEnvironmentSpecificationBooks(testProject.id, testEnv.id);
  const book = books[0];
  const memoryCountBefore = (StudioState.data.projectMemories || []).length;

  const approved = StudioState.approveSpecificationBook(book.id, 'Arq. Erick', 'Aprovado sem ressalvas');

  assert.strictEqual(approved.status, 'APPROVED');
  assert.strictEqual(approved.isApproved, true);
  assert.ok(approved.approvedAt, 'Data de aprovação registrada');
  assert.strictEqual(approved.approvedBy, 'Arq. Erick');

  const memoryCountAfter = (StudioState.data.projectMemories || []).length;
  assert.ok(memoryCountAfter > memoryCountBefore, 'Memória de projeto alimentada na aprovação');

  const approvedHist = approved.history.find(h => h.action === 'APPROVED');
  assert.ok(approvedHist, 'Ação APPROVED registrada no histórico');
});

// 10. Bloqueio de edição silenciosa em caderno aprovado
test('10. Não deve permitir edição silenciosa de caderno aprovado', () => {
  const books = StudioState.getEnvironmentSpecificationBooks(testProject.id, testEnv.id);
  const approved = books.find(b => b.status === 'APPROVED');

  let thrown = false;
  try {
    StudioState.updateSpecificationBook(approved.id, { title: 'Alteração proibida' });
  } catch (e) {
    thrown = true;
    assert.ok(e.message.includes('aprovado') || e.message.includes('APPROVED'), 'Erro menciona status aprovado');
  }
  assert.ok(thrown, 'Exceção lançada ao tentar editar caderno aprovado');
});

// 11. Bloqueio de adição de entradas em caderno aprovado
test('11. Não deve permitir adicionar entradas a caderno aprovado', () => {
  const books = StudioState.getEnvironmentSpecificationBooks(testProject.id, testEnv.id);
  const approved = books.find(b => b.status === 'APPROVED');

  let thrown = false;
  try {
    StudioState.addSpecificationEntry(approved.id, {
      itemName: 'Item proibido',
      category: 'TESTE'
    });
  } catch (e) {
    thrown = true;
  }
  assert.ok(thrown, 'Exceção lançada ao tentar adicionar entrada em caderno aprovado');
});

// 12. Versionamento formal (V01 → V02)
test('12. Deve criar nova versão V02 a partir de caderno aprovado', () => {
  const books = StudioState.getEnvironmentSpecificationBooks(testProject.id, testEnv.id);
  const approved = books.find(b => b.status === 'APPROVED');

  const v02 = StudioState.versionSpecificationBook(approved.id, {}, 'Arq. Erick');

  assert.ok(v02, 'Nova versão criada');
  assert.strictEqual(v02.version, 'V02', 'Versão incrementada');
  assert.strictEqual(v02.status, 'DRAFT', 'Nova versão é DRAFT');
  assert.strictEqual(v02.isApproved, false);

  // Verifica que a original ficou SUPERSEDED
  const originalRaw = StudioState._getRawSpecificationBook(approved.id);
  assert.strictEqual(originalRaw.status, 'SUPERSEDED', 'Versão anterior ficou SUPERSEDED');
});

// 13. Entradas clonadas no versionamento
test('13. Deve clonar entradas existentes na nova versão', () => {
  const books = StudioState.getEnvironmentSpecificationBooks(testProject.id, testEnv.id);
  const v02 = books.find(b => b.version === 'V02');
  
  assert.ok(v02, 'V02 encontrada');
  assert.ok(v02.entries.length > 0, 'V02 possui entradas clonadas');
});

// 14. Remoção de entradas
test('14. Deve permitir remoção de entradas em caderno DRAFT', () => {
  const books = StudioState.getEnvironmentSpecificationBooks(testProject.id, testEnv.id);
  const draft = books.find(b => b.status === 'DRAFT');

  const entryToRemove = draft.entries[0];
  const result = StudioState.removeSpecificationEntry(draft.id, entryToRemove.id);
  assert.ok(result, 'Entrada removida com sucesso');

  const refreshed = StudioState.getSpecificationBook(draft.id);
  assert.ok(!refreshed.entries.find(e => e.id === entryToRemove.id), 'Entrada não existe mais');
});

// 15. Geração automática (CADERNO_GERAL) agregando E01+E02+E03
test('15. Deve gerar caderno automático consolidando dados de E01, E02 e E03', () => {
  const auto = StudioState.generateSpecificationBook(
    testProject.id,
    testEnv.id,
    'CADERNO_GERAL',
    'ArqVértice Engine'
  );

  assert.ok(auto, 'Caderno automático gerado');
  assert.ok(auto.entries.length > 0, 'Possui entradas agregadas');

  // Verifica que há pelo menos uma entrada de cada fonte
  const hasFurniture = auto.entries.some(e => e.furnitureId);
  const hasMaterial = auto.entries.some(e => e.materialId);
  const hasQuantity = auto.entries.some(e => e.quantityId);

  assert.ok(hasFurniture, 'Inclui dados de E01 (Móveis)');
  assert.ok(hasMaterial, 'Inclui dados de E02 (Materiais)');
  assert.ok(hasQuantity, 'Inclui dados de E03 (Quantitativos)');
});

// 16. Mapeamento correto de origens na geração automática
test('16. Deve mapear origens corretamente na geração automática', () => {
  const books = StudioState.getEnvironmentSpecificationBooks(testProject.id, testEnv.id);
  const auto = books.find(b => b.title.includes('Caderno Geral'));

  // Sofá (APPROVED) → CONFIRMADO
  const sofa = auto.entries.find(e => e.itemName && e.itemName.includes('Sofá'));
  if (sofa) {
    assert.strictEqual(sofa.origin, 'CONFIRMADO', 'Sofá aprovado → CONFIRMADO');
  }

  // Luminária (DRAFT + AI) → SUGERIDO
  const luminaria = auto.entries.find(e => e.itemName && e.itemName.includes('Luminária'));
  if (luminaria) {
    assert.strictEqual(luminaria.origin, 'SUGERIDO', 'Luminária IA → SUGERIDO');
  }

  // Quantitativo (CALCULATED) → CALCULADO
  const qty = auto.entries.find(e => e.quantityId);
  if (qty) {
    assert.strictEqual(qty.origin, 'CALCULADO', 'Quantitativo calculado → CALCULADO');
  }
});

// 17. Exportação CSV com UTF-8 BOM
test('17. Deve exportar CSV com UTF-8 BOM e separador ponto-e-vírgula', () => {
  const books = StudioState.getEnvironmentSpecificationBooks(testProject.id, testEnv.id);
  const auto = books.find(b => b.entries && b.entries.length > 0 && b.status !== 'SUPERSEDED');

  const csv = StudioState.exportSpecificationBookToCsv(auto.id);

  assert.ok(csv, 'CSV gerado');
  assert.ok(csv.startsWith('\uFEFF'), 'Inicia com UTF-8 BOM');
  assert.ok(csv.includes('CATEGORIA'), 'Contém cabeçalho CATEGORIA');
  assert.ok(csv.includes('ORIGEM_DADO'), 'Contém cabeçalho ORIGEM_DADO');
  assert.ok(csv.includes(';'), 'Usa separador ponto-e-vírgula');
});

// 18. Exportação XLSX/XML tabular
test('18. Deve exportar XML tabular compatível com Excel', () => {
  const books = StudioState.getEnvironmentSpecificationBooks(testProject.id, testEnv.id);
  const auto = books.find(b => b.entries && b.entries.length > 0 && b.status !== 'SUPERSEDED');

  const xml = StudioState.exportSpecificationBookToXlsxXml(auto.id);

  assert.ok(xml, 'XML gerado');
  assert.ok(xml.includes('<?xml version="1.0"?>'), 'Cabeçalho XML');
  assert.ok(xml.includes('mso-application progid="Excel.Sheet"'), 'Compatível com Excel');
  assert.ok(xml.includes('<Workbook'), 'Contém Workbook');
  assert.ok(xml.includes('<Worksheet'), 'Contém Worksheet');
  assert.ok(xml.includes('<Row>'), 'Contém rows');
});

// 19. Geração de documento LISTA_MOVEIS (filtro por tipo)
test('19. Deve gerar documento LISTA_MOVEIS filtrando apenas móveis', () => {
  const lista = StudioState.generateSpecificationBook(
    testProject.id,
    testEnv.id,
    'LISTA_MOVEIS',
    'ArqVértice Engine'
  );

  assert.ok(lista, 'Lista de móveis gerada');
  assert.strictEqual(lista.docType, 'LISTA_MOVEIS');
  // Não deve incluir luminária (ILUMINACAO) nem equipamentos
  const hasLight = lista.entries.some(e => e.itemName && e.itemName.includes('Luminária'));
  assert.ok(!hasLight, 'Não inclui itens de iluminação na lista de móveis');
});

// 20. Geração de documento LISTA_ILUMINACAO (filtro por tipo)
test('20. Deve gerar documento LISTA_ILUMINACAO filtrando apenas iluminação', () => {
  const lista = StudioState.generateSpecificationBook(
    testProject.id,
    testEnv.id,
    'LISTA_ILUMINACAO',
    'ArqVértice Engine'
  );

  assert.ok(lista, 'Lista de iluminação gerada');
  assert.strictEqual(lista.docType, 'LISTA_ILUMINACAO');
  const hasLight = lista.entries.some(e => e.itemName && e.itemName.includes('Luminária'));
  assert.ok(hasLight, 'Inclui itens de iluminação');
  const hasSofa = lista.entries.some(e => e.itemName && e.itemName.includes('Sofá'));
  assert.ok(!hasSofa, 'Não inclui estofados na lista de iluminação');
});

// 21. Consulta por projeto (retorna todos os cadernos)
test('21. Deve consultar todos os cadernos do projeto', () => {
  const all = StudioState.getProjectSpecificationBooks(testProject.id);
  assert.ok(all.length >= 3, 'Ao menos 3 cadernos criados no projeto');
});

// 22. Consulta por ambiente
test('22. Deve consultar cadernos específicos de um ambiente', () => {
  const envBooks = StudioState.getEnvironmentSpecificationBooks(testProject.id, testEnv.id);
  assert.ok(envBooks.length >= 1, 'Ao menos 1 caderno por ambiente');
  envBooks.forEach(b => {
    assert.strictEqual(b.environmentId, testEnv.id, 'Todos vinculados ao ambiente correto');
  });
});

// 23. SpecificationBookModule deve renderizar HTML para aba do ambiente
test('23. Módulo deve renderizar HTML da aba do ambiente sem erros', () => {
  const html = SpecificationBookModule.renderEnvironmentTab(testEnv, testProject);
  assert.ok(html, 'HTML gerado');
  assert.ok(typeof html === 'string', 'Retorno é string');
  assert.ok(html.length > 50, 'HTML tem conteúdo substancial');
});

// 24. SpecificationBookModule deve renderizar HTML para aba do projeto
test('24. Módulo deve renderizar HTML da aba do projeto sem erros', () => {
  const html = SpecificationBookModule.renderProjectTab(testProject);
  assert.ok(html, 'HTML gerado');
  assert.ok(typeof html === 'string', 'Retorno é string');
  assert.ok(html.includes('Caderno Geral'), 'Contém referência ao Caderno Geral');
});

// 25. Validação de origin inválida deve ser normalizada
test('25. Deve normalizar origem inválida para CONFIRMADO', () => {
  const books = StudioState.getEnvironmentSpecificationBooks(testProject.id, testEnv.id);
  const draft = books.find(b => b.status === 'DRAFT');

  const entry = StudioState.addSpecificationEntry(draft.id, {
    itemName: 'Item com origem inválida',
    category: 'TESTE',
    origin: 'INVENTADO_PELO_USUARIO'
  });

  assert.strictEqual(entry.origin, 'CONFIRMADO', 'Origem inválida normalizada para CONFIRMADO');
});

console.log('====================================================================');
console.log(`TOTAL DE TESTES E05: ${totalTests} | APROVADOS: ${passedTests} | FALHAS: ${totalTests - passedTests}`);
console.log('====================================================================');

if (passedTests === totalTests) {
  console.log('>>> TODOS OS CRITÉRIOS DE ACEITE DO BLOCO E05 FORAM HOMOLOGADOS COM SUCESSO! <<<');
  process.exit(0);
} else {
  console.error(`>>> ${totalTests - passedTests} TESTES FALHARAM! <<<`);
  process.exit(1);
}
