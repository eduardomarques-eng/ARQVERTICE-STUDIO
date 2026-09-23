/**
 * Suíte de Testes Automatizados — Bloco G05: Script Engine do ArqVertice Studio
 *
 * Validações exigidas:
 * - Roteiro 100% baseado no projeto real (sem inventar características não documentadas):
 *   fontes: briefing, conceito, ambiente, estilo, materiais, mobiliário, decisões,
 *   renders aprovados, observações do arquiteto, objetivo do vídeo.
 * - Cobertura dos 8 formatos de roteiro:
 *   1. roteiro técnico
 *   2. roteiro narrado
 *   3. roteiro institucional
 *   4. roteiro emocional
 *   5. roteiro curto
 *   6. roteiro para redes sociais
 *   7. roteiro para cliente
 *   8. roteiro de apresentação profissional
 * - Estrutura dos 7 trechos canônicos:
 *   HOOK, CONTEXTO, DESENVOLVIMENTO, DETALHES, CONCEITO, RESULTADO, ENCERRAMENTO.
 * - Campos obrigatórios de cada trecho:
 *   texto, duração estimada, cena, imagem, observação.
 * - Operações permitidas:
 *   editar, regenerar trecho, regenerar roteiro, comparar versões, aprovar.
 * - Regra Fundamental de Granularidade:
 *   "Não substituir o texto inteiro quando o usuário solicitar alteração de somente um trecho."
 * - Sistema de Versionamento Histórico (V01, V02...).
 * - Renderização da Interface (VideoScriptEngineModule).
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
const VideoScriptEngineModule = require('../js/video-script-engine-module.js');

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
console.log('SUÍTE DE TESTES: BLOCO G05 — SCRIPT ENGINE DO VÍDEO');
console.log('================================================================\n');

// 1. Constantes e Definições de Formato e Estrutura
runTest('Deve conter exatamente os 8 formatos de roteiro canônicos', () => {
  const expectedFormats = [
    'roteiro técnico',
    'roteiro narrado',
    'roteiro institucional',
    'roteiro emocional',
    'roteiro curto',
    'roteiro para redes sociais',
    'roteiro para cliente',
    'roteiro de apresentação profissional'
  ];

  assert.ok(StudioState.SCRIPT_FORMATS, 'SCRIPT_FORMATS deve existir');
  assert.strictEqual(StudioState.SCRIPT_FORMATS.length, 8);
  expectedFormats.forEach(fmt => {
    assert.ok(StudioState.SCRIPT_FORMATS.includes(fmt), `Deve conter formato: ${fmt}`);
  });
});

runTest('Deve conter a estrutura dos 7 trechos canônicos', () => {
  const expectedSections = [
    'HOOK',
    'CONTEXTO',
    'DESENVOLVIMENTO',
    'DETALHES',
    'CONCEITO',
    'RESULTADO',
    'ENCERRAMENTO'
  ];

  assert.ok(StudioState.SCRIPT_STRUCTURE_SECTIONS, 'SCRIPT_STRUCTURE_SECTIONS deve existir');
  assert.strictEqual(StudioState.SCRIPT_STRUCTURE_SECTIONS.length, 7);
  assert.deepStrictEqual(StudioState.SCRIPT_STRUCTURE_SECTIONS, expectedSections);
});

// 2. Extração de Contexto Real do Projeto
runTest('collectProjectScriptContext deve extrair dados reais das 10 fontes de contexto sem inventar dados', () => {
  const projectId = 'prj-praia-01';
  const video = StudioState.createVideoProject({
    projectId,
    title: 'Vídeo Script Context Real — Teste G05',
    type: 'apresentacao_completa'
  });

  const ctx = StudioState.collectProjectScriptContext(projectId, video.id);

  assert.ok(ctx.projectName, 'Deve conter projectName do projeto');
  assert.ok(ctx.location, 'Deve conter location do projeto');
  assert.ok(ctx.briefingObjectives, 'Deve conter objetivos do briefing');
  assert.ok(ctx.conceptName, 'Deve conter nome do conceito');
  assert.ok(ctx.environmentsList.length > 0, 'Deve conter lista de ambientes reais');
  assert.ok(ctx.materialsList.length > 0, 'Deve conter materiais homologados reais');
  assert.ok(ctx.decisionsList.length > 0, 'Deve conter decisões homologadas reais');
  assert.ok(ctx.approvedRenders.length > 0, 'Deve conter renders aprovados reais');
  assert.ok(ctx.architectNotes.length > 0, 'Deve conter notas reais do arquiteto');
  assert.ok(ctx.videoObjective, 'Deve conter objetivo do vídeo');
});

// 3. Geração de Roteiro e Validação dos Campos dos Trechos
runTest('generateScript deve criar roteiro com os 7 trechos contendo todos os campos exigidos', () => {
  const projectId = 'prj-praia-01';
  const video = StudioState.createVideoProject({
    projectId,
    title: 'Vídeo Narrado Completo',
    type: 'apresentacao_completa'
  });

  const script = StudioState.generateScript(video.id, 'roteiro narrado');

  assert.ok(script.id, 'Deve conter id');
  assert.strictEqual(script.videoProjectId, video.id);
  assert.strictEqual(script.format, 'roteiro narrado');
  assert.strictEqual(script.versionLabel, 'V01');
  assert.strictEqual(script.versionNumber, 1);
  assert.strictEqual(script.isApproved, false);
  assert.strictEqual(script.sections.length, 7, 'Deve conter exatamente 7 trechos');

  // Valida campos obrigatórios de cada trecho: texto, duração estimada, cena, imagem, observação
  script.sections.forEach((sec, idx) => {
    assert.ok(sec.id, `Trecho ${idx} deve conter id`);
    assert.ok(sec.sectionType, `Trecho ${idx} deve conter sectionType`);
    assert.strictEqual(typeof sec.text, 'string', `Trecho ${idx} deve ter texto`);
    assert.ok(sec.text.length > 10, `Trecho ${idx} texto deve ser substantivo`);
    assert.strictEqual(typeof sec.durationSeconds, 'number', `Trecho ${idx} deve ter duração numérica`);
    assert.ok(sec.durationSeconds > 0, `Trecho ${idx} duração deve ser maior que 0`);
    assert.ok(sec.sceneTitle, `Trecho ${idx} deve conter cena`);
    assert.ok(sec.imageUrl, `Trecho ${idx} deve conter imagem`);
    assert.ok(sec.notes, `Trecho ${idx} deve conter observação`);
  });
});

// 4. Suporte a Todos os 8 Formatos de Roteiro
runTest('Deve gerar roteiro com adequação semântica para cada um dos 8 formatos', () => {
  const projectId = 'prj-praia-01';
  const video = StudioState.createVideoProject({ projectId, title: 'Vídeo Multi Formatos' });

  StudioState.SCRIPT_FORMATS.forEach(fmt => {
    const s = StudioState.generateScript(video.id, fmt);
    assert.strictEqual(s.format, fmt);
    assert.strictEqual(s.sections.length, 7);

    // Valida particularidades de texto de acordo com o formato
    const hookText = s.sections.find(sec => sec.sectionType === 'HOOK').text.toLowerCase();
    if (fmt === 'roteiro para redes sociais') {
      assert.ok(hookText.includes('você moraria') || hookText.includes('conheça'));
    } else if (fmt === 'roteiro técnico') {
      assert.ok(hookText.includes('análise técnica') || hookText.includes('orientação solar'));
    } else if (fmt === 'roteiro emocional') {
      assert.ok(hookText.includes('luxo') || hookText.includes('calma') || hookText.includes('família'));
    }
  });
});

// 5. Regra Crítica: "Não substituir o texto inteiro quando o usuário solicitar alteração de somente um trecho"
runTest('regenerateScriptSection deve alterar APENAS o trecho solicitado, mantendo os outros 6 trechos rigorosamente intactos', () => {
  const projectId = 'prj-praia-01';
  const video = StudioState.createVideoProject({ projectId, title: 'Vídeo Teste Granularidade' });
  const script = StudioState.generateScript(video.id, 'roteiro narrado');

  // Guarda snapshot dos textos originais
  const originalTexts = script.sections.map(s => ({ type: s.sectionType, text: s.text }));

  // Regenera APENAS o trecho DETALHES
  StudioState.regenerateScriptSection(script.id, 'DETALHES', 'Arquiteto');

  const updatedScript = StudioState.getScript(script.id);
  assert.strictEqual(updatedScript.versionNumber, 2, 'Deve ter incrementado a versão para V02');
  assert.strictEqual(updatedScript.versionLabel, 'V02');

  // Verifica que o trecho DETALHES mudou
  const newDetalhes = updatedScript.sections.find(s => s.sectionType === 'DETALHES');
  const oldDetalhes = originalTexts.find(s => s.type === 'DETALHES');
  assert.notStrictEqual(newDetalhes.text, oldDetalhes.text, 'Trecho DETALHES deve ter sido alterado');

  // REGRA DE OURO: Verifica que todos os outros 6 trechos permaneceram RIGOROSAMENTE IDÊNTICOS
  updatedScript.sections.forEach(sec => {
    if (sec.sectionType !== 'DETALHES') {
      const orig = originalTexts.find(s => s.type === sec.sectionType);
      assert.strictEqual(
        sec.text,
        orig.text,
        `O trecho "${sec.sectionType}" NÃO DEVERIA TER SIDO ALTERADO!`
      );
    }
  });
});

// 6. Operação: Edição Manual de Trecho
runTest('updateScriptSection deve permitir atualizar texto, duração e observação de um trecho específico', () => {
  const projectId = 'prj-praia-01';
  const video = StudioState.createVideoProject({ projectId, title: 'Vídeo Teste Edição Trecho' });
  const script = StudioState.generateScript(video.id, 'roteiro narrado');
  const targetSection = script.sections[0]; // HOOK

  StudioState.updateScriptSection(script.id, targetSection.id, {
    text: 'Texto personalizado editado manualmente pelo arquiteto.',
    durationSeconds: 9.5,
    notes: 'Plano com lente 35mm em traveling lateral.'
  }, 'Arquiteto Titular');

  const reloaded = StudioState.getScript(script.id);
  const updated = reloaded.sections.find(s => s.id === targetSection.id);

  assert.strictEqual(updated.text, 'Texto personalizado editado manualmente pelo arquiteto.');
  assert.strictEqual(updated.durationSeconds, 9.5);
  assert.strictEqual(updated.notes, 'Plano com lente 35mm em traveling lateral.');
});

// 7. Sistema de Versionamento e Comparação de Versões
runTest('Deve criar versões históricas sucessivas e permitir comparação lado a lado', () => {
  const projectId = 'prj-praia-01';
  const video = StudioState.createVideoProject({ projectId, title: 'Vídeo Teste Versionamento' });
  const script = StudioState.generateScript(video.id, 'roteiro narrado');

  // V01 criada na geração
  assert.strictEqual(StudioState.getScriptVersions(script.id).length, 1);

  // Gera V02 via alteração de trecho
  StudioState.regenerateScriptSection(script.id, 'HOOK', 'Arquiteto');
  const versionsAfterV02 = StudioState.getScriptVersions(script.id);
  assert.strictEqual(versionsAfterV02.length, 2);
  assert.strictEqual(versionsAfterV02[0].versionLabel, 'V02');
  assert.strictEqual(versionsAfterV02[1].versionLabel, 'V01');

  // Compara V01 com V02
  const comparison = StudioState.compareScriptVersions(script.id, versionsAfterV02[1].id, versionsAfterV02[0].id);

  assert.ok(comparison.sectionDiffs, 'Deve retornar lista de diffs');
  assert.strictEqual(comparison.sectionDiffs.length, 7);
  assert.strictEqual(comparison.totalSectionsModified, 1, 'Exatamente 1 trecho deve estar marcado como modificado');

  const hookDiff = comparison.sectionDiffs.find(d => d.sectionType === 'HOOK');
  assert.strictEqual(hookDiff.isModified, true);

  const contextoDiff = comparison.sectionDiffs.find(d => d.sectionType === 'CONTEXTO');
  assert.strictEqual(contextoDiff.isModified, false);
});

// 8. Homologação e Aprovação do Roteiro
runTest('approveScript deve homologar a versão corrente com carimbo de tempo e responsável', () => {
  const projectId = 'prj-praia-01';
  const video = StudioState.createVideoProject({ projectId, title: 'Vídeo Teste Aprovação Roteiro' });
  const script = StudioState.generateScript(video.id, 'roteiro institucional');

  StudioState.approveScript(script.id, 'Eduardo Marques (Arquiteto Líder)');

  const approved = StudioState.getScript(script.id);
  assert.strictEqual(approved.isApproved, true);
  assert.strictEqual(approved.approvedBy, 'Eduardo Marques (Arquiteto Líder)');
  assert.ok(approved.approvedAt);

  // Versão correspondente também deve ser marcada como aprovada
  const currentVersion = StudioState.getScriptVersions(script.id).find(v => v.versionNumber === approved.versionNumber);
  assert.ok(currentVersion);
  assert.strictEqual(currentVersion.isApproved, true);
});

// 9. Interface do Usuário (VideoScriptEngineModule)
runTest('VideoScriptEngineModule deve renderizar a tela completa com os 8 formatos e 7 cards', () => {
  const projectId = 'prj-praia-01';
  const video = StudioState.createVideoProject({
    projectId,
    title: 'Vídeo Interface Script Render',
    type: 'apresentacao_projeto'
  });

  const html = VideoScriptEngineModule.renderScriptEngine(video.id, projectId);

  assert.ok(html.includes('BLOCO G05'), 'Deve conter identificação G05');
  assert.ok(html.includes('Roteiro Baseado no Projeto Real'), 'Deve conter banner de dados reais');
  assert.ok(html.includes('Formato do Roteiro (8 Estilos Canônicos)'), 'Deve conter seletor de formatos');
  assert.ok(html.includes('Estrutura Narrativa do Roteiro (7 Trechos)'), 'Deve conter cabeçalho dos 7 trechos');
  assert.ok(html.includes('HOOK'), 'Deve exibir trecho HOOK');
  assert.ok(html.includes('CONTEXTO'), 'Deve exibir trecho CONTEXTO');
  assert.ok(html.includes('DESENVOLVIMENTO'), 'Deve exibir trecho DESENVOLVIMENTO');
  assert.ok(html.includes('DETALHES'), 'Deve exibir trecho DETALHES');
  assert.ok(html.includes('CONCEITO'), 'Deve exibir trecho CONCEITO');
  assert.ok(html.includes('RESULTADO'), 'Deve exibir trecho RESULTADO');
  assert.ok(html.includes('ENCERRAMENTO'), 'Deve exibir trecho ENCERRAMENTO');
  assert.ok(html.includes('Regenerar Trecho'), 'Deve conter botão para regenerar apenas aquele trecho');
  assert.ok(html.includes('Homologar & Finalizar G05 →') || html.includes('Finalizar G05'), 'Deve conter botão de conclusão de G05');
});

console.log('\n================================================================');
console.log(`RESULTADO DOS TESTES G05:`);
console.log(`  Sucessos: ${testsPassed}`);
console.log(`  Falhas:   ${testsFailed}`);
console.log('================================================================');

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log('Todos os testes do Bloco G05 passaram com 100% de conformidade!\n');
}
