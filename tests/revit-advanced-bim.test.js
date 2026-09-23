/**
 * tests/revit-advanced-bim.test.js
 * Suíte de Testes Automatizados para Revit Advanced BIM + AI + Cloud (Bloco J: J21 → J26)
 * 
 * Cobre:
 * - J21: Revit + AI Intelligence, Context Builder, Jev Bounded Decisions, Vision + BIM Matching
 * - J22: 12 Workflows Arquitetônicos Oficiais (Audit, Room, Facade, Materials, Floor Plan, QA)
 * - J23: Famílias, Parâmetros, Conversão Explícita de Unidades e Salvaguarda Anti-Duplicação
 * - J24: Vistas, Pranchas (NBR 6492), Viewports, Tabelas e Exportação Multiformato
 * - J25: Sincronização Bidirecional, Estados de Sync, Diff e Resolução Interativa de Conflitos
 * - J26: APS Cloud BIM, Caminho Duplo (Live Desktop vs Cloud Automation), Model Derivative e Design Automation
 */

const assert = require('assert');

const RevitLocalConnector = require('../js/revit-local-connector.js');
const RevitAIIntelligence = require('../js/revit-ai-intelligence.js');
const RevitArchitecturalWorkflows = require('../js/revit-architectural-workflows.js');
const RevitFamilyParameters = require('../js/revit-family-parameters.js');
const RevitDocumentationEngine = require('../js/revit-documentation-engine.js');
const RevitSyncEngine = require('../js/revit-sync-engine.js');
const APSCloudBIM = require('../js/aps-cloud-bim.js');

console.log('================================================================');
console.log('⚡ TESTES DE REVIT ADVANCED BIM + AI + CLOUD (BLOCO J: J21 → J26)');
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
    const connector = new RevitLocalConnector({ useVirtualDriver: true });
    await connector.connect();

    // -------------------------------------------------------------------------
    // 1. J21 — Revit + AI Intelligence
    // -------------------------------------------------------------------------
    console.log('\n--- 1. J21: Revit + AI Intelligence & Vision+BIM Fusion ---');
    const aiIntel = new RevitAIIntelligence(connector);

    await testAsync('J21.1: buildBIMContext deve extrair contexto estruturado do modelo ativo', async () => {
        const ctx = await aiIntel.buildBIMContext();
        assert.ok(ctx.documentTitle.includes('.rvt'));
        assert.ok(ctx.activeView !== null);
        assert.ok(ctx.selection.count >= 0);
    });

    test('J21.2: evaluateJevDecision deve rotear intenção para workflow e ferramenta delimitados', () => {
        const decision = aiIntel.evaluateJevDecision('Analise esta fachada e identifique janelas');
        assert.strictEqual(decision.targetWorkflow, 'FACADE_ANALYSIS');
        assert.strictEqual(decision.analysisStrategy, 'VISION_BIM_FUSION');
        assert.strictEqual(decision.resolvedBy, 'JevDecisionEngine');
    });

    await testAsync('J21.3: matchVisualToRevitElements deve associar regiões e bloquear mudanças autônomas se confiança for baixa', async () => {
        const visualRegions = [
            { id: 'v_reg_1', category: 'Walls', confidence: 0.95 },
            { id: 'v_reg_2', category: 'Doors', confidence: 0.60 } // Abaixo de 0.75
        ];
        const revitElements = [
            { id: 201, category: 'Walls', uniqueId: 'uid_wall_201', name: 'Parede Sul' },
            { id: 301, category: 'Doors', uniqueId: 'uid_door_301', name: 'Porta Entrada' }
        ];

        const matchResult = await aiIntel.matchVisualToRevitElements(visualRegions, revitElements);
        assert.strictEqual(matchResult.totalMatched, 2);
        assert.strictEqual(matchResult.matches[0].eligibleForAutonomousChange, true);
        assert.strictEqual(matchResult.matches[1].eligibleForAutonomousChange, false);
        assert.strictEqual(matchResult.matches[1].requiresUserReview, true);
        assert.strictEqual(matchResult.passedSafetyThreshold, false);
    });

    // -------------------------------------------------------------------------
    // 2. J22 — Revit Architectural Workflows
    // -------------------------------------------------------------------------
    console.log('\n--- 2. J22: 12 Workflows Arquitetônicos Oficiais ---');
    const workflows = new RevitArchitecturalWorkflows(connector);

    await testAsync('J22.1: runModelAudit deve identificar parâmetros ausentes, warnings e famílias não utilizadas', async () => {
        const audit = await workflows.runModelAudit();
        assert.strictEqual(audit.workflow, 'MODEL_AUDIT');
        assert.strictEqual(audit.status, 'COMPLETED');
        assert.ok(audit.findings.warnings.length > 0);
        assert.strictEqual(audit.healthRating, 'HEALTHY');
    });

    await testAsync('J22.2: runRoomAnalysis deve calcular áreas, acabamentos e taxas de ventilação/iluminação NBR', async () => {
        const room = await workflows.runRoomAnalysis('Living Integrado');
        assert.strictEqual(room.room.dimensions.areaM2, 45.0);
        assert.strictEqual(room.compliance, 'APPROVED');
    });

    await testAsync('J22.3: runFacadeAnalysis deve calcular relação cheios/vazios e ritmo de aberturas', async () => {
        const facade = await workflows.runFacadeAnalysis('Fachada Norte');
        assert.strictEqual(facade.metrics.solidToVoidRatio, 0.28);
        assert.strictEqual(facade.metrics.openingsCount, 6);
    });

    // -------------------------------------------------------------------------
    // 3. J23 — Famílias, Parâmetros e Padrões de Unidade
    // -------------------------------------------------------------------------
    console.log('\n--- 3. J23: Famílias, Parâmetros e Padrões de Unidade ---');
    const paramMgr = new RevitFamilyParameters(connector);

    test('J23.1: resolveUnit deve converter métrico explicitamente e rejeitar números nus', () => {
        const converted = paramMgr.resolveUnit(1.20, 'm');
        assert.strictEqual(converted.originalValue, 1.20);
        assert.strictEqual(converted.unit, 'm');
        assert.ok(Math.abs(converted.internalRevitValue - (1.20 / 0.3048)) < 0.001);

        assert.throws(() => {
            paramMgr.resolveUnit(1.20, '');
        }, /sem unidade/);
    });

    test('J23.2: resolveParameter deve barrar parâmetros Read-Only', () => {
        const paramRes = paramMgr.resolveParameter('Volume', { isReadOnly: true });
        assert.strictEqual(paramRes.valid, false);
        assert.ok(paramRes.error.includes('somente-leitura'));
    });

    test('J23.3: validateFamilyLoading deve prevenir duplicação de famílias existentes', () => {
        const check = paramMgr.validateFamilyLoading('Parede Básica');
        assert.strictEqual(check.allowed, false);
        assert.strictEqual(check.duplicateFound, true);
    });

    test('J23.4: duplicateType deve criar novo tipo com parâmetros derivados', () => {
        const dupRes = paramMgr.duplicateType('Parede Básica', 'Alvenaria 15cm', 'Alvenaria 18cm Acústica');
        assert.strictEqual(dupRes.success, true);
        assert.strictEqual(dupRes.newTypeName, 'Alvenaria 18cm Acústica');
    });

    // -------------------------------------------------------------------------
    // 4. J24 — Vistas, Pranchas, Documentação e Exportação
    // -------------------------------------------------------------------------
    console.log('\n--- 4. J24: Vistas, Pranchas, Documentação e Exportação ---');
    const docEngine = new RevitDocumentationEngine(connector);

    test('J24.1: createSheet deve criar prancha executiva com carimbo NBR 6492', () => {
        const sheet = docEngine.createSheet({ sheetNumber: 'A-101', format: 'A1' });
        assert.strictEqual(sheet.sheetNumber, 'A-101');
        assert.strictEqual(sheet.format, 'A1');
        assert.strictEqual(sheet.dimensionsMm.width, 841);
        assert.strictEqual(sheet.isRevitEditable, true);
    });

    test('J24.2: placeViewport deve inserir vista na prancha com escala técnica', () => {
        const vp = docEngine.placeViewport('A-101', 'Planta Baixa Térreo', { xMm: 150, yMm: 120 }, 50);
        assert.strictEqual(vp.viewName, 'Planta Baixa Térreo');
        assert.strictEqual(vp.scale, '1:50');
    });

    test('J24.3: prepareExportPackage deve gerar pacote multiformato validado', () => {
        const pkg = docEngine.prepareExportPackage('DOCUMENTATION', 'PDF');
        assert.strictEqual(pkg.format, 'PDF');
        assert.ok(pkg.sheetsIncluded.includes('A-101'));
    });

    // -------------------------------------------------------------------------
    // 5. J25 — Sincronização Bidirecional e Gestão de Conflitos
    // -------------------------------------------------------------------------
    console.log('\n--- 5. J25: Sincronização Bidirecional e Gestão de Conflitos ---');
    const syncEngine = new RevitSyncEngine(connector);

    test('J25.1: registerEntity deve armazenar dados locais e do Revit com estado IN_SYNC', () => {
        const rec = syncEngine.registerEntity('uid_elem_101', { comments: 'Revisado' }, { comments: 'Revisado', lengthM: 5.0 });
        assert.strictEqual(rec.state, 'IN_SYNC');
    });

    test('J25.2: calculateDiff deve detectar conflito quando ambas as fontes sofrem mutação concorrente', () => {
        const diffRes = syncEngine.calculateDiff('uid_elem_101', { comments: 'Novo no Studio' }, { comments: 'Novo no Revit' });
        assert.strictEqual(diffRes.state, 'CONFLICT');
        assert.strictEqual(diffRes.hasConflict, true);
    });

    test('J25.3: resolveConflict exige aprovação explícita e registra em trilha de auditoria', () => {
        assert.throws(() => {
            syncEngine.resolveConflict('uid_elem_101', 'REVIT', false);
        }, /aprovação explícita/);

        const res = syncEngine.resolveConflict('uid_elem_101', 'REVIT', true);
        assert.strictEqual(res.resolvedBy, 'REVIT');
        assert.strictEqual(res.auditStatus, 'CONFLICT_RESOLVED');
    });

    // -------------------------------------------------------------------------
    // 6. J26 — Autodesk Platform Services (APS) + Cloud BIM
    // -------------------------------------------------------------------------
    console.log('\n--- 6. J26: APS Cloud BIM & Dual Path Architecture ---');
    const aps = new APSCloudBIM({ engineVersion: 'Revit_2026' });

    test('J26.1: routeTask deve despachar para Live Desktop para edição de seleção e Cloud para tarefas em lote', () => {
        const liveRoute = aps.routeTask('CURRENT_SELECTION_EDIT', true);
        assert.strictEqual(liveRoute.path, 'LIVE_DESKTOP');

        const cloudRoute = aps.routeTask('BATCH_EXPORT_SHEETS', false);
        assert.strictEqual(cloudRoute.path, 'CLOUD_AUTOMATION');
    });

    await testAsync('J26.2: getPublicViewerToken deve operar sob o modelo Zero Secrets com cache', async () => {
        const tokenRes1 = await aps.getPublicViewerToken();
        assert.ok(tokenRes1.token.startsWith('aps_pub_token_'));

        const tokenRes2 = await aps.getPublicViewerToken();
        assert.strictEqual(tokenRes2.cached, true);
        assert.strictEqual(tokenRes2.token, tokenRes1.token);
    });

    await testAsync('J26.3: triggerModelDerivativeTranslation e Design Automation Workitem devem enfileirar jobs', async () => {
        const transRes = await aps.triggerModelDerivativeTranslation('urn:adsk.objects:os.object:bucket/model.rvt');
        assert.strictEqual(transRes.status, 'TRANSLATION_QUEUED');

        const workitemRes = await aps.submitDesignAutomationWorkitem('ArqVerticeBatchAuditor');
        assert.strictEqual(workitemRes.status, 'SUBMITTED');
        assert.strictEqual(workitemRes.engine, 'Revit_2026');
    });

    test('J26.4: handleWebhookEvent deve atualizar status do job assíncrono', () => {
        const lastJob = aps.jobsHistory[0];
        const eventRes = aps.handleWebhookEvent({
            eventType: 'extraction.finished',
            jobId: lastJob.jobId,
            status: 'COMPLETED'
        });
        assert.strictEqual(eventRes.status, 'COMPLETED');
        assert.strictEqual(lastJob.status, 'COMPLETED');
    });

    console.log('\n================================================================');
    console.log(`🎉 TODOS OS ${passedTests} TESTES DE REVIT ADVANCED BIM PASSARAM COM SUCESSO!`);
    console.log('================================================================\n');
})();
