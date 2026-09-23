/**
 * tests/multimodal-intelligence.test.js
 * Suíte de Testes Automatizados para a Camada Multimodal de IA — ArqVértice Studio (Bloco J: J01 → J05)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const MultimodalAgentCore = require('../js/multimodal-agent-core.js');
const VisualPerceptionModule = require('../js/visual-perception-engine.js');
const ImageEditingModule = require('../js/image-editing-engine.js');
const VisualToStructureModule = require('../js/visual-to-structure.js');

console.log('================================================================');
console.log('🧠 TESTES DA CAMADA MULTIMODAL INTELIGENTE (BLOCO J: J01 → J05)');
console.log('================================================================\n');

let passedTests = 0;
let failedTests = 0;

function runTest(testName, testFn) {
  try {
    testFn();
    console.log(`  ✔ [PASS] ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✖ [FAIL] ${testName}`);
    console.error(`     Erro: ${err.message}\n`);
    failedTests++;
  }
}

async function runAsyncTest(testName, testFn) {
  try {
    await testFn();
    console.log(`  ✔ [PASS] ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✖ [FAIL] ${testName}`);
    console.error(`     Erro: ${err.message}\n`);
    failedTests++;
  }
}

(async () => {
  // --------------------------------------------------------------------------
  // J01 — AUDITORIA E MATRIZ DE ADOÇÃO DE REPOSITÓRIOS
  // --------------------------------------------------------------------------
  console.log('--- 1. Auditoria e Matriz de Adoção de Repositórios (J01) ---');

  runTest('J01.1: repository-adoption.md deve existir e documentar os candidatos estipulados', () => {
    const docPath = path.resolve('docs/intelligence/repository-adoption.md');
    assert.strictEqual(fs.existsSync(docPath), true, 'Arquivo repository-adoption.md deve existir');

    const content = fs.readFileSync(docPath, 'utf8');
    const requiredCandidates = [
      'UI-TARS',
      'Qwen3-VL',
      'mcp-for-blender',
      'FreeCAD-MCP',
      'CADAgent',
      'TRELLIS',
      'sam3',
      'Qwen-Image',
      'ThatOpen',
      'Remotion'
    ];

    for (const cand of requiredCandidates) {
      assert.strictEqual(content.includes(cand), true, `Deve conter análise do candidato [${cand}]`);
    }

    assert.strictEqual(content.includes('CORE'), true, 'Deve conter classificação CORE');
    assert.strictEqual(content.includes('ADAPTER'), true, 'Deve conter classificação ADAPTER');
    assert.strictEqual(content.includes('REFERENCE'), true, 'Deve conter classificação REFERENCE');
  });

  // --------------------------------------------------------------------------
  // J02 — AGENTIC MULTIMODAL CORE
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Agentic Multimodal Core & State Machine (J02) ---');

  runTest('J02.1: MultimodalAgent deve inicializar com guard rails anti-loop e papéis de modelo', () => {
    const agent = MultimodalAgentCore.createAgent({ maxSteps: 6, timeoutMs: 15000 });
    assert.strictEqual(agent.config.maxSteps, 6);
    assert.strictEqual(agent.config.timeoutMs, 15000);
    assert.strictEqual(agent.state, MultimodalAgentCore.AgentState.IDLE);
    assert.ok(MultimodalAgentCore.ModelRole.VISION);
    assert.ok(MultimodalAgentCore.ModelRole.BIM_TOOL);
  });

  await runAsyncTest('J02.2: analyze() deve receber payload composto (texto+imagem+arquivo+estado+seleção) e produzir resultado estruturado', async () => {
    const agent = MultimodalAgentCore.createAgent();
    const payload = {
      text: 'Analise esta planta baixa e prepare a conversão para modelo BIM',
      image: { type: 'floorplan', url: 'projects/planta_baixa_01.png' },
      file: { name: 'memorial_descritivo.pdf', type: 'application/pdf', size: 10240 },
      projectState: { id: 'prj_alphaville_01', name: 'Residência Alphaville' },
      currentSelection: { id: 'space_living', type: 'Room' }
    };

    const outcome = await agent.analyze(payload);

    assert.strictEqual(outcome.success, true, 'Execução multimodal deve ser bem-sucedida');
    assert.strictEqual(outcome.finalState, MultimodalAgentCore.AgentState.COMPLETE);
    assert.ok(outcome.understanding, 'Deve produzir objeto de understanding');
    assert.strictEqual(outcome.understanding.intent, 'CONVERT_DRAWING_TO_BIM');
    assert.ok(outcome.plan, 'Deve produzir plano de execução');
    assert.strictEqual(outcome.plan.steps.length >= 2, true, 'Deve conter múltiplos passos');
    assert.ok(outcome.validation.passed, 'Validação deve passar');
    assert.strictEqual(outcome.history.length >= 5, true, 'Deve registrar histórico das etapas');
  });

  await runAsyncTest('J02.3: Anti-loop guard rail deve interromper execução se exceder maxSteps', async () => {
    const agent = MultimodalAgentCore.createAgent({ maxSteps: 1 });
    const payload = {
      text: 'Troque o mármore por madeira e atualize o render',
      image: { type: 'render', url: 'render_sala.png' }
    };

    const outcome = await agent.analyze(payload);
    assert.strictEqual(outcome.success, false, 'Deve abortar por limite de passos');
    assert.strictEqual(outcome.finalState, MultimodalAgentCore.AgentState.FAILED);
    assert.strictEqual(outcome.message.includes('anti-loop guard'), true);
  });

  // --------------------------------------------------------------------------
  // J03 — VISUAL PERCEPTION ENGINE
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Visual Perception Engine (J03) ---');

  await runAsyncTest('J03.1: processScene deve detectar objetos, bounding boxes [0..1000] e metadados de segurança', async () => {
    const engine = VisualPerceptionModule.createEngine();
    const scene = await engine.processScene('projects/render_living.png', { imageType: 'render' });

    assert.ok(scene.metadata, 'Deve conter metadados');
    assert.strictEqual(scene.metadata.model.includes('Qwen'), true);
    assert.strictEqual(typeof scene.metadata.confidence, 'number');
    assert.strictEqual(scene.objects.length >= 4, true, 'Deve detectar múltiplos objetos visuais');

    // Checagem de coordenadas normalizadas do primeiro objeto
    const firstObj = scene.objects[0];
    assert.strictEqual(firstObj.bbox.length, 4);
    assert.ok(firstObj.bbox[0] >= 0 && firstObj.bbox[2] <= 1000, 'Coordenadas Y devem ser normalizadas');
    assert.ok(firstObj.bbox[1] >= 0 && firstObj.bbox[3] <= 1000, 'Coordenadas X devem ser normalizadas');
    assert.ok(firstObj.confidence >= 0.90, 'Confiança deve ser alta');
  });

  await runAsyncTest('J03.2: Spatial Grounding deve responder a consultas de posição e relações espaciais', async () => {
    const engine = VisualPerceptionModule.createEngine();
    const scene = await engine.processScene('projects/render_living.png', { imageType: 'render' });

    const spatialAnswer = scene.getSpatialQuery('onde está o sofá?');
    assert.strictEqual(spatialAnswer.found, true);
    assert.ok(spatialAnswer.centerNormalized, 'Deve retornar centro normalizado');
    assert.ok(spatialAnswer.depthCategory, 'Deve retornar categoria de profundidade');

    const relationAnswer = scene.getSpatialQuery('qual a relação espacial dos elementos?');
    assert.strictEqual(relationAnswer.found, true);
    assert.strictEqual(relationAnswer.relationships.length >= 2, true);
  });

  // --------------------------------------------------------------------------
  // J04 — IMAGE UNDERSTANDING + IMAGE EDITING ENGINE
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Image Understanding & Mask-First Editing (J04) ---');

  await runAsyncTest('J04.1: executeMaskFirstEdit deve executar edição localizada com versionamento e reversibilidade', async () => {
    const editor = ImageEditingModule.createEngine();
    editor.init('projects/render_base_sala.png');

    // Edição 1: Troca de piso
    const edit1 = await editor.executeMaskFirstEdit({
      operation: ImageEditingModule.EditOperationType.MATERIAL_CHANGE,
      instruction: 'Substitua o piso existente por madeira clara em réguas',
      targetObjectOrCategory: 'Floor'
    });

    assert.strictEqual(edit1.success, true);
    assert.strictEqual(edit1.version, 1);
    assert.ok(edit1.maskRegion, 'Deve conter máscara da região');
    assert.strictEqual(edit1.diffSummary.modifiedAreaPercent > 0, true);
    assert.strictEqual(edit1.consistencyAudit.overallConsistencyScore >= 0.90, true);

    // Edição 2: Alteração de painel de parede (edição sequencial iterativa)
    const edit2 = await editor.executeMaskFirstEdit({
      operation: ImageEditingModule.EditOperationType.MATERIAL_CHANGE,
      instruction: 'Altere o painel de madeira para mármore travertino romano',
      targetObjectOrCategory: 'Wall'
    });

    assert.strictEqual(edit2.success, true);
    assert.strictEqual(edit2.version, 2);
    assert.strictEqual(editor.versionHistory.length, 2);

    // Reversibilidade: Reverter para versão 1
    const revertResult = editor.revertToVersion(1);
    assert.strictEqual(revertResult.reverted, true);
    assert.strictEqual(revertResult.activeVersion, 1);

    // Reverter para original (versão 0)
    const revertOriginal = editor.revertToVersion(0);
    assert.strictEqual(revertOriginal.reverted, true);
    assert.strictEqual(revertOriginal.activeVersion, 0);
  });

  // --------------------------------------------------------------------------
  // J05 — VISUAL-TO-STRUCTURE ENGINE
  // --------------------------------------------------------------------------
  console.log('\n--- 5. Visual-to-Structure Engine & Scene Graph (J05) ---');

  await runAsyncTest('J05.1: buildSceneGraph deve criar ProjectSceneGraph completo a partir de percepção visual', async () => {
    const perception = VisualPerceptionModule.createEngine();
    const scene = await perception.processScene('projects/planta_baixa.png', { imageType: 'floorplan' });

    const bridge = VisualToStructureModule.createEngine();
    const sceneGraph = bridge.buildSceneGraph(scene);

    assert.ok(sceneGraph.graphId);
    assert.strictEqual(sceneGraph.rooms.length >= 1, true, 'Deve conter nós de ambientes (Room)');
    assert.strictEqual(sceneGraph.walls.length >= 2, true, 'Deve conter nós de alvenarias (Wall)');
    assert.strictEqual(sceneGraph.openings.length >= 2, true, 'Deve conter portas e janelas (Openings)');
    assert.strictEqual(sceneGraph.grids.length, 4, 'Deve conter os 4 eixos estruturais');
    assert.strictEqual(sceneGraph.dimensions.length >= 1, true, 'Deve conter cotas lineares');

    const summary = sceneGraph.getSummary();
    assert.strictEqual(summary.totalNodes >= 8, true);
    assert.strictEqual(summary.isFusedWithBIM, false);
  });

  runTest('J05.2: Fusão BIM + Vision deve aplicar primazia de dados autoritativos do BIM sobre inferência visual', () => {
    const perception = VisualPerceptionModule.createEngine();
    // Simulação síncrona com dados mockados
    const visualSceneMock = {
      annotations: [{ text: 'LIVING 32.00 m²', type: 'room_label' }],
      objects: [{ id: 'w1', category: 'Wall', label: 'Parede', confidence: 0.9 }],
      measurements: []
    };

    const authoritativeBIM = {
      projectId: 'prj_real_bim',
      projectName: 'Residência Alpha BIM',
      spaces: [
        { id: 'ifc_space_living', name: 'Living', areaM2: 38.50 } // Área exata calculada no Revit
      ]
    };

    const bridge = VisualToStructureModule.createEngine();
    const sceneGraph = bridge.buildSceneGraph(visualSceneMock, authoritativeBIM);

    assert.strictEqual(sceneGraph.metadata.isFusedWithBIM, true, 'Grafo deve estar marcado como fundido com BIM');
    const livingNode = sceneGraph.rooms.find(r => r.name.toLowerCase().includes('living'));
    assert.ok(livingNode);
    // Validação do princípio de não-confiança cega: o valor do BIM (38.50m²) deve prevalecer sobre o valor visual da planta (32.00m²)
    assert.strictEqual(livingNode.properties.estimatedAreaM2, 38.50, 'Área autoritativa do BIM deve sobrepor inferência visual');
    assert.strictEqual(livingNode.source, 'AUTHORITATIVE_BIM');
    assert.strictEqual(livingNode.confidence, 1.00);
  });

  // --------------------------------------------------------------------------
  // RELATÓRIO FINAL DA SUÍTE
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`TOTAL DE TESTES BLOCO J: ${passedTests + failedTests}`);
  console.log(`PASSOU: ${passedTests}`);
  console.log(`FALHOU: ${failedTests}`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
})();
