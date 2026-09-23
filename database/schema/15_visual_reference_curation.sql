-- ============================================================================
-- ARQVERTICE STUDIO — SCHEMA 15: PREPARAÇÃO E CURADORIA DAS REFERÊNCIAS VISUAIS
-- BLOCO D02: Categorização em 8 tipos, 4 prioridades, anotações de escopo,
-- conjuntos de referência (VISUAL_REFERENCE_SET) e preservação não destrutiva.
-- ============================================================================

-- 1. Conjuntos de Referência Visual do Ambiente (VISUAL_REFERENCE_SET)
CREATE TABLE IF NOT EXISTS visual_reference_sets (
    id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id VARCHAR(50) NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(20) NOT NULL DEFAULT 'V01',
    objective TEXT,
    priority VARCHAR(20) NOT NULL DEFAULT 'PRIMARY' CHECK (priority IN ('PRIMARY', 'SECONDARY', 'OPTIONAL', 'REJECTED')),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vref_sets_env ON visual_reference_sets(environment_id);
CREATE INDEX IF NOT EXISTS idx_vref_sets_proj ON visual_reference_sets(project_id);

-- 2. Itens Curados do Conjunto de Referência (com os 8 tipos canônicos)
CREATE TABLE IF NOT EXISTS visual_reference_items (
    id VARCHAR(50) PRIMARY KEY,
    set_id VARCHAR(50) REFERENCES visual_reference_sets(id) ON DELETE SET NULL,
    project_id VARCHAR(50) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id VARCHAR(50) NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    asset_id VARCHAR(50), -- Chave estrangeira conceitual para survey_assets sem exclusão em cascata do arquivo físico
    title VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    
    -- 8 Tipos Canônicos de Referência do Bloco D02
    reference_type VARCHAR(30) NOT NULL CHECK (
        reference_type IN (
            'GEOMETRY_REFERENCE',
            'CAMERA_REFERENCE',
            'STYLE_REFERENCE',
            'MATERIAL_REFERENCE',
            'FURNITURE_REFERENCE',
            'LIGHTING_REFERENCE',
            'COMPOSITION_REFERENCE',
            'AESTHETIC_REFERENCE'
        )
    ),
    
    -- 4 Níveis de Prioridade do Bloco D02
    priority VARCHAR(20) NOT NULL DEFAULT 'SECONDARY' CHECK (
        priority IN ('PRIMARY', 'SECONDARY', 'OPTIONAL', 'REJECTED')
    ),
    
    -- Anotações de Escopo de Uso (Ex: "Use somente material.", "Não reproduzir mobiliário.")
    scope_notes TEXT,
    
    -- Exclusão da Geração (NÃO DESTRUTIVA: Preserva o arquivo original)
    is_excluded_from_generation BOOLEAN NOT NULL DEFAULT FALSE,
    exclusion_reason TEXT,
    
    -- Ordenação dentro do conjunto
    sort_order INTEGER NOT NULL DEFAULT 0,
    
    -- Metadados Específicos para CAMERA_REFERENCE
    camera_direction VARCHAR(100),
    camera_framing VARCHAR(100),
    camera_origin VARCHAR(100) DEFAULT 'REVIT',
    camera_description TEXT,
    
    -- Preparação para Sugestões de IA (mantendo controle humano final)
    ai_suggested_category VARCHAR(30),
    ai_confidence NUMERIC(3, 2),
    is_category_overridden BOOLEAN DEFAULT FALSE,
    category_override_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vref_items_set ON visual_reference_items(set_id);
CREATE INDEX IF NOT EXISTS idx_vref_items_env ON visual_reference_items(environment_id);
CREATE INDEX IF NOT EXISTS idx_vref_items_type ON visual_reference_items(reference_type);
CREATE INDEX IF NOT EXISTS idx_vref_items_priority ON visual_reference_items(priority);

-- 3. Log de Auditoria de Integridade e Reclassificação (Item 12 do Prompt)
CREATE TABLE IF NOT EXISTS visual_reference_audit (
    id VARCHAR(50) PRIMARY KEY,
    item_id VARCHAR(50) NOT NULL REFERENCES visual_reference_items(id) ON DELETE CASCADE,
    environment_id VARCHAR(50) NOT NULL,
    action_type VARCHAR(50) NOT NULL CHECK (
        action_type IN ('TYPE_CHANGE', 'PRIORITY_CHANGE', 'EXCLUSION_CHANGE', 'SCOPE_NOTE_CHANGE', 'PRIMARY_SET')
    ),
    previous_value TEXT,
    new_value TEXT,
    changed_by VARCHAR(150) NOT NULL DEFAULT 'Arquiteto',
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vref_audit_item ON visual_reference_audit(item_id);
