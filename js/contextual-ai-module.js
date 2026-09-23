/**
 * ============================================================================
 * ARQVERTICE STUDIO — BLOCO I10: IA CONTEXTUAL & INTENT COMMAND ROUTER
 * Context Builder, Context Minimization, Propose-Preview-Validate-Apply,
 * Confirmation Policy, Segregação de Memórias e Context-Aware UI.
 * ============================================================================
 */

(function (global) {
  'use strict';

  /**
   * 1. TIPOS DE CONTEXTO E DOMÍNIOS CANÔNICOS
   */
  const ContextDomain = Object.freeze({
    ENVIRONMENT: 'ENVIRONMENT',
    BIM: 'BIM',
    MEDIA: 'MEDIA',
    DOCUMENT: 'DOCUMENT',
    PRESENTATION: 'PRESENTATION',
    VIDEO: 'VIDEO',
    GENERAL: 'GENERAL'
  });

  const SelectionType = Object.freeze({
    ENVIRONMENT: 'ENVIRONMENT',
    BIM: 'BIM',
    IMAGE: 'IMAGE',
    DOCUMENT: 'DOCUMENT',
    NONE: 'NONE'
  });

  /**
   * 2. CAMADAS DE MEMÓRIA SEGREGADAS (Memory Layers)
   */
  class MemoryLayersManager {
    constructor() {
      this.sessionMemory = {
        recentCommands: [],
        activeSelection: { type: SelectionType.NONE, id: null, metadata: {} },
        lastInteractionAt: new Date().toISOString()
      };
      this.taskMemory = new Map(); // taskId -> transient payload
      this.userPreferences = {
        preferredPolicy: 'BALANCED',
        autoPreviewProposals: true,
        highContrastFocus: true
      };
      this.systemKnowledge = {
        standards: ['NBR 6492', 'NBR 9050', 'Apple HIG v2.1.0'],
        supportedScales: ['1:20', '1:25', '1:50', '1:100', '1:200'],
        sheetFormats: ['A0', 'A1', 'A2', 'A3', 'A4']
      };
    }

    setSelection(type, id, metadata = {}) {
      this.sessionMemory.activeSelection = {
        type: type || SelectionType.NONE,
        id: id || null,
        metadata: metadata || {},
        updatedAt: new Date().toISOString()
      };
      this.sessionMemory.lastInteractionAt = new Date().toISOString();
    }

    getSelection() {
      return this.sessionMemory.activeSelection;
    }

    clearSelection() {
      this.setSelection(SelectionType.NONE, null, {});
    }

    recordCommand(cmd) {
      this.sessionMemory.recentCommands.unshift({
        command: cmd,
        timestamp: new Date().toISOString()
      });
      if (this.sessionMemory.recentCommands.length > 20) {
        this.sessionMemory.recentCommands.pop();
      }
    }

    storeTaskMemory(taskId, data) {
      this.taskMemory.set(taskId, {
        data,
        createdAt: Date.now()
      });
    }

    getTaskMemory(taskId) {
      const item = this.taskMemory.get(taskId);
      return item ? item.data : null;
    }

    clearTaskMemory(taskId) {
      this.taskMemory.delete(taskId);
    }
  }

  const MemoryLayers = new MemoryLayersManager();

  /**
   * 3. CONTEXT BUILDER COM MINIMIZAÇÃO (Context Minimization)
   * NUNCA trafega o projeto inteiro ou dados supérfluos.
   */
  const ContextBuilder = {
    build(taskIntent = {}, currentSelection = null) {
      const state = (global.StudioState && global.StudioState.data) ? global.StudioState.data : {};
      const sel = currentSelection || MemoryLayers.getSelection();

      // Identifica o projeto ativo
      const currentProject = (state.projects || []).find(p => p.id === state.selectedProjectId) || (state.projects && state.projects[0]) || null;
      const currentClient = currentProject ? (state.clients || []).find(c => c.id === currentProject.clientId) : null;

      // 1. PROJECT_CONTEXT (Mínimo estrito)
      const projectContext = currentProject ? {
        projectId: currentProject.id,
        code: currentProject.code,
        name: currentProject.name,
        typology: currentProject.typology,
        currentStage: currentProject.currentStage,
        status: currentProject.status,
        builtAreaM2: currentProject.builtAreaM2
      } : null;

      // 2. SCREEN_CONTEXT
      const screenContext = {
        activeView: state.currentView || 'dashboard',
        activeTab: state.activeProjectTab || 'ambientes',
        environmentTab: state.activeEnvironmentTab || 'dados'
      };

      // 3. SELECTION_CONTEXT
      let selectionContext = {
        type: sel.type,
        id: sel.id,
        details: null
      };

      if (sel.type === SelectionType.ENVIRONMENT && sel.id) {
        const env = (state.environments || []).find(e => e.id === sel.id);
        if (env) {
          selectionContext.details = {
            id: env.id,
            name: env.name,
            type: env.type,
            areaM2: env.areaM2,
            floorLevel: env.floorLevel,
            status: env.status,
            currentVersion: env.currentVersion,
            materialsCount: (env.materials || []).length,
            locks: env.locks || {}
          };
        }
      }

      // 4. MEMÓRIAS VINCULADAS AO PROJETO (Apenas ativas e sem dados inflados)
      const projectMemories = currentProject && global.StudioState && global.StudioState.getProjectMemories ?
        global.StudioState.getProjectMemories(currentProject.id, {
          environmentId: sel.type === SelectionType.ENVIRONMENT ? sel.id : undefined
        }).slice(0, 5).map(m => ({
          category: m.category,
          title: m.title,
          summary: m.description ? m.description.substring(0, 160) : ''
        })) : [];

      return {
        timestamp: new Date().toISOString(),
        domain: taskIntent.domain || ContextDomain.GENERAL,
        project: projectContext,
        clientName: currentClient ? currentClient.name : 'Cliente Padrão',
        screen: screenContext,
        selection: selectionContext,
        relevantMemories: projectMemories,
        constraints: {
          scaleStandard: 'NBR 6492',
          units: 'METRIC_METERS'
        }
      };
    }
  };

  /**
   * 4. PARSER E ROTEADOR DE COMANDOS EM LINGUAGEM NATURAL (CommandRouter)
   */
  const CommandRouter = {
    registeredCommands: [
      {
        patterns: [/analis(e|ar).*(sala|ambiente|quarto|cozinha|su[ií]te|espaço)/i, /diagn[oó]stico.*ambiente/i],
        intent: 'ANALYZE_ROOM',
        domain: ContextDomain.ENVIRONMENT,
        capability: 'VISION_ANALYSIS',
        description: 'Analisar geometria, materiais e coerência do ambiente selecionado',
        actionType: 'READ_ONLY',
        handler: (ctx) => CommandRouter._handleAnalyzeRoom(ctx)
      },
      {
        patterns: [/narrativa.*apresenta[çc][aã]o/i, /ger(e|ar).*narrativa/i, /apresenta[çc][aã]o.*cliente/i],
        intent: 'PRESENTATION_NARRATIVE',
        domain: ContextDomain.PRESENTATION,
        capability: 'PRESENTATION_SYNTHESIS',
        description: 'Gerar narrativa editorial e conceitual para a apresentação',
        actionType: 'PROPOSAL',
        handler: (ctx) => CommandRouter._handlePresentationNarrative(ctx)
      },
      {
        patterns: [/roteiro.*v[ií]deo/i, /prepar(e|ar).*roteiro/i, /v[ií]deo.*projeto/i],
        intent: 'VIDEO_SCRIPT',
        domain: ContextDomain.VIDEO,
        capability: 'VIDEO_PROMPT_GENERATION',
        description: 'Elaborar roteiro cinematográfico com beats e durações',
        actionType: 'PROPOSAL',
        handler: (ctx) => CommandRouter._handleVideoScript(ctx)
      },
      {
        patterns: [/verifi(que|car).*materiais/i, /especifica[çc][aã]o.*materiais/i, /compatibiliz(ar|e).*acabamento/i],
        intent: 'CHECK_MATERIALS',
        domain: ContextDomain.ENVIRONMENT,
        capability: 'STRUCTURED_DATA_EXTRACTION',
        description: 'Auditar especificações técnicas, paginações e compatibilidade de pisos/paredes',
        actionType: 'READ_ONLY',
        handler: (ctx) => CommandRouter._handleCheckMaterials(ctx)
      },
      {
        patterns: [/compar(e|ar).*op[çc][oõ]es/i, /comparativo.*estudos/i, /diferen[çc]a.*vers[oõ]es/i],
        intent: 'COMPARE_OPTIONS',
        domain: ContextDomain.ENVIRONMENT,
        capability: 'ARCHITECTURAL_DECISION',
        description: 'Comparar alternativas de layout e indicar prós e contras arquitetônicos',
        actionType: 'DECISION',
        handler: (ctx) => CommandRouter._handleCompareOptions(ctx)
      },
      {
        patterns: [/problemas?.*planta/i, /interfer[eê]ncia.*planta/i, /auditar.*layout/i, /erros?.*layout/i],
        intent: 'INSPECT_PLAN',
        domain: ContextDomain.BIM,
        capability: 'BIM_STRUCTURAL_ANALYSIS',
        description: 'Verificar circulações mínimas (0.80m), espessuras de parede e iluminação natural',
        actionType: 'READ_ONLY',
        handler: (ctx) => CommandRouter._handleInspectPlan(ctx)
      }
    ],

    parse(naturalQuery) {
      const q = String(naturalQuery || '').trim();
      if (!q) return null;

      for (let cmd of this.registeredCommands) {
        for (let pat of cmd.patterns) {
          if (pat.test(q)) {
            return {
              matched: true,
              query: q,
              intent: cmd.intent,
              domain: cmd.domain,
              capability: cmd.capability,
              description: cmd.description,
              actionType: cmd.actionType,
              handler: cmd.handler
            };
          }
        }
      }

      // Fallback semântico genérico
      return {
        matched: false,
        query: q,
        intent: 'GENERAL_ASSIST',
        domain: ContextDomain.GENERAL,
        capability: 'ARCHITECTURAL_TEXT_GENERATION',
        description: `Assistência geral para "${q}"`,
        actionType: 'READ_ONLY',
        handler: (ctx) => ({
          type: 'ASSISTANCE',
          summary: `Consulta contextual processada sobre "${q}". O estúdio analisou o projeto ${ctx.project ? ctx.project.name : 'ativo'} e mantém o foco no ambiente atual.`,
          proposal: null
        })
      };
    },

    // Handlers determinísticos com simulação de IA de alta fidelidade
    _handleAnalyzeRoom(ctx) {
      const env = ctx.selection && ctx.selection.details ? ctx.selection.details : { name: 'Ambiente Principal', areaM2: 24.5 };
      return {
        type: 'ANALYSIS_REPORT',
        title: `Diagnóstico Arquitetônico: ${env.name}`,
        metrics: {
          area: `${env.areaM2 || 25} m²`,
          peDireito: '3.00 m',
          circulacaoScore: '96/100 (Excelente)',
          iluminacaoNatural: 'Conforme NBR 15220 (Aberturas > 1/6 da área)'
        },
        findings: [
          'Eixos de circulação desimpedidos com folga mínima de 0.90m.',
          'Posicionamento de aberturas favorece ventilação cruzada nordeste.',
          'Materiais especificados possuem coeficiente de absorção acústica equilibrado.'
        ],
        proposal: null
      };
    },

    _handlePresentationNarrative(ctx) {
      const projName = ctx.project ? ctx.project.name : 'Residência ArqVértice';
      return {
        type: 'PROPOSAL',
        proposalId: `prop-narr-${Date.now()}`,
        requiresConfirmation: false,
        title: `Proposta de Narrativa: ${projName}`,
        summary: `A narrativa organiza o projeto em três atos sensoriais: 1. A Chegada e Conexão com o Terreno; 2. O Vazio Central e a Luz Zenital; 3. A Intimidade e Materialidade Natural.`,
        dataToApply: {
          conceptText: `O projeto ${projName} investiga o equilíbrio entre pureza formal e aconchego táctil. As superfícies minerais dialogam com a madeira natural, enquanto as grandes aberturas emolduram a paisagem.`
        }
      };
    },

    _handleVideoScript(ctx) {
      const projName = ctx.project ? ctx.project.name : 'Residência';
      return {
        type: 'PROPOSAL',
        proposalId: `prop-video-${Date.now()}`,
        requiresConfirmation: false,
        title: `Roteiro Audiovisual Cinemático: ${projName}`,
        summary: `Sequência de 5 tomadas com transição lenta (slow push-in), iluminação Golden Hour e lente 35mm cinematográfica.`,
        dataToApply: {
          shotsCount: 5,
          totalDurationSec: 30,
          motionProfile: 'SLOW_CINEMATIC_PUSH'
        }
      };
    },

    _handleCheckMaterials(ctx) {
      return {
        type: 'ANALYSIS_REPORT',
        title: 'Auditoria de Especificações de Materiais',
        findings: [
          'Piso: Porcelanato acetinado 120x120cm compatível com tráfego residencial intenso.',
          'Paredes: Tinta mineral lavável tom Off-White (baixo VOC).',
          'Marcenaria: Lâmina de Nogueira Natural com acabamento fosco e ferragens ocultas.'
        ],
        proposal: null
      };
    },

    _handleCompareOptions(ctx) {
      return {
        type: 'DECISION_REPORT',
        title: 'Comparativo de Estudos Arquitetônicos',
        recommendation: 'Opção B (Cozinha Integrada com Ilha)',
        justification: 'A Opção B amplia a sensação espacial em 22% e viabiliza iluminação direta sobre a bancada de trabalho.',
        proposal: null
      };
    },

    _handleInspectPlan(ctx) {
      return {
        type: 'ANALYSIS_REPORT',
        title: 'Inspeção de Planta Baixa Técnica',
        findings: [
          'Todas as portas atendem ao vão livre mínimo de 0.80m (NBR 9050).',
          'Alvenarias molhadas dimensionadas com 15cm para passagem de instalações hidráulicas.',
          'Nenhuma interferência estrutural detectada nos eixos principais.'
        ],
        proposal: null
      };
    }
  };

  /**
   * 5. WORKFLOW SEGURO: PROPOSE ➔ PREVIEW ➔ VALIDATE ➔ APPLY
   */
  const ProposalWorkflow = {
    activeProposal: null,

    propose(proposalData) {
      this.activeProposal = {
        id: proposalData.proposalId || `prop-${Date.now()}`,
        title: proposalData.title || 'Proposta de Alteração',
        summary: proposalData.summary || '',
        data: proposalData.dataToApply || {},
        requiresConfirmation: Boolean(proposalData.requiresConfirmation),
        createdAt: new Date().toISOString(),
        status: 'PROPOSED'
      };
      return this.activeProposal;
    },

    preview() {
      if (!this.activeProposal) return null;
      return {
        proposal: this.activeProposal,
        previewDiff: JSON.stringify(this.activeProposal.data, null, 2)
      };
    },

    validate() {
      if (!this.activeProposal) return { valid: false, reason: 'Nenhuma proposta ativa.' };
      if (!this.activeProposal.data || Object.keys(this.activeProposal.data).length === 0) {
        return { valid: false, reason: 'Dados da proposta vazios.' };
      }
      return { valid: true };
    },

    apply() {
      const validation = this.validate();
      if (!validation.valid) {
        throw new Error(`Falha na validação da proposta: ${validation.reason}`);
      }

      // Aplica dados de forma segura sem corrupção
      const prop = this.activeProposal;
      prop.status = 'APPLIED';
      prop.appliedAt = new Date().toISOString();

      if (global.StudioState && global.StudioState.addProjectMemory && global.StudioState.data.selectedProjectId) {
        global.StudioState.addProjectMemory(global.StudioState.data.selectedProjectId, {
          title: `[IA Aplicada] ${prop.title}`,
          description: prop.summary,
          category: 'APPROVED_OUTPUT',
          status: 'ACTIVE'
        });
      }

      const finished = { ...prop };
      this.activeProposal = null;
      return finished;
    },

    discard() {
      this.activeProposal = null;
    }
  };

  /**
   * 6. POLÍTICA DE CONFIRMAÇÃO (Confirmation Policy)
   */
  const ConfirmationPolicy = {
    isCriticalAction(intentName, payload = {}) {
      const criticalKeywords = ['delete', 'excluir', 'substituir', 'publicar', 'sobrescrever', 'remover'];
      const text = `${intentName} ${JSON.stringify(payload)}`.toLowerCase();
      return criticalKeywords.some(kw => text.includes(kw));
    },

    shouldConfirm(intentName, payload = {}) {
      if (this.isCriticalAction(intentName, payload)) return true;
      // Análises e relatórios de leitura são sempre automáticos
      if (['ANALYZE_ROOM', 'CHECK_MATERIALS', 'INSPECT_PLAN', 'COMPARE_OPTIONS'].includes(intentName)) {
        return false;
      }
      return false;
    }
  };

  /**
   * 7. COMPONENTE UI: BARRA DE AÇÕES CONTEXTUAIS & COMMAND PALETTE
   */
  const ContextualAIModule = {
    init() {
      console.log('Inicializando ArqVertice Contextual AI Module (I10)...');
      this.bindShortcuts();
      this.updateContextualBar();
    },

    bindShortcuts() {
      // Já vinculado ao StudioApp.initGlobalEvents
    },

    onScreenChange(view, projectId, tabKey) {
      this.updateContextualBar();
    },

    onSelectionChange(type, id, metadata = {}) {
      MemoryLayers.setSelection(type, id, metadata);
      this.updateContextualBar();
    },

    updateContextualBar() {
      const bar = document.getElementById('contextual-actions-bar');
      if (!bar) return;

      const sel = MemoryLayers.getSelection();
      const state = (global.StudioState && global.StudioState.data) ? global.StudioState.data : {};
      const currentProject = (state.projects || []).find(p => p.id === state.selectedProjectId);

      let chips = [];
      let badgeLabel = 'Contexto Geral';

      if (sel.type === SelectionType.ENVIRONMENT && sel.id) {
        const env = (state.environments || []).find(e => e.id === sel.id);
        const envName = env ? env.name : 'Ambiente';
        badgeLabel = `Ambiente: ${envName}`;
        chips = [
          { label: 'Analisar Sala', icon: 'scan-eye', cmd: 'analise esta sala' },
          { label: 'Verificar Materiais', icon: 'palette', cmd: 'verifique os materiais' },
          { label: 'Roteiro de Vídeo', icon: 'video', cmd: 'prepare o roteiro do vídeo' },
          { label: 'Narrativa de Apresentação', icon: 'presentation', cmd: 'gere uma narrativa para esta apresentação' }
        ];
      } else if (currentProject) {
        badgeLabel = `Projeto: ${currentProject.code || 'PRJ'}`;
        chips = [
          { label: 'Auditar Planta', icon: 'file-search', cmd: 'mostre problemas nesta planta' },
          { label: 'Comparar Estudos', icon: 'git-compare', cmd: 'compare estas duas opções' },
          { label: 'Narrativa Geral', icon: 'sparkles', cmd: 'gere uma narrativa para esta apresentação' },
          { label: 'Verificar Especificações', icon: 'check-circle-2', cmd: 'verifique os materiais' }
        ];
      } else {
        bar.classList.add('is-hidden');
        return;
      }

      bar.classList.remove('is-hidden');
      bar.innerHTML = `
        <span class="contextual-badge"><i data-lucide="sparkles"></i> ${escapeHTML(badgeLabel)}</span>
        ${chips.map(c => `
          <button class="contextual-chip-btn" onclick="ContextualAIModule.executeQuickCommand('${c.cmd}')" aria-label="${c.label}">
            <i data-lucide="${c.icon}"></i>
            <span>${c.label}</span>
          </button>
        `).join('')}
      `;

      if (global.lucide) global.lucide.createIcons();
    },

    executeQuickCommand(cmdText) {
      MemoryLayers.recordCommand(cmdText);
      const parsed = CommandRouter.parse(cmdText);
      if (!parsed) return;

      const contextPackage = ContextBuilder.build(parsed);
      const result = parsed.handler(contextPackage);

      this.displayCommandResult(parsed, result);
    },

    displayCommandResult(parsed, result) {
      if (result.type === 'PROPOSAL') {
        const prop = ProposalWorkflow.propose(result);
        const confirmMsg = `
PROPOSTA DA IA: ${prop.title}

${prop.summary}

Deseja aplicar esta proposta ao projeto agora?`;

        if (window.confirm(confirmMsg)) {
          ProposalWorkflow.apply();
          if (global.StudioApp && global.StudioApp.showToast) {
            global.StudioApp.showToast(`Proposta aplicada com sucesso: ${prop.title}`);
          }
        }
      } else {
        // Exibe modal de análise ou toast rico
        const content = result.findings ? result.findings.map(f => `• ${f}`).join('\n') : (result.summary || JSON.stringify(result));
        alert(`${result.title || 'Resultado da IA Contextual'}\n\n${content}`);
      }
    },

    openCommandPalette() {
      const modal = document.getElementById('command-palette-modal');
      const input = document.getElementById('cmd-palette-input');
      if (modal) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        if (input) {
          input.value = '';
          setTimeout(() => input.focus(), 50);
        }
        this.renderCommandSuggestions('');
      }
    },

    closeCommandPalette() {
      const modal = document.getElementById('command-palette-modal');
      if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
      }
    },

    toggleCommandPalette() {
      const modal = document.getElementById('command-palette-modal');
      if (modal && modal.classList.contains('active')) {
        this.closeCommandPalette();
      } else {
        this.openCommandPalette();
      }
    },

    handleOverlayClick(e) {
      if (e.target.id === 'command-palette-modal') {
        this.closeCommandPalette();
      }
    },

    handleInputKey(e) {
      if (e.key === 'Escape') {
        this.closeCommandPalette();
      } else if (e.key === 'Enter') {
        const val = e.target.value.trim();
        if (val) {
          this.closeCommandPalette();
          this.executeQuickCommand(val);
        }
      } else {
        setTimeout(() => {
          this.renderCommandSuggestions(e.target.value.trim());
        }, 10);
      }
    },

    renderCommandSuggestions(query) {
      const list = document.getElementById('cmd-palette-results');
      if (!list) return;

      const commands = [
        { title: 'analise esta sala', desc: 'Diagnóstico geométrico e visual do ambiente ativo' },
        { title: 'gere uma narrativa para esta apresentação', desc: 'Elaborar texto editorial e conceito' },
        { title: 'prepare o roteiro do vídeo', desc: 'Roteiro de 30 segundos com tomadas cinemáticas' },
        { title: 'verifique os materiais', desc: 'Auditar especificações técnicas e compatibilidade' },
        { title: 'compare estas duas opções', desc: 'Comparativo de estudos de layout preliminar' },
        { title: 'mostre problemas nesta planta', desc: 'Checar circulações mínimas e vãos NBR' }
      ];

      const filtered = query ? commands.filter(c => c.title.toLowerCase().includes(query.toLowerCase()) || c.desc.toLowerCase().includes(query.toLowerCase())) : commands;

      list.innerHTML = filtered.map(c => `
        <div class="command-palette-item" onclick="ContextualAIModule.selectPaletteCommand('${c.title}')" role="option">
          <div>
            <div style="font-weight: 600; font-size: 0.9rem;">${escapeHTML(c.title)}</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">${escapeHTML(c.desc)}</div>
          </div>
          <span class="command-palette-kbd">ENTER</span>
        </div>
      `).join('');
    },

    selectPaletteCommand(cmdText) {
      this.closeCommandPalette();
      this.executeQuickCommand(cmdText);
    }
  };

  // Exportação no escopo global
  global.ContextDomain = ContextDomain;
  global.SelectionType = SelectionType;
  global.MemoryLayers = MemoryLayers;
  global.ContextBuilder = ContextBuilder;
  global.CommandRouter = CommandRouter;
  global.ProposalWorkflow = ProposalWorkflow;
  global.ConfirmationPolicy = ConfirmationPolicy;
  global.ContextualAIModule = ContextualAIModule;

  // Auto-inicialização quando o DOM carregar
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => ContextualAIModule.init());
    } else {
      ContextualAIModule.init();
    }
  }

})(typeof window !== 'undefined' ? window : global);
