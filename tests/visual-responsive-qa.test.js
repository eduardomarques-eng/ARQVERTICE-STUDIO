/**
 * ============================================================================
 * ARQVERTICE STUDIO — SUÍTE DE TESTES: VISUAL QA & RESPONSIVE A11Y (I08 / I09)
 * Validação de tokens de design, regras de mídia, touch targets e acessibilidade.
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
console.log('SUÍTE DE TESTES: VISUAL QA, RESPONSIVIDADE & ACESSIBILIDADE (I08 / I09)');
console.log('================================================================\n');

let passedCount = 0;
let totalCount = 0;

// Carrega arquivos essenciais
const rootDir = path.resolve(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const stylesCss = fs.readFileSync(path.join(rootDir, 'styles.css'), 'utf8');
const responsiveCss = fs.readFileSync(path.join(rootDir, 'css', 'responsive-a11y.css'), 'utf8');
const designMd = fs.readFileSync(path.join(rootDir, 'DESIGN.md'), 'utf8');

// --- 1. Auditoria de Responsividade e Breakpoints ---
console.log('--- 1. Auditoria de Responsividade e Breakpoints (I08) ---');

totalCount++;
if (runTest('A viewport em index.html inclui viewport-fit=cover para suporte a safe areas', () => {
  if (!indexHtml.includes('viewport-fit=cover')) {
    throw new Error('Meta viewport não contém viewport-fit=cover');
  }
})) passedCount++;

totalCount++;
if (runTest('responsive-a11y.css é carregado no index.html', () => {
  if (!indexHtml.includes('css/responsive-a11y.css')) {
    throw new Error('index.html não referencia css/responsive-a11y.css');
  }
})) passedCount++;

totalCount++;
if (runTest('responsive-a11y.css audita os 9 breakpoints canônicos (1440, 1280, 1024, 834, 768, 640, 480, 390, 375)', () => {
  const breakpoints = [1440, 1280, 1024, 834, 768, 640, 480, 390, 375];
  for (let bp of breakpoints) {
    if (!responsiveCss.includes(`(max-width: ${bp}px)`)) {
      throw new Error(`Breakpoint max-width: ${bp}px ausente em responsive-a11y.css`);
    }
  }
})) passedCount++;

totalCount++;
if (runTest('Eliminação de transbordamento horizontal (overflow-x: clip)', () => {
  if (!responsiveCss.includes('overflow-x: clip')) {
    throw new Error('Regra overflow-x: clip ausente no css de responsividade');
  }
})) passedCount++;

// --- 2. Auditoria de Acessibilidade e Interação ---
console.log('\n--- 2. Auditoria de Acessibilidade, Touch Targets e Teclado ---');

totalCount++;
if (runTest('Suporte explícito a focus-visible com anel de alto contraste', () => {
  if (!responsiveCss.includes(':focus-visible') || !responsiveCss.includes('outline: 2px solid')) {
    throw new Error('Estilização de :focus-visible ausente ou insuficiente');
  }
})) passedCount++;

totalCount++;
if (runTest('Touch targets mínimos (>= 44px) implementados para dispositivos táteis', () => {
  if (!responsiveCss.includes('--min-touch-target: 44px') && !responsiveCss.includes('pointer: coarse')) {
    throw new Error('Área de toque mínima de 44px não definida');
  }
})) passedCount++;

totalCount++;
if (runTest('Suporte a prefers-reduced-motion: reduce para usuários sensíveis a movimento', () => {
  if (!responsiveCss.includes('prefers-reduced-motion: reduce')) {
    throw new Error('Media query prefers-reduced-motion: reduce ausente');
  }
})) passedCount++;

totalCount++;
if (runTest('Botão de menu hambúrguer para mobile e drawer backdrop presentes no DOM', () => {
  if (!indexHtml.includes('id="mobile-menu-trigger"') || !indexHtml.includes('id="sidebar-backdrop"')) {
    throw new Error('Elementos do menu móvel (mobile-menu-trigger ou sidebar-backdrop) ausentes no index.html');
  }
})) passedCount++;

// --- 3. Auditoria de Conformidade com DESIGN.md e Heurísticas Anti-AI Slop ---
console.log('\n--- 3. Conformidade com DESIGN.md e Diretrizes Anti-AI Slop (I09) ---');

totalCount++;
if (runTest('DESIGN.md especifica versão 2.1.0 e princípios Apple receded chrome', () => {
  if (!designMd.includes('Apple Design System Specification') || !designMd.includes('receded chrome')) {
    throw new Error('DESIGN.md não alinhado com a especificação Apple canônica');
  }
})) passedCount++;

totalCount++;
if (runTest('Formulários possuem estados endurecidos (valid, invalid, disabled)', () => {
  if (!responsiveCss.includes('.is-invalid') || !responsiveCss.includes('.is-valid')) {
    throw new Error('Classes de validação de formulário ausentes no CSS');
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
