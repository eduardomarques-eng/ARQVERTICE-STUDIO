/**
 * ============================================================================
 * ARQVERTICE STUDIO — BLOCO G04: NARRATIVE ENGINE DO VÍDEO
 * (VIDEO NARRATIVE ENGINE & TIMELINE MODULE)
 * ============================================================================
 * Sistema responsável por transformar os elementos visuais selecionados em
 * uma sequência narrativa arquitetônica coerente.
 *
 * ESTRUTURA PADRÃO:
 * ABERTURA ↓ CONTEXTO ↓ CONCEITO ↓ AMBIENTE ↓ DETALHES ↓ MATERIAIS ↓ COMPOSIÇÃO ↓ RESULTADO ↓ ENCERRAMENTO.
 *
 * ESTRUTURAS FLEXÍVEIS:
 * - Vídeo de Ambiente: ABERTURA → PLANTA → ENTRADA → VISTA PRINCIPAL → DETALHES → MATERIAIS → MOBILIÁRIO → ENCERRAMENTO.
 * - Vídeo de Projeto: CONTEXTO → CONCEITO → PLANTA → AMBIENTES → PERSPECTIVAS → MATERIAIS → RESULTADO.
 * - Vídeo de Moodboard: REFERÊNCIA → PALETA → MATERIAL → MOBILIÁRIO → TEXTURA → ATMOSFERA → RESULTADO.
 *
 * OPERAÇÕES PERMITIDAS:
 * - Rearranjo (Reordenar sequência)
 * - Duplicação (Clonar cena mantendo atributos)
 * - Exclusão (Remover cena com re-sequenciamento)
 * - Inserir Nova Cena (Em qualquer posição)
 * - Sugestão de Narrativa por IA (Roteiro, voz e ritmo)
 * - Visualização em Timeline Interativa
 *
 * REGRA CRÍTICA DE GOVERNANÇA:
 * - "Nunca substituir automaticamente narrativa aprovada."
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

const VideoNarrativeEngineModule = {
  activeVideoId: null,
  activeProjectId: null,

  _getState() {
    if (typeof StudioState !== 'undefined') return StudioState;
    if (typeof window !== 'undefined' && window.StudioState) return window.StudioState;
    if (typeof require !== 'undefined') {
      try { return require('./state.js'); } catch (e) {}
    }
    return null;
  },

  /**
   * Renderiza a interface completa do Narrative Engine
   */
  renderNarrativeEngine(videoId, projectId) {
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
        <div class="p-5 text-center" style="background: #fff; border-radius: 8px; border: 1px solid #e2e8f0;">
          <h3>Nenhum projeto de vídeo selecionado</h3>
          <p class="text-muted">Selecione ou crie um projeto de vídeo primeiro na aba de Produção Audiovisual.</p>
        </div>
      `;
    }

    this.activeVideoId = video.id;
    this.activeProjectId = video.projectId;

    const project = state.getProject(video.projectId) || { id: video.projectId, name: 'Projeto' };

    // Recupera cenas narrativas existentes
    let scenes = state.getNarrativeScenes(video.id);

    // Se não houver cenas ainda, sugere automaticamente a narrativa se não for aprovada
    if (scenes.length === 0 && !video.isNarrativeApproved) {
      try {
        scenes = state.suggestNarrativeForVideo(video.id, { user: 'IA Narrative Engine (Auto)' });
      } catch (err) {
        scenes = [];
      }
    }

    // Calcula métricas da narrativa
    const totalDuration = scenes.reduce((acc, s) => acc + (Number(s.duration) || 0), 0);
    const scenesCount = scenes.length;
    const isApproved = video.isNarrativeApproved || scenes.some(s => s.isApproved);
    const structureBeats = state.getNarrativeStructureForVideo(video.type);

    return `
      <div class="video-narrative-root" id="video-narrative-root" style="padding: 24px; max-width: 1400px; margin: 0 auto;">
        <!-- Cabeçalho -->
        <div class="d-flex justify-content-between align-items-center mb-4 pb-3" style="border-bottom: 1px solid #e2e8f0;">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="badge" style="background: #0f172a; color: #fff; font-size: 0.75rem; font-weight: 600; padding: 4px 8px; border-radius: 4px;">BLOCO G04</span>
              <span class="text-muted" style="font-size: 0.85rem;">Narrative Engine & Roteirização Audiovisual</span>
              ${isApproved ? `
                <span class="badge" style="background: #dcfce7; color: #15803d; font-size: 0.75rem; font-weight: 700; padding: 4px 8px; border-radius: 4px; border: 1px solid #bbf7d0;">
                  ✓ NARRATIVA APROVADA
                </span>
              ` : `
                <span class="badge" style="background: #fef9c3; color: #a16207; font-size: 0.75rem; font-weight: 700; padding: 4px 8px; border-radius: 4px; border: 1px solid #fef08a;">
                  EM ROTEIRIZAÇÃO
                </span>
              `}
            </div>
            <h2 style="font-size: 1.5rem; font-weight: 700; margin: 0; color: #0f172a;">${escapeHTML(video.title)}</h2>
            <div style="font-size: 0.85rem; color: #64748b; margin-top: 4px;">
              Projeto: <strong>${escapeHTML(project.name)}</strong> &bull; Tipo: <strong>${escapeHTML(video.type)}</strong> &bull; Duração Total: <strong>${totalDuration.toFixed(1)}s</strong> (${scenesCount} cenas)
            </div>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-outline" onclick="VideoNarrativeEngineModule.triggerAISuggestion('${video.id}', ${isApproved})" style="padding: 8px 14px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer; display: flex; align-items: center; gap: 6px;">
              ✨ ${isApproved ? 'Sugerir com IA (Bloqueado)' : 'Sugerir Narrativa com IA'}
            </button>
            <button class="btn btn-outline" onclick="VideoNarrativeEngineModule.openInsertModal('${video.id}')" style="padding: 8px 14px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer;">
              ➕ Inserir Nova Cena
            </button>
            ${!isApproved ? `
              <button class="btn btn-outline" onclick="VideoNarrativeEngineModule.approveNarrative('${video.id}')" style="padding: 8px 14px; border-radius: 6px; border: 1px solid #16a34a; background: #f0fdf4; color: #15803d; font-weight: 600; cursor: pointer;">
                ✓ Homologar Narrativa
              </button>
            ` : ''}
            <button class="btn btn-primary" onclick="VideoNarrativeEngineModule.finishAndProceed('${video.id}')" style="padding: 8px 16px; border-radius: 6px; background: #2563eb; color: #fff; font-weight: 600; border: none; cursor: pointer;">
              Concluir G04 &rarr;
            </button>
          </div>
        </div>

        <!-- Banner de Governança -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid ${isApproved ? '#16a34a' : '#2563eb'}; padding: 12px 18px; border-radius: 6px; margin-bottom: 24px;">
          <div style="font-weight: 600; font-size: 0.9rem; color: #1e293b; margin-bottom: 2px;">
            🔒 Governança de Roteiro e Narrativa
          </div>
          <div style="font-size: 0.85rem; color: #475569; line-height: 1.5;">
            ${isApproved 
              ? '<strong>Esta narrativa está formalmente aprovada.</strong> Nenhuma IA ou rotina automática tem permissão para sobrescrever ou alterar as cenas sem desbloqueio explícito do arquiteto.'
              : 'A IA sugere a sequência e o texto descritivo com base nos ativos homologados, mas o rearranjo, acréscimos e edições finais permanecem sob seu controle.'
            }
          </div>
        </div>

        <!-- Barra de Estrutura Narrativa Flexível -->
        <div style="background: #fff; border: 1px solid #e2e8f0; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px;">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span style="font-size: 0.8rem; font-weight: 700; color: #64748b; text-transform: uppercase;">
              Estrutura Narrativa Aplicada: <strong>${escapeHTML(video.type)}</strong>
            </span>
            <span style="font-size: 0.8rem; color: #94a3b8;">${structureBeats.length} atos narrativos planejados</span>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
            ${structureBeats.map((beat, idx) => `
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="background: #0f172a; color: #fff; font-size: 0.75rem; font-weight: 600; padding: 4px 10px; border-radius: 4px;">
                  ${beat}
                </span>
                ${idx < structureBeats.length - 1 ? '<span style="color: #94a3b8; font-weight: bold;">&rarr;</span>' : ''}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- =================================================================== -->
        <!-- VISUALIZAÇÃO EM TIMELINE (TIMELINE VIEW INTERATIVA) -->
        <!-- =================================================================== -->
        <div style="background: #0f172a; border-radius: 10px; padding: 20px; color: #fff; margin-bottom: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div style="font-weight: 600; font-size: 0.95rem; display: flex; align-items: center; gap: 8px;">
              <span>🎞️ Visualização em Timeline Audiovisual</span>
              <span style="font-size: 0.75rem; background: rgba(255,255,255,0.15); padding: 2px 8px; border-radius: 4px;">
                Tempo Total: ${totalDuration.toFixed(1)}s
              </span>
            </div>
            <div style="font-size: 0.75rem; color: #94a3b8;">
              Arraste ou use os controles de seta para rearranjar cenas
            </div>
          </div>

          <!-- Régua de Tempo da Timeline -->
          <div style="display: flex; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 4px; margin-bottom: 12px; font-size: 0.7rem; color: #94a3b8;">
            <div style="width: 20px;">0s</div>
            <div style="flex: 1; text-align: center;">${(totalDuration / 2).toFixed(1)}s</div>
            <div style="width: 40px; text-align: right;">${totalDuration.toFixed(1)}s</div>
          </div>

          <!-- Faixa Horizontal de Cenas (Track) -->
          <div class="timeline-track" style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 12px;">
            ${scenes.map((scene, idx) => this.renderTimelineBlock(scene, idx, scenes.length, totalDuration, video)).join('')}
          </div>
        </div>

        <!-- =================================================================== -->
        <!-- LISTA DETALHADA DE CENAS NARRATIVAS (BEATS CARDS) -->
        <!-- =================================================================== -->
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: #0f172a;">
            Sequência Roteirizada de Cenas (${scenes.length})
          </h3>
          <div style="font-size: 0.85rem; color: #64748b;">
            Permite rearranjo, duplicação, exclusão e inserção
          </div>
        </div>

        <div class="narrative-scenes-list" style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 40px;">
          ${scenes.length === 0 ? `
            <div style="padding: 40px; text-align: center; background: #fff; border: 1px dashed #cbd5e1; border-radius: 8px;">
              <p style="color: #64748b; margin-bottom: 12px;">Nenhuma cena narrativa gerada ainda para este vídeo.</p>
              <button class="btn btn-primary" onclick="VideoNarrativeEngineModule.triggerAISuggestion('${video.id}', false)">
                ✨ Gerar Narrativa com IA
              </button>
            </div>
          ` : scenes.map((scene, idx) => this.renderSceneCard(scene, idx, scenes.length, video)).join('')}
        </div>

        <!-- Rodapé e Conclusão -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 24px; display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 0.85rem; color: #64748b;">
            Etapa concluída: <strong>G04 — Narrative Engine</strong>. Aguarde o Bloco G05.
          </div>
          <div class="d-flex gap-3">
            <button class="btn btn-outline" onclick="VideoNarrativeEngineModule.openInsertModal('${video.id}')" style="padding: 10px 16px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer;">
              ➕ Inserir Cena
            </button>
            <button class="btn btn-primary" onclick="VideoNarrativeEngineModule.finishAndProceed('${video.id}')" style="padding: 10px 22px; border-radius: 6px; background: #0f172a; color: #fff; font-weight: 600; border: none; cursor: pointer;">
              Homologar & Finalizar G04 &rarr;
            </button>
          </div>
        </div>

        <!-- Container de Modais -->
        <div id="narrative-engine-modal-container"></div>
      </div>
    `;
  },

  /**
   * Renderiza um bloco proporcional dentro da visualização em timeline horizontal
   */
  renderTimelineBlock(scene, idx, totalCount, totalDuration, video) {
    const widthPercent = totalDuration > 0
      ? Math.max(12, Math.min(35, (scene.duration / totalDuration) * 100))
      : (100 / totalCount);

    return `
      <div class="timeline-scene-block" style="flex: 0 0 ${widthPercent}%; min-width: 140px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; padding: 10px; position: relative; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span style="font-size: 0.75rem; font-weight: 700; color: #38bdf8;">#${scene.sequence}</span>
            <span style="font-size: 0.65rem; background: rgba(255,255,255,0.15); padding: 2px 6px; border-radius: 3px;">
              ${scene.duration}s
            </span>
          </div>
          <div style="font-size: 0.75rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHTML(scene.title)}">
            ${escapeHTML(scene.title)}
          </div>
          <div style="font-size: 0.65rem; color: #94a3b8; text-transform: uppercase; margin-top: 2px;">
            ${escapeHTML(scene.purpose)}
          </div>
        </div>

        <div style="margin-top: 10px; font-size: 0.65rem; color: #cbd5e1; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 6px; display: flex; justify-content: space-between; align-items: center;">
          <span>⤹ ${escapeHTML(scene.transition || 'crossfade')}</span>
          <span>${(scene.assetIds || []).length} ativo(s)</span>
        </div>
      </div>
    `;
  },

  /**
   * Renderiza o card detalhado da cena com ações completas
   */
  renderSceneCard(scene, idx, totalCount, video) {
    const state = this._getState();
    const assets = state ? (state.data.videoAssetSelections || []).filter(a => (scene.assetIds || []).includes(a.id)) : [];

    return `
      <div class="narrative-scene-card" id="nscene-${scene.id}" style="background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
        <div class="d-flex justify-content-between align-items-start mb-3">
          <div class="d-flex align-items-center gap-3">
            <div style="background: #0f172a; color: #fff; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1rem;">
              #${scene.sequence}
            </div>
            <div>
              <div class="d-flex align-items-center gap-2">
                <span class="badge" style="background: #eff6ff; color: #1d4ed8; font-size: 0.75rem; font-weight: 600; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">
                  ${escapeHTML(scene.purpose)}
                </span>
                <span style="font-size: 0.8rem; color: #64748b;">
                  Duração: <strong>${scene.duration}s</strong> &bull; Transição: <strong>${escapeHTML(scene.transition)}</strong>
                </span>
                ${scene.isApproved ? '<span class="badge" style="background: #dcfce7; color: #15803d; font-size: 0.7rem; font-weight: 700; padding: 2px 6px; border-radius: 3px;">✓ APROVADA</span>' : ''}
              </div>
              <h4 style="margin: 4px 0 0 0; font-size: 1.05rem; font-weight: 700; color: #0f172a;">
                ${escapeHTML(scene.title)}
              </h4>
            </div>
          </div>

          <!-- Controles de Rearranjo, Duplicação, Edição e Exclusão -->
          <div class="d-flex gap-1">
            <button onclick="VideoNarrativeEngineModule.moveScene('${scene.id}', -1, '${video.id}')" title="Mover para Cima (Rearranjo)" style="padding: 6px 10px; border: 1px solid #e2e8f0; background: #fff; border-radius: 4px; cursor: pointer;">
              ⬆️
            </button>
            <button onclick="VideoNarrativeEngineModule.moveScene('${scene.id}', 1, '${video.id}')" title="Mover para Baixo (Rearranjo)" style="padding: 6px 10px; border: 1px solid #e2e8f0; background: #fff; border-radius: 4px; cursor: pointer;">
              ⬇️
            </button>
            <button onclick="VideoNarrativeEngineModule.duplicateScene('${scene.id}', '${video.id}')" title="Duplicar Cena" style="padding: 6px 10px; border: 1px solid #e2e8f0; background: #fff; border-radius: 4px; cursor: pointer;">
              📋 Duplicar
            </button>
            <button onclick="VideoNarrativeEngineModule.openEditModal('${scene.id}')" title="Editar Cena" style="padding: 6px 10px; border: 1px solid #e2e8f0; background: #fff; border-radius: 4px; cursor: pointer;">
              ✏️ Editar
            </button>
            <button onclick="VideoNarrativeEngineModule.deleteScene('${scene.id}', '${video.id}', ${scene.isApproved})" title="Excluir Cena" style="padding: 6px 10px; border: 1px solid #fee2e2; background: #fff; color: #b91c1c; border-radius: 4px; cursor: pointer;">
              🗑️
            </button>
          </div>
        </div>

        <!-- Conteúdo Textual & Locução (Script) -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f8fafc; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
          <div>
            <div style="font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">
              💬 Texto em Tela (Legenda / Lettering)
            </div>
            <div style="font-size: 0.85rem; color: #1e293b; line-height: 1.4;">
              ${escapeHTML(scene.text || 'Nenhum lettering configurado')}
            </div>
          </div>
          <div>
            <div style="font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">
              🎙️ Locução / Voiceover Roteirizada
            </div>
            <div style="font-size: 0.85rem; color: #1e293b; font-style: italic; line-height: 1.4;">
              "${escapeHTML(scene.voiceover || 'Sem locução')}"
            </div>
          </div>
        </div>

        <!-- Ativos Associados à Cena -->
        <div>
          <div style="font-size: 0.75rem; font-weight: 700; color: #475569; margin-bottom: 8px;">
            Ativos Vinculados a esta Cena (${assets.length}):
          </div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            ${assets.length === 0 ? `
              <span style="font-size: 0.75rem; color: #94a3b8;">Nenhum ativo associado diretamente.</span>
            ` : assets.map(a => `
              <div style="display: flex; align-items: center; gap: 8px; background: #fff; border: 1px solid #e2e8f0; padding: 4px 8px; border-radius: 6px;">
                <img src="${escapeHTML(a.previewUrl)}" style="width: 32px; height: 32px; object-fit: cover; border-radius: 4px;" onerror="this.src='assets/preview-doc.png'">
                <div style="font-size: 0.75rem;">
                  <div style="font-weight: 600; color: #0f172a; max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(a.title)}</div>
                  <div style="color: #64748b; font-size: 0.65rem;">${escapeHTML(a.sourceType)} &bull; ${escapeHTML(a.role)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Dispara a sugestão de narrativa por IA respeitando a governança
   */
  triggerAISuggestion(videoId, isApproved) {
    const state = this._getState();
    if (!state) return;

    if (isApproved) {
      alert('Operação Bloqueada pela Governança:\nEsta narrativa já está aprovada. O sistema não pode substituí-la automaticamente.');
      return;
    }

    try {
      state.suggestNarrativeForVideo(videoId, { user: 'Usuário (Manual Trigger)' });
      this.refreshView(videoId);
    } catch (e) {
      alert('Aviso: ' + e.message);
    }
  },

  /**
   * Rearranjo: move cena para cima ou para baixo
   */
  moveScene(sceneId, delta, videoId) {
    const state = this._getState();
    if (!state) return;

    const scenes = state.getNarrativeScenes(videoId);
    const index = scenes.findIndex(s => s.id === sceneId);
    if (index < 0) return;

    const targetIndex = index + delta;
    if (targetIndex < 0 || targetIndex >= scenes.length) return;

    const temp = scenes[index];
    scenes[index] = scenes[targetIndex];
    scenes[targetIndex] = temp;

    const orderedIds = scenes.map(s => s.id);
    state.reorderNarrativeScenes(videoId, orderedIds, 'Usuário');
    this.refreshView(videoId);
  },

  /**
   * Duplicação: clona uma cena narrativa
   */
  duplicateScene(sceneId, videoId) {
    const state = this._getState();
    if (!state) return;
    try {
      state.duplicateNarrativeScene(sceneId, 'Usuário');
      this.refreshView(videoId);
    } catch (e) {
      alert('Erro ao duplicar cena: ' + e.message);
    }
  },

  /**
   * Exclusão: remove uma cena narrativa com verificação
   */
  deleteScene(sceneId, videoId, isApproved) {
    const state = this._getState();
    if (!state) return;

    if (isApproved) {
      const confirmDel = confirm('Atenção: Esta cena está aprovada. Tem certeza de que deseja forçar a exclusão?');
      if (!confirmDel) return;
    } else {
      if (!confirm('Deseja realmente excluir esta cena?')) return;
    }

    try {
      state.deleteNarrativeScene(sceneId, 'Usuário', isApproved);
      this.refreshView(videoId);
    } catch (e) {
      alert('Erro ao excluir cena: ' + e.message);
    }
  },

  /**
   * Homologa/aprova a narrativa
   */
  approveNarrative(videoId) {
    const state = this._getState();
    if (!state) return;

    try {
      state.approveNarrative(videoId, 'Arquiteto');
      alert('Narrativa homologada com sucesso! Ela está protegida contra alterações automáticas.');
      this.refreshView(videoId);
    } catch (e) {
      alert('Erro ao aprovar narrativa: ' + e.message);
    }
  },

  /**
   * Modal para inserir nova cena narrativa
   */
  openInsertModal(videoId) {
    const state = this._getState();
    if (!state) return;

    const scenes = state.getNarrativeScenes(videoId);
    const container = document.getElementById('narrative-engine-modal-container');
    if (!container) return;

    const purposes = [
      'ABERTURA', 'CONTEXTO', 'CONCEITO', 'PLANTA', 'ENTRADA',
      'VISTA PRINCIPAL', 'AMBIENTE', 'PERSPECTIVAS', 'DETALHES',
      'MATERIAIS', 'MOBILIÁRIO', 'COMPOSIÇÃO', 'RESULTADO', 'ENCERRAMENTO'
    ];

    container.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 9999;">
        <div style="background: #fff; width: 90%; max-width: 600px; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
          <div style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: 1.1rem; color: #0f172a;">Inserir Nova Cena Narrativa</h3>
            <button onclick="VideoNarrativeEngineModule.closeModal()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer;">&times;</button>
          </div>
          <div style="padding: 20px;">
            <div style="margin-bottom: 12px;">
              <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #475569; margin-bottom: 4px;">Título da Cena</label>
              <input type="text" id="new-scene-title" placeholder="Ex.: Detalhe da Ilha Gourmet" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.9rem;">
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
              <div>
                <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #475569; margin-bottom: 4px;">Propósito / Beat</label>
                <select id="new-scene-purpose" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.9rem;">
                  ${purposes.map(p => `<option value="${p}">${p}</option>`).join('')}
                </select>
              </div>
              <div>
                <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #475569; margin-bottom: 4px;">Duração (segundos)</label>
                <input type="number" id="new-scene-duration" value="6.0" step="0.5" min="1" max="60" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.9rem;">
              </div>
            </div>

            <div style="margin-bottom: 12px;">
              <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #475569; margin-bottom: 4px;">Posição de Inserção</label>
              <select id="new-scene-position" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.9rem;">
                <option value="${scenes.length + 1}">No final (Posição #${scenes.length + 1})</option>
                ${scenes.map((s, idx) => `<option value="${idx + 1}">Antes da Cena #${idx + 1}: ${escapeHTML(s.title)}</option>`).join('')}
              </select>
            </div>

            <div style="margin-bottom: 12px;">
              <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #475569; margin-bottom: 4px;">Texto em Tela (Lettering)</label>
              <input type="text" id="new-scene-text" placeholder="Ex.: Bancada em Quartzo Branco Esculpido" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.9rem;">
            </div>

            <div style="margin-bottom: 12px;">
              <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #475569; margin-bottom: 4px;">Locução / Voiceover</label>
              <textarea id="new-scene-voiceover" rows="2" placeholder="Linha de narração para esta tomada..." style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.9rem;"></textarea>
            </div>
          </div>
          <div style="padding: 12px 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 8px;">
            <button onclick="VideoNarrativeEngineModule.closeModal()" style="padding: 8px 14px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer;">
              Cancelar
            </button>
            <button onclick="VideoNarrativeEngineModule.confirmInsertScene('${videoId}')" style="padding: 8px 16px; border-radius: 6px; background: #2563eb; color: #fff; font-weight: 600; border: none; cursor: pointer;">
              Adicionar Cena
            </button>
          </div>
        </div>
      </div>
    `;
  },

  confirmInsertScene(videoId) {
    const state = this._getState();
    if (!state) return;

    const title = document.getElementById('new-scene-title')?.value || 'Nova Cena';
    const purpose = document.getElementById('new-scene-purpose')?.value || 'AMBIENTE';
    const duration = parseFloat(document.getElementById('new-scene-duration')?.value || '6.0');
    const position = parseInt(document.getElementById('new-scene-position')?.value || '1', 10);
    const text = document.getElementById('new-scene-text')?.value || '';
    const voiceover = document.getElementById('new-scene-voiceover')?.value || '';

    state.insertNarrativeScene(videoId, {
      title,
      purpose,
      duration,
      text,
      voiceover,
      transition: 'crossfade'
    }, position, 'Usuário');

    this.closeModal();
    this.refreshView(videoId);
  },

  /**
   * Modal para editar cena narrativa existente
   */
  openEditModal(sceneId) {
    const state = this._getState();
    if (!state) return;

    const scene = (state.data.videoNarrativeScenes || []).find(s => s.id === sceneId);
    if (!scene) return;

    const container = document.getElementById('narrative-engine-modal-container');
    if (!container) return;

    const transitions = state.NARRATIVE_TRANSITIONS || ['crossfade', 'cut', 'fade_black', 'fade_white', 'dissolve'];

    container.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 9999;">
        <div style="background: #fff; width: 90%; max-width: 600px; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
          <div style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: 1.1rem; color: #0f172a;">Editar Cena #${scene.sequence}</h3>
            <button onclick="VideoNarrativeEngineModule.closeModal()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer;">&times;</button>
          </div>
          <div style="padding: 20px;">
            <div style="margin-bottom: 12px;">
              <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #475569; margin-bottom: 4px;">Título</label>
              <input type="text" id="edit-scene-title" value="${escapeHTML(scene.title)}" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.9rem;">
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
              <div>
                <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #475569; margin-bottom: 4px;">Duração (s)</label>
                <input type="number" id="edit-scene-duration" value="${scene.duration}" step="0.5" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.9rem;">
              </div>
              <div>
                <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #475569; margin-bottom: 4px;">Transição</label>
                <select id="edit-scene-transition" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.9rem;">
                  ${transitions.map(t => `<option value="${t}" ${scene.transition === t ? 'selected' : ''}>${t}</option>`).join('')}
                </select>
              </div>
            </div>

            <div style="margin-bottom: 12px;">
              <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #475569; margin-bottom: 4px;">Texto em Tela (Lettering)</label>
              <input type="text" id="edit-scene-text" value="${escapeHTML(scene.text || '')}" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.9rem;">
            </div>

            <div style="margin-bottom: 12px;">
              <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #475569; margin-bottom: 4px;">Locução / Voiceover</label>
              <textarea id="edit-scene-voiceover" rows="3" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.9rem;">${escapeHTML(scene.voiceover || '')}</textarea>
            </div>
          </div>
          <div style="padding: 12px 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 8px;">
            <button onclick="VideoNarrativeEngineModule.closeModal()" style="padding: 8px 14px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer;">
              Cancelar
            </button>
            <button onclick="VideoNarrativeEngineModule.confirmEditScene('${scene.id}')" style="padding: 8px 16px; border-radius: 6px; background: #2563eb; color: #fff; font-weight: 600; border: none; cursor: pointer;">
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    `;
  },

  confirmEditScene(sceneId) {
    const state = this._getState();
    if (!state) return;

    const title = document.getElementById('edit-scene-title')?.value;
    const duration = parseFloat(document.getElementById('edit-scene-duration')?.value || '5.0');
    const transition = document.getElementById('edit-scene-transition')?.value;
    const text = document.getElementById('edit-scene-text')?.value;
    const voiceover = document.getElementById('edit-scene-voiceover')?.value;

    const scene = state.updateNarrativeScene(sceneId, {
      title,
      duration,
      transition,
      text,
      voiceover
    }, 'Usuário');

    this.closeModal();
    if (scene) this.refreshView(scene.videoProjectId);
  },

  closeModal() {
    const container = document.getElementById('narrative-engine-modal-container');
    if (container) container.innerHTML = '';
  },

  finishAndProceed(videoId) {
    const state = this._getState();
    if (!state) return;

    const scenes = state.getNarrativeScenes(videoId);
    if (scenes.length === 0) {
      alert('Gere ou insira ao menos uma cena narrativa antes de prosseguir.');
      return;
    }

    const container = document.getElementById('project-tab-content') || document.getElementById('video-narrative-root');
    if (container) {
      container.innerHTML = `
        <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px; text-align: center; max-width: 650px; margin: 40px auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: #dcfce7; color: #16a34a; font-size: 28px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
            ✓
          </div>
          <h2 style="font-size: 1.4rem; font-weight: 700; color: #0f172a; margin-bottom: 8px;">
            Narrative Engine Concluído com Sucesso!
          </h2>
          <p style="font-size: 0.95rem; color: #475569; line-height: 1.5; margin-bottom: 24px;">
            A sequência narrativa contendo <strong>${scenes.length} cenas</strong> foi estruturada com sucesso. 
            Todos os atos, durações, roteiros e transições foram devidamente parametrizados.
          </p>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 0.85rem; color: #64748b; margin-bottom: 20px;">
            Aguardando início do <strong>Bloco G05 (Geração de Áudio e Locução)</strong>.
          </div>
          <button class="btn btn-outline" onclick="VideoNarrativeEngineModule.refreshView('${videoId}')" style="padding: 10px 18px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer;">
            Revisar Narrativa
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

    const mainContainer = document.getElementById('project-tab-content') || document.getElementById('video-narrative-root');
    if (mainContainer) {
      mainContainer.innerHTML = this.renderNarrativeEngine(videoId, video.projectId);
    }
  }
};

if (typeof window !== 'undefined') {
  window.VideoNarrativeEngineModule = VideoNarrativeEngineModule;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VideoNarrativeEngineModule;
}
