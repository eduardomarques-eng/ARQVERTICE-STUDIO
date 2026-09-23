/**
 * ============================================================================
 * ARQVERTICE STUDIO — SUÍTE DE TESTES AUTOMATIZADOS (BLOCO C06)
 * MEMÓRIA ESTRUTURADA, DECISÕES, CONTEXTO, SUPERSESSION, CONFLITOS E AUDITORIA
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
  querySelectorAll: () => []
};
global.escapeHTML = (s) => (s ? String(s).replace(/[&<>"']/g, '') : '');
global.formatDateBR = (d) => d || '';

const assert = require('assert');
const StudioState = require('../js/state.js');
global.StudioState = StudioState;
const MemoryModule = require('../js/memory-module.js');

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
console.log('ARQVERTICE STUDIO — TESTES DO BLOCO C06 (MEMÓRIA, DECISÕES E CONTEXTO)');
console.log('====================================================================');

describe('1. Inicialização e Hierarquia da Memória (Prompt Itens 0, 2, 3, 4, 5, 6)', () => {
  StudioState.init();

  it('Deve inicializar as coleções projectMemories, projectMemoryAudit e projectMemoryConflicts', () => {
    assert(Array.isArray(StudioState.data.projectMemories), 'projectMemories deve ser array');
    assert(Array.isArray(StudioState.data.projectMemoryAudit), 'projectMemoryAudit deve ser array');
    assert(Array.isArray(StudioState.data.projectMemoryConflicts), 'projectMemoryConflicts deve ser array');
    assert(StudioState.data.projectMemories.length >= 5, 'Deve conter memórias seed');
  });

  it('Deve validar os 5 níveis hierárquicos e as 17 categorias oficiais', () => {
    assert.strictEqual(StudioState.MEMORY_HIERARCHY_LEVELS.length, 5, 'Devem existir 5 níveis na hierarquia');
    assert(StudioState.MEMORY_HIERARCHY_LEVELS.includes('ORGANIZACAO'));
    assert(StudioState.MEMORY_HIERARCHY_LEVELS.includes('PROJETO'));
    assert(StudioState.MEMORY_HIERARCHY_LEVELS.includes('AMBIENTE'));
    assert(StudioState.MEMORY_HIERARCHY_LEVELS.includes('ELEMENTO'));
    assert(StudioState.MEMORY_HIERARCHY_LEVELS.includes('IMAGEM_VERSAO'));

    assert.strictEqual(StudioState.MEMORY_CATEGORIES.length, 17, 'Devem existir 17 categorias oficiais');
    assert(StudioState.MEMORY_CATEGORIES.includes('FACT'));
    assert(StudioState.MEMORY_CATEGORIES.includes('DECISION'));
    assert(StudioState.MEMORY_CATEGORIES.includes('PREFERENCE'));
    assert(StudioState.MEMORY_CATEGORIES.includes('RESTRICTION'));
    assert(StudioState.MEMORY_CATEGORIES.includes('APPROVED_OUTPUT'));
    assert(StudioState.MEMORY_CATEGORIES.includes('REJECTED_OUTPUT'));
    assert(StudioState.MEMORY_CATEGORIES.includes('AI_SUGGESTION'));
  });

  it('Deve conter status de conhecimento e confiança qualitativa sem porcentagem artificial', () => {
    assert(StudioState.MEMORY_STATUSES.includes('CURRENT'));
    assert(StudioState.MEMORY_STATUSES.includes('SUPERSEDED'));
    assert(StudioState.MEMORY_STATUSES.includes('CONFLICT'));

    assert(StudioState.MEMORY_CONFIDENCE.includes('CONFIRMED'));
    assert(StudioState.MEMORY_CONFIDENCE.includes('UNCONFIRMED'));
    assert(StudioState.MEMORY_CONFIDENCE.includes('ESTIMATED'));
    assert(StudioState.MEMORY_CONFIDENCE.includes('SUGGESTED'));
  });
});

describe('2. Criação de Memória e Consulta Estruturada (Prompt Itens 7, 10, 11, 21)', () => {
  it('Deve registrar nova decisão vinculada a um ambiente e elemento específico com log de auditoria', () => {
    const res = StudioState.addProjectMemory({
      projectId: 'prj-praia-01',
      environmentId: 'amb-cozinha-02',
      elementKey: 'marcenaria_aereos',
      hierarchyLevel: 'ELEMENTO',
      category: 'DECISION',
      status: 'CURRENT',
      source: 'ARQVERTICE',
      confidence: 'CONFIRMED',
      subject: 'Acabamento dos Armários Aéreos da Cozinha',
      statement: 'Vidro canelado com perfil de alumínio preto fosco microtexturizado.',
      reason: 'Leveza visual mantendo privacidade interna dos armários.',
      isLock: true,
      responsible: 'Camila Rossi'
    }, 'Camila Rossi');

    assert.strictEqual(res.success, true);
    assert(res.memory.id.startsWith('mem-'));
    assert.strictEqual(res.memory.version, 1);
    assert.strictEqual(res.memory.isLock, true);

    // Verifica se gerou auditoria
    const audit = StudioState.getMemoryAuditLog('prj-praia-01', res.memory.id);
    assert(audit.length >= 1, 'Auditoria deve registrar criação da memória');
    assert.strictEqual(audit[0].actionType, 'CREATED');
    assert.strictEqual(audit[0].changedBy, 'Camila Rossi');
  });

  it('Deve registrar elemento rejeitado (REJECTED_OUTPUT / Blacklist)', () => {
    const res = StudioState.addProjectMemory({
      projectId: 'prj-praia-01',
      environmentId: 'amb-cozinha-02',
      elementKey: 'puxadores',
      hierarchyLevel: 'ELEMENTO',
      category: 'REJECTED_OUTPUT',
      status: 'CURRENT',
      source: 'CLIENT',
      confidence: 'CONFIRMED',
      subject: 'Puxadores Convencionais',
      statement: 'Cliente vetou puxadores aparentes tradicionais; exige cava oculta 45 graus.',
      reason: 'Preferência por estética minimalista e clean.'
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.memory.category, 'REJECTED_OUTPUT');

    const envMemories = StudioState.getEnvironmentMemories('amb-cozinha-02', { category: 'REJECTED_OUTPUT' });
    assert(envMemories.some(m => m.elementKey === 'puxadores'));
  });
});

describe('3. Proteção e Supersession Não-Destrutiva (Prompt Itens 9, 23, 24)', () => {
  it('Não deve permitir edição silenciosa de decisão homologada sem supersession', () => {
    // Tenta atualizar statement de mem-praia-02 diretamente
    const updateRes = StudioState.updateProjectMemory('mem-praia-02', {
      statement: 'Modificação arbitrária e silenciosa do painel da TV'
    });

    assert.strictEqual(updateRes.success, false, 'Deve recusar alteração direta de texto de decisão aprovada');
    assert(updateRes.error.includes('Supersession'));
  });

  it('Deve executar Supersession criando V02 e preservando V01 com status SUPERSEDED', () => {
    const superRes = StudioState.supersedeProjectMemory('mem-praia-02', {
      statement: 'Substituir painel ripado de carvalho por revestimento monolítico em pedra Moledo clara.',
      reason: 'Cliente Pedro solicitou aspecto mais natural e rústico em reunião de 21/09.',
      responsible: 'Eduardo Marques',
      source: 'CLIENT'
    }, 'Eduardo Marques');

    assert.strictEqual(superRes.success, true);
    assert.strictEqual(superRes.supersededMemory.status, 'SUPERSEDED');
    assert.strictEqual(superRes.newMemory.version, 2);
    assert.strictEqual(superRes.newMemory.status, 'CURRENT');
    assert.strictEqual(superRes.newMemory.supersedesId, 'mem-praia-02');
    assert.strictEqual(superRes.supersededMemory.supersededById, superRes.newMemory.id);

    // Verifica auditoria
    const auditV1 = StudioState.getMemoryAuditLog('prj-praia-01', 'mem-praia-02');
    assert(auditV1.some(a => a.actionType === 'SUPERSEDED'));
  });
});

describe('4. Detecção e Resolução de Conflitos de Decisão (Prompt Item 26)', () => {
  it('Deve detectar conflito quando duas decisões ativas divergentes forem cadastradas no mesmo elemento', () => {
    // Cadastra decisão 1
    const mem1 = StudioState.addProjectMemory({
      projectId: 'prj-praia-01',
      environmentId: 'amb-sala-01',
      elementKey: 'piso_social',
      hierarchyLevel: 'ELEMENTO',
      category: 'DECISION',
      status: 'CURRENT',
      subject: 'Piso Social - Opção A',
      statement: 'Piso em porcelanato acetinado cinza claro 120x120cm.'
    }).memory;

    // Cadastra decisão 2 conflitante no mesmo elemento
    const mem2 = StudioState.addProjectMemory({
      projectId: 'prj-praia-01',
      environmentId: 'amb-sala-01',
      elementKey: 'piso_social',
      hierarchyLevel: 'ELEMENTO',
      category: 'DECISION',
      status: 'CURRENT',
      subject: 'Piso Social - Opção B',
      statement: 'Piso em pedra travertino navona natural levigado.'
    }).memory;

    const conflicts = StudioState.getMemoryConflicts('prj-praia-01', 'OPEN');
    assert(conflicts.length >= 1, 'Deve ter registrado conflito aberto');
    const cnf = conflicts.find(c => c.elementKey === 'piso_social');
    assert(cnf, 'Conflito de piso_social deve existir');
    assert(cnf.memoryIds.includes(mem1.id));
    assert(cnf.memoryIds.includes(mem2.id));
  });

  it('Deve resolver formalmente o conflito homologando a opção vencedora', () => {
    const conflicts = StudioState.getMemoryConflicts('prj-praia-01', 'OPEN');
    const cnf = conflicts.find(c => c.elementKey === 'piso_social');
    assert(cnf, 'Conflito deve existir para resolução');

    const winningId = cnf.memoryIds[1]; // Escolhe a segunda opção (Travertino)
    const res = StudioState.resolveMemoryConflict(cnf.id, winningId, 'Homologado mármore travertino por fidelidade ao conceito de praia.', 'Eduardo Marques');

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.conflict.status, 'RESOLVED');
    assert.strictEqual(res.conflict.resolvedMemoryId, winningId);

    // Memória vencedora deve estar CURRENT
    const winMem = StudioState.data.projectMemories.find(m => m.id === winningId);
    assert.strictEqual(winMem.status, 'CURRENT');

    // Memória preterida deve estar SUPERSEDED
    const losingId = cnf.memoryIds[0];
    const loseMem = StudioState.data.projectMemories.find(m => m.id === losingId);
    assert.strictEqual(loseMem.status, 'SUPERSEDED');
  });
});

describe('5. Contratos Estáveis de Pacotes de Contexto (Prompt Itens 15, 16, 17, 29)', () => {
  it('Deve gerar PROJECT_CONTEXT_PACKAGE estruturado com briefing, conceito e diretrizes', () => {
    const pkg = StudioState.getProjectContext('prj-praia-01');
    assert(pkg, 'Pacote de projeto não pode ser nulo');
    assert.strictEqual(pkg.packageType, 'PROJECT_CONTEXT_PACKAGE');
    assert.strictEqual(pkg.projectId, 'prj-praia-01');
    assert(Array.isArray(pkg.globalDecisions));
    assert(Array.isArray(pkg.globalRestrictions));
    assert(pkg.conceptSummary);
    assert(typeof pkg.milestonesProgressPct === 'number');
  });

  it('Deve gerar ENVIRONMENT_CONTEXT_PACKAGE com locks, decisões ativas e proibições', () => {
    const envPkg = StudioState.getEnvironmentContext('amb-sala-01');
    assert(envPkg, 'Pacote de ambiente não pode ser nulo');
    assert.strictEqual(envPkg.packageType, 'ENVIRONMENT_CONTEXT_PACKAGE');
    assert(envPkg.locks);
    assert(Array.isArray(envPkg.lockedElements));
    assert(Array.isArray(envPkg.approvedDecisions));
    assert(Array.isArray(envPkg.rejectedElements));
    // Confirma que a aversão a mármore veinado está presente
    assert(envPkg.rejectedElements.some(r => r.element === 'marmore_bancada'));
  });

  it('Deve gerar IMAGE_CONTEXT_PACKAGE vinculado à vista e render', () => {
    const imgPkg = StudioState.getImageContext('mem-praia-05');
    assert(imgPkg, 'Pacote de imagem deve existir');
    assert.strictEqual(imgPkg.packageType, 'IMAGE_CONTEXT_PACKAGE');
    assert.strictEqual(imgPkg.camera.viewOrigin, 'REVIT_EXPORT');
    assert(imgPkg.environmentContext);
  });
});

describe('6. Teste de Consistência e Precedência Cognitiva (Prompt Item 14 e Item 32)', () => {
  it('Deve proteger elementos aprovados mantendo painel travado quando o pedido for "trocar somente o sofá"', () => {
    const userIntent = "Trocar somente o sofá da sala por um modelo modular em linho cru";
    const compiled = StudioState.compileContextPackage('prj-praia-01', 'amb-sala-01', userIntent);

    assert.strictEqual(compiled.packageType, 'COMPILED_GENERATION_CONTEXT');
    assert.strictEqual(compiled.currentUserIntent, userIntent);

    // O painel da TV está aprovado e travado como lock e NÃO foi alvo da intenção do usuário
    const protectedTvPanel = compiled.protectedElements.find(p => p.elementKey === 'painel_tv');
    assert(protectedTvPanel, 'Painel da TV DEVE estar na lista de elementos protegidos / travados');
    assert.strictEqual(protectedTvPanel.status, 'LOCKED');
    assert(protectedTvPanel.rule.includes('MANTER INTACTO'));

    // As restrições e elementos rejeitados devem estar ativos (mármore veinado vetado)
    assert(compiled.activeRestrictions.some(r => r.element === 'marmore_bancada'));

    // A ordem de precedência deve ter 8 níveis rígidos
    assert.strictEqual(compiled.precedenceHierarchy.length, 8);
    assert.strictEqual(compiled.precedenceHierarchy[0], 'CURRENT_USER_INTENT');
    assert.strictEqual(compiled.precedenceHierarchy[1], 'APPROVED_DECISION');
    assert.strictEqual(compiled.precedenceHierarchy[2], 'APPROVED_RESTRICTION');
    assert.strictEqual(compiled.precedenceHierarchy[7], 'AI_SUGGESTION');
  });
});

describe('7. Interface e Renderização do Módulo de Memória', () => {
  it('Deve renderizar o painel administrativo da Memória com todas as sub-abas', () => {
    const project = StudioState.getProject('prj-praia-01');
    const client = StudioState.getClient(project.clientId);
    const html = MemoryModule.render(project, client);

    assert(html.includes('BLOCO C06 — MEMÓRIA, DECISÕES E CONTEXTO'));
    assert(html.includes('Decisões ('));
    assert(html.includes('Restrições ('));
    assert(html.includes('Aprovados vs Rejeitados ('));
    assert(html.includes('Conflitos ('));
    assert(html.includes('Pacotes de Contexto IA'));
    assert(html.includes('Auditoria ('));
  });
});

// Finalização e Balanço
console.log('\n====================================================================');
console.log(`TOTAL DE TESTES C06: ${totalTests}`);
console.log(`PASSOU: ${passedTests}`);
console.log(`FALHOU: ${failedTests}`);
console.log('====================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('SUCESSO ABSOLUTO: Todos os testes do Bloco C06 foram aprovados com êxito!');
}
