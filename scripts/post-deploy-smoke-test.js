const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

async function executeRequest(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const latencyMs = Date.now() - startTime;
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          latencyMs
        });
      });
    });

    req.on('error', err => reject(err));
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error(`Timeout ao conectar a ${url}`));
    });
  });
}

async function runPostDeploySmokeTest(targetUrl = process.env.TARGET_URL) {
  let childProcess = null;
  let baseUrl = targetUrl;

  // Se não foi passado TARGET_URL explícito, tenta conectar ao 3000 ou sobe servidor efêmero de teste
  if (!baseUrl) {
    baseUrl = 'http://127.0.0.1:3000';
    try {
      await executeRequest(`${baseUrl}/api/health`);
    } catch {
      // Sobe servidor temporário na porta 3999
      const testPort = 3999;
      baseUrl = `http://127.0.0.1:${testPort}`;
      
      childProcess = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
        env: { ...process.env, PORT: String(testPort) },
        stdio: 'pipe'
      });

      // Aguarda o servidor inicializar
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Servidor de teste não inicializou a tempo')), 4000);
        childProcess.stdout.on('data', data => {
          if (data.toString().includes('SERVIDOR LOCAL ATIVO')) {
            clearTimeout(timeout);
            resolve();
          }
        });
        childProcess.on('error', reject);
      });
    }
  }

  console.log('================================================================');
  console.log(`🩺 ARQVERTICE STUDIO — POST-DEPLOY SMOKE TEST (K18)`);
  console.log(`🌐 Alvo: ${baseUrl}`);
  console.log('================================================================\n');

  const testRoutes = [
    { path: '/api/health', expectedStatus: 200, name: 'Healthcheck API' },
    { path: '/healthz/ready', expectedStatus: 200, name: 'Readiness Probe' },
    { path: '/healthz/gpu', expectedStatus: 200, name: 'WebGPU / WebGL Probe' },
    { path: '/', expectedStatus: 200, name: 'Studio Home (index.html)' },
    { path: '/portal.html', expectedStatus: 200, name: 'Client Portal' },
    { path: '/viewer.html', expectedStatus: 200, name: '3D Client Viewer' },
    { path: '/p/a3b8c910-1234-4567-89ab-cdef01234567', expectedStatus: 200, name: 'Secure Project Viewer Route' },
    { path: '/p/1', expectedStatus: 403, name: 'IDOR Sequential Block (403 Expected)' },
    { path: '/styles.css', expectedStatus: 200, name: 'Core Design System CSS' },
    { path: '/js/state.js', expectedStatus: 200, name: 'Canonical State Module' },
    { path: '/logo.png', expectedStatus: 200, name: 'Brand Asset' }
  ];

  const results = [];
  let failures = 0;

  for (const route of testRoutes) {
    const fullUrl = `${baseUrl}${route.path}`;
    try {
      const res = await executeRequest(fullUrl);
      const passed = res.statusCode === route.expectedStatus && res.latencyMs < 1000;
      if (!passed) failures++;

      console.log(`  ${passed ? '✔' : '❌'} [HTTP ${res.statusCode}] ${route.name} (${res.latencyMs}ms) ➔ ${route.path}`);
      results.push({ ...route, actualStatus: res.statusCode, latencyMs: res.latencyMs, passed });
    } catch (err) {
      failures++;
      console.error(`  ❌ [FALHA DE REDE] ${route.name} ➔ ${err.message}`);
      results.push({ ...route, error: err.message, passed: false });
    }
  }

  if (childProcess) {
    childProcess.kill();
  }

  console.log('\n----------------------------------------------------------------');
  console.log(`TOTAL DE ROTAS TESTADAS: ${testRoutes.length} | APROVADAS: ${testRoutes.length - failures} | FALHAS: ${failures}`);

  if (failures === 0) {
    console.log('🎉 SMOKE TEST PÓS-DEPLOY APROVADO COM 100% DE SUCESSO!');
    console.log('================================================================\n');
    return { success: true, results };
  } else {
    console.error('⚠️ FALHAS DETECTADAS NO SMOKE TEST DE PRODUÇÃO.');
    console.log('================================================================\n');
    return { success: false, results };
  }
}

if (require.main === module) {
  runPostDeploySmokeTest().then(res => {
    process.exit(res.success ? 0 : 1);
  });
}

module.exports = { runPostDeploySmokeTest };
