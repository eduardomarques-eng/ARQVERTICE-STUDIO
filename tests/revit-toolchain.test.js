const assert = require('assert');
const net = require('net');
const RevitLocalConnector = require('../js/revit-local-connector.js');
const RevitToolchain = require('../js/revit-toolchain.js');

(async () => {
    const connector = new RevitLocalConnector({ useVirtualDriver: true, expectedRevitVersion: '2026' });
    const toolchain = new RevitToolchain({ connector });

    assert.ok(toolchain.listTools().some(tool => tool.tool === 'revit.changeset.commit'));
    const pairing = toolchain.beginPairing();
    assert.strictEqual(toolchain.pair(pairing.pairingCode, 'session-token').success, true);

    const connected = await toolchain.connect();
    assert.strictEqual(connected.success, true);
    assert.strictEqual(connector.isExpectedRevitVersion(), true);
    assert.strictEqual(connector.connectionState, 'CONNECTED');

    await assert.rejects(
        () => connector.sendCommand({ operation: 'GET_STATUS', origin: 'http://evil.example' }),
        /Origem não autorizada/
    );

    const doctor = await toolchain.doctor({
        probe: {
            revitInstalled: true,
            revit2026Detected: true,
            revitRunning: true,
            addinInstalled: true,
            connectorRunning: true,
            portAvailable: true,
            dotnetRuntime: true,
            pyRevitDetected: false,
            mcpAvailable: true,
            arqVerticeAvailable: true
        }
    });
    assert.strictEqual(doctor.ok, false, 'pyRevit ausente deve aparecer no doctor sem mascarar a falha');
    assert.strictEqual(doctor.checks.revit2026Detected, true);

    const disconnected = toolchain.disconnect('test');
    assert.strictEqual(disconnected.status, 'DISCONNECTED');
    const reconnected = await toolchain.reconnect({ attempts: 1 });
    assert.strictEqual(reconnected.success, true);

    const server = net.createServer(socket => {
        let buffer = '';
        socket.setEncoding('utf8');
        socket.on('data', chunk => {
            buffer += chunk;
            const end = buffer.indexOf('\n');
            if (end < 0) return;
            const request = JSON.parse(buffer.slice(0, end));
            const response = request.operation === 'STATUS'
                ? { status: 'success', sessionToken: 'tcp-token', data: { revitRunning: true, revitVersion: '2026.1', documentActive: true } }
                : { status: 'success', result: { operation: request.operation } };
            socket.end(`${JSON.stringify(response)}\n`);
        });
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const tcpConnector = new RevitLocalConnector({ port: server.address().port, useVirtualDriver: false, expectedRevitVersion: '2026' });
    const tcpConnected = await tcpConnector.connect();
    assert.strictEqual(tcpConnected.mode, 'LIVE_REVIT_DESKTOP');
    const tcpResult = await tcpConnector.sendCommand({ operation: 'GET_STATUS' });
    assert.strictEqual(tcpResult.result.operation, 'GET_STATUS');
    await new Promise(resolve => server.close(resolve));

    console.log('J41 RevitToolchain: all tests passed');
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
