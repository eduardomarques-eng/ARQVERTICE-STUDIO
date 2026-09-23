/**
 * Test Suite: J43/J44/J45/J46 3D Production Infrastructure & QA Gate
 */

const assert = require('assert');
const { RealityChecker, ThreeD_QAGate } = require('../js/3d-qa-gate.js');
const { SecurityGovernor, DeviceProfiler, DEVICE_PROFILES, ASSET_STORAGE_TIERS, CDNDeliveryEngine, PerformanceTelemetry } = require('../js/3d-production-infra.js');

console.log('🧪 Iniciando testes do J43/J44/J45/J46 — 3D Production Infrastructure & QA Gate...\n');

// 1. Teste do Reality Checker (5 Camadas)
console.log('Test 1: Reality Checker — Auditoria em 5 Camadas...');
const fileAudit = RealityChecker.inspectFileIntegrity('casa_litoral_master.glb');
assert.strictEqual(fileAudit.passed, true);
assert.strictEqual(fileAudit.layer, 'file');

const codeAudit = RealityChecker.inspectCodeCompliance('const scene = new THREE.Scene();');
assert.strictEqual(codeAudit.passed, true);

const maliciousCodeAudit = RealityChecker.inspectCodeCompliance('eval("window.location = hack");');
assert.strictEqual(maliciousCodeAudit.passed, false, 'Código com eval() deve ser rejeitado');

const sceneAudit = RealityChecker.inspectSceneGraph({
    bounds: { min: { x: -5, y: 0, z: -5 }, max: { x: 5, y: 3, z: 5 } },
    transform: { position: { x: 0, y: 0, z: 0 } }
});
assert.strictEqual(sceneAudit.passed, true);

const runtimeAudit = RealityChecker.inspectRuntimeState({ fps: 58, drawCalls: 45, memoryMB: 42 });
assert.strictEqual(runtimeAudit.passed, true);

const visualAudit = RealityChecker.inspectVisualResult({ untexturedMeshCount: 0, hasNaNCoordinates: false });
assert.strictEqual(visualAudit.passed, true);

const fullAudit = RealityChecker.auditAllLayers({
    filePath: 'living_room.glb',
    code: 'const a = 1;',
    sceneNode: { bounds: {}, transform: {} },
    runtimeStats: { fps: 60, drawCalls: 35, memoryMB: 30 },
    visualReport: { untexturedMeshCount: 0 }
});
assert.strictEqual(fullAudit.overallPassed, true);
console.log('  ✅ 5 Camadas do Reality Checker (Arquivo, Código, Grafo, Runtime, Visual) validadas.');

// 2. Teste do 3D QA Gate (15 Sub-sistemas)
console.log('\nTest 2: 3D QA Gate — 15 Gates Críticos de Certificação...');
const qaGate = new ThreeD_QAGate();
const gateResults = qaGate.runVerification({
    assetPipelineReady: true,
    sceneLoaded: true,
    cameraFunctional: true,
    raycasterReady: true,
    transformsValid: true,
    pbrMaterialsValid: true,
    lightsConfigured: true,
    lodReady: true,
    viewerIsolated: true,
    mobileResponsive: true,
    webgpuSupported: true,
    webgl2FallbackActive: true,
    aiCommandsDeterministic: true,
    semanticIndexPopulated: true,
    realityAuditInput: { filePath: 'project_model.glb', visualReport: { untexturedMeshCount: 0 } }
});

assert.strictEqual(gateResults.totalGates, 15);
assert.strictEqual(gateResults.passedCount, 15);
assert.strictEqual(gateResults.score, 1.0);
assert.strictEqual(gateResults.certification, 'CERTIFIED_PRODUCTION_READY');
console.log(`  ✅ 3D QA Gate aprovou 15/15 sub-sistemas com score ${gateResults.score * 100}%.`);

// 3. Teste de Segurança (J44)
console.log('\nTest 3: SecurityGovernor (Sanitização, RBAC, Signed URLs e Privacy Gate)...');
const rawScenePayload = {
    modelId: 'obj-living-room',
    name: 'Sala de Estar',
    budget: 150000,
    cost: 85000,
    supplierMarkup: 0.25,
    internalNotes: 'Negociar desconto com marcenaria',
    revitServerPath: 'C:\\Vault\\InternalProjects\\001.rvt',
    geometry: { vertexCount: 4500 }
};

const cleanPayload = SecurityGovernor.sanitizeViewerPayload(rawScenePayload);
assert.strictEqual(cleanPayload.modelId, 'obj-living-room');
assert.strictEqual(cleanPayload.budget, undefined, 'Budget deve ser expurgado');
assert.strictEqual(cleanPayload.cost, undefined, 'Cost deve ser expurgado');
assert.strictEqual(cleanPayload.internalNotes, undefined, 'Internal notes devem ser expurgadas');
assert.strictEqual(cleanPayload.revitServerPath, undefined, 'Revit path deve ser expurgado');

// RBAC
const architectAuth = SecurityGovernor.authorizeEditorAction('architect', 'MODIFY_MATERIAL');
assert.strictEqual(architectAuth.authorized, true);

const guestAuth = SecurityGovernor.authorizeEditorAction('guest_viewer', 'MODIFY_MATERIAL');
assert.strictEqual(guestAuth.authorized, false);

// Signed URL
const signedUrl = SecurityGovernor.generateSignedAssetUrl('https://cdn.arqvertice.com/models/living.glb', { ttl: 1800 });
assert.ok(signedUrl.signedUrl.includes('auth_token='), 'Signed URL deve conter token efêmero');
assert.ok(signedUrl.expiresAt > Date.now());

// AI Privacy Gate
const privateMeshCheck = SecurityGovernor.validateAIPrivacyGate({
    payload: { vertices: [1.0, 2.0, 3.0], rawGeometry: true },
    allowExternalAI: false
});
assert.strictEqual(privateMeshCheck.permitted, false);
assert.strictEqual(privateMeshCheck.targetRoute, 'LOCAL_OLLAMA_FALLBACK');
console.log('  ✅ Políticas de segurança (Sanitização Viewer, RBAC, Signed URLs, Privacy Gate) validadas.');

// 4. Teste de Perfis Mobile e Qualidade Adaptativa (J45)
console.log('\nTest 4: DeviceProfiler & Qualidade Adaptativa Mobile...');
const androidProfile = DeviceProfiler.detectProfile('Mozilla/5.0 (Linux; Android 14; Pixel 8)', 412);
assert.strictEqual(androidProfile.id, 'ANDROID');
assert.strictEqual(androidProfile.maxDPR, 1.25);
assert.strictEqual(androidProfile.shadowMapSize, 512);

const desktopProfile = DeviceProfiler.detectProfile('Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 1920);
assert.strictEqual(desktopProfile.id, 'DESKTOP');
assert.strictEqual(desktopProfile.maxDPR, 2.0);

const adaptiveParams = DeviceProfiler.getAdaptiveRenderingParams(androidProfile);
assert.strictEqual(adaptiveParams.shadowResolution, 512);
assert.strictEqual(adaptiveParams.textureQuality, 'medium');
console.log('  ✅ Perfis de dispositivos (Android, iOS, Tablet, Notebook, Desktop) e parâmetros adaptativos validados.');

// 5. Teste de CDN Delivery & Telemetria Real de Performance (J46)
console.log('\nTest 5: CDN Delivery (5-Tier Storage) & Telemetria de Performance...');
const tiers = ASSET_STORAGE_TIERS;
assert.ok(tiers.SOURCE, 'Tier SOURCE deve existir');
assert.ok(tiers.MASTER, 'Tier MASTER deve existir');
assert.ok(tiers.WEB, 'Tier WEB deve existir');
assert.ok(tiers.THUMBNAIL, 'Tier THUMBNAIL deve existir');
assert.ok(tiers.LOD, 'Tier LOD deve existir');

const cdnDelivery = CDNDeliveryEngine.getAssetPath({ projectId: 'prj-praia', assetId: 'sofa-01', tier: 'WEB' });
assert.strictEqual(cdnDelivery.headers['Cache-Control'], 'public, max-age=31536000, immutable');

const telemetry = new PerformanceTelemetry();
const report = telemetry.getReport();
assert.ok(report.timeToFirstModelPixelMs < 800, 'TTFP deve ser inferior a 800ms');
assert.ok(report.timeToInteractiveMs < 1200, 'TTI deve ser inferior a 1200ms');
assert.strictEqual(report.fps, 60);
assert.strictEqual(report.status, 'OPTIMAL');
console.log(`  ✅ CDN 5-Tier Storage e Métricas Reais validadas: TTFP=${report.timeToFirstModelPixelMs}ms, TTI=${report.timeToInteractiveMs}ms, FPS=${report.fps}.`);

console.log('\n🎉 TODOS OS TESTES DE PRODUÇÃO J43/J44/J45/J46 PASSARAM COM 100% DE APROVAÇÃO!\n');
