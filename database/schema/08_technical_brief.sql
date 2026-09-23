-- ============================================================================
-- ARQVERTICE STUDIO — SCHEMA 08: BRIEFING TÉCNICO INTERNO (BLOCO C01)
-- Transformação do Briefing Aprovado em Documento de Trabalho Estruturado
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. BRIEFING TÉCNICO CENTRAL DO PROJETO
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS technical_briefs (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id                  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    client_briefing_id          UUID REFERENCES briefings(id) ON DELETE SET NULL,
    version                     INTEGER NOT NULL DEFAULT 1,
    status                      VARCHAR(50) NOT NULL DEFAULT 'DRAFT'
                                  CHECK (status IN ('DRAFT', 'IN_REVIEW', 'READY', 'APPROVED', 'SUPERSEDED')),
    
    -- Resumo Executivo Derivado e Editável
    executive_summary           TEXT,
    is_summary_derived          BOOLEAN NOT NULL DEFAULT true,
    summary_last_regenerated_at TIMESTAMPTZ,
    
    -- Seções Gerais Estruturadas
    project_type                VARCHAR(150),
    client_profile_summary      TEXT,
    project_objectives          TEXT,
    spatial_program_summary     TEXT,
    architectural_style         TEXT,
    materiality_guidelines      TEXT,
    lighting_concept            TEXT,
    furniture_carpentry_notes   TEXT,
    technology_automation_notes TEXT,
    outdoor_landscape_notes     TEXT,
    target_budget_notes         TEXT,
    schedule_deadlines_notes    TEXT,
    critical_attention_points   TEXT,
    internal_studio_notes       TEXT,
    
    -- Homologação e Aprovação Interna
    approved_by_user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_by_name            VARCHAR(150),
    approved_at                 TIMESTAMPTZ,
    approval_notes              TEXT,
    
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tech_brief_proj ON technical_briefs (project_id) WHERE status != 'SUPERSEDED';
CREATE INDEX IF NOT EXISTS idx_tech_brief_status ON technical_briefs (status);

CREATE TRIGGER trg_technical_briefs_updated_at
  BEFORE UPDATE ON technical_briefs
  FOR EACH ROW EXECUTE FUNCTION toca_atualizado_em();

-- ---------------------------------------------------------------------------
-- 2. DIRETRIZES TÉCNICAS ESTRUTURADAS (11 CATEGORIAS)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS technical_brief_directives (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    technical_brief_id  UUID NOT NULL REFERENCES technical_briefs(id) ON DELETE CASCADE,
    title               VARCHAR(200) NOT NULL,
    description         TEXT NOT NULL,
    category            VARCHAR(50) NOT NULL
                          CHECK (category IN (
                            'FUNCIONAL', 'ESPACIAL', 'ESTETICA', 'MATERIAL',
                            'ILUMINACAO', 'MOBILIARIO', 'TECNOLOGIA', 'CONFORTO',
                            'EXTERIOR', 'APRESENTACAO', 'OUTRA'
                          )),
    priority            VARCHAR(30) NOT NULL DEFAULT 'MEDIO'
                          CHECK (priority IN ('CRITICO', 'ALTO', 'MEDIO', 'BAIXO', 'INFORMATIVO')),
    source_type         VARCHAR(50) NOT NULL DEFAULT 'ARQVERTICE'
                          CHECK (source_type IN (
                            'CLIENTE', 'ARQVERTICE', 'ARQUIVO', 'REFERENCIA',
                            'LEVANTAMENTO', 'MODELO_REVIT', 'DECISAO', 'IA_SUGESTAO', 'OUTRO'
                          )),
    source_id           VARCHAR(100),
    source_version      VARCHAR(50),
    status              VARCHAR(30) NOT NULL DEFAULT 'ATIVA'
                          CHECK (status IN ('ATIVA', 'EM_ANALISE', 'APROVADA', 'DESCARTADA')),
    observation         TEXT,
    responsible         VARCHAR(150) NOT NULL DEFAULT 'Eduardo Marques',
    date_registered     DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_directives_brief ON technical_brief_directives (technical_brief_id);
CREATE INDEX IF NOT EXISTS idx_directives_cat   ON technical_brief_directives (category);
CREATE INDEX IF NOT EXISTS idx_directives_prio  ON technical_brief_directives (priority);

-- ---------------------------------------------------------------------------
-- 3. RESTRIÇÕES TÉCNICAS E DO IMÓVEL (8 CATEGORIAS)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS technical_brief_restrictions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    technical_brief_id  UUID NOT NULL REFERENCES technical_briefs(id) ON DELETE CASCADE,
    category            VARCHAR(60) NOT NULL
                          CHECK (category IN (
                            'PRESERVAR_EXISTENTE',
                            'INALTERAVEL',
                            'LIMITACAO_INFORMADA',
                            'PREFERENCIA_NEGATIVA',
                            'ORCAMENTO',
                            'PRAZO',
                            'OBRA',
                            'IMOVEL'
                          )),
    description         TEXT NOT NULL,
    priority            VARCHAR(30) NOT NULL DEFAULT 'ALTO'
                          CHECK (priority IN ('CRITICO', 'ALTO', 'MEDIO', 'BAIXO', 'INFORMATIVO')),
    source_type         VARCHAR(50) NOT NULL DEFAULT 'CLIENTE'
                          CHECK (source_type IN (
                            'CLIENTE', 'ARQVERTICE', 'ARQUIVO', 'REFERENCIA',
                            'LEVANTAMENTO', 'MODELO_REVIT', 'DECISAO', 'IA_SUGESTAO', 'OUTRO'
                          )),
    source_id           VARCHAR(100),
    source_version      VARCHAR(50),
    status              VARCHAR(30) NOT NULL DEFAULT 'ATIVA'
                          CHECK (status IN ('ATIVA', 'MITIGADA', 'REVOGADA')),
    observation         TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_restrictions_brief ON technical_brief_restrictions (technical_brief_id);
CREATE INDEX IF NOT EXISTS idx_restrictions_cat   ON technical_brief_restrictions (category);

-- ---------------------------------------------------------------------------
-- 4. FICHA TÉCNICA PRELIMINAR DOS AMBIENTES (16 ATRIBUTOS)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS technical_brief_environments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    technical_brief_id  UUID NOT NULL REFERENCES technical_briefs(id) ON DELETE CASCADE,
    environment_id      UUID REFERENCES environments(id) ON DELETE SET NULL,
    name                VARCHAR(150) NOT NULL,
    environment_type    VARCHAR(50) NOT NULL DEFAULT 'SALA',
    area_m2             NUMERIC(8, 2),
    users               VARCHAR(200),
    function_desc       TEXT,
    frequency           VARCHAR(50) DEFAULT 'Diária',
    needs               TEXT[],
    style               VARCHAR(100),
    desired_materials   TEXT,
    rejected_materials  TEXT,
    furniture           TEXT,
    equipment           TEXT,
    lighting            TEXT,
    references_notes    TEXT,
    observations        TEXT,
    status              VARCHAR(50) NOT NULL DEFAULT 'ESTUDO',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tb_envs_brief ON technical_brief_environments (technical_brief_id);

-- ---------------------------------------------------------------------------
-- 5. PENDÊNCIAS DO PROJETO
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS technical_brief_pendencies (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    technical_brief_id  UUID NOT NULL REFERENCES technical_briefs(id) ON DELETE CASCADE,
    description         TEXT NOT NULL,
    priority            VARCHAR(30) NOT NULL DEFAULT 'MEDIO'
                          CHECK (priority IN ('CRITICO', 'ALTO', 'MEDIO', 'BAIXO', 'INFORMATIVO')),
    responsible         VARCHAR(150) NOT NULL,
    status              VARCHAR(30) NOT NULL DEFAULT 'ABERTA'
                          CHECK (status IN ('ABERTA', 'EM_ANDAMENTO', 'RESOLVIDA', 'BLOQUEADA')),
    deadline            DATE,
    observation         TEXT,
    resolved_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tb_pend_brief ON technical_brief_pendencies (technical_brief_id);
CREATE INDEX IF NOT EXISTS idx_tb_pend_stat  ON technical_brief_pendencies (status);

-- ---------------------------------------------------------------------------
-- 6. SNAPSHOTS IMUTÁVEIS DO BRIEFING TÉCNICO (V01, V02...)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS technical_brief_snapshots (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    technical_brief_id  UUID NOT NULL REFERENCES technical_briefs(id) ON DELETE CASCADE,
    version_code        VARCHAR(50) NOT NULL, -- Ex: 'TECHNICAL_BRIEF_V01'
    version_number      INTEGER NOT NULL,
    approved_by_name    VARCHAR(150) NOT NULL,
    approved_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    snapshot_payload    JSONB NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tb_snap_brief ON technical_brief_snapshots (technical_brief_id, version_number);
