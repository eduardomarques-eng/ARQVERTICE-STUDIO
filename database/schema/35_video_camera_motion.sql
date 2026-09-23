-- ============================================================================
-- ARQVERTICE STUDIO — SCHEMA SECTION 35: VIDEO CAMERA & MOTION LAYER (BLOCO G08)
-- ============================================================================

-- Tabela de Perfis de Câmera e Movimento Cinemático
CREATE TABLE IF NOT EXISTS camera_motion_profiles (
  id VARCHAR(100) PRIMARY KEY,
  video_project_id VARCHAR(100) REFERENCES video_projects(id) ON DELETE CASCADE,
  scene_id VARCHAR(100),
  storyboard_frame_id VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  motion_type VARCHAR(64) NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  camera_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_preset BOOLEAN NOT NULL DEFAULT FALSE,
  preset_category VARCHAR(64),
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  source_camera_id VARCHAR(100),
  distortion_risk VARCHAR(32) NOT NULL DEFAULT 'low',
  notes TEXT,
  created_by VARCHAR(255) NOT NULL DEFAULT 'Sistema',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE camera_motion_profiles IS 'Definições cinematográficas de movimento e parâmetros de câmera por cena';
COMMENT ON COLUMN camera_motion_profiles.motion_type IS 'Tipo de movimento (push in, pull out, pan, tilt, orbit, dolly, tracking, reveal, parallax, static, handheld controlado, cinematic slow movement)';
COMMENT ON COLUMN camera_motion_profiles.settings IS 'Configurações de direção, velocidade, intensidade, duração, início e fim';
COMMENT ON COLUMN camera_motion_profiles.camera_config IS 'Parâmetros de enquadramento, distância, altura, lente conceitual, direção e ponto de interesse';
COMMENT ON COLUMN camera_motion_profiles.is_locked IS 'Flag que impede alteração caso a câmera original de render esteja bloqueada';
COMMENT ON COLUMN camera_motion_profiles.distortion_risk IS 'Avaliação de risco de distorção volumétrica espacial (none, low, medium, high)';
