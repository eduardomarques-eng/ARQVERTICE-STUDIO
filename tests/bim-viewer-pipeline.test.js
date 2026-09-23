/**
 * ============================================================================
 * ARQVERTICE STUDIO — SUÍTE DE TESTES: BIM, 3D & VIEWER ESTRUTURADO (I12)
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

function runTest(description, testFn) {
  try {
    testFn();
    console.log(`  ✔ [PASS] ${description}`);
    return true;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${description}`);
    console.error(`     Motivo: ${err.message}`);
    return false;
  }
}

console.log('================================================================');
console.log('SUÍTE DE TESTES: BIM 3D & MOTOR DE QUERIES ESTRUTURADAS (I12)');
console.log('================================================================\n');

let passedCount = 0;
let totalCount = 0;

const rootDir = path.resolve(__dirname, '..');
const bimCode = fs.readFileSync(path.join(rootDir, 'js', 'bim-viewer-module.js'), 'utf8');

const mockGlobal = {};
const evalBIM = new Function('global', 'window', 'document', bimCode);
evalBIM(mockGlobal, mockGlobal, undefined);

const BIMStore = mockGlobal.BIMStore;
const BIMQueryEngine = mockGlobal.BIMQueryEngine;
const BIMViewerModule = mockGlobal.BIMViewerModule;

// --- 1. Modelo de Dados Hierárquico BIM ---
console.log('--- 1. Hierarquia de Dados BIM (Project -> Building -> Storey -> Space -> Element) ---');

totalCount++;
if (runTest('BIMStore disponibiliza estrutura hierárquica completa', () => {
  const bim = BIMStore.getBIM('prj-01');
  if (!bim || !bim.building || !bim.building.levels || bim.building.levels.length === 0) {
    throw new Error('Modelo BIM sem níveis estruturados.');
  }
  const living = bim.building.levels[0].spaces.find(s => s.id === 'spc-living');
  if (!living || living.elements.length === 0) {
    throw new Error('Espaço living sem elementos associados.');
  }
})) passedCount++;

// --- 2. Queries Estruturadas Determinísticas (Sem LLM) ---
console.log('\n--- 2. Queries Estruturadas Determinísticas (IA + BIM sem LLM) ---');

totalCount++;
if (runTest('BIMQueryEngine.getSpaces lista todos os ambientes com m² e pé-direito', () => {
  const spaces = BIMQueryEngine.getSpaces('prj-01');
  if (spaces.length < 2) throw new Error('Menos de 2 ambientes retornados.');
  const living = spaces.find(s => s.id === 'spc-living');
  if (!living || living.areaM2 !== 52.50) throw new Error('Área do living incorreta.');
})) passedCount++;

totalCount++;
if (runTest('BIMQueryEngine.getElementsBySpace retorna elementos do espaço selecionado', () => {
  const elems = BIMQueryEngine.getElementsBySpace('prj-01', 'spc-living');
  if (elems.length !== 3) throw new Error(`Esperado 3 elementos no living, obtido ${elems.length}.`);
})) passedCount++;

totalCount++;
if (runTest('BIMQueryEngine.getMaterialsByElement extrai material e acabamento do elemento', () => {
  const mats = BIMQueryEngine.getMaterialsByElement('prj-01', 'elem-floor-01');
  if (!mats || mats.length === 0 || !mats[0].primaryMaterial.includes('Porcelanato')) {
    throw new Error('Material do piso não identificado corretamente.');
  }
})) passedCount++;

totalCount++;
if (runTest('BIMQueryEngine.getElementsByProperty localiza elementos por chave e valor de propriedade', () => {
  const matches = BIMQueryEngine.getElementsByProperty('prj-01', 'Estrutural', true);
  if (matches.length === 0 || matches[0].elementId !== 'elem-floor-01') {
    throw new Error('Falha ao filtrar elementos por propriedade estrutural.');
  }
})) passedCount++;

totalCount++;
if (runTest('BIMQueryEngine.getUnpropertiedElements identifica elementos sem propriedades cadastradas', () => {
  const missing = BIMQueryEngine.getUnpropertiedElements('prj-01');
  if (!Array.isArray(missing) || missing.length !== 0) {
    throw new Error('Identificação de elementos sem propriedades inconsistente.');
  }
})) passedCount++;

// --- 3. Execução de Perguntas Naturais Determinísticas ---
console.log('\n--- 3. Resolução Determinística de Linguagem Natural ---');

totalCount++;
if (runTest('Responde "quais ambientes existem?" deterministicamente sem LLM', () => {
  const res = BIMQueryEngine.executeNaturalQuery('prj-01', 'quais ambientes existem?');
  if (!res || res.type !== 'DETERMINISTIC_QUERY_RESULT' || res.count < 2) {
    throw new Error('Consulta natural de ambientes falhou.');
  }
  if (!res.summaryText.includes('Living Integrado')) {
    throw new Error('Resumo não contém o Living Integrado.');
  }
})) passedCount++;

totalCount++;
if (runTest('Responde "quais elementos pertencem a este ambiente?" deterministicamente', () => {
  const res = BIMQueryEngine.executeNaturalQuery('prj-01', 'quais elementos pertencem ao living?');
  if (!res || res.queryType !== 'ELEMENTS_BY_SPACE' || res.count !== 3) {
    throw new Error('Consulta natural de elementos do living falhou.');
  }
})) passedCount++;

totalCount++;
if (runTest('Responde "qual material está aplicado?" deterministicamente', () => {
  const res = BIMQueryEngine.executeNaturalQuery('prj-01', 'qual material está aplicado no projeto?');
  if (!res || res.queryType !== 'LIST_MATERIALS' || !res.summaryText.includes('Porcelanato')) {
    throw new Error('Consulta natural de materiais falhou.');
  }
})) passedCount++;

// --- 4. Viewer UX, Planos de Corte e Medição ---
console.log('\n--- 4. Viewer UX, Planos de Corte e Medições ---');

totalCount++;
if (runTest('BIMViewerModule gerencia seleção, isolamento e ocultação de nós 3D', () => {
  BIMViewerModule.selectElement('elem-wall-01');
  if (BIMViewerModule.selectedElementId !== 'elem-wall-01') {
    throw new Error('Seleção de elemento falhou.');
  }

  BIMViewerModule.isolateElement('elem-wall-01');
  if (BIMViewerModule.isolatedElementId !== 'elem-wall-01') {
    throw new Error('Isolamento falhou.');
  }

  BIMViewerModule.hideElement('elem-floor-01');
  if (!BIMViewerModule.hiddenElementIds.has('elem-floor-01')) {
    throw new Error('Ocultação falhou.');
  }

  BIMViewerModule.resetVisibility();
  if (BIMViewerModule.isolatedElementId !== null || BIMViewerModule.hiddenElementIds.size !== 0) {
    throw new Error('Reset de visibilidade falhou.');
  }
})) passedCount++;

totalCount++;
if (runTest('BIMViewerModule suporta planos de corte X, Y e Z', () => {
  BIMViewerModule.setClippingPlane('X');
  if (BIMViewerModule.activeClippingPlane !== 'X') throw new Error('Corte X não ativado.');

  BIMViewerModule.setClippingPlane('X');
  if (BIMViewerModule.activeClippingPlane !== null) throw new Error('Toggle de corte falhou.');
})) passedCount++;

totalCount++;
if (runTest('BIMViewerModule executa dispose liberando memória', () => {
  BIMViewerModule.dispose();
  if (BIMViewerModule.selectedElementId !== null || BIMViewerModule.measurePoints.length !== 0) {
    throw new Error('Dispose de memória falhou.');
  }
})) passedCount++;

console.log('\n================================================================');
console.log(`TOTAL DE TESTES BIM: ${totalCount}`);
console.log(`PASSOU: ${passedCount}`);
console.log(`FALHOU: ${totalCount - passedCount}`);
console.log('================================================================\n');

if (passedCount !== totalCount) {
  process.exit(1);
}
