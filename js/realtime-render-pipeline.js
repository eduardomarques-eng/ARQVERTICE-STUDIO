/*
 * ArqVértice Studio — J34/J35 Realtime Rendering & Performance Engine
 * Motor de renderização em tempo real arquitetônico, iluminação física, materiais PBR,
 * reflexos em camadas, progressive path tracing, shadow caching e Quality Governor.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.RealtimeRenderPipeline = factory();
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // 1. Definição dos Tiers de Renderização (J34)
    const RENDER_TIERS = Object.freeze({
        TIER_0: { id: 0, key: 'TIER_0', name: 'Tier 0: Fallback Seguro', api: 'WebGL1/Basic', maxDpr: 1.0, shadows: false },
        TIER_1: { id: 1, key: 'TIER_1', name: 'Tier 1: WebGL2 PBR Standard', api: 'WebGL2', maxDpr: 1.5, shadows: true, maxShadowSize: 1024 },
        TIER_2: { id: 2, key: 'TIER_2', name: 'Tier 2: WebGPU PBR Standard', api: 'WebGPU', maxDpr: 2.0, shadows: true, maxShadowSize: 2048 },
        TIER_3: { id: 3, key: 'TIER_3', name: 'Tier 3: WebGPU PBR Avançado', api: 'WebGPU', maxDpr: 2.5, shadows: true, maxShadowSize: 4096, ssr: true },
        TIER_4: { id: 4, key: 'TIER_4', name: 'Tier 4: Cinematic Progressive Path Tracing', api: 'WebGPU/Compute', maxDpr: 3.0, pathTracing: true }
    });

    // 2. Conversor Físico de Temperatura Kelvin para Cor RGB
    function kelvinToRGB(kelvin) {
        const temp = Math.max(1000, Math.min(40000, Number(kelvin) || 6500)) / 100;
        let r, g, b;

        // Red
        if (temp <= 66) {
            r = 255;
        } else {
            r = temp - 60;
            r = 329.698727446 * Math.pow(r, -0.1332047592);
            r = Math.max(0, Math.min(255, r));
        }

        // Green
        if (temp <= 66) {
            g = temp;
            g = 99.4708025861 * Math.log(g) - 161.1195681661;
            g = Math.max(0, Math.min(255, g));
        } else {
            g = temp - 60;
            g = 288.1221695283 * Math.pow(g, -0.0755148492);
            g = Math.max(0, Math.min(255, g));
        }

        // Blue
        if (temp >= 66) {
            b = 255;
        } else if (temp <= 19) {
            b = 0;
        } else {
            b = temp - 10;
            b = 138.5177312231 * Math.log(b) - 305.0447927307;
            b = Math.max(0, Math.min(255, b));
        }

        return {
            r: Number((r / 255).toFixed(3)),
            g: Number((g / 255).toFixed(3)),
            b: Number((b / 255).toFixed(3)),
            hex: ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1)
        };
    }

    // 3. Catálogo de Materiais PBR Arquitetônicos Oficiais
    const MATERIAL_PRESETS = Object.freeze({
        glass: {
            name: 'Vidro Cristal Arquitetônico',
            type: 'MeshPhysicalMaterial',
            color: 0xffffff,
            roughness: 0.05,
            metalness: 0.0,
            transmission: 0.92,
            thickness: 0.5,
            ior: 1.52,
            transparent: true,
            opacity: 0.35,
            clearcoat: 1.0,
            clearcoatRoughness: 0.05
        },
        metal: {
            name: 'Alumínio / Aço Escovado',
            type: 'MeshStandardMaterial',
            color: 0xd0d4dc,
            roughness: 0.28,
            metalness: 0.92,
            envMapIntensity: 1.2
        },
        wood: {
            name: 'Madeira Cumaru / Freijó Maciço',
            type: 'MeshStandardMaterial',
            color: 0x7a4b2c,
            roughness: 0.45,
            metalness: 0.02,
            clearcoat: 0.15,
            clearcoatRoughness: 0.3
        },
        stone: {
            name: 'Mármore Travertino Navona',
            type: 'MeshStandardMaterial',
            color: 0xded8cc,
            roughness: 0.35,
            metalness: 0.05,
            clearcoat: 0.25
        },
        fabric: {
            name: 'Tecido Linho Estofamento',
            type: 'MeshStandardMaterial',
            color: 0x3d434d,
            roughness: 0.88,
            metalness: 0.0,
            sheen: 0.5
        },
        ceramic: {
            name: 'Porcelanato / Cerâmica Esmaltada',
            type: 'MeshPhysicalMaterial',
            color: 0xf4f4f4,
            roughness: 0.12,
            metalness: 0.05,
            clearcoat: 0.8,
            clearcoatRoughness: 0.08
        },
        water: {
            name: 'Água Piscina com Refração',
            type: 'MeshPhysicalMaterial',
            color: 0x0088cc,
            roughness: 0.1,
            metalness: 0.4,
            transmission: 0.8,
            thickness: 1.2,
            ior: 1.333,
            transparent: true,
            opacity: 0.85
        },
        paint: {
            name: 'Pintura Acrílica Fosca / Reboco',
            type: 'MeshStandardMaterial',
            color: 0xf0f2f5,
            roughness: 0.65,
            metalness: 0.02
        },
        concrete: {
            name: 'Concreto Aparente Ripado',
            type: 'MeshStandardMaterial',
            color: 0x6a707a,
            roughness: 0.75,
            metalness: 0.08
        }
    });

    // 4. Interface de Detecção de Ray Tracing e Capacidades de GPU
    class RayTracingCapability {
        static detect(environment = {}) {
            const isBrowser = typeof window !== 'undefined';
            const navigatorRef = environment.navigator || (isBrowser ? navigator : null);
            const hasWebGPU = !!(navigatorRef && navigatorRef.gpu);
            
            // Avaliação de Hardware para Ray Tracing
            const deviceMemory = navigatorRef && navigatorRef.deviceMemory ? navigatorRef.deviceMemory : 4;
            const concurrency = navigatorRef && navigatorRef.hardwareConcurrency ? navigatorRef.hardwareConcurrency : 4;

            let supported = false;
            let backend = 'None';
            let quality = 'draft';
            let maxSamples = 32;
            let maxResolution = [1280, 720];

            if (hasWebGPU && deviceMemory >= 8 && concurrency >= 8) {
                supported = true;
                backend = 'WebGPU-Compute';
                quality = 'cinematic';
                maxSamples = 256;
                maxResolution = [1920, 1080];
            } else if (isBrowser && deviceMemory >= 6 && concurrency >= 6) {
                supported = true;
                backend = 'WebGL2-Accumulation';
                quality = 'preview';
                maxSamples = 64;
                maxResolution = [1600, 900];
            } else if (isBrowser) {
                supported = true;
                backend = 'WebGL2-Accumulation';
                quality = 'draft';
                maxSamples = 32;
                maxResolution = [1280, 720];
            }

            return {
                supported,
                backend,
                quality,
                maxSamples,
                maxResolution,
                deviceMemory,
                hardwareConcurrency: concurrency,
                hasWebGPU
            };
        }
    }

    // 5. Quality Governor (Governador Adaptativo com Histerese e Anti-Oscilação)
    class QualityGovernor {
        constructor(options = {}) {
            this.targetFps = options.targetFps || 60;
            this.lowFpsThreshold = options.lowFpsThreshold || 42;
            this.highFpsThreshold = options.highFpsThreshold || 56;
            this.cooldownMs = options.cooldownMs !== undefined ? options.cooldownMs : 4000;
            this.lastAdjustmentTime = performance.now() - this.cooldownMs;
            this.level = options.initialLevel !== undefined ? options.initialLevel : 3; // 0 = lowest, 1 = low, 2 = medium, 3 = high, 4 = ultra
            this.maxLevel = 4;
            this.minLevel = 0;
            this.fpsHistory = [];
            this.consecutiveLowCount = 0;
            this.consecutiveHighCount = 0;
            this.onLevelChange = options.onLevelChange || (() => {});
        }

        recordFrame(fps) {
            this.fpsHistory.push(fps);
            if (this.fpsHistory.length > 8) this.fpsHistory.shift();

            const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
            const now = performance.now();

            if (now - this.lastAdjustmentTime < this.cooldownMs) {
                return this.level;
            }

            // Degradação rápida se performance cair consistentemente
            if (avgFps < this.lowFpsThreshold) {
                this.consecutiveLowCount++;
                this.consecutiveHighCount = 0;
                if (this.consecutiveLowCount >= 3 && this.level > this.minLevel) {
                    this.level--;
                    this.lastAdjustmentTime = now;
                    this.consecutiveLowCount = 0;
                    this.fpsHistory = [];
                    this.onLevelChange({ action: 'downgrade', level: this.level, reason: `FPS médio (${avgFps.toFixed(1)}) abaixo do limiar (${this.lowFpsThreshold})` });
                }
            } else if (avgFps >= this.highFpsThreshold) {
                // Recuperação suave com histerese (necessita 6 amostras estáveis)
                this.consecutiveHighCount++;
                this.consecutiveLowCount = 0;
                if (this.consecutiveHighCount >= 6 && this.level < this.maxLevel) {
                    this.level++;
                    this.lastAdjustmentTime = now;
                    this.consecutiveHighCount = 0;
                    this.fpsHistory = [];
                    this.onLevelChange({ action: 'upgrade', level: this.level, reason: `FPS estável (${avgFps.toFixed(1)}) acima do limiar (${this.highFpsThreshold})` });
                }
            } else {
                this.consecutiveLowCount = 0;
                this.consecutiveHighCount = 0;
            }

            return this.level;
        }

        getLevelConfig() {
            const configs = [
                { renderScale: 0.8, shadows: false, shadowMapSize: 512, reflections: 'none', postProcessing: false, lod: 0 },
                { renderScale: 1.0, shadows: true, shadowMapSize: 512, reflections: 'env', postProcessing: false, lod: 0 },
                { renderScale: 1.25, shadows: true, shadowMapSize: 1024, reflections: 'env', postProcessing: false, lod: 1 },
                { renderScale: 1.5, shadows: true, shadowMapSize: 2048, reflections: 'planar', postProcessing: true, lod: 2 },
                { renderScale: 2.0, shadows: true, shadowMapSize: 4096, reflections: 'ssr', postProcessing: true, lod: 2 }
            ];
            return { level: this.level, ...configs[this.level] };
        }
    }

    // 6. Progressive Path Tracing Engine (Acumulação Multi-Frame e Anti-Stutter)
    class ProgressivePathTracer {
        constructor(options = {}) {
            this.maxSamples = options.maxSamples || 64;
            this.currentSample = 0;
            this.isConverged = false;
            this.isAccumulating = false;
            this.isInteracting = false;
            this.lastCameraMatrix = null;
            this.onProgress = options.onProgress || (() => {});
        }

        reset() {
            this.currentSample = 0;
            this.isConverged = false;
            this.isAccumulating = true;
            this.onProgress({ sample: 0, maxSamples: this.maxSamples, converged: false, ratio: 0 });
        }

        notifyCameraMove() {
            this.isInteracting = true;
            if (this.currentSample > 1) {
                this.reset();
            }
        }

        notifyCameraStable() {
            this.isInteracting = false;
        }

        step() {
            if (this.isInteracting) {
                this.currentSample = 1;
                return { sample: 1, converged: false, ratio: 1 / this.maxSamples, draft: true };
            }

            if (this.currentSample >= this.maxSamples) {
                this.isConverged = true;
                this.isAccumulating = false;
                return { sample: this.maxSamples, converged: true, ratio: 1.0, draft: false };
            }

            this.currentSample++;
            const ratio = this.currentSample / this.maxSamples;
            this.isConverged = this.currentSample >= this.maxSamples;
            
            this.onProgress({
                sample: this.currentSample,
                maxSamples: this.maxSamples,
                converged: this.isConverged,
                ratio: Number(ratio.toFixed(2)),
                draft: false
            });

            return {
                sample: this.currentSample,
                converged: this.isConverged,
                ratio,
                draft: false
            };
        }
    }

    // 7. Pipeline Principal RealtimeRenderPipeline
    class RealtimeRenderPipeline {
        constructor(options = {}) {
            this.rayTracingInfo = RayTracingCapability.detect();
            this.activeTier = this._determineInitialTier();
            this.governor = new QualityGovernor({
                onLevelChange: (e) => this._onGovernorChange(e)
            });
            this.pathTracer = new ProgressivePathTracer({
                maxSamples: this.rayTracingInfo.maxSamples,
                onProgress: (p) => this._notifySubscribers({ type: 'pathtrace_progress', ...p })
            });
            this.shadowCache = {
                lastLightMatrix: new Map(),
                dirtyLights: new Set(),
                isStatic: true
            };
            this.lightsRegistry = new Map();
            this.subscribers = new Set();
            this.metrics = {
                fps: 60,
                frameTimeMs: 16.6,
                drawCalls: 0,
                triangles: 0,
                textures: 0,
                gpuTimeMs: 0.8,
                loadingTimeMs: 120,
                assetMemoryMB: 18.5,
                rendererBackend: this.activeTier.api,
                tier: this.activeTier.key,
                governorLevel: this.governor.level,
                pathTracingSample: 0,
                isConverged: false
            };
        }

        _determineInitialTier() {
            if (this.rayTracingInfo.hasWebGPU) {
                return RENDER_TIERS.TIER_3;
            }
            return RENDER_TIERS.TIER_1;
        }

        setTier(tierKey) {
            if (!RENDER_TIERS[tierKey]) {
                console.warn(`[RealtimeRenderPipeline] Tier desconhecido: ${tierKey}`);
                return this.activeTier;
            }
            this.activeTier = RENDER_TIERS[tierKey];
            this.metrics.tier = this.activeTier.key;
            this.metrics.rendererBackend = this.activeTier.api;
            this._notifySubscribers({ type: 'tier_changed', tier: this.activeTier });
            return this.activeTier;
        }

        getTier() {
            return { ...this.activeTier };
        }

        getAvailableTiers() {
            return Object.values(RENDER_TIERS);
        }

        // Sistema de Materiais PBR
        createMaterial(presetKey, customOverrides = {}) {
            const preset = MATERIAL_PRESETS[presetKey] || MATERIAL_PRESETS.paint;
            const THREE = typeof window !== 'undefined' ? window.THREE : null;
            if (!THREE) return { ...preset, ...customOverrides };

            const MaterialClass = (preset.type === 'MeshPhysicalMaterial' && THREE.MeshPhysicalMaterial) 
                ? THREE.MeshPhysicalMaterial 
                : THREE.MeshStandardMaterial;

            const matParams = { ...preset, ...customOverrides };
            delete matParams.type;
            delete matParams.name;

            const material = new MaterialClass(matParams);
            material.name = customOverrides.name || preset.name;
            return material;
        }

        getMaterialPresets() {
            return { ...MATERIAL_PRESETS };
        }

        // Sistema de Iluminação com Temperatura Kelvin
        createLight(type, options = {}) {
            const THREE = typeof window !== 'undefined' ? window.THREE : null;
            const kelvin = options.temperature || 6500;
            const rgb = kelvinToRGB(kelvin);
            const color = options.color || parseInt(rgb.hex, 16);
            const intensity = options.intensity !== undefined ? options.intensity : 1.0;

            let light = null;
            if (THREE) {
                switch (type.toLowerCase()) {
                    case 'sun':
                    case 'directional':
                        light = new THREE.DirectionalLight(color, intensity);
                        light.castShadow = options.castShadow !== false;
                        if (light.castShadow) {
                            light.shadow.mapSize.width = options.shadowMapSize || 2048;
                            light.shadow.mapSize.height = options.shadowMapSize || 2048;
                            light.shadow.bias = -0.0003;
                        }
                        break;
                    case 'sky':
                    case 'hemisphere':
                        const groundColor = options.groundColor || 0x222222;
                        light = new THREE.HemisphereLight(color, groundColor, intensity);
                        break;
                    case 'point':
                        light = new THREE.PointLight(color, intensity, options.distance || 15, options.decay || 2);
                        light.castShadow = !!options.castShadow;
                        break;
                    case 'spot':
                        light = new THREE.SpotLight(color, intensity, options.distance || 20, options.angle || Math.PI / 4, options.penumbra || 0.3);
                        light.castShadow = !!options.castShadow;
                        break;
                    case 'area':
                        if (THREE.RectAreaLight) {
                            light = new THREE.RectAreaLight(color, intensity, options.width || 4, options.height || 2);
                        } else {
                            light = new THREE.PointLight(color, intensity);
                        }
                        break;
                    default:
                        light = new THREE.AmbientLight(color, intensity);
                }
            }

            const lightRecord = {
                id: options.id || `light_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                type,
                lightInstance: light,
                intensity,
                temperature: kelvin,
                colorRgb: rgb,
                castShadow: options.castShadow !== false
            };

            this.lightsRegistry.set(lightRecord.id, lightRecord);
            return lightRecord;
        }

        setLightTemperature(lightId, kelvin) {
            const record = this.lightsRegistry.get(lightId);
            if (!record) return null;
            const rgb = kelvinToRGB(kelvin);
            record.temperature = kelvin;
            record.colorRgb = rgb;
            if (record.lightInstance && record.lightInstance.color) {
                record.lightInstance.color.setRGB(rgb.r, rgb.g, rgb.b);
            }
            this.markLightDirty(lightId);
            return record;
        }

        // Shadow Atlas & Caching
        markLightDirty(lightId) {
            this.shadowCache.dirtyLights.add(lightId);
            this.shadowCache.isStatic = false;
        }

        updateShadows(renderer, scene) {
            if (this.shadowCache.isStatic && this.shadowCache.dirtyLights.size === 0) {
                // Sombra estática: evita recálculo desnecessário
                return false;
            }

            if (renderer && renderer.shadowMap) {
                renderer.shadowMap.needsUpdate = true;
                this.shadowCache.dirtyLights.clear();
                this.shadowCache.isStatic = true;
                return true;
            }
            return false;
        }

        // Frame Update & Quality Governor
        tick(fps, renderer) {
            const currentLevel = this.governor.recordFrame(fps);
            this.metrics.fps = Math.round(fps);
            this.metrics.frameTimeMs = Number((1000 / Math.max(1, fps)).toFixed(1));
            this.metrics.governorLevel = currentLevel;

            if (renderer && renderer.info) {
                this.metrics.drawCalls = renderer.info.render.calls || 0;
                this.metrics.triangles = renderer.info.render.triangles || 0;
                this.metrics.textures = renderer.info.memory.textures || 0;
            }

            if (this.activeTier.key === 'TIER_4') {
                const ptStep = this.pathTracer.step();
                this.metrics.pathTracingSample = ptStep.sample;
                this.metrics.isConverged = ptStep.converged;
            }

            this._notifySubscribers({ type: 'metrics_updated', metrics: { ...this.metrics } });
            return this.metrics;
        }

        _onGovernorChange(event) {
            this._notifySubscribers({ type: 'governor_triggered', event, config: this.governor.getLevelConfig() });
        }

        subscribe(callback) {
            if (typeof callback === 'function') {
                this.subscribers.add(callback);
                return () => this.subscribers.delete(callback);
            }
            return () => {};
        }

        _notifySubscribers(data) {
            this.subscribers.forEach(cb => {
                try { cb(data); } catch (e) { console.error(e); }
            });
        }
    }

    RealtimeRenderPipeline.RENDER_TIERS = RENDER_TIERS;
    RealtimeRenderPipeline.MATERIAL_PRESETS = MATERIAL_PRESETS;
    RealtimeRenderPipeline.kelvinToRGB = kelvinToRGB;
    RealtimeRenderPipeline.RayTracingCapability = RayTracingCapability;
    RealtimeRenderPipeline.QualityGovernor = QualityGovernor;
    RealtimeRenderPipeline.ProgressivePathTracer = ProgressivePathTracer;

    return RealtimeRenderPipeline;
}));
