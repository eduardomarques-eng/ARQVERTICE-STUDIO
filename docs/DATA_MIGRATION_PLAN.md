# PLANO DE MIGRAÇÃO NÃO-DESTRUTIVA DE DADOS
## ARQVERTICE STUDIO — PROCEDIMENTO SEGURO DE TRANSIÇÃO
**Versão:** 1.0.0  
**Data:** 21 de Setembro de 2026  
**Documento:** DATA_MIGRATION_PLAN.md  

---

### 1. PRINCÍPIO DA PRESERVAÇÃO ATIVA

Em estrita consonância com a diretriz do **Bloco 00** e do **Prompt A03**:
> *"NÃO faça migração destrutiva. Antes de qualquer transformação: preserve o schema atual, documente a compatibilidade, faça backup lógico prévio, mantenha registros atuais e valide contagens rigorosamente."*

O plano abaixo garante que a obra atualmente em produção ("Residência de Praia - Pedro") e suas 14 etapas cadastradas sejam migradas com **zero perda de dados, zero alteração de UUIDs e zero downtime**.

---

### 2. PROTOCOLO DE EXECUÇÃO EM 5 ETAPAS

```
┌────────────────────────────────────────────────────────┐
│ ETAPA 0: Backup Lógico Completo da Base em Produção   │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ ETAPA 1: Execução do DDL Aditivo (Criação de Tabelas)  │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ ETAPA 2: Carga Transacional dos Dados Legados          │
│ • Cria Cliente Pedro                                   │
│ • Cria Projeto Canônico Residência de Praia            │
│ • Copia as 14 tarefas para schedule_tasks             │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ ETAPA 3: Ativação da Camada de Retrocompatibilidade    │
│ • View 'tarefas' espelhando 'schedule_tasks'           │
│ • Remoção da trava CHECK (id = 1) da tabela 'projeto'  │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ ETAPA 4: Validação de Assertividade e Smoke Tests      │
└────────────────────────────────────────────────────────┘
```

---

### 3. PROCEDIMENTO DETALHADO PASSO A PASSO

#### ETAPA 0: Backup Lógico de Segurança (Pré-voo)
Antes de rodar qualquer comando no PostgreSQL de produção (Neon ou Supabase), deve-se executar um dump completo:
```bash
# Executado no terminal administrativo
pg_dump "$DATABASE_URL" \
  --format=custom \
  --file="backup_cronograma_pre_a03_$(date +%Y%m%d_%H%M%S).dump"

# Dump em SQL legível para conferência de emergência
pg_dump "$DATABASE_URL" \
  --data-only \
  --table=projeto \
  --table=tarefas > backup_tabelas_legadas.sql
```

#### ETAPA 1: Execução do DDL Aditivo
Execução do script [`database/migrations/0001_initial_schema.sql`](file:///c:/Users/erick/ARQVERTICE-STUDIO/database/migrations/0001_initial_schema.sql).
- Todas as instruções utilizam `CREATE TABLE IF NOT EXISTS` e `CREATE INDEX IF NOT EXISTS`.
- Nenhuma tabela existente é modificada ou truncada nesta etapa.

#### ETAPA 2: Carga Transacional Não-Destrutiva
Execução do script [`database/migrations/0002_migration_from_legacy.sql`](file:///c:/Users/erick/ARQVERTICE-STUDIO/database/migrations/0002_migration_from_legacy.sql) dentro de um bloco transacional `BEGIN ... COMMIT`:
1. Insere o cliente "Pedro" com o UUID fixo `b4b1a8d0-0000-4000-8000-000000000001`.
2. Cria o projeto "Residência de Praia" com o UUID canônico `b4b1a8d0-1c32-4e89-9a21-000000000000`, copiando as áreas, zoneamento e datas da linha `projeto WHERE id = 1`.
3. Insere a equipe técnica fundadora (Eduardo Marques, Luan Almeida, Erick Santiago) e os vincula ao projeto.
4. Insere os 5 ambientes iniciais da Residência de Praia (Sala, Cozinha, Gourmet, Suíte, Fachada).
5. Executa a migração das tarefas:
   ```sql
   INSERT INTO schedule_tasks (
       id, project_id, descricao_etapa, disciplina_projeto, projetista,
       data_conclusao, porcentagem, ordem, criado_em, atualizado_em
   )
   SELECT 
       t.id,
       'b4b1a8d0-1c32-4e89-9a21-000000000000'::uuid,
       t.descricao_etapa,
       t.disciplina_projeto,
       t.projetista,
       t.data_conclusao,
       t.porcentagem,
       t.ordem,
       t.criado_em,
       t.atualizado_em
   FROM tarefas t
   ON CONFLICT (id) DO NOTHING;
   ```

#### ETAPA 3: Ativação da Camada de Compatibilidade
- A tabela antiga `tarefas` é renomeada para `tarefas_legado_backup`.
- Uma `VIEW tarefas` é criada apontando diretamente para `schedule_tasks`.
- O constraint `projeto_id_check` da tabela legada `projeto` é descartado, permitindo que novos projetos sejam adicionados futuramente sem erros de restrição.

#### ETAPA 4: Validação de Contagens e Assertividade
O script de migração executa verificações automáticas com aborto em caso de discrepância:
```sql
DO $$
DECLARE
    v_total_original INTEGER;
    v_total_migrado  INTEGER;
BEGIN
    SELECT count(*) INTO v_total_original FROM tarefas_legado_backup;
    SELECT count(*) INTO v_total_migrado FROM schedule_tasks WHERE project_id = 'b4b1a8d0-1c32-4e89-9a21-000000000000';
    
    IF v_total_original <> v_total_migrado THEN
        RAISE EXCEPTION 'ERRO GRAVE: Contagem divergente! Original: %, Migrado: %', v_total_original, v_total_migrado;
    END IF;
END $$;
```

---

### 4. PLANO DE CONTINGÊNCIA E ROLLBACK

Se qualquer erro for detectado antes do `COMMIT`, a transação sofre rollback automático sem alterar uma única linha da base.

Caso um problema seja detectado após o commit em produção:
1. Reverter a view para tabela física:
   ```sql
   DROP VIEW IF EXISTS tarefas;
   ALTER TABLE tarefas_legado_backup RENAME TO tarefas;
   ALTER TABLE projeto ADD CONSTRAINT projeto_id_check CHECK (id = 1);
   ```
2. O sistema legado volta a operar imediatamente no estado exato em que estava antes da migração.
