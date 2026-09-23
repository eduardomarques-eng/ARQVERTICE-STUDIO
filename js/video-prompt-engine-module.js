/**
 * ============================================================================
 * ARQVERTICE STUDIO — BLOCO G07: VIDEO PROMPT ENGINE MODULE
 * ============================================================================
 * Interface visual do Prompt Engine:
 * - Seletor de Provedores Provider-Agnostic (Gemini, Google Veo, Runway, etc.)
 * - Matriz de Capacidades específica por API
 * - Compilador de Contexto Cinematográfico (11 fontes canônicas)
 * - Exibição dos 8 blocos de saída
 * - Salvaguarda e declaração explícita de Locks (Regra Fundamental)
 * - Versionamento não-destrutivo com histórico completo
 * ============================================================================
 */

(function (global) {
  'use strict';

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  const VideoPromptEngineModule = {
    selectedProvider: 'gemini',
    selectedSceneId: null,
    selectedPromptId: null,

    _getState() {
      return typeof StudioState !== 'undefined' ? StudioState : (global.StudioState || null);
    },

    _getRegistry() {
      if (typeof videoPromptRegistry !== 'undefined') return videoPromptRegistry;
      if (typeof window !== 'undefined' && window.videoPromptRegistry) return window.videoPromptRegistry;
      const state = this._getState();
      return state ? state._getVideoPromptRegistry() : null;
    },

    render(videoProjectId) {
      const state = this._getState();
      if (!state) return '<div class="alert alert-danger">StudioState não inicializado.</div>';

      const video = state.getVideoProject(videoProjectId);
      if (!video) return '<div class="alert alert-warning">Selecione ou crie um projeto de vídeo para acessar o Prompt Engine.</div>';

      // Garante compilação de prompt inicial se ainda não houver nenhum
      let prompts = state.getVideoPrompts(video.id);
      if (prompts.length === 0) {
        state.compileVideoPrompt(video.id, null, { provider: this.selectedProvider });
        prompts = state.getVideoPrompts(video.id);
      }

      const activePrompt = (this.selectedPromptId ? prompts.find(p => p.id === this.selectedPromptId) : null) || prompts[0];
      this.selectedPromptId = activePrompt ? activePrompt.id : null;
      this.selectedProvider = activePrompt ? activePrompt.provider : this.selectedProvider;

      const registry = this._getRegistry();
      const availableProviders = registry ? registry.list() : [
        { id: 'gemini', displayName: 'Google Gemini' },
        { id: 'google_veo', displayName: 'Google Flow / Veo' },
        { id: 'external_video_models', displayName: 'Modelos Comerciais' },
        { id: 'external_tools', displayName: 'Ferramentas Externas' },
        { id: 'local_generator', displayName: 'Geração Local Futura' }
      ];

      const currentCaps = registry ? registry.getCapabilities(this.selectedProvider) : null;
      const scenes = state.getNarrativeScenes(video.id);
      const versions = activePrompt ? state.getVideoPromptVersions(activePrompt.id) : [];

      return `
        <div class="video-prompt-engine-container" style="padding: 24px; max-width: 1400px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          
          <!-- Cabeçalho do Bloco G07 -->
          <div style="background: #0f172a; color: #fff; padding: 24px 28px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.2);">
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <div class="d-flex align-items-center gap-2 mb-2">
                  <span style="background: #3b82f6; color: #fff; font-size: 0.75rem; font-weight: 700; padding: 3px 8px; border-radius: 4px; letter-spacing: 0.5px;">
                    BLOCO G07
                  </span>
                  <span style="font-size: 0.85rem; color: #94a3b8;">
                    ${escapeHTML(video.title)} &bull; ${escapeHTML(video.type)}
                  </span>
                </div>
                <h2 style="margin: 0; font-size: 1.6rem; font-weight: 700; color: #fff;">
                  🎬 Prompt Engine Audiovisual (Provider-Agnostic)
                </h2>
                <p style="margin: 6px 0 0 0; font-size: 0.9rem; color: #cbd5e1;">
                  Compilação cinemática de alta fidelidade sem dependência de fornecedor único.
                </p>
              </div>

              <!-- Badges de Status e Versão -->
              <div class="d-flex align-items-center gap-3">
                <div style="background: rgba(255,255,255,0.1); padding: 8px 14px; border-radius: 6px; text-align: right;">
                  <div style="font-size: 0.75rem; color: #94a3b8;">Versão do Prompt</div>
                  <div style="font-weight: 700; font-size: 1.1rem; color: #38bdf8;">
                    ${escapeHTML(activePrompt?.versionLabel || 'V01')}
                  </div>
                </div>
                <button class="btn btn-primary" onclick="VideoPromptEngineModule.recompilePrompt('${video.id}')" style="background: #2563eb; color: #fff; border: none; padding: 10px 18px; border-radius: 6px; font-weight: 600; cursor: pointer;">
                  🔄 Recompilar Prompt
                </button>
              </div>
            </div>
          </div>

          <!-- Matriz de Provedores Provider-Agnostic -->
          <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="font-weight: 700; font-size: 0.95rem; color: #0f172a; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
              <span>🌐 Selecione o Provedor Audiovisual</span>
              <span style="font-size: 0.75rem; font-weight: normal; color: #64748b;">(Arquitetura aberta multi-modelo)</span>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-bottom: 16px;">
              ${availableProviders.map(p => {
                const isSelected = p.id === this.selectedProvider;
                return `
                  <div onclick="VideoPromptEngineModule.selectProvider('${video.id}', '${p.id}')" style="padding: 12px 14px; border-radius: 8px; border: 2px solid ${isSelected ? '#2563eb' : '#e2e8f0'}; background: ${isSelected ? '#eff6ff' : '#f8fafc'}; cursor: pointer; transition: all 0.2s ease;">
                    <div style="font-weight: 700; font-size: 0.85rem; color: ${isSelected ? '#1d4ed8' : '#334155'}; display: flex; justify-content: space-between; align-items: center;">
                      <span>${escapeHTML(p.displayName)}</span>
                      ${isSelected ? '<span style="color: #2563eb;">●</span>' : ''}
                    </div>
                    <div style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">
                      ${p.capabilities?.defaultModel ? `Modelo: ${p.capabilities.defaultModel}` : p.id}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            <!-- Matriz de Capacidades do Provedor Selecionado -->
            ${currentCaps ? `
              <div style="background: #f1f5f9; border-radius: 6px; padding: 12px 16px; display: flex; flex-wrap: wrap; gap: 14px; align-items: center; font-size: 0.8rem;">
                <span style="font-weight: 600; color: #334155;">Capacidades da API (${currentCaps.displayName}):</span>
                <span class="badge" style="background: ${currentCaps.supportsNegativePrompt ? '#dcfce7; color: #166534' : '#fee2e2; color: #991b1b'}; padding: 3px 8px; border-radius: 4px;">
                  ${currentCaps.supportsNegativePrompt ? '✓ Negative Prompt Nativo' : '✗ Negative Prompt Embutido'}
                </span>
                <span class="badge" style="background: ${currentCaps.supportsCameraControl ? '#dcfce7; color: #166534' : '#fef9c3; color: #854d0e'}; padding: 3px 8px; border-radius: 4px;">
                  ${currentCaps.supportsCameraControl ? '✓ Controle de Câmera' : '○ Câmera Descritiva'}
                </span>
                <span class="badge" style="background: ${currentCaps.supportsMotionStrength ? '#dcfce7; color: #166534' : '#f1f5f9; color: #64748b'}; padding: 3px 8px; border-radius: 4px;">
                  ${currentCaps.supportsMotionStrength ? '✓ Peso de Movimento (Motion Weight)' : '○ Movimento Natural'}
                </span>
                <span class="badge" style="background: ${currentCaps.supportsLocalExecution ? '#e0e7ff; color: #3730a3' : '#f8fafc; color: #64748b'}; padding: 3px 8px; border-radius: 4px;">
                  ${currentCaps.supportsLocalExecution ? '💻 Execução Local' : '☁️ Nuvem Externa'}
                </span>
                <span style="color: #64748b;">
                  Duração máx: <strong>${currentCaps.maxDurationSeconds}s</strong>
                </span>
              </div>
            ` : ''}
          </div>

          <!-- Grade Principal em 2 Colunas -->
          <div style="display: grid; grid-template-columns: 360px 1fr; gap: 24px; margin-bottom: 24px;">
            
            <!-- Coluna Esquerda: Contexto, Cenas e Locks -->
            <div>
              <!-- Seletor de Cena / Beat -->
              <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin-bottom: 20px;">
                <div style="font-weight: 700; font-size: 0.9rem; color: #0f172a; margin-bottom: 12px;">
                  🎬 Selecionar Cena Narrativa (${scenes.length})
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  ${scenes.map((s, idx) => {
                    const isCur = activePrompt?.sceneId === s.id || (!activePrompt?.sceneId && idx === 0);
                    return `
                      <div onclick="VideoPromptEngineModule.selectScene('${video.id}', '${s.id}')" style="padding: 10px 12px; border-radius: 6px; border: 1px solid ${isCur ? '#2563eb' : '#e2e8f0'}; background: ${isCur ? '#eff6ff' : '#fff'}; cursor: pointer;">
                        <div style="font-weight: 600; font-size: 0.85rem; color: ${isCur ? '#1d4ed8' : '#1e293b'};">
                          #${s.sequence} &bull; ${escapeHTML(s.title)}
                        </div>
                        <div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">
                          Objetivo: <strong>${escapeHTML(s.purpose)}</strong> &bull; Duração: <strong>${s.duration}s</strong>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>

              <!-- Regra Fundamental de Locks (Visual Locks D07) -->
              <div style="background: #fffbeb; border: 2px solid #fef3c7; border-radius: 10px; padding: 18px; margin-bottom: 20px;">
                <div style="font-weight: 700; font-size: 0.9rem; color: #92400e; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                  <span>🔒 REGRA FUNDAMENTAL</span>
                </div>
                <p style="font-size: 0.8rem; color: #b45309; margin: 0 0 12px 0; line-height: 1.4;">
                  Não alterar geometria, layout, proporções, aberturas, materiais e mobiliário aprovados quando bloqueados.
                </p>

                <div style="font-size: 0.8rem; font-weight: 600; color: #78350f; margin-bottom: 6px;">
                  Locks Declarados Explicitamente no Prompt (${activePrompt?.elementosAPreservar?.length || 0}):
                </div>
                <ul style="margin: 0; padding-left: 18px; font-size: 0.75rem; color: #92400e; line-height: 1.5;">
                  ${(activePrompt?.elementosAPreservar || []).map(lock => `
                    <li>${escapeHTML(lock)}</li>
                  `).join('')}
                </ul>
              </div>

              <!-- Ativos e Imagem Base -->
              <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px;">
                <div style="font-weight: 700; font-size: 0.9rem; color: #0f172a; margin-bottom: 10px;">
                  🖼️ Imagem Base e Referências (${activePrompt?.referenceAssets?.length || 0})
                </div>
                <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px;">
                  ${(activePrompt?.referenceAssets || []).map(ref => `
                    <div style="width: 90px; height: 60px; border-radius: 4px; overflow: hidden; border: 1px solid #cbd5e1; flex-shrink: 0; background: #000;">
                      <img src="${escapeHTML(ref.url)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='assets/preview-doc.png';">
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- Coluna Direita: Os 8 Componentes Gerados do Prompt -->
            <div>
              <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                
                <!-- 1. Prompt Principal -->
                <div style="margin-bottom: 24px;">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <div style="font-weight: 700; font-size: 1rem; color: #0f172a;">
                      1. Prompt Principal (Diretriz Cinematográfica Mestre)
                    </div>
                    <button onclick="VideoPromptEngineModule.copyPromptToClipboard('${activePrompt?.id}')" style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 5px 12px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; cursor: pointer;">
                      📋 Copiar Prompt
                    </button>
                  </div>
                  <div id="prompt-main-display" style="background: #0f172a; color: #f8fafc; padding: 18px; border-radius: 8px; font-family: Consolas, Monaco, monospace; font-size: 0.85rem; line-height: 1.6; white-space: pre-wrap; max-height: 320px; overflow-y: auto;">
${escapeHTML(activePrompt?.promptPrincipal || activePrompt?.prompt)}
                  </div>
                </div>

                <!-- 2. Restrições e Negative Prompt -->
                <div style="margin-bottom: 24px;">
                  <div style="font-weight: 700; font-size: 0.95rem; color: #0f172a; margin-bottom: 8px;">
                    2. Restrições & Negative Prompt
                  </div>
                  <div style="background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 12px 16px; border-radius: 6px; font-size: 0.85rem; line-height: 1.5;">
                    ${escapeHTML(activePrompt?.restrições || activePrompt?.negativePrompt || 'Nenhuma restrição adicional.')}
                  </div>
                </div>

                <!-- 3. Elementos a Preservar -->
                <div style="margin-bottom: 24px;">
                  <div style="font-weight: 700; font-size: 0.95rem; color: #0f172a; margin-bottom: 8px;">
                    3. Elementos a Preservar (Salva-guarda de Locks)
                  </div>
                  <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${(activePrompt?.elementosAPreservar || []).map(el => `
                      <span style="background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">
                        🛡️ ${escapeHTML(el)}
                      </span>
                    `).join('')}
                  </div>
                </div>

                <!-- Grid de Parâmetros: 4. Movimento, 5. Câmera, 6. Duração, 7. Formato -->
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;">
                  
                  <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 14px; border-radius: 6px;">
                    <div style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase;">
                      4. Movimento de Câmera
                    </div>
                    <div style="font-weight: 700; font-size: 0.85rem; color: #1e293b; margin-top: 2px;">
                      ${escapeHTML(activePrompt?.movimento || 'pan_right')}
                    </div>
                  </div>

                  <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 14px; border-radius: 6px;">
                    <div style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase;">
                      5. Câmera & Óptica
                    </div>
                    <div style="font-weight: 700; font-size: 0.85rem; color: #1e293b; margin-top: 2px;">
                      ${escapeHTML(activePrompt?.câmera || '35mm Lens')}
                    </div>
                  </div>

                  <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 14px; border-radius: 6px;">
                    <div style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase;">
                      6. Duração
                    </div>
                    <div style="font-weight: 700; font-size: 0.85rem; color: #1e293b; margin-top: 2px;">
                      ${escapeHTML(activePrompt?.duração || '5.0s')}
                    </div>
                  </div>

                  <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 14px; border-radius: 6px;">
                    <div style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase;">
                      7. Formato & Aspect Ratio
                    </div>
                    <div style="font-weight: 700; font-size: 0.85rem; color: #1e293b; margin-top: 2px;">
                      ${escapeHTML(activePrompt?.formato || '16:9 @ 24fps')}
                    </div>
                  </div>
                </div>

                <!-- 8. Observações Técnicas -->
                <div style="margin-bottom: 24px;">
                  <div style="font-weight: 700; font-size: 0.95rem; color: #0f172a; margin-bottom: 8px;">
                    8. Observações & Instruções de Despacho
                  </div>
                  <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 6px; font-size: 0.85rem; color: #475569;">
                    ${escapeHTML(activePrompt?.observações || 'Prompt pronto para despacho ou exportação.')}
                  </div>
                </div>

                <!-- Ações de Versionamento Não-Destrutivo -->
                <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; display: flex; justify-content: space-between; align-items: center;">
                  <div class="d-flex align-items-center gap-2">
                    <span style="font-size: 0.85rem; color: #64748b;">
                      Histórico: <strong>${versions.length} versões</strong> registradas
                    </span>
                    <button class="btn btn-outline" onclick="VideoPromptEngineModule.openVersionHistoryModal('${activePrompt?.id}')" style="padding: 6px 12px; font-size: 0.8rem; border: 1px solid #cbd5e1; background: #fff; border-radius: 4px; cursor: pointer;">
                      📜 Comparar Versões
                    </button>
                  </div>

                  <div class="d-flex gap-2">
                    <button class="btn btn-secondary" onclick="VideoPromptEngineModule.openEditPromptModal('${activePrompt?.id}')" style="padding: 8px 16px; font-size: 0.85rem; border: 1px solid #cbd5e1; background: #fff; border-radius: 4px; cursor: pointer;">
                      ✏️ Editar Prompt
                    </button>
                    <button class="btn btn-primary" onclick="VideoPromptEngineModule.saveNewPromptVersion('${activePrompt?.id}')" style="padding: 8px 18px; font-size: 0.85rem; background: #0f172a; color: #fff; border: none; border-radius: 4px; font-weight: 600; cursor: pointer;">
                      + Criar Versão do Prompt
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <!-- Rodapé e Transição para G08 -->
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 0.85rem; color: #64748b;">
              Etapa concluída: <strong>G07 — Prompt Engine Audiovisual</strong>. Aguarde o Bloco G08.
            </div>
            <button class="btn btn-primary" onclick="VideoPromptEngineModule.finishAndAwaitG08('${video.id}')" style="padding: 10px 22px; border-radius: 6px; background: #0f172a; color: #fff; font-weight: 600; border: none; cursor: pointer;">
              Homologar Prompts & Concluir G07 &rarr;
            </button>
          </div>

          <!-- Container de Modais -->
          <div id="prompt-engine-modal-container"></div>
        </div>
      `;
    },

    selectProvider(videoId, providerId) {
      this.selectedProvider = providerId;
      const state = this._getState();
      if (!state) return;
      state.compileVideoPrompt(videoId, this.selectedSceneId, { provider: providerId });
      this.refresh(videoId);
    },

    selectScene(videoId, sceneId) {
      this.selectedSceneId = sceneId;
      const state = this._getState();
      if (!state) return;
      state.compileVideoPrompt(videoId, sceneId, { provider: this.selectedProvider });
      this.refresh(videoId);
    },

    recompilePrompt(videoId) {
      const state = this._getState();
      if (!state) return;
      state.compileVideoPrompt(videoId, this.selectedSceneId, { provider: this.selectedProvider });
      this.refresh(videoId);
    },

    saveNewPromptVersion(promptId) {
      const state = this._getState();
      if (!state) return;

      const changeSummary = prompt('Descreva o motivo desta nova versão do prompt:', 'Ajuste de intensidade de movimento e reforço de iluminação 2700K');
      if (changeSummary === null) return;

      const p = state.saveVideoPromptVersion(promptId, {}, changeSummary || 'Nova versão incremental');
      alert(`Versão ${p.versionLabel} criada com sucesso! Prompts anteriores foram preservados.`);
      this.refresh(p.videoProjectId);
    },

    copyPromptToClipboard(promptId) {
      const state = this._getState();
      if (!state) return;
      const p = state.getVideoPrompt(promptId);
      if (!p) return;

      if (navigator.clipboard) {
        navigator.clipboard.writeText(p.promptPrincipal || p.prompt);
        alert('Prompt copiado para a área de transferência!');
      } else {
        alert('Prompt:\n\n' + (p.promptPrincipal || p.prompt));
      }
    },

    openVersionHistoryModal(promptId) {
      const state = this._getState();
      if (!state) return;
      const versions = state.getVideoPromptVersions(promptId);
      const container = document.getElementById('prompt-engine-modal-container');
      if (!container) return;

      container.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 9999;">
          <div style="background: #fff; width: 90%; max-width: 800px; max-height: 85vh; border-radius: 10px; overflow-y: auto; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3);">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h3 style="margin: 0; font-size: 1.2rem; font-weight: 700;">📜 Histórico de Versões do Prompt (${versions.length})</h3>
              <button onclick="document.getElementById('prompt-engine-modal-container').innerHTML=''" style="background: none; border: none; font-size: 1.3rem; cursor: pointer;">&times;</button>
            </div>
            <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 16px;">
              Política de Não-Apagar: Todas as versões de prompts gerados são preservadas como histórico imutável.
            </p>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${versions.map(v => `
                <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; background: #f8fafc;">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <span style="font-weight: 700; color: #1e293b;">${escapeHTML(v.versionLabel)} &bull; ${escapeHTML(v.provider)} (${escapeHTML(v.model)})</span>
                    <span style="font-size: 0.75rem; color: #64748b;">${new Date(v.createdAt).toLocaleString('pt-BR')}</span>
                  </div>
                  <div style="font-size: 0.8rem; color: #475569; margin-bottom: 8px;">
                    <strong>Motivo:</strong> ${escapeHTML(v.changeSummary || 'Versão gerada.')}
                  </div>
                  <pre style="background: #0f172a; color: #f8fafc; padding: 10px; border-radius: 4px; font-size: 0.75rem; white-space: pre-wrap; margin: 0; max-height: 120px; overflow-y: auto;">${escapeHTML(v.prompt)}</pre>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    },

    openEditPromptModal(promptId) {
      const state = this._getState();
      if (!state) return;
      const p = state.getVideoPrompt(promptId);
      if (!p) return;
      const container = document.getElementById('prompt-engine-modal-container');
      if (!container) return;

      container.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 9999;">
          <div style="background: #fff; width: 90%; max-width: 700px; border-radius: 10px; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3);">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h3 style="margin: 0; font-size: 1.2rem; font-weight: 700;">✏️ Editar Prompt (Gera Nova Versão)</h3>
              <button onclick="document.getElementById('prompt-engine-modal-container').innerHTML=''" style="background: none; border: none; font-size: 1.3rem; cursor: pointer;">&times;</button>
            </div>
            <div style="margin-bottom: 14px;">
              <label style="font-weight: 600; font-size: 0.85rem; display: block; margin-bottom: 6px;">Prompt Principal:</label>
              <textarea id="edit-prompt-text" style="width: 100%; height: 140px; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-family: monospace; font-size: 0.85rem;">${escapeHTML(p.promptPrincipal || p.prompt)}</textarea>
            </div>
            <div style="margin-bottom: 16px;">
              <label style="font-weight: 600; font-size: 0.85rem; display: block; margin-bottom: 6px;">Negative Prompt / Restrições:</label>
              <textarea id="edit-prompt-negative" style="width: 100%; height: 60px; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem;">${escapeHTML(p.restrições || p.negativePrompt || '')}</textarea>
            </div>
            <div class="d-flex justify-content-end gap-2">
              <button onclick="document.getElementById('prompt-engine-modal-container').innerHTML=''" style="padding: 8px 16px; border: 1px solid #cbd5e1; background: #fff; border-radius: 4px; cursor: pointer;">Cancelar</button>
              <button onclick="VideoPromptEngineModule.saveEditedPrompt('${p.id}')" style="padding: 8px 18px; background: #2563eb; color: #fff; border: none; border-radius: 4px; font-weight: 600; cursor: pointer;">Salvar como Nova Versão</button>
            </div>
          </div>
        </div>
      `;
    },

    saveEditedPrompt(promptId) {
      const state = this._getState();
      if (!state) return;
      const text = document.getElementById('edit-prompt-text')?.value;
      const negative = document.getElementById('edit-prompt-negative')?.value;

      const p = state.saveVideoPromptVersion(promptId, {
        prompt: text,
        negativePrompt: negative
      }, 'Edição manual do prompt principal');

      document.getElementById('prompt-engine-modal-container').innerHTML = '';
      this.refresh(p.videoProjectId);
    },

    finishAndAwaitG08(videoId) {
      alert('Bloco G07 concluído com sucesso! Os prompts foram compilados com salvaguarda dos locks arquitetônicos.\n\nAguardando o Bloco G08.');
    },

    refresh(videoId) {
      const root = document.getElementById('video-prompt-engine-root') || document.getElementById('app-main-content');
      if (root) {
        root.innerHTML = this.render(videoId);
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.VideoPromptEngineModule = VideoPromptEngineModule;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = VideoPromptEngineModule;
  }

})(typeof window !== 'undefined' ? window : global);
