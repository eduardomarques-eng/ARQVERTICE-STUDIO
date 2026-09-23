-- ============================================================================
-- ARQVERTICE STUDIO — SCHEMA 12: WORKSPACE DE DESENVOLVIMENTO DO PROJETO (BLOCO C05)
-- Governança de Entregáveis, Integração Revit, Marcos, Versões e Decisões
-- ============================================================================

-- 1. ENTREGÁVEIS DO PROJETO (PROJECT_DELIVERABLES)
CREATE TABLE IF NOT EXISTS project_deliverables (
    id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id VARCHAR(50) REFERENCES environments(id) ON DELETE SET NULL,
    discipline VARCHAR(50) NOT NULL CHECK (discipline IN (
        'ARQUITETURA', 'INTERIORES', 'PAISAGISMO', 'ILUMINACAO',
        'MARCENARIA', 'VISUALIZACAO', 'APRESENTACAO', 'OUTRA'
    )),
    title VARCHAR(255) NOT NULL,
    deliverable_type VARCHAR(50) NOT NULL, -- Planta baixa, Layout, Corte, Elevação, Fachada, Perspectivas, Renders, Moodboard, Memorial, Pranchas
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'SUPERSEDED')),
    file_classification VARCHAR(30) NOT NULL DEFAULT 'WORKING' CHECK (file_classification IN ('WORKING', 'REFERENCE', 'APPROVED', 'FINAL', 'ARCHIVED')),
    responsible VARCHAR(100) NOT NULL,
    due_date DATE,
    version VARCHAR(20) NOT NULL DEFAULT 'V01',
    file_url TEXT,
    file_name VARCHAR(255),
    file_format VARCHAR(20),
    file_size_bytes BIGINT,
    
    -- Metadados de Integração com Autodesk Revit (Prompt C05 Item 6)
    origin VARCHAR(30) DEFAULT 'MANUAL', -- 'REVIT', 'AUTOCAD', 'MANUAL', 'EXTERNAL'
    revit_view_name VARCHAR(255),
    revit_level VARCHAR(100),
    revit_environment VARCHAR(100),
    revit_version VARCHAR(50),
    revit_export_date TIMESTAMPTZ,
    revit_notes TEXT,
    
    -- Aprovação e Revisão
    approved_at TIMESTAMPTZ,
    approved_by VARCHAR(100),
    approval_notes TEXT,
    rejection_reason TEXT,
    parent_deliverable_id VARCHAR(50) REFERENCES project_deliverables(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. MARCOS DO PROJETO (PROJECT_MILESTONES)
CREATE TABLE IF NOT EXISTS project_milestones (
    id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    milestone_key VARCHAR(50) NOT NULL, -- BRIEFING_APROVADO, LEVANTAMENTO_CONCLUIDO, ESTUDOS_CONCLUIDOS, CONCEITO_APROVADO, PROJETO_EM_DESENVOLVIMENTO, PROJETO_CONSOLIDADO, VISUALIZACAO_CONCLUIDA, APRESENTACAO_APROVADA, ENTREGA
    label VARCHAR(255) NOT NULL,
    order_index INTEGER NOT NULL,
    is_achieved BOOLEAN NOT NULL DEFAULT FALSE,
    achieved_at TIMESTAMPTZ,
    achieved_by VARCHAR(100),
    target_date DATE,
    criteria_rule TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, milestone_key)
);

-- 3. HISTÓRICO DE REVISÕES DO PROJETO (PROJECT_REVISIONS)
CREATE TABLE IF NOT EXISTS project_revisions (
    id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id VARCHAR(50) REFERENCES environments(id) ON DELETE SET NULL,
    deliverable_id VARCHAR(50) REFERENCES project_deliverables(id) ON DELETE SET NULL,
    revision_code VARCHAR(20) NOT NULL, -- R01, R02...
    description TEXT NOT NULL,
    decision_link_id VARCHAR(100),
    responsible VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'DISCARDED')),
    impact_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. VERSÕES / SNAPSHOTS DO PROJETO (PROJECT_SNAPSHOTS)
CREATE TABLE IF NOT EXISTS project_snapshots (
    id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    snapshot_label VARCHAR(30) NOT NULL, -- PROJECT_V01, PROJECT_V02...
    description TEXT,
    global_status VARCHAR(50) NOT NULL,
    frozen_context JSONB NOT NULL, -- Guarda dados congelados: briefing vigente, conceito vigente, estudos aprovados, referências aprovadas, decisões vigentes, entregáveis
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. CHECKLIST DE GRANDES ETAPAS (PROJECT_CHECKLISTS)
CREATE TABLE IF NOT EXISTS project_checklists (
    id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    stage_key VARCHAR(50) NOT NULL, -- briefing, levantamento, estudos, conceito, desenvolvimento, visualizacao, apresentacao, revisao, entrega
    label VARCHAR(100) NOT NULL,
    order_index INTEGER NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    completed_by VARCHAR(100),
    weight_percentage NUMERIC(5, 2) DEFAULT 10.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, stage_key)
);

-- ÍNDICES DE ALTA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_project_deliverables_proj ON project_deliverables(project_id);
CREATE INDEX IF NOT EXISTS idx_project_deliverables_disc ON project_deliverables(discipline);
CREATE INDEX IF NOT EXISTS idx_project_deliverables_revit ON project_deliverables(origin);
CREATE INDEX IF NOT EXISTS idx_project_milestones_proj ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_snapshots_proj ON project_snapshots(project_id);
CREATE INDEX IF NOT EXISTS idx_project_revisions_proj ON project_revisions(project_id);
