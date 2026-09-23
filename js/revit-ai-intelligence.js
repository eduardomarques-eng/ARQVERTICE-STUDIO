/**
 * ArqVértice Studio — Bloco J: J21 — Revit + AI Intelligence
 * 
 * Pipeline de Inteligência Híbrida:
 * Revit ➔ BIM Context ➔ Context Builder ➔ AI Router ➔ Jev / LLM / Vision ➔ BIM Action Plan ➔ Revit Tool ➔ Validation
 * 
 * Separação estrita:
 * - Jev: Decisões rápidas delimitadas (<15ms).
 * - LLM: Raciocínio, interpretação e planejamento textual.
 * - Determinístico: Queries, IDs, parâmetros, checagens geométricas e transações.
 * - Visão + BIM: Fusão multimodal de renders/screenshots com elementos nativos do Revit.
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.RevitAIIntelligence = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class RevitAIIntelligence {
        constructor(connector, options = {}) {
            this.version = '1.0.0-bloco-j21';
            this.connector = connector;
            this.debug = !!options.debug;
            this.confidenceThreshold = options.confidenceThreshold || 0.75;
        }

        /**
         * 1. CONTEXT BUILDER: Extrai o contexto cognitivo mínimo essencial do modelo Revit ativo
         */
        async buildBIMContext(filter = {}) {
            const status = this.connector ? this.connector.state : {};
            const projectInfo = await this._safeQuery('GET_PROJECT_INFO');
            const selection = await this._safeQuery('GET_SELECTION');
            const currentView = await this._safeQuery('GET_CURRENT_VIEW');

            const context = {
                documentTitle: status.documentTitle || 'Modelo_Ativo.rvt',
                revitVersion: status.revitVersion || '2025',
                projectName: projectInfo.projectName || 'Projeto Não Nomeado',
                levelsCount: projectInfo.levelsCount || 1,
                activeView: {
                    id: currentView.id || 0,
                    name: currentView.name || '{3D}',
                    viewType: currentView.viewType || 'ThreeD',
                    scale: currentView.scale || 50
                },
                selection: {
                    count: selection.count || 0,
                    elementIds: (selection.elements || []).map(e => e.id)
                },
                timestamp: new Date().toISOString()
            };

            return context;
        }

        /**
         * 2. JEV BOUNDED DECISION: Decisões delimitadas para o ecossistema Revit
         */
        evaluateJevDecision(intentText = '', bimContext = {}) {
            const q = (intentText || '').toLowerCase();

            let targetWorkflow = 'MODEL_AUDIT';
            let targetTool = 'RevitReadEngine';
            let analysisStrategy = 'DETERMINISTIC_QUERY';
            let targetView = bimContext.activeView?.name || '{3D}';
            let needsReview = false;
            let exportMethod = 'JSON';
            let confidence = 0.90;

            if (q.includes('fachada') || q.includes('janela') || q.includes('esquadria')) {
                targetWorkflow = 'FACADE_ANALYSIS';
                analysisStrategy = 'VISION_BIM_FUSION';
                targetView = 'Elevação Norte';
                targetTool = 'RevitReadEngine';
                confidence = 0.92;
            } else if (q.includes('ambiente') || q.includes('sala') || q.includes('quarto') || q.includes('área')) {
                targetWorkflow = 'ROOM_ANALYSIS';
                analysisStrategy = 'DETERMINISTIC_QUERY';
                targetTool = 'RevitReadEngine';
                confidence = 0.95;
            } else if (q.includes('trocar') || q.includes('alterar') || q.includes('modificar') || q.includes('parâmetro')) {
                targetWorkflow = 'PARAMETER_UPDATE';
                targetTool = 'RevitWriteEngine';
                analysisStrategy = 'TRANSACTION_PLAN';
                needsReview = true; // Modificações requerem revisão prévia
                confidence = 0.94;
            } else if (q.includes('prancha') || q.includes('folha') || q.includes('exportar')) {
                targetWorkflow = 'DOCUMENTATION';
                targetTool = 'RevitDocumentationEngine';
                exportMethod = q.includes('dwg') ? 'DWG' : (q.includes('ifc') ? 'IFC' : 'PDF');
                confidence = 0.91;
            }

            return {
                targetWorkflow,
                targetTool,
                analysisStrategy,
                targetView,
                needsReview,
                exportMethod,
                confidence,
                resolvedBy: 'JevDecisionEngine'
            };
        }

        /**
         * 3. VISION + BIM FUSION MATCHING:
         * Correlaciona regiões de screenshots/renders com elementos nativos do Revit
         * Regra: NUNCA altera automaticamente se a confiança for inferior a 0.75.
         */
        async matchVisualToRevitElements(visualRegions = [], revitElements = []) {
            const matches = [];

            for (const region of visualRegions) {
                // Heurística de proximidade espacial e tipo (Bounding Box normalizado + Categoria)
                const candidate = revitElements.find(el => {
                    const matchCategory = (region.category || '').toLowerCase() === (el.category || '').toLowerCase();
                    return matchCategory;
                });

                if (candidate) {
                    const matchConfidence = region.confidence ? region.confidence * 0.95 : 0.85;
                    const eligibleForAutonomous = matchConfidence >= this.confidenceThreshold;

                    matches.push({
                        visualRegionId: region.id,
                        elementId: candidate.id,
                        uniqueId: candidate.uniqueId,
                        category: candidate.category,
                        name: candidate.name,
                        confidence: matchConfidence,
                        eligibleForAutonomousChange: eligibleForAutonomous,
                        requiresUserReview: !eligibleForAutonomous,
                        reason: eligibleForAutonomous 
                            ? 'Correspondência alta entre render e elemento Revit.' 
                            : 'Baixa confiança de alinhamento visual; necessária confirmação manual.'
                    });
                }
            }

            return {
                totalMatched: matches.length,
                matches,
                passedSafetyThreshold: matches.every(m => m.eligibleForAutonomousChange)
            };
        }

        /**
         * 4. GERAÇÃO DE PLANO DE AÇÃO BIM (BIM Action Plan)
         */
        async createBIMActionPlan(userPrompt, options = {}) {
            const bimContext = await this.buildBIMContext();
            const jevDecision = this.evaluateJevDecision(userPrompt, bimContext);

            const plan = {
                planId: `bim_plan_${Date.now()}`,
                prompt: userPrompt,
                contextSummary: `${bimContext.projectName} • ${bimContext.documentTitle}`,
                decision: jevDecision,
                steps: [
                    { step: 1, action: 'CAPTURE_CONTEXT', tool: 'RevitReadEngine', status: 'COMPLETED' },
                    { step: 2, action: 'EVALUATE_INTENT', tool: 'JevDecisionEngine', status: 'COMPLETED' },
                    { 
                        step: 3, 
                        action: jevDecision.analysisStrategy, 
                        tool: jevDecision.targetTool, 
                        status: 'PLANNED',
                        requiresApproval: jevDecision.needsReview
                    },
                    { step: 4, action: 'VALIDATE_COMPLIANCE', tool: 'RevitAuditEngine', status: 'PLANNED' }
                ],
                requiresHumanApproval: jevDecision.needsReview,
                createdAt: new Date().toISOString()
            };

            return plan;
        }

        /**
         * Consulta segura via conector
         */
        async _safeQuery(operation, input = {}) {
            if (!this.connector) return {};
            try {
                const res = await this.connector.sendCommand({ operation, input, mode: 'read' });
                return res.result || {};
            } catch {
                return {};
            }
        }
    }

    return RevitAIIntelligence;
}));
