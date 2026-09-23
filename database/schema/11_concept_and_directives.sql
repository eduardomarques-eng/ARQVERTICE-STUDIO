-- ============================================================================
-- ARQVERTICE STUDIO — SCHEMA 11: CONCEITO E DIRETRIZES CONSOLIDADAS (BLOCO C04)
-- Governança de Linguagem, Perfis de Estilo, Paleta, Materialidade e Contexto IA
-- ============================================================================

-- 1. CONCEITOS GERAIS DE PROJETO (DESIGN_CONCEPTS)
CREATE TABLE IF NOT EXISTS design_concepts (
    id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    narrative TEXT NOT NULL,
    description TEXT,
    atmosphere TEXT,
    primary_style VARCHAR(50) NOT NULL, -- contemporaneo, moderno, minimalista, japandi, biofilico, etc.
    secondary_style VARCHAR(50),
    keywords TEXT[] DEFAULT '{}',
    objectives TEXT[] DEFAULT '{}',
    priorities TEXT[] DEFAULT '{}',
    restrictions TEXT[] DEFAULT '{}',
    version_number INTEGER NOT NULL DEFAULT 1,
    version_label VARCHAR(20) NOT NULL DEFAULT 'V01',
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'IN_REVIEW', 'APPROVED', 'SUPERSEDED')),
    approved_at TIMESTAMPTZ,
    approved_by VARCHAR(100),
    approval_notes TEXT,
    parent_concept_id VARCHAR(50) REFERENCES design_concepts(id) ON DELETE SET NULL,
    superseded_by VARCHAR(50) REFERENCES design_concepts(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. DIRETRIZES VISUAIS E COMPOSITIVAS (DESIGN_DIRECTIVES)
CREATE TABLE IF NOT EXISTS design_directives (
    id VARCHAR(50) PRIMARY KEY,
    concept_id VARCHAR(50) NOT NULL REFERENCES design_concepts(id) ON DELETE CASCADE,
    shapes_lines TEXT, -- formas retilíneas, curvas orgânicas, planos puros
    proportions TEXT, -- horizontalidade, pé-direito duplo, esbeltez
    visual_language TEXT, -- integração interior-exterior, transparência
    lighting_natural TEXT,
    lighting_general TEXT,
    lighting_indirect TEXT,
    lighting_focal TEXT,
    lighting_scenic TEXT,
    lighting_decorative TEXT,
    lighting_color_temperature VARCHAR(50), -- 2700K, 3000K, etc.
    lighting_notes TEXT,
    furniture_existing TEXT[] DEFAULT '{}',
    furniture_desired TEXT[] DEFAULT '{}',
    furniture_mandatory TEXT[] DEFAULT '{}',
    furniture_optional TEXT[] DEFAULT '{}',
    furniture_prohibited TEXT[] DEFAULT '{}',
    landscape_guidelines TEXT,
    decoration_guidelines TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. ELEMENTOS DESEJADOS × A EVITAR (DESIGN_PREFERENCES)
CREATE TABLE IF NOT EXISTS design_preferences (
    id VARCHAR(50) PRIMARY KEY,
    concept_id VARCHAR(50) NOT NULL REFERENCES design_concepts(id) ON DELETE CASCADE,
    preference_type VARCHAR(20) NOT NULL CHECK (preference_type IN ('DESIRED', 'AVOID')),
    element_name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL, -- MATERIAL, FORMA, ILUMINACAO, COR, MOBILIARIO, OUTRO
    rationale TEXT,
    visual_reference_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. PALETA CROMÁTICA DO PROJETO (DESIGN_PALETTES)
CREATE TABLE IF NOT EXISTS design_palettes (
    id VARCHAR(50) PRIMARY KEY,
    concept_id VARCHAR(50) NOT NULL REFERENCES design_concepts(id) ON DELETE CASCADE,
    color_hex VARCHAR(10) NOT NULL,
    color_code VARCHAR(50), -- ex: Pantone, Suvinil, Coral
    color_name VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('PREDOMINANT', 'ACCENT', 'NEUTRAL', 'CONTRAST')),
    related_material VARCHAR(150),
    visual_reference_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. INTENÇÕES DE MATERIALIDADE DO CONCEITO (DESIGN_MATERIALS)
CREATE TABLE IF NOT EXISTS design_materials (
    id VARCHAR(50) PRIMARY KEY,
    concept_id VARCHAR(50) NOT NULL REFERENCES design_concepts(id) ON DELETE CASCADE,
    surface_type VARCHAR(50) NOT NULL, -- PISO, PAREDE, BANCADA, MARCENARIA, METAL, PEDRA, TECIDO, REVESTIMENTO, FORRO, ESPECIAL
    intended_material VARCHAR(200) NOT NULL,
    finish_texture VARCHAR(100), -- escovado, polido, levigado, natural, ripado
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. DIRETRIZES POR AMBIENTE COM HIERARQUIA (ENVIRONMENT_DESIGN_DIRECTIVES)
CREATE TABLE IF NOT EXISTS environment_design_directives (
    id VARCHAR(50) PRIMARY KEY,
    concept_id VARCHAR(50) NOT NULL REFERENCES design_concepts(id) ON DELETE CASCADE,
    environment_id VARCHAR(50) NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    inherits_project_concept BOOLEAN NOT NULL DEFAULT TRUE,
    atmosphere_override TEXT,
    palette_overrides JSONB DEFAULT '[]',
    material_overrides JSONB DEFAULT '{}',
    lighting_overrides JSONB DEFAULT '{}',
    furniture_overrides JSONB DEFAULT '{}',
    specific_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(concept_id, environment_id)
);

-- Índices de Performance
CREATE INDEX IF NOT EXISTS idx_design_concepts_project ON design_concepts(project_id);
CREATE INDEX IF NOT EXISTS idx_design_concepts_status ON design_concepts(status);
CREATE INDEX IF NOT EXISTS idx_design_directives_concept ON design_directives(concept_id);
CREATE INDEX IF NOT EXISTS idx_design_palettes_concept ON design_palettes(concept_id);
CREATE INDEX IF NOT EXISTS idx_env_design_directives ON environment_design_directives(concept_id, environment_id);
