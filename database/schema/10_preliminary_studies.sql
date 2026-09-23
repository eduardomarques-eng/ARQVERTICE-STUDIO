-- ============================================================================
-- ARQVERTICE STUDIO — SCHEMA 10: ESTUDOS PRELIMINARES (BLOCO C03)
-- Gestão de Estudos, Alternativas (A, B, C), Comparação Lado a Lado,
-- Decisões Técnicas, Rastreabilidade de Autoria e Encaminhamento para Conceito
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. TABELA PRINCIPAL DE ESTUDOS PRELIMINARES (PRELIMINARY_STUDIES)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS preliminary_studies (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id              UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id          UUID REFERENCES environments(id) ON DELETE SET NULL,
    
    -- 11 Tipos Oficiais de Estudo do Bloco C03
    category                VARCHAR(50) NOT NULL
                              CHECK (category IN (
                                'LAYOUT', 'CIRCULACAO', 'VOLUMETRIA', 'FACHADA', 
                                'INTERIORES', 'MATERIALIDADE', 'ILUMINACAO', 
                                'MOBILIARIO', 'PAISAGISMO', 'AREA_EXTERNA', 'OUTRO'
                              )),
                              
    title                   VARCHAR(200) NOT NULL,
    description             TEXT,
    objective               TEXT, -- Objetivo principal da investigação
    hypothesis              TEXT, -- Hipótese espacial ou técnica testada
    observations            TEXT,
    
    -- Versionamento não-destrutivo do estudo
    version_number          INTEGER NOT NULL DEFAULT 1,
    version_label           VARCHAR(50) NOT NULL DEFAULT 'ESTUDO V01',
    parent_study_id         UUID REFERENCES preliminary_studies(id) ON DELETE SET NULL,
    
    -- Status do ciclo de vida
    status                  VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS'
                              CHECK (status IN (
                                'DRAFT', 'IN_PROGRESS', 'IN_REVIEW', 
                                'APPROVED', 'REJECTED', 'SUPERSEDED'
                              )),
                              
    -- Progresso (0%, 25%, 50%, 75%, 100%) — não confundir com aprovação
    progress_percent        INTEGER NOT NULL DEFAULT 0
                              CHECK (progress_percent IN (0, 25, 50, 75, 100)),
                              
    -- Relação e Rastreabilidade com Autodesk Revit (Prompt C03 item 11)
    is_revit_developed      BOOLEAN NOT NULL DEFAULT false,
    revit_view_name         VARCHAR(150),
    revit_notes             TEXT,
    
    -- Homologação e Encaminhamento para Conceito (Prompt C03 item 13 e 15)
    approved_at             TIMESTAMPTZ,
    approved_by_name        VARCHAR(120),
    approval_notes          TEXT,
    forwarded_to_concept    BOOLEAN NOT NULL DEFAULT false,
    concept_handover_date   TIMESTAMPTZ,
    
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_studies_project ON preliminary_studies (project_id);
CREATE INDEX IF NOT EXISTS idx_studies_env     ON preliminary_studies (environment_id);
CREATE INDEX IF NOT EXISTS idx_studies_cat     ON preliminary_studies (category);
CREATE INDEX IF NOT EXISTS idx_studies_status  ON preliminary_studies (status);

CREATE TRIGGER trg_preliminary_studies_updated_at
  BEFORE UPDATE ON preliminary_studies
  FOR EACH ROW EXECUTE FUNCTION toca_atualizado_em();

-- ---------------------------------------------------------------------------
-- 2. ALTERNATIVAS DO ESTUDO (STUDY_ALTERNATIVES)
-- Ex: Alternativa A, Alternativa B, Alternativa C...
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS study_alternatives (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_id                UUID NOT NULL REFERENCES preliminary_studies(id) ON DELETE CASCADE,
    alternative_code        VARCHAR(10) NOT NULL, -- 'A', 'B', 'C', 'D'
    title                   VARCHAR(150) NOT NULL,
    description             TEXT,
    
    -- Prós e contras registrados pelo arquiteto (sem automação forçada da IA)
    advantages              TEXT[] DEFAULT ARRAY[]::TEXT[],
    disadvantages           TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    image_url               TEXT,
    
    -- Observação de Autoria (Prompt C03 item 9)
    authorship              VARCHAR(50) NOT NULL DEFAULT 'CRIADO_PELA_ARQVERTICE'
                              CHECK (authorship IN (
                                'CRIADO_PELA_ARQVERTICE', 
                                'IMPORTADO', 
                                'REFERENCIA_EXTERNA', 
                                'GERADO_POR_IA'
                              )),
                              
    is_selected             BOOLEAN NOT NULL DEFAULT false,
    order_index             INTEGER NOT NULL DEFAULT 0,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(study_id, alternative_code)
);

CREATE INDEX IF NOT EXISTS idx_study_alts_study ON study_alternatives (study_id);

-- ---------------------------------------------------------------------------
-- 3. DECISÕES TÉCNICAS DO ESTUDO (STUDY_DECISIONS)
-- Registra a escolha formal humana que passa a integrar a memória do projeto
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS study_decisions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_id                UUID NOT NULL REFERENCES preliminary_studies(id) ON DELETE CASCADE,
    selected_alternative_id UUID NOT NULL REFERENCES study_alternatives(id) ON DELETE RESTRICT,
    rationale               TEXT NOT NULL, -- Motivo da decisão
    decided_by_name         VARCHAR(120) NOT NULL,
    decision_date           DATE NOT NULL DEFAULT CURRENT_DATE,
    observations            TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_study_decisions_study ON study_decisions (study_id);

-- ---------------------------------------------------------------------------
-- 4. ARQUIVOS E REFERÊNCIAS VINCULADOS AO ESTUDO
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS study_asset_links (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_id                UUID NOT NULL REFERENCES preliminary_studies(id) ON DELETE CASCADE,
    alternative_id          UUID REFERENCES study_alternatives(id) ON DELETE CASCADE,
    asset_id                UUID REFERENCES survey_assets(id) ON DELETE CASCADE,
    reference_source        VARCHAR(50) NOT NULL DEFAULT 'ARQVERTICE'
                              CHECK (reference_source IN (
                                'CLIENTE', 'ARQVERTICE', 'FORNECEDOR', 'ESTUDO_ANTERIOR', 'PROPRIA'
                              )),
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
