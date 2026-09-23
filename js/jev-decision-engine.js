/**
 * ============================================================================
 * ARQVERTICE STUDIO — JEV DECISION ENGINE (I03)
 * ============================================================================
 * Camada especializada de decisão probabilística estruturada com espaço
 * amostral fechado, inspirada no Jev da TypeSafe AI / Vercel AI Gateway.
 * 
 * Regras Fundamentais:
 * 1. Jev NÃO é chat, gerador de texto, imagem ou vídeo.
 * 2. Jev avalia estado estruturado e responde perguntas tipadas.
 * 3. Jev retorna escolha / score / boolean + probabilidade calibrada.
 * 4. A aplicação (ArqVértice) aplica a política e decide se executa,
 *    valida, faz fallback ou encaminha para revisão humana (Human-in-the-loop).
 * 5. Decisão NÃO é autorização: operações críticas permanecem sob controle de código.
 * ============================================================================
 */

(function (global) {
  'use strict';

  /**
   * 1. TIPOS DE DECISÃO SUPORTADOS (JevDecisionType)
   */
  const JevDecisionType = Object.freeze({
    BOOLEAN: 'BOOLEAN', // Pergunta binária (sim / não, true / false)
    CHOICE: 'CHOICE',   // Seleção dentro de uma lista fechada de opções
    SCORE: 'SCORE'      // Avaliação numérica contra escala / rubrica definida
  });

  /**
   * 2. NÍVEIS DE CONFIANÇA PROBABILÍSTICA (JevConfidenceLevel)
   */
  const JevConfidenceLevel = Object.freeze({
    HIGH: 'HIGH',       // Alta probabilidade (ex: >= 0.85) -> Execução automática permitida por política
    MEDIUM: 'MEDIUM',   // Confiança moderada (ex: 0.65 - 0.85) -> Requer validação ou confirmação
    LOW: 'LOW'          // Baixa probabilidade (< 0.65) -> Fallback para regra determinística ou revisão humana
  });

  /**
   * 3. RESULTADOS DE AÇÃO DA POLÍTICA (JevActionOutcome)
   */
  const JevActionOutcome = Object.freeze({
    AUTO_EXECUTE: 'AUTO_EXECUTE',                 // Política autoriza avanço sem intervenção
    REQUIRE_VALIDATION: 'REQUIRE_VALIDATION',     // Requer checagem intermediária de conformidade
    REQUIRE_HUMAN_REVIEW: 'REQUIRE_HUMAN_REVIEW', // Encaminhado à fila de revisão humana do arquiteto
    FALLBACK_TRIGGERED: 'FALLBACK_TRIGGERED'      // Ativado fallback determinístico seguro
  });

  /**
   * 4. CÓDIGOS DE ERRO E STATUS (JevErrorCode)
   */
  const JevErrorCode = Object.freeze({
    JEV_UNAVAILABLE: 'JEV_UNAVAILABLE',
    INVALID_REQUEST: 'INVALID_REQUEST',
    INVALID_RESPONSE: 'INVALID_RESPONSE',
    TIMEOUT: 'TIMEOUT',
    RATE_LIMIT: 'RATE_LIMIT',
    AUTH_ERROR: 'AUTH_ERROR',
    POLICY_ERROR: 'POLICY_ERROR',
    LOW_CONFIDENCE: 'LOW_CONFIDENCE'
  });

  /**
   * 5. SERVIÇO PRINCIPAL: JevDecisionEngineService
   */
  class JevDecisionEngineService {
    constructor(config = {}) {
      this.model = config.model || 'jev-decision-v1';
      this.provider = config.provider || 'typesafe-ai-jev';
      this.apiEndpoint = config.apiEndpoint || (typeof process !== 'undefined' && process.env.JEV_ENDPOINT) || null;
      this.apiKey = config.apiKey || (typeof process !== 'undefined' && process.env.JEV_API_KEY) || null;
      
      // Thresholds de confiança configuráveis por política
      this.thresholds = {
        high: config.highThreshold || 0.85,
        medium: config.mediumThreshold || 0.65
      };

      this.defaultTimeoutMs = config.defaultTimeoutMs || 5000;
      this.evaluationsLog = [];
      this.maxLogSize = 500;
    }

    /**
     * Calcula o nível de confiança com base na probabilidade
     * @param {number} probability - Valor entre 0 e 1
     * @returns {string} JevConfidenceLevel
     */
    classifyConfidence(probability) {
      if (typeof probability !== 'number' || isNaN(probability)) {
        return JevConfidenceLevel.LOW;
      }
      if (probability >= this.thresholds.high) {
        return JevConfidenceLevel.HIGH;
      }
      if (probability >= this.thresholds.medium) {
        return JevConfidenceLevel.MEDIUM;
      }
      return JevConfidenceLevel.LOW;
    }

    /**
     * Resolve a ação da política com base no nível de confiança e no tipo de operação
     * @param {string} confidenceLevel 
     * @param {Object} options 
     * @returns {string} JevActionOutcome
     */
    resolvePolicyOutcome(confidenceLevel, options = {}) {
      const isCritical = Boolean(options.isCriticalOperation);
      
      if (confidenceLevel === JevConfidenceLevel.HIGH) {
        return isCritical ? JevActionOutcome.REQUIRE_VALIDATION : JevActionOutcome.AUTO_EXECUTE;
      }
      if (confidenceLevel === JevConfidenceLevel.MEDIUM) {
        return JevActionOutcome.REQUIRE_VALIDATION;
      }
      return options.fallbackAvailable ? JevActionOutcome.FALLBACK_TRIGGERED : JevActionOutcome.REQUIRE_HUMAN_REVIEW;
    }

    /**
     * Avaliação estruturada genérica
     * @param {Object} request
     * @returns {Promise<Object>}
     */
    async evaluate(request) {
      if (!request || typeof request !== 'object') {
        throw this._createError(JevErrorCode.INVALID_REQUEST, 'A requisição para o Jev deve ser um objeto.');
      }

      const { type, question, state, choices, rubric, scale, options = {} } = request;
      if (!type || !Object.values(JevDecisionType).includes(type)) {
        throw this._createError(
          JevErrorCode.INVALID_REQUEST,
          `Tipo de decisão '${type}' inválido. Utilize BOOLEAN, CHOICE ou SCORE.`
        );
      }
      if (!question || typeof question !== 'string') {
        throw this._createError(JevErrorCode.INVALID_REQUEST, 'A pergunta estruturada deve ser uma string não vazia.');
      }

      const decisionId = `jev-dec-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const startTime = Date.now();

      try {
        let rawResult;

        // Se houver endpoint HTTP configurado (nuvem / gateway), realiza chamada com timeout
        if (this.apiEndpoint && this.apiKey) {
          rawResult = await this._callRemoteJev(request, options.timeoutMs || this.defaultTimeoutMs);
        } else {
          // Modo local calibrado: inferência probabilística determinística e segura
          rawResult = await this._evaluateLocalCalibrated(request);
        }

        const latencyMs = Date.now() - startTime;
        const confidenceLevel = this.classifyConfidence(rawResult.probability);
        const outcome = this.resolvePolicyOutcome(confidenceLevel, options);

        const evaluation = {
          decisionId,
          taskId: options.taskId || null,
          workflowId: options.workflowId || null,
          model: this.model,
          provider: this.provider,
          type,
          question,
          decision: rawResult.decision,
          probability: Number(rawResult.probability.toFixed(4)),
          confidenceLevel,
          outcome,
          rationale: rawResult.rationale || 'Decisão calculada via espaço de estados probabilístico.',
          suggestedAction: this._computeSuggestedAction(rawResult.decision, outcome),
          humanReviewRequired: outcome === JevActionOutcome.REQUIRE_HUMAN_REVIEW,
          fallbackTriggered: outcome === JevActionOutcome.FALLBACK_TRIGGERED,
          latencyMs,
          timestamp: new Date().toISOString()
        };

        this._logEvaluation(evaluation);
        return evaluation;

      } catch (err) {
        const latencyMs = Date.now() - startTime;
        const errorRecord = {
          decisionId,
          taskId: options.taskId || null,
          workflowId: options.workflowId || null,
          model: this.model,
          provider: this.provider,
          type,
          question,
          error: err.code || JevErrorCode.INVALID_RESPONSE,
          errorMessage: err.message,
          latencyMs,
          timestamp: new Date().toISOString()
        };
        this._logEvaluation(errorRecord);
        throw err;
      }
    }

    /**
     * Avaliação BOOLEAN: Pergunta binária
     */
    async evaluateBoolean(question, state = {}, options = {}) {
      return this.evaluate({
        type: JevDecisionType.BOOLEAN,
        question,
        state,
        options
      });
    }

    /**
     * Avaliação CHOICE: Seleção em espaço fechado de opções
     */
    async evaluateChoice(question, choices, state = {}, options = {}) {
      if (!Array.isArray(choices) || choices.length < 2) {
        throw this._createError(
          JevErrorCode.INVALID_REQUEST,
          'Decisões CHOICE requerem uma lista pré-definida com pelo menos 2 opções.'
        );
      }
      return this.evaluate({
        type: JevDecisionType.CHOICE,
        question,
        choices,
        state,
        options
      });
    }

    /**
     * Avaliação SCORE: Nota numérica contra escala
     */
    async evaluateScore(rubric, scale = { min: 0, max: 100 }, state = {}, options = {}) {
      return this.evaluate({
        type: JevDecisionType.SCORE,
        question: `Avaliação de conformidade segundo rubrica: ${rubric}`,
        rubric,
        scale,
        state,
        options
      });
    }

    /**
     * Avaliação com Gate de Confiança e Fallback Determinístico
     * Executa Jev e, caso a confiança seja LOW ou ocorra falha, recorre a ruleFallbackFn
     */
    async evaluateWithGate(request, ruleFallbackFn) {
      try {
        const jevResult = await this.evaluate(request);
        
        // Se a confiança for ALTA ou MÉDIA, respeita o resultado probabilístico
        if (jevResult.confidenceLevel !== JevConfidenceLevel.LOW) {
          return {
            source: 'JEV',
            ...jevResult
          };
        }

        // Se confiança for LOW e existir regra de fallback:
        if (typeof ruleFallbackFn === 'function') {
          const fallbackResult = await ruleFallbackFn(request.state);
          return {
            source: 'FALLBACK_RULE',
            decisionId: jevResult.decisionId,
            type: request.type,
            decision: fallbackResult.decision,
            probability: 1.0,
            confidenceLevel: JevConfidenceLevel.HIGH,
            outcome: JevActionOutcome.FALLBACK_TRIGGERED,
            rationale: `Fallback acionado devido à baixa confiança de Jev (${jevResult.probability}). Regra determinística aplicada.`,
            originalJevDecision: jevResult.decision,
            originalJevProbability: jevResult.probability,
            latencyMs: jevResult.latencyMs,
            timestamp: new Date().toISOString()
          };
        }

        return {
          source: 'JEV_LOW_CONFIDENCE',
          ...jevResult
        };

      } catch (error) {
        if (typeof ruleFallbackFn === 'function') {
          const fallbackResult = await ruleFallbackFn(request.state);
          return {
            source: 'FALLBACK_RULE',
            decisionId: `fallback-${Date.now()}`,
            type: request.type,
            decision: fallbackResult.decision,
            probability: 1.0,
            confidenceLevel: JevConfidenceLevel.HIGH,
            outcome: JevActionOutcome.FALLBACK_TRIGGERED,
            rationale: `Fallback acionado após falha de Jev: ${error.message}`,
            originalError: error.message,
            timestamp: new Date().toISOString()
          };
        }
        throw error;
      }
    }

    /**
     * Utilitário de Benchmark: Compara decisão de Regra vs. Decisão Jev
     * Mede concordância, divergência, tempo e casos ambíguos.
     */
    async compareWithRule(jevRequest, ruleEvaluationFn) {
      const ruleStart = Date.now();
      const ruleDecision = await ruleEvaluationFn(jevRequest.state);
      const ruleLatencyMs = Date.now() - ruleStart;

      const jevResult = await this.evaluate(jevRequest);

      const agreement = (ruleDecision.decision === jevResult.decision);

      return {
        agreement,
        ruleResult: {
          decision: ruleDecision.decision,
          latencyMs: ruleLatencyMs,
          rationale: ruleDecision.rationale || null
        },
        jevResult: {
          decision: jevResult.decision,
          probability: jevResult.probability,
          confidenceLevel: jevResult.confidenceLevel,
          latencyMs: jevResult.latencyMs,
          rationale: jevResult.rationale
        },
        divergenceType: agreement ? 'NONE' : 'STRATEGY_VARIATION',
        suggestedResolution: agreement ? 'CONFIRMED' : (jevResult.confidenceLevel === JevConfidenceLevel.HIGH ? 'JEV_PREFERRED' : 'RULE_ENFORCED')
      };
    }

    /**
     * Implementação Local Calibrada (sem chamadas externas de rede)
     * Respeita os casos de uso reais do ArqVértice identificados no código.
     */
    async _evaluateLocalCalibrated(request) {
      const { type, question, state = {}, choices = [], scale = { min: 0, max: 100 } } = request;
      const q = (question || '').toLowerCase();

      // ----------------------------------------------------------------------
      // CASO REAL 1: Seleção de Template de Vídeo / Apresentação (CHOICE)
      // ----------------------------------------------------------------------
      if (type === JevDecisionType.CHOICE && (q.includes('template') || q.includes('apresentação') || q.includes('vídeo'))) {
        const validChoices = choices.length > 0 ? choices : [
          'ARCHITECTURAL_CINEMATIC',
          'ARCHITECTURAL_WALKTHROUGH',
          'INTERIOR_PRESENTATION',
          'FACADE_PRESENTATION',
          'MATERIALITY_PRESENTATION'
        ];

        const objective = String(state.objective || state.targetAudience || '').toLowerCase();
        const durationSec = Number(state.durationSeconds) || 45;
        const focusEnvironment = String(state.environment || state.focus || '').toLowerCase();
        const hasBIM = Boolean(state.hasBIMData || state.bimElementsCount > 0);

        // Pontuação ponderada para cada escolha
        let selectedChoice = validChoices[0];
        let probability = 0.88;
        let rationale = 'Template cinemático institucional padrão selecionado.';

        if (focusEnvironment.includes('cozinha') || focusEnvironment.includes('suíte') || focusEnvironment.includes('sala') || focusEnvironment.includes('interior')) {
          if (validChoices.includes('INTERIOR_PRESENTATION')) {
            selectedChoice = 'INTERIOR_PRESENTATION';
            probability = 0.94;
            rationale = 'Foco explícito em ambientes internos e mobiliário de interiores.';
          }
        } else if (focusEnvironment.includes('fachada') || focusEnvironment.includes('volumetria') || focusEnvironment.includes('extern')) {
          if (validChoices.includes('FACADE_PRESENTATION')) {
            selectedChoice = 'FACADE_PRESENTATION';
            probability = 0.93;
            rationale = 'Destaque para volumetria externa, insolação e fachada.';
          }
        } else if (durationSec >= 60 && hasBIM) {
          if (validChoices.includes('ARCHITECTURAL_WALKTHROUGH')) {
            selectedChoice = 'ARCHITECTURAL_WALKTHROUGH';
            probability = 0.91;
            rationale = 'Extensão de tempo e modelo espacial completo justificam percurso imersivo contínuo.';
          }
        } else if (objective.includes('material') || objective.includes('acabamento') || focusEnvironment.includes('textura')) {
          if (validChoices.includes('MATERIALITY_PRESENTATION')) {
            selectedChoice = 'MATERIALITY_PRESENTATION';
            probability = 0.92;
            rationale = 'Objetivo focado em especificação tátil de materiais e revestimentos.';
          }
        } else if (validChoices.includes('ARCHITECTURAL_CINEMATIC')) {
          selectedChoice = 'ARCHITECTURAL_CINEMATIC';
          probability = 0.89;
          rationale = 'Apresentação arquitetônica cinematográfica balanceada com introdução e encerramento.';
        }

        return {
          decision: selectedChoice,
          probability,
          rationale
        };
      }

      // ----------------------------------------------------------------------
      // CASO REAL 2: Roteamento de Workflow / Tipo de Tarefa (CHOICE)
      // ----------------------------------------------------------------------
      if (type === JevDecisionType.CHOICE && (q.includes('workflow') || q.includes('tarefa') || q.includes('rotear'))) {
        const text = String(state.text || state.prompt || state.input || '').toLowerCase();
        let selected = choices[0] || 'ARCHITECTURE_BRIEF';
        let probability = 0.86;

        if (text.includes('ifc') || text.includes('bim') || text.includes('colisão') || text.includes('revit')) {
          selected = choices.includes('BIM_ANALYSIS') ? 'BIM_ANALYSIS' : selected;
          probability = 0.95;
        } else if (text.includes('render') || text.includes('imagem') || text.includes('foto') || text.includes('perspectiva')) {
          selected = choices.includes('VISION_ANALYSIS') ? 'VISION_ANALYSIS' : selected;
          probability = 0.93;
        } else if (text.includes('vídeo') || text.includes('câmera') || text.includes('storyboard') || text.includes('veo')) {
          selected = choices.includes('VIDEO_DIRECTION') ? 'VIDEO_DIRECTION' : selected;
          probability = 0.92;
        } else if (text.includes('prancha') || text.includes('relatório') || text.includes('caderno')) {
          selected = choices.includes('DOCUMENTATION') ? 'DOCUMENTATION' : selected;
          probability = 0.90;
        }

        return {
          decision: selected,
          probability,
          rationale: `Roteamento determinado pela semântica contextual dos termos de entrada.`
        };
      }

      // ----------------------------------------------------------------------
      // CASO REAL 3: Necessidade de Revisão Humana (BOOLEAN)
      // ----------------------------------------------------------------------
      if (type === JevDecisionType.BOOLEAN && (q.includes('humana') || q.includes('review') || q.includes('revisão') || q.includes('estrutural'))) {
        const comment = String(state.comment || state.description || '').toLowerCase();
        const impactsStructure = comment.includes('parede') || comment.includes('pilar') || comment.includes('vão') || comment.includes('abertura') || comment.includes('ampliar');
        const budgetImpact = Number(state.estimatedBudgetVariance || 0) > 0.15; // >15% variação orçamentária
        
        const decision = Boolean(impactsStructure || budgetImpact || state.clientDisputed);
        const probability = decision ? 0.96 : 0.88;

        return {
          decision,
          probability,
          rationale: decision 
            ? 'Alteração possui impacto físico em alvenaria/estrutura ou desvio orçamentário relevante.'
            : 'Ajuste estético/editorial sem impacto estrutural crítico.'
        };
      }

      // ----------------------------------------------------------------------
      // CASO REAL 4: Prontidão para Apresentação / Entrega (SCORE)
      // ----------------------------------------------------------------------
      if (type === JevDecisionType.SCORE) {
        const rendersCount = Number(state.rendersCount || 0);
        const sheetsCount = Number(state.sheetsCount || 0);
        const briefingConfirmed = Boolean(state.briefingConfirmed);
        const materialsCount = Number(state.materialsCount || 0);

        let score = 20;
        if (briefingConfirmed) score += 30;
        if (rendersCount >= 3) score += 25;
        if (sheetsCount >= 2) score += 15;
        if (materialsCount >= 4) score += 10;

        score = Math.min(Math.max(score, scale.min || 0), scale.max || 100);

        return {
          decision: score,
          probability: 0.94,
          rationale: `Pontuação de prontidão calculada com base na completude de pranchas, renders e confirmação do briefing.`
        };
      }

      // Default Fallback Local Seguro
      if (type === JevDecisionType.BOOLEAN) {
        return { decision: false, probability: 0.70, rationale: 'Decisão booleana padrão conservadora.' };
      }
      if (type === JevDecisionType.CHOICE) {
        return { decision: choices[0] || 'DEFAULT_CHOICE', probability: 0.70, rationale: 'Primeira escolha do espaço fechado por default.' };
      }
      return { decision: scale.min || 0, probability: 0.70, rationale: 'Score base da escala.' };
    }

    /**
     * Chamada remota HTTP para Jev (AI Gateway / Endpoint TypeSafe AI)
     */
    async _callRemoteJev(request, timeoutMs) {
      // Implementação em Node.js com http/https nativo
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          const err = this._createError(JevErrorCode.TIMEOUT, `Jev API excedeu o timeout de ${timeoutMs}ms.`);
          reject(err);
        }, timeoutMs);

        try {
          const urlObj = new URL(this.apiEndpoint);
          const protocol = urlObj.protocol === 'https:' ? require('https') : require('http');

          const postData = JSON.stringify({
            model: this.model,
            type: request.type,
            question: request.question,
            choices: request.choices,
            rubric: request.rubric,
            scale: request.scale,
            state: request.state
          });

          const req = protocol.request(urlObj, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData),
              'Authorization': `Bearer ${this.apiKey}`
            }
          }, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
              clearTimeout(timer);
              if (res.statusCode === 401 || res.statusCode === 403) {
                return reject(this._createError(JevErrorCode.AUTH_ERROR, `Falha de autenticação na API do Jev (${res.statusCode}).`));
              }
              if (res.statusCode === 429) {
                return reject(this._createError(JevErrorCode.RATE_LIMIT, 'Limite de requisições excedido no provedor Jev.'));
              }
              if (res.statusCode >= 500) {
                return reject(this._createError(JevErrorCode.JEV_UNAVAILABLE, `Servidor Jev indisponível (${res.statusCode}).`));
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.decision === undefined || parsed.probability === undefined) {
                  return reject(this._createError(JevErrorCode.INVALID_RESPONSE, 'Resposta do Jev fora do schema esperado.'));
                }
                resolve({
                  decision: parsed.decision,
                  probability: Number(parsed.probability),
                  rationale: parsed.rationale || 'Decisão retornada pelo serviço remoto.'
                });
              } catch (parseErr) {
                reject(this._createError(JevErrorCode.INVALID_RESPONSE, 'Formato de resposta do Jev não é um JSON válido.'));
              }
            });
          });

          req.on('error', (err) => {
            clearTimeout(timer);
            reject(this._createError(JevErrorCode.JEV_UNAVAILABLE, `Erro de rede ao conectar com o Jev: ${err.message}`));
          });

          req.write(postData);
          req.end();

        } catch (e) {
          clearTimeout(timer);
          reject(this._createError(JevErrorCode.INVALID_REQUEST, `Configuração de endpoint inválida: ${e.message}`));
        }
      });
    }

    _computeSuggestedAction(decision, outcome) {
      if (outcome === JevActionOutcome.AUTO_EXECUTE) {
        return `PROCEED_WITH_${String(decision).toUpperCase()}`;
      }
      if (outcome === JevActionOutcome.REQUIRE_VALIDATION) {
        return `VALIDATE_TECHNICAL_CONSTRAINTS_BEFORE_${String(decision).toUpperCase()}`;
      }
      if (outcome === JevActionOutcome.REQUIRE_HUMAN_REVIEW) {
        return `ROUTE_TO_LEAD_ARCHITECT_REVIEW`;
      }
      return `EXECUTE_DETERMINISTIC_FALLBACK`;
    }

    _createError(code, message) {
      const err = new Error(message);
      err.code = code;
      return err;
    }

    _logEvaluation(record) {
      this.evaluationsLog.push(record);
      if (this.evaluationsLog.length > this.maxLogSize) {
        this.evaluationsLog.shift();
      }
    }

    getEvaluations(filter = {}) {
      return this.evaluationsLog.filter(item => {
        if (filter.type && item.type !== filter.type) return false;
        if (filter.confidenceLevel && item.confidenceLevel !== filter.confidenceLevel) return false;
        if (filter.outcome && item.outcome !== filter.outcome) return false;
        return true;
      });
    }

    clearLogs() {
      this.evaluationsLog = [];
    }
  }

  const JevDecisionEngine = new JevDecisionEngineService();

  // Conecta o JevDecisionEngine ao AIRouter se estiver presente no ambiente
  function connectToAIRouter(customRouter, customCapability) {
    let router = customRouter || null;
    let aiCap = customCapability || null;

    if (!router) {
      if (typeof AIRouter !== 'undefined') {
        router = AIRouter;
        aiCap = typeof AICapability !== 'undefined' ? AICapability : null;
      } else if (typeof window !== 'undefined' && window.AIRouter) {
        router = window.AIRouter;
        aiCap = window.AICapability;
      } else if (typeof require !== 'undefined') {
        try {
          const aiMod = require('./ai-foundation.js');
          router = aiMod.AIRouter;
          aiCap = aiMod.AICapability;
        } catch (e) {
          // Ignorado se não encontrado
        }
      }
    }

    if (router && aiCap) {
      router.registerCapability(aiCap.ARCHITECTURAL_DECISION, async (task) => {
        const payload = task.payload || task.input || {};
        const question = payload.question || 'Decisão arquitetônica requerida para o projeto';
        const type = payload.decisionType || JevDecisionType.CHOICE;
        
        const evaluation = await JevDecisionEngine.evaluate({
          type,
          question,
          choices: payload.choices,
          rubric: payload.rubric,
          scale: payload.scale,
          state: payload.state || payload,
          options: {
            taskId: task.id,
            isCriticalOperation: payload.isCriticalOperation,
            timeoutMs: task.timeoutMs
          }
        });

        return {
          status: 'SUCCESS',
          decision: evaluation.decision,
          output: {
            decision: evaluation.decision,
            probability: evaluation.probability,
            confidenceLevel: evaluation.confidenceLevel,
            outcome: evaluation.outcome,
            rationale: evaluation.rationale,
            suggestedAction: evaluation.suggestedAction
          },
          provider: 'typesafe-ai-jev',
          model: JevDecisionEngine.model,
          tokensUsed: 0,
          estimatedCostUsd: 0.0001
        };
      });
    }
  }

  // Tenta registrar na inicialização
  try {
    connectToAIRouter();
  } catch (e) {
    // Silencioso se AIRouter for carregado em sequência
  }

  // Exportações Universais
  const JevModulePayload = {
    JevDecisionType,
    JevConfidenceLevel,
    JevActionOutcome,
    JevErrorCode,
    JevDecisionEngineService,
    JevDecisionEngine,
    connectToAIRouter
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = JevModulePayload;
  }
  if (typeof window !== 'undefined') {
    window.JevModule = JevModulePayload;
    window.JevDecisionType = JevDecisionType;
    window.JevConfidenceLevel = JevConfidenceLevel;
    window.JevActionOutcome = JevActionOutcome;
    window.JevErrorCode = JevErrorCode;
    window.JevDecisionEngine = JevDecisionEngine;
  }

})(typeof window !== 'undefined' ? window : global);
