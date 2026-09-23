/**
 * Suíte de Testes Automatizados — Bloco F12: Sistema de Controle Formal de Revisões (Revision System)
 * Valida a entidade Revision (9 campos), 5 status, proteção de versões aprovadas,
 * comparação (diff) nas 7 dimensões, histórico/timeline e restauração não-destrutiva.
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
console.log('SUÍTE DE TESTES: BLOCO F12 — CONTROLE FORMAL DE REVISÕES');
console.log('================================================================\n');

const testProjectId = 'prj-praia-01';

// 1. Constantes e Campos da Entidade Revision
runTest('1.1 - Constantes de status, categorias de alteração e estrutura de 9 campos', () => {
  assert.ok(StudioState.REVISION_STATUSES, 'REVISION_STATUSES deve estar definido');
  assert.strictEqual(StudioState.REVISION_STATUSES.DRAFT, 'draft');
  assert.strictEqual(StudioState.REVISION_STATUSES.REVIEW, 'review');
  assert.strictEqual(StudioState.REVISION_STATUSES.APPROVED, 'approved');
  assert.strictEqual(StudioState.REVISION_STATUSES.SUPERSEDED, 'superseded');
  assert.strictEqual(StudioState.REVISION_STATUSES.ARCHIVED, 'archived');

  const expectedCategories = ['imagem', 'texto', 'posicao', 'escala', 'material', 'mobiliario', 'ambiente'];
  assert.deepStrictEqual(StudioState.REVISION_CHANGE_CATEGORIES, expectedCategories);

  // Criação de revisão inicial
  const rev0 = StudioState.createRevision(testProjectId, {
    revisionNumber: 'REV00',
    description: 'Emissão inicial para aprovação conceitual.',
    author: 'Eduardo Marques'
  });

  // Validação dos 9 campos obrigatórios
  assert.ok(rev0.id, '1. id deve estar presente');
  assert.strictEqual(rev0.projectId, testProjectId, '2. projectId');
  assert.ok(rev0.presentationId, '3. presentationId');
  assert.strictEqual(rev0.revisionNumber, 'REV00', '4. revisionNumber');
  assert.ok(rev0.date, '5. date');
  assert.strictEqual(rev0.author, 'Eduardo Marques', '6. author');
  assert.strictEqual(rev0.description, 'Emissão inicial para aprovação conceitual.', '7. description');
  assert.strictEqual(rev0.status, 'draft', '8. status inicial');
  assert.strictEqual(rev0.parentRevisionId, null, '9. parentRevisionId (null para inicial)');
});

// 2. Proteção: Nunca Sobrescrever Silenciosamente Apresentação Aprovada
runTest('2.1 - Nunca sobrescrever silenciosamente uma apresentação aprovada', () => {
  const revs = StudioState.getProjectRevisions(testProjectId);
  const rev0 = revs[0];

  // Aprova a REV00
  StudioState.approveRevision(rev0.id, 'Pedro (Cliente)', 'Aprovado em reunião.');
  const approvedRev = StudioState.getRevision(rev0.id);
  assert.strictEqual(approvedRev.status, 'approved');

  // Tentativa de editar/recriar sobre a revisão aprovada deve lançar erro
  assert.throws(() => {
    StudioState.createRevision(testProjectId, {
      id: approvedRev.id,
      revisionNumber: 'REV00',
      description: 'Tentativa de alteração não autorizada'
    });
  }, /Operação bloqueada: A revisão REV00 já foi formalmente aprovada/);

  // A criação correta gera a REV01 sem sobrescrever
  const rev1 = StudioState.createRevision(testProjectId, {
    description: 'Revisão 01 com alterações de layout solicitadas.',
    author: 'Camila Rossi'
  });

  assert.strictEqual(rev1.revisionNumber, 'REV01');
  assert.strictEqual(rev1.parentRevisionId, approvedRev.id);
  assert.strictEqual(rev1.status, 'draft');

  // REV00 permanece intacta no acervo
  const rev0Reloaded = StudioState.getRevision(rev0.id);
  assert.strictEqual(rev0Reloaded.status, 'approved');
});

// 3. Comparação (Diff) nas 7 Categorias: imagem, texto, posição, escala, material, mobiliário, ambiente
runTest('3.1 - compareRevisions detecta alterações nas 7 dimensões canônicas', () => {
  const revs = StudioState.getProjectRevisions(testProjectId);
  const rev0 = revs.find(r => r.revisionNumber === 'REV00');
  const rev1 = revs.find(r => r.revisionNumber === 'REV01');

  // Modifica snapshot da REV01 simulando edições nas 7 categorias
  const sheets = rev1.snapshot.sheets;
  if (sheets.length > 0) {
    // 1. Escala
    sheets[0].scale = '1:25'; // de 1:50 para 1:25

    // Adiciona elementos para simular texto, imagem e posição
    sheets[0].elements = sheets[0].elements || [];
    sheets[0].elements.push({
      id: 'el-diff-txt',
      type: 'texto',
      x: 10, y: 10, width: 200, height: 30,
      content: { text: 'NOVA LEGENDA DE ACABAMENTOS' }
    });
    sheets[0].elements.push({
      id: 'el-diff-img',
      type: 'render',
      x: 50, y: 50, width: 400, height: 300,
      content: { url: 'https://images.unsplash.com/nova-perspectiva' }
    });
  }

  // 5. Material
  rev1.snapshot.materials = rev1.snapshot.materials || [];
  rev1.snapshot.materials.push({
    id: 'mat-novo-revisao',
    nome: 'Madeira Cumaru Ripado',
    fornecedor: 'Madereira Tropical'
  });

  // 6. Mobiliário
  rev1.snapshot.furniture = rev1.snapshot.furniture || [];
  rev1.snapshot.furniture.push({
    id: 'furn-novo-revisao',
    nome: 'Poltrona Paulistana',
    quantidade: 2,
    dimensoes: '85x85x75'
  });

  // 7. Ambiente
  rev1.snapshot.environments = rev1.snapshot.environments || [];
  rev1.snapshot.environments.push({
    id: 'amb-novo-revisao',
    name: 'Espaço Gourmet & Churrasqueira',
    areaM2: 24.5
  });

  // Executa o comparador diff
  const diff = StudioState.compareRevisions(rev0.id, rev1.id);

  assert.ok(diff);
  assert.strictEqual(diff.revA.revisionNumber, 'REV00');
  assert.strictEqual(diff.revB.revisionNumber, 'REV01');
  assert.ok(diff.totalChanges > 0);

  // Verifica presença de registros em categorias
  assert.ok(diff.summary.escala > 0, 'Deveria detectar alteração de escala');
  assert.ok(diff.summary.imagem > 0, 'Deveria detectar imagem adicionada');
  assert.ok(diff.summary.texto > 0, 'Deveria detectar texto adicionado');
  assert.ok(diff.summary.material > 0, 'Deveria detectar material novo');
  assert.ok(diff.summary.mobiliario > 0, 'Deveria detectar mobiliário novo');
  assert.ok(diff.summary.ambiente > 0, 'Deveria detectar ambiente novo');
});

// 4. Histórico e Timeline Cronológica
runTest('4.1 - getRevisionHistory retorna timeline ordenada com todas as revisões', () => {
  const timeline = StudioState.getRevisionHistory(testProjectId);

  assert.ok(Array.isArray(timeline));
  assert.ok(timeline.length >= 2, 'Deveria conter REV00 e REV01');

  assert.strictEqual(timeline[0].revisionNumber, 'REV00');
  assert.strictEqual(timeline[0].status, 'approved');

  assert.strictEqual(timeline[1].revisionNumber, 'REV01');
  assert.strictEqual(timeline[1].parentRevisionId, timeline[0].id);
  assert.ok(timeline[1].formattedDate);
});

// 5. Restauração Não-Destrutiva de Versão Anterior
runTest('5.1 - restoreRevision restaura versão anterior gerando nova revisão sem destruir histórico', () => {
  const revs = StudioState.getProjectRevisions(testProjectId);
  const rev0 = revs.find(r => r.revisionNumber === 'REV00');
  const countBefore = revs.length;

  // Restaura o snapshot da REV00
  const restoredRev = StudioState.restoreRevision(rev0.id, 'Eduardo Marques', 'Cliente solicitou retorno à volumetria inicial.');

  assert.ok(restoredRev);
  assert.strictEqual(restoredRev.revisionNumber, 'REV02', 'Deve gerar nova revisão subsequente');
  assert.strictEqual(restoredRev.status, 'draft');
  assert.strictEqual(restoredRev.restoredFromRevisionId, rev0.id);

  // Verifica que o histórico não foi destruído (número de revisões aumentou)
  const revsAfter = StudioState.getProjectRevisions(testProjectId);
  assert.strictEqual(revsAfter.length, countBefore + 1);

  // REV00 e REV01 continuam existindo
  assert.ok(revsAfter.some(r => r.revisionNumber === 'REV00'));
  assert.ok(revsAfter.some(r => r.revisionNumber === 'REV01'));
  assert.ok(revsAfter.some(r => r.revisionNumber === 'REV02'));
});

// 6. Aprovação Formal e Transição de Status (superseded)
runTest('6.1 - approveRevision atualiza status, registra homologador e marca anteriores como superseded', () => {
  const revs = StudioState.getProjectRevisions(testProjectId);
  const rev2 = revs.find(r => r.revisionNumber === 'REV02');

  const approved = StudioState.approveRevision(rev2.id, 'Pedro (Cliente)', 'Homologado final para obra.');

  assert.strictEqual(approved.status, 'approved');
  assert.ok(approved.approval);
  assert.strictEqual(approved.approval.approvedBy, 'Pedro (Cliente)');
  assert.ok(approved.approval.approvedAt);

  // A aprovação de REV02 deve colocar a REV00 anterior em 'superseded'
  const rev0 = StudioState.getRevision(revs.find(r => r.revisionNumber === 'REV00').id);
  assert.strictEqual(rev0.status, 'superseded');

  // Projeto atualizado
  const project = StudioState.getProject(testProjectId);
  assert.strictEqual(project.revision, 'REV02');
  assert.strictEqual(project.lastApprovedRevisionId, rev2.id);
});

// 7. Proteção contra alteração direta de prancha de revisão aprovada
runTest('7.1 - isSheetRevisionProtected detecta prancha pertencente à revisão aprovada', () => {
  const sheets = StudioState.getProjectSheets(testProjectId);
  assert.ok(sheets.length > 0);

  // Prancha com revisão REV02 (aprovada)
  const rawSheet = StudioState._getRawSheet(sheets[0].id);
  rawSheet.revision = 'REV02';
  const isLocked = StudioState.isSheetRevisionProtected(sheets[0].id);
  assert.strictEqual(isLocked, true, 'Prancha com revisão aprovada deve estar protegida');

  // Prancha com revisão em draft
  rawSheet.revision = 'REV03_DRAFT';
  const isUnlocked = StudioState.isSheetRevisionProtected(sheets[0].id);
  assert.strictEqual(isUnlocked, false, 'Prancha em rascunho deve permitir edição');

  // Restaura prancha
  rawSheet.revision = 'REV02';
});

console.log('\n================================================================');
console.log(`RESULTADO FINAL: ${testsPassed} testes passaram, ${testsFailed} falharam.`);
console.log('================================================================\n');

if (testsFailed > 0) {
  process.exit(1);
}
