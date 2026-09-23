/**
 * ================================================================
 * ARQVERTICE STUDIO — D07: VISUAL LOCKS & MEMORY UI MODULE
 * ================================================================
 * Módulo de interface de usuário responsável pela gestão da Seção 8
 * ("Contexto Visual, Memória & Locks") do Workspace de Visualização.
 * 
 * Recursos:
 * - Controle dos 11 Locks Categóricos Canônicos com switch interativo;
 * - Gestão de Locks Específicos por Elemento (SOFA_LOCKED, PAINEL_LOCKED, etc.);
 * - Assistente de Alteração Pontual Estruturada (TARGET & PRESERVE);
 * - Detecção e Mediação de Conflitos de Lock com Salvaguarda de IA;
 * - Inspetor de Consistência Entre Câmeras e Linguagem Global de Materiais;
 * - Auditoria de QA e Sinalização de POTENTIAL_UNEXPECTED_CHANGE.
 */

const VisualLocksModule = (function () {
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
    if (!isoDate) return 'Recente';
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

  // Dicionário visual de ícones e descrições para os 11 locks
  const LOCK_META = {
    GEOMETRY: { icon: 'box', label: 'Geometria Arquitetônica', desc: 'Preserva arquitetura, alvenarias e proporções do ambiente.' },
    LAYOUT: { icon: 'layout-grid', label: 'Layout & Circulação', desc: 'Preserva posição dos móveis estruturais e fluxos de passagem.' },
    OPENINGS: { icon: 'door-closed', label: 'Portas, Janelas & Vãos', desc: 'Preserva caixilhos, vãos de esquadrias e aberturas técnicas.' },
    CAMERA: { icon: 'camera', label: 'Enquadramento de Câmera', desc: 'Preserva ponto de vista, distância focal e proporção de corte.' },
    MATERIALS: { icon: 'layers', label: 'Fidelidade de Materiais', desc: 'Preserva piso, paredes, bancadas, marcenaria e revestimentos.' },
    COLORS: { icon: 'palette', label: 'Paleta Cromática Mineral', desc: 'Preserva paleta homologada (areia, linho cru e neutros).' },
    LIGHTING: { icon: 'sun', label: 'Intenção Luminosa', desc: 'Preserva temperatura de cor e atmosfera de luz aprovadas.' },
    FURNITURE: { icon: 'armchair', label: 'Mobiliário Homologado', desc: 'Preserva peças de design de interiores aprovadas.' },
    DECOR: { icon: 'flower-2', label: 'Objetos & Decoração', desc: 'Preserva vasos, adornos e tapeçaria decorativa.' },
    LANDSCAPE: { icon: 'trees', label: 'Paisagismo & Exterior', desc: 'Preserva vegetação e integração com decks e jardins.' },
    COMPOSITION: { icon: 'maximize', label: 'Composição Global', desc: 'Preserva harmonia visual geral e balanço estético da cena.' }
  };

  /**
   * Renderiza a Seção 8 completa do Workspace de Visualização
   */
  function render(visData, env, project) {
    const state = getState();
    const envId = env.id;
    const projId = project.id;

    const categoricalLocks = state.getEnvironmentLocks(projId, envId);
    const elementLocks = state.getElementLocks(envId);
    const crossCameraElements = state.getCrossCameraConsistentElements(envId);
    const globalMaterialLang = state.getGlobalProjectMaterialLanguage(projId, envId);
    const audits = (state.data.visualChangeAudits || []).filter(a => a.environmentId === envId);

    const activeLocksCount = categoricalLocks.filter(l => l.enabled).length;

    return `
      <section class="vis-panel-section visual-locks-workspace" id="vis-section-locks">
        <!-- 1. CABEÇALHO DA SEÇÃO DE LOCKS -->
        <div class="vis-section-header">
          <div class="vis-sec-title">
            <i data-lucide="shield-check" class="text-accent"></i>
            <div>
              <h2>8. Consistência Visual, Memória & Locks (D07)</h2>
              <p class="section-subtitle">Sistema de travas arquitetônicas para impedir regenerações arbitrárias e garantir continuidade do projeto</p>
            </div>
          </div>
          <div class="header-status-group">
            <span class="badge badge-success">
              <i data-lucide="lock"></i> ${activeLocksCount} de 11 Locks Ativos
            </span>
            <span class="badge badge-subtle">
              <i data-lucide="bookmark"></i> ${elementLocks.length} Locks de Elemento
            </span>
          </div>
        </div>

        <!-- 2. GRADE DOS 11 LOCKS CATEGÓRICOS CANÔNICOS -->
        <div class="locks-grid-container mt-3">
          <div class="locks-grid-header">
            <h3><i data-lucide="sliders" class="inline-icon"></i> Travas Categóricas do Ambiente</h3>
            <span class="text-sm text-muted">Controles independentes que governam as diretrizes preservadas na geração de imagens.</span>
          </div>

          <div class="locks-grid">
            ${categoricalLocks.map(l => {
              const meta = LOCK_META[l.lockType] || { icon: 'lock', label: l.lockType, desc: l.notes || '' };
              const isEnabled = Boolean(l.enabled);

              return `
                <div class="lock-card ${isEnabled ? 'is-enabled' : 'is-disabled'}" id="lock-card-${l.lockType}">
                  <div class="lock-card-header">
                    <div class="lock-icon-title">
                      <div class="lock-icon-box ${isEnabled ? 'bg-accent-subtle text-accent' : 'bg-muted text-muted'}">
                        <i data-lucide="${meta.icon}"></i>
                      </div>
                      <div>
                        <strong>${escapeHTML(meta.label)}</strong>
                        <div class="lock-badges-row">
                          <span class="badge-scope">${escapeHTML(l.scope || 'ENVIRONMENT')}</span>
                          <span class="badge-source">${escapeHTML(l.source || 'USER')}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Switch Toggle -->
                    <label class="switch-toggle" title="${isEnabled ? 'Trava Ativa' : 'Trava Desativada'}">
                      <input type="checkbox" ${isEnabled ? 'checked' : ''} onchange="VisualLocksModule.toggleLock('${envId}', '${l.lockType}', this.checked)">
                      <span class="slider-round"></span>
                    </label>
                  </div>

                  <p class="lock-desc">${escapeHTML(meta.desc)}</p>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 3. GESTÃO DE LOCKS POR ELEMENTO ESPECÍFICO -->
        <div class="element-locks-panel mt-4">
          <div class="panel-header-row">
            <div>
              <h3><i data-lucide="tag" class="inline-icon"></i> Locks por Elemento Específico</h3>
              <p class="text-sm text-muted">Trava elementos isolados (ex: Sofá Homologado, Painel da TV, Piso), superando bloqueios genéricos.</p>
            </div>
            <button class="btn btn-outline btn-sm" onclick="VisualLocksModule.openAddElementLockModal('${envId}')">
              <i data-lucide="plus"></i> Adicionar Lock de Elemento
            </button>
          </div>

          ${elementLocks.length > 0 ? `
            <div class="element-locks-table-box mt-3">
              <table class="table-element-locks">
                <thead>
                  <tr>
                    <th>Elemento</th>
                    <th>Categoria</th>
                    <th>Especificação Homologada</th>
                    <th>Origem / Câmera</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  ${elementLocks.map(el => `
                    <tr class="${el.enabled ? '' : 'row-disabled'}">
                      <td>
                        <strong>${escapeHTML(el.elementName)}</strong>
                        <small class="text-muted d-block">${escapeHTML(el.elementKey)}</small>
                      </td>
                      <td><span class="badge badge-subtle">${escapeHTML(el.category)}</span></td>
                      <td class="cell-statement">"${escapeHTML(el.statement)}"</td>
                      <td>
                        <span class="badge badge-info">
                          <i data-lucide="camera" class="inline-icon"></i> ${escapeHTML(el.approvedInCameraId ? (state.getEnvironmentCamera(el.approvedInCameraId)?.cameraCode || 'Câmera') : 'Decisão Homologada')}
                        </span>
                      </td>
                      <td>
                        <label class="switch-toggle-sm">
                          <input type="checkbox" ${el.enabled ? 'checked' : ''} onchange="VisualLocksModule.toggleElementLock('${envId}', '${el.elementKey}', this.checked)">
                          <span class="slider-round"></span>
                        </label>
                      </td>
                      <td>
                        <button class="btn btn-ghost btn-xs text-danger" onclick="VisualLocksModule.removeElementLock('${envId}', '${el.elementKey}')" title="Excluir lock de elemento">
                          <i data-lucide="trash-2"></i>
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : `
            <div class="vis-empty-box mt-3">
              <i data-lucide="bookmark"></i>
              <p>Nenhum lock por elemento cadastrado ainda. Clique em "Adicionar Lock de Elemento" para criar um bloqueio pontual.</p>
            </div>
          `}
        </div>

        <!-- 4. ASSISTENTE DE ALTERAÇÃO PONTUAL (TARGET & PRESERVE) -->
        <div class="targeted-alteration-panel mt-4">
          <div class="panel-header-row">
            <div>
              <h3><i data-lucide="edit-3" class="inline-icon"></i> Assistente de Alteração Pontual Estruturada</h3>
              <p class="text-sm text-muted">Estrutura comandos do tipo *"Troque somente o sofá"* em solicitações com alvos claros e lista de preservação estrita.</p>
            </div>
          </div>

          <div class="alteration-form-card mt-3">
            <div class="alteration-inputs-grid">
              <div class="form-group">
                <label for="alteration-target-select"><i data-lucide="crosshair"></i> Elemento Alvo a Modificar:</label>
                <select id="alteration-target-select" class="form-control" onchange="VisualLocksModule.onTargetSelectChange(this.value)">
                  <option value="Sofá do Living" selected>Sofá do Living (Mobiliário)</option>
                  <option value="Piso da Área Social">Piso da Área Social (Material / Revestimento)</option>
                  <option value="Iluminação Cênica">Iluminação Cênica (Luz / Atmosfera)</option>
                  <option value="Câmera & Enquadramento">Câmera & Enquadramento</option>
                  <option value="Múltiplos Elementos">Múltiplos Elementos (Sofá + Iluminação)</option>
                  <option value="CUSTOM">Outro elemento específico...</option>
                </select>
              </div>

              <div class="form-group" id="group-custom-target" style="display: none;">
                <label for="alteration-custom-target">Nome do Elemento Personalizado:</label>
                <input type="text" id="alteration-custom-target" class="form-control" placeholder="Ex: Mesa de Centro, Tapete...">
              </div>
            </div>

            <div class="form-group mt-3">
              <label for="alteration-instruction-text"><i data-lucide="message-square"></i> Nova Instrução Arquitetônica:</label>
              <textarea id="alteration-instruction-text" class="form-control" rows="2" placeholder="Ex: Trocar por sofá de 3 lugares em linho bege de desenho reto e pés em madeira carvalho."></textarea>
            </div>

            <div class="alteration-actions mt-3">
              <button type="button" class="btn btn-primary" onclick="VisualLocksModule.processTargetedAlteration('${envId}', '${projId}')">
                <i data-lucide="check-circle"></i> Validar & Estruturar Alteração
              </button>
            </div>

            <!-- Caixa de Prévia Estruturada e Conflito -->
            <div id="alteration-preview-box" class="alteration-preview-box mt-3" style="display: none;">
              <!-- Preenchido via JS -->
            </div>
          </div>
        </div>

        <!-- 5. CONSISTÊNCIA ENTRE CÂMERAS & LINGUAGEM GLOBAL DO PROJETO -->
        <div class="consistency-matrix-grid mt-4">
          <!-- Consistência Entre Câmeras -->
          <div class="consistency-card">
            <div class="consistency-card-header">
              <i data-lucide="camera" class="text-accent"></i>
              <div>
                <h4>Consistência Entre Câmeras (D07 Item 19)</h4>
                <small class="text-muted">Elementos aprovados em uma câmera reconhecidos no mesmo ambiente</small>
              </div>
            </div>
            <div class="consistency-card-body">
              ${crossCameraElements.length > 0 ? `
                <ul class="cross-cam-list">
                  ${crossCameraElements.map(ce => `
                    <li>
                      <strong>${escapeHTML(ce.elementName)}</strong>:
                      <span>${escapeHTML(ce.statement)}</span>
                      <small class="text-accent d-block">Homologado via: ${escapeHTML(ce.approvedInCamera)}</small>
                    </li>
                  `).join('')}
                </ul>
              ` : `
                <p class="text-sm text-muted">Nenhum elemento aprovado ainda nas câmeras deste ambiente.</p>
              `}
            </div>
          </div>

          <!-- Linguagem Global do Projeto -->
          <div class="consistency-card">
            <div class="consistency-card-header">
              <i data-lucide="globe" class="text-accent"></i>
              <div>
                <h4>Linguagem Global do Projeto (D07 Item 20)</h4>
                <small class="text-muted">Herança de materiais e paleta com respeito a exceções locais</small>
              </div>
            </div>
            <div class="consistency-card-body">
              <div class="global-lang-details">
                <div class="lang-item">
                  <strong>Madeira Predominante:</strong>
                  <p>${escapeHTML(globalMaterialLang.effectiveMaterials.madeiraPredominante)}</p>
                </div>
                <div class="lang-item">
                  <strong>Pedra Natural:</strong>
                  <p>${escapeHTML(globalMaterialLang.effectiveMaterials.pedraNatural)}</p>
                </div>
                <div class="lang-item">
                  <strong>Paleta Cromática:</strong>
                  <p>${escapeHTML(globalMaterialLang.effectiveMaterials.paletaCromatica)}</p>
                </div>
                ${globalMaterialLang.hasLocalOverrides ? `
                  <div class="override-alert-pill">
                    <i data-lucide="alert-circle"></i> Possui exceção local homologada para este ambiente
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        </div>

        <!-- 6. AUDITORIA DE QA E DETECÇÃO DE MUDANÇAS INESPERADAS -->
        <div class="qa-audit-panel mt-4">
          <div class="panel-header-row">
            <div>
              <h3><i data-lucide="microscope" class="inline-icon"></i> Auditoria de QA: Detecção de Mudanças Inesperadas</h3>
              <p class="text-sm text-muted">Compara gerações antes × depois para sinalizar possíveis desvios acidentais (POTENTIAL_UNEXPECTED_CHANGE).</p>
            </div>
            <button class="btn btn-outline btn-sm" onclick="VisualLocksModule.runManualQAAudit('${envId}')">
              <i data-lucide="refresh-cw"></i> Executar Verificação de QA
            </button>
          </div>

          <div class="qa-audit-list mt-3">
            ${audits.length > 0 ? audits.slice(0, 3).map(a => `
              <div class="qa-audit-card ${a.status === 'POTENTIAL_UNEXPECTED_CHANGE' ? 'has-drift-warning' : 'is-verified'}">
                <div class="qa-audit-header">
                  <span class="badge ${a.status === 'POTENTIAL_UNEXPECTED_CHANGE' ? 'badge-warning' : 'badge-success'}">
                    <i data-lucide="${a.status === 'POTENTIAL_UNEXPECTED_CHANGE' ? 'alert-triangle' : 'check'}"></i> ${escapeHTML(a.status)}
                  </span>
                  <small class="text-muted">${formatRelativeDate(a.createdAt)}</small>
                </div>
                <p class="qa-audit-notes">${escapeHTML(a.notes)}</p>
                ${(a.detectedDrifts && a.detectedDrifts.length > 0) ? `
                  <div class="drifts-list">
                    ${a.detectedDrifts.map(d => `
                      <div class="drift-item">
                        <strong>${escapeHTML(d.element || d.category)}</strong>: ${escapeHTML(d.description)}
                        <span class="badge badge-danger text-xs">Atenção</span>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            `).join('') : `
              <div class="vis-empty-box">
                <i data-lucide="shield"></i>
                <p>Nenhuma anomalia ou alteração inesperada detectada até o momento. O ambiente mantém total conformidade com os locks.</p>
              </div>
            `}
          </div>
        </div>

        <!-- 7. MODAL DE CADASTRO DE LOCK POR ELEMENTO -->
        <div id="modal-element-lock-create" class="modal-backdrop" style="display: none;">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h3><i data-lucide="tag" class="text-accent"></i> Novo Lock por Elemento</h3>
                <button class="btn-close" onclick="VisualLocksModule.closeAddElementLockModal()">&times;</button>
              </div>
              <div class="modal-body">
                <div class="form-group">
                  <label for="el-lock-name-input">Nome do Elemento *:</label>
                  <input type="text" id="el-lock-name-input" class="form-control" placeholder="Ex: Poltrona de Leitura, Painel Ripado...">
                </div>
                <div class="form-group mt-3">
                  <label for="el-lock-key-input">Identificador (Chave) *:</label>
                  <input type="text" id="el-lock-key-input" class="form-control" placeholder="Ex: POLTRONA_LEITURA, PAINEL_RIPADO">
                </div>
                <div class="form-group mt-3">
                  <label for="el-lock-cat-select">Categoria:</label>
                  <select id="el-lock-cat-select" class="form-control">
                    <option value="FURNITURE">Mobiliário (FURNITURE)</option>
                    <option value="MATERIAL">Material / Revestimento (MATERIAL)</option>
                    <option value="LIGHTING">Iluminação (LIGHTING)</option>
                    <option value="DECOR">Decoração (DECOR)</option>
                    <option value="OPENING">Esquadrias / Aberturas (OPENING)</option>
                  </select>
                </div>
                <div class="form-group mt-3">
                  <label for="el-lock-stmt-input">Especificação Homologada *:</label>
                  <textarea id="el-lock-stmt-input" class="form-control" rows="2" placeholder="Ex: Poltrona em couro natural caramelo com base em aço preto acetinado."></textarea>
                </div>
                <input type="hidden" id="el-lock-env-id" value="${envId}">
              </div>
              <div class="modal-footer">
                <button class="btn btn-outline" onclick="VisualLocksModule.closeAddElementLockModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="VisualLocksModule.saveNewElementLock()">Salvar Lock de Elemento</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  /**
   * Alterna estado de um lock categórico
   */
  function toggleLock(environmentId, lockType, isChecked) {
    const state = getState();
    try {
      state.setEnvironmentLock(environmentId, lockType, isChecked, { source: 'USER' });
      if (window.toast) window.toast(`Trava de ${lockType} ${isChecked ? 'ativada' : 'desativada'} com sucesso!`, 'info');
      refreshView(environmentId);
    } catch (err) {
      if (window.toast) window.toast(err.message, 'error');
      else alert(err.message);
    }
  }

  /**
   * Alterna estado de um lock por elemento específico
   */
  function toggleElementLock(environmentId, elementKey, isChecked) {
    const state = getState();
    try {
      state.setElementLock(environmentId, elementKey, isChecked, null, { source: 'USER' });
      if (window.toast) window.toast(`Lock do elemento ${elementKey} ${isChecked ? 'ativado' : 'desativado'}!`, 'info');
      refreshView(environmentId);
    } catch (err) {
      if (window.toast) window.toast(err.message, 'error');
      else alert(err.message);
    }
  }

  /**
   * Remove lock de elemento
   */
  function removeElementLock(environmentId, elementKey) {
    if (!confirm(`Deseja remover o lock do elemento '${elementKey}'?`)) return;
    const state = getState();
    state.removeElementLock(environmentId, elementKey);
    if (window.toast) window.toast('Lock de elemento removido com sucesso.', 'info');
    refreshView(environmentId);
  }

  /**
   * Abre e fecha modal de cadastro de lock de elemento
   */
  function openAddElementLockModal(environmentId) {
    const m = document.getElementById('modal-element-lock-create');
    const envInput = document.getElementById('el-lock-env-id');
    if (m && envInput) {
      envInput.value = environmentId;
      m.style.display = 'flex';
    }
  }

  function closeAddElementLockModal() {
    const m = document.getElementById('modal-element-lock-create');
    if (m) m.style.display = 'none';
  }

  function saveNewElementLock() {
    const state = getState();
    const envId = document.getElementById('el-lock-env-id')?.value;
    const name = document.getElementById('el-lock-name-input')?.value.trim();
    const key = document.getElementById('el-lock-key-input')?.value.trim().toUpperCase();
    const cat = document.getElementById('el-lock-cat-select')?.value;
    const stmt = document.getElementById('el-lock-stmt-input')?.value.trim();

    if (!name || !key || !stmt) {
      alert('Por favor preencha todos os campos obrigatórios.');
      return;
    }

    try {
      state.setElementLock(envId, key, true, stmt, {
        elementName: name,
        category: cat,
        source: 'USER'
      });
      if (window.toast) window.toast('Lock de elemento cadastrado com sucesso!', 'success');
      closeAddElementLockModal();
      refreshView(envId);
    } catch (e) {
      alert(e.message);
    }
  }

  /**
   * Ajusta campo personalizado de alvo
   */
  function onTargetSelectChange(val) {
    const customGroup = document.getElementById('group-custom-target');
    if (customGroup) {
      customGroup.style.display = (val === 'CUSTOM') ? 'block' : 'none';
    }
  }

  /**
   * Valida e estrutura alteração pontual
   */
  function processTargetedAlteration(environmentId, projectId) {
    const state = getState();
    const select = document.getElementById('alteration-target-select');
    const customInput = document.getElementById('alteration-custom-target');
    const instrInput = document.getElementById('alteration-instruction-text');
    const previewBox = document.getElementById('alteration-preview-box');

    let target = select ? select.value : 'Sofá';
    if (target === 'CUSTOM' && customInput && customInput.value.trim()) {
      target = customInput.value.trim();
    } else if (target === 'Múltiplos Elementos') {
      target = ['Sofá', 'Iluminação'];
    }

    const instruction = instrInput ? instrInput.value.trim() : '';

    const alt = state.structureTargetedAlteration(projectId, environmentId, target, instruction);

    if (previewBox) {
      previewBox.style.display = 'block';

      if (alt.hasConflict) {
        previewBox.className = 'alteration-preview-box has-conflict-alert';
        previewBox.innerHTML = `
          <div class="conflict-alert-card">
            <div class="conflict-title">
              <i data-lucide="alert-triangle" class="text-danger"></i>
              <strong>Conflito com Lock Ativo Identificado!</strong>
            </div>
            <p>${escapeHTML(alt.conflicts[0].message)}</p>
            <div class="conflict-actions mt-2">
              <button class="btn btn-danger btn-sm" onclick="VisualLocksModule.confirmTemporaryUnlock('${environmentId}', '${projectId}')">
                <i data-lucide="unlock"></i> Desbloquear Temporariamente e Gerar
              </button>
              <button class="btn btn-outline btn-sm" onclick="document.getElementById('alteration-preview-box').style.display='none'">
                Cancelar Alteração
              </button>
            </div>
          </div>
        `;
      } else {
        previewBox.className = 'alteration-preview-box is-valid-preview';
        previewBox.innerHTML = `
          <div class="preview-valid-card">
            <div class="preview-title text-success">
              <i data-lucide="check-circle-2"></i>
              <strong>Solicitação Estruturada com Sucesso (Sem Conflitos de Lock)</strong>
            </div>
            <div class="target-preserve-box mt-2">
              <p><strong>TARGET:</strong> [${escapeHTML(alt.targetElements.join(', '))}]</p>
              <p><strong>NOVA INSTRUÇÃO:</strong> "${escapeHTML(alt.instruction || 'Nenhuma instrução adicional')}"</p>
              <p><strong>PRESERVAR ESTRITAMENTE:</strong> ${escapeHTML(alt.preserveList.join(', '))}</p>
            </div>
            <button class="btn btn-primary btn-sm mt-3" onclick="VisualLocksModule.sendToRenderEngine('${environmentId}', '${projectId}')">
              <i data-lucide="sparkles"></i> Enviar ao Motor de Render (D06)
            </button>
          </div>
        `;
      }
      if (window.lucide) window.lucide.createIcons();
    }
  }

  function confirmTemporaryUnlock(environmentId, projectId) {
    if (window.toast) window.toast('Desbloqueio temporário autorizado pelo usuário. Enviando ao motor de render...', 'info');
    sendToRenderEngine(environmentId, projectId, { temporaryUnlock: true });
  }

  function sendToRenderEngine(environmentId, projectId, options = {}) {
    const instrInput = document.getElementById('alteration-instruction-text');
    const select = document.getElementById('alteration-target-select');
    const customInput = document.getElementById('alteration-custom-target');

    let target = select ? select.value : 'Sofá';
    if (target === 'CUSTOM' && customInput && customInput.value.trim()) {
      target = customInput.value.trim();
    }

    const text = instrInput ? instrInput.value.trim() : `Alteração pontual em ${target}`;

    // Rola até a Seção 6 e preenche
    const renderIntentInput = document.getElementById('render-user-intent');
    if (renderIntentInput) {
      renderIntentInput.value = text;
      renderIntentInput.scrollIntoView({ behavior: 'smooth' });
      renderIntentInput.focus();
    }
  }

  function runManualQAAudit(environmentId) {
    const state = getState();
    const lastJob = (state.data.renderJobs || []).find(j => j.environmentId === environmentId);
    if (!lastJob) {
      alert('Nenhum render encontrado para auditar neste ambiente.');
      return;
    }

    const audit = state.detectUnexpectedChanges(null, lastJob.id);
    if (window.toast) {
      if (audit.status === 'POTENTIAL_UNEXPECTED_CHANGE') {
        window.toast('Auditoria de QA: Identificado potencial desvio em elementos protegidos!', 'warning');
      } else {
        window.toast('Auditoria de QA: Ambiente 100% aderente aos locks!', 'success');
      }
    }
    refreshView(environmentId);
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
    toggleLock,
    toggleElementLock,
    removeElementLock,
    openAddElementLockModal,
    closeAddElementLockModal,
    saveNewElementLock,
    onTargetSelectChange,
    processTargetedAlteration,
    confirmTemporaryUnlock,
    sendToRenderEngine,
    runManualQAAudit
  };

})();

if (typeof window !== 'undefined') {
  window.VisualLocksModule = VisualLocksModule;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VisualLocksModule;
}
