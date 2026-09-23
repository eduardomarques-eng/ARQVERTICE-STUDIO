/**
 * Test Suite: K04 — Banco de Dados, Migrações Transacionais e Backups Resilientes
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const MigrationEngine = require('../scripts/db/migrate.js');
const BackupEngine = require('../scripts/db/backup.js');
const RestoreEngine = require('../scripts/db/restore.js');

console.log('🧪 Iniciando testes do Bloco K04 — Banco, Migrações & Backups Resilientes...\n');

const testSandboxDir = path.resolve('storage', 'temp', 'test_k04_sandbox');
if (!fs.existsSync(testSandboxDir)) fs.mkdirSync(testSandboxDir, { recursive: true });

const testDbPath = path.join(testSandboxDir, 'test_arqvertice.db');
const testSnapshotDir = path.join(testSandboxDir, 'snapshots');
const testBackupDir = path.join(testSandboxDir, 'backups');

// 1. Teste do Motor de Migrações
console.log('Test 1: MigrationEngine — Execução, Snapshot e Rollback Automático...');
fs.writeFileSync(testDbPath, 'DATABASE_INITIAL_VERSION_1');

const migEngine = new MigrationEngine({
  dbPath: testDbPath,
  snapshotDir: testSnapshotDir
});

// Snapshot pré-migração
const snapshot = migEngine.createPreMigrationSnapshot();
assert.ok(fs.existsSync(snapshot), 'Snapshot pré-migração deve ser gerado');
assert.strictEqual(fs.readFileSync(snapshot, 'utf8'), 'DATABASE_INITIAL_VERSION_1');

// Simulação de migrações normais
const pending = migEngine.getPendingMigrations(['0001', '0002']);
assert.ok(pending.length > 0, 'Deve listar migrações pendentes');

// Simulação de falha com rollback automático
const failResult = migEngine.runAllPending({
  appliedVersions: ['0001'],
  mockFailOn: pending[0]
});
assert.strictEqual(failResult.success, false);
assert.strictEqual(failResult.rolledBack, true);
assert.strictEqual(fs.readFileSync(testDbPath, 'utf8'), 'DATABASE_INITIAL_VERSION_1', 'Banco deve voltar ao estado inicial após rollback');
console.log('  ✅ Snapshot e Rollback automático atômico validados com sucesso.');

// 2. Teste do Motor de Backup (Compressão, Checksum SHA-256 e Rotação)
console.log('\nTest 2: BackupEngine — Compressão Gzip, Checksum SHA-256 e Rotação...');
fs.writeFileSync(testDbPath, 'DATABASE_PRODUCTION_DATA_FOR_BACKUP_12345');

const backupEngine = new BackupEngine({
  dbPath: testDbPath,
  backupDir: testBackupDir
});

const backupResult = backupEngine.createBackup();
assert.strictEqual(backupResult.success, true);
assert.ok(fs.existsSync(backupResult.backupFile), 'Arquivo de backup .db.gz deve existir');
assert.ok(fs.existsSync(backupResult.metadataFile), 'Arquivo .meta.json deve existir');
assert.strictEqual(backupResult.metadata.status, 'VERIFIED');
assert.ok(backupResult.metadata.compressedSha256.length === 64, 'Deve conter hash SHA-256 válido');

// Teste de rotação de arquivos antigos
const oldBackupFile = path.join(testBackupDir, 'arqvertice_backup_old_test.db.gz');
fs.writeFileSync(oldBackupFile, 'OLD_BACKUP');
// Define mtime para 400 dias atrás
const pastTime = Date.now() - (400 * 24 * 60 * 60 * 1000);
fs.utimesSync(oldBackupFile, pastTime / 1000, pastTime / 1000);

const rotation = backupEngine.rotateBackups();
assert.ok(rotation.rotatedCount >= 1, 'Backup com mais de 365 dias deve ser rotacionado/expurgado');
assert.ok(!fs.existsSync(oldBackupFile), 'Arquivo antigo deve ter sido removido');
console.log('  ✅ Geração de backup comprimido, checksum SHA-256 e rotação GFS validados.');

// 3. Teste do Motor de Restore (Disaster Recovery)
console.log('\nTest 3: RestoreEngine — Trava de Segurança, Sandbox e Restauração...');
const restoreEngine = new RestoreEngine({
  dbPath: testDbPath,
  backupDir: testBackupDir,
  tempDir: testSandboxDir
});

// Tentativa de restore com palavra-chave incorreta
const invalidKeyResult = restoreEngine.restore({
  backupFilePath: backupResult.backupFile,
  confirmationKeyword: 'SIM_QUERO_RESTAURAR'
});
assert.strictEqual(invalidKeyResult.success, false);
assert.strictEqual(invalidKeyResult.stage, 'SECURITY_GATE');

// Restore em modo Dry-Run com confirmação correta
const dryRunResult = restoreEngine.restore({
  backupFilePath: backupResult.backupFile,
  confirmationKeyword: 'CONFIRMO_RESTORE',
  dryRun: true
});
assert.strictEqual(dryRunResult.success, true);
assert.strictEqual(dryRunResult.dryRun, true);

// Modifica banco para testar restore real
fs.writeFileSync(testDbPath, 'DATABASE_CORRUPTED_DATA_STATE');

// Restore real
const liveRestoreResult = restoreEngine.restore({
  backupFilePath: backupResult.backupFile,
  confirmationKeyword: 'CONFIRMO_RESTORE',
  dryRun: false
});
assert.strictEqual(liveRestoreResult.success, true);
assert.strictEqual(fs.readFileSync(testDbPath, 'utf8'), 'DATABASE_PRODUCTION_DATA_FOR_BACKUP_12345', 'Conteúdo do banco deve ter sido restaurado com fidelidade');
console.log('  ✅ Trava de segurança (CONFIRMO_RESTORE), validação e restore de produção validados.');

// Limpeza da sandbox de testes
try {
  fs.rmSync(testSandboxDir, { recursive: true, force: true });
} catch (e) {}

console.log('\n🎉 TODOS OS TESTES DO BLOCO K04 FORAM APROVADOS COM SUCESSO!\n');
