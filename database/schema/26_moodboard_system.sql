-- ================================================================
-- ARQVERTICE STUDIO
-- SCHEMA: 26_moodboard_system.sql
-- VERSÃO: E04 — MOODBOARD VISUAL E TÉCNICO
-- ================================================================

-- 1. Tipos Enumerados do Sistema de Moodboards (Prompt E04 Itens 1, 4, 13, 17, 22 e 23)

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moodboard_type') THEN
    CREATE TYPE moodboard_type AS ENUM (
      'MOODBOARD_ENVIRONMENT',
      'MOODBOARD_PROJECT',
      'MOODBOARD_MATERIAL',
      'MOODBOARD_FURNITURE',
      'MOODBOARD_CONCEPT',
      'MOODBOARD_CUSTOM'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moodboard_layout_variant') THEN
    CREATE TYPE moodboard_layout_variant AS ENUM (
      'PRESENTATION',
      'TECHNICAL',
      'HYBRID'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moodboard_page_format') THEN
    CREATE TYPE moodboard_page_format AS ENUM (
      'A4',
      'A3',
      'A2',
      'A1'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moodboard_orientation') THEN
    CREATE TYPE moodboard_orientation AS ENUM (
      'LANDSCAPE',
      'PORTRAIT'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moodboard_status') THEN
    CREATE TYPE moodboard_status AS ENUM (
      'DRAFT',
      'IN_REVIEW',
      'APPROVED',
      'REJECTED',
      'SUPERSEDED'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moodboard_item_type') THEN
    CREATE TYPE moodboard_item_type AS ENUM (
      'IMAGE',
      'MATERIAL',
      'PRODUCT',
      'FURNITURE',
      'COLOR',
      'TEXTURE',
      'RENDER',
      'REFERENCE',
      'TEXT',
      'QUANTITY',
      'SUPPLIER',
      'OTHER'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moodboard_grid_width') THEN
    CREATE TYPE moodboard_grid_width AS ENUM (
      'FULL',
      'HALF',
      'THIRD',
      'QUARTER'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moodboard_card_size') THEN
    CREATE TYPE moodboard_card_size AS ENUM (
      'SMALL',
      'MEDIUM',
      'LARGE',
      'HERO'
    );
  END IF;
END $$;

-- 2. Tabela de Pranchas de Moodboard (Prompt E04 Itens 0, 1, 2, 3, 12, 13, 14, 15, 17 e 24)
CREATE TABLE IF NOT EXISTS project_moodboards (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  environment_id VARCHAR(64) REFERENCES environments(id) ON DELETE SET NULL,
  moodboard_type moodboard_type NOT NULL DEFAULT 'MOODBOARD_ENVIRONMENT',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Configurações de Layout e Prancha (Prompt E04 Itens 12, 13, 14, 16)
  layout_variant moodboard_layout_variant NOT NULL DEFAULT 'PRESENTATION',
  page_format moodboard_page_format NOT NULL DEFAULT 'A3',
  orientation moodboard_orientation NOT NULL DEFAULT 'LANDSCAPE',
  margins VARCHAR(32) DEFAULT 'NORMAL', -- 'COMPACT', 'NORMAL', 'WIDE'
  grid_columns INTEGER DEFAULT 3,
  typography_theme VARCHAR(64) DEFAULT 'MODERN_SANS',
  
  -- Render Herói em Destaque (Prompt E04 Item 9)
  hero_render_id VARCHAR(64),
  hero_image_url TEXT,

  -- Versionamento e Governança de Aprovação (Prompt E04 Itens 17 e 24)
  status moodboard_status NOT NULL DEFAULT 'DRAFT',
  version_code VARCHAR(16) NOT NULL DEFAULT 'V01',
  version_sequence INTEGER NOT NULL DEFAULT 1,
  parent_moodboard_id VARCHAR(64) REFERENCES project_moodboards(id) ON DELETE SET NULL,
  approved_by VARCHAR(255),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  notes TEXT,

  -- Identidade Visual ArqVértice (Prompt E04 Item 15)
  show_branding BOOLEAN DEFAULT TRUE,
  show_project_info BOOLEAN DEFAULT TRUE,
  show_color_palette BOOLEAN DEFAULT TRUE,
  show_materials_summary BOOLEAN DEFAULT TRUE,
  show_furniture_summary BOOLEAN DEFAULT TRUE,
  show_quantities_summary BOOLEAN DEFAULT TRUE,

  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_project_moodboards_proj ON project_moodboards(project_id);
CREATE INDEX IF NOT EXISTS idx_project_moodboards_env ON project_moodboards(environment_id);
CREATE INDEX IF NOT EXISTS idx_project_moodboards_status ON project_moodboards(status);

-- 3. Tabela de Itens e Blocos do Moodboard (Prompt E04 Itens 4, 5, 6, 7, 8, 10, 11 e 12)
CREATE TABLE IF NOT EXISTS project_moodboard_items (
  id VARCHAR(64) PRIMARY KEY,
  moodboard_id VARCHAR(64) NOT NULL REFERENCES project_moodboards(id) ON DELETE CASCADE,
  item_type moodboard_item_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  
  -- Vínculos com Entidades do Projeto (E01, E02, E03, D02)
  material_id VARCHAR(64) REFERENCES project_materials(id) ON DELETE SET NULL,
  product_id VARCHAR(64) REFERENCES catalog_products(id) ON DELETE SET NULL,
  furniture_id VARCHAR(64) REFERENCES project_furniture_items(id) ON DELETE SET NULL,
  quantity_id VARCHAR(64) REFERENCES project_quantities(id) ON DELETE SET NULL,

  -- Paleta de Cores (Prompt E04 Item 7)
  color_hex VARCHAR(16),
  color_name VARCHAR(128),
  color_code VARCHAR(64), -- Pantone, NCS, Coral, Suvinil
  color_usage VARCHAR(128), -- 'Paredes', 'Marcenaria', 'Tecidos'

  -- Detalhes Técnicos do Cartão (Prompt E04 Itens 5 e 6)
  dimensions_text VARCHAR(128),
  sku_code VARCHAR(64),
  manufacturer_name VARCHAR(128),
  supplier_name VARCHAR(128),
  reference_category VARCHAR(64), -- 'STYLE', 'MATERIAL', 'FURNITURE', 'LIGHTING'
  product_url TEXT,

  -- Posicionamento e Geometria do Bloco (Prompt E04 Item 12)
  sort_order INTEGER NOT NULL DEFAULT 0,
  grid_width moodboard_grid_width NOT NULL DEFAULT 'THIRD',
  card_size moodboard_card_size NOT NULL DEFAULT 'MEDIUM',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,

  custom_payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_moodboard_items_mb ON project_moodboard_items(moodboard_id);
CREATE INDEX IF NOT EXISTS idx_moodboard_items_order ON project_moodboard_items(moodboard_id, sort_order);

-- 4. Tabela de Histórico e Auditoria do Moodboard (Prompt E04 Itens 17, 24 e 25)
CREATE TABLE IF NOT EXISTS project_moodboard_history (
  id VARCHAR(64) PRIMARY KEY,
  moodboard_id VARCHAR(64) NOT NULL REFERENCES project_moodboards(id) ON DELETE CASCADE,
  action VARCHAR(64) NOT NULL, -- 'CREATED', 'EDITED', 'ITEM_ADDED', 'REORDERED', 'APPROVED', 'REJECTED', 'SUPERSEDED'
  from_status moodboard_status,
  to_status moodboard_status,
  from_version VARCHAR(16),
  to_version VARCHAR(16),
  changed_fields TEXT[],
  change_summary TEXT NOT NULL,
  rejection_reason TEXT,
  changed_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_moodboard_hist_mb ON project_moodboard_history(moodboard_id);
