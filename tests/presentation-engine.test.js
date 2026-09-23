/**
 * ============================================================================
 * SUÍTE DE TESTES: BLOCO F01 — MOTOR CENTRAL DE APRESENTAÇÃO
 * Validação rigorosa dos critérios de aceite da especificação F01
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
  },
  print: () => {}
};
global.localStorage = global.window.localStorage;
global.document = {
  getElementById: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};

const StudioState = require('../js/state.js');
global.StudioState = StudioState;
global.window.StudioState = StudioState;

// Carrega função auxiliar escapeHTML e formatDateBR
global.escapeHTML = (str) => {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
};
global.formatDateBR = (isoStr) => {
  try { return new Date(isoStr).toLocaleDateString('pt-BR'); } catch(e) { return isoStr; }
};

const PresentationEngineModule = require('../js/presentation-engine-module.js');

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
console.log('ARQVERTICE STUDIO — SUÍTE DE TESTES F01 (MOTOR DE APRESENTAÇÃO)');
console.log('====================================================================');

// Inicialização do Estado
StudioState.init();

// Mock de projeto e cliente para testes
const testClient = {
  id: 'cli-test-f01',
  name: 'Cliente Teste Apresentação',
  email: 'cliente@teste.com'
};
if (!Array.isArray(StudioState.data.clients)) StudioState.data.clients = [];
StudioState.data.clients.push(testClient);

const testProject = {
  id: 'proj-test-f01',
  name: 'Residência Teste Apresentação',
  clientId: testClient.id,
  typology: 'Residencial Unifamiliar',
  location: 'Fortaleza - CE',
  builtAreaM2: 320.00,
  landAreaM2: 450.00,
  stages: [
    { key: 'apresentacao', label: 'Apresentação', status: 'em_andamento' }
  ]
};
if (!Array.isArray(StudioState.data.projects)) StudioState.data.projects = [];
StudioState.data.projects.push(testProject);

const testEnv = {
  id: 'env-sala-f01',
  projectId: testProject.id,
  name: 'Living Teste F01',
  areaM2: 42.0
};
if (!Array.isArray(StudioState.data.environments)) StudioState.data.environments = [];
StudioState.data.environments.push(testEnv);

// Início dos testes
test('1. Deve criar uma apresentação com campos mínimos e metadados canônicos', () => {
  const pres = StudioState.createPresentation({
    projectId: testProject.id,
    title: 'Apresentação Preliminar Residência',
    subtitle: 'Estudo Inicial de Volumes',
    presentationType: StudioState.PRESENTATION_TYPES.ESTUDO_PRELIMINAR,
    sheetFormat: 'A3',
    orientation: 'landscape',
    scale: '1:50'
  }, 'Arquiteto Teste');

  assert.ok(pres.id, 'ID deve ser gerado');
  assert.strictEqual(pres.projectId, testProject.id);
  assert.strictEqual(pres.clientId, testClient.id);
  assert.strictEqual(pres.status, StudioState.PRESENTATION_STATUSES.DRAFT);
  assert.strictEqual(pres.revision, 'R00');
  assert.strictEqual(pres.version, 'V01');
  assert.strictEqual(pres.sheetFormat, 'A3');
  assert.strictEqual(pres.orientation, 'landscape');
  assert.strictEqual(pres.author, 'Arquiteto Teste');
  assert.ok(pres.stamp, 'Carimbo deve ser inicializado');
  assert.ok(pres.visualIdentity, 'Identidade visual deve ser configurada');
});

test('2. Deve validar que projectId é obrigatório', () => {
  assert.throws(() => {
    StudioState.createPresentation({});
  }, /projectId é obrigatório/);
});

test('3. Deve disponibilizar e suportar os 8 tipos canônicos de apresentação', () => {
  const types = StudioState.PRESENTATION_TYPES.ALL;
  assert.strictEqual(types.length, 8);
  assert.ok(types.includes('estudo_preliminar'));
  assert.ok(types.includes('estudo_interiores'));
  assert.ok(types.includes('apresentacao_ambiente'));
  assert.ok(types.includes('apresentacao_geral'));
  assert.ok(types.includes('apresentacao_cliente'));
  assert.ok(types.includes('documentacao_complementar'));
  assert.ok(types.includes('apresentacao_final'));
  assert.ok(types.includes('entrega_final'));
});

test('4. Deve gerar apresentação automática com as 14 seções lógicas completas', () => {
  const autoPres = StudioState.generateAutomaticPresentation(testProject.id, {
    title: 'Apresentação Completa Automática'
  }, 'Sistema ArqVértice');

  assert.ok(autoPres.id);
  assert.strictEqual(autoPres.pages.length, 14, 'Deve conter exatamente 14 pranchas lógicas');
});

test('5. As 14 seções devem seguir a ordem lógica canônica do princípio fundamental', () => {
  const autoPres = StudioState.generateAutomaticPresentation(testProject.id, {
    title: 'Apresentação Ordem Lógica'
  });

  const expectedOrder = [
    'capa',
    'informacoes',
    'briefing',
    'conceito',
    'estudos',
    'ambientes',
    'materiais',
    'mobiliario',
    'quantitativos',
    'moodboards',
    'plantas',
    'perspectivas',
    'revisoes',
    'entrega'
  ];

  const actualOrder = autoPres.pages.map(p => p.sectionType);
  assert.deepStrictEqual(actualOrder, expectedOrder, 'A hierarquia deve respeitar as 14 seções em ordem');
});

test('6. Deve atualizar propriedades de apresentação em rascunho', () => {
  const pres = StudioState.createPresentation({
    projectId: testProject.id,
    title: 'Título Inicial'
  });

  const updated = StudioState.updatePresentation(pres.id, {
    title: 'Título Atualizado',
    subtitle: 'Novo Subtítulo',
    sheetFormat: 'A2',
    scale: '1:25'
  });

  assert.strictEqual(updated.title, 'Título Atualizado');
  assert.strictEqual(updated.subtitle, 'Novo Subtítulo');
  assert.strictEqual(updated.sheetFormat, 'A2');
  assert.strictEqual(updated.scale, '1:25');
});

test('7. Deve atualizar propriedades de uma prancha (título, layoutTemplate, notes)', () => {
  const pres = StudioState.createPresentation({ projectId: testProject.id });
  const page = StudioState.addPresentationPage(pres.id, {
    title: 'Prancha Teste',
    sectionType: 'materiais'
  });

  const updatedPage = StudioState.updatePresentationPage(page.id, {
    title: 'Prancha de Revestimentos Nobres',
    subtitle: 'Mármores e Madeiras',
    layoutTemplate: 'materials_table',
    notes: 'Priorizar acabamento levigado.'
  });

  assert.strictEqual(updatedPage.title, 'Prancha de Revestimentos Nobres');
  assert.strictEqual(updatedPage.subtitle, 'Mármores e Madeiras');
  assert.strictEqual(updatedPage.layoutTemplate, 'materials_table');
  assert.strictEqual(updatedPage.notes, 'Priorizar acabamento levigado.');
});

test('8. Deve reordenar pranchas mantendo sortOrder consistente', () => {
  const pres = StudioState.createPresentation({ projectId: testProject.id });
  const p1 = StudioState.addPresentationPage(pres.id, { title: 'P1', order: 0 });
  const p2 = StudioState.addPresentationPage(pres.id, { title: 'P2', order: 1 });
  const p3 = StudioState.addPresentationPage(pres.id, { title: 'P3', order: 2 });

  // Inverte ordem: p3, p1, p2
  const reordered = StudioState.reorderPresentationPages(pres.id, [p3.id, p1.id, p2.id]);
  const newOrderIds = reordered.map(p => p.id);
  assert.deepStrictEqual(newOrderIds, [p3.id, p1.id, p2.id]);
});

test('9. Deve mover prancha para cima (movePresentationPage "up")', () => {
  const pres = StudioState.createPresentation({ projectId: testProject.id });
  const p1 = StudioState.addPresentationPage(pres.id, { title: 'P1', order: 0 });
  const p2 = StudioState.addPresentationPage(pres.id, { title: 'P2', order: 1 });

  const moved = StudioState.movePresentationPage(p2.id, 'up');
  assert.strictEqual(moved, true);

  const enriched = StudioState.getPresentation(pres.id);
  assert.strictEqual(enriched.pages[0].id, p2.id);
  assert.strictEqual(enriched.pages[1].id, p1.id);
});

test('10. Deve mover prancha para baixo (movePresentationPage "down")', () => {
  const pres = StudioState.createPresentation({ projectId: testProject.id });
  const p1 = StudioState.addPresentationPage(pres.id, { title: 'P1', order: 0 });
  const p2 = StudioState.addPresentationPage(pres.id, { title: 'P2', order: 1 });

  const moved = StudioState.movePresentationPage(p1.id, 'down');
  assert.strictEqual(moved, true);

  const enriched = StudioState.getPresentation(pres.id);
  assert.strictEqual(enriched.pages[0].id, p2.id);
  assert.strictEqual(enriched.pages[1].id, p1.id);
});

test('11. Deve duplicar uma prancha criando nova prancha em status rascunho com sufixo (Cópia)', () => {
  const pres = StudioState.createPresentation({ projectId: testProject.id });
  const orig = StudioState.addPresentationPage(pres.id, {
    title: 'Perspectiva Noturna',
    sectionType: 'perspectivas',
    order: 0
  });

  const copy = StudioState.duplicatePresentationPage(orig.id);
  assert.notStrictEqual(copy.id, orig.id);
  assert.strictEqual(copy.title, 'Perspectiva Noturna (Cópia)');
  assert.strictEqual(copy.sectionType, 'perspectivas');
  assert.strictEqual(copy.status, StudioState.PRESENTATION_STATUSES.DRAFT);
  assert.strictEqual(copy.order, 1);
});

test('12. Deve ocultar prancha (isHidden = true) e refletir em activePages', () => {
  const pres = StudioState.createPresentation({ projectId: testProject.id });
  const p1 = StudioState.addPresentationPage(pres.id, { title: 'P1' });
  const p2 = StudioState.addPresentationPage(pres.id, { title: 'P2' });

  StudioState.hidePresentationPage(p2.id, true);
  const enriched = StudioState.getPresentation(pres.id);
  assert.strictEqual(enriched.pages.length, 2);
  assert.strictEqual(enriched.activePages.length, 1);
  assert.strictEqual(enriched.activePages[0].id, p1.id);
});

test('13. Deve reexibir prancha (isHidden = false)', () => {
  const pres = StudioState.createPresentation({ projectId: testProject.id });
  const p1 = StudioState.addPresentationPage(pres.id, { title: 'P1', isHidden: true });

  StudioState.hidePresentationPage(p1.id, false);
  const enriched = StudioState.getPresentation(pres.id);
  assert.strictEqual(enriched.activePages.length, 1);
  assert.strictEqual(enriched.activePages[0].isHidden, false);
});

test('14. Deve excluir prancha de forma suave (soft delete: isDeleted = true)', () => {
  const pres = StudioState.createPresentation({ projectId: testProject.id });
  const p1 = StudioState.addPresentationPage(pres.id, { title: 'P1' });
  const p2 = StudioState.addPresentationPage(pres.id, { title: 'P2' });

  StudioState.deletePresentationPage(p2.id);
  const enriched = StudioState.getPresentation(pres.id);
  assert.strictEqual(enriched.pages.length, 1);
  assert.strictEqual(enriched.deletedPages.length, 1);
  assert.strictEqual(enriched.deletedPages[0].id, p2.id);
});

test('15. Deve restaurar prancha excluída da lixeira', () => {
  const pres = StudioState.createPresentation({ projectId: testProject.id });
  const p1 = StudioState.addPresentationPage(pres.id, { title: 'P1' });
  StudioState.deletePresentationPage(p1.id);

  StudioState.restorePresentationPage(p1.id);
  const enriched = StudioState.getPresentation(pres.id);
  assert.strictEqual(enriched.pages.length, 1);
  assert.strictEqual(enriched.deletedPages.length, 0);
});

test('16. Deve homologar apresentação formalmente e atualizar páginas para aprovado', () => {
  const pres = StudioState.createPresentation({ projectId: testProject.id });
  StudioState.addPresentationPage(pres.id, { title: 'P1', status: 'rascunho' });
  StudioState.addPresentationPage(pres.id, { title: 'P2', status: 'em_revisao' });

  const approved = StudioState.approvePresentation(pres.id, 'Diretor de Projetos', 'Apresentação aprovada com louvor');
  assert.strictEqual(approved.status, 'aprovado');
  assert.ok(approved.approvedAt);
  assert.strictEqual(approved.approvedBy, 'Diretor de Projetos');
  assert.strictEqual(approved.pages[0].status, 'aprovado');
  assert.strictEqual(approved.pages[1].status, 'aprovado');
});

test('17. Homologação de apresentação deve alimentar a memória do projeto (projectMemories)', () => {
  const initialMemories = (StudioState.data.projectMemories || []).length;
  const pres = StudioState.createPresentation({ projectId: testProject.id });
  StudioState.approvePresentation(pres.id, 'Erick Santiago');

  const currentMemories = (StudioState.data.projectMemories || []).length;
  assert.strictEqual(currentMemories, initialMemories + 1);

  const lastMemory = StudioState.data.projectMemories[currentMemories - 1];
  assert.strictEqual(lastMemory.category, 'PRESENTATION_APPROVED');
  assert.strictEqual(lastMemory.projectId, testProject.id);
});

test('18. INTEGRIDADE: Não deve permitir edição direta em apresentação aprovada', () => {
  const pres = StudioState.createPresentation({ projectId: testProject.id });
  StudioState.approvePresentation(pres.id);

  assert.throws(() => {
    StudioState.updatePresentation(pres.id, { title: 'Tentativa de Alteração Silenciosa' });
  }, /Não é permitido alterar silenciosamente uma apresentação aprovada/);
});

test('19. INTEGRIDADE: Não deve permitir adicionar pranchas a apresentação aprovada', () => {
  const pres = StudioState.createPresentation({ projectId: testProject.id });
  StudioState.approvePresentation(pres.id);

  assert.throws(() => {
    StudioState.addPresentationPage(pres.id, { title: 'Nova Prancha Não Autorizada' });
  }, /Não é permitido adicionar páginas a uma apresentação aprovada/);
});

test('20. INTEGRIDADE: Não deve permitir excluir pranchas em apresentação aprovada', () => {
  const pres = StudioState.createPresentation({ projectId: testProject.id });
  const p = StudioState.addPresentationPage(pres.id, { title: 'Página Protegida' });
  StudioState.approvePresentation(pres.id);

  assert.throws(() => {
    StudioState.deletePresentationPage(p.id);
  }, /Não é permitido excluir páginas em apresentação aprovada/);
});

test('21. Deve criar nova revisão técnica (R00 -> R01) desbloqueando a apresentação para edição', () => {
  const pres = StudioState.createPresentation({ projectId: testProject.id, revision: 'R00' });
  StudioState.approvePresentation(pres.id);

  const revised = StudioState.createPresentationRevision(pres.id, 'Arquiteto Sênior', 'Ajustes solicitados no layout');
  assert.strictEqual(revised.revision, 'R01');
  assert.strictEqual(revised.status, 'em_revisao');
  assert.strictEqual(revised.approvedAt, null);

  // Agora deve permitir edição novamente pois está em revisão
  const edited = StudioState.updatePresentation(pres.id, { title: 'Apresentação com Alterações R01' });
  assert.strictEqual(edited.title, 'Apresentação com Alterações R01');
});

test('22. Nova revisão deve registrar histórico com changelog, autor e data', () => {
  const pres = StudioState.createPresentation({ projectId: testProject.id });
  StudioState.createPresentationRevision(pres.id, 'Arquiteto Responsável', 'Alteração nos materiais de acabamento');

  const history = (StudioState.data.presentationHistory || []).filter(h => h.presentationId === pres.id);
  const revHist = history.find(h => h.action === 'REVISION_CREATED');
  assert.ok(revHist);
  assert.strictEqual(revHist.actor, 'Arquiteto Responsável');
  assert.strictEqual(revHist.changeSummary, 'Alteração nos materiais de acabamento');
  assert.strictEqual(revHist.revision, 'R01');
});

test('23. FILTRAGEM DE ENTREGA: Deve excluir pranchas em rascunho da apresentação final/entrega', () => {
  const pres = StudioState.createPresentation({ projectId: testProject.id });
  StudioState.addPresentationPage(pres.id, { title: 'P1 Aprovada', status: 'aprovado' });
  StudioState.addPresentationPage(pres.id, { title: 'P2 Rascunho', status: 'rascunho' });

  const delivery = StudioState.filterPresentationForDelivery(pres.id);
  assert.strictEqual(delivery.deliveredPages.length, 1);
  assert.strictEqual(delivery.deliveredPages[0].title, 'P1 Aprovada');
  assert.strictEqual(delivery.excludedDraftPagesCount, 1);
  assert.strictEqual(delivery.deliveryReady, false);
});

test('24. Deve criar snapshot de backup e permitir recuperar a última versão salva', () => {
  const pres = StudioState.createPresentation({ projectId: testProject.id, title: 'Título Original Seguro' });
  StudioState.addPresentationPage(pres.id, { title: 'Prancha Salva' });
  StudioState.savePresentationBackup(pres.id);

  // Modifica título
  StudioState.updatePresentation(pres.id, { title: 'Título Temporário Indesejado' });
  assert.strictEqual(StudioState.getPresentation(pres.id).title, 'Título Temporário Indesejado');

  // Recupera snapshot
  const recovered = StudioState.recoverLastPresentationSaved(pres.id);
  assert.strictEqual(recovered.title, 'Título Original Seguro');
  assert.strictEqual(recovered.pages.length, 1);
});

test('25. PresentationEngineModule deve renderizar HTML válido no modo de edição (3 painéis)', () => {
  const html = PresentationEngineModule.renderProjectPresentation(testProject);
  assert.ok(html.includes('presentation-engine-container'), 'Container principal deve estar presente');
  assert.ok(html.includes('pres-topbar'), 'Barra de controle superior deve estar presente');
  assert.ok(html.includes('pres-left-panel'), 'Painel esquerdo de estrutura deve estar presente');
  assert.ok(html.includes('pres-center-canvas'), 'Canvas central de prancha deve estar presente');
  assert.ok(html.includes('pres-right-panel'), 'Painel direito de propriedades deve estar presente');
  assert.ok(html.includes('sheet-stamp-box'), 'Carimbo arquitetônico ArqVértice deve estar presente');
});

test('26. PresentationEngineModule deve renderizar HTML válido no modo de apresentação de slides', () => {
  PresentationEngineModule.setPreviewMode('apresentacao');
  const html = PresentationEngineModule.renderProjectPresentation(testProject);
  assert.ok(html.includes('pres-slide-mode-container'), 'Container de apresentação de slides deve estar presente');
  assert.ok(html.includes('pres-slide-controls'), 'Controles flutuantes de slides devem estar presentes');
});

test('27. PresentationEngineModule deve renderizar HTML válido no modo de inspeção de entrega', () => {
  PresentationEngineModule.setPreviewMode('exportacao');
  const html = PresentationEngineModule.renderProjectPresentation(testProject);
  assert.ok(html.includes('pres-export-mode-container'), 'Container de exportação/entrega deve estar presente');
  assert.ok(html.includes('Manifesto de Pranchas da Entrega'), 'Manifesto de pranchas deve estar presente');
});

console.log('====================================================================');
console.log(`TOTAL DE TESTES F01: ${totalTests} | APROVADOS: ${passedTests} | FALHAS: ${totalTests - passedTests}`);
console.log('====================================================================');

if (passedTests === totalTests) {
  console.log('>>> TODOS OS 27 CRITÉRIOS DE ACEITE DO BLOCO F01 FORAM HOMOLOGADOS COM SUCESSO! <<<');
} else {
  throw new Error(`Falha na suíte de testes F01: ${totalTests - passedTests} falhas detectadas.`);
}
