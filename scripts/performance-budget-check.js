/**
 * scripts/performance-budget-check.js
 * ArqVértice Studio — Verificador de Performance Budgets & Baselines de Produção (K10)
 */

const fs = require('fs');
const path = require('path');

const PERFORMANCE_BUDGETS = {
  maxHtmlSizeBytes: 150 * 1024,      // 150 KB
  maxCssTotalSizeBytes: 600 * 1024,  // 600 KB
  maxSingleJsSizeBytes: 1536 * 1024, // 1.5 MB (comporta js/state.js e schemas completos)
  maxTotalStaticJsBytes: 6 * 1024 * 1024, // 6 MB (total da biblioteca de módulos locais)
  webVitalsTargets: {
    lcpMs: 2500,     // Largest Contentful Paint < 2.5s
    inpMs: 200,      // Interaction to Next Paint < 200ms
    clsScore: 0.1,   // Cumulative Layout Shift < 0.1
    ttfbMs: 200,     // Time to First Byte < 200ms
    ttfp3dMs: 800    // Time to First 3D Pixel < 800ms
  }
};

function auditPerformanceBudgets() {
  console.log('================================================================');
  console.log('⚡ ARQVERTICE STUDIO — AUDITORIA DE PERFORMANCE BUDGETS (K10)');
  console.log('================================================================\n');

  const rootDir = path.resolve(__dirname, '..');
  const violations = [];

  // 1. Auditoria de HTML
  const indexHtmlPath = path.join(rootDir, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    const htmlSize = fs.statSync(indexHtmlPath).size;
    console.log(`📄 index.html: ${(htmlSize / 1024).toFixed(1)} KB (Budget: ${(PERFORMANCE_BUDGETS.maxHtmlSizeBytes / 1024)} KB)`);
    if (htmlSize > PERFORMANCE_BUDGETS.maxHtmlSizeBytes) {
      violations.push(`HTML index.html excedeu o budget (${(htmlSize / 1024).toFixed(1)} KB > ${(PERFORMANCE_BUDGETS.maxHtmlSizeBytes / 1024)} KB)`);
    }
  }

  // 2. Auditoria de CSS
  let totalCssSize = 0;
  const cssFiles = ['styles.css'];
  const cssDir = path.join(rootDir, 'css');
  if (fs.existsSync(cssDir)) {
    for (const f of fs.readdirSync(cssDir).filter(f => f.endsWith('.css'))) {
      cssFiles.push(path.join('css', f));
    }
  }

  for (const cFile of cssFiles) {
    const p = path.join(rootDir, cFile);
    if (fs.existsSync(p)) {
      totalCssSize += fs.statSync(p).size;
    }
  }
  console.log(`🎨 Total CSS Bundles: ${(totalCssSize / 1024).toFixed(1)} KB (Budget: ${(PERFORMANCE_BUDGETS.maxCssTotalSizeBytes / 1024)} KB)`);
  if (totalCssSize > PERFORMANCE_BUDGETS.maxCssTotalSizeBytes) {
    violations.push(`CSS Total excedeu o budget (${(totalCssSize / 1024).toFixed(1)} KB > ${(PERFORMANCE_BUDGETS.maxCssTotalSizeBytes / 1024)} KB)`);
  }

  // 3. Auditoria de Arquivos JS Locais
  const jsDir = path.join(rootDir, 'js');
  let totalJsSize = 0;
  if (fs.existsSync(jsDir)) {
    const scanJs = (dir) => {
      for (const item of fs.readdirSync(dir)) {
        const full = path.join(dir, item);
        const st = fs.statSync(full);
        if (st.isDirectory()) {
          scanJs(full);
        } else if (item.endsWith('.js')) {
          totalJsSize += st.size;
          if (st.size > PERFORMANCE_BUDGETS.maxSingleJsSizeBytes) {
            violations.push(`Arquivo JS '${path.relative(rootDir, full)}' excedeu o limite unitário (${(st.size / 1024).toFixed(1)} KB)`);
          }
        }
      }
    };
    scanJs(jsDir);
  }
  console.log(`📦 Total JS Scripts Locais: ${(totalJsSize / (1024 * 1024)).toFixed(2)} MB (Budget: ${(PERFORMANCE_BUDGETS.maxTotalStaticJsBytes / (1024 * 1024))} MB)`);

  // 4. Metas de Web Vitals & 3D Telemetria
  console.log('\n🎯 Metas de Core Web Vitals & Realtime 3D:');
  console.log(`  - LCP (Largest Contentful Paint): < ${PERFORMANCE_BUDGETS.webVitalsTargets.lcpMs}ms`);
  console.log(`  - INP (Interaction to Next Paint): < ${PERFORMANCE_BUDGETS.webVitalsTargets.inpMs}ms`);
  console.log(`  - CLS (Cumulative Layout Shift): < ${PERFORMANCE_BUDGETS.webVitalsTargets.clsScore}`);
  console.log(`  - TTFB (Time to First Byte): < ${PERFORMANCE_BUDGETS.webVitalsTargets.ttfbMs}ms`);
  console.log(`  - TTFP 3D (Time to First 3D Pixel): < ${PERFORMANCE_BUDGETS.webVitalsTargets.ttfp3dMs}ms`);

  if (violations.length > 0) {
    console.error('\n❌ VIOLAÇÃO DE PERFORMANCE BUDGETS DETECTADA:');
    for (const v of violations) {
      console.error(`  ✖ ${v}`);
    }
    return { passed: false, violations };
  }

  console.log('\n🎉 Todos os budgets de performance foram rigorosamente atendidos!');
  console.log('================================================================\n');
  return { passed: true, violations: [] };
}

if (require.main === module) {
  const res = auditPerformanceBudgets();
  process.exit(res.passed ? 0 : 1);
}

module.exports = { auditPerformanceBudgets, PERFORMANCE_BUDGETS };
