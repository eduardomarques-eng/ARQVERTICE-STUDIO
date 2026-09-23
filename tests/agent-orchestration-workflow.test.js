/**
 * ============================================================================
 * ARQVERTICE STUDIO — SUÍTE DE TESTES: AGENT ORCHESTRATION & WORKFLOWS (I14 / I15)
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

function runTest(description, testFn) {
  try {
    testFn();
    console.log(`  ✔ [PASS] ${description}`);
    return true;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${description}`);
    console.error(`     Motivo: ${err.message}`);
    return false;
  }
}

console.log('================================================================');
console.log('SUÍTE DE TESTES: AGENTES, COMMAND CENTER & WORKFLOW ENGINE (I14 / I15)');
console.log('================================================================\n');

let passedCount = 0;
let totalCount = 0;

const rootDir = path.resolve(__dirname, '..');
const orchestratorCode = fs.readFileSync(path.join(rootDir, 'js', 'agent-orchestrator.js'), 'utf8');
const workflowCode = fs.readFileSync(path.join(rootDir, 'js', 'workflow-engine.js'), 'utf8');

const mockGlobal = {};
new Function('global', 'window', orchestratorCode)(mockGlobal, mockGlobal);
new Function('global', 'window', workflowCode)(mockGlobal, mockGlobal);

const CommandType = mockGlobal.CommandType;
const AgentRole = mockGlobal.AgentRole;
const AgentContracts = mockGlobal.AgentContracts;
const CommandCenterParser = mockGlobal.CommandCenterParser;
const AgentOrchestrator = mockGlobal.AgentOrchestrator;
const TriggerType = mockGlobal.TriggerType;
const FailurePolicy = mockGlobal.FailurePolicy;
const WorkflowEngine = mockGlobal.WorkflowEngine;

// --- 1. Classificação dos 9 Tipos de Comandos (I14) ---
console.log('--- 1. Classificação dos 9 Tipos de Comandos (I14) ---');

const commandTests = [
  { text: 'quais ambientes existem?', expectedType: CommandType.QUERY },
  { text: 'analise o layout da sala', expectedType: CommandType.ANALYZE },
  { text: 'criar novo projeto', expectedType: CommandType.CREATE },
  { text: 'atualizar pé-direito para 3m', expectedType: CommandType.TRANSFORM },
  { text: 'comparar estudos preliminares', expectedType: CommandType.COMPARE },
  { text: 'validar conformidade com NBR 6492', expectedType: CommandType.VALIDATE },
  { text: 'ir para o cronograma', expectedType: CommandType.NAVIGATE },
  { text: 'automatizar fechamento de fase', expectedType: CommandType.AUTOMATE },
  { text: 'exportar relatório executivo', expectedType: CommandType.EXPORT }
];

commandTests.forEach(ct => {
  totalCount++;
  if (runTest(`Classifica comando "${ct.text}" como ${ct.expectedType}`, () => {
    const res = CommandCenterParser.classify(ct.text);
    if (res.type !== ct.expectedType) {
      throw new Error(`Esperado ${ct.expectedType}, obtido ${res.type}`);
    }
  })) passedCount++;
});

// --- 2. Contratos dos 5 Agentes e Permissões de Ferramentas ---
console.log('\n--- 2. Contratos dos 5 Agentes & Permissões de Ferramentas ---');

const expectedRoles = [
  AgentRole.PLANNER,
  AgentRole.DECISION,
  AgentRole.SPECIALIST,
  AgentRole.EXECUTOR,
  AgentRole.VALIDATOR
];

expectedRoles.forEach(role => {
  totalCount++;
  if (runTest(`Contrato do agente "${role}" declara purpose, allowedTools e forbiddenTools`, () => {
    const contract = AgentContracts[role];
    if (!contract || !contract.purpose || !Array.isArray(contract.allowedTools) || !Array.isArray(contract.forbiddenTools)) {
      throw new Error(`Contrato incompleto para ${role}`);
    }
    if (!contract.permissions) {
      throw new Error(`Permissões ausentes para ${role}`);
    }
  })) passedCount++;
});

// --- 3. Geração e Execução de ExecutionPlan ---
console.log('\n--- 3. Geração e Execução de ExecutionPlan ---');

totalCount++;
if (runTest('AgentOrchestrator gera ExecutionPlan estruturado em múltiplos passos', () => {
  const plan = AgentOrchestrator.createExecutionPlan('analise a coerência da planta baixa');
  if (!plan || plan.status !== 'PLANNED' || !Array.isArray(plan.steps) || plan.steps.length === 0) {
    throw new Error('Plano de execução não gerado adequadamente.');
  }
})) passedCount++;

totalCount++;
if (runTest('AgentOrchestrator executa plano passo a passo com status COMPLETED', async () => {
  const plan = AgentOrchestrator.createExecutionPlan('auditar conformidade');
  const result = await AgentOrchestrator.executePlan(plan);
  if (result.status !== 'COMPLETED' || result.results.length === 0) {
    throw new Error(`Execução falhou com status: ${result.status}`);
  }
})) passedCount++;

totalCount++;
if (runTest('Human Override interrompe execução graciosa de plano ativo', async () => {
  const plan = AgentOrchestrator.createExecutionPlan('tarefa longa');
  AgentOrchestrator.humanOverrideInterrupt();
  const res = await AgentOrchestrator.executePlan(plan);
  if (res.status !== 'INTERRUPTED_BY_USER') {
    throw new Error('Human override não interrompeu a execução.');
  }
})) passedCount++;

// --- 4. Workflow Engine & Automação Segura (I15) ---
console.log('\n--- 4. Workflow Engine & Automação Segura (I15) ---');

totalCount++;
if (runTest('WorkflowEngine executa modo DryRun sem mutação de estado', async () => {
  const res = await WorkflowEngine.runWorkflow('BATCH_SHEET_EXPORT', {}, { dryRun: true });
  if (res.status !== 'DRY_RUN_COMPLETED' || !res.isDryRun) {
    throw new Error('Dry run não completou com status esperado.');
  }
  if (!res.stepsExecuted[0].output.simulated) {
    throw new Error('Dry run deveria marcar saída como simulada.');
  }
})) passedCount++;

totalCount++;
if (runTest('WorkflowEngine bloqueia etapa que requer aprovação humana se não autorizada', async () => {
  const res = await WorkflowEngine.runWorkflow('STAGE_COMPLETION_CHECK', {}, { userApproved: false });
  if (res.status !== 'WAITING_HUMAN_APPROVAL') {
    throw new Error(`Esperado WAITING_HUMAN_APPROVAL, obtido: ${res.status}`);
  }
})) passedCount++;

totalCount++;
if (runTest('WorkflowEngine executa Rollback automático em caso de falha de etapa', async () => {
  let rollbackCalled = false;
  WorkflowEngine.registerWorkflow({
    id: 'TEST_FAIL_WORKFLOW',
    name: 'Workflow de Teste com Falha',
    failurePolicy: FailurePolicy.ROLLBACK,
    steps: [
      {
        id: 'step-1',
        name: 'Criação Temporária',
        run: () => ({ created: true }),
        rollback: () => { rollbackCalled = true; }
      },
      {
        id: 'step-2',
        name: 'Etapa com Erro',
        run: () => { throw new Error('Falha proposital de teste.'); }
      }
    ]
  });

  const res = await WorkflowEngine.runWorkflow('TEST_FAIL_WORKFLOW', {});
  if (res.status !== 'FAILED' || !res.rollbackExecuted || !rollbackCalled) {
    throw new Error('Rollback não foi executado após falha.');
  }
})) passedCount++;

totalCount++;
if (runTest('WorkflowEngine garante idempotência para execuções com mesmo payload', async () => {
  const input = { projectCode: 'PRJ-IDEMP-01' };
  const first = await WorkflowEngine.runWorkflow('BATCH_SHEET_EXPORT', input);
  const second = await WorkflowEngine.runWorkflow('BATCH_SHEET_EXPORT', input);

  if (!second.idempotentReplay) {
    throw new Error('Segunda execução com mesmo input não foi identificada como idempotente.');
  }
})) passedCount++;

console.log('\n================================================================');
console.log(`TOTAL DE TESTES ORQUESTRAÇÃO & WORKFLOW: ${totalCount}`);
console.log(`PASSOU: ${passedCount}`);
console.log(`FALHOU: ${totalCount - passedCount}`);
console.log('================================================================\n');

if (passedCount !== totalCount) {
  process.exit(1);
}
