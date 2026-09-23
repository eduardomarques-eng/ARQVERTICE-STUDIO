-- ============================================================================
-- ARQVERTICE STUDIO — SCHEMA 16: MOTOR DE PLANTA HUMANIZADA (D03)
-- ============================================================================
-- Estruturas para geração de plantas humanizadas derivadas do modelo técnico,
-- preservação de fonte geométrica, versionamento, registro de IA e comparação.

-- 1. Tabela Principal de Planta Humanizada (por ambiente)
CREATE TABLE IF NOT EXISTS humanized_plans (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id VARCHAR(64) NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    source_asset_id VARCHAR(64), -- ID da planta técnica original (Revit)
    source_plan_version VARCHAR(32) NOT NULL DEFAULT 'V01',
    current_version_id VARCHAR(64), -- Ponteiro para a versão ativa/aprovada
    scale_nominal VARCHAR(32) DEFAULT '1:50', -- Escala original do desenho
    dimensions_m VARCHAR(64) DEFAULT '12.40m x 7.80m', -- Dimensões reais do ambiente
    unit VARCHAR(16) DEFAULT 'METERS', -- Unidade métrica
    dpi INTEGER DEFAULT 300, -- Resolução gráfica de apresentação
    orientation VARCHAR(64) DEFAULT 'Norte Verdadeiro',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_humanized_plan_env UNIQUE (project_id, environment_id)
);

-- 2. Versões da Planta Humanizada
CREATE TABLE IF NOT EXISTS humanized_plan_versions (
    id VARCHAR(64) PRIMARY KEY,
    plan_id VARCHAR(64) NOT NULL REFERENCES humanized_plans(id) ON DELETE CASCADE,
    version_tag VARCHAR(32) NOT NULL, -- Ex: 'V01', 'V02', 'V03-VAR'
    source_plan_version VARCHAR(32) NOT NULL DEFAULT 'V01', -- Vínculo com a fonte geométrica
    mode VARCHAR(32) NOT NULL DEFAULT 'MODE_A_TRANSFORMATION', -- MODE_A_TRANSFORMATION ou MODE_B_HYBRID_COMPOSITION
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT', -- DRAFT, IN_REVIEW, APPROVED, REJECTED, SUPERSEDED
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    visual_style VARCHAR(128) DEFAULT 'Contemporâneo Minimalista',
    materials_summary TEXT, -- Resumo de pisos e acabamentos aplicados
    furniture_layout TEXT, -- Resumo da disposição de mobiliário
    lighting_mode VARCHAR(64) DEFAULT 'Natural Difusa + Sombras Suaves',
    people_included BOOLEAN DEFAULT FALSE,
    prompt_used TEXT,
    parent_version_id VARCHAR(64) REFERENCES humanized_plan_versions(id) ON DELETE SET NULL,
    localized_instruction TEXT, -- Ex: "Mude somente o piso.", "Altere somente o sofá."
    approval_notes TEXT,
    rejection_reason TEXT,
    approved_by VARCHAR(128),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Log de Execuções e Auditoria de IA
CREATE TABLE IF NOT EXISTS humanized_plan_generations (
    id VARCHAR(64) PRIMARY KEY,
    version_id VARCHAR(64) NOT NULL REFERENCES humanized_plan_versions(id) ON DELETE CASCADE,
    provider VARCHAR(64) NOT NULL DEFAULT 'STUDIO_SYNTHESIS_ENGINE',
    model VARCHAR(64) NOT NULL DEFAULT 'arqvertice-diffusion-arch-v2',
    prompt TEXT NOT NULL,
    parameters JSONB, -- sampling_steps, cfg_scale, line_preservation_weight, etc.
    context_version VARCHAR(32) DEFAULT 'C06_V01',
    status VARCHAR(32) NOT NULL DEFAULT 'SUCCESS', -- SUCCESS, FAILED, RETRYING
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    duration_ms INTEGER DEFAULT 1850,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_humanized_plans_env ON humanized_plans(environment_id);
CREATE INDEX IF NOT EXISTS idx_humanized_plan_versions_plan ON humanized_plan_versions(plan_id);
CREATE INDEX IF NOT EXISTS idx_humanized_plan_generations_ver ON humanized_plan_generations(version_id);
