/**
 * src/config/env.schema.ts
 * ArqVértice Studio — Esquema de Validação de Ambiente e Gestão de Secrets (Fail-Fast).
 */

export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'staging' | 'production' | 'test';
  PORT: number;
  HOST: string;
  DATABASE_URL: string;
  SQLITE_PATH?: string;
  STORAGE_ROOT: string;
  S3_ENDPOINT: string;
  S3_BUCKET_NAME: string;
  S3_ACCESS_KEY_ID?: string;
  S3_SECRET_ACCESS_KEY?: string;
  S3_REGION: string;
  CORS_ALLOWED_ORIGINS: string[];
  JWT_SECRET: string;
  SESSION_SECRET: string;
  COOKIE_SECURE: boolean;
  OLLAMA_HOST: string;
  AI_GATEWAY_URL: string;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  GEMINI_API_KEY?: string;
  REVIT_MCP_PORT: number;
  REVIT_SYNC_ENABLED: boolean;
}

export class EnvValidationError extends Error {
  public readonly missingFields: string[];
  public readonly invalidFields: { field: string; message: string }[];

  constructor(missingFields: string[], invalidFields: { field: string; message: string }[]) {
    const msg = `[CRITICAL ENV CONFIG ERROR] Falha na validação de ambiente (Fail-Fast):\n` +
      missingFields.map(f => `  ✖ Campo obrigatório ausente: ${f}`).join('\n') +
      (invalidFields.length ? '\n' + invalidFields.map(i => `  ✖ Campo inválido: ${i.field} (${i.message})`).join('\n') : '');
    super(msg);
    this.name = 'EnvValidationError';
    this.missingFields = missingFields;
    this.invalidFields = invalidFields;
  }
}

export function validateEnvironment(env: Record<string, string | undefined> = process.env): EnvironmentConfig {
  const missing: string[] = [];
  const invalid: { field: string; message: string }[] = [];

  const nodeEnv = (env.NODE_ENV || 'development').toLowerCase() as EnvironmentConfig['NODE_ENV'];
  if (!['development', 'staging', 'production', 'test'].includes(nodeEnv)) {
    invalid.push({ field: 'NODE_ENV', message: 'Deve ser development, staging, production ou test' });
  }

  const port = parseInt(env.PORT || '3000', 10);
  if (isNaN(port) || port <= 0 || port > 65535) {
    invalid.push({ field: 'PORT', message: 'Deve ser uma porta TCP válida (1-65535)' });
  }

  const host = env.HOST || '0.0.0.0';

  // Validação estrita em Produção e Staging
  const isProdOrStaging = nodeEnv === 'production' || nodeEnv === 'staging';

  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) {
    if (isProdOrStaging) {
      missing.push('DATABASE_URL');
    }
  }

  const storageRoot = env.STORAGE_ROOT || './storage';
  const s3Endpoint = env.S3_ENDPOINT || 'https://s3.arqvertice.com';
  const s3Bucket = env.S3_BUCKET_NAME || 'arqvertice-assets';
  const s3Region = env.S3_REGION || 'sa-east-1';

  const corsRaw = env.CORS_ALLOWED_ORIGINS;
  let corsOrigins: string[] = ['*'];
  if (!corsRaw && isProdOrStaging) {
    missing.push('CORS_ALLOWED_ORIGINS');
  } else if (corsRaw) {
    corsOrigins = corsRaw.split(',').map(s => s.trim()).filter(Boolean);
    if (isProdOrStaging && corsOrigins.includes('*')) {
      invalid.push({ field: 'CORS_ALLOWED_ORIGINS', message: 'CORS wildcard (*) não é permitido em staging/produção' });
    }
  }

  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) {
    if (isProdOrStaging) {
      missing.push('JWT_SECRET');
    }
  } else if (isProdOrStaging && jwtSecret.length < 32) {
    invalid.push({ field: 'JWT_SECRET', message: 'JWT_SECRET em staging/produção deve ter pelo menos 32 caracteres' });
  }

  const sessionSecret = env.SESSION_SECRET;
  if (!sessionSecret) {
    if (isProdOrStaging) {
      missing.push('SESSION_SECRET');
    }
  } else if (isProdOrStaging && sessionSecret.length < 32) {
    invalid.push({ field: 'SESSION_SECRET', message: 'SESSION_SECRET em staging/produção deve ter pelo menos 32 caracteres' });
  }

  const ollamaHost = env.OLLAMA_HOST || 'http://127.0.0.1:11434';
  const aiGatewayUrl = env.AI_GATEWAY_URL || 'https://api.omniroute.ai/v1';

  if (missing.length > 0 || invalid.length > 0) {
    throw new EnvValidationError(missing, invalid);
  }

  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    HOST: host,
    DATABASE_URL: databaseUrl || 'sqlite://./database/arqvertice.db',
    SQLITE_PATH: env.SQLITE_PATH,
    STORAGE_ROOT: storageRoot,
    S3_ENDPOINT: s3Endpoint,
    S3_BUCKET_NAME: s3Bucket,
    S3_ACCESS_KEY_ID: env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: env.S3_SECRET_ACCESS_KEY,
    S3_REGION: s3Region,
    CORS_ALLOWED_ORIGINS: corsOrigins,
    JWT_SECRET: jwtSecret || 'dev_insecure_jwt_secret_must_change_in_prod',
    SESSION_SECRET: sessionSecret || 'dev_insecure_session_secret_must_change_in_prod',
    COOKIE_SECURE: env.COOKIE_SECURE === 'true' || isProdOrStaging,
    OLLAMA_HOST: ollamaHost,
    AI_GATEWAY_URL: aiGatewayUrl,
    OPENAI_API_KEY: env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY,
    GEMINI_API_KEY: env.GEMINI_API_KEY,
    REVIT_MCP_PORT: parseInt(env.REVIT_MCP_PORT || '48080', 10),
    REVIT_SYNC_ENABLED: env.REVIT_SYNC_ENABLED !== 'false'
  };
}
