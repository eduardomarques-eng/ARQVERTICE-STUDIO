/**
 * ============================================================================
 * ARQVERTICE STUDIO — BLOCO I16: ROTEADOR DE PERFORMANCE, LATÊNCIA & CUSTO
 * ============================================================================
 * Roteamento econômico progressivo:
 * deterministic rule ➔ Jev ➔ small model ➔ large model ➔ vision ➔ tool
 * Orçamentos de latência, Cache LRU, Minimização de Request e Telemetria Transparente.
 * ============================================================================
 */

(function (global) {
  'use strict';

  const ExecutionTier = Object.freeze({
    DETERMINISTIC: 'DETERMINISTIC',
    JEV_DECISION: 'JEV_DECISION',
    SMALL_MODEL: 'SMALL_MODEL',
    LARGE_MODEL: 'LARGE_MODEL',
    VISION: 'VISION',
    SPECIALIZED_TOOL: 'SPECIALIZED_TOOL'
  });

  const LatencyBudgetMs = Object.freeze({
    INSTANT: 50,
    FAST: 300,
    INTERACTIVE: 1500,
    BACKGROUND: 15000,
    LONG_RUNNING: 120000
  });

  /**
   * 1. CACHE INTELIGENTE EM MEMÓRIA COM LRU E TTL
   */
  class IntelligentLRUCache {
    constructor(maxSize = 250, defaultTtlMs = 300000) { // 5 minutos padrão
      this.maxSize = maxSize;
      this.defaultTtlMs = defaultTtlMs;
      this.cache = new Map();
      this.hits = 0;
      this.misses = 0;
    }

    _makeKey(task) {
      if (typeof task === 'string') return task;
      return `${task.capability || 'CAP'}_${task.target || 'TGT'}_${JSON.stringify(task.payload || {})}`;
    }

    get(task) {
      const key = this._makeKey(task);
      const entry = this.cache.get(key);
      if (!entry) {
        this.misses++;
        return null;
      }

      if (Date.now() > entry.expiresAt) {
        this.cache.delete(key);
        this.misses++;
        return null;
      }

      // Reordena no Map para comportamento LRU
      this.cache.delete(key);
      this.cache.set(key, entry);
      this.hits++;
      return entry.value;
    }

    set(task, value, customTtlMs = null) {
      const key = this._makeKey(task);
      const ttl = customTtlMs || this.defaultTtlMs;

      if (this.cache.size >= this.maxSize) {
        // Remove a chave mais antiga (primeira chave do Map)
        const oldestKey = this.cache.keys().next().value;
        this.cache.delete(oldestKey);
      }

      this.cache.set(key, {
        value,
        expiresAt: Date.now() + ttl,
        createdAt: Date.now()
      });
    }

    clear() {
      this.cache.clear();
      this.hits = 0;
      this.misses = 0;
    }

    stats() {
      const total = this.hits + this.misses;
      return {
        size: this.cache.size,
        maxSize: this.maxSize,
        hits: this.hits,
        misses: this.misses,
        hitRatio: total > 0 ? Number((this.hits / total).toFixed(4)) : 0
      };
    }
  }

  const PerformanceCache = new IntelligentLRUCache();

  /**
   * 2. ROTEADOR DE PERFORMANCE & ORÇAMENTOS DE LATÊNCIA
   */
  const AIPerformanceRouter = {
    telemetryHistory: [],

    selectExecutionTier(task = {}) {
      const cap = task.capability || '';
      const text = String(task.rawQuery || task.prompt || '').toLowerCase();

      // 1. Regra Determinística
      if (
        cap === 'BIM_STRUCTURAL_ANALYSIS' ||
        text.includes('quais ambientes') ||
        text.includes('qual material') ||
        text.includes('listar') ||
        text.includes('propriedades de')
      ) {
        return {
          tier: ExecutionTier.DETERMINISTIC,
          budgetMs: LatencyBudgetMs.INSTANT,
          engine: 'BIMQueryEngine / MathEngine',
          reason: 'Consulta estruturada com dados matemáticos e relacionais disponíveis sem ambiguidade.',
          estimatedCostUsd: 0.0000
        };
      }

      // 2. Decisão Heurística Jev
      if (
        cap === 'ARCHITECTURAL_DECISION' ||
        text.includes('qual template') ||
        text.includes('precisa aprovação') ||
        text.includes('escolher opção')
      ) {
        return {
          tier: ExecutionTier.JEV_DECISION,
          budgetMs: LatencyBudgetMs.FAST,
          engine: 'JevDecisionEngine',
          reason: 'Bifurcação lógica e resolução de políticas via matriz ponderada de decisão.',
          estimatedCostUsd: 0.0000
        };
      }

      // 3. Multimodal / Visão
      if (cap === 'VISION_ANALYSIS' || cap === 'IMAGE_ANALYSIS_VISION') {
        return {
          tier: ExecutionTier.VISION,
          budgetMs: LatencyBudgetMs.INTERACTIVE,
          engine: 'VisionMultimodalProvider',
          reason: 'Inspeção de iluminação, texturas e fotorrealismo de imagem ou render.',
          estimatedCostUsd: 0.0025
        };
      }

      // 4. Audiovisual / Ferramenta Especializada
      if (cap === 'VIDEO_RENDER_EXECUTION' || text.includes('renderizar vídeo')) {
        return {
          tier: ExecutionTier.SPECIALIZED_TOOL,
          budgetMs: LatencyBudgetMs.BACKGROUND,
          engine: 'RemotionVideoEngine',
          reason: 'Composição determinística de frames e compilação audiovisual frame-a-frame.',
          estimatedCostUsd: 0.0005
        };
      }

      // 5. Modelo Pequeno / Rápido
      if (cap === 'CLASSIFICATION' || text.length < 60) {
        return {
          tier: ExecutionTier.SMALL_MODEL,
          budgetMs: LatencyBudgetMs.FAST,
          engine: 'FastLLMProvider',
          reason: 'Extração simples e categorização de texto com baixa densidade de tokens.',
          estimatedCostUsd: 0.0002
        };
      }

      // 6. Modelo Avançado / Raciocínio Profundo
      return {
        tier: ExecutionTier.LARGE_MODEL,
        budgetMs: LatencyBudgetMs.INTERACTIVE,
        engine: 'AdvancedLLMProvider',
        reason: 'Síntese arquitetônica de alta complexidade conceitual e narrativa editorial.',
        estimatedCostUsd: 0.0050
      };
    },

    async executeOptimized(task, executionHandler = null) {
      const startTime = Date.now();
      const selection = this.selectExecutionTier(task);

      // Verificação em Cache
      const cachedResult = PerformanceCache.get(task);
      if (cachedResult) {
        const durationMs = Date.now() - startTime;
        const telemetry = this._recordTelemetry({
          task: task.rawQuery || task.capability || 'TASK',
          tier: selection.tier,
          engine: selection.engine,
          reason: `${selection.reason} [HIT DE CACHE]`,
          durationMs,
          costUsd: 0.0000,
          cached: true,
          budgetPassed: durationMs <= selection.budgetMs
        });

        return {
          data: cachedResult,
          telemetry
        };
      }

      // Execução real
      let result = null;
      let costUsd = selection.estimatedCostUsd;

      try {
        if (typeof executionHandler === 'function') {
          result = await executionHandler();
        } else if (selection.tier === ExecutionTier.DETERMINISTIC && global.BIMQueryEngine) {
          result = global.BIMQueryEngine.executeNaturalQuery(task.projectId || 'prj-01', task.rawQuery);
        } else {
          result = { output: `Execução simulada no tier ${selection.tier} via ${selection.engine}.` };
        }

        // Armazena no Cache se for resultado determinístico ou estável
        if (selection.tier === ExecutionTier.DETERMINISTIC || selection.tier === ExecutionTier.JEV_DECISION) {
          PerformanceCache.set(task, result);
        }
      } catch (err) {
        result = { error: String(err.message || err) };
      }

      const durationMs = Date.now() - startTime;
      const telemetry = this._recordTelemetry({
        task: task.rawQuery || task.capability || 'TASK',
        tier: selection.tier,
        engine: selection.engine,
        reason: selection.reason,
        durationMs,
        costUsd,
        cached: false,
        budgetPassed: durationMs <= selection.budgetMs
      });

      return {
        data: result,
        telemetry
      };
    },

    _recordTelemetry(entry) {
      const record = {
        executionId: `tel-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        ...entry
      };
      this.telemetryHistory.unshift(record);
      if (this.telemetryHistory.length > 500) {
        this.telemetryHistory.pop();
      }
      return record;
    },

    getTelemetryHistory(limit = 50) {
      return this.telemetryHistory.slice(0, limit);
    },

    explainSelection(executionId) {
      const item = this.telemetryHistory.find(t => t.executionId === executionId) || this.telemetryHistory[0];
      if (!item) return 'Nenhuma telemetria registrada.';
      return `Esta tarefa foi executada por "${item.engine}" (Tier: ${item.tier}), levando ${item.durationMs}ms com custo de $${item.costUsd.toFixed(4)}. Motivo da escolha: ${item.reason}`;
    }
  };

  // Exportação no escopo global
  global.ExecutionTier = ExecutionTier;
  global.LatencyBudgetMs = LatencyBudgetMs;
  global.PerformanceCache = PerformanceCache;
  global.AIPerformanceRouter = AIPerformanceRouter;

})(typeof window !== 'undefined' ? window : global);
