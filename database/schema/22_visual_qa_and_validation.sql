-- ============================================================================
-- ARQVERTICE STUDIO — DDL: BLOCO D09 — QA VISUAL E VALIDAÇÃO DAS GERAÇÕES
-- ============================================================================
-- Criação das tabelas de auditoria de qualidade visual, validação de conformidade
-- com locks e diretrizes, classificação PASS / WARNING / REVIEW_REQUIRED,
-- relatórios formais e fluxo de sobreposição humana "APPROVE ANYWAY".
-- ============================================================================

-- 1. STATUS CANÔNICOS DE QA VISUAL (Prompt D09 Itens 4 e 5)
-- PASS, WARNING, REVIEW_REQUIRED
CREATE TYPE visual_qa_status_enum AS ENUM (
    'PASS',
    'WARNING',
    'REVIEW_REQUIRED',
    'APPROVED_WITH_OVERRIDE'
);

-- 2. CATEGORIAS DE CHECAGEM DO QA (Prompt D09 Itens 1, 3 e 6)
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

-- ============================================================================
-- TABELA: visual_qa_reports (Prompt D09 Item 9)
-- ============================================================================
CREATE TABLE IF NOT EXISTS visual_qa_reports (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id VARCHAR(64) NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    version_id VARCHAR(64) NOT NULL REFERENCES visual_versions(id) ON DELETE CASCADE,
    base_version_id VARCHAR(64) REFERENCES visual_versions(id) ON DELETE SET NULL,
    
    -- Classificação Canônica
    overall_status visual_qa_status_enum NOT NULL DEFAULT 'REVIEW_REQUIRED',
    confidence_score NUMERIC(4, 3) NOT NULL DEFAULT 0.850, -- Ex: 0.920 (Nunca declara 100%)
    
    -- Achados e Violações
    lock_violations JSONB NOT NULL DEFAULT '[]'::jsonb, -- Itens com POTENTIAL_LOCK_VIOLATION
    warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
    findings JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Auditoria de Elementos e IA
    elements_checked JSONB NOT NULL DEFAULT '[]'::jsonb,
    ai_artifacts_detected JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Revisão Humana: "APPROVE ANYWAY" (Prompt D09 Itens 7 e 8)
    has_human_review BOOLEAN NOT NULL DEFAULT FALSE,
    reviewed_by VARCHAR(128),
    reviewed_at TIMESTAMPTZ,
    override_reason TEXT,
    
    -- Metadados de Execução e Custo (Prompt D09 Itens 10 e 11)
    analysis_model VARCHAR(64) NOT NULL DEFAULT 'arqvertice-deterministic-qa-v1',
    analysis_provider VARCHAR(64) DEFAULT 'rule-engine',
    cost_usd NUMERIC(8, 5) DEFAULT 0.00000,
    version_content_hash VARCHAR(64) NOT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_visual_qa_version ON visual_qa_reports(version_id);
CREATE INDEX IF NOT EXISTS idx_visual_qa_env_status ON visual_qa_reports(environment_id, overall_status);
CREATE INDEX IF NOT EXISTS idx_visual_qa_hash ON visual_qa_reports(version_content_hash);

-- ============================================================================
-- TABELA: visual_qa_cache (Prompt D09 Item 12 - Performance)
-- ============================================================================
CREATE TABLE IF NOT EXISTS visual_qa_cache (
    cache_key VARCHAR(128) PRIMARY KEY, -- hash da imagem + estado dos locks
    version_id VARCHAR(64) NOT NULL REFERENCES visual_versions(id) ON DELETE CASCADE,
    report_id VARCHAR(64) NOT NULL REFERENCES visual_qa_reports(id) ON DELETE CASCADE,
    overall_status visual_qa_status_enum NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_visual_qa_cache_ver ON visual_qa_cache(version_id);
