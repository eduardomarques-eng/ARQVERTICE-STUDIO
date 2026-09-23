-- ============================================================================
-- ARQVERTICE STUDIO — MIGRATION 0023: BLOCO G01 (VIDEO STUDIO FOUNDATION)
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'video_project_type_enum') THEN
        CREATE TYPE video_project_type_enum AS ENUM (
            'apresentacao_projeto',
            'apresentacao_ambiente',
            'apresentacao_cliente',
            'video_conceito',
            'video_estudo',
            'video_walkthrough',
            'video_redes_sociais',
            'video_institucional',
            'video_vertical',
            'video_horizontal',
            'teaser',
            'reel',
            'short'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'video_project_status_enum') THEN
        CREATE TYPE video_project_status_enum AS ENUM (
            'rascunho',
            'planejamento',
            'roteiro',
            'storyboard',
            'producao',
            'revisao',
            'aprovado',
            'finalizado',
            'arquivado'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'video_aspect_ratio_enum') THEN
        CREATE TYPE video_aspect_ratio_enum AS ENUM (
            '16:9',
            '9:16',
            '1:1',
            '4:5',
            '21:9'
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS video_projects (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL,
    presentation_id VARCHAR(64),
    environment_id VARCHAR(64),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type video_project_type_enum NOT NULL DEFAULT 'apresentacao_projeto',
    objective TEXT,
    audience VARCHAR(255),
    duration VARCHAR(32) NOT NULL DEFAULT '01:30',
    duration_seconds INTEGER DEFAULT 90,
    aspect_ratio video_aspect_ratio_enum NOT NULL DEFAULT '16:9',
    resolution VARCHAR(32) NOT NULL DEFAULT '1080p',
    status video_project_status_enum NOT NULL DEFAULT 'rascunho',
    revision VARCHAR(16) NOT NULL DEFAULT 'V00',
    version_number INTEGER NOT NULL DEFAULT 0,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by VARCHAR(255),
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by VARCHAR(255) NOT NULL DEFAULT 'Sistema',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS video_scenes (
    id VARCHAR(64) PRIMARY KEY,
    video_project_id VARCHAR(64) NOT NULL,
    scene_number INTEGER NOT NULL DEFAULT 1,
    title VARCHAR(255) NOT NULL,
    environment_name VARCHAR(255),
    environment_id VARCHAR(64),
    narrative_goal TEXT,
    estimated_duration_seconds INTEGER NOT NULL DEFAULT 15,
    sort_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS video_shots (
    id VARCHAR(64) PRIMARY KEY,
    scene_id VARCHAR(64) NOT NULL,
    video_project_id VARCHAR(64) NOT NULL,
    shot_number INTEGER NOT NULL DEFAULT 1,
    camera_movement VARCHAR(64) DEFAULT 'Slow Pan Right',
    transition_type VARCHAR(64) DEFAULT 'Crossfade',
    duration_seconds NUMERIC(5,2) NOT NULL DEFAULT 4.0,
    visual_description TEXT,
    prompt_notes TEXT,
    sort_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS video_assets (
    id VARCHAR(64) PRIMARY KEY,
    video_project_id VARCHAR(64) NOT NULL,
    shot_id VARCHAR(64),
    asset_type VARCHAR(64) NOT NULL,
    asset_title VARCHAR(255) NOT NULL,
    asset_url TEXT,
    source_reference_id VARCHAR(64),
    is_approved_source BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS video_audios (
    id VARCHAR(64) PRIMARY KEY,
    video_project_id VARCHAR(64) NOT NULL,
    track_type VARCHAR(64) NOT NULL DEFAULT 'soundtrack',
    title VARCHAR(255) NOT NULL,
    audio_url TEXT,
    volume_percent INTEGER NOT NULL DEFAULT 80,
    start_seconds NUMERIC(5,2) NOT NULL DEFAULT 0.0,
    duration_seconds NUMERIC(5,2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS video_captions (
    id VARCHAR(64) PRIMARY KEY,
    video_project_id VARCHAR(64) NOT NULL,
    shot_id VARCHAR(64),
    text TEXT NOT NULL,
    start_time_seconds NUMERIC(5,2) NOT NULL DEFAULT 0.0,
    end_time_seconds NUMERIC(5,2) NOT NULL DEFAULT 4.0,
    typography_preset VARCHAR(64) DEFAULT 'ArqVertice_Cinematic',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS video_versions (
    id VARCHAR(64) PRIMARY KEY,
    video_project_id VARCHAR(64) NOT NULL,
    version_code VARCHAR(16) NOT NULL,
    version_number INTEGER NOT NULL,
    status video_project_status_enum NOT NULL,
    snapshot_data JSONB NOT NULL,
    changelog TEXT,
    created_by VARCHAR(255) NOT NULL DEFAULT 'Sistema',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
