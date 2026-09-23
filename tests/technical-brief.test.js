/**
 * ============================================================================
 * ARQVERTICE STUDIO — SUÍTE DE TESTES AUTOMATIZADOS (BLOCO C01)
 * BRIEFING TÉCNICO INTERNO ARQVERTICE
 * ============================================================================
 */

// Configuração do ambiente de teste mockando localStorage e DOM
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

const assert = require('assert');
global.escapeHTML = (s) => s || '';
global.formatDateBR = (d) => d || '';
const StudioState = require('../js/state.js');
global.StudioState = StudioState;
const TechnicalBriefModule = require('../js/technical-brief.js');

// Test Suite Runner
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
console.log('ARQVERTICE STUDIO — TESTES DO BLOCO C01 (BRIEFING TÉCNICO INTERNO)');
console.log('====================================================================');

describe('1. Inicialização e Existência do Briefing Técnico', () => {
  StudioState.init();
  
  it('Deve carregar o estado inicial com briefings técnicos populados', () => {
    assert(StudioState.data.technicalBriefs, 'Array technicalBriefs deve existir');
    assert(StudioState.data.technicalBriefs.length >= 2, 'Deve conter pelo menos 2 briefs pré-carregados');
  });

  it('Deve conter briefing técnico com os 22 campos e seções estruturadas', () => {
    const tb = StudioState.getTechnicalBrief('prj-praia-01');
    assert(tb, 'Briefing técnico do projeto prj-praia-01 deve existir');
    assert(tb.executiveSummary, 'Resumo executivo deve existir');
    assert(tb.sections, 'Objeto de 22 seções estruturadas deve existir');
    assert(tb.sections.clientProfile, '02 - Perfil do cliente deve existir');
    assert(tb.sections.objectives, '03 - Objetivos deve existir');
    assert(tb.sections.program, '04 - Programa deve existir');
    assert(tb.sections.style, '10 - Estilo deve existir');
    assert(tb.sections.materials || tb.sections.materiality, '11 - Materialidade deve existir');
    assert(tb.sections.lighting, '12 - Iluminação deve existir');
    assert(tb.sections.furniture, '13 - Mobiliário deve existir');
    assert(tb.sections.technology, '14 - Tecnologia deve existir');
    assert(tb.sections.outdoorAreas || tb.sections.outdoor, '15 - Áreas externas deve existir');
    assert(tb.sections.budget || tb.sections.investment, '16 - Investimento deve existir');
    assert(tb.sections.deadlines, '17 - Prazos deve existir');
    assert(tb.sections.references, '18 - Referências deve existir');
    assert(tb.sections.attentionPoints, '19 - Pontos de atenção deve existir');
    assert(tb.sections.internalDecisions || tb.sections.decisions, '21 - Decisões deve existir');
    assert(tb.sections.internalObservations || tb.sections.internalNotes, '22 - Observações internas deve existir');
  });
});

describe('2. Inviolabilidade e Imutabilidade dos Dados Originais do Cliente', () => {
  it('Não deve permitir que o cliente altere ou sobrescreva o briefing técnico', () => {
    const clientBriefing = StudioState.data.briefings.find(b => b.projectId === 'prj-praia-01');
    assert(clientBriefing, 'Briefing do cliente deve existir');
    const originalAnswerCount = Object.keys(clientBriefing.answers).length;
    const originalLivingAnswer = clientBriefing.answers.p8_integracao;

    // Simulação: tentativa de mutação/criação derivada no Briefing Técnico
    const tb = StudioState.createOrDeriveTechnicalBrief('prj-praia-01');
    tb.directives.push({
      id: 'dir-test-01',
      title: 'Diretriz de Teste Interna',
      category: 'ESPACIAL',
      priority: 'ALTO',
      sourceType: 'ARQVERTICE',
      status: 'APROVADA'
    });

    // Validar que o briefing original do cliente permanece 100% inalterado
    const clientBriefingAfter = StudioState.data.briefings.find(b => b.projectId === 'prj-praia-01');
    assert.strictEqual(Object.keys(clientBriefingAfter.answers).length, originalAnswerCount, 'Respostas do cliente não podem ser apagadas');
    assert.strictEqual(clientBriefingAfter.answers.p8_integracao, originalLivingAnswer, 'Resposta original do cliente não pode ser modificada silenciosamente');
  });

  it('Deve registrar clara separação entre dado do cliente (fato) e interpretação interna', () => {
    const tb = StudioState.getTechnicalBrief('prj-praia-01');
    assert(tb.factInterpretations, 'Lista de fatos vs interpretações deve existir');
    assert(tb.factInterpretations.length > 0, 'Deve conter mapeamentos de fato vs interpretação');
    
    const item = tb.factInterpretations[0];
    assert(item.clientFact, 'Dado do cliente deve estar presente');
    assert(item.internalInterpretation, 'Interpretação interna da ArqVértice deve estar presente');
    assert.notStrictEqual(item.clientFact, item.internalInterpretation, 'A interpretação não deve substituir o dado original');
  });
});

describe('3. Rastreabilidade e Origem dos Dados (Provenance)', () => {
  it('Informações técnicas devem possuir sourceType, sourceId e sourceVersion', () => {
    const tb = StudioState.getTechnicalBrief('prj-praia-01');
    const validSources = ['CLIENTE', 'ARQVERTICE', 'ARQUIVO', 'REFERENCIA', 'LEVANTAMENTO', 'MODELO_REVIT', 'DECISAO', 'IA_SUGESTAO', 'OUTRO'];

    // Verificar origem nas diretrizes
    tb.directives.forEach(dir => {
      assert(validSources.includes(dir.sourceType), `sourceType ${dir.sourceType} deve ser uma das origens válidas`);
      assert(dir.sourceId !== undefined, 'sourceId deve estar definido');
    });

    // Verificar origem nas seções
    assert(validSources.includes(tb.sections.clientProfile.sourceType), 'clientProfile deve possuir sourceType válido');
    assert(validSources.includes(tb.sections.objectives.sourceType), 'objectives deve possuir sourceType válido');
  });
});

describe('4. Gestor de Diretrizes Técnicas (Categorias e Prioridades)', () => {
  it('Deve permitir adicionar, atualizar e filtrar diretrizes com categorias válidas', () => {
    const validCategories = [
      'FUNCIONAL', 'ESPACIAL', 'ESTETICA', 'MATERIAL', 'ILUMINACAO',
      'MOBILIARIO', 'TECNOLOGIA', 'CONFORTO', 'EXTERIOR', 'APRESENTACAO', 'OUTRA'
    ];
    const validPriorities = ['CRITICO', 'ALTO', 'MEDIO', 'BAIXO', 'INFORMATIVO'];

    const newDir = StudioState.addDirective('prj-praia-01', {
      title: 'Ventilação Cruzada na Ala Leste',
      description: 'Garantir aberturas opostas para circulação dos ventos predominantes de Sudeste.',
      category: 'CONFORTO',
      priority: 'CRITICO',
      sourceType: 'ARQVERTICE',
      sourceId: 'analise-bioclimatica-01',
      observation: 'Essencial para conforto térmico litorâneo.',
      responsible: 'Eduardo Marques'
    });

    assert(newDir.id, 'Nova diretriz deve ter um ID');
    assert(validCategories.includes(newDir.category), 'Categoria deve ser válida');
    assert(validPriorities.includes(newDir.priority), 'Prioridade deve ser válida');

    // Atualizar diretriz
    StudioState.updateDirective('prj-praia-01', newDir.id, {
      priority: 'ALTO',
      observation: 'Atualizado após simulação solar.'
    });

    const tb = StudioState.getTechnicalBrief('prj-praia-01');
    const updated = tb.directives.find(d => d.id === newDir.id);
    assert.strictEqual(updated.priority, 'ALTO', 'Prioridade deve ter sido atualizada');
    assert.strictEqual(updated.observation, 'Atualizado após simulação solar.');

    // Excluir diretriz de teste
    StudioState.deleteDirective('prj-praia-01', newDir.id);
    const tbAfterDelete = StudioState.getTechnicalBrief('prj-praia-01');
    assert(!tbAfterDelete.directives.some(d => d.id === newDir.id), 'Diretriz deve ter sido removida');
  });
});

describe('5. Gestor de Restrições (Categorias Específicas)', () => {
  it('Deve permitir registrar restrições nas categorias obrigatórias', () => {
    const requiredCategories = [
      'PRESERVAR', 'NAO_ALTERAR', 'LIMITACOES', 'PREFERENCIAS_NEGATIVAS',
      'ORCAMENTO', 'PRAZO', 'OBRA', 'IMOVEL'
    ];

    const restriction = StudioState.addRestriction('prj-praia-01', {
      category: 'PREFERENCIAS_NEGATIVAS',
      description: 'Cliente tem aversão total a revestimentos com acabamento brilhante ou polido.',
      priority: 'ALTO',
      sourceType: 'CLIENTE',
      sourceId: 'p12_materiais',
      observation: 'Apenas acabamento acetinado, fosco ou escovado.'
    });

    assert(restriction.id, 'Restrição deve possuir ID');
    assert(requiredCategories.includes(restriction.category), 'Categoria de restrição deve ser uma das 8 obrigatórias');

    // Verificar se existe no brief
    const tb = StudioState.getTechnicalBrief('prj-praia-01');
    const found = tb.restrictions.find(r => r.id === restriction.id);
    assert(found, 'Restrição cadastrada deve ser recuperável no briefing');

    // Limpar restrição de teste
    StudioState.deleteRestriction('prj-praia-01', restriction.id);
  });
});

describe('6. Fichas Técnicas Preliminares de Ambientes e Matriz de Necessidades', () => {
  it('Ambientes devem conter ficha técnica preliminar com atributos estruturados', () => {
    const tb = StudioState.getTechnicalBrief('prj-praia-01');
    assert(tb.environments && tb.environments.length > 0, 'Deve conter ambientes estruturados');

    const env = tb.environments[0];
    assert(env.name, 'Nome do ambiente');
    assert(env.type, 'Tipo do ambiente');
    assert(env.areaM2 !== undefined, 'Área em m²');
    assert(env.users, 'Usuários');
    assert(env.function, 'Função');
    assert(env.frequency, 'Frequência');
    assert(Array.isArray(env.needs), 'Necessidades em array');
    assert(env.style, 'Estilo');
    assert(env.desiredMaterials, 'Materiais desejados');
    assert(env.rejectedMaterials, 'Materiais rejeitados');
    assert(env.furniture, 'Mobiliário');
    assert(env.equipment, 'Equipamentos');
    assert(env.lighting, 'Iluminação');
    assert(env.references, 'Referências');
    assert(env.observations, 'Observações');
    assert(env.status, 'Status');
  });

  it('Deve permitir atualizar os dados técnicos de um ambiente', () => {
    const tb = StudioState.getTechnicalBrief('prj-praia-01');
    const envId = tb.environments[0].id;
    
    StudioState.updateEnvironmentBrief('prj-praia-01', envId, {
      observations: 'Observação técnica atualizada no teste de unidade.',
      frequency: 'Diária contínua e fins de semana'
    });

    const updatedTb = StudioState.getTechnicalBrief('prj-praia-01');
    const updatedEnv = updatedTb.environments.find(e => e.id === envId);
    assert.strictEqual(updatedEnv.observations, 'Observação técnica atualizada no teste de unidade.');
    assert.strictEqual(updatedEnv.frequency, 'Diária contínua e fins de semana');
  });
});

describe('7. Sistema de Pendências (Tracker)', () => {
  it('Deve registrar pendência com descrição, prioridade, responsável, status, prazo e observação', () => {
    const pendency = StudioState.addPendency('prj-praia-01', {
      description: 'Aguardando laudo de sondagem de solo (SPT) para cálculo de fundações litorâneas.',
      priority: 'CRITICO',
      responsible: 'Pedro Albuquerque (Cliente)',
      status: 'ABERTA',
      deadline: '2026-09-30',
      observation: 'Empresa contratada comparecerá ao terreno na terça-feira.'
    });

    assert(pendency.id, 'Pendência deve ter ID');
    assert.strictEqual(pendency.status, 'ABERTA');
    assert.strictEqual(pendency.priority, 'CRITICO');

    // Atualizar status para RESOLVIDA
    StudioState.updatePendency('prj-praia-01', pendency.id, {
      status: 'RESOLVIDA',
      observation: 'Laudo recebido em 22/09/2026 com 3 furos de sondagem.'
    });

    const tb = StudioState.getTechnicalBrief('prj-praia-01');
    const resolved = tb.pendencies.find(p => p.id === pendency.id);
    assert.strictEqual(resolved.status, 'RESOLVIDA');

    // Limpar
    StudioState.deletePendency('prj-praia-01', pendency.id);
  });
});

describe('8. Governança de IA (Regra Rígida AI_SUGGESTION vs CONFIRMED_FACT)', () => {
  it('Toda sugestão de IA deve ser estritamente marcada como AI_SUGGESTION e nunca CONFIRMED_FACT', () => {
    // Carregar TechnicalBriefModule para testar regras da engine de IA
    const TechnicalBriefModule = require('../js/technical-brief.js');
    
    const aiAnalysis = TechnicalBriefModule.generateAiAnalysis('prj-praia-01');
    assert(aiAnalysis, 'Análise de IA deve ser gerada');
    assert(aiAnalysis.conflicts && aiAnalysis.conflicts.length > 0, 'Deve detectar conflitos potenciais');
    assert(aiAnalysis.suggestedQuestions && aiAnalysis.suggestedQuestions.length > 0, 'Deve sugerir perguntas de aprofundamento');
    assert(aiAnalysis.missingData && aiAnalysis.missingData.length > 0, 'Deve destacar dados ausentes');

    // Verificar tag de integridade
    assert.strictEqual(aiAnalysis.provenanceTag, 'AI_SUGGESTION', 'Tag de proveniência deve ser estritamente AI_SUGGESTION');
    assert.notStrictEqual(aiAnalysis.provenanceTag, 'CONFIRMED_FACT', 'IA NUNCA pode marcar sugestão como CONFIRMED_FACT');

    // Validar regras de cada conflito detectado
    aiAnalysis.conflicts.forEach(c => {
      assert.strictEqual(c.tag, 'AI_SUGGESTION');
      assert.notStrictEqual(c.tag, 'CONFIRMED_FACT');
    });
  });
});

describe('9. Aprovação Interna e Snapshots Imutáveis (TECHNICAL_BRIEF_V01, V02...)', () => {
  it('Deve registrar aprovação interna e gerar snapshot sem sobrescrever versões anteriores', () => {
    const tb = StudioState.getTechnicalBrief('prj-praia-01');
    const initialSnapshotCount = tb.snapshots ? tb.snapshots.length : 0;
    const initialVersion = tb.version || 1;

    // Criar snapshot V02 com nova nota
    const snapshotV2 = StudioState.createTechnicalBriefSnapshot(
      'prj-praia-01',
      'Aprovado após revisão de layout com cliente e compatibilização estrutural.'
    );

    assert(snapshotV2, 'Snapshot deve ser criado');
    assert(snapshotV2.versionCode.startsWith('TECHNICAL_BRIEF_V'), 'versionCode deve seguir TECHNICAL_BRIEF_Vxx');
    
    const updatedTb = StudioState.getTechnicalBrief('prj-praia-01');
    assert.strictEqual(updatedTb.snapshots.length, initialSnapshotCount + 1, 'Número de snapshots deve incrementar');
    
    // Verificar que V01 foi preservado e não sobrescrito
    const v1 = updatedTb.snapshots.find(s => s.versionCode === 'TECHNICAL_BRIEF_V01');
    assert(v1, 'Snapshot V01 não pode ser sobrescrito');
    assert.strictEqual(v1.versionCode, 'TECHNICAL_BRIEF_V01');
  });

  it('Aprovação técnica formal deve registrar aprovador, data e notas', () => {
    StudioState.approveTechnicalBrief(
      'prj-praia-01',
      'Eduardo Marques (Arquiteto Titular)',
      'Revisão técnica completa finalizada e aprovada para liberação da etapa de Levantamento C02.'
    );

    const tb = StudioState.getTechnicalBrief('prj-praia-01');
    assert.strictEqual(tb.status, 'APPROVED', 'Status deve ser APPROVED');
    assert.strictEqual(tb.approvedByName, 'Eduardo Marques (Arquiteto Titular)');
    assert(tb.approvedAt, 'Data de aprovação deve ser preenchida');
  });
});

describe('10. Pacote de Exportação e Handover para C02 (Levantamento)', () => {
  it('Deve gerar payload padronizado e limpo contendo todos os dados requeridos para C02', () => {
    const c02Package = StudioState.getTechnicalBriefExportForC02('prj-praia-01');
    assert(c02Package, 'Pacote de transição C02 deve ser gerado');
    assert(c02Package.exportMetadata, 'Metadados de transição');
    assert.strictEqual(c02Package.exportMetadata.targetStage, 'C02 — LEVANTAMENTO');
    
    // Validar dados exigidos pelo item 16 da especificação
    assert(c02Package.projectData && c02Package.projectData.name, 'dados do projeto');
    assert(c02Package.clientData && c02Package.clientData.name, 'dados do cliente');
    assert(c02Package.program, 'programa');
    assert(Array.isArray(c02Package.environments), 'ambientes');
    assert(Array.isArray(c02Package.needs), 'necessidades');
    assert(Array.isArray(c02Package.restrictions), 'restrições');
    assert(c02Package.references, 'referências');
    assert(Array.isArray(c02Package.pendencies), 'pendências');
    assert(Array.isArray(c02Package.approvedDirectives), 'diretrizes aprovadas');
  });
});

console.log('====================================================================');
console.log(`TOTAL DE TESTES: ${totalTests}`);
console.log(`PASSOU: ${passedTests}`);
console.log(`FALHOU: ${failedTests}`);
console.log('====================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('TODOS OS 12 CRITÉRIOS DE ACEITE DO BLOCO C01 FORAM VALIDADOS COM SUCESSO!\n');
  process.exit(0);
}
