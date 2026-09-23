-- ============================================================================
-- ARQVERTICE STUDIO — MIGRAÇÃO 0011: MOTOR DE PLANTA HUMANIZADA (D03)
-- ============================================================================

\i database/schema/16_humanized_plan_engine.sql;

COMMENT ON TABLE humanized_plans IS 'Planos mestres de plantas humanizadas com metadados técnicos de escala e resolução.';
COMMENT ON TABLE humanized_plan_versions IS 'Versões de plantas humanizadas derivadas de fontes geométricas originais com modos A e B.';
COMMENT ON TABLE humanized_plan_generations IS 'Auditoria de gerações de IA, parâmetros e rastreabilidade de erros.';
