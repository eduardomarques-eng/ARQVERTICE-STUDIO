/**
 * ============================================================================
 * ARQVERTICE STUDIO — BLOCO G01: FUNDAÇÃO DO MÓDULO DE PRODUÇÃO AUDIOVISUAL
 * (VIDEO STUDIO FOUNDATION)
 * ============================================================================
 * Módulo de gerenciamento de produções audiovisuais do projeto.
 * Permite instanciar, duplicar, versionar e acompanhar o status de vídeos.
 * A criação de vídeo é estritamente opcional.
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

const VideoStudioModule = {
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
   * Renderiza a área principal "Vídeo do Projeto" no Workspace do Projeto
   */
  renderProjectVideos(project) {
    if (!project) return '<div class="empty-state-card"><p>Nenhum projeto selecionado.</p></div>';
    const state = this._getState();
    const videos = state ? state.getProjectVideos(project.id, { includeArchived: true }) : [];
    const activeVideos = videos.filter(v => !v.isArchived);
    const archivedVideos = videos.filter(v => v.isArchived);

    return `
      <div class="video-studio-workspace animate-fade-in p-4">
        <!-- CABEÇALHO DA ÁREA DE VÍDEOS -->
        <div class="vsw-header d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="badge-tag" style="background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3);">
                <i data-lucide="video" style="width: 13px; height: 13px;"></i> BLOCO G01 • AUDIOVISUAL
              </span>
              <span class="text-xs text-muted">Produção Cinematográfica Opcional</span>
            </div>
            <h2 class="h3 mb-1" style="font-family: var(--font-heading, sans-serif); letter-spacing: -0.02em;">
              Vídeo do Projeto — ${escapeHTML(project.name)}
            </h2>
            <p class="text-muted text-sm mb-0">
              Transforme o projeto em narrativas audiovisuais, teasers, reels e apresentações para o cliente.
            </p>
          </div>

          <div class="d-flex gap-2">
            <button class="btn btn-outline btn-sm" onclick="StudioApp.openProjectReportModal()" title="Exportar Relatório Geral">
              <i data-lucide="file-text"></i> Dossiê
            </button>
            <button class="btn btn-primary btn-sm" onclick="VideoStudioModule.openCreateModal('${project.id}')">
              <i data-lucide="plus"></i> Novo Vídeo (Opcional)
            </button>
          </div>
        </div>

        <!-- LISTA DE PRODUÇÕES ATIVAS -->
        ${activeVideos.length === 0 ? this.renderEmptyState(project) : `
          <div class="vsw-grid-container mb-4">
            <div class="row g-4">
              ${activeVideos.map(video => this.renderVideoCard(video, project)).join('')}
            </div>
          </div>
        `}

        <!-- SEÇÃO DE ARQUIVADOS (SE HOUVER) -->
        ${archivedVideos.length > 0 ? `
          <div class="vsw-archived-section mt-5 pt-3 border-top">
            <details>
              <summary class="text-muted text-sm cursor-pointer mb-3">
                <i data-lucide="archive"></i> Vídeos Arquivados (${archivedVideos.length})
              </summary>
              <div class="row g-3 opacity-75">
                ${archivedVideos.map(video => this.renderVideoCard(video, project, true)).join('')}
              </div>
            </details>
          </div>
        ` : ''}

        <!-- CONTAINER PARA MODAL INJETADO -->
        <div id="vsw-modal-root"></div>
      </div>
    `;
  },

  /**
   * Renderiza um Card de Vídeo individual com todos os campos exigidos
   */
  renderVideoCard(video, project, isArchived = false) {
    const state = this._getState();
    const env = (state && video.environmentId) ? state.getEnvironment(video.environmentId) : null;
    const pres = (state && video.presentationId) ? ((state.data && state.data.presentations) || []).find(p => p.id === video.presentationId) : null;

    let statusClass = 'status-rascunho';
    if (video.status === 'aprovado' || video.status === 'finalizado') statusClass = 'status-approved';
    else if (video.status === 'producao' || video.status === 'roteiro' || video.status === 'storyboard') statusClass = 'status-production';
    else if (video.status === 'revisao') statusClass = 'status-review';

    const ratioIcon = video.aspectRatio === '9:16' ? 'smartphone' : 'monitor';

    return `
      <div class="col-12 col-md-6 col-xl-4">
        <div class="video-project-card bg-card border rounded p-4 h-100 d-flex flex-column shadow-sm position-relative ${video.isApproved ? 'is-approved' : ''}">
          <!-- CABEÇALHO DO CARD -->
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div class="d-flex flex-wrap gap-1">
              <span class="badge-status-pill ${statusClass}">
                <span class="dot"></span>
                <span>${escapeHTML(video.statusLabel || video.status)}</span>
              </span>
              <span class="badge-rev-code" style="background: rgba(var(--primary-rgb, 197, 160, 89), 0.12); color: var(--primary); font-weight: 700; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">
                ${escapeHTML(video.revision || 'V00')}
              </span>
            </div>

            <div class="card-meta-ratio text-xs text-muted d-flex align-items-center gap-1">
              <i data-lucide="${ratioIcon}" style="width: 14px; height: 14px;"></i>
              <span>${video.aspectRatio} • ${video.resolution}</span>
            </div>
          </div>

          <!-- TÍTULO E TIPO -->
          <h4 class="card-title text-base font-semibold mb-1" style="font-family: var(--font-heading, sans-serif);">
            ${escapeHTML(video.title)}
          </h4>
          <span class="text-xs text-primary mb-2 d-inline-block font-medium">
            <i data-lucide="film" style="width: 12px; height: 12px; display: inline;"></i> ${escapeHTML(video.typeLabel || video.type)}
          </span>

          <p class="text-muted text-xs mb-3 flex-grow-1" style="line-height: 1.5;">
            ${escapeHTML(video.objective || video.description || 'Produção de vídeo para apresentação e validação espacial.')}
          </p>

          <!-- DADOS TÉCNICOS: PROJETO, AMBIENTE, DURAÇÃO, REVISÃO -->
          <div class="card-tech-specs bg-light p-2 rounded mb-3 text-xs">
            <div class="d-flex justify-content-between py-1 border-bottom">
              <span class="text-muted">Projeto:</span>
              <strong class="text-truncate" style="max-width: 160px;">${escapeHTML(project.name)}</strong>
            </div>
            <div class="d-flex justify-content-between py-1 border-bottom">
              <span class="text-muted">Ambiente:</span>
              <span>${env ? escapeHTML(env.name) : 'Geral / Todo o Projeto'}</span>
            </div>
            <div class="d-flex justify-content-between py-1 border-bottom">
              <span class="text-muted">Duração Estimada:</span>
              <strong><i data-lucide="clock" style="width: 11px; height: 11px; display: inline;"></i> ${video.duration}</strong>
            </div>
            <div class="d-flex justify-content-between py-1">
              <span class="text-muted">Apresentação:</span>
              <span>${pres ? escapeHTML(pres.title || 'Vinculada') : 'Avulso'}</span>
            </div>
          </div>

          <!-- PROGRESSO DA PRODUÇÃO -->
          <div class="card-progress-wrap mb-3">
            <div class="d-flex justify-content-between text-xs text-muted mb-1">
              <span>Maturidade da Produção</span>
              <strong>${video.progressPercent}%</strong>
            </div>
            <div class="progress" style="height: 6px; background: rgba(0,0,0,0.06); border-radius: 3px; overflow: hidden;">
              <div class="progress-bar" style="width: ${video.progressPercent}%; background: ${video.isApproved ? '#10b981' : 'var(--primary, #c5a059)'}; transition: width 0.3s ease;"></div>
            </div>
          </div>

          <!-- BOTÕES DE AÇÃO EXIGIDOS -->
          <div class="card-actions-grid d-flex flex-wrap gap-2 pt-2 border-top">
            <button class="btn btn-primary btn-sm flex-grow-1" onclick="VideoStudioModule.openConfigurator('${video.id}', '${project.id}')" title="Configurar e continuar produção">
              <i data-lucide="sliders"></i> Continuar
            </button>
            <button class="btn btn-outline btn-sm" onclick="VideoStudioModule.openRemotionPlayer('${video.id}', '${project.id}')" title="Player Interativo Remotion" style="color:#38bdf8; border-color:rgba(56,189,248,0.4);">
              <i data-lucide="play-circle"></i> Remotion
            </button>
            <button class="btn btn-outline btn-sm" onclick="VideoStudioModule.openQA('${video.id}')" title="Auditoria de Qualidade Audiovisual (G14)" style="color:#c084fc; border-color:rgba(168,85,247,0.4);">
              <i data-lucide="shield-check"></i> QA
            </button>
            <button class="btn btn-outline btn-sm" onclick="VideoStudioModule.duplicateVideo('${video.id}')" title="Duplicar produção">
              <i data-lucide="copy"></i> Duplicar
            </button>
            <button class="btn btn-secondary btn-sm" onclick="VideoStudioModule.createVersion('${video.id}')" title="Criar nova versão sequencial">
              <i data-lucide="git-branch"></i> Nova Versão
            </button>
            ${!isArchived ? `
              <button class="btn btn-icon btn-ghost btn-sm text-muted" onclick="VideoStudioModule.archiveVideo('${video.id}')" title="Arquivar">
                <i data-lucide="archive"></i>
              </button>
            ` : `
              <button class="btn btn-icon btn-ghost btn-sm text-emerald" onclick="VideoStudioModule.restoreVideo('${video.id}')" title="Restaurar">
                <i data-lucide="rotate-ccw"></i>
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Estado vazio com chamada para ação opcional
   */
  renderEmptyState(project) {
    return `
      <div class="empty-video-state text-center p-5 bg-card border rounded shadow-sm" style="max-width: 680px; margin: 30px auto;">
        <div style="background: rgba(168, 85, 247, 0.1); width: 72px; height: 72px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
          <i data-lucide="video" style="width: 36px; height: 36px; stroke: #a855f7;"></i>
        </div>
        <h3 class="h4 mb-2" style="font-family: var(--font-heading, sans-serif);">Nenhum Vídeo Criado Neste Projeto</h3>
        <p class="text-muted text-sm mb-4" style="line-height: 1.6;">
          A produção audiovisual no ArqVertice Studio é <strong>estritamente opcional</strong>.<br>
          Você pode compilar renders aprovados, plantas humanizadas e diretrizes conceituais em apresentações de vídeo para o cliente, reels para redes sociais ou teasers de lançamento.
        </p>
        <button class="btn btn-primary" onclick="VideoStudioModule.openCreateModal('${project.id}')">
          <i data-lucide="plus-circle"></i> Criar Primeiro Vídeo do Projeto
        </button>
      </div>
    `;
  },

  /**
   * Modal para criar novo projeto de vídeo
   */
  openCreateModal(projectId) {
    const project = StudioState.getProject(projectId);
    if (!project) return;

    const envs = StudioState.getProjectEnvironments(projectId);
    const presentations = (StudioState.data.presentations || []).filter(p => p.projectId === projectId);
    const types = StudioState.VIDEO_PROJECT_TYPES;
    const ratios = StudioState.VIDEO_ASPECT_RATIOS?.ALL || ['16:9', '9:16', '1:1', '4:5'];

    const root = document.getElementById('vsw-modal-root') || document.body;
    root.innerHTML = `
      <div class="modal-overlay is-open" id="modal-create-video" style="display: flex;">
        <div class="modal-card" style="max-width: 600px;">
          <div class="modal-header d-flex justify-content-between align-items-center">
            <h3>Nova Produção Audiovisual (Opcional)</h3>
            <button class="btn-icon btn-ghost" onclick="VideoStudioModule.closeModal('modal-create-video')">
              <i data-lucide="x"></i>
            </button>
          </div>
          <form onsubmit="VideoStudioModule.submitCreateForm(event, '${projectId}')">
            <div class="modal-body p-4">
              <div class="form-group mb-3">
                <label class="form-label font-medium text-xs mb-1">Título da Produção *</label>
                <input type="text" id="vfield-title" class="form-input" placeholder="Ex: Tour Cinematográfico — Living e Lazer" value="Apresentação em Vídeo — ${escapeHTML(project.name)}" required>
              </div>

              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label font-medium text-xs mb-1">Tipo de Vídeo</label>
                  <select id="vfield-type" class="form-select">
                    ${types.ALL.map(t => `<option value="${t}">${types.LABELS[t] || t}</option>`).join('')}
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label font-medium text-xs mb-1">Formato / Aspect Ratio</label>
                  <select id="vfield-ratio" class="form-select">
                    ${ratios.map(r => `<option value="${r}">${r} ${r === '16:9' ? '(Horizontal/TV)' : r === '9:16' ? '(Vertical/Reels)' : ''}</option>`).join('')}
                  </select>
                </div>
              </div>

              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label font-medium text-xs mb-1">Ambiente em Foco (Opcional)</label>
                  <select id="vfield-env" class="form-select">
                    <option value="">Geral (Todos os Ambientes)</option>
                    ${envs.map(e => `<option value="${e.id}">${escapeHTML(e.name)}</option>`).join('')}
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label font-medium text-xs mb-1">Vincular Apresentação</label>
                  <select id="vfield-pres" class="form-select">
                    <option value="">Nenhuma / Avulso</option>
                    ${presentations.map(p => `<option value="${p.id}">${escapeHTML(p.title || 'Apresentação')}</option>`).join('')}
                  </select>
                </div>
              </div>

              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label font-medium text-xs mb-1">Duração Alvo</label>
                  <input type="text" id="vfield-duration" class="form-input" value="01:30" placeholder="Ex: 00:45, 01:30, 03:00">
                </div>
                <div class="col-md-6">
                  <label class="form-label font-medium text-xs mb-1">Resolução Alvo</label>
                  <select id="vfield-resolution" class="form-select">
                    <option value="1080p">1080p (Full HD)</option>
                    <option value="4K">4K (Ultra HD)</option>
                    <option value="720p">720p (Compacto)</option>
                  </select>
                </div>
              </div>

              <div class="form-group mb-2">
                <label class="form-label font-medium text-xs mb-1">Objetivo Narrativo / Observações</label>
                <textarea id="vfield-objective" class="form-textarea" rows="2" placeholder="Descreva a intenção visual, público-alvo e clima desejado."></textarea>
              </div>
            </div>

            <div class="modal-footer p-3 bg-light d-flex justify-content-end gap-2 border-top">
              <button type="button" class="btn btn-secondary" onclick="VideoStudioModule.closeModal('modal-create-video')">Cancelar</button>
              <button type="submit" class="btn btn-primary"><i data-lucide="check"></i> Criar Produção</button>
            </div>
          </form>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  },

  /**
   * Submete criação de novo vídeo
   */
  submitCreateForm(e, projectId) {
    e.preventDefault();
    const title = document.getElementById('vfield-title').value;
    const type = document.getElementById('vfield-type').value;
    const aspectRatio = document.getElementById('vfield-ratio').value;
    const environmentId = document.getElementById('vfield-env').value || null;
    const presentationId = document.getElementById('vfield-pres').value || null;
    const duration = document.getElementById('vfield-duration').value || '01:30';
    const resolution = document.getElementById('vfield-resolution').value || '1080p';
    const objective = document.getElementById('vfield-objective').value;

    StudioState.createVideoProject({
      projectId,
      title,
      type,
      aspectRatio,
      environmentId,
      presentationId,
      duration,
      resolution,
      objective,
      status: 'planejamento'
    }, 'Arquiteto');

    this.closeModal('modal-create-video');
    this.refreshUI(projectId);
  },

  /**
   * Modal de detalhes e continuação do trabalho
   */
  openContinueModal(videoId) {
    const video = StudioState.getVideoProject(videoId);
    if (!video) return;

    const project = StudioState.getProject(video.projectId);
    const scenes = StudioState.getVideoScenes(videoId);
    const versions = StudioState.getVideoVersions(videoId);

    const root = document.getElementById('vsw-modal-root') || document.body;
    root.innerHTML = `
      <div class="modal-overlay is-open" id="modal-continue-video" style="display: flex;">
        <div class="modal-card" style="max-width: 720px;">
          <div class="modal-header d-flex justify-content-between align-items-center">
            <div>
              <span class="badge-status-pill status-approved text-xs mb-1">${video.statusLabel} • ${video.revision}</span>
              <h3>${escapeHTML(video.title)}</h3>
            </div>
            <button class="btn-icon btn-ghost" onclick="VideoStudioModule.closeModal('modal-continue-video')">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="modal-body p-4">
            <div class="row g-3 mb-4">
              <div class="col-md-4">
                <div class="p-3 bg-light rounded text-center">
                  <span class="text-xs text-muted d-block">Duração</span>
                  <strong>${video.duration}</strong>
                </div>
              </div>
              <div class="col-md-4">
                <div class="p-3 bg-light rounded text-center">
                  <span class="text-xs text-muted d-block">Formato</span>
                  <strong>${video.aspectRatio} (${video.resolution})</strong>
                </div>
              </div>
              <div class="col-md-4">
                <div class="p-3 bg-light rounded text-center">
                  <span class="text-xs text-muted d-block">Cenas Cadastradas</span>
                  <strong>${scenes.length} cena(s)</strong>
                </div>
              </div>
            </div>

            <!-- ESTRUTURA DE CENAS (FUNDAÇÃO) -->
            <div class="mb-4">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h5 class="font-semibold text-sm mb-0">Estrutura de Cenas & Roteiro (G01)</h5>
                <button class="btn btn-outline btn-xs" onclick="VideoStudioModule.promptAddScene('${video.id}')">
                  <i data-lucide="plus"></i> Adicionar Cena
                </button>
              </div>
              ${scenes.length === 0 ? `
                <p class="text-muted text-xs p-3 bg-light rounded text-center">Nenhuma cena estruturada ainda. Clique em "Adicionar Cena" para montar o storyboard.</p>
              ` : `
                <div class="list-group">
                  ${scenes.map(s => `
                    <div class="list-group-item d-flex justify-content-between align-items-center p-2 border rounded mb-1 text-xs">
                      <div>
                        <strong>Cena ${s.sceneNumber}: ${escapeHTML(s.title)}</strong>
                        <span class="text-muted ms-2">• ${escapeHTML(s.environmentName || 'Geral')} • ~${s.estimatedDurationSeconds}s</span>
                      </div>
                      <span class="badge bg-light text-muted">${escapeHTML(s.narrativeGoal || 'Sem notas')}</span>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>

            <!-- ALTERAR STATUS DA PRODUÇÃO -->
            <div class="p-3 bg-light rounded mb-2">
              <label class="form-label font-medium text-xs mb-1">Avançar Status da Produção:</label>
              <div class="d-flex gap-2 flex-wrap">
                ${StudioState.VIDEO_PROJECT_STATUSES.ALL.filter(st => st !== 'arquivado').map(st => `
                  <button class="btn btn-xs ${video.status === st ? 'btn-primary' : 'btn-outline'}" onclick="VideoStudioModule.changeStatus('${video.id}', '${st}')">
                    ${StudioState.VIDEO_PROJECT_STATUSES.LABELS[st] || st}
                  </button>
                `).join('')}
              </div>
            </div>
          </div>
          <div class="modal-footer p-3 bg-light d-flex justify-content-between border-top">
            <button class="btn btn-outline btn-sm" onclick="VideoStudioModule.createVersion('${video.id}')">
              <i data-lucide="git-branch"></i> Congelar Versão Atual (${video.revision})
            </button>
            <button class="btn btn-primary btn-sm" onclick="VideoStudioModule.closeModal('modal-continue-video')">
              Salvar & Fechar
            </button>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  },

  promptAddScene(videoId) {
    const title = prompt('Título da nova cena (ex: Vista da Varanda Gourmet):');
    if (!title) return;
    StudioState.addVideoScene(videoId, { title });
    this.openContinueModal(videoId);
  },

  duplicateVideo(videoId) {
    try {
      const duplicated = StudioState.duplicateVideoProject(videoId, 'Arquiteto');
      this.refreshUI(duplicated.projectId);
    } catch (e) {
      alert(e.message);
    }
  },

  createVersion(videoId) {
    try {
      const updated = StudioState.createVideoVersion(videoId, 'Nova revisão solicitada pela equipe', 'Arquiteto');
      this.refreshUI(updated.projectId);
      alert(`Versão ${updated.revision} iniciada com sucesso. A versão anterior foi congelada no histórico.`);
    } catch (e) {
      alert(e.message);
    }
  },

  archiveVideo(videoId) {
    if (!confirm('Deseja arquivar esta produção de vídeo?')) return;
    const v = StudioState.archiveVideoProject(videoId, 'Arquiteto');
    this.refreshUI(v.projectId);
  },

  restoreVideo(videoId) {
    const v = StudioState.restoreVideoProject(videoId, 'Arquiteto');
    this.refreshUI(v.projectId);
  },

  changeStatus(videoId, newStatus) {
    try {
      StudioState.setVideoStatus(videoId, newStatus, 'Arquiteto');
      this.openContinueModal(videoId);
      const v = StudioState.getVideoProject(videoId);
      this.refreshUI(v.projectId);
    } catch (e) {
      alert(e.message);
    }
  },

  openConfigurator(videoId, projectId) {
    if (typeof VideoConfiguratorModule !== 'undefined') {
      const mainContainer = document.getElementById('project-tab-content');
      if (mainContainer) {
        mainContainer.innerHTML = VideoConfiguratorModule.renderConfigurator(videoId, projectId);
        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
      }
    } else {
      this.openContinueModal(videoId);
    }
  },

  openQA(videoId) {
    if (typeof VideoQAModule !== 'undefined') {
      const mainContainer = document.getElementById('project-tab-content');
      if (mainContainer) {
        mainContainer.innerHTML = VideoQAModule.render(videoId);
        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
      }
    } else {
      alert('Módulo de Controle de Qualidade (QA) não carregado.');
    }
  },

  openRemotionPlayer(videoId, projectId) {
    if (typeof RemotionVideoEngine !== 'undefined') {
      const mainContainer = document.getElementById('project-tab-content');
      if (mainContainer) {
        mainContainer.innerHTML = `
          <div class="p-4 animate-fade-in" style="max-width: 1080px; margin: 0 auto;">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <button class="btn btn-ghost btn-sm text-muted p-0" onclick="StudioApp.navigateTo('workspace', '${projectId}', 'video')">
                <i data-lucide="arrow-left" style="width: 14px; height: 14px;"></i> Voltar para Produções
              </button>
              <span class="badge-tag" style="background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3);">
                <i data-lucide="play-circle" style="width: 12px; height: 12px; display: inline;"></i> REMOTION VIDEO ENGINE
              </span>
            </div>
            <div id="remotion-mount-target"></div>
          </div>
        `;
        RemotionVideoEngine.mountPlayer('remotion-mount-target', projectId, videoId);
        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
      }
    } else {
      alert('RemotionVideoEngine não carregado.');
    }
  },

  refreshUI(projectId) {
    if (typeof StudioApp !== 'undefined' && StudioApp.currentProjectId === projectId) {
      StudioApp.renderProjectWorkspace();
    }
  }
};

// Exportação global e para Node.js
if (typeof window !== 'undefined') {
  window.VideoStudioModule = VideoStudioModule;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VideoStudioModule;
}
