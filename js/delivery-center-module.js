/**
 * ArqVértice Studio — Bloco F13: Centro de Entrega do Studio (Delivery Center)
 * Centraliza a visualização, filtragem, auditoria e finalização da entrega do projeto em 10 seções canônicas.
 */

const DeliveryCenterModule = (function () {
  'use strict';

  let currentProjectId = null;
  let activeRevision = 'REV00';
  let deliveryData = null;
  let itemSelectionState = {}; // id -> boolean
  let activeSectionFilter = 'ALL';

  function init() {
    console.log('DeliveryCenterModule inicializado.');
  }

  function open(projectId = null, options = {}) {
    const pId = projectId || (typeof StudioState !== 'undefined' && StudioState.currentProject ? StudioState.currentProject.id : 'prj-praia-01');
    currentProjectId = pId;

    const project = window.StudioState ? StudioState.getProject(pId) : null;
    activeRevision = options.revision || project?.revision || 'REV00';

    loadData();
    renderModal();
  }

  function loadData() {
    if (!window.StudioState) return;
    try {
      deliveryData = StudioState.getDeliveryCenterData(currentProjectId, { revision: activeRevision });
      
      // Inicializa estado de seleção caso vazio
      deliveryData.sections.forEach(sec => {
        sec.items.forEach(item => {
          if (itemSelectionState[item.id] === undefined) {
            itemSelectionState[item.id] = item.included;
          }
        });
      });
    } catch (err) {
      console.error('Erro ao carregar dados do Centro de Entrega:', err);
    }
  }

  function toggleItemSelection(itemId, checked) {
    itemSelectionState[itemId] = checked;
    updateSelectionSummary();
  }

  function toggleAllInSection(sectionId, selectAll) {
    if (!deliveryData) return;
    const sec = deliveryData.sections.find(s => s.id === sectionId);
    if (!sec) return;

    sec.items.forEach(item => {
      itemSelectionState[item.id] = selectAll;
    });
    renderSectionsContent();
    updateSelectionSummary();
  }

  function setSectionFilter(secId) {
    activeSectionFilter = secId;
    renderSectionsContent();
    document.querySelectorAll('.del-tab-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(`del-tab-${secId}`);
    if (btn) btn.classList.add('active');
  }

  function updateSelectionSummary() {
    if (!deliveryData) return;

    let selectedCount = 0;
    let selectedBytes = 0;

    deliveryData.sections.forEach(sec => {
      sec.items.forEach(item => {
        if (itemSelectionState[item.id]) {
          selectedCount++;
          selectedBytes += item.sizeBytes;
        }
      });
    });

    const formatBytes = (bytes) => {
      if (!bytes || bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const countEl = document.getElementById('del-summary-selected-count');
    const sizeEl = document.getElementById('del-summary-selected-size');
    const finishBtn = document.getElementById('del-btn-finalize-main');

    if (countEl) countEl.innerText = `${selectedCount} de ${deliveryData.summary.totalFiles} arquivos`;
    if (sizeEl) sizeEl.innerText = formatBytes(selectedBytes);
    if (finishBtn) {
      finishBtn.disabled = selectedCount === 0 || !deliveryData.header.isDeliveryAllowed;
    }
  }

  function getStatusBadge(status) {
    switch (status) {
      case 'PRONTO PARA ENTREGA':
      case 'HOMOLOGADO':
      case 'APROVADO':
        return '<span class="del-badge del-badge-success"><i class="fas fa-check-circle"></i> ' + status + '</span>';
      case 'AVISOS PENDENTES':
        return '<span class="del-badge del-badge-warning"><i class="fas fa-exclamation-triangle"></i> ' + status + '</span>';
      case 'BLOQUEADO':
      case 'ERROS PENDENTES':
        return '<span class="del-badge del-badge-danger"><i class="fas fa-ban"></i> ' + status + '</span>';
      default:
        return `<span class="del-badge">${status}</span>`;
    }
  }

  function renderModal() {
    let existing = document.getElementById('delivery-center-modal');
    if (existing) existing.remove();

    if (!deliveryData) return;
    const h = deliveryData.header;
    const qa = deliveryData.qaReport;

    const modal = document.createElement('div');
    modal.id = 'delivery-center-modal';
    modal.className = 'studio-modal-backdrop active';
    modal.innerHTML = `
      <div class="studio-modal-card del-modal-card" style="max-width: 1200px; width: 95vw; max-height: 92vh; display: flex; flex-direction: column;">
        <!-- CABEÇALHO DA TELA "ENTREGA DO PROJETO" -->
        <div class="studio-modal-header" style="padding: 16px 24px; border-bottom: 1px solid var(--border-color, #333); background: rgba(0,0,0,0.25);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="background: var(--accent-color, #e0a96d); color: #111; width: 38px; height: 38px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                <i class="fas fa-box-open"></i>
              </div>
              <div>
                <h3 style="margin: 0; font-size: 1.25rem; letter-spacing: -0.02em;">
                  ENTREGA DO PROJETO &bull; ${h.projectName}
                </h3>
                <span style="font-size: 0.8rem; color: #888;">
                  Centro de Consolidação de Pacote Executivo e Encerramento
                </span>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              ${getStatusBadge(h.status)}
              <button class="studio-btn-icon" onclick="DeliveryCenterModule.closeModal()" style="background: none; border: none; color: #ccc; cursor: pointer; font-size: 1.2rem;">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>

          <!-- Metadados do Cabeçalho: Projeto, Cliente, Revisão, Data, Status -->
          <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 10px 14px; border-radius: 6px; font-size: 0.82rem;">
            <div><span style="color: #777;">PROJETO:</span> <strong style="color: #eee;">${h.projectCode || h.projectName}</strong></div>
            <div><span style="color: #777;">CLIENTE:</span> <strong style="color: #eee;">${h.clientName}</strong></div>
            <div><span style="color: #777;">REVISÃO:</span> <strong style="color: var(--accent-color, #e0a96d);">${h.revisao}</strong></div>
            <div><span style="color: #777;">DATA:</span> <strong style="color: #eee;">${h.date}</strong></div>
            <div><span style="color: #777;">PORTÃO QA:</span> <strong style="color: #eee;">${qa.counts.PASS}/20 PASS</strong></div>
          </div>
        </div>

        <!-- Barra de Navegação das 10 Seções -->
        <div style="display: flex; gap: 4px; overflow-x: auto; padding: 10px 24px; background: rgba(0,0,0,0.15); border-bottom: 1px solid var(--border-color, #333);">
          <button id="del-tab-ALL" class="del-tab-btn active" onclick="DeliveryCenterModule.setSectionFilter('ALL')">
            TODAS (${deliveryData.summary.totalFiles})
          </button>
          ${deliveryData.sections.map(sec => `
            <button id="del-tab-${sec.id}" class="del-tab-btn" onclick="DeliveryCenterModule.setSectionFilter('${sec.id}')">
              ${sec.name} (${sec.items.length})
            </button>
          `).join('')}
        </div>

        <!-- Grade de Conteúdo das Seções Selecionadas -->
        <div id="del-sections-viewport" style="flex: 1; overflow-y: auto; padding: 20px 24px;">
          <!-- Injetado dinamicamente -->
        </div>

        <!-- Rodapé com Resumo de Seleção e Botão Finalizar Entrega -->
        <div style="padding: 14px 24px; border-top: 1px solid var(--border-color, #333); background: rgba(0,0,0,0.3); display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 16px; font-size: 0.85rem;">
            <div>
              <span style="color: #888;">Selecionados para o pacote:</span>
              <strong id="del-summary-selected-count" style="color: #eee; margin-left: 4px;">
                ${deliveryData.summary.selectedFiles} de ${deliveryData.summary.totalFiles} arquivos
              </strong>
            </div>
            <div style="color: #555;">&bull;</div>
            <div>
              <span style="color: #888;">Tamanho Estimado:</span>
              <strong id="del-summary-selected-size" style="color: var(--accent-color, #e0a96d); margin-left: 4px;">
                ${deliveryData.summary.formattedTotalSize}
              </strong>
            </div>
          </div>

          <div style="display: flex; gap: 12px; align-items: center;">
            <button class="studio-btn studio-btn-secondary" onclick="DeliveryCenterModule.closeModal()">
              Cancelar
            </button>
            <button id="del-btn-finalize-main" class="studio-btn studio-btn-primary" onclick="DeliveryCenterModule.openFinalizeConfirmationModal()" style="font-weight: bold; padding: 10px 24px; font-size: 0.95rem;">
              <i class="fas fa-file-archive"></i> FINALIZAR ENTREGA
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    renderSectionsContent();
  }

  function renderSectionsContent() {
    const container = document.getElementById('del-sections-viewport');
    if (!container || !deliveryData) return;

    let secs = deliveryData.sections;
    if (activeSectionFilter !== 'ALL') {
      secs = secs.filter(s => s.id === activeSectionFilter);
    }

    container.innerHTML = secs.map(sec => `
      <div class="del-section-card" style="margin-bottom: 24px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; overflow: hidden;">
        <!-- Cabeçalho da Seção com Ações de Marcar/Desmarcar -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 18px; background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.05);">
          <div>
            <strong style="font-size: 0.95rem; color: #eee; letter-spacing: 0.04em;">${sec.name}</strong>
            <span style="font-size: 0.8rem; color: #888; margin-left: 8px;">&mdash; ${sec.description}</span>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="studio-btn-tiny" onclick="DeliveryCenterModule.toggleAllInSection('${sec.id}', true)">Marcar Todos</button>
            <button class="studio-btn-tiny" onclick="DeliveryCenterModule.toggleAllInSection('${sec.id}', false)">Desmarcar</button>
          </div>
        </div>

        <!-- Grade dos Itens com os 6 Atributos (Preview, Nome, Versão, Status, Tamanho, Incluir/Excluir) -->
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; padding: 16px;">
          ${sec.items.map(item => {
            const isSelected = itemSelectionState[item.id] !== false;
            return `
              <div class="del-item-card ${isSelected ? 'selected' : 'excluded'}" style="display: flex; flex-direction: column; background: rgba(0,0,0,0.25); border: 1px solid ${isSelected ? 'rgba(224, 169, 109, 0.4)' : 'rgba(255,255,255,0.06)'}; border-radius: 6px; overflow: hidden; transition: all 0.15s ease;">
                <!-- 1. PREVIEW -->
                <div style="height: 120px; background: #181818; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                  <img src="${item.preview}" alt="${item.nome}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300'">
                  <!-- 6. INCLUIR/EXCLUIR CHECKBOX -->
                  <label style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.7); padding: 4px 8px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                    <input type="checkbox" onchange="DeliveryCenterModule.toggleItemSelection('${item.id}', this.checked)" ${isSelected ? 'checked' : ''} style="cursor: pointer;">
                    <span style="font-size: 0.72rem; color: #fff;">Incluir</span>
                  </label>
                  <span style="position: absolute; bottom: 8px; left: 8px; background: rgba(0,0,0,0.75); color: #ccc; font-size: 0.7rem; padding: 2px 6px; border-radius: 3px;">
                    <!-- 5. TAMANHO -->
                    ${item.tamanho}
                  </span>
                </div>

                <!-- Detalhes: Nome, Versão, Status -->
                <div style="padding: 10px 12px; display: flex; flex-direction: column; gap: 4px;">
                  <!-- 2. NOME CANÔNICO -->
                  <div style="font-size: 0.8rem; font-weight: bold; color: #eee; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${item.nome}">
                    ${item.nome}
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem;">
                    <!-- 3. VERSÃO -->
                    <span style="color: var(--accent-color, #e0a96d); font-weight: bold;">
                      ${item.versao}
                    </span>
                    <!-- 4. STATUS -->
                    <span style="color: #888;">
                      ${item.status}
                    </span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `).join('');
  }

  // 7 & 8. MODAL DE RESUMO PRÉVIO E CONFIRMAÇÃO EXPLÍCITA
  function openFinalizeConfirmationModal() {
    if (!deliveryData) return;

    // Coleta arquivos selecionados
    const selected = [];
    deliveryData.sections.forEach(sec => {
      sec.items.forEach(item => {
        if (itemSelectionState[item.id]) selected.push(item);
      });
    });

    if (selected.length === 0) {
      alert('Selecione pelo menos um arquivo para compor o pacote de entrega.');
      return;
    }

    const qa = deliveryData.qaReport;
    const hasWarnings = qa.counts.WARNING > 0;

    const modal = document.createElement('div');
    modal.id = 'del-confirm-modal';
    modal.className = 'studio-modal-backdrop active';
    modal.innerHTML = `
      <div class="studio-modal-card" style="max-width: 580px; width: 90vw; padding: 24px;">
        <h3 style="margin: 0 0 12px 0; display: flex; align-items: center; gap: 10px; color: #eee; font-size: 1.25rem;">
          <i class="fas fa-shield-alt" style="color: var(--accent-color, #e0a96d);"></i>
          Confirmação de Finalização da Entrega
        </h3>

        <!-- Resumo Exigido pelo Requisito 7 -->
        <div style="background: rgba(224, 169, 109, 0.1); border: 1px solid rgba(224, 169, 109, 0.3); border-radius: 6px; padding: 14px 18px; margin-bottom: 18px; font-size: 0.95rem; color: #eee; line-height: 1.4;">
          Você está prestes a finalizar a entrega <strong>${activeRevision}</strong> para o projeto <strong>${deliveryData.header.projectName}</strong>.
          <div style="margin-top: 8px; font-size: 0.82rem; color: #ccc;">
            Serão compilados <strong>${selected.length} arquivos</strong> com snapshot imutável de estado.
          </div>
        </div>

        ${hasWarnings ? `
          <div style="background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.3); border-radius: 6px; padding: 12px 16px; margin-bottom: 18px; font-size: 0.82rem; color: #facc15;">
            <i class="fas fa-exclamation-triangle"></i>
            Existem <strong>${qa.counts.WARNING} avisos (WARNING)</strong> assinalados pelo controle de qualidade QA F11.
            <label style="display: flex; align-items: center; gap: 8px; margin-top: 8px; cursor: pointer; color: #fff;">
              <input type="checkbox" id="del-confirm-warnings-check" style="cursor: pointer;">
              <span>Estou ciente e autorizo formalmente a entrega com os avisos técnicos.</span>
            </label>
          </div>
        ` : ''}

        <div style="margin-bottom: 20px;">
          <label style="display: block; font-size: 0.8rem; color: #aaa; margin-bottom: 6px;">Responsável Técnico pela Homologação:</label>
          <input type="text" id="del-responsible-user" value="Eduardo Marques" style="width: 100%; background: #222; border: 1px solid #444; color: #fff; padding: 8px 12px; border-radius: 4px; font-size: 0.9rem;">
        </div>

        <div style="font-size: 0.75rem; color: #777; margin-bottom: 20px; line-height: 1.4;">
          <i class="fas fa-lock"></i> <strong>Política de Não-Destruição:</strong> Esta finalização gera um snapshot imutável e preserva integralmente todas as entregas e versões anteriores no histórico.
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button class="studio-btn studio-btn-secondary" onclick="document.getElementById('del-confirm-modal').remove()">
            Voltar
          </button>
          <button class="studio-btn studio-btn-primary" onclick="DeliveryCenterModule.executeFinalization()" style="font-weight: bold; padding: 10px 22px;">
            <i class="fas fa-check"></i> Confirmar &amp; Gerar Pacote
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  function executeFinalization() {
    const userEl = document.getElementById('del-responsible-user');
    const user = userEl ? userEl.value.trim() : 'Arquiteto Responsável';

    const warnCheck = document.getElementById('del-confirm-warnings-check');
    const confirmWarnings = warnCheck ? warnCheck.checked : true;

    // Coleta itens excluídos
    const excluded = [];
    deliveryData.sections.forEach(sec => {
      sec.items.forEach(item => {
        if (!itemSelectionState[item.id]) excluded.push(item.id);
      });
    });

    try {
      const result = StudioState.finalizeProjectDeliveryPackage(currentProjectId, {
        revision: activeRevision,
        confirmed: true,
        confirmWarnings,
        user,
        excludedItemIds: excluded
      });

      const confirmModal = document.getElementById('del-confirm-modal');
      if (confirmModal) confirmModal.remove();

      alert(`✅ Entrega ${result.packageName} finalizada com sucesso!\n\n${result.selectedFilesCount} arquivos empacotados com snapshot de auditoria registrado.`);
      closeModal();

      if (window.App && typeof App.renderActiveTab === 'function') {
        App.renderActiveTab();
      }
    } catch (err) {
      alert(`Falha ao finalizar entrega: ${err.message}`);
    }
  }

  function closeModal() {
    const m = document.getElementById('delivery-center-modal');
    if (m) m.remove();
  }

  return {
    init,
    open,
    setSectionFilter,
    toggleItemSelection,
    toggleAllInSection,
    openFinalizeConfirmationModal,
    executeFinalization,
    closeModal
  };
})();

if (typeof window !== 'undefined') {
  window.DeliveryCenterModule = DeliveryCenterModule;
}
