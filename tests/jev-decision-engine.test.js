/**
 * tests/jev-decision-engine.test.js
 * Teste unitário, de integração e benchmark para o Jev Decision Engine (I03).
 * Cobre:
 * - Enums e estruturas canônicas do Jev
 * - Avaliações BOOLEAN, CHOICE e SCORE
 * - Gates de Confiança (HIGH, MEDIUM, LOW) e Políticas de Ação
 * - Tratamento de Erros e Timeouts
 * - Fallback Determinístico Seguro (evaluateWithGate)
 * - Benchmark Comparativo: Regra Determinística vs. Jev
 * - Integração ponta a ponta com AIRouter e AIObservability
 */

const assert = require('assert');
const {
  JevDecisionType,
  JevConfidenceLevel,
  JevActionOutcome,
  JevErrorCode,
  JevDecisionEngineService,
  JevDecisionEngine,
  connectToAIRouter
} = require('../js/jev-decision-engine.js');

const {
  AICapability,
  AIRouter,
  AITask,
  AIObservability
} = require('../js/ai-foundation.js');

// Conecta o JevDecisionEngine ao AIRouter
connectToAIRouter(AIRouter, AICapability);

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

(async function runAllJevTests() {
  console.log('================================================================');
  console.log('SUÍTE DE TESTES: BLOCO I03 — JEV DECISION ENGINE & CONTROL LAYER');
  console.log('================================================================\n');

  // 1. ENUMS E CONTRATOS DO JEV
  console.log('--- 1. Enums e Tipos Canônicos de Decisão ---');

  test('JevDecisionType suporta estritamente BOOLEAN, CHOICE e SCORE', () => {
    assert.strictEqual(JevDecisionType.BOOLEAN, 'BOOLEAN');
    assert.strictEqual(JevDecisionType.CHOICE, 'CHOICE');
    assert.strictEqual(JevDecisionType.SCORE, 'SCORE');
  });

  test('JevConfidenceLevel define HIGH, MEDIUM e LOW', () => {
    assert.strictEqual(JevConfidenceLevel.HIGH, 'HIGH');
    assert.strictEqual(JevConfidenceLevel.MEDIUM, 'MEDIUM');
    assert.strictEqual(JevConfidenceLevel.LOW, 'LOW');
  });

  test('JevActionOutcome possui 4 resoluções de governança', () => {
    assert.strictEqual(JevActionOutcome.AUTO_EXECUTE, 'AUTO_EXECUTE');
    assert.strictEqual(JevActionOutcome.REQUIRE_VALIDATION, 'REQUIRE_VALIDATION');
    assert.strictEqual(JevActionOutcome.REQUIRE_HUMAN_REVIEW, 'REQUIRE_HUMAN_REVIEW');
    assert.strictEqual(JevActionOutcome.FALLBACK_TRIGGERED, 'FALLBACK_TRIGGERED');
  });

  test('JevErrorCode cataloga falhas explícitas sem converter erros em verdade', () => {
    assert(JevErrorCode.JEV_UNAVAILABLE, 'JEV_UNAVAILABLE');
    assert(JevErrorCode.INVALID_REQUEST, 'INVALID_REQUEST');
    assert(JevErrorCode.INVALID_RESPONSE, 'INVALID_RESPONSE');
    assert(JevErrorCode.TIMEOUT, 'TIMEOUT');
    assert(JevErrorCode.LOW_CONFIDENCE, 'LOW_CONFIDENCE');
  });

  // 2. CLASSIFICAÇÃO DE CONFIANÇA E POLÍTICA
  console.log('\n--- 2. Classificação de Confiança e Ação da Política ---');

  test('classifyConfidence categoriza probabilidades corretamente conforme thresholds', () => {
    assert.strictEqual(JevDecisionEngine.classifyConfidence(0.95), JevConfidenceLevel.HIGH);
    assert.strictEqual(JevConfidenceLevel.HIGH, JevDecisionEngine.classifyConfidence(0.85));
    assert.strictEqual(JevDecisionEngine.classifyConfidence(0.75), JevConfidenceLevel.MEDIUM);
    assert.strictEqual(JevDecisionEngine.classifyConfidence(0.65), JevConfidenceLevel.MEDIUM);
    assert.strictEqual(JevDecisionEngine.classifyConfidence(0.64), JevConfidenceLevel.LOW);
    assert.strictEqual(JevDecisionEngine.classifyConfidence(0.20), JevConfidenceLevel.LOW);
  });

  test('resolvePolicyOutcome exige validação para operações críticas mesmo com alta confiança', () => {
    const outcomeNormal = JevDecisionEngine.resolvePolicyOutcome(JevConfidenceLevel.HIGH, { isCriticalOperation: false });
    assert.strictEqual(outcomeNormal, JevActionOutcome.AUTO_EXECUTE);

    const outcomeCritical = JevDecisionEngine.resolvePolicyOutcome(JevConfidenceLevel.HIGH, { isCriticalOperation: true });
    assert.strictEqual(outcomeCritical, JevActionOutcome.REQUIRE_VALIDATION);

    const outcomeMedium = JevDecisionEngine.resolvePolicyOutcome(JevConfidenceLevel.MEDIUM);
    assert.strictEqual(outcomeMedium, JevActionOutcome.REQUIRE_VALIDATION);

    const outcomeLowNoFallback = JevDecisionEngine.resolvePolicyOutcome(JevConfidenceLevel.LOW, { fallbackAvailable: false });
    assert.strictEqual(outcomeLowNoFallback, JevActionOutcome.REQUIRE_HUMAN_REVIEW);

    const outcomeLowWithFallback = JevDecisionEngine.resolvePolicyOutcome(JevConfidenceLevel.LOW, { fallbackAvailable: true });
    assert.strictEqual(outcomeLowWithFallback, JevActionOutcome.FALLBACK_TRIGGERED);
  });

  // 3. AVALIAÇÃO BOOLEAN
  console.log('\n--- 3. Avaliação de Decisões BOOLEAN ---');

  await testAsync('evaluateBoolean detecta impacto estrutural físico com alta probabilidade', async () => {
    const res = await JevDecisionEngine.evaluateBoolean('A alteração do cliente requer revisão humana estrutural?', {
      comment: 'Demolir parede para integrar cozinha americana com a sala de jantar',
      clientDisputed: false
    });

    assert.strictEqual(res.type, JevDecisionType.BOOLEAN);
    assert.strictEqual(res.decision, true);
    assert(res.probability >= 0.85, 'Probabilidade deve ser alta');
    assert.strictEqual(res.confidenceLevel, JevConfidenceLevel.HIGH);
    assert(res.rationale.includes('alvenaria') || res.rationale.includes('estrutur'), 'Rationale deve explicar motivo');
  });

  await testAsync('evaluateBoolean autoriza ajuste meramente estético sem revisão estrutural obrigatória', async () => {
    const res = await JevDecisionEngine.evaluateBoolean('A alteração requer revisão estrutural?', {
      comment: 'Trocar o tom da tinta cinza para branco neve no teto do lavabo'
    });

    assert.strictEqual(res.decision, false);
    assert.strictEqual(res.confidenceLevel, JevConfidenceLevel.HIGH);
    assert.strictEqual(res.humanReviewRequired, false);
  });

  // 4. AVALIAÇÃO CHOICE
  console.log('\n--- 4. Avaliação de Decisões CHOICE (Caso Real Audiovisual) ---');

  await testAsync('evaluateChoice seleciona INTERIOR_PRESENTATION para foco em ambientes internos', async () => {
    const choices = [
      'ARCHITECTURAL_CINEMATIC',
      'ARCHITECTURAL_WALKTHROUGH',
      'INTERIOR_PRESENTATION',
      'FACADE_PRESENTATION',
      'MATERIALITY_PRESENTATION'
    ];

    const res = await JevDecisionEngine.evaluateChoice(
      'Qual template de apresentação audiovisual deve ser adotado?',
      choices,
      {
        focus: 'Cozinha Gourmet e Suíte Master',
        durationSeconds: 30
      }
    );

    assert.strictEqual(res.type, JevDecisionType.CHOICE);
    assert.strictEqual(res.decision, 'INTERIOR_PRESENTATION');
    assert(res.probability >= 0.85);
    assert.strictEqual(res.confidenceLevel, JevConfidenceLevel.HIGH);
  });

  await testAsync('evaluateChoice seleciona FACADE_PRESENTATION para volumetria externa e terreno', async () => {
    const choices = [
      'ARCHITECTURAL_CINEMATIC',
      'ARCHITECTURAL_WALKTHROUGH',
      'INTERIOR_PRESENTATION',
      'FACADE_PRESENTATION'
    ];

    const res = await JevDecisionEngine.evaluateChoice(
      'Qual template de vídeo adotar?',
      choices,
      {
        focus: 'Fachada frontal e volumetria arquitetônica'
      }
    );

    assert.strictEqual(res.decision, 'FACADE_PRESENTATION');
  });

  test('evaluateChoice rejeita lista de opções com menos de 2 elementos', async () => {
    let caught = false;
    try {
      await JevDecisionEngine.evaluateChoice('Pergunta?', ['APENAS_UMA']);
    } catch (err) {
      caught = true;
      assert.strictEqual(err.code, JevErrorCode.INVALID_REQUEST);
    }
    assert(caught, 'Deve rejeitar escolhas com < 2 opções');
  });

  // 5. AVALIAÇÃO SCORE
  console.log('\n--- 5. Avaliação de Decisões SCORE ---');

  await testAsync('evaluateScore calcula pontuação de prontidão entre min e max da escala', async () => {
    const res = await JevDecisionEngine.evaluateScore(
      'Prontidão da apresentação do cliente',
      { min: 0, max: 100 },
      {
        briefingConfirmed: true,
        rendersCount: 4,
        sheetsCount: 3,
        materialsCount: 6
      }
    );

    assert.strictEqual(res.type, JevDecisionType.SCORE);
    assert(typeof res.decision === 'number');
    assert(res.decision >= 80 && res.decision <= 100, 'Score deve ser alto devido à completude dos dados');
    assert(res.probability >= 0.85);
  });

  // 6. CONFIDENCE GATE E FALLBACK
  console.log('\n--- 6. Gate de Confiança e Fallback Determinístico ---');

  await testAsync('evaluateWithGate adota Jev quando confiança é ALTA', async () => {
    const res = await JevDecisionEngine.evaluateWithGate({
      type: JevDecisionType.CHOICE,
      question: 'Qual template adotar?',
      choices: ['ARCHITECTURAL_CINEMATIC', 'INTERIOR_PRESENTATION'],
      state: { focus: 'Suíte' }
    }, async () => {
      return { decision: 'FALLBACK_TEMPLATE' };
    });

    assert.strictEqual(res.source, 'JEV');
    assert.strictEqual(res.decision, 'INTERIOR_PRESENTATION');
  });

  await testAsync('evaluateWithGate aciona fallback de regra caso ocorra falha ou timeout', async () => {
    const brokenEngine = new JevDecisionEngineService({
      apiEndpoint: 'http://127.0.0.1:54321/broken-endpoint',
      apiKey: 'test-key',
      defaultTimeoutMs: 50
    });

    const res = await brokenEngine.evaluateWithGate({
      type: JevDecisionType.CHOICE,
      question: 'Qual template adotar?',
      choices: ['ARCHITECTURAL_CINEMATIC', 'INTERIOR_PRESENTATION'],
      state: { focus: 'Suíte' }
    }, async (state) => {
      return { decision: 'ARCHITECTURAL_CINEMATIC', rationale: 'Fallback determinístico da empresa' };
    });

    assert.strictEqual(res.source, 'FALLBACK_RULE');
    assert.strictEqual(res.decision, 'ARCHITECTURAL_CINEMATIC');
    assert.strictEqual(res.outcome, JevActionOutcome.FALLBACK_TRIGGERED);
  });

  // 7. BENCHMARK COMPARATIVO: REGRA DETERMINÍSTICA VS JEV
  console.log('\n--- 7. Benchmark: Regras Determinísticas vs. Jev ---');

  await testAsync('compareWithRule afere concordância de 100% no cenário de template de interiores', async () => {
    const jevRequest = {
      type: JevDecisionType.CHOICE,
      question: 'Qual template de vídeo adotar?',
      choices: ['ARCHITECTURAL_CINEMATIC', 'INTERIOR_PRESENTATION', 'FACADE_PRESENTATION'],
      state: { focus: 'Interiores / Cozinha Gourmet' }
    };

    const ruleEvaluator = async (state) => {
      const f = (state.focus || '').toLowerCase();
      if (f.includes('interior') || f.includes('cozinha')) {
        return { decision: 'INTERIOR_PRESENTATION', rationale: 'Regra determinística de ambientes internos' };
      }
      return { decision: 'ARCHITECTURAL_CINEMATIC' };
    };

    const benchmark = await JevDecisionEngine.compareWithRule(jevRequest, ruleEvaluator);
    assert.strictEqual(benchmark.agreement, true, 'Regra e Jev devem concordar');
    assert.strictEqual(benchmark.ruleResult.decision, 'INTERIOR_PRESENTATION');
    assert.strictEqual(benchmark.jevResult.decision, 'INTERIOR_PRESENTATION');
    assert(benchmark.jevResult.latencyMs >= 0);
  });

  // 8. INTEGRAÇÃO COM AIROUTER E AIOBSERVABILITY
  console.log('\n--- 8. Integração com AIRouter e Telemetria ---');

  await testAsync('AIRouter despacha ARCHITECTURAL_DECISION através do motor Jev', async () => {
    AIObservability.clear();

    const task = new AITask({
      capability: AICapability.ARCHITECTURAL_DECISION,
      payload: {
        decisionType: JevDecisionType.CHOICE,
        question: 'Qual template de vídeo adotar para este projeto?',
        choices: ['ARCHITECTURAL_CINEMATIC', 'INTERIOR_PRESENTATION', 'FACADE_PRESENTATION'],
        state: { focus: 'Fachada e entorno' }
      }
    });

    const result = await AIRouter.dispatch(task);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.model, 'jev-decision-v1');
    assert.strictEqual(result.provider, 'typesafe-ai-jev');
    assert.strictEqual(result.output.decision, 'FACADE_PRESENTATION');
    assert(result.output.probability >= 0.85);

    const history = AIObservability.getHistory({ capability: AICapability.ARCHITECTURAL_DECISION });
    assert.strictEqual(history.length, 1, 'Histórico de telemetria deve conter a decisão Jev');
    assert.strictEqual(history[0].provider, 'typesafe-ai-jev');
  });

  // RELATÓRIO FINAL
  console.log('\n================================================================');
  console.log(`TOTAL DE TESTES JEV: ${passedTests + failedTests}`);
  console.log(`PASSOU: ${passedTests}`);
  console.log(`FALHOU: ${failedTests}`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
})();
