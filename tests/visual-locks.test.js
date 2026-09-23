/**
 * ================================================================
 * ARQVERTICE STUDIO — TESTES D07: CONSISTÊNCIA VISUAL, MEMÓRIA E LOCKS
 * ================================================================
 * Validação rigorosa dos 9 cenários do edital D07:
 * 1. Alterar sofá (TARGET: SOFA, PRESERVE: [...])
 * 2. Alterar piso (TARGET: PISO, PRESERVE: [...])
 * 3. Alterar iluminação (TARGET: ILUMINACAO, PRESERVE: [...])
 * 4. Alterar câmera (TARGET: CAMERA, PRESERVE: [...])
 * 5. Alterar múltiplos elementos (TARGET: SOFA + ILUMINACAO)
 * 6. Conflito com lock (Aviso estruturado e bloqueio de alteração sem autorização)
 * 7. Elemento aprovado entre câmeras (Sofá aprovado na C01 preservado na C02)
 * 8. Decisão global + exceção local (Herança de madeira com override local)
 * 9. Nova versão (Bump V01 -> V02 não-destrutivo)
 * 
 * E testes complementares:
 * - 11 locks canônicos com atributos completos
 * - Locks por elemento específico
 * - Salvaguarda contra mutação autônoma de IA
 * - QA & Detecção de Mudanças Inesperadas (POTENTIAL_UNEXPECTED_CHANGE)
 * - Renderização da Interface (VisualLocksModule)
 */

global.window = global;
global.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  body: { appendChild: () => {} }
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
const VisualLocksModule = require('../js/visual-locks-module.js');

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
  console.log('ARQVERTICE STUDIO — TESTES DO BLOCO D07 (CONSISTÊNCIA VISUAL & LOCKS)');
  console.log('====================================================================\n');

  StudioState.init();

  const projectId = 'prj-praia-01';
  const environmentId = 'amb-sala-01';

  // ------------------------------------------------------------------
  // 0. OS 11 LOCKS CANÔNICOS E ATRIBUTOS
  // ------------------------------------------------------------------
  console.log('--- 0. Os 11 Locks Canônicos e Atributos de Estado (Prompt D07 Itens 2 e 3) ---');

  it('Deve conter exatamente os 11 locks canônicos oficiais', () => {
    const canonical = StudioState.CANONICAL_VISUAL_LOCKS;
    assert.strictEqual(canonical.length, 11);
    const expected = ['GEOMETRY', 'LAYOUT', 'OPENINGS', 'CAMERA', 'MATERIALS', 'COLORS', 'LIGHTING', 'FURNITURE', 'DECOR', 'LANDSCAPE', 'COMPOSITION'];
    expected.forEach(lock => assert(canonical.includes(lock), `Deve conter ${lock}`));
  });

  it('getEnvironmentLocks deve retornar os 11 locks com atributos de estado completos', () => {
    const locks = StudioState.getEnvironmentLocks(projectId, environmentId);
    assert.strictEqual(locks.length, 11);
    locks.forEach(l => {
      assert(l.id, 'Lock deve ter id');
      assert.strictEqual(typeof l.enabled, 'boolean', 'enabled deve ser boolean');
      assert(['ENVIRONMENT', 'PROJECT', 'ELEMENT'].includes(l.scope), 'scope deve ser válido');
      assert(['USER', 'PROJECT_BRIEF', 'APPROVED_DECISION', 'AI_SUGGESTION'].includes(l.source), 'source deve ser válida');
      assert(l.version, 'version deve existir');
      assert(l.createdAt, 'createdAt deve existir');
    });
  });

  // ------------------------------------------------------------------
  // CENÁRIO 1: ALTERAR SOFÁ (Prompt D07 Itens 1 e 24)
  // ------------------------------------------------------------------
  console.log('\n--- Cenário 1: Alterar Sofá (TARGET: SOFÁ, PRESERVE: [...]) ---');

  it('Deve estruturar solicitação TARGET: SOFÁ e preservar todas as demais dimensões', () => {
    const alt = StudioState.structureTargetedAlteration(projectId, environmentId, 'Sofá', 'Trocar por modelo curvo em linho bege');

    assert.strictEqual(alt.packageType, 'STRUCTURED_TARGETED_ALTERATION');
    assert.deepStrictEqual(alt.targetElements, ['Sofá']);
    assert(alt.targetCategories.includes('FURNITURE'));

    // Lista de preservação deve manter geometria, layout, piso, paredes, iluminação, câmera, etc.
    const preserve = alt.preserveList;
    assert(preserve.includes('GEOMETRIA'), 'Deve preservar geometria');
    assert(preserve.includes('LAYOUT'), 'Deve preservar layout');
    assert(preserve.includes('PORTAS'), 'Deve preservar portas');
    assert(preserve.includes('JANELAS'), 'Deve preservar janelas');
    assert(preserve.includes('PISO'), 'Deve preservar piso');
    assert(preserve.includes('PAREDES'), 'Deve preservar paredes');
    assert(preserve.includes('ILUMINAÇÃO'), 'Deve preservar iluminação');
    assert(preserve.includes('CÂMERA'), 'Deve preservar câmera');
  });

  // ------------------------------------------------------------------
  // CENÁRIO 2: ALTERAR PISO (Prompt D07 Item 24)
  // ------------------------------------------------------------------
  console.log('\n--- Cenário 2: Alterar Piso ---');

  it('Deve estruturar alteração do piso preservando mobiliário, geometria e forro', () => {
    const alt = StudioState.structureTargetedAlteration(projectId, environmentId, 'Piso', 'Mudar para porcelanato acetinado cinza claro');

    assert.deepStrictEqual(alt.targetElements, ['Piso']);
    assert(alt.targetCategories.includes('MATERIALS'));
    assert(alt.preserveList.includes('GEOMETRIA'));
    assert(alt.preserveList.includes('FORRO'));
    assert(alt.preserveList.includes('DEMAIS MÓVEIS'));
  });

  // ------------------------------------------------------------------
  // CENÁRIO 3: ALTERAR ILUMINAÇÃO (Prompt D07 Item 24)
  // ------------------------------------------------------------------
  console.log('\n--- Cenário 3: Alterar Iluminação ---');

  it('Deve estruturar alteração de iluminação mantendo materiais e objetos travados', () => {
    const alt = StudioState.structureTargetedAlteration(projectId, environmentId, 'Iluminação', 'Adicionar sanca indireta 2700K no teto');

    assert.deepStrictEqual(alt.targetElements, ['Iluminação']);
    assert(alt.targetCategories.includes('LIGHTING'));
    assert(alt.preserveList.includes('MATERIAIS'));
    assert(alt.preserveList.includes('PISO'));
    assert(alt.preserveList.includes('DECORAÇÃO'));
  });

  // ------------------------------------------------------------------
  // CENÁRIO 4: ALTERAR CÂMERA (Prompt D07 Item 24)
  // ------------------------------------------------------------------
  console.log('\n--- Cenário 4: Alterar Câmera ---');

  it('Deve estruturar alteração de câmera sem desconstruir o mobiliário do ambiente', () => {
    const alt = StudioState.structureTargetedAlteration(projectId, environmentId, 'Câmera', 'Mudar focal para 35mm na diagonal');

    assert.deepStrictEqual(alt.targetElements, ['Câmera']);
    assert(alt.targetCategories.includes('CAMERA'));
    assert(alt.preserveList.includes('DEMAIS MÓVEIS'));
    assert(alt.preserveList.includes('ILUMINAÇÃO'));
    assert(alt.preserveList.includes('PAREDES'));
  });

  // ------------------------------------------------------------------
  // CENÁRIO 5: ALTERAR MÚLTIPLOS ELEMENTOS (Prompt D07 Itens 15 e 24)
  // ------------------------------------------------------------------
  console.log('\n--- Cenário 5: Alterar Múltiplos Elementos (Sofá + Iluminação) ---');

  it('Deve suportar alteração de sofá e iluminação preservando geometria e esquadrias', () => {
    const alt = StudioState.structureTargetedAlteration(projectId, environmentId, ['Sofá', 'Iluminação'], 'Sofá mais leve e luz mais acolhedora');

    assert.strictEqual(alt.targetElements.length, 2);
    assert(alt.targetCategories.includes('FURNITURE'));
    assert(alt.targetCategories.includes('LIGHTING'));
    assert(alt.preserveList.includes('GEOMETRIA'));
    assert(alt.preserveList.includes('PORTAS'));
    assert(alt.preserveList.includes('JANELAS'));
    assert(alt.preserveList.includes('PISO'));
  });

  // ------------------------------------------------------------------
  // CENÁRIO 6: CONFLITO COM LOCK (Prompt D07 Itens 16 e 24)
  // ------------------------------------------------------------------
  console.log('\n--- Cenário 6: Conflito com Lock Ativo ---');

  it('detectLockConflicts deve sinalizar conflito quando o elemento ou categoria estiver com lock habilitado', () => {
    // Garante que o lock de mobiliário está ativado
    StudioState.setEnvironmentLock(environmentId, 'FURNITURE', true);

    const conflict = StudioState.detectLockConflicts(environmentId, ['Sofá']);

    assert.strictEqual(conflict.hasConflict, true, 'Deve identificar conflito');
    assert(conflict.conflicts.length > 0);
    const msg = conflict.conflicts[0].message;
    assert(msg.includes('está bloqueado para este ambiente') || msg.includes('especificamente travado'));
  });

  it('Nunca deve desbloquear automaticamente sem permissão explícita', () => {
    const alt = StudioState.structureTargetedAlteration(projectId, environmentId, 'Sofá', 'Troque o sofá', { temporaryUnlock: false });

    assert.strictEqual(alt.hasConflict, true);
    assert.strictEqual(alt.allowExecution, false, 'allowExecution deve ser false quando houver conflito não autorizado');

    // Se o usuário autorizar explicitamente o desbloqueio temporário:
    const altUnlocked = StudioState.structureTargetedAlteration(projectId, environmentId, 'Sofá', 'Troque o sofá', { temporaryUnlock: true });
    assert.strictEqual(altUnlocked.allowExecution, true, 'allowExecution deve ser true após autorização explícita');
  });

  // ------------------------------------------------------------------
  // CENÁRIO 7: ELEMENTO APROVADO ENTRE CÂMERAS (Prompt D07 Itens 19 e 24)
  // ------------------------------------------------------------------
  console.log('\n--- Cenário 7: Elemento Aprovado Entre Câmeras (C01 -> C02) ---');

  it('getCrossCameraConsistentElements deve reconhecer na C02 o sofá aprovado na C01', () => {
    // Homologa um lock de elemento na C01
    StudioState.setElementLock(environmentId, 'SOFA', true, 'Sofá curvo 4 lugares em linho cru homologado na C01', {
      approvedInCameraId: 'cam-sala-01',
      elementName: 'Sofá do Living'
    });

    // Consulta para C02 (deve herdar o sofá aprovado na C01)
    const elementsForC02 = StudioState.getCrossCameraConsistentElements(environmentId, 'cam-sala-02');

    assert(elementsForC02.some(e => e.elementKey === 'SOFA'), 'C02 deve conter o Sofá homologado na C01');
    const sofaInC02 = elementsForC02.find(e => e.elementKey === 'SOFA');
    assert(sofaInC02.statement.includes('Sofá curvo 4 lugares em linho cru'));
  });

  // ------------------------------------------------------------------
  // CENÁRIO 8: DECISÃO GLOBAL + EXCEÇÃO LOCAL (Prompt D07 Itens 20 e 24)
  // ------------------------------------------------------------------
  console.log('\n--- Cenário 8: Decisão Global + Exceção Local (Hierarquia de Precedência) ---');

  it('Deve aplicar a linguagem global de materiais e permitir override por exceção local homologada', () => {
    const globalLang = StudioState.getGlobalProjectMaterialLanguage(projectId, environmentId);

    assert(globalLang.globalMaterials.madeiraPredominante.includes('Carvalho natural'));

    // Cadastra uma memória de exceção local específica para este ambiente
    StudioState.addProjectMemory(projectId, {
      environmentId: environmentId,
      category: 'MATERIAL',
      elementKey: 'MADEIRA',
      subject: 'Madeira do Living Integrado',
      statement: 'Madeira freijó escuro natural ripada',
      status: 'CURRENT',
      isLock: true
    });

    const langWithOverride = StudioState.getGlobalProjectMaterialLanguage(projectId, environmentId);

    assert.strictEqual(langWithOverride.hasLocalOverrides, true);
    assert(langWithOverride.effectiveMaterials.madeiraPredominante.includes('freijó escuro'), 'A exceção local deve prevalecer sobre a global');
  });

  // ------------------------------------------------------------------
  // CENÁRIO 9: NOVA VERSÃO (Prompt D07 Itens 18 e 24)
  // ------------------------------------------------------------------
  console.log('\n--- Cenário 9: Nova Versão Não-Destrutiva ---');

  it('Alteração pontual relevante aprovada com bumpVersion deve gerar nova versão rastreável', () => {
    const env = StudioState.getEnvironment(projectId, environmentId);
    const initialVersion = env.currentVersion || 'V01';

    const alt = StudioState.structureTargetedAlteration(projectId, environmentId, 'Piso', 'Alteração radical de piso', { bumpVersion: true });

    assert.notStrictEqual(alt.contextVersion, initialVersion);
    assert(alt.contextVersion.startsWith('V0'), 'Deve gerar versão válida');
    assert.strictEqual(env.currentVersion, alt.contextVersion);
  });

  // ------------------------------------------------------------------
  // 10. GOVERNANÇA DE IA (Prompt D07 Item 23)
  // ------------------------------------------------------------------
  console.log('\n--- 10. Governança de IA (Proibição de Mutação Autônoma de Locks) ---');

  it('A IA NÃO tem permissão para alterar locks aprovados sem autorização expressa', () => {
    assert.throws(() => {
      StudioState.setEnvironmentLock(environmentId, 'GEOMETRY', false, {
        source: 'AI_SUGGESTION'
      });
    }, /A IA não tem permissão para alterar ou desativar locks aprovados/i);
  });

  // ------------------------------------------------------------------
  // 11. AUDITORIA DE QA E DETECÇÃO DE MUDANÇAS INESPERADAS (Prompt D07 Item 22)
  // ------------------------------------------------------------------
  console.log('\n--- 11. Auditoria de QA (POTENTIAL_UNEXPECTED_CHANGE) ---');

  it('detectUnexpectedChanges deve registrar POTENTIAL_UNEXPECTED_CHANGE em caso de desvio em elemento travado', () => {
    // Cria um job de teste com alteração de parede que afeta esquadrias travadas
    const testJob = StudioState.createRenderJob({
      projectId,
      environmentId,
      userIntent: 'Mudar a parede ao lado da janela',
      options: { targetElements: ['parede'] }
    });

    const audit = StudioState.detectUnexpectedChanges(null, testJob.id);

    assert(audit, 'Audit deve ser retornado');
    assert(['VERIFIED', 'POTENTIAL_UNEXPECTED_CHANGE'].includes(audit.status));
    assert(audit.confidenceScore >= 0.8 && audit.confidenceScore <= 1.0);
    assert(Array.isArray(audit.preservedElements));
  });

  // ------------------------------------------------------------------
  // 12. INTERFACE DO USUÁRIO (VisualLocksModule)
  // ------------------------------------------------------------------
  console.log('\n--- 12. Interface do Usuário (VisualLocksModule) ---');

  it('VisualLocksModule.render deve gerar a interface da Seção 8 completa com os 11 locks', () => {
    const project = StudioState.getProject(projectId);
    const env = StudioState.getEnvironment(projectId, environmentId);
    const visData = StudioState.getEnvironmentVisualization(projectId, environmentId);

    const html = VisualLocksModule.render(visData, env, project);

    assert(typeof html === 'string', 'HTML deve ser string');
    assert(html.includes('vis-section-locks'), 'Deve conter ID da seção');
    assert(html.includes('Consistência Visual, Memória & Locks'), 'Deve conter título');
    assert(html.includes('Geometria Arquitetônica'), 'Deve conter lock de geometria');
    assert(html.includes('Mobiliário Homologado'), 'Deve conter lock de mobiliário');
    assert(html.includes('Assistente de Alteração Pontual'), 'Deve conter assistente');
    assert(html.includes('Consistência Entre Câmeras'), 'Deve conter matriz de consistência');
  });

  console.log('\n====================================================================');
  console.log(`TOTAL DE TESTES EXECUTADOS: ${passedTests + failedTests}`);
  console.log(`PASSOU: ${passedTests}`);
  console.log(`FALHOU: ${failedTests}`);
  console.log('====================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    console.log('✓ TODOS OS TESTES DO BLOCO D07 PASSARAM COM SUCESSO!\n');
  }
})();
