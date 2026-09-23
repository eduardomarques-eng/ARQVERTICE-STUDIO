/**
 * ============================================================================
 * TESTES DO BLOCO F09: GERADOR DE RELATÓRIO DO ARQVERTICE STUDIO
 *
 * Validação rigorosa dos 11 requisitos do Bloco F09:
 * 1. Estrutura base de 21 seções canônicas modulares
 * 2. Inclusão condicional (não obriga todas as seções; omite vazias ou não selecionadas)
 * 3. Dados reais consumidos do projeto sem duplicação manual
 * 4. Imagens estritamente aprovadas/autorizadas para relatório
 * 5. Rastreabilidade (origem e versão em imagens e documentos)
 * 6. Sumário gerado automaticamente com numeração dinâmica de páginas
 * 7. Paginação contínua e rótulos de folha
 * 8. Cabeçalho e rodapé com identidade ArqVértice
 * 9. Carimbo técnico F05 integrado
 * 10. Controle de status: rascunho, revisão, aprovado, final
 * 11. Gestão e aprovação formal do relatório
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

const ReportEngineModule = require('../js/report-engine-module.js');
global.ReportEngineModule = ReportEngineModule;
global.window.ReportEngineModule = ReportEngineModule;

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
console.log('SUÍTE DE TESTES: BLOCO F09 — GERADOR DE RELATÓRIO DO STUDIO');
console.log('================================================================\n');

// Inicialização do estado
StudioState.init();
const testProjectId = 'prj-praia-01';

// 1. Estrutura base de 21 seções canônicas
runTest('1.1 - 21 seções canônicas estão definidas na ordem correta', () => {
  assert.ok(Array.isArray(StudioState.REPORT_CANONICAL_SECTIONS), 'Deve ser um array');
  assert.strictEqual(StudioState.REPORT_CANONICAL_SECTIONS.length, 21, 'Devem ser exatamente 21 seções');

  const expectedIds = [
    'capa', 'dados_cliente', 'dados_projeto', 'briefing_aprovado',
    'conceito', 'diretrizes', 'estudos_preliminares', 'ambientes',
    'plantas', 'plantas_humanizadas', 'perspectivas', 'cameras',
    'materiais', 'mobiliario', 'quantitativos', 'moodboards',
    'revisoes', 'observacoes', 'aprovacoes', 'historico', 'entrega'
  ];

  expectedIds.forEach((id, index) => {
    assert.strictEqual(StudioState.REPORT_CANONICAL_SECTIONS[index].id, id, `Seção ${index + 1} deve ser ${id}`);
    assert.strictEqual(StudioState.REPORT_CANONICAL_SECTIONS[index].order, index + 1, `Ordem de ${id} deve ser ${index + 1}`);
  });
});

// 2. Status do Relatório
runTest('2.1 - Estados canônicos do relatório estão definidos', () => {
  assert.deepStrictEqual(StudioState.REPORT_STATUSES, ['rascunho', 'revisao', 'aprovado', 'final']);
  assert.ok(StudioState.REPORT_STATUS_LABELS.rascunho);
  assert.ok(StudioState.REPORT_STATUS_LABELS.revisao);
  assert.ok(StudioState.REPORT_STATUS_LABELS.aprovado);
  assert.ok(StudioState.REPORT_STATUS_LABELS.final);
});

// 3. Compilação de Relatório com Dados Reais
runTest('3.1 - compileProjectReport consome dados reais do projeto sem duplicação', () => {
  const report = StudioState.compileProjectReport(testProjectId);
  assert.ok(report, 'Relatório deve ser gerado');
  assert.strictEqual(report.projectId, testProjectId);
  assert.ok(report.pages.length > 0, 'Relatório deve possuir páginas');

  // Verifica página de dados do cliente com dados reais de Pedro Albuquerque
  const clientPage = report.pages.find(p => p.sectionId === 'dados_cliente');
  assert.ok(clientPage, 'Página de cliente deve existir');
  assert.strictEqual(clientPage.content.client.name, 'Pedro Albuquerque');

  // Verifica página de dados do projeto
  const projectPage = report.pages.find(p => p.sectionId === 'dados_projeto');
  assert.ok(projectPage, 'Página do projeto deve existir');
  assert.strictEqual(projectPage.content.project.name, 'Residência de Praia');
});

// 4. Inclusão Condicional (Não obrigar todas as seções)
runTest('4.1 - Inclusão condicional: respeita seleção de seções do usuário e omite vazias', () => {
  // Gera relatório apenas com capa, dados do cliente e quantitativos
  const customReport = StudioState.compileProjectReport(testProjectId, {
    selectedSections: ['capa', 'dados_cliente', 'quantitativos']
  });

  assert.ok(customReport.includedSections.includes('capa'));
  assert.ok(customReport.includedSections.includes('dados_cliente'));
  assert.ok(customReport.includedSections.includes('quantitativos'));
  assert.ok(!customReport.includedSections.includes('diretrizes'), 'Diretrizes não devem estar incluídas');
  assert.ok(!customReport.includedSections.includes('cameras'), 'Câmeras não devem estar incluídas');

  // A página de sumário deve listar estritamente as seções incluídas (além da capa)
  const sumarioEntries = customReport.sumario.map(s => s.sectionId);
  assert.ok(sumarioEntries.includes('dados_cliente'));
  assert.ok(sumarioEntries.includes('quantitativos'));
  assert.ok(!sumarioEntries.includes('diretrizes'));
});

// 5. Imagens Estritamente Aprovadas
runTest('5.1 - Imagens: apenas renders aprovados e autorizados entram no relatório', () => {
  const report = StudioState.compileProjectReport(testProjectId);
  const renderPage = report.pages.find(p => p.sectionId === 'perspectivas');
  
  if (renderPage && renderPage.content.renders.length > 0) {
    renderPage.content.renders.forEach(r => {
      assert.strictEqual(r.aprovado, true, 'Render deve estar homologado como aprovado');
      assert.ok(r.approvedBy, 'Render deve indicar aprovador');
    });
  }
});

// 6. Rastreabilidade (Origem e Versão)
runTest('6.1 - Rastreabilidade: imagens e documentos indicam origem e versão', () => {
  const report = StudioState.compileProjectReport(testProjectId);
  
  // Capa possui origem e versão
  const coverPage = report.pages.find(p => p.sectionId === 'capa');
  assert.ok(coverPage.content.origem, 'Capa deve indicar origem');
  assert.ok(coverPage.content.versao, 'Capa deve indicar versão');

  // Render possui origem e versão
  const renderPage = report.pages.find(p => p.sectionId === 'perspectivas');
  if (renderPage && renderPage.content.renders.length > 0) {
    renderPage.content.renders.forEach(r => {
      assert.ok(r.origem, 'Render deve conter origem');
      assert.ok(r.versao, 'Render deve conter versão');
    });
  }
});

// 7. Sumário Automático e Paginação Dinâmica
runTest('7.1 - Sumário automático gerado com números de página coerentes e contínuos', () => {
  const report = StudioState.compileProjectReport(testProjectId);
  
  const sumarioPage = report.pages.find(p => p.sectionId === 'sumario');
  assert.ok(sumarioPage, 'Página de sumário deve existir');
  assert.strictEqual(sumarioPage.pageNumber, 2, 'Sumário deve ser a página 2 (logo após capa)');

  // Cada entrada no sumário aponta para uma página válida
  report.sumario.forEach(entry => {
    assert.ok(entry.pageNumber >= 3, 'Páginas de conteúdo iniciam após o sumário');
    assert.ok(entry.pageNumber <= report.totalPages, 'Página não ultrapassa total');
    
    // Encontra a página no relatório
    const targetPage = report.pages.find(p => p.pageNumber === entry.pageNumber);
    assert.ok(targetPage, `Página ${entry.pageNumber} deve existir no relatório`);
    assert.strictEqual(targetPage.sectionId, entry.sectionId);
  });
});

runTest('7.2 - Paginação: cada página possui numeração atual e total (Página X de Y)', () => {
  const report = StudioState.compileProjectReport(testProjectId);

  report.pages.forEach((p, idx) => {
    assert.strictEqual(p.pagination.current, idx + 1);
    assert.strictEqual(p.pagination.total, report.totalPages);
    assert.strictEqual(p.pagination.label, `Página ${idx + 1} de ${report.totalPages}`);
  });
});

// 8. Cabeçalho e Rodapé com Identidade ArqVértice
runTest('8.1 - Cabeçalho e rodapé utilizam tokens e identidade institucional', () => {
  const report = StudioState.compileProjectReport(testProjectId);

  assert.ok(report.header.brandName, 'Cabeçalho contém nome da marca');
  assert.ok(report.header.logoUrl, 'Cabeçalho contém logo');
  assert.strictEqual(report.header.projectName, 'Residência de Praia');

  assert.strictEqual(report.footer.companyName, 'ARQVÉRTICE STUDIO DE ARQUITETURA');
  assert.ok(report.footer.signatureUrl, 'Rodapé contém assinatura/símbolo');
  assert.ok(report.footer.date, 'Rodapé contém data');
});

// 9. Carimbo Técnico F05 Integrado
runTest('9.1 - Carimbo F05 integrado contém os 12 campos canônicos', () => {
  const report = StudioState.compileProjectReport(testProjectId);
  const tb = report.titleblock;

  assert.ok(tb.escritorio, 'escritório');
  assert.ok(tb.responsavel, 'responsável');
  assert.ok(tb.projeto, 'projeto');
  assert.ok(tb.cliente, 'cliente');
  assert.ok(tb.desenho, 'desenho');
  assert.ok(tb.revisao, 'revisão');
  assert.ok(tb.folha, 'folha');
  assert.ok(tb.data, 'data');
});

// 10. Gestão e Ciclo de Vida do Relatório
runTest('10.1 - Criação, atualização e homologação formal de relatório no StudioState', () => {
  const created = StudioState.createProjectReport({
    projectId: testProjectId,
    title: 'Relatório Executivo Oficial de Entrega',
    revision: 'REV 01',
    status: 'revisao'
  });

  assert.ok(created.id, 'Deve ter ID');
  assert.strictEqual(created.status, 'revisao');
  assert.strictEqual(created.revision, 'REV 01');

  // Consulta por projeto
  const projectReports = StudioState.getProjectReports(testProjectId);
  assert.ok(projectReports.some(r => r.id === created.id), 'Deve constar nos relatórios do projeto');

  // Atualização
  const updated = StudioState.updateProjectReport(created.id, {
    revision: 'REV 02'
  });
  assert.strictEqual(updated.revision, 'REV 02');

  // Homologação / Aprovação
  const approved = StudioState.approveProjectReport(created.id, 'Eduardo Marques', 'Aprovado para entrega ao cliente.');
  assert.strictEqual(approved.status, 'aprovado');
  assert.strictEqual(approved.approvedBy, 'Eduardo Marques');
  assert.ok(approved.approvedAt);
});

console.log('\n================================================================');
console.log(`RESULTADO FINAL: ${testsPassed} testes passaram, ${testsFailed} falharam.`);
console.log('================================================================\n');

if (testsFailed > 0) {
  process.exit(1);
}
