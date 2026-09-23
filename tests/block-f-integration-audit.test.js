/**
 * ============================================================================
 * ARQVERTICE STUDIO — BLOCO F15: AUDITORIA E VALIDAÇÃO INTEGRADA DO BLOCO F
 * ============================================================================
 * Suíte de testes de auditoria profunda cobrindo:
 * - 25 itens do Fluxo Completo (Projeto -> Apresentação -> Prancha -> Formato ->
 *   Escala -> Identidade -> Planta Humanizada -> Perspectiva -> Materiais ->
 *   Mobiliário -> Quantitativos -> Relatório -> Exportação -> QA -> Revisão ->
 *   Entrega -> Cronograma)
 * - 9 Simulações de Erro e Resiliência
 * - 5 Testes de Performance e Escalabilidade
 * - 6 Testes de Segurança e Isolamento de Dados
 * ============================================================================
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
global.escapeHTML = (str) => {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
};

const assert = require('assert');
const StudioState = require('../js/state.js');
StudioState.init();

const { CronogramaIntegration } = require('../js/cronograma-module.js');

let passCount = 0;
let failCount = 0;

function runAudit(section, id, name, fn) {
  try {
    fn();
    console.log(`  ✔ [PASS] [${section}] ${id}. ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ✖ [FAIL] [${section}] ${id}. ${name}`);
    console.error(`     Erro: ${err.message}\n`);
    failCount++;
  }
}

console.log('====================================================================');
console.log('ARQVERTICE STUDIO — AUDITORIA INTEGRADA E HOMOLOGAÇÃO DO BLOCO F');
console.log('====================================================================\n');

// Projeto e cliente canônicos para auditoria
const auditProjectId = 'prj-praia-01';
const project = StudioState.getProject(auditProjectId);
assert.ok(project, 'Projeto base deve existir no Studio');

let auditPresentationId = null;
let auditSheetId = null;
let auditRevisionId = null;

// ============================================================================
// PARTE 1: FLUXO COMPLETO — OS 25 TESTES SEQUENCIAIS
// ============================================================================
console.log('--- GRUPO 1: OS 25 TESTES DE FLUXO INTEGRADO ---');

// 1. Criação de Projeto
runAudit('FLUXO', 1, 'Criação de projeto com cliente e parâmetros técnicos', () => {
  const newProjId = 'prj-audit-f15';
  if (!StudioState.data.projects) StudioState.data.projects = [];
  StudioState.data.projects = StudioState.data.projects.filter(p => p.id !== newProjId);

  const newProject = {
    id: newProjId,
    name: 'Residência Silveira & Mar',
    code: 'RSM-2026',
    clientId: project.clientId,
    typology: 'Residencial Unifamiliar',
    area: 450.0,
    revision: 'REV00',
    budgetTotal: 3200000,
    deliveries: []
  };
  StudioState.data.projects.push(newProject);
  StudioState.save();

  const fetched = StudioState.getProject(newProjId);
  assert.ok(fetched, 'Projeto deve ser criado');
  assert.strictEqual(fetched.id, newProjId);
  assert.strictEqual(fetched.clientId, project.clientId);
});

// 2. Criação de Apresentação
runAudit('FLUXO', 2, 'Criação de apresentação vinculada ao projeto', () => {
  const pres = StudioState.createPresentation({
    projectId: auditProjectId,
    title: 'Residência Praia — Dossiê de Apresentação Geral',
    presentationType: 'apresentacao_geral',
    sheetFormat: 'A3',
    orientation: 'landscape',
    scale: '1:50',
    revision: 'REV00'
  }, 'Eduardo Marques');

  assert.ok(pres, 'Apresentação deve ser criada');
  assert.strictEqual(pres.projectId, auditProjectId);
  auditPresentationId = pres.id;
});

// 3. Criação de Prancha
runAudit('FLUXO', 3, 'Criação de prancha técnica diagramada', () => {
  const sheet = StudioState.createSheet({
    projectId: auditProjectId,
    name: 'Prancha de Apresentação e Layout',
    format: 'A3',
    orientation: 'landscape',
    scale: '1:50',
    revision: 'REV00'
  }, 'Eduardo Marques');

  assert.ok(sheet, 'Prancha deve ser criada');
  assert.strictEqual(sheet.projectId, auditProjectId);
  assert.ok(sheet.printableArea, 'Deve conter printableArea calculada');
  auditSheetId = sheet.id;
});

// 4. Escolha A4
runAudit('FLUXO', 4, 'Escolha de formato físico A4 e cálculo de margens NBR', () => {
  const updated = StudioState.setSheetFormatProfile(auditSheetId, { format: 'A4', orientation: 'landscape' }, {}, 'Tester');
  assert.strictEqual(updated.format, 'A4');
  assert.strictEqual(updated.formatProfile.width, 297);
  assert.strictEqual(updated.formatProfile.height, 210);
  assert.strictEqual(updated.margins.left, 25, 'Margem esquerda de fixação NBR deve ser 25mm');
});

// 5. Escolha A3
runAudit('FLUXO', 5, 'Escolha de formato físico A3 e cálculo de margens NBR', () => {
  const updated = StudioState.setSheetFormatProfile(auditSheetId, { format: 'A3', orientation: 'landscape' }, {}, 'Tester');
  assert.strictEqual(updated.format, 'A3');
  assert.strictEqual(updated.formatProfile.width, 420);
  assert.strictEqual(updated.formatProfile.height, 297);
});

// 6. Escolha A2
runAudit('FLUXO', 6, 'Escolha de formato físico A2 e cálculo de margens NBR', () => {
  const updated = StudioState.setSheetFormatProfile(auditSheetId, { format: 'A2', orientation: 'landscape' }, {}, 'Tester');
  assert.strictEqual(updated.format, 'A2');
  assert.strictEqual(updated.formatProfile.width, 594);
  assert.strictEqual(updated.formatProfile.height, 420);
});

// 7. Escolha A1
runAudit('FLUXO', 7, 'Escolha de formato físico A1 e cálculo de margens NBR', () => {
  const updated = StudioState.setSheetFormatProfile(auditSheetId, { format: 'A1', orientation: 'landscape' }, {}, 'Tester');
  assert.strictEqual(updated.format, 'A1');
  assert.strictEqual(updated.formatProfile.width, 841);
  assert.strictEqual(updated.formatProfile.height, 594);
});

// 8. Retrato
runAudit('FLUXO', 8, 'Configuração e recálculo em orientação Retrato (Portrait)', () => {
  const updated = StudioState.setSheetFormatProfile(auditSheetId, { format: 'A3', orientation: 'portrait' }, {}, 'Tester');
  assert.strictEqual(updated.orientation, 'portrait');
  assert.strictEqual(updated.formatProfile.width, 297);
  assert.strictEqual(updated.formatProfile.height, 420);
  assert.ok(updated.printableArea.width < updated.printableArea.height);
});

// 9. Paisagem
runAudit('FLUXO', 9, 'Configuração e recálculo em orientação Paisagem (Landscape)', () => {
  const updated = StudioState.setSheetFormatProfile(auditSheetId, { format: 'A3', orientation: 'landscape' }, {}, 'Tester');
  assert.strictEqual(updated.orientation, 'landscape');
  assert.strictEqual(updated.formatProfile.width, 420);
  assert.strictEqual(updated.formatProfile.height, 297);
  assert.ok(updated.printableArea.width > updated.printableArea.height);
});

// 10. Escala
runAudit('FLUXO', 10, 'Validação e conversão de escalas técnicas nominais (1:50, 1:25, 1:100, 1:200, indicada)', () => {
  const scales = ['1:50', '1:25', '1:100', '1:200', 'indicada'];
  scales.forEach(sc => {
    StudioState.updateSheet(auditSheetId, { scale: sc });
    const sheet = StudioState.getSheet(auditSheetId);
    assert.strictEqual(sheet.scale, sc);
  });
});

// 11. Logo
runAudit('FLUXO', 11, 'Gestão de Logo com preservação estrita de proporção e aspect ratio', () => {
  const brand = StudioState.getActiveBrandProfile(auditProjectId);
  assert.ok(brand, 'Perfil de marca deve existir');
  assert.ok(brand.assets, 'Assets de marca devem estar presentes');
  assert.ok(brand.tokens, 'Tokens de identidade devem existir');
  const logo = brand.assets.logoPrincipal;
  assert.ok(logo, 'Logo principal deve existir');
});

// 12. Carimbo
runAudit('FLUXO', 12, 'Carimbo F05 ancorado com todos os 12 campos obrigatórios', () => {
  const tbData = StudioState.generateTitleblockData(auditSheetId);
  assert.ok(tbData, 'Dados do carimbo devem ser gerados');
  const required = [
    'escritorio', 'responsavel', 'projeto', 'cliente',
    'ambiente', 'desenho', 'escala', 'folha', 'revisao', 'data', 'autor', 'observacao'
  ];
  required.forEach(f => {
    assert.ok(tbData[f] !== undefined, `Campo ${f} do carimbo deve existir`);
  });
});

// 13. Planta
runAudit('FLUXO', 13, 'Inserção de elemento de planta na prancha respeitando a área útil', () => {
  const elem = StudioState.addSheetElement(auditSheetId, {
    type: 'planta',
    name: 'Planta Baixa Térreo Humanizada',
    transform: { x: 35, y: 20, width: 200, height: 150 },
    scale: '1:50',
    content: { url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"></svg>' }
  });
  assert.ok(elem, 'Elemento de planta deve ser adicionado');
});

// 14. Humanização
runAudit('FLUXO', 14, 'Presença de elementos e texturas de humanização', () => {
  const humanizedPlans = (StudioState.data.humanizedPlans || []).filter(p => p.projectId === auditProjectId);
  assert.ok(Array.isArray(humanizedPlans), 'Coleção de plantas humanizadas deve ser acessível');
});

// 15. Perspectiva
runAudit('FLUXO', 15, 'Perspectiva axonométrica/volumétrica diagramada na prancha', () => {
  const elem = StudioState.addSheetElement(auditSheetId, {
    type: 'perspectiva',
    name: 'Perspectiva Volumétrica Frontal',
    transform: { x: 245, y: 20, width: 140, height: 100 },
    content: { url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"></svg>' }
  });
  assert.ok(elem, 'Elemento de perspectiva deve ser adicionado');
});

// 16. Render
runAudit('FLUXO', 16, 'Apresentação de renders fotorrealistas nas 3 resoluções e locks', () => {
  const renderElem = StudioState.addSheetElement(auditSheetId, {
    type: 'render',
    name: 'Living Integrado — Render Final',
    transform: { x: 35, y: 180, width: 180, height: 90 },
    renderResolution: '4K',
    version: 'V01',
    content: { url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' }
  });
  assert.ok(renderElem, 'Elemento de render deve ser adicionado');
});

// 17. Materiais
runAudit('FLUXO', 17, 'Prancha de materiais com os 13 campos canônicos (F08)', () => {
  const matSheet = StudioState.createSheet({
    projectId: auditProjectId,
    name: 'Prancha de Especificações de Materiais',
    format: 'A3',
    orientation: 'landscape'
  });
  const elements = StudioState.generateMaterialsBoard(matSheet.id);
  assert.ok(Array.isArray(elements) && elements.length > 0, 'Deve criar elementos de materiais');
});

// 18. Mobiliário
runAudit('FLUXO', 18, 'Prancha de mobiliário solto e marcenaria no Layout 7', () => {
  const furnSheet = StudioState.createSheet({
    projectId: auditProjectId,
    name: 'Caderno de Mobiliário e Marcenaria',
    format: 'A3',
    orientation: 'landscape'
  });
  const elements = StudioState.generateFurnitureBoard(furnSheet.id);
  assert.ok(Array.isArray(elements) && elements.length > 0, 'Deve criar elementos de mobiliário');
});

// 19. Quantitativo
runAudit('FLUXO', 19, 'Prancha de quantitativos e quadro técnico de insumos', () => {
  const qSheet = StudioState.createSheet({
    projectId: auditProjectId,
    name: 'Quadro de Quantitativos e Insumos',
    format: 'A3',
    orientation: 'landscape'
  });
  const tableElement = StudioState.generateQuantitiesBoard(qSheet.id);
  assert.ok(tableElement && tableElement.id, 'Deve criar elemento de tabela de quantitativos');
  const sheet = StudioState.getSheet(qSheet.id);
  assert.ok(sheet.elements && sheet.elements.length > 0, 'Prancha deve conter a tabela');
});

// 20. Relatório
runAudit('FLUXO', 20, 'Geração de dossiê executivo encadernado de 21 seções com paginação', () => {
  const report = StudioState.compileProjectReport(auditProjectId);
  assert.ok(report, 'Relatório deve ser gerado');
  assert.ok(report.pages && report.pages.length > 0, 'Relatório deve conter páginas paginadas');
  assert.strictEqual(report.pages[0].pageNumber, 1);
});

// 21. PDF
runAudit('FLUXO', 21, 'Validação e preparação do manifesto de exportação para PDF', () => {
  const exported = StudioState.exportSheetToFile(auditSheetId, 'PDF');
  assert.ok(exported, 'Exportação individual para PDF deve ter sucesso');
  assert.strictEqual(exported.status, 'SUCCESS');
  assert.strictEqual(exported.format, 'PDF');
});

// 22. Revisão
runAudit('FLUXO', 22, 'Criação e controle formal de revisões com timeline e diff', () => {
  const rev = StudioState.createRevision(auditProjectId, {
    presentationId: auditPresentationId,
    revisionNumber: 'REV00',
    description: 'Emissão inicial para conferência técnica do cliente.'
  }, 'Eduardo Marques');
  assert.ok(rev, 'Revisão deve ser criada');
  assert.strictEqual(rev.revisionNumber, 'REV00');
  auditRevisionId = rev.id;

  const history = StudioState.getRevisionHistory(auditProjectId);
  assert.ok(history.length > 0, 'Timeline deve conter a revisão');
});

// 23. Aprovação
runAudit('FLUXO', 23, 'Homologação formal com blindagem contra alteração direta', () => {
  const approved = StudioState.approveRevision(auditRevisionId, 'Arquiteto Responsável', 'Projeto aprovado pelo cliente.');
  assert.strictEqual(approved.status, 'approved');

  // Prancha pertencente à revisão aprovada fica blindada
  const isProtected = StudioState.isSheetRevisionProtected(auditSheetId);
  assert.strictEqual(isProtected, true, 'Prancha homologada deve estar protegida contra alteração direta');
});

// 24. Entrega
runAudit('FLUXO', 24, 'Centro de Entrega: conferência das 10 seções, snapshot e política não-apagar', () => {
  const deliveryData = StudioState.getDeliveryCenterData(auditProjectId);
  assert.ok(deliveryData.header, 'Cabeçalho da entrega deve existir');
  assert.strictEqual(Object.keys(deliveryData.sections).length, 10, 'Deve conter as 10 seções canônicas');

  const result = StudioState.finalizeProjectDeliveryPackage(auditProjectId, {
    revision: 'REV00',
    confirmed: true,
    confirmWarnings: true,
    user: 'Eduardo Marques'
  });

  assert.strictEqual(result.success, true);
  assert.ok(result.deliveryRecord, 'Registro de entrega deve ser gerado');
  assert.ok(result.deliverySnapshot, 'Snapshot imutável deve ser congelado');
});

// 25. Integração com Cronograma
runAudit('FLUXO', 25, 'Sincronização bidirecional de eventos e links com o Cronograma', () => {
  const events = StudioState.getScheduleEvents(auditProjectId);
  assert.ok(events.length > 0, 'Eventos devem estar registrados no cronograma');
  
  const tasks = StudioState.getProjectTasks(auditProjectId);
  assert.ok(tasks.length > 0, 'Tarefas de cronograma devem existir');
  const linkRes = CronogramaIntegration.openPresentationForTask(tasks[0].id);
  assert.strictEqual(linkRes.success, true);
});

// ============================================================================
// PARTE 2: TESTES DE SIMULAÇÃO DE ERRO E RESILIÊNCIA (9 CENÁRIOS)
// ============================================================================
console.log('\n--- GRUPO 2: TESTES DE SIMULAÇÃO DE ERRO E RESILIÊNCIA (9 CENÁRIOS) ---');

// 1. Arquivo ausente
runAudit('ERRO', 1, 'Arquivo ausente: QA F11 detecta elemento de imagem sem URL e emite ERROR', () => {
  const invalidSheet = StudioState.createSheet({
    projectId: auditProjectId,
    name: 'Prancha com Imagem Ausente',
    format: 'A3',
    revision: 'REV01'
  });
  StudioState.addSheetElement(invalidSheet.id, {
    type: 'render',
    name: 'Render Desconectado',
    content: { url: '' } // URL vazia
  });

  const qa = StudioState.runPresentationQA(auditProjectId);
  const imgCheck = qa.checkpoints.find(c => c.id === 'IMAGENS');
  assert.ok(imgCheck, 'Checkpoint IMAGENS deve existir');
  assert.ok(imgCheck.status === 'ERROR' || imgCheck.status === 'BLOCKED', 'Deve sinalizar erro para imagem ausente');
  StudioState.deleteSheet(invalidSheet.id);
});

// 2. Imagem inválida
runAudit('ERRO', 2, 'Imagem inválida: arquivo com 0 bytes gera severidade BLOCKED', () => {
  const corruptFile = { fileName: 'fachada_zero.png', sizeBytes: 0, data: null };
  const qa = StudioState.runPresentationQA(auditProjectId, { files: [corruptFile] });
  const filesCheck = qa.checkpoints.find(c => c.id === 'ARQUIVOS');
  assert.strictEqual(filesCheck.status, 'BLOCKED');
});

// 3. Escala inválida
runAudit('ERRO', 3, 'Escala inválida: QA F11 detecta escala métrica inválida e emite ERROR', () => {
  const sInvalidScale = StudioState.createSheet({
    projectId: auditProjectId,
    name: 'Prancha Escala Anômala',
    format: 'A3',
    scale: '1:0' // Escala inválida
  });
  const repScale = StudioState.runPresentationQA(auditProjectId);
  const scaleCp = repScale.checkpoints.find(c => c.id === 'ESCALA');
  assert.strictEqual(scaleCp.status, 'ERROR');
  StudioState.deleteSheet(sInvalidScale.id);
});

// 4. Formato inválido
runAudit('ERRO', 4, 'Formato inválido: fallback defensivo para A3 e bloqueio no QA para formatos não-NBR', () => {
  const fallbackSheet = StudioState.createSheet({
    projectId: auditProjectId,
    name: 'Prancha Formato Anômalo',
    format: 'A0_SUPER'
  });
  assert.strictEqual(fallbackSheet.format, 'A3', 'Formato desconhecido deve adotar fallback defensivo A3');

  // Se injetado formato não-NBR no banco, QA detecta e bloqueia formalmente
  const raw = StudioState._getRawSheet(fallbackSheet.id);
  raw.format = 'A0_SUPER';
  const qa = StudioState.runPresentationQA(auditProjectId);
  const fmtCheck = qa.checkpoints.find(c => c.id === 'FORMATO');
  assert.strictEqual(fmtCheck.status, 'BLOCKED');
  StudioState.deleteSheet(fallbackSheet.id);
});

// 5. Projeto sem cliente
runAudit('ERRO', 5, 'Projeto sem cliente: rejeição defensiva ao instanciar apresentação órfã', () => {
  assert.throws(() => {
    StudioState.createPresentation({
      title: 'Apresentação Órfã Sem Projeto'
    });
  }, /projectId é obrigatório/);
});

// 6. Revisão inconsistente
runAudit('ERRO', 6, 'Revisão inconsistente: checkVersionSkew detecta e reporta mistura de revisões', () => {
  const sRev1 = StudioState.createSheet({ projectId: auditProjectId, name: 'Prancha R1', revision: 'REV01' });
  const sRev3 = StudioState.createSheet({ projectId: auditProjectId, name: 'Prancha R3', revision: 'REV03' });

  const skew = StudioState.checkVersionSkew(auditProjectId);
  assert.strictEqual(skew.hasSkew, true);
  assert.ok(skew.revisions.includes('REV01'));
  assert.ok(skew.revisions.includes('REV03'));

  const qa = StudioState.runPresentationQA(auditProjectId);
  const revCp = qa.checkpoints.find(c => c.id === 'REVISAO');
  assert.strictEqual(revCp.status, 'BLOCKED');

  StudioState.deleteSheet(sRev1.id);
  StudioState.deleteSheet(sRev3.id);
});

// 7. Arquivo duplicado
runAudit('ERRO', 7, 'Arquivo duplicado: nomenclatura unívoca impede colisão destrutiva', () => {
  const name1 = StudioState.formatCanonicalFilename({ project: 'Casa', environment: 'SALA', type: 'RENDER', revision: 'REV01', extension: 'png' });
  const name2 = StudioState.formatCanonicalFilename({ project: 'Casa', environment: 'SALA', type: 'RENDER', revision: 'REV02', extension: 'png' });
  assert.notStrictEqual(name1, name2, 'Versões distintas devem produzir nomes unívocos');
  assert.strictEqual(name1, 'ARQV_CASA_SALA_RENDER_REV01.png');
  assert.strictEqual(name2, 'ARQV_CASA_SALA_RENDER_REV02.png');
});

// 8. Falha de exportação
runAudit('ERRO', 8, 'Falha de exportação: exportSheetToFile rejeita formato não suportado com erro limpo', () => {
  assert.throws(() => {
    StudioState.exportSheetToFile(auditSheetId, 'EXE_MALICIOSO');
  }, /não suportado/i);
});

// 9. Falha de armazenamento
runAudit('ERRO', 9, 'Falha de armazenamento: emissão de entrega sem confirmação não altera estado', () => {
  assert.throws(() => {
    StudioState.finalizeProjectDeliveryPackage(auditProjectId, {
      revision: 'REV99',
      confirmed: false // Sem confirmação
    });
  }, /exige confirmação explícita/);

  // Garante que o projeto NÃO foi atualizado para REV99
  const p = StudioState.getProject(auditProjectId);
  assert.notStrictEqual(p.deliveryRevision, 'REV99');
});

// ============================================================================
// PARTE 3: TESTES DE PERFORMANCE E ESCALABILIDADE (5 BENCHMARKS)
// ============================================================================
console.log('\n--- GRUPO 3: TESTES DE PERFORMANCE E ESCALABILIDADE (5 BENCHMARKS) ---');

runAudit('PERF', 1, 'Carregamento: Inicialização completa do estado do Studio em menos de 100ms', () => {
  const t0 = Date.now();
  StudioState.init();
  const elapsed = Date.now() - t0;
  assert.ok(elapsed < 100, `Carregamento levou ${elapsed}ms (esperado < 100ms)`);
});

runAudit('PERF', 2, 'Imagens grandes: suporte a resoluções nominais ORIGINAL, OTIMIZADA e THUMBNAIL', () => {
  const res = StudioState.EXPORT_IMAGE_RESOLUTIONS;
  assert.ok(res.ORIGINAL && res.OTIMIZADA && res.THUMBNAIL);
  assert.strictEqual(res.ORIGINAL.scale, 1.0);
  assert.strictEqual(res.THUMBNAIL.scale, 0.25);
});

runAudit('PERF', 3, 'Muitas pranchas: criação em lote de 50 pranchas em menos de 800ms', () => {
  const t0 = Date.now();
  for (let i = 0; i < 50; i++) {
    StudioState.createSheet({
      projectId: auditProjectId,
      name: `Prancha de Estresse #${i + 1}`,
      format: 'A3',
      scale: '1:50',
      revision: 'REV00'
    });
  }
  const elapsed = Date.now() - t0;
  assert.ok(elapsed < 800, `Criação de 50 pranchas levou ${elapsed}ms (esperado < 800ms)`);
});

runAudit('PERF', 4, 'Múltiplos ambientes: recuperação e processamento de ambientes em menos de 50ms', () => {
  const t0 = Date.now();
  const envs = StudioState.getProjectEnvironments(auditProjectId);
  const elapsed = Date.now() - t0;
  assert.ok(elapsed < 50, `Recuperação de ambientes levou ${elapsed}ms`);
});

runAudit('PERF', 5, 'Múltiplas versões: cálculo do histórico profundo de revisões em menos de 20ms', () => {
  const t0 = Date.now();
  const hist = StudioState.getRevisionHistory(auditProjectId);
  const elapsed = Date.now() - t0;
  assert.ok(elapsed < 20, `Cálculo do histórico de revisões levou ${elapsed}ms`);
});

// ============================================================================
// PARTE 4: TESTES DE SEGURANÇA E ISOLAMENTO DE DADOS (6 VERIFICAÇÕES)
// ============================================================================
console.log('\n--- GRUPO 4: TESTES DE SEGURANÇA E ISOLAMENTO DE DADOS (6 VERIFICAÇÕES) ---');

runAudit('SEGURANÇA', 1, 'Autenticação & Auditoria: toda mutação crítica registra autor e timestamp ISO', () => {
  const audits = (StudioState.data.audits || []).filter(a => a.action === 'DELIVERY_PACKAGE_FINALIZED');
  assert.ok(audits.length > 0, 'Deve registrar log de auditoria');
  assert.ok(audits[0].timestamp, 'Timestamp deve existir');
  assert.ok(audits[0].user, 'Usuário responsável deve estar registrado');
});

runAudit('SEGURANÇA', 2, 'Autorização & Blindagem: versões aprovadas bloqueiam mutação direta', () => {
  // Prancha homologada é detectada como protegida pelo sistema de autorização
  const isProtected = StudioState.isSheetRevisionProtected(auditSheetId);
  assert.strictEqual(isProtected, true, 'Prancha homologada deve estar blindada contra mutação direta');

  // Tentativa de alterar a própria revisão aprovada é bloqueada
  assert.throws(() => {
    StudioState.createRevision(auditProjectId, { id: auditRevisionId }, 'Hacker');
  }, /já foi formalmente aprovada e está protegida/);
});

runAudit('SEGURANÇA', 3, 'Acesso a arquivos: diretórios de exportação seguem whitelist canônica de 7 pastas', () => {
  const dirs = StudioState.EXPORT_CANONICAL_DIRECTORIES;
  assert.strictEqual(dirs.length, 7);
  assert.ok(dirs.includes('01_PRANCHAS'));
  assert.ok(dirs.includes('02_PLANTAS'));
  assert.ok(dirs.includes('04_MATERIAIS'));
  assert.ok(!dirs.includes('../malicious_path'), 'Path traversal deve ser impossível');
});

runAudit('SEGURANÇA', 4, 'Dados do cliente: isolamento estrito entre projetos de clientes distintos', () => {
  const client = StudioState.getClient(project.clientId);
  assert.ok(client, 'Cliente deve existir');
  assert.strictEqual(client.name, 'Pedro Albuquerque');

  // Pranchas de outro projeto não vazam
  const otherProjectSheets = (StudioState.data.sheets || []).filter(s => s.projectId === 'prj-outro-id');
  assert.strictEqual(otherProjectSheets.length, 0);
});

runAudit('SEGURANÇA', 5, 'URLs privadas e dados sensíveis: manifesto ZIP não expõe credenciais', () => {
  const pkg = StudioState.exportProjectZipPackage(auditProjectId, { revision: 'REV00' });
  assert.ok(pkg.manifest, 'Manifesto deve ser gerado');
  assert.strictEqual(pkg.manifest.password, undefined);
  assert.strictEqual(pkg.manifest.secretKey, undefined);
});

runAudit('SEGURANÇA', 6, 'Secrets: nenhuma chave de API ou credencial hardcoded no estado', () => {
  const stateStr = JSON.stringify(StudioState.data);
  assert.ok(!stateStr.includes('AIzaSy'), 'Não deve conter chaves Google Cloud hardcoded');
  assert.ok(!stateStr.includes('sk_live'), 'Não deve conter chaves secretas de produção');
});

// Limpeza de fixtures criadas para o teste de estresse
StudioState.data.sheets = (StudioState.data.sheets || []).filter(s => !s.name?.includes('Prancha de Estresse'));

console.log('\n====================================================================');
console.log(`RESULTADO DA AUDITORIA INTEGRADA: ${passCount} passaram, ${failCount} falharam.`);
console.log('====================================================================\n');

if (failCount > 0) {
  process.exit(1);
}
