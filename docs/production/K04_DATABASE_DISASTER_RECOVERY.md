# K04 — ArqVértice Studio: Banco de Dados, Migrações & Disaster Recovery

## 1. Visão Geral
Este documento estabelece a governança de banco de dados, o motor determinístico de migrações transacionais e as políticas resilientes de backup e recuperação de desastre (Disaster Recovery) do **ArqVértice Studio**.

---

## 2. Metas de Continuidade de Negócio (RPO & RTO)

| Métrica | Definição | Meta de Produção | Estratégia Técnica |
| :--- | :--- | :---: | :--- |
| **RPO** (Recovery Point Objective) | Perda máxima tolerável de dados | **$\le 1\text{ hora}$** | Backups periódicos comprimidos + retenção de snapshots pré-migração. |
| **RTO** (Recovery Time Objective) | Tempo máximo de recuperação do serviço | **$\le 15\text{ minutos}$** | Script automatizado de restore com sandbox de descompressão e swap atômico. |

---

## 3. Motor de Migrações Determinístico (`scripts/db/migrate.js`)

Toda migração de esquema de banco de dados em produção obedece às seguintes garantias estritas:
1. **Snapshot Automático Pré-Migração**: Antes de executar qualquer instrução SQL, uma cópia congelada do banco é gerada em `storage/snapshots/pre_migration_*.snapshot`.
2. **Atomicidade Transacional**: As migrações executam dentro de transação atômica (`BEGIN TRANSACTION ... COMMIT`).
3. **Rollback Automático**: Se qualquer instrução DDL/DML falhar ou for interrompida, o motor executa `ROLLBACK` e restaura o snapshot original imediatamente, preservando a consistência dos dados.

### Execução de Migrações:
```bash
node scripts/db/migrate.js
# Ou via shell script:
./scripts/db-migrate.sh
```

---

## 4. Política de Backup e Rotação GFS (`scripts/db/backup.js`)

Os backups são gerados com compressão `gzip`, cálculo de hash SHA-256 e gravação de metadados em formato JSON (`.meta.json`):

### Tabela de Retenção GFS (Grandfather-Father-Son):
- **Backups Diários**: Retidos por **7 dias**.
- **Backups Semanais**: Retidos por **4 semanas (28 dias)**.
- **Backups Mensais**: Retidos por **12 meses (365 dias)**.

### Execução de Backup Manual ou Cron:
```bash
node scripts/db/backup.js
# Ou via shell script:
./scripts/backup-database.sh
```

---

## 5. Playbook de Recuperação de Desastre (Restore Passo a Passo)

### Passo 1: Avaliação do Incidente e Identificação do Backup
Identifique o arquivo de backup íntegro mais recente em `storage/backups/`:
```bash
ls -la storage/backups/*.db.gz
```

### Passo 2: Execução de Verificação em Dry-Run (Sandbox)
O motor valida o checksum SHA-256 e descompacta o arquivo em uma pasta sandbox isolada sem tocar no banco de produção:
```bash
node -e "const Restore = require('./scripts/db/restore.js'); new Restore().restore({ confirmationKeyword: 'CONFIRMO_RESTORE', dryRun: true });"
```

### Passo 3: Execução do Restore de Produção
Para prevenir sobrescrita acidental, o restore exige a palavra-chave `'CONFIRMO_RESTORE'` explicitamente digitada:
```bash
./scripts/restore-database.sh CONFIRMO_RESTORE
# Ou especificando o arquivo exato:
./scripts/restore-database.sh CONFIRMO_RESTORE storage/backups/arqvertice_backup_2026-09-23.db.gz
```

### Passo 4: Verificação Pós-Restore
1. Executar a suíte de testes de integridade: `npm test`.
2. Verificar healthcheck do serviço: `curl -f http://localhost:3000/`.
3. Reabilitar o tráfego no proxy de borda (Caddy/Nginx).
