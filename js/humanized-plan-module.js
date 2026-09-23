/**
 * ============================================================================
 * ARQVERTICE STUDIO — D03: MOTOR DE GERAÇÃO DE PLANTA HUMANIZADA
 * ============================================================================
 * Módulo de apresentação visual para plantas de interiores derivadas do Revit,
 * com preservação estrita de alvenarias/vãos, modos A e B, versionamento,
 * comandos pontuais, governança de IA, retry em falha e comparação visual.
 */

const HumanizedPlanModule = (function () {
  'use strict';

  let activeCompareTab = 'ORIGINAL_VS_HUMANIZED';
  let compareVersionLeft = null;
  let compareVersionRight = null;

  /**
   * Renderiza o motor de Planta Humanizada na Seção 3 do Workspace de Visualização
   */
  function render(env, project) {
    if (!env || !project) {
      return '<div class="empty-state-card"><p>Ambiente ou projeto inválido.</p></div>';
    }

    const plan = StudioState.getHumanizedPlan(project.id, env.id);
    const activeVersion = plan.currentVersion;
    const versions = plan.versions || [];

    return `
      <div class="hplan-container animate-fade-in" id="hplan-container-${env.id}">
        <!-- Topo: Identificação Técnica e Regra Anti-Substituição -->
        <header class="hplan-header-card">
          <div class="hplan-header-info">
            <div class="hplan-tag-group">
              <span class="hplan-tag-pill"><i data-lucide="sparkles"></i> D03 HUMANIZED_PLAN_ENGINE</span>
              <span class="hplan-mode-pill ${activeVersion && activeVersion.mode === 'MODE_B_HYBRID_COMPOSITION' ? 'mode-hybrid' : 'mode-transform'}">
                <i data-lucide="${activeVersion && activeVersion.mode === 'MODE_B_HYBRID_COMPOSITION' ? 'layers' : 'wand-2'}"></i>
                ${activeVersion && activeVersion.mode === 'MODE_B_HYBRID_COMPOSITION' ? 'Modo B: Composição Híbrida' : 'Modo A: Transformação Visual'}
              </span>
              <span class="hplan-ver-badge"><i data-lucide="git-branch"></i> ${escapeHTML(activeVersion ? activeVersion.versionTag : 'V01')}</span>
            </div>
            <h3 class="hplan-title">${escapeHTML(plan.title || `Planta Humanizada — ${env.name}`)}</h3>
            <p class="hplan-disclaimer">
              <i data-lucide="shield-alert"></i>
              <strong>Limitação Técnica Fundamental:</strong> Imagem gráfica destinada à apresentação estética de interiores ao cliente. 
              <strong>Não substitui a planta técnica do Revit.</strong> Dimensões, paredes, portas, janelas, vãos e circulação são estritamente preservados da fonte geométrica original.
            </p>
          </div>

          <div class="hplan-specs-badges">
            <div class="hplan-spec-item" title="Escala original registrada no modelo técnico">
              <span class="k">Escala Nominal</span>
              <span class="v"><i data-lucide="ruler"></i> ${escapeHTML(plan.scaleNominal || '1:50')}</span>
            </div>
            <div class="hplan-spec-item" title="Dimensões métricas reais calculadas para o ambiente">
              <span class="k">Dimensões Reais</span>
              <span class="v"><i data-lucide="maximize-2"></i> ${escapeHTML(plan.dimensionsM || '12.40m x 7.80m')}</span>
            </div>
            <div class="hplan-spec-item" title="Resolução gráfica de apresentação">
              <span class="k">Resolução</span>
              <span class="v"><i data-lucide="monitor"></i> ${plan.dpi || 300} DPI</span>
            </div>
            <div class="hplan-spec-item" title="Orientação solar confirmada">
              <span class="k">Orientação</span>
              <span class="v"><i data-lucide="compass"></i> ${escapeHTML(plan.orientation || 'Norte Verdadeiro')}</span>
            </div>
          </div>
        </header>

        <!-- Barra de Comandos do Motor (Item 11) -->
        <div class="hplan-toolbar">
          <div class="hplan-toolbar-left">
            <button class="btn btn-primary btn-sm" onclick="HumanizedPlanModule.openGenerateModal('${project.id}', '${env.id}', '${plan.id}')">
              <i data-lucide="sparkles"></i> Gerar Nova Versão
            </button>
            <button class="btn btn-outline btn-sm" onclick="HumanizedPlanModule.openVariationModal('${activeVersion ? activeVersion.id : ''}')" ${!activeVersion ? 'disabled' : ''}>
              <i data-lucide="copy-plus"></i> Criar Variação
            </button>
            <button class="btn btn-outline btn-sm" onclick="HumanizedPlanModule.handleRegenerate('${activeVersion ? activeVersion.id : ''}')" ${!activeVersion ? 'disabled' : ''}>
              <i data-lucide="refresh-cw"></i> Regenerar
            </button>
            <button class="btn btn-outline btn-sm" onclick="HumanizedPlanModule.openCompareModal('${plan.id}')">
              <i data-lucide="columns"></i> Comparar (Original vs Humanizada)
            </button>
          </div>

          <div class="hplan-toolbar-right">
            ${activeVersion && activeVersion.status === 'APPROVED' ? `
              <span class="hplan-approved-status-pill">
                <i data-lucide="check-check"></i> Versão Homologada por ${escapeHTML(activeVersion.approvedBy || 'Cliente')}
              </span>
            ` : `
              <button class="btn btn-success btn-sm" onclick="HumanizedPlanModule.handleApprove('${activeVersion ? activeVersion.id : ''}')" ${!activeVersion ? 'disabled' : ''}>
                <i data-lucide="check"></i> Aprovar Versão
              </button>
              <button class="btn btn-outline-danger btn-sm" onclick="HumanizedPlanModule.handleReject('${activeVersion ? activeVersion.id : ''}')" ${!activeVersion ? 'disabled' : ''}>
                <i data-lucide="x"></i> Rejeitar
              </button>
            `}
            <button class="btn btn-ghost btn-sm" onclick="HumanizedPlanModule.handleDuplicate('${activeVersion ? activeVersion.id : ''}')" title="Duplicar Versão como Rascunho">
              <i data-lucide="files"></i>
            </button>
            <button class="btn btn-ghost btn-sm text-warning" onclick="HumanizedPlanModule.simulateFailureAndRetry('${activeVersion ? activeVersion.id : ''}')" title="Testar Resiliência a Falhas de IA e Retry">
              <i data-lucide="alert-triangle"></i> Simular Falha
            </button>
          </div>
        </div>

        <!-- Painel Central: Hero da Planta Ativa + Painel Lateral de Controle e Comandos Pontuais -->
        <div class="hplan-main-grid">
          <!-- Coluna Principal: Hero da Planta Ativa -->
          <div class="hplan-hero-column">
            <div class="hplan-hero-card">
              <div class="hplan-hero-media-wrap" onclick="HumanizedPlanModule.openLightbox('${activeVersion ? activeVersion.imageUrl : ''}', '${escapeHTML(activeVersion ? activeVersion.versionTag : 'Planta Humanizada')}')">
                <img src="${activeVersion ? activeVersion.imageUrl : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'}" alt="Planta Humanizada" class="hplan-hero-img" loading="lazy">
                
                <div class="hplan-overlay-badges">
                  <span class="hplan-tag-ver"><i data-lucide="git-branch"></i> ${escapeHTML(activeVersion ? activeVersion.versionTag : 'V01')}</span>
                  <span class="hplan-tag-status status-${(activeVersion ? activeVersion.status : 'DRAFT').toLowerCase()}">
                    ${escapeHTML(activeVersion ? activeVersion.status : 'DRAFT')}
                  </span>
                  <span class="hplan-tag-source" title="Vinculada à versão da planta do Revit">
                    <i data-lucide="link-2"></i> Fonte: ${escapeHTML(plan.sourcePlanVersion || 'V01')}
                  </span>
                </div>

                <div class="hplan-zoom-hint">
                  <i data-lucide="maximize-2"></i> Clique para expandir em alta resolução
                </div>
              </div>

              <!-- Detalhes Arquitetônicos da Versão -->
              <div class="hplan-hero-details">
                <div class="hplan-detail-row">
                  <span class="hplan-detail-label"><i data-lucide="palette"></i> Acabamentos e Pisos:</span>
                  <span class="hplan-detail-value">${escapeHTML(activeVersion ? activeVersion.materialsSummary : 'Piso Travertino Navona e marcenaria carvalho')}</span>
                </div>
                <div class="hplan-detail-row">
                  <span class="hplan-detail-label"><i data-lucide="armchair"></i> Layout de Mobiliário:</span>
                  <span class="hplan-detail-value">${escapeHTML(activeVersion ? activeVersion.furnitureLayout : 'Sofá em linho cru, mesa de jantar de 8 lugares, tapete de fibra natural')}</span>
                </div>
                <div class="hplan-detail-row">
                  <span class="hplan-detail-label"><i data-lucide="sun"></i> Iluminação & Sombras:</span>
                  <span class="hplan-detail-value">${escapeHTML(activeVersion ? activeVersion.lightingMode : 'Luz solar natural filtrada com sombras suaves')}</span>
                </div>
                ${activeVersion && activeVersion.localizedInstruction ? `
                  <div class="hplan-detail-row localized-highlight">
                    <span class="hplan-detail-label"><i data-lucide="target"></i> Ajuste Pontual Aplicado:</span>
                    <span class="hplan-detail-value font-semibold">"${escapeHTML(activeVersion.localizedInstruction)}"</span>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>

          <!-- Coluna Lateral: Comandos Pontuais (Item 12) + Histórico de Versões (Item 10) -->
          <div class="hplan-sidebar-column">
            <!-- 1. Comandos Pontuais Preparatórios para D07 -->
            <div class="hplan-side-card">
              <div class="hplan-side-title">
                <i data-lucide="target"></i>
                <h4>Comandos Pontuais de Ajuste</h4>
              </div>
              <p class="hplan-side-desc">Ajuste elementos específicos na planta preservando a base arquitetônica e as alvenarias.</p>

              <!-- Chips Rápidos Pré-configurados -->
              <div class="hplan-preset-chips">
                ${(StudioState.LOCALIZED_COMMAND_PRESETS || [
                  'Mude somente o piso.',
                  'Altere somente o sofá.',
                  'Escureça os armários.',
                  'Adicione vegetação interna.',
                  'Suavize as sombras.'
                ]).map(cmd => `
                  <button class="hplan-preset-chip" onclick="HumanizedPlanModule.applyQuickCommand('${activeVersion ? activeVersion.id : ''}', '${cmd}')">
                    ${cmd}
                  </button>
                `).join('')}
              </div>

              <!-- Input Customizado de Comando Pontual -->
              <div class="hplan-custom-cmd-wrap">
                <input 
                  type="text" 
                  id="hplan-custom-input-${env.id}" 
                  class="form-control form-control-sm" 
                  placeholder="Ex: Altere o tom da madeira para carvalho claro..."
                  onkeydown="if(event.key==='Enter') HumanizedPlanModule.applyCustomCommand('${activeVersion ? activeVersion.id : ''}')"
                >
                <button class="btn btn-primary btn-xs" onclick="HumanizedPlanModule.applyCustomCommand('${activeVersion ? activeVersion.id : ''}')">
                  <i data-lucide="arrow-right"></i>
                </button>
              </div>
            </div>

            <!-- 2. Histórico de Versões (Item 10) -->
            <div class="hplan-side-card">
              <div class="hplan-side-title">
                <i data-lucide="history"></i>
                <h4>Versões Geradas (${versions.length})</h4>
              </div>

              <div class="hplan-versions-list">
                ${versions.map(v => {
                  const isCurrent = activeVersion && v.id === activeVersion.id;
                  return `
                    <div class="hplan-ver-item ${isCurrent ? 'active' : ''}" onclick="HumanizedPlanModule.selectVersion('${plan.id}', '${v.id}')">
                      <div class="hplan-ver-thumb">
                        <img src="${v.thumbnailUrl || v.imageUrl}" alt="${v.versionTag}">
                      </div>
                      <div class="hplan-ver-meta">
                        <div class="hplan-ver-title-row">
                          <strong>${escapeHTML(v.versionTag)}</strong>
                          <span class="badge-mini status-${v.status.toLowerCase()}">${v.status}</span>
                        </div>
                        <span class="hplan-ver-style">${escapeHTML(v.visualStyle || 'Estilo Geral')}</span>
                        <span class="hplan-ver-date">${formatRelativeDate(v.createdAt)}</span>
                      </div>
                      ${isCurrent ? '<span class="hplan-current-dot" title="Versão em Exibição"></span>' : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- 3. Rastreabilidade de IA (Item 13) -->
            <div class="hplan-side-card">
              <div class="hplan-side-title">
                <i data-lucide="cpu"></i>
                <h4>Governança do Modelo de IA</h4>
              </div>
              <div class="hplan-ai-meta-list">
                <div class="ai-meta-row">
                  <span class="k">Motor:</span>
                  <span class="v">Studio Synthesis Engine</span>
                </div>
                <div class="ai-meta-row">
                  <span class="k">Modelo:</span>
                  <span class="v">arqvertice-diffusion-arch-v2</span>
                </div>
                <div class="ai-meta-row">
                  <span class="k">Contexto Ativo:</span>
                  <span class="v">C06_V01 (Decisões & Memória)</span>
                </div>
                <div class="ai-meta-row">
                  <span class="k">Segurança:</span>
                  <span class="v text-success"><i data-lucide="lock"></i> Sem exposição de API Keys</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modais do Motor de Planta Humanizada -->
      ${renderModals(plan, activeVersion, versions, project, env)}
    `;
  }

  /**
   * Renderiza os modais de Comparação e de Nova Geração
   */
  function renderModals(plan, activeVersion, versions, project, env) {
    return `
      <!-- 1. Modal de Comparação Visual (Item 15) -->
      <div class="modal-overlay" id="modal-hplan-compare" style="display: none;">
        <div class="modal-card modal-xl">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <i data-lucide="columns"></i>
              <h3>Comparador de Planta — ${escapeHTML(env.name)}</h3>
            </div>
            <button class="btn-icon btn-ghost" onclick="HumanizedPlanModule.closeModal('modal-hplan-compare')">
              <i data-lucide="x"></i>
            </button>
          </div>

          <div class="modal-body">
            <!-- Barra de Abas da Comparação -->
            <div class="compare-tabs-bar">
              <button 
                class="compare-tab-btn ${activeCompareTab === 'ORIGINAL_VS_HUMANIZED' ? 'active' : ''}" 
                onclick="HumanizedPlanModule.switchCompareTab('${plan.id}', 'ORIGINAL_VS_HUMANIZED')"
              >
                <i data-lucide="file-check"></i> Original Técnica (Revit) vs Humanizada
              </button>
              <button 
                class="compare-tab-btn ${activeCompareTab === 'VERSION_VS_VERSION' ? 'active' : ''}" 
                onclick="HumanizedPlanModule.switchCompareTab('${plan.id}', 'VERSION_VS_VERSION')"
              >
                <i data-lucide="git-compare"></i> Comparar Versões (${versions.map(v => v.versionTag).join(' vs ')})
              </button>
            </div>

            <!-- Painel Split-Screen -->
            <div id="hplan-compare-content-container">
              ${renderCompareContent(plan)}
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline" onclick="HumanizedPlanModule.closeModal('modal-hplan-compare')">Fechar</button>
          </div>
        </div>
      </div>

      <!-- 2. Modal de Geração de Nova Versão / Variação -->
      <div class="modal-overlay" id="modal-hplan-generate" style="display: none;">
        <div class="modal-card">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <i data-lucide="sparkles"></i>
              <h3 id="modal-hplan-generate-title">Gerar Nova Versão de Planta Humanizada</h3>
            </div>
            <button class="btn-icon btn-ghost" onclick="HumanizedPlanModule.closeModal('modal-hplan-generate')">
              <i data-lucide="x"></i>
            </button>
          </div>

          <form onsubmit="HumanizedPlanModule.handleGenerateSubmit(event, '${plan.id}')">
            <div class="modal-body">
              <input type="hidden" id="gen-parent-version-id" value="">

              <!-- Seleção do Modo de Geração (Item 7) -->
              <div class="form-group">
                <label class="form-label">Modo de Geração Arquitetônica:</label>
                <div class="gen-modes-selector">
                  <label class="gen-mode-radio">
                    <input type="radio" name="gen_mode" value="MODE_A_TRANSFORMATION" checked>
                    <div class="mode-desc-box">
                      <strong>Modo A — Transformação Visual sobre Imagem-base</strong>
                      <p>Renderização de superfícies, pisos, iluminação natural e mobília sobre a planta técnica original.</p>
                    </div>
                  </label>
                  <label class="gen-mode-radio">
                    <input type="radio" name="gen_mode" value="MODE_B_HYBRID_COMPOSITION">
                    <div class="mode-desc-box">
                      <strong>Modo B — Composição Híbrida Estruturada</strong>
                      <p>Preserva rigorosamente o traço mestre vetorial do Revit e compõe texturas e sombras por camadas.</p>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Estilo Visual -->
              <div class="form-group">
                <label class="form-label">Estilo Visual da Planta:</label>
                <input type="text" id="gen-visual-style" class="form-control" value="Contemporâneo Litorâneo Acolhedor">
              </div>

              <!-- Ajuste Pontual / Localizado (Item 12) -->
              <div class="form-group">
                <label class="form-label">Comando Pontual Opcional (Ex: "Mude somente o piso"):</label>
                <input type="text" id="gen-localized-instruction" class="form-control" placeholder="Deixe em branco para renderização completa...">
              </div>

              <!-- Inclusão de Pessoas -->
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="gen-include-people">
                  <span>Incluir escalas humanas (pessoas) em vista superior</span>
                </label>
              </div>

              <!-- Nota de Salvaguarda -->
              <div class="callout callout-info" style="margin-top: 12px;">
                <i data-lucide="info"></i>
                <small>As alvenarias, portas e janelas do Revit não sofrerão alterações arbitrárias durante a geração.</small>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-outline" onclick="HumanizedPlanModule.closeModal('modal-hplan-generate')">Cancelar</button>
              <button type="submit" class="btn btn-primary" id="btn-submit-hplan-gen">
                <i data-lucide="sparkles"></i> Processar Planta Humanizada
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  /**
   * Renderiza o conteúdo do Split-Screen de Comparação
   */
  function renderCompareContent(plan) {
    const data = StudioState.getPlanComparisonData(plan.id, activeCompareTab, compareVersionLeft, compareVersionRight);
    if (!data) return '<div class="empty-state-card"><p>Sem dados para comparação.</p></div>';

    return `
      <div class="hplan-compare-grid">
        <!-- Lado Esquerdo -->
        <div class="hplan-compare-card">
          <div class="hplan-compare-card-header">
            <div>
              <span class="badge ${data.left.badgeClass || 'badge-vis-preparing'}">${data.left.badge}</span>
              <h4>${escapeHTML(data.left.title)}</h4>
              <p>${escapeHTML(data.left.subtitle)}</p>
            </div>
          </div>
          <div class="hplan-compare-media">
            <img src="${data.left.url}" alt="${escapeHTML(data.left.title)}" loading="lazy">
          </div>
        </div>

        <!-- Divisor Central -->
        <div class="hplan-compare-divider">
          <span class="divider-circle">VS</span>
        </div>

        <!-- Lado Direito -->
        <div class="hplan-compare-card">
          <div class="hplan-compare-card-header">
            <div>
              <span class="badge ${data.right.badgeClass || 'badge-vis-approved'}">${data.right.badge}</span>
              <h4>${escapeHTML(data.right.title)}</h4>
              <p>${escapeHTML(data.right.subtitle)}</p>
            </div>
          </div>
          <div class="hplan-compare-media">
            <img src="${data.right.url}" alt="${escapeHTML(data.right.title)}" loading="lazy">
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // HANDLERS E CONTROLES DE INTERAÇÃO
  // ==========================================================================

  function openGenerateModal(projectId, environmentId, planId) {
    const modal = document.getElementById('modal-hplan-generate');
    if (!modal) return;
    document.getElementById('modal-hplan-generate-title').textContent = 'Gerar Nova Versão de Planta Humanizada';
    document.getElementById('gen-parent-version-id').value = '';
    document.getElementById('gen-localized-instruction').value = '';
    modal.style.display = 'flex';
  }

  function openVariationModal(parentVersionId) {
    const modal = document.getElementById('modal-hplan-generate');
    if (!modal) return;
    document.getElementById('modal-hplan-generate-title').textContent = 'Criar Variação a partir da Versão Ativa';
    document.getElementById('gen-parent-version-id').value = parentVersionId || '';
    document.getElementById('gen-localized-instruction').value = 'Variação com novos tons e acabamentos';
    modal.style.display = 'flex';
  }

  function handleGenerateSubmit(event, planId) {
    event.preventDefault();
    const mode = document.querySelector('input[name="gen_mode"]:checked')?.value || 'MODE_A_TRANSFORMATION';
    const visualStyle = document.getElementById('gen-visual-style')?.value || 'Contemporâneo Litorâneo';
    const localizedInstruction = document.getElementById('gen-localized-instruction')?.value || null;
    const includePeople = document.getElementById('gen-include-people')?.checked || false;
    const parentVersionId = document.getElementById('gen-parent-version-id')?.value || null;

    closeModal('modal-hplan-generate');
    StudioApp.showToast('Iniciando síntese de planta humanizada...');

    try {
      if (parentVersionId) {
        StudioState.createHumanizedPlanVariation(parentVersionId, localizedInstruction, localizedInstruction);
      } else {
        StudioState.generateHumanizedPlan(planId, {
          mode,
          visualStyle,
          localizedInstruction,
          peopleIncluded: includePeople
        });
      }
      StudioApp.showToast('Planta humanizada gerada com sucesso!');
      refreshCurrentView();
    } catch (err) {
      StudioApp.showToast(`Erro na geração: ${err.message}`);
    }
  }

  function handleRegenerate(versionId) {
    if (!versionId) return;
    if (!confirm('Deseja regenerar esta versão de planta humanizada com o motor de síntese?')) return;

    try {
      StudioState.regenerateHumanizedPlan(versionId);
      StudioApp.showToast('Versão regenerada com sucesso!');
      refreshCurrentView();
    } catch (err) {
      StudioApp.showToast(`Erro ao regenerar: ${err.message}`);
    }
  }

  function handleApprove(versionId) {
    if (!versionId) return;
    const notes = prompt('Observações de aprovação para a planta humanizada:', 'Aprovada formalmente para caderno de apresentação.');
    if (notes === null) return;

    try {
      StudioState.approveHumanizedPlanVersion(versionId, 'Pedro (Cliente Titular)', notes);
      StudioApp.showToast('Planta humanizada homologada como APROVADA!');
      refreshCurrentView();
    } catch (err) {
      StudioApp.showToast(`Erro na aprovação: ${err.message}`);
    }
  }

  function handleReject(versionId) {
    if (!versionId) return;
    const reason = prompt('Motivo da rejeição da planta humanizada:', 'Ajuste no layout e cores solicitado pelo cliente.');
    if (reason === null) return;

    try {
      StudioState.rejectHumanizedPlanVersion(versionId, 'Arquiteto', reason);
      StudioApp.showToast('Versão rejeitada. Retornada à versão anterior estável.');
      refreshCurrentView();
    } catch (err) {
      StudioApp.showToast(`Erro ao rejeitar: ${err.message}`);
    }
  }

  function handleDuplicate(versionId) {
    if (!versionId) return;
    try {
      StudioState.duplicateHumanizedPlanVersion(versionId);
      StudioApp.showToast('Versão duplicada como rascunho com sucesso!');
      refreshCurrentView();
    } catch (err) {
      StudioApp.showToast(`Erro ao duplicar: ${err.message}`);
    }
  }

  function simulateFailureAndRetry(versionId) {
    if (!versionId) return;
    try {
      const result = StudioState.simulateGenerationFailureAndRetry(versionId);
      alert(`[SIMULAÇÃO DE FALHA REGISTRADA]\nErro: ${result.failedGeneration.errorMessage}\n\nA versão anterior permanece intacta e o erro foi registrado no log de auditoria.`);
      
      if (confirm('Deseja acionar o Retry automático agora?')) {
        result.retryAction();
        StudioApp.showToast('Retry executado com êxito! Conexão reestabelecida.');
        refreshCurrentView();
      }
    } catch (err) {
      StudioApp.showToast(`Erro na simulação: ${err.message}`);
    }
  }

  function applyQuickCommand(versionId, commandText) {
    if (!versionId) return;
    try {
      StudioApp.showToast(`Aplicando: "${commandText}"...`);
      StudioState.createHumanizedPlanVariation(versionId, commandText, commandText);
      StudioApp.showToast('Nova variação pontual gerada com sucesso!');
      refreshCurrentView();
    } catch (err) {
      StudioApp.showToast(`Erro ao aplicar comando: ${err.message}`);
    }
  }

  function applyCustomCommand(versionId) {
    const input = document.querySelector('input[id^="hplan-custom-input-"]');
    if (!input || !input.value.trim()) {
      StudioApp.showToast('Informe o comando de ajuste.');
      return;
    }
    applyQuickCommand(versionId, input.value.trim());
    input.value = '';
  }

  function selectVersion(planId, versionId) {
    StudioState.setHumanizedPlanActiveVersion(planId, versionId);
    refreshCurrentView();
  }

  function openCompareModal(planId) {
    const modal = document.getElementById('modal-hplan-compare');
    if (!modal) return;
    modal.style.display = 'flex';
    switchCompareTab(planId, 'ORIGINAL_VS_HUMANIZED');
  }

  function switchCompareTab(planId, tab) {
    activeCompareTab = tab;
    const container = document.getElementById('hplan-compare-content-container');
    const tabs = document.querySelectorAll('.compare-tab-btn');
    tabs.forEach(t => t.classList.remove('active'));

    if (tab === 'ORIGINAL_VS_HUMANIZED' && tabs[0]) tabs[0].classList.add('active');
    if (tab === 'VERSION_VS_VERSION' && tabs[1]) tabs[1].classList.add('active');

    const plan = (StudioState.data.humanizedPlans || []).find(p => p.id === planId);
    if (container && plan) {
      container.innerHTML = renderCompareContent(plan);
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
    handleRegenerate,
    handleApprove,
    handleReject,
    handleDuplicate,
    simulateFailureAndRetry,
    applyQuickCommand,
    applyCustomCommand,
    selectVersion,
    openCompareModal,
    switchCompareTab,
    openLightbox,
    closeModal
  };
})();

if (typeof window !== 'undefined') {
  window.HumanizedPlanModule = HumanizedPlanModule;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HumanizedPlanModule };
}
