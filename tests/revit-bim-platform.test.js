/**
 * tests/revit-bim-platform.test.js
 * Suíte de Testes Automatizados para a Plataforma Revit BIM Core (Bloco J: J16 → J20)
 * 
 * Cobre:
 * - J16: Auditoria de Integração e Documentação de Arquitetura
 * - J17: Conector Local, Handshake e Envelopes de Segurança (sem C# arbitrário)
 * - J18: Read Engine, Quantitativos, Saúde do Modelo e Normalização ArqVerticeBimElement
 * - J19: Write Engine, ChangeSet, Operações em Lote e Gate de Exclusão (High Risk)
 * - J20: Modelo Semântico Ontológico e Consultas Determinísticas (IA + Revit sem LLM)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const RevitLocalConnector = require('../js/revit-local-connector.js');
const RevitReadEngine = require('../js/revit-read-engine.js');
const RevitWriteEngine = require('../js/revit-write-engine.js');
const RevitSemanticModel = require('../js/revit-semantic-model.js');

console.log('================================================================');
console.log('🏗️  TESTES DA PLATAFORMA REVIT BIM CORE (BLOCO J: J16 → J20)');
console.log('================================================================');

let passedTests = 0;
function test(name, fn) {
    try {
        fn();
        console.log(`  ✔ [PASS] ${name}`);
        passedTests++;
    } catch (err) {
        console.error(`  ✖ [FAIL] ${name}`);
        console.error(err);
        process.exit(1);
    }
}

async function testAsync(name, fn) {
    try {
        await fn();
        console.log(`  ✔ [PASS] ${name}`);
        passedTests++;
    } catch (err) {
        console.error(`  ✖ [FAIL] ${name}`);
        console.error(err);
        process.exit(1);
    }
}

(async () => {
    // -------------------------------------------------------------------------
    // 1. J16 — Auditoria da Integração BIM & Documentação
    // -------------------------------------------------------------------------
    console.log('\n--- 1. J16: Auditoria de Arquitetura e Matriz de Versões ---');

    test('J16.1: Documentos arquiteturais obrigatórios devem existir', () => {
        const archPath = path.join(__dirname, '..', 'docs', 'bim', 'revit-architecture.md');
        const matrixPath = path.join(__dirname, '..', 'docs', 'bim', 'revit-version-matrix.md');
        const mapPath = path.join(__dirname, '..', 'docs', 'bim', 'revit-integration-map.md');

        assert.ok(fs.existsSync(archPath), 'revit-architecture.md deve existir');
        assert.ok(fs.existsSync(matrixPath), 'revit-version-matrix.md deve existir');
        assert.ok(fs.existsSync(mapPath), 'revit-integration-map.md deve existir');

        const matrixContent = fs.readFileSync(matrixPath, 'utf8');
        assert.ok(matrixContent.includes('Revit 2023'));
        assert.ok(matrixContent.includes('Revit 2025'));
        assert.ok(matrixContent.includes('.NET 8.0'));
    });

    test('J16.2: Addin e projeto C# devem estar devidamente estruturados', () => {
        const addinManifest = path.join(__dirname, '..', 'revit-addon', 'ArqVertice.addin');
        const csprojFile = path.join(__dirname, '..', 'revit-addon', 'ArqVerticeRevitConnector.csproj');
        const appCs = path.join(__dirname, '..', 'revit-addon', 'src', 'App.cs');

        assert.ok(fs.existsSync(addinManifest), 'ArqVertice.addin deve existir');
        assert.ok(fs.existsSync(csprojFile), 'ArqVerticeRevitConnector.csproj deve existir');
        assert.ok(fs.existsSync(appCs), 'App.cs deve existir');
    });

    // -------------------------------------------------------------------------
    // 2. J17 — Revit Local Connector & Handshake Seguro
    // -------------------------------------------------------------------------
    console.log('\n--- 2. J17: Conector Local, Handshake e Envelopes de Segurança ---');
    const connector = new RevitLocalConnector({ useVirtualDriver: true });

    await testAsync('J17.1: Conector deve realizar handshake e detectar estado do Revit sem modificar modelo', async () => {
        const connRes = await connector.connect();
        assert.strictEqual(connRes.success, true);
        assert.strictEqual(connector.state.connected, true);
        assert.strictEqual(connector.state.revitRunning, true);
        assert.strictEqual(connector.state.documentActive, true);
        assert.ok(connector.state.documentTitle.includes('.rvt'));
        assert.ok(connector.state.revitVersion !== null);
        assert.ok(connector.state.user !== null);
        assert.ok(connector.state.currentView !== null);
        assert.ok(Array.isArray(connector.state.currentSelection));
    });

    await testAsync('J17.2: Conector deve rejeitar operações fora da lista branca (bloqueio de C# arbitrário)', async () => {
        await assert.rejects(async () => {
            await connector.sendCommand({ operation: 'EXECUTE_ARBITRARY_CSHARP', input: { code: 'File.Delete("...")' } });
        }, /Operação não permitida ou inválida/);
    });

    await testAsync('J17.3: Conector deve validar envelopes em modo WRITE exigindo aprovação prévia', async () => {
        const res = await connector.sendCommand({
            operation: 'EXECUTE_TRANSACTION',
            mode: 'write',
            userApproved: false
        });
        assert.strictEqual(res.status, 'REQUIRES_USER_APPROVAL');
    });

    // -------------------------------------------------------------------------
    // 3. J18 — Revit Read Engine & Normalização Canônica
    // -------------------------------------------------------------------------
    console.log('\n--- 3. J18: Revit Read Engine e Normalização Canônica ---');
    const readEngine = new RevitReadEngine(connector);

    await testAsync('J18.1: getProjectInfo deve retornar metadados do projeto e contagem de níveis', async () => {
        const info = await readEngine.getProjectInfo();
        assert.strictEqual(info.projectName, 'Residência Alphaville Eusébio');
        assert.strictEqual(info.projectNumber, 'ARQ-2026-08');
        assert.strictEqual(info.levelsCount, 3);
    });

    await testAsync('J18.2: queryElements deve normalizar para o schema ArqVerticeBimElement', async () => {
        const elements = await readEngine.queryElements({ category: 'Walls' });
        assert.ok(elements.length > 0);
        const el = elements[0];
        assert.ok(el instanceof RevitReadEngine.ArqVerticeBimElement);
        assert.ok(el.id !== undefined);
        assert.ok(el.category === 'Walls');
        assert.ok(el.quantities.areaM2 > 0);
    });

    await testAsync('J18.3: getQuantities deve extrair áreas e volumes calculados', async () => {
        const qties = await readEngine.getQuantities('Walls');
        assert.strictEqual(qties.category, 'Walls');
        assert.ok(qties.totalAreaM2 > 0);
        assert.ok(qties.totalVolumeM3 > 0);
    });

    await testAsync('J18.4: auditModelHealth deve inspecionar avisos e referências não resolvidas', async () => {
        const health = await readEngine.auditModelHealth();
        assert.strictEqual(typeof health.healthy, 'boolean');
        assert.strictEqual(health.totalWarnings, 4);
        assert.strictEqual(health.missingReferences, 0);
    });

    // -------------------------------------------------------------------------
    // 4. J19 — Revit Write Engine, ChangeSet & Travas de Segurança
    // -------------------------------------------------------------------------
    console.log('\n--- 4. J19: Revit Write Engine, ChangeSet e Operações em Lote ---');
    const writeEngine = new RevitWriteEngine(connector);

    test('J19.1: planBatchTypeChange deve produzir proposta sem editar imediatamente', () => {
        const mockWindows = [
            { id: 101, type: 'Janela 2 Folhas 1.20m' },
            { id: 102, type: 'Janela 2 Folhas 1.20m' },
            { id: 103, type: 'Janela 2 Folhas 1.20m' }
        ];

        const plan = writeEngine.planBatchTypeChange(mockWindows, 'Janela Alumínio Preto 1.50m');
        assert.strictEqual(plan.stage, 'PREVIEW');
        assert.strictEqual(plan.elementsFound, 3);
        assert.strictEqual(plan.proposedChangesCount, 3);
        assert.strictEqual(plan.requiresUserApproval, true);
        assert.strictEqual(plan.changeSet.modified.length, 3);
    });

    test('J19.2: planDelete deve classificar exclusão como HIGH RISK', () => {
        const plan = writeEngine.planDelete(20412, 'Exclusão solicitada');
        assert.strictEqual(plan.stage, 'PREVIEW');
        assert.strictEqual(plan.highRisk, true);
        assert.ok(plan.warning.includes('ALTO RISCO'));
    });

    await testAsync('J19.3: commitChangeSet de alto risco sem aprovação deve ser bloqueado', async () => {
        const plan = writeEngine.planDelete(20412);
        const result = await writeEngine.commitChangeSet(plan.changeSet, null); // Sem token de aprovação
        assert.strictEqual(result.success, false);
        assert.ok(result.error.includes('Token de aprovação humana ausente'));
    });

    await testAsync('J19.4: commitChangeSet com aprovação humana deve transacionar com sucesso', async () => {
        const plan = writeEngine.planParameterUpdate(20412, 'Comments', 'Aprovado para Obra', 'Rascunho');
        const result = await writeEngine.commitChangeSet(plan.changeSet, 'USR_AUTH_TOKEN_99');
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.stage, 'COMMITTED');
        assert.strictEqual(writeEngine.changeHistory.length, 1);
    });

    // -------------------------------------------------------------------------
    // 5. J20 — Revit Semantic Model & Consultas Determinísticas
    // -------------------------------------------------------------------------
    console.log('\n--- 5. J20: Modelo Semântico Ontológico e Consultas Determinísticas ---');
    const semanticModel = new RevitSemanticModel();

    test('J20.1: Modelo deve mapear os 17 tipos canônicos e indexar entidades', () => {
        assert.strictEqual(Object.keys(RevitSemanticModel.REVIT_NODE_TYPES).length, 17);
        assert.strictEqual(Object.keys(RevitSemanticModel.REVIT_RELATIONS).length, 10);
        assert.ok(semanticModel.elementsMap.size > 0);
    });

    test('J20.2: Consulta "Quais portas existem neste ambiente?" responde deterministicamente sem LLM', () => {
        const res = semanticModel.answerDeterministicQuery('Quais portas existem no Living Integrado?');
        assert.strictEqual(res.resolvedWithoutLLM, true);
        assert.strictEqual(res.room, 'Living Integrado');
        assert.strictEqual(res.count, 1);
        assert.ok(res.answer.includes('Porta Pivotante Entrada Social'));
    });

    test('J20.3: Consulta "Quais paredes possuem determinado material?" responde deterministicamente', () => {
        const res = semanticModel.answerDeterministicQuery('Quais paredes possuem material Concreto Aparente?');
        assert.strictEqual(res.resolvedWithoutLLM, true);
        assert.strictEqual(res.material, 'Concreto Aparente');
        assert.strictEqual(res.count, 1);
        assert.ok(res.answer.includes('Parede Fachada Norte'));
    });

    test('J20.4: Consulta "Quais elementos estão no pavimento térreo?" responde deterministicamente', () => {
        const res = semanticModel.answerDeterministicQuery('Quais elementos estão no pavimento térreo?');
        assert.strictEqual(res.resolvedWithoutLLM, true);
        assert.strictEqual(res.level, 'Pavimento Térreo');
        assert.ok(res.count >= 4);
    });

    test('J20.5: Consulta "Quais janelas pertencem à fachada norte?" responde deterministicamente', () => {
        const res = semanticModel.answerDeterministicQuery('Quais janelas pertencem à fachada norte?');
        assert.strictEqual(res.resolvedWithoutLLM, true);
        assert.strictEqual(res.facade, 'Norte');
        assert.strictEqual(res.count, 1);
        assert.ok(res.answer.includes('Janela Fachada Norte - Living'));
    });

    test('J20.6: Consulta "Quais famílias estão sendo utilizadas?" responde deterministicamente', () => {
        const res = semanticModel.answerDeterministicQuery('Quais famílias estão sendo utilizadas no projeto?');
        assert.strictEqual(res.resolvedWithoutLLM, true);
        assert.ok(res.count >= 4);
        assert.ok(res.answer.includes('Parede Básica'));
    });

    console.log('\n================================================================');
    console.log(`🎉 TODOS OS ${passedTests} TESTES DO REVIT BIM PLATFORM PASSARAM COM SUCESSO!`);
    console.log('================================================================\n');
})();
