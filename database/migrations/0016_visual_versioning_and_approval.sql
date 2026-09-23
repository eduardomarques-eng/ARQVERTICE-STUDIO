-- ============================================================================
-- ARQVERTICE STUDIO — MIGRAÇÃO 0016: BLOCO D08
-- ============================================================================
-- Criação das estruturas de versionamento, aprovação, rejeição com motivos,
-- snapshots visuais e linhagem não-destrutiva.
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visual_version_type_enum') THEN
        CREATE TYPE visual_version_type_enum AS ENUM (
            'HUMANIZED_PLAN',
            'HUMANIZED_PERSPECTIVE',
            'CAMERA',
            'RENDER',
            'REFERENCE_SET',
            'VISUAL_CONFIGURATION'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visual_version_status_enum') THEN
        CREATE TYPE visual_version_status_enum AS ENUM (
            'DRAFT',
            'GENERATING',
            'IN_REVIEW',
            'APPROVED',
            'REJECTED',
            'SUPERSEDED',
            'ARCHIVED'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visual_rejection_reason_enum') THEN
        CREATE TYPE visual_rejection_reason_enum AS ENUM (
            'MATERIAL',
            'ILUMINACAO',
            'COMPOSICAO',
            'MOBILIARIO',
            'GEOMETRIA',
            'CAMERA',
            'OUTRO'
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS visual_versions (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL,
    environment_id VARCHAR(64) NOT NULL,
    camera_id VARCHAR(64),
    render_job_id VARCHAR(64),
    
    version_type visual_version_type_enum NOT NULL DEFAULT 'RENDER',
    version_code VARCHAR(32) NOT NULL,
    version_sequence INTEGER NOT NULL DEFAULT 1,
    status visual_version_status_enum NOT NULL DEFAULT 'IN_REVIEW',
    
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    
    is_approved_reference BOOLEAN NOT NULL DEFAULT FALSE,
    approved_by VARCHAR(128),
    approved_at TIMESTAMPTZ,
    approval_notes TEXT,
    
    rejection_reason visual_rejection_reason_enum,
    rejection_notes TEXT,
    rejected_by VARCHAR(128),
    rejected_at TIMESTAMPTZ,
    
    parent_version_id VARCHAR(64),
    superseded_by_version_id VARCHAR(64),
    superseded_at TIMESTAMPTZ,
    
    prompt_snapshot JSONB,
    locks_snapshot JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_by VARCHAR(128) NOT NULL DEFAULT 'Equipe ArqVértice',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visual_version_comments (
    id VARCHAR(64) PRIMARY KEY,
    visual_version_id VARCHAR(64) NOT NULL,
    project_id VARCHAR(64) NOT NULL,
    environment_id VARCHAR(64) NOT NULL,
    
    comment_text TEXT NOT NULL,
    author_name VARCHAR(128) NOT NULL DEFAULT 'Arquiteto',
    author_role VARCHAR(64) DEFAULT 'ARQUITETO',
    
    converted_to_decision BOOLEAN NOT NULL DEFAULT FALSE,
    decision_memory_id VARCHAR(64),
    converted_at TIMESTAMPTZ,
    converted_by VARCHAR(128),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visual_snapshots (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL,
    environment_id VARCHAR(64) NOT NULL,
    
    snapshot_name VARCHAR(128) NOT NULL,
    description TEXT,
    snapshot_version VARCHAR(32) NOT NULL,
    
    render_version_id VARCHAR(64),
    camera_id VARCHAR(64),
    
    references_state JSONB NOT NULL DEFAULT '[]'::jsonb,
    locks_state JSONB NOT NULL DEFAULT '[]'::jsonb,
    materials_state JSONB NOT NULL DEFAULT '{}'::jsonb,
    furniture_state JSONB NOT NULL DEFAULT '[]'::jsonb,
    concept_state JSONB NOT NULL DEFAULT '{}'::jsonb,
    context_package JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    created_by VARCHAR(128) NOT NULL DEFAULT 'Equipe ArqVértice',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed de versões iniciais para o projeto Praia 01 / Living
INSERT INTO visual_versions (
    id, project_id, environment_id, camera_id, version_type, version_code, version_sequence,
    status, image_url, is_approved_reference, approved_by, approved_at, approval_notes,
    metadata, created_by, created_at, updated_at
) VALUES (
    'ver-rnd-sala-01',
    'prj-praia-01',
    'amb-sala-01',
    'cam-sala-01',
    'RENDER',
    'V01',
    1,
    'APPROVED',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
    TRUE,
    'Eduardo Marques (Arquiteto Titular)',
    '2026-09-21T15:30:00Z',
    'Homologado com o cliente Pedro. Referência visual mestre do living integrado com deck.',
    '{"resolution": "4K UHD (3840x2160)", "aspectRatio": "16:9", "provider": "gemini", "model": "imagen-3.0-generate-002"}'::jsonb,
    'Eduardo Marques',
    '2026-09-21T15:28:00Z',
    '2026-09-21T15:30:00Z'
) ON CONFLICT (id) DO NOTHING;
