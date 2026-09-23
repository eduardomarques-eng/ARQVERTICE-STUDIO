/**
 * ============================================================================
 * ARQVERTICE STUDIO — DASHBOARD EXECUTIVO PRINCIPAL
 * Visão consolidada de projetos, entregas críticas, revisões e alertas
 * ============================================================================
 */

function renderDashboard() {
  const container = document.getElementById('view-container');
  if (!container) return;

  const state = StudioState.data;
  const projects = state.projects || [];
  const tasks = state.tasks || [];
  const notifications = state.notifications || [];

  // Cálculos de Métricas
  const totalProjects = projects.length;
  const inProgressProjects = projects.filter(p => p.status === 'Em Andamento').length;
  const briefingProjects = projects.filter(p => p.status === 'Briefing').length;
  const finishedProjects = projects.filter(p => p.status === 'Finalizado').length;

  // Tarefas Críticas (vencem em ≤ 7 dias ou atrasadas e não finalizadas)
  const criticalTasks = tasks.filter(t => {
    if (t.porcentagem >= 100) return false;
    const d = getDaysRemaining(t.data_conclusao);
    return d <= 7;
  }).sort((a, b) => parseDateBR(a.data_conclusao) - parseDateBR(b.data_conclusao));

  // Próximas Entregas gerais
  const nextDeliveries = tasks.filter(t => t.porcentagem < 100)
    .sort((a, b) => parseDateBR(a.data_conclusao) - parseDateBR(b.data_conclusao))
    .slice(0, 5);

  container.innerHTML = `
    <div class="dashboard-view animate-fade-in">
      <!-- Top Banner Executivo -->
      <header class="view-header">
        <div class="view-header-main">
          <div class="badge-tag pulse">ARQVÉRTICE STUDIO • PAINEL EXECUTIVO</div>
          <h1 class="view-title">Visão Geral do Escritório</h1>
          <p class="view-subtitle">Gerenciamento integrado de projetos, ambientes, prazos e entregas em tempo real.</p>
        </div>
        <div class="view-header-actions">
          <button class="btn btn-secondary" onclick="StudioApp.navigateTo('projects')">
            <i data-lucide="layers"></i>
            <span>Ver Todos os Projetos</span>
          </button>
          <button class="btn btn-primary" onclick="StudioApp.openNewProjectModal()">
            <i data-lucide="plus"></i>
            <span>Novo Projeto</span>
          </button>
        </div>
      </header>

      <!-- Grid de Métricas Principais (Cards Úteis) -->
      <section class="kpi-grid">
        <div class="kpi-card" onclick="StudioApp.navigateTo('projects', { filter: 'all' })" title="Ver todos">
          <div class="kpi-card-icon"><i data-lucide="building-2"></i></div>
          <div class="kpi-card-content">
            <span class="kpi-card-label">Total de Obras</span>
            <strong class="kpi-card-val">${totalProjects}</strong>
            <span class="kpi-card-sub">Empreendimentos ativos</span>
          </div>
        </div>

        <div class="kpi-card accent-primary" onclick="StudioApp.navigateTo('projects', { filter: 'Em Andamento' })" title="Filtrar em andamento">
          <div class="kpi-card-icon"><i data-lucide="activity"></i></div>
          <div class="kpi-card-content">
            <span class="kpi-card-label">Em Execução Ativa</span>
            <strong class="kpi-card-val">${inProgressProjects}</strong>
            <span class="kpi-card-sub">Projetos em desenvolvimento</span>
          </div>
        </div>

        <div class="kpi-card accent-amber" onclick="StudioApp.navigateTo('projects', { filter: 'Briefing' })" title="Filtrar em briefing">
          <div class="kpi-card-icon"><i data-lucide="clipboard-check"></i></div>
          <div class="kpi-card-content">
            <span class="kpi-card-label">Aguardando Aprovação</span>
            <strong class="kpi-card-val">${briefingProjects}</strong>
            <span class="kpi-card-sub">Briefings e validações</span>
          </div>
        </div>

        <div class="kpi-card ${criticalTasks.length > 0 ? 'accent-danger' : 'accent-emerald'}">
          <div class="kpi-card-icon"><i data-lucide="${criticalTasks.length > 0 ? 'alert-triangle' : 'check-circle-2'}"></i></div>
          <div class="kpi-card-content">
            <span class="kpi-card-label">Prazos em Alerta</span>
            <strong class="kpi-card-val">${criticalTasks.length}</strong>
            <span class="kpi-card-sub">${criticalTasks.length > 0 ? 'Vencem em ≤ 7 dias' : 'Todos os prazos em dia'}</span>
          </div>
        </div>
      </section>

      <!-- Layout em 2 Colunas: Projetos Recentes vs Próximas Entregas & Notificações -->
      <div class="dashboard-grid-layout">
        <!-- Coluna Esquerda: Projetos Recentes -->
        <div class="dashboard-col-main">
          <div class="section-card">
            <div class="section-card-head">
              <div class="sch-left">
                <i data-lucide="folder-kanban"></i>
                <h2>Projetos em Andamento</h2>
              </div>
              <button class="btn btn-sm btn-ghost" onclick="StudioApp.navigateTo('projects')">
                Ver todos <i data-lucide="arrow-right"></i>
              </button>
            </div>

            <div class="projects-cards-list">
              ${projects.map(p => {
                const client = state.clients.find(c => c.id === p.clientId) || { name: 'Cliente' };
                const pTasks = state.tasks.filter(t => t.projectId === p.id);
                const avgPct = pTasks.length ? Math.round(pTasks.reduce((a, b) => a + Number(b.porcentagem || 0), 0) / pTasks.length) : 0;
                const nextT = pTasks.filter(t => t.porcentagem < 100).sort((a, b) => parseDateBR(a.data_conclusao) - parseDateBR(b.data_conclusao))[0];
                const envs = state.environments.filter(e => e.projectId === p.id);

                return `
                  <article class="project-summary-card">
                    <div class="psc-cover" style="background-image: url('${p.coverImage}')">
                      <span class="psc-status-tag status-${p.status.toLowerCase().replace(/\s+/g, '-')}">${escapeHTML(p.status)}</span>
                      <span class="psc-code">${escapeHTML(p.code || 'PRJ')}</span>
                    </div>
                    <div class="psc-body">
                      <div class="psc-header">
                        <h3 class="psc-title" onclick="StudioApp.openProject('${p.id}')">${escapeHTML(p.name)}</h3>
                        <span class="psc-client"><i data-lucide="user"></i> ${escapeHTML(client.name)}</span>
                      </div>
                      <p class="psc-location"><i data-lucide="map-pin"></i> ${escapeHTML(p.location)}</p>
                      
                      <div class="psc-meta-grid">
                        <div class="psc-meta-item">
                          <span class="pmi-label">Etapa Atual</span>
                          <strong class="pmi-val">${escapeHTML(p.currentStage)}</strong>
                        </div>
                        <div class="psc-meta-item">
                          <span class="pmi-label">Ambientes</span>
                          <strong class="pmi-val">${envs.length} cômodos</strong>
                        </div>
                        <div class="psc-meta-item">
                          <span class="pmi-label">Próxima Entrega</span>
                          <strong class="pmi-val ${nextT && getDaysRemaining(nextT.data_conclusao) <= 7 ? 'text-danger' : ''}">
                            ${nextT ? escapeHTML(nextT.descricao_etapa) + ' (' + nextT.data_conclusao + ')' : 'Concluído'}
                          </strong>
                        </div>
                      </div>

                      <div class="psc-progress-wrap">
                        <div class="psc-prog-labels">
                          <span>Avanço Físico Global</span>
                          <strong>${avgPct}%</strong>
                        </div>
                        <div class="custom-progress-track">
                          <div class="custom-progress-bar" style="width: ${avgPct}%; background: ${getProgressColor(avgPct)};"></div>
                        </div>
                      </div>

                      <div class="psc-footer">
                        <button class="btn btn-sm btn-outline" onclick="StudioApp.openProject('${p.id}', 'ambientes')">
                          <i data-lucide="layout-grid"></i> Ambientes
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="StudioApp.openProject('${p.id}', 'cronograma')">
                          <i data-lucide="calendar"></i> Cronograma
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="StudioApp.openProject('${p.id}')">
                          Abrir Workspace <i data-lucide="chevron-right"></i>
                        </button>
                      </div>
                    </div>
                  </article>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- Coluna Direita: Próximas Entregas & Notificações -->
        <div class="dashboard-col-side">
          <!-- Card de Próximas Entregas do Cronograma -->
          <div class="section-card">
            <div class="section-card-head">
              <div class="sch-left">
                <i data-lucide="clock"></i>
                <h2>Próximas Entregas</h2>
              </div>
              <button class="btn btn-sm btn-ghost" onclick="StudioApp.navigateTo('cronograma-global')">
                Ver tudo <i data-lucide="arrow-right"></i>
              </button>
            </div>

            <div class="deliveries-list">
              ${nextDeliveries.length ? nextDeliveries.map(t => {
                const days = getDaysRemaining(t.data_conclusao);
                const isLate = days < 0;
                const isCrit = days <= 7;
                const prj = projects.find(p => p.id === t.projectId) || { name: 'Obra' };

                return `
                  <div class="delivery-item ${isCrit ? 'is-critical' : ''}">
                    <div class="di-left">
                      <span class="badge-disciplina badge-${getDisciplinaKey(t.disciplina_projeto)}">${escapeHTML(t.disciplina_projeto)}</span>
                      <strong class="di-name">${escapeHTML(t.descricao_etapa)}</strong>
                      <span class="di-proj">${escapeHTML(prj.name)} • ${escapeHTML(t.projetista)}</span>
                    </div>
                    <div class="di-right">
                      <span class="di-date ${isLate ? 'text-danger' : ''}">${escapeHTML(t.data_conclusao)}</span>
                      <span class="di-days ${isCrit ? 'tag-crit' : ''}">${isLate ? 'Atrasada (' + Math.abs(days) + 'd)' : days + ' dias'}</span>
                    </div>
                  </div>
                `;
              }).join('') : '<p class="empty-hint">Nenhuma entrega pendente.</p>'}
            </div>
          </div>

          <!-- Card de Notificações / Atividades Relevantes -->
          <div class="section-card">
            <div class="section-card-head">
              <div class="sch-left">
                <i data-lucide="bell"></i>
                <h2>Notificações Relevantes</h2>
              </div>
            </div>

            <div class="notif-feed">
              ${notifications.map(n => `
                <div class="notif-item notif-${n.type}">
                  <div class="notif-icon-wrap">
                    <i data-lucide="${n.type === 'approval' ? 'check-circle' : n.type === 'warning' ? 'alert-triangle' : 'info'}"></i>
                  </div>
                  <div class="notif-content">
                    <strong class="notif-title">${escapeHTML(n.title)}</strong>
                    <p class="notif-desc">${escapeHTML(n.desc)}</p>
                    <span class="notif-time">${escapeHTML(n.time)}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Acesso Rápido ao Briefing Externo -->
          <div class="quick-action-card">
            <div class="qac-icon"><i data-lucide="clipboard-list"></i></div>
            <div class="qac-text">
              <strong>Entrevista de Briefing</strong>
              <p>Envie o questionário guiado de 32 perguntas diretamente para o cliente responder online.</p>
            </div>
            <button class="btn btn-sm btn-primary" onclick="StudioApp.openBriefingModal()">
              <i data-lucide="share-2"></i> Compartilhar Link
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
}

window.renderDashboard = renderDashboard;
