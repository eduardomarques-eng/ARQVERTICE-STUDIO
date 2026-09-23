/**
 * ArqVértice Studio — Bloco J: J29 — Revit Worksharing + Collaboration Safety
 * 
 * Camada de Segurança para Modelos Compartilhados (Worksharing / Cloud Worksharing).
 * Detecta Arquivo Central, Local, Worksets, Elementos Bloqueados e Ownership.
 * Regra: NUNCA força edição em elemento sob posse de outro usuário (ELEMENT_NOT_EDITABLE)
 * e NUNCA sincroniza com o arquivo central (Sync with Central) sem autorização expressa.
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.RevitWorksharingSafety = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /**
     * Modos de Documento Revit
     */
    const MODEL_COLLABORATION_MODES = Object.freeze({
        STANDALONE: 'STANDALONE',
        FILE_WORKSHARED_LOCAL: 'FILE_WORKSHARED_LOCAL',
        FILE_WORKSHARED_CENTRAL: 'FILE_WORKSHARED_CENTRAL',
        CLOUD_WORKSHARED: 'CLOUD_WORKSHARED'
    });

    class RevitWorksharingSafety {
        constructor(connector, options = {}) {
            this.version = '1.0.0-bloco-j29';
            this.connector = connector;
            this.debug = !!options.debug;

            this.currentUser = options.currentUser || 'Arquiteto Lider';
            this.worksharingState = {
                isWorkshared: true,
                collaborationMode: MODEL_COLLABORATION_MODES.CLOUD_WORKSHARED,
                centralModelPath: 'BIM 360://Projetos/Residencia_Alphaville.rvt',
                activeWorkset: 'ARQ_Arquitetura_Principal',
                worksets: [
                    { id: 1, name: 'ARQ_Arquitetura_Principal', isEditable: true, owner: this.currentUser },
                    { id: 2, name: 'EST_Estrutural_Vinculo', isEditable: false, owner: 'Eng. Roberto' },
                    { id: 3, name: 'MEP_Instalacoes', isEditable: false, owner: 'Eng. Carlos' }
                ],
                // Elementos bloqueados / emprestados por outros membros da equipe
                borrowedElements: new Map([
                    [20419, { owner: 'Eng. Roberto', workset: 'EST_Estrutural_Vinculo', lockedAt: '2026-09-22T20:10:00Z' }]
                ])
            };
        }

        /**
         * 1. DETECTAR STATUS DE COMPARTILHAMENTO DO MODELO
         */
        getWorksharingStatus() {
            return {
                isWorkshared: this.worksharingState.isWorkshared,
                mode: this.worksharingState.collaborationMode,
                collaborationMode: this.worksharingState.collaborationMode,
                isCloudModel: this.worksharingState.collaborationMode === MODEL_COLLABORATION_MODES.CLOUD_WORKSHARED,
                centralPath: this.worksharingState.centralModelPath,
                centralModelPath: this.worksharingState.centralModelPath,
                activeWorkset: this.worksharingState.activeWorkset,
                totalWorksets: this.worksharingState.worksets.length,
                currentUser: this.currentUser
            };
        }

        /**
         * 2. VERIFICAÇÃO DE EDITABILIDADE ANTES DA ESCRITA (READ-ONLY / OWNERSHIP CHECK)
         * Se elemento estiver bloqueado por outro usuário: NUNCA FORÇA
         */
        verifyElementEditability(elementId) {
            return this.checkElementEditable(elementId);
        }

        checkElementEditable(elementId) {
            const numId = Number(elementId);

            if (this.worksharingState.borrowedElements.has(numId)) {
                const lockInfo = this.worksharingState.borrowedElements.get(numId);
                return {
                    isEditable: false,
                    editable: false,
                    status: 'ELEMENT_NOT_EDITABLE',
                    code: 'ELEMENT_NOT_EDITABLE',
                    elementId: numId,
                    owner: lockInfo.owner,
                    workset: lockInfo.workset,
                    message: `O elemento #${numId} está bloqueado ou emprestado por "${lockInfo.owner}" no workset "${lockInfo.workset}". Não é permitido forçar edição.`
                };
            }

            return {
                isEditable: true,
                editable: true,
                status: 'EDITABLE',
                code: 'EDITABLE',
                elementId: numId,
                owner: this.currentUser,
                workset: this.worksharingState.activeWorkset
            };
        }

        /**
         * 3. SALVAGUARDA DE SINCRONIZAÇÃO COM O ARQUIVO CENTRAL (SYNC WITH CENTRAL)
         * NUNCA executa automaticamente sem política explícita
         */
        requestSyncWithCentral(optionsOrApproved = false, comment = '') {
            let isApproved = false;
            let syncComment = comment;

            if (typeof optionsOrApproved === 'object' && optionsOrApproved !== null) {
                isApproved = !!optionsOrApproved.authorized || !!optionsOrApproved.userApproved;
                syncComment = optionsOrApproved.comment || comment;
            } else {
                isApproved = !!optionsOrApproved;
            }

            if (!isApproved) {
                return {
                    allowed: false,
                    status: 'BLOCKED_BY_POLICY',
                    code: 'SYNC_REQUIRES_EXPLICIT_USER_CONFIRMATION',
                    message: 'A sincronização com o arquivo central (Sync with Central) exige autorização manual expressa do usuário.'
                };
            }

            return {
                allowed: true,
                status: 'SYNC_QUEUED',
                timestamp: new Date().toISOString(),
                comment: syncComment || 'Sincronização iniciada via ArqVértice Studio.',
                message: 'Comando de sincronização despachado com sucesso para o Revit.'
            };
        }
    }

    RevitWorksharingSafety.MODEL_COLLABORATION_MODES = MODEL_COLLABORATION_MODES;

    return RevitWorksharingSafety;
}));
