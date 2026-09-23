-- ============================================================================
-- ARQVERTICE STUDIO — MIGRAÇÃO 0019: BLOCO E02
-- ============================================================================
-- Criação das estruturas de materiais, revestimentos, acabamentos,
-- fabricantes, fornecedores com regionalidade, produtos específicos e
-- separação entre conceito e produto comercial.
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'material_category_enum') THEN
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
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'material_origin_enum') THEN
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
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'material_status_enum') THEN
        CREATE TYPE material_status_enum AS ENUM (
            'DRAFT',
            'SUGGESTED',
            'IN_REVIEW',
            'APPROVED',
            'REJECTED',
            'SUPERSEDED'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'material_unit_enum') THEN
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
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'material_application_enum') THEN
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
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'material_scope_enum') THEN
        CREATE TYPE material_scope_enum AS ENUM (
            'ENVIRONMENT_SPECIFIC',
            'PROJECT_GUIDELINE',
            'REPLICABLE'
        );
    END IF;
END $$;

-- 1. Fabricantes
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

-- 2. Fornecedores
CREATE TABLE IF NOT EXISTS catalog_suppliers (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(128) NOT NULL,
    state VARCHAR(32) NOT NULL,
    region VARCHAR(64),
    contact_person VARCHAR(128),
    contact_phone VARCHAR(64),
    contact_email VARCHAR(128),
    website TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Produtos do Catálogo
CREATE TABLE IF NOT EXISTS catalog_products (
    id VARCHAR(64) PRIMARY KEY,
    manufacturer_id VARCHAR(64) REFERENCES catalog_manufacturers(id) ON DELETE SET NULL,
    supplier_id VARCHAR(64) REFERENCES catalog_suppliers(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    collection VARCHAR(128),
    sku_code VARCHAR(128),
    finish VARCHAR(128),
    width NUMERIC(10, 2),
    length NUMERIC(10, 2),
    thickness NUMERIC(10, 2),
    dimension_unit VARCHAR(16) DEFAULT 'CM',
    sales_unit material_unit_enum NOT NULL DEFAULT 'M2',
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

-- 4. Materiais do Projeto
CREATE TABLE IF NOT EXISTS project_materials (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL,
    environment_id VARCHAR(64),
    category material_category_enum NOT NULL DEFAULT 'REVESTIMENTO',
    name VARCHAR(255) NOT NULL,
    description TEXT,
    application material_application_enum NOT NULL DEFAULT 'PISO',
    color VARCHAR(128),
    finish VARCHAR(128),
    texture VARCHAR(128),
    quantity_value NUMERIC(10, 2),
    quantity_unit material_unit_enum NOT NULL DEFAULT 'M2',
    is_conceptual BOOLEAN NOT NULL DEFAULT TRUE,
    product_id VARCHAR(64) REFERENCES catalog_products(id) ON DELETE SET NULL,
    image_url TEXT,
    texture_url TEXT,
    product_photo_url TEXT,
    applied_reference_url TEXT,
    contextual_image_url TEXT,
    reference_text TEXT,
    notes TEXT,
    status material_status_enum NOT NULL DEFAULT 'DRAFT',
    origin material_origin_enum NOT NULL DEFAULT 'ARQVERTICE',
    rejection_reason TEXT,
    scope material_scope_enum NOT NULL DEFAULT 'ENVIRONMENT_SPECIFIC',
    is_ai_suggestion BOOLEAN NOT NULL DEFAULT FALSE,
    ai_confidence NUMERIC(4, 3),
    ai_label VARCHAR(255),
    ai_detection_metadata JSONB DEFAULT '{}'::jsonb,
    version_code VARCHAR(16) NOT NULL DEFAULT 'V01',
    version_sequence INTEGER NOT NULL DEFAULT 1,
    parent_material_id VARCHAR(64),
    created_by VARCHAR(128) NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Histórico
CREATE TABLE IF NOT EXISTS project_material_history (
    id VARCHAR(64) PRIMARY KEY,
    material_id VARCHAR(64) NOT NULL,
    action VARCHAR(64) NOT NULL,
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

-- SEED PILOTO (Fabricantes, Fornecedores, Produtos e Materiais)
INSERT INTO catalog_manufacturers (id, name, brand, website, notes) VALUES
    ('mfr-portobello', 'Portobello S.A.', 'Portobello', 'https://portobello.com.br', 'Líder em revestimentos cerâmicos e porcelanatos de grande formato'),
    ('mfr-biancogres', 'Biancogres Cerâmica S.A.', 'Biancogres', 'https://biancogres.com.br', 'Especialista em porcelanatos e pisos esmaltados'),
    ('mfr-eliane', 'Eliane Revestimentos', 'Eliane', 'https://eliane.com', 'Acabamentos e revestimentos arquitetônicos')
ON CONFLICT (id) DO NOTHING;

INSERT INTO catalog_suppliers (id, name, city, state, region, contact_person, contact_phone, website) VALUES
    ('sup-portobello-for', 'Portobello Shop Meireles', 'Fortaleza', 'CE', 'Nordeste', 'Camila Vasconcelos', '(85) 3242-1000', 'https://portobelloshop.com.br'),
    ('sup-granitos-ce', 'Marmoraria Granitos do Ceará', 'Eusébio', 'CE', 'Nordeste', 'Marcos Antônio', '(85) 99122-3344', 'https://granitosceara.com.br')
ON CONFLICT (id) DO NOTHING;

INSERT INTO catalog_products (
    id, manufacturer_id, supplier_id, name, collection, sku_code, finish,
    width, length, thickness, dimension_unit, sales_unit, price, currency, consulted_at, price_origin
) VALUES
(
    'prod-travertino-navona', NULL, 'sup-granitos-ce',
    'Mármore Travertino Navona Romano Levigado', 'Pedras Naturais Nobres', 'M-TRAV-NAV-01', 'Levigado Fosco',
    100.00, 100.00, 20.00, 'CM', 'M2', 780.00, 'BRL', '2026-09-21T10:00:00Z', 'Cotação Granitos do Ceará'
),
(
    'prod-portobello-nord', 'mfr-portobello', 'sup-portobello-for',
    'Porcelanato Nord Cement 120x120 Nat', 'Linha Nord', '201445E', 'Natural Retificado',
    120.00, 120.00, 9.00, 'CM', 'M2', 189.90, 'BRL', '2026-09-21T11:30:00Z', 'Tabela Portobello Shop 2026'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO project_materials (
    id, project_id, environment_id, category, name, description, application,
    color, finish, texture, quantity_value, quantity_unit, is_conceptual, product_id,
    image_url, reference_text, status, origin, scope, version_code
) VALUES
(
    'mat-piso-living-01', 'prj-praia-01', 'amb-sala-01', 'PEDRA',
    'Mármore Travertino Navona Levigado', 'Piso nobre em pedra natural de tonalidade bege areia com acabamento levigado e textura suave',
    'PISO', 'Bege Claro / Areia', 'Levigado Fosco', 'Suave semi-aveludado',
    110.00, 'M2', FALSE, 'prod-travertino-navona',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    'Especificação mestra homologada para piso social da casa de praia',
    'APPROVED', 'ARQVERTICE', 'PROJECT_GUIDELINE', 'V01'
),
(
    'mat-painel-living-01', 'prj-praia-01', 'amb-sala-01', 'MADEIRA',
    'Lâmina Natural de Carvalho Americano', 'Painel vertical de ripas finas de madeira para aquecer o ambiente social',
    'PAINEL', 'Carvalho Claro', 'Verniz Poliuretano Acetinado Fosco', 'Veios naturais da madeira',
    24.50, 'M2', TRUE, NULL,
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
    'Referência conceitual da prancha DET-MARC-01',
    'APPROVED', 'ARQVERTICE', 'ENVIRONMENT_SPECIFIC', 'V01'
)
ON CONFLICT (id) DO NOTHING;
