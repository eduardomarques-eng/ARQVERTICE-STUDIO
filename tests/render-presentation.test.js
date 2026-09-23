/**
 * ============================================================================
 * TESTES DO BLOCO F07: SISTEMA DE APRESENTAÇÃO DE PERSPECTIVAS E RENDERS
 * Validação rigorosa dos critérios de aceite da especificação F07:
 * 1. Ambiente: Conjunto independente de imagens por ambiente
 * 2. Câmeras: Registro canônico com todos os 10 campos obrigatórios
 * 3. Nomes: Formatação padronizada (Sala_Cam01, Sala_Cam02, Cozinha_Cam01, Suíte_Cam01)
 * 4. Imagens: Registro com os 9 parâmetros canônicos
 * 5. Consistência: Recuperação automática de briefing, ambiente, estilo, materiais, mobiliário, referências, decisões, aprovados e locks
 * 6. Locks: Respeito absoluto aos 7 locks canônicos (sem alteração silenciosa)
 * 7. Variações: Nova versão, duplicação, aprovação, rejeição, arquivamento
 * 8. Comparação: Modos Antes/Depois e Versão A/Versão B
 * 9. Apresentação: Inserção em prancha em 5 layouts diagramados (1, 2, 3, 4 e principal + detalhes)
 * 10. Qualidade: Preservação de resolução original e uso de thumbnail
 * 11. Metadados: Registro e validação de todos os parâmetros relevantes
 * 12. Blindagem de Aprovados: Não alteração automática de imagens aprovadas
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

const RenderPresentationModule = require('../js/render-presentation-module.js');
global.RenderPresentationModule = RenderPresentationModule;
global.window.RenderPresentationModule = RenderPresentationModule;

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
console.log(' INICIANDO SUÍTE DE TESTES: BLOCO F07 - APRESENTAÇÃO DE RENDERS');
console.log('================================================================\n');

// 1. Inicialização do estado
StudioState.init();
const testProjectId = 'prj-praia-01';
const salaEnvId = 'amb-sala-01';
const cozinhaEnvId = 'amb-cozinha-02';

// ----------------------------------------------------------------------------
// GRUPO 1: AMBIENTE INDIVIDUAL
// ----------------------------------------------------------------------------
console.log('--- GRUPO 1: CONJUNTO INDEPENDENTE DE IMAGENS POR AMBIENTE ---');

runTest('1.1 Cada ambiente deve possuir seu conjunto independente e isolado de imagens', () => {
  const salaRenders = StudioState.getEnvironmentPresentationRenders(testProjectId, salaEnvId);
  const cozinhaRenders = StudioState.getEnvironmentPresentationRenders(testProjectId, cozinhaEnvId);

  assert(Array.isArray(salaRenders), 'Deveria retornar array para a sala');
  assert(Array.isArray(cozinhaRenders), 'Deveria retornar array para a cozinha');

  // Adiciona um render exclusivo na cozinha
  const novoRenderCozinha = StudioState.registerPerspectiveRender({
    environmentId: cozinhaEnvId,
    projectId: testProjectId,
    original: 'https://images.unsplash.com/cozinha-base.jpg',
    render: 'https://images.unsplash.com/cozinha-render-v1.jpg',
    prompt: 'Cozinha gourmet com ilha central e bancada em quartzito verde.',
    model: 'Corona 11',
    provider: 'CORONA'
  });

  const updatedCozinha = StudioState.getEnvironmentPresentationRenders(testProjectId, cozinhaEnvId);
  const updatedSala = StudioState.getEnvironmentPresentationRenders(testProjectId, salaEnvId);

  assert(updatedCozinha.some(r => r.id === novoRenderCozinha.id), 'Render deve constar na cozinha');
  assert(!updatedSala.some(r => r.id === novoRenderCozinha.id), 'Render da cozinha NÃO pode vazar para a sala');
});

// ----------------------------------------------------------------------------
// GRUPO 2 & 3: CÂMERAS E NOMES PADRONIZADOS
// ----------------------------------------------------------------------------
console.log('\n--- GRUPO 2 & 3: CÂMERAS CANÔNICAS E NOMENCLATURA PADRÃO ---');

runTest('2.1 Formatação e geração de nomes padronizados ({Ambiente}_Cam{NN})', () => {
  assert.strictEqual(StudioState.formatPerspectiveCameraName('Sala de Estar', 1), 'Sala_Cam01');
  assert.strictEqual(StudioState.formatPerspectiveCameraName('Sala de Estar', 2), 'Sala_Cam02');
  assert.strictEqual(StudioState.formatPerspectiveCameraName('Cozinha Gourmet', 1), 'Cozinha_Cam01');
  assert.strictEqual(StudioState.formatPerspectiveCameraName('Suíte Master', 1), 'Suíte_Cam01');
  assert.strictEqual(StudioState.formatPerspectiveCameraName('Banho Master', 10), 'Banho_Cam10');
});

runTest('2.2 Registro de câmera com todos os 10 campos canônicos', () => {
  const camera = StudioState.registerPerspectiveCamera({
    environmentId: salaEnvId,
    projectId: testProjectId,
    nome: 'Sala_Cam01',
    posicao: 'Canto sudoeste a 1.50m do piso acabado',
    direcao: 'Norte em direção ao painel da TV e deck',
    tipo: 'PERSPECTIVA',
    enquadramento: 'HORIZONTAL_AMPLO',
    descricao: 'Vista geral do living integrado com pé-direito duplo',
    referencia: 'https://images.unsplash.com/ref-camera-sala.jpg',
    versao: 'V01'
  });

  // Validação dos 10 campos
  assert(camera.id, 'Deveria ter id (cameraId)');
  assert.strictEqual(camera.environmentId, salaEnvId, 'Deveria registrar ambiente');
  assert.strictEqual(camera.nome, 'Sala_Cam01', 'Deveria registrar nome');
  assert(camera.posicao.includes('1.50m'), 'Deveria registrar posição');
  assert(camera.direcao.includes('Norte'), 'Deveria registrar direção');
  assert.strictEqual(camera.tipo, 'PERSPECTIVA', 'Deveria registrar tipo');
  assert.strictEqual(camera.enquadramento, 'HORIZONTAL_AMPLO', 'Deveria registrar enquadramento');
  assert(camera.descricao.includes('living integrado'), 'Deveria registrar descrição');
  assert(camera.referencia.includes('ref-camera-sala'), 'Deveria registrar referência');
  assert.strictEqual(camera.versao, 'V01', 'Deveria registrar versão');
});

// ----------------------------------------------------------------------------
// GRUPO 4, 10 & 11: IMAGENS, METADADOS E QUALIDADE ORIGINAL
// ----------------------------------------------------------------------------
console.log('\n--- GRUPO 4, 10 & 11: IMAGENS CANÔNICAS, QUALIDADE E METADADOS ---');

runTest('4.1 Registro de imagens com os 9 parâmetros canônicos e preservação de resolução', () => {
  const render = StudioState.registerPerspectiveRender({
    environmentId: salaEnvId,
    projectId: testProjectId,
    original: 'https://images.unsplash.com/sala-original-4k.jpg',
    render: 'https://images.unsplash.com/sala-render-final-4k.jpg',
    thumbnailUrl: 'https://images.unsplash.com/sala-render-thumb.jpg',
    version: 'V01',
    modelo: 'Imagen 3 Architecture Pro',
    provider: 'GEMINI_ARQ_PRO',
    prompt: 'Living integrado com luz natural de final de tarde, paredes minerais e piso travertino.',
    referencias: ['ref-sala-01', 'ref-sala-02'],
    data: '2026-09-22T10:00:00Z',
    approval: 'DRAFT'
  });

  // Os 9 parâmetros canônicos
  assert.strictEqual(render.original, 'https://images.unsplash.com/sala-original-4k.jpg', '1. original');
  assert.strictEqual(render.render, 'https://images.unsplash.com/sala-render-final-4k.jpg', '2. render');
  assert.strictEqual(render.version, 'V01', '3. versão');
  assert.strictEqual(render.modelo, 'Imagen 3 Architecture Pro', '4. modelo');
  assert.strictEqual(render.provider, 'GEMINI_ARQ_PRO', '5. provider');
  assert(render.prompt.includes('Living integrado'), '6. prompt');
  assert.deepStrictEqual(render.referencias, ['ref-sala-01', 'ref-sala-02'], '7. referências');
  assert.strictEqual(render.data, '2026-09-22T10:00:00Z', '8. data');
  assert.strictEqual(render.approval, 'DRAFT', '9. aprovação');

  // Qualidade e separação de resolução original vs thumbnail
  assert.strictEqual(render.thumbnailUrl, 'https://images.unsplash.com/sala-render-thumb.jpg', 'Thumbnail para UI');
  assert.strictEqual(render.metadata.resolutionType, '4K_UHD_ORIGINAL', 'Preservação de resolução');
});

// ----------------------------------------------------------------------------
// GRUPO 5: CONSISTÊNCIA AUTOMÁTICA
// ----------------------------------------------------------------------------
console.log('\n--- GRUPO 5: CONSISTÊNCIA AUTOMÁTICA ---');

runTest('5.1 Recuperação automática de briefing, ambiente, estilo, materiais, mobiliário, referências, decisões, imagens aprovadas e locks', () => {
  const consistency = StudioState.compilePerspectiveConsistency(testProjectId, salaEnvId);

  assert(consistency.briefing, 'Deve recuperar briefing');
  assert(consistency.briefing.projectName, 'Briefing deve conter nome do projeto');
  assert(consistency.ambiente, 'Deve recuperar dados do ambiente');
  assert.strictEqual(consistency.ambiente.id, salaEnvId);
  assert(consistency.estilo, 'Deve recuperar estilo arquitetônico');
  assert(Array.isArray(consistency.materiais), 'Deve recuperar materiais');
  assert(Array.isArray(consistency.mobiliario), 'Deve recuperar mobiliário');
  assert(Array.isArray(consistency.referencias), 'Deve recuperar referências');
  assert(Array.isArray(consistency.decisoes), 'Deve recuperar decisões anteriores');
  assert(Array.isArray(consistency.imagensAprovadas), 'Deve recuperar imagens aprovadas');
  assert(consistency.locks, 'Deve recuperar estado dos locks');
});

// ----------------------------------------------------------------------------
// GRUPO 6: LOCKS RIGOROSOS (SEM ALTERAÇÃO SILENCIOSA)
// ----------------------------------------------------------------------------
console.log('\n--- GRUPO 6: LOCKS RIGOROSOS E BLOQUEIO DE MUTAÇÃO SILENCIOSA ---');

runTest('6.1 Respeito estrito aos 7 locks (geometria, câmera, layout, materiais, iluminação, decoração, paisagismo)', () => {
  const canonicalLocks = StudioState.CANONICAL_PERSPECTIVE_LOCKS;
  const expectedLocks = ['geometry', 'camera', 'layout', 'materials', 'lighting', 'decor', 'landscape'];

  expectedLocks.forEach(l => {
    assert(canonicalLocks.includes(l), `Lock ${l} deve estar presente`);
  });

  // O ambiente Sala tem geometry=true e layout=true
  const checkInvalid = StudioState.validatePerspectiveLockIntegrity(salaEnvId, {
    geometry: 'Derrubar parede do living'
  });

  assert.strictEqual(checkInvalid.allowed, false, 'Deveria bloquear alteração silenciosa de geometria travada');
  assert(checkInvalid.violations.length > 0);
  assert(checkInvalid.error.includes('LOCK ATIVO'));

  // Alteração permitida quando o lock não está ativo (iluminação = false no seed da sala)
  const checkValid = StudioState.validatePerspectiveLockIntegrity(salaEnvId, {
    lighting: 'Ajustar dimmer da fita LED para 2700K'
  });

  assert.strictEqual(checkValid.allowed, true, 'Deveria permitir alteração em componente sem lock');
});

// ----------------------------------------------------------------------------
// GRUPO 7: VARIAÇÕES E CICLO DE VIDA
// ----------------------------------------------------------------------------
console.log('\n--- GRUPO 7: VARIAÇÕES (NOVA VERSÃO, DUPLICAR, APROVAR, REJEITAR, ARQUIVAR) ---');

runTest('7.1 Ciclo de vida completo de variações de render', () => {
  // Cria render inicial
  const r1 = StudioState.registerPerspectiveRender({
    environmentId: salaEnvId,
    projectId: testProjectId,
    version: 'V01',
    render: 'https://images.unsplash.com/sala-v1.jpg'
  });

  // 1. Gerar nova versão V+1
  const r2 = StudioState.createPerspectiveRenderVersion(r1.id, {
    render: 'https://images.unsplash.com/sala-v2.jpg',
    prompt: 'Versão 2 com sofá em couro conhaque.'
  });
  assert.strictEqual(r2.version, 'V02', 'Deveria incrementar versão para V02');

  // 2. Duplicar
  const dup = StudioState.duplicatePerspectiveRender(r2.id);
  assert(dup.version.includes('COPIA'), 'Deveria marcar cópia');

  // 3. Rejeitar com motivo formal
  const rejected = StudioState.rejectPerspectiveRender(r1.id, 'Iluminação muito escura no canto do deck');
  assert.strictEqual(rejected.approvalStatus, 'REJECTED');
  assert.strictEqual(rejected.rejectionReason, 'Iluminação muito escura no canto do deck');

  // 4. Aprovar versão final
  const approved = StudioState.approvePerspectiveRender(r2.id, 'Arquiteto Sênior', 'Perfeito');
  assert.strictEqual(approved.approvalStatus, 'APPROVED');
  assert.strictEqual(approved.isCurrentApproved, true);

  // 5. Arquivar duplicata
  const archived = StudioState.archivePerspectiveRender(dup.id);
  assert.strictEqual(archived.approvalStatus, 'ARCHIVED');
});

// ----------------------------------------------------------------------------
// GRUPO 8: COMPARAÇÃO (ANTES / DEPOIS E VERSÃO A / VERSÃO B)
// ----------------------------------------------------------------------------
console.log('\n--- GRUPO 8: COMPARAÇÃO ANTES/DEPOIS E VERSÃO A/B ---');

runTest('8.1 Motor de comparação suporta modos Antes/Depois e Versão A/B', () => {
  const rA = StudioState.registerPerspectiveRender({
    environmentId: salaEnvId,
    projectId: testProjectId,
    original: 'https://images.unsplash.com/estudo-base.jpg',
    render: 'https://images.unsplash.com/sala-v1.jpg',
    version: 'V01',
    prompt: 'Estudo base'
  });

  const rB = StudioState.registerPerspectiveRender({
    environmentId: salaEnvId,
    projectId: testProjectId,
    original: 'https://images.unsplash.com/estudo-base.jpg',
    render: 'https://images.unsplash.com/sala-v2.jpg',
    version: 'V02',
    prompt: 'Render refinado'
  });

  // Modo Antes / Depois
  const compAntesDepois = StudioState.comparePerspectiveRenders(rA.id, rB.id, 'BEFORE_AFTER');
  assert.strictEqual(compAntesDepois.mode, 'BEFORE_AFTER');
  assert(compAntesDepois.labels.left.includes('Antes'));
  assert(compAntesDepois.labels.right.includes('Depois'));
  assert(compAntesDepois.left.url);
  assert(compAntesDepois.right.url);

  // Modo Versão A / Versão B
  const compVersaoAB = StudioState.comparePerspectiveRenders(rA.id, rB.id, 'VERSION_A_B');
  assert.strictEqual(compVersaoAB.mode, 'VERSION_A_B');
  assert.strictEqual(compVersaoAB.labels.left, 'Versão A');
  assert.strictEqual(compVersaoAB.labels.right, 'Versão B');
  assert.strictEqual(compVersaoAB.diff.promptModified, true);
});

// ----------------------------------------------------------------------------
// GRUPO 9: APRESENTAÇÃO E INSERÇÃO EM PRANCHA (5 LAYOUTS)
// ----------------------------------------------------------------------------
console.log('\n--- GRUPO 9: APRESENTAÇÃO EM PRANCHA NOS 5 LAYOUTS CANÔNICOS ---');

runTest('9.1 Inserção diagramada na prancha respeitando printableArea em 5 layouts', () => {
  const sheet = StudioState.getSheetsByProject(testProjectId)[0];
  const printable = sheet.formatProfile.renderDimensions.screenPx.printableArea;

  const r1 = StudioState.registerPerspectiveRender({ environmentId: salaEnvId, render: 'https://img.com/r1.jpg' });
  const r2 = StudioState.registerPerspectiveRender({ environmentId: salaEnvId, render: 'https://img.com/r2.jpg' });
  const r3 = StudioState.registerPerspectiveRender({ environmentId: salaEnvId, render: 'https://img.com/r3.jpg' });
  const r4 = StudioState.registerPerspectiveRender({ environmentId: salaEnvId, render: 'https://img.com/r4.jpg' });

  // 1. Layout: single (uma imagem)
  const elsSingle = StudioState.insertPerspectiveRendersToSheet(sheet.id, [r1.id], 'single');
  assert.strictEqual(elsSingle.length, 1);
  assert(elsSingle[0].x >= printable.x, 'Single deve respeitar margem X');
  assert(elsSingle[0].y >= printable.y, 'Single deve respeitar margem Y');

  // 2. Layout: two_horizontal (duas imagens)
  const elsTwo = StudioState.insertPerspectiveRendersToSheet(sheet.id, [r1.id, r2.id], 'two_horizontal');
  assert.strictEqual(elsTwo.length, 2);
  assert(elsTwo[1].x > elsTwo[0].x, 'Segunda imagem deve estar à direita');

  // 3. Layout: three_grid (três imagens)
  const elsThree = StudioState.insertPerspectiveRendersToSheet(sheet.id, [r1.id, r2.id, r3.id], 'three_grid');
  assert.strictEqual(elsThree.length, 3);

  // 4. Layout: four_grid (quatro imagens grid 2x2)
  const elsFour = StudioState.insertPerspectiveRendersToSheet(sheet.id, [r1.id, r2.id, r3.id, r4.id], 'four_grid');
  assert.strictEqual(elsFour.length, 4);

  // 5. Layout: hero_details (imagem principal + detalhes)
  const elsHero = StudioState.insertPerspectiveRendersToSheet(sheet.id, [r1.id, r2.id, r3.id, r4.id], 'hero_details');
  assert.strictEqual(elsHero.length, 4);
  assert(elsHero[0].height > elsHero[1].height, 'Hero deve ter altura maior que os detalhes');
});

// ----------------------------------------------------------------------------
// GRUPO 12: NÃO ALTERAR IMAGENS APROVADAS
// ----------------------------------------------------------------------------
console.log('\n--- GRUPO 12: BLINDAGEM DE IMAGENS APROVADAS ---');

runTest('12.1 Não alterar automaticamente imagens aprovadas', () => {
  const render = StudioState.registerPerspectiveRender({
    environmentId: salaEnvId,
    projectId: testProjectId,
    version: 'V05_APROVADA',
    render: 'https://images.unsplash.com/sala-homologada.jpg'
  });

  // Aprova formalmente
  StudioState.approvePerspectiveRender(render.id, 'Cliente Pedro');

  // Verifica proteção contra alteração automática
  assert.strictEqual(StudioState.canModifyPerspectiveRender(render.id), false, 'Imagens aprovadas NÃO podem ser alteradas automaticamente');
});

// ----------------------------------------------------------------------------
// GRUPO 13: INTERFACE DO USUÁRIO (RenderPresentationModule)
// ----------------------------------------------------------------------------
console.log('\n--- GRUPO 13: RENDERIZAÇÃO DA INTERFACE DO USUÁRIO ---');

runTest('13.1 Módulo RenderPresentationModule renderiza painel com todas as seções', () => {
  const html = RenderPresentationModule.render(testProjectId, salaEnvId);
  assert(html.includes('render-presentation-container'), 'Deveria renderizar container');
  assert(html.includes('Consistência Automática e Locks'), 'Deveria conter seção de consistência');
  assert(html.includes('Câmeras e Enquadramentos'), 'Deveria conter seção de câmeras');
  assert(html.includes('Perspectivas e Renders Independentes'), 'Deveria conter galeria de renders');
  assert(html.includes('Comparar Renders'), 'Deveria conter botão de comparação');
  assert(html.includes('Inserir na Prancha'), 'Deveria conter ação para Prancha');
});

console.log('\n================================================================');
console.log(` RESULTADO FINAL: ${testsPassed} PASSOU | ${testsFailed} FALHOU`);
console.log('================================================================\n');

if (testsFailed > 0) {
  process.exitCode = 1;
}
