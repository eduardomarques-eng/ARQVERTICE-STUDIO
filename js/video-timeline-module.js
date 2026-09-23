/**
 * ============================================================================
 * ARQVERTICE STUDIO — BLOCO G12: VIDEO TIMELINE EDITOR
 * ============================================================================
 * Editor visual básico de vídeo com timeline multi-faixa.
 *
 * NÃO tenta recriar Premiere, DaVinci Resolve ou After Effects.
 * Objetivo: timeline simples para montagem do projeto.
 *
 * FAIXAS (TRACKS):
 * ┌─────────────────────────────────────────────────────┐
 * │  VIDEO       ──  Clipes de vídeo / renders / imagens │
 * │  AUDIO       ──  Trilhas sonoras / efeitos sonoros   │
 * │  VOICE       ──  Narração / locução / voiceover      │
 * │  TEXT        ──  Legendas / overlays de texto         │
 * │  TRANSITIONS ──  Transições entre clipes de vídeo    │
 * └─────────────────────────────────────────────────────┘
 *
 * OPERAÇÕES (NÃO DESTRUTIVAS):
 * - mover, cortar, duplicar, excluir, ajustar duração, reorganizar
 *
 * METADADOS EXIBIDOS:
 * - Duração Total, FPS, Resolução, Proporção
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

  const VideoTimelineModule = {
    activeVideoId: null,
    activeTimelineId: null,
    selectedClipId: null,
    previewCurrentTime: 0,
    isPreviewPlaying: false,
    previewTimer: null,
    pixelsPerSecond: 60,

    _getState() {
      return typeof StudioState !== 'undefined' ? StudioState : (global.StudioState || null);
    },

    /**
     * Renderiza a interface completa do Timeline Editor
     */
    render(videoProjectId) {
      const state = this._getState();
      if (!state) return '<div class="alert alert-danger">StudioState não inicializado.</div>';

      const video = state.getVideoProject(videoProjectId);
      if (!video) return '<div class="alert alert-warning">Selecione ou crie um projeto de vídeo para abrir o Timeline Editor.</div>';

      this.activeVideoId = video.id;

      // Auto-criar timeline se não existir
      let timeline = state.getProjectTimeline(video.id);
      if (!timeline) {
        // Tentar gerar a partir do storyboard automaticamente
        const frames = state.getStoryboardFrames(video.id);
        if (frames.length > 0) {
          timeline = state.generateTimelineFromStoryboard(video.id, { user: 'Timeline Editor Auto' });
        } else {
          timeline = state.createTimeline({ videoProjectId: video.id, user: 'Timeline Editor Auto' });
        }
      }

      this.activeTimelineId = timeline.id;
      const metadata = state.getTimelineMetadata(timeline.id);
      const previewData = state.getTimelinePreviewData(timeline.id);

      return `
        <div class="timeline-editor-container" id="timeline-editor-container" style="background: #0f172a; border-radius: 12px; padding: 20px; color: #e2e8f0;">
          <!-- Cabeçalho & Metadados -->
          ${this._renderHeader(timeline, metadata)}

          <!-- Controles de Preview -->
          ${this._renderPreviewControls(metadata)}

          <!-- Timeline Visual Multi-Faixa -->
          ${this._renderTimeline(previewData, state)}

          <!-- Painel de Edição do Clipe Selecionado -->
          ${this._renderClipEditor(state)}

          <!-- Rodapé com Informações Técnicas -->
          ${this._renderFooter(metadata)}
        </div>
      `;
    },

    _renderHeader(timeline, metadata) {
      return `
        <div class="timeline-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #1e293b;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
              <i data-lucide="film" style="width: 20px; height: 20px; color: #fff;"></i>
            </div>
            <div>
              <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: #f1f5f9;">${escapeHTML(timeline.title)}</h3>
              <p style="margin: 0; font-size: 12px; color: #64748b;">Timeline Editor — Bloco G12 • Edição Não Destrutiva</p>
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button onclick="VideoTimelineModule.regenerateFromStoryboard()" 
                    style="padding: 6px 14px; background: #1e293b; border: 1px solid #334155; border-radius: 6px; color: #94a3b8; font-size: 12px; cursor: pointer;"
                    title="Regerar timeline a partir do storyboard atual">
              ↻ Regerar do Storyboard
            </button>
            <span style="padding: 4px 10px; background: ${timeline.isLocked ? '#dc2626' : '#059669'}; border-radius: 6px; font-size: 11px; color: #fff; display: flex; align-items: center;">
              ${timeline.isLocked ? '🔒 Bloqueada' : '✏️ Editável'}
            </span>
          </div>
        </div>
      `;
    },

    _renderPreviewControls(metadata) {
      const dur = metadata.totalDurationFormatted || '00:00.00';
      const currentFormatted = this._formatTime(this.previewCurrentTime);
      return `
        <div class="timeline-preview-bar" style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px; padding: 10px 16px; background: #1e293b; border-radius: 8px;">
          <button onclick="VideoTimelineModule.togglePreview()" 
                  style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px;"
                  title="${this.isPreviewPlaying ? 'Pausar' : 'Reproduzir'} Preview">
            ${this.isPreviewPlaying ? '❚❚' : '▶'}
          </button>
          <button onclick="VideoTimelineModule.stopPreview()"
                  style="width: 28px; height: 28px; border-radius: 4px; background: #334155; border: none; color: #94a3b8; cursor: pointer; font-size: 10px;"
                  title="Parar">■</button>
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #e2e8f0; min-width: 160px;">
            <span style="color: #6366f1;">${currentFormatted}</span>
            <span style="color: #475569;"> / </span>
            <span>${dur}</span>
          </div>
          <div style="flex: 1; height: 4px; background: #334155; border-radius: 2px; position: relative; cursor: pointer;" onclick="VideoTimelineModule.seekPreview(event)">
            <div style="width: ${metadata.totalDurationSeconds > 0 ? (this.previewCurrentTime / metadata.totalDurationSeconds * 100) : 0}%; height: 100%; background: linear-gradient(90deg, #6366f1, #8b5cf6); border-radius: 2px;"></div>
          </div>
          <div style="display: flex; gap: 12px; font-size: 11px; color: #64748b;">
            <span title="Duração Total">⏱ ${dur}</span>
            <span title="Frames por segundo">🎞 ${metadata.fps} FPS</span>
            <span title="Resolução">${metadata.resolution}</span>
            <span title="Proporção">⬜ ${metadata.aspectRatio}</span>
          </div>
        </div>
      `;
    },

    _renderTimeline(previewData, state) {
      if (!previewData || !previewData.metadata) {
        return '<div style="text-align: center; padding: 40px; color: #64748b;">Timeline vazia. Crie cenas no Storyboard primeiro.</div>';
      }

      const tracks = state.TIMELINE_TRACKS || ['VIDEO', 'AUDIO', 'VOICE', 'TEXT', 'TRANSITIONS'];
      const trackConfig = state.TIMELINE_TRACK_CONFIG || {};
      const totalDuration = previewData.metadata.totalDurationSeconds || 60;
      const timelineWidth = totalDuration * this.pixelsPerSecond;

      // Régua de tempo
      let rulerTicks = '';
      const tickInterval = totalDuration > 120 ? 10 : (totalDuration > 30 ? 5 : 1);
      for (let t = 0; t <= totalDuration; t += tickInterval) {
        const x = t * this.pixelsPerSecond;
        rulerTicks += `<div style="position: absolute; left: ${x}px; top: 0; height: 20px; border-left: 1px solid #334155; font-size: 9px; color: #64748b; padding-left: 4px; font-family: 'JetBrains Mono', monospace;">${this._formatTime(t)}</div>`;
      }

      // Playhead
      const playheadX = this.previewCurrentTime * this.pixelsPerSecond;

      let tracksHTML = '';
      tracks.forEach(trackName => {
        const config = trackConfig[trackName] || { label: trackName, color: '#6366f1' };
        const clips = (previewData.tracks[trackName] || []).sort((a, b) => a.positionSeconds - b.positionSeconds);
        const trackSummary = previewData.metadata.tracks[trackName] || { count: 0 };

        let clipsHTML = '';
        clips.forEach(clip => {
          const left = clip.positionSeconds * this.pixelsPerSecond;
          const width = Math.max(clip.durationSeconds * this.pixelsPerSecond, 20);
          const isSelected = clip.id === this.selectedClipId;
          const borderStyle = isSelected ? `3px solid #f1f5f9` : `1px solid ${config.color}44`;

          clipsHTML += `
            <div class="timeline-clip" 
                 onclick="VideoTimelineModule.selectClip('${clip.id}')"
                 style="position: absolute; left: ${left}px; width: ${width}px; height: 36px; 
                        background: ${config.color}22; border: ${borderStyle}; border-radius: 4px; 
                        cursor: pointer; overflow: hidden; display: flex; align-items: center; padding: 0 6px;
                        transition: all 0.15s ease; ${isSelected ? 'box-shadow: 0 0 12px ' + config.color + '44;' : ''}"
                 title="${escapeHTML(clip.sourceLabel)} (${clip.durationSeconds}s)">
              <span style="font-size: 10px; color: ${config.color}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${escapeHTML(clip.sourceLabel)}
              </span>
            </div>
          `;
        });

        tracksHTML += `
          <div class="timeline-track" style="display: flex; margin-bottom: 2px;">
            <div class="track-label" style="width: 110px; min-width: 110px; padding: 8px 10px; background: #1e293b; border-radius: 4px 0 0 4px; display: flex; align-items: center; gap: 6px; border-right: 2px solid ${config.color};">
              <span style="font-size: 10px; font-weight: 600; color: ${config.color}; text-transform: uppercase; letter-spacing: 0.5px;">${escapeHTML(config.label)}</span>
              <span style="font-size: 9px; color: #475569;">(${trackSummary.count})</span>
            </div>
            <div class="track-lane" style="flex: 1; min-height: 44px; background: #0f172a; border: 1px solid #1e293b; border-radius: 0 4px 4px 0; position: relative; overflow-x: auto;">
              <div style="position: relative; width: ${timelineWidth}px; height: 44px; padding: 4px 0;">
                ${clipsHTML}
              </div>
            </div>
          </div>
        `;
      });

      return `
        <div class="timeline-body" style="margin-bottom: 16px; border: 1px solid #1e293b; border-radius: 8px; overflow: hidden; background: #0a0f1a;">
          <!-- Régua de Tempo -->
          <div style="display: flex;">
            <div style="width: 110px; min-width: 110px; background: #1e293b; padding: 4px 10px; display: flex; align-items: center;">
              <span style="font-size: 10px; color: #475569; font-family: 'JetBrains Mono', monospace;">00:00</span>
            </div>
            <div style="flex: 1; height: 24px; background: #0f172a; position: relative; overflow-x: auto; border-bottom: 1px solid #1e293b;">
              <div style="position: relative; width: ${timelineWidth}px; height: 100%;">
                ${rulerTicks}
                <!-- Playhead -->
                <div style="position: absolute; left: ${playheadX}px; top: 0; height: 100%; width: 2px; background: #ef4444; z-index: 10; pointer-events: none;">
                  <div style="width: 8px; height: 8px; background: #ef4444; border-radius: 0 0 4px 4px; position: absolute; top: 0; left: -3px;"></div>
                </div>
              </div>
            </div>
          </div>
          <!-- Faixas -->
          ${tracksHTML}
        </div>
      `;
    },

    _renderClipEditor(state) {
      if (!this.selectedClipId) {
        return `
          <div style="padding: 16px; background: #1e293b; border-radius: 8px; text-align: center; color: #64748b; font-size: 13px; margin-bottom: 12px;">
            Selecione um clipe na timeline para editar suas propriedades.
          </div>
        `;
      }

      const clip = state.getTimelineClip(this.selectedClipId);
      if (!clip) {
        this.selectedClipId = null;
        return '';
      }

      const trackConfig = state.TIMELINE_TRACK_CONFIG || {};
      const config = trackConfig[clip.track] || { label: clip.track, color: '#6366f1' };
      const transitions = state.TIMELINE_TRANSITIONS || [];

      let transitionOptions = transitions.map(t => 
        `<option value="${t.id}" ${clip.transitionIn === t.id ? 'selected' : ''}>${escapeHTML(t.name)}</option>`
      ).join('');

      return `
        <div class="clip-editor-panel" style="padding: 16px; background: #1e293b; border-radius: 8px; margin-bottom: 12px; border-left: 3px solid ${config.color};">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <h4 style="margin: 0; font-size: 14px; color: #f1f5f9;">
              Editando: <span style="color: ${config.color};">${escapeHTML(clip.sourceLabel)}</span>
            </h4>
            <div style="display: flex; gap: 6px;">
              <button onclick="VideoTimelineModule.duplicateClip('${clip.id}')" style="padding: 4px 10px; background: #334155; border: 1px solid #475569; border-radius: 4px; color: #94a3b8; font-size: 11px; cursor: pointer;" title="Duplicar clipe">⧉ Duplicar</button>
              <button onclick="VideoTimelineModule.splitClip('${clip.id}')" style="padding: 4px 10px; background: #334155; border: 1px solid #475569; border-radius: 4px; color: #94a3b8; font-size: 11px; cursor: pointer;" title="Cortar clipe ao meio">✂ Cortar</button>
              <button onclick="VideoTimelineModule.deleteClip('${clip.id}')" style="padding: 4px 10px; background: #7f1d1d; border: 1px solid #991b1b; border-radius: 4px; color: #fca5a5; font-size: 11px; cursor: pointer;" title="Excluir clipe (asset original preservado)">🗑 Excluir</button>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">
            <div>
              <label style="font-size: 11px; color: #64748b; display: block; margin-bottom: 4px;">Faixa</label>
              <span style="font-size: 13px; color: ${config.color}; font-weight: 600;">${escapeHTML(config.label)}</span>
            </div>
            <div>
              <label style="font-size: 11px; color: #64748b; display: block; margin-bottom: 4px;">Posição (s)</label>
              <input type="number" value="${clip.positionSeconds}" step="0.1" min="0"
                     onchange="VideoTimelineModule.moveClip('${clip.id}', this.value)"
                     style="width: 100%; padding: 6px 8px; background: #0f172a; border: 1px solid #334155; border-radius: 4px; color: #e2e8f0; font-size: 12px;">
            </div>
            <div>
              <label style="font-size: 11px; color: #64748b; display: block; margin-bottom: 4px;">Duração (s)</label>
              <input type="number" value="${clip.durationSeconds}" step="0.1" min="0.1"
                     onchange="VideoTimelineModule.resizeClip('${clip.id}', this.value)"
                     style="width: 100%; padding: 6px 8px; background: #0f172a; border: 1px solid #334155; border-radius: 4px; color: #e2e8f0; font-size: 12px;">
            </div>
            <div>
              <label style="font-size: 11px; color: #64748b; display: block; margin-bottom: 4px;">Transição Entrada</label>
              <select onchange="VideoTimelineModule.updateClipTransition('${clip.id}', this.value)"
                      style="width: 100%; padding: 6px 8px; background: #0f172a; border: 1px solid #334155; border-radius: 4px; color: #e2e8f0; font-size: 12px;">
                ${transitionOptions}
              </select>
            </div>
            <div>
              <label style="font-size: 11px; color: #64748b; display: block; margin-bottom: 4px;">Volume</label>
              <input type="range" min="0" max="1" step="0.1" value="${clip.volume}"
                     onchange="VideoTimelineModule.updateClipVolume('${clip.id}', this.value)"
                     style="width: 100%; accent-color: ${config.color};">
            </div>
            <div>
              <label style="font-size: 11px; color: #64748b; display: block; margin-bottom: 4px;">Opacidade</label>
              <input type="range" min="0" max="1" step="0.1" value="${clip.opacity}"
                     onchange="VideoTimelineModule.updateClipOpacity('${clip.id}', this.value)"
                     style="width: 100%; accent-color: ${config.color};">
            </div>
          </div>
          <div style="margin-top: 10px; font-size: 11px; color: #475569;">
            Fonte: ${escapeHTML(clip.sourceType)} ${clip.sourceId ? '→ ' + escapeHTML(String(clip.sourceId).substring(0, 20)) : ''} • 
            Criado por ${escapeHTML(clip.createdBy)}
          </div>
        </div>
      `;
    },

    _renderFooter(metadata) {
      if (!metadata) return '';
      const trackLines = Object.entries(metadata.tracks || {}).map(([track, info]) => {
        return `<span style="margin-right: 12px;">${track}: ${info.count} clipes (${info.totalDurationSeconds}s)</span>`;
      }).join('');

      return `
        <div class="timeline-footer" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; background: #1e293b; border-radius: 8px; font-size: 11px; color: #64748b;">
          <div>${trackLines}</div>
          <div style="display: flex; gap: 12px; font-weight: 600; color: #94a3b8;">
            <span>⏱ ${metadata.totalDurationFormatted}</span>
            <span>🎞 ${metadata.fps} FPS</span>
            <span>📐 ${metadata.resolution}</span>
            <span>⬜ ${metadata.aspectRatio}</span>
          </div>
        </div>
      `;
    },

    // ---- Ações de Edição ----

    selectClip(clipId) {
      this.selectedClipId = clipId;
      this._rerender();
    },

    moveClip(clipId, newPosition) {
      const state = this._getState();
      if (!state) return;
      state.moveTimelineClip(clipId, Number(newPosition));
      this._rerender();
    },

    resizeClip(clipId, newDuration) {
      const state = this._getState();
      if (!state) return;
      state.resizeTimelineClip(clipId, Number(newDuration));
      this._rerender();
    },

    splitClip(clipId) {
      const state = this._getState();
      if (!state) return;
      const clip = state.getTimelineClip(clipId);
      if (!clip) return;
      const midpoint = clip.durationSeconds / 2;
      if (midpoint <= 0) return;
      const result = state.splitTimelineClip(clipId, midpoint);
      this.selectedClipId = result.secondPart.id;
      this._rerender();
    },

    duplicateClip(clipId) {
      const state = this._getState();
      if (!state) return;
      const dup = state.duplicateTimelineClip(clipId);
      this.selectedClipId = dup.id;
      this._rerender();
    },

    deleteClip(clipId) {
      const state = this._getState();
      if (!state) return;
      state.deleteTimelineClip(clipId);
      this.selectedClipId = null;
      this._rerender();
    },

    updateClipTransition(clipId, transitionId) {
      const state = this._getState();
      if (!state) return;
      state.updateTimelineClip(clipId, { transitionIn: transitionId });
      this._rerender();
    },

    updateClipVolume(clipId, volume) {
      const state = this._getState();
      if (!state) return;
      state.updateTimelineClip(clipId, { volume: Number(volume) });
    },

    updateClipOpacity(clipId, opacity) {
      const state = this._getState();
      if (!state) return;
      state.updateTimelineClip(clipId, { opacity: Number(opacity) });
    },

    regenerateFromStoryboard() {
      const state = this._getState();
      if (!state || !this.activeVideoId) return;
      state.generateTimelineFromStoryboard(this.activeVideoId, { user: 'Timeline Editor' });
      this.selectedClipId = null;
      this._rerender();
    },

    // ---- Preview ----

    togglePreview() {
      if (this.isPreviewPlaying) {
        this.pausePreview();
      } else {
        this.startPreview();
      }
    },

    startPreview() {
      const state = this._getState();
      if (!state || !this.activeTimelineId) return;
      const tl = state.getTimeline(this.activeTimelineId);
      if (!tl) return;

      this.isPreviewPlaying = true;
      const totalDuration = tl.totalDurationSeconds || 0;
      if (this.previewCurrentTime >= totalDuration) this.previewCurrentTime = 0;

      this.previewTimer = setInterval(() => {
        this.previewCurrentTime += 0.1;
        if (this.previewCurrentTime >= totalDuration) {
          this.stopPreview();
          return;
        }
        // Leve atualização da barra sem re-render completo
        const progressBar = document.querySelector('.timeline-preview-bar div[style*="flex: 1"]');
        if (progressBar) {
          const pct = (this.previewCurrentTime / totalDuration * 100).toFixed(1);
          const inner = progressBar.querySelector('div');
          if (inner) inner.style.width = pct + '%';
        }
      }, 100);
      this._rerender();
    },

    pausePreview() {
      this.isPreviewPlaying = false;
      if (this.previewTimer) {
        clearInterval(this.previewTimer);
        this.previewTimer = null;
      }
      this._rerender();
    },

    stopPreview() {
      this.isPreviewPlaying = false;
      this.previewCurrentTime = 0;
      if (this.previewTimer) {
        clearInterval(this.previewTimer);
        this.previewTimer = null;
      }
      this._rerender();
    },

    seekPreview(event) {
      const state = this._getState();
      if (!state || !this.activeTimelineId) return;
      const tl = state.getTimeline(this.activeTimelineId);
      if (!tl) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const pct = x / rect.width;
      this.previewCurrentTime = pct * tl.totalDurationSeconds;
      this._rerender();
    },

    // ---- Utilitários ----

    _formatTime(seconds) {
      const s = Number(seconds || 0);
      const mins = Math.floor(s / 60);
      const secs = Math.floor(s % 60);
      const ms = Math.round((s % 1) * 100);
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
    },

    _rerender() {
      if (!this.activeVideoId) return;
      const container = document.getElementById('timeline-editor-container');
      if (container && container.parentElement) {
        container.parentElement.innerHTML = this.render(this.activeVideoId);
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
          lucide.createIcons();
        }
      }
    }
  };

  // Exportação
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = VideoTimelineModule;
  }
  if (typeof global !== 'undefined') {
    global.VideoTimelineModule = VideoTimelineModule;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
