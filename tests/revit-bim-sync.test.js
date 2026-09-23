const assert = require('assert');
const RevitBimSync = require('../js/revit-bim-sync.js');
const ArqScene = require('../js/arq-scene-bridge.js');

const baseElement = {
    id: 21,
    uniqueId: 'uid-21',
    documentId: 'DOC-1',
    category: 'Walls',
    family: 'Parede',
    type: 'P01',
    geometry: { mesh: { vertices: 8 } },
    transform: { position: { x: 0, y: 0, z: 0 } },
    material: { name: 'Original' },
    parameters: { Comments: 'base' }
};

const scene = new ArqScene({ documentId: 'DOC-1' });
scene.importElements([baseElement]);
const readEngine = {
    async readElement() {
        return { ...baseElement, transform: { position: { x: 2, y: 0, z: 0 } } };
    }
};
const writeEngine = {
    planParameterUpdate(elementId, field, newValue, oldValue) {
        return { changeSet: { stage: 'PREVIEW', name: 'Sync', modified: [{ elementId, paramName: field, newValue, oldValue }] } };
    },
    async commitChangeSet(changeSet, token) {
        return { success: true, stage: 'COMMITTED', changeSet, token };
    }
};

(async () => {
    const sync = new RevitBimSync({ readEngine, writeEngine, scene });
    const snapshot = sync.registerSnapshot();
    assert.strictEqual(snapshot.objects[0].source, 'Revit');
    assert.strictEqual(snapshot.objects[0].sourceId, 21);
    assert.strictEqual(snapshot.objects[0].version, 1);

    scene.getObject(21).parameters.Comments = 'visual study';
    const arqChanged = await sync.detectChanges({ fetchRevit: false });
    assert.strictEqual(arqChanged.items[0].state, 'ARQ_CHANGED');
    const changeSet = sync.createChangeSet(arqChanged.items, 'architect');
    assert.strictEqual(changeSet.preview, true);
    assert.strictEqual(changeSet.changes[0].source, 'ArqVertice');

    const bothChanged = await sync.detectChanges();
    assert.strictEqual(bothChanged.items[0].state, 'BOTH_CHANGED');
    scene.getObject(21).transform = { position: { x: 3, y: 0, z: 0 } };
    const revitChanged = await sync.detectChanges();
    assert.strictEqual(revitChanged.items[0].state, 'CONFLICT');
    assert.strictEqual(revitChanged.conflicts[0].fields.includes('transform'), true);
    assert.strictEqual(revitChanged.conflicts[0].fields.includes('parameters'), false);

    const cancel = await sync.applyResolution(revitChanged.conflicts[0], 'Cancel');
    assert.strictEqual(cancel.cancelled, true);
    const keepRevit = await sync.applyResolution(revitChanged.conflicts[0], 'Keep Revit');
    assert.strictEqual(keepRevit.resolved, true);

    const approval = await sync.commit(changeSet);
    assert.strictEqual(approval.success, false);
    const committed = await sync.commit(changeSet, 'approval-token');
    assert.strictEqual(committed.success, true);

    sync.registerSnapshot();
    scene.getObject(21).visibility = false;
    const visualOnly = await sync.detectChanges({ fetchRevit: false });
    const visualChangeSet = sync.createChangeSet(visualOnly.items, 'architect');
    assert.deepStrictEqual(visualChangeSet.changes, [], 'Alteracao visual nao pode virar transacao Revit');
    assert.ok(visualChangeSet.visualOnlyChanges.includes('visibility'));
    const visualCommit = await sync.commit(visualChangeSet, 'approval-token');
    assert.strictEqual(visualCommit.stage, 'VISUAL_ONLY');

    console.log('J40 RevitBimSync: all tests passed');
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
