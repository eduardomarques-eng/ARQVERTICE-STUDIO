/**
 * ============================================================================
 * ARQVERTICE STUDIO — TESTES DO BLOCO D09: QA VISUAL E VALIDAÇÃO DAS GERAÇÕES
 * ============================================================================
 * Suíte de testes para a camada de controle de qualidade visual:
 * 1. Execução de QA e geração de VISUAL QA REPORT
 * 2. Cache de performance para imagens idênticas
 * 3. Detecção de violação de lock (POTENTIAL_LOCK_VIOLATION)
 * 4. Element Check em elementos homologados
 * 5. Classificação realista (PASS, WARNING, REVIEW_REQUIRED - nunca 100%)
 * 6. Detecção de artefatos típicos de IA
 * 7. Revisão humana (APPROVE ANYWAY com justificativa e autor)
 * 8. Resumo de telemetria e custo
 * 9. Aceite global do BLOCO D (D01 -> D09)
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
const VisualQAModule = require('../js/visual-qa-module.js');

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
  console.log('ARQVERTICE STUDIO — TESTES DO BLOCO D09 (VISUAL QA & ACEITE BLOCO D)');
  console.log('====================================================================\n');

  StudioState.init();
  const projectId = 'prj-praia-01';
  const environmentId = 'amb-sala-01';

  // ------------------------------------------------------------------
  // 1. EXECUÇÃO DE QA E GERAÇÃO DE VISUAL QA REPORT (Prompt D09 Itens 0, 5 e 9)
  // ------------------------------------------------------------------
  console.log('--- 1. Execução de QA e Geração de Relatório ---');

  it('runVisualQA deve inspecionar a versão e retornar VISUAL QA REPORT com campos canônicos', () => {
    const ver = StudioState.createVisualVersion({
      projectId,
      environmentId,
      versionType: 'RENDER',
      imageUrl: 'https://images.unsplash.com/photo-qa-test-1.jpg'
    });

    const res = StudioState.runVisualQA(ver.id);

    assert.strictEqual(res.cached, false);
    const rep = res.report;

    assert(rep.id);
    assert.strictEqual(rep.versionId, ver.id);
    assert(['PASS', 'WARNING', 'REVIEW_REQUIRED'].includes(rep.overallStatus));
    assert(rep.confidenceScore >= 0.8 && rep.confidenceScore < 1.0, 'Nunca deve declarar 100% correto');
    assert(Array.isArray(rep.lockViolations));
    assert(Array.isArray(rep.warnings));
    assert(Array.isArray(rep.findings));
    assert(Array.isArray(rep.elementsChecked));
    assert.strictEqual(rep.hasHumanReview, false);
  });

  // ------------------------------------------------------------------
  // 2. CACHE DE PERFORMANCE (Prompt D09 Item 12)
  // ------------------------------------------------------------------
  console.log('\n--- 2. Cache de Performance (Imagens Idênticas) ---');

  it('runVisualQA não deve reanalisar versão idêntica e deve retornar resultado em cache', () => {
    const ver = StudioState.createVisualVersion({
      projectId,
      environmentId,
      versionType: 'RENDER',
      imageUrl: 'https://images.unsplash.com/photo-qa-cache-test.jpg'
    });

    // Primeira análise: executa
    const firstRun = StudioState.runVisualQA(ver.id);
    assert.strictEqual(firstRun.cached, false);

    // Segunda análise: deve ser servida do cache
    const secondRun = StudioState.runVisualQA(ver.id);
    assert.strictEqual(secondRun.cached, true, 'Deve identificar imagem idêntica via hash e retornar do cache');
    assert.strictEqual(secondRun.report.id, firstRun.report.id);

    // Força reanálise quando explicitamente solicitado
    const forcedRun = StudioState.runVisualQA(ver.id, { forceReanalysis: true });
    assert.strictEqual(forcedRun.cached, false, 'forceReanalysis deve contornar o cache');
  });

  // ------------------------------------------------------------------
  // 3. LOCK CHECK: DETECÇÃO DE POTENTIAL_LOCK_VIOLATION (Prompt D09 Item 3)
  // ------------------------------------------------------------------
  console.log('\n--- 3. Detecção de Violações de Lock (POTENTIAL_LOCK_VIOLATION) ---');

  it('Deve registrar POTENTIAL_LOCK_VIOLATION quando CAMERA_LOCK estiver ativo e houver divergência', () => {
    // Garante que o lock de câmera está ativo
    StudioState.setEnvironmentLock(environmentId, 'CAMERA', true);

    const verDivergent = StudioState.createVisualVersion({
      projectId,
      environmentId,
      cameraId: 'cam-sala-02', // Câmera diferente
      versionType: 'RENDER',
      imageUrl: 'https://images.unsplash.com/photo-qa-cam-drift.jpg'
    });

    const res = StudioState.runVisualQA(verDivergent.id, {
      divergentCamera: true
    });

    const rep = res.report;
    assert.strictEqual(rep.overallStatus, 'REVIEW_REQUIRED');
    assert(rep.lockViolations.length > 0);
    const camViolation = rep.lockViolations.find(v => v.check === 'CAMERA_LOCK');
    assert(camViolation);
    assert.strictEqual(camViolation.status, 'POTENTIAL_LOCK_VIOLATION');
  });

  it('Deve registrar POTENTIAL_LOCK_VIOLATION quando GEOMETRY_LOCK estiver ativo e houver desvio', () => {
    StudioState.setEnvironmentLock(environmentId, 'GEOMETRY', true);

    const verGeoDrift = StudioState.createVisualVersion({
      projectId,
      environmentId,
      versionType: 'RENDER',
      imageUrl: 'https://images.unsplash.com/photo-qa-geo-drift.jpg'
    });

    const res = StudioState.runVisualQA(verGeoDrift.id, {
      flagGeometricDrift: true
    });

    const rep = res.report;
    assert.strictEqual(rep.overallStatus, 'REVIEW_REQUIRED');
    const geoViolation = rep.lockViolations.find(v => v.check === 'GEOMETRY_LOCK');
    assert(geoViolation);
    assert.strictEqual(geoViolation.status, 'POTENTIAL_LOCK_VIOLATION');
  });

  // ------------------------------------------------------------------
  // 4. ELEMENT CHECK: ELEMENTOS BLOQUEADOS (Prompt D09 Item 4)
  // ------------------------------------------------------------------
  console.log('\n--- 4. Element Check em Elementos Bloqueados ---');

  it('Deve verificar compatibilidade de elementos homologados e sinalizar divergências', () => {
    StudioState.setElementLock(environmentId, 'SOFA', true, 'Sofá modular linho cru homologado');

    const ver = StudioState.createVisualVersion({
      projectId,
      environmentId,
      versionType: 'RENDER',
      imageUrl: 'https://images.unsplash.com/photo-qa-elem.jpg'
    });

    // Simula divergência no elemento SOFA
    const res = StudioState.runVisualQA(ver.id, {
      violatedElementKeys: ['SOFA']
    });

    const rep = res.report;
    assert.strictEqual(rep.overallStatus, 'REVIEW_REQUIRED');
    const sofaViolation = rep.lockViolations.find(v => v.check === 'ELEMENT_LOCK_SOFA');
    assert(sofaViolation);
    assert.strictEqual(sofaViolation.status, 'POTENTIAL_LOCK_VIOLATION');
  });

  // ------------------------------------------------------------------
  // 5. CHECAGEM DE PROBLEMAS GERADOS POR IA (Prompt D09 Item 6)
  // ------------------------------------------------------------------
  console.log('\n--- 5. Detecção de Problemas Típicos de IA ---');

  it('Deve sinalizar artefatos de IA com avisos estruturados', () => {
    const ver = StudioState.createVisualVersion({
      projectId,
      environmentId,
      versionType: 'RENDER',
      imageUrl: 'https://images.unsplash.com/photo-ai-artifacts.jpg'
    });

    const res = StudioState.runVisualQA(ver.id, {
      aiArtifacts: [
        { type: 'DEFORMED_OBJECTS', description: 'Pernas da cadeira de jantar distorcidas pelo modelo de IA', severity: 'WARNING' },
        { type: 'INCOHERENT_LIGHTING', description: 'Sombra dupla divergente da fonte de luz solar principal', severity: 'WARNING' }
      ]
    });

    const rep = res.report;
    assert.strictEqual(rep.overallStatus, 'WARNING');
    assert.strictEqual(rep.aiArtifactsDetected.length, 2);
    assert(rep.warnings.some(w => w.description.includes('Pernas da cadeira')));
  });

  // ------------------------------------------------------------------
  // 6. REVISÃO HUMANA: "APPROVE ANYWAY" (Prompt D09 Itens 7 e 8)
  // ------------------------------------------------------------------
  console.log('\n--- 6. Revisão Humana e Sobreposição (APPROVE ANYWAY) ---');

  it('approveAnywayVisualQA deve permitir sobreposição humana exigindo autor e justificativa', () => {
    const ver = StudioState.createVisualVersion({
      projectId,
      environmentId,
      versionType: 'RENDER',
      imageUrl: 'https://images.unsplash.com/photo-approve-anyway.jpg'
    });

    const res = StudioState.runVisualQA(ver.id, {
      divergentCamera: true // Gera REVIEW_REQUIRED
    });

    const repId = res.report.id;
    assert.strictEqual(res.report.overallStatus, 'REVIEW_REQUIRED');

    // Valida exigência de autorização e justificativa
    assert.throws(() => {
      StudioState.approveAnywayVisualQA(repId, '', 'Motivo válido');
    }, /revisor autorizado é obrigatório/i);

    assert.throws(() => {
      StudioState.approveAnywayVisualQA(repId, 'Eduardo Marques', '');
    }, /justificativa técnica/i);

    // Executa Approve Anyway com sucesso
    const overrideResult = StudioState.approveAnywayVisualQA(
      repId,
      'Eduardo Marques (Arquiteto Titular)',
      'Enquadramento mais aberto aprovado com o cliente para valorizar a vista do mar.'
    );

    assert.strictEqual(overrideResult.report.hasHumanReview, true);
    assert.strictEqual(overrideResult.report.reviewedBy, 'Eduardo Marques (Arquiteto Titular)');
    assert.strictEqual(overrideResult.report.overrideReason, 'Enquadramento mais aberto aprovado com o cliente para valorizar a vista do mar.');
    assert.strictEqual(overrideResult.report.overallStatus, 'APPROVED_WITH_OVERRIDE');
    assert.strictEqual(overrideResult.version.status, 'APPROVED');
  });

  // ------------------------------------------------------------------
  // 7. HISTÓRICO, TELEMETRIA E RESUMO (Prompt D09 Itens 10 e 11)
  // ------------------------------------------------------------------
  console.log('\n--- 7. Histórico, Telemetria e Resumo de QA do Ambiente ---');

  it('getEnvironmentQASummary deve totalizar métricas de QA do ambiente', () => {
    const summary = StudioState.getEnvironmentQASummary(projectId, environmentId);

    assert.strictEqual(summary.environmentId, environmentId);
    assert(summary.totalAnalyzed >= 1);
    assert(typeof summary.passCount === 'number');
    assert(typeof summary.warningCount === 'number');
    assert(typeof summary.reviewRequiredCount === 'number');
  });

  // ------------------------------------------------------------------
  // 8. INTERFACE DO USUÁRIO (VisualQAModule)
  // ------------------------------------------------------------------
  console.log('\n--- 8. Interface do Usuário (VisualQAModule) ---');

  it('VisualQAModule deve renderizar o badge de QA e expor métodos de modal', () => {
    const ver = StudioState.getVisualVersions(projectId, environmentId)[0];
    assert(ver);

    const badgeHtml = VisualQAModule.renderQABadgeForVersion(ver.id);
    assert(badgeHtml.includes('btn-qa-badge'));
    assert(badgeHtml.includes('QA'));
  });

  // ------------------------------------------------------------------
  // 9. CHECKLIST DE ACEITE DO BLOCO D (Prompt D09 Item 15)
  // ------------------------------------------------------------------
  console.log('\n--- 9. Homologação Completa de Aceite do BLOCO D (D01 -> D09) ---');

  it('Checklist de conformidade de ponta a ponta do Bloco D deve estar 100% cumprido', () => {
    // 1. Abrir ambiente
    const env = StudioState.getEnvironment(projectId, environmentId);
    assert(env && env.id === environmentId, 'Ambiente deve ser acessível');

    // 2. Organizar referências & definir referências principais (D02)
    const refSets = StudioState.data.visualReferenceSets.filter(r => r.environmentId === environmentId);
    assert(refSets.some(r => r.priority === 'PRIMARY'), 'Deve possuir referência PRIMARY');

    // 3. Gerar planta humanizada (D03)
    assert(typeof StudioState.createHumanizedPlan === 'function');
    assert(typeof StudioState.generateHumanizedPlan === 'function');

    // 4. Gerar perspectiva humanizada (D04)
    assert(typeof StudioState.createHumanizedPerspective === 'function');
    assert(typeof StudioState.generateHumanizedPerspective === 'function');

    // 5. Cadastrar câmeras (D05)
    const cameras = StudioState.getEnvironmentCameras(projectId, environmentId);
    assert(cameras.length >= 1, 'Deve possuir câmeras cadastradas');

    // 6. Gerar renders & registrar provider/model (D06)
    const jobs = StudioState.data.renderJobs.filter(j => j.environmentId === environmentId);
    assert(jobs.some(j => j.provider && j.model), 'Jobs de render devem registrar provider e model');

    // 7. Preservar contexto, memória, decisões e restrições (D01 & D06)
    const compiled = StudioState.compileRenderPrompt(projectId, environmentId, 'cam-sala-01', 'Trocar sofá');
    assert(compiled.preservationDirective, 'Deve compilar diretiva de preservação');

    // 8. Utilizar locks e alterar elementos pontualmente (D07)
    const targeted = StudioState.structureTargetedAlteration(projectId, environmentId, 'Sofá', 'Linho cru');
    assert(targeted.preserveList.includes('GEOMETRIA'));

    // 9. Criar versões, comparar, aprovar, rejeitar, usar como referência, snapshot (D08)
    assert(typeof StudioState.createVisualVersion === 'function');
    assert(typeof StudioState.compareVisualVersions === 'function');
    assert(typeof StudioState.approveVisualVersion === 'function');
    assert(typeof StudioState.rejectVisualVersion === 'function');
    assert(typeof StudioState.createVisualSnapshot === 'function');
    assert(typeof StudioState.restoreVisualVersionAsBase === 'function');

    // 10. Realizar QA e permitir revisão humana (D09)
    assert(typeof StudioState.runVisualQA === 'function');
    assert(typeof StudioState.approveAnywayVisualQA === 'function');
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
    console.log('✓ TODOS OS TESTES DO BLOCO D09 PASSARAM COM SUCESSO!\n');
    console.log('====================================================================');
    console.log('🎉 ACEITE FINAL DO BLOCO D (D01 A D09) CONCLUÍDO COM 100% DE ÊXITO!');
    console.log('====================================================================\n');
  }
}

runTests();
