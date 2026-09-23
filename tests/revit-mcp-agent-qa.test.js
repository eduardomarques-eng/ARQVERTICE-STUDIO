/**
 * tests/revit-mcp-agent-qa.test.js
 * Suíte de Validação Final e QA para Revit MCP + BIM Agent + Safety + Sandbox (Bloco J: J27 → J31)
 * 
 * Cobre:
 * - J27: Revit MCP Bridge (Categorias, Schema MCP, Permissões, Tool Discovery e Execução)
 * - J28: Revit BIM Agent (Pipeline de 8 Estágios, Raciocínio Semântico sobre 16 Domínios)
 * - J29: Revit Worksharing Safety (Ownership, Elementos Bloqueados, ELEMENT_NOT_EDITABLE, Sync Gate)
 * - J30: Revit Safety Sandbox (6 Níveis L0-L5, Commit Status Real, Rollback Atômico e Failure Report)
 * - J31: Revit BIM QA & Aceitação Final (Loop Completo Connect-Read-Understand-Query-Propose-Edit-Validate-Rollback)
 */

const assert = require('assert');

const RevitLocalConnector = require('../js/revit-local-connector.js');
const RevitMCPAdapter = require('../js/revit-mcp-adapter.js');
const RevitBIMAgent = require('../js/revit-bim-agent.js');
const RevitWorksharingSafety = require('../js/revit-worksharing-safety.js');
const RevitTransactionSandbox = require('../js/revit-transaction-sandbox.js');

console.log('================================================================');
console.log('⚡ TESTES DE REVIT MCP + BIM AGENT + SAFETY + QA (BLOCO J: J27 → J31)');
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
    // Inicialização do Conector Virtual com Mock de Alta Fidelidade
    const connector = new RevitLocalConnector({ useVirtualDriver: true });
    await connector.connect();

    // -------------------------------------------------------------------------
    // 1. J27 — REVIT MCP BRIDGE
    // -------------------------------------------------------------------------
    console.log('\n--- 1. J27: Revit MCP Bridge (Categorias, Ferramentas, Permissões) ---');

    const mcpAdapter = new RevitMCPAdapter(connector, { debug: false });

    test('J27.1: Descoberta e Listagem de Ferramentas MCP (Tool Discovery)', () => {
        const tools = mcpAdapter.listTools();
        assert.ok(tools.length >= 12, 'Deve expor pelo menos 12 ferramentas padronizadas');
        
        const toolNames = tools.map(t => t.name);
        assert.ok(toolNames.includes('revit.get_project_info'));
        assert.ok(toolNames.includes('revit.query_elements'));
        assert.ok(toolNames.includes('revit.get_rooms'));
        assert.ok(toolNames.includes('revit.create_view'));
        assert.ok(toolNames.includes('revit.create_sheet'));
        assert.ok(toolNames.includes('revit.set_parameter'));
        assert.ok(toolNames.includes('revit.modify_element'));
        assert.ok(toolNames.includes('revit.export'));
        assert.ok(toolNames.includes('revit.validate'));
    });

    test('J27.2: Filtro de Ferramentas por Categoria e Permissão', () => {
        const queryTools = mcpAdapter.listTools({ category: 'QUERY' });
        assert.ok(queryTools.length >= 2, 'Deve encontrar ferramentas na categoria QUERY');
        assert.strictEqual(queryTools[0].permission, 'READ_ONLY');

        const writeTools = mcpAdapter.listTools({ category: 'WRITE' });
        assert.ok(writeTools.length >= 2, 'Deve encontrar ferramentas na categoria WRITE');
    });

    await testAsync('J27.3: Execução de Ferramenta de Leitura via callTool (Formato MCP)', async () => {
        const result = await mcpAdapter.callTool('revit.get_project_info', {});
        assert.strictEqual(result.isError, false);
        assert.ok(Array.isArray(result.content));
        assert.strictEqual(result.content[0].type, 'text');

        const parsed = JSON.parse(result.content[0].text);
        assert.strictEqual(parsed.success, true);
        assert.ok(parsed.data.title.includes('Residência'));
    });

    await testAsync('J27.4: Execução de Consulta Paramétrica (revit.query_elements)', async () => {
        const result = await mcpAdapter.callTool('revit.query_elements', { category: 'Doors' });
        assert.strictEqual(result.isError, false);
        const parsed = JSON.parse(result.content[0].text);
        assert.strictEqual(parsed.success, true);
        assert.ok(parsed.data.items.length > 0);
        assert.strictEqual(parsed.data.items[0].category, 'Doors');
    });

    await testAsync('J27.5: Bloqueio de Operação Sensível sem Autorização', async () => {
        const result = await mcpAdapter.callTool('revit.modify_element', {
            elementId: 101,
            newFamilyType: 'Janela Pivotante'
        }, { authorized: false });

        assert.strictEqual(result.isError, true);
        assert.ok(result.content[0].text.includes('requer autorização explícita'));
    });

    // -------------------------------------------------------------------------
    // 2. J28 — BIM AGENT ESPECIALISTA EM REVIT
    // -------------------------------------------------------------------------
    console.log('\n--- 2. J28: Revit BIM Agent (Pipeline de 8 Estágios & Raciocínio) ---');

    const bimAgent = new RevitBIMAgent(connector, mcpAdapter, { debug: false });

    await testAsync('J28.1: Pipeline de Consulta: "Mostre todas as portas do pavimento superior"', async () => {
        const execution = await bimAgent.processUserRequest('Mostre todas as portas do pavimento superior');
        assert.strictEqual(execution.status, 'COMPLETED');
        assert.ok(execution.steps.length >= 4);

        const understandStep = execution.steps.find(s => s.stage === 'UNDERSTAND');
        assert.strictEqual(understandStep.data.category, 'Doors');
        assert.ok(understandStep.data.level.includes('02') || understandStep.data.level.includes('Superior'));

        const queryStep = execution.steps.find(s => s.stage === 'QUERY_BIM');
        assert.ok(queryStep.data.elements.length > 0);
    });

    await testAsync('J28.2: Pipeline com Modificação: "Troque estas janelas pela família X" (Preview e Confirmação)', async () => {
        const execution = await bimAgent.processUserRequest('Troque estas janelas pela família Janela Acústica 1.20x1.20m');
        assert.strictEqual(execution.status, 'WAITING_APPROVAL');

        const previewStep = execution.steps.find(s => s.stage === 'PREVIEW');
        assert.ok(previewStep.data.changeset);
        assert.strictEqual(previewStep.data.riskLevel, 'L4_SENSITIVE_WRITE');

        // Confirmação com Token de Aprovação
        const finalExec = await bimAgent.approveAndExecute(execution.executionId, 'user_approval_token_123');
        assert.strictEqual(finalExec.status, 'COMPLETED');
        
        const verifyStep = finalExec.steps.find(s => s.stage === 'VERIFY');
        assert.strictEqual(verifyStep.data.verificationStatus, 'VERIFIED');
    });

    await testAsync('J28.3: Pipeline de Criação de Prancha com Vistas', async () => {
        const execution = await bimAgent.processUserRequest('Crie uma prancha com as vistas da residência');
        assert.strictEqual(execution.status, 'WAITING_APPROVAL');

        const planStep = execution.steps.find(s => s.stage === 'PLAN');
        assert.ok(planStep.data.selectedViews.length > 0);

        const finalExec = await bimAgent.approveAndExecute(execution.executionId, 'token_sheet_a1');
        assert.strictEqual(finalExec.status, 'COMPLETED');
        assert.strictEqual(finalExec.result.sheetNumber, 'A101');
    });

    // -------------------------------------------------------------------------
    // 3. J29 — REVIT WORKSHARING + COLLABORATION SAFETY
    // -------------------------------------------------------------------------
    console.log('\n--- 3. J29: Revit Worksharing + Collaboration Safety ---');

    const worksharingSafety = new RevitWorksharingSafety(connector, {
        currentUser: 'Arquiteto Lider'
    });

    test('J29.1: Detecção de Estado de Compartilhamento e Modo de Colaboração', () => {
        const status = worksharingSafety.getWorksharingStatus();
        assert.strictEqual(status.isWorkshared, true);
        assert.strictEqual(status.collaborationMode, 'CLOUD_WORKSHARED');
        assert.strictEqual(status.activeWorkset, 'ARQ_Arquitetura_Principal');
    });

    test('J29.2: Validação de Editabilidade: Elemento Livre / Próprio', () => {
        const check = worksharingSafety.checkElementEditable(101); // ID padrão desimpedido
        assert.strictEqual(check.isEditable, true);
        assert.strictEqual(check.status, 'EDITABLE');
    });

    test('J29.3: Bloqueio Estrito: Elemento Emprestado por Outro Usuário (ELEMENT_NOT_EDITABLE)', () => {
        const check = worksharingSafety.checkElementEditable(20419); // Bloqueado pelo Eng. Roberto
        assert.strictEqual(check.isEditable, false);
        assert.strictEqual(check.code, 'ELEMENT_NOT_EDITABLE');
        assert.strictEqual(check.owner, 'Eng. Roberto');
        assert.ok(check.message.includes('bloqueado ou emprestado'));
    });

    test('J29.4: Política de Sincronização com Central (Proibição Automática sem Política Explícita)', () => {
        // Tentativa de Sync silencioso / não autorizado
        const syncAttempt = worksharingSafety.requestSyncWithCentral({ force: false, authorized: false });
        assert.strictEqual(syncAttempt.allowed, false);
        assert.strictEqual(syncAttempt.code, 'SYNC_REQUIRES_EXPLICIT_USER_CONFIRMATION');

        // Tentativa com autorização humana explícita
        const authorizedSync = worksharingSafety.requestSyncWithCentral({
            authorized: true,
            compactCentralModel: true,
            saveLocalBeforeSync: true
        });
        assert.strictEqual(authorizedSync.allowed, true);
        assert.strictEqual(authorizedSync.status, 'SYNC_QUEUED');
    });

    // -------------------------------------------------------------------------
    // 4. J30 — REVIT SAFETY + TRANSACTION SANDBOX
    // -------------------------------------------------------------------------
    console.log('\n--- 4. J30: Revit Safety + Transaction Sandbox ---');

    const sandbox = new RevitTransactionSandbox(connector, { debug: false });

    test('J30.1: Estado Inicial Padrão no Nível L0 (READ)', () => {
        assert.strictEqual(sandbox.currentLevel.code, 'L0');
        assert.strictEqual(sandbox.isOperationAllowed('L0'), true);
        assert.strictEqual(sandbox.isOperationAllowed('L4'), false);
    });

    test('J30.2: Proposta em L2 (Changeset Preview sem Efeito Colateral)', () => {
        const changeset = sandbox.createChangeSet({
            description: 'Troca de esquadrias da fachada sul',
            affectedElements: [1001, 1002, 1003],
            oldValues: { family: 'Janela Fixa 1.00m' },
            newValues: { family: 'Janela Maxim-ar 1.20m' },
            riskLevel: 'L4'
        });

        assert.strictEqual(changeset.status, 'PREVIEW');
        assert.strictEqual(changeset.affectedCount, 3);
        assert.strictEqual(changeset.requiresApproval, true);
    });

    await testAsync('J30.3: Execução de Transação com Validação de Status Real da Revit API', async () => {
        // Simulação de transação validando Committed
        const txResult = await sandbox.executeTransaction({
            name: 'Atualizar Comentários das Portas',
            level: 'L3_REVERSIBLE_WRITE',
            action: async () => {
                return { elementId: 401, updated: true, revitStatus: 'Committed' };
            }
        });

        assert.strictEqual(txResult.success, true);
        assert.strictEqual(txResult.revitTransactionStatus, 'Committed');
    });

    await testAsync('J30.4: Falha Geométrica e Rollback Atômico com Relatório de Falha', async () => {
        // Simulação de transação que aciona Rollback na Revit API
        const txResult = await sandbox.executeTransaction({
            name: 'Criar Parede com Cota Negativa Inválida',
            level: 'L4_SENSITIVE_WRITE',
            approvedToken: 'approval_token_user_confirmed',
            action: async () => {
                const err = new Error('Revit API Failure: Element overlaps completely with host wall.');
                err.revitStatus = 'RolledBack';
                err.severity = 'DocumentError';
                throw err;
            }
        });

        assert.strictEqual(txResult.success, false);
        assert.strictEqual(txResult.revitTransactionStatus, 'RolledBack');
        assert.ok(txResult.failureReport);
        assert.strictEqual(txResult.failureReport.rollbackExecuted, true);
        assert.ok(txResult.failureReport.error.includes('Element overlaps'));
    });

    // -------------------------------------------------------------------------
    // 5. J31 — REVIT BIM QA & FINAL ACCEPTANCE LOOP
    // -------------------------------------------------------------------------
    console.log('\n--- 5. J31: Revit BIM QA & Aceitação Final (Loop Completo) ---');

    await testAsync('J31.1: Teste de Carga e Paginação com Grande Quantidade de Elementos', async () => {
        // Simula modelo BIM com paginação de 15.000 elementos
        const pagedQuery = await connector.queryElementsPaged({
            category: 'AllElements',
            pageSize: 1000,
            page: 1
        });

        assert.strictEqual(pagedQuery.page, 1);
        assert.strictEqual(pagedQuery.pageSize, 1000);
        assert.ok(pagedQuery.totalElements >= 10000, 'Deve registrar contagem de modelo grande');
        assert.ok(pagedQuery.items.length === 1000);
        assert.ok(pagedQuery.queryLatencyMs < 100, 'Latência de consulta de página em memória deve ser < 100ms');
    });

    await testAsync('J31.2: Loop Completo de Aceitação Final (CONNECT ➔ READ ➔ UNDERSTAND ➔ QUERY ➔ PROPOSE ➔ EDIT ➔ VALIDATE ➔ ROLLBACK)', async () => {
        // A. CONNECT
        assert.strictEqual(connector.isConnected, true);

        // B. READ & C. UNDERSTAND
        const readInfo = await connector.getProjectInfo();
        assert.ok(readInfo.title);

        const agentExecution = await bimAgent.processUserRequest('Troque o tipo da porta da suíte master');
        assert.ok(agentExecution.steps.find(s => s.stage === 'UNDERSTAND'));

        // D. QUERY
        const queryStep = agentExecution.steps.find(s => s.stage === 'QUERY_BIM');
        assert.ok(queryStep);

        // E. PROPOSE
        const previewStep = agentExecution.steps.find(s => s.stage === 'PREVIEW');
        assert.ok(previewStep.data.changeset);

        // F. EDIT (com aprovação)
        const executed = await bimAgent.approveAndExecute(agentExecution.executionId, 'valid_auth_token');
        assert.strictEqual(executed.status, 'COMPLETED');

        // G. VALIDATE
        const validation = await mcpAdapter.callTool('revit.validate', { scope: 'Selection' });
        assert.strictEqual(validation.isError, false);

        // H. ROLLBACK (Verificação de reversibilidade do Sandbox)
        const rollbackReport = await sandbox.rollbackLastTransaction();
        assert.strictEqual(rollbackReport.status, 'ROLLED_BACK');
        assert.ok(rollbackReport.transactionId);
    });

    console.log('\n================================================================');
    console.log(`🎉 TODOS OS ${passedTests} TESTES DE REVIT MCP + BIM AGENT + SAFETY + QA PASSARAM COM SUCESSO!`);
    console.log('================================================================');
})();
