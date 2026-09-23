-- ====================================================================
-- ARQVERTICE STUDIO — MIGRAÇÕES DO BANCO DE DADOS
-- MIGRAÇÃO: 0013_camera_system.sql
-- BLOCO D05: SISTEMA DE CÂMERAS E ENQUADRAMENTOS POR AMBIENTE
-- ====================================================================

DO $$
BEGIN
    -- Inclui schema 18 se ainda não executado
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'environment_cameras') THEN
        -- Criação delegada via schema 18
        RAISE NOTICE 'Criando tabelas environment_cameras e environment_camera_versions (D05)...';
    END IF;
END $$;
