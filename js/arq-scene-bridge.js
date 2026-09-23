/**
 * ArqVértice Studio — Bloco J36: Revit -> ArqScene 3D Bridge
 *
 * Representação de trabalho desacoplada do Revit. Importa DTOs normalizados,
 * preserva proveniência e mantém alterações de estudo somente nesta cena.
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.ArqScene = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const RENDER_MODES = Object.freeze(['BIM', 'Clay', 'Material', 'Presentation', 'Photoreal', 'AI Reference']);
    const DETAIL_LEVELS = Object.freeze(['Preview', 'Interactive', 'High', 'Render']);
    const VISIBILITY_STATES = Object.freeze(['show', 'hide', 'ghost', 'transparent']);
    const SCENE_LAYERS = Object.freeze(['Revit', 'ArqVertice', 'Study', 'AI', 'Presentation']);
    const LIGHTING_PRESETS = Object.freeze(['Day', 'Golden Hour', 'Blue Hour', 'Interior', 'Studio', 'Overcast']);

    function clone(value) {
        if (value === undefined || value === null) return value;
        return JSON.parse(JSON.stringify(value));
    }

    function normalizeTransform(transform) {
        return clone(transform || {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
        });
    }

    function materialFrom(element) {
        const first = Array.isArray(element.materials) ? element.materials[0] : null;
        return clone(element.material || first || {
            name: 'Sem material informado',
            color: null,
            transparency: 0,
            textureReferences: [],
            appearanceMetadata: {}
        });
    }

    class ArqSceneObject {
        constructor(element, context = {}) {
            const id = element.id !== undefined ? element.id : element.elementId;
            if (id === undefined || id === null) {
                throw new Error('Elemento Revit sem id nao pode ser importado para ArqScene.');
            }
            this.arqSceneId = context.arqSceneId || `arqobj_${context.documentId || 'doc'}_${id}`;
            this.source = element.source || 'Revit';
            this.sourceId = element.sourceId !== undefined ? element.sourceId : id;
            this.version = element.version || 1;
            this.revitDocumentId = element.documentId || context.documentId || 'ACTIVE_DOC';
            this.revitElementId = id;
            this.revitUniqueId = element.uniqueId || element.revitUniqueId || `revit_${id}`;
            this.category = element.category || 'General';
            this.family = element.family || 'Standard';
            this.type = element.type || 'Default';
            this.level = element.level || null;
            this.material = materialFrom(element);
            this.materials = clone(element.materials || []);
            this.materialsByFace = clone(element.materialsByFace || element.faceMaterials || null);
            this.transform = normalizeTransform(element.transform);
            this.parameters = clone(element.parameters || {});
            this.room = element.room || element.roomName || null;
            this.sourceView = element.sourceView || null;
            this.geometry = clone(element.geometry || element.mesh || {});
            this.geometryFormat = element.geometryFormat || (this.geometry && this.geometry.format) || 'mesh-buffers';
            this.sourceDocument = element.sourceDocument || this.revitDocumentId;
            this.linkInstance = element.linkInstance || null;
            this.linkTransform = normalizeTransform(element.linkTransform);
            this.host = clone(element.host || null);
            this.nestedInstances = clone(element.nestedInstances || element.subcomponents || []);
            this.metadata = clone(element.metadata || {});
            this.visibility = 'show';
            this.selected = false;
            this.materialOverride = clone(element.materialOverride || null);
            this.studyChanges = clone(element.studyChanges || []);
        }

        get effectiveMaterial() {
            return clone(this.materialOverride || this.material);
        }
    }

    class ArqScene {
        constructor(options = {}) {
            this.version = '1.0.0-bloco-j36';
            this.sceneId = options.sceneId || `arqscene_${Date.now()}`;
            this.projectId = options.projectId || null;
            this.documentId = options.documentId || null;
            this.name = options.name || 'ArqScene';
            this.camera = clone(options.camera || {
                position: { x: 0, y: 0, z: 10 },
                target: { x: 0, y: 0, z: 0 },
                fov: 45
            });
            this.lights = clone(options.lights || []);
            this.objects = new Map();
            this.annotations = [];
            this.metadata = clone(options.metadata || {});
            this.renderMode = 'BIM';
            this.detailLevel = 'Interactive';
            this.studyMode = false;
            this.selectedObjectId = null;
            this.isolateSet = null;
            this.readOnlySource = true;
            this.bimLocked = false;
            this.layers = Object.fromEntries(SCENE_LAYERS.map(layer => [layer, { visible: true, locked: layer === 'Revit' }]));
            this.studyObjects = new Map();
            this.materialOptions = [];
            this.cameras = new Map();
            this.lighting = { preset: 'Day', settings: {} };
            this.renderHistory = [];
        }

        importElements(elements, options = {}) {
            if (!Array.isArray(elements)) {
                throw new Error('A importacao da ArqScene exige uma lista de elementos.');
            }
            const duplicatePolicy = options.duplicatePolicy || 'update';
            if (!['reuse', 'update', 'replace', 'duplicate'].includes(duplicatePolicy)) {
                throw new Error(`Politica de duplicata invalida: ${duplicatePolicy}`);
            }
            const context = {
                documentId: options.documentId || this.documentId || 'ACTIVE_DOC',
                sourceDocument: options.sourceDocument
            };
            const imported = [];
            const reused = [];
            const updated = [];
            const replaced = [];
            const duplicated = [];
            elements.forEach((element) => {
                const object = new ArqSceneObject(element, context);
                const existing = this.getObject(object.revitUniqueId) || this.getObject(object.revitElementId);
                if (!existing || duplicatePolicy === 'duplicate') {
                    const sceneId = existing && duplicatePolicy === 'duplicate'
                        ? `${object.arqSceneId}_${Date.now()}_${duplicated.length + 1}`
                        : object.arqSceneId;
                    object.arqSceneId = sceneId;
                    this.objects.set(sceneId, object);
                    imported.push(sceneId);
                    if (existing) duplicated.push(sceneId);
                    return;
                }
                if (duplicatePolicy === 'reuse') {
                    reused.push(existing.arqSceneId);
                    return;
                }
                if (duplicatePolicy === 'replace') {
                    object.arqSceneId = existing.arqSceneId;
                    this.objects.set(existing.arqSceneId, object);
                    replaced.push(existing.arqSceneId);
                    return;
                }
                object.arqSceneId = existing.arqSceneId;
                this.objects.set(existing.arqSceneId, object);
                updated.push(existing.arqSceneId);
            });
            if (options.projectId) this.projectId = options.projectId;
            if (context.documentId) this.documentId = context.documentId;
            return {
                ...this.getSummary(),
                imported,
                reused,
                updated,
                replaced,
                duplicated,
                duplicatePolicy
            };
        }

        importElement(element, options = {}) {
            return this.importElements([element], options);
        }

        setBimLock(locked = true) {
            this.bimLocked = Boolean(locked);
            this.layers.Revit.locked = this.bimLocked;
            return this.bimLocked;
        }

        addStudyObject(object = {}) {
            if (!object.id) throw new Error('Objeto de estudo exige id.');
            const studyObject = {
                id: object.id,
                arqSceneId: object.arqSceneId || `study_${object.id}`,
                layer: object.layer || 'Study',
                kind: object.kind || 'study-object',
                source: 'ARQVERTICE_ONLY',
                geometry: clone(object.geometry || {}),
                material: clone(object.material || null),
                transform: normalizeTransform(object.transform),
                metadata: clone(object.metadata || {})
            };
            if (!SCENE_LAYERS.includes(studyObject.layer) || studyObject.layer === 'Revit') {
                throw new Error('Objetos de estudo devem pertencer a uma camada visual ArqVértice.');
            }
            this.studyObjects.set(studyObject.arqSceneId, studyObject);
            return clone(studyObject);
        }

        setLayerVisibility(layer, visible) {
            if (!SCENE_LAYERS.includes(layer)) throw new Error(`Camada de cena inválida: ${layer}`);
            this.layers[layer].visible = Boolean(visible);
            return clone(this.layers[layer]);
        }

        saveMaterialOption(name, material, metadata = {}) {
            if (!name || !material) throw new Error('Opção de material exige nome e material.');
            const option = { id: `material_${Date.now()}_${this.materialOptions.length + 1}`, name, material: clone(material), metadata: clone(metadata), createdAt: new Date().toISOString() };
            this.materialOptions.push(option);
            return clone(option);
        }

        compareMaterial(id, material) {
            const object = this.getObject(id);
            if (!object) throw new Error(`Objeto ArqScene não encontrado: ${id}`);
            return {
                original: clone(object.material),
                current: clone(object.effectiveMaterial),
                candidate: clone(material),
                preservesBimGeometry: true
            };
        }

        saveCamera(name, camera = this.camera, options = {}) {
            if (!name) throw new Error('Câmera exige nome.');
            const item = {
                id: options.id || `camera_${Date.now()}_${this.cameras.size + 1}`,
                name,
                origin: options.origin || 'MANUAL',
                locked: Boolean(options.locked),
                camera: clone(camera),
                createdAt: new Date().toISOString()
            };
            this.cameras.set(item.id, item);
            return clone(item);
        }

        duplicateCamera(id, name) {
            const source = this.cameras.get(id);
            if (!source) throw new Error(`Câmera não encontrada: ${id}`);
            return this.saveCamera(name || `${source.name} Copy`, source.camera, { origin: source.origin });
        }

        setLightingPreset(preset, settings = {}) {
            if (!LIGHTING_PRESETS.includes(preset)) throw new Error(`Preset de iluminação inválido: ${preset}`);
            this.lighting = { preset, settings: clone(settings) };
            return clone(this.lighting);
        }

        recordRender(type, payload = {}) {
            if (!['BIM', 'AI', 'DIFFERENCE'].includes(type)) throw new Error(`Tipo de render inválido: ${type}`);
            const render = {
                id: `render_${Date.now()}_${this.renderHistory.length + 1}`,
                type,
                camera: clone(payload.camera || this.camera),
                material: clone(payload.material || null),
                lighting: clone(payload.lighting || this.lighting),
                image: payload.image || null,
                metadata: clone(payload.metadata || {}),
                createdAt: new Date().toISOString()
            };
            this.renderHistory.push(render);
            return clone(render);
        }

        prepareAIRenderContext(instruction, options = {}) {
            return {
                instruction: String(instruction || ''),
                preserveGeometry: options.preserveGeometry !== false,
                preserveCamera: options.preserveCamera !== false,
                preserveScale: options.preserveScale !== false,
                bimLocked: this.bimLocked,
                sceneId: this.sceneId,
                camera: clone(options.camera || this.camera),
                lighting: clone(options.lighting || this.lighting),
                layers: clone(this.layers),
                objectCount: this.objects.size,
                studyObjectCount: this.studyObjects.size
            };
        }

        getObject(id) {
            return this.objects.get(id) || Array.from(this.objects.values())
                .find((object) => String(object.revitElementId) === String(id) ||
                    object.revitUniqueId === id);
        }

        listObjects(filter = {}) {
            return Array.from(this.objects.values()).filter((object) => {
                if (filter.category && object.category !== filter.category) return false;
                if (filter.level && object.level !== filter.level) return false;
                if (filter.visibility && object.visibility !== filter.visibility) return false;
                return true;
            });
        }

        setVisibility(id, state) {
            if (!VISIBILITY_STATES.includes(state)) {
                throw new Error(`Estado de visibilidade invalido: ${state}`);
            }
            const object = this.getObject(id);
            if (!object) throw new Error(`Objeto ArqScene nao encontrado: ${id}`);
            object.visibility = state;
            return clone(object);
        }

        hide(id) { return this.setVisibility(id, 'hide'); }
        show(id) { return this.setVisibility(id, 'show'); }
        ghost(id) { return this.setVisibility(id, 'ghost'); }
        transparent(id) { return this.setVisibility(id, 'transparent'); }

        isolate(ids) {
            const requested = Array.isArray(ids) ? ids : [ids];
            const found = requested.map((id) => this.getObject(id)).filter(Boolean);
            this.isolateSet = new Set(found.map((object) => object.arqSceneId));
            this.objects.forEach((object) => {
                object.visibility = this.isolateSet.has(object.arqSceneId) ? 'show' : 'hide';
            });
            return found.map((object) => object.arqSceneId);
        }

        solo(id) {
            return this.isolate(id);
        }

        clearIsolation() {
            this.isolateSet = null;
            this.objects.forEach((object) => {
                if (object.visibility === 'hide') object.visibility = 'show';
            });
        }

        select(id) {
            const object = this.getObject(id);
            this.objects.forEach((item) => { item.selected = false; });
            this.selectedObjectId = object ? object.arqSceneId : null;
            if (object) object.selected = true;
            return object ? this.getSelectionInfo(object.arqSceneId) : null;
        }

        getSelectionInfo(id = this.selectedObjectId) {
            const object = this.objects.get(id);
            if (!object) return null;
            return {
                arqSceneId: object.arqSceneId,
                revitDocumentId: object.revitDocumentId,
                revitElementId: object.revitElementId,
                revitUniqueId: object.revitUniqueId,
                category: object.category,
                family: object.family,
                type: object.type,
                level: object.level,
                room: object.room,
                material: object.effectiveMaterial,
                parameters: clone(object.parameters),
                sourceView: object.sourceView,
                sourceDocument: object.sourceDocument,
                linkInstance: object.linkInstance
            };
        }

        setRenderMode(mode) {
            if (!RENDER_MODES.includes(mode)) throw new Error(`Modo de render invalido: ${mode}`);
            this.renderMode = mode;
            return mode;
        }

        setDetailLevel(level) {
            if (!DETAIL_LEVELS.includes(level)) throw new Error(`Nivel de detalhe invalido: ${level}`);
            this.detailLevel = level;
            return level;
        }

        setStudyMode(enabled = true) {
            this.studyMode = Boolean(enabled);
            return this.studyMode;
        }

        overrideMaterial(id, material) {
            if (!this.studyMode) {
                throw new Error('Substituicoes de material exigem Study Mode ativo.');
            }
            const object = this.getObject(id);
            if (!object) throw new Error(`Objeto ArqScene nao encontrado: ${id}`);
            object.materialOverride = clone(material);
            object.studyChanges.push({ type: 'MATERIAL_OVERRIDE', material: clone(material), at: new Date().toISOString() });
            return object.effectiveMaterial;
        }

        syncCameraFromRevit(view) {
            this.camera = clone(view || this.camera);
            return clone(this.camera);
        }

        getPresentationCamera() {
            return clone(this.camera);
        }

        addAnnotation(annotation) {
            const item = { id: `annotation_${this.annotations.length + 1}`, ...clone(annotation) };
            this.annotations.push(item);
            return clone(item);
        }

        getSummary() {
            return {
                sceneId: this.sceneId,
                projectId: this.projectId,
                documentId: this.documentId,
                objectCount: this.objects.size,
                renderMode: this.renderMode,
                detailLevel: this.detailLevel,
                studyMode: this.studyMode,
                readOnlySource: this.readOnlySource,
                bimLocked: this.bimLocked,
                layers: clone(this.layers),
                studyObjectCount: this.studyObjects.size,
                cameraCount: this.cameras.size,
                lightingPreset: this.lighting.preset,
                renderCount: this.renderHistory.length
            };
        }
    }

    ArqScene.RENDER_MODES = RENDER_MODES;
    ArqScene.DETAIL_LEVELS = DETAIL_LEVELS;
    ArqScene.VISIBILITY_STATES = VISIBILITY_STATES;
    ArqScene.SCENE_LAYERS = SCENE_LAYERS;
    ArqScene.LIGHTING_PRESETS = LIGHTING_PRESETS;
    ArqScene.ArqSceneObject = ArqSceneObject;
    return ArqScene;
}));
