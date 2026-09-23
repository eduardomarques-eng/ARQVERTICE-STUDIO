/**
 * tests/revit-quantities-engine.test.js
 * Suíte de Testes Automatizados para Extração BIM e Quantitativos (Bloco J: J34)
 * 
 * Cobre:
 * - J34.1: Princípio Determinístico (Fonte Revit, zero IA em cálculos)
 * - J34.2: Extração de Metadados e Parâmetros Canônicos
 * - J34.3: 16 Categorias Primárias do Revit
 * - J34.4: 8 Métricas Quantitativas Padronizadas
 * - J34.5: Agregação Multicritério (Category, Family, Type, Material, Level, Room, Phase, Workset)
 * - J34.6: Pipeline "Quantifique as paredes do pavimento superior" (Nível 02 / Walls)
 * - J34.7: Material Takeoff Analítico (Área, Volume, Camadas e Element IDs)
 * - J34.8: Unidades Explícitas (Formatação obrigatória { value, unit, spec, source })
 * - J34.9: Normalização de Unidades Internas (Conversão Imperial/Métrico)
 * - J34.10: Exportadores (CSV, JSON, Tabela HTML e Plano PDF)
 * - J34.11: Arquitetura de Custo Futuro (Quantity + Unit Cost + Labor + Waste)
 * - J34.12: Rastreabilidade Ponta a Ponta (Traceability Audit Pack)
 * - J34.13: Validação de Discrepâncias (Contagem Bruta vs Contagem Agregada)
 * - J34.14: Integração Completa com RevitBIMAdapter e RevitWorkspaceModule
 */

'use strict';

const assert = require('assert');

const RevitQuantitiesEngine = require('../js/revit-quantities-engine.js');
const RevitBIMAdapter = require('../js/revit-bim-adapter.js');
const RevitWorkspaceModule = require('../js/revit-workspace-module.js');

console.log('================================================================');
console.log('📊 TESTES DE EXTRAÇÃO BIM & MOTOR DE QUANTITATIVOS (BLOCO J: J34)');
console.log('================================================================');

let passedTests = 0;
function test(name, fn) {
    try {
        fn();
        console.log(`  ✔ [PASS] ${name}`);
        passedTests++;
    } catch (err) {
        console.error(`  ✖ [FAIL] ${name}`);
        console.error(err);
        process.exit(1);
    }
}

async function testAsync(name, fn) {
    try {
        await fn();
        console.log(`  ✔ [PASS] ${name}`);
        passedTests++;
    } catch (err) {
        console.error(`  ✖ [FAIL] ${name}`);
        console.error(err);
        process.exit(1);
    }
}

(async () => {
    const engine = new RevitQuantitiesEngine(null, { debug: false });

    // -------------------------------------------------------------------------
    // 1. PRINCÍPIO DETERMINÍSTICO E CATEGORIAS SUPORTADAS
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Categorias Primárias & Métricas Padronizadas ---');

    test('J34.3: Deve suportar as 16 categorias primárias do Revit', () => {
        const cats = RevitQuantitiesEngine.BIM_CATEGORIES;
        const requiredCategories = [
            'Walls', 'Floors', 'Roofs', 'Ceilings', 'Doors', 'Windows',
            'Furniture', 'Rooms', 'Columns', 'Structural Framing',
            'Generic Models', 'Stairs', 'Railings', 'Curtain Walls',
            'Curtain Panels', 'Curtain Mullions'
        ];

        for (const rc of requiredCategories) {
            const found = Object.values(cats).includes(rc);
            assert.ok(found, `Categoria ${rc} deve estar presente em BIM_CATEGORIES`);
        }
        assert.strictEqual(Object.keys(cats).length, 16);
    });

    test('J34.4: Deve suportar as 8 métricas quantitativas canônicas', () => {
        const metrics = RevitQuantitiesEngine.QUANTITY_METRICS;
        assert.strictEqual(metrics.COUNT, 'COUNT');
        assert.strictEqual(metrics.LENGTH, 'LENGTH');
        assert.strictEqual(metrics.AREA, 'AREA');
        assert.strictEqual(metrics.VOLUME, 'VOLUME');
        assert.strictEqual(metrics.MATERIAL_AREA, 'MATERIAL_AREA');
        assert.strictEqual(metrics.MATERIAL_VOLUME, 'MATERIAL_VOLUME');
        assert.strictEqual(metrics.ROOM_AREA, 'ROOM_AREA');
        assert.strictEqual(metrics.ROOM_VOLUME, 'ROOM_VOLUME');
    });

    // -------------------------------------------------------------------------
    // 2. UNIDADES EXPLÍCITAS E NORMALIZAÇÃO
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Unidades Explícitas & Normalização ---');

    test('J34.8: Nenhum número sem unidade pode trafegar no sistema', () => {
        const measure = engine.createQuantityMeasure(142.5087, 'm²', 'Área de Alvenaria', 'REVIT_MODEL');
        assert.strictEqual(measure.value, 142.509);
        assert.strictEqual(measure.unit, 'M²');
        assert.strictEqual(measure.spec, 'Área de Alvenaria');
        assert.strictEqual(measure.source, 'REVIT_MODEL');
        assert.ok(measure.formatted.includes('m²'));
    });

    test('J34.9: Conversão determinística de unidades internas do Revit (Imperial para Métrico)', () => {
        // 10 pés = 3.048 m
        const lengthM = engine.normalizeRevitValue(10, 'FT');
        assert.strictEqual(Math.round(lengthM * 1000) / 1000, 3.048);

        // 100 pés quadrados = ~9.2903 m²
        const areaM2 = engine.normalizeRevitValue(100, 'SQFT');
        assert.strictEqual(Math.round(areaM2 * 100) / 100, 9.29);

        // 100 pés cúbicos = ~2.8317 m³
        const volM3 = engine.normalizeRevitValue(100, 'CUFT');
        assert.strictEqual(Math.round(volM3 * 100) / 100, 2.83);

        // Métrica nativa preserva valor
        assert.strictEqual(engine.normalizeRevitValue(25.5, 'M2'), 25.5);
    });

    // -------------------------------------------------------------------------
    // 3. PIPELINE DE QUANTIFICAÇÃO: "QUANTIFIQUE AS PAREDES DO PAVIMENTO SUPERIOR"
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Pipeline: "Paredes do Pavimento Superior" ---');

    await testAsync('J34.6: Executar pipeline completo para paredes do pavimento superior (Nível 02)', async () => {
        const result = await engine.calculateQuantities({
            category: 'Walls',
            level: 'Nível 02'
        }, {
            groupBy: 'type',
            queryName: 'Quantificação das Paredes do Pavimento Superior'
        });

        assert.ok(result);
        assert.strictEqual(result.queryName, 'Quantificação das Paredes do Pavimento Superior');

        // Contagem: 2 paredes cadastradas no Nível 02 (id 20501 e 20502)
        assert.strictEqual(result.metrics.count.value, 2);
        assert.strictEqual(result.metrics.count.unit, 'UN');

        // Comprimento: 5.0m + 3.5m = 8.5m
        assert.strictEqual(result.metrics.length.value, 8.5);
        assert.strictEqual(result.metrics.length.unit, 'M');

        // Área: 15.0m² + 10.5m² = 25.5m²
        assert.strictEqual(result.metrics.area.value, 25.5);
        assert.strictEqual(result.metrics.area.unit, 'M²');

        // Volume: 2.25m³ + 1.05m³ = 3.3m³
        assert.strictEqual(result.metrics.volume.value, 3.3);
        assert.strictEqual(result.metrics.volume.unit, 'M³');

        // Grupos agregados por tipo
        assert.strictEqual(result.groups.length, 2);
        const drywallGroup = result.groups.find(g => g.groupKey.includes('Drywall'));
        assert.ok(drywallGroup);
        assert.strictEqual(drywallGroup.count.value, 1);
        assert.strictEqual(drywallGroup.elementIds[0], 20502);

        // Validação sem discrepâncias
        assert.strictEqual(result.validation.valid, true);
        assert.strictEqual(result.validation.difference, 0);

        // Rastreabilidade
        assert.deepStrictEqual(result.traceability.elementIds, [20501, 20502]);
        assert.ok(result.traceability.timestamp);
    });

    // -------------------------------------------------------------------------
    // 4. AGREGAÇÕES MULTICRITÉRIO
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Agregações Multicritério ---');

    await testAsync('J34.5: Agrupar paredes por Material e verificar somatórios', async () => {
        const result = await engine.calculateQuantities({
            category: 'Walls'
        }, {
            groupBy: 'material'
        });

        assert.ok(result.groups.length >= 3);
        const ceramicGroup = result.groups.find(g => g.groupKey.includes('Cerâmico'));
        assert.ok(ceramicGroup);
        // 3 paredes cerâmicas no total (20412, 20413, 20501)
        assert.strictEqual(ceramicGroup.count.value, 3);
        assert.strictEqual(ceramicGroup.elementIds.length, 3);
    });

    await testAsync('J34.5b: Agrupar por Pavimento (Level)', async () => {
        const result = await engine.calculateQuantities({
            category: 'Walls'
        }, {
            groupBy: 'level'
        });

        assert.strictEqual(result.groups.length, 2);
        const niv1 = result.groups.find(g => g.groupKey === 'Nível 01');
        const niv2 = result.groups.find(g => g.groupKey === 'Nível 02');

        assert.strictEqual(niv1.count.value, 4); // 4 paredes no nível 01
        assert.strictEqual(niv2.count.value, 2); // 2 paredes no nível 02
    });

    // -------------------------------------------------------------------------
    // 5. MATERIAL TAKEOFF (LEVANTAMENTO ANALÍTICO DE MATERIAIS)
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Material Takeoff Analítico ---');

    await testAsync('J34.7: Calcular levantamento detalhado de materiais', async () => {
        const takeoff = await engine.calculateMaterialTakeoff({
            category: 'Walls'
        });

        assert.ok(takeoff);
        assert.ok(takeoff.items.length >= 4);

        const ceramicMat = takeoff.items.find(m => m.material.includes('Cerâmico'));
        assert.ok(ceramicMat);
        assert.ok(ceramicMat.area.value > 0);
        assert.ok(ceramicMat.volume.value > 0);
        assert.strictEqual(ceramicMat.area.unit, 'M²');
        assert.strictEqual(ceramicMat.elementCount.value, 3);
        assert.deepStrictEqual(ceramicMat.elementIds.sort(), [20412, 20413, 20501]);
    });

    // -------------------------------------------------------------------------
    // 6. VALIDAÇÃO DE DISCREPÂNCIAS
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Validação de Discrepâncias ---');

    test('J34.13: Detectar integridade perfeita (Zero perdas)', () => {
        const raw = [
            { id: 1, type: 'A' },
            { id: 2, type: 'A' },
            { id: 3, type: 'B' }
        ];
        const aggregated = engine.aggregate(raw, 'type');
        const val = engine.validateDiscrepancies(raw, aggregated);

        assert.strictEqual(val.valid, true);
        assert.strictEqual(val.difference, 0);
        assert.strictEqual(val.rawElementCount, 3);
        assert.strictEqual(val.aggregatedCount, 3);
        assert.strictEqual(val.missingElementIds.length, 0);
    });

    test('J34.13b: Detectar discrepância se elemento for perdido na agregação', () => {
        const raw = [
            { id: 1, type: 'A' },
            { id: 2, type: 'A' },
            { id: 3, type: 'B' }
        ];
        // Simular agregação defeituosa que omitiu o id 3
        const fakeAggregated = [
            { count: { value: 2 }, elementIds: [1, 2] }
        ];
        const val = engine.validateDiscrepancies(raw, fakeAggregated);

        assert.strictEqual(val.valid, false);
        assert.strictEqual(val.difference, 1);
        assert.deepStrictEqual(val.missingElementIds, [3]);
    });

    // -------------------------------------------------------------------------
    // 7. ARQUITETURA PARA CUSTOS FUTUROS
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Estrutura Preparada para Custos ---');

    await testAsync('J34.11: Previsão de custo preparada sem mock arbitrário de preços', async () => {
        const res = await engine.calculateQuantities({ category: 'Floors' });
        const cost = res.costStructure;

        assert.ok(cost);
        assert.strictEqual(cost.enabled, false);
        assert.strictEqual(cost.status, 'AWAITING_PRICE_SOURCE');
        assert.strictEqual(cost.parameters.unitCost, null);
        assert.ok(cost.parameters.baseQuantity.areaM2 > 0);
        assert.ok(cost.formula.includes('EstimatedCost = (Quantity * (1 + WasteRate)) * UnitCost + LaborCost'));
    });

    // -------------------------------------------------------------------------
    // 8. EXPORTAÇÃO DE RELATÓRIOS
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Exportação de Relatórios ---');

    await testAsync('J34.10: Exportação em CSV, JSON, Tabela HTML e PDF Plan', async () => {
        const res = await engine.calculateQuantities({ category: 'Walls' });

        // CSV
        const csv = engine.exportQuantities(res, 'CSV');
        assert.ok(typeof csv === 'string');
        assert.ok(csv.includes('TOTAL GERAL'));
        assert.ok(csv.includes('Alvenaria 15cm Bloco Cerâmico'));

        // JSON
        const json = engine.exportQuantities(res, 'JSON');
        const parsed = JSON.parse(json);
        assert.strictEqual(parsed.metrics.count.unit, 'UN');

        // HTML Table
        const html = engine.exportQuantities(res, 'TABLE');
        assert.ok(html.includes('<table class="revit-table"'));
        assert.ok(html.includes('TOTAL'));

        // PDF Plan
        const pdfPlan = engine.exportQuantities(res, 'PDF');
        assert.ok(pdfPlan.title);
        assert.ok(pdfPlan.html);
    });

    // -------------------------------------------------------------------------
    // 9. INTEGRAÇÃO COM REVIT BIM ADAPTER & WORKSPACE MODULE
    // -------------------------------------------------------------------------
    console.log('\n--- 9. Integração com Adapter & Workspace ---');

    const adapter = new RevitBIMAdapter({ useVirtualDriver: true, debug: false });

    await testAsync('J34.14a: RevitBIMAdapter deve expor getBimQuantities e getMaterialTakeoff', async () => {
        await adapter.connect();

        const qty = await adapter.getBimQuantities({ category: 'Doors' });
        assert.ok(qty);
        assert.strictEqual(qty.metrics.count.value, 2);

        const takeoff = await adapter.getMaterialTakeoff({ category: 'Doors' });
        assert.ok(takeoff);
        assert.ok(takeoff.items.length >= 2);

        const csv = adapter.exportBimQuantities(qty, 'CSV');
        assert.ok(csv.includes('Porta Pivotante'));
    });

    test('J34.14b: RevitWorkspaceModule deve conter seção interativa de quantitativos com filtros e métricas', () => {
        RevitWorkspaceModule.init();
        RevitWorkspaceModule.switchSection('quantities');
        assert.strictEqual(RevitWorkspaceModule.activeSection, 'quantities');

        // Testar alternância de filtros
        RevitWorkspaceModule.setQtyCategory('Floors');
        assert.strictEqual(RevitWorkspaceModule.qtyCategory, 'Floors');

        RevitWorkspaceModule.setQtyLevel('Nível 01');
        assert.strictEqual(RevitWorkspaceModule.qtyLevel, 'Nível 01');

        RevitWorkspaceModule.setQtyTab('takeoff');
        assert.strictEqual(RevitWorkspaceModule.qtyTab, 'takeoff');

        const html = RevitWorkspaceModule._renderSectionContentHTML();
        assert.ok(html.includes('BIM Extraction & Quantities Engine (J34)'));
        assert.ok(html.includes('Porcelanato Acetinado'));
        assert.ok(html.includes('Material Takeoff'));

        // Testar exportadores no módulo
        const csv = RevitWorkspaceModule.downloadQuantitiesCSV();
        assert.ok(csv && csv.includes('Quantitativos BIM'));

        const json = RevitWorkspaceModule.downloadQuantitiesJSON();
        assert.ok(json && json.includes('Floors'));
    });

    console.log('\n================================================================');
    console.log(`🎉 TODOS OS ${passedTests} TESTES DO MOTOR DE QUANTITATIVOS PASSARAM COM SUCESSO!`);
    console.log('================================================================\n');
})();
