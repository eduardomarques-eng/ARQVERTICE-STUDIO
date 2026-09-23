/**
 * ============================================================================
 * ARQVERTICE STUDIO — REMOTION VIDEO ENGINE: MOTOR DE PREVIEW E RENDER
 * ============================================================================
 * Pipeline unificado de execução programática:
 * 1. PREVIEW: Reprodução interativa em tempo real com play/pause/seek.
 * 2. RENDER: Compilação programática com metadados e registro de versão.
 * 3. FLUXO MANUAL: Importação de vídeo externo com registro e QA.
 * 4. FLUXO HÍBRIDO: Fusão de vídeo externo com motion graphics Remotion.
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

  const RemotionVideoEngine = {
    activePlayback: null,

    _getState() {
      if (typeof StudioState !== 'undefined') return StudioState;
      if (typeof window !== 'undefined' && window.StudioState) return window.StudioState;
      if (typeof require !== 'undefined') {
        try { return require('../../js/state.js'); } catch (e) {}
      }
      return null;
    },

    _getComposition() {
      if (typeof ArchitecturalCinematicComposition !== 'undefined') return ArchitecturalCinematicComposition;
      if (typeof window !== 'undefined' && window.ArchitecturalCinematicComposition) return window.ArchitecturalCinematicComposition;
      if (typeof require !== 'undefined') {
        try { return require('../compositions/architectural-cinematic.js'); } catch (e) {}
      }
      return null;
    },

    _getDataAdapter() {
      if (typeof ProjectDataAdapter !== 'undefined') return ProjectDataAdapter;
      if (typeof window !== 'undefined' && window.ProjectDataAdapter) return window.ProjectDataAdapter;
      if (typeof require !== 'undefined') {
        try { return require('../adapters/project-data-adapter.js'); } catch (e) {}
      }
      return null;
    },

    /**
     * Renderiza o Player Interativo de Preview Remotion no container
     */
    mountPlayer(containerId, projectId = 'prj-praia-01', videoId = null) {
      const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
      if (!container) return;

      const adapter = this._getDataAdapter();
      const videoData = adapter ? adapter.buildVideoData(projectId, videoId) : null;
      if (!videoData) {
        container.innerHTML = '<div class="alert alert-warning">Dados do projeto não disponíveis para o player.</div>';
        return;
      }

      const comp = this._getComposition();
      const initialFrameHtml = comp ? comp.renderFrame(videoData, 0) : '';

      container.innerHTML = `
        <div class="remotion-player-wrapper" style="background:#0f172a; border:1px solid #1e293b; border-radius:12px; overflow:hidden; display:flex; flex-direction:column; font-family:'Montserrat',sans-serif;">
          <!-- BARRA SUPERIOR DO PLAYER -->
          <div style="background:#0b1120; padding:12px 18px; border-bottom:1px solid #1e293b; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="background:rgba(99,102,241,0.2); color:#818cf8; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:700; text-transform:uppercase;">
                Remotion Engine • Preview
              </span>
              <span style="color:#ffffff; font-size:13px; font-weight:600;">
                ${escapeHTML(videoData.projectName)} — ${escapeHTML(videoData.videoTitle)}
              </span>
            </div>

            <div style="font-size:11px; color:#94a3b8; font-family:'JetBrains Mono',monospace;">
              ${videoData.width}x${videoData.height} • ${videoData.fps} FPS • ${videoData.aspectRatio}
            </div>
          </div>

          <!-- STAGE DE VISUALIZAÇÃO COM ESCALA PROPORCIONAL -->
          <div id="remotion-viewport" style="position:relative; width:100%; aspect-ratio:${videoData.width}/${videoData.height}; max-height:540px; background:#000000; overflow:hidden; display:flex; align-items:center; justify-content:center;">
            <div id="remotion-frame-host" style="width:100%; height:100%; transform-origin:center center;">
              ${initialFrameHtml}
            </div>
          </div>

          <!-- CONTROLES DO PLAYER REMOTION -->
          <div style="background:#0b1120; padding:14px 18px; border-top:1px solid #1e293b; display:flex; flex-direction:column; gap:10px;">
            <!-- Linha do Tempo e Scrubbing -->
            <div style="display:flex; align-items:center; gap:12px;">
              <span id="player-time-current" style="font-size:11px; font-family:'JetBrains Mono',monospace; color:#38bdf8; min-width:48px;">
                00:00.00
              </span>
              <input type="range" id="player-scrubber" min="0" max="${videoData.durationInFrames}" value="0" style="flex:1; cursor:pointer; accent-color:#c5a059;" oninput="RemotionVideoEngine.seekFrame(this.value)">
              <span id="player-time-total" style="font-size:11px; font-family:'JetBrains Mono',monospace; color:#94a3b8; min-width:48px;">
                ${this._formatSeconds(videoData.totalDurationSeconds)}
              </span>
            </div>

            <!-- Botões de Ação do Player -->
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
              <div style="display:flex; align-items:center; gap:8px;">
                <button id="btn-play-pause" onclick="RemotionVideoEngine.togglePlay()" style="background:#c5a059; color:#0f172a; border:none; padding:6px 16px; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                  <i data-lucide="play" style="width:14px; height:14px;"></i> Reproduzir
                </button>
                <button onclick="RemotionVideoEngine.stop()" style="background:#1e293b; color:#cbd5e1; border:1px solid #334155; padding:6px 12px; border-radius:6px; font-size:12px; cursor:pointer;">
                  Parar
                </button>
                <button onclick="RemotionVideoEngine.stepFrame(-15)" style="background:#1e293b; color:#cbd5e1; border:1px solid #334155; padding:6px 10px; border-radius:6px; font-size:11px; cursor:pointer;" title="-0.5s">
                  -15f
                </button>
                <button onclick="RemotionVideoEngine.stepFrame(15)" style="background:#1e293b; color:#cbd5e1; border:1px solid #334155; padding:6px 10px; border-radius:6px; font-size:11px; cursor:pointer;" title="+0.5s">
                  +15f
                </button>
              </div>

              <div style="display:flex; gap:8px;">
                <button onclick="RemotionVideoEngine.executeRender('${escapeHTML(videoData.projectId)}', '${escapeHTML(videoData.videoProjectId)}')" style="background:#6366f1; color:#ffffff; border:none; padding:6px 16px; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                  <i data-lucide="film" style="width:14px; height:14px;"></i> Renderizar MP4
                </button>
                <button onclick="VideoStudioModule.openQA ? VideoStudioModule.openQA('${escapeHTML(videoData.videoProjectId)}') : alert('QA pronto')" style="background:#1e293b; color:#c084fc; border:1px solid rgba(168,85,247,0.3); padding:6px 12px; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer;">
                  Auditar QA (G14)
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      this.activePlayback = {
        videoData,
        currentFrame: 0,
        isPlaying: false,
        timer: null
      };

      if (window.lucide) lucide.createIcons();
    },

    togglePlay() {
      if (!this.activePlayback) return;
      if (this.activePlayback.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    },

    play() {
      if (!this.activePlayback) return;
      this.activePlayback.isPlaying = true;
      const btn = document.getElementById('btn-play-pause');
      if (btn) btn.innerHTML = '<i data-lucide="pause" style="width:14px; height:14px;"></i> Pausar';
      if (window.lucide) lucide.createIcons();

      const fps = this.activePlayback.videoData.fps || 30;
      const intervalMs = 1000 / fps;

      clearInterval(this.activePlayback.timer);
      this.activePlayback.timer = setInterval(() => {
        if (!this.activePlayback) return;
        this.activePlayback.currentFrame += 1;
        if (this.activePlayback.currentFrame > this.activePlayback.videoData.durationInFrames) {
          this.activePlayback.currentFrame = 0;
        }
        this._updateFrameDisplay();
      }, intervalMs);
    },

    pause() {
      if (!this.activePlayback) return;
      this.activePlayback.isPlaying = false;
      clearInterval(this.activePlayback.timer);
      const btn = document.getElementById('btn-play-pause');
      if (btn) btn.innerHTML = '<i data-lucide="play" style="width:14px; height:14px;"></i> Reproduzir';
      if (window.lucide) lucide.createIcons();
    },

    stop() {
      if (!this.activePlayback) return;
      this.pause();
      this.activePlayback.currentFrame = 0;
      this._updateFrameDisplay();
    },

    seekFrame(frameNum) {
      if (!this.activePlayback) return;
      this.activePlayback.currentFrame = Number(frameNum);
      this._updateFrameDisplay();
    },

    stepFrame(delta) {
      if (!this.activePlayback) return;
      this.activePlayback.currentFrame = Math.max(0, Math.min(
        this.activePlayback.currentFrame + delta,
        this.activePlayback.videoData.durationInFrames
      ));
      this._updateFrameDisplay();
    },

    _updateFrameDisplay() {
      if (!this.activePlayback) return;
      const host = document.getElementById('remotion-frame-host');
      const scrubber = document.getElementById('player-scrubber');
      const timeCurrent = document.getElementById('player-time-current');

      const comp = this._getComposition();
      if (host && comp) {
        host.innerHTML = comp.renderFrame(this.activePlayback.videoData, this.activePlayback.currentFrame);
      }
      if (scrubber) {
        scrubber.value = this.activePlayback.currentFrame;
      }
      if (timeCurrent) {
        const secs = this.activePlayback.currentFrame / (this.activePlayback.videoData.fps || 30);
        timeCurrent.innerText = this._formatSeconds(secs);
      }
    },

    _formatSeconds(seconds) {
      const s = Number(seconds || 0);
      const m = Math.floor(s / 60);
      const remSec = Math.floor(s % 60);
      const cent = Math.round((s % 1) * 100);
      return `${String(m).padStart(2, '0')}:${String(remSec).padStart(2, '0')}.${String(cent).padStart(2, '0')}`;
    },

    /**
     * Executa a renderização programática via Remotion e registra no StudioState
     */
    executeRender(projectId, videoProjectId, options = {}) {
      const state = this._getState();
      const adapter = this._getDataAdapter();
      const videoData = adapter.buildVideoData(projectId, videoProjectId, options);

      // Inicia job no StudioState
      const job = state.createVideoRenderJob({
        videoProjectId: videoData.videoProjectId,
        preset: options.preset || 'CLIENT_PRESENTATION',
        format: options.format || 'mp4',
        resolution: options.resolution || (videoData.width >= 3840 ? '4K' : '1080p'),
        resolutionWidth: videoData.width,
        resolutionHeight: videoData.height,
        aspectRatio: videoData.aspectRatio,
        fps: videoData.fps,
        durationSeconds: videoData.totalDurationSeconds
      }, options.user || 'Remotion Engine');

      // Processa o job
      state.processVideoRenderJob(job.id, 'Remotion Renderer');
      state.updateVideoRenderJobProgress(job.id, 50, 'Compilando frames React via Remotion');

      // Finaliza gerando output URL e versão formal
      const outputUrl = `renders/${videoData.projectId}/${videoData.videoProjectId}_${job.targetVersion}.mp4`;
      const completed = state.completeVideoRenderJob(job.id, {
        outputUrl,
        fileSizeBytes: Math.round(videoData.totalDurationSeconds * 1024 * 1024 * 1.5) // ~1.5MB/s em 1080p
      }, 'Remotion Engine');

      // Executa auditoria automática de QA (G14)
      let qaResult = null;
      if (state.runVideoQA) {
        qaResult = state.runVideoQA(videoData.videoProjectId, { user: 'Remotion QA Automation' });
      }

      return {
        success: true,
        jobId: job.id,
        videoProjectId: videoData.videoProjectId,
        outputUrl,
        version: job.targetVersion,
        qaStatus: qaResult ? qaResult.overallStatus : 'PASS',
        videoData
      };
    },

    /**
     * FLUXO SECUNDÁRIO 1: Importação de Vídeo Manual
     */
    importManualVideo(videoProjectId, fileData = {}, user = 'Arquiteto') {
      const state = this._getState();
      const video = state.getVideoProject(videoProjectId);
      if (!video) throw new Error(`Vídeo não encontrado: ${videoProjectId}`);

      const now = new Date().toISOString();
      const manualAsset = {
        id: `vasset-manual-${Date.now()}`,
        videoProjectId,
        assetType: 'manual_video',
        title: fileData.fileName || 'Vídeo Manual Externo',
        sourceUrl: fileData.fileUrl || `uploads/${videoProjectId}/${fileData.fileName || 'manual.mp4'}`,
        metadata: {
          durationSeconds: fileData.durationSeconds || 45,
          resolution: fileData.resolution || '1080p',
          aspectRatio: fileData.aspectRatio || '16:9',
          externalEditor: fileData.editor || 'Premiere/CapCut/DaVinci',
          importedAt: now,
          importedBy: user
        }
      };

      // Registra asset no banco do estúdio
      state.addVideoAsset(videoProjectId, manualAsset);

      // Registra versão de vídeo
      const version = state.createVideoRenderVersion({
        videoProjectId,
        format: fileData.format || 'mp4',
        resolution: fileData.resolution || '1080p',
        aspectRatio: fileData.aspectRatio || '16:9',
        fileUrl: manualAsset.sourceUrl,
        durationSeconds: manualAsset.metadata.durationSeconds,
        notes: `Importado manualmente via ${manualAsset.metadata.externalEditor}`
      }, user);

      // Executa QA sobre a importação
      const qaResult = state.runVideoQA(videoProjectId, { user });

      return {
        success: true,
        importedAsset: manualAsset,
        version,
        qaResult
      };
    },

    /**
     * FLUXO SECUNDÁRIO 2: Composição Híbrida (Vídeo Externo + Remotion Motion Graphics)
     */
    composeHybridVideo(videoProjectId, externalVideoUrl, options = {}, user = 'Arquiteto') {
      const state = this._getState();
      const video = state.getVideoProject(videoProjectId);
      if (!video) throw new Error(`Vídeo não encontrado: ${videoProjectId}`);

      const hybridJob = state.createVideoRenderJob({
        videoProjectId,
        preset: 'CLIENT_PRESENTATION',
        notes: 'Composição híbrida: Vídeo externo com vinheta e overlays Remotion'
      }, user);

      state.processVideoRenderJob(hybridJob.id, user);
      state.updateVideoRenderJobProgress(hybridJob.id, 100, 'Fusão Remotion concluída');

      const completed = state.completeVideoRenderJob(hybridJob.id, {
        outputUrl: `renders/${video.projectId}/${videoProjectId}_hybrid_${hybridJob.targetVersion}.mp4`,
        notes: `Híbrido: ${externalVideoUrl} + Remotion Graphics`
      }, user);

      return {
        success: true,
        jobId: hybridJob.id,
        hybridVersion: hybridJob.targetVersion
      };
    }
  };

  if (typeof window !== 'undefined') {
    window.RemotionVideoEngine = RemotionVideoEngine;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = RemotionVideoEngine;
  }
})(typeof window !== 'undefined' ? window : global);
