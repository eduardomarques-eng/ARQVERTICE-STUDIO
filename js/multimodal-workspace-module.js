/**
 * ArqVértice Studio — Bloco J: J14 — Multimodal Workspace UX
 * 
 * Interactive Workspace Controller & UI Component
 * Layout: Context/Project topbar | Tools & Contextual AI Actions | Main Multi-Canvas | Timeline & Review Dock
 * Features: Contextual action trays, Preview-First state machine, Version History, Visual Feedback
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.MultimodalWorkspaceModule = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const MODALITIES = Object.freeze({
        IMAGE: 'IMAGE',
        THREED: '3D',
        CAD: 'CAD',
        BIM: 'BIM'
    });

    const PREVIEW_STAGES = Object.freeze({
        IDLE: 'IDLE',
        PROPOSED: 'PROPOSED',
        PREVIEW: 'PREVIEW',
        COMPARED: 'COMPARED',
        APPLIED: 'APPLIED'
    });

    class MultimodalWorkspaceModule {
        constructor(options = {}) {
            this.version = '1.0.0-bloco-j14';
            this.activeModality = options.modality || MODALITIES.IMAGE;
            this.currentSelection = options.selection || {
                type: 'image',
                id: 'render_living_01',
                name: 'Render Living Social — Golden Hour',
                metadata: 'PNG 3840x2160 • Cam 35mm • Cycles'
            };

            this.previewStage = PREVIEW_STAGES.IDLE;
            this.activeProposal = null;

            this.versionHistory = [
                { id: 'v0', label: 'Original', timestamp: 'Initial Ingestion', active: true }
            ];

            this.visualFeedback = {
                identified: 'Sofá Modular e Área de Estar',
                plannedChange: 'Nenhuma alteração pendente',
                toolModel: 'Pronto para instrução',
                validationStatus: 'Aguardando ação'
            };
        }

        /**
         * Change active canvas modality
         */
        setModality(modality) {
            if (MODALITIES[modality]) {
                this.activeModality = MODALITIES[modality];
            }
        }

        /**
         * Update current selection and refresh contextual actions
         */
        selectElement(element) {
            this.currentSelection = element;
            if (element.type === 'image') this.activeModality = MODALITIES.IMAGE;
            if (element.type === '3d_object') this.activeModality = MODALITIES.THREED;
            if (element.type === 'cad_object') this.activeModality = MODALITIES.CAD;
            if (element.type === 'bim_element') this.activeModality = MODALITIES.BIM;
        }

        /**
         * Get contextual actions for current selection
         */
        getContextualActions() {
            const selType = this.currentSelection ? this.currentSelection.type : 'general';
            switch (selType) {
                case 'image':
                    return [
                        { id: 'act_sam_seg', label: 'Segmentar Objeto', model: 'SAM3', risk: 'REVERSIBLE' },
                        { id: 'act_mat_swap', label: 'Substituir Material', model: 'Qwen-Image', risk: 'REVERSIBLE' },
                        { id: 'act_trellis_gen', label: 'Gerar Modelo 3D (GLB)', model: 'TRELLIS.2', risk: 'REVERSIBLE' },
                        { id: 'act_img_remove', label: 'Remover Objeto (Inpaint)', model: 'SAM3', risk: 'REVERSIBLE' }
                    ];
                case '3d_object':
                    return [
                        { id: 'act_geom_inspect', label: 'Inspecionar Malha e Normais', model: 'Heuristic', risk: 'READ_ONLY' },
                        { id: 'act_decimate', label: 'Decimar Malha (5 Perfis)', model: 'Fast-Quadric', risk: 'REVERSIBLE' },
                        { id: 'act_blender_edit', label: 'Enviar p/ Edição no Blender', model: 'Blender-MCP', risk: 'REVERSIBLE' },
                        { id: 'act_glb_export', label: 'Exportar Ativo GLB', model: 'Converter', risk: 'READ_ONLY' }
                    ];
                case 'cad_object':
                    return [
                        { id: 'act_cad_dim', label: 'Alterar Dimensão Paramétrica', model: 'FreeCAD-MCP', risk: 'REVERSIBLE' },
                        { id: 'act_cad_recompute', label: 'Recomputar Sólido e Features', model: 'CADAgent', risk: 'REVERSIBLE' },
                        { id: 'act_cad_constraint', label: 'Validar Graus de Liberdade', model: 'Sketcher', risk: 'READ_ONLY' },
                        { id: 'act_step_export', label: 'Exportar Modelo STEP', model: 'Exporter', risk: 'READ_ONLY' }
                    ];
                case 'bim_element':
                    return [
                        { id: 'act_bim_qty', label: 'Consultar Quantitativo NBR', model: 'ThatOpen-Engine', risk: 'READ_ONLY' },
                        { id: 'act_ifc_props', label: 'Verificar Propriedades IFC', model: 'web-ifc', risk: 'READ_ONLY' },
                        { id: 'act_bim_clash', label: 'Auditar Interferência Geométrica', model: 'ThatOpen-Engine', risk: 'READ_ONLY' }
                    ];
                default:
                    return [
                        { id: 'act_gen_reason', label: 'Análise Geral do Projeto', model: 'Astra-Reasoning', risk: 'READ_ONLY' }
                    ];
            }
        }

        /**
         * Preview-First Flow: PROPOSE
         */
        proposeChange(actionSummary, targetTool, targetModel) {
            this.previewStage = PREVIEW_STAGES.PROPOSED;
            this.activeProposal = {
                actionSummary,
                targetTool,
                targetModel,
                timestamp: new Date().toISOString()
            };
            this.visualFeedback = {
                identified: this.currentSelection.name || 'Elemento Selecionado',
                plannedChange: actionSummary,
                toolModel: `${targetTool} via ${targetModel}`,
                validationStatus: 'Proposta gerada — aguardando pré-visualização'
            };
            return this.activeProposal;
        }

        /**
         * Preview-First Flow: PREVIEW
         */
        generatePreview(previewData) {
            this.previewStage = PREVIEW_STAGES.PREVIEW;
            this.visualFeedback.validationStatus = 'Pré-visualização disponível para conferência';
            return {
                previewStage: this.previewStage,
                previewData
            };
        }

        /**
         * Preview-First Flow: APPLY (Commit to Version History)
         */
        applyProposal() {
            if (this.previewStage !== PREVIEW_STAGES.PREVIEW && this.previewStage !== PREVIEW_STAGES.PROPOSED) {
                throw new Error('[Workspace] Cannot apply proposal without preview/proposal state');
            }

            const newVersionNumber = this.versionHistory.length;
            const newVersion = {
                id: `v${newVersionNumber}`,
                label: `v${newVersionNumber}.0 (${this.activeProposal ? this.activeProposal.targetModel : 'Editado'})`,
                timestamp: new Date().toLocaleTimeString(),
                active: true
            };

            this.versionHistory.forEach(v => v.active = false);
            this.versionHistory.push(newVersion);

            this.previewStage = PREVIEW_STAGES.APPLIED;
            this.visualFeedback.validationStatus = `Alteração consolidada com sucesso (${newVersion.label})`;
            this.activeProposal = null;

            return newVersion;
        }

        /**
         * Discard proposal
         */
        discardProposal() {
            this.previewStage = PREVIEW_STAGES.IDLE;
            this.activeProposal = null;
            this.visualFeedback.plannedChange = 'Alteração descartada pelo usuário';
            this.visualFeedback.validationStatus = 'Pronto para nova instrução';
        }

        /**
         * Switch version
         */
        switchVersion(versionId) {
            const v = this.versionHistory.find(item => item.id === versionId);
            if (v) {
                this.versionHistory.forEach(item => item.active = (item.id === versionId));
                this.visualFeedback.validationStatus = `Visualizando versão ${v.label}`;
            }
        }

        /**
         * Render Workspace HTML Component
         */
        render(project = {}) {
            const projectName = project.title || project.name || 'Residência Terras de São José';
            const actions = this.getContextualActions();

            return `
            <div class="multimodal-workspace animate-fade-in" id="multimodal-workspace-root">
                <!-- 1. Context & Modality Switcher Header -->
                <header class="mm-workspace-header">
                    <div class="mm-project-badge">
                        <i data-lucide="layers"></i>
                        <span>${projectName}</span>
                        <span class="badge-tag">Intelligent Design Engine</span>
                    </div>

                    <nav class="mm-modality-tabs" aria-label="Modality Selector">
                        <button class="mm-tab-btn ${this.activeModality === MODALITIES.IMAGE ? 'active' : ''}" 
                                onclick="MultimodalWorkspaceModule.instance.setModality('IMAGE')">
                            <i data-lucide="image"></i> Image
                        </button>
                        <button class="mm-tab-btn ${this.activeModality === MODALITIES.THREED ? 'active' : ''}" 
                                onclick="MultimodalWorkspaceModule.instance.setModality('3D')">
                            <i data-lucide="box"></i> 3D Mesh
                        </button>
                        <button class="mm-tab-btn ${this.activeModality === MODALITIES.CAD ? 'active' : ''}" 
                                onclick="MultimodalWorkspaceModule.instance.setModality('CAD')">
                            <i data-lucide="cpu"></i> Parametric CAD
                        </button>
                        <button class="mm-tab-btn ${this.activeModality === MODALITIES.BIM ? 'active' : ''}" 
                                onclick="MultimodalWorkspaceModule.instance.setModality('BIM')">
                            <i data-lucide="building-2"></i> IFC / BIM
                        </button>
                    </nav>
                </header>

                <!-- 2. Middle Body: Contextual Actions + Main Canvas -->
                <div class="mm-workspace-body">
                    <!-- Left Contextual Tools Panel -->
                    <aside class="mm-tools-panel">
                        <div class="mm-panel-title">
                            <span>Elemento Selecionado</span>
                            <i data-lucide="crosshair"></i>
                        </div>
                        <div class="mm-selection-card">
                            <div class="mm-selection-title">${this.currentSelection.name}</div>
                            <div class="mm-selection-meta">${this.currentSelection.metadata}</div>
                        </div>

                        <div class="mm-panel-title" style="margin-top: 10px;">
                            <span>Ações Multimodais Contextuais</span>
                            <i data-lucide="sparkles"></i>
                        </div>
                        <div class="mm-action-btn-group">
                            ${actions.map(act => `
                                <button class="mm-action-btn" data-action-id="${act.id}">
                                    <span>${act.label}</span>
                                    <span class="model-tag">${act.model}</span>
                                </button>
                            `).join('')}
                        </div>
                    </aside>

                    <!-- Main Canvas Area -->
                    <main class="mm-main-canvas">
                        ${this.previewStage === PREVIEW_STAGES.PREVIEW ? `
                            <div class="mm-preview-overlay">
                                <span class="mm-preview-badge">Pré-visualização</span>
                                <span>${this.activeProposal ? this.activeProposal.actionSummary : 'Alteração Proposta'}</span>
                                <div class="mm-preview-actions">
                                    <button class="mm-btn-apply" onclick="MultimodalWorkspaceModule.instance.applyProposal()">Aplicar</button>
                                    <button class="mm-btn-discard" onclick="MultimodalWorkspaceModule.instance.discardProposal()">Descartar</button>
                                </div>
                            </div>
                        ` : ''}

                        <div class="mm-canvas-viewport">
                            <div class="mm-canvas-preview-container">
                                <img src="assets/renders/living_concept.png" alt="Canvas Viewport Render" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'600\\' height=\\'350\\' viewBox=\\'0 0 600 350\\'><rect fill=\\'%23161b22\\' width=\\'600\\' height=\\'350\\'/><text fill=\\'%2358a6ff\\' font-size=\\'18\\' x=\\'50%\\' y=\\'50%\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\'>Canvas Ativo: Modo ${this.activeModality}</text></svg>'"/>
                            </div>
                        </div>
                    </main>
                </div>

                <!-- 3. Bottom Dock: Feedback Tray + Command + Version Timeline -->
                <footer class="mm-bottom-dock">
                    <div class="mm-feedback-tray">
                        <div class="mm-feedback-item">
                            <span class="mm-feedback-label">Identificado:</span>
                            <span class="mm-feedback-value">${this.visualFeedback.identified}</span>
                        </div>
                        <div class="mm-feedback-item">
                            <span class="mm-feedback-label">Modificação:</span>
                            <span class="mm-feedback-value">${this.visualFeedback.plannedChange}</span>
                        </div>
                        <div class="mm-feedback-item">
                            <span class="mm-feedback-label">Ferramenta:</span>
                            <span class="mm-feedback-value">${this.visualFeedback.toolModel}</span>
                        </div>
                        <div class="mm-feedback-item">
                            <span class="mm-feedback-label">Validação:</span>
                            <span class="mm-feedback-value" style="color: #7ee787;">${this.visualFeedback.validationStatus}</span>
                        </div>
                    </div>

                    <div class="mm-dock-controls">
                        <div class="mm-command-input-wrapper">
                            <input type="text" class="mm-command-input" placeholder="Instrua o Design Engine (ex: 'Gerar ativo 3D a partir desta referência' ou 'Aumentar largura para 120cm')..."/>
                            <button class="mm-command-send">
                                <i data-lucide="send"></i>
                                <span>Executar</span>
                            </button>
                        </div>

                        <div class="mm-version-timeline">
                            <span class="mm-timeline-label">Histórico:</span>
                            ${this.versionHistory.map(v => `
                                <button class="mm-version-chip ${v.active ? 'active' : ''}" 
                                        onclick="MultimodalWorkspaceModule.instance.switchVersion('${v.id}')">
                                    ${v.label}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </footer>
            </div>
            `;
        }
    }

    MultimodalWorkspaceModule.MODALITIES = MODALITIES;
    MultimodalWorkspaceModule.PREVIEW_STAGES = PREVIEW_STAGES;
    MultimodalWorkspaceModule.instance = new MultimodalWorkspaceModule();

    return MultimodalWorkspaceModule;
}));
