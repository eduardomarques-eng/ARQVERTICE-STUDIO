/**
 * ============================================================================
 * ARQVERTICE STUDIO — TESTES DO BLOCO E02: SISTEMA DE MATERIAIS, REVESTIMENTOS
 * E ESPECIFICAÇÕES
 * ============================================================================
 * Validação rigorosa dos 11 requisitos do item 25 e checklist do item 27:
 * 1. Criação de material conceitual com atributos técnicos
 * 2. Edição de material e rastreamento no histórico de auditoria
 * 3. Separação conceitual vs produto comercial específico
 * 4. Cadastro de fabricante (Biancogres, Portobello, Eliane, Decortiles)
 * 5. Cadastro de fornecedor regional com cidade e UF
 * 6. Suporte às 21 categorias canônicas de material
 * 7. Suporte a unidades de medida canônicas (M², M, UN, KG, etc.)
 * 8. Fluxo de aprovação (APPROVED) e integração à memória visual do ambiente
 * 9. Fluxo de rejeição (REJECTED) com motivo obrigatório e preservação
 * 10. Versionamento não-destrutivo (V01 -> V02)
 * 11. Vínculo hierárquico por ambiente e escopo por projeto
 * 12. Identificação assistida por IA (princípio anti-alucinação)
 * 13. Cadastro de produto específico com código SKU, dimensões e consulted_at
 * 14. Vínculo de material conceitual a produto comercial de catálogo
 * 15. Exportação estruturada para CSV com cabeçalhos canônicos
 * 16. Resumo estatístico e orçamentário do ambiente
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
const MaterialsSystemModule = require('../js/materials-system-module.js');

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
  console.log('ARQVERTICE STUDIO — TESTES DO BLOCO E02 (MATERIAIS E REVESTIMENTOS)');
  console.log('====================================================================\n');

  StudioState.init();
  const projectId = 'prj-praia-01';
  const environmentId = 'amb-sala-01';
  const otherEnvId = 'amb-cozinha-01';

  // ------------------------------------------------------------------
  // 1. CRIAÇÃO DE MATERIAL CONCEITUAL
  // ------------------------------------------------------------------
  it('1. Deve criar material com atributos técnicos obrigatórios e escopo', () => {
    const mat = StudioState.createMaterial({
      projectId,
      environmentId,
      name: 'Pintura Acrílica Areia Suave',
      category: 'PINTURA',
      application: 'PAREDE',
      color: 'Areia Suave (Pantone 7527C)',
      finish: 'Fosco Aveludado',
      quantityValue: 140.00,
      quantityUnit: 'M2',
      scope: 'ENVIRONMENT_SPECIFIC',
      referenceText: 'Alinhamento visual da área social poente'
    });

    assert(mat.id, 'O material deve possuir ID');
    assert.strictEqual(mat.name, 'Pintura Acrílica Areia Suave');
    assert.strictEqual(mat.category, 'PINTURA');
    assert.strictEqual(mat.application, 'PAREDE');
    assert.strictEqual(mat.quantityValue, 140.00);
    assert.strictEqual(mat.quantityUnit, 'M2');
    assert.strictEqual(mat.isConceptual, true, 'Deve ser conceitual sem produto específico');
    assert.strictEqual(mat.versionCode, 'V01');
    assert.strictEqual(mat.versionSequence, 1);
  });

  // ------------------------------------------------------------------
  // 2. EDIÇÃO E HISTÓRICO DE AUDITORIA
  // ------------------------------------------------------------------
  it('2. Deve editar material e registrar trilha de auditoria no histórico', () => {
    const mat = StudioState.createMaterial({
      projectId,
      environmentId,
      name: 'Porcelanato Cinza Cimentício',
      category: 'PISO',
      application: 'PISO',
      color: 'Cinza Médio'
    });

    const updated = StudioState.updateMaterial(mat.id, {
      color: 'Cinza Claro Urbano',
      finish: 'Natural Acetinado Retificado'
    }, 'Eduardo Marques');

    assert.strictEqual(updated.color, 'Cinza Claro Urbano');
    assert.strictEqual(updated.finish, 'Natural Acetinado Retificado');

    const history = StudioState.data.materialHistory.filter(h => h.materialId === mat.id);
    assert(history.length >= 2, 'Deve registrar histórico de criação e atualização');
    const lastHist = history[history.length - 1];
    assert.strictEqual(lastHist.action, 'UPDATED');
    assert(lastHist.changedFields.includes('color'));
    assert(lastHist.changedFields.includes('finish'));
  });

  // ------------------------------------------------------------------
  // 3. SEPARAÇÃO CONCEITO VS PRODUTO
  // ------------------------------------------------------------------
  it('3. Deve separar estritamente o material conceitual do produto específico', () => {
    // Conceito
    const matConceito = StudioState.createMaterial({
      projectId,
      environmentId,
      name: 'Porcelanato Cimentício Acinzentado',
      category: 'REVESTIMENTO',
      application: 'PISO',
      isConceptual: true
    });

    assert.strictEqual(matConceito.isConceptual, true);
    assert.strictEqual(matConceito.productId, null);
    assert.strictEqual(matConceito.product, null);

    // Produto específico
    const prod = StudioState.createCatalogProduct({
      name: 'Porcelanato Portobello Nord Cement 120x120 Nat',
      skuCode: '201445E',
      finish: 'Natural Retificado',
      width: 120,
      length: 120,
      thickness: 9,
      salesUnit: 'M2',
      price: 189.90,
      consultedAt: '2026-09-21T10:00:00Z'
    });

    // Vincula o produto ao conceito
    const matVinculado = StudioState.linkMaterialToProduct(matConceito.id, prod.id);

    assert.strictEqual(matVinculado.isConceptual, false, 'Não é mais puramente conceitual');
    assert.strictEqual(matVinculado.productId, prod.id);
    assert(matVinculado.product, 'Objeto de produto deve ser resolvido');
    assert.strictEqual(matVinculado.product.skuCode, '201445E');
  });

  // ------------------------------------------------------------------
  // 4. CADASTRO DE FABRICANTE
  // ------------------------------------------------------------------
  it('4. Deve cadastrar e listar fabricantes oficiais (Portobello, Biancogres, Eliane, etc.)', () => {
    const mfr = StudioState.createManufacturer({
      name: 'Decortiles Revestimentos Especiais',
      brand: 'Decortiles',
      website: 'https://decortiles.com',
      notes: 'Linha autoral para revestimentos decorativos'
    });

    assert(mfr.id);
    assert.strictEqual(mfr.name, 'Decortiles Revestimentos Especiais');
    assert(StudioState.data.manufacturers.some(m => m.id === mfr.id));
  });

  // ------------------------------------------------------------------
  // 5. CADASTRO DE FORNECEDOR COM REGIONALIDADE
  // ------------------------------------------------------------------
  it('5. Deve cadastrar fornecedor com dados regionais obrigatórios (Cidade/UF)', () => {
    // Falha sem cidade/estado
    assert.throws(() => {
      StudioState.createSupplier({ name: 'Loja Sem Cidade' });
    }, /Cidade e Estado/);

    const sup = StudioState.createSupplier({
      name: 'Galpão D Revestimentos',
      city: 'Fortaleza',
      state: 'CE',
      region: 'Nordeste',
      contactPerson: 'Ricardo Maia',
      contactPhone: '(85) 3261-9000',
      website: 'https://galpaod.com.br'
    });

    assert(sup.id);
    assert.strictEqual(sup.city, 'Fortaleza');
    assert.strictEqual(sup.state, 'CE');
    assert.strictEqual(sup.region, 'Nordeste');
  });

  // ------------------------------------------------------------------
  // 6. CATEGORIAS CANÔNICAS (21)
  // ------------------------------------------------------------------
  it('6. Deve conter e validar todas as 21 categorias canônicas de material', () => {
    const cats = StudioState.MATERIAL_CATEGORIES;
    assert.strictEqual(cats.length, 21, 'Devem existir exatamente 21 categorias canônicas');
    assert(cats.includes('PISO'));
    assert(cats.includes('PAREDE'));
    assert(cats.includes('REVESTIMENTO'));
    assert(cats.includes('TETO_FORRO'));
    assert(cats.includes('PEDRA'));
    assert(cats.includes('MADEIRA'));
    assert(cats.includes('MARCENARIA'));
    assert(cats.includes('PINTURA'));
    assert(cats.includes('TECIDO'));
    assert(cats.includes('TAPETE'));
    assert(cats.includes('METAL'));
    assert(cats.includes('VIDRO'));
    assert(cats.includes('LOUCA'));
    assert(cats.includes('METAIS_SANITARIOS'));
    assert(cats.includes('BANCADA'));
    assert(cats.includes('RODAPE'));
    assert(cats.includes('DECK'));
    assert(cats.includes('EXTERNO'));
    assert(cats.includes('PAISAGISMO'));
    assert(cats.includes('ILUMINACAO'));
    assert(cats.includes('OUTRO'));

    // Rejeição de categoria inválida
    assert.throws(() => {
      StudioState.createMaterial({
        projectId,
        name: 'Material Inválido',
        category: 'CATEGORIA_INEXISTENTE'
      });
    }, /Categoria inválida/);
  });

  // ------------------------------------------------------------------
  // 7. UNIDADES DE MEDIDA CANÔNICAS (8)
  // ------------------------------------------------------------------
  it('7. Deve suportar as 8 unidades de medida canônicas', () => {
    const units = StudioState.MATERIAL_UNITS;
    assert.strictEqual(units.length, 8);
    assert(units.includes('UN'));
    assert(units.includes('M'));
    assert(units.includes('M2'));
    assert(units.includes('M3'));
    assert(units.includes('KG'));
    assert(units.includes('L'));
    assert(units.includes('KIT'));
    assert(units.includes('OUTRA'));
  });

  // ------------------------------------------------------------------
  // 8. FLUXO DE APROVAÇÃO E MEMÓRIA VISUAL
  // ------------------------------------------------------------------
  it('8. Deve aprovar material e alimentar o contexto visual do ambiente', () => {
    const mat = StudioState.createMaterial({
      projectId,
      environmentId,
      name: 'Superfície Dekton Entzo',
      category: 'BANCADA',
      application: 'BANCADA',
      finish: 'Polido Nobre',
      color: 'Branco com veios dourados',
      status: 'IN_REVIEW'
    });

    const approved = StudioState.approveMaterial(mat.id, 'Eduardo Marques', 'Aprovado para ilha e bancada gourmet');
    assert.strictEqual(approved.status, 'APPROVED');

    const visualContext = StudioState.getMaterialVisualContext(projectId, environmentId);
    assert(visualContext.approvedMaterialsCount > 0);
    const hasDekton = visualContext.materialsPromptElements.some(m => m.id === mat.id);
    assert(hasDekton, 'Material aprovado deve estar presente nos elementos visuais do ambiente');
    assert(visualContext.compositePromptClause.includes('Superfície Dekton Entzo'));
  });

  // ------------------------------------------------------------------
  // 9. FLUXO DE REJEIÇÃO COM JUSTIFICATIVA OBRIGATÓRIA (PRESERVAÇÃO)
  // ------------------------------------------------------------------
  it('9. Deve rejeitar material exigindo justificativa e preservá-lo como restrição', () => {
    const mat = StudioState.createMaterial({
      projectId,
      environmentId,
      name: 'Granito Preto São Gabriel Polido',
      category: 'PEDRA',
      application: 'BANCADA',
      status: 'IN_REVIEW'
    });

    // Erro se motivo for vazio
    assert.throws(() => {
      StudioState.rejectMaterial(mat.id, '   ');
    }, /obrigatório registrar o motivo/);

    const rejected = StudioState.rejectMaterial(mat.id, 'Cliente rejeitou acabamento escuro; prefere tons claros minerais');
    assert.strictEqual(rejected.status, 'REJECTED');
    assert.strictEqual(rejected.rejectionReason, 'Cliente rejeitou acabamento escuro; prefere tons claros minerais');

    // Material não pode ser deletado
    const fetched = StudioState.getMaterial(mat.id);
    assert(fetched !== null, 'Material rejeitado deve permanecer no banco de dados para auditoria e restrição');
  });

  // ------------------------------------------------------------------
  // 10. VERSIONAMENTO NÃO DESTRUTIVO (V01 -> V02)
  // ------------------------------------------------------------------
  it('10. Deve versionar material sem substituir silenciosamente a versão anterior', () => {
    const v1 = StudioState.createMaterial({
      projectId,
      environmentId,
      name: 'Porcelanato Polido 60x60',
      category: 'PISO',
      application: 'PISO',
      status: 'APPROVED'
    });

    assert.strictEqual(v1.versionCode, 'V01');

    const v2 = StudioState.versionMaterial(v1.id, {
      name: 'Porcelanato Acetinado 120x120',
      notes: 'Ampliação do formato para redução de juntas no living'
    }, 'Eduardo Marques');

    assert.strictEqual(v2.versionCode, 'V02');
    assert.strictEqual(v2.versionSequence, 2);
    assert.strictEqual(v2.parentMaterialId, v1.id);

    // O original deve ter se tornado SUPERSEDED
    const oldMat = StudioState.getMaterial(v1.id);
    assert.strictEqual(oldMat.status, 'SUPERSEDED');
    assert.strictEqual(oldMat.name, 'Porcelanato Polido 60x60', 'Nome anterior deve ser preservado');
  });

  // ------------------------------------------------------------------
  // 11. HIERARQUIA POR AMBIENTE E ESCOPO POR PROJETO
  // ------------------------------------------------------------------
  it('11. Deve filtrar materiais por ambiente e permitir diretrizes globais do projeto', () => {
    const envMaterials = StudioState.getEnvironmentMaterials(projectId, environmentId);
    assert(Array.isArray(envMaterials));
    envMaterials.forEach(m => {
      assert.strictEqual(m.projectId, projectId);
    });

    // Agrupamento por categoria
    const byCategory = StudioState.getProjectMaterials(projectId, { groupBy: 'category' });
    assert(byCategory['PEDRA'], 'Deve agrupar categoria PEDRA');

    // Agrupamento por aplicação
    const byApp = StudioState.getProjectMaterials(projectId, { groupBy: 'application' });
    assert(byApp['PISO'], 'Deve agrupar aplicação PISO');
  });

  // ------------------------------------------------------------------
  // 12. PRINCÍPIO ANTI-ALUCINAÇÃO DA IA
  // ------------------------------------------------------------------
  it('12. Sugestão visual da IA deve ser estritamente AI_SUGGESTION sem inventar marca comercial', () => {
    const suggestions = StudioState.identifyMaterialsFromImage(
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200',
      environmentId,
      { projectId }
    );

    assert(suggestions.length > 0);
    suggestions.forEach(s => {
      assert.strictEqual(s.isAiSuggestion, true);
      assert.strictEqual(s.status, 'SUGGESTED');
      assert.strictEqual(s.origin, 'IA');
      assert.strictEqual(s.isConceptual, true);
      assert.strictEqual(s.productId, null);
      assert(s.aiDetectionMetadata.disclaimer.includes('REQUER HOMOLOGAÇÃO HUMANA'));
    });
  });

  // ------------------------------------------------------------------
  // 13. CADASTRO DE PRODUTO COM SKU, DIMENSÕES E CONSULTED_AT
  // ------------------------------------------------------------------
  it('13. Deve registrar produto comercial com dimensões e timestamp de cotação consulted_at', () => {
    const prod = StudioState.createCatalogProduct({
      name: 'Revestimento Eliane Patchwork',
      skuCode: 'ELI-PATCH-01',
      width: 20,
      length: 20,
      thickness: 6,
      salesUnit: 'M2',
      price: 145.00,
      consultedAt: '2026-09-21T14:00:00Z',
      priceOrigin: 'Catálogo Oficial Eliane 2026'
    });

    assert.strictEqual(prod.skuCode, 'ELI-PATCH-01');
    assert.strictEqual(prod.width, 20);
    assert.strictEqual(prod.length, 20);
    assert.strictEqual(prod.thickness, 6);
    assert.strictEqual(prod.price, 145.00);
    assert.strictEqual(prod.consultedAt, '2026-09-21T14:00:00Z');
  });

  // ------------------------------------------------------------------
  // 14. EXPORTAÇÃO ESTRUTURADA PARA CSV
  // ------------------------------------------------------------------
  it('14. Deve gerar exportação técnica CSV com todas as colunas de especificação', () => {
    const csv = StudioState.exportMaterialsToCSV(projectId, environmentId);
    assert(typeof csv === 'string');
    assert(csv.includes('MATERIAL;CATEGORIA;APLICACAO;PRODUTO_ESPECIFICO;FABRICANTE;CODIGO_SKU'));
    assert(csv.includes('Mármore Travertino Navona Levigado'));
  });

  // ------------------------------------------------------------------
  // 15. RESUMO ESTATÍSTICO E ORÇAMENTÁRIO
  // ------------------------------------------------------------------
  it('15. Deve calcular resumo quantitativo e orçamentário dos materiais', () => {
    const summary = StudioState.getMaterialSummary(projectId, environmentId);
    assert(summary.totalItems > 0);
    assert(summary.approvedCount > 0);
    assert(summary.totalEstimatedCostBRL >= 0);
  });

  console.log('\n====================================================================');
  console.log(`RESULTADO FINAL DO BLOCO E02: ${passedTests} PASSOU | ${failedTests} FALHOU`);
  console.log('====================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests();
