/**
 * ============================================================================
 * ARQVERTICE STUDIO — D09: QA VISUAL E VALIDAÇÃO DAS GERAÇÕES
 * ============================================================================
 * Camada de controle de qualidade visual para identificar potenciais desvios,
 * violações de locks, artefatos de IA e registrar o VISUAL QA REPORT.
 * Suporta sobreposição humana consciente via "APPROVE ANYWAY".
 */

const VisualQAModule = (function () {
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

  /**
   * Abre o Modal com o VISUAL QA REPORT de uma versão (Prompt D09 Item 9)
   */
  function openQAReportModal(versionId) {
    const state = (typeof StudioState !== 'undefined') ? StudioState : null;
    if (!state) return;

    const version = state.getVisualVersion(versionId);
    if (!version) return;

    // Executa ou recupera relatório existente (com cache automático)
    const qaResult = state.runVisualQA(versionId);
    const report = qaResult.report;

    let modal = document.getElementById('visual-qa-report-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'visual-qa-report-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    const statusBadges = {
      'PASS': { label: 'CONFORME (PASS)', class: 'badge-success' },
      'WARNING': { label: 'ALERTA (WARNING)', class: 'badge-warning' },
      'REVIEW_REQUIRED': { label: 'REVISÃO OBRIGATÓRIA', class: 'badge-error' },
      'APPROVED_WITH_OVERRIDE': { label: 'APROVADO C/ OVERRIDE', class: 'badge-info' }
    };

    const curBadge = statusBadges[report.overallStatus] || { label: report.overallStatus, class: 'badge-neutral' };

    modal.innerHTML = `
      <div class="modal-dialog modal-qa-report">
        <!-- CABEÇALHO DO RELATÓRIO (Prompt D09 Item 9) -->
        <div class="modal-header">
          <div class="qa-header-info">
            <div class="qa-title-row">
              <i data-lucide="shield-check"></i>
              <h3>VISUAL QA REPORT — ${escapeHTML(version.versionCode)}</h3>
              <span class="badge ${curBadge.class}">${curBadge.label}</span>
            </div>
            <div class="qa-meta-row">
              <small>Ambiente: <strong>${escapeHTML(version.environmentId)}</strong></small>
              <small>Confiança: <strong>${Math.round(report.confidenceScore * 1000) / 10}%</strong> (Análise Híbrida)</small>
              ${qaResult.cached ? '<span class="badge badge-outline badge-xs">Resultado em Cache</span>' : ''}
            </div>
          </div>
          <button class="btn-icon btn-ghost" onclick="VisualQAModule.closeQAReportModal()">
            <i data-lucide="x"></i>
          </button>
        </div>

        <div class="modal-body qa-report-body">
          <!-- PAINEL COMPARATIVO DE IMAGEM -->
          <div class="qa-image-strip">
            <div class="qa-thumb-box">
              <img src="${version.imageUrl}" alt="${version.versionCode}" />
              <span class="qa-thumb-label">Imagem Inspecionada (${escapeHTML(version.versionCode)})</span>
            </div>
            <div class="qa-summary-card">
              <h4>Resumo da Avaliação de Compliance</h4>
              <p>O sistema verificou regras determinísticas de geometria, esquadrias, enquadramento de câmera e elementos bloqueados por lock.</p>
              <div class="qa-metrics-pills">
                <span class="pill"><i data-lucide="lock"></i> Violações de Lock: <strong>${report.lockViolations.length}</strong></span>
                <span class="pill"><i data-lucide="alert-circle"></i> Avisos: <strong>${report.warnings.length}</strong></span>
                <span class="pill"><i data-lucide="check"></i> Checagens OK: <strong>${report.findings.filter(f => f.status === 'PASS').length}</strong></span>
              </div>
            </div>
          </div>

          <!-- VIOLAÇÕES DE LOCKS POTENCIAIS (Prompt D09 Item 3) -->
          ${report.lockViolations.length > 0 ? `
            <div class="qa-alert-box alert-error">
              <div class="alert-title">
                <i data-lucide="alert-octagon"></i>
                <strong>POTENTIAL_LOCK_VIOLATION (${report.lockViolations.length})</strong>
              </div>
              <ul class="qa-violations-list">
                ${report.lockViolations.map(lv => `
                  <li>
                    <strong>[${escapeHTML(lv.check)}]:</strong> ${escapeHTML(lv.description)}
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : ''}

          <!-- AVISOS & ARTEFATOS DE IA (Prompt D09 Item 6) -->
          ${report.warnings.length > 0 ? `
            <div class="qa-alert-box alert-warning">
              <div class="alert-title">
                <i data-lucide="alert-triangle"></i>
                <strong>Avisos e Potenciais Anomalias (${report.warnings.length})</strong>
              </div>
              <ul class="qa-warnings-list">
                ${report.warnings.map(w => `
                  <li>${escapeHTML(w.description || w.category)}</li>
                `).join('')}
              </ul>
            </div>
          ` : ''}

          <!-- TABELA DE CONFORMIDADE DOS ELEMENTOS (Prompt D09 Item 4) -->
          <div class="qa-checks-table-wrapper">
            <h4>Detalhamento das Checagens Técnicas</h4>
            <table class="table table-compact qa-table">
              <thead>
                <tr>
                  <th>Item Inspecionado</th>
                  <th>Status</th>
                  <th>Resultado da Análise Técnica</th>
                </tr>
              </thead>
              <tbody>
                ${report.findings.map(f => `
                  <tr>
                    <td><code>${escapeHTML(f.check)}</code></td>
                    <td><span class="badge badge-xs badge-success"><i data-lucide="check"></i> PASS</span></td>
                    <td>${escapeHTML(f.description)}</td>
                  </tr>
                `).join('')}
                ${report.lockViolations.map(lv => `
                  <tr class="row-violation">
                    <td><code>${escapeHTML(lv.check)}</code></td>
                    <td><span class="badge badge-xs badge-error"><i data-lucide="alert-circle"></i> VIOLATION</span></td>
                    <td class="text-error">${escapeHTML(lv.description)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- SEÇÃO DE REVISÃO HUMANA: APPROVE ANYWAY (Prompt D09 Itens 7 e 8) -->
          <div class="qa-human-review-card ${report.hasHumanReview ? 'is-reviewed' : ''}">
            <div class="review-header">
              <div class="title"><i data-lucide="user-check"></i> Governança e Revisão Humana</div>
              ${report.hasHumanReview ? `
                <span class="badge badge-success"><i data-lucide="check"></i> Revisão Homologada</span>
              ` : `
                <span class="badge badge-neutral">Aguardando Avaliação</span>
              `}
            </div>

            ${report.hasHumanReview ? `
              <div class="reviewed-details">
                <p><strong>Revisor Autorizado:</strong> ${escapeHTML(report.reviewedBy)}</p>
                <p><strong>Data/Hora:</strong> ${formatDateTime(report.reviewedAt)}</p>
                <p><strong>Justificativa Técnica:</strong> <em>"${escapeHTML(report.overrideReason)}"</em></p>
              </div>
            ` : `
              <div class="review-pending-callout">
                <p>Caso o arquiteto considere que as divergências são aceitáveis para o conceito do projeto, é permitido homologar através da ação de sobreposição técnica.</p>
                <button class="btn btn-warning btn-sm" onclick="VisualQAModule.handleApproveAnyway('${report.id}')">
                  <i data-lucide="check-check"></i> APPROVE ANYWAY (Sobreposição Humana)
                </button>
              </div>
            `}
          </div>

          <!-- TELEMETRIA, MODELO E CUSTO (Prompt D09 Itens 10, 11 e 12) -->
          <div class="qa-telemetry-footer">
            <small>Modelo: <code>${escapeHTML(report.analysisModel)}</code></small>
            <small>Provider: <code>${escapeHTML(report.analysisProvider)}</code></small>
            <small>Custo: <strong>US$ ${Number(report.costUsd).toFixed(5)}</strong></small>
            <small>Fingerprint: <code>${escapeHTML(report.versionContentHash)}</code></small>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="VisualQAModule.closeQAReportModal()">Fechar</button>
        </div>
      </div>
    `;

    modal.classList.add('is-open');
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }
  }

  function closeQAReportModal() {
    const modal = document.getElementById('visual-qa-report-modal');
    if (modal) {
      modal.classList.remove('is-open');
    }
  }

  function handleApproveAnyway(reportId) {
    const reviewer = prompt('Informe o nome do arquiteto/líder técnico responsável pela aprovação:', 'Eduardo Marques (Arquiteto Titular)');
    if (!reviewer || !reviewer.trim()) return;

    const reason = prompt('Informe a justificativa técnica para o "Approve Anyway":', 'Divergência aceita após validação de volumetria com o cliente');
    if (!reason || !reason.trim()) return;

    try {
      StudioState.approveAnywayVisualQA(reportId, reviewer, reason);
      StudioApp.showToast('Versão aprovada com sobreposição humana registrada no QA Report!');
      closeQAReportModal();
      if (typeof VisualVersioningModule !== 'undefined' && VisualVersioningModule.refreshUI) {
        VisualVersioningModule.refreshUI();
      } else if (typeof EnvironmentVisualizationModule !== 'undefined' && EnvironmentVisualizationModule.refresh) {
        EnvironmentVisualizationModule.refresh();
      }
    } catch (e) {
      StudioApp.showToast(e.message, 'error');
    }
  }

  /**
   * Renderiza badge de QA para um card de versão
   */
  function renderQABadgeForVersion(versionId) {
    const state = (typeof StudioState !== 'undefined') ? StudioState : null;
    if (!state) return '';

    const report = state.getVisualQAReport(versionId);
    if (!report) {
      return `
        <button class="btn-qa-badge badge-qa-pending" onclick="VisualQAModule.openQAReportModal('${versionId}')" title="Executar / Ver Visual QA">
          <i data-lucide="shield"></i> QA
        </button>
      `;
    }

    const badgeClasses = {
      'PASS': 'badge-qa-pass',
      'WARNING': 'badge-qa-warning',
      'REVIEW_REQUIRED': 'badge-qa-review',
      'APPROVED_WITH_OVERRIDE': 'badge-qa-override'
    };

    const bClass = badgeClasses[report.overallStatus] || 'badge-qa-pending';

    return `
      <button class="btn-qa-badge ${bClass}" onclick="VisualQAModule.openQAReportModal('${versionId}')" title="Visual QA Report: ${report.overallStatus}">
        <i data-lucide="${report.overallStatus === 'PASS' ? 'shield-check' : 'shield-alert'}"></i> QA: ${report.overallStatus}
      </button>
    `;
  }

  return {
    openQAReportModal,
    closeQAReportModal,
    handleApproveAnyway,
    renderQABadgeForVersion
  };
})();

if (typeof window !== 'undefined') {
  window.VisualQAModule = VisualQAModule;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VisualQAModule;
}
