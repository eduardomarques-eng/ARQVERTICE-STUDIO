/**
 * ============================================================================
 * ARQVERTICE STUDIO — D08: VERSIONAMENTO, APROVAÇÃO E REVISÃO DAS IMAGENS
 * ============================================================================
 * Módulo de controle completo das versões visuais (Section 7 do Workspace).
 * Garante que nenhuma geração importante substitua a anterior silenciosamente.
 * Suporta:
 * - 6 Tipos: HUMANIZED_PLAN, HUMANIZED_PERSPECTIVE, CAMERA, RENDER, REFERENCE_SET, VISUAL_CONFIGURATION
 * - 7 Status: DRAFT, GENERATING, IN_REVIEW, APPROVED, REJECTED, SUPERSEDED, ARCHIVED
 * - Aprovação e registro de APPROVED_VISUAL_REFERENCE
 * - Rejeição com 7 motivos canônicos sem deleção automática
 * - Substituição rastreável (SUPERSEDED)
 * - Comparação lado a lado (imagem, diferenças, prompt, câmera, locks)
 * - Timeline cronológica (eventos)
 * - Comentários e conversão em DESIGN_DECISION
 * - Criação de Snapshots Visuais completos
 * - Restauração segura "USE AS BASE"
 */

const VisualVersioningModule = (function () {
  'use strict';

  let currentFilterType = 'ALL';
  let compareVersionId1 = null;
  let compareVersionId2 = null;

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDateTime(isoString) {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' às ' +
             d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return isoString;
    }
  }

  function formatTime(isoString) {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return isoString;
    }
  }

  /**
   * Renderiza a Seção 7 completa de versionamento
   */
  function render(visData, env, project) {
    const projId = project ? project.id : (visData ? visData.projectId : 'prj-praia-01');
    const envId = env ? env.id : (visData ? visData.environmentId : 'amb-sala-01');
    const state = (typeof StudioState !== 'undefined') ? StudioState : null;
    if (!state) return '<div class="alert alert-warning">Estado não inicializado.</div>';

    const versions = state.getVisualVersions(projId, envId, {
      versionType: currentFilterType === 'ALL' ? null : currentFilterType
    });
    const timeline = state.getVisualTimeline(projId, envId);
    const snapshots = state.getVisualSnapshots(projId, envId);
    const activeVerCode = env ? (env.currentVersion || 'V01') : 'V01';

    return `
      <section class="vis-panel-section" id="vis-section-versoes">
        <!-- CABEÇALHO DA SEÇÃO 7 -->
        <div class="vis-section-header">
          <div class="vis-sec-title">
            <i data-lucide="layers"></i>
            <h2>7. Versionamento, Aprovação e Revisão das Imagens</h2>
          </div>
          <div class="vis-sec-actions">
            <span class="vis-sec-tag">Versão Ativa: <strong>${escapeHTML(activeVerCode)}</strong></span>
            <button class="btn btn-primary btn-sm" onclick="VisualVersioningModule.openCreateSnapshotModal('${projId}', '${envId}')">
              <i data-lucide="camera"></i> Criar Visual Snapshot
            </button>
          </div>
        </div>

        <!-- FILTROS POR TIPO DE ARTEFATO (Prompt D08 Item 1) -->
        <div class="ver-type-filter-bar">
          <span class="filter-label"><i data-lucide="filter"></i> Tipo:</span>
          ${renderTypeFilterButton('ALL', 'Todos os Tipos')}
          ${renderTypeFilterButton('RENDER', 'Renders')}
          ${renderTypeFilterButton('CAMERA', 'Câmeras')}
          ${renderTypeFilterButton('HUMANIZED_PLAN', 'Plantas Humanizadas')}
          ${renderTypeFilterButton('HUMANIZED_PERSPECTIVE', 'Perspectivas')}
          ${renderTypeFilterButton('REFERENCE_SET', 'Conjuntos de Referência')}
        </div>

        <!-- GALERIA / GRID DE VERSÕES COM STATUS E AÇÕES (Prompt D08 Itens 2, 3, 4, 6, 7, 14) -->
        <div class="ver-gallery-grid">
          ${versions.length === 0 ? `
            <div class="empty-state-card" style="grid-column: 1 / -1;">
              <p>Nenhuma versão encontrada para este filtro.</p>
            </div>
          ` : versions.map(v => renderVersionCard(v, projId, envId, activeVerCode)).join('')}
        </div>

        <!-- PAINEL DE COMPARAÇÃO LADO A LADO (Prompt D08 Item 8) -->
        ${renderComparisonSection(projId, envId)}

        <!-- TIMELINE CRONOLÓGICA ESTRUTURADA (Prompt D08 Item 9) -->
        <div class="ver-subsections-grid">
          <div class="ver-timeline-card">
            <div class="card-header-clean">
              <div class="title"><i data-lucide="clock"></i> Timeline Visual do Ambiente</div>
              <span class="badge badge-neutral">${timeline.length} eventos</span>
            </div>
            <div class="timeline-vertical-flow">
              ${timeline.map(ev => `
                <div class="timeline-event-row ${ev.status ? 'status-' + ev.status.toLowerCase() : ''}">
                  <span class="time-col">${formatTime(ev.timestamp)}</span>
                  <span class="dot-col"></span>
                  <div class="event-body">
                    <strong>${escapeHTML(ev.label)}</strong>
                    <p class="event-desc">${escapeHTML(ev.description)}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- SNAPSHOTS VISUAIS CONGELADOS (Prompt D08 Item 12) -->
          <div class="ver-snapshots-card">
            <div class="card-header-clean">
              <div class="title"><i data-lucide="archive"></i> Visual Snapshots Homologados</div>
              <span class="badge badge-neutral">${snapshots.length} marcos</span>
            </div>
            <div class="snapshots-list">
              ${snapshots.length === 0 ? `
                <p class="text-muted" style="padding: 1rem;">Nenhum snapshot visual salvo ainda. Use o botão acima para congelar o estado do projeto.</p>
              ` : snapshots.map(s => `
                <div class="snapshot-item-card">
                  <div class="snapshot-header">
                    <strong>${escapeHTML(s.snapshotName)}</strong>
                    <span class="badge badge-outline">${escapeHTML(s.snapshotVersion)}</span>
                  </div>
                  <p class="snapshot-desc">${escapeHTML(s.description || 'Congelamento de estado')}</p>
                  <div class="snapshot-meta">
                    <small><i data-lucide="user"></i> ${escapeHTML(s.createdBy)}</small>
                    <small><i data-lucide="calendar"></i> ${formatDateTime(s.createdAt)}</small>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderTypeFilterButton(typeKey, label) {
    const isActive = currentFilterType === typeKey;
    return `
      <button class="btn btn-xs ${isActive ? 'btn-primary' : 'btn-ghost'}" 
        onclick="VisualVersioningModule.setFilterType('${typeKey}')">
        ${label}
      </button>
    `;
  }

  function renderVersionCard(v, projId, envId, activeVerCode) {
    const statusClasses = {
      'APPROVED': 'badge-success',
      'IN_REVIEW': 'badge-warning',
      'REJECTED': 'badge-error',
      'SUPERSEDED': 'badge-neutral',
      'DRAFT': 'badge-ghost',
      'GENERATING': 'badge-info',
      'ARCHIVED': 'badge-neutral'
    };

    const statusBadge = statusClasses[v.status] || 'badge-neutral';
    const comments = StudioState.getVisualVersionComments ? StudioState.getVisualVersionComments(v.id) : [];

    return `
      <div class="ver-card ${v.status === 'APPROVED' ? 'is-approved' : ''} ${v.status === 'SUPERSEDED' ? 'is-superseded' : ''}">
        <div class="ver-image-wrapper">
          <img src="${v.imageUrl}" alt="${v.versionCode}" loading="lazy" 
            onclick="EnvironmentVisualizationModule.openImageLightbox('${v.imageUrl}', '${v.versionCode} - ${v.versionType}')" />
          <span class="ver-code-badge">${escapeHTML(v.versionCode)}</span>
          <span class="ver-status-badge ${statusBadge}">${escapeHTML(v.status)}</span>
          ${v.isApprovedReference ? `
            <span class="ver-ref-badge" title="APPROVED_VISUAL_REFERENCE: Referência Mestre"><i data-lucide="award"></i> Referência</span>
          ` : ''}
        </div>

        <div class="ver-card-body">
          <div class="ver-card-header">
            <span class="ver-type-label">${escapeHTML(v.versionType)}</span>
            ${typeof VisualQAModule !== 'undefined' ? VisualQAModule.renderQABadgeForVersion(v.id) : ''}
            <small class="ver-date-label">${formatDateTime(v.createdAt)}</small>
          </div>

          ${v.status === 'REJECTED' ? `
            <div class="rejection-box">
              <strong><i data-lucide="alert-triangle"></i> Motivo: ${escapeHTML(v.rejectionReason)}</strong>
              <p>${escapeHTML(v.rejectionNotes || 'Sem observações adicionais')}</p>
            </div>
          ` : ''}

          ${v.status === 'SUPERSEDED' ? `
            <div class="superseded-box">
              <small><i data-lucide="history"></i> Substituída por versão mais recente</small>
            </div>
          ` : ''}

          <!-- AÇÕES DO USUÁRIO (Prompt D08 Itens 4, 6, 8, 14 & D09 QA) -->
          <div class="ver-card-actions">
            ${v.status !== 'APPROVED' ? `
              <button class="btn btn-success btn-xs" onclick="VisualVersioningModule.openApproveModal('${v.id}')">
                <i data-lucide="check"></i> Aprovar
              </button>
            ` : `
              <span class="text-success"><i data-lucide="check-circle"></i> Aprovada</span>
            `}

            ${v.status !== 'REJECTED' && v.status !== 'APPROVED' ? `
              <button class="btn btn-error btn-xs" onclick="VisualVersioningModule.openRejectModal('${v.id}')">
                <i data-lucide="x"></i> Rejeitar
              </button>
            ` : ''}

            <button class="btn btn-outline btn-xs" onclick="VisualVersioningModule.useAsBase('${v.id}')" title="Criar nova versão a partir desta">
              <i data-lucide="copy"></i> Use as Base
            </button>

            <button class="btn btn-ghost btn-xs" onclick="VisualVersioningModule.selectForCompare('${v.id}')" title="Selecionar para comparação">
              <i data-lucide="columns"></i> Comparar
            </button>

            <button class="btn btn-ghost btn-xs" onclick="VisualQAModule.openQAReportModal('${v.id}')" title="Abrir Visual QA Report">
              <i data-lucide="shield-check"></i> QA Report
            </button>
          </div>

          <!-- SEÇÃO DE COMENTÁRIOS DA VERSÃO (Prompt D08 Itens 10 e 11) -->
          <div class="ver-comments-section">
            <div class="ver-comments-header">
              <span><i data-lucide="message-square"></i> Comentários (${comments.length})</span>
              <button class="btn-link btn-xs" onclick="VisualVersioningModule.openAddCommentPrompt('${v.id}')">+ Comentar</button>
            </div>
            ${comments.map(c => `
              <div class="comment-item ${c.convertedToDecision ? 'is-decision' : ''}">
                <div class="comment-author-bar">
                  <strong>${escapeHTML(c.authorName)}</strong>
                  <small>${formatDateTime(c.createdAt)}</small>
                </div>
                <p class="comment-text">"${escapeHTML(c.commentText)}"</p>
                ${c.convertedToDecision ? `
                  <span class="decision-pill"><i data-lucide="check"></i> DESIGN_DECISION Homologada</span>
                ` : `
                  <button class="btn btn-outline btn-xxs" onclick="VisualVersioningModule.convertToDecision('${c.id}')">
                    <i data-lucide="arrow-right-circle"></i> Transformar em Decisão
                  </button>
                `}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function renderComparisonSection(projId, envId) {
    if (!compareVersionId1 || !compareVersionId2) {
      return `
        <div class="ver-compare-placeholder">
          <i data-lucide="split"></i>
          <span>Selecione duas versões clicando em <strong>Comparar</strong> para visualizar o diff lado a lado de imagens, prompt, câmera e locks.</span>
          ${compareVersionId1 ? `
            <span class="badge badge-primary">Versão 1 selecionada: ${escapeHTML(StudioState.getVisualVersion(compareVersionId1)?.versionCode || compareVersionId1)}</span>
            <button class="btn btn-ghost btn-xs" onclick="VisualVersioningModule.clearCompare()">Cancelar</button>
          ` : ''}
        </div>
      `;
    }

    const state = StudioState;
    const comp = state.compareVisualVersions(compareVersionId1, compareVersionId2);
    const v1 = comp.version1;
    const v2 = comp.version2;

    return `
      <div class="ver-compare-panel">
        <div class="compare-header">
          <div class="title"><i data-lucide="git-compare"></i> Comparação Lado a Lado: ${escapeHTML(v1.versionCode)} vs ${escapeHTML(v2.versionCode)}</div>
          <button class="btn btn-ghost btn-xs" onclick="VisualVersioningModule.clearCompare()"><i data-lucide="x"></i> Fechar Comparação</button>
        </div>

        <div class="compare-images-grid">
          <div class="compare-img-col">
            <div class="col-title">${escapeHTML(v1.versionCode)} (${escapeHTML(v1.status)})</div>
            <img src="${v1.imageUrl}" alt="${v1.versionCode}" />
            <div class="col-meta">
              <small>Data: ${formatDateTime(v1.createdAt)}</small>
              <small>Câmera: ${escapeHTML(v1.cameraId || 'Geral')}</small>
            </div>
          </div>
          <div class="compare-img-col">
            <div class="col-title">${escapeHTML(v2.versionCode)} (${escapeHTML(v2.status)})</div>
            <img src="${v2.imageUrl}" alt="${v2.versionCode}" />
            <div class="col-meta">
              <small>Data: ${formatDateTime(v2.createdAt)}</small>
              <small>Câmera: ${escapeHTML(v2.cameraId || 'Geral')}</small>
            </div>
          </div>
        </div>

        <div class="compare-differences-box">
          <strong>Diferenças Detectadas (${comp.differences.length}):</strong>
          ${comp.differences.length === 0 ? `
            <p class="text-muted">Nenhuma divergência estrutural detectada entre os metadados das duas versões.</p>
          ` : `
            <ul>
              ${comp.differences.map(d => `<li>${escapeHTML(d)}</li>`).join('')}
            </ul>
          `}
        </div>
      </div>
    `;
  }

  // --- MÉTODOS DE AÇÃO DO MÓDULO ---

  function setFilterType(type) {
    currentFilterType = type;
    refreshUI();
  }

  function selectForCompare(versionId) {
    if (!compareVersionId1) {
      compareVersionId1 = versionId;
      StudioApp.showToast('Primeira versão selecionada. Agora clique em "Comparar" na segunda versão.');
    } else if (compareVersionId1 === versionId) {
      StudioApp.showToast('Selecione uma versão diferente para comparar.', 'warning');
    } else {
      compareVersionId2 = versionId;
      StudioApp.showToast('Comparação pronta!');
    }
    refreshUI();
  }

  function clearCompare() {
    compareVersionId1 = null;
    compareVersionId2 = null;
    refreshUI();
  }

  function openApproveModal(versionId) {
    const ver = StudioState.getVisualVersion(versionId);
    if (!ver) return;

    const asRef = confirm(`Deseja aprovar a versão ${ver.versionCode}?\n\nPressione OK para aprovar e registrá-la como APPROVED_VISUAL_REFERENCE (Referência Mestre do Ambiente).\nPressione Cancelar para apenas aprovar sem torná-la referência mestre.`);
    
    StudioState.approveVisualVersion(versionId, {
      isApprovedReference: asRef,
      notes: `Homologado em ${new Date().toLocaleDateString('pt-BR')}`
    });

    StudioApp.showToast(`Versão ${ver.versionCode} aprovada com sucesso!`);
    refreshUI();
  }

  function openRejectModal(versionId) {
    const ver = StudioState.getVisualVersion(versionId);
    if (!ver) return;

    const reasons = StudioState.CANONICAL_REJECTION_REASONS || ['MATERIAL', 'ILUMINACAO', 'COMPOSICAO', 'MOBILIARIO', 'GEOMETRIA', 'CAMERA', 'OUTRO'];
    const reasonPrompt = prompt(`Informe o motivo canônico de rejeição da versão ${ver.versionCode}:\n\nOpções: ${reasons.join(', ')}`, 'ILUMINACAO');
    if (!reasonPrompt) return;

    const notes = prompt('Observações detalhadas sobre o que deve ser corrigido:', 'Ajustar intensidade luminosa e acabamento da marcenaria');

    try {
      StudioState.rejectVisualVersion(versionId, reasonPrompt, notes);
      StudioApp.showToast(`Versão ${ver.versionCode} rejeitada. Motivo registrado sem perda de histórico.`);
      refreshUI();
    } catch (e) {
      StudioApp.showToast(e.message, 'error');
    }
  }

  function useAsBase(versionId) {
    try {
      const newVer = StudioState.restoreVisualVersionAsBase(versionId, {
        notes: 'Derivado via "Use as Base" para novo estudo'
      });
      StudioApp.showToast(`Nova versão ${newVer.versionCode} criada com sucesso a partir da base histórica!`);
      refreshUI();
    } catch (e) {
      StudioApp.showToast(e.message, 'error');
    }
  }

  function openAddCommentPrompt(versionId) {
    const text = prompt('Digite seu comentário ou revisão técnica sobre esta imagem:');
    if (!text || !text.trim()) return;

    StudioState.addVisualVersionComment(versionId, text);
    StudioApp.showToast('Comentário registrado!');
    refreshUI();
  }

  function convertToDecision(commentId) {
    const confirmed = confirm('Deseja transformar formalmente este comentário em uma DECISÃO DE PROJETO (DESIGN_DECISION) registrada na memória e protegida por lock?');
    if (!confirmed) return;

    try {
      StudioState.convertCommentToDesignDecision(commentId);
      StudioApp.showToast('Comentário transformado em Decisão de Projeto com sucesso!');
      refreshUI();
    } catch (e) {
      StudioApp.showToast(e.message, 'error');
    }
  }

  function openCreateSnapshotModal(projId, envId) {
    const name = prompt('Nome para o Visual Snapshot:', 'Marco de Homologação Visual');
    if (!name) return;

    const desc = prompt('Descrição detalhada do estado congelado:', 'Congelamento de paleta, locks, câmera e referências aprovadas.');

    try {
      const snap = StudioState.createVisualSnapshot(projId, envId, {
        snapshotName: name,
        description: desc
      });
      StudioApp.showToast(`Snapshot ${snap.snapshotVersion} capturado com sucesso!`);
      refreshUI();
    } catch (e) {
      StudioApp.showToast(e.message, 'error');
    }
  }

  function refreshUI() {
    if (typeof EnvironmentVisualizationModule !== 'undefined' && EnvironmentVisualizationModule.refresh) {
      EnvironmentVisualizationModule.refresh();
    } else if (typeof StudioApp !== 'undefined' && StudioApp.renderCurrentView) {
      StudioApp.renderCurrentView();
    }
  }

  return {
    render,
    setFilterType,
    selectForCompare,
    clearCompare,
    openApproveModal,
    openRejectModal,
    useAsBase,
    openAddCommentPrompt,
    convertToDecision,
    openCreateSnapshotModal,
    refreshUI
  };
})();

if (typeof window !== 'undefined') {
  window.VisualVersioningModule = VisualVersioningModule;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VisualVersioningModule;
}
