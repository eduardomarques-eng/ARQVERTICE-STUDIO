-- ============================================================================
-- ARQVERTICE STUDIO — DDL: BLOCO E02 — SISTEMA DE MATERIAIS, REVESTIMENTOS
-- E ESPECIFICAÇÕES
-- ============================================================================
-- Estrutura canônica de organização de materiais, acabamentos, superfícies,
-- separação estrita entre conceito e produto específico, cadastro de fabricantes,
-- fornecedores com regionalidade, dimensões de revestimento e versionamento.
-- ============================================================================

-- 1. CATEGORIAS CANÔNICAS DE MATERIAL (Prompt E02 Item 1)
CREATE TYPE material_category_enum AS ENUM (
    'PISO',
    'PAREDE',
    'REVESTIMENTO',
    'TETO_FORRO',
    'PEDRA',
    'MADEIRA',
    'MARCENARIA',
    'PINTURA',
    'TECIDO',
    'TAPETE',
    'METAL',
    'VIDRO',
    'LOUCA',
    'METAIS_SANITARIOS',
    'BANCADA',
    'RODAPE',
    'DECK',
    'EXTERNO',
    'PAISAGISMO',
    'ILUMINACAO',
    'OUTRO'
);

-- 2. ORIGENS DOS DADOS (Prompt E02 Item 8)
CREATE TYPE material_origin_enum AS ENUM (
    'CLIENTE',
    'ARQVERTICE',
    'CATALOGO',
    'FORNECEDOR',
    'REVIT',
    'RENDER',
    'REFERENCIA',
    'IA',
    'MANUAL'
);

-- 3. STATUS DE APROVAÇÃO (Prompt E02 Item 9)
CREATE TYPE material_status_enum AS ENUM (
    'DRAFT',
    'SUGGESTED',
    'IN_REVIEW',
    'APPROVED',
    'REJECTED',
    'SUPERSEDED'
);

-- 4. UNIDADES DE MEDIDA (Prompt E02 Item 13)
CREATE TYPE material_unit_enum AS ENUM (
    'UN',
    'M',
    'M2',
    'M3',
    'KG',
    'L',
    'KIT',
    'OUTRA'
);

-- 5. APLICAÇÕES DE MATERIAL (Prompt E02 Item 12)
CREATE TYPE material_application_enum AS ENUM (
    'PISO',
    'PAREDE',
    'PAINEL',
    'BANCADA',
    'FORRO',
    'MARCENARIA',
    'ELEMENTO_EXTERNO',
    'RODAPE',
    'DECK',
    'TETO',
    'OUTRA'
);

-- 6. ESCOPO DE CONSISTÊNCIA (Prompt E02 Item 22)
CREATE TYPE material_scope_enum AS ENUM (
    'ENVIRONMENT_SPECIFIC',
    'PROJECT_GUIDELINE',
    'REPLICABLE'
);

-- ============================================================================
-- TABELA: catalog_manufacturers (Prompt E02 Itens 4 e 6)
-- Cadastro de Fabricantes / Indústrias (ex: Biancogres, Portobello, Eliane)
-- ============================================================================
CREATE TABLE IF NOT EXISTS catalog_manufacturers (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    website TEXT,
    country VARCHAR(64) DEFAULT 'Brasil',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABELA: catalog_suppliers (Prompt E02 Itens 5 e 21)
-- Lojas, revendedores e parceiros comerciais com regionalidade
-- ============================================================================
CREATE TABLE IF NOT EXISTS catalog_suppliers (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(128) NOT NULL,
    state VARCHAR(32) NOT NULL,
    region VARCHAR(64),          -- Ex: 'Nordeste', 'Litoral Sul', 'Região Metropolitana'
    contact_person VARCHAR(128),
    contact_phone VARCHAR(64),
    contact_email VARCHAR(128),
    website TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABELA: catalog_products (Prompt E02 Itens 3, 4, 14, 18, 19 e 20)
-- Produto Comercial Específico (Separado do conceito abstrato do material)
-- ============================================================================
CREATE TABLE IF NOT EXISTS catalog_products (
    id VARCHAR(64) PRIMARY KEY,
    manufacturer_id VARCHAR(64) REFERENCES catalog_manufacturers(id) ON DELETE SET NULL,
    supplier_id VARCHAR(64) REFERENCES catalog_suppliers(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    collection VARCHAR(128),
    sku_code VARCHAR(128),
    finish VARCHAR(128),          -- Polido, Acetinado, Natural, Rústico, etc.
    
    -- Dimensões do produto (Prompt E02 Item 14)
    width NUMERIC(10, 2),         -- cm ou mm
    length NUMERIC(10, 2),        -- cm ou mm
    thickness NUMERIC(10, 2),     -- mm
    dimension_unit VARCHAR(16) DEFAULT 'CM',
    sales_unit material_unit_enum NOT NULL DEFAULT 'M2',
    
    -- Preço e consulta (Prompt E02 Itens 19 e 20)
    price NUMERIC(12, 2),
    currency VARCHAR(8) DEFAULT 'BRL',
    consulted_at TIMESTAMPTZ,
    price_origin VARCHAR(128),
    
    product_url TEXT,
    image_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABELA: project_materials (Prompt E02 Itens 0, 2, 7, 10, 11, 15, 16, 22 e 23)
-- Cadastro central de materiais e revestimentos por ambiente/projeto
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_materials (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id VARCHAR(64) REFERENCES environments(id) ON DELETE CASCADE,
    category material_category_enum NOT NULL DEFAULT 'REVESTIMENTO',
    name VARCHAR(255) NOT NULL,
    description TEXT,
    application material_application_enum NOT NULL DEFAULT 'PISO',
    
    -- Características Físicas e Visuais
    color VARCHAR(128),
    finish VARCHAR(128),
    texture VARCHAR(128),
    
    -- Quantitativo
    quantity_value NUMERIC(10, 2),
    quantity_unit material_unit_enum NOT NULL DEFAULT 'M2',
    
    -- Separação Conceito vs Produto (Prompt E02 Item 3)
    is_conceptual BOOLEAN NOT NULL DEFAULT TRUE,
    product_id VARCHAR(64) REFERENCES catalog_products(id) ON DELETE SET NULL,
    
    -- Imagens Estruturadas (Prompt E02 Item 7)
    image_url TEXT,               -- Imagem principal
    texture_url TEXT,             -- Textura para render / normal map
    product_photo_url TEXT,       -- Foto de estúdio do produto
    applied_reference_url TEXT,   -- Foto de referência aplicada em obra/ambiente
    contextual_image_url TEXT,    -- Imagem contextual
    
    -- Referência e Observações (Prompt E02 Item 15)
    reference_text TEXT,
    notes TEXT,
    
    -- Ciclo de Vida, Origem e Rejeição
    status material_status_enum NOT NULL DEFAULT 'DRAFT',
    origin material_origin_enum NOT NULL DEFAULT 'ARQVERTICE',
    rejection_reason TEXT,
    scope material_scope_enum NOT NULL DEFAULT 'ENVIRONMENT_SPECIFIC',
    
    -- Identificação por IA e Anti-Alucinação (Prompt E02 Itens 16 e 17)
    is_ai_suggestion BOOLEAN NOT NULL DEFAULT FALSE,
    ai_confidence NUMERIC(4, 3),
    ai_label VARCHAR(255),        -- Ex: 'SUGESTÃO', 'REFERÊNCIA VISUAL' ou 'NÃO IDENTIFICADO'
    ai_detection_metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Versionamento (Prompt E02 Item 25)
    version_code VARCHAR(16) NOT NULL DEFAULT 'V01',
    version_sequence INTEGER NOT NULL DEFAULT 1,
    parent_material_id VARCHAR(64) REFERENCES project_materials(id) ON DELETE SET NULL,
    
    created_by VARCHAR(128) NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABELA: project_material_history (Prompt E02 Itens 9, 11 e 25)
-- Histórico e rastreabilidade de aprovações, revisões e restrições
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_material_history (
    id VARCHAR(64) PRIMARY KEY,
    material_id VARCHAR(64) NOT NULL REFERENCES project_materials(id) ON DELETE CASCADE,
    action VARCHAR(64) NOT NULL, -- 'CREATED', 'UPDATED', 'APPROVED', 'REJECTED', 'SUPERSEDED', 'VERSIONED', 'LINKED_PRODUCT'
    from_status material_status_enum,
    to_status material_status_enum,
    from_version VARCHAR(16),
    to_version VARCHAR(16),
    changed_fields JSONB DEFAULT '[]'::jsonb,
    change_summary TEXT,
    rejection_reason TEXT,
    changed_by VARCHAR(128) NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de Performance e Consulta
CREATE INDEX IF NOT EXISTS idx_materials_proj_env ON project_materials(project_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_materials_category ON project_materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_status ON project_materials(status);
CREATE INDEX IF NOT EXISTS idx_materials_application ON project_materials(application);
CREATE INDEX IF NOT EXISTS idx_materials_product ON project_materials(product_id);
CREATE INDEX IF NOT EXISTS idx_catalog_prod_mfr ON catalog_products(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_catalog_prod_sup ON catalog_products(supplier_id);
