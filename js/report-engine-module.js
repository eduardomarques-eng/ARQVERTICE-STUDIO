/**
 * ============================================================================
 * ARQVERTICE STUDIO — BLOCO F09: GERADOR DE RELATÓRIO DO STUDIO
 * 
 * Compilador visual e estrutural do relatório oficial do projeto com:
 * - 21 seções canônicas modulares
 * - Inclusão condicional (não obriga todas as seções)
 * - Dados reais sem duplicação manual
 * - Apenas imagens aprovadas e autorizadas com rastreabilidade (origem + versão)
 * - Sumário automático e paginação dinâmica
 * - Cabeçalho, rodapé de identidade ArqVértice e carimbo F05
 * - Controle de status: rascunho, revisão, aprovado, final
 * ============================================================================
 */

const ReportEngineModule = (function () {
  'use strict';

  let currentProjectId = null;
  let activeReport = null;
  let selectedSections = []; // array of section IDs
  let currentStatus = 'rascunho';
  let currentRevision = 'REV 00';
  let activePageIdx = 0;
  let viewMode = 'preview'; // 'config' | 'preview' | 'print'

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function init(projectId) {
    currentProjectId = projectId || (StudioState.data?.selectedProjectId || 'prj-praia-01');
    selectedSections = StudioState.REPORT_CANONICAL_SECTIONS.map(s => s.id);
    generateReport();
  }

  function toggleSection(sectionId) {
    const idx = selectedSections.indexOf(sectionId);
    if (idx >= 0) {
      selectedSections.splice(idx, 1);
    } else {
      selectedSections.push(sectionId);
    }
    generateReport();
  }

  function selectAllSections() {
    selectedSections = StudioState.REPORT_CANONICAL_SECTIONS.map(s => s.id);
    generateReport();
  }

  function clearAllSections() {
    selectedSections = ['capa', 'dados_projeto'];
    generateReport();
  }

  function setStatus(status) {
    if (StudioState.REPORT_STATUSES.includes(status)) {
      currentStatus = status;
      generateReport();
    }
  }

  function setRevision(rev) {
    currentRevision = rev || 'REV 00';
    generateReport();
  }

  function generateReport() {
    if (!currentProjectId) return;
    activeReport = StudioState.compileProjectReport(currentProjectId, {
      selectedSections,
      status: currentStatus,
      revision: currentRevision
    });
    if (activePageIdx >= activeReport.pages.length) {
      activePageIdx = 0;
    }
    renderUI();
  }

  function setPage(idx) {
    if (activeReport && idx >= 0 && idx < activeReport.pages.length) {
      activePageIdx = idx;
      renderUI();
    }
  }

  function render(containerId, projectId) {
    currentProjectId = projectId || currentProjectId;
    init(currentProjectId);
  }

  function renderUI() {
    const container = document.getElementById('report-engine-root') || document.getElementById('main-content');
    if (!container || !activeReport) return;

    const project = StudioState.getProject(currentProjectId);
    const brand = StudioState.getActiveBrandProfile(currentProjectId);

    container.innerHTML = `
      <div class="report-engine-container" style="display: flex; flex-direction: column; gap: 20px; padding: 24px; max-width: 1400px; margin: 0 auto;">
        <!-- Top Controls Bar -->
        <header class="report-top-bar" style="display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 16px 20px; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #0f172a;">Gerador de Relatório do Projeto</h2>
              <span class="badge ${getStatusBadgeClass(activeReport.status)}" style="padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase;">
                ${escapeHTML(StudioState.REPORT_STATUS_LABELS[activeReport.status] || activeReport.status)}
              </span>
              <span class="badge" style="background: #f1f5f9; color: #475569; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700;">
                ${escapeHTML(activeReport.revision)}
              </span>
            </div>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">
              ${escapeHTML(project?.name || 'Projeto')} &bull; ${activeReport.pages.length} Páginas &bull; ${activeReport.includedSections.length} Seções Ativas
            </p>
          </div>

          <div style="display: flex; gap: 10px; align-items: center;">
            <select class="form-select form-select-sm" style="font-size: 12px; padding: 6px 10px;" onchange="ReportEngineModule.setStatus(this.value)">
              ${StudioState.REPORT_STATUSES.map(st => `
                <option value="${st}" ${activeReport.status === st ? 'selected' : ''}>
                  Status: ${StudioState.REPORT_STATUS_LABELS[st]}
                </option>
              `).join('')}
            </select>

            <button class="btn btn-ghost btn-sm" onclick="ReportEngineModule.toggleConfigPanel()">
              <i data-lucide="sliders"></i> Seções (${activeReport.includedSections.length}/21)
            </button>

            <button class="btn btn-secondary btn-sm" onclick="ReportEngineModule.approveCurrentReport()">
              <i data-lucide="check-circle"></i> Homologar Relatório
            </button>
          </div>
        </header>

        <!-- Two-panel layout: Left Navigator / Sections & Right Paginated Document View -->
        <div style="display: grid; grid-template-columns: 300px 1fr; gap: 24px; align-items: start;">
          <!-- Left Sidebar: Section Selector & Page Thumbs -->
          <aside style="display: flex; flex-direction: column; gap: 16px;">
            <!-- Seções do Relatório (21 canônicas) -->
            <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <strong style="font-size: 13px; color: #0f172a;">21 Seções Canônicas</strong>
                <div style="font-size: 11px;">
                  <a href="javascript:void(0)" onclick="ReportEngineModule.selectAllSections()">Todas</a> | 
                  <a href="javascript:void(0)" onclick="ReportEngineModule.clearAllSections()">Mínimo</a>
                </div>
              </div>

              <div style="max-height: 380px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; padding-right: 4px;">
                ${StudioState.REPORT_CANONICAL_SECTIONS.map(sec => {
                  const isChecked = selectedSections.includes(sec.id);
                  const isIncludedInReport = activeReport.includedSections.includes(sec.id);
                  return `
                    <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer; color: ${isIncludedInReport ? '#0f172a' : '#94a3b8'};">
                      <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="ReportEngineModule.toggleSection('${sec.id}')" />
                      <span>${sec.order}. ${escapeHTML(sec.title)}</span>
                    </label>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Navegador de Páginas -->
            <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
              <strong style="font-size: 13px; color: #0f172a; display: block; margin-bottom: 12px;">Navegação de Páginas</strong>
              <div style="display: flex; flex-direction: column; gap: 6px; max-height: 320px; overflow-y: auto;">
                ${activeReport.pages.map((p, idx) => `
                  <button 
                    onclick="ReportEngineModule.setPage(${idx})"
                    style="text-align: left; padding: 8px 12px; border-radius: 6px; font-size: 12px; border: 1px solid ${activePageIdx === idx ? '#2563eb' : '#f1f5f9'}; background: ${activePageIdx === idx ? '#eff6ff' : '#fff'}; color: ${activePageIdx === idx ? '#1d4ed8' : '#334155'}; font-weight: ${activePageIdx === idx ? '600' : '400'}; cursor: pointer; display: flex; justify-content: space-between;"
                  >
                    <span>${p.pageNumber}. ${escapeHTML(p.sectionTitle)}</span>
                    <span style="font-size: 10px; color: #94a3b8;">${escapeHTML(p.type)}</span>
                  </button>
                `).join('')}
              </div>
            </div>
          </aside>

          <!-- Right: Paginated Page Viewer with ArqVértice Identity -->
          <main style="background: #e2e8f0; padding: 24px; border-radius: 8px; display: flex; flex-direction: column; align-items: center; min-height: 800px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);">
            <!-- Page Controller -->
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; max-width: 800px; margin-bottom: 16px;">
              <button class="btn btn-ghost btn-sm" onclick="ReportEngineModule.setPage(${activePageIdx - 1})" ${activePageIdx === 0 ? 'disabled' : ''}>
                &larr; Página Anterior
              </button>
              <span style="font-size: 13px; font-weight: 600; color: #475569;">
                ${activeReport.pages[activePageIdx].pagination.label}
              </span>
              <button class="btn btn-ghost btn-sm" onclick="ReportEngineModule.setPage(${activePageIdx + 1})" ${activePageIdx === activeReport.pages.length - 1 ? 'disabled' : ''}>
                Próxima Página &rarr;
              </button>
            </div>

            <!-- The Rendered Sheet Page (A4 Portrait aspect ratio) -->
            ${renderSinglePageSheet(activeReport.pages[activePageIdx], activeReport, brand)}
          </main>
        </div>
      </div>
    `;

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  function renderSinglePageSheet(page, report, brand) {
    const isCover = page.type === 'capa';
    const isSummary = page.type === 'sumario';

    return `
      <div 
        class="report-page-sheet" 
        style="width: 100%; max-width: 800px; min-height: 1050px; background: #fff; border-radius: 4px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); display: flex; flex-direction: column; position: relative; padding: 48px; box-sizing: border-box;"
      >
        <!-- 8. CABEÇALHO COM IDENTIDADE ARQVERTICE -->
        ${!isCover ? `
          <header class="report-page-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 24px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <img src="${escapeHTML(report.header.logoUrl)}" alt="Logo" style="max-height: 28px; max-width: 120px; object-fit: contain;" onerror="this.style.display='none'" />
              <div style="font-size: 11px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;">
                ${escapeHTML(report.header.projectName)}
              </div>
            </div>
            <div style="text-align: right; font-size: 10px; color: #64748b; font-family: monospace;">
              <span>${escapeHTML(report.revision)}</span> &bull; <span>${escapeHTML(report.header.statusLabel)}</span>
            </div>
          </header>
        ` : ''}

        <!-- CONTEÚDO PRINCIPAL DA PÁGINA -->
        <div class="report-page-body" style="flex: 1; display: flex; flex-direction: column;">
          ${renderPageContent(page, report)}
        </div>

        <!-- 9. CARIMBO F05 NO RODAPÉ DE PÁGINAS TÉCNICAS -->
        ${(page.type === 'gallery_plans' || page.type === 'quantities_table' || page.type === 'delivery_sheet') ? `
          <div style="margin-top: 24px; border: 1px solid #0f172a; border-radius: 2px; padding: 8px 12px; font-size: 10px; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 8px; background: #f8fafc;">
            <div>
              <strong style="display: block; font-size: 11px;">${escapeHTML(report.titleblock.escritorio)}</strong>
              <span>${escapeHTML(report.titleblock.responsavel)}</span>
            </div>
            <div>
              <div><strong>PROJETO:</strong> ${escapeHTML(report.titleblock.projeto)}</div>
              <div><strong>CLIENTE:</strong> ${escapeHTML(report.titleblock.cliente)}</div>
            </div>
            <div style="text-align: right; font-family: monospace;">
              <div><strong>REVISÃO:</strong> ${escapeHTML(report.titleblock.revisao)}</div>
              <div><strong>FOLHA:</strong> ${escapeHTML(page.pagination.current)}/${escapeHTML(page.pagination.total)}</div>
              <div><strong>DATA:</strong> ${escapeHTML(report.titleblock.data)}</div>
            </div>
          </div>
        ` : ''}

        <!-- 8. RODAPÉ COM IDENTIDADE ARQVERTICE E PAGINAÇÃO -->
        <footer class="report-page-footer" style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #64748b;">
          <div>
            <span>${escapeHTML(report.footer.companyName)}</span> &bull; <span>${escapeHTML(report.footer.date)}</span>
          </div>
          <div style="font-weight: 700; color: #0f172a; font-family: monospace;">
            ${escapeHTML(page.pagination.label)}
          </div>
        </footer>
      </div>
    `;
  }

  function renderPageContent(page, report) {
    const c = page.content;

    switch (page.type) {
      case 'capa':
        return `
          <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between; text-align: center; padding: 40px 0;">
            <div style="display: flex; justify-content: center; margin-bottom: 24px;">
              <img src="${escapeHTML(report.header.logoUrl)}" alt="Logo" style="max-height: 50px; object-fit: contain;" />
            </div>

            <div style="margin: 20px 0;">
              <span class="badge" style="background: #0f172a; color: #fff; font-size: 11px; padding: 4px 12px; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.1em;">
                Dossiê de Apresentação Arquitetônica
              </span>
              <h1 style="font-size: 32px; font-weight: 800; color: #0f172a; margin: 16px 0 8px 0; line-height: 1.2;">
                ${escapeHTML(c.title)}
              </h1>
              <p style="font-size: 16px; color: #64748b; margin: 0;">
                ${escapeHTML(c.subtitle)}
              </p>
            </div>

            <!-- Imagem de Capa Aprovada -->
            <div style="width: 100%; height: 380px; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin: 20px 0; position: relative;">
              <img src="${escapeHTML(c.coverImage)}" alt="Perspectiva Principal" style="width: 100%; height: 100%; object-fit: cover;" />
              <div style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.7); color: #fff; font-size: 10px; padding: 2px 8px; border-radius: 4px;">
                Rastreabilidade: ${escapeHTML(c.origem)} &bull; ${escapeHTML(c.versao)}
              </div>
            </div>

            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; display: grid; grid-template-columns: 1fr 1fr; text-align: left; font-size: 12px; gap: 12px;">
              <div>
                <span style="color: #64748b; display: block;">Cliente:</span>
                <strong style="color: #0f172a; font-size: 14px;">${escapeHTML(c.clientName)}</strong>
              </div>
              <div style="text-align: right;">
                <span style="color: #64748b; display: block;">Responsável Técnico:</span>
                <strong style="color: #0f172a; font-size: 14px;">${escapeHTML(c.leadArchitect)}</strong>
              </div>
            </div>
          </div>
        `;

      case 'sumario':
        return `
          <div>
            <h2 style="font-size: 22px; font-weight: 700; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 24px;">
              Sumário do Relatório
            </h2>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${c.sumario.map((item, idx) => `
                <div style="display: flex; justify-content: space-between; align-items: baseline; font-size: 13px;">
                  <span style="font-weight: 600; color: #0f172a;">${idx + 1}. ${escapeHTML(item.title)}</span>
                  <div style="flex: 1; border-bottom: 1px dotted #cbd5e1; margin: 0 12px;"></div>
                  <span style="font-family: monospace; font-weight: 700; color: #2563eb;">${escapeHTML(item.pageNumber)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `;

      case 'data_sheet':
        const client = c.client;
        const project = c.project;
        if (client) {
          return `
            <div>
              <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px;">
                Dados Cadastrais do Cliente
              </h2>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 13px;">
                <div><span style="color: #64748b;">Nome Completo:</span> <strong style="display: block; color: #0f172a;">${escapeHTML(client.name)}</strong></div>
                <div><span style="color: #64748b;">Documento:</span> <strong style="display: block; color: #0f172a;">${escapeHTML(client.document || 'Não informado')}</strong></div>
                <div><span style="color: #64748b;">E-mail:</span> <strong style="display: block; color: #0f172a;">${escapeHTML(client.email || 'Não informado')}</strong></div>
                <div><span style="color: #64748b;">Telefone:</span> <strong style="display: block; color: #0f172a;">${escapeHTML(client.phone || 'Não informado')}</strong></div>
                <div style="grid-column: 1 / -1;"><span style="color: #64748b;">Endereço:</span> <strong style="display: block; color: #0f172a;">${escapeHTML(client.address || 'Não informado')}</strong></div>
                <div style="grid-column: 1 / -1;"><span style="color: #64748b;">Observações:</span> <p style="margin: 4px 0; color: #334155;">${escapeHTML(client.notes || 'Sem observações.')}</p></div>
              </div>
            </div>
          `;
        }
        if (project) {
          return `
            <div>
              <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px;">
                Dados Gerais do Projeto
              </h2>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 13px;">
                <div><span style="color: #64748b;">Código:</span> <strong style="display: block; color: #0f172a;">${escapeHTML(project.code)}</strong></div>
                <div><span style="color: #64748b;">Nome:</span> <strong style="display: block; color: #0f172a;">${escapeHTML(project.name)}</strong></div>
                <div><span style="color: #64748b;">Tipologia:</span> <strong style="display: block; color: #0f172a;">${escapeHTML(project.typology || 'Residencial')}</strong></div>
                <div><span style="color: #64748b;">Localização:</span> <strong style="display: block; color: #0f172a;">${escapeHTML(project.location || 'Não informada')}</strong></div>
                <div><span style="color: #64748b;">Arquiteto Líder:</span> <strong style="display: block; color: #0f172a;">${escapeHTML(project.leadArchitect)}</strong></div>
                <div><span style="color: #64748b;">Status Global:</span> <strong style="display: block; color: #0f172a;">${escapeHTML(project.status || 'Ativo')}</strong></div>
              </div>
            </div>
          `;
        }
        return '';

      case 'gallery_renders':
        return `
          <div>
            <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px;">
              Perspectivas e Renders Homologados
            </h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              ${(c.renders || []).map(r => `
                <div style="border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; background: #fff;">
                  <div style="height: 180px; overflow: hidden; position: relative;">
                    <img src="${escapeHTML(r.url)}" alt="${escapeHTML(r.cameraName)}" style="width: 100%; height: 100%; object-fit: cover;" />
                    <span class="badge" style="position: absolute; top: 6px; right: 6px; background: rgba(0,0,0,0.7); color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 4px;">
                      ${escapeHTML(r.versao)} &bull; ${escapeHTML(r.origem)}
                    </span>
                  </div>
                  <div style="padding: 10px; font-size: 11px;">
                    <strong style="color: #0f172a; display: block;">${escapeHTML(r.cameraName)}</strong>
                    <span style="color: #64748b;">Aprovado por: ${escapeHTML(r.approvedBy)}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;

      case 'quantities_table':
        return `
          <div>
            <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px;">
              Quadro Técnico de Quantitativos
            </h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left;">
              <thead>
                <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                  <th style="padding: 8px;">Item</th>
                  <th style="padding: 8px;">Unidade</th>
                  <th style="padding: 8px;">Quantidade</th>
                  <th style="padding: 8px;">Ambiente</th>
                  <th style="padding: 8px;">Observação</th>
                  <th style="padding: 8px;">Fonte</th>
                </tr>
              </thead>
              <tbody>
                ${(c.quantities || []).map(q => `
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 8px; font-weight: 600; color: #0f172a;">${escapeHTML(q.item)}</td>
                    <td style="padding: 8px; color: #64748b;">${escapeHTML(q.unidade)}</td>
                    <td style="padding: 8px; font-family: monospace; font-weight: 700; color: ${q.quantidade === 'NÃO INFORMADO' ? '#e11d48' : '#0f172a'};">${escapeHTML(q.quantidade)}</td>
                    <td style="padding: 8px;">${escapeHTML(q.ambiente)}</td>
                    <td style="padding: 8px; color: #64748b;">${escapeHTML(q.observacao || '—')}</td>
                    <td style="padding: 8px;"><span class="badge" style="background: #f1f5f9; padding: 2px 6px; font-size: 10px;">${escapeHTML(q.fonte)}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;

      default:
        return `
          <div>
            <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px;">
              ${escapeHTML(page.sectionTitle)}
            </h2>
            <div style="font-size: 13px; line-height: 1.6; color: #334155;">
              <p>Conteúdo homologado correspondente à seção de ${escapeHTML(page.sectionTitle)} do projeto.</p>
              <pre style="background: #f8fafc; padding: 12px; border-radius: 6px; font-size: 11px; overflow-x: auto;">${escapeHTML(JSON.stringify(c, null, 2))}</pre>
            </div>
          </div>
        `;
    }
  }

  function getStatusBadgeClass(status) {
    switch (status) {
      case 'aprovado': return 'badge-success';
      case 'final': return 'badge-primary';
      case 'revisao': return 'badge-warning';
      default: return 'badge-secondary';
    }
  }

  function approveCurrentReport() {
    if (!activeReport) return;
    StudioState.approveProjectReport(activeReport.id, 'Arquiteto Responsável');
    activeReport.status = 'aprovado';
    renderUI();
    alert('Relatório homologado com sucesso!');
  }

  function toggleConfigPanel() {
    // Alterna visibilidade se necessário
    alert(`Relatório configurado com ${selectedSections.length} seções ativas.`);
  }

  return {
    render,
    init,
    toggleSection,
    selectAllSections,
    clearAllSections,
    setStatus,
    setRevision,
    generateReport,
    setPage,
    approveCurrentReport,
    toggleConfigPanel
  };
})();

if (typeof window !== 'undefined') {
  window.ReportEngineModule = ReportEngineModule;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReportEngineModule;
}
