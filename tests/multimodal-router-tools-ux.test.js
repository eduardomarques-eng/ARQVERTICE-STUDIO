/**
 * tests/multimodal-router-tools-ux.test.js
 * Test suite for Bloco J: J11 -> J15
 * Verifies Jev Router, Tool Registry & Permissions, Workspace UX, and Cross-Modal Workflows
 */

const assert = require('assert');

const MultimodalRouterJev = require('../js/multimodal-router-jev.js');
const MultimodalToolRegistry = require('../js/multimodal-tool-registry.js');
const MultimodalWorkspaceModule = require('../js/multimodal-workspace-module.js');
const CrossModalWorkflows = require('../js/cross-modal-workflows.js');

console.log('================================================================');
console.log('🧪 TEST: MULTIMODAL ROUTER, TOOLS, WORKSPACE & WORKFLOWS (J11-J15)');
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
    // 1. J11 — Multimodal Router + Jev
    // -------------------------------------------------------------------------
    console.log('\n--- 1. J11: Multimodal Router + Jev Decision Engine ---');
    const router = new MultimodalRouterJev();

    test('Jev evaluates bounded CAD edit intent accurately', () => {
        const route = router.evaluateIntent({
            cad: 'peca.step',
            prompt: 'Altere a dimensão da profundidade do gaveteiro'
        });
        assert.strictEqual(route.decision.taskClass, 'CAD_EDIT');
        assert.strictEqual(route.decision.targetTool, 'CADTools');
        assert.strictEqual(route.decision.targetModel, 'FreeCAD-MCP');
        assert.strictEqual(route.decision.outputFormat, 'STEP');
        assert.strictEqual(route.policy.allowed, true);
    });

    test('Jev evaluates bounded 3D Generation intent from image', () => {
        const route = router.evaluateIntent({
            image: 'chair.png',
            prompt: 'Gere um modelo 3D mesh GLB a partir desta referência'
        });
        assert.strictEqual(route.decision.taskClass, '3D_GENERATION');
        assert.strictEqual(route.decision.targetTool, 'ThreeDTools');
        assert.strictEqual(route.decision.targetModel, 'TRELLIS.2');
        assert.strictEqual(route.policy.allowed, true);
    });

    test('Jev flags destructive actions for human approval', () => {
        const route = router.evaluateIntent({
            cad: 'assembly.step',
            prompt: 'Delete todas as features do modelo',
            destructive: true
        });
        assert.strictEqual(route.policy.allowed, false);
        assert.strictEqual(route.policy.status, 'REQUIRES_HUMAN_APPROVAL');
    });

    // -------------------------------------------------------------------------
    // 2. J12 — Multimodal Tool Registry & Permission System
    // -------------------------------------------------------------------------
    console.log('\n--- 2. J12: Multimodal Tool Registry & Permission Contracts ---');
    const registry = new MultimodalToolRegistry();

    test('Tool Registry lists default tools across 10 official categories', () => {
        const tools = registry.listTools();
        assert.ok(tools.length >= 10);
        const categories = new Set(tools.map(t => t.category));
        assert.ok(categories.has('VisionTools'));
        assert.ok(categories.has('ImageTools'));
        assert.ok(categories.has('ThreeDTools'));
        assert.ok(categories.has('CADTools'));
        assert.ok(categories.has('BIMTools'));
        assert.ok(categories.has('BlenderTools'));
        assert.ok(categories.has('VideoTools'));
    });

    await testAsync('Read-only and reversible tools execute sandboxed with audit trail', async () => {
        const result = await registry.execute('bim_query_quantities', { elementClass: 'IfcWall' });
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.data.elementClass, 'IfcWall');
        assert.strictEqual(result.risk, 'READ_ONLY');

        const logs = registry.getAuditLogs(1);
        assert.strictEqual(logs.length, 1);
        assert.strictEqual(logs[0].tool, 'bim_query_quantities');
        assert.strictEqual(logs[0].decision, 'EXECUTED');
    });

    await testAsync('Destructive tool requires confirmation and can be confirmed', async () => {
        registry.setConfirmationHandler(async () => true);
        const result = await registry.execute('freecad_purge_geometry', { targetSolidId: 'solid-1' });
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.data.purgedSolidId, 'solid-1');
    });

    // -------------------------------------------------------------------------
    // 3. J14 — Multimodal Workspace UX
    // -------------------------------------------------------------------------
    console.log('\n--- 3. J14: Multimodal Workspace UX & Preview-First Flow ---');
    const ws = new MultimodalWorkspaceModule();

    test('Workspace provides contextual actions for selected element type', () => {
        ws.selectElement({ type: 'image', name: 'Fachada Principal', metadata: 'PNG' });
        let actions = ws.getContextualActions();
        assert.ok(actions.some(a => a.model === 'SAM3'));
        assert.ok(actions.some(a => a.model === 'TRELLIS.2'));

        ws.selectElement({ type: 'cad_object', name: 'Armário Cozinha', metadata: 'STEP' });
        actions = ws.getContextualActions();
        assert.ok(actions.some(a => a.model === 'FreeCAD-MCP'));
    });

    test('Workspace executes Preview-First state machine: PROPOSE -> PREVIEW -> APPLY', () => {
        // 1. Propose
        ws.proposeChange('Aumentar profundidade para 650mm', 'CADTools', 'FreeCAD-MCP');
        assert.strictEqual(ws.previewStage, 'PROPOSED');

        // 2. Preview
        ws.generatePreview({ diffHighlight: true });
        assert.strictEqual(ws.previewStage, 'PREVIEW');

        // 3. Apply
        const newVer = ws.applyProposal();
        assert.strictEqual(ws.previewStage, 'APPLIED');
        assert.strictEqual(ws.versionHistory.length, 2);
        assert.strictEqual(newVer.active, true);
    });

    test('Workspace renders clean HTML shell adhering to the architecture', () => {
        const html = ws.render({ title: 'Residência Villa Verde' });
        assert.ok(html.includes('multimodal-workspace'));
        assert.ok(html.includes('Residência Villa Verde'));
        assert.ok(html.includes('Ações Multimodais Contextuais'));
        assert.ok(html.includes('mm-feedback-tray'));
    });

    // -------------------------------------------------------------------------
    // 4. J15 — Cross-Modal Workflows
    // -------------------------------------------------------------------------
    console.log('\n--- 4. J15: Cross-Modal Demonstration Workflows ---');
    const workflows = new CrossModalWorkflows();

    await testAsync('Workflow 1: Image -> Understand -> Segment -> 3D Gen -> Import -> Edit -> Render -> Compare -> Validate', async () => {
        const res = await workflows.executeImageTo3DWorkflow({ imageUrl: 'samples/poltrona.png' });
        assert.strictEqual(res.success, true);
        assert.strictEqual(res.totalSteps, 10);
        assert.strictEqual(res.steps[0].step, 'IMAGE_INGEST');
        assert.strictEqual(res.steps[4].step, 'GENERATE_3D');
        assert.strictEqual(res.steps[7].step, 'RENDER');
        assert.strictEqual(res.steps[9].step, 'VALIDATE');
        assert.strictEqual(res.steps[9].status, 'APPROVED');
    });

    await testAsync('Workflow 2: Drawing -> Understand -> Geometry -> CAD Structure -> Parameter Edit -> Recompute -> Validate', async () => {
        const res = await workflows.executeDrawingToCadWorkflow({ fileUrl: 'samples/marcenaria.dxf' });
        assert.strictEqual(res.success, true);
        assert.strictEqual(res.totalSteps, 7);
        assert.strictEqual(res.steps[0].step, 'DRAWING_INGEST');
        assert.strictEqual(res.steps[3].step, 'CAD_STRUCTURE');
        assert.strictEqual(res.steps[5].step, 'RECOMPUTE');
        assert.strictEqual(res.steps[6].step, 'VALIDATE');
        assert.strictEqual(res.steps[6].status, 'APPROVED');
    });

    console.log('\n================================================================');
    console.log(`🎉 TODOS OS ${passedTests} TESTES DE J11-J15 PASSARAM COM SUCESSO!`);
    console.log('================================================================\n');
})();
