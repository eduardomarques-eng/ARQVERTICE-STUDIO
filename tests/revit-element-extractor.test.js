const assert = require('assert');
const RevitElementExtractor = require('../js/revit-element-extractor.js');
const ArqScene = require('../js/arq-scene-bridge.js');

const sourceElements = [
    {
        id: 10,
        uniqueId: 'wall-10',
        documentId: 'DOC-1',
        category: 'Walls',
        family: 'Parede Básica',
        type: 'Alvenaria 15cm',
        transform: { position: { x: 2, y: 0, z: 0 } },
        geometry: { mesh: { vertices: 8 }, boundingBox: { min: [0, 0, 0], max: [2, 0.15, 3] } },
        materials: [{ name: 'Alvenaria' }],
        host: null,
        nestedInstances: [{ id: 11, relation: 'subcomponent' }]
    },
    { id: 11, uniqueId: 'door-11', category: 'Doors', family: 'Porta', type: 'P01' }
];

const readEngine = {
    async getSelection() { return { count: 1, elements: [sourceElements[0]] }; },
    async getCurrentView() { return { id: 'VIEW-1', name: '3D' }; },
    async queryElements(filter) {
        if (filter.elementId) return sourceElements.filter(element => element.id === filter.elementId);
        return sourceElements.filter(element => !filter.category || element.category.toLowerCase() === filter.category.toLowerCase());
    }
};

(async () => {
    assert.strictEqual(RevitElementExtractor.SUPPORTED_CATEGORIES.includes('Wall'), true);
    const extractor = new RevitElementExtractor(readEngine, { batchSize: 1 });

    const selection = await extractor.extract({ source: 'Current Selection' }, { yieldToEventLoop: false });
    assert.strictEqual(selection.extracted, 1);
    assert.strictEqual(selection.elements[0].category, 'Wall');
    assert.strictEqual(selection.elements[0].family, 'Parede Básica');
    assert.strictEqual(selection.elements[0].nestedInstances.length, 1);
    assert.deepStrictEqual(selection.elements[0].geometry.boundingBox.max, [2, 0.15, 3]);

    let progressCalls = 0;
    const filtered = await extractor.extract({ source: 'Category', category: 'Doors' }, {
        yieldToEventLoop: false,
        onProgress: () => progressCalls++
    });
    assert.strictEqual(filtered.elements[0].category, 'Door');
    assert.strictEqual(progressCalls, 1);

    const cancelled = await extractor.extract({ source: 'Category', category: 'Doors' }, {
        yieldToEventLoop: false,
        signal: { aborted: true }
    });
    assert.strictEqual(cancelled.cancelled, true);
    assert.strictEqual(cancelled.extracted, 0);

    const scene = new ArqScene({ documentId: 'DOC-1' });
    const element = selection.elements[0];
    let result = scene.importElements([element]);
    assert.strictEqual(result.imported.length, 1);
    result = scene.importElements([element], { duplicatePolicy: 'reuse' });
    assert.strictEqual(result.reused.length, 1);
    result = scene.importElements([element], { duplicatePolicy: 'update' });
    assert.strictEqual(result.updated.length, 1);
    result = scene.importElements([element], { duplicatePolicy: 'replace' });
    assert.strictEqual(result.replaced.length, 1);
    result = scene.importElements([element], { duplicatePolicy: 'duplicate' });
    assert.strictEqual(result.duplicated.length, 1);
    assert.strictEqual(scene.getSummary().objectCount, 2);

    console.log('J38 RevitElementExtractor: all tests passed');
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
