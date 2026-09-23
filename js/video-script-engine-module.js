/**
 * ============================================================================
 * ARQVERTICE STUDIO — BLOCO G05: SCRIPT ENGINE DO VÍDEO
 * (VIDEO SCRIPT ENGINE & VERSIONING MODULE)
 * ============================================================================
 * Motor de roteirização fundamentado nos dados reais do projeto (briefing,
 * conceito, ambientes, estilo, materiais, mobiliário, decisões, renders
 * homologados e observações técnicas).
 *
 * 8 FORMATOS DE ROTEIRO:
 * 1. roteiro técnico
 * 2. roteiro narrado
 * 3. roteiro institucional
 * 4. roteiro emocional
 * 5. roteiro curto
 * 6. roteiro para redes sociais
 * 7. roteiro para cliente
 * 8. roteiro de apresentação profissional
 *
 * ESTRUTURA DOS 7 TRECHOS:
 * HOOK -> CONTEXTO -> DESENVOLVIMENTO -> DETALHES -> CONCEITO -> RESULTADO -> ENCERRAMENTO
 *
 * OPERAÇÕES E GOVERNANÇA:
 * - Editar trecho individual
 * - Regenerar trecho pontual (sem alterar o restante do texto)
 * - Regenerar roteiro completo
 * - Comparar versões lado a lado
 * - Aprovar roteiro
 * - Versionamento com snapshots históricos (V01, V02, V03...)
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

const VideoScriptEngineModule = {
  activeVideoId: null,
  activeProjectId: null,
  activeScriptId: null,

  _getState() {
    if (typeof StudioState !== 'undefined') return StudioState;
    if (typeof window !== 'undefined' && window.StudioState) return window.StudioState;
    if (typeof require !== 'undefined') {
      try { return require('./state.js'); } catch (e) {}
    }
    return null;
  },

  /**
   * Renderiza a interface principal do Script Engine
   */
  renderScriptEngine(videoId, projectId) {
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
          <p class="text-muted">Crie ou selecione um vídeo primeiro no painel audiovisual.</p>
        </div>
      `;
    }

    this.activeVideoId = video.id;
    this.activeProjectId = video.projectId;

    const project = state.getProject(video.projectId) || { id: video.projectId, name: 'Projeto' };

    // Recupera roteiro existente ou gera inicial
    let scripts = state.getVideoScripts(video.id);
    let script = scripts[0] || null;

    if (!script) {
      try {
        script = state.generateScript(video.id, 'roteiro narrado', { user: 'Script Engine Auto' });
      } catch (err) {
        script = null;
      }
    }

    this.activeScriptId = script ? script.id : null;
    const versions = script ? state.getScriptVersions(script.id) : [];
    const isApproved = script ? script.isApproved : false;

    const formats = state.SCRIPT_FORMATS || [
      'roteiro técnico', 'roteiro narrado', 'roteiro institucional', 'roteiro emocional',
      'roteiro curto', 'roteiro para redes sociais', 'roteiro para cliente', 'roteiro de apresentação profissional'
    ];

    const formatLabels = state.SCRIPT_FORMAT_LABELS || {};

    return `
      <div class="video-script-root" id="video-script-root" style="padding: 24px; max-width: 1400px; margin: 0 auto;">
        <!-- Cabeçalho -->
        <div class="d-flex justify-content-between align-items-center mb-4 pb-3" style="border-bottom: 1px solid #e2e8f0;">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="badge" style="background: #0f172a; color: #fff; font-size: 0.75rem; font-weight: 600; padding: 4px 8px; border-radius: 4px;">BLOCO G05</span>
              <span class="text-muted" style="font-size: 0.85rem;">Script Engine & Roteirização Baseada no Projeto Real</span>
              ${script ? `
                <span class="badge" style="background: #eff6ff; color: #1d4ed8; font-size: 0.75rem; font-weight: 700; padding: 4px 8px; border-radius: 4px; border: 1px solid #bfdbfe;">
                  ${escapeHTML(script.versionLabel)}
                </span>
              ` : ''}
              ${isApproved ? `
                <span class="badge" style="background: #dcfce7; color: #15803d; font-size: 0.75rem; font-weight: 700; padding: 4px 8px; border-radius: 4px; border: 1px solid #bbf7d0;">
                  ✓ APROVADO
                </span>
              ` : `
                <span class="badge" style="background: #fef9c3; color: #a16207; font-size: 0.75rem; font-weight: 700; padding: 4px 8px; border-radius: 4px; border: 1px solid #fef08a;">
                  EM REVISÃO
                </span>
              `}
            </div>
            <h2 style="font-size: 1.5rem; font-weight: 700; margin: 0; color: #0f172a;">${escapeHTML(video.title)}</h2>
            <div style="font-size: 0.85rem; color: #64748b; margin-top: 4px;">
              Projeto: <strong>${escapeHTML(project.name)}</strong> &bull; Duração Estimada: <strong>${script ? script.totalDuration : 60}s</strong> &bull; Palavras: <strong>${script ? script.wordCount : 0}</strong>
            </div>
          </div>
          <div class="d-flex gap-2">
            ${versions.length > 1 ? `
              <button class="btn btn-outline" onclick="VideoScriptEngineModule.openCompareModal('${script.id}')" style="padding: 8px 14px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer;">
                ⚖️ Comparar Versões (${versions.length})
              </button>
            ` : ''}
            ${!isApproved ? `
              <button class="btn btn-outline" onclick="VideoScriptEngineModule.approveScript('${script.id}', '${video.id}')" style="padding: 8px 14px; border-radius: 6px; border: 1px solid #16a34a; background: #f0fdf4; color: #15803d; font-weight: 600; cursor: pointer;">
                ✓ Homologar Roteiro
              </button>
            ` : ''}
            <button class="btn btn-primary" onclick="VideoScriptEngineModule.finishAndProceed('${video.id}')" style="padding: 8px 16px; border-radius: 6px; background: #2563eb; color: #fff; font-weight: 600; border: none; cursor: pointer;">
              Concluir G05 &rarr;
            </button>
          </div>
        </div>

        <!-- Banner de Integridade e Contexto Real -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #0f172a; padding: 14px 18px; border-radius: 6px; margin-bottom: 24px;">
          <div style="font-weight: 600; font-size: 0.9rem; color: #0f172a; margin-bottom: 4px;">
            📌 Roteiro Baseado no Projeto Real
          </div>
          <div style="font-size: 0.85rem; color: #475569; line-height: 1.5;">
            Este roteiro é alimentado estritamente pelas 10 fontes de contexto do projeto: 
            <em>briefing, conceito, ambientes, estilo, materiais, mobiliário, decisões, renders aprovados, observações do arquiteto e objetivo do vídeo</em>. 
            Nenhuma característica não documentada é inventada. A alteração de um trecho isolado <strong>não sobrescreve os demais trechos</strong>.
          </div>
        </div>

        <!-- Seletor de Formato do Roteiro -->
        <div style="background: #fff; border: 1px solid #e2e8f0; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px;">
          <div class="d-flex justify-content-between align-items-center">
            <div style="flex: 1; max-width: 500px;">
              <label style="display: block; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">
                Formato do Roteiro (8 Estilos Canônicos)
              </label>
              <select id="script-format-selector" onchange="VideoScriptEngineModule.changeFormat(this.value, '${video.id}')" style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.9rem; font-weight: 500; background: #f8fafc;">
                ${formats.map(fmt => `
                  <option value="${fmt}" ${script && script.format === fmt ? 'selected' : ''}>
                    ${escapeHTML(formatLabels[fmt] || fmt)}
                  </option>
                `).join('')}
              </select>
            </div>
            <div style="text-align: right;">
              <button class="btn btn-outline" onclick="VideoScriptEngineModule.regenerateFullScript('${video.id}')" style="padding: 8px 16px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer; font-size: 0.85rem;">
                🔄 Regenerar Roteiro Inteiro
              </button>
            </div>
          </div>
        </div>

        <!-- Lista dos 7 Trechos Estruturais -->
        <div class="script-sections-container mb-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: #0f172a;">
              Estrutura Narrativa do Roteiro (7 Trechos)
            </h3>
            <span style="font-size: 0.8rem; color: #64748b;">
              HOOK &bull; CONTEXTO &bull; DESENVOLVIMENTO &bull; DETALHES &bull; CONCEITO &bull; RESULTADO &bull; ENCERRAMENTO
            </span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 16px;">
            ${script ? script.sections.map((sec, idx) => this.renderSectionCard(sec, idx, script, video)).join('') : `
              <div style="padding: 40px; text-align: center; background: #fff; border: 1px dashed #cbd5e1; border-radius: 8px;">
                <p>Nenhum roteiro gerado.</p>
              </div>
            `}
          </div>
        </div>

        <!-- Rodapé e Transição para G06 -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 24px; display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 0.85rem; color: #64748b;">
            Etapa concluída: <strong>G05 — Script Engine</strong>. Aguarde o Bloco G06.
          </div>
          <div class="d-flex gap-3">
            <button class="btn btn-primary" onclick="VideoScriptEngineModule.finishAndProceed('${video.id}')" style="padding: 10px 22px; border-radius: 6px; background: #0f172a; color: #fff; font-weight: 600; border: none; cursor: pointer;">
              Homologar & Finalizar G05 &rarr;
            </button>
          </div>
        </div>

        <!-- Container de Modais -->
        <div id="script-engine-modal-container"></div>
      </div>
    `;
  },

  /**
   * Renderiza o card individual de cada trecho estrutural
   */
  renderSectionCard(section, index, script, video) {
    return `
      <div class="script-section-card" id="card-${section.id}" style="background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
        <div class="d-flex justify-content-between align-items-start mb-3">
          <div class="d-flex align-items-center gap-2">
            <span style="background: #0f172a; color: #fff; font-size: 0.75rem; font-weight: 700; padding: 4px 8px; border-radius: 4px;">
              #${index + 1}
            </span>
            <h4 style="margin: 0; font-size: 1.05rem; font-weight: 700; color: #0f172a;">
              ${escapeHTML(section.sectionType)}
            </h4>
            <span style="font-size: 0.8rem; background: #eff6ff; color: #1d4ed8; padding: 2px 8px; border-radius: 4px; font-weight: 600;">
              ${section.durationSeconds}s estimadas
            </span>
            <span style="font-size: 0.8rem; color: #64748b;">
              &bull; ${escapeHTML(section.sceneTitle)}
            </span>
          </div>

          <!-- Ações Pontuais do Trecho -->
          <div class="d-flex gap-2">
            <button onclick="VideoScriptEngineModule.regenerateSection('${script.id}', '${section.id}', '${video.id}')" title="Regenerar SOMENTE este trecho mantendo o restante do roteiro intacto" style="padding: 5px 10px; font-size: 0.8rem; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 4px; cursor: pointer;">
              ✨ Regenerar Trecho
            </button>
            <button onclick="VideoScriptEngineModule.openEditSectionModal('${script.id}', '${section.id}')" title="Editar texto e parâmetros" style="padding: 5px 10px; font-size: 0.8rem; border: 1px solid #cbd5e1; background: #fff; border-radius: 4px; cursor: pointer;">
              ✏️ Editar
            </button>
          </div>
        </div>

        <!-- Grade de Conteúdo: Imagem de Apoio + Texto do Roteiro -->
        <div style="display: grid; grid-template-columns: 140px 1fr; gap: 16px; align-items: start;">
          <div style="border-radius: 6px; overflow: hidden; background: #0f172a; height: 90px;">
            <img src="${escapeHTML(section.imageUrl)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='assets/preview-doc.png';">
          </div>

          <div>
            <div style="font-size: 0.95rem; color: #1e293b; line-height: 1.5; background: #f8fafc; padding: 12px 14px; border-radius: 6px; border: 1px solid #e2e8f0; font-family: inherit;">
              ${escapeHTML(section.text)}
            </div>

            ${section.notes ? `
              <div style="font-size: 0.75rem; color: #64748b; margin-top: 8px; display: flex; align-items: center; gap: 4px;">
                <span>🎬 <strong>Direção de Cena:</strong> ${escapeHTML(section.notes)}</span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Altera o formato geral do roteiro e gera nova versão
   */
  changeFormat(newFormat, videoId) {
    const state = this._getState();
    if (!state) return;

    try {
      state.generateScript(videoId, newFormat, { user: 'Usuário (Mudança de Formato)' });
      this.refreshView(videoId);
    } catch (e) {
      alert('Erro ao alterar formato: ' + e.message);
    }
  },

  /**
   * Regenera o roteiro completo
   */
  regenerateFullScript(videoId) {
    const state = this._getState();
    if (!state) return;

    const selector = document.getElementById('script-format-selector');
    const format = selector ? selector.value : 'roteiro narrado';

    try {
      state.generateScript(videoId, format, { user: 'Usuário (Regeneração Completa)' });
      this.refreshView(videoId);
    } catch (e) {
      alert('Erro ao regenerar roteiro: ' + e.message);
    }
  },

  /**
   * REGRA MANDATÓRIA: Regenera APENAS um trecho específico, preservando os outros 6
   */
  regenerateSection(scriptId, sectionId, videoId) {
    const state = this._getState();
    if (!state) return;

    try {
      state.regenerateScriptSection(scriptId, sectionId, 'Usuário');
      this.refreshView(videoId);
    } catch (e) {
      alert('Erro ao regenerar trecho: ' + e.message);
    }
  },

  /**
   * Homologa/aprova o roteiro
   */
  approveScript(scriptId, videoId) {
    const state = this._getState();
    if (!state) return;

    try {
      state.approveScript(scriptId, 'Arquiteto Titular');
      alert('Roteiro homologado com sucesso! A versão foi congelada e aprovada.');
      this.refreshView(videoId);
    } catch (e) {
      alert('Erro ao aprovar roteiro: ' + e.message);
    }
  },

  /**
   * Modal para editar trecho pontual
   */
  openEditSectionModal(scriptId, sectionId) {
    const state = this._getState();
    if (!state) return;

    const script = state.getScript(scriptId);
    if (!script) return;

    const section = (script.sections || []).find(s => s.id === sectionId);
    if (!section) return;

    const container = document.getElementById('script-engine-modal-container');
    if (!container) return;

    container.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 9999;">
        <div style="background: #fff; width: 90%; max-width: 600px; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
          <div style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: 1.1rem; color: #0f172a;">Editar Trecho: ${escapeHTML(section.sectionType)}</h3>
            <button onclick="VideoScriptEngineModule.closeModal()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer;">&times;</button>
          </div>
          <div style="padding: 20px;">
            <div style="margin-bottom: 12px;">
              <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #475569; margin-bottom: 4px;">Texto Roteirizado</label>
              <textarea id="edit-sec-text" rows="4" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.95rem; line-height: 1.4;">${escapeHTML(section.text)}</textarea>
            </div>

            <div style="margin-bottom: 12px;">
              <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #475569; margin-bottom: 4px;">Duração Estimada (segundos)</label>
              <input type="number" id="edit-sec-duration" value="${section.durationSeconds}" step="0.5" min="1" max="60" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.9rem;">
            </div>

            <div style="margin-bottom: 12px;">
              <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #475569; margin-bottom: 4px;">Direção / Observação de Cena</label>
              <input type="text" id="edit-sec-notes" value="${escapeHTML(section.notes || '')}" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.9rem;">
            </div>
            
            <div style="font-size: 0.75rem; color: #64748b;">
              ⚠️ Esta alteração afeta somente este trecho, preservando integralmente o restante do roteiro.
            </div>
          </div>
          <div style="padding: 12px 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 8px;">
            <button onclick="VideoScriptEngineModule.closeModal()" style="padding: 8px 14px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer;">
              Cancelar
            </button>
            <button onclick="VideoScriptEngineModule.confirmEditSection('${scriptId}', '${sectionId}')" style="padding: 8px 16px; border-radius: 6px; background: #2563eb; color: #fff; font-weight: 600; border: none; cursor: pointer;">
              Salvar Trecho
            </button>
          </div>
        </div>
      </div>
    `;
  },

  confirmEditSection(scriptId, sectionId) {
    const state = this._getState();
    if (!state) return;

    const text = document.getElementById('edit-sec-text')?.value;
    const durationSeconds = parseFloat(document.getElementById('edit-sec-duration')?.value || '6.0');
    const notes = document.getElementById('edit-sec-notes')?.value;

    state.updateScriptSection(scriptId, sectionId, {
      text,
      durationSeconds,
      notes
    }, 'Usuário');

    // Cria snapshot da nova versão
    const script = state.saveScriptVersion(scriptId, `Trecho editado manualmente pelo usuário.`, 'Usuário');

    this.closeModal();
    if (script) this.refreshView(script.videoProjectId);
  },

  /**
   * Modal comparativo lado a lado entre duas versões do roteiro
   */
  openCompareModal(scriptId) {
    const state = this._getState();
    if (!state) return;

    const versions = state.getScriptVersions(scriptId);
    if (versions.length < 2) return;

    const vLatest = versions[0];
    const vPrevious = versions[1];

    const comparison = state.compareScriptVersions(scriptId, vPrevious.id, vLatest.id);
    const container = document.getElementById('script-engine-modal-container');
    if (!container) return;

    container.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 9999;">
        <div style="background: #fff; width: 95%; max-width: 900px; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
          <div style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: 1.1rem; color: #0f172a;">
              Comparação de Versões: ${comparison.versionA.label} vs ${comparison.versionB.label} (${comparison.totalSectionsModified} trecho(s) modificado(s))
            </h3>
            <button onclick="VideoScriptEngineModule.closeModal()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer;">&times;</button>
          </div>
          <div style="padding: 20px; max-height: 70vh; overflow-y: auto;">
            ${comparison.sectionDiffs.map(diff => `
              <div style="border: 1px solid ${diff.isModified ? '#cbd5e1' : '#e2e8f0'}; background: ${diff.isModified ? '#fefce8' : '#fff'}; border-radius: 8px; padding: 14px; margin-bottom: 14px;">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span style="font-weight: 700; font-size: 0.85rem; color: #0f172a;">
                    Trecho: ${diff.sectionType}
                  </span>
                  ${diff.isModified ? `
                    <span style="font-size: 0.7rem; background: #fef08a; color: #854d0e; padding: 2px 6px; border-radius: 4px; font-weight: 700;">
                      MODIFICADO
                    </span>
                  ` : `
                    <span style="font-size: 0.7rem; color: #94a3b8;">Inalterado</span>
                  `}
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; font-size: 0.85rem;">
                  <div style="background: #fff; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
                    <strong style="color: #64748b; font-size: 0.75rem; display: block; margin-bottom: 4px;">${comparison.versionA.label}:</strong>
                    <div>${escapeHTML(diff.textA)}</div>
                    <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 4px;">Duração: ${diff.durationA}s</div>
                  </div>
                  <div style="background: #fff; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
                    <strong style="color: #2563eb; font-size: 0.75rem; display: block; margin-bottom: 4px;">${comparison.versionB.label}:</strong>
                    <div>${escapeHTML(diff.textB)}</div>
                    <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 4px;">Duração: ${diff.durationB}s</div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          <div style="padding: 12px 20px; border-top: 1px solid #e2e8f0; text-align: right;">
            <button onclick="VideoScriptEngineModule.closeModal()" style="padding: 8px 16px; border-radius: 6px; background: #0f172a; color: #fff; border: none; cursor: pointer;">
              Fechar Comparação
            </button>
          </div>
        </div>
      </div>
    `;
  },

  closeModal() {
    const container = document.getElementById('script-engine-modal-container');
    if (container) container.innerHTML = '';
  },

  finishAndProceed(videoId) {
    const state = this._getState();
    if (!state) return;

    const scripts = state.getVideoScripts(videoId);
    if (scripts.length === 0) {
      alert('Gere e revise o roteiro antes de prosseguir.');
      return;
    }

    const container = document.getElementById('project-tab-content') || document.getElementById('video-script-root');
    if (container) {
      container.innerHTML = `
        <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px; text-align: center; max-width: 650px; margin: 40px auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: #dcfce7; color: #16a34a; font-size: 28px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
            ✓
          </div>
          <h2 style="font-size: 1.4rem; font-weight: 700; color: #0f172a; margin-bottom: 8px;">
            Script Engine Concluído com Sucesso!
          </h2>
          <p style="font-size: 0.95rem; color: #475569; line-height: 1.5; margin-bottom: 24px;">
            O roteiro foi completamente estruturado em <strong>7 trechos canônicos</strong> fundamentados nos dados reais do projeto, com suporte a versionamento, edição isolada e formatos específicos.
          </p>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 0.85rem; color: #64748b; margin-bottom: 20px;">
            Aguardando início do <strong>Bloco G06 (Produção Visual & Renderização Audiovisual)</strong>.
          </div>
          <button class="btn btn-outline" onclick="VideoScriptEngineModule.refreshView('${videoId}')" style="padding: 10px 18px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer;">
            Revisar Roteiro
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

    const mainContainer = document.getElementById('project-tab-content') || document.getElementById('video-script-root');
    if (mainContainer) {
      mainContainer.innerHTML = this.renderScriptEngine(videoId, video.projectId);
    }
  }
};

if (typeof window !== 'undefined') {
  window.VideoScriptEngineModule = VideoScriptEngineModule;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VideoScriptEngineModule;
}
