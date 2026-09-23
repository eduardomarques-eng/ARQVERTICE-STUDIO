/**
 * js/observability/logger.js
 * ArqVértice Studio — Structured JSON Logger & Audit Engine
 * Garante rastreabilidade com correlationId, durationMs e máscara estrita de secrets.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ArqVerticeLogger = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SENSITIVE_KEYS = new Set([
    'apikey', 'api_key', 'authorization', 'bearer', 'token',
    'secret', 'password', 'jwt', 'clientsecret', 'privatekey'
  ]);

  function sanitize(data) {
    if (data === null || data === undefined) return data;
    if (typeof data === 'string') {
      return data
        .replace(/(Bearer\s+)[A-Za-z0-9\-\._~+/]+=*/gi, '$1[REDACTED]')
        .replace(/(sk-[a-zA-Z0-9_\-]{8,})/gi, '[REDACTED]');
    }
    if (Array.isArray(data)) return data.map(sanitize);
    if (typeof data === 'object') {
      const cleaned = {};
      for (const [key, value] of Object.entries(data)) {
        const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (SENSITIVE_KEYS.has(normalized) || normalized.includes('secret') || normalized.includes('password') || normalized.includes('token')) {
          cleaned[key] = '[REDACTED]';
        } else {
          cleaned[key] = sanitize(value);
        }
      }
      return cleaned;
    }
    return data;
  }

  class StructuredLogger {
    constructor(serviceName = 'arqvertice-core') {
      this.serviceName = serviceName;
    }

    _log(level, message, metadata = {}, correlationId = null, durationMs = null) {
      const entry = {
        timestamp: new Date().toISOString(),
        level: level.toUpperCase(),
        service: this.serviceName,
        correlationId: correlationId || `cid_${Math.random().toString(36).slice(2, 10)}`,
        action: metadata.action || 'GENERAL_EXECUTION',
        durationMs: durationMs !== null ? Number(durationMs.toFixed(2)) : undefined,
        message: sanitize(message),
        metadata: sanitize(metadata)
      };

      // Formato JSON estrito para logs de produção
      const jsonString = JSON.stringify(entry);
      if (level === 'ERROR') {
        console.error(jsonString);
      } else if (level === 'WARN') {
        console.warn(jsonString);
      } else {
        console.log(jsonString);
      }

      return entry;
    }

    info(message, metadata, correlationId, durationMs) {
      return this._log('INFO', message, metadata, correlationId, durationMs);
    }

    warn(message, metadata, correlationId, durationMs) {
      return this._log('WARN', message, metadata, correlationId, durationMs);
    }

    error(message, metadata, correlationId, durationMs) {
      return this._log('ERROR', message, metadata, correlationId, durationMs);
    }

    debug(message, metadata, correlationId, durationMs) {
      return this._log('DEBUG', message, metadata, correlationId, durationMs);
    }
  }

  return {
    StructuredLogger,
    sanitize
  };
}));
