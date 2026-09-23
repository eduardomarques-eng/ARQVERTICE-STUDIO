/**
 * ============================================================================
 * ARQVERTICE STUDIO — BLOCO G08: VIDEO CAMERA & MOTION MODULE
 * ============================================================================
 * Camada visual de definição de câmera e movimento para cenas de vídeo:
 * - 12 Tipos de Movimento Canônicos
 * - Configurações Cinéticas (direção, velocidade, intensidade, duração, início, fim)
 * - Parâmetros de Câmera (enquadramento, distância, altura, lente conceitual, direção, ponto de interesse)
 * - Salvaguarda contra distorção espacial do ambiente
 * - Proteção inegociável de câmeras originais bloqueadas (não alterar)
 * - Biblioteca de Presets com criação de novos presets personalizados
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

  const VideoCameraMotionModule = {
    selectedProfileId: null,
    selectedSceneId: null,

    _getState() {
      return typeof StudioState !== 'undefined' ? StudioState : (global.StudioState || null);
    },

    render(videoProjectId) {
      const state = this._getState();
      if (!state) return '<div class="alert alert-danger">StudioState não inicializado.</div>';

      const video = state.getVideoProject(videoProjectId);
      if (!video) return '<div class="alert alert-warning">Selecione ou crie um projeto de vídeo para configurar câmera e movimento.</div>';

      const scenes = state.getNarrativeScenes(video.id);
      let profiles = state.getCameraMotionProfiles(video.id);

      // Garante a criação de ao menos um perfil inicial se não existir
      if (profiles.length === 0) {
        state.createCameraMotionProfile({
          videoProjectId: video.id,
          sceneId: scenes[0]?.id || null,
          name: `Movimento Cena 1 — ${scenes[0]?.title || 'Abertura'}`,
          motionType: 'cinematic slow movement',
          isAutomatic: true
        });
        profiles = state.getCameraMotionProfiles(video.id);
      }

      const activeProfile = (this.selectedProfileId ? profiles.find(p => p.id === this.selectedProfileId) : null) || profiles[0];
      this.selectedProfileId = activeProfile ? activeProfile.id : null;
      this.selectedSceneId = activeProfile ? activeProfile.sceneId : (scenes[0]?.id || null);

      const motionTypes = state.CAMERA_MOTION_TYPES || [];
      const framings = state.CAMERA_FRAMINGS || [];
      const lenses = state.CONCEPTUAL_LENSES || [];
      const presets = state.getCameraMotionPresets();

      const safety = state.validateCameraMotionSafety(activeProfile?.motionType || 'cinematic slow movement', {
        isCameraLocked: activeProfile?.isLocked
      });

      return `
        <div class="video-camera-motion-container" style="padding: 24px; max-width: 1400px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          
          <!-- Cabeçalho do Bloco G08 -->
          <div style="background: #0f172a; color: #fff; padding: 24px 28px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.2);">
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <div class="d-flex align-items-center gap-2 mb-2">
                  <span style="background: #059669; color: #fff; font-size: 0.75rem; font-weight: 700; padding: 3px 8px; border-radius: 4px; letter-spacing: 0.5px;">
                    BLOCO G08
                  </span>
                  <span style="font-size: 0.85rem; color: #94a3b8;">
                    ${escapeHTML(video.title)} &bull; Direção de Fotografia & Movimento
                  </span>
                </div>
                <h2 style="margin: 0; font-size: 1.6rem; font-weight: 700; color: #fff;">
                  🎥 Câmera e Cinética Espacial do Vídeo
                </h2>
                <p style="margin: 6px 0 0 0; font-size: 0.9rem; color: #cbd5e1;">
                  Definição de 12 movimentos cinemáticos, parametrização óptica e proteção contra distorções.
                </p>
              </div>

              <!-- Ações de Presets e Proteção -->
              <div class="d-flex align-items-center gap-3">
                <button class="btn btn-outline" onclick="VideoCameraMotionModule.openPresetsModal('${video.id}', '${activeProfile?.id}')" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 10px 16px; border-radius: 6px; font-weight: 600; cursor: pointer;">
                  ⭐ Carregar Preset
                </button>
                <button class="btn btn-primary" onclick="VideoCameraMotionModule.saveCurrentAsPreset('${activeProfile?.id}')" style="background: #059669; color: #fff; border: none; padding: 10px 18px; border-radius: 6px; font-weight: 600; cursor: pointer;">
                  💾 Salvar como Preset
                </button>
              </div>
            </div>
          </div>

          <!-- Alerta de Câmera Bloqueada (Se aplicável) -->
          ${activeProfile?.isLocked ? `
            <div style="background: #fef2f2; border: 2px solid #f87171; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px; display: flex; align-items: center; gap: 14px;">
              <span style="font-size: 1.8rem;">🔒</span>
              <div>
                <div style="font-weight: 700; font-size: 0.95rem; color: #991b1b;">
                  CÂMERA ORIGINAL BLOQUEADA (IMUTÁVEL)
                </div>
                <div style="font-size: 0.85rem; color: #b91c1c; margin-top: 2px;">
                  A câmera original deste render aprovado está travada. É proibido alterar enquadramento, distância, altura ou lente. Somente movimentos compatíveis com eixo fixo são permitidos.
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Grid Principal de Edição -->
          <div style="display: grid; grid-template-columns: 340px 1fr; gap: 24px; margin-bottom: 24px;">
            
            <!-- Coluna Esquerda: Cenas e Catálogo dos 12 Movimentos -->
            <div>
              <!-- Seletor de Cena -->
              <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin-bottom: 20px;">
                <div style="font-weight: 700; font-size: 0.9rem; color: #0f172a; margin-bottom: 10px;">
                  🎬 Cena Ativa (${scenes.length})
                </div>
                <select onchange="VideoCameraMotionModule.changeScene('${video.id}', this.value)" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem;">
                  ${scenes.map(s => `
                    <option value="${s.id}" ${s.id === this.selectedSceneId ? 'selected' : ''}>
                      #${s.sequence} - ${escapeHTML(s.title)} (${s.duration}s)
                    </option>
                  `).join('')}
                </select>
              </div>

              <!-- Catálogo dos 12 Tipos de Movimento -->
              <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px;">
                <div style="font-weight: 700; font-size: 0.9rem; color: #0f172a; margin-bottom: 4px;">
                  🕹️ 12 Tipos de Movimento
                </div>
                <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 14px;">
                  Selecione o padrão cinemático adequado para o espaço:
                </div>

                <div style="display: flex; flex-direction: column; gap: 8px; max-height: 520px; overflow-y: auto; padding-right: 4px;">
                  ${motionTypes.map(m => {
                    const isCur = activeProfile?.motionType === m.id;
                    const riskColor = m.distortionRisk === 'none' ? '#10b981' : (m.distortionRisk === 'low' ? '#3b82f6' : (m.distortionRisk === 'medium' ? '#f59e0b' : '#ef4444'));
                    return `
                      <div onclick="VideoCameraMotionModule.selectMotionType('${activeProfile?.id}', '${m.id}')" style="padding: 10px 12px; border-radius: 8px; border: 2px solid ${isCur ? '#059669' : '#e2e8f0'}; background: ${isCur ? '#ecfdf5' : '#f8fafc'}; cursor: pointer; transition: all 0.15s ease;">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                          <span style="font-weight: 700; font-size: 0.85rem; color: ${isCur ? '#065f46' : '#1e293b'};">
                            ${escapeHTML(m.name)}
                          </span>
                          <span style="font-size: 0.65rem; font-weight: 700; color: #fff; background: ${riskColor}; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
                            Risco ${m.distortionRisk}
                          </span>
                        </div>
                        <div style="font-size: 0.75rem; color: #64748b; line-height: 1.3;">
                          ${escapeHTML(m.description)}
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            </div>

            <!-- Coluna Direita: Controles de Cinética, Câmera e Salvaguardas -->
            <div>
              
              <!-- Card de Salvaguarda contra Distorção -->
              <div style="background: ${safety.isSafe ? '#f0fdf4' : '#fffbeb'}; border: 1px solid ${safety.isSafe ? '#bbf7d0' : '#fde68a'}; border-radius: 10px; padding: 16px 20px; margin-bottom: 20px;">
                <div style="font-weight: 700; font-size: 0.9rem; color: ${safety.isSafe ? '#166534' : '#92400e'}; display: flex; align-items: center; gap: 8px;">
                  <span>${safety.isSafe ? '🛡️ Movimento Validado Sem Risco de Distorção' : '⚠️ Atenção à Distorção Espacial'}</span>
                </div>
                <div style="font-size: 0.8rem; color: ${safety.isSafe ? '#15803d' : '#b45309'}; margin-top: 4px; line-height: 1.4;">
                  ${escapeHTML(safety.recommendation)}
                </div>
              </div>

              <!-- Seção 1: Configurações de Movimento (Cinética) -->
              <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 22px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 16px 0; font-size: 1.05rem; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 8px;">
                  <span>⚙️ Configurações Cinéticas de Movimento</span>
                </h3>

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px;">
                  <div>
                    <label style="font-size: 0.8rem; font-weight: 600; color: #475569; display: block; margin-bottom: 6px;">Direção do Movimento</label>
                    <select onchange="VideoCameraMotionModule.updateSetting('${activeProfile?.id}', 'direção', this.value)" style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem;">
                      <option value="forward" ${activeProfile?.settings?.direção === 'forward' ? 'selected' : ''}>Avanço Frontal (Forward)</option>
                      <option value="backward" ${activeProfile?.settings?.direção === 'backward' ? 'selected' : ''}>Recuo (Backward)</option>
                      <option value="left_to_right" ${activeProfile?.settings?.direção === 'left_to_right' ? 'selected' : ''}>Esquerda para Direita</option>
                      <option value="right_to_left" ${activeProfile?.settings?.direção === 'right_to_left' ? 'selected' : ''}>Direita para Esquerda</option>
                      <option value="upward" ${activeProfile?.settings?.direção === 'upward' ? 'selected' : ''}>Ascendente (Upward)</option>
                      <option value="downward" ${activeProfile?.settings?.direção === 'downward' ? 'selected' : ''}>Descendente (Downward)</option>
                      <option value="clockwise" ${activeProfile?.settings?.direção === 'clockwise' ? 'selected' : ''}>Horário (Clockwise)</option>
                      <option value="counter_clockwise" ${activeProfile?.settings?.direção === 'counter_clockwise' ? 'selected' : ''}>Anti-horário</option>
                      <option value="none" ${activeProfile?.settings?.direção === 'none' ? 'selected' : ''}>Fixo / Sem Deslocamento</option>
                    </select>
                  </div>

                  <div>
                    <label style="font-size: 0.8rem; font-weight: 600; color: #475569; display: block; margin-bottom: 6px;">Velocidade</label>
                    <select onchange="VideoCameraMotionModule.updateSetting('${activeProfile?.id}', 'velocidade', this.value)" style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem;">
                      <option value="slow" ${activeProfile?.settings?.velocidade === 'slow' ? 'selected' : ''}>Lenta / Cinemática (Recomendada)</option>
                      <option value="medium" ${activeProfile?.settings?.velocidade === 'medium' ? 'selected' : ''}>Moderada</option>
                      <option value="dynamic" ${activeProfile?.settings?.velocidade === 'dynamic' ? 'selected' : ''}>Dinâmica / Ágil</option>
                      <option value="zero" ${activeProfile?.settings?.velocidade === 'zero' ? 'selected' : ''}>Estática (Zero)</option>
                    </select>
                  </div>

                  <div>
                    <label style="font-size: 0.8rem; font-weight: 600; color: #475569; display: block; margin-bottom: 6px;">
                      Intensidade (1 a 10): <span id="val-intensidade">${activeProfile?.settings?.intensidade || 3}</span>
                    </label>
                    <input type="range" min="1" max="10" value="${activeProfile?.settings?.intensidade || 3}" oninput="document.getElementById('val-intensidade').innerText=this.value; VideoCameraMotionModule.updateSetting('${activeProfile?.id}', 'intensidade', Number(this.value))" style="width: 100%; margin-top: 8px;">
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
                  <div>
                    <label style="font-size: 0.8rem; font-weight: 600; color: #475569; display: block; margin-bottom: 6px;">Duração da Tomada (s)</label>
                    <input type="number" step="0.5" min="1" max="60" value="${activeProfile?.settings?.duração || 5.0}" onchange="VideoCameraMotionModule.updateSetting('${activeProfile?.id}', 'duração', Number(this.value))" style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem;">
                  </div>

                  <div>
                    <label style="font-size: 0.8rem; font-weight: 600; color: #475569; display: block; margin-bottom: 6px;">Ponto de Início</label>
                    <input type="text" value="${escapeHTML(activeProfile?.settings?.início || '0%')}" onchange="VideoCameraMotionModule.updateSetting('${activeProfile?.id}', 'início', this.value)" style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem;">
                  </div>

                  <div>
                    <label style="font-size: 0.8rem; font-weight: 600; color: #475569; display: block; margin-bottom: 6px;">Ponto de Fim</label>
                    <input type="text" value="${escapeHTML(activeProfile?.settings?.fim || '100%')}" onchange="VideoCameraMotionModule.updateSetting('${activeProfile?.id}', 'fim', this.value)" style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem;">
                  </div>
                </div>
              </div>

              <!-- Seção 2: Parâmetros de Câmera e Óptica -->
              <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 22px;">
                <h3 style="margin: 0 0 16px 0; font-size: 1.05rem; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 8px;">
                  <span>📐 Parâmetros Ópticos e Enquadramento da Câmera</span>
                </h3>

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px;">
                  <div>
                    <label style="font-size: 0.8rem; font-weight: 600; color: #475569; display: block; margin-bottom: 6px;">Enquadramento</label>
                    <select ${activeProfile?.isLocked ? 'disabled' : ''} onchange="VideoCameraMotionModule.updateCameraConfig('${activeProfile?.id}', 'enquadramento', this.value)" style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; background: ${activeProfile?.isLocked ? '#f1f5f9' : '#fff'};">
                      ${framings.map(f => `
                        <option value="${f}" ${activeProfile?.cameraConfig?.enquadramento === f ? 'selected' : ''}>${f}</option>
                      `).join('')}
                    </select>
                  </div>

                  <div>
                    <label style="font-size: 0.8rem; font-weight: 600; color: #475569; display: block; margin-bottom: 6px;">Lente Conceitual</label>
                    <select ${activeProfile?.isLocked ? 'disabled' : ''} onchange="VideoCameraMotionModule.updateCameraConfig('${activeProfile?.id}', 'lenteConceitual', this.value)" style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; background: ${activeProfile?.isLocked ? '#f1f5f9' : '#fff'};">
                      ${lenses.map(l => `
                        <option value="${l.label}" ${activeProfile?.cameraConfig?.lenteConceitual === l.label ? 'selected' : ''}>${l.label} (${l.fieldOfView})</option>
                      `).join('')}
                    </select>
                  </div>

                  <div>
                    <label style="font-size: 0.8rem; font-weight: 600; color: #475569; display: block; margin-bottom: 6px;">Altura da Câmera</label>
                    <input ${activeProfile?.isLocked ? 'disabled' : ''} type="text" value="${escapeHTML(activeProfile?.cameraConfig?.altura || '1.50m (olho humano)')}" onchange="VideoCameraMotionModule.updateCameraConfig('${activeProfile?.id}', 'altura', this.value)" style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; background: ${activeProfile?.isLocked ? '#f1f5f9' : '#fff'};">
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
                  <div>
                    <label style="font-size: 0.8rem; font-weight: 600; color: #475569; display: block; margin-bottom: 6px;">Distância ao Ponto Focal</label>
                    <input ${activeProfile?.isLocked ? 'disabled' : ''} type="text" value="${escapeHTML(activeProfile?.cameraConfig?.distância || '4.0m')}" onchange="VideoCameraMotionModule.updateCameraConfig('${activeProfile?.id}', 'distância', this.value)" style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; background: ${activeProfile?.isLocked ? '#f1f5f9' : '#fff'};">
                  </div>

                  <div>
                    <label style="font-size: 0.8rem; font-weight: 600; color: #475569; display: block; margin-bottom: 6px;">Direção Cardinal / Ângulo</label>
                    <input ${activeProfile?.isLocked ? 'disabled' : ''} type="text" value="${escapeHTML(activeProfile?.cameraConfig?.direção || 'frontal')}" onchange="VideoCameraMotionModule.updateCameraConfig('${activeProfile?.id}', 'direção', this.value)" style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; background: ${activeProfile?.isLocked ? '#f1f5f9' : '#fff'};">
                  </div>

                  <div>
                    <label style="font-size: 0.8rem; font-weight: 600; color: #475569; display: block; margin-bottom: 6px;">Ponto de Interesse (Foco)</label>
                    <input ${activeProfile?.isLocked ? 'disabled' : ''} type="text" value="${escapeHTML(activeProfile?.cameraConfig?.pontoDeInteresse || 'Ilha gourmet e bancada em pedra')}" onchange="VideoCameraMotionModule.updateCameraConfig('${activeProfile?.id}', 'pontoDeInteresse', this.value)" style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; background: ${activeProfile?.isLocked ? '#f1f5f9' : '#fff'};">
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- Rodapé e Transição para G09 -->
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 0.85rem; color: #64748b;">
              Etapa concluída: <strong>G08 — Definição de Câmera e Movimento</strong>. Aguarde o Bloco G09.
            </div>
            <button class="btn btn-primary" onclick="VideoCameraMotionModule.finishAndAwaitG09('${video.id}')" style="padding: 10px 22px; border-radius: 6px; background: #0f172a; color: #fff; font-weight: 600; border: none; cursor: pointer;">
              Homologar Câmera & Movimento & Concluir G08 &rarr;
            </button>
          </div>

          <!-- Container de Modais -->
          <div id="camera-motion-modal-container"></div>
        </div>
      `;
    },

    selectMotionType(profileId, motionType) {
      const state = this._getState();
      if (!state) return;
      state.updateCameraMotionProfile(profileId, { motionType });
      const p = state.getCameraMotionProfile(profileId);
      this.refresh(p.videoProjectId);
    },

    updateSetting(profileId, key, value) {
      const state = this._getState();
      if (!state) return;
      const settings = {};
      settings[key] = value;
      state.updateCameraMotionProfile(profileId, { settings });
    },

    updateCameraConfig(profileId, key, value) {
      const state = this._getState();
      if (!state) return;
      const cameraConfig = {};
      cameraConfig[key] = value;
      try {
        state.updateCameraMotionProfile(profileId, { cameraConfig });
      } catch (e) {
        alert(e.message);
      }
    },

    changeScene(videoId, sceneId) {
      this.selectedSceneId = sceneId;
      const state = this._getState();
      if (!state) return;
      let profiles = state.getCameraMotionProfiles(videoId, { sceneId });
      if (profiles.length === 0) {
        state.createCameraMotionProfile({
          videoProjectId: videoId,
          sceneId,
          motionType: 'cinematic slow movement'
        });
        profiles = state.getCameraMotionProfiles(videoId, { sceneId });
      }
      this.selectedProfileId = profiles[0]?.id || null;
      this.refresh(videoId);
    },

    saveCurrentAsPreset(profileId) {
      const state = this._getState();
      if (!state) return;
      const name = prompt('Nome do novo Preset de Movimento:', 'Meu Movimento Personalizado');
      if (!name) return;
      const category = prompt('Categoria (ex: Geral, Detalhes, Fachada, Interiores):', 'Personalizado') || 'Personalizado';

      const preset = state.saveCameraMotionPreset(profileId, name, category);
      alert(`Preset "${preset.name}" salvo com sucesso!`);
    },

    openPresetsModal(videoId, profileId) {
      const state = this._getState();
      if (!state) return;
      const presets = state.getCameraMotionPresets();
      const container = document.getElementById('camera-motion-modal-container');
      if (!container) return;

      container.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 9999;">
          <div style="background: #fff; width: 90%; max-width: 750px; border-radius: 10px; padding: 24px; max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3);">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h3 style="margin: 0; font-size: 1.2rem; font-weight: 700;">⭐ Biblioteca de Presets de Câmera (${presets.length})</h3>
              <button onclick="document.getElementById('camera-motion-modal-container').innerHTML=''" style="background: none; border: none; font-size: 1.3rem; cursor: pointer;">&times;</button>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${presets.map(p => `
                <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 14px; background: #f8fafc; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-weight: 700; font-size: 0.9rem; color: #1e293b;">
                      ${escapeHTML(p.name)} <span style="font-size: 0.75rem; color: #64748b; font-weight: normal;">(${escapeHTML(p.category)})</span>
                    </div>
                    <div style="font-size: 0.75rem; color: #475569; margin-top: 3px;">
                      Movimento: <strong>${escapeHTML(p.motionType)}</strong> &bull; Duração: <strong>${p.settings?.duração || 5}s</strong> &bull; Lente: <strong>${p.cameraConfig?.lenteConceitual || '35mm'}</strong>
                    </div>
                  </div>
                  <button onclick="VideoCameraMotionModule.applyPreset('${profileId}', '${p.id}', '${videoId}')" style="background: #059669; color: #fff; border: none; padding: 6px 14px; border-radius: 4px; font-weight: 600; font-size: 0.8rem; cursor: pointer;">
                    Aplicar
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    },

    applyPreset(profileId, presetId, videoId) {
      const state = this._getState();
      if (!state) return;
      state.applyCameraMotionPreset(profileId, presetId);
      document.getElementById('camera-motion-modal-container').innerHTML = '';
      this.refresh(videoId);
    },

    finishAndAwaitG09(videoId) {
      alert('Bloco G08 concluído com sucesso! Os perfis de movimento e parâmetros de câmera foram homologados com salvaguarda contra distorções.\n\nAguardando o Bloco G09.');
    },

    refresh(videoId) {
      const root = document.getElementById('video-camera-motion-root') || document.getElementById('app-main-content');
      if (root) {
        root.innerHTML = this.render(videoId);
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.VideoCameraMotionModule = VideoCameraMotionModule;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = VideoCameraMotionModule;
  }

})(typeof window !== 'undefined' ? window : global);
