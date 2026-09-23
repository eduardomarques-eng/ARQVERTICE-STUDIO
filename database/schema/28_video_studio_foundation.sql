-- ============================================================================
-- ARQVERTICE STUDIO — DDL: BLOCO G01 — FUNDAÇÃO DO MÓDULO DE PRODUÇÃO AUDIOVISUAL
-- ============================================================================
-- Estrutura canônica de produções audiovisuais, narrativas, cenas, takes,
-- assets, áudio, legendas e versionamento V00/V01/V02.
-- ============================================================================

-- 1. TIPOS ENUMERADOS DO SISTEMA DE VÍDEO (Prompt G01)
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

CREATE TYPE video_aspect_ratio_enum AS ENUM (
    '16:9',
    '9:16',
    '1:1',
    '4:5',
    '21:9'
);

-- 2. TABELA DE PROJETOS DE VÍDEO (VideoProject)
CREATE TABLE IF NOT EXISTS video_projects (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    presentation_id VARCHAR(64) REFERENCES presentations(id) ON DELETE SET NULL,
    environment_id VARCHAR(64) REFERENCES environments(id) ON DELETE SET NULL,
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

-- 3. TABELA DE CENAS (Scenes)
CREATE TABLE IF NOT EXISTS video_scenes (
    id VARCHAR(64) PRIMARY KEY,
    video_project_id VARCHAR(64) NOT NULL REFERENCES video_projects(id) ON DELETE CASCADE,
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

-- 4. TABELA DE PLANOS / TAKES (Shots)
CREATE TABLE IF NOT EXISTS video_shots (
    id VARCHAR(64) PRIMARY KEY,
    scene_id VARCHAR(64) NOT NULL REFERENCES video_scenes(id) ON DELETE CASCADE,
    video_project_id VARCHAR(64) NOT NULL REFERENCES video_projects(id) ON DELETE CASCADE,
    shot_number INTEGER NOT NULL DEFAULT 1,
    camera_movement VARCHAR(64) DEFAULT 'Slow Pan Right',
    transition_type VARCHAR(64) DEFAULT 'Crossfade',
    duration_seconds NUMERIC(5,2) NOT NULL DEFAULT 4.0,
    visual_description TEXT,
    prompt_notes TEXT,
    sort_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. TABELA DE ASSETS DE VÍDEO (Assets)
CREATE TABLE IF NOT EXISTS video_assets (
    id VARCHAR(64) PRIMARY KEY,
    video_project_id VARCHAR(64) NOT NULL REFERENCES video_projects(id) ON DELETE CASCADE,
    shot_id VARCHAR(64) REFERENCES video_shots(id) ON DELETE SET NULL,
    asset_type VARCHAR(64) NOT NULL, -- 'render', 'planta', 'perspectiva', 'foto_obra', 'material'
    asset_title VARCHAR(255) NOT NULL,
    asset_url TEXT,
    source_reference_id VARCHAR(64),
    is_approved_source BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 6. TABELA DE ÁUDIO (Audio)
CREATE TABLE IF NOT EXISTS video_audios (
    id VARCHAR(64) PRIMARY KEY,
    video_project_id VARCHAR(64) NOT NULL REFERENCES video_projects(id) ON DELETE CASCADE,
    track_type VARCHAR(64) NOT NULL DEFAULT 'soundtrack', -- 'soundtrack', 'voiceover', 'ambience', 'foley'
    title VARCHAR(255) NOT NULL,
    audio_url TEXT,
    volume_percent INTEGER NOT NULL DEFAULT 80,
    start_seconds NUMERIC(5,2) NOT NULL DEFAULT 0.0,
    duration_seconds NUMERIC(5,2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 7. TABELA DE LEGENDAS E TEXTOS (Captions)
CREATE TABLE IF NOT EXISTS video_captions (
    id VARCHAR(64) PRIMARY KEY,
    video_project_id VARCHAR(64) NOT NULL REFERENCES video_projects(id) ON DELETE CASCADE,
    shot_id VARCHAR(64) REFERENCES video_shots(id) ON DELETE SET NULL,
    text TEXT NOT NULL,
    start_time_seconds NUMERIC(5,2) NOT NULL DEFAULT 0.0,
    end_time_seconds NUMERIC(5,2) NOT NULL DEFAULT 4.0,
    typography_preset VARCHAR(64) DEFAULT 'ArqVertice_Cinematic',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 8. TABELA DE HISTÓRICO E VERSÕES DE VÍDEO (Versions)
CREATE TABLE IF NOT EXISTS video_versions (
    id VARCHAR(64) PRIMARY KEY,
    video_project_id VARCHAR(64) NOT NULL REFERENCES video_projects(id) ON DELETE CASCADE,
    version_code VARCHAR(16) NOT NULL, -- 'V00', 'V01', 'V02'...
    version_number INTEGER NOT NULL,
    status video_project_status_enum NOT NULL,
    snapshot_data JSONB NOT NULL,
    changelog TEXT,
    created_by VARCHAR(255) NOT NULL DEFAULT 'Sistema',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices de consulta otimizada
CREATE INDEX IF NOT EXISTS idx_video_projects_project ON video_projects(project_id);
CREATE INDEX IF NOT EXISTS idx_video_scenes_project ON video_scenes(video_project_id);
CREATE INDEX IF NOT EXISTS idx_video_shots_scene ON video_shots(scene_id);
CREATE INDEX IF NOT EXISTS idx_video_versions_project ON video_versions(video_project_id);
