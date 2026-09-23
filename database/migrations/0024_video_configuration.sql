-- ============================================================================
-- ARQVERTICE STUDIO — BANCO DE DADOS
-- MIGRAÇÃO 0024: CONFIGURADOR DE VÍDEO (BLOCO G02)
-- ============================================================================

-- Adiciona campos de parametrização cinemática e narrativa na tabela video_projects
ALTER TABLE video_projects
  ADD COLUMN IF NOT EXISTS orientation VARCHAR(20) DEFAULT 'horizontal',
  ADD COLUMN IF NOT EXISTS pacing VARCHAR(50) DEFAULT 'moderado',
  ADD COLUMN IF NOT EXISTS narrative_style VARCHAR(100) DEFAULT 'institucional',
  ADD COLUMN IF NOT EXISTS has_voiceover BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_music BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS has_text_overlays BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS has_subtitles BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS scenes_count INTEGER DEFAULT 4,
  ADD COLUMN IF NOT EXISTS is_custom_duration BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS config_preset VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS config_confirmed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS config_confirmed_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS config_data JSONB DEFAULT '{}'::jsonb;

-- Comentários descritivos
COMMENT ON COLUMN video_projects.orientation IS 'Orientação espacial do vídeo: horizontal, vertical ou quadrado';
COMMENT ON COLUMN video_projects.pacing IS 'Ritmo dos cortes: lento_contemplativo, moderado, dinamico_rapido';
COMMENT ON COLUMN video_projects.narrative_style IS 'Estilo narrativo: institucional, sensorial_emocional, tecnico_arquitetonico, comercial, minimalista';
COMMENT ON COLUMN video_projects.has_voiceover IS 'Flag indicador de locução ou voz guia';
COMMENT ON COLUMN video_projects.has_music IS 'Flag de trilha sonora musical de fundo';
COMMENT ON COLUMN video_projects.has_text_overlays IS 'Flag de sobreposição de textos em tela e títulos';
COMMENT ON COLUMN video_projects.has_subtitles IS 'Flag de legendas sincronizadas';
COMMENT ON COLUMN video_projects.scenes_count IS 'Número planejado de cenas do vídeo';
COMMENT ON COLUMN video_projects.config_confirmed IS 'Indica se a configuração inicial foi confirmada antes de avançar para a narrativa';
