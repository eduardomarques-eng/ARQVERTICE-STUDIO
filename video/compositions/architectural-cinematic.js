/**
 * ============================================================================
 * ARQVERTICE STUDIO — VIDEO ENGINE: COMPOSIÇÃO CINEMATOGRÁFICA PRINCIPAL
 * (ARCHITECTURAL CINEMATIC COMPOSITION)
 * ============================================================================
 * Composição canônica número 1: Apresentação Cinematográfica do Projeto.
 * Transforma dados reais do projeto (Pedro Albuquerque — Residência de Praia)
 * em uma sequência audiovisual fluida e elegante.
 * ============================================================================
 */

(function (global) {
  'use strict';

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  const ArchitecturalCinematicComposition = {
    id: 'ArchitecturalCinematic',
    name: 'Apresentação Cinematográfica do Projeto',

    _getComponents() {
      if (typeof ArchitecturalComponents !== 'undefined') return ArchitecturalComponents;
      if (typeof window !== 'undefined' && window.ArchitecturalComponents) return window.ArchitecturalComponents;
      if (typeof require !== 'undefined') {
        try { return require('../components/architectural-components.js'); } catch (e) {}
      }
      return null;
    },

    /**
     * Renderiza o frame exato da composição para um dado número de frame
     */
    renderFrame(videoData, currentFrame = 0) {
      const comp = this._getComponents();
      const fps = videoData.fps || 30;
      const scenes = videoData.scenes || [];
      const totalFrames = videoData.durationInFrames;

      // Localiza qual cena está ativa no frame atual
      let accumulatedFrames = 0;
      let activeScene = scenes[0];
      let sceneLocalFrame = currentFrame;
      let activeSceneDurationFrames = Math.round((scenes[0]?.durationSeconds || 5) * fps);

      for (let i = 0; i < scenes.length; i++) {
        const sc = scenes[i];
        const scFrames = Math.round(sc.durationSeconds * fps);
        if (currentFrame >= accumulatedFrames && currentFrame < accumulatedFrames + scFrames) {
          activeScene = sc;
          sceneLocalFrame = currentFrame - accumulatedFrames;
          activeSceneDurationFrames = scFrames;
          break;
        }
        accumulatedFrames += scFrames;
      }

      // Se passou de todas as cenas, fixa na última
      if (currentFrame >= accumulatedFrames && scenes.length > 0) {
        activeScene = scenes[scenes.length - 1];
        activeSceneDurationFrames = Math.round(activeScene.durationSeconds * fps);
        sceneLocalFrame = activeSceneDurationFrames;
      }

      // Calcula câmera e fade da cena ativa
      const camera = comp
        ? comp.calculateCameraTransform(sceneLocalFrame, activeSceneDurationFrames, activeScene.cameraMotion || 'push_in')
        : { transform: 'scale(1.0)' };

      const sceneFade = comp
        ? comp.calculateFade(sceneLocalFrame, activeSceneDurationFrames, 12, 12)
        : 1.0;

      // Overlay de introdução no início
      const isIntro = currentFrame < Math.round(3.5 * fps);
      const introOpacity = isIntro
        ? (comp ? comp.calculateFade(currentFrame, Math.round(3.5 * fps), 15, 15) : 1.0)
        : 0;

      const titleblockHtml = comp ? comp.renderBrandTitleblock(videoData) : '';
      const captionHtml = comp && !isIntro ? comp.renderSceneCaption(activeScene, sceneLocalFrame, activeSceneDurationFrames) : '';

      return `
        <div class="remotion-canvas" style="position:relative; width:${videoData.width}px; height:${videoData.height}px; background:#0b1120; overflow:hidden; font-family:'Montserrat',sans-serif; user-select:none;">
          <!-- CAMADA DE IMAGEM / RENDER COM CÂMERA -->
          <div class="remotion-media-layer" style="position:absolute; inset:0; z-index:10; ${camera.transform}; opacity:${sceneFade.toFixed(3)}; transform-origin:center center;">
            <img src="${activeScene.imageUrl}" alt="${escapeHTML(activeScene.title)}" style="width:100%; height:100%; object-fit:cover; display:block;" onerror="this.src='${videoData.renders[0]?.url || ''}';">
          </div>

          <!-- VINHETA CINEMATOGRÁFICA / GRADIENTE DE LEITURA -->
          <div style="position:absolute; inset:0; z-index:20; background:linear-gradient(to top, rgba(11,17,32,0.85) 0%, rgba(11,17,32,0.2) 40%, rgba(11,17,32,0) 70%), linear-gradient(to bottom, rgba(11,17,32,0.6) 0%, rgba(11,17,32,0) 30%); pointer-events:none;"></div>

          <!-- INTRODUÇÃO INSTITUCIONAL (SE FOR CENA DE ABERTURA) -->
          ${isIntro ? `
            <div class="remotion-intro-overlay" style="position:absolute; inset:0; z-index:35; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; opacity:${introOpacity.toFixed(3)}; background:rgba(11,17,32,0.65); backdrop-filter:blur(8px);">
              <span style="color:#c5a059; font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:0.18em; margin-bottom:12px;">
                ${videoData.company || 'ArqVértice • Arquitetura & Engenharia'}
              </span>
              <h1 style="margin:0 0 10px 0; font-size:48px; font-weight:800; color:#ffffff; letter-spacing:-0.03em; max-width:85%;">
                ${escapeHTML(videoData.projectName)}
              </h1>
              <p style="margin:0; font-size:18px; color:#cbd5e1; font-weight:400; letter-spacing:0.02em;">
                Cliente: <strong style="color:#ffffff;">${escapeHTML(videoData.clientName)}</strong> • ${escapeHTML(videoData.location)}
              </p>
              <div style="margin-top:20px; font-size:12px; color:#94a3b8; font-family:'JetBrains Mono',monospace;">
                Área Construída: ${videoData.builtAreaM2} m² • ${videoData.typology}
              </div>
            </div>
          ` : ''}

          <!-- LEGENDA DA CENA -->
          ${captionHtml}

          <!-- CARIMBO ARQUITETÔNICO INSTITUCIONAL -->
          ${titleblockHtml}

          <!-- BARRA DE SEGURANÇA E PROGRESSO (RODAPÉ DISCRETO) -->
          <div style="position:absolute; bottom:0; left:0; right:0; height:4px; background:rgba(255,255,255,0.08); z-index:50;">
            <div style="height:100%; width:${((currentFrame / totalFrames) * 100).toFixed(2)}%; background:#c5a059;"></div>
          </div>
        </div>
      `;
    }
  };

  if (typeof window !== 'undefined') {
    window.ArchitecturalCinematicComposition = ArchitecturalCinematicComposition;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ArchitecturalCinematicComposition;
  }
})(typeof window !== 'undefined' ? window : global);
