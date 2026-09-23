/*
 * ArqVertice Studio - renderer abstraction.
 * WebGPU is preferred when available; WebGL2 remains the compatibility path.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.RendererAdapter = factory();
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class RendererAdapter {
        constructor(options = {}) {
            this.preferred = options.preferred || 'auto';
            this.mode = 'UNAVAILABLE';
            this.capabilities = { webgpu: false, webgl2: false };
        }

        detect(environment = {}) {
            const navigatorRef = environment.navigator || (typeof navigator !== 'undefined' ? navigator : null);
            const canvas = environment.canvas || null;
            this.capabilities.webgpu = !!(navigatorRef && navigatorRef.gpu);
            this.capabilities.webgl2 = !!(canvas && typeof canvas.getContext === 'function' && canvas.getContext('webgl2'));
            if (this.preferred === 'webgpu' && this.capabilities.webgpu) this.mode = 'WEBGPU';
            else if (this.preferred === 'webgl2' && this.capabilities.webgl2) this.mode = 'WEBGL2';
            else if (this.capabilities.webgpu) this.mode = 'WEBGPU';
            else if (this.capabilities.webgl2) this.mode = 'WEBGL2';
            else this.mode = 'UNAVAILABLE';
            return this.getInfo();
        }

        getInfo() {
            return { mode: this.mode, capabilities: { ...this.capabilities }, fallback: this.mode === 'WEBGL2' };
        }

        createRenderer(options = {}) {
            if (this.mode === 'UNAVAILABLE') throw new Error('Nenhum renderer WebGPU/WebGL2 disponivel.');
            return { type: this.mode, antialias: options.antialias !== false, powerPreference: options.powerPreference || 'high-performance' };
        }
    }

    RendererAdapter.MODES = Object.freeze(['WEBGPU', 'WEBGL2', 'UNAVAILABLE']);
    return RendererAdapter;
}));
