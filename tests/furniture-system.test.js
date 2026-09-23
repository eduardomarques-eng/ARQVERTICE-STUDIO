/**
 * ============================================================================
 * ARQVERTICE STUDIO — TESTES DO BLOCO E01: SISTEMA DE MÓVEIS, MARCENARIA,
 * EQUIPAMENTOS E DECORAÇÃO
 * ============================================================================
 * Validação rigorosa dos 11 testes do item 27 e checklist do item 29:
 * 1. Criação de item com campos obrigatórios e medidas técnicas
 * 2. Edição de dados e rastreamento de alterações no histórico
 * 3. Duplicação de item entre ambientes sem contaminação
 * 4. Fluxo de aprovação (APPROVED) e integração ao contexto visual do ambiente
 * 5. Fluxo de rejeição (REJECTED) com justificativa obrigatória e não exclusão
 * 6. Versionamento não destrutivo (V01 -> V02 -> V03)
 * 7. Associação de imagem e referências visuais
 * 8. Associação hierárquica por ambiente e escopo geral por projeto
 * 9. Estrutura de quantidade com valor, unidade e origem de medição
 * 10. Medidas rigorosas (L x P x A) com unidade configurável explícita (CM, M, MM)
 * 11. Registro de origem auditado (CLIENTE, ARQVERTICE, REVIT, IA, etc.)
 * 12. Princípio anti-alucinação: IA gera SUGESTÃO sem criar produtos comerciais fictícios
 * 13. Agrupamento em conjuntos (ex: Conjunto de Jantar = 1 Mesa + 6 Cadeiras)
 * 14. Marcenaria sob medida (CUSTOM_MILLWORK) com prancha executiva
 * 15. Exportação estruturada para CSV e preparação para PDF/XLSX
 * 16. Resumo estatístico e financeiro do ambiente
 */

global.window = global;
global.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  body: { appendChild: () => {}, removeChild: () => {} }
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
const FurnitureSystemModule = require('../js/furniture-system-module.js');

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

function runTests() {
  console.log('\n====================================================================');
  console.log('ARQVERTICE STUDIO — TESTES DO BLOCO E01 (MÓVEIS E MARCENARIA)');
  console.log('====================================================================\n');

  StudioState.init();
  const projectId = 'prj-praia-01';
  const environmentId = 'amb-sala-01';
  const otherEnvId = 'amb-suite-02';

  // ------------------------------------------------------------------
  // 1. CRIAÇÃO DE ITEM
  // ------------------------------------------------------------------
  it('1. Deve criar item de mobiliário com atributos obrigatórios e medidas explícitas', () => {
    const item = StudioState.createFurnitureItem({
      projectId,
      environmentId,
      name: 'Poltrona Giratória em Couro',
      category: 'MOVEL_SOLTO',
      itemType: 'NEW',
      requirementType: 'REQUIRED',
      quantityValue: 2,
      quantityUnit: 'UN',
      quantityOrigin: 'ARQVERTICE',
      width: 85,
      depth: 80,
      height: 78,
      dimensionUnit: 'CM',
      material: 'Couro Natural e Madeira Maciça',
      finish: 'Fosco',
      color: 'Caramelo',
      origin: 'ARQVERTICE',
      referenceText: 'Catálogo Poltronas 2026',
      notes: 'Duas unidades para composição lateral do living'
    });

    assert(item.id, 'O item deve possuir ID');
    assert.strictEqual(item.name, 'Poltrona Giratória em Couro');
    assert.strictEqual(item.category, 'MOVEL_SOLTO');
    assert.strictEqual(item.quantityValue, 2);
    assert.strictEqual(item.quantityUnit, 'UN');
    assert.strictEqual(item.width, 85);
    assert.strictEqual(item.dimensionUnit, 'CM');
    assert.strictEqual(item.versionCode, 'V01');
    assert.strictEqual(item.versionSequence, 1);
  });

  // ------------------------------------------------------------------
  // 2. EDIÇÃO DE ITEM E HISTÓRICO
  // ------------------------------------------------------------------
  it('2. Deve editar item e registrar alterações no histórico de auditoria', () => {
    const item = StudioState.createFurnitureItem({
      projectId,
      environmentId,
      name: 'Mesa de Apoio Lateral',
      category: 'MOVEL_SOLTO',
      itemType: 'NEW',
      quantityValue: 1,
      quantityUnit: 'UN',
      width: 50,
      depth: 50,
      height: 55,
      dimensionUnit: 'CM',
      color: 'Preto'
    });

    const updated = StudioState.updateFurnitureItem(item.id, {
      color: 'Carvalho Ebanizado',
      price: 1800.00,
      supplier: 'Galpão D'
    }, 'Eduardo Marques');

    assert.strictEqual(updated.color, 'Carvalho Ebanizado');
    assert.strictEqual(updated.price, 1800.00);

    const history = StudioState.data.furnitureHistory.filter(h => h.itemId === item.id);
    assert(history.length >= 2, 'Deve ter histórico de criação e atualização');
    const lastHist = history[history.length - 1];
    assert.strictEqual(lastHist.action, 'UPDATED');
    assert(lastHist.changedFields.includes('color'));
    assert(lastHist.changedFields.includes('price'));
  });

  // ------------------------------------------------------------------
  // 3. DUPLICAÇÃO DE ITEM ENTRE AMBIENTES
  // ------------------------------------------------------------------
  it('3. Deve duplicar item para outro ambiente sem contaminação do original', () => {
    const original = StudioState.createFurnitureItem({
      projectId,
      environmentId,
      name: 'Abajur de Leitura em Latão',
      category: 'ILUMINACAO',
      quantityValue: 1,
      quantityUnit: 'UN',
      dimensionUnit: 'CM',
      material: 'Latão Escovado',
      status: 'APPROVED'
    });

    const clone = StudioState.duplicateFurnitureItem(original.id, otherEnvId);

    assert(clone.id !== original.id, 'Clone deve ter novo ID');
    assert.strictEqual(clone.environmentId, otherEnvId, 'Clone deve estar no ambiente de destino');
    assert.strictEqual(clone.parentItemId, original.id, 'Clone deve referenciar original');
    assert.strictEqual(clone.status, 'DRAFT', 'Clone deve iniciar como DRAFT para validação no novo ambiente');
    assert.strictEqual(original.environmentId, environmentId, 'Original deve permanecer inalterado');
  });

  // ------------------------------------------------------------------
  // 4. FLUXO DE APROVAÇÃO E CONTEXTO VISUAL
  // ------------------------------------------------------------------
  it('4. Deve aprovar item e integrá-lo ao contexto visual do ambiente', () => {
    const item = StudioState.createFurnitureItem({
      projectId,
      environmentId,
      name: 'Banco Ripado em Cumaru',
      category: 'MOVEL_SOLTO',
      quantityValue: 1,
      quantityUnit: 'UN',
      material: 'Madeira Maciça Cumaru',
      dimensionUnit: 'CM',
      status: 'IN_REVIEW'
    });

    const approved = StudioState.approveFurnitureItem(item.id, 'Eduardo Marques', 'Aprovado para integrar com deck');
    assert.strictEqual(approved.status, 'APPROVED');

    const visualContext = StudioState.getFurnitureVisualContext(projectId, environmentId);
    assert(visualContext.approvedItemsCount > 0);
    const hasBanco = visualContext.visualPromptElements.some(e => e.id === item.id);
    assert(hasBanco, 'Item aprovado deve estar presente nos elementos visuais do ambiente');
    assert(visualContext.compositePromptClause.includes('Banco Ripado em Cumaru'));
  });

  // ------------------------------------------------------------------
  // 5. FLUXO DE REJEIÇÃO COM MOTIVO OBRIGATÓRIO (NÃO EXCLUSÃO)
  // ------------------------------------------------------------------
  it('5. Deve rejeitar item com motivo obrigatório e mantê-lo preservado no cadastro', () => {
    const item = StudioState.createFurnitureItem({
      projectId,
      environmentId,
      name: 'Poltrona Estampada Floral',
      category: 'MOVEL_SOLTO',
      quantityValue: 1,
      quantityUnit: 'UN',
      dimensionUnit: 'CM',
      status: 'IN_REVIEW'
    });

    // Tentativa sem motivo deve lançar erro
    assert.throws(() => {
      StudioState.rejectFurnitureItem(item.id, '');
    }, /obrigatório fornecer o motivo/);

    const rejected = StudioState.rejectFurnitureItem(item.id, 'Linguagem visual incompatível com o conceito contemporâneo do living');
    assert.strictEqual(rejected.status, 'REJECTED');
    assert.strictEqual(rejected.rejectionReason, 'Linguagem visual incompatível com o conceito contemporâneo do living');

    // Item não pode ter sido apagado
    const fetched = StudioState.getFurnitureItem(item.id);
    assert(fetched !== null, 'Item rejeitado deve permanecer cadastrado para auditoria');
  });

  // ------------------------------------------------------------------
  // 6. VERSIONAMENTO NÃO DESTRUTIVO (V01 -> V02 -> V03)
  // ------------------------------------------------------------------
  it('6. Deve versionar item sem substituir silenciosamente o registro original (V01 -> V02)', () => {
    const v1 = StudioState.createFurnitureItem({
      projectId,
      environmentId,
      name: 'Sofá Linear Minimalista',
      category: 'MOVEL_SOLTO',
      quantityValue: 1,
      quantityUnit: 'UN',
      width: 300,
      depth: 105,
      height: 80,
      dimensionUnit: 'CM',
      material: 'Linho Bege',
      status: 'APPROVED'
    });

    assert.strictEqual(v1.versionCode, 'V01');

    // Cria V02
    const v2 = StudioState.versionFurnitureItem(v1.id, {
      width: 280,
      material: 'Linho Off-white Texturizado',
      notes: 'Redução de 20cm para ampliação da circulação lateral'
    }, 'Eduardo Marques');

    assert.strictEqual(v2.versionCode, 'V02');
    assert.strictEqual(v2.versionSequence, 2);
    assert.strictEqual(v2.width, 280);
    assert.strictEqual(v2.parentItemId, v1.id);

    // O original deve estar marcado como SUPERSEDED e preservado
    const oldItem = StudioState.getFurnitureItem(v1.id);
    assert.strictEqual(oldItem.status, 'SUPERSEDED');
    assert.strictEqual(oldItem.width, 300, 'Medida da versão anterior deve ser preservada');

    // Cria V03
    const v3 = StudioState.versionFurnitureItem(v2.id, {
      finish: 'Impermeabilizado com Nanotecnologia'
    }, 'Eduardo Marques');

    assert.strictEqual(v3.versionCode, 'V03');
    assert.strictEqual(v3.versionSequence, 3);
    assert.strictEqual(v3.parentItemId, v2.id);
  });

  // ------------------------------------------------------------------
  // 7. ASSOCIAÇÃO DE IMAGEM E REFERÊNCIA VISUAL
  // ------------------------------------------------------------------
  it('7. Deve associar imagem, URL de referência e notas de aprovação', () => {
    const item = StudioState.createFurnitureItem({
      projectId,
      environmentId,
      name: 'Quadro Arte Contemporânea Abstrata',
      category: 'ARTE',
      quantityValue: 1,
      quantityUnit: 'UN',
      dimensionUnit: 'CM',
      width: 160,
      height: 120,
      imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800',
      referenceText: 'Galeria Arte Maior - Obra Original Sérgio Sister',
      notes: 'Posicionamento centralizado na parede de alvenaria do jantar'
    });

    assert(item.imageUrl.startsWith('https://'));
    assert(item.referenceText.includes('Galeria Arte Maior'));
  });

  // ------------------------------------------------------------------
  // 8. ASSOCIAÇÃO HIERÁRQUICA POR AMBIENTE E ESCOPO POR PROJETO
  // ------------------------------------------------------------------
  it('8. Deve filtrar móveis estritamente por ambiente e por projeto com agrupamentos', () => {
    const envItems = StudioState.getEnvironmentFurniture(projectId, environmentId);
    assert(Array.isArray(envItems));
    envItems.forEach(i => {
      assert.strictEqual(i.projectId, projectId);
      assert.strictEqual(i.environmentId, environmentId);
    });

    // Agrupamento por categoria em nível de projeto
    const byCategory = StudioState.getProjectFurniture(projectId, { groupBy: 'category' });
    assert(byCategory['MOVEL_SOLTO'], 'Deve conter grupo MOVEL_SOLTO');

    // Agrupamento por status em nível de projeto
    const byStatus = StudioState.getProjectFurniture(projectId, { groupBy: 'status' });
    assert(byStatus['APPROVED'], 'Deve conter grupo APPROVED');
  });

  // ------------------------------------------------------------------
  // 9. ESTRUTURA DE QUANTIDADE (VALOR, UNIDADE E ORIGEM)
  // ------------------------------------------------------------------
  it('9. Deve registrar quantidade com valor, unidade canônica e origem de medição', () => {
    const item = StudioState.createFurnitureItem({
      projectId,
      environmentId,
      name: 'Cortina em Linho Puro Gaze',
      category: 'CORTINA_PERSIANA',
      quantityValue: 18.5,
      quantityUnit: 'M',
      quantityOrigin: 'REVIT',
      dimensionUnit: 'M',
      width: 18.5,
      height: 2.80,
      origin: 'REVIT'
    });

    assert.strictEqual(item.quantityValue, 18.5);
    assert.strictEqual(item.quantityUnit, 'M');
    assert.strictEqual(item.quantityOrigin, 'REVIT');
  });

  // ------------------------------------------------------------------
  // 10. MEDIDAS RIGOROSAS (L x P x A COM UNIDADE EXPLÍCITA)
  // ------------------------------------------------------------------
  it('10. Deve garantir medidas L x P x A com unidade explícita sem assumir centímetros cegamente', () => {
    const itemMetros = StudioState.createFurnitureItem({
      projectId,
      environmentId,
      name: 'Tapete Sob Medida Living',
      category: 'TAPETE',
      quantityValue: 1,
      quantityUnit: 'UN',
      width: 4.5,
      depth: 3.5,
      height: 0.02,
      dimensionUnit: 'M'
    });

    assert.strictEqual(itemMetros.width, 4.5);
    assert.strictEqual(itemMetros.dimensionUnit, 'M');

    const itemMilimetros = StudioState.createFurnitureItem({
      projectId,
      environmentId,
      name: 'Puxador Cava Especial em Inox',
      category: 'ACESSORIO',
      quantityValue: 8,
      quantityUnit: 'UN',
      width: 400,
      depth: 25,
      height: 35,
      dimensionUnit: 'MM'
    });

    assert.strictEqual(itemMilimetros.width, 400);
    assert.strictEqual(itemMilimetros.dimensionUnit, 'MM');
  });

  // ------------------------------------------------------------------
  // 11. REGISTRO DE ORIGEM AUDITADO
  // ------------------------------------------------------------------
  it('11. Deve aceitar e validar todas as origens canônicas de dados', () => {
    const origins = StudioState.FURNITURE_ORIGINS;
    assert.strictEqual(origins.length, 10, 'Devem existir 10 origens canônicas');
    assert(origins.includes('CLIENTE'));
    assert(origins.includes('ARQVERTICE'));
    assert(origins.includes('REVIT'));
    assert(origins.includes('CATALOGO'));
    assert(origins.includes('IA'));

    const itemRevit = StudioState.createFurnitureItem({
      projectId,
      environmentId,
      name: 'Janela Acústica Integrada',
      category: 'OUTRO',
      origin: 'REVIT',
      dimensionUnit: 'CM'
    });
    assert.strictEqual(itemRevit.origin, 'REVIT');
  });

  // ------------------------------------------------------------------
  // 12. PRINCÍPIO ANTI-ALUCINAÇÃO DE PRODUTOS REAIS (IA SEPARADA)
  // ------------------------------------------------------------------
  it('12. Não deve inventar produtos reais: sugestão por imagem deve ser AI_SUGGESTION/SUGESTÃO', () => {
    const suggestions = StudioState.identifyFurnitureFromImage(
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200',
      environmentId,
      { projectId }
    );

    assert(suggestions.length > 0, 'Deve gerar sugestões de móveis');
    suggestions.forEach(s => {
      assert.strictEqual(s.isAiSuggestion, true, 'Deve ser marcado como isAiSuggestion: true');
      assert.strictEqual(s.status, 'SUGGESTED', 'Status deve ser SUGGESTED');
      assert.strictEqual(s.origin, 'IA', 'Origem deve ser IA');
      assert(['SUGESTÃO', 'REFERÊNCIA VISUAL', 'NÃO IDENTIFICADO'].includes(s.aiLabel));
      assert(s.aiDetectionMetadata.disclaimer.includes('NÃO IDENTIFICADO COMO PRODUTO REAL'));
      assert.strictEqual(s.manufacturer, null, 'Não deve inventar fabricante sem confirmação');
    });

    // Confirmação explícita pelo arquiteto
    const firstSug = suggestions[0];
    const confirmed = StudioState.confirmAISuggestion(firstSug.id, {
      manufacturer: 'Tidelli Outdoor',
      model: 'Linha Bahia 2026',
      price: 16500.00
    }, 'Eduardo Marques');

    assert.strictEqual(confirmed.isAiSuggestion, false, 'Não é mais sugestão incerta');
    assert.strictEqual(confirmed.status, 'APPROVED');
    assert.strictEqual(confirmed.manufacturer, 'Tidelli Outdoor');
  });

  // ------------------------------------------------------------------
  // 13. AGRUPAMENTO EM CONJUNTOS (EX: CONJUNTO DE JANTAR)
  // ------------------------------------------------------------------
  it('13. Deve permitir agrupar móveis em conjunto mantendo especificações individuais', () => {
    const mesa = StudioState.createFurnitureItem({
      projectId,
      environmentId,
      name: 'Mesa de Jantar Escultural 8 Lugares',
      category: 'MOVEL_SOLTO',
      quantityValue: 1,
      quantityUnit: 'UN',
      dimensionUnit: 'CM'
    });

    const cadeiras = StudioState.createFurnitureItem({
      projectId,
      environmentId,
      name: 'Cadeiras Estofadas com Braço',
      category: 'MOVEL_SOLTO',
      quantityValue: 8,
      quantityUnit: 'UN',
      dimensionUnit: 'CM'
    });

    const grupo = StudioState.createFurnitureGroup({
      projectId,
      environmentId,
      name: 'Conjunto de Jantar Florença',
      description: 'Mesa de 2,60m em nogueira e 8 cadeiras em linho rústico',
      itemIds: [mesa.id, cadeiras.id]
    });

    assert.strictEqual(grupo.name, 'Conjunto de Jantar Florença');

    const updatedMesa = StudioState.getFurnitureItem(mesa.id);
    const updatedCadeiras = StudioState.getFurnitureItem(cadeiras.id);
    assert.strictEqual(updatedMesa.groupId, grupo.id);
    assert.strictEqual(updatedMesa.groupName, 'Conjunto de Jantar Florença');
    assert.strictEqual(updatedCadeiras.groupId, grupo.id);
    assert.strictEqual(updatedCadeiras.quantityValue, 8);
  });

  // ------------------------------------------------------------------
  // 14. MARCENARIA SOB MEDIDA (CUSTOM_MILLWORK)
  // ------------------------------------------------------------------
  it('14. Deve suportar marcenaria sob medida com campos técnicos dedicados', () => {
    const millwork = StudioState.createFurnitureItem({
      projectId,
      environmentId,
      name: 'Armário Cristaleira com Portas em Vidro Canelado',
      category: 'MARCENARIA',
      itemType: 'CUSTOM_MILLWORK',
      isCustomMillwork: true,
      quantityValue: 1,
      quantityUnit: 'UN',
      width: 180,
      depth: 45,
      height: 260,
      dimensionUnit: 'CM',
      material: 'MDF Ultra e Alumínio Bronze',
      finish: 'Microtextura e Vidro Canelado',
      technicalDrawingRef: 'DET-CRISTALEIRA-01.dwg',
      associatedFileUrl: '/assets/cad/DET-CRISTALEIRA-01.pdf',
      millworkNotes: 'Iluminação interna linear em perfil LED 2700K embutido'
    });

    assert.strictEqual(millwork.itemType, 'CUSTOM_MILLWORK');
    assert.strictEqual(millwork.isCustomMillwork, true);
    assert.strictEqual(millwork.technicalDrawingRef, 'DET-CRISTALEIRA-01.dwg');
    assert(millwork.millworkNotes.includes('2700K'));
  });

  // ------------------------------------------------------------------
  // 15. EXPORTAÇÃO ESTRUTURADA PARA CSV
  // ------------------------------------------------------------------
  it('15. Deve gerar exportação CSV completa com delimitadores e cabeçalhos canônicos', () => {
    const csv = StudioState.exportFurnitureToCSV(projectId, environmentId);
    assert(typeof csv === 'string');
    assert(csv.includes('ITEM;CATEGORIA;TIPO;OBRIGATORIEDADE;QUANTIDADE;UNIDADE'));
    assert(csv.includes('Sofá Living 3 Lugares com Chaise'));
    assert(csv.includes('amb-sala-01'));
  });

  // ------------------------------------------------------------------
  // 16. RESUMO ESTATÍSTICO E FINANCEIRO
  // ------------------------------------------------------------------
  it('16. Deve calcular resumo quantitativo e financeiro do ambiente', () => {
    const summary = StudioState.getFurnitureSummary(projectId, environmentId);
    assert(summary.totalItems > 0);
    assert(summary.approvedCount > 0);
    assert(summary.millworkCount > 0);
    assert(summary.existingCount > 0);
    assert(summary.totalEstimatedCostBRL >= 0);
  });

  console.log('\n====================================================================');
  console.log(`RESULTADO FINAL DO BLOCO E01: ${passedTests} PASSOU | ${failedTests} FALHOU`);
  console.log('====================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests();
