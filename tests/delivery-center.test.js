/**
 * Suíte de Testes Automatizados — Bloco F13: Centro de Entrega do Studio (Delivery Center)
 * Valida a tela de Entrega do Projeto, as 10 seções, os 6 atributos por item,
 * seleção, integração QA F11, pacote organizado, snapshot imutável e preservação histórica.
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
console.log('SUÍTE DE TESTES: BLOCO F13 — CENTRO DE ENTREGA DO STUDIO');
console.log('================================================================\n');

const testProjectId = 'prj-praia-01';

// 1. Estrutura do Cabeçalho e Metadados da Entrega
runTest('1.1 - Cabeçalho: Projeto, Cliente, Revisão, Data e Status estão presentes', () => {
  const deliveryData = StudioState.getDeliveryCenterData(testProjectId, { revision: 'REV02' });

  assert.ok(deliveryData.header);
  assert.strictEqual(deliveryData.header.projectName, 'Residência de Praia', 'Projeto');
  assert.ok(deliveryData.header.clientName, 'Cliente');
  assert.strictEqual(deliveryData.header.revisao, 'REV02', 'Revisão informada');
  assert.ok(deliveryData.header.date, 'Data de emissão');
  assert.ok(deliveryData.header.status, 'Status do portão de entrega');
});

// 2. As 10 Seções Canônicas de Entrega
runTest('2.1 - As 10 seções canônicas de entrega estão definidas e presentes', () => {
  const expectedSections = [
    'pranchas',
    'plantas',
    'perspectivas',
    'renders',
    'materiais',
    'mobiliario',
    'quantitativos',
    'moodboards',
    'relatorio',
    'outros'
  ];

  assert.ok(Array.isArray(StudioState.DELIVERY_SECTIONS));
  assert.strictEqual(StudioState.DELIVERY_SECTIONS.length, 10);

  const deliveryData = StudioState.getDeliveryCenterData(testProjectId, { revision: 'REV02' });
  assert.strictEqual(deliveryData.sections.length, 10);

  expectedSections.forEach(secId => {
    const sec = deliveryData.sections.find(s => s.id === secId);
    assert.ok(sec, `Seção ${secId} deve existir no Centro de Entrega`);
    assert.ok(sec.items.length >= 1, `Seção ${secId} deve conter itens`);
  });
});

// 3. Os 6 Atributos Obrigatórios por Item (preview, nome, versão, status, tamanho, incluir/excluir)
runTest('3.1 - Cada item possui os 6 atributos obrigatórios', () => {
  const deliveryData = StudioState.getDeliveryCenterData(testProjectId, { revision: 'REV02' });

  deliveryData.sections.forEach(sec => {
    sec.items.forEach(item => {
      assert.ok(item.preview, `Item ${item.id} deve ter preview`);
      assert.ok(item.nome && item.nome.startsWith('ARQV_'), `Item ${item.id} deve ter nome canônico padronizado: ${item.nome}`);
      assert.ok(item.versao, `Item ${item.id} deve ter versão`);
      assert.ok(item.status, `Item ${item.id} deve ter status`);
      assert.ok(item.tamanho, `Item ${item.id} deve ter tamanho formatado`);
      assert.strictEqual(typeof item.included, 'boolean', `Item ${item.id} deve ter flag de incluir/excluir`);
    });
  });
});

// 4. Seleção de Arquivos (Marcar / Desmarcar)
runTest('4.1 - Seleção granular: permite excluir itens específicos do pacote', () => {
  const deliveryData = StudioState.getDeliveryCenterData(testProjectId, { revision: 'REV02' });
  const allItems = [];
  deliveryData.sections.forEach(s => allItems.push(...s.items));
  const itemToExclude = allItems[0];

  const result = StudioState.finalizeProjectDeliveryPackage(testProjectId, {
    revision: 'REV02',
    confirmed: true,
    confirmWarnings: true,
    excludedItemIds: [itemToExclude.id],
    user: 'Eduardo Marques'
  });

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.selectedFilesCount, allItems.length - 1);
  assert.ok(!result.deliverySnapshot.filesManifest.some(f => f.nome === itemToExclude.nome));
});

// 5. Integração com o Checklist QA F11
runTest('5.1 - Centro de Entrega integra o Checklist QA F11 e bloqueia se houver falhas críticas', () => {
  const deliveryData = StudioState.getDeliveryCenterData(testProjectId, { revision: 'REV02' });
  assert.ok(deliveryData.qaReport, 'Deveria conter relatório QA F11');
  assert.strictEqual(deliveryData.qaReport.checkpoints.length, 20);

  // Simula prancha corrompida para testar bloqueio
  const corruptSheet = StudioState.createSheet({
    projectId: testProjectId,
    name: 'Prancha Corrompida QA',
    format: 'A3',
    orientation: 'landscape',
    scale: '1:0' // ESCALA INVÁLIDA -> ERROR
  });

  assert.throws(() => {
    StudioState.finalizeProjectDeliveryPackage(testProjectId, {
      revision: 'REV02',
      confirmed: true,
      confirmWarnings: true
    });
  }, /Entrega possui \d+ erros/);

  StudioState.deleteSheet(corruptSheet.id);
});

// 6. Exigência de Confirmação Explícita e Código de Revisão
runTest('6.1 - Exige confirmação explícita e código de revisão para emissão', () => {
  // Sem confirmação explícita
  assert.throws(() => {
    StudioState.finalizeProjectDeliveryPackage(testProjectId, {
      revision: 'REV02',
      confirmed: false
    });
  }, /A finalização da entrega exige confirmação explícita/);

  // Sem código de revisão
  assert.throws(() => {
    StudioState.finalizeProjectDeliveryPackage(testProjectId, {
      revision: '',
      confirmed: true
    });
  }, /Código de revisão de entrega não informado/);
});

// 7. Snapshot Imutável da Entrega
runTest('7.1 - Cria snapshot imutável com estado completo do projeto no momento da entrega', () => {
  const result = StudioState.finalizeProjectDeliveryPackage(testProjectId, {
    revision: 'REV02',
    confirmed: true,
    confirmWarnings: true,
    user: 'Eduardo Marques',
    notes: 'Entrega final com todas as pranchas e renders homologados.'
  });

  assert.ok(result.deliverySnapshot);
  assert.strictEqual(result.deliverySnapshot.revisao, 'REV02');
  assert.ok(result.deliverySnapshot.sheets.length > 0);
  assert.ok(result.deliverySnapshot.materials.length > 0);
  assert.ok(result.deliverySnapshot.furniture.length > 0);
  assert.ok(result.deliverySnapshot.quantities.length > 0);
  assert.ok(result.deliverySnapshot.filesManifest.length > 0);
});

// 8. Política de Não-Apagar (Preservação Histórica Cumulativa)
runTest('8.1 - Política de Não-Apagar: Finalizar entrega nunca apaga entregas anteriores', () => {
  const project = StudioState.getProject(testProjectId);
  const countBefore = (project.deliveries || []).length;

  // Realiza uma nova entrega subsequente REV03
  StudioState.finalizeProjectDeliveryPackage(testProjectId, {
    revision: 'REV03',
    confirmed: true,
    confirmWarnings: true,
    user: 'Eduardo Marques',
    notes: 'Entrega subsequente REV03'
  });

  const countAfter = (project.deliveries || []).length;
  assert.strictEqual(countAfter, countBefore + 1, 'Histórico de entregas deve ser cumulativo');

  // Verifica que tanto a entrega anterior quanto a nova coexistem
  assert.ok(project.deliveries.some(d => d.revisao === 'REV02'));
  assert.ok(project.deliveries.some(d => d.revisao === 'REV03'));
});

console.log('\n================================================================');
console.log(`RESULTADO FINAL: ${testsPassed} testes passaram, ${testsFailed} falharam.`);
console.log('================================================================\n');

if (testsFailed > 0) {
  process.exit(1);
}
