/**
 * ============================================================================
 * ARQVERTICE STUDIO — BLOCO I13: REGISTRO DE TEMPLATES AUDIOVISUAIS (TemplateRegistry)
 * ============================================================================
 * Catálogo canônico de templates por categoria real de arquitetura:
 * architecture, project-presentation, before-after, social, technical,
 * cinematic, portfolio.
 * ============================================================================
 */

(function (global) {
  'use strict';

  const VideoCategory = Object.freeze({
    ARCHITECTURE: 'architecture',
    PROJECT_PRESENTATION: 'project-presentation',
    BEFORE_AFTER: 'before-after',
    SOCIAL: 'social',
    TECHNICAL: 'technical',
    CINEMATIC: 'cinematic',
    PORTFOLIO: 'portfolio'
  });

  const TemplateRegistry = {
    templates: new Map(),

    register(templateConfig) {
      if (!templateConfig.id || !templateConfig.category) {
        throw new Error('Template requer id e category canônica.');
      }
      this.templates.set(templateConfig.id, {
        id: templateConfig.id,
        name: templateConfig.name || templateConfig.id,
        category: templateConfig.category,
        description: templateConfig.description || '',
        defaultDurationSeconds: templateConfig.defaultDurationSeconds || 30,
        aspectRatios: templateConfig.aspectRatios || ['16:9'],
        defaultFps: templateConfig.defaultFps || 30,
        sceneSequence: templateConfig.sceneSequence || ['INTRO', 'CONTENT', 'OUTRO'],
        requiredAssets: templateConfig.requiredAssets || ['renders'],
        defaultPacing: templateConfig.defaultPacing || 'BALANCED', // SLOW, BALANCED, DYNAMIC
        styleTokens: templateConfig.styleTokens || {
          fontTitle: 'var(--font-sans)',
          colorOverlay: 'rgba(0, 0, 0, 0.45)',
          transitionDurationFrames: 15
        }
      });
      return this.templates.get(templateConfig.id);
    },

    get(templateId) {
      return this.templates.get(templateId) || null;
    },

    listByCategory(category) {
      return Array.from(this.templates.values()).filter(t => t.category === category);
    },

    listAll() {
      return Array.from(this.templates.values());
    },

    validateTemplateInput(templateId, inputData = {}) {
      const template = this.get(templateId);
      if (!template) {
        return { valid: false, errors: [`Template "${templateId}" não encontrado.`] };
      }

      const errors = [];
      if (template.requiredAssets.includes('renders') && (!inputData.renders || inputData.renders.length === 0)) {
        errors.push(`Template "${template.name}" requer pelo menos 1 render finalizado.`);
      }
      if (template.requiredAssets.includes('beforeAfter') && (!inputData.beforeImage || !inputData.afterImage)) {
        errors.push(`Template comparativo requer imagem de Antes e Depois.`);
      }
      return {
        valid: errors.length === 0,
        errors
      };
    }
  };

  // --- Registro das 7 Categorias Canônicas do ArqVértice ---

  // 1. Architecture
  TemplateRegistry.register({
    id: 'ARCH_CONCEPT_MANIFESTO',
    name: 'Manifesto Arquitetônico & Partido',
    category: VideoCategory.ARCHITECTURE,
    description: 'Exploração do partido arquitetônico, relação com o terreno, luz zenital e volumetria.',
    defaultDurationSeconds: 45,
    aspectRatios: ['16:9'],
    sceneSequence: ['IMPLANTATION', 'MASSING', 'NATURAL_LIGHT', 'SPATIAL_FLOW', 'ARCHITECTURAL_OUTRO'],
    requiredAssets: ['renders'],
    defaultPacing: 'SLOW'
  });

  // 2. Project Presentation
  TemplateRegistry.register({
    id: 'EXECUTIVE_CLIENT_PITCH',
    name: 'Apresentação Executiva do Cliente',
    category: VideoCategory.PROJECT_PRESENTATION,
    description: 'Narrativa imersiva para alinhamento e aprovação com os clientes.',
    defaultDurationSeconds: 30,
    aspectRatios: ['16:9', '9:16'],
    sceneSequence: ['INTRO_CLIENT', 'HERO_FACADE', 'LIVING_INTEGRATION', 'SUITE_MASTER', 'CLOSING_SPECS'],
    requiredAssets: ['renders'],
    defaultPacing: 'BALANCED'
  });

  // 3. Before-After
  TemplateRegistry.register({
    id: 'BEFORE_AFTER_REFORMA',
    name: 'Transformação: Antes & Depois',
    category: VideoCategory.BEFORE_AFTER,
    description: 'Split vertical/horizontal com slider de transição suave entre estado prévio e projeto executado.',
    defaultDurationSeconds: 20,
    aspectRatios: ['16:9', '9:16', '1:1'],
    sceneSequence: ['BEFORE_STATE', 'SLIDER_WIPE_TRANSITION', 'AFTER_REVEAL', 'METRICS_SUMMARY'],
    requiredAssets: ['beforeAfter'],
    defaultPacing: 'DYNAMIC'
  });

  // 4. Social
  TemplateRegistry.register({
    id: 'REELS_ARCH_IMPACT',
    name: 'Reels / Stories de Alto Impacto',
    category: VideoCategory.SOCIAL,
    description: 'Formato vertical 9:16 com cortes dinâmicos sincronizados para redes sociais.',
    defaultDurationSeconds: 15,
    aspectRatios: ['9:16'],
    sceneSequence: ['HOOK_FAST', 'LIGHT_DETAIL', 'MATERIAL_ZOOM', 'PANORAMA_PULL', 'STUDIO_BRANDING'],
    requiredAssets: ['renders'],
    defaultPacing: 'DYNAMIC'
  });

  // 5. Technical
  TemplateRegistry.register({
    id: 'TECHNICAL_MATERIAL_SPECS',
    name: 'Memorial Técnico de Materiais & Luz',
    category: VideoCategory.TECHNICAL,
    description: 'Foco analítico em paginação de pedras, marcenaria detalhada e luminotécnica.',
    defaultDurationSeconds: 30,
    aspectRatios: ['16:9'],
    sceneSequence: ['SPEC_COVER', 'FLOORING_PAGINATION', 'JOINERY_DETAILS', 'LIGHTING_CCT', 'TECHNICAL_SHEET'],
    requiredAssets: ['renders'],
    defaultPacing: 'SLOW'
  });

  // 6. Cinematic
  TemplateRegistry.register({
    id: 'CINEMATIC_GOLDEN_HOUR',
    name: 'Percurso Cinematográfico Golden Hour',
    category: VideoCategory.CINEMATIC,
    description: 'Tomadas contemplativas em câmera lenta com iluminação poente e trilha acústica.',
    defaultDurationSeconds: 45,
    aspectRatios: ['16:9', '9:16'],
    sceneSequence: ['WIDE_AERIAL', 'PUSH_IN_LIVING', 'LIGHT_SHADOW_PLAY', 'OUTDOOR_POOL', 'TWILIGHT_FINALE'],
    requiredAssets: ['renders'],
    defaultPacing: 'SLOW'
  });

  // 7. Portfolio
  TemplateRegistry.register({
    id: 'PORTFOLIO_CASE_STUDY',
    name: 'Estudo de Caso do Portfólio',
    category: VideoCategory.PORTFOLIO,
    description: 'Resumo institucional de obra concluída com ficha técnica de engenharia e arquitetura.',
    defaultDurationSeconds: 60,
    aspectRatios: ['16:9'],
    sceneSequence: ['COVER_CASE', 'LOCATION_CHALLENGE', 'ARCHITECTURAL_SOLUTION', 'EXECUTION_RESULTS', 'CREDITS'],
    requiredAssets: ['renders'],
    defaultPacing: 'BALANCED'
  });

  // Exportação no escopo global
  global.VideoCategory = VideoCategory;
  global.TemplateRegistry = TemplateRegistry;

})(typeof window !== 'undefined' ? window : global);
