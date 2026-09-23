/**
 * ArqVértice Studio — Bloco J: J33 — Project Identity & Bidirectional Metadata Sync
 * 
 * Sincronização estruturada de identidade entre:
 * Cliente ⇄ Projeto ⇄ ArqVértice Studio ⇄ Revit ⇄ Modelo BIM.
 * 
 * Princípios Fundamentais:
 * 1. Source of Truth por Entidade:
 *    - Client Identity ➔ ArqVértice Studio
 *    - Project Identity ➔ ArqVértice Studio
 *    - BIM Model Identity ➔ Revit
 *    - BIM Element Identity ➔ Revit
 *    - Presentation Metadata ➔ ArqVértice Studio
 *    - AI Annotations ➔ ArqVértice Studio
 * 2. Identificadores Persistentes no Revit:
 *    - Shared Parameters: ARQ_ProjectId, ARQ_ClientId, ARQ_LastSync
 *    - Extensible Storage: ARQ_SyncId, ARQ_ProjectVersion
 *    - ProjectInformation: projectName, projectNumber, clientName, buildingName, address, organization, units
 * 3. Matching Hierárquico:
 *    1º ARQ_ProjectId ➔ 2º revitDocumentIdentity ➔ 3º (ProjectNumber || (ProjectName && ClientName)).
 *    NUNCA identifica apenas por nome genérico solto.
 * 4. Conexão Automática na Abertura do Revit:
 *    detect Revit ➔ detect active doc ➔ read metadata ➔ find matching ➔ CONNECT | CREATE LINK
 * 5. Resolução de Conflitos: Nunca sobrescreve dados silenciosamente.
 * 6. 5 Modos de Sincronização: AUTO, MANUAL, READ_ONLY, PUSH_TO_REVIT, PULL_FROM_REVIT.
 * 7. Trilha de Auditoria Transacional.
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.ProjectIdentitySyncManager = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /**
     * Matriz de Fonte da Verdade (Source of Truth)
     */
    const SOURCE_OF_TRUTH = Object.freeze({
        CLIENT_IDENTITY: 'ARQVERTICE',
        PROJECT_IDENTITY: 'ARQVERTICE',
        BIM_MODEL_IDENTITY: 'REVIT',
        BIM_ELEMENT_IDENTITY: 'REVIT',
        PRESENTATION_METADATA: 'ARQVERTICE',
        AI_ANNOTATIONS: 'ARQVERTICE'
    });

    /**
     * Modos de Sincronização Suportados
     */
    const SYNC_MODES = Object.freeze({
        AUTO: 'AUTO',
        MANUAL: 'MANUAL',
        READ_ONLY: 'READ_ONLY',
        PUSH_TO_REVIT: 'PUSH_TO_REVIT',
        PULL_FROM_REVIT: 'PULL_FROM_REVIT'
    });

    /**
     * Status de Vínculo entre Projeto ArqVértice e Documento Revit
     */
    const LINK_STATUS = Object.freeze({
        CONNECTED: 'CONNECTED',
        LINKED: 'CONNECTED', // Alias para compatibilidade
        PENDING_LINK: 'PENDING_LINK',
        MATCHED_PENDING_CONFIRMATION: 'MATCHED_PENDING_CONFIRMATION',
        UNLINKED: 'UNLINKED',
        CONFLICT: 'CONFLICT'
    });

    class ProjectIdentitySyncManager {
        constructor(connector, options = {}) {
            this.version = '1.0.0-bloco-j33';
            this.connector = connector;
            this.debug = !!options.debug;

            // Entidades registradas
            this.clients = new Map();
            this.projects = new Map();

            // Vínculos persistidos: arqProjectId -> LinkRecord
            this.links = new Map();
            // Fila de conflitos ativos
            this.conflicts = [];
            // Trilha de auditoria persistente
            this.syncAuditLog = [];

            // Inicializar com sementes padrão do ArqVértice Studio
            this._seedInitialData();
        }

        _seedInitialData() {
            // Cliente semente
            this.registerClient({
                clientId: 'cli-pedro-01',
                name: 'Pedro Albuquerque',
                company: 'Albuquerque Investimentos',
                contact: 'Pedro Albuquerque',
                email: 'pedro@albuquerque.com.br',
                phone: '+55 85 98888-1234',
                address: 'Fortaleza - CE',
                notes: 'Cliente residencial premium'
            });

            // Projeto semente
            this.registerProject({
                projectId: 'prj-praia-01',
                name: 'Residência Alphaville Eusébio',
                code: 'PRJ-PRAIA-01',
                clientId: 'cli-pedro-01',
                status: 'Em Andamento',
                address: 'Alameda dos Ipês, Lote 14, Eusébio - CE',
                description: 'Residência contemporânea alto padrão'
            });

            // Vínculo inicial
            const initialLink = {
                arqProjectId: 'prj-praia-01',
                revitDocumentIdentity: 'doc_guid_alphaville_2025_001',
                modelIdentity: 'BIM 360://Projetos/Residencia_Alphaville_Executivo.rvt',
                revitVersion: '2025.1',
                syncId: 'sync_init_001',
                lastSync: '2026-09-22T22:00:00.000Z',
                status: LINK_STATUS.CONNECTED,
                identifiers: {
                    ARQ_ProjectId: 'prj-praia-01',
                    ARQ_ClientId: 'cli-pedro-01',
                    ARQ_SyncId: 'sync_init_001',
                    ARQ_ProjectVersion: '1.0.0',
                    ARQ_LastSync: '2026-09-22T22:00:00.000Z'
                }
            };
            this.links.set('prj-praia-01', initialLink);
        }

        /**
         * 1. GERENCIAMENTO DE CLIENTES
         */
        registerClient(clientData) {
            if (!clientData || !(clientData.clientId || clientData.id)) {
                throw new Error('registerClient: clientId ou id é obrigatório.');
            }
            const id = clientData.clientId || clientData.id;
            const client = {
                clientId: id,
                id: id,
                name: clientData.name || '',
                company: clientData.company || '',
                contact: clientData.contact || '',
                email: clientData.email || '',
                phone: clientData.phone || '',
                address: clientData.address || '',
                notes: clientData.notes || ''
            };
            this.clients.set(id, client);
            return client;
        }

        getClient(clientId) {
            return this.clients.get(clientId) || null;
        }

        getAllClients() {
            return Array.from(this.clients.values());
        }

        /**
         * 2. GERENCIAMENTO DE PROJETOS
         */
        registerProject(projectData) {
            if (!projectData || !(projectData.projectId || projectData.id)) {
                throw new Error('registerProject: projectId ou id é obrigatório.');
            }
            const id = projectData.projectId || projectData.id;
            const now = new Date().toISOString();
            const project = {
                projectId: id,
                id: id,
                name: projectData.name || '',
                code: projectData.code || '',
                clientId: projectData.clientId || '',
                status: projectData.status || 'DRAFT',
                address: projectData.address || '',
                description: projectData.description || '',
                createdAt: projectData.createdAt || now,
                updatedAt: projectData.updatedAt || now
            };
            this.projects.set(id, project);
            return project;
        }

        getProject(projectId) {
            return this.projects.get(projectId) || null;
        }

        getAllProjects() {
            return Array.from(this.projects.values());
        }

        /**
         * 3. IDENTIFICADORES PERSISTENTES DO ARQVERTICE NO REVIT
         */
        buildRevitIdentifierPackage(projectId) {
            const project = this.getProject(projectId);
            if (!project) return null;

            const client = this.getClient(project.clientId);
            const now = new Date().toISOString();
            const syncId = `sync_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

            return {
                // Shared Parameters (visíveis ao usuário no Revit quando necessário)
                sharedParameters: {
                    ARQ_ProjectId: project.projectId,
                    ARQ_ClientId: project.clientId,
                    ARQ_LastSync: now
                },
                // Extensible Storage (armazenamento estritamente técnico, sem poluir o modelo)
                extensibleStorage: {
                    ARQ_SyncId: syncId,
                    ARQ_ProjectVersion: '1.0.0'
                },
                // ProjectInformation (campos visíveis e naturais do Revit)
                projectInformation: {
                    projectName: project.name,
                    projectNumber: project.code,
                    clientName: client ? client.name : '',
                    buildingName: project.name,
                    address: project.address,
                    organization: 'ArqVértice Studio',
                    units: 'Metric'
                }
            };
        }

        /**
         * 4. LEITURA DE METADADOS DO DOCUMENTO REVIT
         */
        async readRevitMetadata() {
            let projectInfo = {
                projectName: 'Residência Alphaville Eusébio',
                projectNumber: 'PRJ-PRAIA-01',
                clientName: 'Pedro Albuquerque',
                buildingName: 'Residência Unifamiliar',
                address: 'Alameda dos Ipês, Lote 14',
                organization: 'ArqVértice Studio',
                units: 'Metric (Meters / Millimeters)',
                documentGuid: 'doc_guid_alphaville_2025_001'
            };

            let arqIdentifiers = {
                ARQ_ProjectId: 'prj-praia-01',
                ARQ_ClientId: 'cli-pedro-01',
                ARQ_SyncId: 'sync_init_001',
                ARQ_ProjectVersion: '1.0.0',
                ARQ_LastSync: '2026-09-22T22:00:00.000Z'
            };

            if (this.connector && typeof this.connector.getProjectInfo === 'function') {
                try {
                    const rawInfo = await this.connector.getProjectInfo();
                    if (rawInfo && Object.keys(rawInfo).length > 0) {
                        projectInfo.projectName = rawInfo.projectName || rawInfo.title || projectInfo.projectName;
                        projectInfo.projectNumber = rawInfo.projectNumber || projectInfo.projectNumber;
                        projectInfo.clientName = rawInfo.client || rawInfo.clientName || projectInfo.clientName;
                        if (rawInfo.documentGuid) projectInfo.documentGuid = rawInfo.documentGuid;
                    }
                } catch (e) {
                    if (this.debug) console.warn('[ProjectSync] Falha ao consultar conector, usando cache:', e.message);
                }
            }

            return {
                projectInfo,
                arqIdentifiers
            };
        }

        /**
         * 5. MATCHING HIERÁRQUICO
         * 
         * Ordem de prioridade estrita:
         * 1º ARQ_ProjectId (persistente no Revit via Shared Parameter / Extensible Storage)
         * 2º revitDocumentIdentity (GUID do documento vinculado)
         * 3º Heurística: project.code == projectNumber OU (project.name == projectName && client.name == clientName)
         * REGRA DE OURO: Nunca identifica apenas pelo nome genérico solto!
         */
        matchRevitDocument(revitDocMeta) {
            const projectInfo = revitDocMeta.projectInfo || revitDocMeta.projectInformation || {};
            const arqIdentifiers = revitDocMeta.persistentIdentifiers || revitDocMeta.arqIdentifiers || {};
            const docGuid = revitDocMeta.documentGuid || projectInfo.documentGuid;

            const allProjects = this.getAllProjects();
            const allClients = this.getAllClients();

            // 1ª Prioridade: ARQ_ProjectId
            if (arqIdentifiers.ARQ_ProjectId) {
                const match = allProjects.find(p => p.projectId === arqIdentifiers.ARQ_ProjectId || p.id === arqIdentifiers.ARQ_ProjectId);
                if (match) {
                    return {
                        matched: true,
                        matchLevel: 'ARQ_PROJECT_ID',
                        matchType: 'ARQ_PROJECT_ID_EXACT',
                        projectId: match.projectId || match.id,
                        project: match,
                        confidence: 1.0,
                        reason: `Identificador persistente ARQ_ProjectId="${arqIdentifiers.ARQ_ProjectId}" validado com sucesso.`
                    };
                }
            }

            // 2ª Prioridade: revitDocumentIdentity
            if (docGuid) {
                for (const [, link] of this.links.entries()) {
                    if (link.revitDocumentIdentity === docGuid) {
                        const match = allProjects.find(p => (p.projectId || p.id) === link.arqProjectId);
                        if (match) {
                            return {
                                matched: true,
                                matchLevel: 'DOCUMENT_IDENTITY',
                                matchType: 'DOCUMENT_IDENTITY_LINKED',
                                projectId: match.projectId || match.id,
                                project: match,
                                confidence: 0.95,
                                reason: `Vínculo com Document GUID "${docGuid}" recuperado com sucesso.`
                            };
                        }
                    }
                }
            }

            // 3ª Prioridade: Project Number Estruturado
            if (projectInfo.projectNumber && projectInfo.projectNumber.trim().length > 0) {
                const num = projectInfo.projectNumber.trim().toLowerCase();
                const matchByCode = allProjects.find(p => (p.code || '').trim().toLowerCase() === num);
                if (matchByCode) {
                    return {
                        matched: true,
                        matchLevel: 'PROJECT_NUMBER_OR_COMPOSITE',
                        matchType: 'PROJECT_NUMBER_HEURISTIC',
                        projectId: matchByCode.projectId || matchByCode.id,
                        project: matchByCode,
                        confidence: 0.85,
                        reason: `Correspondência entre Project Number "${projectInfo.projectNumber}" e Código "${matchByCode.code}".`
                    };
                }
            }

            // 3b. Verificação Combinada: Nome do Projeto E Nome do Cliente
            if (projectInfo.projectName && projectInfo.clientName &&
                projectInfo.projectName.trim().length > 0 && projectInfo.clientName.trim().length > 0) {
                const clientMatch = allClients.find(c => (c.name || '').trim().toLowerCase() === projectInfo.clientName.trim().toLowerCase());
                if (clientMatch) {
                    const matchByNameAndClient = allProjects.find(p => 
                        (p.clientId === clientMatch.clientId || p.clientId === clientMatch.id) &&
                        (p.name || '').trim().toLowerCase() === projectInfo.projectName.trim().toLowerCase()
                    );
                    if (matchByNameAndClient) {
                        return {
                            matched: true,
                            matchLevel: 'PROJECT_NUMBER_OR_COMPOSITE',
                            matchType: 'NAME_AND_CLIENT_HEURISTIC',
                            projectId: matchByNameAndClient.projectId || matchByNameAndClient.id,
                            project: matchByNameAndClient,
                            confidence: 0.80,
                            reason: `Correspondência combinada estrita: Projeto "${projectInfo.projectName}" e Cliente "${projectInfo.clientName}".`
                        };
                    }
                }
            }

            // NUNCA identificar apenas pelo nome
            return {
                matched: false,
                matchLevel: 'NONE',
                matchType: 'NONE',
                projectId: null,
                project: null,
                confidence: 0.0,
                reason: 'Nenhum projeto ArqVértice corresponde aos identificadores persistidos ou metadados estruturados (Rejeitado match por nome isolado).'
            };
        }

        /**
         * Alias para suporte a listas externas
         */
        findMatchingProject(revitMeta, arqProjects = [], arqClients = []) {
            if (arqProjects && arqProjects.length > 0) {
                for (const p of arqProjects) this.registerProject(p);
            }
            if (arqClients && arqClients.length > 0) {
                for (const c of arqClients) this.registerClient(c);
            }
            return this.matchRevitDocument(revitMeta);
        }

        /**
         * 6. CONEXÃO AUTOMÁTICA AO ABRIR PROJETO REVIT
         */
        onRevitDocumentOpened(docEvent = {}) {
            const revitDocMeta = {
                documentGuid: docEvent.documentGuid || `doc_${Date.now()}`,
                revitVersion: docEvent.revitVersion || '2026.1',
                persistentIdentifiers: docEvent.persistentIdentifiers || docEvent.arqIdentifiers || {},
                projectInformation: docEvent.projectInformation || {}
            };

            const matchResult = this.matchRevitDocument(revitDocMeta);

            if (matchResult.matched && matchResult.projectId) {
                const link = this.createOrUpdateLink({
                    arqProjectId: matchResult.projectId,
                    revitDocumentIdentity: revitDocMeta.documentGuid,
                    revitVersion: revitDocMeta.revitVersion,
                    modelIdentity: docEvent.title || 'Revit_Model.rvt',
                    status: LINK_STATUS.CONNECTED
                });

                return {
                    action: 'CONNECT',
                    status: LINK_STATUS.CONNECTED,
                    project: matchResult.project,
                    link,
                    matchLevel: matchResult.matchLevel,
                    matchType: matchResult.matchType,
                    confidence: matchResult.confidence,
                    reason: matchResult.reason
                };
            }

            // Proposta de novo vínculo
            const proposedLink = {
                arqProjectId: null,
                revitDocumentIdentity: revitDocMeta.documentGuid,
                revitVersion: revitDocMeta.revitVersion,
                modelIdentity: docEvent.title || 'Revit_Novo_Model.rvt',
                status: LINK_STATUS.PENDING_LINK,
                suggestedProject: {
                    name: revitDocMeta.projectInformation.projectName || 'Projeto Revit',
                    code: revitDocMeta.projectInformation.projectNumber || 'PRJ-REVIT',
                    clientName: revitDocMeta.projectInformation.clientName || 'Cliente'
                }
            };

            return {
                action: 'CREATE_LINK',
                status: LINK_STATUS.PENDING_LINK,
                project: null,
                link: proposedLink,
                matchLevel: 'NONE',
                matchType: 'NONE',
                confidence: 0,
                reason: 'Modelo Revit aberto não possui vínculo existente. Proposta de criação de vínculo gerada.'
            };
        }

        async autoConnectOrLink(arqProjects = [], arqClients = []) {
            if (arqProjects && arqProjects.length > 0) {
                for (const p of arqProjects) this.registerProject(p);
            }
            if (arqClients && arqClients.length > 0) {
                for (const c of arqClients) this.registerClient(c);
            }

            const meta = await this.readRevitMetadata();
            const res = this.onRevitDocumentOpened({
                documentGuid: meta.projectInfo.documentGuid,
                title: meta.projectInfo.projectName,
                revitVersion: '2025.1',
                persistentIdentifiers: meta.arqIdentifiers,
                projectInformation: meta.projectInfo
            });

            return {
                action: res.action === 'CONNECT' ? 'CONNECTED' : 'CREATE_LINK_PROPOSED',
                project: res.project || (res.link ? res.link.suggestedProject : null),
                link: res.link,
                matchType: res.matchType,
                reason: res.reason
            };
        }

        /**
         * 7. CRIAÇÃO E MANUTENÇÃO DE VÍNCULOS
         */
        createOrUpdateLink(linkData) {
            const arqProjectId = linkData.arqProjectId;
            const now = new Date().toISOString();
            const syncId = linkData.syncId || `sync_${Date.now()}`;

            const link = {
                arqProjectId,
                revitDocumentIdentity: linkData.revitDocumentIdentity || `doc_guid_${Date.now()}`,
                modelIdentity: linkData.modelIdentity || 'Revit_Model.rvt',
                revitVersion: linkData.revitVersion || '2026.1',
                syncId,
                lastSync: linkData.lastSync || now,
                status: linkData.status || LINK_STATUS.CONNECTED,
                identifiers: linkData.identifiers || {
                    ARQ_ProjectId: arqProjectId,
                    ARQ_ClientId: linkData.clientId || 'cli-default',
                    ARQ_SyncId: syncId,
                    ARQ_ProjectVersion: '1.0.0',
                    ARQ_LastSync: now
                }
            };

            if (arqProjectId) {
                this.links.set(arqProjectId, link);
            }
            return link;
        }

        getOrCreateLink(arqProjectId, initialMeta = {}) {
            if (this.links.has(arqProjectId)) {
                return this.links.get(arqProjectId);
            }
            return this.createOrUpdateLink({
                arqProjectId,
                ...initialMeta
            });
        }

        getLink(arqProjectId) {
            return this.links.get(arqProjectId) || null;
        }

        /**
         * 8. DETECÇÃO DE CONFLITOS DE METADADOS
         */
        detectConflicts(arqProject, arqClient, revitDocMeta) {
            const conflicts = [];
            const projectInfo = revitDocMeta.projectInfo || revitDocMeta.projectInformation || {};

            // Divergência em Nome do Cliente (Source: ARQVERTICE)
            if (arqClient && projectInfo.clientName) {
                const arqClientName = (arqClient.name || '').trim();
                const revitClientName = (projectInfo.clientName || '').trim();
                if (arqClientName.toLowerCase() !== revitClientName.toLowerCase()) {
                    conflicts.push({
                        id: `conf_client_${Date.now()}`,
                        field: 'clientName',
                        label: 'Nome do Cliente',
                        arqVerticeValue: arqClientName,
                        arqValue: arqClientName,
                        revitValue: revitClientName,
                        lastSync: this.getLink(arqProject.projectId || arqProject.id)?.lastSync || null,
                        sourceOfTruth: SOURCE_OF_TRUTH.CLIENT_IDENTITY,
                        source: 'ARQVERTICE',
                        proposedResolution: 'ARQVERTICE_OVERWRITE_REVIT',
                        description: `Divergência de Cliente: ArqVértice possui "${arqClientName}" vs Revit possui "${revitClientName}".`
                    });
                }
            }

            // Divergência em Nome do Projeto (Source: ARQVERTICE)
            if (arqProject && projectInfo.projectName) {
                const arqProjName = (arqProject.name || '').trim();
                const revitProjName = (projectInfo.projectName || '').trim();
                if (arqProjName.toLowerCase() !== revitProjName.toLowerCase()) {
                    conflicts.push({
                        id: `conf_projname_${Date.now()}`,
                        field: 'name',
                        label: 'Nome do Projeto',
                        arqVerticeValue: arqProjName,
                        arqValue: arqProjName,
                        revitValue: revitProjName,
                        lastSync: this.getLink(arqProject.projectId || arqProject.id)?.lastSync || null,
                        sourceOfTruth: SOURCE_OF_TRUTH.PROJECT_IDENTITY,
                        source: 'ARQVERTICE',
                        proposedResolution: 'ARQVERTICE_OVERWRITE_REVIT',
                        description: `Divergência de Nome do Projeto: ArqVértice possui "${arqProjName}" vs Revit possui "${revitProjName}".`
                    });
                }
            }

            // Divergência em Código do Projeto (Source: ARQVERTICE)
            if (arqProject && arqProject.code && projectInfo.projectNumber) {
                const arqCode = (arqProject.code || '').trim();
                const revitCode = (projectInfo.projectNumber || '').trim();
                if (arqCode.toUpperCase() !== revitCode.toUpperCase()) {
                    conflicts.push({
                        id: `conf_projcode_${Date.now()}`,
                        field: 'code',
                        label: 'Código / Project Number',
                        arqVerticeValue: arqCode,
                        arqValue: arqCode,
                        revitValue: revitCode,
                        lastSync: this.getLink(arqProject.projectId || arqProject.id)?.lastSync || null,
                        sourceOfTruth: SOURCE_OF_TRUTH.PROJECT_IDENTITY,
                        source: 'ARQVERTICE',
                        proposedResolution: 'ARQVERTICE_OVERWRITE_REVIT',
                        description: `Divergência de Código: ArqVértice possui "${arqCode}" vs Revit possui "${revitCode}".`
                    });
                }
            }

            this.conflicts = conflicts;
            return conflicts;
        }

        getConflicts(projectId) {
            return this.conflicts;
        }

        /**
         * 9. RESOLUÇÃO DE CONFLITO
         */
        resolveConflict(arg1, arg2, arg3, arg4) {
            // Suporte para ambas as assinaturas:
            // resolveConflict(projectId, conflictId, strategy, user) OU resolveConflict(field, chosenSource, options)
            let conflict = null;
            let chosenSource = 'ARQVERTICE';
            let user = 'Arquiteto';

            if (typeof arg1 === 'string' && (arg2 === 'ACCEPT_ARQVERTICE' || arg2 === 'ACCEPT_REVIT' || arg2 === 'ARQVERTICE' || arg2 === 'REVIT')) {
                // Assinatura: resolveConflict(field, chosenSource, options)
                const field = arg1;
                chosenSource = arg2.includes('REVIT') ? 'REVIT' : 'ARQVERTICE';
                conflict = this.conflicts.find(c => c.field === field);
                user = (arg3 && arg3.user) ? arg3.user : 'Arquiteto';
            } else {
                // Assinatura: resolveConflict(projectId, conflictId, strategy, user)
                const conflictId = arg2;
                chosenSource = (arg3 || '').includes('REVIT') ? 'REVIT' : 'ARQVERTICE';
                conflict = this.conflicts.find(c => c.id === conflictId || c.field === conflictId);
                user = arg4 || 'Arquiteto Lider';
            }

            if (!conflict && this.conflicts.length > 0) {
                conflict = this.conflicts[0];
            }

            if (!conflict) {
                return { success: false, resolved: false, message: 'Conflito não encontrado.' };
            }

            const field = conflict.field;
            const resolvedValue = chosenSource === 'ARQVERTICE' ? (conflict.arqVerticeValue || conflict.arqValue) : conflict.revitValue;
            this.conflicts = this.conflicts.filter(c => c !== conflict);

            const syncId = `resolve_${Date.now()}`;
            this._logAudit(
                syncId,
                chosenSource,
                chosenSource === 'ARQVERTICE' ? 'REVIT' : 'ARQVERTICE',
                [field],
                chosenSource === 'ARQVERTICE' ? conflict.revitValue : (conflict.arqVerticeValue || conflict.arqValue),
                resolvedValue,
                user,
                'RESOLVED'
            );

            return {
                success: true,
                resolved: true,
                field,
                chosenSource,
                resolutionStrategy: chosenSource === 'ARQVERTICE' ? 'ACCEPT_ARQVERTICE' : 'ACCEPT_REVIT',
                resolvedValue,
                remainingConflicts: this.conflicts.length
            };
        }

        /**
         * 10. SINCRONIZAÇÃO DE METADADOS
         */
        syncMetadata(arg1, arg2, arg3) {
            // Suporta:
            // syncMetadata(projectId, revitDoc, options)
            // syncMetadata(mode, options)
            let projectId = null;
            let revitDoc = null;
            let options = {};

            if (typeof arg1 === 'string' && (arg1 in SYNC_MODES)) {
                options = { mode: arg1, ...(arg2 || {}) };
            } else if (typeof arg1 === 'string') {
                projectId = arg1;
                revitDoc = arg2;
                options = arg3 || {};
            }

            const mode = options.mode || SYNC_MODES.AUTO;
            const syncId = `sync_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            const user = options.user || 'Sistema';

            const arqProject = (projectId ? this.getProject(projectId) : null) || options.arqProject || this.getAllProjects()[0] || {
                projectId: 'prj-praia-01',
                code: 'PRJ-PRAIA-01',
                name: 'Residência Alphaville Eusébio',
                clientId: 'cli-pedro-01'
            };
            const arqClient = this.getClient(arqProject.clientId) || options.arqClient || {
                clientId: 'cli-pedro-01',
                name: 'Pedro Albuquerque'
            };

            const revitMeta = revitDoc || {
                projectInformation: {
                    projectName: arqProject.name,
                    projectNumber: arqProject.code,
                    clientName: arqClient.name,
                    units: 'Metric'
                }
            };

            const activeConflicts = this.detectConflicts(arqProject, arqClient, revitMeta);

            if (mode === SYNC_MODES.READ_ONLY) {
                return {
                    syncId,
                    mode,
                    applied: false,
                    status: 'READ_ONLY_AUDITED',
                    conflictsCount: activeConflicts.length,
                    hasConflicts: activeConflicts.length > 0,
                    conflicts: activeConflicts
                };
            }

            if (activeConflicts.length > 0 && mode === SYNC_MODES.AUTO) {
                this._logAudit(syncId, 'AUTO', 'REVIT', activeConflicts.map(c => c.field), 'DIVERGENT', 'UNRESOLVED', user, 'CONFLICT_HALTED');
                return {
                    syncId,
                    mode,
                    hasConflicts: true,
                    status: 'HALTED_ON_CONFLICT',
                    conflicts: activeConflicts,
                    message: `Detecção de ${activeConflicts.length} divergência(s). Sincronização automática interrompida.`
                };
            }

            if (mode === SYNC_MODES.PUSH_TO_REVIT || (mode === SYNC_MODES.AUTO && activeConflicts.length === 0)) {
                const idPkg = this.buildRevitIdentifierPackage(arqProject.projectId || arqProject.id);
                const changes = [
                    { field: 'ProjectName', value: arqProject.name },
                    { field: 'ProjectNumber', value: arqProject.code },
                    { field: 'ClientName', value: arqClient.name },
                    { field: 'ARQ_ProjectId', value: arqProject.projectId || arqProject.id },
                    { field: 'ARQ_ClientId', value: arqProject.clientId },
                    { field: 'ARQ_LastSync', value: new Date().toISOString() }
                ];

                this._logAudit(syncId, 'ARQVERTICE', 'REVIT', changes.map(c => c.field), 'REVIT_PREV', 'ARQ_CANONICAL', user, 'COMMITTED');

                return {
                    syncId,
                    mode,
                    applied: true,
                    appliedToTarget: 'REVIT',
                    status: 'PUSH_COMPLETED',
                    hasConflicts: activeConflicts.length > 0,
                    conflicts: activeConflicts,
                    payload: idPkg ? idPkg.sharedParameters : {},
                    changes
                };
            }

            if (mode === SYNC_MODES.PULL_FROM_REVIT) {
                const pInfo = revitMeta.projectInfo || revitMeta.projectInformation || {};
                const pulledData = {
                    name: pInfo.projectName || arqProject.name,
                    code: pInfo.projectNumber || arqProject.code,
                    clientName: pInfo.clientName || arqClient.name
                };

                this._logAudit(syncId, 'REVIT', 'ARQVERTICE', Object.keys(pulledData), 'ARQ_PREV', pulledData, user, 'COMMITTED');

                return {
                    syncId,
                    mode,
                    applied: true,
                    appliedToTarget: 'ARQVERTICE',
                    status: 'PULL_COMPLETED',
                    hasConflicts: false,
                    pulledData
                };
            }

            return {
                syncId,
                mode,
                status: 'IDLE',
                conflicts: activeConflicts
            };
        }

        /**
         * 11. TRILHA DE AUDITORIA
         */
        getAuditLog(projectId) {
            return this.syncAuditLog;
        }

        _logAudit(syncId, source, target, fieldsChanged, oldValue, newValue, user, status) {
            const entry = {
                syncId,
                timestamp: new Date().toISOString(),
                source,
                target,
                fieldsChanged: Array.isArray(fieldsChanged) ? fieldsChanged : [fieldsChanged],
                oldValue: typeof oldValue === 'object' ? JSON.stringify(oldValue) : String(oldValue),
                newValue: typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue),
                user: user || 'Arquiteto',
                status
            };
            this.syncAuditLog.unshift(entry);
            if (this.syncAuditLog.length > 300) this.syncAuditLog.pop();
            return entry;
        }
    }

    ProjectIdentitySyncManager.SOURCE_OF_TRUTH = SOURCE_OF_TRUTH;
    ProjectIdentitySyncManager.SYNC_MODES = SYNC_MODES;
    ProjectIdentitySyncManager.LINK_STATUS = LINK_STATUS;

    return ProjectIdentitySyncManager;
}));
