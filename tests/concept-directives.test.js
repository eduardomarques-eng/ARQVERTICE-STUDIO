/**
 * ============================================================================
 * ARQVERTICE STUDIO — SUÍTE DE TESTES AUTOMATIZADOS (BLOCO C04)
 * CONCEITO E DIRETRIZES CONSOLIDADAS
 * ============================================================================
 */

// Mock de ambiente para execução pura em Node.js
const memoryStore = {};
global.localStorage = {
  getItem: (k) => memoryStore[k] || null,
  setItem: (k, v) => { memoryStore[k] = String(v); },
  removeItem: (k) => { delete memoryStore[k]; },
  clear: () => { Object.keys(memoryStore).forEach(k => delete memoryStore[k]); }
};
global.window = global;
global.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => []
};
global.escapeHTML = (s) => (s ? String(s).replace(/[&<>"']/g, '') : '');
global.formatDateBR = (d) => d || '';

const assert = require('assert');
const StudioState = require('../js/state.js');
global.StudioState = StudioState;
const ConceptModule = require('../js/concept-module.js');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function it(desc, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${desc}`);
  } catch (err) {
    failedTests++;
    console.error(`  ✗ ${desc}`);
    console.error(`    Erro: ${err.message}`);
  }
}

function describe(suiteName, fn) {
  console.log(`\n--- ${suiteName} ---`);
  fn();
}

console.log('====================================================================');
console.log('ARQVERTICE STUDIO — TESTES DO BLOCO C04 (CONCEITO & DIRETRIZES)');
console.log('====================================================================');

describe('1. Inicialização e Conceito Geral Padrão', () => {
  StudioState.init();

  it('Deve conter a coleção designConcepts inicializada', () => {
    assert(StudioState.data.designConcepts, 'designConcepts deve existir no StudioState');
    assert(Array.isArray(StudioState.data.designConcepts), 'designConcepts deve ser um array');
    assert(StudioState.data.designConcepts.length > 0, 'Deve conter conceitos iniciais');
  });

  it('Deve carregar o conceito consolidado para prj-praia-01', () => {
    const concept = StudioState.getDesignConcept('prj-praia-01');
    assert(concept, 'Conceito do prj-praia-01 deve ser encontrado');
    assert.strictEqual(concept.projectId, 'prj-praia-01');
    assert.strictEqual(concept.status, 'APPROVED');
    assert.strictEqual(concept.version, 'V01');
  });

  it('Deve conter todos os campos fundamentais do Conceito Geral (Item 1 do Prompt)', () => {
    const concept = StudioState.getDesignConcept('prj-praia-01');
    const general = concept.generalConcept;
    assert(general.nome, 'Deve ter nome');
    assert(general.descricao, 'Deve ter descrição');
    assert(general.narrativa, 'Deve ter narrativa');
    assert(Array.isArray(general.objetivos), 'Deve ter objetivos em array');
    assert(Array.isArray(general.referencias), 'Deve ter referências em array');
    assert(Array.isArray(general.palavrasChave), 'Deve ter palavras-chave em array');
    assert(general.atmosfera, 'Deve ter atmosfera');
    assert(Array.isArray(general.prioridades), 'Deve ter prioridades em array');
    assert(Array.isArray(general.restricoes), 'Deve ter restrições em array');
  });
});

describe('2. Diretrizes Visuais e Perfis de Estilo (Itens 2 e 3 do Prompt)', () => {
  it('Deve conter todas as dimensões de diretrizes visuais estruturadas', () => {
    const concept = StudioState.getDesignConcept('prj-praia-01');
    const v = concept.visualDirectives;
    assert(v.formas, 'Deve ter formas');
    assert(v.linhas, 'Deve ter linhas');
    assert(v.proporcoes, 'Deve ter proporções');
    assert(v.linguagem, 'Deve ter linguagem');
    assert(v.texturas, 'Deve ter texturas');
    assert(v.paisagismo, 'Deve ter paisagismo');
    assert(v.decoracao, 'Deve ter decoração');
  });

  it('Deve catalogar e validar os 13 perfis oficiais de estilo', () => {
    const expectedStyles = [
      'Contemporâneo', 'Moderno', 'Minimalista', 'Clássico', 'Industrial',
      'Japandi', 'Orgânico', 'Tropical', 'Biofílico', 'Brasileiro Contemporâneo',
      'Sofisticado', 'Atemporal', 'Personalizado'
    ];
    assert.strictEqual(ConceptModule.STYLE_PROFILES.length, 13, 'Devem existir exatamente 13 perfis');
    expectedStyles.forEach(style => {
      assert(ConceptModule.STYLE_PROFILES.includes(style), `Estilo "${style}" deve estar catalogado`);
    });
  });

  it('Conceito de teste deve possuir estilo primário e secundário válidos', () => {
    const concept = StudioState.getDesignConcept('prj-praia-01');
    assert(ConceptModule.STYLE_PROFILES.includes(concept.styleProfile.primary));
    assert(ConceptModule.STYLE_PROFILES.includes(concept.styleProfile.secondary));
  });
});

describe('3. Matriz Desejado × Evitar e Paleta de Cores (Itens 4 e 5 do Prompt)', () => {
  it('Deve estruturar elementos desejados e a evitar', () => {
    const concept = StudioState.getDesignConcept('prj-praia-01');
    const matrix = concept.preferencesMatrix;
    assert(Array.isArray(matrix.desired), 'desired deve ser array');
    assert(Array.isArray(matrix.avoid), 'avoid deve ser array');
    assert(matrix.desired.length > 0, 'Deve ter itens desejados');
    assert(matrix.avoid.length > 0, 'Deve ter itens a evitar');

    // Testar se cada item possui estrutura completa
    const firstDesired = matrix.desired[0];
    assert(firstDesired.item, 'Item desejado deve ter texto');
    assert(firstDesired.category, 'Item desejado deve ter categoria');

    const firstAvoid = matrix.avoid[0];
    assert(firstAvoid.item, 'Item a evitar deve ter texto');
    assert(firstAvoid.category, 'Item a evitar deve ter categoria');
  });

  it('Deve registrar cores com código, nome, hex, função e material relacionado', () => {
    const concept = StudioState.getDesignConcept('prj-praia-01');
    assert(Array.isArray(concept.palette), 'Paleta deve ser array');
    assert(concept.palette.length >= 4, 'Paleta deve ter no mínimo 4 cores');

    concept.palette.forEach(color => {
      assert(color.code, 'Cor deve ter código');
      assert(color.name, 'Cor deve ter nome');
      assert(color.hex && color.hex.startsWith('#'), 'Cor deve ter hex válido');
      assert(color.role, 'Cor deve ter função (role)');
      assert(color.materialRef, 'Cor deve ter material relacionado');
    });
  });
});

describe('4. Materialidade, Iluminação e Mobiliário (Itens 6, 7 e 8 do Prompt)', () => {
  it('Deve registrar intenções materiais sem quantitativos numéricos precoces', () => {
    const concept = StudioState.getDesignConcept('prj-praia-01');
    const m = concept.materiality;
    assert(m.piso, 'Deve ter intenção de piso');
    assert(m.paredes, 'Deve ter intenção de paredes');
    assert(m.bancadas, 'Deve ter intenção de bancadas');
    assert(m.marcenaria, 'Deve ter intenção de marcenaria');
    assert(m.metais, 'Deve ter intenção de metais');
    assert(m.pedras, 'Deve ter intenção de pedras');
    assert(m.tecidos, 'Deve ter intenção de tecidos');
    assert(m.forros, 'Deve ter intenção de forros');
    assert(m.elementosEspeciais, 'Deve ter intenção de elementos especiais');

    // Garantir que não há quantitativos (m2, metros lineares, contagens numéricas)
    assert(!m.quantitativos, 'NÃO deve conter quantitativos neste bloco');
  });

  it('Deve registrar intenções luminotécnicas sem cálculo completo de engenharia', () => {
    const concept = StudioState.getDesignConcept('prj-praia-01');
    const l = concept.lighting;
    assert(l.natural, 'Deve ter intenção de luz natural');
    assert(l.geral, 'Deve ter intenção de luz geral');
    assert(l.indireta, 'Deve ter intenção de luz indireta');
    assert(l.pontual, 'Deve ter intenção de luz pontual');
    assert(l.cenica, 'Deve ter intenção de luz cênica');
    assert(l.decorativa, 'Deve ter intenção de luz decorativa');
    assert(l.temperaturaDesejada, 'Deve ter temperatura desejada');
    assert(!l.dialuxCalculations, 'NÃO deve conter projeto luminotécnico de engenharia');
  });

  it('Deve catalogar mobiliário nas 5 categorias oficiais', () => {
    const concept = StudioState.getDesignConcept('prj-praia-01');
    const f = concept.furniture;
    assert(Array.isArray(f.existente), 'existente deve ser array');
    assert(Array.isArray(f.desejado), 'desejado deve ser array');
    assert(Array.isArray(f.obrigatorio), 'obrigatório deve ser array');
    assert(Array.isArray(f.opcional), 'opcional deve ser array');
    assert(Array.isArray(f.proibido), 'proibido deve ser array');
    assert(f.proibido.length > 0, 'Deve conter itens proibidos/vetados');
  });
});

describe('5. Hierarquia e Diretrizes por Ambiente (Itens 9 e 10 do Prompt)', () => {
  it('Deve resolver no nível PROJECT_LEVEL quando nenhum ambiente for especificado', () => {
    const resolved = StudioState.resolveDesignContext('prj-praia-01');
    assert.strictEqual(resolved.level, 'PROJECT_LEVEL');
    assert.strictEqual(resolved.conceptName, 'Refúgio Litorâneo Contemporâneo & Biofílico');
    assert(resolved.materials.piso.includes('cumaru'));
  });

  it('Deve herdar do projeto e aplicar sobreposições conscientes no ENVIRONMENT_LEVEL', () => {
    // Definir diretriz específica para env-suite
    StudioState.updateEnvironmentDirectives('prj-praia-01', 'env-suite', {
      hasSpecificDirectives: true,
      atmosphereOverride: 'Íntimo, silencioso, blackout absoluto e conforto térmico suave',
      materialOverrides: {
        piso: 'Carpete de fibra natural / Madeira corrida aquecida',
        tecidos: 'Cortinas em linho duplo pesado com gaze de algodão e veludo rústico'
      },
      lightingOverrides: {
        temperaturaDesejada: '2400K ultra-quente dimerizável'
      }
    });

    const resolvedSuite = StudioState.resolveDesignContext('prj-praia-01', 'env-suite');
    assert.strictEqual(resolvedSuite.level, 'ENVIRONMENT_LEVEL');
    assert.strictEqual(resolvedSuite.atmosphere, 'Íntimo, silencioso, blackout absoluto e conforto térmico suave');
    // Materiais sobrepostos
    assert.strictEqual(resolvedSuite.materials.piso, 'Carpete de fibra natural / Madeira corrida aquecida');
    assert.strictEqual(resolvedSuite.materials.tecidos, 'Cortinas em linho duplo pesado com gaze de algodão e veludo rústico');
    // Campos não sobrepostos devem ser herdados do PROJECT_LEVEL
    assert(resolvedSuite.materials.bancadas.includes('Quartzito'), 'Bancadas não sobrepostas devem ser herdadas');
    assert.strictEqual(resolvedSuite.lighting.temperaturaDesejada, '2400K ultra-quente dimerizável');
    assert(resolvedSuite.lighting.natural, 'Luz natural deve ser herdada do projeto');
  });

  it('Deve aplicar IMAGE_LEVEL quando diretrizes de imagem forem passadas', () => {
    const resolvedImage = StudioState.resolveDesignContext('prj-praia-01', 'env-suite', {
      lighting: { temperaturaDesejada: '1800K luz de vela no detalhe da cabeceira' },
      notes: 'Close-up de textura com foco reduzido e profundidade de campo rasa'
    });
    assert.strictEqual(resolvedImage.level, 'IMAGE_LEVEL');
    assert.strictEqual(resolvedImage.lighting.temperaturaDesejada, '1800K luz de vela no detalhe da cabeceira');
    assert.strictEqual(resolvedImage.imageOverrides.notes, 'Close-up de textura com foco reduzido e profundidade de campo rasa');
  });
});

describe('6. Versionamento Não Destrutivo e Aprovação (Item 13 do Prompt)', () => {
  it('Deve criar uma nova versão (V02) preservando a versão anterior como SUPERSEDED', () => {
    const v1Before = StudioState.getDesignConcept('prj-praia-01');
    assert.strictEqual(v1Before.version, 'V01');
    assert.strictEqual(v1Before.status, 'APPROVED');

    const result = StudioState.createConceptNewVersion('prj-praia-01', 'Versão 2 ajustando paleta para nova solicitação do cliente');
    assert(result.success, 'Criação da nova versão deve ter sucesso');

    const activeConcept = StudioState.getDesignConcept('prj-praia-01');
    assert.strictEqual(activeConcept.version, 'V02');
    assert.strictEqual(activeConcept.status, 'DRAFT');

    const allVersions = StudioState.getAllConceptVersions('prj-praia-01');
    assert.strictEqual(allVersions.length, 2, 'Devem existir 2 versões cadastradas');

    const v1Archived = allVersions.find(v => v.version === 'V01');
    assert(v1Archived, 'V01 deve estar presente no histórico');
    assert.strictEqual(v1Archived.status, 'SUPERSEDED', 'V01 deve ter sido marcado como SUPERSEDED');
  });

  it('Deve aprovar o conceito (transição DRAFT -> APPROVED)', () => {
    const res = StudioState.approveDesignConcept('prj-praia-01', 'Arquiteto Responsável Erick');
    assert(res.success, 'Aprovação deve ter sucesso');

    const approvedConcept = StudioState.getDesignConcept('prj-praia-01');
    assert.strictEqual(approvedConcept.status, 'APPROVED');
    assert(approvedConcept.approvalHistory.length > 0, 'Deve ter registro no histórico de aprovações');
    assert.strictEqual(approvedConcept.approvalHistory[0].approvedBy, 'Arquiteto Responsável Erick');
  });
});

describe('7. Estrutura Canônica PROJECT_DESIGN_CONTEXT para IA (Itens 11 e 12 do Prompt)', () => {
  it('Deve gerar payload completo preservando o texto autoral e agrupando estudos e referências aprovadas', () => {
    const aiContext = StudioState.buildProjectDesignContext('prj-praia-01');
    assert(aiContext.project, 'Deve ter dados do projeto');
    assert(aiContext.concept, 'Deve ter concept estruturado');
    assert(aiContext.concept.originalNarrative, 'Deve conter a narrativa original intacta');
    assert(Array.isArray(aiContext.concept.keywords), 'Keywords devem ser array');
    assert(aiContext.concept.structuredTags, 'Deve conter tags estruturadas pela IA');
    assert(aiContext.style, 'Deve conter style');
    assert(Array.isArray(aiContext.palette), 'Deve conter paleta');
    assert(aiContext.materials, 'Deve conter materiais');
    assert(Array.isArray(aiContext.desired_elements), 'Deve conter desejados');
    assert(Array.isArray(aiContext.avoid_elements), 'Deve conter a evitar');
    assert(aiContext.lighting, 'Deve conter iluminação');
    assert(aiContext.furniture, 'Deve conter mobiliário');
    assert(Array.isArray(aiContext.approved_studies), 'Deve conter estudos aprovados do C03');
    assert(Array.isArray(aiContext.approved_references), 'Deve conter referências aprovadas do C02');
  });
});

describe('8. Interface do Usuário (ConceptModule)', () => {
  it('Deve renderizar o módulo de conceito sem erros', () => {
    const project = StudioState.getProject('prj-praia-01');
    const client = StudioState.getClient(project.clientId);
    const html = ConceptModule.render(project, client);
    assert(html.includes('concept-module'), 'HTML deve conter a classe raiz concept-module');
    assert(html.includes('Refúgio Litorâneo'), 'HTML deve renderizar o título do conceito');
    assert(html.includes('V02'), 'HTML deve mostrar a versão ativa V02');
    assert(html.includes('Paleta & Materiais'), 'HTML deve renderizar a navegação das sub-abas');
  });
});

console.log('\n====================================================================');
console.log(`RESULTADO DOS TESTES: ${passedTests}/${totalTests} PASSARAM (${failedTests} FALHAS)`);
console.log('====================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('TODOS OS TESTES DO BLOCO C04 FORAM CONCLUÍDOS COM SUCESSO!\n');
}
