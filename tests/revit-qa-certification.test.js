const assert = require('assert');
const fs = require('fs');
const path = require('path');
const RevitLocalConnector = require('../js/revit-local-connector.js');
const RevitReadEngine = require('../js/revit-read-engine.js');
const RevitTransactionSandbox = require('../js/revit-transaction-sandbox.js');
const RevitMCPAdapter = require('../js/revit-mcp-adapter.js');
const RevitQACertification = require('../js/revit-qa-certification.js');

(async () => {
    const requiredDocs = ['workspace', 'connector', 'project-sync', 'quantities', 'views', 'camera', '3d-bridge', 'command-center', 'elements', 'pyrevit', 'mcp', 'aps', 'security', 'qa', 'troubleshooting'];
    for (const documentName of requiredDocs) {
        assert.ok(fs.existsSync(path.join(__dirname, '..', 'docs', 'bim', 'revit', `${documentName}.md`)), `Documento ausente: ${documentName}.md`);
    }
    assert.ok(fs.existsSync(path.join(__dirname, 'fixtures', 'revit', 'J43_Test_Project.json')));

    const connector = new RevitLocalConnector({ useVirtualDriver: true });
    await connector.connect();
    const certification = new RevitQACertification({
        connector,
        readEngine: new RevitReadEngine(connector),
        sandbox: new RevitTransactionSandbox(connector),
        mcpAdapter: new RevitMCPAdapter(connector)
    });
    const report = await certification.run();

    assert.strictEqual(report.status, 'CERTIFIED');
    assert.deepStrictEqual(Object.keys(report.phases), RevitQACertification.PHASES);
    assert.strictEqual(report.testProject.dedicated, true);
    assert.ok(report.summary.checks >= 30);
    assert.strictEqual(report.phases.CONNECT.status, 'PASS');
    assert.strictEqual(report.phases.RECOVER.checks.find(check => check.name === 'rollback').status, 'PASS');

    const realProjectCertification = new RevitQACertification({
        connector,
        readEngine: new RevitReadEngine(connector),
        sandbox: new RevitTransactionSandbox(connector),
        mcpAdapter: new RevitMCPAdapter(connector),
        testProject: { id: 'REAL-MODEL', dedicated: false, mode: 'real' }
    });
    const blocked = await realProjectCertification.run({ destructiveOperations: ['delete'] });
    assert.strictEqual(blocked.status, 'NOT_CERTIFIED');
    assert.ok(blocked.errors.some(error => error.error.includes('bloqueada')));

    console.log('J43 Revit QA Certification: all tests passed');
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
