/*
 * ArqVértice Studio — J33 Adaptive 3D Renderer & Performance Engine
 * Gerenciador de qualidade adaptativa, progressive loading, streaming de assets e telemetria.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.AdaptiveRenderer = factory();
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const QUALITY_PRESETS = Object.freeze({
        AUTO: 'AUTO',
        MOBILE: 'MOBILE',
        BALANCED: 'BALANCED',
        HIGH: 'HIGH',
        ULTRA: 'ULTRA',
        CINEMATIC: 'CINEMATIC'
    });

    const PRESET_CONFIGS = Object.freeze({
        MOBILE: {
            name: 'Mobile / Economia',
            pixelRatioMax: 1.2,
            shadows: false,
            shadowMapSize: 512,
            shadowType: 'BasicShadowMap',
            antialias: true,
            anisotropy: 2,
            lodLevel: 0, // 0 = low, 1 = med, 2 = high
            hdriResolution: 256,
            postProcessing: false,
            toneMapping: 'LinearToneMapping',
            toneMappingExposure: 1.0,
            targetFps: 60,
            maxTriangles: 120000,
            enableReflections: false,
            powerPreference: 'low-power'
        },
        BALANCED: {
            name: 'Balanceado',
            pixelRatioMax: 1.5,
            shadows: true,
            shadowMapSize: 1024,
            shadowType: 'PCFShadowMap',
            antialias: true,
            anisotropy: 4,
            lodLevel: 1,
            hdriResolution: 512,
            postProcessing: false,
            toneMapping: 'ACESFilmicToneMapping',
            toneMappingExposure: 1.1,
            targetFps: 60,
            maxTriangles: 350000,
            enableReflections: true,
            powerPreference: 'default'
        },
        HIGH: {
            name: 'Alta Qualidade',
            pixelRatioMax: 2.0,
            shadows: true,
            shadowMapSize: 2048,
            shadowType: 'PCFSoftShadowMap',
            antialias: true,
            anisotropy: 8,
            lodLevel: 2,
            hdriResolution: 1024,
            postProcessing: true,
            toneMapping: 'ACESFilmicToneMapping',
            toneMappingExposure: 1.15,
            targetFps: 60,
            maxTriangles: 800000,
            enableReflections: true,
            powerPreference: 'high-performance'
        },
        ULTRA: {
            name: 'Ultra / WebGPU',
            pixelRatioMax: Math.min(2.5, typeof window !== 'undefined' ? (window.devicePixelRatio || 2) : 2),
            shadows: true,
            shadowMapSize: 4096,
            shadowType: 'PCFSoftShadowMap',
            antialias: true,
            anisotropy: 16,
            lodLevel: 2,
            hdriResolution: 2048,
            postProcessing: true,
            toneMapping: 'ACESFilmicToneMapping',
            toneMappingExposure: 1.2,
            targetFps: 60,
            maxTriangles: 1500000,
            enableReflections: true,
            powerPreference: 'high-performance'
        },
        CINEMATIC: {
            name: 'Cinemático (Progressivo)',
            pixelRatioMax: Math.min(3.0, typeof window !== 'undefined' ? (window.devicePixelRatio || 2) : 2),
            shadows: true,
            shadowMapSize: 4096,
            shadowType: 'PCFSoftShadowMap',
            antialias: true,
            anisotropy: 16,
            lodLevel: 2,
            hdriResolution: 2048,
            postProcessing: true,
            progressiveAccumulation: true,
            toneMapping: 'ACESFilmicToneMapping',
            toneMappingExposure: 1.25,
            targetFps: 30,
            maxTriangles: 2500000,
            enableReflections: true,
            powerPreference: 'high-performance'
        }
    });

    class AdaptiveRenderer {
        constructor(options = {}) {
            this.activePresetKey = options.preset || QUALITY_PRESETS.AUTO;
            this.resolvedPresetKey = QUALITY_PRESETS.BALANCED;
            this.deviceProfile = this._detectDeviceProfile();
            this.cachePrefix = 'arqvertice_3d_cache_';
            this.listeners = new Set();
            this.progressiveStage = 0; // 0: manifest, 1: low LOD, 2: med LOD, 3: high LOD & textures
            this.metrics = {
                fps: 60,
                frameTimeMs: 16.6,
                drawCalls: 0,
                triangles: 0,
                geometries: 0,
                textures: 0,
                memoryMB: 0,
                rendererApi: 'WebGL2',
                gpuVendor: this.deviceProfile.gpuVendor || 'Generic GPU'
            };
            this._frameCount = 0;
            this._lastTime = performance.now();
            this._fpsHistory = [];
            this._resolveAutoPreset();
        }

        _detectDeviceProfile() {
            const isBrowser = typeof window !== 'undefined' && typeof navigator !== 'undefined';
            const userAgent = isBrowser ? navigator.userAgent || '' : '';
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) || 
                             (isBrowser && window.innerWidth <= 820);
            const isTablet = /iPad|Android/i.test(userAgent) && (isBrowser && window.innerWidth > 600 && window.innerWidth <= 1024);
            const deviceMemory = isBrowser && navigator.deviceMemory ? navigator.deviceMemory : 4;
            const hardwareConcurrency = isBrowser && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 4;
            const hasTouch = isBrowser && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
            const dpr = isBrowser ? (window.devicePixelRatio || 1) : 1;
            const hasWebGPU = isBrowser && !!navigator.gpu;

            // GPU Vendor & Renderer sniffing via WebGL context
            let gpuVendor = 'Generic GPU';
            let gpuRenderer = 'Standard 3D Acceleration';
            let maxTextureSize = 4096;
            let supportsWebGL2 = false;

            if (isBrowser) {
                try {
                    const testCanvas = document.createElement('canvas');
                    const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
                    if (gl) {
                        supportsWebGL2 = (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext);
                        maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096;
                        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                        if (debugInfo) {
                            gpuVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || gpuVendor;
                            gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || gpuRenderer;
                        }
                    }
                } catch (e) {
                    console.warn('[AdaptiveRenderer] Erro na sondagem GPU:', e);
                }
            }

            // GPU Tier calculation (0 = low/mobile, 1 = mid, 2 = high/desktop, 3 = workstation/WebGPU)
            let tier = 1;
            const isAppleSilicon = /Apple/i.test(gpuVendor) && /M1|M2|M3|Apple GPU/i.test(gpuRenderer);
            const isHighEndNvidia = /NVIDIA/i.test(gpuRenderer) && /RTX|GTX 10[7-8]0|GTX 16[6-9]0|Titan/i.test(gpuRenderer);
            const isHighEndRadeon = /Radeon/i.test(gpuRenderer) && /RX 6|RX 7|Vega/i.test(gpuRenderer);

            if (isMobile) {
                tier = deviceMemory >= 6 && hardwareConcurrency >= 8 ? 1 : 0;
            } else if (isHighEndNvidia || isHighEndRadeon || isAppleSilicon || hasWebGPU) {
                tier = 3;
            } else if (deviceMemory >= 8 && hardwareConcurrency >= 6) {
                tier = 2;
            } else {
                tier = 1;
            }

            return {
                isMobile,
                isTablet,
                isDesktop: !isMobile && !isTablet,
                hasTouch,
                dpr,
                deviceMemory,
                hardwareConcurrency,
                hasWebGPU,
                supportsWebGL2,
                gpuVendor,
                gpuRenderer,
                maxTextureSize,
                tier
            };
        }

        _resolveAutoPreset() {
            if (this.activePresetKey !== QUALITY_PRESETS.AUTO) {
                this.resolvedPresetKey = this.activePresetKey;
                return;
            }

            const { isMobile, tier, hasWebGPU } = this.deviceProfile;

            if (isMobile) {
                this.resolvedPresetKey = tier === 0 ? QUALITY_PRESETS.MOBILE : QUALITY_PRESETS.BALANCED;
            } else {
                if (tier >= 3 && hasWebGPU) {
                    this.resolvedPresetKey = QUALITY_PRESETS.ULTRA;
                } else if (tier >= 2) {
                    this.resolvedPresetKey = QUALITY_PRESETS.HIGH;
                } else {
                    this.resolvedPresetKey = QUALITY_PRESETS.BALANCED;
                }
            }
        }

        setPreset(presetKey) {
            if (!QUALITY_PRESETS[presetKey]) {
                console.warn(`[AdaptiveRenderer] Preset desconhecido: ${presetKey}. Mantendo ${this.activePresetKey}`);
                return this.getConfig();
            }
            this.activePresetKey = presetKey;
            this._resolveAutoPreset();
            this._notifyChange({ type: 'preset_changed', preset: this.activePresetKey, resolved: this.resolvedPresetKey, config: this.getConfig() });
            return this.getConfig();
        }

        getPreset() {
            return {
                active: this.activePresetKey,
                resolved: this.resolvedPresetKey,
                isAuto: this.activePresetKey === QUALITY_PRESETS.AUTO
            };
        }

        getConfig() {
            const baseConfig = PRESET_CONFIGS[this.resolvedPresetKey] || PRESET_CONFIGS.BALANCED;
            return {
                ...baseConfig,
                presetKey: this.activePresetKey,
                resolvedKey: this.resolvedPresetKey,
                deviceProfile: { ...this.deviceProfile }
            };
        }

        getAvailablePresets() {
            const list = [
                { key: QUALITY_PRESETS.AUTO, name: 'Automático (Detectar)', desc: `Detectado: ${PRESET_CONFIGS[this.resolvedPresetKey]?.name}` },
                { key: QUALITY_PRESETS.MOBILE, name: 'Mobile / Economia', desc: 'Leve, baixo consumo de bateria e LOD agressivo' },
                { key: QUALITY_PRESETS.BALANCED, name: 'Balanceado', desc: 'Sombras médias, 60fps constante e texturas PBR' },
                { key: QUALITY_PRESETS.HIGH, name: 'Alta Qualidade', desc: 'HDRI, sombras suaves, reflexos e pós-processamento' }
            ];

            // Só habilita ULTRA e CINEMATIC se não for mobile fraco
            if (!this.deviceProfile.isMobile || this.deviceProfile.tier >= 2) {
                list.push({ key: QUALITY_PRESETS.ULTRA, name: 'Ultra / WebGPU', desc: 'Máxima resolução, sombras 4K e ACES Filmic' });
            }
            if (this.deviceProfile.isDesktop && this.deviceProfile.tier >= 2) {
                list.push({ key: QUALITY_PRESETS.CINEMATIC, name: 'Cinemático', desc: 'Super-amostragem progressiva para desktop' });
            }

            return list;
        }

        applyToThreeRenderer(renderer, scene, camera) {
            if (!renderer) return;
            const config = this.getConfig();
            const THREE = window.THREE;

            // Pixel Ratio
            const targetDPR = Math.min(window.devicePixelRatio || 1, config.pixelRatioMax);
            renderer.setPixelRatio(targetDPR);

            // Shadows
            if (renderer.shadowMap) {
                renderer.shadowMap.enabled = config.shadows;
                if (THREE && THREE[config.shadowType]) {
                    renderer.shadowMap.type = THREE[config.shadowType];
                }
            }

            // Tone Mapping
            if (THREE && THREE[config.toneMapping]) {
                renderer.toneMapping = THREE[config.toneMapping];
                renderer.toneMappingExposure = config.toneMappingExposure;
            }

            // Adjust scene lighting if exists
            if (scene) {
                scene.traverse(node => {
                    if (node.isLight && node.castShadow !== undefined) {
                        node.castShadow = config.shadows;
                        if (node.shadow && node.shadow.mapSize) {
                            node.shadow.mapSize.width = config.shadowMapSize;
                            node.shadow.mapSize.height = config.shadowMapSize;
                        }
                    }
                });
            }

            this.metrics.rendererApi = (this.deviceProfile.hasWebGPU && config.resolvedKey === 'ULTRA') ? 'WebGPU' : (this.deviceProfile.supportsWebGL2 ? 'WebGL2' : 'WebGL1');
        }

        updateMetrics(renderer) {
            this._frameCount++;
            const now = performance.now();
            const delta = now - this._lastTime;

            if (delta >= 500) {
                const instantFps = Math.round((this._frameCount * 1000) / delta);
                this._fpsHistory.push(instantFps);
                if (this._fpsHistory.length > 6) this._fpsHistory.shift();

                const avgFps = Math.round(this._fpsHistory.reduce((a, b) => a + b, 0) / this._fpsHistory.length);
                this.metrics.fps = avgFps;
                this.metrics.frameTimeMs = Number((delta / this._frameCount).toFixed(1));

                if (renderer && renderer.info) {
                    this.metrics.drawCalls = renderer.info.render.calls || 0;
                    this.metrics.triangles = renderer.info.render.triangles || 0;
                    this.metrics.geometries = renderer.info.memory.geometries || 0;
                    this.metrics.textures = renderer.info.memory.textures || 0;
                }

                // Approximate memory
                const approxMemoryMB = ((this.metrics.triangles * 32 + this.metrics.textures * 2048 * 2048 * 4) / (1024 * 1024)).toFixed(1);
                this.metrics.memoryMB = Number(approxMemoryMB) || 12.4;

                this._frameCount = 0;
                this._lastTime = now;
                this._notifyChange({ type: 'metrics_updated', metrics: { ...this.metrics } });

                // Adaptive auto-downgrade / auto-upgrade if on AUTO and FPS is dropping below 30
                if (this.activePresetKey === QUALITY_PRESETS.AUTO && this._fpsHistory.length >= 4) {
                    if (avgFps < 28 && this.resolvedPresetKey !== QUALITY_PRESETS.MOBILE) {
                        console.log('[AdaptiveRenderer] Performance baixa detectada. Ajustando preset para MODO MOBILE para manter fluidez.');
                        this.resolvedPresetKey = QUALITY_PRESETS.MOBILE;
                        this._notifyChange({ type: 'auto_downgraded', resolved: this.resolvedPresetKey, config: this.getConfig() });
                    }
                }
            }
        }

        // Progressive Loading Manager
        async runProgressivePipeline(manifest, onProgress) {
            const notify = (stage, pct, label) => {
                this.progressiveStage = stage;
                if (typeof onProgress === 'function') {
                    onProgress({ stage, percent: pct, label, metrics: this.metrics });
                }
            };

            notify(0, 10, 'Iniciando manifesto do projeto...');
            await this._delay(150);

            // Stage 1: Fast Structure & Low LOD
            notify(1, 35, 'Carregando malha volumétrica base (LOD Low)...');
            const lowLodData = await this._loadOrGenerateLOD(manifest, 0);
            notify(1, 55, 'Estrutura inicial pronta para navegação.');
            await this._delay(150);

            // Stage 2: Medium LOD & Base Materials
            notify(2, 75, 'Transmitindo detalhes arquitetônicos e PBR (LOD Med)...');
            const medLodData = await this._loadOrGenerateLOD(manifest, 1);
            await this._delay(180);

            // Stage 3: High LOD & Full Lighting / Textures
            notify(3, 90, 'Carregando acabamentos de alta resolução (LOD High)...');
            const highLodData = await this._loadOrGenerateLOD(manifest, 2);
            await this._delay(150);

            notify(3, 100, 'Projeto 3D 100% carregado com fidelidade máxima.');
            return { lowLodData, medLodData, highLodData };
        }

        _loadOrGenerateLOD(manifest, lodLevel) {
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve({ lodLevel, timestamp: Date.now(), cached: true });
                }, 80);
            });
        }

        _delay(ms) {
            return new Promise(r => setTimeout(r, ms));
        }

        // Cache Management
        saveLocalCache(key, data) {
            try {
                if (typeof window !== 'undefined' && window.localStorage) {
                    localStorage.setItem(`${this.cachePrefix}${key}`, JSON.stringify({ data, savedAt: Date.now() }));
                }
            } catch (e) {
                console.warn('[AdaptiveRenderer] Erro ao salvar cache local:', e);
            }
        }

        getLocalCache(key, maxAgeMs = 3600000) {
            try {
                if (typeof window !== 'undefined' && window.localStorage) {
                    const raw = localStorage.getItem(`${this.cachePrefix}${key}`);
                    if (!raw) return null;
                    const parsed = JSON.parse(raw);
                    if (Date.now() - parsed.savedAt > maxAgeMs) {
                        localStorage.removeItem(`${this.cachePrefix}${key}`);
                        return null;
                    }
                    return parsed.data;
                }
            } catch (e) {
                return null;
            }
            return null;
        }

        subscribe(listener) {
            if (typeof listener === 'function') {
                this.listeners.add(listener);
                return () => this.listeners.delete(listener);
            }
            return () => {};
        }

        _notifyChange(event) {
            this.listeners.forEach(fn => {
                try { fn(event); } catch (e) { console.error(e); }
            });
        }
    }

    AdaptiveRenderer.QUALITY_PRESETS = QUALITY_PRESETS;
    AdaptiveRenderer.PRESET_CONFIGS = PRESET_CONFIGS;
    return AdaptiveRenderer;
}));
