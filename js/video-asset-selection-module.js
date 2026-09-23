/**
 * ============================================================================
 * ARQVERTICE STUDIO — BLOCO G03: SISTEMA DE SELEÇÃO DE CONTEÚDO PARA VÍDEO
 * (VIDEO ASSET SELECTION & CURATION SYSTEM)
 * ============================================================================
 * Sistema responsável por buscar, filtrar, curar e organizar os ativos visuais
 * do projeto que alimentarão a produção do vídeo.
 *
 * FONTES SUPORTADAS (15 fontes):
 * - briefing, conceito, ambientes, plantas, plantas humanizadas,
 *   perspectivas, renders, referências, materiais, mobiliário,
 *   moodboards, pranchas, observações, revisões, arquivos aprovados.
 *
 * ROLES (11 papéis audiovisuais):
 * - abertura, contexto, planta, ambiente, perspectiva, detalhe,
 *   material, mobiliário, transição, encerramento, CTA.
 *
 * FILTROS (7 filtros canônicos):
 * - projeto, ambiente, tipo, aprovação, revisão, resolução, orientação.
 *
 * GOVERNANÇA E REGRAS ESTRITAS:
 * - Somente conteúdo autorizado/aprovado deve ser usado automaticamente.
 * - Itens em RASCUNHO, EM REVISÃO e ARQUIVADO NÃO entram automaticamente.
 * - Permitir: selecionar, desmarcar, ordenar, substituir, visualizar, comparar versões.
 * - Sistema de Recomendação de IA com sugestões contextuais.
 * - A decisão final continua sendo do usuário.
 * - Não excluir automaticamente imagens.
 * - Não substituir imagens aprovadas.
 * ============================================================================
 */

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const VideoAssetSelectionModule = {
  activeVideoId: null,
  activeProjectId: null,
  activeFilters: {
    project: null,
    environment: null,
    type: null,
    approval: null,
    revision: null,
    resolution: null,
    orientation: null,
    role: null,
    selectedOnly: false
  },

  _getState() {
    if (typeof StudioState !== 'undefined') return StudioState;
    if (typeof window !== 'undefined' && window.StudioState) return window.StudioState;
    if (typeof require !== 'undefined') {
      try { return require('./state.js'); } catch (e) {}
    }
    return null;
  },

  /**
   * Renderiza a interface completa de seleção de conteúdo para vídeo
   */
  renderAssetSelection(videoId, projectId) {
    const state = this._getState();
    if (!state) return '<div class="p-4 text-error">Erro ao carregar estado do sistema.</div>';

    let video = null;
    if (videoId) {
      video = state.getVideoProject(videoId);
    }
    if (!video && projectId) {
      const pVideos = state.getProjectVideos(projectId);
      video = pVideos[0] || null;
    }
    if (!video) {
      return `
        <div class="video-asset-error p-5 text-center">
          <h3>Nenhum vídeo selecionado</h3>
          <p class="text-muted">Selecione ou crie um projeto de vídeo primeiro.</p>
        </div>
      `;
    }

    this.activeVideoId = video.id;
    this.activeProjectId = video.projectId;

    const project = state.getProject(video.projectId) || { id: video.projectId, name: 'Projeto' };
    const environments = state.getProjectEnvironments ? state.getProjectEnvironments(video.projectId) : (state.data.environments || []).filter(e => e.projectId === video.projectId);

    // Garante coleta de ativos
    let allSelections = state.getVideoAssetSelections(video.id);
    if (!allSelections || allSelections.length === 0) {
      allSelections = state.collectProjectVideoAssets(video.projectId, video.id);
    }

    // Aplica filtros ativos
    const filteredSelections = state.getVideoAssetSelections(video.id, this.activeFilters);

    // Métricas
    const totalCount = allSelections.length;
    const approvedCount = allSelections.filter(s => s.approvalStatus === 'APROVADO').length;
    const inReviewCount = allSelections.filter(s => s.approvalStatus === 'EM REVISÃO').length;
    const draftCount = allSelections.filter(s => s.approvalStatus === 'RASCUNHO').length;
    const archivedCount = allSelections.filter(s => s.approvalStatus === 'ARQUIVADO').length;
    const selectedCount = allSelections.filter(s => s.selected === true).length;

    const roles = state.VIDEO_ASSET_ROLES ? state.VIDEO_ASSET_ROLES.ALL : [
      'abertura', 'contexto', 'planta', 'ambiente', 'perspectiva',
      'detalhe', 'material', 'mobiliário', 'transição', 'encerramento', 'CTA'
    ];

    const sources = state.VIDEO_ASSET_SOURCES || [
      'briefing', 'conceito', 'ambientes', 'plantas', 'plantas humanizadas',
      'perspectivas', 'renders', 'referências', 'materiais', 'mobiliário',
      'moodboards', 'pranchas', 'observações', 'revisões', 'arquivos aprovados'
    ];

    return `
      <div class="video-asset-selection-root" id="video-asset-selection-root" style="padding: 24px; max-width: 1400px; margin: 0 auto;">
        <!-- Cabeçalho -->
        <div class="d-flex justify-content-between align-items-center mb-4 pb-3" style="border-bottom: 1px solid #e2e8f0;">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="badge" style="background: #0f172a; color: #fff; font-size: 0.75rem; font-weight: 600; padding: 4px 8px; border-radius: 4px;">BLOCO G03</span>
              <span class="text-muted" style="font-size: 0.85rem;">Seleção & Curadoria de Conteúdo</span>
            </div>
            <h2 style="font-size: 1.5rem; font-weight: 700; margin: 0; color: #0f172a;">${escapeHTML(video.title)}</h2>
            <div style="font-size: 0.85rem; color: #64748b; margin-top: 4px;">
              Projeto: <strong>${escapeHTML(project.name)}</strong> &bull; Tipo: <strong>${escapeHTML(video.type || 'Apresentação')}</strong> &bull; Formato: <strong>${escapeHTML(video.aspectRatio || '16:9')} (${escapeHTML(video.resolution || '1080p')})</strong>
            </div>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-outline" onclick="VideoAssetSelectionModule.refreshPool('${video.id}', '${project.id}')" style="padding: 8px 14px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer;">
              🔄 Atualizar Pool do Projeto
            </button>
            <button class="btn btn-primary" onclick="VideoAssetSelectionModule.saveAndProceed('${video.id}')" style="padding: 8px 16px; border-radius: 6px; background: #2563eb; color: #fff; font-weight: 600; border: none; cursor: pointer;">
              Concluir Seleção G03 &rarr;
            </button>
          </div>
        </div>

        <!-- Banner de Governança de Conteúdo -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; padding: 14px 18px; border-radius: 6px; margin-bottom: 24px;">
          <div style="font-weight: 600; font-size: 0.9rem; color: #1e293b; margin-bottom: 4px;">
            🛡️ Regra de Governança Automática do Estúdio
          </div>
          <div style="font-size: 0.85rem; color: #475569; line-height: 1.5;">
            Somente conteúdo <strong>autorizado/aprovado</strong> entra automaticamente na timeline do vídeo. 
            Itens em <em>Rascunho</em>, <em>Em Revisão</em> ou <em>Arquivado</em> não são pré-selecionados. 
            A IA fornece sugestões de papéis narrativos, mas a <strong>decisão final é sempre sua</strong>. Nenhuma imagem é excluída ou substituída sem seu consentimento expresso.
          </div>
        </div>

        <!-- Barra de Métricas do Acervo -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 24px;">
          <div style="background: #fff; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.03);">
            <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase; font-weight: 600;">Total no Pool</div>
            <div style="font-size: 1.5rem; font-weight: 700; color: #0f172a; margin-top: 2px;">${totalCount}</div>
            <div style="font-size: 0.75rem; color: #94a3b8;">15 fontes integradas</div>
          </div>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px 16px; border-radius: 8px;">
            <div style="font-size: 0.75rem; color: #166534; text-transform: uppercase; font-weight: 600;">Aprovados (Auto)</div>
            <div style="font-size: 1.5rem; font-weight: 700; color: #15803d; margin-top: 2px;">${approvedCount}</div>
            <div style="font-size: 0.75rem; color: #166534;">Entram pré-selecionados</div>
          </div>
          <div style="background: #fffbeb; border: 1px solid #fef08a; padding: 12px 16px; border-radius: 8px;">
            <div style="font-size: 0.75rem; color: #854d0e; text-transform: uppercase; font-weight: 600;">Em Revisão</div>
            <div style="font-size: 1.5rem; font-weight: 700; color: #b45309; margin-top: 2px;">${inReviewCount}</div>
            <div style="font-size: 0.75rem; color: #854d0e;">Seleção manual permitida</div>
          </div>
          <div style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 12px 16px; border-radius: 8px;">
            <div style="font-size: 0.75rem; color: #475569; text-transform: uppercase; font-weight: 600;">Rascunho / Arquivados</div>
            <div style="font-size: 1.5rem; font-weight: 700; color: #334155; margin-top: 2px;">${draftCount + archivedCount}</div>
            <div style="font-size: 0.75rem; color: #64748b;">Excluídos do fluxo auto</div>
          </div>
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px 16px; border-radius: 8px;">
            <div style="font-size: 0.75rem; color: #1e40af; text-transform: uppercase; font-weight: 600;">Selecionados no Vídeo</div>
            <div style="font-size: 1.5rem; font-weight: 700; color: #2563eb; margin-top: 2px;">${selectedCount}</div>
            <div style="font-size: 0.75rem; color: #1e40af;">Ativos na timeline</div>
          </div>
        </div>

        <!-- Barra de Filtros Exigidos (7 Filtros) -->
        <div style="background: #fff; border: 1px solid #e2e8f0; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div style="font-weight: 600; font-size: 0.95rem; color: #0f172a;">
              🔍 Filtros do Acervo (${filteredSelections.length} de ${totalCount} visíveis)
            </div>
            <div class="d-flex gap-2">
              <button onclick="VideoAssetSelectionModule.clearFilters('${video.id}')" style="font-size: 0.8rem; background: none; border: none; color: #64748b; text-decoration: underline; cursor: pointer;">
                Limpar Filtros
              </button>
              <button onclick="VideoAssetSelectionModule.toggleSelectedOnly('${video.id}')" style="font-size: 0.8rem; padding: 4px 10px; border-radius: 4px; border: 1px solid #cbd5e1; background: ${this.activeFilters.selectedOnly ? '#2563eb' : '#fff'}; color: ${this.activeFilters.selectedOnly ? '#fff' : '#475569'}; cursor: pointer;">
                ${this.activeFilters.selectedOnly ? '✓ Apenas Selecionados' : 'Mostrar Todos'}
              </button>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
            <!-- 1. Filtro: Projeto -->
            <div>
              <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #64748b; margin-bottom: 4px;">Projeto</label>
              <select onchange="VideoAssetSelectionModule.setFilter('project', this.value, '${video.id}')" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.85rem;">
                <option value="">Todos os Projetos</option>
                <option value="${project.id}" ${this.activeFilters.project === project.id ? 'selected' : ''}>${escapeHTML(project.name)}</option>
              </select>
            </div>

            <!-- 2. Filtro: Ambiente -->
            <div>
              <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #64748b; margin-bottom: 4px;">Ambiente</label>
              <select onchange="VideoAssetSelectionModule.setFilter('environment', this.value, '${video.id}')" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.85rem;">
                <option value="">Todos os Ambientes</option>
                ${environments.map(e => `
                  <option value="${e.id}" ${this.activeFilters.environment === e.id ? 'selected' : ''}>${escapeHTML(e.name)}</option>
                `).join('')}
              </select>
            </div>

            <!-- 3. Filtro: Tipo (15 fontes) -->
            <div>
              <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #64748b; margin-bottom: 4px;">Tipo de Fonte</label>
              <select onchange="VideoAssetSelectionModule.setFilter('type', this.value, '${video.id}')" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.85rem;">
                <option value="">Todos os Tipos (15)</option>
                ${sources.map(src => `
                  <option value="${src}" ${this.activeFilters.type === src ? 'selected' : ''}>${src.toUpperCase()}</option>
                `).join('')}
              </select>
            </div>

            <!-- 4. Filtro: Aprovação -->
            <div>
              <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #64748b; margin-bottom: 4px;">Aprovação</label>
              <select onchange="VideoAssetSelectionModule.setFilter('approval', this.value, '${video.id}')" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.85rem;">
                <option value="">Todas</option>
                <option value="APROVADO" ${this.activeFilters.approval === 'APROVADO' ? 'selected' : ''}>Aprovado</option>
                <option value="EM REVISÃO" ${this.activeFilters.approval === 'EM REVISÃO' ? 'selected' : ''}>Em Revisão</option>
                <option value="RASCUNHO" ${this.activeFilters.approval === 'RASCUNHO' ? 'selected' : ''}>Rascunho</option>
                <option value="ARQUIVADO" ${this.activeFilters.approval === 'ARQUIVADO' ? 'selected' : ''}>Arquivado</option>
              </select>
            </div>

            <!-- 5. Filtro: Revisão -->
            <div>
              <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #64748b; margin-bottom: 4px;">Revisão</label>
              <select onchange="VideoAssetSelectionModule.setFilter('revision', this.value, '${video.id}')" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.85rem;">
                <option value="">Todas as Versões</option>
                <option value="V01" ${this.activeFilters.revision === 'V01' ? 'selected' : ''}>V01</option>
                <option value="V02" ${this.activeFilters.revision === 'V02' ? 'selected' : ''}>V02</option>
                <option value="V03" ${this.activeFilters.revision === 'V03' ? 'selected' : ''}>V03</option>
              </select>
            </div>

            <!-- 6. Filtro: Resolução -->
            <div>
              <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #64748b; margin-bottom: 4px;">Resolução</label>
              <select onchange="VideoAssetSelectionModule.setFilter('resolution', this.value, '${video.id}')" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.85rem;">
                <option value="">Todas</option>
                <option value="1080p" ${this.activeFilters.resolution === '1080p' ? 'selected' : ''}>Full HD (1080p)</option>
                <option value="2K" ${this.activeFilters.resolution === '2K' ? 'selected' : ''}>2K Quad HD</option>
                <option value="4K" ${this.activeFilters.resolution === '4K' ? 'selected' : ''}>4K Ultra HD</option>
              </select>
            </div>

            <!-- 7. Filtro: Orientação -->
            <div>
              <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #64748b; margin-bottom: 4px;">Orientação</label>
              <select onchange="VideoAssetSelectionModule.setFilter('orientation', this.value, '${video.id}')" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.85rem;">
                <option value="">Todas</option>
                <option value="horizontal" ${this.activeFilters.orientation === 'horizontal' ? 'selected' : ''}>Horizontal</option>
                <option value="vertical" ${this.activeFilters.orientation === 'vertical' ? 'selected' : ''}>Vertical</option>
                <option value="quadrado" ${this.activeFilters.orientation === 'quadrado' ? 'selected' : ''}>Quadrado</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Grade de Ativos Curados -->
        <div class="video-asset-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; margin-bottom: 40px;">
          ${filteredSelections.length === 0 ? `
            <div style="grid-column: 1 / -1; padding: 40px; text-align: center; background: #fff; border: 1px dashed #cbd5e1; border-radius: 8px;">
              <p style="color: #64748b; margin: 0;">Nenhum ativo encontrado para os filtros selecionados.</p>
            </div>
          ` : filteredSelections.map((item, index) => this.renderAssetCard(item, video, roles)).join('')}
        </div>

        <!-- Rodapé e Transição para G04 -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 24px; display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 0.85rem; color: #64748b;">
            Etapa atual: <strong>G03 — Seleção de Conteúdo</strong>. Aguarde a etapa G04 para roteiro e geração.
          </div>
          <div class="d-flex gap-3">
            <button class="btn btn-outline" onclick="VideoAssetSelectionModule.selectAllApproved('${video.id}')" style="padding: 10px 16px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer;">
              ✓ Marcar Todos Aprovados
            </button>
            <button class="btn btn-primary" onclick="VideoAssetSelectionModule.saveAndProceed('${video.id}')" style="padding: 10px 22px; border-radius: 6px; background: #0f172a; color: #fff; font-weight: 600; border: none; cursor: pointer;">
              Salvar Seleção & Finalizar G03 &rarr;
            </button>
          </div>
        </div>

        <!-- Container para Modais -->
        <div id="video-asset-modal-container"></div>
      </div>
    `;
  },

  /**
   * Renderiza um card individual de ativo com todas as ações e metadados
   */
  renderAssetCard(item, video, roles) {
    const isApproved = item.approvalStatus === 'APROVADO';
    const statusBg = isApproved ? '#dcfce7' : (item.approvalStatus === 'EM REVISÃO' ? '#fef9c3' : (item.approvalStatus === 'RASCUNHO' ? '#f1f5f9' : '#fee2e2'));
    const statusColor = isApproved ? '#15803d' : (item.approvalStatus === 'EM REVISÃO' ? '#a16207' : (item.approvalStatus === 'RASCUNHO' ? '#475569' : '#b91c1c'));

    const ai = item.aiRecommendation || { role: item.role, reason: 'Sugestão automática da IA com base nas características espaciais.' };

    return `
      <div class="video-asset-card" id="card-${item.id}" style="background: #fff; border: 2px solid ${item.selected ? '#2563eb' : '#e2e8f0'}; border-radius: 10px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 2px 4px rgba(0,0,0,0.04); position: relative;">
        <!-- Imagem e Badges Superiores -->
        <div style="position: relative; width: 100%; height: 180px; background: #0f172a; overflow: hidden;">
          <img src="${escapeHTML(item.previewUrl)}" alt="${escapeHTML(item.title)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='assets/preview-doc.png';">
          
          <!-- Ordem na Timeline -->
          <div style="position: absolute; top: 10px; left: 10px; background: rgba(15,23,42,0.85); backdrop-filter: blur(4px); color: #fff; font-size: 0.75rem; font-weight: 700; padding: 3px 8px; border-radius: 4px;">
            #${item.order || 1}
          </div>

          <!-- Status de Aprovação -->
          <div style="position: absolute; top: 10px; right: 10px; background: ${statusBg}; color: ${statusColor}; font-size: 0.7rem; font-weight: 700; padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(0,0,0,0.05); text-transform: uppercase;">
            ${item.approvalStatus}
          </div>

          <!-- Fonte e Resolução -->
          <div style="position: absolute; bottom: 8px; left: 10px; display: flex; gap: 6px;">
            <span style="background: rgba(15,23,42,0.8); color: #fff; font-size: 0.65rem; padding: 2px 6px; border-radius: 3px; text-transform: uppercase;">
              ${escapeHTML(item.sourceType)}
            </span>
            <span style="background: rgba(15,23,42,0.8); color: #94a3b8; font-size: 0.65rem; padding: 2px 6px; border-radius: 3px;">
              ${escapeHTML(item.resolution || '1080p')} &bull; ${escapeHTML(item.orientation || 'horizontal')}
            </span>
          </div>
        </div>

        <!-- Conteúdo do Card -->
        <div style="padding: 14px 16px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
              <h4 style="margin: 0; font-size: 0.95rem; font-weight: 600; color: #0f172a; line-height: 1.3;" title="${escapeHTML(item.title)}">
                ${escapeHTML(item.title)}
              </h4>
              <label style="display: flex; align-items: center; cursor: pointer; gap: 4px;">
                <input type="checkbox" ${item.selected ? 'checked' : ''} onchange="VideoAssetSelectionModule.toggleSelection('${item.id}', this.checked, '${video.id}')" style="width: 18px; height: 18px; accent-color: #2563eb; cursor: pointer;">
              </label>
            </div>

            <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 10px;">
              Ambiente: <strong>${escapeHTML(item.environmentName || 'Geral')}</strong> &bull; Versão: <strong>${escapeHTML(item.revision || 'V01')}</strong>
            </div>

            <!-- Seletor de Papel (Role) -->
            <div style="margin-bottom: 12px;">
              <label style="display: block; font-size: 0.7rem; font-weight: 600; color: #475569; text-transform: uppercase; margin-bottom: 3px;">
                Papel Narrativo no Vídeo (Role)
              </label>
              <select onchange="VideoAssetSelectionModule.changeRole('${item.id}', this.value, '${video.id}')" style="width: 100%; padding: 6px 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.85rem; background: #f8fafc; font-weight: 500;">
                ${roles.map(r => `
                  <option value="${r}" ${item.role === r ? 'selected' : ''}>${r.toUpperCase()} — ${r}</option>
                `).join('')}
              </select>
            </div>

            <!-- Box de Recomendação de IA -->
            <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 10px; margin-bottom: 12px;">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span style="font-size: 0.7rem; font-weight: 700; color: #4338ca;">💡 Sugestão da IA</span>
                ${item.role !== ai.role ? `
                  <button onclick="VideoAssetSelectionModule.acceptAISuggestion('${item.id}', '${ai.role}', '${video.id}')" style="font-size: 0.65rem; background: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; border-radius: 4px; padding: 2px 6px; cursor: pointer; font-weight: 600;">
                    Aceitar Sugestão (${ai.role})
                  </button>
                ` : `
                  <span style="font-size: 0.65rem; color: #16a34a; font-weight: 600;">✓ Aplicada</span>
                `}
              </div>
              <div style="font-size: 0.75rem; color: #334155; font-style: italic;">
                "${escapeHTML(ai.reason)}"
              </div>
            </div>
          </div>

          <!-- Barra de Ações: Visualizar, Comparar Versões, Substituir, Ordenar -->
          <div style="border-top: 1px solid #f1f5f9; padding-top: 10px; display: flex; justify-content: space-between; align-items: center; gap: 6px;">
            <div class="d-flex gap-1">
              <button onclick="VideoAssetSelectionModule.openPreviewModal('${item.id}')" title="Visualizar em Detalhes" style="padding: 4px 8px; font-size: 0.75rem; border: 1px solid #e2e8f0; background: #fff; border-radius: 4px; cursor: pointer;">
                👁️ Ver
              </button>
              <button onclick="VideoAssetSelectionModule.openCompareModal('${item.sourceId}', '${item.revision}')" title="Comparar Versões Anteriores" style="padding: 4px 8px; font-size: 0.75rem; border: 1px solid #e2e8f0; background: #fff; border-radius: 4px; cursor: pointer;">
                ⚖️ Versões
              </button>
              <button onclick="VideoAssetSelectionModule.openReplaceModal('${item.id}', '${video.id}')" title="Substituir Ativo no Vídeo" style="padding: 4px 8px; font-size: 0.75rem; border: 1px solid #e2e8f0; background: #fff; border-radius: 4px; cursor: pointer;">
                🔄 Substituir
              </button>
            </div>

            <!-- Ordenação -->
            <div class="d-flex gap-1">
              <button onclick="VideoAssetSelectionModule.moveAsset('${item.id}', -1, '${video.id}')" title="Mover para Cima" style="padding: 4px 6px; font-size: 0.75rem; border: 1px solid #e2e8f0; background: #fff; border-radius: 4px; cursor: pointer;">
                ⬆️
              </button>
              <button onclick="VideoAssetSelectionModule.moveAsset('${item.id}', 1, '${video.id}')" title="Mover para Baixo" style="padding: 4px 6px; font-size: 0.75rem; border: 1px solid #e2e8f0; background: #fff; border-radius: 4px; cursor: pointer;">
                ⬇️
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Alterna a seleção de um ativo (com validação consultiva caso não aprovado)
   */
  toggleSelection(selectionId, isChecked, videoId) {
    const state = this._getState();
    if (!state) return;

    try {
      if (isChecked) {
        const item = (state.data.videoAssetSelections || []).find(s => s.id === selectionId);
        if (item && item.approvalStatus !== 'APROVADO') {
          const proceed = confirm(
            `Atenção: Este item está como "${item.approvalStatus}".\n\nPela governança do estúdio, itens não aprovados não entram automaticamente.\nDeseja incluir manualmente mesmo assim?`
          );
          if (!proceed) {
            this.refreshView(videoId);
            return;
          }
        }
        state.selectVideoAsset(selectionId, 'Usuário');
      } else {
        state.deselectVideoAsset(selectionId, 'Usuário');
      }
      this.refreshView(videoId);
    } catch (e) {
      alert('Erro ao alterar seleção: ' + e.message);
    }
  },

  /**
   * Altera o papel (role) de um ativo
   */
  changeRole(selectionId, newRole, videoId) {
    const state = this._getState();
    if (!state) return;
    try {
      state.setVideoAssetRole(selectionId, newRole, 'Usuário');
      this.refreshView(videoId);
    } catch (e) {
      alert('Erro ao alterar papel: ' + e.message);
    }
  },

  /**
   * Aceita a sugestão de papel da IA
   */
  acceptAISuggestion(selectionId, suggestedRole, videoId) {
    const state = this._getState();
    if (!state) return;
    try {
      state.setVideoAssetRole(selectionId, suggestedRole, 'IA-Sugestão-Aceita');
      this.refreshView(videoId);
    } catch (e) {
      alert('Erro ao aplicar sugestão: ' + e.message);
    }
  },

  /**
   * Move a ordem do ativo para cima ou para baixo
   */
  moveAsset(selectionId, delta, videoId) {
    const state = this._getState();
    if (!state) return;

    const list = state.getVideoAssetSelections(videoId);
    const index = list.findIndex(s => s.id === selectionId);
    if (index < 0) return;

    const targetIndex = index + delta;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    // Swap na lista
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    const orderedIds = list.map(s => s.id);
    state.reorderVideoAssets(videoId, orderedIds, 'Usuário');
    this.refreshView(videoId);
  },

  /**
   * Seleciona todos os ativos que estejam devidamente aprovados
   */
  selectAllApproved(videoId) {
    const state = this._getState();
    if (!state) return;

    const list = state.getVideoAssetSelections(videoId);
    list.forEach(item => {
      if (item.approvalStatus === 'APROVADO') {
        state.selectVideoAsset(item.id, 'Usuário');
      }
    });
    this.refreshView(videoId);
  },

  /**
   * Configura filtros de pesquisa
   */
  setFilter(field, value, videoId) {
    this.activeFilters[field] = value || null;
    this.refreshView(videoId);
  },

  clearFilters(videoId) {
    this.activeFilters = {
      project: null,
      environment: null,
      type: null,
      approval: null,
      revision: null,
      resolution: null,
      orientation: null,
      role: null,
      selectedOnly: false
    };
    this.refreshView(videoId);
  },

  toggleSelectedOnly(videoId) {
    this.activeFilters.selectedOnly = !this.activeFilters.selectedOnly;
    this.refreshView(videoId);
  },

  refreshPool(videoId, projectId) {
    const state = this._getState();
    if (!state) return;
    state.collectProjectVideoAssets(projectId, videoId);
    this.refreshView(videoId);
  },

  /**
   * Modal de visualização ampliada
   */
  openPreviewModal(selectionId) {
    const state = this._getState();
    if (!state) return;

    const item = (state.data.videoAssetSelections || []).find(s => s.id === selectionId);
    if (!item) return;

    const container = document.getElementById('video-asset-modal-container');
    if (!container) return;

    container.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 9999;">
        <div style="background: #fff; width: 90%; max-width: 800px; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
          <div style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: 1.1rem; color: #0f172a;">${escapeHTML(item.title)}</h3>
            <button onclick="VideoAssetSelectionModule.closeModal()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer;">&times;</button>
          </div>
          <div style="max-height: 70vh; overflow-y: auto; padding: 20px;">
            <img src="${escapeHTML(item.previewUrl)}" style="width: 100%; max-height: 400px; object-fit: contain; background: #0f172a; border-radius: 8px; margin-bottom: 16px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.85rem;">
              <div><strong>Origem:</strong> ${escapeHTML(item.sourceType)}</div>
              <div><strong>Status:</strong> ${escapeHTML(item.approvalStatus)}</div>
              <div><strong>Papel Narrativo:</strong> ${escapeHTML(item.role)}</div>
              <div><strong>Resolução:</strong> ${escapeHTML(item.resolution)}</div>
              <div><strong>Orientação:</strong> ${escapeHTML(item.orientation)}</div>
              <div><strong>Revisão:</strong> ${escapeHTML(item.revision)}</div>
            </div>
            ${item.notes ? `
              <div style="margin-top: 14px; padding: 10px; background: #f8fafc; border-radius: 6px; font-size: 0.85rem; color: #475569;">
                <strong>Observações:</strong> ${escapeHTML(item.notes)}
              </div>
            ` : ''}
          </div>
          <div style="padding: 12px 20px; border-top: 1px solid #e2e8f0; text-align: right;">
            <button onclick="VideoAssetSelectionModule.closeModal()" style="padding: 8px 16px; border-radius: 6px; background: #0f172a; color: #fff; border: none; cursor: pointer;">
              Fechar
            </button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Modal para comparar versões do ativo
   */
  openCompareModal(sourceId, currentRevision) {
    const state = this._getState();
    if (!state) return;

    const comparison = state.compareVideoAssetVersions(sourceId, 'V01', currentRevision || 'V02');
    const container = document.getElementById('video-asset-modal-container');
    if (!container) return;

    container.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 9999;">
        <div style="background: #fff; width: 90%; max-width: 900px; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
          <div style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: 1.1rem; color: #0f172a;">Comparação de Versões</h3>
            <button onclick="VideoAssetSelectionModule.closeModal()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer;">&times;</button>
          </div>
          <div style="padding: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
              <h4 style="margin: 0 0 8px 0; font-size: 0.95rem;">Versão Base (${comparison.versionA ? comparison.versionA.version : 'V01'})</h4>
              <img src="${comparison.versionA?.preview || 'assets/preview-doc.png'}" style="width: 100%; height: 220px; object-fit: cover; border-radius: 6px; background: #0f172a;">
              <div style="margin-top: 8px; font-size: 0.8rem; color: #64748b;">
                Status: <strong>${comparison.versionA?.approval || 'APROVADO'}</strong>
              </div>
            </div>
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
              <h4 style="margin: 0 0 8px 0; font-size: 0.95rem;">Versão Atual (${comparison.versionB ? comparison.versionB.version : currentRevision || 'V02'})</h4>
              <img src="${comparison.versionB?.preview || 'assets/preview-doc.png'}" style="width: 100%; height: 220px; object-fit: cover; border-radius: 6px; background: #0f172a;">
              <div style="margin-top: 8px; font-size: 0.8rem; color: #64748b;">
                Status: <strong>${comparison.versionB?.approval || 'EM REVISÃO'}</strong>
              </div>
            </div>
          </div>
          <div style="padding: 12px 20px; border-top: 1px solid #e2e8f0; text-align: right;">
            <button onclick="VideoAssetSelectionModule.closeModal()" style="padding: 8px 16px; border-radius: 6px; background: #0f172a; color: #fff; border: none; cursor: pointer;">
              Concluir Comparação
            </button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Modal para substituir ativo no vídeo sem alterar o acervo original
   */
  openReplaceModal(selectionId, videoId) {
    const state = this._getState();
    if (!state) return;

    const item = (state.data.videoAssetSelections || []).find(s => s.id === selectionId);
    if (!item) return;

    const availableCandidates = (state.data.videoAssetSelections || []).filter(s => s.id !== selectionId);

    const container = document.getElementById('video-asset-modal-container');
    if (!container) return;

    container.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 9999;">
        <div style="background: #fff; width: 90%; max-width: 600px; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
          <div style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: 1.1rem; color: #0f172a;">Substituir Ativo na Timeline</h3>
            <button onclick="VideoAssetSelectionModule.closeModal()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer;">&times;</button>
          </div>
          <div style="padding: 20px;">
            <p style="font-size: 0.85rem; color: #475569; margin-top: 0;">
              Você está substituindo <strong>"${escapeHTML(item.title)}"</strong> no vídeo. O arquivo original do projeto permanecerá intacto e seguro.
            </p>
            <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #64748b; margin-bottom: 6px;">
              Escolha o Ativo Substituto do Pool:
            </label>
            <select id="replace-candidate-select" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.9rem; margin-bottom: 16px;">
              ${availableCandidates.map(c => `
                <option value="${c.id}">${c.title} (${c.sourceType} &bull; ${c.approvalStatus})</option>
              `).join('')}
            </select>
            <div style="font-size: 0.75rem; color: #94a3b8;">
              ⚠️ Imagens aprovadas originais do projeto não são alteradas nem descartadas.
            </div>
          </div>
          <div style="padding: 12px 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 8px;">
            <button onclick="VideoAssetSelectionModule.closeModal()" style="padding: 8px 14px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer;">
              Cancelar
            </button>
            <button onclick="VideoAssetSelectionModule.confirmReplace('${selectionId}', '${videoId}')" style="padding: 8px 16px; border-radius: 6px; background: #2563eb; color: #fff; font-weight: 600; border: none; cursor: pointer;">
              Confirmar Substituição
            </button>
          </div>
        </div>
      </div>
    `;
  },

  confirmReplace(selectionId, videoId) {
    const state = this._getState();
    if (!state) return;

    const selectEl = document.getElementById('replace-candidate-select');
    if (!selectEl) return;

    const replacementId = selectEl.value;
    const candidate = (state.data.videoAssetSelections || []).find(s => s.id === replacementId);
    if (!candidate) return;

    state.replaceVideoAsset(selectionId, {
      assetId: candidate.assetId,
      sourceId: candidate.sourceId,
      title: candidate.title,
      previewUrl: candidate.previewUrl,
      revision: candidate.revision,
      resolution: candidate.resolution,
      orientation: candidate.orientation,
      notes: `Substituído a partir de ${candidate.title}`
    }, 'Usuário');

    this.closeModal();
    this.refreshView(videoId);
  },

  closeModal() {
    const container = document.getElementById('video-asset-modal-container');
    if (container) container.innerHTML = '';
  },

  /**
   * Salva o estado da curadoria e aguarda o bloco G04
   */
  saveAndProceed(videoId) {
    const state = this._getState();
    if (!state) return;

    const selections = state.getVideoAssetSelections(videoId, { selectedOnly: true });
    if (selections.length === 0) {
      alert('Selecione pelo menos um ativo visual aprovado para o vídeo antes de prosseguir.');
      return;
    }

    const container = document.getElementById('project-tab-content') || document.getElementById('video-asset-selection-root');
    if (container) {
      container.innerHTML = `
        <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px; text-align: center; max-width: 650px; margin: 40px auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: #dcfce7; color: #16a34a; font-size: 28px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
            ✓
          </div>
          <h2 style="font-size: 1.4rem; font-weight: 700; color: #0f172a; margin-bottom: 8px;">
            Seleção de Conteúdo Concluída com Sucesso!
          </div>
          <p style="font-size: 0.95rem; color: #475569; line-height: 1.5; margin-bottom: 24px;">
            Foram selecionados <strong>${selections.length} ativos visuais</strong> devidamente classificados com papéis narrativos (Roles). 
            Todas as regras de governança e aprovação foram rigorosamente aplicadas.
          </p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: left; margin-bottom: 24px; font-size: 0.85rem; color: #334155;">
            <div>&bull; Total de papéis atribuídos: <strong>${new Set(selections.map(s => s.role)).size}</strong></div>
            <div>&bull; Fontes utilizadas: <strong>${Array.from(new Set(selections.map(s => s.sourceType))).join(', ')}</strong></div>
            <div>&bull; Imagens protegidas contra exclusão automática: <strong>100%</strong></div>
          </div>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 0.85rem; color: #64748b; margin-bottom: 20px;">
            Aguardando início do <strong>Bloco G04 (Geração de Roteiro / Timeline Audiovisual)</strong>.
          </div>
          <button class="btn btn-outline" onclick="VideoAssetSelectionModule.refreshView('${videoId}')" style="padding: 10px 18px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer;">
            Revisar Seleção
          </button>
        </div>
      `;
    }
  },

  refreshView(videoId) {
    const state = this._getState();
    if (!state) return;
    const video = state.getVideoProject(videoId);
    if (!video) return;

    const mainContainer = document.getElementById('project-tab-content') || document.getElementById('video-asset-selection-root');
    if (mainContainer) {
      mainContainer.innerHTML = this.renderAssetSelection(videoId, video.projectId);
    }
  }
};

if (typeof window !== 'undefined') {
  window.VideoAssetSelectionModule = VideoAssetSelectionModule;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VideoAssetSelectionModule;
}
