/*
 * ArqVértice Studio — J39 AI 3D Command Engine & Safe Editing
 * Tradução determinística de linguagem natural em comandos estruturados 3D,
 * resolução de ambiguidades, pre-flight validation, diffs reversíveis e segurança BIM.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.AI3DCommandEngine = factory();
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const SUPPORTED_ACTIONS = Object.freeze([
        'select', 'hide', 'show', 'move', 'rotate', 'scale', 'duplicate', 'delete',
        'replaceAsset', 'changeMaterial', 'changeTexture', 'rename', 'group', 'ungroup',
        'changeLight', 'changeCamera', 'isolate', 'focus', 'measure'
    ]);

    // 1. Parser de Linguagem Natural para Comando Estruturado 3D
    class NaturalLanguageCommandParser {
        static parse(instructionStr = '') {
            const text = String(instructionStr || '').trim().toLowerCase();
            if (!text) return null;

            function cleanTarget(str) {
                if (!str) return 'objeto';
                return str.replace(/^(?:do|da|dos|das|no|na|nos|nas|de|o|a|os|as|um|uma)\s+/i, '').trim();
            }

            // 1. Trocar Material / Acabamento
            if (text.includes('troque o tecido') || text.includes('mude o material') || text.includes('altere o acabamento') || text.includes('trocar material') || text.includes('troque o material')) {
                const matMatch = text.match(/(?:para|por|de)\s+([a-záàâãéèêíïóôõöúçñ\s]+)/i);
                const targetMatch = text.match(/(?:tecido|material|acabamento)\s+(?:do|da|no|na|de)?\s*([a-záàâãéèêíïóôõöúçñ\s]+?)(?:\s+para|\s+por|$)/i);
                return {
                    action: 'changeMaterial',
                    targetQuery: cleanTarget(targetMatch ? targetMatch[1] : 'sofa'),
                    material: matMatch ? matMatch[1].trim() : 'couro caramelo',
                    rawText: instructionStr
                };
            }

            // 2. Mover / Transladar
            if (text.includes('mova') || text.includes('coloque') || text.includes('desloque') || text.includes('mover')) {
                let delta = [0, 0, 0];
                if (text.includes('direita')) delta = [0.3, 0, 0];
                else if (text.includes('esquerda')) delta = [-0.3, 0, 0];
                else if (text.includes('frente') || text.includes('avançar')) delta = [0, 0, 0.3];
                else if (text.includes('trás') || text.includes('recuar')) delta = [0, 0, -0.3];
                else if (text.includes('cima') || text.includes('eleve')) delta = [0, 0.3, 0];
                else if (text.includes('baixo') || text.includes('abaixe')) delta = [0, -0.3, 0];

                const targetMatch = text.match(/(?:mova|coloque|desloque|mover)\s+(?:o|a|os|as)?\s*([a-záàâãéèêíïóôõöúçñ\s]+?)(?:\s+\d+|\s+mais|\s+para|$)/i);
                return {
                    action: 'move',
                    targetQuery: cleanTarget(targetMatch ? targetMatch[1] : 'objeto'),
                    delta,
                    rawText: instructionStr
                };
            }

            // 3. Selecionar
            if (text.includes('selecione') || text.includes('selecionar') || text.includes('escolha')) {
                const targetMatch = text.replace(/(?:selecione|selecionar|escolha)\s+(?:o|a|os|as)?/i, '').trim();
                return {
                    action: 'select',
                    targetQuery: cleanTarget(targetMatch || 'sofa'),
                    rawText: instructionStr
                };
            }

            // 4. Ocultar / Esconder
            if (text.includes('oculte') || text.includes('esconda') || text.includes('ocultar')) {
                const targetMatch = text.replace(/(?:oculte|esconda|ocultar)\s+(?:o|a|os|as)?/i, '').trim();
                return {
                    action: 'hide',
                    targetQuery: cleanTarget(targetMatch || 'objeto'),
                    rawText: instructionStr
                };
            }

            // 5. Mostrar / Exibir
            if (text.includes('mostre') || text.includes('exiba') || text.includes('mostrar')) {
                const targetMatch = text.replace(/(?:mostre|exiba|mostrar)\s+(?:o|a|os|as)?/i, '').trim();
                return {
                    action: 'show',
                    targetQuery: cleanTarget(targetMatch || 'objeto'),
                    rawText: instructionStr
                };
            }

            // 6. Focar Câmera
            if (text.includes('foque') || text.includes('focar') || text.includes('aproxime')) {
                const targetMatch = text.replace(/(?:foque|focar|aproxime)\s+(?:em|no|na|o|a)?/i, '').trim();
                return {
                    action: 'focus',
                    targetQuery: cleanTarget(targetMatch || 'objeto'),
                    rawText: instructionStr
                };
            }

            // 7. Deletar / Excluir / Remover
            if (text.includes('delete') || text.includes('exclua') || text.includes('apague') || text.includes('remover') || text.includes('deletar')) {
                const targetMatch = text.replace(/(?:delete|deletar|exclua|excluir|apague|remover)\s+(?:o|a|os|as)?/i, '').trim();
                return {
                    action: 'delete',
                    targetQuery: cleanTarget(targetMatch || 'objeto'),
                    rawText: instructionStr
                };
            }

            // 8. Isolar
            if (text.includes('isole') || text.includes('isolar')) {
                const targetMatch = text.replace(/(?:isole|isolar)\s+(?:o|a|os|as)?/i, '').trim();
                return {
                    action: 'isolate',
                    targetQuery: cleanTarget(targetMatch || 'sala'),
                    rawText: instructionStr
                };
            }

            // Fallback genérico
            return {
                action: 'select',
                targetQuery: cleanTarget(text),
                rawText: instructionStr
            };
        }
    }

    // 2. Validador Pré-Execução e Resolução de Ambiguidades
    class CommandValidator {
        static validateAndResolve(parsedCommand, semanticIndex) {
            if (!parsedCommand || !parsedCommand.action) {
                return { valid: false, error: 'Comando inválido ou não compreendido.' };
            }

            if (!SUPPORTED_ACTIONS.includes(parsedCommand.action)) {
                return { valid: false, error: `Ação 3D não permitida: ${parsedCommand.action}` };
            }

            // Resolver Alvos no Índice Semântico
            const candidates = semanticIndex.search(parsedCommand.targetQuery);

            if (candidates.length === 0) {
                return {
                    valid: false,
                    error: `Nenhum elemento correspondente a "${parsedCommand.targetQuery}" foi localizado no projeto 3D.`
                };
            }

            // Se for comando de modificação destrutiva ou alteração e houver mais de 1 candidato:
            const isModifyingAction = ['changeMaterial', 'delete', 'move', 'rotate', 'scale', 'replaceAsset'].includes(parsedCommand.action);
            if (candidates.length > 1 && isModifyingAction) {
                return {
                    status: 'AMBIGUOUS',
                    valid: false,
                    candidates,
                    clarificationPrompt: `Encontrei ${candidates.length} elementos correspondentes a "${parsedCommand.targetQuery}". Qual deles deseja alterar?`,
                    candidateOptions: candidates.map(c => ({ id: c.id, name: c.name, room: c.room }))
                };
            }

            const targetObj = candidates[0];

            // Trava de Segurança Estrutural (AI Safety)
            if (parsedCommand.action === 'delete' && targetObj.bimReference?.isStructural) {
                return {
                    valid: false,
                    error: `Operação Bloqueada: O elemento "${targetObj.name}" é um componente ESTRUTURAL do projeto BIM e não pode ser deletado via IA sem autorização explícita do calculista.`
                };
            }

            // Construção do ChangeSet & Diff Seguro
            const changeSet = {
                action: parsedCommand.action,
                targetId: targetObj.id,
                targetName: targetObj.name,
                room: targetObj.room,
                before: {
                    material: targetObj.material,
                    transform: { ...targetObj.transform },
                    visibility: true
                },
                after: {
                    material: parsedCommand.material || targetObj.material,
                    transform: {
                        position: {
                            x: targetObj.transform.position.x + (parsedCommand.delta ? parsedCommand.delta[0] : 0),
                            y: targetObj.transform.position.y + (parsedCommand.delta ? parsedCommand.delta[1] : 0),
                            z: targetObj.transform.position.z + (parsedCommand.delta ? parsedCommand.delta[2] : 0)
                        }
                    },
                    visibility: parsedCommand.action === 'hide' ? false : true
                },
                impact: targetObj.category === 'Furniture' ? 'Baixo' : 'Médio',
                reversible: true,
                generatedAt: new Date().toISOString()
            };

            return {
                valid: true,
                status: 'RESOLVED',
                target: targetObj,
                command: parsedCommand,
                changeSet
            };
        }
    }

    // 3. Motor Principal AI3DCommandEngine
    class AI3DCommandEngine {
        constructor(semanticIndex, project3DCore = null) {
            this.semanticIndex = semanticIndex;
            this.core = project3DCore;
            this.history = [];
            this.future = [];
            this.subscribers = new Set();
        }

        async processNaturalLanguage(instructionStr) {
            // 1. Parsing
            const parsed = NaturalLanguageCommandParser.parse(instructionStr);
            if (!parsed) {
                return { success: false, reason: 'Instrução não reconhecida.' };
            }

            // 2. Validação & Resolução de Ambiguidades
            const validation = CommandValidator.validateAndResolve(parsed, this.semanticIndex);
            if (!validation.valid) {
                return {
                    success: false,
                    status: validation.status || 'ERROR',
                    error: validation.error,
                    clarificationPrompt: validation.clarificationPrompt,
                    candidates: validation.candidateOptions
                };
            }

            // 3. Execução Determinística
            return this.executeChangeSet(validation.changeSet);
        }

        executeChangeSet(changeSet) {
            const current = this.semanticIndex.getObject(changeSet.targetId);
            if (!current) {
                return { success: false, reason: 'Alvo não encontrado no índice.' };
            }

            // Aplica mutação no índice semântico
            const updates = {};
            if (changeSet.action === 'changeMaterial' && changeSet.after.material) {
                updates.material = changeSet.after.material;
            } else if (changeSet.action === 'move' && changeSet.after.transform) {
                updates.transform = { position: changeSet.after.transform.position };
            } else if (changeSet.action === 'hide') {
                updates.visibility = false;
            } else if (changeSet.action === 'show') {
                updates.visibility = true;
            }

            const updatedTarget = this.semanticIndex.updateObject(changeSet.targetId, updates);

            this.history.push({ ...changeSet, appliedAt: new Date().toISOString() });
            this.future = [];

            this._notifyChange({ type: 'command_executed', changeSet, target: updatedTarget });

            return {
                success: true,
                status: 'EXECUTED',
                changeSet,
                feedbackMessage: `Ação "${changeSet.action}" executada com sucesso em "${changeSet.targetName}".`
            };
        }

        undo() {
            const entry = this.history.pop();
            if (!entry) return { success: false, reason: 'Nenhum comando para desfazer.' };

            const restores = {
                material: entry.before.material,
                transform: { position: entry.before.transform.position },
                visibility: entry.before.visibility
            };

            const updatedTarget = this.semanticIndex.updateObject(entry.targetId, restores);

            this.future.push(entry);
            this._notifyChange({ type: 'command_undone', entry, target: updatedTarget });
            return { success: true, undoneChangeSet: entry };
        }

        redo() {
            const entry = this.future.pop();
            if (!entry) return { success: false, reason: 'Nenhum comando para refazer.' };
            return this.executeChangeSet(entry);
        }

        subscribe(listener) {
            if (typeof listener === 'function') {
                this.subscribers.add(listener);
                return () => this.subscribers.delete(listener);
            }
            return () => {};
        }

        _notifyChange(event) {
            this.subscribers.forEach(fn => {
                try { fn(event); } catch (e) { console.error(e); }
            });
        }
    }

    AI3DCommandEngine.NaturalLanguageCommandParser = NaturalLanguageCommandParser;
    AI3DCommandEngine.CommandValidator = CommandValidator;
    AI3DCommandEngine.SUPPORTED_ACTIONS = SUPPORTED_ACTIONS;

    return AI3DCommandEngine;
}));
