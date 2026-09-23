const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ThreeDSemanticIndex = require('../js/3d-semantic-index.js');
const AI3DCommandEngine = require('../js/ai-3d-command-engine.js');

console.log('================================================================');
console.log('🧪 BATERIA DE TESTES: J38/J39 — ARQVERTICE 3D INTELLIGENCE');
console.log('================================================================');

// 1. Teste do 3D Semantic Index
(() => {
    console.log('\n[1/6] Testando 3D Semantic Index & Taxonomia Arquitetônica...');
    const index = new ThreeDSemanticIndex({ projectId: 'prj-praia-01' });

    const sofa = index.getObject('obj-0048');
    assert(sofa, 'Sofá obj-0048 deve existir no índice.');
    assert.strictEqual(sofa.category, 'Furniture');
    assert.strictEqual(sofa.subcategory, 'Sofa');
    assert.strictEqual(sofa.room, 'Living Integrado');
    assert.strictEqual(sofa.dimensions.width, 3.6);
    assert(Array.isArray(sofa.tags) && sofa.tags.includes('sofa'), 'Tags devem incluir "sofa".');

    // Busca textual semântica
    const searchResults = index.search('sofa living');
    assert(searchResults.length >= 1, 'Deve encontrar o sofá ao buscar "sofa living".');
    assert.strictEqual(searchResults[0].id, 'obj-0048');

    console.log('  ✔ Indexação semântica e busca textual validadas.');
})();

// 2. Teste de Consultas Espaciais BVH
(() => {
    console.log('\n[2/6] Testando Consultas Espaciais BVH (Proximidade & Relações)...');
    const index = new ThreeDSemanticIndex({ projectId: 'prj-praia-01' });

    // Consulta de objetos próximos ao sofá (obj-0048 em [-5, 0.6, 3])
    // A mesa de centro está em [-5, 0.45, 4.5] (distância ~1.5m)
    const nearby = index.querySpatial('obj-0048', 'near', 3.0);
    assert(nearby.length >= 1, 'Deve encontrar objetos próximos.');
    assert.strictEqual(nearby[0].object.id, 'obj-0049', 'Mesa de centro deve ser o objeto mais próximo.');
    assert(nearby[0].distanceM < 2.0, 'Distância deve ser calculada corretamente.');

    // Mesma sala
    const sameRoom = index.querySpatial('obj-0048', 'same_room');
    assert(sameRoom.length >= 3, 'Deve listar elementos do mesmo ambiente.');

    console.log('  ✔ Consultas espaciais BVH ("near", "same_room") validadas.');
})();

// 3. Teste de Grounding de Visão Multimodal
(async () => {
    console.log('\n[3/6] Testando Grounding de Visão Multimodal...');
    const Vision = ThreeDSemanticIndex.MultimodalVisionGrounding;
    const index = new ThreeDSemanticIndex({ projectId: 'prj-praia-01' });

    const sceneSummary = index.getSceneSummary('Living');
    assert.strictEqual(sceneSummary.projectId, 'prj-praia-01');
    assert(sceneSummary.objects.length >= 3, 'Deve sumarizar objetos do Living.');

    const visionResult = await Vision.analyzeSceneVision('data:image/png;base64,mock', sceneSummary, 'google');
    assert.strictEqual(visionResult.provider, 'google');
    assert(Array.isArray(visionResult.detectedObjects), 'Deve conter objetos detectados.');
    assert(visionResult.detectedObjects.length >= 3);

    console.log('  ✔ Grounding de visão multimodal e sumarização de cena validados.');
})();

// 4. Teste do Parser de Linguagem Natural para Comandos 3D
(() => {
    console.log('\n[4/6] Testando Parser de Linguagem Natural (J39)...');
    const Parser = AI3DCommandEngine.NaturalLanguageCommandParser;

    // Comando 1: Trocar material
    const cmd1 = Parser.parse('Troque o tecido do sofá para couro caramelo');
    assert.strictEqual(cmd1.action, 'changeMaterial');
    assert.strictEqual(cmd1.targetQuery, 'sofá');
    assert.strictEqual(cmd1.material, 'couro caramelo');

    // Comando 2: Mover
    const cmd2 = Parser.parse('Mova o sofá 30 cm mais para a direita');
    assert.strictEqual(cmd2.action, 'move');
    assert.deepStrictEqual(cmd2.delta, [0.3, 0, 0]);

    // Comando 3: Ocultar
    const cmd3 = Parser.parse('Oculte a parede norte');
    assert.strictEqual(cmd3.action, 'hide');
    assert.strictEqual(cmd3.targetQuery, 'parede norte');

    console.log('  ✔ Parser de linguagem natural para comandos estruturados validado.');
})();

// 5. Teste de Resolução de Ambiguidades e Pre-Flight Validation
(async () => {
    console.log('\n[5/6] Testando Resolução de Ambiguidades & AI Safety...');
    const index = new ThreeDSemanticIndex({ projectId: 'prj-praia-01' });
    const engine = new AI3DCommandEngine(index);

    // Adiciona um segundo sofá para simular ambiguidade
    index.addObject({
        id: 'obj-0099',
        name: 'Sofá 2 Lugares Varanda',
        category: 'Furniture',
        subcategory: 'Sofa',
        room: 'Deck Gourmet',
        tags: ['sofa', 'varanda', 'deck', 'assento']
    });

    // Tentativa de alterar material sem especificar qual sofá
    const ambiguousResult = await engine.processNaturalLanguage('Troque o tecido do sofá para veludo azul');
    assert.strictEqual(ambiguousResult.status, 'AMBIGUOUS');
    assert.strictEqual(ambiguousResult.success, false);
    assert(ambiguousResult.clarificationPrompt.includes('Encontrei 2 elementos'), 'Deve gerar prompt de esclarecimento.');
    assert.strictEqual(ambiguousResult.candidates.length, 2);

    // Trava de segurança estrutural: tentar deletar parede estrutural
    const structuralDelete = await engine.processNaturalLanguage('delete parede norte');
    assert.strictEqual(structuralDelete.success, false);
    assert(structuralDelete.error.includes('ESTRUTURAL'), 'Deve bloquear exclusão de elemento estrutural.');

    console.log('  ✔ Resolução de ambiguidades e travas de segurança estrutural validadas.');
})();

// 6. Teste de Execução Determinística e Transações Reversíveis (Undo/Redo)
(async () => {
    console.log('\n[6/6] Testando Execução Determinística & Undo/Redo...');
    const index = new ThreeDSemanticIndex({ projectId: 'prj-praia-01' });
    const engine = new AI3DCommandEngine(index);

    const initialMaterial = index.getObject('obj-0048').material;

    // Executa comando específico
    const result = await engine.processNaturalLanguage('Troque o tecido do sofá modular para couro caramelo');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.status, 'EXECUTED');
    assert.strictEqual(index.getObject('obj-0048').material, 'couro caramelo');

    // Desfazer (Undo)
    const undoResult = engine.undo();
    assert.strictEqual(undoResult.success, true);
    assert.strictEqual(index.getObject('obj-0048').material, initialMaterial);

    // Refazer (Redo)
    const redoResult = engine.redo();
    assert.strictEqual(redoResult.success, true);
    assert.strictEqual(index.getObject('obj-0048').material, 'couro caramelo');

    console.log('  ✔ Transações reversíveis determinísticas (Undo/Redo) validadas.');
})();

console.log('\n================================================================');
console.log('🎉 TODOS OS TESTES DE 3D INTELLIGENCE J38/J39 FORAM APROVADOS!');
console.log('================================================================');
