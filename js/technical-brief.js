/**
 * ============================================================================
 * ARQVERTICE STUDIO — MÓDULO DE BRIEFING TÉCNICO INTERNO (BLOCO C01)
 * Transformação do Briefing Aprovado em Documento de Trabalho Estruturado
 * ============================================================================
 */

const TechnicalBriefModule = {
  activeSubTab: 'visao-geral', // 'visao-geral', 'matriz', 'fatos-interpretacao', 'diretrizes', 'restricoes', 'ambientes', 'pendencias', 'ia-assistente', 'snapshots', 'c02-handover'
  filterCategory: 'all',
  filterPriority: 'all',
  matrixSelectedEnv: 'all',

  /**
   * Renderiza a visão central do Briefing Técnico no Workspace do Projeto
   */
  render(project, client) {
    let tb = StudioState.getTechnicalBrief(project.id);
    if (!tb) {
      tb = StudioState.createOrDeriveTechnicalBrief(project.id);
    }

    const clientBriefing = StudioState.getProjectBriefing(project.id);
    const hasApprovedClientBriefing = clientBriefing && clientBriefing.status === 'APPROVED';

    const statusBadgeClasses = {
      'DRAFT': 'tb-status-draft',
      'IN_REVIEW': 'tb-status-review',
      'READY': 'tb-status-ready',
      'APPROVED': 'tb-status-approved',
      'SUPERSEDED': 'tb-status-superseded'
    };

    const statusLabels = {
      'DRAFT': 'Rascunho Interno',
      'IN_REVIEW': 'Em Revisão Técnica',
      'READY': 'Pronto para Homologação',
      'APPROVED': 'Homologado / Aprovado Internamente',
      'SUPERSEDED': 'Superado por Nova Revisão'
    };

    const currentVersionCode = tb.snapshots && tb.snapshots.length > 0 
      ? tb.snapshots[0].versionCode 
      : `TECHNICAL_BRIEF_V0${tb.version || 1}`;

    return `
      <div class="technical-brief-wrap animate-fade-in">
        <!-- BARRA SUPERIOR DE GOVERNANÇA DO BRIEFING TÉCNICO -->
        <header class="tb-top-banner">
          <div class="tb-banner-main">
            <div class="tb-pills-row">
              <span class="tb-pill-origin"><i data-lucide="shield-check"></i> CAMADA TÉCNICA ARQVERTICE</span>
              <span class="tb-pill-status ${statusBadgeClasses[tb.status] || 'tb-status-draft'}">
                <span class="tb-dot"></span>
                <span>${statusLabels[tb.status] || tb.status}</span>
              </span>
              <span class="tb-pill-version">${currentVersionCode}</span>
              ${tb.executiveSummary && tb.executiveSummary.isDerived ? `
                <span class="tb-pill-derived" title="Conteúdo derivado automaticamente do briefing do cliente"><i data-lucide="git-merge"></i> Derivado do Briefing</span>
              ` : ''}
            </div>

            <h1 class="tb-title">Briefing Técnico Interno de Arquitetura & Interiores</h1>
            <p class="tb-desc">Documento de trabalho estruturado da <strong>ArqVértice</strong> para o projeto <strong>${escapeHTML(project.name)}</strong>. Preserva integralmente os fatos do cliente enquanto consolida interpretações, diretrizes de engenharia, matriz de necessidades e preparação para o Levantamento (C02).</p>
          </div>

          <div class="tb-banner-actions">
            ${tb.status !== 'APPROVED' ? `
              <button class="btn btn-primary btn-sm" onclick="TechnicalBriefModule.openApprovalModal('${project.id}')">
                <i data-lucide="check-circle-2"></i> Aprovar Briefing Técnico
              </button>
            ` : `
              <button class="btn btn-outline btn-sm" onclick="TechnicalBriefModule.openApprovalModal('${project.id}')" title="Aprovar nova versão V0${(tb.version || 1) + 1} sem sobrescrever a atual">
                <i data-lucide="git-branch"></i> Nova Homologação
              </button>
            `}
            <button class="btn btn-secondary btn-sm" onclick="TechnicalBriefModule.switchSubTab('ia-assistente')">
              <i data-lucide="sparkles"></i> Assistente IA C01
            </button>
            <button class="btn btn-outline btn-sm" onclick="TechnicalBriefModule.switchSubTab('c02-handover')">
              <i data-lucide="package-check"></i> Pacote C02
            </button>
          </div>
        </header>

        <!-- SUB-NAVEGAÇÃO DAS SEÇÕES E FERRAMENTAS DO C01 -->
        <nav class="tb-subnav-tabs">
          <button class="tb-nav-tab ${this.activeSubTab === 'visao-geral' ? 'active' : ''}" onclick="TechnicalBriefModule.switchSubTab('visao-geral')">
            <i data-lucide="layout-grid"></i> 22 Seções Estruturadas
          </button>
          <button class="tb-nav-tab ${this.activeSubTab === 'matriz' ? 'active' : ''}" onclick="TechnicalBriefModule.switchSubTab('matriz')">
            <i data-lucide="table"></i> Matriz Ambiente × Necessidade
          </button>
          <button class="tb-nav-tab ${this.activeSubTab === 'fatos-interpretacao' ? 'active' : ''}" onclick="TechnicalBriefModule.switchSubTab('fatos-interpretacao')">
            <i data-lucide="split"></i> Fato vs Interpretação
          </button>
          <button class="tb-nav-tab ${this.activeSubTab === 'diretrizes' ? 'active' : ''}" onclick="TechnicalBriefModule.switchSubTab('diretrizes')">
            <i data-lucide="compass"></i> Diretrizes (${tb.directives ? tb.directives.length : 0})
          </button>
          <button class="tb-nav-tab ${this.activeSubTab === 'restricoes' ? 'active' : ''}" onclick="TechnicalBriefModule.switchSubTab('restricoes')">
            <i data-lucide="shield-alert"></i> Restrições (${tb.restrictions ? tb.restrictions.length : 0})
          </button>
          <button class="tb-nav-tab ${this.activeSubTab === 'ambientes' ? 'active' : ''}" onclick="TechnicalBriefModule.switchSubTab('ambientes')">
            <i data-lucide="home"></i> Fichas de Ambientes (${tb.environments ? tb.environments.length : 0})
          </button>
          <button class="tb-nav-tab ${this.activeSubTab === 'pendencias' ? 'active' : ''}" onclick="TechnicalBriefModule.switchSubTab('pendencias')">
            <i data-lucide="clock"></i> Pendências (${tb.pendencies ? tb.pendencies.filter(p => p.status !== 'RESOLVIDA').length : 0})
          </button>
          <button class="tb-nav-tab ${this.activeSubTab === 'ia-assistente' ? 'active' : ''}" onclick="TechnicalBriefModule.switchSubTab('ia-assistente')">
            <i data-lucide="bot"></i> IA no C01
          </button>
          <button class="tb-nav-tab ${this.activeSubTab === 'snapshots' ? 'active' : ''}" onclick="TechnicalBriefModule.switchSubTab('snapshots')">
            <i data-lucide="history"></i> Snapshots (${tb.snapshots ? tb.snapshots.length : 0})
          </button>
          <button class="tb-nav-tab ${this.activeSubTab === 'c02-handover' ? 'active' : ''}" onclick="TechnicalBriefModule.switchSubTab('c02-handover')">
            <i data-lucide="arrow-right-circle"></i> Entrega para C02
          </button>
        </nav>

        <!-- CONTEÚDO DA SUB-ABA ATIVA -->
        <main class="tb-tab-content">
          ${this.renderSubTabContent(tb, project, client, clientBriefing)}
        </main>

        <!-- MODAL DE APROVAÇÃO INTERNA / SNAPSHOT -->
        <div class="modal-overlay" id="modal-tb-approval">
          <div class="modal-card">
            <div class="modal-header">
              <h3><i data-lucide="check-circle-2"></i> Homologação Técnica Interna (Snapshot)</h3>
              <button class="btn-icon btn-ghost" onclick="TechnicalBriefModule.closeApprovalModal()"><i data-lucide="x"></i></button>
            </div>
            <form onsubmit="TechnicalBriefModule.submitApproval(event, '${project.id}')">
              <div class="modal-body">
                <p class="text-sm text-secondary" style="margin-bottom: 16px;">
                  A aprovação interna congelará um <strong>Snapshot Imutável</strong> (ex: <code>${currentVersionCode}</code>) contendo as diretrizes, fichas preliminares, matriz e restrições. Se houver alterações posteriores, um novo snapshot versionado será gerado sem sobrescrever o histórico anterior.
                </p>

                <div class="form-group">
                  <label class="form-label">Arquiteto Responsável pela Homologação *</label>
                  <select id="tb-approver-name" class="form-select" required>
                    <option value="Eduardo Marques (Arquiteto Líder)">Eduardo Marques (Arquiteto Líder)</option>
                    <option value="Luan Almeida (Engenheiro Calculista)">Luan Almeida (Engenheiro Calculista)</option>
                    <option value="Erick Santiago (Engenheiro de Obra)">Erick Santiago (Engenheiro de Obra)</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Parecer Técnico de Homologação *</label>
                  <textarea id="tb-approval-notes" class="form-textarea" rows="4" placeholder="Descreva os critérios técnicos validados (ex: compatibilidade volumétrica com plano diretor, orçamento validado preliminarmente, viabilidade do balanço estrutural)..." required>Briefing técnico validado e aprovado com sucesso. Parâmetros arquitetônicos e estruturais conferidos e liberados para a etapa de Levantamento Físico e Topográfico (C02).</textarea>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline" onclick="TechnicalBriefModule.closeApprovalModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary"><i data-lucide="check"></i> Confirmar & Criar Snapshot</button>
              </div>
            </form>
          </div>
        </div>

        <!-- MODAL DE CRIAÇÃO / EDIÇÃO DE DIRETRIZ -->
        <div class="modal-overlay" id="modal-tb-directive">
          <div class="modal-card">
            <div class="modal-header">
              <h3 id="tb-dir-modal-title">Nova Diretriz Estruturada</h3>
              <button class="btn-icon btn-ghost" onclick="StudioApp.closeModal('modal-tb-directive')"><i data-lucide="x"></i></button>
            </div>
            <form onsubmit="TechnicalBriefModule.saveDirectiveForm(event, '${project.id}')">
              <input type="hidden" id="tb-dir-id">
              <div class="modal-body">
                <div class="form-group">
                  <label class="form-label">Título da Diretriz *</label>
                  <input type="text" id="tb-dir-title" class="form-input" placeholder="Ex: Iluminação Zenital nos Banheiros" required>
                </div>

                <div class="form-grid-2">
                  <div class="form-group">
                    <label class="form-label">Categoria *</label>
                    <select id="tb-dir-category" class="form-select" required>
                      <option value="FUNCIONAL">FUNCIONAL</option>
                      <option value="ESPACIAL">ESPACIAL</option>
                      <option value="ESTETICA">ESTÉTICA</option>
                      <option value="MATERIAL">MATERIAL</option>
                      <option value="ILUMINACAO">ILUMINAÇÃO</option>
                      <option value="MOBILIARIO">MOBILIÁRIO</option>
                      <option value="TECNOLOGIA">TECNOLOGIA</option>
                      <option value="CONFORTO">CONFORTO</option>
                      <option value="EXTERIOR">EXTERIOR</option>
                      <option value="APRESENTACAO">APRESENTAÇÃO</option>
                      <option value="OUTRA">OUTRA</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Prioridade Técnica *</label>
                    <select id="tb-dir-priority" class="form-select" required>
                      <option value="CRITICO">CRÍTICO</option>
                      <option value="ALTO">ALTO</option>
                      <option value="MEDIO" selected>MÉDIO</option>
                      <option value="BAIXO">BAIXO</option>
                      <option value="INFORMATIVO">INFORMATIVO</option>
                    </select>
                  </div>
                </div>

                <div class="form-grid-2">
                  <div class="form-group">
                    <label class="form-label">Origem do Dado *</label>
                    <select id="tb-dir-source" class="form-select" required>
                      <option value="ARQVERTICE" selected>ARQVERTICE</option>
                      <option value="CLIENTE">CLIENTE</option>
                      <option value="DECISAO">DECISÃO</option>
                      <option value="MODELO_REVIT">MODELO REVIT</option>
                      <option value="LEVANTAMENTO">LEVANTAMENTO</option>
                      <option value="REFERENCIA">REFERÊNCIA</option>
                      <option value="ARQUIVO">ARQUIVO</option>
                      <option value="IA_SUGESTAO">IA — SUGESTÃO</option>
                      <option value="OUTRO">OUTRO</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Status da Diretriz</label>
                    <select id="tb-dir-status" class="form-select">
                      <option value="ATIVA" selected>ATIVA</option>
                      <option value="EM_ANALISE">EM ANÁLISE</option>
                      <option value="APROVADA">APROVADA</option>
                      <option value="DESCARTADA">DESCARTADA</option>
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Descrição Técnica *</label>
                  <textarea id="tb-dir-desc" class="form-textarea" rows="3" placeholder="Detalhamento técnico da diretriz executiva..." required></textarea>
                </div>

                <div class="form-group">
                  <label class="form-label">Observação / Justificativa</label>
                  <input type="text" id="tb-dir-obs" class="form-input" placeholder="Justificativa técnica ou impacto arquitetônico...">
                </div>

                <div class="form-group">
                  <label class="form-label">Responsável Técnico</label>
                  <input type="text" id="tb-dir-resp" class="form-input" value="Eduardo Marques">
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline" onclick="StudioApp.closeModal('modal-tb-directive')">Cancelar</button>
                <button type="submit" class="btn btn-primary">Salvar Diretriz</button>
              </div>
            </form>
          </div>
        </div>

        <!-- MODAL DE CRIAÇÃO DE RESTRIÇÃO -->
        <div class="modal-overlay" id="modal-tb-restriction">
          <div class="modal-card">
            <div class="modal-header">
              <h3>Cadastrar Restrição do Projeto</h3>
              <button class="btn-icon btn-ghost" onclick="StudioApp.closeModal('modal-tb-restriction')"><i data-lucide="x"></i></button>
            </div>
            <form onsubmit="TechnicalBriefModule.saveRestrictionForm(event, '${project.id}')">
              <div class="modal-body">
                <div class="form-group">
                  <label class="form-label">Categoria da Restrição *</label>
                  <select id="tb-res-category" class="form-select" required>
                    <option value="PRESERVAR_EXISTENTE">Elementos Existentes a Preservar</option>
                    <option value="INALTERAVEL">Elementos que NÃO Podem ser Alterados</option>
                    <option value="LIMITACAO_INFORMADA">Limitações Informadas</option>
                    <option value="PREFERENCIA_NEGATIVA">Preferências Negativas (O que Detesta)</option>
                    <option value="ORCAMENTO">Restrições de Orçamento</option>
                    <option value="PRAZO">Restrições de Prazo</option>
                    <option value="OBRA">Restrições de Obra / Canteiro</option>
                    <option value="IMOVEL">Restrições do Imóvel / Zoneamento</option>
                  </select>
                </div>

                <div class="form-grid-2">
                  <div class="form-group">
                    <label class="form-label">Prioridade *</label>
                    <select id="tb-res-priority" class="form-select" required>
                      <option value="CRITICO" selected>CRÍTICO</option>
                      <option value="ALTO">ALTO</option>
                      <option value="MEDIO">MÉDIO</option>
                      <option value="BAIXO">BAIXO</option>
                      <option value="INFORMATIVO">INFORMATIVO</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Origem *</label>
                    <select id="tb-res-source" class="form-select" required>
                      <option value="CLIENTE" selected>CLIENTE</option>
                      <option value="ARQVERTICE">ARQVERTICE</option>
                      <option value="LEVANTAMENTO">LEVANTAMENTO</option>
                      <option value="MODELO_REVIT">MODELO REVIT</option>
                      <option value="ARQUIVO">ARQUIVO</option>
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Descrição da Restrição *</label>
                  <textarea id="tb-res-desc" class="form-textarea" rows="3" placeholder="Descreva com precisão a limitação, vedação ou elemento a ser preservado..." required></textarea>
                </div>

                <div class="form-group">
                  <label class="form-label">Observação / Medida Mitigatória</label>
                  <input type="text" id="tb-res-obs" class="form-input" placeholder="Como o projeto tratará essa restrição...">
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline" onclick="StudioApp.closeModal('modal-tb-restriction')">Cancelar</button>
                <button type="submit" class="btn btn-primary">Salvar Restrição</button>
              </div>
            </form>
          </div>
        </div>

        <!-- MODAL DE PENDÊNCIA -->
        <div class="modal-overlay" id="modal-tb-pendency">
          <div class="modal-card">
            <div class="modal-header">
              <h3>Cadastrar Nova Pendência</h3>
              <button class="btn-icon btn-ghost" onclick="StudioApp.closeModal('modal-tb-pendency')"><i data-lucide="x"></i></button>
            </div>
            <form onsubmit="TechnicalBriefModule.savePendencyForm(event, '${project.id}')">
              <div class="modal-body">
                <div class="form-group">
                  <label class="form-label">Descrição da Pendência *</label>
                  <textarea id="tb-pend-desc" class="form-textarea" rows="3" placeholder="Ex: Área do lote ainda não confirmada na escritura..." required></textarea>
                </div>

                <div class="form-grid-2">
                  <div class="form-group">
                    <label class="form-label">Prioridade *</label>
                    <select id="tb-pend-priority" class="form-select" required>
                      <option value="CRITICO">CRÍTICO</option>
                      <option value="ALTO" selected>ALTO</option>
                      <option value="MEDIO">MÉDIO</option>
                      <option value="BAIXO">BAIXO</option>
                      <option value="INFORMATIVO">INFORMATIVO</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Status *</label>
                    <select id="tb-pend-status" class="form-select" required>
                      <option value="ABERTA" selected>ABERTA</option>
                      <option value="EM_ANDAMENTO">EM ANDAMENTO</option>
                      <option value="RESOLVIDA">RESOLVIDA</option>
                      <option value="BLOQUEADA">BLOQUEADA</option>
                    </select>
                  </div>
                </div>

                <div class="form-grid-2">
                  <div class="form-group">
                    <label class="form-label">Responsável *</label>
                    <input type="text" id="tb-pend-resp" class="form-input" value="Eduardo Marques (Arquiteto)" required>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Prazo de Resolução</label>
                    <input type="date" id="tb-pend-deadline" class="form-input">
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Observação / Próxima Ação</label>
                  <input type="text" id="tb-pend-obs" class="form-input" placeholder="Ação necessária para desbloqueio...">
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline" onclick="StudioApp.closeModal('modal-tb-pendency')">Cancelar</button>
                <button type="submit" class="btn btn-primary">Registrar Pendência</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Roteamento do conteúdo de cada sub-aba
   */
  renderSubTabContent(tb, project, client, clientBriefing) {
    switch (this.activeSubTab) {
      case 'visao-geral':
        return this.renderGeneral22Sections(tb, project, client);
      case 'matriz':
        return this.renderEnvironmentMatrix(tb);
      case 'fatos-interpretacao':
        return this.renderFactVsInterpretation(tb, clientBriefing);
      case 'diretrizes':
        return this.renderDirectivesManager(tb, project);
      case 'restricoes':
        return this.renderRestrictionsManager(tb, project);
      case 'ambientes':
        return this.renderPreliminaryEnvironments(tb, project);
      case 'pendencias':
        return this.renderPendenciesManager(tb, project);
      case 'ia-assistente':
        return this.renderAIAssistant(tb, project, clientBriefing);
      case 'snapshots':
        return this.renderSnapshotsTimeline(tb);
      case 'c02-handover':
        return this.renderC02Handover(tb, project, client);
      default:
        return this.renderGeneral22Sections(tb, project, client);
    }
  },

  // --------------------------------------------------------------------------
  // 1. AS 22 SEÇÕES ESTRUTURADAS (Prompt C01 item 3)
  // --------------------------------------------------------------------------
  renderGeneral22Sections(tb, project, client) {
    const sec = tb.sections || {};
    const sum = tb.executiveSummary || {};

    return `
      <div class="tb-sections-view animate-fade-in">
        <!-- 01 — RESUMO DO PROJETO (Editável e Derivado) -->
        <section class="tb-section-card highlight-card">
          <div class="tb-card-header">
            <div class="tb-card-title-group">
              <span class="tb-sec-num">01</span>
              <h3>RESUMO DO PROJETO (EXECUTIVO)</h3>
              <span class="tb-pill-derived"><i data-lucide="sparkles"></i> Derivado Automático &bull; Editável</span>
            </div>
            <div class="tb-card-actions">
              <button class="btn btn-outline btn-xs" onclick="TechnicalBriefModule.regenerateExecutiveSummary('${project.id}')" title="Regenera a síntese a partir das fontes">
                <i data-lucide="refresh-cw"></i> Regenerar Resumo
              </button>
            </div>
          </div>

          <div class="tb-summary-grid">
            <div class="tb-sum-item span-2">
              <span class="tb-sum-label">Objetivo Central do Projeto:</span>
              <textarea class="form-textarea tb-auto-edit" rows="2" onchange="TechnicalBriefModule.saveSummaryField('${project.id}', 'objective', this.value)">${escapeHTML(sum.objective || '')}</textarea>
            </div>
            <div class="tb-sum-item">
              <span class="tb-sum-label">Tipologia:</span>
              <input type="text" class="form-input tb-auto-edit" value="${escapeHTML(sum.projectType || project.typology)}" onchange="TechnicalBriefModule.saveSummaryField('${project.id}', 'projectType', this.value)">
            </div>
            <div class="tb-sum-item">
              <span class="tb-sum-label">Perfil Resumido:</span>
              <input type="text" class="form-input tb-auto-edit" value="${escapeHTML(sum.profile || '')}" onchange="TechnicalBriefModule.saveSummaryField('${project.id}', 'profile', this.value)">
            </div>
            <div class="tb-sum-item span-2">
              <span class="tb-sum-label">Programa Espacial Síntese:</span>
              <textarea class="form-textarea tb-auto-edit" rows="2" onchange="TechnicalBriefModule.saveSummaryField('${project.id}', 'program', this.value)">${escapeHTML(sum.program || '')}</textarea>
            </div>
            <div class="tb-sum-item span-2">
              <span class="tb-sum-label">Prioridades Técnicas de Projeto:</span>
              <textarea class="form-textarea tb-auto-edit" rows="2" onchange="TechnicalBriefModule.saveSummaryField('${project.id}', 'priorities', this.value)">${escapeHTML(sum.priorities || '')}</textarea>
            </div>
            <div class="tb-sum-item">
              <span class="tb-sum-label">Linguagem / Estilo:</span>
              <input type="text" class="form-input tb-auto-edit" value="${escapeHTML(sum.style || '')}" onchange="TechnicalBriefModule.saveSummaryField('${project.id}', 'style', this.value)">
            </div>
            <div class="tb-sum-item">
              <span class="tb-sum-label">Informação Crítica de Canteiro/Maresia:</span>
              <input type="text" class="form-input tb-auto-edit" value="${escapeHTML(sum.criticalInfo || '')}" onchange="TechnicalBriefModule.saveSummaryField('${project.id}', 'criticalInfo', this.value)">
            </div>
          </div>
        </section>

        <!-- GRID DAS DEMAIS 21 SEÇÕES TÉCNICAS ESTRUTURADAS -->
        <div class="tb-grid-2col">
          <!-- 02 — PERFIL DO CLIENTE -->
          <div class="tb-section-card">
            <div class="tb-card-header">
              <div class="tb-card-title-group">
                <span class="tb-sec-num">02</span>
                <h4>PERFIL DO CLIENTE</h4>
                ${this.renderSourceBadge('CLIENTE', 'p1_quem', '1')}
              </div>
            </div>
            <div class="tb-data-list">
              <div><strong>Composição Familiar:</strong> ${escapeHTML(sec.clientProfile ? sec.clientProfile.composition : 'Não informado')}</div>
              <div><strong>Rotina & Dinâmica:</strong> ${escapeHTML(sec.clientProfile ? sec.clientProfile.routine : 'Não informado')}</div>
              <div><strong>Frequência de Visitas:</strong> ${escapeHTML(sec.clientProfile ? sec.clientProfile.visitors : 'Não informado')}</div>
              <div><strong>Animais de Estimação:</strong> ${escapeHTML(sec.clientProfile ? sec.clientProfile.pets : 'Não')}</div>
              <div><strong>Acessibilidade & Cuidados:</strong> ${escapeHTML(sec.clientProfile ? sec.clientProfile.accessibility : 'Padrão')}</div>
            </div>
          </div>

          <!-- 03 — OBJETIVOS -->
          <div class="tb-section-card">
            <div class="tb-card-header">
              <div class="tb-card-title-group">
                <span class="tb-sec-num">03</span>
                <h4>OBJETIVOS</h4>
                ${this.renderSourceBadge('ARQVERTICE', 'interp-obj', '1')}
              </div>
            </div>
            <div class="tb-data-list">
              <div><strong>Objetivo Primário:</strong> ${escapeHTML(sec.objectives ? sec.objectives.primary : '')}</div>
              <div><strong>Objetivo Secundário:</strong> ${escapeHTML(sec.objectives ? sec.objectives.secondary : '')}</div>
            </div>
          </div>

          <!-- 04 — PROGRAMA -->
          <div class="tb-section-card span-2">
            <div class="tb-card-header">
              <div class="tb-card-title-group">
                <span class="tb-sec-num">04</span>
                <h4>PROGRAMA DE NECESSIDADES & SETORIZAÇÃO</h4>
                ${this.renderSourceBadge('ARQVERTICE', 'prog-01', '1')}
              </div>
            </div>
            <div class="tb-sectors-grid">
              <div class="sector-tile">
                <span class="st-label"><i data-lucide="users"></i> Setor Social</span>
                <p>${escapeHTML(sec.program ? sec.program.socialSector : 'Living, jantar e cozinha integrados')}</p>
              </div>
              <div class="sector-tile">
                <span class="st-label"><i data-lucide="lock"></i> Setor Íntimo</span>
                <p>${escapeHTML(sec.program ? sec.program.intimateSector : 'Suítes e dormitórios')}</p>
              </div>
              <div class="sector-tile">
                <span class="st-label"><i data-lucide="sun"></i> Setor de Lazer</span>
                <p>${escapeHTML(sec.program ? sec.program.leisureSector : 'Deck, piscina e gourmet')}</p>
              </div>
              <div class="sector-tile">
                <span class="st-label"><i data-lucide="wrench"></i> Setor de Serviço</span>
                <p>${escapeHTML(sec.program ? sec.program.serviceSector : 'Lavanderia e despensas')}</p>
              </div>
            </div>
          </div>

          <!-- 05 — AMBIENTES (RESUMO) -->
          <div class="tb-section-card span-2">
            <div class="tb-card-header">
              <div class="tb-card-title-group">
                <span class="tb-sec-num">05</span>
                <h4>AMBIENTES PRELIMINARES DO PROJETO</h4>
                <span class="badge-pill">${tb.environments ? tb.environments.length : 0} Fichas Registradas</span>
              </div>
              <button class="btn btn-outline btn-xs" onclick="TechnicalBriefModule.switchSubTab('ambientes')">
                <i data-lucide="external-link"></i> Abrir Fichas Técnicas
              </button>
            </div>
            <div class="tb-envs-chips-row">
              ${(tb.environments || []).map(env => `
                <div class="tb-env-mini-chip" onclick="TechnicalBriefModule.switchSubTab('ambientes')">
                  <strong>${escapeHTML(env.name)}</strong>
                  <span>${env.areaM2 ? env.areaM2 + ' m²' : '—'} &bull; ${escapeHTML(env.type)}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 06 — NECESSIDADES -->
          <div class="tb-section-card">
            <div class="tb-card-header">
              <div class="tb-card-title-group">
                <span class="tb-sec-num">06</span>
                <h4>NECESSIDADES PRIORITÁRIAS</h4>
                ${this.renderSourceBadge('CLIENTE', 'p8_ambientes', '1')}
              </div>
            </div>
            <ul class="tb-bullet-list">
              ${(sum.mainNeeds || []).map(n => `<li>${escapeHTML(n)}</li>`).join('')}
            </ul>
          </div>

          <!-- 07 — RESTRIÇÕES -->
          <div class="tb-section-card">
            <div class="tb-card-header">
              <div class="tb-card-title-group">
                <span class="tb-sec-num">07</span>
                <h4>RESTRIÇÕES ATIVAS</h4>
                <span class="badge-pill text-danger">${tb.restrictions ? tb.restrictions.length : 0} Restrições</span>
              </div>
              <button class="btn btn-outline btn-xs" onclick="TechnicalBriefModule.switchSubTab('restricoes')">
                <i data-lucide="external-link"></i> Ver Todas
              </button>
            </div>
            <div class="tb-data-list">
              ${(tb.restrictions || []).slice(0, 3).map(r => `
                <div class="tb-res-summary-item">
                  <span class="priority-dot priority-${r.priority ? r.priority.toLowerCase() : 'medio'}"></span>
                  <div>
                    <strong>${this.formatRestrictionCategory(r.category)}:</strong>
                    <span>${escapeHTML(r.description)}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 08 — PREMISSAS -->
          <div class="tb-section-card">
            <div class="tb-card-header">
              <div class="tb-card-title-group">
                <span class="tb-sec-num">08</span>
                <h4>PREMISSAS DE PROJETO</h4>
                ${this.renderSourceBadge('ARQVERTICE', 'premises-01', '1')}
              </div>
            </div>
            <div class="tb-data-list">
              ${(sec.premises || []).map(p => `
                <div>
                  <strong>${escapeHTML(p.title)}:</strong>
                  <span>${escapeHTML(p.description)}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 09 — DIRETRIZES -->
          <div class="tb-section-card">
            <div class="tb-card-header">
              <div class="tb-card-title-group">
                <span class="tb-sec-num">09</span>
                <h4>DIRETRIZES TÉCNICAS</h4>
                <span class="badge-pill">${tb.directives ? tb.directives.length : 0} Registradas</span>
              </div>
              <button class="btn btn-outline btn-xs" onclick="TechnicalBriefModule.switchSubTab('diretrizes')">
                <i data-lucide="external-link"></i> Gestor
              </button>
            </div>
            <div class="tb-data-list">
              ${(tb.directives || []).slice(0, 3).map(d => `
                <div class="tb-dir-summary-item">
                  <span class="cat-pill">${escapeHTML(d.category)}</span>
                  <strong>${escapeHTML(d.title)}</strong>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 10 — ESTILO -->
          <div class="tb-section-card">
            <div class="tb-card-header">
              <div class="tb-card-title-group">
                <span class="tb-sec-num">10</span>
                <h4>ESTILO & ATMOSFERA</h4>
                ${this.renderSourceBadge('CLIENTE', 'p7_estilos', '1')}
              </div>
            </div>
            <div class="tb-data-list">
              <div><strong>Linguagem Primária:</strong> ${escapeHTML(sec.style ? sec.style.mainStyle : 'Contemporâneo')}</div>
              <div><strong>Paleta Cromática:</strong> ${escapeHTML(sec.style ? sec.style.colorPalette : 'Neutros')}</div>
              <div><strong>Sensação Espacial:</strong> ${escapeHTML(sec.style ? sec.style.visualMood : '')}</div>
            </div>
          </div>

          <!-- 11 — MATERIALIDADE -->
          <div class="tb-section-card">
            <div class="tb-card-header">
              <div class="tb-card-title-group">
                <span class="tb-sec-num">11</span>
                <h4>MATERIALIDADE</h4>
                ${this.renderSourceBadge('ARQVERTICE', 'mat-01', '1')}
              </div>
            </div>
            <div class="tb-data-list">
              <div><strong>Pavimentação:</strong> ${escapeHTML(sec.materiality ? sec.materiality.flooring : '')}</div>
              <div><strong>Paredes / Painéis:</strong> ${escapeHTML(sec.materiality ? sec.materiality.walls : '')}</div>
              <div><strong>Bancadas & Ilhas:</strong> ${escapeHTML(sec.materiality ? sec.materiality.countertops : '')}</div>
              <div class="text-danger"><strong>Materiais Rejeitados:</strong> ${escapeHTML(sec.materiality ? sec.materiality.rejectedMaterials : '')}</div>
            </div>
          </div>

          <!-- 12 — ILUMINAÇÃO -->
          <div class="tb-section-card">
            <div class="tb-card-header">
              <div class="tb-card-title-group">
                <span class="tb-sec-num">12</span>
                <h4>ILUMINAÇÃO</h4>
                ${this.renderSourceBadge('CLIENTE', 'p9_luz', '1')}
              </div>
            </div>
            <div class="tb-data-list">
              <div><strong>Iluminação Natural:</strong> ${escapeHTML(sec.lighting ? sec.lighting.natural : '')}</div>
              <div><strong>Iluminação Artificial:</strong> ${escapeHTML(sec.lighting ? sec.lighting.artificial : '')}</div>
            </div>
          </div>

          <!-- 13 — MOBILIÁRIO -->
          <div class="tb-section-card">
            <div class="tb-card-header">
              <div class="tb-card-title-group">
                <span class="tb-sec-num">13</span>
                <h4>MOBILIÁRIO & MARCENARIA</h4>
                ${this.renderSourceBadge('ARQVERTICE', 'furn-01', '1')}
              </div>
            </div>
            <div class="tb-data-list">
              <div><strong>Marcenaria Sob Medida:</strong> ${escapeHTML(sec.furniture ? sec.furniture.builtIn : '')}</div>
              <div><strong>Mobiliário Solto:</strong> ${escapeHTML(sec.furniture ? sec.furniture.loose : '')}</div>
            </div>
          </div>

          <!-- 14 — TECNOLOGIA -->
          <div class="tb-section-card">
            <div class="tb-card-header">
              <div class="tb-card-title-group">
                <span class="tb-sec-num">14</span>
                <h4>TECNOLOGIA & AUTOMAÇÃO</h4>
                ${this.renderSourceBadge('CLIENTE', 'p9_automacao', '1')}
              </div>
            </div>
            <div class="tb-data-list">
              <div><strong>Nível de Automação:</strong> ${escapeHTML(sec.technology ? sec.technology.automation : '')}</div>
              <div><strong>Infraestrutura:</strong> ${escapeHTML(sec.technology ? sec.technology.infrastructure : '')}</div>
            </div>
          </div>

          <!-- 15 — ÁREAS EXTERNAS -->
          <div class="tb-section-card">
            <div class="tb-card-header">
              <div class="tb-card-title-group">
                <span class="tb-sec-num">15</span>
                <h4>ÁREAS EXTERNAS & PAISAGISMO</h4>
                ${this.renderSourceBadge('ARQVERTICE', 'out-01', '1')}
              </div>
            </div>
            <div class="tb-data-list">
              <div><strong>Piscina / Espelho d'Água:</strong> ${escapeHTML(sec.outdoor ? sec.outdoor.pool : '')}</div>
              <div><strong>Paisagismo & Vegetação:</strong> ${escapeHTML(sec.outdoor ? sec.outdoor.landscape : '')}</div>
            </div>
          </div>

          <!-- 16 — INVESTIMENTO -->
          <div class="tb-section-card">
            <div class="tb-card-header">
              <div class="tb-card-title-group">
                <span class="tb-sec-num">16</span>
                <h4>INVESTIMENTO (TARGET ORÇAMENTÁRIO)</h4>
                ${this.renderSourceBadge('CLIENTE', 'p10_orcamento', '1')}
              </div>
            </div>
            <div class="tb-data-list">
              <div><strong>Faixa Informada:</strong> <span class="badge-status-pill status-completed">${escapeHTML(sec.investment ? sec.investment.targetRange : '')}</span></div>
              <div><strong>Notas de Custo:</strong> ${escapeHTML(sec.investment ? sec.investment.costNotes : '')}</div>
            </div>
          </div>

          <!-- 17 — PRAZOS -->
          <div class="tb-section-card">
            <div class="tb-card-header">
              <div class="tb-card-title-group">
                <span class="tb-sec-num">17</span>
                <h4>PRAZOS & MARCOS</h4>
                ${this.renderSourceBadge('ARQVERTICE', 'prazos-01', '1')}
              </div>
            </div>
            <div class="tb-data-list">
              <div><strong>Marcos das Etapas:</strong> ${escapeHTML(sec.deadlines ? sec.deadlines.milestones : '')}</div>
              <div><strong>Previsão de Conclusão:</strong> <strong>${escapeHTML(sec.deadlines ? sec.deadlines.expectedCompletion : '')}</strong></div>
            </div>
          </div>

          <!-- 18 — REFERÊNCIAS -->
          <div class="tb-section-card">
            <div class="tb-card-header">
              <div class="tb-card-title-group">
                <span class="tb-sec-num">18</span>
                <h4>REFERÊNCIAS TÉCNICAS E VISUAIS</h4>
                <span class="badge-pill">${sec.references ? sec.references.length : 0} Imagens</span>
              </div>
            </div>
            <div class="tb-refs-mini-grid">
              ${(sec.references || []).map(r => `
                <div class="tb-ref-tile" onclick="StudioApp.openLightbox('${r.url}', '${escapeHTML(r.title)}')">
                  <img src="${r.url}" alt="${escapeHTML(r.title)}">
                  <span>${escapeHTML(r.title)}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 19 — PONTOS DE ATENÇÃO -->
          <div class="tb-section-card">
            <div class="tb-card-header">
              <div class="tb-card-title-group">
                <span class="tb-sec-num">19</span>
                <h4>PONTOS DE ATENÇÃO & RISCOS</h4>
                <span class="badge-pill text-warning">${sec.attentionPoints ? sec.attentionPoints.length : 0} Alertas</span>
              </div>
            </div>
            <div class="tb-data-list">
              ${(sec.attentionPoints || []).map(a => `
                <div class="tb-attention-item">
                  <i data-lucide="alert-triangle"></i>
                  <div>
                    <strong>${escapeHTML(a.title)}:</strong>
                    <span>${escapeHTML(a.description)}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 20 — PENDÊNCIAS -->
          <div class="tb-section-card">
            <div class="tb-card-header">
              <div class="tb-card-title-group">
                <span class="tb-sec-num">20</span>
                <h4>PENDÊNCIAS DO BRIEFING</h4>
                <span class="badge-pill">${tb.pendencies ? tb.pendencies.length : 0} Itens</span>
              </div>
              <button class="btn btn-outline btn-xs" onclick="TechnicalBriefModule.switchSubTab('pendencias')">
                <i data-lucide="external-link"></i> Gerenciar
              </button>
            </div>
            <div class="tb-data-list">
              ${(tb.pendencies || []).slice(0, 3).map(p => `
                <div class="tb-pend-summary-item">
                  <span class="status-indicator-dot ${p.status === 'RESOLVIDA' ? 'is-green' : 'is-yellow'}"></span>
                  <span>${escapeHTML(p.description)}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 21 — DECISÕES -->
          <div class="tb-section-card">
            <div class="tb-card-header">
              <div class="tb-card-title-group">
                <span class="tb-sec-num">21</span>
                <h4>DECISÕES TÉCNICAS FORMALIZADAS</h4>
                <span class="badge-pill">${sec.decisions ? sec.decisions.length : 0} Decisões</span>
              </div>
            </div>
            <div class="tb-data-list">
              ${(sec.decisions || []).map(d => `
                <div class="tb-decision-item">
                  <div class="dec-head"><strong>${escapeHTML(d.title)}</strong> <span>${d.date}</span></div>
                  <p>${escapeHTML(d.rationale)}</p>
                  <small>Autor: ${escapeHTML(d.author)} &bull; ${d.status}</small>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 22 — OBSERVAÇÕES INTERNAS -->
          <div class="tb-section-card span-2">
            <div class="tb-card-header">
              <div class="tb-card-title-group">
                <span class="tb-sec-num">22</span>
                <h4>OBSERVAÇÕES INTERNAS DO ESTÚDIO (CONFIDENCIAL)</h4>
                ${this.renderSourceBadge('ARQVERTICE', 'notes-01', '1')}
              </div>
            </div>
            <textarea class="form-textarea" rows="3" placeholder="Anotações internas do time de engenharia e coordenação..." onchange="TechnicalBriefModule.saveSectionField('${project.id}', 'internalNotes', this.value)">${escapeHTML(sec.internalNotes || '')}</textarea>
          </div>
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // 2. MATRIZ AMBIENTE × NECESSIDADE (Prompt C01 item 11)
  // --------------------------------------------------------------------------
  renderEnvironmentMatrix(tb) {
    const envs = tb.environments || [];
    const directives = tb.directives || [];
    const restrictions = tb.restrictions || [];

    const selected = this.matrixSelectedEnv === 'all' 
      ? envs 
      : envs.filter(e => e.id === this.matrixSelectedEnv);

    return `
      <div class="tb-matrix-view animate-fade-in">
        <div class="tb-matrix-toolbar">
          <div>
            <h3><i data-lucide="table"></i> Matriz Interativa: Ambiente &times; Necessidades &times; Restrições</h3>
            <p class="text-sm text-secondary">Cruze o programa arquitetônico com as diretrizes e restrições para garantir conformidade em cada cômodo.</p>
          </div>

          <div class="tb-filter-bar">
            <label class="form-label text-xs">Filtrar Ambiente:</label>
            <select class="form-select form-select-sm" onchange="TechnicalBriefModule.setMatrixEnvFilter(this.value)">
              <option value="all" ${this.matrixSelectedEnv === 'all' ? 'selected' : ''}>Todos os Ambientes (${envs.length})</option>
              ${envs.map(e => `<option value="${e.id}" ${this.matrixSelectedEnv === e.id ? 'selected' : ''}>${escapeHTML(e.name)}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="tb-matrix-cards-grid">
          ${selected.map(env => {
            const envNeeds = env.needs || [];
            return `
              <div class="tb-matrix-card">
                <div class="tmc-header">
                  <div class="tmc-title-row">
                    <span class="cat-pill">${escapeHTML(env.type)}</span>
                    <h4>${escapeHTML(env.name)}</h4>
                  </div>
                  <span class="tmc-area">${env.areaM2 ? env.areaM2 + ' m²' : '—'}</span>
                </div>

                <div class="tmc-body">
                  <!-- Necessidades -->
                  <div class="tmc-block">
                    <span class="tmc-label"><i data-lucide="check-square"></i> Necessidades Especificadas:</span>
                    <div class="tmc-tags-wrap">
                      ${envNeeds.length ? envNeeds.map(n => `<span class="tmc-tag-need">${escapeHTML(n)}</span>`).join('') : '<span class="text-muted text-xs">Nenhuma necessidade explícita</span>'}
                    </div>
                  </div>

                  <!-- Restrições Aplicáveis -->
                  <div class="tmc-block">
                    <span class="tmc-label"><i data-lucide="alert-circle"></i> Restrições & Cuidados:</span>
                    <p class="text-xs text-secondary">${escapeHTML(env.rejectedMaterials ? 'Vedações: ' + env.rejectedMaterials : 'Nenhuma restrição crítica de materiais.')}</p>
                  </div>

                  <!-- Prioridades Técnicas -->
                  <div class="tmc-block">
                    <span class="tmc-label"><i data-lucide="award"></i> Função & Frequência:</span>
                    <p class="text-xs"><strong>${escapeHTML(env.function || 'Uso cotidiano')}</strong> &bull; <em>${escapeHTML(env.frequency || 'Diária')}</em></p>
                  </div>

                  <!-- Referências Visuais -->
                  <div class="tmc-block">
                    <span class="tmc-label"><i data-lucide="image"></i> Conceito & Estilo:</span>
                    <p class="text-xs text-secondary">${escapeHTML(env.style || 'Contemporâneo')} — ${escapeHTML(env.references || '')}</p>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // 3. SEPARAÇÃO ENTRE FATO E INTERPRETAÇÃO (Prompt C01 item 5)
  // --------------------------------------------------------------------------
  renderFactVsInterpretation(tb, clientBriefing) {
    const ans = (clientBriefing && clientBriefing.answers) || {};
    const comparisons = [
      {
        topic: 'Integração Social',
        fact: ans.p8_integracao || '100% Integrado (Cozinha, sala de estar e jantar em um espaço único)',
        sourceFact: 'CLIENTE (p8_integracao)',
        interpretation: 'Priorizar integração espacial e visual absoluta através de portas piso-teto embutidas na alvenaria, eliminando colunas no eixo de visão.',
        impact: 'Exigirá viga de transição metálica ou protendida de 6m de vão livre.'
      },
      {
        topic: 'Estilo & Linguagem Visual',
        fact: Array.isArray(ans.p7_estilos) ? ans.p7_estilos.join(', ') : (ans.p7_estilos || 'Rústico / Praiano e Contemporâneo'),
        sourceFact: 'CLIENTE (p7_estilos)',
        interpretation: 'Compor linguagem Resort Litorâneo: materiais minerais brutos (travertino, cumaru) contrastados com serralheria fina preta e vidro duplo.',
        impact: 'Especificação de texturas minerais respiráveis anti-umidade.'
      },
      {
        topic: 'Restrições e Rejeições',
        fact: ans.p7_detesta || 'Cores fluorescentes, gesso rebuscado com muitas molduras e carpete.',
        sourceFact: 'CLIENTE (p7_detesta)',
        interpretation: 'Linhas ortogonais puras, forro de gesso liso tabicado 15mm sem sancas clássicas e paleta restrita a tons de areia, linho e pedra.',
        impact: 'Bloqueio estrito no catálogo de materiais 3D para evitar retrabalho de renders.'
      },
      {
        topic: 'Conforto Lumínico',
        fact: ans.p9_luz || 'Quente e aconchegante (Amarelada, indireta, clima relaxante)',
        sourceFact: 'CLIENTE (p9_luz)',
        interpretation: 'Circuitos 100% indiretos dimerizáveis com temperatura de cor de 2700K no social e íntimo, reservando 4000K apenas para bancadas de cocção.',
        impact: 'Previsão de marcenaria com rasgos ocultos para perfis de LED de alto IRC.'
      },
      {
        topic: 'Acessibilidade & Familiares',
        fact: ans.p1_acessibilidade || 'Prever suíte térrea caso os avós venham se hospedar.',
        sourceFact: 'CLIENTE (p1_acessibilidade)',
        interpretation: 'Posicionar 1 suíte completa no pavimento térreo com porta de 80cm de vão livre e banheiro acessível com ralo linear sem desnível abrupto.',
        impact: 'Garante permanência de idosos sem necessidade de subir escadas.'
      }
    ];

    return `
      <div class="tb-facts-interp-view animate-fade-in">
        <div class="tb-view-hero">
          <h3><i data-lucide="split"></i> Separação Estrita: Fato do Cliente vs Interpretação ArqVértice</h3>
          <p class="text-sm text-secondary">Princípio fundamental do Bloco C01: O dado do cliente é o fato original inviolável; a interpretação interna é a tradução técnica do escritório.</p>
        </div>

        <div class="tb-comparisons-stack">
          ${comparisons.map((c, idx) => `
            <div class="tb-comparison-card">
              <div class="tcc-header">
                <span class="tcc-num">#0${idx + 1}</span>
                <h4>${escapeHTML(c.topic)}</h4>
              </div>

              <div class="tcc-grid">
                <!-- Coluna do Cliente (FATO) -->
                <div class="tcc-col tcc-client">
                  <div class="tcc-col-badge">
                    <span class="badge-source source-cliente"><i data-lucide="user"></i> DADO BRUTO DO CLIENTE (FATO)</span>
                    <span class="source-ref">${c.sourceFact}</span>
                  </div>
                  <blockquote class="tcc-quote">
                    "${escapeHTML(c.fact)}"
                  </blockquote>
                  <span class="tcc-lock-hint"><i data-lucide="lock"></i> Dado inviolável não modificado</span>
                </div>

                <!-- Coluna da ArqVértice (INTERPRETAÇÃO) -->
                <div class="tcc-col tcc-arqvertice">
                  <div class="tcc-col-badge">
                    <span class="badge-source source-arqvertice"><i data-lucide="compass"></i> INTERPRETAÇÃO ARQVERTICE</span>
                    <span class="source-ref">Diretriz Executiva</span>
                  </div>
                  <div class="tcc-interp-body">
                    <p>${escapeHTML(c.interpretation)}</p>
                    <div class="tcc-impact-callout">
                      <strong>Impacto Técnico / Estrutural:</strong>
                      <span>${escapeHTML(c.impact)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // 4. GESTOR DE DIRETRIZES TÉCNICAS (Prompt C01 item 7)
  // --------------------------------------------------------------------------
  renderDirectivesManager(tb, project) {
    let list = tb.directives || [];

    if (this.filterCategory !== 'all') {
      list = list.filter(d => d.category === this.filterCategory);
    }
    if (this.filterPriority !== 'all') {
      list = list.filter(d => d.priority === this.filterPriority);
    }

    const categories = ['FUNCIONAL', 'ESPACIAL', 'ESTETICA', 'MATERIAL', 'ILUMINACAO', 'MOBILIARIO', 'TECNOLOGIA', 'CONFORTO', 'EXTERIOR', 'APRESENTACAO', 'OUTRA'];

    return `
      <div class="tb-directives-view animate-fade-in">
        <header class="tb-list-toolbar">
          <div>
            <h3><i data-lucide="compass"></i> Diretrizes Técnicas Estruturadas</h3>
            <p class="text-sm text-secondary">Crie e organize as diretrizes operacionais de projeto categorizadas e priorizadas.</p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="TechnicalBriefModule.openNewDirectiveModal()">
            <i data-lucide="plus"></i> Nova Diretriz
          </button>
        </header>

        <!-- Filtros Rápidos -->
        <div class="tb-chips-filter-row">
          <span class="filter-title">Categoria:</span>
          <button class="filter-chip ${this.filterCategory === 'all' ? 'active' : ''}" onclick="TechnicalBriefModule.setFilterCategory('all')">Todas</button>
          ${categories.map(cat => `
            <button class="filter-chip ${this.filterCategory === cat ? 'active' : ''}" onclick="TechnicalBriefModule.setFilterCategory('${cat}')">${cat}</button>
          `).join('')}
        </div>

        <div class="tb-directives-grid">
          ${list.length === 0 ? `
            <div class="empty-state-box">
              <i data-lucide="compass"></i>
              <h4>Nenhuma diretriz encontrada para os filtros selecionados</h4>
              <p>Cadastre uma nova diretriz técnica para orientar os estudos preliminares.</p>
            </div>
          ` : list.map(dir => `
            <div class="tb-dir-card">
              <div class="tdc-top">
                <span class="cat-pill">${escapeHTML(dir.category)}</span>
                <span class="priority-pill priority-${dir.priority ? dir.priority.toLowerCase() : 'medio'}">${escapeHTML(dir.priority)}</span>
                ${this.renderSourceBadge(dir.sourceType || 'ARQVERTICE')}
              </div>

              <h4 class="tdc-title">${escapeHTML(dir.title)}</h4>
              <p class="tdc-desc">${escapeHTML(dir.description)}</p>

              ${dir.observation ? `
                <div class="tdc-obs"><i data-lucide="info"></i> <span>${escapeHTML(dir.observation)}</span></div>
              ` : ''}

              <div class="tdc-footer">
                <div class="tdc-author">
                  <i data-lucide="user-check"></i>
                  <span>${escapeHTML(dir.responsible || 'Eduardo Marques')} &bull; ${dir.date}</span>
                </div>
                <div class="tdc-actions">
                  <button class="btn-icon btn-ghost btn-xs" onclick="TechnicalBriefModule.openEditDirectiveModal('${dir.id}')" title="Editar"><i data-lucide="edit-2"></i></button>
                  <button class="btn-icon btn-ghost btn-xs text-danger" onclick="TechnicalBriefModule.deleteDirective('${project.id}', '${dir.id}')" title="Excluir"><i data-lucide="trash-2"></i></button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // 5. RESTRIÇÕES TÉCNICAS (8 CATEGORIAS) (Prompt C01 item 9)
  // --------------------------------------------------------------------------
  renderRestrictionsManager(tb, project) {
    const list = tb.restrictions || [];
    const catLabels = {
      'PRESERVAR_EXISTENTE': 'Elementos Existentes a Preservar',
      'INALTERAVEL': 'Elementos que NÃO Podem ser Alterados',
      'LIMITACAO_INFORMADA': 'Limitações Informadas',
      'PREFERENCIA_NEGATIVA': 'Preferências Negativas (O que Detesta)',
      'ORCAMENTO': 'Restrições de Orçamento',
      'PRAZO': 'Restrições de Prazo',
      'OBRA': 'Restrições de Obra / Canteiro',
      'IMOVEL': 'Restrições do Imóvel / Zoneamento'
    };

    return `
      <div class="tb-restrictions-view animate-fade-in">
        <header class="tb-list-toolbar">
          <div>
            <h3><i data-lucide="shield-alert"></i> Restrições Técnicas & Condicionantes</h3>
            <p class="text-sm text-secondary">Ledger oficial das vedações, preservações e limitações rígidas de projeto.</p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="TechnicalBriefModule.openNewRestrictionModal()">
            <i data-lucide="plus"></i> Nova Restrição
          </button>
        </header>

        <div class="tb-restrictions-grid">
          ${list.length === 0 ? `
            <div class="empty-state-box">
              <i data-lucide="shield-check"></i>
              <h4>Nenhuma restrição cadastrada</h4>
              <p>Cadastre as limitações de terreno, preferências negativas ou condicionantes de obra.</p>
            </div>
          ` : list.map(r => `
            <div class="tb-restriction-card">
              <div class="trc-top">
                <span class="trc-cat-pill">${catLabels[r.category] || r.category}</span>
                <span class="priority-pill priority-${r.priority ? r.priority.toLowerCase() : 'alto'}">${escapeHTML(r.priority)}</span>
                ${this.renderSourceBadge(r.sourceType || 'CLIENTE')}
              </div>

              <p class="trc-desc">${escapeHTML(r.description)}</p>

              ${r.observation ? `
                <div class="trc-obs"><strong>Medida Mitigatória:</strong> ${escapeHTML(r.observation)}</div>
              ` : ''}

              <div class="trc-footer">
                <span class="trc-status badge-pill status-${r.status === 'ATIVA' ? 'review' : 'completed'}">${r.status || 'ATIVA'}</span>
                <button class="btn-icon btn-ghost btn-xs text-danger" onclick="TechnicalBriefModule.deleteRestriction('${project.id}', '${r.id}')" title="Excluir"><i data-lucide="trash-2"></i></button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // 6. FICHAS TÉCNICAS PRELIMINARES DOS AMBIENTES (Prompt C01 item 10)
  // --------------------------------------------------------------------------
  renderPreliminaryEnvironments(tb, project) {
    const list = tb.environments || [];

    return `
      <div class="tb-environments-view animate-fade-in">
        <header class="tb-list-toolbar">
          <div>
            <h3><i data-lucide="home"></i> Fichas Técnicas Preliminares dos Ambientes (16 Atributos)</h3>
            <p class="text-sm text-secondary">Ficha estruturada de cada ambiente do projeto para subsidiar o 3D, a iluminação e a marcenaria.</p>
          </div>
          <button class="btn btn-outline btn-sm" onclick="TechnicalBriefModule.syncEnvironmentsFromProject('${project.id}')">
            <i data-lucide="refresh-cw"></i> Sincronizar dos Ambientes
          </button>
        </header>

        <div class="tb-envs-cards-list">
          ${list.map(env => `
            <div class="tb-env-full-card">
              <div class="tef-header">
                <div class="tef-title-wrap">
                  <span class="cat-pill">${escapeHTML(env.type)}</span>
                  <h4>${escapeHTML(env.name)}</h4>
                  <span class="tef-area-pill">${env.areaM2 ? env.areaM2 + ' m²' : 'Área a definir'}</span>
                </div>
                <span class="badge-status-pill status-${env.status === 'APROVADO' ? 'completed' : 'in-progress'}">${escapeHTML(env.status)}</span>
              </div>

              <div class="tef-attributes-grid">
                <div class="tef-attr-item"><strong>Usuários / Ocupação:</strong> <span>${escapeHTML(env.users || 'Ocupantes da casa')}</span></div>
                <div class="tef-attr-item"><strong>Função Principal:</strong> <span>${escapeHTML(env.function || 'Convivência')}</span></div>
                <div class="tef-attr-item"><strong>Frequência de Uso:</strong> <span>${escapeHTML(env.frequency || 'Diária')}</span></div>
                <div class="tef-attr-item"><strong>Estilo Pretendido:</strong> <span>${escapeHTML(env.style || 'Contemporâneo')}</span></div>
                
                <div class="tef-attr-item span-2">
                  <strong>Necessidades Específicas:</strong>
                  <div class="tmc-tags-wrap" style="margin-top: 4px;">
                    ${(env.needs || []).map(n => `<span class="tmc-tag-need">${escapeHTML(n)}</span>`).join('')}
                  </div>
                </div>

                <div class="tef-attr-item"><strong>Materiais Desejados:</strong> <span>${escapeHTML(env.desiredMaterials || 'Naturais')}</span></div>
                <div class="tef-attr-item text-danger"><strong>Materiais Rejeitados:</strong> <span>${escapeHTML(env.rejectedMaterials || 'Nenhum')}</span></div>
                <div class="tef-attr-item"><strong>Mobiliário Previsto:</strong> <span>${escapeHTML(env.furniture || 'A definir')}</span></div>
                <div class="tef-attr-item"><strong>Equipamentos & Eletros:</strong> <span>${escapeHTML(env.equipment || 'A definir')}</span></div>
                <div class="tef-attr-item"><strong>Conceito Luminotécnico:</strong> <span>${escapeHTML(env.lighting || 'Luz indireta e funcional')}</span></div>
                <div class="tef-attr-item"><strong>Referências Visuais:</strong> <span>${escapeHTML(env.references || 'Ver moodboards')}</span></div>
                
                <div class="tef-attr-item span-2">
                  <strong>Observações Técnicas:</strong>
                  <p class="text-xs text-secondary" style="margin: 4px 0 0 0;">${escapeHTML(env.observations || 'Sem observações adicionais.')}</p>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // 7. GESTOR DE PENDÊNCIAS (Prompt C01 item 12)
  // --------------------------------------------------------------------------
  renderPendenciesManager(tb, project) {
    const list = tb.pendencies || [];

    return `
      <div class="tb-pendencies-view animate-fade-in">
        <header class="tb-list-toolbar">
          <div>
            <h3><i data-lucide="clock"></i> Gestor de Pendências do Briefing</h3>
            <p class="text-sm text-secondary">Acompanhamento rigoroso de dados ausentes, confirmações de medidas e decisões pendentes.</p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="TechnicalBriefModule.openNewPendencyModal()">
            <i data-lucide="plus"></i> Nova Pendência
          </button>
        </header>

        <div class="tb-pendencies-table-wrap">
          <table class="tb-table">
            <thead>
              <tr>
                <th style="width: 50px;">Status</th>
                <th>Descrição da Pendência</th>
                <th>Prioridade</th>
                <th>Responsável</th>
                <th>Prazo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              ${list.length === 0 ? `
                <tr><td colspan="6" class="text-center text-muted" style="padding: 24px;">Nenhuma pendência ativa registrada.</td></tr>
              ` : list.map(p => `
                <tr class="tr-status-${p.status ? p.status.toLowerCase() : 'aberta'}">
                  <td>
                    <button class="btn-check-pendency ${p.status === 'RESOLVIDA' ? 'is-resolved' : ''}" onclick="TechnicalBriefModule.togglePendencyStatus('${project.id}', '${p.id}')" title="Alternar status">
                      <i data-lucide="${p.status === 'RESOLVIDA' ? 'check-circle' : 'circle'}"></i>
                    </button>
                  </td>
                  <td>
                    <strong>${escapeHTML(p.description)}</strong>
                    ${p.observation ? `<div class="text-xs text-muted" style="margin-top: 2px;">${escapeHTML(p.observation)}</div>` : ''}
                  </td>
                  <td>
                    <span class="priority-pill priority-${p.priority ? p.priority.toLowerCase() : 'medio'}">${escapeHTML(p.priority)}</span>
                  </td>
                  <td class="text-sm">${escapeHTML(p.responsible)}</td>
                  <td class="text-sm">${p.deadline || '—'}</td>
                  <td>
                    <button class="btn-icon btn-ghost btn-xs text-danger" onclick="TechnicalBriefModule.deletePendency('${project.id}', '${p.id}')"><i data-lucide="trash-2"></i></button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // 8. ASSISTENTE DE IA NO C01 (Prompt C01 item 13)
  // --------------------------------------------------------------------------
  renderAIAssistant(tb, project, clientBriefing) {
    const analysis = this.runAIAssistiveAnalysis(tb, project, clientBriefing);

    return `
      <div class="tb-ai-assistant-view animate-fade-in">
        <header class="tb-ai-header">
          <div class="tb-ai-badge">
            <i data-lucide="sparkles"></i> IA ARQVERTICE — ASSISTÊNCIA AO BRIEFING TÉCNICO (C01)
          </div>
          <h2>Análise Cognitiva de Conflitos, Lacunas e Síntese Executiva</h2>
          <p class="tb-ai-disclaimer">
            <i data-lucide="alert-circle"></i>
            <strong>REGRA CRÍTICA DE INTEGRIDADE:</strong> Toda saída da IA é classificada estritamente como <code>AI_SUGGESTION</code>. Nenhuma sugestão é tratada automaticamente como fato comprovado sem o aceite e validação expressa do arquiteto responsável.
          </p>
        </header>

        <div class="tb-ai-grid">
          <!-- 1. Detecção de Conflitos -->
          <div class="tb-ai-card">
            <div class="tai-card-head">
              <i data-lucide="alert-triangle" class="text-warning"></i>
              <h4>Possíveis Conflitos & Incompatibilidades Detectadas (${analysis.conflicts.length})</h4>
            </div>
            <div class="tai-card-body">
              ${analysis.conflicts.length === 0 ? `
                <p class="text-sm text-muted">Nenhum conflito crítico identificado entre programa, orçamento e prazos.</p>
              ` : analysis.conflicts.map(c => `
                <div class="tai-conflict-item">
                  <div class="tai-pills-row">
                    <span class="tai-badge-ai"><i data-lucide="bot"></i> AI_SUGGESTION</span>
                    <span class="priority-pill priority-${c.severity ? c.severity.toLowerCase() : 'alto'}">${c.severity}</span>
                  </div>
                  <strong>${escapeHTML(c.title)}</strong>
                  <p>${escapeHTML(c.description)}</p>
                  <div class="tai-solution-callout">
                    <span class="label">Recomendação da IA:</span>
                    <span>${escapeHTML(c.recommendation)}</span>
                  </div>
                  <div class="tai-actions">
                    <button class="btn btn-xs btn-primary" onclick="TechnicalBriefModule.acceptAISuggestion('${project.id}', 'conflict', '${c.id}')">
                      <i data-lucide="check"></i> Adotar como Diretriz ArqVértice
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 2. Dados Ausentes & Lacunas -->
          <div class="tb-ai-card">
            <div class="tai-card-head">
              <i data-lucide="help-circle" class="text-primary"></i>
              <h4>Dados Ausentes & Informações Críticas Faltantes (${analysis.missingData.length})</h4>
            </div>
            <div class="tai-card-body">
              ${analysis.missingData.map(m => `
                <div class="tai-missing-item">
                  <div class="tai-pills-row">
                    <span class="tai-badge-ai"><i data-lucide="bot"></i> AI_SUGGESTION</span>
                    <span class="priority-pill priority-${m.priority ? m.priority.toLowerCase() : 'alto'}">${m.priority}</span>
                  </div>
                  <strong>${escapeHTML(m.item)}</strong>
                  <p>${escapeHTML(m.reason)}</p>
                  <button class="btn btn-xs btn-outline" onclick="TechnicalBriefModule.convertMissingToPendency('${project.id}', '${escapeHTML(m.item)}')">
                    <i data-lucide="plus-circle"></i> Criar Pendência Oficial
                  </button>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 3. Perguntas Investigativas Sugeridas -->
          <div class="tb-ai-card span-2">
            <div class="tai-card-head">
              <i data-lucide="message-square" class="text-success"></i>
              <h4>Perguntas Sugeridas para Enviar ao Cliente / Levantar em Campo</h4>
            </div>
            <div class="tai-card-body">
              <div class="tai-questions-grid">
                ${analysis.suggestedQuestions.map((q, idx) => `
                  <div class="tai-q-box">
                    <span class="q-num">Pergunta #0${idx + 1}</span>
                    <p>"${escapeHTML(q.question)}"</p>
                    <small>Objetivo: ${escapeHTML(q.goal)}</small>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Executa a análise assistiva da IA com identificação de conflitos, dados ausentes e perguntas sugeridas
   */
  generateAiAnalysis(projectId) {
    const tb = StudioState.getTechnicalBrief(projectId);
    const project = (StudioState.data.projects || []).find(p => p.id === projectId) || { id: projectId };
    const clientBriefing = StudioState.getProjectBriefing(projectId);
    return this.runAIAssistiveAnalysis(tb, project, clientBriefing);
  },

  getFactInterpretations(projectId) {
    const tb = StudioState.getTechnicalBrief(projectId);
    return (tb && tb.factInterpretations) || [];
  },

  /**
   * Motor analítico local da IA no C01
   */
  runAIAssistiveAnalysis(tb, project, clientBriefing) {
    const ans = (clientBriefing && clientBriefing.answers) || {};
    const conflicts = [];
    const missingData = [];
    const suggestedQuestions = [];

    // Detecção 1: Orçamento vs Acabamentos / Automação
    if (ans.p9_automacao && ans.p9_automacao.includes('Completo') && ans.p10_orcamento && ans.p10_orcamento.includes('150.000')) {
      conflicts.push({
        id: 'conf-orc-auto',
        severity: 'ALTO',
        tag: 'AI_SUGGESTION',
        title: 'Potencial Incompatibilidade Orçamento × Automação Completa',
        description: 'Automação predial completa (áudio, cortinas, iluminação e climatização) pode consumir até 35% do orçamento inicial informado de R$ 150.000 a R$ 300.000.',
        recommendation: 'Sugerir ao cliente escalonamento em fases: infraestrutura completa embutida agora e equipamentos adquiridos na fase de marcenaria.'
      });
    }

    // Detecção 2: Prazos Curtos vs Construção do Zero
    if (ans.p2_natureza && ans.p2_natureza.includes('Construção do zero')) {
      conflicts.push({
        id: 'conf-prazo-obra',
        severity: 'ALTO',
        tag: 'AI_SUGGESTION',
        title: 'Incompatibilidade entre Prazo Desejado e Construção do Zero',
        description: 'Construção residencial unifamiliar completa de alto padrão costuma exigir entre 8 a 14 meses. Prazo para conclusão antes do fim de ano exigirá métodos construtivos a seco (Steel Frame ou Wood Frame) ou escalonamento de entrega.',
        recommendation: 'Alinhar com o cliente cronograma preliminar por etapas ou adoção de sistemas construtivos industrializados.'
      });
    }

    // Detecção 3: Maresia Severa Litorânea vs Durabilidade de Ferragens
    if ((project && project.location && project.location.toLowerCase().includes('praia')) || (ans.projeto_local && ans.projeto_local.toLowerCase().includes('praia'))) {
      conflicts.push({
        id: 'conf-maresia-materiais',
        severity: 'CRITICO',
        tag: 'AI_SUGGESTION',
        title: 'Maresia Litorânea Agressiva vs Especificação Padrão',
        description: 'Ambiente litorâneo com alta salinidade acelera corrosão de perfis e ferragens padrão.',
        recommendation: 'Exigir anodização inox naval em esquadrias e fixações em aço inox 316.'
      });
    }

    // Detecção 4: Prazos Curtos vs Complexidade
    if (project && project.builtAreaM2 > 350 && (!ans.p2_plantas || ans.p2_plantas.length === 0)) {
      conflicts.push({
        id: 'conf-area-plantas',
        severity: 'CRITICO',
        tag: 'AI_SUGGESTION',
        title: 'Projeto de Grande Porte sem Levantamento Topográfico Confirmado',
        description: 'Área projetada superior a 350m² sem confirmação de laudo de sondagem e topografia no questionário inicial.',
        recommendation: 'Bloquear detalhamento de fundações até a conclusão da etapa C02 (Levantamento).'
      });
    }

    // Lacuna 1: Cota de Lençol Freático
    missingData.push({
      item: 'Sondagem de Solo e Nível do Lençol Freático',
      priority: 'CRITICO',
      tag: 'AI_SUGGESTION',
      reason: 'Imprescindível para o cálculo de contenção da piscina com borda infinita.'
    });

    // Lacuna 2: Regulamento Interno do Loteamento
    missingData.push({
      item: 'Normas Específicas de Recuos e Platibandas da Associação',
      priority: 'ALTO',
      tag: 'AI_SUGGESTION',
      reason: 'Evita retrabalho na volumetria 3D no caso de restrições de gabarito de altura.'
    });

    // Perguntas Investigativas Sugeridas
    suggestedQuestions.push({
      question: 'Existe preferência por alguma marca de eletrodomésticos específica para a cozinha e gourmet (dimensões e voltagens)?',
      goal: 'Garantir furação exata e nichos de marcenaria sem retrabalho de marcenaria.',
      tag: 'AI_SUGGESTION'
    });

    suggestedQuestions.push({
      question: 'O casal planeja a instalação imediata de painéis de energia solar fotovoltaica no telhado?',
      goal: 'Dimensionamento da carga estática da laje de cobertura e shafts de cabeamento.',
      tag: 'AI_SUGGESTION'
    });

    suggestedQuestions.push({
      question: 'Qual o hábito da família quanto ao uso do ar-condicionado na sala social (uso contínuo ou apenas nas suítes)?',
      goal: 'Definir capacidade de BTUs e necessidade de sistema VRF vs Split tradicional.',
      tag: 'AI_SUGGESTION'
    });

    return { 
      provenanceTag: 'AI_SUGGESTION',
      conflicts, 
      missingData, 
      suggestedQuestions 
    };
  },

  // --------------------------------------------------------------------------
  // 9. SNAPSHOTS IMUTÁVEIS (Prompt C01 item 15)
  // --------------------------------------------------------------------------
  renderSnapshotsTimeline(tb) {
    const list = tb.snapshots || [];

    return `
      <div class="tb-snapshots-view animate-fade-in">
        <header class="tb-list-toolbar">
          <div>
            <h3><i data-lucide="history"></i> Linha do Tempo de Snapshots Imutáveis</h3>
            <p class="text-sm text-secondary">Registro histórico inviolável de cada versão homologada internamente pela ArqVértice.</p>
          </div>
        </header>

        <div class="tb-snapshots-list">
          ${list.length === 0 ? `
            <div class="empty-state-box">
              <i data-lucide="camera"></i>
              <h4>Nenhum snapshot gerado ainda</h4>
              <p>Clique em <strong>"Aprovar Briefing Técnico"</strong> no topo da tela para homologar a versão V01.</p>
            </div>
          ` : list.map(snap => `
            <div class="tb-snapshot-card">
              <div class="tsc-head">
                <div class="tsc-badge-row">
                  <span class="tb-pill-version">${escapeHTML(snap.versionCode)}</span>
                  <span class="tsc-date">${formatDateBR(snap.approvedAt)}</span>
                </div>
                <button class="btn btn-outline btn-xs" onclick="TechnicalBriefModule.viewSnapshotPayload('${snap.versionCode}')">
                  <i data-lucide="code"></i> Ver JSON do Snapshot
                </button>
              </div>

              <div class="tsc-body">
                <p><strong>Homologado por:</strong> ${escapeHTML(snap.approvedByName)}</p>
                <p><strong>Parecer Técnico:</strong> ${escapeHTML(snap.notes || 'Sem observações adicionais.')}</p>
                <div class="tsc-stats">
                  <span>Diretrizes: ${snap.payload.directives ? snap.payload.directives.length : (snap.payload.directivesCount || 0)}</span>
                  <span>Restrições: ${snap.payload.restrictions ? snap.payload.restrictions.length : (snap.payload.restrictionsCount || 0)}</span>
                  <span>Ambientes: ${snap.payload.environments ? snap.payload.environments.length : (snap.payload.environmentsCount || 0)}</span>
                  <span>Pendências: ${snap.payload.pendencies ? snap.payload.pendencies.length : (snap.payload.pendenciesCount || 0)}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // 10. PREPARAÇÃO PARA C02 (LEVANTAMENTO) (Prompt C01 item 16)
  // --------------------------------------------------------------------------
  renderC02Handover(tb, project, client) {
    const pkg = StudioState.getTechnicalBriefExportForC02(project.id);
    const jsonStr = JSON.stringify(pkg, null, 2);

    return `
      <div class="tb-c02-view animate-fade-in">
        <header class="tb-c02-banner">
          <div>
            <span class="badge-tag">ENTREGA DE ESTÁGIO &bull; BLOCO C01 &rarr; C02</span>
            <h2>Pacote Estruturado para o Bloco C02 — Levantamento</h2>
            <p class="text-sm text-secondary">Este pacote consolida todos os dados do projeto, programa, ambientes, restrições e diretrizes aprovadas para a equipe de levantamento físico, fotográfico e topográfico.</p>
          </div>
          <div class="tb-c02-actions">
            <button class="btn btn-primary btn-sm" onclick="TechnicalBriefModule.downloadC02PackageJSON('${project.id}')">
              <i data-lucide="download"></i> Baixar Pacote C02 (JSON)
            </button>
          </div>
        </header>

        <div class="tb-c02-grid">
          <div class="tb-c02-card">
            <h4><i data-lucide="check-circle-2"></i> Itens Inclusos no Pacote C02</h4>
            <ul class="tb-bullet-list">
              <li><strong>Dados do Projeto:</strong> Código, tipologia, área construída, zoneamento e lote/quadra.</li>
              <li><strong>Dados do Cliente:</strong> Nome, contatos e perfil familiar compilado.</li>
              <li><strong>Programa Espacial:</strong> Setorização e relacionamento de ambientes.</li>
              <li><strong>Fichas Técnicas de Ambientes (${pkg.environments.length}):</strong> Áreas estimadas, necessidades e referências.</li>
              <li><strong>Restrições Críticas (${pkg.restrictions.length}):</strong> Elementos a preservar, vedações e recuos obrigatórios.</li>
              <li><strong>Diretrizes Homologadas (${pkg.approvedDirectives.length}):</strong> Parâmetros aprovados pela coordenação.</li>
              <li><strong>Pendências Abertas (${pkg.pendencies.length}):</strong> Pontos que o levantamento deve esclarecer em campo.</li>
            </ul>
          </div>

          <div class="tb-c02-card">
            <h4><i data-lucide="code"></i> Visualizador do Payload de Integração</h4>
            <pre class="tb-json-preview"><code>${escapeHTML(jsonStr)}</code></pre>
          </div>
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // AUXILIARES VISUAIS E AÇÕES
  // --------------------------------------------------------------------------
  renderSourceBadge(sourceType, sourceId, sourceVersion) {
    const badges = {
      'CLIENTE': { label: 'CLIENTE', cls: 'source-cliente', icon: 'user' },
      'ARQVERTICE': { label: 'ARQVERTICE', cls: 'source-arqvertice', icon: 'compass' },
      'ARQUIVO': { label: 'ARQUIVO', cls: 'source-arquivo', icon: 'file' },
      'REFERENCIA': { label: 'REFERÊNCIA', cls: 'source-referencia', icon: 'image' },
      'LEVANTAMENTO': { label: 'LEVANTAMENTO', cls: 'source-levantamento', icon: 'map-pin' },
      'MODELO_REVIT': { label: 'REVIT / BIM', cls: 'source-revit', icon: 'box' },
      'DECISAO': { label: 'DECISÃO', cls: 'source-decisao', icon: 'check-square' },
      'IA_SUGESTAO': { label: 'IA — SUGESTÃO', cls: 'source-ia', icon: 'bot' },
      'OUTRO': { label: 'OUTRO', cls: 'source-outro', icon: 'tag' }
    };

    const b = badges[sourceType] || badges['ARQVERTICE'];
    const titleAttr = sourceId ? `Origem: ${sourceType} (Ref: ${sourceId} v${sourceVersion || '1'})` : `Origem: ${sourceType}`;

    return `
      <span class="badge-source ${b.cls}" title="${titleAttr}">
        <i data-lucide="${b.icon}"></i>
        <span>${b.label}</span>
      </span>
    `;
  },

  formatRestrictionCategory(cat) {
    const labels = {
      'PRESERVAR_EXISTENTE': 'A Preservar',
      'INALTERAVEL': 'Inalterável',
      'LIMITACAO_INFORMADA': 'Limitação',
      'PREFERENCIA_NEGATIVA': 'Rejeição',
      'ORCAMENTO': 'Orçamento',
      'PRAZO': 'Prazo',
      'OBRA': 'Canteiro',
      'IMOVEL': 'Imóvel/Legal'
    };
    return labels[cat] || cat;
  },

  switchSubTab(tabKey) {
    this.activeSubTab = tabKey;
    renderProjectWorkspace();
    if (window.lucide) lucide.createIcons();
  },

  setFilterCategory(cat) {
    this.filterCategory = cat;
    renderProjectWorkspace();
    if (window.lucide) lucide.createIcons();
  },

  setMatrixEnvFilter(envId) {
    this.matrixSelectedEnv = envId;
    renderProjectWorkspace();
    if (window.lucide) lucide.createIcons();
  },

  saveSummaryField(projectId, field, value) {
    const tb = StudioState.getTechnicalBrief(projectId);
    if (!tb) return;
    if (!tb.executiveSummary) tb.executiveSummary = {};
    tb.executiveSummary[field] = value;
    tb.updatedAt = new Date().toISOString();
    StudioState.save();
    StudioApp.showToast('Resumo executivo atualizado.');
  },

  saveSectionField(projectId, field, value) {
    const tb = StudioState.getTechnicalBrief(projectId);
    if (!tb) return;
    if (!tb.sections) tb.sections = {};
    tb.sections[field] = value;
    tb.updatedAt = new Date().toISOString();
    StudioState.save();
    StudioApp.showToast('Observações salvas.');
  },

  regenerateExecutiveSummary(projectId) {
    if (!confirm('Deseja regenerar o resumo executivo a partir do briefing do cliente? Isso atualizará os textos com as informações consolidadas.')) return;
    const tb = StudioState.getTechnicalBrief(projectId);
    const cb = StudioState.getProjectBriefing(projectId);
    if (!tb || !cb) return;

    const ans = cb.answers || {};
    tb.executiveSummary = {
      objective: ans.p3_sonho || 'Desenvolvimento arquitetônico alinhado com o cliente.',
      projectType: ans.projeto_tipo || 'Residencial',
      profile: ans.p1_quem || 'Família',
      program: Array.isArray(ans.p8_ambientes) ? ans.p8_ambientes.join(', ') : 'Setor social e íntimo.',
      priorities: 'Integração e conforto térmico.',
      style: Array.isArray(ans.p7_estilos) ? ans.p7_estilos.join(', ') : 'Contemporâneo',
      mainNeeds: Array.isArray(ans.p8_ambientes) ? ans.p8_ambientes : ['Convivência social'],
      restrictions: ans.p7_detesta ? [ans.p7_detesta] : ['Nenhuma rejeição crítica informada.'],
      pendencies: ['Confirmação de sondagem de solo'],
      criticalInfo: 'Maresia e orientação solar prioritárias.',
      isDerived: true,
      lastRegeneratedAt: new Date().toISOString()
    };
    tb.updatedAt = new Date().toISOString();
    StudioState.save();
    StudioApp.showToast('Resumo regenerado com sucesso!');
    renderProjectWorkspace();
  },

  // Modais e Ações de Diretrizes
  openNewDirectiveModal() {
    document.getElementById('tb-dir-id').value = '';
    document.getElementById('tb-dir-title').value = '';
    document.getElementById('tb-dir-desc').value = '';
    document.getElementById('tb-dir-obs').value = '';
    document.getElementById('tb-dir-modal-title').innerText = 'Nova Diretriz Estruturada';
    StudioApp.openModal('modal-tb-directive');
  },

  openEditDirectiveModal(dirId) {
    const project = StudioState.getActiveProject();
    const tb = StudioState.getTechnicalBrief(project.id);
    if (!tb || !tb.directives) return;
    const dir = tb.directives.find(d => d.id === dirId);
    if (!dir) return;

    document.getElementById('tb-dir-id').value = dir.id;
    document.getElementById('tb-dir-title').value = dir.title;
    document.getElementById('tb-dir-desc').value = dir.description;
    document.getElementById('tb-dir-category').value = dir.category;
    document.getElementById('tb-dir-priority').value = dir.priority;
    document.getElementById('tb-dir-source').value = dir.sourceType || 'ARQVERTICE';
    document.getElementById('tb-dir-status').value = dir.status || 'ATIVA';
    document.getElementById('tb-dir-obs').value = dir.observation || '';
    document.getElementById('tb-dir-resp').value = dir.responsible || 'Eduardo Marques';
    document.getElementById('tb-dir-modal-title').innerText = 'Editar Diretriz Estruturada';
    StudioApp.openModal('modal-tb-directive');
  },

  saveDirectiveForm(e, projectId) {
    e.preventDefault();
    const id = document.getElementById('tb-dir-id').value;
    const title = document.getElementById('tb-dir-title').value.trim();
    const desc = document.getElementById('tb-dir-desc').value.trim();
    const cat = document.getElementById('tb-dir-category').value;
    const prio = document.getElementById('tb-dir-priority').value;
    const src = document.getElementById('tb-dir-source').value;
    const stat = document.getElementById('tb-dir-status').value;
    const obs = document.getElementById('tb-dir-obs').value.trim();
    const resp = document.getElementById('tb-dir-resp').value.trim();

    if (id) {
      StudioState.updateDirective(projectId, id, {
        title, description: desc, category: cat, priority: prio,
        sourceType: src, status: stat, observation: obs, responsible: resp
      });
      StudioApp.showToast('Diretriz atualizada!');
    } else {
      StudioState.addDirective(projectId, {
        title, description: desc, category: cat, priority: prio,
        sourceType: src, status: stat, observation: obs, responsible: resp
      });
      StudioApp.showToast('Nova diretriz cadastrada!');
    }

    StudioApp.closeModal('modal-tb-directive');
    renderProjectWorkspace();
  },

  deleteDirective(projectId, dirId) {
    if (!confirm('Deseja excluir esta diretriz técnica?')) return;
    StudioState.deleteDirective(projectId, dirId);
    StudioApp.showToast('Diretriz excluída.');
    renderProjectWorkspace();
  },

  // Modais e Ações de Restrições
  openNewRestrictionModal() {
    StudioApp.openModal('modal-tb-restriction');
  },

  saveRestrictionForm(e, projectId) {
    e.preventDefault();
    const cat = document.getElementById('tb-res-category').value;
    const prio = document.getElementById('tb-res-priority').value;
    const src = document.getElementById('tb-res-source').value;
    const desc = document.getElementById('tb-res-desc').value.trim();
    const obs = document.getElementById('tb-res-obs').value.trim();

    StudioState.addRestriction(projectId, {
      category: cat, priority: prio, sourceType: src,
      description: desc, observation: obs, status: 'ATIVA'
    });

    StudioApp.closeModal('modal-tb-restriction');
    StudioApp.showToast('Restrição registrada com sucesso!');
    renderProjectWorkspace();
  },

  deleteRestriction(projectId, resId) {
    if (!confirm('Deseja remover esta restrição?')) return;
    StudioState.deleteRestriction(projectId, resId);
    StudioApp.showToast('Restrição removida.');
    renderProjectWorkspace();
  },

  // Modais e Ações de Pendências
  openNewPendencyModal() {
    StudioApp.openModal('modal-tb-pendency');
  },

  savePendencyForm(e, projectId) {
    e.preventDefault();
    const desc = document.getElementById('tb-pend-desc').value.trim();
    const prio = document.getElementById('tb-pend-priority').value;
    const stat = document.getElementById('tb-pend-status').value;
    const resp = document.getElementById('tb-pend-resp').value.trim();
    const deadline = document.getElementById('tb-pend-deadline').value;
    const obs = document.getElementById('tb-pend-obs').value.trim();

    StudioState.addPendency(projectId, {
      description: desc, priority: prio, status: stat,
      responsible: resp, deadline, observation: obs
    });

    StudioApp.closeModal('modal-tb-pendency');
    StudioApp.showToast('Pendência registrada!');
    renderProjectWorkspace();
  },

  togglePendencyStatus(projectId, pendId) {
    const tb = StudioState.getTechnicalBrief(projectId);
    if (!tb || !tb.pendencies) return;
    const pend = tb.pendencies.find(p => p.id === pendId);
    if (!pend) return;

    pend.status = pend.status === 'RESOLVIDA' ? 'ABERTA' : 'RESOLVIDA';
    pend.resolvedAt = pend.status === 'RESOLVIDA' ? new Date().toISOString() : null;
    tb.updatedAt = new Date().toISOString();
    StudioState.save();
    StudioApp.showToast(`Pendência ${pend.status === 'RESOLVIDA' ? 'resolvida' : 'reaberta'}!`);
    renderProjectWorkspace();
  },

  deletePendency(projectId, pendId) {
    if (!confirm('Deseja excluir esta pendência?')) return;
    StudioState.deletePendency(projectId, pendId);
    StudioApp.showToast('Pendência excluída.');
    renderProjectWorkspace();
  },

  // Sincronização de Ambientes do Projeto
  syncEnvironmentsFromProject(projectId) {
    const projectEnvs = StudioState.getProjectEnvironments(projectId);
    const tb = StudioState.getTechnicalBrief(projectId);
    if (!tb) return;

    if (!tb.environments) tb.environments = [];
    projectEnvs.forEach(env => {
      const existing = tb.environments.find(e => e.environmentId === env.id || e.name === env.name);
      if (!existing) {
        tb.environments.push({
          id: 'amb-tb-' + env.id,
          environmentId: env.id,
          name: env.name,
          type: env.type || 'SALA',
          areaM2: env.areaM2 || 20.0,
          users: 'Ocupantes',
          function: env.objective || 'Convivência',
          frequency: 'Diária',
          needs: ['Iluminação natural', 'Circulação fluida'],
          style: env.style || 'Contemporâneo',
          desiredMaterials: 'Conforme memorial descritivo',
          rejectedMaterials: 'Materiais de baixa durabilidade',
          furniture: 'Mobiliário ergonômico',
          equipment: 'Instalações completas',
          lighting: 'LED dimerizável',
          references: 'Ver pranchas',
          observations: env.description || '',
          status: 'ESTUDO'
        });
      }
    });

    tb.updatedAt = new Date().toISOString();
    StudioState.save();
    StudioApp.showToast('Ambientes sincronizados com sucesso!');
    renderProjectWorkspace();
  },

  // Aprovação e Snapshots
  openApprovalModal(projectId) {
    const modal = document.getElementById('modal-tb-approval');
    if (modal) modal.classList.add('is-open');
  },

  closeApprovalModal() {
    const modal = document.getElementById('modal-tb-approval');
    if (modal) modal.classList.remove('is-open');
  },

  submitApproval(e, projectId) {
    e.preventDefault();
    const approver = document.getElementById('tb-approver-name').value;
    const notes = document.getElementById('tb-approval-notes').value.trim();

    StudioState.approveTechnicalBrief(projectId, approver, notes);
    this.closeApprovalModal();
    StudioApp.showToast('Briefing Técnico homologado internamente! Snapshot imutável gerado.');
    renderProjectWorkspace();
  },

  viewSnapshotPayload(versionCode) {
    const project = StudioState.getActiveProject();
    const tb = StudioState.getTechnicalBrief(project.id);
    if (!tb || !tb.snapshots) return;
    const snap = tb.snapshots.find(s => s.versionCode === versionCode);
    if (!snap) return;

    alert(`Visualizando Snapshot ${versionCode}:\n\n` + JSON.stringify(snap.payload, null, 2).substring(0, 800) + '...\n(Payload imutável registrado em memória)');
  },

  downloadC02PackageJSON(projectId) {
    const pkg = StudioState.getTechnicalBriefExportForC02(projectId);
    if (!pkg) return;

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(pkg, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `PACOTE_C02_LEVANTAMENTO_${pkg.projectData.name.replace(/\s+/g, '_')}_${pkg.exportMetadata.versionCode}.json`);
    dlAnchor.click();
    StudioApp.showToast('Pacote C02 exportado com sucesso!');
  },

  acceptAISuggestion(projectId, type, suggestionId) {
    if (type === 'conflict') {
      StudioState.addDirective(projectId, {
        title: 'Escalonamento Técnico: Infraestrutura vs Equipamentos de Automação',
        description: 'Implantar tubulação seca completa e quadros cabeados na fase de alvenaria; equipamentos modulares adicionados na etapa de interiores.',
        category: 'TECNOLOGIA',
        priority: 'ALTO',
        sourceType: 'ARQVERTICE',
        status: 'APROVADA',
        observation: 'Sugestão cognitiva da IA convertida formalmente em diretriz técnica da ArqVértice.'
      });
      StudioApp.showToast('Sugestão da IA aceita e convertida em Diretriz ArqVértice!');
      renderProjectWorkspace();
    }
  },

  convertMissingToPendency(projectId, itemName) {
    StudioState.addPendency(projectId, {
      description: `Obter e validar: ${itemName}`,
      priority: 'CRITICO',
      responsible: 'Eduardo Marques (Arquiteto)',
      status: 'ABERTA',
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      observation: 'Identificado como dado ausente na análise preliminar de IA.'
    });
    StudioApp.showToast('Pendência criada a partir de apontamento de IA!');
    renderProjectWorkspace();
  }
};

if (typeof window !== 'undefined') {
  window.TechnicalBriefModule = TechnicalBriefModule;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TechnicalBriefModule;
}
