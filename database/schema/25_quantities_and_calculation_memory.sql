-- ================================================================
-- ARQVERTICE STUDIO
-- SCHEMA: 25_quantities_and_calculation_memory.sql
-- VERSÃO: E03 — SISTEMA DE QUANTITATIVOS E MEMÓRIA DE CÁLCULO
-- ================================================================

-- 1. Tipos Enumerados do Sistema de Quantitativos (Prompt E03 Itens 1, 3, 7, 19 e 20)

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quantity_origin_type') THEN
    CREATE TYPE quantity_origin_type AS ENUM (
      'MEASURED',
      'CALCULATED',
      'IMPORTED',
      'MANUAL',
      'ESTIMATED_BY_AI',
      'UNKNOWN'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quantity_source_type') THEN
    CREATE TYPE quantity_source_type AS ENUM (
      'PROJECT_DATA',
      'USER_MEASUREMENT',
      'REVIT_IMPORT',
      'SPREADSHEET_IMPORT',
      'CALCULATED_FORMULA',
      'VISUAL_ESTIMATE',
      'MANUAL_INPUT'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quantity_status') THEN
    CREATE TYPE quantity_status AS ENUM (
      'DRAFT',
      'CALCULATED',
      'ESTIMATED',
      'IN_REVIEW',
      'APPROVED',
      'REJECTED',
      'SUPERSEDED'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quantity_approval_level') THEN
    CREATE TYPE quantity_approval_level AS ENUM (
      'QUANTITY_ESTIMATED',
      'QUANTITY_APPROVED'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quantity_rounding_rule') THEN
    CREATE TYPE quantity_rounding_rule AS ENUM (
      'CEIL',
      'ROUND',
      'NONE'
    );
  END IF;
END $$;

-- 2. Tabela de Quantitativos do Projeto e Ambiente (Prompt E03 Itens 4, 5, 8, 9, 10, 11 e 26)
CREATE TABLE IF NOT EXISTS project_quantities (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  environment_id VARCHAR(64) REFERENCES environments(id) ON DELETE SET NULL,
  material_id VARCHAR(64) REFERENCES project_materials(id) ON DELETE SET NULL,
  product_id VARCHAR(64) REFERENCES catalog_products(id) ON DELETE SET NULL,
  item_name VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL,
  application VARCHAR(64) NOT NULL,
  
  -- Quantidades e Unidades Técnicas (Prompt E03 Itens 4, 7 e 9)
  base_quantity NUMERIC(12, 4) NOT NULL,
  unit VARCHAR(32) NOT NULL DEFAULT 'm²',
  loss_percentage NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
  final_quantity NUMERIC(12, 4) NOT NULL,
  technical_quantity NUMERIC(12, 4) NOT NULL,
  
  -- Memória de Cálculo e Fórmulas (Prompt E03 Itens 5 e 17)
  formula_text TEXT NOT NULL,
  formula_expression VARCHAR(255),
  
  -- Embalagem e Unidade de Compra (Prompt E03 Itens 8 e 9)
  has_packaging BOOLEAN DEFAULT FALSE,
  packaging_coverage NUMERIC(10, 4), -- ex: 2.16 m² por caixa
  packaging_unit VARCHAR(32),        -- 'caixa', 'saco', 'kit'
  purchasing_quantity NUMERIC(12, 4), -- quantidade inteira/arredondada para compra
  packaging_formula TEXT,
  rounding_rule quantity_rounding_rule DEFAULT 'CEIL',
  decimal_places INTEGER DEFAULT 2,

  -- Princípio da Confiabilidade e Fontes (Prompt E03 Itens 1, 2, 3 e 15)
  origin_type quantity_origin_type NOT NULL DEFAULT 'CALCULATED',
  source_type quantity_source_type NOT NULL DEFAULT 'PROJECT_DATA',
  source_file_ref VARCHAR(255),
  revit_element_id VARCHAR(128),
  revit_category VARCHAR(128),

  -- Estimativa de IA e Confiança (Prompt E03 Itens 13 e 14)
  is_ai_estimate BOOLEAN DEFAULT FALSE,
  ai_confidence NUMERIC(5, 3),
  ai_disclaimer TEXT,

  -- Governança de Status e Aprovação (Prompt E03 Itens 19 e 20)
  status quantity_status NOT NULL DEFAULT 'DRAFT',
  approval_level quantity_approval_level NOT NULL DEFAULT 'QUANTITY_ESTIMATED',
  approved_by VARCHAR(255),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,

  -- Consumo e Visibilidade (Prompt E03 Itens 21, 23 e 24)
  notes TEXT,
  target_displays TEXT[] DEFAULT ARRAY['ficha', 'relatorio'], -- 'ficha', 'prancha', 'relatorio', 'moodboard'
  include_in_moodboard BOOLEAN DEFAULT TRUE,

  version_code VARCHAR(16) DEFAULT 'V01',
  version_sequence INTEGER DEFAULT 1,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_project_quantities_proj ON project_quantities(project_id);
CREATE INDEX IF NOT EXISTS idx_project_quantities_env ON project_quantities(environment_id);
CREATE INDEX IF NOT EXISTS idx_project_quantities_mat ON project_quantities(material_id);
CREATE INDEX IF NOT EXISTS idx_project_quantities_prod ON project_quantities(product_id);
CREATE INDEX IF NOT EXISTS idx_project_quantities_status ON project_quantities(status);

-- 3. Histórico e Trilha de Auditoria (Prompt E03 Item 28)
CREATE TABLE IF NOT EXISTS project_quantity_history (
  id VARCHAR(64) PRIMARY KEY,
  quantity_id VARCHAR(64) NOT NULL REFERENCES project_quantities(id) ON DELETE CASCADE,
  action VARCHAR(64) NOT NULL, -- 'CREATED', 'CALCULATED', 'LOSS_CHANGED', 'EDITED', 'APPROVED', 'REJECTED', 'SUPERSEDED'
  from_status quantity_status,
  to_status quantity_status,
  from_final_qty NUMERIC(12, 4),
  to_final_qty NUMERIC(12, 4),
  from_loss_pct NUMERIC(5, 2),
  to_loss_pct NUMERIC(5, 2),
  changed_fields TEXT[],
  change_summary TEXT NOT NULL,
  rejection_reason TEXT,
  changed_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_project_qty_hist_qty ON project_quantity_history(quantity_id);
