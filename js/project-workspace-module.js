/**
 * ============================================================================
 * ARQVERTICE STUDIO — MÓDULO DE DESENVOLVIMENTO DO PROJETO (BLOCO C05)
 * Workspace Central de Governança, Entregáveis, Marcos, Decisões e Integração Revit
 * ============================================================================
 */

const ProjectWorkspaceModule = {
  activeDisciplineFilter: 'ALL', // 'ALL' ou uma das 8 disciplinas
  activeStatusFilter: 'ALL',
  searchQuery: '',

  /**
   * Renderiza a visão central de Desenvolvimento do Projeto
   */
  render(project, client) {
    const ws = StudioState.getProjectDevWorkspace(project.id);
    if (!ws) {
      return `<div class="p-8 text-center text-muted">Projeto não encontrado no gerenciador de estado.</div>`;
    }

    const filteredDeliverables = StudioState.getProjectDeliverables(project.id, {
      discipline: this.activeDisciplineFilter === 'ALL' ? null : this.activeDisciplineFilter,
      status: this.activeStatusFilter === 'ALL' ? null : this.activeStatusFilter,
      search: this.searchQuery || null
    });

    const statusBadges = {
      'PLANEJAMENTO': { label: 'Planejamento', cls: 'status-planejamento' },
      'BRIEFING_APROVADO': { label: 'Briefing Aprovado', cls: 'status-briefing' },
      'LEVANTAMENTO': { label: 'Levantamento', cls: 'status-levantamento' },
      'ESTUDOS': { label: 'Estudos Preliminares', cls: 'status-estudos' },
      'CONCEITO': { label: 'Conceito & Diretrizes', cls: 'status-conceito' },
      'DESENVOLVIMENTO': { label: 'Em Desenvolvimento Executivo', cls: 'status-desenvolvimento' },
      'VISUALIZACAO': { label: 'Visualização & 3D', cls: 'status-visualizacao' },
      'APRESENTACAO': { label: 'Apresentação Executiva', cls: 'status-apresentacao' },
      'REVISAO': { label: 'Em Revisão Técnica', cls: 'status-revisao' },
      'ENTREGA': { label: 'Entrega & As-Built', cls: 'status-entrega' },
      'FINALIZADO': { label: 'Finalizado / Obra Liberada', cls: 'status-finalizado' }
    };
    const curStatusInfo = statusBadges[ws.globalStatus] || { label: ws.globalStatus, cls: 'status-desenvolvimento' };

    return `
      <div class="project-dev-workspace project-workspace animate-fade-in">
        <!-- TOP HEADER: GOVERNANÇA E CONTROLE DE ESTADO (Prioridade 1: ESTADO) -->
        <header class="pdw-header">
          <div class="pdw-header-main">
            <div class="pdw-meta-row">
              <span class="pdw-pill-code"><i data-lucide="layers"></i> BLOCO C05 — WORKSPACE DE DESENVOLVIMENTO</span>
              <span class="pdw-pill-status ${curStatusInfo.cls}">
                <i data-lucide="activity"></i> ${curStatusInfo.label}
              </span>
              <span class="pdw-pill-milestones" title="Marcos formais do projeto conquistados">
                <i data-lucide="award"></i> ${ws.achievedMilestonesCount}/9 Marcos Conquistados (${ws.milestonesProgress}%)
              </span>
              <span class="pdw-pill-deliverables">
                <i data-lucide="check-circle-2"></i> ${ws.approvedDeliverablesCount}/${ws.deliverablesCount} Entregáveis Aprovados
              </span>
            </div>

            <div class="pdw-title-wrap">
              <h1 class="pdw-title">${escapeHTML(project.name)}</h1>
              <span class="pdw-subtitle">${escapeHTML(project.code || 'PRJ')} • ${escapeHTML(client.name)} • ${escapeHTML(project.typology)}</span>
            </div>
            
            <p class="pdw-desc">
              Painel central de orquestração técnica e governança executiva. Centraliza e documenta os resultados produzidos no <strong>Autodesk Revit</strong>, <strong>AutoCAD</strong>, <strong>Corona Renderer</strong> e demais plataformas especializadas, sem substituí-las.
            </p>
          </div>

          <div class="pdw-header-actions">
            <button class="btn btn-outline btn-sm" onclick="ProjectWorkspaceModule.openStatusModal('${project.id}')" title="Alterar estado global com controle e rastreabilidade">
              <i data-lucide="sliders"></i> Alterar Estado
            </button>
            <button class="btn btn-secondary btn-sm" onclick="ProjectWorkspaceModule.openSnapshotModal('${project.id}')" title="Criar nova versão congelada do projeto (PROJECT_V01, V02...)">
              <i data-lucide="git-commit"></i> Novo Snapshot (V+)
            </button>
            <button class="btn btn-primary btn-sm" onclick="ProjectWorkspaceModule.openNewDeliverableModal('${project.id}')">
              <i data-lucide="plus"></i> Novo Entregável
            </button>
            <button class="btn btn-outline btn-sm" onclick="ProjectWorkspaceModule.openAiSummaryModal('${project.id}')" title="Síntese inteligente de progresso e gargalos">
              <i data-lucide="sparkles"></i> Assistente IA
            </button>
            <button class="btn btn-outline btn-sm" onclick="ClientPortalModule.openPublicationModal('${project.id}')" title="Gerenciar conteúdos publicados no Portal do Cliente">
              <i data-lucide="share-2"></i> Publicar no Portal
            </button>
          </div>
        </header>

        <!-- AVISO DE FILOSOFIA TÉCNICA (Item 1 do Prompt) -->
        <div class="pdw-revit-disclaimer">
          <i data-lucide="info"></i>
          <div>
            <strong>Princípio de Integração ArqVértice Studio:</strong> O sistema não substitui Revit, AutoCAD ou Corona. Ele documenta metadados de vistas, pavimentos e pranchas exportadas, consolidando a tomada de decisão sem inferir dados inexistentes.
          </div>
        </div>

        <!-- TIMELINE DE MARCOS (MILESTONES DO PROJETO) -->
        <section class="pdw-section pdw-milestones-section">
          <div class="section-title-row">
            <div class="str-left">
              <i data-lucide="flag"></i>
              <h3>Marcos Oficiais do Projeto (Milestones)</h3>
            </div>
            <span class="text-xs text-secondary">9 marcos com regras definidas</span>
          </div>

          <div class="milestones-track">
            ${ws.milestones.map((m, idx) => {
              const achievedCls = m.isAchieved ? 'is-achieved' : 'is-pending';
              return `
                <div class="milestone-node ${achievedCls}" onclick="ProjectWorkspaceModule.toggleMilestonePrompt('${project.id}', '${m.milestoneKey}', ${m.isAchieved})" title="${m.isAchieved ? `Conquistado em ${formatDateBR(m.achievedAt)} por ${m.achievedBy || 'Equipe'}` : `Pendente: ${m.notes || 'Aguardando critérios'}`}">
                  <div class="mn-circle">${m.isAchieved ? '<i data-lucide="check"></i>' : idx + 1}</div>
                  <div class="mn-label">${escapeHTML(m.label)}</div>
                  <span class="mn-status-badge">${m.isAchieved ? 'Concluído' : 'Pendente'}</span>
                </div>
              `;
            }).join('')}
          </div>
        </section>

        <!-- GRID PRINCIPAL DE DESENVOLVIMENTO (Prioridades 2 a 6) -->
        <div class="pdw-main-grid">
          
          <!-- COLUNA ESQUERDA (Prioridades 2, 3 e 4: Pendências, Próximos Passos e Decisões) -->
          <div class="pdw-col-left">

            <!-- PRIORIDADE 2: PENDÊNCIAS & BLOQUEIOS CRÍTICOS (Prompt Item 9) -->
            <section class="pdw-card pdw-pending-card">
              <div class="pdw-card-header">
                <div class="pch-left">
                  <i data-lucide="alert-circle" class="text-amber"></i>
                  <h4>Pendências & Ações Imediatas</h4>
                </div>
                <span class="badge-count">${ws.pendingIssues.length}</span>
              </div>

              <div class="pdw-pending-list">
                ${ws.pendingIssues.length ? ws.pendingIssues.map(issue => `
                  <div class="pending-item priority-${(issue.priority || 'media').toLowerCase()}">
                    <div class="pi-header">
                      <span class="pi-origin-pill">${escapeHTML(issue.origin)}</span>
                      <span class="pi-priority-badge">${escapeHTML(issue.priority)}</span>
                    </div>
                    <p class="pi-desc">${escapeHTML(issue.description)}</p>
                    <div class="pi-footer">
                      <span class="pi-resp"><i data-lucide="user"></i> ${escapeHTML(issue.responsible)}</span>
                      ${issue.deadline ? `<span class="pi-due"><i data-lucide="calendar"></i> Prazo: ${formatDateBR(issue.deadline)}</span>` : ''}
                    </div>
                  </div>
                `).join('') : `
                  <div class="empty-pending text-center p-4 text-muted">
                    <i data-lucide="check-check" class="text-emerald text-xl mb-2"></i>
                    <p>Nenhuma pendência crítica em aberto. O projeto está com fluxo contínuo!</p>
                  </div>
                `}
              </div>
            </section>

            <!-- PRIORIDADE 3: CHECKLIST DE GRANDES ETAPAS (Prompt Item 13) -->
            <section class="pdw-card pdw-checklist-card">
              <div class="pdw-card-header">
                <div class="pch-left">
                  <i data-lucide="check-square"></i>
                  <h4>Checklist Geral do Projeto</h4>
                </div>
                <span class="text-xs text-secondary">Etapas mestras</span>
              </div>

              <div class="pdw-checklist-list">
                ${ws.checklist.map(stage => `
                  <label class="checklist-row ${stage.isCompleted ? 'is-done' : ''}">
                    <input 
                      type="checkbox" 
                      ${stage.isCompleted ? 'checked' : ''} 
                      onchange="ProjectWorkspaceModule.toggleStage('${project.id}', '${stage.stageKey}', this.checked)"
                    />
                    <span class="chk-label">${escapeHTML(stage.label)}</span>
                    ${stage.completedAt ? `<span class="chk-date">${formatDateBR(stage.completedAt)}</span>` : ''}
                  </label>
                `).join('')}
              </div>
            </section>

            <!-- PRIORIDADE 4: DECISÕES RECENTES (Prompt Item 10) -->
            <section class="pdw-card pdw-decisions-card">
              <div class="pdw-card-header">
                <div class="pch-left">
                  <i data-lucide="git-pull-request"></i>
                  <h4>Decisões Recentes Homologadas</h4>
                </div>
                <span class="badge-count">${ws.decisions.length}</span>
              </div>

              <div class="pdw-decisions-list">
                ${ws.decisions.length ? ws.decisions.slice(0, 5).map(dec => `
                  <div class="decision-entry">
                    <div class="de-head">
                      <span class="de-source-tag">${escapeHTML(dec.source)}</span>
                      <span class="de-date">${formatDateBR(dec.date)}</span>
                    </div>
                    <strong class="de-title">${escapeHTML(dec.title)}</strong>
                    <p class="de-reason">${escapeHTML(dec.reason)}</p>
                    <div class="de-footer">
                      <span><i data-lucide="shield-check"></i> ${escapeHTML(dec.responsible || 'Equipe')}</span>
                      ${dec.linkStage ? `
                        <button class="btn-link-action" onclick="StudioApp.setProjectTab('${dec.linkStage}')">
                          Ver Origem <i data-lucide="arrow-right"></i>
                        </button>
                      ` : ''}
                    </div>
                  </div>
                `).join('') : `
                  <div class="p-4 text-center text-muted">Nenhuma decisão registrada ainda.</div>
                `}
              </div>
            </section>

            <!-- HISTÓRICO DE SNAPSHOTS / VERSÕES (Prompt Item 7) -->
            <section class="pdw-card pdw-snapshots-card">
              <div class="pdw-card-header">
                <div class="pch-left">
                  <i data-lucide="archive"></i>
                  <h4>Versões Congeladas (Snapshots)</h4>
                </div>
                <button class="btn btn-xs btn-outline" onclick="ProjectWorkspaceModule.openSnapshotModal('${project.id}')">
                  <i data-lucide="plus"></i> Novo
                </button>
              </div>

              <div class="pdw-snapshots-list">
                ${ws.snapshots.length ? ws.snapshots.map(snp => `
                  <div class="snapshot-row">
                    <div class="snr-top">
                      <strong class="snr-label">${escapeHTML(snp.snapshotLabel)}</strong>
                      <span class="snr-status">${escapeHTML(snp.globalStatus)}</span>
                    </div>
                    <p class="snr-desc">${escapeHTML(snp.description)}</p>
                    <div class="snr-meta">
                      <span><i data-lucide="user"></i> ${escapeHTML(snp.createdBy)}</span>
                      <span><i data-lucide="clock"></i> ${formatDateBR(snp.createdAt)}</span>
                    </div>
                  </div>
                `).join('') : `
                  <div class="p-3 text-center text-muted text-xs">Nenhum snapshot de versão congelado.</div>
                `}
              </div>
            </section>

          </div>

          <!-- COLUNA DIREITA (Prioridades 5 e 6: Entregáveis com Revit, Ambientes e Cronograma) -->
          <div class="pdw-col-right">

            <!-- PRIORIDADE 5: ENTREGÁVEIS & ARQUIVOS COM REVIT (Prompt Itens 4, 5, 6, 16, 17) -->
            <section class="pdw-card pdw-deliverables-card">
              <div class="pdw-card-header-flex">
                <div class="pch-left">
                  <i data-lucide="folder-git-2"></i>
                  <h4>Entregáveis & Modelos Técnicos</h4>
                </div>
                
                <div class="pdw-deliverables-actions">
                  <input 
                    type="text" 
                    class="pdw-search-input" 
                    placeholder="Buscar prancha, corte, vista..." 
                    value="${escapeHTML(this.searchQuery)}"
                    oninput="ProjectWorkspaceModule.onSearchInput('${project.id}', this.value)"
                  />
                  <button class="btn btn-primary btn-xs" onclick="ProjectWorkspaceModule.openNewDeliverableModal('${project.id}')">
                    <i data-lucide="plus"></i> Adicionar
                  </button>
                </div>
              </div>

              <!-- FILTROS POR DISCIPLINAS (Prompt Item 4) -->
              <div class="disciplines-filter-bar">
                <button 
                  class="df-chip ${this.activeDisciplineFilter === 'ALL' ? 'active' : ''}" 
                  onclick="ProjectWorkspaceModule.setDisciplineFilter('${project.id}', 'ALL')"
                >
                  Todas (${ws.deliverables.length})
                </button>
                ${StudioState.PROJECT_DISCIPLINES.map(disc => {
                  const count = ws.deliverables.filter(d => d.discipline === disc).length;
                  return `
                    <button 
                      class="df-chip ${this.activeDisciplineFilter === disc ? 'active' : ''}" 
                      onclick="ProjectWorkspaceModule.setDisciplineFilter('${project.id}', '${disc}')"
                    >
                      ${escapeHTML(disc)} ${count > 0 ? `(${count})` : ''}
                    </button>
                  `;
                }).join('')}
              </div>

              <!-- LISTA / TABELA DE ENTREGÁVEIS -->
              <div class="deliverables-table-wrap">
                <table class="deliverables-table">
                  <thead>
                    <tr>
                      <th>Entregável & Versão</th>
                      <th>Disciplina</th>
                      <th>Origem / Revit</th>
                      <th>Classificação</th>
                      <th>Responsável</th>
                      <th>Prazo</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filteredDeliverables.length ? filteredDeliverables.map(dlv => {
                      const isRevit = dlv.origin === 'REVIT';
                      const statusMap = {
                        'APPROVED': { label: 'Aprovado', cls: 'badge-app' },
                        'IN_REVIEW': { label: 'Em Revisão', cls: 'badge-rev' },
                        'DRAFT': { label: 'Rascunho', cls: 'badge-dft' },
                        'REJECTED': { label: 'Rejeitado', cls: 'badge-rej' },
                        'SUPERSEDED': { label: 'Substituído', cls: 'badge-sup' }
                      };
                      const st = statusMap[dlv.status] || { label: dlv.status, cls: 'badge-dft' };

                      return `
                        <tr>
                          <td>
                            <div class="dlv-title-cell">
                              <strong>${escapeHTML(dlv.title)}</strong>
                              <div class="dlv-sub">
                                <span class="badge-ver">${escapeHTML(dlv.version)}</span>
                                <span class="dlv-type">${escapeHTML(dlv.deliverableType)}</span>
                                ${dlv.fileName ? `<span class="dlv-file"><i data-lucide="file"></i> ${escapeHTML(dlv.fileName)}</span>` : ''}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span class="disc-pill disc-${dlv.discipline.toLowerCase()}">${escapeHTML(dlv.discipline)}</span>
                          </td>
                          <td>
                            ${isRevit ? `
                              <div class="revit-tag-box" title="Vista: ${escapeHTML(dlv.revitViewName)} | Pavimento: ${escapeHTML(dlv.revitLevel || 'Geral')}">
                                <span class="badge-revit"><i data-lucide="box"></i> REVIT</span>
                                <span class="revit-view-name">${escapeHTML(dlv.revitViewName || 'Vista Padrão')}</span>
                                ${dlv.revitLevel ? `<span class="revit-level">${escapeHTML(dlv.revitLevel)}</span>` : ''}
                              </div>
                            ` : `
                              <span class="origin-tag origin-${(dlv.origin || 'manual').toLowerCase()}">${escapeHTML(dlv.origin || 'Manual')}</span>
                            `}
                          </td>
                          <td>
                            <span class="classif-pill classif-${dlv.fileClassification.toLowerCase()}">${escapeHTML(dlv.fileClassification)}</span>
                          </td>
                          <td>
                            <span class="text-xs"><i data-lucide="user"></i> ${escapeHTML(dlv.responsible)}</span>
                          </td>
                          <td>
                            <span class="text-xs">${formatDateBR(dlv.dueDate) || '-'}</span>
                          </td>
                          <td>
                            <span class="status-chip ${st.cls}">${st.label}</span>
                          </td>
                          <td>
                            <div class="table-actions">
                              ${dlv.status !== 'APPROVED' ? `
                                <button class="btn-action-icon text-emerald" onclick="ProjectWorkspaceModule.approveDeliverable('${project.id}', '${dlv.id}')" title="Aprovar formalmente">
                                  <i data-lucide="check"></i>
                                </button>
                                <button class="btn-action-icon text-rose" onclick="ProjectWorkspaceModule.rejectDeliverablePrompt('${project.id}', '${dlv.id}')" title="Rejeitar / Solicitar ajuste">
                                  <i data-lucide="x"></i>
                                </button>
                              ` : `
                                <span class="text-xs text-emerald" title="Aprovado por ${escapeHTML(dlv.approvedBy || '')}"><i data-lucide="check-circle-2"></i></span>
                              `}
                              <button class="btn-action-icon" onclick="ProjectWorkspaceModule.openEditDeliverableModal('${project.id}', '${dlv.id}')" title="Editar entregável">
                                <i data-lucide="edit-2"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      `;
                    }).join('') : `
                      <tr>
                        <td colspan="8" class="text-center p-6 text-muted">
                          Nenhum entregável encontrado para os filtros selecionados.
                        </td>
                      </tr>
                    `}
                  </tbody>
                </table>
              </div>
            </section>

            <!-- PRIORIDADE 6: PROGRESSO POR AMBIENTE & CRONOGRAMA CONECTADO (Prompt Itens 12 e 14) -->
            <div class="pdw-grid-bottom-row">
              
              <!-- PROGRESSO POR AMBIENTE (Prompt Item 12) -->
              <section class="pdw-card pdw-environments-progress-card">
                <div class="pdw-card-header">
                  <div class="pch-left">
                    <i data-lucide="home"></i>
                    <h4>Progresso por Ambiente</h4>
                  </div>
                  <span class="text-xs text-secondary">Cálculo estruturado ponderado</span>
                </div>

                <div class="env-progress-list">
                  ${ws.environmentProgress.length ? ws.environmentProgress.map(env => `
                    <div class="env-progress-row">
                      <div class="epr-top">
                        <span class="epr-name" onclick="StudioApp.openEnvironment('${env.environmentId}')">
                          ${escapeHTML(env.environmentName)}
                        </span>
                        <strong class="epr-val" style="color: ${getProgressColor(env.progressPct)}">${env.progressPct}%</strong>
                      </div>
                      <div class="epr-bar-bg">
                        <div class="epr-bar-fill" style="width: ${env.progressPct}%; background-color: ${getProgressColor(env.progressPct)}"></div>
                      </div>
                      <div class="epr-breakdown">
                        ${env.breakdown.map(b => `
                          <span class="epb-tag" title="${b.label}: ${b.score}/${b.weight} pts">${b.label}</span>
                        `).join('')}
                      </div>
                    </div>
                  `).join('') : `
                    <div class="p-4 text-center text-muted">Nenhum ambiente cadastrado no projeto.</div>
                  `}
                </div>
              </section>

              <!-- CRONOGRAMA INTEGRADO (Prompt Item 14 - Sem duplicação) -->
              <section class="pdw-card pdw-schedule-card">
                <div class="pdw-card-header">
                  <div class="pch-left">
                    <i data-lucide="calendar"></i>
                    <h4>Cronograma Conectado</h4>
                  </div>
                  <button class="btn btn-xs btn-outline" onclick="StudioApp.setProjectTab('cronograma')">
                    <i data-lucide="calendar"></i> Ver cronograma
                  </button>
                </div>

                <div class="schedule-summary-box">
                  <div class="ssb-stats">
                    <div class="ssb-stat">
                      <span class="ssb-label">Total de Tarefas</span>
                      <strong>${ws.schedule.totalTasks}</strong>
                    </div>
                    <div class="ssb-stat">
                      <span class="ssb-label">Concluídas</span>
                      <strong class="text-emerald">${ws.schedule.completedTasks}</strong>
                    </div>
                    <div class="ssb-stat">
                      <span class="ssb-label">Avanço Físico</span>
                      <strong style="color: ${getProgressColor(ws.schedule.progressPct)}">${ws.schedule.progressPct}%</strong>
                    </div>
                  </div>

                  <div class="schedule-recent-tasks">
                    <span class="srt-title">Próximas Entregas do Cronograma Geral:</span>
                    ${ws.schedule.tasks.slice(0, 3).map(t => `
                      <div class="srt-row">
                        <span class="srt-name">${escapeHTML(t.tarefa || t.title)}</span>
                        <span class="srt-due">${formatDateBR(t.data_conclusao || t.dueDate)}</span>
                        <span class="srt-pct">${t.porcentagem || 0}%</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </section>

            </div>

          </div>

        </div>

        <!-- MODAL CONTAINER ROOT -->
        <div id="pdw-modal-root"></div>
      </div>
    `;
  },

  // ==========================================================================
  // EVENTOS E FILTROS
  // ==========================================================================

  setDisciplineFilter(projectId, disc) {
    this.activeDisciplineFilter = disc;
    this.refreshUI(projectId);
  },

  onSearchInput(projectId, query) {
    this.searchQuery = query;
    this.refreshUI(projectId);
  },

  // ==========================================================================
  // APROVAÇÕES E AÇÕES DE ENTREGÁVEIS
  // ==========================================================================

  approveDeliverable(projectId, deliverableId) {
    const res = StudioState.approveDeliverable(projectId, deliverableId, 'Eduardo Marques (Arquiteto Titular)', 'Aprovado via Workspace C05');
    if (res.success) {
      this.refreshUI(projectId);
    }
  },

  rejectDeliverablePrompt(projectId, deliverableId) {
    const reason = prompt('Informe o motivo formal do ajuste ou rejeição do entregável:');
    if (reason) {
      StudioState.rejectDeliverable(projectId, deliverableId, reason);
      this.refreshUI(projectId);
    }
  },

  toggleMilestonePrompt(projectId, milestoneKey, currentAchieved) {
    const confirmMsg = currentAchieved 
      ? 'Deseja marcar este marco como pendente?' 
      : 'Deseja confirmar a conquista deste marco formal do projeto?';
    if (confirm(confirmMsg)) {
      StudioState.toggleMilestone(projectId, milestoneKey, !currentAchieved, 'Atualizado via Workspace C05', 'Eduardo Marques');
      this.refreshUI(projectId);
    }
  },

  toggleStage(projectId, stageKey, isCompleted) {
    StudioState.toggleProjectChecklistStage(projectId, stageKey, isCompleted);
    this.refreshUI(projectId);
  },

  // ==========================================================================
  // MODAIS (ESTADO, SNAPSHOT, ENTREGÁVEL, ASSISTENTE IA)
  // ==========================================================================

  openStatusModal(projectId) {
    const project = StudioState.getProject(projectId);
    const root = document.getElementById('pdw-modal-root');
    if (!root) return;

    root.innerHTML = `
      <div class="modal-backdrop" onclick="ProjectWorkspaceModule.closeModal(event)">
        <div class="modal-card modal-sm" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3><i data-lucide="sliders"></i> Alterar Estado Global do Projeto</h3>
            <button class="btn-close" onclick="ProjectWorkspaceModule.closeModal()"><i data-lucide="x"></i></button>
          </div>
          <div class="modal-body">
            <p class="text-xs text-secondary mb-3">
              Selecione o estado oficial vigente de acordo com a máquina de estados do Bloco C05:
            </p>
            <div class="status-options-grid">
              ${StudioState.PROJECT_STATUSES.map(st => `
                <button 
                  class="status-option-btn ${project.status === st ? 'is-active' : ''}" 
                  onclick="ProjectWorkspaceModule.saveGlobalStatus('${projectId}', '${st}')"
                >
                  <span class="sob-name">${escapeHTML(st)}</span>
                  ${project.status === st ? '<i data-lucide="check"></i>' : ''}
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  },

  saveGlobalStatus(projectId, newStatus) {
    StudioState.updateProjectGlobalStatus(projectId, newStatus);
    this.closeModal();
    this.refreshUI(projectId);
  },

  openSnapshotModal(projectId) {
    const existing = StudioState.getProjectSnapshots(projectId);
    const nextNum = existing.length + 1;
    const defaultLabel = `PROJECT_V0${nextNum}`;
    const root = document.getElementById('pdw-modal-root');
    if (!root) return;

    root.innerHTML = `
      <div class="modal-backdrop" onclick="ProjectWorkspaceModule.closeModal(event)">
        <div class="modal-card modal-md" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3><i data-lucide="archive"></i> Congelar Versão do Projeto (Snapshot)</h3>
            <button class="btn-close" onclick="ProjectWorkspaceModule.closeModal()"><i data-lucide="x"></i></button>
          </div>
          <form onsubmit="ProjectWorkspaceModule.handleCreateSnapshot(event, '${projectId}')">
            <div class="modal-body">
              <p class="text-xs text-secondary mb-3">
                Este snapshot congela de forma <strong>não-destrutiva</strong> todo o contexto vigente do projeto: briefing aprovado, conceito, estudos homologados, entregáveis e decisões atuais.
              </p>
              <div class="form-group mb-3">
                <label>Identificador da Versão *</label>
                <input type="text" id="snapshot-label" value="${defaultLabel}" required class="styled-input" />
              </div>
              <div class="form-group mb-3">
                <label>Descrição do Marco / Motivo do Congelamento *</label>
                <textarea id="snapshot-desc" rows="3" required class="styled-input" placeholder="Ex: Congelamento para emissão das pranchas executivas preliminares para orçamento de obra..."></textarea>
              </div>
              <div class="form-group mb-3">
                <label>Responsável pelo Snapshot</label>
                <input type="text" id="snapshot-resp" value="Eduardo Marques (Arquiteto Titular)" class="styled-input" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline" onclick="ProjectWorkspaceModule.closeModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary"><i data-lucide="check"></i> Criar Snapshot</button>
            </div>
          </form>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  },

  handleCreateSnapshot(e, projectId) {
    e.preventDefault();
    const label = document.getElementById('snapshot-label').value.trim();
    const desc = document.getElementById('snapshot-desc').value.trim();
    const resp = document.getElementById('snapshot-resp').value.trim();

    StudioState.createProjectSnapshot(projectId, label, desc, resp);
    this.closeModal();
    this.refreshUI(projectId);
  },

  openNewDeliverableModal(projectId, deliverableId = null) {
    const root = document.getElementById('pdw-modal-root');
    if (!root) return;

    let dlv = null;
    if (deliverableId) {
      dlv = StudioState.getProjectDeliverables(projectId).find(d => d.id === deliverableId);
    }

    const isEdit = !!dlv;
    const envs = (StudioState.data.environments || []).filter(e => e.projectId === projectId);

    root.innerHTML = `
      <div class="modal-backdrop" onclick="ProjectWorkspaceModule.closeModal(event)">
        <div class="modal-card modal-lg" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3><i data-lucide="${isEdit ? 'edit-3' : 'plus-circle'}"></i> ${isEdit ? 'Editar Entregável' : 'Cadastrar Novo Entregável'}</h3>
            <button class="btn-close" onclick="ProjectWorkspaceModule.closeModal()"><i data-lucide="x"></i></button>
          </div>
          <form onsubmit="ProjectWorkspaceModule.handleSaveDeliverable(event, '${projectId}', '${deliverableId || ''}')">
            <div class="modal-body">
              <div class="form-grid-2">
                <div class="form-group span-2">
                  <label>Título do Entregável *</label>
                  <input type="text" id="dlv-title" value="${escapeHTML(dlv ? dlv.title : '')}" required class="styled-input" placeholder="Ex: Planta Baixa Geral - Executivo" />
                </div>

                <div class="form-group">
                  <label>Disciplina Técnica *</label>
                  <select id="dlv-discipline" class="styled-input" required>
                    ${StudioState.PROJECT_DISCIPLINES.map(d => `
                      <option value="${d}" ${dlv && dlv.discipline === d ? 'selected' : ''}>${escapeHTML(d)}</option>
                    `).join('')}
                  </select>
                </div>

                <div class="form-group">
                  <label>Tipo de Entregável *</label>
                  <select id="dlv-type" class="styled-input" required>
                    ${['Planta baixa', 'Layout', 'Corte', 'Elevação', 'Fachada', 'Perspectivas', 'Renders', 'Moodboard', 'Memorial', 'Pranchas'].map(t => `
                      <option value="${t}" ${dlv && dlv.deliverableType === t ? 'selected' : ''}>${escapeHTML(t)}</option>
                    `).join('')}
                  </select>
                </div>

                <div class="form-group">
                  <label>Ambiente Específico</label>
                  <select id="dlv-env" class="styled-input">
                    <option value="">-- Todo o Projeto / Geral --</option>
                    ${envs.map(e => `
                      <option value="${e.id}" ${dlv && dlv.environmentId === e.id ? 'selected' : ''}>${escapeHTML(e.name)}</option>
                    `).join('')}
                  </select>
                </div>

                <div class="form-group">
                  <label>Origem do Arquivo / Ferramenta *</label>
                  <select id="dlv-origin" class="styled-input" onchange="ProjectWorkspaceModule.toggleRevitFields(this.value)">
                    <option value="REVIT" ${dlv && dlv.origin === 'REVIT' ? 'selected' : ''}>Autodesk Revit (BIM)</option>
                    <option value="AUTOCAD" ${dlv && dlv.origin === 'AUTOCAD' ? 'selected' : ''}>AutoCAD (DWG)</option>
                    <option value="EXTERNAL" ${dlv && dlv.origin === 'EXTERNAL' ? 'selected' : ''}>Corona / 3ds Max / V-Ray</option>
                    <option value="MANUAL" ${dlv && dlv.origin === 'MANUAL' ? 'selected' : ''}>Manual / Prancha Externa</option>
                  </select>
                </div>
              </div>

              <!-- CAMPOS ESPECÍFICOS DO REVIT (Prompt Item 6) -->
              <div id="revit-fields-container" class="revit-sub-form mt-3" style="display: ${(!dlv || dlv.origin === 'REVIT') ? 'block' : 'none'}">
                <div class="revit-sub-head">
                  <i data-lucide="box"></i>
                  <span>Metadados da Vista no Autodesk Revit</span>
                </div>
                <div class="form-grid-2">
                  <div class="form-group">
                    <label>Nome da Vista no Revit</label>
                    <input type="text" id="dlv-revit-view" value="${escapeHTML(dlv ? dlv.revitViewName || '' : '')}" class="styled-input" placeholder="Ex: Planta - Térreo - Executivo" />
                  </div>
                  <div class="form-group">
                    <label>Pavimento / Nível do Revit</label>
                    <input type="text" id="dlv-revit-level" value="${escapeHTML(dlv ? dlv.revitLevel || '' : '')}" class="styled-input" placeholder="Ex: Nível 0.00 - Térreo" />
                  </div>
                  <div class="form-group">
                    <label>Versão do Revit</label>
                    <input type="text" id="dlv-revit-ver" value="${escapeHTML(dlv ? dlv.revitVersion || 'Revit 2026' : 'Revit 2026')}" class="styled-input" />
                  </div>
                  <div class="form-group">
                    <label>Observações Técnicas do Revit</label>
                    <input type="text" id="dlv-revit-notes" value="${escapeHTML(dlv ? dlv.revitNotes || '' : '')}" class="styled-input" placeholder="Ex: Folha A101 pronta para plotagem" />
                  </div>
                </div>
              </div>

              <div class="form-grid-2 mt-3">
                <div class="form-group">
                  <label>Responsável Técnico *</label>
                  <input type="text" id="dlv-resp" value="${escapeHTML(dlv ? dlv.responsible : 'Eduardo Marques')}" required class="styled-input" />
                </div>
                <div class="form-group">
                  <label>Prazo de Entrega</label>
                  <input type="date" id="dlv-due" value="${dlv ? (dlv.dueDate || '') : ''}" class="styled-input" />
                </div>
                <div class="form-group">
                  <label>Versão do Entregável</label>
                  <input type="text" id="dlv-version" value="${dlv ? dlv.version : 'V01'}" class="styled-input" placeholder="V01" />
                </div>
                <div class="form-group">
                  <label>Classificação do Arquivo *</label>
                  <select id="dlv-classif" class="styled-input">
                    ${StudioState.FILE_CLASSIFICATIONS.map(c => `
                      <option value="${c}" ${dlv && dlv.fileClassification === c ? 'selected' : ''}>${escapeHTML(c)}</option>
                    `).join('')}
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline" onclick="ProjectWorkspaceModule.closeModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary"><i data-lucide="save"></i> Salvar Entregável</button>
            </div>
          </form>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  },

  toggleRevitFields(originVal) {
    const el = document.getElementById('revit-fields-container');
    if (el) {
      el.style.display = originVal === 'REVIT' ? 'block' : 'none';
    }
  },

  handleSaveDeliverable(e, projectId, deliverableId) {
    e.preventDefault();
    const data = {
      id: deliverableId || null,
      title: document.getElementById('dlv-title').value.trim(),
      discipline: document.getElementById('dlv-discipline').value,
      deliverableType: document.getElementById('dlv-type').value,
      environmentId: document.getElementById('dlv-env').value || null,
      origin: document.getElementById('dlv-origin').value,
      revitViewName: document.getElementById('dlv-revit-view') ? document.getElementById('dlv-revit-view').value.trim() : '',
      revitLevel: document.getElementById('dlv-revit-level') ? document.getElementById('dlv-revit-level').value.trim() : '',
      revitVersion: document.getElementById('dlv-revit-ver') ? document.getElementById('dlv-revit-ver').value.trim() : '',
      revitNotes: document.getElementById('dlv-revit-notes') ? document.getElementById('dlv-revit-notes').value.trim() : '',
      responsible: document.getElementById('dlv-resp').value.trim(),
      dueDate: document.getElementById('dlv-due').value || null,
      version: document.getElementById('dlv-version').value.trim() || 'V01',
      fileClassification: document.getElementById('dlv-classif').value
    };

    StudioState.saveProjectDeliverable(projectId, data);
    this.closeModal();
    this.refreshUI(projectId);
  },

  openAiSummaryModal(projectId) {
    const summary = StudioState.generateAiProjectSummary(projectId);
    const root = document.getElementById('pdw-modal-root');
    if (!root || !summary) return;

    root.innerHTML = `
      <div class="modal-backdrop" onclick="ProjectWorkspaceModule.closeModal(event)">
        <div class="modal-card modal-md" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3><i data-lucide="sparkles"></i> Síntese Inteligente de Governança</h3>
            <button class="btn-close" onclick="ProjectWorkspaceModule.closeModal()"><i data-lucide="x"></i></button>
          </div>
          <div class="modal-body">
            <div class="ai-summary-card mb-3">
              <p class="mb-2"><strong>Visão Geral:</strong> ${summary.overview}</p>
              <p class="mb-2"><strong>Saúde dos Entregáveis:</strong> ${summary.deliverablesHealth}</p>
              <p class="mb-2 text-emerald"><strong>Próximo Marco:</strong> ${summary.nextTarget}</p>
            </div>

            <div class="mb-3">
              <strong>Marcos Concluídos Formalmente:</strong>
              <ul class="text-xs list-disc pl-5 mt-1 text-secondary">
                ${summary.achievedMilestones.map(m => `<li>${escapeHTML(m)}</li>`).join('')}
              </ul>
            </div>

            <div class="mb-3">
              <strong class="text-amber">Gargalos e Pendências Prioritárias:</strong>
              <ul class="text-xs list-disc pl-5 mt-1 text-secondary">
                ${summary.criticalIssues.length ? summary.criticalIssues.map(i => `<li>${escapeHTML(i)}</li>`).join('') : '<li>Nenhum gargalo de alta prioridade no momento.</li>'}
              </ul>
            </div>

            <div class="alert alert-info text-xs mt-3">
              <i data-lucide="shield-alert"></i>
              <span>${summary.safeguardNotice}</span>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="ProjectWorkspaceModule.closeModal()">Fechar</button>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  },

  closeModal(e) {
    if (e && e.target !== e.currentTarget) return;
    const root = document.getElementById('pdw-modal-root');
    if (root) root.innerHTML = '';
  },

  refreshUI(projectId) {
    if (typeof StudioApp !== 'undefined' && StudioApp.currentProjectId === projectId) {
      const project = StudioState.getProject(projectId);
      const client = StudioState.getClient(project.clientId);
      const container = document.getElementById('workspace-tab-content');
      if (container) {
        container.innerHTML = this.render(project, client);
        if (window.lucide) lucide.createIcons();
      }
    }
  }
};

// Exportação global e para Node.js
if (typeof window !== 'undefined') {
  window.ProjectWorkspaceModule = ProjectWorkspaceModule;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProjectWorkspaceModule;
}
