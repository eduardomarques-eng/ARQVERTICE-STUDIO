-- ============================================================================
-- ARQVERTICE STUDIO — SCHEMA 04: MATERIAIS, FORNECEDORES E MOBILIÁRIO
-- Rastreabilidade de Proveniência: REAL, CALCULADO, ESTIMADO, INFORMADO, IA
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. FORNECEDORES E PARCEIROS COMERCIAIS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS suppliers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(150) NOT NULL,
    category            VARCHAR(100) NOT NULL, -- Ex: 'Marmoraria', 'Marcenaria', 'Iluminação', 'Revestimentos'
    contact_person      VARCHAR(100),
    phone               VARCHAR(30),
    email               VARCHAR(255),
    website             TEXT,
    city_state          VARCHAR(100),
    notes               TEXT,
    is_preferred        BOOLEAN NOT NULL DEFAULT false, -- Parceiro homologado ArqVértice
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION toca_atualizado_em();

-- ---------------------------------------------------------------------------
-- 2. CATÁLOGO BASE DE PRODUTOS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id         UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    name                VARCHAR(200) NOT NULL,
    sku_code            VARCHAR(100), -- Código comercial do fabricante
    category            VARCHAR(100) NOT NULL,
    unit                VARCHAR(20) NOT NULL DEFAULT 'UN' CHECK (unit IN ('UN', 'M2', 'M', 'KG', 'L', 'CJ')),
    estimated_price     NUMERIC(10, 2),
    product_url         TEXT,
    image_file_id       UUID REFERENCES files(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3. ESPECIFICAÇÕES DE MATERIAIS E ACABAMENTOS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS materials (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id          UUID REFERENCES products(id) ON DELETE SET NULL,
    supplier_id         UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    name                VARCHAR(150) NOT NULL, -- Ex: 'Mármore Travertino Navona', 'Porcelanato Portobello 120x120'
    category            VARCHAR(50) NOT NULL
                          CHECK (category IN ('PISO', 'REVESTIMENTO_PAREDE', 'PINTURA', 'MADEIRA', 'PEDRA_NATURAL', 'METAL', 'TECIDO', 'VIDRO', 'LOUCA_METAIS', 'OUTRO')),
    finish_type         VARCHAR(100), -- 'Polido', 'Acetinado', 'Levigado', 'Escovado', 'Fosco'
    color_code          VARCHAR(100), -- Ex: 'Pantone 7527C', 'Suvinil Ouro Branco'
    unit                VARCHAR(20) NOT NULL DEFAULT 'M2',
    image_file_id       UUID REFERENCES files(id) ON DELETE SET NULL,
    technical_sheet_url TEXT,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 4. ITENS DE MOBILIÁRIO E ILUMINAÇÃO
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS furniture_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id          UUID REFERENCES products(id) ON DELETE SET NULL,
    supplier_id         UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    name                VARCHAR(150) NOT NULL, -- Ex: 'Sofá Modular 3 Lugares', 'Mesa de Jantar Orgânica'
    category            VARCHAR(50) NOT NULL
                          CHECK (category IN ('SOFA', 'MESA', 'CADEIRA', 'POLTRONA', 'CAMA', 'MARCENARIA_SOB_MEDIDA', 'ILUMINACAO', 'TAPETE', 'DECORACAO', 'ELETRODOMESTICO')),
    dimensions_w_d_h    VARCHAR(100), -- Ex: '280cm x 105cm x 85cm'
    model               VARCHAR(100),
    sku_code            VARCHAR(100),
    main_material       VARCHAR(100), -- Ex: 'Estrutura em Tauari e estofado em linho cru'
    image_file_id       UUID REFERENCES files(id) ON DELETE SET NULL,
    product_url         TEXT,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 5. VÍNCULO AMBIENTE <-> MATERIAIS (COM PROVENIÊNCIA EXPLÍCITA)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS environment_materials (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    environment_id      UUID NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    material_id         UUID NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
    surface_application VARCHAR(100) NOT NULL, -- Ex: 'Piso Geral', 'Bancada Ilha', 'Parede Destaque TV'
    quantity            NUMERIC(10, 2),
    unit                VARCHAR(20) NOT NULL DEFAULT 'M2',
    -- Requisito de Governança: Diferenciar a origem da informação
    provenance_type     VARCHAR(50) NOT NULL DEFAULT 'INFORMADO_USUARIO'
                          CHECK (provenance_type IN (
                            'DADO_REAL',            -- Medido in loco ou especificado no Revit
                            'CALCULADO',            -- Área geométrica calculada
                            'ESTIMADO',             -- Estimativa paramétrica preliminar
                            'INFORMADO_USUARIO',    -- Digitado manualmente pelo arquiteto
                            'SUGERIDO_IA'           -- Sugerido por modelo de inteligência artificial
                          )),
    status              VARCHAR(50) NOT NULL DEFAULT 'EM_ESTUDO'
                          CHECK (status IN ('EM_ESTUDO', 'ESPECIFICADO', 'APROVADO_CLIENTE', 'COMPRADO', 'INSTALADO')),
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_env_materials_env ON environment_materials (environment_id);

-- ---------------------------------------------------------------------------
-- 6. VÍNCULO AMBIENTE <-> MÓVEIS (COM PROVENIÊNCIA EXPLÍCITA)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS environment_furniture (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    environment_id      UUID NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    furniture_item_id   UUID NOT NULL REFERENCES furniture_items(id) ON DELETE RESTRICT,
    quantity            INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    provenance_type     VARCHAR(50) NOT NULL DEFAULT 'INFORMADO_USUARIO'
                          CHECK (provenance_type IN (
                            'DADO_REAL', 'CALCULADO', 'ESTIMADO', 'INFORMADO_USUARIO', 'SUGERIDO_IA'
                          )),
    status              VARCHAR(50) NOT NULL DEFAULT 'EM_ESTUDO'
                          CHECK (status IN ('EM_ESTUDO', 'ESPECIFICADO', 'APROVADO_CLIENTE', 'PEDIDO_EMITIDO', 'ENTREGUE')),
    custom_notes        TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_env_furniture_env ON environment_furniture (environment_id);
