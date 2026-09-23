-- ============================================================================
-- ARQVERTICE STUDIO — ESQUEMA COMPLETO DE DADOS
-- SEÇÃO 32: SCRIPT ENGINE PARA VÍDEOS (BLOCO G05)
-- ============================================================================

CREATE TABLE IF NOT EXISTS video_scripts (
  id VARCHAR(100) PRIMARY KEY,
  video_project_id VARCHAR(100) NOT NULL REFERENCES video_projects(id) ON DELETE CASCADE,
  format VARCHAR(64) NOT NULL DEFAULT 'roteiro narrado', -- roteiro técnico, roteiro narrado, roteiro institucional, roteiro emocional, roteiro curto, roteiro para redes sociais, roteiro para cliente, roteiro de apresentação profissional
  title VARCHAR(255) NOT NULL,
  version_label VARCHAR(20) NOT NULL DEFAULT 'V01',
  version_number INTEGER NOT NULL DEFAULT 1,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  approved_at TIMESTAMPTZ,
  approved_by VARCHAR(255),
  sections JSONB NOT NULL DEFAULT '[]'::jsonb, -- HOOK, CONTEXTO, DESENVOLVIMENTO, DETALHES, CONCEITO, RESULTADO, ENCERRAMENTO
  total_duration NUMERIC(6,2) NOT NULL DEFAULT 60.0,
  word_count INTEGER NOT NULL DEFAULT 0,
  context_sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by VARCHAR(255) NOT NULL DEFAULT 'Sistema',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS video_script_versions (
  id VARCHAR(100) PRIMARY KEY,
  script_id VARCHAR(100) NOT NULL REFERENCES video_scripts(id) ON DELETE CASCADE,
  video_project_id VARCHAR(100) NOT NULL REFERENCES video_projects(id) ON DELETE CASCADE,
  version_label VARCHAR(20) NOT NULL,
  version_number INTEGER NOT NULL,
  format VARCHAR(64) NOT NULL,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  change_summary TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  approved_at TIMESTAMPTZ,
  approved_by VARCHAR(255),
  created_by VARCHAR(255) NOT NULL DEFAULT 'Sistema',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vs_video_project ON video_scripts(video_project_id);
CREATE INDEX IF NOT EXISTS idx_vs_format ON video_scripts(format);
CREATE INDEX IF NOT EXISTS idx_vs_is_approved ON video_scripts(is_approved);
CREATE INDEX IF NOT EXISTS idx_vsv_script ON video_script_versions(script_id);
CREATE INDEX IF NOT EXISTS idx_vsv_video_project ON video_script_versions(video_project_id);
