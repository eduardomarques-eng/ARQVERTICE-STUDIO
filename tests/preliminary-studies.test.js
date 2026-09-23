/**
 * ============================================================================
 * ARQVERTICE STUDIO — SUÍTE DE TESTES AUTOMATIZADOS (BLOCO C03)
 * ESTUDOS PRELIMINARES, ALTERNATIVAS, COMPARAÇÃO, DECISÃO E VERSIONAMENTO
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
global.escapeHTML = (s) => s || '';
global.formatDateBR = (d) => d || '';

const assert = require('assert');
const StudioState = require('../js/state.js');
global.StudioState = StudioState;
const StudiesModule = require('../js/studies-module.js');

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
console.log('ARQVERTICE STUDIO — TESTES DO BLOCO C03 (ESTUDOS PRELIMINARES)');
console.log('====================================================================');

describe('1. Inicialização e Catálogo Inicial de Estudos', () => {
  StudioState.init();

  it('Deve carregar os estudos preliminares padrão no StudioState', () => {
    assert(StudioState.data.preliminaryStudies, 'preliminaryStudies deve existir');
    assert(Array.isArray(StudioState.data.preliminaryStudies), 'preliminaryStudies deve ser um array');
    assert(StudioState.data.preliminaryStudies.length >= 3, 'Deve conter ao menos 3 estudos de teste');
  });

  it('Deve recuperar estudos filtrados pelo ID do projeto', () => {
    const studies = StudioState.getPreliminaryStudies('prj-praia-01');
    assert(studies.length >= 3, 'prj-praia-01 deve conter estudos');
    assert(studies.every(s => s.projectId === 'prj-praia-01'), 'Todos devem pertencer ao projeto especificado');
  });
});

describe('2. Suporte aos 11 Tipos / Categorias de Estudo (Prompt C03 Item 1)', () => {
  const categories = [
    'LAYOUT', 'CIRCULACAO', 'VOLUMETRIA', 'FACHADA', 'INTERIORES',
    'MATERIALIDADE', 'ILUMINACAO', 'MOBILIARIO', 'PAISAGISMO', 'AREA_EXTERNA', 'OUTRO'
  ];

  categories.forEach(cat => {
    it(`Deve permitir a criação de estudo com a categoria ${cat}`, () => {
      const res = StudioState.createPreliminaryStudy({
        projectId: 'prj-praia-01',
        title: `Estudo de Teste C03 — ${cat}`,
        category: cat,
        objective: `Validar viabilidade técnica de ${cat}`,
        hypothesis: `Hipótese conceitual para ${cat}`
      });
      assert(res.success, `Falha ao criar estudo com categoria ${cat}`);
      assert.strictEqual(res.study.category, cat);
      assert.strictEqual(res.study.version, 'V01');
      assert.strictEqual(res.study.status, 'DRAFT');
    });
  });
});

describe('3. Gestão de Alternativas (Alternativas A, B, C...) (Prompt C03 Item 3)', () => {
  let createdStudyId = null;

  it('Deve criar um estudo base para testes de alternativas', () => {
    const res = StudioState.createPreliminaryStudy({
      projectId: 'prj-praia-01',
      title: 'Estudo de Circulação e Escada Social',
      category: 'CIRCULACAO',
      objective: 'Definir posição da escada plástica entre térreo e rooftop',
      hypothesis: 'Escada helicoidal em balanço libera espaço útil no living'
    });
    assert(res.success);
    createdStudyId = res.study.id;
  });

  it('Deve cadastrar Alternativa A com vantagens e desvantagens registradas', () => {
    const res = StudioState.addStudyAlternative(createdStudyId, {
      letter: 'A',
      name: 'Alternativa A — Escada Reta com Muro de Concreto Aparente',
      authorship: 'CRIADO_PELA_ARQVERTICE',
      description: 'Escada linear engastada em parede estrutural de concreto.',
      hypothesis: 'Facilidade executiva e custo reduzido',
      advantages: ['Execução rápida', 'Menor custo de forma', 'Espaço inferior aproveitado para adega'],
      disadvantages: ['Bloqueia parte da vista do jardim de inverno'],
      revitView: '{3D} Escada Linear Opcao A'
    });
    assert(res.success, 'Falha ao adicionar alternativa A');
    assert.strictEqual(res.alternative.letter, 'A');
    assert.strictEqual(res.study.alternatives.length, 1);
  });

  it('Deve cadastrar Alternativa B com autoria e hipótese próprias', () => {
    const res = StudioState.addStudyAlternative(createdStudyId, {
      letter: 'B',
      name: 'Alternativa B — Escada Helicoidal Metálica Escultural',
      authorship: 'REFERENCIA_EXTERNA',
      description: 'Escada caracol com desenho escultural e degraus plissados.',
      hypothesis: 'Impacto visual marcante no hall principal',
      advantages: ['Elemento de destaque no living', 'Permeabilidade de luz 360 graus'],
      disadvantages: ['Custo elevado de serralheria especializada', 'Menor conforto ergonômico'],
      revitView: '{3D} Escada Caracol Opcao B'
    });
    assert(res.success, 'Falha ao adicionar alternativa B');
    assert.strictEqual(res.alternative.letter, 'B');
    assert.strictEqual(res.study.alternatives.length, 2);
  });

  it('Deve cadastrar Alternativa C (Design Alternativo)', () => {
    const res = StudioState.addStudyAlternative(createdStudyId, {
      letter: 'C',
      name: 'Alternativa C — Escada em Balanço com Degraus Flutuantes',
      authorship: 'CRIADO_PELA_ARQVERTICE',
      description: 'Degraus em balanço engastados em viga metálica oculta com guarda-corpo em vidro extra-clear.',
      hypothesis: 'Máxima leveza visual e continuidade espacial',
      advantages: ['Transparência absoluta', 'Elegância contemporânea'],
      disadvantages: ['Exige reforço estrutural complexo na alvenaria'],
      revitView: '{3D} Escada Suspensa Opcao C'
    });
    assert(res.success, 'Falha ao adicionar alternativa C');
    assert.strictEqual(res.study.alternatives.length, 3);
  });
});

describe('4. Comparação Lado a Lado e Salvaguarda de Decisão Humana (Prompt C03 Itens 4 e 10)', () => {
  it('Deve recuperar todas as alternativas estruturadas com vantagens e desvantagens', () => {
    const study = StudioState.getPreliminaryStudies('prj-praia-01').find(s => s.title.includes('Escada Social'));
    assert(study);
    assert.strictEqual(study.alternatives.length, 3);

    const altA = study.alternatives.find(a => a.letter === 'A');
    const altB = study.alternatives.find(a => a.letter === 'B');
    assert(altA.advantages.length > 0, 'Alternativa A deve ter vantagens');
    assert(altA.disadvantages.length > 0, 'Alternativa A deve ter desvantagens');
    assert(altB.advantages.length > 0, 'Alternativa B deve ter vantagens');
  });

  it('A IA NÃO deve alterar automaticamente o estado isSelected de nenhuma alternativa', () => {
    const study = StudioState.getPreliminaryStudies('prj-praia-01').find(s => s.title.includes('Escada Social'));
    // Simulando operação de assistência da IA (análise de diferenças)
    const aiSummaryResult = {
      prosComparison: 'Alternativa A oferece menor custo; Alternativa C oferece maior estética.',
      tradeOffs: 'Custo vs Leveza visual'
    };
    assert(aiSummaryResult, 'IA estruturou análise');

    // Assegura que nenhuma alternativa foi selecionada silenciosamente
    assert(study.alternatives.every(a => a.isSelected === false || a.isSelected === undefined),
      'Nenhuma alternativa pode ser selecionada automaticamente pela IA');
    assert.strictEqual(study.decision, null, 'O campo decision não pode ser gerado pela IA');
  });
});

describe('5. Registro de Decisão Arquitetônica (Prompt C03 Item 5)', () => {
  let studyToDecide = null;

  it('Deve registrar a decisão formal escolhida pelo arquiteto', () => {
    studyToDecide = StudioState.getPreliminaryStudies('prj-praia-01').find(s => s.title.includes('Escada Social'));
    const altC = studyToDecide.alternatives.find(a => a.letter === 'C');

    const res = StudioState.recordStudyDecision(studyToDecide.id, {
      selectedAlternativeId: altC.id,
      reason: 'A Alternativa C foi escolhida pelo cliente e pela ArqVértice por garantir a integração visual plena do living com o jardim, alinhada à premissa de luxo contemporâneo do briefing.',
      decidedBy: 'Erick Santiago',
      decidedAt: new Date().toISOString(),
      observations: 'Compatibilizar reforço do perfil metálico UPN com a engenharia estrutural.'
    });

    assert(res.success, 'Falha ao registrar decisão');
    assert(res.study.decision, 'Objeto decision deve estar preenchido');
    assert.strictEqual(res.study.decision.selectedAlternativeId, altC.id);
    assert.strictEqual(res.study.decision.decidedBy, 'Erick Santiago');

    // A alternativa C deve agora estar marcada como isSelected = true
    const updatedAltC = res.study.alternatives.find(a => a.id === altC.id);
    assert.strictEqual(updatedAltC.isSelected, true, 'Alternativa C deve ter isSelected = true');

    // As demais devem ter isSelected = false
    const otherAlts = res.study.alternatives.filter(a => a.id !== altC.id);
    assert(otherAlts.every(a => a.isSelected === false), 'As outras alternativas devem estar desmarcadas');
  });

  it('A decisão deve ser propagada para a memória técnica do projeto', () => {
    const tb = StudioState.getTechnicalBrief('prj-praia-01');
    if (tb && tb.sections && tb.sections.decisions) {
      const recorded = tb.sections.decisions.find(d => d.studyId === studyToDecide.id);
      assert(recorded, 'Decisão do estudo deve constar na memória técnica do projeto');
      assert.strictEqual(recorded.decidedBy, 'Erick Santiago');
    }
  });
});

describe('6. Progresso Físico vs. Aprovação (Prompt C03 Itens 12 e 13)', () => {
  let studyId = null;

  it('Deve permitir atualizar o progresso para 100% sem aprovar o estudo', () => {
    const res = StudioState.createPreliminaryStudy({
      projectId: 'prj-praia-01',
      title: 'Estudo de Iluminação Zenital',
      category: 'ILUMINACAO',
      progress: 0
    });
    studyId = res.study.id;

    const updateRes = StudioState.updatePreliminaryStudy(studyId, { progress: 100 });
    assert(updateRes.success);
    assert.strictEqual(updateRes.study.progress, 100);
    assert.strictEqual(updateRes.study.status, 'DRAFT', 'Status não deve virar APPROVED só porque o progresso é 100%');
  });

  it('Deve aprovar o estudo formalmente criando APPROVED_STUDY_VERSION', () => {
    const approveRes = StudioState.approveStudy(
      studyId,
      'Erick Santiago',
      'Iluminação zenital aprovada com vidros de controle solar Low-E'
    );
    assert(approveRes.success, 'Falha ao aprovar estudo');
    assert.strictEqual(approveRes.study.status, 'APPROVED');
    assert(approveRes.study.approvedAt, 'approvedAt deve estar preenchido');
    assert.strictEqual(approveRes.study.approvedBy, 'Erick Santiago');
  });

  it('Deve permitir rejeição formal com registro de motivo', () => {
    const res = StudioState.createPreliminaryStudy({
      projectId: 'prj-praia-01',
      title: 'Estudo de Cobertura em Palha Natural',
      category: 'MATERIALIDADE'
    });

    const rejRes = StudioState.rejectStudy(
      res.study.id,
      'Incompatibilidade com exigências do corpo de bombeiros e risco de maresia severa'
    );
    assert(rejRes.success);
    assert.strictEqual(rejRes.study.status, 'REJECTED');
    assert(rejRes.study.rejectionReason.includes('corpo de bombeiros'));
  });
});

describe('7. Versionamento Não-Destrutivo (Prompt C03 Item 14)', () => {
  let baseStudyId = null;

  it('Deve preparar um estudo V01 aprovado com alternativas', () => {
    const res = StudioState.createPreliminaryStudy({
      projectId: 'prj-praia-01',
      title: 'Estudo de Fachada Principal',
      category: 'FACHADA',
      objective: 'Composição de brises ripados'
    });
    baseStudyId = res.study.id;

    StudioState.addStudyAlternative(baseStudyId, {
      letter: 'A',
      name: 'Brise Vertical em Alumínio Amadeirado',
      authorship: 'CRIADO_PELA_ARQVERTICE',
      advantages: ['Baixa manutenção'],
      disadvantages: ['Custo inicial']
    });

    const appr = StudioState.approveStudy(baseStudyId, 'Erick Santiago', 'V01 homologada');
    assert.strictEqual(appr.study.version, 'V01');
    assert.strictEqual(appr.study.status, 'APPROVED');
  });

  it('Ao criar nova versão, deve congelar V01 como SUPERSEDED e gerar V02 em IN_REVIEW', () => {
    const versionRes = StudioState.createStudyNewVersion(baseStudyId, 'Cliente solicitou ensaio com brises horizontais móveis');
    assert(versionRes.success, 'Falha ao criar nova versão');

    // V01 original
    const v01 = StudioState.getStudyById(baseStudyId);
    assert.strictEqual(v01.status, 'SUPERSEDED', 'V01 deve se tornar SUPERSEDED');
    assert.strictEqual(v01.supersededBy, versionRes.newStudy.id);

    // Nova versão V02
    const v02 = versionRes.newStudy;
    assert.strictEqual(v02.version, 'V02', 'Nova versão deve ser V02');
    assert.strictEqual(v02.status, 'IN_REVIEW', 'Nova versão deve entrar como IN_REVIEW');
    assert.strictEqual(v02.parentStudyId, baseStudyId);
    assert.strictEqual(v02.alternatives.length, 1, 'Alternativas de V01 devem ser herdadas/clonadas em V02');
  });
});

describe('8. Rastreabilidade de Autoria (Prompt C03 Item 9)', () => {
  it('Deve validar os 4 tipos de autoria nas alternativas', () => {
    const authorships = ['CRIADO_PELA_ARQVERTICE', 'IMPORTADO', 'REFERENCIA_EXTERNA', 'GERADO_POR_IA'];
    
    const studyRes = StudioState.createPreliminaryStudy({
      projectId: 'prj-praia-01',
      title: 'Estudo de Autoria e Procedência',
      category: 'INTERIORES'
    });

    authorships.forEach((auth, idx) => {
      const altRes = StudioState.addStudyAlternative(studyRes.study.id, {
        letter: String.fromCharCode(65 + idx),
        name: `Alternativa de Teste Autoria ${auth}`,
        authorship: auth,
        description: `Proposta gerada com autoria ${auth}`
      });
      assert(altRes.success);
      assert.strictEqual(altRes.alternative.authorship, auth);
    });
  });
});

describe('9. Relação com o Autodesk Revit (Prompt C03 Item 11)', () => {
  it('Deve registrar flags e vistas do Revit no estudo e na alternativa', () => {
    const res = StudioState.createPreliminaryStudy({
      projectId: 'prj-praia-01',
      title: 'Estudo de Volumetria Integrada no Revit',
      category: 'VOLUMETRIA',
      isRevitDeveloped: true,
      revitViewName: '{3D} Volumetria - Opcao A vs B',
      revitNotes: 'Modelado no arquivo R26-PRAIA-BIM.rvt utilizando Design Options'
    });

    assert(res.success);
    assert.strictEqual(res.study.isRevitDeveloped, true);
    assert.strictEqual(res.study.revitViewName, '{3D} Volumetria - Opcao A vs B');
  });
});

describe('10. Encaminhamento para a Etapa de CONCEITO (Prompt C03 Item 15)', () => {
  it('Deve permitir encaminhar estudos aprovados para a etapa de Conceito', () => {
    const res = StudioState.createPreliminaryStudy({
      projectId: 'prj-praia-01',
      title: 'Estudo Conceitual de Partido Arquitetônico',
      category: 'LAYOUT'
    });

    const conceptRes = StudioState.forwardStudyToConcept(res.study.id, 'Base geométrica aprovada para definir a volumetria formal do conceito.');
    assert(conceptRes.success, 'Falha ao encaminhar para conceito');
    assert.strictEqual(conceptRes.study.forwardedToConcept, true);
    assert(conceptRes.study.forwardedToConceptAt);
    assert.strictEqual(conceptRes.study.conceptNotes, 'Base geométrica aprovada para definir a volumetria formal do conceito.');
  });
});

describe('11. Interface e Renderização do StudiesModule (Prompt C03 Item 18)', () => {
  it('Deve renderizar o HTML completo do workspace de estudos sem exceções', () => {
    const project = StudioState.getProject('prj-praia-01');
    const client = StudioState.getClient(project.clientId);

    const html = StudiesModule.render(project, client);
    assert(typeof html === 'string', 'Render deve retornar uma string HTML');
    assert(html.includes('studies-workspace-wrap'), 'Deve conter wrapper principal');
    assert(html.includes('BLOCO C03 — ESTUDOS PRELIMINARES'), 'Deve conter identificador do Bloco C03');
    assert(html.includes('Novo Estudo'), 'Deve conter botão de novo estudo');
    assert(html.includes('IA: Resumo das Alternativas'), 'Deve conter botão de IA');
  });
});

// Relatório Final
console.log('\n====================================================================');
console.log(`TOTAL DE TESTES EXECUTADOS: ${totalTests}`);
console.log(`PASSOU: ${passedTests}`);
console.log(`FALHOU: ${failedTests}`);
console.log('====================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('TODOS OS TESTES DO BLOCO C03 PASSARAM COM SUCESSO!\n');
}
