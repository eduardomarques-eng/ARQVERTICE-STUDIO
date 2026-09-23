/**
 * ============================================================================
 * ARQVERTICE STUDIO — SUÍTE DE TESTES AUTOMATIZADOS (D02)
 * PREPARAÇÃO E CURADORIA DAS REFERÊNCIAS VISUAIS
 * ============================================================================
 */

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

const { VisualReferenceCurationModule } = require('../js/visual-reference-curation-module.js');

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

console.log('\n====================================================================');
console.log('ARQVERTICE STUDIO — TESTES D02 (CURADORIA DE REFERÊNCIAS VISUAIS)');
console.log('====================================================================\n');

// 1. Inicialização do Estado
StudioState.init();
const testProject = StudioState.data.projects[0];
const testEnv = StudioState.data.environments.find(e => e.projectId === testProject.id);

console.log(`Projeto de Teste: ${testProject.name} (${testProject.id})`);
console.log(`Ambiente de Teste: ${testEnv.name} (${testEnv.id})\n`);

// ====================================================================
// TESTES DO BLOCO D02
// ====================================================================

console.log('--- 1. Constantes e Categorias Canônicas (8 Tipos) ---');

it('Deve conter exatamente as 8 categorias canônicas de referência visual', () => {
  const types = StudioState.VISUAL_REFERENCE_TYPES;
  assert.strictEqual(Array.isArray(types), true);
  assert.strictEqual(types.length, 8);
  assert.ok(types.includes('GEOMETRY_REFERENCE'), 'Falta GEOMETRY_REFERENCE');
  assert.ok(types.includes('CAMERA_REFERENCE'), 'Falta CAMERA_REFERENCE');
  assert.ok(types.includes('STYLE_REFERENCE'), 'Falta STYLE_REFERENCE');
  assert.ok(types.includes('MATERIAL_REFERENCE'), 'Falta MATERIAL_REFERENCE');
  assert.ok(types.includes('FURNITURE_REFERENCE'), 'Falta FURNITURE_REFERENCE');
  assert.ok(types.includes('LIGHTING_REFERENCE'), 'Falta LIGHTING_REFERENCE');
  assert.ok(types.includes('COMPOSITION_REFERENCE'), 'Falta COMPOSITION_REFERENCE');
  assert.ok(types.includes('AESTHETIC_REFERENCE'), 'Falta AESTHETIC_REFERENCE');
});

it('Deve conter os 4 níveis de prioridade canônicos', () => {
  const priorities = StudioState.VISUAL_REFERENCE_PRIORITIES;
  assert.strictEqual(Array.isArray(priorities), true);
  assert.strictEqual(priorities.length, 4);
  assert.ok(priorities.includes('PRIMARY'), 'Falta PRIMARY');
  assert.ok(priorities.includes('SECONDARY'), 'Falta SECONDARY');
  assert.ok(priorities.includes('OPTIONAL'), 'Falta OPTIONAL');
  assert.ok(priorities.includes('REJECTED'), 'Falta REJECTED');
});

it('Deve disponibilizar anotações de escopo padrão', () => {
  const notes = StudioState.STANDARD_SCOPE_NOTES;
  assert.ok(notes.includes('Use somente material.'));
  assert.ok(notes.includes('Use somente iluminação.'));
  assert.ok(notes.includes('Não reproduzir mobiliário.'));
  assert.ok(notes.includes('Usar composição.'));
});

console.log('\n--- 2. Conjuntos de Referência (VISUAL_REFERENCE_SET) ---');

it('Deve recuperar conjuntos de referência para o ambiente testado', () => {
  const sets = StudioState.getVisualReferenceSets(testProject.id, testEnv.id);
  assert.ok(sets.length >= 1, 'Deveria ter pelo menos 1 conjunto semeado');
  const primarySet = sets[0];
  assert.ok(primarySet.name, 'Conjunto deve ter nome');
  assert.ok(primarySet.environmentId === testEnv.id, 'Ambiente deve bater');
  assert.ok(primarySet.version, 'Conjunto deve ter versão');
  assert.ok(primarySet.objective, 'Conjunto deve ter objetivo');
});

it('Deve permitir criar novo VISUAL_REFERENCE_SET com versão e objetivo', () => {
  const newSet = StudioState.createVisualReferenceSet({
    projectId: testProject.id,
    environmentId: testEnv.id,
    name: 'Estudo Alternativo Boho Chic',
    version: 'V02-BOHO',
    objective: 'Explorar paleta terrosa e iluminação poente',
    priority: 'SECONDARY',
    description: 'Alternativa com fibras naturais e luminárias suspensas'
  });
  assert.ok(newSet.id, 'Novo conjunto deve ter ID gerado');
  assert.strictEqual(newSet.version, 'V02-BOHO');
  assert.strictEqual(newSet.priority, 'SECONDARY');

  const retrieved = StudioState.getVisualReferenceSet(newSet.id);
  assert.strictEqual(retrieved.name, 'Estudo Alternativo Boho Chic');
});

console.log('\n--- 3. Itens Curados e Referências de Câmera e Geometria ---');

it('Deve listar itens de referência do ambiente cobrindo geometria e câmera', () => {
  const items = StudioState.getVisualReferenceItems(testProject.id, testEnv.id);
  assert.ok(items.length >= 5, 'Deveria ter vários itens semeados');

  const geomItem = items.find(i => i.referenceType === 'GEOMETRY_REFERENCE');
  assert.ok(geomItem, 'Deve existir item de geometria');
  assert.ok(geomItem.scopeNotes.length > 0, 'Deve ter anotação de escopo');

  const camItem = items.find(i => i.referenceType === 'CAMERA_REFERENCE');
  assert.ok(camItem, 'Deve existir item de câmera');
  assert.ok(camItem.cameraMeta, 'Item de câmera deve ter metadados espaciais');
  assert.ok(camItem.cameraMeta.direction, 'Câmera deve ter direção');
  assert.ok(camItem.cameraMeta.framing, 'Câmera deve ter enquadramento');
  assert.ok(camItem.cameraMeta.origin, 'Câmera deve ter origem');
});

it('Deve permitir adicionar novo item de referência visual com categoria e prioridade', () => {
  const sets = StudioState.getVisualReferenceSets(testProject.id, testEnv.id);
  const activeSet = sets[0];

  const added = StudioState.addVisualReferenceItem({
    setId: activeSet.id,
    projectId: testProject.id,
    environmentId: testEnv.id,
    title: 'Textura de Concreto Aparente Ripado',
    url: 'assets/materials/concreto_ripado.jpg',
    referenceType: 'MATERIAL_REFERENCE',
    priority: 'SECONDARY',
    scopeNotes: 'Use somente material.',
    notes: 'Aplicar no pilar estrutural do living'
  });

  assert.ok(added.id, 'Item adicionado deve ter ID');
  assert.strictEqual(added.referenceType, 'MATERIAL_REFERENCE');
  assert.strictEqual(added.scopeNotes, 'Use somente material.');
});

console.log('\n--- 4. Integridade Categórica e Trilha de Auditoria ---');

it('Deve registrar log de auditoria ao alterar a categoria de uma referência', () => {
  const items = StudioState.getVisualReferenceItems(testProject.id, testEnv.id);
  const targetItem = items[0];
  const oldType = targetItem.referenceType;
  const newType = oldType === 'MATERIAL_REFERENCE' ? 'STYLE_REFERENCE' : 'MATERIAL_REFERENCE';

  StudioState.updateVisualReferenceItem(targetItem.id, { referenceType: newType }, 'Arquiteto Validador');

  const updated = StudioState.getVisualReferenceItems(testProject.id, testEnv.id).find(i => i.id === targetItem.id);
  assert.strictEqual(updated.referenceType, newType, 'Tipo deveria ter sido atualizado');

  const auditLogs = StudioState.visualReferenceAudit || [];
  const logEntry = auditLogs.find(l => l.itemId === targetItem.id && l.action === 'TYPE_CHANGE');
  assert.ok(logEntry, 'Deve haver registro de TYPE_CHANGE no log de auditoria');
  assert.strictEqual(logEntry.oldValue, oldType);
  assert.strictEqual(logEntry.newValue, newType);
  assert.strictEqual(logEntry.user, 'Arquiteto Validador');
});

it('Deve registrar log de auditoria ao alterar a prioridade de uma referência', () => {
  const items = StudioState.getVisualReferenceItems(testProject.id, testEnv.id);
  const targetItem = items[1];
  const oldPriority = targetItem.priority;
  const newPriority = oldPriority === 'PRIMARY' ? 'OPTIONAL' : 'PRIMARY';

  StudioState.updateVisualReferenceItem(targetItem.id, { priority: newPriority }, 'Coordenador Técnico');

  const updated = StudioState.getVisualReferenceItems(testProject.id, testEnv.id).find(i => i.id === targetItem.id);
  assert.strictEqual(updated.priority, newPriority);

  const auditLogs = StudioState.visualReferenceAudit || [];
  const logEntry = auditLogs.find(l => l.itemId === targetItem.id && l.action === 'PRIORITY_CHANGE');
  assert.ok(logEntry, 'Deve haver registro de PRIORITY_CHANGE no log de auditoria');
  assert.strictEqual(logEntry.oldValue, oldPriority);
  assert.strictEqual(logEntry.newValue, newPriority);
});

console.log('\n--- 5. Exclusão Não-Destrutiva e Preservação do Arquivo Original ---');

it('Deve marcar referência como excluída da geração sem apagar o arquivo original', () => {
  const items = StudioState.getVisualReferenceItems(testProject.id, testEnv.id);
  const itemToExclude = items[0];

  const result = StudioState.toggleVisualReferenceExclusion(itemToExclude.id, true, 'Cliente optou por tom mais claro', 'Arquiteto');
  assert.strictEqual(result.isExcludedFromGeneration, true);
  assert.strictEqual(result.exclusionReason, 'Cliente optou por tom mais claro');

  // Verifica se o item ainda existe na base de referências do estúdio
  const verifyItems = StudioState.getVisualReferenceItems(testProject.id, testEnv.id, null, { includeExcluded: true });
  const stillExists = verifyItems.find(i => i.id === itemToExclude.id);
  assert.ok(stillExists, 'Item deve continuar existindo na base de dados');
  assert.ok(stillExists.url, 'URL e arquivo original devem estar intactos');

  // Restaura para a geração
  const restored = StudioState.toggleVisualReferenceExclusion(itemToExclude.id, false, null, 'Arquiteto');
  assert.strictEqual(restored.isExcludedFromGeneration, false);
});

console.log('\n--- 6. Contexto Visual Estruturado para IA (VISUAL_CONTEXT) ---');

it('Deve sintetizar VISUAL_CONTEXT contendo as 8 dimensões, approved_outputs, restrições e decisões', () => {
  const visualContext = StudioState.buildVisualContext(testProject.id, testEnv.id);

  assert.ok(visualContext, 'VISUAL_CONTEXT não pode ser nulo');
  assert.strictEqual(visualContext.projectId, testProject.id);
  assert.strictEqual(visualContext.environmentId, testEnv.id);

  // Validação das categorias canônicas presentes
  assert.ok(Array.isArray(visualContext.geometry_references), 'geometry_references deve ser array');
  assert.ok(Array.isArray(visualContext.camera_references), 'camera_references deve ser array');
  assert.ok(Array.isArray(visualContext.style_references), 'style_references deve ser array');
  assert.ok(Array.isArray(visualContext.material_references), 'material_references deve ser array');
  assert.ok(Array.isArray(visualContext.furniture_references), 'furniture_references deve ser array');
  assert.ok(Array.isArray(visualContext.lighting_references), 'lighting_references deve ser array');
  assert.ok(Array.isArray(visualContext.composition_references), 'composition_references deve ser array');

  // Validação das seções auxiliares obrigatórias
  assert.ok(Array.isArray(visualContext.approved_outputs), 'approved_outputs deve ser array');
  assert.ok(Array.isArray(visualContext.restrictions), 'restrictions deve ser array');
  assert.ok(Array.isArray(visualContext.decisions), 'decisions deve ser array');

  // Verifica que referências excluídas não vazam para o VISUAL_CONTEXT
  const items = StudioState.getVisualReferenceItems(testProject.id, testEnv.id);
  const testExclusionItem = items[0];
  StudioState.toggleVisualReferenceExclusion(testExclusionItem.id, true, 'Teste de isolamento', 'IA');

  const updatedContext = StudioState.buildVisualContext(testProject.id, testEnv.id);
  const allContextItems = [
    ...updatedContext.geometry_references,
    ...updatedContext.camera_references,
    ...updatedContext.style_references,
    ...updatedContext.material_references,
    ...updatedContext.furniture_references,
    ...updatedContext.lighting_references,
    ...updatedContext.composition_references
  ];
  const foundExcluded = allContextItems.find(i => i.id === testExclusionItem.id);
  assert.strictEqual(foundExcluded, undefined, 'Item excluído não deve estar no VISUAL_CONTEXT');

  // Restaura o item
  StudioState.toggleVisualReferenceExclusion(testExclusionItem.id, false, null, 'IA');
});

console.log('\n--- 7. Assistência por IA e Interface de Curadoria ---');

it('Deve sugerir metadados via IA preservando controle humano', () => {
  const items = StudioState.getVisualReferenceItems(testProject.id, testEnv.id);
  const item = items[0];
  const suggestion = StudioState.suggestReferenceMetadataAI(item.id);

  assert.ok(suggestion, 'Sugestão deve ser gerada');
  assert.ok(suggestion.suggestedType, 'Deve sugerir categoria');
  assert.ok(suggestion.suggestedScope, 'Deve sugerir escopo');
  assert.ok(suggestion.confidence > 0, 'Deve ter confiança calculada');

  // Verifica se o item armazenou as sugestões sem sobrescrever sua categoria original
  const afterItem = StudioState.getVisualReferenceItems(testProject.id, testEnv.id).find(i => i.id === item.id);
  assert.ok(afterItem.aiSuggestions, 'Deve registrar aiSuggestions');
  assert.strictEqual(afterItem.referenceType, item.referenceType, 'Categoria original permanece sob controle humano');
});

it('VisualReferenceCurationModule deve renderizar interface completa com os 8 filtros e cards', () => {
  const html = VisualReferenceCurationModule.render(testEnv, testProject);
  assert.ok(typeof html === 'string', 'Render deve retornar string HTML');
  assert.ok(html.includes('vref-curation-container'), 'Deve conter container de curadoria');
  assert.ok(html.includes('VISUAL_REFERENCE_SET'), 'Deve exibir badge de conjunto');
  assert.ok(html.includes('GEOMETRY_REFERENCE'), 'Deve conter filtro de geometria');
  assert.ok(html.includes('CAMERA_REFERENCE'), 'Deve conter filtro de câmera');
  assert.ok(html.includes('MATERIAL_REFERENCE'), 'Deve conter filtro de material');
  assert.ok(html.includes('vref-cards-grid'), 'Deve renderizar grid de cards');
});

// ====================================================================
// RESULTADOS DA EXECUÇÃO
// ====================================================================

console.log('\n====================================================================');
console.log(`TOTAL DE TESTES EXECUTADOS: ${totalTests}`);
console.log(`PASSOU: ${passedTests}`);
console.log(`FALHOU: ${failedTests}`);
console.log('====================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('✓ TODOS OS TESTES DO BLOCO D02 PASSARAM COM SUCESSO!\n');
}
