-- ============================================================================
-- ARQVERTICE STUDIO — MIGRAÇÃO 0018: BLOCO E01
-- ============================================================================
-- Criação das estruturas de mobiliário, marcenaria sob medida, equipamentos,
-- agrupamento de conjuntos, especificações técnicas rigorosas e versionamento V01/V02.
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'furniture_category_enum') THEN
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
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'furniture_origin_enum') THEN
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
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'furniture_item_type_enum') THEN
        CREATE TYPE furniture_item_type_enum AS ENUM (
            'EXISTING',
            'NEW',
            'CUSTOM_MILLWORK'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'furniture_requirement_enum') THEN
        CREATE TYPE furniture_requirement_enum AS ENUM (
            'REQUIRED',
            'OPTIONAL'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'furniture_status_enum') THEN
        CREATE TYPE furniture_status_enum AS ENUM (
            'DRAFT',
            'SUGGESTED',
            'IN_REVIEW',
            'APPROVED',
            'REJECTED',
            'SUPERSEDED'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'furniture_unit_enum') THEN
        CREATE TYPE furniture_unit_enum AS ENUM (
            'UN',
            'PAR',
            'CONJUNTO',
            'M',
            'M2',
            'M3',
            'OUTRA'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dimension_unit_enum') THEN
        CREATE TYPE dimension_unit_enum AS ENUM (
            'CM',
            'M',
            'MM'
        );
    END IF;
END $$;

-- 1. Tabela de Grupos / Conjuntos
CREATE TABLE IF NOT EXISTS project_furniture_groups (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL,
    environment_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabela de Itens de Mobiliário e Marcenaria
CREATE TABLE IF NOT EXISTS project_furniture_items (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL,
    environment_id VARCHAR(64) NOT NULL,
    category furniture_category_enum NOT NULL DEFAULT 'MOVEL_SOLTO',
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    item_type furniture_item_type_enum NOT NULL DEFAULT 'NEW',
    requirement_type furniture_requirement_enum NOT NULL DEFAULT 'REQUIRED',
    
    quantity_value NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    quantity_unit furniture_unit_enum NOT NULL DEFAULT 'UN',
    quantity_origin furniture_origin_enum NOT NULL DEFAULT 'ARQVERTICE',
    
    width NUMERIC(10, 2),
    depth NUMERIC(10, 2),
    height NUMERIC(10, 2),
    dimension_unit dimension_unit_enum NOT NULL DEFAULT 'CM',
    
    material VARCHAR(255),
    finish VARCHAR(255),
    color VARCHAR(128),
    
    status furniture_status_enum NOT NULL DEFAULT 'DRAFT',
    origin furniture_origin_enum NOT NULL DEFAULT 'ARQVERTICE',
    rejection_reason TEXT,
    
    reference_text TEXT,
    image_url TEXT,
    notes TEXT,
    
    group_id VARCHAR(64),
    group_name VARCHAR(255),
    
    is_custom_millwork BOOLEAN NOT NULL DEFAULT FALSE,
    technical_drawing_ref VARCHAR(255),
    associated_file_url TEXT,
    millwork_notes TEXT,
    
    is_ai_suggestion BOOLEAN NOT NULL DEFAULT FALSE,
    ai_confidence NUMERIC(4, 3),
    ai_label VARCHAR(255),
    ai_detection_metadata JSONB DEFAULT '{}'::jsonb,
    
    version_code VARCHAR(16) NOT NULL DEFAULT 'V01',
    version_sequence INTEGER NOT NULL DEFAULT 1,
    parent_item_id VARCHAR(64),
    
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
    
    created_by VARCHAR(128) NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabela de Histórico
CREATE TABLE IF NOT EXISTS project_furniture_history (
    id VARCHAR(64) PRIMARY KEY,
    item_id VARCHAR(64) NOT NULL,
    action VARCHAR(64) NOT NULL,
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_furniture_proj_env ON project_furniture_items(project_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_furniture_category ON project_furniture_items(category);
CREATE INDEX IF NOT EXISTS idx_furniture_status ON project_furniture_items(status);
CREATE INDEX IF NOT EXISTS idx_furniture_origin ON project_furniture_items(origin);
CREATE INDEX IF NOT EXISTS idx_furniture_group ON project_furniture_items(group_id);

-- SEED PILOTO (Living e Cozinha do prj-praia-01)
INSERT INTO project_furniture_groups (id, project_id, environment_id, name, description)
VALUES 
    ('grp-jantar-01', 'prj-praia-01', 'amb-sala-01', 'Conjunto de Jantar Minimalista', 'Mesa de jantar em carvalho natural com 6 cadeiras estofadas')
ON CONFLICT (id) DO NOTHING;

INSERT INTO project_furniture_items (
    id, project_id, environment_id, category, name, description, item_type, requirement_type,
    quantity_value, quantity_unit, quantity_origin, width, depth, height, dimension_unit,
    material, finish, color, status, origin, reference_text, is_custom_millwork,
    version_code, version_sequence, group_id, group_name
) VALUES 
(
    'furn-sofa-01', 'prj-praia-01', 'amb-sala-01', 'MOVEL_SOLTO',
    'Sofá Living 3 Lugares com Chaise', 'Sofá pertencente ao acervo atual da cliente em tecido linho cru',
    'EXISTING', 'REQUIRED', 1.00, 'UN', 'CLIENTE',
    280.00, 110.00, 85.00, 'CM', 'Linho Natural e Madeira Maciça', 'Impermeabilizado', 'Off-white/Areia',
    'APPROVED', 'CLIENTE', 'Referência do sofá aprovada pelo cliente no briefing inicial', FALSE,
    'V01', 1, NULL, NULL
),
(
    'furn-painel-tv-01', 'prj-praia-01', 'amb-sala-01', 'MARCENARIA',
    'Painel Ripado e Rack Suspenso TV', 'Marcenaria sob medida em lâmina natural de Carvalho e laca acetinada',
    'CUSTOM_MILLWORK', 'REQUIRED', 1.00, 'UN', 'ARQVERTICE',
    340.00, 45.00, 260.00, 'CM', 'MDF Naval e Lâmina Natural', 'Verniz Fosco Acetinado', 'Carvalho Americano / Grafite',
    'APPROVED', 'ARQVERTICE', 'Detalhamento executivo prancha DET-MARC-01', TRUE,
    'V01', 1, NULL, NULL
),
(
    'furn-mesa-jantar-01', 'prj-praia-01', 'amb-sala-01', 'MOVEL_SOLTO',
    'Mesa de Jantar Retangular 6 Lugares', 'Mesa com tampo chanfrado em carvalho e pés cônicos',
    'NEW', 'REQUIRED', 1.00, 'UN', 'ARQVERTICE',
    220.00, 100.00, 75.00, 'CM', 'Madeira Carvalho Maciço', 'Acetinado Fosco', 'Natural',
    'APPROVED', 'ARQVERTICE', 'Catálogo Jader Almeida 2026', FALSE,
    'V01', 1, 'grp-jantar-01', 'Conjunto de Jantar Minimalista'
),
(
    'furn-cadeira-jantar-01', 'prj-praia-01', 'amb-sala-01', 'MOVEL_SOLTO',
    'Cadeiras de Jantar Estofadas', 'Cadeiras anatômicas em madeira e encosto estofado',
    'NEW', 'REQUIRED', 6.00, 'UN', 'ARQVERTICE',
    52.00, 56.00, 82.00, 'CM', 'Madeira Tauari e Couro Natural', 'Selador Fosco', 'Couro Caramelo',
    'APPROVED', 'ARQVERTICE', 'Catálogo Dpot 2026', FALSE,
    'V01', 1, 'grp-jantar-01', 'Conjunto de Jantar Minimalista'
)
ON CONFLICT (id) DO NOTHING;
