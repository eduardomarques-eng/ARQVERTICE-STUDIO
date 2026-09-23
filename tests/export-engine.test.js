/**
 * ============================================================================
 * TESTES DO BLOCO F10: MOTOR DE GERAÇÃO DE ARQUIVOS FINAIS (EXPORT ENGINE)
 *
 * Validação rigorosa dos 10 requisitos do Bloco F10:
 * 1. Formatos suportados (PNG, JPG, PDF) com arquitetura expansível
 * 2. Dimensões físicas reais em mm e pt para formatos A4, A3, A2, A1 (Paisagem e Retrato)
 * 3. Preservação de formato, orientação, escala, posição, imagens, textos, carimbo e logo
 * 4. Nomenclatura padrão canônica: ARQV_[PROJETO]_[AMBIENTE]_[TIPO]_[REV].[EXT]
 * 5. Gerenciamento de resoluções de imagens: Original, Otimizada e Thumbnail
 * 6. Exportação individual (Página, Prancha, Ambiente, Conjunto)
 * 7. Exportação completa com pacote estruturado ZIP em 7 pastas canônicas
 * 8. Metadados completos: data, revisão, usuário, projeto
 * 9. Tolerância e resiliência a falhas parciais (sem perda dos demais arquivos)
 * 10. PDF de múltiplas páginas com integridade dimensional
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

const ExportEngineModule = require('../js/export-engine-module.js');
global.ExportEngineModule = ExportEngineModule;
global.window.ExportEngineModule = ExportEngineModule;

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
console.log('SUÍTE DE TESTES: BLOCO F10 — MOTOR DE GERAÇÃO DE ARQUIVOS FINAIS');
console.log('================================================================\n');

// Inicialização do estado
StudioState.init();
const testProjectId = 'prj-praia-01';

// 1. Formatos Suportados
runTest('1.1 - Formatos suportados e constantes canônicas de exportação estão definidos', () => {
  assert.ok(Array.isArray(StudioState.EXPORT_SUPPORTED_FORMATS), 'EXPORT_SUPPORTED_FORMATS deve ser array');
  assert.ok(StudioState.EXPORT_SUPPORTED_FORMATS.includes('PNG'));
  assert.ok(StudioState.EXPORT_SUPPORTED_FORMATS.includes('JPG'));
  assert.ok(StudioState.EXPORT_SUPPORTED_FORMATS.includes('PDF'));

  assert.ok(StudioState.EXPORT_IMAGE_RESOLUTIONS.ORIGINAL);
  assert.ok(StudioState.EXPORT_IMAGE_RESOLUTIONS.OTIMIZADA);
  assert.ok(StudioState.EXPORT_IMAGE_RESOLUTIONS.THUMBNAIL);

  assert.strictEqual(StudioState.EXPORT_CANONICAL_DIRECTORIES.length, 7);
});

// 2. Nomenclatura Padrão Canônica (ARQV_[PROJETO]_[AMBIENTE]_[TIPO]_[REV])
runTest('2.1 - formatCanonicalFilename gera padrão estrito ARQV_[PROJETO]_[AMBIENTE]_[TIPO]_[REV]', () => {
  const filename1 = StudioState.formatCanonicalFilename({
    project: 'Casa Praia',
    environment: 'Sala',
    type: 'Planta',
    revision: 'REV 01',
    extension: 'pdf'
  });
  assert.strictEqual(filename1, 'ARQV_CASA_PRAIA_SALA_PLANTA_REV01.pdf');

  const filename2 = StudioState.formatCanonicalFilename({
    project: 'Residência Alto Padrão',
    environment: 'Cozinha Gourmet',
    type: 'Render Cam 01',
    revision: 'R02',
    extension: 'png'
  });
  assert.strictEqual(filename2, 'ARQV_RESIDENCIA_ALTO_PADRAO_COZINHA_GOURMET_RENDER_CAM_01_REV02.png');
});

// 3. Dimensões Físicas Reais para A4, A3, A2, A1 em Paisagem e Retrato
runTest('3.1 - Dimensões físicas nominais A4, A3, A2, A1 em Paisagem e Retrato convertidas para pt', () => {
  const formats = ['A4', 'A3', 'A2', 'A1'];
  const orientations = ['landscape', 'portrait'];

  formats.forEach(f => {
    orientations.forEach(o => {
      const sheet = StudioState.createSheet({
        projectId: testProjectId,
        name: `Teste ${f} ${o}`,
        format: f,
        orientation: o
      });

      const exported = StudioState.exportSheetToFile(sheet.id, 'PDF');
      const dims = exported.dimensions;

      assert.strictEqual(dims.formatCode, f);
      assert.strictEqual(dims.orientation, o);
      assert.ok(dims.widthMm > 0);
      assert.ok(dims.heightMm > 0);
      assert.ok(dims.widthPt > 0);
      assert.ok(dims.heightPt > 0);

      // Verificação de conversão para pt (1 mm = 72/25.4 pt)
      const expectedPtW = Math.round(dims.widthMm * (72 / 25.4) * 100) / 100;
      assert.strictEqual(Math.round(dims.widthPt), Math.round(expectedPtW));
    });
  });
});

// 4. Preservação de Elementos, Carimbo F05 e Escala na Exportação de Prancha
runTest('4.1 - exportSheetToFile preserva elementos, escala, textos, carimbo F05 e logo', () => {
  const sheet = StudioState.createSheet({
    projectId: testProjectId,
    name: 'Prancha Executiva de Living',
    sheetNumber: 'PR-EX-01',
    format: 'A3',
    orientation: 'landscape',
    scale: '1:50',
    revision: 'REV 01'
  });

  // Adiciona elemento de texto e render
  StudioState.addSheetElement(sheet.id, {
    type: 'titulo',
    x: 100, y: 50, width: 400, height: 40,
    content: { text: 'PLANTA BAIXA EXECUTIVA' }
  });

  const exportResult = StudioState.exportSheetToFile(sheet.id, 'PDF', {
    user: 'Eduardo Marques',
    revision: 'REV 01'
  });

  assert.strictEqual(exportResult.status, 'SUCCESS');
  assert.strictEqual(exportResult.format, 'PDF');
  assert.strictEqual(exportResult.scale, '1:50');
  assert.ok(exportResult.elementsCount > 0);
  assert.ok(exportResult.titleblock.escritorio, 'Carimbo F05 deve estar presente');
  assert.ok(exportResult.titleblock.revisao, 'Carimbo F05 com revisão');
  assert.ok(exportResult.titleblock.logoUrl, 'Carimbo F05 com logo');

  // Metadados registrados
  assert.strictEqual(exportResult.metadata.user, 'Eduardo Marques');
  assert.strictEqual(exportResult.metadata.revision, 'REV 01');
  assert.strictEqual(exportResult.metadata.project.id, testProjectId);
});

// 5. PDF de Múltiplas Páginas com Dimensões por Página
runTest('5.1 - exportMultiPagePdf gera documento multipáginas preservando dimensões físicas', () => {
  const s1 = StudioState.createSheet({ projectId: testProjectId, name: 'Prancha 1 A4', format: 'A4', orientation: 'portrait' });
  const s2 = StudioState.createSheet({ projectId: testProjectId, name: 'Prancha 2 A3', format: 'A3', orientation: 'landscape' });

  const multiPdf = StudioState.exportMultiPagePdf([s1.id, s2.id], {
    projectId: testProjectId,
    revision: 'REV 02'
  });

  assert.strictEqual(multiPdf.status, 'SUCCESS');
  assert.strictEqual(multiPdf.isMultiPage, true);
  assert.strictEqual(multiPdf.totalPages, 2);
  assert.strictEqual(multiPdf.pages[0].dimensions.formatCode, 'A4');
  assert.strictEqual(multiPdf.pages[1].dimensions.formatCode, 'A3');
  assert.ok(multiPdf.filename.endsWith('.pdf'));
});

// 6. Resoluções de Imagem (Original, Otimizada, Thumbnail)
runTest('6.1 - exportImageVariants gera e mapeia os 3 níveis de resolução requeridos', () => {
  const imgUrl = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200';
  const variants = StudioState.exportImageVariants(imgUrl, { width: 3840, height: 2160 });

  // Original (1.0 scale, Full Quality)
  assert.strictEqual(variants.original.resolutionType, 'ORIGINAL');
  assert.strictEqual(variants.original.scale, 1.0);
  assert.strictEqual(variants.original.width, 3840);
  assert.strictEqual(variants.original.height, 2160);

  // Otimizada (0.75 scale)
  assert.strictEqual(variants.otimizada.resolutionType, 'OTIMIZADA');
  assert.strictEqual(variants.otimizada.scale, 0.75);
  assert.strictEqual(variants.otimizada.width, 2880);
  assert.strictEqual(variants.otimizada.height, 1620);

  // Thumbnail (0.25 scale)
  assert.strictEqual(variants.thumbnail.resolutionType, 'THUMBNAIL');
  assert.strictEqual(variants.thumbnail.scale, 0.25);
  assert.strictEqual(variants.thumbnail.width, 960);
  assert.strictEqual(variants.thumbnail.height, 540);
});

// 7. Exportação Individual (Página, Prancha, Ambiente, Conjunto)
runTest('7.1 - exportIndividual suporta os escopos prancha, ambiente, pagina e conjunto', () => {
  const sheets = StudioState.getProjectSheets(testProjectId);
  assert.ok(sheets.length > 0);

  // Prancha
  const expPrancha = StudioState.exportIndividual('prancha', sheets[0].id);
  assert.strictEqual(expPrancha.status, 'SUCCESS');

  // Ambiente
  const envs = StudioState.getProjectEnvironments(testProjectId);
  const expAmbiente = StudioState.exportIndividual('ambiente', envs[0].id, { projectId: testProjectId });
  assert.strictEqual(expAmbiente.status, 'SUCCESS');
  assert.ok(expAmbiente.filename.includes('PACOTE_AMBIENTE'));

  // Conjunto
  const expConjunto = StudioState.exportIndividual('conjunto', testProjectId, { setType: 'renders' });
  assert.strictEqual(expConjunto.status, 'SUCCESS');
  assert.strictEqual(expConjunto.setType, 'renders');
});

// 8. Pacote Completo (ZIP) com as 7 Pastas Canônicas e Manifesto
runTest('8.1 - exportProjectZipPackage monta pacote estruturado nas 7 pastas e gera manifest.json', () => {
  const zipPkg = StudioState.exportProjectZipPackage(testProjectId, {
    revision: 'REV 01',
    user: 'Camila Rossi'
  });

  assert.strictEqual(zipPkg.status, 'SUCCESS');
  assert.ok(zipPkg.packageName.startsWith('PACOTE_ARQV_'));

  // Validação das 7 pastas canônicas obrigatórias
  const expectedFolders = [
    '01_PRANCHAS',
    '02_PLANTAS',
    '03_PERSPECTIVAS',
    '04_MATERIAIS',
    '05_MOBILIARIO',
    '06_QUANTITATIVOS',
    '07_RELATORIO'
  ];

  expectedFolders.forEach(folder => {
    assert.ok(zipPkg.structure[folder] !== undefined, `Pasta ${folder} deve existir no pacote`);
  });

  // Manifesto
  assert.ok(zipPkg.manifest, 'Manifesto deve ser gerado');
  assert.strictEqual(zipPkg.manifest.revisao, 'REV 01');
  assert.strictEqual(zipPkg.manifest.usuario, 'Camila Rossi');
  assert.strictEqual(zipPkg.manifest.projectId, testProjectId);
  assert.ok(zipPkg.files.some(f => f.fileName === 'manifest.json'));
});

// 9. Resiliência a Falhas Parciais (Sem Perda dos Demais Arquivos)
runTest('9.1 - Resiliência a falhas: se um arquivo falhar, os demais não são perdidos e erro é registrado', () => {
  // Simula prancha com erro sem quebrar o lote
  const result = StudioState.exportMultiPagePdf(['sheet-inexistente-xyz', testProjectId ? StudioState.getProjectSheets(testProjectId)[0].id : null].filter(Boolean));

  assert.strictEqual(result.status, 'PARTIAL_SUCCESS');
  assert.ok(result.errors.length > 0, 'Deve registrar erro específico');
  assert.ok(result.pages.length > 0, 'Não deve perder a página válida');
  assert.strictEqual(result.errors[0].sheetId, 'sheet-inexistente-xyz');
});

console.log('\n================================================================');
console.log(`RESULTADO FINAL: ${testsPassed} testes passaram, ${testsFailed} falharam.`);
console.log('================================================================\n');

if (testsFailed > 0) {
  process.exit(1);
}
