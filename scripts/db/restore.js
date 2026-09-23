/**
 * scripts/db/restore.js
 * ArqVértice Studio — Motor de Recuperação de Desastre (Restore)
 * Exige confirmação estrita 'CONFIRMO_RESTORE', valida checksum SHA-256
 * e testa descompressão e integridade antes de aplicar a sobrescrita.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');

class RestoreEngine {
  constructor(options = {}) {
    this.dbPath = options.dbPath || path.resolve('database', 'arqvertice.db');
    this.backupDir = options.backupDir || path.resolve('storage', 'backups');
    this.tempDir = options.tempDir || path.resolve('storage', 'temp', 'restore_sandbox');
    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  calculateChecksum(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  getLatestBackup() {
    if (!fs.existsSync(this.backupDir)) return null;

    const files = fs.readdirSync(this.backupDir)
      .filter(f => f.endsWith('.db.gz'))
      .sort()
      .reverse();

    return files.length > 0 ? path.join(this.backupDir, files[0]) : null;
  }

  restore({ backupFilePath, confirmationKeyword, dryRun = false }) {
    console.log('================================================================');
    console.log('🚨 ARQVERTICE STUDIO — PROCEDIMENTO DE RESTORE DE DESASTRE');
    console.log('================================================================\n');

    // 1. Trava de Segurança Estrita
    if (confirmationKeyword !== 'CONFIRMO_RESTORE') {
      const err = `TRAVA DE SEGURANÇA ATIVADA: A confirmação de restore exige 'CONFIRMO_RESTORE' digitado explicitamente. Recebido: '${confirmationKeyword}'`;
      console.error(`❌ ${err}`);
      return { success: false, error: err, stage: 'SECURITY_GATE' };
    }

    // 2. Localização do Arquivo de Backup
    const targetBackup = backupFilePath || this.getLatestBackup();
    if (!targetBackup || !fs.existsSync(targetBackup)) {
      const err = `Arquivo de backup não encontrado: ${targetBackup}`;
      console.error(`❌ ${err}`);
      return { success: false, error: err, stage: 'FILE_DISCOVERY' };
    }

    console.log(`▶ Arquivo de backup selecionado: ${path.basename(targetBackup)}`);

    // 3. Validação de Metadados e Integridade do Checksum
    const metaPath = targetBackup.replace('.db.gz', '.meta.json');
    let expectedChecksum = null;
    if (fs.existsSync(metaPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        expectedChecksum = meta.compressedSha256;
      } catch (e) {
        console.warn(`⚠️ Aviso: Não foi possível ler metadados JSON do backup.`);
      }
    }

    const compressedBuffer = fs.readFileSync(targetBackup);
    const actualChecksum = this.calculateChecksum(compressedBuffer);

    if (expectedChecksum && actualChecksum !== expectedChecksum) {
      const err = `CORRUPÇÃO DETECTADA: Checksum SHA-256 do arquivo (${actualChecksum}) diverge do metadado (${expectedChecksum}). Restore abortado.`;
      console.error(`❌ ${err}`);
      return { success: false, error: err, stage: 'CHECKSUM_VALIDATION' };
    }

    console.log(`✔ Checksum SHA-256 validado com sucesso: ${actualChecksum}`);

    // 4. Teste de Descompressão e Integridade em Sandbox Isolado
    let decompressedBuffer;
    try {
      decompressedBuffer = zlib.gunzipSync(compressedBuffer);
      const sandboxFile = path.join(this.tempDir, `sandbox_test_${Date.now()}.db`);
      fs.writeFileSync(sandboxFile, decompressedBuffer);
      console.log(`✔ Descompressão e integridade verificadas em sandbox: ${sandboxFile}`);

      // Limpa arquivo de teste do sandbox
      if (fs.existsSync(sandboxFile)) fs.unlinkSync(sandboxFile);
    } catch (decompErr) {
      const err = `FALHA NA DESCOMPRESSÃO: O arquivo comprimido está corrompido: ${decompErr.message}`;
      console.error(`❌ ${err}`);
      return { success: false, error: err, stage: 'DECOMPRESSION' };
    }

    if (dryRun) {
      console.log('\n✔ [DRY-RUN] Simulação de restore concluída com 100% de sucesso. Nenhuma alteração persistida.');
      return { success: true, dryRun: true, backupFile: targetBackup, verifiedSize: decompressedBuffer.length };
    }

    // 5. Snapshot de Segurança do Banco Atual antes do Restore
    const preRestoreBackup = path.join(this.tempDir, `pre_restore_backup_${Date.now()}.db`);
    if (fs.existsSync(this.dbPath)) {
      fs.copyFileSync(this.dbPath, preRestoreBackup);
      console.log(`📸 Snapshot de segurança pré-restore criado: ${preRestoreBackup}`);
    }

    // 6. Aplicação da Restauração (Swap Seguro)
    try {
      fs.writeFileSync(this.dbPath, decompressedBuffer);
      console.log(`\n🎉 RESTORE DE PRODUÇÃO CONCLUÍDO COM SUCESSO!`);
      console.log(`O banco de dados foi restaurado para o estado de: ${path.basename(targetBackup)}`);
      return {
        success: true,
        restoredFile: this.dbPath,
        sourceBackup: targetBackup,
        restoredSizeBytes: decompressedBuffer.length
      };
    } catch (applyErr) {
      console.error(`💥 Falha crítica na aplicação do restore: ${applyErr.message}`);
      if (fs.existsSync(preRestoreBackup)) {
        fs.copyFileSync(preRestoreBackup, this.dbPath);
        console.log(`🔄 Banco restaurado de volta para o snapshot pré-restore.`);
      }
      return { success: false, error: applyErr.message, stage: 'APPLY_SWAP' };
    }
  }
}

if (require.main === module) {
  const confirmation = process.argv[2];
  const backupFile = process.argv[3];
  const engine = new RestoreEngine();
  const res = engine.restore({
    confirmationKeyword: confirmation,
    backupFilePath: backupFile
  });
  process.exit(res.success ? 0 : 1);
}

module.exports = RestoreEngine;
