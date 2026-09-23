-- ============================================================================
-- ARQVERTICE STUDIO — MIGRATION 0032: VIDEO RENDER ENGINE (BLOCO G13)
-- ============================================================================
-- Pipeline de renderização e exportação de vídeo:
-- - Fila de processamento, progresso, tempo, status e log de erro
-- - Presets: WEB, SOCIAL_VERTICAL, SOCIAL_HORIZONTAL, CLIENT_PRESENTATION, HIGH_QUALITY
-- - Configurações: resolução (1080p default, 4K ready), FPS, bitrate, áudio, codec, proporção
-- - Status: queued, processing, completed, failed, cancelled
-- - Tolerância a falhas com suporte a retry sem perda de dados do projeto
-- - Versionamento completo de vídeos exportados
-- ============================================================================

CREATE TABLE IF NOT EXISTS video_render_jobs (
  id VARCHAR(100) PRIMARY KEY,
  video_project_id VARCHAR(100) REFERENCES video_projects(id) ON DELETE CASCADE,
  timeline_id VARCHAR(100) REFERENCES video_timelines(id) ON DELETE SET NULL,
  preset VARCHAR(64) NOT NULL DEFAULT 'WEB',
  format VARCHAR(32) NOT NULL DEFAULT 'mp4',
  codec VARCHAR(32) NOT NULL DEFAULT 'h264',
  resolution VARCHAR(32) NOT NULL DEFAULT '1080p',
  resolution_width INTEGER NOT NULL DEFAULT 1920,
  resolution_height INTEGER NOT NULL DEFAULT 1080,
  aspect_ratio VARCHAR(16) NOT NULL DEFAULT '16:9',
  fps INTEGER NOT NULL DEFAULT 30,
  bitrate_kbps INTEGER NOT NULL DEFAULT 8000,
  audio_codec VARCHAR(32) NOT NULL DEFAULT 'aac',
  audio_bitrate_kbps INTEGER NOT NULL DEFAULT 192,
  audio_channels INTEGER NOT NULL DEFAULT 2,
  audio_sample_rate INTEGER NOT NULL DEFAULT 48000,
  status VARCHAR(32) NOT NULL DEFAULT 'queued',
  progress_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  current_phase VARCHAR(128) DEFAULT 'Fila de espera',
  duration_seconds NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  estimated_time_seconds INTEGER DEFAULT 60,
  elapsed_time_seconds INTEGER DEFAULT 0,
  error_message TEXT,
  error_details JSONB,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  output_url TEXT,
  file_size_bytes BIGINT DEFAULT 0,
  target_version VARCHAR(32) NOT NULL DEFAULT 'v1.0',
  provider_resolutions_detected JSONB NOT NULL DEFAULT '[]'::jsonb,
  normalization_applied JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by VARCHAR(255) NOT NULL DEFAULT 'Sistema',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS video_render_versions (
  id VARCHAR(100) PRIMARY KEY,
  video_project_id VARCHAR(100) REFERENCES video_projects(id) ON DELETE CASCADE,
  render_job_id VARCHAR(100) REFERENCES video_render_jobs(id) ON DELETE SET NULL,
  timeline_id VARCHAR(100) REFERENCES video_timelines(id) ON DELETE SET NULL,
  version_number VARCHAR(32) NOT NULL DEFAULT 'v1.0',
  version_iteration INTEGER NOT NULL DEFAULT 1,
  label VARCHAR(255) NOT NULL DEFAULT 'Versão 1.0',
  preset VARCHAR(64) NOT NULL DEFAULT 'WEB',
  format VARCHAR(32) NOT NULL DEFAULT 'mp4',
  resolution VARCHAR(32) NOT NULL DEFAULT '1080p',
  resolution_width INTEGER NOT NULL DEFAULT 1920,
  resolution_height INTEGER NOT NULL DEFAULT 1080,
  aspect_ratio VARCHAR(16) NOT NULL DEFAULT '16:9',
  fps INTEGER NOT NULL DEFAULT 30,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL DEFAULT 0,
  duration_seconds NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  codec VARCHAR(32) NOT NULL DEFAULT 'h264',
  checksum VARCHAR(64),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by VARCHAR(255) NOT NULL DEFAULT 'Sistema',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_video_render_jobs_project ON video_render_jobs(video_project_id);
CREATE INDEX IF NOT EXISTS idx_video_render_jobs_status ON video_render_jobs(status);
CREATE INDEX IF NOT EXISTS idx_video_render_jobs_preset ON video_render_jobs(preset);
CREATE INDEX IF NOT EXISTS idx_video_render_versions_project ON video_render_versions(video_project_id);
CREATE INDEX IF NOT EXISTS idx_video_render_versions_job ON video_render_versions(render_job_id);
CREATE INDEX IF NOT EXISTS idx_video_render_versions_number ON video_render_versions(version_number);
