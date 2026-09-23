-- ============================================================================
-- ARQVERTICE STUDIO — ESQUEMA COMPLETO DE DADOS
-- SEÇÃO 29: CONFIGURADOR DE VÍDEO (BLOCO G02)
-- ============================================================================

-- Tabela auxiliar de presets predefinidos de configuração audiovisual
CREATE TABLE IF NOT EXISTS video_configuration_presets (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  type VARCHAR(100) NOT NULL,
  description TEXT,
  aspect_ratio VARCHAR(20) NOT NULL,
  orientation VARCHAR(20) NOT NULL,
  duration_seconds INTEGER NOT NULL,
  resolution VARCHAR(20) NOT NULL,
  pacing VARCHAR(50) NOT NULL,
  narrative_style VARCHAR(100) NOT NULL,
  has_voiceover BOOLEAN NOT NULL DEFAULT false,
  has_music BOOLEAN NOT NULL DEFAULT true,
  has_text_overlays BOOLEAN NOT NULL DEFAULT true,
  has_subtitles BOOLEAN NOT NULL DEFAULT false,
  recommended_scenes INTEGER NOT NULL DEFAULT 4,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_video_config_presets_type ON video_configuration_presets(type);
