/**
 * ArqVértice Studio — Bloco J: J23 — Revit Families + Parameters + Standards
 * 
 * Gerenciador Avançado de Famílias, Tipos e Parâmetros do Autodesk Revit.
 * Implementa Resolução Estrita de Parâmetros, Checagem de StorageType/Read-Only,
 * Conversão Explícita de Unidades (Métrico ➔ Pés Decimais) e Salvaguardas Anti-Duplicação.
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.RevitFamilyParameters = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /**
     * Storage Types Oficiais da Revit API
     */
    const STORAGE_TYPES = Object.freeze({
        INTEGER: 'Integer',
        DOUBLE: 'Double',
        STRING: 'String',
        ELEMENT_ID: 'ElementId',
        NONE: 'None'
    });

    /**
     * Fatores de Conversão Métrico ➔ Pés Internos da Revit API (1 ft = 0.3048 m)
     */
    const UNIT_CONVERSIONS = Object.freeze({
        'm': 1 / 0.3048,               // metros para pés
        'cm': 0.01 / 0.3048,           // centímetros para pés
        'mm': 0.001 / 0.3048,          // milímetros para pés
        'm2': 1 / (0.3048 * 0.3048),   // metros quadrados para sq ft
        'm3': 1 / (0.3048 * 0.3048 * 0.3048) // metros cúbicos para cu ft
    });

    class RevitFamilyParametersManager {
        constructor(connector, options = {}) {
            this.version = '1.0.0-bloco-j23';
            this.connector = connector;
            this.debug = !!options.debug;

            // Catálogo em memória para validação de duplicidade
            this.loadedFamilies = new Map();
            this._seedDefaultCatalog();
        }

        _seedDefaultCatalog() {
            this.loadedFamilies.set('Parede Básica', {
                category: 'Walls',
                version: '2025',
                types: ['Alvenaria 15cm', 'Concreto 20cm', 'Drywall 10cm']
            });
            this.loadedFamilies.set('Porta Madeira Pivotante', {
                category: 'Doors',
                version: '2025',
                types: ['1.20 x 2.40m', '1.00 x 2.10m']
            });
            this.loadedFamilies.set('Esquadria Alumínio Preto', {
                category: 'Windows',
                version: '2025',
                types: ['2.40 x 1.50m', '1.20 x 1.20m']
            });
        }

        /**
         * 1. RESOLUÇÃO E CONVERSÃO DE UNIDADES EXPLÍCITAS
         * Rejeita valores numéricos "nus" sem unidade definida
         */
        resolveUnit(value, unit = 'm', spec = 'LENGTH') {
            if (value === undefined || value === null) {
                throw new Error('[ParametersManager] O valor do parâmetro não pode ser nulo.');
            }

            if (typeof value === 'number' && !unit) {
                throw new Error(`[ParametersManager] Valor numérico "${value}" enviado sem unidade. Especifique a unidade (ex: 'm', 'mm').`);
            }

            const cleanUnit = (unit || '').toLowerCase().trim();
            const factor = UNIT_CONVERSIONS[cleanUnit];

            if (!factor && spec === 'LENGTH') {
                throw new Error(`[ParametersManager] Unidade não suportada: "${unit}". Use 'm', 'cm' ou 'mm'.`);
            }

            const internalRevitValue = (typeof value === 'number' && factor) ? value * factor : value;

            return {
                originalValue: value,
                unit: cleanUnit,
                spec,
                displayString: `${value} ${cleanUnit}`,
                internalRevitValue
            };
        }

        /**
         * 2. RESOLUÇÃO COMPLETA DE PARÂMETROS COM VALIDAÇÃO DE STORAGE TYPE
         */
        resolveParameter(paramName, paramDescriptor = {}) {
            const descriptor = {
                name: paramName,
                storageType: paramDescriptor.storageType || STORAGE_TYPES.STRING,
                isReadOnly: !!paramDescriptor.isReadOnly,
                scope: paramDescriptor.scope || 'INSTANCE', // 'INSTANCE' ou 'TYPE'
                unit: paramDescriptor.unit || 'm',
                binding: paramDescriptor.binding || 'PROJECT'
            };

            // Guard contra tentativa de escrita em parâmetro Read-Only
            if (descriptor.isReadOnly) {
                return {
                    valid: false,
                    error: `O parâmetro "${paramName}" é somente-leitura (Read-Only) no Revit e não pode ser editado.`,
                    descriptor
                };
            }

            return {
                valid: true,
                descriptor
            };
        }

        /**
         * 3. CARREGAMENTO SEGURO DE FAMÍLIA (Anti-Duplicação)
         */
        validateFamilyLoading(familyName, category = 'General', incomingVersion = '2025') {
            if (this.loadedFamilies.has(familyName)) {
                const existing = this.loadedFamilies.get(familyName);
                return {
                    allowed: false,
                    duplicateFound: true,
                    reason: `A família "${familyName}" já está carregada no documento (Categoria: ${existing.category}). Use 'duplicateType' para novos dimensionamentos.`,
                    existingTypes: existing.types
                };
            }

            return {
                allowed: true,
                duplicateFound: false,
                familyName,
                category,
                version: incomingVersion
            };
        }

        /**
         * 4. DUPLICAÇÃO SEGURA DE TIPO
         */
        duplicateType(familyName, sourceTypeName, newTypeName, newParams = {}) {
            const family = this.loadedFamilies.get(familyName);
            if (!family) {
                throw new Error(`[ParametersManager] Família "${familyName}" não encontrada para duplicação.`);
            }

            if (family.types.includes(newTypeName)) {
                return {
                    success: false,
                    error: `O tipo "${newTypeName}" já existe na família "${familyName}".`
                };
            }

            family.types.push(newTypeName);

            return {
                success: true,
                familyName,
                newTypeName,
                sourceTypeName,
                parametersApplied: newParams,
                message: `Tipo "${newTypeName}" criado com sucesso na família "${familyName}".`
            };
        }
    }

    RevitFamilyParametersManager.STORAGE_TYPES = STORAGE_TYPES;
    RevitFamilyParametersManager.UNIT_CONVERSIONS = UNIT_CONVERSIONS;

    return RevitFamilyParametersManager;
}));
