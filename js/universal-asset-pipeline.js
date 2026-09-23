/*
 * ArqVértice Studio — J37 Universal 3D Asset Pipeline & Project Manifest Engine
 * Ingestão multi-formato (GLB, OBJ, FBX, PLY, SPLAT, IFC), isolamento 3-tier (SOURCE/PROCESSED/WEB),
 * geração de LODs, otimização Meshopt/KTX2 e compilação de project.manifest.json.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.UniversalAssetPipeline = factory();
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const SUPPORTED_INPUT_FORMATS = Object.freeze(['GLB', 'GLTF', 'OBJ', 'FBX', 'PLY', 'SPLAT', 'IFC']);

    const STORAGE_TIERS = Object.freeze({
        SOURCE: 'SOURCE',       // Arquivo bruto original intocado
        PROCESSED: 'PROCESSED', // Geometria normalizada (unidades em metros, centralizada)
        WEB: 'WEB'              // Modelo final otimizado para web (GLB comprimido com LODs)
    });

    // 1. Processador Individual de Asset 3D
    class AssetProcessor {
        constructor(rawAsset = {}) {
            this.id = rawAsset.id || `asset_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            this.name = rawAsset.name || 'Novo Asset 3D';
            this.format = String(rawAsset.format || 'GLB').toUpperCase();
            this.sourcePath = rawAsset.sourcePath || `storage/source/${this.id}.${this.format.toLowerCase()}`;
            this.category = rawAsset.category || 'Furniture';
            this.status = 'PENDING';
            this.validation = { valid: false, errors: [], warnings: [] };
            this.metrics = { vertices: 0, triangles: 0, texturesCount: 0, rawSizeKB: 0, optimizedSizeKB: 0 };
            this.lods = {};
            this.thumbnailUrl = null;
        }

        async process() {
            this.status = 'PROCESSING';

            // 1. Inspecionar e Validar
            this._validate();

            // 2. Normalizar (Escala, Rotação e Pivô)
            const normalized = this._normalize();

            // 3. Otimizar e Gerar LODs
            this._generateLODs(normalized);

            // 4. Gerar Metadados e Thumbnail
            this.thumbnailUrl = `assets/thumbnails/${this.id}.webp`;
            this.status = 'READY';

            return this.toJSON();
        }

        _validate() {
            if (!SUPPORTED_INPUT_FORMATS.includes(this.format)) {
                this.validation.errors.push(`Formato não suportado: ${this.format}`);
                this.validation.valid = false;
                return;
            }
            this.validation.valid = true;
            this.metrics.rawSizeKB = 4500; // Simulação de 4.5MB
            this.metrics.triangles = 64200;
            this.metrics.vertices = 38400;
            this.metrics.texturesCount = 4;
        }

        _normalize() {
            return {
                unitScale: 1.0, // Convertido para metros
                centered: true,
                boundingRadiusM: 1.85,
                upAxis: 'Y'
            };
        }

        _generateLODs(normalized) {
            // LOD 0: 100% Qualidade
            this.lods.lod0 = {
                level: 0,
                path: `storage/web/${this.id}_lod0.glb`,
                triangles: this.metrics.triangles,
                maxDistanceM: 12.0,
                compression: 'Meshopt+KTX2',
                sizeKB: 1450
            };

            // LOD 1: 50% Decimação
            this.lods.lod1 = {
                level: 1,
                path: `storage/web/${this.id}_lod1.glb`,
                triangles: Math.round(this.metrics.triangles * 0.45),
                maxDistanceM: 35.0,
                compression: 'Meshopt+WebP',
                sizeKB: 680
            };

            // LOD 2: 15% Proxy / Low-Poly
            this.lods.lod2 = {
                level: 2,
                path: `storage/web/${this.id}_lod2.glb`,
                triangles: Math.round(this.metrics.triangles * 0.12),
                maxDistanceM: 100.0,
                compression: 'Meshopt+WebP',
                sizeKB: 190
            };

            this.metrics.optimizedSizeKB = this.lods.lod0.sizeKB;
        }

        toJSON() {
            return {
                id: this.id,
                name: this.name,
                format: this.format,
                category: this.category,
                status: this.status,
                validation: { ...this.validation },
                metrics: { ...this.metrics },
                lods: { ...this.lods },
                thumbnailUrl: this.thumbnailUrl,
                storage: {
                    source: this.sourcePath,
                    processed: `storage/processed/${this.id}.glb`,
                    web: this.lods.lod0?.path || `storage/web/${this.id}.glb`
                }
            };
        }
    }

    // 2. Compilador de Project Manifest (project.manifest.json)
    class ProjectManifestCompiler {
        static compile(projectData = {}) {
            const manifest = {
                schemaVersion: '1.0.0-arqvertice-manifest',
                projectId: projectData.id || 'prj-praia-01',
                projectCode: projectData.code || 'PRJ-PRAIA-01',
                projectName: projectData.name || 'Residência de Praia',
                generatedAt: new Date().toISOString(),
                version: projectData.version || 1,
                
                // Cenas e Ambientes
                scenes: projectData.scenes || [
                    { id: 'scn-living', name: 'Living & Estar Integrado', levelId: 'lvl-01', defaultCameraId: 'cam-living-01' },
                    { id: 'scn-gourmet', name: 'Deck Gourmet & Lounge', levelId: 'lvl-01', defaultCameraId: 'cam-gourmet-01' },
                    { id: 'scn-suite', name: 'Suíte Master', levelId: 'lvl-02', defaultCameraId: 'cam-suite-01' }
                ],

                // Catálogo de Assets Vinculados
                assets: projectData.assets || [
                    { id: 'SOFA-001', name: 'Sofá Modular 4 Lugares', category: 'Furniture', lod0: 'storage/web/sofa_lod0.glb', lod1: 'storage/web/sofa_lod1.glb' },
                    { id: 'DECK-001', name: 'Deck Madeira Cumaru', category: 'Structure', lod0: 'storage/web/deck_lod0.glb' },
                    { id: 'WIN-FAC-01', name: 'Esquadria Fachada', category: 'Architecture', lod0: 'storage/web/window_lod0.glb' }
                ],

                // Catálogo de Materiais PBR
                materials: projectData.materials || [
                    { id: 'mat-glass-crystal', preset: 'glass', name: 'Vidro Cristal 8mm' },
                    { id: 'mat-wood-cumaru', preset: 'wood', name: 'Madeira Cumaru Maciça' },
                    { id: 'mat-stone-travertino', preset: 'stone', name: 'Mármore Travertino Navona' },
                    { id: 'mat-fabric-linen', preset: 'fabric', name: 'Tecido Linho Cinza' }
                ],

                // Mapeamento BIM
                bim: {
                    schema: 'IFC4',
                    ifcModelPath: 'storage/bim/residencia_praia.ifc',
                    revitSync: { enabled: true, lastSync: new Date().toISOString(), modelGuid: 'b7a9f2e1-482a-43c2-9e91' },
                    elementCount: projectData.bimElementCount || 142
                },

                // Câmeras e Vistas Pré-configuradas
                cameras: [
                    { id: 'cam-iso', name: 'Vista Isométrica Geral', pos: [20, 16, 24], target: [0, 2, 0], fov: 45 },
                    { id: 'cam-living-01', name: 'Living Perspectiva Humana', pos: [-8, 4, 9], target: [-4, 1.5, 3], fov: 50 },
                    { id: 'cam-gourmet-01', name: 'Varanda & Piscina', pos: [11, 4, -2], target: [5, 0.5, -5], fov: 55 }
                ],

                // Iluminação Arquitetônica
                lighting: {
                    sun: { intensity: 1.6, temperature: 5500, position: [18, 26, 15] },
                    sky: { intensity: 0.85, temperature: 6500 },
                    hdri: { path: 'assets/hdri/litoral_sky_2k.hdr', exposure: 1.15 }
                },

                // Configurações de LOD e Otimização
                lodConfig: {
                    strategy: 'distance-and-screen-coverage',
                    thresholds: { lod0MaxM: 12, lod1MaxM: 35, lod2MaxM: 100 }
                },

                optimization: {
                    dracoEnabled: true,
                    meshoptEnabled: true,
                    ktx2Enabled: true,
                    textureCompression: 'WebP/Basis'
                },

                // Permissões do Visualizador do Cliente
                permissions: {
                    allowMeasurements: true,
                    allowComments: true,
                    allowFullscreen: true,
                    allowQualityChange: true
                }
            };

            return manifest;
        }
    }

    // 3. Pipeline Principal UniversalAssetPipeline
    class UniversalAssetPipeline {
        constructor(options = {}) {
            this.projectId = options.projectId || 'prj-praia-01';
            this.assetsRegistry = new Map();
            this.manifest = null;
            this.subscribers = new Set();
        }

        async importAsset(input = {}) {
            const processor = new AssetProcessor(input);
            const processedData = await processor.process();
            this.assetsRegistry.set(processedData.id, processedData);
            this._notifyChange({ type: 'asset_imported', asset: processedData });
            return processedData;
        }

        getAsset(assetId) {
            return this.assetsRegistry.get(assetId) || null;
        }

        listAssets(category = null) {
            let list = Array.from(this.assetsRegistry.values());
            if (category) list = list.filter(a => a.category.toLowerCase() === category.toLowerCase());
            return list;
        }

        generateProjectManifest(customOverrides = {}) {
            const manifest = ProjectManifestCompiler.compile({
                id: this.projectId,
                assets: this.listAssets(),
                ...customOverrides
            });
            this.manifest = manifest;
            this._notifyChange({ type: 'manifest_generated', manifest });
            return manifest;
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

    UniversalAssetPipeline.SUPPORTED_INPUT_FORMATS = SUPPORTED_INPUT_FORMATS;
    UniversalAssetPipeline.STORAGE_TIERS = STORAGE_TIERS;
    UniversalAssetPipeline.AssetProcessor = AssetProcessor;
    UniversalAssetPipeline.ProjectManifestCompiler = ProjectManifestCompiler;

    return UniversalAssetPipeline;
}));
