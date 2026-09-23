-- ============================================================================
-- ARQVERTICE STUDIO — MIGRATION 0029: VIDEO PROMPT ENGINE (BLOCO G07)
-- ============================================================================

CREATE TABLE IF NOT EXISTS video_prompts (
  id VARCHAR(100) PRIMARY KEY,
  video_project_id VARCHAR(100) NOT NULL REFERENCES video_projects(id) ON DELETE CASCADE,
  scene_id VARCHAR(100),
  storyboard_frame_id VARCHAR(100),
  provider VARCHAR(64) NOT NULL,
  model VARCHAR(100) NOT NULL,
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  reference_assets JSONB NOT NULL DEFAULT '[]'::jsonb,
  parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
  version INTEGER NOT NULL DEFAULT 1,
  version_label VARCHAR(20) NOT NULL DEFAULT 'V01',
  status VARCHAR(64) NOT NULL DEFAULT 'draft',
  compiled_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_video_prompts_project ON video_prompts(video_project_id);
CREATE INDEX IF NOT EXISTS idx_video_prompts_scene ON video_prompts(scene_id);
CREATE INDEX IF NOT EXISTS idx_video_prompts_provider ON video_prompts(provider);

CREATE TABLE IF NOT EXISTS video_prompt_versions (
  id VARCHAR(100) PRIMARY KEY,
  prompt_id VARCHAR(100) NOT NULL REFERENCES video_prompts(id) ON DELETE CASCADE,
  video_project_id VARCHAR(100) NOT NULL REFERENCES video_projects(id) ON DELETE CASCADE,
  scene_id VARCHAR(100),
  version INTEGER NOT NULL,
  version_label VARCHAR(20) NOT NULL,
  provider VARCHAR(64) NOT NULL,
  model VARCHAR(100) NOT NULL,
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  reference_assets JSONB NOT NULL DEFAULT '[]'::jsonb,
  parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
  compiled_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  change_summary TEXT,
  created_by VARCHAR(255) NOT NULL DEFAULT 'Sistema',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_video_prompt_versions_prompt ON video_prompt_versions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_video_prompt_versions_project ON video_prompt_versions(video_project_id);
