# ARQVERTICE STUDIO — INTEGRIDADE DE DADOS & SEGURANÇA DE BANCO (K13)

> **Documento Oficial de Integridade Transacional, Política de Migrações & Backups**  
> **Versão:** 1.0.0 | **SLA:** RPO 1 hora / RTO 15 minutos

---

## 1. Diretriz: Zero SQL Manual em Produção

Toda alteração de banco de dados em ambiente produtivo obedece às seguintes regras:
1. **Nunca executar comandos DDL/DML manuais improvisados no console.**
2. Todas as alterações devem estar encapsuladas em arquivos `.sql` numerados dentro de `database/migrations/`.
3. Toda migração é executada com **transação atômica** e criação obrigatória de snapshot pré-migração.
4. Em caso de falha em qualquer instrução, o `MigrationEngine` dispara rollback atômico imediato.

---

## 2. Política de Backup e Retenção

- **Backups Periódicos:** A cada 1 hora via cron / worker (`scripts/backup-database.sh`).
- **Retenção:**
  - Backups horários: mantidos por 24 horas.
  - Backups diários: mantidos por 7 dias.
  - Backups semanais: mantidos por 4 semanas.
- **Armazenamento:**
  - Compressão Gzip / Zstandard com cálculo e validação de hash SHA-256.
  - Cópia secundária imutável sincronizada com bucket S3 protegido.

---

## 3. Procedimento de Restauração de Emergência

```bash
# Executa restauração determinística com snapshot
./scripts/restore-database.sh storage/snapshots/pre_migration_2026-09-23T19-00-00.snapshot
```
