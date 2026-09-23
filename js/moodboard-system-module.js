/**
 * ============================================================================
 * ARQVERTICE STUDIO — BLOCO E04: MOODBOARD VISUAL E TÉCNICO
 * Apresentação Visual, Composição Conceitual, Ficha de Materiais e Mobiliário,
 * Quantitativos, Paleta de Cores, Renders Aprovados, Layout em Blocos e Exportação
 * ============================================================================
 */

const MoodboardSystemModule = (function () {
  'use strict';

  // Estado local do módulo para navegação e edição
  let activeMoodboardId = null;
  let activeVariant = 'HYBRID'; // 'HYBRID' (Apresentação Visual) ou 'TECHNICAL' (Ficha Técnica Documental)

  /**
   * Renderização principal no Workspace do Ambiente (Aba Moodboard)
   */
  function render(env, project) {
    if (!env || !project) {
      return `<div class="p-4 text-muted">Selecione um ambiente e projeto válidos.</div>`;
    }

    const moodboards = StudioState.getEnvironmentMoodboards(project.id, env.id);

    // Se nenhum moodboard existir para o ambiente, oferecer geração automática imediata
    if (!moodboards || moodboards.length === 0) {
      return renderEmptyState(env, project);
    }

    // Selecionar moodboard ativo ou o mais recente/aprovado
    let current = null;
    if (activeMoodboardId) {
      current = moodboards.find(m => m.id === activeMoodboardId);
    }
    if (!current) {
      current = moodboards[0];
      activeMoodboardId = current.id;
    }

    return `
      <div class="moodboard-system-container animate-fade-in" id="moodboard-root">
        ${renderTopBar(current, moodboards, env, project)}
        ${renderSheetCanvas(current, env, project)}
      </div>
    `;
  }

  /**
   * Renderização no Workspace Geral do Projeto (Visão Global de Moodboards)
   */
  function renderProjectMoodboards(project) {
    if (!project) return `<div class="p-4 text-muted">Selecione um projeto válido.</div>`;

    const moodboards = StudioState.getProjectMoodboards(project.id);

    return `
      <div class="moodboard-system-container animate-fade-in" style="padding: 24px;">
        <div class="d-flex justify-content-between align-items-center mb-4 pb-3" style="border-bottom: 1px solid var(--border-color);">
          <div>
            <h2 style="font-family: var(--font-heading); font-size: 1.5rem; margin-bottom: 4px;">
              <i data-lucide="layout-template"></i> Moodboards Visuais e Técnicos do Projeto
            </h2>
            <p class="text-muted" style="margin: 0; font-size: 0.9rem;">
              Dossiê completo de ambiência, conceitos visuais, fichas técnicas de materiais e mobiliário da residência inteira.
            </p>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-outline btn-sm" onclick="MoodboardSystemModule.openCreateProjectMoodboardModal('${project.id}')">
              <i data-lucide="plus"></i> Novo Moodboard Global
            </button>
            <button class="btn btn-primary btn-sm" onclick="window.print()">
              <i data-lucide="printer"></i> Imprimir Caderno Completo
            </button>
          </div>
        </div>

        ${moodboards.length === 0 ? `
          <div class="empty-state-card text-center p-5">
            <i data-lucide="palette" style="width: 48px; height: 48px; stroke: var(--text-muted); margin-bottom: 16px;"></i>
            <h3>Nenhum Moodboard Cadastrado</h3>
            <p class="text-muted">Crie um moodboard global ou acesse os ambientes para gerar composições específicas.</p>
            <button class="btn btn-primary mt-3" onclick="MoodboardSystemModule.openCreateProjectMoodboardModal('${project.id}')">
              <i data-lucide="plus"></i> Criar Moodboard Global do Projeto
            </button>
          </div>
        ` : `
          <div class="row g-4">
            ${moodboards.map(mb => {
              const envName = mb.environmentId ? (StudioState.data.environments.find(e => e.id === mb.environmentId)?.name || 'Ambiente') : 'Global do Projeto';
              const itemsCount = (mb.items || []).length;
              const statusBadge = getStatusBadge(mb.status, mb.version);

              return `
                <div class="col-md-6 col-lg-4">
                  <div class="card h-100 shadow-sm moodboard-project-card" style="border: 1px solid var(--border-color); background: var(--card-bg); border-radius: 8px; overflow: hidden;">
                    <div style="height: 180px; background: #262626; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                      ${mb.heroRenderUrl ? `
                        <img src="${mb.heroRenderUrl}" alt="${mb.title}" style="width: 100%; height: 100%; object-fit: cover;">
                      ` : `
                        <div class="text-center text-muted">
                          <i data-lucide="image" style="width: 36px; height: 36px; opacity: 0.5;"></i>
                          <div style="font-size: 0.8rem; margin-top: 4px;">Sem imagem de destaque</div>
                        </div>
                      `}
                      <div style="position: absolute; top: 12px; left: 12px;">
                        ${statusBadge}
                      </div>
                      <div style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.7); color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-family: monospace;">
                        ${mb.pageFormat} • ${mb.orientation === 'LANDSCAPE' ? 'Paisagem' : 'Retrato'}
                      </div>
                    </div>
                    <div class="p-3">
                      <div class="d-flex justify-content-between align-items-start mb-1">
                        <span class="badge bg-secondary text-uppercase" style="font-size: 0.7rem; font-weight: 600;">${getTypeLabel(mb.type)}</span>
                        <small class="text-muted">${envName}</small>
                      </div>
                      <h4 style="font-size: 1.1rem; margin: 8px 0 4px; font-family: var(--font-heading);">${mb.title}</h4>
                      <p class="text-muted" style="font-size: 0.85rem; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 12px;">
                        ${mb.conceptStatement || mb.description || 'Composição arquitetônica sem descrição cadastrada.'}
                      </p>
                      
                      <!-- Paleta Miniatura -->
                      ${Array.isArray(mb.colorPalette) && mb.colorPalette.length > 0 ? `
                        <div class="d-flex gap-1 mb-3">
                          ${mb.colorPalette.slice(0, 5).map(c => `
                            <div title="${c.name || ''} (${c.hex})" style="width: 20px; height: 20px; border-radius: 50%; background: ${c.hex}; border: 1px solid rgba(0,0,0,0.15);"></div>
                          `).join('')}
                        </div>
                      ` : ''}

                      <div class="d-flex justify-content-between align-items-center pt-2" style="border-top: 1px solid var(--border-color); font-size: 0.8rem;">
                        <span class="text-muted"><i data-lucide="layers" style="width: 14px; height: 14px; vertical-align: middle;"></i> ${itemsCount} itens</span>
                        <button class="btn btn-outline btn-sm" onclick="MoodboardSystemModule.selectMoodboardForPreview('${mb.id}', '${project.id}', '${mb.environmentId || ''}')">
                          <i data-lucide="eye"></i> Abrir Moodboard
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  }

  /**
   * Estado vazio com botão de geração inteligente
   */
  function renderEmptyState(env, project) {
    return `
      <div class="env-tab-pane animate-fade-in p-5 text-center" style="max-width: 720px; margin: 0 auto;">
        <div style="background: rgba(var(--primary-rgb, 197, 160, 89), 0.08); width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
          <i data-lucide="palette" style="width: 40px; height: 40px; stroke: var(--primary);"></i>
        </div>
        <h2 style="font-family: var(--font-heading); margin-bottom: 8px;">Nenhum Moodboard Configurado para este Ambiente</h2>
        <p class="text-muted" style="line-height: 1.6; margin-bottom: 24px;">
          O sistema de Moodboard do ArqVértice integra automaticamente os <strong>materiais especificados (E02)</strong>, 
          <strong>mobiliário curado (E01)</strong>, <strong>quantitativos (E03)</strong> e os <strong>renders fotorrealistas aprovados</strong> 
          em uma prancha pronta para apresentação e documentação técnica.
        </p>
        <div class="d-flex gap-3 justify-content-center">
          <button class="btn btn-primary" onclick="MoodboardSystemModule.generateAutomatic('${project.id}', '${env.id}')">
            <i data-lucide="sparkles"></i> Gerar Moodboard Automático (Recomendado)
          </button>
          <button class="btn btn-outline" onclick="MoodboardSystemModule.openCreateModal('${project.id}', '${env.id}')">
            <i data-lucide="plus"></i> Criar em Branco
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Barra Superior de Controles e Alternâncias
   */
  function renderTopBar(mb, allMoodboards, env, project) {
    const isApproved = mb.status === 'APPROVED';
    const isLandscape = mb.orientation === 'LANDSCAPE';

    return `
      <div class="moodboard-top-controls no-print d-flex justify-content-between align-items-center mb-3 p-3 bg-card border rounded">
        <!-- Seletor de Versão e Moodboard -->
        <div class="d-flex align-items-center gap-3">
          <div>
            <label class="form-label mb-1" style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">Versão / Prancha</label>
            <div class="d-flex align-items-center gap-2">
              <select class="form-select form-select-sm" style="min-width: 220px;" onchange="MoodboardSystemModule.setActiveMoodboard(this.value)">
                ${allMoodboards.map(m => `
                  <option value="${m.id}" ${m.id === mb.id ? 'selected' : ''}>
                    ${m.version} • ${m.title} (${m.status})
                  </option>
                `).join('')}
              </select>
              ${getStatusBadge(mb.status, mb.version)}
            </div>
          </div>

          <div style="height: 32px; width: 1px; background: var(--border-color); margin: 0 4px;"></div>

          <!-- Alternância de Variante Visual vs Técnico -->
          <div>
            <label class="form-label mb-1" style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">Variante de Exibição</label>
            <div class="btn-group btn-group-sm" role="group">
              <button type="button" class="btn ${activeVariant === 'HYBRID' ? 'btn-primary' : 'btn-outline'}" onclick="MoodboardSystemModule.setVariant('HYBRID')">
                <i data-lucide="eye"></i> Apresentação Visual
              </button>
              <button type="button" class="btn ${activeVariant === 'TECHNICAL' ? 'btn-primary' : 'btn-outline'}" onclick="MoodboardSystemModule.setVariant('TECHNICAL')">
                <i data-lucide="file-text"></i> Ficha Técnica
              </button>
            </div>
          </div>
        </div>

        <!-- Ações do Moodboard -->
        <div class="d-flex align-items-center gap-2">
          ${!isApproved ? `
            <button class="btn btn-outline btn-sm" onclick="MoodboardSystemModule.openAddItemModal('${mb.id}')">
              <i data-lucide="plus"></i> Adicionar Bloco
            </button>
            <button class="btn btn-outline btn-sm" onclick="MoodboardSystemModule.openEditSettingsModal('${mb.id}')">
              <i data-lucide="settings"></i> Configurações da Prancha
            </button>
            <button class="btn btn-success btn-sm" onclick="MoodboardSystemModule.openApproveModal('${mb.id}')">
              <i data-lucide="check-circle"></i> Aprovar Moodboard
            </button>
          ` : `
            <div class="alert alert-success py-1 px-3 mb-0 d-flex align-items-center gap-2" style="font-size: 0.85rem;">
              <i data-lucide="shield-check" style="width: 16px; height: 16px;"></i>
              <span>Homologado (${mb.approvedBy || 'Arquiteto'})</span>
            </div>
            <button class="btn btn-primary btn-sm" onclick="MoodboardSystemModule.versionMoodboard('${mb.id}')">
              <i data-lucide="copy"></i> Criar Nova Revisão (V+)
            </button>
          `}

          <!-- Botões de Exportação e Impressão -->
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline" title="Exportar ou Imprimir em PDF Alta Definição" onclick="window.print()">
              <i data-lucide="printer"></i> PDF / Imprimir
            </button>
            <button class="btn btn-outline" title="Exportar imagem do moodboard" onclick="MoodboardSystemModule.exportImage('${mb.id}')">
              <i data-lucide="download"></i> PNG
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Prancha Física / Canvas do Moodboard (Preserva proporção A4/A3/A2/A1 e Tipografia Central)
   */
  function renderSheetCanvas(mb, env, project) {
    const typographyClass = getTypographyClass(mb.typographyTheme);
    const orientationClass = mb.orientation === 'LANDSCAPE' ? 'sheet-landscape' : 'sheet-portrait';
    const pageFormatClass = `sheet-${(mb.pageFormat || 'A3').toLowerCase()}`;
    const marginClass = `margins-${(mb.margins || 'NORMAL').toLowerCase()}`;

    const items = mb.items || [];
    const colors = mb.colorPalette || [];

    return `
      <div class="moodboard-sheet-wrapper d-flex justify-content-center">
        <div 
          class="moodboard-sheet ${pageFormatClass} ${orientationClass} ${marginClass} ${typographyClass}" 
          id="moodboard-print-sheet"
          style="background-color: ${mb.backgroundColor || '#FFFFFF'};"
        >
          <!-- 15. IDENTIDADE ARQVERTICE — CABEÇALHO -->
          ${mb.showHeader ? `
            <header class="moodboard-header">
              <div class="header-branding">
                <div class="brand-logo-mark">▲</div>
                <div class="brand-text">
                  <span class="brand-name">ARQVÉRTICE</span>
                  <span class="brand-sub">STUDIO DE ARQUITETURA</span>
                </div>
              </div>
              <div class="header-titles">
                <h1 class="sheet-title">${escapeHTML(mb.title)}</h1>
                <p class="sheet-subtitle">${escapeHTML(mb.subtitle || (project.name + ' • ' + (env ? env.name : 'Geral')))}</p>
              </div>
              <div class="header-metadata">
                <div class="meta-row"><strong>PROJETO:</strong> <span>${escapeHTML(project.name)}</span></div>
                <div class="meta-row"><strong>AMBIENTE:</strong> <span>${escapeHTML(env ? env.name : 'Todos')}</span></div>
                <div class="meta-row"><strong>PRANCHA:</strong> <span>${mb.pageFormat} (${mb.orientation === 'LANDSCAPE' ? 'Paisagem' : 'Retrato'})</span></div>
                <div class="meta-row"><strong>VERSÃO:</strong> <span class="badge-ver">${mb.version}</span></div>
                <div class="meta-row"><strong>DATA:</strong> <span>${formatDate(mb.updatedAt || mb.createdAt)}</span></div>
              </div>
            </header>
          ` : ''}

          <!-- DECLARAÇÃO CONCEITUAL -->
          ${mb.conceptStatement ? `
            <section class="moodboard-concept-statement">
              <div class="concept-icon"><i data-lucide="quote"></i></div>
              <div class="concept-text">${escapeHTML(mb.conceptStatement)}</div>
            </section>
          ` : ''}

          <!-- 7. PALETA DE CORES INTEGRADA -->
          ${colors.length > 0 ? `
            <section class="moodboard-palette-strip">
              <div class="palette-strip-title">PALETA CROMÁTICA & TONS</div>
              <div class="palette-chips-grid">
                ${colors.map(c => `
                  <div class="color-chip-card">
                    <div class="color-swatch-box" style="background-color: ${c.hex};"></div>
                    <div class="color-info">
                      <strong class="color-name">${escapeHTML(c.name || 'Tom')}</strong>
                      <span class="color-hex">${c.hex}</span>
                      ${c.code ? `<span class="color-code">${escapeHTML(c.code)}</span>` : ''}
                      ${c.usage ? `<span class="color-usage">${escapeHTML(c.usage)}</span>` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            </section>
          ` : ''}

          <!-- CORPO PRINCIPAL: GRADE DE BLOCOS / ITENS -->
          <main class="moodboard-grid-layout" style="--grid-cols: ${mb.gridColumns || 12};">
            ${items.length === 0 ? `
              <div class="no-items-placeholder text-center p-4">
                <p class="text-muted">Nenhum bloco inserido nesta prancha ainda. Clique em "Adicionar Bloco" acima.</p>
              </div>
            ` : items.map(item => renderMoodboardBlock(item, mb)).join('')}
          </main>

          <!-- 10. TABELA RESUMIDA DE QUANTITATIVOS (Se habilitada e houver itens) -->
          ${mb.showQuantitiesSummary ? renderQuantitiesSummarySection(mb, project, env) : ''}

          <!-- 11. TABELA RESUMIDA DE MOBILIÁRIO (Se habilitada) -->
          ${mb.showFurnitureSummary ? renderFurnitureSummarySection(mb, project, env) : ''}

          <!-- 15. IDENTIDADE ARQVERTICE — RODAPÉ TÉCNICO -->
          ${mb.showFooter ? `
            <footer class="moodboard-footer">
              <div class="footer-left">
                <span>ArqVértice Studio • Documento de Ambiência & Especificação • ${mb.version}</span>
              </div>
              <div class="footer-center">
                <span>Status: <strong>${mb.status}</strong> ${mb.isApproved ? '• HOMOLOGADO' : '• PRELIMINAR'}</span>
              </div>
              <div class="footer-right">
                <span>Prancha gerada em escala gráfica proporcional • Não descartar cotas em obra</span>
              </div>
            </footer>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Renderização de cada bloco do moodboard de acordo com seu tipo
   */
  function renderMoodboardBlock(item, mb) {
    const isTechnical = activeVariant === 'TECHNICAL';
    const gridClass = getGridWidthClass(item.gridWidth);
    const sizeClass = getCardSizeClass(item.cardSize);
    const featuredClass = item.isFeatured ? 'is-featured' : '';

    switch (item.itemType) {
      case 'RENDER':
        return `
          <div class="mb-block block-render ${gridClass} ${sizeClass} ${featuredClass}" id="block-${item.id}">
            <div class="render-media-wrap">
              <img src="${item.imageUrl || 'assets/renders/render_living_luxo.jpg'}" alt="${escapeHTML(item.title || 'Render Aprovado')}" loading="lazy">
              <div class="badge-approved-render">
                <i data-lucide="check"></i> RENDER APROVADO
              </div>
            </div>
            <div class="render-caption">
              <strong class="title">${escapeHTML(item.title || 'Perspectiva Aprovada')}</strong>
              ${item.notes ? `<p class="notes">${escapeHTML(item.notes)}</p>` : ''}
            </div>
            ${renderBlockActionButtons(item, mb)}
          </div>
        `;

      case 'MATERIAL':
        return renderMaterialCard(item, mb, isTechnical);

      case 'FURNITURE':
        return renderFurnitureCard(item, mb, isTechnical);

      case 'QUANTITY':
        return renderQuantityCard(item, mb);

      case 'REFERENCE':
      case 'IMAGE':
        return `
          <div class="mb-block block-reference ${gridClass} ${sizeClass} ${featuredClass}" id="block-${item.id}">
            <div class="image-media-wrap">
              <img src="${item.imageUrl || 'assets/references/moodboard_living_ref1.jpg'}" alt="${escapeHTML(item.title || 'Referência')}" loading="lazy">
              ${item.category ? `<span class="badge-category">${escapeHTML(item.category)}</span>` : ''}
            </div>
            <div class="image-caption">
              <strong class="title">${escapeHTML(item.title || 'Referência Visual')}</strong>
              ${item.subtitle ? `<span class="subtitle">${escapeHTML(item.subtitle)}</span>` : ''}
              ${item.notes ? `<p class="notes">${escapeHTML(item.notes)}</p>` : ''}
            </div>
            ${renderBlockActionButtons(item, mb)}
          </div>
        `;

      case 'TEXT':
        return `
          <div class="mb-block block-text ${gridClass} ${sizeClass} ${featuredClass}" id="block-${item.id}">
            <div class="text-content-card">
              ${item.title ? `<h4 class="title">${escapeHTML(item.title)}</h4>` : ''}
              <div class="body-text">${escapeHTML(item.description || item.notes || '')}</div>
            </div>
            ${renderBlockActionButtons(item, mb)}
          </div>
        `;

      default:
        return `
          <div class="mb-block block-generic ${gridClass} ${sizeClass}" id="block-${item.id}">
            ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${escapeHTML(item.title)}">` : ''}
            <div class="generic-caption">
              <strong>${escapeHTML(item.title || 'Item')}</strong>
              <small class="text-muted">${escapeHTML(item.category || item.itemType)}</small>
            </div>
            ${renderBlockActionButtons(item, mb)}
          </div>
        `;
    }
  }

  /**
   * 5. CARTÃO DE MATERIAL (MATERIAL CARD)
   * Regra E04: "Só mostrar campos disponíveis. Não preencher lacunas inventando informação."
   */
  function renderMaterialCard(item, mb, isTechnical) {
    const gridClass = getGridWidthClass(item.gridWidth);
    const sizeClass = getCardSizeClass(item.cardSize);
    const featuredClass = item.isFeatured ? 'is-featured' : '';

    return `
      <div class="mb-block card-material ${gridClass} ${sizeClass} ${featuredClass}" id="block-${item.id}">
        <div class="card-inner">
          ${item.imageUrl ? `
            <div class="card-media">
              <img src="${item.imageUrl}" alt="${escapeHTML(item.title || item.materialName || 'Material')}" loading="lazy">
              ${item.category ? `<span class="tag-category">${escapeHTML(item.category)}</span>` : ''}
            </div>
          ` : ''}
          <div class="card-body-spec">
            <h4 class="card-title">${escapeHTML(item.title || item.materialName || 'Material sem nome')}</h4>
            
            <dl class="spec-attributes">
              ${item.category ? `<dt>Categoria</dt><dd>${escapeHTML(item.category)}</dd>` : ''}
              ${item.product ? `<dt>Produto</dt><dd>${escapeHTML(item.product)}</dd>` : ''}
              ${item.manufacturer ? `<dt>Fabricante</dt><dd>${escapeHTML(item.manufacturer)}</dd>` : ''}
              ${item.commercialCode ? `<dt>Código / Ref</dt><dd><code>${escapeHTML(item.commercialCode)}</code></dd>` : ''}
              ${item.finish ? `<dt>Acabamento</dt><dd>${escapeHTML(item.finish)}</dd>` : ''}
              ${item.dimensions ? `<dt>Dimensão</dt><dd>${escapeHTML(item.dimensions)}</dd>` : ''}
              ${item.quantity !== null && item.quantity !== undefined ? `
                <dt>Quantidade</dt><dd><strong>${item.quantity} ${item.unit || ''}</strong></dd>
              ` : ''}
              ${item.supplier ? `<dt>Fornecedor</dt><dd>${escapeHTML(item.supplier)}</dd>` : ''}
              ${item.externalLink ? `
                <dt>Link</dt><dd><a href="${escapeHTML(item.externalLink)}" target="_blank" rel="noopener">Ver Catálogo ↗</a></dd>
              ` : ''}
              ${item.notes ? `<dt>Observação</dt><dd class="notes">${escapeHTML(item.notes)}</dd>` : ''}
            </dl>
          </div>
        </div>
        ${renderBlockActionButtons(item, mb)}
      </div>
    `;
  }

  /**
   * 6. CARTÃO DE MÓVEL (FURNITURE CARD)
   * Regra E04: Imagem, nome, categoria, quantidade, medidas, fabricante, modelo, código, fornecedor, link, observação.
   */
  function renderFurnitureCard(item, mb, isTechnical) {
    const gridClass = getGridWidthClass(item.gridWidth);
    const sizeClass = getCardSizeClass(item.cardSize);
    const featuredClass = item.isFeatured ? 'is-featured' : '';

    return `
      <div class="mb-block card-furniture ${gridClass} ${sizeClass} ${featuredClass}" id="block-${item.id}">
        <div class="card-inner">
          ${item.imageUrl ? `
            <div class="card-media">
              <img src="${item.imageUrl}" alt="${escapeHTML(item.title || item.furnitureName || 'Mobiliário')}" loading="lazy">
              ${item.category ? `<span class="tag-category">${escapeHTML(item.category)}</span>` : ''}
            </div>
          ` : ''}
          <div class="card-body-spec">
            <h4 class="card-title">${escapeHTML(item.title || item.furnitureName || 'Móvel sem nome')}</h4>

            <dl class="spec-attributes">
              ${item.category ? `<dt>Categoria</dt><dd>${escapeHTML(item.category)}</dd>` : ''}
              ${item.quantity !== null && item.quantity !== undefined ? `
                <dt>Quantidade</dt><dd><strong>${item.quantity} un</strong></dd>
              ` : ''}
              ${item.dimensions ? `<dt>Medidas</dt><dd><strong>${escapeHTML(item.dimensions)}</strong></dd>` : ''}
              ${item.manufacturer ? `<dt>Fabricante</dt><dd>${escapeHTML(item.manufacturer)}</dd>` : ''}
              ${item.model ? `<dt>Modelo</dt><dd>${escapeHTML(item.model)}</dd>` : ''}
              ${item.commercialCode ? `<dt>Código / SKU</dt><dd><code>${escapeHTML(item.commercialCode)}</code></dd>` : ''}
              ${item.supplier ? `<dt>Fornecedor</dt><dd>${escapeHTML(item.supplier)}</dd>` : ''}
              ${item.externalLink ? `
                <dt>Link</dt><dd><a href="${escapeHTML(item.externalLink)}" target="_blank" rel="noopener">Ficha do Fornecedor ↗</a></dd>
              ` : ''}
              ${item.notes ? `<dt>Observação</dt><dd class="notes">${escapeHTML(item.notes)}</dd>` : ''}
            </dl>
          </div>
        </div>
        ${renderBlockActionButtons(item, mb)}
      </div>
    `;
  }

  /**
   * 10. BLOCO DE QUANTITATIVO
   */
  function renderQuantityCard(item, mb) {
    const gridClass = getGridWidthClass(item.gridWidth);
    return `
      <div class="mb-block card-quantity ${gridClass}" id="block-${item.id}">
        <div class="quantity-highlight-box">
          <span class="qty-label">${escapeHTML(item.title || 'Quantitativo')}</span>
          <div class="qty-number">${item.quantity !== null && item.quantity !== undefined ? item.quantity : '-'} <span class="qty-unit">${escapeHTML(item.unit || '')}</span></div>
          ${item.notes ? `<p class="qty-meta">${escapeHTML(item.notes)}</p>` : ''}
          <button class="btn-link-action" onclick="StudioApp.openEnvironmentTab('quantitativos')">
            Ver Detalhamento ↗
          </button>
        </div>
        ${renderBlockActionButtons(item, mb)}
      </div>
    `;
  }

  /**
   * Seção de Resumo de Quantitativos (Item 10)
   */
  function renderQuantitiesSummarySection(mb, project, env) {
    const items = StudioState.getEnvironmentQuantities ? StudioState.getEnvironmentQuantities(project.id, env ? env.id : null) : [];
    if (!items || items.length === 0) return '';

    return `
      <section class="moodboard-summary-table-section">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h3 class="section-title">QUADRO RESUMO DE QUANTITATIVOS DE MATERIAIS</h3>
          <button class="btn btn-outline btn-xs no-print" onclick="StudioApp.openEnvironmentTab('quantitativos')">
            VER DETALHAMENTO COMPLETO (E03) ↗
          </button>
        </div>
        <table class="table-compact-moodboard">
          <thead>
            <tr>
              <th>Material / Revestimento</th>
              <th>Aplicação</th>
              <th>Qtd. Líquida</th>
              <th>Perda</th>
              <th>Total com Perda</th>
              <th>Origem</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${items.slice(0, 6).map(q => `
              <tr>
                <td><strong>${escapeHTML(q.materialName)}</strong></td>
                <td>${escapeHTML(q.application || '-')}</td>
                <td>${q.netQuantity} ${q.unit}</td>
                <td>+${q.wastePercentage}%</td>
                <td><strong>${q.totalQuantityWithWaste} ${q.unit}</strong></td>
                <td><small>${q.originType}</small></td>
                <td><span class="badge-status-xs status-${q.status.toLowerCase()}">${q.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>
    `;
  }

  /**
   * Seção de Resumo de Mobiliário (Item 11)
   */
  function renderFurnitureSummarySection(mb, project, env) {
    const items = StudioState.getEnvironmentFurniture ? StudioState.getEnvironmentFurniture(project.id, env ? env.id : null) : [];
    if (!items || items.length === 0) return '';

    return `
      <section class="moodboard-summary-table-section">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h3 class="section-title">ESPECIFICAÇÃO RESUMIDA DE MOBILIÁRIO & PEÇAS</h3>
          <button class="btn btn-outline btn-xs no-print" onclick="StudioApp.openEnvironmentTab('furniture')">
            VER LISTA COMPLETA (E01) ↗
          </button>
        </div>
        <table class="table-compact-moodboard">
          <thead>
            <tr>
              <th>Item / Peça</th>
              <th>Categoria</th>
              <th>Qtd.</th>
              <th>Medidas (L x P x A)</th>
              <th>Fabricante / Linha</th>
              <th>Fornecedor</th>
            </tr>
          </thead>
          <tbody>
            ${items.slice(0, 6).map(f => `
              <tr>
                <td><strong>${escapeHTML(f.name || f.furnitureName)}</strong></td>
                <td>${escapeHTML(f.category || '-')}</td>
                <td><strong>${f.quantity || 1} un</strong></td>
                <td>${escapeHTML(f.dimensions || '-')}</td>
                <td>${escapeHTML(f.manufacturer || '-')}</td>
                <td>${escapeHTML(f.supplier || '-')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>
    `;
  }

  /**
   * Botões de ação em cada bloco (Reordenar, Redimensionar, Remover)
   */
  function renderBlockActionButtons(item, mb) {
    if (mb.status === 'APPROVED') return '';

    return `
      <div class="block-controls-overlay no-print">
        <button class="btn-ctrl" title="Mover para cima" onclick="MoodboardSystemModule.moveBlock('${mb.id}', '${item.id}', -1)">
          <i data-lucide="chevron-left"></i>
        </button>
        <button class="btn-ctrl" title="Mover para baixo" onclick="MoodboardSystemModule.moveBlock('${mb.id}', '${item.id}', 1)">
          <i data-lucide="chevron-right"></i>
        </button>
        <button class="btn-ctrl" title="Editar Bloco" onclick="MoodboardSystemModule.openEditItemModal('${mb.id}', '${item.id}')">
          <i data-lucide="edit-2"></i>
        </button>
        <button class="btn-ctrl btn-danger" title="Excluir Bloco" onclick="MoodboardSystemModule.deleteBlock('${mb.id}', '${item.id}')">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    `;
  }

  // ============================================================================
  // UTILITÁRIOS E HELPERS VISUAIS
  // ============================================================================

  function getStatusBadge(status, version) {
    switch (status) {
      case 'APPROVED':
        return `<span class="badge bg-success" style="font-size: 0.75rem;"><i data-lucide="check-circle" style="width: 12px; height: 12px;"></i> ${version} • APROVADO</span>`;
      case 'IN_REVIEW':
        return `<span class="badge bg-warning text-dark" style="font-size: 0.75rem;">${version} • EM REVISÃO</span>`;
      case 'REJECTED':
        return `<span class="badge bg-danger" style="font-size: 0.75rem;">${version} • REJEITADO</span>`;
      case 'SUPERSEDED':
        return `<span class="badge bg-secondary" style="font-size: 0.75rem;">${version} • ARQUIVADO</span>`;
      default:
        return `<span class="badge bg-secondary" style="font-size: 0.75rem;">${version} • RASCUNHO</span>`;
    }
  }

  function getTypeLabel(type) {
    switch (type) {
      case 'MOODBOARD_ENVIRONMENT': return 'Ambiente';
      case 'MOODBOARD_PROJECT': return 'Projeto Geral';
      case 'MOODBOARD_MATERIAL': return 'Materiais';
      case 'MOODBOARD_FURNITURE': return 'Mobiliário';
      case 'MOODBOARD_CONCEPT': return 'Conceito';
      case 'MOODBOARD_CUSTOM': return 'Personalizado';
      default: return type || 'Moodboard';
    }
  }

  function getGridWidthClass(width) {
    switch (width) {
      case 'FULL': return 'grid-w-12';
      case 'HALF': return 'grid-w-6';
      case 'THIRD': return 'grid-w-4';
      case 'QUARTER': return 'grid-w-3';
      case 'TWO_THIRDS': return 'grid-w-8';
      default: return 'grid-w-4';
    }
  }

  function getCardSizeClass(size) {
    switch (size) {
      case 'HERO': return 'card-size-hero';
      case 'LARGE': return 'card-size-large';
      case 'MEDIUM': return 'card-size-medium';
      case 'SMALL': return 'card-size-small';
      default: return 'card-size-medium';
    }
  }

  function getTypographyClass(theme) {
    switch (theme) {
      case 'ELEGANT_SERIF': return 'typography-serif';
      case 'TECHNICAL_MONO': return 'typography-mono';
      default: return 'typography-sans';
    }
  }

  function formatDate(isoStr) {
    if (!isoStr) return '-';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('pt-BR');
    } catch (e) {
      return isoStr;
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

  // ============================================================================
  // AÇÕES E EVENTOS DE INTERFACE
  // ============================================================================

  function setActiveMoodboard(id) {
    activeMoodboardId = id;
    refreshView();
  }

  function setVariant(variant) {
    activeVariant = variant;
    refreshView();
  }

  function refreshView() {
    const root = document.getElementById('moodboard-root');
    if (root && StudioApp.activeEnvironment && StudioApp.activeProject) {
      const html = render(StudioApp.activeEnvironment, StudioApp.activeProject);
      const parent = root.parentElement;
      if (parent) {
        parent.innerHTML = html;
        if (window.lucide) lucide.createIcons();
      }
    }
  }

  function generateAutomatic(projectId, environmentId) {
    try {
      const mb = StudioState.generateAutomaticMoodboardForEnvironment(projectId, environmentId, activeVariant);
      activeMoodboardId = mb.id;
      if (window.StudioApp) {
        StudioApp.showToast('Moodboard gerado com sucesso integrando materiais e mobiliário!', 'success');
      }
      refreshView();
    } catch (err) {
      alert('Erro ao gerar moodboard: ' + err.message);
    }
  }

  function moveBlock(moodboardId, itemId, direction) {
    try {
      const mb = StudioState.getMoodboard(moodboardId);
      if (!mb) return;
      const items = mb.items || [];
      const index = items.findIndex(i => i.id === itemId);
      if (index < 0) return;

      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= items.length) return;

      const newOrder = [...items];
      const temp = newOrder[index];
      newOrder[index] = newOrder[targetIndex];
      newOrder[targetIndex] = temp;

      StudioState.reorderMoodboardItems(moodboardId, newOrder.map(i => i.id));
      refreshView();
    } catch (err) {
      alert(err.message);
    }
  }

  function deleteBlock(moodboardId, itemId) {
    if (!confirm('Deseja realmente remover este bloco do moodboard?')) return;
    try {
      StudioState.removeMoodboardItem(moodboardId, itemId);
      refreshView();
    } catch (err) {
      alert(err.message);
    }
  }

  function openApproveModal(moodboardId) {
    const mb = StudioState.getMoodboard(moodboardId);
    if (!mb) return;

    const notes = prompt(`Aprovação Formal de Moodboard (${mb.version})\nDigite as observações técnicas de homologação:`, 'Homologado conforme diretrizes e materiais aprovados pelo cliente.');
    if (notes !== null) {
      try {
        StudioState.approveMoodboard(moodboardId, 'Arquiteto Responsável', notes);
        if (window.StudioApp) {
          StudioApp.showToast(`Moodboard ${mb.version} aprovado com sucesso!`, 'success');
        }
        refreshView();
      } catch (err) {
        alert('Erro ao aprovar: ' + err.message);
      }
    }
  }

  function versionMoodboard(moodboardId) {
    const mb = StudioState.getMoodboard(moodboardId);
    if (!mb) return;

    if (confirm(`Deseja criar uma nova revisão a partir da versão ${mb.version}? O moodboard atual será preservado como histórico inalterável.`)) {
      try {
        const nextVer = StudioState.versionMoodboard(moodboardId, {}, 'Arquiteto Responsável');
        activeMoodboardId = nextVer.id;
        if (window.StudioApp) {
          StudioApp.showToast(`Nova versão ${nextVer.version} criada para edição!`, 'success');
        }
        refreshView();
      } catch (err) {
        alert('Erro ao versionar: ' + err.message);
      }
    }
  }

  function openAddItemModal(moodboardId) {
    const mb = StudioState.getMoodboard(moodboardId);
    if (!mb) return;

    const title = prompt('Título do novo bloco:');
    if (!title) return;

    const typeStr = prompt('Tipo de Bloco (MATERIAL, FURNITURE, IMAGE, TEXT, QUANTITY, RENDER):', 'MATERIAL');
    const itemType = (typeStr || 'IMAGE').toUpperCase();

    try {
      StudioState.addMoodboardItem(moodboardId, {
        title,
        itemType,
        gridWidth: 'THIRD',
        cardSize: 'MEDIUM',
        imageUrl: itemType === 'MATERIAL' ? 'assets/textures/travertino_navona.jpg' : 'assets/renders/render_living_luxo.jpg'
      });
      refreshView();
    } catch (err) {
      alert('Erro ao adicionar bloco: ' + err.message);
    }
  }

  function openEditSettingsModal(moodboardId) {
    const mb = StudioState.getMoodboard(moodboardId);
    if (!mb) return;

    const newTitle = prompt('Título do Moodboard:', mb.title);
    if (newTitle === null) return;

    const newFormat = prompt('Formato de Prancha (A4, A3, A2, A1):', mb.pageFormat);
    const newOrientation = prompt('Orientação (LANDSCAPE ou PORTRAIT):', mb.orientation);

    try {
      StudioState.updateMoodboard(moodboardId, {
        title: newTitle || mb.title,
        pageFormat: newFormat || mb.pageFormat,
        orientation: (newOrientation || mb.orientation).toUpperCase()
      });
      refreshView();
    } catch (err) {
      alert('Erro ao atualizar configurações: ' + err.message);
    }
  }

  function openCreateModal(projectId, environmentId) {
    const title = prompt('Nome do Novo Moodboard:', 'Moodboard Conceitual');
    if (!title) return;

    try {
      const mb = StudioState.createMoodboard({
        projectId,
        environmentId,
        title,
        pageFormat: 'A3',
        orientation: 'LANDSCAPE'
      });
      activeMoodboardId = mb.id;
      refreshView();
    } catch (err) {
      alert('Erro ao criar moodboard: ' + err.message);
    }
  }

  function exportImage(moodboardId) {
    alert('Preparando renderização em alta resolução gráfica do Moodboard para arquivo PNG...');
    window.print();
  }

  function selectMoodboardForPreview(moodboardId, projectId, environmentId) {
    activeMoodboardId = moodboardId;
    if (environmentId && window.StudioApp) {
      StudioApp.openEnvironmentWorkspace(projectId, environmentId, 'moodboard');
    }
  }

  return {
    render,
    renderProjectMoodboards,
    setActiveMoodboard,
    setVariant,
    generateAutomatic,
    moveBlock,
    deleteBlock,
    openApproveModal,
    versionMoodboard,
    openAddItemModal,
    openEditSettingsModal,
    openCreateModal,
    exportImage,
    selectMoodboardForPreview
  };
})();

if (typeof window !== 'undefined') {
  window.MoodboardSystemModule = MoodboardSystemModule;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MoodboardSystemModule;
}
