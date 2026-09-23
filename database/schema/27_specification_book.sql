-- ================================================================
-- ARQVERTICE STUDIO — SCHEMA DO BANCO DE DADOS
-- 27_specification_book.sql — BLOCO E05: CADERNO DE ESPECIFICAÇÕES, LISTAS E FICHAS
-- ================================================================

-- Tipos Canônicos de Documento do Caderno
CREATE TYPE specification_doc_type AS ENUM (
    'LISTA_MOVEIS',
    'LISTA_MATERIAIS',
    'QUANTITATIVO',
    'LISTA_EQUIPAMENTOS',
    'LISTA_ILUMINACAO',
    'LISTA_FORNECEDORES',
    'LISTA_PRODUTOS',
    'CADERNO_GERAL'
);

-- Níveis Canônicos de Rastreabilidade de Origem
CREATE TYPE specification_origin_type AS ENUM (
    'CONFIRMADO',
    'CALCULADO',
    'ESTIMADO',
    'SUGERIDO'
);

-- Status do Caderno e Fichas
CREATE TYPE specification_status AS ENUM (
    'DRAFT',
    'IN_REVIEW',
    'APPROVED',
    'SUPERSEDED'
);

-- 1. Cadernos de Especificações (Gerais ou por Ambiente)
CREATE TABLE IF NOT EXISTS project_specification_books (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id VARCHAR(64) NULL REFERENCES environments(id) ON DELETE SET NULL,
    doc_type specification_doc_type NOT NULL DEFAULT 'CADERNO_GERAL',
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255) NULL,
    description TEXT NULL,
    version VARCHAR(16) NOT NULL DEFAULT 'V01',
    version_number INT NOT NULL DEFAULT 1,
    status specification_status NOT NULL DEFAULT 'DRAFT',
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    approved_at TIMESTAMPTZ NULL,
    approved_by VARCHAR(128) NULL,
    notes TEXT NULL,
    metadata JSONB NULL DEFAULT '{}'::jsonb,
    created_by VARCHAR(128) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Entradas Consolidadas do Caderno de Especificações
CREATE TABLE IF NOT EXISTS project_specification_entries (
    id VARCHAR(64) PRIMARY KEY,
    specification_book_id VARCHAR(64) NOT NULL REFERENCES project_specification_books(id) ON DELETE CASCADE,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id VARCHAR(64) NULL REFERENCES environments(id) ON DELETE SET NULL,
    category VARCHAR(64) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NULL,
    collection_name VARCHAR(128) NULL,
    manufacturer_name VARCHAR(128) NULL,
    supplier_name VARCHAR(128) NULL,
    commercial_code VARCHAR(128) NULL,
    finish VARCHAR(128) NULL,
    material_desc VARCHAR(255) NULL,
    dimensions VARCHAR(128) NULL,
    quantity NUMERIC(12, 3) NULL,
    unit VARCHAR(32) NULL,
    image_url TEXT NULL,
    external_link TEXT NULL,
    consulted_at TIMESTAMPTZ NULL,
    notes TEXT NULL,
    origin specification_origin_type NOT NULL DEFAULT 'CONFIRMADO',
    furniture_id VARCHAR(64) NULL REFERENCES furniture_items(id) ON DELETE SET NULL,
    material_id VARCHAR(64) NULL REFERENCES project_materials(id) ON DELETE SET NULL,
    product_id VARCHAR(64) NULL REFERENCES catalog_products(id) ON DELETE SET NULL,
    quantity_id VARCHAR(64) NULL REFERENCES project_quantities(id) ON DELETE SET NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Histórico e Auditoria de Revisões de Cadernos
CREATE TABLE IF NOT EXISTS specification_book_revisions (
    id VARCHAR(64) PRIMARY KEY,
    specification_book_id VARCHAR(64) NOT NULL REFERENCES project_specification_books(id) ON DELETE CASCADE,
    version VARCHAR(16) NOT NULL,
    action VARCHAR(64) NOT NULL,
    actor VARCHAR(128) NOT NULL,
    change_summary TEXT NOT NULL,
    snapshot JSONB NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices de Consulta Rápida
CREATE INDEX IF NOT EXISTS idx_spec_books_project ON project_specification_books(project_id);
CREATE INDEX IF NOT EXISTS idx_spec_books_env ON project_specification_books(environment_id);
CREATE INDEX IF NOT EXISTS idx_spec_books_type ON project_specification_books(doc_type);
CREATE INDEX IF NOT EXISTS idx_spec_entries_book ON project_specification_entries(specification_book_id);
CREATE INDEX IF NOT EXISTS idx_spec_entries_origin ON project_specification_entries(origin);
CREATE INDEX IF NOT EXISTS idx_spec_entries_cat ON project_specification_entries(category);
