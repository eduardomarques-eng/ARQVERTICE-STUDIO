/**
 * ============================================================================
 * ARQVERTICE STUDIO — MÓDULO DE MEMÓRIA ESTRUTURADA E CONTEXTO DO PROJETO (BLOCO C06)
 * Governança Cognitiva para IA, Decisões, Restrições, Conflitos e Auditoria
 * ============================================================================
 */

const MemoryModule = {
  activeTab: 'decisoes', // 'decisoes', 'restricoes', 'aprovados_rejeitados', 'conflitos', 'auditoria', 'contexto_ia'
  activeCategoryFilter: 'ALL',
  activeEnvFilter: 'ALL',
  searchQuery: '',

  /**
   * Renderiza a visualização administrativa da Memória do Projeto
   */
  render(project, client) {
    if (!project) return `<div class="p-8 text-center text-muted">Projeto não selecionado.</div>`;

    const memories = StudioState.getProjectMemories(project.id, {
      environmentId: this.activeEnvFilter === 'ALL' ? undefined : (this.activeEnvFilter === 'GLOBAL' ? null : this.activeEnvFilter),
      category: this.activeCategoryFilter === 'ALL' ? undefined : this.activeCategoryFilter,
      search: this.searchQuery || undefined
    });

    const activeDecisions = memories.filter(m => m.category === 'DECISION');
    const restrictions = memories.filter(m => m.category === 'RESTRICTION');
    const rejectedElements = memories.filter(m => m.category === 'REJECTED_OUTPUT');
    const approvedOutputs = memories.filter(m => m.category === 'APPROVED_OUTPUT');
    const conflicts = StudioState.getMemoryConflicts(project.id, 'ALL');
    const openConflicts = conflicts.filter(c => c.status === 'OPEN');
    const auditLogs = StudioState.getMemoryAuditLog(project.id);
    const environments = (StudioState.data.environments || []).filter(e => e.projectId === project.id);

    return `
      <div class="project-memory-workspace animate-fade-in">
        <!-- TOP HEADER: GOVERNANÇA DA MEMÓRIA DO PROJETO -->
        <header class="pmw-header">
          <div class="pmw-header-main">
            <div class="pmw-meta-row">
              <span class="pmw-pill-code"><i data-lucide="brain"></i> BLOCO C06 — MEMÓRIA, DECISÕES E CONTEXTO</span>
              <span class="pmw-pill-count"><i data-lucide="layers"></i> ${memories.length} memórias ativas</span>
              <span class="pmw-pill-decisions"><i data-lucide="check-circle-2"></i> ${activeDecisions.length} decisões aprovadas</span>
              ${openConflicts.length ? `
                <span class="pmw-pill-conflict"><i data-lucide="alert-triangle"></i> ${openConflicts.length} conflito(s) aberto(s)</span>
              ` : `
                <span class="pmw-pill-ok"><i data-lucide="shield-check"></i> Sem Conflitos</span>
              `}
            </div>
            <h2 class="pmw-title">Memória Cognitiva do Projeto: ${escapeHTML(project.name)}</h2>
            <p class="pmw-subtitle">
              Base estruturada de conhecimento em 5 níveis hierárquicos e 17 categorias. Alimenta os pacotes de contexto determinísticos para o motor de IA e renderizadores.
            </p>
          </div>

          <div class="pmw-header-actions">
            <button class="btn btn-primary btn-sm" onclick="MemoryModule.openNewMemoryModal('${project.id}')">
              <i data-lucide="plus"></i> Nova Memória / Decisão
            </button>
            <button class="btn btn-outline btn-sm" onclick="MemoryModule.openContextInspectorModal('${project.id}')">
              <i data-lucide="terminal"></i> Inspecionar Pacote IA
            </button>
          </div>
        </header>

        <!-- AVISO DE PRINCÍPIO COGNITIVO (Item 1 e 18 do Prompt) -->
        <div class="pmw-principle-banner">
          <div class="ppb-icon"><i data-lucide="info"></i></div>
          <div class="ppb-text">
            <strong>Princípio Fundamental da Memória ArqVértice:</strong> A IA nunca depende apenas do último prompt ou imagem solta.
            Ela recebe um pacote de contexto rígido com 8 níveis de precedência (1. Intenção &rarr; 2. Decisão aprovada &rarr; 3. Restrição &rarr; 4. Diretriz ambiente &rarr; 5. Projeto &rarr; 6. Referência &rarr; 7. Preferência &rarr; 8. Sugestão IA).
            Memória aprovada não é editada silenciosamente.
          </div>
        </div>

        <!-- BARRA DE NAVEGAÇÃO DE SUB-ABAS DA MEMÓRIA -->
        <nav class="pmw-nav-tabs">
          <button class="pmw-tab-btn ${this.activeTab === 'decisoes' ? 'active' : ''}" onclick="MemoryModule.setTab('${project.id}', 'decisoes')">
            <i data-lucide="check-square"></i> Decisões (${activeDecisions.length})
          </button>
          <button class="pmw-tab-btn ${this.activeTab === 'restricoes' ? 'active' : ''}" onclick="MemoryModule.setTab('${project.id}', 'restricoes')">
            <i data-lucide="shield-ban"></i> Restrições (${restrictions.length})
          </button>
          <button class="pmw-tab-btn ${this.activeTab === 'aprovados_rejeitados' ? 'active' : ''}" onclick="MemoryModule.setTab('${project.id}', 'aprovados_rejeitados')">
            <i data-lucide="thumbs-up"></i> Aprovados vs Rejeitados (${approvedOutputs.length + rejectedElements.length})
          </button>
          <button class="pmw-tab-btn ${this.activeTab === 'conflitos' ? 'active' : ''} ${openConflicts.length ? 'has-badge' : ''}" onclick="MemoryModule.setTab('${project.id}', 'conflitos')">
            <i data-lucide="alert-octagon"></i> Conflitos (${conflicts.length})
          </button>
          <button class="pmw-tab-btn ${this.activeTab === 'contexto_ia' ? 'active' : ''}" onclick="MemoryModule.setTab('${project.id}', 'contexto_ia')">
            <i data-lucide="cpu"></i> Pacotes de Contexto IA
          </button>
          <button class="pmw-tab-btn ${this.activeTab === 'auditoria' ? 'active' : ''}" onclick="MemoryModule.setTab('${project.id}', 'auditoria')">
            <i data-lucide="history"></i> Auditoria (${auditLogs.length})
          </button>
        </nav>

        <!-- FILTROS GERAIS (AMBIENTE, CATEGORIA, BUSCA) -->
        <div class="pmw-filters-bar">
          <div class="pf-group">
            <label class="pf-label"><i data-lucide="map-pin"></i> Escopo:</label>
            <select class="pf-select" onchange="MemoryModule.setEnvFilter('${project.id}', this.value)">
              <option value="ALL" ${this.activeEnvFilter === 'ALL' ? 'selected' : ''}>Todos os Escopos</option>
              <option value="GLOBAL" ${this.activeEnvFilter === 'GLOBAL' ? 'selected' : ''}>Global (Projeto Inteiro)</option>
              ${environments.map(e => `
                <option value="${e.id}" ${this.activeEnvFilter === e.id ? 'selected' : ''}>Ambiente: ${escapeHTML(e.name)}</option>
              `).join('')}
            </select>
          </div>

          <div class="pf-group">
            <label class="pf-label"><i data-lucide="tag"></i> Categoria:</label>
            <select class="pf-select" onchange="MemoryModule.setCategoryFilter('${project.id}', this.value)">
              <option value="ALL" ${this.activeCategoryFilter === 'ALL' ? 'selected' : ''}>Todas as Categorias</option>
              ${StudioState.MEMORY_CATEGORIES.map(cat => `
                <option value="${cat}" ${this.activeCategoryFilter === cat ? 'selected' : ''}>${cat}</option>
              `).join('')}
            </select>
          </div>

          <div class="pf-search">
            <input 
              type="text" 
              class="pf-input" 
              placeholder="Buscar assunto, termo, elemento..." 
              value="${escapeHTML(this.searchQuery)}"
              oninput="MemoryModule.onSearchInput('${project.id}', this.value)"
            />
          </div>
        </div>

        <!-- CONTEÚDO DA SUB-ABA ATIVA -->
        <main class="pmw-tab-body">
          ${this.renderActiveTabContent(project, memories, client, environments)}
        </main>

        <!-- CONTAINER PARA MODAIS DE MEMÓRIA -->
        <div id="pmw-modal-root"></div>
      </div>
    `;
  },

  /**
   * Renderiza o conteúdo da aba selecionada
   */
  renderActiveTabContent(project, memories, client, environments) {
    switch (this.activeTab) {
      case 'decisoes':
        return this.renderDecisionsTab(project, memories, environments);
      case 'restricoes':
        return this.renderRestrictionsTab(project, memories, environments);
      case 'aprovados_rejeitados':
        return this.renderApprovedVsRejectedTab(project, memories, environments);
      case 'conflitos':
        return this.renderConflictsTab(project);
      case 'contexto_ia':
        return this.renderContextPackagesTab(project, environments);
      case 'auditoria':
        return this.renderAuditTab(project);
      default:
        return this.renderDecisionsTab(project, memories, environments);
    }
  },

  /**
   * 1. ABA DE DECISÕES COM HISTÓRICO E SUPERSESSION
   */
  renderDecisionsTab(project, memories, environments) {
    const decisions = memories.filter(m => m.category === 'DECISION');

    if (!decisions.length) {
      return `
        <div class="pmw-empty-state">
          <i data-lucide="check-square"></i>
          <h4>Nenhuma decisão encontrada com os filtros atuais</h4>
          <p>Registre escolhas formais da ArqVértice ou do cliente para alimentar o histórico cognitivo.</p>
          <button class="btn btn-primary btn-sm mt-3" onclick="MemoryModule.openNewMemoryModal('${project.id}', 'DECISION')">
            <i data-lucide="plus"></i> Cadastrar Primeira Decisão
          </button>
        </div>
      `;
    }

    return `
      <div class="pmw-cards-grid">
        ${decisions.map(d => {
          const env = environments.find(e => e.id === d.environmentId);
          const scopeLabel = env ? `Ambiente: ${env.name}` : 'Diretriz Global do Projeto';
          const isSuperseded = d.status === 'SUPERSEDED';

          return `
            <div class="pmw-card ${isSuperseded ? 'is-superseded' : ''} ${d.isLock ? 'is-locked' : ''}">
              <div class="pmwc-header">
                <div class="pmwc-tags">
                  <span class="pmw-badge pmw-badge-level">${d.hierarchyLevel}</span>
                  <span class="pmw-badge pmw-badge-status pmw-status-${d.status.toLowerCase()}">${d.status}</span>
                  <span class="pmw-badge pmw-badge-version">V0${d.version}</span>
                  ${d.isLock ? '<span class="pmw-badge pmw-badge-lock"><i data-lucide="lock"></i> TRAVADO (LOCK)</span>' : ''}
                </div>
                <span class="pmwc-date">${formatDateBR(d.updatedAt || d.createdAt)}</span>
              </div>

              <h4 class="pmwc-title">${escapeHTML(d.subject)}</h4>
              <div class="pmwc-scope"><i data-lucide="map-pin"></i> ${escapeHTML(scopeLabel)} &bull; Elemento: <code>${escapeHTML(d.elementKey)}</code></div>

              <div class="pmwc-statement">
                "${escapeHTML(d.statement)}"
              </div>

              ${d.reason ? `
                <div class="pmwc-reason">
                  <strong><i data-lucide="help-circle"></i> Motivo:</strong> ${escapeHTML(d.reason)}
                </div>
              ` : ''}

              <div class="pmwc-footer">
                <div class="pmwc-meta">
                  <span><i data-lucide="user"></i> ${escapeHTML(d.responsible)}</span>
                  <span><i data-lucide="share-2"></i> Fonte: ${escapeHTML(d.source)}</span>
                  <span><i data-lucide="check"></i> Confiança: ${escapeHTML(d.confidence)}</span>
                </div>

                <div class="pmwc-actions">
                  ${!isSuperseded ? `
                    <button class="btn btn-outline btn-xs" onclick="MemoryModule.openSupersedeModal('${project.id}', '${d.id}')" title="Substituir por nova versão sem apagar a anterior">
                      <i data-lucide="repeat"></i> Nova Versão (Supersede)
                    </button>
                  ` : `
                    <span class="text-xs text-muted"><i data-lucide="archive"></i> Histórico Preservado</span>
                  `}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  /**
   * 2. ABA DE RESTRIÇÕES E DIRETRIZES TÉCNICAS
   */
  renderRestrictionsTab(project, memories, environments) {
    const restrictions = memories.filter(m => m.category === 'RESTRICTION' || m.category === 'PREFERENCE');

    if (!restrictions.length) {
      return `
        <div class="pmw-empty-state">
          <i data-lucide="shield-ban"></i>
          <h4>Nenhuma restrição registrada</h4>
          <p>Cadastre limites legais, normas ergonômicas, restrições estruturais ou preferências do cliente.</p>
          <button class="btn btn-primary btn-sm mt-3" onclick="MemoryModule.openNewMemoryModal('${project.id}', 'RESTRICTION')">
            <i data-lucide="plus"></i> Nova Restrição
          </button>
        </div>
      `;
    }

    return `
      <div class="pmw-cards-grid">
        ${restrictions.map(r => {
          const env = environments.find(e => e.id === r.environmentId);
          const scopeLabel = env ? `Ambiente: ${env.name}` : 'Global do Projeto';
          const isRestriction = r.category === 'RESTRICTION';

          return `
            <div class="pmw-card ${isRestriction ? 'border-amber' : ''}">
              <div class="pmwc-header">
                <div class="pmwc-tags">
                  <span class="pmw-badge ${isRestriction ? 'pmw-badge-restriction' : 'pmw-badge-preference'}">${r.category}</span>
                  <span class="pmw-badge pmw-badge-level">${r.hierarchyLevel}</span>
                  <span class="pmw-badge pmw-badge-status">${r.status}</span>
                </div>
                <span class="pmwc-date">${formatDateBR(r.createdAt)}</span>
              </div>

              <h4 class="pmwc-title">${escapeHTML(r.subject)}</h4>
              <div class="pmwc-scope"><i data-lucide="map-pin"></i> ${escapeHTML(scopeLabel)} &bull; Elemento: <code>${escapeHTML(r.elementKey)}</code></div>

              <div class="pmwc-statement">
                "${escapeHTML(r.statement)}"
              </div>

              ${r.reason ? `
                <div class="pmwc-reason">
                  <strong>Justificativa Técnica:</strong> ${escapeHTML(r.reason)}
                </div>
              ` : ''}

              <div class="pmwc-footer">
                <div class="pmwc-meta">
                  <span><i data-lucide="user"></i> ${escapeHTML(r.responsible)}</span>
                  <span><i data-lucide="database"></i> Fonte: ${escapeHTML(r.source)}</span>
                </div>
                <button class="btn btn-outline btn-xs" onclick="MemoryModule.openSupersedeModal('${project.id}', '${r.id}')">
                  <i data-lucide="edit-3"></i> Atualizar
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  /**
   * 3. ABA DE ELEMENTOS APROVADOS VS REJEITADOS
   */
  renderApprovedVsRejectedTab(project, memories, environments) {
    const approved = memories.filter(m => m.category === 'APPROVED_OUTPUT' || (m.category === 'MATERIAL' && m.status === 'CURRENT'));
    const rejected = memories.filter(m => m.category === 'REJECTED_OUTPUT');

    return `
      <div class="pmw-split-view">
        <!-- COLUNA 1: ELEMENTOS APROVADOS (WHITELIST / REFERÊNCIAS VIGENTES) -->
        <div class="pmw-split-col">
          <div class="split-col-header bg-emerald-soft">
            <div class="sch-title">
              <i data-lucide="thumbs-up"></i>
              <h4>Elementos e Outputs Aprovados (${approved.length})</h4>
            </div>
            <span class="text-xs text-secondary">Referências de estado visual</span>
          </div>

          <div class="split-col-body">
            ${approved.length ? approved.map(item => `
              <div class="memory-output-item is-approved">
                <div class="moi-head">
                  <span class="moi-badge approved">APROVADO</span>
                  <span class="moi-elem">Elemento: <code>${escapeHTML(item.elementKey)}</code></span>
                </div>
                <strong class="moi-title">${escapeHTML(item.subject)}</strong>
                <p class="moi-stmt">${escapeHTML(item.statement)}</p>
                ${item.referenceLinks && item.referenceLinks.renderUrl ? `
                  <div class="moi-img-preview">
                    <img src="${escapeHTML(item.referenceLinks.renderUrl)}" alt="Output Aprovado" />
                  </div>
                ` : ''}
                <div class="moi-footer">
                  <small>Resp: ${escapeHTML(item.responsible)}</small>
                  <small>${formatDateBR(item.createdAt)}</small>
                </div>
              </div>
            `).join('') : `
              <div class="p-6 text-center text-muted">Nenhum output aprovado registrado ainda.</div>
            `}
          </div>
        </div>

        <!-- COLUNA 2: ELEMENTOS REJEITADOS (BLACKLIST / RESTRIÇÃO DE ESTILO) -->
        <div class="pmw-split-col">
          <div class="split-col-header bg-rose-soft">
            <div class="sch-title">
              <i data-lucide="thumbs-down"></i>
              <h4>Memória de Rejeição & Proibições (${rejected.length})</h4>
            </div>
            <span class="text-xs text-secondary">Itens explicitamente vetados</span>
          </div>

          <div class="split-col-body">
            ${rejected.length ? rejected.map(item => `
              <div class="memory-output-item is-rejected">
                <div class="moi-head">
                  <span class="moi-badge rejected">VETADO / REJEITADO</span>
                  <span class="moi-elem">Elemento: <code>${escapeHTML(item.elementKey)}</code></span>
                </div>
                <strong class="moi-title">${escapeHTML(item.subject)}</strong>
                <p class="moi-stmt">${escapeHTML(item.statement)}</p>
                <div class="moi-reason">
                  <strong>Motivo da Rejeição:</strong> ${escapeHTML(item.reason || 'Vetado pelo cliente/arquiteto')}
                </div>
                <div class="moi-footer">
                  <small>Fonte: ${escapeHTML(item.source)}</small>
                  <small>${formatDateBR(item.createdAt)}</small>
                </div>
              </div>
            `).join('') : `
              <div class="p-6 text-center text-muted">Nenhum elemento rejeitado registrado.</div>
            `}
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 4. ABA DE CONFLITOS DE MEMÓRIA (Prompt Item 26)
   */
  renderConflictsTab(project) {
    const conflicts = StudioState.getMemoryConflicts(project.id, 'ALL');

    if (!conflicts.length) {
      return `
        <div class="pmw-empty-state">
          <i data-lucide="shield-check" class="text-emerald"></i>
          <h4>Nenhum conflito de memória detectado</h4>
          <p>O motor cognitivo verifica decisões divergentes no mesmo elemento. Tudo em harmonia!</p>
        </div>
      `;
    }

    return `
      <div class="pmw-conflicts-list">
        <div class="alert alert-warning mb-4">
          <i data-lucide="alert-triangle"></i>
          <div>
            <strong>Regra de Governança sobre Conflitos:</strong> Havendo duas ou mais decisões ativas divergentes sobre o mesmo elemento (ex: "madeira clara" vs "madeira escura"), o sistema não escolhe arbitrariamente. Ele marca <code>CONFLICT</code> e exige homologação do arquiteto titular.
          </div>
        </div>

        ${conflicts.map(cnf => {
          const isOpen = cnf.status === 'OPEN';
          const conflictingMemories = (StudioState.data.projectMemories || []).filter(m => (cnf.memoryIds || []).includes(m.id));

          return `
            <div class="conflict-card ${isOpen ? 'is-open' : 'is-resolved'}">
              <div class="cc-header">
                <div class="cc-title-row">
                  <span class="cc-badge ${isOpen ? 'badge-danger' : 'badge-success'}">${cnf.status}</span>
                  <h4>${escapeHTML(cnf.description)}</h4>
                </div>
                <span class="text-xs text-secondary">${formatDateBR(cnf.createdAt)}</span>
              </div>

              <div class="cc-memories-comparison">
                <strong>Declarações em Conflito:</strong>
                <div class="cc-options-grid">
                  ${conflictingMemories.map(m => `
                    <div class="cc-option-box">
                      <div class="cco-head">
                        <span class="pmw-badge">V0${m.version} &bull; ${m.source}</span>
                        <span>Resp: ${escapeHTML(m.responsible)}</span>
                      </div>
                      <p class="cco-stmt">"${escapeHTML(m.statement)}"</p>
                      <small class="text-muted">Motivo: ${escapeHTML(m.reason || '-')}</small>
                      ${isOpen ? `
                        <div class="cco-btn-row">
                          <button class="btn btn-sm btn-primary" onclick="MemoryModule.resolveConflictAction('${cnf.id}', '${m.id}', '${project.id}')">
                            <i data-lucide="check"></i> Homologar Esta Opção
                          </button>
                        </div>
                      ` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>

              ${!isOpen ? `
                <div class="cc-resolution-box">
                  <strong>Resolução Homologada:</strong> ${escapeHTML(cnf.resolutionNotes)} &bull; Resolvido por <strong>${escapeHTML(cnf.resolvedBy || 'Equipe')}</strong> em ${formatDateBR(cnf.resolvedAt)}
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  /**
   * 5. ABA DE PACOTES DE CONTEXTO IA (Prompt Itens 15, 16, 17 e 29)
   */
  renderContextPackagesTab(project, environments) {
    const defaultEnv = environments[0] || null;
    const projectPackage = StudioState.getProjectContext(project.id);
    const envPackage = defaultEnv ? StudioState.getEnvironmentContext(defaultEnv.id) : null;

    return `
      <div class="pmw-context-packages-view">
        <div class="alert alert-info mb-4">
          <i data-lucide="cpu"></i>
          <div>
            <strong>Contratos Estáveis de Contexto (Prompt Item 29):</strong> Funções padronizadas que extraem unicamente o que é estritamente relevante para a tarefa de IA (render, modelagem, prompt compiling), sem enviar todo o banco indiscriminadamente.
          </div>
        </div>

        <div class="context-cards-row">
          <!-- CARD 1: PROJECT_CONTEXT_PACKAGE -->
          <div class="context-card">
            <div class="cc-top">
              <i data-lucide="briefcase"></i>
              <h4>PROJECT_CONTEXT_PACKAGE</h4>
            </div>
            <p class="text-xs text-secondary mb-3">Síntese global: briefing, conceito homologado, diretrizes globais e marcos.</p>
            <div class="context-stats-grid">
              <div class="cs-box"><span class="cs-num">${projectPackage.globalDecisions.length}</span><span class="cs-label">Decisões Globais</span></div>
              <div class="cs-box"><span class="cs-num">${projectPackage.globalRestrictions.length}</span><span class="cs-label">Restrições</span></div>
              <div class="cs-box"><span class="cs-num">${projectPackage.milestonesProgressPct}%</span><span class="cs-label">Marcos</span></div>
            </div>
            <button class="btn btn-outline btn-xs w-full mt-3" onclick="MemoryModule.inspectJsonPackage('project', '${project.id}')">
              <i data-lucide="code"></i> Ver JSON do Pacote de Projeto
            </button>
          </div>

          <!-- CARD 2: ENVIRONMENT_CONTEXT_PACKAGE -->
          <div class="context-card">
            <div class="cc-top">
              <i data-lucide="home"></i>
              <h4>ENVIRONMENT_CONTEXT_PACKAGE</h4>
            </div>
            <p class="text-xs text-secondary mb-3">Contexto focado no ambiente: locks, decisões, restrições e elementos vetados.</p>
            ${envPackage ? `
              <div class="context-stats-grid">
                <div class="cs-box"><span class="cs-num">${envPackage.approvedDecisions.length}</span><span class="cs-label">Decisões Sala</span></div>
                <div class="cs-box"><span class="cs-num">${envPackage.lockedElements.length}</span><span class="cs-label">Locks Rígidos</span></div>
                <div class="cs-box"><span class="cs-num">${envPackage.rejectedElements.length}</span><span class="cs-label">Vetados</span></div>
              </div>
              <button class="btn btn-outline btn-xs w-full mt-3" onclick="MemoryModule.inspectJsonPackage('environment', '${defaultEnv.id}')">
                <i data-lucide="code"></i> Ver JSON (${escapeHTML(defaultEnv.name)})
              </button>
            ` : `
              <p class="text-xs text-muted">Nenhum ambiente cadastrado.</p>
            `}
          </div>

          <!-- CARD 3: SIMULADOR DE PROMPT COM PRECEDÊNCIA (TESTE DE CONSISTÊNCIA) -->
          <div class="context-card">
            <div class="cc-top">
              <i data-lucide="sparkles"></i>
              <h4>SIMULADOR COM PRECEDÊNCIA</h4>
            </div>
            <p class="text-xs text-secondary mb-2">Simulação de intenção: <em>"Trocar somente o sofá"</em>.</p>
            <div class="sim-box-preview">
              <div class="sb-item text-emerald"><strong>Painel TV:</strong> APROVADO (LOCKED) &bull; Manter intacto</div>
              <div class="sb-item text-amber"><strong>Sofá:</strong> Alvo da alteração permitida</div>
              <div class="sb-item text-rose"><strong>Mármore Veinado:</strong> PROIBIDO (Rejeição)</div>
            </div>
            <button class="btn btn-primary btn-xs w-full mt-3" onclick="MemoryModule.runPrecedenceSimulation('${project.id}', '${defaultEnv ? defaultEnv.id : ''}')">
              <i data-lucide="play"></i> Executar Teste de Precedência
            </button>
          </div>
        </div>

        <!-- ÁREA DE EXIBIÇÃO DE JSON INSPECIONADO -->
        <div class="context-json-viewer mt-4" id="context-json-viewer-container" style="display: none;">
          <div class="cjv-header">
            <strong id="cjv-title">JSON do Pacote de Contexto</strong>
            <button class="btn-icon btn-ghost btn-xs" onclick="document.getElementById('context-json-viewer-container').style.display='none'">
              <i data-lucide="x"></i>
            </button>
          </div>
          <pre id="cjv-content"><code></code></pre>
        </div>
      </div>
    `;
  },

  /**
   * 6. ABA DE AUDITORIA DE MUTAÇÕES DE MEMÓRIA (Prompt Item 23)
   */
  renderAuditTab(project) {
    const logs = StudioState.getMemoryAuditLog(project.id);

    if (!logs.length) {
      return `
        <div class="pmw-empty-state">
          <i data-lucide="history"></i>
          <h4>Nenhum registro de auditoria</h4>
          <p>Toda mutação, criação ou supersession de memória é auditada aqui de forma imutável.</p>
        </div>
      `;
    }

    return `
      <div class="pmw-audit-timeline">
        <div class="timeline-track">
          ${logs.map(log => `
            <div class="timeline-entry">
              <div class="te-bullet"><i data-lucide="git-commit"></i></div>
              <div class="te-content">
                <div class="te-head">
                  <span class="te-action-badge action-${log.actionType.toLowerCase()}">${log.actionType}</span>
                  <strong class="te-user"><i data-lucide="user"></i> ${escapeHTML(log.changedBy)}</strong>
                  <span class="te-time">${formatDateBR(log.createdAt)}</span>
                </div>
                <p class="te-reason">${escapeHTML(log.reason || 'Alteração de governança')}</p>
                <div class="te-meta text-xs text-muted">
                  Memória ID: <code>${log.memoryId}</code> &bull; Assunto: <strong>${escapeHTML(log.newState ? log.newState.subject : 'Registro')}</strong>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // ==========================================================================
  // CONTROLES DE INTERFACE, FILTROS E EVENTOS
  // ==========================================================================

  setTab(projectId, tab) {
    this.activeTab = tab;
    this.refreshUI(projectId);
  },

  setCategoryFilter(projectId, cat) {
    this.activeCategoryFilter = cat;
    this.refreshUI(projectId);
  },

  setEnvFilter(projectId, envId) {
    this.activeEnvFilter = envId;
    this.refreshUI(projectId);
  },

  onSearchInput(projectId, val) {
    this.searchQuery = val;
    this.refreshUI(projectId);
  },

  refreshUI(projectId) {
    const project = StudioState.getProject(projectId);
    const client = StudioState.getClient(project ? project.clientId : null);
    const container = document.getElementById('workspace-tab-content');
    if (container && project) {
      container.innerHTML = this.render(project, client);
      if (window.lucide) lucide.createIcons();
    }
  },

  // ==========================================================================
  // MODAIS (CRIAÇÃO, SUPERSESSION, INSPEÇÃO)
  // ==========================================================================

  openNewMemoryModal(projectId, defaultCategory = 'DECISION') {
    const project = StudioState.getProject(projectId);
    const environments = (StudioState.data.environments || []).filter(e => e.projectId === projectId);
    const root = document.getElementById('pmw-modal-root');
    if (!root) return;

    root.innerHTML = `
      <div class="modal-overlay" onclick="MemoryModule.closeModal(event)">
        <div class="modal-card modal-lg animate-scale-in" onclick="event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <i data-lucide="plus-circle" class="text-primary"></i>
              <h3>Nova Memória Estruturada / Decisão</h3>
            </div>
            <button class="btn-icon btn-ghost" onclick="MemoryModule.closeModal()"><i data-lucide="x"></i></button>
          </div>

          <form onsubmit="MemoryModule.saveNewMemoryForm(event, '${projectId}')">
            <div class="modal-body">
              <div class="form-row form-row-2">
                <div class="form-group">
                  <label>Categoria de Memória *</label>
                  <select id="mem-category" class="form-select" required>
                    ${StudioState.MEMORY_CATEGORIES.map(c => `
                      <option value="${c}" ${c === defaultCategory ? 'selected' : ''}>${c}</option>
                    `).join('')}
                  </select>
                </div>

                <div class="form-group">
                  <label>Nível na Hierarquia *</label>
                  <select id="mem-hierarchy" class="form-select" required>
                    <option value="PROJETO">NÍVEL 2 — PROJETO (Global)</option>
                    <option value="AMBIENTE">NÍVEL 3 — AMBIENTE</option>
                    <option value="ELEMENTO" selected>NÍVEL 4 — ELEMENTO ESPECÍFICO</option>
                    <option value="IMAGEM_VERSAO">NÍVEL 5 — IMAGEM / VERSÃO</option>
                  </select>
                </div>
              </div>

              <div class="form-row form-row-2">
                <div class="form-group">
                  <label>Ambiente Vinculado</label>
                  <select id="mem-env" class="form-select">
                    <option value="">Diretriz Geral do Projeto (Sem ambiente único)</option>
                    ${environments.map(e => `
                      <option value="${e.id}">${escapeHTML(e.name)}</option>
                    `).join('')}
                  </select>
                </div>

                <div class="form-group">
                  <label>Chave do Elemento (element_key) *</label>
                  <input type="text" id="mem-element-key" class="form-input" placeholder="Ex: painel_tv, sofa, bancada_ilha" required />
                </div>
              </div>

              <div class="form-group">
                <label>Assunto / Título *</label>
                <input type="text" id="mem-subject" class="form-input" placeholder="Ex: Revestimento da parede da TV da sala" required />
              </div>

              <div class="form-group">
                <label>Declaração Formal da Memória / Decisão *</label>
                <textarea id="mem-statement" class="form-textarea" rows="3" placeholder="Ex: Manter painel em carvalho ripado com nicho inferior para equipamentos." required></textarea>
              </div>

              <div class="form-group">
                <label>Justificativa / Motivo da Escolha</label>
                <textarea id="mem-reason" class="form-textarea" rows="2" placeholder="Ex: Alinhado na reunião de 21/09 com o cliente Pedro."></textarea>
              </div>

              <div class="form-row form-row-3">
                <div class="form-group">
                  <label>Fonte da Informação</label>
                  <select id="mem-source" class="form-select">
                    ${StudioState.MEMORY_SOURCES.map(s => `
                      <option value="${s}" ${s === 'ARQVERTICE' ? 'selected' : ''}>${s}</option>
                    `).join('')}
                  </select>
                </div>

                <div class="form-group">
                  <label>Nível de Confiança</label>
                  <select id="mem-confidence" class="form-select">
                    ${StudioState.MEMORY_CONFIDENCE.map(c => `
                      <option value="${c}" ${c === 'CONFIRMED' ? 'selected' : ''}>${c}</option>
                    `).join('')}
                  </select>
                </div>

                <div class="form-group">
                  <label>Responsável</label>
                  <input type="text" id="mem-responsible" class="form-input" value="Eduardo Marques (Arquiteto)" />
                </div>
              </div>

              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="mem-lock" />
                  <span><strong>Travamento Estrito (Lock de IA):</strong> Elemento protegido contra modificações em futuras gerações</span>
                </label>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="MemoryModule.closeModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary"><i data-lucide="check"></i> Salvar na Memória</button>
            </div>
          </form>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  },

  saveNewMemoryForm(e, projectId) {
    e.preventDefault();
    const data = {
      projectId,
      category: document.getElementById('mem-category').value,
      hierarchyLevel: document.getElementById('mem-hierarchy').value,
      environmentId: document.getElementById('mem-env').value || null,
      elementKey: document.getElementById('mem-element-key').value.trim().toLowerCase().replace(/\s+/g, '_'),
      subject: document.getElementById('mem-subject').value.trim(),
      statement: document.getElementById('mem-statement').value.trim(),
      reason: document.getElementById('mem-reason').value.trim(),
      source: document.getElementById('mem-source').value,
      confidence: document.getElementById('mem-confidence').value,
      responsible: document.getElementById('mem-responsible').value.trim(),
      isLock: document.getElementById('mem-lock').checked
    };

    StudioState.addProjectMemory(data);
    this.closeModal();
    this.refreshUI(projectId);
  },

  openSupersedeModal(projectId, memoryId) {
    const memory = (StudioState.data.projectMemories || []).find(m => m.id === memoryId);
    if (!memory) return;
    const root = document.getElementById('pmw-modal-root');
    if (!root) return;

    root.innerHTML = `
      <div class="modal-overlay" onclick="MemoryModule.closeModal(event)">
        <div class="modal-card modal-lg animate-scale-in" onclick="event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <i data-lucide="repeat" class="text-amber"></i>
              <h3>Nova Versão de Memória (Supersession V0${memory.version + 1})</h3>
            </div>
            <button class="btn-icon btn-ghost" onclick="MemoryModule.closeModal()"><i data-lucide="x"></i></button>
          </div>

          <form onsubmit="MemoryModule.saveSupersedeForm(event, '${projectId}', '${memoryId}')">
            <div class="modal-body">
              <div class="alert alert-warning mb-3">
                <i data-lucide="shield-alert"></i>
                <div>
                  <strong>Preservação de Histórico:</strong> A versão V0${memory.version} será marcada como <code>SUPERSEDED</code> e permanecerá arquivada para fins de auditoria e rastreabilidade. A nova declaração se tornará <code>CURRENT (V0${memory.version + 1})</code>.
                </div>
              </div>

              <div class="form-group">
                <label>Declaração Anterior (V0${memory.version})</label>
                <div class="p-3 bg-secondary-soft rounded text-sm text-secondary">
                  "${escapeHTML(memory.statement)}"
                </div>
              </div>

              <div class="form-group">
                <label>Nova Declaração Vigente (V0${memory.version + 1}) *</label>
                <textarea id="sup-statement" class="form-textarea" rows="3" required placeholder="Ex: Substituir o painel ripado de carvalho por revestimento de pedra natural Moledo."></textarea>
              </div>

              <div class="form-group">
                <label>Motivo da Substituição / Mudança *</label>
                <textarea id="sup-reason" class="form-textarea" rows="2" required placeholder="Ex: Solicitação do cliente Pedro em reunião de alinhamento em 21/09."></textarea>
              </div>

              <div class="form-row form-row-2">
                <div class="form-group">
                  <label>Responsável pela Mudança</label>
                  <input type="text" id="sup-responsible" class="form-input" value="Eduardo Marques" required />
                </div>
                <div class="form-group">
                  <label>Fonte da Nova Decisão</label>
                  <select id="sup-source" class="form-select">
                    ${StudioState.MEMORY_SOURCES.map(s => `
                      <option value="${s}" ${s === 'ARQVERTICE' ? 'selected' : ''}>${s}</option>
                    `).join('')}
                  </select>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="MemoryModule.closeModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary"><i data-lucide="check"></i> Homologar Versão V0${memory.version + 1}</button>
            </div>
          </form>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  },

  saveSupersedeForm(e, projectId, oldMemoryId) {
    e.preventDefault();
    const newStatement = document.getElementById('sup-statement').value.trim();
    const newReason = document.getElementById('sup-reason').value.trim();
    const responsible = document.getElementById('sup-responsible').value.trim();
    const source = document.getElementById('sup-source').value;

    StudioState.supersedeProjectMemory(oldMemoryId, {
      statement: newStatement,
      reason: newReason,
      responsible,
      source
    }, responsible);

    this.closeModal();
    this.refreshUI(projectId);
  },

  resolveConflictAction(conflictId, winningMemoryId, projectId) {
    const notes = prompt('Informe a justificativa da resolução para registro no histórico de auditoria:');
    if (notes === null) return;

    StudioState.resolveMemoryConflict(conflictId, winningMemoryId, notes || 'Homologação pelo arquiteto titular.');
    this.refreshUI(projectId);
  },

  inspectJsonPackage(type, targetId) {
    const container = document.getElementById('context-json-viewer-container');
    const title = document.getElementById('cjv-title');
    const code = document.querySelector('#cjv-content code');
    if (!container || !code) return;

    let pkg = null;
    if (type === 'project') {
      pkg = StudioState.getProjectContext(targetId);
      title.innerText = 'PROJECT_CONTEXT_PACKAGE (JSON)';
    } else {
      pkg = StudioState.getEnvironmentContext(targetId);
      title.innerText = 'ENVIRONMENT_CONTEXT_PACKAGE (JSON)';
    }

    code.innerText = JSON.stringify(pkg, null, 2);
    container.style.display = 'block';
  },

  openContextInspectorModal(projectId) {
    const pkg = StudioState.getProjectContext(projectId);
    const root = document.getElementById('pmw-modal-root');
    if (!root) return;

    root.innerHTML = `
      <div class="modal-overlay" onclick="MemoryModule.closeModal(event)">
        <div class="modal-card modal-lg animate-scale-in" onclick="event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <i data-lucide="cpu" class="text-primary"></i>
              <h3>Inspetor do Pacote de Contexto para IA</h3>
            </div>
            <button class="btn-icon btn-ghost" onclick="MemoryModule.closeModal()"><i data-lucide="x"></i></button>
          </div>

          <div class="modal-body">
            <p class="text-xs text-secondary mb-3">
              Estrutura rigorosa montada pelo motor de memória enviada à IA (Prompt Items 15, 16 e 29):
            </p>
            <pre class="bg-dark p-3 rounded text-xs text-emerald" style="max-height: 400px; overflow-y: auto;"><code>${escapeHTML(JSON.stringify(pkg, null, 2))}</code></pre>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="MemoryModule.closeModal()">Fechar</button>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  },

  runPrecedenceSimulation(projectId, envId) {
    const userIntent = "Trocar somente o sofá da sala por um modelo em linho rústico";
    const compiled = StudioState.compileContextPackage(projectId, envId, userIntent);

    const root = document.getElementById('pmw-modal-root');
    if (!root) return;

    root.innerHTML = `
      <div class="modal-overlay" onclick="MemoryModule.closeModal(event)">
        <div class="modal-card modal-lg animate-scale-in" onclick="event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <i data-lucide="check-check" class="text-emerald"></i>
              <h3>Resultado da Simulação de Precedência (Prompt Item 32)</h3>
            </div>
            <button class="btn-icon btn-ghost" onclick="MemoryModule.closeModal()"><i data-lucide="x"></i></button>
          </div>

          <div class="modal-body">
            <div class="mb-3">
              <strong>Intenção do Arquiteto / Usuário:</strong>
              <div class="p-2 bg-secondary-soft rounded text-sm text-primary mt-1">
                "${escapeHTML(userIntent)}"
              </div>
            </div>

            <div class="mb-3">
              <strong>Elementos Travados Mantidos Intactos (Locks de Precedência):</strong>
              <ul class="text-xs list-disc pl-5 mt-1 text-emerald">
                ${compiled.protectedElements.map(p => `
                  <li><strong>${escapeHTML(p.elementKey)}:</strong> ${escapeHTML(p.rule)} [Status: ${p.status}]</li>
                `).join('')}
              </ul>
            </div>

            <div class="mb-3">
              <strong>Restrições & Proibições Aplicadas:</strong>
              <ul class="text-xs list-disc pl-5 mt-1 text-rose">
                ${compiled.activeRestrictions.map(r => `
                  <li><strong>${escapeHTML(r.element)}:</strong> ${escapeHTML(r.statement)}</li>
                `).join('')}
              </ul>
            </div>

            <div class="alert alert-info text-xs">
              <i data-lucide="shield"></i>
              <span>${compiled.safeguardRule}</span>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="MemoryModule.closeModal()">Fechar</button>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  },

  closeModal(e) {
    if (e && e.target !== e.currentTarget) return;
    const root = document.getElementById('pmw-modal-root');
    if (root) root.innerHTML = '';
  }
};

if (typeof window !== 'undefined') {
  window.MemoryModule = MemoryModule;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MemoryModule;
}
