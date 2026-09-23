/**
 * ============================================================================
 * ARQVERTICE STUDIO — TESTES DO BLOCO D08
 * ============================================================================
 * Suíte de testes rigorosa para versionamento, aprovação, rejeição,
 * histórico não-destrutivo, snapshots e restauração das imagens.
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
const VisualVersioningModule = require('../js/visual-versioning-module.js');

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
  console.log('ARQVERTICE STUDIO — TESTES DO BLOCO D08 (VERSIONAMENTO & APROVAÇÃO)');
  console.log('====================================================================\n');

  StudioState.init();
  const projectId = 'prj-praia-01';
  const environmentId = 'amb-sala-01';

  // ------------------------------------------------------------------
  // 1. TIPOS E STATUS CANÔNICOS (Prompt D08 Itens 1 e 2)
  // ------------------------------------------------------------------
  console.log('--- 1. Tipos e Status Canônicos ---');

  it('Deve expor os 6 tipos canônicos de versionamento visual', () => {
    const types = StudioState.CANONICAL_VISUAL_VERSION_TYPES;
    assert.strictEqual(types.length, 6);
    assert(types.includes('HUMANIZED_PLAN'));
    assert(types.includes('HUMANIZED_PERSPECTIVE'));
    assert(types.includes('CAMERA'));
    assert(types.includes('RENDER'));
    assert(types.includes('REFERENCE_SET'));
    assert(types.includes('VISUAL_CONFIGURATION'));
  });

  it('Deve expor os 7 status canônicos de ciclo de vida', () => {
    const statuses = StudioState.CANONICAL_VISUAL_VERSION_STATUSES;
    assert.strictEqual(statuses.length, 7);
    assert(statuses.includes('DRAFT'));
    assert(statuses.includes('GENERATING'));
    assert(statuses.includes('IN_REVIEW'));
    assert(statuses.includes('APPROVED'));
    assert(statuses.includes('REJECTED'));
    assert(statuses.includes('SUPERSEDED'));
    assert(statuses.includes('ARCHIVED'));
  });

  // ------------------------------------------------------------------
  // 2. CRIAÇÃO DE VERSÕES (Prompt D08 Itens 0, 1 e 3)
  // ------------------------------------------------------------------
  console.log('\n--- 2. Criação Não-Destrutiva de Versões ---');

  it('Deve criar versões com código e sequência automáticos sem sobrescrever anteriores', () => {
    const v1 = StudioState.createVisualVersion({
      projectId,
      environmentId,
      cameraId: 'cam-sala-01',
      versionType: 'RENDER',
      imageUrl: 'https://images.unsplash.com/photo-1600210492486-test1.jpg',
      status: 'IN_REVIEW'
    });

    assert(v1.id);
    assert(v1.versionCode.startsWith('V'));
    assert.strictEqual(v1.status, 'IN_REVIEW');
    assert(v1.locksSnapshot, 'Deve conter snapshot de locks');

    const v2 = StudioState.createVisualVersion({
      projectId,
      environmentId,
      cameraId: 'cam-sala-01',
      versionType: 'RENDER',
      imageUrl: 'https://images.unsplash.com/photo-1600210492486-test2.jpg',
      status: 'IN_REVIEW'
    });

    assert(v2.versionSequence > v1.versionSequence, 'Sequência deve ser incremental');
    assert.notStrictEqual(v1.id, v2.id, 'IDs devem ser distintos');
    
    // A versão anterior não é destruída
    const foundV1 = StudioState.getVisualVersion(v1.id);
    assert(foundV1, 'V1 deve continuar existindo no estado');
  });

  // ------------------------------------------------------------------
  // 3. APROVAÇÃO & REFERÊNCIA VISUAL (Prompt D08 Itens 4 e 5)
  // ------------------------------------------------------------------
  console.log('\n--- 3. Aprovação e Registro de Referência Visual ---');

  it('Deve aprovar uma versão e registrá-la como APPROVED_VISUAL_REFERENCE', () => {
    const testVer = StudioState.createVisualVersion({
      projectId,
      environmentId,
      cameraId: 'cam-sala-01',
      versionType: 'RENDER',
      imageUrl: 'https://images.unsplash.com/photo-test-approved.jpg'
    });

    const approved = StudioState.approveVisualVersion(testVer.id, {
      approvedBy: 'Eduardo Marques (Líder Técnico)',
      notes: 'Homologação oficial do living',
      isApprovedReference: true
    });

    assert.strictEqual(approved.status, 'APPROVED');
    assert.strictEqual(approved.isApprovedReference, true);
    assert(approved.approvedAt);
    assert.strictEqual(approved.approvedBy, 'Eduardo Marques (Líder Técnico)');

    // Verifica se gerou APPROVED_VISUAL_REFERENCE na memória do projeto
    const memories = StudioState.getProjectMemories ? StudioState.getProjectMemories(projectId) : [];
    const hasRefMem = memories.some(m => m.statement && m.statement.includes('APPROVED_VISUAL_REFERENCE'));
    assert(hasRefMem, 'Deve registrar APPROVED_VISUAL_REFERENCE nas memórias do projeto');
  });

  // ------------------------------------------------------------------
  // 4. REJEIÇÃO E MOTIVOS CANÔNICOS (Prompt D08 Item 6)
  // ------------------------------------------------------------------
  console.log('\n--- 4. Rejeição com Motivos sem Deleção ---');

  it('Deve rejeitar com motivo estruturado sem deletar a versão histórica', () => {
    const testVer = StudioState.createVisualVersion({
      projectId,
      environmentId,
      cameraId: 'cam-sala-01',
      versionType: 'RENDER',
      imageUrl: 'https://images.unsplash.com/photo-test-rejected.jpg'
    });

    const rejected = StudioState.rejectVisualVersion(
      testVer.id,
      'ILUMINACAO',
      'Temperatura de cor muito fria para o conceito de resort litorâneo',
      'Camila Rossi'
    );

    assert.strictEqual(rejected.status, 'REJECTED');
    assert.strictEqual(rejected.rejectionReason, 'ILUMINACAO');
    assert.strictEqual(rejected.rejectionNotes, 'Temperatura de cor muito fria para o conceito de resort litorâneo');
    assert.strictEqual(rejected.rejectedBy, 'Camila Rossi');
    assert(rejected.rejectedAt);

    // CRÍTICO: NÃO apagar a imagem
    const exists = StudioState.getVisualVersion(testVer.id);
    assert(exists, 'Versão rejeitada deve permanecer no histórico');
    assert.strictEqual(exists.status, 'REJECTED');
  });

  it('Deve lançar erro ao informar motivo de rejeição não canônico', () => {
    const testVer = StudioState.createVisualVersion({
      projectId,
      environmentId,
      cameraId: 'cam-sala-01',
      versionType: 'RENDER',
      imageUrl: 'https://images.unsplash.com/photo-test-invalid-rej.jpg'
    });

    assert.throws(() => {
      StudioState.rejectVisualVersion(testVer.id, 'MOTIVO_INEXISTENTE', 'teste');
    }, /Motivo de rejeição inválido/i);
  });

  // ------------------------------------------------------------------
  // 5. SUBSTITUIÇÃO (SUPERSEDED) (Prompt D08 Item 7)
  // ------------------------------------------------------------------
  console.log('\n--- 5. Substituição Rastreável (SUPERSEDED) ---');

  it('Ao aprovar uma nova versão, a anterior aprovada da mesma câmera deve tornar-se SUPERSEDED', () => {
    const vOld = StudioState.createVisualVersion({
      projectId,
      environmentId,
      cameraId: 'cam-sala-test-sub',
      versionType: 'RENDER',
      imageUrl: 'https://images.unsplash.com/photo-vOld.jpg'
    });
    StudioState.approveVisualVersion(vOld.id, { notes: 'Aprovação preliminar' });

    assert.strictEqual(StudioState.getVisualVersion(vOld.id).status, 'APPROVED');

    // Cria e aprova a nova versão para a mesma câmera
    const vNew = StudioState.createVisualVersion({
      projectId,
      environmentId,
      cameraId: 'cam-sala-test-sub',
      versionType: 'RENDER',
      imageUrl: 'https://images.unsplash.com/photo-vNew.jpg'
    });
    StudioState.approveVisualVersion(vNew.id, { notes: 'Nova versão definitiva' });

    // A versão antiga deve ser marcada como SUPERSEDED
    const updatedOld = StudioState.getVisualVersion(vOld.id);
    assert.strictEqual(updatedOld.status, 'SUPERSEDED');
    assert.strictEqual(updatedOld.supersededByVersionId, vNew.id);
    assert(updatedOld.supersededAt);

    // A nova versão é APPROVED
    assert.strictEqual(StudioState.getVisualVersion(vNew.id).status, 'APPROVED');
  });

  // ------------------------------------------------------------------
  // 6. COMPARAÇÃO LADO A LADO (Prompt D08 Item 8)
  // ------------------------------------------------------------------
  console.log('\n--- 6. Comparação Lado a Lado (Diff) ---');

  it('Deve comparar duas versões retornando imagens, metadata, locks e diferenças', () => {
    const vA = StudioState.createVisualVersion({
      projectId,
      environmentId,
      cameraId: 'cam-sala-01',
      versionType: 'RENDER',
      imageUrl: 'https://images.unsplash.com/photo-a.jpg',
      metadata: { resolution: '2K', model: 'v1' },
      locksSnapshot: { geometry: true, furniture: false }
    });

    const vB = StudioState.createVisualVersion({
      projectId,
      environmentId,
      cameraId: 'cam-sala-02',
      versionType: 'RENDER',
      imageUrl: 'https://images.unsplash.com/photo-b.jpg',
      metadata: { resolution: '4K', model: 'v2' },
      locksSnapshot: { geometry: true, furniture: true }
    });

    const comp = StudioState.compareVisualVersions(vA.id, vB.id);

    assert(comp.version1 && comp.version2);
    assert.strictEqual(comp.imageComparison.url1, vA.imageUrl);
    assert.strictEqual(comp.imageComparison.url2, vB.imageUrl);
    assert(comp.hasDifferences);
    assert(comp.differences.some(d => d.includes('Resolução')));
    assert(comp.differences.some(d => d.includes('FURNITURE')));
  });

  // ------------------------------------------------------------------
  // 7. TIMELINE CRONOLÓGICA (Prompt D08 Item 9)
  // ------------------------------------------------------------------
  console.log('\n--- 7. Timeline Cronológica Estruturada ---');

  it('getVisualTimeline deve retornar linha do tempo ordenada com eventos do ambiente', () => {
    const timeline = StudioState.getVisualTimeline(projectId, environmentId);

    assert(Array.isArray(timeline));
    assert(timeline.length > 0, 'Deve conter eventos de versões existentes');
    
    // Verifica se os eventos contêm os campos obrigatórios
    timeline.forEach(ev => {
      assert(ev.id);
      assert(ev.timestamp);
      assert(ev.type);
      assert(ev.label);
    });

    // Verifica ordenação cronológica
    for (let i = 1; i < timeline.length; i++) {
      const tPrev = new Date(timeline[i - 1].timestamp).getTime();
      const tCurr = new Date(timeline[i].timestamp).getTime();
      assert(tCurr >= tPrev, 'Timeline deve estar ordenada cronologicamente');
    }
  });

  // ------------------------------------------------------------------
  // 8. COMENTÁRIOS E CONVERSÃO EM DESIGN_DECISION (Prompt D08 Itens 10 e 11)
  // ------------------------------------------------------------------
  console.log('\n--- 8. Comentários e Conversão em Decisão de Projeto ---');

  it('Deve registrar comentário e convertê-lo em DESIGN_DECISION na memória', () => {
    const vTarget = StudioState.createVisualVersion({
      projectId,
      environmentId,
      versionType: 'RENDER',
      imageUrl: 'https://images.unsplash.com/photo-comment-test.jpg'
    });

    const comment = StudioState.addVisualVersionComment(
      vTarget.id,
      'Manter essa iluminação suave refletida na piscina.',
      'Pedro Albuquerque (Cliente)'
    );

    assert(comment.id);
    assert.strictEqual(comment.commentText, 'Manter essa iluminação suave refletida na piscina.');
    assert.strictEqual(comment.convertedToDecision, false);

    // Converte formalmente em Decisão de Projeto
    const conv = StudioState.convertCommentToDesignDecision(comment.id, 'Eduardo Marques');

    assert.strictEqual(conv.comment.convertedToDecision, true);
    assert(conv.comment.decisionMemoryId);
    assert(conv.memory);
    assert.strictEqual(conv.memory.category, 'DECISION');
    assert.strictEqual(conv.memory.statement, 'Manter essa iluminação suave refletida na piscina.');
  });

  // ------------------------------------------------------------------
  // 9. VISUAL SNAPSHOT (Prompt D08 Item 12)
  // ------------------------------------------------------------------
  console.log('\n--- 9. Visual Snapshot Completo ---');

  it('createVisualSnapshot deve registrar estado congelado de referências, locks, câmera e materiais', () => {
    const snap = StudioState.createVisualSnapshot(projectId, environmentId, {
      snapshotName: 'Marco de Conclusão Conceitual',
      description: 'Congelamento para apresentação ao cliente titular'
    });

    assert(snap.id);
    assert(snap.snapshotVersion.startsWith('SNAP-V'));
    assert.strictEqual(snap.snapshotName, 'Marco de Conclusão Conceitual');
    assert(Array.isArray(snap.locksState), 'locksState deve existir');
    assert(snap.materialsState, 'materialsState deve existir');

    const allSnaps = StudioState.getVisualSnapshots(projectId, environmentId);
    assert(allSnaps.some(s => s.id === snap.id));
  });

  // ------------------------------------------------------------------
  // 10. PROTEÇÃO DE VERSÕES APROVADAS (Prompt D08 Item 13)
  // ------------------------------------------------------------------
  console.log('\n--- 10. Proteção de Versões Aprovadas ---');

  it('assertApprovedVersionProtection deve bloquear mutação direta em versão aprovada', () => {
    const vAppr = StudioState.createVisualVersion({
      projectId,
      environmentId,
      versionType: 'RENDER',
      imageUrl: 'https://images.unsplash.com/photo-approved-protect.jpg'
    });
    StudioState.approveVisualVersion(vAppr.id, { notes: 'Aprovada' });

    assert.throws(() => {
      StudioState.assertApprovedVersionProtection(vAppr.id);
    }, /Violação de Proteção: Uma versão aprovada/i);
  });

  // ------------------------------------------------------------------
  // 11. RESTAURAÇÃO: USE AS BASE (Prompt D08 Item 14)
  // ------------------------------------------------------------------
  console.log('\n--- 11. Restauração Não-Destrutiva (USE AS BASE) ---');

  it('restoreVisualVersionAsBase deve criar nova versão sem editar a histórica', () => {
    const vHistoric = StudioState.createVisualVersion({
      projectId,
      environmentId,
      versionType: 'RENDER',
      imageUrl: 'https://images.unsplash.com/photo-historic.jpg',
      status: 'ARCHIVED'
    });

    const newFork = StudioState.restoreVisualVersionAsBase(vHistoric.id, {
      notes: 'Explorando alternativa a partir da base histórica'
    });

    assert(newFork.id);
    assert.notStrictEqual(newFork.id, vHistoric.id);
    assert.strictEqual(newFork.parentVersionId, vHistoric.id);
    assert.strictEqual(newFork.status, 'IN_REVIEW');

    // A versão histórica permaneceu intocada
    const checkHistoric = StudioState.getVisualVersion(vHistoric.id);
    assert.strictEqual(checkHistoric.status, 'ARCHIVED', 'A versão histórica não pode ter sido modificada');
  });

  // ------------------------------------------------------------------
  // 12. RENDERIZAÇÃO DA INTERFACE (VisualVersioningModule)
  // ------------------------------------------------------------------
  console.log('\n--- 12. Interface do Usuário (VisualVersioningModule) ---');

  it('VisualVersioningModule.render deve gerar a interface da Seção 7 completa', () => {
    const visData = StudioState.getEnvironmentVisualization(projectId, environmentId);
    const env = StudioState.getEnvironment(projectId, environmentId);
    const proj = StudioState.getProject(projectId);

    const html = VisualVersioningModule.render(visData, env, proj);

    assert(html.includes('7. Versionamento, Aprovação e Revisão das Imagens'));
    assert(html.includes('ver-type-filter-bar'));
    assert(html.includes('ver-gallery-grid'));
    assert(html.includes('Timeline Visual do Ambiente'));
    assert(html.includes('Visual Snapshots Homologados'));
  });

  // ------------------------------------------------------------------
  // RESULTADO
  // ------------------------------------------------------------------
  console.log('\n====================================================================');
  console.log(`TOTAL DE TESTES EXECUTADOS: ${passedTests + failedTests}`);
  console.log(`PASSOU: ${passedTests}`);
  console.log(`FALHOU: ${failedTests}`);
  console.log('====================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    console.log('✓ TODOS OS TESTES DO BLOCO D08 PASSARAM COM SUCESSO!\n');
  }
}

runTests();
