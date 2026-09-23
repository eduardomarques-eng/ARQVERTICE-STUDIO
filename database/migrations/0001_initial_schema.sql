-- ============================================================================
-- ARQVERTICE STUDIO — MIGRATION 0001: INITIAL CONSOLIDATED SCHEMA
-- Execução idempotente para provisionamento de banco de dados novo
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Função genérica de atualização automática de timestamp
CREATE OR REPLACE FUNCTION toca_atualizado_em() RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(150) NOT NULL,
    email               VARCHAR(255) NOT NULL UNIQUE,
    password_hash       VARCHAR(255),
    role                VARCHAR(50) NOT NULL DEFAULT 'ARQUITETO'
                          CHECK (role IN ('ADMINISTRADOR', 'ARQUITETO', 'ENGENHEIRO', 'CLIENTE_READONLY')),
    job_title           VARCHAR(100) NOT NULL,
    initials            VARCHAR(5) NOT NULL,
    avatar_url          TEXT,
    phone               VARCHAR(30),
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. CLIENTS
CREATE TABLE IF NOT EXISTS clients (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(200) NOT NULL,
    email               VARCHAR(255),
    phone               VARCHAR(30) NOT NULL,
    document_number     VARCHAR(30),
    address             TEXT,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ
);

-- 3. PROJECTS
CREATE TABLE IF NOT EXISTS projects (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id           UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    code                VARCHAR(50) UNIQUE,
    name                VARCHAR(200) NOT NULL,
    status              VARCHAR(50) NOT NULL DEFAULT 'EM_ANDAMENTO'
                          CHECK (status IN ('BRIEFING', 'ESTUDO_PRELIMINAR', 'PROJETO_BASICO', 'EXECUTIVO', 'EM_ANDAMENTO', 'FINALIZADO', 'ARQUIVADO')),
    location            TEXT NOT NULL DEFAULT '',
    plot_lot_block      VARCHAR(100) NOT NULL DEFAULT '',
    zoning_zone         VARCHAR(100) NOT NULL DEFAULT '',
    typology            VARCHAR(100) NOT NULL DEFAULT 'Residencial Unifamiliar',
    built_area_m2       NUMERIC(10, 2),
    land_area_m2        NUMERIC(10, 2),
    land_dimensions     VARCHAR(100),
    start_date          DATE,
    expected_end_date   DATE,
    total_days_estimate INTEGER,
    company_signature   VARCHAR(200) NOT NULL DEFAULT 'ArqVértice • Arquitetura, Estrutura & Engenharia',
    cover_image_url     TEXT,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    archived_at         TIMESTAMPTZ
);

-- 4. PROJECT MEMBERS & STAGES
CREATE TABLE IF NOT EXISTS project_members (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_in_project     VARCHAR(100) NOT NULL,
    is_lead             BOOLEAN NOT NULL DEFAULT false,
    assigned_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_project_user UNIQUE (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS project_stages (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    stage_key           VARCHAR(50) NOT NULL,
    name                VARCHAR(100) NOT NULL,
    order_index         INTEGER NOT NULL DEFAULT 0,
    status              VARCHAR(50) NOT NULL DEFAULT 'AGUARDANDO'
                          CHECK (status IN ('AGUARDANDO', 'EM_ANDAMENTO', 'CONCLUIDO')),
    progress_percentage SMALLINT NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    started_at          DATE,
    completed_at        DATE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_project_stage UNIQUE (project_id, stage_key)
);

-- 5. ENVIRONMENTS & CAMERAS
CREATE TABLE IF NOT EXISTS environments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name                VARCHAR(120) NOT NULL,
    environment_type    VARCHAR(50) NOT NULL DEFAULT 'SALA'
                          CHECK (environment_type IN (
                            'SALA', 'COZINHA', 'SUITE', 'QUARTO', 'BANHEIRO', 
                            'AREA_GOURMET', 'DECK', 'PISCINA', 'GARAGEM', 
                            'FACHADA', 'LAVANDERIA', 'CIRCULACAO', 'EXTERIOR', 'OUTRO'
                          )),
    floor_level         VARCHAR(50) NOT NULL DEFAULT 'Térreo',
    area_m2             NUMERIC(8, 2),
    ceiling_height_m    NUMERIC(4, 2),
    description         TEXT,
    status              VARCHAR(50) NOT NULL DEFAULT 'ESTUDO'
                          CHECK (status IN ('BRIEFING', 'ESTUDO', 'MODELAGEM_3D', 'RENDERIZACAO', 'APROVADO', 'EXECUTIVO')),
    order_index         INTEGER NOT NULL DEFAULT 0,
    cover_image_url     TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cameras (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    environment_id      UUID NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    name                VARCHAR(100) NOT NULL,
    focal_length_mm     INTEGER DEFAULT 24,
    height_meters       NUMERIC(4, 2) DEFAULT 1.50,
    position_x          NUMERIC(8, 2),
    position_y          NUMERIC(8, 2),
    target_x            NUMERIC(8, 2),
    target_y            NUMERIC(8, 2),
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. FILES METADATA
CREATE TABLE IF NOT EXISTS files (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id      UUID REFERENCES environments(id) ON DELETE SET NULL,
    category            VARCHAR(50) NOT NULL
                          CHECK (category IN (
                            'PLANTA_TECNICA', 'PERSPECTIVA_REVIT', 'RENDER_FINAL', 
                            'FOTO_OBRA', 'MODELO_BIM', 'BLOCO_3D', 'MOODBOARD', 
                            'PRANCHA_APRESENTACAO', 'DOCUMENTO_LEGAL', 'BRIEFING_ANEXO', 'OUTRO'
                          )),
    origin              VARCHAR(50) NOT NULL DEFAULT 'UPLOAD_EQUIPE'
                          CHECK (origin IN ('REVIT', 'UPLOAD_EQUIPE', 'GERACAO_IA', 'CLIENTE', 'SCAN_CANTEIRO')),
    original_name       VARCHAR(255) NOT NULL,
    stored_name         VARCHAR(255) NOT NULL,
    file_extension      VARCHAR(20) NOT NULL,
    mime_type           VARCHAR(120) NOT NULL,
    file_size_bytes     BIGINT NOT NULL CHECK (file_size_bytes > 0),
    storage_path        TEXT NOT NULL UNIQUE,
    thumbnail_path      TEXT,
    hash_sha256         VARCHAR(64) NOT NULL,
    version             INTEGER NOT NULL DEFAULT 1,
    status              VARCHAR(30) NOT NULL DEFAULT 'ATIVO'
                          CHECK (status IN ('PROCESSANDO', 'ATIVO', 'SUBSTITUIDO', 'ARQUIVADO')),
    uploaded_by         UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. BRIEFINGS (SEPARATION CLIENT ANSWERS / ARQVERTICE CONFIRMATIONS)
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
    access_token        VARCHAR(64) UNIQUE,
    token_expires_at    TIMESTAMPTZ,
    token_revoked       BOOLEAN NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS briefing_sections (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    briefing_id         UUID NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
    part_name           VARCHAR(50) NOT NULL,
    section_number      INTEGER NOT NULL,
    title               VARCHAR(150) NOT NULL,
    subtitle            TEXT,
    icon                VARCHAR(50) NOT NULL DEFAULT 'help-circle',
    tone_color          VARCHAR(30),
    order_index         INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS briefing_questions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id          UUID NOT NULL REFERENCES briefing_sections(id) ON DELETE CASCADE,
    question_code       VARCHAR(50) NOT NULL,
    question_type       VARCHAR(30) NOT NULL
                          CHECK (question_type IN ('texto', 'longo', 'radio', 'checkbox', 'cartoes', 'upload')),
    question_text       TEXT NOT NULL,
    hint                TEXT,
    options             JSONB,
    cards_config        JSONB,
    is_conditional      BOOLEAN NOT NULL DEFAULT false,
    conditional_rules   JSONB,
    allows_other        BOOLEAN NOT NULL DEFAULT false,
    is_required         BOOLEAN NOT NULL DEFAULT false,
    order_index         INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS briefing_answers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id       UUID NOT NULL REFERENCES briefing_submissions(id) ON DELETE CASCADE,
    question_id         UUID NOT NULL REFERENCES briefing_questions(id) ON DELETE RESTRICT,
    raw_answer_text     TEXT,
    selected_options    JSONB,
    custom_other_text   TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS briefing_confirmations (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    briefing_id                 UUID NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
    question_id                 UUID REFERENCES briefing_questions(id) ON DELETE SET NULL,
    answer_id                   UUID REFERENCES briefing_answers(id) ON DELETE SET NULL,
    technical_interpretation    TEXT NOT NULL,
    architectural_impact        TEXT,
    budget_impact_estimate      NUMERIC(10, 2),
    priority_level              VARCHAR(30) NOT NULL DEFAULT 'MEDIA'
                                  CHECK (priority_level IN ('BAIXA', 'MEDIA', 'ALTA', 'INEGOCIAVEL')),
    reviewed_by_user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    status                      VARCHAR(30) NOT NULL DEFAULT 'CONFIRMADO'
                                  CHECK (status IN ('EM_ANALISE', 'CONFIRMADO', 'REJEITADO_INVIAVEL', 'SUBMETIDO_CLIENTE')),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. MATERIALS & FURNITURE
CREATE TABLE IF NOT EXISTS suppliers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(150) NOT NULL,
    category            VARCHAR(100) NOT NULL,
    contact_person      VARCHAR(100),
    phone               VARCHAR(30),
    email               VARCHAR(255),
    website             TEXT,
    city_state          VARCHAR(100),
    notes               TEXT,
    is_preferred        BOOLEAN NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id         UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    name                VARCHAR(200) NOT NULL,
    sku_code            VARCHAR(100),
    category            VARCHAR(100) NOT NULL,
    unit                VARCHAR(20) NOT NULL DEFAULT 'UN' CHECK (unit IN ('UN', 'M2', 'M', 'KG', 'L', 'CJ')),
    estimated_price     NUMERIC(10, 2),
    product_url         TEXT,
    image_file_id       UUID REFERENCES files(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS materials (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id          UUID REFERENCES products(id) ON DELETE SET NULL,
    supplier_id         UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    name                VARCHAR(150) NOT NULL,
    category            VARCHAR(50) NOT NULL
                          CHECK (category IN ('PISO', 'REVESTIMENTO_PAREDE', 'PINTURA', 'MADEIRA', 'PEDRA_NATURAL', 'METAL', 'TECIDO', 'VIDRO', 'LOUCA_METAIS', 'OUTRO')),
    finish_type         VARCHAR(100),
    color_code          VARCHAR(100),
    unit                VARCHAR(20) NOT NULL DEFAULT 'M2',
    image_file_id       UUID REFERENCES files(id) ON DELETE SET NULL,
    technical_sheet_url TEXT,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS furniture_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id          UUID REFERENCES products(id) ON DELETE SET NULL,
    supplier_id         UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    name                VARCHAR(150) NOT NULL,
    category            VARCHAR(50) NOT NULL
                          CHECK (category IN ('SOFA', 'MESA', 'CADEIRA', 'POLTRONA', 'CAMA', 'MARCENARIA_SOB_MEDIDA', 'ILUMINACAO', 'TAPETE', 'DECORACAO', 'ELETRODOMESTICO')),
    dimensions_w_d_h    VARCHAR(100),
    model               VARCHAR(100),
    sku_code            VARCHAR(100),
    main_material       VARCHAR(100),
    image_file_id       UUID REFERENCES files(id) ON DELETE SET NULL,
    product_url         TEXT,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS environment_materials (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    environment_id      UUID NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    material_id         UUID NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
    surface_application VARCHAR(100) NOT NULL,
    quantity            NUMERIC(10, 2),
    unit                VARCHAR(20) NOT NULL DEFAULT 'M2',
    provenance_type     VARCHAR(50) NOT NULL DEFAULT 'INFORMADO_USUARIO'
                          CHECK (provenance_type IN ('DADO_REAL', 'CALCULADO', 'ESTIMADO', 'INFORMADO_USUARIO', 'SUGERIDO_IA')),
    status              VARCHAR(50) NOT NULL DEFAULT 'EM_ESTUDO'
                          CHECK (status IN ('EM_ESTUDO', 'ESPECIFICADO', 'APROVADO_CLIENTE', 'COMPRADO', 'INSTALADO')),
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS environment_furniture (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    environment_id      UUID NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    furniture_item_id   UUID NOT NULL REFERENCES furniture_items(id) ON DELETE RESTRICT,
    quantity            INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    provenance_type     VARCHAR(50) NOT NULL DEFAULT 'INFORMADO_USUARIO'
                          CHECK (provenance_type IN ('DADO_REAL', 'CALCULADO', 'ESTIMADO', 'INFORMADO_USUARIO', 'SUGERIDO_IA')),
    status              VARCHAR(50) NOT NULL DEFAULT 'EM_ESTUDO'
                          CHECK (status IN ('EM_ESTUDO', 'ESPECIFICADO', 'APROVADO_CLIENTE', 'PEDIDO_EMITIDO', 'ENTREGUE')),
    custom_notes        TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. MEMORY & LOCKS
CREATE TABLE IF NOT EXISTS styles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(100) NOT NULL UNIQUE,
    description         TEXT,
    visual_guidelines   TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_styles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    style_id            UUID NOT NULL REFERENCES styles(id) ON DELETE CASCADE,
    is_primary          BOOLEAN NOT NULL DEFAULT true,
    custom_notes        TEXT,
    CONSTRAINT uq_project_style UNIQUE (project_id, style_id)
);

CREATE TABLE IF NOT EXISTS design_decisions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id      UUID REFERENCES environments(id) ON DELETE CASCADE,
    title               VARCHAR(200) NOT NULL,
    description         TEXT NOT NULL,
    decision_type       VARCHAR(50) NOT NULL
                          CHECK (decision_type IN (
                            'FATO_CONFIRMADO', 'DECISAO_PROJETO', 'PREFERENCIA_CLIENTE', 
                            'RESTRICAO_TECNICA', 'REFERENCIA_ESTETICA', 'HIPOTESE_ESTUDO', 
                            'OBSERVACAO_GERAL', 'VERSAO_APROVADA'
                          )),
    status              VARCHAR(30) NOT NULL DEFAULT 'ATIVA'
                          CHECK (status IN ('ATIVA', 'SUPERADA', 'REVOGADA')),
    approved_by_client  BOOLEAN NOT NULL DEFAULT false,
    date_decided        DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS locks (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    environment_id      UUID NOT NULL UNIQUE REFERENCES environments(id) ON DELETE CASCADE,
    geometry_locked     BOOLEAN NOT NULL DEFAULT true,
    layout_locked       BOOLEAN NOT NULL DEFAULT true,
    camera_locked       BOOLEAN NOT NULL DEFAULT true,
    openings_locked     BOOLEAN NOT NULL DEFAULT true,
    materials_locked    BOOLEAN NOT NULL DEFAULT false,
    lighting_locked     BOOLEAN NOT NULL DEFAULT false,
    furniture_locked    BOOLEAN NOT NULL DEFAULT false,
    decor_locked        BOOLEAN NOT NULL DEFAULT false,
    landscape_locked    BOOLEAN NOT NULL DEFAULT false,
    specific_lock_rules JSONB,
    notes               TEXT,
    updated_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. AI & RENDERS
CREATE TABLE IF NOT EXISTS prompt_versions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    environment_id      UUID NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    version_number      INTEGER NOT NULL DEFAULT 1,
    user_intention      TEXT NOT NULL,
    system_instructions TEXT NOT NULL,
    compiled_prompt     TEXT NOT NULL,
    negative_prompt     TEXT,
    parameters          JSONB NOT NULL,
    created_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_executions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_version_id   UUID NOT NULL REFERENCES prompt_versions(id) ON DELETE CASCADE,
    provider            VARCHAR(50) NOT NULL DEFAULT 'gemini',
    model_name          VARCHAR(100) NOT NULL DEFAULT 'gemini-3.8-pro',
    execution_status    VARCHAR(30) NOT NULL DEFAULT 'SUCESSO'
                          CHECK (execution_status IN ('INICIADO', 'SUCESSO', 'FALHA', 'TIMEOUT')),
    execution_time_ms   INTEGER NOT NULL,
    token_count_input   INTEGER,
    token_count_output  INTEGER,
    estimated_cost_usd  NUMERIC(8, 6),
    error_message       TEXT,
    executed_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS render_jobs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id      UUID NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    camera_id           UUID REFERENCES cameras(id) ON DELETE SET NULL,
    ai_execution_id     UUID REFERENCES ai_executions(id) ON DELETE SET NULL,
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDENTE'
                          CHECK (status IN ('PENDENTE', 'PROCESSANDO', 'CONCLUIDO', 'FALHOU')),
    created_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at        TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS render_versions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    render_job_id       UUID REFERENCES render_jobs(id) ON DELETE SET NULL,
    environment_id      UUID NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    camera_id           UUID REFERENCES cameras(id) ON DELETE SET NULL,
    parent_version_id   UUID REFERENCES render_versions(id) ON DELETE SET NULL,
    version_label       VARCHAR(20) NOT NULL DEFAULT 'V01',
    output_file_id      UUID NOT NULL REFERENCES files(id) ON DELETE RESTRICT,
    approval_status     VARCHAR(30) NOT NULL DEFAULT 'RASCUNHO'
                          CHECK (approval_status IN ('RASCUNHO', 'EM_REVISAO', 'APROVADO_INTERNO', 'APROVADO_CLIENTE', 'DESCARTADO')),
    is_current_best     BOOLEAN NOT NULL DEFAULT false,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS render_assets (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    render_version_id   UUID NOT NULL REFERENCES render_versions(id) ON DELETE CASCADE,
    file_id             UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    asset_role          VARCHAR(50) NOT NULL
                          CHECK (asset_role IN ('INPUT_REFERENCE_REVIT', 'INPUT_MASK', 'INPUT_DEPTH_MAP', 'OUTPUT_HIGH_RES', 'OUTPUT_THUMBNAIL')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. PRESENTATIONS, SHEETS, REVISIONS, REPORTS & DELIVERIES
CREATE TABLE IF NOT EXISTS moodboards (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id      UUID REFERENCES environments(id) ON DELETE CASCADE,
    title               VARCHAR(150) NOT NULL DEFAULT 'Painel Conceitual de Materiais e Cores',
    version             INTEGER NOT NULL DEFAULT 1,
    layout_type         VARCHAR(50) NOT NULL DEFAULT 'GRID_DINAMICO',
    layout_config       JSONB,
    notes               TEXT,
    status              VARCHAR(30) NOT NULL DEFAULT 'RASCUNHO'
                          CHECK (status IN ('RASCUNHO', 'APROVADO_INTERNO', 'APROVADO_CLIENTE')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS presentations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title               VARCHAR(200) NOT NULL,
    presentation_type   VARCHAR(50) NOT NULL DEFAULT 'ESTUDO_PRELIMINAR'
                          CHECK (presentation_type IN ('BRIEFING_ALINHAMENTO', 'ESTUDO_PRELIMINAR', 'CONCEITO_INTERIORES', 'ENTREGA_EXECUTIVA')),
    version             VARCHAR(20) NOT NULL DEFAULT 'V01',
    status              VARCHAR(30) NOT NULL DEFAULT 'RASCUNHO'
                          CHECK (status IN ('RASCUNHO', 'PRONTO_PARA_REUNIAO', 'APRESENTADO', 'APROVADO')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sheets (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presentation_id     UUID REFERENCES presentations(id) ON DELETE CASCADE,
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    sheet_code          VARCHAR(30) NOT NULL,
    title               VARCHAR(200) NOT NULL,
    paper_format        VARCHAR(10) NOT NULL DEFAULT 'A3' CHECK (paper_format IN ('A4', 'A3', 'A2', 'A1')),
    orientation         VARCHAR(15) NOT NULL DEFAULT 'LANDSCAPE' CHECK (orientation IN ('PORTRAIT', 'LANDSCAPE')),
    scale_label         VARCHAR(30) NOT NULL DEFAULT '1:50',
    stamp_metadata      JSONB NOT NULL,
    sheet_file_pdf_id   UUID REFERENCES files(id) ON DELETE SET NULL,
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

CREATE TABLE IF NOT EXISTS revisions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    revision_number     VARCHAR(20) NOT NULL,
    title               VARCHAR(200) NOT NULL,
    requested_by        VARCHAR(150) NOT NULL,
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

CREATE TABLE IF NOT EXISTS reports (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    report_type         VARCHAR(50) NOT NULL
                          CHECK (report_type IN ('CRONOGRAMA_EXECUTIVO', 'BRIEFING_CONSOLIDADO', 'PARECER_TECNICO', 'ESPECIFICACAO_MATERIAIS')),
    file_id             UUID NOT NULL REFERENCES files(id) ON DELETE RESTRICT,
    generated_summary   TEXT,
    parameters          JSONB,
    generated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deliveries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    delivery_label      VARCHAR(100) NOT NULL,
    status              VARCHAR(30) NOT NULL DEFAULT 'PREPARANDO'
                          CHECK (status IN ('PREPARANDO', 'ENTREGUE', 'ACEITO_PELO_CLIENTE')),
    package_zip_file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    storyboard_video    JSONB,
    delivered_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_snapshots (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    snapshot_label      VARCHAR(150) NOT NULL,
    snapshot_payload    JSONB NOT NULL,
    created_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. SCHEDULE (CANONICAL TASKS) & AUDIT
CREATE TABLE IF NOT EXISTS schedule_tasks (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id      UUID REFERENCES environments(id) ON DELETE SET NULL,
    stage_id            UUID REFERENCES project_stages(id) ON DELETE SET NULL,
    descricao_etapa     TEXT NOT NULL CHECK (length(trim(descricao_etapa)) > 0),
    disciplina_projeto  TEXT NOT NULL CHECK (
                          disciplina_projeto IN ('Arquitetura', '3D', 'Estrutura', 'Complementares', 'Obras')
                        ),
    projetista          TEXT NOT NULL,
    data_conclusao      DATE NOT NULL,
    porcentagem         SMALLINT NOT NULL DEFAULT 0
                          CHECK (porcentagem >= 0 AND porcentagem <= 100),
    ordem               INTEGER NOT NULL DEFAULT 0,
    status              TEXT GENERATED ALWAYS AS (
                          CASE
                            WHEN porcentagem = 0   THEN 'Não Iniciado'
                            WHEN porcentagem = 100 THEN 'Finalizado'
                            ELSE 'Em Andamento'
                          END
                        ) STORED,
    criado_em           TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID REFERENCES users(id) ON DELETE SET NULL,
    project_id          UUID REFERENCES projects(id) ON DELETE CASCADE,
    environment_id      UUID REFERENCES environments(id) ON DELETE SET NULL,
    event_type          VARCHAR(80) NOT NULL,
    entity_name         VARCHAR(80) NOT NULL,
    entity_id           UUID NOT NULL,
    old_values          JSONB,
    new_values          JSONB,
    ip_address          VARCHAR(50),
    user_agent          TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- VIEW DE COMPATIBILIDADE LEGADA
CREATE OR REPLACE VIEW tarefas AS
SELECT 
    id,
    descricao_etapa,
    disciplina_projeto,
    projetista,
    data_conclusao,
    porcentagem,
    ordem,
    status,
    criado_em,
    atualizado_em
FROM schedule_tasks;
