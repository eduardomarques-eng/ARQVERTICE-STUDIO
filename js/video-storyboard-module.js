/**
 * ============================================================================
 * ARQVERTICE STUDIO — BLOCO G06: STORYBOARD VISUAL
 * (VIDEO STORYBOARD & SEQUENTIAL PREVIEW MODULE)
 * ============================================================================
 * Módulo visual para visualização, validação de ritmo e aprovação do storyboard
 * antes da produção/renderização final.
 *
 * LAYOUT EM GRADE:
 * [01] [02] [03] [04]
 * [05] [06] [07] [08]
 *
 * CADA QUADRO CONTEMPLA:
 * - número, cena, duração, imagem, vídeo, movimento, texto,
 *   narração, áudio, transição e observações.
 *
 * OPERAÇÕES PERMITIDAS:
 * - reorder (arrasto ou setas)
 * - duplicar
 * - excluir (sem apagar automaticamente conteúdo)
 * - editar
 * - substituir asset
 * - preview sequencial interativo
 * - indicador de DURAÇÃO TOTAL com warning de ultrapassagem
 * - ajuste automático proporcional (somente mediante confirmação)
 *
 * REGRA MANDATÓRIA:
 * - Não gerar vídeo final neste momento (objetivo é validar a narrativa).
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

const VideoStoryboardModule = {
  activeVideoId: null,
  activeProjectId: null,
  previewIndex: 0,
  previewTimer: null,
  isPreviewPlaying: false,

  _getState() {
    if (typeof StudioState !== 'undefined') return StudioState;
    if (typeof window !== 'undefined' && window.StudioState) return window.StudioState;
    if (typeof require !== 'undefined') {
      try { return require('./state.js'); } catch (e) {}
    }
    return null;
  },

  /**
   * Renderiza a interface do Storyboard Visual
   */
  renderStoryboard(videoId, projectId) {
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
          <p class="text-muted">Selecione ou crie um projeto de vídeo primeiro.</p>
        </div>
      `;
    }

    this.activeVideoId = video.id;
    this.activeProjectId = video.projectId;

    const project = state.getProject(video.projectId) || { id: video.projectId, name: 'Projeto' };

    // Recupera ou gera storyboard inicial
    let storyboard = state.getStoryboard(video.id);
    let frames = state.getStoryboardFrames(video.id);

    if (!storyboard || frames.length === 0) {
      try {
        const gen = state.generateStoryboardFromNarrative(video.id, { user: 'Storyboard Engine Auto' });
        storyboard = gen.storyboard;
        frames = gen.frames;
      } catch (err) {
        storyboard = null;
        frames = [];
      }
    }

    const totalDuration = frames.reduce((acc, f) => acc + Number(f.durationSeconds || 0), 0);
    const targetDuration = Number(storyboard?.targetDurationSeconds || video.durationSeconds || 60.0);
    const isExceeded = totalDuration > targetDuration;
    const isApproved = storyboard?.isApproved || false;

    return `
      <div class="video-storyboard-root" id="video-storyboard-root" style="padding: 24px; max-width: 1400px; margin: 0 auto;">
        <!-- Cabeçalho -->
        <div class="d-flex justify-content-between align-items-center mb-4 pb-3" style="border-bottom: 1px solid #e2e8f0;">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="badge" style="background: #0f172a; color: #fff; font-size: 0.75rem; font-weight: 600; padding: 4px 8px; border-radius: 4px;">BLOCO G06</span>
              <span class="text-muted" style="font-size: 0.85rem;">Storyboard Visual & Validação de Narrativa</span>
              ${isApproved ? `
                <span class="badge" style="background: #dcfce7; color: #15803d; font-size: 0.75rem; font-weight: 700; padding: 4px 8px; border-radius: 4px; border: 1px solid #bbf7d0;">
                  ✓ STORYBOARD HOMOLOGADO
                </span>
              ` : `
                <span class="badge" style="background: #eff6ff; color: #1d4ed8; font-size: 0.75rem; font-weight: 700; padding: 4px 8px; border-radius: 4px; border: 1px solid #bfdbfe;">
                  EM VALIDAÇÃO DE RITMO
                </span>
              `}
            </div>
            <h2 style="font-size: 1.5rem; font-weight: 700; margin: 0; color: #0f172a;">${escapeHTML(video.title)}</h2>
            <div style="font-size: 0.85rem; color: #64748b; margin-top: 4px;">
              Projeto: <strong>${escapeHTML(project.name)}</strong> &bull; Total de Quadros: <strong>${frames.length}</strong>
            </div>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-outline" onclick="VideoStoryboardModule.openPreviewModal('${video.id}')" style="padding: 8px 14px; border-radius: 6px; border: 1px solid #2563eb; background: #eff6ff; color: #1d4ed8; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;">
              ▶️ Preview Sequencial
            </button>
            ${!isApproved ? `
              <button class="btn btn-outline" onclick="VideoStoryboardModule.approveStoryboard('${video.id}')" style="padding: 8px 14px; border-radius: 6px; border: 1px solid #16a34a; background: #f0fdf4; color: #15803d; font-weight: 600; cursor: pointer;">
                ✓ Homologar Storyboard
              </button>
            ` : ''}
            <button class="btn btn-primary" onclick="VideoStoryboardModule.finishAndProceed('${video.id}')" style="padding: 8px 16px; border-radius: 6px; background: #0f172a; color: #fff; font-weight: 600; border: none; cursor: pointer;">
              Concluir G06 &rarr;
            </button>
          </div>
        </div>

        <!-- Barra Indicadora de Duração Total com Alerta se Ultrapassar -->
        <div style="background: ${isExceeded ? '#fffbeb' : '#f8fafc'}; border: 1px solid ${isExceeded ? '#fde047' : '#e2e8f0'}; border-left: 5px solid ${isExceeded ? '#ca8a04' : '#10b981'}; padding: 14px 20px; border-radius: 8px; margin-bottom: 24px;">
          <div class="d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center gap-3">
              <span style="font-size: 1.4rem;">${isExceeded ? '⚠️' : '⏱️'}</span>
              <div>
                <div style="font-weight: 700; font-size: 0.95rem; color: ${isExceeded ? '#854d0e' : '#0f172a'};">
                  DURAÇÃO TOTAL: <strong>${totalDuration.toFixed(1)}s</strong> (META: <strong>${targetDuration.toFixed(1)}s</strong> configurados)
                </div>
                <div style="font-size: 0.8rem; color: ${isExceeded ? '#a16207' : '#64748b'};">
                  ${isExceeded 
                    ? `Atenção: A duração atual excede a meta configurada em ${(totalDuration - targetDuration).toFixed(1)}s. Ajuste manualmente os tempos ou use o ajuste proporcional.`
                    : 'A duração calculada dos quadros está perfeitamente alinhada à meta do vídeo.'
                  }
                </div>
              </div>
            </div>

            ${isExceeded ? `
              <div>
                <button onclick="VideoStoryboardModule.confirmAutoAdjust('${video.id}', ${targetDuration}, ${totalDuration})" style="padding: 8px 14px; background: #ca8a04; color: #fff; border: none; border-radius: 6px; font-weight: 600; font-size: 0.85rem; cursor: pointer;">
                  Ajustar Automaticamente
                </button>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Grade Visual do Storyboard: [01] [02] [03] [04] / [05] [06] [07] [08] -->
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: #0f172a;">
            Sequência Visual de Quadros (${frames.length})
          </h3>
          <div style="font-size: 0.8rem; color: #64748b;">
            Use as setas para reorganizar ou arraste para reposicionar na linha de tempo
          </div>
        </div>

        <div class="storyboard-grid" id="storyboard-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px;">
          ${frames.map((frame, idx) => this.renderFrameCard(frame, idx, frames.length, video)).join('')}
        </div>

        <!-- Rodapé e Transição para G07 -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 24px; display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 0.85rem; color: #64748b;">
            Etapa concluída: <strong>G06 — Storyboard Visual</strong>. Aguarde o Bloco G07.
          </div>
          <div class="d-flex gap-3">
            <button class="btn btn-outline" onclick="VideoStoryboardModule.openPreviewModal('${video.id}')" style="padding: 10px 18px; border-radius: 6px; border: 1px solid #2563eb; background: #fff; color: #1d4ed8; font-weight: 600; cursor: pointer;">
              ▶️ Abrir Preview Sequencial
            </button>
            <button class="btn btn-primary" onclick="VideoStoryboardModule.finishAndProceed('${video.id}')" style="padding: 10px 22px; border-radius: 6px; background: #0f172a; color: #fff; font-weight: 600; border: none; cursor: pointer;">
              Homologar & Finalizar G06 &rarr;
            </button>
          </div>
        </div>

        <!-- Container de Modais -->
        <div id="storyboard-modal-container"></div>
      </div>
    `;
  },

  /**
   * Renderiza cada quadro individual da grade visual
   */
  renderFrameCard(frame, index, totalCount, video) {
    const framePad = String(frame.frameNumber).padStart(2, '0');

    return `
      <div class="storyboard-frame-card" id="frame-${frame.id}" draggable="true" ondragstart="VideoStoryboardModule.handleDragStart(event, '${frame.id}')" ondragover="VideoStoryboardModule.handleDragOver(event)" ondrop="VideoStoryboardModule.handleDrop(event, '${frame.id}', '${video.id}')" style="background: #fff; border: 2px solid #e2e8f0; border-radius: 10px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 2px 4px rgba(0,0,0,0.03); cursor: grab;">
        <!-- Imagem do Quadro com Badges -->
        <div style="position: relative; width: 100%; height: 175px; background: #0f172a; overflow: hidden;">
          <img src="${escapeHTML(frame.imageUrl)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='assets/preview-doc.png';">
          
          <!-- Número do Quadro em Destaque Visual [01], [02]... -->
          <div style="position: absolute; top: 10px; left: 10px; background: rgba(15,23,42,0.9); backdrop-filter: blur(4px); color: #fff; font-size: 0.85rem; font-weight: 800; padding: 4px 10px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2);">
            [${framePad}]
          </div>

          <!-- Duração do Quadro -->
          <div style="position: absolute; top: 10px; right: 10px; background: rgba(37,99,235,0.9); backdrop-filter: blur(4px); color: #fff; font-size: 0.75rem; font-weight: 700; padding: 3px 8px; border-radius: 4px;">
            ${frame.durationSeconds}s
          </div>

          <!-- Movimento de Câmera & Transição -->
          <div style="position: absolute; bottom: 8px; left: 10px; right: 10px; display: flex; justify-content: space-between; gap: 4px;">
            <span style="background: rgba(15,23,42,0.85); color: #38bdf8; font-size: 0.65rem; font-weight: 600; padding: 2px 6px; border-radius: 3px;">
              🎥 ${escapeHTML(frame.movement)}
            </span>
            <span style="background: rgba(15,23,42,0.85); color: #cbd5e1; font-size: 0.65rem; padding: 2px 6px; border-radius: 3px;">
              ⤹ ${escapeHTML(frame.transition)}
            </span>
          </div>
        </div>

        <!-- Conteúdo do Quadro: Cena, Texto, Narração, Áudio e Observações -->
        <div style="padding: 14px 16px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="font-size: 0.8rem; font-weight: 700; color: #1e40af; text-transform: uppercase; margin-bottom: 4px;">
              ${escapeHTML(frame.sceneTitle)}
            </div>

            <!-- Texto em Tela -->
            <div style="font-size: 0.8rem; color: #1e293b; font-weight: 600; margin-bottom: 6px; display: flex; align-items: flex-start; gap: 4px;">
              <span style="color: #64748b; font-size: 0.75rem;">TXT:</span>
              <span style="line-height: 1.3;">${escapeHTML(frame.text || 'Sem lettering')}</span>
            </div>

            <!-- Narração -->
            <div style="font-size: 0.75rem; color: #475569; font-style: italic; margin-bottom: 8px; line-height: 1.3;">
              "${escapeHTML(frame.narration || 'Sem locução')}"
            </div>

            <!-- Áudio & Trilha -->
            <div style="font-size: 0.7rem; color: #64748b; margin-bottom: 6px;">
              🎵 <strong>Áudio:</strong> ${escapeHTML(frame.audio || 'Trilha Ambiente 2700K')}
            </div>

            <!-- Observações -->
            ${frame.notes ? `
              <div style="font-size: 0.7rem; color: #64748b; background: #f8fafc; padding: 6px 8px; border-radius: 4px; border: 1px solid #e2e8f0; margin-bottom: 10px;">
                📝 ${escapeHTML(frame.notes)}
              </div>
            ` : ''}
          </div>

          <!-- Ações do Quadro: Reorder, Duplicar, Editar, Excluir, Substituir Asset -->
          <div style="border-top: 1px solid #f1f5f9; padding-top: 10px; display: flex; justify-content: space-between; align-items: center; gap: 6px;">
            <div class="d-flex gap-1">
              <button onclick="VideoStoryboardModule.openReplaceAssetModal('${frame.id}', '${video.id}')" title="Substituir Ativo / Imagem" style="padding: 4px 6px; font-size: 0.75rem; border: 1px solid #e2e8f0; background: #fff; border-radius: 4px; cursor: pointer;">
                🔄 Asset
              </button>
              <button onclick="VideoStoryboardModule.openEditFrameModal('${frame.id}')" title="Editar Parâmetros do Quadro" style="padding: 4px 6px; font-size: 0.75rem; border: 1px solid #e2e8f0; background: #fff; border-radius: 4px; cursor: pointer;">
                ✏️
              </button>
              <button onclick="VideoStoryboardModule.duplicateFrame('${frame.id}', '${video.id}')" title="Duplicar Quadro" style="padding: 4px 6px; font-size: 0.75rem; border: 1px solid #e2e8f0; background: #fff; border-radius: 4px; cursor: pointer;">
                📋
              </button>
              <button onclick="VideoStoryboardModule.deleteFrame('${frame.id}', '${video.id}')" title="Excluir Quadro" style="padding: 4px 6px; font-size: 0.75rem; border: 1px solid #fee2e2; background: #fff; color: #b91c1c; border-radius: 4px; cursor: pointer;">
                🗑️
              </button>
            </div>

            <!-- Reordenação Rápida (Setas) -->
            <div class="d-flex gap-1">
              <button onclick="VideoStoryboardModule.moveFrame('${frame.id}', -1, '${video.id}')" title="Mover para Esquerda/Cima" style="padding: 4px 6px; font-size: 0.75rem; border: 1px solid #e2e8f0; background: #fff; border-radius: 4px; cursor: pointer;">
                ⬅️
              </button>
              <button onclick="VideoStoryboardModule.moveFrame('${frame.id}', 1, '${video.id}')" title="Mover para Direita/Baixo" style="padding: 4px 6px; font-size: 0.75rem; border: 1px solid #e2e8f0; background: #fff; border-radius: 4px; cursor: pointer;">
                ➡️
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Suporte a Drag and Drop para reorder
   */
  draggedFrameId: null,
  handleDragStart(e, frameId) {
    this.draggedFrameId = frameId;
    e.dataTransfer.setData('text/plain', frameId);
  },
  handleDragOver(e) {
    e.preventDefault();
  },
  handleDrop(e, targetFrameId, videoId) {
    e.preventDefault();
    const sourceFrameId = this.draggedFrameId;
    if (!sourceFrameId || sourceFrameId === targetFrameId) return;

    const state = this._getState();
    if (!state) return;

    const frames = state.getStoryboardFrames(videoId);
    const sourceIdx = frames.findIndex(f => f.id === sourceFrameId);
    const targetIdx = frames.findIndex(f => f.id === targetFrameId);

    if (sourceIdx < 0 || targetIdx < 0) return;

    // Reorganiza array
    const [moved] = frames.splice(sourceIdx, 1);
    frames.splice(targetIdx, 0, moved);

    const orderedIds = frames.map(f => f.id);
    state.reorderStoryboardFrames(videoId, orderedIds, 'Usuário (Drag & Drop)');
    this.refreshView(videoId);
  },

  /**
   * Reordenação via setas
   */
  moveFrame(frameId, delta, videoId) {
    const state = this._getState();
    if (!state) return;

    const frames = state.getStoryboardFrames(videoId);
    const index = frames.findIndex(f => f.id === frameId);
    if (index < 0) return;

    const targetIndex = index + delta;
    if (targetIndex < 0 || targetIndex >= frames.length) return;

    const temp = frames[index];
    frames[index] = frames[targetIndex];
    frames[targetIndex] = temp;

    const orderedIds = frames.map(f => f.id);
    state.reorderStoryboardFrames(videoId, orderedIds, 'Usuário');
    this.refreshView(videoId);
  },

  duplicateFrame(frameId, videoId) {
    const state = this._getState();
    if (!state) return;
    try {
      state.duplicateStoryboardFrame(frameId, 'Usuário');
      this.refreshView(videoId);
    } catch (e) {
      alert('Erro ao duplicar quadro: ' + e.message);
    }
  },

  deleteFrame(frameId, videoId) {
    const state = this._getState();
    if (!state) return;

    const confirmDel = confirm('Deseja realmente remover este quadro do Storyboard?\nO arquivo original permanecerá intacto no projeto.');
    if (!confirmDel) return;

    try {
      state.deleteStoryboardFrame(frameId, 'Usuário');
      this.refreshView(videoId);
    } catch (e) {
      alert('Erro ao excluir quadro: ' + e.message);
    }
  },

  /**
   * Confirmação de Ajuste Automático Proporcional de Duração
   */
  confirmAutoAdjust(videoId, targetDuration, currentDuration) {
    const state = this._getState();
    if (!state) return;

    const ok = confirm(
      `Confirmação de Ajuste Automático:\n\nDeseja ajustar proporcionalmente a duração de todos os quadros para totalizar exatamente ${targetDuration.toFixed(1)}s (atualmente em ${currentDuration.toFixed(1)}s)?\n\nNenhum quadro será excluído ou descartado.`
    );
    if (!ok) return;

    try {
      state.adjustStoryboardDurationAutomatically(videoId, 'Usuário', true);
      alert('Durações ajustadas com sucesso!');
      this.refreshView(videoId);
    } catch (e) {
      alert('Erro ao ajustar duração: ' + e.message);
    }
  },

  /**
   * Homologa o Storyboard
   */
  approveStoryboard(videoId) {
    const state = this._getState();
    if (!state) return;

    try {
      state.approveStoryboard(videoId, 'Arquiteto Líder');
      alert('Storyboard homologado com sucesso! Pronto para a fase de produção visual (G07).');
      this.refreshView(videoId);
    } catch (e) {
      alert('Erro ao homologar storyboard: ' + e.message);
    }
  },

  /**
   * Modal para substituir ativo do quadro (escolhe do pool do G03)
   */
  openReplaceAssetModal(frameId, videoId) {
    const state = this._getState();
    if (!state) return;

    const frame = (state.data.videoStoryboardFrames || []).find(f => f.id === frameId);
    if (!frame) return;

    const assets = state.getVideoAssetSelections(videoId);
    const container = document.getElementById('storyboard-modal-container');
    if (!container) return;

    container.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 9999;">
        <div style="background: #fff; width: 90%; max-width: 600px; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
          <div style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: 1.1rem; color: #0f172a;">Substituir Ativo do Quadro #${frame.frameNumber}</h3>
            <button onclick="VideoStoryboardModule.closeModal()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer;">&times;</button>
          </div>
          <div style="padding: 20px;">
            <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #475569; margin-bottom: 6px;">
              Selecione o Ativo Visual Substituto (Pool G03):
            </label>
            <select id="select-replace-asset" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.9rem; margin-bottom: 16px;">
              ${assets.map(a => `
                <option value="${a.id}" data-url="${a.previewUrl}">${a.title} (${a.sourceType} &bull; ${a.approvalStatus})</option>
              `).join('')}
            </select>
            <div style="font-size: 0.75rem; color: #64748b;">
              O ativo anterior permanecerá salvo no projeto e histórico.
            </div>
          </div>
          <div style="padding: 12px 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 8px;">
            <button onclick="VideoStoryboardModule.closeModal()" style="padding: 8px 14px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer;">
              Cancelar
            </button>
            <button onclick="VideoStoryboardModule.confirmReplaceAsset('${frameId}', '${videoId}')" style="padding: 8px 16px; border-radius: 6px; background: #2563eb; color: #fff; font-weight: 600; border: none; cursor: pointer;">
              Confirmar Substituição
            </button>
          </div>
        </div>
      </div>
    `;
  },

  confirmReplaceAsset(frameId, videoId) {
    const state = this._getState();
    if (!state) return;

    const select = document.getElementById('select-replace-asset');
    if (!select) return;

    const assetId = select.value;
    const opt = select.options[select.selectedIndex];
    const imageUrl = opt ? opt.getAttribute('data-url') : null;

    state.replaceStoryboardFrameAsset(frameId, {
      assetId,
      imageUrl,
      notes: opt ? opt.text : ''
    }, 'Usuário');

    this.closeModal();
    this.refreshView(videoId);
  },

  /**
   * Modal de edição de parâmetros do quadro
   */
  openEditFrameModal(frameId) {
    const state = this._getState();
    if (!state) return;

    const frame = (state.data.videoStoryboardFrames || []).find(f => f.id === frameId);
    if (!frame) return;

    const movements = state.STORYBOARD_MOVEMENTS || ['Slow Pan Right', 'Dolly In', 'Traveling Lateral'];
    const container = document.getElementById('storyboard-modal-container');
    if (!container) return;

    container.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 9999;">
        <div style="background: #fff; width: 90%; max-width: 600px; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
          <div style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: 1.1rem; color: #0f172a;">Editar Quadro #${frame.frameNumber}</h3>
            <button onclick="VideoStoryboardModule.closeModal()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer;">&times;</button>
          </div>
          <div style="padding: 20px; max-height: 70vh; overflow-y: auto;">
            <div style="margin-bottom: 12px;">
              <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #475569; margin-bottom: 4px;">Duração (segundos)</label>
              <input type="number" id="edit-frame-duration" value="${frame.durationSeconds}" step="0.5" min="1" max="60" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.9rem;">
            </div>

            <div style="margin-bottom: 12px;">
              <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #475569; margin-bottom: 4px;">Movimento de Câmera</label>
              <select id="edit-frame-movement" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.9rem;">
                ${movements.map(m => `<option value="${m}" ${frame.movement === m ? 'selected' : ''}>${m}</option>`).join('')}
              </select>
            </div>

            <div style="margin-bottom: 12px;">
              <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #475569; margin-bottom: 4px;">Texto em Tela (Lettering)</label>
              <input type="text" id="edit-frame-text" value="${escapeHTML(frame.text || '')}" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.9rem;">
            </div>

            <div style="margin-bottom: 12px;">
              <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #475569; margin-bottom: 4px;">Narração / Locução</label>
              <textarea id="edit-frame-narration" rows="2" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.9rem;">${escapeHTML(frame.narration || '')}</textarea>
            </div>

            <div style="margin-bottom: 12px;">
              <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #475569; margin-bottom: 4px;">Observações</label>
              <input type="text" id="edit-frame-notes" value="${escapeHTML(frame.notes || '')}" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.9rem;">
            </div>
          </div>
          <div style="padding: 12px 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 8px;">
            <button onclick="VideoStoryboardModule.closeModal()" style="padding: 8px 14px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer;">
              Cancelar
            </button>
            <button onclick="VideoStoryboardModule.confirmEditFrame('${frameId}')" style="padding: 8px 16px; border-radius: 6px; background: #2563eb; color: #fff; font-weight: 600; border: none; cursor: pointer;">
              Salvar
            </button>
          </div>
        </div>
      </div>
    `;
  },

  confirmEditFrame(frameId) {
    const state = this._getState();
    if (!state) return;

    const durationSeconds = parseFloat(document.getElementById('edit-frame-duration')?.value || '5.0');
    const movement = document.getElementById('edit-frame-movement')?.value;
    const text = document.getElementById('edit-frame-text')?.value;
    const narration = document.getElementById('edit-frame-narration')?.value;
    const notes = document.getElementById('edit-frame-notes')?.value;

    const updated = state.updateStoryboardFrame(frameId, {
      durationSeconds,
      movement,
      text,
      narration,
      notes
    }, 'Usuário');

    this.closeModal();
    if (updated) this.refreshView(updated.videoProjectId);
  },

  // =========================================================================
  // PREVIEW SEQUENCIAL INTERATIVO (Validação de Narrativa sem Gerar Vídeo Final)
  // =========================================================================
  openPreviewModal(videoId) {
    const state = this._getState();
    if (!state) return;

    const frames = state.getStoryboardFrames(videoId);
    if (frames.length === 0) {
      alert('Nenhum quadro disponível para preview.');
      return;
    }

    this.previewIndex = 0;
    this.isPreviewPlaying = false;
    this.renderPreviewPlayerModal(videoId, frames);
  },

  renderPreviewModal(videoId) {
    const state = this._getState();
    if (!state) return '';
    let frames = state.getStoryboardFrames(videoId);
    if (!frames || frames.length === 0) {
      state.generateStoryboardFromNarrative(videoId);
      frames = state.getStoryboardFrames(videoId);
    }
    if (!frames || frames.length === 0) return '<div class="p-4">Nenhum quadro disponível para preview.</div>';

    const cur = frames[this.previewIndex] || frames[0];
    const totalFrames = frames.length;

    return `
      <div id="storyboard-preview-player-modal" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.85); backdrop-filter: blur(6px); display: flex; justify-content: center; align-items: center; z-index: 9999;">
        <div style="background: #0f172a; color: #fff; width: 95%; max-width: 850px; border-radius: 12px; overflow: hidden; box-shadow: 0 25px 30px -5px rgba(0,0,0,0.7);">
          <!-- Header do Player -->
          <div style="padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center;">
            <div style="font-weight: 700; font-size: 0.95rem; display: flex; align-items: center; gap: 8px;">
              <span>🎬 PREVIEW SEQUENCIAL — Validação de Narrativa e Ritmo</span>
              <span style="font-size: 0.75rem; background: rgba(37,99,235,0.8); padding: 2px 8px; border-radius: 4px;">
                Quadro ${this.previewIndex + 1} de ${totalFrames}
              </span>
            </div>
            <button onclick="VideoStoryboardModule.closePreviewModal()" style="background: none; border: none; font-size: 1.3rem; color: #fff; cursor: pointer;">&times;</button>
          </div>

          <!-- Tela de Exibição Cinematográfica -->
          <div style="position: relative; width: 100%; height: 420px; background: #000; overflow: hidden; display: flex; align-items: center; justify-content: center;">
            <img id="preview-image" src="${escapeHTML(cur.imageUrl)}" style="width: 100%; height: 100%; object-fit: contain;" onerror="this.src='assets/preview-doc.png';">
            
            <!-- Overlay de Movimento e Cena -->
            <div style="position: absolute; top: 14px; left: 16px; background: rgba(15,23,42,0.85); padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">
              [${String(cur.frameNumber).padStart(2, '0')}] ${escapeHTML(cur.sceneTitle)} &bull; ${escapeHTML(cur.movement)}
            </div>

            <!-- Lettering / Texto em Tela -->
            ${cur.text ? `
              <div style="position: absolute; bottom: 60px; left: 20px; right: 20px; text-align: center;">
                <span style="background: rgba(0,0,0,0.75); padding: 6px 14px; border-radius: 6px; font-size: 1rem; font-weight: 700; letter-spacing: 0.5px;">
                  ${escapeHTML(cur.text)}
                </span>
              </div>
            ` : ''}

            <!-- Locução / Narração em Tempo Real -->
            <div style="position: absolute; bottom: 12px; left: 20px; right: 20px; text-align: center; font-size: 0.85rem; color: #cbd5e1; font-style: italic; background: rgba(15,23,42,0.85); padding: 6px 12px; border-radius: 4px;">
              🎙️ "${escapeHTML(cur.narration || 'Sem locução para este take.')}"
            </div>
          </div>

          <!-- Barra de Progresso Temporal -->
          <div style="width: 100%; height: 4px; background: #334155;">
            <div class="progress-bar" style="width: ${Math.round(((this.previewIndex + 1) / totalFrames) * 100)}%; height: 100%; background: #3b82f6; transition: width 0.3s ease;"></div>
          </div>

          <!-- Barra de Controles do Player -->
          <div style="padding: 14px 20px; background: #1e293b; display: flex; justify-content: space-between; align-items: center;">
            <div class="d-flex align-items-center gap-2">
              <button onclick="VideoStoryboardModule.prevPreviewFrame('${videoId}')" style="padding: 6px 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; border-radius: 4px; cursor: pointer;">
                ⏮️ Anterior
              </button>
              <button id="preview-play-btn" onclick="VideoStoryboardModule.togglePreviewPlay('${videoId}')" style="padding: 6px 16px; background: #2563eb; border: none; color: #fff; border-radius: 4px; font-weight: 600; cursor: pointer;">
                ${this.isPreviewPlaying ? '⏸️ Pausar' : '▶️ Reproduzir'}
              </button>
              <button onclick="VideoStoryboardModule.nextPreviewFrame('${videoId}')" style="padding: 6px 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; border-radius: 4px; cursor: pointer;">
                Próximo ⏭️
              </button>
            </div>

            <div style="font-size: 0.75rem; color: #94a3b8;">
              Duração deste take: <strong>${cur.durationSeconds}s</strong> &bull; Transição: <strong>${cur.transition}</strong>
            </div>

            <div>
              <button onclick="VideoStoryboardModule.closePreviewModal()" style="padding: 6px 14px; background: rgba(255,255,255,0.1); border: none; color: #fff; border-radius: 4px; cursor: pointer;">
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderPreviewPlayerModal(videoId, frames) {
    const container = document.getElementById('storyboard-modal-container');
    const html = this.renderPreviewModal(videoId);
    if (container) {
      container.innerHTML = html;
    }
    return html;
  },

  nextPreviewFrame(videoId) {
    const state = this._getState();
    const frames = state.getStoryboardFrames(videoId);
    if (this.previewIndex < frames.length - 1) {
      this.previewIndex++;
    } else {
      this.previewIndex = 0; // loop
    }
    this.renderPreviewPlayerModal(videoId, frames);
  },

  prevPreviewFrame(videoId) {
    const state = this._getState();
    const frames = state.getStoryboardFrames(videoId);
    if (this.previewIndex > 0) {
      this.previewIndex--;
    } else {
      this.previewIndex = frames.length - 1;
    }
    this.renderPreviewPlayerModal(videoId, frames);
  },

  togglePreviewPlay(videoId) {
    const state = this._getState();
    const frames = state.getStoryboardFrames(videoId);

    if (this.isPreviewPlaying) {
      this.isPreviewPlaying = false;
      if (this.previewTimer) clearTimeout(this.previewTimer);
      this.renderPreviewPlayerModal(videoId, frames);
    } else {
      this.isPreviewPlaying = true;
      this.playNextFrameWithTimer(videoId, frames);
    }
  },

  playNextFrameWithTimer(videoId, frames) {
    if (!this.isPreviewPlaying) return;

    this.renderPreviewPlayerModal(videoId, frames);
    const cur = frames[this.previewIndex] || frames[0];
    const durationMs = Math.max(1500, (Number(cur.durationSeconds) || 4) * 1000);

    this.previewTimer = setTimeout(() => {
      if (!this.isPreviewPlaying) return;
      if (this.previewIndex < frames.length - 1) {
        this.previewIndex++;
      } else {
        this.previewIndex = 0;
      }
      this.playNextFrameWithTimer(videoId, frames);
    }, durationMs);
  },

  closePreviewModal() {
    this.isPreviewPlaying = false;
    if (this.previewTimer) clearTimeout(this.previewTimer);
    this.closeModal();
  },

  closeModal() {
    const container = document.getElementById('storyboard-modal-container');
    if (container) container.innerHTML = '';
  },

  finishAndProceed(videoId) {
    const state = this._getState();
    if (!state) return;

    const frames = state.getStoryboardFrames(videoId);
    if (frames.length === 0) {
      alert('Gere os quadros do storyboard antes de prosseguir.');
      return;
    }

    const container = document.getElementById('project-tab-content') || document.getElementById('video-storyboard-root');
    if (container) {
      container.innerHTML = `
        <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px; text-align: center; max-width: 650px; margin: 40px auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: #dcfce7; color: #16a34a; font-size: 28px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
            ✓
          </div>
          <h2 style="font-size: 1.4rem; font-weight: 700; color: #0f172a; margin-bottom: 8px;">
            Storyboard Visual Homologado com Sucesso!
          </h2>
          <p style="font-size: 0.95rem; color: #475569; line-height: 1.5; margin-bottom: 24px;">
            Os <strong>${frames.length} quadros visuais</strong> foram validados quanto ao ritmo, transições, enquadramentos e conformidade com a duração alvo.
          </p>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 0.85rem; color: #64748b; margin-bottom: 20px;">
            Aguardando início do <strong>Bloco G07 (Renderização Audiovisual & Produção dos Takes)</strong>.
          </div>
          <button class="btn btn-outline" onclick="VideoStoryboardModule.refreshView('${videoId}')" style="padding: 10px 18px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer;">
            Revisar Storyboard
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

    const mainContainer = document.getElementById('project-tab-content') || document.getElementById('video-storyboard-root');
    if (mainContainer) {
      mainContainer.innerHTML = this.renderStoryboard(videoId, video.projectId);
    }
  }
};

if (typeof window !== 'undefined') {
  window.VideoStoryboardModule = VideoStoryboardModule;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VideoStoryboardModule;
}
