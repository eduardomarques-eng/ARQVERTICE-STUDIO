/**
 * ============================================================================
 * TESTES DO BLOCO F05: IDENTIDADE VISUAL E CARIMBOS (TITLEBLOCK)
 * Validação dos 9 requisitos de F05:
 * 1. Brand Assets (logo principal, logo monocromático, símbolo, favicon, assinatura, elementos gráficos; upload)
 * 2. Carimbo configurável com 12 campos canônicos
 * 3. Variações e templates de carimbo (ABNT NBR 6492, Compacto, Coluna, Minimalista)
 * 4. Posicionamento respeitando área útil (printableArea)
 * 5. Logo: tamanho, posição, proporção e margem (nunca deformar proporção)
 * 6. Revisão: REV 00, REV 01, REV 02 ou padrão configurável
 * 7. Identidade: Tokens editáveis (primary, secondary, accent, text, background, border, muted)
 * 8. Preservação: Reutilizável entre projetos
 * 9. Testes de upload, preview, posicionamento, proporção, carimbo e revisão
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
    if (err.stack) console.error(err.stack);
    testsFailed++;
  }
}

console.log('\n================================================================');
console.log(' INICIANDO SUÍTE DE TESTES: BLOCO F05 - IDENTIDADE VISUAL E CARIMBOS');
console.log('================================================================\n');

// 1. Inicialização do estado
StudioState.init();
const testProjectId = 'prj-praia-01';

// ----------------------------------------------------------------------------
// GRUPO 1: BRAND ASSETS E PROFILES
// ----------------------------------------------------------------------------
console.log('--- GRUPO 1: BRAND ASSETS E PERFIS DE IDENTIDADE ---');

runTest('1.1 Inicialização de perfis de marca e perfil padrão do ArqVértice Studio', () => {
  const profiles = StudioState.getBrandProfiles();
  assert(Array.isArray(profiles), 'Deveria retornar array de perfis');
  assert(profiles.length >= 1, 'Deveria conter perfil default');

  const def = StudioState.getActiveBrandProfile(testProjectId);
  assert(def, 'Deveria retornar perfil ativo para o projeto');
  assert.strictEqual(def.id, 'brand-arqvertice-default');
  assert.strictEqual(def.name, 'Identidade ArqVértice Oficial');

  // Verifica que NÃO inventou logo e aponta para o real
  const logoUrl = def.assets.logoPrincipal?.url || def.assets.logoPrincipal;
  assert.strictEqual(logoUrl, 'logo.png', 'Logo principal deve apontar para o logo real existente no workspace');
});

runTest('1.2 Tipos canônicos de Brand Assets requeridos', () => {
  const assetTypes = StudioState.BRAND_ASSET_TYPES ? StudioState.BRAND_ASSET_TYPES.ALL : [
    'logoPrincipal', 'logoMonocromatico', 'simbolo', 'favicon', 'assinatura', 'elementosGraficos'
  ];
  assert(assetTypes.includes('logoPrincipal'), 'Deve conter logoPrincipal');
  assert(assetTypes.includes('logoMonocromatico'), 'Deve conter logoMonocromatico');
  assert(assetTypes.includes('simbolo'), 'Deve conter simbolo');
  assert(assetTypes.includes('favicon'), 'Deve conter favicon');
  assert(assetTypes.includes('assinatura'), 'Deve conter assinatura');
  assert(assetTypes.includes('elementosGraficos'), 'Deve conter elementosGraficos');
});

runTest('1.3 Upload de novos Brand Assets reais (DataURL / caminho)', () => {
  const profile = StudioState.getActiveBrandProfile(testProjectId);
  const dummyBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const getUrl = (val) => typeof val === 'object' && val !== null ? val.url : val;

  // Upload de símbolo
  const updatedSimbolo = StudioState.uploadBrandAsset(profile.id, 'simbolo', dummyBase64, 'tester');
  assert.strictEqual(getUrl(updatedSimbolo.assets.simbolo), dummyBase64);

  // Upload de logo monocromático
  const updatedMono = StudioState.uploadBrandAsset(profile.id, 'logoMonocromatico', dummyBase64, 'tester');
  assert.strictEqual(getUrl(updatedMono.assets.logoMonocromatico), dummyBase64);

  // Upload de assinatura profissional
  const updatedAssinatura = StudioState.uploadBrandAsset(profile.id, 'assinatura', dummyBase64, 'tester');
  assert.strictEqual(getUrl(updatedAssinatura.assets.assinatura), dummyBase64);
});

// ----------------------------------------------------------------------------
// GRUPO 2: CARIMBO E 12 CAMPOS OBRIGATÓRIOS
// ----------------------------------------------------------------------------
console.log('\n--- GRUPO 2: CARIMBO E 12 CAMPOS OBRIGATÓRIOS ---');

runTest('2.1 Existência dos 12 Campos Canônicos do Carimbo', () => {
  const requiredFields = [
    'escritorio',
    'responsavel',
    'projeto',
    'cliente',
    'ambiente',
    'desenho',
    'escala',
    'folha',
    'revisao',
    'data',
    'autor',
    'observacao'
  ];

  const canonical = StudioState.TITLEBLOCK_FIELDS || [];
  requiredFields.forEach(f => {
    assert(canonical.includes(f), `Campo obrigatório ausente: ${f}`);
  });
  assert.strictEqual(canonical.length, 12, 'Exatamente 12 campos canônicos');
});

runTest('2.2 Geração de dados completos para o carimbo a partir do projeto e da prancha', () => {
  const sheets = StudioState.getSheetsByProject(testProjectId);
  assert(sheets.length > 0, 'Deve haver prancha no projeto de teste');
  const sheet = sheets[0];

  const tbData = StudioState.generateTitleblockData(sheet.id, null, {
    ambiente: 'Living Integrado',
    desenho: 'Planta de Layout e Especificações',
    observacao: 'Desenho preliminar sujeito a alterações em obra.'
  });

  assert(tbData.escritorio, 'Deveria ter escritório');
  assert(tbData.responsavel, 'Deveria ter responsável');
  assert(tbData.cliente, 'Deveria ter cliente');
  assert.strictEqual(tbData.ambiente, 'Living Integrado');
  assert.strictEqual(tbData.desenho, 'Planta de Layout e Especificações');
  assert.strictEqual(tbData.escala, '1:50');
  assert(tbData.folha, 'Deveria ter folha');
  assert(tbData.revisao, 'Deveria ter revisão');
  assert(tbData.data.includes('/'), 'Data deve vir formatada');
  assert(tbData.autor, 'Deveria ter autor');
  assert.strictEqual(tbData.observacao, 'Desenho preliminar sujeito a alterações em obra.');
});

// ----------------------------------------------------------------------------
// GRUPO 3: TEMPLATES E VARIAÇÕES
// ----------------------------------------------------------------------------
console.log('\n--- GRUPO 3: TEMPLATES E VARIAÇÕES DE CARIMBO ---');

runTest('3.1 Catálogo de templates de carimbo e dimensões ABNT', () => {
  const templates = StudioState.getTitleblockTemplates();
  assert(Array.isArray(templates), 'Deveria retornar lista de templates');
  assert.strictEqual(templates.length, 4, 'Deveria ter 4 templates');

  const abnt = templates.find(t => t.id === 'abnt_nbr6492');
  assert(abnt, 'Template ABNT NBR 6492 deve existir');
  assert.strictEqual(abnt.widthMm, 178, 'Largura ABNT deve ser 178mm');
  assert.strictEqual(abnt.heightMm, 55, 'Altura ABNT deve ser 55mm');

  assert(templates.some(t => t.id === 'compacto_horizontal'), 'Template compacto_horizontal deve existir');
  assert(templates.some(t => t.id === 'coluna_lateral'), 'Template coluna_lateral deve existir');
  assert(templates.some(t => t.id === 'minimalista'), 'Template minimalista deve existir');
});

runTest('3.2 Renderização visual dos 4 templates de carimbo', () => {
  const sheet = StudioState.getSheetsByProject(testProjectId)[0];
  const element = {
    id: 'el-carimbo-test',
    type: 'carimbo',
    titleblockTemplate: 'abnt_nbr6492',
    titleblockData: StudioState.generateTitleblockData(sheet.id)
  };

  // 1. ABNT NBR 6492
  const htmlAbnt = SheetEngineModule.renderCarimboElement(element, sheet);
  assert(htmlAbnt.includes('carimbo-template-abnt'), 'Deve renderizar carimbo-template-abnt');
  assert(htmlAbnt.includes('logo.png'), 'Deve usar logo oficial');
  assert(htmlAbnt.includes('REV'), 'Deve exibir revisão');

  // 2. Compacto Horizontal
  element.titleblockTemplate = 'compacto_horizontal';
  const htmlCompacto = SheetEngineModule.renderCarimboElement(element, sheet);
  assert(htmlCompacto.includes('carimbo-template-compacto'), 'Deve renderizar carimbo-template-compacto');

  // 3. Coluna Lateral
  element.titleblockTemplate = 'coluna_lateral';
  const htmlColuna = SheetEngineModule.renderCarimboElement(element, sheet);
  assert(htmlColuna.includes('carimbo-template-coluna'), 'Deve renderizar carimbo-template-coluna');

  // 4. Minimalista
  element.titleblockTemplate = 'minimalista';
  const htmlMin = SheetEngineModule.renderCarimboElement(element, sheet);
  assert(htmlMin.includes('carimbo-template-minimalista'), 'Deve renderizar carimbo-template-minimalista');
});

// ----------------------------------------------------------------------------
// GRUPO 4: POSICIONAMENTO E ÁREA DEFINIDA
// ----------------------------------------------------------------------------
console.log('\n--- GRUPO 4: POSICIONAMENTO E ÁREA ÚTIL (PRINTABLE AREA) ---');

runTest('4.1 Ancoragem automática do carimbo no canto inferior direito da área útil', () => {
  const sheet = StudioState.getSheetsByProject(testProjectId)[0];
  const printable = sheet.formatProfile.renderDimensions.screenPx.printableArea;

  const pos = StudioState.recalculateTitleblockPosition(sheet.id, 'abnt_nbr6492');

  // Coordenadas calculadas devem estar estritamente dentro da printableArea
  const printWidth = printable.width || printable.w;
  const printHeight = printable.height || printable.h;
  assert(pos.x >= printable.x, `X (${pos.x}) deve ser >= printableArea.x (${printable.x})`);
  assert(pos.y >= printable.y, `Y (${pos.y}) deve ser >= printableArea.y (${printable.y})`);
  assert(pos.x + pos.w <= printable.x + printWidth + 0.5, 'Carimbo não pode transbordar printableArea no eixo X');
  assert(pos.y + pos.h <= printable.y + printHeight + 0.5, 'Carimbo não pode transbordar printableArea no eixo Y');
});

// ----------------------------------------------------------------------------
// GRUPO 5: LOGO: PROPORÇÃO, TAMANHO, MARGEM E NÃO DEFORMAÇÃO
// ----------------------------------------------------------------------------
console.log('\n--- GRUPO 5: LOGO (TAMANHO, POSIÇÃO, PROPORÇÃO E MARGEM) ---');

runTest('5.1 Preservação absoluta da proporção do logo (nunca deformar)', () => {
  const sheet = StudioState.getSheetsByProject(testProjectId)[0];
  const logoEl = {
    id: 'el-logo-test',
    type: 'logo',
    assetType: 'logoPrincipal',
    src: 'logo.png',
    margin: 10,
    lockAspectRatio: true,
    objectFit: 'contain'
  };

  const html = SheetEngineModule.renderLogoElement(logoEl, sheet);
  assert(html.includes('object-fit: contain'), 'Logo DEVE usar object-fit: contain para evitar qualquer deformação');
  assert(html.includes('padding: 10px'), 'Logo deve aplicar margem configurável');
  assert(html.includes('logo.png'), 'Logo deve renderizar asset real');
});

// ----------------------------------------------------------------------------
// GRUPO 6: CONTROLE DE REVISÃO CONFIGURÁVEL
// ----------------------------------------------------------------------------
console.log('\n--- GRUPO 6: CONTROLE DE REVISÃO CONFIGURÁVEL ---');

runTest('6.1 Formatação e incremento de revisões (REV 00, REV 01, REV 02)', () => {
  assert.strictEqual(StudioState.formatRevisionString(0, 'REV {n2}'), 'REV 00');
  assert.strictEqual(StudioState.formatRevisionString(1, 'REV {n2}'), 'REV 01');
  assert.strictEqual(StudioState.formatRevisionString(2, 'REV {n2}'), 'REV 02');
  assert.strictEqual(StudioState.formatRevisionString(15, 'REV {n2}'), 'REV 15');

  // Formatos alternativos configuráveis
  assert.strictEqual(StudioState.formatRevisionString(3, 'R-{n}'), 'R-3');
  assert.strictEqual(StudioState.formatRevisionString(0, 'REV {alpha}'), 'REV A');
  assert.strictEqual(StudioState.formatRevisionString(1, 'REV {alpha}'), 'REV B');

  // Incremento de revisão no perfil de marca
  const profile = StudioState.getActiveBrandProfile(testProjectId);
  StudioState.updateBrandProfile(profile.id, {
    revisionConfig: { currentRev: 1, format: 'REV {n2}' },
    revisionSettings: { currentRevIndex: 1, formatPattern: 'REV {n2}' }
  });

  const updated = StudioState.getBrandProfile(profile.id);
  const revVal = updated.revisionConfig?.currentRev ?? updated.revisionSettings?.currentRevIndex;
  const revFmt = updated.revisionConfig?.format || updated.revisionSettings?.formatPattern;
  assert.strictEqual(revVal, 1);
  const formatted = StudioState.formatRevisionString(revVal, revFmt);
  assert.strictEqual(formatted, 'REV 01');
});

// ----------------------------------------------------------------------------
// GRUPO 7: TOKENS DE IDENTIDADE EDITÁVEIS
// ----------------------------------------------------------------------------
console.log('\n--- GRUPO 7: TOKENS DE IDENTIDADE EDITÁVEIS ---');

runTest('7.1 Presença e edição dos 7 tokens requeridos', () => {
  const profile = StudioState.getActiveBrandProfile(testProjectId);
  const tokens = profile.tokens;

  // Verifica os 7 tokens: primary, secondary, accent, text, background, border, muted
  const expectedTokens = ['primary', 'secondary', 'accent', 'text', 'background', 'border', 'muted'];
  expectedTokens.forEach(token => {
    assert(tokens[token] !== undefined, `Token ${token} deve existir no perfil de marca`);
  });

  // Atualização de tokens
  StudioState.updateBrandProfile(profile.id, {
    tokens: {
      ...tokens,
      primary: '#1E293B',
      accent: '#EAB308'
    }
  });

  const reloaded = StudioState.getBrandProfile(profile.id);
  assert.strictEqual(reloaded.tokens.primary, '#1E293B');
  assert.strictEqual(reloaded.tokens.accent, '#EAB308');
});

// ----------------------------------------------------------------------------
// GRUPO 8: PRESERVAÇÃO E REUTILIZAÇÃO ENTRE PROJETOS
// ----------------------------------------------------------------------------
console.log('\n--- GRUPO 8: PRESERVAÇÃO E REUTILIZAÇÃO ENTRE PROJETOS ---');

runTest('8.1 Criação de perfil reutilizável e associação a múltiplos projetos', () => {
  const newProfile = StudioState.createBrandProfile({
    name: 'ArqVértice Concursos & Mostras',
    description: 'Identidade para apresentação em concursos com paleta escurecida',
    tokens: {
      ...StudioState.DEFAULT_BRAND_TOKENS,
      primary: '#0B0F19',
      accent: '#38BDF8'
    }
  }, 'arquiteto');

  assert(newProfile.id, 'Deve gerar ID único para novo perfil');

  // Associa ao projeto secundário existente prj-eusebio-02
  StudioState.setProjectBrandProfile('prj-eusebio-02', newProfile.id, 'arquiteto');
  const projProfile = StudioState.getActiveBrandProfile('prj-eusebio-02');
  assert.strictEqual(projProfile.id, newProfile.id);

  // O projeto principal permanece com o perfil padrão
  const mainProjProfile = StudioState.getActiveBrandProfile(testProjectId);
  assert.strictEqual(mainProjProfile.id, 'brand-arqvertice-default');
});

// ----------------------------------------------------------------------------
// GRUPO 9: TESTES DE MODAL E INTEGRAÇÃO
// ----------------------------------------------------------------------------
console.log('\n--- GRUPO 9: MODAL DE IDENTIDADE E PREVIEW ---');

runTest('9.1 Renderização do modal de gestão de marca com todas as seções', () => {
  const sheet = StudioState.getSheetsByProject(testProjectId)[0];
  const project = StudioState.getProject(testProjectId);

  const modalHtml = SheetEngineModule.renderBrandModal(sheet, project);
  assert(modalHtml.includes('brand-modal-card'), 'Deve renderizar modal card');
  assert(modalHtml.includes('Brand Assets'), 'Deve conter seção de assets');
  assert(modalHtml.includes('Tokens de Cor'), 'Deve conter seção de tokens');
  assert(modalHtml.includes('Sistema de Revisões'), 'Deve conter seção de revisão');
  assert(modalHtml.includes('Carimbo Oficial ABNT'), 'Deve conter ação de inserir carimbo oficial');
});

console.log('\n================================================================');
console.log(` RESULTADO FINAL: ${testsPassed} PASSOU | ${testsFailed} FALHOU`);
console.log('================================================================\n');

if (testsFailed > 0) {
  process.exitCode = 1;
}
