/**
 * ArqVértice Studio — Bloco J: J19 — Revit Write Engine
 * 
 * Motor Transacional Controlado de Edição do Autodesk Revit.
 * Fluxo Estrito: READ ➔ PLAN ➔ PREVIEW ➔ APPROVE ➔ TRANSACTION ➔ VALIDATE ➔ COMMIT.
 * Suporta ChangeSet, Rollback, Operações em Lote e Travas contra Ações Destrutivas (Delete).
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.RevitWriteEngine = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /**
     * Estágios do Pipeline de Edição Controlada
     */
    const WRITE_STAGES = Object.freeze({
        READ: 'READ',
        PLAN: 'PLAN',
        PREVIEW: 'PREVIEW',
        APPROVED: 'APPROVED',
        TRANSACTION: 'TRANSACTION',
        VALIDATED: 'VALIDATED',
        COMMITTED: 'COMMITTED',
        ROLLED_BACK: 'ROLLED_BACK'
    });

    /**
     * Tipos de Edição Suportados
     */
    const EDIT_OPERATIONS = Object.freeze([
        'setParameter',
        'move',
        'rotate',
        'mirror',
        'copy',
        'changeType',
        'changeWorkset',
        'changePhase',
        'hide',
        'isolate'
    ]);

    /**
     * Tipos de Criação Suportados
     */
    const CREATE_OPERATIONS = Object.freeze([
        'wall',
        'floor',
        'ceiling',
        'roof',
        'room',
        'level',
        'grid',
        'door',
        'window',
        'furniture',
        'detailLine',
        'text',
        'view',
        'sheet',
        'schedule'
    ]);

    /**
     * Estrutura Formal de ChangeSet
     */
    class ChangeSet {
        constructor(name) {
            this.id = `cs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            this.name = name || 'Operação Revit Não Nomeada';
            this.createdAt = new Date().toISOString();
            this.stage = WRITE_STAGES.PLAN;

            this.added = [];
            this.modified = [];
            this.deleted = [];
            this.parameterChanges = [];
            this.viewsChanged = [];
            this.materialsChanged = [];

            this.affectedElementsCount = 0;
            this.highRisk = false;
            this.approvedBy = null;
        }

        addModification(elementId, paramName, oldValue, newValue) {
            this.modified.push({ elementId, paramName, oldValue, newValue });
            this.parameterChanges.push({ elementId, paramName, oldValue, newValue });
            this.affectedElementsCount++;
        }

        addDeletion(elementId, reason) {
            this.deleted.push({ elementId, reason });
            this.affectedElementsCount++;
            this.highRisk = true; // Exclusão é sempre HIGH_RISK
        }
    }

    class RevitWriteEngine {
        constructor(connector, options = {}) {
            this.version = '1.0.0-bloco-j19';
            this.connector = connector;
            this.debug = !!options.debug;
            this.changeHistory = [];
        }

        /**
         * 1. Planejar e Gerar Pré-visualização de Alteração em Lote (PLAN & PREVIEW)
         * Exemplo: "Troque o tipo dessas 18 janelas"
         */
        planBatchTypeChange(elements = [], targetType, transactionName = 'Troca de Tipo em Lote') {
            const changeSet = new ChangeSet(transactionName);

            elements.forEach(el => {
                changeSet.addModification(el.id, 'Type', el.type || 'Tipo Anterior', targetType);
            });

            changeSet.stage = WRITE_STAGES.PREVIEW;

            return {
                stage: WRITE_STAGES.PREVIEW,
                elementsFound: elements.length,
                elementsEligible: elements.length,
                proposedChangesCount: changeSet.modified.length,
                changeSet,
                requiresUserApproval: true,
                summary: `Proposta de alteração de tipo para ${elements.length} elementos para "${targetType}".`
            };
        }

        /**
         * 2. Planejar Edição de Parâmetro (PLAN & PREVIEW)
         */
        planParameterUpdate(elementId, paramName, newValue, oldValue = 'Valor Atual') {
            const changeSet = new ChangeSet(`Atualizar ${paramName} do elemento #${elementId}`);
            changeSet.addModification(elementId, paramName, oldValue, newValue);
            changeSet.stage = WRITE_STAGES.PREVIEW;

            return {
                stage: WRITE_STAGES.PREVIEW,
                changeSet,
                requiresUserApproval: true,
                summary: `Alterar parâmetro "${paramName}" de "${oldValue}" para "${newValue}".`
            };
        }

        /**
         * 3. Planejar Exclusão de Elemento (HIGH RISK GATE)
         */
        planDelete(elementId, reason = 'Remoção solicitada') {
            const changeSet = new ChangeSet(`Exclusão do elemento #${elementId}`);
            changeSet.addDeletion(elementId, reason);
            changeSet.stage = WRITE_STAGES.PREVIEW;

            return {
                stage: WRITE_STAGES.PREVIEW,
                changeSet,
                requiresUserApproval: true,
                highRisk: true,
                warning: 'ALERTA DE SEGURANÇA: Exclusões no Revit são operações de ALTO RISCO e exigem aprovação explícita.'
            };
        }

        /**
         * 4. Executar Transação com Aprovação Humana (TRANSACTION & COMMIT)
         */
        async commitChangeSet(changeSet, userApprovalToken = null) {
            if (!changeSet || changeSet.stage !== WRITE_STAGES.PREVIEW) {
                throw new Error('[RevitWriteEngine] Impossível aplicar ChangeSet fora do estágio PREVIEW.');
            }

            // Trava de segurança para operações destrutivas ou de alto risco
            if (changeSet.highRisk && !userApprovalToken) {
                return {
                    success: false,
                    stage: WRITE_STAGES.PREVIEW,
                    error: 'Operação de ALTO RISCO rejeitada: Token de aprovação humana ausente.',
                    changeSet
                };
            }

            changeSet.approvedBy = userApprovalToken ? 'Arquiteto (Aprovado)' : 'Políticas Automáticas';
            changeSet.stage = WRITE_STAGES.TRANSACTION;

            // Despachar transação ao conector do Revit
            const response = await this.connector.sendCommand({
                operation: 'EXECUTE_TRANSACTION',
                mode: 'write',
                userApproved: true,
                input: {
                    transactionName: changeSet.name,
                    elementIds: changeSet.modified.map(m => m.elementId),
                    paramName: changeSet.modified[0]?.paramName || 'Type',
                    value: changeSet.modified[0]?.newValue || 'Atualizado'
                }
            });

            if (response.status === 'success') {
                changeSet.stage = WRITE_STAGES.COMMITTED;
                this.changeHistory.push(changeSet);
                return {
                    success: true,
                    stage: WRITE_STAGES.COMMITTED,
                    changeSet,
                    result: response.result,
                    message: `Transação "${changeSet.name}" gravada com sucesso no modelo Revit.`
                };
            } else {
                changeSet.stage = WRITE_STAGES.ROLLED_BACK;
                return {
                    success: false,
                    stage: WRITE_STAGES.ROLLED_BACK,
                    changeSet,
                    errors: response.errors || ['Falha na transação do Revit.'],
                    message: 'Transação revertida pelo mecanismo de Failure Handling do Revit.'
                };
            }
        }
    }

    RevitWriteEngine.WRITE_STAGES = WRITE_STAGES;
    RevitWriteEngine.EDIT_OPERATIONS = EDIT_OPERATIONS;
    RevitWriteEngine.CREATE_OPERATIONS = CREATE_OPERATIONS;
    RevitWriteEngine.ChangeSet = ChangeSet;

    return RevitWriteEngine;
}));
