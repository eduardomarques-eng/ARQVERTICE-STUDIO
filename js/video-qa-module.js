/**
 * ============================================================================
 * ARQVERTICE STUDIO — BLOCO G14: VIDEO QA ENGINE MODULE
 * ============================================================================
 * Controle de Qualidade Audiovisual do Projeto de Vídeo.
 *
 * 13 CHECKPOINTS CANÔNICOS:
 * 1. Continuidade | 2. Ambiente | 3. Geometria | 4. Materiais | 5. Mobiliário
 * 6. Iluminação   | 7. Câmera   | 8. Duração   | 9. Resolução | 10. Proporção
 * 11. Cortes      | 12. Transições | 13. Identidade Visual
 *
 * STATUS:
 * - PASS (Verificado e conforme)
 * - WARNING (Aviso técnico não-bloqueante)
 * - ERROR (Inconsistência severa de especificação)
 * - BLOCKED (Falha crítica que impede a exportação)
 *
 * SALVAGUARDA DE IA (INVIOLABILIDADE):
 * - IA analisa cenas e timeline, MAS NUNCA altera automaticamente o projeto.
 * - Inconsistências mostram: PROBLEMA, CENA, EVIDÊNCIA, RECOMENDAÇÃO.
 * - NUNCA corrigir silenciosamente.
 * - Permite 3 ações guiadas:
 *   1. Corrigir manualmente
 *   2. Regenerar asset
 *   3. Substituir cena
 *
 * GERAÇÃO DE RELATÓRIO:
 * - Visualização estruturada, cópia em markdown e exportação documental.
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

  const VideoQAModule = {
    activeVideoId: null,
    activeQAId: null,
    activeFilter: 'ALL', // 'ALL' | 'BLOCKED' | 'ERROR' | 'WARNING' | 'RESOLVED'

    _getState() {
      if (typeof StudioState !== 'undefined') return StudioState;
      if (typeof window !== 'undefined' && window.StudioState) return window.StudioState;
      if (typeof require !== 'undefined') {
        try { return require('./state.js'); } catch (e) {}
      }
      return null;
    },

    /**
     * Renderiza a interface completa do Video QA
     */
    render(videoProjectId) {
      const state = this._getState();
      if (!state) return '<div class="alert alert-danger">StudioState não inicializado.</div>';

      const video = state.getVideoProject(videoProjectId);
      if (!video) {
        return `
          <div class="video-qa-container p-5 text-center" style="background:#0f172a; color:#f8fafc; border-radius:12px;">
            <h3>Nenhum projeto de vídeo selecionado</h3>
            <p class="text-muted">Selecione uma produção na aba Vídeo para auditar a qualidade audiovisual.</p>
          </div>
        `;
      }

      this.activeVideoId = video.id;

      // Obtém ou executa primeira análise de QA
      let qa = state.getLatestVideoQAResult ? state.getLatestVideoQAResult(video.id) : null;
      if (!qa) {
        qa = state.runVideoQA(video.id, { user: 'Auditor Automático' });
      }
      this.activeQAId = qa.id;

      const project = state.getProject(video.projectId) || { id: video.projectId, name: 'Projeto' };

      return `
        <div class="video-qa-container animate-fade-in" id="video-qa-root" style="background:#0b1120; color:#f8fafc; border-radius:12px; padding:24px; font-family:'Montserrat', sans-serif;">
          ${this._renderHeader(video, project, qa)}
          ${this._renderExecutiveMetrics(qa, video)}
          ${this._renderFilterBar(qa)}
          ${this._renderFindingsSection(qa)}
          ${this._renderCheckpointsTable(qa)}
          ${this._renderGuardBanner()}
          <div id="video-qa-modal-root"></div>
        </div>
      `;
    },

    // ---- Sub-Renderers ----

    _renderHeader(video, project, qa) {
      return `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; padding-bottom:18px; border-bottom:1px solid #1e293b; flex-wrap:wrap; gap:16px;">
          <div>
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
              <span style="background:rgba(168,85,247,0.2); color:#c084fc; padding:4px 10px; border-radius:6px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em;">
                Bloco G14 • Controle de Qualidade
              </span>
              <span style="color:#94a3b8; font-size:12px;">Vídeo: ${escapeHTML(video.id)}</span>
            </div>
            <h2 style="margin:0 0 6px 0; font-size:22px; font-weight:700; color:#ffffff; display:flex; align-items:center; gap:8px;">
              <i data-lucide="shield-check" style="color:#a855f7; width:22px; height:22px;"></i>
              QA Audiovisual — ${escapeHTML(video.title)}
            </h2>
            <p style="margin:0; font-size:13px; color:#94a3b8;">
              Auditoria em 13 checkpoints arquiteturais e cinematográficos com salvaguarda estrita contra alterações não autorizadas.
            </p>
          </div>

          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button onclick="VideoQAModule.openReportModal('${escapeHTML(qa.id)}')" style="display:inline-flex; align-items:center; gap:6px; background:#1e293b; color:#f8fafc; border:1px solid #334155; padding:8px 16px; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer;" title="Abrir Dossiê de QA">
              <i data-lucide="file-text" style="width:14px; height:14px;"></i> Dossiê de QA
            </button>
            <button onclick="VideoQAModule.runAnalysis('${escapeHTML(video.id)}')" style="display:inline-flex; align-items:center; gap:6px; background:#6366f1; color:#ffffff; border:none; padding:8px 16px; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer;" title="Reexecutar verificação com IA">
              <i data-lucide="refresh-cw" style="width:14px; height:14px;"></i> Reanalisar com IA
            </button>
          </div>
        </div>
      `;
    },

    _renderExecutiveMetrics(qa, video) {
      const counts = qa.counts || { pass: 0, warning: 0, error: 0, blocked: 0, total: 13 };
      const statusBadge = this._getStatusBadge(qa.overallStatus, true);
      const confPercent = (Number(qa.confidenceScore || 0.92) * 100).toFixed(0);

      const exportColor = qa.isExportAllowed ? '#10b981' : '#ef4444';
      const exportIcon = qa.isExportAllowed ? 'check-circle' : 'lock';
      const exportText = qa.isExportAllowed ? 'Exportação Liberada' : 'Exportação Bloqueada (Pendências BLOCKED)';

      return `
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:16px; margin-bottom:24px;">
          <!-- Status Geral -->
          <div style="background:#0f172a; border:1px solid #1e293b; border-radius:10px; padding:18px;">
            <div style="font-size:11px; color:#94a3b8; text-transform:uppercase; font-weight:600; margin-bottom:8px;">Status Geral do Vídeo</div>
            <div style="display:flex; align-items:center; gap:10px;">
              ${statusBadge}
            </div>
            <div style="font-size:11px; color:#64748b; margin-top:8px;">
              Auditado em: ${new Date(qa.evaluatedAt).toLocaleTimeString('pt-BR')}
            </div>
          </div>

          <!-- Permissão de Exportação -->
          <div style="background:#0f172a; border:1px solid #1e293b; border-radius:10px; padding:18px;">
            <div style="font-size:11px; color:#94a3b8; text-transform:uppercase; font-weight:600; margin-bottom:8px;">Pipeline de Render (G13)</div>
            <div style="display:flex; align-items:center; gap:8px; color:${exportColor}; font-weight:700; font-size:14px;">
              <i data-lucide="${exportIcon}" style="width:16px; height:16px;"></i>
              <span>${exportText}</span>
            </div>
            <div style="font-size:11px; color:#64748b; margin-top:8px;">
              ${qa.isExportAllowed ? 'Timeline apta para compilação MP4' : 'Resolva as pendências para destravar render'}
            </div>
          </div>

          <!-- Índice de Confiança de IA -->
          <div style="background:#0f172a; border:1px solid #1e293b; border-radius:10px; padding:18px;">
            <div style="font-size:11px; color:#94a3b8; text-transform:uppercase; font-weight:600; margin-bottom:8px;">Acurácia Estimada (IA)</div>
            <div style="font-size:20px; font-weight:700; color:#38bdf8;">
              ${confPercent}% <span style="font-size:11px; font-weight:400; color:#94a3b8;">(Score Realista)</span>
            </div>
            <div style="width:100%; height:4px; background:#1e293b; border-radius:2px; margin-top:8px; overflow:hidden;">
              <div style="width:${confPercent}%; height:100%; background:#38bdf8;"></div>
            </div>
          </div>

          <!-- Resumo de Contadores -->
          <div style="background:#0f172a; border:1px solid #1e293b; border-radius:10px; padding:18px;">
            <div style="font-size:11px; color:#94a3b8; text-transform:uppercase; font-weight:600; margin-bottom:8px;">Distribuição de Apontamentos</div>
            <div style="display:flex; gap:8px; flex-wrap:wrap; font-size:11px; font-weight:700;">
              <span style="background:rgba(16,185,129,0.15); color:#10b981; padding:3px 8px; border-radius:4px;">${counts.pass} PASS</span>
              <span style="background:rgba(245,158,11,0.15); color:#f59e0b; padding:3px 8px; border-radius:4px;">${counts.warning} WARN</span>
              <span style="background:rgba(239,68,68,0.15); color:#ef4444; padding:3px 8px; border-radius:4px;">${counts.error} ERR</span>
              <span style="background:rgba(153,27,27,0.3); color:#fca5a5; padding:3px 8px; border-radius:4px; border:1px solid #991b1b;">${counts.blocked} BLOCK</span>
            </div>
            <div style="font-size:11px; color:#64748b; margin-top:8px;">
              Total: 13 checkpoints verificados
            </div>
          </div>
        </div>
      `;
    },

    _renderFilterBar(qa) {
      const counts = qa.counts || {};
      const f = this.activeFilter;

      const filters = [
        { id: 'ALL', label: `Todos (${qa.findings.length})` },
        { id: 'BLOCKED', label: `Bloqueantes (${counts.blocked || 0})`, color: '#fca5a5' },
        { id: 'ERROR', label: `Erros (${counts.error || 0})`, color: '#ef4444' },
        { id: 'WARNING', label: `Avisos (${counts.warning || 0})`, color: '#f59e0b' },
        { id: 'RESOLVED', label: `Resolvidos (${qa.findings.filter(x => x.isResolved).length})`, color: '#10b981' }
      ];

      return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            ${filters.map(item => `
              <button onclick="VideoQAModule.setFilter('${item.id}')" style="background:${f === item.id ? '#334155' : '#0f172a'}; color:${item.color || '#f8fafc'}; border:1px solid ${f === item.id ? '#6366f1' : '#1e293b'}; padding:6px 12px; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer;">
                ${item.label}
              </button>
            `).join('')}
          </div>

          <div style="font-size:12px; color:#94a3b8;">
            Ações Permitidas: <strong style="color:#f8fafc;">Corrigir Manualmente • Regenerar Asset • Substituir Cena</strong>
          </div>
        </div>
      `;
    },

    _renderFindingsSection(qa) {
      let list = qa.findings || [];

      if (this.activeFilter === 'BLOCKED') list = list.filter(f => f.status === 'BLOCKED');
      else if (this.activeFilter === 'ERROR') list = list.filter(f => f.status === 'ERROR');
      else if (this.activeFilter === 'WARNING') list = list.filter(f => f.status === 'WARNING');
      else if (this.activeFilter === 'RESOLVED') list = list.filter(f => f.isResolved);

      if (list.length === 0) {
        return `
          <div style="background:#0f172a; border:1px solid #1e293b; border-radius:10px; padding:32px; text-align:center; margin-bottom:24px;">
            <i data-lucide="check-circle-2" style="color:#10b981; width:36px; height:36px; margin:0 auto 10px auto; display:block;"></i>
            <h4 style="margin:0 0 4px 0; color:#ffffff; font-size:16px;">Nenhum apontamento nesta categoria</h4>
            <p style="margin:0; font-size:12px; color:#94a3b8;">O vídeo atende a todas as diretrizes para este filtro.</p>
          </div>
        `;
      }

      return `
        <div style="display:flex; flex-direction:column; gap:16px; margin-bottom:28px;">
          ${list.map(finding => this._renderFindingCard(finding, qa)).join('')}
        </div>
      `;
    },

    _renderFindingCard(finding, qa) {
      const isResolved = finding.isResolved;
      const statusBadge = this._getStatusBadge(finding.status, false);

      return `
        <div class="video-qa-finding-card" id="card-${finding.id}" style="background:#0f172a; border:1px solid ${isResolved ? '#1e293b' : (finding.status === 'BLOCKED' ? '#991b1b' : (finding.status === 'ERROR' ? '#b91c1c' : '#b45309'))}; border-radius:10px; padding:20px; position:relative; opacity:${isResolved ? 0.8 : 1.0};">
          <!-- CABEÇALHO DO APONTAMENTO -->
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px; flex-wrap:wrap; gap:10px;">
            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
              ${statusBadge}
              <span style="background:#1e293b; color:#cbd5e1; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:600;">
                #${finding.checkpointNumber} ${escapeHTML(finding.checkpointName)}
              </span>
              <span style="color:#94a3b8; font-size:12px; font-weight:600;">
                Cena: <span style="color:#f8fafc;">${finding.sceneNumber ? `Cena 0${finding.sceneNumber}` : 'Geral'} (${escapeHTML(finding.sceneTitle)})</span>
              </span>
            </div>

            ${isResolved ? `
              <span style="background:rgba(16,185,129,0.15); color:#10b981; border:1px solid #10b981; padding:3px 10px; border-radius:6px; font-size:11px; font-weight:700; display:flex; align-items:center; gap:4px;">
                <i data-lucide="check" style="width:12px; height:12px;"></i> RESOLVIDO (${finding.resolution?.typeLabel || 'Ação Humana'})
              </span>
            ` : `
              <span style="color:#94a3b8; font-size:11px;">Pendente de Resolução</span>
            `}
          </div>

          <!-- BLOCO CANÔNICO: PROBLEMA, CENA, EVIDÊNCIA, RECOMENDAÇÃO -->
          <div style="display:grid; grid-template-columns:1fr; gap:12px; background:#0b1120; border-radius:8px; padding:16px; margin-bottom:16px; border:1px solid #1e293b;">
            <div>
              <span style="color:#ef4444; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; display:block; margin-bottom:2px;">
                PROBLEMA:
              </span>
              <strong style="color:#ffffff; font-size:14px; line-height:1.4;">
                ${escapeHTML(finding.problem)}
              </strong>
            </div>

            <div>
              <span style="color:#38bdf8; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; display:block; margin-bottom:2px;">
                CENA:
              </span>
              <span style="color:#cbd5e1; font-size:13px;">
                ${finding.sceneNumber ? `Cena 0${finding.sceneNumber} — ` : ''}${escapeHTML(finding.sceneTitle)}
              </span>
            </div>

            <div>
              <span style="color:#f59e0b; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; display:block; margin-bottom:2px;">
                EVIDÊNCIA:
              </span>
              <p style="margin:0; color:#94a3b8; font-size:12px; line-height:1.5;">
                ${escapeHTML(finding.evidence)}
              </p>
            </div>

            <div>
              <span style="color:#10b981; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; display:block; margin-bottom:2px;">
                RECOMENDAÇÃO:
              </span>
              <p style="margin:0; color:#cbd5e1; font-size:12px; line-height:1.5;">
                ${escapeHTML(finding.recommendation)}
              </p>
            </div>
          </div>

          <!-- AÇÕES PERMITIDAS PELO ARQUITETO (NÃO CORRIGIR SILENCIOSAMENTE) -->
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-top:1px solid #1e293b; pt:12px; padding-top:14px;">
            <div style="font-size:11px; color:#64748b;">
              ${isResolved ? `Resolvido por <strong>${escapeHTML(finding.resolvedBy)}</strong>: ${escapeHTML(finding.resolution?.notes || '')}` : 'Escolha uma intervenção humana abaixo:'}
            </div>

            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button onclick="VideoQAModule.openManualFixModal('${escapeHTML(qa.id)}', '${escapeHTML(finding.id)}')" style="display:inline-flex; align-items:center; gap:6px; background:#1e293b; color:#f8fafc; border:1px solid #334155; padding:6px 12px; border-radius:6px; font-size:11px; font-weight:600; cursor:pointer;" title="Corrigir manualmente parâmetros da cena">
                <i data-lucide="wrench" style="width:12px; height:12px;"></i> Corrigir Manualmente
              </button>

              <button onclick="VideoQAModule.openRegenerateAssetModal('${escapeHTML(qa.id)}', '${escapeHTML(finding.id)}')" style="display:inline-flex; align-items:center; gap:6px; background:rgba(99,102,241,0.15); color:#818cf8; border:1px solid rgba(99,102,241,0.3); padding:6px 12px; border-radius:6px; font-size:11px; font-weight:600; cursor:pointer;" title="Regenerar clipe/render via IA">
                <i data-lucide="rotate-ccw" style="width:12px; height:12px;"></i> Regenerar Asset
              </button>

              <button onclick="VideoQAModule.openReplaceSceneModal('${escapeHTML(qa.id)}', '${escapeHTML(finding.id)}')" style="display:inline-flex; align-items:center; gap:6px; background:rgba(16,185,129,0.15); color:#34d399; border:1px solid rgba(16,185,129,0.3); padding:6px 12px; border-radius:6px; font-size:11px; font-weight:600; cursor:pointer;" title="Substituir por render homologado">
                <i data-lucide="replace" style="width:12px; height:12px;"></i> Substituir Cena
              </button>
            </div>
          </div>
        </div>
      `;
    },

    _renderCheckpointsTable(qa) {
      const checks = qa.checks || [];

      return `
        <div style="background:#0f172a; border:1px solid #1e293b; border-radius:10px; padding:20px; margin-bottom:24px;">
          <h3 style="margin:0 0 14px 0; font-size:15px; font-weight:700; color:#ffffff; display:flex; align-items:center; gap:8px;">
            <i data-lucide="list-checks" style="color:#38bdf8; width:18px; height:18px;"></i>
            Painel dos 13 Checkpoints Canônicos
          </h3>
          <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; font-size:12px; text-align:left;">
              <thead>
                <tr style="border-bottom:1px solid #1e293b; color:#94a3b8; font-size:11px; text-transform:uppercase;">
                  <th style="padding:8px;">#</th>
                  <th style="padding:8px;">Critério</th>
                  <th style="padding:8px;">Categoria</th>
                  <th style="padding:8px;">Status</th>
                  <th style="padding:8px;">Avaliação</th>
                </tr>
              </thead>
              <tbody>
                ${checks.map(c => `
                  <tr style="border-bottom:1px solid #131d31;">
                    <td style="padding:10px 8px; color:#64748b; font-weight:700;">${String(c.number).padStart(2, '0')}</td>
                    <td style="padding:10px 8px; color:#f8fafc; font-weight:600;">${escapeHTML(c.name)}</td>
                    <td style="padding:10px 8px; color:#94a3b8; text-transform:capitalize;">${escapeHTML(c.category)}</td>
                    <td style="padding:10px 8px;">${this._getStatusBadge(c.status, false)}</td>
                    <td style="padding:10px 8px; color:#cbd5e1;">${escapeHTML(c.summary)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    _renderGuardBanner() {
      return `
        <div style="background:rgba(99,102,241,0.08); border:1px dashed #6366f1; border-radius:10px; padding:16px; display:flex; align-items:center; gap:14px;">
          <i data-lucide="shield-alert" style="color:#818cf8; width:28px; height:28px; flex-shrink:0;"></i>
          <div style="font-size:12px; color:#cbd5e1; line-height:1.5;">
            <strong style="color:#ffffff;">Salvaguarda de Integridade do Projeto:</strong>
            A IA analisa cenas, modelos, materiais e ritmo audiovisual, mas <strong>NÃO tem autorização para alterar automaticamente o projeto ou aplicar correções silenciosas</strong>. Toda decisão de substituição, ajuste manual ou regeneração é confirmada e assinada pelo arquiteto.
          </div>
        </div>
      `;
    },

    // ---- Modais de Ação Guiada ----

    openManualFixModal(qaId, findingId) {
      const state = this._getState();
      const qa = state.getVideoQAResult(qaId);
      const finding = (qa.findings || []).find(f => f.id === findingId);
      if (!finding) return;

      const modalRoot = document.getElementById('video-qa-modal-root') || document.body;
      modalRoot.innerHTML = `
        <div class="studio-modal-backdrop active" id="modal-qa-action" style="position:fixed; inset:0; background:rgba(0,0,0,0.75); display:flex; align-items:center; justify-content:center; z-index:9999; padding:20px;">
          <div style="background:#0f172a; border:1px solid #334155; border-radius:12px; max-width:620px; width:100%; color:#f8fafc; font-family:'Montserrat',sans-serif; overflow:hidden; box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);">
            <div style="padding:18px 24px; border-bottom:1px solid #1e293b; display:flex; justify-content:space-between; align-items:center;">
              <h3 style="margin:0; font-size:16px; font-weight:700; display:flex; align-items:center; gap:8px;">
                <i data-lucide="wrench" style="color:#f59e0b; width:18px; height:18px;"></i>
                Corrigir Manualmente — ${escapeHTML(finding.checkpointName)}
              </h3>
              <button onclick="VideoQAModule.closeModal()" style="background:transparent; border:none; color:#94a3b8; cursor:pointer;">
                <i data-lucide="x" style="width:18px; height:18px;"></i>
              </button>
            </div>
            <div style="padding:24px;">
              <div style="background:#0b1120; border-radius:8px; padding:12px; margin-bottom:16px; font-size:12px;">
                <strong style="color:#ef4444; display:block; margin-bottom:4px;">Inconsistência Apontada:</strong>
                ${escapeHTML(finding.problem)}
              </div>

              <div style="margin-bottom:16px;">
                <label style="display:block; font-size:12px; color:#cbd5e1; margin-bottom:6px; font-weight:600;">
                  Notas / Justificativa do Arquiteto (Obrigatório):
                </label>
                <textarea id="qa-action-notes" rows="3" style="width:100%; background:#1e293b; border:1px solid #334155; color:#ffffff; border-radius:6px; padding:10px; font-size:12px; box-sizing:border-box;" placeholder="Ex: Ajustei manualmente o enquadramento e confirmei especificações com o render homologado."></textarea>
              </div>

              <div style="margin-bottom:16px;">
                <label style="display:block; font-size:12px; color:#cbd5e1; margin-bottom:6px; font-weight:600;">
                  Responsável pela Aprovação:
                </label>
                <input id="qa-action-user" type="text" value="Arquiteto Responsável" style="width:100%; background:#1e293b; border:1px solid #334155; color:#ffffff; border-radius:6px; padding:8px 10px; font-size:12px; box-sizing:border-box;">
              </div>
            </div>
            <div style="padding:16px 24px; border-top:1px solid #1e293b; background:#0b1120; display:flex; justify-content:flex-end; gap:10px;">
              <button onclick="VideoQAModule.closeModal()" style="background:transparent; border:1px solid #334155; color:#cbd5e1; padding:8px 16px; border-radius:6px; font-size:12px; cursor:pointer;">
                Cancelar
              </button>
              <button onclick="VideoQAModule.submitAction('${escapeHTML(qaId)}', '${escapeHTML(findingId)}', 'manual_fix')" style="background:#f59e0b; color:#0f172a; border:none; padding:8px 18px; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer;">
                Confirmar Correção Manual
              </button>
            </div>
          </div>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    },

    openRegenerateAssetModal(qaId, findingId) {
      const state = this._getState();
      const qa = state.getVideoQAResult(qaId);
      const finding = (qa.findings || []).find(f => f.id === findingId);
      if (!finding) return;

      const modalRoot = document.getElementById('video-qa-modal-root') || document.body;
      modalRoot.innerHTML = `
        <div class="studio-modal-backdrop active" id="modal-qa-action" style="position:fixed; inset:0; background:rgba(0,0,0,0.75); display:flex; align-items:center; justify-content:center; z-index:9999; padding:20px;">
          <div style="background:#0f172a; border:1px solid #334155; border-radius:12px; max-width:620px; width:100%; color:#f8fafc; font-family:'Montserrat',sans-serif; overflow:hidden; box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);">
            <div style="padding:18px 24px; border-bottom:1px solid #1e293b; display:flex; justify-content:space-between; align-items:center;">
              <h3 style="margin:0; font-size:16px; font-weight:700; display:flex; align-items:center; gap:8px;">
                <i data-lucide="rotate-ccw" style="color:#818cf8; width:18px; height:18px;"></i>
                Regenerar Asset — ${escapeHTML(finding.sceneTitle)}
              </h3>
              <button onclick="VideoQAModule.closeModal()" style="background:transparent; border:none; color:#94a3b8; cursor:pointer;">
                <i data-lucide="x" style="width:18px; height:18px;"></i>
              </button>
            </div>
            <div style="padding:24px;">
              <div style="background:#0b1120; border-radius:8px; padding:12px; margin-bottom:16px; font-size:12px;">
                <strong style="color:#f59e0b; display:block; margin-bottom:4px;">Recomendação do QA:</strong>
                ${escapeHTML(finding.recommendation)}
              </div>

              <div style="margin-bottom:16px;">
                <label style="display:block; font-size:12px; color:#cbd5e1; margin-bottom:6px; font-weight:600;">
                  Ajustes no Prompt / Descritor para Regeneração:
                </label>
                <textarea id="qa-prompt-adjustments" rows="3" style="width:100%; background:#1e293b; border:1px solid #334155; color:#ffffff; border-radius:6px; padding:10px; font-size:12px; box-sizing:border-box;" placeholder="Reforçar descritores exatos dos materiais canônicos e layout aprovado..."></textarea>
              </div>

              <div style="margin-bottom:16px;">
                <label style="display:block; font-size:12px; color:#cbd5e1; margin-bottom:6px; font-weight:600;">
                  Justificativa da Solicitação:
                </label>
                <input id="qa-action-notes" type="text" value="Regeneração solicitada devido a divergência com o caderno de referências." style="width:100%; background:#1e293b; border:1px solid #334155; color:#ffffff; border-radius:6px; padding:8px 10px; font-size:12px; box-sizing:border-box;">
              </div>
            </div>
            <div style="padding:16px 24px; border-top:1px solid #1e293b; background:#0b1120; display:flex; justify-content:flex-end; gap:10px;">
              <button onclick="VideoQAModule.closeModal()" style="background:transparent; border:1px solid #334155; color:#cbd5e1; padding:8px 16px; border-radius:6px; font-size:12px; cursor:pointer;">
                Cancelar
              </button>
              <button onclick="VideoQAModule.submitAction('${escapeHTML(qaId)}', '${escapeHTML(findingId)}', 'regenerate_asset')" style="background:#6366f1; color:#ffffff; border:none; padding:8px 18px; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer;">
                Agendar Regeneração de Asset
              </button>
            </div>
          </div>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    },

    openReplaceSceneModal(qaId, findingId) {
      const state = this._getState();
      const qa = state.getVideoQAResult(qaId);
      const finding = (qa.findings || []).find(f => f.id === findingId);
      if (!finding) return;

      const modalRoot = document.getElementById('video-qa-modal-root') || document.body;
      modalRoot.innerHTML = `
        <div class="studio-modal-backdrop active" id="modal-qa-action" style="position:fixed; inset:0; background:rgba(0,0,0,0.75); display:flex; align-items:center; justify-content:center; z-index:9999; padding:20px;">
          <div style="background:#0f172a; border:1px solid #334155; border-radius:12px; max-width:680px; width:100%; color:#f8fafc; font-family:'Montserrat',sans-serif; overflow:hidden; box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);">
            <div style="padding:18px 24px; border-bottom:1px solid #1e293b; display:flex; justify-content:space-between; align-items:center;">
              <h3 style="margin:0; font-size:16px; font-weight:700; display:flex; align-items:center; gap:8px;">
                <i data-lucide="replace" style="color:#10b981; width:18px; height:18px;"></i>
                Substituir Cena — ${escapeHTML(finding.sceneTitle)}
              </h3>
              <button onclick="VideoQAModule.closeModal()" style="background:transparent; border:none; color:#94a3b8; cursor:pointer;">
                <i data-lucide="x" style="width:18px; height:18px;"></i>
              </button>
            </div>
            <div style="padding:24px;">
              <div style="background:#0b1120; border-radius:8px; padding:12px; margin-bottom:16px; font-size:12px;">
                <strong style="color:#38bdf8; display:block; margin-bottom:4px;">Selecione um Render Homologado Alternativo:</strong>
                Substitua a cena divergente por um render aprovado do ambiente para sanar a inconsistência.
              </div>

              <div style="margin-bottom:16px;">
                <label style="display:block; font-size:12px; color:#cbd5e1; margin-bottom:6px; font-weight:600;">
                  Asset / Render Homologado:
                </label>
                <select id="qa-replace-asset" style="width:100%; background:#1e293b; border:1px solid #334155; color:#ffffff; border-radius:6px; padding:10px; font-size:12px;">
                  <option value="rnd-homologado-sala-01">Render Aprovado RND-01 — Sala de Estar (Mobiliário Homologado)</option>
                  <option value="rnd-homologado-sala-02">Render Aprovado RND-02 — Vista Frontal da Sala</option>
                  <option value="rnd-homologado-sala-detalhe">Render Aprovado RND-03 — Detalhe Marcenaria & Sofá Curvo</option>
                </select>
              </div>

              <div style="margin-bottom:16px;">
                <label style="display:block; font-size:12px; color:#cbd5e1; margin-bottom:6px; font-weight:600;">
                  Motivo da Substituição:
                </label>
                <input id="qa-action-notes" type="text" value="Substituição da cena pelo render homologado para garantir conformidade do mobiliário." style="width:100%; background:#1e293b; border:1px solid #334155; color:#ffffff; border-radius:6px; padding:8px 10px; font-size:12px; box-sizing:border-box;">
              </div>
            </div>
            <div style="padding:16px 24px; border-top:1px solid #1e293b; background:#0b1120; display:flex; justify-content:flex-end; gap:10px;">
              <button onclick="VideoQAModule.closeModal()" style="background:transparent; border:1px solid #334155; color:#cbd5e1; padding:8px 16px; border-radius:6px; font-size:12px; cursor:pointer;">
                Cancelar
              </button>
              <button onclick="VideoQAModule.submitAction('${escapeHTML(qaId)}', '${escapeHTML(findingId)}', 'replace_scene')" style="background:#10b981; color:#0f172a; border:none; padding:8px 18px; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer;">
                Confirmar Substituição de Cena
              </button>
            </div>
          </div>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    },

    submitAction(qaId, findingId, actionType) {
      const state = this._getState();
      const notesEl = document.getElementById('qa-action-notes');
      const userEl = document.getElementById('qa-action-user');
      const promptEl = document.getElementById('qa-prompt-adjustments');
      const assetEl = document.getElementById('qa-replace-asset');

      const notes = notesEl ? notesEl.value : `Ação ${actionType} executada pelo arquiteto.`;
      const user = userEl ? userEl.value : 'Arquiteto Responsável';
      const promptAdjustments = promptEl ? promptEl.value : null;
      const newAssetId = assetEl ? assetEl.value : null;

      try {
        state.resolveVideoQAFinding(qaId, findingId, {
          actionType,
          notes,
          promptAdjustments,
          newAssetId
        }, user);

        this.closeModal();
        this.refreshUI();
      } catch (err) {
        alert(`Erro ao resolver inconsistência: ${err.message}`);
      }
    },

    openReportModal(qaId) {
      const state = this._getState();
      const report = state.generateVideoQAReport(qaId);

      const modalRoot = document.getElementById('video-qa-modal-root') || document.body;
      modalRoot.innerHTML = `
        <div class="studio-modal-backdrop active" id="modal-qa-report" style="position:fixed; inset:0; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:9999; padding:20px;">
          <div style="background:#0f172a; border:1px solid #334155; border-radius:12px; max-width:800px; width:100%; max-height:85vh; color:#f8fafc; font-family:'Montserrat',sans-serif; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 25px 30px -5px rgba(0,0,0,0.6);">
            <div style="padding:18px 24px; border-bottom:1px solid #1e293b; display:flex; justify-content:space-between; align-items:center; background:#0b1120;">
              <div>
                <span style="font-size:11px; color:#818cf8; text-transform:uppercase; font-weight:700;">Dossiê Formal de Entrega</span>
                <h3 style="margin:2px 0 0 0; font-size:16px; font-weight:700;">Relatório de Controle de Qualidade Audiovisual</h3>
              </div>
              <button onclick="VideoQAModule.closeModal()" style="background:transparent; border:none; color:#94a3b8; cursor:pointer;">
                <i data-lucide="x" style="width:18px; height:18px;"></i>
              </button>
            </div>
            <div style="padding:24px; overflow-y:auto; flex:1;">
              <pre style="background:#0b1120; border:1px solid #1e293b; border-radius:8px; padding:18px; color:#e2e8f0; font-family:'Courier New', monospace; font-size:12px; line-height:1.6; white-space:pre-wrap; margin:0;">${escapeHTML(report.markdown)}</pre>
            </div>
            <div style="padding:16px 24px; border-top:1px solid #1e293b; background:#0b1120; display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:12px; color:#94a3b8;">Status: <strong style="color:#ffffff;">${report.overallStatus}</strong></span>
              <div style="display:flex; gap:10px;">
                <button onclick="VideoQAModule.copyReportText()" style="background:#1e293b; color:#cbd5e1; border:1px solid #334155; padding:8px 16px; border-radius:6px; font-size:12px; cursor:pointer;">
                  Copiar Texto
                </button>
                <button onclick="VideoQAModule.closeModal()" style="background:#6366f1; color:#ffffff; border:none; padding:8px 18px; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer;">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    },

    copyReportText() {
      const state = this._getState();
      if (!this.activeQAId) return;
      const rep = state.generateVideoQAReport(this.activeQAId);
      if (navigator.clipboard) {
        navigator.clipboard.writeText(rep.markdown).then(() => {
          alert('Relatório copiado para a área de transferência!');
        });
      } else {
        alert('Texto selecionado.');
      }
    },

    closeModal() {
      const modal = document.getElementById('modal-qa-action') || document.getElementById('modal-qa-report');
      if (modal) modal.remove();
    },

    setFilter(filter) {
      this.activeFilter = filter;
      this.refreshUI();
    },

    runAnalysis(videoId) {
      const state = this._getState();
      try {
        const res = state.runVideoQA(videoId, { user: 'Arquiteto Responsável' });
        this.activeQAId = res.id;
        this.refreshUI();
      } catch (err) {
        alert(`Erro ao executar QA: ${err.message}`);
      }
    },

    refreshUI() {
      const root = document.getElementById('video-qa-root');
      if (root && this.activeVideoId) {
        root.outerHTML = this.render(this.activeVideoId);
        if (window.lucide) lucide.createIcons();
      }
    },

    // ---- Helper Visual Badges ----

    _getStatusBadge(status, large = false) {
      const st = String(status || 'PASS').toUpperCase();
      const pad = large ? '6px 14px' : '3px 8px';
      const font = large ? '13px' : '11px';

      switch (st) {
        case 'PASS':
          return `<span style="background:rgba(16,185,129,0.15); color:#10b981; border:1px solid #10b981; padding:${pad}; border-radius:6px; font-size:${font}; font-weight:700; display:inline-flex; align-items:center; gap:4px;">
            <i data-lucide="check-circle" style="width:13px; height:13px;"></i> PASS
          </span>`;
        case 'WARNING':
          return `<span style="background:rgba(245,158,11,0.15); color:#f59e0b; border:1px solid #f59e0b; padding:${pad}; border-radius:6px; font-size:${font}; font-weight:700; display:inline-flex; align-items:center; gap:4px;">
            <i data-lucide="alert-triangle" style="width:13px; height:13px;"></i> WARNING
          </span>`;
        case 'ERROR':
          return `<span style="background:rgba(239,68,68,0.15); color:#ef4444; border:1px solid #ef4444; padding:${pad}; border-radius:6px; font-size:${font}; font-weight:700; display:inline-flex; align-items:center; gap:4px;">
            <i data-lucide="alert-circle" style="width:13px; height:13px;"></i> ERROR
          </span>`;
        case 'BLOCKED':
          return `<span style="background:rgba(153,27,27,0.3); color:#fca5a5; border:1px solid #b91c1c; padding:${pad}; border-radius:6px; font-size:${font}; font-weight:700; display:inline-flex; align-items:center; gap:4px;">
            <i data-lucide="lock" style="width:13px; height:13px;"></i> BLOCKED
          </span>`;
        default:
          return `<span style="background:#1e293b; color:#cbd5e1; padding:${pad}; border-radius:6px; font-size:${font};">${st}</span>`;
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.VideoQAModule = VideoQAModule;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = VideoQAModule;
  }
})(typeof window !== 'undefined' ? window : global);
