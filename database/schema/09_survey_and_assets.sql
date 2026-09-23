-- ============================================================================
-- ARQVERTICE STUDIO — SCHEMA 09: LEVANTAMENTO E ORGANIZAÇÃO DA BASE (BLOCO C02)
-- Gestão de Ativos CAD/BIM, Plantas, Perspectivas do Revit, Cortes, Elevações,
-- Conjuntos de Referência (REFERENCE_SET), Checklist e ENVIRONMENT_CONTEXT
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. CATÁLOGO DE ATIVOS DE LEVANTAMENTO E BASE (SURVEY_ASSETS)
-- Organiza plantas, perspectivas, elevações, cortes, fotos e referências.
-- Preserva o original inviolável e rastreia metadados do Revit.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS survey_assets (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id      UUID REFERENCES environments(id) ON DELETE SET NULL,
    
    -- 15 Categorias Oficiais do Bloco C02
    category            VARCHAR(50) NOT NULL
                          CHECK (category IN (
                            'PLANTA', 'PLANTA_HUMANIZADA', 'PERSPECTIVA', 'VISTA', 
                            'ELEVACAO', 'CORTE', 'FACHADA', 'FOTO', 'MODELO_3D', 
                            'MATERIAL', 'MOVEL', 'ILUMINACAO', 'PAISAGISMO', 'ESTILO', 'OUTRO'
                          )),
                          
    -- Identificação e integridade física do arquivo
    title               VARCHAR(200) NOT NULL,
    original_filename   VARCHAR(255) NOT NULL,
    stored_filename     VARCHAR(255) NOT NULL,
    file_extension      VARCHAR(20) NOT NULL, -- Ex: '.png', '.jpg', '.pdf', '.dwg', '.rvt', '.ifc'
    mime_type           VARCHAR(120) NOT NULL,
    file_size_bytes     BIGINT NOT NULL CHECK (file_size_bytes > 0),
    original_url        TEXT NOT NULL,        -- URL do arquivo original intocado
    thumbnail_url       TEXT,                 -- Derivado otimizado para navegação rápida
    hash_sha256         VARCHAR(64) NOT NULL, -- Checksum para integridade e garantia de não-modificação
    
    -- Versionamento não destrutivo (PLANTA V01, V02, V03...)
    version_number      INTEGER NOT NULL DEFAULT 1,
    version_label       VARCHAR(50) NOT NULL DEFAULT 'V01',
    version_status      VARCHAR(30) NOT NULL DEFAULT 'CURRENT'
                          CHECK (version_status IN ('CURRENT', 'APPROVED', 'SUPERSEDED')),
    parent_asset_id     UUID REFERENCES survey_assets(id) ON DELETE SET NULL, -- Vínculo de histórico de versão
    
    -- Nível de Prioridade da Referência (Prompt C02 item 7 e 8)
    priority            VARCHAR(30) NOT NULL DEFAULT 'SECONDARY'
                          CHECK (priority IN ('PRIMARY', 'SECONDARY', 'OPTIONAL', 'REJECTED')),
    rejection_reason    TEXT, -- Obrigatório quando priority = 'REJECTED'
    
    -- Metadados Técnicos Específicos do Autodesk Revit (Prompt C02 item 9)
    is_revit_origin     BOOLEAN NOT NULL DEFAULT false,
    revit_view_name     VARCHAR(120),  -- Ex: '3D - Living Social', 'Planta Térreo Executiva'
    revit_phase         VARCHAR(80),   -- Ex: 'Existente', 'Nova Construção', 'Fase 01'
    revit_camera_name   VARCHAR(120),  -- Ex: 'Cam_Living_01', 'Cam_Gourmet_Piscina'
    revit_purpose       VARCHAR(150),  -- Ex: 'Estudo de insolação', 'Definição de esquadrias'
    
    -- Metadados de Plantas Baixas e Desenhos Técnicos (Prompt C02 item 10)
    floor_level         VARCHAR(60),   -- Ex: 'Térreo', 'Superior', 'Subsolo', 'Cobertura', 'Implantação'
    drawing_scale       VARCHAR(30),   -- Ex: '1:50', '1:100', '1:25', 'Sem escala'
    orientation         VARCHAR(50),   -- Ex: 'Norte Verdadeiro', 'Norte de Projeto', 'Sudeste'
    
    -- Metadados de Perspectivas (Prompt C02 item 11)
    perspective_approval VARCHAR(30) DEFAULT 'EM_ANALISE'
                          CHECK (perspective_approval IN ('APROVADA', 'EM_ANALISE', 'REJEITADA')),
                          
    -- Agrupamento e Atributos Visuais (Prompt C02 item 13)
    classification_tags JSONB DEFAULT '{
      "style": null,
      "material": null,
      "furniture": null,
      "lighting": null,
      "landscape": null,
      "atmosphere": null,
      "composition": null
    }'::jsonb,
    
    -- Anotações e Instruções de Uso da Referência (Prompt C02 item 14)
    observation_notes   TEXT,
    
    -- Sugestões de IA Assistiva (Prompt C02 item 15 e 21)
    ai_classification   JSONB DEFAULT '{
      "suggestedCategory": null,
      "suggestedEnvironment": null,
      "suggestedMaterials": [],
      "suggestedStyle": null,
      "provenanceTag": "AI_SUGGESTION",
      "userConfirmed": false,
      "unconfirmedElements": []
    }'::jsonb,
    
    created_by          UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_survey_assets_proj ON survey_assets (project_id);
CREATE INDEX IF NOT EXISTS idx_survey_assets_env  ON survey_assets (environment_id);
CREATE INDEX IF NOT EXISTS idx_survey_assets_cat  ON survey_assets (category);
CREATE INDEX IF NOT EXISTS idx_survey_assets_prio ON survey_assets (priority);
CREATE INDEX IF NOT EXISTS idx_survey_assets_ver  ON survey_assets (project_id, version_status);

CREATE TRIGGER trg_survey_assets_updated_at
  BEFORE UPDATE ON survey_assets
  FOR EACH ROW EXECUTE FUNCTION toca_atualizado_em();

-- ---------------------------------------------------------------------------
-- 2. CONJUNTOS DE REFERÊNCIA TEMÁTICOS (REFERENCE_SET)
-- Agrupamento intencional de referências (Prompt C02 item 6)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reference_sets (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id      UUID REFERENCES environments(id) ON DELETE SET NULL,
    name                VARCHAR(150) NOT NULL, -- Ex: 'Sala — referências principais', 'Deck — Hijau e Madeira'
    description         TEXT,
    purpose             VARCHAR(200),          -- Ex: 'Definir paleta de texturas e forro do living'
    priority            VARCHAR(30) NOT NULL DEFAULT 'PRIMARY'
                          CHECK (priority IN ('PRIMARY', 'SECONDARY', 'OPTIONAL', 'REJECTED')),
    version             INTEGER NOT NULL DEFAULT 1,
    status              VARCHAR(30) NOT NULL DEFAULT 'ATIVO'
                          CHECK (status IN ('ATIVO', 'ARQUIVADO', 'REVISAO')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reference_set_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_set_id    UUID NOT NULL REFERENCES reference_sets(id) ON DELETE CASCADE,
    asset_id            UUID NOT NULL REFERENCES survey_assets(id) ON DELETE CASCADE,
    order_index         INTEGER NOT NULL DEFAULT 0,
    item_notes          TEXT,
    added_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(reference_set_id, asset_id)
);

CREATE INDEX IF NOT EXISTS idx_ref_set_proj ON reference_sets (project_id);
CREATE INDEX IF NOT EXISTS idx_ref_set_env  ON reference_sets (environment_id);

-- ---------------------------------------------------------------------------
-- 3. CHECKLIST DO LEVANTAMENTO POR AMBIENTE (SURVEY_CHECKLISTS)
-- Controle de maturidade da base do ambiente (Prompt C02 item 17)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS survey_checklists (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id      UUID NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    
    -- 8 Itens Oficiais do Checklist do Bloco C02
    has_floor_plan              BOOLEAN NOT NULL DEFAULT false,
    has_perspective             BOOLEAN NOT NULL DEFAULT false,
    has_references              BOOLEAN NOT NULL DEFAULT false,
    has_measurements            BOOLEAN NOT NULL DEFAULT false,
    has_openings_identified     BOOLEAN NOT NULL DEFAULT false,
    has_existing_elements       BOOLEAN NOT NULL DEFAULT false,
    has_restrictions_registered BOOLEAN NOT NULL DEFAULT false,
    has_primary_refs_defined    BOOLEAN NOT NULL DEFAULT false,
    
    -- Metadados de validação
    verified_by_name    VARCHAR(120),
    verified_at         TIMESTAMPTZ,
    notes               TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(project_id, environment_id)
);

-- ---------------------------------------------------------------------------
-- 4. BASE CONSOLIDADA DE VISUALIZAÇÃO (ENVIRONMENT_CONTEXT)
-- Payload unificado preparado para a engine de visualização futura (Prompt C02 item 20 e 21)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS environment_contexts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id      UUID NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    version             INTEGER NOT NULL DEFAULT 1,
    status              VARCHAR(30) NOT NULL DEFAULT 'READY_FOR_STUDY'
                          CHECK (status IN ('INCOMPLETE', 'READY_FOR_STUDY', 'LOCKED')),
    
    -- Objeto JSON consolidado com todas as fontes validadas
    payload             JSONB NOT NULL,
    
    -- Auditoria e garantia de não-invenção de dados pela IA
    unconfirmed_flags   TEXT[] DEFAULT ARRAY[]::TEXT[], -- Lista de itens marcados como 'UNKNOWN' ou 'NOT_CONFIRMED'
    generated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(project_id, environment_id, version)
);

CREATE INDEX IF NOT EXISTS idx_env_contexts_env ON environment_contexts (environment_id);
