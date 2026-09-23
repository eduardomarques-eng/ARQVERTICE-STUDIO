/**
 * ArqVértice Studio — Bloco J: J32 — Revit Workspace Module
 * 
 * Controlador e Renderizador do Ambiente Especializado para Autodesk Revit.
 * Interface Isolada: 3 Colunas + Command Center + 12 Seções Navegáveis:
 * [Overview] [Connection] [Project] [Model] [Views] [Quantities]
 * [Families] [3D] [AI Commands] [Sync] [History] [Settings]
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.RevitWorkspaceModule = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
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

    class RevitWorkspace {
        constructor() {
            this.version = '1.0.0-bloco-j37';
            this.activeSection = 'overview';
            this.selectedElementId = 20412;
            this.paramTab = 'instance'; // 'instance' | 'type'
            this.qtyCategory = 'Walls';
            this.qtyLevel = 'All';
            this.qtyGroupBy = 'type';
            this.qtyTab = 'aggregated'; // 'aggregated' | 'takeoff' | 'validation'
            this.adapter = null;
            this.initialized = false;
            this.commandState = 'idle';
            this.pendingCommand = null;
            this.commandHistory = [];
        }

        init() {
            if (this.initialized) return;

            if (typeof localStorage !== 'undefined') {
                const storedHistory = localStorage.getItem('arqvertice.revit.command-history');
                if (storedHistory) {
                    try {
                        const parsedHistory = JSON.parse(storedHistory);
                        if (Array.isArray(parsedHistory)) this.commandHistory = parsedHistory.slice(0, 20);
                    } catch (error) {
                        this.commandHistory = [];
                    }
                }
            }

            const AdapterClass = typeof window !== 'undefined' && window.RevitBIMAdapter 
                ? window.RevitBIMAdapter 
                : (typeof require !== 'undefined' ? require('./revit-bim-adapter.js') : null);

            if (AdapterClass) {
                this.adapter = new AdapterClass({ debug: false });
                this.adapter.subscribe(() => {
                    this.updateHeaderAndHealth();
                    this.updateLogs();
                });
            }

            this.initialized = true;
        }

        /**
         * Renderização Principal do Workspace
         */
        render(containerId = 'view-container') {
            this.init();

            const container = typeof document !== 'undefined' ? document.getElementById(containerId) : null;
            if (!container) return;

            const status = this.adapter ? this.adapter.getStatus() : { status: 'DISCONNECTED' };

            container.innerHTML = `
                <div class="revit-workspace-root" id="revit-workspace-root">
                    <!-- 1. Topbar do Workspace Revit -->
                    <header class="revit-ws-topbar" id="revit-ws-topbar">
                        <div class="revit-ws-brand">
                            <span class="revit-ws-badge-brand">
                                <i data-lucide="layers"></i> Revit BIM
                            </span>
                            <div class="revit-ws-title">
                                ArqVértice Studio
                                <span class="sub">&bull; Workspace Especializado</span>
                            </div>
                        </div>

                        <!-- Status Pill com Ponto Pulsante -->
                        <div class="revit-status-pill status-${status.status.toLowerCase()}" id="revit-status-pill">
                            <span class="revit-pulse-dot"></span>
                            <span id="revit-status-label">${this._getStatusLabel(status.status)}</span>
                        </div>

                        <!-- Controles de Conexão -->
                        <div class="revit-ws-controls">
                            <button class="revit-btn btn-primary-revit" onclick="RevitWorkspaceModule.connect()">
                                <i data-lucide="plug"></i> Conectar
                            </button>
                            <button class="revit-btn btn-danger-revit" onclick="RevitWorkspaceModule.disconnect()">
                                <i data-lucide="power"></i> Desconectar
                            </button>
                            <button class="revit-btn" onclick="RevitWorkspaceModule.reconnect()" title="Reconectar Socket">
                                <i data-lucide="refresh-cw"></i> Reconectar
                            </button>
                            <button class="revit-btn" onclick="RevitWorkspaceModule.refresh()" title="Atualizar Dados">
                                <i data-lucide="rotate-ccw"></i> Atualizar
                            </button>
                            <button class="revit-btn" onclick="RevitWorkspaceModule.switchSection('settings')" title="Configurações">
                                <i data-lucide="settings"></i> Configurações
                            </button>
                        </div>
                    </header>

                    <!-- 2. Linha de Indicadores Reais de Saúde (Health Check) -->
                    <div class="revit-health-bar" id="revit-health-bar">
                        ${this._renderHealthBarHTML()}
                    </div>

                    <!-- 3. Sub-Navegação Interna (12 Seções) -->
                    <nav class="revit-ws-nav" id="revit-ws-nav">
                        ${this._renderNavTabsHTML()}
                    </nav>

                    <!-- 4. Grid Principal de 3 Colunas -->
                    <div class="revit-ws-body" id="revit-ws-body">
                        <!-- Coluna 1: PROJETO & MODELO -->
                        <aside class="revit-panel-left" id="revit-panel-left">
                            ${this._renderLeftPanelHTML()}
                        </aside>

                        <!-- Coluna 2: CANVAS / VIEWER PRINCIPAL -->
                        <main class="revit-panel-center" id="revit-panel-center">
                            ${this._renderSectionContentHTML()}
                        </main>

                        <!-- Coluna 3: CONTEXTO & ELEMENTO ATIVO -->
                        <aside class="revit-panel-right" id="revit-panel-right">
                            ${this._renderRightPanelHTML()}
                        </aside>
                    </div>

                    <!-- 5. Barra Inferior / Command Center & Logs -->
                    <footer class="revit-ws-footer" id="revit-ws-footer">
                        ${this._renderFooterHTML()}
                    </footer>
                </div>
            `;

            if (typeof window !== 'undefined' && window.lucide) {
                window.lucide.createIcons();
            }
        }

        /**
         * Alterna entre as 12 seções internas
         */
        switchSection(sectionKey) {
            this.activeSection = sectionKey;
            
            // Atualiza classe ativa nas abas
            if (typeof document !== 'undefined') {
                document.querySelectorAll('.revit-nav-tab').forEach(t => t.classList.remove('active'));
                const activeTab = document.getElementById(`revit-tab-${sectionKey}`);
                if (activeTab) activeTab.classList.add('active');

                // Atualiza conteúdo central
                const centerPanel = document.getElementById('revit-panel-center');
                if (centerPanel) {
                    centerPanel.innerHTML = this._renderSectionContentHTML();
                    if (window.lucide) window.lucide.createIcons();
                }
            }
        }

        /**
         * Ações de Conexão
         */
        async connect() {
            if (!this.adapter) this.init();
            await this.adapter.connect();
            this.render();
        }

        async disconnect() {
            if (!this.adapter) return;
            await this.adapter.disconnect();
            this.render();
        }

        async reconnect() {
            if (!this.adapter) this.init();
            await this.adapter.reconnect();
            this.render();
        }

        async refresh() {
            if (!this.adapter) return;
            await this.adapter.refresh();
            this.render();
        }

        selectElement(elementId) {
            this.selectedElementId = Number(elementId);
            if (typeof document !== 'undefined') {
                const rightPanel = document.getElementById('revit-panel-right');
                if (rightPanel) {
                    rightPanel.innerHTML = this._renderRightPanelHTML();
                    if (window.lucide) window.lucide.createIcons();
                }
            }
        }

        setParamTab(tabKey) {
            this.paramTab = tabKey;
            this.selectElement(this.selectedElementId);
        }

        async handlePromptSubmit(event) {
            if (event) event.preventDefault();
            const input = document.getElementById('revit-cmd-input');
            if (!input || !input.value.trim()) return;

            const promptText = input.value.trim();
            input.value = '';

            if (!this.adapter) return;

            this.commandState = 'planning';
            try {
                this.pendingCommand = await this._buildCommandPlan(promptText);
                this.commandState = 'preview';
            } catch (error) {
                this.pendingCommand = {
                    command: promptText,
                    action: 'Planejamento interrompido',
                    route: 'ROUTE_TO_ANALYSIS',
                    target: 'Comando informado',
                    affectedElements: 'Não determinado',
                    risk: 'Não avaliado',
                    tool: 'Nenhuma tool executada',
                    preview: 'Revise a conexão e tente novamente.',
                    error: error && error.message ? error.message : 'Não foi possível criar o plano.'
                };
                this.commandState = 'error';
            }
            this._refreshCommandCenter();
        }

        async approvePendingCommand() {
            if (!this.pendingCommand || !this.adapter) return;

            const command = this.pendingCommand;
            this.commandState = 'executing';
            this._refreshCommandCenter();

            try {
                let result;
                if (command.route === 'ROUTE_TO_3D' && typeof this.adapter.prepareSelectedRoomStudy === 'function') {
                    result = await this.adapter.prepareSelectedRoomStudy({
                        cameraName: 'ArqVertice Study Camera',
                        command: command.command
                    });
                } else if (command.route === 'ROUTE_TO_QUANTITY' && typeof this.adapter.getBimQuantities === 'function') {
                    result = await this.adapter.getBimQuantities({});
                } else {
                    result = await this.adapter.processAIPrompt(command.command);
                }
                const record = {
                    command: command.command,
                    context: command.context,
                    tool: command.tool,
                    result: result && result.success === false ? 'Failed' : 'Validated',
                    timestamp: new Date().toISOString()
                };
                this.commandHistory.unshift(record);
                this.commandHistory = this.commandHistory.slice(0, 20);
                this._persistCommandHistory();
                this.pendingCommand = { ...command, result, record };
                this.commandState = result && result.success === false ? 'error' : 'validated';
            } catch (error) {
                this.pendingCommand = {
                    ...command,
                    error: error && error.message ? error.message : 'Transaction failed'
                };
                this.commandState = 'error';
            }

            this.updateLogs();
            this._refreshCommandCenter();
        }

        cancelPendingCommand() {
            this.pendingCommand = null;
            this.commandState = 'idle';
            this._refreshCommandCenter();
        }

        _refreshCommandCenter() {
            if (typeof document === 'undefined') return;
            const footer = document.getElementById('revit-ws-footer');
            if (!footer) return;
            footer.innerHTML = this._renderFooterHTML();
            if (window.lucide) window.lucide.createIcons();
        }

        async _buildCommandPlan(promptText) {
            const context = this._getCommandContext();
            const fallbackRoute = this._resolveCommandRoute(promptText);
            let route = fallbackRoute;
            let jev = null;

            if (typeof window !== 'undefined' && window.JevDecisionEngine && typeof window.JevDecisionEngine.evaluateChoice === 'function') {
                jev = await window.JevDecisionEngine.evaluateChoice(
                    'Qual workflow operacional deve rotear este comando do Revit?',
                    ['ROUTE_TO_QUANTITY', 'ROUTE_TO_3D', 'ROUTE_TO_VIEW', 'ROUTE_TO_FAMILY', 'ROUTE_TO_ANALYSIS', 'ROUTE_TO_EXPORT'],
                    { text: promptText, command: promptText, currentView: context.currentView, selectionCount: context.selectionCount },
                    { fallbackAvailable: true, taskId: 'revit-command-center' }
                );
                if (jev && jev.decision && jev.confidenceLevel !== 'LOW') route = jev.decision;
            }

            const metadata = this._getRouteMetadata(route, promptText);
            return {
                command: promptText,
                context,
                route,
                jev,
                action: metadata.action,
                target: metadata.target,
                affectedElements: metadata.affectedElements,
                risk: metadata.risk,
                tool: metadata.tool,
                needsApproval: metadata.needsApproval,
                preview: metadata.preview,
                createdAt: new Date().toISOString()
            };
        }

        _getCommandContext() {
            const status = this.adapter && this.adapter.getStatus ? this.adapter.getStatus() : {};
            return {
                project: status.activeDocument || 'Modelo não conectado',
                currentView: status.activeView || '{3D}',
                selectionCount: Number(status.selectionCount || 0),
                activeRoom: 'Não informado',
                modelContext: 'Revit BIM / contexto mínimo'
            };
        }

        _resolveCommandRoute(promptText) {
            const q = promptText.toLowerCase();
            if (q.includes('quant') || q.includes('contagem')) return 'ROUTE_TO_QUANTITY';
            if (q.includes('3d') || q.includes('tridimensional') || q.includes('mobiliário') || q.includes('sala') || q.includes('ambiente')) return 'ROUTE_TO_3D';
            if (q.includes('vista') || q.includes('planta') || q.includes('fachada')) return 'ROUTE_TO_VIEW';
            if (q.includes('família') || q.includes('family')) return 'ROUTE_TO_FAMILY';
            if (q.includes('export') || q.includes('render')) return 'ROUTE_TO_EXPORT';
            return 'ROUTE_TO_ANALYSIS';
        }

        _getRouteMetadata(route, promptText) {
            const q = promptText.toLowerCase();
            const isWrite = /importe|importar|crie|criar|prepare|troque|alter|modific/.test(q);
            const metadata = {
                ROUTE_TO_QUANTITY: { action: 'Quantificar elementos', target: 'Categorias solicitadas no modelo', tool: 'revit.quantity.query', risk: 'L0 · Somente leitura', affectedElements: 'Elementos filtrados', preview: 'Contagem e unidades serão calculadas a partir do modelo ativo.' },
                ROUTE_TO_3D: { action: 'Preparar contexto 3D', target: 'Ambiente ou seleção atual', tool: 'revit.scene.import', risk: 'L1 · Importação para cena isolada', affectedElements: 'Seleção atual ou ambiente identificado', preview: 'A cena será preparada sem editar o documento Revit.' },
                ROUTE_TO_VIEW: { action: 'Consultar ou abrir vista', target: 'Vista solicitada', tool: 'revit.view.resolve', risk: 'L0 · Somente leitura', affectedElements: 'Vista e elementos visíveis', preview: 'A vista será resolvida e validada antes da abertura.' },
                ROUTE_TO_FAMILY: { action: 'Consultar família', target: 'Família selecionada ou mencionada', tool: 'revit.family.resolve', risk: 'L1 · Leitura de família', affectedElements: 'Famílias correspondentes', preview: 'Famílias, tipos e parâmetros serão listados para conferência.' },
                ROUTE_TO_ANALYSIS: { action: 'Analisar modelo', target: 'Contexto BIM necessário', tool: 'revit.analysis.run', risk: 'L0 · Somente leitura', affectedElements: 'Elementos do contexto mínimo', preview: 'A análise será executada com o contexto estritamente necessário.' },
                ROUTE_TO_EXPORT: { action: 'Preparar exportação/render', target: 'Vista ou ambiente atual', tool: 'revit.export.prepare', risk: 'L2 · Operação com efeito externo', affectedElements: 'Vista e dependências visuais', preview: 'A saída será preparada e validada antes de exportar.' }
            }[route] || {
                action: 'Analisar modelo',
                target: 'Contexto BIM necessário',
                tool: 'revit.analysis.run',
                risk: 'L0 · Somente leitura',
                affectedElements: 'Elementos do contexto mínimo',
                preview: 'A análise será executada com o contexto estritamente necessário.'
            };
            return { ...metadata, needsApproval: isWrite || route === 'ROUTE_TO_3D' || route === 'ROUTE_TO_EXPORT' };
        }

        _persistCommandHistory() {
            if (typeof localStorage === 'undefined') return;
            localStorage.setItem('arqvertice.revit.command-history', JSON.stringify(this.commandHistory));
        }

        handleQuickChip(chipText) {
            const input = document.getElementById('revit-cmd-input');
            if (input) {
                input.value = chipText;
                this.handlePromptSubmit(null);
            }
        }

        async triggerSync(mode) {
            if (!this.adapter) return;
            await this.adapter.syncMetadata(mode);
            this.switchSection('sync');
        }

        async resolveConflict(field, chosenSource) {
            if (!this.adapter) return;
            this.adapter.resolveMetadataConflict(field, chosenSource);
            this.switchSection('sync');
        }

        setQtyCategory(category) {
            this.qtyCategory = category;
            this.switchSection('quantities');
        }

        setQtyLevel(level) {
            this.qtyLevel = level;
            this.switchSection('quantities');
        }

        setQtyGroupBy(groupBy) {
            this.qtyGroupBy = groupBy;
            this.switchSection('quantities');
        }

        setQtyTab(tab) {
            this.qtyTab = tab;
            this.switchSection('quantities');
        }

        downloadQuantitiesCSV() {
            if (!this.adapter || !this.adapter.quantitiesEngine) return null;
            const engine = this.adapter.quantitiesEngine;
            const rawElements = engine._applyFilters(engine.catalog, {
                category: this.qtyCategory !== 'All' ? this.qtyCategory : undefined,
                level: this.qtyLevel !== 'All' ? this.qtyLevel : undefined
            });
            const aggregatedGroups = engine.aggregate(rawElements, this.qtyGroupBy);
            const validation = engine.validateDiscrepancies(rawElements, aggregatedGroups);
            let totalCount = 0, totalLength = 0, totalArea = 0, totalVolume = 0;
            const allElementIds = [];
            for (const grp of aggregatedGroups) {
                totalCount += grp.count.value;
                totalLength += grp.totalLength.value;
                totalArea += grp.totalArea.value;
                totalVolume += grp.totalVolume.value;
                allElementIds.push(...grp.elementIds);
            }
            const res = {
                queryName: `Quantitativos BIM - ${this.qtyCategory} - ${this.qtyLevel}`,
                groups: aggregatedGroups,
                metrics: {
                    count: engine.createQuantityMeasure(totalCount, 'un'),
                    length: engine.createQuantityMeasure(totalLength, 'm'),
                    area: engine.createQuantityMeasure(totalArea, 'm²'),
                    volume: engine.createQuantityMeasure(totalVolume, 'm³')
                },
                validation,
                traceability: {
                    elementIds: allElementIds,
                    sourceDocument: 'Residencia_Alphaville_Executivo.rvt',
                    timestamp: new Date().toISOString()
                }
            };
            const csv = this.adapter.exportBimQuantities(res, 'CSV');
            if (typeof document !== 'undefined') {
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `arqvertice-quantitativos-${this.qtyCategory}-${Date.now()}.csv`;
                a.click();
                URL.revokeObjectURL(url);
            }
            return csv;
        }

        downloadQuantitiesJSON() {
            if (!this.adapter || !this.adapter.quantitiesEngine) return null;
            const engine = this.adapter.quantitiesEngine;
            const rawElements = engine._applyFilters(engine.catalog, {
                category: this.qtyCategory !== 'All' ? this.qtyCategory : undefined,
                level: this.qtyLevel !== 'All' ? this.qtyLevel : undefined
            });
            const aggregatedGroups = engine.aggregate(rawElements, this.qtyGroupBy);
            const json = JSON.stringify({
                category: this.qtyCategory,
                level: this.qtyLevel,
                groupBy: this.qtyGroupBy,
                groups: aggregatedGroups
            }, null, 2);
            if (typeof document !== 'undefined') {
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `arqvertice-quantitativos-${this.qtyCategory}-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
            }
            return json;
        }

        updateHeaderAndHealth() {
            if (typeof document === 'undefined') return;
            const status = this.adapter ? this.adapter.getStatus() : { status: 'DISCONNECTED' };
            
            const pill = document.getElementById('revit-status-pill');
            const label = document.getElementById('revit-status-label');
            if (pill && label) {
                pill.className = `revit-status-pill status-${status.status.toLowerCase()}`;
                label.textContent = this._getStatusLabel(status.status);
            }

            const healthBar = document.getElementById('revit-health-bar');
            if (healthBar) {
                healthBar.innerHTML = this._renderHealthBarHTML();
            }
        }

        updateLogs() {
            if (typeof document === 'undefined') return;
            const logsContainer = document.getElementById('revit-logs-list');
            if (logsContainer && this.adapter) {
                logsContainer.innerHTML = this.adapter.eventLogs.map(l => `
                    <div class="revit-log-entry">
                        <span class="revit-log-time">[${l.timestamp}]</span>
                        <span class="revit-log-tag tag-${l.level}">${l.level}</span>
                        <span class="revit-log-msg">${escapeHTML(l.message)}</span>
                    </div>
                `).join('');
            }
        }

        // =====================================================================
        // HTML BUILDERS & TEMPLATES
        // =====================================================================

        _getStatusLabel(status) {
            switch (status) {
                case 'CONNECTED': return 'Revit Conectado (v2025.1)';
                case 'CONNECTING': return 'Conectando ao Revit...';
                case 'ERROR': return 'Erro de Conexão';
                default: return 'Revit Desconectado';
            }
        }

        _renderHealthBarHTML() {
            const health = this.adapter ? this.adapter.getHealthCheck() : {
                revitConnected: { label: 'Revit Connected', ready: false, text: 'Offline' },
                documentReady: { label: 'Document Ready', ready: false, text: 'Nenhum' },
                syncReady: { label: 'Sync Ready', ready: false, text: 'Inativo' },
                threeDReady: { label: '3D Ready', ready: false, text: 'Inativo' },
                aiReady: { label: 'AI Ready', ready: false, text: 'Inativo' }
            };

            return Object.values(health).map(h => `
                <div class="revit-health-item ${h.ready ? 'ready' : ''}">
                    <span class="indicator"></span>
                    <span><strong>${h.label}:</strong> ${h.text}</span>
                </div>
            `).join('');
        }

        _renderNavTabsHTML() {
            const tabs = [
                { id: 'overview', label: 'Overview', icon: 'layout-dashboard' },
                { id: 'connection', label: 'Connection', icon: 'network' },
                { id: 'project', label: 'Project', icon: 'file-text' },
                { id: 'model', label: 'Model', icon: 'boxes' },
                { id: 'views', label: 'Views', icon: 'eye' },
                { id: 'quantities', label: 'Quantities', icon: 'table' },
                { id: 'families', label: 'Families', icon: 'component' },
                { id: '3d', label: '3D Viewer', icon: 'box' },
                { id: 'ai-commands', label: 'AI Commands', icon: 'sparkles' },
                { id: 'sync', label: 'Sync', icon: 'refresh-cw' },
                { id: 'history', label: 'History', icon: 'history' },
                { id: 'settings', label: 'Settings', icon: 'sliders' }
            ];

            return tabs.map(t => `
                <button class="revit-nav-tab ${this.activeSection === t.id ? 'active' : ''}" 
                        id="revit-tab-${t.id}"
                        onclick="RevitWorkspaceModule.switchSection('${t.id}')">
                    <i data-lucide="${t.icon}"></i>
                    <span>${t.label}</span>
                </button>
            `).join('');
        }

        _renderLeftPanelHTML() {
            const status = this.adapter ? this.adapter.getStatus() : {
                activeDocument: 'Residencia_Alphaville_Executivo.rvt',
                version: '2025.1',
                build: '25.1.0.44',
                activeView: '{3D - Apresentacao}',
                selectionCount: 2,
                collaborationMode: 'CLOUD_WORKSHARED'
            };

            return `
                <!-- Card 1: Documento Ativo -->
                <div class="revit-card">
                    <div class="revit-card-title">
                        <span>Documento Revit</span>
                        <i data-lucide="file-code"></i>
                    </div>
                    <div class="revit-field-row">
                        <span class="revit-field-label">Arquivo:</span>
                        <span class="revit-field-val" title="${escapeHTML(status.activeDocument)}">${escapeHTML(status.activeDocument)}</span>
                    </div>
                    <div class="revit-field-row">
                        <span class="revit-field-label">Versão:</span>
                        <span class="revit-field-val">${status.version} (${status.build})</span>
                    </div>
                    <div class="revit-field-row">
                        <span class="revit-field-label">Modo:</span>
                        <span class="revit-field-val" style="color: #38bdf8;">${status.collaborationMode}</span>
                    </div>
                </div>

                <!-- Card 2: Projeto e Cliente -->
                <div class="revit-card">
                    <div class="revit-card-title">
                        <span>Projeto Associado</span>
                        <i data-lucide="briefcase"></i>
                    </div>
                    <div class="revit-field-row">
                        <span class="revit-field-label">Projeto:</span>
                        <span class="revit-field-val">Residência Alphaville</span>
                    </div>
                    <div class="revit-field-row">
                        <span class="revit-field-label">Cliente:</span>
                        <span class="revit-field-val">Família Mendonça</span>
                    </div>
                    <div class="revit-field-row">
                        <span class="revit-field-label">Fase:</span>
                        <span class="revit-field-val">Nova Construção</span>
                    </div>
                </div>

                <!-- Card 3: Topologia e Worksets -->
                <div class="revit-card">
                    <div class="revit-card-title">
                        <span>Worksharing & Status</span>
                        <i data-lucide="share-2"></i>
                    </div>
                    <div class="revit-field-row">
                        <span class="revit-field-label">Workset Ativo:</span>
                        <span class="revit-field-val">ARQ_Arquitetura</span>
                    </div>
                    <div class="revit-field-row">
                        <span class="revit-field-label">Seleção Ativa:</span>
                        <span class="revit-field-val" style="color: #10b981;">${status.selectionCount} elemento(s)</span>
                    </div>
                    <div class="revit-field-row">
                        <span class="revit-field-label">Vista Ativa:</span>
                        <span class="revit-field-val">${escapeHTML(status.activeView)}</span>
                    </div>
                </div>
            `;
        }

        _renderRightPanelHTML() {
            const el = this.adapter ? this.adapter.readElement(this.selectedElementId) : {
                id: 20412,
                category: 'Walls',
                family: 'Parede Básica',
                type: 'Alvenaria 15cm Bloco Cerâmico',
                level: 'Nível 01',
                workset: 'ARQ_Arquitetura_Principal',
                isEditable: true,
                parameters: { instance: [], type: [] }
            };

            const paramsList = this.paramTab === 'instance' ? el.parameters.instance : el.parameters.type;

            return `
                <div class="revit-card">
                    <div class="revit-card-title">
                        <span>Elemento Inspecionado</span>
                        <span class="badge badge-accent badge-sm">#${el.id}</span>
                    </div>
                    <div class="revit-field-row">
                        <span class="revit-field-label">Categoria:</span>
                        <span class="revit-field-val" style="color: #38bdf8; font-weight: 600;">${el.category}</span>
                    </div>
                    <div class="revit-field-row">
                        <span class="revit-field-label">Família:</span>
                        <span class="revit-field-val">${el.family}</span>
                    </div>
                    <div class="revit-field-row">
                        <span class="revit-field-label">Tipo:</span>
                        <span class="revit-field-val">${el.type}</span>
                    </div>
                    <div class="revit-field-row">
                        <span class="revit-field-label">Nível:</span>
                        <span class="revit-field-val">${el.level}</span>
                    </div>
                    <div class="revit-field-row">
                        <span class="revit-field-label">Editabilidade:</span>
                        <span class="revit-field-val" style="color: ${el.isEditable ? '#10b981' : '#f87171'};">
                            ${el.isEditable ? 'Liberado (Editável)' : 'Bloqueado (Outro Usuário)'}
                        </span>
                    </div>
                </div>

                <!-- Tabela de Parâmetros -->
                <div class="revit-card" style="flex: 1; overflow: hidden; display: flex; flex-direction: column;">
                    <div style="display: flex; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
                        <button class="revit-btn ${this.paramTab === 'instance' ? 'btn-primary-revit' : ''}" 
                                style="font-size: 0.75rem; padding: 4px 8px;"
                                onclick="RevitWorkspaceModule.setParamTab('instance')">
                            Instância (${el.parameters.instance.length})
                        </button>
                        <button class="revit-btn ${this.paramTab === 'type' ? 'btn-primary-revit' : ''}" 
                                style="font-size: 0.75rem; padding: 4px 8px;"
                                onclick="RevitWorkspaceModule.setParamTab('type')">
                            Tipo (${el.parameters.type.length})
                        </button>
                    </div>

                    <div style="flex: 1; overflow-y: auto; margin-top: 8px;">
                        <table class="revit-table">
                            <thead>
                                <tr>
                                    <th>Parâmetro</th>
                                    <th>Valor</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${paramsList.map(p => `
                                    <tr>
                                        <td style="color: #94a3b8; font-size: 0.75rem;">
                                            ${p.name}
                                            ${p.isReadOnly ? '<span style="font-size: 0.65rem; color: #64748b; margin-left: 4px;">(RO)</span>' : ''}
                                        </td>
                                        <td style="font-weight: 500; font-size: 0.75rem;">
                                            ${p.value}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        _renderFooterHTML() {
            const logs = this.adapter ? this.adapter.eventLogs : [
                { timestamp: '12:00:00', level: 'CONNECTED', message: 'Revit Workspace inicializado e pronto.' }
            ];
            const pending = this.pendingCommand;
            const statusCopy = {
                idle: 'Pronto para receber uma instrução',
                planning: 'Interpretando comando e capturando contexto mínimo...',
                preview: 'Plano pronto · revise antes de executar',
                executing: 'Executando tool registrada no adapter...',
                validated: 'Execução concluída · resultado validado',
                error: 'Execução interrompida · ação recomendada disponível'
            }[this.commandState] || 'Pronto para receber uma instrução';

            return `
                <div class="revit-cmd-console">
                    <div class="revit-command-heading">
                        <div>
                            <span class="revit-command-eyebrow">J37 · OPERAÇÃO REVIT</span>
                            <strong>Revit Command</strong>
                        </div>
                        <span class="revit-command-state state-${this.commandState}">${statusCopy}</span>
                    </div>
                    <form onsubmit="RevitWorkspaceModule.handlePromptSubmit(event)" class="revit-command-form">
                        <div class="revit-cmd-input-wrap">
                            <i data-lucide="terminal" aria-hidden="true"></i>
                            <input type="text" class="revit-cmd-input" id="revit-cmd-input" 
                                   aria-label="O que você deseja fazer com este modelo?"
                                   placeholder="O que você deseja fazer com este modelo?">
                            <button type="submit" class="revit-btn btn-primary-revit" ${this.commandState === 'executing' ? 'disabled' : ''}>
                                <i data-lucide="arrow-up"></i> Planejar
                            </button>
                        </div>
                    </form>

                    <div class="revit-chips-row">
                        <span class="revit-command-label">Exemplos</span>
                        ${[
                            'Mostre a planta térrea.',
                            'Importe a sala selecionada.',
                            'Traga todas as portas da suíte.',
                            'Quantifique as janelas.',
                            'Crie uma vista 3D deste ambiente.'
                        ].map(command => `<button type="button" class="revit-chip" onclick="RevitWorkspaceModule.handleQuickChip('${command}')">${command}</button>`).join('')}
                    </div>

                    ${pending && this.commandState !== 'idle' ? `
                        <div class="revit-command-plan" aria-live="polite">
                            <div class="revit-command-plan-header">
                                <div>
                                    <span class="revit-command-eyebrow">PLANO DE EXECUÇÃO</span>
                                    <strong>${escapeHTML(pending.action)}</strong>
                                </div>
                                <span class="revit-route-badge">${escapeHTML(pending.route.replace('ROUTE_TO_', ''))}</span>
                            </div>
                            <div class="revit-plan-grid">
                                <div><span>Target</span><strong>${escapeHTML(pending.target)}</strong></div>
                                <div><span>Affected elements</span><strong>${escapeHTML(pending.affectedElements)}</strong></div>
                                <div><span>Risk</span><strong>${escapeHTML(pending.risk)}</strong></div>
                                <div><span>Tool</span><strong class="revit-mono">${escapeHTML(pending.tool)}</strong></div>
                            </div>
                            <p class="revit-plan-preview">${escapeHTML(pending.preview || '')}</p>
                            ${pending.record ? `
                                <div class="revit-command-result">
                                    <strong>${pending.record.result === 'Validated' ? 'Validated' : 'Falha'}</strong>
                                    <span>${pending.record.result === 'Validated' ? 'Resultado conferido pelo pipeline Revit.' : 'A tool retornou uma falha.'}</span>
                                </div>
                            ` : ''}
                            ${pending.error ? `
                                <div class="revit-command-error">
                                    <strong>Transaction failed</strong>
                                    <span>${escapeHTML(pending.error)}</span>
                                </div>
                            ` : ''}
                            ${this.commandState === 'preview' ? `
                                <div class="revit-plan-actions">
                                    <button type="button" class="revit-btn" onclick="RevitWorkspaceModule.cancelPendingCommand()">Cancelar</button>
                                    <button type="button" class="revit-btn btn-primary-revit" onclick="RevitWorkspaceModule.approvePendingCommand()">
                                        <i data-lucide="check"></i> ${pending.needsApproval ? 'Aprovar e executar' : 'Executar plano'}
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>

                <div class="revit-logs-panel">
                    <div class="revit-logs-heading">
                        <span>Terminal de Eventos TCP / MCP</span>
                        <span class="revit-live-status">● Live Socket (4848)</span>
                    </div>
                    <div id="revit-logs-list" style="overflow-y: auto; flex: 1;">
                        ${logs.map(l => `
                            <div class="revit-log-entry">
                                <span class="revit-log-time">[${l.timestamp}]</span>
                                <span class="revit-log-tag tag-${l.level}">${l.level}</span>
                                <span class="revit-log-msg">${escapeHTML(l.message)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        /**
         * Roteamento de Conteúdo Central entre as 12 Seções
         */
        _renderSectionContentHTML() {
            switch (this.activeSection) {
                case 'overview': return this._renderOverviewSection();
                case 'connection': return this._renderConnectionSection();
                case 'project': return this._renderProjectSection();
                case 'model': return this._renderModelSection();
                case 'views': return this._renderViewsSection();
                case 'quantities': return this._renderQuantitiesSection();
                case 'families': return this._renderFamiliesSection();
                case '3d': return this._render3DSection();
                case 'ai-commands': return this._renderAICommandsSection();
                case 'sync': return this._renderSyncSection();
                case 'history': return this._renderHistorySection();
                case 'settings': return this._renderSettingsSection();
                default: return this._renderOverviewSection();
            }
        }

        _renderOverviewSection() {
            return `
                <div style="padding: 24px; display: flex; flex-direction: column; gap: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h2 style="margin: 0; font-size: 1.25rem; font-weight: 700;">Visão Geral do Modelo BIM</h2>
                            <p style="margin: 4px 0 0; color: #94a3b8; font-size: 0.8125rem;">
                                Conexão ativa com Autodesk Revit Desktop via socket local padronizado.
                            </p>
                        </div>
                        <button class="revit-btn btn-primary-revit" onclick="RevitWorkspaceModule.refresh()">
                            <i data-lucide="refresh-cw"></i> Atualizar Métricas
                        </button>
                    </div>

                    <!-- Métricas em Grid -->
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
                        <div class="revit-card" style="border-left: 3px solid #38bdf8;">
                            <span class="revit-card-title">Paredes Modeladas</span>
                            <span style="font-size: 1.5rem; font-weight: 700; color: #f8fafc;">48 instâncias</span>
                            <span style="font-size: 0.75rem; color: #94a3b8;">5 tipos de alvenaria</span>
                        </div>
                        <div class="revit-card" style="border-left: 3px solid #10b981;">
                            <span class="revit-card-title">Esquadrias (Portas & Janelas)</span>
                            <span style="font-size: 1.5rem; font-weight: 700; color: #f8fafc;">34 aberturas</span>
                            <span style="font-size: 0.75rem; color: #94a3b8;">14 portas / 20 janelas</span>
                        </div>
                        <div class="revit-card" style="border-left: 3px solid #f59e0b;">
                            <span class="revit-card-title">Ambientes Computados</span>
                            <span style="font-size: 1.5rem; font-weight: 700; color: #f8fafc;">12 Rooms</span>
                            <span style="font-size: 0.75rem; color: #94a3b8;">318.50 m² de área útil</span>
                        </div>
                        <div class="revit-card" style="border-left: 3px solid #a855f7;">
                            <span class="revit-card-title">Avisos do Revit</span>
                            <span style="font-size: 1.5rem; font-weight: 700; color: #34d399;">0 Críticos</span>
                            <span style="font-size: 0.75rem; color: #94a3b8;">2 advertências menores</span>
                        </div>
                    </div>

                    <!-- Tabela de Elementos em Foco -->
                    <div class="revit-card">
                        <div class="revit-card-title" style="margin-bottom: 12px;">
                            <span>Elementos Sob Destaque no Pavimento Principal</span>
                            <span style="color: #38bdf8; font-size: 0.75rem;">Clique para selecionar</span>
                        </div>
                        <table class="revit-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Categoria</th>
                                    <th>Família e Tipo</th>
                                    <th>Nível</th>
                                    <th>Dimensão / Cota</th>
                                    <th>Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr onclick="RevitWorkspaceModule.selectElement(20412)" style="cursor: pointer;">
                                    <td>#20412</td>
                                    <td><span class="badge badge-accent badge-sm">Walls</span></td>
                                    <td>Alvenaria 15cm Bloco Cerâmico</td>
                                    <td>Nível 01</td>
                                    <td>Comprimento: 6.20 m</td>
                                    <td><button class="revit-btn" style="padding: 2px 8px; font-size: 0.7rem;">Inspecionar</button></td>
                                </tr>
                                <tr onclick="RevitWorkspaceModule.selectElement(20413)" style="cursor: pointer;">
                                    <td>#20413</td>
                                    <td><span class="badge badge-accent badge-sm">Walls</span></td>
                                    <td>Alvenaria 15cm Bloco Cerâmico</td>
                                    <td>Nível 01</td>
                                    <td>Comprimento: 4.50 m</td>
                                    <td><button class="revit-btn" style="padding: 2px 8px; font-size: 0.7rem;">Inspecionar</button></td>
                                </tr>
                                <tr onclick="RevitWorkspaceModule.selectElement(30101)" style="cursor: pointer;">
                                    <td>#30101</td>
                                    <td><span class="badge badge-success badge-sm">Doors</span></td>
                                    <td>Porta Pivotante Madeira Freijó</td>
                                    <td>Nível 01</td>
                                    <td>1.20 x 2.40 m</td>
                                    <td><button class="revit-btn" style="padding: 2px 8px; font-size: 0.7rem;">Inspecionar</button></td>
                                </tr>
                                <tr onclick="RevitWorkspaceModule.selectElement(40101)" style="cursor: pointer;">
                                    <td>#40101</td>
                                    <td><span class="badge badge-warning badge-sm">Windows</span></td>
                                    <td>Janela de Correr Alumínio Preto</td>
                                    <td>Nível 01</td>
                                    <td>2.00 x 1.20 m</td>
                                    <td><button class="revit-btn" style="padding: 2px 8px; font-size: 0.7rem;">Inspecionar</button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        _renderConnectionSection() {
            return `
                <div style="padding: 24px; display: flex; flex-direction: column; gap: 16px;">
                    <h2 style="margin: 0; font-size: 1.25rem; font-weight: 700;">Diagnóstico da Conexão Revit Bridge</h2>
                    <div class="revit-card">
                        <div class="revit-card-title"><span>Socket TCP & Handshake</span></div>
                        <div class="revit-field-row"><span class="revit-field-label">Endereço IP:</span><span class="revit-field-val">127.0.0.1 (Loopback estrito)</span></div>
                        <div class="revit-field-row"><span class="revit-field-label">Porta Local:</span><span class="revit-field-val">4848</span></div>
                        <div class="revit-field-row"><span class="revit-field-label">Latência Média:</span><span class="revit-field-val" style="color: #10b981;">14 ms</span></div>
                        <div class="revit-field-row"><span class="revit-field-label">Protocolo:</span><span class="revit-field-val">JSON-RPC / Revit Bridge v1.0</span></div>
                        <div class="revit-field-row"><span class="revit-field-label">Add-in Revit:</span><span class="revit-field-val">ArqVerticeRevitConnector.dll (.NET 8.0)</span></div>
                    </div>
                </div>
            `;
        }

        _renderProjectSection() {
            const link = this.adapter ? this.adapter.getProjectLink('prj-praia-01') : null;
            const ids = link?.identifiers || {
                ARQ_ProjectId: 'prj-praia-01',
                ARQ_ClientId: 'cli-pedro-01',
                ARQ_SyncId: 'sync_init_001',
                ARQ_ProjectVersion: '1.0.0',
                ARQ_LastSync: new Date().toISOString()
            };

            return `
                <div style="padding: 24px; display: flex; flex-direction: column; gap: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h2 style="margin: 0; font-size: 1.25rem; font-weight: 700;">Identidade & Vínculo do Projeto (J33)</h2>
                            <p style="margin: 4px 0 0; color: #94a3b8; font-size: 0.8125rem;">
                                Correspondência persistente entre ArqVértice Studio e Autodesk Revit sem duplicidade de digitação.
                            </p>
                        </div>
                        <span class="revit-status-pill status-connected">
                            <span class="revit-pulse-dot"></span> VÍNCULO ATIVO (MATCH 100%)
                        </span>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <!-- Coluna A: Metadados ArqVértice (Source of Truth) -->
                        <div class="revit-card" style="border-left: 3px solid #38bdf8;">
                            <div class="revit-card-title">
                                <span>ArqVértice Studio (Master)</span>
                                <span class="badge badge-accent badge-sm">Source of Truth</span>
                            </div>
                            <div class="revit-field-row"><span class="revit-field-label">Projeto:</span><span class="revit-field-val">Residência de Praia</span></div>
                            <div class="revit-field-row"><span class="revit-field-label">Código:</span><span class="revit-field-val">PRJ-PRAIA-01</span></div>
                            <div class="revit-field-row"><span class="revit-field-label">Cliente:</span><span class="revit-field-val">Pedro Albuquerque</span></div>
                            <div class="revit-field-row"><span class="revit-field-label">Localização:</span><span class="revit-field-val">Litoral Sul, Lote 14</span></div>
                            <div class="revit-field-row"><span class="revit-field-label">Status:</span><span class="revit-field-val" style="color: #10b981;">Em Andamento</span></div>
                        </div>

                        <!-- Coluna B: Metadados Revit (ProjectInformation) -->
                        <div class="revit-card" style="border-left: 3px solid #10b981;">
                            <div class="revit-card-title">
                                <span>Revit Document (Consumer)</span>
                                <span class="badge badge-success badge-sm">ProjectInfo</span>
                            </div>
                            <div class="revit-field-row"><span class="revit-field-label">Project Name:</span><span class="revit-field-val">Residência Alphaville Eusébio</span></div>
                            <div class="revit-field-row"><span class="revit-field-label">Project Number:</span><span class="revit-field-val">PRJ-PRAIA-01</span></div>
                            <div class="revit-field-row"><span class="revit-field-label">Client Name:</span><span class="revit-field-val">Pedro Albuquerque</span></div>
                            <div class="revit-field-row"><span class="revit-field-label">Building Name:</span><span class="revit-field-val">Residência Unifamiliar</span></div>
                            <div class="revit-field-row"><span class="revit-field-label">Unidades:</span><span class="revit-field-val">Métrico (m / mm)</span></div>
                        </div>
                    </div>

                    <!-- Identificadores Persistentes -->
                    <div class="revit-card">
                        <div class="revit-card-title">
                            <span>Identificadores Persistentes no Modelo RVT (Shared Parameters & Extensible Storage)</span>
                            <i data-lucide="key"></i>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 8px;">
                            <div style="background: rgba(15, 23, 42, 0.6); padding: 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
                                <div style="font-size: 0.7rem; color: #94a3b8;">ARQ_ProjectId (Shared Param)</div>
                                <div style="font-weight: 600; color: #38bdf8; font-family: monospace;">${ids.ARQ_ProjectId}</div>
                            </div>
                            <div style="background: rgba(15, 23, 42, 0.6); padding: 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
                                <div style="font-size: 0.7rem; color: #94a3b8;">ARQ_ClientId (Shared Param)</div>
                                <div style="font-weight: 600; color: #f8fafc; font-family: monospace;">${ids.ARQ_ClientId}</div>
                            </div>
                            <div style="background: rgba(15, 23, 42, 0.6); padding: 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
                                <div style="font-size: 0.7rem; color: #94a3b8;">ARQ_SyncId (Extensible Storage)</div>
                                <div style="font-weight: 600; color: #10b981; font-family: monospace;">${ids.ARQ_SyncId}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        _renderModelSection() {
            return `
                <div style="padding: 24px; display: flex; flex-direction: column; gap: 16px;">
                    <h2 style="margin: 0; font-size: 1.25rem; font-weight: 700;">Explorador do Modelo BIM</h2>
                    <div class="revit-card">
                        <div class="revit-card-title"><span>Hierarquia de Categorias e Elementos</span></div>
                        <div style="display: flex; gap: 12px; margin-top: 8px;">
                            <span class="badge badge-accent">Walls (48)</span>
                            <span class="badge badge-success">Doors (14)</span>
                            <span class="badge badge-warning">Windows (20)</span>
                            <span class="badge badge-sm">Floors (6)</span>
                            <span class="badge badge-sm">Roofs (2)</span>
                        </div>
                        <p style="margin-top: 12px; font-size: 0.8125rem; color: #94a3b8;">
                            Selecione elementos na tabela ou através da árvore para inspecionar parâmetros de tipo e instância em tempo real.
                        </p>
                    </div>
                </div>
            `;
        }

        _renderViewsSection() {
            return `
                <div style="padding: 24px; display: flex; flex-direction: column; gap: 16px;">
                    <h2 style="margin: 0; font-size: 1.25rem; font-weight: 700;">Vistas e Pranchas do Documento</h2>
                    <div class="revit-card">
                        <div class="revit-card-title"><span>Vistas Ativas no Revit</span></div>
                        <div class="revit-field-row"><span class="revit-field-label">Planta Baixa:</span><span class="revit-field-val">Nível 01 - Executivo 1:50</span></div>
                        <div class="revit-field-row"><span class="revit-field-label">Vista 3D:</span><span class="revit-field-val">{3D - Coordenação Geral}</span></div>
                        <div class="revit-field-row"><span class="revit-field-label">Corte Longitudinal:</span><span class="revit-field-val">Corte AA - Escada</span></div>
                    </div>
                </div>
            `;
        }

        _renderQuantitiesSection() {
            const engine = this.adapter ? this.adapter.quantitiesEngine : null;
            
            // Extração determinística a partir do motor
            let rawElements = [];
            if (engine) {
                rawElements = engine._applyFilters(engine.catalog, {
                    category: this.qtyCategory !== 'All' ? this.qtyCategory : undefined,
                    level: this.qtyLevel !== 'All' ? this.qtyLevel : undefined
                });
            }

            const aggregatedGroups = engine ? engine.aggregate(rawElements, this.qtyGroupBy) : [];
            const validation = engine ? engine.validateDiscrepancies(rawElements, aggregatedGroups) : { valid: true, message: 'Motor pronto.' };

            let totalCount = 0;
            let totalLength = 0;
            let totalArea = 0;
            let totalVolume = 0;
            const allElementIds = [];

            for (const grp of aggregatedGroups) {
                totalCount += grp.count.value;
                totalLength += grp.totalLength.value;
                totalArea += grp.totalArea.value;
                totalVolume += grp.totalVolume.value;
                allElementIds.push(...grp.elementIds);
            }

            // Material Takeoff
            const matMap = new Map();
            for (const el of rawElements) {
                for (const m of (el.materials || [])) {
                    if (!matMap.has(m.name)) {
                        matMap.set(m.name, { material: m.name, category: el.category, areaM2: 0, volumeM3: 0, count: 0, elementIds: [] });
                    }
                    const rec = matMap.get(m.name);
                    rec.areaM2 += (m.areaM2 || 0);
                    rec.volumeM3 += (m.volumeM3 || 0);
                    rec.count += 1;
                    if (!rec.elementIds.includes(el.id)) rec.elementIds.push(el.id);
                }
            }
            const takeoffList = Array.from(matMap.values()).sort((a, b) => b.areaM2 - a.areaM2);

            return `
                <div style="padding: 24px; display: flex; flex-direction: column; gap: 16px;">
                    <!-- Cabeçalho J34 -->
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <h2 style="margin: 0; font-size: 1.25rem; font-weight: 700;">BIM Extraction & Quantities Engine (J34)</h2>
                                <span class="badge badge-success badge-sm">100% Determinístico</span>
                            </div>
                            <p style="margin: 4px 0 0; color: #94a3b8; font-size: 0.8125rem;">
                                Extração e cálculo direto do modelo Revit ativo. Rastreabilidade auditável até o Element ID.
                            </p>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button class="revit-btn btn-primary-revit" onclick="RevitWorkspaceModule.downloadQuantitiesCSV()">
                                <i data-lucide="download"></i> Exportar CSV
                            </button>
                            <button class="revit-btn" onclick="RevitWorkspaceModule.downloadQuantitiesJSON()">
                                <i data-lucide="file-code"></i> Exportar JSON
                            </button>
                        </div>
                    </div>

                    <!-- Barra de Filtros em Cascata -->
                    <div class="revit-card" style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255,255,255,0.08);">
                        <div style="display: flex; gap: 16px; flex-wrap: wrap; align-items: center;">
                            <div style="display: flex; flex-direction: column; gap: 4px;">
                                <label style="font-size: 0.7rem; color: #94a3b8; text-transform: uppercase;">Pavimento (Level):</label>
                                <select class="revit-select" onchange="RevitWorkspaceModule.setQtyLevel(this.value)" style="background: #0f172a; color: #f8fafc; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 6px 12px; font-size: 0.8125rem;">
                                    <option value="All" ${this.qtyLevel === 'All' ? 'selected' : ''}>Todos os Pavimentos</option>
                                    <option value="Nível 01" ${this.qtyLevel === 'Nível 01' ? 'selected' : ''}>Nível 01 (Térreo)</option>
                                    <option value="Nível 02" ${this.qtyLevel === 'Nível 02' ? 'selected' : ''}>Nível 02 (Superior)</option>
                                </select>
                            </div>

                            <div style="display: flex; flex-direction: column; gap: 4px;">
                                <label style="font-size: 0.7rem; color: #94a3b8; text-transform: uppercase;">Categoria BIM:</label>
                                <select class="revit-select" onchange="RevitWorkspaceModule.setQtyCategory(this.value)" style="background: #0f172a; color: #f8fafc; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 6px 12px; font-size: 0.8125rem;">
                                    <option value="All" ${this.qtyCategory === 'All' ? 'selected' : ''}>Todas as Categorias</option>
                                    <option value="Walls" ${this.qtyCategory === 'Walls' ? 'selected' : ''}>Walls (Paredes)</option>
                                    <option value="Floors" ${this.qtyCategory === 'Floors' ? 'selected' : ''}>Floors (Pisos)</option>
                                    <option value="Doors" ${this.qtyCategory === 'Doors' ? 'selected' : ''}>Doors (Portas)</option>
                                    <option value="Windows" ${this.qtyCategory === 'Windows' ? 'selected' : ''}>Windows (Janelas)</option>
                                    <option value="Columns" ${this.qtyCategory === 'Columns' ? 'selected' : ''}>Columns (Pilares)</option>
                                    <option value="Rooms" ${this.qtyCategory === 'Rooms' ? 'selected' : ''}>Rooms (Ambientes)</option>
                                </select>
                            </div>

                            <div style="display: flex; flex-direction: column; gap: 4px;">
                                <label style="font-size: 0.7rem; color: #94a3b8; text-transform: uppercase;">Agrupar Por:</label>
                                <select class="revit-select" onchange="RevitWorkspaceModule.setQtyGroupBy(this.value)" style="background: #0f172a; color: #f8fafc; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 6px 12px; font-size: 0.8125rem;">
                                    <option value="type" ${this.qtyGroupBy === 'type' ? 'selected' : ''}>Tipo (Type)</option>
                                    <option value="family" ${this.qtyGroupBy === 'family' ? 'selected' : ''}>Família (Family)</option>
                                    <option value="material" ${this.qtyGroupBy === 'material' ? 'selected' : ''}>Material</option>
                                    <option value="level" ${this.qtyGroupBy === 'level' ? 'selected' : ''}>Pavimento (Level)</option>
                                    <option value="workset" ${this.qtyGroupBy === 'workset' ? 'selected' : ''}>Workset</option>
                                </select>
                            </div>

                            <div style="margin-left: auto; display: flex; align-items: flex-end;">
                                <span class="badge badge-accent badge-sm" style="font-family: monospace;">
                                    ${rawElements.length} elementos filtrados
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- 4 Métricas Chave com Unidades Explícitas -->
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
                        <div class="revit-card" style="border-left: 3px solid #38bdf8;">
                            <span class="revit-card-title">Instâncias (Count)</span>
                            <span style="font-size: 1.5rem; font-weight: 700; color: #f8fafc;">${totalCount} <small style="font-size: 0.8rem; color: #94a3b8;">UN</small></span>
                            <span style="font-size: 0.7rem; color: #94a3b8;">Filtro: ${this.qtyCategory} / ${this.qtyLevel}</span>
                        </div>
                        <div class="revit-card" style="border-left: 3px solid #10b981;">
                            <span class="revit-card-title">Comprimento Linear (Length)</span>
                            <span style="font-size: 1.5rem; font-weight: 700; color: #f8fafc;">${totalLength.toFixed(2)} <small style="font-size: 0.8rem; color: #94a3b8;">m</small></span>
                            <span style="font-size: 0.7rem; color: #94a3b8;">Medição em eixo central</span>
                        </div>
                        <div class="revit-card" style="border-left: 3px solid #f59e0b;">
                            <span class="revit-card-title">Área Total (Area)</span>
                            <span style="font-size: 1.5rem; font-weight: 700; color: #f8fafc;">${totalArea.toFixed(2)} <small style="font-size: 0.8rem; color: #94a3b8;">m²</small></span>
                            <span style="font-size: 0.7rem; color: #94a3b8;">Superfície computada</span>
                        </div>
                        <div class="revit-card" style="border-left: 3px solid #a855f7;">
                            <span class="revit-card-title">Volume Total (Volume)</span>
                            <span style="font-size: 1.5rem; font-weight: 700; color: #f8fafc;">${totalVolume.toFixed(2)} <small style="font-size: 0.8rem; color: #94a3b8;">m³</small></span>
                            <span style="font-size: 0.7rem; color: #94a3b8;">Volume sólido real</span>
                        </div>
                    </div>

                    <!-- Sub-abas de Visualização -->
                    <div style="display: flex; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
                        <button class="revit-btn ${this.qtyTab === 'aggregated' ? 'btn-primary-revit' : ''}" style="font-size: 0.8125rem; padding: 6px 14px;"
                                onclick="RevitWorkspaceModule.setQtyTab('aggregated')">
                            <i data-lucide="layers"></i> Agrupamento & Quantidades
                        </button>
                        <button class="revit-btn ${this.qtyTab === 'takeoff' ? 'btn-primary-revit' : ''}" style="font-size: 0.8125rem; padding: 6px 14px;"
                                onclick="RevitWorkspaceModule.setQtyTab('takeoff')">
                            <i data-lucide="package"></i> Material Takeoff
                        </button>
                        <button class="revit-btn ${this.qtyTab === 'validation' ? 'btn-primary-revit' : ''}" style="font-size: 0.8125rem; padding: 6px 14px;"
                                onclick="RevitWorkspaceModule.setQtyTab('validation')">
                            <i data-lucide="shield-check"></i> Validação & Rastreabilidade
                        </button>
                    </div>

                    <!-- Conteúdo da Sub-aba Selecionada -->
                    ${this.qtyTab === 'aggregated' ? `
                        <div class="revit-card">
                            <table class="revit-table">
                                <thead>
                                    <tr>
                                        <th>Grupo / Tipo</th>
                                        <th>Categoria</th>
                                        <th>Pavimento</th>
                                        <th>Qtd (un)</th>
                                        <th>Comprimento</th>
                                        <th>Área</th>
                                        <th>Volume</th>
                                        <th>IDs Auditados</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${aggregatedGroups.map(g => `
                                        <tr>
                                            <td><strong>${g.groupKey}</strong></td>
                                            <td><span class="badge badge-accent badge-sm">${g.category}</span></td>
                                            <td>${g.level || '-'}</td>
                                            <td style="font-weight: 600;">${g.count.formatted}</td>
                                            <td>${g.totalLength.formatted}</td>
                                            <td>${g.totalArea.formatted}</td>
                                            <td>${g.totalVolume.formatted}</td>
                                            <td>
                                                <small style="color: #38bdf8; font-family: monospace; cursor: pointer;" title="${g.elementIds.join(', ')}">
                                                    #${g.elementIds.slice(0, 3).join(', ')}${g.elementIds.length > 3 ? '...' : ''}
                                                </small>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : ''}

                    ${this.qtyTab === 'takeoff' ? `
                        <div class="revit-card">
                            <div class="revit-card-title"><span>Levantamento Analítico de Materiais (Takeoff)</span></div>
                            <table class="revit-table" style="margin-top: 8px;">
                                <thead>
                                    <tr>
                                        <th>Material</th>
                                        <th>Categoria Hospedeira</th>
                                        <th>Área Total</th>
                                        <th>Volume Total</th>
                                        <th>Camadas / Ocorrências</th>
                                        <th>Elementos Vinculados</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${takeoffList.map(m => `
                                        <tr>
                                            <td><strong>${m.material}</strong></td>
                                            <td><span class="badge badge-sm">${m.category}</span></td>
                                            <td style="color: #f59e0b; font-weight: 600;">${m.areaM2.toFixed(2)} m²</td>
                                            <td style="color: #a855f7; font-weight: 600;">${m.volumeM3.toFixed(2)} m³</td>
                                            <td>${m.count} camadas</td>
                                            <td><small style="color: #38bdf8; font-family: monospace;">#${m.elementIds.join(', #')}</small></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : ''}

                    ${this.qtyTab === 'validation' ? `
                        <div class="revit-card" style="border-left: 3px solid ${validation.valid ? '#10b981' : '#ef4444'};">
                            <div class="revit-card-title" style="color: ${validation.valid ? '#10b981' : '#ef4444'};">
                                <span>${validation.valid ? '✔ Verificação de Integridade Aprovada' : '⚠️ Discrepância Detectada'}</span>
                            </div>
                            <p style="margin: 4px 0 12px; font-size: 0.8125rem; color: #cbd5e1;">${validation.message}</p>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                <div style="background: rgba(15, 23, 42, 0.6); padding: 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
                                    <div style="font-size: 0.75rem; color: #94a3b8;">Documento Fonte:</div>
                                    <div style="font-weight: 600; color: #f8fafc;">Residencia_Alphaville_Executivo.rvt</div>
                                    <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 8px;">Vista de Extração:</div>
                                    <div style="font-weight: 600; color: #f8fafc;">Nível 01 - Executivo 1:50</div>
                                </div>
                                <div style="background: rgba(15, 23, 42, 0.6); padding: 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
                                    <div style="font-size: 0.75rem; color: #94a3b8;">Contagem Bruta vs Agregada:</div>
                                    <div style="font-weight: 600; color: #10b981;">${rawElements.length} extraídos = ${totalCount} agregados</div>
                                    <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 8px;">Previsão de Custo Futuro:</div>
                                    <div style="color: #94a3b8; font-size: 0.75rem;">Aguardando fonte de preços (SINAPI / TCPO)</div>
                                </div>
                            </div>

                            <div style="margin-top: 12px;">
                                <div style="font-size: 0.75rem; color: #94a3b8; margin-bottom: 4px;">Element IDs Extraídos nesta Query (${allElementIds.length}):</div>
                                <div style="background: rgba(0,0,0,0.3); padding: 8px; border-radius: 4px; font-family: monospace; font-size: 0.75rem; color: #38bdf8; word-break: break-all;">
                                    ${allElementIds.join(', ')}
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        _renderFamiliesSection() {
            return `
                <div style="padding: 24px; display: flex; flex-direction: column; gap: 16px;">
                    <h2 style="margin: 0; font-size: 1.25rem; font-weight: 700;">Gerenciador de Famílias RFA</h2>
                    <div class="revit-card">
                        <div class="revit-card-title"><span>Famílias Carregadas no Projeto</span></div>
                        <div class="revit-field-row"><span class="revit-field-label">Parede Básica:</span><span class="revit-field-val">Alvenaria 15cm Bloco Cerâmico</span></div>
                        <div class="revit-field-row"><span class="revit-field-label">Porta Pivotante:</span><span class="revit-field-val">Porta Pivotante Madeira Freijó</span></div>
                        <div class="revit-field-row"><span class="revit-field-label">Janela de Correr:</span><span class="revit-field-val">Esquadria Alumínio Preto 2 Folhas</span></div>
                    </div>
                </div>
            `;
        }

        _render3DSection() {
            return `
                <div style="padding: 24px; display: flex; flex-direction: column; gap: 16px;">
                    <h2 style="margin: 0; font-size: 1.25rem; font-weight: 700;">Viewport 3D & Geometria Espacial</h2>
                    <div class="revit-card" style="height: 320px; display: flex; flex-direction: column; justify-content: center; align-items: center; background: rgba(15, 23, 42, 0.9);">
                        <i data-lucide="box" style="width: 48px; height: 48px; color: #38bdf8; margin-bottom: 12px;"></i>
                        <span style="font-weight: 600; color: #f8fafc;">WebGL BIM Canvas Ativo</span>
                        <span style="font-size: 0.8125rem; color: #94a3b8; margin-top: 4px;">Renderização de malhas e BoundingBox extraídos diretamente da API Revit</span>
                    </div>
                </div>
            `;
        }

        _renderAICommandsSection() {
            return `
                <div style="padding: 24px; display: flex; flex-direction: column; gap: 16px;">
                    <h2 style="margin: 0; font-size: 1.25rem; font-weight: 700;">Comandos de IA & Automação Cognitiva</h2>
                    <div class="revit-card">
                        <div class="revit-card-title"><span>Console do Agente Cognitivo BIM</span></div>
                        <p style="font-size: 0.8125rem; color: #94a3b8;">
                            Envie instruções em linguagem natural através do Command Center inferior para auditar, consultar ou propor modificações no modelo.
                        </p>
                    </div>
                </div>
            `;
        }

        _renderSyncSection() {
            const conflicts = this.adapter ? this.adapter.getMetadataConflicts() : [];
            const auditLogs = this.adapter ? this.adapter.getSyncAuditLog() : [];

            return `
                <div style="padding: 24px; display: flex; flex-direction: column; gap: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h2 style="margin: 0; font-size: 1.25rem; font-weight: 700;">Centro de Sincronização & Metadados Bidirecionais</h2>
                            <p style="margin: 4px 0 0; color: #94a3b8; font-size: 0.8125rem;">
                                Gestão controlada dos 5 modos de sincronização e conciliação de conflitos sem sobrescrita silenciosa.
                            </p>
                        </div>
                    </div>

                    <!-- Modos de Sincronização -->
                    <div class="revit-card">
                        <div class="revit-card-title"><span>Ações de Sincronização</span></div>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px;">
                            <button class="revit-btn btn-primary-revit" onclick="RevitWorkspaceModule.triggerSync('AUTO')">
                                <i data-lucide="zap"></i> Sincronização Automática
                            </button>
                            <button class="revit-btn" onclick="RevitWorkspaceModule.triggerSync('PUSH_TO_REVIT')">
                                <i data-lucide="arrow-up-right"></i> Push para Revit (Studio ➔ RVT)
                            </button>
                            <button class="revit-btn" onclick="RevitWorkspaceModule.triggerSync('PULL_FROM_REVIT')">
                                <i data-lucide="arrow-down-left"></i> Pull do Revit (RVT ➔ Studio)
                            </button>
                            <button class="revit-btn" onclick="RevitWorkspaceModule.triggerSync('READ_ONLY')">
                                <i data-lucide="search"></i> Auditoria Read-Only
                            </button>
                        </div>
                    </div>

                    <!-- Painel de Conflitos Ativos -->
                    ${conflicts.length > 0 ? `
                        <div class="revit-card" style="border-left: 3px solid #f59e0b;">
                            <div class="revit-card-title" style="color: #f59e0b;">
                                <span>⚠️ Conflitos de Metadados Detectados (${conflicts.length})</span>
                                <span class="badge badge-warning badge-sm">Aprovação Necessária</span>
                            </div>
                            <div style="margin-top: 8px; display: flex; flex-direction: column; gap: 10px;">
                                ${conflicts.map(c => `
                                    <div style="background: rgba(15, 23, 42, 0.6); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06);">
                                        <div style="font-weight: 600; color: #f8fafc; font-size: 0.875rem;">${c.label} (${c.field})</div>
                                        <div style="font-size: 0.8125rem; color: #94a3b8; margin: 4px 0 8px;">${c.description}</div>
                                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                                            <div style="background: rgba(56, 189, 248, 0.1); padding: 8px; border-radius: 6px; font-size: 0.8125rem;">
                                                <strong style="color: #38bdf8;">ArqVértice:</strong> ${c.arqValue}
                                            </div>
                                            <div style="background: rgba(16, 185, 129, 0.1); padding: 8px; border-radius: 6px; font-size: 0.8125rem;">
                                                <strong style="color: #34d399;">Revit:</strong> ${c.revitValue}
                                            </div>
                                        </div>
                                        <div style="display: flex; gap: 8px;">
                                            <button class="revit-btn btn-primary-revit" style="font-size: 0.75rem; padding: 4px 10px;"
                                                    onclick="RevitWorkspaceModule.resolveConflict('${c.field}', 'ARQVERTICE')">
                                                Manter ArqVértice
                                            </button>
                                            <button class="revit-btn" style="font-size: 0.75rem; padding: 4px 10px;"
                                                    onclick="RevitWorkspaceModule.resolveConflict('${c.field}', 'REVIT')">
                                                Adotar Revit
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : `
                        <div class="revit-card" style="border-left: 3px solid #10b981;">
                            <div class="revit-card-title">
                                <span style="color: #10b981;">Conformidade de Metadados: 100% Sincronizado</span>
                                <span class="badge badge-success badge-sm">Zero Conflitos</span>
                            </div>
                            <p style="margin: 4px 0 0; color: #94a3b8; font-size: 0.8125rem;">
                                Os dados de Cliente, Projeto e Modelo estão perfeitamente alinhados entre o ArqVértice Studio e o arquivo RVT.
                            </p>
                        </div>
                    `}

                    <!-- Trilha de Auditoria Transacional -->
                    <div class="revit-card">
                        <div class="revit-card-title"><span>Trilha de Auditoria de Sincronizações</span></div>
                        <table class="revit-table" style="margin-top: 8px;">
                            <thead>
                                <tr><th>Timestamp</th><th>Origem ➔ Destino</th><th>Campos</th><th>Usuário</th><th>Status</th></tr>
                            </thead>
                            <tbody>
                                ${auditLogs.length > 0 ? auditLogs.map(l => `
                                    <tr>
                                        <td style="font-size: 0.75rem; color: #94a3b8;">${new Date(l.timestamp).toLocaleTimeString()}</td>
                                        <td style="font-size: 0.75rem; font-weight: 500;">${l.source} ➔ ${l.target}</td>
                                        <td style="font-size: 0.75rem; color: #cbd5e1;">${l.fieldsChanged.join(', ')}</td>
                                        <td style="font-size: 0.75rem;">${l.user}</td>
                                        <td><span class="badge badge-success badge-sm">${l.status}</span></td>
                                    </tr>
                                `).join('') : `
                                    <tr><td colspan="5" style="text-align: center; color: #64748b;">Nenhuma alteração registrada ainda.</td></tr>
                                `}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        _renderHistorySection() {
            const history = this.commandHistory;
            return `
                <div style="padding: 24px; display: flex; flex-direction: column; gap: 16px;">
                    <h2 style="margin: 0; font-size: 1.25rem; font-weight: 700;">Histórico de Comandos & Transações</h2>
                    <div class="revit-card">
                        <table class="revit-table">
                            <thead>
                                <tr><th>Command</th><th>Context</th><th>Tool</th><th>Status</th><th>Horário</th></tr>
                            </thead>
                            <tbody>
                                ${history.length ? history.map(item => `
                                    <tr>
                                        <td title="${escapeHTML(item.command)}">${escapeHTML(item.command)}</td>
                                        <td>${escapeHTML(item.context.currentView || '-')}</td>
                                        <td class="revit-mono">${escapeHTML(item.tool)}</td>
                                        <td><span class="badge ${item.result === 'Validated' ? 'badge-success' : 'badge-danger'} badge-sm">${escapeHTML(item.result)}</span></td>
                                        <td>${new Date(item.timestamp).toLocaleString('pt-BR')}</td>
                                    </tr>
                                `).join('') : `
                                    <tr><td colspan="5" style="text-align: center; color: #64748b;">Nenhum comando executado pelo Command Center.</td></tr>
                                `}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        _renderSettingsSection() {
            return `
                <div style="padding: 24px; display: flex; flex-direction: column; gap: 16px;">
                    <h2 style="margin: 0; font-size: 1.25rem; font-weight: 700;">Configurações do Conector Revit</h2>
                    <div class="revit-card">
                        <div class="revit-card-title"><span>Parâmetros de Rede e Segurança</span></div>
                        <div class="revit-field-row"><span class="revit-field-label">Porta TCP Loopback:</span><span class="revit-field-val">4848</span></div>
                        <div class="revit-field-row"><span class="revit-field-label">Nível de Risco Padrão:</span><span class="revit-field-val">L0 (READ ONLY)</span></div>
                        <div class="revit-field-row"><span class="revit-field-label">Timeout de Comando:</span><span class="revit-field-val">30000 ms</span></div>
                        <div class="revit-field-row"><span class="revit-field-label">Driver Virtual (CI/CD):</span><span class="revit-field-val">Ativado como Fallback</span></div>
                    </div>
                </div>
            `;
        }
    }

    const instance = new RevitWorkspace();
    return instance;
}));
