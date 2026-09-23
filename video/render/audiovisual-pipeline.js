/**
 * ============================================================================
 * ARQVERTICE STUDIO — BLOCO I13: PIPELINE AUDIOVISUAL UNIFICADO & VIDEO QA
 * ============================================================================
 * Pipeline determinístico:
 * PROJECT ➔ CONTEXT ➔ AI ANALYSIS ➔ VIDEO OBJECTIVE ➔ JEV ROUTING
 * ➔ VIDEO BRIEF ➔ STORYBOARD ➔ TEMPLATE ➔ REMOTION ➔ RENDER ➔ QA
 * ============================================================================
 */

(function (global) {
  'use strict';

  /**
   * 1. CONSTRUTOR DO VIDEO BRIEF
   */
  const VideoBriefFactory = {
    createBrief(params = {}) {
      return {
        id: params.id || `brief-vid-${Date.now()}`,
        projectId: params.projectId || 'prj-01',
        objective: params.objective || 'Apresentação Executiva do Projeto',
        audience: params.audience || 'Cliente Contratante',
        durationSeconds: params.durationSeconds || 30,
        aspectRatio: params.aspectRatio || '16:9',
        tone: params.tone || 'Sofisticado e Contemplativo',
        sceneOrder: params.sceneOrder || ['INTRO', 'HERO', 'DETAILS', 'OUTRO'],
        assets: params.assets || { renders: [], floorplans: [] },
        textDirectives: params.textDirectives || {
          title: params.title || 'Residência Alphaville',
          architect: 'Eduardo Marques • ArqVértice'
        },
        voiceover: Boolean(params.voiceover),
        musicStyle: params.musicStyle || 'Neo-Clássico Minimalista',
        transitions: params.transitions || 'SLOW_CROSSFADE',
        cta: params.cta || 'ArqVértice • Arquitetura & Engenharia',
        createdAt: new Date().toISOString()
      };
    }
  };

  /**
   * 2. DECISOR JEV AUDIOVISUAL (Decisões Delimitadas)
   */
  const AudiovisualJevRouter = {
    decideTemplateAndFormat(brief) {
      const obj = String(brief.objective || '').toLowerCase();
      const assets = brief.assets || {};

      let templateId = 'EXECUTIVE_CLIENT_PITCH';
      let durationClass = '30S_BALANCED';
      let narrativeRoute = 'EMOTIONAL_ARCHITECTURE';
      let reviewRequired = false;

      // Decisão determinística/heurística baseada no objetivo
      if (obj.includes('social') || obj.includes('reels') || obj.includes('instagram') || brief.aspectRatio === '9:16') {
        templateId = 'REELS_ARCH_IMPACT';
        durationClass = '15S_DYNAMIC';
        narrativeRoute = 'HIGH_IMPACT_HOOK';
      } else if (obj.includes('antes') || obj.includes('reforma') || obj.includes('transforma') || (assets.beforeImage && assets.afterImage)) {
        templateId = 'BEFORE_AFTER_REFORMA';
        durationClass = '20S_PUNCHY';
        narrativeRoute = 'TRANSFORMATION_ARC';
      } else if (obj.includes('material') || obj.includes('acabamento') || obj.includes('t[eé]cnico')) {
        templateId = 'TECHNICAL_MATERIAL_SPECS';
        durationClass = '30S_ANALYTIC';
        narrativeRoute = 'SPECIFICATION_DEEP_DIVE';
      } else if (obj.includes('cinematogr[aá]fico') || obj.includes('golden') || obj.includes('teaser')) {
        templateId = 'CINEMATIC_GOLDEN_HOUR';
        durationClass = '45S_CONTEMPLATIVE';
        narrativeRoute = 'POETIC_SPATIAL_FLOW';
      }

      // Se for entrega final ao cliente, exigir revisão
      if (brief.audience.toLowerCase().includes('cliente') && brief.durationSeconds >= 45) {
        reviewRequired = true;
      }

      return {
        selectedTemplateId: templateId,
        durationClass,
        narrativeRoute,
        reviewRequired,
        aspectRatio: brief.aspectRatio,
        confidence: 0.96,
        reasoning: `Template ${templateId} roteado com base no objetivo "${brief.objective}" e proporção ${brief.aspectRatio}.`
      };
    }
  };

  /**
   * 3. SINTETIZADOR DE ROTEIRO (LLM / Camada Generativa)
   */
  const NarrativeScriptSynthesizer = {
    synthesizeStoryboard(brief, jevDecision) {
      const template = (global.TemplateRegistry && global.TemplateRegistry.get(jevDecision.selectedTemplateId)) || {
        name: 'Template Geral',
        sceneSequence: ['INTRO', 'HERO', 'OUTRO']
      };

      const fps = 30;
      const totalSeconds = brief.durationSeconds || 30;
      const scenesCount = template.sceneSequence.length;
      const durationPerSceneSec = Math.floor(totalSeconds / scenesCount);

      const storyboardScenes = template.sceneSequence.map((seqName, idx) => {
        const isIntro = idx === 0;
        const isOutro = idx === scenesCount - 1;

        let title = `${brief.textDirectives.title}`;
        let sub = isIntro ? 'Concepção Autoral' : (isOutro ? brief.cta : `Perspectiva ${idx}`);

        return {
          sceneIndex: idx + 1,
          type: seqName,
          titleText: title,
          subtitleText: sub,
          durationFrames: durationPerSceneSec * fps,
          cameraMotion: isIntro ? 'SLOW_PUSH_IN' : (isOutro ? 'SLOW_PULL_OUT' : 'SUBTLE_PAN_RIGHT'),
          focalLengthMm: isIntro ? 24 : 35,
          lightingCondition: 'NATURAL_AFTERNOON',
          assetUrl: (brief.assets.renders && brief.assets.renders[idx]) || 'logo.png'
        };
      });

      return {
        storyboardId: `stb-${Date.now()}`,
        templateName: template.name,
        totalScenes: storyboardScenes.length,
        totalFrames: totalSeconds * fps,
        fps,
        seed: 420815, // Seed determinístico para reprodutibilidade
        scenes: storyboardScenes
      };
    }
  };

  /**
   * 4. SERVIÇO DE AUDITORIA E VALIDAÇÃO (VideoQAService)
   */
  const VideoQAService = {
    validateProduction(brief, storyboard, renderConfig = {}) {
      const issues = [];
      const warnings = [];

      // 1. Resolução
      const res = renderConfig.resolution || '1920x1080';
      const [w, h] = res.split('x').map(Number);
      if (w < 1080 || h < 1080) {
        issues.push(`Resolução inferior ao padrão Full HD (${res}).`);
      }

      // 2. FPS
      const fps = storyboard.fps || 30;
      if (fps !== 30 && fps !== 60) {
        warnings.push(`Taxa de quadros (${fps}fps) fora dos padrões 30/60fps recomendados.`);
      }

      // 3. Duração total
      const calculatedSeconds = Math.round(storyboard.totalFrames / fps);
      if (Math.abs(calculatedSeconds - brief.durationSeconds) > 2) {
        issues.push(`Duração do storyboard (${calculatedSeconds}s) diverge do brief (${brief.durationSeconds}s).`);
      }

      // 4. Safe Areas & Tipografia
      storyboard.scenes.forEach((sc, i) => {
        if (!sc.titleText || sc.titleText.length > 50) {
          warnings.push(`Cena ${i + 1}: Título longo pode sofrer corte em telas 9:16.`);
        }
        if (sc.durationFrames < 45) { // < 1.5s
          issues.push(`Cena ${i + 1}: Duração de ${sc.durationFrames} frames (< 1.5s) prejudica legibilidade.`);
        }
      });

      return {
        passed: issues.length === 0,
        score: issues.length === 0 ? (warnings.length === 0 ? 100 : 92) : 60,
        issues,
        warnings,
        qaTimestamp: new Date().toISOString()
      };
    }
  };

  /**
   * 5. MOTOR FIM-A-FIM: EXECUÇÃO COMPLETA DO PIPELINE
   */
  const AudiovisualPipeline = {
    async executePipeline(rawParams = {}) {
      console.log('Iniciando Audiovisual Pipeline ArqVértice (I13)...');

      // 1. Geração do VideoBrief
      const brief = VideoBriefFactory.createBrief(rawParams);

      // 2. Decisão Delimitada via Jev
      const jevDecision = AudiovisualJevRouter.decideTemplateAndFormat(brief);

      // 3. Síntese do Storyboard via LLM
      const storyboard = NarrativeScriptSynthesizer.synthesizeStoryboard(brief, jevDecision);

      // 4. Auditoria Automática (Video QA)
      const qaResult = VideoQAService.validateProduction(brief, storyboard, {
        resolution: brief.aspectRatio === '9:16' ? '1080x1920' : '1920x1080'
      });

      return {
        pipelineStatus: qaResult.passed ? 'READY_FOR_REMOTION_RENDER' : 'QA_VALIDATION_FAILED',
        brief,
        jevDecision,
        storyboard,
        qaResult,
        remotionEntryPoint: 'video/compositions/architectural-cinematic.js'
      };
    }
  };

  // Exportação no escopo global
  global.VideoBriefFactory = VideoBriefFactory;
  global.AudiovisualJevRouter = AudiovisualJevRouter;
  global.NarrativeScriptSynthesizer = NarrativeScriptSynthesizer;
  global.VideoQAService = VideoQAService;
  global.AudiovisualPipeline = AudiovisualPipeline;

})(typeof window !== 'undefined' ? window : global);
