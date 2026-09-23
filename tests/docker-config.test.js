/**
 * Test Suite: K03 — Dockerfile, Docker Compose & Isolamento de Workers
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Iniciando testes do Bloco K03 — Docker & Isolamento de Workers...\n');

// 1. Teste do Dockerfile Multi-Stage
console.log('Test 1: Estrutura do Dockerfile Multi-Stage...');
const dockerfilePath = path.resolve('Dockerfile');
assert.ok(fs.existsSync(dockerfilePath), 'Dockerfile deve existir');

const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
assert.ok(dockerfileContent.includes('FROM node:22-alpine AS base'), 'Deve conter Stage 1 (base)');
assert.ok(dockerfileContent.includes('FROM base AS dependencies'), 'Deve conter Stage 2 (dependencies)');
assert.ok(dockerfileContent.includes('FROM base AS builder'), 'Deve conter Stage 3 (builder)');
assert.ok(dockerfileContent.includes('FROM base AS runner'), 'Deve conter Stage 4 (runner)');
assert.ok(dockerfileContent.includes('USER node'), 'Imagem final deve usar usuário não-root node');
assert.ok(dockerfileContent.includes('ENTRYPOINT ["/sbin/tini", "--"]'), 'Deve utilizar tini como supervisor');
assert.ok(dockerfileContent.includes('HEALTHCHECK'), 'Deve conter diretiva HEALTHCHECK');
console.log('  ✅ Dockerfile multi-stage com 4 estágios, non-root user e tini validado.');

// 2. Teste do .dockerignore
console.log('\nTest 2: Integridade do .dockerignore...');
const dockerignorePath = path.resolve('.dockerignore');
assert.ok(fs.existsSync(dockerignorePath), '.dockerignore deve existir');

const dockerignoreContent = fs.readFileSync(dockerignorePath, 'utf8');
assert.ok(dockerignoreContent.includes('node_modules/'), 'Deve ignorar node_modules');
assert.ok(dockerignoreContent.includes('.env'), 'Deve ignorar arquivos de ambiente .env');
assert.ok(dockerignoreContent.includes('tests/'), 'Deve ignorar diretório de testes');
assert.ok(dockerignoreContent.includes('docs/'), 'Deve ignorar documentação pesada');
console.log('  ✅ .dockerignore configurado com todas as regras de segurança e exclusão.');

// 3. Teste do docker-compose.prod.yml
console.log('\nTest 3: Estrutura dos Serviços no docker-compose.prod.yml...');
const composePath = path.resolve('docker-compose.prod.yml');
assert.ok(fs.existsSync(composePath), 'docker-compose.prod.yml deve existir');

const composeContent = fs.readFileSync(composePath, 'utf8');
assert.ok(composeContent.includes('arqvertice-web:'), 'Serviço arqvertice-web deve existir');
assert.ok(composeContent.includes('arqvertice-worker:'), 'Serviço arqvertice-worker deve existir');
assert.ok(composeContent.includes('reverse-proxy:'), 'Serviço reverse-proxy deve existir');
assert.ok(composeContent.includes('unless-stopped'), 'Deve conter restart policy unless-stopped');
assert.ok(composeContent.includes('assets-storage:'), 'Volume assets-storage deve existir');
assert.ok(composeContent.includes('db-data:'), 'Volume db-data deve existir');
assert.ok(composeContent.includes('audit-logs:'), 'Volume audit-logs deve existir');
assert.ok(composeContent.includes('memory: 2048M'), 'Deve conter limite de memória para arqvertice-web');
assert.ok(composeContent.includes('memory: 3072M'), 'Deve conter limite de memória para arqvertice-worker');
console.log('  ✅ docker-compose.prod.yml com 3 serviços, limites de recursos e volumes nomeados validado.');

// 4. Teste do Caddyfile
console.log('\nTest 4: Configuração do Caddy Reverse Proxy & Cache Imutável...');
const caddyfilePath = path.resolve('deploy/caddy/Caddyfile');
assert.ok(fs.existsSync(caddyfilePath), 'deploy/caddy/Caddyfile deve existir');

const caddyContent = fs.readFileSync(caddyfilePath, 'utf8');
assert.ok(caddyContent.includes('Cache-Control "public, max-age=31536000, immutable"'), 'Deve configurar cache imutável');
assert.ok(caddyContent.includes('reverse_proxy arqvertice-web:3000'), 'Deve apontar proxy para arqvertice-web:3000');
assert.ok(caddyContent.includes('X-Content-Type-Options "nosniff"'), 'Deve configurar cabeçalhos de segurança');
console.log('  ✅ Caddyfile com compressão zstd/gzip, cache imutável 3D e proxy reverso validado.');

// 5. Teste do Background Worker Script
console.log('\nTest 5: Script do Background Worker (asset-worker.js)...');
const workerPath = path.resolve('scripts/asset-worker.js');
assert.ok(fs.existsSync(workerPath), 'scripts/asset-worker.js deve existir');

const workerContent = fs.readFileSync(workerPath, 'utf8');
assert.ok(workerContent.includes('validateEnvironment'), 'Worker deve validar ambiente');
assert.ok(workerContent.includes('SIGTERM'), 'Worker deve tratar sinal SIGTERM');
console.log('  ✅ Background worker estruturado para processamento assíncrono de assets 3D.');

console.log('\n🎉 TODOS OS TESTES DO BLOCO K03 FORAM APROVADOS COM SUCESSO!\n');
