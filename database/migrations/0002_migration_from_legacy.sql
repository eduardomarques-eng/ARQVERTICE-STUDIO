-- ============================================================================
-- ARQVERTICE STUDIO — MIGRATION 0002: TRANSIÇÃO SEGURA DA BASE LEGADA
-- Preservação estrita dos dados em produção sem perda nem downtime
-- ============================================================================

BEGIN;

-- 1. Assegurar extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Carregar o novo schema estrutural completo
-- (Se as tabelas já existirem via 0001, nada é sobrescrito)

-- 3. Criar o Cliente Canônico "Pedro" a partir dos dados legados
INSERT INTO clients (id, name, phone, notes)
VALUES (
    'b4b1a8d0-0000-4000-8000-000000000001',
    COALESCE((SELECT cliente FROM projeto WHERE id = 1), 'Pedro'),
    'Não informado',
    'Cliente migrado da versão legada do Cronograma (Residência de Praia)'
) ON CONFLICT (id) DO NOTHING;

-- 4. Criar os Usuários Técnicos Fundadores da ArqVértice
INSERT INTO users (id, name, email, role, job_title, initials) VALUES
('b4b1a8d0-0000-4000-8000-000000000010', 'Eduardo Marques', 'eduardo@arqvertice.com.br', 'ARQUITETO',     'Arquiteto Projetista',  'EM'),
('b4b1a8d0-0000-4000-8000-000000000020', 'Luan Almeida',    'luan@arqvertice.com.br',    'ENGENHEIRO',    'Engenheiro Calculista', 'LA'),
('b4b1a8d0-0000-4000-8000-000000000030', 'Erick Santiago',  'erick@arqvertice.com.br',   'ADMINISTRADOR', 'Engenheiro de Obra',    'ES')
ON CONFLICT (email) DO NOTHING;

-- 5. Migrar a Ficha Técnica Legada ('projeto' id=1) para a nova tabela 'projects'
-- O ID 'b4b1a8d0-1c32-4e89-9a21-000000000000' passa a ser o identificador canônico da Residência de Praia
INSERT INTO projects (
    id, client_id, code, name, status, location, plot_lot_block, zoning_zone,
    typology, built_area_m2, land_area_m2, land_dimensions,
    start_date, expected_end_date, total_days_estimate, company_signature, notes
)
SELECT 
    'b4b1a8d0-1c32-4e89-9a21-000000000000'::uuid AS id,
    'b4b1a8d0-0000-4000-8000-000000000001'::uuid AS client_id,
    'PRJ-PRAIA-01' AS code,
    COALESCE(p.nome_obra, 'Residência de Praia') AS name,
    'EM_ANDAMENTO' AS status,
    p.localizacao,
    p.lote_quadra,
    p.zona,
    p.tipologia,
    385.00 AS built_area_m2, -- Normalização do texto '385,00 m²'
    450.00 AS land_area_m2,  -- Normalização do texto '450,00 m²'
    '15m x 30m' AS land_dimensions,
    '2026-06-12'::date AS start_date,
    '2026-11-30'::date AS expected_end_date,
    172 AS total_days_estimate,
    p.empresa AS company_signature,
    'Projeto importado e preservado da base legada de produção' AS notes
FROM projeto p
WHERE p.id = 1
ON CONFLICT (id) DO NOTHING;

-- 6. Alocar a Equipe Técnica ao Projeto
INSERT INTO project_members (project_id, user_id, role_in_project, is_lead) VALUES
('b4b1a8d0-1c32-4e89-9a21-000000000000', 'b4b1a8d0-0000-4000-8000-000000000010', 'Arquiteto Responsável', true),
('b4b1a8d0-1c32-4e89-9a21-000000000000', 'b4b1a8d0-0000-4000-8000-000000000020', 'Engenheiro Calculista', false),
('b4b1a8d0-1c32-4e89-9a21-000000000000', 'b4b1a8d0-0000-4000-8000-000000000030', 'Gestor de Obra',        false)
ON CONFLICT (project_id, user_id) DO NOTHING;

-- 7. Criar Ambientes Iniciais da Residência de Praia
INSERT INTO environments (id, project_id, name, environment_type, floor_level, order_index) VALUES
('b4b1a8d0-1c32-4e89-9a21-100000000001', 'b4b1a8d0-1c32-4e89-9a21-000000000000', 'Sala de Estar e Jantar', 'SALA',          'Térreo',   1),
('b4b1a8d0-1c32-4e89-9a21-100000000002', 'b4b1a8d0-1c32-4e89-9a21-000000000000', 'Cozinha Integrada',     'COZINHA',       'Térreo',   2),
('b4b1a8d0-1c32-4e89-9a21-100000000003', 'b4b1a8d0-1c32-4e89-9a21-000000000000', 'Deck e Área Gourmet',   'AREA_GOURMET',  'Térreo',   3),
('b4b1a8d0-1c32-4e89-9a21-100000000004', 'b4b1a8d0-1c32-4e89-9a21-000000000000', 'Suíte Master',          'SUITE',         'Superior', 4),
('b4b1a8d0-1c32-4e89-9a21-100000000005', 'b4b1a8d0-1c32-4e89-9a21-000000000000', 'Fachada Principal',     'FACHADA',       'Térreo',   5)
ON CONFLICT (id) DO NOTHING;

-- 8. Migrar TODAS as tarefas legadas para a nova tabela 'schedule_tasks'
-- Injeta o project_id canônico da Residência de Praia sem alterar os UUIDs originais
INSERT INTO schedule_tasks (
    id, project_id, descricao_etapa, disciplina_projeto, projetista,
    data_conclusao, porcentagem, ordem, criado_em, atualizado_em
)
SELECT 
    t.id,
    'b4b1a8d0-1c32-4e89-9a21-000000000000'::uuid AS project_id,
    t.descricao_etapa,
    t.disciplina_projeto,
    t.projetista,
    t.data_conclusao,
    t.porcentagem,
    t.ordem,
    t.criado_em,
    t.atualizado_em
FROM tarefas t
ON CONFLICT (id) DO UPDATE SET
    descricao_etapa = EXCLUDED.descricao_etapa,
    porcentagem = EXCLUDED.porcentagem,
    data_conclusao = EXCLUDED.data_conclusao;

-- 9. Preservação de Compatibilidade Legada
-- Caso a tabela original 'tarefas' seja uma tabela real, renomeamos para backup
-- e criamos a VIEW de compatibilidade.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'tarefas' AND table_type = 'BASE TABLE'
    ) THEN
        ALTER TABLE tarefas RENAME TO tarefas_legado_backup;
        
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
    END IF;
END $$;

-- 10. Remover a trava CHECK (id = 1) da tabela legada 'projeto'
ALTER TABLE projeto DROP CONSTRAINT IF EXISTS projeto_id_check;

-- 11. Validação de Integridade pós-migração
DO $$
DECLARE
    total_migrado INTEGER;
BEGIN
    SELECT count(*) INTO total_migrado FROM schedule_tasks WHERE project_id = 'b4b1a8d0-1c32-4e89-9a21-000000000000';
    IF total_migrado < 14 THEN
        RAISE EXCEPTION 'FALHA DE INTEGRIDADE: Esperado pelo menos 14 tarefas migradas, encontrado %', total_migrado;
    END IF;
    RAISE NOTICE 'SUCESSO: % tarefas da Residência de Praia migradas com integridade absoluta.', total_migrado;
END $$;

COMMIT;
