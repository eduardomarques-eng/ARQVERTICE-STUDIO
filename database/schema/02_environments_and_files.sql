-- ============================================================================
-- ARQVERTICE STUDIO — SCHEMA 02: AMBIENTES, CÂMERAS E METADADOS DE ARQUIVOS
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. AMBIENTES (UNIDADE ESPACIAL CENTRAL DO PROJETO)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS environments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name                VARCHAR(120) NOT NULL, -- Ex: 'Sala de Estar Integrada', 'Deck Gourmet'
    environment_type    VARCHAR(50) NOT NULL DEFAULT 'SALA'
                          CHECK (environment_type IN (
                            'SALA', 'COZINHA', 'SUITE', 'QUARTO', 'BANHEIRO', 
                            'AREA_GOURMET', 'DECK', 'PISCINA', 'GARAGEM', 
                            'FACHADA', 'LAVANDERIA', 'CIRCULACAO', 'EXTERIOR', 'OUTRO'
                          )),
    floor_level         VARCHAR(50) NOT NULL DEFAULT 'Térreo', -- 'Subsolo', 'Térreo', 'Superior', 'Cobertura'
    area_m2             NUMERIC(8, 2), -- Área útil
    ceiling_height_m    NUMERIC(4, 2), -- Pé direito em metros (ex: 2.80, 3.20)
    description         TEXT,
    status              VARCHAR(50) NOT NULL DEFAULT 'ESTUDO'
                          CHECK (status IN ('BRIEFING', 'ESTUDO', 'MODELAGEM_3D', 'RENDERIZACAO', 'APROVADO', 'EXECUTIVO')),
    order_index         INTEGER NOT NULL DEFAULT 0,
    cover_image_url     TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_environments_project ON environments (project_id);
CREATE INDEX IF NOT EXISTS idx_environments_order   ON environments (project_id, order_index);

CREATE TRIGGER trg_environments_updated_at
  BEFORE UPDATE ON environments
  FOR EACH ROW EXECUTE FUNCTION toca_atualizado_em();

-- ---------------------------------------------------------------------------
-- 2. CÂMERAS E PONTOS DE VISTA DO AMBIENTE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cameras (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    environment_id      UUID NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    name                VARCHAR(100) NOT NULL, -- Ex: 'Câmera 01 - Vista Entrada', 'Câmera 02 - Foco Ilha'
    focal_length_mm     INTEGER DEFAULT 24,    -- Lente da câmera (ex: 18mm, 24mm, 35mm, 50mm)
    height_meters       NUMERIC(4, 2) DEFAULT 1.50, -- Altura do observador
    position_x          NUMERIC(8, 2),
    position_y          NUMERIC(8, 2),
    target_x            NUMERIC(8, 2),
    target_y            NUMERIC(8, 2),
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cameras_environment ON cameras (environment_id);

CREATE TRIGGER trg_cameras_updated_at
  BEFORE UPDATE ON cameras
  FOR EACH ROW EXECUTE FUNCTION toca_atualizado_em();

-- ---------------------------------------------------------------------------
-- 3. ARQUIVOS (METADADOS DE ATIVOS CAD, BIM, 3D, IMAGENS E DOCUMENTOS)
-- O arquivo binário bruto reside no Storage de Objetos (S3/R2/Supabase)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS files (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id      UUID REFERENCES environments(id) ON DELETE SET NULL,
    category            VARCHAR(50) NOT NULL
                          CHECK (category IN (
                            'PLANTA_TECNICA', 'PERSPECTIVA_REVIT', 'RENDER_FINAL', 
                            'FOTO_OBRA', 'MODELO_BIM', 'BLOCO_3D', 'MOODBOARD', 
                            'PRANCHA_APRESENTACAO', 'DOCUMENTO_LEGAL', 'BRIEFING_ANEXO', 'OUTRO'
                          )),
    origin              VARCHAR(50) NOT NULL DEFAULT 'UPLOAD_EQUIPE'
                          CHECK (origin IN ('REVIT', 'UPLOAD_EQUIPE', 'GERACAO_IA', 'CLIENTE', 'SCAN_CANTEIRO')),
    original_name       VARCHAR(255) NOT NULL,
    stored_name         VARCHAR(255) NOT NULL,
    file_extension      VARCHAR(20) NOT NULL, -- '.rvt', '.ifc', '.dwg', '.png', '.pdf'
    mime_type           VARCHAR(120) NOT NULL,
    file_size_bytes     BIGINT NOT NULL CHECK (file_size_bytes > 0),
    storage_path        TEXT NOT NULL UNIQUE, -- Caminho no bucket de objetos
    thumbnail_path      TEXT,
    hash_sha256         VARCHAR(64) NOT NULL, -- Checksum para integridade e deduplicação
    version             INTEGER NOT NULL DEFAULT 1,
    status              VARCHAR(30) NOT NULL DEFAULT 'ATIVO'
                          CHECK (status IN ('PROCESSANDO', 'ATIVO', 'SUBSTITUIDO', 'ARQUIVADO')),
    uploaded_by         UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_files_project   ON files (project_id);
CREATE INDEX IF NOT EXISTS idx_files_env       ON files (environment_id);
CREATE INDEX IF NOT EXISTS idx_files_category  ON files (category);
CREATE INDEX IF NOT EXISTS idx_files_hash      ON files (hash_sha256);

CREATE TRIGGER trg_files_updated_at
  BEFORE UPDATE ON files
  FOR EACH ROW EXECUTE FUNCTION toca_atualizado_em();

-- ---------------------------------------------------------------------------
-- 4. GRUPOS DE REFERÊNCIA E PAINEL VISUAL DO AMBIENTE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reference_groups (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id      UUID REFERENCES environments(id) ON DELETE SET NULL,
    title               VARCHAR(150) NOT NULL, -- Ex: 'Referências de Marcenaria', 'Estilo Iluminação'
    description         TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS environment_references (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    environment_id      UUID NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    file_id             UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    reference_group_id  UUID REFERENCES reference_groups(id) ON DELETE SET NULL,
    title               VARCHAR(150),
    external_url        TEXT, -- Link para Pinterest, Instagram, etc.
    notes               TEXT,
    is_primary          BOOLEAN NOT NULL DEFAULT false,
    order_index         INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_env_refs_env  ON environment_references (environment_id);
CREATE INDEX IF NOT EXISTS idx_env_refs_file ON environment_references (file_id);
