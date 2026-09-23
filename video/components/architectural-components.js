/**
 * ============================================================================
 * ARQVERTICE STUDIO — VIDEO ENGINE: COMPONENTES ARQUITETÔNICOS REMOTION
 * ============================================================================
 * Primitivas visuais e de animação cinematográfica.
 * Compatível tanto com JSX/React nativo quanto com o runtime determinístico
 * do ArqVertice Studio.
 * ============================================================================
 */

(function (global) {
  'use strict';

  // Funções matemáticas canônicas de interpolação do Remotion
  function remotionInterpolate(frame, inputR, outputR, options = {}) {
    const [inStart, inEnd] = inputR;
    const [outStart, outEnd] = outputR;

    let t = (frame - inStart) / (inEnd - inStart);

    if (options.extrapolateLeft === 'clamp') {
      if (t < 0) t = 0;
    }
    if (options.extrapolateRight === 'clamp') {
      if (t > 1) t = 1;
    }

    // Suavização easing cúbica suave para câmeras arquitetônicas
    if (options.easing === 'ease-in-out') {
      t = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    return outStart + (outEnd - outStart) * t;
  }

  const ArchitecturalComponents = {
    interpolate: remotionInterpolate,

    /**
     * Calcula o estilo de transformação de câmera cinematográfica para um dado frame
     */
    calculateCameraTransform(frame, durationInFrames, motionType = 'push_in') {
      let scale = 1.0;
      let translateX = 0;
      let translateY = 0;

      switch (motionType) {
        case 'push_in':
          scale = remotionInterpolate(frame, [0, durationInFrames], [1.0, 1.06], { extrapolateRight: 'clamp' });
          break;
        case 'pull_out':
          scale = remotionInterpolate(frame, [0, durationInFrames], [1.06, 1.0], { extrapolateRight: 'clamp' });
          break;
        case 'pan_left':
          scale = 1.04;
          translateX = remotionInterpolate(frame, [0, durationInFrames], [15, -15], { extrapolateRight: 'clamp' });
          break;
        case 'pan_right':
          scale = 1.04;
          translateX = remotionInterpolate(frame, [0, durationInFrames], [-15, 15], { extrapolateRight: 'clamp' });
          break;
        case 'tilt_up':
          scale = 1.04;
          translateY = remotionInterpolate(frame, [0, durationInFrames], [12, -12], { extrapolateRight: 'clamp' });
          break;
        default:
          scale = 1.0;
      }

      return {
        transform: `scale(${scale.toFixed(4)}) translate3d(${translateX.toFixed(2)}px, ${translateY.toFixed(2)}px, 0)`,
        transition: 'none' // Determinístico frame-a-frame
      };
    },

    /**
     * Calcula opacidade e transição de entrada/saída (Fade)
     */
    calculateFade(frame, durationInFrames, fadeInFrames = 15, fadeOutFrames = 15) {
      if (frame < fadeInFrames) {
        return remotionInterpolate(frame, [0, fadeInFrames], [0, 1], { extrapolateRight: 'clamp' });
      }
      if (frame > durationInFrames - fadeOutFrames) {
        return remotionInterpolate(frame, [durationInFrames - fadeOutFrames, durationInFrames], [1, 0], { extrapolateRight: 'clamp' });
      }
      return 1.0;
    },

    /**
     * Renderiza o carimbo arquitetônico institucional (Brand Titleblock)
     */
    renderBrandTitleblock(videoData, options = {}) {
      const isVertical = videoData.aspectRatio === '9:16';
      const bottom = isVertical ? '48px' : '36px';
      const right = isVertical ? '36px' : '48px';

      return `
        <div class="remotion-titleblock" style="position:absolute; bottom:${bottom}; right:${right}; z-index:40; display:flex; align-items:center; gap:12px; background:rgba(11,17,32,0.85); backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.12); padding:10px 18px; border-radius:8px; pointer-events:none; font-family:'Montserrat',sans-serif;">
          <img src="${videoData.brand.logoUrl}" alt="Logo" style="height:26px; width:auto; filter:brightness(1.1);" onerror="this.style.display='none'">
          <div style="border-left:1px solid rgba(255,255,255,0.2); padding-left:12px;">
            <div style="font-size:11px; font-weight:700; color:#c5a059; letter-spacing:0.08em; text-transform:uppercase;">
              ${videoData.company || 'ArqVértice Studio'}
            </div>
            <div style="font-size:10px; color:#cbd5e1; font-family:'JetBrains Mono',monospace;">
              ${videoData.projectCode} • ${videoData.metadata.version}
            </div>
          </div>
        </div>
      `;
    },

    /**
     * Renderiza a legenda / identificador de ambiente
     */
    renderSceneCaption(scene, frame, durationInFrames) {
      const opacity = this.calculateFade(frame, durationInFrames, 12, 12);
      const translateY = remotionInterpolate(frame, [0, 15], [10, 0], { extrapolateRight: 'clamp' });

      return `
        <div class="remotion-scene-caption" style="position:absolute; bottom:40px; left:48px; z-index:30; opacity:${opacity.toFixed(3)}; transform:translateY(${translateY.toFixed(2)}px); font-family:'Montserrat',sans-serif;">
          <span style="background:rgba(197,160,89,0.2); color:#c5a059; border:1px solid rgba(197,160,89,0.4); padding:3px 10px; border-radius:4px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; display:inline-block; margin-bottom:6px;">
            Cena 0${scene.sceneNumber} • ${scene.environmentName || 'Ambiente'}
          </span>
          <h3 style="margin:0; font-size:24px; font-weight:700; color:#ffffff; text-shadow:0 2px 10px rgba(0,0,0,0.8); letter-spacing:-0.02em;">
            ${scene.title}
          </h3>
          ${scene.description ? `
            <p style="margin:4px 0 0 0; font-size:13px; color:#cbd5e1; text-shadow:0 2px 8px rgba(0,0,0,0.8); max-width:520px; line-height:1.4;">
              ${scene.description}
            </p>
          ` : ''}
        </div>
      `;
    }
  };

  if (typeof window !== 'undefined') {
    window.ArchitecturalComponents = ArchitecturalComponents;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ArchitecturalComponents;
  }
})(typeof window !== 'undefined' ? window : global);
