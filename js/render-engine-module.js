/**
 * ================================================================
 * ARQVERTICE STUDIO — D06: RENDER ENGINE UI MODULE
 * ================================================================
 * Módulo de interface de usuário responsável pela gestão da Seção 6
 * ("Renders & Gerações Visuais") do Workspace de Visualização.
 * 
 * Recursos:
 * - Painel de Intenção e Geração Inteligente com compilação contextual;
 * - Seleção de Câmeras (D05), Providers (Mock/Gemini) e Controle de Pesos;
 * - Fila de Processamento em Tempo Real com indicador de progresso e Cancelamento;
 * - Galeria por Ambiente com filtros por Câmera, Versão, Status e Data;
 * - Trilha de Aprovação Humana Obrigatória (Aprovar / Rejeitar com motivo);
 * - Comparação Lado a Lado V01 × V02 com inspeção estruturada;
 * - Modal de Histórico e Auditoria com visualização de Prompt Compilado e Custos.
 */

const RenderEngineModule = (function () {
  'use strict';

  function getState() {
    if (typeof StudioState !== 'undefined') return StudioState;
    if (typeof window !== 'undefined' && window.StudioState) return window.StudioState;
    if (typeof global !== 'undefined' && global.StudioState) return global.StudioState;
    try {
      return require('./state.js');
    } catch (e) {
      return null;
    }
  }

  let currentFilters = {
    camera: 'ALL',
    status: 'ALL',
    version: 'ALL'
  };

  let compareLeftId = null;
  let compareRightId = null;

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatRelativeDate(isoDate) {
    if (!isoDate) return 'Data não registrada';
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoDate;
    }
  }

  /**
   * Renderiza a Seção 6 completa do Workspace de Visualização
   */
  function render(visData, env, project) {
    const envId = env.id;
    const projId = project.id;
    const cameras = (StudioState.getEnvironmentCameras ? StudioState.getEnvironmentCameras(projId, envId) : []) || [];
    const allJobs = (StudioState.getRenderJobs ? StudioState.getRenderJobs(projId, envId) : []) || [];

    // Filtros aplicados na galeria
    const filteredJobs = allJobs.filter(job => {
      if (currentFilters.camera !== 'ALL' && job.cameraId !== currentFilters.camera) return false;
      if (currentFilters.status !== 'ALL' && job.status !== currentFilters.status) return false;
      if (currentFilters.version !== 'ALL' && job.contextVersion !== currentFilters.version) return false;
      return true;
    });

    // Fila ativa (jobs em QUEUED ou GENERATING)
    const activeQueue = allJobs.filter(j => j.status === 'QUEUED' || j.status === 'GENERATING');

    // Versões únicas para o filtro
    const availableVersions = Array.from(new Set(allJobs.map(j => j.contextVersion))).filter(Boolean);

    return `
      <section class="vis-panel-section render-engine-workspace" id="vis-section-renders">
        <!-- 1. CABEÇALHO DO MOTOR -->
        <div class="vis-section-header">
          <div class="vis-sec-title">
            <i data-lucide="sparkles" class="text-accent"></i>
            <div>
              <h2>6. Motor de Geração de Renders</h2>
              <p class="section-subtitle">Geração contextual fotorrealista com arquitetura provider-agnostic e aprovação estritamente humana</p>
            </div>
          </div>
          <div class="header-status-group">
            <span class="badge badge-subtle">
              <i data-lucide="layers"></i> ${allJobs.length} Renders no Histórico
            </span>
            ${activeQueue.length > 0 ? `
              <span class="badge badge-warning animate-pulse">
                <i data-lucide="loader-2" class="spin-slow"></i> ${activeQueue.length} em processamento
              </span>
            ` : ''}
          </div>
        </div>

        <!-- 2. FORMULÁRIO DE GERAÇÃO INTELIGENTE -->
        <div class="render-intent-panel">
          <div class="intent-panel-header">
            <span class="step-badge">1</span>
            <div>
              <h3>Definir Intenção & Parâmetros do Render</h3>
              <p>O prompt é compilado dinamicamente a partir das decisões, câmera, referências e travas do ambiente.</p>
            </div>
          </div>

          <div class="render-intent-grid">
            <!-- Seleção de Câmera -->
            <div class="form-group">
              <label for="render-camera-select">
                <i data-lucide="camera"></i> Câmera / Enquadramento (D05):
              </label>
              <select id="render-camera-select" class="form-control">
                ${cameras.length > 0 ? cameras.map(c => `
                  <option value="${c.id}">
                    ${escapeHTML(c.cameraCode || 'CAM')} — ${escapeHTML(c.name)} (${escapeHTML(c.framing || 'Focal')} | ${escapeHTML(c.focalLength || '24mm')})
                  </option>
                `).join('') : `
                  <option value="">C01 — Perspectiva Principal do Ambiente (Padrão)</option>
                `}
              </select>
            </div>

            <!-- Seleção de Provider e Modelo -->
            <div class="form-group">
              <label for="render-provider-select">
                <i data-lucide="cpu"></i> Provider & Modelo:
              </label>
              <select id="render-provider-select" class="form-control" onchange="RenderEngineModule.onProviderChange(this.value)">
                <option value="mock|arqvertice-mock-engine-v1">Mock Engine (Offline / Testes Determinísticos)</option>
                <option value="gemini|imagen-3.0-generate-002" selected>Google Gemini Imagen 3 (Via Backend Seguro)</option>
                <option value="gemini|imagen-3.0-fast-generate-001">Google Gemini Imagen 3 Fast</option>
              </select>
            </div>

            <!-- Resolução -->
            <div class="form-group">
              <label for="render-resolution-select">
                <i data-lucide="monitor"></i> Resolução de Saída:
              </label>
              <select id="render-resolution-select" class="form-control">
                <option value="4K UHD (3840x2160)" selected>4K UHD (3840 × 2160)</option>
                <option value="Full HD (1920x1080)">Full HD (1920 × 1080)</option>
                <option value="Square HD (2048x2048)">Quadrado (2048 × 2048) — Social</option>
                <option value="Vertical 9:16 (2160x3840)">Vertical (2160 × 3840) — Reels/Stories</option>
              </select>
            </div>
          </div>

          <!-- Campo de Intenção do Usuário -->
          <div class="form-group mt-3">
            <div class="label-with-presets">
              <label for="render-user-intent">
                <i data-lucide="message-square"></i> Intenção do Usuário (Interpretação Contextual):
              </label>
              <div class="intent-presets">
                <span class="preset-label">Exemplos Prontos:</span>
                <button type="button" class="btn-preset" onclick="RenderEngineModule.setIntentPreset('Troque o sofá por um modelo mais leve.')">
                  "Troque o sofá por um modelo mais leve."
                </button>
                <button type="button" class="btn-preset" onclick="RenderEngineModule.setIntentPreset('Quero uma iluminação mais aconchegante.')">
                  "Quero uma iluminação mais aconchegante."
                </button>
                <button type="button" class="btn-preset" onclick="RenderEngineModule.setIntentPreset('Crie uma versão mais sofisticada.')">
                  "Crie uma versão mais sofisticada."
                </button>
              </div>
            </div>
            <textarea id="render-user-intent" class="form-control" rows="2" placeholder="Descreva a intenção de alteração ou ambientação desejada..."></textarea>
          </div>

          <!-- Controle de Pesos (Colapsável) -->
          <details class="render-weights-details mt-3">
            <summary class="weights-summary">
              <i data-lucide="sliders"></i> Controle de Pesos de Prioridade (Camadas Arquitetônicas)
              <span class="text-muted text-sm">(Clique para ajustar geometry, camera, style, material, etc.)</span>
            </summary>
            <div class="weights-grid">
              <div class="weight-control-item">
                <label>Geometria Estrutural (Lock):</label>
                <div class="weight-slider-row">
                  <input type="range" id="weight-geometry" min="0.5" max="1.0" step="0.05" value="1.0" oninput="document.getElementById('val-geometry').textContent = this.value">
                  <span id="val-geometry" class="weight-val">1.0</span>
                </div>
              </div>
              <div class="weight-control-item">
                <label>Enquadramento de Câmera:</label>
                <div class="weight-slider-row">
                  <input type="range" id="weight-camera" min="0.5" max="1.0" step="0.05" value="0.95" oninput="document.getElementById('val-camera').textContent = this.value">
                  <span id="val-camera" class="weight-val">0.95</span>
                </div>
              </div>
              <div class="weight-control-item">
                <label>Conceito & Estilo:</label>
                <div class="weight-slider-row">
                  <input type="range" id="weight-style" min="0.5" max="1.0" step="0.05" value="0.85" oninput="document.getElementById('val-style').textContent = this.value">
                  <span id="val-style" class="weight-val">0.85</span>
                </div>
              </div>
              <div class="weight-control-item">
                <label>Fidelidade de Materiais:</label>
                <div class="weight-slider-row">
                  <input type="range" id="weight-material" min="0.5" max="1.0" step="0.05" value="0.80" oninput="document.getElementById('val-material').textContent = this.value">
                  <span id="val-material" class="weight-val">0.80</span>
                </div>
              </div>
              <div class="weight-control-item">
                <label>Iluminação & Atmosfera:</label>
                <div class="weight-slider-row">
                  <input type="range" id="weight-lighting" min="0.5" max="1.0" step="0.05" value="0.75" oninput="document.getElementById('val-lighting').textContent = this.value">
                  <span id="val-lighting" class="weight-val">0.75</span>
                </div>
              </div>
              <div class="weight-control-item">
                <label>Mobiliário & Decoração:</label>
                <div class="weight-slider-row">
                  <input type="range" id="weight-furniture" min="0.5" max="1.0" step="0.05" value="0.70" oninput="document.getElementById('val-furniture').textContent = this.value">
                  <span id="val-furniture" class="weight-val">0.70</span>
                </div>
              </div>
            </div>
          </details>

          <!-- Barra de Disparo -->
          <div class="render-intent-actions mt-3">
            <button type="button" class="btn btn-primary btn-lg" onclick="RenderEngineModule.submitNewRenderJob('${envId}', '${projId}')" id="btn-trigger-render">
              <i data-lucide="sparkles"></i> Compilar Contexto & Iniciar Render
            </button>
            <button type="button" class="btn btn-outline" onclick="RenderEngineModule.previewCompiledPrompt('${envId}', '${projId}')">
              <i data-lucide="eye"></i> Pré-visualizar Prompt Compilado
            </button>
          </div>
        </div>

        <!-- 3. FILA DE EXECUÇÃO ATIVA -->
        ${activeQueue.length > 0 ? `
          <div class="render-queue-box mt-4">
            <div class="queue-header">
              <div class="queue-title">
                <i data-lucide="clock" class="spin-slow text-warning"></i>
                <strong>Fila de Geração Ativa (${activeQueue.length})</strong>
              </div>
              <span class="text-sm text-muted">A geração ocorre em segundo plano sem bloquear a aplicação.</span>
            </div>
            <div class="queue-items">
              ${activeQueue.map(q => `
                <div class="queue-item-card" id="queue-card-${q.id}">
                  <div class="queue-info">
                    <div class="queue-badge-row">
                      <span class="badge badge-warning">${escapeHTML(q.status)}</span>
                      <span class="badge badge-subtle">${escapeHTML(q.provider)} / ${escapeHTML(q.model)}</span>
                      <span class="badge badge-info">Câmera: ${escapeHTML(q.cameraCode || 'C01')}</span>
                    </div>
                    <p class="queue-intent"><strong>Intenção:</strong> "${escapeHTML(q.userIntent)}"</p>
                    <div class="progress-bar-container">
                      <div class="progress-bar-fill" style="width: ${q.progress || 35}%;"></div>
                    </div>
                    <small class="text-muted">Iniciado em: ${formatRelativeDate(q.startedAt || q.createdAt)}</small>
                  </div>
                  <div class="queue-actions">
                    <button class="btn btn-danger btn-sm" onclick="RenderEngineModule.cancelJob('${q.id}', '${envId}')" title="Cancelar Geração">
                      <i data-lucide="x"></i> Cancelar
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- 4. GALERIA DE RENDERS POR AMBIENTE COM FILTROS -->
        <div class="render-gallery-section mt-4">
          <div class="gallery-controls-bar">
            <div class="gallery-title-group">
              <h3>Galeria de Renders do Ambiente</h3>
              <span class="count-pill">${filteredJobs.length} encontrados</span>
            </div>

            <!-- Barra de Filtros -->
            <div class="gallery-filters">
              <!-- Filtro Câmera -->
              <div class="filter-item">
                <label><i data-lucide="camera"></i> Câmera:</label>
                <select class="form-control form-control-sm" onchange="RenderEngineModule.setFilter('camera', this.value, '${envId}')">
                  <option value="ALL" ${currentFilters.camera === 'ALL' ? 'selected' : ''}>Todas as Câmeras</option>
                  ${cameras.map(c => `
                    <option value="${c.id}" ${currentFilters.camera === c.id ? 'selected' : ''}>${escapeHTML(c.cameraCode || 'CAM')} — ${escapeHTML(c.name)}</option>
                  `).join('')}
                </select>
              </div>

              <!-- Filtro Versão -->
              <div class="filter-item">
                <label><i data-lucide="git-branch"></i> Versão:</label>
                <select class="form-control form-control-sm" onchange="RenderEngineModule.setFilter('version', this.value, '${envId}')">
                  <option value="ALL" ${currentFilters.version === 'ALL' ? 'selected' : ''}>Todas as Versões</option>
                  ${availableVersions.map(v => `
                    <option value="${v}" ${currentFilters.version === v ? 'selected' : ''}>${v}</option>
                  `).join('')}
                </select>
              </div>

              <!-- Filtro Status -->
              <div class="filter-item">
                <label><i data-lucide="filter"></i> Status:</label>
                <select class="form-control form-control-sm" onchange="RenderEngineModule.setFilter('status', this.value, '${envId}')">
                  <option value="ALL" ${currentFilters.status === 'ALL' ? 'selected' : ''}>Todos os Status</option>
                  <option value="APPROVED" ${currentFilters.status === 'APPROVED' ? 'selected' : ''}>Aprovados</option>
                  <option value="SUCCEEDED" ${currentFilters.status === 'SUCCEEDED' ? 'selected' : ''}>Aguardando Aprovação</option>
                  <option value="REJECTED" ${currentFilters.status === 'REJECTED' ? 'selected' : ''}>Rejeitados</option>
                  <option value="FAILED" ${currentFilters.status === 'FAILED' ? 'selected' : ''}>Falhas</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Grade de Imagens da Galeria -->
          ${filteredJobs.length > 0 ? `
            <div class="vis-renders-gallery mt-3">
              ${filteredJobs.map(job => {
                const isApproved = job.status === 'APPROVED';
                const isFailed = job.status === 'FAILED';
                const isRejected = job.status === 'REJECTED';
                const imgUrl = (job.output && job.output.imageUrl) || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';

                return `
                  <div class="vis-render-card ${isApproved ? 'is-approved-render' : ''} ${isFailed ? 'is-failed-render' : ''} ${isRejected ? 'is-rejected-render' : ''}" id="render-card-${job.id}">
                    <!-- Mídia com Lightbox -->
                    <div class="vis-render-media" onclick="${isFailed ? '' : `EnvironmentVisualizationModule.openImageLightbox('${imgUrl}', '${escapeHTML(job.contextVersion)} — Câmera ${escapeHTML(job.cameraCode || 'C01')}')`}">
                      ${isFailed ? `
                        <div class="render-failed-placeholder">
                          <i data-lucide="alert-triangle" class="text-danger"></i>
                          <span>Falha na Geração</span>
                          <small>${escapeHTML(job.errorMessage || 'Erro no processamento de IA')}</small>
                        </div>
                      ` : `
                        <img src="${imgUrl}" alt="Render ${escapeHTML(job.contextVersion)}" loading="lazy">
                      `}
                      <div class="render-overlay-tags">
                        <span class="badge-ver">${escapeHTML(job.contextVersion)}</span>
                        <span class="badge-camera">${escapeHTML(job.cameraCode || 'C01')}</span>
                        <span class="badge-status-${job.status.toLowerCase()}">${escapeHTML(job.status)}</span>
                      </div>
                    </div>

                    <!-- Corpo do Card -->
                    <div class="vis-render-body">
                      <div class="render-title-row">
                        <strong>Câmera ${escapeHTML(job.cameraCode || 'C01')} — ${escapeHTML(job.contextVersion)}</strong>
                        <small>${formatRelativeDate(job.completedAt || job.createdAt)}</small>
                      </div>

                      <p class="render-intent-snippet" title="${escapeHTML(job.userIntent)}">
                        <i data-lucide="quote" class="inline-icon"></i> "${escapeHTML(job.userIntent)}"
                      </p>

                      <div class="render-engine-row">
                        <span>Provider: <strong>${escapeHTML(job.provider)}</strong> (${escapeHTML(job.model)})</span>
                        ${job.output && job.output.estimatedCostUsd ? `
                          <span>Custo: <strong>$${job.output.estimatedCostUsd} USD</strong></span>
                        ` : ''}
                      </div>

                      <!-- Barra de Ações com Aprovação Estritamente Humana -->
                      <div class="render-card-actions">
                        ${isApproved ? `
                          <span class="btn-approved-stamp" title="Aprovado por ${escapeHTML(job.approvedBy || 'Arquiteto')} em ${formatRelativeDate(job.approvedAt)}">
                            <i data-lucide="check-circle-2"></i> Render Aprovado
                          </span>
                        ` : isFailed ? `
                          <button class="btn btn-warning btn-xs" onclick="RenderEngineModule.retryJob('${job.id}', '${envId}')" title="Tentar novamente geração sem cobrança duplicada">
                            <i data-lucide="rotate-cw"></i> Tentar Novamente (${job.retryCount || 0})
                          </button>
                        ` : isRejected ? `
                          <span class="badge badge-danger text-xs" title="Motivo: ${escapeHTML(job.rejectionReason || 'Não atendeu')}">
                            <i data-lucide="x-circle"></i> Rejeitado
                          </span>
                        ` : `
                          <button class="btn btn-success btn-xs" onclick="RenderEngineModule.approveJob('${job.id}', '${envId}')" title="Aprovação Humana: Homologar como Render Oficial">
                            <i data-lucide="check"></i> Aprovar
                          </button>
                          <button class="btn btn-outline btn-xs" onclick="RenderEngineModule.openRejectModal('${job.id}', '${envId}')" title="Rejeitar este render registrando motivo">
                            <i data-lucide="x"></i> Rejeitar
                          </button>
                        `}

                        <!-- Comparar -->
                        ${!isFailed ? `
                          <button class="btn btn-ghost btn-xs" onclick="RenderEngineModule.selectForCompare('${job.id}', '${envId}')" title="Selecionar para Comparação Lado a Lado">
                            <i data-lucide="columns"></i> Comparar
                          </button>
                          <button class="btn btn-ghost btn-xs" onclick="RenderEngineModule.useAsReference('${job.id}', '${envId}')" title="Adicionar este render às referências do ambiente">
                            <i data-lucide="bookmark-plus"></i> Usar como Ref.
                          </button>
                        ` : ''}

                        <!-- Inspecionar Prompt & Detalhes -->
                        <button class="btn btn-ghost btn-xs" onclick="RenderEngineModule.openMetadataModal('${job.id}')" title="Ver Prompt Compilado, Locks e Metadados">
                          <i data-lucide="info"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : `
            <div class="vis-empty-box mt-3">
              <i data-lucide="image"></i>
              <p>Nenhum render encontrado para os filtros selecionados.</p>
            </div>
          `}
        </div>

        <!-- 5. PAINEL / BARRA FLUTUANTE DE COMPARAÇÃO LADO A LADO -->
        <div id="render-compare-dock" class="render-compare-dock ${compareLeftId && compareRightId ? 'is-ready' : (compareLeftId ? 'is-partial' : '')}">
          <div class="compare-dock-content">
            <div class="dock-slots">
              <span class="dock-label"><i data-lucide="columns"></i> Comparação Lado a Lado:</span>
              <span class="slot-item slot-left">${compareLeftId ? `Item A: <strong>${compareLeftId.substring(0, 14)}</strong>` : 'Selecione o 1º render'}</span>
              <span class="slot-divider">×</span>
              <span class="slot-item slot-right">${compareRightId ? `Item B: <strong>${compareRightId.substring(0, 14)}</strong>` : 'Selecione o 2º render'}</span>
            </div>
            <div class="dock-actions">
              ${compareLeftId && compareRightId ? `
                <button class="btn btn-primary btn-sm" onclick="RenderEngineModule.openCompareModal('${compareLeftId}', '${compareRightId}')">
                  <i data-lucide="maximize-2"></i> Abrir Comparação V01 × V02
                </button>
              ` : ''}
              ${compareLeftId ? `
                <button class="btn btn-ghost btn-sm" onclick="RenderEngineModule.clearCompare()">
                  Limpar
                </button>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- 6. MODAL DE COMPARAÇÃO LADO A LADO -->
        <div id="render-compare-modal" class="modal-backdrop" style="display: none;">
          <div class="modal-dialog modal-xl">
            <div class="modal-content" id="render-compare-modal-body">
              <!-- Preenchido dinamicamente via openCompareModal -->
            </div>
          </div>
        </div>

        <!-- 7. MODAL DE METADADOS & PROMPT COMPILADO -->
        <div id="render-metadata-modal" class="modal-backdrop" style="display: none;">
          <div class="modal-dialog modal-lg">
            <div class="modal-content" id="render-metadata-modal-body">
              <!-- Preenchido dinamicamente via openMetadataModal -->
            </div>
          </div>
        </div>

        <!-- 8. MODAL DE REJEIÇÃO -->
        <div id="render-reject-modal" class="modal-backdrop" style="display: none;">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h3><i data-lucide="alert-circle" class="text-warning"></i> Rejeitar Renderização</h3>
                <button class="btn-close" onclick="RenderEngineModule.closeRejectModal()">&times;</button>
              </div>
              <div class="modal-body">
                <p>O render não será excluído; ele será arquivado como histórico de revisão com o motivo registrado.</p>
                <div class="form-group mt-3">
                  <label for="reject-reason-input">Motivo da Rejeição:</label>
                  <textarea id="reject-reason-input" class="form-control" rows="3" placeholder="Ex: Iluminação muito fria na área do sofá; desproporção na mesa de centro..."></textarea>
                </div>
                <input type="hidden" id="reject-job-id" value="">
                <input type="hidden" id="reject-env-id" value="">
              </div>
              <div class="modal-footer">
                <button class="btn btn-outline" onclick="RenderEngineModule.closeRejectModal()">Cancelar</button>
                <button class="btn btn-danger" onclick="RenderEngineModule.confirmReject()">Confirmar Rejeição</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  /**
   * Preenche o campo de texto com preset de intenção
   */
  function setIntentPreset(text) {
    const el = document.getElementById('render-user-intent');
    if (el) {
      el.value = text;
      el.focus();
    }
  }

  /**
   * Dispara um novo job de renderização a partir do formulário
   */
  async function submitNewRenderJob(environmentId, projectId) {
    const cameraEl = document.getElementById('render-camera-select');
    const intentEl = document.getElementById('render-user-intent');
    const providerEl = document.getElementById('render-provider-select');
    const resolutionEl = document.getElementById('render-resolution-select');

    const cameraId = cameraEl ? cameraEl.value : null;
    const userIntent = intentEl ? intentEl.value.trim() : '';
    const [provider, model] = (providerEl ? providerEl.value : 'gemini|imagen-3.0-generate-002').split('|');
    const resolution = resolutionEl ? resolutionEl.value : '4K UHD (3840x2160)';

    // Leitura dos pesos
    const weightLayers = {
      geometry: parseFloat(document.getElementById('weight-geometry')?.value || 1.0),
      camera: parseFloat(document.getElementById('weight-camera')?.value || 0.95),
      style: parseFloat(document.getElementById('weight-style')?.value || 0.85),
      material: parseFloat(document.getElementById('weight-material')?.value || 0.80),
      lighting: parseFloat(document.getElementById('weight-lighting')?.value || 0.75),
      furniture: parseFloat(document.getElementById('weight-furniture')?.value || 0.70)
    };

    try {
      const job = StudioState.createRenderJob({
        projectId,
        environmentId,
        cameraId,
        userIntent,
        provider,
        model,
        parameters: {
          resolution,
          weightLayers
        }
      });

      if (window.toast) window.toast('Job de renderização enfileirado com sucesso!', 'info');
      refreshView(environmentId);

      // Inicia execução assíncrona
      StudioState.startRenderJob(job.id).then(result => {
        if (result.success) {
          if (window.toast) window.toast('Render concluído com sucesso! Aguardando aprovação humana.', 'success');
        } else {
          if (window.toast) window.toast(`Falha na renderização: ${result.error}`, 'error');
        }
        refreshView(environmentId);
      });

    } catch (err) {
      if (window.toast) window.toast(`Erro ao criar job: ${err.message}`, 'error');
      else alert(`Erro: ${err.message}`);
    }
  }

  /**
   * Cancela um job ativo
   */
  function cancelJob(jobId, environmentId) {
    if (!confirm('Deseja realmente cancelar esta geração em andamento?')) return;
    const res = StudioState.cancelRenderJob(jobId);
    if (res.success) {
      if (window.toast) window.toast('Geração cancelada com sucesso.', 'info');
      refreshView(environmentId);
    } else {
      if (window.toast) window.toast(`Erro: ${res.error}`, 'error');
    }
  }

  /**
   * Tenta novamente a execução de um job com falha
   */
  function retryJob(jobId, environmentId) {
    if (window.toast) window.toast('Reiniciando geração...', 'info');
    StudioState.retryRenderJob(jobId).then(res => {
      if (res.success) {
        if (window.toast) window.toast('Render concluído com sucesso!', 'success');
      } else {
        if (window.toast) window.toast(`Falha no retry: ${res.error}`, 'error');
      }
      refreshView(environmentId);
    });
    refreshView(environmentId);
  }

  /**
   * Aprovação formal estritamente humana
   */
  function approveJob(jobId, environmentId) {
    const user = 'Eduardo Marques (Arquiteto Titular)';
    try {
      const res = StudioState.approveRenderJob(jobId, user);
      if (res.success) {
        if (window.toast) window.toast('Render aprovado formalmente como referência oficial do ambiente!', 'success');
        refreshView(environmentId);
      }
    } catch (e) {
      if (window.toast) window.toast(e.message, 'error');
      else alert(e.message);
    }
  }

  /**
   * Modal de rejeição
   */
  function openRejectModal(jobId, environmentId) {
    const m = document.getElementById('render-reject-modal');
    const inputJob = document.getElementById('reject-job-id');
    const inputEnv = document.getElementById('reject-env-id');
    if (m && inputJob && inputEnv) {
      inputJob.value = jobId;
      inputEnv.value = environmentId;
      m.style.display = 'flex';
    }
  }

  function closeRejectModal() {
    const m = document.getElementById('render-reject-modal');
    if (m) m.style.display = 'none';
  }

  function confirmReject() {
    const jobId = document.getElementById('reject-job-id')?.value;
    const envId = document.getElementById('reject-env-id')?.value;
    const reason = document.getElementById('reject-reason-input')?.value || 'Critérios visuais não atendidos';

    if (jobId) {
      StudioState.rejectRenderJob(jobId, reason, 'Eduardo Marques (Arquiteto Titular)');
      if (window.toast) window.toast('Render rejeitado e registrado no histórico.', 'info');
      closeRejectModal();
      refreshView(envId);
    }
  }

  /**
   * Seleção para comparação lado a lado
   */
  function selectForCompare(jobOrRenderId, environmentId) {
    if (!compareLeftId) {
      compareLeftId = jobOrRenderId;
      if (window.toast) window.toast('Render 1 selecionado. Selecione o segundo render para comparar.', 'info');
    } else if (compareLeftId === jobOrRenderId) {
      compareLeftId = null;
      if (window.toast) window.toast('Seleção desfeita.', 'info');
    } else if (!compareRightId) {
      compareRightId = jobOrRenderId;
      if (window.toast) window.toast('Ambos os renders selecionados! Clique em "Abrir Comparação".', 'success');
    } else {
      compareRightId = jobOrRenderId;
    }
    refreshView(environmentId);
  }

  function clearCompare() {
    compareLeftId = null;
    compareRightId = null;
    const dock = document.getElementById('render-compare-dock');
    if (dock) dock.className = 'render-compare-dock';
  }

  /**
   * Modal de comparação lado a lado V01 × V02
   */
  function openCompareModal(idA, idB) {
    const modal = document.getElementById('render-compare-modal');
    const body = document.getElementById('render-compare-modal-body');
    if (!modal || !body) return;

    const comp = StudioState.getRenderComparisonData(idA, idB);
    if (!comp.isComparable) {
      alert('Não foi possível carregar os dados de comparação para estes renders.');
      return;
    }

    const { itemA, itemB, comparisonPoints } = comp;

    body.innerHTML = `
      <div class="modal-header">
        <div class="modal-title-group">
          <h3><i data-lucide="columns" class="text-accent"></i> Comparação Lado a Lado: ${escapeHTML(itemA.version)} × ${escapeHTML(itemB.version)}</h3>
          <p class="text-muted text-sm">Inspeção visual direta e confronto de parâmetros e intenções</p>
        </div>
        <button class="btn-close" onclick="RenderEngineModule.closeCompareModal()">&times;</button>
      </div>

      <div class="modal-body compare-split-body">
        <!-- Visualização Split de Imagens -->
        <div class="compare-images-grid">
          <div class="compare-image-card">
            <div class="compare-header-tag">
              <span class="badge badge-primary">${escapeHTML(itemA.version)}</span>
              <strong>Câmera: ${escapeHTML(itemA.cameraCode)}</strong>
              <span class="badge badge-subtle">${escapeHTML(itemA.status)}</span>
            </div>
            <div class="compare-img-box">
              <img src="${itemA.imageUrl}" alt="${escapeHTML(itemA.version)}">
            </div>
            <p class="compare-intent-text">"${escapeHTML(itemA.userIntent)}"</p>
          </div>

          <div class="compare-image-card">
            <div class="compare-header-tag">
              <span class="badge badge-secondary">${escapeHTML(itemB.version)}</span>
              <strong>Câmera: ${escapeHTML(itemB.cameraCode)}</strong>
              <span class="badge badge-subtle">${escapeHTML(itemB.status)}</span>
            </div>
            <div class="compare-img-box">
              <img src="${itemB.imageUrl}" alt="${escapeHTML(itemB.version)}">
            </div>
            <p class="compare-intent-text">"${escapeHTML(itemB.userIntent)}"</p>
          </div>
        </div>

        <!-- Tabela de Confronto de Parâmetros -->
        <div class="compare-table-box mt-3">
          <h4>Confronto Estruturado de Metadados</h4>
          <table class="table-compare">
            <thead>
              <tr>
                <th>Critério</th>
                <th>${escapeHTML(itemA.version)}</th>
                <th>${escapeHTML(itemB.version)}</th>
              </tr>
            </thead>
            <tbody>
              ${comparisonPoints.map(p => `
                <tr>
                  <td><strong>${escapeHTML(p.label)}</strong></td>
                  <td>${escapeHTML(p.valueA)}</td>
                  <td>${escapeHTML(p.valueB)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-outline" onclick="RenderEngineModule.closeCompareModal()">Fechar</button>
      </div>
    `;

    modal.style.display = 'flex';
    if (window.lucide) window.lucide.createIcons();
  }

  function closeCompareModal() {
    const m = document.getElementById('render-compare-modal');
    if (m) m.style.display = 'none';
  }

  /**
   * Modal de Metadados e Inspeção de Prompt Compilado
   */
  function openMetadataModal(jobId) {
    const modal = document.getElementById('render-metadata-modal');
    const body = document.getElementById('render-metadata-modal-body');
    if (!modal || !body) return;

    const job = (StudioState.data.renderJobs || []).find(j => j.id === jobId);
    if (!job) return;

    const compiled = job.compiledPrompt || {};
    const contextBlocks = compiled.contextBlocks || {};

    body.innerHTML = `
      <div class="modal-header">
        <div class="modal-title-group">
          <h3><i data-lucide="file-code-2" class="text-accent"></i> Auditoria de Contexto & Prompt Compilado</h3>
          <p class="text-sm text-muted">ID: ${job.id} | Versão: ${job.contextVersion} | Provider: ${job.provider}</p>
        </div>
        <button class="btn-close" onclick="RenderEngineModule.closeMetadataModal()">&times;</button>
      </div>

      <div class="modal-body metadata-inspect-body">
        <div class="metadata-section">
          <h4>1. Prompt Compilado Enviado ao Modelo (Sem Prompt Bruto)</h4>
          <pre class="code-box-prompt">${escapeHTML(compiled.fullPrompt || 'Prompt não registrado.')}</pre>
        </div>

        <div class="metadata-section mt-3">
          <h4>2. Negative Prompt de Segurança</h4>
          <pre class="code-box-negative">${escapeHTML(compiled.negativePrompt || 'Standard negative prompt')}</pre>
        </div>

        <div class="metadata-section mt-3">
          <h4>3. Camadas de Contexto Ingeridas</h4>
          <div class="context-blocks-list">
            <div class="block-item">
              <strong>Intenção Original:</strong>
              <p>"${escapeHTML(job.userIntent)}"</p>
            </div>
            <div class="block-item">
              <strong>Câmera Aplicada:</strong>
              <p>${escapeHTML(contextBlocks.cameraContext?.name || 'C01')} (${escapeHTML(contextBlocks.cameraContext?.framing || 'Focal')} | ${escapeHTML(contextBlocks.cameraContext?.focalLength || '24mm')})</p>
            </div>
            <div class="block-item">
              <strong>Locks Arquitetônicos Rígidos:</strong>
              <p>${(contextBlocks.lockContext || []).join('; ') || 'Alvenarias e vãos preservados'}</p>
            </div>
            <div class="block-item">
              <strong>Referências Injetadas:</strong>
              <p>${(job.inputAssets || []).length} selecionadas pertinentemente (sem poluição de referências do projeto inteiro).</p>
            </div>
          </div>
        </div>

        <div class="metadata-section mt-3">
          <h4>4. Informações de Execução & Custos</h4>
          <div class="execution-pills">
            <span class="badge badge-subtle">Provider: ${escapeHTML(job.provider)}</span>
            <span class="badge badge-subtle">Modelo: ${escapeHTML(job.model)}</span>
            <span class="badge badge-subtle">Tokens: ${job.output?.tokensUsed || 0}</span>
            <span class="badge badge-subtle">Custo Est.: $${job.output?.estimatedCostUsd || 0} USD</span>
            <span class="badge badge-subtle">Seed: ${job.output?.seed || job.parameters?.seed || 0}</span>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-outline" onclick="RenderEngineModule.closeMetadataModal()">Fechar</button>
      </div>
    `;

    modal.style.display = 'flex';
    if (window.lucide) window.lucide.createIcons();
  }

  function closeMetadataModal() {
    const m = document.getElementById('render-metadata-modal');
    if (m) m.style.display = 'none';
  }

  /**
   * Promove o render para uso como referência visual do ambiente
   */
  function useAsReference(jobId, environmentId) {
    try {
      const ref = StudioState.useRenderAsReference(jobId, environmentId);
      if (window.toast) window.toast(`Render adicionado à biblioteca de referências visuais com sucesso!`, 'success');
      refreshView(environmentId);
    } catch (e) {
      if (window.toast) window.toast(`Erro: ${e.message}`, 'error');
    }
  }

  /**
   * Filtros da galeria
   */
  function setFilter(type, value, environmentId) {
    currentFilters[type] = value;
    refreshView(environmentId);
  }

  /**
   * Preview do prompt compilado
   */
  function previewCompiledPrompt(environmentId, projectId) {
    const cameraEl = document.getElementById('render-camera-select');
    const intentEl = document.getElementById('render-user-intent');
    const cameraId = cameraEl ? cameraEl.value : null;
    const userIntent = intentEl ? intentEl.value.trim() : '';

    const compiled = StudioState.compileRenderPrompt(projectId, environmentId, cameraId, userIntent);
    alert(`[PREVIEW DO PROMPT COMPILADO]\n\n${compiled.fullPrompt}\n\nReferências Pertinentes: ${compiled.selectedReferences.length}`);
  }

  function onProviderChange(val) {
    // Pode atualizar modelos disponíveis dinamicamente se necessário
  }

  function refreshView(environmentId) {
    if (window.EnvironmentVisualizationModule && typeof window.EnvironmentVisualizationModule.renderCurrentEnvironment === 'function') {
      window.EnvironmentVisualizationModule.renderCurrentEnvironment();
    } else if (typeof renderVisualizacaoAmbiente === 'function') {
      renderVisualizacaoAmbiente();
    }
  }

  return {
    render,
    setIntentPreset,
    submitNewRenderJob,
    cancelJob,
    retryJob,
    approveJob,
    openRejectModal,
    closeRejectModal,
    confirmReject,
    selectForCompare,
    clearCompare,
    openCompareModal,
    closeCompareModal,
    openMetadataModal,
    closeMetadataModal,
    useAsReference,
    setFilter,
    previewCompiledPrompt,
    onProviderChange
  };

})();

if (typeof window !== 'undefined') {
  window.RenderEngineModule = RenderEngineModule;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RenderEngineModule;
}
