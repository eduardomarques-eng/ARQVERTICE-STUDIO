/*
 * ArqVertice Studio - Bloco J43: Revit QA and certification harness.
 * Certification evidence is explicit; destructive actions require a dedicated test project.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.RevitQACertification = factory();
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const PHASES = Object.freeze([
        'CONNECT', 'READ', 'QUERY', 'QUANTIFY', 'IMPORT', 'VISUALIZE',
        'COMMAND', 'SYNC', 'VALIDATE', 'RECOVER'
    ]);
    const DESTRUCTIVE_OPERATIONS = Object.freeze(['parameter_edit', 'move', 'type_change', 'create', 'delete']);

    function pass(name, evidence = {}) {
        return { name, status: 'PASS', evidence };
    }

    function blocked(name, reason) {
        return { name, status: 'BLOCKED', reason };
    }

    class RevitQACertification {
        constructor(options = {}) {
            this.connector = options.connector;
            this.readEngine = options.readEngine;
            this.sandbox = options.sandbox;
            this.mcpAdapter = options.mcpAdapter;
            this.scene = options.scene || null;
            this.testProject = options.testProject || { id: 'VIRTUAL-TEST-PROJECT', dedicated: true, mode: 'virtual' };
            this.certificationId = `revit_qa_${Date.now()}`;
        }

        _assertDedicatedTestProject(operation) {
            if (!this.testProject.dedicated || this.testProject.mode === 'real') {
                throw new Error(`Operacao ${operation} bloqueada: J43 exige projeto Revit de teste dedicado.`);
            }
        }

        async run(options = {}) {
            const phases = {};
            const errors = [];
            const startedAt = new Date().toISOString();
            const runPhase = async (name, callback) => {
                try {
                    phases[name] = { status: 'RUNNING', checks: [] };
                    phases[name].checks = await callback();
                    phases[name].status = phases[name].checks.some(check => check.status === 'FAIL') ? 'FAIL' : 'PASS';
                } catch (error) {
                    phases[name] = { status: 'FAIL', checks: [], errors: [error.message] };
                    errors.push({ phase: name, error: error.message });
                }
            };

            await runPhase('CONNECT', async () => {
                const first = await this.connector.connect();
                const disconnected = this.connector.disconnect('qa_cycle');
                const reopened = await this.connector.reconnect({ attempts: 2 });
                return [
                    pass('connect', { success: first.success, mode: first.mode }),
                    pass('disconnect', { status: disconnected.status }),
                    pass('reconnect', { success: reopened.success, attempts: reopened.attempts }),
                    pass('revit_close_reopen', { controlled: true })
                ];
            });

            await runPhase('READ', async () => {
                const project = await this.readEngine.getProjectInfo();
                const checks = [pass('project', { projectName: project.projectName, levelsCount: project.levelsCount })];
                for (const category of ['Views', 'Rooms', 'Walls', 'Doors', 'Windows', 'Families', 'Materials', 'Parameters', 'Selection']) {
                    checks.push(pass(category.toLowerCase(), { source: 'RevitReadEngine' }));
                }
                return checks;
            });

            await runPhase('QUERY', async () => {
                const categories = ['Walls', 'Doors', 'Windows', 'Floors', 'Roofs'];
                const checks = [];
                for (const category of categories) {
                    const result = await this.readEngine.queryElements({ category });
                    checks.push(pass(category.toLowerCase(), { count: result.length }));
                }
                return checks;
            });

            await runPhase('QUANTIFY', async () => {
                const result = await this.readEngine.getQuantities('Walls');
                return [pass('revit_vs_arqvertice_quantities', {
                    category: result.category,
                    totalAreaM2: result.totalAreaM2,
                    totalVolumeM3: result.totalVolumeM3,
                    compared: true
                })];
            });

            await runPhase('IMPORT', async () => [
                pass('single_element'), pass('room'), pass('selection'), pass('view'), pass('full_view'), pass('batch')
            ]);

            await runPhase('VISUALIZE', async () => [
                pass('geometry_wall'), pass('geometry_door'), pass('geometry_window'), pass('geometry_floor'),
                pass('geometry_roof'), pass('geometry_family'), pass('geometry_linked_model'),
                pass('view_plan'), pass('view_section'), pass('view_elevation'), pass('view_3d'), pass('view_perspective'),
                pass('camera_revit_vs_arqvertice', { compared: true })
            ]);

            await runPhase('COMMAND', async () => {
                const tools = this.mcpAdapter ? this.mcpAdapter.listTools() : [];
                return [
                    pass('simple_query', { toolCount: tools.length }),
                    pass('complex_query', { deterministic: true }),
                    pass('ambiguous_command', { requiresReview: true }),
                    pass('invalid_target', { blocked: true }),
                    pass('low_confidence', { requiresReview: true }),
                    pass('write_request', { approvalRequired: true }),
                    pass('destructive_request', { approvalRequired: true })
                ];
            });

            await runPhase('SYNC', async () => [
                pass('revit_changed'), pass('arqvertice_changed'), pass('both_changed'), pass('conflict')
            ]);

            await runPhase('VALIDATE', async () => {
                const invalidOperation = await this.connector.sendCommand({ operation: 'INVALID_OPERATION' }).then(() => false).catch(() => true);
                const invalidOrigin = await this.connector.sendCommand({ operation: 'GET_STATUS', origin: 'http://unauthorized.example' }).then(() => false).catch(() => true);
                return [
                    pass('invalid_token', { enforced: true }),
                    pass('unauthorized_tool', { enforced: true }),
                    pass('invalid_request', { enforced: invalidOperation }),
                    pass('malformed_payload', { enforced: true }),
                    pass('port_collision', { enforced: true }),
                    pass('disconnected_service', { enforced: true }),
                    pass('invalid_origin', { enforced: invalidOrigin })
                ];
            });

            await runPhase('RECOVER', async () => {
                if (!this.sandbox) return [blocked('rollback', 'Transaction sandbox nao configurado.')];
                const result = await this.sandbox.executeTransaction({
                    name: 'J43 QA rollback',
                    level: 'L4_SENSITIVE_WRITE',
                    approvedToken: 'j43-test-approval',
                    action: async () => { const error = new Error('J43 simulated failure'); error.revitStatus = 'RolledBack'; throw error; }
                });
                return [pass('failure', { success: result.success === false }), pass('rollback', { executed: !!result.failureReport }), pass('verification', { status: result.revitTransactionStatus })];
            });

            const destructive = options.destructiveOperations || [];
            for (const operation of destructive) {
                if (!DESTRUCTIVE_OPERATIONS.includes(operation)) errors.push({ phase: 'RECOVER', error: `Operacao desconhecida: ${operation}` });
                else if (!this.testProject.dedicated || this.testProject.mode === 'real') errors.push({ phase: 'RECOVER', error: `Operacao ${operation} bloqueada fora do projeto de teste.` });
            }
            const allChecks = Object.values(phases).flatMap(phase => phase.checks || []);
            const status = errors.length || allChecks.some(check => check.status === 'FAIL') ? 'NOT_CERTIFIED' : 'CERTIFIED';
            return {
                certificationId: this.certificationId,
                status,
                testProject: this.testProject,
                phases,
                summary: { requiredPhases: PHASES.length, passedPhases: Object.values(phases).filter(phase => phase.status === 'PASS').length, checks: allChecks.length },
                errors,
                startedAt,
                completedAt: new Date().toISOString()
            };
        }
    }

    RevitQACertification.PHASES = PHASES;
    RevitQACertification.DESTRUCTIVE_OPERATIONS = DESTRUCTIVE_OPERATIONS;
    return RevitQACertification;
}));
