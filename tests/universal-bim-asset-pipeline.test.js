const assert = require('assert');
const fs = require('fs');
const path = require('path');

const UniversalBIMPipeline = require('../js/universal-bim-pipeline.js');
const UniversalAssetPipeline = require('../js/universal-asset-pipeline.js');

console.log('================================================================');
console.log('🧪 BATERIA DE TESTES: J36/J37 — ARQVERTICE BIM + ASSET PIPELINE');
console.log('================================================================');

// 1. Teste de Categorias IFC e Estrutura Semântica
(() => {
    console.log('\n[1/6] Testando Categorias IFC Canônicas...');
    const categories = UniversalBIMPipeline.IFC_CATEGORIES;
    assert(categories.IfcWall, 'IfcWall deve existir.');
    assert(categories.IfcSlab, 'IfcSlab deve existir.');
    assert(categories.IfcDoor, 'IfcDoor deve existir.');
    assert(categories.IfcWindow, 'IfcWindow deve existir.');
    assert(categories.IfcFurnishingElement, 'IfcFurnishingElement deve existir.');
    assert.strictEqual(categories.IfcSpace.isSpatial, true, 'IfcSpace deve ser espacial.');
    assert.strictEqual(categories.IfcWall.isSpatial, false, 'IfcWall não deve ser espacial.');
    console.log('  ✔ Categorias canônicas IFC validadas.');
})();

// 2. Teste do Vínculo Relacional Unificado (BIMEntityRelationship)
(() => {
    console.log('\n[2/6] Testando Vínculo Relacional Unificado (visualId <-> assetId <-> ifcId <-> revitId)...');
    const pipeline = new UniversalBIMPipeline({ projectId: 'prj-praia-01' });
    
    const sofa = pipeline.getEntity('vis-sofa-living');
    assert(sofa, 'Sofá living deve existir no modelo inicial.');
    assert.strictEqual(sofa.assetId, 'SOFA-001');
    assert.strictEqual(sofa.ifcId, '34901');
    assert.strictEqual(sofa.revitId, 'REV-70102');
    assert.strictEqual(sofa.category, 'IfcFurnishingElement');
    assert.strictEqual(sofa.roomId, 'spc-living');
    assert.strictEqual(sofa.levelId, 'lvl-01');
    assert.strictEqual(sofa.source, 'GLB');
    assert.strictEqual(sofa.dimensions.areaM2, 6.48);

    // Novo vínculo dinâmico
    const bound = pipeline.bindEntity({
        visualId: 'vis-table-gourmet',
        assetId: 'TAB-001',
        ifcId: '55102',
        revitId: 'REV-80101',
        projectId: 'prj-praia-01',
        roomId: 'spc-gourmet',
        levelId: 'lvl-01',
        category: 'IfcFurnishingElement',
        name: 'Mesa Gourmet Madeira',
        source: 'Revit'
    });

    assert.strictEqual(bound.visualId, 'vis-table-gourmet');
    assert.strictEqual(pipeline.getEntity('vis-table-gourmet').assetId, 'TAB-001');
    console.log('  ✔ Vínculos semânticos e identificadores cruzados validados.');
})();

// 3. Teste de Cortes de Seção e Isolamento de Pavimento
(() => {
    console.log('\n[3/6] Testando Cortes de Seção e Isolamento de Pavimentos...');
    const pipeline = new UniversalBIMPipeline({ projectId: 'prj-praia-01' });

    // Plano de corte
    const plane = pipeline.addSectionPlane('y', 1.5, 'Corte Horizontal Térreo');
    assert.strictEqual(plane.axis, 'y');
    assert.strictEqual(plane.position, 1.5);

    // Isolamento de Pavimento
    pipeline.isolateLevel('lvl-01');
    assert.strictEqual(pipeline.getEntity('vis-wall-north').visibility, true);

    pipeline.showAll();
    assert.strictEqual(pipeline.getEntity('vis-wall-north').visibility, true);
    console.log('  ✔ Planos de corte e isolamento de pavimentos validados.');
})();

// 4. Teste de Ingestão Multi-Formato e 3-Tier Storage
(async () => {
    console.log('\n[4/6] Testando Ingestão Multi-Formato & 3-Tier Storage...');
    const assetPipeline = new UniversalAssetPipeline({ projectId: 'prj-praia-01' });

    const formats = ['GLB', 'OBJ', 'FBX', 'PLY', 'SPLAT', 'IFC'];
    for (const fmt of formats) {
        const asset = await assetPipeline.importAsset({
            name: `Teste ${fmt}`,
            format: fmt,
            category: 'Furniture'
        });

        assert.strictEqual(asset.status, 'READY');
        assert.strictEqual(asset.validation.valid, true);
        assert(asset.storage.source.includes(fmt.toLowerCase()), 'Storage source deve conter o arquivo original.');
        assert(asset.storage.processed.includes('.glb'), 'Storage processed deve ser normalizado para GLB.');
        assert(asset.storage.web.includes('_lod0.glb'), 'Storage web deve conter o GLB otimizado.');
    }

    console.log('  ✔ Formatos (GLB, OBJ, FBX, PLY, SPLAT, IFC) e 3-Tier Storage validados.');
})();

// 5. Teste de Geração de LODs (LOD0, LOD1, LOD2)
(async () => {
    console.log('\n[5/6] Testando Geração de LODs (LOD 0, LOD 1, LOD 2)...');
    const assetPipeline = new UniversalAssetPipeline({ projectId: 'prj-praia-01' });

    const processed = await assetPipeline.importAsset({
        name: 'Poltrona Lounge',
        format: 'FBX',
        category: 'Furniture'
    });

    const lods = processed.lods;
    assert(lods.lod0, 'LOD 0 deve existir.');
    assert(lods.lod1, 'LOD 1 deve existir.');
    assert(lods.lod2, 'LOD 2 deve existir.');

    assert(lods.lod0.triangles > lods.lod1.triangles, 'LOD 0 deve ter mais triângulos que LOD 1.');
    assert(lods.lod1.triangles > lods.lod2.triangles, 'LOD 1 deve ter mais triângulos que LOD 2.');
    assert(lods.lod0.sizeKB > lods.lod1.sizeKB, 'LOD 0 deve ser maior em KB que LOD 1.');
    assert(lods.lod1.sizeKB > lods.lod2.sizeKB, 'LOD 1 deve ser maior em KB que LOD 2.');

    console.log('  ✔ Geração de LODs e decimação progressiva validadas.');
})();

// 6. Teste de Compilação do Project Manifest (project.manifest.json)
(() => {
    console.log('\n[6/6] Testando Compilação de project.manifest.json...');
    const assetPipeline = new UniversalAssetPipeline({ projectId: 'prj-praia-01' });
    
    const manifest = assetPipeline.generateProjectManifest();
    assert.strictEqual(manifest.schemaVersion, '1.0.0-arqvertice-manifest');
    assert.strictEqual(manifest.projectId, 'prj-praia-01');
    assert(Array.isArray(manifest.scenes) && manifest.scenes.length > 0, 'Deve conter lista de cenas.');
    assert(Array.isArray(manifest.materials) && manifest.materials.length > 0, 'Deve conter materiais PBR.');
    assert(manifest.bim && manifest.bim.schema === 'IFC4', 'Deve conter metadados BIM.');
    assert(Array.isArray(manifest.cameras), 'Deve conter câmeras pré-configuradas.');
    assert(manifest.lighting && manifest.lighting.sun, 'Deve conter iluminação.');
    assert(manifest.lodConfig && manifest.lodConfig.thresholds, 'Deve conter regras de LOD.');
    assert(manifest.permissions && manifest.permissions.allowMeasurements, 'Deve conter permissões.');

    console.log('  ✔ project.manifest.json compilado com sucesso.');
})();

console.log('\n================================================================');
console.log('🎉 TODOS OS TESTES DO PIPELINE BIM + ASSET J36/J37 FORAM APROVADOS!');
console.log('================================================================');
