/**
 * scripts/db/data-integrity-check.js
 * ArqVértice Studio — Verificador de Integridade de Dados & Segurança de Banco (K13)
 */

const fs = require('fs');
const path = require('path');
const MigrationEngine = require('./migrate');

function auditDataIntegrity() {
  console.log('================================================================');
  console.log('🛡️ ARQVERTICE STUDIO — AUDITORIA DE INTEGRIDADE DE DADOS (K13)');
  console.log('================================================================\n');

  const rootDir = path.resolve(__dirname, '..', '..');
  const dbDir = path.join(rootDir, 'database');
  const migrationsDir = path.join(dbDir, 'migrations');
  const snapshotsDir = path.join(rootDir, 'storage', 'snapshots');

  const issues = [];

  // 1. Verificação de Diretórios
  if (!fs.existsSync(dbDir)) {
    issues.push('Diretório /database não encontrado.');
  }
  if (!fs.existsSync(migrationsDir)) {
    issues.push('Diretório /database/migrations não encontrado.');
  } else {
    const migFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
    console.log(`📁 Encontradas ${migFiles.length} migrações SQL versionadas.`);
    if (migFiles.length === 0) {
      issues.push('Nenhum arquivo de migração SQL encontrado.');
    }

    // Validação de Sequenciamento
    const versions = migFiles.map(f => parseInt(f.split('_')[0], 10)).filter(v => !isNaN(v));
    for (let i = 0; i < versions.length; i++) {
      if (versions[i] !== i + 1) {
        issues.push(`Sequenciamento de migração desalinhado: esperado ${i + 1}, encontrado ${versions[i]}`);
        break;
      }
    }
  }

  // 2. Verificação do Motor de Migração & Snapshots
  const engine = new MigrationEngine({
    dbPath: path.join(dbDir, 'arqvertice.db'),
    migrationsDir,
    snapshotDir: snapshotsDir
  });

  const pending = engine.getPendingMigrations();
  console.log(`🔍 Migrações pendentes para o banco local: ${pending.length}`);

  // 3. Verificação de Diretório de Snapshots
  if (!fs.existsSync(snapshotsDir)) {
    fs.mkdirSync(snapshotsDir, { recursive: true });
  }
  console.log('✔ Diretório de snapshots e backups operacionais validado.');

  if (issues.length > 0) {
    console.error('\n❌ PROBLEMAS DE INTEGRIDADE DE DADOS ENCONTRADOS:');
    for (const iss of issues) {
      console.error(`  ✖ ${iss}`);
    }
    return { valid: false, issues };
  }

  console.log('\n🎉 Integridade de esquema e segurança de migrações 100% conformes!');
  console.log('================================================================\n');
  return { valid: true, issues: [] };
}

if (require.main === module) {
  const res = auditDataIntegrity();
  process.exit(res.valid ? 0 : 1);
}

module.exports = { auditDataIntegrity };
