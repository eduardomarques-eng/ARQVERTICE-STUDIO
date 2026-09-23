const fs = require('fs');
const path = require('path');

const indexHtml = fs.readFileSync('index.html', 'utf8');
const portalHtml = fs.readFileSync('portal.html', 'utf8');
const briefingHtml = fs.readFileSync('briefing.html', 'utf8');

function extractInlineStyles(html, name) {
  const matches = html.match(/style="([^"]+)"/g) || [];
  return { name, count: matches.length, samples: matches.slice(0, 5) };
}

console.log('--- INLINE STYLES IN HTML ---');
console.log(extractInlineStyles(indexHtml, 'index.html'));
console.log(extractInlineStyles(portalHtml, 'portal.html'));
console.log(extractInlineStyles(briefingHtml, 'briefing.html'));

// Scan CSS files
function analyzeCSSFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  
  const hex = new Set();
  const fontSizes = new Set();
  const fontFamilies = new Set();
  const fontWeights = new Set();
  const letterSpacings = new Set();
  const lineHeights = new Set();
  const radii = new Set();
  const shadows = new Set();
  const zIndices = new Set();
  const transitions = new Set();
  const hasReducedMotion = content.includes('prefers-reduced-motion');
  const mediaQueries = (content.match(/@media\s*\([^\)]+\)/g) || []);

  lines.forEach((line, idx) => {
    // Collect hex colors outside variable declarations in root
    const hx = line.match(/#[0-9a-fA-F]{3,8}\b/g);
    if (hx && idx > 120) hx.forEach(c => hex.add(c.toLowerCase()));

    const fsMatch = line.match(/font-size:\s*([^;]+);/);
    if (fsMatch) fontSizes.add(fsMatch[1].trim());

    const ffMatch = line.match(/font-family:\s*([^;]+);/);
    if (ffMatch) fontFamilies.add(ffMatch[1].trim());

    const fwMatch = line.match(/font-weight:\s*([^;]+);/);
    if (fwMatch) fontWeights.add(fwMatch[1].trim());

    const lsMatch = line.match(/letter-spacing:\s*([^;]+);/);
    if (lsMatch) letterSpacings.add(lsMatch[1].trim());

    const lhMatch = line.match(/line-height:\s*([^;]+);/);
    if (lhMatch) lineHeights.add(lhMatch[1].trim());

    const radMatch = line.match(/border-radius:\s*([^;]+);/);
    if (radMatch) radii.add(radMatch[1].trim());

    const shMatch = line.match(/box-shadow:\s*([^;]+);/);
    if (shMatch) shadows.add(shMatch[1].trim());

    const zMatch = line.match(/z-index:\s*([^;]+);/);
    if (zMatch) zIndices.add(zMatch[1].trim());

    const trMatch = line.match(/transition:\s*([^;]+);/);
    if (trMatch) transitions.add(trMatch[1].trim());
  });

  return {
    filePath,
    lineCount: lines.length,
    hexColorsCount: hex.size,
    fontSizes: Array.from(fontSizes),
    fontFamilies: Array.from(fontFamilies),
    fontWeights: Array.from(fontWeights),
    letterSpacings: Array.from(letterSpacings),
    lineHeights: Array.from(lineHeights),
    radii: Array.from(radii),
    shadowsCount: shadows.size,
    shadows: Array.from(shadows).slice(0, 10),
    zIndices: Array.from(zIndices),
    transitionsCount: transitions.size,
    hasReducedMotion,
    mediaQueryCount: mediaQueries.length,
    mediaQueriesUnique: Array.from(new Set(mediaQueries))
  };
}

console.log('\n--- CSS AUDIT: styles.css ---');
const stylesAudit = analyzeCSSFile('styles.css');
console.log({
  file: stylesAudit.filePath,
  lines: stylesAudit.lineCount,
  hexColorsCount: stylesAudit.hexColorsCount,
  fontSizeCount: stylesAudit.fontSizes.length,
  fontFamilies: stylesAudit.fontFamilies,
  fontWeights: stylesAudit.fontWeights,
  letterSpacings: stylesAudit.letterSpacings,
  lineHeights: stylesAudit.lineHeights,
  radiiCount: stylesAudit.radii.length,
  radii: stylesAudit.radii,
  shadowsCount: stylesAudit.shadowsCount,
  zIndices: stylesAudit.zIndices,
  hasReducedMotion: stylesAudit.hasReducedMotion,
  mediaQueriesUnique: stylesAudit.mediaQueriesUnique
});

console.log('\n--- CSS AUDIT: css/client-portal.css ---');
const portalCssAudit = analyzeCSSFile('css/client-portal.css');
console.log({
  file: portalCssAudit.filePath,
  lines: portalCssAudit.lineCount,
  hexColorsCount: portalCssAudit.hexColorsCount,
  fontSizeCount: portalCssAudit.fontSizes.length,
  fontFamilies: portalCssAudit.fontFamilies,
  radii: portalCssAudit.radii,
  shadowsCount: portalCssAudit.shadowsCount,
  hasReducedMotion: portalCssAudit.hasReducedMotion,
  mediaQueriesUnique: portalCssAudit.mediaQueriesUnique
});
