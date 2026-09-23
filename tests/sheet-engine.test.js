/**
 * ============================================================================
 * SUÍTE DE TESTES: BLOCO F02 — MOTOR DE PRANCHAS (SHEET ENGINE)
 * Validação rigorosa dos critérios de aceite da especificação F02
 * ============================================================================
 */

const assert = require('assert');

// Mock do ambiente de navegador
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

let testsPassed = 0;
let testsFailed = 0;

function runTest(description, fn) {
  try {
    fn();
    console.log(`  \x1b[32m✔\x1b[0m [PASS] ${description}`);
    testsPassed++;
  } catch (err) {
    console.error(`  \x1b[31m✖\x1b[0m [FAIL] ${description}`);
    console.error(`     Mensagem: ${err.message}`);
    console.error(err.stack);
    testsFailed++;
  }
}

console.log('\n================================================================');
console.log(' INICIANDO SUÍTE DE TESTES: BLOCO F02 - MOTOR DE PRANCHAS');
console.log('================================================================\n');

// 1. Inicialização do estado
StudioState.init();
const projectId = 'prj-praia-01';

// ----------------------------------------------------------------------------
// GRUPO 1: ENTIDADE SHEET E CRIAÇÃO
// ----------------------------------------------------------------------------
console.log('\n--- GRUPO 1: ENTIDADE SHEET E CRIAÇÃO ---');

runTest('1.1 Deve existir a coleção de pranchas e a prancha semente sheet-praia-01', () => {
  const seedSheet = StudioState.getSheet('sheet-praia-01');
  assert(seedSheet, 'Prancha semente deve existir');
  assert.strictEqual(seedSheet.projectId, projectId);
  assert.strictEqual(seedSheet.format, 'A3');
  assert(seedSheet.elements && seedSheet.elements.length >= 5, 'Deve conter elementos sementes');
});

runTest('1.2 Deve criar nova Sheet com todos os 16 campos canônicos', () => {
  const created = StudioState.createSheet({
    projectId,
    name: 'Prancha Executiva de Detalhamento',
    sheetNumber: 'PR-10',
    title: 'PROJETO RESIDENCIAL PRAIA',
    subtitle: 'DETALHAMENTO CONSTRUTIVO',
    format: 'A1',
    orientation: 'landscape',
    scale: '1:25',
    background: '#ffffff',
    revision: 'R01',
    status: 'em_revisao',
    sortOrder: 10
  });

  assert(created.id, 'Deve ter ID gerado');
  assert.strictEqual(created.projectId, projectId);
  assert.strictEqual(created.name, 'Prancha Executiva de Detalhamento');
  assert.strictEqual(created.sheetNumber, 'PR-10');
  assert.strictEqual(created.title, 'PROJETO RESIDENCIAL PRAIA');
  assert.strictEqual(created.subtitle, 'DETALHAMENTO CONSTRUTIVO');
  assert.strictEqual(created.format, 'A1');
  assert.strictEqual(created.orientation, 'landscape');
  assert.strictEqual(created.scale, '1:25');
  assert.strictEqual(created.background, '#ffffff');
  assert.strictEqual(created.revision, 'R01');
  assert.strictEqual(created.status, 'em_revisao');
  assert.strictEqual(created.sortOrder, 10);
  assert(created.createdAt, 'Deve conter createdAt');
  assert(created.updatedAt, 'Deve conter updatedAt');
  assert(created.dimensions.widthPx > 0, 'Deve calcular dimensões nominais da prancha');
});

runTest('1.3 Deve atualizar metadados da Sheet com sucesso', () => {
  const sheet = StudioState.createSheet({ projectId, name: 'Prancha Teste Update' });
  const updated = StudioState.updateSheet(sheet.id, {
    name: 'Prancha Renomeada',
    scale: '1:100',
    status: 'aprovada',
    revision: 'R02'
  });

  assert.strictEqual(updated.name, 'Prancha Renomeada');
  assert.strictEqual(updated.scale, '1:100');
  assert.strictEqual(updated.status, 'aprovada');
  assert.strictEqual(updated.revision, 'R02');
});

runTest('1.4 Deve excluir uma Sheet e seus elementos associados em cascata', () => {
  const sheet = StudioState.createSheet({ projectId, name: 'Para Excluir' });
  StudioState.addSheetElement(sheet.id, { type: 'texto', content: { text: 'Temp' } });

  const delResult = StudioState.deleteSheet(sheet.id);
  assert.strictEqual(delResult, true);
  assert.strictEqual(StudioState.getSheet(sheet.id), null);
  const orphanElements = (StudioState.data.sheetElements || []).filter(el => el.sheetId === sheet.id);
  assert.strictEqual(orphanElements.length, 0, 'Elementos da prancha devem ser removidos');
});

// ----------------------------------------------------------------------------
// GRUPO 2: ELEMENTOS DA PRANCHA (24 TIPOS)
// ----------------------------------------------------------------------------
console.log('\n--- GRUPO 2: ELEMENTOS DA PRANCHA (24 TIPOS) ---');

runTest('2.1 Deve suportar a inserção de todos os 24 tipos canônicos de elementos', () => {
  const sheet = StudioState.createSheet({ projectId, name: 'Prancha dos 24 Elementos' });
  const types = [
    'texto', 'titulo', 'subtitulo', 'imagem', 'planta',
    'planta_humanizada', 'perspectiva', 'render', 'elevacao', 'corte',
    'detalhe', 'tabela', 'mobiliario', 'material', 'legenda',
    'cota', 'simbolo', 'norte', 'escala_grafica', 'carimbo',
    'logo', 'linha', 'retangulo', 'separador'
  ];

  types.forEach((t, idx) => {
    const el = StudioState.addSheetElement(sheet.id, {
      type: t,
      x: idx * 10,
      y: idx * 10,
      width: 150,
      height: 80,
      content: { note: `Elemento ${t}` }
    });
    assert.strictEqual(el.type, t);
    assert.strictEqual(el.sheetId, sheet.id);
  });

  const enriched = StudioState.getSheet(sheet.id);
  assert.strictEqual(enriched.elements.length, 24, 'Deve conter todos os 24 elementos');
});

// ----------------------------------------------------------------------------
// GRUPO 3: POSICIONAMENTO E RESIZE
// ----------------------------------------------------------------------------
console.log('\n--- GRUPO 3: POSICIONAMENTO E RESIZE ---');

runTest('3.1 Deve movimentar elemento atualizando x e y (moveSheetElement)', () => {
  const sheet = StudioState.createSheet({ projectId, name: 'Prancha Move' });
  const el = StudioState.addSheetElement(sheet.id, { type: 'texto', x: 50, y: 50 });

  const moved = StudioState.moveSheetElement(el.id, 120, 200);
  assert.strictEqual(moved.x, 120);
  assert.strictEqual(moved.y, 200);
});

runTest('3.2 Deve redimensionar elemento atualizando width e height (resizeSheetElement)', () => {
  const sheet = StudioState.createSheet({ projectId, name: 'Prancha Resize' });
  const el = StudioState.addSheetElement(sheet.id, { type: 'retangulo', width: 100, height: 80 });

  const resized = StudioState.resizeSheetElement(el.id, 350, 220);
  assert.strictEqual(resized.width, 350);
  assert.strictEqual(resized.height, 220);
});

runTest('3.3 Deve rotacionar elemento (rotateSheetElement) e normalizar entre 0 e 359 graus', () => {
  const sheet = StudioState.createSheet({ projectId, name: 'Prancha Rotate' });
  const el = StudioState.addSheetElement(sheet.id, { type: 'norte', rotation: 0 });

  const r1 = StudioState.rotateSheetElement(el.id, 45);
  assert.strictEqual(r1.rotation, 45);

  const r2 = StudioState.rotateSheetElement(el.id, 390); // 390 % 360 = 30
  assert.strictEqual(r2.rotation, 30);
});

// ----------------------------------------------------------------------------
// GRUPO 4: ALINHAMENTO E DISTRIBUIÇÃO (8 OPERAÇÕES)
// ----------------------------------------------------------------------------
console.log('\n--- GRUPO 4: ALINHAMENTO E DISTRIBUIÇÃO (8 OPERAÇÕES) ---');

runTest('4.1 Deve alinhar à Esquerda (left)', () => {
  const sheet = StudioState.createSheet({ projectId, name: 'Align Left' });
  const e1 = StudioState.addSheetElement(sheet.id, { type: 'retangulo', x: 100, y: 50, width: 80, height: 50 });
  const e2 = StudioState.addSheetElement(sheet.id, { type: 'retangulo', x: 40, y: 150, width: 80, height: 50 });
  const e3 = StudioState.addSheetElement(sheet.id, { type: 'retangulo', x: 200, y: 250, width: 80, height: 50 });

  StudioState.alignSheetElements(sheet.id, [e1.id, e2.id, e3.id], 'left');

  const after = StudioState.getSheet(sheet.id).elements;
  assert.strictEqual(after.find(e => e.id === e1.id).x, 40);
  assert.strictEqual(after.find(e => e.id === e2.id).x, 40);
  assert.strictEqual(after.find(e => e.id === e3.id).x, 40);
});

runTest('4.2 Deve alinhar à Direita (right)', () => {
  const sheet = StudioState.createSheet({ projectId, name: 'Align Right' });
  const e1 = StudioState.addSheetElement(sheet.id, { type: 'retangulo', x: 100, y: 50, width: 100, height: 50 }); // right: 200
  const e2 = StudioState.addSheetElement(sheet.id, { type: 'retangulo', x: 150, y: 150, width: 150, height: 50 }); // right: 300 (max)
  const e3 = StudioState.addSheetElement(sheet.id, { type: 'retangulo', x: 50, y: 250, width: 50, height: 50 });   // right: 100

  StudioState.alignSheetElements(sheet.id, [e1.id, e2.id, e3.id], 'right');

  const after = StudioState.getSheet(sheet.id).elements;
  // max right é 300
  assert.strictEqual(after.find(e => e.id === e1.id).x, 300 - 100); // 200
  assert.strictEqual(after.find(e => e.id === e2.id).x, 300 - 150); // 150
  assert.strictEqual(after.find(e => e.id === e3.id).x, 300 - 50);  // 250
});

runTest('4.3 Deve alinhar ao Topo (top)', () => {
  const sheet = StudioState.createSheet({ projectId, name: 'Align Top' });
  const e1 = StudioState.addSheetElement(sheet.id, { type: 'retangulo', x: 50, y: 80, width: 60, height: 40 });
  const e2 = StudioState.addSheetElement(sheet.id, { type: 'retangulo', x: 150, y: 30, width: 60, height: 40 }); // min y = 30
  const e3 = StudioState.addSheetElement(sheet.id, { type: 'retangulo', x: 250, y: 120, width: 60, height: 40 });

  StudioState.alignSheetElements(sheet.id, [e1.id, e2.id, e3.id], 'top');

  const after = StudioState.getSheet(sheet.id).elements;
  assert.strictEqual(after.find(e => e.id === e1.id).y, 30);
  assert.strictEqual(after.find(e => e.id === e2.id).y, 30);
  assert.strictEqual(after.find(e => e.id === e3.id).y, 30);
});

runTest('4.4 Deve alinhar à Base (bottom)', () => {
  const sheet = StudioState.createSheet({ projectId, name: 'Align Bottom' });
  const e1 = StudioState.addSheetElement(sheet.id, { type: 'retangulo', x: 50, y: 50, width: 60, height: 100 }); // bottom 150
  const e2 = StudioState.addSheetElement(sheet.id, { type: 'retangulo', x: 150, y: 50, width: 60, height: 200 }); // bottom 250 (max)
  const e3 = StudioState.addSheetElement(sheet.id, { type: 'retangulo', x: 250, y: 50, width: 60, height: 50 });  // bottom 100

  StudioState.alignSheetElements(sheet.id, [e1.id, e2.id, e3.id], 'bottom');

  const after = StudioState.getSheet(sheet.id).elements;
  assert.strictEqual(after.find(e => e.id === e1.id).y, 250 - 100); // 150
  assert.strictEqual(after.find(e => e.id === e2.id).y, 250 - 200); // 50
  assert.strictEqual(after.find(e => e.id === e3.id).y, 250 - 50);  // 200
});

runTest('4.5 Deve Centralizar Horizontalmente (center_h)', () => {
  const sheet = StudioState.createSheet({ projectId, name: 'Align Center H' });
  const e1 = StudioState.addSheetElement(sheet.id, { type: 'retangulo', x: 100, y: 50, width: 100, height: 50 }); // center X = 150
  const e2 = StudioState.addSheetElement(sheet.id, { type: 'retangulo', x: 250, y: 150, width: 100, height: 50 }); // center X = 300
  // avg center = (150 + 300) / 2 = 225

  StudioState.alignSheetElements(sheet.id, [e1.id, e2.id], 'center_h');

  const after = StudioState.getSheet(sheet.id).elements;
  assert.strictEqual(after.find(e => e.id === e1.id).x, 225 - 50); // 175
  assert.strictEqual(after.find(e => e.id === e2.id).x, 225 - 50); // 175
});

runTest('4.6 Deve Centralizar Verticalmente (center_v)', () => {
  const sheet = StudioState.createSheet({ projectId, name: 'Align Center V' });
  const e1 = StudioState.addSheetElement(sheet.id, { type: 'retangulo', x: 50, y: 100, width: 60, height: 100 }); // center Y = 150
  const e2 = StudioState.addSheetElement(sheet.id, { type: 'retangulo', x: 150, y: 200, width: 60, height: 100 }); // center Y = 250
  // avg center = 200

  StudioState.alignSheetElements(sheet.id, [e1.id, e2.id], 'center_v');

  const after = StudioState.getSheet(sheet.id).elements;
  assert.strictEqual(after.find(e => e.id === e1.id).y, 200 - 50); // 150
  assert.strictEqual(after.find(e => e.id === e2.id).y, 200 - 50); // 150
});

runTest('4.7 Deve Distribuir Horizontalmente com espaçamento regular', () => {
  const sheet = StudioState.createSheet({ projectId, name: 'Distribute H' });
  // first: x=0, w=100
  const e1 = StudioState.addSheetElement(sheet.id, { type: 'retangulo', x: 0, y: 50, width: 100, height: 50 });
  // mid
  const e2 = StudioState.addSheetElement(sheet.id, { type: 'retangulo', x: 40, y: 50, width: 100, height: 50 });
  // last: x=400, w=100 (available space = 400 - 100 = 300, mid width = 100, gap = (300 - 100)/2 = 100)
  const e3 = StudioState.addSheetElement(sheet.id, { type: 'retangulo', x: 400, y: 50, width: 100, height: 50 });

  StudioState.distributeSheetElements(sheet.id, [e1.id, e2.id, e3.id], 'horizontal');

  const after = StudioState.getSheet(sheet.id).elements;
  assert.strictEqual(after.find(e => e.id === e1.id).x, 0);
  assert.strictEqual(after.find(e => e.id === e2.id).x, 200); // 0 + 100 + 100 = 200
  assert.strictEqual(after.find(e => e.id === e3.id).x, 400);
});

runTest('4.8 Deve Distribuir Verticalmente com espaçamento regular', () => {
  const sheet = StudioState.createSheet({ projectId, name: 'Distribute V' });
  const e1 = StudioState.addSheetElement(sheet.id, { type: 'retangulo', x: 50, y: 0, width: 50, height: 100 });
  const e2 = StudioState.addSheetElement(sheet.id, { type: 'retangulo', x: 50, y: 50, width: 50, height: 100 });
  const e3 = StudioState.addSheetElement(sheet.id, { type: 'retangulo', x: 50, y: 400, width: 50, height: 100 });

  StudioState.distributeSheetElements(sheet.id, [e1.id, e2.id, e3.id], 'vertical');

  const after = StudioState.getSheet(sheet.id).elements;
  assert.strictEqual(after.find(e => e.id === e1.id).y, 0);
  assert.strictEqual(after.find(e => e.id === e2.id).y, 200);
  assert.strictEqual(after.find(e => e.id === e3.id).y, 400);
});

// ----------------------------------------------------------------------------
// GRUPO 5: AGRUPAMENTO E MOVIMENTAÇÃO COORDENADA
// ----------------------------------------------------------------------------
console.log('\n--- GRUPO 5: AGRUPAMENTO E MOVIMENTAÇÃO COORDENADA ---');

runTest('5.1 Deve agrupar elementos (Imagem + legenda + título)', () => {
  const sheet = StudioState.createSheet({ projectId, name: 'Grouping Test' });
  const img = StudioState.addSheetElement(sheet.id, { type: 'imagem', x: 50, y: 50, width: 200, height: 150 });
  const leg = StudioState.addSheetElement(sheet.id, { type: 'legenda', x: 50, y: 210, width: 200, height: 40 });
  const tit = StudioState.addSheetElement(sheet.id, { type: 'titulo', x: 50, y: 20, width: 200, height: 30 });

  const res = StudioState.groupSheetElements(sheet.id, [img.id, leg.id, tit.id], 'Bloco Visual 01');

  assert(res.group.id, 'Grupo deve ser criado');
  assert.strictEqual(res.group.name, 'Bloco Visual 01');

  const enriched = StudioState.getSheet(sheet.id);
  const groupedElements = enriched.elements.filter(e => e.groupId === res.group.id);
  assert.strictEqual(groupedElements.length, 3);
});

runTest('5.2 Movimentar um elemento do grupo deve transladar todos os membros do grupo mantendo offset', () => {
  const sheet = StudioState.createSheet({ projectId, name: 'Group Move Test' });
  const elA = StudioState.addSheetElement(sheet.id, { type: 'retangulo', x: 100, y: 100, width: 50, height: 50 });
  const elB = StudioState.addSheetElement(sheet.id, { type: 'retangulo', x: 200, y: 150, width: 50, height: 50 });

  const res = StudioState.groupSheetElements(sheet.id, [elA.id, elB.id], 'Par A-B');

  // Move elA de (100, 100) para (150, 180) -> dx=+50, dy=+80
  StudioState.moveSheetElement(elA.id, 150, 180);

  const afterA = StudioState.getSheetElement(elA.id);
  const afterB = StudioState.getSheetElement(elB.id);

  assert.strictEqual(afterA.x, 150);
  assert.strictEqual(afterA.y, 180);
  assert.strictEqual(afterB.x, 250, 'Elemento B deve ter sido deslocado de dx=+50');
  assert.strictEqual(afterB.y, 230, 'Elemento B deve ter sido deslocado de dy=+80');
});

runTest('5.3 Deve desagrupar elementos mantendo posições intactas', () => {
  const sheet = StudioState.createSheet({ projectId, name: 'Ungroup Test' });
  const elA = StudioState.addSheetElement(sheet.id, { type: 'retangulo', x: 50, y: 50 });
  const elB = StudioState.addSheetElement(sheet.id, { type: 'retangulo', x: 150, y: 50 });

  const res = StudioState.groupSheetElements(sheet.id, [elA.id, elB.id], 'Grupo Temp');
  const ungrouped = StudioState.ungroupSheetElements(sheet.id, res.group.id);
  assert.strictEqual(ungrouped, true);

  const afterA = StudioState.getSheetElement(elA.id);
  const afterB = StudioState.getSheetElement(elB.id);
  assert.strictEqual(afterA.groupId, null);
  assert.strictEqual(afterB.groupId, null);
});

// ----------------------------------------------------------------------------
// GRUPO 6: BLOQUEIOS (LOCKS)
// ----------------------------------------------------------------------------
console.log('\n--- GRUPO 6: BLOQUEIOS (LOCKS) ---');

runTest('6.1 Bloqueio de posição (lockPosition) deve impedir movimentação', () => {
  const sheet = StudioState.createSheet({ projectId, name: 'Lock Pos' });
  const el = StudioState.addSheetElement(sheet.id, { type: 'texto', x: 40, y: 40, lockPosition: true });

  assert.throws(() => {
    StudioState.moveSheetElement(el.id, 200, 200);
  }, /bloqueio de posição/i);
});

runTest('6.2 Bloqueio de tamanho (lockSize) deve impedir resize', () => {
  const sheet = StudioState.createSheet({ projectId, name: 'Lock Size' });
  const el = StudioState.addSheetElement(sheet.id, { type: 'tabela', width: 300, height: 150, lockSize: true });

  assert.throws(() => {
    StudioState.resizeSheetElement(el.id, 500, 300);
  }, /bloqueio de dimensionamento/i);
});

runTest('6.3 Bloqueio total (locked) deve impedir exclusão, rotação e transform', () => {
  const sheet = StudioState.createSheet({ projectId, name: 'Full Lock' });
  const el = StudioState.addSheetElement(sheet.id, { type: 'carimbo', locked: true });

  assert.throws(() => {
    StudioState.deleteSheetElement(el.id);
  }, /bloqueado e não pode ser excluído/i);

  assert.throws(() => {
    StudioState.rotateSheetElement(el.id, 90);
  }, /bloqueado/i);
});

runTest('6.4 Bloqueio de grupo deve impedir mover qualquer membro do grupo', () => {
  const sheet = StudioState.createSheet({ projectId, name: 'Group Lock Test' });
  const el1 = StudioState.addSheetElement(sheet.id, { type: 'imagem', x: 50, y: 50 });
  const el2 = StudioState.addSheetElement(sheet.id, { type: 'texto', x: 50, y: 220 });

  const res = StudioState.groupSheetElements(sheet.id, [el1.id, el2.id], 'Grupo Bloqueado');
  StudioState.lockSheetGroup(sheet.id, res.group.id, true);

  assert.throws(() => {
    StudioState.moveSheetElement(el1.id, 100, 100);
  }, /(bloqueio|bloqueado)/i);
});

// ----------------------------------------------------------------------------
// GRUPO 7: DUPLICAÇÃO (ELEMENTO, GRUPO, PRANCHA)
// ----------------------------------------------------------------------------
console.log('\n--- GRUPO 7: DUPLICAÇÃO (ELEMENTO, GRUPO, PRANCHA) ---');

runTest('7.1 Deve duplicar elemento com novo ID e offset de posição', () => {
  const sheet = StudioState.createSheet({ projectId, name: 'Dup Element Test' });
  const el = StudioState.addSheetElement(sheet.id, { type: 'norte', x: 100, y: 100, width: 60, height: 60 });

  const dup = StudioState.duplicateSheetElement(el.id, { x: 25, y: 25 });
  assert(dup.id && dup.id !== el.id, 'Novo ID deve ser gerado');
  assert.strictEqual(dup.x, 125);
  assert.strictEqual(dup.y, 125);
  assert.strictEqual(dup.width, 60);
});

runTest('7.2 Deve duplicar grupo preservando relacionamentos internos', () => {
  const sheet = StudioState.createSheet({ projectId, name: 'Dup Group Test' });
  const el1 = StudioState.addSheetElement(sheet.id, { type: 'render', x: 50, y: 50 });
  const el2 = StudioState.addSheetElement(sheet.id, { type: 'subtitulo', x: 50, y: 260 });

  const grpRes = StudioState.groupSheetElements(sheet.id, [el1.id, el2.id], 'Conjunto Render');
  const dupGrpRes = StudioState.duplicateSheetGroup(sheet.id, grpRes.group.id, { x: 40, y: 40 });

  assert(dupGrpRes.group.id !== grpRes.group.id, 'Novo grupo deve ser criado');
  assert.strictEqual(dupGrpRes.elements.length, 2);
  assert.strictEqual(dupGrpRes.elements[0].groupId, dupGrpRes.group.id);
  assert.strictEqual(dupGrpRes.elements[1].groupId, dupGrpRes.group.id);
});

runTest('7.3 Deve duplicar Prancha inteira com todos os seus elementos e grupos', () => {
  const original = StudioState.createSheet({ projectId, name: 'Prancha Mestre', format: 'A2' });
  const e1 = StudioState.addSheetElement(original.id, { type: 'titulo', x: 40, y: 40 });
  const e2 = StudioState.addSheetElement(original.id, { type: 'planta', x: 40, y: 100 });
  StudioState.groupSheetElements(original.id, [e1.id, e2.id], 'Cabeçalho');

  const cloned = StudioState.duplicateSheet(original.id, 'Prancha Mestre Duplicada');

  assert(cloned.id !== original.id);
  assert.strictEqual(cloned.name, 'Prancha Mestre Duplicada');
  assert.strictEqual(cloned.format, 'A2');
  assert.strictEqual(cloned.elements.length, 2);
  assert.strictEqual(cloned.groups.length, 1);
  assert(cloned.elements[0].sheetId === cloned.id);
  assert(cloned.elements[0].groupId === cloned.groups[0].id);
});

// ----------------------------------------------------------------------------
// GRUPO 8: SISTEMA DE TEMPLATES (TODOS OS 11 TIPOS)
// ----------------------------------------------------------------------------
console.log('\n--- GRUPO 8: SISTEMA DE TEMPLATES (TODOS OS 11 TIPOS) ---');

const allTemplates = [
  'apresentacao_geral', 'ambiente', 'planta_humanizada', 'perspectiva',
  'moodboard', 'materiais', 'mobiliario', 'quantitativos',
  'estudo', 'revisao', 'entrega'
];

allTemplates.forEach((tmpl, i) => {
  runTest(`8.${i + 1} Template: ${tmpl} deve ser aplicado com integridade e elementos editáveis`, () => {
    const sheet = StudioState.createSheet({ projectId, name: `Sheet Template ${tmpl}`, format: 'A3' });
    const applied = StudioState.applySheetTemplate(sheet.id, tmpl, {
      projectName: 'Residência ArqVértice Teste',
      clientName: 'Cliente Validação'
    });

    assert(applied.elements.length >= 3, `Template ${tmpl} deve gerar elementos na prancha`);

    // Verifica que carimbo ou selo foi incluído
    const hasCarimbo = applied.elements.some(e => e.type === 'carimbo');
    assert(hasCarimbo, `Template ${tmpl} deve conter elemento de carimbo`);

    // Valida que template é flexível (não rígido): podemos mover e editar livremente
    const firstEl = applied.elements[0];
    const moved = StudioState.moveSheetElement(firstEl.id, 100, 100);
    assert.strictEqual(moved.x, 100);
  });
});

// ----------------------------------------------------------------------------
// GRUPO 9: PERFORMANCE, LAZY LOADING E PREVIEW
// ----------------------------------------------------------------------------
console.log('\n--- GRUPO 9: PERFORMANCE, LAZY LOADING E PREVIEW ---');

runTest('9.1 Renderização dos elementos de imagem deve utilizar lazy loading e tags otimizadas', () => {
  const SheetEngineModule = require('../js/sheet-engine-module.js');
  const project = StudioState.getProject(projectId);

  const html = SheetEngineModule.renderProjectSheets(project);
  assert(html.includes('loading="lazy"'), 'Deve aplicar loading="lazy" em imagens para performance');
  assert(html.includes('sheet-img-optimized'), 'Deve aplicar classe de otimização de imagem');
  assert(html.includes('sheet-paper'), 'Deve renderizar canvas de prancha proporcional');
});

runTest('9.2 Prancha deve calcular corretamente dimensões virtuais para formatos A0, A1, A2, A3, A4 e Métrica', () => {
  const formats = ['A0', 'A1', 'A2', 'A3', 'A4', 'PRANCHA_METRICA'];
  formats.forEach(f => {
    const s = StudioState.createSheet({ projectId, name: `Dim ${f}`, format: f, orientation: 'landscape' });
    assert(s.dimensions.widthPx > s.dimensions.heightPx, `${f} landscape deve ter largura > altura`);
    assert(s.dimensions.widthMm > 0);
  });
});

console.log('\n================================================================');
console.log(` RESULTADO FINAL: ${testsPassed} PASSOU | ${testsFailed} FALHOU`);
console.log('================================================================\n');

if (testsFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
