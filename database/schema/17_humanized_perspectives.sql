-- ============================================================================
-- ARQVERTICE STUDIO — SCHEMA 17: PERSPECTIVAS HUMANIZADAS (D04)
-- ============================================================================
-- Estruturas para geração de perspectivas tridimensionais humanizadas a partir
-- de exportações do Revit, preservação arquitetônica, configurações de iluminação,
-- realismo, atmosfera e registro de saídas homologadas (APPROVED_VISUAL_OUTPUT).

-- 1. Tabela Principal de Perspectivas (por vista / ambiente)
CREATE TABLE IF NOT EXISTS humanized_perspectives (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id VARCHAR(64) NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    camera_id VARCHAR(64), -- ID da câmera Revit vinculada (se houver)
    source_asset_id VARCHAR(64), -- ID do ativo base do levantamento (3D Revit / Vista)
    base_image_url TEXT NOT NULL, -- Imagem-base do Revit (nunca apagada ou substituída)
    title VARCHAR(255) NOT NULL,
    base_view_origin VARCHAR(64) DEFAULT 'REVIT_3D_PERSPECTIVE', -- REVIT_3D_PERSPECTIVE, ELEVATION, ENVIRONMENT_VIEW
    current_version_id VARCHAR(64), -- Ponteiro para a versão ativa/aprovada
    focal_length VARCHAR(32) DEFAULT '24mm',
    camera_height_m NUMERIC(4,2) DEFAULT 1.55,
    orientation VARCHAR(64) DEFAULT 'Sul-Sudeste para Deck',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Versões da Perspectiva Humanizada
CREATE TABLE IF NOT EXISTS humanized_perspective_versions (
    id VARCHAR(64) PRIMARY KEY,
    perspective_id VARCHAR(64) NOT NULL REFERENCES humanized_perspectives(id) ON DELETE CASCADE,
    version_tag VARCHAR(32) NOT NULL, -- Ex: 'V01', 'V02', 'V03-VAR'
    source_base_url TEXT NOT NULL, -- Imagem-base técnica imutável
    image_url TEXT NOT NULL, -- Render humanizado gerado
    thumbnail_url TEXT,
    realism_level VARCHAR(32) NOT NULL DEFAULT 'REALISTA', -- APRESENTACAO, REALISTA, FOTOREALISTA
    lighting_setup VARCHAR(64) NOT NULL DEFAULT 'TARDE', -- DIA, MANHA, TARDE, NOITE, ILUMINACAO_INTERNA, ILUMINACAO_NATURAL_PREDOMINANTE
    atmosphere VARCHAR(64) NOT NULL DEFAULT 'ACONCHEGANTE', -- ACONCHEGANTE, SOFISTICADA, NATURAL, CONTEMPORANEA, DRAMATICA, LEVE, OUTRA
    preserved_elements TEXT[] DEFAULT ARRAY['arquitetura', 'paredes', 'aberturas', 'proporcoes', 'teto', 'piso', 'layout', 'elementos_fixos'],
    editable_elements TEXT[] DEFAULT ARRAY['mobiliario', 'decoracao', 'materiais', 'iluminacao', 'objetos', 'paisagismo'],
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT', -- DRAFT, IN_REVIEW, APPROVED, REJECTED, SUPERSEDED
    prompt_used TEXT NOT NULL,
    provider VARCHAR(64) DEFAULT 'STUDIO_SYNTHESIS_ENGINE',
    model VARCHAR(64) DEFAULT 'arqvertice-diffusion-arch-v2',
    context_version VARCHAR(32) DEFAULT 'C06_D02_V01',
    parent_version_id VARCHAR(64) REFERENCES humanized_perspective_versions(id) ON DELETE SET NULL,
    localized_instruction TEXT,
    approval_notes TEXT,
    rejection_reason TEXT,
    approved_by VARCHAR(128),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Saídas Homologadas para Apresentação, Relatório e Vídeo (APPROVED_VISUAL_OUTPUT)
CREATE TABLE IF NOT EXISTS approved_visual_outputs (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id VARCHAR(64) NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    output_type VARCHAR(64) NOT NULL, -- PERSPECTIVE, HUMANIZED_PLAN, DETAIL
    version_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    realism_level VARCHAR(32),
    lighting_setup VARCHAR(64),
    atmosphere VARCHAR(64),
    metadata JSONB,
    tags TEXT[],
    approved_by VARCHAR(128) NOT NULL,
    approved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_hpersp_env ON humanized_perspectives(environment_id);
CREATE INDEX IF NOT EXISTS idx_hpersp_ver_persp ON humanized_perspective_versions(perspective_id);
CREATE INDEX IF NOT EXISTS idx_approved_outputs_env ON approved_visual_outputs(environment_id);
CREATE INDEX IF NOT EXISTS idx_approved_outputs_proj ON approved_visual_outputs(project_id);
