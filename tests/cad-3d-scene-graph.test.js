/**
 * tests/cad-3d-scene-graph.test.js
 * Suíte de Testes Automatizados para 3D, Blender Bridge, CAD Paramétrico e Scene Graph (Bloco J: J06 → J10)
 */

const assert = require('assert');

const ThreeDModule = require('../js/3d-generation-service.js');
const BlenderBridgeModule = require('../js/blender-bridge-service.js');
const ParametricCADModule = require('../js/parametric-cad-engine.js');
const DrawingParserModule = require('../js/drawing-document-parser.js');
const CrossModalModule = require('../js/cross-modal-scene-graph.js');

console.log('================================================================');
console.log('📐 TESTES DE 3D, CAD & CROSS-MODAL SCENE GRAPH (BLOCO J: J06 → J10)');
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
  // J06 — IMAGE-TO-3D + 3D ASSET INTELLIGENCE
  // --------------------------------------------------------------------------
  console.log('--- 1. Image-to-3D, Decimação e Quality Check (J06) ---');

  await runAsyncTest('J06.1: generate3DAssetFromImage deve gerar ativo GLB validado com perfil de decimação e escala ancorada', async () => {
    const service = ThreeDModule.createService();
    const asset = await service.generate3DAssetFromImage({
      imageAsset: 'render_sofa.png',
      label: 'Sofá Modular Living',
      profileKey: 'interactive',
      scaleReference: {
        type: 'BIM_REFERENCE',
        sourceName: 'FamilyInstance: Sofá 3 Lugares',
        targetMeters: { width: 2.40, height: 0.85, depth: 1.00 }
      }
    });

    assert.strictEqual(asset.isReady, true, 'Ativo deve estar pronto após aprovação no quality check');
    assert.strictEqual(asset.format, 'glb');
    assert.strictEqual(asset.profile, 'interactive');
    assert.strictEqual(asset.polycount, 25000, 'Polycount deve aderir ao perfil interativo');
    assert.strictEqual(asset.dimensionsMeters.width, 2.40, 'Largura deve respeitar referência métrica BIM');
    assert.strictEqual(asset.qualityCheck.passed, true);
    assert.strictEqual(asset.qualityCheck.checks.isManifold, true);
    assert.strictEqual(asset.qualityCheck.checks.normalsConsistentlyOriented, true);
  });

  runTest('J06.2: Perfis de decimação devem cobrir as 5 classes do estúdio', () => {
    const profiles = ThreeDModule.DecimationProfile;
    assert.ok(profiles.PREVIEW);
    assert.ok(profiles.INTERACTIVE);
    assert.ok(profiles.HIGH);
    assert.ok(profiles.RENDER);
    assert.ok(profiles.EXPORT);
    assert.strictEqual(profiles.PREVIEW.targetPolycount, 5000);
    assert.strictEqual(profiles.RENDER.targetPolycount, 250000);
  });

  // --------------------------------------------------------------------------
  // J07 — BLENDER INTELLIGENCE BRIDGE
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Blender Intelligence Bridge via MCP (J07) ---');

  await runAsyncTest('J07.1: BlenderBridge deve operar em Safe Mode localhost e executar modificação com verificação visual', async () => {
    const bridge = BlenderBridgeModule.createBridge();
    const conn = await bridge.connect();

    assert.strictEqual(conn.safeMode, true, 'Deve exigir Safe Mode');
    assert.strictEqual(bridge.isConnected, true);

    const outcome = await bridge.executeWithVisualVerification({
      actionType: 'create_object',
      params: {
        id: 'new_mesa_jantar',
        name: 'Mesa de Jantar 8 Lugares',
        type: 'MESH',
        location: [0, 0, 0],
        dimensions: [2.4, 1.1, 0.75],
        material: 'Marmore_Calacatta'
      },
      expectedVisualOutcome: { detectedElements: ['Mesa de Jantar'] }
    });

    assert.strictEqual(outcome.success, true, 'Ação e verificação visual devem passar');
    assert.strictEqual(outcome.diff.objectsAdded.length, 1, 'Deve registrar objeto adicionado no diff');
    assert.strictEqual(outcome.afterObjectsCount, outcome.beforeObjectsCount + 1);
    assert.ok(outcome.visionVerification.passed, 'Verificação do Vision Model deve ser aprovada');
  });

  runTest('J07.2: Bridge deve rejeitar conexões externas e comandos fora da lista branca', () => {
    const bridge = BlenderBridgeModule.createBridge({ enableLocalhostOnly: true });
    assert.rejects(async () => {
      await bridge.connect('http://remote-server.com:8765/mcp');
    }, /Safe Mode/);
  });

  // --------------------------------------------------------------------------
  // J08 — PARAMETRIC CAD INTELLIGENCE
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Parametric CAD Engine & Features Tree (J08) ---');

  runTest('J08.1: inspectDocument deve inspecionar árvore de features, parâmetros e restrições de sketches', () => {
    const cad = ParametricCADModule.createEngine();
    const doc = cad.inspectDocument();

    assert.ok(doc.documentId);
    assert.strictEqual(doc.parameters['largura'], 100);
    assert.strictEqual(doc.featuresCount >= 1, true);
    assert.strictEqual(doc.sketches.length >= 1, true);
    assert.strictEqual(doc.health.healthy, true);
  });

  await runAsyncTest('J08.2: executeParametricEdit deve alterar parâmetro e recalcular B-Rep sem redesenhar peça visualmente', async () => {
    const cad = ParametricCADModule.createEngine();

    // Instrução em linguagem natural: "aumente a largura da peça para 120 mm"
    const result = await cad.executeParametricEdit('aumente a largura da peça para 120 mm');

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.editRecord.parameter, 'largura');
    assert.strictEqual(result.editRecord.oldValue, 100);
    assert.strictEqual(result.editRecord.newValue, 120);
    assert.strictEqual(result.editRecord.recompute.success, true);
    assert.strictEqual(result.editRecord.healthCheck.healthy, true);

    // O modelo permanece CAD paramétrico exportável
    const stepExport = cad.export('STEP');
    assert.strictEqual(stepExport.format, 'STEP');
    assert.strictEqual(stepExport.isExactGeometry, true);
    assert.strictEqual(stepExport.parametersExported['largura'], 120);
  });

  // --------------------------------------------------------------------------
  // J09 — DRAWING / CAD / DOCUMENT UNDERSTANDING
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Drawing & Document Parser (J09) ---');

  await runAsyncTest('J09.1: parseDocument deve distinguir geometria analítica exata de aproximação visual', async () => {
    const parser = DrawingParserModule.createParser();

    // 1. Arquivo DXF técnico analítico
    const dxfResult = await parser.parseDocument({ fileName: 'planta_executiva.dxf' });
    assert.strictEqual(dxfResult.summary.format, 'DXF');
    assert.strictEqual(dxfResult.summary.isExactGeometry, true);
    assert.strictEqual(dxfResult.summary.precisionType, 'EXACT_ANALYTICAL');
    assert.strictEqual(dxfResult.graph.primitives.dimensions.length >= 2, true);
    assert.strictEqual(dxfResult.graph.semanticElements.walls.length >= 2, true);

    // 2. Imagem raster de croqui
    const rasterResult = await parser.parseDocument({ fileName: 'croqui_ideia.png' });
    assert.strictEqual(rasterResult.summary.format, 'RASTER');
    assert.strictEqual(rasterResult.summary.isExactGeometry, false);
    assert.strictEqual(rasterResult.summary.precisionType, 'VISUAL_APPROXIMATION');

    // 3. Promoção de status (draft ➔ review ➔ approved)
    dxfResult.graph.promoteStatus(DrawingParserModule.ConversionApprovalStatus.REVIEW);
    assert.strictEqual(dxfResult.graph.status, 'REVIEW');
  });

  // --------------------------------------------------------------------------
  // J10 — CROSS-MODAL PROJECT SCENE GRAPH
  // --------------------------------------------------------------------------
  console.log('\n--- 5. Cross-Modal Project Scene Graph (J10) ---');

  runTest('J10.1: Grafo cross-modal deve conectar imagem, entidade semântica, modelo 3D e elemento BIM', () => {
    const graph = CrossModalModule.createSeedProjectGraph('prj-praia-01', 'Residência de Praia');
    const summary = graph.getSummary();

    assert.strictEqual(summary.totalNodes >= 6, true);
    assert.strictEqual(summary.totalEdges >= 5, true);
    assert.ok(summary.typeBreakdown['Image']);
    assert.ok(summary.typeBreakdown['BIMObject']);
  });

  runTest('J10.2: queryCrossModalMapping deve responder à consulta de correspondência entre imagem, 3D e BIM', () => {
    const graph = CrossModalModule.createSeedProjectGraph('prj-praia-01', 'Residência de Praia');

    // Consulta canônica: "Qual objeto desta imagem corresponde ao modelo 3D e qual elemento BIM o representa?"
    const result = graph.queryCrossModalMapping('img_render_living_01', 'Sofá');

    assert.strictEqual(result.found, true);
    assert.strictEqual(result.mapping.semanticEntity.name, 'Sofá Modular Linho Cru');
    assert.strictEqual(result.mapping.correspondsTo3DAsset.name, 'sofa_modular_interactive.glb');
    assert.strictEqual(result.mapping.correspondsToBIMElement.name.includes('Mobiliário - Sofá'), true);
    assert.ok(result.mapping.correspondsToBIMElement.ifcGuid, 'Deve conter GUID do BIM oficial');
    assert.ok(result.answerFormatted.includes('sofa_modular_interactive.glb'));
  });

  runTest('J10.3: Resolução de Identidade deve unificar entidades observadas sem duplicação', () => {
    const graph = CrossModalModule.createSceneGraph('prj-test', 'Teste Deduplicação');

    // Adiciona entidade canônica
    const canonical = graph.addNode(new CrossModalModule.CrossModalNode({
      stableId: 'wall_living_bim',
      type: CrossModalModule.NodeType.ELEMENT,
      name: 'Parede Alvenaria Living (BIM)',
      properties: { thicknessCm: 15 }
    }));

    // Adiciona observação secundária de imagem
    const visualObs = graph.addNode(new CrossModalModule.CrossModalNode({
      stableId: 'wall_living_visual_crop',
      type: CrossModalModule.NodeType.ELEMENT,
      name: 'Parede detectada em foto',
      properties: { finishColor: '#f0ece1' }
    }));

    assert.strictEqual(graph.nodes.size, 3); // Root + canonical + visualObs

    // Executa resolução de identidade
    const resolution = graph.resolveIdentity('wall_living_bim', 'wall_living_visual_crop');
    assert.strictEqual(resolution.success, true);
    assert.strictEqual(graph.nodes.size, 2); // Unificado: visualObs foi assimilado
    assert.strictEqual(canonical.properties.finishColor, '#f0ece1', 'Propriedades devem ser mescladas');
    assert.strictEqual(canonical.aliases.has('wall_living_visual_crop'), true);
  });

  // --------------------------------------------------------------------------
  // RELATÓRIO FINAL DA SUÍTE
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`TOTAL DE TESTES BLOCO J (J06-J10): ${passedTests + failedTests}`);
  console.log(`PASSOU: ${passedTests}`);
  console.log(`FALHOU: ${failedTests}`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
})();
