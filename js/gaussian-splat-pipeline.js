/*
 * ArqVértice Studio — J40 Gaussian Splat Pipeline & Reality Capture Engine
 * Integração de Gaussian Splatting como representação volumétrica complementar
 * baseada no ecossistema PlayCanvas (SuperSplat / SplatTransform / SOG / KSPLAT).
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.GaussianSplatPipeline = factory();
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // 1. Formatos Suportados de Gaussian Splatting
    const SUPPORTED_SPLAT_FORMATS = Object.freeze({
        PLY: { extension: '.ply', name: 'Standard 3D Gaussian Splat PLY', mime: 'application/octet-stream', compressed: false },
        SOG: { extension: '.sog', name: 'Splat Octree Geometry (PlayCanvas SuperSplat)', mime: 'application/octet-stream', compressed: true },
        SPZ: { extension: '.spz', name: 'Compressed Scan Splat Zip', mime: 'application/octet-stream', compressed: true },
        SPLAT: { extension: '.splat', name: 'Raw Binary Splat Buffer', mime: 'application/octet-stream', compressed: false },
        KSPLAT: { extension: '.ksplat', name: 'K-D Tree Spatial Sorted Splat', mime: 'application/octet-stream', compressed: true }
    });

    // 2. Modelo de Dados SplatAsset (J40)
    class SplatAsset {
        constructor(data = {}) {
            this.id = data.id || `splat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            this.name = data.name || 'Captura de Realidade Gaussian Splat';
            this.source = data.source || 'Photogrammetry'; // 'Scan' | 'Photogrammetry' | 'Drone' | 'Imported' | 'AI'
            this.format = String(data.format || 'PLY').toUpperCase();
            this.sourcePath = data.sourcePath || `storage/splats/source/${this.id}.${this.format.toLowerCase()}`;
            this.optimizedPath = data.optimizedPath || `storage/splats/web/${this.id}.sog`;
            this.splatCount = Number(data.splatCount) || 1250000;
            
            this.bounds = {
                min: { x: -15, y: -1, z: -15, ...(data.bounds?.min || {}) },
                max: { x: 15, y: 12, z: 15, ...(data.bounds?.max || {}) },
                center: { x: 0, y: 5.5, z: 0, ...(data.bounds?.center || {}) },
                radius: Number(data.bounds?.radius) || 21.5
            };

            this.transform = {
                position: { x: 0, y: 0, z: 0, ...(data.transform?.position || {}) },
                rotation: { x: 0, y: 0, z: 0, ...(data.transform?.rotation || {}) },
                scale: { x: 1, y: 1, z: 1, ...(data.transform?.scale || {}) }
            };

            this.lod = {
                currentLevel: 0,
                levels: {
                    lod0: { level: 0, maxSplats: this.splatCount, downsampleRatio: 1.0, distanceMaxM: 15.0 },
                    lod1: { level: 1, maxSplats: Math.round(this.splatCount * 0.35), downsampleRatio: 0.35, distanceMaxM: 40.0 },
                    lod2: { level: 2, maxSplats: Math.round(this.splatCount * 0.10), downsampleRatio: 0.10, distanceMaxM: 120.0 }
                }
            };

            this.metadata = {
                captureDate: data.metadata?.captureDate || new Date().toISOString(),
                captureDevice: data.metadata?.captureDevice || 'LiDAR Drone Survey DJI Matrice 350',
                coordinateSystem: data.metadata?.coordinateSystem || 'SIRGAS 2000 / UTM zone 24S',
                compressedSizeKB: Number(data.metadata?.compressedSizeKB) || 24800, // ~24.8 MB
                rawSizeKB: Number(data.metadata?.rawSizeKB) || 185000, // ~185 MB
                sphericalHarmonicsDegree: data.metadata?.sphericalHarmonicsDegree || 3,
                clippingBoxEnabled: !!data.metadata?.clippingBoxEnabled,
                opacity: data.metadata?.opacity !== undefined ? Number(data.metadata.opacity) : 1.0,
                tags: Array.isArray(data.metadata?.tags) ? [...data.metadata.tags] : ['entorno', 'terreno', 'escaneamento', 'fotogrametria']
            };

            this.visibility = data.visibility !== false;
            this.selected = false;
        }

        toJSON() {
            return {
                id: this.id,
                name: this.name,
                source: this.source,
                format: this.format,
                sourcePath: this.sourcePath,
                optimizedPath: this.optimizedPath,
                splatCount: this.splatCount,
                bounds: { ...this.bounds },
                transform: { ...this.transform },
                lod: { ...this.lod },
                metadata: { ...this.metadata },
                visibility: this.visibility,
                selected: this.selected
            };
        }
    }

    // 3. Motor SplatTransform (Conversão, Quantização e Otimização PlayCanvas)
    class SplatTransformEngine {
        static inspectAndValidate(inputBufferOrMeta) {
            const format = String(inputBufferOrMeta.format || 'PLY').toUpperCase();
            if (!SUPPORTED_SPLAT_FORMATS[format]) {
                return { valid: false, error: `Formato de Splat não suportado: ${format}` };
            }

            return {
                valid: true,
                format,
                estimatedSplats: inputBufferOrMeta.splatCount || 1250000,
                hasColor: true,
                hasSphericalHarmonics: true,
                recommendedLODStrategy: 'octree-distance'
            };
        }

        static processSplat({ sourceAsset, targetFormat = 'SOG' }) {
            const splat = new SplatAsset(sourceAsset);
            splat.format = targetFormat;
            
            // Simulação determinística de quantização e decimação de harmônicos esféricos
            const compressionRatio = targetFormat === 'SOG' || targetFormat === 'KSPLAT' ? 0.15 : 0.85;
            splat.metadata.compressedSizeKB = Math.round(splat.metadata.rawSizeKB * compressionRatio);

            return splat.toJSON();
        }

        // Gerenciador de Progressive Streaming para Visualizador
        static calculateStreamingBudget(cameraDistanceM, maxBudgetSplats = 800000) {
            let activeLOD = 0;
            let renderSplats = maxBudgetSplats;

            if (cameraDistanceM > 40.0) {
                activeLOD = 2;
                renderSplats = Math.round(maxBudgetSplats * 0.15);
            } else if (cameraDistanceM > 15.0) {
                activeLOD = 1;
                renderSplats = Math.round(maxBudgetSplats * 0.45);
            } else {
                activeLOD = 0;
                renderSplats = maxBudgetSplats;
            }

            return {
                activeLOD,
                renderSplats,
                progressiveRatio: Number((renderSplats / maxBudgetSplats).toFixed(2))
            };
        }
    }

    // 4. Pipeline Principal GaussianSplatPipeline
    class GaussianSplatPipeline {
        constructor(options = {}) {
            this.projectId = options.projectId || 'prj-praia-01';
            this.splatsRegistry = new Map();
            this.activeSplatId = null;
            this.subscribers = new Set();
            this._seedInitialContextSplats();
        }

        _seedInitialContextSplats() {
            // Contexto de entorno real: Levantamento topográfico e vegetação litorânea capturados por Drone
            const defaultSplat = new SplatAsset({
                id: 'splat-entorno-praia',
                name: 'Levantamento Fotogramétrico & Topografia Litoral',
                source: 'Drone',
                format: 'SOG',
                splatCount: 1450000,
                bounds: {
                    min: { x: -30, y: -2, z: -30 },
                    max: { x: 30, y: 15, z: 30 },
                    center: { x: 0, y: 3.5, z: 0 },
                    radius: 35.0
                },
                transform: {
                    position: { x: 0, y: -0.2, z: 0 },
                    rotation: { x: 0, y: 0, z: 0 },
                    scale: { x: 1, y: 1, z: 1 }
                },
                metadata: {
                    captureDevice: 'DJI Matrice 350 RTK + Zenmuse P1',
                    captureDate: '2026-08-15',
                    coordinateSystem: 'SIRGAS 2000 UTM 24S',
                    compressedSizeKB: 28500,
                    rawSizeKB: 210000,
                    opacity: 1.0,
                    tags: ['entorno', 'terreno', 'vegetacao', 'praia', 'drone']
                }
            });

            this.splatsRegistry.set(defaultSplat.id, defaultSplat);
            this.activeSplatId = defaultSplat.id;
        }

        importSplat(assetData) {
            const validation = SplatTransformEngine.inspectAndValidate(assetData);
            if (!validation.valid) {
                return { success: false, error: validation.error };
            }

            const processed = SplatTransformEngine.processSplat({
                sourceAsset: assetData,
                targetFormat: assetData.targetFormat || 'SOG'
            });

            const splat = new SplatAsset(processed);
            this.splatsRegistry.set(splat.id, splat);
            this._notifyChange({ type: 'splat_imported', splat: splat.toJSON() });

            return { success: true, splat: splat.toJSON() };
        }

        getSplat(splatId) {
            return this.splatsRegistry.get(splatId)?.toJSON() || null;
        }

        listSplats() {
            return Array.from(this.splatsRegistry.values()).map(s => s.toJSON());
        }

        // Operações Permitidas no Editor (Transformação, Visibilidade, Opacidade e Clipping)
        setTransform(splatId, transformData = {}) {
            const splat = this.splatsRegistry.get(splatId);
            if (!splat) return null;

            if (transformData.position) splat.transform.position = { ...splat.transform.position, ...transformData.position };
            if (transformData.rotation) splat.transform.rotation = { ...splat.transform.rotation, ...transformData.rotation };
            if (transformData.scale) splat.transform.scale = { ...splat.transform.scale, ...transformData.scale };

            this._notifyChange({ type: 'splat_transform_changed', splatId, transform: splat.transform });
            return splat.toJSON();
        }

        setVisibility(splatId, isVisible) {
            const splat = this.splatsRegistry.get(splatId);
            if (!splat) return null;
            splat.visibility = !!isVisible;
            this._notifyChange({ type: 'splat_visibility_changed', splatId, visibility: splat.visibility });
            return splat.toJSON();
        }

        setOpacity(splatId, opacity) {
            const splat = this.splatsRegistry.get(splatId);
            if (!splat) return null;
            splat.metadata.opacity = Math.max(0, Math.min(1.0, Number(opacity) || 1.0));
            this._notifyChange({ type: 'splat_opacity_changed', splatId, opacity: splat.metadata.opacity });
            return splat.toJSON();
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

    GaussianSplatPipeline.SUPPORTED_SPLAT_FORMATS = SUPPORTED_SPLAT_FORMATS;
    GaussianSplatPipeline.SplatAsset = SplatAsset;
    GaussianSplatPipeline.SplatTransformEngine = SplatTransformEngine;

    return GaussianSplatPipeline;
}));
