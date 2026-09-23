-- ============================================================================
-- ARQVERTICE STUDIO — MIGRAÇÃO 0012: PERSPECTIVAS HUMANIZADAS (D04)
-- ============================================================================

\i database/schema/17_humanized_perspectives.sql;

COMMENT ON TABLE humanized_perspectives IS 'Vistas em perspectiva vinculadas a modelos do Revit com preservação da imagem-base.';
COMMENT ON TABLE humanized_perspective_versions IS 'Versões de perspectivas humanizadas com realismo, iluminação, atmosfera e elementos preservados.';
COMMENT ON TABLE approved_visual_outputs IS 'Repositório oficial de entregáveis visuais aprovados (APPROVED_VISUAL_OUTPUT).';
