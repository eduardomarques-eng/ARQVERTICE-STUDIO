/**
 * ArqVértice Studio — Bloco J38: Universal Revit Element Import
 *
 * Extrai elementos Revit por uma interface única e os transforma em DTOs
 * rastreáveis para a ArqScene. Nenhuma família específica deve implementar
 * seu próprio importador.
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.RevitElementExtractor = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const SUPPORTED_CATEGORIES = Object.freeze([
        'Wall', 'Floor', 'Roof', 'Ceiling', 'Door', 'Window', 'Furniture',
        'Casework', 'Generic Model', 'Column', 'Beam', 'Stair', 'Railing',
        'Curtain Wall', 'Curtain Panel', 'Equipment', 'Lighting', 'Plumbing',
        'Mechanical', 'Structural'
    ]);
    const INPUT_SOURCES = Object.freeze([
        'Current Selection', 'Current View', 'Room', 'Level', 'Category',
        'Family', 'Type', 'Filter', 'Element IDs'
    ]);
    const DUPLICATE_POLICIES = Object.freeze(['reuse', 'update', 'replace', 'duplicate']);

    function clone(value) {
        return value === undefined || value === null ? value : JSON.parse(JSON.stringify(value));
    }

    function canonicalCategory(category) {
        const value = String(category || '').trim().toLowerCase();
        const aliases = {
            walls: 'Wall', floors: 'Floor', roofs: 'Roof', ceilings: 'Ceiling',
            doors: 'Door', windows: 'Window', furnishings: 'Furniture',
            columns: 'Column', beams: 'Beam', stairs: 'Stair', railings: 'Railing',
            'generic models': 'Generic Model', 'curtain walls': 'Curtain Wall',
            'curtain panels': 'Curtain Panel'
        };
        return aliases[value] || SUPPORTED_CATEGORIES.find(item => item.toLowerCase() === value) || category || 'Generic Model';
    }

    function queryCategory(category) {
        const canonical = canonicalCategory(category);
        return canonical === 'Wall' ? 'Walls' : `${canonical}s`;
    }

    function normalizeElement(element, context = {}) {
        const geometry = clone(element.geometry || {});
        const materials = clone(element.materials || (element.material ? [element.material] : []));
        return {
            id: element.id !== undefined ? element.id : element.elementId,
            source: element.source || 'Revit',
            sourceId: element.sourceId !== undefined ? element.sourceId : (element.id !== undefined ? element.id : element.elementId),
            version: element.version || 1,
            uniqueId: element.uniqueId || element.revitUniqueId,
            documentId: element.documentId || context.documentId || 'ACTIVE_DOC',
            sourceDocument: element.sourceDocument || context.documentId || 'ACTIVE_DOC',
            sourceView: element.sourceView || context.currentView || null,
            category: canonicalCategory(element.category),
            family: element.family || 'Standard',
            type: element.type || 'Default',
            level: element.level || null,
            room: element.room || element.roomName || context.room || null,
            parameters: clone(element.parameters || {}),
            geometry: {
                solid: clone(geometry.solid || element.solid || null),
                mesh: clone(geometry.mesh || element.mesh || null),
                curve: clone(geometry.curve || element.curve || null),
                transform: clone(geometry.transform || element.transform || null),
                boundingBox: clone(geometry.boundingBox || element.boundingBox || null)
            },
            geometryFormat: element.geometryFormat || 'revit-dto',
            materials,
            material: clone(element.material || materials[0] || null),
            materialsByFace: clone(element.materialsByFace || element.faceMaterials || null),
            transform: clone(element.transform || geometry.transform || null),
            host: clone(element.host || null),
            nestedInstances: clone(element.nestedInstances || element.subcomponents || []),
            metadata: clone(element.metadata || {})
        };
    }

    class RevitElementExtractor {
        constructor(readEngine, options = {}) {
            if (!readEngine) throw new Error('RevitElementExtractor exige um RevitReadEngine.');
            this.readEngine = readEngine;
            this.batchSize = Math.max(1, Number(options.batchSize) || 50);
            this.supportedCategories = SUPPORTED_CATEGORIES;
        }

        async resolveInput(input = {}) {
            const source = input.source || 'Current Selection';
            if (!INPUT_SOURCES.includes(source)) {
                throw new Error(`Fonte de entrada Revit inválida: ${source}`);
            }
            const context = input.context || {};
            let elements;

            if (source === 'Current Selection') {
                const result = await this.readEngine.getSelection();
                elements = result.elements;
            } else if (source === 'Current View') {
                const view = await this.readEngine.getCurrentView();
                elements = await this.readEngine.queryElements({ ...input.filter, viewId: view.id });
            } else if (source === 'Element IDs') {
                const ids = Array.isArray(input.elementIds) ? input.elementIds : [];
                elements = [];
                for (const id of ids) elements.push(await this.readEngine.queryElements({ ...input.filter, elementId: id }));
                elements = elements.flat();
            } else {
                elements = await this.readEngine.queryElements({
                    category: input.category ? queryCategory(input.category) : undefined,
                    level: source === 'Level' ? input.level : input.filter && input.filter.level,
                    family: source === 'Family' ? input.family : input.filter && input.filter.family,
                    type: source === 'Type' ? input.type : input.filter && input.filter.type,
                    room: source === 'Room' ? input.room : input.filter && input.filter.room,
                    ...input.filter
                });
            }

            return {
                source,
                context: clone(context),
                elements: elements.map(element => normalizeElement(element, context))
            };
        }

        async extract(input = {}, options = {}) {
            const resolved = await this.resolveInput(input);
            const elements = [];
            const total = resolved.elements.length;
            const onProgress = typeof options.onProgress === 'function' ? options.onProgress : () => {};

            for (let index = 0; index < total; index += this.batchSize) {
                if (options.signal && options.signal.aborted) {
                    return { cancelled: true, source: resolved.source, total, extracted: elements.length, elements };
                }
                const batch = resolved.elements.slice(index, index + this.batchSize);
                elements.push(...batch);
                onProgress({ processed: elements.length, total, percentage: total ? Math.round(elements.length / total * 100) : 100 });
                if (options.yieldToEventLoop !== false) await Promise.resolve();
            }

            return {
                cancelled: false,
                source: resolved.source,
                total,
                extracted: elements.length,
                elements
            };
        }
    }

    RevitElementExtractor.SUPPORTED_CATEGORIES = SUPPORTED_CATEGORIES;
    RevitElementExtractor.INPUT_SOURCES = INPUT_SOURCES;
    RevitElementExtractor.DUPLICATE_POLICIES = DUPLICATE_POLICIES;
    RevitElementExtractor.normalizeElement = normalizeElement;
    return RevitElementExtractor;
}));
