-- ============================================================================
-- ARQVERTICE STUDIO — MIGRATION 0031: VIDEO TIMELINE EDITOR (BLOCO G12)
-- ============================================================================
-- Editor visual básico de vídeo com timeline multi-faixa e edição não destrutiva.
-- NÃO tenta recriar Premiere, DaVinci ou After Effects.
-- Objetivo: timeline simples para montagem do projeto.
-- ============================================================================

CREATE TABLE IF NOT EXISTS video_timelines (
  id VARCHAR(100) PRIMARY KEY,
  video_project_id VARCHAR(100) REFERENCES video_projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL DEFAULT 'Timeline Principal',
  total_duration_seconds NUMERIC(10,2) NOT NULL DEFAULT 0,
  fps INTEGER NOT NULL DEFAULT 30,
  resolution_width INTEGER NOT NULL DEFAULT 1920,
  resolution_height INTEGER NOT NULL DEFAULT 1080,
  aspect_ratio VARCHAR(16) NOT NULL DEFAULT '16:9',
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  version INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_by VARCHAR(255) NOT NULL DEFAULT 'Sistema',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS video_timeline_clips (
  id VARCHAR(100) PRIMARY KEY,
  timeline_id VARCHAR(100) REFERENCES video_timelines(id) ON DELETE CASCADE,
  video_project_id VARCHAR(100) REFERENCES video_projects(id) ON DELETE CASCADE,
  track VARCHAR(32) NOT NULL DEFAULT 'VIDEO',
  track_index INTEGER NOT NULL DEFAULT 0,
  position_seconds NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration_seconds NUMERIC(10,2) NOT NULL DEFAULT 5.0,
  in_point_seconds NUMERIC(10,2) NOT NULL DEFAULT 0,
  out_point_seconds NUMERIC(10,2),
  source_type VARCHAR(64) NOT NULL DEFAULT 'scene',
  source_id VARCHAR(100),
  source_label VARCHAR(255),
  asset_url TEXT,
  content TEXT,
  transition_in VARCHAR(64),
  transition_out VARCHAR(64),
  transition_duration_seconds NUMERIC(10,2) NOT NULL DEFAULT 0.5,
  is_muted BOOLEAN NOT NULL DEFAULT FALSE,
  volume NUMERIC(3,2) NOT NULL DEFAULT 1.0,
  opacity NUMERIC(3,2) NOT NULL DEFAULT 1.0,
  order_index INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by VARCHAR(255) NOT NULL DEFAULT 'Sistema',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_video_timelines_project ON video_timelines(video_project_id);
CREATE INDEX IF NOT EXISTS idx_video_timeline_clips_timeline ON video_timeline_clips(timeline_id);
CREATE INDEX IF NOT EXISTS idx_video_timeline_clips_track ON video_timeline_clips(track);
CREATE INDEX IF NOT EXISTS idx_video_timeline_clips_project ON video_timeline_clips(video_project_id);
