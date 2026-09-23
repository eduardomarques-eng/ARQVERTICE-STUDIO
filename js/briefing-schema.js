/**
 * ============================================================================
 * ARQVERTICE STUDIO — SCHEMA DO BRIEFING DO CLIENTE (BLOCO B)
 * Definição Orientada por Schema das 10 Etapas, 32 Perguntas Canônicas,
 * Lógica Condicional e Seleção Visual com Cartões Ilustrados.
 * ============================================================================
 */

const BRIEFING_SECTIONS = [
  {
    step: 1,
    id: 'identificacao',
    title: 'Identificação',
    subtitle: 'Dados básicos do titular e localização da obra',
    icon: 'user-check',
    color: '#6366f1'
  },
  {
    step: 2,
    id: 'perfil',
    title: 'Perfil dos Moradores',
    subtitle: 'Quem vai viver e desfrutar dos novos espaços',
    icon: 'users',
    color: '#8b5cf6'
  },
  {
    step: 3,
    id: 'rotina',
    title: 'Rotina & Convivência',
    subtitle: 'Como é o dia a dia e os momentos de lazer',
    icon: 'clock',
    color: '#06b6d4'
  },
  {
    step: 4,
    id: 'terreno',
    title: 'O Terreno ou Imóvel',
    subtitle: 'Características e particularidades do local',
    icon: 'map-pin',
    color: '#10b981'
  },
  {
    step: 5,
    id: 'ambientes',
    title: 'Programa de Ambientes',
    subtitle: 'Os cômodos e setores indispensáveis no projeto',
    icon: 'layout-grid',
    color: '#f59e0b'
  },
  {
    step: 6,
    id: 'estilo',
    title: 'Estilo & Estética',
    subtitle: 'A atmosfera visual e referências que encantam você',
    icon: 'sparkles',
    color: '#ec4899'
  },
  {
    step: 7,
    id: 'materiais',
    title: 'Materiais & Rejeições',
    subtitle: 'Texturas que você ama e o que não quer de jeito nenhum',
    icon: 'palette',
    color: '#d946ef'
  },
  {
    step: 8,
    id: 'conforto',
    title: 'Iluminação & Tecnologia',
    subtitle: 'Cenários de luz, clima e nível de automação',
    icon: 'lightbulb',
    color: '#eab308'
  },
  {
    step: 9,
    id: 'investimento',
    title: 'Investimento & Referências',
    subtitle: 'Alinhamento financeiro, prazos e envio de arquivos',
    icon: 'wallet',
    color: '#14b8a6'
  },
  {
    step: 10,
    id: 'revisao',
    title: 'Revisão & Envio',
    subtitle: 'Confira todas as suas respostas antes da submissão',
    icon: 'check-circle-2',
    color: '#10b981'
  }
];

const BRIEFING_QUESTIONS = [
  // --------------------------------------------------------------------------
  // ETAPA 1: IDENTIFICAÇÃO
  // --------------------------------------------------------------------------
  {
    id: 'cliente_nome',
    section: 'identificacao',
    code: 'cliente_nome',
    type: 'texto',
    label: 'Nome Completo do(s) Cliente(s)',
    placeholder: 'Ex: Pedro Henrique ou Marina & Carlos Vasconcelos',
    hint: 'Identificação oficial para o contrato e pranchas executivas.',
    required: true
  },
  {
    id: 'cliente_email',
    section: 'identificacao',
    code: 'cliente_email',
    type: 'email',
    label: 'E-mail Principal para Comunicação',
    placeholder: 'seuemail@exemplo.com.br',
    hint: 'Enviaremos os relatórios de confirmação e atualizações por aqui.',
    required: true
  },
  {
    id: 'cliente_telefone',
    section: 'identificacao',
    code: 'cliente_telefone',
    type: 'texto',
    label: 'Telefone / WhatsApp',
    placeholder: '(00) 00000-0000',
    required: true
  },
  {
    id: 'projeto_tipo',
    section: 'identificacao',
    code: 'projeto_tipo',
    type: 'radio',
    label: 'Natureza do Empreendimento',
    options: [
      'Construção Residencial do Zero',
      'Reforma Completa / Retrofit',
      'Interiores de Apartamento',
      'Residência de Praia / Litoral',
      'Comercial / Corporativo'
    ],
    required: true
  },
  {
    id: 'projeto_local',
    section: 'identificacao',
    code: 'projeto_local',
    type: 'texto',
    label: 'Endereço / Condomínio / Cidade da Obra',
    placeholder: 'Ex: Lote 14, Quadra B, Loteamento Praia Bela',
    required: true
  },

  // --------------------------------------------------------------------------
  // ETAPA 2: PERFIL DOS USUÁRIOS
  // --------------------------------------------------------------------------
  {
    id: 'p1_quem',
    section: 'perfil',
    code: 'p1_quem',
    type: 'longo',
    label: 'Quem vai habitar ou utilizar o espaço no dia a dia?',
    placeholder: 'Descreva a quantidade de pessoas, idades, profissões e hobbies...',
    hint: 'Ex: Casal de 35 anos com 2 filhos pequenos (4 e 7 anos). O marido é médico e a esposa arquiteta.',
    required: true
  },
  {
    id: 'p1_animais',
    section: 'perfil',
    code: 'p1_animais',
    type: 'radio',
    label: 'Existem animais de estimação na casa?',
    options: ['Não', 'Sim, cachorro(s)', 'Sim, gato(s)', 'Sim, múltiplos pets'],
    allowsOther: true,
    required: true
  },
  {
    id: 'p1_animais_detalhes',
    section: 'perfil',
    code: 'p1_animais_detalhes',
    type: 'texto',
    label: 'Detalhes dos pets (porte, hábitos e necessidades)',
    placeholder: 'Ex: Golden Retriever que fica na área externa e precisa de espaço com sombra e piso antiderrapante.',
    condition: { field: 'p1_animais', operator: 'not_equals', value: 'Não' }
  },
  {
    id: 'p1_acessibilidade',
    section: 'perfil',
    code: 'p1_acessibilidade',
    type: 'longo',
    label: 'Existe alguma necessidade especial de acessibilidade ou saúde?',
    placeholder: 'Idosos, cadeirantes, alergias severas a poeira, cuidados com pisos escorregadios...',
    hint: 'Se não houver, pode preencher "Nenhuma necessidade especial".'
  },

  // --------------------------------------------------------------------------
  // ETAPA 3: ROTINA & CONVIVÊNCIA
  // --------------------------------------------------------------------------
  {
    id: 'p1_rotina',
    section: 'rotina',
    code: 'p1_rotina',
    type: 'longo',
    label: 'Como é a rotina da casa ao longo da semana?',
    placeholder: 'Horários de saída e chegada, trabalho home office, refeições em família...',
    hint: 'Ex: Durante a semana a casa fica vazia de dia; à noite cozinhamos juntos. Aos fins de semana gostamos de descansar.',
    required: true
  },
  {
    id: 'p1_visitas',
    section: 'rotina',
    code: 'p1_visitas',
    type: 'radio',
    label: 'Com qual frequência e estilo vocês costumam receber visitas?',
    options: [
      'Raramente recebemos visitas (prioridade para privacidade total da família)',
      'Recebemos encontros íntimos (família e amigos próximos para jantares de 4 a 8 pessoas)',
      'Recebemos festas e churrascos frequentes (10 a 25 pessoas nos fins de semana)',
      'Hospedamos familiares e amigos com frequência (necessidade de suíte de hóspedes)'
    ],
    required: true
  },
  {
    id: 'p1_home_office',
    section: 'rotina',
    code: 'p1_home_office',
    type: 'radio',
    label: 'Alguém na residência trabalha em regime Home Office?',
    options: [
      'Não, nenhum trabalho em casa',
      'Sim, uso eventual (1 a 2 dias por semana ou períodos curtos)',
      'Sim, trabalho diário integral (exige isolamento acústico e ergonomia)'
    ],
    required: true
  },

  // --------------------------------------------------------------------------
  // ETAPA 4: O TERRENO OU IMÓVEL
  // --------------------------------------------------------------------------
  {
    id: 'p2_plantas',
    section: 'terreno',
    code: 'p2_plantas',
    type: 'checkbox',
    label: 'Quais documentos ou plantas você já possui?',
    options: [
      'Levantamento Topográfico / Altimétrico',
      'Planta de Arquitetura Aprovada / As-Built',
      'Projeto Estrutural Existente',
      'Projetos de Instalações (Elétrico / Hidráulico)',
      'Convenção e Regulamento de Obras do Condomínio',
      'Não possuo nenhuma planta ainda'
    ],
    required: true
  },
  {
    id: 'p2_condominio',
    section: 'terreno',
    code: 'p2_condominio',
    type: 'longo',
    label: 'O imóvel fica em condomínio fechado ou possui restrições conhecidas?',
    placeholder: 'Regras de recuos, taxa de ocupação, limite de altura de gabarito ou horários de obra...',
    hint: 'Se não souber, a equipe técnica da ArqVértice consultará a administração.'
  },
  {
    id: 'p2_gosta_detesta_local',
    section: 'terreno',
    code: 'p2_gosta_detesta_local',
    type: 'longo',
    label: 'O que você mais valoriza no terreno/imóvel atual?',
    placeholder: 'Ex: Vista privilegiada para o pôr do sol, ventilação nascente, árvores existentes no lote...'
  },

  // --------------------------------------------------------------------------
  // ETAPA 5: PROGRAMA DE AMBIENTES
  // --------------------------------------------------------------------------
  {
    id: 'p8_ambientes',
    section: 'ambientes',
    code: 'p8_ambientes',
    type: 'cartoes',
    label: 'Selecione todos os ambientes que devem fazer parte do seu projeto:',
    hint: 'Pode marcar múltiplos. Cada ambiente selecionado poderá ter perguntas e especificações dedicadas.',
    multiple: true,
    required: true,
    cards: [
      { valor: 'Sala de Estar & Living',            icon: 'armchair',  desc: 'Área social ampla com sofás confortáveis e integração visual' },
      { valor: 'Sala de Jantar Integrada',          icon: 'utensils',  desc: 'Mesa para refeições em família conectada com estar e cozinha' },
      { valor: 'Cozinha Gourmet & Ilha',            icon: 'chef-hat',  desc: 'Ilha de cocção, bancadas nobres e torre quente embutida' },
      { valor: 'Espaço Gourmet / Churrasqueira',    icon: 'flame',     desc: 'Churrasqueira, bancada de chopeira e área externa para receber' },
      { valor: 'Deck Gourmet & Piscina',            icon: 'waves',     desc: 'Piscina com prainha, borda infinita e deck de madeira/pedra' },
      { valor: 'Suíte Master com Closet',           icon: 'bed-double',desc: 'Refúgio do casal com closet privativo e banheiro duplo' },
      { valor: 'Quarto(s) de Filhos / Hóspedes',    icon: 'bed',       desc: 'Dormitórios confortáveis com bancada de estudo e marcenaria' },
      { valor: 'Home Office / Estúdio',             icon: 'laptop',    desc: 'Estação de trabalho silenciosa com luz focada e biblioteca' },
      { valor: 'Home Gym / Academia Particular',    icon: 'dumbbell',  desc: 'Espaço dedicado a treino com espelhos e piso vinílico' },
      { valor: 'Cinema em Casa / Home Theater',     icon: 'tv',        desc: 'Tratamento acústico, telão/painel grande e som embutido' },
      { valor: 'Lavabo Social',                     icon: 'sparkles',  desc: 'Banheiro social decorado com iluminação cênica e bancada nobre' },
      { valor: 'Área de Serviço & Despensa',        icon: 'package',   desc: 'Setor funcional com lavanderia oculta e despensa de apoio' }
    ],
    allowsOther: true
  },
  {
    id: 'p8_integracao',
    section: 'ambientes',
    code: 'p8_integracao',
    type: 'radio',
    label: 'Como você prefere o nível de integração entre as áreas sociais?',
    options: [
      '100% Integrado (Conceito aberto: sala, jantar e cozinha fluindo sem paredes)',
      'Parcialmente Integrado (Cozinha pode ser fechada com portas de correr de vidro/ripado)',
      'Setorizado (Cozinha e salas em espaços totalmente separados e reservados)'
    ],
    required: true
  },
  {
    id: 'p3_sonho',
    section: 'ambientes',
    code: 'p3_sonho',
    type: 'longo',
    label: 'Existe algum detalhe ou ambiente dos sonhos que você não abre mão?',
    placeholder: 'Ex: Uma banheira de imersão com vista para o jardim interno, adega climatizada embutida na marcenaria...'
  },

  // --------------------------------------------------------------------------
  // ETAPA 6: ESTILO & ESTÉTICA (SELEÇÃO VISUAL)
  // --------------------------------------------------------------------------
  {
    id: 'p7_estilos',
    section: 'estilo',
    code: 'p7_estilos',
    type: 'cartoes',
    label: 'Quais destes estilos arquitetônicos mais aproximam do que você imagina?',
    hint: 'Selecione até 3 opções que mais encantam o seu olhar.',
    multiple: true,
    required: true,
    cards: [
      {
        valor: 'Contemporâneo',
        icon: 'building',
        imgUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
        desc: 'Linhas retas elegantes, grandes panos de vidro, mármores nobres e integração visual.'
      },
      {
        valor: 'Rústico / Praiano / Resort',
        icon: 'trees',
        imgUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=600&q=80',
        desc: 'Madeiras maciças, pedras brutas naturais, fibras trançadas e atmosfera de hotel boutique.'
      },
      {
        valor: 'Minimalista',
        icon: 'box',
        imgUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80',
        desc: 'Essencial, sem excessos, marcenaria limpa oculta, cores calmas e geometria pura.'
      },
      {
        valor: 'Industrial Sofisticado',
        icon: 'tool',
        imgUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
        desc: 'Cimento queimado, serralheria preta, metais escuros, concreto aparente e tijolinhos.'
      },
      {
        valor: 'Clássico Contemporâneo',
        icon: 'columns',
        imgUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80',
        desc: 'Boiseries sutis, molduras clássicas reinterpretadas, simetria e sofisticação atemporal.'
      },
      {
        valor: 'Ainda não sei, quero orientação',
        icon: 'help-circle',
        imgUrl: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=600&q=80',
        desc: 'A equipe da ArqVértice apresentará moodboards e propostas personalizadas para sua escolha.'
      }
    ]
  },
  {
    id: 'p7_paleta',
    section: 'estilo',
    code: 'p7_paleta',
    type: 'radio',
    label: 'Qual a sua preferência principal para a paleta cromática?',
    options: [
      'Tons neutros, claros e luminosos (Off-white, areia, linho, bege e cinza suave)',
      'Tons terrosos e texturas minerais (Argila, terracota, palha, carvalho natural)',
      'Tons sóbrios e escuros (Grafite, preto fosco, nogueira escura, couro conhaque)',
      'Base neutra com toques de cores vivas em quadros, almofadas e objetos'
    ],
    required: true
  },

  // --------------------------------------------------------------------------
  // ETAPA 7: MATERIAIS & REJEIÇÕES (O QUE VOCÊ DETESTA)
  // --------------------------------------------------------------------------
  {
    id: 'p4_materiais_ama',
    section: 'materiais',
    code: 'p4_materiais_ama',
    type: 'longo',
    label: 'Quais materiais e texturas você AMA e gostaria de ver no projeto?',
    placeholder: 'Ex: Madeira natural ripada, mármore travertino navona, pedras vulcânicas, linho cru, aço corten...'
  },
  {
    id: 'p7_detesta',
    section: 'materiais',
    code: 'p7_detesta',
    type: 'longo',
    label: 'Existe algum material, cor ou elemento que você DETESTA e não quer de jeito nenhum?',
    placeholder: 'Ex: Odeio porcelanato brilhoso polido, detesto cores amarelas nas paredes, nada de gesso rebaixado com muitas curvas...',
    hint: 'Esta pergunta é fundamental para evitarmos propostas desalinhadas com seu gosto pessoal.',
    required: true
  },

  // --------------------------------------------------------------------------
  // ETAPA 8: ILUMINAÇÃO, CONFORTO & TECNOLOGIA
  // --------------------------------------------------------------------------
  {
    id: 'p9_luz',
    section: 'conforto',
    code: 'p9_luz',
    type: 'radio',
    label: 'Qual sensação de iluminação você prefere nas áreas de descanso e convívio?',
    options: [
      'Quente e aconchegante (Luz amarelada 2700K/3000K, indireta, sancas, arandelas e pendentes)',
      'Fria e bem clara (Luz branca 4000K/5000K, foco em máxima visibilidade e trabalho)',
      'Mista e dimerizável (Luz funcional para o dia a dia e circuitos cênicos indiretos para relaxar)'
    ],
    required: true
  },
  {
    id: 'p9_automacao',
    section: 'conforto',
    code: 'p9_automacao',
    type: 'radio',
    label: 'Qual nível de automação residencial você pretende implementar?',
    options: [
      'Tradicional (Interruptores convencionais com design moderno)',
      'Básica (Controle de iluminação e ar-condicionado via smartphone e Alexa/Google)',
      'Avançada (Controle total de persianas, som embutido multiroom, fechaduras biométricas e câmeras)'
    ],
    required: true
  },

  // --------------------------------------------------------------------------
  // ETAPA 9: INVESTIMENTO, PRAZOS & UPLOAD DE REFERÊNCIAS
  // --------------------------------------------------------------------------
  {
    id: 'p10_orcamento',
    section: 'investimento',
    code: 'p10_orcamento',
    type: 'radio',
    label: 'Qual a sua expectativa de faixa de investimento global para o projeto/obra?',
    hint: 'Esta estimativa nos orienta a especificar materiais e soluções construtivas compatíveis.',
    options: [
      'Até R$ 100.000',
      'De R$ 100.000 a R$ 250.000',
      'De R$ 250.000 a R$ 500.000',
      'De R$ 500.000 a R$ 1.000.000',
      'Acima de R$ 1.000.000',
      'Prefiro definir e alinhar o orçamento com a orientação da ArqVértice'
    ],
    required: true
  },
  {
    id: 'p5_prazo',
    section: 'investimento',
    code: 'p5_prazo',
    type: 'texto',
    label: 'Existe alguma data limite ou evento especial para a entrega da obra?',
    placeholder: 'Ex: Férias de janeiro, nascimento do bebê em novembro, festa de final de ano...'
  },
  {
    id: 'p4_referencias_links',
    section: 'investimento',
    code: 'p4_referencias_links',
    type: 'longo',
    label: 'Links de Pastas no Pinterest, Instagram ou referências da internet',
    placeholder: 'Cole aqui links úteis de projetos que você salvou...',
    hint: 'Você também pode anexar arquivos de imagem logo abaixo.'
  },
  {
    id: 'upload_referencias_fotos',
    section: 'investimento',
    code: 'upload_referencias_fotos',
    type: 'upload',
    label: 'Upload de Fotos, Plantas e Referências Visuais',
    hint: 'Envie fotos do imóvel atual, referências de móveis ou plantas (JPG, PNG, PDF até 20MB cada).'
  }
];

window.BRIEFING_SECTIONS = BRIEFING_SECTIONS;
window.BRIEFING_QUESTIONS = BRIEFING_QUESTIONS;
