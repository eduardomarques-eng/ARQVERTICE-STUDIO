/**
 * ============================================================================
 * ARQVERTICE STUDIO — MÓDULO ADMINISTRATIVO DE BRIEFING (BriefingAdmin)
 * Gestão de Sessões, Links Seguros, Análise Técnica, Relatórios e Aprovação
 * ============================================================================
 */

const BriefingAdmin = {
  /**
   * Renderiza a visão administrativa do Briefing no Workspace do Projeto (Aba 2)
   */
  renderProjectBriefingView(project, client) {
    const brf = StudioState.getProjectBriefing(project.id);

    if (!brf) {
      return `
        <div class="empty-state-card animate-fade-in">
          <div class="empty-icon-wrap">
            <i data-lucide="clipboard-list"></i>
          </div>
          <h3>Nenhum Briefing Criado para este Projeto</h3>
          <p>Crie uma sessão de briefing para gerar o link exclusivo do cliente e coletar as diretrizes de projeto.</p>
          <button class="btn btn-primary" onclick="BriefingAdmin.openCreateBriefingModal('${project.id}')">
            <i data-lucide="plus"></i>
            <span>Criar Novo Briefing com Link Seguro</span>
          </button>
        </div>
      `;
    }

    const clientUrl = `${window.location.origin}/briefing.html?token=${brf.accessToken}`;
    const statusClasses = {
      'DRAFT': 'status-not-started',
      'SENT': 'status-in-progress',
      'IN_PROGRESS': 'status-in-progress',
      'SUBMITTED': 'status-review',
      'UNDER_REVIEW': 'status-review',
      'REPORT_SENT': 'status-in-progress',
      'REVISION_REQUESTED': 'status-review',
      'APPROVED': 'status-completed'
    };
    const badgeClass = statusClasses[brf.status] || 'status-in-progress';
    const isSubmitted = brf.status === 'SUBMITTED' || brf.status === 'UNDER_REVIEW' || brf.status === 'REPORT_SENT' || brf.status === 'REVISION_REQUESTED' || brf.status === 'APPROVED';

    return `
      <div class="briefing-admin-wrap animate-fade-in">
        <!-- BARRA SUPERIOR DE STATUS E LINK DO CLIENTE (Prompt B01) -->
        <section class="briefing-link-card">
          <div class="link-card-left">
            <div class="briefing-status-row">
              <span class="badge-tag">SESSÃO DE BRIEFING ATIVA</span>
              <span class="badge-status-pill ${badgeClass}">
                <span class="dot"></span>
                <span>${escapeHTML(this.formatStatusLabel(brf.status))}</span>
              </span>
              <span class="version-pill">Versão 0${brf.version || 1}</span>
            </div>
            <h2 class="briefing-title">${escapeHTML(brf.title)}</h2>
            <p class="briefing-sub">Link criptográfico seguro gerado para <strong>${escapeHTML(client.name)}</strong>.</p>
            
            <div class="token-link-box">
              <i data-lucide="link"></i>
              <input type="text" readonly value="${clientUrl}" id="client-token-url-input">
              <button class="btn btn-primary btn-sm" onclick="BriefingAdmin.copyClientLink('${clientUrl}')">
                <i data-lucide="copy"></i> Copiar Link
              </button>
              <a href="${clientUrl}" target="_blank" class="btn btn-outline btn-sm">
                <i data-lucide="external-link"></i> Abrir Portal
              </a>
            </div>
          </div>

          <div class="link-card-actions">
            <button class="btn btn-primary btn-sm" onclick="StudioApp.setProjectTab('briefing-tecnico')" title="Abrir Briefing Técnico Interno da ArqVértice (Bloco C01)">
              <i data-lucide="compass"></i> Briefing Técnico (C01)
            </button>
            <button class="btn btn-secondary btn-sm" onclick="BriefingAdmin.regenerateToken('${brf.id}')" title="Gera um novo token e invalida o anterior">
              <i data-lucide="refresh-cw"></i> Renovar Token
            </button>
            <button class="btn btn-outline btn-sm text-danger" onclick="BriefingAdmin.revokeToken('${brf.id}')">
              <i data-lucide="slash"></i> Revogar Link
            </button>
          </div>
        </section>

        <!-- NAVEGAÇÃO INTERNA DO PAINEL DO BRIEFING (Prompt B04 item 42) -->
        <div class="briefing-tabs-layout">
          <!-- Respostas Consolidadas do Cliente (Dados Brutos Invioláveis) -->
          <div class="briefing-col-left">
            <div class="admin-box">
              <div class="box-header">
                <h3><i data-lucide="user"></i> Dados Fornecidos pelo Cliente</h3>
                <span class="badge-pill">${isSubmitted ? 'Submissão Recebida' : 'Preenchimento Parcial'}</span>
              </div>

              ${!isSubmitted && (!brf.answers || Object.keys(brf.answers).length === 0) ? `
                <div class="empty-hint-text">
                  <p>O cliente ainda não iniciou o preenchimento deste briefing.</p>
                  <p>Envie o link acima para que ele possa responder às perguntas e enviar imagens.</p>
                </div>
              ` : `
                <div class="answers-accordion-list">
                  ${this.renderGroupedAnswersHTML(brf)}
                </div>
              `}
            </div>

            <!-- Galeria de Referências Enviadas pelo Cliente (B03) -->
            <div class="admin-box" style="margin-top: 20px;">
              <div class="box-header">
                <h3><i data-lucide="image"></i> Referências & Arquivos do Cliente (${brf.uploads ? brf.uploads.length : 0})</h3>
              </div>
              <div class="admin-uploads-grid">
                ${!brf.uploads || brf.uploads.length === 0 ? `
                  <p class="empty-hint-text">Nenhuma imagem ou prancha anexada pelo cliente.</p>
                ` : brf.uploads.map(up => `
                  <div class="admin-upload-card" onclick="StudioApp.openLightbox('${up.url}', '${escapeHTML(up.title)}')">
                    <img src="${up.url}" alt="${escapeHTML(up.title)}">
                    <div class="upload-meta-pill">
                      <span class="badge-cat">${escapeHTML(up.category || 'Geral')}</span>
                      ${up.environmentName ? `<span class="badge-env">${escapeHTML(up.environmentName)}</span>` : ''}
                    </div>
                    <span class="upload-label">${escapeHTML(up.title)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Coluna Direita: Análise Técnica, Interpretação ArqVértice e Relatório (B04/B05/B06) -->
          <div class="briefing-col-right">
            <!-- Painel de Interpretação Técnica ArqVértice (Prompt B04 item 40) -->
            <div class="admin-box highlight-box">
              <div class="box-header">
                <h3><i data-lucide="sparkles"></i> Parecer Técnico & Interpretação ArqVértice</h3>
              </div>
              <p class="box-desc">Transformação das vontades do cliente em diretrizes arquitetônicas executivas (inviolabilidade dos dados originais).</p>

              <form onsubmit="BriefingAdmin.saveTechnicalInterpretation(event, '${brf.id}')">
                <div class="form-group">
                  <label class="form-label">Diretrizes Gerais do Escritório</label>
                  <textarea id="briefing-interp-text" class="form-textarea" rows="4" placeholder="Ex: Priorizar ventilação cruzada com materiais duráveis e marcenaria integrada...">${escapeHTML((brf.confirmation && brf.confirmation.technicalInterpretation) || '')}</textarea>
                </div>

                <div class="form-group">
                  <label class="form-label">Impacto Estrutural & Construtivo</label>
                  <input type="text" id="briefing-impact-text" class="form-input" placeholder="Ex: Pé-direito duplo com balanço estrutural no deck" value="${escapeHTML((brf.confirmation && brf.confirmation.architecturalImpact) || '')}">
                </div>

                <div class="form-group">
                  <label class="form-label">Prioridade Técnica do Projeto</label>
                  <select id="briefing-priority-select" class="form-select">
                    <option value="ALTA" ${(brf.confirmation && brf.confirmation.priorityLevel === 'ALTA') ? 'selected' : ''}>Alta Prioridade</option>
                    <option value="MEDIA" ${(brf.confirmation && brf.confirmation.priorityLevel === 'MEDIA') ? 'selected' : ''}>Média</option>
                    <option value="INEGOCIAVEL" ${(brf.confirmation && brf.confirmation.priorityLevel === 'INEGOCIAVEL') ? 'selected' : ''}>Inegociável</option>
                  </select>
                </div>

                <button type="submit" class="btn btn-secondary btn-sm" style="width: 100%;">
                  <i data-lucide="save"></i> Salvar Interpretação Técnica
                </button>
              </form>
            </div>

            <!-- Ações do Relatório de Confirmação (Prompt B05) -->
            <div class="admin-box" style="margin-top: 20px;">
              <div class="box-header">
                <h3><i data-lucide="file-check"></i> Relatório de Confirmação Executivo</h3>
              </div>
              <p class="box-desc">Emita o documento formal consolidado com assinaturas e envie para a aprovação do cliente.</p>

              <div class="report-actions-stack">
                <button class="btn btn-outline" onclick="BriefingAdmin.previewReport('${brf.id}')">
                  <i data-lucide="eye"></i> Visualizar Relatório em Tela
                </button>
                <button class="btn btn-primary" onclick="BriefingAdmin.sendReportToClient('${brf.id}')">
                  <i data-lucide="send"></i> Liberar e Enviar para Confirmação do Cliente
                </button>
              </div>
            </div>

            <!-- Histórico de Revisões e Aprovação (Prompt B06) -->
            <div class="admin-box" style="margin-top: 20px;">
              <div class="box-header">
                <h3><i data-lucide="history"></i> Histórico de Revisões</h3>
              </div>
              ${!brf.revisions || brf.revisions.length === 0 ? `
                <p class="empty-hint-text">Nenhuma solicitação de alteração registrada.</p>
              ` : `
                <div class="revision-log-list">
                  ${brf.revisions.map(rev => `
                    <div class="rev-log-item">
                      <div class="rev-header">
                        <strong>Revisão V0${rev.version}</strong>
                        <span>${formatDateBR(rev.requestedAt)}</span>
                      </div>
                      <p class="rev-note">${escapeHTML(rev.note)}</p>
                      <span class="rev-author">Solicitado por: ${escapeHTML(rev.requestedBy)}</span>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderGroupedAnswersHTML(brf) {
    const ans = brf.answers || {};
    return BRIEFING_SECTIONS.slice(0, 9).map(sec => {
      const secQuestions = BRIEFING_QUESTIONS.filter(q => q.section === sec.id);
      return `
        <div class="answer-section-group">
          <div class="sec-group-header">
            <i data-lucide="${sec.icon}"></i>
            <h4>${sec.title}</h4>
          </div>
          <div class="sec-answers-grid">
            ${secQuestions.map(q => {
              const val = ans[q.code];
              if (!val) return '';
              const formatVal = () => {
                if (Array.isArray(val)) return val.join(', ');
                return escapeHTML(val);
              };
              return `
                <div class="answer-item-row">
                  <span class="q-label">${escapeHTML(q.label)}:</span>
                  <div class="q-val">${formatVal()}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');
  },

  formatStatusLabel(status) {
    const labels = {
      'DRAFT': 'Rascunho Interno',
      'SENT': 'Link Enviado ao Cliente',
      'IN_PROGRESS': 'Em Preenchimento',
      'SUBMITTED': 'Recebido / Aguardando Parecer',
      'UNDER_REVIEW': 'Em Análise Técnica',
      'REPORT_SENT': 'Relatório Enviado para Aprovação',
      'REVISION_REQUESTED': 'Alterações Solicitadas pelo Cliente',
      'APPROVED': 'Homologado / Aprovado',
      'EXPIRED': 'Link Expirado',
      'CANCELLED': 'Cancelado'
    };
    return labels[status] || status;
  },

  copyClientLink(url) {
    navigator.clipboard.writeText(url).then(() => {
      StudioApp.showToast('Link do Briefing copiado para a área de transferência!');
    }).catch(() => {
      prompt('Copie o link seguro do briefing:', url);
    });
  },

  regenerateToken(briefingId) {
    if (!confirm('Deseja renovar o token deste briefing? O link anterior deixará de funcionar imediatamente.')) return;
    const newToken = StudioState.regenerateBriefingToken(briefingId);
    StudioApp.showToast('Novo token criptográfico gerado com sucesso!');
    renderProjectWorkspace();
  },

  revokeToken(briefingId) {
    if (!confirm('Deseja revogar o acesso a este briefing? O cliente não conseguirá mais acessar pelo link.')) return;
    StudioState.revokeBriefingToken(briefingId);
    StudioApp.showToast('Link revogado.');
    renderProjectWorkspace();
  },

  saveTechnicalInterpretation(e, briefingId) {
    if (e) e.preventDefault();
    const interp = document.getElementById('briefing-interp-text').value.trim();
    const impact = document.getElementById('briefing-impact-text').value.trim();
    const priority = document.getElementById('briefing-priority-select').value;

    const brf = StudioState.data.briefings.find(b => b.id === briefingId);
    if (!brf) return;

    brf.confirmation = {
      technicalInterpretation: interp,
      architecturalImpact: impact,
      priorityLevel: priority,
      updatedAt: new Date().toISOString()
    };
    if (brf.status === 'SUBMITTED') {
      brf.status = 'UNDER_REVIEW';
    }

    StudioState.save();
    StudioApp.showToast('Parecer técnico salvo com sucesso!');
    renderProjectWorkspace();
  },

  sendReportToClient(briefingId) {
    const brf = StudioState.data.briefings.find(b => b.id === briefingId);
    if (!brf) return;

    brf.status = 'REPORT_SENT';
    brf.updatedAt = new Date().toISOString();
    StudioState.save();
    StudioApp.showToast('Relatório de Confirmação liberado! O cliente já pode visualizar e aprovar pelo link.');
    renderProjectWorkspace();
  },

  previewReport(briefingId) {
    const brf = StudioState.data.briefings.find(b => b.id === briefingId);
    if (!brf) return;
    const clientUrl = `${window.location.origin}/briefing.html?token=${brf.accessToken}`;
    window.open(clientUrl, '_blank');
  },

  openCreateBriefingModal(projectId) {
    const project = StudioState.data.projects.find(p => p.id === projectId);
    if (!project) return;

    const newBrf = StudioState.createBriefing({
      projectId: project.id,
      clientId: project.clientId,
      title: `Briefing Executivo — ${project.name}`,
      projectType: project.typology || 'Residencial Unifamiliar',
      status: 'SENT'
    });

    StudioApp.showToast('Briefing criado e link gerado com sucesso!');
    renderProjectWorkspace();
  }
};

window.BriefingAdmin = BriefingAdmin;
