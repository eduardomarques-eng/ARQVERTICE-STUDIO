-- ================================================================
-- ARQVERTICE STUDIO — MIGRATION 0015: CONSISTÊNCIA VISUAL, MEMÓRIA E LOCKS (D07)
-- ================================================================

CREATE TABLE IF NOT EXISTS environment_visual_locks (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id VARCHAR(64) NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    lock_type VARCHAR(32) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    scope VARCHAR(32) NOT NULL DEFAULT 'ENVIRONMENT',
    source VARCHAR(32) NOT NULL DEFAULT 'USER',
    version VARCHAR(32) NOT NULL DEFAULT 'V01',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_env_lock_type UNIQUE (environment_id, lock_type)
);

CREATE INDEX IF NOT EXISTS idx_env_visual_locks_env ON environment_visual_locks(environment_id);
CREATE INDEX IF NOT EXISTS idx_env_visual_locks_type ON environment_visual_locks(lock_type);

CREATE TABLE IF NOT EXISTS environment_element_locks (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id VARCHAR(64) NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    element_key VARCHAR(64) NOT NULL,
    element_name VARCHAR(128) NOT NULL,
    category VARCHAR(32) NOT NULL,
    statement TEXT NOT NULL,
    approved_in_camera_id VARCHAR(64) REFERENCES environment_cameras(id) ON DELETE SET NULL,
    approved_render_id VARCHAR(64) REFERENCES environment_renders(id) ON DELETE SET NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    source VARCHAR(32) NOT NULL DEFAULT 'APPROVED_DECISION',
    version VARCHAR(32) NOT NULL DEFAULT 'V01',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_env_element_lock UNIQUE (environment_id, element_key)
);

CREATE INDEX IF NOT EXISTS idx_env_elem_locks_env ON environment_element_locks(environment_id);
CREATE INDEX IF NOT EXISTS idx_env_elem_locks_key ON environment_element_locks(element_key);

CREATE TABLE IF NOT EXISTS visual_change_audits (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id VARCHAR(64) NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    render_job_id VARCHAR(64) REFERENCES render_jobs(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL DEFAULT 'VERIFIED',
    target_elements JSONB NOT NULL DEFAULT '[]'::jsonb,
    preserved_elements JSONB NOT NULL DEFAULT '[]'::jsonb,
    detected_drifts JSONB NOT NULL DEFAULT '[]'::jsonb,
    confidence_score NUMERIC(4, 2) DEFAULT 0.95,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_change_audits_env ON visual_change_audits(environment_id);
CREATE INDEX IF NOT EXISTS idx_change_audits_status ON visual_change_audits(status);
