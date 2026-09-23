/**
 * tests/ai-foundation.test.js
 * Teste unitário e de integração para a Fundação de IA (I01 / I02) do ArqVértice Studio.
 * Cobre:
 * - AICapability, AIExecutionLevel, AIRoutingPolicy
 * - AITask validação e ciclo de vida
 * - AIRouter registro de capabilities, resolução por política e despacho
 * - Schema validation e tratamento de INVALID_RESULT
 * - Timeout handling e proteção de latência
 * - Fallback transparente com registro de erro primário
 * - AIObservability métricas, custos e histórico de auditoria
 * - Proteção determinística de regras de arquitetura
 */

const assert = require('assert');
const {
  AICapability,
  AIExecutionLevel,
  AIRoutingPolicy,
  AITask,
  AIRouter,
  AIObservability
} = require('../js/ai-foundation.js');

let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✔ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✖ [FAIL] ${name}:`, err.message);
    failedTests++;
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    console.log(`  ✔ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✖ [FAIL] ${name}:`, err.message);
    failedTests++;
  }
}

(async function runAllAITests() {
  console.log('================================================================');
  console.log('SUÍTE DE TESTES: BLOCO I — FUNDAÇÃO DE IA & ROUTER (I01 / I02)');
  console.log('================================================================\n');

  // 1. ENUMS E ESTRUTURAS CANÔNICAS
  console.log('--- 1. Enums e Definições de Arquitetura ---');

  test('AICapability contém todas as capacidades essenciais de arquitetura e audiovisual', () => {
    assert(AICapability.VISUAL_RENDER_GENERATION, 'VISUAL_RENDER_GENERATION deve existir');
    assert(AICapability.VIDEO_PROMPT_GENERATION, 'VIDEO_PROMPT_GENERATION deve existir');
    assert(AICapability.ARCHITECTURAL_DECISION, 'ARCHITECTURAL_DECISION deve existir');
    assert(AICapability.BRIEFING_INTERPRETATION, 'BRIEFING_INTERPRETATION deve existir');
    assert(AICapability.BIM_STRUCTURAL_ANALYSIS, 'BIM_STRUCTURAL_ANALYSIS deve existir');
    assert(AICapability.PRESENTATION_SYNTHESIS, 'PRESENTATION_SYNTHESIS deve existir');
    assert(AICapability.IMAGE_ANALYSIS_VISION, 'IMAGE_ANALYSIS_VISION deve existir');
  });

  test('AIExecutionLevel divide explicitamente DETERMINISTIC, DECISION, GENERATIVE, VISION e HUMAN', () => {
    assert.strictEqual(AIExecutionLevel.DETERMINISTIC, 'DETERMINISTIC');
    assert.strictEqual(AIExecutionLevel.DECISION, 'DECISION');
    assert.strictEqual(AIExecutionLevel.GENERATIVE, 'GENERATIVE');
    assert.strictEqual(AIExecutionLevel.VISION, 'VISION');
    assert.strictEqual(AIExecutionLevel.HUMAN, 'HUMAN');
  });

  test('AIRoutingPolicy possui diretrizes de custo, velocidade e qualidade', () => {
    assert.strictEqual(AIRoutingPolicy.QUALITY, 'QUALITY');
    assert.strictEqual(AIRoutingPolicy.BALANCED, 'BALANCED');
    assert.strictEqual(AIRoutingPolicy.LOW_COST, 'LOW_COST');
    assert.strictEqual(AIRoutingPolicy.FAST, 'FAST');
    assert.strictEqual(AIRoutingPolicy.LOCAL, 'LOCAL');
  });

  // 2. AITASK VALIDAÇÃO
  console.log('\n--- 2. Criação e Validação de AITask ---');

  test('AITask instancia corretamente com ID gerado e defaults de resiliência', () => {
    const task = new AITask({
      capability: AICapability.VISUAL_RENDER_GENERATION,
      payload: { prompt: 'Fachada minimalista em concreto aparente' }
    });

    assert(task.id.startsWith('task_'), 'ID deve ter prefixo task_');
    assert.strictEqual(task.capability, AICapability.VISUAL_RENDER_GENERATION);
    assert.strictEqual(task.timeoutMs, 30000);
    assert.strictEqual(task.preferredPolicy, AIRoutingPolicy.BALANCED);
    assert(task.createdAt, 'Timestamp de criação deve existir');
  });

  test('AITask rejeita instanciação sem capability válida', () => {
    assert.throws(() => {
      new AITask({ payload: { test: 123 } });
    }, /AITask requer a definição explícita de uma capability/);
  });

  // 3. AIROUTER DISPATCH & SCHEMA VALIDATION
  console.log('\n--- 3. Despacho pelo AIRouter e Validação de Schema ---');

  await testAsync('AIRouter executa handler de capability e retorna resultado formatado com metadados', async () => {
    AIRouter.registerCapability('TEST_CAPABILITY', async (task, policy) => {
      return {
        data: { generatedText: `Estudo arquitetônico para ${task.payload.projectName}` },
        provider: 'test-llm',
        model: 'test-model-1',
        tokensUsed: 150,
        estimatedCostUsd: 0.0003
      };
    });

    const task = new AITask({
      capability: 'TEST_CAPABILITY',
      payload: { projectName: 'Residência Terras Altas' },
      outputSchema: {
        required: ['generatedText']
      }
    });

    const result = await AIRouter.dispatch(task);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.generatedText, 'Estudo arquitetônico para Residência Terras Altas');
    assert.strictEqual(result.provider, 'test-llm');
    assert.strictEqual(result.model, 'test-model-1');
    assert.strictEqual(result.fallbackOccurred, false);
    assert(result.metadata.durationMs >= 0, 'Duração deve ser mensurada');
  });

  await testAsync('AIRouter rejeita saídas que violam o outputSchema com INVALID_RESULT', async () => {
    AIRouter.registerCapability('TEST_INVALID_SCHEMA', async () => {
      return {
        data: { incompleteField: 123 }, // falta 'requiredTitle'
        provider: 'test-llm',
        model: 'test-model-1'
      };
    });

    const task = new AITask({
      capability: 'TEST_INVALID_SCHEMA',
      outputSchema: {
        required: ['requiredTitle']
      }
    });

    const result = await AIRouter.dispatch(task);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'INVALID_RESULT');
    assert(result.validationErrors.length > 0, 'Erros de validação devem ser expostos');
    assert(result.validationErrors[0].includes('requiredTitle'), 'Erro deve citar o campo ausente');
  });

  // 4. TIMEOUT HANDLING
  console.log('\n--- 4. Proteção de Latência e Timeout ---');

  await testAsync('AIRouter aciona timeout quando a operação excede o limite estipulado', async () => {
    AIRouter.registerCapability('TEST_TIMEOUT', async () => {
      // Simula lentidão de rede
      await new Promise(resolve => setTimeout(resolve, 80));
      return { data: { success: true }, provider: 'slow-api', model: 'slow-v1' };
    });

    const task = new AITask({
      capability: 'TEST_TIMEOUT',
      timeoutMs: 25 // Limite curto
    });

    let caughtError = false;
    try {
      await AIRouter.dispatch(task);
    } catch (err) {
      caughtError = true;
      assert(err.message.includes('Timeout'), 'Mensagem deve indicar timeout');
    }
    assert(caughtError, 'AIRouter deve rejeitar tarefa que excede timeout');
  });

  // 5. FALLBACK AUTOMÁTICO
  console.log('\n--- 5. Mecanismo de Fallback Transparente ---');

  await testAsync('AIRouter aciona fallback automaticamente quando o primário falha', async () => {
    AIRouter.registerCapability('TEST_FALLBACK_CAPABILITY', async (task) => {
      throw new Error('503 Service Unavailable: Vertex AI temporariamente indisponível');
    });

    const task = new AITask({
      capability: 'TEST_FALLBACK_CAPABILITY',
      fallbackHandler: async (t) => {
        return {
          data: { renderStatus: 'FALLBACK_LOCAL_PREVIEW', imageMockUrl: 'data:image/svg+xml;base64,mock' },
          provider: 'mock-visual',
          model: 'mock-architectural-preview-v1',
          tokensUsed: 0,
          estimatedCostUsd: 0
        };
      }
    });

    const result = await AIRouter.dispatch(task);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.fallbackOccurred, true);
    assert(result.primaryError.includes('503 Service Unavailable'), 'Erro primário deve ser auditado');
    assert.strictEqual(result.provider, 'mock-visual');
    assert.strictEqual(result.data.renderStatus, 'FALLBACK_LOCAL_PREVIEW');
  });

  // 6. HEURISTIC DECIDER BUILT-IN (JEV PREPARATION)
  console.log('\n--- 6. Decisor Heurístico Preparatório para Jev ---');

  await testAsync('AICapability.ARCHITECTURAL_DECISION executa no nível DECISION sem dependência externa', async () => {
    const task = new AITask({
      capability: AICapability.ARCHITECTURAL_DECISION,
      payload: {
        projectId: 'proj_test_01',
        briefingStatus: 'confirmed',
        unresolvedCollisions: 0
      }
    });

    const result = await AIRouter.dispatch(task);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.model, 'jev-decision-foundation-v1');
    assert.strictEqual(result.data.status, 'DECISION_RENDERED');
    assert.strictEqual(result.data.nextStep, 'PROCEED');
  });

  // 7. AIOBSERVABILITY E MÉTRICAS
  console.log('\n--- 7. Barramento de Observabilidade e Custos ---');

  test('AIObservability registra logs de auditoria e calcula métricas agregadas', () => {
    AIObservability.clear();

    AIObservability.logExecution({
      taskId: 'task_001',
      capability: AICapability.VISUAL_RENDER_GENERATION,
      provider: 'gemini-imagen',
      model: 'imagen-3.0-generate-002',
      success: true,
      durationMs: 3200,
      tokensUsed: 0,
      estimatedCostUsd: 0.03
    });

    AIObservability.logExecution({
      taskId: 'task_002',
      capability: AICapability.VIDEO_PROMPT_GENERATION,
      provider: 'gemini-video-prompt',
      model: 'gemini-2.0-flash',
      success: true,
      durationMs: 800,
      tokensUsed: 1200,
      estimatedCostUsd: 0.0004
    });

    AIObservability.logExecution({
      taskId: 'task_003',
      capability: AICapability.VISUAL_RENDER_GENERATION,
      provider: 'gemini-imagen',
      model: 'imagen-3.0-generate-002',
      success: false,
      durationMs: 500,
      error: new Error('Quota exceeded')
    });

    const history = AIObservability.getHistory();
    assert.strictEqual(history.length, 3, 'Histórico deve conter 3 execuções');

    const metrics = AIObservability.getMetrics();
    assert.strictEqual(metrics.totalCalls, 3);
    assert.strictEqual(metrics.successfulCalls, 2);
    assert.strictEqual(metrics.failedCalls, 1);
    assert.strictEqual(metrics.totalTokens, 1200);
    assert(metrics.totalCostUsd > 0.03, 'Custo acumulado deve ser somado corretamente');
    assert(metrics.capabilities[AICapability.VISUAL_RENDER_GENERATION].calls === 2);
  });

  // 8. POLÍTICA DE RESPEITO ÀS REGRAS DETERMINÍSTICAS
  console.log('\n--- 8. Salvaguarda Determinística de Regras de Arquitetura ---');

  test('Operações determinísticas de prancha, escala e cálculos NÃO utilizam IA', () => {
    // Verificação conceitual garantindo que o módulo de IA não sequestre funções determinísticas
    const deterministicOperations = [
      'SCALE_CALCULATION_1_50',
      'SHEET_MARGIN_NBR_6492',
      'MATERIAL_QUANTITY_SUM',
      'PROJECT_STATUS_LIFECYCLE'
    ];

    for (const op of deterministicOperations) {
      assert(
        !Object.values(AICapability).includes(op),
        `Operação determinística '${op}' jamais deve ser catalogada como AICapability.`
      );
    }
  });

  // RELATÓRIO FINAL
  console.log('\n================================================================');
  console.log(`TOTAL DE TESTES: ${passedTests + failedTests}`);
  console.log(`PASSOU: ${passedTests}`);
  console.log(`FALHOU: ${failedTests}`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
})();
