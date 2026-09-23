/**
 * Suíte de Testes Automatizados — Bloco F14: Integração do Módulo de Apresentação/Entrega ao Cronograma
 * Valida a relação canônica (Projeto -> Cronograma -> Etapas -> Entregas -> Apresentações),
 * os 4 eventos do ciclo de vida, as 6 etapas canônicas, sincronização sem duplicação,
 * os links contextuais ("Ver apresentação", "Ver entrega", "Ver revisão"), "Ver cronograma" no projeto,
 * a camada de compatibilidade e a integridade de funcionamento do cronograma existente.
 */

// Mock de ambiente para execução em Node.js
global.window = {
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
  }
};
global.localStorage = global.window.localStorage;
global.document = {
  getElementById: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};

const assert = require('assert');
const StudioState = require('../js/state.js');
StudioState.init();

const { CronogramaIntegration, renderIntegratedCronograma } = require('../js/cronograma-module.js');

let testsPassed = 0;
let testsFailed = 0;

function runTest(testName, testFn) {
  try {
    testFn();
    console.log(`  ✔ [PASS] ${testName}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ✖ [FAIL] ${testName}`);
    console.error(`    ${err.message}\n`);
    testsFailed++;
  }
}

console.log('================================================================');
console.log('SUÍTE DE TESTES: BLOCO F14 — INTEGRAÇÃO AO CRONOGRAMA EXISTENTE');
console.log('================================================================\n');

const testProjectId = 'prj-praia-01';

// 1. Relação: Projeto -> Cronograma -> Etapas -> Entregas -> Apresentações
runTest('1.1 - Relação canônica estruturada no StudioState e tarefas do projeto', () => {
  const project = StudioState.getProject(testProjectId);
  assert.ok(project, 'Projeto deve existir');

  const tasks = StudioState.getProjectTasks(testProjectId);
  assert.ok(Array.isArray(tasks) && tasks.length > 0, 'Cronograma deve possuir tarefas');

  // Cada tarefa pertence ao cronograma do projeto e possui relação com uma etapa
  tasks.forEach(t => {
    assert.strictEqual(t.projectId, testProjectId);
    const stage = StudioState.resolveTaskStage(t);
    assert.ok(StudioState.SCHEDULE_CANONICAL_STAGES.includes(stage), `Etapa ${stage} deve ser canônica`);
  });
});

// 2. Registro dos 4 Eventos de Ciclo de Vida do Cronograma
runTest('2.1 - Evento 1: Apresentação criada registra evento no cronograma', () => {
  const initialEventsCount = StudioState.getScheduleEvents(testProjectId).length;

  const newPres = StudioState.createPresentation({
    projectId: testProjectId,
    title: 'Apresentação Teste F14 - Nova Proposta',
    revision: 'REV01'
  }, 'Eduardo Marques');

  const events = StudioState.getScheduleEvents(testProjectId);
  assert.ok(events.length > initialEventsCount, 'Novo evento de cronograma deve ser registrado');
  
  const createdEvt = events.find(e => e.type === 'PRESENTATION_CREATED' && e.metadata?.presentationId === newPres.id);
  assert.ok(createdEvt, 'Evento PRESENTATION_CREATED deve existir');
  assert.strictEqual(createdEvt.stage, 'apresentacao');
  assert.ok(createdEvt.title.includes('Apresentação Teste F14'));
});

runTest('2.2 - Evento 2: Apresentação enviada para revisão registra evento no cronograma', () => {
  const pres = (StudioState.data.presentations || []).find(p => p.projectId === testProjectId && (p.status === 'rascunho' || p.status === 'draft'));
  assert.ok(pres, 'Deve existir apresentação em rascunho');

  StudioState.updatePresentation(pres.id, { status: 'in_review' }, 'Eduardo Marques');

  const events = StudioState.getScheduleEvents(testProjectId);
  const reviewEvt = events.find(e => e.type === 'PRESENTATION_IN_REVIEW' && e.metadata?.presentationId === pres.id);
  assert.ok(reviewEvt, 'Evento PRESENTATION_IN_REVIEW deve ser registrado');
  assert.strictEqual(reviewEvt.stage, 'revisao');
});

runTest('2.3 - Evento 3: Apresentação aprovada registra evento no cronograma', () => {
  const pres = (StudioState.data.presentations || []).find(p => p.projectId === testProjectId);
  assert.ok(pres, 'Apresentação deve existir');

  StudioState.approvePresentation(pres.id, 'Arquiteto Titular', 'Homologação oficial F14');

  const events = StudioState.getScheduleEvents(testProjectId);
  const approvedEvt = events.find(e => e.type === 'PRESENTATION_APPROVED' && e.metadata?.presentationId === pres.id);
  assert.ok(approvedEvt, 'Evento PRESENTATION_APPROVED deve ser registrado');
  assert.ok(approvedEvt.user.includes('Arquiteto Titular'));
});

runTest('2.4 - Evento 4: Finalização de entrega registra evento no cronograma', () => {
  const result = StudioState.finalizeProjectDeliveryPackage(testProjectId, {
    revision: 'REV04',
    confirmed: true,
    confirmWarnings: true,
    user: 'Eduardo Marques'
  });

  assert.strictEqual(result.success, true);
  const events = StudioState.getScheduleEvents(testProjectId);
  const deliveryEvt = events.find(e => e.type === 'DELIVERY_FINALIZED' && e.metadata?.revision === 'REV04');
  assert.ok(deliveryEvt, 'Evento DELIVERY_FINALIZED deve ser registrado');
  assert.strictEqual(deliveryEvt.stage, 'entrega');
});

// 3. As 6 Etapas Canônicas (briefing, estudo, projeto, apresentação, revisão, entrega)
runTest('3.1 - As 6 etapas canônicas estão catalogadas e permitem associação estrita', () => {
  const canonical = ['briefing', 'estudo', 'projeto', 'apresentacao', 'revisao', 'entrega'];
  assert.deepStrictEqual(StudioState.SCHEDULE_CANONICAL_STAGES, canonical);

  const task = StudioState.getProjectTasks(testProjectId)[0];
  assert.ok(task, 'Tarefa deve existir');

  canonical.forEach(st => {
    StudioState.associateTaskToStage(task.id, st, { presentationId: 'pres-123' });
    assert.strictEqual(task.etapa, st);
    assert.strictEqual(task.presentationId, 'pres-123');
  });

  // Rejeita etapa desconhecida
  assert.throws(() => {
    StudioState.associateTaskToStage(task.id, 'etapa_invalida_x');
  }, /Etapa inválida/);
});

// 4. Sincronização Leve de Status (Sem Duplicação de Banco)
runTest('4.1 - Sincronização leve atualiza percentuais e referências sem copiar documentos pesados', () => {
  // Cadastra uma tarefa de entrega no cronograma
  const delTask = {
    id: 'tsk-entrega-teste',
    projectId: testProjectId,
    nome_tarefa: 'Entrega Final e Emissão do Pacote',
    disciplina_projeto: 'Arquitetura',
    etapa: 'entrega',
    porcentagem: 50,
    status: 'Em Andamento'
  };
  StudioState.data.tasks.push(delTask);

  // Finaliza a entrega
  StudioState.finalizeProjectDeliveryPackage(testProjectId, {
    revision: 'REV05',
    confirmed: true,
    confirmWarnings: true,
    user: 'Eduardo Marques'
  });

  const updatedTask = StudioState.data.tasks.find(t => t.id === 'tsk-entrega-teste');
  assert.ok(updatedTask, 'Tarefa de entrega deve existir');
  assert.strictEqual(updatedTask.porcentagem, 100, 'Tarefa de entrega deve ser concluída na emissão');
  assert.ok(updatedTask.deliveryId, 'Tarefa deve conter apenas ponteiro deliveryId');
  assert.strictEqual(updatedTask.deliverySnapshot, undefined, 'Não deve duplicar snapshot pesado na tarefa');

  // Limpa fixture
  StudioState.data.tasks = StudioState.data.tasks.filter(t => t.id !== 'tsk-entrega-teste');
});

// 5. Links no Cronograma ("Ver apresentação", "Ver entrega", "Ver revisão")
runTest('5.1 - CronogramaIntegration responde aos links rápidos de navegação', () => {
  const task = StudioState.getProjectTasks(testProjectId)[0];

  const presResult = CronogramaIntegration.openPresentationForTask(task.id);
  assert.ok(presResult.success, 'Ver apresentação deve despachar com sucesso');

  const delResult = CronogramaIntegration.openDeliveryForTask(task.id);
  assert.ok(delResult.success, 'Ver entrega deve despachar com sucesso');

  const revResult = CronogramaIntegration.openRevisionForTask(task.id);
  assert.ok(revResult.success, 'Ver revisão deve despachar com sucesso');
});

// 6. Presença dos Links no HTML do Cronograma (Kanban e Tabela)
runTest('6.1 - HTML do Cronograma renderiza os links contextuais sem quebrar', () => {
  const project = StudioState.getProject(testProjectId);
  const tasks = StudioState.getProjectTasks(testProjectId);
  const html = renderIntegratedCronograma(project, tasks);

  assert.ok(html.includes('Ver apresentação'), 'Deve conter link "Ver apresentação"');
  assert.ok(html.includes('Ver entrega'), 'Deve conter link "Ver entrega"');
  assert.ok(html.includes('Ver revisão'), 'Deve conter link "Ver revisão"');
});

// 7. Camada de Compatibilidade para Tarefas Legadas
runTest('7.1 - Camada de compatibilidade infere etapas legadas sem erro', () => {
  const legacyTask1 = { nome_tarefa: 'Estudo Preliminar de Fachada', disciplina_projeto: 'Arquitetura' };
  const legacyTask2 = { nome_tarefa: 'Renderização 3D das Câmeras', disciplina_projeto: '3D' };
  const legacyTask3 = { nome_tarefa: 'Entrega Final e Emissão do Pacote', disciplina_projeto: 'Arquitetura' };

  assert.strictEqual(StudioState.resolveTaskStage(legacyTask1), 'estudo');
  assert.strictEqual(StudioState.resolveTaskStage(legacyTask2), 'apresentacao');
  assert.strictEqual(StudioState.resolveTaskStage(legacyTask3), 'entrega');
});

// 8. Cronograma Existente Continua Funcionando Integralmente (Sem Regressão)
runTest('8.1 - Cronograma existente continua operando cálculos de avanço e KPIs', () => {
  const ws = StudioState.getProjectDevWorkspace(testProjectId);
  assert.ok(ws.schedule, 'Cronograma deve estar conectado no workspace');
  assert.strictEqual(typeof ws.schedule.progressPct, 'number', 'Avanço deve ser numérico');
  assert.ok(ws.schedule.progressPct >= 0 && ws.schedule.progressPct <= 100);
  assert.ok(Array.isArray(ws.schedule.tasks), 'Tarefas preservadas');
});

console.log('\n================================================================');
console.log(`RESULTADO FINAL: ${testsPassed} testes passaram, ${testsFailed} falharam.`);
console.log('================================================================\n');

if (testsFailed > 0) {
  process.exit(1);
}
