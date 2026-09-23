/**
 * ============================================================================
 * ARQVERTICE STUDIO — D01: WORKSPACE DE VISUALIZAÇÃO DOS AMBIENTES
 * ============================================================================
 * Ponto central de visualização de cada ambiente a partir de referências e Revit.
 * Organiza: planta, perspectivas, vistas, referências, estilo, materiais,
 * mobiliário, câmeras, gerações, versões, aprovações, locks futuros e memória.
 */

const EnvironmentVisualizationModule = (function () {
  'use strict';

  // Sub-aba ativa interna do painel de visualização (padrão: todas as seções ou navegáveis)
  let activeSection = 'all'; // 'all' ou 'base', 'referencias', 'planta', 'perspectivas', 'cameras', 'renders', 'versoes', 'memoria'
  let selectedRenderForCompare1 = null;
  let selectedRenderForCompare2 = null;

  /**
   * Renderização principal do workspace de visualização do ambiente
   */
  function render(env, project) {
    if (!env || !project) {
      return `
        <div class="empty-state-card">
          <h3>Ambiente ou Projeto Inválido</h3>
          <p>Não foi possível carregar o workspace de visualização.</p>
        </div>
      `;
    }

    const visData = StudioState.getEnvironmentVisualization(project.id, env.id);
    const vis = visData.visualization;
    const isGenerating = vis.isGenerating || vis.status === 'GENERATING';

    return `
      <div class="vis-workspace-container" id="vis-workspace-${env.id}">
        <!-- 3. CABEÇALHO DA VISUALIZAÇÃO (8 ELEMENTOS OBRIGATÓRIOS) -->
        ${renderHeader(env, project, visData, isGenerating)}

        <!-- BARRA DE SEÇÕES / FILTRO VISUAL -->
        ${renderSectionNav(activeSection)}

        <!-- PAINEL PRINCIPAL COM AS 8 SEÇÕES OBRIGATÓRIAS -->
        <div class="vis-main-panel">
          <!-- 1. BASE DO AMBIENTE -->
          ${(activeSection === 'all' || activeSection === 'base') ? renderBaseSection(visData) : ''}

          <!-- 2. REFERÊNCIAS (PRIMARY PRIMEIRO, CATEGORIZADAS / D02 CURADORIA) -->
          ${(activeSection === 'all' || activeSection === 'referencias') ? renderReferencesSection(visData, env, project) : ''}

          <!-- 3. PLANTA HUMANIZADA (D03 MOTOR DE PLANTA HUMANIZADA) -->
          ${(activeSection === 'all' || activeSection === 'planta') ? renderPlantaSection(visData, env, project) : ''}

          <!-- 4. PERSPECTIVAS DO REVIT & MOTOR HUMANIZADO (D04) -->
          ${(activeSection === 'all' || activeSection === 'perspectivas') ? renderPerspectivasSection(visData, env, project) : ''}

          <!-- 5. CÂMERAS & SISTEMA DE ENQUADRAMENTOS (D05) -->
          ${(activeSection === 'all' || activeSection === 'cameras') ? renderCamerasSection(visData, env, project) : ''}

          <!-- 6. RENDERS E GERAÇÕES (D06) -->
          ${(activeSection === 'all' || activeSection === 'renders') ? renderRendersSection(visData, isGenerating, env, project) : ''}

          <!-- 7. VERSÕES DO AMBIENTE (D08) -->
          ${(activeSection === 'all' || activeSection === 'versoes') ? renderVersoesSection(visData, env, project) : ''}

          <!-- 8. CONTEXTO VISUAL, MEMÓRIA E LOCKS (D07) -->
          ${(activeSection === 'all' || activeSection === 'memoria') ? renderMemoriaVisualSection(visData, env, project) : ''}
        </div>
      </div>
    `;
  }

  /**
   * 3. CABEÇALHO DO WORKSPACE
   * Exibe: nome do projeto, nome do ambiente, área, versão, status, última atualização,
   * referência principal, render aprovado quando existir.
   */
  function renderHeader(env, project, visData, isGenerating) {
    const vis = visData.visualization;
    const primaryRef = visData.primaryReference;
    const approvedRender = visData.approvedRender;

    const statusLabels = {
      'NOT_STARTED': { label: 'Não Iniciado', class: 'badge-vis-not-started' },
      'PREPARING': { label: 'Em Preparação', class: 'badge-vis-preparing' },
      'READY': { label: 'Pronto para Geração', class: 'badge-vis-ready' },
      'GENERATING': { label: 'Gerando...', class: 'badge-vis-generating' },
      'IN_REVIEW': { label: 'Em Revisão', class: 'badge-vis-review' },
      'APPROVED': { label: 'Aprovado', class: 'badge-vis-approved' },
      'SUPERSEDED': { label: 'Substituído', class: 'badge-vis-superseded' }
    };

    const statusConfig = statusLabels[vis.status] || { label: vis.status, class: 'badge-vis-preparing' };

    return `
      <header class="vis-header-card">
        <div class="vis-header-top">
          <!-- Identificação e Navegação -->
          <div class="vis-header-identity">
            <div class="vis-breadcrumbs-mini">
              <span class="vis-proj-link" onclick="StudioApp.navigateTo('workspace', '${project.id}', 'ambientes')">
                <i data-lucide="folder"></i> ${escapeHTML(project.name)}
              </span>
              <span class="sep">/</span>
              <span class="vis-env-name">${escapeHTML(env.name)}</span>
              <span class="sep">/</span>
              <span class="vis-current-crumb">Visualização</span>
            </div>
            <h1 class="vis-title">${escapeHTML(env.name)} — Visualização 3D</h1>
            
            <div class="vis-header-badges">
              <span class="vis-pill"><i data-lucide="maximize-2"></i> ${env.areaM2 ? parseFloat(env.areaM2).toFixed(2) + ' m²' : '—'}</span>
              <span class="vis-pill"><i data-lucide="layers"></i> ${escapeHTML(env.floorLevel || 'Térreo')}</span>
              <span class="vis-pill"><i data-lucide="git-branch"></i> Versão: <strong>${escapeHTML(vis.activeVersion || env.currentVersion || 'V01')}</strong></span>
              <span class="vis-pill"><i data-lucide="clock"></i> Atualizado: ${formatRelativeDate(vis.updatedAt || env.updatedAt)}</span>
            </div>
          </div>

          <!-- Status e Controles Rápidos -->
          <div class="vis-header-controls">
            <!-- 8. STATUS DO AMBIENTE (7 Estados) -->
            <div class="vis-status-box">
              <label class="vis-field-label">Status da Visualização:</label>
              <div class="vis-status-selector">
                <span class="vis-status-badge ${statusConfig.class} ${isGenerating ? 'pulsing-indicator' : ''}">
                  <span class="status-dot"></span>
                  <span>${statusConfig.label}</span>
                </span>
                <select class="form-select select-xs" onchange="EnvironmentVisualizationModule.handleStatusChange('${env.id}', this.value)" ${isGenerating ? 'disabled' : ''}>
                  ${(StudioState.ENVIRONMENT_VISUALIZATION_STATUSES || [
                    'NOT_STARTED', 'PREPARING', 'READY', 'GENERATING', 'IN_REVIEW', 'APPROVED', 'SUPERSEDED'
                  ]).map(s => `
                    <option value="${s}" ${s === vis.status ? 'selected' : ''}>${s}</option>
                  `).join('')}
                </select>
              </div>
            </div>

            <!-- Botão de Ação de Geração com Proteção Anti-Clique Múltiplo -->
            <div class="vis-action-buttons">
              <button 
                class="btn btn-primary ${isGenerating ? 'btn-generating' : ''}" 
                id="btn-generate-vis-${env.id}"
                onclick="EnvironmentVisualizationModule.handleTriggerGeneration('${env.id}')"
                ${isGenerating ? 'disabled title="Geração em andamento. Aguarde..."' : 'title="Simular processamento visual de perspectivas e renders"'}
              >
                ${isGenerating ? `
                  <i data-lucide="loader" class="spin-icon"></i>
                  <span>Processando Render...</span>
                ` : `
                  <i data-lucide="sparkles"></i>
                  <span>Gerar Visualização</span>
                `}
              </button>

              <button class="btn btn-outline btn-sm" onclick="EnvironmentVisualizationModule.openCompareModal('${env.id}')" title="Comparar Versões e Renders">
                <i data-lucide="columns"></i>
                <span>Comparar</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Barra Inferior do Header: Referência Principal e Render Aprovado -->
        <div class="vis-header-spotlight-row">
          <!-- Referência Principal -->
          <div class="vis-spotlight-item primary-ref-card">
            <span class="spotlight-tag"><i data-lucide="star"></i> Referência Principal (PRIMARY)</span>
            ${primaryRef ? `
              <div class="spotlight-content" onclick="EnvironmentVisualizationModule.openImageLightbox('${primaryRef.url}', '${escapeHTML(primaryRef.title)}')">
                <img src="${primaryRef.url}" alt="${escapeHTML(primaryRef.title)}" class="spotlight-thumb">
                <div class="spotlight-info">
                  <strong>${escapeHTML(primaryRef.title)}</strong>
                  <span class="badge-cat">${escapeHTML(primaryRef.category || 'ESTILO')}</span>
                </div>
              </div>
            ` : `
              <div class="spotlight-empty">
                <i data-lucide="image"></i>
                <span>Nenhuma referência marcada como PRIMARY</span>
              </div>
            `}
          </div>

          <!-- Render Aprovado Quando Existir -->
          <div class="vis-spotlight-item approved-render-card">
            <span class="spotlight-tag"><i data-lucide="check-circle-2"></i> Render Aprovado do Ambiente</span>
            ${approvedRender ? `
              <div class="spotlight-content approved" onclick="EnvironmentVisualizationModule.openImageLightbox('${approvedRender.imageUrl}', 'Render Aprovado ${approvedRender.version}')">
                <img src="${approvedRender.imageUrl}" alt="Render Aprovado" class="spotlight-thumb">
                <div class="spotlight-info">
                  <strong>${escapeHTML(approvedRender.version)} — ${escapeHTML(approvedRender.viewType || 'Perspectiva')}</strong>
                  <span class="badge-approved">Aprovado por: ${escapeHTML(approvedRender.approvedBy || 'Cliente')}</span>
                </div>
              </div>
            ` : `
              <div class="spotlight-empty">
                <i data-lucide="sparkles"></i>
                <span>Nenhum render aprovado ainda. Em fase de estudos.</span>
              </div>
            `}
          </div>
        </div>

        <!-- 9. ESTADO DE GERAÇÃO: Banner de Operação Ativa -->
        ${isGenerating ? `
          <div class="vis-generating-banner">
            <div class="generating-spinner"></div>
            <div class="generating-text">
              <strong>OPERANDO GERAÇÃO DE VISUALIZAÇÃO EM ANDAMENTO</strong>
              <span>Processando perspectivas do Revit, aplicando paleta de materiais e ajustando iluminação. Novas requisições bloqueadas.</span>
            </div>
          </div>
        ` : ''}
      </header>
    `;
  }

  /**
   * Navegação rápida entre as 8 seções
   */
  function renderSectionNav(active) {
    const sections = [
      { key: 'all', label: 'Visão Completa', icon: 'grid' },
      { key: 'base', label: 'Base do Ambiente', icon: 'box' },
      { key: 'referencias', label: 'Referências', icon: 'image' },
      { key: 'planta', label: 'Planta Humanizada', icon: 'map' },
      { key: 'perspectivas', label: 'Perspectivas', icon: 'eye' },
      { key: 'cameras', label: 'Câmeras', icon: 'camera' },
      { key: 'renders', label: 'Renders', icon: 'sparkles' },
      { key: 'versoes', label: 'Versões', icon: 'history' },
      { key: 'memoria', label: 'Memória Visual', icon: 'cpu' }
    ];

    return `
      <div class="vis-subnav-bar">
        <div class="vis-subnav-track">
          ${sections.map(s => `
            <button 
              class="vis-subnav-btn ${active === s.key ? 'active' : ''}" 
              onclick="EnvironmentVisualizationModule.setActiveSection('${s.key}')"
            >
              <i data-lucide="${s.icon}"></i>
              <span>${s.label}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * 5. BASE DO AMBIENTE
   * Mostrar: planta principal, perspectivas principais, arquivos do Revit,
   * referências aprovadas, conceito, diretrizes, restrições.
   */
  function renderBaseSection(visData) {
    const base = visData.base;
    const revitFiles = base.revitFiles || [];
    const floorPlan = base.floorPlan;
    const perspectives = base.perspectives || [];

    return `
      <section class="vis-panel-section" id="vis-section-base">
        <div class="vis-section-header">
          <div class="vis-sec-title">
            <i data-lucide="layers"></i>
            <h2>1. Base do Ambiente</h2>
          </div>
          <span class="vis-sec-tag">Revit & Levantamento</span>
        </div>

        <div class="vis-base-grid">
          <!-- Coluna 1: Planta Principal & Arquivos Revit -->
          <div class="vis-card-block">
            <h3><i data-lucide="map"></i> Planta Técnica Oficial (Revit)</h3>
            ${floorPlan && floorPlan.status !== 'UNKNOWN' ? `
              <div class="vis-media-preview-card" onclick="EnvironmentVisualizationModule.openImageLightbox('${floorPlan.url || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'}', '${escapeHTML(floorPlan.title || 'Planta Baixa')}')">
                <img src="${floorPlan.url || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'}" alt="Planta Principal">
                <div class="preview-overlay-info">
                  <strong>${escapeHTML(floorPlan.title || 'Planta Baixa Térreo')}</strong>
                  <span>Escala: ${escapeHTML(floorPlan.scale || '1:50')} | Versão: ${escapeHTML(floorPlan.version || 'V01')}</span>
                </div>
              </div>
            ` : `
              <div class="vis-empty-box">
                <i data-lucide="alert-circle"></i>
                <p>Nenhuma planta baixa técnica confirmada no levantamento.</p>
                <span class="badge-warning-custom">STATUS: UNKNOWN</span>
              </div>
            `}

            <!-- Arquivos do Revit Vinculados -->
            <div class="vis-revit-files-list">
              <h4><i data-lucide="file-code"></i> Arquivos do Modelo Revit</h4>
              ${revitFiles.length > 0 ? `
                <div class="revit-chips">
                  ${revitFiles.map(rf => `
                    <div class="revit-chip" title="Caminho: ${escapeHTML(rf.filePath || '')}">
                      <i data-lucide="box"></i>
                      <div class="revit-chip-info">
                        <strong>${escapeHTML(rf.title || rf.fileName)}</strong>
                        <small>${escapeHTML(rf.fileFormat || 'RVT')} • Versão ${escapeHTML(rf.version || 'V01')}</small>
                      </div>
                    </div>
                  `).join('')}
                </div>
              ` : `
                <div class="vis-empty-hint">Nenhum arquivo .rvt exportado vinculado a este ambiente.</div>
              `}
            </div>
          </div>

          <!-- Coluna 2: Perspectivas Principais do Revit -->
          <div class="vis-card-block">
            <h3><i data-lucide="box"></i> Perspectivas Principais (Vistas 3D Revit)</h3>
            ${perspectives.length > 0 ? `
              <div class="vis-perspectives-mini-grid">
                ${perspectives.slice(0, 2).map(p => `
                  <div class="vis-media-preview-card" onclick="EnvironmentVisualizationModule.openImageLightbox('${p.url || 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80'}', '${escapeHTML(p.title)}')">
                    <img src="${p.url || 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80'}" alt="${escapeHTML(p.title)}">
                    <div class="preview-overlay-info">
                      <strong>${escapeHTML(p.title)}</strong>
                      <span>Câmera: ${escapeHTML(p.camera || 'Geral')}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="vis-empty-box">
                <i data-lucide="image"></i>
                <p>Nenhuma perspectiva de modelo exportada do Revit cadastrada.</p>
              </div>
            `}
          </div>

          <!-- Coluna 3: Conceito, Diretrizes e Restrições Consolidadas -->
          <div class="vis-card-block">
            <h3><i data-lucide="compass"></i> Diretrizes & Restrições (C04/C06)</h3>
            <div class="vis-guidelines-box">
              <div class="guideline-item">
                <span class="label">Conceito Geral:</span>
                <p>${escapeHTML(base.conceptSummary?.name || 'Linguagem Arquitetônica Contemporânea')}</p>
                <small>${escapeHTML(base.conceptSummary?.atmosphere || 'Atmosfera acolhedora e integrada')}</small>
              </div>

              <div class="guideline-item">
                <span class="label">Diretrizes Vigentes:</span>
                <ul class="bullet-list-sm">
                  ${(base.guidelines || []).slice(0, 3).map(g => `<li>${escapeHTML(g)}</li>`).join('')}
                </ul>
              </div>

              <div class="guideline-item restrictions">
                <span class="label text-danger">Restrições Não Negociáveis:</span>
                <ul class="bullet-list-sm text-danger">
                  ${(base.restrictions || []).slice(0, 3).map(r => `<li>${escapeHTML(r)}</li>`).join('')}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  /**
   * 7. REFERÊNCIAS PRINCIPAIS
   * Mostrar PRIMARY primeiro, depois SECONDARY.
   * Não misturar categorias sem indicar: Arquitetura, Material, Mobiliário.
   */
  function renderReferencesSection(visData, env, project) {
    if (typeof VisualReferenceCurationModule !== 'undefined' && env && project) {
      return `
        <section class="vis-panel-section" id="vis-section-referencias">
          <div class="vis-section-header">
            <div class="vis-sec-title">
              <i data-lucide="layers"></i>
              <h2>2. Curadoria e Pipeline de Referências Visuais (D02)</h2>
            </div>
            <div class="vis-sec-badges">
              <span class="badge-curation-ready"><i data-lucide="check-check"></i> Pipeline D02 Ativo</span>
            </div>
          </div>
          ${VisualReferenceCurationModule.render(env, project)}
        </section>
      `;
    }

    const references = visData.references || [];
    const primaryRefs = references.filter(r => r.priority === 'PRIMARY');
    const secondaryRefs = references.filter(r => r.priority !== 'PRIMARY');

    return `
      <section class="vis-panel-section" id="vis-section-referencias">
        <div class="vis-section-header">
          <div class="vis-sec-title">
            <i data-lucide="image"></i>
            <h2>2. Referências Homologadas</h2>
          </div>
          <div class="vis-sec-badges">
            <span class="badge-primary-ref">${primaryRefs.length} Primárias (PRIMARY)</span>
            <span class="badge-secondary-ref">${secondaryRefs.length} Secundárias</span>
          </div>
        </div>

        <!-- Grupo PRIMARY (Prioridade Máxima de Referência) -->
        <div class="vis-ref-group">
          <div class="vis-group-title primary">
            <i data-lucide="star"></i>
            <span>REFERÊNCIAS PRIMÁRIAS (PRIMARY) — Prioridade Diretiva na Renderização</span>
          </div>
          ${primaryRefs.length > 0 ? `
            <div class="vis-ref-cards-grid">
              ${primaryRefs.map(ref => renderRefCard(ref)).join('')}
            </div>
          ` : `
            <div class="vis-empty-hint">Nenhuma referência classificada como PRIMARY. Adicione no Levantamento (C02).</div>
          `}
        </div>

        <!-- Grupo SECONDARY (Complementares) -->
        <div class="vis-ref-group" style="margin-top: 24px;">
          <div class="vis-group-title secondary">
            <i data-lucide="check-square"></i>
            <span>REFERÊNCIAS SECUNDÁRIAS (SECONDARY) — Apoio e Composição</span>
          </div>
          ${secondaryRefs.length > 0 ? `
            <div class="vis-ref-cards-grid">
              ${secondaryRefs.map(ref => renderRefCard(ref)).join('')}
            </div>
          ` : `
            <div class="vis-empty-hint">Nenhuma referência secundária cadastrada.</div>
          `}
        </div>
      </section>
    `;
  }

  /**
   * Renderiza card individual de referência com categoria explícita
   */
  function renderRefCard(ref) {
    const categoryIcons = {
      'ARQUITETURA': 'home',
      'ESTILO': 'compass',
      'MATERIAL': 'palette',
      'MOBILIARIO': 'armchair',
      'ILUMINACAO': 'sun'
    };
    const cat = (ref.category || 'ARQUITETURA').toUpperCase();
    const icon = categoryIcons[cat] || 'image';

    return `
      <div class="vis-ref-card ${ref.priority === 'PRIMARY' ? 'is-primary' : ''}">
        <div class="vis-ref-media" onclick="EnvironmentVisualizationModule.openImageLightbox('${ref.url}', '${escapeHTML(ref.title)}')">
          <img src="${ref.url}" alt="${escapeHTML(ref.title)}" loading="lazy">
          <div class="ref-badges-overlay">
            <span class="badge-category cat-${cat.toLowerCase()}">
              <i data-lucide="${icon}"></i> ${cat}
            </span>
            <span class="badge-priority ${ref.priority === 'PRIMARY' ? 'p-primary' : 'p-secondary'}">
              ${ref.priority || 'SECONDARY'}
            </span>
          </div>
        </div>
        <div class="vis-ref-details">
          <h4 class="vis-ref-title" title="${escapeHTML(ref.title)}">${escapeHTML(ref.title)}</h4>
          <p class="vis-ref-desc">${escapeHTML(ref.description || 'Sem descrição cadastrada')}</p>
        </div>
      </div>
    `;
  }

  /**
   * 4. PLANTA HUMANIZADA
   * Visualização da planta humanizada com escala, mobília layoutada e cotas de circulação.
   */
  function renderPlantaSection(visData, env, project) {
    if (typeof HumanizedPlanModule !== 'undefined' && env && project) {
      return `
        <section class="vis-panel-section" id="vis-section-planta">
          <div class="vis-section-header">
            <div class="vis-sec-title">
              <i data-lucide="map"></i>
              <h2>3. Planta Humanizada de Apresentação (D03)</h2>
            </div>
            <span class="badge-curation-ready"><i data-lucide="sparkles"></i> Motor D03 Ativo</span>
          </div>
          ${HumanizedPlanModule.render(env, project)}
        </section>
      `;
    }

    const floorPlan = visData.base.floorPlan;
    const humanized = visData.visualization.humanizedFloorPlan || {
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      version: 'V01',
      status: 'PREPARADA',
      title: 'Planta Humanizada Renderizada — Layout & Acabamentos'
    };

    return `
      <section class="vis-panel-section" id="vis-section-planta">
        <div class="vis-section-header">
          <div class="vis-sec-title">
            <i data-lucide="map"></i>
            <h2>3. Planta Humanizada</h2>
          </div>
          <span class="vis-sec-tag">Apresentação ao Cliente</span>
        </div>

        <div class="vis-planta-layout">
          <div class="vis-planta-hero">
            <div class="hero-image-wrap" onclick="EnvironmentVisualizationModule.openImageLightbox('${humanized.url}', '${escapeHTML(humanized.title)}')">
              <img src="${humanized.url}" alt="Planta Humanizada">
              <div class="hero-badge-overlay">
                <span><i data-lucide="layers"></i> Versão: ${escapeHTML(humanized.version)}</span>
                <span><i data-lucide="check"></i> Status: ${escapeHTML(humanized.status)}</span>
              </div>
            </div>
          </div>

          <div class="vis-planta-meta-card">
            <h3><i data-lucide="info"></i> Especificações da Planta</h3>
            <div class="meta-data-list">
              <div class="meta-row">
                <span class="k">Fonte Técnica:</span>
                <span class="v">${escapeHTML(floorPlan ? floorPlan.title : 'Modelo Revit Oficial')}</span>
              </div>
              <div class="meta-row">
                <span class="k">Escala Nominal:</span>
                <span class="v">${escapeHTML(floorPlan ? floorPlan.scale : '1:50')}</span>
              </div>
              <div class="meta-row">
                <span class="k">Orientação Solar:</span>
                <span class="v">${escapeHTML(floorPlan ? floorPlan.orientation : 'Norte Verdadeiro')}</span>
              </div>
              <div class="meta-row">
                <span class="k">Mobiliário Definido:</span>
                <span class="v">Integrado conforme Memorial C04</span>
              </div>
            </div>

            <div class="planta-actions-group">
              <button class="btn btn-outline btn-sm w-100" onclick="EnvironmentVisualizationModule.openImageLightbox('${humanized.url}', 'Planta Humanizada em Alta Resolução')">
                <i data-lucide="maximize"></i> Visualizar em Tela Cheia
              </button>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  /**
   * 4. PERSPECTIVAS DO REVIT & HUMANIZADAS (D04)
   */
  function renderPerspectivasSection(visData, env, project) {
    if (typeof HumanizedPerspectiveModule !== 'undefined' && env && project) {
      return `
        <section class="vis-panel-section" id="vis-section-perspectivas">
          <div class="vis-section-header">
            <div class="vis-sec-title">
              <i data-lucide="camera"></i>
              <h2>4. Perspectivas Humanizadas de Apresentação (D04)</h2>
            </div>
            <span class="badge-curation-ready"><i data-lucide="sparkles"></i> Motor D04 Ativo</span>
          </div>
          ${HumanizedPerspectiveModule.render(env, project)}
        </section>
      `;
    }

    const perspectives = visData.base.perspectives || [];

    return `
      <section class="vis-panel-section" id="vis-section-perspectivas">
        <div class="vis-section-header">
          <div class="vis-sec-title">
            <i data-lucide="eye"></i>
            <h2>4. Perspectivas Oficiais do Revit</h2>
          </div>
          <span class="vis-sec-tag">${perspectives.length} Vistas 3D</span>
        </div>

        ${perspectives.length > 0 ? `
          <div class="vis-perspectives-grid">
            ${perspectives.map(p => `
              <div class="vis-persp-card">
                <div class="vis-persp-media" onclick="EnvironmentVisualizationModule.openImageLightbox('${p.url}', '${escapeHTML(p.title)}')">
                  <img src="${p.url}" alt="${escapeHTML(p.title)}">
                  <div class="persp-overlay">
                    <span class="cam-tag"><i data-lucide="camera"></i> ${escapeHTML(p.camera || 'Câmera')}</span>
                  </div>
                </div>
                <div class="vis-persp-info">
                  <h4>${escapeHTML(p.title)}</h4>
                  <div class="persp-meta">
                    <span>Fase: ${escapeHTML(p.phase || 'Construção')}</span>
                    <span class="badge-approved-sm">Aprovada</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="vis-empty-box">
            <i data-lucide="camera-off"></i>
            <p>Nenhuma perspectiva Revit vinculada a este ambiente.</p>
          </div>
        `}
      </section>
    `;
  }

  /**
   * 5. CÂMERAS & ENQUADRAMENTOS (D05)
   */
  function renderCamerasSection(visData, env, project) {
    if (typeof CameraSystemModule !== 'undefined' && env && project) {
      return `
        <section class="vis-panel-section" id="vis-section-cameras">
          <div class="vis-section-header">
            <div class="vis-sec-title">
              <i data-lucide="video"></i>
              <h2>5. Sistema de Câmeras & Enquadramentos (D05)</h2>
            </div>
            <span class="badge-curation-ready"><i data-lucide="sparkles"></i> Módulo D05 Ativo</span>
          </div>
          ${CameraSystemModule.render(env, project)}
        </section>
      `;
    }

    const cameras = visData.cameras || [];
    const envId = visData.visualization.environmentId;

    return `
      <section class="vis-panel-section" id="vis-section-cameras">
        <div class="vis-section-header">
          <div class="vis-sec-title">
            <i data-lucide="camera"></i>
            <h2>5. Câmeras & Enquadramentos</h2>
          </div>
          <button class="btn btn-outline btn-sm" onclick="EnvironmentVisualizationModule.openAddCameraModal('${envId}')">
            <i data-lucide="plus"></i>
            <span>Nova Câmera</span>
          </button>
        </div>

        ${cameras.length > 0 ? `
          <div class="vis-cameras-grid">
            ${cameras.map(cam => `
              <div class="vis-camera-card ${cam.isApproved ? 'is-approved' : ''}">
                <div class="cam-card-top">
                  <div class="cam-name">
                    <i data-lucide="video"></i>
                    <strong>${escapeHTML(cam.cameraName)}</strong>
                  </div>
                  <span class="cam-status-pill ${cam.isApproved ? 'approved' : 'draft'}">
                    ${cam.isApproved ? 'Aprovada' : 'Rascunho'}
                  </span>
                </div>
                
                <div class="cam-specs-table">
                  <div class="cam-spec-row">
                    <span>Dist. Focal:</span>
                    <strong>${cam.focalLengthMm || 24} mm</strong>
                  </div>
                  <div class="cam-spec-row">
                    <span>Altura do Olho:</span>
                    <strong>${cam.eyeHeightM || 1.55} m</strong>
                  </div>
                  <div class="cam-spec-row">
                    <span>Altura do Alvo:</span>
                    <strong>${cam.targetHeightM || 1.20} m</strong>
                  </div>
                  <div class="cam-spec-row">
                    <span>Proporção:</span>
                    <strong>${escapeHTML(cam.aspectRatio || '16:9')}</strong>
                  </div>
                </div>

                <div class="cam-notes">
                  <small>${escapeHTML(cam.notes || 'Enquadramento principal do ambiente.')}</small>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="vis-empty-box">
            <i data-lucide="camera"></i>
            <p>Nenhuma câmera configurada. Adicione as câmeras do Revit ou referências de enquadramento.</p>
          </div>
        `}
      </section>
    `;
  }

  /**
   * 6. RENDERS E GERAÇÕES (D06 MOTOR DE GERAÇÃO DE RENDERS)
   */
  function renderRendersSection(visData, isGenerating, env, project) {
    if (typeof RenderEngineModule !== 'undefined' && RenderEngineModule && typeof RenderEngineModule.render === 'function') {
      const activeEnv = env || (StudioState.getEnvironment ? StudioState.getEnvironment(visData.projectId, visData.environmentId) : { id: visData.environmentId, name: 'Ambiente' });
      const activeProj = project || (StudioState.getProject ? StudioState.getProject(visData.projectId) : { id: visData.projectId, name: 'Projeto' });
      return RenderEngineModule.render(visData, activeEnv, activeProj);
    }

    const renders = visData.renders || [];
    const envId = visData.visualization.environmentId;

    return `
      <section class="vis-panel-section" id="vis-section-renders">
        <div class="vis-section-header">
          <div class="vis-sec-title">
            <i data-lucide="sparkles"></i>
            <h2>6. Renders & Gerações Visuais</h2>
          </div>
          <span class="vis-sec-tag">${renders.length} Renders Gerados</span>
        </div>

        ${renders.length > 0 ? `
          <div class="vis-renders-gallery">
            ${renders.map(r => `
              <div class="vis-render-card ${r.status === 'APPROVED' ? 'is-approved-render' : ''}" id="render-card-${r.id}">
                <div class="vis-render-media" onclick="EnvironmentVisualizationModule.openImageLightbox('${r.imageUrl}', '${escapeHTML(r.version)} — ${escapeHTML(r.viewType || 'Render')}')">
                  <img src="${r.imageUrl}" alt="${escapeHTML(r.version)}" loading="lazy">
                  <div class="render-overlay-tags">
                    <span class="badge-ver">${escapeHTML(r.version)}</span>
                    <span class="badge-status-${(r.status || 'DRAFT').toLowerCase()}">${escapeHTML(r.status)}</span>
                  </div>
                </div>

                <div class="vis-render-body">
                  <div class="render-title-row">
                    <strong>${escapeHTML(r.viewType || 'Perspectiva Principal')}</strong>
                    <small>${formatRelativeDate(r.createdAt)}</small>
                  </div>

                  <div class="render-engine-row">
                    <span>Motor: <strong>${escapeHTML(r.renderEngine || 'Enscape / V-Ray')}</strong></span>
                    <span>Res: <strong>${escapeHTML(r.resolution || '4K UHD')}</strong></span>
                  </div>

                  <!-- Botões de Ação do Render -->
                  <div class="render-card-actions">
                    ${r.status === 'APPROVED' ? `
                      <span class="btn-approved-stamp"><i data-lucide="check-circle-2"></i> Render Aprovado</span>
                    ` : `
                      <button class="btn btn-outline btn-xs" onclick="EnvironmentVisualizationModule.approveRender('${envId}', '${r.id}')" title="Aprovar este render como a imagem oficial do ambiente">
                        <i data-lucide="check"></i> Aprovar
                      </button>
                    `}
                    <button class="btn btn-ghost btn-xs" onclick="EnvironmentVisualizationModule.selectForCompare('${r.id}')" title="Selecionar para Comparação Lado a Lado">
                      <i data-lucide="columns"></i> Comparar
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="vis-empty-box">
            <i data-lucide="image"></i>
            <p>Nenhum render cadastrado ainda. Clique em "Gerar Visualização" para iniciar o processamento.</p>
          </div>
        `}
      </section>
    `;
  }

  /**
   * 7. VERSÕES DO AMBIENTE (D08)
   */
  function renderVersoesSection(visData, env, project) {
    if (typeof VisualVersioningModule !== 'undefined' && VisualVersioningModule && typeof VisualVersioningModule.render === 'function') {
      const activeEnv = env || (StudioState.getEnvironment ? StudioState.getEnvironment(visData.projectId, visData.environmentId) : { id: visData.environmentId, name: 'Ambiente' });
      const activeProj = project || (StudioState.getProject ? StudioState.getProject(visData.projectId) : { id: visData.projectId, name: 'Projeto' });
      return VisualVersioningModule.render(visData, activeEnv, activeProj);
    }

    const versions = visData.versions || [];
    const activeVer = visData.visualization.activeVersion || 'V01';

    return `
      <section class="vis-panel-section" id="vis-section-versoes">
        <div class="vis-section-header">
          <div class="vis-sec-title">
            <i data-lucide="history"></i>
            <h2>7. Histórico de Versões do Ambiente</h2>
          </div>
          <span class="vis-sec-tag">Versão Ativa: <strong>${escapeHTML(activeVer)}</strong></span>
        </div>

        <div class="vis-timeline-versions">
          ${versions.map(v => `
            <div class="timeline-ver-item ${v.version === activeVer ? 'active-version' : ''}">
              <div class="timeline-marker">
                <span class="dot"></span>
              </div>
              <div class="timeline-content">
                <div class="ver-header">
                  <strong>${escapeHTML(v.version)}</strong>
                  <span class="ver-status-pill ${v.status === 'Aprovado' ? 'approved' : ''}">${escapeHTML(v.status || 'Em Revisão')}</span>
                  <small class="ver-date">${formatRelativeDate(v.createdAt)}</small>
                </div>
                <p class="ver-notes">${escapeHTML(v.notes || 'Revisão geral de volumetria e materiais.')}</p>
                ${v.version !== activeVer ? `
                  <button class="btn btn-outline btn-xs" onclick="EnvironmentVisualizationModule.changeActiveVersion('${visData.visualization.environmentId}', '${v.version}')">
                    Definir como Ativa
                  </button>
                ` : `
                  <span class="active-badge"><i data-lucide="check"></i> Versão Ativa no Workspace</span>
                `}
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  }

  /**
   * 6 & 8. CONTEXTO VISUAL, MEMÓRIA E LOCKS (D07)
   */
  function renderMemoriaVisualSection(visData, env, project) {
    if (typeof VisualLocksModule !== 'undefined' && VisualLocksModule && typeof VisualLocksModule.render === 'function') {
      const activeEnv = env || (StudioState.getEnvironment ? StudioState.getEnvironment(visData.projectId, visData.environmentId) : { id: visData.environmentId, name: 'Ambiente' });
      const activeProj = project || (StudioState.getProject ? StudioState.getProject(visData.projectId) : { id: visData.projectId, name: 'Projeto' });
      return VisualLocksModule.render(visData, activeEnv, activeProj);
    }

    const ctx = visData.visualContext || {};

    return `
      <section class="vis-panel-section" id="vis-section-memoria">
        <div class="vis-section-header">
          <div class="vis-sec-title">
            <i data-lucide="cpu"></i>
            <h2>8. Contexto Visual & Memória do Ambiente</h2>
          </div>
          <span class="vis-sec-tag">Diretrizes Antialucinação</span>
        </div>

        <div class="vis-memory-grid">
          <!-- Estilo -->
          <div class="mem-item-card">
            <div class="mem-card-head">
              <i data-lucide="compass"></i>
              <strong>ESTILO</strong>
            </div>
            <p>${escapeHTML(ctx.estilo || 'Não informado')}</p>
          </div>

          <!-- Paleta de Cores -->
          <div class="mem-item-card">
            <div class="mem-card-head">
              <i data-lucide="palette"></i>
              <strong>PALETA</strong>
            </div>
            <p>${escapeHTML(ctx.paleta || 'Tons neutros e naturais')}</p>
          </div>

          <!-- Materiais -->
          <div class="mem-item-card">
            <div class="mem-card-head">
              <i data-lucide="layers"></i>
              <strong>MATERIAIS</strong>
            </div>
            <p>${escapeHTML(ctx.materiais || 'Conforme especificação C04')}</p>
          </div>

          <!-- Mobiliário -->
          <div class="mem-item-card">
            <div class="mem-card-head">
              <i data-lucide="armchair"></i>
              <strong>MOBILIÁRIO</strong>
            </div>
            <p>${escapeHTML(ctx.mobiliario || 'Layout definido em planta técnica')}</p>
          </div>

          <!-- Iluminação -->
          <div class="mem-item-card">
            <div class="mem-card-head">
              <i data-lucide="sun"></i>
              <strong>ILUMINAÇÃO</strong>
            </div>
            <p>${escapeHTML(ctx.iluminacao || 'Natural abundante e indireta 3000K')}</p>
          </div>

          <!-- Elementos Preservados -->
          <div class="mem-item-card preserved">
            <div class="mem-card-head">
              <i data-lucide="lock"></i>
              <strong>ELEMENTOS PRESERVADOS</strong>
            </div>
            <p>${escapeHTML(ctx.elementosPreservados || 'Alvenarias estruturais e vãos de esquadrias')}</p>
          </div>

          <!-- Elementos a Evitar -->
          <div class="mem-item-card to-avoid">
            <div class="mem-card-head">
              <i data-lucide="alert-triangle"></i>
              <strong>ELEMENTOS A EVITAR</strong>
            </div>
            <p>${escapeHTML(ctx.elementosEvitar || 'Nenhum elemento negativo registrado')}</p>
          </div>
        </div>
      </section>
    `;
  }

  // ============================================================================
  // INTERATIVIDADE E CONTROLE DE ESTADO
  // ============================================================================

  function setActiveSection(sectionKey) {
    activeSection = sectionKey;
    const env = StudioState.getActiveEnvironment();
    const project = StudioState.getActiveProject();
    if (env && project) {
      const container = document.getElementById('env-tab-content');
      if (container) {
        container.innerHTML = render(env, project);
        if (window.lucide) window.lucide.createIcons();
      }
    }
  }

  function handleStatusChange(envId, newStatus) {
    StudioState.updateEnvironmentVisualizationStatus(envId, newStatus, 'Arquiteto');
    StudioApp.showToast(`Status da visualização atualizado para: ${newStatus}`);
    refreshUI();
  }

  function handleTriggerGeneration(envId) {
    const btn = document.getElementById(`btn-generate-vis-${envId}`);
    if (btn) {
      btn.disabled = true;
    }

    StudioApp.showToast('Iniciando geração da visualização do ambiente...');
    
    // Inicia simulação com lock no estado
    StudioState.simulateEnvironmentGeneration(envId, 2500, (err, updatedVis) => {
      if (err) {
        StudioApp.showToast(err.message || 'Erro na geração visual', 'error');
      } else {
        StudioApp.showToast('Geração visual concluída com sucesso!');
      }
      refreshUI();
    });

    refreshUI();
  }

  function approveRender(envId, renderId) {
    const updated = StudioState.approveEnvironmentRender(envId, renderId, 'Eduardo Marques (Arquiteto Titular)');
    if (updated) {
      StudioApp.showToast('Render aprovado com sucesso como a imagem oficial do ambiente!');
      refreshUI();
    }
  }

  function changeActiveVersion(envId, newVersion) {
    const vis = (StudioState.data.environmentVisualizations || []).find(v => v.environmentId === envId);
    if (vis) {
      vis.activeVersion = newVersion;
      vis.updatedAt = new Date().toISOString();
      StudioState.save();
      StudioApp.showToast(`Versão ativa alterada para ${newVersion}`);
      refreshUI();
    }
  }

  function openImageLightbox(imageUrl, title) {
    let modal = document.getElementById('vis-lightbox-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'vis-lightbox-modal';
      modal.className = 'vis-lightbox-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="vis-lightbox-dialog">
        <div class="vis-lightbox-header">
          <h3>${escapeHTML(title || 'Visualização em Alta Resolução')}</h3>
          <button class="btn-icon btn-ghost" onclick="EnvironmentVisualizationModule.closeImageLightbox()">
            <i data-lucide="x"></i>
          </button>
        </div>
        <div class="vis-lightbox-body">
          <img src="${imageUrl}" alt="${escapeHTML(title || 'Preview')}">
        </div>
      </div>
    `;

    modal.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
  }

  function closeImageLightbox() {
    const modal = document.getElementById('vis-lightbox-modal');
    if (modal) {
      modal.classList.remove('active');
    }
  }

  function selectForCompare(renderId) {
    if (!selectedRenderForCompare1) {
      selectedRenderForCompare1 = renderId;
      StudioApp.showToast('Render 1 selecionado para comparação. Selecione outro render para comparar.');
    } else if (selectedRenderForCompare1 === renderId) {
      selectedRenderForCompare1 = null;
      StudioApp.showToast('Seleção cancelada.');
    } else {
      selectedRenderForCompare2 = renderId;
      const env = StudioState.getActiveEnvironment();
      if (env) {
        openCompareModal(env.id);
      }
    }
  }

  function openCompareModal(envId) {
    const renders = (StudioState.data.environmentRenders || []).filter(r => r.environmentId === envId);
    if (renders.length < 2) {
      StudioApp.showToast('São necessários ao menos 2 renders para comparação lado a lado.');
      return;
    }

    const r1 = renders.find(r => r.id === selectedRenderForCompare1) || renders[0];
    const r2 = renders.find(r => r.id === selectedRenderForCompare2) || renders[1] || renders[0];

    let modal = document.getElementById('vis-compare-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'vis-compare-modal';
      modal.className = 'vis-lightbox-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="vis-compare-dialog">
        <div class="vis-lightbox-header">
          <h3><i data-lucide="columns"></i> Comparação Lado a Lado de Renders</h3>
          <button class="btn-icon btn-ghost" onclick="EnvironmentVisualizationModule.closeCompareModal()">
            <i data-lucide="x"></i>
          </button>
        </div>
        <div class="vis-compare-body">
          <div class="compare-column">
            <div class="compare-head">
              <span class="badge-ver">${escapeHTML(r1.version)}</span>
              <strong>${escapeHTML(r1.viewType || 'Opção A')}</strong>
              <small>${escapeHTML(r1.renderEngine || 'Enscape')}</small>
            </div>
            <img src="${r1.imageUrl}" alt="Render 1">
          </div>
          <div class="compare-divider"></div>
          <div class="compare-column">
            <div class="compare-head">
              <span class="badge-ver">${escapeHTML(r2.version)}</span>
              <strong>${escapeHTML(r2.viewType || 'Opção B')}</strong>
              <small>${escapeHTML(r2.renderEngine || 'Enscape')}</small>
            </div>
            <img src="${r2.imageUrl}" alt="Render 2">
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
  }

  function closeCompareModal() {
    const modal = document.getElementById('vis-compare-modal');
    if (modal) {
      modal.classList.remove('active');
    }
  }

  function openAddCameraModal(envId) {
    const camName = prompt('Identificador da Câmera (ex: Cam_Living_02):', 'Cam_Perspectiva_Nova');
    if (!camName) return;

    StudioState.addEnvironmentCamera(envId, {
      cameraName: camName,
      viewType: 'PERSPECTIVA',
      focalLengthMm: 28,
      eyeHeightM: 1.55,
      targetHeightM: 1.2,
      aspectRatio: '16:9',
      isApproved: false,
      notes: 'Câmera adicionada no workspace de visualização.'
    });

    StudioApp.showToast(`Câmera "${camName}" registrada com sucesso!`);
    refreshUI();
  }

  function refreshUI() {
    const env = StudioState.getActiveEnvironment();
    const project = StudioState.getActiveProject();
    if (env && project) {
      const container = document.getElementById('env-tab-content');
      if (container) {
        container.innerHTML = render(env, project);
        if (window.lucide) window.lucide.createIcons();
      }
    }
  }

  return {
    render,
    setActiveSection,
    handleStatusChange,
    handleTriggerGeneration,
    approveRender,
    changeActiveVersion,
    openImageLightbox,
    closeImageLightbox,
    selectForCompare,
    openCompareModal,
    closeCompareModal,
    openAddCameraModal
  };
})();

if (typeof window !== 'undefined') {
  window.EnvironmentVisualizationModule = EnvironmentVisualizationModule;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EnvironmentVisualizationModule };
}
