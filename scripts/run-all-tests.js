/**
 * scripts/run-all-tests.js
 * Runner mestre para execução sequencial de todas as suítes de testes do ArqVértice Studio.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('================================================================');
console.log('🚀 ARQVERTICE STUDIO — TEST RUNNER CENTRAL');
console.log('================================================================\n');

const testDir = path.resolve('tests');
const testFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.test.js'));

console.log(`Encontradas ${testFiles.length} suítes de teste em /tests\n`);

let passedCount = 0;
let failedCount = 0;

for (const testFile of testFiles) {
  const fullPath = path.join(testDir, testFile);
  console.log(`▶ Executando: tests/${testFile}...`);
  try {
    execSync(`node "${fullPath}"`, { stdio: 'inherit' });
    passedCount++;
  } catch (err) {
    console.error(`✖ Falha ao executar tests/${testFile}: ${err.message}`);
    failedCount++;
  }
  console.log('----------------------------------------------------------------');
}

console.log(`\n================================================================`);
console.log(`TOTAL DE SUÍTES: ${testFiles.length} | APROVADAS: ${passedCount} | FALHAS: ${failedCount}`);
if (failedCount === 0) {
  console.log('🎉 TODAS AS SUÍTES DE TESTE FORAM APROVADAS COM 100% DE SUCESSO!');
  console.log('================================================================\n');
  process.exit(0);
} else {
  console.error('⚠️ EXISTEM FALHAS NOS TESTES.');
  console.log('================================================================\n');
  process.exit(1);
}
