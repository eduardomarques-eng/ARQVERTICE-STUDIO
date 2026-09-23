-- ================================================================
-- ARQVERTICE STUDIO — SCHEMA D06: MOTOR DE GERAÇÃO DE RENDERS
-- ================================================================

-- 1. TABELA DE JOBS DE RENDER (RENDER_JOB)
CREATE TABLE IF NOT EXISTS render_jobs (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id VARCHAR(64) NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    camera_id VARCHAR(64) REFERENCES environment_cameras(id) ON DELETE SET NULL,
    
    -- Intenção e versionamento de prompt
    user_intent TEXT NOT NULL,
    context_version VARCHAR(32) NOT NULL DEFAULT 'V01',
    prompt_version VARCHAR(32) NOT NULL DEFAULT 'PV01',
    compiled_prompt JSONB NOT NULL,
    input_assets JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Informações de Provider e Modelo (Nunca esconder qual modelo produziu)
    provider VARCHAR(64) NOT NULL DEFAULT 'mock',
    model VARCHAR(128) NOT NULL DEFAULT 'imagen-3.0-generate-002',
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Status e Ciclo de Vida
    -- QUEUED, GENERATING, SUCCEEDED, FAILED, CANCELLED, REJECTED, APPROVED
    status VARCHAR(32) NOT NULL DEFAULT 'QUEUED',
    progress INTEGER NOT NULL DEFAULT 0,
    
    -- Resultados e Artefatos Gerados (Imutabilidade)
    output JSONB,
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    
    -- Governança de Aprovação Estritamente Humana
    approved_by VARCHAR(128),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- Auditoria e Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices de busca e ordenação
CREATE INDEX IF NOT EXISTS idx_render_jobs_project ON render_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_render_jobs_environment ON render_jobs(environment_id);
CREATE INDEX IF NOT EXISTS idx_render_jobs_camera ON render_jobs(camera_id);
CREATE INDEX IF NOT EXISTS idx_render_jobs_status ON render_jobs(status);
CREATE INDEX IF NOT EXISTS idx_render_jobs_created_at ON render_jobs(created_at DESC);

-- 2. ATUALIZAÇÃO DA TABELA DE RENDERS DEFINITIVOS (ENVIRONMENT_RENDERS)
CREATE TABLE IF NOT EXISTS environment_renders (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id VARCHAR(64) NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    camera_id VARCHAR(64) REFERENCES environment_cameras(id) ON DELETE SET NULL,
    render_job_id VARCHAR(64) REFERENCES render_jobs(id) ON DELETE SET NULL,
    
    version_label VARCHAR(32) NOT NULL DEFAULT 'V01',
    version VARCHAR(32) NOT NULL DEFAULT 'V01',
    view_type VARCHAR(128) NOT NULL DEFAULT 'Perspectiva',
    title VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    
    provider VARCHAR(64) DEFAULT 'gemini',
    model VARCHAR(128) DEFAULT 'imagen-3.0-generate-002',
    render_engine VARCHAR(128) DEFAULT 'Imagen 3 / ArqVértice Engine',
    resolution VARCHAR(64) DEFAULT '4K UHD',
    
    approval_status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    is_current_approved BOOLEAN NOT NULL DEFAULT FALSE,
    approved_by VARCHAR(128),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_environment_renders_env ON environment_renders(environment_id);
CREATE INDEX IF NOT EXISTS idx_environment_renders_status ON environment_renders(status);
CREATE INDEX IF NOT EXISTS idx_environment_renders_approved ON environment_renders(is_current_approved);
