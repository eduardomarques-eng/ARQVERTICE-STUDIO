/**
 * ================================================================
 * ARQVERTICE STUDIO — TESTES D06: MOTOR DE GERAÇÃO DE RENDERS
 * ================================================================
 * Suíte de testes automatizados com provider mockado para validar:
 * 1. Abstração de Provedor (VisualGenerationProvider & Registry)
 * 2. Compilação de Múltiplos Contextos (Zero prompt bruto enviado)
 * 3. Seleção Inteligente de Referências Pertinentes
 * 4. Controle de Pesos de Camadas Arquitetônicas
 * 5. Ciclo de Vida do RENDER_JOB (QUEUED -> GENERATING -> SUCCEEDED)
 * 6. Cancelamento Ativo de Geração (CANCELLED)
 * 7. Tratamento de Falha & Retry Seguro (FAILED -> RETRY)
 * 8. Imutabilidade de Arquivos, Metadados e Custos
 * 9. Governança de Aprovação Estritamente Humana (Proibição de auto-aprovação de IA)
 * 10. Rejeição Formal com Motivo e Preservação Histórica
 * 11. Comparação Lado a Lado V01 × V02
 * 12. Renderização da Interface do Usuário (RenderEngineModule)
 */

global.window = global;
global.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  body: {
    appendChild: () => {}
  }
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {}
};

const assert = require('assert');
const StudioState = require('../js/state.js');
global.StudioState = StudioState;

const {
  VisualGenerationProvider,
  MockVisualGenerationProvider,
  GeminiVisualGenerationProvider,
  RenderProviderRegistry
} = require('../js/render-providers.js');
const RenderEngineModule = require('../js/render-engine-module.js');

let passedTests = 0;
let failedTests = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  ✓ ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${desc}`);
    console.error(err);
    failedTests++;
  }
}

async function itAsync(desc, fn) {
  try {
    await fn();
    console.log(`  ✓ ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${desc}`);
    console.error(err);
    failedTests++;
  }
}

(async function runTests() {
  console.log('\n====================================================================');
  console.log('ARQVERTICE STUDIO — TESTES DO BLOCO D06 (MOTOR DE GERAÇÃO DE RENDERS)');
  console.log('====================================================================\n');

  StudioState.init();

  const projectId = 'prj-praia-01';
  const environmentId = 'amb-sala-01';
  const cameraId = 'cam-sala-01';

  // ------------------------------------------------------------------
  // 1. ABSTRAÇÃO DE PROVEDORES (VisualGenerationProvider & Registry)
  // ------------------------------------------------------------------
  console.log('--- 1. Abstração de Provedores de Render (Prompt D06 Itens 2 e 22) ---');

  it('VisualGenerationProvider não deve permitir instanciação direta por ser abstrata', () => {
    assert.throws(() => {
      new VisualGenerationProvider();
    }, /classe abstrata/i);
  });

  it('RenderProviderRegistry deve conter os providers mock e gemini registrados por padrão', () => {
    assert(RenderProviderRegistry.has('mock'), 'Registry deve conter mock');
    assert(RenderProviderRegistry.has('gemini'), 'Registry deve conter gemini');
    const mockProvider = RenderProviderRegistry.get('mock');
    assert(mockProvider instanceof VisualGenerationProvider, 'mock deve herdar de VisualGenerationProvider');
    const caps = mockProvider.getCapabilities();
    assert.strictEqual(caps.providerName, 'mock');
    assert(Array.isArray(caps.supportedModels), 'supportedModels deve ser array');
  });

  // ------------------------------------------------------------------
  // 2. COMPILAÇÃO DE MÚLTIPLOS CONTEXTOS (Prompt D06 Itens 1, 5 e 6)
  // ------------------------------------------------------------------
  console.log('\n--- 2. Compilação de Múltiplos Contextos (Zero Prompt Bruto) ---');

  it('compileRenderPrompt deve agregar CURRENT_INTENT, PROJETO, AMBIENTE, CÂMERA e LOCKS', () => {
    const rawIntent = 'Troque o sofá por um modelo mais leve.';
    const compiled = StudioState.compileRenderPrompt(projectId, environmentId, cameraId, rawIntent);

    assert(compiled, 'Pacote compilado não pode ser nulo');
    assert.strictEqual(compiled.packageType, 'COMPILED_RENDER_PROMPT');
    assert.strictEqual(compiled.userIntent, rawIntent);

    // O prompt completo NUNCA deve ser idêntico à frase bruta isolada
    assert.notStrictEqual(compiled.fullPrompt, rawIntent);
    assert(compiled.fullPrompt.includes('CURRENT INTENT: "Troque o sofá por um modelo mais leve."'), 'Deve conter a intenção contextualizada');
    assert(compiled.fullPrompt.includes('ENVIRONMENT:'), 'Deve conter contexto do ambiente');
    assert(compiled.fullPrompt.includes('CAMERA:'), 'Deve conter contexto da câmera');
    assert(compiled.fullPrompt.includes('RIGID ARCHITECTURAL LOCKS:'), 'Deve conter travas arquitetônicas');
    assert(compiled.negativePrompt.includes('deformed geometry'), 'Deve conter negative prompt');
  });

  // ------------------------------------------------------------------
  // 3. SELEÇÃO DE REFERÊNCIAS PERTINENTES (Prompt D06 Item 7)
  // ------------------------------------------------------------------
  console.log('\n--- 3. Seleção Inteligente de Referências Pertinentes ---');

  it('compileRenderPrompt deve selecionar somente referências pertinentes e não todo o projeto', () => {
    const compiled = StudioState.compileRenderPrompt(projectId, environmentId, cameraId, 'Quero uma iluminação mais aconchegante.');

    assert(Array.isArray(compiled.selectedReferences), 'selectedReferences deve ser array');
    // Deve conter referências específicas e não explodir em dezenas
    assert(compiled.selectedReferences.length > 0 && compiled.selectedReferences.length <= 5, 'Deve selecionar um número controlado de referências (1 a 5)');
    const hasCameraRef = compiled.selectedReferences.some(r => r.type === 'CAMERA_REFERENCE' || r.type === 'CAMERA_BASE_IMAGE' || r.type === 'VISUAL_REFERENCE');
    assert(hasCameraRef, 'Deve conter referência associada à câmera ou visual do ambiente');
  });

  // ------------------------------------------------------------------
  // 4. CONTROLE DE PESOS DE CAMADAS (Prompt D06 Item 8)
  // ------------------------------------------------------------------
  console.log('\n--- 4. Controle de Pesos de Camadas (Weight Control Framework) ---');

  it('Deve incorporar as 6 camadas de peso oficiais (geometry, camera, style, material, furniture, lighting)', () => {
    const customWeights = {
      geometry: 1.0,
      camera: 0.95,
      style: 0.85,
      material: 0.80,
      lighting: 0.90,
      furniture: 0.65
    };

    const compiled = StudioState.compileRenderPrompt(projectId, environmentId, cameraId, 'Crie uma versão mais sofisticada.', {
      weightLayers: customWeights
    });

    assert.deepStrictEqual(compiled.weightControl, customWeights);
    assert(compiled.fullPrompt.includes('WEIGHT PRIORITIES:'), 'Prompt deve conter pesos calibrados');
    assert(compiled.fullPrompt.includes('geometry=1'), 'Deve explicitar peso de geometria');
    assert(compiled.fullPrompt.includes('lighting=0.9'), 'Deve explicitar peso de iluminação');
  });

  // ------------------------------------------------------------------
  // 5. CICLO DE VIDA DO RENDER_JOB (Prompt D06 Itens 3, 4 e 9)
  // ------------------------------------------------------------------
  console.log('\n--- 5. Ciclo de Vida do RENDER_JOB (QUEUED -> GENERATING -> SUCCEEDED) ---');

  let testJobId = null;

  it('createRenderJob deve enfileirar job com status inicial QUEUED e metadados completos', () => {
    const job = StudioState.createRenderJob({
      projectId,
      environmentId,
      cameraId,
      userIntent: 'Troque o sofá por um modelo mais leve e adicione luz indireta.',
      provider: 'mock',
      parameters: {
        resolution: '4K UHD (3840x2160)',
        seed: 42055
      }
    });

    assert(job && job.id, 'Job deve possuir ID');
    assert.strictEqual(job.status, 'QUEUED');
    assert.strictEqual(job.progress, 0);
    assert.strictEqual(job.provider, 'mock');
    assert.strictEqual(job.model, 'arqvertice-mock-engine-v1');
    assert(job.compiledPrompt, 'Deve possuir prompt compilado');
    testJobId = job.id;
  });

  await itAsync('startRenderJob deve transitar para GENERATING e concluir como SUCCEEDED com output', async () => {
    assert(testJobId, 'testJobId deve existir');
    const res = await StudioState.startRenderJob(testJobId);

    assert(res.success, 'startRenderJob deve resolver com sucesso');
    assert.strictEqual(res.job.status, 'SUCCEEDED');
    assert.strictEqual(res.job.progress, 100);
    assert(res.output && res.output.imageUrl, 'Output deve conter imageUrl');
    assert(res.output.seed, 'Output deve conter seed');
    assert(res.output.tokensUsed > 0, 'Output deve conter tokens consumidos');
    assert(res.output.estimatedCostUsd >= 0, 'Output deve conter custo estimado');
  });

  // ------------------------------------------------------------------
  // 6. CANCELAMENTO ATIVO DE GERAÇÃO (Prompt D06 Item 13)
  // ------------------------------------------------------------------
  console.log('\n--- 6. Cancelamento Ativo de Geração (CANCELLED) ---');

  it('cancelRenderJob deve permitir cancelar um job em status QUEUED', () => {
    const job = StudioState.createRenderJob({
      projectId,
      environmentId,
      cameraId,
      userIntent: 'Render que será cancelado.',
      provider: 'mock'
    });

    assert.strictEqual(job.status, 'QUEUED');
    const cancelRes = StudioState.cancelRenderJob(job.id, 'Usuário desistiu antes do início');

    assert(cancelRes.success, 'Cancelamento deve ser bem-sucedido');
    assert.strictEqual(cancelRes.job.status, 'CANCELLED');
    assert.strictEqual(cancelRes.job.errorMessage, 'Usuário desistiu antes do início');
  });

  it('Não deve permitir cancelar um job que já tenha concluído (SUCCEEDED)', () => {
    assert(testJobId, 'testJobId deve existir');
    const cancelRes = StudioState.cancelRenderJob(testJobId);
    assert(!cancelRes.success, 'Não deve permitir cancelar job finalizado');
    assert(cancelRes.error.includes('Não é possível cancelar'));
  });

  // ------------------------------------------------------------------
  // 7. TRATAMENTO DE FALHA E RETRY SEGURO (Prompt D06 Item 12)
  // ------------------------------------------------------------------
  console.log('\n--- 7. Tratamento de Falha & Retry Seguro ---');

  let failedJobId = null;

  await itAsync('startRenderJob deve registrar FAILED quando o provider retornar erro', async () => {
    const failJob = StudioState.createRenderJob({
      projectId,
      environmentId,
      cameraId,
      userIntent: 'Simulando falha de GPU.',
      provider: 'mock',
      parameters: {
        simulateFailure: true
      }
    });

    failedJobId = failJob.id;
    const res = await StudioState.startRenderJob(failedJobId);

    assert(!res.success, 'startRenderJob deve falhar conforme simulado');
    assert.strictEqual(res.job.status, 'FAILED');
    assert(res.job.errorMessage.includes('Mock Provider Error'), 'Deve registrar mensagem de erro detalhada');
  });

  await itAsync('retryRenderJob deve permitir nova tentativa e incrementar retryCount com segurança', async () => {
    assert(failedJobId, 'failedJobId deve existir');
    const jobBefore = StudioState.data.renderJobs.find(j => j.id === failedJobId);
    assert.strictEqual(jobBefore.status, 'FAILED');
    assert.strictEqual(jobBefore.retryCount, 0);

    // Remove gatilho de falha simulada para o retry ter sucesso
    jobBefore.parameters.simulateFailure = false;

    const retryRes = await StudioState.retryRenderJob(failedJobId);

    assert(retryRes.success, 'Retry deve ter sucesso após remoção de erro simulado');
    assert.strictEqual(retryRes.job.status, 'SUCCEEDED');
    assert.strictEqual(retryRes.job.retryCount, 1, 'retryCount deve ser incrementado para 1');
    assert.strictEqual(retryRes.job.errorMessage, null, 'errorMessage deve ser limpa no retry');
  });

  // ------------------------------------------------------------------
  // 8. IMUTABILIDADE E METADADOS DE CUSTO (Prompt D06 Itens 9, 10, 11 e 14)
  // ------------------------------------------------------------------
  console.log('\n--- 8. Imutabilidade e Rastreabilidade de Metadados e Custo ---');

  it('Cada render deve registrar fielmente provider, modelo, parâmetros e estimativa de custo', () => {
    const job = StudioState.data.renderJobs.find(j => j.id === testJobId);
    assert(job, 'Job testado deve existir');
    assert(job.output, 'Deve conter output');
    assert.strictEqual(job.output.providerUsed, 'mock');
    assert.strictEqual(job.output.modelUsed, 'arqvertice-mock-engine-v1');
    assert.strictEqual(typeof job.output.tokensUsed, 'number');
    assert.strictEqual(typeof job.output.estimatedCostUsd, 'number');
    assert(job.output.resolution.includes('4K'), 'Deve registrar resolução');
  });

  it('Novas gerações não devem sobrescrever renders anteriores (Imutabilidade)', () => {
    const jobsCountBefore = StudioState.data.renderJobs.length;
    const newJob = StudioState.createRenderJob({
      projectId,
      environmentId,
      cameraId,
      userIntent: 'Novo render independente.',
      provider: 'mock'
    });

    assert.strictEqual(StudioState.data.renderJobs.length, jobsCountBefore + 1);
    assert(StudioState.data.renderJobs.some(j => j.id === testJobId), 'Render anterior deve permanecer intacto');
  });

  // ------------------------------------------------------------------
  // 9. GOVERNANÇA DE APROVAÇÃO ESTRITAMENTE HUMANA (Prompt D06 Item 15)
  // ------------------------------------------------------------------
  console.log('\n--- 9. Governança de Aprovação Estritamente Humana ---');

  it('O modelo de IA NÃO pode autoaprovar sua própria imagem gerada', () => {
    assert(testJobId, 'testJobId deve existir');
    assert.throws(() => {
      StudioState.approveRenderJob(testJobId, 'AI-Model-Imagen-3');
    }, /A IA não pode autoaprovar/i);
  });

  it('Somente o usuário humano pode aprovar o render (APPROVED)', () => {
    const humanArchitect = 'Eduardo Marques (Arquiteto Titular)';
    const appRes = StudioState.approveRenderJob(testJobId, humanArchitect);

    assert(appRes.success, 'Aprovação humana deve ser bem-sucedida');
    assert.strictEqual(appRes.job.status, 'APPROVED');
    assert.strictEqual(appRes.job.approvedBy, humanArchitect);
    assert(appRes.job.approvedAt, 'Deve registrar data de aprovação');

    // Deve sincronizar com o ambiente
    const env = StudioState.getEnvironment(projectId, environmentId);
    assert.strictEqual(env.approvedRenderUrl, appRes.job.output.imageUrl);
  });

  // ------------------------------------------------------------------
  // 10. REJEIÇÃO FORMAL COM MOTIVO (Prompt D06 Itens 4 e 15)
  // ------------------------------------------------------------------
  console.log('\n--- 10. Rejeição Formal com Motivo ---');

  it('rejectRenderJob deve marcar status REJECTED e preservar histórico e motivo', () => {
    const jobToReject = StudioState.data.renderJobs.find(j => j.id === failedJobId);
    assert(jobToReject, 'Job deve existir');

    const rejectRes = StudioState.rejectRenderJob(failedJobId, 'Iluminação muito fria e cores desbalanceadas.', 'Eduardo Marques');

    assert(rejectRes.success, 'Rejeição deve ter sucesso');
    assert.strictEqual(rejectRes.job.status, 'REJECTED');
    assert.strictEqual(rejectRes.job.rejectionReason, 'Iluminação muito fria e cores desbalanceadas.');
    assert(rejectRes.job.rejectedAt, 'Deve registrar timestamp de rejeição');
  });

  // ------------------------------------------------------------------
  // 11. COMPARAÇÃO LADO A LADO V01 × V02 (Prompt D06 Item 19)
  // ------------------------------------------------------------------
  console.log('\n--- 11. Comparação Lado a Lado V01 × V02 ---');

  it('getRenderComparisonData deve estruturar dados de comparação lado a lado entre dois renders', () => {
    const comp = StudioState.getRenderComparisonData(testJobId, failedJobId);

    assert(comp.isComparable, 'Renders devem ser comparáveis');
    assert(comp.itemA && comp.itemB, 'Deve conter ambos os itens');
    assert(Array.isArray(comp.comparisonPoints), 'Deve conter pontos de comparação estruturados');
    assert(comp.comparisonPoints.some(p => p.label === 'Versão'));
    assert(comp.comparisonPoints.some(p => p.label === 'Status'));
    assert(comp.comparisonPoints.some(p => p.label === 'Intenção'));
  });

  // ------------------------------------------------------------------
  // 12. PROMOÇÃO PARA REFERÊNCIA VISUAL (Prompt D06 Item 17)
  // ------------------------------------------------------------------
  console.log('\n--- 12. Promoção de Render para Referência Visual (D02) ---');

  it('useRenderAsReference deve adicionar o render aprovado à biblioteca de referências', () => {
    const refItem = StudioState.useRenderAsReference(testJobId, environmentId);

    assert(refItem && refItem.id, 'Item de referência deve ser criado');
    assert.strictEqual(refItem.category, 'APPROVED_OUTPUT');
    assert.strictEqual(refItem.priority, 'APPROVED');
    assert.strictEqual(refItem.source, 'INTERNAL_RENDER_ENGINE');
  });

  // ------------------------------------------------------------------
  // 13. RENDERIZAÇÃO DA INTERFACE DO USUÁRIO (Prompt D06 Itens 17 e 18)
  // ------------------------------------------------------------------
  console.log('\n--- 13. Interface do Usuário (RenderEngineModule) ---');

  it('RenderEngineModule.render deve gerar a interface da Seção 6 completa', () => {
    const project = StudioState.getProject(projectId);
    const env = StudioState.getEnvironment(projectId, environmentId);
    const visData = StudioState.getEnvironmentVisualization(projectId, environmentId);

    const html = RenderEngineModule.render(visData, env, project);

    assert(typeof html === 'string', 'HTML deve ser string');
    assert(html.includes('vis-section-renders'), 'Deve conter ID da seção');
    assert(html.includes('Motor de Geração de Renders'), 'Deve conter título oficial');
    assert(html.includes('render-camera-select'), 'Deve conter seletor de câmeras');
    assert(html.includes('render-user-intent'), 'Deve conter campo de intenção');
    assert(html.includes('Controle de Pesos de Prioridade'), 'Deve conter controle de pesos');
    assert(html.includes('render-compare-dock'), 'Deve conter dock flutuante de comparação');
    assert(html.includes('btn-trigger-render'), 'Deve conter botão de disparo');
  });

  console.log('\n====================================================================');
  console.log(`TOTAL DE TESTES EXECUTADOS: ${passedTests + failedTests}`);
  console.log(`PASSOU: ${passedTests}`);
  console.log(`FALHOU: ${failedTests}`);
  console.log('====================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    console.log('✓ TODOS OS TESTES DO BLOCO D06 PASSARAM COM SUCESSO!\n');
  }
})();
