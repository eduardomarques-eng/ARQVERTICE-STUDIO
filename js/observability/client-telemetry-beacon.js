/**
 * js/observability/client-telemetry-beacon.js
 * ArqVértice Studio — Beacon de Telemetria e Performance do Client Viewer (Anônimo)
 * Suporta coleta de FPS, perda de contexto GPU, TTFP e chave de Opt-Out.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ClientTelemetryBeacon = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class ClientTelemetryBeacon {
    constructor(options = {}) {
      this.endpoint = options.endpoint || '/api/telemetry/render-performance';
      this.projectId = options.projectId || 'prj-praia-01';
      this.viewerSessionId = `vsess_${Math.random().toString(36).slice(2, 10)}`;
      this.samples = [];
      this.isOptedOut = this._checkOptOut();
    }

    _checkOptOut() {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem('arqvertice_telemetry_optout') === 'true';
      }
      return false;
    }

    setOptOut(optOut = true) {
      this.isOptedOut = !!optOut;
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('arqvertice_telemetry_optout', String(this.isOptedOut));
      }
      console.log(`[Telemetry] Status de Opt-Out atualizado: ${this.isOptedOut}`);
    }

    collectSystemCapabilities() {
      if (typeof window === 'undefined') return { runtime: 'NodeJS' };

      const nav = window.navigator || {};
      return {
        deviceMemoryGB: nav.deviceMemory || 8,
        hardwareConcurrency: nav.hardwareConcurrency || 8,
        userAgent: nav.userAgent || 'Unknown',
        webgpuSupported: !!nav.gpu,
        pixelRatio: window.devicePixelRatio || 1,
        screenWidth: window.innerWidth || 1920,
        screenHeight: window.innerHeight || 1080
      };
    }

    recordFrameMetrics({ fps = 60, frameTimeMs = 16.6, drawCalls = 40, gpuContextLost = false, ttfpMs = 380 }) {
      if (this.isOptedOut) return null;

      const payload = {
        timestamp: new Date().toISOString(),
        sessionId: this.viewerSessionId,
        projectId: this.projectId,
        fps: Number(fps.toFixed(1)),
        frameTimeMs: Number(frameTimeMs.toFixed(2)),
        drawCalls: Number(drawCalls),
        gpuContextLost: !!gpuContextLost,
        timeToFirstPixelMs: Number(ttfpMs),
        deviceCapabilities: this.collectSystemCapabilities()
      };

      this.samples.push(payload);
      return payload;
    }

    sendBeacon(payload = null) {
      if (this.isOptedOut) return false;

      const data = payload || this.samples[this.samples.length - 1];
      if (!data) return false;

      const jsonString = JSON.stringify(data);

      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        return navigator.sendBeacon(this.endpoint, jsonString);
      } else if (typeof fetch === 'function') {
        fetch(this.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: jsonString,
          keepalive: true
        }).catch(() => {});
        return true;
      }
      return false;
    }
  }

  return ClientTelemetryBeacon;
}));
