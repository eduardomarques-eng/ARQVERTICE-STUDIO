/**
 * ============================================================================
 * ARQVERTICE STUDIO — BLOCO F01: MOTOR CENTRAL DE APRESENTAÇÃO
 * Transforma dados do projeto, briefing, ambientes, plantas humanizadas,
 * perspectivas, materiais, móveis, quantitativos e memórias em uma apresentação
 * arquitetônica profissional, organizada, consistente e com rigor de integridade.
 * ============================================================================
 */

const PresentationEngineModule = (function () {
  'use strict';

  let activePresentationId = null;
  let activePageId = null;
  let currentPreviewMode = 'edicao'; // 'edicao' | 'apresentacao' | 'tela_cheia' | 'impressao' | 'exportacao'
  let isTrashView = false;
  let autosaveTimer = null;
  let autosaveStatus = 'saved'; // 'saving' | 'saved' | 'error'

  /**
   * Ponto de entrada principal renderizado na aba "Apresentação" do Workspace do Projeto
   */
  function renderProjectPresentation(project) {
    if (!project) {
      return `<div class="p-4 text-muted">Selecione um projeto válido para acessar o Motor de Apresentação.</div>`;
    }

    const presentations = StudioState.getProjectPresentations(project.id);

    // Se não houver apresentação cadastrada, exibir tela de boas-vindas com geração automática
    if (!presentations || presentations.length === 0) {
      return renderEmptyPresentationState(project);
    }

    // Seleciona apresentação ativa
    let current = null;
    if (activePresentationId) {
      current = presentations.find(p => p.id === activePresentationId);
    }
    if (!current) {
      current = presentations[0];
      activePresentationId = current.id;
    }

    // Seleciona página ativa
    const pages = isTrashView ? current.deletedPages : current.pages;
    let activePage = null;
    if (activePageId) {
      activePage = pages.find(p => p.id === activePageId);
    }
    if (!activePage && pages.length > 0) {
      activePage = pages[0];
      activePageId = activePage.id;
    }

    return `
      <div class="presentation-engine-container animate-fade-in mode-${currentPreviewMode}" id="presentation-engine-root">
        ${renderTopControlBar(current, presentations, project)}
        
        ${currentPreviewMode === 'apresentacao' 
          ? renderPresentationSlideMode(current, activePage, project)
          : currentPreviewMode === 'exportacao'
          ? renderExportPreviewMode(current, project)
          : renderThreePanelWorkspace(current, activePage, project, pages)}

        ${renderModals(current, project)}
      </div>
    `;
  }

  /**
   * Renderiza barra de controles superior (TOPO)
   */
  function renderTopControlBar(presentation, allPresentations, project) {
    const isApproved = presentation.status === StudioState.PRESENTATION_STATUSES.APPROVED;
    const statusLabel = StudioState.PRESENTATION_STATUS_LABELS[presentation.status] || presentation.status;
    let statusBadgeClass = 'badge-draft';
    if (presentation.status === 'aprovado') statusBadgeClass = 'badge-approved';
    else if (presentation.status === 'em_revisao') statusBadgeClass = 'badge-review';
    else if (presentation.status === 'arquivado') statusBadgeClass = 'badge-archived';

    return `
      <header class="pres-topbar">
        <div class="pres-topbar-left">
          <div class="pres-brand-title">
            <i data-lucide="presentation"></i>
            <div>
              <div class="pres-meta-title">${escapeHTML(presentation.title)}</div>
              <div class="pres-meta-sub">${escapeHTML(project.name)} &bull; ${presentation.sheetFormat || 'A3'} ${presentation.orientation === 'portrait' ? 'Vertical' : 'Horizontal'}</div>
            </div>
          </div>

          <!-- Seletor de Apresentação -->
          <div class="pres-selector-group">
            <select class="form-select form-select-sm pres-select" onchange="PresentationEngineModule.setActivePresentation(this.value)">
              ${allPresentations.map(p => `
                <option value="${p.id}" ${p.id === presentation.id ? 'selected' : ''}>
                  ${escapeHTML(p.title)} (${p.revision || 'R00'}) — ${StudioState.PRESENTATION_STATUS_LABELS[p.status] || p.status}
                </option>
              `).join('')}
            </select>
            <button class="btn btn-ghost btn-sm" title="Criar Nova Apresentação" onclick="PresentationEngineModule.openCreateModal('${project.id}')">
              <i data-lucide="plus"></i>
            </button>
          </div>

          <!-- Badges de Revisão e Status -->
          <div class="pres-badges-group">
            <span class="pres-rev-badge" title="Número da Revisão">${presentation.revision || 'R00'}</span>
            <span class="pres-status-pill ${statusBadgeClass}">${statusLabel}</span>
          </div>
        </div>

        <div class="pres-topbar-center">
          <!-- Modos de Preview -->
          <div class="pres-preview-tabs">
            <button class="pres-preview-btn ${currentPreviewMode === 'edicao' ? 'is-active' : ''}" onclick="PresentationEngineModule.setPreviewMode('edicao')" title="Modo de Edição com 3 Painéis">
              <i data-lucide="edit-3"></i> <span>Edição</span>
            </button>
            <button class="pres-preview-btn ${currentPreviewMode === 'apresentacao' ? 'is-active' : ''}" onclick="PresentationEngineModule.setPreviewMode('apresentacao')" title="Modo Apresentação para Cliente">
              <i data-lucide="play"></i> <span>Apresentar</span>
            </button>
            <button class="pres-preview-btn ${currentPreviewMode === 'tela_cheia' ? 'is-active' : ''}" onclick="PresentationEngineModule.toggleFullscreen()" title="Projeção em Tela Cheia">
              <i data-lucide="maximize"></i> <span>Tela Cheia</span>
            </button>
            <button class="pres-preview-btn ${currentPreviewMode === 'impressao' ? 'is-active' : ''}" onclick="PresentationEngineModule.triggerPrint()" title="Visualização para Impressão de Prancha">
              <i data-lucide="printer"></i> <span>Imprimir</span>
            </button>
            <button class="pres-preview-btn ${currentPreviewMode === 'exportacao' ? 'is-active' : ''}" onclick="PresentationEngineModule.setPreviewMode('exportacao')" title="Inspeção Pré-Entrega">
              <i data-lucide="check-circle-2"></i> <span>Entrega</span>
            </button>
            <button class="pres-preview-btn" onclick="StudioApp.setProjectTab('pranchas')" title="Motor de Pranchas (Diagramação Técnica)">
              <i data-lucide="layout"></i> <span>Pranchas</span>
            </button>
            <button class="pres-preview-btn" onclick="StudioApp.openProject('${presentation.projectId}', 'cronograma')" title="Ver Cronograma Integrado do Projeto">
              <i data-lucide="calendar"></i> <span>Ver cronograma</span>
            </button>
          </div>
        </div>

        <div class="pres-topbar-right">
          <!-- Indicador de Autosave Dinâmico -->
          <div class="pres-autosave-indicator pres-autosave-${autosaveStatus}" id="pres-autosave-badge" title="Indicador em tempo real">
            ${autosaveStatus === 'saving' 
              ? '<i data-lucide="loader-2" class="spin"></i> <span>Salvando...</span>'
              : autosaveStatus === 'error'
              ? '<i data-lucide="alert-triangle"></i> <span>Erro ao salvar</span>'
              : '<i data-lucide="check-check"></i> <span>Salvo</span>'}
          </div>

          <!-- Botão Recuperação da Última Versão Salva -->
          <button class="btn btn-outline btn-sm" onclick="PresentationEngineModule.openRecoveryModal('${presentation.id}')" title="Recuperar última versão salva caso necessário">
            <i data-lucide="rotate-ccw"></i> <span>Recuperar</span>
          </button>

          <!-- Ações de Aprovação ou Nova Revisão -->
          ${isApproved ? `
            <button class="btn btn-warning btn-sm" onclick="PresentationEngineModule.openRevisionModal('${presentation.id}')" title="Apresentação aprovada: gere uma nova revisão formal para editar">
              <i data-lucide="git-branch"></i> <span>Nova Revisão</span>
            </button>
          ` : `
            <button class="btn btn-success btn-sm" onclick="PresentationEngineModule.openApproveModal('${presentation.id}')" title="Homologar apresentação">
              <i data-lucide="check"></i> <span>Aprovar</span>
            </button>
          `}

          <button class="btn btn-primary btn-sm" onclick="PresentationEngineModule.triggerSaveNow('${presentation.id}')">
            <i data-lucide="save"></i> <span>Salvar</span>
          </button>
        </div>
      </header>
    `;
  }

  /**
   * Layout Completo em 3 Painéis (Esquerdo: Árvore/Miniaturas | Central: Canvas Prancha | Direito: Inspetor)
   */
  function renderThreePanelWorkspace(presentation, activePage, project, pages) {
    return `
      <div class="pres-three-panel-body">
        <!-- PAINEL ESQUERDO: ESTRUTURA DA APRESENTAÇÃO -->
        <aside class="pres-left-panel">
          <div class="pres-panel-header">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h4 class="pres-panel-title">
                <i data-lucide="layers"></i> Estrutura da Apresentação
              </h4>
              <span class="pres-counter-badge">${pages.length} pranchas</span>
            </div>
            
            <div class="pres-structure-tabs">
              <button class="btn btn-xs ${!isTrashView ? 'btn-secondary' : 'btn-ghost'}" onclick="PresentationEngineModule.toggleTrashView(false)">
                <i data-lucide="layout-grid"></i> Pranchas Ativas (${presentation.pages.length})
              </button>
              <button class="btn btn-xs ${isTrashView ? 'btn-secondary' : 'btn-ghost'}" onclick="PresentationEngineModule.toggleTrashView(true)">
                <i data-lucide="trash-2"></i> Lixeira (${presentation.deletedPages.length})
              </button>
            </div>
          </div>

          <div class="pres-pages-scroll-list" id="pres-pages-list">
            ${pages.length === 0 ? `
              <div class="pres-empty-list">
                <i data-lucide="folder-open"></i>
                <p>${isTrashView ? 'A lixeira está vazia.' : 'Nenhuma prancha ativa encontrada.'}</p>
              </div>
            ` : pages.map((p, idx) => {
              const isSelected = activePage && activePage.id === p.id;
              const isPageApproved = p.status === 'aprovado';
              const isDraft = p.status === 'rascunho';
              let badgePill = isPageApproved ? 'badge-approved' : (isDraft ? 'badge-draft' : 'badge-review');

              return `
                <div class="pres-page-item ${isSelected ? 'is-selected' : ''} ${p.isHidden ? 'is-hidden-page' : ''}" 
                     onclick="PresentationEngineModule.setActivePage('${p.id}')">
                  <div class="pres-page-item-thumb">
                    <span class="pres-page-idx">${String(idx + 1).padStart(2, '0')}</span>
                    <div class="pres-mini-paper">
                      <div class="pres-mini-bar"></div>
                      <div class="pres-mini-lines"></div>
                    </div>
                  </div>

                  <div class="pres-page-item-info">
                    <div class="pres-page-item-title">
                      ${p.isHidden ? '<i data-lucide="eye-off" class="icon-inline" title="Oculta"></i>' : ''}
                      ${escapeHTML(p.title)}
                    </div>
                    <div class="pres-page-item-sub">
                      <span>${StudioState.PRESENTATION_SECTION_LABELS[p.sectionType] || p.sectionType}</span>
                      <span class="pres-status-mini-dot ${badgePill}"></span>
                    </div>
                  </div>

                  <div class="pres-page-item-actions" onclick="event.stopPropagation()">
                    ${!isTrashView ? `
                      <button class="btn-icon-xs" title="Mover para Cima" onclick="PresentationEngineModule.reorderPages('${presentation.id}', '${p.id}', 'up')">
                        <i data-lucide="chevron-up"></i>
                      </button>
                      <button class="btn-icon-xs" title="Mover para Baixo" onclick="PresentationEngineModule.reorderPages('${presentation.id}', '${p.id}', 'down')">
                        <i data-lucide="chevron-down"></i>
                      </button>
                      <button class="btn-icon-xs" title="${p.isHidden ? 'Exibir Prancha' : 'Ocultar Prancha'}" onclick="PresentationEngineModule.toggleHidePage('${p.id}', ${!p.isHidden})">
                        <i data-lucide="${p.isHidden ? 'eye' : 'eye-off'}"></i>
                      </button>
                      <button class="btn-icon-xs" title="Duplicar Prancha" onclick="PresentationEngineModule.duplicatePage('${p.id}')">
                        <i data-lucide="copy"></i>
                      </button>
                      <button class="btn-icon-xs text-danger" title="Excluir Prancha" onclick="PresentationEngineModule.deletePage('${p.id}')">
                        <i data-lucide="trash-2"></i>
                      </button>
                    ` : `
                      <button class="btn btn-xs btn-outline-success" title="Restaurar Prancha" onclick="PresentationEngineModule.restorePage('${p.id}')">
                        <i data-lucide="rotate-ccw"></i> Restaurar
                      </button>
                    `}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          ${!isTrashView ? `
            <div class="pres-panel-footer">
              <button class="btn btn-outline btn-sm w-100" onclick="PresentationEngineModule.openAddPageModal('${presentation.id}')">
                <i data-lucide="plus"></i> Adicionar Prancha
              </button>
            </div>
          ` : ''}
        </aside>

        <!-- ÁREA CENTRAL: VISUALIZAÇÃO DA PRANCHA / PÁGINA (CANVAS COM CARIMBO ARQVERTICE) -->
        <main class="pres-center-canvas">
          ${renderSheetCanvas(presentation, activePage || {
            id: 'default-cover',
            sectionType: 'capa',
            title: presentation.title,
            subtitle: presentation.subtitle || 'Apresentação Geral',
            order: 0,
            status: presentation.status,
            content: {
              title: presentation.title,
              subtitle: presentation.subtitle,
              heroImage: project.coverImage || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
              clientName: presentation.client ? presentation.client.name : 'Cliente Titular'
            }
          }, project)}
        </main>

        <!-- PAINEL DIREITO: PROPRIEDADES DO ELEMENTO SELECIONADO (INSPETOR) -->
        <aside class="pres-right-panel">
          ${renderPropertyInspector(presentation, activePage || {
            id: 'default-cover',
            sectionType: 'capa',
            title: presentation.title,
            subtitle: presentation.subtitle,
            order: 0,
            status: presentation.status,
            notes: presentation.notes || ''
          }, project)}
        </aside>
      </div>
    `;
  }

  /**
   * Renderiza a prancha diagramada em formato arquitetônico A3/A4 com carimbo ArqVértice
   */
  function renderSheetCanvas(presentation, page, project) {
    const isApproved = presentation.status === 'aprovado';
    const stamp = presentation.stamp || {};
    const dateFormatted = presentation.date || new Date().toISOString().split('T')[0];
    const client = presentation.client || { name: 'Cliente Titular' };

    return `
      <div class="pres-canvas-container" id="printable-sheet">
        <div class="sheet-paper format-${presentation.sheetFormat || 'A3'} orientation-${presentation.orientation || 'landscape'}">
          <!-- CABEÇALHO SUTIL DA PRANCHA -->
          <div class="sheet-header">
            <div class="sheet-project-tag">
              <strong>${escapeHTML(project.name)}</strong>
              <span>&bull; ${escapeHTML(project.typology || 'Arquitetura e Interiores')}</span>
            </div>
            <div class="sheet-stamp-top">
              <span class="sheet-code">${escapeHTML(stamp.projectCode || project.code || 'PRJ')}</span>
              <span class="sheet-rev">${escapeHTML(presentation.revision || 'R00')}</span>
            </div>
          </div>

          <!-- CONTEÚDO DINÂMICO ESPECÍFICO DA SEÇÃO -->
          <div class="sheet-content-body">
            ${renderSectionContent(page, presentation, project)}
          </div>

          <!-- CARIMBO ARQUITETÔNICO OFICIAL ARQVÉRTICE STUDIO -->
          <footer class="sheet-stamp-box">
            <div class="stamp-col stamp-brand">
              <div class="stamp-brand-logo">
                <img src="logo.png" alt="ArqVértice" class="stamp-logo-img" onerror="this.style.display='none'">
                <div class="stamp-brand-text">
                  <h3>ARQVÉRTICE</h3>
                  <span>STUDIO</span>
                </div>
              </div>
              <div class="stamp-legal">Arquitetura de Alto Padrão</div>
            </div>

            <div class="stamp-col stamp-project-info">
              <div class="stamp-row">
                <span class="stamp-lbl">PROJETO:</span>
                <span class="stamp-val">${escapeHTML(project.name)}</span>
              </div>
              <div class="stamp-row">
                <span class="stamp-lbl">CLIENTE:</span>
                <span class="stamp-val">${escapeHTML(client.name)}</span>
              </div>
              <div class="stamp-row">
                <span class="stamp-lbl">LOCAL:</span>
                <span class="stamp-val">${escapeHTML(project.location || 'Brasil')}</span>
              </div>
            </div>

            <div class="stamp-col stamp-sheet-details">
              <div class="stamp-row">
                <span class="stamp-lbl">PRANCHA / CONTEÚDO:</span>
                <strong class="stamp-val highlight">${escapeHTML(page.title)}</strong>
              </div>
              <div class="stamp-row">
                <span class="stamp-lbl">SUBTÍTULO:</span>
                <span class="stamp-val">${escapeHTML(page.subtitle || '-')}</span>
              </div>
              <div class="stamp-row">
                <span class="stamp-lbl">ETAPA:</span>
                <span class="stamp-val">${StudioState.PRESENTATION_TYPE_LABELS[presentation.presentationType] || 'Apresentação'}</span>
              </div>
            </div>

            <div class="stamp-col stamp-metadata">
              <div class="stamp-grid-meta">
                <div>
                  <span class="stamp-lbl">DATA:</span>
                  <span class="stamp-val">${formatDateBR(dateFormatted)}</span>
                </div>
                <div>
                  <span class="stamp-lbl">REVISÃO:</span>
                  <span class="stamp-val rev-pill">${escapeHTML(presentation.revision || 'R00')}</span>
                </div>
                <div>
                  <span class="stamp-lbl">ESCALA:</span>
                  <span class="stamp-val">${escapeHTML(presentation.scale || 'Indicada')}</span>
                </div>
                <div>
                  <span class="stamp-lbl">FORMATO:</span>
                  <span class="stamp-val">${escapeHTML(presentation.sheetFormat || 'A3')}</span>
                </div>
              </div>
              <div class="stamp-row mt-1">
                <span class="stamp-lbl">RESP. TÉCNICO:</span>
                <span class="stamp-val">${escapeHTML(presentation.author || 'Erick Santiago')}</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    `;
  }

  /**
   * Renderiza o conteúdo dinâmico de cada uma das 14 seções lógicas da apresentação
   */
  function renderSectionContent(page, presentation, project) {
    const content = page.content || {};
    const section = page.sectionType;

    switch (section) {
      case 'capa':
        return `
          <div class="sheet-view-cover">
            <div class="cover-hero-img-box" style="background-image: url('${content.heroImage || project.coverImage || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'}');">
              <div class="cover-hero-overlay">
                <div class="cover-hero-badge">ARQVÉRTICE STUDIO &bull; APRESENTAÇÃO ARQUITETÔNICA</div>
                <h1 class="cover-title">${escapeHTML(content.title || project.name)}</h1>
                <h3 class="cover-subtitle">${escapeHTML(content.subtitle || project.location || '')}</h3>
                <div class="cover-client-tag">
                  <span>CONTRATANTE:</span> <strong>${escapeHTML(content.clientName || (presentation.client ? presentation.client.name : 'Pedro Albuquerque'))}</strong>
                </div>
              </div>
            </div>
          </div>
        `;

      case 'informacoes':
        return `
          <div class="sheet-view-info">
            <div class="sheet-section-title">
              <h2><i data-lucide="info"></i> Ficha Cadastral & Quadro de Parâmetros Técnicos</h2>
              <p>Resumo executivo do terreno, dados urbanísticos, volumetria e prazos.</p>
            </div>
            <div class="info-quadro-grid">
              <div class="info-card">
                <span class="info-lbl"><i data-lucide="map-pin"></i> Localização & Terreno</span>
                <strong class="info-val">${escapeHTML(content.location || project.location || '-')}</strong>
                <p class="text-muted">Área do Lote: ${project.landAreaM2 || content.landAreaM2 || '-'} m²</p>
              </div>
              <div class="info-card">
                <span class="info-lbl"><i data-lucide="home"></i> Tipologia Arquitetônica</span>
                <strong class="info-val">${escapeHTML(content.typology || project.typology || '-')}</strong>
                <p class="text-muted">Área Construída: ${project.builtAreaM2 || content.builtAreaM2 || '-'} m²</p>
              </div>
              <div class="info-card">
                <span class="info-lbl"><i data-lucide="compass"></i> Zoneamento & Parâmetros</span>
                <strong class="info-val">${escapeHTML(content.zoning || project.zoning || 'ZR-1')}</strong>
                <p class="text-muted">Taxa de Ocupação e Recuos Municipais Homologados</p>
              </div>
              <div class="info-card">
                <span class="info-lbl"><i data-lucide="calendar"></i> Prazo & Cronograma</span>
                <strong class="info-val">${escapeHTML(content.deadline || `${project.startDate || '-'} a ${project.expectedEndDate || '-'}`)}</strong>
                <p class="text-muted">Controle de Fases e Marcos Técnicos</p>
              </div>
            </div>
          </div>
        `;

      case 'briefing':
        return `
          <div class="sheet-view-briefing">
            <div class="sheet-section-title">
              <h2><i data-lucide="file-check"></i> Diretrizes do Briefing Aprovado</h2>
              <p>Aspirações do cliente, programa de necessidades e restrições formais homologadas.</p>
            </div>
            <div class="briefing-box">
              <div class="briefing-summary-card">
                <h4>Resumo das Expectativas do Contratante</h4>
                <p class="briefing-quote">"${escapeHTML(content.summary || 'Integração de sala, cozinha e varanda para receber amigos; materiais nobres e práticos para maresia.')}"</p>
              </div>
              <div class="briefing-priorities-card mt-3">
                <h4>Prioridades Definidas</h4>
                <ul class="pres-bullet-list">
                  ${(content.priorities || ['Ventilação cruzada e luz natural', 'Mármore travertino contínuo', 'Marcenaria sob medida']).map(p => `
                    <li><i data-lucide="check-circle" class="icon-inline text-success"></i> ${escapeHTML(p)}</li>
                  `).join('')}
                </ul>
              </div>
            </div>
          </div>
        `;

      case 'conceito':
        const palette = content.palette || ['#1A365D', '#C5A880', '#F4F1EA', '#2D3748'];
        return `
          <div class="sheet-view-concept">
            <div class="sheet-section-title">
              <h2><i data-lucide="sparkles"></i> Partido Arquitetônico & Diretrizes de Conceito</h2>
              <p>Linguagem estética, sensações espaciais e paleta de cores norteadora.</p>
            </div>
            <div class="concept-banner">
              <h3>${escapeHTML(content.theme || 'Minimalismo Tropical & Biofilia')}</h3>
              <p>Busca pela luz natural, ventilação cruzada contínua e conexão afetiva com o entorno paisagístico.</p>
            </div>
            <div class="concept-row mt-4">
              <div class="concept-keywords-box">
                <h4>Palavras-Chave do Projeto</h4>
                <div class="keywords-tags">
                  ${(content.keywords || ['Fluidez', 'Luz Natural', 'Madeira & Pedra', 'Maresia']).map(k => `
                    <span class="keyword-pill">${escapeHTML(k)}</span>
                  `).join('')}
                </div>
              </div>
              <div class="concept-palette-box">
                <h4>Paleta Cromática Conceitual</h4>
                <div class="palette-swatches">
                  ${palette.map(hex => `
                    <div class="swatch-item">
                      <div class="swatch-color" style="background-color: ${hex};"></div>
                      <span class="swatch-hex">${hex}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        `;

      case 'estudos':
        return `
          <div class="sheet-view-studies">
            <div class="sheet-section-title">
              <h2><i data-lucide="boxes"></i> Estudos Volumétricos & Croquis Preliminares</h2>
              <p>Alternativas de implantação, estudos de insolação e decisões volumétricas validadas.</p>
            </div>
            <div class="studies-approved-box">
              <div class="studies-tag"><i data-lucide="check"></i> Opção Volumétrica Homologada</div>
              <h3>${escapeHTML(content.approvedOption || 'Estudo Volumétrico 02 — Pátio Central e Cobertura Inclinada')}</h3>
              <p>${escapeHTML(content.notes || 'Estudo aprovado pelo cliente com preservação dos ventos dominantes leste-nordeste e ampliação da área sombreada.')}</p>
            </div>
          </div>
        `;

      case 'ambientes':
        return `
          <div class="sheet-view-environments">
            <div class="sheet-section-title">
              <h2><i data-lucide="layout"></i> Setorização de Ambientes & Distribuição Espacial</h2>
              <p>Detalhamento dimensional e relações funcionais entre os compartimentos do projeto.</p>
            </div>
            <div class="env-detail-grid">
              <div class="env-detail-card highlight-card">
                <h3>${escapeHTML(content.environmentName || 'Living Integrado (Estar & Jantar)')}</h3>
                <div class="env-specs">
                  <span>Área: <strong>${content.areaM2 || 55.40} m²</strong></span>
                  <span>Pé-direito: <strong>${content.ceilingHeightM || 3.20} m</strong></span>
                </div>
                <p class="mt-2">${escapeHTML(content.description || 'Espaço fluido com vista para o jardim interno e integração total com a varanda e cozinha gourmet.')}</p>
              </div>
            </div>
          </div>
        `;

      case 'materiais':
        const materialsList = content.materials || [
          { name: 'Mármore Travertino Navona Levigado', application: 'Piso Geral Living', supplier: 'Marmoraria Granitos do Ceará' },
          { name: 'Ripado Madeira Cumaru Natural', application: 'Painel Tv e Hall', supplier: 'Madereira Tropical' },
          { name: 'Tinta Acrílica Fosca Branco Neve', application: 'Alvenarias Gerais', supplier: 'Tintas Coral' }
        ];
        return `
          <div class="sheet-view-materials">
            <div class="sheet-section-title">
              <h2><i data-lucide="package"></i> Especificação de Materiais & Revestimentos</h2>
              <p>Materiais homologados, fornecedores consultados e acabamentos técnicos.</p>
            </div>
            <table class="pres-tech-table">
              <thead>
                <tr>
                  <th>Material / Produto</th>
                  <th>Aplicação</th>
                  <th>Fornecedor Homologado</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${materialsList.map(m => `
                  <tr>
                    <td><strong>${escapeHTML(m.name)}</strong></td>
                    <td>${escapeHTML(m.application || '-')}</td>
                    <td>${escapeHTML(m.supplier || '-')}</td>
                    <td><span class="badge-approved-mini">Aprovado</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;

      case 'mobiliario':
        const furnitureList = content.furniture || [
          { name: 'Sofá Living 3 Lugares com Chaise', manufacturer: 'Acervo Cliente', finish: 'Linho Natural Bege' },
          { name: 'Mesa de Jantar 8 Lugares Orgânica', manufacturer: 'Breton', finish: 'Madeira Maciça Freijó' },
          { name: 'Poltrona Jangada', manufacturer: 'Jean Gillon Reedição', finish: 'Jacarandá e Couro' }
        ];
        return `
          <div class="sheet-view-furniture">
            <div class="sheet-section-title">
              <h2><i data-lucide="armchair"></i> Curadoria de Mobiliário & Marcenaria</h2>
              <p>Seleção de mobiliário solto assinado e marcenaria sob medida homologada.</p>
            </div>
            <div class="furniture-catalog-grid">
              ${furnitureList.map(f => `
                <div class="furniture-card">
                  <h4>${escapeHTML(f.name)}</h4>
                  <div class="furniture-meta">
                    <div>Fabricante: <strong>${escapeHTML(f.manufacturer || '-')}</strong></div>
                    <div>Acabamento: <strong>${escapeHTML(f.finish || '-')}</strong></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;

      case 'quantitativos':
        const qtyItems = content.items || [
          { item: 'Mármore Travertino Navona', quantity: '121.00 m²', status: 'Calculado (10% perda)' },
          { item: 'Painel Ripado Cumaru', quantity: '32.50 m²', status: 'Medido em Planta' },
          { item: 'Pintura Acrílica Interna', quantity: '480.00 m²', status: 'Estimado' }
        ];
        return `
          <div class="sheet-view-quantities">
            <div class="sheet-section-title">
              <h2><i data-lucide="calculator"></i> Quantitativos & Estimativas de Obra</h2>
              <p>Quadro analítico consolidado com margens técnicas e rastreabilidade de dados.</p>
            </div>
            <table class="pres-tech-table">
              <thead>
                <tr>
                  <th>Item / Material</th>
                  <th>Quantidade Total</th>
                  <th>Origem / Rastreabilidade</th>
                  <th>Confiança</th>
                </tr>
              </thead>
              <tbody>
                ${qtyItems.map(q => `
                  <tr>
                    <td><strong>${escapeHTML(q.item)}</strong></td>
                    <td>${escapeHTML(q.quantity)}</td>
                    <td>${escapeHTML(q.status || q.confidence || 'Confirmado')}</td>
                    <td><span class="badge-approved-mini">Auditado</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;

      case 'moodboards':
        return `
          <div class="sheet-view-moodboards">
            <div class="sheet-section-title">
              <h2><i data-lucide="palette"></i> Moodboard & Atmosfera Tátil</h2>
              <p>Composição de sensações, texturas minerais, tecidos e iluminação cênica.</p>
            </div>
            <div class="moodboard-composite-box">
              <h3>${escapeHTML(content.moodboardTitle || 'Atmosfera Litorânea Contemporânea')}</h3>
              <p class="text-muted">${escapeHTML(content.theme || 'Equilíbrio térmico e sensação de acolhimento permanente.')}</p>
              <div class="textures-tag-list mt-3">
                ${(content.textures || ['Linho cru', 'Mármore fosco', 'Cumaru ripado', 'Latão escovado']).map(t => `
                  <span class="texture-pill"><i data-lucide="feather" class="icon-inline"></i> ${escapeHTML(t)}</span>
                `).join('')}
              </div>
            </div>
          </div>
        `;

      case 'plantas':
        return `
          <div class="sheet-view-plans">
            <div class="sheet-section-title">
              <h2><i data-lucide="map"></i> Plantas Humanizadas & Layout Arquitetônico</h2>
              <p>Representação em escala para visualização de circulações e disposição dos ambientes.</p>
            </div>
            <div class="plan-display-frame">
              <img src="${content.imageUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'}" 
                   alt="Planta Humanizada" class="plan-img">
              <div class="plan-caption">
                <strong>${escapeHTML(content.planTitle || 'Planta Humanizada do Pavimento Térreo')}</strong> &bull; Escala ${content.scale || '1:50'}
              </div>
            </div>
          </div>
        `;

      case 'perspectivas':
        const renders = content.renders || [
          { title: 'Vista Ampla do Living e Varanda', framing: 'Amplo Geral', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80' },
          { title: 'Enquadramento da Sala de Jantar', framing: 'Plano Médio', url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80' }
        ];
        return `
          <div class="sheet-view-perspectives">
            <div class="sheet-section-title">
              <h2><i data-lucide="camera"></i> Perspectivas 3D & Imagens Fotorrealistas</h2>
              <p>Enquadramentos canônicos de câmera com iluminação e materiais renderizados.</p>
            </div>
            <div class="renders-showcase-grid">
              ${renders.map(r => `
                <div class="render-showcase-card">
                  <img src="${r.url}" alt="${escapeHTML(r.title)}" class="render-thumb-img">
                  <div class="render-info-bar">
                    <strong>${escapeHTML(r.title)}</strong>
                    <span class="framing-tag">${escapeHTML(r.framing || 'Enquadramento')}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;

      case 'revisoes':
        const revisionsList = content.revisions || [
          { rev: 'R00', date: '22/09/2026', author: 'Erick Santiago', description: 'Emissão inicial consolidada para apresentação geral.' }
        ];
        return `
          <div class="sheet-view-revisions">
            <div class="sheet-section-title">
              <h2><i data-lucide="git-commit"></i> Histórico & Rastreabilidade de Revisões</h2>
              <p>Registro rigoroso de modificações, autorias e integridade das versões emitidas.</p>
            </div>
            <table class="pres-tech-table">
              <thead>
                <tr>
                  <th>Revisão</th>
                  <th>Data</th>
                  <th>Responsável Técnico</th>
                  <th>Descrição da Emissão</th>
                </tr>
              </thead>
              <tbody>
                ${revisionsList.map(r => `
                  <tr>
                    <td><span class="pres-rev-badge">${escapeHTML(r.rev)}</span></td>
                    <td>${escapeHTML(r.date)}</td>
                    <td>${escapeHTML(r.author)}</td>
                    <td>${escapeHTML(r.description)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;

      case 'entrega':
        const deliverables = content.deliverables || [
          { name: 'Caderno de Apresentação Arquitetônica', status: 'Homologado' },
          { name: 'Caderno Geral de Especificações Técnicas', status: 'Homologado' },
          { name: 'Plantas Humanizadas e Renders 3D', status: 'Homologado' }
        ];
        return `
          <div class="sheet-view-delivery">
            <div class="sheet-section-title">
              <h2><i data-lucide="award"></i> Dossiê de Homologação & Entrega</h2>
              <p>Termo de conclusão da fase de apresentação e validação para próximas etapas.</p>
            </div>
            <div class="delivery-summary-box">
              <h3>Status da Apresentação: <span class="text-success">Pronta para Revisão do Cliente</span></h3>
              <ul class="pres-bullet-list mt-3">
                ${deliverables.map(d => `
                  <li><i data-lucide="check-circle-2" class="icon-inline text-success"></i> <strong>${escapeHTML(d.name)}</strong>: ${escapeHTML(d.status)}</li>
                `).join('')}
              </ul>
            </div>
          </div>
        `;

      default:
        return `
          <div class="sheet-view-generic p-4">
            <h3>${escapeHTML(page.title)}</h3>
            <p>${escapeHTML(page.subtitle || '')}</p>
            <div class="sheet-generic-notes">${escapeHTML(page.notes || 'Conteúdo da prancha.')}</div>
          </div>
        `;
    }
  }

  /**
   * Renderiza o Painel Direito: Inspetor de Propriedades do elemento selecionado
   */
  function renderPropertyInspector(presentation, page, project) {
    const isApproved = presentation.status === 'aprovado';
    const environments = (StudioState.data.environments || []).filter(e => e.projectId === project.id);

    return `
      <div class="pres-inspector-container">
        <div class="pres-inspector-header">
          <h4><i data-lucide="sliders"></i> Propriedades da Prancha</h4>
          <span class="badge-mini">${StudioState.PRESENTATION_SECTION_LABELS[page.sectionType] || page.sectionType}</span>
        </div>

        ${isApproved ? `
          <div class="pres-integrity-alert">
            <i data-lucide="shield-alert"></i>
            <div>
              <strong>Apresentação Aprovada</strong>
              <p>Edições diretas estão bloqueadas para garantir a integridade. Para efetuar modificações, gere uma nova revisão.</p>
              <button class="btn btn-warning btn-xs mt-1" onclick="PresentationEngineModule.openRevisionModal('${presentation.id}')">
                <i data-lucide="git-branch"></i> Gerar Nova Revisão
              </button>
            </div>
          </div>
        ` : ''}

        <form class="pres-inspector-form" onsubmit="event.preventDefault()">
          <!-- Título da Prancha -->
          <div class="form-group mb-3">
            <label class="form-label" for="page-prop-title">Título da Prancha</label>
            <input type="text" id="page-prop-title" class="form-input" value="${escapeHTML(page.title)}"
                   ${isApproved ? 'disabled' : ''}
                   oninput="PresentationEngineModule.handlePropertyChange('${page.id}', 'title', this.value)">
          </div>

          <!-- Subtítulo -->
          <div class="form-group mb-3">
            <label class="form-label" for="page-prop-sub">Subtítulo / Descritivo</label>
            <input type="text" id="page-prop-sub" class="form-input" value="${escapeHTML(page.subtitle || '')}"
                   ${isApproved ? 'disabled' : ''}
                   oninput="PresentationEngineModule.handlePropertyChange('${page.id}', 'subtitle', this.value)">
          </div>

          <!-- Seção Canônica (Estrutura Hierárquica em 14 seções) -->
          <div class="form-group mb-3">
            <label class="form-label" for="page-prop-sec">Seção Estrutural</label>
            <select id="page-prop-sec" class="form-select" ${isApproved ? 'disabled' : ''}
                    onchange="PresentationEngineModule.handlePropertyChange('${page.id}', 'sectionType', this.value)">
              ${StudioState.PRESENTATION_SECTIONS.ALL.map(sec => `
                <option value="${sec}" ${sec === page.sectionType ? 'selected' : ''}>
                  ${StudioState.PRESENTATION_SECTION_LABELS[sec] || sec}
                </option>
              `).join('')}
            </select>
          </div>

          <!-- Ambiente Vinculado (Opcional) -->
          <div class="form-group mb-3">
            <label class="form-label" for="page-prop-env">Ambiente Vinculado</label>
            <select id="page-prop-env" class="form-select" ${isApproved ? 'disabled' : ''}
                    onchange="PresentationEngineModule.handlePropertyChange('${page.id}', 'environmentId', this.value || null)">
              <option value="">-- Escopo Geral do Projeto --</option>
              ${environments.map(e => `
                <option value="${e.id}" ${e.id === page.environmentId ? 'selected' : ''}>
                  ${escapeHTML(e.name)} (${e.areaM2 || e.area || '-'} m²)
                </option>
              `).join('')}
            </select>
          </div>

          <!-- Status do Elemento / Prancha -->
          <div class="form-group mb-3">
            <label class="form-label" for="page-prop-status">Status da Prancha</label>
            <select id="page-prop-status" class="form-select" ${isApproved ? 'disabled' : ''}
                    onchange="PresentationEngineModule.handlePropertyChange('${page.id}', 'status', this.value)">
              ${StudioState.PRESENTATION_STATUSES.ALL.map(st => `
                <option value="${st}" ${st === page.status ? 'selected' : ''}>
                  ${StudioState.PRESENTATION_STATUS_LABELS[st] || st}
                </option>
              `).join('')}
            </select>
            <small class="text-muted d-block mt-1">Apenas pranchas aprovadas entram na apresentação final/entrega.</small>
          </div>

          <!-- Template de Diagramação -->
          <div class="form-group mb-3">
            <label class="form-label" for="page-prop-template">Template de Layout</label>
            <select id="page-prop-template" class="form-select" ${isApproved ? 'disabled' : ''}
                    onchange="PresentationEngineModule.handlePropertyChange('${page.id}', 'layoutTemplate', this.value)">
              <option value="cover_hero" ${page.layoutTemplate === 'cover_hero' ? 'selected' : ''}>Capa Hero Institucional</option>
              <option value="tech_info_grid" ${page.layoutTemplate === 'tech_info_grid' ? 'selected' : ''}>Quadro Técnico & Informações</option>
              <option value="briefing_summary" ${page.layoutTemplate === 'briefing_summary' ? 'selected' : ''}>Síntese de Briefing</option>
              <option value="concept_directives" ${page.layoutTemplate === 'concept_directives' ? 'selected' : ''}>Diretrizes de Conceito</option>
              <option value="studies_gallery" ${page.layoutTemplate === 'studies_gallery' ? 'selected' : ''}>Galeria de Estudos & Croquis</option>
              <option value="environment_detail" ${page.layoutTemplate === 'environment_detail' ? 'selected' : ''}>Detalhamento de Ambientes</option>
              <option value="materials_table" ${page.layoutTemplate === 'materials_table' ? 'selected' : ''}>Tabela de Materiais & Acabamentos</option>
              <option value="furniture_catalog" ${page.layoutTemplate === 'furniture_catalog' ? 'selected' : ''}>Catálogo de Mobiliário</option>
              <option value="quantities_matrix" ${page.layoutTemplate === 'quantities_matrix' ? 'selected' : ''}>Matriz de Quantitativos</option>
              <option value="moodboard_composite" ${page.layoutTemplate === 'moodboard_composite' ? 'selected' : ''}>Composição de Moodboard</option>
              <option value="humanized_plan_sheet" ${page.layoutTemplate === 'humanized_plan_sheet' ? 'selected' : ''}>Prancha de Planta Humanizada</option>
              <option value="perspectives_showcase" ${page.layoutTemplate === 'perspectives_showcase' ? 'selected' : ''}>Mural de Perspectivas 3D</option>
              <option value="revisions_log" ${page.layoutTemplate === 'revisions_log' ? 'selected' : ''}>Registro de Revisões</option>
              <option value="delivery_checklist" ${page.layoutTemplate === 'delivery_checklist' ? 'selected' : ''}>Checklist de Entrega</option>
            </select>
          </div>

          <!-- Observações Técnicas -->
          <div class="form-group mb-3">
            <label class="form-label" for="page-prop-notes">Observações & Anotações</label>
            <textarea id="page-prop-notes" class="form-textarea" rows="3" ${isApproved ? 'disabled' : ''}
                      placeholder="Diretrizes específicas desta prancha..."
                      oninput="PresentationEngineModule.handlePropertyChange('${page.id}', 'notes', this.value)">${escapeHTML(page.notes || '')}</textarea>
          </div>

          <!-- Informações de Metadados -->
          <div class="pres-meta-audit-box">
            <div class="meta-row"><span>ID da Prancha:</span> <code>${page.id}</code></div>
            <div class="meta-row"><span>Ordem:</span> <span>Posição ${page.order + 1}</span></div>
            <div class="meta-row"><span>Última Edição:</span> <span>${formatDateBR(page.updatedAt)}</span></div>
          </div>
        </form>
      </div>
    `;
  }

  /**
   * Modo Apresentação (Slideshow Limpo para Reuniões e Apresentação para Cliente)
   */
  function renderPresentationSlideMode(presentation, activePage, project) {
    const pages = presentation.activePages;
    const currentIndex = pages.findIndex(p => p.id === (activePage ? activePage.id : ''));
    const currentPage = currentIndex >= 0 ? pages[currentIndex] : pages[0];

    return `
      <div class="pres-slide-mode-container">
        <!-- Canvas Central Limpo -->
        <div class="pres-slide-viewport">
          ${currentPage ? renderSheetCanvas(presentation, currentPage, project) : '<div class="text-white text-center">Nenhuma prancha ativa.</div>'}
        </div>

        <!-- Barra Flutuante de Controle de Slides -->
        <div class="pres-slide-controls">
          <button class="btn btn-ghost btn-sm text-white" onclick="PresentationEngineModule.prevSlide('${presentation.id}')" title="Prancha Anterior">
            <i data-lucide="chevron-left"></i> Anterior
          </button>
          <div class="pres-slide-counter">
            ${currentIndex + 1} / ${pages.length}
          </div>
          <button class="btn btn-ghost btn-sm text-white" onclick="PresentationEngineModule.nextSlide('${presentation.id}')" title="Próxima Prancha">
            Próxima <i data-lucide="chevron-right"></i>
          </button>
          <button class="btn btn-danger btn-sm ms-3" onclick="PresentationEngineModule.setPreviewMode('edicao')" title="Sair do Modo Apresentação">
            <i data-lucide="x"></i> Sair
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Modo Exportação & Inspeção Pré-Entrega (Valida pranchas aprovadas vs rascunho)
   */
  function renderExportPreviewMode(presentation, project) {
    const delivery = StudioState.filterPresentationForDelivery(presentation.id);
    const hasDrafts = delivery.excludedDraftPagesCount > 0;

    return `
      <div class="pres-export-mode-container animate-fade-in p-4">
        <div class="d-flex justify-content-between align-items-center mb-4 pb-3" style="border-bottom: 1px solid var(--border-color);">
          <div>
            <h2><i data-lucide="package-check"></i> Inspeção de Conformidade & Dossiê de Entrega</h2>
            <p class="text-muted">Validação prévia das pranchas prontas para compor o pacote final de entrega ao cliente.</p>
          </div>
          <button class="btn btn-outline btn-sm" onclick="PresentationEngineModule.setPreviewMode('edicao')">
            <i data-lucide="arrow-left"></i> Voltar à Edição
          </button>
        </div>

        ${hasDrafts ? `
          <div class="alert alert-warning mb-4">
            <i data-lucide="alert-triangle"></i>
            <div>
              <strong>Atenção: ${delivery.excludedDraftPagesCount} prancha(s) em rascunho não entrarão na entrega final.</strong>
              <p>Conforme a regra do motor de apresentação, somente elementos aprovados são exportados para entrega ao cliente.</p>
            </div>
          </div>
        ` : `
          <div class="alert alert-success mb-4">
            <i data-lucide="check-circle-2"></i>
            <div>
              <strong>Todas as pranchas ativas estão homologadas!</strong>
              <p>A apresentação preenche 100% dos requisitos de conformidade para entrega executiva.</p>
            </div>
          </div>
        `}

        <div class="card p-3 mb-4">
          <h4>Manifesto de Pranchas da Entrega</h4>
          <table class="pres-tech-table mt-2">
            <thead>
              <tr>
                <th>Nº</th>
                <th>Prancha</th>
                <th>Seção</th>
                <th>Status</th>
                <th>Conformidade para Entrega</th>
              </tr>
            </thead>
            <tbody>
              ${presentation.pages.map((p, idx) => {
                const isApproved = p.status === 'aprovado';
                return `
                  <tr>
                    <td>${idx + 1}</td>
                    <td><strong>${escapeHTML(p.title)}</strong></td>
                    <td>${StudioState.PRESENTATION_SECTION_LABELS[p.sectionType] || p.sectionType}</td>
                    <td><span class="pres-status-mini-dot ${isApproved ? 'badge-approved' : 'badge-draft'}"></span> ${p.status}</td>
                    <td>${isApproved 
                      ? '<span class="text-success"><i data-lucide="check"></i> Apto para Entrega</span>' 
                      : '<span class="text-muted"><i data-lucide="clock"></i> Rascunho (Omitido)</span>'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  /**
   * Estado Vazio quando não há nenhuma apresentação criada
   */
  function renderEmptyPresentationState(project) {
    return `
      <div class="pres-empty-state-container animate-fade-in p-5 text-center">
        <div class="pres-empty-icon mb-3">
          <i data-lucide="presentation" style="width: 56px; height: 56px; color: var(--primary);"></i>
        </div>
        <h2>Motor Central de Apresentação</h2>
        <p class="text-muted max-w-600 mx-auto mb-4">
          Transforme os resultados produzidos ao longo do projeto em uma apresentação profissional, organizada e pronta para revisão e entrega ao cliente.
        </p>
        <div class="d-flex justify-content-center gap-3">
          <button class="btn btn-primary" onclick="PresentationEngineModule.generateAutomatic('${project.id}')">
            <i data-lucide="sparkles"></i> Gerar Apresentação Automática Completa
          </button>
          <button class="btn btn-outline" onclick="PresentationEngineModule.openCreateModal('${project.id}')">
            <i data-lucide="plus"></i> Criar em Branco
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Renderização de Modais do Módulo
   */
  function renderModals(presentation, project) {
    return `
      <!-- 1. Modal de Criação de Apresentação -->
      <div class="pres-modal-backdrop" id="pres-modal-create" onclick="PresentationEngineModule.closeModal(event)">
        <div class="pres-modal-card" onclick="event.stopPropagation()">
          <div class="pres-modal-header">
            <h3>Cadastrar Nova Apresentação</h3>
            <button class="btn-close-modal" onclick="PresentationEngineModule.closeModal(event)">&times;</button>
          </div>
          <form onsubmit="PresentationEngineModule.submitCreate(event, '${project.id}')">
            <div class="pres-modal-body">
              <div class="form-group mb-3">
                <label class="form-label">Título da Apresentação *</label>
                <input type="text" id="new-pres-title" class="form-input" required 
                       value="${escapeHTML(project.name)} — Apresentação de Projeto">
              </div>
              <div class="form-group mb-3">
                <label class="form-label">Tipo Canônico *</label>
                <select id="new-pres-type" class="form-select" required>
                  ${StudioState.PRESENTATION_TYPES.ALL.map(t => `
                    <option value="${t}">${StudioState.PRESENTATION_TYPE_LABELS[t] || t}</option>
                  `).join('')}
                </select>
              </div>
              <div class="form-group mb-3">
                <label class="form-label">Formato de Prancha</label>
                <select id="new-pres-format" class="form-select">
                  <option value="A3" selected>A3 (420 x 297 mm)</option>
                  <option value="A4">A4 (297 x 210 mm)</option>
                  <option value="A2">A2 (594 x 420 mm)</option>
                  <option value="A1">A1 (841 x 594 mm)</option>
                </select>
              </div>
            </div>
            <div class="pres-modal-footer">
              <button type="button" class="btn btn-outline" onclick="PresentationEngineModule.closeModal(event)">Cancelar</button>
              <button type="submit" class="btn btn-primary">Criar Apresentação</button>
            </div>
          </form>
        </div>
      </div>

      <!-- 2. Modal de Nova Revisão Formal -->
      <div class="pres-modal-backdrop" id="pres-modal-revision" onclick="PresentationEngineModule.closeModal(event)">
        <div class="pres-modal-card" onclick="event.stopPropagation()">
          <div class="pres-modal-header">
            <h3>Gerar Nova Revisão Técnica</h3>
            <button class="btn-close-modal" onclick="PresentationEngineModule.closeModal(event)">&times;</button>
          </div>
          <form onsubmit="PresentationEngineModule.submitRevision(event, '${presentation.id}')">
            <div class="pres-modal-body">
              <div class="alert alert-info mb-3">
                <i data-lucide="git-branch"></i>
                <div>
                  <strong>Revisão Atual: ${presentation.revision || 'R00'}</strong>
                  <p>Uma nova revisão será aberta mantendo o histórico e desbloqueando as pranchas para edição.</p>
                </div>
              </div>
              <div class="form-group mb-3">
                <label class="form-label">Justificativa da Revisão *</label>
                <textarea id="new-rev-summary" class="form-textarea" rows="3" required
                          placeholder="Ex: Ajustes solicitados pelo cliente no layout do Living e especificação de novos acabamentos."></textarea>
              </div>
            </div>
            <div class="pres-modal-footer">
              <button type="button" class="btn btn-outline" onclick="PresentationEngineModule.closeModal(event)">Cancelar</button>
              <button type="submit" class="btn btn-warning">Criar Nova Revisão</button>
            </div>
          </form>
        </div>
      </div>

      <!-- 3. Modal de Adicionar Prancha -->
      <div class="pres-modal-backdrop" id="pres-modal-add-page" onclick="PresentationEngineModule.closeModal(event)">
        <div class="pres-modal-card" onclick="event.stopPropagation()">
          <div class="pres-modal-header">
            <h3>Adicionar Nova Prancha</h3>
            <button class="btn-close-modal" onclick="PresentationEngineModule.closeModal(event)">&times;</button>
          </div>
          <form onsubmit="PresentationEngineModule.submitAddPage(event, '${presentation.id}')">
            <div class="pres-modal-body">
              <div class="form-group mb-3">
                <label class="form-label">Título da Prancha *</label>
                <input type="text" id="new-page-title" class="form-input" required placeholder="Ex: Detalhamento da Cozinha Gourmet">
              </div>
              <div class="form-group mb-3">
                <label class="form-label">Seção Estrutural *</label>
                <select id="new-page-section" class="form-select" required>
                  ${StudioState.PRESENTATION_SECTIONS.ALL.map(s => `
                    <option value="${s}">${StudioState.PRESENTATION_SECTION_LABELS[s] || s}</option>
                  `).join('')}
                </select>
              </div>
            </div>
            <div class="pres-modal-footer">
              <button type="button" class="btn btn-outline" onclick="PresentationEngineModule.closeModal(event)">Cancelar</button>
              <button type="submit" class="btn btn-primary">Adicionar Prancha</button>
            </div>
          </form>
        </div>
      </div>

      <!-- 4. Modal de Aprovação Formal -->
      <div class="pres-modal-backdrop" id="pres-modal-approve" onclick="PresentationEngineModule.closeModal(event)">
        <div class="pres-modal-card" onclick="event.stopPropagation()">
          <div class="pres-modal-header">
            <h3>Homologação da Apresentação</h3>
            <button class="btn-close-modal" onclick="PresentationEngineModule.closeModal(event)">&times;</button>
          </div>
          <form onsubmit="PresentationEngineModule.submitApprove(event, '${presentation.id}')">
            <div class="pres-modal-body">
              <div class="alert alert-success mb-3">
                <i data-lucide="shield-check"></i>
                <div>
                  <strong>Trava de Integridade</strong>
                  <p>Ao homologar, esta apresentação será marcada como APROVADA e não poderá ser modificada silenciosamente.</p>
                </div>
              </div>
              <div class="form-group mb-3">
                <label class="form-label">Notas de Aprovação (Opcional)</label>
                <textarea id="approve-pres-notes" class="form-textarea" rows="2" placeholder="Ex: Homologado em reunião presencial com o cliente titular Pedro."></textarea>
              </div>
            </div>
            <div class="pres-modal-footer">
              <button type="button" class="btn btn-outline" onclick="PresentationEngineModule.closeModal(event)">Cancelar</button>
              <button type="submit" class="btn btn-success">Confirmar Homologação</button>
            </div>
          </form>
        </div>
      </div>

      <!-- 5. Modal de Recuperação de Versão Salva -->
      <div class="pres-modal-backdrop" id="pres-modal-recovery" onclick="PresentationEngineModule.closeModal(event)">
        <div class="pres-modal-card" onclick="event.stopPropagation()">
          <div class="pres-modal-header">
            <h3>Recuperar Última Versão Salva</h3>
            <button class="btn-close-modal" onclick="PresentationEngineModule.closeModal(event)">&times;</button>
          </div>
          <div class="pres-modal-body">
            <p>Deseja descartar as alterações não persistidas e restaurar o snapshot mais recente gravado no sistema?</p>
            <p class="text-muted small">Esta ação recupera o estado seguro íntegro mais recente desta apresentação.</p>
          </div>
          <div class="pres-modal-footer">
            <button type="button" class="btn btn-outline" onclick="PresentationEngineModule.closeModal(event)">Cancelar</button>
            <button type="button" class="btn btn-warning" onclick="PresentationEngineModule.submitRecovery('${presentation.id}')">Restaurar Agora</button>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // HANDLERS E MÉTODOS DE AÇÃO
  // ==========================================================================

  function setActivePresentation(id) {
    activePresentationId = id;
    activePageId = null;
    refreshView();
  }

  function setActivePage(id) {
    activePageId = id;
    refreshView();
  }

  function setPreviewMode(mode) {
    currentPreviewMode = mode;
    refreshView();
  }

  function toggleTrashView(showTrash) {
    isTrashView = !!showTrash;
    activePageId = null;
    refreshView();
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log('Fullscreen error:', err));
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  }

  function triggerPrint() {
    window.print();
  }

  function nextSlide(presId) {
    const pres = StudioState.getPresentation(presId);
    if (!pres || !pres.activePages.length) return;
    const idx = pres.activePages.findIndex(p => p.id === activePageId);
    if (idx < pres.activePages.length - 1) {
      activePageId = pres.activePages[idx + 1].id;
    } else {
      activePageId = pres.activePages[0].id;
    }
    refreshView();
  }

  function prevSlide(presId) {
    const pres = StudioState.getPresentation(presId);
    if (!pres || !pres.activePages.length) return;
    const idx = pres.activePages.findIndex(p => p.id === activePageId);
    if (idx > 0) {
      activePageId = pres.activePages[idx - 1].id;
    } else {
      activePageId = pres.activePages[pres.activePages.length - 1].id;
    }
    refreshView();
  }

  function handlePropertyChange(pageId, field, value) {
    updateAutosaveIndicator('saving');

    if (autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      try {
        StudioState.updatePresentationPage(pageId, { [field]: value });
        updateAutosaveIndicator('saved');
        // Atualiza a visualização sem perder o foco se estiver digitando
        if (field === 'title' || field === 'subtitle' || field === 'sectionType') {
          // Atualiza apenas o canvas
          const page = (StudioState.data.presentationPages || []).find(p => p.id === pageId);
          if (page) {
            const pres = StudioState.getPresentation(page.presentationId);
            const proj = StudioState.getProject(pres.projectId);
            const canvas = document.querySelector('.pres-center-canvas');
            if (canvas) canvas.innerHTML = renderSheetCanvas(pres, page, proj);
            if (window.lucide) lucide.createIcons();
          }
        }
      } catch (err) {
        console.error('Erro no autosave:', err);
        updateAutosaveIndicator('error');
      }
    }, 600);
  }

  function triggerSaveNow(presentationId) {
    try {
      updateAutosaveIndicator('saving');
      StudioState.savePresentationBackup(presentationId);
      StudioState.save();
      updateAutosaveIndicator('saved');
      showToast('Apresentação salva com sucesso!');
    } catch (err) {
      updateAutosaveIndicator('error');
      alert('Erro ao salvar: ' + err.message);
    }
  }

  function updateAutosaveIndicator(status) {
    autosaveStatus = status;
    const badge = document.getElementById('pres-autosave-badge');
    if (!badge) return;
    badge.className = `pres-autosave-indicator pres-autosave-${status}`;
    if (status === 'saving') {
      badge.innerHTML = '<i data-lucide="loader-2" class="spin"></i> <span>Salvando...</span>';
    } else if (status === 'error') {
      badge.innerHTML = '<i data-lucide="alert-triangle"></i> <span>Erro ao salvar</span>';
    } else {
      badge.innerHTML = '<i data-lucide="check-check"></i> <span>Salvo</span>';
    }
    if (window.lucide) lucide.createIcons();
  }

  function reorderPages(presentationId, pageId, direction) {
    try {
      StudioState.movePresentationPage(pageId, direction);
      refreshView();
    } catch (err) {
      alert(err.message);
    }
  }

  function duplicatePage(pageId) {
    try {
      const copy = StudioState.duplicatePresentationPage(pageId);
      activePageId = copy.id;
      refreshView();
      showToast('Prancha duplicada com sucesso!');
    } catch (err) {
      alert(err.message);
    }
  }

  function toggleHidePage(pageId, isHidden) {
    try {
      StudioState.hidePresentationPage(pageId, isHidden);
      refreshView();
    } catch (err) {
      alert(err.message);
    }
  }

  function deletePage(pageId) {
    try {
      StudioState.deletePresentationPage(pageId);
      activePageId = null;
      refreshView();
      showToast('Prancha movida para a lixeira.');
    } catch (err) {
      alert(err.message);
    }
  }

  function restorePage(pageId) {
    try {
      StudioState.restorePresentationPage(pageId);
      refreshView();
      showToast('Prancha restaurada com sucesso!');
    } catch (err) {
      alert(err.message);
    }
  }

  function generateAutomatic(projectId) {
    try {
      const pres = StudioState.generateAutomaticPresentation(projectId);
      activePresentationId = pres.id;
      activePageId = pres.pages[0] ? pres.pages[0].id : null;
      refreshView();
      showToast('Apresentação automática gerada com sucesso!');
    } catch (err) {
      alert('Erro ao gerar apresentação: ' + err.message);
    }
  }

  function openCreateModal(projectId) {
    const m = document.getElementById('pres-modal-create');
    if (m) m.classList.add('is-open');
  }

  function submitCreate(event, projectId) {
    event.preventDefault();
    const title = document.getElementById('new-pres-title').value;
    const type = document.getElementById('new-pres-type').value;
    const sheetFormat = document.getElementById('new-pres-format').value;

    try {
      const pres = StudioState.createPresentation({
        projectId: projectId,
        title: title,
        presentationType: type,
        sheetFormat: sheetFormat
      });
      activePresentationId = pres.id;
      closeModal();
      refreshView();
      showToast('Nova apresentação cadastrada!');
    } catch (err) {
      alert(err.message);
    }
  }

  function openRevisionModal(presentationId) {
    const m = document.getElementById('pres-modal-revision');
    if (m) m.classList.add('is-open');
  }

  function submitRevision(event, presentationId) {
    event.preventDefault();
    const summary = document.getElementById('new-rev-summary').value;
    try {
      StudioState.createPresentationRevision(presentationId, 'Erick Santiago', summary);
      closeModal();
      refreshView();
      showToast('Nova revisão aberta com sucesso!');
    } catch (err) {
      alert(err.message);
    }
  }

  function openAddPageModal(presentationId) {
    const m = document.getElementById('pres-modal-add-page');
    if (m) m.classList.add('is-open');
  }

  function submitAddPage(event, presentationId) {
    event.preventDefault();
    const title = document.getElementById('new-page-title').value;
    const section = document.getElementById('new-page-section').value;

    try {
      const page = StudioState.addPresentationPage(presentationId, {
        title: title,
        sectionType: section
      });
      activePageId = page.id;
      closeModal();
      refreshView();
      showToast('Nova prancha adicionada!');
    } catch (err) {
      alert(err.message);
    }
  }

  function openApproveModal(presentationId) {
    const m = document.getElementById('pres-modal-approve');
    if (m) m.classList.add('is-open');
  }

  function submitApprove(event, presentationId) {
    event.preventDefault();
    const notes = document.getElementById('approve-pres-notes').value;
    try {
      StudioState.approvePresentation(presentationId, 'Erick Santiago', notes);
      closeModal();
      refreshView();
      showToast('Apresentação homologada com sucesso!');
    } catch (err) {
      alert(err.message);
    }
  }

  function openRecoveryModal(presentationId) {
    const m = document.getElementById('pres-modal-recovery');
    if (m) m.classList.add('is-open');
  }

  function submitRecovery(presentationId) {
    try {
      StudioState.recoverLastPresentationSaved(presentationId);
      closeModal();
      refreshView();
      showToast('Última versão salva recuperada com sucesso!');
    } catch (err) {
      alert(err.message);
    }
  }

  function closeModal(event) {
    if (event) event.stopPropagation();
    document.querySelectorAll('.pres-modal-backdrop').forEach(m => m.classList.remove('is-open'));
  }

  function refreshView() {
    const root = document.getElementById('workspace-tab-content');
    if (root && window.StudioState) {
      const proj = StudioState.getActiveProject();
      if (proj) {
        root.innerHTML = renderProjectPresentation(proj);
        if (window.lucide) lucide.createIcons();
      }
    }
  }

  function showToast(msg) {
    const t = document.getElementById('studio-toast');
    if (t) {
      t.innerText = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 3000);
    }
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDateBR(isoStr) {
    if (!isoStr) return '-';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('pt-BR');
    } catch (e) {
      return isoStr;
    }
  }

  return {
    renderProjectPresentation,
    setActivePresentation,
    setActivePage,
    setPreviewMode,
    toggleTrashView,
    toggleFullscreen,
    triggerPrint,
    nextSlide,
    prevSlide,
    handlePropertyChange,
    triggerSaveNow,
    reorderPages,
    duplicatePage,
    toggleHidePage,
    deletePage,
    restorePage,
    generateAutomatic,
    openCreateModal,
    submitCreate,
    openRevisionModal,
    submitRevision,
    openAddPageModal,
    submitAddPage,
    openApproveModal,
    submitApprove,
    openRecoveryModal,
    submitRecovery,
    closeModal,
    refreshView
  };
})();

if (typeof window !== 'undefined') {
  window.PresentationEngineModule = PresentationEngineModule;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PresentationEngineModule;
}
