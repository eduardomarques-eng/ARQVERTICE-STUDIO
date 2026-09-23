/**
 * ============================================================================
 * ARQVERTICE STUDIO — SUÍTE DE TESTES: AUDIOVISUAL, TEMPLATES & REMOTION (I13)
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
console.log('SUÍTE DE TESTES: SISTEMA AUDIOVISUAL, TEMPLATE REGISTRY & VIDEO QA (I13)');
console.log('================================================================\n');

let passedCount = 0;
let totalCount = 0;

const rootDir = path.resolve(__dirname, '..');
const templateRegCode = fs.readFileSync(path.join(rootDir, 'video', 'templates', 'template-registry.js'), 'utf8');
const pipelineCode = fs.readFileSync(path.join(rootDir, 'video', 'render', 'audiovisual-pipeline.js'), 'utf8');

const mockGlobal = {};
new Function('global', 'window', templateRegCode)(mockGlobal, mockGlobal);
new Function('global', 'window', pipelineCode)(mockGlobal, mockGlobal);

const TemplateRegistry = mockGlobal.TemplateRegistry;
const VideoCategory = mockGlobal.VideoCategory;
const VideoBriefFactory = mockGlobal.VideoBriefFactory;
const AudiovisualJevRouter = mockGlobal.AudiovisualJevRouter;
const NarrativeScriptSynthesizer = mockGlobal.NarrativeScriptSynthesizer;
const VideoQAService = mockGlobal.VideoQAService;
const AudiovisualPipeline = mockGlobal.AudiovisualPipeline;

// --- 1. Template Registry & Categorias Canônicas ---
console.log('--- 1. Template Registry & Categorias Canônicas (I13) ---');

totalCount++;
if (runTest('TemplateRegistry registra templates nas 7 categorias reais do estúdio', () => {
  const all = TemplateRegistry.listAll();
  if (all.length < 7) throw new Error(`Esperado pelo menos 7 templates, obtido ${all.length}`);

  const categories = [
    VideoCategory.ARCHITECTURE,
    VideoCategory.PROJECT_PRESENTATION,
    VideoCategory.BEFORE_AFTER,
    VideoCategory.SOCIAL,
    VideoCategory.TECHNICAL,
    VideoCategory.CINEMATIC,
    VideoCategory.PORTFOLIO
  ];

  for (let cat of categories) {
    const list = TemplateRegistry.listByCategory(cat);
    if (!list || list.length === 0) {
      throw new Error(`Categoria ${cat} não possui templates registrados.`);
    }
  }
})) passedCount++;

totalCount++;
if (runTest('TemplateRegistry valida presença de assets obrigatórios para cada template', () => {
  const validCheck = TemplateRegistry.validateTemplateInput('EXECUTIVE_CLIENT_PITCH', {
    renders: ['img1.jpg']
  });
  if (!validCheck.valid) throw new Error('Validação com renders válidos falhou.');

  const invalidCheck = TemplateRegistry.validateTemplateInput('BEFORE_AFTER_REFORMA', {});
  if (invalidCheck.valid || !invalidCheck.errors[0].includes('Antes e Depois')) {
    throw new Error('Validação de template Antes e Depois deveria ter falhado.');
  }
})) passedCount++;

// --- 2. Video Brief & Roteamento Delimitado Jev ---
console.log('\n--- 2. Video Brief Estruturado & Roteamento Delimitado via Jev ---');

totalCount++;
if (runTest('VideoBriefFactory instancia brief com parâmetros arquitetônicos completos', () => {
  const brief = VideoBriefFactory.createBrief({
    projectId: 'prj-01',
    objective: 'Reels para Instagram Vertical',
    durationSeconds: 15,
    aspectRatio: '9:16'
  });
  if (!brief.id || brief.durationSeconds !== 15 || brief.aspectRatio !== '9:16') {
    throw new Error('Brief estruturado inconsistente.');
  }
})) passedCount++;

totalCount++;
if (runTest('AudiovisualJevRouter seleciona template REELS_ARCH_IMPACT para objetivo social 9:16', () => {
  const brief = VideoBriefFactory.createBrief({ objective: 'Reels Instagram', aspectRatio: '9:16' });
  const decision = AudiovisualJevRouter.decideTemplateAndFormat(brief);
  if (decision.selectedTemplateId !== 'REELS_ARCH_IMPACT' || decision.durationClass !== '15S_DYNAMIC') {
    throw new Error(`Roteamento Jev incorreto: ${decision.selectedTemplateId}`);
  }
})) passedCount++;

totalCount++;
if (runTest('AudiovisualJevRouter seleciona BEFORE_AFTER_REFORMA para objetivo de reforma', () => {
  const brief = VideoBriefFactory.createBrief({
    objective: 'Transformação antes e depois',
    assets: { beforeImage: 'b.jpg', afterImage: 'a.jpg' }
  });
  const decision = AudiovisualJevRouter.decideTemplateAndFormat(brief);
  if (decision.selectedTemplateId !== 'BEFORE_AFTER_REFORMA') {
    throw new Error(`Roteamento Jev incorreto: ${decision.selectedTemplateId}`);
  }
})) passedCount++;

// --- 3. Síntese de Storyboard & Determinismo ---
console.log('\n--- 3. Síntese de Storyboard & Determinismo Remotion ---');

totalCount++;
if (runTest('NarrativeScriptSynthesizer gera cenas com durações em frames e seed fixo', () => {
  const brief = VideoBriefFactory.createBrief({ durationSeconds: 30 });
  const decision = AudiovisualJevRouter.decideTemplateAndFormat(brief);
  const stb = NarrativeScriptSynthesizer.synthesizeStoryboard(brief, decision);

  if (stb.totalFrames !== 900) { // 30s * 30fps
    throw new Error(`Total de frames incorreto: ${stb.totalFrames}, esperado 900.`);
  }
  if (!stb.seed || stb.seed !== 420815) {
    throw new Error('Seed determinístico ausente ou incorreto.');
  }
  if (stb.scenes.length === 0 || !stb.scenes[0].cameraMotion) {
    throw new Error('Cenas sem parâmetros de movimento de câmera.');
  }
})) passedCount++;

// --- 4. Video QA & Validação de Conformidade ---
console.log('\n--- 4. Video QA & Validação de Conformidade ---');

totalCount++;
if (runTest('VideoQAService aprova vídeo Full HD com duração compatível', () => {
  const brief = VideoBriefFactory.createBrief({ durationSeconds: 30 });
  const decision = AudiovisualJevRouter.decideTemplateAndFormat(brief);
  const stb = NarrativeScriptSynthesizer.synthesizeStoryboard(brief, decision);

  const qa = VideoQAService.validateProduction(brief, stb, { resolution: '1920x1080' });
  if (!qa.passed || qa.issues.length > 0) {
    throw new Error(`QA deveria aprovar produção: ${qa.issues.join(', ')}`);
  }
})) passedCount++;

totalCount++;
if (runTest('VideoQAService rejeita resolução abaixo de Full HD', () => {
  const brief = VideoBriefFactory.createBrief({ durationSeconds: 30 });
  const decision = AudiovisualJevRouter.decideTemplateAndFormat(brief);
  const stb = NarrativeScriptSynthesizer.synthesizeStoryboard(brief, decision);

  const qa = VideoQAService.validateProduction(brief, stb, { resolution: '800x600' });
  if (qa.passed || !qa.issues[0].includes('Full HD')) {
    throw new Error('QA deveria reprovar resolução baixa.');
  }
})) passedCount++;

// --- 5. Execução do Pipeline Fim-a-Fim ---
console.log('\n--- 5. Execução do Pipeline Audiovisual Fim-a-Fim ---');

totalCount++;
if (runTest('AudiovisualPipeline.executePipeline executa brief -> jev -> storyboard -> qa com sucesso', async () => {
  const result = await AudiovisualPipeline.executePipeline({
    projectId: 'prj-01',
    objective: 'Apresentação Executiva',
    durationSeconds: 30,
    aspectRatio: '16:9'
  });

  if (result.pipelineStatus !== 'READY_FOR_REMOTION_RENDER') {
    throw new Error(`Pipeline status inválido: ${result.pipelineStatus}`);
  }
  if (!result.remotionEntryPoint || !result.storyboard) {
    throw new Error('Pipeline não retornou entryPoint ou storyboard.');
  }
})) passedCount++;

console.log('\n================================================================');
console.log(`TOTAL DE TESTES AUDIOVISUAL: ${totalCount}`);
console.log(`PASSOU: ${passedCount}`);
console.log(`FALHOU: ${totalCount - passedCount}`);
console.log('================================================================\n');

if (passedCount !== totalCount) {
  process.exit(1);
}
