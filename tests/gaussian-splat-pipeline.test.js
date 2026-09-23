/**
 * Test Suite: J40 Gaussian Splat Pipeline & PlayCanvas Reality Capture Engine
 */

const assert = require('assert');
const GaussianSplatPipeline = require('../js/gaussian-splat-pipeline.js');

console.log('🧪 Iniciando testes do J40 — Gaussian Splat Pipeline...\n');

// 1. Teste dos Formatos Suportados
console.log('Test 1: Formatos de Gaussian Splat suportados...');
const formats = GaussianSplatPipeline.SUPPORTED_SPLAT_FORMATS;
assert.ok(formats.PLY, 'Formato PLY deve ser suportado');
assert.ok(formats.SOG, 'Formato SOG (PlayCanvas) deve ser suportado');
assert.ok(formats.SPZ, 'Formato SPZ deve ser suportado');
assert.ok(formats.SPLAT, 'Formato SPLAT deve ser suportado');
assert.ok(formats.KSPLAT, 'Formato KSPLAT deve ser suportado');
assert.strictEqual(formats.SOG.compressed, true, 'SOG deve estar marcado como comprimido');
console.log('  ✅ Formatos PLY, SOG, SPZ, SPLAT, KSPLAT validados com sucesso.');

// 2. Teste do Modelo SplatAsset
console.log('\nTest 2: Instanciação e conformidade do SplatAsset...');
const { SplatAsset } = GaussianSplatPipeline;
const sampleSplat = new SplatAsset({
    id: 'splat-test-01',
    name: 'Captura Fachada Histórica',
    source: 'Photogrammetry',
    format: 'PLY',
    splatCount: 850000,
    bounds: {
        min: { x: -10, y: 0, z: -10 },
        max: { x: 10, y: 8, z: 10 },
        center: { x: 0, y: 4, z: 0 },
        radius: 14.1
    },
    transform: {
        position: { x: 5, y: 0, z: -2 },
        rotation: { x: 0, y: 0.5, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
    },
    metadata: {
        captureDevice: 'Sony A7R V + 24mm GM',
        opacity: 0.95
    }
});

assert.strictEqual(sampleSplat.id, 'splat-test-01');
assert.strictEqual(sampleSplat.format, 'PLY');
assert.strictEqual(sampleSplat.source, 'Photogrammetry');
assert.strictEqual(sampleSplat.splatCount, 850000);
assert.strictEqual(sampleSplat.transform.position.x, 5);
assert.strictEqual(sampleSplat.metadata.opacity, 0.95);
assert.ok(sampleSplat.lod.levels.lod0, 'Deve conter nível de LOD 0');
assert.ok(sampleSplat.lod.levels.lod1, 'Deve conter nível de LOD 1');
assert.ok(sampleSplat.lod.levels.lod2, 'Deve conter nível de LOD 2');
console.log('  ✅ SplatAsset construído com todos os campos e níveis LOD obrigatórios.');

// 3. Teste do Motor SplatTransformEngine (Validação e Processamento)
console.log('\nTest 3: SplatTransformEngine (validação, quantização e LOD)...');
const { SplatTransformEngine } = GaussianSplatPipeline;

const validValidation = SplatTransformEngine.inspectAndValidate({ format: 'SOG', splatCount: 500000 });
assert.strictEqual(validValidation.valid, true);

const invalidValidation = SplatTransformEngine.inspectAndValidate({ format: 'XYZ_INVALID' });
assert.strictEqual(invalidValidation.valid, false);

const processedSplat = SplatTransformEngine.processSplat({
    sourceAsset: sampleSplat,
    targetFormat: 'SOG'
});
assert.strictEqual(processedSplat.format, 'SOG');
assert.ok(processedSplat.metadata.compressedSizeKB < sampleSplat.metadata.rawSizeKB, 'SOG deve comprimir o tamanho em relação ao raw');
console.log(`  ✅ Otimização SOG validada: Raw=${sampleSplat.metadata.rawSizeKB}KB -> Comprimido=${processedSplat.metadata.compressedSizeKB}KB`);

// 4. Teste do Progressive Streaming Budget
console.log('\nTest 4: Progressive Streaming Budget baseado em distância de câmera...');
const nearBudget = SplatTransformEngine.calculateStreamingBudget(10.0, 1000000);
assert.strictEqual(nearBudget.activeLOD, 0, 'Distância curta (<15m) deve ativar LOD 0');
assert.strictEqual(nearBudget.renderSplats, 1000000);

const midBudget = SplatTransformEngine.calculateStreamingBudget(25.0, 1000000);
assert.strictEqual(midBudget.activeLOD, 1, 'Distância média (15m-40m) deve ativar LOD 1');
assert.strictEqual(midBudget.renderSplats, 450000);

const farBudget = SplatTransformEngine.calculateStreamingBudget(60.0, 1000000);
assert.strictEqual(farBudget.activeLOD, 2, 'Distância longa (>40m) deve ativar LOD 2');
assert.strictEqual(farBudget.renderSplats, 150000);
console.log('  ✅ Progressive Streaming Budget computado dinamicamente para LOD 0, 1 e 2.');

// 5. Teste do Pipeline Principal (Importação, Registro e Operações de Editor)
console.log('\nTest 5: GaussianSplatPipeline — registro, importação e operações de Editor...');
const pipeline = new GaussianSplatPipeline({ projectId: 'prj-test-j40' });

const initialSplats = pipeline.listSplats();
assert.ok(initialSplats.length >= 1, 'Deve possuir splat inicial de contexto semeado');
assert.strictEqual(initialSplats[0].id, 'splat-entorno-praia');

// Teste de importação de novo splat
const importResult = pipeline.importSplat({
    id: 'splat-terreno-vizinho',
    name: 'Escaneamento Terreno Vizinho',
    source: 'Scan',
    format: 'KSPLAT',
    splatCount: 620000,
    rawSizeKB: 90000
});
assert.strictEqual(importResult.success, true);
assert.strictEqual(pipeline.listSplats().length, 2);

// Operações permitidas no Editor (Transformação, Visibilidade, Opacidade)
const updatedTransform = pipeline.setTransform('splat-terreno-vizinho', {
    position: { x: 12.5, y: -0.5, z: 8.0 },
    rotation: { x: 0, y: 1.57, z: 0 },
    scale: { x: 1.05, y: 1.05, z: 1.05 }
});
assert.strictEqual(updatedTransform.transform.position.x, 12.5);
assert.strictEqual(updatedTransform.transform.rotation.y, 1.57);

const updatedVisibility = pipeline.setVisibility('splat-terreno-vizinho', false);
assert.strictEqual(updatedVisibility.visibility, false);

const updatedOpacity = pipeline.setOpacity('splat-terreno-vizinho', 0.80);
assert.strictEqual(updatedOpacity.metadata.opacity, 0.80);

console.log('  ✅ Transformação de cena, visibilidade (hide/show) e opacidade executadas com sucesso.');

// 6. Teste de Assinatura de Eventos (Pub/Sub)
console.log('\nTest 6: Subscrição de eventos reativos do Pipeline...');
let eventCaptured = null;
const unsubscribe = pipeline.subscribe(evt => {
    eventCaptured = evt;
});

pipeline.setVisibility('splat-terreno-vizinho', true);
assert.ok(eventCaptured, 'Evento deve ser disparado para assinantes');
assert.strictEqual(eventCaptured.type, 'splat_visibility_changed');
assert.strictEqual(eventCaptured.visibility, true);

unsubscribe();
eventCaptured = null;
pipeline.setOpacity('splat-terreno-vizinho', 0.5);
assert.strictEqual(eventCaptured, null, 'Após unsubscribe não deve capturar novos eventos');
console.log('  ✅ Sistema Pub/Sub de eventos reativos funcionando perfeitamente.');

console.log('\n🎉 TODOS OS TESTES DO J40 GAUSSIAN SPLAT PIPELINE PASSARAM COM SUCESSO!\n');
