-- ============================================================================
-- ARQVERTICE STUDIO — SCHEMA 03: BRIEFING (EXTERNO E INTERNO)
-- Separação estrita entre "Resposta do Cliente" e "Interpretação da ArqVértice"
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. SESSÕES DE BRIEFING
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS briefings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title               VARCHAR(200) NOT NULL DEFAULT 'Briefing Executivo de Arquitetura e Interiores',
    version             INTEGER NOT NULL DEFAULT 1,
    status              VARCHAR(50) NOT NULL DEFAULT 'RASCUNHO'
                          CHECK (status IN (
                            'RASCUNHO', 'ENVIADO_CLIENTE', 'PREENCHIDO_CLIENTE', 
                            'EM_REVISAO_TECNICA', 'CONSOLIDADO', 'APROVADO_FINAL', 'ARQUIVADO'
                          )),
    access_token        VARCHAR(64) UNIQUE, -- Token seguro para link público (/briefing/[token])
    token_expires_at    TIMESTAMPTZ,
    token_revoked       BOOLEAN NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_briefings_project ON briefings (project_id);
CREATE INDEX IF NOT EXISTS idx_briefings_token   ON briefings (access_token);

CREATE TRIGGER trg_briefings_updated_at
  BEFORE UPDATE ON briefings
  FOR EACH ROW EXECUTE FUNCTION toca_atualizado_em();

-- ---------------------------------------------------------------------------
-- 2. SEÇÕES DO ROTEIRO DE BRIEFING
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS briefing_sections (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    briefing_id         UUID NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
    part_name           VARCHAR(50) NOT NULL, -- Ex: 'Parte 1', 'Parte 2'
    section_number      INTEGER NOT NULL,     -- 1 a 10
    title               VARCHAR(150) NOT NULL,
    subtitle            TEXT,
    icon                VARCHAR(50) NOT NULL DEFAULT 'help-circle',
    tone_color          VARCHAR(30),
    order_index         INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_briefing_sec_order ON briefing_sections (briefing_id, order_index);

-- ---------------------------------------------------------------------------
-- 3. PERGUNTAS DO BRIEFING (CATÁLOGO DINÂMICO E CONDICIONAL)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS briefing_questions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id          UUID NOT NULL REFERENCES briefing_sections(id) ON DELETE CASCADE,
    question_code       VARCHAR(50) NOT NULL, -- Ex: 'p1_quem', 'p7_estilos'
    question_type       VARCHAR(30) NOT NULL
                          CHECK (question_type IN ('texto', 'longo', 'radio', 'checkbox', 'cartoes', 'upload')),
    question_text       TEXT NOT NULL,
    hint                TEXT,
    options             JSONB, -- Array de strings para radio e checkbox
    cards_config        JSONB, -- Configuração de cartões ilustrados SVG
    is_conditional      BOOLEAN NOT NULL DEFAULT false,
    conditional_rules   JSONB, -- Regras de exibição baseadas em respostas anteriores
    allows_other        BOOLEAN NOT NULL DEFAULT false, -- Adiciona campo livre "Outros"
    is_required         BOOLEAN NOT NULL DEFAULT false,
    order_index         INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_briefing_q_sec ON briefing_questions (section_id, order_index);

-- ---------------------------------------------------------------------------
-- 4. SUBMISSÕES DO CLIENTE (ENVIO FORMAL)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS briefing_submissions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    briefing_id         UUID NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
    submitted_by_name   VARCHAR(150),
    submitted_by_email  VARCHAR(255),
    submitted_by_phone  VARCHAR(50),
    ip_address          VARCHAR(50),
    user_agent          TEXT,
    submitted_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 5. RESPOSTAS ORIGINAIS DO CLIENTE (DADOS BRUTOS INVIOLÁVEIS)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS briefing_answers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id       UUID NOT NULL REFERENCES briefing_submissions(id) ON DELETE CASCADE,
    question_id         UUID NOT NULL REFERENCES briefing_questions(id) ON DELETE RESTRICT,
    raw_answer_text     TEXT,
    selected_options    JSONB, -- Array com opções marcadas
    custom_other_text   TEXT,  -- Texto preenchido no campo "Outros"
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_briefing_ans_sub ON briefing_answers (submission_id);
CREATE INDEX IF NOT EXISTS idx_briefing_ans_q   ON briefing_answers (question_id);

-- ---------------------------------------------------------------------------
-- 6. CONSOLIDAÇÕES E INTERPRETAÇÕES INTERNAS DA ARQVÉRTICE
-- Transformação técnica da fala do cliente em diretrizes de projeto
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS briefing_confirmations (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    briefing_id                 UUID NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
    question_id                 UUID REFERENCES briefing_questions(id) ON DELETE SET NULL,
    answer_id                   UUID REFERENCES briefing_answers(id) ON DELETE SET NULL,
    technical_interpretation    TEXT NOT NULL, -- "O que o escritório entendeu e propõe"
    architectural_impact        TEXT,          -- Ex: "Exigirá pé-direito duplo e viga protendida"
    budget_impact_estimate      NUMERIC(10, 2),
    priority_level              VARCHAR(30) NOT NULL DEFAULT 'MEDIA'
                                  CHECK (priority_level IN ('BAIXA', 'MEDIA', 'ALTA', 'INEGOCIAVEL')),
    reviewed_by_user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    status                      VARCHAR(30) NOT NULL DEFAULT 'CONFIRMADO'
                                  CHECK (status IN ('EM_ANALISE', 'CONFIRMADO', 'REJEITADO_INVIAVEL', 'SUBMETIDO_CLIENTE')),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_briefing_conf_proj ON briefing_confirmations (briefing_id);

CREATE TRIGGER trg_briefing_confirmations_updated_at
  BEFORE UPDATE ON briefing_confirmations
  FOR EACH ROW EXECUTE FUNCTION toca_atualizado_em();
