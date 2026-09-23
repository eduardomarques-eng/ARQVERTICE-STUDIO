/**
 * ============================================================================
 * ARQVERTICE STUDIO — BLOCO E03: QUANTITATIVOS E MEMÓRIA DE CÁLCULO
 * Módulo de Interface e Interação de Quantitativos Técnicos
 * ============================================================================
 */

const QuantitySystemModule = {
  currentFilterStatus: 'ALL',
  currentFilterCategory: 'ALL',
  currentFilterOrigin: 'ALL',

  /**
   * Renderiza a visualização técnica de quantitativos dentro do Workspace do Ambiente
   */
  renderEnvironmentQuantities(env, project) {
    if (!env || !project) {
      return '<div class="empty-state-card"><p>Ambiente ou projeto inválido.</p></div>';
    }

    const items = StudioState.getEnvironmentQuantities(project.id, env.id);
    const summary = StudioState.getQuantitySummary(project.id, env.id);

    return `
      <div class="quantities-module-wrap animate-fade-in">
        <!-- CABEÇALHO DO MÓDULO E PRINCÍPIOS DE CONFIABILIDADE (Itens 0 e 1) -->
        <div class="quantities-header-card">
          <div class="qhc-main">
            <div class="qhc-badge-row">
              <span class="qhc-badge"><i data-lucide="calculator"></i> BLOCO E03 — QUANTITATIVOS TÉCNICOS</span>
              <span class="qhc-scope-badge"><i data-lucide="map-pin"></i> ${escapeHTML(env.name)}</span>
              <span class="qhc-rule-badge" title="Rastreabilidade mandatória de todas as quantidades">
                <i data-lucide="shield-check"></i> Princípio da Confiabilidade Ativo
              </span>
            </div>
            <h2 class="qhc-title">Quantitativos & Memória de Cálculo</h2>
            <p class="qhc-desc">
              Especificação quantitativa de materiais, revestimentos e acabamentos por ambiente. Toda quantidade indica sua origem rigorosa (<strong>Medida</strong>, <strong>Calculada</strong>, <strong>Revit</strong> ou <strong>Estimativa IA</strong>), transparência de perda técnica e conversão para embalagens comerciais.
            </p>
          </div>

          <div class="qhc-actions">
            <button class="btn btn-primary btn-sm" onclick="QuantitySystemModule.openCreateModal('${project.id}', '${env.id}')">
              <i data-lucide="plus"></i> Novo Quantitativo
            </button>
            <button class="btn btn-outline btn-sm" onclick="QuantitySystemModule.openAiEstimateModal('${project.id}', '${env.id}')" title="Estimativa conceitual assistida por IA visual">
              <i data-lucide="sparkles"></i> Estimativa IA
            </button>
            <button class="btn btn-outline btn-sm" onclick="QuantitySystemModule.openRevitImportModal('${project.id}', '${env.id}')" title="Importação de tabelas e arquivos do Revit">
              <i data-lucide="upload-cloud"></i> Importar Revit
            </button>
            <button class="btn btn-secondary btn-sm" onclick="QuantitySystemModule.downloadCSV('${project.id}', '${env.id}')" title="Exportar CSV técnico estruturado">
              <i data-lucide="download"></i> Exportar CSV
            </button>
            <button class="btn btn-glass btn-sm" onclick="QuantitySystemModule.openProjectConsolidatedModal('${project.id}')" title="Ver consolidação de todos os cômodos do projeto">
              <i data-lucide="layers"></i> Total do Projeto
            </button>
          </div>
        </div>

        <!-- CARDS DE RESUMO ESTATÍSTICO E GOVERNANÇA -->
        <div class="quantities-summary-grid">
          <div class="qsum-card">
            <span class="qsum-label"><i data-lucide="boxes"></i> Total de Itens</span>
            <strong class="qsum-val">${summary.totalItems}</strong>
            <span class="qsum-sub">Especificações no cômodo</span>
          </div>
          <div class="qsum-card is-approved">
            <span class="qsum-label"><i data-lucide="check-circle-2"></i> Homologados</span>
            <strong class="qsum-val">${summary.approvedCount}</strong>
            <span class="qsum-sub">QUANTITY_APPROVED</span>
          </div>
          <div class="qsum-card is-estimated">
            <span class="qsum-label"><i data-lucide="sparkles"></i> Estimativas IA</span>
            <strong class="qsum-val">${summary.aiEstimateCount}</strong>
            <span class="qsum-sub">QUANTITY_ESTIMATED</span>
          </div>
          <div class="qsum-card">
            <span class="qsum-label"><i data-lucide="ruler"></i> Medidos / Cadastrados</span>
            <strong class="qsum-val">${summary.measuredCount}</strong>
            <span class="qsum-sub">Origem confirmada</span>
          </div>
          <div class="qsum-card">
            <span class="qsum-label"><i data-lucide="file-code"></i> Dados Revit</span>
            <strong class="qsum-val">${summary.revitOriginCount}</strong>
            <span class="qsum-sub">Origem REVIT</span>
          </div>
        </div>

        <!-- BARRA DE FILTROS RÁPIDOS -->
        <div class="quantities-filter-bar">
          <div class="qfb-group">
            <span class="qfb-label"><i data-lucide="filter"></i> Status:</span>
            <select id="filter-qty-status" class="form-select form-select-sm" onchange="QuantitySystemModule.handleFilterChange('${project.id}', '${env.id}')">
              <option value="ALL">Todos os Status</option>
              <option value="APPROVED">Homologados (APPROVED)</option>
              <option value="ESTIMATED">Estimativas (ESTIMATED)</option>
              <option value="IN_REVIEW">Em Revisão (IN_REVIEW)</option>
              <option value="DRAFT">Rascunhos (DRAFT)</option>
              <option value="REJECTED">Rejeitados (REJECTED)</option>
            </select>
          </div>

          <div class="qfb-group">
            <span class="qfb-label">Origem:</span>
            <select id="filter-qty-origin" class="form-select form-select-sm" onchange="QuantitySystemModule.handleFilterChange('${project.id}', '${env.id}')">
              <option value="ALL">Todas as Origens</option>
              <option value="MEASURED">Medição de Projeto (MEASURED)</option>
              <option value="CALCULATED">Cálculo Deduzido (CALCULATED)</option>
              <option value="IMPORTED">Importado (IMPORTED / REVIT)</option>
              <option value="ESTIMATED_BY_AI">Estimativa Visual IA (ESTIMATED_BY_AI)</option>
              <option value="MANUAL">Entrada Manual (MANUAL)</option>
            </select>
          </div>

          <div class="qfb-group">
            <span class="qfb-label">Categoria:</span>
            <select id="filter-qty-category" class="form-select form-select-sm" onchange="QuantitySystemModule.handleFilterChange('${project.id}', '${env.id}')">
              <option value="ALL">Todas as Categorias</option>
              ${StudioState.MATERIAL_CATEGORIES.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- TABELA TÉCNICA DE ESPECIFICAÇÃO (Prompt E03 Item 26) -->
        <div class="quantities-table-card">
          <div class="qtc-head">
            <h3><i data-lucide="table"></i> Tabela Técnica de Quantitativos e Fórmulas</h3>
            <span class="text-xs text-muted">Exibindo ${items.length} itens</span>
          </div>

          <div class="table-responsive">
            <table class="table quantities-table">
              <thead>
                <tr>
                  <th>Item / Material</th>
                  <th>Produto Comercial</th>
                  <th>Categoria / Aplicação</th>
                  <th>Qtd. Base</th>
                  <th>Perda</th>
                  <th>Qtd. Final</th>
                  <th>Embalagem / Compra</th>
                  <th>Origem & Confiabilidade</th>
                  <th>Status</th>
                  <th style="text-align: right;">Ações</th>
                </tr>
              </thead>
              <tbody>
                ${items.length === 0 ? `
                  <tr>
                    <td colspan="10" class="text-center py-5 text-muted">
                      Nenhum quantitativo cadastrado para este ambiente. Clique em <strong>Novo Quantitativo</strong> para adicionar.
                    </td>
                  </tr>
                ` : items.map(q => this._renderQuantityTableRow(q, project.id, env.id)).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Renderiza uma linha da tabela técnica
   */
  _renderQuantityTableRow(q, projectId, environmentId) {
    const isApproved = q.status === 'APPROVED';
    const isRejected = q.status === 'REJECTED';
    const isAi = q.originType === 'ESTIMATED_BY_AI' || q.isAiEstimate;
    const isRevit = q.sourceType === 'REVIT_IMPORT';

    let originBadgeClass = 'origin-default';
    if (q.originType === 'MEASURED') originBadgeClass = 'origin-measured';
    else if (isAi) originBadgeClass = 'origin-ai';
    else if (isRevit) originBadgeClass = 'origin-revit';

    const prodName = q.product 
      ? q.product.name 
      : (q.material && q.material.product ? q.material.product.name : '<span class="text-muted font-italic">Conceitual</span>');

    return `
      <tr class="qty-row status-${q.status.toLowerCase()} ${isAi ? 'is-ai-row' : ''}">
        <!-- Item / Nome -->
        <td>
          <div class="qty-item-name">
            <strong>${escapeHTML(q.itemName)}</strong>
            ${q.material ? `<span class="qty-mat-link"><i data-lucide="link"></i> ${escapeHTML(q.material.name)}</span>` : ''}
          </div>
          ${q.notes ? `<div class="qty-notes-preview" title="${escapeHTML(q.notes)}"><i data-lucide="message-square"></i> ${escapeHTML(q.notes)}</div>` : ''}
        </td>

        <!-- Produto Comercial -->
        <td>
          <div class="qty-product-name">${prodName}</div>
          ${q.product && q.product.skuCode ? `<span class="qty-sku-tag">SKU: ${escapeHTML(q.product.skuCode)}</span>` : ''}
        </td>

        <!-- Categoria / Aplicação -->
        <td>
          <span class="qty-cat-pill">${escapeHTML(q.category)}</span>
          <span class="qty-app-pill">${escapeHTML(q.application)}</span>
        </td>

        <!-- Quantidade Base -->
        <td class="text-nowrap">
          <strong>${q.baseQuantity.toLocaleString('pt-BR', { minimumFractionDigits: q.decimalPlaces || 2 })}</strong> ${escapeHTML(q.unit)}
        </td>

        <!-- Perda -->
        <td>
          <span class="qty-loss-pill" title="Margem técnica de corte e assentamento">+${q.lossPercentage}%</span>
        </td>

        <!-- Quantidade Final -->
        <td class="text-nowrap">
          <strong class="qty-final-val">${q.finalQuantity.toLocaleString('pt-BR', { minimumFractionDigits: q.decimalPlaces || 2 })}</strong> ${escapeHTML(q.unit)}
        </td>

        <!-- Embalagem / Compra -->
        <td>
          ${q.hasPackaging && q.packagingCoverage ? `
            <div class="qty-packaging-info" title="${escapeHTML(q.packagingFormula || '')}">
              <strong>${q.purchasingQuantity} ${escapeHTML(q.packagingUnit || 'caixas')}</strong>
              <span class="text-xs text-muted">(${escapeHTML(q.packagingCoverage)} ${escapeHTML(q.unit)}/cx)</span>
            </div>
          ` : `<span class="text-muted">-</span>`}
        </td>

        <!-- Origem & Confiabilidade (Itens 1 e 2) -->
        <td>
          <span class="qty-origin-pill ${originBadgeClass}" title="Fonte: ${escapeHTML(q.sourceType)}">
            ${isAi ? '<i data-lucide="sparkles"></i>' : (isRevit ? '<i data-lucide="layers"></i>' : '<i data-lucide="check"></i>')}
            ${escapeHTML(q.originType)}
          </span>
          ${q.sourceFileRef ? `<div class="qty-source-file text-xs" title="${escapeHTML(q.sourceFileRef)}"><i data-lucide="file"></i> ${escapeHTML(q.sourceFileRef.substring(0, 18))}...</div>` : ''}
          ${isAi ? `<div class="qty-ai-warning text-xs"><i data-lucide="alert-triangle"></i> Estimativa preliminar</div>` : ''}
        </td>

        <!-- Status e Nível de Aprovação -->
        <td>
          <span class="qty-status-pill status-${q.status.toLowerCase()}">${escapeHTML(q.status)}</span>
          <span class="qty-approval-level ${q.approvalLevel === 'QUANTITY_APPROVED' ? 'is-level-approved' : 'is-level-estimated'}">
            ${escapeHTML(q.approvalLevel)}
          </span>
        </td>

        <!-- Ações de Governança Humana (Item 18) -->
        <td style="text-align: right;" class="text-nowrap">
          <div class="btn-group btn-group-sm">
            <button class="btn btn-glass btn-xs" onclick="QuantitySystemModule.openMemoryModal('${q.id}')" title="Ver Memória de Cálculo Detalhada">
              <i data-lucide="info"></i>
            </button>
            <button class="btn btn-outline btn-xs" onclick="QuantitySystemModule.openEditModal('${q.id}')" title="Editar / Recalcular">
              <i data-lucide="edit-2"></i>
            </button>
            ${!isApproved ? `
              <button class="btn btn-success btn-xs" onclick="QuantitySystemModule.promptApprove('${q.id}')" title="Homologar Quantidade (QUANTITY_APPROVED)">
                <i data-lucide="check"></i>
              </button>
            ` : ''}
            ${!isRejected ? `
              <button class="btn btn-danger btn-xs" onclick="QuantitySystemModule.promptReject('${q.id}')" title="Rejeitar com Justificativa">
                <i data-lucide="x"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  },

  /**
   * Modal com a Memória de Cálculo Completa (Prompt E03 Item 17)
   */
  openMemoryModal(quantityId) {
    const q = StudioState.getQuantity(quantityId);
    if (!q) return;

    const modalId = 'modal-qty-memory';
    let modalEl = document.getElementById(modalId);
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = modalId;
      modalEl.className = 'studio-modal-backdrop';
      document.body.appendChild(modalEl);
    }

    modalEl.innerHTML = `
      <div class="studio-modal-dialog animate-scale-up" style="max-width: 650px;">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <i data-lucide="calculator" class="text-primary"></i>
            <h3>Memória de Cálculo: ${escapeHTML(q.itemName)}</h3>
          </div>
          <button class="btn-close" onclick="document.getElementById('${modalId}').remove()">&times;</button>
        </div>

        <div class="modal-body">
          <!-- CARD DE FÓRMULA MATEMÁTICA (Prompt E03 Itens 5 e 17) -->
          <div class="calculation-memory-box">
            <div class="cmb-header">
              <span class="cmb-title"><i data-lucide="cpu"></i> MEMÓRIA DE CÁLCULO EXECUTIVA</span>
              <span class="cmb-status ${q.approvalLevel === 'QUANTITY_APPROVED' ? 'is-approved' : 'is-estimated'}">${escapeHTML(q.approvalLevel)}</span>
            </div>

            <div class="cmb-equation">
              ${escapeHTML(q.formulaText)}
            </div>

            <div class="cmb-steps-grid">
              <div class="step-col">
                <span class="sc-label">1. ENTRADA (BASE)</span>
                <strong class="sc-val">${q.baseQuantity.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ${escapeHTML(q.unit)}</strong>
                <span class="sc-sub">Origem: ${escapeHTML(q.originType)} (${escapeHTML(q.sourceType)})</span>
              </div>
              <div class="step-col">
                <span class="sc-label">2. PERDA TÉCNICA</span>
                <strong class="sc-val">+${q.lossPercentage}%</strong>
                <span class="sc-sub">Fator de Perda: ${(1 + q.lossPercentage / 100).toFixed(2).replace('.', ',')}</span>
              </div>
              <div class="step-col">
                <span class="sc-label">3. QUANTIDADE FINAL</span>
                <strong class="sc-val text-primary">${q.finalQuantity.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ${escapeHTML(q.unit)}</strong>
                <span class="sc-sub">Quantidade Técnica Exata</span>
              </div>
            </div>

            ${q.hasPackaging ? `
              <div class="cmb-packaging-box">
                <div class="cpb-title"><i data-lucide="box"></i> CONVERSÃO DE EMBALAGEM / COMPRA (Itens 8 e 9)</div>
                <div class="cpb-formula">${escapeHTML(q.packagingFormula || '')}</div>
                <div class="cpb-meta">
                  <span>Área por ${escapeHTML(q.packagingUnit || 'caixa')}: <strong>${q.packagingCoverage} ${escapeHTML(q.unit)}</strong></span>
                  <span>Regra de Arredondamento: <strong>${escapeHTML(q.roundingRule || 'CEIL (Teto)')}</strong></span>
                </div>
              </div>
            ` : ''}
          </div>

          <!-- DETALHES DE CONFIABILIDADE E METADADOS -->
          <div class="memory-meta-grid">
            <div class="mm-item">
              <span class="mm-label">Ambiente</span>
              <strong class="mm-val">${q.environment ? escapeHTML(q.environment.name) : 'Geral'}</strong>
            </div>
            <div class="mm-item">
              <span class="mm-label">Categoria</span>
              <strong class="mm-val">${escapeHTML(q.category)}</strong>
            </div>
            <div class="mm-item">
              <span class="mm-label">Aplicação</span>
              <strong class="mm-val">${escapeHTML(q.application)}</strong>
            </div>
            <div class="mm-item">
              <span class="mm-label">Arquivo de Origem</span>
              <strong class="mm-val">${q.sourceFileRef ? escapeHTML(q.sourceFileRef) : 'Cadastro Manual'}</strong>
            </div>
          </div>

          ${q.notes ? `
            <div class="memory-notes-card">
              <span class="mn-label"><i data-lucide="message-square"></i> Observações Técnicas:</span>
              <p class="mn-text">${escapeHTML(q.notes)}</p>
            </div>
          ` : ''}

          ${q.isAiEstimate ? `
            <div class="ai-estimate-disclaimer-box">
              <i data-lucide="alert-triangle"></i>
              <div>
                <strong>Aviso de Inteligência Artificial (Prompt E03 Itens 13 e 14):</strong>
                <p>${escapeHTML(q.aiDisclaimer || 'Estimativa calculada por visão computacional. Requer validação humana antes da emissão executiva.')}</p>
              </div>
            </div>
          ` : ''}
        </div>

        <div class="modal-footer">
          <button class="btn btn-outline" onclick="document.getElementById('${modalId}').remove()">Fechar</button>
          ${q.status !== 'APPROVED' ? `
            <button class="btn btn-primary" onclick="QuantitySystemModule.promptApprove('${q.id}'); document.getElementById('${modalId}').remove();">
              <i data-lucide="check"></i> Homologar Quantidade
            </button>
          ` : ''}
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  /**
   * Modal de Criação Manual de Quantitativo
   */
  openCreateModal(projectId, environmentId) {
    const materials = StudioState.getEnvironmentMaterials(projectId, environmentId);

    const modalId = 'modal-qty-create';
    let modalEl = document.getElementById(modalId);
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = modalId;
      modalEl.className = 'studio-modal-backdrop';
      document.body.appendChild(modalEl);
    }

    modalEl.innerHTML = `
      <div class="studio-modal-dialog animate-scale-up" style="max-width: 600px;">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <i data-lucide="plus-circle" class="text-primary"></i>
            <h3>Novo Quantitativo de Material</h3>
          </div>
          <button class="btn-close" onclick="document.getElementById('${modalId}').remove()">&times;</button>
        </div>

        <form onsubmit="QuantitySystemModule.handleCreateSubmit(event, '${projectId}', '${environmentId}')" class="modal-form">
          <div class="modal-body">
            <!-- Vínculo com Material Existente -->
            <div class="form-group mb-3">
              <label class="form-label">Vincular a Material do Ambiente (Opcional):</label>
              <select id="create-qty-mat" class="form-select" onchange="QuantitySystemModule.onMaterialSelectChange(this)">
                <option value="">-- Material não vinculado (avulso) --</option>
                ${materials.map(m => `
                  <option value="${m.id}" data-name="${escapeHTML(m.name)}" data-cat="${escapeHTML(m.category)}" data-app="${escapeHTML(m.application)}" data-unit="${escapeHTML(m.quantityUnit || 'm²')}">
                    ${escapeHTML(m.name)} (${escapeHTML(m.category)} - ${escapeHTML(m.application)})
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="form-group mb-3">
              <label class="form-label">Nome do Item / Especificação: *</label>
              <input type="text" id="create-qty-name" class="form-control" required placeholder="Ex: Porcelanato Portobello 120x120">
            </div>

            <div class="row g-2 mb-3">
              <div class="col-md-6">
                <label class="form-label">Categoria: *</label>
                <select id="create-qty-cat" class="form-select">
                  ${StudioState.MATERIAL_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Aplicação: *</label>
                <select id="create-qty-app" class="form-select">
                  ${StudioState.MATERIAL_APPLICATIONS.map(a => `<option value="${a}">${a}</option>`).join('')}
                </select>
              </div>
            </div>

            <!-- Quantidade, Unidade e Perda -->
            <div class="row g-2 mb-3">
              <div class="col-md-4">
                <label class="form-label">Qtd. Base: *</label>
                <input type="number" step="0.01" min="0" id="create-qty-base" class="form-control" required value="40.00" oninput="QuantitySystemModule.recalculatePreview()">
              </div>
              <div class="col-md-4">
                <label class="form-label">Unidade: *</label>
                <select id="create-qty-unit" class="form-select" onchange="QuantitySystemModule.recalculatePreview()">
                  ${StudioState.QUANTITY_UNITS.map(u => `<option value="${u}" ${u === 'm²' ? 'selected' : ''}>${u}</option>`).join('')}
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label">Perda Técnica (%):</label>
                <select id="create-qty-loss" class="form-select" onchange="QuantitySystemModule.recalculatePreview()">
                  <option value="0">0% (Sem perda)</option>
                  <option value="5">5% (Corte simples)</option>
                  <option value="10" selected>10% (Padrão)</option>
                  <option value="15">15% (Diagonal / Ripado)</option>
                  <option value="20">20% (Pedras / Orgânico)</option>
                </select>
              </div>
            </div>

            <!-- Prévia da Fórmula -->
            <div class="calc-preview-alert mb-3" id="calc-preview-box">
              <i data-lucide="info"></i>
              <span id="calc-preview-text">40,00 m² × 1,10 (perda de 10%) = 44,00 m²</span>
            </div>

            <!-- Opção de Embalagem -->
            <div class="form-check form-switch mb-3">
              <input class="form-check-input" type="checkbox" id="create-qty-has-pkg" onchange="QuantitySystemModule.togglePackagingInputs(this.checked)">
              <label class="form-check-label" for="create-qty-has-pkg">Vendido em Caixas / Embalagens</label>
            </div>

            <div id="packaging-fields" style="display: none;" class="row g-2 mb-3 p-3 bg-light rounded">
              <div class="col-md-6">
                <label class="form-label">Cobertura por Caixa:</label>
                <input type="number" step="0.01" min="0.01" id="create-qty-pkg-cov" class="form-control" placeholder="Ex: 2.16" oninput="QuantitySystemModule.recalculatePreview()">
              </div>
              <div class="col-md-6">
                <label class="form-label">Tipo de Embalagem:</label>
                <select id="create-qty-pkg-unit" class="form-select" onchange="QuantitySystemModule.recalculatePreview()">
                  <option value="caixa">Caixa</option>
                  <option value="saco">Saco</option>
                  <option value="kit">Kit</option>
                  <option value="fardo">Fardo</option>
                </select>
              </div>
            </div>

            <!-- Origem e Observações -->
            <div class="row g-2 mb-3">
              <div class="col-md-6">
                <label class="form-label">Origem do Dado: *</label>
                <select id="create-qty-origin" class="form-select">
                  <option value="MEASURED" selected>MEASURED (Medição de Projeto)</option>
                  <option value="CALCULATED">CALCULATED (Cálculo Deduzido)</option>
                  <option value="MANUAL">MANUAL (Entrada Humana)</option>
                  <option value="IMPORTED">IMPORTED (Importação)</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Arquivo de Origem / Referência:</label>
                <input type="text" id="create-qty-ref" class="form-control" placeholder="Ex: Planta_Executiva_R02.dwg">
              </div>
            </div>

            <div class="form-group mb-2">
              <label class="form-label">Observações Técnicas:</label>
              <textarea id="create-qty-notes" class="form-control" rows="2" placeholder="Ex: Quantidade depende de levantamento executivo final."></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-outline" onclick="document.getElementById('${modalId}').remove()">Cancelar</button>
            <button type="submit" class="btn btn-primary"><i data-lucide="check"></i> Cadastrar Quantitativo</button>
          </div>
        </form>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  /**
   * Preenchimento automático ao selecionar material do ambiente
   */
  onMaterialSelectChange(selectEl) {
    const opt = selectEl.options[selectEl.selectedIndex];
    if (opt && opt.value) {
      document.getElementById('create-qty-name').value = opt.getAttribute('data-name') || '';
      document.getElementById('create-qty-cat').value = opt.getAttribute('data-cat') || 'REVESTIMENTO';
      document.getElementById('create-qty-app').value = opt.getAttribute('data-app') || 'PISO';
      this.recalculatePreview();
    }
  },

  /**
   * Alterna exibição dos campos de embalagem
   */
  togglePackagingInputs(show) {
    const el = document.getElementById('packaging-fields');
    if (el) el.style.display = show ? 'flex' : 'none';
    this.recalculatePreview();
  },

  /**
   * Recálculo em tempo real da fórmula visual do modal
   */
  recalculatePreview() {
    const baseInput = document.getElementById('create-qty-base');
    const lossInput = document.getElementById('create-qty-loss');
    const unitInput = document.getElementById('create-qty-unit');
    const hasPkgInput = document.getElementById('create-qty-has-pkg');
    const pkgCovInput = document.getElementById('create-qty-pkg-cov');
    const pkgUnitInput = document.getElementById('create-qty-pkg-unit');
    const previewText = document.getElementById('calc-preview-text');

    if (!baseInput || !lossInput || !previewText) return;

    const base = Number(baseInput.value || 0);
    const loss = Number(lossInput.value || 0);
    const unit = unitInput ? unitInput.value : 'm²';
    const hasPkg = hasPkgInput ? hasPkgInput.checked : false;
    const pkgCov = pkgCovInput ? Number(pkgCovInput.value || 0) : 0;
    const pkgUnit = pkgUnitInput ? pkgUnitInput.value : 'caixa';

    const memory = StudioState.calculateQuantityMemory({
      baseQuantity: base,
      lossPercentage: loss,
      packagingCoverage: hasPkg ? pkgCov : null,
      packagingUnit: pkgUnit,
      hasPackaging: hasPkg,
      unit
    });

    let txt = memory.formulaText;
    if (memory.hasPackaging && memory.packagingFormula) {
      txt += ` | ${memory.packagingFormula}`;
    }
    previewText.textContent = txt;
  },

  /**
   * Submissão do formulário de criação
   */
  handleCreateSubmit(event, projectId, environmentId) {
    event.preventDefault();
    try {
      const matSelect = document.getElementById('create-qty-mat');
      const nameInput = document.getElementById('create-qty-name');
      const catSelect = document.getElementById('create-qty-cat');
      const appSelect = document.getElementById('create-qty-app');
      const baseInput = document.getElementById('create-qty-base');
      const unitSelect = document.getElementById('create-qty-unit');
      const lossSelect = document.getElementById('create-qty-loss');
      const hasPkgInput = document.getElementById('create-qty-has-pkg');
      const pkgCovInput = document.getElementById('create-qty-pkg-cov');
      const pkgUnitSelect = document.getElementById('create-qty-pkg-unit');
      const originSelect = document.getElementById('create-qty-origin');
      const refInput = document.getElementById('create-qty-ref');
      const notesInput = document.getElementById('create-qty-notes');

      StudioState.createQuantity({
        projectId,
        environmentId,
        materialId: matSelect && matSelect.value ? matSelect.value : null,
        itemName: nameInput.value.trim(),
        category: catSelect.value,
        application: appSelect.value,
        baseQuantity: Number(baseInput.value),
        unit: unitSelect.value,
        lossPercentage: Number(lossSelect.value),
        hasPackaging: hasPkgInput ? hasPkgInput.checked : false,
        packagingCoverage: pkgCovInput && Number(pkgCovInput.value) > 0 ? Number(pkgCovInput.value) : null,
        packagingUnit: pkgUnitSelect ? pkgUnitSelect.value : 'caixa',
        originType: originSelect.value,
        sourceType: originSelect.value === 'MEASURED' ? 'PROJECT_DATA' : 'MANUAL_INPUT',
        sourceFileRef: refInput ? refInput.value.trim() : null,
        notes: notesInput ? notesInput.value.trim() : '',
        status: 'DRAFT'
      });

      const modalEl = document.getElementById('modal-qty-create');
      if (modalEl) modalEl.remove();

      // Recarrega a aba
      StudioApp.setEnvironmentTab('quantitativos');
    } catch (err) {
      alert(`Erro ao cadastrar quantitativo: ${err.message}`);
    }
  },

  /**
   * Modal de Estimativa IA com princípio anti-alucinação (Prompt E03 Itens 13 e 14)
   */
  openAiEstimateModal(projectId, environmentId) {
    const modalId = 'modal-qty-ai';
    let modalEl = document.getElementById(modalId);
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = modalId;
      modalEl.className = 'studio-modal-backdrop';
      document.body.appendChild(modalEl);
    }

    modalEl.innerHTML = `
      <div class="studio-modal-dialog animate-scale-up" style="max-width: 550px;">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <i data-lucide="sparkles" class="text-primary"></i>
            <h3>Estimativa Visual por IA</h3>
          </div>
          <button class="btn-close" onclick="document.getElementById('${modalId}').remove()">&times;</button>
        </div>

        <form onsubmit="QuantitySystemModule.handleAiEstimateSubmit(event, '${projectId}', '${environmentId}')" class="modal-form">
          <div class="modal-body">
            <div class="alert alert-info">
              <strong><i data-lucide="shield-alert"></i> Regra de Anti-Alucinação Ativa:</strong>
              O sistema gera apenas valores com a classificação mandatória <strong>ESTIMATED_BY_AI</strong> e nível <strong>QUANTITY_ESTIMATED</strong>. Nunca afirma quantidades exatas sem base de medição.
            </div>

            <div class="form-group mb-3">
              <label class="form-label">Elemento a ser estimado:</label>
              <input type="text" id="ai-qty-item" class="form-control" required placeholder="Ex: Revestimento de Parede Decorativa">
            </div>

            <div class="row g-2 mb-3">
              <div class="col-md-6">
                <label class="form-label">Categoria:</label>
                <select id="ai-qty-cat" class="form-select">
                  ${StudioState.MATERIAL_CATEGORIES.map(c => `<option value="${c}" ${c === 'PAREDE' ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Aplicação:</label>
                <select id="ai-qty-app" class="form-select">
                  ${StudioState.MATERIAL_APPLICATIONS.map(a => `<option value="${a}" ${a === 'PAREDE' ? 'selected' : ''}>${a}</option>`).join('')}
                </select>
              </div>
            </div>

            <div class="row g-2 mb-3">
              <div class="col-md-6">
                <label class="form-label">Estimativa Visual Base (m²):</label>
                <input type="number" step="0.1" min="0.1" id="ai-qty-base" class="form-control" required value="18.50">
              </div>
              <div class="col-md-6">
                <label class="form-label">Confiança da IA:</label>
                <select id="ai-qty-conf" class="form-select">
                  <option value="0.90">Alta (90%) — Geometria Clara</option>
                  <option value="0.80" selected>Média (80%) — Render Parcial</option>
                  <option value="0.65">Baixa (65%) — Perspectiva Livre</option>
                </select>
              </div>
            </div>

            <div class="form-group mb-2">
              <label class="form-label">Base Visual / Observação:</label>
              <textarea id="ai-qty-notes" class="form-control" rows="2" placeholder="Ex: Estimativa feita sobre a vista frontal do render da sala."></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-outline" onclick="document.getElementById('${modalId}').remove()">Cancelar</button>
            <button type="submit" class="btn btn-primary"><i data-lucide="sparkles"></i> Gerar Estimativa</button>
          </div>
        </form>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  /**
   * Processa a estimativa visual de IA
   */
  handleAiEstimateSubmit(event, projectId, environmentId) {
    event.preventDefault();
    try {
      const itemInput = document.getElementById('ai-qty-item');
      const catSelect = document.getElementById('ai-qty-cat');
      const appSelect = document.getElementById('ai-qty-app');
      const baseInput = document.getElementById('ai-qty-base');
      const confSelect = document.getElementById('ai-qty-conf');
      const notesInput = document.getElementById('ai-qty-notes');

      StudioState.estimateQuantityFromAi({
        projectId,
        environmentId,
        itemName: itemInput.value.trim(),
        category: catSelect.value,
        application: appSelect.value,
        estimatedBaseQuantity: Number(baseInput.value),
        confidence: Number(confSelect.value),
        notes: notesInput.value.trim()
      });

      const modalEl = document.getElementById('modal-qty-ai');
      if (modalEl) modalEl.remove();

      StudioApp.setEnvironmentTab('quantitativos');
    } catch (err) {
      alert(`Erro na estimativa IA: ${err.message}`);
    }
  },

  /**
   * Modal de Importação de Dados do Revit (Prompt E03 Itens 15 e 16)
   */
  openRevitImportModal(projectId, environmentId) {
    const modalId = 'modal-qty-revit';
    let modalEl = document.getElementById(modalId);
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = modalId;
      modalEl.className = 'studio-modal-backdrop';
      document.body.appendChild(modalEl);
    }

    modalEl.innerHTML = `
      <div class="studio-modal-dialog animate-scale-up" style="max-width: 600px;">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <i data-lucide="layers" class="text-primary"></i>
            <h3>Importação de Quantitativos do Revit (SOURCE = REVIT)</h3>
          </div>
          <button class="btn-close" onclick="document.getElementById('${modalId}').remove()">&times;</button>
        </div>

        <div class="modal-body">
          <p class="text-muted text-sm">
            Importa tabelas de levantamento de materiais (Material Takeoff) exportadas do Autodesk Revit em formato estruturado. A fonte <strong>SOURCE = REVIT</strong> é registrada e o arquivo de procedência é mantido de forma indelével.
          </p>

          <div class="form-group mb-3">
            <label class="form-label">Arquivo de Origem Revit (.rvt / .txt / .csv): *</label>
            <input type="text" id="revit-file-ref" class="form-control" value="Residencia_Praia_Executivo_2026_R03.rvt">
          </div>

          <div class="revit-preview-items p-3 bg-light rounded mb-3">
            <strong>Exemplos de Itens Detectados na Tabela Revit:</strong>
            <ul class="text-sm mt-2 mb-0">
              <li>Piso Cerâmico 120x120 (Floors - Element 10452): <strong>38,50 m²</strong></li>
              <li>Pintura Acrílica Lavável (Walls - Element 10892): <strong>54,20 m²</strong></li>
              <li>Rodapé Poliestireno 15cm (Floors - Element 10910): <strong>28,00 m</strong></li>
            </ul>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline" onclick="document.getElementById('${modalId}').remove()">Cancelar</button>
          <button type="button" class="btn btn-primary" onclick="QuantitySystemModule.executeRevitImport('${projectId}', '${environmentId}')">
            <i data-lucide="download"></i> Confirmar Importação Revit
          </button>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  /**
   * Executa a ingestão piloto de itens do Revit
   */
  executeRevitImport(projectId, environmentId) {
    try {
      const fileRef = document.getElementById('revit-file-ref').value.trim() || 'Modelo_Executivo_Revit.rvt';

      const mockRevitItems = [
        {
          projectId,
          environmentId,
          itemName: 'Piso Cerâmico Retificado 120x120',
          category: 'PISO',
          application: 'PISO',
          baseQuantity: 38.50,
          unit: 'm²',
          lossPercentage: 10,
          revitElementId: 'REV-EL-10452',
          revitCategory: 'Floors',
          notes: 'Extraído da tabela Material Takeoff do Revit.'
        },
        {
          projectId,
          environmentId,
          itemName: 'Pintura Acrílica Fosca Lavável',
          category: 'PINTURA',
          application: 'PAREDE',
          baseQuantity: 54.20,
          unit: 'm²',
          lossPercentage: 5,
          revitElementId: 'REV-EL-10892',
          revitCategory: 'Walls',
          notes: 'Área líquida de paredes descontando vãos de portas e esquadrias.'
        }
      ];

      StudioState.importQuantitiesFromRevit(mockRevitItems, fileRef);

      const modalEl = document.getElementById('modal-qty-revit');
      if (modalEl) modalEl.remove();

      StudioApp.setEnvironmentTab('quantitativos');
    } catch (err) {
      alert(`Erro na importação: ${err.message}`);
    }
  },

  /**
   * Modal de Visualização Consolidada do Projeto (Prompt E03 Itens 11 e 12)
   */
  openProjectConsolidatedModal(projectId) {
    const consolidated = StudioState.getProjectConsolidatedQuantities(projectId);

    const modalId = 'modal-qty-consolidated';
    let modalEl = document.getElementById(modalId);
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = modalId;
      modalEl.className = 'studio-modal-backdrop';
      document.body.appendChild(modalEl);
    }

    modalEl.innerHTML = `
      <div class="studio-modal-dialog animate-scale-up" style="max-width: 850px;">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <i data-lucide="layers" class="text-primary"></i>
            <h3>Quantitativo Consolidado do Projeto (Total Geral)</h3>
          </div>
          <button class="btn-close" onclick="document.getElementById('${modalId}').remove()">&times;</button>
        </div>

        <div class="modal-body">
          <p class="text-muted text-sm">
            Totalização consolidada dos materiais presentes em múltiplos cômodos. Permite visualizar o volume total para negociação e compra, preservando simultaneamente o detalhamento por ambiente.
          </p>

          <div class="table-responsive mt-3">
            <table class="table table-bordered">
              <thead class="bg-light">
                <tr>
                  <th>Material / Item Consolidado</th>
                  <th>Categoria</th>
                  <th>Qtd. Base Total</th>
                  <th>Qtd. Final Total</th>
                  <th>Qtd. Compra</th>
                  <th>Distribuição por Ambiente</th>
                </tr>
              </thead>
              <tbody>
                ${consolidated.length === 0 ? `
                  <tr><td colspan="6" class="text-center py-4 text-muted">Nenhum quantitativo consolidado disponível.</td></tr>
                ` : consolidated.map(grp => `
                  <tr>
                    <td>
                      <strong>${escapeHTML(grp.itemName)}</strong>
                      ${grp.product ? `<div class="text-xs text-muted">SKU: ${escapeHTML(grp.product.skuCode || 'N/A')}</div>` : ''}
                    </td>
                    <td><span class="qty-cat-pill">${escapeHTML(grp.category)}</span></td>
                    <td class="text-nowrap"><strong>${grp.totalBaseQuantity.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> ${escapeHTML(grp.unit)}</td>
                    <td class="text-nowrap"><strong class="text-primary">${grp.totalFinalQuantity.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> ${escapeHTML(grp.unit)}</td>
                    <td class="text-nowrap">
                      ${grp.hasPackaging && grp.packagingCoverage ? `
                        <strong>${grp.totalPurchasingQuantity} ${escapeHTML(grp.packagingUnit || 'cx')}</strong>
                      ` : `<strong>${grp.totalPurchasingQuantity.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> ${escapeHTML(grp.unit)}`}
                    </td>
                    <td>
                      <ul class="list-unstyled mb-0 text-sm">
                        ${grp.environmentsBreakdown.map(envB => `
                          <li class="py-1 border-bottom">
                            <strong>${escapeHTML(envB.environmentName)}:</strong> 
                            ${envB.finalQuantity.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ${escapeHTML(envB.unit)} 
                            <span class="badge ${envB.status === 'APPROVED' ? 'bg-success' : 'bg-secondary'}">${escapeHTML(envB.status)}</span>
                          </li>
                        `).join('')}
                      </ul>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-outline" onclick="QuantitySystemModule.downloadCSV('${projectId}')">
            <i data-lucide="download"></i> Exportar Projeto CSV
          </button>
          <button class="btn btn-primary" onclick="document.getElementById('${modalId}').remove()">Fechar</button>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  /**
   * Diálogo de aprovação
   */
  promptApprove(quantityId) {
    const notes = prompt('Notas adicionais de aprovação (opcional):', 'Homologado para apresentação executiva.');
    if (notes !== null) {
      try {
        StudioState.approveQuantity(quantityId, 'Eduardo Marques', notes);
        StudioApp.setEnvironmentTab('quantitativos');
      } catch (err) {
        alert(err.message);
      }
    }
  },

  /**
   * Diálogo de rejeição com motivo obrigatório (Item 18)
   */
  promptReject(quantityId) {
    const reason = prompt('Motivo obrigatório da rejeição do quantitativo:');
    if (reason !== null) {
      if (!reason.trim()) {
        alert('O motivo da rejeição é obrigatório!');
        return;
      }
      try {
        StudioState.rejectQuantity(quantityId, reason.trim(), 'Eduardo Marques');
        StudioApp.setEnvironmentTab('quantitativos');
      } catch (err) {
        alert(err.message);
      }
    }
  },

  /**
   * Download instantâneo do CSV técnico UTF-8 (Prompt E03 Item 27)
   */
  downloadCSV(projectId, environmentId = null) {
    const csvContent = StudioState.exportQuantitiesToCsv(projectId, environmentId);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Quantitativos_ArqVertice_${projectId}_${environmentId || 'Consolidado'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  /**
   * Filtros dinâmicos
   */
  handleFilterChange(projectId, environmentId) {
    const statusSelect = document.getElementById('filter-qty-status');
    const originSelect = document.getElementById('filter-qty-origin');
    const catSelect = document.getElementById('filter-qty-category');

    const status = statusSelect ? statusSelect.value : 'ALL';
    const origin = originSelect ? originSelect.value : 'ALL';
    const cat = catSelect ? catSelect.value : 'ALL';

    const filter = {};
    if (status !== 'ALL') filter.status = status;
    if (origin !== 'ALL') filter.originType = origin;
    if (cat !== 'ALL') filter.category = cat;

    const filtered = StudioState.getEnvironmentQuantities(projectId, environmentId, filter);
    const tbody = document.querySelector('.quantities-table tbody');
    if (tbody) {
      if (filtered.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="10" class="text-center py-5 text-muted">
              Nenhum quantitativo corresponde aos filtros selecionados.
            </td>
          </tr>
        `;
      } else {
        tbody.innerHTML = filtered.map(q => this._renderQuantityTableRow(q, projectId, environmentId)).join('');
      }
      if (window.lucide) lucide.createIcons();
    }
  }
};

if (typeof window !== 'undefined') {
  window.QuantitySystemModule = QuantitySystemModule;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuantitySystemModule;
}
