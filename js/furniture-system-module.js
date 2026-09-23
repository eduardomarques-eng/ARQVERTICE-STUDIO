/**
 * ============================================================================
 * ARQVERTICE STUDIO — E01: SISTEMA DE MÓVEIS, MARCENARIA E EQUIPAMENTOS
 * ============================================================================
 * Módulo de interface para especificação técnica por ambiente, agrupamento
 * de conjuntos, identificação assistida por IA, aprovação, rejeição com motivo,
 * versionamento V01/V02 e exportação CSV.
 */

const FurnitureSystemModule = (function () {
  'use strict';

  function escapeHTML(str) {
    if (!str && str !== 0) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatCurrencyBRL(value) {
    if (value === null || value === undefined || isNaN(value)) return '—';
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  /**
   * Renderiza a especificação de mobiliário dentro do container do ambiente
   */
  function renderEnvironmentFurniture(containerId, environmentId, filterOptions = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const state = (typeof StudioState !== 'undefined') ? StudioState : null;
    if (!state) {
      container.innerHTML = '<div class="alert alert-warning">Estado do sistema não carregado.</div>';
      return;
    }

    const projectId = state.data.selectedProjectId || 'prj-praia-01';
    const envId = environmentId || state.data.selectedEnvironmentId || 'amb-sala-01';
    const items = state.getEnvironmentFurniture(projectId, envId, filterOptions);
    const summary = state.getFurnitureSummary(projectId, envId);
    const groups = (state.data.furnitureGroups || []).filter(g => g.environmentId === envId);

    let html = `
      <div class="furniture-system-container">
        <!-- BARRA SUPERIOR DE MÉTRICAS -->
        <div class="furniture-summary-grid">
          <div class="furniture-stat-card">
            <span class="stat-label">Total de Itens</span>
            <span class="stat-value">${summary.totalItems}</span>
          </div>
          <div class="furniture-stat-card stat-approved">
            <span class="stat-label">Aprovados</span>
            <span class="stat-value">${summary.approvedCount}</span>
          </div>
          <div class="furniture-stat-card stat-review">
            <span class="stat-label">Em Revisão / Rascunho</span>
            <span class="stat-value">${summary.inReviewCount}</span>
          </div>
          <div class="furniture-stat-card stat-millwork">
            <span class="stat-label">Marcenaria Sob Medida</span>
            <span class="stat-value">${summary.millworkCount}</span>
          </div>
          <div class="furniture-stat-card stat-existing">
            <span class="stat-label">Existentes (Cliente)</span>
            <span class="stat-value">${summary.existingCount}</span>
          </div>
          <div class="furniture-stat-card stat-budget">
            <span class="stat-label">Custo Estimado</span>
            <span class="stat-value">${formatCurrencyBRL(summary.totalEstimatedCostBRL)}</span>
          </div>
        </div>

        <!-- BARRA DE AÇÕES E EXPORTAÇÃO -->
        <div class="furniture-actions-toolbar">
          <div class="toolbar-left">
            <button class="btn btn-primary" onclick="FurnitureSystemModule.openCreateItemModal('${projectId}', '${envId}')">
              <i class="icon-plus"></i> + Novo Item
            </button>
            <button class="btn btn-secondary" onclick="FurnitureSystemModule.openAIIdentificationModal('${projectId}', '${envId}')">
              <i class="icon-ai"></i> Identificar por Imagem (IA)
            </button>
            <button class="btn btn-secondary" onclick="FurnitureSystemModule.openCreateGroupModal('${projectId}', '${envId}')">
              <i class="icon-folder"></i> Criar Conjunto
            </button>
          </div>
          <div class="toolbar-right">
            <button class="btn btn-outline" onclick="FurnitureSystemModule.downloadCSV('${projectId}', '${envId}')" title="Exportar tabela para CSV">
              ⬇ Exportar CSV
            </button>
            <button class="btn btn-outline" onclick="FurnitureSystemModule.showExportNotice('PDF')" title="Preparado para exportação PDF">
              📄 Exportar PDF
            </button>
            <button class="btn btn-outline" onclick="FurnitureSystemModule.showExportNotice('XLSX')" title="Preparado para exportação XLSX">
              📊 Exportar XLSX
            </button>
          </div>
        </div>

        <!-- FILTROS RÁPIDOS -->
        <div class="furniture-filter-bar">
          <span class="filter-label">Filtros:</span>
          <button class="filter-chip ${!filterOptions.category && !filterOptions.status ? 'active' : ''}" onclick="FurnitureSystemModule.filterItems('${containerId}', '${envId}', {})">Todos</button>
          <button class="filter-chip ${filterOptions.category === 'MOVEL_SOLTO' ? 'active' : ''}" onclick="FurnitureSystemModule.filterItems('${containerId}', '${envId}', { category: 'MOVEL_SOLTO' })">Móvel Solto</button>
          <button class="filter-chip ${filterOptions.category === 'MARCENARIA' ? 'active' : ''}" onclick="FurnitureSystemModule.filterItems('${containerId}', '${envId}', { category: 'MARCENARIA' })">Marcenaria</button>
          <button class="filter-chip ${filterOptions.category === 'ILUMINACAO' ? 'active' : ''}" onclick="FurnitureSystemModule.filterItems('${containerId}', '${envId}', { category: 'ILUMINACAO' })">Iluminação</button>
          <button class="filter-chip ${filterOptions.category === 'ELETRODOMESTICO' ? 'active' : ''}" onclick="FurnitureSystemModule.filterItems('${containerId}', '${envId}', { category: 'ELETRODOMESTICO' })">Eletrodomésticos</button>
          <button class="filter-chip ${filterOptions.status === 'APPROVED' ? 'active' : ''}" onclick="FurnitureSystemModule.filterItems('${containerId}', '${envId}', { status: 'APPROVED' })">Aprovados</button>
          <button class="filter-chip ${filterOptions.status === 'SUGGESTED' ? 'active' : ''}" onclick="FurnitureSystemModule.filterItems('${containerId}', '${envId}', { status: 'SUGGESTED' })">Sugestões IA</button>
        </div>

        <!-- TABELA DE ESPECIFICAÇÃO TÉCNICA (Prompt E01 Item 24) -->
        <div class="furniture-table-wrapper">
          <table class="furniture-spec-table">
            <thead>
              <tr>
                <th>ITEM</th>
                <th>CATEGORIA</th>
                <th>TIPO</th>
                <th>QUANTIDADE</th>
                <th>MEDIDAS (L x P x A)</th>
                <th>MATERIAL / ACABAMENTO</th>
                <th>STATUS</th>
                <th>REFERÊNCIA / ORIGEM</th>
                <th style="text-align: right;">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
    `;

    if (items.length === 0) {
      html += `
        <tr>
          <td colspan="9" class="empty-table-row">
            Nenhum item de mobiliário cadastrado para este ambiente ou filtro selecionado.
          </td>
        </tr>
      `;
    } else {
      items.forEach(item => {
        const statusBadges = {
          'APPROVED': '<span class="status-badge badge-approved">APROVADO</span>',
          'IN_REVIEW': '<span class="status-badge badge-review">EM REVISÃO</span>',
          'DRAFT': '<span class="status-badge badge-draft">RASCUNHO</span>',
          'SUGGESTED': '<span class="status-badge badge-suggested">SUGESTÃO IA</span>',
          'REJECTED': '<span class="status-badge badge-rejected" title="Rejeitado">REJEITADO</span>',
          'SUPERSEDED': '<span class="status-badge badge-superseded">SUBSTITUÍDO</span>'
        };

        const typeLabels = {
          'EXISTING': '<span class="type-badge badge-existing">EXISTENTE</span>',
          'NEW': '<span class="type-badge badge-new">NOVO</span>',
          'CUSTOM_MILLWORK': '<span class="type-badge badge-millwork">SOB MEDIDA</span>'
        };

        const dimensions = (item.width || item.depth || item.height)
          ? `${item.width || '-'} x ${item.depth || '-'} x ${item.height || '-'} ${escapeHTML(item.dimensionUnit)}`
          : '<span class="text-muted">A definir</span>';

        const isAi = item.isAiSuggestion || item.origin === 'IA';
        const aiBanner = isAi ? `
          <div class="item-ai-indicator" title="${escapeHTML(item.notes || 'Identificado por IA')}">
            🤖 <strong>${escapeHTML(item.aiLabel || 'SUGESTÃO')}</strong>
          </div>
        ` : '';

        const groupTag = item.groupName ? `
          <div class="item-group-tag" title="Pertence ao conjunto: ${escapeHTML(item.groupName)}">
            📁 ${escapeHTML(item.groupName)}
          </div>
        ` : '';

        html += `
          <tr class="furniture-row ${item.status === 'REJECTED' ? 'row-rejected' : ''} ${isAi ? 'row-ai-suggested' : ''}">
            <td class="col-item-main">
              <div class="item-name-wrap">
                <span class="item-name">${escapeHTML(item.name)}</span>
                <span class="item-version">${escapeHTML(item.versionCode || 'V01')}</span>
              </div>
              ${item.description ? `<div class="item-description">${escapeHTML(item.description)}</div>` : ''}
              ${groupTag}
              ${aiBanner}
              ${item.rejectionReason ? `<div class="item-rejection-note"><strong>Motivo da Rejeição:</strong> ${escapeHTML(item.rejectionReason)}</div>` : ''}
            </td>
            <td>
              <span class="category-pill">${escapeHTML(item.category)}</span>
            </td>
            <td>
              ${typeLabels[item.itemType] || item.itemType}
              ${item.requirementType === 'OPTIONAL' ? '<div class="req-optional">OPCIONAL</div>' : ''}
            </td>
            <td>
              <strong>${item.quantityValue}</strong> ${escapeHTML(item.quantityUnit)}
              <div class="text-subtle text-xs">Origem: ${escapeHTML(item.quantityOrigin)}</div>
            </td>
            <td class="col-measurements">
              <code>${dimensions}</code>
              ${item.isCustomMillwork && item.technicalDrawingRef ? `<div class="text-xs text-primary">📐 ${escapeHTML(item.technicalDrawingRef)}</div>` : ''}
            </td>
            <td>
              <div><strong>${escapeHTML(item.material || '—')}</strong></div>
              <div class="text-subtle text-xs">${escapeHTML(item.finish || '')} ${item.color ? `• ${escapeHTML(item.color)}` : ''}</div>
            </td>
            <td>
              ${statusBadges[item.status] || item.status}
            </td>
            <td>
              <div class="ref-text">${escapeHTML(item.referenceText || '—')}</div>
              <div class="text-subtle text-xs">Fonte: ${escapeHTML(item.origin)}</div>
              ${item.supplier ? `<div class="text-xs">Fornecedor: ${escapeHTML(item.supplier)}</div>` : ''}
            </td>
            <td class="col-actions">
              <div class="actions-btn-group">
                ${item.status !== 'APPROVED' ? `
                  <button class="btn-action-icon btn-approve" onclick="FurnitureSystemModule.approveItem('${item.id}', '${containerId}', '${envId}')" title="Aprovar e homologar para o ambiente">
                    ✔
                  </button>
                ` : ''}
                ${item.status !== 'REJECTED' ? `
                  <button class="btn-action-icon btn-reject" onclick="FurnitureSystemModule.promptRejectItem('${item.id}', '${containerId}', '${envId}')" title="Rejeitar com justificativa">
                    ✖
                  </button>
                ` : ''}
                <button class="btn-action-icon btn-version" onclick="FurnitureSystemModule.promptNewVersion('${item.id}', '${containerId}', '${envId}')" title="Criar nova versão (V02/V03)">
                  ⤾
                </button>
                <button class="btn-action-icon btn-clone" onclick="FurnitureSystemModule.duplicateItem('${item.id}', '${containerId}', '${envId}')" title="Duplicar item">
                  ⧉
                </button>
              </div>
            </td>
          </tr>
        `;
      });
    }

    html += `
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * Filtra os itens re-renderizando a tabela
   */
  function filterItems(containerId, environmentId, options) {
    renderEnvironmentFurniture(containerId, environmentId, options);
  }

  /**
   * Aprovação de um item
   */
  function approveItem(itemId, containerId, environmentId) {
    const state = (typeof StudioState !== 'undefined') ? StudioState : null;
    if (!state) return;
    try {
      state.approveFurnitureItem(itemId, 'Eduardo Marques (Arquiteto Titular)');
      renderEnvironmentFurniture(containerId, environmentId);
    } catch (e) {
      alert('Erro ao aprovar item: ' + e.message);
    }
  }

  /**
   * Diálogo para rejeitar um item com justificativa obrigatória (Prompt E01 Item 10)
   */
  function promptRejectItem(itemId, containerId, environmentId) {
    const state = (typeof StudioState !== 'undefined') ? StudioState : null;
    if (!state) return;

    const item = state.getFurnitureItem(itemId);
    if (!item) return;

    const reason = window.prompt(`Informe o motivo da rejeição do item "${item.name}":`, 'Não atende às dimensões requeridas pelo layout');
    if (reason === null) return; // Cancelado

    if (!reason.trim()) {
      alert('É obrigatório registrar o motivo da rejeição.');
      return;
    }

    try {
      state.rejectFurnitureItem(itemId, reason.trim(), 'Eduardo Marques');
      renderEnvironmentFurniture(containerId, environmentId);
    } catch (e) {
      alert('Erro ao rejeitar item: ' + e.message);
    }
  }

  /**
   * Cria nova versão do item (V01 -> V02 -> V03) sem substituição silenciosa (Prompt E01 Item 19)
   */
  function promptNewVersion(itemId, containerId, environmentId) {
    const state = (typeof StudioState !== 'undefined') ? StudioState : null;
    if (!state) return;

    const item = state.getFurnitureItem(itemId);
    if (!item) return;

    const changeNotes = window.prompt(`Criar nova versão a partir de "${item.name} (${item.versionCode})". Descreva a alteração:`, 'Ajuste de acabamento e redução de 20cm na largura');
    if (changeNotes === null) return;

    try {
      state.versionFurnitureItem(itemId, {
        notes: item.notes ? `${item.notes}\n[Versão]: ${changeNotes}` : `[Versão]: ${changeNotes}`,
        status: 'IN_REVIEW'
      }, 'Eduardo Marques');
      renderEnvironmentFurniture(containerId, environmentId);
    } catch (e) {
      alert('Erro ao versionar item: ' + e.message);
    }
  }

  /**
   * Duplica um item
   */
  function duplicateItem(itemId, containerId, environmentId) {
    const state = (typeof StudioState !== 'undefined') ? StudioState : null;
    if (!state) return;

    try {
      state.duplicateFurnitureItem(itemId, environmentId, 'Eduardo Marques');
      renderEnvironmentFurniture(containerId, environmentId);
    } catch (e) {
      alert('Erro ao duplicar item: ' + e.message);
    }
  }

  /**
   * Modal para identificação por visão computacional / IA (Prompt E01 Itens 11 e 12)
   */
  function openAIIdentificationModal(projectId, environmentId) {
    const state = (typeof StudioState !== 'undefined') ? StudioState : null;
    if (!state) return;

    let modal = document.getElementById('furniture-ai-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'furniture-ai-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-card modal-lg">
        <div class="modal-header">
          <h3>🤖 Identificação de Mobiliário por Visão Computacional (IA)</h3>
          <button class="modal-close-btn" onclick="document.getElementById('furniture-ai-modal').classList.remove('active')">&times;</button>
        </div>
        <div class="modal-body">
          <div class="alert alert-info">
            <strong>Princípio Anti-Alucinação (E01 Item 1 e 12):</strong>
            O sistema identifica aparências e sugere categorias volumétricas. Não inventa produtos comerciais reais nem fabrica marcas/SKUs sem comprovação técnica. Todas as detecções requerem homologação humana explícita.
          </div>

          <div class="form-group">
            <label>Selecione a Imagem / Render do Ambiente:</label>
            <select id="ai-source-image" class="form-control">
              <option value="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80">Render Living Integrado com Deck (V01 - Homologado)</option>
              <option value="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80">Perspectiva Geral da Área Social Poente</option>
            </select>
          </div>

          <div class="ai-detected-preview-box">
            <h4>Detecção Assistida de Elementos</h4>
            <p class="text-subtle">A IA analisará os planos espaciais, delimitando sofás, luminárias, marcenaria e tapetes sugeridos para o ambiente.</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('furniture-ai-modal').classList.remove('active')">Cancelar</button>
          <button class="btn btn-primary" onclick="FurnitureSystemModule.runAIDetection('${projectId}', '${environmentId}')">
            Executar Detecção Assistida
          </button>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  /**
   * Executa a detecção de IA e atualiza o estado
   */
  function runAIDetection(projectId, environmentId) {
    const state = (typeof StudioState !== 'undefined') ? StudioState : null;
    if (!state) return;

    const select = document.getElementById('ai-source-image');
    const imageUrl = select ? select.value : 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80';

    try {
      const suggestions = state.identifyFurnitureFromImage(imageUrl, environmentId, { projectId });
      const modal = document.getElementById('furniture-ai-modal');
      if (modal) modal.classList.remove('active');

      alert(`Detecção de IA concluída com sucesso!\n${suggestions.length} elementos sugeridos foram cadastrados com status "SUGGESTED" (com rotulação "SUGESTÃO").\nVocê pode confirmá-los, editá-los ou ignorá-los.`);
      
      const containerId = 'furniture-tab-content';
      renderEnvironmentFurniture(containerId, environmentId);
    } catch (e) {
      alert('Erro na análise de visão computacional: ' + e.message);
    }
  }

  /**
   * Modal de criação manual de item
   */
  function openCreateItemModal(projectId, environmentId) {
    const state = (typeof StudioState !== 'undefined') ? StudioState : null;
    if (!state) return;

    let modal = document.getElementById('furniture-create-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'furniture-create-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    const categoriesOptions = state.FURNITURE_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
    const originsOptions = state.FURNITURE_ORIGINS.map(o => `<option value="${o}">${o}</option>`).join('');
    const unitsOptions = state.FURNITURE_QUANTITY_UNITS.map(u => `<option value="${u}">${u}</option>`).join('');

    modal.innerHTML = `
      <div class="modal-card modal-lg">
        <div class="modal-header">
          <h3>Novo Item de Mobiliário / Marcenaria</h3>
          <button class="modal-close-btn" onclick="document.getElementById('furniture-create-modal').classList.remove('active')">&times;</button>
        </div>
        <div class="modal-body">
          <form id="create-furniture-form" onsubmit="event.preventDefault(); FurnitureSystemModule.submitCreateItem('${projectId}', '${environmentId}');">
            <div class="form-row">
              <div class="form-group form-col-8">
                <label>Nome do Item *</label>
                <input type="text" id="furn-input-name" class="form-control" placeholder="Ex: Sofá Living 3 Lugares" required />
              </div>
              <div class="form-group form-col-4">
                <label>Categoria *</label>
                <select id="furn-input-category" class="form-control">
                  ${categoriesOptions}
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group form-col-4">
                <label>Tipologia *</label>
                <select id="furn-input-itemtype" class="form-control">
                  <option value="NEW">NOVO (A especificar/adquirir)</option>
                  <option value="EXISTING">EXISTENTE (Acervo cliente)</option>
                  <option value="CUSTOM_MILLWORK">SOB MEDIDA (Marcenaria)</option>
                </select>
              </div>
              <div class="form-group form-col-4">
                <label>Obrigatoriedade</label>
                <select id="furn-input-requirement" class="form-control">
                  <option value="REQUIRED">OBRIGATÓRIO (Required)</option>
                  <option value="OPTIONAL">OPCIONAL (Optional)</option>
                </select>
              </div>
              <div class="form-group form-col-4">
                <label>Origem do Dado *</label>
                <select id="furn-input-origin" class="form-control">
                  ${originsOptions}
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group form-col-4">
                <label>Quantidade *</label>
                <input type="number" id="furn-input-qty" class="form-control" value="1" step="0.5" min="0.5" required />
              </div>
              <div class="form-group form-col-4">
                <label>Unidade *</label>
                <select id="furn-input-unit" class="form-control">
                  ${unitsOptions}
                </select>
              </div>
              <div class="form-group form-col-4">
                <label>Origem da Medição</label>
                <select id="furn-input-qty-origin" class="form-control">
                  ${originsOptions}
                </select>
              </div>
            </div>

            <!-- MEDIDAS TÉCNICAS (Prompt E01 Item 16) -->
            <div class="form-section-title">Medidas Técnicas (L x P x A)</div>
            <div class="form-row">
              <div class="form-group form-col-3">
                <label>Largura (L)</label>
                <input type="number" id="furn-input-width" class="form-control" placeholder="Ex: 220" step="0.1" />
              </div>
              <div class="form-group form-col-3">
                <label>Profundidade (P)</label>
                <input type="number" id="furn-input-depth" class="form-control" placeholder="Ex: 100" step="0.1" />
              </div>
              <div class="form-group form-col-3">
                <label>Altura (A)</label>
                <input type="number" id="furn-input-height" class="form-control" placeholder="Ex: 75" step="0.1" />
              </div>
              <div class="form-group form-col-3">
                <label>Unidade de Medida *</label>
                <select id="furn-input-dim-unit" class="form-control">
                  <option value="CM">Centímetros (CM)</option>
                  <option value="M">Metros (M)</option>
                  <option value="MM">Milímetros (MM)</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group form-col-4">
                <label>Material</label>
                <input type="text" id="furn-input-material" class="form-control" placeholder="Ex: Carvalho maciço" />
              </div>
              <div class="form-group form-col-4">
                <label>Acabamento</label>
                <input type="text" id="furn-input-finish" class="form-control" placeholder="Ex: Verniz fosco acetinado" />
              </div>
              <div class="form-group form-col-4">
                <label>Cor</label>
                <input type="text" id="furn-input-color" class="form-control" placeholder="Ex: Natural / Areia" />
              </div>
            </div>

            <div class="form-group">
              <label>Referência Visual / Observação</label>
              <textarea id="furn-input-ref" class="form-control" rows="2" placeholder="Ex: Referência aprovada pelo cliente no briefing"></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('furniture-create-modal').classList.remove('active')">Cancelar</button>
          <button class="btn btn-primary" onclick="document.getElementById('create-furniture-form').requestSubmit()">Salvar Item</button>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  /**
   * Submete a criação manual de item
   */
  function submitCreateItem(projectId, environmentId) {
    const state = (typeof StudioState !== 'undefined') ? StudioState : null;
    if (!state) return;

    const name = document.getElementById('furn-input-name').value;
    const category = document.getElementById('furn-input-category').value;
    const itemType = document.getElementById('furn-input-itemtype').value;
    const requirementType = document.getElementById('furn-input-requirement').value;
    const origin = document.getElementById('furn-input-origin').value;
    const quantityValue = document.getElementById('furn-input-qty').value;
    const quantityUnit = document.getElementById('furn-input-unit').value;
    const quantityOrigin = document.getElementById('furn-input-qty-origin').value;
    const width = document.getElementById('furn-input-width').value;
    const depth = document.getElementById('furn-input-depth').value;
    const height = document.getElementById('furn-input-height').value;
    const dimensionUnit = document.getElementById('furn-input-dim-unit').value;
    const material = document.getElementById('furn-input-material').value;
    const finish = document.getElementById('furn-input-finish').value;
    const color = document.getElementById('furn-input-color').value;
    const referenceText = document.getElementById('furn-input-ref').value;

    try {
      state.createFurnitureItem({
        projectId,
        environmentId,
        name,
        category,
        itemType,
        requirementType,
        origin,
        quantityValue,
        quantityUnit,
        quantityOrigin,
        width: width ? Number(width) : null,
        depth: depth ? Number(depth) : null,
        height: height ? Number(height) : null,
        dimensionUnit,
        material,
        finish,
        color,
        referenceText,
        isCustomMillwork: itemType === 'CUSTOM_MILLWORK'
      }, 'Eduardo Marques');

      const modal = document.getElementById('furniture-create-modal');
      if (modal) modal.classList.remove('active');

      const containerId = 'furniture-tab-content';
      renderEnvironmentFurniture(containerId, environmentId);
    } catch (e) {
      alert('Erro ao criar item: ' + e.message);
    }
  }

  /**
   * Criação de conjunto / grupo
   */
  function openCreateGroupModal(projectId, environmentId) {
    const name = window.prompt('Nome do Conjunto / Agrupamento (Ex: Conjunto de Jantar Florença):');
    if (!name || !name.trim()) return;

    const desc = window.prompt('Descrição do Conjunto (Opcional):', 'Composição de mesa e cadeiras coordenadas');

    const state = (typeof StudioState !== 'undefined') ? StudioState : null;
    if (!state) return;

    try {
      state.createFurnitureGroup({
        projectId,
        environmentId,
        name: name.trim(),
        description: desc ? desc.trim() : ''
      });
      alert(`Conjunto "${name.trim()}" criado com sucesso!`);
      const containerId = 'furniture-tab-content';
      renderEnvironmentFurniture(containerId, environmentId);
    } catch (e) {
      alert('Erro ao criar conjunto: ' + e.message);
    }
  }

  /**
   * Baixa a especificação em formato CSV
   */
  function downloadCSV(projectId, environmentId) {
    const state = (typeof StudioState !== 'undefined') ? StudioState : null;
    if (!state) return;

    try {
      const csvContent = state.exportFurnitureToCSV(projectId, environmentId);
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `arqvertice_moveis_${projectId}_${environmentId || 'geral'}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Erro ao exportar CSV: ' + e.message);
    }
  }

  /**
   * Notificação de exportação PDF / XLSX preparada (Prompt E01 Item 26)
   */
  function showExportNotice(format) {
    alert(`A estrutura de dados canônica para exportação ${format} está configurada e pronta para geração.`);
  }

  return {
    renderEnvironmentFurniture,
    filterItems,
    approveItem,
    promptRejectItem,
    promptNewVersion,
    duplicateItem,
    openAIIdentificationModal,
    runAIDetection,
    openCreateItemModal,
    submitCreateItem,
    openCreateGroupModal,
    downloadCSV,
    showExportNotice
  };
})();

if (typeof window !== 'undefined') {
  window.FurnitureSystemModule = FurnitureSystemModule;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FurnitureSystemModule;
}
