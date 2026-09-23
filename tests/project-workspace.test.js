/**
 * ============================================================================
 * ARQVERTICE STUDIO — SUÍTE DE TESTES AUTOMATIZADOS (BLOCO C05)
 * WORKSPACE DE DESENVOLVIMENTO DO PROJETO, ENTREGÁVEIS, REVIT, MARCOS E VERSÕES
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
global.getProgressColor = () => '#10b981';

const assert = require('assert');
const StudioState = require('../js/state.js');
global.StudioState = StudioState;
const ProjectWorkspaceModule = require('../js/project-workspace-module.js');

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
console.log('ARQVERTICE STUDIO — TESTES DO BLOCO C05 (WORKSPACE DE DESENVOLVIMENTO)');
console.log('====================================================================');

describe('1. Inicialização e Agregador do Workspace (Prompt Itens 0, 2)', () => {
  StudioState.init();

  it('Deve inicializar o workspace central de desenvolvimento com todas as seções requeridas', () => {
    const ws = StudioState.getProjectDevWorkspace('prj-praia-01');
    assert(ws, 'Workspace deve existir');
    assert(ws.project, 'Deve conter dados do projeto');
    assert(ws.client, 'Deve conter dados do cliente');
    assert(ws.globalStatus, 'Deve conter estado global');
    assert(Array.isArray(ws.milestones), 'Deve conter lista de marcos');
    assert(Array.isArray(ws.deliverables), 'Deve conter lista de entregáveis');
    assert(Array.isArray(ws.checklist), 'Deve conter checklist de grandes etapas');
    assert(Array.isArray(ws.decisions), 'Deve conter decisões recentes');
    assert(Array.isArray(ws.pendingIssues), 'Deve conter pendências agregadas');
    assert(Array.isArray(ws.environmentProgress), 'Deve conter progresso por ambiente');
    assert(ws.schedule, 'Deve conter resumo do cronograma integrado');
  });
});

describe('2. Máquina de Estados Global (11 Estados Oficiais - Prompt Item 3)', () => {
  it('Deve catalogar exatamente os 11 estados oficiais do ciclo de vida', () => {
    const expected = [
      'PLANEJAMENTO',
      'BRIEFING_APROVADO',
      'LEVANTAMENTO',
      'ESTUDOS',
      'CONCEITO',
      'DESENVOLVIMENTO',
      'VISUALIZACAO',
      'APRESENTACAO',
      'REVISAO',
      'ENTREGA',
      'FINALIZADO'
    ];
    assert.strictEqual(StudioState.PROJECT_STATUSES.length, 11);
    expected.forEach(st => assert(StudioState.PROJECT_STATUSES.includes(st), `Estado ${st} deve existir`));
  });

  it('Deve atualizar e registrar auditoria de transição de estado global', () => {
    const res = StudioState.updateProjectGlobalStatus('prj-praia-01', 'DESENVOLVIMENTO');
    assert(res.success, 'Atualização de estado deve ter sucesso');
    assert.strictEqual(res.status, 'DESENVOLVIMENTO');

    const proj = StudioState.getProject('prj-praia-01');
    assert.strictEqual(proj.status, 'DESENVOLVIMENTO');
    assert(proj.statusHistory.length > 0, 'Deve registrar histórico de transição');
  });
});

describe('3. Governança de Entregáveis e as 8 Disciplinas (Prompt Itens 4, 5, 16, 17)', () => {
  it('Deve suportar as 8 disciplinas oficiais sem divisões supérfluas', () => {
    const expectedDisciplines = [
      'ARQUITETURA', 'INTERIORES', 'PAISAGISMO', 'ILUMINACAO',
      'MARCENARIA', 'VISUALIZACAO', 'APRESENTACAO', 'OUTRA'
    ];
    assert.strictEqual(StudioState.PROJECT_DISCIPLINES.length, 8);
    expectedDisciplines.forEach(d => assert(StudioState.PROJECT_DISCIPLINES.includes(d)));
  });

  it('Deve suportar as 5 classificações de arquivos oficiais (WORKING até ARCHIVED)', () => {
    const expectedClassifs = ['WORKING', 'REFERENCE', 'APPROVED', 'FINAL', 'ARCHIVED'];
    assert.strictEqual(StudioState.FILE_CLASSIFICATIONS.length, 5);
    expectedClassifs.forEach(c => assert(StudioState.FILE_CLASSIFICATIONS.includes(c)));
  });

  it('Deve permitir cadastrar novo entregável com disciplina, tipo, prazo e responsável', () => {
    const res = StudioState.saveProjectDeliverable('prj-praia-01', {
      title: 'Paginação de Piso da Varanda Gourmet',
      discipline: 'INTERIORES',
      deliverableType: 'Planta baixa',
      responsible: 'Camila Rossi',
      dueDate: '2026-11-05',
      version: 'V01',
      fileClassification: 'WORKING'
    });
    assert(res.success, 'Cadastro de entregável deve ter sucesso');
    assert.strictEqual(res.deliverable.discipline, 'INTERIORES');
    assert.strictEqual(res.deliverable.status, 'DRAFT');
  });

  it('Deve aprovar formalmente um entregável e registrar aprovador e timestamp', () => {
    const deliverables = StudioState.getProjectDeliverables('prj-praia-01');
    const target = deliverables[0];

    const res = StudioState.approveDeliverable('prj-praia-01', target.id, 'Eduardo Marques (Arquiteto Titular)', 'Aprovado para prancha');
    assert(res.success, 'Aprovação deve ter sucesso');
    assert.strictEqual(res.deliverable.status, 'APPROVED');
    assert.strictEqual(res.deliverable.fileClassification, 'APPROVED');
    assert(res.deliverable.approvedAt, 'Deve registrar data de aprovação');
    assert.strictEqual(res.deliverable.approvedBy, 'Eduardo Marques (Arquiteto Titular)');
  });

  it('Deve permitir rejeição formal com registro de motivo', () => {
    const deliverables = StudioState.getProjectDeliverables('prj-praia-01');
    const target = deliverables.find(d => d.status !== 'APPROVED') || deliverables[1];

    const res = StudioState.rejectDeliverable('prj-praia-01', target.id, 'Ajustar cota de soleira e desnível da varanda');
    assert(res.success, 'Rejeição deve ter sucesso');
    assert.strictEqual(res.deliverable.status, 'REJECTED');
    assert.strictEqual(res.deliverable.rejectionReason, 'Ajustar cota de soleira e desnível da varanda');
  });
});

describe('4. Relação com Autodesk Revit como Origem de Referência (Prompt Item 6)', () => {
  it('Deve registrar metadados estruturados do Revit sem inferência indevida', () => {
    const res = StudioState.saveProjectDeliverable('prj-praia-01', {
      title: 'Corte Esquematizado Revit BB',
      discipline: 'ARQUITETURA',
      deliverableType: 'Corte',
      origin: 'REVIT',
      revitViewName: 'Corte BB - Escada e Hall Superior',
      revitLevel: 'Pavimento Superior',
      revitEnvironment: 'Geral',
      revitVersion: 'Revit 2026.2',
      revitNotes: 'Corte vinculado da folha A103 sem alterações manuais.',
      responsible: 'Eduardo Marques'
    });

    assert(res.success);
    assert.strictEqual(res.deliverable.origin, 'REVIT');
    assert.strictEqual(res.deliverable.revitViewName, 'Corte BB - Escada e Hall Superior');
    assert.strictEqual(res.deliverable.revitLevel, 'Pavimento Superior');
    assert(res.deliverable.revitExportDate, 'Deve conter data de exportação');
  });
});

describe('5. Os 9 Marcos Oficiais do Projeto (Prompt Item 8)', () => {
  it('Deve conter exatamente os 9 marcos sequenciais oficiais', () => {
    const milestones = StudioState.getProjectMilestones('prj-praia-01');
    assert.strictEqual(milestones.length, 9, 'Devem existir exatamente 9 marcos');
    assert.strictEqual(milestones[0].milestoneKey, 'BRIEFING_APROVADO');
    assert.strictEqual(milestones[8].milestoneKey, 'ENTREGA');
  });

  it('Deve permitir alternar marco com registro de auditoria sem marcação automática arbitrária', () => {
    const res = StudioState.toggleMilestone('prj-praia-01', 'PROJETO_CONSOLIDADO', true, 'Pranchas executivas validadas', 'Eduardo Marques');
    assert(res.success);
    assert.strictEqual(res.milestone.isAchieved, true);
    assert(res.milestone.achievedAt, 'Deve ter data de conquista');
    assert.strictEqual(res.milestone.achievedBy, 'Eduardo Marques');
  });
});

describe('6. Versões do Projeto e Snapshots Não-Destrutivos (Prompt Item 7)', () => {
  it('Deve gerar snapshot PROJECT_V01 congelando contexto integral vigente', () => {
    const res = StudioState.createProjectSnapshot('prj-praia-01', 'PROJECT_V01', 'Congelamento para emissão de orçamento');
    assert(res.success, 'Snapshot deve ser criado');
    assert.strictEqual(res.snapshot.snapshotLabel, 'PROJECT_V01');
    assert(res.snapshot.frozenContext, 'Deve conter contexto congelado');
    assert(res.snapshot.frozenContext.conceptId, 'Deve conter ID do conceito vigente');
    assert(res.snapshot.frozenContext.decisionsCount >= 0, 'Deve conter contagem de decisões');

    const snapshots = StudioState.getProjectSnapshots('prj-praia-01');
    assert(snapshots.length >= 1, 'Deve listar snapshots existentes');
  });
});

describe('7. Pendências, Decisões e Histórico de Revisões (Prompt Itens 9, 10, 15)', () => {
  it('Deve consolidar pendências ativas vindas do briefing e de entregáveis', () => {
    const pending = StudioState.getProjectPendingIssues('prj-praia-01');
    assert(Array.isArray(pending), 'Pendências devem ser array');
    assert(pending.length > 0, 'Deve conter pendências ativas');
    assert(pending[0].priority, 'Pendência deve conter prioridade');
    assert(pending[0].responsible, 'Pendência deve conter responsável');
  });

  it('Deve consolidar log de decisões com rastreabilidade para origem', () => {
    const decisions = StudioState.getProjectDecisionsLog('prj-praia-01');
    assert(Array.isArray(decisions), 'Decisões devem ser array');
    assert(decisions.length > 0, 'Deve conter decisões homologadas');
    assert(decisions[0].linkStage, 'Decisão deve ter link para a etapa de origem');
  });
});

describe('8. Progresso por Ambiente e Cronograma Conectado (Prompt Itens 12, 14)', () => {
  it('Deve calcular progresso significativo e configurável para os ambientes', () => {
    const progressList = StudioState.calculateEnvironmentProgress('prj-praia-01');
    assert(Array.isArray(progressList), 'Deve retornar lista de ambientes');
    assert(progressList.length > 0, 'Deve conter ambientes calculados');

    const sala = progressList.find(e => e.environmentName.includes('Living') || e.environmentName.includes('Sala'));
    assert(sala, 'Sala deve estar na lista');
    assert(typeof sala.progressPct === 'number', 'Percentual deve ser numérico');
    assert(sala.progressPct >= 0 && sala.progressPct <= 100, 'Percentual deve estar entre 0 e 100');
    assert(Array.isArray(sala.breakdown), 'Deve conter detalhamento do cálculo ponderado');
  });

  it('Deve integrar com o cronograma existente sem duplicação de tarefas', () => {
    const ws = StudioState.getProjectDevWorkspace('prj-praia-01');
    assert(ws.schedule, 'Cronograma deve estar conectado');
    assert(typeof ws.schedule.progressPct === 'number', 'Avanço do cronograma deve ser numérico');
    assert(Array.isArray(ws.schedule.tasks), 'Tarefas devem vir do cronograma principal');
  });
});

describe('9. Governança de IA e Salvaguarda (Prompt Item 18)', () => {
  it('A IA deve resumir progresso e gargalos sem poder autônomo de finalizar projeto', () => {
    const aiSummary = StudioState.generateAiProjectSummary('prj-praia-01');
    assert(aiSummary, 'Resumo de IA deve ser gerado');
    assert(aiSummary.overview, 'Deve conter visão geral');
    assert(aiSummary.safeguardNotice, 'Deve conter declaração de salvaguarda');
    assert(aiSummary.safeguardNotice.includes('sem autoridade'), 'Deve explicitar ausência de autoridade para finalizar sem arquiteto');
  });
});

describe('10. Renderização da Interface do Usuário (ProjectWorkspaceModule)', () => {
  it('Deve renderizar o HTML completo do Workspace C05 sem erros', () => {
    const project = StudioState.getProject('prj-praia-01');
    const client = StudioState.getClient(project.clientId);
    const html = ProjectWorkspaceModule.render(project, client);

    assert(html.includes('project-dev-workspace'), 'HTML deve conter a classe raiz project-dev-workspace');
    assert(html.includes('BLOCO C05'), 'HTML deve referenciar o Bloco C05');
    assert(html.includes('Marcos Oficiais'), 'HTML deve renderizar a seção de marcos');
    assert(html.includes('Pendências & Ações Imediatas'), 'HTML deve renderizar o painel de pendências');
    assert(html.includes('Entregáveis & Modelos Técnicos'), 'HTML deve renderizar a tabela de entregáveis');
    assert(html.includes('REVIT'), 'HTML deve destacar origem do Revit');
  });
});

console.log('\n====================================================================');
console.log(`RESULTADO DOS TESTES: ${passedTests}/${totalTests} PASSARAM (${failedTests} FALHAS)`);
console.log('====================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('TODOS OS TESTES DO BLOCO C05 FORAM CONCLUÍDOS COM SUCESSO!\n');
}
