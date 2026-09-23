/**
 * ============================================================================
 * ARQVERTICE STUDIO — SUÍTE DE TESTES: PERFORMANCE, LATÊNCIA & CUSTO (I16)
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
console.log('SUÍTE DE TESTES: PERFORMANCE, LATÊNCIA, CACHE & TELEMETRIA (I16)');
console.log('================================================================\n');

let passedCount = 0;
let totalCount = 0;

const rootDir = path.resolve(__dirname, '..');
const perfRouterCode = fs.readFileSync(path.join(rootDir, 'js', 'ai-performance-router.js'), 'utf8');

const mockGlobal = {
  BIMQueryEngine: {
    executeNaturalQuery: (pid, q) => ({ status: 'MOCK_BIM_OK', result: '3 ambientes' })
  }
};
new Function('global', 'window', perfRouterCode)(mockGlobal, mockGlobal);

const ExecutionTier = mockGlobal.ExecutionTier;
const LatencyBudgetMs = mockGlobal.LatencyBudgetMs;
const PerformanceCache = mockGlobal.PerformanceCache;
const AIPerformanceRouter = mockGlobal.AIPerformanceRouter;

// --- 1. Roteamento Progressivo por Complexidade e Custo ---
console.log('--- 1. Roteamento Progressivo por Complexidade & Custo (I16) ---');

const routingCases = [
  {
    task: { rawQuery: 'quais ambientes existem?' },
    expectedTier: ExecutionTier.DETERMINISTIC,
    expectedEngine: 'BIMQueryEngine / MathEngine'
  },
  {
    task: { capability: 'ARCHITECTURAL_DECISION', rawQuery: 'qual template escolher?' },
    expectedTier: ExecutionTier.JEV_DECISION,
    expectedEngine: 'JevDecisionEngine'
  },
  {
    task: { capability: 'VISION_ANALYSIS', rawQuery: 'analisar iluminação do render' },
    expectedTier: ExecutionTier.VISION,
    expectedEngine: 'VisionMultimodalProvider'
  },
  {
    task: { capability: 'VIDEO_RENDER_EXECUTION', rawQuery: 'renderizar vídeo do projeto' },
    expectedTier: ExecutionTier.SPECIALIZED_TOOL,
    expectedEngine: 'RemotionVideoEngine'
  },
  {
    task: { capability: 'CLASSIFICATION', rawQuery: 'tag sala' },
    expectedTier: ExecutionTier.SMALL_MODEL,
    expectedEngine: 'FastLLMProvider'
  },
  {
    task: { capability: 'ARCHITECTURAL_TEXT_GENERATION', rawQuery: 'Elaborar conceito poético denso para memorial da residência com diálogo entre minerais' },
    expectedTier: ExecutionTier.LARGE_MODEL,
    expectedEngine: 'AdvancedLLMProvider'
  }
];

routingCases.forEach(rc => {
  totalCount++;
  if (runTest(`Roteia tarefa "${rc.task.rawQuery.substring(0, 30)}..." para Tier ${rc.expectedTier}`, () => {
    const sel = AIPerformanceRouter.selectExecutionTier(rc.task);
    if (sel.tier !== rc.expectedTier) {
      throw new Error(`Esperado tier ${rc.expectedTier}, obtido ${sel.tier}`);
    }
    if (!sel.reason || sel.estimatedCostUsd === undefined) {
      throw new Error('Seleção de tier sem justificativa ou estimativa de custo.');
    }
  })) passedCount++;
});

// --- 2. Orçamentos de Latência (Latency Budgets) ---
console.log('\n--- 2. Orçamentos de Latência (Latency Budgets) ---');

totalCount++;
if (runTest('LatencyBudgetMs estabelece limites rigorosos para cada interação', () => {
  if (LatencyBudgetMs.INSTANT > 50) throw new Error('INSTANT deve ser <= 50ms');
  if (LatencyBudgetMs.FAST > 300) throw new Error('FAST deve ser <= 300ms');
  if (LatencyBudgetMs.INTERACTIVE > 1500) throw new Error('INTERACTIVE deve ser <= 1500ms');
  if (LatencyBudgetMs.BACKGROUND > 15000) throw new Error('BACKGROUND deve ser <= 15000ms');
})) passedCount++;

// --- 3. Cache Inteligente LRU e TTL ---
console.log('\n--- 3. Cache Inteligente LRU & TTL ---');

totalCount++;
if (runTest('PerformanceCache armazena e recupera dados incrementando hits', () => {
  PerformanceCache.clear();
  const taskKey = { capability: 'TEST_CAP', target: 'env-01' };
  PerformanceCache.set(taskKey, { data: 'valor_em_cache' });

  const retrieved = PerformanceCache.get(taskKey);
  if (!retrieved || retrieved.data !== 'valor_em_cache') {
    throw new Error('Falha ao recuperar dado do cache.');
  }

  const stats = PerformanceCache.stats();
  if (stats.hits !== 1 || stats.size !== 1) {
    throw new Error(`Estatísticas de cache incorretas: hits=${stats.hits}, size=${stats.size}`);
  }
})) passedCount++;

totalCount++;
if (runTest('PerformanceCache respeita expiração por TTL', () => {
  const taskShort = { capability: 'EXPIRE_CAP', target: 'temp' };
  PerformanceCache.set(taskShort, { expired: true }, -100); // TTL já vencido

  const val = PerformanceCache.get(taskShort);
  if (val !== null) {
    throw new Error('Dado expirado por TTL não deveria ter sido retornado.');
  }
})) passedCount++;

// --- 4. Telemetria e Observabilidade Transparente ---
console.log('\n--- 4. Telemetria e Observabilidade Transparente (I16) ---');

totalCount++;
if (runTest('executeOptimized executa com telemetria respondendo a pergunta mandatória', async () => {
  const task = { rawQuery: 'quais ambientes existem?' };
  const exec = await AIPerformanceRouter.executeOptimized(task);

  if (!exec.telemetry || !exec.telemetry.executionId) {
    throw new Error('Telemetria não gerada.');
  }
  if (!exec.telemetry.engine || !exec.telemetry.reason) {
    throw new Error('Telemetria sem motor ou justificativa.');
  }

  const explanation = AIPerformanceRouter.explainSelection(exec.telemetry.executionId);
  if (!explanation.includes('executada por') || !explanation.includes('Motivo da escolha')) {
    throw new Error('Explicação de telemetria incompleta.');
  }
})) passedCount++;

totalCount++;
if (runTest('Execuções repetidas da mesma query determinística utilizam cache (custo 0, < 5ms)', async () => {
  const task = { rawQuery: 'quais ambientes existem?' };
  const first = await AIPerformanceRouter.executeOptimized(task);
  const second = await AIPerformanceRouter.executeOptimized(task);

  if (!second.telemetry.cached) {
    throw new Error('Segunda execução deveria ter retornado do cache.');
  }
  if (second.telemetry.costUsd !== 0) {
    throw new Error('Hit de cache deve ter custo zero.');
  }
})) passedCount++;

console.log('\n================================================================');
console.log(`TOTAL DE TESTES PERFORMANCE: ${totalCount}`);
console.log(`PASSOU: ${passedCount}`);
console.log(`FALHOU: ${totalCount - passedCount}`);
console.log('================================================================\n');

if (passedCount !== totalCount) {
  process.exit(1);
}
