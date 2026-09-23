/**
 * ============================================================================
 * ARQVERTICE STUDIO — BLOCO F10: MOTOR DE GERAÇÃO DE ARQUIVOS FINAIS
 * 
 * Gerador profissional de entregáveis e arquivos finais:
 * - Formatos: PNG, JPG/JPEG, PDF (dimensões físicas reais mm -> pt)
 * - Nomenclatura oficial: ARQV_[PROJETO]_[AMBIENTE]_[TIPO]_[REV]
 * - Resoluções de imagem: Original, Otimizada, Thumbnail
 * - Escopos: Página, Prancha, Ambiente, Conjunto, Pacote Completo (ZIP)
 * - Estrutura de 7 pastas canônicas + manifesto com metadados
 * - Tolerância e resiliência a falhas parciais
 * ============================================================================
 */

const ExportEngineModule = (function () {
  'use strict';

  let currentFormat = 'PDF'; // 'PDF' | 'PNG' | 'JPG'
  let currentResolution = 'ORIGINAL'; // 'ORIGINAL' | 'OTIMIZADA' | 'THUMBNAIL'
  let currentScope = 'prancha'; // 'prancha' | 'pagina' | 'ambiente' | 'conjunto' | 'completo_zip'
  let currentProjectId = null;
  let currentSheetId = null;
  let currentEnvironmentId = null;
  let currentRevision = 'REV 01';
  let exportHistory = [];

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function init(projectId) {
    currentProjectId = projectId || (StudioState.data?.selectedProjectId || 'prj-praia-01');
    const sheets = StudioState.getProjectSheets(currentProjectId);
    if (sheets.length > 0) {
      currentSheetId = sheets[0].id;
    }
    const envs = StudioState.getProjectEnvironments ? StudioState.getProjectEnvironments(currentProjectId) : (StudioState.data?.environments || []);
    if (envs.length > 0) {
      currentEnvironmentId = envs[0].id;
    }
  }

  function setFormat(fmt) {
    currentFormat = fmt.toUpperCase();
    updatePreviewFilename();
  }

  function setResolution(res) {
    currentResolution = res.toUpperCase();
  }

  function setScope(scope) {
    currentScope = scope;
    updatePreviewFilename();
  }

  function setSheet(sheetId) {
    currentSheetId = sheetId;
    updatePreviewFilename();
  }

  function setEnvironment(envId) {
    currentEnvironmentId = envId;
    updatePreviewFilename();
  }

  function setRevision(rev) {
    currentRevision = rev;
    updatePreviewFilename();
  }

  function getCalculatedFilename() {
    const project = StudioState.getProject(currentProjectId);
    const env = (StudioState.data?.environments || []).find(e => e.id === currentEnvironmentId);
    const sheet = StudioState.getSheet(currentSheetId);

    let envName = 'GERAL';
    let typeName = 'ENTREGA';

    if (currentScope === 'prancha') {
      typeName = sheet ? sheet.sheetNumber : 'PRANCHA';
      envName = sheet?.environmentId || 'GERAL';
    } else if (currentScope === 'ambiente') {
      envName = env ? env.name : 'AMBIENTE';
      typeName = 'PACOTE';
    } else if (currentScope === 'completo_zip') {
      typeName = 'PACOTE_COMPLETO';
      envName = 'GERAL';
    }

    const ext = currentScope === 'completo_zip' ? 'zip' : currentFormat.toLowerCase();

    return StudioState.formatCanonicalFilename({
      project: project?.name || 'PROJETO',
      environment: envName,
      type: typeName,
      revision: currentRevision,
      extension: ext
    });
  }

  function updatePreviewFilename() {
    const el = document.getElementById('f10-preview-filename');
    if (el) {
      el.textContent = getCalculatedFilename();
    }
  }

  function executeExport() {
    const project = StudioState.getProject(currentProjectId);
    if (!project) {
      alert('Selecione um projeto válido.');
      return;
    }

    try {
      let result = null;

      if (currentScope === 'prancha') {
        if (!currentSheetId) throw new Error('Selecione uma prancha para exportar.');
        result = StudioState.exportSheetToFile(currentSheetId, currentFormat, {
          revision: currentRevision,
          resolution: currentResolution,
          user: 'Arquiteto Responsável'
        });
      } else if (currentScope === 'ambiente') {
        if (!currentEnvironmentId) throw new Error('Selecione um ambiente para exportar.');
        result = StudioState.exportEnvironmentPackage(currentProjectId, currentEnvironmentId, {
          revision: currentRevision,
          user: 'Arquiteto Responsável'
        });
      } else if (currentScope === 'completo_zip') {
        result = StudioState.exportProjectZipPackage(currentProjectId, {
          revision: currentRevision,
          user: 'Arquiteto Responsável'
        });
      }

      exportHistory.unshift({
        timestamp: new Date().toISOString(),
        filename: result.filename || result.packageName,
        format: currentFormat,
        scope: currentScope,
        status: result.status || 'SUCCESS',
        errors: result.errors || []
      });

      renderExportResultModal(result);
    } catch (err) {
      alert(`Erro na exportação: ${err.message}`);
    }
  }

  function renderExportResultModal(result) {
    const modalHTML = `
      <div class="modal-backdrop" id="f10-result-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 10000;">
        <div style="background: #fff; border-radius: 8px; width: 600px; max-width: 95vw; max-height: 90vh; overflow-y: auto; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="badge ${result.status === 'SUCCESS' ? 'badge-success' : 'badge-warning'}" style="padding: 4px 8px; border-radius: 4px; font-size: 11px;">
                ${result.status}
              </span>
              <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: #0f172a;">Exportação Concluída</h3>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="document.getElementById('f10-result-modal').remove()">&times;</button>
          </div>

          <div style="font-size: 13px; color: #334155; display: flex; flex-direction: column; gap: 12px;">
            <div>
              <span style="color: #64748b; display: block; font-size: 11px;">ARQUIVO GERADO:</span>
              <strong style="font-size: 14px; font-family: monospace; color: #1d4ed8; word-break: break-all;">
                ${escapeHTML(result.filename || result.packageName)}
              </strong>
            </div>

            ${result.dimensions ? `
              <div style="background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
                <div><strong>Formato Físico:</strong> ${escapeHTML(result.dimensions.name)}</div>
                <div><strong>Orientação:</strong> ${escapeHTML(result.dimensions.orientation)}</div>
                <div><strong>Dimensões:</strong> ${result.dimensions.widthMm} &times; ${result.dimensions.heightMm} mm</div>
                <div><strong>Pontos (PDF):</strong> ${result.dimensions.widthPt} &times; ${result.dimensions.heightPt} pt</div>
              </div>
            ` : ''}

            ${result.manifest ? `
              <div>
                <strong style="display: block; margin-bottom: 6px;">Estrutura do Pacote ZIP (7 Pastas):</strong>
                <div style="background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 11px; line-height: 1.6;">
                  ${Object.entries(result.manifest.structureSummary).map(([folder, count]) => `
                    <div>/${folder} &rarr; ${count} arquivo(s)</div>
                  `).join('')}
                  <div style="border-top: 1px solid #cbd5e1; margin-top: 6px; padding-top: 6px; font-weight: bold;">
                    Total: ${result.files.length} arquivos no pacote (inclui manifest.json)
                  </div>
                </div>
              </div>
            ` : ''}

            ${result.errors && result.errors.length > 0 ? `
              <div style="background: #fef2f2; border: 1px solid #f87171; border-radius: 6px; padding: 12px;">
                <strong style="color: #b91c1c; display: block; margin-bottom: 4px;">Avisos de Falha Parcial (Tolerância ativada):</strong>
                <ul style="margin: 0; padding-left: 20px; font-size: 11px; color: #991b1b;">
                  ${result.errors.map(err => `
                    <li><strong>${escapeHTML(err.file || err.sheetId)}:</strong> ${escapeHTML(err.reason)}</li>
                  `).join('')}
                </ul>
                <p style="margin: 6px 0 0 0; font-size: 11px; color: #7f1d1d;">Os demais arquivos válidos foram mantidos e preservados com sucesso.</p>
              </div>
            ` : ''}
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
            <button class="btn btn-primary" onclick="document.getElementById('f10-result-modal').remove()">Fechar</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  function openExportModal(projectId) {
    init(projectId);
    const project = StudioState.getProject(currentProjectId);
    const sheets = StudioState.getProjectSheets(currentProjectId);
    const envs = StudioState.getProjectEnvironments ? StudioState.getProjectEnvironments(currentProjectId) : (StudioState.data?.environments || []);

    const modalHTML = `
      <div class="modal-backdrop" id="f10-export-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 9999;">
        <div style="background: #fff; border-radius: 8px; width: 680px; max-width: 95vw; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); display: flex; flex-direction: column; gap: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
            <div>
              <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: #0f172a;">Exportador de Arquivos Finais (F10)</h3>
              <span style="font-size: 12px; color: #64748b;">${escapeHTML(project?.name || 'Projeto')}</span>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="document.getElementById('f10-export-modal').remove()">&times;</button>
          </div>

          <!-- Seletor de Escopo -->
          <div>
            <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 6px;">Escopo de Exportação:</label>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
              <button type="button" class="btn btn-outline btn-sm ${currentScope === 'prancha' ? 'active' : ''}" onclick="ExportEngineModule.setScope('prancha')">Prancha Individual</button>
              <button type="button" class="btn btn-outline btn-sm ${currentScope === 'ambiente' ? 'active' : ''}" onclick="ExportEngineModule.setScope('ambiente')">Pacote por Ambiente</button>
              <button type="button" class="btn btn-outline btn-sm ${currentScope === 'completo_zip' ? 'active' : ''}" onclick="ExportEngineModule.setScope('completo_zip')">Pacote Completo (ZIP)</button>
            </div>
          </div>

          <!-- Prancha / Ambiente Seletor -->
          ${currentScope === 'prancha' ? `
            <div>
              <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 4px;">Selecione a Prancha:</label>
              <select class="form-select" style="width: 100%; font-size: 12px;" onchange="ExportEngineModule.setSheet(this.value)">
                ${sheets.map(s => `<option value="${s.id}" ${s.id === currentSheetId ? 'selected' : ''}>${escapeHTML(s.sheetNumber)} — ${escapeHTML(s.name)} (${s.format} ${s.orientation})</option>`).join('')}
              </select>
            </div>
          ` : ''}

          ${currentScope === 'ambiente' ? `
            <div>
              <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 4px;">Selecione o Ambiente:</label>
              <select class="form-select" style="width: 100%; font-size: 12px;" onchange="ExportEngineModule.setEnvironment(this.value)">
                ${envs.map(e => `<option value="${e.id}" ${e.id === currentEnvironmentId ? 'selected' : ''}>${escapeHTML(e.name)}</option>`).join('')}
              </select>
            </div>
          ` : ''}

          <!-- Formato e Resolução -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div>
              <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 4px;">Formato de Saída:</label>
              <select class="form-select" style="width: 100%; font-size: 12px;" onchange="ExportEngineModule.setFormat(this.value)">
                <option value="PDF" ${currentFormat === 'PDF' ? 'selected' : ''}>PDF (Dimensões Físicas NBR)</option>
                <option value="PNG" ${currentFormat === 'PNG' ? 'selected' : ''}>PNG (Alta Fidelidade)</option>
                <option value="JPG" ${currentFormat === 'JPG' ? 'selected' : ''}>JPG (Otimizado)</option>
              </select>
            </div>

            <div>
              <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 4px;">Nível de Resolução:</label>
              <select class="form-select" style="width: 100%; font-size: 12px;" onchange="ExportEngineModule.setResolution(this.value)">
                <option value="ORIGINAL" ${currentResolution === 'ORIGINAL' ? 'selected' : ''}>Original (Nativa 4K)</option>
                <option value="OTIMIZADA" ${currentResolution === 'OTIMIZADA' ? 'selected' : ''}>Otimizada (Web / Print)</option>
                <option value="THUMBNAIL" ${currentResolution === 'THUMBNAIL' ? 'selected' : ''}>Thumbnail (Compacta)</option>
              </select>
            </div>
          </div>

          <!-- Prévia da Nomenclatura Padronizada Oficial -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px;">
            <span style="color: #64748b; font-size: 11px; display: block; margin-bottom: 4px;">NOMENCLATURA PADRÃO: ARQV_[PROJETO]_[AMBIENTE]_[TIPO]_[REV]</span>
            <div id="f10-preview-filename" style="font-family: monospace; font-size: 13px; font-weight: 700; color: #1d4ed8; word-break: break-all;">
              ${escapeHTML(getCalculatedFilename())}
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px;">
            <button class="btn btn-ghost" onclick="document.getElementById('f10-export-modal').remove()">Cancelar</button>
            <button class="btn btn-primary" onclick="ExportEngineModule.executeExport()">Gerar Arquivo Final</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  return {
    init,
    setFormat,
    setResolution,
    setScope,
    setSheet,
    setEnvironment,
    setRevision,
    getCalculatedFilename,
    openExportModal,
    executeExport
  };
})();

if (typeof window !== 'undefined') {
  window.ExportEngineModule = ExportEngineModule;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExportEngineModule;
}
