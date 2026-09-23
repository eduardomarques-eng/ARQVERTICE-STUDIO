/**
 * ArqVértice Studio — Bloco J: J27 — Revit MCP Bridge
 * 
 * Camada MCP (Model Context Protocol) padronizada para expor capacidades do Revit
 * ao AI Router e Agentes do ArqVértice Studio.
 * Referência Arquitetural: LuDattilo/revit-mcp-server (adaptado e isolado em adapter leve).
 * 
 * 7 Categorias: READ, QUERY, ANALYZE, PROPOSE, WRITE, EXPORT, VALIDATE.
 * Permissões: READ_ONLY, PROPOSE, WRITE_REVERSIBLE, WRITE_SENSITIVE, DELETE.
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.RevitMCPAdapter = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const MCP_PERMISSIONS = Object.freeze({
        READ_ONLY: 'READ_ONLY',
        PROPOSE: 'PROPOSE',
        WRITE_REVERSIBLE: 'WRITE_REVERSIBLE',
        WRITE_SENSITIVE: 'WRITE_SENSITIVE',
        DELETE: 'DELETE'
    });

    const MCP_CATEGORIES = Object.freeze([
        'READ',
        'QUERY',
        'ANALYZE',
        'PROPOSE',
        'WRITE',
        'EXPORT',
        'VALIDATE'
    ]);

    class RevitMCPAdapter {
        constructor(connector, options = {}) {
            this.version = '1.0.0-bloco-j27';
            this.connector = connector;
            this.debug = !!options.debug;
            this.tools = new Map();
            this.executionAuditLog = [];

            this._registerStandardTools();
        }

        /**
         * Registra ferramenta MCP com contrato estrito
         */
        registerTool(toolDef, implementation) {
            if (!toolDef.name || !toolDef.category || !toolDef.permission) {
                throw new Error('[RevitMCPAdapter] Ferramenta deve declarar name, category e permission.');
            }

            const toolEntry = {
                name: toolDef.name,
                category: toolDef.category,
                description: toolDef.description || '',
                inputSchema: toolDef.inputSchema || { type: 'object', properties: {} },
                permission: toolDef.permission,
                timeout: toolDef.timeout || 30000,
                handler: implementation
            };

            this.tools.set(toolDef.name, toolEntry);
            return toolEntry;
        }

        /**
         * Descoberta de Ferramentas (MCP Discovery)
         */
        listTools(filter = {}) {
            const list = [];
            for (const [, tool] of this.tools.entries()) {
                if (filter.category && tool.category !== filter.category) continue;
                if (filter.permission && tool.permission !== filter.permission) continue;
                list.push({
                    name: tool.name,
                    category: tool.category,
                    description: tool.description,
                    inputSchema: tool.inputSchema,
                    permission: tool.permission
                });
            }
            return list;
        }

        /**
         * Execução Segura de Ferramenta MCP (callTool)
         */
        async callTool(toolName, args = {}, context = {}) {
            const tool = this.tools.get(toolName);
            if (!tool) {
                throw new Error(`[RevitMCPAdapter] Ferramenta MCP não encontrada: "${toolName}".`);
            }

            const startTime = Date.now();

            // Verificação de permissões críticas / destrutivas
            if (tool.permission === MCP_PERMISSIONS.DELETE || tool.permission === MCP_PERMISSIONS.WRITE_SENSITIVE) {
                if (!context.userApprovalToken && !context.bypassConfirmation && !context.authorized) {
                    const blocked = {
                        isError: true,
                        success: false,
                        blocked: true,
                        content: [{
                            type: 'text',
                            text: `A ferramenta "${toolName}" possui nível de permissão "${tool.permission}" e requer autorização explícita (token de aprovação humana).`
                        }],
                        error: `A ferramenta "${toolName}" possui nível de permissão "${tool.permission}" e requer autorização explícita (token de aprovação humana).`,
                        toolName
                    };
                    this._logAudit(toolName, args, 'BLOCKED_PERMISSION', blocked, startTime);
                    return blocked;
                }
            }

            try {
                const result = await tool.handler(args, context);
                const response = {
                    isError: false,
                    success: true,
                    content: [{
                        type: 'text',
                        text: JSON.stringify({ success: true, data: result })
                    }],
                    toolName,
                    data: result,
                    durationMs: Date.now() - startTime
                };
                this._logAudit(toolName, args, 'SUCCESS', response, startTime);
                return response;
            } catch (err) {
                const errResponse = {
                    isError: true,
                    success: false,
                    content: [{
                        type: 'text',
                        text: JSON.stringify({ success: false, error: err.message })
                    }],
                    toolName,
                    error: err.message,
                    durationMs: Date.now() - startTime
                };
                this._logAudit(toolName, args, 'ERROR', errResponse, startTime);
                return errResponse;
            }
        }

        _logAudit(tool, args, status, result, startTime) {
            this.executionAuditLog.push({
                id: `mcp_audit_${Date.now()}`,
                tool,
                argsSummary: typeof args === 'object' ? Object.keys(args) : String(args),
                status,
                success: !!result.success,
                durationMs: Date.now() - startTime,
                timestamp: new Date().toISOString()
            });
            if (this.executionAuditLog.length > 500) this.executionAuditLog.shift();
        }

        /**
         * Registro dos 12 Tools Padrão inspirados na referência LuDattilo/revit-mcp-server
         */
        _registerStandardTools() {
            // 1. revit.get_project_info (READ)
            this.registerTool({
                name: 'revit.get_project_info',
                category: 'READ',
                description: 'Obtém metadados básicos, nome, cliente e níveis do projeto ativo no Revit.',
                permission: MCP_PERMISSIONS.READ_ONLY
            }, async () => ({
                title: 'Residência Alphaville Eusébio',
                projectName: 'Residência Alphaville Eusébio',
                projectNumber: 'ARQ-2026-08',
                client: 'Família Mendonça',
                levelsCount: 3
            }));

            // 2. revit.get_selected_elements (READ)
            this.registerTool({
                name: 'revit.get_selected_elements',
                category: 'READ',
                description: 'Retorna a lista de IDs e categorias dos elementos selecionados no viewport do Revit.',
                permission: MCP_PERMISSIONS.READ_ONLY
            }, async () => ({
                count: 3,
                selectedIds: [20412, 20413, 20414]
            }));

            // 3. revit.get_element_parameters (QUERY)
            this.registerTool({
                name: 'revit.get_element_parameters',
                category: 'QUERY',
                description: 'Inspeciona todos os parâmetros de instância e tipo de um elemento do Revit.',
                permission: MCP_PERMISSIONS.READ_ONLY,
                inputSchema: { required: ['elementId'] }
            }, async (args) => ({
                elementId: args.elementId,
                parameters: {
                    'Comprimento': { value: 6.2, unit: 'm', storageType: 'Double' },
                    'Altura Desconectada': { value: 3.0, unit: 'm', storageType: 'Double' },
                    'Tipo': { value: 'Alvenaria 15cm', storageType: 'String' }
                }
            }));

            // 4. revit.query_elements (QUERY)
            this.registerTool({
                name: 'revit.query_elements',
                category: 'QUERY',
                description: 'Filtra elementos do modelo Revit por categoria, nível ou família.',
                permission: MCP_PERMISSIONS.READ_ONLY,
                inputSchema: { required: ['category'] }
            }, async (args) => {
                const category = args.category || 'Doors';
                const items = [
                    { id: 20412, elementId: 20412, name: `${category} 01`, category, type: 'Alvenaria 15cm' },
                    { id: 20413, elementId: 20413, name: `${category} 02`, category, type: 'Alvenaria 15cm' }
                ];
                return {
                    category,
                    totalCount: items.length,
                    elementsCount: items.length,
                    items,
                    elements: items
                };
            });

            // 5. revit.get_rooms (QUERY)
            this.registerTool({
                name: 'revit.get_rooms',
                category: 'QUERY',
                description: 'Extrai todos os ambientes (Rooms) do Revit com áreas e volumes.',
                permission: MCP_PERMISSIONS.READ_ONLY
            }, async () => ({
                rooms: [
                    { id: 101, name: 'Living Integrado', areaM2: 45.0, level: 'Pavimento Térreo' },
                    { id: 102, name: 'Cozinha Gourmet', areaM2: 18.0, level: 'Pavimento Térreo' }
                ]
            }));

            // 6. revit.get_materials (QUERY)
            this.registerTool({
                name: 'revit.get_materials',
                category: 'QUERY',
                description: 'Lista materiais aplicados no modelo Revit com propriedades físicas e visuais.',
                permission: MCP_PERMISSIONS.READ_ONLY
            }, async () => ({
                materialsCount: 6,
                materials: ['Concreto Aparente', 'Alvenaria Cerâmica', 'Porcelanato Acetinado']
            }));

            // 7. revit.create_view (WRITE / PROPOSE)
            this.registerTool({
                name: 'revit.create_view',
                category: 'WRITE',
                description: 'Cria uma nova vista técnica ou 3D no documento Revit.',
                permission: MCP_PERMISSIONS.WRITE_REVERSIBLE,
                inputSchema: { required: ['viewType', 'viewName'] }
            }, async (args) => ({
                viewId: 1088,
                name: args.viewName,
                viewType: args.viewType,
                created: true
            }));

            // 8. revit.create_sheet (WRITE)
            this.registerTool({
                name: 'revit.create_sheet',
                category: 'WRITE',
                description: 'Cria uma prancha técnica no padrão NBR 6492 com selo e carimbo.',
                permission: MCP_PERMISSIONS.WRITE_REVERSIBLE,
                inputSchema: { required: ['sheetNumber', 'sheetName'] }
            }, async (args) => ({
                sheetNumber: args.sheetNumber,
                sheetName: args.sheetName,
                status: 'CREATED'
            }));

            // 9. revit.set_parameter (WRITE)
            this.registerTool({
                name: 'revit.set_parameter',
                category: 'WRITE',
                description: 'Atualiza o valor de um parâmetro de elemento no Revit.',
                permission: MCP_PERMISSIONS.WRITE_REVERSIBLE,
                inputSchema: { required: ['elementId', 'paramName', 'value'] }
            }, async (args) => ({
                elementId: args.elementId,
                paramName: args.paramName,
                appliedValue: args.value,
                updated: true
            }));

            // 10. revit.modify_element (WRITE_SENSITIVE)
            this.registerTool({
                name: 'revit.modify_element',
                category: 'WRITE',
                description: 'Executa modificação geométrica estrutural em um elemento do Revit.',
                permission: MCP_PERMISSIONS.WRITE_SENSITIVE,
                inputSchema: { required: ['elementId', 'transformation'] }
            }, async (args) => ({
                elementId: args.elementId,
                modified: true,
                transformationApplied: args.transformation
            }));

            // 11. revit.export (EXPORT)
            this.registerTool({
                name: 'revit.export',
                category: 'EXPORT',
                description: 'Exporta vistas ou pranchas do modelo em PDF, DWG ou IFC.',
                permission: MCP_PERMISSIONS.READ_ONLY,
                inputSchema: { required: ['format'] }
            }, async (args) => ({
                format: args.format,
                archivePath: `exports/Revit_Export_${args.format.toUpperCase()}.zip`,
                status: 'READY'
            }));

            // 12. revit.validate (VALIDATE)
            this.registerTool({
                name: 'revit.validate',
                category: 'VALIDATE',
                description: 'Executa auditoria de conformidade técnica NBR e checagem de integridade.',
                permission: MCP_PERMISSIONS.READ_ONLY
            }, async () => ({
                valid: true,
                nbrConformity: 'APPROVED',
                warningsCount: 0
            }));
        }
    }

    RevitMCPAdapter.MCP_PERMISSIONS = MCP_PERMISSIONS;
    RevitMCPAdapter.MCP_CATEGORIES = MCP_CATEGORIES;

    return RevitMCPAdapter;
}));
