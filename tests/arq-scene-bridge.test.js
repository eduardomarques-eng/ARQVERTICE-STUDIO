const assert = require('assert');
const ArqScene = require('../js/arq-scene-bridge.js');

const scene = new ArqScene({
    projectId: 'PRJ-001',
    documentId: 'DOC-REVIT-001'
});

scene.importElements([
    {
        id: 20412,
        uniqueId: 'uid-20412',
        documentId: 'DOC-REVIT-001',
        category: 'Walls',
        family: 'Parede Básica',
        type: 'Alvenaria 15cm',
        level: 'Nível 01',
        room: 'Living',
        parameters: { Comments: 'Elemento Revit' },
        geometry: { format: 'GLB', mesh: { vertices: 8, indices: 36 } },
        material: { name: 'Alvenaria', color: '#d8d0c4', transparency: 0 },
        sourceView: '{3D - Apresentacao}'
    },
    {
        id: 9901,
        uniqueId: 'uid-link-9901',
        documentId: 'DOC-LINK-001',
        sourceDocument: 'DOC-LINK-001',
        linkInstance: 'LINK-ESTRUTURA',
        linkTransform: { position: { x: 10, y: 0, z: 0 } },
        category: 'Columns',
        family: 'Pilar',
        type: 'Pilar Concreto',
        level: 'Nível 01',
        geometry: { format: 'mesh-buffers' }
    }
], { projectId: 'PRJ-001' });

assert.strictEqual(scene.getSummary().objectCount, 2);
assert.strictEqual(scene.getObject('uid-20412').revitElementId, 20412);
assert.strictEqual(scene.getObject(9901).sourceDocument, 'DOC-LINK-001');
assert.strictEqual(scene.getObject(9901).linkInstance, 'LINK-ESTRUTURA');

const selection = scene.select(20412);
assert.strictEqual(selection.family, 'Parede Básica');
assert.strictEqual(selection.room, 'Living');
assert.strictEqual(selection.sourceView, '{3D - Apresentacao}');

scene.hide(20412);
assert.strictEqual(scene.getObject(20412).visibility, 'hide');
scene.solo(9901);
assert.strictEqual(scene.getObject(9901).visibility, 'show');
assert.strictEqual(scene.getObject(20412).visibility, 'hide');
scene.clearIsolation();

scene.setStudyMode(true);
scene.overrideMaterial(20412, { name: 'Clay', color: '#aaaaaa', transparency: 0 });
assert.strictEqual(scene.getObject(20412).effectiveMaterial.name, 'Clay');
assert.strictEqual(scene.getObject(20412).material.name, 'Alvenaria');

scene.setRenderMode('Photoreal');
scene.setDetailLevel('Preview');
scene.syncCameraFromRevit({ position: { x: 1, y: 2, z: 3 }, target: { x: 0, y: 0, z: 0 }, fov: 50 });
assert.strictEqual(scene.getPresentationCamera().fov, 50);
assert.strictEqual(scene.getSummary().readOnlySource, true);

scene.setBimLock(true);
assert.strictEqual(scene.getSummary().bimLocked, true);
const studyObject = scene.addStudyObject({ id: 'sofa-option', kind: 'furniture-option' });
assert.strictEqual(studyObject.source, 'ARQVERTICE_ONLY');
scene.setLightingPreset('Golden Hour');
assert.strictEqual(scene.getSummary().lightingPreset, 'Golden Hour');
const camera = scene.saveCamera('Presentation Camera', scene.getPresentationCamera());
assert.strictEqual(scene.duplicateCamera(camera.id, 'Presentation Camera Copy').name, 'Presentation Camera Copy');
scene.setStudyMode(true);
const materialOption = scene.saveMaterialOption('Travertino', { name: 'Travertino' });
assert.strictEqual(scene.compareMaterial(20412, materialOption.material).preservesBimGeometry, true);
const aiContext = scene.prepareAIRenderContext('Deixe o ambiente mais sofisticado.');
assert.strictEqual(aiContext.preserveGeometry, true);
assert.strictEqual(scene.recordRender('BIM').type, 'BIM');
assert.strictEqual(scene.recordRender('AI').type, 'AI');

console.log('J36/J39 ArqScene bridge: 20 assertions passed.');
