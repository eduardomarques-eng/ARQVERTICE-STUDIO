/**
 * ============================================================================
 * ARQVERTICE STUDIO — BLOCO G07: VIDEO PROMPT ENGINE (PROVIDER ABSTRACTION)
 * ============================================================================
 * Arquitetura Provider-Agnostic para geração de prompts audiovisuais.
 * 
 * Regras Fundamentais:
 * 1. O ArqVertice Studio não fica preso a um único fornecedor.
 * 2. Não assumir que todas as APIs possuem as mesmas capacidades (Capacities Matrix).
 * 3. Preparar interfaces para:
 *    - Gemini
 *    - Google Flow / Veo (quando disponível)
 *    - Outros modelos de vídeo (Runway, Luma, Kling)
 *    - Ferramentas externas (Midjourney, ComfyUI, ControlNet)
 *    - Geração local futura (Wan 2.1, Stable Video Diffusion)
 * ============================================================================
 */

(function (global) {
  'use strict';

  /**
   * Classe Base Abstrata para Provedores de Prompt de Vídeo
   */
  class VideoPromptProvider {
    constructor(config = {}) {
      if (new.target === VideoPromptProvider) {
        throw new TypeError('VideoPromptProvider é uma classe abstrata e não pode ser instanciada diretamente.');
      }
      this.id = config.id || 'unnamed-provider';
      this.displayName = config.displayName || this.id;
      this.config = config;
    }

    /**
     * Retorna a matriz de capacidades do provedor
     */
    getCapabilities() {
      return {
        providerId: this.id,
        displayName: this.displayName,
        supportedModels: [],
        supportsNegativePrompt: false,
        supportsReferenceImage: true,
        supportsCameraControl: false,
        supportsMotionStrength: false,
        supportsDirectVideoGeneration: false,
        supportsLocalExecution: false,
        requiresExternalToolExport: false,
        maxDurationSeconds: 10,
        supportedAspectRatios: ['16:9', '9:16', '1:1', '4:5', '21:9']
      };
    }

    /**
     * Adapta e formata o contexto compilado para a sintaxe específica do modelo
     * @param {Object} compiledContext 
     * @param {Object} options 
     */
    formatPrompt(compiledContext, options = {}) {
      throw new Error(`Método formatPrompt() não implementado para ${this.id}`);
    }
  }

  /**
   * 1. PROVIDER: Google Gemini
   */
  class GeminiVideoPromptProvider extends VideoPromptProvider {
    constructor(config = {}) {
      super({
        id: 'gemini',
        displayName: 'Google Gemini Multimodal Video Engine',
        ...config
      });
    }

    getCapabilities() {
      return {
        providerId: this.id,
        displayName: this.displayName,
        supportedModels: ['gemini-2.0-flash', 'gemini-1.5-pro-vision'],
        defaultModel: 'gemini-2.0-flash',
        supportsNegativePrompt: false, // Em Gemini, restrições são incorporadas em linguagem natural
        supportsReferenceImage: true,
        supportsCameraControl: true,
        supportsMotionStrength: false,
        supportsDirectVideoGeneration: false,
        supportsLocalExecution: false,
        requiresExternalToolExport: false,
        maxDurationSeconds: 60,
        supportedAspectRatios: ['16:9', '9:16', '1:1', '4:5', '21:9']
      };
    }

    formatPrompt(ctx, options = {}) {
      const model = options.model || this.getCapabilities().defaultModel;
      const locks = (ctx.locks || []).map(l => `- DO NOT ALTER: ${l}`).join('\n');

      const masterPrompt = [
        `[ARCHITECTURAL CINEMATOGRAPHY DIRECTIVE]`,
        `Project: ${ctx.projectName} (${ctx.architecturalStyle || 'Contemporary Architecture'})`,
        `Environment: ${ctx.environmentName} (${ctx.environmentFunction || 'Living'})`,
        `Scene Purpose: ${ctx.scenePurpose || 'Spatial Presentation'}`,
        ``,
        `[SPATIAL COMPOSITION & LIGHTING]`,
        `${ctx.mainDescription}`,
        `Lighting: ${ctx.lightingDirection || 'Natural daylight, soft ambient bounce, 2700K warm accents'}.`,
        `Materiality: ${ctx.materialsSummary || 'High-end authentic architectural finishes'}.`,
        ``,
        `[CAMERA & KINETIC CHOREOGRAPHY]`,
        `Camera Framing: ${ctx.cameraFraming || 'Eye-level realistic perspective, architectural 35mm lens'}.`,
        `Kinetic Movement: ${ctx.cameraMovement || 'Slow steady cinematic glide'}.`,
        `Pacing: ${ctx.durationSeconds || 5}s duration, smooth temporal consistency.`,
        ``,
        `[CRITICAL ARCHITECTURAL CONSTRAINTS - STRICT LOCKS]`,
        locks || 'Preserve structural geometry and furniture layout without distortion.',
        `Negative Constraints: Avoid warped perspectives, floating furniture, flickering textures, impossible architectural proportions, deformed lines.`
      ].join('\n');

      return {
        provider: this.id,
        model,
        prompt: masterPrompt,
        negativePrompt: null, // Gemini usa restrições incorporadas
        parameters: {
          aspectRatio: ctx.aspectRatio || '16:9',
          durationSeconds: ctx.durationSeconds || 5,
          temperature: 0.2,
          fps: 24
        }
      };
    }
  }

  /**
   * 2. PROVIDER: Google Flow / Veo (Quando disponível)
   */
  class GoogleVeoPromptProvider extends VideoPromptProvider {
    constructor(config = {}) {
      super({
        id: 'google_veo',
        displayName: 'Google Flow / Veo (Architectural Cinema Engine)',
        ...config
      });
    }

    getCapabilities() {
      return {
        providerId: this.id,
        displayName: this.displayName,
        supportedModels: ['veo-2.0', 'veo-1.0'],
        defaultModel: 'veo-2.0',
        supportsNegativePrompt: true,
        supportsReferenceImage: true,
        supportsCameraControl: true,
        supportsMotionStrength: true,
        supportsDirectVideoGeneration: true,
        supportsLocalExecution: false,
        requiresExternalToolExport: false,
        maxDurationSeconds: 60,
        supportedAspectRatios: ['16:9', '9:16', '1:1', '21:9']
      };
    }

    formatPrompt(ctx, options = {}) {
      const model = options.model || this.getCapabilities().defaultModel;
      const movementToken = `[Camera: ${ctx.cameraMovement || 'Steady Dolly Forward'}]`;
      const lensToken = `[Lens: ${ctx.lensFocal || '35mm anamorphic'}]`;

      const prompt = [
        `Cinematic architectural documentary shot of ${ctx.environmentName} in ${ctx.projectName}.`,
        `${ctx.mainDescription}`,
        `${movementToken} ${lensToken}, photorealistic, pristine architectural detail, natural 2700K warm interior illumination balancing soft window exterior light.`,
        `Materials: ${ctx.materialsSummary}.`,
        `Locks Enforced: ${ctx.locks ? ctx.locks.join(', ') : 'Fixed architecture, realistic physics'}.`
      ].join(' ');

      const negativePrompt = [
        'morphing geometry, altering floor plan, shifting walls, changing furniture design,',
        'blurry textures, temporal jitter, low resolution, artificial distortion, cartoon, saturated colors'
      ].join(' ');

      return {
        provider: this.id,
        model,
        prompt,
        negativePrompt,
        parameters: {
          aspectRatio: ctx.aspectRatio || '16:9',
          durationSeconds: ctx.durationSeconds || 5,
          motionStrength: 4, // 1 a 10
          frameRate: 24,
          seed: ctx.seed || Math.floor(Math.random() * 1000000)
        }
      };
    }
  }

  /**
   * 3. PROVIDER: Outros Modelos de Vídeo (Runway Gen-3, Luma Dream Machine, Kling)
   */
  class ExternalVideoModelsProvider extends VideoPromptProvider {
    constructor(config = {}) {
      super({
        id: 'external_video_models',
        displayName: 'Modelos Comerciais de Vídeo (Runway Gen-3 / Luma / Kling)',
        ...config
      });
    }

    getCapabilities() {
      return {
        providerId: this.id,
        displayName: this.displayName,
        supportedModels: ['runway-gen3-alpha', 'luma-dream-machine-v1.5', 'kling-v1.5-pro'],
        defaultModel: 'runway-gen3-alpha',
        supportsNegativePrompt: true,
        supportsReferenceImage: true,
        supportsCameraControl: true,
        supportsMotionStrength: true,
        supportsDirectVideoGeneration: true,
        supportsLocalExecution: false,
        requiresExternalToolExport: false,
        maxDurationSeconds: 10,
        supportedAspectRatios: ['16:9', '9:16', '1:1']
      };
    }

    formatPrompt(ctx, options = {}) {
      const model = options.model || this.getCapabilities().defaultModel;

      const prompt = [
        `4K ultra-realistic architectural interior, ${ctx.environmentName}, ${ctx.projectName}.`,
        `${ctx.mainDescription}.`,
        `Movement: ${ctx.cameraMovement}, smooth dolly, steady gimbal.`,
        `Authentic finishes: ${ctx.materialsSummary}.`,
        `Lighting: high dynamic range architectural rendering, photoreal.`
      ].join(' ');

      const negativePrompt = 'glitch, morphing walls, changing furniture, blurry, shaky cam, low quality, unnatural shifts';

      return {
        provider: this.id,
        model,
        prompt,
        negativePrompt,
        parameters: {
          aspectRatio: ctx.aspectRatio || '16:9',
          durationSeconds: Math.min(10, ctx.durationSeconds || 5),
          motionStrength: 5,
          guidanceScale: 7.5,
          interpolateFrames: true
        }
      };
    }
  }

  /**
   * 4. PROVIDER: Ferramentas Externas & Exportação Manual (Midjourney, ComfyUI, ControlNet)
   */
  class ExternalToolsProvider extends VideoPromptProvider {
    constructor(config = {}) {
      super({
        id: 'external_tools',
        displayName: 'Ferramentas Externas & Exportação Manual (ComfyUI / Midjourney)',
        ...config
      });
    }

    getCapabilities() {
      return {
        providerId: this.id,
        displayName: this.displayName,
        supportedModels: ['comfyui-workflow-export', 'midjourney-video-export', 'controlnet-depth-pipeline'],
        defaultModel: 'comfyui-workflow-export',
        supportsNegativePrompt: true,
        supportsReferenceImage: true,
        supportsCameraControl: true,
        supportsMotionStrength: true,
        supportsDirectVideoGeneration: false,
        supportsLocalExecution: false,
        requiresExternalToolExport: true, // Exporta manifesto/CLI pronto para copiar
        maxDurationSeconds: 30,
        supportedAspectRatios: ['16:9', '9:16', '1:1', '4:5', '21:9']
      };
    }

    formatPrompt(ctx, options = {}) {
      const model = options.model || this.getCapabilities().defaultModel;
      const arParam = (ctx.aspectRatio || '16:9').replace(':', ':');

      const prompt = [
        `ultra-photoreal architectural render of ${ctx.environmentName}, ${ctx.projectName},`,
        `${ctx.mainDescription},`,
        `camera motion: ${ctx.cameraMovement}, 35mm lens, f/8, 24fps cinematic,`,
        `materials: ${ctx.materialsSummary},`,
        `--ar ${arParam} --motion 4 --chaos 0 --no distortion, morphing, blurry`
      ].join(' ');

      const negativePrompt = 'morphing, structural changes, furniture displacement, lens flares, cartoon, artifacting';

      return {
        provider: this.id,
        model,
        prompt,
        negativePrompt,
        parameters: {
          aspectRatio: ctx.aspectRatio || '16:9',
          durationSeconds: ctx.durationSeconds || 5,
          exportManifest: true,
          copyPasteReady: true
        }
      };
    }
  }

  /**
   * 5. PROVIDER: Geração Local Futura (Wan 2.1 / SVD / AnimateDiff)
   */
  class LocalVideoGenerationProvider extends VideoPromptProvider {
    constructor(config = {}) {
      super({
        id: 'local_generator',
        displayName: 'Geração Local Futura (Wan 2.1 / Stable Video Diffusion)',
        ...config
      });
    }

    getCapabilities() {
      return {
        providerId: this.id,
        displayName: this.displayName,
        supportedModels: ['wan-2.1-i2v-14b', 'svd-xt-1.1', 'animatediff-motion-v3'],
        defaultModel: 'wan-2.1-i2v-14b',
        supportsNegativePrompt: true,
        supportsReferenceImage: true,
        supportsCameraControl: true,
        supportsMotionStrength: true,
        supportsDirectVideoGeneration: true,
        supportsLocalExecution: true,
        requiresExternalToolExport: false,
        maxDurationSeconds: 15,
        supportedAspectRatios: ['16:9', '9:16', '1:1']
      };
    }

    formatPrompt(ctx, options = {}) {
      const model = options.model || this.getCapabilities().defaultModel;

      const prompt = [
        `masterpiece, architectural high-end visualization, ${ctx.environmentName}, ${ctx.projectName}.`,
        `${ctx.mainDescription}.`,
        `motion: ${ctx.cameraMovement}, smooth continuous temporal interpolation.`,
        `materials: ${ctx.materialsSummary}.`,
        `locks: strict geometry preservation.`
      ].join(' ');

      const negativePrompt = 'deformed, morphing, low resolution, bad hands, noisy, flickering, unstable lines';

      return {
        provider: this.id,
        model,
        prompt,
        negativePrompt,
        parameters: {
          aspectRatio: ctx.aspectRatio || '16:9',
          durationSeconds: Math.min(15, ctx.durationSeconds || 5),
          steps: 35,
          cfgScale: 7.0,
          motionBucketId: 127,
          fps: 24,
          localEndpoint: 'http://localhost:8188/api/generate'
        }
      };
    }
  }

  /**
   * Registry de Provedores de Vídeo
   */
  class VideoPromptProviderRegistry {
    constructor() {
      this.providers = new Map();
      this.initDefaultProviders();
    }

    initDefaultProviders() {
      this.register(new GeminiVideoPromptProvider());
      this.register(new GoogleVeoPromptProvider());
      this.register(new ExternalVideoModelsProvider());
      this.register(new ExternalToolsProvider());
      this.register(new LocalVideoGenerationProvider());
    }

    register(providerInstance) {
      if (!(providerInstance instanceof VideoPromptProvider)) {
        throw new TypeError('Instância deve herdar de VideoPromptProvider.');
      }
      this.providers.set(providerInstance.id, providerInstance);
    }

    get(id) {
      return this.providers.get(id) || null;
    }

    list() {
      return Array.from(this.providers.values()).map(p => ({
        id: p.id,
        displayName: p.displayName,
        capabilities: p.getCapabilities()
      }));
    }

    getCapabilities(id) {
      const p = this.get(id);
      return p ? p.getCapabilities() : null;
    }
  }

  // Instância singleton global
  const videoPromptRegistry = new VideoPromptProviderRegistry();

  const VideoPromptModuleExports = {
    VideoPromptProvider,
    GeminiVideoPromptProvider,
    GoogleVeoPromptProvider,
    ExternalVideoModelsProvider,
    ExternalToolsProvider,
    LocalVideoGenerationProvider,
    VideoPromptProviderRegistry,
    videoPromptRegistry
  };

  if (typeof window !== 'undefined') {
    window.VideoPromptModuleExports = VideoPromptModuleExports;
    window.videoPromptRegistry = videoPromptRegistry;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = VideoPromptModuleExports;
  }

})(typeof window !== 'undefined' ? window : global);
