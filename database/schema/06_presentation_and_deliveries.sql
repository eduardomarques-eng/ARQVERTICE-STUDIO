-- ============================================================================
-- ARQVERTICE STUDIO — SCHEMA 06: APRESENTAÇÃO, PRANCHAS, REVISÕES E ENTREGAS
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. MOODBOARDS E PAINÉIS CONCEITUAIS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS moodboards (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id      UUID REFERENCES environments(id) ON DELETE CASCADE,
    title               VARCHAR(150) NOT NULL DEFAULT 'Painel Conceitual de Materiais e Cores',
    version             INTEGER NOT NULL DEFAULT 1,
    layout_type         VARCHAR(50) NOT NULL DEFAULT 'GRID_DINAMICO', -- 'GRID_DINAMICO', 'COLAGEM_LIVRE'
    layout_config       JSONB, -- Posições e proporções dos elementos
    notes               TEXT,
    status              VARCHAR(30) NOT NULL DEFAULT 'RASCUNHO'
                          CHECK (status IN ('RASCUNHO', 'APROVADO_INTERNO', 'APROVADO_CLIENTE')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_moodboards_updated_at
  BEFORE UPDATE ON moodboards
  FOR EACH ROW EXECUTE FUNCTION toca_atualizado_em();

CREATE TABLE IF NOT EXISTS moodboard_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moodboard_id        UUID NOT NULL REFERENCES moodboards(id) ON DELETE CASCADE,
    file_id             UUID REFERENCES files(id) ON DELETE SET NULL,
    material_id         UUID REFERENCES materials(id) ON DELETE SET NULL,
    furniture_item_id   UUID REFERENCES furniture_items(id) ON DELETE SET NULL,
    item_label          VARCHAR(150),
    position_x          NUMERIC(6, 2) NOT NULL DEFAULT 0,
    position_y          NUMERIC(6, 2) NOT NULL DEFAULT 0,
    width               NUMERIC(6, 2) NOT NULL DEFAULT 100,
    height              NUMERIC(6, 2) NOT NULL DEFAULT 100,
    order_index         INTEGER NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------------
-- 2. APRESENTAÇÕES E DECKS DE PROJETO
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS presentations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title               VARCHAR(200) NOT NULL,
    presentation_type   VARCHAR(50) NOT NULL DEFAULT 'ESTUDO_PRELIMINAR'
                          CHECK (presentation_type IN (
                            'BRIEFING_ALINHAMENTO', 'ESTUDO_PRELIMINAR', 
                            'CONCEITO_INTERIORES', 'ENTREGA_EXECUTIVA'
                          )),
    version             VARCHAR(20) NOT NULL DEFAULT 'V01',
    status              VARCHAR(30) NOT NULL DEFAULT 'RASCUNHO'
                          CHECK (status IN ('RASCUNHO', 'PRONTO_PARA_REUNIAO', 'APRESENTADO', 'APROVADO')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3. PRANCHAS TÉCNICAS E DE APRESENTAÇÃO (A4, A3, A2, A1)
-- Diagramação formal com carimbos oficiais da ArqVértice
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sheets (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presentation_id     UUID REFERENCES presentations(id) ON DELETE CASCADE,
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    sheet_code          VARCHAR(30) NOT NULL, -- Ex: 'ARQ-01/05', 'INT-02/08'
    title               VARCHAR(200) NOT NULL,
    paper_format        VARCHAR(10) NOT NULL DEFAULT 'A3' CHECK (paper_format IN ('A4', 'A3', 'A2', 'A1')),
    orientation         VARCHAR(15) NOT NULL DEFAULT 'LANDSCAPE' CHECK (orientation IN ('PORTRAIT', 'LANDSCAPE')),
    scale_label         VARCHAR(30) NOT NULL DEFAULT '1:50', -- '1:20', '1:50', '1:100', 'INDICADA'
    stamp_metadata      JSONB NOT NULL, -- Dados do carimbo oficial (Nome do cliente, responsável, RT, data)
    sheet_file_pdf_id   UUID REFERENCES files(id) ON DELETE SET NULL, -- PDF gerado
    order_index         INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sheet_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sheet_id            UUID NOT NULL REFERENCES sheets(id) ON DELETE CASCADE,
    item_type           VARCHAR(50) NOT NULL
                          CHECK (item_type IN ('VIEW_RENDER', 'PLANTA_REVIT', 'TABELA_ACABAMENTOS', 'BLOCO_TEXTO', 'CARIMBO')),
    file_id             UUID REFERENCES files(id) ON DELETE SET NULL,
    box_x               NUMERIC(6, 2) NOT NULL,
    box_y               NUMERIC(6, 2) NOT NULL,
    box_w               NUMERIC(6, 2) NOT NULL,
    box_h               NUMERIC(6, 2) NOT NULL,
    custom_caption      TEXT
);

-- ---------------------------------------------------------------------------
-- 4. CONTROLE FORMAL DE REVISÕES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS revisions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    revision_number     VARCHAR(20) NOT NULL, -- 'R00', 'R01', 'R02'
    title               VARCHAR(200) NOT NULL,
    requested_by        VARCHAR(150) NOT NULL, -- Nome do cliente ou da ArqVértice
    request_date        DATE NOT NULL DEFAULT CURRENT_DATE,
    status              VARCHAR(30) NOT NULL DEFAULT 'ABERTA'
                          CHECK (status IN ('ABERTA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA')),
    completion_date     DATE,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS revision_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    revision_id         UUID NOT NULL REFERENCES revisions(id) ON DELETE CASCADE,
    environment_id      UUID REFERENCES environments(id) ON DELETE SET NULL,
    description         TEXT NOT NULL,
    action_taken        TEXT,
    is_resolved         BOOLEAN NOT NULL DEFAULT false
);

-- ---------------------------------------------------------------------------
-- 5. RELATÓRIOS EXECUTIVOS EMITIDOS (PDF)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reports (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    report_type         VARCHAR(50) NOT NULL
                          CHECK (report_type IN (
                            'CRONOGRAMA_EXECUTIVO', 'BRIEFING_CONSOLIDADO', 
                            'PARECER_TECNICO', 'ESPECIFICACAO_MATERIAIS'
                          )),
    file_id             UUID NOT NULL REFERENCES files(id) ON DELETE RESTRICT, -- PDF gravado no storage
    generated_summary   TEXT, -- O texto do parecer executivo gerado
    parameters          JSONB, -- Filtros utilizados na geração
    generated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 6. PACOTES DE ENTREGA FINAL E ROTEIRO DE VÍDEO
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deliveries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    delivery_label      VARCHAR(100) NOT NULL, -- Ex: 'Entrega Final Consolidada - Residência de Praia'
    status              VARCHAR(30) NOT NULL DEFAULT 'PREPARANDO'
                          CHECK (status IN ('PREPARANDO', 'ENTREGUE', 'ACEITO_PELO_CLIENTE')),
    package_zip_file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    storyboard_video    JSONB, -- Roteiro de cenas, movimentos e prompts para vídeo externo
    delivered_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 7. SNAPSHOTS GERAIS DO PROJETO (BACKUP EM PONTO NO TEMPO)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_snapshots (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    snapshot_label      VARCHAR(150) NOT NULL, -- Ex: 'Marco de Conclusão do Estudo Preliminar'
    snapshot_payload    JSONB NOT NULL,        -- Dados completos serializados das tabelas
    created_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
