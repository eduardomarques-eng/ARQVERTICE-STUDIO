-- ============================================================================
-- ARQVERTICE STUDIO — MIGRATION 0006: CONCEITO E DIRETRIZES CONSOLIDADAS (BLOCO C04)
-- ============================================================================

\i database/schema/11_concept_and_directives.sql

-- Comentário da migração
COMMENT ON TABLE design_concepts IS 'Bloco C04: Conceito geral do projeto, estilos, narrativa e versionamento';
COMMENT ON TABLE design_directives IS 'Bloco C04: Diretrizes visuais, linhas, iluminação e mobiliário';
COMMENT ON TABLE design_preferences IS 'Bloco C04: Elementos desejados x elementos a evitar para renders e visualização';
COMMENT ON TABLE design_palettes IS 'Bloco C04: Paleta cromática e relações materiais';
COMMENT ON TABLE environment_design_directives IS 'Bloco C04: Diretrizes específicas por ambiente com herança e sobreposição hierárquica';
