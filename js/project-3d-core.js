/*
 * ArqVertice Studio - Block J 3D Core.
 * UI-independent project model, scene graph, deterministic commands and history.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.Project3DCore = factory();
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const NODE_TYPES = Object.freeze([
        'Project', 'Building', 'Level', 'Zone', 'Scene', 'Node', 'Asset', 'Mesh',
        'Material', 'Texture', 'Light', 'Camera', 'Measurement', 'Annotation', 'View', 'BIMReference'
    ]);
    const COMMANDS = Object.freeze([
        'select', 'move', 'rotate', 'scale', 'hide', 'show', 'rename', 'duplicate',
        'delete', 'replaceAsset', 'changeMaterial', 'changeLight', 'changeCamera',
        'setVisibility', 'setTransform'
    ]);

    function clone(value) {
        return value === undefined ? value : JSON.parse(JSON.stringify(value));
    }

    function id(prefix) {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }

    function transform(value = {}) {
        return {
            position: { x: 0, y: 0, z: 0, ...(value.position || {}) },
            rotation: { x: 0, y: 0, z: 0, ...(value.rotation || {}) },
            scale: { x: 1, y: 1, z: 1, ...(value.scale || {}) }
        };
    }

    class Project3DCore {
        constructor(options = {}) {
            this.version = '1.0.0-block-j-3d-core';
            this.project = this._makeEntity({ type: 'Project', name: options.name || 'ArqVertice Project 3D', source: options.source || 'ArqVertice' });
            this.nodes = new Map([[this.project.id, this.project]]);
            this.assets = new Map();
            this.materials = new Map();
            this.scenes = new Map();
            this.selection = [];
            this.history = [];
            this.future = [];
            this.versions = { project: 1, scene: 1, asset: 1 };
        }

        _makeEntity(input = {}) {
            const entityId = input.id || id(String(input.type || 'node').toLowerCase());
            return {
                id: entityId,
                type: NODE_TYPES.includes(input.type) ? input.type : 'Node',
                name: input.name || entityId,
                parentId: input.parentId || null,
                children: Array.isArray(input.children) ? [...new Set(input.children)] : [],
                transform: transform(input.transform),
                visibility: input.visibility !== false,
                metadata: clone(input.metadata || {}),
                source: input.source || 'ArqVertice',
                version: Number(input.version) || 1,
                projectId: input.projectId || this.project?.id || null,
                sceneId: input.sceneId || null,
                assetId: input.assetId || null,
                nodeId: entityId,
                bimId: input.bimId || null,
                ifcId: input.ifcId || null,
                revitId: input.revitId || input.revitElementId || null
            };
        }

        _record(before, after, command) {
            this.history.push({ command: clone(command), before: clone(before), after: clone(after), timestamp: new Date().toISOString() });
            this.future = [];
        }

        _touch(entity) {
            entity.version += 1;
            this.versions.project += 1;
            if (entity.sceneId) this.versions.scene += 1;
            if (entity.assetId) this.versions.asset += 1;
        }

        _requireNode(nodeId) {
            const node = this.nodes.get(nodeId);
            if (!node) throw new Error(`Objeto 3D nao encontrado: ${nodeId}`);
            return node;
        }

        addNode(input = {}) {
            const node = this._makeEntity(input);
            if (node.parentId) this._requireNode(node.parentId).children.push(node.id);
            this.nodes.set(node.id, node);
            return clone(node);
        }

        createScene(name = 'Scene') {
            const scene = this.addNode({ type: 'Scene', name, parentId: this.project.id, sceneId: null });
            scene.sceneId = scene.id;
            this.nodes.set(scene.id, scene);
            this.scenes.set(scene.id, scene);
            return clone(scene);
        }

        addAsset(asset = {}) {
            const item = this._makeEntity({ ...asset, type: 'Asset' });
            this.assets.set(item.id, item);
            this.versions.asset += 1;
            return clone(item);
        }

        addMaterial(material = {}) {
            const item = this._makeEntity({ ...material, type: 'Material' });
            this.materials.set(item.id, item);
            this.versions.asset += 1;
            return clone(item);
        }

        getNode(nodeId) { return clone(this.nodes.get(nodeId) || null); }
        listNodes() { return Array.from(this.nodes.values()).map(clone); }
        getProject() { return clone(this.project); }

        execute(command = {}) {
            if (!COMMANDS.includes(command.type)) throw new Error(`Comando 3D nao permitido: ${command.type}`);
            const before = this.serialize();
            const node = command.type === 'select' ? null : this._requireNode(command.nodeId);
            let result;
            switch (command.type) {
                case 'select':
                    this._requireNode(command.nodeId);
                    this.selection = [command.nodeId];
                    result = { selected: command.nodeId };
                    break;
                case 'move':
                case 'rotate':
                case 'scale':
                    node.transform[command.type === 'move' ? 'position' : command.type] = { ...node.transform[command.type === 'move' ? 'position' : command.type], ...(command.value || {}) };
                    this._touch(node);
                    result = clone(node);
                    break;
                case 'setTransform':
                    node.transform = transform(command.value);
                    this._touch(node);
                    result = clone(node);
                    break;
                case 'hide':
                case 'show':
                case 'setVisibility':
                    node.visibility = command.type === 'hide' ? false : command.type === 'show' ? true : !!command.value;
                    this._touch(node);
                    result = clone(node);
                    break;
                case 'rename':
                    node.name = String(command.value || '').trim() || node.name;
                    this._touch(node);
                    result = clone(node);
                    break;
                case 'duplicate': {
                    const duplicate = this.addNode({ ...node, id: null, name: command.name || `${node.name} Copy`, parentId: node.parentId });
                    result = duplicate;
                    break;
                }
                case 'delete':
                    if (node.id === this.project.id) throw new Error('O projeto raiz nao pode ser excluido.');
                    const descendants = this.listNodes().filter(candidate => {
                        let parentId = candidate.parentId;
                        while (parentId) {
                            if (parentId === node.id) return true;
                            parentId = this.nodes.get(parentId)?.parentId || null;
                        }
                        return false;
                    });
                    descendants.forEach(child => this.nodes.delete(child.id));
                    this.nodes.delete(node.id);
                    if (node.parentId && this.nodes.has(node.parentId)) this.nodes.get(node.parentId).children = this.nodes.get(node.parentId).children.filter(childId => childId !== node.id);
                    result = { deleted: node.id };
                    break;
                case 'replaceAsset':
                    node.assetId = command.assetId || null;
                    this._touch(node);
                    result = clone(node);
                    break;
                case 'changeMaterial':
                    node.metadata.materialId = command.materialId || null;
                    this._touch(node);
                    result = clone(node);
                    break;
                case 'changeLight':
                case 'changeCamera':
                    node.metadata.settings = clone(command.value || {});
                    this._touch(node);
                    result = clone(node);
                    break;
                default:
                    throw new Error(`Comando nao implementado: ${command.type}`);
            }
            this._record(before, this.serialize(), command);
            return { success: true, command: command.type, result, projectVersion: this.versions.project };
        }

        undo() {
            const entry = this.history.pop();
            if (!entry) return { success: false, reason: 'EMPTY_HISTORY' };
            this._restore(entry.before);
            this.future.push(entry);
            return { success: true, command: entry.command.type };
        }

        redo() {
            const entry = this.future.pop();
            if (!entry) return { success: false, reason: 'EMPTY_FUTURE' };
            this._restore(entry.after);
            this.history.push(entry);
            return { success: true, command: entry.command.type };
        }

        _restore(snapshot) {
            this.project = clone(snapshot.project);
            this.nodes = new Map(snapshot.nodes.map(node => [node.id, node]));
            this.assets = new Map(snapshot.assets.map(asset => [asset.id, asset]));
            this.materials = new Map(snapshot.materials.map(material => [material.id, material]));
            this.scenes = new Map(snapshot.scenes.map(scene => [scene.id, scene]));
            this.selection = clone(snapshot.selection);
            this.versions = clone(snapshot.versions);
        }

        serialize() {
            return {
                project: clone(this.project), nodes: this.listNodes(), assets: Array.from(this.assets.values()).map(clone),
                materials: Array.from(this.materials.values()).map(clone), scenes: Array.from(this.scenes.values()).map(clone),
                selection: clone(this.selection), versions: clone(this.versions)
            };
        }

        load(snapshot) {
            if (!snapshot || !snapshot.project || !Array.isArray(snapshot.nodes)) throw new Error('Snapshot 3D invalido.');
            this._restore(snapshot);
            this.history = [];
            this.future = [];
            return this.serialize();
        }
    }

    Project3DCore.NODE_TYPES = NODE_TYPES;
    Project3DCore.COMMANDS = COMMANDS;
    return Project3DCore;
}));
