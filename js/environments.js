/**
 * ============================================================================
 * ARQVERTICE STUDIO — MÓDULO DE AMBIENTES E WORKSPACE DO AMBIENTE
 * Gestão de Ambientes, 11 Abas Técnicas, Versionamento Visual e Upload Classificado
 * ============================================================================
 */

/**
 * Renderiza a grade de ambientes de um projeto (aba AMBIENTES no Workspace do Projeto)
 * @param {Array} environments Lista de ambientes
 * @param {Object} project Projeto pai
 */
function renderEnvironmentsGrid(environments, project) {
  const envList = environments && environments.length > 0 ? environments : [];
  const projectActive = project || StudioState.getActiveProject();

  // Métricas rápidas dos ambientes
  const totalArea = envList.reduce((acc, e) => acc + (parseFloat(e.areaM2) || 0), 0);
  const approvedCount = envList.filter(e => e.status === 'Aprovado' || e.status === 'Finalizado').length;
  const inProgressCount = envList.filter(e => e.status === 'Em desenvolvimento' || e.status === 'Em revisão').length;
  const notStartedCount = envList.filter(e => e.status === 'Não iniciado').length;

  return `
    <div class="environments-container animate-fade-in">
      <!-- Barra Superior de Controle de Ambientes -->
      <div class="env-summary-bar">
        <div class="env-stats">
          <div class="env-stat-item">
            <span class="label">Total de Ambientes</span>
            <span class="value">${envList.length}</span>
          </div>
          <div class="env-stat-item">
            <span class="label">Área Total Mapeada</span>
            <span class="value">${totalArea.toFixed(2)} m²</span>
          </div>
          <div class="env-stat-item highlight-green">
            <span class="label">Aprovados</span>
            <span class="value">${approvedCount}</span>
          </div>
          <div class="env-stat-item highlight-blue">
            <span class="label">Em Desenvolvimento</span>
            <span class="value">${inProgressCount}</span>
          </div>
          <div class="env-stat-item highlight-gray">
            <span class="label">Não Iniciados</span>
            <span class="value">${notStartedCount}</span>
          </div>
        </div>

        <div class="env-actions">
          <button class="btn btn-primary" onclick="StudioApp.openNewEnvironmentModal('${projectActive.id}')">
            <i data-lucide="plus"></i>
            <span>Novo Ambiente</span>
          </button>
        </div>
      </div>

      <!-- Lista de Cards de Ambientes -->
      ${envList.length === 0 ? `
        <div class="empty-state-card">
          <div class="empty-icon-wrap">
            <i data-lucide="layout"></i>
          </div>
          <h3>Nenhum ambiente cadastrado ainda</h3>
          <p>Adicione os cômodos e setores do projeto (Sala, Cozinha, Suíte Master, etc.) para iniciar a modelagem 3D e controle de especificações.</p>
          <button class="btn btn-primary" onclick="StudioApp.openNewEnvironmentModal('${projectActive.id}')">
            <i data-lucide="plus"></i>
            <span>Cadastrar Primeiro Ambiente</span>
          </button>
        </div>
      ` : `
        <div class="environments-grid">
          ${envList.map(env => renderEnvironmentCard(env, projectActive)).join('')}
        </div>
      `}
    </div>
  `;
}

/**
 * Card individual de cada ambiente na listagem
 */
function renderEnvironmentCard(env, project) {
  const thumbUrl = env.approvedRenderUrl || (env.references && env.references[0] ? env.references[0].url : null) || 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=600&q=80';
  
  // Badge de status do ambiente
  const statusClasses = {
    'Não iniciado': 'status-not-started',
    'Em desenvolvimento': 'status-in-progress',
    'Em revisão': 'status-review',
    'Aprovado': 'status-completed',
    'Finalizado': 'status-finalized'
  };
  const badgeClass = statusClasses[env.status] || 'status-in-progress';

  return `
    <div class="env-card" id="card-${env.id}">
      <div class="env-card-media" onclick="StudioApp.openEnvironmentWorkspace('${env.id}')" title="Abrir Workspace do Ambiente">
        <img src="${thumbUrl}" alt="${escapeHTML(env.name)}" loading="lazy">
        <div class="env-media-overlay">
          <span class="env-type-pill">${escapeHTML(env.type || 'AMBIENTE')}</span>
          <span class="env-version-pill">${escapeHTML(env.currentVersion || 'V01')}</span>
        </div>
      </div>

      <div class="env-card-body">
        <div class="env-card-header">
          <div class="env-status-badge ${badgeClass}">
            <span class="status-dot"></span>
            <span>${escapeHTML(env.status)}</span>
          </div>
          <div class="env-card-menu dropdown">
            <button class="btn-icon btn-ghost" title="Opções do Ambiente" onclick="StudioApp.toggleDropdown('dropdown-${env.id}', event)">
              <i data-lucide="more-vertical"></i>
            </button>
            <div class="dropdown-menu" id="dropdown-${env.id}">
              <a href="javascript:void(0)" onclick="StudioApp.openEnvironmentVisualization('${env.id}')">
                <i data-lucide="sparkles"></i> Visualização 3D
              </a>
              <a href="javascript:void(0)" onclick="StudioApp.openEnvironmentWorkspace('${env.id}')">
                <i data-lucide="external-link"></i> Abrir Workspace
              </a>
              <a href="javascript:void(0)" onclick="StudioApp.openEditEnvironmentModal('${env.id}')">
                <i data-lucide="edit-2"></i> Editar Dados
              </a>
              <a href="javascript:void(0)" onclick="StudioApp.duplicateEnvironment('${env.id}')">
                <i data-lucide="copy"></i> Duplicar Ambiente
              </a>
              <hr class="dropdown-divider">
              <a href="javascript:void(0)" class="text-danger" onclick="StudioApp.archiveEnvironment('${env.id}')">
                <i data-lucide="archive"></i> Arquivar
              </a>
            </div>
          </div>
        </div>

        <h3 class="env-card-title" onclick="StudioApp.openEnvironmentWorkspace('${env.id}')" title="${escapeHTML(env.name)}">
          ${escapeHTML(env.name)}
        </h3>

        <div class="env-specs-row">
          <div class="env-spec">
            <i data-lucide="maximize-2"></i>
            <span>${env.areaM2 ? parseFloat(env.areaM2).toFixed(2) + ' m²' : '—'}</span>
          </div>
          <div class="env-spec">
            <i data-lucide="layers"></i>
            <span>${escapeHTML(env.floorLevel || 'Pavimento Único')}</span>
          </div>
          ${env.ceilingHeightM ? `
            <div class="env-spec">
              <i data-lucide="arrow-up-down"></i>
              <span>PD ${parseFloat(env.ceilingHeightM).toFixed(2)}m</span>
            </div>
          ` : ''}
        </div>

        <!-- Barra de Progresso Físico -->
        <div class="env-progress-section">
          <div class="env-progress-info">
            <span class="label">Progresso</span>
            <span class="value">${env.progress || 0}%</span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width: ${env.progress || 0}%;"></div>
          </div>
        </div>

        <div class="env-card-footer">
          <div class="env-updated">
            <i data-lucide="clock"></i>
            <span>${formatRelativeDate(env.updatedAt)}</span>
          </div>
          <div style="display: flex; gap: 6px; align-items: center;">
            <button class="btn btn-primary btn-sm" onclick="StudioApp.openEnvironmentVisualization('${env.id}')" title="Acessar Workspace de Visualização (D01)">
              <i data-lucide="sparkles"></i>
              <span>Visualização</span>
            </button>
            <button class="btn btn-outline btn-sm" onclick="StudioApp.openEnvironmentWorkspace('${env.id}')" title="Abrir Workspace">
              <i data-lucide="chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * ============================================================================
 * WORKSPACE DO AMBIENTE (TELA DEDICADA COM 11 ABAS)
 * ============================================================================
 */
function renderEnvironmentWorkspace() {
  const container = document.getElementById('view-container');
  if (!container) return;

  const env = StudioState.getActiveEnvironment();
  if (!env) {
    container.innerHTML = `
      <div class="empty-state-card">
        <h3>Ambiente não encontrado</h3>
        <p>Selecione um ambiente válido através do Workspace do Projeto.</p>
        <button class="btn btn-primary" onclick="StudioApp.navigateTo('workspace', StudioState.data.selectedProjectId, 'ambientes')">
          Voltar para Ambientes
        </button>
      </div>
    `;
    return;
  }

  const project = StudioState.data.projects.find(p => p.id === env.projectId) || StudioState.getActiveProject();
  const currentTab = StudioState.data.activeEnvironmentTab || 'resumo';

  // Abas do Workspace do Ambiente (Incluindo D01: VISUALIZAÇÃO)
  const envTabs = [
    { key: 'visualizacao',  label: 'VISUALIZAÇÃO',  icon: 'sparkles' },
    { key: 'resumo',        label: 'RESUMO',        icon: 'file-text' },
    { key: 'referencias',   label: 'REFERÊNCIAS',   icon: 'image' },
    { key: 'planta',        label: 'PLANTA',        icon: 'map' },
    { key: 'perspectivas',  label: 'PERSPECTIVAS',  icon: 'box' },
    { key: 'cameras',       label: 'CÂMERAS',       icon: 'camera' },
    { key: 'renders',       label: 'RENDERS',       icon: 'sparkles' },
    { key: 'moveis',        label: 'MÓVEIS',        icon: 'armchair' },
    { key: 'materiais',     label: 'MATERIAIS',     icon: 'palette' },
    { key: 'quantitativos', label: 'QUANTITATIVOS', icon: 'calculator' },
    { key: 'moodboard',     label: 'MOODBOARD',     icon: 'grid' },
    { key: 'especificacoes',label: 'ESPECIFICAÇÕES',icon: 'book-open' },
    { key: 'revisoes',      label: 'REVISÕES',      icon: 'history' },
    { key: 'memoria',       label: 'MEMÓRIA',       icon: 'cpu' }
  ];

  container.innerHTML = `
    <div class="env-workspace-view animate-fade-in">
      <!-- Breadcrumb de Navegação Hierárquica -->
      <nav class="breadcrumb-nav">
        <a href="javascript:void(0)" onclick="StudioApp.navigateTo('projects')">
          <i data-lucide="briefcase"></i> Projetos
        </a>
        <span class="separator"><i data-lucide="chevron-right"></i></span>
        <a href="javascript:void(0)" onclick="StudioApp.navigateTo('workspace', '${project.id}', 'ambientes')">
          ${escapeHTML(project.name)}
        </a>
        <span class="separator"><i data-lucide="chevron-right"></i></span>
        <a href="javascript:void(0)" onclick="StudioApp.navigateTo('workspace', '${project.id}', 'ambientes')">
          Ambientes
        </a>
        <span class="separator"><i data-lucide="chevron-right"></i></span>
        <span class="current">${escapeHTML(env.name)}</span>
      </nav>

      <!-- CABEÇALHO DO WORKSPACE DO AMBIENTE (Prompt A04 item 8) -->
      <header class="env-ws-header">
        <div class="env-ws-title-area">
          <div class="env-ws-tags">
            <span class="badge-tag">${escapeHTML(env.type || 'AMBIENTE')}</span>
            <span class="badge-project"><i data-lucide="folder"></i> ${escapeHTML(project.name)}</span>
            <div class="badge-status-pill ${getEnvStatusClass(env.status)}">
              <span class="dot"></span>
              <span>${escapeHTML(env.status)}</span>
            </div>
          </div>
          <h1 class="env-ws-title">${escapeHTML(env.name)}</h1>
          <div class="env-ws-meta">
            <span><i data-lucide="maximize-2"></i> ${env.areaM2 ? parseFloat(env.areaM2).toFixed(2) + ' m²' : '—'}</span>
            <span><i data-lucide="layers"></i> ${escapeHTML(env.floorLevel || 'Térreo')}</span>
            <span><i data-lucide="git-commit"></i> Versão: <strong>${escapeHTML(env.currentVersion || 'V01')}</strong></span>
            <span><i data-lucide="clock"></i> Última Atualização: ${formatDateBR(env.updatedAt || new Date().toISOString())}</span>
          </div>
        </div>

        <div class="env-ws-actions">
          <!-- Histórico Rápido de Versões (Prompt A04 item 11) -->
          <div class="version-selector-group">
            <span class="label">Versão Ativa:</span>
            <select class="form-select select-sm" onchange="StudioApp.changeEnvironmentVersion('${env.id}', this.value)">
              ${(env.versions || [
                { version: 'V01', status: 'Descartado' },
                { version: 'V02', status: 'Em Revisão' },
                { version: 'V03', status: 'Aprovado' }
              ]).map(v => `
                <option value="${v.version}" ${v.version === env.currentVersion ? 'selected' : ''}>
                  ${v.version} ${v.status === 'Aprovado' ? '★ APROVADA' : `(${v.status})`}
                </option>
              `).join('')}
            </select>
          </div>

          <button class="btn btn-outline" onclick="StudioApp.openUploadModal('${project.id}', '${env.id}', '${env.currentVersion || 'V01'}')">
            <i data-lucide="upload-cloud"></i>
            <span>Upload Classificado</span>
          </button>
          <button class="btn btn-secondary" onclick="StudioApp.openEditEnvironmentModal('${env.id}')">
            <i data-lucide="edit"></i>
            <span>Editar</span>
          </button>
        </div>
      </header>

      <!-- BARRA DE NAVEGAÇÃO DAS 11 ABAS (Prompt A04 item 8) -->
      <nav class="env-tabs-bar">
        <div class="env-tabs-track">
          ${envTabs.map(t => `
            <button 
              class="env-tab-btn ${currentTab === t.key ? 'active' : ''}" 
              onclick="StudioApp.setEnvironmentTab('${t.key}')"
              title="Aba ${t.label}"
            >
              <i data-lucide="${t.icon}"></i>
              <span>${t.label}</span>
            </button>
          `).join('')}
        </div>
      </nav>

      <!-- ÁREA DE CONTEÚDO DA ABA SELECIONADA -->
      <main class="env-tab-content" id="env-tab-content">
        ${renderEnvironmentTabContent(currentTab, env, project)}
      </main>
    </div>
  `;
}

/**
 * Roteamento do conteúdo da aba ativa do Workspace do Ambiente
 */
function renderEnvironmentTabContent(tab, env, project) {
  switch (tab) {
    case 'visualizacao':
      return typeof EnvironmentVisualizationModule !== 'undefined'
        ? EnvironmentVisualizationModule.render(env, project)
        : '<div class="empty-state-card"><p>Módulo de visualização não carregado.</p></div>';
    case 'resumo':
      return renderEnvSummaryTab(env, project);
    case 'referencias':
      return renderEnvReferencesTab(env, project);
    case 'planta':
      return renderEnvPlantaTab(env, project);
    case 'perspectivas':
      return renderEnvPerspectivasTab(env, project);
    case 'cameras':
      return renderEnvCamerasTab(env, project);
    case 'renders':
      return renderEnvRendersTab(env, project);
    case 'moveis':
      return renderEnvFurnitureTab(env, project);
    case 'materiais':
      return renderEnvMaterialsTab(env, project);
    case 'quantitativos':
      return renderEnvQuantitativosTab(env, project);
    case 'moodboard':
      return renderEnvMoodboardTab(env, project);
    case 'especificacoes':
      return window.SpecificationBookModule ? SpecificationBookModule.renderEnvironmentTab(env, project) : `<div>Módulo de Especificações não carregado.</div>`;
    case 'revisoes':
      return renderEnvRevisoesTab(env, project);
    case 'memoria':
      return renderEnvMemoriaTab(env, project);
    default:
      return renderEnvSummaryTab(env, project);
  }
}

/**
 * ============================================================================
 * ABA 1: RESUMO DO AMBIENTE (Prompt A04 item 9)
 * Exibir: descrição, área, objetivo, estilo, status, referências principais,
 * render aprovado, pendências, última decisão.
 * ============================================================================
 */
function renderEnvSummaryTab(env, project) {
  const approvedRender = env.approvedRenderUrl || 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80';
  const locks = env.locks || {
    geometry: true,
    layout: true,
    camera: true,
    openings: true,
    materials: true,
    lighting: false,
    furniture: true,
    decor: false,
    landscape: true
  };

  return `
    <div class="env-summary-layout animate-fade-in">
      <!-- Coluna Esquerda: Render Aprovado e Informações Principais -->
      <div class="env-summary-main">
        <!-- Card do Render Homologado / Perspectiva Principal -->
        <div class="render-spotlight-card">
          <div class="spotlight-header">
            <div class="spotlight-badge">
              <i data-lucide="sparkles"></i>
              <span>RENDER APROVADO / VERSÃO HOMOLOGADA</span>
            </div>
            <div class="spotlight-meta">
              <span class="version-tag">${escapeHTML(env.currentVersion || 'V01')}</span>
              <span class="date-tag"><i data-lucide="calendar"></i> ${formatDateBR(env.updatedAt)}</span>
            </div>
          </div>
          <div class="spotlight-image-wrap">
            <img src="${approvedRender}" alt="Render Aprovado de ${escapeHTML(env.name)}" id="spotlight-render-img">
            <div class="spotlight-actions">
              <button class="btn btn-glass btn-sm" onclick="StudioApp.openLightbox('${approvedRender}', 'Render Aprovado — ${escapeHTML(env.name)}')">
                <i data-lucide="maximize"></i> Tela Cheia
              </button>
              <button class="btn btn-glass btn-sm" onclick="StudioApp.openUploadModal('${project.id}', '${env.id}', '${env.currentVersion || 'V01'}', 'render')">
                <i data-lucide="refresh-cw"></i> Nova Versão
              </button>
            </div>
          </div>
        </div>

        <!-- Descrição, Objetivo e Estilo -->
        <div class="summary-details-grid">
          <div class="detail-card">
            <div class="card-title-icon">
              <i data-lucide="info"></i>
              <h3>Descrição Arquitetônica</h3>
            </div>
            <p class="detail-text">${escapeHTML(env.description || 'Nenhuma descrição arquitetônica cadastrada.')}</p>
          </div>

          <div class="detail-card">
            <div class="card-title-icon">
              <i data-lucide="target"></i>
              <h3>Objetivo do Ambiente</h3>
            </div>
            <p class="detail-text">${escapeHTML(env.objective || 'Proporcionar conforto visual e espacial aos moradores.')}</p>
          </div>
        </div>

        <!-- Última Decisão e Pendências -->
        <div class="decisions-pending-grid">
          <div class="decision-card highlight-decision">
            <div class="card-title-icon">
              <i data-lucide="check-circle-2"></i>
              <h3>Última Decisão Homologada</h3>
            </div>
            <div class="decision-content">
              <p>${escapeHTML(env.lastDecision || 'Nenhuma decisão registrada recentemente.')}</p>
              <span class="decision-time"><i data-lucide="clock"></i> Registrada em ${formatDateBR(env.updatedAt)}</span>
            </div>
          </div>

          <div class="pending-card highlight-pending">
            <div class="card-title-icon">
              <i data-lucide="alert-circle"></i>
              <h3>Pendências & Próximas Ações (${env.pendingIssues ? env.pendingIssues.length : 0})</h3>
            </div>
            <div class="pending-list">
              ${env.pendingIssues && env.pendingIssues.length > 0 ? `
                <ul>
                  ${env.pendingIssues.map((p, idx) => `
                    <li>
                      <i data-lucide="circle-dot"></i>
                      <span>${escapeHTML(p)}</span>
                      <button class="btn-icon btn-tiny" title="Marcar como resolvida" onclick="StudioApp.resolvePendingIssue('${env.id}', ${idx})">
                        <i data-lucide="check"></i>
                      </button>
                    </li>
                  `).join('')}
                </ul>
              ` : `
                <div class="empty-pending">
                  <i data-lucide="check"></i>
                  <span>Nenhuma pendência crítica em aberto.</span>
                </div>
              `}
              <div class="add-pending-row">
                <input type="text" id="new-pending-input-${env.id}" placeholder="Adicionar nova pendência técnica..." onkeydown="if(event.key==='Enter')StudioApp.addPendingIssue('${env.id}')">
                <button class="btn btn-secondary btn-sm" onclick="StudioApp.addPendingIssue('${env.id}')">Adicionar</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Coluna Direita: Ficha Técnica, Locks e Referências Principais -->
      <aside class="env-summary-sidebar">
        <!-- Ficha Técnica Rápida -->
        <div class="sidebar-box specs-box">
          <h4 class="sidebar-box-title">
            <i data-lucide="sliders"></i>
            <span>Ficha do Ambiente</span>
          </h4>
          <div class="spec-table">
            <div class="spec-row">
              <span class="label">Área Líquida:</span>
              <span class="val font-mono">${env.areaM2 ? parseFloat(env.areaM2).toFixed(2) + ' m²' : '—'}</span>
            </div>
            <div class="spec-row">
              <span class="label">Pé-Direito:</span>
              <span class="val font-mono">${env.ceilingHeightM ? parseFloat(env.ceilingHeightM).toFixed(2) + ' m' : 'Sob consulta'}</span>
            </div>
            <div class="spec-row">
              <span class="label">Pavimento:</span>
              <span class="val">${escapeHTML(env.floorLevel || 'Térreo')}</span>
            </div>
            <div class="spec-row">
              <span class="label">Estilo:</span>
              <span class="val badge-style">${escapeHTML(env.style || 'Contemporâneo')}</span>
            </div>
            <div class="spec-row">
              <span class="label">Status:</span>
              <span class="val badge-status">${escapeHTML(env.status)}</span>
            </div>
            <div class="spec-row">
              <span class="label">Avanço Físico:</span>
              <span class="val font-mono">${env.progress || 0}%</span>
            </div>
          </div>
        </div>

        <!-- Trava de Consistência (AI Consistency Locks) -->
        <div class="sidebar-box locks-box">
          <div class="locks-header">
            <h4 class="sidebar-box-title">
              <i data-lucide="shield-check"></i>
              <span>Travas de Consistência</span>
            </h4>
            <span class="hint-tag" title="Elementos travados para proteger a estabilidade do 3D e renderização">Travas IA</span>
          </div>
          <p class="locks-desc">Controla quais elementos estão congelados contra alterações involuntárias nas iterações de render.</p>
          <div class="locks-grid">
            ${[
              { key: 'geometry',  label: 'Geometria',   icon: 'box' },
              { key: 'layout',    label: 'Layout',      icon: 'layout' },
              { key: 'camera',    label: 'Câmera',      icon: 'camera' },
              { key: 'openings',  label: 'Aberturas',   icon: 'columns' },
              { key: 'materials', label: 'Materiais',   icon: 'palette' },
              { key: 'lighting',  label: 'Iluminação',  icon: 'sun' },
              { key: 'furniture', label: 'Mobiliário',  icon: 'armchair' },
              { key: 'decor',     label: 'Decoração',   icon: 'flower' },
              { key: 'landscape', label: 'Paisagismo',  icon: 'trees' }
            ].map(l => {
              const isLocked = locks[l.key] !== false;
              return `
                <button 
                  class="lock-item ${isLocked ? 'is-locked' : 'is-unlocked'}" 
                  onclick="StudioApp.toggleEnvLock('${env.id}', '${l.key}')"
                  title="${isLocked ? 'Travado (Clique para destravar)' : 'Destravado (Clique para travar)'}"
                >
                  <i data-lucide="${isLocked ? 'lock' : 'unlock'}"></i>
                  <span>${l.label}</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Referências Principais -->
        <div class="sidebar-box refs-box">
          <div class="refs-header">
            <h4 class="sidebar-box-title">
              <i data-lucide="image"></i>
              <span>Referências Principais</span>
            </h4>
            <button class="btn-link" onclick="StudioApp.setEnvironmentTab('referencias')">Ver todas</button>
          </div>
          <div class="refs-thumbs-grid">
            ${env.references && env.references.length > 0 ? env.references.map(r => `
              <div class="ref-thumb" onclick="StudioApp.openLightbox('${r.url}', '${escapeHTML(r.title)}')">
                <img src="${r.url}" alt="${escapeHTML(r.title)}" loading="lazy">
                <span class="ref-label">${escapeHTML(r.title)}</span>
              </div>
            `).join('') : `
              <p class="empty-text">Nenhuma referência adicionada.</p>
            `}
          </div>
        </div>
      </aside>
    </div>
  `;
}

/**
 * ============================================================================
 * ABA 2: REFERÊNCIAS
 * ============================================================================
 */
function renderEnvReferencesTab(env, project) {
  const refs = env.references || [];
  return `
    <div class="env-tab-pane animate-fade-in">
      <div class="pane-header">
        <div>
          <h2>Banco de Referências Visuais</h2>
          <p>Imagens inspiracionais, catálogos e referências cromáticas para a concepção deste ambiente.</p>
        </div>
        <button class="btn btn-primary" onclick="StudioApp.openUploadModal('${project.id}', '${env.id}', '${env.currentVersion || 'V01'}', 'referencia')">
          <i data-lucide="plus"></i>
          <span>Adicionar Referência</span>
        </button>
      </div>

      <div class="gallery-grid">
        ${refs.map(r => `
          <div class="gallery-card">
            <div class="gallery-img-wrap" onclick="StudioApp.openLightbox('${r.url}', '${escapeHTML(r.title)}')">
              <img src="${r.url}" alt="${escapeHTML(r.title)}" loading="lazy">
              <span class="gallery-badge">${escapeHTML(r.category || 'Referência')}</span>
            </div>
            <div class="gallery-info">
              <h4>${escapeHTML(r.title)}</h4>
              <div class="gallery-actions">
                <button class="btn-icon btn-ghost" title="Ampliar" onclick="StudioApp.openLightbox('${r.url}', '${escapeHTML(r.title)}')">
                  <i data-lucide="maximize-2"></i>
                </button>
                <button class="btn-icon btn-ghost text-danger" title="Remover" onclick="StudioApp.removeEnvReference('${env.id}', '${escapeHTML(r.title)}')">
                  <i data-lucide="trash-2"></i>
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * ============================================================================
 * ABA 3: PLANTA
 * ============================================================================
 */
function renderEnvPlantaTab(env, project) {
  return `
    <div class="env-tab-pane animate-fade-in">
      <div class="pane-header">
        <div>
          <h2>Plantas Baixas e Layout Técnico</h2>
          <p>Desenhos técnicos, cotas, instalações e diagramação de layout do ambiente.</p>
        </div>
        <button class="btn btn-primary" onclick="StudioApp.openUploadModal('${project.id}', '${env.id}', '${env.currentVersion || 'V01'}', 'planta')">
          <i data-lucide="upload"></i>
          <span>Upload de Planta (DWG / PDF / Imagem)</span>
        </button>
      </div>

      <div class="technical-drawing-viewer">
        <div class="viewer-canvas">
          <img src="https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80" alt="Planta Baixa">
          <div class="canvas-controls">
            <button class="btn-icon btn-glass" title="Zoom In"><i data-lucide="zoom-in"></i></button>
            <button class="btn-icon btn-glass" title="Zoom Out"><i data-lucide="zoom-out"></i></button>
            <button class="btn-icon btn-glass" title="Enquadrar"><i data-lucide="scan"></i></button>
          </div>
        </div>
        <div class="viewer-specs-sidebar">
          <h3>Metadados da Planta</h3>
          <div class="meta-row"><span class="label">Escala:</span><span class="val">1:50</span></div>
          <div class="meta-row"><span class="label">Área Líquida:</span><span class="val">${env.areaM2} m²</span></div>
          <div class="meta-row"><span class="label">Última Revisão:</span><span class="val">${formatDateBR(env.updatedAt)}</span></div>
          <div class="meta-row"><span class="label">Origem:</span><span class="val">Autodesk Revit 2026</span></div>
        </div>
      </div>
    </div>
  `;
}

/**
 * ============================================================================
 * ABA 4: PERSPECTIVAS
 * ============================================================================
 */
function renderEnvPerspectivasTab(env, project) {
  return `
    <div class="env-tab-pane animate-fade-in">
      <div class="pane-header">
        <div>
          <h2>Perspectivas 3D em Estudo</h2>
          <p>Vistas volumétricas, wireframes e estudos de proporção espacial.</p>
        </div>
        <button class="btn btn-primary" onclick="StudioApp.openUploadModal('${project.id}', '${env.id}', '${env.currentVersion || 'V01'}', 'perspectiva')">
          <i data-lucide="upload"></i>
          <span>Upload de Perspectiva</span>
        </button>
      </div>

      <div class="gallery-grid">
        <div class="gallery-card">
          <div class="gallery-img-wrap" onclick="StudioApp.openLightbox('${env.approvedRenderUrl}', 'Perspectiva Frontal')">
            <img src="${env.approvedRenderUrl || 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80'}" alt="Perspectiva">
            <span class="gallery-badge">Perspectiva Frontal</span>
          </div>
          <div class="gallery-info">
            <h4>Enquadramento Geral de Acesso</h4>
            <span class="text-muted">Câmera 01 • Lente 28mm</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * ============================================================================
 * ABA 5: CÂMERAS
 * ============================================================================
 */
function renderEnvCamerasTab(env, project) {
  return `
    <div class="env-tab-pane animate-fade-in">
      <div class="pane-header">
        <div>
          <h2>Posições de Câmeras & Enquadramentos</h2>
          <p>Pontos de vista homologados para renderização e consistência entre versões.</p>
        </div>
        <button class="btn btn-secondary" onclick="StudioApp.addNewCamera('${env.id}')">
          <i data-lucide="plus"></i>
          <span>Nova Câmera Homologada</span>
        </button>
      </div>

      <div class="cameras-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Identificador</th>
              <th>Nome / Descrição</th>
              <th>Altura Focal</th>
              <th>Elevação (Z)</th>
              <th>Alvo (Target)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span class="code-badge">CAM-01</span></td>
              <td><strong>Vista Principal do Deck</strong></td>
              <td>28mm (Grande Angular)</td>
              <td>1.45m</td>
              <td>Mesa Central de Jantar</td>
              <td><span class="badge-status-pill status-completed">Homologada</span></td>
            </tr>
            <tr>
              <td><span class="code-badge">CAM-02</span></td>
              <td><strong>Corte Axonométrico Social</strong></td>
              <td>50mm (Perspectiva Natural)</td>
              <td>1.60m</td>
              <td>Painel Ripado</td>
              <td><span class="badge-status-pill status-completed">Homologada</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * ============================================================================
 * ABA 6: RENDERS
 * ============================================================================
 */
function renderEnvRendersTab(env, project) {
  return `
    <div class="env-tab-pane animate-fade-in">
      <div class="pane-header">
        <div>
          <h2>Galeria de Renders de Alta Resolução</h2>
          <p>Renderizações foto-realistas geradas pelo motor 3D / Corona / V-Ray / D5.</p>
        </div>
        <button class="btn btn-primary" onclick="StudioApp.openUploadModal('${project.id}', '${env.id}', '${env.currentVersion || 'V01'}', 'render')">
          <i data-lucide="upload-cloud"></i>
          <span>Upload de Render</span>
        </button>
      </div>

      <div class="gallery-grid">
        <div class="gallery-card is-approved">
          <div class="gallery-img-wrap" onclick="StudioApp.openLightbox('${env.approvedRenderUrl}', 'Render Homologado')">
            <img src="${env.approvedRenderUrl || 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80'}" alt="Render">
            <span class="gallery-badge approved"><i data-lucide="check"></i> APROVADO PELO CLIENTE</span>
          </div>
          <div class="gallery-info">
            <h4>${escapeHTML(env.name)} — ${env.currentVersion || 'V03'}</h4>
            <div class="gallery-meta">
              <span>3840 x 2160 (4K UHD)</span>
              <span>18-08-2026</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * ============================================================================
 * ABA 7: MÓVEIS
 * ============================================================================
 */
function renderEnvFurnitureTab(env, project) {
  setTimeout(() => {
    if (typeof FurnitureSystemModule !== 'undefined') {
      FurnitureSystemModule.renderEnvironmentFurniture('furniture-tab-content', env.id);
    }
  }, 50);

  return `
    <div class="env-tab-pane animate-fade-in">
      <div class="pane-header">
        <div>
          <h2>Mobiliário, Marcenaria, Equipamentos & Decoração (Bloco E01)</h2>
          <p>Especificação técnica por ambiente, rastreamento de origens, conjuntos e aprovação.</p>
        </div>
      </div>

      <div id="furniture-tab-content">
        <div class="loading-state-card" style="padding: 24px; text-align: center; color: var(--text-muted);">
          Carregando especificação técnica de mobiliário...
        </div>
      </div>
    </div>
  `;
}

/**
 * ============================================================================
 * ABA 8: MATERIAIS
 * ============================================================================
 */
function renderEnvMaterialsTab(env, project) {
  setTimeout(() => {
    if (typeof MaterialsSystemModule !== 'undefined') {
      MaterialsSystemModule.renderEnvironmentMaterials('materials-tab-content', env.id);
    }
  }, 50);

  return `
    <div class="env-tab-pane animate-fade-in">
      <div class="pane-header">
        <div>
          <h2>Materiais, Revestimentos & Especificações (Bloco E02)</h2>
          <p>Organização técnica por ambiente, conceito vs produto, fabricantes, fornecedores e amostras.</p>
        </div>
      </div>

      <div id="materials-tab-content">
        <div class="loading-state-card" style="padding: 24px; text-align: center; color: var(--text-muted);">
          Carregando especificações técnicas de materiais e revestimentos...
        </div>
      </div>
    </div>
  `;
}

/**
 * ============================================================================
 * ABA: QUANTITATIVOS (Bloco E03)
 * ============================================================================
 */
function renderEnvQuantitativosTab(env, project) {
  if (typeof QuantitySystemModule !== 'undefined' && QuantitySystemModule.renderEnvironmentQuantities) {
    return QuantitySystemModule.renderEnvironmentQuantities(env, project);
  }
  return '<div class="empty-state-card"><p>Módulo de quantitativos não carregado.</p></div>';
}

/**
 * ============================================================================
 * ABA 9: MOODBOARD
 * ============================================================================
 */
function renderEnvMoodboardTab(env, project) {
  if (window.MoodboardSystemModule) {
    return MoodboardSystemModule.render(env, project);
  }
  return `
    <div class="env-tab-pane animate-fade-in p-4">
      <h2>Moodboard do Ambiente</h2>
      <p class="text-muted">Módulo de Moodboard não carregado.</p>
    </div>
  `;
}

/**
 * ============================================================================
 * ABA 10: REVISÕES DO AMBIENTE (Prompt A04 item 11)
 * Histórico de Versões V01, V02, V03, V04 APROVADA
 * ============================================================================
 */
function renderEnvRevisoesTab(env, project) {
  const versions = env.versions || [
    { version: 'V01', date: '2026-07-20', status: 'Descartado', note: 'Primeiro estudo volumétrico com layout fechado.' },
    { version: 'V02', date: '2026-08-05', status: 'Em Revisão', note: 'Integração aberta com deck e cozinha gourmet.' },
    { version: 'V03', date: '2026-08-18', status: 'Aprovado', note: 'Versão homologada pelo cliente Pedro com materiais naturais.' }
  ];

  return `
    <div class="env-tab-pane animate-fade-in">
      <div class="pane-header">
        <div>
          <h2>Histórico de Versões & Iterações Visuais</h2>
          <p>Acompanhe a linha do tempo de evolução do ambiente desde o primeiro estudo até a versão homologada.</p>
        </div>
        <button class="btn btn-primary" onclick="StudioApp.createNewVersion('${env.id}')">
          <i data-lucide="git-branch"></i>
          <span>Criar Nova Iteração (Versão)</span>
        </button>
      </div>

      <div class="version-timeline">
        ${versions.map((v, i) => `
          <div class="timeline-step ${v.status === 'Aprovado' ? 'is-approved' : ''}">
            <div class="timeline-marker">
              <span class="version-badge">${v.version}</span>
            </div>
            <div class="timeline-content-card">
              <div class="timeline-header">
                <div class="timeline-title-wrap">
                  <h3>Iteração ${v.version} ${v.status === 'Aprovado' ? '— Versão Aprovada' : ''}</h3>
                  <span class="timeline-date"><i data-lucide="calendar"></i> ${formatDateBR(v.date)}</span>
                </div>
                <div class="timeline-status">
                  <span class="badge-status-pill ${v.status === 'Aprovado' ? 'status-completed' : 'status-review'}">${v.status}</span>
                </div>
              </div>
              <p class="timeline-note">${escapeHTML(v.note)}</p>
              <div class="timeline-footer">
                <button class="btn btn-outline btn-sm" onclick="StudioApp.changeEnvironmentVersion('${env.id}', '${v.version}')">
                  <i data-lucide="eye"></i>
                  <span>Ativar no Workspace</span>
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * ============================================================================
 * ABA 11: MEMÓRIA
 * ============================================================================
 */
function renderEnvMemoriaTab(env, project) {
  return `
    <div class="env-tab-pane animate-fade-in">
      <div class="pane-header">
        <div>
          <h2>Memória de Decisões e Histórico Técnico</h2>
          <p>Registro imutável de todas as alterações, alinhamentos com cliente e notas de reunião.</p>
        </div>
        <button class="btn btn-secondary" onclick="StudioApp.addMemoryRecord('${env.id}')">
          <i data-lucide="plus"></i>
          <span>Registrar Nota na Memória</span>
        </button>
      </div>

      <div class="memory-log-list">
        <div class="memory-log-item">
          <div class="memory-icon"><i data-lucide="check-circle"></i></div>
          <div class="memory-body">
            <div class="memory-header">
              <strong>Homologação pelo Cliente</strong>
              <span class="time">${formatDateBR(env.updatedAt)}</span>
            </div>
            <p>${escapeHTML(env.lastDecision || 'Homologação do layout integrado e definição dos acabamentos de marcenaria.')}</p>
            <div class="memory-meta">Autor: Eduardo Marques • Registro Canônico</div>
          </div>
        </div>

        <div class="memory-log-item">
          <div class="memory-icon"><i data-lucide="lock"></i></div>
          <div class="memory-body">
            <div class="memory-header">
              <strong>Congelamento de Geometria e Aberturas</strong>
              <span class="time">05-08-2026</span>
            </div>
            <p>Vãos de esquadrias e alvenarias de fechamento aprovadas no projeto estrutural e de fôrmas.</p>
            <div class="memory-meta">Autor: Luan Almeida • Validação Técnica</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Helper de classe de status do ambiente
 */
function getEnvStatusClass(status) {
  switch (status) {
    case 'Aprovado':
    case 'Finalizado':
      return 'status-completed';
    case 'Em desenvolvimento':
      return 'status-in-progress';
    case 'Em revisão':
      return 'status-review';
    case 'Não iniciado':
    default:
      return 'status-not-started';
  }
}
