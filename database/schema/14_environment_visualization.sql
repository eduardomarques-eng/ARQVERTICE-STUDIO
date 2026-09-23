-- ============================================================================
-- ARQVERTICE STUDIO — SCHEMA 14: WORKSPACE DE VISUALIZAÇÃO DOS AMBIENTES (BLOCO D01)
-- Orquestração visual: Plantas, Perspectivas Revit, Câmeras, Renders e Versões
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. CONFIGURAÇÃO E ESTADO DO WORKSPACE DE VISUALIZAÇÃO DO AMBIENTE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS environment_visualizations (
    id                  VARCHAR(64) PRIMARY KEY,
    project_id          VARCHAR(64) NOT NULL,
    environment_id      VARCHAR(64) NOT NULL UNIQUE,
    current_version     VARCHAR(30) NOT NULL DEFAULT 'V01',
    status              VARCHAR(30) NOT NULL DEFAULT 'NOT_STARTED'
                          CHECK (status IN (
                            'NOT_STARTED', 'PREPARING', 'READY', 
                            'GENERATING', 'IN_REVIEW', 'APPROVED', 'SUPERSEDED'
                          )),
    primary_floorplan_id VARCHAR(64),
    primary_render_url  TEXT,
    is_generating       BOOLEAN NOT NULL DEFAULT false,
    generation_progress INTEGER NOT NULL DEFAULT 0,
    generation_job_id   VARCHAR(64),
    last_generation_at  TIMESTAMPTZ,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_env_vis_proj ON environment_visualizations (project_id);
CREATE INDEX IF NOT EXISTS idx_env_vis_env  ON environment_visualizations (environment_id);

-- ---------------------------------------------------------------------------
-- 2. CÂMERAS HOMOLOGADAS DO AMBIENTE (Prompt D01 Item 4 e 5)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS environment_cameras (
    id                  VARCHAR(64) PRIMARY KEY,
    project_id          VARCHAR(64) NOT NULL,
    environment_id      VARCHAR(64) NOT NULL,
    camera_code         VARCHAR(30) NOT NULL, -- Ex: 'CAM-01', 'CAM-LIVING-DECK'
    name                VARCHAR(150) NOT NULL,
    view_origin         VARCHAR(50) NOT NULL DEFAULT 'REVIT_EXPORT',
    focal_length        VARCHAR(50) NOT NULL DEFAULT '28mm',
    eye_elevation_z     VARCHAR(30) NOT NULL DEFAULT '1.50m',
    target_description  VARCHAR(200),
    revit_view_name     VARCHAR(150),
    is_primary          BOOLEAN NOT NULL DEFAULT false,
    status              VARCHAR(30) NOT NULL DEFAULT 'APPROVED',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_env_cam_env ON environment_cameras (environment_id);

-- ---------------------------------------------------------------------------
-- 3. RENDERS E VERSÕES VISUAIS DO AMBIENTE (Prompt D01 Item 4 e 8)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS environment_renders (
    id                  VARCHAR(64) PRIMARY KEY,
    project_id          VARCHAR(64) NOT NULL,
    environment_id      VARCHAR(64) NOT NULL,
    camera_id           VARCHAR(64),
    version_label       VARCHAR(30) NOT NULL DEFAULT 'V01',
    title               VARCHAR(200) NOT NULL,
    image_url           TEXT NOT NULL,
    render_engine       VARCHAR(50) NOT NULL DEFAULT 'CORONA_OR_3DSMAX',
    approval_status     VARCHAR(30) NOT NULL DEFAULT 'DRAFT'
                          CHECK (approval_status IN ('DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'SUPERSEDED')),
    is_current_approved BOOLEAN NOT NULL DEFAULT false,
    approved_by         VARCHAR(120),
    approved_at         TIMESTAMPTZ,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_env_rnd_env ON environment_renders (environment_id);
CREATE INDEX IF NOT EXISTS idx_env_rnd_ver ON environment_renders (version_label);
