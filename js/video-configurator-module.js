/**
 * ============================================================================
 * ARQVERTICE STUDIO — BLOCO G02: CONFIGURADOR DE VÍDEO
 * (VIDEO STUDIO CONFIGURATOR)
 * ============================================================================
 * Tela de configuração onde o usuário define o objetivo antes de produzir
 * qualquer conteúdo audiovisual.
 * Contempla os 12 tipos canônicos, proporções, durações (incluindo personalizada),
 * ritmo, estilo narrativo, presença de voz, música, textos, legendas e cenas.
 *
 * REGRA CRUCIAL: Não gerar automaticamente um vídeo antes da confirmação.
 * BOTÃO MANDATÓRIO: "CONTINUAR PARA NARRATIVA"
 * ============================================================================
 */

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const VideoConfiguratorModule = {
  activeVideoId: null,

  _getState() {
    if (typeof StudioState !== 'undefined') return StudioState;
    if (typeof window !== 'undefined' && window.StudioState) return window.StudioState;
    if (typeof require !== 'undefined') {
      try { return require('./state.js'); } catch (e) {}
    }
    return null;
  },

  /**
   * Renderiza a tela completa "Configuração do vídeo"
   */
  renderConfigurator(videoId, projectId) {
    const state = this._getState();
    if (!state) return '<div class="p-4 text-error">Erro ao carregar estado do sistema.</div>';

    let video = null;
    if (videoId) {
      video = state.getVideoProject(videoId);
    }
    if (!video && projectId) {
      const projectVideos = state.getProjectVideos(projectId);
      video = projectVideos[0] || null;
    }
    if (!video) {
      return `
        <div class="video-configurator-error p-5 text-center">
          <h3>Nenhum projeto de vídeo selecionado</h3>
          <p class="text-muted">Crie um vídeo primeiro na aba Vídeo do Projeto.</p>
          <button class="btn btn-outline" onclick="StudioApp.navigateTo('workspace', '${projectId}', 'video')">
            Voltar para Vídeos do Projeto
          </button>
        </div>
      `;
    }

    this.activeVideoId = video.id;
    const project = state.getProject(video.projectId) || { id: video.projectId, name: 'Projeto' };
    const environments = state.getProjectEnvironments ? state.getProjectEnvironments(video.projectId) : (state.data.environments || []).filter(e => e.projectId === video.projectId);
    const presets = state.getVideoConfigPresets();
    const config = state.getVideoConfig(video.id);

    // Tipos canônicos
    const typesMeta = state.VIDEO_CONFIG_TYPES_META || {};
    const typesList = state.VIDEO_CONFIG_TYPES || [];

    const durations = state.VIDEO_DURATIONS || [];
    const ratios = ['16:9', '9:16', '1:1', '4:5'];
    const resolutions = ['720p', '1080p', '2K', '4K'];
    const pacingOptions = state.VIDEO_PACING_OPTIONS || [];
    const narrativeStyles = state.VIDEO_NARRATIVE_STYLES || [];

    return `
      <div class="video-configurator-container animate-fade-in p-4" id="video-configurator-root">
        <!-- TOPBAR E NAVEGAÇÃO -->
        <div class="vcfg-topbar d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <button class="btn btn-ghost btn-sm text-muted p-0" onclick="StudioApp.navigateTo('workspace', '${project.id}', 'video')">
                <i data-lucide="arrow-left" style="width: 14px; height: 14px;"></i> Voltar para Vídeos
              </button>
              <span class="text-muted">•</span>
              <span class="badge-tag" style="background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3);">
                <i data-lucide="settings-2" style="width: 12px; height: 12px;"></i> BLOCO G02
              </span>
              <span class="text-xs text-muted">Definição Prévia de Objetivo</span>
            </div>
            <h2 class="h3 mb-1" style="font-family: var(--font-heading, sans-serif); letter-spacing: -0.02em;">
              Configuração do vídeo — ${escapeHTML(video.title)}
            </h2>
            <p class="text-muted text-sm mb-0">
              Escolha o objetivo, proporção e parâmetros narrativos antes de produzir o roteiro e os prompts.
            </p>
          </div>

          <div class="d-flex gap-2">
            <span class="badge-status-pill status-${video.status}">
              <span class="dot"></span>
              <span>${escapeHTML(video.statusLabel || video.status)}</span>
            </span>
            <span class="badge-rev-code" style="background: rgba(var(--primary-rgb, 197, 160, 89), 0.15); color: var(--primary); font-weight: 700; padding: 4px 10px; border-radius: 6px;">
              ${escapeHTML(video.revision || 'V00')}
            </span>
          </div>
        </div>

        <form id="video-config-form" onsubmit="VideoConfiguratorModule.submitConfigForm(event, '${video.id}')">
          <!-- SEÇÃO 1: OBJETIVO E TIPO DE VÍDEO (12 TIPOS CANÔNICOS) -->
          <div class="vcfg-card bg-card border rounded p-4 mb-4 shadow-sm">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h4 class="h5 mb-1 font-semibold" style="font-family: var(--font-heading, sans-serif);">
                  1. Objetivo da Produção Audiovisual *
                </h4>
                <p class="text-muted text-xs mb-0">
                  O objetivo determina a estrutura de percurso, densidade visual e tom da narração.
                </p>
              </div>
              <span class="text-xs text-muted font-mono">12 Tipos Disponíveis</span>
            </div>

            <div class="row g-3" id="vcfg-types-grid">
              ${typesList.map(typeKey => {
                const meta = typesMeta[typeKey] || { name: typeKey, description: '', icon: 'video' };
                const isSelected = String(config.type).toUpperCase() === String(typeKey).toUpperCase();
                return `
                  <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                    <div class="vcfg-type-card border rounded p-3 cursor-pointer h-100 transition-all ${isSelected ? 'is-selected border-primary bg-primary-subtle' : 'hover-border-primary'}"
                         onclick="VideoConfiguratorModule.selectType('${video.id}', '${escapeHTML(typeKey)}')"
                         style="background: ${isSelected ? 'rgba(var(--primary-rgb, 197, 160, 89), 0.08)' : 'var(--bg-card)'}; border-width: ${isSelected ? '2px' : '1px'};">
                      <div class="d-flex align-items-center justify-content-between mb-2">
                        <span class="badge-icon p-2 rounded" style="background: rgba(168, 85, 247, 0.1); color: #a855f7;">
                          <i data-lucide="${meta.icon || 'film'}" style="width: 16px; height: 16px;"></i>
                        </span>
                        ${isSelected ? '<span class="badge badge-primary text-xs font-bold">Ativo</span>' : ''}
                      </div>
                      <h5 class="text-sm font-semibold mb-1" style="font-family: var(--font-heading, sans-serif);">
                        ${escapeHTML(meta.name || typeKey)}
                      </h5>
                      <p class="text-muted text-xs mb-0" style="line-height: 1.4;">
                        ${escapeHTML(meta.description)}
                      </p>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            <!-- CAMPO ESPECÍFICO DE AMBIENTE QUANDO APLICÁVEL -->
            <div class="mt-4 pt-3 border-top ${config.type.includes('AMBIENTE') ? '' : 'd-none'}" id="vcfg-env-selector-wrap">
              <label class="form-label font-medium text-xs mb-1">Ambiente Específico Vinculado</label>
              <select class="form-select text-sm" id="vfield-env" onchange="VideoConfiguratorModule.updateField('${video.id}', 'environmentId', this.value)" style="max-width: 400px;">
                <option value="">Selecione o ambiente do projeto...</option>
                ${environments.map(env => `
                  <option value="${env.id}" ${config.environmentId === env.id ? 'selected' : ''}>
                    ${escapeHTML(env.name)} (${escapeHTML(env.type || 'Ambiente')})
                  </option>
                `).join('')}
              </select>
            </div>
          </div>

          <!-- SEÇÃO 2: PRESETS RÁPIDOS (1 CLIQUE) -->
          <div class="vcfg-card bg-card border rounded p-4 mb-4 shadow-sm">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h4 class="h5 mb-1 font-semibold" style="font-family: var(--font-heading, sans-serif);">
                  2. Presets Prontos de Produção
                </h4>
                <p class="text-muted text-xs mb-0">
                  Carregue configurações otimizadas de duração, proporção, ritmo e áudio para cada caso de uso.
                </p>
              </div>
            </div>

            <div class="d-flex flex-wrap gap-2">
              ${presets.map(p => `
                <button type="button" class="btn btn-outline btn-sm d-flex align-items-center gap-1 ${config.configPreset === p.id ? 'active btn-primary' : ''}"
                        onclick="VideoConfiguratorModule.applyPreset('${video.id}', '${p.id}')">
                  <i data-lucide="sparkles" style="width: 13px; height: 13px;"></i>
                  <span>${escapeHTML(p.name)}</span>
                  <span class="text-xs opacity-75">(${p.duration}, ${p.aspectRatio})</span>
                </button>
              `).join('')}
            </div>
          </div>

          <!-- SEÇÃO 3: PARÂMETROS TÉCNICOS & CINEMÁTICOS -->
          <div class="vcfg-card bg-card border rounded p-4 mb-4 shadow-sm">
            <h4 class="h5 mb-3 font-semibold border-bottom pb-2" style="font-family: var(--font-heading, sans-serif);">
              3. Especificações Técnicas e de Formato
            </h4>

            <div class="row g-4 mb-4">
              <!-- DURAÇÃO -->
              <div class="col-12 col-lg-6">
                <label class="form-label font-medium text-xs mb-2 d-flex justify-content-between">
                  <span>Duração do Vídeo *</span>
                  <span class="text-muted text-xs" id="vcfg-dur-display">Atual: ${config.duration} (${config.durationSeconds}s)</span>
                </label>
                <div class="d-flex flex-wrap gap-2 mb-2">
                  ${durations.map(d => {
                    const isDurSelected = (!config.isCustomDuration && config.duration === d.value) || (config.isCustomDuration && d.value === 'personalizada');
                    return `
                      <button type="button" class="btn btn-sm ${isDurSelected ? 'btn-primary' : 'btn-outline'}"
                              onclick="VideoConfiguratorModule.selectDuration('${video.id}', '${d.value}', ${d.seconds || 'null'})">
                        ${d.value === 'personalizada' ? 'Personalizada' : d.value}
                      </button>
                    `;
                  }).join('')}
                </div>

                <!-- CAMPO DE DURAÇÃO PERSONALIZADA -->
                <div id="vcfg-custom-dur-wrap" class="${config.isCustomDuration ? '' : 'd-none'} mt-2">
                  <div class="input-group" style="max-width: 260px;">
                    <input type="number" class="form-input text-sm" id="vfield-custom-seconds"
                           placeholder="Ex: 180" value="${config.durationSeconds || 90}" min="5" max="1800"
                           onchange="VideoConfiguratorModule.setCustomDuration('${video.id}', this.value)">
                    <span class="input-group-text text-xs">segundos</span>
                  </div>
                  <small class="text-muted text-xs">Sem limite artificial de tempo para o motor de exportação.</small>
                </div>
              </div>

              <!-- PROPORÇÃO E ORIENTAÇÃO -->
              <div class="col-12 col-lg-6">
                <label class="form-label font-medium text-xs mb-2 d-flex justify-content-between">
                  <span>Proporção de Tela & Orientação *</span>
                  <span class="text-muted text-xs font-mono">Formato</span>
                </label>
                <div class="d-flex flex-wrap gap-2 mb-2">
                  ${ratios.map(r => {
                    const isRatioSelected = config.aspectRatio === r;
                    const rIcon = (r === '9:16' || r === '4:5') ? 'smartphone' : (r === '1:1' ? 'square' : 'monitor');
                    return `
                      <button type="button" class="btn btn-sm ${isRatioSelected ? 'btn-primary' : 'btn-outline'} d-flex align-items-center gap-1"
                              onclick="VideoConfiguratorModule.selectRatio('${video.id}', '${r}')">
                        <i data-lucide="${rIcon}" style="width: 14px; height: 14px;"></i>
                        <span>${r}</span>
                      </button>
                    `;
                  }).join('')}
                </div>
                <small class="text-muted text-xs">
                  Orientação: <strong>${escapeHTML(config.orientationLabel || config.orientation)}</strong>
                </small>
              </div>

              <!-- RESOLUÇÃO -->
              <div class="col-12 col-md-6">
                <label class="form-label font-medium text-xs mb-1">Resolução de Saída</label>
                <select class="form-select text-sm" id="vfield-res" onchange="VideoConfiguratorModule.updateField('${video.id}', 'resolution', this.value)">
                  ${resolutions.map(res => `
                    <option value="${res}" ${config.resolution === res ? 'selected' : ''}>${res}</option>
                  `).join('')}
                </select>
              </div>

              <!-- QUANTIDADE DE CENAS -->
              <div class="col-12 col-md-6">
                <label class="form-label font-medium text-xs mb-1 d-flex justify-content-between">
                  <span>Quantidade Estimada de Cenas</span>
                  <strong id="vcfg-scenes-val">${config.scenesCount} cenas</strong>
                </label>
                <input type="range" class="form-range" id="vfield-scenes" min="1" max="16" value="${config.scenesCount}"
                       oninput="document.getElementById('vcfg-scenes-val').innerText = this.value + ' cenas'; VideoConfiguratorModule.updateField('${video.id}', 'scenesCount', parseInt(this.value, 10))">
                <div class="d-flex justify-content-between text-xs text-muted">
                  <span>1 cena (rápido)</span>
                  <span>8 cenas (médio)</span>
                  <span>16 cenas (longo)</span>
                </div>
              </div>
            </div>
          </div>

          <!-- SEÇÃO 4: RITMO & ESTILO NARRATIVO -->
          <div class="vcfg-card bg-card border rounded p-4 mb-4 shadow-sm">
            <h4 class="h5 mb-3 font-semibold border-bottom pb-2" style="font-family: var(--font-heading, sans-serif);">
              4. Ritmo e Estilo Narrativo
            </h4>

            <div class="row g-4">
              <!-- RITMO (PACING) -->
              <div class="col-12 col-md-6">
                <label class="form-label font-medium text-xs mb-2">Ritmo dos Cortes (Pacing)</label>
                <div class="d-flex flex-column gap-2">
                  ${pacingOptions.map(p => `
                    <label class="border rounded p-3 cursor-pointer d-flex align-items-start gap-2 ${config.pacing === p.id ? 'border-primary bg-primary-subtle' : ''}">
                      <input type="radio" name="vcfg-pacing" value="${p.id}" ${config.pacing === p.id ? 'checked' : ''}
                             onchange="VideoConfiguratorModule.updateField('${video.id}', 'pacing', this.value)" class="mt-1">
                      <div>
                        <strong class="text-sm d-block">${escapeHTML(p.label)}</strong>
                        <span class="text-xs text-muted">${escapeHTML(p.description)}</span>
                      </div>
                    </label>
                  `).join('')}
                </div>
              </div>

              <!-- ESTILO NARRATIVO -->
              <div class="col-12 col-md-6">
                <label class="form-label font-medium text-xs mb-2">Estilo Narrativo</label>
                <div class="d-flex flex-column gap-2">
                  ${narrativeStyles.map(s => `
                    <label class="border rounded p-3 cursor-pointer d-flex align-items-start gap-2 ${config.narrativeStyle === s.id ? 'border-primary bg-primary-subtle' : ''}">
                      <input type="radio" name="vcfg-style" value="${s.id}" ${config.narrativeStyle === s.id ? 'checked' : ''}
                             onchange="VideoConfiguratorModule.updateField('${video.id}', 'narrativeStyle', this.value)" class="mt-1">
                      <div>
                        <strong class="text-sm d-block">${escapeHTML(s.label)}</strong>
                        <span class="text-xs text-muted">${escapeHTML(s.description)}</span>
                      </div>
                    </label>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>

          <!-- SEÇÃO 5: ELEMENTOS AUDIOVISUAIS (VOZ, MÚSICA, TEXTOS, LEGENDAS) -->
          <div class="vcfg-card bg-card border rounded p-4 mb-4 shadow-sm">
            <h4 class="h5 mb-3 font-semibold border-bottom pb-2" style="font-family: var(--font-heading, sans-serif);">
              5. Elementos Audiovisuais
            </h4>

            <div class="row g-3">
              <div class="col-12 col-sm-6 col-md-3">
                <div class="border rounded p-3 h-100 d-flex flex-column justify-content-between">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="font-semibold text-sm">Presença de Voz</span>
                    <input type="checkbox" id="vfield-voice" ${config.hasVoiceover ? 'checked' : ''}
                           onchange="VideoConfiguratorModule.updateField('${video.id}', 'hasVoiceover', this.checked)">
                  </div>
                  <p class="text-muted text-xs mb-0">Locução explicativa guia em português ou inglês.</p>
                </div>
              </div>

              <div class="col-12 col-sm-6 col-md-3">
                <div class="border rounded p-3 h-100 d-flex flex-column justify-content-between">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="font-semibold text-sm">Presença de Música</span>
                    <input type="checkbox" id="vfield-music" ${config.hasMusic ? 'checked' : ''}
                           onchange="VideoConfiguratorModule.updateField('${video.id}', 'hasMusic', this.checked)">
                  </div>
                  <p class="text-muted text-xs mb-0">Trilha sonora orquestrada de acordo com o ritmo.</p>
                </div>
              </div>

              <div class="col-12 col-sm-6 col-md-3">
                <div class="border rounded p-3 h-100 d-flex flex-column justify-content-between">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="font-semibold text-sm">Presença de Textos</span>
                    <input type="checkbox" id="vfield-text" ${config.hasTextOverlays ? 'checked' : ''}
                           onchange="VideoConfiguratorModule.updateField('${video.id}', 'hasTextOverlays', this.checked)">
                  </div>
                  <p class="text-muted text-xs mb-0">Títulos de abertura, nomes de ambientes e especificações.</p>
                </div>
              </div>

              <div class="col-12 col-sm-6 col-md-3">
                <div class="border rounded p-3 h-100 d-flex flex-column justify-content-between">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="font-semibold text-sm">Presença de Legendas</span>
                    <input type="checkbox" id="vfield-subs" ${config.hasSubtitles ? 'checked' : ''}
                           onchange="VideoConfiguratorModule.updateField('${video.id}', 'hasSubtitles', this.checked)">
                  </div>
                  <p class="text-muted text-xs mb-0">Legendas sincronizadas para redes sociais (sem som).</p>
                </div>
              </div>
            </div>
          </div>

          <!-- BARRA DE AÇÃO FIXA / PRINCIPAL -->
          <div class="vcfg-action-bar bg-card border rounded p-4 d-flex justify-content-between align-items-center shadow-lg">
            <div class="d-flex align-items-center gap-2">
              <button type="button" class="btn btn-outline" onclick="StudioApp.navigateTo('workspace', '${project.id}', 'video')">
                Cancelar e Voltar
              </button>
              <button type="button" class="btn btn-ghost text-muted" onclick="VideoConfiguratorModule.saveDraft('${video.id}')">
                Salvar Rascunho
              </button>
            </div>

            <div class="d-flex align-items-center gap-3">
              <span class="text-xs text-muted d-none d-md-inline">
                Nenhum vídeo será renderizado antes da confirmação da narrativa.
              </span>
              <!-- BOTÃO MANDATÓRIO EXIGIDO NO PROMPT -->
              <button type="submit" class="btn btn-primary btn-lg font-bold px-4 py-3 d-flex align-items-center gap-2" id="btn-continue-narrative" style="background: linear-gradient(135deg, var(--primary, #c5a059), #b38e47); box-shadow: 0 4px 14px rgba(197, 160, 89, 0.35);">
                <span>CONTINUAR PARA NARRATIVA</span>
                <i data-lucide="arrow-right" style="width: 18px; height: 18px;"></i>
              </button>
            </div>
          </div>
        </form>
      </div>
    `;
  },

  /**
   * Manipuladores de Ação e Atualização de Estado
   */
  selectType(videoId, typeKey) {
    const state = this._getState();
    if (!state) return;
    state.saveVideoConfig(videoId, { type: typeKey });
    this.refreshView(videoId);
  },

  applyPreset(videoId, presetKey) {
    const state = this._getState();
    if (!state) return;
    state.applyVideoPreset(videoId, presetKey);
    if (typeof StudioApp !== 'undefined' && StudioApp.showToast) {
      StudioApp.showToast(`Preset "${presetKey}" aplicado com sucesso.`);
    }
    this.refreshView(videoId);
  },

  selectDuration(videoId, durValue, durSeconds) {
    const state = this._getState();
    if (!state) return;

    if (durValue === 'personalizada') {
      state.saveVideoConfig(videoId, { isCustomDuration: true, duration: 'personalizada' });
    } else {
      state.saveVideoConfig(videoId, {
        duration: durValue,
        durationSeconds: durSeconds,
        isCustomDuration: false
      });
    }
    this.refreshView(videoId);
  },

  setCustomDuration(videoId, secondsVal) {
    const state = this._getState();
    if (!state) return;
    const sec = parseInt(secondsVal, 10);
    if (!isNaN(sec) && sec > 0) {
      state.saveVideoConfig(videoId, {
        duration: `${sec}s`,
        durationSeconds: sec,
        isCustomDuration: true
      });
    }
  },

  selectRatio(videoId, ratioValue) {
    const state = this._getState();
    if (!state) return;
    state.saveVideoConfig(videoId, { aspectRatio: ratioValue });
    this.refreshView(videoId);
  },

  updateField(videoId, fieldName, fieldValue) {
    const state = this._getState();
    if (!state) return;
    state.saveVideoConfig(videoId, { [fieldName]: fieldValue });
  },

  saveDraft(videoId) {
    if (typeof StudioApp !== 'undefined' && StudioApp.showToast) {
      StudioApp.showToast('Rascunho de configuração salvo.');
    }
  },

  /**
   * Confirmação da configuração e avanço para a etapa de narrativa
   */
  submitConfigForm(event, videoId) {
    if (event) event.preventDefault();
    const state = this._getState();
    if (!state) return;

    try {
      const confirmedVideo = state.confirmVideoConfig(videoId);
      if (typeof StudioApp !== 'undefined' && StudioApp.showToast) {
        StudioApp.showToast('Configuração confirmada! Avançando para a Narrativa do Projeto...');
      }

      // Renderiza tela de transição informando que a configuração foi homologada
      const root = document.getElementById('video-configurator-root') || document.body;
      root.innerHTML = `
        <div class="vcfg-success-card text-center p-5 bg-card border rounded shadow-sm animate-fade-in" style="max-width: 640px; margin: 40px auto;">
          <div style="background: rgba(16, 185, 129, 0.1); width: 72px; height: 72px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
            <i data-lucide="check-circle" style="width: 40px; height: 40px; stroke: #10b981;"></i>
          </div>
          <h3 class="h4 mb-2" style="font-family: var(--font-heading, sans-serif);">Configuração do Vídeo Homologada</h3>
          <p class="text-muted text-sm mb-4" style="line-height: 1.6;">
            O objetivo <strong>"${escapeHTML(confirmedVideo.typeLabel || confirmedVideo.type)}"</strong> foi gravado.<br>
            Duração: <strong>${confirmedVideo.duration}</strong> • Proporção: <strong>${confirmedVideo.aspectRatio}</strong> • Ritmo: <strong>${confirmedVideo.pacingLabel || confirmedVideo.pacing}</strong>.<br>
            O projeto está agora pronto para a construção da Narrativa Arquitetônica (Etapa G03).
          </p>
          <div class="d-flex justify-content-center gap-3">
            <button class="btn btn-outline" onclick="VideoConfiguratorModule.refreshView('${videoId}')">
              Revisar Configurações
            </button>
            <button class="btn btn-primary" onclick="StudioApp.navigateTo('workspace', '${confirmedVideo.projectId}', 'video')">
              Voltar ao Painel Audiovisual
            </button>
          </div>
        </div>
      `;
      if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    } catch (err) {
      alert('Erro ao confirmar configuração: ' + err.message);
    }
  },

  refreshView(videoId) {
    const state = this._getState();
    if (!state) return;
    const video = state.getVideoProject(videoId);
    if (!video) return;

    const mainContainer = document.getElementById('project-tab-content') || document.getElementById('video-configurator-root');
    if (mainContainer) {
      mainContainer.innerHTML = this.renderConfigurator(videoId, video.projectId);
      if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    }
  }
};

if (typeof window !== 'undefined') {
  window.VideoConfiguratorModule = VideoConfiguratorModule;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VideoConfiguratorModule;
}
