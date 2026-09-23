/**
 * Test Suite: J41/J42 ArqVértice Multi-Agent 3D Workflow & MCP Router
 */

const assert = require('assert');
const ArqVertice3DAgentRouter = require('../js/3d-agent-router.js');

console.log('🧪 Iniciando testes do J41/J42 — Multi-Agent 3D Workflow & MCP Router...\n');

// 1. Teste dos Especialistas Selecionados (The Agency)
console.log('Test 1: Catálogo de especialistas selecionados...');
const agents = ArqVertice3DAgentRouter.SPECIALIST_AGENTS;
assert.ok(agents['3d-scene-developer'], '3D & Scene Developer deve existir');
assert.ok(agents['technical-artist'], 'Technical Artist deve existir');
assert.ok(agents['bim-gis-specialist'], 'BIM/GIS Specialist deve existir');
assert.ok(agents['ai-engineer'], 'AI Engineer deve existir');
assert.ok(agents['prompt-engineer'], 'Prompt Engineer deve existir');
assert.ok(agents['software-architect'], 'Software Architect deve existir');
assert.ok(agents['frontend-developer'], 'Frontend Developer deve existir');
assert.ok(agents['backend-architect'], 'Backend Architect deve existir');
assert.ok(agents['mcp-builder'], 'MCP Builder deve existir');
assert.ok(agents['agents-orchestrator'], 'Agents Orchestrator deve existir');
assert.ok(agents['workflow-architect'], 'Workflow Architect deve existir');
assert.ok(agents['research-synthesist'], 'Research Synthesist deve existir');
assert.ok(agents['reality-checker'], 'Reality Checker deve existir');
assert.ok(agents['evidence-collector'], 'Evidence Collector deve existir');
assert.ok(agents['performance-benchmarker'], 'Performance Benchmarker deve existir');
assert.ok(agents['code-reviewer'], 'Code Reviewer deve existir');
assert.ok(agents['ai-code-security-auditor'], 'AI-Generated Code Security Auditor deve existir');
console.log(`  ✅ Todos os ${Object.keys(agents).length} especialistas do catálogo The Agency validados.`);

// 2. Teste da Camada de Model Routing
console.log('\nTest 2: Tiers de Roteamento de Modelos de IA...');
const tiers = ArqVertice3DAgentRouter.MODEL_TIERS;
assert.ok(tiers.LOCAL, 'Tier LOCAL (Ollama) deve existir');
assert.ok(tiers.FREE, 'Tier FREE deve existir');
assert.ok(tiers.STUDENT, 'Tier STUDENT deve existir');
assert.ok(tiers.PAID, 'Tier PAID (Astra/Fable) deve existir');
assert.strictEqual(tiers.LOCAL.provider, 'Ollama');

const specialized3D = ArqVertice3DAgentRouter.SPECIALIZED_3D_MODELS;
assert.ok(specialized3D.TRELLIS_2, 'TRELLIS.2 deve estar registrado como modelo 3D dedicado');
assert.ok(specialized3D.SAM_3D, 'SAM 3D deve estar registrado como modelo 3D dedicado');
console.log('  ✅ Tiers de IA (LOCAL, FREE, STUDENT, PAID) e modelos 3D (TRELLIS.2, SAM 3D) validados.');

// 3. Teste do Registro MCP (Model Context Protocol)
console.log('\nTest 3: Registro de Servidores e Ferramentas MCP...');
const { MCPRegistry } = ArqVertice3DAgentRouter;
const mcp = new MCPRegistry();
const serverList = mcp.listServers();
assert.ok(serverList.some(s => s.id === 'filesystem'), 'MCP filesystem deve existir');
assert.ok(serverList.some(s => s.id === 'bim'), 'MCP bim deve existir');
assert.ok(serverList.some(s => s.id === 'revit'), 'MCP revit deve existir');
assert.ok(serverList.some(s => s.id === 'asset_processing'), 'MCP asset_processing deve existir');
assert.ok(mcp.hasTool('bim', 'parse_ifc'), 'MCP bim deve conter a ferramenta parse_ifc');
console.log(`  ✅ Registro MCP com ${serverList.length} servidores essenciais configurado.`);

// 4. Teste de Fluxo: "Analise meu modelo 3D"
console.log('\nTest 4: Fluxo de Análise de Modelo 3D...');
const router = new ArqVertice3DAgentRouter({ projectId: 'prj-test-j41' });
const analysisTask = 'Analise meu modelo 3D para otimização';
const analysisClass = router.classifyTask(analysisTask);

assert.strictEqual(analysisClass.intent, 'SCENE_ANALYSIS');
assert.strictEqual(analysisClass.primaryAgent.id, '3d-scene-developer');
assert.ok(analysisClass.collaboratingAgents.some(a => a.id === 'technical-artist'));
assert.ok(analysisClass.collaboratingAgents.some(a => a.id === 'reality-checker'));
console.log('  ✅ Classificação e atribuição de especialistas para "Analise meu modelo 3D" validadas.');

// 5. Teste de Fluxo: "Encontre todos os materiais de madeira"
console.log('\nTest 5: Fluxo de Busca Semântica de Materiais...');
const searchTask = 'Encontre todos os materiais de madeira no projeto';
const searchClass = router.classifyTask(searchTask);

assert.strictEqual(searchClass.intent, 'SEMANTIC_SEARCH');
assert.strictEqual(searchClass.primaryAgent.id, 'research-synthesist');
console.log('  ✅ Atribuição do Research Synthesist e busca semântica validadas.');

// 6. Teste de Fluxo: "Substitua o piso da sala"
console.log('\nTest 6: Fluxo de Modificação Determinística de Material...');
const modTask = 'Substitua o piso da sala por madeira nobre';
const modClass = router.classifyTask(modTask);

assert.strictEqual(modClass.intent, 'MATERIAL_MODIFICATION');
assert.strictEqual(modClass.primaryAgent.id, '3d-scene-developer');
assert.ok(modClass.collaboratingAgents.some(a => a.id === 'evidence-collector'));
console.log('  ✅ Atribuição e preparação de ChangeSet para modificação de piso validadas.');

// 7. Teste de Execução Completa e Log de Auditoria Seguro (Sem Secrets)
console.log('\nTest 7: Execução determinística e AuditLogger seguro...');
(async () => {
    const execResult = await router.executeTask(modTask);
    assert.strictEqual(execResult.success, true);
    assert.strictEqual(execResult.intent, 'MATERIAL_MODIFICATION');
    assert.ok(execResult.agentsEngaged.includes('3D & Scene Developer'));
    assert.strictEqual(execResult.result.status, 'APPLIED');

    // Validar Audit Log
    const recentLogs = router.auditLogger.getRecentLogs();
    assert.ok(recentLogs.length >= 1, 'Deve conter entrada no log de auditoria');
    const lastLog = recentLogs[recentLogs.length - 1];
    assert.strictEqual(lastLog.validation.passed, true);
    assert.strictEqual(lastLog.validation.realityCheck, 'OK');

    // Validar Sanitização de Secrets
    const sanitizedCheck = ArqVertice3DAgentRouter.AuditLogger.sanitizeData({
        apiKey: 'sk-ant-api03-abcdef1234567890',
        bearer: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token123',
        safeParam: 'Sala de Estar'
    });
    assert.strictEqual(sanitizedCheck.apiKey, '[REDACTED]');
    assert.strictEqual(sanitizedCheck.bearer, '[REDACTED]');
    assert.strictEqual(sanitizedCheck.safeParam, 'Sala de Estar');
    console.log('  ✅ AuditLogger gravou execução e mascarou credenciais sensíveis ([REDACTED]).');

    console.log('\n🎉 TODOS OS TESTES DO J41/J42 MULTI-AGENT 3D WORKFLOW PASSARAM COM SUCESSO!\n');
})();
