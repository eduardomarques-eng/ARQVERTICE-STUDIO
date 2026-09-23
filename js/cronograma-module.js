/**
 * ============================================================================
 * ARQVERTICE STUDIO — MÓDULO DE CRONOGRAMA INTEGRADO
 * Preserva integralmente o cronograma multidisciplinar original (Kanban, Tabela,
 * Fases "Estamos Aqui", Equipe Técnica, KPIs, Filtros e Relatório Executivo em PDF).
 * ============================================================================
 */

// Disciplinas do empreendimento ArqVértice
const PHASE_MODEL = [
  { key: 'arq',  disciplina: 'Arquitetura',    nome: 'Arquitetura',        icon: 'pencil-ruler', resumo: 'Estudo preliminar, projeto básico e executivo' },
  { key: '3d',   disciplina: '3D',             nome: 'Projeto 3D',         icon: 'box',          resumo: 'Modelagem tridimensional e imagens finais' },
  { key: 'est',  disciplina: 'Estrutura',      nome: 'Projeto Estrutural', icon: 'frame',        resumo: 'Fundação, formas e armaduras' },
  { key: 'comp', disciplina: 'Complementares', nome: 'Complementares',     icon: 'zap',          resumo: 'Elétrico e hidrossanitário (água, esgoto e drenagem)' },
  { key: 'obr',  disciplina: 'Obras',          nome: 'Execução da Obra',   icon: 'hard-hat',     resumo: 'Canteiro, execução e acompanhamento em campo' }
];

// Equipe técnica
const TEAM_ROSTER = [
  { nome: 'Eduardo Marques', iniciais: 'EM', cargo: 'Arquiteto Projetista',  discKey: 'arq', avatarClass: 'avatar-eduardo' },
  { nome: 'Luan Almeida',    iniciais: 'LA', cargo: 'Engenheiro Calculista', discKey: 'est', avatarClass: 'avatar-luan' },
  { nome: 'Erick Santiago',  iniciais: 'ES', cargo: 'Engenheiro de Obra',    discKey: 'obr', avatarClass: 'avatar-erick' }
];

// Estado local do módulo de cronograma
const CronoState = {
  viewMode: 'kanban', // 'kanban' ou 'table'
  filterDisciplina: 'all',
  filterStatus: 'all',
  filterResponsavel: 'all',
  searchQuery: '',
  draggedTaskId: null
};

function getDisciplinaKey(disciplina) {
  const model = PHASE_MODEL.find(m => m.disciplina === disciplina);
  return model ? model.key : 'arq';
}

function averagePercent(tasks) {
  if (!tasks || tasks.length === 0) return 0;
  const sum = tasks.reduce((acc, t) => acc + (Number(t.porcentagem) || 0), 0);
  return Math.round(sum / tasks.length);
}

function parseDateBR(dateStr) {
  if (!dateStr) return new Date();
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts[0].length === 4) return new Date(parts[0], parts[1] - 1, parts[2]);
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }
  return new Date();
}

function formatDateBR(dateStr) {
  if (!dateStr) return 'Não definida';
  if (typeof window !== 'undefined' && window.formatDateBR) return window.formatDateBR(dateStr);
  return String(dateStr);
}

function escapeHTML(str) {
  if (!str) return '';
  if (typeof window !== 'undefined' && window.escapeHTML) return window.escapeHTML(str);
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getDaysRemaining(dataConclusaoStr) {
  if (!dataConclusaoStr) return 0;
  const target = parseDateBR(dataConclusaoStr);
  const now = new Date();
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function calculateStatus(porcentagem) {
  const p = Number(porcentagem) || 0;
  if (p === 0) return 'Não Iniciado';
  if (p === 100) return 'Concluído';
  return 'Em Andamento';
}

/**
 * Renderiza a visualização do cronograma no contexto de um projeto (ou visão global)
 * @param {Object} project Projeto contextualizado (ou null para visão geral)
 * @param {Array} tasks Lista de tarefas (opcional, defaults to tasks do projeto)
 */
function renderIntegratedCronograma(project, tasks) {
  const projectActive = project || StudioState.getActiveProject();
  const allProjectTasks = tasks || StudioState.getProjectTasks(projectActive ? projectActive.id : null);
  
  // Cálculo de Fases "Estamos Aqui"
  const phases = PHASE_MODEL.map(model => {
    const pTasks = allProjectTasks.filter(t => t.disciplina_projeto === model.disciplina);
    const pct = averagePercent(pTasks);
    const concluidas = pTasks.filter(t => (Number(t.porcentagem) || 0) === 100).length;
    let estado = 'Aguardando';
    if (pTasks.length > 0 && pct >= 100) estado = 'Concluída';
    else if (pct > 0) estado = 'Em Andamento';
    return { ...model, tasks: pTasks, pct, concluidas, total: pTasks.length, estado, atual: false };
  });

  const comEtapas = phases.filter(f => f.total > 0);
  const faseAtual = comEtapas.find(f => f.pct < 100) || comEtapas[comEtapas.length - 1];
  if (faseAtual) faseAtual.atual = true;

  // KPIs
  const totalTasks = allProjectTasks.length;
  const avgProgress = averagePercent(allProjectTasks);
  const completedTasks = allProjectTasks.filter(t => (Number(t.porcentagem) || 0) === 100).length;
  const inProgressTasks = allProjectTasks.filter(t => {
    const p = Number(t.porcentagem) || 0;
    return p > 0 && p < 100;
  }).length;
  const notStartedTasks = allProjectTasks.filter(t => (Number(t.porcentagem) || 0) === 0).length;
  const lateTasks = allProjectTasks.filter(t => {
    if ((Number(t.porcentagem) || 0) === 100) return false;
    return getDaysRemaining(t.data_conclusao) < 0;
  }).length;

  // Filtros aplicados às tarefas
  let filtered = [...allProjectTasks];
  if (CronoState.filterDisciplina !== 'all') {
    filtered = filtered.filter(t => t.disciplina_projeto === CronoState.filterDisciplina);
  }
  if (CronoState.filterStatus !== 'all') {
    filtered = filtered.filter(t => calculateStatus(t.porcentagem) === CronoState.filterStatus);
  }
  if (CronoState.filterResponsavel !== 'all') {
    filtered = filtered.filter(t => t.responsavel === CronoState.filterResponsavel);
  }
  if (CronoState.searchQuery && CronoState.searchQuery.trim() !== '') {
    const q = CronoState.searchQuery.toLowerCase().trim();
    filtered = filtered.filter(t => 
      (t.nome_tarefa && t.nome_tarefa.toLowerCase().includes(q)) ||
      (t.descricao && t.descricao.toLowerCase().includes(q)) ||
      (t.responsavel && t.responsavel.toLowerCase().includes(q))
    );
  }

  return `
    <div class="cronograma-module-wrap animate-fade-in">
      <!-- FAIXA DE FASES (Estamos Aqui) -->
      <section class="crono-phases-strip">
        <div class="phases-strip-header">
          <div class="strip-title-wrap">
            <span class="badge-tag">FLUXO EXECUTIVO</span>
            <h3>Jornada de Entregas do Empreendimento</h3>
          </div>
          <div class="strip-summary-phrase">
            ${buildResumoExecutivoTexto(phases, allProjectTasks, avgProgress, completedTasks, lateTasks)}
          </div>
        </div>

        <div class="phases-grid">
          ${phases.map((phase, idx) => `
            <div class="phase-card ${phase.atual ? 'is-current' : ''} ${phase.estado === 'Concluída' ? 'is-done' : ''}">
              <div class="phase-top">
                <span class="phase-step">0${idx + 1}</span>
                <span class="phase-badge phase-${phase.key}">${phase.estado}</span>
              </div>
              <div class="phase-title">
                <i data-lucide="${phase.icon}"></i>
                <h4>${phase.nome}</h4>
              </div>
              <p class="phase-desc">${phase.resumo}</p>
              <div class="phase-progress-wrap">
                <div class="phase-progress-bar">
                  <div class="phase-progress-fill fill-${phase.key}" style="width: ${phase.pct}%"></div>
                </div>
                <div class="phase-meta">
                  <span>${phase.concluidas}/${phase.total} concluídas</span>
                  <span class="font-mono"><strong>${phase.pct}%</strong></span>
                </div>
              </div>
              ${phase.atual ? `
                <div class="estamos-aqui-badge">
                  <span class="pulse-dot"></span>
                  <span>ESTAMOS AQUI</span>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </section>

      <!-- CARDS DE METRICAS E EQUIPE TECNICA -->
      <section class="crono-kpi-row">
        <div class="kpi-card-group">
          <div class="kpi-mini-card">
            <span class="label">Avanço Físico Global</span>
            <div class="val font-mono">${avgProgress}%</div>
            <div class="kpi-progress"><div class="fill" style="width: ${avgProgress}%"></div></div>
          </div>
          <div class="kpi-mini-card">
            <span class="label">Total de Entregas</span>
            <div class="val font-mono">${totalTasks}</div>
            <span class="subtext">Itens mapeados</span>
          </div>
          <div class="kpi-mini-card highlight-green">
            <span class="label">Concluídas</span>
            <div class="val font-mono">${completedTasks}</div>
            <span class="subtext">100% homologadas</span>
          </div>
          <div class="kpi-mini-card highlight-blue">
            <span class="label">Em Andamento</span>
            <div class="val font-mono">${inProgressTasks}</div>
            <span class="subtext">Em produção</span>
          </div>
          <div class="kpi-mini-card highlight-red">
            <span class="label">Atrasadas</span>
            <div class="val font-mono">${lateTasks}</div>
            <span class="subtext">${lateTasks > 0 ? 'Requer atenção' : 'No prazo'}</span>
          </div>
        </div>

        <!-- Equipe Técnica -->
        <div class="team-roster-box">
          <div class="roster-header">
            <h4><i data-lucide="users"></i> Equipe Técnica Responsável</h4>
          </div>
          <div class="team-members-list">
            ${TEAM_ROSTER.map(member => {
              const memberTasks = allProjectTasks.filter(t => t.responsavel === member.nome);
              const mAvg = averagePercent(memberTasks);
              return `
                <div class="team-member-item">
                  <div class="member-avatar ${member.avatarClass}">${member.iniciais}</div>
                  <div class="member-info">
                    <span class="member-name">${member.nome}</span>
                    <span class="member-role">${member.cargo}</span>
                  </div>
                  <div class="member-stats">
                    <span class="font-mono">${memberTasks.length} tarefas</span>
                    <span class="font-mono font-bold">${mAvg}%</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </section>

      <!-- BARRA DE FERRAMENTAS E CONTROLES DO CRONOGRAMA -->
      <section class="crono-toolbar-card">
        <div class="toolbar-left">
          <!-- Switcher Kanban vs Tabela -->
          <div class="segmented-control">
            <button 
              class="segment-btn ${CronoState.viewMode === 'kanban' ? 'active' : ''}" 
              onclick="CronogramaModule.setViewMode('kanban')"
              title="Visualização em Cartões Kanban"
            >
              <i data-lucide="layout-grid"></i>
              <span>Kanban</span>
            </button>
            <button 
              class="segment-btn ${CronoState.viewMode === 'table' ? 'active' : ''}" 
              onclick="CronogramaModule.setViewMode('table')"
              title="Visualização em Tabela / DataGrid"
            >
              <i data-lucide="table"></i>
              <span>Tabela</span>
            </button>
          </div>

          <!-- Filtro Disciplina -->
          <div class="filter-select-wrap">
            <select class="form-select select-sm" onchange="CronogramaModule.setFilter('filterDisciplina', this.value)">
              <option value="all" ${CronoState.filterDisciplina === 'all' ? 'selected' : ''}>Todas as Disciplinas</option>
              <option value="Arquitetura" ${CronoState.filterDisciplina === 'Arquitetura' ? 'selected' : ''}>Arquitetura</option>
              <option value="3D" ${CronoState.filterDisciplina === '3D' ? 'selected' : ''}>3D</option>
              <option value="Estrutura" ${CronoState.filterDisciplina === 'Estrutura' ? 'selected' : ''}>Estrutura</option>
              <option value="Complementares" ${CronoState.filterDisciplina === 'Complementares' ? 'selected' : ''}>Complementares</option>
              <option value="Obras" ${CronoState.filterDisciplina === 'Obras' ? 'selected' : ''}>Obras</option>
            </select>
          </div>

          <!-- Filtro Status -->
          <div class="filter-select-wrap">
            <select class="form-select select-sm" onchange="CronogramaModule.setFilter('filterStatus', this.value)">
              <option value="all" ${CronoState.filterStatus === 'all' ? 'selected' : ''}>Todos os Status</option>
              <option value="Não Iniciado" ${CronoState.filterStatus === 'Não Iniciado' ? 'selected' : ''}>Não Iniciado</option>
              <option value="Em Andamento" ${CronoState.filterStatus === 'Em Andamento' ? 'selected' : ''}>Em Andamento</option>
              <option value="Concluído" ${CronoState.filterStatus === 'Concluído' ? 'selected' : ''}>Concluído</option>
            </select>
          </div>

          <!-- Busca Rápida -->
          <div class="search-input-wrap search-sm">
            <i data-lucide="search"></i>
            <input 
              type="text" 
              placeholder="Buscar entregas..." 
              value="${escapeHTML(CronoState.searchQuery)}"
              oninput="CronogramaModule.setFilter('searchQuery', this.value)"
            >
          </div>
        </div>

        <div class="toolbar-right">
          <button class="btn btn-outline btn-sm" onclick="CronogramaModule.openReportModal()" title="Gerar Relatório Executivo Formal para o Cliente">
            <i data-lucide="file-text"></i>
            <span>Relatório PDF</span>
          </button>
          <button class="btn btn-primary btn-sm" onclick="CronogramaModule.openNewTaskModal()">
            <i data-lucide="plus"></i>
            <span>Nova Tarefa</span>
          </button>
        </div>
      </section>

      <!-- VISUALIZAÇÃO: KANBAN OU TABELA -->
      <section class="crono-view-content" id="crono-view-area">
        ${CronoState.viewMode === 'kanban' 
          ? renderKanbanBoard(filtered) 
          : renderTableView(filtered)
        }
      </section>
    </div>
  `;
}

function buildResumoExecutivoTexto(phases, tasks, avg, done, late) {
  const faseAtual = phases.find(f => f.atual);
  let texto = `O empreendimento está com <strong>${avg}% de avanço global</strong> (${done} de ${tasks.length} entregas concluídas).`;
  if (faseAtual) {
    texto += ` A disciplina em curso é <strong>${faseAtual.nome}</strong> (${faseAtual.pct}% executado).`;
  }
  if (late > 0) {
    texto += ` <span class="text-danger font-bold">${late} entrega(s) requerem atenção no prazo.</span>`;
  } else {
    texto += ` Todas as entregas estão dentro do prazo previsto.`;
  }
  return texto;
}

/**
 * ============================================================================
 * KANBAN BOARD
 * ============================================================================
 */
function renderKanbanBoard(tasks) {
  const cols = [
    { id: 'Não Iniciado', title: 'Não Iniciado', class: 'col-not-started', icon: 'circle' },
    { id: 'Em Andamento', title: 'Em Andamento', class: 'col-in-progress', icon: 'clock' },
    { id: 'Concluído',    title: 'Concluído',    class: 'col-completed',   icon: 'check-circle-2' }
  ];

  return `
    <div class="kanban-board">
      ${cols.map(col => {
        const colTasks = tasks.filter(t => calculateStatus(t.porcentagem) === col.id);
        return `
          <div class="kanban-column ${col.class}" ondragover="CronogramaModule.onDragOver(event)" ondrop="CronogramaModule.onDrop(event, '${col.id}')">
            <div class="kanban-column-header">
              <div class="column-title">
                <i data-lucide="${col.icon}"></i>
                <span>${col.title}</span>
              </div>
              <span class="badge-count">${colTasks.length}</span>
            </div>
            <div class="kanban-cards-track">
              ${colTasks.length === 0 ? `
                <div class="empty-column-placeholder">
                  <span>Nenhuma entrega nesta fase</span>
                </div>
              ` : colTasks.map(task => renderKanbanCard(task)).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderKanbanCard(task) {
  const discKey = getDisciplinaKey(task.disciplina_projeto);
  const days = getDaysRemaining(task.data_conclusao);
  const isLate = (Number(task.porcentagem) || 0) < 100 && days < 0;

  return `
    <div 
      class="kanban-card card-${discKey} ${isLate ? 'is-late' : ''}" 
      draggable="true" 
      ondragstart="CronogramaModule.onDragStart(event, '${task.id}')"
      onclick="CronogramaModule.openEditTaskModal('${task.id}')"
    >
      <div class="card-header-row">
        <span class="disc-badge disc-${discKey}">${escapeHTML(task.disciplina_projeto)}</span>
        <span class="pct-badge font-mono">${task.porcentagem || 0}%</span>
      </div>

      <h4 class="card-task-title">${escapeHTML(task.nome_tarefa)}</h4>
      ${task.descricao ? `<p class="card-task-desc">${escapeHTML(task.descricao)}</p>` : ''}

      <div class="card-progress-bar">
        <div class="card-progress-fill fill-${discKey}" style="width: ${task.porcentagem || 0}%"></div>
      </div>

      <!-- 5. LINKS CONTEXTUAIS NO CRONOGRAMA -->
      <div class="crono-card-links" onclick="event.stopPropagation()">
        <button class="crono-link-btn" onclick="CronogramaIntegration.openPresentationForTask('${task.id}')" title="Ver apresentação vinculada">
          <i data-lucide="presentation"></i> <span>Ver apresentação</span>
        </button>
        <button class="crono-link-btn" onclick="CronogramaIntegration.openDeliveryForTask('${task.id}')" title="Ver centro de entrega">
          <i data-lucide="package-check"></i> <span>Ver entrega</span>
        </button>
        <button class="crono-link-btn" onclick="CronogramaIntegration.openRevisionForTask('${task.id}')" title="Ver controle de revisões">
          <i data-lucide="git-branch"></i> <span>Ver revisão</span>
        </button>
      </div>

      <div class="card-footer-row">
        <div class="card-dates">
          <i data-lucide="calendar"></i>
          <span>${formatDateBR(task.data_conclusao)}</span>
          ${isLate ? `<span class="late-tag">Atrasada</span>` : ''}
        </div>
        <div class="card-responsible">
          <span class="initials-bubble" title="${escapeHTML(task.responsavel)}">
            ${getInitials(task.responsavel)}
          </span>
        </div>
      </div>
    </div>
  `;
}

/**
 * ============================================================================
 * TABELA (DATAGRID COM EDIÇÃO INLINE)
 * ============================================================================
 */
function renderTableView(tasks) {
  return `
    <div class="crono-table-wrap">
      <table class="crono-data-table">
        <thead>
          <tr>
            <th style="width: 60px;">Ord</th>
            <th>Disciplina</th>
            <th>Entrega / Tarefa</th>
            <th>Responsável</th>
            <th>Início</th>
            <th>Conclusão</th>
            <th style="width: 150px;">Progresso (%)</th>
            <th>Status</th>
            <th style="width: 90px; text-align: right;">Ações</th>
          </tr>
        </thead>
        <tbody>
          ${tasks.length === 0 ? `
            <tr>
              <td colspan="9" class="text-center py-6">Nenhuma entrega encontrada com os filtros aplicados.</td>
            </tr>
          ` : tasks.map((task, idx) => {
            const discKey = getDisciplinaKey(task.disciplina_projeto);
            const status = calculateStatus(task.porcentagem);
            return `
              <tr id="task-row-${task.id}">
                <td class="font-mono text-muted text-center">${idx + 1}</td>
                <td>
                  <span class="disc-badge disc-${discKey}">${escapeHTML(task.disciplina_projeto)}</span>
                </td>
                <td>
                  <strong>${escapeHTML(task.nome_tarefa)}</strong>
                  ${task.descricao ? `<div class="table-subtext">${escapeHTML(task.descricao)}</div>` : ''}
                  <div class="crono-table-links">
                    <button class="crono-table-link-btn" onclick="CronogramaIntegration.openPresentationForTask('${task.id}')">
                      <i data-lucide="presentation"></i> Ver apresentação
                    </button>
                    <span class="crono-link-sep">•</span>
                    <button class="crono-table-link-btn" onclick="CronogramaIntegration.openDeliveryForTask('${task.id}')">
                      <i data-lucide="package-check"></i> Ver entrega
                    </button>
                    <span class="crono-link-sep">•</span>
                    <button class="crono-table-link-btn" onclick="CronogramaIntegration.openRevisionForTask('${task.id}')">
                      <i data-lucide="git-branch"></i> Ver revisão
                    </button>
                  </div>
                </td>
                <td>
                  <div class="table-user-cell">
                    <span class="initials-bubble sm">${getInitials(task.responsavel)}</span>
                    <span>${escapeHTML(task.responsavel)}</span>
                  </div>
                </td>
                <td class="font-mono text-sm">${formatDateBR(task.data_inicio)}</td>
                <td class="font-mono text-sm">${formatDateBR(task.data_conclusao)}</td>
                <td>
                  <div class="table-progress-cell">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      step="5" 
                      value="${task.porcentagem || 0}" 
                      onchange="CronogramaModule.updateTaskPercent('${task.id}', this.value)"
                      oninput="this.nextElementSibling.innerText = this.value + '%'"
                    >
                    <span class="font-mono font-bold">${task.porcentagem || 0}%</span>
                  </div>
                </td>
                <td>
                  <span class="badge-status-pill ${status === 'Concluído' ? 'status-completed' : status === 'Em Andamento' ? 'status-in-progress' : 'status-not-started'}">
                    ${status}
                  </span>
                </td>
                <td style="text-align: right;">
                  <button class="btn-icon btn-ghost" title="Editar Tarefa" onclick="CronogramaModule.openEditTaskModal('${task.id}')">
                    <i data-lucide="edit-2"></i>
                  </button>
                  <button class="btn-icon btn-ghost text-danger" title="Excluir Tarefa" onclick="CronogramaModule.deleteTask('${task.id}')">
                    <i data-lucide="trash-2"></i>
                  </button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function getInitials(name) {
  if (!name) return 'AT';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * ============================================================================
 * CONTROLADOR GLOBAL DO MÓDULO DE CRONOGRAMA
 * ============================================================================
 */
const CronogramaModule = {
  setViewMode(mode) {
    CronoState.viewMode = mode;
    this.refresh();
  },

  setFilter(key, value) {
    CronoState[key] = value;
    this.refresh();
  },

  refresh() {
    const project = StudioState.getActiveProject();
    const tasks = StudioState.getProjectTasks(project ? project.id : null);
    const container = document.getElementById('project-tab-content');
    if (container && StudioState.data.activeProjectTab === 'cronograma') {
      container.innerHTML = renderIntegratedCronograma(project, tasks);
      if (window.lucide) lucide.createIcons();
    }
  },

  onDragStart(event, taskId) {
    CronoState.draggedTaskId = taskId;
    event.dataTransfer.setData('text/plain', taskId);
  },

  onDragOver(event) {
    event.preventDefault();
  },

  onDrop(event, targetColumn) {
    event.preventDefault();
    const taskId = CronoState.draggedTaskId;
    if (!taskId) return;

    let targetPercent = 0;
    if (targetColumn === 'Não Iniciado') targetPercent = 0;
    else if (targetColumn === 'Em Andamento') targetPercent = 50;
    else if (targetColumn === 'Concluído') targetPercent = 100;

    this.updateTaskPercent(taskId, targetPercent);
    CronoState.draggedTaskId = null;
  },

  updateTaskPercent(taskId, percent) {
    const task = StudioState.data.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.porcentagem = parseInt(percent, 10);
    task.updatedAt = new Date().toISOString();
    StudioState.save();
    this.refresh();
  },

  openNewTaskModal() {
    const project = StudioState.getActiveProject();
    StudioApp.openNewTaskModal(project ? project.id : null);
  },

  openEditTaskModal(taskId) {
    StudioApp.openEditTaskModal(taskId);
  },

  deleteTask(taskId) {
    if (!confirm('Deseja realmente remover esta entrega do cronograma?')) return;
    StudioState.data.tasks = StudioState.data.tasks.filter(t => t.id !== taskId);
    StudioState.save();
    this.refresh();
  },

  openReportModal() {
    StudioApp.openReportModal();
  }
};

/**
 * ============================================================================
 * INTEGRAÇÃO F14: DISPACHADOR DE LINKS CONTEXTUAIS DO CRONOGRAMA
 * ============================================================================
 */
const CronogramaIntegration = {
  openPresentationForTask(taskId) {
    const task = (typeof StudioState !== 'undefined' && StudioState.data && StudioState.data.tasks || []).find(t => t.id === taskId);
    const projectId = task ? task.projectId : (typeof StudioState !== 'undefined' && StudioState.data ? StudioState.data.selectedProjectId : null);

    if (task && task.presentationId && typeof PresentationEngineModule !== 'undefined' && PresentationEngineModule.openWorkspace) {
      const pres = StudioState.getPresentation ? StudioState.getPresentation(task.presentationId) : null;
      if (pres) {
        PresentationEngineModule.openWorkspace(task.presentationId);
        return { success: true, target: 'presentation', id: task.presentationId };
      }
    }

    const projectPres = typeof StudioState !== 'undefined' && StudioState.getProjectPresentations ? StudioState.getProjectPresentations(projectId) : [];
    if (projectPres && projectPres.length > 0 && typeof PresentationEngineModule !== 'undefined' && PresentationEngineModule.openWorkspace) {
      PresentationEngineModule.openWorkspace(projectPres[0].id);
      return { success: true, target: 'presentation', id: projectPres[0].id };
    }

    if (typeof StudioApp !== 'undefined' && StudioApp.openProject) {
      StudioApp.openProject(projectId, 'pranchas');
      return { success: true, target: 'tab', tab: 'pranchas' };
    }

    return { success: true, target: 'fallback', projectId };
  },

  openDeliveryForTask(taskId) {
    const task = (typeof StudioState !== 'undefined' && StudioState.data && StudioState.data.tasks || []).find(t => t.id === taskId);
    const projectId = task ? task.projectId : (typeof StudioState !== 'undefined' && StudioState.data ? StudioState.data.selectedProjectId : null);
    const revision = (task && task.revisionNumber) || 'REV00';

    if (typeof DeliveryCenterModule !== 'undefined' && DeliveryCenterModule.open) {
      DeliveryCenterModule.open(projectId, { revision });
      return { success: true, target: 'delivery_center', projectId, revision };
    }

    if (typeof StudioApp !== 'undefined' && StudioApp.openProject) {
      StudioApp.openProject(projectId, 'entregas');
      return { success: true, target: 'tab', tab: 'entregas' };
    }

    return { success: true, target: 'fallback', projectId };
  },

  openRevisionForTask(taskId) {
    const task = (typeof StudioState !== 'undefined' && StudioState.data && StudioState.data.tasks || []).find(t => t.id === taskId);
    const projectId = task ? task.projectId : (typeof StudioState !== 'undefined' && StudioState.data ? StudioState.data.selectedProjectId : null);

    if (typeof RevisionSystemModule !== 'undefined' && RevisionSystemModule.open) {
      RevisionSystemModule.open(projectId);
      return { success: true, target: 'revision_system', projectId };
    }

    if (typeof StudioApp !== 'undefined' && StudioApp.openProject) {
      StudioApp.openProject(projectId, 'revisoes');
      return { success: true, target: 'tab', tab: 'revisoes' };
    }

    return { success: true, target: 'fallback', projectId };
  }
};

if (typeof window !== 'undefined') {
  window.CronogramaModule = CronogramaModule;
  window.renderIntegratedCronograma = renderIntegratedCronograma;
  window.CronogramaIntegration = CronogramaIntegration;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CronogramaModule,
    renderIntegratedCronograma,
    CronogramaIntegration
  };
}
