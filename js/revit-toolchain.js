/*
 * ArqVertice Studio - Bloco J41: local Revit toolchain.
 * Keeps transport, pairing, diagnostics and tool policy in one testable boundary.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.RevitToolchain = factory();
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const TOOL_RISK = Object.freeze(['LOW', 'MEDIUM', 'HIGH']);
    const CHECKS = Object.freeze([
        'revitInstalled', 'revit2026Detected', 'revitRunning', 'addinInstalled',
        'connectorRunning', 'portAvailable', 'dotnetRuntime', 'pyRevitDetected',
        'mcpAvailable', 'arqVerticeAvailable'
    ]);

    function clone(value) {
        return value === undefined ? value : JSON.parse(JSON.stringify(value));
    }

    function defaultRegistry() {
        return [
            { tool: 'revit.status', schema: { type: 'object' }, permission: 'READ_ONLY', risk: 'LOW', timeout: 1500 },
            { tool: 'revit.project.info', schema: { type: 'object' }, permission: 'READ_ONLY', risk: 'LOW', timeout: 5000 },
            { tool: 'revit.elements.query', schema: { type: 'object', properties: { category: { type: 'string' } } }, permission: 'READ_ONLY', risk: 'LOW', timeout: 15000 },
            { tool: 'revit.changeset.preview', schema: { type: 'object', required: ['changes'] }, permission: 'PROPOSE', risk: 'MEDIUM', timeout: 10000 },
            { tool: 'revit.changeset.commit', schema: { type: 'object', required: ['changes', 'approvalToken'] }, permission: 'WRITE_REVERSIBLE', risk: 'HIGH', timeout: 30000 }
        ];
    }

    class RevitToolchain {
        constructor(options = {}) {
            if (!options.connector) throw new Error('RevitToolchain exige um connector.');
            this.connector = options.connector;
            this.expectedVersion = String(options.expectedVersion || '2026');
            this.registry = new Map();
            (options.registry || defaultRegistry()).forEach(entry => this.registerTool(entry));
            this.pairingCode = null;
            this.sessionToken = null;
        }

        registerTool(entry) {
            if (!entry || !entry.tool || !entry.schema || !entry.permission || !TOOL_RISK.includes(entry.risk)) {
                throw new Error('Ferramenta Revit deve declarar tool, schema, permission e risk valido.');
            }
            const normalized = { ...entry, timeout: Number(entry.timeout) > 0 ? Number(entry.timeout) : 30000 };
            this.registry.set(normalized.tool, normalized);
            return clone(normalized);
        }

        listTools() {
            return Array.from(this.registry.values()).map(clone);
        }

        beginPairing() {
            this.pairingCode = String(Math.floor(100000 + Math.random() * 900000));
            return { pairingCode: this.pairingCode, expiresInSeconds: 300 };
        }

        pair(code, token) {
            if (!this.pairingCode || String(code) !== this.pairingCode || !token) {
                return { success: false, error: 'PAIRING_INVALID' };
            }
            this.sessionToken = token;
            this.connector.sessionToken = token;
            this.pairingCode = null;
            return { success: true, status: 'PAIRED' };
        }

        async connect() {
            const result = await this.connector.connect();
            if (result.success && !this.connector.isExpectedRevitVersion()) {
                this.connector.disconnect('unsupported_revit_version');
                return { success: false, status: 'UNSUPPORTED_REVIT_VERSION', expected: this.expectedVersion, detected: result.state.revitVersion };
            }
            return result;
        }

        async reconnect(options = {}) {
            const result = await this.connector.reconnect(options);
            if (result.success && !this.connector.isExpectedRevitVersion()) {
                this.connector.disconnect('unsupported_revit_version');
                return { success: false, status: 'UNSUPPORTED_REVIT_VERSION', expected: this.expectedVersion, detected: result.state.revitVersion };
            }
            return result;
        }

        disconnect(reason) {
            return this.connector.disconnect(reason);
        }

        async doctor(options = {}) {
            const probe = options.probe || {};
            const state = this.connector.state || {};
            const checks = {
                revitInstalled: probe.revitInstalled !== undefined ? !!probe.revitInstalled : !!state.revitRunning,
                revit2026Detected: probe.revit2026Detected !== undefined ? !!probe.revit2026Detected : this.connector.isExpectedRevitVersion(),
                revitRunning: probe.revitRunning !== undefined ? !!probe.revitRunning : !!state.revitRunning,
                addinInstalled: probe.addinInstalled !== undefined ? !!probe.addinInstalled : false,
                connectorRunning: probe.connectorRunning !== undefined ? !!probe.connectorRunning : !!this.connector.isConnected,
                portAvailable: probe.portAvailable !== undefined ? !!probe.portAvailable : !!this.connector.isConnected,
                dotnetRuntime: probe.dotnetRuntime !== undefined ? !!probe.dotnetRuntime : false,
                pyRevitDetected: probe.pyRevitDetected !== undefined ? !!probe.pyRevitDetected : false,
                mcpAvailable: probe.mcpAvailable !== undefined ? !!probe.mcpAvailable : this.registry.size > 0,
                arqVerticeAvailable: probe.arqVerticeAvailable !== undefined ? !!probe.arqVerticeAvailable : true
            };
            return {
                ok: CHECKS.every(check => checks[check]),
                checks,
                version: state.revitVersion || null,
                build: state.revitBuild || null,
                connection: this.connector.connectionState || 'DISCONNECTED'
            };
        }
    }

    RevitToolchain.CHECKS = CHECKS;
    RevitToolchain.TOOL_RISK = TOOL_RISK;
    RevitToolchain.defaultRegistry = defaultRegistry;
    return RevitToolchain;
}));
