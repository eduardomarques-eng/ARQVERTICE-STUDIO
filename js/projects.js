/**
 * ============================================================================
 * ARQVERTICE STUDIO — MÓDULO DE PROJETOS E WORKSPACE DO PROJETO
 * Gestão multi-projeto, Ficha do Cliente, Dossiê e Navegação das 15 Etapas
 * ============================================================================
 */

function renderProjectsList() {
  const container = document.getElementById('view-container');
  if (!container) return;

  const state = StudioState.data;
  let list = [...state.projects];

  // Filtro de Status
  if (state.projectFilterStatus && state.projectFilterStatus !== 'all') {
    list = list.filter(p => p.status.toLowerCase() === state.projectFilterStatus.toLowerCase());
  }

  // Filtro de Busca Textual
  if (state.searchQuery && state.searchQuery.trim() !== '') {
    const q = state.searchQuery.toLowerCase().trim();
    list = list.filter(p => {
      const client = state.clients.find(c => c.id === p.clientId) || { name: '' };
      return (
        p.name.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.typology.toLowerCase().includes(q) ||
        client.name.toLowerCase().includes(q) ||
        (p.code && p.code.toLowerCase().includes(q))
      );
    });
  }

  container.innerHTML = `
    <div class="projects-view animate-fade-in">
      <header class="view-header">
        <div class="view-header-main">
          <div class="badge-tag">PORTFÓLIO E GESTÃO MULTI-PROJETO</div>
          <h1 class="view-title">Projetos & Empreendimentos</h1>
          <p class="view-subtitle">Acompanhe todos os projetos da ArqVértice por cliente, etapa do ciclo e avanço físico.</p>
        </div>
        <div class="view-header-actions">
          <button class="btn btn-primary" onclick="StudioApp.openNewProjectModal()">
            <i data-lucide="plus"></i>
            <span>Novo Projeto</span>
          </button>
        </div>
      </header>

      <!-- Barra de Filtros e Busca -->
      <section class="toolbar-card">
        <div class="search-input-wrap">
          <i data-lucide="search"></i>
          <input 
            type="text" 
            id="projects-search-input" 
            placeholder="Buscar por nome da obra, cliente, tipologia ou cidade..."
            value="${escapeHTML(state.searchQuery || '')}"
            oninput="StudioApp.setSearchQuery(this.value)"
          />
          ${state.searchQuery ? `<button class="btn-clear-search" onclick="StudioApp.setSearchQuery('')"><i data-lucide="x"></i></button>` : ''}
        </div>

        <div class="toolbar-filters">
          <div class="filter-group">
            <span class="filter-label">Status:</span>
            <div class="chips-group">
              <button class="filter-chip ${state.projectFilterStatus === 'all' ? 'active' : ''}" onclick="StudioApp.setProjectFilter('all')">Todos</button>
              <button class="filter-chip ${state.projectFilterStatus === 'Em Andamento' ? 'active' : ''}" onclick="StudioApp.setProjectFilter('Em Andamento')">Em Andamento</button>
              <button class="filter-chip ${state.projectFilterStatus === 'Briefing' ? 'active' : ''}" onclick="StudioApp.setProjectFilter('Briefing')">Briefing</button>
              <button class="filter-chip ${state.projectFilterStatus === 'Finalizado' ? 'active' : ''}" onclick="StudioApp.setProjectFilter('Finalizado')">Finalizados</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Lista de Cards de Projetos -->
      <div class="projects-grid">
        ${list.length ? list.map(p => {
          const client = state.clients.find(c => c.id === p.clientId) || { name: 'Não atribuído' };
          const pTasks = state.tasks.filter(t => t.projectId === p.id);
          const avgPct = pTasks.length ? Math.round(pTasks.reduce((a, b) => a + Number(b.porcentagem || 0), 0) / pTasks.length) : 0;
          const nextT = pTasks.filter(t => t.porcentagem < 100).sort((a, b) => parseDateBR(a.data_conclusao) - parseDateBR(b.data_conclusao))[0];
          const envs = state.environments.filter(e => e.projectId === p.id);
          const isCrit = nextT && getDaysRemaining(nextT.data_conclusao) <= 7;

          return `
            <div class="project-card">
              <div class="project-card-image" style="background-image: url('${p.coverImage}')">
                <span class="project-card-badge status-${p.status.toLowerCase().replace(/\s+/g, '-')}">${escapeHTML(p.status)}</span>
                <span class="project-card-code">${escapeHTML(p.code || 'PRJ')}</span>
              </div>

              <div class="project-card-content">
                <div class="pcc-head">
                  <h2 class="project-card-title" onclick="StudioApp.openProject('${p.id}')">${escapeHTML(p.name)}</h2>
                  <div class="project-card-client"><i data-lucide="user"></i> ${escapeHTML(client.name)}</div>
                </div>

                <div class="project-card-details">
                  <div class="pcd-row"><i data-lucide="map-pin"></i> <span>${escapeHTML(p.location)}</span></div>
                  <div class="pcd-row"><i data-lucide="home"></i> <span>${escapeHTML(p.typology)} • ${p.builtAreaM2 ? p.builtAreaM2 + ' m²' : '-'}</span></div>
                  <div class="pcd-row"><i data-lucide="layers"></i> <span>Etapa: <strong>${escapeHTML(p.currentStage)}</strong></span></div>
                </div>

                <div class="project-card-kpis">
                  <div class="pck-col">
                    <span class="pck-label">Ambientes</span>
                    <strong class="pck-val">${envs.length}</strong>
                  </div>
                  <div class="pck-col">
                    <span class="pck-label">Entregas</span>
                    <strong class="pck-val">${pTasks.length}</strong>
                  </div>
                  <div class="pck-col">
                    <span class="pck-label">Avanço</span>
                    <strong class="pck-val" style="color: ${getProgressColor(avgPct)}">${avgPct}%</strong>
                  </div>
                </div>

                <div class="custom-progress-track">
                  <div class="custom-progress-bar" style="width: ${avgPct}%; background: ${getProgressColor(avgPct)}"></div>
                </div>

                <div class="project-card-next ${isCrit ? 'is-alert' : ''}">
                  <span class="pcn-label"><i data-lucide="clock"></i> Próxima Entrega:</span>
                  <span class="pcn-task">${nextT ? escapeHTML(nextT.descricao_etapa) + ' (' + nextT.data_conclusao + ')' : 'Todas as entregas concluídas'}</span>
                </div>

                <div class="project-card-actions">
                  <button class="btn btn-sm btn-outline" onclick="window.open('viewer.html?project=${p.id}', '_blank')">
                    <i data-lucide="box"></i> 3D Cliente
                  </button>
                  <button class="btn btn-sm btn-outline" onclick="StudioApp.openProject('${p.id}', 'ambientes')">
                    <i data-lucide="layout-grid"></i> Ambientes (${envs.length})
                  </button>
                  <button class="btn btn-sm btn-outline" onclick="StudioApp.openProject('${p.id}', 'cronograma')">
                    <i data-lucide="calendar"></i> Cronograma
                  </button>
                  <button class="btn btn-sm btn-primary" onclick="StudioApp.openProject('${p.id}')">
                    Abrir <i data-lucide="arrow-right"></i>
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('') : `
          <div class="empty-state-box">
            <i data-lucide="folder-x"></i>
            <h3>Nenhum projeto encontrado</h3>
            <p>Nenhum empreendimento corresponde aos filtros selecionados.</p>
            <button class="btn btn-secondary" onclick="StudioApp.setProjectFilter('all'); StudioApp.setSearchQuery('');">Limpar Filtros</button>
          </div>
        `}
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
}

/**
 * WORKSPACE DO PROJETO SELECIONADO
 */
function renderProjectWorkspace() {
  const container = document.getElementById('view-container');
  if (!container) return;

  const state = StudioState.data;
  const project = StudioState.getActiveProject();
  const client = StudioState.getActiveClient();
  const environments = StudioState.getProjectEnvironments();
  const tasks = StudioState.getProjectTasks();
  const activeTab = state.activeProjectTab || state.selectedProjectTab || 'ambientes';

  const stages = project.stages || [];

  container.innerHTML = `
    <div class="project-workspace animate-fade-in">
      <!-- Cabeçalho do Workspace do Projeto -->
      <header class="workspace-header">
        <div class="wsh-breadcrumb">
          <span class="breadcrumb-link" onclick="StudioApp.navigateTo('projects')">Projetos</span>
          <i data-lucide="chevron-right"></i>
          <strong class="breadcrumb-current">${escapeHTML(project.name)}</strong>
        </div>

        <div class="wsh-main-row">
          <div class="wsh-title-wrap">
            <span class="code-pill">${escapeHTML(project.code || 'PRJ')}</span>
            <h1 class="workspace-title">${escapeHTML(project.name)}</h1>
            <span class="status-pill status-${project.status.toLowerCase().replace(/\s+/g, '-')}">${escapeHTML(project.status)}</span>
          </div>

          <div class="wsh-actions">
            <button class="btn btn-sm btn-outline" onclick="window.open('viewer.html?project=${project.id}', '_blank')">
              <i data-lucide="box"></i> 3D Cliente
            </button>
            <button class="btn btn-sm btn-outline" onclick="StudioApp.openEditProjectModal('${project.id}')">
              <i data-lucide="edit-3"></i> Editar Obra
            </button>
            <button class="btn btn-sm btn-report" onclick="StudioApp.openProjectReportModal()">
              <i data-lucide="file-text"></i> Relatório PDF
            </button>
          </div>
        </div>

        <!-- Barra de Dossiê Rápido -->
        <div class="wsh-quick-dossier">
          <div class="qdi-item">
            <i data-lucide="user"></i>
            <div>
              <span class="qdi-label">Cliente / Contratante</span>
              <strong class="qdi-val">${escapeHTML(client.name)}</strong>
            </div>
          </div>
          <div class="qdi-item">
            <i data-lucide="map-pin"></i>
            <div>
              <span class="qdi-label">Localização</span>
              <strong class="qdi-val">${escapeHTML(project.location)}</strong>
            </div>
          </div>
          <div class="qdi-item">
            <i data-lucide="home"></i>
            <div>
              <span class="qdi-label">Tipologia & Área</span>
              <strong class="qdi-val">${escapeHTML(project.typology)} (${project.builtAreaM2 || '-'} m²)</strong>
            </div>
          </div>
          <div class="qdi-item">
            <i data-lucide="calendar"></i>
            <div>
              <span class="qdi-label">Prazos</span>
              <strong class="qdi-val">${escapeHTML(project.startDate || '-')} a ${escapeHTML(project.expectedEndDate || '-')}</strong>
            </div>
          </div>
        </div>

        <!-- NAVEGAÇÃO CONTEXTUAL DAS 15 ETAPAS (Requisito do Item 6) -->
        <nav class="project-stages-nav">
          <div class="stages-scroll-container">
            ${stages.map(st => {
              const isActive = activeTab === st.key;
              let badgeClass = 'badge-disp';
              let badgeText = 'Disponível';
              if (st.status === 'concluido') { badgeClass = 'badge-done'; badgeText = 'Concluído'; }
              else if (st.status === 'em_andamento') { badgeClass = 'badge-run'; badgeText = 'Em Andamento'; }
              else if (st.status === 'pendente') { badgeClass = 'badge-pend'; badgeText = 'Pendente'; }
              else if (st.status === 'bloqueado') { badgeClass = 'badge-lock'; badgeText = 'Bloqueado'; }

              return `
                <button 
                  class="stage-nav-item ${isActive ? 'is-active' : ''} is-${st.status}"
                  onclick="StudioApp.setProjectTab('${st.key}')"
                >
                  <span class="stage-nav-label">${escapeHTML(st.label)}</span>
                  <span class="stage-status-pill ${badgeClass}">${badgeText}</span>
                </button>
              `;
            }).join('')}
          </div>
        </nav>
      </header>

      <!-- Conteúdo da Aba Selecionada -->
      <main class="workspace-body" id="workspace-tab-content">
        ${renderProjectTabContent(activeTab, project, client, environments, tasks)}
      </main>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
}

/**
 * Roteamento interno das abas do projeto
 */
function renderProjectTabContent(tab, project, client, environments, tasks) {
  switch (tab) {
    case 'cliente':
      return renderClientTab(project, client);
    case 'projeto':
      return renderProjectDevelopmentWorkspaceTab(project, client);
    case 'ambientes':
      return renderEnvironmentsGrid(environments, project);
    case 'cronograma':
      return renderIntegratedCronograma(project, tasks);
    case 'briefing':
      return renderBriefingTab(project, client);
    case 'briefing-tecnico':
      return renderTechnicalBriefTab(project, client);
    case 'levantamento':
      return renderSurveyTab(project, client);
    case 'estudos':
      return renderStudiesTab(project, client);
    case 'conceito':
      return renderConceptTab(project, client);
    case 'memoria':
      return renderMemoryTab(project, client);
    case 'revisoes':
      return renderRevisionsTab(project);
    case 'relatorios':
      return renderReportsTab(project);
    case 'quantitativos':
      return renderProjectQuantitativosTab(project);
    case 'moodboards':
      return window.MoodboardSystemModule ? MoodboardSystemModule.renderProjectMoodboards(project) : `<div>Módulo de Moodboard não carregado.</div>`;
    case 'especificacoes':
      return window.SpecificationBookModule ? SpecificationBookModule.renderProjectTab(project) : `<div>Módulo de Especificações não carregado.</div>`;
    case 'apresentacao':
      return window.PresentationEngineModule ? PresentationEngineModule.renderProjectPresentation(project) : `<div>Módulo de Apresentação não carregado.</div>`;
    case 'pranchas':
      return window.SheetEngineModule ? SheetEngineModule.renderProjectSheets(project) : `<div>Módulo de Pranchas não carregado.</div>`;
    case 'video':
      return window.VideoStudioModule ? VideoStudioModule.renderProjectVideos(project) : `<div>Módulo de Produção Audiovisual não carregado.</div>`;
    default:
      return renderGenericStageTab(tab, project);
  }
}

/**
 * ABA BLOCO E03: QUANTITATIVOS CONSOLIDADOS DO PROJETO
 */
function renderProjectQuantitativosTab(project) {
  const consolidated = StudioState.getProjectConsolidatedQuantities(project.id);
  return `
    <div class="project-consolidated-tab animate-fade-in" style="padding: 24px;">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2><i data-lucide="layers"></i> Quantitativos Consolidados do Projeto (Total Geral)</h2>
          <p class="text-muted">Totalização de materiais e revestimentos presentes em múltiplos ambientes com memória de cálculo.</p>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="QuantitySystemModule.downloadCSV('${project.id}')">
          <i data-lucide="download"></i> Exportar CSV do Projeto
        </button>
      </div>
      <div class="table-responsive">
        <table class="table table-bordered bg-white shadow-sm rounded">
          <thead class="bg-light">
            <tr>
              <th>Material / Item Consolidado</th>
              <th>Categoria</th>
              <th>Qtd. Base Total</th>
              <th>Qtd. Final Total</th>
              <th>Qtd. Compra</th>
              <th>Distribuição por Ambiente</th>
            </tr>
          </thead>
          <tbody>
            ${consolidated.length === 0 ? `
              <tr><td colspan="6" class="text-center py-5 text-muted">Nenhum quantitativo disponível para consolidação neste projeto.</td></tr>
            ` : consolidated.map(grp => `
              <tr>
                <td>
                  <strong>${escapeHTML(grp.itemName)}</strong>
                  ${grp.product ? `<div class="text-xs text-muted">SKU: ${escapeHTML(grp.product.skuCode || 'N/A')}</div>` : ''}
                </td>
                <td><span class="qty-cat-pill">${escapeHTML(grp.category)}</span></td>
                <td><strong>${grp.totalBaseQuantity.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> ${escapeHTML(grp.unit)}</td>
                <td><strong class="text-primary">${grp.totalFinalQuantity.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> ${escapeHTML(grp.unit)}</td>
                <td>
                  ${grp.hasPackaging && grp.packagingCoverage ? `
                    <strong>${grp.totalPurchasingQuantity} ${escapeHTML(grp.packagingUnit || 'caixas')}</strong>
                  ` : `<strong>${grp.totalPurchasingQuantity.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> ${escapeHTML(grp.unit)}`}
                </td>
                <td>
                  <ul class="list-unstyled mb-0 text-sm">
                    ${grp.environmentsBreakdown.map(envB => `
                      <li class="py-1 border-bottom">
                        <strong>${escapeHTML(envB.environmentName)}:</strong> ${envB.finalQuantity.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ${escapeHTML(envB.unit)}
                        <span class="badge ${envB.status === 'APPROVED' ? 'bg-success' : 'bg-secondary'}">${escapeHTML(envB.status)}</span>
                      </li>
                    `).join('')}
                  </ul>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * ABA C05: WORKSPACE DE DESENVOLVIMENTO DO PROJETO
 */
function renderProjectDevelopmentWorkspaceTab(project, client) {
  if (typeof ProjectWorkspaceModule !== 'undefined' && ProjectWorkspaceModule.render) {
    return ProjectWorkspaceModule.render(project, client);
  }
  return renderProjectDossierTab(project, client);
}

/**
 * ABA C02: LEVANTAMENTO E ORGANIZAÇÃO DA BASE
 */
function renderSurveyTab(project, client) {
  if (typeof SurveyModule !== 'undefined' && SurveyModule.render) {
    return SurveyModule.render(project, client);
  }
  return renderGenericStageTab('levantamento', project);
}

/**
 * ABA C03: ESTUDOS PRELIMINARES
 */
function renderStudiesTab(project, client) {
  if (typeof StudiesModule !== 'undefined' && StudiesModule.render) {
    return StudiesModule.render(project, client);
  }
  return renderGenericStageTab('estudos', project);
}

/**
 * ABA C04: CONCEITO E DIRETRIZES CONSOLIDADAS
 */
function renderConceptTab(project, client) {
  if (typeof ConceptModule !== 'undefined' && ConceptModule.render) {
    return ConceptModule.render(project, client);
  }
  return renderGenericStageTab('conceito', project);
}

/**
 * ABA C06: MEMÓRIA ESTRUTURADA, DECISÕES E CONTEXTO DO PROJETO
 */
function renderMemoryTab(project, client) {
  if (typeof MemoryModule !== 'undefined' && MemoryModule.render) {
    return MemoryModule.render(project, client);
  }
  return renderGenericStageTab('memoria', project);
}

/**
 * ABA 1: CLIENTE
 */
function renderClientTab(project, client) {
  return `
    <div class="tab-panel animate-fade-in">
      <div class="panel-card">
        <div class="panel-card-head">
          <div class="pch-left">
            <i data-lucide="user-check"></i>
            <h2>Identificação e Contato do Contratante</h2>
          </div>
          <span class="auto-save-indicator" id="client-save-status"><i data-lucide="check"></i> Sincronizado</span>
        </div>

        <form id="form-edit-client" class="styled-form" onsubmit="StudioApp.saveClient(event)">
          <div class="form-grid-2">
            <div class="form-group">
              <label><i data-lucide="user"></i> Nome Completo do Cliente *</label>
              <input type="text" id="client-name" value="${escapeHTML(client.name)}" required onchange="StudioApp.autoSaveClientField('name', this.value)" />
            </div>

            <div class="form-group">
              <label><i data-lucide="file-text"></i> CPF ou CNPJ</label>
              <input type="text" id="client-doc" value="${escapeHTML(client.document || '')}" placeholder="000.000.000-00" onchange="StudioApp.autoSaveClientField('document', this.value)" />
            </div>

            <div class="form-group">
              <label><i data-lucide="mail"></i> E-mail de Notificações</label>
              <input type="email" id="client-email" value="${escapeHTML(client.email || '')}" placeholder="cliente@email.com" onchange="StudioApp.autoSaveClientField('email', this.value)" />
            </div>

            <div class="form-group">
              <label><i data-lucide="phone"></i> Telefone / WhatsApp *</label>
              <input type="text" id="client-phone" value="${escapeHTML(client.phone || '')}" required onchange="StudioApp.autoSaveClientField('phone', this.value)" />
            </div>

            <div class="form-group span-2">
              <label><i data-lucide="map-pin"></i> Endereço Residencial / Comercial</label>
              <input type="text" id="client-address" value="${escapeHTML(client.address || '')}" placeholder="Rua, número, bairro, cidade - UF" onchange="StudioApp.autoSaveClientField('address', this.value)" />
            </div>

            <div class="form-group span-2">
              <label><i data-lucide="message-square"></i> Observações e Preferências do Cliente</label>
              <textarea id="client-notes" rows="4" placeholder="Preferências declaradas em reuniões, restrições e horários de contato..." onchange="StudioApp.autoSaveClientField('notes', this.value)">${escapeHTML(client.notes || '')}</textarea>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary">
              <i data-lucide="save"></i> Salvar Dados do Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

/**
 * ABA 2: PROJETO (DOSSIÊ TÉCNICO)
 */
function renderProjectDossierTab(project, client) {
  return `
    <div class="tab-panel animate-fade-in">
      <div class="panel-card">
        <div class="panel-card-head">
          <div class="pch-left">
            <i data-lucide="building-2"></i>
            <h2>Ficha Técnica e Dossiê Geral da Obra</h2>
          </div>
          <span class="badge-tag">AUTOSAVE ATIVO</span>
        </div>

        <form id="form-edit-project" class="styled-form" onsubmit="StudioApp.saveProjectDetails(event)">
          <div class="form-grid-2">
            <div class="form-group">
              <label>Nome do Empreendimento / Obra *</label>
              <input type="text" id="proj-name" value="${escapeHTML(project.name)}" required onchange="StudioApp.autoSaveProjectField('name', this.value)" />
            </div>

            <div class="form-group">
              <label>Código Interno</label>
              <input type="text" id="proj-code" value="${escapeHTML(project.code || '')}" readonly />
            </div>

            <div class="form-group span-2">
              <label>Localização / Endereço da Obra</label>
              <input type="text" id="proj-location" value="${escapeHTML(project.location)}" onchange="StudioApp.autoSaveProjectField('location', this.value)" />
            </div>

            <div class="form-group">
              <label>Identificação Cadastral (Lote e Quadra)</label>
              <input type="text" id="proj-plot" value="${escapeHTML(project.plotLotBlock || '')}" onchange="StudioApp.autoSaveProjectField('plotLotBlock', this.value)" />
            </div>

            <div class="form-group">
              <label>Zoneamento Urbano / Ambiental</label>
              <input type="text" id="proj-zoning" value="${escapeHTML(project.zoning || '')}" onchange="StudioApp.autoSaveProjectField('zoning', this.value)" />
            </div>

            <div class="form-group">
              <label>Tipologia Arquitetônica</label>
              <input type="text" id="proj-typology" value="${escapeHTML(project.typology || '')}" onchange="StudioApp.autoSaveProjectField('typology', this.value)" />
            </div>

            <div class="form-group">
              <label>Status Geral da Obra</label>
              <select id="proj-status" onchange="StudioApp.autoSaveProjectField('status', this.value)">
                <option value="Briefing" ${project.status === 'Briefing' ? 'selected' : ''}>Briefing</option>
                <option value="Estudo Preliminar" ${project.status === 'Estudo Preliminar' ? 'selected' : ''}>Estudo Preliminar</option>
                <option value="Projeto Básico" ${project.status === 'Projeto Básico' ? 'selected' : ''}>Projeto Básico</option>
                <option value="Em Andamento" ${project.status === 'Em Andamento' ? 'selected' : ''}>Em Andamento</option>
                <option value="Finalizado" ${project.status === 'Finalizado' ? 'selected' : ''}>Finalizado</option>
              </select>
            </div>

            <div class="form-group">
              <label>Área Construída Total (m²)</label>
              <input type="number" step="0.01" id="proj-area-const" value="${project.builtAreaM2 || ''}" onchange="StudioApp.autoSaveProjectField('builtAreaM2', Number(this.value))" />
            </div>

            <div class="form-group">
              <label>Área do Terreno / Lote (m²)</label>
              <input type="number" step="0.01" id="proj-area-lot" value="${project.landAreaM2 || ''}" onchange="StudioApp.autoSaveProjectField('landAreaM2', Number(this.value))" />
            </div>

            <div class="form-group">
              <label>Data de Início do Cronograma</label>
              <input type="text" id="proj-start-date" value="${escapeHTML(project.startDate || '')}" placeholder="DD-MM-AAAA" onchange="StudioApp.autoSaveProjectField('startDate', this.value)" />
            </div>

            <div class="form-group">
              <label>Previsão de Conclusão / Entrega</label>
              <input type="text" id="proj-end-date" value="${escapeHTML(project.expectedEndDate || '')}" placeholder="DD-MM-AAAA" onchange="StudioApp.autoSaveProjectField('expectedEndDate', this.value)" />
            </div>

            <div class="form-group span-2">
              <label>Responsáveis Técnicos da Obra</label>
              <div class="team-pills-row">
                <span class="team-lead-pill"><i data-lucide="award"></i> Arq. ${escapeHTML(project.leadArchitect || 'Eduardo Marques')}</span>
                <span class="team-lead-pill"><i data-lucide="frame"></i> Eng. ${escapeHTML(project.engineer || 'Luan Almeida')}</span>
                <span class="team-lead-pill"><i data-lucide="hard-hat"></i> Obra: ${escapeHTML(project.siteManager || 'Erick Santiago')}</span>
              </div>
            </div>

            <div class="form-group span-2">
              <label>Notas Técnicas do Revit / Memorial</label>
              <textarea id="proj-notes" rows="3" onchange="StudioApp.autoSaveProjectField('notes', this.value)">${escapeHTML(project.notes || '')}</textarea>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary">
              <i data-lucide="save"></i> Salvar Ficha Técnica
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

/**
 * ABA BRIEFING
 */
function renderBriefingTab(project, client) {
  if (window.BriefingAdmin) {
    return BriefingAdmin.renderProjectBriefingView(project, client);
  }
  return `<div>Módulo de Briefing não carregado.</div>`;
}

/**
 * ABA BRIEFING TÉCNICO INTERNO (BLOCO C01)
 */
function renderTechnicalBriefTab(project, client) {
  if (window.TechnicalBriefModule) {
    return TechnicalBriefModule.render(project, client);
  }
  return `<div>Módulo de Briefing Técnico não carregado.</div>`;
}

/**
 * ABA REVISÕES
 */
function renderRevisionsTab(project) {
  return `
    <div class="tab-panel animate-fade-in">
      <div class="panel-card">
        <div class="panel-card-head">
          <div class="pch-left">
            <i data-lucide="git-branch"></i>
            <h2>Controle Formal de Revisões</h2>
          </div>
          <button class="btn btn-sm btn-primary" onclick="alert('Funcionalidade de abertura de revisão cadastrada com sucesso.')">
            <i data-lucide="plus"></i> Nova Revisão (R02)
          </button>
        </div>

        <div class="revisions-timeline">
          <div class="revision-timeline-card">
            <div class="rtc-header">
              <span class="rtc-badge">R01 • Concluída</span>
              <span class="rtc-date">18-08-2026</span>
            </div>
            <h3>Revisão de Materiais e Ampliação do Deck</h3>
            <p>Cliente solicitou troca do piso da sala de porcelanato acetinado para mármore travertino navona e ampliação de 1,50m na prainha da piscina.</p>
            <div class="rtc-foot"><strong>Responsável:</strong> Arq. Eduardo Marques • <em>Aprovada pelo cliente</em></div>
          </div>

          <div class="revision-timeline-card">
            <div class="rtc-header">
              <span class="rtc-badge is-initial">R00 • Emissão Inicial</span>
              <span class="rtc-date">12-06-2026</span>
            </div>
            <h3>Entrega do Estudo Preliminar</h3>
            <p>Primeira proposta volumétrica e layout espacial de cômodos aprovada para desenvolvimento básico.</p>
            <div class="rtc-foot"><strong>Responsável:</strong> Equipe ArqVértice</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * ABA RELATÓRIOS
 */
function renderReportsTab(project) {
  return `
    <div class="tab-panel animate-fade-in">
      <div class="panel-card">
        <div class="panel-card-head">
          <div class="pch-left">
            <i data-lucide="file-text"></i>
            <h2>Emissão de Relatórios Executivos</h2>
          </div>
        </div>

        <div class="reports-options-grid">
          <div class="report-option-card">
            <div class="roc-icon"><i data-lucide="calendar-check"></i></div>
            <div class="roc-body">
              <h3>Relatório Executivo de Cronograma</h3>
              <p>Documento oficial A4 com parecer técnico contextualizado, avanço por disciplina, tabela de entregas e assinaturas dos 3 responsáveis técnicos e do cliente.</p>
              <button class="btn btn-sm btn-primary" onclick="StudioApp.openProjectReportModal()">
                <i data-lucide="printer"></i> Visualizar e Exportar PDF
              </button>
            </div>
          </div>

          <div class="report-option-card">
            <div class="roc-icon"><i data-lucide="clipboard-list"></i></div>
            <div class="roc-body">
              <h3>Relatório de Briefing Consolidado</h3>
              <p>Compilação técnica das 32 perguntas e respostas da entrevista com as diretrizes de arquitetura e especificações preliminares.</p>
              <button class="btn btn-sm btn-outline" onclick="alert('Relatório de Briefing gerado e enviado para download.')">
                <i data-lucide="download"></i> Baixar Relatório
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * ABA GENÉRICA PARA ETAPAS CONTEXTUAIS
 */
function renderGenericStageTab(stageKey, project) {
  const stage = (project.stages || []).find(s => s.key === stageKey) || { label: stageKey, status: 'disponivel' };
  
  return `
    <div class="tab-panel animate-fade-in">
      <div class="panel-card">
        <div class="panel-card-head">
          <div class="pch-left">
            <i data-lucide="folder"></i>
            <h2>Etapa: ${escapeHTML(stage.label)}</h2>
          </div>
          <span class="stage-status-pill badge-${stage.status}">${escapeHTML(stage.status.toUpperCase())}</span>
        </div>

        <div class="stage-workspace-preview">
          <p class="swp-desc">Módulo preparado para operação integrada no ciclo de desenvolvimento do <strong>ARQVERTICE STUDIO</strong>.</p>
          <div class="swp-info-box">
            <i data-lucide="info"></i>
            <span>Esta etapa está contextualizada no projeto <strong>${escapeHTML(project.name)}</strong> e mantém vínculo com as decisões dos ambientes e os prazos do cronograma.</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

window.renderProjectsList = renderProjectsList;
window.renderProjectWorkspace = renderProjectWorkspace;
