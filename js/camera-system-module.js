/**
 * ============================================================================
 * ARQVERTICE STUDIO — D05: SISTEMA DE CÂMERAS E ENQUADRAMENTOS
 * ============================================================================
 * Módulo de gestão de câmeras por ambiente, enquadramentos, lentes focais,
 * origens (Revit, Manual, Referência, Sugestão IA), referências fotográficas
 * (CAMERA_REFERENCE), versionamento não destrutivo e aprovação/bloqueio.
 */

const CameraSystemModule = (function () {
  'use strict';

  /**
   * Renderiza a visualização e gestão de câmeras do ambiente
   */
  function render(env, project) {
    if (!env || !project) {
      return '<div class="empty-state-card"><p>Ambiente ou projeto inválido.</p></div>';
    }

    const cameras = StudioState.getEnvironmentCameras(project.id, env.id);
    const approvedCount = cameras.filter(c => c.status === 'APPROVED' || c.status === 'LOCKED').length;
    const lockedCount = cameras.filter(c => c.isLocked).length;

    return `
      <div class="camera-system-container animate-fade-in" id="camera-system-container-${env.id}">
        <!-- Topo: Painel de Controle e Contadores do Sistema de Câmeras -->
        <header class="camera-system-header">
          <div class="cam-header-left">
            <div class="cam-system-tag">
              <i data-lucide="camera"></i>
              <span>D05 CAMERA_SYSTEM</span>
            </div>
            <div class="cam-stats-pills">
              <span class="cam-stat-pill total">
                <strong>${cameras.length}</strong> Câmeras Definidas
              </span>
              <span class="cam-stat-pill approved">
                <i data-lucide="check-circle-2"></i> <strong>${approvedCount}</strong> Aprovadas
              </span>
              <span class="cam-stat-pill locked">
                <i data-lucide="lock"></i> <strong>${lockedCount}</strong> Bloqueadas
              </span>
            </div>
          </div>

          <div class="cam-header-right">
            <button class="btn btn-outline btn-sm" onclick="CameraSystemModule.handleTriggerAISuggestions('${project.id}', '${env.id}')" title="A IA sugere novos enquadramentos sem alterar câmeras bloqueadas">
              <i data-lucide="sparkles"></i> Sugerir Câmeras (IA)
            </button>
            <button class="btn btn-primary btn-sm" onclick="CameraSystemModule.openCreateModal('${project.id}', '${env.id}')">
              <i data-lucide="plus"></i> Nova Câmera
            </button>
          </div>
        </header>

        <!-- Banner de Diretriz Técnica e Preservação de Câmeras Bloqueadas -->
        <div class="cam-guideline-banner">
          <i data-lucide="shield-check"></i>
          <div>
            <strong>Diretriz de Câmeras & Consistência:</strong> Câmeras aprovadas tornam-se referências oficiais de enquadramento para as perspectivas humanizadas (D04) e animações futuras (D06). Câmeras marcadas como <em>LOCKED</em> são estritamente protegidas contra alterações acidentais e não sofrem modificações por sugestões de IA. Se um enquadramento for ajustado, o sistema cria automaticamente uma nova versão rastreável (V01 &rarr; V02).
          </div>
        </div>

        <!-- Grid de Câmeras Cadastradas -->
        ${cameras.length > 0 ? `
          <div class="camera-cards-grid">
            ${cameras.map((cam, idx) => renderCameraCard(cam, idx, cameras.length, project, env)).join('')}
          </div>
        ` : `
          <div class="cam-empty-state">
            <i data-lucide="video-off"></i>
            <h3>Nenhuma Câmera Cadastrada para este Ambiente</h3>
            <p>Defina pontos de vista fotográficos manuais, importe vistas 3D do Revit ou utilize a sugestão automática de enquadramento por IA.</p>
            <button class="btn btn-primary" onclick="CameraSystemModule.openCreateModal('${project.id}', '${env.id}')">
              <i data-lucide="plus"></i> Criar Primeira Câmera
            </button>
          </div>
        `}
      </div>

      <!-- Modais do Sistema de Câmeras -->
      ${renderModals(project, env)}
    `;
  }

  /**
   * Renderiza o card individual da câmera
   */
  function renderCameraCard(cam, idx, total, project, env) {
    const originBadgeClasses = {
      'REVIT': 'origin-revit',
      'MANUAL': 'origin-manual',
      'REFERENCIA': 'origin-ref',
      'SUGESTAO_IA': 'origin-ai'
    };

    const statusBadgeClasses = {
      'APPROVED': 'status-approved',
      'LOCKED': 'status-locked',
      'DRAFT': 'status-draft',
      'REJECTED': 'status-rejected',
      'ARCHIVED': 'status-archived'
    };

    const previewImage = cam.cameraReferenceUrl || cam.baseImageUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';
    const versions = cam.versions || [];

    return `
      <div class="camera-item-card ${cam.isLocked ? 'is-locked' : ''} ${cam.status === 'APPROVED' ? 'is-approved' : ''}" id="camera-card-${cam.id}">
        <!-- Topo do Card: Código, Nome, Status e Origem -->
        <div class="cam-card-header">
          <div class="cam-card-title-group">
            <span class="cam-code-badge">${escapeHTML(cam.cameraCode)}</span>
            <div class="cam-title-wrap">
              <h4 title="${escapeHTML(cam.name)}">${escapeHTML(cam.name)}</h4>
              <span class="cam-desc">${escapeHTML(cam.description || 'Sem descrição cadastrada')}</span>
            </div>
          </div>

          <div class="cam-badges-row">
            <span class="cam-badge ${originBadgeClasses[cam.origin] || 'origin-manual'}" title="Origem do enquadramento">
              <i data-lucide="${cam.origin === 'REVIT' ? 'box' : cam.origin === 'SUGESTAO_IA' ? 'sparkles' : 'camera'}"></i>
              ${escapeHTML(cam.origin)}
            </span>
            <span class="cam-badge ${statusBadgeClasses[cam.status] || 'status-draft'}">
              ${cam.isLocked ? '<i data-lucide="lock"></i>' : ''}
              ${escapeHTML(cam.status)}
            </span>
            <span class="cam-version-tag" title="Versão de enquadramento">${escapeHTML(cam.currentVersion || 'V01')}</span>
          </div>
        </div>

        <!-- Mídia / Preview da Vista -->
        <div class="cam-media-container" onclick="CameraSystemModule.openLightbox('${previewImage}', '${escapeHTML(cam.name)}')">
          <img src="${previewImage}" alt="${escapeHTML(cam.name)}" loading="lazy">
          
          <div class="cam-media-overlay-top">
            <span class="overlay-chip">
              <i data-lucide="layout"></i> ${escapeHTML(cam.framing || 'PLANO_MEDIO')}
            </span>
            <span class="overlay-chip">
              <i data-lucide="target"></i> ${escapeHTML(cam.purpose || 'APRESENTACAO')}
            </span>
          </div>

          <div class="cam-media-overlay-bottom">
            ${cam.cameraReferenceUrl ? `
              <span class="overlay-ref-chip" title="Referência Fotográfica Homologada">
                <i data-lucide="image"></i> CAMERA_REFERENCE
              </span>
            ` : `
              <span class="overlay-ref-chip neutral">
                <i data-lucide="image-off"></i> Sem Imagem-Referência
              </span>
            `}
            <span class="overlay-zoom-hint"><i data-lucide="maximize-2"></i></span>
          </div>
        </div>

        <!-- Tabela de Especificações Técnicas (Valores Reais Disponíveis) -->
        <div class="cam-specs-grid">
          <div class="cam-spec-item" title="Distância focal da lente">
            <span class="lbl">Focal</span>
            <span class="val"><i data-lucide="aperture"></i> ${escapeHTML(cam.focalLength || '24mm')}</span>
          </div>
          <div class="cam-spec-item" title="Altura do observador">
            <span class="lbl">Altura</span>
            <span class="val"><i data-lucide="move-vertical"></i> ${cam.cameraHeightM || 1.55}m</span>
          </div>
          <div class="cam-spec-item" title="Direção do olhar">
            <span class="lbl">Direção</span>
            <span class="val truncate" title="${escapeHTML(cam.targetDirection || 'Frontal')}">${escapeHTML(cam.targetDirection || 'Frontal')}</span>
          </div>
          <div class="cam-spec-item" title="Proporção e enquadramento">
            <span class="lbl">Proporção</span>
            <span class="val">${escapeHTML(cam.aspectRatio || '16:9')}</span>
          </div>
        </div>

        ${cam.positionDesc ? `
          <div class="cam-position-row" title="Posicionamento no ambiente">
            <i data-lucide="map-pin"></i>
            <span>${escapeHTML(cam.positionDesc)}</span>
          </div>
        ` : ''}

        <!-- Histórico de Versões do Enquadramento -->
        ${versions.length > 1 ? `
          <div class="cam-versions-history-bar">
            <span class="lbl"><i data-lucide="git-branch"></i> Histórico:</span>
            <div class="version-pills">
              ${versions.map(v => `
                <span class="ver-pill ${v.versionTag === cam.currentVersion ? 'active' : ''}" title="${escapeHTML(v.notes || '')}">
                  ${escapeHTML(v.versionTag)}
                </span>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Barra de Ações Operacionais da Câmera -->
        <div class="cam-card-actions">
          <div class="cam-action-group-left">
            <!-- Ordenação (Mover para Cima / Baixo) -->
            <button class="btn-icon btn-ghost btn-xs" onclick="CameraSystemModule.handleMoveUp('${env.id}', '${cam.id}')" ${idx === 0 ? 'disabled' : ''} title="Subir prioridade">
              <i data-lucide="arrow-up"></i>
            </button>
            <button class="btn-icon btn-ghost btn-xs" onclick="CameraSystemModule.handleMoveDown('${env.id}', '${cam.id}')" ${idx === total - 1 ? 'disabled' : ''} title="Descer prioridade">
              <i data-lucide="arrow-down"></i>
            </button>
            <div class="divider-v"></div>

            <!-- Bloquear / Desbloquear -->
            <button class="btn-icon btn-ghost btn-xs ${cam.isLocked ? 'active-lock' : ''}" onclick="CameraSystemModule.handleToggleLock('${cam.id}')" title="${cam.isLocked ? 'Desbloquear Câmera' : 'Bloquear Câmera contra alterações'}">
              <i data-lucide="${cam.isLocked ? 'lock' : 'unlock'}"></i>
            </button>

            <!-- Duplicar -->
            <button class="btn-icon btn-ghost btn-xs" onclick="CameraSystemModule.handleDuplicate('${cam.id}')" title="Duplicar Enquadramento">
              <i data-lucide="copy"></i>
            </button>

            <!-- Renomear -->
            <button class="btn-icon btn-ghost btn-xs" onclick="CameraSystemModule.handleRename('${cam.id}')" ${cam.isLocked ? 'disabled' : ''} title="Renomear Câmera">
              <i data-lucide="pencil"></i>
            </button>

            <!-- Vincular Referência -->
            <button class="btn-icon btn-ghost btn-xs" onclick="CameraSystemModule.openReferenceModal('${cam.id}')" title="Associar CAMERA_REFERENCE">
              <i data-lucide="image-plus"></i>
            </button>
          </div>

          <div class="cam-action-group-right">
            <!-- Novo Enquadramento (Nova Versão) -->
            <button class="btn btn-outline btn-xs" onclick="CameraSystemModule.openVersionModal('${cam.id}')" ${cam.isLocked ? 'disabled' : ''} title="Alterar ângulo criando nova versão">
              <i data-lucide="git-commit"></i> Nova Versão
            </button>

            <!-- Aprovar / Rejeitar -->
            ${cam.status === 'APPROVED' || cam.status === 'LOCKED' ? `
              <span class="badge-approved-cam"><i data-lucide="check"></i> Aprovada</span>
            ` : `
              <button class="btn btn-success btn-xs" onclick="CameraSystemModule.handleApprove('${cam.id}')" title="Aprovar Câmera como referência oficial">
                <i data-lucide="check"></i> Aprovar
              </button>
              <button class="btn-icon btn-ghost btn-xs text-danger" onclick="CameraSystemModule.handleReject('${cam.id}')" title="Rejeitar">
                <i data-lucide="x"></i>
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Modais de Criação, Versão e Associação de Referência
   */
  function renderModals(project, env) {
    return `
      <!-- 1. Modal de Criação / Edição de Câmera -->
      <div class="modal-overlay camera-modal-dialog" id="modal-camera-create" style="display: none;">
        <div class="modal-card modal-lg">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <i data-lucide="video"></i>
              <h3 id="modal-camera-create-title">Cadastrar Novo Enquadramento de Câmera</h3>
            </div>
            <button class="btn-icon btn-ghost" onclick="CameraSystemModule.closeModal('modal-camera-create')">
              <i data-lucide="x"></i>
            </button>
          </div>

          <form onsubmit="CameraSystemModule.handleCreateSubmit(event, '${project.id}', '${env.id}')">
            <div class="modal-body">
              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label">Código da Câmera:</label>
                  <input type="text" id="cam-input-code" class="form-control" placeholder="Ex: C01, C02..." required>
                </div>
                <div class="form-group flex-3">
                  <label class="form-label">Nome Descritivo da Tomada:</label>
                  <input type="text" id="cam-input-name" class="form-control" placeholder="Ex: C01 — Sala olhando para painel" required>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Descrição e Intenção Visual:</label>
                <textarea id="cam-input-desc" class="form-control" rows="2" placeholder="Descreva o foco do enquadramento, pontos de fuga e mobiliário principal em quadro..."></textarea>
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label">Origem da Câmera:</label>
                  <select id="cam-input-origin" class="form-select">
                    <option value="MANUAL" selected>MANUAL — Ponto de Vista Customizado</option>
                    <option value="REVIT">REVIT — Exportação 3D do Modelo BIM</option>
                    <option value="REFERENCIA">REFERÊNCIA — Baseada em Fotografia Real</option>
                    <option value="SUGESTAO_IA">SUGESTÃO_IA — Enquadramento Proposto por IA</option>
                  </select>
                </div>
                <div class="form-group flex-1">
                  <label class="form-label">Enquadramento:</label>
                  <select id="cam-input-framing" class="form-select">
                    <option value="AMPLO_GERAL">AMPLO_GERAL — Leitura Completa do Espaço</option>
                    <option value="PLANO_MEDIO" selected>PLANO_MEDIO — Living & Mobiliário</option>
                    <option value="DETALHE_CLOSEUP">DETALHE_CLOSEUP — Marcenaria & Texturas</option>
                    <option value="ANGULAR_CONTRAPICADO">ANGULAR_CONTRAPICADO — Altura & Amplitude</option>
                    <option value="ZENITAL">ZENITAL — Vista Superior / Layout</option>
                    <option value="PANORAMICO">PANORÂMICO — Conexão com Varanda/Deck</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label">Lente Focal:</label>
                  <input type="text" id="cam-input-focal" class="form-control" value="24mm" placeholder="Ex: 24mm, 35mm, 50mm">
                </div>
                <div class="form-group flex-1">
                  <label class="form-label">Altura do Olhar (m):</label>
                  <input type="number" step="0.05" id="cam-input-height" class="form-control" value="1.55" placeholder="1.55">
                </div>
                <div class="form-group flex-1">
                  <label class="form-label">Proporção:</label>
                  <select id="cam-input-aspect" class="form-select">
                    <option value="16:9" selected>16:9 (Widescreen)</option>
                    <option value="4:3">4:3 (Clássico)</option>
                    <option value="1:1">1:1 (Quadrado)</option>
                    <option value="9:16">9:16 (Vertical)</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label">Direção do Olhar:</label>
                  <input type="text" id="cam-input-direction" class="form-control" placeholder="Ex: Norte para Painel da TV">
                </div>
                <div class="form-group flex-1">
                  <label class="form-label">Posição Relativa no Cômodo:</label>
                  <input type="text" id="cam-input-position" class="form-control" placeholder="Ex: Canto sudoeste a 1.5m da porta">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">URL da Imagem-Base / Referência de Câmera:</label>
                <input type="url" id="cam-input-ref-url" class="form-control" placeholder="https://...">
                <small class="form-hint">URL de render técnico do Revit ou foto de referência do enquadramento pretendido.</small>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-outline" onclick="CameraSystemModule.closeModal('modal-camera-create')">Cancelar</button>
              <button type="submit" class="btn btn-primary">
                <i data-lucide="check"></i> Salvar Câmera
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 2. Modal de Nova Versão de Enquadramento -->
      <div class="modal-overlay camera-modal-dialog" id="modal-camera-version" style="display: none;">
        <div class="modal-card">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <i data-lucide="git-branch"></i>
              <h3>Criar Nova Versão de Enquadramento</h3>
            </div>
            <button class="btn-icon btn-ghost" onclick="CameraSystemModule.closeModal('modal-camera-version')">
              <i data-lucide="x"></i>
            </button>
          </div>

          <form onsubmit="CameraSystemModule.handleVersionSubmit(event)">
            <input type="hidden" id="cam-ver-target-id" value="">
            <div class="modal-body">
              <p class="text-muted" style="margin-bottom: 12px; font-size: 0.85rem;">
                Ao alterar o enquadramento, uma nova versão será registrada para preservar o histórico e não sobrescrever silenciosamente a vista anterior.
              </p>

              <div class="form-group">
                <label class="form-label">Novo Tipo de Enquadramento:</label>
                <select id="cam-ver-framing" class="form-select">
                  <option value="AMPLO_GERAL">AMPLO_GERAL</option>
                  <option value="PLANO_MEDIO">PLANO_MEDIO</option>
                  <option value="DETALHE_CLOSEUP">DETALHE_CLOSEUP</option>
                  <option value="ANGULAR_CONTRAPICADO">ANGULAR_CONTRAPICADO</option>
                  <option value="ZENITAL">ZENITAL</option>
                  <option value="PANORAMICO">PANORAMICO</option>
                </select>
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label">Nova Lente Focal:</label>
                  <input type="text" id="cam-ver-focal" class="form-control" placeholder="Ex: 35mm">
                </div>
                <div class="form-group flex-1">
                  <label class="form-label">Nova Altura do Olho (m):</label>
                  <input type="number" step="0.05" id="cam-ver-height" class="form-control" placeholder="1.50">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Nova Direção do Olhar:</label>
                <input type="text" id="cam-ver-direction" class="form-control" placeholder="Ex: Leste para Mesa de Jantar">
              </div>

              <div class="form-group">
                <label class="form-label">Notas da Alteração de Enquadramento:</label>
                <input type="text" id="cam-ver-notes" class="form-control" placeholder="Ex: Ajustado para enquadrar luminária pendente e mesa">
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-outline" onclick="CameraSystemModule.closeModal('modal-camera-version')">Cancelar</button>
              <button type="submit" class="btn btn-primary">
                <i data-lucide="git-commit"></i> Gravar Nova Versão
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 3. Modal de Associação de CAMERA_REFERENCE -->
      <div class="modal-overlay camera-modal-dialog" id="modal-camera-reference" style="display: none;">
        <div class="modal-card">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <i data-lucide="image"></i>
              <h3>Vincular Imagem de Referência (CAMERA_REFERENCE)</h3>
            </div>
            <button class="btn-icon btn-ghost" onclick="CameraSystemModule.closeModal('modal-camera-reference')">
              <i data-lucide="x"></i>
            </button>
          </div>

          <form onsubmit="CameraSystemModule.handleReferenceSubmit(event)">
            <input type="hidden" id="cam-ref-target-id" value="">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">URL da Imagem com a Vista Desejada:</label>
                <input type="url" id="cam-ref-url" class="form-control" placeholder="https://..." required>
                <small class="form-hint">Esta imagem orientará os renders humanizados a reproduzir exatamente esta vista.</small>
              </div>

              <div class="form-group">
                <label class="form-label">Observações da Referência:</label>
                <textarea id="cam-ref-notes" class="form-control" rows="2" placeholder="Ex: Enquadramento fotográfico desejado com foco no sofá e tapete orgânico..."></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-outline" onclick="CameraSystemModule.closeModal('modal-camera-reference')">Cancelar</button>
              <button type="submit" class="btn btn-primary">
                <i data-lucide="check"></i> Homologar Referência
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // HANDLERS E OPERAÇÕES DO USUÁRIO
  // ==========================================================================

  function openCreateModal(projectId, environmentId) {
    const modal = document.getElementById('modal-camera-create');
    if (!modal) return;
    const existing = StudioState.getEnvironmentCameras(projectId, environmentId);
    const code = `C0${existing.length + 1}`;
    document.getElementById('cam-input-code').value = code;
    document.getElementById('cam-input-name').value = `${code} — Novo Ângulo`;
    document.getElementById('cam-input-desc').value = '';
    document.getElementById('cam-input-ref-url').value = '';
    modal.style.display = 'flex';
  }

  function openVersionModal(cameraId) {
    const cam = StudioState.getEnvironmentCamera(cameraId);
    if (!cam) return;
    const modal = document.getElementById('modal-camera-version');
    if (!modal) return;
    document.getElementById('cam-ver-target-id').value = cameraId;
    document.getElementById('cam-ver-framing').value = cam.framing || 'PLANO_MEDIO';
    document.getElementById('cam-ver-focal').value = cam.focalLength || '24mm';
    document.getElementById('cam-ver-height').value = cam.cameraHeightM || 1.55;
    document.getElementById('cam-ver-direction').value = cam.targetDirection || '';
    document.getElementById('cam-ver-notes').value = '';
    modal.style.display = 'flex';
  }

  function openReferenceModal(cameraId) {
    const cam = StudioState.getEnvironmentCamera(cameraId);
    if (!cam) return;
    const modal = document.getElementById('modal-camera-reference');
    if (!modal) return;
    document.getElementById('cam-ref-target-id').value = cameraId;
    document.getElementById('cam-ref-url').value = cam.cameraReferenceUrl || '';
    document.getElementById('cam-ref-notes').value = '';
    modal.style.display = 'flex';
  }

  function handleCreateSubmit(event, projectId, environmentId) {
    event.preventDefault();
    const cameraCode = document.getElementById('cam-input-code')?.value.trim() || 'C01';
    const name = document.getElementById('cam-input-name')?.value.trim() || `${cameraCode} — Câmera`;
    const description = document.getElementById('cam-input-desc')?.value.trim() || '';
    const origin = document.getElementById('cam-input-origin')?.value || 'MANUAL';
    const framing = document.getElementById('cam-input-framing')?.value || 'PLANO_MEDIO';
    const focalLength = document.getElementById('cam-input-focal')?.value.trim() || '24mm';
    const cameraHeightM = parseFloat(document.getElementById('cam-input-height')?.value) || 1.55;
    const aspectRatio = document.getElementById('cam-input-aspect')?.value || '16:9';
    const targetDirection = document.getElementById('cam-input-direction')?.value.trim() || null;
    const positionDesc = document.getElementById('cam-input-position')?.value.trim() || null;
    const cameraReferenceUrl = document.getElementById('cam-input-ref-url')?.value.trim() || null;

    closeModal('modal-camera-create');

    try {
      StudioState.createEnvironmentCamera({
        projectId,
        environmentId,
        cameraCode,
        name,
        description,
        origin,
        framing,
        focalLength,
        cameraHeightM,
        aspectRatio,
        targetDirection,
        positionDesc,
        cameraReferenceUrl,
        baseImageUrl: cameraReferenceUrl
      });
      StudioApp.showToast(`Câmera ${cameraCode} cadastrada com sucesso!`);
      refreshView();
    } catch (err) {
      StudioApp.showToast(`Erro ao cadastrar câmera: ${err.message}`);
    }
  }

  function handleVersionSubmit(event) {
    event.preventDefault();
    const cameraId = document.getElementById('cam-ver-target-id')?.value;
    if (!cameraId) return;

    const framing = document.getElementById('cam-ver-framing')?.value;
    const focalLength = document.getElementById('cam-ver-focal')?.value.trim();
    const cameraHeightM = parseFloat(document.getElementById('cam-ver-height')?.value) || 1.55;
    const targetDirection = document.getElementById('cam-ver-direction')?.value.trim();
    const notes = document.getElementById('cam-ver-notes')?.value.trim();

    closeModal('modal-camera-version');

    try {
      const res = StudioState.createCameraVersion(cameraId, {
        framing,
        focalLength,
        cameraHeightM,
        targetDirection,
        notes
      });
      const verTag = res.versionTag || (res.version && res.version.versionTag) || 'Nova versão';
      StudioApp.showToast(`Nova versão ${verTag} registrada sem sobrescrever anterior!`);
      refreshView();
    } catch (err) {
      StudioApp.showToast(`Erro ao criar versão: ${err.message}`);
    }
  }

  function handleReferenceSubmit(event) {
    event.preventDefault();
    const cameraId = document.getElementById('cam-ref-target-id')?.value;
    const referenceUrl = document.getElementById('cam-ref-url')?.value.trim();
    const notes = document.getElementById('cam-ref-notes')?.value.trim();

    if (!cameraId || !referenceUrl) return;

    closeModal('modal-camera-reference');

    try {
      StudioState.associateCameraReference(cameraId, referenceUrl, notes);
      StudioApp.showToast('CAMERA_REFERENCE associada com sucesso!');
      refreshView();
    } catch (err) {
      StudioApp.showToast(`Erro ao associar referência: ${err.message}`);
    }
  }

  function handleApprove(cameraId) {
    const notes = prompt('Observações para homologação da câmera:', 'Enquadramento e altura de olhar aprovados.');
    if (notes === null) return;

    try {
      StudioState.approveCamera(cameraId, 'Pedro (Cliente Titular)', notes);
      StudioApp.showToast('Câmera aprovada como referência oficial!');
      refreshView();
    } catch (err) {
      StudioApp.showToast(`Erro na aprovação: ${err.message}`);
    }
  }

  function handleReject(cameraId) {
    const reason = prompt('Motivo da rejeição da câmera:', 'Ajuste de ângulo ou lente necessário.');
    if (reason === null) return;

    try {
      StudioState.rejectCamera(cameraId, 'Arquiteto', reason);
      StudioApp.showToast('Câmera rejeitada.');
      refreshView();
    } catch (err) {
      StudioApp.showToast(`Erro ao rejeitar: ${err.message}`);
    }
  }

  function handleToggleLock(cameraId) {
    const cam = StudioState.getEnvironmentCamera(cameraId);
    if (!cam) return;

    try {
      if (cam.isLocked) {
        StudioState.unlockCamera(cameraId);
        StudioApp.showToast(`Câmera ${cam.cameraCode} desbloqueada.`);
      } else {
        StudioState.lockCamera(cameraId);
        StudioApp.showToast(`Câmera ${cam.cameraCode} bloqueada contra alterações.`);
      }
      refreshView();
    } catch (err) {
      StudioApp.showToast(`Erro ao alternar bloqueio: ${err.message}`);
    }
  }

  function handleDuplicate(cameraId) {
    try {
      const duplicated = StudioState.duplicateCamera(cameraId);
      StudioApp.showToast(`Câmera duplicada como ${duplicated.cameraCode}!`);
      refreshView();
    } catch (err) {
      StudioApp.showToast(`Erro ao duplicar câmera: ${err.message}`);
    }
  }

  function handleRename(cameraId) {
    const cam = StudioState.getEnvironmentCamera(cameraId);
    if (!cam) return;

    const newName = prompt('Novo nome da câmera:', cam.name);
    if (!newName || newName === cam.name) return;

    try {
      StudioState.renameCamera(cameraId, newName);
      StudioApp.showToast('Câmera renomeada com sucesso.');
      refreshView();
    } catch (err) {
      StudioApp.showToast(`Erro ao renomear: ${err.message}`);
    }
  }

  function handleArchive(cameraId) {
    if (!confirm('Deseja arquivar esta câmera? Ela não aparecerá nas opções ativas de render.')) return;

    try {
      StudioState.archiveCamera(cameraId);
      StudioApp.showToast('Câmera arquivada.');
      refreshView();
    } catch (err) {
      StudioApp.showToast(`Erro ao arquivar: ${err.message}`);
    }
  }

  function handleMoveUp(environmentId, cameraId) {
    const cameras = StudioState.getEnvironmentCameras(null, environmentId);
    const idx = cameras.findIndex(c => c.id === cameraId);
    if (idx <= 0) return;

    const ids = cameras.map(c => c.id);
    const temp = ids[idx];
    ids[idx] = ids[idx - 1];
    ids[idx - 1] = temp;

    StudioState.reorderCameras(environmentId, ids);
    refreshView();
  }

  function handleMoveDown(environmentId, cameraId) {
    const cameras = StudioState.getEnvironmentCameras(null, environmentId);
    const idx = cameras.findIndex(c => c.id === cameraId);
    if (idx < 0 || idx >= cameras.length - 1) return;

    const ids = cameras.map(c => c.id);
    const temp = ids[idx];
    ids[idx] = ids[idx + 1];
    ids[idx + 1] = temp;

    StudioState.reorderCameras(environmentId, ids);
    refreshView();
  }

  function handleTriggerAISuggestions(projectId, environmentId) {
    StudioApp.showToast('IA analisando arquitetura e sugerindo enquadramentos...');
    try {
      const res = StudioState.suggestCamerasByAI(projectId, environmentId);
      const count = res.suggestedCameras ? res.suggestedCameras.length : 3;
      StudioApp.showToast(`${count} sugestões de câmera criadas! Câmeras bloqueadas foram preservadas.`);
      refreshView();
    } catch (err) {
      StudioApp.showToast(`Erro ao sugerir câmeras: ${err.message}`);
    }
  }

  function openLightbox(url, title) {
    if (typeof EnvironmentVisualizationModule !== 'undefined' && EnvironmentVisualizationModule.openImageLightbox) {
      EnvironmentVisualizationModule.openImageLightbox(url, title);
    }
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
  }

  function refreshView() {
    if (typeof EnvironmentVisualizationModule !== 'undefined' && EnvironmentVisualizationModule.refresh) {
      EnvironmentVisualizationModule.refresh();
    } else if (typeof StudioApp !== 'undefined' && StudioApp.renderCurrentView) {
      StudioApp.renderCurrentView();
    }
  }

  return {
    render,
    openCreateModal,
    openVersionModal,
    openReferenceModal,
    handleCreateSubmit,
    handleVersionSubmit,
    handleReferenceSubmit,
    handleApprove,
    handleReject,
    handleToggleLock,
    handleDuplicate,
    handleRename,
    handleArchive,
    handleMoveUp,
    handleMoveDown,
    handleTriggerAISuggestions,
    openLightbox,
    closeModal
  };
})();

if (typeof window !== 'undefined') {
  window.CameraSystemModule = CameraSystemModule;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CameraSystemModule };
}
