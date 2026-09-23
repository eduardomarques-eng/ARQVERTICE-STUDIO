/**
 * ============================================================================
 * ARQVERTICE STUDIO — BLOCO F07: SISTEMA DE APRESENTAÇÃO DE PERSPECTIVAS E RENDERS
 * ============================================================================
 * Módulo de Apresentação de Perspectivas e Renders por Ambiente Individual.
 * Fluxo: PROJETO -> AMBIENTE -> REFERÊNCIAS -> CÂMERA -> ESTUDO -> RENDER -> REVISÃO -> APROVAÇÃO -> PRANCHA
 * 
 * Requisitos e Diretrizes:
 * 1. Ambiente Individual: Conjunto independente de imagens por ambiente.
 * 2. Câmeras Canônicas: cameraId, ambiente, nome, posição, direção, tipo, enquadramento, descrição, referência, versão.
 * 3. Nomes Padronizados: Sala_Cam01, Sala_Cam02, Cozinha_Cam01, Suíte_Cam01.
 * 4. Imagens Canônicas: original, render, versão, modelo, provider, prompt, referências, data, aprovação.
 * 5. Consistência Automática: Recuperação de briefing, ambiente, estilo, materiais, mobiliário, referências, decisões, aprovados, locks.
 * 6. Locks Rigorosos: geometria, câmera, layout, materiais, iluminação, decoração, paisagismo.
 * 7. Variações: Nova versão, duplicar, comparar, aprovar, rejeitar, arquivar.
 * 8. Comparação: Antes/Depois e Versão A/B.
 * 9. Apresentação: Inserção em prancha em 5 layouts (1, 2, 3, 4 e principal + detalhes).
 * 10. Qualidade: Preservação de resolução original com thumbnail para interface.
 * 11. Imutabilidade: Proibição de alteração automática de imagens aprovadas.
 */

const RenderPresentationModule = (function () {
  'use strict';

  function getState() {
    if (typeof StudioState !== 'undefined') return StudioState;
    if (typeof window !== 'undefined' && window.StudioState) return window.StudioState;
    if (typeof global !== 'undefined' && global.StudioState) return global.StudioState;
    return null;
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  let activeProjectId = 'prj-praia-01';
  let activeEnvironmentId = 'amb-sala-01';
  let compareLeftId = null;
  let compareRightId = null;
  let currentCompareMode = 'BEFORE_AFTER'; // 'BEFORE_AFTER' | 'VERSION_A_B'
  let selectedRenderIds = [];

  function setActiveEnvironment(envId) {
    activeEnvironmentId = envId;
    selectedRenderIds = [];
    refreshUI();
  }

  function setActiveProject(projId) {
    activeProjectId = projId;
    const S = getState();
    const envs = S ? (S.data?.environments || []).filter(e => e.projectId === projId) : [];
    if (envs.length > 0) {
      activeEnvironmentId = envs[0].id;
    }
    selectedRenderIds = [];
    refreshUI();
  }

  // --------------------------------------------------------------------------
  // RENDERIZAÇÃO DA INTERFACE PRINCIPAL
  // --------------------------------------------------------------------------
  function render(projectId, environmentId) {
    const S = getState();
    if (!S) return '<div class="p-4 text-danger">Erro: StudioState não inicializado.</div>';

    const pId = projectId || activeProjectId;
    const project = S.getProject(pId) || { id: pId, name: 'Projeto' };
    const allEnvs = (S.data?.environments || []).filter(e => e.projectId === pId);
    
    let envId = environmentId || activeEnvironmentId;
    let env = allEnvs.find(e => e.id === envId);
    if (!env && allEnvs.length > 0) {
      env = allEnvs[0];
      envId = env.id;
      activeEnvironmentId = envId;
    }

    const cameras = S.getEnvironmentPerspectiveCameras(pId, envId);
    const renders = S.getEnvironmentPresentationRenders(pId, envId);
    const consistency = S.compilePerspectiveConsistency(pId, envId);

    return `
      <div class="render-presentation-container p-4" id="render-presentation-root">
        <!-- Topo: Seletor de Ambiente e Fluxo Canônico -->
        <div class="render-pres-header card mb-4 p-3 shadow-sm">
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <div class="d-flex align-items-center gap-2 mb-1">
                <span class="badge bg-primary">F07 • Apresentação de Renders</span>
                <span class="text-muted text-xs">Fluxo: Projeto &rarr; Ambiente &rarr; Câmera &rarr; Render &rarr; Aprovação &rarr; Prancha</span>
              </div>
              <h2 class="h4 mb-0 text-slate-900 font-bold">${escapeHTML(project.name)} &mdash; Apresentação Visual</h2>
            </div>

            <!-- Seletor de Ambiente -->
            <div class="d-flex align-items-center gap-2">
              <label class="form-label text-xs mb-0 font-semibold">Ambiente Individual:</label>
              <select class="form-select form-select-sm" onchange="RenderPresentationModule.setActiveEnvironment(this.value)">
                ${allEnvs.map(e => `
                  <option value="${e.id}" ${e.id === envId ? 'selected' : ''}>
                    ${escapeHTML(e.name)} (${e.type || 'GERAL'})
                  </option>
                `).join('')}
              </select>
            </div>
          </div>

          <!-- Metadados Rápidos do Ambiente -->
          ${env ? `
            <div class="env-metadata-strip d-flex flex-wrap align-items-center gap-3 mt-3 pt-3 border-top text-xs text-muted">
              <div><strong>Área:</strong> ${env.areaM2 || 0} m²</div>
              <div><strong>Pé-Direito:</strong> ${env.ceilingHeightM || 3.0} m</div>
              <div><strong>Estilo:</strong> <span class="badge bg-light text-dark border">${escapeHTML(env.style || 'Contemporâneo')}</span></div>
              <div><strong>Câmeras Registradas:</strong> ${cameras.length}</div>
              <div><strong>Renders Disponíveis:</strong> ${renders.length}</div>
              <div><strong>Status Homologação:</strong> 
                <span class="badge ${env.status === 'Aprovado' ? 'bg-success' : 'bg-warning text-dark'}">
                  ${escapeHTML(env.status || 'Em Desenvolvimento')}
                </span>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Seção 1: Painel de Consistência e Locks Ativos -->
        <div class="card mb-4 p-3 border-slate-200">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h3 class="h6 mb-0 font-bold d-flex align-items-center gap-2">
              <i data-lucide="shield-check"></i> 1. Consistência Automática e Locks de Integridade
            </h3>
            <span class="text-xs text-muted">Sem alteração silenciosa de elementos protegidos</span>
          </div>

          <!-- Locks Canônicos -->
          <div class="locks-badges-grid d-flex flex-wrap gap-2 mb-3">
            ${S.CANONICAL_PERSPECTIVE_LOCKS.map(lockKey => {
              const isLocked = consistency.locks && consistency.locks[lockKey];
              return `
                <div class="lock-pill ${isLocked ? 'lock-active' : 'lock-inactive'} px-2 py-1 rounded text-xs d-flex align-items-center gap-1 border">
                  <i data-lucide="${isLocked ? 'lock' : 'unlock'}"></i>
                  <span class="text-capitalize">${lockKey}</span>
                  <span class="lock-status-dot ${isLocked ? 'bg-danger' : 'bg-secondary'} rounded-circle" style="width: 6px; height: 6px;"></span>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Pílulas de Contexto Recuperado -->
          <div class="row g-2 text-xs">
            <div class="col-md-3">
              <div class="p-2 bg-light rounded border">
                <strong>Briefing:</strong> ${escapeHTML(consistency.briefing.projectTypology)} &bull; ${escapeHTML(consistency.briefing.clientName)}
              </div>
            </div>
            <div class="col-md-3">
              <div class="p-2 bg-light rounded border">
                <strong>Materiais Homologados:</strong> ${consistency.materiais.length} itens vinculados
              </div>
            </div>
            <div class="col-md-3">
              <div class="p-2 bg-light rounded border">
                <strong>Mobiliário Cadastrado:</strong> ${consistency.mobiliario.length} peças
              </div>
            </div>
            <div class="col-md-3">
              <div class="p-2 bg-light rounded border">
                <strong>Imagens Aprovadas:</strong> ${consistency.imagensAprovadas.length} versões oficiais
              </div>
            </div>
          </div>
        </div>

        <!-- Seção 2: Câmeras Canônicas do Ambiente ({Ambiente}_Cam{NN}) -->
        <div class="card mb-4 p-3">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h3 class="h6 mb-0 font-bold d-flex align-items-center gap-2">
                <i data-lucide="camera"></i> 2. Câmeras e Enquadramentos do Ambiente (${cameras.length})
              </h3>
              <p class="text-xs text-muted mb-0">Nomenclatura padrão obrigatória: <code>${S.formatPerspectiveCameraName(env?.name, 1)}</code></p>
            </div>
            <button class="btn btn-outline-primary btn-sm" onclick="RenderPresentationModule.openNewCameraModal('${envId}')">
              <i data-lucide="plus"></i> Nova Câmera
            </button>
          </div>

          <div class="cameras-cards-grid row g-3">
            ${cameras.length === 0 ? `
              <div class="col-12 text-center text-muted p-4">
                Nenhuma câmera cadastrada para este ambiente. Clique em "Nova Câmera" para registrar.
              </div>
            ` : cameras.map(c => `
              <div class="col-md-4">
                <div class="card h-100 p-3 camera-card border ${c.isLocked ? 'border-primary-subtle' : ''}">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <span class="badge bg-secondary font-mono">${escapeHTML(c.name)}</span>
                    <span class="badge bg-light text-dark border text-2xs">${escapeHTML(c.versao || c.version || 'V01')}</span>
                  </div>
                  <div class="camera-details text-xs mb-2">
                    <div><strong>Tipo:</strong> ${escapeHTML(c.tipo || c.type || 'PERSPECTIVA')}</div>
                    <div><strong>Enquadramento:</strong> ${escapeHTML(c.enquadramento || c.framing || 'AMPLO')}</div>
                    <div><strong>Posição:</strong> ${escapeHTML(c.posicao || c.position || 'Normalizada')}</div>
                    <div><strong>Direção:</strong> ${escapeHTML(c.direcao || c.direction || 'Centro')}</div>
                  </div>
                  <div class="text-xs text-muted mb-3 text-truncate" title="${escapeHTML(c.descricao || '')}">
                    ${escapeHTML(c.descricao || 'Sem descrição')}
                  </div>
                  <div class="mt-auto pt-2 border-top d-flex justify-content-between align-items-center">
                    <span class="text-2xs text-muted">${c.isLocked ? '<i data-lucide="lock" class="text-primary"></i> Bloqueada' : 'Livre'}</span>
                    <button class="btn btn-xs btn-outline" onclick="RenderPresentationModule.filterByCamera('${c.id}')">
                      Ver Renders
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Seção 3: Galeria de Renders e Variações por Ambiente -->
        <div class="card mb-4 p-3">
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <div>
              <h3 class="h6 mb-0 font-bold d-flex align-items-center gap-2">
                <i data-lucide="image"></i> 3. Perspectivas e Renders Independentes (${renders.length})
              </h3>
              <p class="text-xs text-muted mb-0">Alta resolução preservada com thumbnails otimizadas para navegação rápida</p>
            </div>

            <!-- Ações Rápidas de Apresentação -->
            <div class="d-flex align-items-center gap-2">
              <button class="btn btn-outline-secondary btn-sm" onclick="RenderPresentationModule.openComparisonModal()" title="Comparar Antes/Depois ou Versão A/B">
                <i data-lucide="columns"></i> Comparar Renders
              </button>
              <button class="btn btn-primary btn-sm" onclick="RenderPresentationModule.openSheetInsertModal()" title="Diagramar e inserir renders selecionados na prancha">
                <i data-lucide="layout-grid"></i> Inserir na Prancha (F02/F03)
              </button>
              <button class="btn btn-success btn-sm" onclick="RenderPresentationModule.openNewRenderModal('${envId}')">
                <i data-lucide="plus"></i> Novo Render
              </button>
            </div>
          </div>

          <!-- Grid de Renders -->
          <div class="renders-gallery-grid row g-3">
            ${renders.length === 0 ? `
              <div class="col-12 text-center text-muted p-5 bg-light rounded">
                Nenhum render cadastrado para o ambiente <strong>${escapeHTML(env?.name || '')}</strong>.<br/>
                Clique em "Novo Render" para registrar uma nova geração fotorrealista.
              </div>
            ` : renders.map(r => {
              const isApproved = r.approvalStatus === 'APPROVED' || r.approval === 'APPROVED' || r.isCurrentApproved;
              const isSelected = selectedRenderIds.includes(r.id);

              return `
                <div class="col-md-4 col-lg-3">
                  <div class="card h-100 render-item-card ${isApproved ? 'border-success' : ''} ${isSelected ? 'ring-2 ring-primary' : ''}">
                    <!-- Imagem / Thumbnail com badge de versão -->
                    <div class="position-relative render-thumb-container" style="height: 180px; background: #0f172a; overflow: hidden; border-radius: 6px 6px 0 0;">
                      <img 
                        src="${escapeHTML(r.thumbnailUrl || r.renderUrl || r.render || r.imageUrl)}" 
                        alt="${escapeHTML(r.version)}" 
                        class="w-100 h-100 object-cover cursor-pointer"
                        onclick="RenderPresentationModule.openLightbox('${escapeHTML(r.renderUrl || r.render || r.original || r.imageUrl)}', '${escapeHTML(r.version)}')"
                        title="Clique para visualizar em resolução original máxima"
                      />
                      <span class="badge bg-dark text-white position-absolute top-2 start-2 font-mono">
                        ${escapeHTML(r.version || r.versionLabel || 'V01')}
                      </span>
                      <span class="badge position-absolute top-2 end-2 ${
                        isApproved ? 'bg-success' : r.approvalStatus === 'REJECTED' ? 'bg-danger' : 'bg-warning text-dark'
                      }">
                        ${isApproved ? 'APROVADO' : r.approvalStatus || 'DRAFT'}
                      </span>
                    </div>

                    <!-- Corpo do Card com Metadados Canônicos -->
                    <div class="card-body p-3 text-xs d-flex flex-column">
                      <div class="d-flex justify-content-between align-items-center mb-1">
                        <span class="text-muted font-mono font-semibold">${escapeHTML(r.cameraName || 'Câmera Geral')}</span>
                        <span class="text-2xs text-muted">${new Date(r.data || r.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>

                      <div class="render-prompt-preview text-muted mb-2 line-clamp-2" title="${escapeHTML(r.prompt || '')}">
                        ${escapeHTML(r.prompt || 'Sem prompt')}
                      </div>

                      <div class="render-tech-meta text-2xs text-muted mb-3">
                        <div><strong>Modelo:</strong> ${escapeHTML(r.modelo || r.model || 'Corona 11')}</div>
                        <div><strong>Provider:</strong> ${escapeHTML(r.provider || 'GEMINI_ARQ_PRO')}</div>
                        <div><strong>Resolução:</strong> ${r.metadata?.resolutionType || '4K Original'}</div>
                      </div>

                      <!-- Ações Canônicas (Aprovar, Rejeitar, Duplicar, Nova Versão) -->
                      <div class="mt-auto pt-2 border-top">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                          <label class="form-check-label text-2xs cursor-pointer d-flex align-items-center gap-1">
                            <input 
                              type="checkbox" 
                              class="form-check-input" 
                              ${isSelected ? 'checked' : ''} 
                              onchange="RenderPresentationModule.toggleRenderSelection('${r.id}')"
                            />
                            Selecionar
                          </label>
                          <span class="text-2xs text-muted">
                            ${isApproved ? '<span class="text-success font-semibold">Homologado</span>' : 'Pendente'}
                          </span>
                        </div>

                        <div class="btn-group w-100 btn-group-sm">
                          ${!isApproved ? `
                            <button class="btn btn-outline-success btn-xs" onclick="RenderPresentationModule.approveRender('${r.id}')" title="Aprovar como oficial">
                              <i data-lucide="check"></i> Aprovar
                            </button>
                            <button class="btn btn-outline-danger btn-xs" onclick="RenderPresentationModule.rejectRender('${r.id}')" title="Rejeitar com motivo">
                              <i data-lucide="x"></i> Rejeitar
                            </button>
                          ` : `
                            <button class="btn btn-outline-secondary btn-xs" disabled title="Imagens aprovadas são protegidas contra alteração">
                              <i data-lucide="shield-check"></i> Protegido
                            </button>
                          `}
                          <button class="btn btn-outline-secondary btn-xs" onclick="RenderPresentationModule.createNewVersion('${r.id}')" title="Gerar nova versão V+1">
                            <i data-lucide="git-branch"></i> +Versão
                          </button>
                          <button class="btn btn-outline-secondary btn-xs" onclick="RenderPresentationModule.duplicateRender('${r.id}')" title="Duplicar">
                            <i data-lucide="copy"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Modais de Suporte -->
        <div id="render-presentation-modals"></div>
      </div>
    `;
  }

  // --------------------------------------------------------------------------
  // OPERAÇÕES E AÇÕES INTERATIVAS
  // --------------------------------------------------------------------------
  function toggleRenderSelection(renderId) {
    if (selectedRenderIds.includes(renderId)) {
      selectedRenderIds = selectedRenderIds.filter(id => id !== renderId);
    } else {
      selectedRenderIds.push(renderId);
    }
    refreshUI();
  }

  function approveRender(renderId) {
    const S = getState();
    if (!S) return;
    try {
      S.approvePerspectiveRender(renderId, 'Arquiteto Responsável', 'Homologado via painel de apresentação F07');
      refreshUI();
    } catch (e) {
      alert(e.message);
    }
  }

  function rejectRender(renderId) {
    const reason = prompt('Informe o motivo formal para a rejeição do render:');
    if (!reason || !reason.trim()) return;

    const S = getState();
    if (!S) return;
    try {
      S.rejectPerspectiveRender(renderId, reason.trim());
      refreshUI();
    } catch (e) {
      alert(e.message);
    }
  }

  function createNewVersion(renderId) {
    const S = getState();
    if (!S) return;
    try {
      const newV = S.createPerspectiveRenderVersion(renderId);
      refreshUI();
      alert(`Nova versão gerada com sucesso: ${newV.version}`);
    } catch (e) {
      alert(e.message);
    }
  }

  function duplicateRender(renderId) {
    const S = getState();
    if (!S) return;
    try {
      const dup = S.duplicatePerspectiveRender(renderId);
      refreshUI();
      alert(`Render duplicado: ${dup.version}`);
    } catch (e) {
      alert(e.message);
    }
  }

  // --------------------------------------------------------------------------
  // MODAL DE COMPARAÇÃO (ANTES / DEPOIS & VERSÃO A / VERSÃO B)
  // --------------------------------------------------------------------------
  function openComparisonModal(renderAId = null, renderBId = null) {
    const S = getState();
    if (!S) return;

    const renders = S.getEnvironmentPresentationRenders(activeProjectId, activeEnvironmentId);
    if (renders.length < 2) {
      alert('São necessários pelo menos 2 renders no ambiente para realizar a comparação.');
      return;
    }

    compareLeftId = renderAId || selectedRenderIds[0] || renders[0].id;
    compareRightId = renderBId || selectedRenderIds[1] || renders[1]?.id || renders[0].id;

    renderComparisonModalHTML();
  }

  function setCompareMode(mode) {
    currentCompareMode = mode;
    renderComparisonModalHTML();
  }

  function setCompareSelection(side, id) {
    if (side === 'left') compareLeftId = id;
    if (side === 'right') compareRightId = id;
    renderComparisonModalHTML();
  }

  function renderComparisonModalHTML() {
    const S = getState();
    if (!S) return;

    const renders = S.getEnvironmentPresentationRenders(activeProjectId, activeEnvironmentId);
    let comparison = null;
    try {
      comparison = S.comparePerspectiveRenders(compareLeftId, compareRightId, currentCompareMode);
    } catch (e) {
      console.warn('Erro ao comparar:', e);
    }

    const container = document.getElementById('render-presentation-modals');
    if (!container) return;

    container.innerHTML = `
      <div class="modal-backdrop show" style="background: rgba(15,23,42,0.8); position: fixed; inset: 0; z-index: 1050; display: flex; align-items: center; justify-content: center; padding: 20px;">
        <div class="card bg-white shadow-2xl rounded-lg w-100" style="max-width: 1050px; max-height: 90vh; display: flex; flex-column: column; overflow: hidden;">
          <!-- Cabeçalho do Modal -->
          <div class="d-flex justify-content-between align-items-center p-3 border-bottom bg-light">
            <div>
              <h5 class="h6 mb-0 font-bold">Motor de Comparação de Perspectivas</h5>
              <span class="text-xs text-muted">Inspecione diferenças de iluminação, materiais e enquadramento</span>
            </div>
            <div class="d-flex align-items-center gap-2">
              <div class="btn-group btn-group-sm">
                <button class="btn ${currentCompareMode === 'BEFORE_AFTER' ? 'btn-primary' : 'btn-outline-secondary'}" onclick="RenderPresentationModule.setCompareMode('BEFORE_AFTER')">
                  Antes / Depois
                </button>
                <button class="btn ${currentCompareMode === 'VERSION_A_B' ? 'btn-primary' : 'btn-outline-secondary'}" onclick="RenderPresentationModule.setCompareMode('VERSION_A_B')">
                  Versão A / Versão B
                </button>
              </div>
              <button type="button" class="btn-close" onclick="RenderPresentationModule.closeModal()">&times;</button>
            </div>
          </div>

          <!-- Corpo com Lado a Lado -->
          <div class="modal-body p-3 overflow-auto" style="flex: 1;">
            <!-- Controles de Seleção dos Dois Lados -->
            <div class="row g-3 mb-3">
              <div class="col-md-6">
                <label class="form-label text-xs font-semibold">${comparison?.labels?.left || 'Lado Esquerdo'}:</label>
                <select class="form-select form-select-sm" onchange="RenderPresentationModule.setCompareSelection('left', this.value)">
                  ${renders.map(r => `<option value="${r.id}" ${r.id === compareLeftId ? 'selected' : ''}>${escapeHTML(r.version)} &bull; ${escapeHTML(r.cameraName || 'Cam')}</option>`).join('')}
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label text-xs font-semibold">${comparison?.labels?.right || 'Lado Direito'}:</label>
                <select class="form-select form-select-sm" onchange="RenderPresentationModule.setCompareSelection('right', this.value)">
                  ${renders.map(r => `<option value="${r.id}" ${r.id === compareRightId ? 'selected' : ''}>${escapeHTML(r.version)} &bull; ${escapeHTML(r.cameraName || 'Cam')}</option>`).join('')}
                </select>
              </div>
            </div>

            <!-- Imagens Lado a Lado -->
            <div class="row g-3">
              <div class="col-md-6">
                <div class="comparison-card p-2 border rounded bg-light text-center">
                  <div class="badge bg-dark mb-2">${comparison?.labels?.left || 'Antes'} (${comparison?.left?.version || ''})</div>
                  <div style="height: 320px; background: #0f172a; border-radius: 4px; overflow: hidden;">
                    <img src="${escapeHTML(comparison?.left?.url || '')}" alt="Left" class="w-100 h-100 object-contain" />
                  </div>
                  <div class="text-xs text-muted text-start mt-2 p-1">
                    <div><strong>Modelo:</strong> ${escapeHTML(comparison?.left?.model || '-')}</div>
                    <div class="text-truncate"><strong>Prompt:</strong> ${escapeHTML(comparison?.left?.prompt || '-')}</div>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="comparison-card p-2 border rounded bg-light text-center">
                  <div class="badge bg-primary mb-2">${comparison?.labels?.right || 'Depois'} (${comparison?.right?.version || ''})</div>
                  <div style="height: 320px; background: #0f172a; border-radius: 4px; overflow: hidden;">
                    <img src="${escapeHTML(comparison?.right?.url || '')}" alt="Right" class="w-100 h-100 object-contain" />
                  </div>
                  <div class="text-xs text-muted text-start mt-2 p-1">
                    <div><strong>Modelo:</strong> ${escapeHTML(comparison?.right?.model || '-')}</div>
                    <div class="text-truncate"><strong>Prompt:</strong> ${escapeHTML(comparison?.right?.prompt || '-')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Rodapé -->
          <div class="p-3 border-top d-flex justify-content-end bg-light">
            <button class="btn btn-secondary btn-sm" onclick="RenderPresentationModule.closeModal()">Fechar</button>
          </div>
        </div>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // --------------------------------------------------------------------------
  // MODAL DE INSERÇÃO NA PRANCHA (5 LAYOUTS)
  // --------------------------------------------------------------------------
  function openSheetInsertModal() {
    const S = getState();
    if (!S) return;

    const renders = S.getEnvironmentPresentationRenders(activeProjectId, activeEnvironmentId);
    const sheets = S.getSheetsByProject ? S.getSheetsByProject(activeProjectId) : [];

    if (renders.length === 0) {
      alert('Não há renders cadastrados neste ambiente para inserir na prancha.');
      return;
    }

    const container = document.getElementById('render-presentation-modals');
    if (!container) return;

    container.innerHTML = `
      <div class="modal-backdrop show" style="background: rgba(15,23,42,0.8); position: fixed; inset: 0; z-index: 1050; display: flex; align-items: center; justify-content: center; padding: 20px;">
        <div class="card bg-white shadow-2xl rounded-lg w-100" style="max-width: 600px;">
          <div class="card-header p-3 border-bottom d-flex justify-content-between align-items-center">
            <h5 class="h6 mb-0 font-bold">Inserir Perspectivas na Prancha (F02/F03)</h5>
            <button type="button" class="btn-close" onclick="RenderPresentationModule.closeModal()">&times;</button>
          </div>
          <div class="card-body p-4">
            <div class="form-group mb-3">
              <label class="form-label text-xs font-semibold">1. Prancha de Destino:</label>
              <select class="form-select form-select-sm" id="sheet-insert-target-id">
                ${sheets.length === 0 ? '<option value="sheet-praia-01">PR-01 &bull; Prancha Padrão (A3 Paisagem)</option>' : sheets.map(s => `
                  <option value="${s.id}">${s.sheetNumber || 'PR'} &bull; ${escapeHTML(s.name)} (${s.format} ${s.orientation})</option>
                `).join('')}
              </select>
            </div>

            <div class="form-group mb-3">
              <label class="form-label text-xs font-semibold">2. Layout Diagramado da Apresentação:</label>
              <select class="form-select form-select-sm" id="sheet-insert-layout-type">
                <option value="single">1 Imagem &bull; Tela Cheia / Hero</option>
                <option value="two_horizontal">2 Imagens &bull; Lado a Lado (50% / 50%)</option>
                <option value="three_grid">3 Imagens &bull; 1 Destaque + 2 Secundárias</option>
                <option value="four_grid">4 Imagens &bull; Grid 2x2 Simétrico</option>
                <option value="hero_details">Imagem Principal + Detalhes em Rodapé</option>
              </select>
            </div>

            <div class="text-xs text-muted p-2 bg-light rounded border mb-3">
              Os elementos serão calculados e diagramados estritamente dentro da <strong>printableArea</strong> da prancha selecionada, preservando proporções sem deformação.
            </div>

            <div class="d-flex justify-content-end gap-2">
              <button class="btn btn-outline btn-sm" onclick="RenderPresentationModule.closeModal()">Cancelar</button>
              <button class="btn btn-primary btn-sm" onclick="RenderPresentationModule.executeInsertToSheet()">
                Inserir na Prancha
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function executeInsertToSheet() {
    const S = getState();
    if (!S) return;

    const targetSheetId = document.getElementById('sheet-insert-target-id')?.value || 'sheet-praia-01';
    const layoutType = document.getElementById('sheet-insert-layout-type')?.value || 'single';

    const renders = S.getEnvironmentPresentationRenders(activeProjectId, activeEnvironmentId);
    let idsToInsert = selectedRenderIds.length > 0 ? selectedRenderIds : renders.map(r => r.id);

    try {
      const created = S.insertPerspectiveRendersToSheet(targetSheetId, idsToInsert, layoutType);
      closeModal();
      alert(`Sucesso! ${created.length} perspectiva(s) diagramada(s) na prancha no layout "${layoutType}".`);
    } catch (e) {
      alert(e.message);
    }
  }

  // --------------------------------------------------------------------------
  // MODAL DE NOVA CÂMERA
  // --------------------------------------------------------------------------
  function openNewCameraModal(envId) {
    const S = getState();
    if (!S) return;
    const env = S.getEnvironment ? S.getEnvironment(envId) : null;
    const existing = S.getEnvironmentPerspectiveCameras(activeProjectId, envId);
    const suggestedName = S.formatPerspectiveCameraName(env?.name || 'Ambiente', existing.length + 1);

    const container = document.getElementById('render-presentation-modals');
    if (!container) return;

    container.innerHTML = `
      <div class="modal-backdrop show" style="background: rgba(15,23,42,0.8); position: fixed; inset: 0; z-index: 1050; display: flex; align-items: center; justify-content: center; padding: 20px;">
        <div class="card bg-white shadow-2xl rounded-lg w-100" style="max-width: 500px;">
          <div class="card-header p-3 border-bottom d-flex justify-content-between align-items-center">
            <h5 class="h6 mb-0 font-bold">Registrar Nova Câmera Canônica</h5>
            <button type="button" class="btn-close" onclick="RenderPresentationModule.closeModal()">&times;</button>
          </div>
          <div class="card-body p-4 text-xs">
            <div class="form-group mb-2">
              <label class="form-label font-semibold">Nome da Câmera (Padrão: {Ambiente}_Cam{NN}):</label>
              <input type="text" class="form-input form-input-sm" id="new-camera-name" value="${escapeHTML(suggestedName)}" />
            </div>
            <div class="form-group mb-2">
              <label class="form-label font-semibold">Tipo / Finalidade:</label>
              <select class="form-select form-select-sm" id="new-camera-type">
                <option value="PERSPECTIVA">Perspectiva Geral</option>
                <option value="AMPLO">Plano Amplo</option>
                <option value="DETALHE">Detalhe / Marcenaria</option>
                <option value="AXONOMETRICA">Axonométrica</option>
              </select>
            </div>
            <div class="form-group mb-2">
              <label class="form-label font-semibold">Enquadramento:</label>
              <select class="form-select form-select-sm" id="new-camera-framing">
                <option value="HORIZONTAL_AMPLO">Horizontal Amplo (16:9)</option>
                <option value="HORIZONTAL_MEDIO">Horizontal Médio (3:2)</option>
                <option value="VERTICAL">Vertical / Retrato (4:5)</option>
                <option value="QUADRADO">Quadrado (1:1)</option>
              </select>
            </div>
            <div class="form-group mb-2">
              <label class="form-label font-semibold">Posição Física da Câmera:</label>
              <input type="text" class="form-input form-input-sm" id="new-camera-pos" placeholder="Ex: Canto nordeste a 1.50m do piso" />
            </div>
            <div class="form-group mb-2">
              <label class="form-label font-semibold">Direção do Olhar:</label>
              <input type="text" class="form-input form-input-sm" id="new-camera-dir" placeholder="Ex: Voltada para o painel da TV" />
            </div>
            <div class="form-group mb-3">
              <label class="form-label font-semibold">Descrição / Observações Técnicas:</label>
              <textarea class="form-textarea form-textarea-sm" id="new-camera-desc" rows="2" placeholder="Notas sobre iluminação e enquadramento"></textarea>
            </div>

            <div class="d-flex justify-content-end gap-2">
              <button class="btn btn-outline btn-sm" onclick="RenderPresentationModule.closeModal()">Cancelar</button>
              <button class="btn btn-primary btn-sm" onclick="RenderPresentationModule.submitNewCamera('${envId}')">
                Registrar Câmera
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function submitNewCamera(envId) {
    const S = getState();
    if (!S) return;

    const name = document.getElementById('new-camera-name')?.value;
    const type = document.getElementById('new-camera-type')?.value;
    const framing = document.getElementById('new-camera-framing')?.value;
    const position = document.getElementById('new-camera-pos')?.value;
    const direction = document.getElementById('new-camera-dir')?.value;
    const description = document.getElementById('new-camera-desc')?.value;

    try {
      S.registerPerspectiveCamera({
        environmentId: envId,
        projectId: activeProjectId,
        name,
        type,
        framing,
        position,
        direction,
        description
      });
      closeModal();
      refreshUI();
    } catch (e) {
      alert(e.message);
    }
  }

  // --------------------------------------------------------------------------
  // MODAL DE NOVO RENDER
  // --------------------------------------------------------------------------
  function openNewRenderModal(envId) {
    const S = getState();
    if (!S) return;
    const cameras = S.getEnvironmentPerspectiveCameras(activeProjectId, envId);

    const container = document.getElementById('render-presentation-modals');
    if (!container) return;

    container.innerHTML = `
      <div class="modal-backdrop show" style="background: rgba(15,23,42,0.8); position: fixed; inset: 0; z-index: 1050; display: flex; align-items: center; justify-content: center; padding: 20px;">
        <div class="card bg-white shadow-2xl rounded-lg w-100" style="max-width: 550px;">
          <div class="card-header p-3 border-bottom d-flex justify-content-between align-items-center">
            <h5 class="h6 mb-0 font-bold">Registrar Novo Render do Ambiente</h5>
            <button type="button" class="btn-close" onclick="RenderPresentationModule.closeModal()">&times;</button>
          </div>
          <div class="card-body p-4 text-xs">
            <div class="form-group mb-2">
              <label class="form-label font-semibold">Câmera Vinculada:</label>
              <select class="form-select form-select-sm" id="new-render-camera-id">
                ${cameras.map(c => `<option value="${c.id}">${escapeHTML(c.name)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group mb-2">
              <label class="form-label font-semibold">URL da Imagem Renderizada (Alta Resolução):</label>
              <input type="text" class="form-input form-input-sm" id="new-render-url" placeholder="https://..." value="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80" />
            </div>
            <div class="form-group mb-2">
              <label class="form-label font-semibold">URL Original (Base / Estudo):</label>
              <input type="text" class="form-input form-input-sm" id="new-render-original" placeholder="https://..." value="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80" />
            </div>
            <div class="form-group mb-2">
              <label class="form-label font-semibold">Prompt Compilado:</label>
              <textarea class="form-textarea form-textarea-sm" id="new-render-prompt" rows="2">Perspectiva fotorrealista com iluminação natural suave e materiais homologados.</textarea>
            </div>
            <div class="form-group mb-2">
              <label class="form-label font-semibold">Modelo / Provedor:</label>
              <input type="text" class="form-input form-input-sm" id="new-render-model" value="Corona 11 / Imagen 3 Architecture Pro" />
            </div>

            <div class="d-flex justify-content-end gap-2 mt-3">
              <button class="btn btn-outline btn-sm" onclick="RenderPresentationModule.closeModal()">Cancelar</button>
              <button class="btn btn-primary btn-sm" onclick="RenderPresentationModule.submitNewRender('${envId}')">
                Salvar Render
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function submitNewRender(envId) {
    const S = getState();
    if (!S) return;

    const cameraId = document.getElementById('new-render-camera-id')?.value;
    const renderUrl = document.getElementById('new-render-url')?.value;
    const originalUrl = document.getElementById('new-render-original')?.value;
    const prompt = document.getElementById('new-render-prompt')?.value;
    const model = document.getElementById('new-render-model')?.value;

    try {
      S.registerPerspectiveRender({
        environmentId: envId,
        projectId: activeProjectId,
        cameraId,
        render: renderUrl,
        original: originalUrl,
        prompt,
        model
      });
      closeModal();
      refreshUI();
    } catch (e) {
      alert(e.message);
    }
  }

  function openLightbox(url, title) {
    const container = document.getElementById('render-presentation-modals');
    if (!container) return;

    container.innerHTML = `
      <div class="modal-backdrop show cursor-pointer" style="background: rgba(0,0,0,0.92); position: fixed; inset: 0; z-index: 2000; display: flex; align-items: center; justify-content: center;" onclick="RenderPresentationModule.closeModal()">
        <div class="text-center p-3" style="max-width: 95vw; max-height: 95vh;">
          <img src="${escapeHTML(url)}" alt="Full Resolution" style="max-width: 100%; max-height: 85vh; border-radius: 4px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);" />
          <div class="text-white text-xs mt-2">${escapeHTML(title || 'Resolução Original Máxima')} &bull; Clique em qualquer lugar para fechar</div>
        </div>
      </div>
    `;
  }

  function closeModal() {
    const container = document.getElementById('render-presentation-modals');
    if (container) container.innerHTML = '';
  }

  function refreshUI() {
    const root = document.getElementById('render-presentation-root');
    if (root) {
      const parent = root.parentElement;
      if (parent) {
        parent.innerHTML = render(activeProjectId, activeEnvironmentId);
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    }
  }

  return {
    render,
    setActiveEnvironment,
    setActiveProject,
    toggleRenderSelection,
    approveRender,
    rejectRender,
    createNewVersion,
    duplicateRender,
    openComparisonModal,
    setCompareMode,
    setCompareSelection,
    openSheetInsertModal,
    executeInsertToSheet,
    openNewCameraModal,
    submitNewCamera,
    openNewRenderModal,
    submitNewRender,
    openLightbox,
    closeModal,
    refreshUI
  };
})();

if (typeof window !== 'undefined') {
  window.RenderPresentationModule = RenderPresentationModule;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RenderPresentationModule;
}
