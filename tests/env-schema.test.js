/**
 * Test Suite: K02 — Validação de Ambiente e Gestão Estrita de Secrets (Fail-Fast)
 */

const assert = require('assert');
const { validateEnvironment, EnvValidationError } = require('../js/config/env-schema.js');

console.log('🧪 Iniciando testes do Bloco K02 — Validação de Ambiente e Secrets...\n');

// 1. Teste de Ambiente de Desenvolvimento com Padrões
console.log('Test 1: Validação de ambiente development (padrões seguros)...');
const devConfig = validateEnvironment({
  NODE_ENV: 'development',
  PORT: '3000'
});

assert.strictEqual(devConfig.NODE_ENV, 'development');
assert.strictEqual(devConfig.PORT, 3000);
assert.strictEqual(devConfig.HOST, '0.0.0.0');
assert.strictEqual(devConfig.STORAGE_ROOT, './storage');
assert.ok(devConfig.DATABASE_URL.includes('sqlite'));
console.log('  ✅ Ambiente development validado com sucesso.');

// 2. Teste de Fail-Fast em Produção: Ausência de DATABASE_URL
console.log('\nTest 2: Fail-Fast em produção (ausência de DATABASE_URL)...');
assert.throws(() => {
  validateEnvironment({
    NODE_ENV: 'production',
    PORT: '8080',
    JWT_SECRET: 'min_32_characters_long_jwt_secret_value_12345',
    SESSION_SECRET: 'min_32_characters_long_session_secret_12345',
    CORS_ALLOWED_ORIGINS: 'https://app.arqvertice.com'
    // DATABASE_URL ausente
  });
}, (err) => {
  assert.ok(err instanceof EnvValidationError);
  assert.ok(err.missingFields.includes('DATABASE_URL'));
  return true;
});
console.log('  ✅ Produção bloqueou inicialização sem DATABASE_URL (Fail-Fast confirmado).');

// 3. Teste de Fail-Fast em Produção: Ausência de JWT_SECRET ou tamanho insuficiente
console.log('\nTest 3: Fail-Fast em produção (JWT_SECRET ausente ou fraco)...');
assert.throws(() => {
  validateEnvironment({
    NODE_ENV: 'production',
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    PORT: '8080',
    JWT_SECRET: 'curto_123', // < 32 chars
    SESSION_SECRET: 'min_32_characters_long_session_secret_12345',
    CORS_ALLOWED_ORIGINS: 'https://app.arqvertice.com'
  });
}, (err) => {
  assert.ok(err instanceof EnvValidationError);
  assert.ok(err.invalidFields.some(i => i.field === 'JWT_SECRET'));
  return true;
});
console.log('  ✅ Produção rejeitou JWT_SECRET fraco (< 32 caracteres).');

// 4. Teste de Fail-Fast em Produção: CORS Wildcard Proibido
console.log('\nTest 4: Fail-Fast em produção (CORS wildcard proibido)...');
assert.throws(() => {
  validateEnvironment({
    NODE_ENV: 'production',
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    PORT: '8080',
    JWT_SECRET: 'min_32_characters_long_jwt_secret_value_12345',
    SESSION_SECRET: 'min_32_characters_long_session_secret_12345',
    CORS_ALLOWED_ORIGINS: '*' // Wildcard proibido em produção
  });
}, (err) => {
  assert.ok(err instanceof EnvValidationError);
  assert.ok(err.invalidFields.some(i => i.field === 'CORS_ALLOWED_ORIGINS'));
  return true;
});
console.log('  ✅ Produção rejeitou CORS_ALLOWED_ORIGINS="*".');

// 5. Teste de Produção Válida Completa
console.log('\nTest 5: Inicialização completa de produção com todos os requisitos atendidos...');
const validProdConfig = validateEnvironment({
  NODE_ENV: 'production',
  PORT: '8080',
  HOST: '0.0.0.0',
  DATABASE_URL: 'postgresql://arq_prod:pass123@prod-cluster.internal:5432/arq_prod',
  STORAGE_ROOT: '/var/arqvertice/storage',
  S3_ENDPOINT: 'https://s3.arqvertice.com',
  S3_BUCKET_NAME: 'arqvertice-prod-vault',
  CORS_ALLOWED_ORIGINS: 'https://app.arqvertice.com,https://viewer.arqvertice.com',
  JWT_SECRET: 'min_32_characters_long_jwt_secret_value_1234567890',
  SESSION_SECRET: 'min_32_characters_long_session_secret_1234567890',
  OLLAMA_HOST: 'http://ollama.internal:11434',
  AI_GATEWAY_URL: 'https://api.omniroute.ai/v1',
  OPENAI_API_KEY: 'sk-prod-masked-key'
});

assert.strictEqual(validProdConfig.NODE_ENV, 'production');
assert.strictEqual(validProdConfig.PORT, 8080);
assert.strictEqual(validProdConfig.COOKIE_SECURE, true);
assert.deepStrictEqual(validProdConfig.CORS_ALLOWED_ORIGINS, ['https://app.arqvertice.com', 'https://viewer.arqvertice.com']);
console.log('  ✅ Configuração completa de produção aprovada com sucesso.');

console.log('\n🎉 TODOS OS TESTES DO BLOCO K02 FORAM APROVADOS COM SUCESSO!\n');
