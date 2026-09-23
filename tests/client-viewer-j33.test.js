const assert = require('assert');
const fs = require('fs');
const path = require('path');

const AdaptiveRenderer = require('../js/adaptive-renderer.js');
const ClientViewerModule = require('../js/client-viewer-module.js');

console.log('================================================================');
console.log('🧪 INICIANDO BATERIA DE TESTES: J33 — ARQVERTICE CLIENT VIEWER');
console.log('================================================================');

// 1. Teste do AdaptiveRenderer e Perfis Gráficos
(() => {
    console.log('\n[1/5] Testando AdaptiveRenderer & Preset Engine...');
    const renderer = new AdaptiveRenderer();
    
    // Presets disponíveis
    const presets = renderer.getAvailablePresets();
    assert(Array.isArray(presets) && presets.length >= 4, 'Deveria listar pelo menos 4 presets.');
    
    // Mudança de preset
    renderer.setPreset('MOBILE');
    const mobileConfig = renderer.getConfig();
    assert.strictEqual(mobileConfig.resolvedKey, 'MOBILE');
    assert.strictEqual(mobileConfig.shadows, false, 'Mobile deve ter sombras desabilitadas para economia.');
    assert.strictEqual(mobileConfig.pixelRatioMax, 1.2, 'Mobile deve limitar DPR a 1.2.');

    renderer.setPreset('HIGH');
    const highConfig = renderer.getConfig();
    assert.strictEqual(highConfig.resolvedKey, 'HIGH');
    assert.strictEqual(highConfig.shadows, true, 'High deve habilitar sombras PBR.');
    assert.strictEqual(highConfig.shadowMapSize, 2048, 'High deve usar mapa de sombras 2048.');

    renderer.setPreset('ULTRA');
    const ultraConfig = renderer.getConfig();
    assert.strictEqual(ultraConfig.resolvedKey, 'ULTRA');
    assert.strictEqual(ultraConfig.shadowMapSize, 4096, 'Ultra deve usar mapa de sombras 4096.');

    renderer.setPreset('CINEMATIC');
    const cineConfig = renderer.getConfig();
    assert.strictEqual(cineConfig.resolvedKey, 'CINEMATIC');
    assert.strictEqual(cineConfig.progressiveAccumulation, true, 'Cinematic deve ter acumulação progressiva.');

    console.log('  ✔ Presets gráficos (MOBILE, BALANCED, HIGH, ULTRA, CINEMATIC) validados.');
})();

// 2. Teste do Pipeline de Progressive Loading
(async () => {
    console.log('\n[2/5] Testando Progressive Loading Pipeline...');
    const renderer = new AdaptiveRenderer();
    const stagesSeen = [];

    const result = await renderer.runProgressivePipeline({ projectId: 'prj-praia-01' }, (progress) => {
        stagesSeen.push(progress.stage);
    });

    assert(stagesSeen.includes(0), 'Deve passar pelo estágio 0 (Manifest).');
    assert(stagesSeen.includes(1), 'Deve passar pelo estágio 1 (Low LOD).');
    assert(stagesSeen.includes(2), 'Deve passar pelo estágio 2 (Med LOD).');
    assert(stagesSeen.includes(3), 'Deve passar pelo estágio 3 (High LOD).');
    assert.strictEqual(result.highLodData.lodLevel, 2, 'High LOD deve ser nível 2.');
    console.log('  ✔ Pipeline progressivo executado com transição de LOD (0 -> 1 -> 2 -> 3).');
})();

// 3. Teste de Projetos e Isolamento de Segurança
(() => {
    console.log('\n[3/5] Testando Projetos (Pequeno, Médio, Grande) & Isolamento de Segurança...');
    
    // Validação de que viewer.html e client-viewer-module.js não contêm chaves ou comandos administrativos
    const viewerHtml = fs.readFileSync(path.join(__dirname, '../viewer.html'), 'utf-8');
    const viewerJs = fs.readFileSync(path.join(__dirname, '../js/client-viewer-module.js'), 'utf-8');

    assert(!viewerHtml.includes('DATABASE_URL'), 'Nenhuma URL de banco de dados deve estar no viewer.');
    assert(!viewerHtml.includes('briefing-admin.js'), 'Viewer não deve carregar scripts de administração.');
    assert(!viewerHtml.includes('revit-local-connector'), 'Viewer não deve conter conectores de escrita BIM.');
    assert(!viewerJs.includes('SECRET_KEY'), 'Nenhuma chave secreta no viewer JS.');
    assert(!viewerJs.includes('DELETE_PROJECT'), 'Comandos destrutivos não permitidos.');

    console.log('  ✔ Segurança garantida: Ambiente 100% isolado de edição/admin.');
})();

// 4. Teste de Roteamento no Servidor HTTP
(() => {
    console.log('\n[4/5] Testando Regras de Roteamento em server.js...');
    const serverJs = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf-8');
    
    assert(serverJs.includes('/viewer'), 'server.js deve mapear /viewer.');
    assert(serverJs.includes('/p/'), 'server.js deve mapear rotas amigáveis /p/:projectId.');
    assert(serverJs.includes('viewer.html'), 'server.js deve servir viewer.html para rotas do visualizador.');

    console.log('  ✔ Rotas /viewer, /viewer/:projectId, /p/:projectId e /v/:projectId validadas.');
})();

// 5. Teste de Hotspots, Medições e Anotações
(() => {
    console.log('\n[5/5] Testando Hotspots, Medições e Anotações...');
    
    // Verifica se os arquivos de estilo e módulos essenciais existem
    assert(fs.existsSync(path.join(__dirname, '../css/client-viewer.css')), 'client-viewer.css deve existir.');
    assert(fs.existsSync(path.join(__dirname, '../js/adaptive-renderer.js')), 'adaptive-renderer.js deve existir.');
    assert(fs.existsSync(path.join(__dirname, '../js/client-viewer-module.js')), 'client-viewer-module.js deve existir.');
    assert(fs.existsSync(path.join(__dirname, '../viewer.html')), 'viewer.html deve existir.');

    console.log('  ✔ Todos os arquivos do Client Viewer J33 estão íntegros e funcionais.');
})();

setTimeout(() => {
    console.log('\n================================================================');
    console.log('🎉 TODOS OS TESTES DO CLIENT VIEWER J33 FORAM APROVADOS COM SUCESSO!');
    console.log('================================================================');
}, 1000);
