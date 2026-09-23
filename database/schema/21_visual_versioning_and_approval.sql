-- ============================================================================
-- ARQVERTICE STUDIO — DDL: BLOCO D08 — VERSIONAMENTO, APROVAÇÃO E REVISÃO DAS IMAGENS
-- ============================================================================
-- Criação das tabelas de versionamento de imagens e configurações visuais,
-- ciclo de aprovação/rejeição, histórico não-destrutivo, comentários de revisão,
-- snapshots visuais completos e restauração "Use as Base".
-- ============================================================================

-- 1. TIPOS CANÔNICOS DE VERSIONAMENTO VISUAL (Prompt D08 Item 1)
-- HUMANIZED_PLAN, HUMANIZED_PERSPECTIVE, CAMERA, RENDER, REFERENCE_SET, VISUAL_CONFIGURATION
CREATE TYPE visual_version_type_enum AS ENUM (
    'HUMANIZED_PLAN',
    'HUMANIZED_PERSPECTIVE',
    'CAMERA',
    'RENDER',
    'REFERENCE_SET',
    'VISUAL_CONFIGURATION'
);

-- 2. STATUS CANÔNICOS DE VERSÃO (Prompt D08 Item 2)
-- DRAFT, GENERATING, IN_REVIEW, APPROVED, REJECTED, SUPERSEDED, ARCHIVED
CREATE TYPE visual_version_status_enum AS ENUM (
    'DRAFT',
    'GENERATING',
    'IN_REVIEW',
    'APPROVED',
    'REJECTED',
    'SUPERSEDED',
    'ARCHIVED'
);

-- 3. MOTIVOS CANÔNICOS DE REJEIÇÃO (Prompt D08 Item 6)
-- material, iluminação, composição, mobiliário, geometria, câmera, outro
CREATE TYPE visual_rejection_reason_enum AS ENUM (
    'MATERIAL',
    'ILUMINACAO',
    'COMPOSICAO',
    'MOBILIARIO',
    'GEOMETRIA',
    'CAMERA',
    'OUTRO'
);

-- ============================================================================
-- TABELA: visual_versions
-- ============================================================================
CREATE TABLE IF NOT EXISTS visual_versions (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id VARCHAR(64) NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    camera_id VARCHAR(64) REFERENCES environment_cameras(id) ON DELETE SET NULL,
    render_job_id VARCHAR(64) REFERENCES render_jobs(id) ON DELETE SET NULL,
    
    version_type visual_version_type_enum NOT NULL DEFAULT 'RENDER',
    version_code VARCHAR(32) NOT NULL, -- Ex: 'V01', 'V02', 'V03'
    version_sequence INTEGER NOT NULL DEFAULT 1,
    status visual_version_status_enum NOT NULL DEFAULT 'IN_REVIEW',
    
    -- Imagem e Mídia
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    
    -- Aprovação e Referência (Prompt D08 Itens 4 e 5)
    is_approved_reference BOOLEAN NOT NULL DEFAULT FALSE,
    approved_by VARCHAR(128),
    approved_at TIMESTAMPTZ,
    approval_notes TEXT,
    
    -- Rejeição (Prompt D08 Item 6)
    rejection_reason visual_rejection_reason_enum,
    rejection_notes TEXT,
    rejected_by VARCHAR(128),
    rejected_at TIMESTAMPTZ,
    
    -- Substituição e Linhagem (Prompt D08 Itens 7 e 14)
    parent_version_id VARCHAR(64) REFERENCES visual_versions(id) ON DELETE SET NULL,
    superseded_by_version_id VARCHAR(64) REFERENCES visual_versions(id) ON DELETE SET NULL,
    superseded_at TIMESTAMPTZ,
    
    -- Snapshots Contextuais (Prompt D08 Itens 8 e 12)
    prompt_snapshot JSONB,
    locks_snapshot JSONB,
    metadata JSONB DEFAULT '{}'::jsonb, -- resolução, aspecto, provider, modelo, seed
    
    -- Rastreabilidade
    created_by VARCHAR(128) NOT NULL DEFAULT 'Equipe ArqVértice',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices otimizados
CREATE INDEX IF NOT EXISTS idx_visual_ver_env_type ON visual_versions(environment_id, version_type, version_sequence);
CREATE INDEX IF NOT EXISTS idx_visual_ver_camera ON visual_versions(camera_id, status);
CREATE INDEX IF NOT EXISTS idx_visual_ver_status ON visual_versions(status);
CREATE INDEX IF NOT EXISTS idx_visual_ver_approved_ref ON visual_versions(environment_id, is_approved_reference);

-- ============================================================================
-- TABELA: visual_version_comments (Prompt D08 Itens 10 e 11)
-- ============================================================================
CREATE TABLE IF NOT EXISTS visual_version_comments (
    id VARCHAR(64) PRIMARY KEY,
    visual_version_id VARCHAR(64) NOT NULL REFERENCES visual_versions(id) ON DELETE CASCADE,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id VARCHAR(64) NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    
    comment_text TEXT NOT NULL,
    author_name VARCHAR(128) NOT NULL DEFAULT 'Arquiteto',
    author_role VARCHAR(64) DEFAULT 'ARQUITETO',
    
    -- Conversão em Decisão de Projeto (Prompt D08 Item 11)
    converted_to_decision BOOLEAN NOT NULL DEFAULT FALSE,
    decision_memory_id VARCHAR(64),
    converted_at TIMESTAMPTZ,
    converted_by VARCHAR(128),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ver_comments_version ON visual_version_comments(visual_version_id);

-- ============================================================================
-- TABELA: visual_snapshots (Prompt D08 Item 12)
-- ============================================================================
CREATE TABLE IF NOT EXISTS visual_snapshots (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id VARCHAR(64) NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    
    snapshot_name VARCHAR(128) NOT NULL,
    description TEXT,
    snapshot_version VARCHAR(32) NOT NULL,
    
    -- Estado congelado
    render_version_id VARCHAR(64) REFERENCES visual_versions(id) ON DELETE SET NULL,
    camera_id VARCHAR(64) REFERENCES environment_cameras(id) ON DELETE SET NULL,
    
    references_state JSONB NOT NULL DEFAULT '[]'::jsonb,
    locks_state JSONB NOT NULL DEFAULT '[]'::jsonb,
    materials_state JSONB NOT NULL DEFAULT '{}'::jsonb,
    furniture_state JSONB NOT NULL DEFAULT '[]'::jsonb,
    concept_state JSONB NOT NULL DEFAULT '{}'::jsonb,
    context_package JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    created_by VARCHAR(128) NOT NULL DEFAULT 'Equipe ArqVértice',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_visual_snapshots_env ON visual_snapshots(environment_id, created_at DESC);
