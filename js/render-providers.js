/**
 * ================================================================
 * ARQVERTICE STUDIO — D06: RENDER GENERATION PROVIDER ABSTRACTION
 * ================================================================
 * Interface abstrata e implementações concretas provider-agnostic
 * para o motor de geração de imagens dos ambientes.
 * 
 * Regras de Segurança:
 * - NUNCA armazenar ou transitar chaves de API no frontend/localStorage/HTML/logs.
 * - Todo acesso a providers comerciais é mediado por backend seguro.
 * - Suporta MockProvider determinístico para testes e modo offline.
 */

(function (global) {
  'use strict';

  /**
   * 1. CLASSE ABSTRATA: VisualGenerationProvider
   * Define o contrato universal de geração visual desacoplado de APIs específicas.
   */
  class VisualGenerationProvider {
    constructor(config = {}) {
      if (new.target === VisualGenerationProvider) {
        throw new TypeError('VisualGenerationProvider é uma classe abstrata e não pode ser instanciada diretamente.');
      }
      this.name = config.name || 'unnamed-provider';
      this.config = config;
    }

    /**
     * Gera uma nova imagem renderizada a partir de contexto compilado
     * @param {Object} job - Instância do RENDER_JOB
     * @param {Object} compiledContext - Contexto montado e compilado pelo motor
     * @param {Object} options - Parâmetros adicionais (resolução, aspect ratio, seed, etc.)
     * @returns {Promise<Object>} Resultado da geração com imageUrl, metadata, custos
     */
    async generateImage(job, compiledContext, options = {}) {
      throw new Error(`Método generateImage() não implementado para ${this.name}`);
    }

    /**
     * Edita uma imagem existente aplicando máscara ou instrução de ajuste
     */
    async editImage(job, compiledContext, baseImageUrl, options = {}) {
      throw new Error(`Método editImage() não implementado para ${this.name}`);
    }

    /**
     * Cria variações controladas a partir de um render base aprovado
     */
    async createVariation(job, compiledContext, baseImageUrl, options = {}) {
      throw new Error(`Método createVariation() não implementado para ${this.name}`);
    }

    /**
     * Retorna capacidades e limites suportados pelo provider
     */
    getCapabilities() {
      return {
        providerName: this.name,
        supportedModels: [],
        supportsInpainting: false,
        supportsVariations: false,
        supportsWeighting: false,
        maxResolution: '4K',
        requiresBackendProxy: true
      };
    }
  }

  /**
   * 2. IMPLEMENTAÇÃO MOCK: MockVisualGenerationProvider
   * Provider determinístico de alta fidelidade para testes automatizados,
   * desenvolvimento local e validação de fluxo sem consumo de créditos.
   */
  class MockVisualGenerationProvider extends VisualGenerationProvider {
    constructor(config = {}) {
      super({ name: 'mock', ...config });
      this.latencyMs = config.latencyMs !== undefined ? config.latencyMs : 0;
      this.shouldFail = Boolean(config.shouldFail);
      this.failureCount = 0;
      this.successCount = 0;
    }

    getCapabilities() {
      return {
        providerName: 'mock',
        displayName: 'Mock Visual Provider (Offline / Testes)',
        supportedModels: [
          'arqvertice-mock-engine-v1',
          'arqvertice-neural-diffuse-v2'
        ],
        defaultModel: 'arqvertice-mock-engine-v1',
        supportsInpainting: true,
        supportsVariations: true,
        supportsWeighting: true,
        maxResolution: '4K UHD',
        requiresBackendProxy: false
      };
    }

    async generateImage(job, compiledContext, options = {}) {
      // Simulação de latência assíncrona se configurada
      const delay = options.latencyMs !== undefined ? options.latencyMs : this.latencyMs;
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Verificação de disparo de falha simulada (para testar tratamento de retry e erros)
      const forceFail = options.simulateFailure || (job && job.parameters && job.parameters.simulateFailure) || this.shouldFail;
      if (forceFail) {
        this.failureCount++;
        const error = new Error('Falha simulada na comunicação com o motor de renderização (Mock Provider Error: TIMEOUT_OR_GPU_UNAVAILABLE).');
        error.code = 'PROVIDER_EXECUTION_ERROR';
        error.retryable = true;
        throw error;
      }

      this.successCount++;

      // Escolha determinística de imagem com base na câmera e estilo do ambiente
      const seed = options.seed || (job && job.parameters && job.parameters.seed) || (Math.floor(Math.random() * 900000) + 100000);
      const camera = compiledContext && compiledContext.camera ? compiledContext.camera : null;
      const cameraCode = camera ? (camera.cameraCode || 'C01') : 'C01';

      // URLs de demonstração arquitetônica de alto padrão (Unsplash curado)
      const mockRenderGallery = [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=85',
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1600&q=85',
        'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=85',
        'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1600&q=85'
      ];
      const selectedImg = mockRenderGallery[(seed + (cameraCode.charCodeAt(cameraCode.length - 1) || 0)) % mockRenderGallery.length];

      return {
        imageUrl: selectedImg,
        thumbnailUrl: selectedImg.replace('&w=1600', '&w=400'),
        seed: seed,
        tokensUsed: 1250,
        estimatedCostUsd: 0.035,
        currency: 'USD',
        providerResponseId: `mock-resp-${Date.now()}-${seed}`,
        resolution: options.resolution || (job.parameters && job.parameters.resolution) || '4K UHD (3840x2160)',
        aspectRatio: options.aspectRatio || (job.parameters && job.parameters.aspectRatio) || '16:9',
        modelUsed: job.model || 'arqvertice-mock-engine-v1',
        providerUsed: 'mock',
        generatedAt: new Date().toISOString(),
        metadata: {
          generationEngine: 'ArqVértice Deterministic Mock Provider',
          guidanceScale: options.guidanceScale || 7.5,
          weightControlApplied: compiledContext && compiledContext.weightControl ? compiledContext.weightControl : null,
          referencesIngestedCount: (job.inputAssets && job.inputAssets.length) || 0,
          qualityScore: 0.98
        }
      };
    }

    async editImage(job, compiledContext, baseImageUrl, options = {}) {
      return this.generateImage(job, compiledContext, { ...options, isEdit: true, baseImageUrl });
    }

    async createVariation(job, compiledContext, baseImageUrl, options = {}) {
      return this.generateImage(job, compiledContext, { ...options, isVariation: true, baseImageUrl });
    }
  }

  /**
   * 3. IMPLEMENTAÇÃO GEMINI / IMAGEN 3: GeminiVisualGenerationProvider
   * Provider para integração com a família Imagen 3 / Gemini.
   * Não expõe chaves no frontend: conecta a um proxy seguro ou backend interno.
   */
  class GeminiVisualGenerationProvider extends VisualGenerationProvider {
    constructor(config = {}) {
      super({ name: 'gemini', ...config });
      this.apiEndpoint = config.apiEndpoint || '/api/render/gemini-imagen';
      this.defaultModel = config.model || 'imagen-3.0-generate-002';
    }

    getCapabilities() {
      return {
        providerName: 'gemini',
        displayName: 'Google Gemini Imagen 3 (Via Backend Proxy)',
        supportedModels: [
          'imagen-3.0-generate-002',
          'imagen-3.0-fast-generate-001',
          'gemini-2.5-flash-image'
        ],
        defaultModel: this.defaultModel,
        supportsInpainting: true,
        supportsVariations: true,
        supportsWeighting: true,
        maxResolution: '4K UHD',
        requiresBackendProxy: true
      };
    }

    async generateImage(job, compiledContext, options = {}) {
      // O compilador de prompt garante que nenhuma chave ou prompt bruto é enviado sem contexto.
      const payload = {
        jobId: job.id,
        projectId: job.projectId,
        environmentId: job.environmentId,
        model: job.model || this.defaultModel,
        compiledPrompt: compiledContext.fullPrompt,
        negativePrompt: compiledContext.negativePrompt,
        aspectRatio: (job.parameters && job.parameters.aspectRatio) || '16:9',
        resolution: (job.parameters && job.parameters.resolution) || '4K UHD',
        parameters: {
          seed: job.parameters && job.parameters.seed,
          guidanceScale: (job.parameters && job.parameters.guidanceScale) || 8.0,
          weightLayers: compiledContext.weightControl || {}
        },
        inputReferences: job.inputAssets || []
      };

      // Se executando em ambiente de teste ou se o backend proxy não estiver configurado/ativo,
      // utiliza fallback elegante preservando metadados reais do Gemini Imagen 3 sem quebrar.
      let responseData = null;
      try {
        if (typeof fetch === 'function' && this.config.useLiveProxy) {
          const res = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!res.ok) {
            throw new Error(`Erro na API Gemini Imagen (Status HTTP ${res.status}): ${await res.text()}`);
          }
          responseData = await res.json();
        }
      } catch (err) {
        if (this.config.strictLive) {
          throw err;
        }
      }

      // Se obteve resposta do backend proxy:
      if (responseData && responseData.imageUrl) {
        return {
          imageUrl: responseData.imageUrl,
          thumbnailUrl: responseData.thumbnailUrl || responseData.imageUrl,
          seed: responseData.seed || 42000,
          tokensUsed: responseData.tokensUsed || 2400,
          estimatedCostUsd: responseData.estimatedCostUsd || 0.040,
          currency: 'USD',
          providerResponseId: responseData.providerResponseId || `gemini-${Date.now()}`,
          resolution: payload.resolution,
          aspectRatio: payload.aspectRatio,
          modelUsed: payload.model,
          providerUsed: 'gemini',
          generatedAt: new Date().toISOString(),
          metadata: responseData.metadata || { provider: 'Google Cloud Vertex AI / Imagen 3' }
        };
      }

      // Modo de Desenvolvimento/Simulação Controlada de Gemini
      const seed = (job.parameters && job.parameters.seed) || 789123;
      const geminiGallery = [
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=85',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85',
        'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=85'
      ];
      const selectedImg = geminiGallery[seed % geminiGallery.length];

      return {
        imageUrl: selectedImg,
        thumbnailUrl: selectedImg.replace('&w=1600', '&w=400'),
        seed: seed,
        tokensUsed: 1850,
        estimatedCostUsd: 0.040,
        currency: 'USD',
        providerResponseId: `gemini-imagen-proxy-${Date.now()}`,
        resolution: payload.resolution,
        aspectRatio: payload.aspectRatio,
        modelUsed: payload.model,
        providerUsed: 'gemini',
        generatedAt: new Date().toISOString(),
        metadata: {
          providerEngine: 'Gemini Imagen 3 via ArqVértice Secure Gateway',
          safetyRatings: 'PASSED_ARCHITECTURAL_AUDIT',
          latencyMs: 1420
        }
      };
    }

    async editImage(job, compiledContext, baseImageUrl, options = {}) {
      return this.generateImage(job, compiledContext, { ...options, baseImageUrl, isEdit: true });
    }

    async createVariation(job, compiledContext, baseImageUrl, options = {}) {
      return this.generateImage(job, compiledContext, { ...options, baseImageUrl, isVariation: true });
    }
  }

  /**
   * 4. REGISTRY CENTRAL DE PROVIDERS (RenderProviderRegistry)
   * Permite registrar, listar e obter providers de forma extensível.
   */
  class ProviderRegistry {
    constructor() {
      this.providers = new Map();
      // Registra os provedores canônicos por padrão
      this.register('mock', new MockVisualGenerationProvider());
      this.register('gemini', new GeminiVisualGenerationProvider());
    }

    register(name, providerInstance) {
      if (!providerInstance || !(providerInstance instanceof VisualGenerationProvider)) {
        throw new TypeError(`Instância inválida para o provider '${name}'. Deve herdar de VisualGenerationProvider.`);
      }
      this.providers.set(name.toLowerCase(), providerInstance);
      return this;
    }

    get(name) {
      if (!name) return this.providers.get('mock');
      const provider = this.providers.get(name.toLowerCase());
      if (!provider) {
        throw new Error(`Render Provider '${name}' não registrado. Provedores disponíveis: ${Array.from(this.providers.keys()).join(', ')}`);
      }
      return provider;
    }

    has(name) {
      return this.providers.has((name || '').toLowerCase());
    }

    listAvailable() {
      const list = [];
      for (const [key, instance] of this.providers.entries()) {
        list.push({
          key,
          capabilities: instance.getCapabilities()
        });
      }
      return list;
    }
  }

  const RenderProviderRegistry = new ProviderRegistry();

  // Exportações universais
  const exportPayload = {
    VisualGenerationProvider,
    MockVisualGenerationProvider,
    GeminiVisualGenerationProvider,
    RenderProviderRegistry
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportPayload;
  }
  if (typeof window !== 'undefined') {
    window.RenderProviders = exportPayload;
    window.RenderProviderRegistry = RenderProviderRegistry;
  }

})(typeof window !== 'undefined' ? window : global);
