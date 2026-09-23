/**
 * ============================================================================
 * ARQVERTICE STUDIO — MÓDULO DE ESTUDOS PRELIMINARES (BLOCO C03)
 * Workspace de Alternativas, Comparação Lado a Lado, Decisão e Memória
 * ============================================================================
 */

const StudiesModule = {
  filterCategory: 'all',
  filterEnvironment: 'all',
  filterStatus: 'all',
  activeStudyId: null,

  /**
   * Renderiza a aba principal de Estudos Preliminares dentro do Workspace do Projeto
   */
  render(project, client) {
    const studies = StudioState.getPreliminaryStudies(project.id, {
      category: this.filterCategory,
      environmentId: this.filterEnvironment,
      status: this.filterStatus
    });

    const allStudies = StudioState.getPreliminaryStudies(project.id);
    const environments = (StudioState.data.environments || []).filter(e => e.projectId === project.id);

    // Contadores para o cabeçalho
    const approvedCount = allStudies.filter(s => s.status === 'APPROVED').length;
    const inReviewCount = allStudies.filter(s => s.status === 'IN_REVIEW').length;
    const revitCount = allStudies.filter(s => s.isRevitDeveloped).length;
    const conceptCount = allStudies.filter(s => s.forwardedToConcept).length;

    // Calcular total de alternativas exploradas
    const totalAlternatives = allStudies.reduce((sum, s) => sum + (s.alternatives ? s.alternatives.length : 0), 0);

    return `
      <div class="studies-workspace-wrap animate-fade-in">
        <!-- CABEÇALHO DE GOVERNANÇA DE ESTUDOS PRELIMINARES -->
        <header class="studies-top-banner">
          <div class="stb-main">
            <div class="stb-pills-row">
              <span class="stb-pill-origin"><i data-lucide="compass"></i> BLOCO C03 — ESTUDOS PRELIMINARES</span>
              <span class="stb-pill-count">${allStudies.length} Estudos (${totalAlternatives} Alternativas)</span>
              ${approvedCount > 0 ? `
                <span class="stb-pill-approved" title="Versões aprovadas integradas ao contexto"><i data-lucide="check-circle"></i> ${approvedCount} Aprovados</span>
              ` : ''}
              ${inReviewCount > 0 ? `
                <span class="stb-pill-review" title="Estudos em fase de análise e comparação"><i data-lucide="clock"></i> ${inReviewCount} Em Revisão</span>
              ` : ''}
              ${revitCount > 0 ? `
                <span class="stb-pill-revit" title="Estudos modelados e exportados via Autodesk Revit"><i data-lucide="box"></i> ${revitCount} Modelados no Revit</span>
              ` : ''}
              ${conceptCount > 0 ? `
                <span class="stb-pill-concept" title="Estudos encaminhados para a etapa de Conceito"><i data-lucide="send"></i> ${conceptCount} no Conceito</span>
              ` : ''}
            </div>

            <h1 class="stb-title">Estudos Preliminares & Comparação de Alternativas</h1>
            <p class="stb-desc">
              Workspace analítico para estruturação de hipóteses arquitetônicas, teste de <strong>Alternativas A, B e C</strong>, contraste de vantagens/desvantagens e registro imutável de decisões de projeto para <strong>${escapeHTML(project.name)}</strong>. Rastreabilidade completa de autoria e sincronização conceitual com o Autodesk Revit.
            </p>
          </div>

          <div class="stb-actions">
            <button class="btn btn-primary btn-sm" onclick="StudiesModule.openNewStudyModal('${project.id}')">
              <i data-lucide="plus-circle"></i> Novo Estudo
            </button>
            <button class="btn btn-secondary btn-sm" onclick="StudiesModule.openAiComparisonSummaryModal('${project.id}')">
              <i data-lucide="sparkles"></i> IA: Resumo das Alternativas
            </button>
            <button class="btn btn-outline btn-sm" onclick="StudiesModule.exportDecisionsLog('${project.id}')" title="Exportar memória de decisões tomadas">
              <i data-lucide="download"></i> Memória de Decisões
            </button>
          </div>
        </header>

        <!-- AVISO DE GOVERNANÇA DE DECISÃO HUMANA -->
        <div class="studies-governance-notice">
          <div class="sgn-icon"><i data-lucide="shield-check"></i></div>
          <div class="sgn-text">
            <strong>Princípio Fundamental da ArqVértice:</strong> O sistema organiza, contextualiza e compara hipóteses técnicas lado a lado.
            <strong>A inteligência artificial jamais seleciona ou aprova automaticamente uma solução arquitetônica.</strong> Todas as decisões e aprovações são atos privativos dos arquitetos e dos clientes.
          </div>
        </div>

        <!-- BARRA DE FILTROS E PESQUISA -->
        <div class="studies-filters-bar">
          <div class="filter-group">
            <label><i data-lucide="tag"></i> Categoria:</label>
            <select class="form-select form-select-sm" onchange="StudiesModule.setFilter('category', this.value, '${project.id}')">
              <option value="all" ${this.filterCategory === 'all' ? 'selected' : ''}>Todas as Categorias (${allStudies.length})</option>
              <option value="LAYOUT" ${this.filterCategory === 'LAYOUT' ? 'selected' : ''}>Layout / Espacial</option>
              <option value="CIRCULACAO" ${this.filterCategory === 'CIRCULACAO' ? 'selected' : ''}>Circulação & Fluxos</option>
              <option value="VOLUMETRIA" ${this.filterCategory === 'VOLUMETRIA' ? 'selected' : ''}>Volumetria & Massas</option>
              <option value="FACHADA" ${this.filterCategory === 'FACHADA' ? 'selected' : ''}>Fachada & Envoltória</option>
              <option value="INTERIORES" ${this.filterCategory === 'INTERIORES' ? 'selected' : ''}>Interiores</option>
              <option value="MATERIALIDADE" ${this.filterCategory === 'MATERIALIDADE' ? 'selected' : ''}>Materialidade</option>
              <option value="ILUMINACAO" ${this.filterCategory === 'ILUMINACAO' ? 'selected' : ''}>Iluminação</option>
              <option value="MOBILIARIO" ${this.filterCategory === 'MOBILIARIO' ? 'selected' : ''}>Mobiliário</option>
              <option value="PAISAGISMO" ${this.filterCategory === 'PAISAGISMO' ? 'selected' : ''}>Paisagismo</option>
              <option value="AREA_EXTERNA" ${this.filterCategory === 'AREA_EXTERNA' ? 'selected' : ''}>Área Externa</option>
              <option value="OUTRO" ${this.filterCategory === 'OUTRO' ? 'selected' : ''}>Outros Estudos</option>
            </select>
          </div>

          <div class="filter-group">
            <label><i data-lucide="home"></i> Ambiente:</label>
            <select class="form-select form-select-sm" onchange="StudiesModule.setFilter('environment', this.value, '${project.id}')">
              <option value="all" ${this.filterEnvironment === 'all' ? 'selected' : ''}>Todos os Ambientes</option>
              ${environments.map(e => `
                <option value="${e.id}" ${this.filterEnvironment === e.id ? 'selected' : ''}>${escapeHTML(e.name)}</option>
              `).join('')}
            </select>
          </div>

          <div class="filter-group">
            <label><i data-lucide="filter"></i> Status:</label>
            <select class="form-select form-select-sm" onchange="StudiesModule.setFilter('status', this.value, '${project.id}')">
              <option value="all" ${this.filterStatus === 'all' ? 'selected' : ''}>Todos os Status</option>
              <option value="APPROVED" ${this.filterStatus === 'APPROVED' ? 'selected' : ''}>Aprovados (APPROVED)</option>
              <option value="IN_REVIEW" ${this.filterStatus === 'IN_REVIEW' ? 'selected' : ''}>Em Revisão (IN_REVIEW)</option>
              <option value="IN_PROGRESS" ${this.filterStatus === 'IN_PROGRESS' ? 'selected' : ''}>Em Progresso (IN_PROGRESS)</option>
              <option value="DRAFT" ${this.filterStatus === 'DRAFT' ? 'selected' : ''}>Rascunho (DRAFT)</option>
              <option value="SUPERSEDED" ${this.filterStatus === 'SUPERSEDED' ? 'selected' : ''}>Substituídos (SUPERSEDED)</option>
              <option value="REJECTED" ${this.filterStatus === 'REJECTED' ? 'selected' : ''}>Rejeitados (REJECTED)</option>
            </select>
          </div>
        </div>

        <!-- LISTAGEM / CARDS DOS ESTUDOS -->
        <div class="studies-list-container">
          ${studies.length === 0 ? `
            <div class="empty-studies-card">
              <i data-lucide="layout-grid" class="empty-icon"></i>
              <h3>Nenhum estudo preliminar encontrado para estes filtros</h3>
              <p>Cadastre um novo estudo arquitetônico com alternativas de layout, volumetria ou fachada para iniciar a exploração.</p>
              <button class="btn btn-primary" onclick="StudiesModule.openNewStudyModal('${project.id}')">
                <i data-lucide="plus"></i> Criar Primeiro Estudo
              </button>
            </div>
          ` : `
            <div class="studies-cards-grid">
              ${studies.map(s => this.renderStudyCard(s, project)).join('')}
            </div>
          `}
        </div>

        <!-- CONTAINER PARA MODAIS DINÂMICOS -->
        <div id="studies-modal-root"></div>
      </div>
    `;
  },

  /**
   * Renderiza um Card de Estudo Individual
   */
  renderStudyCard(study, project) {
    const env = study.environmentId ? (StudioState.data.environments || []).find(e => e.id === study.environmentId) : null;
    const alternatives = study.alternatives || [];
    const selectedAlt = alternatives.find(a => a.isSelected);

    // Mapeamento de status
    const statusMap = {
      'APPROVED': { label: 'Aprovado', cls: 'status-approved', icon: 'check-circle' },
      'IN_REVIEW': { label: 'Em Revisão', cls: 'status-review', icon: 'clock' },
      'IN_PROGRESS': { label: 'Em Progresso', cls: 'status-progress', icon: 'play-circle' },
      'DRAFT': { label: 'Rascunho', cls: 'status-draft', icon: 'file-text' },
      'SUPERSEDED': { label: 'Histórico (Substituído)', cls: 'status-superseded', icon: 'archive' },
      'REJECTED': { label: 'Rejeitado', cls: 'status-rejected', icon: 'x-circle' }
    };
    const stInfo = statusMap[study.status] || { label: study.status, cls: 'status-draft', icon: 'help-circle' };

    // Progresso
    const progress = study.progress !== undefined ? study.progress : 0;

    return `
      <div class="study-card ${study.status === 'APPROVED' ? 'is-study-approved' : ''} ${study.status === 'SUPERSEDED' ? 'is-study-superseded' : ''}">
        <div class="sc-header">
          <div class="sc-tags">
            <span class="sc-category-tag"><i data-lucide="tag"></i> ${study.category}</span>
            <span class="sc-version-tag">${study.version}</span>
            <span class="sc-status-pill ${stInfo.cls}"><i data-lucide="${stInfo.icon}"></i> ${stInfo.label}</span>
            ${env ? `<span class="sc-env-tag"><i data-lucide="home"></i> ${escapeHTML(env.name)}</span>` : ''}
            ${study.isRevitDeveloped ? `<span class="sc-revit-tag" title="Modelado no Revit: ${escapeHTML(study.revitViewName || 'Geral')}"><i data-lucide="box"></i> Revit</span>` : ''}
            ${study.forwardedToConcept ? `<span class="sc-concept-tag" title="Encaminhado para Fase de Conceito"><i data-lucide="send"></i> Conceito</span>` : ''}
          </div>
          <div class="sc-actions-menu">
            <button class="btn btn-icon-sm" onclick="StudiesModule.openEditStudyModal('${project.id}', '${study.id}')" title="Editar Metadados do Estudo">
              <i data-lucide="edit-3"></i>
            </button>
            <button class="btn btn-icon-sm text-danger" onclick="StudiesModule.promptDeleteStudy('${study.id}')" title="Excluir Estudo">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </div>

        <div class="sc-body">
          <h3 class="sc-title">${escapeHTML(study.title)}</h3>
          <p class="sc-desc">${escapeHTML(study.description || '')}</p>

          ${study.objective ? `
            <div class="sc-prop-item">
              <span class="prop-label"><i data-lucide="target"></i> Objetivo:</span>
              <span class="prop-val">${escapeHTML(study.objective)}</span>
            </div>
          ` : ''}

          ${study.hypothesis ? `
            <div class="sc-prop-item">
              <span class="prop-label"><i data-lucide="lightbulb"></i> Hipótese Inicial:</span>
              <span class="prop-val">${escapeHTML(study.hypothesis)}</span>
            </div>
          ` : ''}

          <!-- BARRA DE PROGRESSO DO ESTUDO (Progresso != Aprovação) -->
          <div class="sc-progress-wrap">
            <div class="progress-info">
              <span class="pi-label">Progresso do Estudo:</span>
              <span class="pi-val">${progress}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
          </div>

          <!-- SEÇÃO DE ALTERNATIVAS DO ESTUDO -->
          <div class="sc-alternatives-section">
            <div class="alt-sec-head">
              <h4>Alternativas (${alternatives.length})</h4>
              <button class="btn btn-xs btn-outline" onclick="StudiesModule.openAddAlternativeModal('${study.id}')">
                <i data-lucide="plus"></i> Adicionar Alternativa
              </button>
            </div>

            <div class="sc-alt-pills">
              ${alternatives.map(a => {
                const isDecided = a.isSelected;
                return `
                  <div class="alt-mini-pill ${isDecided ? 'is-selected' : ''}" onclick="StudiesModule.openComparisonModal('${study.id}', '${a.id}')" title="Ver detalhes da ${escapeHTML(a.name)}">
                    <span class="alt-letter">${escapeHTML(a.letter || a.name.charAt(0))}</span>
                    <span class="alt-name">${escapeHTML(a.name)}</span>
                    ${isDecided ? '<i data-lucide="check" class="alt-check"></i>' : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- REGISTRO DE DECISÃO SE HOUVER -->
          ${study.decision ? `
            <div class="sc-decision-badge">
              <div class="sdb-head">
                <i data-lucide="award"></i>
                <strong>Decisão Homologada: ${escapeHTML(selectedAlt ? selectedAlt.name : 'Alternativa Registrada')}</strong>
              </div>
              <p class="sdb-reason"><strong>Motivo:</strong> ${escapeHTML(study.decision.reason)}</p>
              <div class="sdb-meta">
                <span><i data-lucide="user"></i> ${escapeHTML(study.decision.decidedBy)}</span>
                <span><i data-lucide="calendar"></i> ${escapeHTML(study.decision.decidedAt ? study.decision.decidedAt.split('T')[0] : '')}</span>
              </div>
            </div>
          ` : `
            <div class="sc-no-decision-prompt">
              <i data-lucide="help-circle"></i> Nenhuma alternativa selecionada ainda. Compare e registre a decisão.
            </div>
          `}
        </div>

        <!-- RODAPÉ DE AÇÕES DO CARD -->
        <div class="sc-footer">
          <button class="btn btn-sm btn-primary" onclick="StudiesModule.openComparisonModal('${study.id}')" title="Comparar Alternativas Lado a Lado">
            <i data-lucide="columns"></i> Comparar Lado a Lado
          </button>

          <button class="btn btn-sm btn-outline" onclick="StudiesModule.openDecisionModal('${study.id}')" title="Registrar Escolha e Justificativa da Alternativa">
            <i data-lucide="check-square"></i> Registrar Decisão
          </button>

          ${study.status !== 'APPROVED' ? `
            <button class="btn btn-sm btn-success-outline" onclick="StudiesModule.openApprovalModal('${study.id}')" title="Homologar estudo formalmente (APPROVED_STUDY_VERSION)">
              <i data-lucide="check-circle-2"></i> Aprovar Estudo
            </button>
          ` : `
            <button class="btn btn-sm btn-outline" onclick="StudiesModule.promptCreateNewVersion('${study.id}')" title="Criar V02 não-destrutiva para alterações preservando V01">
              <i data-lucide="git-branch"></i> Nova Versão (V+1)
            </button>
          `}

          ${!study.forwardedToConcept ? `
            <button class="btn btn-sm btn-secondary" onclick="StudiesModule.forwardToConceptPrompt('${study.id}')" title="Encaminhar estudo selecionado para a etapa de Conceito">
              <i data-lucide="arrow-right-circle"></i> Conceito &rarr;
            </button>
          ` : `
            <span class="forwarded-indicator" title="Estudo associado à etapa de Conceito"><i data-lucide="check"></i> No Conceito</span>
          `}
        </div>
      </div>
    `;
  },

  /**
   * Abre o Modal de Comparação Lado a Lado de Alternativas (Prompt C03 Item 4)
   */
  openComparisonModal(studyId, highlightAltId = null) {
    const study = StudioState.getStudyById(studyId);
    if (!study) return alert('Estudo não encontrado.');

    const alternatives = study.alternatives || [];
    const root = document.getElementById('studies-modal-root');
    if (!root) return;

    // Rastreabilidade de Autoria (Prompt C03 Item 9)
    const authorshipMap = {
      'CRIADO_PELA_ARQVERTICE': { label: 'Criado pela ArqVértice', cls: 'auth-arqvertice', icon: 'pen-tool' },
      'IMPORTADO': { label: 'Importado', cls: 'auth-imported', icon: 'file-input' },
      'REFERENCIA_EXTERNA': { label: 'Referência Externa', cls: 'auth-external', icon: 'external-link' },
      'GERADO_POR_IA': { label: 'Gerado por IA (Assistido)', cls: 'auth-ai', icon: 'bot' }
    };

    root.innerHTML = `
      <div class="modal-backdrop animate-fade-in" onclick="StudiesModule.closeModal(event)">
        <div class="modal-dialog modal-xl modal-comparison" onclick="event.stopPropagation()">
          <div class="modal-header">
            <div class="mh-left">
              <span class="mh-pill"><i data-lucide="columns"></i> Comparação de Alternativas Lado a Lado</span>
              <h2>${escapeHTML(study.title)} — ${study.version}</h2>
              <p class="text-sm text-secondary">
                Objetivo: <strong>${escapeHTML(study.objective || 'Exploração espacial')}</strong>
              </p>
            </div>
            <button class="modal-close-btn" onclick="StudiesModule.closeModal()">&times;</button>
          </div>

          <!-- BANNER DE RESPONSABILIDADE ARQUITETÔNICA (PROMPT C03 ITEM 4 & 10) -->
          <div class="comparison-governance-bar">
            <i data-lucide="info"></i>
            <div>
              <strong>Processo de Decisão Sem Escolha Automática por IA:</strong>
              O sistema apresenta as variáveis, vantagens e impactos de cada hipótese lado a lado.
              A decisão sobre a melhor alternativa é privativa dos arquitetos responsáveis e do cliente.
            </div>
          </div>

          <div class="modal-body comparison-scroll-body">
            ${alternatives.length === 0 ? `
              <div class="empty-comparison">
                <p>Nenhuma alternativa cadastrada para este estudo ainda.</p>
                <button class="btn btn-primary" onclick="StudiesModule.openAddAlternativeModal('${study.id}')">
                  <i data-lucide="plus"></i> Cadastrar Alternativa A
                </button>
              </div>
            ` : `
              <div class="side-by-side-grid" style="grid-template-columns: repeat(${Math.max(alternatives.length, 2)}, minmax(320px, 1fr));">
                ${alternatives.map(alt => {
                  const auth = authorshipMap[alt.authorship] || { label: alt.authorship || 'Não especificado', cls: 'auth-arqvertice', icon: 'help-circle' };
                  const isSelected = alt.isSelected;
                  const isHighlighted = highlightAltId === alt.id;

                  return `
                    <div class="comparison-column ${isSelected ? 'is-selected-alt' : ''} ${isHighlighted ? 'is-highlighted-alt' : ''}">
                      <div class="cc-header">
                        <div class="cc-letter-badge">${escapeHTML(alt.letter || alt.name.charAt(0))}</div>
                        <div class="cc-title-area">
                          <h3>${escapeHTML(alt.name)}</h3>
                          <span class="cc-auth-pill ${auth.cls}">
                            <i data-lucide="${auth.icon}"></i> ${auth.label}
                          </span>
                        </div>
                        ${isSelected ? `
                          <span class="selected-star-badge" title="Alternativa Homologada pelo Arquiteto"><i data-lucide="check"></i> Selecionada</span>
                        ` : ''}
                      </div>

                      <!-- IMAGEM / PERSPECTIVA DA ALTERNATIVA -->
                      <div class="cc-image-wrap">
                        ${alt.imageUrl ? `
                          <img src="${alt.imageUrl}" alt="${escapeHTML(alt.name)}" class="cc-img" onerror="this.src='https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80'" />
                        ` : `
                          <div class="cc-img-placeholder">
                            <i data-lucide="image"></i>
                            <span>Sem imagem associada</span>
                          </div>
                        `}
                      </div>

                      <div class="cc-content">
                        <!-- DESCRIÇÃO E HIPÓTESE -->
                        <div class="cc-section">
                          <label class="cc-sec-label">Descrição & Hipótese:</label>
                          <p class="cc-sec-text">${escapeHTML(alt.description || '')}</p>
                          ${alt.hypothesis ? `
                            <p class="cc-hypothesis"><i data-lucide="lightbulb"></i> <em>${escapeHTML(alt.hypothesis)}</em></p>
                          ` : ''}
                        </div>

                        <!-- VANTAGENS REGISTRADAS PELO USUÁRIO -->
                        <div class="cc-section">
                          <label class="cc-sec-label text-success"><i data-lucide="plus-circle"></i> Vantagens Arquitetônicas:</label>
                          ${(alt.advantages && alt.advantages.length > 0) ? `
                            <ul class="pros-list">
                              ${alt.advantages.map(adv => `<li><i data-lucide="check"></i> ${escapeHTML(adv)}</li>`).join('')}
                            </ul>
                          ` : `
                            <span class="text-xs text-secondary">Nenhuma vantagem informada</span>
                          `}
                        </div>

                        <!-- DESVANTAGENS REGISTRADAS PELO USUÁRIO -->
                        <div class="cc-section">
                          <label class="cc-sec-label text-danger"><i data-lucide="minus-circle"></i> Desvantagens / Restrições:</label>
                          ${(alt.disadvantages && alt.disadvantages.length > 0) ? `
                            <ul class="cons-list">
                              ${alt.disadvantages.map(dis => `<li><i data-lucide="alert-triangle"></i> ${escapeHTML(dis)}</li>`).join('')}
                            </ul>
                          ` : `
                            <span class="text-xs text-secondary">Nenhuma desvantagem informada</span>
                          `}
                        </div>

                        <!-- MODELO REVIT OU ORIGEM TÉCNICA -->
                        ${alt.revitView ? `
                          <div class="cc-section">
                            <span class="revit-view-tag"><i data-lucide="box"></i> Revit View: <strong>${escapeHTML(alt.revitView)}</strong></span>
                          </div>
                        ` : ''}

                        <!-- OBSERVAÇÕES E REFERÊNCIAS -->
                        ${alt.observations ? `
                          <div class="cc-section">
                            <label class="cc-sec-label">Observações Técnicas:</label>
                            <p class="text-xs text-secondary">${escapeHTML(alt.observations)}</p>
                          </div>
                        ` : ''}
                      </div>

                      <!-- BOTÃO DE DECISÃO NA COLUNA -->
                      <div class="cc-actions">
                        ${isSelected ? `
                          <button class="btn btn-success btn-block" disabled>
                            <i data-lucide="check-circle"></i> Alternativa Homologada
                          </button>
                        ` : `
                          <button class="btn btn-outline btn-block" onclick="StudiesModule.openDecisionModal('${study.id}', '${alt.id}')">
                            <i data-lucide="check-circle"></i> Selecionar como Decisão
                          </button>
                        `}
                        <button class="btn btn-ghost btn-xs btn-block" onclick="StudiesModule.openEditAlternativeModal('${study.id}', '${alt.id}')">
                          <i data-lucide="edit"></i> Editar Alternativa
                        </button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline" onclick="StudiesModule.openAddAlternativeModal('${study.id}')">
              <i data-lucide="plus"></i> Adicionar Outra Alternativa
            </button>
            <button class="btn btn-secondary" onclick="StudiesModule.closeModal()">
              Fechar Comparador
            </button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  /**
   * Abre o Modal para Registrar Decisão (Prompt C03 Item 5)
   */
  openDecisionModal(studyId, preselectedAltId = null) {
    const study = StudioState.getStudyById(studyId);
    if (!study) return alert('Estudo não encontrado.');

    const alternatives = study.alternatives || [];
    if (alternatives.length === 0) {
      alert('Cadastre alternativas antes de registrar uma decisão.');
      return;
    }

    const currentSelected = alternatives.find(a => a.isSelected);
    const chosenAltId = preselectedAltId || (currentSelected ? currentSelected.id : alternatives[0].id);

    const root = document.getElementById('studies-modal-root');
    if (!root) return;

    root.innerHTML = `
      <div class="modal-backdrop animate-fade-in" onclick="StudiesModule.closeModal(event)">
        <div class="modal-dialog modal-md" onclick="event.stopPropagation()">
          <div class="modal-header">
            <div class="mh-left">
              <span class="mh-pill"><i data-lucide="check-square"></i> Registro de Decisão Arquitetônica</span>
              <h2>Homologar Escolha Técnica</h2>
            </div>
            <button class="modal-close-btn" onclick="StudiesModule.closeModal()">&times;</button>
          </div>

          <form onsubmit="StudiesModule.handleSaveDecision(event, '${study.id}')">
            <div class="modal-body">
              <div class="decision-alert-info">
                <i data-lucide="archive"></i>
                <p>A decisão registrada passa a integrar a <strong>Memória Técnica do Projeto</strong> e será referenciada nos próximos estágios de concepção e detalhamento.</p>
              </div>

              <div class="form-group mb-3">
                <label>Alternativa Selecionada *</label>
                <select id="dec-alt-id" class="form-select" required>
                  ${alternatives.map(a => `
                    <option value="${a.id}" ${a.id === chosenAltId ? 'selected' : ''}>
                      ${escapeHTML(a.name)} — ${escapeHTML(a.description ? a.description.substring(0, 60) + '...' : '')}
                    </option>
                  `).join('')}
                </select>
              </div>

              <div class="form-group mb-3">
                <label>Motivo Técnico da Escolha *</label>
                <textarea id="dec-reason" class="form-textarea" rows="4" required placeholder="Ex: A Alternativa B foi escolhida por privilegiar a ventilação cruzada nordeste e reduzir custos estruturais com o balanço da suíte master...">${study.decision ? escapeHTML(study.decision.reason || '') : ''}</textarea>
              </div>

              <div class="form-grid-2 mb-3">
                <div class="form-group">
                  <label>Arquiteto Responsável *</label>
                  <input type="text" id="dec-by" class="form-input" required value="${study.decision ? escapeHTML(study.decision.decidedBy || 'Erick Santiago') : 'Erick Santiago'}" />
                </div>
                <div class="form-group">
                  <label>Data da Decisão *</label>
                  <input type="date" id="dec-date" class="form-input" required value="${study.decision && study.decision.decidedAt ? study.decision.decidedAt.split('T')[0] : new Date().toISOString().split('T')[0]}" />
                </div>
              </div>

              <div class="form-group mb-3">
                <label>Observações Complementares / Requisitos para a Próxima Fase</label>
                <textarea id="dec-notes" class="form-textarea" rows="2" placeholder="Observações que o time deve atentar na fase de conceito...">${study.decision ? escapeHTML(study.decision.observations || '') : ''}</textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-outline" onclick="StudiesModule.closeModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary">
                <i data-lucide="check"></i> Gravar Decisão na Memória do Projeto
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  /**
   * Salva a decisão registrada
   */
  handleSaveDecision(e, studyId) {
    e.preventDefault();
    const altId = document.getElementById('dec-alt-id').value;
    const reason = document.getElementById('dec-reason').value;
    const decidedBy = document.getElementById('dec-by').value;
    const decidedAt = document.getElementById('dec-date').value;
    const observations = document.getElementById('dec-notes').value;

    const res = StudioState.recordStudyDecision(studyId, {
      selectedAlternativeId: altId,
      reason,
      decidedBy,
      decidedAt: new Date(decidedAt).toISOString(),
      observations
    });

    if (res.success) {
      this.closeModal();
      this.refreshUI(res.study.projectId);
      alert(`Decisão registrada com sucesso para o estudo ${res.study.title}!`);
    } else {
      alert('Erro ao registrar decisão: ' + res.error);
    }
  },

  /**
   * Abre o Modal de Aprovação Formal de Estudo (APPROVED_STUDY_VERSION)
   */
  openApprovalModal(studyId) {
    const study = StudioState.getStudyById(studyId);
    if (!study) return alert('Estudo não encontrado.');

    const root = document.getElementById('studies-modal-root');
    if (!root) return;

    root.innerHTML = `
      <div class="modal-backdrop animate-fade-in" onclick="StudiesModule.closeModal(event)">
        <div class="modal-dialog modal-md" onclick="event.stopPropagation()">
          <div class="modal-header">
            <div class="mh-left">
              <span class="mh-pill pill-success"><i data-lucide="check-circle-2"></i> Homologação Formal</span>
              <h2>Aprovar Estudo: ${escapeHTML(study.title)}</h2>
            </div>
            <button class="modal-close-btn" onclick="StudiesModule.closeModal()">&times;</button>
          </div>

          <div class="modal-body">
            <div class="approval-explanation">
              <i data-lucide="file-check"></i>
              <div>
                <strong>Geração de APPROVED_STUDY_VERSION:</strong>
                Ao aprovar, a versão atual (<strong>${study.version}</strong>) é congelada como versão oficial homologada.
                Qualquer modificação posterior não editará silenciosamente este estudo, exigindo a criação de uma nova versão (ex: V02) para preservar o histórico.
              </div>
            </div>

            ${!study.decision ? `
              <div class="alert alert-warning mt-3">
                <i data-lucide="alert-circle"></i>
                Atenção: Este estudo ainda não possui uma decisão formal registrada sobre as alternativas. Recomendamos registrar a decisão antes de aprovar.
              </div>
            ` : ''}

            <div class="form-group mt-3">
              <label>Aprovador Responsável *</label>
              <input type="text" id="appr-by" class="form-input" value="Erick Santiago (ArqVértice)" required />
            </div>

            <div class="form-group mt-3">
              <label>Notas Técnicas de Aprovação *</label>
              <textarea id="appr-notes" class="form-textarea" rows="3" required placeholder="Justifique os critérios atendidos para a aprovação deste estudo...">${study.approvalNotes || 'Estudo preliminar validado e em conformidade com as diretrizes do briefing técnico e do cliente.'}</textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-outline" onclick="StudiesModule.closeModal()">Cancelar</button>
            <button type="button" class="btn btn-success" onclick="StudiesModule.handleApproveStudy('${study.id}')">
              <i data-lucide="check"></i> Confirmar Aprovação (APPROVED)
            </button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  /**
   * Executa a aprovação do estudo
   */
  handleApproveStudy(studyId) {
    const approvedBy = document.getElementById('appr-by').value;
    const approvalNotes = document.getElementById('appr-notes').value;

    const res = StudioState.approveStudy(studyId, approvedBy, approvalNotes);
    if (res.success) {
      this.closeModal();
      this.refreshUI(res.study.projectId);
      alert(`Estudo ${res.study.title} aprovado com sucesso como versão oficial!`);
    } else {
      alert('Erro ao aprovar estudo: ' + res.error);
    }
  },

  /**
   * Prompt de Nova Versão Não-Destrutiva (Prompt C03 Item 14)
   */
  promptCreateNewVersion(studyId) {
    const study = StudioState.getStudyById(studyId);
    if (!study) return;

    if (confirm(`Deseja abrir uma nova versão para o estudo "${study.title}"?\n\nA versão atual (${study.version}) será preservada como SUPERSEDED (histórico imutável) e uma nova versão (ex: V02) será criada em status IN_REVIEW com as alternativas duplicadas para evolução.`)) {
      const reason = prompt('Informe a motivação para esta nova versão (ex: "Ajuste na circulação da suíte conforme solicitação do cliente"):', 'Revisão das hipóteses com base em novo alinhamento');
      if (reason) {
        const res = StudioState.createStudyNewVersion(studyId, reason);
        if (res.success) {
          this.refreshUI(res.newStudy.projectId);
          alert(`Nova versão ${res.newStudy.version} criada com sucesso! A versão anterior foi arquivada.`);
        } else {
          alert('Erro ao criar versão: ' + res.error);
        }
      }
    }
  },

  /**
   * Encaminha o estudo para a etapa de Conceito (Prompt C03 Item 15)
   */
  forwardToConceptPrompt(studyId) {
    const study = StudioState.getStudyById(studyId);
    if (!study) return;

    const notes = prompt(`Encaminhar "${study.title}" para a etapa de CONCEITO?\n\nInsira orientações conceituais para a próxima fase:`, 'Estudo preliminar selecionado como base conceitual para desenvolvimento das diretrizes de partido e linguagem.');
    if (notes !== null) {
      const res = StudioState.forwardStudyToConcept(studyId, notes);
      if (res.success) {
        this.refreshUI(res.study.projectId);
        alert(`Estudo encaminhado para a etapa de CONCEITO com sucesso! O vínculo foi estabelecido.`);
      } else {
        alert('Erro ao encaminhar para conceito: ' + res.error);
      }
    }
  },

  /**
   * Modal para Criar Novo Estudo Preliminar
   */
  openNewStudyModal(projectId) {
    this.openStudyModal(projectId, null);
  },

  /**
   * Modal para Editar Estudo Preliminar
   */
  openEditStudyModal(projectId, studyId) {
    this.openStudyModal(projectId, studyId);
  },

  openStudyModal(projectId, studyId) {
    const study = studyId ? StudioState.getStudyById(studyId) : null;
    const environments = (StudioState.data.environments || []).filter(e => e.projectId === projectId);
    const root = document.getElementById('studies-modal-root');
    if (!root) return;

    const isEdit = !!study;

    root.innerHTML = `
      <div class="modal-backdrop animate-fade-in" onclick="StudiesModule.closeModal(event)">
        <div class="modal-dialog modal-lg" onclick="event.stopPropagation()">
          <div class="modal-header">
            <div class="mh-left">
              <span class="mh-pill"><i data-lucide="compass"></i> ${isEdit ? 'Editar Estudo' : 'Novo Estudo Preliminar'}</span>
              <h2>${isEdit ? escapeHTML(study.title) : 'Cadastrar Estudo Arquitetônico'}</h2>
            </div>
            <button class="modal-close-btn" onclick="StudiesModule.closeModal()">&times;</button>
          </div>

          <form onsubmit="StudiesModule.handleSaveStudy(event, '${projectId}', ${studyId ? `'${studyId}'` : 'null'})">
            <div class="modal-body">
              <div class="form-grid-2 mb-3">
                <div class="form-group">
                  <label>Título do Estudo *</label>
                  <input type="text" id="std-title" class="form-input" required value="${study ? escapeHTML(study.title) : ''}" placeholder="Ex: Estudo de Layout — Living e Cozinha Integrada" />
                </div>
                <div class="form-group">
                  <label>Categoria Tipológica *</label>
                  <select id="std-category" class="form-select" required>
                    <option value="LAYOUT" ${study && study.category === 'LAYOUT' ? 'selected' : ''}>LAYOUT (Layout Espacial)</option>
                    <option value="CIRCULACAO" ${study && study.category === 'CIRCULACAO' ? 'selected' : ''}>CIRCULAÇÃO (Circulação e Fluxos)</option>
                    <option value="VOLUMETRIA" ${study && study.category === 'VOLUMETRIA' ? 'selected' : ''}>VOLUMETRIA (Massa e Proporções)</option>
                    <option value="FACHADA" ${study && study.category === 'FACHADA' ? 'selected' : ''}>FACHADA (Envoltória e Esquadrias)</option>
                    <option value="INTERIORES" ${study && study.category === 'INTERIORES' ? 'selected' : ''}>INTERIORES (Ambientação)</option>
                    <option value="MATERIALIDADE" ${study && study.category === 'MATERIALIDADE' ? 'selected' : ''}>MATERIALIDADE (Paletas e Texturas)</option>
                    <option value="ILUMINACAO" ${study && study.category === 'ILUMINACAO' ? 'selected' : ''}>ILUMINAÇÃO (Luz Natural e Artificial)</option>
                    <option value="MOBILIARIO" ${study && study.category === 'MOBILIARIO' ? 'selected' : ''}>MOBILIÁRIO (Mobiliário e Marcenaria)</option>
                    <option value="PAISAGISMO" ${study && study.category === 'PAISAGISMO' ? 'selected' : ''}>PAISAGISMO (Áreas Verdes)</option>
                    <option value="AREA_EXTERNA" ${study && study.category === 'AREA_EXTERNA' ? 'selected' : ''}>ÁREA EXTERNA (Deck, Piscina, Lazer)</option>
                    <option value="OUTRO" ${study && study.category === 'OUTRO' ? 'selected' : ''}>OUTRO</option>
                  </select>
                </div>
              </div>

              <div class="form-grid-2 mb-3">
                <div class="form-group">
                  <label>Ambiente Vinculado (Opcional)</label>
                  <select id="std-env" class="form-select">
                    <option value="">-- Estudo Geral do Projeto --</option>
                    ${environments.map(e => `
                      <option value="${e.id}" ${study && study.environmentId === e.id ? 'selected' : ''}>${escapeHTML(e.name)}</option>
                    `).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label>Progresso do Estudo (%)</label>
                  <select id="std-progress" class="form-select">
                    <option value="0" ${study && study.progress === 0 ? 'selected' : ''}>0% — Não iniciado</option>
                    <option value="25" ${study && study.progress === 25 ? 'selected' : ''}>25% — Levantamento de premissas</option>
                    <option value="50" ${study && study.progress === 50 ? 'selected' : ''}>50% — Alternativas em modelagem</option>
                    <option value="75" ${study && study.progress === 75 ? 'selected' : ''}>75% — Alternativas comparadas</option>
                    <option value="100" ${study && study.progress === 100 ? 'selected' : ''}>100% — Concluído</option>
                  </select>
                </div>
              </div>

              <div class="form-group mb-3">
                <label>Descrição do Estudo</label>
                <textarea id="std-desc" class="form-textarea" rows="2" placeholder="Resumo do desafio projetual a ser explorado...">${study ? escapeHTML(study.description || '') : ''}</textarea>
              </div>

              <div class="form-grid-2 mb-3">
                <div class="form-group">
                  <label>Objetivo Arquitetônico *</label>
                  <textarea id="std-objective" class="form-textarea" rows="2" required placeholder="Qual problema ou meta este estudo visa solucionar?">${study ? escapeHTML(study.objective || '') : ''}</textarea>
                </div>
                <div class="form-group">
                  <label>Hipótese Projetual</label>
                  <textarea id="std-hypothesis" class="form-textarea" rows="2" placeholder="Qual a suposição preliminar a ser testada com as alternativas?">${study ? escapeHTML(study.hypothesis || '') : ''}</textarea>
                </div>
              </div>

              <!-- VÍNCULO COM AUTODESK REVIT (Prompt C03 Item 11) -->
              <div class="revit-integration-box mb-3">
                <div class="form-check">
                  <input type="checkbox" id="std-is-revit" class="form-check-input" ${study && study.isRevitDeveloped ? 'checked' : ''} onchange="document.getElementById('revit-fields').style.display = this.checked ? 'grid' : 'none'" />
                  <label for="std-is-revit" class="form-check-label">
                    <i data-lucide="box"></i> <strong>Estudo Desenvolvido no Autodesk Revit</strong>
                  </label>
                </div>
                <div id="revit-fields" class="form-grid-2 mt-2" style="display: ${study && study.isRevitDeveloped ? 'grid' : 'none'};">
                  <div class="form-group">
                    <label>Nome da Vista / Prancha Revit</label>
                    <input type="text" id="std-revit-view" class="form-input" value="${study ? escapeHTML(study.revitViewName || '') : ''}" placeholder="Ex: {3D} - Estudo Opção A ou Planta Baixa - Opções" />
                  </div>
                  <div class="form-group">
                    <label>Notas de Exportação / Modelo</label>
                    <input type="text" id="std-revit-notes" class="form-input" value="${study ? escapeHTML(study.revitNotes || '') : ''}" placeholder="Ex: Modelado na família de opções de projeto (Design Options)" />
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label>Observações Gerais</label>
                <textarea id="std-notes" class="form-textarea" rows="2" placeholder="Notas internas do estúdio...">${study ? escapeHTML(study.observations || '') : ''}</textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-outline" onclick="StudiesModule.closeModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary">
                <i data-lucide="save"></i> ${isEdit ? 'Salvar Alterações' : 'Criar Estudo Preliminar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  /**
   * Salva o estudo novo ou editado
   */
  handleSaveStudy(e, projectId, studyId) {
    e.preventDefault();

    const title = document.getElementById('std-title').value;
    const category = document.getElementById('std-category').value;
    const environmentId = document.getElementById('std-env').value || null;
    const progress = parseInt(document.getElementById('std-progress').value, 10) || 0;
    const description = document.getElementById('std-desc').value;
    const objective = document.getElementById('std-objective').value;
    const hypothesis = document.getElementById('std-hypothesis').value;
    const isRevitDeveloped = document.getElementById('std-is-revit').checked;
    const revitViewName = document.getElementById('std-revit-view') ? document.getElementById('std-revit-view').value : '';
    const revitNotes = document.getElementById('std-revit-notes') ? document.getElementById('std-revit-notes').value : '';
    const observations = document.getElementById('std-notes').value;

    const payload = {
      projectId,
      title,
      category,
      environmentId,
      progress,
      description,
      objective,
      hypothesis,
      isRevitDeveloped,
      revitViewName,
      revitNotes,
      observations
    };

    if (studyId) {
      const res = StudioState.updatePreliminaryStudy(studyId, payload);
      if (res.success) {
        this.closeModal();
        this.refreshUI(projectId);
      } else {
        alert('Erro ao atualizar estudo: ' + res.error);
      }
    } else {
      const res = StudioState.createPreliminaryStudy(payload);
      if (res.success) {
        this.closeModal();
        this.refreshUI(projectId);
      } else {
        alert('Erro ao criar estudo: ' + res.error);
      }
    }
  },

  /**
   * Abre Modal para Adicionar Alternativa a um Estudo (Prompt C03 Item 3)
   */
  openAddAlternativeModal(studyId) {
    this.openAlternativeModal(studyId, null);
  },

  /**
   * Abre Modal para Editar Alternativa
   */
  openEditAlternativeModal(studyId, altId) {
    this.openAlternativeModal(studyId, altId);
  },

  openAlternativeModal(studyId, altId) {
    const study = StudioState.getStudyById(studyId);
    if (!study) return alert('Estudo não encontrado.');

    const alt = altId ? (study.alternatives || []).find(a => a.id === altId) : null;
    const isEdit = !!alt;

    const root = document.getElementById('studies-modal-root');
    if (!root) return;

    // Próxima letra sugerida se for nova alternativa
    const nextLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const currentCount = (study.alternatives || []).length;
    const defaultLetter = isEdit ? alt.letter : (nextLetters[currentCount] || 'Alt');

    root.innerHTML = `
      <div class="modal-backdrop animate-fade-in" onclick="StudiesModule.closeModal(event)">
        <div class="modal-dialog modal-lg" onclick="event.stopPropagation()">
          <div class="modal-header">
            <div class="mh-left">
              <span class="mh-pill"><i data-lucide="layers"></i> ${isEdit ? 'Editar Alternativa' : 'Nova Alternativa'}</span>
              <h2>${isEdit ? escapeHTML(alt.name) : `Adicionar Alternativa ao Estudo ${escapeHTML(study.title)}`}</h2>
            </div>
            <button class="modal-close-btn" onclick="StudiesModule.closeModal()">&times;</button>
          </div>

          <form onsubmit="StudiesModule.handleSaveAlternative(event, '${studyId}', ${altId ? `'${altId}'` : 'null'})">
            <div class="modal-body">
              <div class="form-grid-3 mb-3">
                <div class="form-group">
                  <label>Letra / Identificador *</label>
                  <input type="text" id="alt-letter" class="form-input" required value="${isEdit ? escapeHTML(alt.letter || '') : defaultLetter}" placeholder="A, B, C..." />
                </div>
                <div class="form-group span-2">
                  <label>Nome da Alternativa *</label>
                  <input type="text" id="alt-name" class="form-input" required value="${isEdit ? escapeHTML(alt.name) : `Alternativa ${defaultLetter}`}" placeholder="Ex: Alternativa A — Cozinha em Ilha com Acesso Direto ao Gourmet" />
                </div>
              </div>

              <!-- RASTREABILIDADE DE AUTORIA (Prompt C03 Item 9) -->
              <div class="form-grid-2 mb-3">
                <div class="form-group">
                  <label>Rastreabilidade de Autoria *</label>
                  <select id="alt-authorship" class="form-select" required>
                    <option value="CRIADO_PELA_ARQVERTICE" ${alt && alt.authorship === 'CRIADO_PELA_ARQVERTICE' ? 'selected' : ''}>CRIADO PELA ARQVERTICE</option>
                    <option value="IMPORTADO" ${alt && alt.authorship === 'IMPORTADO' ? 'selected' : ''}>IMPORTADO</option>
                    <option value="REFERENCIA_EXTERNA" ${alt && alt.authorship === 'REFERENCIA_EXTERNA' ? 'selected' : ''}>REFERÊNCIA EXTERNA</option>
                    <option value="GERADO_POR_IA" ${alt && alt.authorship === 'GERADO_POR_IA' ? 'selected' : ''}>GERADO POR IA</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Vista / Família Revit (Opcional)</label>
                  <input type="text" id="alt-revit" class="form-input" value="${alt ? escapeHTML(alt.revitView || '') : ''}" placeholder="Ex: {3D} Opção A" />
                </div>
              </div>

              <div class="form-group mb-3">
                <label>Descrição Arquitetônica da Alternativa *</label>
                <textarea id="alt-desc" class="form-textarea" rows="3" required placeholder="Detalhe a proposta arquitetônica desta alternativa...">${alt ? escapeHTML(alt.description || '') : ''}</textarea>
              </div>

              <div class="form-group mb-3">
                <label>Hipótese Específica Testada</label>
                <input type="text" id="alt-hypothesis" class="form-input" value="${alt ? escapeHTML(alt.hypothesis || '') : ''}" placeholder="Ex: Verificar se a ilha bloqueia o fluxo principal da sala de jantar" />
              </div>

              <div class="form-group mb-3">
                <label>URL da Imagem / Perspectiva / Planta</label>
                <input type="url" id="alt-image" class="form-input" value="${alt ? escapeHTML(alt.imageUrl || '') : ''}" placeholder="https://exemplo.com/perspectiva-opcao-a.jpg" />
              </div>

              <!-- VANTAGENS E DESVANTAGENS REGISTRADAS PELO USUÁRIO (Prompt C03 Item 4) -->
              <div class="form-grid-2 mb-3">
                <div class="form-group">
                  <label class="text-success"><i data-lucide="check"></i> Vantagens (1 por linha)</label>
                  <textarea id="alt-advantages" class="form-textarea" rows="3" placeholder="Maior amplitude visual&#10;Melhor integração com o gourmet&#10;Iluminação natural abundante">${alt && alt.advantages ? escapeHTML(alt.advantages.join('\n')) : ''}</textarea>
                </div>
                <div class="form-group">
                  <label class="text-danger"><i data-lucide="alert-circle"></i> Desvantagens / Restrições (1 por linha)</label>
                  <textarea id="alt-disadvantages" class="form-textarea" rows="3" placeholder="Maior custo com bancada&#10;Exige passagem de tubulação no contrapiso">${alt && alt.disadvantages ? escapeHTML(alt.disadvantages.join('\n')) : ''}</textarea>
                </div>
              </div>

              <div class="form-group">
                <label>Observações Internas</label>
                <textarea id="alt-notes" class="form-textarea" rows="2" placeholder="Comentários técnicos adicionais...">${alt ? escapeHTML(alt.observations || '') : ''}</textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-outline" onclick="StudiesModule.closeModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary">
                <i data-lucide="save"></i> ${isEdit ? 'Salvar Alternativa' : 'Cadastrar Alternativa'}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  /**
   * Salva Alternativa
   */
  handleSaveAlternative(e, studyId, altId) {
    e.preventDefault();

    const letter = document.getElementById('alt-letter').value.trim();
    const name = document.getElementById('alt-name').value.trim();
    const authorship = document.getElementById('alt-authorship').value;
    const revitView = document.getElementById('alt-revit').value.trim();
    const description = document.getElementById('alt-desc').value.trim();
    const hypothesis = document.getElementById('alt-hypothesis').value.trim();
    const imageUrl = document.getElementById('alt-image').value.trim();
    const advantages = document.getElementById('alt-advantages').value
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
    const disadvantages = document.getElementById('alt-disadvantages').value
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
    const observations = document.getElementById('alt-notes').value.trim();

    const payload = {
      letter,
      name,
      authorship,
      revitView,
      description,
      hypothesis,
      imageUrl,
      advantages,
      disadvantages,
      observations
    };

    if (altId) {
      const res = StudioState.updateStudyAlternative(studyId, altId, payload);
      if (res.success) {
        this.closeModal();
        this.refreshUI(res.study.projectId);
      } else {
        alert('Erro ao atualizar alternativa: ' + res.error);
      }
    } else {
      const res = StudioState.addStudyAlternative(studyId, payload);
      if (res.success) {
        this.closeModal();
        this.refreshUI(res.study.projectId);
      } else {
        alert('Erro ao adicionar alternativa: ' + res.error);
      }
    }
  },

  /**
   * Modal de IA: Resumo Comparativo de Alternativas (Prompt C03 Item 10)
   * A IA resume e estrutura as características, mas NUNCA toma decisão arquitetônica.
   */
  openAiComparisonSummaryModal(projectId) {
    const studies = StudioState.getPreliminaryStudies(projectId);
    const root = document.getElementById('studies-modal-root');
    if (!root) return;

    root.innerHTML = `
      <div class="modal-backdrop animate-fade-in" onclick="StudiesModule.closeModal(event)">
        <div class="modal-dialog modal-lg" onclick="event.stopPropagation()">
          <div class="modal-header">
            <div class="mh-left">
              <span class="mh-pill"><i data-lucide="sparkles"></i> Inteligência Arquitetônica Assistida</span>
              <h2>Resumo Estruturado das Alternativas</h2>
            </div>
            <button class="modal-close-btn" onclick="StudiesModule.closeModal()">&times;</button>
          </div>

          <div class="modal-body">
            <div class="comparison-governance-bar mb-3">
              <i data-lucide="shield-check"></i>
              <div>
                <strong>Diretriz de IA ArqVértice:</strong>
                O modelo sintetiza contrastes, trade-offs e impactos funcionais entre as alternativas.
                <strong>A decisão final permanece 100% sob critério humano do arquiteto.</strong>
              </div>
            </div>

            <div class="ai-summary-content">
              ${studies.map(s => {
                const alts = s.alternatives || [];
                return `
                  <div class="ai-study-block mb-4">
                    <h4 class="ai-study-title"><i data-lucide="folder"></i> ${escapeHTML(s.title)} (${s.category})</h4>
                    <p class="text-xs text-secondary mb-2">Hipótese: <em>${escapeHTML(s.hypothesis || 'Não descrita')}</em></p>
                    
                    ${alts.length === 0 ? `
                      <p class="text-xs text-secondary">Sem alternativas registradas.</p>
                    ` : `
                      <div class="ai-alts-contrast">
                        ${alts.map(a => `
                          <div class="ai-alt-row">
                            <span class="ai-alt-badge">${escapeHTML(a.name)}</span>
                            <div class="ai-alt-text">
                              <strong>Destaque:</strong> ${escapeHTML(a.description || 'Proposta arquitetônica')}<br>
                              <span class="text-success"><i data-lucide="check"></i> Prós: ${(a.advantages || []).join(', ') || 'Nenhum'}</span> | 
                              <span class="text-danger"><i data-lucide="x"></i> Contras: ${(a.disadvantages || []).join(', ') || 'Nenhum'}</span>
                            </div>
                          </div>
                        `).join('')}
                      </div>
                    `}
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="StudiesModule.closeModal()">Fechar Resumo</button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  /**
   * Exporta a Memória de Decisões dos Estudos em Formato Estruturado (Prompt C03 Item 5)
   */
  exportDecisionsLog(projectId) {
    const studies = StudioState.getPreliminaryStudies(projectId);
    const decisions = studies.filter(s => s.decision).map(s => {
      const chosen = (s.alternatives || []).find(a => a.isSelected);
      return {
        studyId: s.id,
        studyTitle: s.title,
        category: s.category,
        version: s.version,
        status: s.status,
        selectedAlternative: chosen ? {
          name: chosen.name,
          authorship: chosen.authorship,
          advantages: chosen.advantages,
          disadvantages: chosen.disadvantages
        } : null,
        decision: s.decision
      };
    });

    const exportData = {
      project: projectId,
      exportedAt: new Date().toISOString(),
      governance: 'ARQVERTICE_STUDIO_PRELIMINARY_DECISIONS_LOG',
      totalDecisions: decisions.length,
      decisions
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MEMORIA_DECISOES_ESTUDOS_${projectId}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Exclui um estudo
   */
  promptDeleteStudy(studyId) {
    const study = StudioState.getStudyById(studyId);
    if (!study) return;

    if (confirm(`Tem certeza que deseja excluir o estudo "${study.title}" e todas as suas alternativas?`)) {
      const res = StudioState.deletePreliminaryStudy(studyId);
      if (res.success) {
        this.refreshUI(study.projectId);
      } else {
        alert('Erro ao excluir: ' + res.error);
      }
    }
  },

  /**
   * Altera filtro ativo
   */
  setFilter(type, val, projectId) {
    if (type === 'category') this.filterCategory = val;
    if (type === 'environment') this.filterEnvironment = val;
    if (type === 'status') this.filterStatus = val;
    this.refreshUI(projectId);
  },

  /**
   * Fecha qualquer modal aberto
   */
  closeModal(e) {
    if (e && e.target !== e.currentTarget) return;
    const root = document.getElementById('studies-modal-root');
    if (root) root.innerHTML = '';
  },

  /**
   * Atualiza a renderização da aba
   */
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
  window.StudiesModule = StudiesModule;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StudiesModule;
}
