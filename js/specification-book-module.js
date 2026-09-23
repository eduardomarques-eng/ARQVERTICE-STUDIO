/**
 * ============================================================================
 * ARQVERTICE STUDIO — BLOCO E05: CADERNO DE ESPECIFICAÇÕES, LISTAS E FICHAS
 * Camada documental estruturada para consolidar móveis, materiais, quantitativos,
 * equipamentos, iluminação, fornecedores e produtos por ambiente e por projeto.
 * ============================================================================
 */

const SpecificationBookModule = (function () {
  'use strict';

  let activeDocType = 'CADERNO_GERAL';
  let activeBookId = null;

  /**
   * Renderização no Workspace do Ambiente (Aba Especificações)
   */
  function renderEnvironmentTab(env, project) {
    if (!env || !project) {
      return `<div class="p-4 text-muted">Selecione um ambiente e projeto válidos.</div>`;
    }

    const books = StudioState.getEnvironmentSpecificationBooks(project.id, env.id);

    // Se não houver caderno gerado para o ambiente, oferecer geração automática
    if (!books || books.length === 0) {
      return renderEmptyState(env, project);
    }

    let current = null;
    if (activeBookId) {
      current = books.find(b => b.id === activeBookId);
    }
    if (!current) {
      current = books[0];
      activeBookId = current.id;
    }

    return `
      <div class="spec-book-container animate-fade-in" id="spec-book-root">
        ${renderTopControls(current, books, env, project)}
        ${renderDocumentContent(current, env, project)}
      </div>
    `;
  }

  /**
   * Renderização no Workspace Geral do Projeto (Caderno Geral Consolidado)
   */
  function renderProjectTab(project) {
    if (!project) return `<div class="p-4 text-muted">Selecione um projeto válido.</div>`;

    const books = StudioState.getProjectSpecificationBooks(project.id);
    const generalBook = books.find(b => b.docType === 'CADERNO_GERAL' && !b.environmentId) || books[0];

    return `
      <div class="spec-book-container animate-fade-in" style="padding: 24px;" id="spec-book-root">
        <div class="d-flex justify-content-between align-items-center mb-4 pb-3" style="border-bottom: 1px solid var(--border-color);">
          <div>
            <h2 style="font-family: var(--font-heading); font-size: 1.5rem; margin-bottom: 4px;">
              <i data-lucide="book-open"></i> Caderno Geral de Especificações Técnicas & Fichas
            </h2>
            <p class="text-muted" style="margin: 0; font-size: 0.9rem;">
              Dossiê executivo e documental consolidando móveis, materiais, quantitativos, equipamentos e fornecedores de toda a obra.
            </p>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-outline btn-sm" onclick="SpecificationBookModule.generateBookPrompt('${project.id}', null)">
              <i data-lucide="sparkles"></i> Gerar Novo Documento
            </button>
            <button class="btn btn-primary btn-sm" onclick="window.print()">
              <i data-lucide="printer"></i> Imprimir Caderno Completo
            </button>
          </div>
        </div>

        ${!generalBook ? `
          <div class="empty-state-card text-center p-5">
            <i data-lucide="book-open" style="width: 48px; height: 48px; stroke: var(--text-muted); margin-bottom: 16px;"></i>
            <h3>Nenhum Caderno Consolidado Encontrado</h3>
            <p class="text-muted">Gere o Caderno Geral a partir de todos os materiais e móveis cadastrados no projeto.</p>
            <button class="btn btn-primary mt-3" onclick="SpecificationBookModule.generateAutomatic('${project.id}', null, 'CADERNO_GERAL')">
              <i data-lucide="sparkles"></i> Compilar Caderno Geral do Projeto
            </button>
          </div>
        ` : `
          ${renderTopControls(generalBook, books, null, project)}
          ${renderDocumentContent(generalBook, null, project)}
        `}
      </div>
    `;
  }

  function renderEmptyState(env, project) {
    return `
      <div class="env-tab-pane animate-fade-in p-5 text-center" style="max-width: 720px; margin: 0 auto;">
        <div style="background: rgba(var(--primary-rgb, 197, 160, 89), 0.08); width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
          <i data-lucide="file-text" style="width: 40px; height: 40px; stroke: var(--primary);"></i>
        </div>
        <h2 style="font-family: var(--font-heading); margin-bottom: 8px;">Caderno de Especificações do Ambiente</h2>
        <p class="text-muted" style="line-height: 1.6; margin-bottom: 24px;">
          O Caderno de Especificações (E05) estrutura e valida documentalmente todas as peças de mobiliário (E01), 
          materiais de acabamento (E02) e quantitativos (E03) deste ambiente, com indicação rigorosa de origem e rastreabilidade.
        </p>
        <div class="d-flex gap-3 justify-content-center">
          <button class="btn btn-primary" onclick="SpecificationBookModule.generateAutomatic('${project.id}', '${env.id}', 'CADERNO_GERAL')">
            <i data-lucide="sparkles"></i> Compilar Caderno Completo do Ambiente
          </button>
          <button class="btn btn-outline" onclick="SpecificationBookModule.openCreateModal('${project.id}', '${env.id}')">
            <i data-lucide="plus"></i> Criar Lista em Branco
          </button>
        </div>
      </div>
    `;
  }

  function renderTopControls(currentBook, allBooks, env, project) {
    const isApproved = currentBook.status === 'APPROVED';

    return `
      <div class="spec-top-bar no-print d-flex justify-content-between align-items-center mb-3 p-3 bg-card border rounded">
        <!-- Seletor de Documento e Versão -->
        <div class="d-flex align-items-center gap-3">
          <div>
            <label class="form-label mb-1" style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">Documento / Caderno</label>
            <div class="d-flex align-items-center gap-2">
              <select class="form-select form-select-sm" style="min-width: 260px;" onchange="SpecificationBookModule.setActiveBook(this.value)">
                ${allBooks.map(b => `
                  <option value="${b.id}" ${b.id === currentBook.id ? 'selected' : ''}>
                    ${b.version} • ${b.title} (${b.status})
                  </option>
                `).join('')}
              </select>
              ${getStatusBadge(currentBook.status, currentBook.version)}
            </div>
          </div>

          <div style="height: 32px; width: 1px; background: var(--border-color); margin: 0 4px;"></div>

          <!-- Filtro Rápido de Documentos Canônicos (Item 1) -->
          <div>
            <label class="form-label mb-1" style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">Tipo de Lista</label>
            <select class="form-select form-select-sm" onchange="SpecificationBookModule.switchDocType(this.value, '${project.id}', '${env ? env.id : ''}')">
              <option value="CADERNO_GERAL" ${currentBook.docType === 'CADERNO_GERAL' ? 'selected' : ''}>Caderno Geral Completo</option>
              <option value="LISTA_MOVEIS" ${currentBook.docType === 'LISTA_MOVEIS' ? 'selected' : ''}>Lista de Móveis</option>
              <option value="LISTA_MATERIAIS" ${currentBook.docType === 'LISTA_MATERIAIS' ? 'selected' : ''}>Lista de Materiais</option>
              <option value="QUANTITATIVO" ${currentBook.docType === 'QUANTITATIVO' ? 'selected' : ''}>Quadro de Quantitativos</option>
              <option value="LISTA_EQUIPAMENTOS" ${currentBook.docType === 'LISTA_EQUIPAMENTOS' ? 'selected' : ''}>Lista de Equipamentos</option>
              <option value="LISTA_ILUMINACAO" ${currentBook.docType === 'LISTA_ILUMINACAO' ? 'selected' : ''}>Lista de Iluminação</option>
              <option value="LISTA_FORNECEDORES" ${currentBook.docType === 'LISTA_FORNECEDORES' ? 'selected' : ''}>Lista de Fornecedores</option>
              <option value="LISTA_PRODUTOS" ${currentBook.docType === 'LISTA_PRODUTOS' ? 'selected' : ''}>Lista de Produtos</option>
            </select>
          </div>
        </div>

        <!-- Ações do Caderno -->
        <div class="d-flex align-items-center gap-2">
          ${!isApproved ? `
            <button class="btn btn-outline btn-sm" onclick="SpecificationBookModule.openAddEntryModal('${currentBook.id}')">
              <i data-lucide="plus"></i> Adicionar Item
            </button>
            <button class="btn btn-success btn-sm" onclick="SpecificationBookModule.openApproveModal('${currentBook.id}')">
              <i data-lucide="check-circle"></i> Aprovar Caderno
            </button>
          ` : `
            <div class="alert alert-success py-1 px-3 mb-0 d-flex align-items-center gap-2" style="font-size: 0.85rem;">
              <i data-lucide="shield-check" style="width: 16px; height: 16px;"></i>
              <span>Homologado (${currentBook.approvedBy || 'Eduardo Marques'})</span>
            </div>
            <button class="btn btn-primary btn-sm" onclick="SpecificationBookModule.versionBook('${currentBook.id}')">
              <i data-lucide="copy"></i> Criar Revisão (V+)
            </button>
          `}

          <!-- Exportações (Item 9) -->
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline" title="Exportar ou Imprimir em PDF Alta Definição" onclick="window.print()">
              <i data-lucide="printer"></i> PDF
            </button>
            <button class="btn btn-outline" title="Exportar Tabela em CSV (Excel UTF-8)" onclick="SpecificationBookModule.downloadCsv('${currentBook.id}')">
              <i data-lucide="file-spreadsheet"></i> CSV
            </button>
            <button class="btn btn-outline" title="Exportar Tabela em Excel nativo" onclick="SpecificationBookModule.downloadXlsx('${currentBook.id}')">
              <i data-lucide="download"></i> XLSX
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderDocumentContent(book, env, project) {
    const entries = book.entries || [];

    return `
      <div class="spec-sheet-wrapper">
        <div class="spec-sheet-canvas">
          <!-- Cabeçalho Oficial ArqVértice -->
          <header class="spec-sheet-header">
            <div class="header-branding">
              <div class="brand-logo-mark">▲</div>
              <div class="brand-text">
                <span class="brand-name">ARQVÉRTICE</span>
                <span class="brand-sub">STUDIO DE ARQUITETURA • ESPECIFICAÇÕES TÉCNICAS</span>
              </div>
            </div>
            <div class="header-titles">
              <h1 class="sheet-title">${escapeHTML(book.title)}</h1>
              <p class="sheet-subtitle">${escapeHTML(book.subtitle || (project.name + (env ? ' • ' + env.name : '')))}</p>
            </div>
            <div class="header-metadata">
              <div class="meta-row"><strong>DOCUMENTO:</strong> <span>${escapeHTML(book.docType)}</span></div>
              <div class="meta-row"><strong>VERSÃO:</strong> <span class="badge-ver">${book.version}</span></div>
              <div class="meta-row"><strong>STATUS:</strong> <span>${book.status}</span></div>
              <div class="meta-row"><strong>DATA:</strong> <span>${formatDateBR(book.updatedAt || book.createdAt)}</span></div>
            </div>
          </header>

          <!-- Tabela Estruturada de Especificações -->
          <div class="spec-table-container mt-4">
            <table class="table-specification">
              <thead>
                <tr>
                  <th style="width: 50px;">Item</th>
                  <th style="width: 100px;">Origem</th>
                  <th>Especificação / Nome</th>
                  <th>Categoria</th>
                  <th>Produto / Modelo</th>
                  <th>Fabricante</th>
                  <th>Fornecedor</th>
                  <th>Código / SKU</th>
                  <th>Medidas / Dimensões</th>
                  <th style="text-align: right;">Qtd.</th>
                  <th style="width: 90px; text-align: center;">Ações</th>
                </tr>
              </thead>
              <tbody>
                ${entries.length === 0 ? `
                  <tr>
                    <td colspan="11" class="text-center p-4 text-muted">
                      Nenhum item cadastrado neste caderno. Clique em "Adicionar Item" ou "Gerar Novo Documento".
                    </td>
                  </tr>
                ` : entries.map(e => `
                  <tr>
                    <td><strong>${String(e.sortOrder || '').padStart(2, '0')}</strong></td>
                    <td>${renderOriginBadge(e.origin)}</td>
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        ${e.imageUrl ? `<img src="${e.imageUrl}" class="thumb-mini" alt="${escapeHTML(e.itemName)}">` : ''}
                        <div>
                          <strong>${escapeHTML(e.itemName)}</strong>
                          ${e.finish ? `<div class="text-muted" style="font-size: 0.72rem;">Acabamento: ${escapeHTML(e.finish)}</div>` : ''}
                        </div>
                      </div>
                    </td>
                    <td><span class="badge-category-table">${escapeHTML(e.category)}</span></td>
                    <td>${escapeHTML(e.productName || '-')}</td>
                    <td>${escapeHTML(e.manufacturerName || '-')}</td>
                    <td>${escapeHTML(e.supplierName || '-')}</td>
                    <td><code>${escapeHTML(e.commercialCode || '-')}</code></td>
                    <td>${escapeHTML(e.dimensions || '-')}</td>
                    <td style="text-align: right;">
                      <strong>${e.quantity !== null && e.quantity !== undefined ? e.quantity : '-'}</strong> 
                      <small class="text-muted">${escapeHTML(e.unit || '')}</small>
                    </td>
                    <td style="text-align: center;">
                      <button class="btn-icon-table" title="Ver Ficha Técnica Completa" onclick="SpecificationBookModule.openSheetModal('${e.id}', '${book.id}')">
                        <i data-lucide="file-text"></i>
                      </button>
                      ${book.status !== 'APPROVED' ? `
                        <button class="btn-icon-table text-danger" title="Excluir Item" onclick="SpecificationBookModule.deleteEntry('${book.id}', '${e.id}')">
                          <i data-lucide="trash-2"></i>
                        </button>
                      ` : ''}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Rodapé do Caderno -->
          <footer class="spec-sheet-footer mt-4">
            <div class="footer-left">
              <span>ArqVértice Studio • Dossiê de Especificações Técnicas • Versão ${book.version}</span>
            </div>
            <div class="footer-center">
              <span>Origens rastreáveis: <strong>CONFIRMADO, CALCULADO, ESTIMADO, SUGERIDO</strong></span>
            </div>
            <div class="footer-right">
              <span>Documento executivo contratual • Proibida alteração sem homologação</span>
            </div>
          </footer>
        </div>
      </div>
    `;
  }

  /**
   * Renderização do Badge de Origem com Código de Cores Estruturado (Item 7)
   */
  function renderOriginBadge(origin) {
    switch (origin) {
      case 'CONFIRMADO':
        return `<span class="badge-origin origin-confirmado" title="Dado confirmado por medição in loco, fabricante ou projeto executivo"><i data-lucide="check"></i> CONFIRMADO</span>`;
      case 'CALCULADO':
        return `<span class="badge-origin origin-calculado" title="Dado derivado de cálculo matemático com fator de perda (E03)"><i data-lucide="calculator"></i> CALCULADO</span>`;
      case 'ESTIMADO':
        return `<span class="badge-origin origin-estimado" title="Estimativa preliminar sujeita a validação"><i data-lucide="clock"></i> ESTIMADO</span>`;
      case 'SUGERIDO':
        return `<span class="badge-origin origin-sugerido" title="Sugestão de curadoria visual ou catálogo conceitual"><i data-lucide="sparkles"></i> SUGERIDO</span>`;
      default:
        return `<span class="badge-origin origin-sugerido">${origin || 'SUGERIDO'}</span>`;
    }
  }

  function getStatusBadge(status, version) {
    switch (status) {
      case 'APPROVED':
        return `<span class="badge bg-success"><i data-lucide="check-circle"></i> ${version} • APROVADO</span>`;
      case 'IN_REVIEW':
        return `<span class="badge bg-warning text-dark">${version} • EM REVISÃO</span>`;
      case 'SUPERSEDED':
        return `<span class="badge bg-secondary">${version} • ARQUIVADO</span>`;
      default:
        return `<span class="badge bg-secondary">${version} • RASCUNHO</span>`;
    }
  }

  /**
   * Modal da Ficha Técnica do Item (Produto, Móvel ou Material)
   */
  function openSheetModal(entryId, bookId) {
    const book = StudioState.getSpecificationBook(bookId);
    if (!book) return;
    const item = (book.entries || []).find(e => e.id === entryId);
    if (!item) return;

    let contentHtml = '';

    // Se for móvel (Ficha de Móvel - Item 5)
    if (item.furnitureId || ['MOVEL_SOLTO', 'MARCENARIA', 'ESTOFADO'].includes(item.category)) {
      contentHtml = renderFurnitureSheetContent(item);
    } 
    // Se for produto de catálogo (Ficha de Produto - Item 4)
    else if (item.productId || item.productName) {
      contentHtml = renderProductSheetContent(item);
    } 
    // Ficha de Material (Item 6)
    else {
      contentHtml = renderMaterialSheetContent(item);
    }

    const modalHtml = `
      <div class="spec-modal-backdrop" id="spec-detail-modal" onclick="SpecificationBookModule.closeModal(event)">
        <div class="spec-modal-card animate-fade-in" onclick="event.stopPropagation()">
          <div class="spec-modal-header d-flex justify-content-between align-items-center">
            <h3><i data-lucide="file-text"></i> Ficha Técnica de Especificação</h3>
            <button class="btn-close-modal" onclick="SpecificationBookModule.closeModal(event)">&times;</button>
          </div>
          <div class="spec-modal-body">
            ${contentHtml}
          </div>
          <div class="spec-modal-footer d-flex justify-content-between">
            <div>
              <span class="text-muted" style="font-size: 0.8rem;">Origem da Informação:</span>
              ${renderOriginBadge(item.origin)}
            </div>
            <button class="btn btn-outline btn-sm" onclick="window.print()">
              <i data-lucide="printer"></i> Imprimir Ficha
            </button>
          </div>
        </div>
      </div>
    `;

    const existing = document.getElementById('spec-detail-modal');
    if (existing) existing.remove();

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    if (window.lucide) lucide.createIcons();
  }

  function renderProductSheetContent(e) {
    return `
      <div class="sheet-spec-grid">
        ${e.imageUrl ? `
          <div class="sheet-spec-photo">
            <img src="${e.imageUrl}" alt="${escapeHTML(e.itemName)}">
          </div>
        ` : ''}
        <div class="sheet-spec-attributes">
          <h2 class="sheet-item-title">${escapeHTML(e.itemName)}</h2>
          <dl class="dl-spec">
            <dt>Categoria:</dt><dd>${escapeHTML(e.category)}</dd>
            <dt>Fabricante:</dt><dd>${escapeHTML(e.manufacturerName || '-')}</dd>
            <dt>Produto:</dt><dd>${escapeHTML(e.productName || '-')}</dd>
            <dt>Coleção:</dt><dd>${escapeHTML(e.collectionName || '-')}</dd>
            <dt>Código / SKU:</dt><dd><code>${escapeHTML(e.commercialCode || '-')}</code></dd>
            <dt>Acabamento:</dt><dd>${escapeHTML(e.finish || '-')}</dd>
            <dt>Dimensão:</dt><dd>${escapeHTML(e.dimensions || '-')}</dd>
            <dt>Quantidade:</dt><dd><strong>${e.quantity !== null && e.quantity !== undefined ? e.quantity : '-'} ${escapeHTML(e.unit || '')}</strong></dd>
            <dt>Fornecedor:</dt><dd>${escapeHTML(e.supplierName || '-')}</dd>
            <dt>Data Consulta:</dt><dd>${formatDateBR(e.consultedAt || '-')}</dd>
            <dt>Link Catálogo:</dt><dd>${e.externalLink ? `<a href="${escapeHTML(e.externalLink)}" target="_blank" rel="noopener">Acessar Fornecedor ↗</a>` : '-'}</dd>
            <dt>Observações:</dt><dd>${escapeHTML(e.notes || '-')}</dd>
          </dl>
        </div>
      </div>
    `;
  }

  function renderFurnitureSheetContent(e) {
    return `
      <div class="sheet-spec-grid">
        ${e.imageUrl ? `
          <div class="sheet-spec-photo">
            <img src="${e.imageUrl}" alt="${escapeHTML(e.itemName)}">
          </div>
        ` : ''}
        <div class="sheet-spec-attributes">
          <h2 class="sheet-item-title">${escapeHTML(e.itemName)}</h2>
          <dl class="dl-spec">
            <dt>Nome:</dt><dd>${escapeHTML(e.itemName)}</dd>
            <dt>Categoria:</dt><dd>${escapeHTML(e.category)}</dd>
            <dt>Quantidade:</dt><dd><strong>${e.quantity !== null && e.quantity !== undefined ? e.quantity : 1} un</strong></dd>
            <dt>Medidas:</dt><dd><strong>${escapeHTML(e.dimensions || '-')}</strong></dd>
            <dt>Material:</dt><dd>${escapeHTML(e.materialDesc || '-')}</dd>
            <dt>Acabamento:</dt><dd>${escapeHTML(e.finish || '-')}</dd>
            <dt>Fabricante:</dt><dd>${escapeHTML(e.manufacturerName || '-')}</dd>
            <dt>Modelo:</dt><dd>${escapeHTML(e.productName || '-')}</dd>
            <dt>Código:</dt><dd><code>${escapeHTML(e.commercialCode || '-')}</code></dd>
            <dt>Fornecedor:</dt><dd>${escapeHTML(e.supplierName || '-')}</dd>
            <dt>Link:</dt><dd>${e.externalLink ? `<a href="${escapeHTML(e.externalLink)}" target="_blank" rel="noopener">Ficha de Fábrica ↗</a>` : '-'}</dd>
            <dt>Observação:</dt><dd>${escapeHTML(e.notes || '-')}</dd>
          </dl>
        </div>
      </div>
    `;
  }

  function renderMaterialSheetContent(e) {
    return `
      <div class="sheet-spec-grid">
        ${e.imageUrl ? `
          <div class="sheet-spec-photo">
            <img src="${e.imageUrl}" alt="${escapeHTML(e.itemName)}">
          </div>
        ` : ''}
        <div class="sheet-spec-attributes">
          <h2 class="sheet-item-title">${escapeHTML(e.itemName)}</h2>
          <dl class="dl-spec">
            <dt>Material:</dt><dd>${escapeHTML(e.itemName)}</dd>
            <dt>Aplicação:</dt><dd>${escapeHTML(e.category)}</dd>
            <dt>Produto:</dt><dd>${escapeHTML(e.productName || '-')}</dd>
            <dt>Fabricante:</dt><dd>${escapeHTML(e.manufacturerName || '-')}</dd>
            <dt>Código:</dt><dd><code>${escapeHTML(e.commercialCode || '-')}</code></dd>
            <dt>Acabamento:</dt><dd>${escapeHTML(e.finish || '-')}</dd>
            <dt>Dimensão:</dt><dd>${escapeHTML(e.dimensions || '-')} / Espessura</dd>
            <dt>Quantidade:</dt><dd><strong>${e.quantity !== null && e.quantity !== undefined ? e.quantity : '-'} ${escapeHTML(e.unit || '')}</strong></dd>
            <dt>Fornecedor:</dt><dd>${escapeHTML(e.supplierName || '-')}</dd>
            <dt>Link:</dt><dd>${e.externalLink ? `<a href="${escapeHTML(e.externalLink)}" target="_blank" rel="noopener">Ver Catálogo ↗</a>` : '-'}</dd>
            <dt>Observação:</dt><dd>${escapeHTML(e.notes || '-')}</dd>
          </dl>
        </div>
      </div>
    `;
  }

  function closeModal(evt) {
    const modal = document.getElementById('spec-detail-modal');
    if (modal) modal.remove();
  }

  function setActiveBook(bookId) {
    activeBookId = bookId;
    refreshView();
  }

  function switchDocType(docType, projectId, environmentId) {
    activeDocType = docType;
    generateAutomatic(projectId, environmentId || null, docType);
  }

  function refreshView() {
    const root = document.getElementById('spec-book-root');
    if (root && StudioApp.activeProject) {
      const html = StudioApp.activeEnvironment 
        ? renderEnvironmentTab(StudioApp.activeEnvironment, StudioApp.activeProject)
        : renderProjectTab(StudioApp.activeProject);
      const parent = root.parentElement;
      if (parent) {
        parent.innerHTML = html;
        if (window.lucide) lucide.createIcons();
      }
    }
  }

  function generateAutomatic(projectId, environmentId, docType) {
    try {
      const book = StudioState.generateSpecificationBook(projectId, environmentId, docType);
      activeBookId = book.id;
      if (window.StudioApp) {
        StudioApp.showToast(`Documento ${book.title} compilado com sucesso!`, 'success');
      }
      refreshView();
    } catch (err) {
      alert('Erro ao compilar documento: ' + err.message);
    }
  }

  function generateBookPrompt(projectId, environmentId) {
    const type = prompt('Informe o tipo de lista a gerar (CADERNO_GERAL, LISTA_MOVEIS, LISTA_MATERIAIS, QUANTITATIVO, LISTA_EQUIPAMENTOS, LISTA_ILUMINACAO, LISTA_FORNECEDORES, LISTA_PRODUTOS):', 'CADERNO_GERAL');
    if (!type) return;
    generateAutomatic(projectId, environmentId, type.toUpperCase());
  }

  function openCreateModal(projectId, environmentId) {
    const title = prompt('Nome do Caderno de Especificações:', 'Caderno de Especificações Técnicas');
    if (!title) return;

    try {
      const book = StudioState.createSpecificationBook({
        projectId,
        environmentId,
        title,
        docType: 'CADERNO_GERAL'
      });
      activeBookId = book.id;
      refreshView();
    } catch (err) {
      alert('Erro ao criar caderno: ' + err.message);
    }
  }

  function openAddEntryModal(bookId) {
    const book = StudioState.getSpecificationBook(bookId);
    if (!book) return;

    const itemName = prompt('Nome do Item / Especificação:');
    if (!itemName) return;

    const category = prompt('Categoria (ex: MARCENARIA, PEDRA, MOVEL_SOLTO, PINTURA, LOUCA):', 'MARCENARIA');
    const origin = prompt('Origem do Dado (CONFIRMADO, CALCULADO, ESTIMADO, SUGERIDO):', 'CONFIRMADO');

    try {
      StudioState.addSpecificationEntry(bookId, {
        itemName,
        category: category.toUpperCase(),
        origin: origin.toUpperCase()
      });
      refreshView();
    } catch (err) {
      alert('Erro ao adicionar item: ' + err.message);
    }
  }

  function deleteEntry(bookId, entryId) {
    if (!confirm('Deseja excluir este item do caderno?')) return;
    try {
      StudioState.removeSpecificationEntry(bookId, entryId);
      refreshView();
    } catch (err) {
      alert(err.message);
    }
  }

  function openApproveModal(bookId) {
    const book = StudioState.getSpecificationBook(bookId);
    if (!book) return;

    const notes = prompt(`Homologação Formal do Caderno (${book.version})\nDigite as observações técnicas de homologação:`, 'Caderno de especificações validado para envio a fornecedores e obra.');
    if (notes !== null) {
      try {
        StudioState.approveSpecificationBook(bookId, 'Eduardo Marques', notes);
        if (window.StudioApp) {
          StudioApp.showToast(`Caderno ${book.version} homologado com sucesso!`, 'success');
        }
        refreshView();
      } catch (err) {
        alert('Erro ao homologar caderno: ' + err.message);
      }
    }
  }

  function versionBook(bookId) {
    const book = StudioState.getSpecificationBook(bookId);
    if (!book) return;

    if (confirm(`Deseja criar uma nova revisão a partir da versão ${book.version}? O caderno atual será mantido congelado para auditoria.`)) {
      try {
        const next = StudioState.versionSpecificationBook(bookId, {}, 'Eduardo Marques');
        activeBookId = next.id;
        if (window.StudioApp) {
          StudioApp.showToast(`Nova revisão ${next.version} criada para edição!`, 'success');
        }
        refreshView();
      } catch (err) {
        alert('Erro ao versionar: ' + err.message);
      }
    }
  }

  function downloadCsv(bookId) {
    try {
      const csv = StudioState.exportSpecificationBookToCsv(bookId);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `especificacoes_${bookId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Erro ao exportar CSV: ' + err.message);
    }
  }

  function downloadXlsx(bookId) {
    try {
      const xml = StudioState.exportSpecificationBookToXlsxXml(bookId);
      const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `especificacoes_${bookId}.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Erro ao exportar Excel: ' + err.message);
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
    if (!isoStr || isoStr === '-') return '-';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('pt-BR');
    } catch (e) {
      return isoStr;
    }
  }

  return {
    renderEnvironmentTab,
    renderProjectTab,
    setActiveBook,
    switchDocType,
    generateAutomatic,
    generateBookPrompt,
    openCreateModal,
    openAddEntryModal,
    deleteEntry,
    openApproveModal,
    versionBook,
    downloadCsv,
    downloadXlsx,
    openSheetModal,
    closeModal
  };
})();

if (typeof window !== 'undefined') {
  window.SpecificationBookModule = SpecificationBookModule;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SpecificationBookModule;
}
