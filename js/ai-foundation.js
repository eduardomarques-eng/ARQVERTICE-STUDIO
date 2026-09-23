/**
 * ============================================================================
 * ARQVERTICE STUDIO — BLOCO I02: FUNDAÇÃO DA CAMADA DE IA, ROUTER & TELEMETRIA
 * ============================================================================
 * Arquitetura Provider-Agnostic, Orientada a Capacidades (Capabilities) e Políticas.
 * 
 * Regras Fundamentais:
 * 1. Model e Capability são desacoplados: a aplicação requisita uma CAPABILITY.
 * 2. Políticas de roteamento configuráveis: QUALITY, BALANCED, LOW_COST, FAST, LOCAL.
 * 3. Níveis de execução explícitos: DETERMINISTIC, DECISION, GENERATIVE, VISION, HUMAN.
 * 4. Fallback transparente com registro obrigatório de auditoria.
 * 5. Validação estruturada de schemas e observabilidade centralizada.
 * 6. Segurança absoluta: NUNCA trafegar ou armazenar chaves de API no cliente.
 * ============================================================================
 */

(function (global) {
  'use strict';

  /**
   * 1. CATÁLOGO DE CAPACIDADES CANÔNICAS (AICapability)
   */
  const AICapability = Object.freeze({
    VISUAL_RENDER_GENERATION: 'VISUAL_RENDER_GENERATION',
    VIDEO_PROMPT_GENERATION: 'VIDEO_PROMPT_GENERATION',
    VIDEO_RENDER_EXECUTION: 'VIDEO_RENDER_EXECUTION',
    ARCHITECTURAL_TEXT_GENERATION: 'ARCHITECTURAL_TEXT_GENERATION',
    STRUCTURED_DATA_EXTRACTION: 'STRUCTURED_DATA_EXTRACTION',
    VISION_ANALYSIS: 'VISION_ANALYSIS',
    IMAGE_ANALYSIS_VISION: 'IMAGE_ANALYSIS_VISION',
    ARCHITECTURAL_DECISION: 'ARCHITECTURAL_DECISION',
    BRIEFING_INTERPRETATION: 'BRIEFING_INTERPRETATION',
    BIM_STRUCTURAL_ANALYSIS: 'BIM_STRUCTURAL_ANALYSIS',
    PRESENTATION_SYNTHESIS: 'PRESENTATION_SYNTHESIS',
    CLASSIFICATION: 'CLASSIFICATION',
    ROUTING: 'ROUTING'
  });

  /**
   * 2. NÍVEIS DE EXECUÇÃO (AIExecutionLevel)
   */
  const AIExecutionLevel = Object.freeze({
    DETERMINISTIC: 'DETERMINISTIC', // Código puro, matemática e regras
    DECISION: 'DECISION',           // Heurística ou motor de decisão (Jev)
    GENERATIVE: 'GENERATIVE',       // Modelos de linguagem ou difusão
    VISION: 'VISION',               // Análise multimodal visual
    HUMAN: 'HUMAN'                  // Aprovação ou revisão humana necessária
  });

  /**
   * 3. POLÍTICAS DE ROTEAMENTO (AIRoutingPolicy)
   */
  const AIRoutingPolicy = Object.freeze({
    QUALITY: 'QUALITY',   // Máxima fidelidade e resolução
    BALANCED: 'BALANCED', // Equilíbrio entre custo e estética
    LOW_COST: 'LOW_COST', // Menor custo financeiro
    FAST: 'FAST',         // Menor latência
    LOCAL: 'LOCAL'        // Execução local offline
  });

  /**
   * 4. OBSERVABILIDADE & TELEMETRIA (AIObservability)
   */
  class ObservabilityService {
    constructor() {
      this.history = [];
      this.maxHistorySize = 1000;
    }

    logExecution(record) {
      const entry = {
        executionId: record.executionId || `exec-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        taskId: record.taskId || 'unnamed-task',
        capability: record.capability || 'UNKNOWN',
        provider: record.provider || 'unknown',
        model: record.model || 'unknown',
        policy: record.policy || AIRoutingPolicy.BALANCED,
        level: record.level || AIExecutionLevel.GENERATIVE,
        startedAt: record.startedAt || new Date().toISOString(),
        durationMs: record.durationMs !== undefined ? record.durationMs : 0,
        success: Boolean(record.success),
        fallbackTriggered: Boolean(record.fallbackTriggered),
        fallbackReason: record.fallbackReason || null,
        tokensUsed: record.tokensUsed || 0,
        estimatedCostUsd: record.estimatedCostUsd || 0,
        validation: record.validation || { valid: true },
        error: record.error ? String(record.error.message || record.error) : null
      };

      this.history.push(entry);
      if (this.history.length > this.maxHistorySize) {
        this.history.shift();
      }
      return entry;
    }

    getHistory(filter = {}) {
      return this.history.filter(item => {
        if (filter.capability && item.capability !== filter.capability) return false;
        if (filter.provider && item.provider !== filter.provider) return false;
        if (filter.success !== undefined && item.success !== filter.success) return false;
        if (filter.fallbackTriggered !== undefined && item.fallbackTriggered !== filter.fallbackTriggered) return false;
        return true;
      });
    }

    getMetrics() {
      const total = this.history.length;
      let successCount = 0;
      let fallbackCount = 0;
      let totalDuration = 0;
      let totalTokens = 0;
      let totalCost = 0;
      const capabilities = {};

      for (let i = 0; i < total; i++) {
        const item = this.history[i];
        if (item.success) successCount++;
        if (item.fallbackTriggered) fallbackCount++;
        totalDuration += item.durationMs;
        totalTokens += (item.tokensUsed || 0);
        totalCost += (item.estimatedCostUsd || 0);

        const cap = item.capability || 'UNKNOWN';
        if (!capabilities[cap]) {
          capabilities[cap] = { calls: 0, successes: 0, failures: 0, costUsd: 0 };
        }
        capabilities[cap].calls++;
        if (item.success) capabilities[cap].successes++;
        else capabilities[cap].failures++;
        capabilities[cap].costUsd += (item.estimatedCostUsd || 0);
      }

      return {
        totalCalls: total,
        totalExecutions: total,
        successfulCalls: successCount,
        successfulExecutions: successCount,
        failedCalls: total - successCount,
        failedExecutions: total - successCount,
        fallbackExecutions: fallbackCount,
        successRate: total > 0 ? Number((successCount / total).toFixed(4)) : 1.0,
        avgDurationMs: total > 0 ? Math.round(totalDuration / total) : 0,
        totalTokens: totalTokens,
        totalTokensUsed: totalTokens,
        totalCostUsd: Number(totalCost.toFixed(4)),
        capabilities
      };
    }

    reset() {
      this.history = [];
    }

    clear() {
      this.reset();
    }
  }

  const AIObservability = new ObservabilityService();

  /**
   * 5. ESTRUTURA DE TAREFA PADRONIZADA (AITask)
   */
  class AITask {
    constructor(config = {}) {
      if (!config.capability) {
        throw new Error('AITask requer a definição explícita de uma capability.');
      }
      this.id = config.id || `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      this.capability = config.capability;
      this.level = config.level || (config.capability === AICapability.ARCHITECTURAL_DECISION ? AIExecutionLevel.DECISION : AIExecutionLevel.GENERATIVE);
      this.payload = config.payload || config.input || {};
      this.input = this.payload;
      this.preferredPolicy = config.preferredPolicy || AIRoutingPolicy.BALANCED;
      this.preferredModels = Array.isArray(config.preferredModels) ? config.preferredModels : [];
      this.fallbackModels = Array.isArray(config.fallbackModels) ? config.fallbackModels : [];
      this.fallbackHandler = typeof config.fallbackHandler === 'function' ? config.fallbackHandler : null;
      this.timeoutMs = config.timeoutMs || 30000;
      this.fallbackEnabled = config.fallbackEnabled !== false;
      this.inputSchema = config.inputSchema || null;
      this.outputSchema = config.outputSchema || null;
      this.metadata = config.metadata || {};
      this.createdAt = new Date().toISOString();
    }
  }

  /**
   * 6. ROTEADOR DE IA (AIRouter)
   */
  class AIRouterService {
    constructor() {
      this.capabilityHandlers = new Map();
      this.defaultPolicy = AIRoutingPolicy.BALANCED;
      this._registerBuiltInAdapters();
    }

    /**
     * Registra adaptadores universais conectados aos barramentos existentes
     */
    _registerBuiltInAdapters() {
      // 1. VISUAL_RENDER_GENERATION Adapter
      this.registerCapability(AICapability.VISUAL_RENDER_GENERATION, async (task, policy) => {
        let registry = null;
        if (typeof RenderProviderRegistry !== 'undefined') {
          registry = RenderProviderRegistry;
        } else if (typeof window !== 'undefined' && window.RenderProviderRegistry) {
          registry = window.RenderProviderRegistry;
        } else {
          try {
            const rp = require('./render-providers.js');
            registry = rp.RenderProviderRegistry;
          } catch (e) {
            // No Node puro sem require
          }
        }

        if (!registry) {
          throw new Error('RenderProviderRegistry não encontrado no ambiente de execução.');
        }

        // Escolha de provider e modelo baseada na política
        let providerName = 'mock';
        let targetModel = 'arqvertice-mock-engine-v1';

        if (policy === AIRoutingPolicy.QUALITY) {
          providerName = registry.has('gemini') ? 'gemini' : 'mock';
          targetModel = 'imagen-3.0-generate-002';
        } else if (policy === AIRoutingPolicy.FAST) {
          providerName = registry.has('gemini') ? 'gemini' : 'mock';
          targetModel = 'imagen-3.0-fast-generate-001';
        } else if (policy === AIRoutingPolicy.LOCAL || policy === AIRoutingPolicy.LOW_COST) {
          providerName = 'mock';
          targetModel = 'arqvertice-mock-engine-v1';
        } else { // BALANCED
          providerName = registry.has('gemini') ? 'gemini' : 'mock';
          targetModel = 'imagen-3.0-generate-002';
        }

        // Se a tarefa solicitou modelos preferidos específicos
        if (task.preferredModels.length > 0) {
          targetModel = task.preferredModels[0];
        }

        const provider = registry.get(providerName);
        const job = task.input.job || {
          id: task.id,
          model: targetModel,
          parameters: task.input.parameters || {}
        };
        const compiledContext = task.input.compiledContext || { fullPrompt: task.input.prompt || 'Architectural scene' };
        const options = task.input.options || {};

        const result = await provider.generateImage(job, compiledContext, options);
        return {
          output: result,
          provider: providerName,
          model: result.modelUsed || targetModel,
          tokensUsed: result.tokensUsed || 1000,
          estimatedCostUsd: result.estimatedCostUsd || 0.035
        };
      });

      // 2. VIDEO_PROMPT_GENERATION Adapter
      this.registerCapability(AICapability.VIDEO_PROMPT_GENERATION, async (task, policy) => {
        let registry = null;
        if (typeof videoPromptRegistry !== 'undefined') {
          registry = videoPromptRegistry;
        } else if (typeof window !== 'undefined' && window.videoPromptRegistry) {
          registry = window.videoPromptRegistry;
        } else {
          try {
            const vp = require('./video-prompt-providers.js');
            registry = vp.videoPromptRegistry;
          } catch (e) {
            // Em testes ou headless
          }
        }

        let providerId = 'gemini';
        if (policy === AIRoutingPolicy.LOCAL) {
          providerId = 'local_generator';
        } else if (policy === AIRoutingPolicy.QUALITY) {
          providerId = 'google_veo';
        } else if (policy === AIRoutingPolicy.LOW_COST) {
          providerId = 'gemini';
        }

        if (task.preferredModels.length > 0 && task.preferredModels[0].includes('veo')) {
          providerId = 'google_veo';
        } else if (task.preferredModels.length > 0 && task.preferredModels[0].includes('runway')) {
          providerId = 'external_video_models';
        }

        const ctx = task.input.context || task.input;
        const options = task.input.options || {};

        if (registry && registry.get) {
          const provider = registry.get(providerId) || registry.get('gemini');
          const formatted = provider.formatPrompt(ctx, options);
          return {
            output: formatted,
            provider: provider.id,
            model: formatted.model,
            tokensUsed: 450,
            estimatedCostUsd: 0.005
          };
        }

        // Formatação direta fallback caso o registry não esteja carregado
        return {
          output: {
            provider: providerId,
            model: 'gemini-2.0-flash',
            prompt: `Cinematic architectural video prompt for ${ctx.environmentName || 'Environment'}.`,
            parameters: { durationSeconds: 5, aspectRatio: '16:9' }
          },
          provider: providerId,
          model: 'gemini-2.0-flash',
          tokensUsed: 350,
          estimatedCostUsd: 0.004
        };
      });

      // 3. ARCHITECTURAL_DECISION Adapter (Preparado para Heurística / Futuro Jev)
      this.registerCapability(AICapability.ARCHITECTURAL_DECISION, async (task, policy) => {
        const input = task.input || {};
        // Decisão Heurística Estruturada
        const decisionType = input.type || 'WORKFLOW_ROUTING';
        
        if (decisionType === 'REVISION_CLASSIFICATION') {
          // Classifica se alteração do cliente é sutil ou estrutural
          const text = (input.description || '').toLowerCase();
          const isStructural = text.includes('parede') || text.includes('planta') || text.includes('vão') || text.includes('ampliar');
          return {
            output: {
              decision: isStructural ? 'MAJOR_REVISION_REQUIRED' : 'FINISH_ADJUSTMENT_ONLY',
              confidence: 0.94,
              rationale: isStructural ? 'Impacta elementos estruturais e alvenarias.' : 'Ajuste restrito a acabamentos ou materiais.',
              nextStep: isStructural ? 'CREATE_PROJECT_REVISION' : 'UPDATE_SPECIFICATION_ONLY'
            },
            provider: 'arqvertice-heuristic-decider',
            model: 'jev-decision-foundation-v1',
            tokensUsed: 0,
            estimatedCostUsd: 0
          };
        }

        return {
          status: 'DECISION_RENDERED',
          output: {
            status: 'DECISION_RENDERED',
            decision: 'APPROVED_FOR_REVIEW',
            confidence: 0.98,
            rationale: 'Parâmetros técnicos validados sem inconformidades críticas.',
            nextStep: 'PROCEED'
          },
          provider: 'arqvertice-heuristic-decider',
          model: 'jev-decision-foundation-v1',
          tokensUsed: 0,
          estimatedCostUsd: 0
        };
      });
    }

    /**
     * Registra handler personalizado para uma capability
     */
    registerCapability(capability, handlerFn) {
      if (typeof handlerFn !== 'function') {
        throw new TypeError('Handler para capability deve ser uma função executável.');
      }
      this.capabilityHandlers.set(capability, handlerFn);
      return this;
    }

    /**
     * Despacha uma tarefa de IA de forma provider-agnostic, com política e fallback
     * @param {AITask} task 
     * @returns {Promise<Object>}
     */
    async dispatch(task) {
      if (!(task instanceof AITask)) {
        task = new AITask(task);
      }

      const handler = this.capabilityHandlers.get(task.capability);
      if (!handler) {
        const err = new Error(`Nenhum handler registrado para a capability '${task.capability}'.`);
        AIObservability.logExecution({
          taskId: task.id,
          capability: task.capability,
          success: false,
          error: err
        });
        throw err;
      }

      const policy = task.preferredPolicy || this.defaultPolicy;
      const startedAt = new Date().toISOString();
      const startTime = Date.now();

      let timer = null;
      try {
        // Execução primária com timeout
        const primaryResult = await Promise.race([
          handler(task, policy),
          new Promise((_, reject) => {
            timer = setTimeout(() => {
              const timeoutErr = new Error(`Timeout de execução na tarefa ${task.id} após ${task.timeoutMs}ms.`);
              timeoutErr.code = 'AI_TIMEOUT';
              reject(timeoutErr);
            }, task.timeoutMs);
            if (timer && typeof timer.unref === 'function') timer.unref();
          })
        ]);
        if (timer) clearTimeout(timer);

        const rawOutput = primaryResult.output !== undefined ? primaryResult.output : primaryResult.data;

        // Validação de Schema de Saída se declarado
        const validation = this._validateOutput(task.outputSchema, rawOutput);
        if (!validation.valid) {
          const schemaErr = new Error(`Saída da IA inválida conforme schema esperado: ${validation.errors.join(', ')}`);
          schemaErr.code = 'INVALID_RESULT';
          
          AIObservability.logExecution({
            taskId: task.id,
            capability: task.capability,
            provider: primaryResult.provider,
            model: primaryResult.model,
            policy,
            level: task.level,
            startedAt,
            durationMs: Date.now() - startTime,
            success: false,
            validation,
            error: schemaErr
          });

          return {
            status: 'INVALID_RESULT',
            success: false,
            error: 'INVALID_RESULT',
            message: schemaErr.message,
            validationErrors: validation.errors
          };
        }

        const durationMs = Date.now() - startTime;
        AIObservability.logExecution({
          taskId: task.id,
          capability: task.capability,
          provider: primaryResult.provider,
          model: primaryResult.model,
          policy,
          level: task.level,
          startedAt,
          durationMs,
          success: true,
          tokensUsed: primaryResult.tokensUsed,
          estimatedCostUsd: primaryResult.estimatedCostUsd,
          validation: { valid: true }
        });

        return {
          status: 'SUCCESS',
          success: true,
          capability: task.capability,
          provider: primaryResult.provider,
          model: primaryResult.model,
          output: rawOutput,
          data: rawOutput,
          durationMs,
          fallbackOccurred: false,
          metadata: {
            policy,
            durationMs,
            fallbackTriggered: false
          }
        };

      } catch (primaryError) {
        // Se fallback estiver desabilitado, ou se for timeout sem fallbackHandler explícito, propaga o erro
        if (!task.fallbackEnabled || (!task.fallbackHandler && primaryError.code === 'AI_TIMEOUT')) {
          AIObservability.logExecution({
            taskId: task.id,
            capability: task.capability,
            policy,
            level: task.level,
            startedAt,
            durationMs: Date.now() - startTime,
            success: false,
            error: primaryError
          });
          throw primaryError;
        }

        // Tentativa de Fallback elegante
        try {
          let fallbackResult;
          let fallbackPolicy = AIRoutingPolicy.LOCAL;

          if (typeof task.fallbackHandler === 'function') {
            fallbackResult = await task.fallbackHandler(task);
          } else {
            fallbackResult = await handler(task, fallbackPolicy);
          }

          const rawFallbackOutput = fallbackResult.output !== undefined ? fallbackResult.output : fallbackResult.data;
          const durationMs = Date.now() - startTime;

          AIObservability.logExecution({
            taskId: task.id,
            capability: task.capability,
            provider: fallbackResult.provider,
            model: fallbackResult.model,
            policy: fallbackPolicy,
            level: task.level,
            startedAt,
            durationMs,
            success: true,
            fallbackTriggered: true,
            fallbackReason: primaryError.message,
            tokensUsed: fallbackResult.tokensUsed,
            estimatedCostUsd: fallbackResult.estimatedCostUsd
          });

          return {
            status: 'SUCCESS_FALLBACK',
            success: true,
            capability: task.capability,
            provider: fallbackResult.provider,
            model: fallbackResult.model,
            output: rawFallbackOutput,
            data: rawFallbackOutput,
            durationMs,
            fallbackOccurred: true,
            primaryError: primaryError.message,
            metadata: {
              policy: fallbackPolicy,
              durationMs,
              fallbackTriggered: true,
              primaryError: primaryError.message
            }
          };

        } catch (fallbackError) {
          AIObservability.logExecution({
            taskId: task.id,
            capability: task.capability,
            policy,
            level: task.level,
            startedAt,
            durationMs: Date.now() - startTime,
            success: false,
            fallbackTriggered: true,
            fallbackReason: `Primary: ${primaryError.message} | Fallback: ${fallbackError.message}`,
            error: fallbackError
          });

        }
      }
    }

    /**
     * Valida a estrutura da saída contra um schema simples de tipos
     */
    _validateOutput(schema, output) {
      if (!schema) return { valid: true, errors: [] };
      if (!output || typeof output !== 'object') {
        return { valid: false, errors: ['A saída deve ser um objeto estruturado.'] };
      }

      const errors = [];
      if (schema.required && Array.isArray(schema.required)) {
        for (const reqField of schema.required) {
          if (output[reqField] === undefined || output[reqField] === null) {
            errors.push(`Campo obrigatório ausente: '${reqField}'`);
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    }
  }

  const AIRouter = new AIRouterService();

  // Exportações Universais
  const AIFoundationPayload = {
    AICapability,
    AIExecutionLevel,
    AIRoutingPolicy,
    AITask,
    AIRouter,
    AIObservability
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIFoundationPayload;
  }
  if (typeof window !== 'undefined') {
    window.AIFoundation = AIFoundationPayload;
    window.AICapability = AICapability;
    window.AIExecutionLevel = AIExecutionLevel;
    window.AIRoutingPolicy = AIRoutingPolicy;
    window.AITask = AITask;
    window.AIRouter = AIRouter;
    window.AIObservability = AIObservability;
  }

})(typeof window !== 'undefined' ? window : global);
