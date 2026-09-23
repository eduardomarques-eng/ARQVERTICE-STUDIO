/**
 * ============================================================================
 * ARQVERTICE STUDIO — SUÍTE DE TESTES AUTOMATIZADOS (D01)
 * WORKSPACE DE VISUALIZAÇÃO DOS AMBIENTES
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
  querySelectorAll: () => [],
  body: {
    appendChild: () => {}
  }
};
global.escapeHTML = function (str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};
global.formatDateBR = (d) => d || '';
global.formatRelativeDate = (d) => 'recente';

const assert = require('assert');
const StudioState = require('../js/state.js');
global.StudioState = StudioState;

// Mock de StudioApp
global.StudioApp = {
  showToast: () => {},
  navigateTo: () => {},
  openEnvironmentWorkspace: () => {},
  openEnvironmentVisualization: () => {}
};

const { EnvironmentVisualizationModule } = require('../js/environment-visualization-module.js');

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
console.log('ARQVERTICE STUDIO — TESTES D01 (WORKSPACE DE VISUALIZAÇÃO)');
console.log('====================================================================');

describe('1. Inicialização de Estruturas e Coleções D01', () => {
  StudioState.init();

  it('Deve inicializar as coleções environmentVisualizations, environmentCameras e environmentRenders', () => {
    assert(Array.isArray(StudioState.data.environmentVisualizations), 'environmentVisualizations deve ser array');
    assert(Array.isArray(StudioState.data.environmentCameras), 'environmentCameras deve ser array');
    assert(Array.isArray(StudioState.data.environmentRenders), 'environmentRenders deve ser array');
  });

  it('Deve conter os 7 status canônicos definidos em ENVIRONMENT_VISUALIZATION_STATUSES', () => {
    const statuses = StudioState.ENVIRONMENT_VISUALIZATION_STATUSES;
    assert.deepStrictEqual(statuses, [
      'NOT_STARTED',
      'PREPARING',
      'READY',
      'GENERATING',
      'IN_REVIEW',
      'APPROVED',
      'SUPERSEDED'
    ]);
  });

  it('Deve possuir sementes de teste para o ambiente amb-sala-01', () => {
    const vis = StudioState.data.environmentVisualizations.find(v => v.environmentId === 'amb-sala-01');
    assert(vis, 'Deve existir visualização para amb-sala-01');
    assert.strictEqual(vis.status, 'APPROVED');
    assert.strictEqual(vis.activeVersion, 'V03');
  });
});

describe('2. Acesso ao Ambiente e Carregamento de Visualização', () => {
  it('Deve carregar getEnvironmentVisualization com projeto e ambiente válidos', () => {
    const visData = StudioState.getEnvironmentVisualization('prj-praia-01', 'amb-sala-01');
    assert(visData, 'visData não deve ser nulo');
    assert(visData.visualization, 'visData.visualization deve existir');
    assert.strictEqual(visData.visualization.environmentId, 'amb-sala-01');
  });

  it('Deve conter os 8 painéis na estrutura consolidada retornada', () => {
    const visData = StudioState.getEnvironmentVisualization('prj-praia-01', 'amb-sala-01');
    assert(visData.base, 'Deve conter painel base');
    assert(Array.isArray(visData.references), 'Deve conter referências');
    assert(visData.visualization.humanizedFloorPlan, 'Deve conter planta humanizada');
    assert(Array.isArray(visData.base.perspectives), 'Deve conter perspectivas');
    assert(Array.isArray(visData.cameras), 'Deve conter câmeras');
    assert(Array.isArray(visData.renders), 'Deve conter renders');
    assert(Array.isArray(visData.versions), 'Deve conter versões');
    assert(visData.visualContext, 'Deve conter memória visual / contexto');
  });
});

describe('3. Referências: Prioridade PRIMARY primeiro e Categorização Estrita', () => {
  it('Deve separar referências e priorizar PRIMARY', () => {
    const visData = StudioState.getEnvironmentVisualization('prj-praia-01', 'amb-sala-01');
    assert(visData.primaryReference, 'Deve identificar primaryReference');
    assert.strictEqual(visData.primaryReference.priority, 'PRIMARY');
  });

  it('Todas as referências devem ter categorias explícitas (não misturar categorias sem rotular)', () => {
    const visData = StudioState.getEnvironmentVisualization('prj-praia-01', 'amb-sala-01');
    visData.references.forEach(ref => {
      assert(ref.category, `Referência ${ref.title} deve ter categoria`);
      assert(['MATERIAL', 'MOBILIARIO', 'ARQUITETURA', 'ESTILO', 'ILUMINACAO'].includes(ref.category.toUpperCase()),
        `Categoria inválida: ${ref.category}`);
    });
  });
});

describe('4. Contexto Visual Real (Antialucinação — Sem Dados Inventados)', () => {
  it('Deve extrair contexto visual a partir dos dados existentes', () => {
    const visData = StudioState.getEnvironmentVisualization('prj-praia-01', 'amb-sala-01');
    const ctx = visData.visualContext;
    assert(ctx.estilo, 'Deve conter estilo');
    assert(ctx.paleta, 'Deve conter paleta');
    assert(ctx.materiais, 'Deve conter materiais');
    assert(ctx.mobiliario, 'Deve conter mobiliario');
    assert(ctx.iluminacao, 'Deve conter iluminacao');
    assert(ctx.elementosPreservados, 'Deve conter elementos preservados');
    assert(ctx.elementosEvitar, 'Deve conter elementos a evitar');
  });

  it('Para ambiente novo sem dados, deve sinalizar UNKNOWN ou NOT_CONFIRMED em vez de inventar', () => {
    const visDataNew = StudioState.getEnvironmentVisualization('prj-praia-01', 'amb-novo-fantasma');
    assert.strictEqual(visDataNew.base.floorPlan.status, 'UNKNOWN');
    assert.strictEqual(visDataNew.visualization.status, 'NOT_STARTED');
  });
});

describe('5. Status do Ambiente e Transições', () => {
  it('Deve atualizar status para PREPARING, READY, etc.', () => {
    const updated = StudioState.updateEnvironmentVisualizationStatus('amb-sala-01', 'READY', 'Arquiteto');
    assert(updated);
    assert.strictEqual(updated.status, 'READY');

    const check = StudioState.data.environmentVisualizations.find(v => v.environmentId === 'amb-sala-01');
    assert.strictEqual(check.status, 'READY');
  });

  it('Deve recusar status fora dos 7 estados normatizados', () => {
    assert.throws(() => {
      StudioState.updateEnvironmentVisualizationStatus('amb-sala-01', 'STATUS_INVALIDO', 'Arquiteto');
    }, /Status inválido/);
  });
});

describe('6. Estado de Geração e Proteção Anti-Clique Múltiplo', () => {
  it('Deve ativar isGenerating e status GENERATING durante processamento', () => {
    StudioState.simulateEnvironmentGeneration('amb-sala-01', 500, (err, res) => {
      // Callback futuro
    });

    const vis = StudioState.data.environmentVisualizations.find(v => v.environmentId === 'amb-sala-01');
    assert.strictEqual(vis.isGenerating, true);
    assert.strictEqual(vis.status, 'GENERATING');
  });

  it('Deve bloquear múltiplas chamadas simultâneas acidentais', () => {
    // A geração já está em andamento pelo teste anterior
    let errorCaught = null;
    StudioState.simulateEnvironmentGeneration('amb-sala-01', 500, (err) => {
      errorCaught = err;
    });

    assert(errorCaught, 'Deve retornar erro de bloqueio de geração simultânea');
    assert(/já está em andamento/.test(errorCaught.message));
  });
});

describe('7. Aprovação de Renders e Atualização de Cabeçalho', () => {
  it('Deve permitir adicionar novo render e aprová-lo', () => {
    // Liberar estado de geração para o teste
    const vis = StudioState.data.environmentVisualizations.find(v => v.environmentId === 'amb-sala-01');
    vis.isGenerating = false;
    vis.status = 'IN_REVIEW';

    const render = StudioState.addEnvironmentRender('amb-sala-01', {
      imageUrl: 'https://exemplo.com/render-teste.jpg',
      version: 'V04',
      viewType: 'Perspectiva Noturna',
      renderEngine: 'Corona Renderer'
    });

    assert(render.id, 'Render deve ter id gerado');
    assert.strictEqual(render.status, 'DRAFT');

    // Aprovar render
    const visUpdated = StudioState.approveEnvironmentRender('amb-sala-01', render.id, 'Pedro (Cliente)');
    assert.strictEqual(visUpdated.approvedRenderId, render.id);
    assert.strictEqual(visUpdated.status, 'APPROVED');

    const renderCheck = StudioState.data.environmentRenders.find(r => r.id === render.id);
    assert.strictEqual(renderCheck.status, 'APPROVED');
    assert.strictEqual(renderCheck.approvedBy, 'Pedro (Cliente)');
  });
});

describe('8. Isolamento Rígido Multi-Tenant / Multi-Projeto', () => {
  it('Nenhuma referência ou ativo de outro projeto deve vazar na consulta de visualização', () => {
    // Criar projeto 2 com ambiente e referências isoladas
    const proj2Id = 'prj-isolado-99';
    const env2Id = 'amb-isolado-99';

    // Inserir referência no projeto 2 via surveyAssets
    StudioState.data.surveyAssets.push({
      id: 'ref-segredo-proj2',
      projectId: proj2Id,
      environmentId: env2Id,
      title: 'Referência Secreta do Projeto 2',
      category: 'MATERIAL',
      priority: 'PRIMARY',
      status: 'Aprovado'
    });

    // Inserir perspectiva no projeto 2
    StudioState.data.surveyAssets.push({
      id: 'persp-segredo-proj2',
      projectId: proj2Id,
      environmentId: env2Id,
      title: 'Perspectiva Secreta do Projeto 2',
      category: 'PERSPECTIVA',
      priority: 'PRIMARY',
      status: 'Aprovado'
    });

    // Consultar o ambiente da praia (prj-praia-01 / amb-sala-01)
    const visPraia = StudioState.getEnvironmentVisualization('prj-praia-01', 'amb-sala-01');
    
    // Verificar que a referência do projeto 2 NÃO aparece
    const leakRef = visPraia.references.find(r => r.id === 'ref-segredo-proj2');
    assert(!leakRef, 'VAZAMENTO DETECTADO: Referência do projeto 2 apareceu no projeto 1!');

    // Verificar que as perspectivas do projeto 2 não aparecem
    const leakPersp = visPraia.base.perspectives.find(p => p.projectId === proj2Id);
    assert(!leakPersp, 'VAZAMENTO DETECTADO: Perspectiva do projeto 2 apareceu no projeto 1!');
  });
});

describe('9. Renderização do Módulo de Visualização (UI/HTML)', () => {
  it('EnvironmentVisualizationModule.render deve gerar HTML estruturado com as 8 seções e cabeçalho', () => {
    const env = StudioState.getActiveEnvironment();
    const proj = StudioState.getActiveProject();

    const html = EnvironmentVisualizationModule.render(env, proj);
    assert(html.includes('vis-workspace-container'), 'Deve conter container da visualização');
    assert(html.includes('1. Base do Ambiente'), 'Deve conter seção 1 Base');
    assert(html.includes('2. Referências Homologadas'), 'Deve conter seção 2 Referências');
    assert(html.includes('3. Planta Humanizada'), 'Deve conter seção 3 Planta');
    assert(html.includes('4. Perspectivas Oficiais do Revit'), 'Deve conter seção 4 Perspectivas');
    assert(html.includes('5. Câmeras & Enquadramentos'), 'Deve conter seção 5 Câmeras');
    assert(html.includes('6. Renders & Gerações Visuais'), 'Deve conter seção 6 Renders');
    assert(html.includes('7. Histórico de Versões do Ambiente'), 'Deve conter seção 7 Versões');
    assert(html.includes('8. Contexto Visual & Memória do Ambiente'), 'Deve conter seção 8 Memória');
  });

  it('Cabeçalho deve exibir nome do projeto, ambiente, área, versão e status', () => {
    const env = StudioState.getActiveEnvironment();
    const proj = StudioState.getActiveProject();
    const html = EnvironmentVisualizationModule.render(env, proj);

    assert(html.includes(proj.name), 'Deve exibir nome do projeto');
    assert(html.includes(global.escapeHTML(env.name)), 'Deve exibir nome do ambiente');
    assert(html.includes('Versão:'), 'Deve exibir versão');
    assert(html.includes('Status da Visualização:'), 'Deve exibir seletor de status');
  });
});

console.log(`\n====================================================================`);
console.log(`RESULTADO FINAL: ${passedTests}/${totalTests} testes passaram (${failedTests} falhas).`);
console.log('====================================================================\n');

if (failedTests > 0) {
  process.exit(1);
}
