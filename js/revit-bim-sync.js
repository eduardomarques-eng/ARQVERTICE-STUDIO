/**
 * ArqVértice Studio — Bloco J40: Bidirectional BIM Sync
 *
 * Sincronização explícita entre DTOs Revit e a cena visual. Alterações de
 * estudo não são convertidas em transações Revit.
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.RevitBimSync = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const SYNC_STATES = Object.freeze([
        'IN_SYNC', 'REVIT_CHANGED', 'ARQ_CHANGED', 'BOTH_CHANGED',
        'CONFLICT', 'UNTRACKED'
    ]);
    const TRACKED_FIELDS = Object.freeze([
        'geometry', 'transform', 'type', 'family', 'material',
        'parameters', 'visibility'
    ]);
    const VISUAL_ONLY_FIELDS = Object.freeze(['visibility']);
    const RESOLUTIONS = Object.freeze(['Keep Revit', 'Keep ArqVertice', 'Merge', 'Cancel']);

    function clone(value) {
        return value === undefined || value === null ? value : JSON.parse(JSON.stringify(value));
    }

    function stable(value) {
        if (value === undefined) return 'undefined';
        if (value === null || typeof value !== 'object') return JSON.stringify(value);
        if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
        return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
    }

    function snapshotObject(object) {
        return {
            id: object.id !== undefined ? object.id : object.elementId,
            elementId: object.elementId !== undefined ? object.elementId : object.id,
            uniqueId: object.uniqueId || object.revitUniqueId,
            source: object.source || 'Revit',
            sourceId: object.sourceId || object.revitElementId,
            revitUniqueId: object.revitUniqueId,
            version: object.version || 1,
            geometry: clone(object.geometry),
            transform: clone(object.transform),
            type: object.type,
            family: object.family,
            material: clone(object.material),
            parameters: clone(object.parameters),
            visibility: object.visibility
        };
    }

    function changedFields(before, after) {
        return TRACKED_FIELDS.filter(field => stable(before && before[field]) !== stable(after && after[field]));
    }

    class RevitBimSync {
        constructor({ readEngine, writeEngine, scene } = {}) {
            if (!readEngine || !scene) throw new Error('RevitBimSync exige readEngine e scene.');
            this.readEngine = readEngine;
            this.writeEngine = writeEngine || null;
            this.scene = scene;
            this.snapshots = new Map();
            this.changeSets = [];
            this.conflicts = [];
        }

        registerSnapshot(objects = this.scene.listObjects(), metadata = {}) {
            const snapshot = {
                id: `snapshot_${Date.now()}_${this.snapshots.size + 1}`,
                createdAt: new Date().toISOString(),
                metadata: clone(metadata),
                objects: objects.map(snapshotObject)
            };
            this.snapshots.set(snapshot.id, snapshot);
            return clone(snapshot);
        }

        getLatestSnapshot() {
            const snapshots = Array.from(this.snapshots.values());
            return snapshots.length ? snapshots[snapshots.length - 1] : null;
        }

        _findSnapshotObject(snapshot, object) {
            if (!snapshot) return null;
            return snapshot.objects.find(item =>
                item.revitUniqueId === object.revitUniqueId ||
                String(item.sourceId) === String(object.revitElementId)
            ) || null;
        }

        async detectChanges(options = {}) {
            const snapshot = options.snapshot || this.getLatestSnapshot();
            if (!snapshot) {
                return { state: 'UNTRACKED', snapshot: null, items: [], conflicts: [] };
            }
            const currentObjects = options.objects || this.scene.listObjects();
            const items = [];
            for (const object of currentObjects) {
                const last = this._findSnapshotObject(snapshot, object);
                if (!last) {
                    items.push({ state: 'UNTRACKED', object: snapshotObject(object), fields: TRACKED_FIELDS.slice() });
                    continue;
                }
                const arqChanged = changedFields(last, snapshotObject(object));
                let revitObject = null;
                if (options.fetchRevit !== false && this.readEngine.readElement && object.revitElementId !== undefined) {
                    const fetched = await this.readEngine.readElement(object.revitElementId);
                    revitObject = fetched ? snapshotObject({ ...fetched, revitElementId: object.revitElementId }) : null;
                }
                const revitChanged = revitObject ? changedFields(last, revitObject) : [];
                const arqOnly = arqChanged.filter(field => !revitChanged.includes(field));
                const revitOnly = revitChanged.filter(field => !arqChanged.includes(field));
                const both = arqChanged.filter(field => revitChanged.includes(field));
                let state = 'IN_SYNC';
                if (both.length) state = 'CONFLICT';
                else if (arqOnly.length && revitOnly.length) state = 'BOTH_CHANGED';
                else if (arqOnly.length) state = 'ARQ_CHANGED';
                else if (revitOnly.length) state = 'REVIT_CHANGED';
                items.push({
                    state,
                    object: snapshotObject(object),
                    lastSync: clone(last),
                    revit: revitObject,
                    arqVertice: snapshotObject(object),
                    fields: both.length ? both : [...arqOnly, ...revitOnly]
                });
                if (state === 'CONFLICT') this.conflicts.push({ object: snapshotObject(object), fields: both });
            }
            return { state: items.some(item => item.state === 'CONFLICT') ? 'CONFLICT' : (items[0] && items[0].state) || 'IN_SYNC', snapshot: clone(snapshot), items, conflicts: items.filter(item => item.state === 'CONFLICT') };
        }

        createChangeSet(items = [], user = 'unknown', options = {}) {
            const visualOnlyFields = new Set(options.visualOnlyFields || VISUAL_ONLY_FIELDS);
            const changes = items.filter(item => item.state === 'ARQ_CHANGED' || item.state === 'CONFLICT')
                .flatMap(item => item.fields
                    .filter(field => !visualOnlyFields.has(field))
                    .map(field => ({
                    element: item.object.revitUniqueId || item.object.sourceId,
                    field,
                    oldValue: clone(item.lastSync && item.lastSync[field]),
                    newValue: clone(item.arqVertice && item.arqVertice[field]),
                    source: 'ArqVertice',
                    user,
                    timestamp: new Date().toISOString()
                    })));
            const changeSet = {
                id: `sync_cs_${Date.now()}_${this.changeSets.length + 1}`,
                source: 'ArqVertice',
                createdAt: new Date().toISOString(),
                user,
                changes,
                visualOnlyChanges: items.flatMap(item => item.fields.filter(field => visualOnlyFields.has(field))),
                snapshotId: this.getLatestSnapshot() && this.getLatestSnapshot().id,
                preview: true,
                approved: false
            };
            this.changeSets.push(changeSet);
            return clone(changeSet);
        }

        async applyResolution(item, resolution) {
            if (!RESOLUTIONS.includes(resolution)) throw new Error(`Resolução de conflito inválida: ${resolution}`);
            if (resolution === 'Cancel') return { cancelled: true, state: 'CONFLICT' };
            if (resolution === 'Keep Revit') {
                if (!item.revit) throw new Error('Não há representação Revit disponível para manter.');
                this.scene.importElements([item.revit], { duplicatePolicy: 'update' });
                return { resolved: true, state: 'REVIT_CHANGED', resolution };
            }
            if (resolution === 'Keep ArqVertice') return { resolved: true, state: 'ARQ_CHANGED', resolution, requiresApproval: true };
            if (resolution === 'Merge') return { resolved: true, state: 'BOTH_CHANGED', resolution, requiresApproval: true };
            return { resolved: false, state: 'CONFLICT' };
        }

        async commit(changeSet, approvalToken) {
            if (!changeSet || !changeSet.preview) throw new Error('ChangeSet de sincronização deve estar em preview.');
            if (!approvalToken) return { success: false, stage: 'PREVIEW', error: 'Aprovação humana obrigatória ausente.', changeSet: clone(changeSet) };
            if (!this.writeEngine) throw new Error('RevitWriteEngine não configurado.');
            if (!changeSet.changes.length) {
                changeSet.approved = false;
                changeSet.result = { success: true, stage: 'VISUAL_ONLY', changes: [] };
                return { success: true, stage: 'VISUAL_ONLY', changeSet };
            }
            let result;
            if (typeof this.writeEngine.planChangeSet === 'function') {
                const plan = this.writeEngine.planChangeSet(changeSet.changes);
                result = await this.writeEngine.commitChangeSet(plan.changeSet, approvalToken);
            } else {
                const results = [];
                for (const change of changeSet.changes) {
                    const plan = this.writeEngine.planParameterUpdate(change.element, change.field, change.newValue, change.oldValue);
                    results.push(await this.writeEngine.commitChangeSet(plan.changeSet, approvalToken));
                }
                result = {
                    success: results.every(item => item.success),
                    stage: results.every(item => item.stage === 'COMMITTED') ? 'COMMITTED' : 'PARTIAL',
                    results
                };
            }
            changeSet.approved = result.success;
            changeSet.result = clone(result);
            return { ...result, changeSet };
        }
    }

    RevitBimSync.SYNC_STATES = SYNC_STATES;
    RevitBimSync.TRACKED_FIELDS = TRACKED_FIELDS;
    RevitBimSync.VISUAL_ONLY_FIELDS = VISUAL_ONLY_FIELDS;
    RevitBimSync.RESOLUTIONS = RESOLUTIONS;
    RevitBimSync.snapshotObject = snapshotObject;
    return RevitBimSync;
}));
