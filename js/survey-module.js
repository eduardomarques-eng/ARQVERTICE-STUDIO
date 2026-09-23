/**
 * ============================================================================
 * ARQVERTICE STUDIO — MÓDULO DE LEVANTAMENTO E ORGANIZAÇÃO DA BASE (BLOCO C02)
 * Hub Central de Ativos, Plantas, Perspectivas Revit, Reference Sets e Contexto
 * ============================================================================
 */

const SurveyModule = {
  activeSubArea: 'projeto', // 'projeto', 'pavimentos', 'ambientes', 'plantas', 'perspectivas', 'elevacoes', 'cortes', 'fotos', 'referencias', 'documentos'
  filterEnvironment: 'all',
  filterCategory: 'all',
  filterPriority: 'all',
  selectedAssetForModal: null,

  /**
   * Renderiza a visão central do Levantamento no Workspace do Projeto
   */
  render(project, client) {
    const assets = StudioState.getSurveyAssets(project.id, {
      environmentId: this.filterEnvironment,
      category: this.filterCategory,
      priority: this.filterPriority
    });

    const allProjectAssets = StudioState.getSurveyAssets(project.id);
    const environments = (StudioState.data.environments || []).filter(e => e.projectId === project.id);
    const refSets = StudioState.getReferenceSets(project.id);

    // Contadores rápidos para o header
    const plantsCount = allProjectAssets.filter(a => a.category === 'PLANTA' || a.category === 'PLANTA_HUMANIZADA').length;
    const perspectivesCount = allProjectAssets.filter(a => a.category === 'PERSPECTIVA' || a.category === 'VISTA').length;
    const revitCount = allProjectAssets.filter(a => a.isRevitOrigin).length;
    const photosCount = allProjectAssets.filter(a => a.category === 'FOTO').length;
    const rejectedCount = allProjectAssets.filter(a => a.priority === 'REJECTED').length;

    return `
      <div class="survey-workspace-wrap animate-fade-in">
        <!-- BARRA SUPERIOR DE GOVERNANÇA DO LEVANTAMENTO -->
        <header class="survey-top-banner">
          <div class="stb-main">
            <div class="stb-pills-row">
              <span class="stb-pill-origin"><i data-lucide="layers"></i> BLOCO C02 — BASE DO PROJETO</span>
              <span class="stb-pill-revit" title="Revit permanece como origem principal do modelo arquitetônico">
                <i data-lucide="box"></i> Revit Hub Integrado
              </span>
              <span class="stb-pill-count">${allProjectAssets.length} Ativos Organizados</span>
              ${rejectedCount > 0 ? `
                <span class="stb-pill-rejected" title="${rejectedCount} referências rejeitadas preservadas para controle"><i data-lucide="shield-alert"></i> ${rejectedCount} Rejeições Mapeadas</span>
              ` : ''}
            </div>

            <h1 class="stb-title">Levantamento & Organização da Base Arquitetônica</h1>
            <p class="stb-desc">
              Central de inteligência para contextualizar plantas, perspectivas exportadas do <strong>Autodesk Revit</strong>, cortes, elevações, fotos de canteiro e conjuntos de referências (<strong>REFERENCE_SET</strong>) para o projeto <strong>${escapeHTML(project.name)}</strong>. Os arquivos originais são preservados de forma não-destrutiva para alimentar a engine de visualização.
            </p>
          </div>

          <div class="stb-actions">
            <button class="btn btn-primary btn-sm" onclick="SurveyModule.openUploadModal('${project.id}')">
              <i data-lucide="upload-cloud"></i> Inserir Ativo / Planta
            </button>
            <button class="btn btn-secondary btn-sm" onclick="SurveyModule.openAiClassificationModal('${project.id}')">
              <i data-lucide="sparkles"></i> Classificar com IA
            </button>
            <button class="btn btn-outline btn-sm" onclick="SurveyModule.openContextInspectorModal('${project.id}')">
              <i data-lucide="package-check"></i> Inspecionar ENVIRONMENT_CONTEXT
            </button>
          </div>
        </header>

        <!-- SUB-NAVEGAÇÃO DAS 10 SUBÁREAS DO BLOCO C02 -->
        <nav class="survey-subnav-tabs">
          <button class="survey-nav-tab ${this.activeSubArea === 'projeto' ? 'active' : ''}" onclick="SurveyModule.switchSubArea('projeto')">
            <i data-lucide="layout-dashboard"></i> 01. Projeto (${allProjectAssets.length})
          </button>
          <button class="survey-nav-tab ${this.activeSubArea === 'pavimentos' ? 'active' : ''}" onclick="SurveyModule.switchSubArea('pavimentos')">
            <i data-lucide="layers"></i> 02. Pavimentos
          </button>
          <button class="survey-nav-tab ${this.activeSubArea === 'ambientes' ? 'active' : ''}" onclick="SurveyModule.switchSubArea('ambientes')">
            <i data-lucide="home"></i> 03. Ambientes (${environments.length})
          </button>
          <button class="survey-nav-tab ${this.activeSubArea === 'plantas' ? 'active' : ''}" onclick="SurveyModule.switchSubArea('plantas')">
            <i data-lucide="map"></i> 04. Plantas (${plantsCount})
          </button>
          <button class="survey-nav-tab ${this.activeSubArea === 'perspectivas' ? 'active' : ''}" onclick="SurveyModule.switchSubArea('perspectivas')">
            <i data-lucide="camera"></i> 05. Perspectivas Revit (${perspectivesCount})
          </button>
          <button class="survey-nav-tab ${this.activeSubArea === 'elevacoes' ? 'active' : ''}" onclick="SurveyModule.switchSubArea('elevacoes')">
            <i data-lucide="maximize-2"></i> 06. Elevações
          </button>
          <button class="survey-nav-tab ${this.activeSubArea === 'cortes' ? 'active' : ''}" onclick="SurveyModule.switchSubArea('cortes')">
            <i data-lucide="scissors"></i> 07. Cortes
          </button>
          <button class="survey-nav-tab ${this.activeSubArea === 'fotos' ? 'active' : ''}" onclick="SurveyModule.switchSubArea('fotos')">
            <i data-lucide="image"></i> 08. Fotos Canteiro (${photosCount})
          </button>
          <button class="survey-nav-tab ${this.activeSubArea === 'referencias' ? 'active' : ''}" onclick="SurveyModule.switchSubArea('referencias')">
            <i data-lucide="sparkles"></i> 09. Referências (${refSets.length} Sets)
          </button>
          <button class="survey-nav-tab ${this.activeSubArea === 'documentos' ? 'active' : ''}" onclick="SurveyModule.switchSubArea('documentos')">
            <i data-lucide="file-text"></i> 10. Documentos & BIM
          </button>
        </nav>

        <!-- FILTROS CONTEXTUAIS DA SUBÁREA -->
        <div class="survey-filter-toolbar">
          <div class="sft-group">
            <label><i data-lucide="filter"></i> Filtrar por Ambiente:</label>
            <select class="form-select form-select-sm" onchange="SurveyModule.setFilter('environment', this.value)">
              <option value="all" ${this.filterEnvironment === 'all' ? 'selected' : ''}>Todos os Ambientes</option>
              ${environments.map(e => `
                <option value="${e.id}" ${this.filterEnvironment === e.id ? 'selected' : ''}>${escapeHTML(e.name)}</option>
              `).join('')}
            </select>
          </div>

          <div class="sft-group">
            <label><i data-lucide="tag"></i> Prioridade:</label>
            <select class="form-select form-select-sm" onchange="SurveyModule.setFilter('priority', this.value)">
              <option value="all" ${this.filterPriority === 'all' ? 'selected' : ''}>Todas as Prioridades</option>
              <option value="PRIMARY" ${this.filterPriority === 'PRIMARY' ? 'selected' : ''}>PRIMARY (Primária)</option>
              <option value="SECONDARY" ${this.filterPriority === 'SECONDARY' ? 'selected' : ''}>SECONDARY (Secundária)</option>
              <option value="OPTIONAL" ${this.filterPriority === 'OPTIONAL' ? 'selected' : ''}>OPTIONAL (Opcional)</option>
              <option value="REJECTED" ${this.filterPriority === 'REJECTED' ? 'selected' : ''}>REJECTED (Rejeitada com Motivo)</option>
            </select>
          </div>

          <div class="sft-group">
            <span class="sft-stats-badge">${assets.length} ativos exibidos</span>
          </div>
        </div>

        <!-- CONTEÚDO DINÂMICO DA SUBÁREA -->
        <main class="survey-main-content">
          ${this.renderSubAreaContent(project, client, environments, assets, refSets)}
        </main>

        <!-- MODAL 1: INSERIR / EDITAR ATIVO -->
        <div class="modal-overlay" id="modal-survey-asset">
          <div class="modal-card modal-lg">
            <div class="modal-header">
              <h3 id="modal-survey-title"><i data-lucide="upload-cloud"></i> Inserir Ativo de Levantamento</h3>
              <button class="btn-icon btn-ghost" onclick="StudioApp.closeModal('modal-survey-asset')"><i data-lucide="x"></i></button>
            </div>
            <form onsubmit="SurveyModule.saveAssetForm(event, '${project.id}')">
              <input type="hidden" id="sa-id">
              <div class="modal-body">
                <div class="form-grid-2">
                  <div class="form-group span-2">
                    <label class="form-label">Título do Ativo *</label>
                    <input type="text" id="sa-title" class="form-input" placeholder="Ex: Planta Baixa Térreo - Layout Proposto" required>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Categoria do Ativo (15 Tipos C02) *</label>
                    <select id="sa-category" class="form-select" required onchange="SurveyModule.toggleAssetSpecificFields(this.value)">
                      <option value="PLANTA">PLANTA</option>
                      <option value="PLANTA_HUMANIZADA">PLANTA HUMANIZADA</option>
                      <option value="PERSPECTIVA">PERSPECTIVA</option>
                      <option value="VISTA">VISTA</option>
                      <option value="ELEVACAO">ELEVAÇÃO</option>
                      <option value="CORTE">CORTE</option>
                      <option value="FACHADA">FACHADA</option>
                      <option value="FOTO">FOTO</option>
                      <option value="MODELO_3D">MODELO 3D (.RVT / .IFC / .SKP / .OBJ / .FBX)</option>
                      <option value="MATERIAL">MATERIAL</option>
                      <option value="MOVEL">MÓVEL</option>
                      <option value="ILUMINACAO">ILUMINAÇÃO</option>
                      <option value="PAISAGISMO">PAISAGISMO</option>
                      <option value="ESTILO">ESTILO</option>
                      <option value="OUTRO">OUTRO / DOCUMENTO TÉCNICO</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Ambiente Vinculado</label>
                    <select id="sa-environment" class="form-select">
                      <option value="">Nenhum (Geral / Fachada / Terreno)</option>
                      ${environments.map(e => `
                        <option value="${e.id}">${escapeHTML(e.name)}</option>
                      `).join('')}
                    </select>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Nível de Prioridade (Prompt C02 item 7)</label>
                    <select id="sa-priority" class="form-select" onchange="SurveyModule.toggleRejectionReason(this.value)">
                      <option value="PRIMARY">PRIMARY (Primária / Decisiva)</option>
                      <option value="SECONDARY" selected>SECONDARY (Secundária / Complementar)</option>
                      <option value="OPTIONAL">OPTIONAL (Opcional / Inspiração livre)</option>
                      <option value="REJECTED">REJECTED (Rejeitada com Registro)</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Status da Versão (Prompt C02 item 18)</label>
                    <select id="sa-version-status" class="form-select">
                      <option value="CURRENT" selected>CURRENT (Vigente)</option>
                      <option value="APPROVED">APPROVED (Homologada)</option>
                      <option value="SUPERSEDED">SUPERSEDED (Superada por Nova Versão)</option>
                    </select>
                  </div>

                  <div class="form-group span-2" id="sa-rejection-box" style="display: none;">
                    <label class="form-label" style="color: var(--color-danger);"><i data-lucide="alert-triangle"></i> Motivo da Rejeição (Obrigatório para REJECTED) *</label>
                    <textarea id="sa-rejection-reason" class="form-textarea" rows="2" placeholder="Descreva por que esta referência foi recusada (ex: cliente não aprova pisos polidos, incompatibilidade com maresia)..."></textarea>
                  </div>

                  <!-- Seção Específica do Revit (Prompt C02 item 9) -->
                  <div class="form-group span-2">
                    <div class="form-checkbox-custom">
                      <input type="checkbox" id="sa-is-revit" onchange="SurveyModule.toggleRevitFields(this.checked)">
                      <label for="sa-is-revit"><strong><i data-lucide="box"></i> Ativo Originário do Autodesk Revit</strong> (Registrar câmera, vista e fase)</label>
                    </div>
                  </div>

                  <div class="span-2 form-grid-2" id="sa-revit-fields" style="display: none; background: rgba(59, 130, 246, 0.05); padding: 14px; border-radius: 8px; border: 1px dashed rgba(59, 130, 246, 0.3);">
                    <div class="form-group">
                      <label class="form-label">Nome da Vista no Revit</label>
                      <input type="text" id="sa-revit-view" class="form-input" placeholder="Ex: 3D - Living Social">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Fase do Projeto (Phasing)</label>
                      <input type="text" id="sa-revit-phase" class="form-input" placeholder="Ex: Nova Construção / Existente">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Identificação da Câmera</label>
                      <input type="text" id="sa-revit-camera" class="form-input" placeholder="Ex: Cam_Living_01">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Finalidade da Imagem</label>
                      <input type="text" id="sa-revit-purpose" class="form-input" placeholder="Ex: Estudo de insolação / Integração com Deck">
                    </div>
                  </div>

                  <!-- Seção Específica de Plantas (Prompt C02 item 10) -->
                  <div class="span-2 form-grid-3" id="sa-drawing-fields" style="display: none; background: rgba(16, 185, 129, 0.05); padding: 14px; border-radius: 8px; border: 1px dashed rgba(16, 185, 129, 0.3);">
                    <div class="form-group">
                      <label class="form-label">Pavimento</label>
                      <input type="text" id="sa-drawing-floor" class="form-input" placeholder="Ex: Térreo, Superior">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Escala Informada</label>
                      <input type="text" id="sa-drawing-scale" class="form-input" placeholder="Ex: 1:50, 1:100">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Orientação Solar</label>
                      <input type="text" id="sa-drawing-orient" class="form-input" placeholder="Ex: Norte Verdadeiro">
                    </div>
                  </div>

                  <div class="form-group span-2">
                    <label class="form-label">URL da Imagem / Arquivo (Preservação do Original)</label>
                    <input type="text" id="sa-url" class="form-input" placeholder="https://images.unsplash.com/... ou caminho de upload" required>
                  </div>

                  <div class="form-group span-2">
                    <label class="form-label">Observações e Diretrizes de Uso (Prompt C02 item 14)</label>
                    <textarea id="sa-notes" class="form-textarea" rows="2" placeholder="Ex: Usar somente como referência de iluminação; Não copiar mobiliário; Material aprovado pelo cliente..."></textarea>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline" onclick="StudioApp.closeModal('modal-survey-asset')">Cancelar</button>
                <button type="submit" class="btn btn-primary"><i data-lucide="check"></i> Salvar Ativo</button>
              </div>
            </form>
          </div>
        </div>

        <!-- MODAL 2: CRIAR NOVO CONJUNTO DE REFERÊNCIAS (REFERENCE_SET) -->
        <div class="modal-overlay" id="modal-reference-set">
          <div class="modal-card">
            <div class="modal-header">
              <h3><i data-lucide="folder-plus"></i> Novo Conjunto de Referências (REFERENCE_SET)</h3>
              <button class="btn-icon btn-ghost" onclick="StudioApp.closeModal('modal-reference-set')"><i data-lucide="x"></i></button>
            </div>
            <form onsubmit="SurveyModule.saveReferenceSetForm(event, '${project.id}')">
              <div class="modal-body">
                <div class="form-group">
                  <label class="form-label">Nome do Conjunto *</label>
                  <input type="text" id="rs-name" class="form-input" placeholder="Ex: Sala — Referências Principais" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Ambiente Relacionado</label>
                  <select id="rs-environment" class="form-select">
                    <option value="">Geral do Projeto</option>
                    ${environments.map(e => `
                      <option value="${e.id}">${escapeHTML(e.name)}</option>
                    `).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Finalidade Técnica</label>
                  <input type="text" id="rs-purpose" class="form-input" placeholder="Ex: Definir textura mineral e forro do living">
                </div>
                <div class="form-group">
                  <label class="form-label">Prioridade do Conjunto</label>
                  <select id="rs-priority" class="form-select">
                    <option value="PRIMARY" selected>PRIMARY (Principal)</option>
                    <option value="SECONDARY">SECONDARY (Secundário)</option>
                    <option value="OPTIONAL">OPTIONAL (Opcional)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Descrição Detalhada</label>
                  <textarea id="rs-desc" class="form-textarea" rows="2" placeholder="Critérios técnicos a serem observados pelo projetista..."></textarea>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline" onclick="StudioApp.closeModal('modal-reference-set')">Cancelar</button>
                <button type="submit" class="btn btn-primary"><i data-lucide="check"></i> Criar Conjunto</button>
              </div>
            </form>
          </div>
        </div>

        <!-- MODAL 3: CLASSIFICAÇÃO ASSISTIVA DE IA -->
        <div class="modal-overlay" id="modal-survey-ai">
          <div class="modal-card modal-lg">
            <div class="modal-header">
              <h3><i data-lucide="sparkles"></i> IA de Classificação e Auditoria de Base (C02)</h3>
              <button class="btn-icon btn-ghost" onclick="StudioApp.closeModal('modal-survey-ai')"><i data-lucide="x"></i></button>
            </div>
            <div class="modal-body">
              <div class="alert-info-box" style="margin-bottom: 16px;">
                <i data-lucide="shield-check"></i>
                <div>
                  <strong>GOVERNANÇA DE IA ARQVERTICE:</strong> A IA sugere categorias e detecta atributos visuais rotulados como <code>AI_SUGGESTION</code>. Elementos não confirmados geometricamente são estritamente marcados como <code>UNKNOWN</code> ou <code>NOT_CONFIRMED</code> para evitar alucinações.
                </div>
              </div>

              <div class="survey-ai-analysis-list">
                ${allProjectAssets.slice(0, 4).map((a, idx) => `
                  <div class="sai-item-card">
                    <img src="${a.thumbnailUrl || a.originalUrl}" class="sai-thumb" alt="Preview">
                    <div class="sai-details">
                      <div class="sai-badge-row">
                        <span class="badge-source source-ai"><i data-lucide="bot"></i> AI_SUGGESTION</span>
                        <span class="cat-pill">${a.category}</span>
                        <span class="priority-pill priority-${a.priority.toLowerCase()}">${a.priority}</span>
                      </div>
                      <strong>${escapeHTML(a.title)}</strong>
                      <p class="text-xs text-secondary">${a.observationNotes || 'Sem anotações de uso'}</p>
                      <div class="sai-suggestions-row">
                        <span><strong>Ambiente Sugerido:</strong> ${escapeHTML(a.environmentId ? (environments.find(e => e.id === a.environmentId) || {}).name || 'Living' : 'Geral')}</span>
                        <span><strong>Geometria:</strong> ${a.category === 'PLANTA' ? 'CONFIRMADA' : 'NOT_CONFIRMED (Requer planta)'}</span>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-primary" onclick="StudioApp.closeModal('modal-survey-ai'); StudioApp.showToast('Classificações validadas com integridade!');">
                <i data-lucide="check"></i> Confirmar Classificações do Arquiteto
              </button>
            </div>
          </div>
        </div>

        <!-- MODAL 4: INSPECIONAR ENVIRONMENT_CONTEXT (JSON EXECUTIVO) -->
        <div class="modal-overlay" id="modal-survey-context">
          <div class="modal-card modal-lg">
            <div class="modal-header">
              <h3><i data-lucide="package-check"></i> Base Preparada para Visualização (ENVIRONMENT_CONTEXT)</h3>
              <button class="btn-icon btn-ghost" onclick="StudioApp.closeModal('modal-survey-context')"><i data-lucide="x"></i></button>
            </div>
            <div class="modal-body">
              <p class="text-sm text-secondary" style="margin-bottom: 12px;">
                Esta estrutura consolida a planta, perspectivas, reference sets, referências aprovadas e restrições para consumo pelo motor de visualização futura. Geometrias não demonstradas em planta são marcadas como <code>UNKNOWN</code>.
              </p>
              <div class="form-group">
                <label class="form-label">Selecionar Ambiente:</label>
                <select class="form-select" onchange="SurveyModule.updateContextViewer('${project.id}', this.value)">
                  ${environments.map(e => `
                    <option value="${e.id}">${escapeHTML(e.name)} (${e.floorLevel || 'Térreo'})</option>
                  `).join('')}
                </select>
              </div>
              <pre class="json-code-box" id="env-context-json-viewer">${escapeHTML(StudioState.exportEnvironmentContextJSON(project.id, environments[0] ? environments[0].id : 'amb-sala-01'))}</pre>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline" onclick="SurveyModule.copyContextJSON()"><i data-lucide="copy"></i> Copiar JSON</button>
              <button type="button" class="btn btn-primary" onclick="StudioApp.closeModal('modal-survey-context')">Fechar</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Renderiza o conteúdo específico de cada uma das 10 subáreas
   */
  renderSubAreaContent(project, client, environments, assets, refSets) {
    switch (this.activeSubArea) {
      case 'projeto':
        return this.renderProjectOverviewSubArea(project, environments, assets, refSets);
      case 'pavimentos':
        return this.renderFloorsSubArea(project, environments, assets);
      case 'ambientes':
        return this.renderEnvironmentsSurveySubArea(project, environments, assets);
      case 'plantas':
        return this.renderPlantsSubArea(project, assets);
      case 'perspectivas':
        return this.renderPerspectivesSubArea(project, assets);
      case 'elevacoes':
        return this.renderElevationsSubArea(project, assets);
      case 'cortes':
        return this.renderSectionsSubArea(project, assets);
      case 'fotos':
        return this.renderPhotosSubArea(project, assets);
      case 'referencias':
        return this.renderReferencesSubArea(project, environments, assets, refSets);
      case 'documentos':
        return this.renderDocumentsSubArea(project, assets);
      default:
        return this.renderProjectOverviewSubArea(project, environments, assets, refSets);
    }
  },

  // --------------------------------------------------------------------------
  // SUBÁREA 01: PROJETO (Visão Geral da Base)
  // --------------------------------------------------------------------------
  renderProjectOverviewSubArea(project, environments, assets, refSets) {
    return `
      <div class="survey-overview-grid">
        <!-- Card 1: Resumo do Modelo & Revit -->
        <div class="sog-card">
          <div class="sog-card-head">
            <i data-lucide="box" class="text-primary"></i>
            <h4>Origem do Modelo Arquitetônico</h4>
          </div>
          <div class="sog-card-body">
            <p><strong>Software Titular:</strong> Autodesk Revit 2026 (Origem Oficial BIM)</p>
            <p><strong>Papel do ArqVértice Studio:</strong> Organização, versionamento não-destrutivo e indexação contextual dos ativos gerados.</p>
            <div class="revit-status-box">
              <span class="status-indicator-dot is-green"></span>
              <span>Revit Hub Conectado • Vistas sincronizadas</span>
            </div>
          </div>
        </div>

        <!-- Card 2: Estatísticas de Cobertura de Base -->
        <div class="sog-card">
          <div class="sog-card-head">
            <i data-lucide="check-circle" class="text-success"></i>
            <h4>Cobertura da Base de Projeto</h4>
          </div>
          <div class="sog-card-body">
            <ul class="sog-stats-list">
              <li><span>Plantas Baixas Cadastradas:</span> <strong>${assets.filter(a => a.category === 'PLANTA').length}</strong></li>
              <li><span>Perspectivas Revit Indexadas:</span> <strong>${assets.filter(a => a.category === 'PERSPECTIVA').length}</strong></li>
              <li><span>Cortes e Elevações Mapeados:</span> <strong>${assets.filter(a => a.category === 'CORTE' || a.category === 'ELEVACAO').length}</strong></li>
              <li><span>Fotos e Vistorias de Campo:</span> <strong>${assets.filter(a => a.category === 'FOTO').length}</strong></li>
              <li><span>Conjuntos de Referência (Sets):</span> <strong>${refSets.length}</strong></li>
            </ul>
          </div>
        </div>

        <!-- Card 3: Grade de Ativos Recentes -->
        <div class="sog-card span-2">
          <div class="sog-card-head">
            <i data-lucide="clock"></i>
            <h4>Ativos e Plantas Recentes da Base</h4>
            <button class="btn btn-xs btn-outline" onclick="SurveyModule.openUploadModal('${project.id}')">
              <i data-lucide="plus"></i> Novo Ativo
            </button>
          </div>
          <div class="survey-assets-grid">
            ${assets.length === 0 ? `
              <div class="empty-state-box">
                <i data-lucide="image"></i>
                <p>Nenhum ativo encontrado para os filtros selecionados.</p>
              </div>
            ` : assets.map(a => this.renderAssetCard(a, project.id)).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // SUBÁREA 02: PAVIMENTOS (Organização por Níveis)
  // --------------------------------------------------------------------------
  renderFloorsSubArea(project, environments, assets) {
    const floors = ['Térreo', 'Superior', 'Cobertura', 'Implantação'];

    return `
      <div class="survey-floors-view">
        <div class="sf-hero">
          <h3><i data-lucide="layers"></i> Organização por Níveis e Pavimentos</h3>
          <p class="text-sm text-secondary">Classificação vertical do projeto para coordenação geométrica e compatibilização.</p>
        </div>

        <div class="floors-stack">
          ${floors.map(floorName => {
            const floorAssets = assets.filter(a => {
              if (a.drawingMetadata && a.drawingMetadata.floorLevel && a.drawingMetadata.floorLevel.includes(floorName)) return true;
              const env = environments.find(e => e.id === a.environmentId);
              return env && env.floorLevel && env.floorLevel.includes(floorName);
            });

            return `
              <div class="floor-section-card">
                <div class="fsc-header">
                  <div class="fsc-title">
                    <span class="floor-badge">${escapeHTML(floorName)}</span>
                    <h4>Pavimento ${escapeHTML(floorName)}</h4>
                  </div>
                  <span class="badge-pill">${floorAssets.length} Ativos Vinculados</span>
                </div>
                <div class="fsc-body">
                  ${floorAssets.length === 0 ? `
                    <p class="text-xs text-muted">Nenhum ativo vinculado especificamente ao nível ${escapeHTML(floorName)}.</p>
                  ` : `
                    <div class="survey-assets-grid compact">
                      ${floorAssets.map(a => this.renderAssetCard(a, project.id)).join('')}
                    </div>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // SUBÁREA 03: AMBIENTES (Fichas com Checklist e Contexto)
  // --------------------------------------------------------------------------
  renderEnvironmentsSurveySubArea(project, environments, assets) {
    return `
      <div class="survey-envs-view">
        <div class="sf-hero">
          <h3><i data-lucide="home"></i> Fichas de Levantamento dos Ambientes</h3>
          <p class="text-sm text-secondary">Cada ambiente possui checklist de validação (8 itens), base de referências e preparação de contexto.</p>
        </div>

        <div class="envs-survey-grid">
          ${environments.map(env => {
            const envAssets = assets.filter(a => a.environmentId === env.id);
            const chk = StudioState.getSurveyChecklist(project.id, env.id);
            const completedCount = Object.values(chk.items).filter(i => i.completed).length;
            const progressPercent = Math.round((completedCount / 8) * 100);

            return `
              <div class="env-survey-card" id="env-survey-${env.id}">
                <div class="esc-head">
                  <div class="esc-title-group">
                    <h4>${escapeHTML(env.name)}</h4>
                    <span class="badge-pill">${env.floorLevel || 'Térreo'} • ${env.areaM2 || 0} m²</span>
                  </div>
                  <button class="btn btn-xs btn-outline" onclick="SurveyModule.viewEnvironmentContextModal('${project.id}', '${env.id}')" title="Ver ENVIRONMENT_CONTEXT estruturado">
                    <i data-lucide="code"></i> Contexto
                  </button>
                </div>

                <!-- Barra de Progresso do Checklist -->
                <div class="esc-progress-box">
                  <div class="epb-labels">
                    <span>Maturidade do Levantamento</span>
                    <strong>${completedCount}/8 Itens (${progressPercent}%)</strong>
                  </div>
                  <div class="progress-bar-track">
                    <div class="progress-bar-fill ${progressPercent === 100 ? 'is-complete' : ''}" style="width: ${progressPercent}%;"></div>
                  </div>
                </div>

                <!-- Checklist Oficial de 8 Itens do Bloco C02 -->
                <div class="esc-checklist">
                  <h5 class="chk-head-title"><i data-lucide="list-checks"></i> Checklist de Validação (Prompt C02 item 17):</h5>
                  <div class="chk-items-list">
                    ${Object.entries(chk.items).map(([key, item]) => `
                      <label class="chk-item-row ${item.completed ? 'is-done' : ''}">
                        <input type="checkbox" ${item.completed ? 'checked' : ''} onchange="SurveyModule.handleChecklistToggle('${project.id}', '${env.id}', '${key}', this.checked)">
                        <span class="chk-item-label">${escapeHTML(item.label)}</span>
                        ${item.completed && item.confirmedBy ? `
                          <span class="chk-confirmed-tag" title="Validado por ${escapeHTML(item.confirmedBy)}"><i data-lucide="check"></i></span>
                        ` : ''}
                      </label>
                    `).join('')}
                  </div>
                </div>

                <!-- Resumo dos Ativos deste Ambiente -->
                <div class="esc-assets-mini-strip">
                  <span>Ativos Mapeados: <strong>${envAssets.length}</strong></span>
                  <div class="eams-thumbs">
                    ${envAssets.slice(0, 4).map(a => `
                      <img src="${a.thumbnailUrl || a.originalUrl}" title="${escapeHTML(a.title)}" alt="Thumb">
                    `).join('')}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // SUBÁREA 04: PLANTAS (Galeria e Ficha Técnica com Versões)
  // --------------------------------------------------------------------------
  renderPlantsSubArea(project, assets) {
    const plants = assets.filter(a => a.category === 'PLANTA' || a.category === 'PLANTA_HUMANIZADA');

    return `
      <div class="survey-plants-view">
        <div class="sf-hero">
          <div class="sf-hero-text">
            <h3><i data-lucide="map"></i> Plantas Baixas e Desenhos Técnicos</h3>
            <p class="text-sm text-secondary">Plantas originais são preservadas intactas. Novas versões geram V02, V03 sem sobrescrita destrutiva.</p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="SurveyModule.openUploadModal('${project.id}', 'PLANTA')">
            <i data-lucide="plus"></i> Inserir Planta Baixa
          </button>
        </div>

        <div class="survey-assets-grid">
          ${plants.length === 0 ? `
            <div class="empty-state-box span-all">
              <i data-lucide="map"></i>
              <h4>Nenhuma planta cadastrada</h4>
              <p>Envie as plantas baixas exportadas do Revit ou em formato PDF/DWG/PNG.</p>
            </div>
          ` : plants.map(p => this.renderAssetCard(p, project.id)).join('')}
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // SUBÁREA 05: PERSPECTIVAS DO REVIT
  // --------------------------------------------------------------------------
  renderPerspectivesSubArea(project, assets) {
    const perspectives = assets.filter(a => a.category === 'PERSPECTIVA' || a.category === 'VISTA');

    return `
      <div class="survey-perspectives-view">
        <div class="sf-hero">
          <div class="sf-hero-text">
            <h3><i data-lucide="camera"></i> Perspectivas e Vistas Exportadas do Revit</h3>
            <p class="text-sm text-secondary">Rastreabilidade completa de câmeras (ex: Cam_Living_01), fases de projeto e finalidade estética.</p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="SurveyModule.openUploadModal('${project.id}', 'PERSPECTIVA')">
            <i data-lucide="plus"></i> Inserir Perspectiva
          </button>
        </div>

        <div class="survey-assets-grid">
          ${perspectives.length === 0 ? `
            <div class="empty-state-box span-all">
              <i data-lucide="camera"></i>
              <h4>Nenhuma perspectiva cadastrada</h4>
              <p>Envie perspectivas renderizadas ou capturas de câmeras do Revit.</p>
            </div>
          ` : perspectives.map(p => this.renderAssetCard(p, project.id)).join('')}
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // SUBÁREA 06: ELEVAÇÕES
  // --------------------------------------------------------------------------
  renderElevationsSubArea(project, assets) {
    const elevations = assets.filter(a => a.category === 'ELEVACAO' || a.category === 'FACHADA');

    return `
      <div class="survey-elevations-view">
        <div class="sf-hero">
          <div class="sf-hero-text">
            <h3><i data-lucide="maximize-2"></i> Elevações e Fachadas</h3>
            <p class="text-sm text-secondary">Vistas ortogonais verticais para validação de alturas, esquadrias e materiais de revestimento.</p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="SurveyModule.openUploadModal('${project.id}', 'ELEVACAO')">
            <i data-lucide="plus"></i> Inserir Elevação
          </button>
        </div>

        <div class="survey-assets-grid">
          ${elevations.length === 0 ? `
            <div class="empty-state-box span-all">
              <i data-lucide="maximize-2"></i>
              <h4>Nenhuma elevação cadastrada</h4>
            </div>
          ` : elevations.map(e => this.renderAssetCard(e, project.id)).join('')}
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // SUBÁREA 07: CORTES
  // --------------------------------------------------------------------------
  renderSectionsSubArea(project, assets) {
    const sections = assets.filter(a => a.category === 'CORTE');

    return `
      <div class="survey-sections-view">
        <div class="sf-hero">
          <div class="sf-hero-text">
            <h3><i data-lucide="scissors"></i> Cortes Técnicos e Esquemáticos</h3>
            <p class="text-sm text-secondary">Cortes transversais e longitudinais indicando pé-direito, cotas de lajes e desníveis de terreno.</p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="SurveyModule.openUploadModal('${project.id}', 'CORTE')">
            <i data-lucide="plus"></i> Inserir Corte
          </button>
        </div>

        <div class="survey-assets-grid">
          ${sections.length === 0 ? `
            <div class="empty-state-box span-all">
              <i data-lucide="scissors"></i>
              <h4>Nenhum corte cadastrado</h4>
            </div>
          ` : sections.map(s => this.renderAssetCard(s, project.id)).join('')}
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // SUBÁREA 08: FOTOS DO CANTEIRO / VISTORIAS
  // --------------------------------------------------------------------------
  renderPhotosSubArea(project, assets) {
    const photos = assets.filter(a => a.category === 'FOTO');

    return `
      <div class="survey-photos-view">
        <div class="sf-hero">
          <div class="sf-hero-text">
            <h3><i data-lucide="image"></i> Registro Fotográfico & Vistorias</h3>
            <p class="text-sm text-secondary">Fotos de terreno, entorno e elementos existentes a preservar (árvores nativas, caixas de passagem).</p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="SurveyModule.openUploadModal('${project.id}', 'FOTO')">
            <i data-lucide="plus"></i> Inserir Foto de Campo
          </button>
        </div>

        <div class="survey-assets-grid">
          ${photos.length === 0 ? `
            <div class="empty-state-box span-all">
              <i data-lucide="image"></i>
              <h4>Nenhuma foto registrada</h4>
            </div>
          ` : photos.map(p => this.renderAssetCard(p, project.id)).join('')}
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // SUBÁREA 09: REFERÊNCIAS & CONJUNTOS (REFERENCE_SET)
  // --------------------------------------------------------------------------
  renderReferencesSubArea(project, environments, assets, refSets) {
    const refs = assets.filter(a => ['MATERIAL', 'MOVEL', 'ILUMINACAO', 'PAISAGISMO', 'ESTILO'].includes(a.category));

    return `
      <div class="survey-references-view">
        <div class="sf-hero">
          <div class="sf-hero-text">
            <h3><i data-lucide="sparkles"></i> Conjuntos de Referência (REFERENCE_SET) & Catálogo Visual</h3>
            <p class="text-sm text-secondary">Referências priorizadas (PRIMARY, SECONDARY, OPTIONAL, REJECTED). Referências rejeitadas são preservadas com motivo.</p>
          </div>
          <div class="sf-hero-actions">
            <button class="btn btn-outline btn-sm" onclick="SurveyModule.openNewReferenceSetModal('${project.id}')">
              <i data-lucide="folder-plus"></i> Novo Reference Set
            </button>
            <button class="btn btn-primary btn-sm" onclick="SurveyModule.openUploadModal('${project.id}', 'MATERIAL')">
              <i data-lucide="plus"></i> Inserir Referência
            </button>
          </div>
        </div>

        <!-- Bloco de Conjuntos Criados -->
        <div class="refsets-container" style="margin-bottom: 24px;">
          <h4 style="margin-bottom: 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-secondary);"><i data-lucide="folder"></i> Conjuntos Homologados:</h4>
          <div class="refsets-grid">
            ${refSets.map(rs => `
              <div class="refset-card">
                <div class="rsc-head">
                  <strong>${escapeHTML(rs.name)}</strong>
                  <span class="priority-pill priority-${rs.priority.toLowerCase()}">${rs.priority}</span>
                </div>
                <p class="text-xs text-secondary">${escapeHTML(rs.description || rs.purpose)}</p>
                <div class="rsc-footer">
                  <span>${rs.itemIds ? rs.itemIds.length : 0} Itens</span>
                  <span class="badge-status-subtle">${rs.status}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Grade de Referências com Filtro Visual -->
        <h4 style="margin-bottom: 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-secondary);"><i data-lucide="grid"></i> Todas as Referências do Projeto:</h4>
        <div class="survey-assets-grid">
          ${refs.length === 0 ? `
            <div class="empty-state-box span-all">
              <i data-lucide="sparkles"></i>
              <h4>Nenhuma referência cadastrada</h4>
            </div>
          ` : refs.map(r => this.renderAssetCard(r, project.id)).join('')}
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // SUBÁREA 10: DOCUMENTOS & ARQUIVOS BIM / CAD BRUTOS
  // --------------------------------------------------------------------------
  renderDocumentsSubArea(project, assets) {
    const docs = assets.filter(a => a.category === 'OUTRO' || a.category === 'MODELO_3D');

    return `
      <div class="survey-docs-view">
        <div class="sf-hero">
          <div class="sf-hero-text">
            <h3><i data-lucide="file-text"></i> Documentação Técnica & Arquivos BIM/CAD</h3>
            <p class="text-sm text-secondary">Laudos de sondagem, certidões de lote, convenções de condomínio e modelos (.rvt, .dwg, .ifc, .skp).</p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="SurveyModule.openUploadModal('${project.id}', 'OUTRO')">
            <i data-lucide="plus"></i> Inserir Documento
          </button>
        </div>

        <div class="survey-assets-grid">
          ${docs.length === 0 ? `
            <div class="empty-state-box span-all">
              <i data-lucide="file-text"></i>
              <h4>Nenhum documento anexado</h4>
            </div>
          ` : docs.map(d => this.renderAssetCard(d, project.id)).join('')}
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // COMPONENTE: CARD INDIVIDUAL DO ATIVO (Com Badges, Versão e Ações)
  // --------------------------------------------------------------------------
  renderAssetCard(asset, projectId) {
    const isRejected = asset.priority === 'REJECTED';
    const isCurrent = asset.versionStatus === 'CURRENT';

    return `
      <div class="survey-asset-card ${isRejected ? 'is-rejected-card' : ''}" id="asset-card-${asset.id}">
        <!-- Mídia do Ativo com Overlay -->
        <div class="sac-media">
          <img src="${asset.thumbnailUrl || asset.originalUrl}" alt="${escapeHTML(asset.title)}" loading="lazy">
          
          <div class="sac-badges-overlay">
            <span class="cat-pill">${escapeHTML(asset.category)}</span>
            <span class="version-pill ${isCurrent ? 'is-current' : 'is-superseded'}">${escapeHTML(asset.versionLabel || 'V01')}</span>
            <span class="priority-pill priority-${asset.priority.toLowerCase()}">${escapeHTML(asset.priority)}</span>
          </div>

          ${asset.isRevitOrigin ? `
            <span class="sac-revit-flag" title="Exportado do Autodesk Revit"><i data-lucide="box"></i> Revit</span>
          ` : ''}
        </div>

        <!-- Detalhes do Ativo -->
        <div class="sac-details">
          <h4 class="sac-title" title="${escapeHTML(asset.title)}">${escapeHTML(asset.title)}</h4>
          
          <!-- Metadados Técnicos Específicos -->
          <div class="sac-metadata-strip">
            ${asset.drawingMetadata ? `
              <span class="meta-tag"><i data-lucide="scale"></i> ${escapeHTML(asset.drawingMetadata.drawingScale || '1:50')}</span>
              <span class="meta-tag"><i data-lucide="compass"></i> ${escapeHTML(asset.drawingMetadata.orientation || 'Norte')}</span>
            ` : ''}
            ${asset.revitMetadata ? `
              <span class="meta-tag"><i data-lucide="video"></i> ${escapeHTML(asset.revitMetadata.cameraName || 'Câmera')}</span>
              <span class="meta-tag"><i data-lucide="calendar"></i> ${escapeHTML(asset.revitMetadata.phase || 'Nova Const.')}</span>
            ` : ''}
          </div>

          <!-- Observação de Uso -->
          <p class="sac-notes text-xs text-secondary">
            ${escapeHTML(asset.observationNotes || 'Sem observações cadastradas')}
          </p>

          <!-- Tarja de Rejeição quando aplicável -->
          ${isRejected ? `
            <div class="sac-rejection-callout">
              <strong><i data-lucide="alert-circle"></i> Motivo da Rejeição:</strong>
              <span>${escapeHTML(asset.rejectionReason || 'Recusada pelo cliente / arquitetura')}</span>
            </div>
          ` : ''}

          <!-- Ações do Ativo -->
          <div class="sac-actions">
            <button class="btn btn-xs btn-outline" onclick="SurveyModule.openNewVersionModal('${projectId}', '${asset.id}')" title="Criar nova versão sem sobrescrever a original">
              <i data-lucide="git-branch"></i> Nova Versão
            </button>
            ${!isRejected ? `
              <button class="btn btn-xs btn-danger-outline" onclick="SurveyModule.promptRejectAsset('${projectId}', '${asset.id}')" title="Marcar como REJECTED e registrar motivo">
                <i data-lucide="x-circle"></i> Rejeitar
              </button>
            ` : `
              <span class="text-xs text-danger" style="font-weight: 600;"><i data-lucide="lock"></i> Preservado Histórico</span>
            `}
            <a href="${asset.originalUrl}" target="_blank" class="btn btn-xs btn-ghost" title="Visualizar arquivo original intacto">
              <i data-lucide="external-link"></i> Original
            </a>
          </div>
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // CONTROLADORES DE INTERFACE E EVENTOS
  // --------------------------------------------------------------------------
  switchSubArea(areaKey) {
    this.activeSubArea = areaKey;
    if (typeof renderProjectWorkspace === 'function') {
      renderProjectWorkspace();
    }
  },

  setFilter(filterType, value) {
    if (filterType === 'environment') this.filterEnvironment = value;
    if (filterType === 'priority') this.filterPriority = value;
    if (typeof renderProjectWorkspace === 'function') {
      renderProjectWorkspace();
    }
  },

  openUploadModal(projectId, defaultCategory = 'PLANTA') {
    document.getElementById('sa-id').value = '';
    document.getElementById('sa-title').value = '';
    document.getElementById('sa-category').value = defaultCategory;
    document.getElementById('sa-environment').value = this.filterEnvironment !== 'all' ? this.filterEnvironment : '';
    document.getElementById('sa-priority').value = 'PRIMARY';
    document.getElementById('sa-version-status').value = 'CURRENT';
    document.getElementById('sa-url').value = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';
    document.getElementById('sa-notes').value = '';
    document.getElementById('sa-is-revit').checked = false;
    
    this.toggleAssetSpecificFields(defaultCategory);
    this.toggleRejectionReason('PRIMARY');
    this.toggleRevitFields(false);

    StudioApp.openModal('modal-survey-asset');
  },

  toggleAssetSpecificFields(category) {
    const isDrawing = category === 'PLANTA' || category === 'PLANTA_HUMANIZADA' || category === 'ELEVACAO' || category === 'CORTE';
    const drawingBox = document.getElementById('sa-drawing-fields');
    if (drawingBox) {
      drawingBox.style.display = isDrawing ? 'grid' : 'none';
    }
  },

  toggleRejectionReason(priority) {
    const rejBox = document.getElementById('sa-rejection-box');
    if (rejBox) {
      rejBox.style.display = priority === 'REJECTED' ? 'block' : 'none';
      const reasonInput = document.getElementById('sa-rejection-reason');
      if (priority === 'REJECTED') {
        reasonInput.setAttribute('required', 'true');
      } else {
        reasonInput.removeAttribute('required');
      }
    }
  },

  toggleRevitFields(checked) {
    const revitFields = document.getElementById('sa-revit-fields');
    if (revitFields) {
      revitFields.style.display = checked ? 'grid' : 'none';
    }
  },

  saveAssetForm(event, projectId) {
    event.preventDefault();
    const id = document.getElementById('sa-id').value;
    const title = document.getElementById('sa-title').value;
    const category = document.getElementById('sa-category').value;
    const environmentId = document.getElementById('sa-environment').value || null;
    const priority = document.getElementById('sa-priority').value;
    const versionStatus = document.getElementById('sa-version-status').value;
    const rejectionReason = document.getElementById('sa-rejection-reason') ? document.getElementById('sa-rejection-reason').value : '';
    const isRevit = document.getElementById('sa-is-revit').checked;
    const originalUrl = document.getElementById('sa-url').value;
    const notes = document.getElementById('sa-notes').value;

    const assetData = {
      title,
      category,
      environmentId,
      priority,
      versionStatus,
      rejectionReason: priority === 'REJECTED' ? rejectionReason : null,
      isRevitOrigin: isRevit,
      originalUrl,
      thumbnailUrl: originalUrl,
      observationNotes: notes,
      revitViewName: isRevit ? document.getElementById('sa-revit-view').value : null,
      revitPhase: isRevit ? document.getElementById('sa-revit-phase').value : null,
      revitCameraName: isRevit ? document.getElementById('sa-revit-camera').value : null,
      revitPurpose: isRevit ? document.getElementById('sa-revit-purpose').value : null,
      floorLevel: document.getElementById('sa-drawing-floor') ? document.getElementById('sa-drawing-floor').value : null,
      drawingScale: document.getElementById('sa-drawing-scale') ? document.getElementById('sa-drawing-scale').value : null,
      orientation: document.getElementById('sa-drawing-orient') ? document.getElementById('sa-drawing-orient').value : null
    };

    if (id) {
      StudioState.updateSurveyAsset(projectId, id, assetData);
      StudioApp.showToast('Ativo atualizado com sucesso!');
    } else {
      StudioState.addSurveyAsset(projectId, assetData);
      StudioApp.showToast('Ativo adicionado à base do projeto!');
    }

    StudioApp.closeModal('modal-survey-asset');
    if (typeof renderProjectWorkspace === 'function') {
      renderProjectWorkspace();
    }
  },

  promptRejectAsset(projectId, assetId) {
    const reason = prompt('Informe o motivo formal da rejeição (será preservado na base):', 'Incompatível com o estilo do cliente');
    if (reason !== null && reason.trim() !== '') {
      StudioState.rejectSurveyAsset(projectId, assetId, reason.trim());
      StudioApp.showToast('Referência marcada como REJECTED e preservada no histórico.');
      if (typeof renderProjectWorkspace === 'function') {
        renderProjectWorkspace();
      }
    }
  },

  openNewVersionModal(projectId, parentAssetId) {
    const parent = StudioState.getSurveyAssetById(parentAssetId);
    if (!parent) return;
    const nextVer = (parent.versionNumber || 1) + 1;
    const newUrl = prompt(`Informe a URL do arquivo para a NOVA VERSÃO V0${nextVer} (a V0${parent.versionNumber || 1} será preservada intacta):`, parent.originalUrl);
    if (newUrl) {
      StudioState.createAssetVersion(projectId, parentAssetId, {
        originalUrl: newUrl,
        thumbnailUrl: newUrl,
        observationNotes: `Versão V0${nextVer} derivada da revisão técnica da V0${parent.versionNumber || 1}`
      });
      StudioApp.showToast(`Nova versão V0${nextVer} criada! Versão anterior preservada.`);
      if (typeof renderProjectWorkspace === 'function') {
        renderProjectWorkspace();
      }
    }
  },

  openNewReferenceSetModal(projectId) {
    StudioApp.openModal('modal-reference-set');
  },

  saveReferenceSetForm(event, projectId) {
    event.preventDefault();
    const name = document.getElementById('rs-name').value;
    const environmentId = document.getElementById('rs-environment').value || null;
    const purpose = document.getElementById('rs-purpose').value;
    const priority = document.getElementById('rs-priority').value;
    const description = document.getElementById('rs-desc').value;

    StudioState.createReferenceSet(projectId, {
      name,
      environmentId,
      purpose,
      priority,
      description
    });

    StudioApp.showToast('Conjunto REFERENCE_SET cadastrado com sucesso!');
    StudioApp.closeModal('modal-reference-set');
    if (typeof renderProjectWorkspace === 'function') {
      renderProjectWorkspace();
    }
  },

  handleChecklistToggle(projectId, envId, key, checked) {
    StudioState.toggleChecklistItem(projectId, envId, key, checked, '', 'Eduardo Marques (Arquiteto)');
    StudioApp.showToast(checked ? 'Item do checklist validado!' : 'Item do checklist reaberto.');
    if (typeof renderProjectWorkspace === 'function') {
      renderProjectWorkspace();
    }
  },

  openAiClassificationModal(projectId) {
    StudioApp.openModal('modal-survey-ai');
  },

  openContextInspectorModal(projectId) {
    StudioApp.openModal('modal-survey-context');
  },

  viewEnvironmentContextModal(projectId, envId) {
    const viewer = document.getElementById('env-context-json-viewer');
    if (viewer) {
      viewer.textContent = StudioState.exportEnvironmentContextJSON(projectId, envId);
    }
    StudioApp.openModal('modal-survey-context');
  },

  updateContextViewer(projectId, envId) {
    const viewer = document.getElementById('env-context-json-viewer');
    if (viewer) {
      viewer.textContent = StudioState.exportEnvironmentContextJSON(projectId, envId);
    }
  },

  copyContextJSON() {
    const viewer = document.getElementById('env-context-json-viewer');
    if (viewer) {
      navigator.clipboard.writeText(viewer.textContent);
      StudioApp.showToast('JSON do ENVIRONMENT_CONTEXT copiado!');
    }
  }
};

if (typeof window !== 'undefined') {
  window.SurveyModule = SurveyModule;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SurveyModule;
}
