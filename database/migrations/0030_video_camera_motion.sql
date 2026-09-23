-- ============================================================================
-- ARQVERTICE STUDIO — MIGRATION 0030: VIDEO CAMERA & MOTION LAYER (BLOCO G08)
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_camera_motion_profiles_project ON camera_motion_profiles(video_project_id);
CREATE INDEX IF NOT EXISTS idx_camera_motion_profiles_scene ON camera_motion_profiles(scene_id);
CREATE INDEX IF NOT EXISTS idx_camera_motion_profiles_preset ON camera_motion_profiles(is_preset);
