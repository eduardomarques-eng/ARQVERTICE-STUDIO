/**
 * ============================================================================
 * ARQVERTICE STUDIO — SUÍTE DE TESTES: BLOCO G07 — VIDEO PROMPT ENGINE
 * ============================================================================
 * Testa o compilador de prompts cinematográficos provider-agnostic:
 * 1. Arquitetura Provider-Agnostic e Registro dos 5 Provedores
 * 2. Matriz de Capacidades sem Paridade Cega
 * 3. Criação de VideoPrompt com os 10 campos canônicos
 * 4. Compilador de Contexto a partir das 11 fontes canônicas
 * 5. Geração completa dos 8 componentes de saída
 * 6. Aplicação e Declaração da Regra Fundamental de Locks
 * 7. Adaptação Semântica por Provedor (Gemini, Google Veo, Externos, Local)
 * 8. Versionamento Não-Destrutivo (política de nunca apagar versões anteriores)
 * 9. Comparador de Versões Históricas
 * 10. Renderização da Interface VideoPromptEngineModule
 * ============================================================================
 */

global.window = {
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
  }
};
global.localStorage = global.window.localStorage;
global.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => []
};

const assert = require('assert');
const StudioState = require('../js/state.js');
const { videoPromptRegistry } = require('../js/video-prompt-providers.js');
const VideoPromptEngineModule = require('../js/video-prompt-engine-module.js');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✔ [PASS] ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(err);
  }
}

console.log('================================================================');
console.log('SUÍTE DE TESTES: BLOCO G07 — VIDEO PROMPT ENGINE (AUDIOVISUAL)');
console.log('================================================================\n');

StudioState.init();

// 1. Provedores Provider-Agnostic
runTest('Deve registrar os 5 provedores canônicos na arquitetura provider-agnostic', () => {
  const providers = videoPromptRegistry.list();
  assert.strictEqual(providers.length, 5, 'Deve conter exatamente 5 provedores registrados');

  const providerIds = providers.map(p => p.id);
  assert.ok(providerIds.includes('gemini'), 'Deve incluir Gemini');
  assert.ok(providerIds.includes('google_veo'), 'Deve incluir Google Flow / Veo');
  assert.ok(providerIds.includes('external_video_models'), 'Deve incluir Modelos Comerciais (Runway/Luma/Kling)');
  assert.ok(providerIds.includes('external_tools'), 'Deve incluir Ferramentas Externas (ComfyUI/MJ)');
  assert.ok(providerIds.includes('local_generator'), 'Deve incluir Geração Local Futura');
});

// 2. Matriz de Capacidades Diferenciadas
runTest('Matriz de capacidades deve refletir diferenças entre APIs sem assumir paridade cega', () => {
  const geminiCaps = videoPromptRegistry.getCapabilities('gemini');
  const veoCaps = videoPromptRegistry.getCapabilities('google_veo');
  const localCaps = videoPromptRegistry.getCapabilities('local_generator');
  const extToolsCaps = videoPromptRegistry.getCapabilities('external_tools');

  // Gemini não possui negative prompt como parâmetro separado (é embutido no NLP)
  assert.strictEqual(geminiCaps.supportsNegativePrompt, false);
  // Google Veo suporta negative prompt e tokens de câmera
  assert.strictEqual(veoCaps.supportsNegativePrompt, true);
  assert.strictEqual(veoCaps.supportsCameraControl, true);
  // Geração local suporta execução local
  assert.strictEqual(localCaps.supportsLocalExecution, true);
  // Ferramentas externas exigem exportação de manifesto/CLI
  assert.strictEqual(extToolsCaps.requiresExternalToolExport, true);
});

// 3. Entidade VideoPrompt e Campos Obrigatórios
runTest('compileVideoPrompt deve criar VideoPrompt com todos os campos obrigatórios', () => {
  const video = StudioState.createVideoProject({
    projectId: 'prj-praia-01',
    title: 'Vídeo Teste VideoPrompt',
    type: 'apresentacao_projeto'
  });

  const prompt = StudioState.compileVideoPrompt(video.id, null, { provider: 'google_veo' });

  assert.ok(prompt.id, 'Deve conter id');
  assert.strictEqual(prompt.videoProjectId, video.id);
  assert.ok(prompt.sceneId, 'Deve conter sceneId');
  assert.strictEqual(prompt.provider, 'google_veo');
  assert.ok(prompt.model, 'Deve conter model');
  assert.ok(typeof prompt.prompt === 'string' && prompt.prompt.length > 20, 'Deve conter prompt principal');
  assert.ok(typeof prompt.negativePrompt === 'string', 'Deve conter negativePrompt');
  assert.ok(Array.isArray(prompt.referenceAssets), 'referenceAssets deve ser array');
  assert.ok(typeof prompt.parameters === 'object', 'parameters deve ser objeto');
  assert.strictEqual(prompt.version, 1, 'Versão inicial deve ser 1');
  assert.strictEqual(prompt.versionLabel, 'V01');
  assert.strictEqual(prompt.status, 'compiled');
});

// 4. Compilador recebe as 11 Fontes Canônicas
runTest('Compilador deve agregar as 11 fontes canônicas de contexto sem alucinar dados', () => {
  const video = StudioState.createVideoProject({
    projectId: 'prj-praia-01',
    title: 'Vídeo Teste 11 Fontes'
  });

  const prompt = StudioState.compileVideoPrompt(video.id);
  const data = prompt.compiledData;

  assert.ok(data.projectName, 'Fonte 1: PROJETO presente');
  assert.ok(data.environmentName, 'Fonte 2: AMBIENTE presente');
  assert.ok(data.architecturalStyle, 'Fonte 3: ESTILO presente');
  assert.ok(Array.isArray(data.referenceAssets), 'Fonte 4: REFERÊNCIAS presente');
  assert.ok(data.referenceAssets.some(r => r.category === 'IMAGEM_BASE' || r.id === 'base-render'), 'Fonte 5: IMAGEM BASE presente');
  assert.ok(data.cameraFraming, 'Fonte 6: CÂMERA presente');
  assert.ok(data.cameraMovement, 'Fonte 7: MOVIMENTO presente');
  assert.ok(data.lightingDirection, 'Fonte 8: ILUMINAÇÃO presente');
  assert.ok(data.materialsSummary, 'Fonte 9: MATERIAIS presente');
  assert.ok(Array.isArray(data.locks) && data.locks.length > 0, 'Fonte 10: LOCKS presente');
  assert.ok(data.scenePurpose, 'Fonte 11: OBJETIVO DA CENA presente');
});

// 5. Geração dos 8 Componentes de Saída
runTest('Compilador deve gerar os 8 componentes canônicos exigidos', () => {
  const video = StudioState.createVideoProject({
    projectId: 'prj-praia-01',
    title: 'Vídeo Teste 8 Componentes'
  });

  const p = StudioState.compileVideoPrompt(video.id);

  assert.ok(p.promptPrincipal && p.promptPrincipal.length > 0, '1. prompt principal deve existir');
  assert.ok(p.restrições && p.restrições.length > 0, '2. restrições deve existir');
  assert.ok(Array.isArray(p.elementosAPreservar) && p.elementosAPreservar.length > 0, '3. elementos a preservar deve existir');
  assert.ok(p.movimento && p.movimento.length > 0, '4. movimento deve existir');
  assert.ok(p.câmera && p.câmera.length > 0, '5. câmera deve existir');
  assert.ok(p.duração && p.duração.length > 0, '6. duração deve existir');
  assert.ok(p.formato && p.formato.length > 0, '7. formato deve existir');
  assert.ok(p.observações && p.observações.length > 0, '8. observações deve existir');
});

// 6. Regra Fundamental de Locks
runTest('Regra Fundamental: deve declarar explicitamente os locks de geometria, layout, proporções, aberturas, materiais e mobiliário', () => {
  const video = StudioState.createVideoProject({
    projectId: 'prj-praia-01',
    title: 'Vídeo Locks Test'
  });

  const prompt = StudioState.compileVideoPrompt(video.id, null, { provider: 'google_veo' });

  const preserved = prompt.elementosAPreservar.join(' ');
  assert.ok(preserved.includes('GEOMETRIA'), 'Deve declarar lock de GEOMETRIA');
  assert.ok(preserved.includes('LAYOUT'), 'Deve declarar lock de LAYOUT');
  assert.ok(preserved.includes('PROPORÇÕES'), 'Deve declarar lock de PROPORÇÕES');
  assert.ok(preserved.includes('ABERTURAS'), 'Deve declarar lock de ABERTURAS');
  assert.ok(preserved.includes('MATERIAIS'), 'Deve declarar lock de MATERIAIS');
  assert.ok(preserved.includes('MOBILIÁRIO'), 'Deve declarar lock de MOBILIÁRIO');

  // Verifica que o prompt e negativePrompt contêm proibições contra alteração desses elementos
  const allPromptText = (prompt.prompt + ' ' + (prompt.negativePrompt || '')).toLowerCase();
  assert.ok(
    allPromptText.includes('geometry') || allPromptText.includes('geometria') || allPromptText.includes('morphing'),
    'Prompt ou negative prompt deve blindar geometria contra distorção'
  );
});

// 7. Adaptação Semântica por Provedor
runTest('Deve adaptar a formatação do prompt especificamente para cada tipo de provedor', () => {
  const video = StudioState.createVideoProject({
    projectId: 'prj-praia-01',
    title: 'Vídeo Multi-Provider Test'
  });

  // Teste Gemini
  const pGemini = StudioState.compileVideoPrompt(video.id, null, { provider: 'gemini' });
  assert.ok(pGemini.prompt.includes('[ARCHITECTURAL CINEMATOGRAPHY DIRECTIVE]'), 'Gemini deve conter cabeçalho cinematográfico');
  assert.ok(pGemini.prompt.includes('[CRITICAL ARCHITECTURAL CONSTRAINTS - STRICT LOCKS]'), 'Gemini deve incorporar restrições no corpo');

  // Teste Google Veo
  const pVeo = StudioState.compileVideoPrompt(video.id, null, { provider: 'google_veo' });
  assert.ok(pVeo.prompt.includes('[Camera:'), 'Google Veo deve conter tokens de câmera');
  assert.ok(pVeo.negativePrompt.includes('morphing geometry'), 'Google Veo deve conter negative prompt de geometria');

  // Teste Ferramentas Externas
  const pExt = StudioState.compileVideoPrompt(video.id, null, { provider: 'external_tools' });
  assert.ok(pExt.prompt.includes('--ar'), 'Ferramentas externas deve incluir parâmetros CLI como --ar');

  // Teste Geração Local Futura
  const pLocal = StudioState.compileVideoPrompt(video.id, null, { provider: 'local_generator' });
  assert.ok(pLocal.parameters.steps !== undefined, 'Geração local deve especificar steps de difusão');
  assert.ok(pLocal.parameters.localEndpoint, 'Geração local deve referenciar endpoint local');
});

// 8. Versionamento Não-Destrutivo (Política de Não-Apagar)
runTest('saveVideoPromptVersion deve criar versões sucessivas e NUNCA apagar versões anteriores', () => {
  const video = StudioState.createVideoProject({
    projectId: 'prj-praia-01',
    title: 'Vídeo Versionamento Test'
  });

  const initialPrompt = StudioState.compileVideoPrompt(video.id);
  assert.strictEqual(initialPrompt.version, 1);
  assert.strictEqual(initialPrompt.versionLabel, 'V01');

  // Cria V02
  const updatedV02 = StudioState.saveVideoPromptVersion(
    initialPrompt.id,
    { prompt: 'Prompt refinado com iluminação crepuscular e câmera lenta.' },
    'Refinamento de iluminação',
    'Arquiteto Titular'
  );
  assert.strictEqual(updatedV02.version, 2);
  assert.strictEqual(updatedV02.versionLabel, 'V02');

  // Cria V03
  const updatedV03 = StudioState.saveVideoPromptVersion(
    initialPrompt.id,
    { prompt: 'Prompt com ênfase em marcenaria e reflexo no porcelanato.' },
    'Foco em detalhes de materiais',
    'Arquiteto Titular'
  );
  assert.strictEqual(updatedV03.version, 3);
  assert.strictEqual(updatedV03.versionLabel, 'V03');

  // REGRA DE OURO: Consulta histórico e garante que V01, V02 e V03 coexistem
  const allVersions = StudioState.getVideoPromptVersions(initialPrompt.id);
  assert.strictEqual(allVersions.length, 3, 'Todas as 3 versões devem ser preservadas sem exclusão');

  const vLabels = allVersions.map(v => v.versionLabel);
  assert.ok(vLabels.includes('V01'), 'V01 deve existir intacta no histórico');
  assert.ok(vLabels.includes('V02'), 'V02 deve existir intacta no histórico');
  assert.ok(vLabels.includes('V03'), 'V03 deve existir intacta no histórico');
});

// 9. Comparação Lado a Lado entre Versões
runTest('compareVideoPromptVersions deve detectar diferenças textuais entre versões históricas', () => {
  const video = StudioState.createVideoProject({
    projectId: 'prj-praia-01',
    title: 'Vídeo Diff Test'
  });

  const initial = StudioState.compileVideoPrompt(video.id);
  StudioState.saveVideoPromptVersion(
    initial.id,
    { prompt: 'Texto alterado para V02' },
    'Alteração de texto'
  );

  const diff = StudioState.compareVideoPromptVersions(initial.id, 'V01', 'V02');
  assert.strictEqual(diff.versionA.label, 'V01');
  assert.strictEqual(diff.versionB.label, 'V02');
  assert.strictEqual(diff.isPromptModified, true, 'Deve indicar que o prompt foi modificado');
});

// 10. Renderização da Interface
runTest('VideoPromptEngineModule deve renderizar a tela completa com provedores, 8 blocos e locks', () => {
  const video = StudioState.createVideoProject({
    projectId: 'prj-praia-01',
    title: 'Vídeo UI Test'
  });

  const html = VideoPromptEngineModule.render(video.id);

  assert.ok(html.includes('Prompt Engine Audiovisual'), 'Deve conter título principal');
  assert.ok(html.includes('Google Gemini'), 'Deve renderizar provedor Gemini');
  assert.ok(html.includes('Google Flow / Veo'), 'Deve renderizar provedor Google Veo');
  assert.ok(html.includes('1. Prompt Principal'), 'Deve conter seção 1. Prompt Principal');
  assert.ok(html.includes('2. Restrições & Negative Prompt'), 'Deve conter seção 2. Restrições');
  assert.ok(html.includes('3. Elementos a Preservar'), 'Deve conter seção 3. Elementos a Preservar');
  assert.ok(html.includes('REGRA FUNDAMENTAL'), 'Deve conter alerta da Regra Fundamental');
  assert.ok(html.includes('Copiar Prompt'), 'Deve conter botão de cópia');
  assert.ok(html.includes('G07 — Prompt Engine Audiovisual'), 'Deve identificar Bloco G07');
});

console.log('\n================================================================');
console.log('RESULTADO DOS TESTES G07:');
console.log(`  Sucessos: ${passedTests}`);
console.log(`  Falhas:   ${failedTests}`);
console.log('================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('Todos os testes do Bloco G07 passaram com 100% de conformidade!\n');
}
