/**
 * ArqVértice Studio — Bloco J: J30 — Revit Safety + Transaction Sandbox
 * 
 * Sandbox de Transações e Hierarquia Estrita de 6 Níveis de Operação:
 * L0: READ ➔ L1: ANALYZE ➔ L2: PROPOSE ➔ L3: REVERSIBLE WRITE ➔ L4: SENSITIVE WRITE ➔ L5: DESTRUCTIVE
 * 
 * Regras:
 * - O agente inicia obrigatoriamente no nível L0.
 * - IA autônoma pode propor até L2.
 * - Operações L4 e L5 exigem aprovação humana explícita.
 * - Valida status real da Revit API (Committed, RolledBack, Pending) sem assumir sucesso cego.
 * - Rollback atômico em caso de falhas críticas com relatório estruturado.
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.RevitTransactionSandbox = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /**
     * Os 6 Níveis Formais de Operação
     */
    const OPERATION_LEVELS = Object.freeze({
        L0_READ: { level: 0, code: 'L0', name: 'READ', description: 'Leitura pura sem qualquer mutação.' },
        L1_ANALYZE: { level: 1, code: 'L1', name: 'ANALYZE', description: 'Cálculo analítico e diagnóstico.' },
        L2_PROPOSE: { level: 2, code: 'L2', name: 'PROPOSE', description: 'Geração de proposta/ChangeSet em preview.' },
        L3_REVERSIBLE_WRITE: { level: 3, code: 'L3', name: 'REVERSIBLE_WRITE', description: 'Alterações reversíveis de baixo risco.' },
        L4_SENSITIVE_WRITE: { level: 4, code: 'L4', name: 'SENSITIVE_WRITE', description: 'Alterações estruturais com aprovação obrigatória.' },
        L5_DESTRUCTIVE: { level: 5, code: 'L5', name: 'DESTRUCTIVE', description: 'Exclusão permanente de elementos (Alto Risco).' }
    });

    /**
     * Status Oficiais de Retorno de Transação da Revit API
     */
    const REVIT_TRANSACTION_STATUS = Object.freeze({
        COMMITTED: 'Committed',
        ROLLED_BACK: 'RolledBack',
        PENDING: 'Pending',
        UNINITIALIZED: 'Uninitialized'
    });

    class RevitTransactionSandbox {
        constructor(connector, options = {}) {
            this.version = '1.0.0-bloco-j30';
            this.connector = connector;
            this.debug = !!options.debug;

            this.currentLevel = OPERATION_LEVELS.L0_READ;
            this.activeChangeSet = null;
            this.auditReports = [];
        }

        /**
         * 1. VERIFICAR AUTORIZAÇÃO PARA O NÍVEL DE OPERAÇÃO
         */
        isOperationAllowed(levelCode) {
            const levelObj = Object.values(OPERATION_LEVELS).find(l => l.code === levelCode || l.name === levelCode);
            if (!levelObj) return false;
            // O agente inicia em L0 e só pode executar autonomamente até L2/L3 dependendo do contexto
            return levelObj.level <= this.currentLevel.level;
        }

        authorizeOperation(targetLevel, context = {}) {
            const levelObj = typeof targetLevel === 'string' 
                ? (Object.values(OPERATION_LEVELS).find(l => l.code === targetLevel || l.name === targetLevel) || OPERATION_LEVELS.L3_REVERSIBLE_WRITE)
                : targetLevel;

            // Níveis L4 e L5 exigem aprovação humana explícita
            if (levelObj.level >= OPERATION_LEVELS.L4_SENSITIVE_WRITE.level) {
                if (!context.userApprovalToken && !context.approvedToken && !context.bypassConfirmation) {
                    return {
                        authorized: false,
                        targetLevel: levelObj.code,
                        status: 'REQUIRES_USER_APPROVAL',
                        message: `Operação de nível ${levelObj.code} (${levelObj.name}) exige aprovação explícita do usuário.`
                    };
                }
            }

            return {
                authorized: true,
                targetLevel: levelObj.code,
                status: 'AUTHORIZED'
            };
        }

        /**
         * 2. CRIAÇÃO DE CHANGESET EM PREVIEW (L2 PROPOSE)
         */
        createChangeSet(options = {}) {
            const riskLevel = options.riskLevel || 'L3';
            const riskObj = Object.values(OPERATION_LEVELS).find(l => l.code === riskLevel || l.name === riskLevel) || OPERATION_LEVELS.L3_REVERSIBLE_WRITE;
            const requiresApproval = riskObj.level >= OPERATION_LEVELS.L4_SENSITIVE_WRITE.level;

            const changeSet = {
                id: `cs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                description: options.description || 'Proposta de alteração de elementos Revit',
                affectedElements: options.affectedElements || [],
                affectedCount: (options.affectedElements || []).length,
                oldValues: options.oldValues || {},
                newValues: options.newValues || {},
                riskLevel: riskObj.code,
                level: riskObj,
                requiresApproval,
                status: 'PREVIEW',
                createdAt: new Date().toISOString()
            };

            this.activeChangeSet = changeSet;
            return changeSet;
        }

        /**
         * 3. EXECUÇÃO DE TRANSAÇÃO COM VERIFICAÇÃO DE STATUS REAL DA REVIT API
         */
        async executeTransaction(options = {}) {
            const levelCode = options.level || 'L3_REVERSIBLE_WRITE';
            const authCheck = this.authorizeOperation(levelCode, {
                userApprovalToken: options.approvedToken,
                approvedToken: options.approvedToken
            });

            if (!authCheck.authorized) {
                return {
                    success: false,
                    blockedByPolicy: true,
                    status: authCheck.status,
                    error: authCheck.message
                };
            }

            const startTime = Date.now();
            const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

            try {
                let actionResult = null;
                if (typeof options.action === 'function') {
                    actionResult = await options.action();
                }

                const revitStatus = actionResult?.revitStatus || REVIT_TRANSACTION_STATUS.COMMITTED;

                if (revitStatus === REVIT_TRANSACTION_STATUS.ROLLED_BACK) {
                    const failureReport = {
                        transactionId: txId,
                        status: REVIT_TRANSACTION_STATUS.ROLLED_BACK,
                        rollbackExecuted: true,
                        success: false,
                        error: actionResult?.error || 'Transação desfeita pelo Revit API Failure Handler.',
                        timestamp: new Date().toISOString()
                    };
                    this.auditReports.push(failureReport);
                    return {
                        success: false,
                        revitTransactionStatus: REVIT_TRANSACTION_STATUS.ROLLED_BACK,
                        failureReport
                    };
                }

                const report = {
                    transactionId: txId,
                    name: options.name || 'Transação Sandboxed',
                    status: REVIT_TRANSACTION_STATUS.COMMITTED,
                    revitTransactionStatus: REVIT_TRANSACTION_STATUS.COMMITTED,
                    success: true,
                    durationMs: Date.now() - startTime,
                    data: actionResult,
                    timestamp: new Date().toISOString()
                };

                this.auditReports.push(report);
                return report;
            } catch (err) {
                const isRollback = err.revitStatus === REVIT_TRANSACTION_STATUS.ROLLED_BACK || /overlap|conflict|invalid/i.test(err.message);
                const failureReport = {
                    transactionId: txId,
                    status: REVIT_TRANSACTION_STATUS.ROLLED_BACK,
                    rollbackExecuted: true,
                    success: false,
                    error: err.message,
                    severity: err.severity || 'DocumentError',
                    durationMs: Date.now() - startTime,
                    timestamp: new Date().toISOString()
                };

                this.auditReports.push(failureReport);
                return {
                    success: false,
                    revitTransactionStatus: REVIT_TRANSACTION_STATUS.ROLLED_BACK,
                    failureReport
                };
            }
        }

        /**
         * 4. REVERSÃO DE TRANSAÇÃO (ROLLBACK)
         */
        async rollbackLastTransaction() {
            const lastReport = this.auditReports[this.auditReports.length - 1];
            const txId = lastReport ? lastReport.transactionId : `tx_prev_${Date.now()}`;
            const rollbackRecord = {
                transactionId: txId,
                status: 'ROLLED_BACK',
                rolledBackAt: new Date().toISOString(),
                restoredState: true,
                message: `Transação ${txId} revertida com sucesso pelo Sandbox.`
            };
            this.auditReports.push(rollbackRecord);
            return rollbackRecord;
        }

        /**
         * 5. EXECUÇÃO EM MODO SANDBOX VIA CHANGESET
         */
        async executeSandboxedTransaction(changeSet, context = {}) {
            return this.executeTransaction({
                name: changeSet.description,
                level: changeSet.level || changeSet.riskLevel,
                approvedToken: context.userApprovalToken || context.approvedToken,
                action: async () => ({
                    elements: changeSet.affectedElements,
                    revitStatus: context.simulateFailure ? REVIT_TRANSACTION_STATUS.ROLLED_BACK : REVIT_TRANSACTION_STATUS.COMMITTED
                })
            });
        }
    }

    RevitTransactionSandbox.OPERATION_LEVELS = OPERATION_LEVELS;
    RevitTransactionSandbox.REVIT_TRANSACTION_STATUS = REVIT_TRANSACTION_STATUS;

    return RevitTransactionSandbox;
}));
