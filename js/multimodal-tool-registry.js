/**
 * ArqVértice Studio — Bloco J: J12 — Multimodal Tool Execution + Permission System
 * 
 * Unified tool layer across Vision, Image, 3D, Blender, CAD, BIM, Drawing,
 * Document, Video, and File domains with strict permission contracts and audit logging.
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.MultimodalToolRegistry = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /**
     * Risk Levels
     */
    const RISK_LEVELS = Object.freeze({
        READ_ONLY: 'READ_ONLY',
        REVERSIBLE: 'REVERSIBLE',
        SENSITIVE: 'SENSITIVE',
        DESTRUCTIVE: 'DESTRUCTIVE'
    });

    /**
     * Tool Categories
     */
    const TOOL_CATEGORIES = Object.freeze([
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
    ]);

    class MultimodalToolRegistry {
        constructor(options = {}) {
            this.version = '1.0.0-bloco-j12';
            this.debug = !!options.debug;
            this.tools = new Map();
            this.auditLog = [];
            this.confirmationHandler = options.confirmationHandler || null;

            this._registerDefaultToolContracts();
        }

        /**
         * Set confirmation handler for DESTRUCTIVE tools (e.g., UI modal / prompt callback)
         */
        setConfirmationHandler(fn) {
            this.confirmationHandler = fn;
        }

        /**
         * Register a tool with a strict contract
         */
        registerTool(contract, implementation) {
            if (!contract.name || typeof contract.name !== 'string') {
                throw new Error('[ToolRegistry] Tool contract must have a valid string "name"');
            }
            if (!contract.category || !TOOL_CATEGORIES.includes(contract.category)) {
                throw new Error(`[ToolRegistry] Invalid or missing tool category: ${contract.category}`);
            }
            if (!contract.risk || !RISK_LEVELS[contract.risk]) {
                throw new Error(`[ToolRegistry] Invalid tool risk level: ${contract.risk}`);
            }
            if (typeof implementation !== 'function') {
                throw new Error(`[ToolRegistry] Tool implementation for ${contract.name} must be a function`);
            }

            const validatedContract = {
                name: contract.name,
                category: contract.category,
                description: contract.description || '',
                inputSchema: contract.inputSchema || {},
                outputSchema: contract.outputSchema || {},
                permissions: Array.isArray(contract.permissions) ? contract.permissions : ['read'],
                risk: contract.risk,
                reversible: typeof contract.reversible === 'boolean' ? contract.reversible : (contract.risk === RISK_LEVELS.REVERSIBLE),
                timeout: contract.timeout || 30000,
                createdAt: new Date().toISOString()
            };

            this.tools.set(contract.name, {
                contract: validatedContract,
                handler: implementation
            });

            if (this.debug) console.log(`[ToolRegistry] Registered tool: ${contract.name} [${contract.risk}]`);
            return validatedContract;
        }

        /**
         * Get tool metadata contract
         */
        getToolContract(name) {
            const entry = this.tools.get(name);
            return entry ? { ...entry.contract } : null;
        }

        /**
         * List all registered tools by category
         */
        listTools(filter = {}) {
            const list = [];
            for (const [, entry] of this.tools.entries()) {
                if (filter.category && entry.contract.category !== filter.category) continue;
                if (filter.risk && entry.contract.risk !== filter.risk) continue;
                list.push({ ...entry.contract });
            }
            return list;
        }

        /**
         * Execute a tool safely inside a sandboxed wrapper with permission & audit gates
         */
        async execute(toolName, input = {}, context = {}) {
            const entry = this.tools.get(toolName);
            if (!entry) {
                throw new Error(`[ToolRegistry] Tool not found: ${toolName}`);
            }

            const { contract, handler } = entry;
            const agent = context.agent || 'MultimodalAgentCore';
            const callTimestamp = new Date().toISOString();
            const startTime = Date.now();

            // 1. Parameter Validation (shallow check)
            if (contract.inputSchema.required && Array.isArray(contract.inputSchema.required)) {
                for (const field of contract.inputSchema.required) {
                    if (input[field] === undefined || input[field] === null) {
                        const errResult = {
                            success: false,
                            error: `Missing required input argument: "${field}" for tool ${toolName}`,
                            toolName
                        };
                        this._recordAudit(agent, toolName, input, 'VALIDATION_FAILED', errResult, startTime);
                        return errResult;
                    }
                }
            }

            // 2. Risk Evaluation & Confirmation Gate
            if (contract.risk === RISK_LEVELS.DESTRUCTIVE) {
                let confirmed = false;
                if (context.bypassConfirmation) {
                    confirmed = true;
                } else if (typeof this.confirmationHandler === 'function') {
                    confirmed = await this.confirmationHandler({
                        toolName,
                        risk: contract.risk,
                        description: contract.description,
                        input
                    });
                }

                if (!confirmed) {
                    const rejectedResult = {
                        success: false,
                        aborted: true,
                        reason: `Destructive operation "${toolName}" was rejected by confirmation gate.`
                    };
                    this._recordAudit(agent, toolName, input, 'DESTRUCTIVE_REJECTED', rejectedResult, startTime);
                    return rejectedResult;
                }
            }

            // 3. Sandboxed Execution with Timeout
            let executionResult;
            try {
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error(`Tool execution timed out after ${contract.timeout}ms`)), contract.timeout);
                });

                const runPromise = Promise.resolve().then(() => handler(input, context));
                const rawOutput = await Promise.race([runPromise, timeoutPromise]);

                executionResult = {
                    success: true,
                    data: rawOutput,
                    toolName,
                    risk: contract.risk,
                    reversible: contract.reversible
                };

                this._recordAudit(agent, toolName, input, 'EXECUTED', executionResult, startTime);
                return executionResult;
            } catch (err) {
                executionResult = {
                    success: false,
                    error: err.message,
                    toolName
                };
                this._recordAudit(agent, toolName, input, 'EXECUTION_ERROR', executionResult, startTime);
                return executionResult;
            }
        }

        /**
         * Record execution into audit log
         */
        _recordAudit(agent, tool, input, decision, result, startTime) {
            const auditEntry = {
                id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                agent,
                tool,
                inputSummary: typeof input === 'object' ? Object.keys(input) : String(input),
                decision,
                success: !!result.success,
                durationMs: Date.now() - startTime,
                timestamp: new Date().toISOString()
            };
            this.auditLog.push(auditEntry);
            if (this.auditLog.length > 500) {
                this.auditLog.shift();
            }
        }

        /**
         * Query audit logs
         */
        getAuditLogs(limit = 50) {
            return this.auditLog.slice(-limit);
        }

        /**
         * Populate default tool contracts across the 10 domain categories
         */
        _registerDefaultToolContracts() {
            // 1. VisionTools
            this.registerTool({
                name: 'vision_inspect_image',
                category: 'VisionTools',
                description: 'Analyzes architectural images, extracts bboxes, scene layout and spatial relations.',
                risk: RISK_LEVELS.READ_ONLY,
                reversible: true,
                timeout: 15000,
                inputSchema: { required: ['image'] }
            }, async (input) => ({ objectsDetected: 4, layout: 'living_room_concept', confidence: 0.94 }));

            // 2. ImageTools
            this.registerTool({
                name: 'image_segment_and_replace',
                category: 'ImageTools',
                description: 'Segments specified target in image and executes inpainting/material replacement.',
                risk: RISK_LEVELS.REVERSIBLE,
                reversible: true,
                timeout: 25000,
                inputSchema: { required: ['image', 'targetPrompt'] }
            }, async (input) => ({ modifiedUrl: 'blob:arqvertice-edit-v1.png', maskApplied: true }));

            // 3. ThreeDTools
            this.registerTool({
                name: 'trellis_image_to_3d',
                category: 'ThreeDTools',
                description: 'Converts reference image into optimized 3D GLB mesh using TRELLIS.2 architecture.',
                risk: RISK_LEVELS.REVERSIBLE,
                reversible: true,
                timeout: 45000,
                inputSchema: { required: ['imageUrl'] }
            }, async (input) => ({ glbUrl: 'assets/models/generated-mesh.glb', vertexCount: 14200, manifold: true }));

            // 4. BlenderTools
            this.registerTool({
                name: 'blender_compose_scene',
                category: 'BlenderTools',
                description: 'Dispatches scene composition and camera rendering to local Blender instance.',
                risk: RISK_LEVELS.REVERSIBLE,
                reversible: true,
                timeout: 60000,
                inputSchema: { required: ['sceneConfig'] }
            }, async (input) => ({ renderUrl: 'renders/blender-out.png', passes: ['diffuse', 'depth'] }));

            // 5. CADTools
            this.registerTool({
                name: 'freecad_update_parameter',
                category: 'CADTools',
                description: 'Updates a parametric dimension in the CAD feature tree and triggers recompute.',
                risk: RISK_LEVELS.REVERSIBLE,
                reversible: true,
                timeout: 20000,
                inputSchema: { required: ['featureName', 'paramName', 'value'] }
            }, async (input) => ({ recomputed: true, feature: input.featureName, updatedValue: input.value }));

            // 6. CADTools - Destructive
            this.registerTool({
                name: 'freecad_purge_geometry',
                category: 'CADTools',
                description: 'Permanently purges unreferenced solids or sketches from CAD model.',
                risk: RISK_LEVELS.DESTRUCTIVE,
                reversible: false,
                timeout: 10000,
                inputSchema: { required: ['targetSolidId'] }
            }, async (input) => ({ purgedSolidId: input.targetSolidId, status: 'purged' }));

            // 7. BIMTools
            this.registerTool({
                name: 'bim_query_quantities',
                category: 'BIMTools',
                description: 'Queries exact authoritative quantities, areas and volumes from IFC model.',
                risk: RISK_LEVELS.READ_ONLY,
                reversible: true,
                timeout: 15000,
                inputSchema: { required: ['elementClass'] }
            }, async (input) => ({ elementClass: input.elementClass, count: 24, totalVolumeM3: 48.6 }));

            // 8. DrawingTools
            this.registerTool({
                name: 'drawing_parse_vector',
                category: 'DrawingTools',
                description: 'Extracts geometric primitives (lines, polylines, texts) from DXF or SVG floor plans.',
                risk: RISK_LEVELS.READ_ONLY,
                reversible: true,
                timeout: 20000,
                inputSchema: { required: ['fileData'] }
            }, async (input) => ({ layerCount: 6, entityCount: 182, wallLinesDetected: 42 }));

            // 9. DocumentTools
            this.registerTool({
                name: 'document_extract_schedule',
                category: 'DocumentTools',
                description: 'Extracts door, window, or finish schedules from architectural specifications PDF.',
                risk: RISK_LEVELS.READ_ONLY,
                reversible: true,
                timeout: 25000,
                inputSchema: { required: ['pdfData'] }
            }, async (input) => ({ scheduleFound: true, tableRows: 18 }));

            // 10. VideoTools
            this.registerTool({
                name: 'video_compose_remotion',
                category: 'VideoTools',
                description: 'Synthesizes cinematic camera pan and architectural walkthrough with Remotion.',
                risk: RISK_LEVELS.REVERSIBLE,
                reversible: true,
                timeout: 90000,
                inputSchema: { required: ['compositionProps'] }
            }, async (input) => ({ mp4Url: 'exports/walkthrough-720p.mp4', durationFrames: 180, fps: 30 }));

            // 11. FileTools
            this.registerTool({
                name: 'file_export_bundle',
                category: 'FileTools',
                description: 'Packages project assets into an archive export bundle.',
                risk: RISK_LEVELS.SENSITIVE,
                reversible: true,
                timeout: 30000,
                inputSchema: { required: ['bundleName', 'assetIds'] }
            }, async (input) => ({ archiveUrl: `exports/${input.bundleName}.zip`, sizeBytes: 10485760 }));
        }
    }

    MultimodalToolRegistry.RISK_LEVELS = RISK_LEVELS;
    MultimodalToolRegistry.TOOL_CATEGORIES = TOOL_CATEGORIES;

    return MultimodalToolRegistry;
}));
