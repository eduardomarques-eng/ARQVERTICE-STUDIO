/**
 * ArqVértice Studio — Bloco F12: Sistema de Controle Formal de Revisões (Revision System)
 * Gerencia a timeline histórica, imutabilidade de versões aprovadas, comparação visual em 7 dimensões
 * e restauração não-destrutiva de versões anteriores.
 */

const RevisionSystemModule = {
  currentProjectId: null,
  activeRevisionId: null,
  comparisonRevAId: null,
  comparisonRevBId: null,

  init() {
    console.log('RevisionSystemModule inicializado.');
  },

  open(projectId = null) {
    const pId = projectId || (typeof StudioState !== 'undefined' && StudioState.currentProject ? StudioState.currentProject.id : 'prj-praia-01');
    this.currentProjectId = pId;
    this.renderModal();
  },

  getStatusBadge(status) {
    switch (status) {
      case 'draft':
        return '<span class="rev-badge rev-badge-draft"><i class="fas fa-pencil-alt"></i> RASCUNHO</span>';
      case 'review':
        return '<span class="rev-badge rev-badge-review"><i class="fas fa-eye"></i> EM REVISÃO</span>';
      case 'approved':
        return '<span class="rev-badge rev-badge-approved"><i class="fas fa-check-shield"></i> APROVADO</span>';
      case 'superseded':
        return '<span class="rev-badge rev-badge-superseded"><i class="fas fa-history"></i> SUBSTITUÍDO</span>';
      case 'archived':
        return '<span class="rev-badge rev-badge-archived"><i class="fas fa-archive"></i> ARQUIVADO</span>';
      default:
        return `<span class="rev-badge">${status}</span>`;
    }
  },

  renderModal() {
    let existing = document.getElementById('revision-system-modal');
    if (existing) existing.remove();

    if (!window.StudioState) return;
    const project = StudioState.getProject(this.currentProjectId);
    const history = StudioState.getRevisionHistory(this.currentProjectId);

    const modal = document.createElement('div');
    modal.id = 'revision-system-modal';
    modal.className = 'studio-modal-backdrop active';
    modal.innerHTML = `
      <div class="studio-modal-card" style="max-width: 1040px; width: 95vw; max-height: 90vh; display: flex; flex-direction: column;">
        <!-- Cabeçalho -->
        <div class="studio-modal-header" style="display: flex; justify-content: space-between; align-items: center; padding: 18px 24px; border-bottom: 1px solid var(--border-color, #333);">
          <div>
            <h3 style="margin: 0; display: flex; align-items: center; gap: 10px; font-size: 1.25rem;">
              <i class="fas fa-code-branch" style="color: var(--accent-color, #e0a96d);"></i>
              Controle Formal de Revisões &amp; Timeline
            </h3>
            <span style="font-size: 0.85rem; color: #888;">
              Projeto: <strong>${project ? project.name : this.currentProjectId}</strong> &bull; Revisão Atual: <strong>${project?.revision || 'REV00'}</strong>
            </span>
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <button class="studio-btn studio-btn-primary" onclick="RevisionSystemModule.openCreateRevisionModal()" style="font-size: 0.85rem; padding: 8px 16px;">
              <i class="fas fa-plus"></i> Nova Revisão
            </button>
            <button class="studio-btn-icon" onclick="RevisionSystemModule.closeModal()" style="background: none; border: none; color: #ccc; cursor: pointer; font-size: 1.2rem;">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <!-- Conteúdo Principal: Duas Colunas (Timeline à esquerda, Detalhes/Comparação à direita) -->
        <div style="display: grid; grid-template-columns: 360px 1fr; flex: 1; overflow: hidden;">
          <!-- Coluna 1: Timeline de Revisões -->
          <div style="border-right: 1px solid var(--border-color, #333); overflow-y: auto; padding: 18px; background: rgba(0,0,0,0.15);">
            <div style="font-size: 0.8rem; font-weight: bold; text-transform: uppercase; color: #aaa; margin-bottom: 14px; letter-spacing: 0.05em;">
              Linha do Tempo de Revisões (${history.length})
            </div>

            ${history.length === 0 ? `
              <div style="text-align: center; padding: 30px 10px; color: #777;">
                <p>Nenhuma revisão formal registrada ainda.</p>
                <button class="studio-btn studio-btn-secondary" onclick="RevisionSystemModule.openCreateRevisionModal()" style="font-size: 0.8rem;">
                  Iniciar REV00
                </button>
              </div>
            ` : history.map((rev, idx) => `
              <div class="rev-timeline-item ${this.activeRevisionId === rev.id ? 'active' : ''}" onclick="RevisionSystemModule.selectRevision('${rev.id}')" style="cursor: pointer; padding: 12px; margin-bottom: 10px; border-radius: 6px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); transition: all 0.15s ease;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <strong style="font-size: 1rem; color: #eee; display: flex; align-items: center; gap: 6px;">
                    <i class="fas fa-tag" style="font-size: 0.8rem; color: var(--accent-color, #e0a96d);"></i>
                    ${rev.revisionNumber}
                  </strong>
                  ${this.getStatusBadge(rev.status)}
                </div>
                <div style="font-size: 0.8rem; color: #ccc; margin-bottom: 6px; line-height: 1.3;">
                  ${rev.description}
                </div>
                <div style="font-size: 0.72rem; color: #777; display: flex; justify-content: space-between;">
                  <span><i class="fas fa-user"></i> ${rev.author}</span>
                  <span><i class="fas fa-clock"></i> ${rev.formattedDate}</span>
                </div>
                ${rev.restoredFrom ? `
                  <div style="font-size: 0.7rem; color: #38bdf8; margin-top: 4px;">
                    <i class="fas fa-undo"></i> Restaurado de ${rev.restoredFrom}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>

          <!-- Coluna 2: Detalhes, Ações e Comparador Diff -->
          <div id="rev-details-pane" style="overflow-y: auto; padding: 24px;">
            ${this.renderDetailsPaneContent()}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    if (history.length > 0 && !this.activeRevisionId) {
      this.selectRevision(history[history.length - 1].id);
    }
  },

  selectRevision(revId) {
    this.activeRevisionId = revId;
    const pane = document.getElementById('rev-details-pane');
    if (pane) {
      pane.innerHTML = this.renderDetailsPaneContent();
    }
    // Atualiza seleção visual na timeline
    document.querySelectorAll('.rev-timeline-item').forEach(el => el.classList.remove('active'));
    const clicked = Array.from(document.querySelectorAll('.rev-timeline-item')).find(el => el.getAttribute('onclick')?.includes(revId));
    if (clicked) clicked.classList.add('active');
  },

  renderDetailsPaneContent() {
    if (!this.activeRevisionId) {
      return `<div style="text-align: center; padding: 60px 20px; color: #777;">Selecione uma revisão para visualizar os detalhes.</div>`;
    }

    const rev = StudioState.getRevision(this.activeRevisionId);
    if (!rev) return `<div style="color: #ef4444;">Revisão não encontrada.</div>`;

    const allRevs = StudioState.getProjectRevisions(this.currentProjectId);
    const otherRevs = allRevs.filter(r => r.id !== rev.id);

    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
          <div>
            <h4 style="margin: 0 0 6px 0; font-size: 1.4rem; display: flex; align-items: center; gap: 10px;">
              ${rev.revisionNumber}
              ${this.getStatusBadge(rev.status)}
            </h4>
            <div style="color: #aaa; font-size: 0.85rem;">
              Criado em: <strong>${new Date(rev.date).toLocaleString('pt-BR')}</strong> por <strong>${rev.author}</strong>
            </div>
            ${rev.parentRevisionId ? `
              <div style="font-size: 0.8rem; color: #888; margin-top: 4px;">
                Ancestral direto: <strong>${StudioState.getRevision(rev.parentRevisionId)?.revisionNumber || rev.parentRevisionId}</strong>
              </div>
            ` : '<div style="font-size: 0.8rem; color: #22c55e; margin-top: 4px;">Marco Inicial do Projeto</div>'}
          </div>

          <div style="display: flex; gap: 10px;">
            ${rev.status !== 'approved' ? `
              <button class="studio-btn studio-btn-primary" onclick="RevisionSystemModule.handleApprove('${rev.id}')" style="font-size: 0.85rem; padding: 8px 14px;">
                <i class="fas fa-check-shield"></i> Homologar &amp; Proteger
              </button>
            ` : `
              <span style="font-size: 0.8rem; color: #22c55e; display: flex; align-items: center; gap: 6px; background: rgba(34,197,94,0.1); padding: 6px 12px; border-radius: 4px; border: 1px solid rgba(34,197,94,0.3);">
                <i class="fas fa-lock"></i> Revisão Aprovada &bull; Protegida contra alteração
              </span>
            `}

            <button class="studio-btn studio-btn-secondary" onclick="RevisionSystemModule.handleRestore('${rev.id}')" style="font-size: 0.85rem; padding: 8px 14px;">
              <i class="fas fa-undo"></i> Restaurar Snapshot
            </button>
          </div>
        </div>

        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 14px 18px; margin-bottom: 24px;">
          <div style="font-size: 0.75rem; text-transform: uppercase; color: #888; margin-bottom: 4px;">Descrição / Escopo da Revisão</div>
          <div style="font-size: 0.95rem; color: #eee;">${rev.description}</div>
        </div>

        <!-- Seção de Comparação Diff com Outra Revisão -->
        <div style="border-top: 1px solid var(--border-color, #333); padding-top: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <h5 style="margin: 0; font-size: 1rem; display: flex; align-items: center; gap: 8px;">
              <i class="fas fa-columns" style="color: var(--accent-color, #e0a96d);"></i>
              Comparar com Outra Versão (Diff nas 7 Dimensões)
            </h5>
            
            ${otherRevs.length > 0 ? `
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 0.8rem; color: #aaa;">Comparar com:</span>
                <select id="qa-compare-target-select" onchange="RevisionSystemModule.runComparison('${rev.id}', this.value)" style="background: #222; border: 1px solid #444; color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 0.85rem;">
                  <option value="">Selecione...</option>
                  ${otherRevs.map(r => `<option value="${r.id}">${r.revisionNumber} (${r.status})</option>`).join('')}
                </select>
              </div>
            ` : '<span style="font-size: 0.8rem; color: #777;">Sem outras versões para comparação.</span>'}
          </div>

          <div id="qa-diff-results-area">
            ${this.renderInitialChangesSummary(rev)}
          </div>
        </div>
      </div>
    `;
  },

  renderInitialChangesSummary(rev) {
    if (!rev.changes || rev.changes.isInitial) {
      return `
        <div style="background: rgba(0,0,0,0.2); padding: 16px; border-radius: 6px; color: #aaa; font-size: 0.85rem;">
          <i class="fas fa-flag-checkered" style="color: var(--accent-color, #e0a96d);"></i>
          Esta é a revisão inicial (REV00). Contém todos os elementos base homologados.
        </div>
      `;
    }

    const categories = ['imagem', 'texto', 'posicao', 'escala', 'material', 'mobiliario', 'ambiente'];
    return `
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px;">
        ${categories.map(cat => {
          const count = Array.isArray(rev.changes[cat]) ? rev.changes[cat].length : 0;
          return `
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 10px; border-radius: 6px; text-align: center;">
              <div style="font-size: 1.2rem; font-weight: bold; color: ${count > 0 ? 'var(--accent-color, #e0a96d)' : '#666'};">${count}</div>
              <div style="font-size: 0.72rem; text-transform: uppercase; color: #888;">${cat}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  runComparison(revIdA, revIdB) {
    if (!revIdB) return;
    const diff = StudioState.compareRevisions(revIdA, revIdB);
    const container = document.getElementById('qa-diff-results-area');
    if (!container) return;

    const cats = ['imagem', 'texto', 'posicao', 'escala', 'material', 'mobiliario', 'ambiente'];

    container.innerHTML = `
      <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 16px; margin-top: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
          <strong style="font-size: 0.95rem; color: #eee;">
            Relatório de Alterações: ${diff.revA.revisionNumber} &rarr; ${diff.revB.revisionNumber}
          </strong>
          <span style="font-size: 0.85rem; color: var(--accent-color, #e0a96d); font-weight: bold;">
            ${diff.totalChanges} alterações detectadas
          </span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-bottom: 14px;">
          ${cats.map(c => `
            <div style="background: rgba(255,255,255,0.03); padding: 6px; border-radius: 4px; text-align: center;">
              <div style="font-size: 1rem; font-weight: bold; color: ${diff.summary[c] > 0 ? '#38bdf8' : '#666'};">${diff.summary[c]}</div>
              <div style="font-size: 0.68rem; text-transform: uppercase; color: #888;">${c}</div>
            </div>
          `).join('')}
        </div>

        <div style="max-height: 240px; overflow-y: auto; font-size: 0.82rem;">
          ${cats.map(c => {
            const list = diff.changes[c] || [];
            if (list.length === 0) return '';
            return `
              <div style="margin-bottom: 10px;">
                <strong style="text-transform: uppercase; color: #aaa; font-size: 0.75rem;">${c} (${list.length})</strong>
                ${list.map(item => `
                  <div style="padding: 4px 8px; margin-top: 4px; background: rgba(255,255,255,0.02); border-left: 2px solid #38bdf8;">
                    ${item.description || item.sheet || item.item || item.action}
                  </div>
                `).join('')}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  openCreateRevisionModal() {
    const project = StudioState.getProject(this.currentProjectId);
    const history = StudioState.getRevisionHistory(this.currentProjectId);
    const lastRev = history[history.length - 1];

    let nextNumber = 'REV00';
    if (lastRev) {
      const match = (lastRev.revisionNumber || '').match(/(\d+)$/);
      nextNumber = `REV${String(match ? parseInt(match[1], 10) + 1 : history.length).padStart(2, '0')}`;
    }

    const desc = prompt(`Criar Nova Revisão (${nextNumber})\n\nInforme a descrição das alterações ou escopo da revisão:`, `Adequações técnicas e atualização visual.`);
    if (desc === null) return;

    try {
      const newRev = StudioState.createRevision(this.currentProjectId, {
        revisionNumber: nextNumber,
        description: desc,
        author: 'Arquiteto Responsável'
      });
      alert(`✅ Revisão ${newRev.revisionNumber} criada com sucesso!`);
      this.open(this.currentProjectId);
    } catch (err) {
      alert(`Erro ao criar revisão: ${err.message}`);
    }
  },

  handleApprove(revId) {
    const rev = StudioState.getRevision(revId);
    if (!rev) return;

    if (!confirm(`Deseja homologar formalmente a revisão ${rev.revisionNumber}?\n\nApós a homologação, esta versão será protegida contra alteração direta.`)) {
      return;
    }

    try {
      StudioState.approveRevision(revId, 'Eduardo Marques', 'Revisão homologada para apresentação executiva.');
      alert(`✅ Revisão ${rev.revisionNumber} homologada e protegida com sucesso!`);
      this.open(this.currentProjectId);
    } catch (err) {
      alert(`Erro ao aprovar revisão: ${err.message}`);
    }
  },

  handleRestore(revId) {
    const rev = StudioState.getRevision(revId);
    if (!rev) return;

    if (!confirm(`Deseja restaurar o snapshot da revisão ${rev.revisionNumber}?\n\nEsta operação NÃO destruirá o histórico existente: uma nova revisão será criada baseada nesta.`)) {
      return;
    }

    try {
      const restored = StudioState.restoreRevision(revId, 'Arquiteto Responsável', `Restaurado a partir de ${rev.revisionNumber}.`);
      alert(`✅ Versão anterior restaurada com sucesso como ${restored.revisionNumber} sem perda de histórico!`);
      this.open(this.currentProjectId);
    } catch (err) {
      alert(`Erro na restauração: ${err.message}`);
    }
  },

  closeModal() {
    const m = document.getElementById('revision-system-modal');
    if (m) m.remove();
  }
};

if (typeof window !== 'undefined') {
  window.RevisionSystemModule = RevisionSystemModule;
}
