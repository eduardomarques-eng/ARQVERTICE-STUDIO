/**
 * ============================================================================
 * ARQVERTICE STUDIO — SUÍTE DE TESTES AUTOMATIZADOS (BLOCO C02)
 * LEVANTAMENTO E ORGANIZAÇÃO DA BASE DO PROJETO
 * ============================================================================
 */

// Mock de ambiente para execução em Node.js
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
const SurveyModule = require('../js/survey-module.js');

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
console.log('ARQVERTICE STUDIO — TESTES DO BLOCO C02 (LEVANTAMENTO & BASE)');
console.log('====================================================================');

describe('1. Inicialização e Catálogo de Ativos (SURVEY_ASSETS)', () => {
  StudioState.init();

  it('Deve carregar a base inicial de ativos do levantamento', () => {
    assert(StudioState.data.surveyAssets, 'surveyAssets deve existir no StudioState');
    assert(StudioState.data.surveyAssets.length >= 8, 'Deve conter pelo menos 8 ativos mockados para teste');
  });

  it('Deve permitir adicionar novo ativo com associação completa (Projeto + Ambiente + Categoria + Versão)', () => {
    const newAsset = StudioState.addSurveyAsset('prj-praia-01', {
      title: 'Planta de Cobertura e Telhado',
      category: 'PLANTA',
      environmentId: 'amb-sala-01',
      versionLabel: 'PLANTA V01',
      versionStatus: 'CURRENT',
      priority: 'PRIMARY',
      originalUrl: 'https://images.unsplash.com/photo-test-planta.png',
      thumbnailUrl: 'https://images.unsplash.com/photo-test-planta-thumb.png',
      isRevitOrigin: true,
      revitViewName: 'Planta - Cobertura',
      floorLevel: 'Cobertura',
      drawingScale: '1:50',
      orientation: 'Norte Verdadeiro'
    });

    assert(newAsset.id, 'Ativo deve possuir ID');
    assert.strictEqual(newAsset.projectId, 'prj-praia-01');
    assert.strictEqual(newAsset.environmentId, 'amb-sala-01');
    assert.strictEqual(newAsset.category, 'PLANTA');
    assert.strictEqual(newAsset.versionLabel, 'PLANTA V01');
    assert.strictEqual(newAsset.versionStatus, 'CURRENT');
    assert.strictEqual(newAsset.priority, 'PRIMARY');
    assert.strictEqual(newAsset.isRevitOrigin, true);
    assert.strictEqual(newAsset.drawingMetadata.floorLevel, 'Cobertura');
    assert.strictEqual(newAsset.drawingMetadata.drawingScale, '1:50');
  });
});

describe('2. Validação das 15 Categorias Oficiais do C02', () => {
  it('Deve suportar e validar as 15 categorias oficiais', () => {
    const validCategories = [
      'PLANTA', 'PLANTA_HUMANIZADA', 'PERSPECTIVA', 'VISTA', 'ELEVACAO',
      'CORTE', 'FACHADA', 'FOTO', 'MODELO_3D', 'MATERIAL', 'MOVEL',
      'ILUMINACAO', 'PAISAGISMO', 'ESTILO', 'OUTRO'
    ];

    validCategories.forEach(cat => {
      const asset = StudioState.addSurveyAsset('prj-praia-01', {
        title: `Teste de Categoria ${cat}`,
        category: cat,
        priority: 'SECONDARY',
        originalUrl: 'https://images.unsplash.com/test.png'
      });
      assert(validCategories.includes(asset.category), `Categoria ${asset.category} deve ser aceita`);
      StudioState.deleteSurveyAsset('prj-praia-01', asset.id);
    });
  });
});

describe('3. Versionamento Não-Destrutivo (PLANTA V01, V02...)', () => {
  it('Deve criar nova versão sem sobrescrever ou apagar a versão original', () => {
    const initialAsset = StudioState.addSurveyAsset('prj-praia-01', {
      title: 'Planta de Forro e Iluminação',
      category: 'PLANTA',
      environmentId: 'amb-sala-01',
      versionNumber: 1,
      versionLabel: 'PLANTA V01',
      versionStatus: 'CURRENT',
      originalUrl: 'https://images.unsplash.com/forro_v01.png'
    });

    // Criar nova versão V02
    const version2 = StudioState.createAssetVersion('prj-praia-01', initialAsset.id, {
      originalUrl: 'https://images.unsplash.com/forro_v02.png',
      observationNotes: 'Ajuste no layout dos circuitos perimetrais'
    });

    assert(version2, 'Nova versão deve ter sido gerada');
    assert.strictEqual(version2.versionNumber, 2);
    assert.strictEqual(version2.versionLabel, 'PLANTA V02');
    assert.strictEqual(version2.versionStatus, 'CURRENT');
    assert.strictEqual(version2.parentAssetId, initialAsset.id);

    // Validar que a V01 continua existindo intacta e passou a ser SUPERSEDED
    const v1Updated = StudioState.getSurveyAssetById(initialAsset.id);
    assert(v1Updated, 'Versão V01 original deve continuar existindo');
    assert.strictEqual(v1Updated.versionStatus, 'SUPERSEDED');
    assert.strictEqual(v1Updated.originalUrl, 'https://images.unsplash.com/forro_v01.png', 'URL da V01 não pode ser alterada');

    // Limpar teste
    StudioState.deleteSurveyAsset('prj-praia-01', initialAsset.id);
    StudioState.deleteSurveyAsset('prj-praia-01', version2.id);
  });
});

describe('4. Preservação de Referências Rejeitadas (REJECTED com Motivo)', () => {
  it('Referência rejeitada NÃO deve ser excluída e deve conter motivo formal', () => {
    const asset = StudioState.addSurveyAsset('prj-praia-01', {
      title: 'Lustre de Cristal Clássico Barroco',
      category: 'ILUMINACAO',
      environmentId: 'amb-sala-01',
      priority: 'OPTIONAL',
      originalUrl: 'https://images.unsplash.com/lustre_cristal.jpg'
    });

    const rejectionReasonText = 'Cliente solicitou estética 100% minimalista sem ornamentos clássicos.';
    StudioState.rejectSurveyAsset('prj-praia-01', asset.id, rejectionReasonText);

    const rejectedAsset = StudioState.getSurveyAssetById(asset.id);
    assert(rejectedAsset, 'Ativo rejeitado deve permanecer no banco/estado');
    assert.strictEqual(rejectedAsset.priority, 'REJECTED');
    assert.strictEqual(rejectedAsset.rejectionReason, rejectionReasonText);

    // Limpar
    StudioState.deleteSurveyAsset('prj-praia-01', asset.id);
  });
});

describe('5. Rastreabilidade de Metadados do Autodesk Revit', () => {
  it('Deve registrar câmera, vista, fase e finalidade de perspectiva do Revit', () => {
    const revitAsset = StudioState.addSurveyAsset('prj-praia-01', {
      title: 'Perspectiva Interna do Gourmet',
      category: 'PERSPECTIVA',
      environmentId: 'amb-sala-01',
      priority: 'PRIMARY',
      isRevitOrigin: true,
      revitViewName: '3D - Gourmet & Ilha',
      revitPhase: 'Nova Construção',
      revitCameraName: 'Cam_Gourmet_02',
      revitPurpose: 'Validação da coifa embutida e bancada Dekton',
      revitNotes: 'Lente 28mm com iluminação pontual',
      originalUrl: 'https://images.unsplash.com/revit_gourmet.png'
    });

    assert(revitAsset.isRevitOrigin, 'Flag de Revit deve ser verdadeira');
    assert.strictEqual(revitAsset.revitMetadata.viewName, '3D - Gourmet & Ilha');
    assert.strictEqual(revitAsset.revitMetadata.phase, 'Nova Construção');
    assert.strictEqual(revitAsset.revitMetadata.cameraName, 'Cam_Gourmet_02');
    assert.strictEqual(revitAsset.revitMetadata.purpose, 'Validação da coifa embutida e bancada Dekton');

    StudioState.deleteSurveyAsset('prj-praia-01', revitAsset.id);
  });
});

describe('6. Gestão de Conjuntos de Referência (REFERENCE_SET)', () => {
  it('Deve permitir criar, atualizar e listar REFERENCE_SET com itens associados', () => {
    const newSet = StudioState.createReferenceSet('prj-praia-01', {
      environmentId: 'amb-sala-01',
      name: 'Estar — Conforto Lumínico',
      description: 'Luminárias dimerizáveis e temperatura de 2700K',
      purpose: 'Alinhamento com o projeto luminotécnico',
      priority: 'PRIMARY',
      itemIds: ['asset-praia-ref-02']
    });

    assert(newSet.id, 'Reference Set deve possuir ID');
    assert.strictEqual(newSet.name, 'Estar — Conforto Lumínico');
    assert.strictEqual(newSet.priority, 'PRIMARY');
    assert.strictEqual(newSet.itemIds.length, 1);

    // Listar conjuntos
    const sets = StudioState.getReferenceSets('prj-praia-01', 'amb-sala-01');
    assert(sets.some(s => s.id === newSet.id), 'Conjunto deve constar na listagem do ambiente');

    // Limpar
    StudioState.deleteReferenceSet('prj-praia-01', newSet.id);
  });
});

describe('7. Checklist de Levantamento do Ambiente (8 Itens Oficiais)', () => {
  it('Deve validar e alternar o status dos 8 itens oficiais do checklist', () => {
    const checklist = StudioState.getSurveyChecklist('prj-praia-01', 'amb-sala-01');
    assert(checklist, 'Checklist deve ser instanciado');
    
    const requiredKeys = [
      'planta_recebida', 'perspectiva_recebida', 'referencias_recebidas',
      'medidas_disponiveis', 'aberturas_identificadas', 'elementos_existentes_identificados',
      'restricoes_registradas', 'referencias_principais_definidas'
    ];

    requiredKeys.forEach(k => {
      assert(checklist.items[k] !== undefined, `Item ${k} deve existir no checklist`);
    });

    // Testar alternância de item
    StudioState.toggleChecklistItem('prj-praia-01', 'amb-sala-01', 'medidas_disponiveis', true, 'Trena laser conferida', 'Eduardo Marques');
    const updatedChk = StudioState.getSurveyChecklist('prj-praia-01', 'amb-sala-01');
    assert.strictEqual(updatedChk.items.medidas_disponiveis.completed, true);
    assert.strictEqual(updatedChk.items.medidas_disponiveis.confirmedBy, 'Eduardo Marques');
  });
});

describe('8. Agregador ENVIRONMENT_CONTEXT e Governança Antialucinação de IA', () => {
  it('Deve gerar ENVIRONMENT_CONTEXT estruturado e marcar dados não comprovados como UNKNOWN ou NOT_CONFIRMED', () => {
    const context = StudioState.buildEnvironmentContext('prj-praia-01', 'amb-sala-01');
    assert(context, 'Contexto do ambiente deve ser gerado');
    assert.strictEqual(context.projectId, 'prj-praia-01');
    assert.strictEqual(context.environmentId, 'amb-sala-01');

    // Validar presença dos nós exigidos para a engine de visualização
    assert(context.floorPlan, 'floorPlan deve estar presente');
    assert(Array.isArray(context.perspectives), 'perspectives deve ser um array');
    assert(Array.isArray(context.referenceSets), 'referenceSets deve ser um array');
    assert(Array.isArray(context.approvedReferences), 'approvedReferences deve ser um array');
    assert(Array.isArray(context.rejectedReferences), 'rejectedReferences deve ser um array');
    assert(Array.isArray(context.restrictions), 'restrictions deve ser um array');
    assert(context.checklistStatus, 'checklistStatus deve estar presente');
    assert(Array.isArray(context.unconfirmedFlags), 'unconfirmedFlags deve ser um array');

    // Testar exportador JSON
    const jsonStr = StudioState.exportEnvironmentContextJSON('prj-praia-01', 'amb-sala-01');
    assert(jsonStr && jsonStr.length > 50, 'JSON do contexto deve ser exportável');
    const parsed = JSON.parse(jsonStr);
    assert.strictEqual(parsed.environmentId, 'amb-sala-01');
  });

  it('Se um ambiente não tiver planta ou medidas confirmadas, deve registrar UNKNOWN / NOT_CONFIRMED', () => {
    // Criar ambiente temporário sem ativos nem checklist
    const tempEnvId = 'amb-temp-sem-planta';
    const context = StudioState.buildEnvironmentContext('prj-praia-01', tempEnvId);
    
    assert(context.unconfirmedFlags.includes('FLOOR_PLAN_GEOMETRY_UNKNOWN'), 'Deve registrar FLOOR_PLAN_GEOMETRY_UNKNOWN');
    assert(context.unconfirmedFlags.includes('CAMERA_ANGLES_NOT_CONFIRMED'), 'Deve registrar CAMERA_ANGLES_NOT_CONFIRMED');
    assert(context.unconfirmedFlags.includes('ACCURATE_MEASUREMENTS_UNKNOWN'), 'Deve registrar ACCURATE_MEASUREMENTS_UNKNOWN');
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
  console.log('TODOS OS CRITÉRIOS DE ACEITE DO BLOCO C02 FORAM VALIDADOS COM SUCESSO!\n');
  process.exit(0);
}
