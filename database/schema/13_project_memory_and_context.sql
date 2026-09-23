-- ============================================================================
-- ARQVERTICE STUDIO — SCHEMA 13: MEMÓRIA ESTRUTURADA, DECISÕES E CONTEXTO (BLOCO C06)
-- Hierarquia de 5 níveis, 17 categorias, status, precedência e auditoria
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. TABELA PRINCIPAL DE MEMÓRIAS DO PROJETO
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_memories (
    id                  VARCHAR(64) PRIMARY KEY,
    project_id          VARCHAR(64) NOT NULL,
    environment_id      VARCHAR(64), -- NULL se escopo global do projeto
    element_key         VARCHAR(100), -- Ex: 'sofa', 'painel_tv', 'bancada_ilha'
    image_version_id    VARCHAR(64), -- Ex: 'rnd-v07-sala', opcional
    
    -- Níveis da Hierarquia (Prompt Item 2)
    hierarchy_level     VARCHAR(30) NOT NULL DEFAULT 'PROJETO'
                          CHECK (hierarchy_level IN ('ORGANIZACAO', 'PROJETO', 'AMBIENTE', 'ELEMENTO', 'IMAGEM_VERSAO')),

    -- Categorias de Memória (Prompt Item 3 - 17 categorias)
    category            VARCHAR(50) NOT NULL
                          CHECK (category IN (
                            'FACT', 'DECISION', 'PREFERENCE', 'RESTRICTION', 
                            'REFERENCE', 'STYLE', 'MATERIAL', 'FURNITURE', 
                            'LIGHTING', 'CAMERA', 'LAYOUT', 'GEOMETRY', 
                            'APPROVED_OUTPUT', 'REJECTED_OUTPUT', 'OBSERVATION', 
                            'HYPOTHESIS', 'AI_SUGGESTION'
                          )),

    -- Status de Conhecimento (Prompt Item 4)
    status              VARCHAR(30) NOT NULL DEFAULT 'CURRENT'
                          CHECK (status IN (
                            'CURRENT', 'HISTORICAL', 'SUPERSEDED', 
                            'HYPOTHESIS', 'UNDER_REVIEW', 'OBSOLETE', 'CONFLICT'
                          )),

    -- Origem / Fonte (Prompt Item 5)
    source              VARCHAR(30) NOT NULL DEFAULT 'ARQVERTICE'
                          CHECK (source IN (
                            'CLIENT', 'ARQVERTICE', 'REVIT_EXPORT', 
                            'FILE', 'REFERENCE', 'DECISION', 'AI', 'SYSTEM'
                          )),

    -- Nível de Confiança Qualitativo (Prompt Item 6)
    confidence          VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED'
                          CHECK (confidence IN ('CONFIRMED', 'UNCONFIRMED', 'ESTIMATED', 'SUGGESTED')),

    subject             VARCHAR(200) NOT NULL,
    statement           TEXT NOT NULL,
    reason              TEXT,
    version             INTEGER NOT NULL DEFAULT 1,
    superseded_by_id    VARCHAR(64),
    supersedes_id       VARCHAR(64),

    -- Vínculos de rastreabilidade (Prompt Item 22)
    reference_links     JSONB DEFAULT '{}', 
    -- Ex: {"briefingId": "...", "deliverableId": "...", "studyId": "...", "assetId": "..."}

    is_lock             BOOLEAN NOT NULL DEFAULT false, -- Se deve ser protegido contra alteração por IA
    responsible         VARCHAR(120) NOT NULL DEFAULT 'Equipe ArqVértice',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memories_proj ON project_memories (project_id);
CREATE INDEX IF NOT EXISTS idx_memories_env ON project_memories (environment_id);
CREATE INDEX IF NOT EXISTS idx_memories_cat ON project_memories (category);
CREATE INDEX IF NOT EXISTS idx_memories_stat ON project_memories (status);
CREATE INDEX IF NOT EXISTS idx_memories_elem ON project_memories (element_key);

-- ---------------------------------------------------------------------------
-- 2. AUDITORIA DE MEMÓRIAS (Prompt Item 23)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_memory_audit (
    id                  VARCHAR(64) PRIMARY KEY,
    memory_id           VARCHAR(64) NOT NULL,
    project_id          VARCHAR(64) NOT NULL,
    action_type         VARCHAR(50) NOT NULL, -- 'CREATED', 'UPDATED', 'SUPERSEDED', 'CONFLICT_MARKED', 'CONFLICT_RESOLVED'
    previous_state      JSONB,
    new_state           JSONB NOT NULL,
    changed_by          VARCHAR(120) NOT NULL,
    reason              TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memory_audit_mem ON project_memory_audit (memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_audit_proj ON project_memory_audit (project_id);

-- ---------------------------------------------------------------------------
-- 3. GESTÃO DE CONFLITOS DE MEMÓRIA (Prompt Item 26)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_memory_conflicts (
    id                  VARCHAR(64) PRIMARY KEY,
    project_id          VARCHAR(64) NOT NULL,
    environment_id      VARCHAR(64),
    element_key         VARCHAR(100) NOT NULL,
    memory_ids          JSONB NOT NULL, -- Array com IDs das memórias conflitantes
    description         TEXT NOT NULL,
    status              VARCHAR(30) NOT NULL DEFAULT 'OPEN'
                          CHECK (status IN ('OPEN', 'RESOLVED', 'DISMISSED')),
    resolution_notes    TEXT,
    resolved_memory_id  VARCHAR(64),
    resolved_by         VARCHAR(120),
    resolved_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mem_conflicts_proj ON project_memory_conflicts (project_id);
