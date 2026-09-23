/**
 * ============================================================================
 * ARQVERTICE STUDIO — D02: PREPARAÇÃO E CURADORIA DAS REFERÊNCIAS VISUAIS
 * ============================================================================
 * Pipeline de curadoria, categorização nos 8 tipos canônicos, 4 prioridades,
 * anotações de escopo de uso, conjuntos de referência e geração do VISUAL_CONTEXT.
 */

const VisualReferenceCurationModule = (function () {
  'use strict';

  let currentTypeFilter = 'ALL';
  let currentPriorityFilter = 'ALL';
  let currentStatusFilter = 'ALL'; // 'ALL', 'INCLUDED', 'EXCLUDED'
  let searchQuery = '';

  /**
   * Renderiza a interface de curadoria de referências dentro do Workspace de Visualização
   */
  function render(env, project) {
    if (!env || !project) {
      return '<div class="empty-state-card"><p>Ambiente ou projeto inválido.</p></div>';
    }

    const sets = StudioState.getVisualReferenceSets(project.id, env.id);
    const activeSet = sets.find(s => s.isActive) || sets[0] || null;
    const items = StudioState.getVisualReferenceItems(project.id, env.id);

    // Filtros
    let filteredItems = items.filter(item => {
      const matchType = currentTypeFilter === 'ALL' || item.referenceType === currentTypeFilter;
      const matchPriority = currentPriorityFilter === 'ALL' || item.priority === currentPriorityFilter;
      const matchStatus = currentStatusFilter === 'ALL' || 
        (currentStatusFilter === 'INCLUDED' && !item.isExcludedFromGeneration) ||
        (currentStatusFilter === 'EXCLUDED' && item.isExcludedFromGeneration);
      const matchQuery = !searchQuery || 
        (item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.scopeNotes && item.scopeNotes.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchType && matchPriority && matchStatus && matchQuery;
    });

    const countsByType = {};
    (StudioState.VISUAL_REFERENCE_TYPES || []).forEach(t => {
      countsByType[t] = items.filter(i => i.referenceType === t && !i.isExcludedFromGeneration).length;
    });

    return `
      <div class="vref-curation-container animate-fade-in" id="vref-curation-${env.id}">
        <!-- Topo da Curadoria: Conjunto Ativo e Ações Globais -->
        <div class="vref-header-toolbar">
          <div class="vref-set-selector-wrap">
            <div class="vref-set-title-group">
              <span class="vref-tag-pill"><i data-lucide="folder-kanban"></i> VISUAL_REFERENCE_SET</span>
              <h3 class="vref-set-name">${escapeHTML(activeSet ? activeSet.name : 'Curadoria Padrão do Ambiente')}</h3>
              <span class="vref-ver-badge">${escapeHTML(activeSet ? activeSet.version : 'V01')}</span>
            </div>
            <p class="vref-set-desc">${escapeHTML(activeSet ? activeSet.objective : 'Curadoria estruturada de referências visuais com escopos de uso estritos.')}</p>
          </div>

          <div class="vref-top-actions">
            <button class="btn btn-outline btn-sm" onclick="VisualReferenceCurationModule.openCreateSetModal('${project.id}', '${env.id}')" title="Criar Novo Conjunto de Referências">
              <i data-lucide="plus"></i>
              <span>Novo Conjunto</span>
            </button>
            <button class="btn btn-primary btn-sm" onclick="VisualReferenceCurationModule.openVisualContextModal('${project.id}', '${env.id}')" title="Visualizar Pacote Canônico VISUAL_CONTEXT para IA">
              <i data-lucide="cpu"></i>
              <span>Ver Contexto IA (D02)</span>
            </button>
          </div>
        </div>

        <!-- Barra de Estatísticas dos 8 Tipos Canônicos -->
        <div class="vref-types-chips-bar">
          <div class="type-chip ${currentTypeFilter === 'ALL' ? 'active' : ''}" onclick="VisualReferenceCurationModule.setTypeFilter('ALL')">
            <strong>Todas</strong>
            <span>${items.length}</span>
          </div>
          <div class="type-chip cat-geometry ${currentTypeFilter === 'GEOMETRY_REFERENCE' ? 'active' : ''}" onclick="VisualReferenceCurationModule.setTypeFilter('GEOMETRY_REFERENCE')">
            <i data-lucide="box"></i>
            <span>Geometria</span>
            <strong>${countsByType['GEOMETRY_REFERENCE'] || 0}</strong>
          </div>
          <div class="type-chip cat-camera ${currentTypeFilter === 'CAMERA_REFERENCE' ? 'active' : ''}" onclick="VisualReferenceCurationModule.setTypeFilter('CAMERA_REFERENCE')">
            <i data-lucide="camera"></i>
            <span>Câmera</span>
            <strong>${countsByType['CAMERA_REFERENCE'] || 0}</strong>
          </div>
          <div class="type-chip cat-style ${currentTypeFilter === 'STYLE_REFERENCE' ? 'active' : ''}" onclick="VisualReferenceCurationModule.setTypeFilter('STYLE_REFERENCE')">
            <i data-lucide="compass"></i>
            <span>Estilo</span>
            <strong>${countsByType['STYLE_REFERENCE'] || 0}</strong>
          </div>
          <div class="type-chip cat-material ${currentTypeFilter === 'MATERIAL_REFERENCE' ? 'active' : ''}" onclick="VisualReferenceCurationModule.setTypeFilter('MATERIAL_REFERENCE')">
            <i data-lucide="palette"></i>
            <span>Material</span>
            <strong>${countsByType['MATERIAL_REFERENCE'] || 0}</strong>
          </div>
          <div class="type-chip cat-furniture ${currentTypeFilter === 'FURNITURE_REFERENCE' ? 'active' : ''}" onclick="VisualReferenceCurationModule.setTypeFilter('FURNITURE_REFERENCE')">
            <i data-lucide="armchair"></i>
            <span>Mobiliário</span>
            <strong>${countsByType['FURNITURE_REFERENCE'] || 0}</strong>
          </div>
          <div class="type-chip cat-lighting ${currentTypeFilter === 'LIGHTING_REFERENCE' ? 'active' : ''}" onclick="VisualReferenceCurationModule.setTypeFilter('LIGHTING_REFERENCE')">
            <i data-lucide="sun"></i>
            <span>Iluminação</span>
            <strong>${countsByType['LIGHTING_REFERENCE'] || 0}</strong>
          </div>
          <div class="type-chip cat-composition ${currentTypeFilter === 'COMPOSITION_REFERENCE' ? 'active' : ''}" onclick="VisualReferenceCurationModule.setTypeFilter('COMPOSITION_REFERENCE')">
            <i data-lucide="layout"></i>
            <span>Composição</span>
            <strong>${countsByType['COMPOSITION_REFERENCE'] || 0}</strong>
          </div>
          <div class="type-chip cat-aesthetic ${currentTypeFilter === 'AESTHETIC_REFERENCE' ? 'active' : ''}" onclick="VisualReferenceCurationModule.setTypeFilter('AESTHETIC_REFERENCE')">
            <i data-lucide="sparkles"></i>
            <span>Estética</span>
            <strong>${countsByType['AESTHETIC_REFERENCE'] || 0}</strong>
          </div>
        </div>

        <!-- Filtros Secundários: Prioridade, Status e Busca -->
        <div class="vref-filter-controls">
          <div class="vref-filter-group">
            <label>Prioridade:</label>
            <select class="form-select select-xs" onchange="VisualReferenceCurationModule.setPriorityFilter(this.value)">
              <option value="ALL" ${currentPriorityFilter === 'ALL' ? 'selected' : ''}>Todas as Prioridades</option>
              <option value="PRIMARY" ${currentPriorityFilter === 'PRIMARY' ? 'selected' : ''}>PRIMARY (Diretiva)</option>
              <option value="SECONDARY" ${currentPriorityFilter === 'SECONDARY' ? 'selected' : ''}>SECONDARY (Apoio)</option>
              <option value="OPTIONAL" ${currentPriorityFilter === 'OPTIONAL' ? 'selected' : ''}>OPTIONAL (Opcional)</option>
              <option value="REJECTED" ${currentPriorityFilter === 'REJECTED' ? 'selected' : ''}>REJECTED (Rejeitadas)</option>
            </select>
          </div>

          <div class="vref-filter-group">
            <label>Status na Geração:</label>
            <select class="form-select select-xs" onchange="VisualReferenceCurationModule.setStatusFilter(this.value)">
              <option value="ALL" ${currentStatusFilter === 'ALL' ? 'selected' : ''}>Todas</option>
              <option value="INCLUDED" ${currentStatusFilter === 'INCLUDED' ? 'selected' : ''}>Ativas na Geração</option>
              <option value="EXCLUDED" ${currentStatusFilter === 'EXCLUDED' ? 'selected' : ''}>Excluídas da Geração</option>
            </select>
          </div>

          <div class="vref-search-wrap">
            <i data-lucide="search"></i>
            <input 
              type="text" 
              class="form-input input-xs" 
              placeholder="Buscar por título ou anotação..." 
              value="${escapeHTML(searchQuery)}" 
              oninput="VisualReferenceCurationModule.setSearchQuery(this.value)"
            >
          </div>
        </div>

        <!-- Grid de Cards de Curadoria -->
        <div class="vref-cards-grid">
          ${filteredItems.length > 0 ? filteredItems.map(item => renderCurationCard(item, env, project)).join('') : `
            <div class="vis-empty-box w-100">
              <i data-lucide="image-off"></i>
              <p>Nenhuma referência corresponde aos filtros selecionados.</p>
              <button class="btn btn-outline btn-xs" onclick="VisualReferenceCurationModule.resetFilters()">Redefinir Filtros</button>
            </div>
          `}
        </div>
      </div>
    `;
  }

  /**
   * Renderiza card individual de curadoria de referência
   */
  function renderCurationCard(item, env, project) {
    const isExcluded = item.isExcludedFromGeneration;
    const isCamera = item.referenceType === 'CAMERA_REFERENCE';

    const typeLabels = {
      'GEOMETRY_REFERENCE': { label: 'Geometria (Revit)', icon: 'box', class: 'type-geo' },
      'CAMERA_REFERENCE': { label: 'Câmera & Ângulo', icon: 'camera', class: 'type-cam' },
      'STYLE_REFERENCE': { label: 'Linguagem / Estilo', icon: 'compass', class: 'type-sty' },
      'MATERIAL_REFERENCE': { label: 'Textura & Material', icon: 'palette', class: 'type-mat' },
      'FURNITURE_REFERENCE': { label: 'Mobiliário & Peça', icon: 'armchair', class: 'type-fur' },
      'LIGHTING_REFERENCE': { label: 'Iluminação & Sanca', icon: 'sun', class: 'type-lit' },
      'COMPOSITION_REFERENCE': { label: 'Composição & Planos', icon: 'layout', class: 'type-com' },
      'AESTHETIC_REFERENCE': { label: 'Estética Geral', icon: 'sparkles', class: 'type-aes' }
    };

    const typeConfig = typeLabels[item.referenceType] || { label: item.referenceType, icon: 'image', class: 'type-sty' };

    const priorityClasses = {
      'PRIMARY': 'p-primary',
      'SECONDARY': 'p-secondary',
      'OPTIONAL': 'p-optional',
      'REJECTED': 'p-rejected'
    };

    return `
      <div class="vref-curated-card ${isExcluded ? 'is-excluded' : ''} ${item.priority === 'PRIMARY' ? 'is-primary' : ''}" id="vref-card-${item.id}">
        <!-- Mídia da Referência -->
        <div class="vref-card-media" onclick="EnvironmentVisualizationModule.openImageLightbox('${item.imageUrl}', '${escapeHTML(item.title)}')">
          <img src="${item.imageUrl}" alt="${escapeHTML(item.title)}" loading="lazy">
          
          <div class="vref-badges-overlay">
            <span class="vref-type-badge ${typeConfig.class}">
              <i data-lucide="${typeConfig.icon}"></i> ${typeConfig.label}
            </span>
            <span class="vref-priority-badge ${priorityClasses[item.priority] || 'p-secondary'}">
              ${item.priority}
            </span>
          </div>

          ${isExcluded ? `
            <div class="vref-excluded-banner">
              <i data-lucide="eye-off"></i>
              <span>EXCLUÍDA DA GERAÇÃO (ARQUIVO PRESERVADO)</span>
            </div>
          ` : ''}
        </div>

        <!-- Conteúdo do Card -->
        <div class="vref-card-content">
          <div class="vref-card-head">
            <h4 class="vref-title" title="${escapeHTML(item.title)}">${escapeHTML(item.title)}</h4>
            ${item.priority === 'PRIMARY' ? `
              <span class="vref-star-primary" title="Referência Primária Ativa"><i data-lucide="star"></i></span>
            ` : ''}
          </div>

          <!-- Controles de Classificação e Prioridade (Integridade) -->
          <div class="vref-controls-row">
            <div class="vref-control-field">
              <label>Tipo Canônico:</label>
              <select class="form-select select-xs" onchange="VisualReferenceCurationModule.handleTypeChange('${item.id}', this.value)">
                ${(StudioState.VISUAL_REFERENCE_TYPES || []).map(t => `
                  <option value="${t}" ${t === item.referenceType ? 'selected' : ''}>${t.replace('_REFERENCE', '')}</option>
                `).join('')}
              </select>
            </div>

            <div class="vref-control-field">
              <label>Prioridade:</label>
              <select class="form-select select-xs" onchange="VisualReferenceCurationModule.handlePriorityChange('${item.id}', this.value)">
                ${(StudioState.VISUAL_REFERENCE_PRIORITIES || []).map(p => `
                  <option value="${p}" ${p === item.priority ? 'selected' : ''}>${p}</option>
                `).join('')}
              </select>
            </div>
          </div>

          <!-- Metadados de Câmera (quando CAMERA_REFERENCE) -->
          ${isCamera ? `
            <div class="vref-camera-meta-box">
              <div class="meta-item"><small>Direção:</small> <strong>${escapeHTML(item.cameraDirection || 'Não informada')}</strong></div>
              <div class="meta-item"><small>Enquadramento:</small> <strong>${escapeHTML(item.cameraFraming || 'Padrão')}</strong></div>
              <div class="meta-item"><small>Origem:</small> <strong>${escapeHTML(item.cameraOrigin || 'REVIT')}</strong></div>
              <button class="btn btn-ghost btn-xxs" onclick="VisualReferenceCurationModule.openEditCameraModal('${item.id}')">
                <i data-lucide="edit-2"></i> Editar Câmera
              </button>
            </div>
          ` : ''}

          <!-- 8. Anotações de Escopo de Uso -->
          <div class="vref-scope-box">
            <span class="vref-scope-label"><i data-lucide="tag"></i> Escopo de Uso:</span>
            <p class="vref-scope-text">${escapeHTML(item.scopeNotes || 'Sem restrições de escopo cadastradas.')}</p>

            <!-- Chips de Anotações Rápidas -->
            <div class="vref-quick-notes">
              <button class="quick-note-chip" onclick="VisualReferenceCurationModule.setScopeNote('${item.id}', 'Use somente material.')">Use somente material</button>
              <button class="quick-note-chip" onclick="VisualReferenceCurationModule.setScopeNote('${item.id}', 'Use somente iluminação.')">Use somente iluminação</button>
              <button class="quick-note-chip" onclick="VisualReferenceCurationModule.setScopeNote('${item.id}', 'Não reproduzir mobiliário.')">Não reproduzir mobiliário</button>
              <button class="quick-note-chip" onclick="VisualReferenceCurationModule.setScopeNote('${item.id}', 'Usar composição.')">Usar composição</button>
            </div>
          </div>

          <!-- Sugestão da IA (Item 14 do Prompt) -->
          ${item.aiSuggestedCategory ? `
            <div class="vref-ai-suggestion-box">
              <i data-lucide="sparkles"></i>
              <div class="ai-suggestion-text">
                <small>IA sugere: <strong>${item.aiSuggestedCategory.replace('_REFERENCE', '')}</strong> (${Math.round((item.aiConfidence || 0.9) * 100)}% conf.)</small>
                ${item.aiSuggestedCategory !== item.referenceType ? `
                  <button class="btn-link-sm" onclick="VisualReferenceCurationModule.handleTypeChange('${item.id}', '${item.aiSuggestedCategory}')">Aceitar Sugestão</button>
                ` : `
                  <span class="ai-matched"><i data-lucide="check"></i> Validado</span>
                `}
              </div>
            </div>
          ` : `
            <button class="btn btn-ghost btn-xxs w-100 vref-btn-ai-suggest" onclick="VisualReferenceCurationModule.requestAISuggestion('${item.id}')">
              <i data-lucide="sparkles"></i> Sugerir Metadados com IA
            </button>
          `}

          <!-- Rodapé do Card: Ações de Curadoria Não Destrutivas -->
          <div class="vref-card-footer">
            ${item.priority !== 'PRIMARY' ? `
              <button class="btn btn-outline btn-xs" onclick="VisualReferenceCurationModule.setPrimary('${item.id}')" title="Marcar como Referência Primária (PRIMARY)">
                <i data-lucide="star"></i> Primária
              </button>
            ` : `
              <span class="vref-primary-badge-active"><i data-lucide="check"></i> Primária</span>
            `}

            <!-- Toggle de Exclusão da Geração (NÃO DESTRUTIVO) -->
            <button 
              class="btn ${isExcluded ? 'btn-success' : 'btn-outline-danger'} btn-xs" 
              onclick="VisualReferenceCurationModule.toggleExclusion('${item.id}', ${!isExcluded})"
              title="${isExcluded ? 'Reintegrar à geração da visualização' : 'Retirar da geração (o arquivo original permanece seguro)'}"
            >
              <i data-lucide="${isExcluded ? 'eye' : 'eye-off'}"></i>
              <span>${isExcluded ? 'Reintegrar' : 'Excluir da Geração'}</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================================================
  // HANDLERS E CONTROLE DE ESTADO
  // ============================================================================

  function setTypeFilter(type) {
    currentTypeFilter = type;
    refreshUI();
  }

  function setPriorityFilter(priority) {
    currentPriorityFilter = priority;
    refreshUI();
  }

  function setStatusFilter(status) {
    currentStatusFilter = status;
    refreshUI();
  }

  function setSearchQuery(q) {
    searchQuery = q;
    refreshUI();
  }

  function resetFilters() {
    currentTypeFilter = 'ALL';
    currentPriorityFilter = 'ALL';
    currentStatusFilter = 'ALL';
    searchQuery = '';
    refreshUI();
  }

  function handleTypeChange(itemId, newType) {
    try {
      StudioState.updateVisualReferenceItem(itemId, { referenceType: newType }, 'Arquiteto');
      StudioApp.showToast(`Categoria atualizada para ${newType.replace('_REFERENCE', '')} com registro de auditoria.`);
      refreshUI();
    } catch (e) {
      StudioApp.showToast(e.message, 'error');
    }
  }

  function handlePriorityChange(itemId, newPriority) {
    try {
      StudioState.updateVisualReferenceItem(itemId, { priority: newPriority }, 'Arquiteto');
      StudioApp.showToast(`Prioridade alterada para ${newPriority}.`);
      refreshUI();
    } catch (e) {
      StudioApp.showToast(e.message, 'error');
    }
  }

  function setScopeNote(itemId, note) {
    StudioState.updateVisualReferenceItem(itemId, { scopeNotes: note }, 'Arquiteto');
    StudioApp.showToast(`Escopo definido: "${note}"`);
    refreshUI();
  }

  function toggleExclusion(itemId, isExcluded) {
    const reason = isExcluded ? prompt('Motivo da exclusão da geração (o arquivo original permanecerá preservado):', 'Ajuste de curadoria visual') : '';
    StudioState.toggleVisualReferenceExclusion(itemId, isExcluded, reason || 'Curadoria');
    StudioApp.showToast(isExcluded ? 'Referência retirada da geração. Arquivo original mantido intacto.' : 'Referência reintegrada à geração.');
    refreshUI();
  }

  function setPrimary(itemId) {
    StudioState.setPrimaryVisualReference(itemId, 'Arquiteto');
    StudioApp.showToast('Referência definida como PRIMARY com sucesso!');
    refreshUI();
  }

  function requestAISuggestion(itemId) {
    const suggestion = StudioState.suggestReferenceMetadataAI(itemId);
    if (suggestion) {
      StudioApp.showToast(`IA detectou: ${suggestion.suggestedType.replace('_REFERENCE', '')} (${Math.round(suggestion.confidence * 100)}% de confiança).`);
      refreshUI();
    }
  }

  // ============================================================================
  // MODAIS (CONJUNTO, CONTEXTO IA, CÂMERA)
  // ============================================================================

  function openCreateSetModal(projectId, envId) {
    const setName = prompt('Nome do Novo Conjunto de Referências:', 'Curadoria de Imagens Alternativa V02');
    if (!setName) return;

    const objective = prompt('Objetivo do Conjunto:', 'Exploração de novas texturas e iluminação');
    StudioState.createVisualReferenceSet({
      projectId,
      environmentId: envId,
      name: setName,
      objective: objective || '',
      version: 'V02',
      priority: 'SECONDARY',
      isActive: true
    });

    StudioApp.showToast(`Conjunto "${setName}" criado e ativado com sucesso!`);
    refreshUI();
  }

  function openVisualContextModal(projectId, envId) {
    const context = StudioState.buildVisualContext(projectId, envId);
    let modal = document.getElementById('vref-context-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'vref-context-modal';
      modal.className = 'vis-lightbox-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="vis-compare-dialog" style="max-width: 850px;">
        <div class="vis-lightbox-header">
          <h3><i data-lucide="cpu"></i> Pacote Estruturado VISUAL_CONTEXT para IA (D02)</h3>
          <button class="btn-icon btn-ghost" onclick="VisualReferenceCurationModule.closeVisualContextModal()">
            <i data-lucide="x"></i>
          </button>
        </div>
        <div class="vref-context-body">
          <p class="context-lead">Estrutura canônica entregue para os futuros motores de renderização e IA (D03/D04). As referências estão distribuídas em seus 8 grupos normatizados:</p>
          
          <div class="context-stats-grid">
            <div class="stat-pill"><small>Geometria:</small> <strong>${context.geometry_references.length}</strong></div>
            <div class="stat-pill"><small>Câmeras:</small> <strong>${context.camera_references.length}</strong></div>
            <div class="stat-pill"><small>Estilo:</small> <strong>${context.style_references.length}</strong></div>
            <div class="stat-pill"><small>Materiais:</small> <strong>${context.material_references.length}</strong></div>
            <div class="stat-pill"><small>Mobiliário:</small> <strong>${context.furniture_references.length}</strong></div>
            <div class="stat-pill"><small>Iluminação:</small> <strong>${context.lighting_references.length}</strong></div>
            <div class="stat-pill"><small>Composição:</small> <strong>${context.composition_references.length}</strong></div>
            <div class="stat-pill"><small>Estética:</small> <strong>${context.aesthetic_references.length}</strong></div>
          </div>

          <pre class="vref-json-viewer">${escapeHTML(JSON.stringify(context, null, 2))}</pre>
        </div>
      </div>
    `;

    modal.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
  }

  function closeVisualContextModal() {
    const modal = document.getElementById('vref-context-modal');
    if (modal) modal.classList.remove('active');
  }

  function openEditCameraModal(itemId) {
    const item = (StudioState.data.visualReferenceItems || []).find(i => i.id === itemId);
    if (!item) return;

    const dir = prompt('Direção da Câmera (ex: Sul-Sudeste para deck):', item.cameraDirection || '');
    const framing = prompt('Enquadramento (ex: Grande Angular 24mm):', item.cameraFraming || '');
    const desc = prompt('Descrição do Enquadramento:', item.cameraDescription || '');

    StudioState.updateVisualReferenceItem(itemId, {
      cameraDirection: dir,
      cameraFraming: framing,
      cameraDescription: desc
    }, 'Arquiteto');

    StudioApp.showToast('Metadados de câmera atualizados com sucesso!');
    refreshUI();
  }

  function refreshUI() {
    const env = StudioState.getActiveEnvironment();
    const project = StudioState.getActiveProject();
    if (env && project) {
      const container = document.getElementById('env-tab-content');
      if (container && typeof EnvironmentVisualizationModule !== 'undefined') {
        container.innerHTML = EnvironmentVisualizationModule.render(env, project);
        if (window.lucide) window.lucide.createIcons();
      }
    }
  }

  return {
    render,
    setTypeFilter,
    setPriorityFilter,
    setStatusFilter,
    setSearchQuery,
    resetFilters,
    handleTypeChange,
    handlePriorityChange,
    setScopeNote,
    toggleExclusion,
    setPrimary,
    requestAISuggestion,
    openCreateSetModal,
    openVisualContextModal,
    closeVisualContextModal,
    openEditCameraModal
  };
})();

if (typeof window !== 'undefined') {
  window.VisualReferenceCurationModule = VisualReferenceCurationModule;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VisualReferenceCurationModule };
}
