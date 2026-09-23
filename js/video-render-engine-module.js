/**
 * ============================================================================
 * ARQVERTICE STUDIO — BLOCO G13: VIDEO RENDER ENGINE MODULE
 * ============================================================================
 * Pipeline de renderização e exportação de vídeo arquitetural.
 *
 * FORMATOS:
 * - MP4 como prioridade absoluta.
 * - Arquitetura extensível para WebM, MOV e ProRes.
 *
 * CONFIGURAÇÕES:
 * - Resolução (1080p padrão, 4K UHD, 1440p 2K, 720p HD)
 * - FPS (24, 30, 60 fps)
 * - Bitrate (kbps dinâmico e customizável)
 * - Áudio (AAC/Opus, bitrate, sample rate, canais)
 * - Codec (H.264, H.265, VP9, ProRes)
 * - Proporção (16:9 widescreen, 9:16 vertical reels/shorts)
 *
 * PRESETS CANÔNICOS:
 * - WEB
 * - SOCIAL_VERTICAL
 * - SOCIAL_HORIZONTAL
 * - CLIENT_PRESENTATION
 * - HIGH_QUALITY
 *
 * PROCESSAMENTO & FILA:
 * - Fila, progresso percentual, tempo decorrido e estimado restante, status, logs de erro.
 * - Status: queued, processing, completed, failed, cancelled.
 * - Salvaguarda: se falhar, o projeto e a timeline NUNCA são perdidos.
 * - Suporte a Retry com preservação de histórico.
 * - Versionamento de vídeo completo (v1.0, v1.1, etc.).
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

  const VideoRenderEngineModule = {
    activeVideoId: null,
    selectedPresetKey: 'WEB',
    customConfigOpen: false,
    selectedJobId: null,
    pollInterval: null,

    _getState() {
      return typeof StudioState !== 'undefined' ? StudioState : (global.StudioState || null);
    },

    /**
     * Renderiza a interface completa do Render Engine
     */
    render(videoProjectId) {
      const state = this._getState();
      if (!state) return '<div class="alert alert-danger">StudioState não inicializado.</div>';

      const video = state.getVideoProject(videoProjectId);
      if (!video) return '<div class="alert alert-warning">Selecione um projeto de vídeo para gerenciar renderizações e exportações.</div>';

      this.activeVideoId = video.id;

      const timeline = state.getProjectTimeline(video.id);
      const jobs = state.getRenderJobs(video.id);
      const versions = state.getVideoVersions(video.id);
      const summary = state.getRenderQueueSummary(video.id);
      const presets = state.VIDEO_RENDER_PRESETS;
      const formats = state.VIDEO_RENDER_FORMATS;
      const codecs = state.VIDEO_RENDER_CODECS;
      const resolutions = state.VIDEO_RENDER_RESOLUTIONS;

      return `
        <div class="video-render-engine" id="video-render-engine-container" style="background:#0f172a; color:#f8fafc; border-radius:12px; padding:24px; font-family:'Montserrat', sans-serif;">
          ${this._renderHeader(video, timeline, summary)}
          ${this._renderPresetsSelector(presets, video)}
          ${this._renderCustomConfigPanel(video, formats, codecs, resolutions)}
          ${this._renderActiveProcessingSection(summary.activeJob, video)}
          ${this._renderQueueSection(jobs, video)}
          ${this._renderVersionsSection(versions, video)}
          ${this._renderAiProviderNormalizationBanner(timeline, state)}
        </div>
      `;
    },

    // ---- Sub-renderers ----

    _renderHeader(video, timeline, summary) {
      const durationSec = timeline ? Number(timeline.totalDurationSeconds || 0) : 0;
      const durFormatted = this._formatTime(durationSec);
      const clipsCount = timeline ? (this._getState().getTimelineClips(timeline.id) || []).length : 0;

      return `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; padding-bottom:18px; border-bottom:1px solid #1e293b; flex-wrap:wrap; gap:16px;">
          <div>
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
              <span style="background:rgba(99,102,241,0.2); color:#818cf8; padding:4px 10px; border-radius:6px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em;">
                Bloco G13 • Pipeline de Render
              </span>
              <span style="color:#94a3b8; font-size:12px;">ID: ${escapeHTML(video.id)}</span>
            </div>
            <h2 style="margin:0 0 6px 0; font-size:22px; font-weight:700; color:#ffffff; display:flex; align-items:center; gap:8px;">
              <i data-lucide="video" style="color:#6366f1; width:22px; height:22px;"></i>
              ${escapeHTML(video.title)}
            </h2>
            <div style="display:flex; gap:16px; color:#94a3b8; font-size:13px; flex-wrap:wrap;">
              <span><i data-lucide="clock" style="width:14px; height:14px; vertical-align:middle; margin-right:4px;"></i>Duração: <strong>${durFormatted}</strong></span>
              <span><i data-lucide="film" style="width:14px; height:14px; vertical-align:middle; margin-right:4px;"></i>Clipes: <strong>${clipsCount}</strong></span>
              <span><i data-lucide="monitor" style="width:14px; height:14px; vertical-align:middle; margin-right:4px;"></i>Proporção: <strong>${escapeHTML(video.aspectRatio || '16:9')}</strong></span>
              <span><i data-lucide="tag" style="width:14px; height:14px; vertical-align:middle; margin-right:4px;"></i>Versão Atual: <strong>${escapeHTML(video.currentVersion || 'v1.0')}</strong></span>
            </div>
          </div>

          <div style="display:flex; gap:10px; align-items:center;">
            <div style="display:flex; gap:8px; background:#1e293b; padding:8px 12px; border-radius:8px; font-size:12px;">
              <span style="color:#e2e8f0;">Fila: <strong style="color:#f59e0b;">${summary.queued}</strong></span>
              <span style="color:#475569;">|</span>
              <span style="color:#e2e8f0;">Renderizando: <strong style="color:#38bdf8;">${summary.processing}</strong></span>
              <span style="color:#475569;">|</span>
              <span style="color:#e2e8f0;">Concluídos: <strong style="color:#22c55e;">${summary.completed}</strong></span>
              ${summary.failed > 0 ? `<span style="color:#475569;">|</span><span style="color:#ef4444;">Falhas: <strong>${summary.failed}</strong></span>` : ''}
            </div>
            <button onclick="VideoRenderEngineModule.triggerQuickRender('${escapeHTML(video.id)}')"
              style="background:linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color:#ffffff; border:none; padding:10px 18px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px; box-shadow:0 4px 12px rgba(99,102,241,0.3);">
              <i data-lucide="play" style="width:16px; height:16px;"></i> Iniciar Render
            </button>
          </div>
        </div>
      `;
    },

    _renderPresetsSelector(presets, video) {
      const keys = ['WEB', 'SOCIAL_VERTICAL', 'SOCIAL_HORIZONTAL', 'CLIENT_PRESENTATION', 'HIGH_QUALITY'];

      return `
        <div style="margin-bottom:24px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <h3 style="margin:0; font-size:15px; font-weight:600; color:#e2e8f0; display:flex; align-items:center; gap:6px;">
              <i data-lucide="sliders" style="color:#818cf8; width:18px; height:18px;"></i>
              Presets Canônicos de Exportação
            </h3>
            <button onclick="VideoRenderEngineModule.toggleCustomConfig()"
              style="background:transparent; border:1px solid #334155; color:#94a3b8; padding:4px 10px; border-radius:6px; font-size:12px; cursor:pointer;">
              ${this.customConfigOpen ? 'Ocultar Personalização' : 'Personalizar Ajustes'}
            </button>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px;">
            ${keys.map(key => {
              const p = presets[key];
              const isSelected = (this.selectedPresetKey === key);
              return `
                <div onclick="VideoRenderEngineModule.selectPreset('${key}')"
                  style="background:${isSelected ? 'rgba(99,102,241,0.15)' : '#1e293b'}; border:1.5px solid ${isSelected ? '#6366f1' : '#334155'}; border-radius:10px; padding:14px; cursor:pointer; transition:all 0.2s ease;">
                  <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                    <strong style="color:${isSelected ? '#ffffff' : '#e2e8f0'}; font-size:14px;">${escapeHTML(p.name)}</strong>
                    ${isSelected ? '<span style="background:#6366f1; color:#fff; border-radius:50%; width:18px; height:18px; display:inline-flex; align-items:center; justify-content:center; font-size:10px;">✓</span>' : ''}
                  </div>
                  <p style="color:#94a3b8; font-size:11px; margin:0 0 10px 0; line-height:1.4; min-height:32px;">${escapeHTML(p.description)}</p>
                  <div style="display:flex; flex-wrap:wrap; gap:6px; font-size:11px;">
                    <span style="background:rgba(255,255,255,0.06); padding:2px 6px; border-radius:4px; color:#cbd5e1;">${escapeHTML(p.resolution)}</span>
                    <span style="background:rgba(255,255,255,0.06); padding:2px 6px; border-radius:4px; color:#cbd5e1;">${p.fps} fps</span>
                    <span style="background:rgba(255,255,255,0.06); padding:2px 6px; border-radius:4px; color:#cbd5e1;">${(p.bitrateKbps / 1000).toFixed(0)} Mbps</span>
                    <span style="background:rgba(255,255,255,0.06); padding:2px 6px; border-radius:4px; color:#cbd5e1;">${escapeHTML(p.format.toUpperCase())}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    },

    _renderCustomConfigPanel(video, formats, codecs, resolutions) {
      if (!this.customConfigOpen) return '';

      const state = this._getState();
      const currentPreset = state.VIDEO_RENDER_PRESETS[this.selectedPresetKey] || state.VIDEO_RENDER_PRESETS.WEB;

      return `
        <div style="background:#1e293b; border:1px solid #334155; border-radius:10px; padding:18px; margin-bottom:24px; animation:fadeIn 0.2s ease;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
            <h4 style="margin:0; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#cbd5e1;">
              Ajustes Avançados de Codificação (Preset: ${escapeHTML(currentPreset.name)})
            </h4>
            <span style="font-size:11px; color:#94a3b8;">MP4 como prioridade com suporte extensível a WebM e ProRes</span>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:14px;">
            <div>
              <label style="display:block; font-size:11px; color:#94a3b8; margin-bottom:4px; font-weight:600;">Formato Container</label>
              <select id="render-cfg-format" style="width:100%; background:#0f172a; border:1px solid #334155; color:#f8fafc; padding:8px; border-radius:6px; font-size:12px;">
                <option value="mp4" ${currentPreset.format === 'mp4' ? 'selected' : ''}>MP4 (Prioridade / Padrão)</option>
                <option value="webm" ${currentPreset.format === 'webm' ? 'selected' : ''}>WebM (Moderno Web)</option>
                <option value="mov" ${currentPreset.format === 'mov' ? 'selected' : ''}>QuickTime MOV</option>
                <option value="prores" ${currentPreset.format === 'prores' ? 'selected' : ''}>Apple ProRes (Master)</option>
              </select>
            </div>

            <div>
              <label style="display:block; font-size:11px; color:#94a3b8; margin-bottom:4px; font-weight:600;">Resolução Alvo</label>
              <select id="render-cfg-resolution" style="width:100%; background:#0f172a; border:1px solid #334155; color:#f8fafc; padding:8px; border-radius:6px; font-size:12px;">
                <option value="1080p" ${currentPreset.resolution === '1080p' ? 'selected' : ''}>1080p Full HD (Padrão Inicial)</option>
                <option value="4K" ${currentPreset.resolution === '4K' ? 'selected' : ''}>4K Ultra HD (3840x2160)</option>
                <option value="1440p" ${currentPreset.resolution === '1440p' ? 'selected' : ''}>1440p Quad HD 2K</option>
                <option value="720p" ${currentPreset.resolution === '720p' ? 'selected' : ''}>720p HD</option>
              </select>
            </div>

            <div>
              <label style="display:block; font-size:11px; color:#94a3b8; margin-bottom:4px; font-weight:600;">Taxa de Quadros (FPS)</label>
              <select id="render-cfg-fps" style="width:100%; background:#0f172a; border:1px solid #334155; color:#f8fafc; padding:8px; border-radius:6px; font-size:12px;">
                <option value="24" ${currentPreset.fps === 24 ? 'selected' : ''}>24 FPS (Cinematográfico)</option>
                <option value="30" ${currentPreset.fps === 30 ? 'selected' : ''}>30 FPS (Padrão Fluído)</option>
                <option value="60" ${currentPreset.fps === 60 ? 'selected' : ''}>60 FPS (Ultra Suave)</option>
              </select>
            </div>

            <div>
              <label style="display:block; font-size:11px; color:#94a3b8; margin-bottom:4px; font-weight:600;">Codec de Vídeo</label>
              <select id="render-cfg-codec" style="width:100%; background:#0f172a; border:1px solid #334155; color:#f8fafc; padding:8px; border-radius:6px; font-size:12px;">
                <option value="h264" ${currentPreset.codec === 'h264' ? 'selected' : ''}>H.264 / AVC (Universal)</option>
                <option value="h265" ${currentPreset.codec === 'h265' ? 'selected' : ''}>H.265 / HEVC (4K Eficiente)</option>
                <option value="vp9" ${currentPreset.codec === 'vp9' ? 'selected' : ''}>VP9</option>
                <option value="prores" ${currentPreset.codec === 'prores' ? 'selected' : ''}>ProRes 422 HQ</option>
              </select>
            </div>

            <div>
              <label style="display:block; font-size:11px; color:#94a3b8; margin-bottom:4px; font-weight:600;">Bitrate Vídeo (kbps)</label>
              <input type="number" id="render-cfg-bitrate" value="${currentPreset.bitrateKbps}" step="1000" min="2000" max="60000"
                style="width:100%; background:#0f172a; border:1px solid #334155; color:#f8fafc; padding:8px; border-radius:6px; font-size:12px;" />
            </div>

            <div>
              <label style="display:block; font-size:11px; color:#94a3b8; margin-bottom:4px; font-weight:600;">Áudio</label>
              <select id="render-cfg-audio" style="width:100%; background:#0f172a; border:1px solid #334155; color:#f8fafc; padding:8px; border-radius:6px; font-size:12px;">
                <option value="192">AAC Estéreo 192 kbps (Padrão)</option>
                <option value="320">AAC Master 320 kbps (Alta Fidelidade)</option>
                <option value="128">AAC 128 kbps (Econômico)</option>
              </select>
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end; margin-top:14px; gap:8px;">
            <button onclick="VideoRenderEngineModule.enqueueCustomRender('${escapeHTML(video.id)}')"
              style="background:#6366f1; color:#fff; border:none; padding:8px 16px; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer;">
              Enfileirar com Ajustes Customizados
            </button>
          </div>
        </div>
      `;
    },

    _renderActiveProcessingSection(activeJob, video) {
      if (!activeJob) return '';

      const isProcessing = (activeJob.status === 'processing');
      const isQueued = (activeJob.status === 'queued');
      const isFailed = (activeJob.status === 'failed');

      return `
        <div style="background:#1e293b; border:1.5px solid ${isFailed ? '#ef4444' : (isProcessing ? '#38bdf8' : '#f59e0b')}; border-radius:10px; padding:18px; margin-bottom:24px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="background:${isFailed ? '#ef4444' : (isProcessing ? '#0284c7' : '#d97706')}; color:#ffffff; padding:3px 8px; border-radius:6px; font-size:11px; font-weight:700;">
                ${isProcessing ? 'EM PROCESSAMENTO' : (isFailed ? 'FALHA NO RENDER' : 'NA FILA')}
              </span>
              <strong style="color:#ffffff; font-size:14px;">Job ${escapeHTML(activeJob.id)} • Versão ${escapeHTML(activeJob.targetVersion)}</strong>
              <span style="color:#94a3b8; font-size:12px;">(${escapeHTML(activeJob.preset)} • ${escapeHTML(activeJob.resolution)} • ${escapeHTML(activeJob.format.toUpperCase())})</span>
            </div>

            <div style="display:flex; gap:8px; align-items:center;">
              ${isProcessing ? `
                <button onclick="VideoRenderEngineModule.advanceJobStep('${escapeHTML(activeJob.id)}')"
                  style="background:#0284c7; color:#fff; border:none; padding:6px 12px; border-radius:6px; font-size:11px; cursor:pointer;">
                  Simular Avanço de Fase
                </button>
              ` : ''}
              ${isQueued ? `
                <button onclick="VideoRenderEngineModule.startJob('${escapeHTML(activeJob.id)}')"
                  style="background:#22c55e; color:#fff; border:none; padding:6px 12px; border-radius:6px; font-size:11px; font-weight:600; cursor:pointer;">
                  Processar Agora
                </button>
              ` : ''}
              ${isFailed ? `
                <button onclick="VideoRenderEngineModule.retryJob('${escapeHTML(activeJob.id)}')"
                  style="background:#6366f1; color:#fff; border:none; padding:6px 12px; border-radius:6px; font-size:11px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:4px;">
                  <i data-lucide="rotate-ccw" style="width:12px; height:12px;"></i> Tentar Novamente (Retry)
                </button>
              ` : ''}
              ${!isFailed ? `
                <button onclick="VideoRenderEngineModule.cancelJob('${escapeHTML(activeJob.id)}')"
                  style="background:transparent; border:1px solid #64748b; color:#94a3b8; padding:5px 10px; border-radius:6px; font-size:11px; cursor:pointer;">
                  Cancelar
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Barra de Progresso -->
          <div style="margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; font-size:12px; color:#cbd5e1; margin-bottom:6px;">
              <span>Fase Atual: <strong>${escapeHTML(activeJob.currentPhase || 'Aguardando')}</strong></span>
              <span><strong>${activeJob.progressPercent.toFixed(1)}%</strong></span>
            </div>
            <div style="background:#0f172a; border-radius:8px; height:10px; overflow:hidden; position:relative;">
              <div style="background:linear-gradient(90deg, #6366f1 0%, #38bdf8 100%); height:100%; width:${activeJob.progressPercent}%; transition:width 0.3s ease;"></div>
            </div>
          </div>

          <!-- Metadados de Tempo e Status -->
          <div style="display:flex; justify-content:space-between; font-size:11px; color:#94a3b8; flex-wrap:wrap; gap:12px;">
            <div>
              <span>Tempo Decorrido: <strong>${activeJob.elapsedTimeSeconds || 0}s</strong></span>
              <span style="margin:0 6px;">•</span>
              <span>Tempo Estimado Restante: <strong>${activeJob.remainingTimeSeconds || 0}s</strong></span>
            </div>
            <div>
              <span>Tentativas: <strong>${(activeJob.retryCount || 0) + 1}/${(activeJob.maxRetries || 3) + 1}</strong></span>
              <span style="margin:0 6px;">•</span>
              <span>Resoluções Detectadas: <strong>${(activeJob.providerResolutionsDetected || []).length} clipes normalizados</strong></span>
            </div>
          </div>

          ${isFailed && activeJob.errorMessage ? `
            <div style="margin-top:12px; background:rgba(239,68,68,0.1); border:1px solid #ef4444; border-radius:6px; padding:10px; font-size:12px; color:#fca5a5;">
              <strong>Erro Registrado:</strong> ${escapeHTML(activeJob.errorMessage)}
              <div style="margin-top:4px; font-size:11px; color:#cbd5e1;">
                ℹ️ <em>O projeto e a timeline estão 100% seguros e intactos. Você pode ajustar parâmetros e clicar em "Tentar Novamente".</em>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    },

    _renderQueueSection(jobs, video) {
      if (!jobs || jobs.length === 0) {
        return `
          <div style="background:#1e293b; border-radius:10px; padding:24px; text-align:center; color:#94a3b8; margin-bottom:24px;">
            <i data-lucide="inbox" style="width:36px; height:36px; stroke-width:1.5; color:#64748b; margin-bottom:8px;"></i>
            <div style="font-size:14px; font-weight:600; color:#cbd5e1;">Nenhum Job de Renderização</div>
            <div style="font-size:12px; margin-top:4px;">Selecione um preset acima e clique em "Iniciar Render" para enfileirar.</div>
          </div>
        `;
      }

      return `
        <div style="margin-bottom:24px;">
          <h3 style="margin:0 0 12px 0; font-size:15px; font-weight:600; color:#e2e8f0; display:flex; align-items:center; gap:6px;">
            <i data-lucide="list-ordered" style="color:#818cf8; width:18px; height:18px;"></i>
            Fila de Processamento & Histórico de Jobs (${jobs.length})
          </h3>

          <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; background:#1e293b; border-radius:8px; overflow:hidden; font-size:12px;">
              <thead>
                <tr style="background:#0f172a; color:#94a3b8; text-align:left; border-bottom:1px solid #334155;">
                  <th style="padding:10px 14px;">Status</th>
                  <th style="padding:10px 14px;">Versão / Job</th>
                  <th style="padding:10px 14px;">Preset</th>
                  <th style="padding:10px 14px;">Formato / Resolução</th>
                  <th style="padding:10px 14px;">Progresso</th>
                  <th style="padding:10px 14px;">Tempo</th>
                  <th style="padding:10px 14px; text-align:right;">Ações</th>
                </tr>
              </thead>
              <tbody>
                ${jobs.map(j => {
                  const statusColors = {
                    queued: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b', label: 'Na Fila' },
                    processing: { bg: 'rgba(56,189,248,0.15)', text: '#38bdf8', label: 'Renderizando' },
                    completed: { bg: 'rgba(34,197,94,0.15)', text: '#22c55e', label: 'Concluído' },
                    failed: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444', label: 'Falhou' },
                    cancelled: { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8', label: 'Cancelado' }
                  };
                  const sc = statusColors[j.status] || statusColors.queued;

                  return `
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                      <td style="padding:10px 14px;">
                        <span style="background:${sc.bg}; color:${sc.text}; padding:3px 8px; border-radius:4px; font-weight:600; font-size:11px;">
                          ${sc.label}
                        </span>
                      </td>
                      <td style="padding:10px 14px;">
                        <strong style="color:#ffffff;">${escapeHTML(j.targetVersion)}</strong>
                        <div style="font-size:10px; color:#94a3b8;">${escapeHTML(j.id)}</div>
                      </td>
                      <td style="padding:10px 14px; color:#e2e8f0;">${escapeHTML(j.preset)}</td>
                      <td style="padding:10px 14px; color:#cbd5e1;">
                        ${escapeHTML(j.format.toUpperCase())} • ${escapeHTML(j.resolution)} • ${j.fps}fps
                      </td>
                      <td style="padding:10px 14px;">
                        <div style="display:flex; align-items:center; gap:8px;">
                          <div style="background:#0f172a; border-radius:4px; height:6px; width:60px; overflow:hidden;">
                            <div style="background:#6366f1; height:100%; width:${j.progressPercent}%;"></div>
                          </div>
                          <span>${j.progressPercent.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td style="padding:10px 14px; color:#94a3b8;">
                        ${j.elapsedTimeSeconds || 0}s / ${j.estimatedTimeSeconds || 60}s
                      </td>
                      <td style="padding:10px 14px; text-align:right;">
                        ${j.status === 'failed' ? `
                          <button onclick="VideoRenderEngineModule.retryJob('${escapeHTML(j.id)}')"
                            style="background:#6366f1; color:#fff; border:none; padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer;">
                            Retry
                          </button>
                        ` : ''}
                        ${j.status === 'completed' ? `
                          <a href="${escapeHTML(j.outputUrl || '#')}" target="_blank"
                            style="background:rgba(34,197,94,0.2); color:#22c55e; padding:4px 8px; border-radius:4px; font-size:11px; text-decoration:none;">
                            Baixar
                          </a>
                        ` : ''}
                        ${j.status === 'queued' ? `
                          <button onclick="VideoRenderEngineModule.startJob('${escapeHTML(j.id)}')"
                            style="background:#38bdf8; color:#0f172a; border:none; padding:4px 8px; border-radius:4px; font-size:11px; font-weight:600; cursor:pointer;">
                            Iniciar
                          </button>
                        ` : ''}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    _renderVersionsSection(versions, video) {
      return `
        <div style="margin-bottom:24px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <h3 style="margin:0; font-size:15px; font-weight:600; color:#e2e8f0; display:flex; align-items:center; gap:6px;">
              <i data-lucide="layers" style="color:#818cf8; width:18px; height:18px;"></i>
              Versionamento de Vídeo Exportado (${versions.length})
            </h3>
            <span style="font-size:11px; color:#94a3b8;">Arquitetura não destrutiva com histórico permanente</span>
          </div>

          ${versions.length === 0 ? `
            <div style="background:#1e293b; border-radius:8px; padding:18px; text-align:center; color:#94a3b8; font-size:12px;">
              Nenhuma versão exportada ainda. As versões são geradas automaticamente quando um job de renderização é concluído.
            </div>
          ` : `
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:12px;">
              ${versions.map(v => `
                <div style="background:#1e293b; border:1px solid ${v.isPrimary ? '#6366f1' : '#334155'}; border-radius:8px; padding:14px; position:relative;">
                  ${v.isPrimary ? `
                    <span style="position:absolute; top:10px; right:10px; background:#6366f1; color:#fff; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:700;">
                      PRIMÁRIA
                    </span>
                  ` : ''}
                  <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                    <span style="background:rgba(99,102,241,0.2); color:#818cf8; font-weight:700; font-size:12px; padding:2px 6px; border-radius:4px;">
                      ${escapeHTML(v.versionNumber)}
                    </span>
                    <strong style="color:#ffffff; font-size:13px;">${escapeHTML(v.label)}</strong>
                  </div>
                  <div style="font-size:11px; color:#94a3b8; margin-bottom:10px;">
                    <div>Preset: <strong>${escapeHTML(v.preset)}</strong> • Codec: <strong>${escapeHTML(v.codec)}</strong></div>
                    <div>Resolução: <strong>${escapeHTML(v.resolution)} (${v.resolutionWidth}x${v.resolutionHeight})</strong> • ${v.fps}fps</div>
                    <div>Tamanho: <strong>${(v.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB</strong> • Duração: <strong>${this._formatTime(v.durationSeconds)}</strong></div>
                  </div>
                  <div style="display:flex; gap:6px; align-items:center;">
                    <a href="${escapeHTML(v.fileUrl)}" target="_blank"
                      style="background:#22c55e; color:#fff; border:none; padding:5px 10px; border-radius:4px; font-size:11px; font-weight:600; text-decoration:none; display:inline-flex; align-items:center; gap:4px;">
                      <i data-lucide="download" style="width:12px; height:12px;"></i> Baixar MP4
                    </a>
                    ${!v.isPrimary ? `
                      <button onclick="VideoRenderEngineModule.setPrimaryVersion('${escapeHTML(v.id)}')"
                        style="background:transparent; border:1px solid #475569; color:#cbd5e1; padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer;">
                        Tornar Primária
                      </button>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      `;
    },

    _renderAiProviderNormalizationBanner(timeline, state) {
      if (!timeline) return '';
      const clips = state.getTimelineClips(timeline.id) || [];
      const analysis = state.detectTimelineProviderResolutions(timeline.id);

      return `
        <div style="background:rgba(30,41,59,0.7); border:1px solid #334155; border-radius:8px; padding:14px; font-size:12px; color:#94a3b8;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px; color:#e2e8f0; font-weight:600;">
            <i data-lucide="cpu" style="width:16px; height:16px; color:#38bdf8;"></i>
            Normalização Inteligente de Resoluções Heterogêneas de IA
          </div>
          <p style="margin:0; line-height:1.5;">
            Provedores de IA generativa (ex.: Luma, Runway Gen-3, Kling, Sora) frequentemente entregam formatos com resoluções divergentes (720p, 1080p, variações verticais).
            O pipeline do ArqVertice Studio detectou <strong>${analysis.detected.length} fontes na timeline</strong> e aplica escala uniforme, letterboxing e reamostragem de bitrate para garantir conformidade estrita com o target selecionado (1080p ou 4K UHD).
          </p>
        </div>
      `;
    },

    // ---- Ações do Usuário ----

    selectPreset(presetKey) {
      this.selectedPresetKey = presetKey;
      this._rerender();
    },

    toggleCustomConfig() {
      this.customConfigOpen = !this.customConfigOpen;
      this._rerender();
    },

    triggerQuickRender(videoProjectId) {
      const state = this._getState();
      if (!state) return;

      try {
        const job = state.createRenderJob({
          videoProjectId,
          preset: this.selectedPresetKey
        }, 'Usuário Studio');

        // Inicia o job automaticamente
        state.processRenderJob(job.id, 'Usuário Studio');

        this._rerender();
      } catch (err) {
        alert('Erro ao enfileirar render: ' + err.message);
      }
    },

    enqueueCustomRender(videoProjectId) {
      const state = this._getState();
      if (!state) return;

      const format = document.getElementById('render-cfg-format')?.value || 'mp4';
      const resolution = document.getElementById('render-cfg-resolution')?.value || '1080p';
      const fps = Number(document.getElementById('render-cfg-fps')?.value || 30);
      const codec = document.getElementById('render-cfg-codec')?.value || 'h264';
      const bitrateKbps = Number(document.getElementById('render-cfg-bitrate')?.value || 8000);
      const audioBitrateKbps = Number(document.getElementById('render-cfg-audio')?.value || 192);

      try {
        const job = state.createRenderJob({
          videoProjectId,
          preset: this.selectedPresetKey,
          format,
          resolution,
          fps,
          codec,
          bitrateKbps,
          audioBitrateKbps
        }, 'Usuário Studio');

        state.processRenderJob(job.id, 'Usuário Studio');
        this.customConfigOpen = false;
        this._rerender();
      } catch (err) {
        alert('Erro ao criar render customizado: ' + err.message);
      }
    },

    startJob(jobId) {
      const state = this._getState();
      if (!state) return;
      try {
        state.processRenderJob(jobId, 'Usuário Studio');
        this._rerender();
      } catch (err) {
        alert(err.message);
      }
    },

    advanceJobStep(jobId) {
      const state = this._getState();
      if (!state) return;
      const job = state.getRenderJob(jobId);
      if (!job) return;

      const current = job.progressPercent || 0;
      if (current < 40) {
        state.updateRenderJobProgress(jobId, 45, 'Compilando faixas de vídeo e aplicando transições');
      } else if (current < 75) {
        state.updateRenderJobProgress(jobId, 80, `Codificando container ${job.format.toUpperCase()} (${job.codec})`);
      } else {
        // Concluir com sucesso
        state.completeRenderJob(jobId, {}, 'Usuário Studio');
      }
      this._rerender();
    },

    retryJob(jobId) {
      const state = this._getState();
      if (!state) return;
      try {
        state.retryRenderJob(jobId, 'Usuário Studio');
        state.processRenderJob(jobId, 'Usuário Studio');
        this._rerender();
      } catch (err) {
        alert('Erro ao reiniciar render: ' + err.message);
      }
    },

    cancelJob(jobId) {
      const state = this._getState();
      if (!state) return;
      if (confirm('Deseja realmente cancelar este render?')) {
        try {
          state.cancelRenderJob(jobId, 'Cancelado pelo usuário', 'Usuário Studio');
          this._rerender();
        } catch (err) {
          alert(err.message);
        }
      }
    },

    setPrimaryVersion(versionId) {
      const state = this._getState();
      if (!state) return;
      try {
        state.setPrimaryVideoVersion(versionId, 'Usuário Studio');
        this._rerender();
      } catch (err) {
        alert(err.message);
      }
    },

    // ---- Utilitários ----

    _formatTime(seconds) {
      const s = Number(seconds || 0);
      const mins = Math.floor(s / 60);
      const secs = Math.floor(s % 60);
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    },

    _rerender() {
      if (!this.activeVideoId) return;
      const container = document.getElementById('video-render-engine-container');
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
    module.exports = VideoRenderEngineModule;
  }
  if (typeof global !== 'undefined') {
    global.VideoRenderEngineModule = VideoRenderEngineModule;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
