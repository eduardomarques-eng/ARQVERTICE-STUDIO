/**
 * ArqVértice Studio — Bloco F11: Sistema de Controle de Qualidade da Apresentação (Presentation QA Engine)
 * Responsável pela auditoria dos 20 pontos de validação pré-entrega e bloqueio categórico de erros fatais.
 */

const PresentationQAModule = {
  currentProjectId: null,
  currentReport: null,
  currentFilter: 'ALL',
  warningsConfirmed: false,

  init() {
    console.log('PresentationQAModule inicializado.');
  },

  open(projectId = null) {
    const pId = projectId || (typeof StudioState !== 'undefined' && StudioState.currentProject ? StudioState.currentProject.id : 'prj-praia-01');
    this.currentProjectId = pId;
    this.currentFilter = 'ALL';
    this.warningsConfirmed = false;
    this.runAuditAndRender();
  },

  runAuditAndRender() {
    if (!window.StudioState) return;
    try {
      this.currentReport = StudioState.runPresentationQA(this.currentProjectId);
      this.renderModal();
    } catch (err) {
      alert(`Erro ao executar auditoria QA: ${err.message}`);
    }
  },

  setFilter(filter) {
    this.currentFilter = filter;
    this.renderChecklistItems();
  },

  toggleWarningConfirmation(checked) {
    this.warningsConfirmed = checked;
    const btn = document.getElementById('qa-btn-finalize-delivery');
    if (btn) {
      btn.disabled = !this.canFinalize();
    }
  },

  canFinalize() {
    if (!this.currentReport) return false;
    if (this.currentReport.hasBlockingErrors || this.currentReport.hasErrors) return false;
    if (this.currentReport.requiresWarningConfirmation && !this.warningsConfirmed) return false;
    return true;
  },

  handleFinalizeDelivery() {
    if (!this.canFinalize()) return;
    try {
      const result = StudioState.finalizeDelivery(this.currentProjectId, {
        confirmWarnings: this.warningsConfirmed,
        user: 'Arquiteto Responsável',
        warningNotes: this.warningsConfirmed ? 'Avisos técnicos revisados e autorizados pelo arquiteto.' : null
      });

      alert(`✅ Entrega finalizada com sucesso!\nRevisão: ${result.deliveryRecord.revisao}\nData: ${result.deliveryRecord.finalizedAt}`);
      this.closeModal();
      if (window.App && typeof App.renderActiveTab === 'function') {
        App.renderActiveTab();
      }
    } catch (err) {
      alert(`Falha na finalização da entrega: ${err.message}`);
    }
  },

  getSeverityBadge(status) {
    switch (status) {
      case 'PASS':
        return '<span class="qa-badge qa-badge-pass"><i class="fas fa-check-circle"></i> PASS</span>';
      case 'WARNING':
        return '<span class="qa-badge qa-badge-warning"><i class="fas fa-exclamation-triangle"></i> WARNING</span>';
      case 'ERROR':
        return '<span class="qa-badge qa-badge-error"><i class="fas fa-times-circle"></i> ERROR</span>';
      case 'BLOCKED':
        return '<span class="qa-badge qa-badge-blocked"><i class="fas fa-lock"></i> BLOCKED</span>';
      default:
        return `<span class="qa-badge">${status}</span>`;
    }
  },

  renderModal() {
    let existing = document.getElementById('presentation-qa-modal');
    if (existing) existing.remove();

    const rep = this.currentReport;
    const counts = rep.counts;

    const modal = document.createElement('div');
    modal.id = 'presentation-qa-modal';
    modal.className = 'studio-modal-backdrop active';
    modal.innerHTML = `
      <div class="studio-modal-card qa-modal-card" style="max-width: 960px; width: 95vw; max-height: 90vh; display: flex; flex-direction: column;">
        <!-- Cabeçalho -->
        <div class="studio-modal-header" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid var(--border-color, #333);">
          <div>
            <h3 style="margin: 0; display: flex; align-items: center; gap: 10px; font-size: 1.25rem;">
              <i class="fas fa-clipboard-check" style="color: var(--accent-color, #e0a96d);"></i>
              Controle de Qualidade da Apresentação (QA)
            </h3>
            <span style="font-size: 0.85rem; color: #888;">
              ${rep.projectName} &bull; Revisão: <strong>${rep.revisao}</strong> &bull; Data: ${rep.formattedDate}
            </span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            ${this.getSeverityBadge(rep.overallStatus)}
            <button class="studio-btn-icon" onclick="PresentationQAModule.closeModal()" style="background: none; border: none; color: #ccc; cursor: pointer; font-size: 1.2rem;">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <!-- Estatísticas e Filtros -->
        <div style="padding: 16px 24px; background: rgba(0,0,0,0.15); border-bottom: 1px solid var(--border-color, #333);">
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px;">
            <div class="qa-stat-card" style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); padding: 10px 14px; border-radius: 6px; text-align: center;">
              <div style="font-size: 1.4rem; font-weight: bold; color: #22c55e;">${counts.PASS}</div>
              <div style="font-size: 0.75rem; text-transform: uppercase; color: #888;">Aprovados (PASS)</div>
            </div>
            <div class="qa-stat-card" style="background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.3); padding: 10px 14px; border-radius: 6px; text-align: center;">
              <div style="font-size: 1.4rem; font-weight: bold; color: #eab308;">${counts.WARNING}</div>
              <div style="font-size: 0.75rem; text-transform: uppercase; color: #888;">Avisos (WARNING)</div>
            </div>
            <div class="qa-stat-card" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 10px 14px; border-radius: 6px; text-align: center;">
              <div style="font-size: 1.4rem; font-weight: bold; color: #ef4444;">${counts.ERROR}</div>
              <div style="font-size: 0.75rem; text-transform: uppercase; color: #888;">Erros (ERROR)</div>
            </div>
            <div class="qa-stat-card" style="background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.3); padding: 10px 14px; border-radius: 6px; text-align: center;">
              <div style="font-size: 1.4rem; font-weight: bold; color: #c084fc;">${counts.BLOCKED}</div>
              <div style="font-size: 0.75rem; text-transform: uppercase; color: #888;">Bloqueios (BLOCKED)</div>
            </div>
          </div>

          <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
            <span style="font-size: 0.8rem; color: #aaa; margin-right: 4px;">Filtrar:</span>
            <button class="qa-filter-btn ${this.currentFilter === 'ALL' ? 'active' : ''}" onclick="PresentationQAModule.setFilter('ALL')">Todos (${counts.total})</button>
            <button class="qa-filter-btn ${this.currentFilter === 'BLOCKED' ? 'active' : ''}" onclick="PresentationQAModule.setFilter('BLOCKED')">Bloqueios (${counts.BLOCKED})</button>
            <button class="qa-filter-btn ${this.currentFilter === 'ERROR' ? 'active' : ''}" onclick="PresentationQAModule.setFilter('ERROR')">Erros (${counts.ERROR})</button>
            <button class="qa-filter-btn ${this.currentFilter === 'WARNING' ? 'active' : ''}" onclick="PresentationQAModule.setFilter('WARNING')">Avisos (${counts.WARNING})</button>
            <button class="qa-filter-btn ${this.currentFilter === 'PASS' ? 'active' : ''}" onclick="PresentationQAModule.setFilter('PASS')">Aprovados (${counts.PASS})</button>
          </div>
        </div>

        <!-- Lista dos 20 Checkpoints -->
        <div id="qa-checkpoints-list" style="flex: 1; overflow-y: auto; padding: 16px 24px;">
          <!-- Renderizado dinamicamente -->
        </div>

        <!-- Rodapé e Ação de Finalizar Entrega -->
        <div style="padding: 16px 24px; border-top: 1px solid var(--border-color, #333); background: rgba(0,0,0,0.25); display: flex; flex-direction: column; gap: 12px;">
          ${this.renderFooterActionContent()}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.renderChecklistItems();
  },

  renderChecklistItems() {
    const container = document.getElementById('qa-checkpoints-list');
    if (!container || !this.currentReport) return;

    let items = this.currentReport.checkpoints;
    if (this.currentFilter !== 'ALL') {
      items = items.filter(c => c.status === this.currentFilter);
    }

    if (items.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: #888;">
          <i class="fas fa-check-double" style="font-size: 2rem; margin-bottom: 12px; color: #22c55e;"></i>
          <p>Nenhum item com a severidade selecionada (${this.currentFilter}).</p>
        </div>
      `;
      return;
    }

    container.innerHTML = items.map(c => `
      <div class="qa-checkpoint-card qa-card-${c.status.toLowerCase()}" style="display: flex; gap: 16px; padding: 14px 18px; margin-bottom: 10px; border-radius: 6px; background: rgba(255,255,255,0.03); border-left: 4px solid ${this.getStatusColor(c.status)};">
        <div style="font-size: 1.1rem; font-weight: bold; width: 28px; color: #777;">
          #${c.number}
        </div>
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="font-size: 0.95rem; color: #eee;">${c.name}</strong>
            ${this.getSeverityBadge(c.status)}
          </div>
          <div style="font-size: 0.85rem; color: #ccc; margin-bottom: 4px;">
            ${c.message}
          </div>
          <div style="font-size: 0.75rem; color: #777;">
            ${c.description}
          </div>
        </div>
      </div>
    `).join('');
  },

  getStatusColor(status) {
    switch (status) {
      case 'PASS': return '#22c55e';
      case 'WARNING': return '#eab308';
      case 'ERROR': return '#ef4444';
      case 'BLOCKED': return '#c084fc';
      default: return '#888';
    }
  },

  renderFooterActionContent() {
    const rep = this.currentReport;

    if (rep.hasBlockingErrors) {
      return `
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="color: #c084fc; font-size: 0.85rem; display: flex; align-items: center; gap: 8px;">
            <i class="fas fa-lock" style="font-size: 1.1rem;"></i>
            <span><strong>Entrega Bloqueada:</strong> Existem ${rep.counts.BLOCKED} pendência(s) impeditiva(s) que violam as regras da apresentação.</span>
          </div>
          <button id="qa-btn-finalize-delivery" class="studio-btn" disabled style="opacity: 0.5; cursor: not-allowed; padding: 10px 20px; font-weight: bold;">
            <i class="fas fa-ban"></i> Finalizar Entrega Bloqueada
          </button>
        </div>
      `;
    }

    if (rep.hasErrors) {
      return `
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="color: #ef4444; font-size: 0.85rem; display: flex; align-items: center; gap: 8px;">
            <i class="fas fa-times-circle" style="font-size: 1.1rem;"></i>
            <span><strong>Erros na Apresentação:</strong> Existem ${rep.counts.ERROR} erro(s) pendente(s) de saneamento.</span>
          </div>
          <button id="qa-btn-finalize-delivery" class="studio-btn" disabled style="opacity: 0.5; cursor: not-allowed; padding: 10px 20px; font-weight: bold;">
            <i class="fas fa-times"></i> Corrigir Erros Antes de Emitir
          </button>
        </div>
      `;
    }

    if (rep.requiresWarningConfirmation) {
      return `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; color: #eab308; font-size: 0.85rem; background: rgba(234, 179, 8, 0.1); padding: 10px 14px; border-radius: 6px; border: 1px solid rgba(234, 179, 8, 0.3);">
            <input type="checkbox" onchange="PresentationQAModule.toggleWarningConfirmation(this.checked)" ${this.warningsConfirmed ? 'checked' : ''} style="cursor: pointer; width: 16px; height: 16px;">
            <span>Estou ciente dos <strong>${rep.counts.WARNING} avisos técnicos (WARNING)</strong> assinalados e autorizo formalmente a entrega final.</span>
          </label>
          <div style="display: flex; justify-content: flex-end; gap: 12px;">
            <button class="studio-btn studio-btn-secondary" onclick="PresentationQAModule.closeModal()">Revisar Apresentação</button>
            <button id="qa-btn-finalize-delivery" class="studio-btn studio-btn-primary" ${this.canFinalize() ? '' : 'disabled'} onclick="PresentationQAModule.handleFinalizeDelivery()" style="padding: 10px 22px; font-weight: bold;">
              <i class="fas fa-file-signature"></i> Autorizar e Finalizar Entrega
            </button>
          </div>
        </div>
      `;
    }

    return `
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div style="color: #22c55e; font-size: 0.9rem; display: flex; align-items: center; gap: 8px;">
          <i class="fas fa-shield-alt" style="font-size: 1.2rem;"></i>
          <span><strong>Qualidade 100% Aprovada:</strong> Todos os 20 pontos de auditoria em total conformidade.</span>
        </div>
        <div style="display: flex; gap: 12px;">
          <button class="studio-btn studio-btn-secondary" onclick="PresentationQAModule.closeModal()">Fechar</button>
          <button id="qa-btn-finalize-delivery" class="studio-btn studio-btn-primary" onclick="PresentationQAModule.handleFinalizeDelivery()" style="padding: 10px 24px; font-weight: bold;">
            <i class="fas fa-check"></i> Finalizar Entrega Oficial
          </button>
        </div>
      </div>
    `;
  },

  closeModal() {
    const m = document.getElementById('presentation-qa-modal');
    if (m) m.remove();
  }
};

if (typeof window !== 'undefined') {
  window.PresentationQAModule = PresentationQAModule;
}
