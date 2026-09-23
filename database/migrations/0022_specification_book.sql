-- ================================================================
-- ARQVERTICE STUDIO — MIGRAÇÃO 0022
-- 0022_specification_book.sql — BLOCO E05: CADERNO DE ESPECIFICAÇÕES, LISTAS E FICHAS
-- ================================================================

-- 1. Criação das estruturas relacionais
\i database/schema/27_specification_book.sql

-- 2. Inserção de seeds para o Caderno Geral e Caderno do Living da Residência Praia
INSERT INTO project_specification_books (
    id, project_id, environment_id, doc_type, title, subtitle, description,
    version, version_number, status, is_approved, approved_at, approved_by,
    notes, created_by, created_at, updated_at
) VALUES 
(
    'spec-praia-geral-01',
    'prj-praia-01',
    NULL,
    'CADERNO_GERAL',
    'Caderno Geral de Especificações Técnicas & Fichas',
    'Residência Alphaville Eusébio • Dossiê Consolidado de Execução',
    'Consolidação executiva de todos os móveis, revestimentos, materiais, quantitativos, equipamentos e fornecedores da obra.',
    'V01',
    1,
    'APPROVED',
    TRUE,
    '2026-09-21T18:00:00Z',
    'Eduardo Marques',
    'Caderno mestre homologado para coordenação de obra e cotações de fornecedores.',
    'Eduardo Marques',
    '2026-09-21T18:00:00Z',
    '2026-09-21T18:00:00Z'
),
(
    'spec-praia-living-01',
    'prj-praia-01',
    'amb-sala-01',
    'LISTA_MOVEIS',
    'Caderno de Especificação de Mobiliário — Living',
    'Sala de Estar & Jantar Integrada',
    'Relação completa de móveis soltos, marcenaria planejada e estofados especificados.',
    'V01',
    1,
    'APPROVED',
    TRUE,
    '2026-09-21T18:00:00Z',
    'Eduardo Marques',
    'Mobiliário homologado com o cliente titular Pedro.',
    'Eduardo Marques',
    '2026-09-21T18:00:00Z',
    '2026-09-21T18:00:00Z'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Inserção de Entradas Específicas com Fichas Técnicas e Origens Rastreadas
INSERT INTO project_specification_entries (
    id, specification_book_id, project_id, environment_id, category, item_name,
    product_name, collection_name, manufacturer_name, supplier_name, commercial_code,
    finish, material_desc, dimensions, quantity, unit, image_url, external_link,
    consulted_at, notes, origin, furniture_id, material_id, product_id, quantity_id, sort_order
) VALUES
(
    'spe-01',
    'spec-praia-living-01',
    'prj-praia-01',
    'amb-sala-01',
    'MOVEL_SOLTO',
    'Sofá Living 3 Lugares com Chaise',
    'Sofá Living Chaise Especial',
    'Acervo Particular',
    'Acervo Cliente',
    'Cliente',
    'EX-SOFA-01',
    'Impermeabilizado',
    'Linho Natural e Madeira Maciça',
    '280 x 110 x 85 cm',
    1.000,
    'UN',
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
    NULL,
    '2026-09-21T10:00:00Z',
    'Peça existente da cliente; manter conservação.',
    'CONFIRMADO',
    'furn-sofa-01',
    NULL,
    NULL,
    NULL,
    1
),
(
    'spe-02',
    'spec-praia-geral-01',
    'prj-praia-01',
    'amb-sala-01',
    'PEDRA',
    'Mármore Travertino Navona Levigado',
    'Mármore Travertino Navona Romano Levigado',
    'Pedras Naturais Nobres',
    'Pedras Nobres',
    'Marmoraria Granitos do Ceará',
    'M-TRAV-NAV-01',
    'Levigado Fosco',
    'Mármore Natural',
    '100 x 100 x 2 cm',
    121.000,
    'M2',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    'https://granitosceara.com.br/travertino-navona',
    '2026-09-21T10:00:00Z',
    'Quantidade com 10% de perda calculada para assentamento contínuo.',
    'CALCULADO',
    NULL,
    'mat-piso-living-01',
    'prod-travertino-navona',
    'qty-praia-sala-piso-01',
    2
)
ON CONFLICT (id) DO NOTHING;
