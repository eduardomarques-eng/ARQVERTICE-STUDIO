/**
 * Suíte de Testes Automatizados — Bloco F11: Sistema de Controle de Qualidade da Apresentação (Presentation QA Engine)
 * Executa testes rigorosos cobrindo os 20 checkpoints canônicos, 4 severidades (PASS, WARNING, ERROR, BLOCKED),
 * verificação de referências, skew de versão, escala, formato, carimbo, teste de abertura e bloqueio de entrega.
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
console.log('SUÍTE DE TESTES: BLOCO F11 — CONTROLE DE QUALIDADE DA APRESENTAÇÃO');
console.log('================================================================\n');

const testProjectId = 'prj-praia-01';

// 1. Constantes e Definição dos 20 Checkpoints Canônicos
runTest('1.1 - Constantes de severidade e catálogo dos 20 checkpoints estão definidos', () => {
  assert.ok(StudioState.QA_SEVERITY_LEVELS, 'QA_SEVERITY_LEVELS deve estar definido');
  assert.strictEqual(StudioState.QA_SEVERITY_LEVELS.PASS, 'PASS');
  assert.strictEqual(StudioState.QA_SEVERITY_LEVELS.WARNING, 'WARNING');
  assert.strictEqual(StudioState.QA_SEVERITY_LEVELS.ERROR, 'ERROR');
  assert.strictEqual(StudioState.QA_SEVERITY_LEVELS.BLOCKED, 'BLOCKED');

  assert.ok(Array.isArray(StudioState.QA_CHECKPOINTS), 'QA_CHECKPOINTS deve ser array');
  assert.strictEqual(StudioState.QA_CHECKPOINTS.length, 20, 'Devem existir exatamente 20 checkpoints');

  const expectedIds = [
    'DADOS_CLIENTE', 'NOME_PROJETO', 'AMBIENTE', 'REVISAO', 'DATA',
    'LOGO', 'CARIMBO', 'ESCALA', 'FORMATO', 'ORIENTACAO',
    'IMAGENS', 'PLANTAS', 'PERSPECTIVAS', 'MATERIAIS', 'MOBILIARIO',
    'QUANTITATIVOS', 'LINKS', 'ARQUIVOS', 'APROVACOES', 'INTEGRIDADE'
  ];

  expectedIds.forEach((id, idx) => {
    const cp = StudioState.QA_CHECKPOINTS[idx];
    assert.strictEqual(cp.id, id, `Checkpoint #${idx + 1} deve ser ${id}`);
    assert.strictEqual(cp.number, idx + 1);
    assert.ok(cp.name && cp.name.length > 0);
  });
});

// 2. Execução da Auditoria QA Completa dos 20 Itens
runTest('2.1 - runPresentationQA executa os 20 checkpoints e retorna relatório estruturado', () => {
  const report = StudioState.runPresentationQA(testProjectId, {
    deliveryRevision: 'REV01'
  });

  assert.ok(report);
  assert.strictEqual(report.projectId, testProjectId);
  assert.strictEqual(report.revisao, 'REV01');
  assert.strictEqual(report.checkpoints.length, 20, 'Relatório deve conter os 20 checkpoints');
  assert.ok(report.counts, 'Contadores de severidade devem estar presentes');
  assert.strictEqual(report.counts.total, 20);
  assert.ok(typeof report.isDeliveryAllowed === 'boolean');
});

// 3. Regra de Severidade: WARNING (Exemplo: Material sem fornecedor)
runTest('3.1 - Severidade WARNING: material sem fornecedor gera aviso não-bloqueante', () => {
  // Cadastra temporariamente material sem fornecedor
  const testMat = {
    id: 'mat-teste-sem-fornecedor',
    projectId: testProjectId,
    nome: 'Porcelanato Calacatta 120x120',
    fornecedor: '', // Vazio
    origem: 'projeto'
  };
  StudioState.data.canonicalMaterials = StudioState.data.canonicalMaterials || [];
  StudioState.data.canonicalMaterials.push(testMat);

  const report = StudioState.runPresentationQA(testProjectId, { deliveryRevision: 'REV01' });
  const matCp = report.checkpoints.find(c => c.id === 'MATERIAIS');

  assert.strictEqual(matCp.status, 'WARNING');
  assert.ok(matCp.message.includes('sem fornecedor'));

  // Limpa fixture
  StudioState.data.canonicalMaterials = StudioState.data.canonicalMaterials.filter(m => m.id !== testMat.id);
});

// 4. Regra de Severidade: ERROR (Exemplo: Imagem ausente)
runTest('4.1 - Severidade ERROR: elemento de imagem ausente gera erro na prancha', () => {
  const sheet = StudioState.createSheet({
    projectId: testProjectId,
    name: 'Prancha Teste Imagem Ausente',
    format: 'A3',
    orientation: 'landscape',
    scale: '1:50'
  });

  // Adiciona elemento imagem sem url nem content
  StudioState.addSheetElement(sheet.id, {
    type: 'render',
    x: 100, y: 100, width: 300, height: 200,
    content: {} // SEM URL
  });

  const report = StudioState.runPresentationQA(testProjectId, { deliveryRevision: 'REV01' });
  const imgCp = report.checkpoints.find(c => c.id === 'IMAGENS');

  assert.strictEqual(imgCp.status, 'ERROR');
  assert.ok(imgCp.message.includes('imagem ausente'));

  // Limpa fixture
  StudioState.deleteSheet(sheet.id);
});

// 5. Regra de Severidade: BLOCKED (Exemplo: Prancha aprovada possui arquivo inválido)
runTest('5.1 - Severidade BLOCKED: arquivo corrompido ou 0 bytes gera bloqueio fatal', () => {
  const corruptFile = {
    fileName: 'ARQV_CASA_PRAIA_SALA_PLANTA_REV01.pdf',
    sizeBytes: 0,
    data: null
  };

  const integrityCheck = StudioState.testExportFileIntegrity(corruptFile);
  assert.strictEqual(integrityCheck.isValid, false);

  const report = StudioState.runPresentationQA(testProjectId, {
    deliveryRevision: 'REV01',
    files: [corruptFile]
  });

  const filesCp = report.checkpoints.find(c => c.id === 'ARQUIVOS');
  assert.strictEqual(filesCp.status, 'BLOCKED');
  assert.strictEqual(report.hasBlockingErrors, true);
  assert.strictEqual(report.isDeliveryAllowed, false);
});

// 6. Verificação de Referências (Imagem inserida corresponde à versão aprovada)
runTest('6.1 - Verificação de referências: detecta render inserido desatualizado (V01 vs V03 homologado)', () => {
  const sheet = StudioState.createSheet({
    projectId: testProjectId,
    name: 'Prancha Render Desatualizado',
    format: 'A3',
    orientation: 'landscape',
    scale: '1:50'
  });

  // Insere render com versão V01 desatualizada (homologado é V03)
  StudioState.addSheetElement(sheet.id, {
    type: 'render',
    x: 50, y: 50, width: 400, height: 300,
    content: {
      url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0',
      renderId: 'rnd-sala-01',
      versionLabel: 'V01' // DESATUALIZADO
    }
  });

  const refCheck = StudioState.verifyImageReferenceVersions(testProjectId);
  assert.strictEqual(refCheck.isValid, false);
  assert.ok(refCheck.mismatches.length > 0);
  assert.strictEqual(refCheck.mismatches[0].usedVersion, 'V01');
  assert.strictEqual(refCheck.mismatches[0].approvedVersion, 'V03');

  const report = StudioState.runPresentationQA(testProjectId, { deliveryRevision: 'REV01' });
  const perspCp = report.checkpoints.find(c => c.id === 'PERSPECTIVAS');
  assert.strictEqual(perspCp.status, 'BLOCKED');

  // Limpa fixture
  StudioState.deleteSheet(sheet.id);
});

// 7. Consistência de Versão (Detecção de Mistura de Revisões REV Skew)
runTest('7.1 - checkVersionSkew detecta e bloqueia mistura de revisões (ex.: REV01 + REV03)', () => {
  const s1 = StudioState.createSheet({
    projectId: testProjectId,
    name: 'Prancha Revisao 01',
    format: 'A4',
    orientation: 'portrait',
    scale: '1:50',
    revision: 'REV01'
  });

  const s2 = StudioState.createSheet({
    projectId: testProjectId,
    name: 'Prancha Revisao 03',
    format: 'A4',
    orientation: 'portrait',
    scale: '1:50',
    revision: 'REV03' // MISTURA
  });

  const skewCheck = StudioState.checkVersionSkew(testProjectId);
  assert.strictEqual(skewCheck.hasSkew, true);
  assert.ok(skewCheck.revisions.includes('REV01'));
  assert.ok(skewCheck.revisions.includes('REV03'));

  const report = StudioState.runPresentationQA(testProjectId);
  const revCp = report.checkpoints.find(c => c.id === 'REVISAO');
  assert.strictEqual(revCp.status, 'BLOCKED');

  // Limpa fixtures
  StudioState.deleteSheet(s1.id);
  StudioState.deleteSheet(s2.id);
});

// 8. Escala e Formato
runTest('8.1 - Escala e Formato: valida configuração e rejeita formatos desconhecidos', () => {
  const sInvalidScale = StudioState.createSheet({
    projectId: testProjectId,
    name: 'Prancha Escala Invalida',
    format: 'A3',
    orientation: 'landscape',
    scale: '1:0' // INVALIDA
  });

  const repScale = StudioState.runPresentationQA(testProjectId, { deliveryRevision: 'REV01' });
  const scaleCp = repScale.checkpoints.find(c => c.id === 'ESCALA');
  assert.strictEqual(scaleCp.status, 'ERROR');

  StudioState.deleteSheet(sInvalidScale.id);

  // Formato inválido: simula prancha com formato corrompido
  const sInvalidFormat = StudioState.createSheet({
    projectId: testProjectId,
    name: 'Prancha Formato Bizarro',
    format: 'A3',
    orientation: 'landscape',
    scale: '1:50'
  });
  const rawSheet = StudioState._getRawSheet(sInvalidFormat.id);
  rawSheet.format = 'CUSTOM_INVALID';

  const repFormat = StudioState.runPresentationQA(testProjectId, { deliveryRevision: 'REV00' });
  const formatCp = repFormat.checkpoints.find(c => c.id === 'FORMATO');
  assert.strictEqual(formatCp.status, 'BLOCKED');

  StudioState.deleteSheet(sInvalidFormat.id);
});

// 9. Carimbo Técnico F05
runTest('9.1 - Carimbo: bloqueia se prancha estiver sem Responsável Técnico', () => {
  const sNoResp = StudioState.createSheet({
    projectId: testProjectId,
    name: 'Prancha Sem Responsável',
    format: 'A3',
    orientation: 'landscape',
    scale: '1:50',
    titleblock: {
      escritorio: 'ArqVértice',
      // sem arquitetoLider, sem responsavelTecnico
    }
  });

  // Temporariamente remove author e leadArchitect do projeto
  const project = StudioState.getProject(testProjectId);
  const originalAuthor = project.author;
  const originalLead = project.leadArchitect;
  project.author = null;
  project.leadArchitect = null;

  const rep = StudioState.runPresentationQA(testProjectId, { deliveryRevision: 'REV00' });
  const tbCp = rep.checkpoints.find(c => c.id === 'CARIMBO');
  assert.strictEqual(tbCp.status, 'BLOCKED');

  // Restaura e limpa
  project.author = originalAuthor;
  project.leadArchitect = originalLead;
  StudioState.deleteSheet(sNoResp.id);
});

// 10. Regra de Aprovação e Bloqueio em finalizeDelivery
runTest('10.1 - finalizeDelivery bloqueia categoricamente se houver BLOCKED e exige confirmação para WARNING', () => {
  // Simula arquivo corrompido para forçar BLOCKED
  assert.throws(() => {
    StudioState.finalizeDelivery(testProjectId, {
      deliveryRevision: 'REV01',
      files: [{ fileName: 'corrupt.pdf', sizeBytes: 0 }]
    });
  }, /Entrega bloqueada: foram encontrados erros impeditivos/);

  // Teste de exigência de confirmação explícita para WARNINGs
  const validReport = StudioState.runPresentationQA(testProjectId, { deliveryRevision: 'REV00' });
  if (validReport.counts.WARNING > 0) {
    assert.throws(() => {
      StudioState.finalizeDelivery(testProjectId, {
        deliveryRevision: 'REV00',
        confirmWarnings: false // NÃO CONFIRMADO
      });
    }, /Entrega requer confirmação explícita do arquiteto/);

    // Com confirmação explícita: deve ter sucesso!
    const delivery = StudioState.finalizeDelivery(testProjectId, {
      deliveryRevision: 'REV00',
      confirmWarnings: true, // CONFIRMADO
      user: 'Camila Rossi'
    });

    assert.strictEqual(delivery.success, true);
    assert.strictEqual(delivery.deliveryRecord.revisao, 'REV00');
    assert.strictEqual(delivery.deliveryRecord.warningsConfirmed, true);
    assert.strictEqual(delivery.deliveryRecord.user, 'Camila Rossi');
  }
});

console.log('\n================================================================');
console.log(`RESULTADO FINAL: ${testsPassed} testes passaram, ${testsFailed} falharam.`);
console.log('================================================================\n');

if (testsFailed > 0) {
  process.exit(1);
}
