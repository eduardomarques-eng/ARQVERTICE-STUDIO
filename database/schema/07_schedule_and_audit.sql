-- ============================================================================
-- ARQVERTICE STUDIO — SCHEMA 07: CRONOGRAMA INTEGRADO E TRILHA DE AUDITORIA
-- Compatibilidade Estrita com a Base Legada e Rastreabilidade Completa
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. CRONOGRAMA MULTIDISCIPLINAR (SCHEDULE TASKS)
-- Preserva e expande a tabela original 'tarefas'
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schedule_tasks (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id      UUID REFERENCES environments(id) ON DELETE SET NULL,
    stage_id            UUID REFERENCES project_stages(id) ON DELETE SET NULL,
    descricao_etapa     TEXT NOT NULL CHECK (length(trim(descricao_etapa)) > 0),
    disciplina_projeto  TEXT NOT NULL CHECK (
                          disciplina_projeto IN ('Arquitetura', '3D', 'Estrutura', 'Complementares', 'Obras')
                        ),
    projetista          TEXT NOT NULL,
    data_conclusao      DATE NOT NULL,
    porcentagem         SMALLINT NOT NULL DEFAULT 0
                          CHECK (porcentagem >= 0 AND porcentagem <= 100),
    ordem               INTEGER NOT NULL DEFAULT 0,
    -- Coluna gerada idêntica à regra original do banco legado
    status              TEXT GENERATED ALWAYS AS (
                          CASE
                            WHEN porcentagem = 0   THEN 'Não Iniciado'
                            WHEN porcentagem = 100 THEN 'Finalizado'
                            ELSE 'Em Andamento'
                          END
                        ) STORED,
    criado_em           TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de alta performance para a visualização Kanban e Datagrid
CREATE INDEX IF NOT EXISTS idx_st_proj_ordem   ON schedule_tasks (project_id, ordem, data_conclusao);
CREATE INDEX IF NOT EXISTS idx_st_disciplina   ON schedule_tasks (disciplina_projeto);
CREATE INDEX IF NOT EXISTS idx_st_projetista   ON schedule_tasks (projetista);
CREATE INDEX IF NOT EXISTS idx_st_data         ON schedule_tasks (data_conclusao);
CREATE INDEX IF NOT EXISTS idx_st_ambiente     ON schedule_tasks (environment_id);

CREATE TRIGGER trg_schedule_tasks_updated_at
  BEFORE UPDATE ON schedule_tasks
  FOR EACH ROW EXECUTE FUNCTION toca_atualizado_em();

-- ---------------------------------------------------------------------------
-- 2. TRILHA DE AUDITORIA IMUTÁVEL (AUDIT LOGS)
-- Requisito do Item 15: Registrar alterações relevantes com antes/depois
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID REFERENCES users(id) ON DELETE SET NULL,
    project_id          UUID REFERENCES projects(id) ON DELETE CASCADE,
    environment_id      UUID REFERENCES environments(id) ON DELETE SET NULL,
    event_type          VARCHAR(80) NOT NULL, -- Ex: 'TAREFA_ATUALIZADA', 'RENDER_APROVADO', 'LOCK_ALTERADO', 'BRIEFING_SUBMETIDO'
    entity_name         VARCHAR(80) NOT NULL, -- Ex: 'schedule_tasks', 'locks', 'render_versions'
    entity_id           UUID NOT NULL,
    old_values          JSONB,                -- Estado anterior do registro
    new_values          JSONB,                -- Novo estado após a alteração
    ip_address          VARCHAR(50),
    user_agent          TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_proj_date ON audit_logs (project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user      ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_event     ON audit_logs (event_type);
CREATE INDEX IF NOT EXISTS idx_audit_entity    ON audit_logs (entity_name, entity_id);

-- View de Compatibilidade Legada (Permite que códigos antigos leiam a tabela 'tarefas')
CREATE OR REPLACE VIEW tarefas AS
SELECT 
    id,
    descricao_etapa,
    disciplina_projeto,
    projetista,
    data_conclusao,
    porcentagem,
    ordem,
    status,
    criado_em,
    atualizado_em
FROM schedule_tasks;
