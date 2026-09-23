-- ============================================================================
-- ARQVERTICE STUDIO — SCHEMA 01: CORE (USUÁRIOS, CLIENTES E PROJETOS)
-- ============================================================================

-- Extensões essenciais do PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Função genérica de atualização automática de timestamp
CREATE OR REPLACE FUNCTION toca_atualizado_em() RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- 1. USUÁRIOS (EQUIPE TÉCNICA E ADMINISTRADORES)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(150) NOT NULL,
    email               VARCHAR(255) NOT NULL UNIQUE,
    password_hash       VARCHAR(255), -- Nulo se autenticado via provedor OAuth/SSO
    role                VARCHAR(50) NOT NULL DEFAULT 'ARQUITETO'
                          CHECK (role IN ('ADMINISTRADOR', 'ARQUITETO', 'ENGENHEIRO', 'CLIENTE_READONLY')),
    job_title           VARCHAR(100) NOT NULL, -- Ex: 'Arquiteto Projetista', 'Engenheiro Calculista'
    initials            VARCHAR(5) NOT NULL,    -- Ex: 'EM', 'LA', 'ES'
    avatar_url          TEXT,
    phone               VARCHAR(30),
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION toca_atualizado_em();

-- ---------------------------------------------------------------------------
-- 2. CLIENTES (CONTRATANTES)
-- 1 Cliente pode possuir múltiplos Projetos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(200) NOT NULL,
    email               VARCHAR(255),
    phone               VARCHAR(30) NOT NULL,
    document_number     VARCHAR(30), -- CPF ou CNPJ
    address             TEXT,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ  -- Soft delete
);

CREATE INDEX IF NOT EXISTS idx_clients_name  ON clients (name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients (email);

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION toca_atualizado_em();

-- ---------------------------------------------------------------------------
-- 3. PROJETOS (OBRAS E EMPREENDIMENTOS)
-- Desacoplado do antigo modelo singleton (CHECK id = 1 eliminado)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id           UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    code                VARCHAR(50) UNIQUE, -- Código interno da ArqVértice (ex: 'PRJ-2026-001')
    name                VARCHAR(200) NOT NULL,
    status              VARCHAR(50) NOT NULL DEFAULT 'EM_ANDAMENTO'
                          CHECK (status IN ('BRIEFING', 'ESTUDO_PRELIMINAR', 'PROJETO_BASICO', 'EXECUTIVO', 'EM_ANDAMENTO', 'FINALIZADO', 'ARQUIVADO')),
    location            TEXT NOT NULL DEFAULT '',
    plot_lot_block      VARCHAR(100) NOT NULL DEFAULT '', -- Lote e Quadra
    zoning_zone         VARCHAR(100) NOT NULL DEFAULT '', -- Ex: 'ZR-1'
    typology            VARCHAR(100) NOT NULL DEFAULT 'Residencial Unifamiliar',
    built_area_m2       NUMERIC(10, 2), -- Valor numérico real para cálculos
    land_area_m2        NUMERIC(10, 2), -- Área real do lote
    land_dimensions     VARCHAR(100),   -- Ex: '15m x 30m'
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

CREATE INDEX IF NOT EXISTS idx_projects_client ON projects (client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects (status);

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION toca_atualizado_em();

-- ---------------------------------------------------------------------------
-- 4. MEMBROS DA EQUIPE DO PROJETO (ALOCAÇÃO DE PROFISSIONAIS)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_members (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_in_project     VARCHAR(100) NOT NULL, -- Ex: 'Responsável Técnico Arquitetura', 'Calculista'
    is_lead             BOOLEAN NOT NULL DEFAULT false,
    assigned_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_project_user UNIQUE (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_proj ON project_members (project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members (user_id);

-- ---------------------------------------------------------------------------
-- 5. ETAPAS GERAIS DO PROJETO (ESTÁGIOS DE CICLO DE VIDA)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_stages (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    stage_key           VARCHAR(50) NOT NULL, -- 'briefing', 'estudo', 'executivo', 'obra', etc.
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

CREATE TRIGGER trg_project_stages_updated_at
  BEFORE UPDATE ON project_stages
  FOR EACH ROW EXECUTE FUNCTION toca_atualizado_em();
