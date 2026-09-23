/**
 * scripts/validate-env.js
 * ArqVértice Studio — Validador Centralizado de Variáveis de Ambiente
 * Executado antes do boot de produção e durante os quality gates de CI/CD.
 */

const fs = require('fs');
const path = require('path');

const ENV_SPECS = [
  { name: 'NODE_ENV', required: true, default: 'development', allowed: ['development', 'test', 'staging', 'production'], secret: false },
  { name: 'PORT', required: false, default: '3000', secret: false },
  { name: 'HOST', required: false, default: '0.0.0.0', secret: false },
  { name: 'DATABASE_URL', required: false, default: 'sqlite:///app/database/arqvertice.db', secret: false },
  { name: 'STORAGE_ROOT', required: false, default: './storage', secret: false },
  { name: 'JWT_SECRET', required: true, secret: true, minLength: 16 },
  { name: 'SESSION_SECRET', required: true, secret: true, minLength: 16 },
  { name: 'CORS_ALLOWED_ORIGINS', required: false, default: 'http://localhost:3000', secret: false }
];

function validateEnvironment(env = process.env) {
  console.log('================================================================');
  console.log('🔍 ARQVERTICE STUDIO — VALIDAÇÃO DE AMBIENTE & CONFIGURAÇÃO');
  console.log('================================================================\n');

  const errors = [];
  const warnings = [];
  const sanitizedConfig = {};

  for (const spec of ENV_SPECS) {
    const val = env[spec.name];

    if (spec.required && (!val || val.trim() === '')) {
      // Se estiver em ambiente de teste ou dev e possuir default seguro, emite warning
      if (env.NODE_ENV === 'test' || env.NODE_ENV === 'development' || !env.NODE_ENV) {
        warnings.push(`Variável obrigatória '${spec.name}' não definida. Utilizando valor de fallback para ambiente não-produção.`);
        sanitizedConfig[spec.name] = spec.secret ? '[MOCK_SECRET_TEST]' : (spec.default || 'default');
      } else {
        errors.push(`ERRO CRÍTICO: Variável obrigatória '${spec.name}' ausente em ambiente de produção/staging!`);
      }
      continue;
    }

    if (val) {
      if (spec.allowed && !spec.allowed.includes(val)) {
        errors.push(`Valor inválido para '${spec.name}': '${val}'. Permitidos: ${spec.allowed.join(', ')}`);
      }
      if (spec.minLength && val.length < spec.minLength) {
        errors.push(`Variável '${spec.name}' não atinge o comprimento mínimo de segurança (${spec.minLength} caracteres).`);
      }
      sanitizedConfig[spec.name] = spec.secret ? '[REDACTED]' : val;
    } else {
      sanitizedConfig[spec.name] = spec.default || null;
    }
  }

  for (const w of warnings) {
    console.warn(`  ⚠️ ${w}`);
  }

  if (errors.length > 0) {
    console.error('\n❌ FALHAS DE CONFIGURAÇÃO DE AMBIENTE DETECTADAS:');
    for (const e of errors) {
      console.error(`  ✖ ${e}`);
    }
    console.log('\nConsulte o arquivo .env.example e docs/production/environment-matrix.md para corrigir.');
    return { valid: false, errors, warnings, config: sanitizedConfig };
  }

  console.log('✔ Todas as variáveis de ambiente obrigatórias foram validadas com sucesso!\n');
  console.log('Configuração ativa (Sanitizada):');
  console.log(JSON.stringify(sanitizedConfig, null, 2));
  console.log('\n================================================================\n');

  return { valid: true, errors: [], warnings, config: sanitizedConfig };
}

if (require.main === module) {
  const result = validateEnvironment();
  process.exit(result.valid ? 0 : 1);
}

module.exports = { validateEnvironment, ENV_SPECS };
