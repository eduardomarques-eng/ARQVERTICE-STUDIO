-- ============================================================================
-- ARQVERTICE STUDIO — BANCO DE DADOS
-- MIGRAÇÃO 0028: STORYBOARD VISUAL AUDIOVISUAL (BLOCO G06)
-- ============================================================================

CREATE TABLE IF NOT EXISTS video_storyboards (
  id VARCHAR(100) PRIMARY KEY,
  video_project_id VARCHAR(100) NOT NULL REFERENCES video_projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  target_duration_seconds NUMERIC(6,2) NOT NULL DEFAULT 60.0,
  total_duration_seconds NUMERIC(6,2) NOT NULL DEFAULT 0.0,
  is_duration_exceeded BOOLEAN NOT NULL DEFAULT false,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  approved_at TIMESTAMPTZ,
  approved_by VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS video_storyboard_frames (
  id VARCHAR(100) PRIMARY KEY,
  storyboard_id VARCHAR(100) NOT NULL REFERENCES video_storyboards(id) ON DELETE CASCADE,
  video_project_id VARCHAR(100) NOT NULL REFERENCES video_projects(id) ON DELETE CASCADE,
  frame_number INTEGER NOT NULL DEFAULT 1,
  scene_id VARCHAR(100),
  scene_title VARCHAR(255),
  duration_seconds NUMERIC(6,2) NOT NULL DEFAULT 5.0,
  image_url TEXT,
  video_url TEXT,
  movement VARCHAR(100) NOT NULL DEFAULT 'Slow Pan Right',
  text TEXT,
  narration TEXT,
  audio VARCHAR(255) DEFAULT 'Trilha Sonora Ambiente 2700K',
  transition VARCHAR(50) NOT NULL DEFAULT 'crossfade',
  notes TEXT,
  asset_id VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vsb_video_project ON video_storyboards(video_project_id);
CREATE INDEX IF NOT EXISTS idx_vsbf_storyboard ON video_storyboard_frames(storyboard_id);
CREATE INDEX IF NOT EXISTS idx_vsbf_video_project ON video_storyboard_frames(video_project_id);
CREATE INDEX IF NOT EXISTS idx_vsbf_frame_number ON video_storyboard_frames(frame_number);

COMMENT ON TABLE video_storyboards IS 'Storyboards visuais para pré-visualização e validação de ritmo antes da geração final (Bloco G06)';
COMMENT ON TABLE video_storyboard_frames IS 'Quadros individuais do Storyboard com parâmetros cinemáticos (Bloco G06)';
