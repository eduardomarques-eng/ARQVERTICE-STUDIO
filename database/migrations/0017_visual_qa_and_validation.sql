-- ============================================================================
-- ARQVERTICE STUDIO — MIGRAÇÃO 0017: BLOCO D09
-- ============================================================================
-- Criação das estruturas de QA visual, relatórios de auditoria, lock checks,
-- cache de performance e fluxo de revisão humana "APPROVE ANYWAY".
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visual_qa_status_enum') THEN
        CREATE TYPE visual_qa_status_enum AS ENUM (
            'PASS',
            'WARNING',
            'REVIEW_REQUIRED',
            'APPROVED_WITH_OVERRIDE'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visual_qa_check_category_enum') THEN
        CREATE TYPE visual_qa_check_category_enum AS ENUM (
            'GEOMETRY',
            'LAYOUT',
            'OPENINGS',
            'CAMERA',
            'MATERIALS',
            'LIGHTING',
            'FURNITURE',
            'OBJECTS',
            'AI_ARTIFACTS',
            'CROSS_VERSION_CONSISTENCY'
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS visual_qa_reports (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL,
    environment_id VARCHAR(64) NOT NULL,
    version_id VARCHAR(64) NOT NULL,
    base_version_id VARCHAR(64),
    
    overall_status visual_qa_status_enum NOT NULL DEFAULT 'REVIEW_REQUIRED',
    confidence_score NUMERIC(4, 3) NOT NULL DEFAULT 0.850,
    
    lock_violations JSONB NOT NULL DEFAULT '[]'::jsonb,
    warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
    findings JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    elements_checked JSONB NOT NULL DEFAULT '[]'::jsonb,
    ai_artifacts_detected JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    has_human_review BOOLEAN NOT NULL DEFAULT FALSE,
    reviewed_by VARCHAR(128),
    reviewed_at TIMESTAMPTZ,
    override_reason TEXT,
    
    analysis_model VARCHAR(64) NOT NULL DEFAULT 'arqvertice-deterministic-qa-v1',
    analysis_provider VARCHAR(64) DEFAULT 'rule-engine',
    cost_usd NUMERIC(8, 5) DEFAULT 0.00000,
    version_content_hash VARCHAR(64) NOT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visual_qa_cache (
    cache_key VARCHAR(128) PRIMARY KEY,
    version_id VARCHAR(64) NOT NULL,
    report_id VARCHAR(64) NOT NULL,
    overall_status visual_qa_status_enum NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed de relatório de QA para a versão V01 do Living
INSERT INTO visual_qa_reports (
    id, project_id, environment_id, version_id, overall_status, confidence_score,
    lock_violations, warnings, findings, elements_checked, ai_artifacts_detected,
    has_human_review, reviewed_by, reviewed_at, override_reason,
    analysis_model, analysis_provider, cost_usd, version_content_hash,
    created_at, updated_at
) VALUES (
    'qa-rep-sala-01',
    'prj-praia-01',
    'amb-sala-01',
    'ver-rnd-sala-01',
    'PASS',
    0.965,
    '[]'::jsonb,
    '[]'::jsonb,
    '[{"check": "CAMERA_LOCK", "status": "PASS", "description": "Enquadramento 35mm compatível com C01"}, {"check": "GEOMETRY_LOCK", "status": "PASS", "description": "Vão de 6m e alvenarias preservadas"}]'::jsonb,
    '["SOFA", "PAINEL_TV", "PISO_LIVING"]'::jsonb,
    '[]'::jsonb,
    TRUE,
    'Eduardo Marques (Arquiteto Titular)',
    '2026-09-21T15:30:00Z',
    'Validação presencial de iluminação solar e integração com o deck.',
    'arqvertice-hybrid-qa-v1',
    'rule-engine',
    0.00000,
    'hash-ver-rnd-sala-01-v01',
    '2026-09-21T15:29:00Z',
    '2026-09-21T15:30:00Z'
) ON CONFLICT (id) DO NOTHING;
