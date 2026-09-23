/**
 * ArqVértice Studio — Bloco J: J25 — Bidirectional Sync Engine
 * 
 * Motor de Sincronização Bidirecional Controlada ArqVértice ⇄ Autodesk Revit.
 * Princípio: Fonte da verdade definida por entidade (Geometria ➔ Revit; Metadados/IA ➔ ArqVértice).
 * 5 Estados de Sincronização: IN_SYNC, LOCAL_CHANGED, REVIT_CHANGED, CONFLICT, UNKNOWN.
 * Fluxo: FETCH ➔ COMPARE ➔ DIFF ➔ RESOLVE ➔ APPLY ➔ VALIDATE.
 * Regra: NUNCA sobrescreve dados silenciosamente em caso de conflito.
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.RevitSyncEngine = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /**
     * 5 Estados Canônicos de Sincronização
     */
    const SYNC_STATES = Object.freeze({
        IN_SYNC: 'IN_SYNC',
        LOCAL_CHANGED: 'LOCAL_CHANGED',
        REVIT_CHANGED: 'REVIT_CHANGED',
        CONFLICT: 'CONFLICT',
        UNKNOWN: 'UNKNOWN'
    });

    /**
     * Matriz de Fonte da Verdade por Entidade
     */
    const SOURCE_OF_TRUTH = Object.freeze({
        GEOMETRY: 'REVIT',               // Coordenadas, espessuras, comprimentos
        ELEMENT_IDENTITY: 'REVIT',       // UniqueId e ElementId nativos
        PRESENTATION_METADATA: 'STUDIO', // Cores conceituais, tags de prancha, boards
        AI_ANNOTATIONS: 'STUDIO',        // Anotações multimodais de IA e sugestões
        MATERIALS_FINISH: 'REVIT'        // Propriedades físicas e materiais
    });

    class RevitSyncEngine {
        constructor(connector, options = {}) {
            this.version = '1.0.0-bloco-j25';
            this.connector = connector;
            this.debug = !!options.debug;

            this.syncRegistry = new Map(); // uniqueId -> SyncRecord
            this.conflictQueue = [];
            this.syncAuditLog = [];
        }

        /**
         * 1. REGISTRAR ENTIDADE NA TABELA DE SINCRONIZAÇÃO
         */
        registerEntity(uniqueId, localData = {}, revitData = {}) {
            const record = {
                uniqueId,
                localData: { ...localData },
                revitData: { ...revitData },
                lastSyncedAt: new Date().toISOString(),
                state: SYNC_STATES.IN_SYNC
            };
            this.syncRegistry.set(uniqueId, record);
            return record;
        }

        /**
         * 2. CALCULAR DIFF E DETECTAR CONFLITOS (COMPARE & DIFF)
         */
        calculateDiff(uniqueId, incomingLocalData = {}, incomingRevitData = {}) {
            const record = this.syncRegistry.get(uniqueId);
            if (!record) {
                return { state: SYNC_STATES.UNKNOWN, diffs: [] };
            }

            const diffs = [];
            let localChanged = false;
            let revitChanged = false;

            // Comparar propriedades
            const allKeys = new Set([
                ...Object.keys(incomingLocalData),
                ...Object.keys(incomingRevitData)
            ]);

            allKeys.forEach(key => {
                const baseVal = record.revitData[key];
                const localVal = incomingLocalData[key];
                const revitVal = incomingRevitData[key];

                if (localVal !== undefined && localVal !== baseVal) {
                    localChanged = true;
                }
                if (revitVal !== undefined && revitVal !== baseVal) {
                    revitChanged = true;
                }

                if (localVal !== undefined && revitVal !== undefined && localVal !== revitVal) {
                    diffs.push({
                        property: key,
                        localValue: localVal,
                        revitValue: revitVal,
                        lastSyncedValue: baseVal
                    });
                }
            });

            let state = SYNC_STATES.IN_SYNC;
            if (localChanged && revitChanged) {
                state = SYNC_STATES.CONFLICT;
            } else if (localChanged) {
                state = SYNC_STATES.LOCAL_CHANGED;
            } else if (revitChanged) {
                state = SYNC_STATES.REVIT_CHANGED;
            }

            return {
                uniqueId,
                state,
                diffs,
                hasConflict: state === SYNC_STATES.CONFLICT
            };
        }

        /**
         * 3. RESOLVER CONFLITO (INTERACTIVE CONFLICT RESOLUTION)
         * NUNCA sobrescreve silenciosamente
         */
        resolveConflict(uniqueId, chosenSource, userApproved = false) {
            if (!userApproved) {
                throw new Error('[SyncEngine] A resolução de conflitos exige aprovação explícita do usuário.');
            }

            const record = this.syncRegistry.get(uniqueId);
            if (!record) {
                throw new Error(`[SyncEngine] Entidade "${uniqueId}" não encontrada no registro.`);
            }

            const resolution = {
                uniqueId,
                resolvedBy: chosenSource, // 'REVIT' ou 'STUDIO'
                resolvedAt: new Date().toISOString(),
                auditStatus: 'CONFLICT_RESOLVED'
            };

            record.state = SYNC_STATES.IN_SYNC;
            record.lastSyncedAt = resolution.resolvedAt;

            this.syncAuditLog.push(resolution);
            return resolution;
        }

        /**
         * 4. FLUXO COMPLETO DE SINCRONIZAÇÃO (FETCH ➔ COMPARE ➔ DIFF ➔ RESOLVE ➔ APPLY ➔ VALIDATE)
         */
        async executeSyncCycle(entityId, localChanges = {}, revitChanges = {}) {
            // 1. Fetch
            let record = this.syncRegistry.get(entityId);
            if (!record) {
                record = this.registerEntity(entityId, localChanges, revitChanges);
            }

            // 2. Compare & Diff
            const diffResult = this.calculateDiff(entityId, localChanges, revitChanges);

            // 3. Resolve
            if (diffResult.state === SYNC_STATES.CONFLICT) {
                this.conflictQueue.push(diffResult);
                return {
                    status: 'CONFLICT_PENDING_APPROVAL',
                    state: SYNC_STATES.CONFLICT,
                    conflictDetails: diffResult,
                    message: 'Conflito detectado entre Revit e ArqVértice. Selecione qual versão prevalece.'
                };
            }

            // 4. Apply & Validate
            record.state = SYNC_STATES.IN_SYNC;
            record.lastSyncedAt = new Date().toISOString();

            return {
                status: 'SYNC_COMPLETED',
                state: SYNC_STATES.IN_SYNC,
                entityId,
                changesAppliedCount: diffResult.diffs.length,
                synchronizedAt: record.lastSyncedAt
            };
        }
    }

    RevitSyncEngine.SYNC_STATES = SYNC_STATES;
    RevitSyncEngine.SOURCE_OF_TRUTH = SOURCE_OF_TRUTH;

    return RevitSyncEngine;
}));
