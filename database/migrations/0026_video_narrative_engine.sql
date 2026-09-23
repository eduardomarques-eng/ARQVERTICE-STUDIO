-- ============================================================================
-- ARQVERTICE STUDIO — BANCO DE DADOS
-- MIGRAÇÃO 0026: NARRATIVE ENGINE DO VÍDEO (BLOCO G04)
-- ============================================================================

CREATE TABLE IF NOT EXISTS video_narrative_scenes (
  id VARCHAR(100) PRIMARY KEY,
  video_project_id VARCHAR(100) NOT NULL REFERENCES video_projects(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL DEFAULT 1,
  title VARCHAR(255) NOT NULL,
  purpose VARCHAR(255) NOT NULL, -- abertura, contexto, conceito, ambiente, entrada, vista_principal, detalhes, materiais, mobiliario, textura, atmosfera, composicao, resultado, encerramento, etc.
  duration NUMERIC(6,2) NOT NULL DEFAULT 5.0,
  asset_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  text TEXT,
  voiceover TEXT,
  transition VARCHAR(50) NOT NULL DEFAULT 'crossfade',
  notes TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vns_video_project ON video_narrative_scenes(video_project_id);
CREATE INDEX IF NOT EXISTS idx_vns_sequence ON video_narrative_scenes(sequence);
CREATE INDEX IF NOT EXISTS idx_vns_purpose ON video_narrative_scenes(purpose);

COMMENT ON TABLE video_narrative_scenes IS 'Cenas narrativas sequenciais geradas pelo Narrative Engine (Bloco G04)';
