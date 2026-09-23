/**
 * ============================================================================
 * ARQVERTICE STUDIO — TESTES DO BLOCO E03 (QUANTITATIVOS E MEMÓRIA DE CÁLCULO)
 * ============================================================================
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

console.log('\n====================================================================');
console.log('ARQVERTICE STUDIO — TESTES DO BLOCO E03 (QUANTITATIVOS E CÁLCULO)');
console.log('====================================================================\n');

let passedTests = 0;
let failedTests = 0;

function runTest(description, fn) {
  try {
    fn();
    console.log(`  ✓ ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(`    Erro: ${err.message}`);
    failedTests++;
  }
}

// Reset do estado para testes limpos
StudioState.init();

// Teste 1: Cálculo simples com fórmula explícita
runTest('1. Deve realizar cálculo simples e registrar fórmula explícita', () => {
  const memory = StudioState.calculateQuantityMemory({
    baseQuantity: 40.0,
    lossPercentage: 10.0,
    unit: 'm²'
  });

  assert.strictEqual(memory.baseQuantity, 40.0);
  assert.strictEqual(memory.lossPercentage, 10.0);
  assert.strictEqual(memory.finalQuantity, 44.0);
  assert.strictEqual(memory.technicalQuantity, 44.0);
  assert.ok(memory.formulaText.includes('40,00 m²'));
  assert.ok(memory.formulaText.includes('44,00 m²'));
  assert.ok(memory.formulaText.includes('10%'));
});

// Teste 2: Cálculo com percentuais de perda canônicos
runTest('2. Deve suportar percentuais de perda canônicos (0%, 5%, 10%, 15%, 20%)', () => {
  const loss0 = StudioState.calculateQuantityMemory({ baseQuantity: 50.0, lossPercentage: 0, unit: 'un' });
  assert.strictEqual(loss0.finalQuantity, 50.0);

  const loss5 = StudioState.calculateQuantityMemory({ baseQuantity: 100.0, lossPercentage: 5, unit: 'm²' });
  assert.strictEqual(loss5.finalQuantity, 105.0);

  const loss15 = StudioState.calculateQuantityMemory({ baseQuantity: 20.0, lossPercentage: 15, unit: 'm²' });
  assert.strictEqual(loss15.finalQuantity, 23.0);

  const loss20 = StudioState.calculateQuantityMemory({ baseQuantity: 10.0, lossPercentage: 20, unit: 'm²' });
  assert.strictEqual(loss20.finalQuantity, 12.0);
});

// Teste 3: Conversão para embalagem com arredondamento CEIL
runTest('3. Deve converter quantidade para embalagens fechadas com teto (CEIL)', () => {
  // 44 m² finais necessários, caixa com 2.16 m²
  // 44 / 2.16 = 20.37 => Teto = 21 caixas
  const memory = StudioState.calculateQuantityMemory({
    baseQuantity: 40.0,
    lossPercentage: 10.0,
    hasPackaging: true,
    packagingCoverage: 2.16,
    packagingUnit: 'caixa',
    roundingRule: 'CEIL',
    unit: 'm²'
  });

  assert.strictEqual(memory.finalQuantity, 44.0);
  assert.strictEqual(memory.purchasingQuantity, 21);
  assert.ok(memory.packagingFormula.includes('21 caixa(s)'));
  assert.ok(memory.packagingFormula.includes('45,36 m²'));
});

// Teste 4: Preservação de quantidade técnica vs quantidade de compra
runTest('4. Não deve alterar silenciosamente a quantidade técnica com o arredondamento comercial', () => {
  const memory = StudioState.calculateQuantityMemory({
    baseQuantity: 38.5,
    lossPercentage: 10.0,
    hasPackaging: true,
    packagingCoverage: 2.5,
    packagingUnit: 'caixa',
    unit: 'm²'
  });

  // 38.5 * 1.10 = 42.35 m² técnica
  assert.strictEqual(memory.technicalQuantity, 42.35);
  assert.strictEqual(memory.finalQuantity, 42.35);
  // 42.35 / 2.5 = 16.94 => 17 caixas
  assert.strictEqual(memory.purchasingQuantity, 17);
});

// Teste 5: Distinção rigorosa de origens (Princípio de Confiabilidade - Item 1 e 2)
runTest('5. Deve validar tipos de origem e não tratar MEASURED e ESTIMATED_BY_AI como equivalentes', () => {
  const measuredQty = StudioState.createQuantity({
    projectId: 'prj-praia-01',
    environmentId: 'amb-sala-01',
    itemName: 'Porcelanato Cinza Medido',
    baseQuantity: 42.30,
    unit: 'm²',
    originType: 'MEASURED',
    sourceType: 'PROJECT_DATA'
  });

  const aiQty = StudioState.createQuantity({
    projectId: 'prj-praia-01',
    environmentId: 'amb-sala-01',
    itemName: 'Porcelanato Cinza Estimado',
    baseQuantity: 42.30,
    unit: 'm²',
    originType: 'ESTIMATED_BY_AI',
    sourceType: 'VISUAL_ESTIMATE'
  });

  assert.notStrictEqual(measuredQty.originType, aiQty.originType);
  assert.strictEqual(measuredQty.isAiEstimate, false);
  assert.strictEqual(aiQty.isAiEstimate, true);
  assert.strictEqual(aiQty.approvalLevel, 'QUANTITY_ESTIMATED');
});

// Teste 6: Suporte às 10 unidades de medida canônicas
runTest('6. Deve suportar e validar todas as 10 unidades de medida canônicas', () => {
  const canonicalUnits = ['m', 'm²', 'm³', 'un', 'kg', 'L', 'kit', 'caixa', 'saco', 'outra'];
  
  canonicalUnits.forEach(u => {
    const q = StudioState.createQuantity({
      projectId: 'prj-praia-01',
      itemName: `Item Teste ${u}`,
      baseQuantity: 10,
      unit: u,
      originType: 'MANUAL'
    });
    assert.strictEqual(q.unit, u);
  });

  assert.throws(() => {
    StudioState.createQuantity({
      projectId: 'prj-praia-01',
      itemName: 'Item Inválido',
      unit: 'toneladas'
    });
  }, /Unidade inválida/);
});

// Teste 7: Consolidação de projeto com detecção de duplicidade (Itens 11 e 12)
runTest('7. Deve consolidar o mesmo produto presente em múltiplos cômodos somando o total do projeto', () => {
  // Cria material de porcelanato e aplica na Sala (40m²), Cozinha (18m²) e Circulação (12m²)
  const matId = `mat-teste-dupl-${Date.now()}`;
  StudioState.data.projectMaterials.push({
    id: matId,
    projectId: 'prj-praia-01',
    name: 'Porcelanato X Cimentício',
    category: 'PISO'
  });

  // Sala = 40m² + 10% = 44m²
  StudioState.createQuantity({
    projectId: 'prj-praia-01',
    environmentId: 'amb-sala-01',
    materialId: matId,
    itemName: 'Porcelanato X Cimentício',
    baseQuantity: 40.0,
    lossPercentage: 10,
    unit: 'm²'
  });

  // Cozinha = 18m² + 10% = 19.8m²
  StudioState.createQuantity({
    projectId: 'prj-praia-01',
    environmentId: 'amb-cozinha-02',
    materialId: matId,
    itemName: 'Porcelanato X Cimentício',
    baseQuantity: 18.0,
    lossPercentage: 10,
    unit: 'm²'
  });

  // Circulação = 12m² + 10% = 13.2m²
  StudioState.createQuantity({
    projectId: 'prj-praia-01',
    environmentId: 'amb-circ-01',
    materialId: matId,
    itemName: 'Porcelanato X Cimentício',
    baseQuantity: 12.0,
    lossPercentage: 10,
    unit: 'm²'
  });

  const consolidated = StudioState.getProjectConsolidatedQuantities('prj-praia-01');
  const group = consolidated.find(g => g.materialId === matId);

  assert.ok(group, 'Grupo consolidado deve ser encontrado');
  assert.strictEqual(group.totalBaseQuantity, 70.0, 'Base total deve ser 40 + 18 + 12 = 70 m²');
  assert.strictEqual(group.totalFinalQuantity, 77.0, 'Final total deve ser 44 + 19.8 + 13.2 = 77 m²');
});

// Teste 8: Preservação do detalhamento individual por ambiente na consolidação
runTest('8. Deve preservar a discriminação por ambiente no quantitativo consolidado', () => {
  const consolidated = StudioState.getProjectConsolidatedQuantities('prj-praia-01');
  const travertinoGroup = consolidated.find(g => g.materialId === 'mat-piso-living-01');

  assert.ok(travertinoGroup, 'Grupo do travertino deve existir');
  assert.ok(travertinoGroup.environmentsBreakdown.length >= 2, 'Deve ter pelo menos 2 ambientes');
  
  const envIds = travertinoGroup.environmentsBreakdown.map(e => e.environmentId);
  assert.ok(envIds.includes('amb-sala-01'));
  assert.ok(envIds.includes('amb-cozinha-02'));
});

// Teste 9: Estimativa visual por IA com princípio anti-alucinação (Itens 13 e 14)
runTest('9. Estimativa de IA deve ser estritamente ESTIMATED_BY_AI e QUANTITY_ESTIMATED', () => {
  const aiEstimate = StudioState.estimateQuantityFromAi({
    projectId: 'prj-praia-01',
    environmentId: 'amb-sala-01',
    itemName: 'Pedra Natural Rústica',
    category: 'PEDRA',
    application: 'PAREDE',
    estimatedBaseQuantity: 14.5,
    confidence: 0.85,
    notes: 'Estimativa baseada em render frontal'
  });

  assert.strictEqual(aiEstimate.originType, 'ESTIMATED_BY_AI');
  assert.strictEqual(aiEstimate.sourceType, 'VISUAL_ESTIMATE');
  assert.strictEqual(aiEstimate.status, 'ESTIMATED');
  assert.strictEqual(aiEstimate.approvalLevel, 'QUANTITY_ESTIMATED');
  assert.strictEqual(aiEstimate.isAiEstimate, true);
  assert.ok(aiEstimate.aiDisclaimer.includes('ESTIMATIVA VISUAL'));
});

// Teste 10: Proibição de gerar quantidade de IA sem base de estimativa
runTest('10. Não deve permitir que a IA gere estimativa sem base de dados suficiente', () => {
  assert.throws(() => {
    StudioState.estimateQuantityFromAi({
      projectId: 'prj-praia-01',
      itemName: 'Item Sem Medida',
      estimatedBaseQuantity: 0
    });
  }, /Base de estimativa insuficiente/);
});

// Teste 11: Importação de dados do Revit retendo metadados de origem (Item 15)
runTest('11. Deve registrar dados importados do Revit com SOURCE = REVIT e arquivo de origem', () => {
  const revitFile = 'Residencia_Praia_Executivo_2026_R03.rvt';
  const imported = StudioState.importQuantitiesFromRevit([
    {
      projectId: 'prj-praia-01',
      environmentId: 'amb-sala-01',
      itemName: 'Piso Madeira Engenheirada',
      category: 'MADEIRA',
      application: 'PISO',
      baseQuantity: 62.40,
      lossPercentage: 10,
      unit: 'm²',
      revitElementId: 'REV-EL-20091',
      revitCategory: 'Floors'
    }
  ], revitFile);

  assert.strictEqual(imported.length, 1);
  const q = imported[0];
  assert.strictEqual(q.sourceType, 'REVIT_IMPORT');
  assert.strictEqual(q.sourceFileRef, revitFile);
  assert.strictEqual(q.revitElementId, 'REV-EL-20091');
});

// Teste 12: Aprovação formal de quantitativo (Item 18 e 19)
runTest('12. Deve homologar quantitativo elevando para QUANTITY_APPROVED', () => {
  const q = StudioState.createQuantity({
    projectId: 'prj-praia-01',
    itemName: 'Bancada Corian Branco',
    category: 'BANCADA',
    baseQuantity: 5.0,
    unit: 'm²',
    status: 'IN_REVIEW'
  });

  assert.strictEqual(q.status, 'IN_REVIEW');
  assert.strictEqual(q.approvalLevel, 'QUANTITY_ESTIMATED');

  const approved = StudioState.approveQuantity(q.id, 'Eduardo Marques', 'Aprovado para cotação');
  assert.strictEqual(approved.status, 'APPROVED');
  assert.strictEqual(approved.approvalLevel, 'QUANTITY_APPROVED');
  assert.strictEqual(approved.approvedBy, 'Eduardo Marques');
});

// Teste 13: Rejeição com motivo obrigatório e preservação no histórico (Item 18)
runTest('13. Rejeição de quantitativo deve exigir justificativa e não excluir o registro', () => {
  const q = StudioState.createQuantity({
    projectId: 'prj-praia-01',
    itemName: 'Piso a ser Rejeitado',
    baseQuantity: 20.0,
    unit: 'm²'
  });

  assert.throws(() => {
    StudioState.rejectQuantity(q.id, '', 'Eduardo Marques');
  }, /É obrigatório registrar o motivo da rejeição/);

  const rejected = StudioState.rejectQuantity(q.id, 'Cliente optou por manter piso existente', 'Eduardo Marques');
  assert.strictEqual(rejected.status, 'REJECTED');
  assert.strictEqual(rejected.rejectionReason, 'Cliente optou por manter piso existente');

  // Verifica persistência na lista de materiais/quantitativos
  const inStore = StudioState.getQuantity(q.id);
  assert.ok(inStore, 'Registro rejeitado deve continuar existindo');
  assert.strictEqual(inStore.status, 'REJECTED');
});

// Teste 14: Edição com recálculo auditado no histórico
runTest('14. Deve atualizar quantitativo recalculando fórmula e registrando histórico', () => {
  const q = StudioState.createQuantity({
    projectId: 'prj-praia-01',
    itemName: 'Revestimento Editável',
    baseQuantity: 100.0,
    lossPercentage: 10.0,
    unit: 'm²'
  });

  assert.strictEqual(q.finalQuantity, 110.0);

  // Altera perda para 15%
  const updated = StudioState.updateQuantity(q.id, {
    lossPercentage: 15.0
  }, 'Eduardo Marques');

  assert.strictEqual(updated.lossPercentage, 15.0);
  assert.strictEqual(updated.finalQuantity, 115.0);
  assert.ok(updated.formulaText.includes('15%'));

  // Verifica histórico
  const history = StudioState.data.quantityHistory.filter(h => h.quantityId === q.id);
  assert.ok(history.length >= 2);
  const lastAction = history[history.length - 1];
  assert.strictEqual(lastAction.action, 'LOSS_CHANGED');
  assert.strictEqual(lastAction.toFinalQty, 115.0);
});

// Teste 15: Exportação técnica em CSV com delimitador e cabeçalhos canônicos
runTest('15. Deve exportar tabela de quantitativos em CSV nativo com UTF-8 BOM', () => {
  const csv = StudioState.exportQuantitiesToCsv('prj-praia-01');
  
  assert.ok(csv.startsWith('\uFEFF'), 'Deve conter o UTF-8 BOM');
  assert.ok(csv.includes('AMBIENTE;ITEM;PRODUTO;CATEGORIA;APLICACAO;UNIDADE;QUANTIDADE_BASE;PERDA_PCT;QUANTIDADE_FINAL'));
  assert.ok(csv.includes('Mármore Travertino Navona Levigado 100x100'));
});

console.log('\n====================================================================');
console.log(`RESULTADO FINAL DO BLOCO E03: ${passedTests} PASSOU | ${failedTests} FALHOU`);
console.log('====================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
