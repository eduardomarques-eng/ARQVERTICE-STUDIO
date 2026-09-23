/**
 * ============================================================================
 * ARQVERTICE STUDIO — BLOCO F08: PRANCHAS ESPECÍFICAS DE MATERIAIS,
 * MOBILIÁRIO E QUANTITATIVOS
 *
 * Módulo de interface e controle para documentação visual organizada
 * de materiais, mobiliário e tabelas de quantitativos nas pranchas.
 * ============================================================================
 */

const MaterialFurnitureBoardsModule = (function () {
  'use strict';

  let currentTab = 'materiais'; // 'materiais' | 'mobiliario' | 'quantitativos' | 'pranchas'
  let filters = {
    ambiente: 'all',
    categoria: 'all',
    fabricante: 'all',
    fornecedor: 'all',
    status: 'all'
  };
  let selectedItemIds = [];

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function setTab(tab) {
    currentTab = tab;
    selectedItemIds = [];
    refreshUI();
  }

  function setFilter(key, value) {
    filters[key] = value;
    refreshUI();
  }

  function resetFilters() {
    filters = {
      ambiente: 'all',
      categoria: 'all',
      fabricante: 'all',
      fornecedor: 'all',
      status: 'all'
    };
    refreshUI();
  }

  function toggleItemSelection(id) {
    const idx = selectedItemIds.indexOf(id);
    if (idx >= 0) {
      selectedItemIds.splice(idx, 1);
    } else {
      selectedItemIds.push(id);
    }
    refreshUI();
  }

  function selectAllVisible(ids) {
    if (selectedItemIds.length === ids.length) {
      selectedItemIds = [];
    } else {
      selectedItemIds = [...ids];
    }
    refreshUI();
  }

  function getAvailableFilterOptions(projectId) {
    const mats = StudioState.getCanonicalMaterials ? StudioState.getCanonicalMaterials(projectId) : [];
    const furn = StudioState.getCanonicalFurniture ? StudioState.getCanonicalFurniture(projectId) : [];
    const qts = StudioState.getCanonicalQuantities ? StudioState.getCanonicalQuantities(projectId) : [];

    const all = [...mats, ...furn, ...qts];

    const ambientes = Array.from(new Set(all.map(x => x.ambiente).filter(Boolean))).sort();
    const categorias = Array.from(new Set(all.map(x => x.categoria).filter(Boolean))).sort();
    const fabricantes = Array.from(new Set(all.map(x => x.fabricante).filter(x => x && x !== 'Não informado'))).sort();
    const fornecedores = Array.from(new Set(all.map(x => x.fornecedor).filter(x => x && x !== 'Não informado'))).sort();
    const statuses = Array.from(new Set(all.map(x => x.status).filter(Boolean))).sort();

    return { ambientes, categorias, fabricantes, fornecedores, statuses };
  }

  function render(containerId, projectId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const currentProject = StudioState.getProject ? StudioState.getProject(projectId) : null;
    if (!currentProject) {
      container.innerHTML = `<div class="p-6 text-muted">Selecione um projeto para gerenciar pranchas de materiais e mobiliário.</div>`;
      return;
    }

    const filterOptions = getAvailableFilterOptions(projectId);
    const materials = StudioState.getCanonicalMaterials(projectId, filters);
    const furniture = StudioState.getCanonicalFurniture(projectId, filters);
    const quantities = StudioState.getCanonicalQuantities(projectId, filters);
    const sheets = StudioState.getProjectSheets ? StudioState.getProjectSheets(projectId) : [];

    container.innerHTML = `
      <div class="f08-container" style="display: flex; flex-direction: column; gap: 20px; padding: 20px;">
        <!-- Header -->
        <div class="f08-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color, #e2e8f0); padding-bottom: 16px;">
          <div>
            <h2 style="margin: 0 0 4px 0; font-size: 20px; font-weight: 700; color: var(--text-primary, #0f172a);">
              Documentação Visual de Materiais, Mobiliário e Quantitativos
            </h2>
            <p style="margin: 0; font-size: 13px; color: var(--text-secondary, #64748b);">
              F08 • Apresentação técnica e diagramação em pranchas sem transformar o Studio em ERP de obras.
            </p>
          </div>

          <div style="display: flex; gap: 10px;">
            <button class="btn btn-primary btn-sm" onclick="MaterialFurnitureBoardsModule.openGenerateBoardModal('${projectId}')">
              <i data-lucide="layout-grid"></i> Gerar em Prancha
            </button>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="f08-tabs" style="display: flex; gap: 8px; border-bottom: 1px solid var(--border-color, #e2e8f0);">
          <button class="tab-btn ${currentTab === 'materiais' ? 'active font-bold border-b-2' : ''}" style="padding: 8px 16px; cursor: pointer;" onclick="MaterialFurnitureBoardsModule.setTab('materiais')">
            Materiais (${materials.length})
          </button>
          <button class="tab-btn ${currentTab === 'mobiliario' ? 'active font-bold border-b-2' : ''}" style="padding: 8px 16px; cursor: pointer;" onclick="MaterialFurnitureBoardsModule.setTab('mobiliario')">
            Mobiliário (${furniture.length})
          </button>
          <button class="tab-btn ${currentTab === 'quantitativos' ? 'active font-bold border-b-2' : ''}" style="padding: 8px 16px; cursor: pointer;" onclick="MaterialFurnitureBoardsModule.setTab('quantitativos')">
            Quantitativos (${quantities.length})
          </button>
        </div>

        <!-- Filtros Canônicos: ambiente, categoria, fabricante, fornecedor, status -->
        <div class="f08-filters-bar" style="display: flex; flex-wrap: wrap; gap: 12px; background: var(--bg-surface-secondary, #f8fafc); padding: 12px 16px; border-radius: 8px; align-items: center;">
          <span style="font-size: 12px; font-weight: 600; color: var(--text-secondary, #64748b);">FILTRAR POR:</span>

          <!-- Ambiente -->
          <select class="form-select form-select-sm" style="font-size: 12px; padding: 4px 8px; border-radius: 4px;" onchange="MaterialFurnitureBoardsModule.setFilter('ambiente', this.value)">
            <option value="all" ${filters.ambiente === 'all' ? 'selected' : ''}>Todos os Ambientes</option>
            ${filterOptions.ambientes.map(amb => `<option value="${escapeHTML(amb)}" ${filters.ambiente === amb ? 'selected' : ''}>${escapeHTML(amb)}</option>`).join('')}
          </select>

          <!-- Categoria -->
          <select class="form-select form-select-sm" style="font-size: 12px; padding: 4px 8px; border-radius: 4px;" onchange="MaterialFurnitureBoardsModule.setFilter('categoria', this.value)">
            <option value="all" ${filters.categoria === 'all' ? 'selected' : ''}>Todas as Categorias</option>
            ${filterOptions.categorias.map(cat => `<option value="${escapeHTML(cat)}" ${filters.categoria === cat ? 'selected' : ''}>${escapeHTML(cat)}</option>`).join('')}
          </select>

          <!-- Fabricante -->
          <select class="form-select form-select-sm" style="font-size: 12px; padding: 4px 8px; border-radius: 4px;" onchange="MaterialFurnitureBoardsModule.setFilter('fabricante', this.value)">
            <option value="all" ${filters.fabricante === 'all' ? 'selected' : ''}>Todos os Fabricantes</option>
            ${filterOptions.fabricantes.map(fab => `<option value="${escapeHTML(fab)}" ${filters.fabricante === fab ? 'selected' : ''}>${escapeHTML(fab)}</option>`).join('')}
          </select>

          <!-- Fornecedor -->
          <select class="form-select form-select-sm" style="font-size: 12px; padding: 4px 8px; border-radius: 4px;" onchange="MaterialFurnitureBoardsModule.setFilter('fornecedor', this.value)">
            <option value="all" ${filters.fornecedor === 'all' ? 'selected' : ''}>Todos os Fornecedores</option>
            ${filterOptions.fornecedores.map(forn => `<option value="${escapeHTML(forn)}" ${filters.fornecedor === forn ? 'selected' : ''}>${escapeHTML(forn)}</option>`).join('')}
          </select>

          <!-- Status -->
          <select class="form-select form-select-sm" style="font-size: 12px; padding: 4px 8px; border-radius: 4px;" onchange="MaterialFurnitureBoardsModule.setFilter('status', this.value)">
            <option value="all" ${filters.status === 'all' ? 'selected' : ''}>Todos os Status</option>
            ${filterOptions.statuses.map(st => `<option value="${escapeHTML(st)}" ${filters.status === st ? 'selected' : ''}>${escapeHTML(st)}</option>`).join('')}
          </select>

          <button class="btn btn-ghost btn-sm" style="font-size: 12px;" onclick="MaterialFurnitureBoardsModule.resetFilters()">
            Limpar Filtros
          </button>
        </div>

        <!-- Conteúdo da Aba Ativa -->
        <div class="f08-tab-content">
          ${currentTab === 'materiais' ? renderMaterialsList(materials) : ''}
          ${currentTab === 'mobiliario' ? renderFurnitureList(furniture) : ''}
          ${currentTab === 'quantitativos' ? renderQuantitiesTable(quantities) : ''}
        </div>
      </div>
    `;

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  // 1. MATERIAIS (13 campos + origem)
  function renderMaterialsList(materials) {
    if (!materials || materials.length === 0) {
      return `<div class="p-8 text-center text-muted" style="border: 1px dashed var(--border-color, #cbd5e1); border-radius: 8px;">Nenhum material encontrado com os filtros selecionados.</div>`;
    }

    return `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;">
        ${materials.map(mat => {
          const isSelected = selectedItemIds.includes(mat.id);
          return `
            <div class="f08-card ${isSelected ? 'selected' : ''}" style="border: 1px solid ${isSelected ? 'var(--primary-color, #2563eb)' : 'var(--border-color, #e2e8f0)'}; border-radius: 8px; overflow: hidden; background: #fff; display: flex; flex-direction: column;">
              <div style="height: 160px; background: #f1f5f9; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                ${mat.imagem ? `
                  <img src="${escapeHTML(mat.imagem)}" alt="${escapeHTML(mat.nome)}" style="width: 100%; height: 100%; object-fit: cover;" />
                ` : `<span style="color: #94a3b8; font-size: 12px;">Sem imagem</span>`}
                <span class="badge" style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.6); color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 4px;">
                  Origem: ${escapeHTML(mat.origem)}
                </span>
                <input type="checkbox" style="position: absolute; top: 8px; left: 8px;" ${isSelected ? 'checked' : ''} onchange="MaterialFurnitureBoardsModule.toggleItemSelection('${mat.id}')" />
              </div>

              <!-- Layout 6: imagem, nome, código, fabricante, acabamento, ambiente, observação -->
              <div style="padding: 12px; display: flex; flex-direction: column; gap: 6px; font-size: 12px;">
                <strong style="font-size: 14px; color: #0f172a;">${escapeHTML(mat.nome)}</strong>
                <div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Código:</span> <span class="font-mono">${escapeHTML(mat.codigo)}</span></div>
                <div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Fabricante:</span> <span>${escapeHTML(mat.fabricante)}</span></div>
                <div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Fornecedor:</span> <span>${escapeHTML(mat.fornecedor)}</span></div>
                <div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Referência:</span> <span>${escapeHTML(mat.referencia)}</span></div>
                <div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Acabamento:</span> <span>${escapeHTML(mat.acabamento)}</span></div>
                <div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Cor:</span> <span>${escapeHTML(mat.cor)}</span></div>
                <div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Ambiente:</span> <span>${escapeHTML(mat.ambiente)}</span></div>
                <div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Status:</span> <span class="badge badge-sm">${escapeHTML(mat.status)}</span></div>
                ${mat.observacao ? `
                  <div style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed #e2e8f0; font-size: 11px; color: #475569;">
                    <strong>Obs:</strong> ${escapeHTML(mat.observacao)}
                  </div>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // 2. MOBILIÁRIO (11 campos + origem)
  function renderFurnitureList(furniture) {
    if (!furniture || furniture.length === 0) {
      return `<div class="p-8 text-center text-muted" style="border: 1px dashed var(--border-color, #cbd5e1); border-radius: 8px;">Nenhum item de mobiliário encontrado com os filtros selecionados.</div>`;
    }

    return `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;">
        ${furniture.map(furn => {
          const isSelected = selectedItemIds.includes(furn.id);
          return `
            <div class="f08-card ${isSelected ? 'selected' : ''}" style="border: 1px solid ${isSelected ? 'var(--primary-color, #2563eb)' : 'var(--border-color, #e2e8f0)'}; border-radius: 8px; overflow: hidden; background: #fff; display: flex; flex-direction: column;">
              <div style="height: 160px; background: #f1f5f9; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                ${furn.imagem ? `
                  <img src="${escapeHTML(furn.imagem)}" alt="${escapeHTML(furn.item)}" style="width: 100%; height: 100%; object-fit: cover;" />
                ` : `<span style="color: #94a3b8; font-size: 12px;">Sem imagem</span>`}
                <span class="badge" style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.6); color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 4px;">
                  Origem: ${escapeHTML(furn.origem)}
                </span>
                <input type="checkbox" style="position: absolute; top: 8px; left: 8px;" ${isSelected ? 'checked' : ''} onchange="MaterialFurnitureBoardsModule.toggleItemSelection('${furn.id}')" />
              </div>

              <!-- Layout 7: imagem, item, referência, dimensão, quantidade, ambiente -->
              <div style="padding: 12px; display: flex; flex-direction: column; gap: 6px; font-size: 12px;">
                <strong style="font-size: 14px; color: #0f172a;">${escapeHTML(furn.item)}</strong>
                <div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Referência:</span> <span>${escapeHTML(furn.referencia)}</span></div>
                <div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Dimensão:</span> <span class="font-mono">${escapeHTML(furn.dimensoes)}</span></div>
                <div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Quantidade:</span> <span class="bold font-mono" style="color: ${furn.quantidade === 'NÃO INFORMADO' ? '#e11d48' : '#0f172a'};">${escapeHTML(furn.quantidade)}</span></div>
                <div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Ambiente:</span> <span>${escapeHTML(furn.ambiente)}</span></div>
                <div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Fabricante:</span> <span>${escapeHTML(furn.fabricante)}</span></div>
                <div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Fornecedor:</span> <span>${escapeHTML(furn.fornecedor)}</span></div>
                ${furn.observacao ? `
                  <div style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed #e2e8f0; font-size: 11px; color: #475569;">
                    <strong>Obs:</strong> ${escapeHTML(furn.observacao)}
                  </div>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // 3 & 8. TABELA DE QUANTITATIVOS
  function renderQuantitiesTable(quantities) {
    if (!quantities || quantities.length === 0) {
      return `<div class="p-8 text-center text-muted" style="border: 1px dashed var(--border-color, #cbd5e1); border-radius: 8px;">Nenhum quantitativo encontrado com os filtros selecionados.</div>`;
    }

    return `
      <div style="border: 1px solid var(--border-color, #e2e8f0); border-radius: 8px; overflow: hidden; background: #fff;">
        <table class="table" style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
          <thead style="background: var(--bg-surface-secondary, #f8fafc); border-bottom: 2px solid var(--border-color, #e2e8f0);">
            <tr>
              <th style="padding: 10px 12px;">Item</th>
              <th style="padding: 10px 12px;">Unidade</th>
              <th style="padding: 10px 12px;">Quantidade</th>
              <th style="padding: 10px 12px;">Ambiente</th>
              <th style="padding: 10px 12px;">Observação</th>
              <th style="padding: 10px 12px;">Fonte</th>
            </tr>
          </thead>
          <tbody>
            ${quantities.map(q => {
              const isNotReported = q.quantidade === 'NÃO INFORMADO';
              return `
                <tr style="border-bottom: 1px solid var(--border-color, #f1f5f9);">
                  <td style="padding: 10px 12px; font-weight: 600; color: #0f172a;">${escapeHTML(q.item)}</td>
                  <td style="padding: 10px 12px; color: #64748b;">${escapeHTML(q.unidade)}</td>
                  <td style="padding: 10px 12px; font-family: monospace; font-weight: 700; color: ${isNotReported ? '#e11d48' : '#0f172a'};">
                    ${escapeHTML(q.quantidade)}
                  </td>
                  <td style="padding: 10px 12px; color: #334155;">${escapeHTML(q.ambiente)}</td>
                  <td style="padding: 10px 12px; color: #64748b;">${escapeHTML(q.observacao || '—')}</td>
                  <td style="padding: 10px 12px;">
                    <span class="badge badge-sm" style="background: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px; font-size: 11px;">
                      ${escapeHTML(q.fonte)}
                    </span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function openGenerateBoardModal(projectId) {
    const sheets = StudioState.getProjectSheets ? StudioState.getProjectSheets(projectId) : [];
    if (sheets.length === 0) {
      alert('Nenhuma prancha cadastrada no projeto. Crie uma prancha primeiro no Motor de Pranchas.');
      return;
    }

    const sheetOptions = sheets.map(s => `<option value="${s.id}">${escapeHTML(s.sheetNumber)} — ${escapeHTML(s.name)} (${s.format})</option>`).join('');

    const modalHTML = `
      <div class="modal-backdrop" id="f08-modal-generate" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;">
        <div class="modal-card" style="background: #fff; width: 480px; max-width: 95vw; border-radius: 8px; padding: 24px; display: flex; flex-direction: column; gap: 16px;">
          <h3 style="margin: 0; font-size: 18px; font-weight: 700;">Gerar Prancha Específica</h3>
          
          <div>
            <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 4px;">Tipo de Prancha:</label>
            <select id="f08-modal-type" class="form-select" style="width: 100%; padding: 8px;">
              <option value="material">Prancha de Materiais (Layout 6)</option>
              <option value="furniture">Prancha de Mobiliário (Layout 7)</option>
              <option value="quantities">Prancha de Quantitativos (Tabela)</option>
            </select>
          </div>

          <div>
            <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 4px;">Prancha de Destino:</label>
            <select id="f08-modal-sheet" class="form-select" style="width: 100%; padding: 8px;">
              ${sheetOptions}
            </select>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px;">
            <button class="btn btn-ghost" onclick="document.getElementById('f08-modal-generate').remove()">Cancelar</button>
            <button class="btn btn-primary" onclick="MaterialFurnitureBoardsModule.confirmGenerateBoard('${projectId}')">Inserir na Prancha</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  function confirmGenerateBoard(projectId) {
    const type = document.getElementById('f08-modal-type').value;
    const sheetId = document.getElementById('f08-modal-sheet').value;

    try {
      if (type === 'material') {
        StudioState.generateMaterialsBoard(sheetId, selectedItemIds.length > 0 ? selectedItemIds : null, { filters });
      } else if (type === 'furniture') {
        StudioState.generateFurnitureBoard(sheetId, selectedItemIds.length > 0 ? selectedItemIds : null, { filters });
      } else if (type === 'quantities') {
        StudioState.generateQuantitiesBoard(sheetId, selectedItemIds.length > 0 ? selectedItemIds : null, { filters });
      }

      alert('Elementos inseridos na prancha com sucesso!');
      const modal = document.getElementById('f08-modal-generate');
      if (modal) modal.remove();
      if (typeof SheetEngineModule !== 'undefined' && SheetEngineModule.setActiveSheet) {
        SheetEngineModule.setActiveSheet(sheetId);
      }
    } catch (err) {
      alert(`Erro ao gerar prancha: ${err.message}`);
    }
  }

  function refreshUI() {
    const activeProject = StudioState.getActiveProject ? StudioState.getActiveProject() : (StudioState.data?.selectedProjectId || 'prj-praia-01');
    render('material-furniture-boards-root', activeProject?.id || activeProject);
  }

  return {
    render,
    setTab,
    setFilter,
    resetFilters,
    toggleItemSelection,
    selectAllVisible,
    openGenerateBoardModal,
    confirmGenerateBoard,
    refreshUI
  };
})();

if (typeof window !== 'undefined') {
  window.MaterialFurnitureBoardsModule = MaterialFurnitureBoardsModule;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MaterialFurnitureBoardsModule;
}
