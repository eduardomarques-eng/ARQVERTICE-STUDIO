const assert = require('assert');
const Project3DCore = require('../js/project-3d-core.js');
const RendererAdapter = require('../js/renderer-adapter.js');

(() => {
    const core = new Project3DCore({ name: 'J 3D Test Project' });
    const scene = core.createScene('Living Study');
    const wall = core.addNode({ type: 'Node', name: 'Wall 01', parentId: scene.id, source: 'Revit', revitId: 'REV-20412', bimId: 'BIM-20412' });
    assert.strictEqual(wall.parentId, scene.id);
    assert.strictEqual(wall.revitId, 'REV-20412');
    assert.deepStrictEqual(wall.transform.scale, { x: 1, y: 1, z: 1 });

    core.execute({ type: 'move', nodeId: wall.id, value: { x: 2, y: 0, z: 0 } });
    assert.strictEqual(core.getNode(wall.id).transform.position.x, 2);
    core.execute({ type: 'rename', nodeId: wall.id, value: 'Wall Updated' });
    assert.strictEqual(core.getNode(wall.id).name, 'Wall Updated');
    assert.strictEqual(core.undo().success, true);
    assert.strictEqual(core.getNode(wall.id).name, 'Wall 01');
    assert.strictEqual(core.redo().success, true);
    assert.strictEqual(core.getNode(wall.id).name, 'Wall Updated');

    assert.throws(() => core.execute({ type: 'arbitraryCode', nodeId: wall.id }), /nao permitido/);
    const snapshot = core.serialize();
    const restored = new Project3DCore();
    restored.load(snapshot);
    assert.strictEqual(restored.getNode(wall.id).revitId, 'REV-20412');
    const child = restored.addNode({ name: 'Nested', parentId: scene.id });
    restored.execute({ type: 'delete', nodeId: scene.id });
    assert.strictEqual(restored.getNode(child.id), null);

    const renderer = new RendererAdapter();
    const webgpu = renderer.detect({ navigator: { gpu: {} }, canvas: null });
    assert.strictEqual(webgpu.mode, 'WEBGPU');
    const webgl = new RendererAdapter().detect({ navigator: {}, canvas: { getContext: type => type === 'webgl2' ? {} : null } });
    assert.strictEqual(webgl.mode, 'WEBGL2');

    console.log('J 3D Core: all tests passed');
})();
