/**
 * ============================================================================
 * ARQVERTICE STUDIO — E02: SISTEMA DE MATERIAIS, REVESTIMENTOS E ESPECIFICAÇÕES
 * ============================================================================
 * Módulo de interface para especificação técnica de materiais por ambiente,
 * separação entre conceito e produto específico, cadastro de fabricantes,
 * fornecedores regionais, ficha técnica detalhada e exportação CSV.
 */

const MaterialsSystemModule = (function () {
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
   * Renderiza a aba de materiais e revestimentos do ambiente
   */
  function renderEnvironmentMaterials(containerId, environmentId, filterOptions = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const state = (typeof StudioState !== 'undefined') ? StudioState : null;
    if (!state) {
      container.innerHTML = '<div class="alert alert-warning">Estado do sistema não carregado.</div>';
      return;
    }

    const projectId = state.data.selectedProjectId || 'prj-praia-01';
    const envId = environmentId || state.data.selectedEnvironmentId || 'amb-sala-01';
    const materials = state.getEnvironmentMaterials(projectId, envId, filterOptions);
    const summary = state.getMaterialSummary(projectId, envId);

    let html = `
      <div class="materials-system-container">
        <!-- MÉTRICAS DO AMBIENTE -->
        <div class="materials-summary-grid">
          <div class="mat-stat-card">
            <span class="stat-label">Total de Materiais</span>
            <span class="stat-value">${summary.totalItems}</span>
          </div>
          <div class="mat-stat-card stat-approved">
            <span class="stat-label">Aprovados</span>
            <span class="stat-value">${summary.approvedCount}</span>
          </div>
          <div class="mat-stat-card stat-review">
            <span class="stat-label">Em Revisão / Rascunho</span>
            <span class="stat-value">${summary.inReviewCount}</span>
          </div>
          <div class="mat-stat-card stat-conceptual">
            <span class="stat-label">Materiais Conceituais</span>
            <span class="stat-value">${summary.conceptualCount}</span>
          </div>
          <div class="mat-stat-card stat-product">
            <span class="stat-label">Produtos Homologados</span>
            <span class="stat-value">${summary.specificProductCount}</span>
          </div>
          <div class="mat-stat-card stat-cost">
            <span class="stat-label">Custo Estimado</span>
            <span class="stat-value">${formatCurrencyBRL(summary.totalEstimatedCostBRL)}</span>
          </div>
        </div>

        <!-- BARRA DE AÇÕES -->
        <div class="materials-actions-toolbar">
          <div class="toolbar-left">
            <button class="btn btn-primary" onclick="MaterialsSystemModule.openCreateMaterialModal('${projectId}', '${envId}')">
              <i class="icon-plus"></i> + Novo Material
            </button>
            <button class="btn btn-secondary" onclick="MaterialsSystemModule.openAIIdentificationModal('${projectId}', '${envId}')">
              <i class="icon-ai"></i> Identificar por Imagem (IA)
            </button>
            <button class="btn btn-secondary" onclick="MaterialsSystemModule.openCreateProductModal('${projectId}')">
              <i class="icon-box"></i> Novo Produto Catálogo
            </button>
          </div>
          <div class="toolbar-right">
            <button class="btn btn-outline" onclick="MaterialsSystemModule.downloadCSV('${projectId}', '${envId}')" title="Exportar tabela técnica para CSV">
              ⬇ Exportar CSV
            </button>
            <button class="btn btn-outline" onclick="MaterialsSystemModule.showExportNotice('PDF')" title="Ficha de especificação em PDF">
              📄 Exportar PDF
            </button>
            <button class="btn btn-outline" onclick="MaterialsSystemModule.showExportNotice('XLSX')" title="Planilha orçamentária em Excel">
              📊 Exportar XLSX
            </button>
          </div>
        </div>

        <!-- FILTROS RÁPIDOS -->
        <div class="materials-filter-bar">
          <span class="filter-label">Filtros:</span>
          <button class="filter-chip ${!filterOptions.category && !filterOptions.status && filterOptions.isConceptual === undefined ? 'active' : ''}" onclick="MaterialsSystemModule.filterMaterials('${containerId}', '${envId}', {})">Todos</button>
          <button class="filter-chip ${filterOptions.category === 'PEDRA' ? 'active' : ''}" onclick="MaterialsSystemModule.filterMaterials('${containerId}', '${envId}', { category: 'PEDRA' })">Pedras</button>
          <button class="filter-chip ${filterOptions.category === 'MADEIRA' ? 'active' : ''}" onclick="MaterialsSystemModule.filterMaterials('${containerId}', '${envId}', { category: 'MADEIRA' })">Madeiras</button>
          <button class="filter-chip ${filterOptions.category === 'REVESTIMENTO' ? 'active' : ''}" onclick="MaterialsSystemModule.filterMaterials('${containerId}', '${envId}', { category: 'REVESTIMENTO' })">Revestimentos</button>
          <button class="filter-chip ${filterOptions.category === 'PINTURA' ? 'active' : ''}" onclick="MaterialsSystemModule.filterMaterials('${containerId}', '${envId}', { category: 'PINTURA' })">Pintura</button>
          <button class="filter-chip ${filterOptions.status === 'APPROVED' ? 'active' : ''}" onclick="MaterialsSystemModule.filterMaterials('${containerId}', '${envId}', { status: 'APPROVED' })">Aprovados</button>
          <button class="filter-chip ${filterOptions.isConceptual === true ? 'active' : ''}" onclick="MaterialsSystemModule.filterMaterials('${containerId}', '${envId}', { isConceptual: true })">Conceituais</button>
          <button class="filter-chip ${filterOptions.status === 'SUGGESTED' ? 'active' : ''}" onclick="MaterialsSystemModule.filterMaterials('${containerId}', '${envId}', { status: 'SUGGESTED' })">Sugestões IA</button>
        </div>

        <!-- TABELA DE ESPECIFICAÇÃO TÉCNICA (Prompt E02 Itens 0 a 24) -->
        <div class="materials-table-wrapper">
          <table class="materials-spec-table">
            <thead>
              <tr>
                <th>MATERIAL / ACABAMENTO</th>
                <th>CATEGORIA</th>
                <th>APLICAÇÃO</th>
                <th>PRODUTO ESPECÍFICO / FABRICANTE</th>
                <th>DIMENSÕES</th>
                <th>QUANTIDADE</th>
                <th>STATUS</th>
                <th>ESCOPO</th>
                <th style="text-align: right;">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
    `;

    if (materials.length === 0) {
      html += `
        <tr>
          <td colspan="9" class="empty-table-row">
            Nenhum material cadastrado para este ambiente ou filtro selecionado.
          </td>
        </tr>
      `;
    } else {
      materials.forEach(mat => {
        const statusBadges = {
          'APPROVED': '<span class="status-badge badge-approved">APROVADO</span>',
          'IN_REVIEW': '<span class="status-badge badge-review">EM REVISÃO</span>',
          'DRAFT': '<span class="status-badge badge-draft">RASCUNHO</span>',
          'SUGGESTED': '<span class="status-badge badge-suggested">SUGESTÃO IA</span>',
          'REJECTED': '<span class="status-badge badge-rejected" title="Rejeitado">REJEITADO</span>',
          'SUPERSEDED': '<span class="status-badge badge-superseded">SUBSTITUÍDO</span>'
        };

        const scopeBadges = {
          'ENVIRONMENT_SPECIFIC': '<span class="scope-pill">Ambiente</span>',
          'PROJECT_GUIDELINE': '<span class="scope-pill scope-global">Diretriz Geral</span>',
          'REPLICABLE': '<span class="scope-pill scope-rep">Replicável</span>'
        };

        const isAi = mat.isAiSuggestion || mat.origin === 'IA';
        const aiBanner = isAi ? `
          <div class="mat-ai-tag" title="${escapeHTML(mat.notes || 'Identificado por IA')}">
            🤖 <strong>${escapeHTML(mat.aiLabel || 'SUGESTÃO')}</strong>
          </div>
        ` : '';

        const prod = mat.product;
        const productInfo = prod ? `
          <div class="product-info-cell">
            <strong>${escapeHTML(prod.name)}</strong>
            ${prod.manufacturer ? `<div class="text-xs text-muted">Fabricante: ${escapeHTML(prod.manufacturer.name)}</div>` : ''}
            ${prod.skuCode ? `<div class="text-xs text-primary">Cód: ${escapeHTML(prod.skuCode)}</div>` : ''}
            ${prod.supplier ? `<div class="text-xs text-secondary">📍 ${escapeHTML(prod.supplier.name)} (${escapeHTML(prod.supplier.city)}/${escapeHTML(prod.supplier.state)})</div>` : ''}
          </div>
        ` : `
          <div class="conceptual-info-cell">
            <span class="badge-conceptual">MATERIAL CONCEITUAL</span>
            <div class="text-xs text-muted">Aguardando especificação de produto comercial</div>
          </div>
        `;

        const dimensions = prod && (prod.width || prod.length)
          ? `${prod.width || '-'} x ${prod.length || '-'} x ${prod.thickness || '-'} ${escapeHTML(prod.dimensionUnit || 'CM')}`
          : '<span class="text-muted">—</span>';

        const qtyDisplay = (mat.quantityValue !== null && mat.quantityValue !== undefined)
          ? `<strong>${mat.quantityValue}</strong> ${escapeHTML(mat.quantityUnit)}`
          : '<span class="text-muted">A calcular</span>';

        html += `
          <tr class="material-row ${mat.status === 'REJECTED' ? 'row-rejected' : ''} ${isAi ? 'row-ai-suggested' : ''}">
            <td class="col-mat-main">
              <div class="mat-name-wrap">
                <span class="mat-name">${escapeHTML(mat.name)}</span>
                <span class="mat-version">${escapeHTML(mat.versionCode || 'V01')}</span>
              </div>
              <div class="mat-desc-subtle">
                ${mat.finish ? `<span>Acabamento: ${escapeHTML(mat.finish)}</span>` : ''}
                ${mat.color ? `<span>• Cor: ${escapeHTML(mat.color)}</span>` : ''}
              </div>
              ${aiBanner}
              ${mat.rejectionReason ? `<div class="mat-rejection-alert"><strong>Motivo da Rejeição:</strong> ${escapeHTML(mat.rejectionReason)}</div>` : ''}
            </td>
            <td>
              <span class="category-pill">${escapeHTML(mat.category)}</span>
            </td>
            <td>
              <span class="application-pill">${escapeHTML(mat.application)}</span>
            </td>
            <td>
              ${productInfo}
            </td>
            <td>
              <code>${dimensions}</code>
            </td>
            <td>
              ${qtyDisplay}
            </td>
            <td>
              ${statusBadges[mat.status] || mat.status}
            </td>
            <td>
              ${scopeBadges[mat.scope] || mat.scope}
            </td>
            <td class="col-actions">
              <div class="actions-btn-group">
                <button class="btn-action-icon btn-sheet" onclick="MaterialsSystemModule.openMaterialSheetModal('${mat.id}')" title="Ver Ficha Técnica Completa">
                  📋
                </button>
                ${mat.status !== 'APPROVED' ? `
                  <button class="btn-action-icon btn-approve" onclick="MaterialsSystemModule.approveMaterial('${mat.id}', '${containerId}', '${envId}')" title="Aprovar e homologar para o ambiente">
                    ✔
                  </button>
                ` : ''}
                ${mat.status !== 'REJECTED' ? `
                  <button class="btn-action-icon btn-reject" onclick="MaterialsSystemModule.promptRejectMaterial('${mat.id}', '${containerId}', '${envId}')" title="Rejeitar com motivo obrigatório">
                    ✖
                  </button>
                ` : ''}
                <button class="btn-action-icon btn-version" onclick="MaterialsSystemModule.promptNewVersion('${mat.id}', '${containerId}', '${envId}')" title="Criar nova versão (V02/V03)">
                  ⤾
                </button>
                ${mat.isConceptual ? `
                  <button class="btn-action-icon btn-link-prod" onclick="MaterialsSystemModule.openLinkProductModal('${mat.id}', '${containerId}', '${envId}')" title="Vincular Produto Comercial">
                    🔗
                  </button>
                ` : ''}
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

  function filterMaterials(containerId, environmentId, options) {
    renderEnvironmentMaterials(containerId, environmentId, options);
  }

  /**
   * Abre a Ficha Técnica de Especificação do Material (Prompt E02 Item 23)
   */
  function openMaterialSheetModal(materialId) {
    const state = (typeof StudioState !== 'undefined') ? StudioState : null;
    if (!state) return;

    const mat = state.getMaterial(materialId);
    if (!mat) return;

    let modal = document.getElementById('material-sheet-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'material-sheet-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    const prod = mat.product;
    const mfr = prod && prod.manufacturer ? prod.manufacturer : null;
    const sup = prod && prod.supplier ? prod.supplier : null;

    modal.innerHTML = `
      <div class="modal-card modal-lg">
        <div class="modal-header">
          <div>
            <h3>Ficha de Especificação: ${escapeHTML(mat.name)}</h3>
            <span class="text-xs text-muted">Versão: ${escapeHTML(mat.versionCode)} • Status: ${escapeHTML(mat.status)}</span>
          </div>
          <button class="modal-close-btn" onclick="document.getElementById('material-sheet-modal').classList.remove('active')">&times;</button>
        </div>
        <div class="modal-body">
          <div class="spec-sheet-grid">
            <!-- BLOCO VISUAL / TEXTURAS -->
            <div class="spec-sheet-visual">
              <div class="sheet-main-thumb">
                <img src="${escapeHTML(mat.imageUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80')}" alt="${escapeHTML(mat.name)}" />
              </div>
              <div class="sheet-thumb-caption">Amostra / Textura de Especificação</div>
              ${mat.referenceText ? `<div class="sheet-ref-note"><strong>Referência:</strong> ${escapeHTML(mat.referenceText)}</div>` : ''}
            </div>

            <!-- BLOCO TÉCNICO DESCRITIVO -->
            <div class="spec-sheet-details">
              <table class="sheet-info-table">
                <tr><td><strong>Categoria:</strong></td><td>${escapeHTML(mat.category)}</td></tr>
                <tr><td><strong>Aplicação:</strong></td><td>${escapeHTML(mat.application)}</td></tr>
                <tr><td><strong>Cor / Tonalidade:</strong></td><td>${escapeHTML(mat.color || '—')}</td></tr>
                <tr><td><strong>Acabamento:</strong></td><td>${escapeHTML(mat.finish || '—')}</td></tr>
                <tr><td><strong>Textura Superficial:</strong></td><td>${escapeHTML(mat.texture || '—')}</td></tr>
                <tr><td><strong>Quantidade:</strong></td><td>${mat.quantityValue !== null ? `${mat.quantityValue} ${mat.quantityUnit}` : 'A definir'}</td></tr>
                <tr><td><strong>Escopo no Projeto:</strong></td><td>${escapeHTML(mat.scope)}</td></tr>
                <tr><td><strong>Origem do Dado:</strong></td><td>${escapeHTML(mat.origin)}</td></tr>
              </table>

              <hr style="border: 0; border-top: 1px solid var(--border-subtle); margin: 16px 0;" />

              <h4>Produto Comercial Associado</h4>
              ${prod ? `
                <table class="sheet-info-table">
                  <tr><td><strong>Produto:</strong></td><td>${escapeHTML(prod.name)}</td></tr>
                  <tr><td><strong>Fabricante:</strong></td><td>${mfr ? `<a href="${escapeHTML(mfr.website || '#')}" target="_blank">${escapeHTML(mfr.name)}</a>` : '—'}</td></tr>
                  <tr><td><strong>Coleção:</strong></td><td>${escapeHTML(prod.collection || '—')}</td></tr>
                  <tr><td><strong>Código / SKU:</strong></td><td><code>${escapeHTML(prod.skuCode || '—')}</code></td></tr>
                  <tr><td><strong>Dimensões:</strong></td><td>${prod.width || '-'}x${prod.length || '-'}x${prod.thickness || '-'} ${escapeHTML(prod.dimensionUnit || 'CM')}</td></tr>
                  <tr><td><strong>Fornecedor Regional:</strong></td><td>${sup ? `${escapeHTML(sup.name)} (${escapeHTML(sup.city)} - ${escapeHTML(sup.state)})` : '—'}</td></tr>
                  <tr><td><strong>Preço Unitário:</strong></td><td>${formatCurrencyBRL(prod.price)} / ${escapeHTML(prod.salesUnit || 'M2')}</td></tr>
                  <tr><td><strong>Consultado Em:</strong></td><td>${prod.consultedAt ? escapeHTML(prod.consultedAt.substring(0, 10)) : '—'}</td></tr>
                  ${prod.productUrl ? `<tr><td><strong>Link do Produto:</strong></td><td><a href="${escapeHTML(prod.productUrl)}" target="_blank">Acessar Catálogo Oficial ↗</a></td></tr>` : ''}
                </table>
              ` : `
                <div class="alert alert-info">
                  Material cadastrado como <strong>CONCEITUAL</strong>. Nenhum produto comercial ou SKU foi associado ainda.
                </div>
              `}
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('material-sheet-modal').classList.remove('active')">Fechar</button>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  /**
   * Aprovação de material
   */
  function approveMaterial(materialId, containerId, environmentId) {
    const state = (typeof StudioState !== 'undefined') ? StudioState : null;
    if (!state) return;
    try {
      state.approveMaterial(materialId, 'Eduardo Marques (Arquiteto Titular)');
      renderEnvironmentMaterials(containerId, environmentId);
    } catch (e) {
      alert('Erro ao aprovar material: ' + e.message);
    }
  }

  /**
   * Rejeição de material com justificativa obrigatória (Prompt E02 Item 11)
   */
  function promptRejectMaterial(materialId, containerId, environmentId) {
    const state = (typeof StudioState !== 'undefined') ? StudioState : null;
    if (!state) return;

    const mat = state.getMaterial(materialId);
    if (!mat) return;

    const reason = window.prompt(`Informe o motivo da rejeição do material "${mat.name}":`, 'Tom muito escuro para o conceito leve do ambiente');
    if (reason === null) return;

    if (!reason.trim()) {
      alert('É obrigatório registrar o motivo da rejeição.');
      return;
    }

    try {
      state.rejectMaterial(materialId, reason.trim(), 'Eduardo Marques');
      renderEnvironmentMaterials(containerId, environmentId);
    } catch (e) {
      alert('Erro ao rejeitar material: ' + e.message);
    }
  }

  /**
   * Versionamento de material (V01 -> V02)
   */
  function promptNewVersion(materialId, containerId, environmentId) {
    const state = (typeof StudioState !== 'undefined') ? StudioState : null;
    if (!state) return;

    const mat = state.getMaterial(materialId);
    if (!mat) return;

    const notes = window.prompt(`Criar nova versão a partir de "${mat.name} (${mat.versionCode})". Descreva a alteração:`, 'Alteração de acabamento polido para levigado fosco');
    if (notes === null) return;

    try {
      state.versionMaterial(materialId, {
        notes: mat.notes ? `${mat.notes}\n[Versão]: ${notes}` : `[Versão]: ${notes}`,
        status: 'IN_REVIEW'
      }, 'Eduardo Marques');
      renderEnvironmentMaterials(containerId, environmentId);
    } catch (e) {
      alert('Erro ao versionar material: ' + e.message);
    }
  }

  /**
   * Modal de vínculo entre material conceitual e produto comercial
   */
  function openLinkProductModal(materialId, containerId, environmentId) {
    const state = (typeof StudioState !== 'undefined') ? StudioState : null;
    if (!state) return;

    const mat = state.getMaterial(materialId);
    if (!mat) return;

    const products = state.data.catalogProducts || [];
    if (products.length === 0) {
      alert('Nenhum produto cadastrado no catálogo. Cadastre um produto comercial primeiro.');
      return;
    }

    const options = products.map(p => {
      const mfrName = p.manufacturer ? p.manufacturer.name : 'Fabricante Geral';
      return `<option value="${p.id}">${escapeHTML(p.name)} (${escapeHTML(mfrName)} - SKU: ${escapeHTML(p.skuCode || 'N/A')})</option>`;
    }).join('');

    const chosenId = window.prompt(`Selecione o ID do Produto Comercial para vincular a "${mat.name}":\n\nOpções disponíveis:\n` + 
      products.map(p => `${p.id}: ${p.name}`).join('\n'), products[0].id);

    if (!chosenId) return;

    try {
      state.linkMaterialToProduct(materialId, chosenId.trim(), 'Eduardo Marques');
      alert(`Produto vinculado com sucesso a "${mat.name}"!`);
      renderEnvironmentMaterials(containerId, environmentId);
    } catch (e) {
      alert('Erro ao vincular produto: ' + e.message);
    }
  }

  /**
   * Modal de identificação assistida por IA (Prompt E02 Itens 16 e 17)
   */
  function openAIIdentificationModal(projectId, environmentId) {
    const state = (typeof StudioState !== 'undefined') ? StudioState : null;
    if (!state) return;

    let modal = document.getElementById('material-ai-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'material-ai-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-card modal-lg">
        <div class="modal-header">
          <h3>🤖 Identificação de Materiais por Visão Computacional (IA)</h3>
          <button class="modal-close-btn" onclick="document.getElementById('material-ai-modal').classList.remove('active')">&times;</button>
        </div>
        <div class="modal-body">
          <div class="alert alert-info">
            <strong>Princípio Anti-Alucinação (E02 Itens 3 e 17):</strong>
            A IA sugere características conceituais aparentes (ex: <em>"pedra natural clara serrada"</em>). 
            <strong>Nunca afirma marcas ou produtos de loja específicos sem comprovação documental.</strong>
            Todas as sugestões recebem status <code>SUGGESTED</code> e aguardam homologação humana.
          </div>

          <div class="form-group">
            <label>Selecione a Imagem / Render do Ambiente:</label>
            <select id="ai-material-source-image" class="form-control">
              <option value="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80">Render Living Integrado com Deck (V01 - Homologado)</option>
              <option value="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80">Perspectiva Geral da Cozinha e Área Gourmet</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('material-ai-modal').classList.remove('active')">Cancelar</button>
          <button class="btn btn-primary" onclick="MaterialsSystemModule.runAIDetection('${projectId}', '${environmentId}')">
            Executar Detecção de Materiais
          </button>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  function runAIDetection(projectId, environmentId) {
    const state = (typeof StudioState !== 'undefined') ? StudioState : null;
    if (!state) return;

    const select = document.getElementById('ai-material-source-image');
    const imageUrl = select ? select.value : 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80';

    try {
      const suggestions = state.identifyMaterialsFromImage(imageUrl, environmentId, { projectId });
      const modal = document.getElementById('material-ai-modal');
      if (modal) modal.classList.remove('active');

      alert(`Análise concluída com sucesso!\n${suggestions.length} materiais conceituais sugeridos foram cadastrados com status "SUGGESTED" (com rotulação "SUGESTÃO").`);
      
      const containerId = 'materials-tab-content';
      renderEnvironmentMaterials(containerId, environmentId);
    } catch (e) {
      alert('Erro na análise visual: ' + e.message);
    }
  }

  /**
   * Modal de criação de material
   */
  function openCreateMaterialModal(projectId, environmentId) {
    const state = (typeof StudioState !== 'undefined') ? StudioState : null;
    if (!state) return;

    let modal = document.getElementById('material-create-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'material-create-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    const categoriesOptions = state.MATERIAL_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
    const appOptions = state.MATERIAL_APPLICATIONS.map(a => `<option value="${a}">${a}</option>`).join('');
    const unitOptions = state.MATERIAL_UNITS.map(u => `<option value="${u}">${u}</option>`).join('');
    const originOptions = state.MATERIAL_ORIGINS.map(o => `<option value="${o}">${o}</option>`).join('');

    modal.innerHTML = `
      <div class="modal-card modal-lg">
        <div class="modal-header">
          <h3>Novo Material / Acabamento</h3>
          <button class="modal-close-btn" onclick="document.getElementById('material-create-modal').classList.remove('active')">&times;</button>
        </div>
        <div class="modal-body">
          <form id="create-material-form" onsubmit="event.preventDefault(); MaterialsSystemModule.submitCreateMaterial('${projectId}', '${environmentId}');">
            <div class="form-row">
              <div class="form-group form-col-8">
                <label>Nome do Material (Conceito ou Comercial) *</label>
                <input type="text" id="mat-input-name" class="form-control" placeholder="Ex: Mármore Travertino Navona Levigado" required />
              </div>
              <div class="form-group form-col-4">
                <label>Categoria *</label>
                <select id="mat-input-category" class="form-control">
                  ${categoriesOptions}
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group form-col-4">
                <label>Aplicação *</label>
                <select id="mat-input-app" class="form-control">
                  ${appOptions}
                </select>
              </div>
              <div class="form-group form-col-4">
                <label>Origem do Dado *</label>
                <select id="mat-input-origin" class="form-control">
                  ${originOptions}
                </select>
              </div>
              <div class="form-group form-col-4">
                <label>Escopo no Projeto</label>
                <select id="mat-input-scope" class="form-control">
                  <option value="ENVIRONMENT_SPECIFIC">Específico do Ambiente</option>
                  <option value="PROJECT_GUIDELINE">Diretriz Mestra do Projeto</option>
                  <option value="REPLICABLE">Replicável</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group form-col-4">
                <label>Cor / Tonalidade</label>
                <input type="text" id="mat-input-color" class="form-control" placeholder="Ex: Bege areia / Marfim" />
              </div>
              <div class="form-group form-col-4">
                <label>Acabamento</label>
                <input type="text" id="mat-input-finish" class="form-control" placeholder="Ex: Levigado fosco / Acetinado" />
              </div>
              <div class="form-group form-col-4">
                <label>Textura</label>
                <input type="text" id="mat-input-texture" class="form-control" placeholder="Ex: Suave / Microporosa" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group form-col-6">
                <label>Quantidade Estimada</label>
                <input type="number" id="mat-input-qty" class="form-control" placeholder="Ex: 85" step="0.1" />
              </div>
              <div class="form-group form-col-6">
                <label>Unidade *</label>
                <select id="mat-input-unit" class="form-control">
                  ${unitOptions}
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Referência Visual / Observação Técnica</label>
              <textarea id="mat-input-ref" class="form-control" rows="2" placeholder="Ex: Referência alinhada no briefing para piso da área social"></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('material-create-modal').classList.remove('active')">Cancelar</button>
          <button class="btn btn-primary" onclick="document.getElementById('create-material-form').requestSubmit()">Salvar Material</button>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  function submitCreateMaterial(projectId, environmentId) {
    const state = (typeof StudioState !== 'undefined') ? StudioState : null;
    if (!state) return;

    const name = document.getElementById('mat-input-name').value;
    const category = document.getElementById('mat-input-category').value;
    const application = document.getElementById('mat-input-app').value;
    const origin = document.getElementById('mat-input-origin').value;
    const scope = document.getElementById('mat-input-scope').value;
    const color = document.getElementById('mat-input-color').value;
    const finish = document.getElementById('mat-input-finish').value;
    const texture = document.getElementById('mat-input-texture').value;
    const qty = document.getElementById('mat-input-qty').value;
    const unit = document.getElementById('mat-input-unit').value;
    const ref = document.getElementById('mat-input-ref').value;

    try {
      state.createMaterial({
        projectId,
        environmentId,
        name,
        category,
        application,
        origin,
        scope,
        color,
        finish,
        texture,
        quantityValue: qty ? Number(qty) : null,
        quantityUnit: unit,
        referenceText: ref
      }, 'Eduardo Marques');

      const modal = document.getElementById('material-create-modal');
      if (modal) modal.classList.remove('active');

      const containerId = 'materials-tab-content';
      renderEnvironmentMaterials(containerId, environmentId);
    } catch (e) {
      alert('Erro ao criar material: ' + e.message);
    }
  }

  /**
   * Modal de cadastro de produto no catálogo comercial
   */
  function openCreateProductModal(projectId) {
    const name = window.prompt('Nome do Produto Comercial (Ex: Porcelanato Nord Cement 120x120 Nat):');
    if (!name || !name.trim()) return;

    const sku = window.prompt('Código / SKU do Fabricante (Ex: 201445E):', '');
    const priceStr = window.prompt('Preço Unitário Estimado (R$):', '189.90');

    const state = (typeof StudioState !== 'undefined') ? StudioState : null;
    if (!state) return;

    try {
      const prod = state.createCatalogProduct({
        name: name.trim(),
        skuCode: sku ? sku.trim() : null,
        price: priceStr ? Number(priceStr.replace(',', '.')) : null,
        salesUnit: 'M2',
        consultedAt: new Date().toISOString()
      });
      alert(`Produto "${prod.name}" cadastrado com sucesso no catálogo!`);
    } catch (e) {
      alert('Erro ao cadastrar produto: ' + e.message);
    }
  }

  /**
   * Exporta a tabela técnica de materiais em CSV
   */
  function downloadCSV(projectId, environmentId) {
    const state = (typeof StudioState !== 'undefined') ? StudioState : null;
    if (!state) return;

    try {
      const csvContent = state.exportMaterialsToCSV(projectId, environmentId);
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `arqvertice_materiais_${projectId}_${environmentId || 'geral'}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Erro ao exportar CSV: ' + e.message);
    }
  }

  function showExportNotice(format) {
    alert(`A estrutura de dados para exportação ${format} está configurada e pronta para emissão.`);
  }

  return {
    renderEnvironmentMaterials,
    filterMaterials,
    openMaterialSheetModal,
    approveMaterial,
    promptRejectMaterial,
    promptNewVersion,
    openLinkProductModal,
    openAIIdentificationModal,
    runAIDetection,
    openCreateMaterialModal,
    submitCreateMaterial,
    openCreateProductModal,
    downloadCSV,
    showExportNotice
  };
})();

if (typeof window !== 'undefined') {
  window.MaterialsSystemModule = MaterialsSystemModule;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MaterialsSystemModule;
}
