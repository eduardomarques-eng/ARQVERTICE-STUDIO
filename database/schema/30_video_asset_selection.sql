-- ============================================================================
-- ARQVERTICE STUDIO — ESQUEMA COMPLETO DE DADOS
-- SEÇÃO 30: SISTEMA DE SELEÇÃO DE CONTEÚDO PARA VÍDEO (BLOCO G03)
-- ============================================================================

CREATE TABLE IF NOT EXISTS video_asset_selections (
  id VARCHAR(100) PRIMARY KEY,
  video_project_id VARCHAR(100) NOT NULL REFERENCES video_projects(id) ON DELETE CASCADE,
  asset_id VARCHAR(100) NOT NULL,
  source_type VARCHAR(50) NOT NULL, -- briefing, conceito, ambientes, plantas, plantas_humanizadas, perspectivas, renders, referencias, materiais, mobiliario, moodboards, pranchas, observacoes, revisoes, arquivos_aprovados
  source_id VARCHAR(100),
  selected BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 1,
  role VARCHAR(50) NOT NULL DEFAULT 'ambiente', -- abertura, contexto, planta, ambiente, perspectiva, detalhe, material, mobiliário, transição, encerramento, CTA
  notes TEXT,
  title VARCHAR(255),
  preview_url TEXT,
  environment_id VARCHAR(100),
  approval_status VARCHAR(50) NOT NULL DEFAULT 'APROVADO',
  revision VARCHAR(20) DEFAULT 'V01',
  resolution VARCHAR(20) DEFAULT '1080p',
  orientation VARCHAR(20) DEFAULT 'horizontal',
  ai_recommended_role VARCHAR(50),
  ai_recommendation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vas_video_project ON video_asset_selections(video_project_id);
CREATE INDEX IF NOT EXISTS idx_vas_source_type ON video_asset_selections(source_type);
CREATE INDEX IF NOT EXISTS idx_vas_role ON video_asset_selections(role);
CREATE INDEX IF NOT EXISTS idx_vas_selected ON video_asset_selections(selected);
CREATE INDEX IF NOT EXISTS idx_vas_approval_status ON video_asset_selections(approval_status);
