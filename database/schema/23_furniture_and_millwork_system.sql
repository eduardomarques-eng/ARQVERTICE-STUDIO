-- ============================================================================
-- ARQVERTICE STUDIO — DDL: BLOCO E01 — SISTEMA DE MÓVEIS, MARCENARIA,
-- EQUIPAMENTOS E DECORAÇÃO
-- ============================================================================
-- Estrutura canônica de identificação, cadastro, organização hierárquica por
-- ambiente, agrupamentos (conjuntos), especificações técnicas, controle de
-- marcenaria sob medida, identificação assistida por IA e versionamento V01/V02.
-- ============================================================================

-- 1. CATEGORIAS CANÔNICAS (Prompt E01 Item 3)
CREATE TYPE furniture_category_enum AS ENUM (
    'MOVEL_SOLTO',
    'MARCENARIA',
    'EQUIPAMENTO',
    'ILUMINACAO',
    'DECORACAO',
    'TAPETE',
    'CORTINA_PERSIANA',
    'ARTE',
    'ACESSORIO',
    'LOUCA',
    'METAIS',
    'ELETRODOMESTICO',
    'OUTRO'
);

-- 2. ORIGENS DOS DADOS (Prompt E01 Item 2)
CREATE TYPE furniture_origin_enum AS ENUM (
    'CLIENTE',
    'ARQVERTICE',
    'REVIT',
    'REFERENCIA',
    'RENDER',
    'IMAGEM',
    'CATALOGO',
    'FORNECEDOR',
    'IA',
    'MANUAL'
);

-- 3. TIPOLOGIA DE ITEM (Prompt E01 Itens 5, 6 e 7)
CREATE TYPE furniture_item_type_enum AS ENUM (
    'EXISTING',        -- Mobiliário existente do cliente
    'NEW',             -- Mobiliário novo a especificar/adquirir
    'CUSTOM_MILLWORK'  -- Sob medida / Marcenaria técnica desenhada
);

-- 4. OBRIGATORIEDADE (Prompt E01 Itens 8 e 9)
CREATE TYPE furniture_requirement_enum AS ENUM (
    'REQUIRED',  -- Item obrigatório no ambiente
    'OPTIONAL'   -- Item opcional / complementar
);

-- 5. STATUS DE APROVAÇÃO (Prompt E01 Itens 10 e 18)
CREATE TYPE furniture_status_enum AS ENUM (
    'DRAFT',
    'SUGGESTED',
    'IN_REVIEW',
    'APPROVED',
    'REJECTED',
    'SUPERSEDED'
);

-- 6. UNIDADES DE QUANTIDADE (Prompt E01 Item 15)
CREATE TYPE furniture_unit_enum AS ENUM (
    'UN',
    'PAR',
    'CONJUNTO',
    'M',
    'M2',
    'M3',
    'OUTRA'
);

-- 7. UNIDADES DE MEDIDA (Prompt E01 Item 16)
CREATE TYPE dimension_unit_enum AS ENUM (
    'CM',
    'M',
    'MM'
);

-- ============================================================================
-- TABELA: project_furniture_groups (Prompt E01 Item 13)
-- Conjuntos lógicos de móveis (ex: Conjunto de Jantar = Mesa + 6 Cadeiras)
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_furniture_groups (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id VARCHAR(64) NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABELA: project_furniture_items (Prompt E01 Itens 0 a 25)
-- Cadastro central de móveis, marcenaria e equipamentos por ambiente
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_furniture_items (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id VARCHAR(64) NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    category furniture_category_enum NOT NULL DEFAULT 'MOVEL_SOLTO',
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Tipologia e Obrigatoriedade
    item_type furniture_item_type_enum NOT NULL DEFAULT 'NEW',
    requirement_type furniture_requirement_enum NOT NULL DEFAULT 'REQUIRED',
    
    -- Quantidade Estruturada (Prompt E01 Item 14)
    quantity_value NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    quantity_unit furniture_unit_enum NOT NULL DEFAULT 'UN',
    quantity_origin furniture_origin_enum NOT NULL DEFAULT 'ARQVERTICE',
    
    -- Medidas Técnicas Rigorosas (Prompt E01 Item 16)
    width NUMERIC(10, 2),        -- L (Largura)
    depth NUMERIC(10, 2),        -- P (Profundidade)
    height NUMERIC(10, 2),       -- A (Altura)
    dimension_unit dimension_unit_enum NOT NULL DEFAULT 'CM',
    
    -- Especificação de Materiais e Acabamento
    material VARCHAR(255),
    finish VARCHAR(255),
    color VARCHAR(128),
    
    -- Ciclo de Vida e Origem
    status furniture_status_enum NOT NULL DEFAULT 'DRAFT',
    origin furniture_origin_enum NOT NULL DEFAULT 'ARQVERTICE',
    rejection_reason TEXT,       -- Preenchido obrigatoriamente quando status = 'REJECTED'
    
    -- Referências Visuais e Anotações (Prompt E01 Itens 1 e 17)
    reference_text TEXT,
    image_url TEXT,
    notes TEXT,
    
    -- Agrupamento (Prompt E01 Item 13)
    group_id VARCHAR(64) REFERENCES project_furniture_groups(id) ON DELETE SET NULL,
    group_name VARCHAR(255),
    
    -- Marcenaria Sob Medida (Prompt E01 Item 22)
    is_custom_millwork BOOLEAN NOT NULL DEFAULT FALSE,
    technical_drawing_ref VARCHAR(255),
    associated_file_url TEXT,
    millwork_notes TEXT,
    
    -- Identificação por IA e Anti-Alucinação (Prompt E01 Itens 1, 11 e 12)
    is_ai_suggestion BOOLEAN NOT NULL DEFAULT FALSE,
    ai_confidence NUMERIC(4, 3),
    ai_label VARCHAR(255),       -- Ex: 'SUGESTÃO', 'REFERÊNCIA VISUAL' ou 'NÃO IDENTIFICADO'
    ai_detection_metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Versionamento Não Destrutivo (Prompt E01 Item 19)
    version_code VARCHAR(16) NOT NULL DEFAULT 'V01', -- Ex: V01, V02, V03
    version_sequence INTEGER NOT NULL DEFAULT 1,
    parent_item_id VARCHAR(64) REFERENCES project_furniture_items(id) ON DELETE SET NULL,
    
    -- Campos Comerciais Opcionais (Prompt E01 Item 4)
    manufacturer VARCHAR(255),
    supplier VARCHAR(255),
    model VARCHAR(255),
    code VARCHAR(128),
    price NUMERIC(12, 2),
    currency VARCHAR(8) DEFAULT 'BRL',
    url TEXT,
    lead_time_days INTEGER,
    availability VARCHAR(64),
    consulted_at TIMESTAMPTZ,
    
    -- Auditoria
    created_by VARCHAR(128) NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABELA: project_furniture_history (Prompt E01 Itens 18 e 19)
-- Histórico e rastreabilidade de aprovações, revisões e substituições
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_furniture_history (
    id VARCHAR(64) PRIMARY KEY,
    item_id VARCHAR(64) NOT NULL REFERENCES project_furniture_items(id) ON DELETE CASCADE,
    action VARCHAR(64) NOT NULL, -- 'CREATED', 'UPDATED', 'APPROVED', 'REJECTED', 'SUPERSEDED', 'VERSIONED'
    from_status furniture_status_enum,
    to_status furniture_status_enum,
    from_version VARCHAR(16),
    to_version VARCHAR(16),
    changed_fields JSONB DEFAULT '[]'::jsonb,
    change_summary TEXT,
    rejection_reason TEXT,
    changed_by VARCHAR(128) NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ÍNDICES DE PERFORMANCE E PESQUISA HIERÁRQUICA
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_furniture_proj_env ON project_furniture_items(project_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_furniture_category ON project_furniture_items(category);
CREATE INDEX IF NOT EXISTS idx_furniture_status ON project_furniture_items(status);
CREATE INDEX IF NOT EXISTS idx_furniture_origin ON project_furniture_items(origin);
CREATE INDEX IF NOT EXISTS idx_furniture_group ON project_furniture_items(group_id);
CREATE INDEX IF NOT EXISTS idx_furniture_history_item ON project_furniture_history(item_id);
