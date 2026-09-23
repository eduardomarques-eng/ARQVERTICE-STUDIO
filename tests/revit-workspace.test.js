/**
 * tests/revit-workspace.test.js
 * Suíte de Testes Automatizados para o Revit Workspace (Bloco J: J32)
 * 
 * Cobre:
 * - J32.1: RevitBIMAdapter (Controle de conexão, estados, refresh)
 * - J32.2: Indicadores Reais de Saúde (Health Check: 5 indicadores)
 * - J32.3: Isolamento de API (Zero acoplamento com namespaces C# da Revit API)
 * - J32.4: Consultas Canônicas (Projeto, Seleção, Vistas, Elementos, Parâmetros e Geometria)
 * - J32.5: RevitWorkspaceModule (Ciclo de vida, 12 seções navegáveis, troca de abas e inspeção)
 * - J32.6: Command Center e Execução de Prompts pelo Agente Cognitivo
 */

const assert = require('assert');

const RevitBIMAdapter = require('../js/revit-bim-adapter.js');
const RevitWorkspaceModule = require('../js/revit-workspace-module.js');

console.log('================================================================');
console.log('🏛️  TESTES DO REVIT WORKSPACE DEDICADO (BLOCO J: J32)');
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
    // -------------------------------------------------------------------------
    // 1. REVIT BIM ADAPTER — CONEXÃO E CICLO DE VIDA
    // -------------------------------------------------------------------------
    console.log('\n--- 1. RevitBIMAdapter: Controle de Conexão e Estados ---');

    const adapter = new RevitBIMAdapter({ useVirtualDriver: true, debug: false });

    test('J32.1: Estado inicial deve ser DISCONNECTED', () => {
        assert.strictEqual(adapter.status, 'DISCONNECTED');
        const status = adapter.getStatus();
        assert.strictEqual(status.status, 'DISCONNECTED');
    });

    await testAsync('J32.2: Conexão bem-sucedida transiciona para CONNECTED', async () => {
        const res = await adapter.connect();
        assert.strictEqual(res.success, true);
        assert.strictEqual(adapter.status, 'CONNECTED');
        assert.strictEqual(adapter.getStatus().status, 'CONNECTED');
        assert.ok(adapter.activeDocument.includes('.rvt'));
    });

    await testAsync('J32.3: Reconnect e Refresh devem manter o estado consistente', async () => {
        const refreshRes = await adapter.refresh();
        assert.strictEqual(refreshRes.success, true);
        assert.ok(refreshRes.project);
        assert.ok(refreshRes.view);
        assert.ok(refreshRes.selection);

        const reconnectRes = await adapter.reconnect();
        assert.strictEqual(reconnectRes.success, true);
        assert.strictEqual(adapter.status, 'CONNECTED');
    });

    // -------------------------------------------------------------------------
    // 2. INDICADORES REAIS DE SAÚDE (HEALTH CHECK)
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Indicadores Reais de Saúde (Health Check) ---');

    test('J32.4: Health check deve verificar 5 indicadores reais', () => {
        const health = adapter.getHealthCheck();
        assert.ok(health.revitConnected);
        assert.ok(health.documentReady);
        assert.ok(health.syncReady);
        assert.ok(health.threeDReady);
        assert.ok(health.aiReady);

        assert.strictEqual(health.revitConnected.ready, true);
        assert.strictEqual(health.documentReady.ready, true);
        assert.strictEqual(health.syncReady.ready, true);
        assert.strictEqual(health.threeDReady.ready, true);
        assert.strictEqual(health.aiReady.ready, true);
    });

    // -------------------------------------------------------------------------
    // 3. ISOLAMENTO DE API (ZERO VAZAMENTO DE C#)
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Isolamento Arquitetural de API (Frontend vs C# Revit) ---');

    test('J32.5: Nenhum tipo ou namespace C# deve vazar para o frontend', () => {
        const status = adapter.getStatus();
        const jsonStr = JSON.stringify(status);
        assert.strictEqual(jsonStr.includes('Autodesk.Revit.DB'), false);
        assert.strictEqual(jsonStr.includes('UIApplication'), false);
        assert.strictEqual(jsonStr.includes('UIDocument'), false);
    });

    // -------------------------------------------------------------------------
    // 4. CONSULTAS DE ELEMENTOS E PARÂMETROS
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Consultas Estruturadas via Adapter ---');

    await testAsync('J32.6: Consulta de elementos por categoria (queryElements)', async () => {
        const walls = await adapter.queryElements({ category: 'Walls' });
        assert.strictEqual(walls.category, 'Walls');
        assert.ok(walls.items.length > 0);
        assert.strictEqual(walls.items[0].category, 'Walls');
    });

    test('J32.7: Leitura detalhada de elemento e parâmetros (readElement, readParameters)', () => {
        const el = adapter.readElement(20412);
        assert.strictEqual(el.id, 20412);
        assert.strictEqual(el.category, 'Walls');
        assert.ok(el.parameters.instance.length > 0);
        assert.ok(el.parameters.type.length > 0);

        // Verificação de conversão de unidades e flags readonly
        const areaParam = el.parameters.instance.find(p => p.name === 'Área');
        assert.ok(areaParam);
        assert.strictEqual(areaParam.unit, 'm²');
        assert.strictEqual(areaParam.isReadOnly, true);
    });

    test('J32.8: Leitura de geometria normalizada (readGeometry)', () => {
        const geom = adapter.readGeometry(20412);
        assert.strictEqual(geom.elementId, 20412);
        assert.ok(geom.boundingBox);
        assert.ok(geom.mesh.volumeM3 > 0);
    });

    // -------------------------------------------------------------------------
    // 5. REVIT WORKSPACE MODULE — NAVEGAÇÃO E 12 SEÇÕES
    // -------------------------------------------------------------------------
    console.log('\n--- 5. RevitWorkspaceModule: 12 Seções e Componentes ---');

    test('J32.9: Inicialização e alternância entre as 12 seções', () => {
        RevitWorkspaceModule.init();
        assert.strictEqual(RevitWorkspaceModule.activeSection, 'overview');

        const sections = [
            'overview', 'connection', 'project', 'model', 'views',
            'quantities', 'families', '3d', 'ai-commands', 'sync',
            'history', 'settings'
        ];

        for (const sec of sections) {
            RevitWorkspaceModule.switchSection(sec);
            assert.strictEqual(RevitWorkspaceModule.activeSection, sec);
            const content = RevitWorkspaceModule._renderSectionContentHTML();
            assert.ok(content.length > 50, `Seção "${sec}" deve renderizar HTML válido.`);
        }
    });

    test('J32.10: Seleção de elemento e alternância de abas de parâmetros', () => {
        RevitWorkspaceModule.selectElement(30101);
        assert.strictEqual(RevitWorkspaceModule.selectedElementId, 30101);

        RevitWorkspaceModule.setParamTab('type');
        assert.strictEqual(RevitWorkspaceModule.paramTab, 'type');

        RevitWorkspaceModule.setParamTab('instance');
        assert.strictEqual(RevitWorkspaceModule.paramTab, 'instance');
    });

    // -------------------------------------------------------------------------
    // 6. COMMAND CENTER E PROMPTS DE IA
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Command Center e Integração de IA ---');

    await testAsync('J32.11: Processamento de prompt pelo Agente Cognitivo', async () => {
        const res = await adapter.processAIPrompt('Mostre todas as portas do pavimento superior');
        assert.strictEqual(res.success, true);
        assert.ok(adapter.eventLogs.length > 0);
        assert.strictEqual(adapter.eventLogs[0].level, 'AI_PROMPT');
    });

    // -------------------------------------------------------------------------
    // 7. J37 — REVIT COMMAND CENTER OPERACIONAL
    // -------------------------------------------------------------------------
    console.log('\n--- 7. J37: Revit Command Center — Plano, Approval Gate e Histórico ---');

    await testAsync('J37.1: Comando de importação deve gerar rota 3D e exigir aprovação', async () => {
        RevitWorkspaceModule.adapter = adapter;
        const plan = await RevitWorkspaceModule._buildCommandPlan('Importe a sala selecionada.');
        assert.strictEqual(plan.route, 'ROUTE_TO_3D');
        assert.strictEqual(plan.tool, 'revit.scene.import');
        assert.strictEqual(plan.needsApproval, true);
        assert.ok(plan.context.project);
        assert.ok(plan.preview);
    });

    await testAsync('J43.1: Seleção Revit deve gerar Study Scene rastreável sem escrever no Revit', async () => {
        const studyScene = await adapter.prepareSelectedRoomStudy({ cameraName: 'Living Study' });
        assert.ok(studyScene.sceneId);
        assert.ok(studyScene.elements.length > 0);
        assert.ok(studyScene.elements.every(element => element.source === 'Revit'));
        assert.ok(studyScene.elements.every(element => element.uniqueId || element.sourceId || element.id));
        assert.strictEqual(studyScene.camera.name, 'Living Study');
        assert.strictEqual(studyScene.camera.writesToRevit, false);
        assert.strictEqual(studyScene.writesToRevit, false);
    });

    await testAsync('J43.2: Aprovação do comando 3D deve executar a Study Scene, não apenas o agente textual', async () => {
        RevitWorkspaceModule.pendingCommand = await RevitWorkspaceModule._buildCommandPlan('Importe o ambiente selecionado.');
        RevitWorkspaceModule.commandState = 'preview';
        await RevitWorkspaceModule.approvePendingCommand();
        assert.strictEqual(RevitWorkspaceModule.pendingCommand.result.writesToRevit, false);
        assert.ok(RevitWorkspaceModule.pendingCommand.result.sceneId);
        assert.strictEqual(RevitWorkspaceModule.commandState, 'validated');
    });

    test('J37.2: Rota de quantitativos permanece somente leitura', () => {
        const plan = RevitWorkspaceModule._getRouteMetadata(
            'ROUTE_TO_QUANTITY',
            'Quantifique as janelas.'
        );
        assert.strictEqual(plan.tool, 'revit.quantity.query');
        assert.strictEqual(plan.needsApproval, false);
        assert.strictEqual(plan.risk, 'L0 · Somente leitura');
    });

    test('J37.3: Histórico deve preservar command, context, tool, result e timestamp', () => {
        RevitWorkspaceModule.commandHistory = [{
            command: 'Quantifique as janelas.',
            context: { currentView: '{3D}' },
            tool: 'revit.quantity.query',
            result: 'Validated',
            timestamp: new Date().toISOString()
        }];
        const historyHtml = RevitWorkspaceModule._renderHistorySection();
        assert.ok(historyHtml.includes('Quantifique as janelas.'));
        assert.ok(historyHtml.includes('revit.quantity.query'));
        assert.ok(historyHtml.includes('Validated'));
    });

    console.log('\n================================================================');
    console.log(`🎉 TODOS OS ${passedTests} TESTES DO REVIT WORKSPACE PASSARAM COM SUCESSO!`);
    console.log('================================================================');
})();
