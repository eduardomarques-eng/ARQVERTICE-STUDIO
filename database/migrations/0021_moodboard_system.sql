-- ================================================================
-- ARQVERTICE STUDIO
-- MIGRATION: 0021_moodboard_system.sql
-- VERSÃO: E04 — MOODBOARD VISUAL E TÉCNICO
-- ================================================================

-- Criação das estruturas caso não existam
\ir ../schema/26_moodboard_system.sql

-- Carga de Seeds Piloto de Moodboard para o Living do Projeto Praia (prj-praia-01)
INSERT INTO project_moodboards (
  id,
  project_id,
  environment_id,
  moodboard_type,
  title,
  description,
  layout_variant,
  page_format,
  orientation,
  margins,
  grid_columns,
  typography_theme,
  hero_render_id,
  hero_image_url,
  status,
  version_code,
  version_sequence,
  approved_by,
  approved_at,
  rejection_reason,
  notes,
  created_by,
  created_at,
  updated_at
) VALUES (
  'mb-praia-living-01',
  'prj-praia-01',
  'env-living-01',
  'MOODBOARD_ENVIRONMENT',
  'Moodboard Conceitual & Técnico — Living Social & Deck',
  'Composição arquitetônica integrada unindo pedras nobres, marcenaria em carvalho e mobiliário contemporâneo.',
  'HYBRID',
  'A3',
  'LANDSCAPE',
  'NORMAL',
  3,
  'MODERN_SANS',
  'rnd-sala-01',
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=85',
  'APPROVED',
  'V01',
  1,
  'Eduardo Marques',
  CURRENT_TIMESTAMP,
  NULL,
  'Prancha homologada para caderno de apresentação e canteiro de obras.',
  'Eduardo Marques',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO NOTHING;

-- Blocos e Itens do Moodboard Piloto
INSERT INTO project_moodboard_items (
  id,
  moodboard_id,
  item_type,
  title,
  description,
  image_url,
  material_id,
  product_id,
  furniture_id,
  quantity_id,
  color_hex,
  color_name,
  color_code,
  color_usage,
  dimensions_text,
  sku_code,
  manufacturer_name,
  supplier_name,
  reference_category,
  sort_order,
  grid_width,
  card_size,
  is_featured
) VALUES
-- 1. Render Herói
(
  'mbi-01-hero',
  'mb-praia-living-01',
  'RENDER',
  'Render Principal Homologado — Living Integrado',
  'Vista ampla em direção ao deck externo e piscina. Luz solar difusa de entardecer.',
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=85',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL, 'RENDER',
  1, 'FULL', 'HERO', TRUE
),
-- 2. Paleta de Cores: Areia Natural
(
  'mbi-02-col1',
  'mb-praia-living-01',
  'COLOR',
  'Areia Dourada Quente',
  'Tonalidade base inspirada nas dunas litorâneas.',
  NULL, NULL, NULL, NULL, NULL,
  '#E6DAC8', 'Areia Dourada', 'SW 7527', 'Alvenarias e Revestimentos',
  NULL, NULL, NULL, NULL, NULL,
  2, 'THIRD', 'SMALL', FALSE
),
-- 3. Paleta de Cores: Carvalho Natural
(
  'mbi-03-col2',
  'mb-praia-living-01',
  'COLOR',
  'Carvalho Americano',
  'Madeira acolhedora para marcenaria e painéis.',
  NULL, NULL, NULL, NULL, NULL,
  '#A07855', 'Carvalho Mel', 'NCS S 4030-Y30R', 'Painéis e Mobiliário',
  NULL, NULL, NULL, NULL, NULL,
  3, 'THIRD', 'SMALL', FALSE
),
-- 4. Paleta de Cores: Linho Cru
(
  'mbi-04-col3',
  'mb-praia-living-01',
  'COLOR',
  'Linho Cru Off-White',
  'Tecidos e estofamentos com textura natural.',
  NULL, NULL, NULL, NULL, NULL,
  '#F4EFEA', 'Linho Cru', 'PANTONE 11-0601', 'Estofados e Cortinas',
  NULL, NULL, NULL, NULL, NULL,
  4, 'THIRD', 'SMALL', FALSE
),
-- 5. Cartão de Material: Mármore Travertino
(
  'mbi-05-mat',
  'mb-praia-living-01',
  'MATERIAL',
  'Mármore Travertino Navona Levigado',
  'Piso social contínuo e bancadas da cozinha gourmet.',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
  'mat-piso-living-01', 'prod-travertino-navona', NULL, 'qty-praia-sala-piso-01',
  NULL, NULL, NULL, NULL,
  '100 x 100 x 2 cm', 'M-TRAV-NAV-01', 'Granitos do Ceará', 'Granitos do Ceará', 'MATERIAL',
  5, 'HALF', 'LARGE', TRUE
),
-- 6. Cartão de Móvel: Sofá Modular em Linho
(
  'mbi-06-furn',
  'mb-praia-living-01',
  'FURNITURE',
  'Sofá Modular Living em Linho Cru',
  'Sofá em ilha com módulos estofados e chaise longue.',
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  '320 x 110 x 82 cm', 'SOF-MOD-320', 'Artefacto', 'Casual Móveis', 'FURNITURE',
  6, 'HALF', 'LARGE', FALSE
)
ON CONFLICT (id) DO NOTHING;
