-- ============================================================================
-- ARQVERTICE STUDIO — SEED 01: DADOS INSTITUCIONAIS, ESTILOS E BRIEFING
-- Carga Inicial das Regras de Negócio e Roteiro de 32 Perguntas
-- ============================================================================

-- 1. ESTILOS ARQUITETÔNICOS HOMOLOGADOS
INSERT INTO styles (id, name, description, visual_guidelines) VALUES
('a1000000-0000-0000-0000-000000000001', 'Minimalista',        'Linhas limpas, essencial, funcional e sem excessos decorativos.', 'Manter paleta neutra, vãos amplos, ausência de molduras e marcenaria oculta.'),
('a1000000-0000-0000-0000-000000000002', 'Rústico / Praiano',  'Madeira natural, pedras brutas, fibras e estética resort.',       'Valorizar madeira maciça, iluminação indireta quente, texturas orgânicas e brises.'),
('a1000000-0000-0000-0000-000000000003', 'Industrial',         'Cimento queimado, estruturas metálicas, conduletes e tijolos.',    'Concreto aparente, serralheria preta, tubulações expostas e iluminação em trilhos.'),
('a1000000-0000-0000-0000-000000000004', 'Contemporâneo',      'Design moderno, elegante, grandes planos de vidro e mármores.',   'Integração visual com a paisagem, forros com sancas iluminadas e pedras nobres.'),
('a1000000-0000-0000-0000-000000000005', 'Clássico',           'Molduras em boiserie, simetria, lustres e acabamentos nobres.',   'Pé-direito imponente, rodapés altos, boiseries nas paredes e mármores brancos.')
ON CONFLICT (name) DO NOTHING;

-- 2. CADASTRO DO ROTEIRO OFICIAL DE BRIEFING DA ARQVÉRTICE (32 PERGUNTAS)
-- Criamos um briefing modelo mestre que serve de template para qualquer novo projeto
DO $$
DECLARE
    v_template_project_id UUID := 'b4b1a8d0-1c32-4e89-9a21-000000000000';
    v_briefing_id UUID := 'b5000000-0000-0000-0000-000000000001';
    v_sec1 UUID := 'b5000000-0000-0000-0000-000000000010';
    v_sec2 UUID := 'b5000000-0000-0000-0000-000000000020';
    v_sec3 UUID := 'b5000000-0000-0000-0000-000000000030';
    v_sec4 UUID := 'b5000000-0000-0000-0000-000000000040';
    v_sec5 UUID := 'b5000000-0000-0000-0000-000000000050';
    v_sec6 UUID := 'b5000000-0000-0000-0000-000000000060';
    v_sec7 UUID := 'b5000000-0000-0000-0000-000000000070';
BEGIN
    -- Sessão Master de Briefing
    INSERT INTO briefings (id, project_id, title, version, status, access_token)
    VALUES (v_briefing_id, v_template_project_id, 'Briefing Oficial ArqVértice', 1, 'CONSOLIDADO', 'brf_praia_pedro_oficial')
    ON CONFLICT (id) DO NOTHING;

    -- Seção 1: Perfil dos Moradores
    INSERT INTO briefing_sections (id, briefing_id, part_name, section_number, title, subtitle, icon, tone_color, order_index)
    VALUES (v_sec1, v_briefing_id, 'Parte 1', 1, 'Perfil dos Moradores ou Usuários', 'Entender a dinâmica de quem vai usar o espaço dita o fluxo do projeto.', 'users', '#3b82f6', 1)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO briefing_questions (section_id, question_code, question_type, question_text, hint, order_index) VALUES
    (v_sec1, 'p1_quem',           'longo', 'Quem vai habitar ou utilizar o espaço?', 'Idade, profissão e hobbies de cada um.', 1),
    (v_sec1, 'p1_rotina',         'longo', 'Como é a rotina da casa ou do comércio?', 'Passam muito tempo fora? Trabalham em home office? Cozinham com frequência?', 2),
    (v_sec1, 'p1_visitas',        'longo', 'Costumam receber visitas?', 'Festas grandes, jantares íntimos, hóspedes que dormem no local?', 3),
    (v_sec1, 'p1_animais',        'longo', 'Existem animais de estimação?', 'Quais, portes e se precisam de espaços específicos.', 4),
    (v_sec1, 'p1_acessibilidade', 'longo', 'Há alguma necessidade de acessibilidade ou cuidado especial?', 'Idosos, cadeirantes, crianças pequenas.', 5);

    -- Seção 2: O Terreno ou Imóvel
    INSERT INTO briefing_sections (id, briefing_id, part_name, section_number, title, subtitle, icon, tone_color, order_index)
    VALUES (v_sec2, v_briefing_id, 'Parte 1', 2, 'O Terreno ou O Imóvel', 'Informações técnicas para iniciar a análise de viabilidade.', 'map', '#10b981', 2)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO briefing_questions (section_id, question_code, question_type, question_text, options, order_index) VALUES
    (v_sec2, 'p2_natureza', 'radio', 'O projeto é uma construção do zero, uma reforma completa ou uma intervenção de interiores?', 
     '["Construção do zero", "Reforma completa", "Intervenção de interiores"]'::jsonb, 1);

    -- Seção 7: Estilo e Estética (Cartões Ilustrados)
    INSERT INTO briefing_sections (id, briefing_id, part_name, section_number, title, subtitle, icon, tone_color, order_index)
    VALUES (v_sec7, v_briefing_id, 'Parte 2', 7, 'Estilo e Estética', 'Direcionamento visual do projeto. Escolha pelas imagens.', 'sparkles', '#8b5cf6', 7)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO briefing_questions (section_id, question_code, question_type, question_text, hint, cards_config, order_index) VALUES
    (v_sec7, 'p7_estilos', 'cartoes', 'Qual destes estilos arquitetônicos mais atrai você?', 'Pode marcar mais de um.',
     '[
       {"valor": "Minimalista",       "ilustracao": "ilu-minimalista",   "desc": "Linhas limpas, essencial, sem excessos"},
       {"valor": "Rústico / Praiano", "ilustracao": "ilu-rustico",       "desc": "Madeira, fibras naturais, estilo resort"},
       {"valor": "Industrial",        "ilustracao": "ilu-industrial",    "desc": "Cimento queimado, metais, tijolinhos"},
       {"valor": "Contemporâneo",     "ilustracao": "ilu-contemporaneo", "desc": "Moderno, elegante, vidros, pedras"},
       {"valor": "Clássico",          "ilustracao": "ilu-classico",      "desc": "Molduras, lustres, acabamentos tradicionais"}
     ]'::jsonb, 1);

END $$;
