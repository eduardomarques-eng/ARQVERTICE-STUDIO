/**
 * ArqVértice Studio — Bloco J: J18 — Revit Read Engine
 * 
 * Motor de Leitura Profunda e Normalização de Modelos Autodesk Revit.
 * Lê Projeto, Níveis, Vistas, Famílias, Materiais, Quantitativos, Saúde do Modelo
 * e normaliza todas as entidades para o schema canônico ArqVerticeBimElement.
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.RevitReadEngine = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /**
     * Schema Canônico ArqVerticeBimElement
     * Desacopla o frontend e a IA de qualquer dependência direta de classes proprietárias do Revit
     */
    class ArqVerticeBimElement {
        constructor({
            id,
            uniqueId,
            documentId = 'ACTIVE_DOC',
            category = 'General',
            family = 'Standard',
            type = 'Default',
            level = 'Nível 1',
            phase = 'Nova Construção',
            parameters = {},
            geometry = {},
            quantities = {},
            materials = [],
            status = 'ACTIVE',
            room = null,
            transform = null,
            materialsByFace = null,
            host = null,
            nestedInstances = [],
            metadata = {}
        }) {
            this.id = id;
            this.uniqueId = uniqueId || `revit_${id}`;
            this.documentId = documentId;
            this.category = category;
            this.family = family;
            this.type = type;
            this.level = level;
            this.phase = phase;
            this.parameters = parameters;
            this.geometry = {
                ...geometry,
                boundingBox: geometry.boundingBox || null,
                locationPoint: geometry.locationPoint || null,
                lengthM: geometry.lengthM || 0,
                heightM: geometry.heightM || 0
            };
            this.quantities = {
                areaM2: quantities.areaM2 || 0,
                volumeM3: quantities.volumeM3 || 0,
                count: quantities.count || 1
            };
            this.materials = materials;
            this.materialsByFace = materialsByFace;
            this.transform = transform;
            this.room = room;
            this.host = host;
            this.nestedInstances = nestedInstances;
            this.metadata = metadata;
            this.status = status;
            this.normalizedAt = new Date().toISOString();
        }
    }

    class RevitReadEngine {
        constructor(connector, options = {}) {
            this.version = '1.0.0-bloco-j18';
            this.connector = connector;
            this.debug = !!options.debug;
            this.cache = new Map();
        }

        /**
         * 1. Ler Informações Gerais do Projeto
         */
        async getProjectInfo() {
            const res = await this.connector.sendCommand({
                operation: 'GET_PROJECT_INFO',
                mode: 'read'
            });
            return res.result || {};
        }

        /**
         * 2. Consulta de Elementos por Filtros Flexíveis
         */
        async queryElements(filter = {}) {
            const res = await this.connector.sendCommand({
                operation: 'QUERY_ELEMENTS',
                input: {
                    category: filter.category || 'Walls',
                    level: filter.level,
                    family: filter.family,
                    type: filter.type,
                    room: filter.room,
                    viewId: filter.viewId,
                    elementId: filter.elementId,
                    elementIds: filter.elementIds,
                    filter: filter.filter,
                    limit: filter.limit || 100
                },
                mode: 'read'
            });

            const rawElements = (res.result && res.result.elements) ? res.result.elements : [];
            const requestedIds = filter.elementIds || (filter.elementId !== undefined ? [filter.elementId] : null);
            const normalized = rawElements.map(raw => this.normalizeElement(raw));
            return normalized.filter(element => {
                if (requestedIds && !requestedIds.some(id => String(id) === String(element.id))) return false;
                if (filter.family && element.family !== filter.family) return false;
                if (filter.type && element.type !== filter.type) return false;
                if (filter.room && element.room && element.room !== filter.room) return false;
                return true;
            });
        }

        /**
         * 3. Capturar Elementos Selecionados Atualmente no Revit
         */
        async getSelection() {
            const res = await this.connector.sendCommand({
                operation: 'GET_SELECTION',
                mode: 'read'
            });

            const rawSelection = (res.result && res.result.elements) ? res.result.elements : [];
            return {
                count: res.result ? res.result.count : 0,
                elements: rawSelection.map(raw => this.normalizeElement(raw))
            };
        }

        /**
         * 4. Inspecionar Vista Ativa
         */
        async getCurrentView() {
            const res = await this.connector.sendCommand({
                operation: 'GET_CURRENT_VIEW',
                mode: 'read'
            });
            return res.result || {};
        }

        /**
         * 5. Extração de Quantitativos Automatizados (Áreas, Volumes, Comprimentos)
         */
        async getQuantities(category = 'Walls') {
            const elements = await this.queryElements({ category });
            let totalAreaM2 = 0;
            let totalVolumeM3 = 0;
            let totalCount = elements.length;

            elements.forEach(el => {
                totalAreaM2 += (el.quantities.areaM2 || 0);
                totalVolumeM3 += (el.quantities.volumeM3 || 0);
            });

            return {
                category,
                totalCount,
                totalAreaM2: Math.round(totalAreaM2 * 100) / 100,
                totalVolumeM3: Math.round(totalVolumeM3 * 100) / 100,
                unitSystem: 'Metric (Meters)'
            };
        }

        /**
         * 6. Auditoria de Saúde do Modelo (Warnings, Erros, Referências Não Resolvidas)
         */
        async auditModelHealth() {
            const res = await this.connector.sendCommand({
                operation: 'AUDIT_MODEL_HEALTH',
                mode: 'read'
            });
            const health = res.result || {};

            return {
                healthy: (health.totalWarnings || 0) < 10 && (health.missingReferences || 0) === 0,
                totalWarnings: health.totalWarnings || 0,
                warnings: health.warnings || [],
                missingReferences: health.missingReferences || 0,
                unresolvedLinks: health.unresolvedLinks || 0,
                unusedFamiliesCount: health.unusedFamiliesCount || 0,
                auditedAt: new Date().toISOString()
            };
        }

        /**
         * 7. Normalização de Entidade para o Schema ArqVerticeBimElement
         */
        normalizeElement(raw = {}) {
            return new ArqVerticeBimElement({
                id: raw.id || 0,
                uniqueId: raw.uniqueId || `revit_${raw.id}`,
                category: raw.category || 'Walls',
                family: raw.family || 'Parede Padrão',
                type: raw.type || 'Alvenaria 15cm',
                level: raw.level || 'Pavimento Térreo',
                parameters: {
                    comprimento: raw.lengthM || 5.0,
                    altura: raw.heightM || 3.0,
                    espessura: raw.thicknessM || 0.15,
                    funcao: raw.function || 'Externa',
                    ...raw.parameters
                },
                geometry: {
                    lengthM: raw.lengthM || 5.0,
                    heightM: raw.heightM || 3.0,
                    boundingBox: raw.boundingBox || { min: [0, 0, 0], max: [5, 0.15, 3] },
                    solid: raw.solid,
                    mesh: raw.mesh,
                    curve: raw.curve,
                    transform: raw.transform
                },
                quantities: {
                    areaM2: raw.areaM2 || (raw.lengthM || 5.0) * (raw.heightM || 3.0),
                    volumeM3: raw.volumeM3 || (raw.lengthM || 5.0) * (raw.heightM || 3.0) * (raw.thicknessM || 0.15),
                    count: 1
                },
                materials: raw.materials || [{ name: 'Alvenaria Cerâmica', areaM2: 15.0 }],
                room: raw.room || raw.roomName || null,
                transform: raw.transform || null,
                materialsByFace: raw.materialsByFace || raw.faceMaterials || null,
                host: raw.host || null,
                nestedInstances: raw.nestedInstances || raw.subcomponents || [],
                metadata: raw.metadata || {}
            });
        }
    }

    RevitReadEngine.ArqVerticeBimElement = ArqVerticeBimElement;
    return RevitReadEngine;
}));
