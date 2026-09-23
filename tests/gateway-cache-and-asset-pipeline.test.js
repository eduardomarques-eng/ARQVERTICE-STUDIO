/**
 * Test Suite: K05/K06 — Proxy Reverso, Cache Policy & Pipeline de Assets 3D
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const AssetOptimizationPipeline = require('../scripts/3d/optimize-assets.js');

console.log('🧪 Iniciando testes dos Blocos K05/K06 — Gateway, Cache Policy & Asset Pipeline...\n');

// 1. Teste de Configuração do Gateway e Cache (K05)
console.log('Test 1: Configuração do Caddyfile e Nginx (Headers OWASP e Cache)...');
const caddyfilePath = path.resolve('Caddyfile');
assert.ok(fs.existsSync(caddyfilePath), 'Caddyfile na raiz deve existir');

const caddyContent = fs.readFileSync(caddyfilePath, 'utf8');
assert.ok(caddyContent.includes('Cache-Control "public, max-age=31536000, immutable"'), 'Deve conter cache imutável de 1 ano para 3D');
assert.ok(caddyContent.includes('Cache-Control "no-cache, no-store, must-revalidate"'), 'Deve conter zero-cache para páginas HTML');
assert.ok(caddyContent.includes('Content-Security-Policy'), 'Deve conter Content-Security-Policy');
assert.ok(caddyContent.includes('X-Content-Type-Options "nosniff"'), 'Deve conter X-Content-Type-Options');
assert.ok(caddyContent.includes('Strict-Transport-Security'), 'Deve conter HSTS');

const nginxPath = path.resolve('deploy/nginx/nginx.conf');
assert.ok(fs.existsSync(nginxPath), 'deploy/nginx/nginx.conf deve existir');
const nginxContent = fs.readFileSync(nginxPath, 'utf8');
assert.ok(nginxContent.includes('client_max_body_size 500M'), 'Nginx deve permitir upload de até 500MB');
assert.ok(nginxContent.includes('immutable'), 'Nginx deve aplicar cache imutável');
console.log('  ✅ Caddyfile e Nginx validados com regras OWASP e políticas de cache estritas.');

// 2. Teste do Pipeline de Otimização de Assets 3D (K06)
console.log('\nTest 2: Pipeline de Assets 3D (3 Estágios, LODs e Checksum)...');
const testStorageRoot = path.resolve('storage', 'temp', 'test_k06_storage');
const pipeline = new AssetOptimizationPipeline({ storageRoot: testStorageRoot });

// Processa um modelo de teste
const assetId = 'mesa_jantar_freijo_01';
const processed = pipeline.processAsset({
  assetId,
  metadata: {
    bounds: { min: { x: -1, y: 0, z: -1 }, max: { x: 1, y: 0.8, z: 1 }, center: { x: 0, y: 0.4, z: 0 }, radius: 1.4 }
  }
});

assert.strictEqual(processed.assetId, assetId);
assert.ok(fs.existsSync(processed.rawPath), 'Estágio /raw deve conter o arquivo fonte');
assert.ok(fs.existsSync(processed.processedPath), 'Estágio /processed deve conter metadados e bounds');
assert.ok(fs.existsSync(processed.webPath), 'Estágio /web deve conter modelo comprimido');
assert.ok(processed.webFileName.includes('@'), 'Nome web deve conter sufixo de hash imutável');

// Valida LODs
assert.ok(processed.lods.lod0, 'LOD 0 deve ser gerado');
assert.ok(processed.lods.lod1, 'LOD 1 deve ser gerado');
assert.ok(processed.lods.lod2, 'LOD 2 deve ser gerado');
assert.ok(processed.lods.lod2.vramEstimatedMB < processed.lods.lod0.vramEstimatedMB, 'LOD 2 deve consumir menos VRAM que LOD 0');
console.log('  ✅ Estágios /raw, /processed, /web, /thumbnails e /lods gerados com sucesso.');

// 3. Teste de Manifesto de Projeto Imutável
console.log('\nTest 3: Manifesto Imutável de Projeto (project.manifest.json)...');
const manifestResult = pipeline.compileProjectManifest({
  projectId: 'prj-test-k06',
  projectAssets: [processed]
});

assert.ok(fs.existsSync(manifestResult.manifestFilePath), 'Arquivo de manifesto do projeto deve ser gerado');
assert.ok(manifestResult.manifestHash.length === 64, 'Manifesto deve conter hash SHA-256');
assert.strictEqual(manifestResult.manifestData.assetsCount, 1);
assert.strictEqual(manifestResult.manifestData.assets[0].id, assetId);
console.log('  ✅ Manifesto compilado com hash SHA-256 global para sincronização sem falhas.');

// Limpeza da sandbox de testes
try {
  fs.rmSync(testStorageRoot, { recursive: true, force: true });
} catch (e) {}

console.log('\n🎉 TODOS OS TESTES DOS BLOCOS K05/K06 FORAM APROVADOS COM SUCESSO!\n');
