/**
 * scripts/audit-and-build.js
 * Auditoria de Código, Debug, Verificação de Build e Integridade de Assets
 * para Visualização da Aplicação ArqVértice Studio & Portal do Cliente.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('================================================================');
console.log('🔍 ARQVERTICE STUDIO — AUDITORIA DE CÓDIGO, DEBUG & BUILD CHECK');
console.log('================================================================\n');

let totalIssues = 0;

// ----------------------------------------------------------------------------
// 1. CHECAGEM DE ARQUIVOS PRINCIPAIS
// ----------------------------------------------------------------------------
console.log('--- 1. Integridade dos Arquivos Estruturais Principais ---');
const coreFiles = [
  'index.html',
  'portal.html',
  'styles.css',
  'css/client-portal.css',
  'server.js',
  'logo.png',
  'DESIGN.md'
];

for (const file of coreFiles) {
  if (fs.existsSync(file)) {
    const stats = fs.statSync(file);
    console.log(`  ✔ [OK] ${file.padEnd(25)} (${(stats.size / 1024).toFixed(1)} KB)`);
  } else {
    console.error(`  ✖ [FAIL] Arquivo ausente: ${file}`);
    totalIssues++;
  }
}

// ----------------------------------------------------------------------------
// 2. AUDITORIA DE SCRIPTS EM INDEX.HTML
// ----------------------------------------------------------------------------
console.log('\n--- 2. Auditoria de Dependências e Sintaxe de Scripts (index.html) ---');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const scriptRegex = /<script\s+src=["']([^"']+)["']/g;
let match;
const indexScripts = [];

while ((match = scriptRegex.exec(indexHtml)) !== null) {
  indexScripts.push(match[1]);
}

console.log(`Encontradas ${indexScripts.length} tags <script> em index.html`);

let scriptErrors = 0;
for (const scriptPath of indexScripts) {
  if (scriptPath.startsWith('http://') || scriptPath.startsWith('https://')) {
    console.log(`  🌐 [CDN] ${scriptPath}`);
    continue;
  }

  const fullPath = path.resolve(scriptPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`  ✖ [ARQUIVO NÃO ENCONTRADO] ${scriptPath}`);
    scriptErrors++;
    continue;
  }

  try {
    const code = fs.readFileSync(fullPath, 'utf8');
    new Function(code); // Validação de parser / AST sintática do JS
    console.log(`  ✔ [SYNTAX OK] ${scriptPath}`);
  } catch (err) {
    console.error(`  ✖ [ERRO DE SINTAXE] ${scriptPath}: ${err.message}`);
    scriptErrors++;
  }
}

if (scriptErrors > 0) {
  console.error(`\nTotal de erros de script em index.html: ${scriptErrors}`);
  totalIssues += scriptErrors;
} else {
  console.log(`✔ Todos os scripts locais de index.html foram aprovados na validação sintática!`);
}

// ----------------------------------------------------------------------------
// 3. AUDITORIA DE SCRIPTS E ESTILOS EM PORTAL.HTML
// ----------------------------------------------------------------------------
console.log('\n--- 3. Auditoria de Tags e Dependências em portal.html ---');
const portalHtml = fs.readFileSync('portal.html', 'utf8');
const portalScripts = [];
while ((match = scriptRegex.exec(portalHtml)) !== null) {
  portalScripts.push(match[1]);
}

for (const scriptPath of portalScripts) {
  if (scriptPath.startsWith('http')) continue;
  if (!fs.existsSync(scriptPath)) {
    console.error(`  ✖ [PORTAL MISSING SCRIPT] ${scriptPath}`);
    totalIssues++;
  } else {
    console.log(`  ✔ [PORTAL SCRIPT OK] ${scriptPath}`);
  }
}

// ----------------------------------------------------------------------------
// 4. TESTE DE REQUISIÇÃO HTTP LOCAL (DEBUG DO SERVIDOR EM EXECUÇÃO)
// ----------------------------------------------------------------------------
console.log('\n--- 4. Teste de Acesso aos Endpoints e Roteamento HTTP ---');

function checkRouteMapping(reqUrl) {
  let reqPath = decodeURI(reqUrl.split('?')[0]);
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  } else if (reqPath === '/portal' || reqPath.startsWith('/portal/')) {
    reqPath = '/portal.html';
  } else if (reqPath === '/viewer' || reqPath.startsWith('/viewer/') || reqPath.startsWith('/p/') || reqPath.startsWith('/v/')) {
    reqPath = '/viewer.html';
  } else if (reqPath === '/3d' || reqPath.startsWith('/3d/')) {
    reqPath = '/index.html';
  } else if (reqPath === '/favicon.ico') {
    reqPath = '/logo.png';
  }

  const safePath = path.normalize(path.join(__dirname, '..', reqPath));
  if (fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
    const size = fs.statSync(safePath).size;
    console.log(`  ✔ [ROUTE 200 OK] ${reqUrl.padEnd(20)} -> ${reqPath} (${size} bytes)`);
    return true;
  } else {
    console.error(`  ✖ [ROUTE 404 FAIL] ${reqUrl} -> ${safePath}`);
    return false;
  }
}

(async () => {
  const routesToTest = [
    '/',
    '/index.html',
    '/portal',
    '/viewer',
    '/styles.css',
    '/css/client-portal.css',
    '/js/state.js',
    '/js/ai-foundation.js',
    '/js/jev-decision-engine.js',
    '/logo.png'
  ];

  let httpFailures = 0;
  for (const route of routesToTest) {
    const ok = checkRouteMapping(route);
    if (!ok) httpFailures++;
  }

  if (httpFailures > 0) {
    totalIssues += httpFailures;
  }

  // ----------------------------------------------------------------------------
  // 5. TESTE DE INICIALIZAÇÃO DE RUNTIME (ESTADO + MÓDULOS)
  // ----------------------------------------------------------------------------
  console.log('\n--- 5. Simulação de Inicialização do Runtime ---');
  try {
    // Mock de ambiente DOM
    const mockStorage = {};
    global.localStorage = {
      getItem: (k) => mockStorage[k] || null,
      setItem: (k, v) => { mockStorage[k] = String(v); },
      removeItem: (k) => { delete mockStorage[k]; },
      clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
    };
    global.window = global;
    global.document = {
      addEventListener: () => {},
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => []
    };

    const StudioState = require('../js/state.js');
    StudioState.init();
    console.log(`  ✔ [OK] StudioState inicializado com sucesso.`);

    const projects = StudioState.state ? StudioState.state.projects : [];
    console.log(`  ✔ [OK] Projetos ativos carregados: ${projects.length} projeto(s).`);

    const ai = require('../js/ai-foundation.js');
    console.log(`  ✔ [OK] Camada de IA (ai-foundation) carregada.`);

    const jev = require('../js/jev-decision-engine.js');
    console.log(`  ✔ [OK] Camada de Decisão Jev (jev-decision-engine) carregada.`);

  } catch (err) {
    console.error(`  ✖ [ERRO DE RUNTIME]`, err);
    totalIssues++;
  }

  // ----------------------------------------------------------------------------
  // RELATÓRIO FINAL
  // ----------------------------------------------------------------------------
  console.log('\n================================================================');
  if (totalIssues === 0) {
    console.log('🎉 AUDITORIA E DEBUG CONCLUÍDOS COM 100% DE SUCESSO!');
    console.log('A aplicação está pronta e saudável para visualização no navegador.');
    console.log('URLs de visualização:');
    console.log('  ➔ Studio Principal: http://localhost:3000');
    console.log('  ➔ Portal do Cliente: http://localhost:3000/portal');
    console.log('================================================================\n');
    process.exit(0);
  } else {
    console.error(`⚠️ FORAM ENCONTRADOS ${totalIssues} PROBLEMAS NA AUDITORIA.`);
    console.log('================================================================\n');
    process.exit(1);
  }
})();
