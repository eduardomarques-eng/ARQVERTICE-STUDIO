/**
 * ============================================================================
 * ARQVERTICE STUDIO — SUÍTE DE TESTES: IA CONTEXTUAL & AGENT SKILLS (I10 / I11)
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
console.log('SUÍTE DE TESTES: IA CONTEXTUAL, COMMAND ROUTER & AGENT SKILLS (I10 / I11)');
console.log('================================================================\n');

let passedCount = 0;
let totalCount = 0;

const rootDir = path.resolve(__dirname, '..');

// 1. Simulação de Ambiente de Navegador para testar contextual-ai-module.js
const mockGlobal = {
  StudioState: {
    data: {
      currentView: 'workspace',
      activeProjectTab: 'ambientes',
      activeEnvironmentTab: 'dados',
      selectedProjectId: 'prj-01',
      projects: [
        {
          id: 'prj-01',
          code: 'PRJ-01',
          name: 'Residência Alphaville Eusébio',
          typology: 'Residencial Unifamiliar',
          status: 'Em Desenvolvimento',
          currentStage: 'Estudo Preliminar',
          builtAreaM2: 450,
          clientId: 'cli-01'
        }
      ],
      clients: [{ id: 'cli-01', name: 'Pedro & Família' }],
      environments: [
        {
          id: 'env-01',
          name: 'Living Integrado',
          type: 'Social',
          areaM2: 52.5,
          floorLevel: 'Térreo',
          status: 'Em desenvolvimento',
          currentVersion: 'V02',
          materials: [{ name: 'Porcelanato 120x120' }],
          locks: { geometry: true }
        }
      ]
    },
    getProjectMemories: () => [
      { category: 'DECISION', title: 'Integração de Cozinha e Living', description: 'Aprovada a remoção da alvenaria divisória.' }
    ],
    addProjectMemory: (pid, mem) => {
      // Mock de persistência
      return { id: 'mem-new', ...mem };
    }
  }
};

// Carrega o módulo contextual no contexto simulado
const contextualAiCode = fs.readFileSync(path.join(rootDir, 'js', 'contextual-ai-module.js'), 'utf8');
const evalContextualModule = new Function('global', 'window', 'document', contextualAiCode);
evalContextualModule(mockGlobal, mockGlobal, undefined);

// --- 1. Testes de Context Builder & Minimização ---
console.log('--- 1. Context Builder & Minimização de Dados (I10) ---');

totalCount++;
if (runTest('ContextBuilder gera pacote com metadados essenciais e sem overhead do projeto inteiro', () => {
  const pkg = mockGlobal.ContextBuilder.build({ domain: mockGlobal.ContextDomain.ENVIRONMENT });
  if (!pkg.project || pkg.project.projectId !== 'prj-01') {
    throw new Error('Project context não construído corretamente');
  }
  if (!pkg.screen || pkg.screen.activeView !== 'workspace') {
    throw new Error('Screen context não capturado');
  }
  if (!pkg.relevantMemories || pkg.relevantMemories.length === 0) {
    throw new Error('Memórias relevantes ausentes no contexto');
  }
  // Garante que dados confidenciais ou dumps inteiros não estão no pacote
  if (pkg.projects || pkg.environments) {
    throw new Error('Context Minimization violada: coleções brutas trafegadas no pacote');
  }
})) passedCount++;

totalCount++;
if (runTest('ContextBuilder isola o ambiente focado quando SelectionType.ENVIRONMENT está ativo', () => {
  mockGlobal.MemoryLayers.setSelection(mockGlobal.SelectionType.ENVIRONMENT, 'env-01', { name: 'Living Integrado' });
  const pkg = mockGlobal.ContextBuilder.build();
  if (pkg.selection.type !== 'ENVIRONMENT' || !pkg.selection.details || pkg.selection.details.name !== 'Living Integrado') {
    throw new Error('Seleção de ambiente não refletida no pacote de contexto');
  }
})) passedCount++;

// --- 2. Testes do Natural Language Command Router ---
console.log('\n--- 2. Natural Language Command Router & Intenções (I10) ---');

const testCommands = [
  { text: 'analise esta sala', expectedIntent: 'ANALYZE_ROOM', expectedCap: 'VISION_ANALYSIS' },
  { text: 'gere uma narrativa para esta apresentação', expectedIntent: 'PRESENTATION_NARRATIVE', expectedCap: 'PRESENTATION_SYNTHESIS' },
  { text: 'prepare o roteiro do vídeo', expectedIntent: 'VIDEO_SCRIPT', expectedCap: 'VIDEO_PROMPT_GENERATION' },
  { text: 'verifique os materiais', expectedIntent: 'CHECK_MATERIALS', expectedCap: 'STRUCTURED_DATA_EXTRACTION' },
  { text: 'compare estas duas opções', expectedIntent: 'COMPARE_OPTIONS', expectedCap: 'ARCHITECTURAL_DECISION' },
  { text: 'mostre problemas nesta planta', expectedIntent: 'INSPECT_PLAN', expectedCap: 'BIM_STRUCTURAL_ANALYSIS' }
];

testCommands.forEach(tc => {
  totalCount++;
  if (runTest(`Reconhecimento do comando natural "${tc.text}" -> Intent: ${tc.expectedIntent}`, () => {
    const parsed = mockGlobal.CommandRouter.parse(tc.text);
    if (!parsed || parsed.intent !== tc.expectedIntent) {
      throw new Error(`Intent esperada: ${tc.expectedIntent}, obtida: ${parsed ? parsed.intent : 'null'}`);
    }
    if (parsed.capability !== tc.expectedCap) {
      throw new Error(`Capability esperada: ${tc.expectedCap}, obtida: ${parsed.capability}`);
    }
  })) passedCount++;
});

// --- 3. Ciclo Seguro: PROPOSE ➔ PREVIEW ➔ VALIDATE ➔ APPLY ---
console.log('\n--- 3. Ciclo Seguro de Mutação (PROPOSE ➔ PREVIEW ➔ VALIDATE ➔ APPLY) ---');

totalCount++;
if (runTest('ProposalWorkflow executa o ciclo completo com pré-visualização e validação', () => {
  const proposal = mockGlobal.ProposalWorkflow.propose({
    title: 'Ajuste de Layout Living',
    summary: 'Abertura de vão para 1.00m',
    dataToApply: { openingWidthM: 1.00 }
  });
  if (proposal.status !== 'PROPOSED') throw new Error('Status inicial não é PROPOSED');

  const preview = mockGlobal.ProposalWorkflow.preview();
  if (!preview || !preview.previewDiff.includes('openingWidthM')) {
    throw new Error('Pré-visualização diff não gerada');
  }

  const validation = mockGlobal.ProposalWorkflow.validate();
  if (!validation.valid) throw new Error('Validação de proposta válida falhou');

  const applied = mockGlobal.ProposalWorkflow.apply();
  if (applied.status !== 'APPLIED') throw new Error('Status final não é APPLIED');
})) passedCount++;

// --- 4. Política de Confirmação & Camadas de Memória ---
console.log('\n--- 4. Confirmation Policy & Segregação de Memória ---');

totalCount++;
if (runTest('ConfirmationPolicy identifica ações críticas e destrutivas', () => {
  if (!mockGlobal.ConfirmationPolicy.shouldConfirm('DELETE_ENVIRONMENT', { id: 'env-01' })) {
    throw new Error('Ação de delete não exigiu confirmação');
  }
  if (mockGlobal.ConfirmationPolicy.shouldConfirm('ANALYZE_ROOM')) {
    throw new Error('Ação de análise de leitura exigiu confirmação desnecessária');
  }
})) passedCount++;

totalCount++;
if (runTest('MemoryLayers segrega Session, Task, User Preferences e System Knowledge', () => {
  const ml = mockGlobal.MemoryLayers;
  ml.recordCommand('teste comando 1');
  if (ml.sessionMemory.recentCommands[0].command !== 'teste comando 1') {
    throw new Error('Session memory não gravou comando');
  }
  ml.storeTaskMemory('task-99', { progress: 50 });
  if (ml.getTaskMemory('task-99').progress !== 50) {
    throw new Error('Task memory não isolou tarefa');
  }
  if (!ml.systemKnowledge.standards.includes('NBR 6492')) {
    throw new Error('Normas NBR ausentes do System Knowledge');
  }
})) passedCount++;

// --- 5. Validação Estrutural das 13 Agent Skills (I11) ---
console.log('\n--- 5. Validação Estrutural das 13 Agent Skills em .agents/skills/ (I11) ---');

const expectedSkills = [
  'architecture-brief',
  'bim-analysis',
  'architectural-documentation',
  'material-analysis',
  'presentation-direction',
  'video-direction',
  'remotion',
  'project-qa',
  'visual-qa',
  'responsive-qa',
  'design-system',
  'image-analysis',
  'project-context'
];

expectedSkills.forEach(skillName => {
  totalCount++;
  if (runTest(`Skill "${skillName}" existe com frontmatter YAML e seções canônicas completas`, () => {
    const skillPath = path.join(rootDir, '.agents', 'skills', skillName, 'SKILL.md');
    if (!fs.existsSync(skillPath)) {
      throw new Error(`Arquivo ${skillPath} não encontrado`);
    }
    const content = fs.readFileSync(skillPath, 'utf8');

    // Validação do frontmatter
    if (!content.startsWith('---') || !content.includes(`name: ${skillName}`) || !content.includes('description:')) {
      throw new Error(`Frontmatter YAML ausente ou inválido em ${skillName}`);
    }

    // Validação das seções canônicas mandatórias
    const mandatorySections = [
      '## Name',
      '## Purpose',
      '## Trigger',
      '## Inputs',
      '## Context',
      '## Workflow',
      '## Tools',
      '## Constraints',
      '## Output',
      '## Validation',
      '## Failure Modes'
    ];

    for (let sec of mandatorySections) {
      if (!content.includes(sec)) {
        throw new Error(`Seção obrigatória "${sec}" ausente na skill ${skillName}`);
      }
    }
  })) passedCount++;
});

// --- 6. Documentos de Governança (I07) ---
console.log('\n--- 6. Documentos de Governança e Matriz de Adoção (I07) ---');

totalCount++;
if (runTest('repository-adoption-matrix.md existe e contém os 11 candidatos priorizados', () => {
  const matrixPath = path.join(rootDir, 'docs', 'research', 'repository-adoption-matrix.md');
  if (!fs.existsSync(matrixPath)) throw new Error('Matriz de adoção não encontrada');
  const matrixContent = fs.readFileSync(matrixPath, 'utf8');

  const candidates = [
    'Impeccable', 'design-md', 'Remotion', 'React Three Fiber', 'That Open',
    'OpenMotion', 'OpenChatCut', 'Aedifex', 'Roomify', 'Strux', 'OpenBIM Viewer'
  ];

  for (let c of candidates) {
    if (!matrixContent.includes(c)) {
      throw new Error(`Candidato "${c}" ausente na matriz de adoção`);
    }
  }

  // Verifica presença de decisões explícitas
  const decisions = ['ADOPT', 'ADAPT', 'REFERENCE', 'EXPERIMENT'];
  for (let d of decisions) {
    if (!matrixContent.includes(d)) {
      throw new Error(`Classificação de decisão "${d}" ausente na matriz`);
    }
  }
})) passedCount++;

totalCount++;
if (runTest('skills-registry.md mapeia precedências, triggers e workflows de execução', () => {
  const regPath = path.join(rootDir, 'docs', 'ai', 'skills-registry.md');
  if (!fs.existsSync(regPath)) throw new Error('Skills registry não encontrado');
  const regContent = fs.readFileSync(regPath, 'utf8');
  if (!regContent.includes('Ordem de Precedência') || !regContent.includes('Resolução de Conflitos')) {
    throw new Error('Tópicos de precedência ou conflito ausentes em skills-registry.md');
  }
})) passedCount++;

console.log('\n================================================================');
console.log(`TOTAL DE TESTES: ${totalCount}`);
console.log(`PASSOU: ${passedCount}`);
console.log(`FALHOU: ${totalCount - passedCount}`);
console.log('================================================================\n');

if (passedCount !== totalCount) {
  process.exit(1);
}
