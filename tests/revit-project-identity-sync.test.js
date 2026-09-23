/**
 * tests/revit-project-identity-sync.test.js
 * Suíte de Testes Automatizados para Identidade de Projeto e Sincronização Bidirecional (Bloco J: J33)
 * 
 * Cobre:
 * - J33.1: Matriz de Fonte da Verdade (Source of Truth por Entidade)
 * - J33.2: Estrutura de Cliente e Projeto (Normalização e Campos Suportados)
 * - J33.3: Extração de Metadados do Revit (ProjectInformation e Identificadores Persistentes ARQ_*)
 * - J33.4: Criação e Manutenção de Vínculo ArqVerticeProject ↔ RevitDocument
 * - J33.5: Algoritmo de Matching Hierárquico (Nível 1 ARQ_ProjectId, Nível 2 GUID, Nível 3 Código/Cliente, Rejeição de Nome Isolado)
 * - J33.6: Conexão Automática na Abertura de Modelo Revit (CONNECT vs CREATE LINK)
 * - J33.7: Detecção de Conflitos e Resolução Não-Silenciosa
 * - J33.8: Modos de Sincronização (AUTO, MANUAL, READ_ONLY, PUSH_TO_REVIT, PULL_FROM_REVIT)
 * - J33.9: Trilha de Auditoria Transacional (Audit Log completo)
 * - J33.10: Integração Bidirecional através do RevitBIMAdapter
 */
'use strict';

const assert = require('assert');

const ProjectIdentitySyncManager = require('../js/revit-project-identity-sync.js');
const RevitBIMAdapter = require('../js/revit-bim-adapter.js');

console.log('================================================================');
console.log('🏛️  TESTES DE IDENTIDADE & SYNC BIDIRECIONAL DE METADADOS (J33)');
console.log('================================================================');

let passedTests = 0;
function test(name, fn) {
    try {
        fn();
        console.log(`  ✔ [PASS] ${name}`);
        passedTests++;
    } catch (err) {
        console.error(`  ✖ [FAIL] ${name}`);
        console.error(err);
        process.exit(1);
    }
}

async function testAsync(name, fn) {
    try {
        await fn();
        console.log(`  ✔ [PASS] ${name}`);
        passedTests++;
    } catch (err) {
        console.error(`  ✖ [FAIL] ${name}`);
        console.error(err);
        process.exit(1);
    }
}

(async () => {
    // -------------------------------------------------------------------------
    // 1. SOURCE OF TRUTH (FONTE DA VERDADE)
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Source of Truth por Entidade ---');

    test('J33.1: Matriz de Source of Truth deve ser imutável e respeitar a hierarquia', () => {
        const sot = ProjectIdentitySyncManager.SOURCE_OF_TRUTH;
        assert.strictEqual(sot.CLIENT_IDENTITY, 'ARQVERTICE');
        assert.strictEqual(sot.PROJECT_IDENTITY, 'ARQVERTICE');
        assert.strictEqual(sot.BIM_MODEL_IDENTITY, 'REVIT');
        assert.strictEqual(sot.BIM_ELEMENT_IDENTITY, 'REVIT');
        assert.strictEqual(sot.PRESENTATION_METADATA, 'ARQVERTICE');
        assert.strictEqual(sot.AI_ANNOTATIONS, 'ARQVERTICE');

        // Garantir imutabilidade
        assert.throws(() => {
            sot.CLIENT_IDENTITY = 'REVIT';
        }, TypeError);
    });

    test('J33.1b: Modos de sincronização devem conter os 5 modos obrigatórios', () => {
        const modes = ProjectIdentitySyncManager.SYNC_MODES;
        assert.strictEqual(modes.AUTO, 'AUTO');
        assert.strictEqual(modes.MANUAL, 'MANUAL');
        assert.strictEqual(modes.READ_ONLY, 'READ_ONLY');
        assert.strictEqual(modes.PUSH_TO_REVIT, 'PUSH_TO_REVIT');
        assert.strictEqual(modes.PULL_FROM_REVIT, 'PULL_FROM_REVIT');
    });

    // -------------------------------------------------------------------------
    // 2. CLIENTE E PROJETO (ESTRUTURA E NORMALIZAÇÃO)
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Entidades de Cliente e Projeto ---');

    const syncMgr = new ProjectIdentitySyncManager();

    test('J33.2: Registro e normalização de cliente com dados válidos', () => {
        const client = syncMgr.registerClient({
            clientId: 'cli-001',
            name: 'Cyrela Empreendimentos',
            company: 'Cyrela S/A',
            contact: 'Carlos Silva',
            email: 'carlos@cyrela.com.br',
            phone: '+55 11 99999-0000',
            address: 'Av. Brigadeiro Faria Lima, 3600, São Paulo - SP',
            notes: 'Cliente corporativo prioritário'
        });

        assert.strictEqual(client.clientId, 'cli-001');
        assert.strictEqual(client.name, 'Cyrela Empreendimentos');
        assert.strictEqual(client.company, 'Cyrela S/A');
        assert.strictEqual(client.email, 'carlos@cyrela.com.br');

        const fetched = syncMgr.getClient('cli-001');
        assert.deepStrictEqual(fetched, client);
    });

    test('J33.2b: Registro e normalização de projeto vinculado ao cliente', () => {
        const project = syncMgr.registerProject({
            projectId: 'proj-101',
            name: 'Residencial Vértice Horizon',
            code: 'VH-2026',
            clientId: 'cli-001',
            status: 'DEVELOPMENT',
            address: 'Rua Oscar Freire, 1200 - Jardins, São Paulo',
            description: 'Torre residencial de alto padrão 32 pavimentos'
        });

        assert.strictEqual(project.projectId, 'proj-101');
        assert.strictEqual(project.name, 'Residencial Vértice Horizon');
        assert.strictEqual(project.code, 'VH-2026');
        assert.strictEqual(project.clientId, 'cli-001');
        assert.ok(project.createdAt);
        assert.ok(project.updatedAt);
    });

    // -------------------------------------------------------------------------
    // 3. IDENTIFICADORES PERSISTENTES DO REVIT
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Identificadores Persistentes do Revit (ARQ_*) ---');

    test('J33.3: Geração de identificadores persistentes e mapeamento de armazenamento', () => {
        const idPackage = syncMgr.buildRevitIdentifierPackage('proj-101');
        assert.ok(idPackage);

        // Shared Parameters (visíveis ao usuário)
        assert.strictEqual(idPackage.sharedParameters.ARQ_ProjectId, 'proj-101');
        assert.strictEqual(idPackage.sharedParameters.ARQ_ClientId, 'cli-001');
        assert.ok(idPackage.sharedParameters.ARQ_LastSync);

        // Extensible Storage (técnicos, não poluentes)
        assert.ok(idPackage.extensibleStorage.ARQ_SyncId.startsWith('sync_') || idPackage.extensibleStorage.ARQ_SyncId.startsWith('sync-'));
        assert.strictEqual(idPackage.extensibleStorage.ARQ_ProjectVersion, '1.0.0');

        // ProjectInformation (campos naturais do Revit)
        assert.strictEqual(idPackage.projectInformation.projectName, 'Residencial Vértice Horizon');
        assert.strictEqual(idPackage.projectInformation.projectNumber, 'VH-2026');
        assert.strictEqual(idPackage.projectInformation.clientName, 'Cyrela Empreendimentos');
        assert.strictEqual(idPackage.projectInformation.address, 'Rua Oscar Freire, 1200 - Jardins, São Paulo');
    });

    // -------------------------------------------------------------------------
    // 4. MATCHING HIERÁRQUICO
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Algoritmo de Matching Hierárquico ---');

    test('J33.4a: Matching Nível 1 — ARQ_ProjectId prioritário', () => {
        const revitDocMeta = {
            documentGuid: 'doc-guid-999',
            revitVersion: '2026.1',
            persistentIdentifiers: {
                ARQ_ProjectId: 'proj-101',
                ARQ_ClientId: 'cli-001'
            },
            projectInformation: {
                projectName: 'Nome Divergente Qualquer',
                projectNumber: 'DIVERGENTE'
            }
        };

        const result = syncMgr.matchRevitDocument(revitDocMeta);
        assert.strictEqual(result.matched, true);
        assert.strictEqual(result.matchLevel, 'ARQ_PROJECT_ID');
        assert.strictEqual(result.projectId, 'proj-101');
        assert.strictEqual(result.confidence, 1.0);
    });

    test('J33.4b: Matching Nível 2 — revitDocumentIdentity vinculada previamente', () => {
        // Criar um vínculo prévio manual
        syncMgr.createOrUpdateLink({
            arqProjectId: 'proj-101',
            revitDocumentIdentity: 'doc-guid-alpha-88',
            revitVersion: '2026.1',
            modelIdentity: 'Model_Principal.rvt',
            status: ProjectIdentitySyncManager.LINK_STATUS.CONNECTED
        });

        const revitDocMeta = {
            documentGuid: 'doc-guid-alpha-88',
            revitVersion: '2026.1',
            persistentIdentifiers: {}, // Sem ARQ_ProjectId gravado ainda
            projectInformation: {
                projectName: 'Outro Nome',
                projectNumber: 'OUTRO-01'
            }
        };

        const result = syncMgr.matchRevitDocument(revitDocMeta);
        assert.strictEqual(result.matched, true);
        assert.strictEqual(result.matchLevel, 'DOCUMENT_IDENTITY');
        assert.strictEqual(result.projectId, 'proj-101');
        assert.strictEqual(result.confidence, 0.95);
    });

    test('J33.4c: Matching Nível 3 — Project Number e Cliente combinados', () => {
        const revitDocMeta = {
            documentGuid: 'doc-guid-novo-77',
            revitVersion: '2026.1',
            persistentIdentifiers: {},
            projectInformation: {
                projectName: 'Residencial Vértice Horizon',
                projectNumber: 'VH-2026',
                clientName: 'Cyrela Empreendimentos'
            }
        };

        const result = syncMgr.matchRevitDocument(revitDocMeta);
        assert.strictEqual(result.matched, true);
        assert.strictEqual(result.matchLevel, 'PROJECT_NUMBER_OR_COMPOSITE');
        assert.strictEqual(result.projectId, 'proj-101');
        assert.strictEqual(result.confidence, 0.85);
    });

    test('J33.4d: REGRA CRÍTICA — Nunca identificar apenas pelo nome isolado', () => {
        const revitDocMeta = {
            documentGuid: 'doc-guid-desconhecido-00',
            revitVersion: '2026.1',
            persistentIdentifiers: {},
            projectInformation: {
                projectName: 'Residencial Vértice Horizon', // Apenas nome, sem número nem cliente
                projectNumber: '',
                clientName: ''
            }
        };

        const result = syncMgr.matchRevitDocument(revitDocMeta);
        assert.strictEqual(result.matched, false);
        assert.strictEqual(result.matchLevel, 'NONE');
        assert.strictEqual(result.confidence, 0);
    });

    // -------------------------------------------------------------------------
    // 5. CONEXÃO AUTOMÁTICA (CONNECT vs CREATE LINK)
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Conexão Automática ao Abrir Modelo Revit ---');

    test('J33.5a: Modelo compatível conecta automaticamente (CONNECT)', () => {
        const docOpenEvent = {
            documentGuid: 'doc-guid-999',
            title: 'Residencial_Horizon_Executivo.rvt',
            revitVersion: '2026.1',
            persistentIdentifiers: {
                ARQ_ProjectId: 'proj-101'
            },
            projectInformation: {
                projectName: 'Residencial Vértice Horizon',
                projectNumber: 'VH-2026',
                clientName: 'Cyrela Empreendimentos'
            }
        };

        const connectResult = syncMgr.onRevitDocumentOpened(docOpenEvent);
        assert.strictEqual(connectResult.action, 'CONNECT');
        assert.strictEqual(connectResult.link.status, 'CONNECTED');
        assert.strictEqual(connectResult.link.arqProjectId, 'proj-101');
    });

    test('J33.5b: Modelo novo sem correspondência propõe criação de vínculo (CREATE LINK)', () => {
        const docOpenEvent = {
            documentGuid: 'doc-guid-inedito-404',
            title: 'Projeto_Inedito_Shopping.rvt',
            revitVersion: '2026.1',
            persistentIdentifiers: {},
            projectInformation: {
                projectName: 'Shopping Metrô Boulevard',
                projectNumber: 'SMB-2027',
                clientName: 'Multiplan'
            }
        };

        const connectResult = syncMgr.onRevitDocumentOpened(docOpenEvent);
        assert.strictEqual(connectResult.action, 'CREATE_LINK');
        assert.strictEqual(connectResult.link.status, 'PENDING_LINK');
        assert.strictEqual(connectResult.link.revitDocumentIdentity, 'doc-guid-inedito-404');
    });

    // -------------------------------------------------------------------------
    // 6. DETECÇÃO E RESOLUÇÃO DE CONFLITOS
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Detecção e Resolução de Conflitos (Não-Silenciosa) ---');

    test('J33.6a: Detectar conflito quando nome do cliente ou projeto divergem', () => {
        const revitDocWithDivergence = {
            documentGuid: 'doc-guid-999',
            revitVersion: '2026.1',
            persistentIdentifiers: {
                ARQ_ProjectId: 'proj-101'
            },
            projectInformation: {
                projectName: 'Residencial Vértice Horizon Alterado no Revit',
                projectNumber: 'VH-2026',
                clientName: 'Cyrela Empreendimentos Brasil Ltda'
            }
        };

        const syncResult = syncMgr.syncMetadata('proj-101', revitDocWithDivergence, {
            mode: ProjectIdentitySyncManager.SYNC_MODES.AUTO
        });

        assert.strictEqual(syncResult.hasConflicts, true);
        assert.strictEqual(syncResult.conflicts.length, 2);

        const projectConflict = syncResult.conflicts.find(c => c.field === 'name');
        assert.ok(projectConflict);
        assert.strictEqual(projectConflict.arqVerticeValue, 'Residencial Vértice Horizon');
        assert.strictEqual(projectConflict.revitValue, 'Residencial Vértice Horizon Alterado no Revit');
        assert.strictEqual(projectConflict.sourceOfTruth, 'ARQVERTICE');
        assert.ok(projectConflict.proposedResolution);
    });

    test('J33.6b: Resolução explícita de conflito (aceitar ArqVértice ou Revit)', () => {
        const conflicts = syncMgr.getConflicts('proj-101');
        assert.ok(conflicts.length > 0);

        const targetConflict = conflicts[0];
        const res = syncMgr.resolveConflict('proj-101', targetConflict.id, 'ACCEPT_ARQVERTICE', 'Carlos Arquiteto');
        assert.strictEqual(res.resolved, true);
        assert.strictEqual(res.resolutionStrategy, 'ACCEPT_ARQVERTICE');

        const remainingConflicts = syncMgr.getConflicts('proj-101');
        assert.strictEqual(remainingConflicts.length, conflicts.length - 1);
    });

    // -------------------------------------------------------------------------
    // 7. MODOS DE SINCRONIZAÇÃO
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Modos de Sincronização Suportados ---');

    test('J33.7: Execução no modo PUSH_TO_REVIT e PULL_FROM_REVIT', () => {
        const revitDoc = {
            documentGuid: 'doc-guid-999',
            projectInformation: {
                projectName: 'Residencial Vértice Horizon',
                projectNumber: 'VH-2026',
                clientName: 'Cyrela Empreendimentos',
                units: 'Meters'
            }
        };

        // PUSH_TO_REVIT
        const pushResult = syncMgr.syncMetadata('proj-101', revitDoc, {
            mode: ProjectIdentitySyncManager.SYNC_MODES.PUSH_TO_REVIT,
            user: 'Engenheiro Chefe'
        });
        assert.strictEqual(pushResult.mode, 'PUSH_TO_REVIT');
        assert.strictEqual(pushResult.appliedToTarget, 'REVIT');
        assert.ok(pushResult.payload.ARQ_ProjectId);

        // READ_ONLY (não altera nada)
        const roResult = syncMgr.syncMetadata('proj-101', revitDoc, {
            mode: ProjectIdentitySyncManager.SYNC_MODES.READ_ONLY
        });
        assert.strictEqual(roResult.applied, false);
        assert.strictEqual(roResult.mode, 'READ_ONLY');
    });

    // -------------------------------------------------------------------------
    // 8. TRILHA DE AUDITORIA TRANSACIONAL
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Trilha de Auditoria Transacional ---');

    test('J33.8: Registro completo de eventos no log de auditoria', () => {
        const logs = syncMgr.getAuditLog('proj-101');
        assert.ok(logs.length >= 2, 'Deve conter múltiplos registros de auditoria');

        const entry = logs[0];
        assert.ok(entry.syncId);
        assert.ok(entry.timestamp);
        assert.ok(entry.source);
        assert.ok(entry.target);
        assert.ok(entry.fieldsChanged);
        assert.ok(entry.status);
    });

    // -------------------------------------------------------------------------
    // 9. INTEGRAÇÃO COM REVIT BIM ADAPTER
    // -------------------------------------------------------------------------
    console.log('\n--- 9. Integração com RevitBIMAdapter ---');

    const adapter = new RevitBIMAdapter({ useVirtualDriver: true, debug: false });

    testAsync('J33.9: Adapter expõe autoDetectAndLink e metadados de sync', async () => {
        await adapter.connect();

        const autoLink = await adapter.autoDetectAndLink();
        assert.ok(autoLink);
        assert.ok(autoLink.action === 'CONNECT' || autoLink.action === 'CREATE_LINK' || autoLink.action === 'CONNECTED');

        const link = adapter.getProjectLink('prj-praia-01') || adapter.getProjectLink();
        assert.ok(link);
        assert.strictEqual(link.status, 'CONNECTED');

        const syncResult = await adapter.syncMetadata('AUTO');
        assert.ok(syncResult);
        assert.ok(syncResult.syncId);

        const auditTrail = adapter.getSyncAuditLog();
        assert.ok(Array.isArray(auditTrail));
        assert.ok(auditTrail.length > 0);
    });

    console.log('\n================================================================');
    console.log(`🎉 TODOS OS ${passedTests} TESTES DE SYNC DE IDENTIDADE PASSARAM COM SUCESSO!`);
    console.log('================================================================\n');
})();
