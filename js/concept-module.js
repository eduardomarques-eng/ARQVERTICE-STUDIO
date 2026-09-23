/**
 * ============================================================================
 * ARQVERTICE STUDIO — MÓDULO DE CONCEITO E DIRETRIZES CONSOLIDADAS (BLOCO C04)
 * Consolidação de Linguagem, Perfis de Estilo, Paleta, Materialidade e Contexto IA
 * ============================================================================
 */

const ConceptModule = {
  activeSubTab: 'conceito', // 'conceito', 'paleta', 'desejado-evitar', 'iluminacao-moveis', 'ambientes', 'ia-context'
  activeEnvironmentId: null,

  // 13 Perfis de Estilo Oficiais do Bloco C04 (Prompt C04 Item 3)
  STYLE_PROFILES: Object.assign(
    [
      { id: 'contemporaneo', name: 'Contemporâneo', desc: 'Linhas puras, tecnologia integrada e fluidez espacial' },
      { id: 'moderno', name: 'Moderno', desc: 'Racionalismo, vãos livres, estrutura aparente e funcionalidade' },
      { id: 'minimalista', name: 'Minimalista', desc: 'Essencialidade, ausência de ornamentos e máxima ordem' },
      { id: 'classico', name: 'Clássico', desc: 'Simetria, molduras, nobreza de proporções e atemporalidade' },
      { id: 'industrial', name: 'Industrial', desc: 'Metais escuros, tijolo, concreto aparente e tubulações visíveis' },
      { id: 'japandi', name: 'Japandi', desc: 'Fusão escandinava e wabi-sabi: madeira clara, calma e simplicidade' },
      { id: 'organico', name: 'Orgânico', desc: 'Curvas suaves, materiais vivos e integração com formas da natureza' },
      { id: 'tropical', name: 'Tropical', desc: 'Ventilação generosa, varandas abertas, madeira e folhagens' },
      { id: 'biofilico', name: 'Biofílico', desc: 'Luz natural abundante, vegetação interna, água e bem-estar sensorial' },
      { id: 'brasileiro_contemporaneo', name: 'Brasileiro Contemporâneo', desc: 'Design autoral nacional, madeiras nobres, brises e frescor praiano' },
      { id: 'sofisticado', name: 'Sofisticado', desc: 'Mármores nobres, iluminação cênica, metais escovados e texturas ricas' },
      { id: 'atemporal', name: 'Atemporal', desc: 'Design neutro que transcende tendências passageiras com solidez' },
      { id: 'personalizado', name: 'Personalizado', desc: 'Linguagem sob medida desenhada especificamente para o cliente' }
    ],
    {
      includes(val) {
        return this.some(p => p.name === val || p.id === val || p === val);
      }
    }
  ),

  /**
   * Renderiza a visão principal de Conceito no Workspace do Projeto
   */
  render(project, client) {
    const concept = StudioState.getDesignConcept(project.id);
    const environments = (StudioState.data.environments || []).filter(e => e.projectId === project.id);
    const approvedStudies = StudioState.getPreliminaryStudies(project.id, { status: 'APPROVED' });

    if (!concept) {
      return this.renderEmptyState(project);
    }

    const statusMap = {
      'APPROVED': { label: 'Conceito Aprovado', cls: 'pill-approved', icon: 'check-circle' },
      'IN_REVIEW': { label: 'Em Revisão', cls: 'pill-review', icon: 'clock' },
      'DRAFT': { label: 'Rascunho', cls: 'pill-draft', icon: 'file-text' },
      'SUPERSEDED': { label: 'Histórico Substituído', cls: 'pill-superseded', icon: 'archive' }
    };
    const stInfo = statusMap[concept.status] || { label: concept.status, cls: 'pill-draft', icon: 'help-circle' };

    return `
      <div class="concept-workspace-wrap concept-module animate-fade-in">
        <!-- TOP BANNER DE GOVERNANÇA CONCEITUAL -->
        <header class="concept-top-banner">
          <div class="ctb-main">
            <div class="ctb-pills-row">
              <span class="ctb-pill-origin"><i data-lucide="sparkles"></i> BLOCO C04 — CONCEITO & DIRETRIZES</span>
              <span class="ctb-pill-version">${concept.version}</span>
              <span class="ctb-pill-status ${stInfo.cls}"><i data-lucide="${stInfo.icon}"></i> ${stInfo.label}</span>
              <span class="ctb-pill-style"><i data-lucide="palette"></i> ${escapeHTML(concept.primaryStyle)}</span>
              ${concept.secondaryStyle ? `<span class="ctb-pill-style-sec">+ ${escapeHTML(concept.secondaryStyle)}</span>` : ''}
              ${approvedStudies.length > 0 ? `
                <span class="ctb-pill-studies" title="${approvedStudies.length} Estudos preliminares homologados integrados"><i data-lucide="compass"></i> ${approvedStudies.length} Estudos Homologados</span>
              ` : ''}
            </div>

            <h1 class="ctb-title">${escapeHTML(concept.name)}</h1>
            <p class="ctb-desc">
              Consolidação formal da linguagem arquitetônica, diretrizes visuais e especificações de atmosfera para <strong>${escapeHTML(project.name)}</strong>. Esta camada alimenta os motores de visualização, moodboards, especificação e renders 3D.
            </p>
          </div>

          <div class="ctb-actions">
            ${concept.status !== 'APPROVED' ? `
              <button class="btn btn-success btn-sm" onclick="ConceptModule.openApproveModal('${project.id}')">
                <i data-lucide="check-circle-2"></i> Aprovar Conceito
              </button>
            ` : `
              <button class="btn btn-outline btn-sm" onclick="ConceptModule.promptNewVersion('${project.id}')" title="Abrir nova versão não-destrutiva preservando V01">
                <i data-lucide="git-branch"></i> Nova Versão (V+1)
              </button>
            `}
            <button class="btn btn-primary btn-sm" onclick="ConceptModule.openEditConceptModal('${project.id}')">
              <i data-lucide="edit-3"></i> Editar Conceito
            </button>
            <button class="btn btn-secondary btn-sm" onclick="ConceptModule.openAiContextModal('${project.id}')">
              <i data-lucide="bot"></i> PROJECT_DESIGN_CONTEXT
            </button>
          </div>
        </header>

        <!-- AVISO DE HIERARQUIA CONCEITUAL -->
        <div class="concept-governance-notice">
          <div class="cgn-icon"><i data-lucide="layers"></i></div>
          <div class="cgn-text">
            <strong>Hierarquia do Sistema de Diretrizes:</strong> As diretrizes gerais do projeto (<code>PROJECT_LEVEL</code>) são herdadas automaticamente por todos os ambientes.
            Quando um ambiente possuir necessidades espaciais particulares, suas regras locais (<code>ENVIRONMENT_LEVEL</code>) sobrepõem as diretrizes mestras conscientemente.
          </div>
        </div>

        <!-- NAVEGAÇÃO INTERNA DO MÓDULO DE CONCEITO -->
        <nav class="concept-subnav-tabs">
          <button class="cst-btn ${this.activeSubTab === 'conceito' ? 'is-active' : ''}" onclick="ConceptModule.switchSubTab('conceito', '${project.id}')">
            <i data-lucide="book-open"></i> Narrativa & Atmosfera
          </button>
          <button class="cst-btn ${this.activeSubTab === 'paleta' ? 'is-active' : ''}" onclick="ConceptModule.switchSubTab('paleta', '${project.id}')">
            <i data-lucide="palette"></i> Paleta & Materiais (${(concept.palette || []).length})
          </button>
          <button class="cst-btn ${this.activeSubTab === 'desejado-evitar' ? 'is-active' : ''}" onclick="ConceptModule.switchSubTab('desejado-evitar', '${project.id}')">
            <i data-lucide="sliders"></i> Desejado × Evitar
          </button>
          <button class="cst-btn ${this.activeSubTab === 'iluminacao-moveis' ? 'is-active' : ''}" onclick="ConceptModule.switchSubTab('iluminacao-moveis', '${project.id}')">
            <i data-lucide="sun"></i> Iluminação & Mobiliário
          </button>
          <button class="cst-btn ${this.activeSubTab === 'ambientes' ? 'is-active' : ''}" onclick="ConceptModule.switchSubTab('ambientes', '${project.id}')">
            <i data-lucide="home"></i> Diretrizes por Ambiente (${environments.length})
          </button>
          <button class="cst-btn ${this.activeSubTab === 'ia-context' ? 'is-active' : ''}" onclick="ConceptModule.switchSubTab('ia-context', '${project.id}')">
            <i data-lucide="cpu"></i> Contexto para IA
          </button>
        </nav>

        <!-- CONTEÚDO DA SUB-ABA ATIVA -->
        <main class="concept-body-content">
          ${this.renderSubTabContent(this.activeSubTab, concept, project, environments)}
        </main>

        <!-- CONTAINER PARA MODAIS DINÂMICOS -->
        <div id="concept-modal-root"></div>
      </div>
    `;
  },

  /**
   * Renderiza a sub-aba ativa
   */
  renderSubTabContent(tab, concept, project, environments) {
    switch (tab) {
      case 'conceito':
        return this.renderNarrativeTab(concept, project);
      case 'paleta':
        return this.renderPaletteAndMaterialsTab(concept, project);
      case 'desejado-evitar':
        return this.renderDesiredAndAvoidTab(concept, project);
      case 'iluminacao-moveis':
        return this.renderLightingAndFurnitureTab(concept, project);
      case 'ambientes':
        return this.renderEnvironmentDirectivesTab(concept, project, environments);
      case 'ia-context':
        return this.renderAiContextTab(concept, project);
      default:
        return this.renderNarrativeTab(concept, project);
    }
  },

  /**
   * Sub-aba 1: Narrativa & Atmosfera
   */
  renderNarrativeTab(concept, project) {
    const keywords = concept.keywords || [];
    const objectives = concept.objectives || [];
    const priorities = concept.priorities || [];
    const restrictions = concept.restrictions || [];

    return `
      <div class="narrative-grid-layout">
        <!-- Coluna Esquerda: Narrativa & Atmosfera -->
        <div class="narrative-left-col">
          <div class="concept-card">
            <div class="cc-head">
              <i data-lucide="pen-tool"></i>
              <h3>Narrativa Arquitetônica & Partido do Projeto</h3>
            </div>
            <p class="narrative-body-text">${escapeHTML(concept.narrative || 'Narrativa ainda não redigida.')}</p>

            ${concept.description ? `
              <div class="narrative-sub-desc">
                <strong>Descrição Síntese:</strong> ${escapeHTML(concept.description)}
              </div>
            ` : ''}
          </div>

          <div class="concept-card">
            <div class="cc-head">
              <i data-lucide="cloud-sun"></i>
              <h3>Atmosfera Sensorial & Espacialidade</h3>
            </div>
            <p class="atmosphere-text">${escapeHTML(concept.atmosphere || 'Atmosfera geral a ser definida.')}</p>
          </div>

          <!-- Palavras-chave -->
          <div class="concept-card">
            <div class="cc-head">
              <i data-lucide="hash"></i>
              <h3>Palavras-Chave Conceituais (Keywords)</h3>
            </div>
            <div class="keywords-badges-wrap">
              ${keywords.map(kw => `
                <span class="kw-badge"><i data-lucide="tag"></i> ${escapeHTML(kw)}</span>
              `).join('')}
              ${keywords.length === 0 ? '<span class="text-xs text-muted">Nenhuma palavra-chave informada</span>' : ''}
            </div>
          </div>
        </div>

        <!-- Coluna Direita: Estilos e Diretrizes Compositivas -->
        <div class="narrative-right-col">
          <div class="concept-card">
            <div class="cc-head">
              <i data-lucide="award"></i>
              <h3>Perfis de Estilo Selecionados</h3>
            </div>
            <div class="style-selection-display">
              <div class="style-box primary-style">
                <span class="sb-label">Estilo Predominante</span>
                <strong class="sb-title">${escapeHTML(concept.primaryStyle)}</strong>
                <p class="sb-desc">${this.getStyleDescription(concept.primaryStyle)}</p>
              </div>

              ${concept.secondaryStyle ? `
                <div class="style-box secondary-style">
                  <span class="sb-label">Estilo Secundário / Complementar</span>
                  <strong class="sb-title">${escapeHTML(concept.secondaryStyle)}</strong>
                  <p class="sb-desc">${this.getStyleDescription(concept.secondaryStyle)}</p>
                </div>
              ` : ''}
            </div>

            <!-- Grade dos 13 Estilos -->
            <h4 class="styles-grid-title">Referência de Linguagem Visual:</h4>
            <div class="styles-pills-list">
              ${this.STYLE_PROFILES.map(st => {
                const isSelected = st.name.toLowerCase() === (concept.primaryStyle || '').toLowerCase() ||
                                   st.name.toLowerCase() === (concept.secondaryStyle || '').toLowerCase();
                return `
                  <span class="style-pill-ref ${isSelected ? 'is-active-style' : ''}" title="${escapeHTML(st.desc)}">
                    ${isSelected ? '<i data-lucide="check"></i>' : ''} ${st.name}
                  </span>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Metas, Prioridades e Restrições -->
          <div class="concept-card">
            <div class="cc-head">
              <i data-lucide="target"></i>
              <h3>Metas & Prioridades do Conceito</h3>
            </div>
            <div class="triad-lists">
              <div class="triad-block">
                <label class="text-success"><i data-lucide="check-circle"></i> Objetivos Primordiais:</label>
                <ul>
                  ${objectives.map(o => `<li>${escapeHTML(o)}</li>`).join('')}
                </ul>
              </div>
              <div class="triad-block">
                <label class="text-accent"><i data-lucide="flag"></i> Prioridades:</label>
                <ul>
                  ${priorities.map(p => `<li>${escapeHTML(p)}</li>`).join('')}
                </ul>
              </div>
              <div class="triad-block">
                <label class="text-danger"><i data-lucide="alert-octagon"></i> Restrições Inegociáveis:</label>
                <ul>
                  ${restrictions.map(r => `<li>${escapeHTML(r)}</li>`).join('')}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Sub-aba 2: Paleta & Materiais
   */
  renderPaletteAndMaterialsTab(concept, project) {
    const palette = concept.palette || [];
    const materials = concept.materials || [];

    const roleMap = {
      'PREDOMINANTE': { label: 'Predominante (60%)', cls: 'role-predominant' },
      'ACENTO': { label: 'Acento (20%)', cls: 'role-accent' },
      'NEUTRO': { label: 'Neutro (15%)', cls: 'role-neutral' },
      'CONTRASTE': { label: 'Contraste (5%)', cls: 'role-contrast' }
    };

    return `
      <div class="palette-materials-wrap">
        <!-- SEÇÃO: PALETA CROMÁTICA ESTRUTURADA (Prompt C04 Item 5) -->
        <div class="section-card">
          <div class="sec-card-head">
            <div class="sch-left">
              <i data-lucide="droplet"></i>
              <div>
                <h3>Paleta Cromática do Projeto</h3>
                <p class="text-xs text-secondary">Cores homologadas, códigos de catálogo comercial, funções de composição e materiais relacionados.</p>
              </div>
            </div>
            <button class="btn btn-outline btn-sm" onclick="ConceptModule.openAddColorModal('${project.id}')">
              <i data-lucide="plus"></i> Adicionar Cor
            </button>
          </div>

          <div class="palette-swatches-grid">
            ${palette.map(col => {
              const rInfo = roleMap[col.role] || { label: col.role, cls: 'role-neutral' };
              return `
                <div class="color-swatch-card">
                  <div class="csc-color-sample" style="background-color: ${col.hex};">
                    <span class="csc-hex">${col.hex}</span>
                  </div>
                  <div class="csc-details">
                    <div class="csc-name-row">
                      <strong class="csc-name">${escapeHTML(col.name)}</strong>
                      <span class="csc-role-badge ${rInfo.cls}">${rInfo.label}</span>
                    </div>
                    ${col.code ? `<span class="csc-code"><i data-lucide="hash"></i> ${escapeHTML(col.code)}</span>` : ''}
                    ${col.relatedMaterial ? `
                      <p class="csc-material"><i data-lucide="layers"></i> <em>${escapeHTML(col.relatedMaterial)}</em></p>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- SEÇÃO: INTENÇÕES DE MATERIALIDADE (Prompt C04 Item 6 - Sem quantitativos) -->
        <div class="section-card">
          <div class="sec-card-head">
            <div class="sch-left">
              <i data-lucide="layers"></i>
              <div>
                <h3>Intenções de Materialidade por Superfície</h3>
                <p class="text-xs text-secondary">Definição qualitativa de pisos, paredes, bancadas, marcenarias e metais sem quantitativos antecipados.</p>
              </div>
            </div>
            <button class="btn btn-outline btn-sm" onclick="ConceptModule.openAddMaterialModal('${project.id}')">
              <i data-lucide="plus"></i> Adicionar Superfície
            </button>
          </div>

          <div class="materials-surface-table-wrap">
            <table class="materials-table">
              <thead>
                <tr>
                  <th>Superfície</th>
                  <th>Material Intencionado</th>
                  <th>Acabamento / Textura</th>
                  <th>Observações Técnicas</th>
                </tr>
              </thead>
              <tbody>
                ${materials.map(m => `
                  <tr>
                    <td><span class="surface-badge">${escapeHTML(m.surface)}</span></td>
                    <td><strong>${escapeHTML(m.material)}</strong></td>
                    <td>${escapeHTML(m.finish || 'Padrão')}</td>
                    <td class="text-secondary text-xs">${escapeHTML(m.notes || '-')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Sub-aba 3: Desejado × Evitar (Prompt C04 Item 4)
   */
  renderDesiredAndAvoidTab(concept, project) {
    const desired = concept.desiredElements || [];
    const avoid = concept.avoidElements || [];

    return `
      <div class="desired-avoid-section">
        <div class="da-banner-info">
          <i data-lucide="info"></i>
          <div>
            <strong>Diretriz de Visualização & Renders:</strong>
            As listas abaixo serão utilizadas diretamente pelos módulos de <strong>Renders, Moodboards e Visualização</strong> para alimentar parâmetros de geração e impedir o surgimento de vícios ou elementos rejeitados pelo cliente.
          </div>
        </div>

        <div class="desired-avoid-grid">
          <!-- Coluna ELEMENTOS DESEJADOS -->
          <div class="da-column desired-col">
            <div class="dac-head">
              <div class="dach-title">
                <i data-lucide="check-circle-2"></i>
                <h3>Elementos Desejados (${desired.length})</h3>
              </div>
              <button class="btn btn-xs btn-outline" onclick="ConceptModule.openPreferenceModal('${project.id}', 'DESIRED')">
                <i data-lucide="plus"></i> Adicionar
              </button>
            </div>

            <div class="da-items-list">
              ${desired.map(d => `
                <div class="da-card is-desired">
                  <div class="dac-top">
                    <span class="da-cat-badge">${escapeHTML(d.category || 'MATERIAL')}</span>
                    <strong class="da-name">${escapeHTML(d.name)}</strong>
                  </div>
                  ${d.rationale ? `<p class="da-rationale">${escapeHTML(d.rationale)}</p>` : ''}
                </div>
              `).join('')}
              ${desired.length === 0 ? '<p class="text-xs text-muted p-3">Nenhum elemento desejado cadastrado.</p>' : ''}
            </div>
          </div>

          <!-- Coluna ELEMENTOS A EVITAR -->
          <div class="da-column avoid-col">
            <div class="dac-head">
              <div class="dach-title">
                <i data-lucide="alert-triangle"></i>
                <h3>Elementos a Evitar (${avoid.length})</h3>
              </div>
              <button class="btn btn-xs btn-outline" onclick="ConceptModule.openPreferenceModal('${project.id}', 'AVOID')">
                <i data-lucide="plus"></i> Adicionar
              </button>
            </div>

            <div class="da-items-list">
              ${avoid.map(a => `
                <div class="da-card is-avoid">
                  <div class="dac-top">
                    <span class="da-cat-badge badge-avoid">${escapeHTML(a.category || 'GERAL')}</span>
                    <strong class="da-name">${escapeHTML(a.name)}</strong>
                  </div>
                  ${a.rationale ? `<p class="da-rationale">${escapeHTML(a.rationale)}</p>` : ''}
                </div>
              `).join('')}
              ${avoid.length === 0 ? '<p class="text-xs text-muted p-3">Nenhum elemento a evitar cadastrado.</p>' : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Sub-aba 4: Iluminação & Mobiliário (Prompt C04 Itens 7 e 8)
   */
  renderLightingAndFurnitureTab(concept, project) {
    const l = (concept.directives && concept.directives.lighting) || {};
    const f = (concept.directives && concept.directives.furniture) || {};

    return `
      <div class="lighting-furniture-grid">
        <!-- Bloco de Iluminação -->
        <div class="section-card">
          <div class="sec-card-head">
            <div class="sch-left">
              <i data-lucide="sun"></i>
              <div>
                <h3>Intenções de Iluminação do Conceito</h3>
                <p class="text-xs text-secondary">Cenários lumínicos, temperatura de cor e atmosfera luminosa (sem projeto luminotécnico técnico).</p>
              </div>
            </div>
            <span class="temp-color-pill"><i data-lucide="thermometer"></i> ${escapeHTML(l.colorTemperature || '2700K')}</span>
          </div>

          <div class="lighting-categories-stack">
            <div class="lc-row">
              <span class="lc-type"><i data-lucide="sun-dim"></i> Luz Natural:</span>
              <span class="lc-desc">${escapeHTML(l.natural || 'Aproveitamento de iluminação natural difusa')}</span>
            </div>
            <div class="lc-row">
              <span class="lc-type"><i data-lucide="circle-dot"></i> Luz Geral:</span>
              <span class="lc-desc">${escapeHTML(l.general || 'Embutidos no-frame de alta reprodução cromática')}</span>
            </div>
            <div class="lc-row">
              <span class="lc-type"><i data-lucide="minus"></i> Luz Indireta:</span>
              <span class="lc-desc">${escapeHTML(l.indirect || 'Sancas invertidas e fitas LED em rodapés')}</span>
            </div>
            <div class="lc-row">
              <span class="lc-type"><i data-lucide="crosshair"></i> Luz Pontual / Foco:</span>
              <span class="lc-desc">${escapeHTML(l.focal || 'Foco em obras de arte e marcenarias nobres')}</span>
            </div>
            <div class="lc-row">
              <span class="lc-type"><i data-lucide="sparkle"></i> Cênica & Externa:</span>
              <span class="lc-desc">${escapeHTML(l.scenic || 'Iluminação subaquática e balizadores')}</span>
            </div>
            <div class="lc-row">
              <span class="lc-type"><i data-lucide="lamp"></i> Decorativa:</span>
              <span class="lc-desc">${escapeHTML(l.decorative || 'Pendentes esculturais de fibra natural')}</span>
            </div>
          </div>
        </div>

        <!-- Bloco de Mobiliário -->
        <div class="section-card">
          <div class="sec-card-head">
            <div class="sch-left">
              <i data-lucide="armchair"></i>
              <div>
                <h3>Classificação de Mobiliário do Conceito</h3>
                <p class="text-xs text-secondary">Categorização das peças antes da biblioteca completa de móveis.</p>
              </div>
            </div>
          </div>

          <div class="furniture-category-boxes">
            <div class="fc-box mandatory-box">
              <div class="fcb-title text-success"><i data-lucide="check-square"></i> Obrigatório:</div>
              <ul>
                ${(f.mandatory || []).map(m => `<li>${escapeHTML(m)}</li>`).join('')}
                {!(f.mandatory && f.mandatory.length) ? '<li>Nenhum item marcado como obrigatório</li>' : ''}
              </ul>
            </div>

            <div class="fc-box desired-box">
              <div class="fcb-title text-accent"><i data-lucide="heart"></i> Desejado:</div>
              <ul>
                ${(f.desired || []).map(d => `<li>${escapeHTML(d)}</li>`).join('')}
                {!(f.desired && f.desired.length) ? '<li>Nenhum item marcado como desejado</li>' : ''}
              </ul>
            </div>

            <div class="fc-box prohibited-box">
              <div class="fcb-title text-danger"><i data-lucide="ban"></i> Proibido / Vetado:</div>
              <ul>
                ${(f.prohibited || []).map(p => `<li>${escapeHTML(p)}</li>`).join('')}
                {!(f.prohibited && f.prohibited.length) ? '<li>Nenhum item proibido</li>' : ''}
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Sub-aba 5: Diretrizes por Ambiente (Prompt C04 Itens 9 e 10)
   */
  renderEnvironmentDirectivesTab(concept, project, environments) {
    const envDirectives = concept.environmentDirectives || [];

    return `
      <div class="environment-directives-section">
        <div class="ed-header-expl">
          <i data-lucide="info"></i>
          <div>
            <strong>Regra de Precedência (Item 9 & 10):</strong>
            O conceito geral (<code>PROJECT_LEVEL</code>) define a base estética para toda a obra.
            Caso um ambiente receba diretrizes conscientemente sobrepostas (<code>ENVIRONMENT_LEVEL</code>), tais regras locais passam a ter prioridade na renderização daquele espaço.
          </div>
        </div>

        <div class="environments-directives-cards-grid">
          ${environments.map(env => {
            const dir = envDirectives.find(ed => ed.environmentId === env.id);
            const hasOverrides = dir && (dir.atmosphereOverride || dir.materialOverrides || dir.lightingOverrides || dir.furnitureOverrides);

            return `
              <div class="env-directive-card ${hasOverrides ? 'has-overrides' : 'is-inherited'}">
                <div class="edc-header">
                  <div class="edc-title-group">
                    <h4>${escapeHTML(env.name)}</h4>
                    <span class="edc-hierarchy-badge ${hasOverrides ? 'badge-env-level' : 'badge-proj-level'}">
                      <i data-lucide="${hasOverrides ? 'sliders' : 'copy'}"></i>
                      ${hasOverrides ? 'ENVIRONMENT_LEVEL (Sobreposto)' : 'PROJECT_LEVEL (Herdado)'}
                    </span>
                  </div>
                  <button class="btn btn-xs btn-outline" onclick="ConceptModule.openEnvDirectiveModal('${project.id}', '${env.id}')">
                    <i data-lucide="edit-2"></i> Configurar
                  </button>
                </div>

                <div class="edc-body">
                  <div class="edc-field">
                    <label>Atmosfera do Ambiente:</label>
                    <p class="text-xs ${dir && dir.atmosphereOverride ? 'text-primary' : 'text-muted'}">
                      ${dir && dir.atmosphereOverride ? escapeHTML(dir.atmosphereOverride) : `Herdada: "${escapeHTML(concept.atmosphere)}"`}
                    </p>
                  </div>

                  ${dir && dir.materialOverrides && Object.keys(dir.materialOverrides).length > 0 ? `
                    <div class="edc-field">
                      <label class="text-accent">Materiais Específicos do Ambiente:</label>
                      <ul class="edc-overrides-list">
                        ${Object.entries(dir.materialOverrides).map(([surf, mat]) => `
                          <li><strong>${escapeHTML(surf)}:</strong> ${escapeHTML(mat)}</li>
                        `).join('')}
                      </ul>
                    </div>
                  ` : ''}

                  ${dir && dir.specificNotes ? `
                    <div class="edc-field">
                      <label>Observações Específicas:</label>
                      <p class="text-xs text-secondary">${escapeHTML(dir.specificNotes)}</p>
                    </div>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  /**
   * Sub-aba 6: Contexto para IA (Prompt C04 Itens 11 e 12)
   */
  renderAiContextTab(concept, project) {
    const aiContext = StudioState.buildProjectDesignContext(project.id);
    const jsonStr = JSON.stringify(aiContext, null, 2);

    return `
      <div class="ai-context-workspace">
        <div class="ai-context-banner">
          <i data-lucide="sparkles"></i>
          <div>
            <strong>PROJECT_DESIGN_CONTEXT Estruturado para IA & Visualização:</strong>
            O objeto canônico abaixo unifica o conceito geral, perfis de estilo, paletas de cores, matriz "Desejado × Evitar", intenções de iluminação, estudos preliminares aprovados (C03) e referências de base (C02).
            <strong>O texto narrativo original da ArqVértice é rigorosamente preservado.</strong>
          </div>
        </div>

        <div class="ai-context-actions-bar">
          <button class="btn btn-outline btn-sm" onclick="ConceptModule.copyContextJSON()">
            <i data-lucide="copy"></i> Copiar JSON do Contexto
          </button>
          <button class="btn btn-secondary btn-sm" onclick="ConceptModule.exportContextJSON('${project.id}')">
            <i data-lucide="download"></i> Exportar Payload
          </button>
        </div>

        <pre class="json-code-box" id="concept-json-viewer">${escapeHTML(jsonStr)}</pre>
      </div>
    `;
  },

  /**
   * Renderiza tela vazia se ainda não houver conceito
   */
  renderEmptyState(project) {
    return `
      <div class="empty-concept-container animate-fade-in">
        <i data-lucide="sparkles" class="empty-icon"></i>
        <h2>Conceito do Projeto Ainda Não Definido</h2>
        <p>Consolide a linguagem arquitetônica, estilo, paleta e diretrizes para o projeto <strong>${escapeHTML(project.name)}</strong>.</p>
        <button class="btn btn-primary" onclick="ConceptModule.openEditConceptModal('${project.id}')">
          <i data-lucide="plus"></i> Criar Conceito do Projeto
        </button>
      </div>
    `;
  },

  /**
   * Auxiliar para retornar a descrição do estilo
   */
  getStyleDescription(styleName) {
    if (!styleName) return '';
    const match = this.STYLE_PROFILES.find(s => s.name.toLowerCase() === styleName.toLowerCase());
    return match ? match.desc : 'Linguagem autoral da ArqVértice';
  },

  /**
   * Altera sub-aba
   */
  switchSubTab(tabName, projectId) {
    this.activeSubTab = tabName;
    this.refreshUI(projectId);
  },

  /**
   * Modal para Aprovar Conceito
   */
  openApproveModal(projectId) {
    const concept = StudioState.getDesignConcept(projectId);
    if (!concept) return;

    const root = document.getElementById('concept-modal-root');
    if (!root) return;

    root.innerHTML = `
      <div class="modal-backdrop animate-fade-in" onclick="ConceptModule.closeModal(event)">
        <div class="modal-dialog modal-md" onclick="event.stopPropagation()">
          <div class="modal-header">
            <div class="mh-left">
              <span class="mh-pill pill-success"><i data-lucide="check-circle-2"></i> Homologação Oficial</span>
              <h2>Aprovar Conceito: ${escapeHTML(concept.name)}</h2>
            </div>
            <button class="modal-close-btn" onclick="ConceptModule.closeModal()">&times;</button>
          </div>

          <div class="modal-body">
            <p class="text-sm text-secondary">
              A aprovação do conceito congela a versão <strong>${concept.version}</strong> como oficial.
              Apenas conceitos com status <strong>APPROVED</strong> são elegíveis para orientar futuras gerações de renders, salvo quando o usuário selecionar explicitamente uma versão em estudo.
            </p>

            <div class="form-group mt-3">
              <label>Arquiteto Homologador *</label>
              <input type="text" id="cpt-appr-by" class="form-input" value="Eduardo Marques (Arquiteto Titular)" required />
            </div>

            <div class="form-group mt-3">
              <label>Notas de Aprovação *</label>
              <textarea id="cpt-appr-notes" class="form-textarea" rows="3" required placeholder="Justifique os critérios conceituais alinhados com o briefing e cliente...">Conceito validado e liberado para motores de render e apresentações visuais.</textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-outline" onclick="ConceptModule.closeModal()">Cancelar</button>
            <button type="button" class="btn btn-success" onclick="ConceptModule.handleApproveConcept('${projectId}')">
              <i data-lucide="check"></i> Confirmar Aprovação (APPROVED)
            </button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  handleApproveConcept(projectId) {
    const approver = document.getElementById('cpt-appr-by').value;
    const notes = document.getElementById('cpt-appr-notes').value;

    const res = StudioState.approveDesignConcept(projectId, approver, notes);
    if (res.success) {
      this.closeModal();
      this.refreshUI(projectId);
      alert('Conceito aprovado como versão oficial com sucesso!');
    } else {
      alert('Erro ao aprovar: ' + res.error);
    }
  },

  /**
   * Prompt de Nova Versão Não-Destrutiva (Prompt C04 Item 13)
   */
  promptNewVersion(projectId) {
    const concept = StudioState.getDesignConcept(projectId);
    if (!concept) return;

    if (confirm(`Deseja criar uma nova versão para o conceito "${concept.name}"?\n\nA versão atual (${concept.version}) será preservada como SUPERSEDED e a nova versão (V02) entrará em status IN_REVIEW.`)) {
      const reason = prompt('Motivo da revisão conceitual:', 'Ajustes na paleta de cores e atmosfera conforme alinhamento com cliente');
      if (reason) {
        const res = StudioState.createConceptNewVersion(projectId, reason);
        if (res.success) {
          this.refreshUI(projectId);
          alert(`Nova versão ${res.newConcept.version} criada com sucesso!`);
        } else {
          alert('Erro ao criar nova versão: ' + res.error);
        }
      }
    }
  },

  /**
   * Modal de Edição Geral do Conceito
   */
  openEditConceptModal(projectId) {
    const concept = StudioState.getDesignConcept(projectId) || {};
    const root = document.getElementById('concept-modal-root');
    if (!root) return;

    root.innerHTML = `
      <div class="modal-backdrop animate-fade-in" onclick="ConceptModule.closeModal(event)">
        <div class="modal-dialog modal-lg" onclick="event.stopPropagation()">
          <div class="modal-header">
            <div class="mh-left">
              <span class="mh-pill"><i data-lucide="sparkles"></i> Conceito Geral</span>
              <h2>Editar Diretrizes Conceituais</h2>
            </div>
            <button class="modal-close-btn" onclick="ConceptModule.closeModal()">&times;</button>
          </div>

          <form onsubmit="ConceptModule.handleSaveConcept(event, '${projectId}')">
            <div class="modal-body">
              <div class="form-group mb-3">
                <label>Nome do Conceito / Partido *</label>
                <input type="text" id="cpt-name" class="form-input" required value="${escapeHTML(concept.name || '')}" placeholder="Ex: Refúgio Litorâneo Contemporâneo" />
              </div>

              <div class="form-grid-2 mb-3">
                <div class="form-group">
                  <label>Estilo Primário *</label>
                  <select id="cpt-style-pri" class="form-select" required>
                    ${this.STYLE_PROFILES.map(st => `
                      <option value="${st.name}" ${st.name === concept.primaryStyle ? 'selected' : ''}>${st.name}</option>
                    `).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label>Estilo Secundário (Opcional)</label>
                  <select id="cpt-style-sec" class="form-select">
                    <option value="">-- Nenhum --</option>
                    ${this.STYLE_PROFILES.map(st => `
                      <option value="${st.name}" ${st.name === concept.secondaryStyle ? 'selected' : ''}>${st.name}</option>
                    `).join('')}
                  </select>
                </div>
              </div>

              <div class="form-group mb-3">
                <label>Narrativa Arquitetônica Completa *</label>
                <textarea id="cpt-narrative" class="form-textarea" rows="4" required placeholder="Texto autoral que descreve a gênese do projeto, inspirações, sensações e materiais...">${escapeHTML(concept.narrative || '')}</textarea>
              </div>

              <div class="form-group mb-3">
                <label>Atmosfera Sensorial Esperada *</label>
                <input type="text" id="cpt-atmosphere" class="form-input" required value="${escapeHTML(concept.atmosphere || '')}" placeholder="Ex: Serenidade praiana, acolhimento biofílico e amplitude contínua" />
              </div>

              <div class="form-group mb-3">
                <label>Palavras-Chave / Keywords (separadas por vírgula)</label>
                <input type="text" id="cpt-keywords" class="form-input" value="${(concept.keywords || []).join(', ')}" placeholder="Ventilação Cruzada, Pedra Hijau, Travertino Navona" />
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-outline" onclick="ConceptModule.closeModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary"><i data-lucide="save"></i> Salvar Conceito</button>
            </div>
          </form>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  handleSaveConcept(e, projectId) {
    e.preventDefault();
    const name = document.getElementById('cpt-name').value.trim();
    const primaryStyle = document.getElementById('cpt-style-pri').value;
    const secondaryStyle = document.getElementById('cpt-style-sec').value || null;
    const narrative = document.getElementById('cpt-narrative').value.trim();
    const atmosphere = document.getElementById('cpt-atmosphere').value.trim();
    const keywords = document.getElementById('cpt-keywords').value
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);

    const res = StudioState.saveDesignConcept(projectId, {
      name,
      primaryStyle,
      secondaryStyle,
      narrative,
      atmosphere,
      keywords
    });

    if (res.success) {
      this.closeModal();
      this.refreshUI(projectId);
    } else {
      alert('Erro ao salvar: ' + res.error);
    }
  },

  /**
   * Modal para Adicionar Cor na Paleta
   */
  openAddColorModal(projectId) {
    const root = document.getElementById('concept-modal-root');
    if (!root) return;

    root.innerHTML = `
      <div class="modal-backdrop animate-fade-in" onclick="ConceptModule.closeModal(event)">
        <div class="modal-dialog modal-md" onclick="event.stopPropagation()">
          <div class="modal-header">
            <div class="mh-left">
              <span class="mh-pill"><i data-lucide="droplet"></i> Paleta Cromática</span>
              <h2>Adicionar Cor à Paleta</h2>
            </div>
            <button class="modal-close-btn" onclick="ConceptModule.closeModal()">&times;</button>
          </div>

          <form onsubmit="ConceptModule.handleSaveColor(event, '${projectId}')">
            <div class="modal-body">
              <div class="form-grid-2 mb-3">
                <div class="form-group">
                  <label>Cor (Seletor ou Hex) *</label>
                  <input type="color" id="col-hex-picker" class="form-color-picker" value="#F4F1EA" onchange="document.getElementById('col-hex').value = this.value" />
                  <input type="text" id="col-hex" class="form-input mt-1" value="#F4F1EA" required onchange="document.getElementById('col-hex-picker').value = this.value" />
                </div>
                <div class="form-group">
                  <label>Nome da Cor *</label>
                  <input type="text" id="col-name" class="form-input" required placeholder="Ex: Areia Natural" />
                </div>
              </div>

              <div class="form-grid-2 mb-3">
                <div class="form-group">
                  <label>Função Composicional *</label>
                  <select id="col-role" class="form-select" required>
                    <option value="PREDOMINANTE">Predominante (60%)</option>
                    <option value="ACENTO">Acento (20%)</option>
                    <option value="NEUTRO">Neutro (15%)</option>
                    <option value="CONTRASTE">Contraste (5%)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Código Comercial / Pantone</label>
                  <input type="text" id="col-code" class="form-input" placeholder="Ex: SW 7566 ou Pantone 18-5612" />
                </div>
              </div>

              <div class="form-group">
                <label>Material Relacionado</label>
                <input type="text" id="col-mat" class="form-input" placeholder="Ex: Mármore Travertino Navona / Alvenaria clara" />
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-outline" onclick="ConceptModule.closeModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary"><i data-lucide="plus"></i> Adicionar Cor</button>
            </div>
          </form>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  handleSaveColor(e, projectId) {
    e.preventDefault();
    const hex = document.getElementById('col-hex').value.trim();
    const name = document.getElementById('col-name').value.trim();
    const role = document.getElementById('col-role').value;
    const code = document.getElementById('col-code').value.trim();
    const relatedMaterial = document.getElementById('col-mat').value.trim();

    const concept = StudioState.getDesignConcept(projectId);
    if (!concept) return;

    if (!concept.palette) concept.palette = [];
    concept.palette.push({
      id: 'pal-' + Date.now().toString(36),
      hex,
      name,
      role,
      code,
      relatedMaterial
    });

    StudioState.save();
    this.closeModal();
    this.refreshUI(projectId);
  },

  /**
   * Modal para Configurar Diretrizes Específicas do Ambiente (Prompt C04 Itens 9 e 10)
   */
  openEnvDirectiveModal(projectId, environmentId) {
    const concept = StudioState.getDesignConcept(projectId);
    if (!concept) return;

    const env = (StudioState.data.environments || []).find(e => e.id === environmentId);
    if (!env) return;

    const dir = (concept.environmentDirectives || []).find(ed => ed.environmentId === environmentId) || {};
    const root = document.getElementById('concept-modal-root');
    if (!root) return;

    root.innerHTML = `
      <div class="modal-backdrop animate-fade-in" onclick="ConceptModule.closeModal(event)">
        <div class="modal-dialog modal-md" onclick="event.stopPropagation()">
          <div class="modal-header">
            <div class="mh-left">
              <span class="mh-pill"><i data-lucide="home"></i> Diretrizes do Ambiente</span>
              <h2>${escapeHTML(env.name)}</h2>
            </div>
            <button class="modal-close-btn" onclick="ConceptModule.closeModal()">&times;</button>
          </div>

          <form onsubmit="ConceptModule.handleSaveEnvDirectives(event, '${projectId}', '${environmentId}')">
            <div class="modal-body">
              <div class="form-check mb-3">
                <input type="checkbox" id="env-inherits" class="form-check-input" ${dir.inheritsProjectConcept !== false ? 'checked' : ''} />
                <label for="env-inherits" class="form-check-label">
                  Herda diretrizes gerais do projeto (<code>PROJECT_LEVEL</code>) como base
                </label>
              </div>

              <div class="form-group mb-3">
                <label>Sobreposição de Atmosfera (Opcional)</label>
                <input type="text" id="env-atmo-override" class="form-input" value="${escapeHTML(dir.atmosphereOverride || '')}" placeholder="Ex: Refúgio de descanso íntimo e privacidade" />
                <span class="text-xs text-secondary">Deixe em branco para herdar: "${escapeHTML(concept.atmosphere)}"</span>
              </div>

              <div class="form-group mb-3">
                <label>Piso Específico do Ambiente</label>
                <input type="text" id="env-piso-override" class="form-input" value="${escapeHTML((dir.materialOverrides && dir.materialOverrides.PISO) || '')}" placeholder="Ex: Madeira maciça tauari" />
              </div>

              <div class="form-group mb-3">
                <label>Paredes / Revestimento Específico</label>
                <input type="text" id="env-parede-override" class="form-input" value="${escapeHTML((dir.materialOverrides && dir.materialOverrides.PAREDE) || '')}" placeholder="Ex: Painel ripado em cumaru" />
              </div>

              <div class="form-group mb-3">
                <label>Observações Técnicas Específicas do Ambiente</label>
                <textarea id="env-notes" class="form-textarea" rows="2" placeholder="Requisitos particulares deste cômodo...">${escapeHTML(dir.specificNotes || '')}</textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-outline" onclick="ConceptModule.closeModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary"><i data-lucide="save"></i> Gravar Diretrizes Locais</button>
            </div>
          </form>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  handleSaveEnvDirectives(e, projectId, environmentId) {
    e.preventDefault();
    const inherits = document.getElementById('env-inherits').checked;
    const atmosphereOverride = document.getElementById('env-atmo-override').value.trim() || null;
    const piso = document.getElementById('env-piso-override').value.trim();
    const parede = document.getElementById('env-parede-override').value.trim();
    const specificNotes = document.getElementById('env-notes').value.trim();

    const materialOverrides = {};
    if (piso) materialOverrides.PISO = piso;
    if (parede) materialOverrides.PAREDE = parede;

    const res = StudioState.updateEnvironmentDirectives(projectId, environmentId, {
      inheritsProjectConcept: inherits,
      atmosphereOverride,
      materialOverrides,
      specificNotes
    });

    if (res.success) {
      this.closeModal();
      this.refreshUI(projectId);
    } else {
      alert('Erro ao atualizar diretrizes do ambiente: ' + res.error);
    }
  },

  /**
   * Modal para Adicionar Elemento Desejado ou a Evitar
   */
  openPreferenceModal(projectId, type) {
    const isDesired = type === 'DESIRED';
    const root = document.getElementById('concept-modal-root');
    if (!root) return;

    root.innerHTML = `
      <div class="modal-backdrop animate-fade-in" onclick="ConceptModule.closeModal(event)">
        <div class="modal-dialog modal-md" onclick="event.stopPropagation()">
          <div class="modal-header">
            <div class="mh-left">
              <span class="mh-pill ${isDesired ? 'pill-success' : 'pill-danger'}">
                <i data-lucide="${isDesired ? 'check-circle-2' : 'alert-triangle'}"></i>
                ${isDesired ? 'Elemento Desejado' : 'Elemento a Evitar'}
              </span>
              <h2>${isDesired ? 'Adicionar Diretriz Positiva' : 'Adicionar Restrição / Vetado'}</h2>
            </div>
            <button class="modal-close-btn" onclick="ConceptModule.closeModal()">&times;</button>
          </div>

          <form onsubmit="ConceptModule.handleSavePreference(event, '${projectId}', '${type}')">
            <div class="modal-body">
              <div class="form-group mb-3">
                <label>Nome do Elemento / Característica *</label>
                <input type="text" id="pref-name" class="form-input" required placeholder="${isDesired ? 'Ex: Madeira Natural Cumaru' : 'Ex: Brilho Excessivo / Espelhado'}" />
              </div>

              <div class="form-group mb-3">
                <label>Categoria *</label>
                <select id="pref-cat" class="form-select" required>
                  <option value="MATERIAL">MATERIAL</option>
                  <option value="FORMA">FORMA / LINHAS</option>
                  <option value="COR">COR</option>
                  <option value="ILUMINACAO">ILUMINAÇÃO</option>
                  <option value="MOBILIARIO">MOBILIÁRIO</option>
                  <option value="OUTRO">OUTRO</option>
                </select>
              </div>

              <div class="form-group">
                <label>Justificativa Arquitetônica *</label>
                <textarea id="pref-rat" class="form-textarea" rows="2" required placeholder="${isDesired ? 'Por que este elemento deve ser priorizado...' : 'Por que este elemento deve ser evitado...'}" ></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-outline" onclick="ConceptModule.closeModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary"><i data-lucide="plus"></i> Gravar</button>
            </div>
          </form>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  handleSavePreference(e, projectId, type) {
    e.preventDefault();
    const name = document.getElementById('pref-name').value.trim();
    const category = document.getElementById('pref-cat').value;
    const rationale = document.getElementById('pref-rat').value.trim();

    const concept = StudioState.getDesignConcept(projectId);
    if (!concept) return;

    const listKey = type === 'DESIRED' ? 'desiredElements' : 'avoidElements';
    if (!concept[listKey]) concept[listKey] = [];

    concept[listKey].push({
      id: (type === 'DESIRED' ? 'des-' : 'avd-') + Date.now().toString(36),
      name,
      category,
      rationale
    });

    StudioState.save();
    this.closeModal();
    this.refreshUI(projectId);
  },

  /**
   * Modal Exibidor do PROJECT_DESIGN_CONTEXT (IA Engine)
   */
  openAiContextModal(projectId) {
    const aiContext = StudioState.buildProjectDesignContext(projectId);
    const jsonStr = JSON.stringify(aiContext, null, 2);

    const root = document.getElementById('concept-modal-root');
    if (!root) return;

    root.innerHTML = `
      <div class="modal-backdrop animate-fade-in" onclick="ConceptModule.closeModal(event)">
        <div class="modal-dialog modal-lg" onclick="event.stopPropagation()">
          <div class="modal-header">
            <div class="mh-left">
              <span class="mh-pill"><i data-lucide="cpu"></i> PROJECT_DESIGN_CONTEXT</span>
              <h2>Payload Canônico para Inteligência Artificial</h2>
            </div>
            <button class="modal-close-btn" onclick="ConceptModule.closeModal()">&times;</button>
          </div>

          <div class="modal-body">
            <p class="text-xs text-secondary mb-2">
              Estrutura normalizada que une o conceito, 13 perfis de estilo, paleta, diretrizes de iluminação e estudos aprovados para renderizadores e prompts automáticos.
            </p>
            <pre class="json-code-box">${escapeHTML(jsonStr)}</pre>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-outline" onclick="ConceptModule.copyContextJSON()">
              <i data-lucide="copy"></i> Copiar JSON
            </button>
            <button type="button" class="btn btn-secondary" onclick="ConceptModule.closeModal()">
              Fechar
            </button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  copyContextJSON() {
    const viewer = document.getElementById('concept-json-viewer');
    const text = viewer ? viewer.innerText : '';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => alert('JSON copiado com sucesso!'));
    } else {
      alert('Texto pronto no console.');
    }
  },

  exportContextJSON(projectId) {
    const aiContext = StudioState.buildProjectDesignContext(projectId);
    const blob = new Blob([JSON.stringify(aiContext, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PROJECT_DESIGN_CONTEXT_${projectId}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  closeModal(e) {
    if (e && e.target !== e.currentTarget) return;
    const root = document.getElementById('concept-modal-root');
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
  window.ConceptModule = ConceptModule;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConceptModule;
}
