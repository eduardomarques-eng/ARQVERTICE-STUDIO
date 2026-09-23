-- ============================================================================
-- ARQVERTICE STUDIO — SCHEMA 05: MEMÓRIA ESTRUTURADA, LOCKS E IA ENGINE
-- Memória Contextual Multicamada e Governança de Renders
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. ESTILOS ARQUITETÔNICOS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS styles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(100) NOT NULL UNIQUE, -- Ex: 'Minimalista', 'Rústico / Praiano', 'Industrial', 'Contemporâneo'
    description         TEXT,
    visual_guidelines   TEXT, -- Diretrizes para compilação de prompt
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_styles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    style_id            UUID NOT NULL REFERENCES styles(id) ON DELETE CASCADE,
    is_primary          BOOLEAN NOT NULL DEFAULT true,
    custom_notes        TEXT,
    CONSTRAINT uq_project_style UNIQUE (project_id, style_id)
);

-- ---------------------------------------------------------------------------
-- 2. MEMÓRIA ESTRUTURADA DE PROJETO E AMBIENTE (DECISÕES E RESTRIÇÕES)
-- Requisito: Não transformar todos os logs em memória; separar por tipo
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS design_decisions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id      UUID REFERENCES environments(id) ON DELETE CASCADE,
    title               VARCHAR(200) NOT NULL,
    description         TEXT NOT NULL,
    decision_type       VARCHAR(50) NOT NULL
                          CHECK (decision_type IN (
                            'FATO_CONFIRMADO',      -- Dado físico imutável (ex: pilar estrutural no meio da sala)
                            'DECISAO_PROJETO',      -- Escolha formal da ArqVértice (ex: ilha central em mármore)
                            'PREFERENCIA_CLIENTE',  -- Gosto declarado (ex: "cliente não suporta tons frios")
                            'RESTRICAO_TECNICA',    -- Limitação legal ou estrutural (ex: recuo obrigatório de 4m)
                            'REFERENCIA_ESTETICA',  -- Direcionamento visual aprovado
                            'HIPOTESE_ESTUDO',      -- Ideia em teste, não aprovada
                            'OBSERVACAO_GERAL',     -- Comentário livre
                            'VERSAO_APROVADA'       -- Marco formal de aceite
                          )),
    status              VARCHAR(30) NOT NULL DEFAULT 'ATIVA'
                          CHECK (status IN ('ATIVA', 'SUPERADA', 'REVOGADA')),
    approved_by_client  BOOLEAN NOT NULL DEFAULT false,
    date_decided        DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_decisions_proj ON design_decisions (project_id);
CREATE INDEX IF NOT EXISTS idx_decisions_env  ON design_decisions (environment_id);
CREATE INDEX IF NOT EXISTS idx_decisions_type ON design_decisions (decision_type);

CREATE TRIGGER trg_design_decisions_updated_at
  BEFORE UPDATE ON design_decisions
  FOR EACH ROW EXECUTE FUNCTION toca_atualizado_em();

-- ---------------------------------------------------------------------------
-- 3. LOCKS INDEPENDENTES DO AMBIENTE (BLOQUEIOS DE IA)
-- Requisito: Bloqueios granulares e independentes por camada geométrica/visual
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS locks (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    environment_id      UUID NOT NULL UNIQUE REFERENCES environments(id) ON DELETE CASCADE,
    geometry_locked     BOOLEAN NOT NULL DEFAULT true,  -- Travamento da volumetria rígida do Revit
    layout_locked       BOOLEAN NOT NULL DEFAULT true,  -- Posição geral dos cômodos e fluxos
    camera_locked       BOOLEAN NOT NULL DEFAULT true,  -- Ângulo de visão e perspectiva
    openings_locked     BOOLEAN NOT NULL DEFAULT true,  -- Janelas, portas e vãos arquitetônicos
    materials_locked    BOOLEAN NOT NULL DEFAULT false, -- Trava pisos e acabamentos já decididos
    lighting_locked     BOOLEAN NOT NULL DEFAULT false, -- Trava esquema solar e luminárias
    furniture_locked    BOOLEAN NOT NULL DEFAULT false, -- Trava mobiliário principal
    decor_locked        BOOLEAN NOT NULL DEFAULT false, -- Trava adornos, tapetes e vegetação
    landscape_locked    BOOLEAN NOT NULL DEFAULT false, -- Trava paisagismo externo
    specific_lock_rules JSONB, -- Exceções granulares (ex: {"sofa": "livre", "piso": "travado"})
    notes               TEXT,
    updated_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_locks_updated_at
  BEFORE UPDATE ON locks
  FOR EACH ROW EXECUTE FUNCTION toca_atualizado_em();

-- ---------------------------------------------------------------------------
-- 4. VERSÕES DE PROMPTS E EXECUÇÕES DE IA
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prompt_versions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    environment_id      UUID NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    version_number      INTEGER NOT NULL DEFAULT 1,
    user_intention      TEXT NOT NULL, -- O que o arquiteto pediu (ex: "Trocar o sofá por um modelo em linho")
    system_instructions TEXT NOT NULL, -- Diretrizes mestras da ArqVértice
    compiled_prompt     TEXT NOT NULL, -- Prompt final compilado com projeto, ambiente e locks
    negative_prompt     TEXT,
    parameters          JSONB NOT NULL, -- {"aspectRatio": "16:9", "seed": 1024, "temperature": 0.2}
    created_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_executions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_version_id   UUID NOT NULL REFERENCES prompt_versions(id) ON DELETE CASCADE,
    provider            VARCHAR(50) NOT NULL DEFAULT 'gemini', -- 'gemini', 'mock', etc.
    model_name          VARCHAR(100) NOT NULL DEFAULT 'gemini-3.8-pro',
    execution_status    VARCHAR(30) NOT NULL DEFAULT 'SUCESSO'
                          CHECK (execution_status IN ('INICIADO', 'SUCESSO', 'FALHA', 'TIMEOUT')),
    execution_time_ms   INTEGER NOT NULL,
    token_count_input   INTEGER,
    token_count_output  INTEGER,
    estimated_cost_usd  NUMERIC(8, 6), -- Rastreabilidade de custo
    error_message       TEXT,
    executed_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 5. TRABALHOS DE RENDERIZAÇÃO E VERSIONAMENTO DE IMAGENS FINAIS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS render_jobs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id      UUID NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    camera_id           UUID REFERENCES cameras(id) ON DELETE SET NULL,
    ai_execution_id     UUID REFERENCES ai_executions(id) ON DELETE SET NULL,
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDENTE'
                          CHECK (status IN ('PENDENTE', 'PROCESSANDO', 'CONCLUIDO', 'FALHOU')),
    created_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at        TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS render_versions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    render_job_id       UUID REFERENCES render_jobs(id) ON DELETE SET NULL,
    environment_id      UUID NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    camera_id           UUID REFERENCES cameras(id) ON DELETE SET NULL,
    parent_version_id   UUID REFERENCES render_versions(id) ON DELETE SET NULL, -- Versão ancestral
    version_label       VARCHAR(20) NOT NULL DEFAULT 'V01', -- 'V01', 'V02', 'V03'
    output_file_id      UUID NOT NULL REFERENCES files(id) ON DELETE RESTRICT,  -- Imagem final gerada
    approval_status     VARCHAR(30) NOT NULL DEFAULT 'RASCUNHO'
                          CHECK (approval_status IN (
                            'RASCUNHO', 'EM_REVISAO', 'APROVADO_INTERNO', 
                            'APROVADO_CLIENTE', 'DESCARTADO'
                          )),
    is_current_best     BOOLEAN NOT NULL DEFAULT false, -- Marco ativo do ambiente
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_render_vers_env    ON render_versions (environment_id);
CREATE INDEX IF NOT EXISTS idx_render_vers_status ON render_versions (approval_status);

CREATE TRIGGER trg_render_versions_updated_at
  BEFORE UPDATE ON render_versions
  FOR EACH ROW EXECUTE FUNCTION toca_atualizado_em();

-- Vínculo de ativos complementares do render (máscaras, referências do Revit)
CREATE TABLE IF NOT EXISTS render_assets (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    render_version_id   UUID NOT NULL REFERENCES render_versions(id) ON DELETE CASCADE,
    file_id             UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    asset_role          VARCHAR(50) NOT NULL
                          CHECK (asset_role IN (
                            'INPUT_REFERENCE_REVIT', 'INPUT_MASK', 'INPUT_DEPTH_MAP', 
                            'OUTPUT_HIGH_RES', 'OUTPUT_THUMBNAIL'
                          )),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
