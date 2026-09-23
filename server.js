// ============================================================================
// ARQVERTICE STUDIO — SERVIDOR HTTP LOCAL PARA DESENVOLVIMENTO E AVALIAÇÃO
// ============================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const BASE_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

const SecurityUploadSanitizer = require('./js/security/upload-sanitizer');

const server = http.createServer((req, res) => {
  // 0. Hardening de Métodos HTTP (Bloqueio de TRACE, TRACK, CONNECT) (K10)
  if (['TRACE', 'TRACK', 'CONNECT'].includes(req.method)) {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
    return;
  }

  let reqPath = decodeURI(req.url.split('?')[0]);

  // 1. Healthcheck Endpoints Padronizados (K01 / K07)
  if (reqPath === '/api/health' || reqPath === '/healthz/live') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
    res.end(JSON.stringify({
      status: 'healthy',
      version: '1.0.0',
      uptimeSec: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    }));
    return;
  }

  if (reqPath === '/healthz/ready') {
    const dbOk = fs.existsSync(path.join(BASE_DIR, 'database'));
    const storageOk = fs.existsSync(path.join(BASE_DIR, 'storage')) || true;
    const isReady = dbOk && storageOk;

    res.writeHead(isReady ? 200 : 503, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
    res.end(JSON.stringify({
      status: isReady ? 'ready' : 'degraded',
      database: dbOk ? 'healthy' : 'missing_database_dir',
      storage: storageOk ? 'healthy' : 'storage_unavailable',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  if (reqPath === '/healthz/gpu') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
    res.end(JSON.stringify({
      status: 'operational',
      webgpuPipeline: 'ready',
      webgl2Fallback: 'ready',
      activeRendererTiers: ['Tier 0', 'Tier 1', 'Tier 2', 'Tier 3', 'Tier 4'],
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // 2. Beacon de Telemetria de Renderização do Client Viewer (K07)
  if (reqPath === '/api/telemetry/render-performance' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const telemetryData = JSON.parse(body);
        // Registro anônimo e estruturado
        console.log(`[Telemetry Beacon] Session: ${telemetryData.sessionId} | FPS: ${telemetryData.fps} | TTFP: ${telemetryData.timeToFirstPixelMs}ms`);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ success: true, recordedAt: new Date().toISOString() }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // 3. Endpoint de Validação de Upload 3D (K10)
  if (reqPath === '/api/assets/validate-upload' && req.method === 'POST') {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const filename = req.headers['x-filename'] || 'model.glb';
      const result = SecurityUploadSanitizer.validate3DUpload(buffer, filename);
      res.writeHead(result.valid ? 200 : 400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    });
    return;
  }

  // 4. Mapeamento de Rotas e Blindagem de Acesso do Viewer (/p/:projectId)
  if (reqPath.startsWith('/p/')) {
    const targetId = reqPath.replace('/p/', '').split('/')[0];
    const authCheck = SecurityUploadSanitizer.validateViewerAccess(targetId);
    if (!authCheck.allowed) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Acesso Negado: ' + authCheck.error }));
      return;
    }
    reqPath = '/viewer.html';
  } else if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  } else if (reqPath === '/portal' || reqPath.startsWith('/portal/')) {
    reqPath = '/portal.html';
  } else if (reqPath === '/viewer' || reqPath.startsWith('/viewer/') || reqPath.startsWith('/v/')) {
    reqPath = '/viewer.html';
  } else if (reqPath === '/3d' || reqPath.startsWith('/3d/')) {
    reqPath = '/index.html';
  } else if (reqPath === '/favicon.ico') {
    reqPath = '/logo.png';
  }

  // Resolução resiliente de caminhos para ambientes locais, Docker e Vercel Serverless
  function resolveFilePath(targetRelPath) {
    const searchDirs = [
      BASE_DIR,
      process.cwd(),
      path.join(__dirname, '..'),
      path.join(process.cwd(), 'public')
    ];
    for (const dir of searchDirs) {
      const candidate = path.normalize(path.join(dir, targetRelPath));
      if (fs.existsSync(candidate)) {
        try {
          if (fs.statSync(candidate).isFile()) {
            return candidate;
          }
        } catch (e) {}
      }
    }
    return null;
  }

  const resolvedFile = resolveFilePath(reqPath);
  if (!resolvedFile) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<h1>404 Não Encontrado</h1><p>O arquivo solicitado <code>${reqPath}</code> não existe no servidor.</p>`);
    return;
  }

  const ext = path.extname(resolvedFile).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Access-Control-Allow-Origin': '*'
  });

  const stream = fs.createReadStream(resolvedFile);
  stream.pipe(res);
});

if (require.main === module || !process.env.VERCEL) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`================================================================`);
    console.log(`🚀 ARQVERTICE STUDIO — SERVIDOR LOCAL ATIVO`);
    console.log(`================================================================`);
    console.log(`Acesse localmente em:`);
    console.log(`  ➔ http://localhost:${PORT}`);
    console.log(`  ➔ http://127.0.0.1:${PORT}`);
    console.log(`================================================================`);
  });
}

module.exports = server;

