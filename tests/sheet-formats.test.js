/**
 * ============================================================================
 * TESTES DO BLOCO F03: SISTEMA DE FORMATOS FÍSICOS E ORIENTAÇÃO DAS PRANCHAS
 * Validação rigorosa dos 8 formatos obrigatórios (A4, A3, A2, A1 em Retrato/Paisagem),
 * unidades físicas (mm), unidades de renderização (pt/300DPI), unidades de tela (px/96DPI),
 * perfil FormatProfile, margens técnicas NBR 10068, sangria e proteção contra corte.
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

// Inicializa estado e projetos sementes
StudioState.init();
const testProjectId = 'prj-praia-01';

let passedTests = 0;
let failedTests = 0;

function runTest(testName, testFn) {
  try {
    testFn();
    console.log(`  \x1b[32m✔\x1b[0m ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  \x1b[31m✖\x1b[0m ${testName}`);
    console.error(`    ${err.message}`);
    failedTests++;
  }
}

console.log('\n\x1b[1m=== EXECUTANDO TESTES DO BLOCO F03: FORMATOS FÍSICOS ===\x1b[0m\n');

// --------------------------------------------------------------------------
// 1. CONVERSÃO E SEPARAÇÃO DE UNIDADES (mm, pt, px)
// --------------------------------------------------------------------------
console.log('\x1b[36m--- 1. Conversão e Separação de Unidades ---\x1b[0m');

runTest('StudioState define constantes de unidades e DPIs padrão', () => {
  assert.strictEqual(StudioState.UNIT_TYPES.MM, 'mm');
  assert.strictEqual(StudioState.UNIT_TYPES.PT, 'pt');
  assert.strictEqual(StudioState.UNIT_TYPES.PX, 'px');
  assert.strictEqual(StudioState.DEFAULT_PRINT_DPI, 300);
  assert.strictEqual(StudioState.DEFAULT_SCREEN_DPI, 96);
});

runTest('Conversão de mm para pt (1 inch = 25.4 mm = 72 pt)', () => {
  // 25.4 mm deve ser exatamente 72 pt
  const pt = StudioState.convertUnit(25.4, 'mm', 'pt');
  assert.strictEqual(Math.round(pt * 100) / 100, 72);

  // 210 mm (largura A4) para pt
  const a4WidthPt = StudioState.convertUnit(210, 'mm', 'pt');
  assert.strictEqual(Math.round(a4WidthPt * 10) / 10, 595.3);
});

runTest('Conversão de mm para tela px (96 DPI) e impressão px (300 DPI)', () => {
  // 25.4 mm a 96 DPI deve ser exatamente 96 px
  const pxScreen = StudioState.convertUnit(25.4, 'mm', 'px', 96);
  assert.strictEqual(Math.round(pxScreen), 96);

  // 25.4 mm a 300 DPI deve ser exatamente 300 px
  const pxPrint = StudioState.convertUnit(25.4, 'mm', 'px', 300);
  assert.strictEqual(Math.round(pxPrint), 300);
});

runTest('Conversão bidirecional sem perda (mm -> px -> mm)', () => {
  const originalMm = 420;
  const px = StudioState.convertUnit(originalMm, 'mm', 'px', 96);
  const backToMm = StudioState.convertUnit(px, 'px', 'mm', 96);
  assert.strictEqual(Math.round(backToMm * 100) / 100, originalMm);
});

// --------------------------------------------------------------------------
// 2. VALIDAÇÃO DOS 8 FORMATOS OBRIGATÓRIOS (A4, A3, A2, A1 em Retrato e Paisagem)
// --------------------------------------------------------------------------
console.log('\n\x1b[36m--- 2. Formatos Obrigatórios (A4, A3, A2, A1 x Retrato/Paisagem) ---\x1b[0m');

const mandatoryCombinations = [
  { format: 'A4', orientation: 'portrait',  w: 210, h: 297, name: 'A4 Retrato' },
  { format: 'A4', orientation: 'landscape', w: 297, h: 210, name: 'A4 Paisagem' },
  { format: 'A3', orientation: 'portrait',  w: 297, h: 420, name: 'A3 Retrato' },
  { format: 'A3', orientation: 'landscape', w: 420, h: 297, name: 'A3 Paisagem' },
  { format: 'A2', orientation: 'portrait',  w: 420, h: 594, name: 'A2 Retrato' },
  { format: 'A2', orientation: 'landscape', w: 594, h: 420, name: 'A2 Paisagem' },
  { format: 'A1', orientation: 'portrait',  w: 594, h: 841, name: 'A1 Retrato' },
  { format: 'A1', orientation: 'landscape', w: 841, h: 594, name: 'A1 Paisagem' }
];

mandatoryCombinations.forEach(comb => {
  runTest(`Perfil Físico: ${comb.name} (${comb.w} x ${comb.h} mm)`, () => {
    const profile = StudioState.getFormatProfile(comb.format, comb.orientation);
    assert.ok(profile, 'Perfil deve existir');
    assert.strictEqual(profile.width, comb.w, `Largura em mm deve ser ${comb.w}`);
    assert.strictEqual(profile.height, comb.h, `Altura em mm deve ser ${comb.h}`);
    assert.strictEqual(profile.unit, 'mm', 'Unidade física deve ser mm');
    assert.strictEqual(profile.orientation, comb.orientation);
    assert.ok(profile.printableArea, 'Deve conter printableArea');
    assert.ok(profile.safeArea, 'Deve conter safeArea');
    assert.ok(profile.margins, 'Deve conter margins');
    assert.ok(profile.bleed, 'Deve conter bleed');
    assert.ok(profile.renderDimensions, 'Deve conter renderDimensions');
  });
});

// --------------------------------------------------------------------------
// 3. ENTIDADE FORMATPROFILE E MARGENS TÉCNICAS (ABNT NBR 10068)
// --------------------------------------------------------------------------
console.log('\n\x1b[36m--- 3. Entidade FormatProfile, Margens e Sangria ---\x1b[0m');

runTest('Campos obrigatórios de FormatProfile estão presentes e corretos', () => {
  const profile = StudioState.getFormatProfile('A3', 'landscape');
  const requiredFields = [
    'id', 'name', 'width', 'height', 'unit', 'orientation',
    'printableArea', 'margins', 'bleed', 'safeArea', 'renderDimensions'
  ];
  requiredFields.forEach(field => {
    assert.ok(profile[field] !== undefined, `Campo '${field}' deve existir no FormatProfile`);
  });
});

runTest('Margens técnicas NBR 10068: 25mm na borda de fixação e 7mm/10mm nas demais', () => {
  // A3 Paisagem: margem esquerda para fixação é 25mm, topo/direita/base são 7mm
  const a3Profile = StudioState.getFormatProfile('A3', 'landscape');
  assert.strictEqual(a3Profile.margins.left, 25);
  assert.strictEqual(a3Profile.margins.top, 7);
  assert.strictEqual(a3Profile.margins.right, 7);
  assert.strictEqual(a3Profile.margins.bottom, 7);

  // A1 Paisagem: margem esquerda é 25mm, demais são 10mm
  const a1Profile = StudioState.getFormatProfile('A1', 'landscape');
  assert.strictEqual(a1Profile.margins.left, 25);
  assert.strictEqual(a1Profile.margins.top, 10);
  assert.strictEqual(a1Profile.margins.right, 10);
  assert.strictEqual(a1Profile.margins.bottom, 10);
});

runTest('Cálculo da área útil (printableArea) desconta margens físicas em mm', () => {
  // A3 Paisagem: W = 420mm, H = 297mm. Margens: L=25, T=7, R=7, B=7
  // Printable W = 420 - 25 - 7 = 388mm
  // Printable H = 297 - 7 - 7 = 283mm
  const a3 = StudioState.getFormatProfile('A3', 'landscape');
  assert.strictEqual(a3.printableArea.x, 25);
  assert.strictEqual(a3.printableArea.y, 7);
  assert.strictEqual(a3.printableArea.width, 388);
  assert.strictEqual(a3.printableArea.height, 283);
  assert.strictEqual(a3.printableArea.unit, 'mm');
});

runTest('Sangria padrão é de 3mm em todas as bordas', () => {
  const profile = StudioState.getFormatProfile('A4', 'portrait');
  assert.strictEqual(profile.bleed.top, 3);
  assert.strictEqual(profile.bleed.right, 3);
  assert.strictEqual(profile.bleed.bottom, 3);
  assert.strictEqual(profile.bleed.left, 3);
  assert.strictEqual(profile.bleed.unit, 'mm');
});

runTest('Área segura (safeArea) inclui margem de recuo além das margens técnicas', () => {
  const profile = StudioState.getFormatProfile('A3', 'landscape');
  // Safe area x deve ser maior que printableArea.x
  assert.ok(profile.safeArea.x >= profile.printableArea.x);
  assert.ok(profile.safeArea.y >= profile.printableArea.y);
  assert.ok(profile.safeArea.width <= profile.printableArea.width);
  assert.ok(profile.safeArea.height <= profile.printableArea.height);
  assert.strictEqual(profile.safeArea.unit, 'mm');
});

runTest('getAllFormatProfiles() retorna catálogo completo incluindo os 8 obrigatórios', () => {
  const allPresets = StudioState.getAllFormatProfiles();
  assert.ok(Array.isArray(allPresets));
  assert.ok(allPresets.length >= 8);

  const ids = allPresets.map(p => p.id);
  assert.ok(ids.includes('format-a4-portrait') || ids.includes('A4_portrait'));
  assert.ok(ids.includes('format-a4-landscape') || ids.includes('A4_landscape'));
  assert.ok(ids.includes('format-a3-portrait') || ids.includes('A3_portrait'));
  assert.ok(ids.includes('format-a3-landscape') || ids.includes('A3_landscape'));
  assert.ok(ids.includes('format-a2-portrait') || ids.includes('A2_portrait'));
  assert.ok(ids.includes('format-a2-landscape') || ids.includes('A2_landscape'));
  assert.ok(ids.includes('format-a1-portrait') || ids.includes('A1_portrait'));
  assert.ok(ids.includes('format-a1-landscape') || ids.includes('A1_landscape'));
});

// --------------------------------------------------------------------------
// 4. INTEGRAÇÃO COM A ENTIDADE SHEET E EDIÇÃO DE MARGENS/SANGRIA
// --------------------------------------------------------------------------
console.log('\n\x1b[36m--- 4. Integração com Entidade Sheet e Edição de Parâmetros ---\x1b[0m');

runTest('Criação de Sheet enriquece automaticamente com FormatProfile físico', () => {
  const sheet = StudioState.createSheet({
    projectId: testProjectId,
    name: 'Prancha Teste F03',
    format: 'A2',
    orientation: 'landscape'
  }, 'Tester');

  assert.ok(sheet.formatProfile);
  assert.strictEqual(sheet.formatProfile.width, 594);
  assert.strictEqual(sheet.formatProfile.height, 420);
  assert.strictEqual(sheet.formatProfile.unit, 'mm');
  assert.strictEqual(sheet.margins.left, 25);
  assert.strictEqual(sheet.bleed.top, 3);
});

runTest('updateSheetMargins() recalcula área útil e preserva formato físico', () => {
  const sheet = StudioState.createSheet({
    projectId: testProjectId,
    format: 'A4',
    orientation: 'portrait'
  }, 'Tester');

  const updated = StudioState.updateSheetMargins(sheet.id, {
    left: 30,
    top: 15,
    right: 15,
    bottom: 15
  }, 'Tester');

  assert.strictEqual(updated.margins.left, 30);
  assert.strictEqual(updated.margins.top, 15);
  // A4 Portrait: 210 x 297 mm
  // Printable W: 210 - 30 - 15 = 165 mm
  // Printable H: 297 - 15 - 15 = 267 mm
  assert.strictEqual(updated.printableArea.width, 165);
  assert.strictEqual(updated.printableArea.height, 267);
});

runTest('updateSheetBleed() atualiza a sangria da prancha', () => {
  const sheet = StudioState.createSheet({
    projectId: testProjectId,
    format: 'A3',
    orientation: 'landscape'
  }, 'Tester');

  const updated = StudioState.updateSheetBleed(sheet.id, {
    top: 5, right: 5, bottom: 5, left: 5
  }, 'Tester');

  assert.strictEqual(updated.bleed.top, 5);
  assert.strictEqual(updated.formatProfile.bleed.top, 5);
});

// --------------------------------------------------------------------------
// 5. DETECÇÃO DE RISCO DE CORTE E PRESERVAÇÃO PROPORCIONAL
// --------------------------------------------------------------------------
console.log('\n\x1b[36m--- 5. Detecção de Risco de Corte e Preservação Proporcional ---\x1b[0m');

runTest('checkSheetFormatChangeRisk() detecta quando conteúdo ultrapassa novo formato menor', () => {
  // Cria prancha A1 Landscape (841 x 594 mm -> 3178 x 2245 px a 96DPI)
  const sheet = StudioState.createSheet({
    projectId: testProjectId,
    format: 'A1',
    orientation: 'landscape'
  }, 'Tester');

  // Adiciona elemento posicionado em x=2500, y=1800 (cabe no A1, mas não cabe no A4 que tem 1122 x 793 px)
  StudioState.addSheetElement(sheet.id, {
    type: 'imagem',
    transform: { x: 2500, y: 1800, width: 400, height: 300 }
  }, 'Tester');

  // Verifica risco ao migrar de A1 para A4
  const risk = StudioState.checkSheetFormatChangeRisk(sheet.id, 'A4', 'portrait');
  assert.strictEqual(risk.willClip, true, 'Deve alertar que haverá corte');
  assert.ok(risk.overflowElements.length > 0, 'Deve listar elementos que transbordam');
  assert.ok(risk.scaleFactorX < 1, 'Fator de escala X deve ser menor que 1');
  assert.ok(risk.scaleFactorY < 1, 'Fator de escala Y deve ser menor que 1');
});

runTest('checkSheetFormatChangeRisk() retorna willClip=false ao migrar para formato maior', () => {
  // Cria prancha A4 (pequena)
  const sheet = StudioState.createSheet({
    projectId: testProjectId,
    format: 'A4',
    orientation: 'portrait'
  }, 'Tester');

  StudioState.addSheetElement(sheet.id, {
    type: 'titulo',
    transform: { x: 50, y: 50, width: 200, height: 60 }
  }, 'Tester');

  // Migrar de A4 para A1
  const risk = StudioState.checkSheetFormatChangeRisk(sheet.id, 'A1', 'landscape');
  assert.strictEqual(risk.willClip, false, 'Não deve alertar corte ao expandir para formato maior');
});

runTest('setSheetFormatProfile() com rescaleElements="proportional_fit" preserva proporções', () => {
  const sheet = StudioState.createSheet({
    projectId: testProjectId,
    format: 'A3',
    orientation: 'landscape'
  }, 'Tester');

  const el = StudioState.addSheetElement(sheet.id, {
    type: 'planta',
    transform: { x: 100, y: 100, width: 400, height: 300 }
  }, 'Tester');

  const oldPrint = sheet.formatProfile.renderDimensions.screenPx.printableArea;

  // Reduz para A4 Paisagem com redimensionamento proporcional
  const updatedSheet = StudioState.setSheetFormatProfile(
    sheet.id,
    { format: 'A4', orientation: 'landscape' },
    { rescaleElements: 'proportional_fit' },
    'Tester'
  );

  const newPrint = updatedSheet.formatProfile.renderDimensions.screenPx.printableArea;
  const expectedFactor = Math.min(newPrint.width / oldPrint.width, newPrint.height / oldPrint.height);

  const updatedEl = updatedSheet.elements.find(e => e.id === el.id);
  assert.ok(updatedEl);

  // Valida que elemento foi encolhido proporcionalmente respeitando a área útil
  assert.strictEqual(updatedEl.transform.width, Math.round(400 * expectedFactor));
  assert.strictEqual(updatedEl.transform.height, Math.round(300 * expectedFactor));

  // Valida que a proporção original (aspect ratio 400/300 = 1.3333) foi preservada
  const originalAspect = 400 / 300;
  const newAspect = updatedEl.transform.width / updatedEl.transform.height;
  assert.ok(Math.abs(originalAspect - newAspect) < 0.05, 'Proporção do elemento deve ser preservada');

  // Valida integridade do FormatProfile após mudança
  assert.strictEqual(updatedSheet.format, 'A4');
  assert.strictEqual(updatedSheet.formatProfile.width, 297);
  assert.strictEqual(updatedSheet.formatProfile.height, 210);
});

// --------------------------------------------------------------------------
// RESUMO DOS TESTES
// --------------------------------------------------------------------------
console.log('\n============================================================');
console.log(`Total de testes executados: ${passedTests + failedTests}`);
console.log(`\x1b[32mTestes aprovados: ${passedTests}\x1b[0m`);
if (failedTests > 0) {
  console.log(`\x1b[31mTestes reprovados: ${failedTests}\x1b[0m`);
  process.exit(1);
} else {
  console.log('\x1b[32mTodos os testes do Bloco F03 passaram com 100% de sucesso!\x1b[0m\n');
  process.exit(0);
}
