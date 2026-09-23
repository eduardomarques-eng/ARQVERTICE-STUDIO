/**
 * ArqVértice Studio — Bloco J: J11 — Multimodal Router + Jev
 * 
 * Jev Engine: Bounded fast-decision engine for multimodal orchestration.
 * Strict Policy Flow: Jev -> Choice -> Confidence -> Policy -> Route -> Executor.
 * Never executes arbitrary actions directly.
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.MultimodalRouterJev = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /**
     * Bounded Decision Domains
     */
    const DECISION_DOMAINS = Object.freeze({
        TASK_CLASS: [
            '3D_GENERATION',
            'CAD_EDIT',
            'IMAGE_EDIT',
            'BIM_QUERY',
            'DRAWING_ANALYSIS',
            'BLENDER_COMPOSE',
            'VIDEO_COMPOSE',
            'DOCUMENT_EXTRACT',
            'GENERAL_REASONING'
        ],
        TARGET_TOOL: [
            'VisionTools',
            'ImageTools',
            'ThreeDTools',
            'BlenderTools',
            'CADTools',
            'BIMTools',
            'DrawingTools',
            'DocumentTools',
            'VideoTools',
            'FileTools'
        ],
        TARGET_MODEL: [
            'Qwen3-VL',
            'Qwen-Image',
            'SAM3',
            'TRELLIS.2',
            'FreeCAD-MCP',
            'Blender-MCP',
            'ThatOpen-Engine',
            'Remotion-Engine',
            'Astra-Reasoning'
        ],
        QUALITY_LEVEL: [
            'draft',
            'interactive',
            'high',
            'render',
            'production'
        ],
        OUTPUT_FORMAT: [
            'GLB',
            'STEP',
            'IFC',
            'PNG',
            'SVG',
            'MP4',
            'JSON'
        ]
    });

    /**
     * Safety & Policy Rules for Decisions
     */
    const SAFETY_POLICIES = Object.freeze({
        CONFIDENCE_THRESHOLD_AUTONOMOUS: 0.75,
        CONFIDENCE_THRESHOLD_REVIEW_REQUIRED: 0.50,
        RESTRICTED_ROUTING: {
            'CAD_EDIT': { requiresConfirmationIfDestructive: true, sandboxRequired: true },
            'IMAGE_EDIT': { requiresConfirmationIfDestructive: false, reversibilityRequired: true },
            '3D_GENERATION': { maxQualityWithoutReview: 'high' },
            'BLENDER_COMPOSE': { safeLocalhostOnly: true }
        }
    });

    class MultimodalRouterJev {
        constructor(options = {}) {
            this.version = '1.0.0-bloco-j11';
            this.debug = !!options.debug;
            this.auditLog = [];
            this.registeredExecutors = new Map();
            this.activePolicies = { ...SAFETY_POLICIES };
        }

        /**
         * Register a service/executor handler for a specific tool/model combination
         */
        registerExecutor(toolName, executorFn) {
            if (typeof executorFn !== 'function') {
                throw new Error(`Executor for ${toolName} must be a callable function`);
            }
            this.registeredExecutors.set(toolName, executorFn);
            if (this.debug) console.log(`[JevRouter] Registered executor for ${toolName}`);
        }

        /**
         * Fast-bounded classification using Jev decision policy
         * Takes multimodal input intent, payload metadata, and current workspace state
         */
        evaluateIntent(input = {}) {
            const text = (input.prompt || input.instruction || input.text || '').toLowerCase();
            const mediaType = (input.mediaType || input.mimeType || '').toLowerCase();
            const hasImage = !!input.image || mediaType.startsWith('image/') || text.includes('imagem') || text.includes('render');
            const hasCad = !!input.cad || mediaType.includes('step') || mediaType.includes('dxf') || text.includes('step') || text.includes('dimensão') || text.includes('parametr');
            const has3D = !!input.threeD || mediaType.includes('glb') || text.includes('3d') || text.includes('malha') || text.includes('trellis');
            const hasBim = !!input.bim || mediaType.includes('ifc') || text.includes('ifc') || text.includes('parede') || text.includes('bim');
            const hasVideo = text.includes('video') || text.includes('anim') || text.includes('remotion');

            let taskClass = 'GENERAL_REASONING';
            let targetTool = 'VisionTools';
            let targetModel = 'Astra-Reasoning';
            let qualityLevel = input.qualityLevel || 'interactive';
            let outputFormat = input.format || 'JSON';
            let confidence = 0.85;

            let needsVision = false;
            let needsCAD = false;
            let needsBlender = false;
            let needsReview = false;

            // Bounded decision heuristics (Jev Bounded Dispatch)
            if (hasCad || text.includes('step') || text.includes('dxf') || /\bcad\b/.test(text) || text.includes('freecad') || text.includes('feature') || (text.includes('dimensão') && (text.includes('altere') || text.includes('largura')))) {
                taskClass = 'CAD_EDIT';
                targetTool = 'CADTools';
                targetModel = 'FreeCAD-MCP';
                outputFormat = 'STEP';
                needsCAD = true;
                confidence = 0.95;
            } else if (hasImage && (text.includes('gerar 3d') || text.includes('transforme em 3d') || text.includes('3d') || text.includes('trellis') || text.includes('mesh'))) {
                taskClass = '3D_GENERATION';
                targetTool = 'ThreeDTools';
                targetModel = 'TRELLIS.2';
                outputFormat = 'GLB';
                needsVision = true;
                confidence = 0.92;
            } else if (hasImage && (text.includes('retire') || text.includes('remova') || text.includes('troque') || text.includes('substitua') || text.includes('cor') || text.includes('material') || text.includes('segment'))) {
                taskClass = 'IMAGE_EDIT';
                targetTool = 'ImageTools';
                targetModel = text.includes('segment') ? 'SAM3' : 'Qwen-Image';
                outputFormat = 'PNG';
                needsVision = true;
                confidence = 0.90;
            } else if (hasBim || text.includes('ifc') || text.includes('quantitativo') || text.includes('alvenaria')) {
                taskClass = 'BIM_QUERY';
                targetTool = 'BIMTools';
                targetModel = 'ThatOpen-Engine';
                outputFormat = 'JSON';
                confidence = 0.88;
            } else if (text.includes('blender') || text.includes('cena 3d') || text.includes('iluminação') || text.includes('camera')) {
                taskClass = 'BLENDER_COMPOSE';
                targetTool = 'BlenderTools';
                targetModel = 'Blender-MCP';
                outputFormat = 'GLB';
                needsBlender = true;
                confidence = 0.86;
            } else if (hasVideo) {
                taskClass = 'VIDEO_COMPOSE';
                targetTool = 'VideoTools';
                targetModel = 'Remotion-Engine';
                outputFormat = 'MP4';
                confidence = 0.85;
            } else if (hasImage) {
                taskClass = 'DRAWING_ANALYSIS';
                targetTool = 'VisionTools';
                targetModel = 'Qwen3-VL';
                outputFormat = 'JSON';
                needsVision = true;
                confidence = 0.89;
            }

            // Flag review requirements
            if (confidence < this.activePolicies.CONFIDENCE_THRESHOLD_AUTONOMOUS) {
                needsReview = true;
            }
            if (taskClass === 'CAD_EDIT' && (text.includes('deletar') || text.includes('remover feature') || text.includes('substituir tudo'))) {
                needsReview = true;
            }

            const decision = {
                taskClass,
                targetTool,
                targetModel,
                qualityLevel,
                outputFormat,
                needsVision,
                needsCAD,
                needsBlender,
                needsReview,
                confidence
            };

            // Policy verification
            const policyResult = this._verifyPolicy(decision, input);

            const routePayload = {
                decision,
                policy: policyResult,
                timestamp: new Date().toISOString(),
                inputSummary: {
                    promptSnippet: text.slice(0, 100),
                    mediaType,
                    hasImage,
                    hasCad,
                    has3D,
                    hasBim
                }
            };

            this.auditLog.push(routePayload);
            return routePayload;
        }

        /**
         * Verify policy gates before execution
         */
        _verifyPolicy(decision, input) {
            const rule = this.activePolicies.RESTRICTED_ROUTING[decision.taskClass] || {};
            const isDestructive = !!input.destructive || (input.prompt || '').toLowerCase().includes('apagar tudo') || (input.prompt || '').toLowerCase().includes('delete') || (input.prompt || '').toLowerCase().includes('purge');

            if (isDestructive) {
                return {
                    status: 'REQUIRES_HUMAN_APPROVAL',
                    reason: `Operation flagged as potentially destructive; requires user confirmation.`,
                    allowed: false
                };
            }

            if (decision.confidence < this.activePolicies.CONFIDENCE_THRESHOLD_REVIEW_REQUIRED) {
                return {
                    status: 'LOW_CONFIDENCE_HOLD',
                    reason: `Jev confidence ${decision.confidence} is below review threshold ${this.activePolicies.CONFIDENCE_THRESHOLD_REVIEW_REQUIRED}.`,
                    allowed: false
                };
            }

            return {
                status: 'POLICY_APPROVED',
                reason: 'All safety and confidence gates satisfied.',
                allowed: true
            };
        }

        /**
         * Safe Route and Dispatch to Registered Executor
         */
        async dispatch(routePayload, payload = {}) {
            if (!routePayload || !routePayload.policy) {
                throw new Error('[JevRouter] Invalid route payload');
            }

            if (!routePayload.policy.allowed) {
                return {
                    success: false,
                    blockedByPolicy: true,
                    status: routePayload.policy.status,
                    reason: routePayload.policy.reason,
                    decision: routePayload.decision
                };
            }

            const toolName = routePayload.decision.targetTool;
            const executor = this.registeredExecutors.get(toolName);

            if (!executor) {
                return {
                    success: false,
                    noExecutorRegistered: true,
                    toolName,
                    decision: routePayload.decision,
                    message: `No executor function registered for tool category: ${toolName}`
                };
            }

            try {
                const startTime = Date.now();
                const result = await executor({
                    decision: routePayload.decision,
                    payload,
                    timestamp: new Date().toISOString()
                });
                const durationMs = Date.now() - startTime;

                return {
                    success: true,
                    toolName,
                    model: routePayload.decision.targetModel,
                    durationMs,
                    result
                };
            } catch (err) {
                return {
                    success: false,
                    toolName,
                    error: err.message,
                    fallbackAttempted: false
                };
            }
        }
    }

    MultimodalRouterJev.DECISION_DOMAINS = DECISION_DOMAINS;
    MultimodalRouterJev.SAFETY_POLICIES = SAFETY_POLICIES;

    return MultimodalRouterJev;
}));
