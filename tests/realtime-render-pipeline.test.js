const assert = require('assert');
const fs = require('fs');
const path = require('path');

const RealtimeRenderPipeline = require('../js/realtime-render-pipeline.js');

console.log('================================================================');
console.log('🧪 BATERIA DE TESTES: J34/J35 — ARQVERTICE REALTIME RENDERING');
console.log('================================================================');

// 1. Teste dos Tiers de Renderização
(() => {
    console.log('\n[1/7] Testando Tiers de Renderização (Tiers 0 a 4)...');
    const pipeline = new RealtimeRenderPipeline();
    const tiers = pipeline.getAvailableTiers();
    assert.strictEqual(tiers.length, 5, 'Deve conter exatamente 5 tiers.');

    // Validação de cada Tier
    assert.strictEqual(tiers[0].key, 'TIER_0');
    assert.strictEqual(tiers[0].shadows, false);

    assert.strictEqual(tiers[1].key, 'TIER_1');
    assert.strictEqual(tiers[1].api, 'WebGL2');

    assert.strictEqual(tiers[2].key, 'TIER_2');
    assert.strictEqual(tiers[2].api, 'WebGPU');

    assert.strictEqual(tiers[3].key, 'TIER_3');
    assert.strictEqual(tiers[3].ssr, true);

    assert.strictEqual(tiers[4].key, 'TIER_4');
    assert.strictEqual(tiers[4].pathTracing, true);

    pipeline.setTier('TIER_4');
    assert.strictEqual(pipeline.getTier().key, 'TIER_4');
    console.log('  ✔ Tiers 0 a 4 validados.');
})();

// 2. Teste do Conversor Físico de Temperatura Kelvin para RGB
(() => {
    console.log('\n[2/7] Testando Conversão Física Kelvin ➔ RGB...');
    const kelvinToRGB = RealtimeRenderPipeline.kelvinToRGB;

    // Branco quente (2700K): avermelhado/amarelado
    const warm = kelvinToRGB(2700);
    assert(warm.r > warm.b, '2700K deve ter mais componente vermelho do que azul.');
    assert(warm.hex.length === 6, 'Hexadecimal deve ter 6 caracteres.');

    // Branco neutro luz do dia (6500K): equilibrado
    const daylight = kelvinToRGB(6500);
    assert(daylight.r > 0.9 && daylight.g > 0.9 && daylight.b > 0.9, '6500K deve ser próximo ao branco puro.');

    // Céu azul frio (10000K): azulado
    const cool = kelvinToRGB(10000);
    assert(cool.b > cool.r, '10000K deve ter mais componente azul do que vermelho.');

    console.log('  ✔ Conversor Kelvin (2700K, 6500K, 10000K) validado.');
})();

// 3. Teste do Catálogo de Materiais PBR
(() => {
    console.log('\n[3/7] Testando Catálogo PBR Arquitetônico...');
    const pipeline = new RealtimeRenderPipeline();
    const presets = pipeline.getMaterialPresets();

    const expectedMaterials = ['glass', 'metal', 'wood', 'stone', 'fabric', 'ceramic', 'water', 'paint', 'concrete'];
    expectedMaterials.forEach(matKey => {
        assert(presets[matKey], `Material ${matKey} deve existir.`);
        assert(presets[matKey].roughness !== undefined, `${matKey} deve definir roughness.`);
        assert(presets[matKey].metalness !== undefined, `${matKey} deve definir metalness.`);
    });

    // Validar física específica
    assert.strictEqual(presets.glass.transmission, 0.92);
    assert.strictEqual(presets.glass.ior, 1.52);
    assert.strictEqual(presets.water.ior, 1.333);
    assert.strictEqual(presets.metal.metalness, 0.92);

    console.log('  ✔ Todos os 9 materiais PBR arquitetônicos validados.');
})();

// 4. Teste do Sistema de Iluminação e Shadow Caching
(() => {
    console.log('\n[4/7] Testando Luzes & Shadow Caching...');
    const pipeline = new RealtimeRenderPipeline();
    
    const sun = pipeline.createLight('sun', { temperature: 5500, intensity: 1.5, castShadow: true });
    assert.strictEqual(sun.type, 'sun');
    assert.strictEqual(sun.castShadow, true);
    assert.strictEqual(sun.temperature, 5500);

    // Shadow caching inicial
    assert.strictEqual(pipeline.shadowCache.isStatic, true);
    
    // Altera temperatura da luz -> deve marcar como dirty
    pipeline.setLightTemperature(sun.id, 3200);
    assert.strictEqual(pipeline.shadowCache.dirtyLights.has(sun.id), true);
    assert.strictEqual(pipeline.shadowCache.isStatic, false);

    console.log('  ✔ Sistema de luzes e dirty tracking de sombras validado.');
})();

// 5. Teste de Detecção de Ray Tracing Capability
(() => {
    console.log('\n[5/7] Testando RayTracingCapability Interface...');
    const RayTracingCapability = RealtimeRenderPipeline.RayTracingCapability;
    
    const cap = RayTracingCapability.detect();
    assert(cap.supported !== undefined, 'Deve informar se ray tracing é suportado.');
    assert(typeof cap.maxSamples === 'number' && cap.maxSamples >= 32, 'Deve definir maxSamples.');
    assert(Array.isArray(cap.maxResolution), 'Deve definir maxResolution.');

    console.log(`  ✔ Detecção de Ray Tracing: backend=${cap.backend}, samples=${cap.maxSamples}, quality=${cap.quality}`);
})();

// 6. Teste do Progressive Path Tracer & Anti-Stutter
(() => {
    console.log('\n[6/7] Testando Progressive Path Tracer & Anti-Stutter...');
    const ProgressivePathTracer = RealtimeRenderPipeline.ProgressivePathTracer;
    const pt = new ProgressivePathTracer({ maxSamples: 16 });

    // Início estático
    pt.reset();
    assert.strictEqual(pt.currentSample, 0);

    // Passo 1 a 5
    for (let i = 1; i <= 5; i++) {
        const step = pt.step();
        assert.strictEqual(step.sample, i);
        assert.strictEqual(step.draft, false);
    }

    // Movimento de câmera: deve acionar modo draft (sample 1)
    pt.notifyCameraMove();
    const moveStep = pt.step();
    assert.strictEqual(moveStep.draft, true);
    assert.strictEqual(moveStep.sample, 1);

    // Câmera estabilizada: retoma acumulação
    pt.notifyCameraStable();
    pt.reset();
    for (let i = 1; i <= 16; i++) {
        pt.step();
    }
    assert.strictEqual(pt.isConverged, true, 'Deve atingir convergência após maxSamples.');

    console.log('  ✔ Progressive Path Tracer e modo anti-stutter validados.');
})();

// 7. Teste do Quality Governor (Histerese e Anti-Oscilação)
(() => {
    console.log('\n[7/7] Testando Quality Governor (Histerese)...');
    const QualityGovernor = RealtimeRenderPipeline.QualityGovernor;
    
    let governorEvents = [];
    const gov = new QualityGovernor({
        lowFpsThreshold: 40,
        highFpsThreshold: 55,
        cooldownMs: 0, // zerado para o teste síncrono
        onLevelChange: (e) => governorEvents.push(e)
    });

    const initialLevel = gov.level; // 3

    // FPS baixo (< 40) repetido por 3 vezes -> deve reduzir nível
    gov.recordFrame(30);
    gov.recordFrame(32);
    gov.recordFrame(28);
    assert.strictEqual(gov.level, initialLevel - 1, 'Deve reduzir 1 nível após FPS baixo contínuo.');

    // FPS alto (> 55) precisa de 6 ciclos estáveis para subir de volta
    for (let i = 0; i < 5; i++) {
        gov.recordFrame(58);
        assert.strictEqual(gov.level, initialLevel - 1, 'Não deve subir prematuramente antes de 6 ciclos.');
    }
    gov.recordFrame(60); // 6º ciclo
    assert.strictEqual(gov.level, initialLevel, 'Deve recuperar o nível após estabilização de 6 ciclos.');

    console.log('  ✔ Quality Governor com histerese anti-oscilação validado.');
})();

console.log('\n================================================================');
console.log('🎉 TODOS OS TESTES DO MOTOR REALTIME J34/J35 FORAM APROVADOS!');
console.log('================================================================');
