#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const RevitLocalConnector = require('../js/revit-local-connector.js');
const RevitToolchain = require('../js/revit-toolchain.js');

const command = process.argv[2] || 'status';
const root = path.resolve(__dirname, '..');
const connector = new RevitLocalConnector({ useVirtualDriver: false, expectedRevitVersion: '2026' });
const toolchain = new RevitToolchain({ connector });

function print(value) {
    process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

(async () => {
    switch (command) {
        case 'status':
            print({ status: connector.connectionState, port: connector.port, expectedRevitVersion: '2026' });
            break;
        case 'connect':
            print(await toolchain.connect());
            break;
        case 'doctor':
            print(await toolchain.doctor({
                probe: {
                    addinInstalled: fs.existsSync(path.join(root, 'revit-addon', 'ArqVertice.addin')),
                    dotnetRuntime: true,
                    pyRevitDetected: false,
                    arqVerticeAvailable: true
                }
            }));
            break;
        case 'install':
            print({ status: 'MANUAL_INSTALL_REQUIRED', manifest: path.join(root, 'revit-addon', 'ArqVertice.addin'), target: '%APPDATA%\\Autodesk\\Revit\\Addins\\2026' });
            break;
        case 'logs':
            print({ status: 'NO_PERSISTED_LOGS', location: path.join(root, 'logs', 'revit') });
            break;
        case 'test':
            print({ status: 'RUN_WITH_NODE', command: 'node tests/revit-toolchain.test.js' });
            break;
        default:
            process.stderr.write('Uso: arq-revit status|connect|install|doctor|logs|test\n');
            process.exitCode = 2;
    }
})().catch(error => {
    print({ status: 'ERROR', error: error.message });
    process.exitCode = 1;
});
