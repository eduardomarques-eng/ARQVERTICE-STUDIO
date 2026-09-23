/**
 * ============================================================================
 * ARQVERTICE STUDIO — D04: MOTOR DE PERSPECTIVAS HUMANIZADAS
 * ============================================================================
 * Geração de perspectivas tridimensionais humanizadas a partir de modelos Revit,
 * preservação arquitetônica rígida, configurações de iluminação, realismo,
 * atmosfera e registro de saídas homologadas em APPROVED_VISUAL_OUTPUT.
 */

const HumanizedPerspectiveModule = (function () {
  'use strict';

  let activeCompareTab = 'BASE_VS_HUMANIZED';
  let compareVersionLeft = null;
  let compareVersionRight = null;
  let selectedPerspectiveId = null;

  /**
   * Renderiza o motor de perspectivas humanizadas
   */
  function render(env, project) {
    if (!env || !project) {
      return '<div class="empty-state-card"><p>Ambiente ou projeto inválido.</p></div>';
    }

    const perspectives = StudioState.getHumanizedPerspectives(project.id, env.id);
    if (perspectives.length === 0) {
      return `
        <div class="hpersp-empty-container">
          <i data-lucide="camera-off"></i>
          <h3>Nenhuma Perspectiva Cadastrada</h3>
          <p>Adicione perspectivas 3D exportadas do Revit no Levantamento (C02) para iniciar a síntese humanizada.</p>
        </div>
      `;
    }

    // Seleciona a perspectiva ativa
    const activePersp = (selectedPerspectiveId ? perspectives.find(p => p.id === selectedPerspectiveId) : null) || perspectives[0];
    const activeVersion = activePersp.currentVersion;
    const versions = activePersp.versions || [];

    return `
      <div class="hpersp-container animate-fade-in" id="hpersp-container-${env.id}">
        <!-- Topo da Perspectiva: Identificação Técnica e Regras de Preservação -->
        <header class="hpersp-header-card">
          <div class="hpersp-header-info">
            <div class="hpersp-tag-group">
              <span class="hpersp-tag-pill"><i data-lucide="sparkles"></i> D04 HUMANIZED_PERSPECTIVE_ENGINE</span>
              <span class="hpersp-realism-pill realism-${(activeVersion ? activeVersion.realismLevel : 'FOTOREALISTA').toLowerCase()}">
                <i data-lucide="camera"></i> ${escapeHTML(activeVersion ? activeVersion.realismLevel : 'FOTOREALISTA')}
              </span>
              <span class="hpersp-light-pill">
                <i data-lucide="sun"></i> ${escapeHTML(activeVersion ? activeVersion.lightingSetup : 'TARDE')}
              </span>
              <span class="hpersp-atmos-pill">
                <i data-lucide="sparkle"></i> ${escapeHTML(activeVersion ? activeVersion.atmosphere : 'ACONCHEGANTE')}
              </span>
              <span class="hpersp-ver-badge"><i data-lucide="git-branch"></i> ${escapeHTML(activeVersion ? activeVersion.versionTag : 'V01')}</span>
            </div>

            <h3 class="hpersp-title">${escapeHTML(activePersp.title || `Perspectiva Humanizada — ${env.name}`)}</h3>
            
            <p class="hpersp-disclaimer">
              <i data-lucide="shield-check"></i>
              <strong>Preservação Arquitetônica Inviolável:</strong> Geometria do modelo Revit, alvenarias, paredes, aberturas, esquadrias e proporções estruturais são rigorosamente mantidas. A imagem-base original permanece inalterada e acessível para auditoria comparativa.
            </p>
          </div>

          <div class="hpersp-camera-specs">
            <div class="camera-spec-item" title="Distância focal e enquadramento">
              <span class="k">Lente Focal</span>
              <span class="v"><i data-lucide="aperture"></i> ${escapeHTML(activePersp.focalLength || '24mm')}</span>
            </div>
            <div class="camera-spec-item" title="Altura do observador">
              <span class="k">Altura do Olhar</span>
              <span class="v"><i data-lucide="move-vertical"></i> ${activePersp.cameraHeightM || 1.55}m</span>
            </div>
            <div class="camera-spec-item" title="Origem arquitetônica">
              <span class="k">Origem</span>
              <span class="v"><i data-lucide="box"></i> Revit 3D</span>
            </div>
          </div>
        </header>

        <!-- Barra de Comandos do Motor -->
        <div class="hpersp-toolbar">
          <div class="hpersp-toolbar-left">
            <button class="btn btn-primary btn-sm" onclick="HumanizedPerspectiveModule.openGenerateModal('${project.id}', '${env.id}', '${activePersp.id}')">
              <i data-lucide="sparkles"></i> Gerar Nova Perspectiva
            </button>
            <button class="btn btn-outline btn-sm" onclick="HumanizedPerspectiveModule.openVariationModal('${activeVersion ? activeVersion.id : ''}')" ${!activeVersion ? 'disabled' : ''}>
              <i data-lucide="copy-plus"></i> Criar Variação (Luz / Atmosfera)
            </button>
            <button class="btn btn-outline btn-sm" onclick="HumanizedPerspectiveModule.openCompareModal('${activePersp.id}')">
              <i data-lucide="columns"></i> Comparar (Revit vs Humanizada)
            </button>
          </div>

          <div class="hpersp-toolbar-right">
            ${activeVersion && activeVersion.status === 'APPROVED' ? `
              <span class="hpersp-approved-badge">
                <i data-lucide="award"></i> Integrado ao APPROVED_VISUAL_OUTPUT por ${escapeHTML(activeVersion.approvedBy || 'Cliente')}
              </span>
            ` : `
              <button class="btn btn-success btn-sm" onclick="HumanizedPerspectiveModule.handleApprove('${activeVersion ? activeVersion.id : ''}')" ${!activeVersion ? 'disabled' : ''}>
                <i data-lucide="check"></i> Aprovar Perspectiva
              </button>
              <button class="btn btn-outline-danger btn-sm" onclick="HumanizedPerspectiveModule.handleReject('${activeVersion ? activeVersion.id : ''}')" ${!activeVersion ? 'disabled' : ''}>
                <i data-lucide="x"></i> Rejeitar
              </button>
            `}
          </div>
        </div>

        <!-- Grid Principal: Hero da Perspectiva + Barra Lateral de Versões e Preservação -->
        <div class="hpersp-main-grid">
          <!-- Coluna Hero (Preview em Alta Resolução) -->
          <div class="hpersp-hero-column">
            <div class="hpersp-hero-card">
              <div class="hpersp-media-wrap" onclick="HumanizedPerspectiveModule.openLightbox('${activeVersion ? activeVersion.imageUrl : activePersp.baseImageUrl}', '${escapeHTML(activePersp.title)}')">
                <img src="${activeVersion ? activeVersion.imageUrl : activePersp.baseImageUrl}" alt="${escapeHTML(activePersp.title)}" class="hpersp-hero-img" loading="lazy">
                
                <div class="hpersp-overlay-badges">
                  <span class="hpersp-overlay-ver"><i data-lucide="git-branch"></i> ${escapeHTML(activeVersion ? activeVersion.versionTag : 'V01')}</span>
                  <span class="hpersp-overlay-status status-${(activeVersion ? activeVersion.status : 'DRAFT').toLowerCase()}">
                    ${escapeHTML(activeVersion ? activeVersion.status : 'DRAFT')}
                  </span>
                  <span class="hpersp-overlay-base-link" onclick="event.stopPropagation(); HumanizedPerspectiveModule.openLightbox('${activePersp.baseImageUrl}', 'Imagem-Base Original (Revit)')" title="Ver modelo Revit original">
                    <i data-lucide="eye"></i> Ver Revit Base
                  </span>
                </div>

                <div class="hpersp-zoom-hint">
                  <i data-lucide="maximize-2"></i> Clique para expandir em tela cheia
                </div>
              </div>

              <!-- Checklist de Elementos Preservados e Editados -->
              <div class="hpersp-preservation-bar">
                <div class="preservation-group">
                  <span class="preservation-label"><i data-lucide="lock"></i> Preservação Arquitetônica Inviolável:</span>
                  <div class="preservation-chips">
                    <span class="p-chip"><i data-lucide="check"></i> Arquitetura</span>
                    <span class="p-chip"><i data-lucide="check"></i> Paredes & Alvenarias</span>
                    <span class="p-chip"><i data-lucide="check"></i> Aberturas & Esquadrias</span>
                    <span class="p-chip"><i data-lucide="check"></i> Proporções</span>
                    <span class="p-chip"><i data-lucide="check"></i> Piso & Teto</span>
                  </div>
                </div>

                <div class="preservation-group editable">
                  <span class="preservation-label"><i data-lucide="sliders"></i> Camadas Editáveis & Sintetizadas:</span>
                  <div class="preservation-chips">
                    <span class="e-chip"><i data-lucide="sparkles"></i> Materiais Nobres</span>
                    <span class="e-chip"><i data-lucide="sparkles"></i> Mobiliário Curado</span>
                    <span class="e-chip"><i data-lucide="sparkles"></i> Iluminação ${activeVersion ? activeVersion.lightingSetup : 'Tarde'}</span>
                    <span class="e-chip"><i data-lucide="sparkles"></i> Atmosfera ${activeVersion ? activeVersion.atmosphere : 'Aconchegante'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Coluna Lateral: Vistas, Versões e Governança -->
          <div class="hpersp-sidebar-column">
            <!-- 1. Seletor de Perspectivas do Ambiente -->
            ${perspectives.length > 1 ? `
              <div class="hpersp-side-card">
                <div class="hpersp-side-title">
                  <i data-lucide="video"></i>
                  <h4>Tomadas de Câmera (${perspectives.length})</h4>
                </div>
                <div class="hpersp-persp-picker">
                  ${perspectives.map(p => `
                    <div class="persp-picker-item ${p.id === activePersp.id ? 'active' : ''}" onclick="HumanizedPerspectiveModule.selectPerspective('${p.id}')">
                      <div class="picker-thumb">
                        <img src="${p.baseImageUrl}" alt="${escapeHTML(p.title)}">
                      </div>
                      <div class="picker-info">
                        <strong>${escapeHTML(p.title)}</strong>
                        <span><i data-lucide="compass"></i> ${escapeHTML(p.orientation || 'Angular')}</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- 2. Histórico de Versões Geradas -->
            <div class="hpersp-side-card">
              <div class="hpersp-side-title">
                <i data-lucide="history"></i>
                <h4>Histórico de Versões (${versions.length})</h4>
              </div>
              <div class="hpersp-versions-list">
                ${versions.map(v => {
                  const isCurrent = activeVersion && v.id === activeVersion.id;
                  return `
                    <div class="hpersp-ver-item ${isCurrent ? 'active' : ''}" onclick="HumanizedPerspectiveModule.selectVersion('${activePersp.id}', '${v.id}')">
                      <div class="hpersp-ver-thumb">
                        <img src="${v.thumbnailUrl || v.imageUrl}" alt="${v.versionTag}">
                      </div>
                      <div class="hpersp-ver-meta">
                        <div class="hpersp-ver-top">
                          <strong>${escapeHTML(v.versionTag)}</strong>
                          <span class="badge-mini status-${v.status.toLowerCase()}">${v.status}</span>
                        </div>
                        <span class="hpersp-ver-specs">${escapeHTML(v.realismLevel)} • ${escapeHTML(v.lightingSetup)}</span>
                        <span class="hpersp-ver-date">${formatRelativeDate(v.createdAt)}</span>
                      </div>
                      ${isCurrent ? '<span class="hpersp-current-indicator"></span>' : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- 3. Metadados de Governança de IA (Item 9 e 11) -->
            <div class="hpersp-side-card">
              <div class="hpersp-side-title">
                <i data-lucide="cpu"></i>
                <h4>Metadados de IA & Output Homologado</h4>
              </div>
              <div class="hpersp-gov-list">
                <div class="gov-row">
                  <span class="k">Motor:</span>
                  <span class="v">Studio Synthesis Engine</span>
                </div>
                <div class="gov-row">
                  <span class="k">Modelo:</span>
                  <span class="v">arqvertice-diffusion-arch-v2</span>
                </div>
                <div class="gov-row">
                  <span class="k">Contexto:</span>
                  <span class="v">C06 + D02 Curado</span>
                </div>
                <div class="gov-row">
                  <span class="k">Destino de Aprovação:</span>
                  <span class="v text-success"><i data-lucide="check-circle-2"></i> APPROVED_VISUAL_OUTPUT</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modais de Perspectiva Humanizada -->
      ${renderModals(activePersp, activeVersion, versions, project, env)}
    `;
  }

  /**
   * Modais de Geração / Variação e Comparação
   */
  function renderModals(persp, activeVersion, versions, project, env) {
    return `
      <!-- 1. Modal de Geração / Variação de Perspectiva -->
      <div class="modal-overlay hpersp-gen-modal" id="modal-hpersp-generate" style="display: none;">
        <div class="modal-card modal-lg">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <i data-lucide="sparkles"></i>
              <h3 id="modal-hpersp-generate-title">Gerar Perspectiva Humanizada</h3>
            </div>
            <button class="btn-icon btn-ghost" onclick="HumanizedPerspectiveModule.closeModal('modal-hpersp-generate')">
              <i data-lucide="x"></i>
            </button>
          </div>

          <form onsubmit="HumanizedPerspectiveModule.handleGenerateSubmit(event, '${persp.id}')">
            <div class="modal-body">
              <input type="hidden" id="gen-persp-parent-version-id" value="">

              <!-- Nível de Realismo (Item 5) -->
              <div class="form-group">
                <label class="form-label">Nível de Realismo Alvo:</label>
                <div class="btn-group-segmented">
                  <label class="segment-btn">
                    <input type="radio" name="persp_realism" value="APRESENTACAO">
                    <span>Apresentação Visual</span>
                  </label>
                  <label class="segment-btn">
                    <input type="radio" name="persp_realism" value="REALISTA">
                    <span>Realista</span>
                  </label>
                  <label class="segment-btn">
                    <input type="radio" name="persp_realism" value="FOTOREALISTA" checked>
                    <span>Fotorrealista</span>
                  </label>
                </div>
                <small class="form-hint">O parâmetro de realismo fica formalmente registrado nos metadados sem promessa irrealista incondicional.</small>
              </div>

              <!-- Configuração de Iluminação (Item 6) -->
              <div class="form-group">
                <label class="form-label">Condição de Iluminação da Cena:</label>
                <select id="gen-persp-lighting" class="form-select">
                  <option value="TARDE" selected>Tarde — Luz Dourada de Entardecer (Golden Hour)</option>
                  <option value="MANHA">Manhã — Luz Fresca e Suave</option>
                  <option value="DIA">Dia — Sol Alto e Luz Límpida</option>
                  <option value="NOITE">Noite — Iluminação Cênica Artificial / Intimista</option>
                  <option value="ILUMINACAO_INTERNA">Iluminação Interna Predominante (LEDs e Spots)</option>
                  <option value="ILUMINACAO_NATURAL_PREDOMINANTE">Iluminação Natural Externa Exclusiva</option>
                </select>
              </div>

              <!-- Atmosfera Pretendida (Item 7) -->
              <div class="form-group">
                <label class="form-label">Atmosfera Pretendida:</label>
                <select id="gen-persp-atmosphere" class="form-select">
                  <option value="ACONCHEGANTE" selected>Aconchegante & Acolhedora</option>
                  <option value="SOFISTICADA">Sofisticada & Elegante</option>
                  <option value="NATURAL">Natural & Biofílica</option>
                  <option value="CONTEMPORANEA">Contemporânea & Minimalista</option>
                  <option value="DRAMATICA">Dramática com Fortes Contrastes</option>
                  <option value="LEVE">Leve & Fluida</option>
                </select>
                <small class="form-hint">A atmosfera orienta tons e luz, nunca modificando a arquitetura.</small>
              </div>

              <!-- Instrução Pontual Opcional -->
              <div class="form-group">
                <label class="form-label">Instrução Pontual Específica:</label>
                <input type="text" id="gen-persp-localized" class="form-control" placeholder="Ex: Valorizar o contraste da madeira e adicionar iluminação no deck...">
              </div>

              <!-- Aviso de Preservação -->
              <div class="callout callout-info">
                <i data-lucide="shield-check"></i>
                <small>A imagem-base do Revit (vista original) permanece intacta. Paredes, vãos e proporções não serão alterados.</small>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-outline" onclick="HumanizedPerspectiveModule.closeModal('modal-hpersp-generate')">Cancelar</button>
              <button type="submit" class="btn btn-primary">
                <i data-lucide="sparkles"></i> Sintetizar Perspectiva Humanizada
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 2. Modal de Comparação Visual (Item 12) -->
      <div class="modal-overlay hpersp-compare-modal" id="modal-hpersp-compare" style="display: none;">
        <div class="modal-card modal-xl">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <i data-lucide="columns"></i>
              <h3>Comparador de Perspectiva — ${escapeHTML(persp.title)}</h3>
            </div>
            <button class="btn-icon btn-ghost" onclick="HumanizedPerspectiveModule.closeModal('modal-hpersp-compare')">
              <i data-lucide="x"></i>
            </button>
          </div>

          <div class="modal-body">
            <!-- Abas da Comparação -->
            <div class="compare-tabs-bar">
              <button 
                class="compare-tab-btn ${activeCompareTab === 'BASE_VS_HUMANIZED' ? 'active' : ''}" 
                onclick="HumanizedPerspectiveModule.switchCompareTab('${persp.id}', 'BASE_VS_HUMANIZED')"
              >
                <i data-lucide="box"></i> Base Original Revit vs Humanizada Ativa
              </button>
              <button 
                class="compare-tab-btn ${activeCompareTab === 'VERSION_VS_VERSION' ? 'active' : ''}" 
                onclick="HumanizedPerspectiveModule.switchCompareTab('${persp.id}', 'VERSION_VS_VERSION')"
              >
                <i data-lucide="git-compare"></i> Comparar Versões (${versions.map(v => v.versionTag).join(' vs ')})
              </button>
            </div>

            <!-- Conteúdo Split-Screen -->
            <div id="hpersp-compare-content-container">
              ${renderCompareContent(persp)}
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline" onclick="HumanizedPerspectiveModule.closeModal('modal-hpersp-compare')">Fechar</button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Renderiza o painel split-screen de comparação
   */
  function renderCompareContent(persp) {
    const data = StudioState.getPerspectiveComparisonData(persp.id, activeCompareTab, compareVersionLeft, compareVersionRight);
    if (!data) return '<div class="empty-state-card"><p>Sem dados para comparação.</p></div>';

    return `
      <div class="hpersp-compare-grid">
        <!-- Lado Esquerdo -->
        <div class="hpersp-compare-card">
          <div class="hpersp-compare-card-header">
            <span class="badge ${data.left.badgeClass || 'badge-vis-preparing'}">${data.left.badge}</span>
            <h4>${escapeHTML(data.left.title)}</h4>
            <p>${escapeHTML(data.left.subtitle)}</p>
          </div>
          <div class="hpersp-compare-media">
            <img src="${data.left.url}" alt="${escapeHTML(data.left.title)}" loading="lazy">
          </div>
        </div>

        <!-- Divisor Central -->
        <div class="hpersp-compare-divider">
          <span class="divider-circle">VS</span>
        </div>

        <!-- Lado Direito -->
        <div class="hpersp-compare-card">
          <div class="hpersp-compare-card-header">
            <span class="badge ${data.right.badgeClass || 'badge-vis-approved'}">${data.right.badge}</span>
            <h4>${escapeHTML(data.right.title)}</h4>
            <p>${escapeHTML(data.right.subtitle)}</p>
          </div>
          <div class="hpersp-compare-media">
            <img src="${data.right.url}" alt="${escapeHTML(data.right.title)}" loading="lazy">
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // CONTROLES E HANDLERS
  // ==========================================================================

  function openGenerateModal(projectId, environmentId, perspectiveId) {
    const modal = document.getElementById('modal-hpersp-generate');
    if (!modal) return;
    document.getElementById('modal-hpersp-generate-title').textContent = 'Gerar Perspectiva Humanizada';
    document.getElementById('gen-persp-parent-version-id').value = '';
    document.getElementById('gen-persp-localized').value = '';
    modal.style.display = 'flex';
  }

  function openVariationModal(parentVersionId) {
    const modal = document.getElementById('modal-hpersp-generate');
    if (!modal) return;
    document.getElementById('modal-hpersp-generate-title').textContent = 'Criar Variação a partir da Versão Ativa';
    document.getElementById('gen-persp-parent-version-id').value = parentVersionId || '';
    document.getElementById('gen-persp-localized').value = 'Variação com novo esquema de luz ou materiais';
    modal.style.display = 'flex';
  }

  function handleGenerateSubmit(event, perspectiveId) {
    event.preventDefault();
    const realismLevel = document.querySelector('input[name="persp_realism"]:checked')?.value || 'FOTOREALISTA';
    const lightingSetup = document.getElementById('gen-persp-lighting')?.value || 'TARDE';
    const atmosphere = document.getElementById('gen-persp-atmosphere')?.value || 'ACONCHEGANTE';
    const localizedInstruction = document.getElementById('gen-persp-localized')?.value || null;
    const parentVersionId = document.getElementById('gen-persp-parent-version-id')?.value || null;

    closeModal('modal-hpersp-generate');
    StudioApp.showToast('Iniciando síntese de perspectiva humanizada...');

    try {
      if (parentVersionId) {
        StudioState.createPerspectiveVariation(parentVersionId, {
          realismLevel,
          lightingSetup,
          atmosphere,
          localizedInstruction
        });
      } else {
        StudioState.generateHumanizedPerspective(perspectiveId, {
          realismLevel,
          lightingSetup,
          atmosphere,
          localizedInstruction
        });
      }
      StudioApp.showToast('Perspectiva humanizada gerada com sucesso!');
      refreshCurrentView();
    } catch (err) {
      StudioApp.showToast(`Erro ao gerar perspectiva: ${err.message}`);
    }
  }

  function handleApprove(versionId) {
    if (!versionId) return;
    const notes = prompt('Observações de aprovação para integrar ao APPROVED_VISUAL_OUTPUT:', 'Aprovada formalmente para caderno de apresentação e moodboard.');
    if (notes === null) return;

    try {
      StudioState.approvePerspectiveVersion(versionId, 'Pedro (Cliente Titular)', notes);
      StudioApp.showToast('Perspectiva aprovada e integrada ao APPROVED_VISUAL_OUTPUT!');
      refreshCurrentView();
    } catch (err) {
      StudioApp.showToast(`Erro na aprovação: ${err.message}`);
    }
  }

  function handleReject(versionId) {
    if (!versionId) return;
    const reason = prompt('Motivo da rejeição da perspectiva:', 'Ajuste de iluminação ou materiais solicitado.');
    if (reason === null) return;

    try {
      StudioState.rejectPerspectiveVersion(versionId, 'Arquiteto', reason);
      StudioApp.showToast('Perspectiva rejeitada e arquivada.');
      refreshCurrentView();
    } catch (err) {
      StudioApp.showToast(`Erro ao rejeitar: ${err.message}`);
    }
  }

  function selectPerspective(perspectiveId) {
    selectedPerspectiveId = perspectiveId;
    refreshCurrentView();
  }

  function selectVersion(perspectiveId, versionId) {
    const persp = (StudioState.data.humanizedPerspectives || []).find(p => p.id === perspectiveId);
    if (persp) {
      persp.currentVersionId = versionId;
      StudioState.save();
      refreshCurrentView();
    }
  }

  function openCompareModal(perspectiveId) {
    const modal = document.getElementById('modal-hpersp-compare');
    if (!modal) return;
    modal.style.display = 'flex';
    switchCompareTab(perspectiveId, 'BASE_VS_HUMANIZED');
  }

  function switchCompareTab(perspectiveId, tab) {
    activeCompareTab = tab;
    const container = document.getElementById('hpersp-compare-content-container');
    const tabs = document.querySelectorAll('.compare-tab-btn');
    tabs.forEach(t => t.classList.remove('active'));

    if (tab === 'BASE_VS_HUMANIZED' && tabs[0]) tabs[0].classList.add('active');
    if (tab === 'VERSION_VS_VERSION' && tabs[1]) tabs[1].classList.add('active');

    const persp = (StudioState.data.humanizedPerspectives || []).find(p => p.id === perspectiveId);
    if (container && persp) {
      container.innerHTML = renderCompareContent(persp);
      if (window.lucide) lucide.createIcons();
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

  function refreshCurrentView() {
    if (typeof EnvironmentVisualizationModule !== 'undefined' && EnvironmentVisualizationModule.refresh) {
      EnvironmentVisualizationModule.refresh();
    } else if (typeof StudioApp !== 'undefined' && StudioApp.renderCurrentView) {
      StudioApp.renderCurrentView();
    }
  }

  return {
    render,
    openGenerateModal,
    openVariationModal,
    handleGenerateSubmit,
    handleApprove,
    handleReject,
    selectPerspective,
    selectVersion,
    openCompareModal,
    switchCompareTab,
    openLightbox,
    closeModal
  };
})();

if (typeof window !== 'undefined') {
  window.HumanizedPerspectiveModule = HumanizedPerspectiveModule;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HumanizedPerspectiveModule };
}
