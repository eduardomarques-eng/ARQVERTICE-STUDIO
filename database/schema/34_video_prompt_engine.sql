-- ============================================================================
-- ARQVERTICE STUDIO — SCHEMA SECTION 34: VIDEO PROMPT ENGINE (BLOCO G07)
-- ============================================================================

-- Tabela Principal de Prompts de Vídeo Compilados
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

COMMENT ON TABLE video_prompts IS 'Prompts cinematográficos compilados para ferramentas externas de geração audiovisual';
COMMENT ON COLUMN video_prompts.provider IS 'Identificador do provedor (gemini, google_veo, external_video_models, external_tools, local_generator)';
COMMENT ON COLUMN video_prompts.model IS 'Modelo específico (veo-2.0, gemini-1.5-pro, runway-gen3, etc.)';
COMMENT ON COLUMN video_prompts.prompt IS 'Prompt principal com descritores espaciais, materiais e movimento';
COMMENT ON COLUMN video_prompts.negative_prompt IS 'Restrições e elementos a evitar na geração';
COMMENT ON COLUMN video_prompts.parameters IS 'Parâmetros técnicos (duration, fps, aspect_ratio, motion_strength, guidance)';
COMMENT ON COLUMN video_prompts.compiled_data IS 'Contexto completo utilizado na compilação, incluindo declaração expressa de locks';

-- Tabela de Histórico e Versionamento de Prompts (Não-Destrutiva)
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

COMMENT ON TABLE video_prompt_versions IS 'Histórico imutável de versões de prompts gerados para evitar perda de dados';
