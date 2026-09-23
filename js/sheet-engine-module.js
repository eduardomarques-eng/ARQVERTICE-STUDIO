/**
 * ============================================================================
 * ARQVERTICE STUDIO — BLOCO F02: MOTOR DE PRANCHAS (SHEET ENGINE)
 * Sistema profissional de diagramação, montagem e edição de pranchas
 * arquitetônicas e de interiores (A0 - A4, Prancha Métrica).
 * Organiza e apresenta informações, desenhos, imagens e memoriais do projeto.
 * ============================================================================
 */

const SheetEngineModule = (function () {
  'use strict';

  // Estado interno da sessão de edição
  let activeSheetId = null;
  let selectedElementIds = [];
  let zoomLevel = 0.65; // Escala visual padrão para caber no viewport
  let showGrid = true;
  let snapToGrid = true;
  let gridSize = 20; // pixels no espaço virtual da prancha
  let showGuides = true;
  let isDragging = false;
  let dragStartPos = { x: 0, y: 0 };
  let previewMode = 'editor'; // 'editor' | 'preview_fidelidade'
  let showPrintableArea = true;
  let showBleed = true;
  let showSafeArea = true;
  let pendingFormatChange = null;

  /**
   * Ponto de entrada principal renderizado no Workspace do Projeto
   */
  function renderProjectSheets(project) {
    if (!project) {
      return `<div class="p-4 text-muted">Selecione um projeto válido para acessar o Motor de Pranchas.</div>`;
    }

    const sheets = StudioState.getProjectSheets(project.id);

    // Se não houver prancha cadastrada, exibe boas-vindas para criar a primeira ou carregar template
    if (!sheets || sheets.length === 0) {
      return renderEmptySheetState(project);
    }

    // Seleciona prancha ativa
    let currentSheet = null;
    if (activeSheetId) {
      currentSheet = sheets.find(s => s.id === activeSheetId);
    }
    if (!currentSheet) {
      currentSheet = sheets[0];
      activeSheetId = currentSheet.id;
    }

    return `
      <div class="sheet-engine-container animate-fade-in ${previewMode === 'preview_fidelidade' ? 'mode-preview' : 'mode-editor'}" id="sheet-engine-root">
        ${renderSheetHeader(currentSheet, sheets, project)}
        
        <div class="sheet-engine-workspace">
          ${renderLeftToolbar(currentSheet)}
          ${renderCanvasViewport(currentSheet)}
          ${renderRightInspector(currentSheet)}
        </div>

        ${renderTemplateModal(currentSheet, project)}
        ${renderNewSheetModal(project)}
        ${renderClipWarningModal(currentSheet)}
        ${renderBrandModal(currentSheet, project)}
      </div>
    `;
  }

  /**
   * Barra superior de controle da Prancha
   */
  function renderSheetHeader(currentSheet, sheets, project) {
    return `
      <header class="sheet-top-bar">
        <div class="sheet-top-left">
          <div class="sheet-selector-wrap">
            <span class="sheet-badge-num">${escapeHTML(currentSheet.sheetNumber)}</span>
            <select class="sheet-select" onchange="SheetEngineModule.setActiveSheet(this.value)">
              ${sheets.map(s => `
                <option value="${s.id}" ${s.id === currentSheet.id ? 'selected' : ''}>
                  ${escapeHTML(s.sheetNumber)} — ${escapeHTML(s.name)} (${s.format})
                </option>
              `).join('')}
            </select>
          </div>

          <button class="btn btn-ghost btn-sm" onclick="SheetEngineModule.openNewSheetModal()" title="Criar Nova Prancha">
            <i data-lucide="plus"></i> Nova Prancha
          </button>
          <button class="btn btn-ghost btn-sm" onclick="SheetEngineModule.duplicateCurrentSheet('${currentSheet.id}')" title="Duplicar Prancha Atual">
            <i data-lucide="copy"></i> Duplicar
          </button>
          <button class="btn btn-ghost btn-sm text-danger" onclick="SheetEngineModule.deleteCurrentSheet('${currentSheet.id}')" title="Excluir Prancha">
            <i data-lucide="trash-2"></i>
          </button>
        </div>

        <div class="sheet-top-center">
          <div class="sheet-format-info">
            <span class="sheet-format-pill">${currentSheet.format} ${currentSheet.orientation === 'portrait' ? 'Vertical' : 'Horizontal'}</span>
            <span class="sheet-scale-pill">Escala: ${escapeHTML(currentSheet.scale || '1:50')}</span>
            <span class="sheet-rev-pill">Rev: ${escapeHTML(currentSheet.revision || 'R00')}</span>
            <span class="sheet-status-pill status-${currentSheet.status}">${escapeHTML(currentSheet.status)}</span>
          </div>
        </div>

        <div class="sheet-top-right">
          <!-- Zoom Controls -->
          <div class="sheet-zoom-group">
            <button class="btn-icon-sm" onclick="SheetEngineModule.adjustZoom(-0.1)" title="Diminuir Zoom">
              <i data-lucide="zoom-out"></i>
            </button>
            <span class="sheet-zoom-val">${Math.round(zoomLevel * 100)}%</span>
            <button class="btn-icon-sm" onclick="SheetEngineModule.adjustZoom(0.1)" title="Aumentar Zoom">
              <i data-lucide="zoom-in"></i>
            </button>
            <button class="btn-icon-sm" onclick="SheetEngineModule.resetZoom()" title="Ajustar à Tela">
              <i data-lucide="maximize-2"></i>
            </button>
          </div>

          <!-- Modos e Ações -->
          <button class="btn btn-outline btn-sm ${showGrid ? 'active-toggle' : ''}" onclick="SheetEngineModule.toggleGrid()" title="Alternar Grid Visual">
            <i data-lucide="grid"></i> Grid
          </button>
          <button class="btn btn-outline btn-sm ${snapToGrid ? 'active-toggle' : ''}" onclick="SheetEngineModule.toggleSnap()" title="Alternar Snap ao Grid">
            <i data-lucide="magnet"></i> Snap
          </button>
          <button class="btn btn-outline btn-sm ${showPrintableArea ? 'active-toggle' : ''}" onclick="SheetEngineModule.togglePrintableArea()" title="Alternar Visualização da Área Útil">
            <i data-lucide="crop"></i> Área Útil
          </button>
          <button class="btn btn-outline btn-sm ${showBleed ? 'active-toggle' : ''}" onclick="SheetEngineModule.toggleBleed()" title="Alternar Visualização de Sangria (3mm)">
            <i data-lucide="scissors"></i> Sangria
          </button>
          <button class="btn btn-outline btn-sm ${showSafeArea ? 'active-toggle' : ''}" onclick="SheetEngineModule.toggleSafeArea()" title="Alternar Visualização de Área Segura">
            <i data-lucide="shield-check"></i> Segura
          </button>
          <button class="btn btn-outline btn-sm" onclick="SheetEngineModule.openBrandModal()" title="Gerenciar Identidade Visual, Logos e Carimbo">
            <i data-lucide="award"></i> Identidade & Carimbo
          </button>
          <button class="btn btn-outline btn-sm" onclick="SheetEngineModule.openTemplateModal()" title="Aplicar Template de Prancha">
            <i data-lucide="layout-template"></i> Templates
          </button>
          <button class="btn btn-primary btn-sm" onclick="SheetEngineModule.togglePreviewMode()" title="Visualização de Alta Fidelidade">
            <i data-lucide="${previewMode === 'preview_fidelidade' ? 'edit-3' : 'eye'}"></i>
            ${previewMode === 'preview_fidelidade' ? 'Modo Edição' : 'Preview Fiel'}
          </button>
        </div>
      </header>
    `;
  }

  /**
   * Barra lateral esquerda: Paleta de Elementos e Alinhamentos Rápidos
   */
  function renderLeftToolbar(sheet) {
    const hasSelection = selectedElementIds.length > 0;
    const multiSelection = selectedElementIds.length >= 2;

    return `
      <aside class="sheet-left-toolbar">
        <div class="toolbar-section">
          <div class="toolbar-title">Inserir Elemento</div>
          <div class="element-palette-grid">
            <button class="palette-btn" onclick="SheetEngineModule.quickAddElement('titulo')" title="Título de Prancha">
              <i data-lucide="heading"></i>
              <span>Título</span>
            </button>
            <button class="palette-btn" onclick="SheetEngineModule.quickAddElement('subtitulo')" title="Subtítulo">
              <i data-lucide="type"></i>
              <span>Subtítulo</span>
            </button>
            <button class="palette-btn" onclick="SheetEngineModule.quickAddElement('texto')" title="Bloco de Texto">
              <i data-lucide="align-left"></i>
              <span>Texto</span>
            </button>
            <button class="palette-btn" onclick="SheetEngineModule.quickAddElement('imagem')" title="Imagem / Foto">
              <i data-lucide="image"></i>
              <span>Imagem</span>
            </button>
            <button class="palette-btn" onclick="SheetEngineModule.quickAddElement('render')" title="Render 3D">
              <i data-lucide="sparkles"></i>
              <span>Render</span>
            </button>
            <button class="palette-btn" onclick="SheetEngineModule.quickAddElement('perspectiva')" title="Perspectiva">
              <i data-lucide="box"></i>
              <span>Perspectiva</span>
            </button>
            <button class="palette-btn" onclick="SheetEngineModule.quickAddElement('planta')" title="Planta Técnica">
              <i data-lucide="map"></i>
              <span>Planta</span>
            </button>
            <button class="palette-btn" onclick="SheetEngineModule.quickAddElement('planta_humanizada')" title="Planta Humanizada">
              <i data-lucide="layout"></i>
              <span>Pl. Human.</span>
            </button>
            <button class="palette-btn" onclick="SheetEngineModule.quickAddElement('elevacao')" title="Elevação">
              <i data-lucide="columns"></i>
              <span>Elevação</span>
            </button>
            <button class="palette-btn" onclick="SheetEngineModule.quickAddElement('corte')" title="Corte Arquitetônico">
              <i data-lucide="scissors"></i>
              <span>Corte</span>
            </button>
            <button class="palette-btn" onclick="SheetEngineModule.quickAddElement('detalhe')" title="Detalhe Construtivo">
              <i data-lucide="zoom-in"></i>
              <span>Detalhe</span>
            </button>
            <button class="palette-btn" onclick="SheetEngineModule.quickAddElement('tabela')" title="Tabela de Dados">
              <i data-lucide="table"></i>
              <span>Tabela</span>
            </button>
            <button class="palette-btn" onclick="SheetEngineModule.quickAddElement('mobiliario')" title="Card de Mobiliário">
              <i data-lucide="armchair"></i>
              <span>Mobiliário</span>
            </button>
            <button class="palette-btn" onclick="SheetEngineModule.quickAddElement('material')" title="Card de Material">
              <i data-lucide="layers"></i>
              <span>Material</span>
            </button>
            <button class="palette-btn" onclick="SheetEngineModule.quickAddElement('legenda')" title="Legenda do Desenho">
              <i data-lucide="list"></i>
              <span>Legenda</span>
            </button>
            <button class="palette-btn" onclick="SheetEngineModule.quickAddElement('norte')" title="Símbolo de Norte">
              <i data-lucide="compass"></i>
              <span>Norte</span>
            </button>
            <button class="palette-btn" onclick="SheetEngineModule.quickAddElement('escala_grafica')" title="Escala Gráfica">
              <i data-lucide="ruler"></i>
              <span>Escala</span>
            </button>
            <button class="palette-btn" onclick="SheetEngineModule.quickAddElement('cota')" title="Cota de Dimensão">
              <i data-lucide="move-horizontal"></i>
              <span>Cota</span>
            </button>
            <button class="palette-btn" onclick="SheetEngineModule.quickAddElement('carimbo')" title="Carimbo / Selo Técnico">
              <i data-lucide="stamp"></i>
              <span>Carimbo</span>
            </button>
            <button class="palette-btn" onclick="SheetEngineModule.quickAddElement('logo')" title="Logotipo do Escritório">
              <i data-lucide="award"></i>
              <span>Logo</span>
            </button>
            <button class="palette-btn" onclick="SheetEngineModule.quickAddElement('retangulo')" title="Moldura Retangular">
              <i data-lucide="square"></i>
              <span>Retângulo</span>
            </button>
            <button class="palette-btn" onclick="SheetEngineModule.quickAddElement('linha')" title="Linha de Chamada">
              <i data-lucide="minus"></i>
              <span>Linha</span>
            </button>
            <button class="palette-btn" onclick="SheetEngineModule.quickAddElement('separador')" title="Separador">
              <i data-lucide="more-horizontal"></i>
              <span>Separador</span>
            </button>
            <button class="palette-btn" onclick="SheetEngineModule.quickAddElement('simbolo')" title="Símbolo Geral">
              <i data-lucide="help-circle"></i>
              <span>Símbolo</span>
            </button>
          </div>
        </div>

        <div class="toolbar-section mt-3">
          <div class="toolbar-title">Alinhamento & Distribuição</div>
          <div class="align-btn-grid">
            <button class="align-btn" ${!multiSelection ? 'disabled' : ''} onclick="SheetEngineModule.alignSelection('left')" title="Alinhar à Esquerda">
              <i data-lucide="align-start-vertical"></i>
            </button>
            <button class="align-btn" ${!multiSelection ? 'disabled' : ''} onclick="SheetEngineModule.alignSelection('center_h')" title="Centralizar Horizontalmente">
              <i data-lucide="align-center-vertical"></i>
            </button>
            <button class="align-btn" ${!multiSelection ? 'disabled' : ''} onclick="SheetEngineModule.alignSelection('right')" title="Alinhar à Direita">
              <i data-lucide="align-end-vertical"></i>
            </button>
            <button class="align-btn" ${!multiSelection ? 'disabled' : ''} onclick="SheetEngineModule.alignSelection('top')" title="Alinhar ao Topo">
              <i data-lucide="align-start-horizontal"></i>
            </button>
            <button class="align-btn" ${!multiSelection ? 'disabled' : ''} onclick="SheetEngineModule.alignSelection('center_v')" title="Centralizar Verticalmente">
              <i data-lucide="align-center-horizontal"></i>
            </button>
            <button class="align-btn" ${!multiSelection ? 'disabled' : ''} onclick="SheetEngineModule.alignSelection('bottom')" title="Alinhar à Base">
              <i data-lucide="align-end-horizontal"></i>
            </button>
            <button class="align-btn" ${selectedElementIds.length < 3 ? 'disabled' : ''} onclick="SheetEngineModule.distributeSelection('horizontal')" title="Distribuir Horizontalmente">
              <i data-lucide="align-horizontal-distribute-center"></i>
            </button>
            <button class="align-btn" ${selectedElementIds.length < 3 ? 'disabled' : ''} onclick="SheetEngineModule.distributeSelection('vertical')" title="Distribuir Verticalmente">
              <i data-lucide="align-vertical-distribute-center"></i>
            </button>
          </div>
        </div>

        <div class="toolbar-section mt-3">
          <div class="toolbar-title">Ações de Seleção</div>
          <div class="d-flex flex-column gap-1">
            <button class="btn btn-outline btn-xs" ${!multiSelection ? 'disabled' : ''} onclick="SheetEngineModule.groupSelected()">
              <i data-lucide="package"></i> Agrupar
            </button>
            <button class="btn btn-outline btn-xs" ${!hasSelection ? 'disabled' : ''} onclick="SheetEngineModule.ungroupSelected()">
              <i data-lucide="package-open"></i> Desagrupar
            </button>
            <button class="btn btn-outline btn-xs" ${!hasSelection ? 'disabled' : ''} onclick="SheetEngineModule.duplicateSelected()">
              <i data-lucide="copy"></i> Duplicar Seleção
            </button>
            <button class="btn btn-outline btn-xs text-danger" ${!hasSelection ? 'disabled' : ''} onclick="SheetEngineModule.deleteSelected()">
              <i data-lucide="trash-2"></i> Excluir Seleção
            </button>
          </div>
        </div>
      </aside>
    `;
  }

  /**
   * Canvas central onde a Prancha é renderizada no tamanho proporcional exato
   */
  function renderCanvasViewport(sheet) {
    const profile = sheet.formatProfile || StudioState.getFormatProfile(sheet.format, sheet.orientation, sheet.margins, sheet.bleed);
    const screenDims = profile.renderDimensions.screenPx;
    const W = screenDims.width;
    const H = screenDims.height;
    const pArea = screenDims.printableArea;
    const sArea = screenDims.safeArea;
    const bleed = screenDims.bleed;

    const gridPatternSize = snapToGrid ? gridSize : 20;

    return `
      <main class="sheet-canvas-viewport" id="sheet-viewport" onclick="SheetEngineModule.handleCanvasClick(event)">
        <div class="sheet-paper-container" style="transform: scale(${zoomLevel});">
          
          <!-- Sangria Externa (Bleed) se ativada -->
          ${showBleed ? `
            <div class="sheet-bleed-guide" style="
              position: absolute;
              left: -${bleed.left}px;
              top: -${bleed.top}px;
              width: ${W + bleed.left + bleed.right}px;
              height: ${H + bleed.top + bleed.bottom}px;
              pointer-events: none;
            ">
              <span class="bleed-guide-tag">Sangria (${profile.bleed.top}mm)</span>
            </div>
          ` : ''}

          <div 
            class="sheet-paper ${showGrid ? 'has-grid' : ''}" 
            id="sheet-paper"
            style="width: ${W}px; height: ${H}px; background-color: ${sheet.background || '#ffffff'}; --grid-size: ${gridPatternSize}px;"
          >
            <!-- Área Útil / Printable Area com margens técnicas NBR 10068 -->
            ${showPrintableArea ? `
              <div class="sheet-printable-area-guide" style="
                position: absolute;
                left: ${pArea.x}px;
                top: ${pArea.y}px;
                width: ${pArea.width}px;
                height: ${pArea.height}px;
                pointer-events: none;
              ">
                <span class="printable-guide-tag">Área Útil (${profile.printableArea.width} &times; ${profile.printableArea.height} mm)</span>
              </div>
            ` : ''}

            <!-- Área Segura (Safe Area) -->
            ${showSafeArea ? `
              <div class="sheet-safe-area-guide" style="
                position: absolute;
                left: ${sArea.x}px;
                top: ${sArea.y}px;
                width: ${sArea.width}px;
                height: ${sArea.height}px;
                pointer-events: none;
              ">
                <span class="safe-guide-tag">Área Segura</span>
              </div>
            ` : ''}

            <!-- Borda Técnica de Corte da Folha (Trim Line) -->
            <div class="sheet-border-margin" style="width: 100%; height: 100%; left: 0; top: 0; pointer-events: none;"></div>

            <!-- Renderização de todos os elementos -->
            ${(sheet.elements || []).map(el => renderElementOnSheet(el, sheet)).join('')}
          </div>
        </div>
      </main>
    `;
  }

  /**
   * Renderiza cada elemento individual no canvas da prancha
   */
  function renderElementOnSheet(el, sheet) {
    if (!el.visible) return '';

    const isSelected = selectedElementIds.includes(el.id);
    const hasGroup = !!el.groupId;
    const styleObj = el.style || {};

    const styleStr = [
      `left: ${el.x}px`,
      `top: ${el.y}px`,
      `width: ${el.width}px`,
      `height: ${el.height}px`,
      `transform: rotate(${el.rotation || 0}deg)`,
      `z-index: ${el.zIndex || 1}`,
      `opacity: ${el.opacity !== undefined ? el.opacity : 1}`
    ].join('; ');

    return `
      <div 
        class="sheet-element-box type-${el.type} ${isSelected ? 'is-selected' : ''} ${el.locked ? 'is-locked' : ''} ${hasGroup ? 'in-group' : ''}"
        id="el-box-${el.id}"
        style="${styleStr}"
        onclick="SheetEngineModule.selectElement('${el.id}', event)"
        onmousedown="SheetEngineModule.startDragElement('${el.id}', event)"
        data-id="${el.id}"
      >
        <div class="element-inner-content">
          ${renderElementContent(el, sheet)}
        </div>

        ${isSelected && !el.locked && previewMode !== 'preview_fidelidade' ? `
          <div class="resize-handle handle-nw" onmousedown="SheetEngineModule.startResize('${el.id}', 'nw', event)"></div>
          <div class="resize-handle handle-ne" onmousedown="SheetEngineModule.startResize('${el.id}', 'ne', event)"></div>
          <div class="resize-handle handle-se" onmousedown="SheetEngineModule.startResize('${el.id}', 'se', event)"></div>
          <div class="resize-handle handle-sw" onmousedown="SheetEngineModule.startResize('${el.id}', 'sw', event)"></div>
        ` : ''}

        ${el.locked ? `<span class="lock-indicator" title="Elemento Bloqueado"><i data-lucide="lock"></i></span>` : ''}
      </div>
    `;
  }

  /**
   * Renderizador do Carimbo Técnico (Titleblock) — Bloco F05
   * Suporta 12 campos canônicos, templates NBR 6492, e logo real com aspect ratio preservado.
   */
  function renderCarimboElement(el, sheet) {
    const c = Object.assign({}, el, el.content || {});
    const brand = StudioState.getActiveBrandProfile ? StudioState.getActiveBrandProfile(sheet?.projectId) : null;
    const tb = (StudioState.generateTitleblockData && sheet) ? StudioState.generateTitleblockData(sheet.id, brand?.id, c) : {
      template: c.template || 'abnt_nbr6492',
      escritorio: c.escritorio || c.company || 'ARQVÉRTICE STUDIO DE ARQUITETURA',
      responsavel: c.responsavel || 'Responsável Técnico • CAU/CREA',
      projeto: c.projeto || c.project || 'Residência',
      cliente: c.cliente || c.client || 'Cliente',
      ambiente: c.ambiente || 'Geral',
      desenho: c.desenho || sheet?.title || 'Planta de Apresentação',
      escala: c.escala || c.scale || sheet?.scale || '1:50',
      folha: c.folha || c.sheetNumber || sheet?.sheetNumber || 'PR-01',
      revisao: c.revisao || c.revision || sheet?.revision || 'REV 00',
      data: c.data || c.date || (new Date().toLocaleDateString('pt-BR')),
      autor: c.autor || 'Equipe ArqVértice',
      observacao: c.observacao || 'Desenho preliminar sujeito a aprovação.',
      logoUrl: brand?.assets?.logoPrincipal?.url || 'logo.png',
      tokens: brand?.tokens || StudioState.DEFAULT_BRAND_TOKENS
    };

    const tmpl = c.template || c.titleblockTemplate || tb.template || 'abnt_nbr6492';
    const logoSrc = escapeHTML(c.logoUrl || tb.logoUrl || 'logo.png');

    if (tmpl === 'compacto_horizontal') {
      return `
        <div class="sheet-el-carimbo carimbo-template-compacto">
          <div class="carimbo-compact-left">
            <img src="${logoSrc}" alt="Logo Oficial" class="carimbo-brand-logo" style="max-height: 28px; max-width: 100px; object-fit: contain;" />
            <div class="carimbo-compact-escritorio">${escapeHTML(tb.escritorio)}</div>
          </div>
          <div class="carimbo-compact-center">
            <div class="compact-cell"><strong>PROJETO:</strong> <span>${escapeHTML(tb.projeto)}</span></div>
            <div class="compact-cell"><strong>CLIENTE:</strong> <span>${escapeHTML(tb.cliente)}</span></div>
            <div class="compact-cell"><strong>DESENHO:</strong> <span>${escapeHTML(tb.desenho)}</span></div>
          </div>
          <div class="carimbo-compact-right">
            <div class="compact-badge">ESC: ${escapeHTML(tb.escala)}</div>
            <div class="compact-badge">FL: ${escapeHTML(tb.folha)}</div>
            <div class="compact-badge rev-badge">${escapeHTML(tb.revisao)}</div>
            <div class="compact-date">${escapeHTML(tb.data)}</div>
          </div>
        </div>
      `;
    }

    if (tmpl === 'coluna_lateral') {
      return `
        <div class="sheet-el-carimbo carimbo-template-coluna">
          <div class="carimbo-col-logo-wrap">
            <img src="${logoSrc}" alt="Logo Oficial" class="carimbo-brand-logo" style="max-height: 46px; max-width: 140px; object-fit: contain;" />
            <div class="carimbo-escritorio-title">${escapeHTML(tb.escritorio)}</div>
            <div class="carimbo-resp-sub">${escapeHTML(tb.responsavel)}</div>
          </div>
          <div class="carimbo-col-body">
            <div class="carimbo-field-block">
              <span class="cell-lbl">PROJETO</span>
              <span class="cell-val bold">${escapeHTML(tb.projeto)}</span>
            </div>
            <div class="carimbo-field-block">
              <span class="cell-lbl">CLIENTE</span>
              <span class="cell-val">${escapeHTML(tb.cliente)}</span>
            </div>
            <div class="carimbo-field-block">
              <span class="cell-lbl">AMBIENTE</span>
              <span class="cell-val">${escapeHTML(tb.ambiente)}</span>
            </div>
            <div class="carimbo-field-block">
              <span class="cell-lbl">CONTEÚDO</span>
              <span class="cell-val">${escapeHTML(tb.desenho)}</span>
            </div>
            <div class="carimbo-col-meta-grid">
              <div class="col-meta-item"><span class="cell-lbl">ESCALA</span><span class="cell-val">${escapeHTML(tb.escala)}</span></div>
              <div class="col-meta-item"><span class="cell-lbl">FOLHA</span><span class="cell-val bold">${escapeHTML(tb.folha)}</span></div>
              <div class="col-meta-item"><span class="cell-lbl">REVISÃO</span><span class="cell-val bold rev-text">${escapeHTML(tb.revisao)}</span></div>
              <div class="col-meta-item"><span class="cell-lbl">DATA</span><span class="cell-val">${escapeHTML(tb.data)}</span></div>
            </div>
            <div class="carimbo-field-block">
              <span class="cell-lbl">RESPONSÁVEL TÉCNICO</span>
              <span class="cell-val">${escapeHTML(tb.autor)}</span>
            </div>
          </div>
          <div class="carimbo-col-obs">
            <span class="cell-lbl">OBSERVAÇÕES:</span>
            <p>${escapeHTML(tb.observacao)}</p>
          </div>
        </div>
      `;
    }

    if (tmpl === 'minimalista') {
      return `
        <div class="sheet-el-carimbo carimbo-template-minimalista">
          <div class="minimal-header">
            <img src="${logoSrc}" alt="Logo Oficial" class="carimbo-brand-logo" style="max-height: 24px; max-width: 90px; object-fit: contain;" />
            <div class="minimal-title">${escapeHTML(tb.projeto)} — ${escapeHTML(tb.desenho)}</div>
          </div>
          <div class="minimal-meta">
            <span>${escapeHTML(tb.cliente)}</span>
            <span class="sep">•</span>
            <span>ESC ${escapeHTML(tb.escala)}</span>
            <span class="sep">•</span>
            <span class="bold rev-badge-mini">${escapeHTML(tb.revisao)}</span>
            <span class="sep">•</span>
            <span>${escapeHTML(tb.data)}</span>
            <span class="sep">•</span>
            <span>FL ${escapeHTML(tb.folha)}</span>
          </div>
        </div>
      `;
    }

    // Default: 'abnt_nbr6492' (Executivo Oficial Completo)
    return `
      <div class="sheet-el-carimbo carimbo-template-abnt">
        <!-- Top: Logo Real + Escritório + Responsável -->
        <div class="carimbo-abnt-head">
          <div class="carimbo-logo-wrap">
            <img src="${logoSrc}" alt="Logo Oficial" class="carimbo-brand-logo" style="max-height: 40px; max-width: 140px; object-fit: contain;" />
          </div>
          <div class="carimbo-head-text">
            <strong class="carimbo-escritorio-name">${escapeHTML(tb.escritorio)}</strong>
            <span class="carimbo-responsavel-title">${escapeHTML(tb.responsavel)}</span>
          </div>
        </div>

        <!-- Grade Principal de Identificação (NBR 6492) -->
        <div class="carimbo-abnt-grid">
          <div class="carimbo-cell cell-projeto">
            <span class="cell-lbl">PROJETO:</span>
            <span class="cell-val bold">${escapeHTML(tb.projeto)}</span>
          </div>
          <div class="carimbo-cell cell-cliente">
            <span class="cell-lbl">CLIENTE:</span>
            <span class="cell-val">${escapeHTML(tb.cliente)}</span>
          </div>
          <div class="carimbo-cell cell-ambiente">
            <span class="cell-lbl">AMBIENTE:</span>
            <span class="cell-val">${escapeHTML(tb.ambiente)}</span>
          </div>
          <div class="carimbo-cell cell-desenho">
            <span class="cell-lbl">CONTEÚDO / DESENHO:</span>
            <span class="cell-val bold">${escapeHTML(tb.desenho)}</span>
          </div>
        </div>

        <!-- Barra Técnica de Escala, Prancha e Revisão -->
        <div class="carimbo-abnt-meta">
          <div class="meta-item item-escala">
            <span class="cell-lbl">ESCALA:</span>
            <span class="cell-val font-mono">${escapeHTML(tb.escala)}</span>
          </div>
          <div class="meta-item item-folha">
            <span class="cell-lbl">FOLHA:</span>
            <span class="cell-val bold font-mono">${escapeHTML(tb.folha)}</span>
          </div>
          <div class="meta-item item-revisao">
            <span class="cell-lbl">REVISÃO:</span>
            <span class="cell-val bold rev-pill font-mono">${escapeHTML(tb.revisao)}</span>
          </div>
          <div class="meta-item item-data">
            <span class="cell-lbl">DATA:</span>
            <span class="cell-val font-mono">${escapeHTML(tb.data)}</span>
          </div>
          <div class="meta-item item-autor">
            <span class="cell-lbl">AUTOR:</span>
            <span class="cell-val">${escapeHTML(tb.autor)}</span>
          </div>
        </div>

        <!-- Rodapé de Observações Técnicas -->
        <div class="carimbo-abnt-notes">
          <span class="cell-lbl">NOTAS:</span>
          <span class="cell-notes-text">${escapeHTML(tb.observacao)}</span>
        </div>
      </div>
    `;
  }

  /**
   * Renderizador de Logotipo — Bloco F05
   * Garante preservação estrita de proporção e suporte a margens.
   */
  function renderLogoElement(el, sheet) {
    const c = Object.assign({}, el, el.content || {});
    const brand = StudioState.getActiveBrandProfile ? StudioState.getActiveBrandProfile(sheet?.projectId) : null;
    const logoSrc = escapeHTML(c.src || brand?.assets?.logoPrincipal?.url || 'logo.png');
    const margin = typeof c.margin === 'number' ? c.margin : 0;
    const objectFit = c.objectFit || 'contain';

    return `
      <div class="sheet-el-logo" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: ${margin}px; overflow: hidden;">
        <img src="${logoSrc}" alt="Logo Oficial" style="max-width: 100%; max-height: 100%; width: 100%; height: 100%; object-fit: ${objectFit}; pointer-events: none;" />
      </div>
    `;
  }

  /**
   * Renderiza o conteúdo interno de cada um dos 24 tipos de elemento
   */
  function renderElementContent(el, sheet) {
    const c = el.content || {};
    const s = el.style || {};

    switch (el.type) {
      case 'titulo':
        return `
          <h1 class="sheet-el-title" style="font-size: ${s.fontSize || 24}px; font-weight: ${s.fontWeight || 'bold'}; color: ${s.color || '#0f172a'}; text-align: ${s.textAlign || 'left'}; margin: 0;">
            ${escapeHTML(c.text || 'TÍTULO DO PROJETO')}
          </h1>
        `;

      case 'subtitulo':
        return `
          <h2 class="sheet-el-subtitle" style="font-size: ${s.fontSize || 14}px; color: ${s.color || '#64748b'}; text-align: ${s.textAlign || 'left'}; margin: 0;">
            ${escapeHTML(c.text || 'Subtítulo da Prancha ou Setor')}
          </h2>
        `;

      case 'texto':
        return `
          <div class="sheet-el-text" style="font-size: ${s.fontSize || 13}px; line-height: ${s.lineHeight || 1.6}; color: ${s.color || '#334155'};">
            ${escapeHTML(c.text || 'Texto explicativo do projeto...')}
          </div>
        `;

      case 'imagem':
      case 'render':
      case 'perspectiva':
        return `
          <div class="sheet-el-image-wrap">
            <img 
              src="${c.src || 'assets/placeholder-render.jpg'}" 
              loading="lazy" 
              alt="${escapeHTML(c.caption || 'Visualização Arquitetônica')}"
              class="sheet-img-optimized"
              style="object-fit: ${s.objectFit || 'cover'};"
              onerror="this.src='https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80'"
            />
            ${c.caption ? `<div class="sheet-img-caption">${escapeHTML(c.caption)}</div>` : ''}
          </div>
        `;

      case 'planta':
      case 'planta_humanizada':
        return `
          <div class="sheet-el-plan-wrap">
            <img 
              src="${c.src || 'assets/placeholder-planta.jpg'}" 
              loading="lazy" 
              alt="Planta Baixa"
              class="sheet-img-optimized"
              style="object-fit: contain;"
              onerror="this.src='https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80'"
            />
            ${c.scale ? `<div class="sheet-plan-scale-tag">${escapeHTML(c.scale)}</div>` : ''}
          </div>
        `;

      case 'elevacao':
      case 'corte':
      case 'detalhe':
        return `
          <div class="sheet-el-technical-wrap">
            <div class="tech-box-header">
              <span class="tech-badge">${el.type.toUpperCase()}</span>
              <strong>${escapeHTML(c.title || 'Detalhe Técnico')}</strong>
            </div>
            <div class="tech-box-body">
              <p>${escapeHTML(c.description || 'Especificação construtiva com detalhamento de materiais e alinhamento de esquadrias.')}</p>
            </div>
          </div>
        `;

      case 'tabela':
        const headers = Array.isArray(c.headers) ? c.headers : ['Item', 'Descrição', 'Qtd'];
        const rows = Array.isArray(c.rows) ? c.rows : [['01', 'Item de Exemplo', '1']];
        return `
          <div class="sheet-el-table-wrap">
            <table class="sheet-table">
              <thead>
                <tr>
                  ${headers.map(h => `<th>${escapeHTML(h)}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${rows.map(r => `
                  <tr>
                    ${r.map(cell => `<td>${escapeHTML(cell)}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;

      case 'mobiliario':
        const qtyDisplay = c.quantidade !== undefined && c.quantidade !== null && c.quantidade !== ''
          ? (typeof StudioState !== 'undefined' && StudioState.formatQuantityDisplay ? StudioState.formatQuantityDisplay(c.quantidade, c.unidade || '') : String(c.quantidade))
          : 'NÃO INFORMADO';
        return `
          <div class="sheet-el-card-mob f08-furniture-card" style="width: 100%; height: 100%; display: flex; flex-direction: column; overflow: hidden; border: 1px solid rgba(0,0,0,0.1); border-radius: 4px; background: #fff;">
            ${(c.imagem || c.src) ? `
              <div class="f08-card-media" style="height: 55%; overflow: hidden; background: #f8fafc; display: flex; align-items: center; justify-content: center;">
                <img src="${escapeHTML(c.imagem || c.src)}" alt="${escapeHTML(c.item || c.nome || c.name || 'Mobiliário')}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'" />
              </div>
            ` : '<div class="f08-card-media" style="height: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #94a3b8;">Sem Imagem</div>'}
            <div class="f08-card-content" style="padding: 8px; flex: 1; display: flex; flex-direction: column; gap: 2px; font-size: 11px; line-height: 1.3;">
              <strong class="f08-item-title" style="font-size: 12px; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(c.item || c.nome || c.name || 'Item Mobiliário')}</strong>
              <div class="f08-meta-line"><span style="color: #64748b;">Referência:</span> <span>${escapeHTML(c.referencia || c.reference || 'Conforme projeto')}</span></div>
              <div class="f08-meta-line"><span style="color: #64748b;">Dimensão:</span> <span class="font-mono">${escapeHTML(c.dimensao || c.dimensoes || c.dimensions || 'Não informado')}</span></div>
              <div class="f08-meta-line"><span style="color: #64748b;">Quantidade:</span> <span class="bold font-mono" style="color: ${qtyDisplay === 'NÃO INFORMADO' ? '#e11d48' : '#0f172a'};">${escapeHTML(qtyDisplay)}</span></div>
              <div class="f08-meta-line"><span style="color: #64748b;">Ambiente:</span> <span>${escapeHTML(c.ambiente || 'Geral')}</span></div>
            </div>
          </div>
        `;

      case 'material':
        return `
          <div class="sheet-el-card-mat f08-material-card" style="width: 100%; height: 100%; display: flex; flex-direction: column; overflow: hidden; border: 1px solid rgba(0,0,0,0.1); border-radius: 4px; background: #fff;">
            ${(c.imagem || c.src) ? `
              <div class="f08-card-media" style="height: 50%; overflow: hidden; background: #f8fafc; display: flex; align-items: center; justify-content: center;">
                <img src="${escapeHTML(c.imagem || c.src)}" alt="${escapeHTML(c.nome || c.name || 'Material')}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'" />
              </div>
            ` : '<div class="f08-card-media" style="height: 45%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #94a3b8;">Sem Imagem</div>'}
            <div class="f08-card-content" style="padding: 8px; flex: 1; display: flex; flex-direction: column; gap: 2px; font-size: 11px; line-height: 1.3;">
              <strong class="f08-item-title" style="font-size: 12px; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(c.nome || c.name || 'Material')}</strong>
              <div class="f08-meta-line"><span style="color: #64748b;">Código:</span> <span class="font-mono">${escapeHTML(c.codigo || c.code || 'N/A')}</span></div>
              <div class="f08-meta-line"><span style="color: #64748b;">Fabricante:</span> <span>${escapeHTML(c.fabricante || c.manufacturer || 'Não informado')}</span></div>
              <div class="f08-meta-line"><span style="color: #64748b;">Acabamento:</span> <span>${escapeHTML(c.acabamento || c.finish || 'Padrão')}</span></div>
              <div class="f08-meta-line"><span style="color: #64748b;">Ambiente:</span> <span>${escapeHTML(c.ambiente || 'Geral')}</span></div>
              ${(c.observacao || c.notes) ? `
                <div class="f08-meta-line" style="margin-top: 2px; color: #475569; font-style: italic; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  <span>Obs:</span> ${escapeHTML(c.observacao || c.notes)}
                </div>
              ` : ''}
            </div>
          </div>
        `;

      case 'legenda':
        const items = Array.isArray(c.items) ? c.items : ['01 - Item A', '02 - Item B'];
        return `
          <div class="sheet-el-legend-wrap">
            <div class="legend-title">LEGENDA DO PROJETO</div>
            <ul class="legend-list">
              ${items.map(it => `<li>${escapeHTML(it)}</li>`).join('')}
            </ul>
          </div>
        `;

      case 'norte':
        const angle = typeof c.angle === 'number' ? c.angle : 0;
        return `
          <div class="sheet-el-north" style="transform: rotate(${angle}deg);" title="Norte Magnético: ${angle}°">
            <svg viewBox="0 0 100 100" class="north-svg">
              <circle cx="50" cy="50" r="44" stroke="#0f172a" stroke-width="3" fill="none"/>
              <polygon points="50,12 60,50 50,44 40,50" fill="#0f172a"/>
              <polygon points="50,88 60,50 50,44 40,50" fill="#cbd5e1"/>
              <text x="50" y="8" text-anchor="middle" font-weight="bold" font-size="12" fill="#0f172a">N</text>
            </svg>
          </div>
        `;

      case 'escala_grafica':
        return `
          <div class="sheet-el-graphic-scale">
            <div class="graphic-scale-bar">
              <div class="scale-segment seg-black"></div>
              <div class="scale-segment seg-white"></div>
              <div class="scale-segment seg-black"></div>
              <div class="scale-segment seg-white"></div>
            </div>
            <div class="graphic-scale-labels">
              <span>0</span>
              <span>1m</span>
              <span>2m</span>
              <span>3m</span>
              <span>4m</span>
            </div>
            <div class="graphic-scale-text">${escapeHTML(c.scaleText || '1:50')}</div>
          </div>
        `;

      case 'cota':
        return `
          <div class="sheet-el-cota">
            <div class="cota-line"></div>
            <div class="cota-text">${escapeHTML(c.val || '3.50m')}</div>
          </div>
        `;

      case 'carimbo':
        return renderCarimboElement(el, sheet);

      case 'logo':
        return renderLogoElement(el, sheet);

      case 'linha':
        return `<div class="sheet-el-line" style="border-top: 2px solid ${s.strokeColor || '#0f172a'}; width: 100%; height: 0;"></div>`;

      case 'separador':
        return `<div class="sheet-el-separator" style="border-top: 1px solid ${s.strokeColor || '#cbd5e1'}; width: 100%;"></div>`;

      case 'retangulo':
        return `<div class="sheet-el-rect" style="width: 100%; height: 100%; border: 1px solid ${s.strokeColor || '#94a3b8'}; background: ${s.fillColor || 'transparent'};"></div>`;

      case 'simbolo':
      default:
        return `
          <div class="sheet-el-symbol">
            <i data-lucide="circle-dot"></i>
            <span>${escapeHTML(c.name || 'Símbolo')}</span>
          </div>
        `;
    }
  }

  /**
   * Painel Lateral Direito: Inspetor de Propriedades do Elemento Selecionado
   */
  function renderRightInspector(sheet) {
    if (selectedElementIds.length === 0) {
      const profile = sheet.formatProfile || StudioState.getFormatProfile(sheet.format, sheet.orientation, sheet.margins, sheet.bleed);
      const margins = profile.margins || { top: 7, right: 7, bottom: 7, left: 25 };
      const bleedVal = profile.bleed?.top ?? 3;

      return `
        <aside class="sheet-right-inspector">
          <div class="inspector-header">
            <h4>Inspetor de Prancha</h4>
          </div>
          <div class="inspector-body">
            <div class="form-group mb-3">
              <label class="form-label">Nome da Prancha</label>
              <input type="text" class="form-input form-input-sm" value="${escapeHTML(sheet.name)}" onchange="SheetEngineModule.updateSheetMeta('name', this.value)"/>
            </div>
            <div class="form-group mb-3">
              <label class="form-label">Número</label>
              <input type="text" class="form-input form-input-sm" value="${escapeHTML(sheet.sheetNumber)}" onchange="SheetEngineModule.updateSheetMeta('sheetNumber', this.value)"/>
            </div>

            <!-- Seção de Formato Físico (F03) -->
            <div class="inspector-section mb-3">
              <div class="section-title d-flex justify-content-between align-items-center">
                <span>Formato Físico & Orientação</span>
                <span class="badge badge-subtle text-xs">NBR 10068</span>
              </div>
              
              <div class="form-group mb-2">
                <label class="form-label">Formato</label>
                <select class="form-select form-select-sm" onchange="SheetEngineModule.onFormatChange(this.value)">
                  ${(StudioState.SHEET_FORMATS?.ALL || ['A0','A1','A2','A3','A4','PRANCHA_METRICA']).map(f => `
                    <option value="${f}" ${sheet.format === f ? 'selected' : ''}>${f}</option>
                  `).join('')}
                </select>
              </div>

              <div class="form-group mb-2">
                <label class="form-label">Orientação</label>
                <select class="form-select form-select-sm" onchange="SheetEngineModule.onOrientationChange(this.value)">
                  <option value="landscape" ${sheet.orientation === 'landscape' ? 'selected' : ''}>Paisagem (Horizontal)</option>
                  <option value="portrait" ${sheet.orientation === 'portrait' ? 'selected' : ''}>Retrato (Vertical)</option>
                </select>
              </div>

              <!-- Card de Informações Físicas -->
              <div class="format-profile-card mb-3">
                <div class="profile-card-header">
                  <strong>${escapeHTML(profile.name)}</strong>
                  <span class="profile-unit-tag">Unidade: ${profile.unit}</span>
                </div>
                <div class="profile-metrics-grid">
                  <div class="metric-item">
                    <span class="metric-label">Dimensão Real:</span>
                    <span class="metric-val font-mono">${profile.width} &times; ${profile.height} mm</span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-label">Área Útil:</span>
                    <span class="metric-val font-mono">${profile.printableArea.width} &times; ${profile.printableArea.height} mm</span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-label">Render (pt):</span>
                    <span class="metric-val font-mono text-muted">${profile.renderDimensions?.pt?.width} &times; ${profile.renderDimensions?.pt?.height} pt</span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-label">Tela (96 DPI):</span>
                    <span class="metric-val font-mono text-muted">${profile.renderDimensions?.screenPx?.width} &times; ${profile.renderDimensions?.screenPx?.height} px</span>
                  </div>
                </div>
              </div>

              <!-- Presets Rápidos -->
              <div class="form-group mb-3">
                <label class="form-label text-xs text-muted mb-1">Presets Rápidos Obrigatórios</label>
                <div class="presets-btn-grid">
                  ${[
                    { f: 'A4', o: 'portrait', label: 'A4 Ret' },
                    { f: 'A4', o: 'landscape', label: 'A4 Pai' },
                    { f: 'A3', o: 'portrait', label: 'A3 Ret' },
                    { f: 'A3', o: 'landscape', label: 'A3 Pai' },
                    { f: 'A2', o: 'portrait', label: 'A2 Ret' },
                    { f: 'A2', o: 'landscape', label: 'A2 Pai' },
                    { f: 'A1', o: 'portrait', label: 'A1 Ret' },
                    { f: 'A1', o: 'landscape', label: 'A1 Pai' }
                  ].map(p => `
                    <button 
                      type="button" 
                      class="btn btn-xs ${sheet.format === p.f && sheet.orientation === p.o ? 'btn-primary' : 'btn-outline'}"
                      onclick="SheetEngineModule.selectPreset('${p.f}', '${p.o}')"
                      title="${p.f} ${p.o === 'portrait' ? 'Retrato' : 'Paisagem'}"
                    >
                      ${p.label}
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- Editor de Margens Físicas (mm) -->
              <div class="form-group mb-2">
                <label class="form-label text-xs">Margens Físicas (mm)</label>
                <div class="margins-grid">
                  <div class="margin-input-box">
                    <span class="margin-pos-label">Esq (Fixação)</span>
                    <input type="number" class="form-input form-input-xs" min="0" max="100" value="${margins.left}" onchange="SheetEngineModule.updateMargin('left', this.value)"/>
                  </div>
                  <div class="margin-input-box">
                    <span class="margin-pos-label">Topo</span>
                    <input type="number" class="form-input form-input-xs" min="0" max="100" value="${margins.top}" onchange="SheetEngineModule.updateMargin('top', this.value)"/>
                  </div>
                  <div class="margin-input-box">
                    <span class="margin-pos-label">Dir</span>
                    <input type="number" class="form-input form-input-xs" min="0" max="100" value="${margins.right}" onchange="SheetEngineModule.updateMargin('right', this.value)"/>
                  </div>
                  <div class="margin-input-box">
                    <span class="margin-pos-label">Base</span>
                    <input type="number" class="form-input form-input-xs" min="0" max="100" value="${margins.bottom}" onchange="SheetEngineModule.updateMargin('bottom', this.value)"/>
                  </div>
                </div>
              </div>

              <!-- Editor de Sangria (Bleed) (mm) -->
              <div class="form-group mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <label class="form-label text-xs mb-0">Sangria Técnica (Bleed)</label>
                  <span class="text-xs text-muted font-mono">${bleedVal} mm</span>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <input type="range" class="form-range flex-grow-1" min="0" max="10" step="1" value="${bleedVal}" onchange="SheetEngineModule.updateBleed(this.value)"/>
                  <input type="number" class="form-input form-input-xs" style="width: 55px;" min="0" max="20" value="${bleedVal}" onchange="SheetEngineModule.updateBleed(this.value)"/>
                </div>
              </div>
            </div>

            <div class="form-group mb-3">
              <label class="form-label">Escala Padrão</label>
              <input type="text" class="form-input form-input-sm" value="${escapeHTML(sheet.scale || '1:50')}" onchange="SheetEngineModule.updateSheetMeta('scale', this.value)"/>
            </div>
            <div class="form-group mb-3">
              <label class="form-label">Revisão</label>
              <input type="text" class="form-input form-input-sm" value="${escapeHTML(sheet.revision || 'R00')}" onchange="SheetEngineModule.updateSheetMeta('revision', this.value)"/>
            </div>
            <div class="form-group mb-3">
              <label class="form-label">Status</label>
              <select class="form-select form-select-sm" onchange="SheetEngineModule.updateSheetMeta('status', this.value)">
                ${(StudioState.SHEET_STATUSES?.ALL || ['rascunho','em_revisao','aprovada','finalizada']).map(st => `
                  <option value="${st}" ${sheet.status === st ? 'selected' : ''}>${st}</option>
                `).join('')}
              </select>
            </div>
            <div class="sheet-summary-box">
              <div class="d-flex justify-content-between mb-1">
                <span>Total de Elementos:</span>
                <strong>${sheet.elementCount || 0}</strong>
              </div>
              <div class="d-flex justify-content-between">
                <span>Grupos Ativos:</span>
                <strong>${sheet.groupCount || 0}</strong>
              </div>
            </div>
          </div>
        </aside>
      `;
    }

    // Se houver elemento único selecionado
    const selectedId = selectedElementIds[0];
    const el = (sheet.elements || []).find(e => e.id === selectedId);
    if (!el) return `<aside class="sheet-right-inspector"><p class="p-3 text-muted">Elemento não encontrado.</p></aside>`;

    return `
      <aside class="sheet-right-inspector">
        <div class="inspector-header">
          <h4>Inspetor: ${el.type.toUpperCase()}</h4>
          <span class="element-id-pill">${el.id.substr(0, 8)}</span>
        </div>

        <div class="inspector-body">
          <!-- Transform / Coordenadas -->
          <div class="inspector-section">
            <div class="section-subtitle">Posição & Dimensões (px)</div>
            <div class="row-2col">
              <div class="input-inline">
                <label>X</label>
                <input type="number" value="${Math.round(el.x)}" ${el.locked || el.lockPosition ? 'disabled' : ''} onchange="SheetEngineModule.updateElementTransform('${el.id}', 'x', parseInt(this.value, 10))"/>
              </div>
              <div class="input-inline">
                <label>Y</label>
                <input type="number" value="${Math.round(el.y)}" ${el.locked || el.lockPosition ? 'disabled' : ''} onchange="SheetEngineModule.updateElementTransform('${el.id}', 'y', parseInt(this.value, 10))"/>
              </div>
            </div>
            <div class="row-2col mt-2">
              <div class="input-inline">
                <label>Largura</label>
                <input type="number" value="${Math.round(el.width)}" ${el.locked || el.lockSize ? 'disabled' : ''} onchange="SheetEngineModule.updateElementTransform('${el.id}', 'width', parseInt(this.value, 10))"/>
              </div>
              <div class="input-inline">
                <label>Altura</label>
                <input type="number" value="${Math.round(el.height)}" ${el.locked || el.lockSize ? 'disabled' : ''} onchange="SheetEngineModule.updateElementTransform('${el.id}', 'height', parseInt(this.value, 10))"/>
              </div>
            </div>
            <div class="row-2col mt-2">
              <div class="input-inline">
                <label>Rotação (°)</label>
                <input type="number" value="${el.rotation || 0}" ${el.locked ? 'disabled' : ''} onchange="SheetEngineModule.updateElementTransform('${el.id}', 'rotation', parseInt(this.value, 10))"/>
              </div>
              <div class="input-inline">
                <label>Z-Index</label>
                <input type="number" value="${el.zIndex || 1}" onchange="SheetEngineModule.updateElementTransform('${el.id}', 'zIndex', parseInt(this.value, 10))"/>
              </div>
            </div>
          </div>

          <!-- Bloqueios (Locks) -->
          <div class="inspector-section mt-3">
            <div class="section-subtitle">Bloqueios & Proteção</div>
            <div class="d-flex flex-column gap-2">
              <label class="lock-check-label">
                <input type="checkbox" ${el.locked ? 'checked' : ''} onchange="SheetEngineModule.toggleLock('${el.id}', 'locked', this.checked)"/>
                <span>Bloquear Totalmente</span>
              </label>
              <label class="lock-check-label">
                <input type="checkbox" ${el.lockPosition ? 'checked' : ''} onchange="SheetEngineModule.toggleLock('${el.id}', 'lockPosition', this.checked)"/>
                <span>Bloquear Posição (X / Y)</span>
              </label>
              <label class="lock-check-label">
                <input type="checkbox" ${el.lockSize ? 'checked' : ''} onchange="SheetEngineModule.toggleLock('${el.id}', 'lockSize', this.checked)"/>
                <span>Bloquear Dimensões (W / H)</span>
              </label>
            </div>
          </div>

          <!-- Conteúdo Específico -->
          <div class="inspector-section mt-3">
            <div class="section-subtitle">Conteúdo</div>
            ${renderElementContentInputs(el)}
          </div>

          <!-- Ações Rápidas -->
          <div class="inspector-section mt-3">
            <div class="d-flex gap-2">
              <button class="btn btn-outline btn-sm flex-1" onclick="SheetEngineModule.duplicateSelected()">
                <i data-lucide="copy"></i> Duplicar
              </button>
              <button class="btn btn-danger btn-sm" onclick="SheetEngineModule.deleteSelected()">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </div>
        </div>
      </aside>
    `;
  }

  /**
   * Formulário dinâmico de edição de conteúdo de acordo com o tipo
   */
  function renderElementContentInputs(el) {
    const c = el.content || {};

    if (['titulo', 'subtitulo', 'texto'].includes(el.type)) {
      return `
        <div class="form-group mb-2">
          <label class="form-label">Texto</label>
          <textarea class="form-textarea form-textarea-sm" rows="3" oninput="SheetEngineModule.updateElementContent('${el.id}', 'text', this.value)">${escapeHTML(c.text || '')}</textarea>
        </div>
      `;
    }

    if (['imagem', 'render', 'perspectiva', 'planta', 'planta_humanizada'].includes(el.type)) {
      return `
        <div class="form-group mb-2">
          <label class="form-label">URL da Imagem / Desenho</label>
          <input type="text" class="form-input form-input-sm" value="${escapeHTML(c.src || '')}" onchange="SheetEngineModule.updateElementContent('${el.id}', 'src', this.value)"/>
        </div>
        <div class="form-group mb-2">
          <label class="form-label">Legenda / Descrição</label>
          <input type="text" class="form-input form-input-sm" value="${escapeHTML(c.caption || '')}" onchange="SheetEngineModule.updateElementContent('${el.id}', 'caption', this.value)"/>
        </div>
      `;
    }

    if (el.type === 'norte') {
      return `
        <div class="form-group mb-2">
          <label class="form-label">Ângulo do Norte (°)</label>
          <input type="number" class="form-input form-input-sm" value="${c.angle || 0}" onchange="SheetEngineModule.updateElementContent('${el.id}', 'angle', parseInt(this.value, 10))"/>
        </div>
      `;
    }

    if (el.type === 'escala_grafica') {
      return `
        <div class="form-group mb-2">
          <label class="form-label">Texto da Escala</label>
          <input type="text" class="form-input form-input-sm" value="${escapeHTML(c.scaleText || '1:50')}" onchange="SheetEngineModule.updateElementContent('${el.id}', 'scaleText', this.value)"/>
        </div>
      `;
    }

    if (el.type === 'cota') {
      return `
        <div class="form-group mb-2">
          <label class="form-label">Valor da Cota</label>
          <input type="text" class="form-input form-input-sm" value="${escapeHTML(c.val || '3.50m')}" onchange="SheetEngineModule.updateElementContent('${el.id}', 'val', this.value)"/>
        </div>
      `;
    }

    if (el.type === 'carimbo') {
      const tbTemplates = StudioState.getTitleblockTemplates ? StudioState.getTitleblockTemplates() : [
        { id: 'abnt_nbr6492', name: 'ABNT NBR 6492 (Executivo Oficial)' },
        { id: 'compacto_horizontal', name: 'Compacto Horizontal' },
        { id: 'coluna_lateral', name: 'Coluna Lateral' },
        { id: 'minimalista', name: 'Minimalista' }
      ];

      return `
        <div class="titleblock-inspector-panel">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <label class="form-label mb-0"><strong>Template do Carimbo</strong></label>
            <button type="button" class="btn btn-xs btn-outline" onclick="SheetEngineModule.dockTitleblock('${el.id}')" title="Ancorar exatamente na área útil da prancha">
              <i data-lucide="anchor"></i> Ancorar na Área Útil
            </button>
          </div>
          <select class="form-select form-select-sm mb-3" onchange="SheetEngineModule.updateElementContent('${el.id}', 'template', this.value); SheetEngineModule.dockTitleblock('${el.id}', this.value);">
            ${tbTemplates.map(t => `<option value="${t.id}" ${(c.template || 'abnt_nbr6492') === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}
          </select>

          <div class="titleblock-fields-accordion">
            <div class="form-group mb-2">
              <label class="form-label text-xs">1. Escritório</label>
              <input type="text" class="form-input form-input-sm" value="${escapeHTML(c.escritorio || c.company || '')}" placeholder="ARQVÉRTICE STUDIO" onchange="SheetEngineModule.updateElementContent('${el.id}', 'escritorio', this.value)"/>
            </div>
            <div class="form-group mb-2">
              <label class="form-label text-xs">2. Responsável Técnico</label>
              <input type="text" class="form-input form-input-sm" value="${escapeHTML(c.responsavel || '')}" placeholder="Arquiteto Responsável" onchange="SheetEngineModule.updateElementContent('${el.id}', 'responsavel', this.value)"/>
            </div>
            <div class="form-group mb-2">
              <label class="form-label text-xs">3. Projeto</label>
              <input type="text" class="form-input form-input-sm" value="${escapeHTML(c.projeto || c.project || '')}" placeholder="Nome do Projeto" onchange="SheetEngineModule.updateElementContent('${el.id}', 'projeto', this.value)"/>
            </div>
            <div class="form-group mb-2">
              <label class="form-label text-xs">4. Cliente</label>
              <input type="text" class="form-input form-input-sm" value="${escapeHTML(c.cliente || c.client || '')}" placeholder="Nome do Cliente" onchange="SheetEngineModule.updateElementContent('${el.id}', 'cliente', this.value)"/>
            </div>
            <div class="form-group mb-2">
              <label class="form-label text-xs">5. Ambiente</label>
              <input type="text" class="form-input form-input-sm" value="${escapeHTML(c.ambiente || '')}" placeholder="Ambiente / Setor" onchange="SheetEngineModule.updateElementContent('${el.id}', 'ambiente', this.value)"/>
            </div>
            <div class="form-group mb-2">
              <label class="form-label text-xs">6. Conteúdo / Desenho</label>
              <input type="text" class="form-input form-input-sm" value="${escapeHTML(c.desenho || '')}" placeholder="Planta de Layout" onchange="SheetEngineModule.updateElementContent('${el.id}', 'desenho', this.value)"/>
            </div>
            <div class="d-flex gap-2 mb-2">
              <div class="flex-grow-1">
                <label class="form-label text-xs">7. Escala</label>
                <input type="text" class="form-input form-input-sm" value="${escapeHTML(c.escala || c.scale || '1:50')}" onchange="SheetEngineModule.updateElementContent('${el.id}', 'escala', this.value)"/>
              </div>
              <div class="flex-grow-1">
                <label class="form-label text-xs">8. Folha</label>
                <input type="text" class="form-input form-input-sm" value="${escapeHTML(c.folha || c.sheetNumber || 'PR-01')}" onchange="SheetEngineModule.updateElementContent('${el.id}', 'folha', this.value)"/>
              </div>
            </div>
            <div class="d-flex gap-2 mb-2">
              <div class="flex-grow-1">
                <label class="form-label text-xs">9. Revisão</label>
                <select class="form-select form-select-sm" onchange="SheetEngineModule.updateElementContent('${el.id}', 'revisao', this.value)">
                  ${['REV 00', 'REV 01', 'REV 02', 'REV 03', 'REV 04'].map(r => `
                    <option value="${r}" ${(c.revisao || 'REV 00') === r ? 'selected' : ''}>${r}</option>
                  `).join('')}
                </select>
              </div>
              <div class="flex-grow-1">
                <label class="form-label text-xs">10. Data</label>
                <input type="text" class="form-input form-input-sm" value="${escapeHTML(c.data || c.date || '22/09/2026')}" onchange="SheetEngineModule.updateElementContent('${el.id}', 'data', this.value)"/>
              </div>
            </div>
            <div class="form-group mb-2">
              <label class="form-label text-xs">11. Autor</label>
              <input type="text" class="form-input form-input-sm" value="${escapeHTML(c.autor || '')}" placeholder="Desenhista / Equipe" onchange="SheetEngineModule.updateElementContent('${el.id}', 'autor', this.value)"/>
            </div>
            <div class="form-group mb-2">
              <label class="form-label text-xs">12. Observação</label>
              <textarea class="form-textarea form-textarea-sm" rows="2" onchange="SheetEngineModule.updateElementContent('${el.id}', 'observacao', this.value)">${escapeHTML(c.observacao || '')}</textarea>
            </div>
          </div>
        </div>
      `;
    }

    if (el.type === 'logo') {
      return `
        <div class="logo-inspector-panel">
          <div class="form-group mb-2">
            <label class="form-label text-xs">Origem do Logo (Asset Real)</label>
            <input type="text" class="form-input form-input-sm" value="${escapeHTML(c.src || 'logo.png')}" placeholder="logo.png" onchange="SheetEngineModule.updateElementContent('${el.id}', 'src', this.value)"/>
          </div>
          <div class="form-group mb-2">
            <label class="form-label text-xs">Margem Interna (px)</label>
            <input type="number" class="form-input form-input-sm" value="${c.margin || 0}" min="0" max="60" onchange="SheetEngineModule.updateElementContent('${el.id}', 'margin', parseInt(this.value, 10))"/>
          </div>
          <div class="form-group mb-2">
            <label class="form-label text-xs">Ajuste de Proporção (Nunca Deformar)</label>
            <select class="form-select form-select-sm" onchange="SheetEngineModule.updateElementContent('${el.id}', 'objectFit', this.value)">
              <option value="contain" ${(c.objectFit || 'contain') === 'contain' ? 'selected' : ''}>Conter (Preservar Proporção Sempre)</option>
              <option value="scale-down" ${c.objectFit === 'scale-down' ? 'selected' : ''}>Reduzir sem deformar</option>
            </select>
          </div>
        </div>
      `;
    }

    return `<p class="text-muted small">Propriedades padrão aplicadas.</p>`;
  }

  /**
   * Modal de Escolha de Templates (11 Templates Não-Rígidos)
   */
  function renderTemplateModal(sheet, project) {
    const templates = [
      { id: 'apresentacao_geral', name: 'Apresentação Geral', desc: 'Capa técnica, conceito do projeto, render principal e carimbo oficial.' },
      { id: 'ambiente', name: 'Ambiente', desc: 'Planta de layout do ambiente, 2 renders de pontos de vista e especificações.' },
      { id: 'planta_humanizada', name: 'Planta Humanizada', desc: 'Planta completa, norte magnético, escala gráfica e legenda de cômodos.' },
      { id: 'perspectiva', name: 'Perspectiva', desc: 'Grande perspectiva arquitetônica panorâmica e memorial de volumetria.' },
      { id: 'moodboard', name: 'Moodboard', desc: 'Composição conceitual 3x2 de texturas, paletas e referências visuais.' },
      { id: 'materiais', name: 'Materiais', desc: 'Quadro técnico de especificações de superfícies e amostras de acabamentos.' },
      { id: 'mobiliario', name: 'Mobiliário', desc: 'Cards com especificações de móveis de catálogo, dimensões e fabricantes.' },
      { id: 'quantitativos', name: 'Quantitativos', desc: 'Tabela de resumo físico de materiais e revestimentos calculados.' },
      { id: 'estudo', name: 'Estudo Preliminar', desc: 'Diagramas de zoneamento, estudos de massa e opções comparativas.' },
      { id: 'revisao', name: 'Revisão', desc: 'Histórico de revisões técnicas (R00, R01, R02) com espaço para notas.' },
      { id: 'entrega', name: 'Entrega Definitiva', desc: 'Prancha de fechamento oficial para execução em obra com carimbo completo.' }
    ];

    return `
      <div class="sheet-modal-backdrop" id="sheet-template-modal" style="display: none;" onclick="SheetEngineModule.closeTemplateModal(event)">
        <div class="sheet-modal-card">
          <div class="sheet-modal-header">
            <h3>Aplicar Template de Prancha</h3>
            <button class="btn-close-modal" onclick="SheetEngineModule.closeTemplateModal(event)">&times;</button>
          </div>
          <div class="sheet-modal-body">
            <p class="text-muted small mb-3">
              Selecione uma composição inicial. Todos os elementos inseridos continuam <strong>100% editáveis</strong>, podendo ser reposicionados, alterados ou removidos.
            </p>
            <div class="template-grid">
              ${templates.map(t => `
                <div class="template-card" onclick="SheetEngineModule.applyTemplate('${sheet.id}', '${t.id}', '${project.id}')">
                  <div class="template-icon"><i data-lucide="layout"></i></div>
                  <div class="template-info">
                    <strong>${t.name}</strong>
                    <p>${t.desc}</p>
                  </div>
                  <button class="btn btn-primary btn-xs">Aplicar</button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Modal de Criação de Nova Prancha
   */
  function renderNewSheetModal(project) {
    return `
      <div class="sheet-modal-backdrop" id="sheet-new-modal" style="display: none;" onclick="SheetEngineModule.closeNewSheetModal(event)">
        <div class="sheet-modal-card" style="max-width: 500px;">
          <div class="sheet-modal-header">
            <h3>Cadastrar Nova Prancha</h3>
            <button class="btn-close-modal" onclick="SheetEngineModule.closeNewSheetModal(event)">&times;</button>
          </div>
          <form onsubmit="SheetEngineModule.submitNewSheet(event, '${project.id}')">
            <div class="sheet-modal-body">
              <div class="form-group mb-3">
                <label class="form-label">Nome da Prancha *</label>
                <input type="text" id="new-sheet-name" class="form-input" placeholder="Ex: Plantas Baixas e Layout" required/>
              </div>
              <div class="row-2col mb-3">
                <div class="form-group">
                  <label class="form-label">Número da Prancha</label>
                  <input type="text" id="new-sheet-num" class="form-input" placeholder="Ex: PR-02"/>
                </div>
                <div class="form-group">
                  <label class="form-label">Formato</label>
                  <select id="new-sheet-format" class="form-select">
                    <option value="A3" selected>A3 (420 x 297 mm)</option>
                    <option value="A2">A2 (594 x 420 mm)</option>
                    <option value="A1">A1 (841 x 594 mm)</option>
                    <option value="A0">A0 (1189 x 841 mm)</option>
                    <option value="A4">A4 (297 x 210 mm)</option>
                    <option value="PRANCHA_METRICA">Métrica Especial (1200 x 900 mm)</option>
                  </select>
                </div>
              </div>
              <div class="row-2col mb-3">
                <div class="form-group">
                  <label class="form-label">Orientação</label>
                  <select id="new-sheet-orientation" class="form-select">
                    <option value="landscape" selected>Paisagem (Horizontal)</option>
                    <option value="portrait">Retrato (Vertical)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Escala Padrão</label>
                  <input type="text" id="new-sheet-scale" class="form-input" value="1:50"/>
                </div>
              </div>
              <div class="form-group mb-3">
                <label class="form-label">Template Inicial (Opcional)</label>
                <select id="new-sheet-template" class="form-select">
                  <option value="">Prancha em Branco</option>
                  <option value="apresentacao_geral">Apresentação Geral</option>
                  <option value="ambiente">Ambiente</option>
                  <option value="planta_humanizada">Planta Humanizada</option>
                  <option value="perspectiva">Perspectiva</option>
                  <option value="moodboard">Moodboard</option>
                  <option value="materiais">Materiais</option>
                  <option value="mobiliario">Mobiliário</option>
                  <option value="quantitativos">Quantitativos</option>
                  <option value="estudo">Estudo Preliminar</option>
                  <option value="revisao">Revisão</option>
                  <option value="entrega">Entrega Definitiva</option>
                </select>
              </div>
            </div>
            <div class="sheet-modal-footer">
              <button type="button" class="btn btn-outline" onclick="SheetEngineModule.closeNewSheetModal(event)">Cancelar</button>
              <button type="submit" class="btn btn-primary">Criar Prancha</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  /**
   * Estado vazio quando o projeto não possui pranchas
   */
  function renderEmptySheetState(project) {
    return `
      <div class="sheet-empty-state animate-fade-in">
        <div class="empty-box-card">
          <div class="empty-icon"><i data-lucide="layout"></i></div>
          <h2>Motor de Pranchas do ArqVértice Studio</h2>
          <p class="text-muted">
            Crie pranchas profissionais para apresentação e revisão do projeto <strong>${escapeHTML(project.name)}</strong>.<br/>
            Diagramação com grid, snap, alinhamentos, agrupamentos e templates flexíveis.
          </p>
          <div class="d-flex justify-content-center gap-3 mt-4">
            <button class="btn btn-primary" onclick="SheetEngineModule.createFirstSheet('${project.id}', 'apresentacao_geral')">
              <i data-lucide="sparkles"></i> Criar com Apresentação Geral
            </button>
            <button class="btn btn-outline" onclick="SheetEngineModule.createFirstSheet('${project.id}', '')">
              <i data-lucide="plus"></i> Prancha em Branco (A3)
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // INTERAÇÕES E DISPATCHERS PÚBLICOS
  // =========================================================================

  function setActiveSheet(sheetId) {
    activeSheetId = sheetId;
    selectedElementIds = [];
    refreshUI();
  }

  function adjustZoom(delta) {
    zoomLevel = Math.max(0.2, Math.min(2.0, zoomLevel + delta));
    refreshUI();
  }

  function resetZoom() {
    zoomLevel = 0.65;
    refreshUI();
  }

  function toggleGrid() {
    showGrid = !showGrid;
    refreshUI();
  }

  function toggleSnap() {
    snapToGrid = !snapToGrid;
    refreshUI();
  }

  function togglePreviewMode() {
    previewMode = previewMode === 'editor' ? 'preview_fidelidade' : 'editor';
    selectedElementIds = [];
    refreshUI();
  }

  function selectElement(elementId, event) {
    if (event) event.stopPropagation();
    if (event && (event.shiftKey || event.ctrlKey)) {
      if (selectedElementIds.includes(elementId)) {
        selectedElementIds = selectedElementIds.filter(id => id !== elementId);
      } else {
        selectedElementIds.push(elementId);
      }
    } else {
      selectedElementIds = [elementId];
    }
    refreshUI();
  }

  function handleCanvasClick(event) {
    // Se clicar fora dos elementos, limpa seleção
    if (event.target.id === 'sheet-viewport' || event.target.id === 'sheet-paper' || event.target.classList.contains('sheet-border-margin')) {
      selectedElementIds = [];
      refreshUI();
    }
  }

  function quickAddElement(type) {
    if (!activeSheetId) return;
    const sheet = StudioState.getSheet(activeSheetId);
    if (!sheet) return;

    const dims = sheet.dimensions || { widthPx: 1587, heightPx: 1122 };
    const defaultX = 60 + (sheet.elements.length % 5) * 30;
    const defaultY = 60 + (sheet.elements.length % 5) * 30;

    let width = 240;
    let height = 120;
    let content = {};

    switch (type) {
      case 'titulo':
        width = 400; height = 45; content = { text: 'TÍTULO DA PRANCHA' };
        break;
      case 'subtitulo':
        width = 350; height = 30; content = { text: 'Subtítulo explicativo' };
        break;
      case 'texto':
        width = 300; height = 120; content = { text: 'Insira o texto descritivo aqui...' };
        break;
      case 'imagem':
      case 'render':
      case 'perspectiva':
        width = 450; height = 300; content = { caption: 'Perspectiva Arquitetônica' };
        break;
      case 'planta':
      case 'planta_humanizada':
        width = 500; height = 380; content = { scale: '1:50' };
        break;
      case 'tabela':
        width = 400; height = 180; content = { headers: ['Item', 'Qtd', 'Unid'], rows: [['Piso', '100', 'm²']] };
        break;
      case 'norte':
        width = 60; height = 60; content = { angle: 0 };
        break;
      case 'escala_grafica':
        width = 160; height = 35; content = { scaleText: '1:50' };
        break;
      case 'carimbo':
        width = 340; height = 100;
        content = { company: 'ARQVÉRTICE STUDIO', sheetNumber: sheet.sheetNumber, scale: sheet.scale };
        break;
      default:
        width = 200; height = 100; content = {};
        break;
    }

    const created = StudioState.addSheetElement(activeSheetId, {
      type,
      x: defaultX,
      y: defaultY,
      width,
      height,
      content
    }, 'Usuário');

    selectedElementIds = [created.id];
    refreshUI();
  }

  function startDragElement(elementId, event) {
    if (previewMode === 'preview_fidelidade') return;
    const el = StudioState.getSheetElement(elementId);
    if (!el || el.locked || el.lockPosition) return;

    isDragging = true;
    dragStartPos = {
      mouseX: event.clientX,
      mouseY: event.clientY,
      elX: el.x,
      elY: el.y
    };

    function onMouseMove(e) {
      if (!isDragging) return;
      const dx = (e.clientX - dragStartPos.mouseX) / zoomLevel;
      const dy = (e.clientY - dragStartPos.mouseY) / zoomLevel;

      let newX = dragStartPos.elX + dx;
      let newY = dragStartPos.elY + dy;

      if (snapToGrid) {
        newX = Math.round(newX / gridSize) * gridSize;
        newY = Math.round(newY / gridSize) * gridSize;
      }

      StudioState.moveSheetElement(elementId, Math.round(newX), Math.round(newY), 'Usuário');
      const box = document.getElementById(`el-box-${elementId}`);
      if (box) {
        box.style.left = `${Math.round(newX)}px`;
        box.style.top = `${Math.round(newY)}px`;
      }
    }

    function onMouseUp() {
      isDragging = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      refreshUI();
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  function startResize(elementId, handle, event) {
    event.stopPropagation();
    const el = StudioState.getSheetElement(elementId);
    if (!el || el.locked || el.lockSize) return;

    const startMouseX = event.clientX;
    const startMouseY = event.clientY;
    const startW = el.width;
    const startH = el.height;

    function onMouseMove(e) {
      const dx = (e.clientX - startMouseX) / zoomLevel;
      const dy = (e.clientY - startMouseY) / zoomLevel;

      let newW = Math.max(40, startW + dx);
      let newH = Math.max(20, startH + dy);

      if (snapToGrid) {
        newW = Math.round(newW / gridSize) * gridSize;
        newH = Math.round(newH / gridSize) * gridSize;
      }

      StudioState.resizeSheetElement(elementId, Math.round(newW), Math.round(newH), 'Usuário');
      const box = document.getElementById(`el-box-${elementId}`);
      if (box) {
        box.style.width = `${Math.round(newW)}px`;
        box.style.height = `${Math.round(newH)}px`;
      }
    }

    function onMouseUp() {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      refreshUI();
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  function updateElementTransform(elementId, prop, val) {
    if (isNaN(val)) return;
    const updates = {};
    updates[prop] = val;
    StudioState.updateSheetElement(elementId, updates, 'Usuário');
    refreshUI();
  }

  function updateElementContent(elementId, key, val) {
    const el = StudioState.getSheetElement(elementId);
    if (!el) return;
    const content = el.content || {};
    content[key] = val;
    StudioState.updateSheetElement(elementId, { content }, 'Usuário');
    refreshUI();
  }

  function toggleLock(elementId, lockType, isChecked) {
    const opts = {};
    opts[lockType] = isChecked;
    if (lockType === 'locked') {
      StudioState.lockSheetElement(elementId, isChecked, {}, 'Usuário');
    } else {
      StudioState.updateSheetElement(elementId, opts, 'Usuário');
    }
    refreshUI();
  }

  function updateSheetMeta(field, val) {
    if (!activeSheetId) return;
    const updates = {};
    updates[field] = val;
    StudioState.updateSheet(activeSheetId, updates, 'Usuário');
    refreshUI();
  }

  function alignSelection(alignmentType) {
    if (!activeSheetId || selectedElementIds.length < 2) return;
    try {
      StudioState.alignSheetElements(activeSheetId, selectedElementIds, alignmentType, 'Usuário');
      refreshUI();
    } catch (e) {
      alert(e.message);
    }
  }

  function distributeSelection(direction) {
    if (!activeSheetId || selectedElementIds.length < 3) return;
    try {
      StudioState.distributeSheetElements(activeSheetId, selectedElementIds, direction, 'Usuário');
      refreshUI();
    } catch (e) {
      alert(e.message);
    }
  }

  function groupSelected() {
    if (!activeSheetId || selectedElementIds.length < 2) return;
    StudioState.groupSheetElements(activeSheetId, selectedElementIds, 'Grupo Selecionado', 'Usuário');
    refreshUI();
  }

  function ungroupSelected() {
    if (!activeSheetId || selectedElementIds.length === 0) return;
    const sheet = StudioState.getSheet(activeSheetId);
    if (!sheet) return;

    selectedElementIds.forEach(id => {
      const el = sheet.elements.find(e => e.id === id);
      if (el && el.groupId) {
        StudioState.ungroupSheetElements(activeSheetId, el.groupId, 'Usuário');
      }
    });
    refreshUI();
  }

  function duplicateSelected() {
    if (!activeSheetId || selectedElementIds.length === 0) return;
    const newSelected = [];
    selectedElementIds.forEach(id => {
      const dup = StudioState.duplicateSheetElement(id, { x: 30, y: 30 }, 'Usuário');
      newSelected.push(dup.id);
    });
    selectedElementIds = newSelected;
    refreshUI();
  }

  function deleteSelected() {
    if (!activeSheetId || selectedElementIds.length === 0) return;
    if (!confirm(`Deseja excluir ${selectedElementIds.length} elemento(s) selecionado(s)?`)) return;

    selectedElementIds.forEach(id => {
      try {
        StudioState.deleteSheetElement(id, 'Usuário');
      } catch (e) {
        console.warn(e.message);
      }
    });
    selectedElementIds = [];
    refreshUI();
  }

  function duplicateCurrentSheet(sheetId) {
    const dup = StudioState.duplicateSheet(sheetId, null, 'Usuário');
    activeSheetId = dup.id;
    selectedElementIds = [];
    refreshUI();
  }

  function deleteCurrentSheet(sheetId) {
    if (!confirm('Deseja realmente excluir esta prancha e todos os seus elementos?')) return;
    const sheet = StudioState.getSheet(sheetId);
    const projectId = sheet ? sheet.projectId : null;
    StudioState.deleteSheet(sheetId, 'Usuário');

    if (projectId) {
      const remaining = StudioState.getProjectSheets(projectId);
      activeSheetId = remaining.length > 0 ? remaining[0].id : null;
    } else {
      activeSheetId = null;
    }
    selectedElementIds = [];
    refreshUI();
  }

  function openTemplateModal() {
    const modal = document.getElementById('sheet-template-modal');
    if (modal) modal.style.display = 'flex';
  }

  function closeTemplateModal(event) {
    if (event && event.target !== event.currentTarget && !event.target.classList.contains('btn-close-modal')) return;
    const modal = document.getElementById('sheet-template-modal');
    if (modal) modal.style.display = 'none';
  }

  function applyTemplate(sheetId, templateType, projectId) {
    const project = StudioState.getProject(projectId);
    const client = StudioState.getClient(project ? project.clientId : null);

    StudioState.applySheetTemplate(sheetId, templateType, {
      projectName: project ? project.name : '',
      clientName: client ? client.name : ''
    }, 'Usuário');

    closeTemplateModal();
    selectedElementIds = [];
    refreshUI();
  }

  function openNewSheetModal() {
    const modal = document.getElementById('sheet-new-modal');
    if (modal) modal.style.display = 'flex';
  }

  function closeNewSheetModal(event) {
    if (event && event.target !== event.currentTarget && !event.target.classList.contains('btn-close-modal')) return;
    const modal = document.getElementById('sheet-new-modal');
    if (modal) modal.style.display = 'none';
  }

  function submitNewSheet(event, projectId) {
    event.preventDefault();
    const name = document.getElementById('new-sheet-name').value;
    const num = document.getElementById('new-sheet-num').value;
    const format = document.getElementById('new-sheet-format').value;
    const orientation = document.getElementById('new-sheet-orientation').value;
    const scale = document.getElementById('new-sheet-scale').value;
    const template = document.getElementById('new-sheet-template').value;

    const newSheet = StudioState.createSheet({
      projectId,
      name,
      sheetNumber: num,
      format,
      orientation,
      scale,
      template: template || undefined
    }, 'Usuário');

    activeSheetId = newSheet.id;
    selectedElementIds = [];
    closeNewSheetModal();
    refreshUI();
  }

  function createFirstSheet(projectId, templateType) {
    const newSheet = StudioState.createSheet({
      projectId,
      name: 'Prancha de Apresentação',
      sheetNumber: 'PR-01',
      format: 'A3',
      orientation: 'landscape',
      scale: '1:50',
      template: templateType || undefined
    }, 'Usuário');

    activeSheetId = newSheet.id;
    selectedElementIds = [];
    refreshUI();
  }

  // ==========================================================================
  // Métodos de Controle de Formato Físico, Guias e Margens (F03)
  // ==========================================================================

  function togglePrintableArea() {
    showPrintableArea = !showPrintableArea;
    refreshUI();
  }

  function toggleBleed() {
    showBleed = !showBleed;
    refreshUI();
  }

  function toggleSafeArea() {
    showSafeArea = !showSafeArea;
    refreshUI();
  }

  function onFormatChange(newFormat) {
    if (!activeSheetId) return;
    const current = StudioState.getSheet(activeSheetId);
    if (!current || current.format === newFormat) return;

    const risk = StudioState.checkSheetFormatChangeRisk(activeSheetId, newFormat, current.orientation);
    if (risk && risk.willClip) {
      pendingFormatChange = {
        targetFormat: newFormat,
        targetOrientation: current.orientation,
        risk
      };
      refreshUI();
    } else {
      StudioState.setSheetFormatProfile(activeSheetId, { format: newFormat }, { rescaleElements: 'proportional_fit' }, 'Usuário');
      refreshUI();
    }
  }

  function onOrientationChange(newOrientation) {
    if (!activeSheetId) return;
    const current = StudioState.getSheet(activeSheetId);
    if (!current || current.orientation === newOrientation) return;

    const risk = StudioState.checkSheetFormatChangeRisk(activeSheetId, current.format, newOrientation);
    if (risk && risk.willClip) {
      pendingFormatChange = {
        targetFormat: current.format,
        targetOrientation: newOrientation,
        risk
      };
      refreshUI();
    } else {
      StudioState.setSheetFormatProfile(activeSheetId, { orientation: newOrientation }, { rescaleElements: 'proportional_fit' }, 'Usuário');
      refreshUI();
    }
  }

  function selectPreset(format, orientation) {
    if (!activeSheetId) return;
    const current = StudioState.getSheet(activeSheetId);
    if (!current) return;
    if (current.format === format && current.orientation === orientation) return;

    const risk = StudioState.checkSheetFormatChangeRisk(activeSheetId, format, orientation);
    if (risk && risk.willClip) {
      pendingFormatChange = {
        targetFormat: format,
        targetOrientation: orientation,
        risk
      };
      refreshUI();
    } else {
      StudioState.setSheetFormatProfile(activeSheetId, { format, orientation }, { rescaleElements: 'proportional_fit' }, 'Usuário');
      refreshUI();
    }
  }

  function confirmFormatChange(rescaleMode) {
    if (!activeSheetId || !pendingFormatChange) return;
    const { targetFormat, targetOrientation } = pendingFormatChange;
    StudioState.setSheetFormatProfile(
      activeSheetId,
      { format: targetFormat, orientation: targetOrientation },
      { rescaleElements: rescaleMode || 'proportional_fit' },
      'Usuário'
    );
    pendingFormatChange = null;
    refreshUI();
  }

  function cancelFormatChange() {
    pendingFormatChange = null;
    refreshUI();
  }

  function updateMargin(side, value) {
    if (!activeSheetId) return;
    const numVal = parseFloat(value);
    if (isNaN(numVal) || numVal < 0) return;
    const current = StudioState.getSheet(activeSheetId);
    const currentMargins = current?.formatProfile?.margins || { top: 7, right: 7, bottom: 7, left: 25 };
    const newMargins = { ...currentMargins, [side]: numVal };
    StudioState.updateSheetMargins(activeSheetId, newMargins, 'Usuário');
    refreshUI();
  }

  function updateBleed(value) {
    if (!activeSheetId) return;
    const numVal = parseFloat(value);
    if (isNaN(numVal) || numVal < 0) return;
    StudioState.updateSheetBleed(activeSheetId, { top: numVal, right: numVal, bottom: numVal, left: numVal }, 'Usuário');
    refreshUI();
  }

  /**
   * Modal de Alerta de Corte ao Alterar Formato (F03)
   */
  function renderClipWarningModal(sheet) {
    if (!pendingFormatChange) return '';
    const { targetFormat, targetOrientation, risk } = pendingFormatChange;
    const count = risk?.overflowElements?.length || 0;
    const orientLabel = targetOrientation === 'portrait' ? 'Retrato' : 'Paisagem';

    return `
      <div class="sheet-modal-backdrop active" id="sheet-clip-warning-modal" style="display: flex;">
        <div class="sheet-modal clip-warning-modal animate-scale-up" style="max-width: 540px;">
          <div class="sheet-modal-header bg-warning-subtle d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center gap-2">
              <i data-lucide="alert-triangle" class="text-warning"></i>
              <h4 class="mb-0">Aviso: Risco de Corte de Conteúdo</h4>
            </div>
            <button class="btn-icon-sm" onclick="SheetEngineModule.cancelFormatChange()">&times;</button>
          </div>
          <div class="sheet-modal-body p-3">
            <p class="mb-3 text-sm">
              A alteração de formato para <strong>${targetFormat} (${orientLabel})</strong> reduzirá a área disponível.
              Detectamos que <strong>${count} elemento(s)</strong> ultrapassam o novo espaço e podem ser cortados ou ficar fora da folha.
            </p>
            <div class="clip-risk-box p-2 mb-3 bg-secondary-subtle rounded border">
              <div class="text-xs text-muted mb-1">Fatores de Escala Calculados para Enquadramento:</div>
              <div class="d-flex gap-4 font-mono text-sm">
                <span>Largura: <strong>${((risk?.scaleFactorX || 1) * 100).toFixed(1)}%</strong></span>
                <span>Altura: <strong>${((risk?.scaleFactorY || 1) * 100).toFixed(1)}%</strong></span>
              </div>
            </div>
            <p class="text-xs text-muted mb-0">
              Como você deseja proceder com os elementos existentes na nova prancha?
            </p>
          </div>
          <div class="sheet-modal-footer p-3 d-flex justify-content-end gap-2 border-top">
            <button class="btn btn-ghost btn-sm" onclick="SheetEngineModule.cancelFormatChange()">
              Cancelar
            </button>
            <button class="btn btn-outline btn-sm text-warning" onclick="SheetEngineModule.confirmFormatChange('none')">
              Manter Tamanhos (Pode Cortar)
            </button>
            <button class="btn btn-primary btn-sm" onclick="SheetEngineModule.confirmFormatChange('proportional_fit')">
              <i data-lucide="shrink"></i> Redimensionar Proporcionalmente
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // BLOCO F05: Métodos de Identidade Visual, Brand Assets e Carimbo
  // ==========================================================================

  function openBrandModal() {
    const modal = document.getElementById('sheet-brand-modal');
    if (modal) modal.style.display = 'flex';
  }

  function closeBrandModal(event) {
    if (event && event.target !== event.currentTarget && !event.target.classList.contains('btn-close-modal')) return;
    const modal = document.getElementById('sheet-brand-modal');
    if (modal) modal.style.display = 'none';
  }

  function handleBrandAssetUpload(assetType, inputEl) {
    if (!inputEl || !inputEl.files || !inputEl.files[0]) return;
    const file = inputEl.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      const dataUrl = e.target.result;
      const img = new Image();
      img.onload = function() {
        const project = StudioState.getActiveProject();
        const activeBrand = StudioState.getActiveBrandProfile(project?.id);
        if (activeBrand) {
          StudioState.uploadBrandAsset(activeBrand.id, assetType, {
            dataUrl,
            url: dataUrl,
            fileName: file.name,
            width: img.naturalWidth || 320,
            height: img.naturalHeight || 80,
            mimeType: file.type
          }, 'Usuário');
          refreshUI();
          openBrandModal();
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  function updateBrandToken(tokenKey, tokenVal) {
    const project = StudioState.getActiveProject();
    const activeBrand = StudioState.getActiveBrandProfile(project?.id);
    if (!activeBrand) return;
    const tokens = { ...(activeBrand.tokens || {}), [tokenKey]: tokenVal };
    StudioState.updateBrandProfile(activeBrand.id, { tokens }, 'Usuário');
    refreshUI();
    openBrandModal();
  }

  function updateBrandRevisionFormat(formatVal) {
    const project = StudioState.getActiveProject();
    const activeBrand = StudioState.getActiveBrandProfile(project?.id);
    if (!activeBrand) return;
    const revisionConfig = { ...(activeBrand.revisionConfig || {}), format: formatVal };
    StudioState.updateBrandProfile(activeBrand.id, { revisionConfig }, 'Usuário');
    refreshUI();
    openBrandModal();
  }

  function incrementBrandRevision() {
    const project = StudioState.getActiveProject();
    const activeBrand = StudioState.getActiveBrandProfile(project?.id);
    if (!activeBrand) return;
    const revConfig = activeBrand.revisionConfig || {};
    const currentNum = parseInt(String(revConfig.currentRev || '0').replace(/\D/g, '') || '0', 10);
    const nextNum = currentNum + 1;
    const nextCode = StudioState.formatRevisionString(nextNum, revConfig.format || 'REV {NN}');

    const history = Array.isArray(revConfig.history) ? [...revConfig.history] : [];
    history.push({
      code: nextCode,
      date: new Date().toLocaleDateString('pt-BR'),
      description: `Revisão técnica ${nextCode}`
    });

    const revisionConfig = {
      ...revConfig,
      currentRev: String(nextNum).padStart(2, '0'),
      history
    };

    StudioState.updateBrandProfile(activeBrand.id, { revisionConfig }, 'Usuário');

    // Se houver prancha ativa, atualiza a revisão dela também
    if (activeSheetId) {
      StudioState.updateSheet(activeSheetId, { revision: nextCode }, 'Usuário');
    }

    refreshUI();
    openBrandModal();
  }

  function dockTitleblock(elementId, templateId = null) {
    if (!activeSheetId) return;
    const el = StudioState.getSheetElement(elementId);
    if (!el) return;
    const targetTmpl = templateId || el.content?.template || 'abnt_nbr6492';
    const pos = StudioState.recalculateTitleblockPosition(activeSheetId, targetTmpl);

    StudioState.updateSheetElement(elementId, {
      x: pos.x,
      y: pos.y,
      width: pos.width,
      height: pos.height,
      content: {
        ...(el.content || {}),
        template: targetTmpl
      }
    }, 'Usuário');
    refreshUI();
  }

  function applyOfficialTitleblock() {
    if (!activeSheetId) return;
    const sheet = StudioState.getSheet(activeSheetId);
    if (!sheet) return;

    // Se já houver carimbo, apenas doca e atualiza
    const existing = (sheet.elements || []).find(e => e.type === 'carimbo');
    if (existing) {
      dockTitleblock(existing.id, 'abnt_nbr6492');
      closeBrandModal();
      return;
    }

    // Cria novo carimbo oficial no canto inferior direito
    const pos = StudioState.recalculateTitleblockPosition(activeSheetId, 'abnt_nbr6492');
    const brand = StudioState.getActiveBrandProfile(sheet.projectId);
    const tbData = StudioState.generateTitleblockData(sheet.id, brand?.id);

    StudioState.addSheetElement(activeSheetId, {
      type: 'carimbo',
      x: pos.x,
      y: pos.y,
      width: pos.width,
      height: pos.height,
      content: {
        template: 'abnt_nbr6492',
        ...tbData
      }
    }, 'Usuário');

    closeBrandModal();
    refreshUI();
  }

  function renderBrandModal(currentSheet, project) {
    const activeBrand = StudioState.getActiveBrandProfile ? StudioState.getActiveBrandProfile(project?.id) : null;
    if (!activeBrand) return '';

    const assets = activeBrand.assets || {};
    const tokens = activeBrand.tokens || StudioState.DEFAULT_BRAND_TOKENS || {};
    const revConfig = activeBrand.revisionConfig || {};

    return `
      <div class="sheet-modal-backdrop" id="sheet-brand-modal" style="display: none;" onclick="SheetEngineModule.closeBrandModal(event)">
        <div class="sheet-modal-card brand-modal-card animate-scale-up" style="max-width: 820px;">
          <div class="sheet-modal-header d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center gap-2">
              <i data-lucide="award" class="text-primary"></i>
              <h3 class="mb-0">Identidade Visual & Carimbo Técnico</h3>
            </div>
            <button class="btn-close-modal" onclick="SheetEngineModule.closeBrandModal(event)">&times;</button>
          </div>

          <div class="sheet-modal-body p-4" style="max-height: 78vh; overflow-y: auto;">
            <!-- Aviso de integridade -->
            <div class="alert alert-info py-2 px-3 mb-4 text-xs d-flex align-items-center gap-2 border">
              <i data-lucide="info"></i>
              <span>O ArqVértice Studio utiliza os assets reais fornecidos pelo usuário. Logos nunca são inventados ou deformados.</span>
            </div>

            <!-- Seção 1: Brand Assets Reais -->
            <div class="brand-section mb-4">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h5 class="mb-0 text-sm font-semibold">1. Brand Assets (Logos & Elementos Reais)</h5>
                <span class="badge badge-subtle text-xs">Upload Real Suportado</span>
              </div>
              <div class="brand-assets-grid">
                <!-- Logo Principal -->
                <div class="asset-card">
                  <div class="asset-card-head">
                    <span class="asset-type-name">Logo Principal</span>
                    <span class="badge text-xs">${assets.logoPrincipal?.aspectRatio ? `Proporção ${assets.logoPrincipal.aspectRatio}:1` : 'Original'}</span>
                  </div>
                  <div class="asset-preview-box">
                    <img src="${escapeHTML(assets.logoPrincipal?.url || 'logo.png')}" alt="Logo Principal" style="max-height: 52px; max-width: 100%; object-fit: contain;" />
                  </div>
                  <label class="btn btn-outline btn-xs w-100 mt-2 cursor-pointer">
                    <i data-lucide="upload"></i> Carregar Logo Real
                    <input type="file" accept="image/*" style="display: none;" onchange="SheetEngineModule.handleBrandAssetUpload('logoPrincipal', this)"/>
                  </label>
                </div>

                <!-- Logo Monocromático -->
                <div class="asset-card">
                  <div class="asset-card-head">
                    <span class="asset-type-name">Logo Monocromático</span>
                  </div>
                  <div class="asset-preview-box bg-dark">
                    <img src="${escapeHTML(assets.logoMonocromatico?.url || 'logo.png')}" alt="Logo Monocromático" style="max-height: 52px; max-width: 100%; object-fit: contain; filter: grayscale(100%);" />
                  </div>
                  <label class="btn btn-outline btn-xs w-100 mt-2 cursor-pointer">
                    <i data-lucide="upload"></i> Carregar Monocromático
                    <input type="file" accept="image/*" style="display: none;" onchange="SheetEngineModule.handleBrandAssetUpload('logoMonocromatico', this)"/>
                  </label>
                </div>

                <!-- Símbolo / Ícone -->
                <div class="asset-card">
                  <div class="asset-card-head">
                    <span class="asset-type-name">Símbolo</span>
                  </div>
                  <div class="asset-preview-box">
                    <img src="${escapeHTML(assets.simbolo?.url || 'logo.png')}" alt="Símbolo" style="max-height: 48px; max-width: 48px; object-fit: contain;" />
                  </div>
                  <label class="btn btn-outline btn-xs w-100 mt-2 cursor-pointer">
                    <i data-lucide="upload"></i> Carregar Símbolo
                    <input type="file" accept="image/*" style="display: none;" onchange="SheetEngineModule.handleBrandAssetUpload('simbolo', this)"/>
                  </label>
                </div>

                <!-- Favicon -->
                <div class="asset-card">
                  <div class="asset-card-head">
                    <span class="asset-type-name">Favicon</span>
                  </div>
                  <div class="asset-preview-box">
                    <img src="${escapeHTML(assets.favicon?.url || 'logo.png')}" alt="Favicon" style="max-height: 32px; max-width: 32px; object-fit: contain;" />
                  </div>
                  <label class="btn btn-outline btn-xs w-100 mt-2 cursor-pointer">
                    <i data-lucide="upload"></i> Carregar Favicon
                    <input type="file" accept="image/*" style="display: none;" onchange="SheetEngineModule.handleBrandAssetUpload('favicon', this)"/>
                  </label>
                </div>

                <!-- Assinatura Técnica -->
                <div class="asset-card">
                  <div class="asset-card-head">
                    <span class="asset-type-name">Assinatura / Selo</span>
                  </div>
                  <div class="asset-preview-box">
                    <img src="${escapeHTML(assets.assinatura?.url || 'logo.png')}" alt="Assinatura" style="max-height: 40px; max-width: 100%; object-fit: contain;" />
                  </div>
                  <label class="btn btn-outline btn-xs w-100 mt-2 cursor-pointer">
                    <i data-lucide="upload"></i> Carregar Assinatura
                    <input type="file" accept="image/*" style="display: none;" onchange="SheetEngineModule.handleBrandAssetUpload('assinatura', this)"/>
                  </label>
                </div>

                <!-- Elementos Gráficos -->
                <div class="asset-card">
                  <div class="asset-card-head">
                    <span class="asset-type-name">Elementos Gráficos</span>
                    <span class="badge text-xs">${(assets.elementosGraficos || []).length} items</span>
                  </div>
                  <div class="asset-preview-box d-flex flex-wrap gap-1 p-1">
                    ${(assets.elementosGraficos || []).length > 0 ? assets.elementosGraficos.slice(0, 3).map(eg => `
                      <img src="${escapeHTML(eg.url)}" style="max-height: 30px; object-fit: contain;" />
                    `).join('') : '<span class="text-muted text-xs">Nenhum adicional</span>'}
                  </div>
                  <label class="btn btn-outline btn-xs w-100 mt-2 cursor-pointer">
                    <i data-lucide="plus"></i> Adicionar Gráfico
                    <input type="file" accept="image/*" style="display: none;" onchange="SheetEngineModule.handleBrandAssetUpload('elementosGraficos', this)"/>
                  </label>
                </div>
              </div>
            </div>

            <!-- Seção 2: Tokens Editáveis de Cores -->
            <div class="brand-section mb-4">
              <h5 class="mb-2 text-sm font-semibold">2. Tokens de Cor da Apresentação (Editáveis)</h5>
              <div class="tokens-color-grid">
                ${Object.entries({
                  primary: 'Primary (Principal)',
                  secondary: 'Secondary (Secundária)',
                  accent: 'Accent (Destaque)',
                  text: 'Text (Texto Técnico)',
                  background: 'Background (Fundo)',
                  border: 'Border (Bordas)',
                  muted: 'Muted (Apoio)'
                }).map(([k, label]) => `
                  <div class="token-item">
                    <span class="token-lbl">${label}</span>
                    <div class="d-flex align-items-center gap-2">
                      <input type="color" class="form-color-picker" value="${tokens[k] || '#000000'}" onchange="SheetEngineModule.updateBrandToken('${k}', this.value)" />
                      <input type="text" class="form-input form-input-xs font-mono" value="${tokens[k] || ''}" onchange="SheetEngineModule.updateBrandToken('${k}', this.value)" style="width: 75px;" />
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Seção 3: Formatação e Ciclo de Revisões -->
            <div class="brand-section mb-4">
              <h5 class="mb-2 text-sm font-semibold">3. Sistema de Revisões Técnicas</h5>
              <div class="d-flex align-items-center gap-3 p-3 bg-secondary-subtle rounded border">
                <div>
                  <label class="form-label text-xs mb-1">Padrão de Exibição</label>
                  <select class="form-select form-select-sm" onchange="SheetEngineModule.updateBrandRevisionFormat(this.value)">
                    <option value="REV {NN}" ${(revConfig.format || 'REV {NN}') === 'REV {NN}' ? 'selected' : ''}>REV 00, REV 01, REV 02 (Padrão)</option>
                    <option value="REV {N}" ${revConfig.format === 'REV {N}' ? 'selected' : ''}>REV 0, REV 1, REV 2</option>
                    <option value="R{NN}" ${revConfig.format === 'R{NN}' ? 'selected' : ''}>R00, R01, R02</option>
                  </select>
                </div>
                <div>
                  <label class="form-label text-xs mb-1">Revisão Atual</label>
                  <div class="font-mono font-bold text-lg">${StudioState.formatRevisionString(currentSheet?.revision || revConfig.currentRev || '00', revConfig.format)}</div>
                </div>
                <div class="ms-auto">
                  <button type="button" class="btn btn-outline btn-sm" onclick="SheetEngineModule.incrementBrandRevision()">
                    <i data-lucide="plus-circle"></i> Criar Nova Revisão (+1)
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="sheet-modal-footer d-flex justify-content-between align-items-center p-3 border-top">
            <button class="btn btn-primary btn-sm" onclick="SheetEngineModule.applyOfficialTitleblock()">
              <i data-lucide="stamp"></i> Inserir Carimbo Oficial ABNT na Prancha
            </button>
            <button class="btn btn-outline btn-sm" onclick="SheetEngineModule.closeBrandModal()">
              Fechar
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function refreshUI() {
    const root = document.getElementById('sheet-engine-root');
    if (root) {
      const project = StudioState.getActiveProject();
      if (project) {
        const container = document.getElementById('workspace-tab-content');
        if (container) {
          container.innerHTML = renderProjectSheets(project);
          if (window.lucide) lucide.createIcons();
        }
      }
    }
  }

  return {
    renderProjectSheets,
    setActiveSheet,
    adjustZoom,
    resetZoom,
    toggleGrid,
    toggleSnap,
    togglePreviewMode,
    selectElement,
    handleCanvasClick,
    quickAddElement,
    startDragElement,
    startResize,
    updateElementTransform,
    updateElementContent,
    toggleLock,
    updateSheetMeta,
    alignSelection,
    distributeSelection,
    groupSelected,
    ungroupSelected,
    duplicateSelected,
    deleteSelected,
    duplicateCurrentSheet,
    deleteCurrentSheet,
    openTemplateModal,
    closeTemplateModal,
    applyTemplate,
    openNewSheetModal,
    closeNewSheetModal,
    submitNewSheet,
    createFirstSheet,
    // F03 Format Controls & Presets
    togglePrintableArea,
    toggleBleed,
    toggleSafeArea,
    onFormatChange,
    onOrientationChange,
    selectPreset,
    confirmFormatChange,
    cancelFormatChange,
    updateMargin,
    updateBleed,
    renderClipWarningModal,
    // F05 Brand Identity & Titleblock
    openBrandModal,
    closeBrandModal,
    handleBrandAssetUpload,
    updateBrandToken,
    updateBrandRevisionFormat,
    incrementBrandRevision,
    dockTitleblock,
    applyOfficialTitleblock,
    renderBrandModal,
    renderCarimboElement,
    renderLogoElement,
    refreshUI
  };
})();

if (typeof window !== 'undefined') {
  window.SheetEngineModule = SheetEngineModule;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SheetEngineModule;
}
