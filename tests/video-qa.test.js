/**
 * tests/video-qa.test.js
 * Teste unitário e de integração para o Módulo de Video QA (Bloco G14).
 * Valida os 13 pontos canônicos, severidades, o exemplo exato do brief
 * ("Cena 04 utiliza mobiliário diferente do render aprovado da Sala.")
 * e o bloqueio de render caso haja status BLOCKED.
 */

// Simular localStorage antes de carregar state.js
const mockStorage = {};
global.localStorage = {
    getItem: (key) => mockStorage[key] || null,
    setItem: (key, val) => { mockStorage[key] = String(val); },
    removeItem: (key) => { delete mockStorage[key]; },
    clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

const StudioState = require('../js/state.js');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✔ [PASS] ${message}`);
        passedTests++;
    } else {
        console.error(`  ✖ [FAIL] ${message}`);
        failedTests++;
    }
}

console.log('================================================================');
console.log('SUÍTE DE TESTES: BLOCO G14 — AUDIOVISUAL QA ENGINE');
console.log('================================================================\n');

try {
    StudioState.init();

    // 1. Verificação dos 13 Pontos Canônicos
    console.log('--- 1. 13 Pontos de Verificação Canônicos ---');
    const checkpoints = StudioState.VIDEO_QA_CHECKPOINTS;
    const requiredCheckpointIds = [
        'continuidade', 'ambiente', 'geometria', 'materiais',
        'mobiliario', 'iluminacao', 'camera', 'duracao',
        'resolucao', 'proporcao', 'cortes', 'transicoes', 'identidade_visual'
    ];
    
    assert(
        requiredCheckpointIds.every(id => checkpoints.some(cp => cp.id === id)),
        'Todos os 13 pontos de verificação canônicos estão definidos e nomeados'
    );
    assert(checkpoints.length === 13, 'Total de checkpoints é estritamente 13');

    // 2. Status Canônicos de QA
    console.log('\n--- 2. Severidades e Status Canônicos ---');
    const statuses = StudioState.VIDEO_QA_STATUS;
    assert(statuses.PASS === 'PASS', 'Status PASS suportado');
    assert(statuses.WARNING === 'WARNING', 'Status WARNING suportado');
    assert(statuses.ERROR === 'ERROR', 'Status ERROR suportado');
    assert(statuses.BLOCKED === 'BLOCKED', 'Status BLOCKED suportado');

    // 3. Execução de QA em Projeto Real (prj-praia-01 / video-praia-01)
    console.log('\n--- 3. Execução de QA em Vídeo Existente ---');
    const videoProject = StudioState.getVideoProject('video-praia-01');
    assert(!!videoProject, 'Projeto de vídeo video-praia-01 localizado no state');

    // Injetar a inconsistência canônica especificada no brief:
    // "Cena 04 utiliza mobiliário diferente do render aprovado da Sala."
    const qaResult = StudioState.runVideoQA('video-praia-01', {
        inconsistencies: [
            {
                checkpointId: 'mobiliario',
                status: StudioState.VIDEO_QA_STATUS.ERROR,
                sceneId: 'sc-praia-04',
                sceneNumber: 4,
                sceneTitle: 'Sala de Estar & Jantar Integrada',
                problem: 'Cena 04 utiliza mobiliário diferente do render aprovado da Sala.',
                evidence: 'Poltrona e mesa de centro no quadro divergem da especificação BIM e render RND-001.',
                recommendation: 'Substituir asset da cena 04 pelo render aprovado RND-001 ou re-renderizar.'
            }
        ]
    });

    assert(qaResult.overallStatus === StudioState.VIDEO_QA_STATUS.ERROR || qaResult.overallStatus === StudioState.VIDEO_QA_STATUS.BLOCKED, 
        'QA detectou severidade com base nas findings');
    assert(qaResult.findings.length >= 1, 'Inconsistência cadastrada nas findings');

    // Validar estrutura exata exigida: PROBLEMA, CENA, EVIDÊNCIA, RECOMENDAÇÃO
    const finding = qaResult.findings.find(f => f.checkpointId === 'mobiliario');
    assert(finding.problem === 'Cena 04 utiliza mobiliário diferente do render aprovado da Sala.',
        'PROBLEMA canônico gravado com precisão');
    assert(finding.sceneNumber === 4, 'CENA canônica associada com precisão (Cena 04)');
    assert(finding.evidence && finding.evidence.length > 0, 'EVIDÊNCIA detalhada presente');
    assert(finding.recommendation && finding.recommendation.length > 0, 'RECOMENDAÇÃO orientativa presente');
    assert(finding.isResolved === false, 'Finding inicia como não resolvida');
    assert(qaResult.projectModifiedByAI === false, 'Salvaguarda: Projeto NÃO foi alterado automaticamente pela IA');

    // 4. Ações de Resolução: manual_fix, regenerate_asset, replace_scene
    console.log('\n--- 4. Resolução Interativa de Inconsistências ---');
    const actions = StudioState.VIDEO_QA_RESOLUTION_ACTIONS;
    assert(actions.MANUAL_FIX === 'manual_fix', 'Ação manual_fix disponível');
    assert(actions.REGENERATE_ASSET === 'regenerate_asset', 'Ação regenerate_asset disponível');
    assert(actions.REPLACE_SCENE === 'replace_scene', 'Ação replace_scene disponível');

    const resolveResult = StudioState.resolveVideoQAFinding(
        qaResult.id,
        finding.id,
        {
            actionType: actions.REPLACE_SCENE,
            notes: 'Cena atualizada com render oficial RND-PRAIA-SALA.'
        },
        'Pedro Albuquerque'
    );

    assert(resolveResult.success === true, 'Inconsistência resolvida com sucesso');
    const updatedFinding = resolveResult.qaResult.findings.find(f => f.id === finding.id);
    assert(updatedFinding.isResolved === true, 'Finding marcada como resolvida');
    assert(updatedFinding.resolution.actionType === 'replace_scene', 'Ação registrada com rastreabilidade');

    // 5. Bloqueio de Render com Status BLOCKED
    console.log('\n--- 5. Proteção de Render e Bloqueio ---');
    const blockedQA = StudioState.runVideoQA('video-praia-01', {
        inconsistencies: [
            {
                checkpointId: 'geometria',
                status: StudioState.VIDEO_QA_STATUS.BLOCKED,
                sceneId: 'sc-praia-02',
                sceneNumber: 2,
                problem: 'Distorção de perspectiva severa detectada na volumetria da fachada.',
                evidence: 'Focal length simulado em 14mm gerou aberração anamórfica na empena principal.',
                recommendation: 'Corrigir câmera para distância focal entre 24mm e 35mm.'
            }
        ]
    });

    assert(blockedQA.overallStatus === StudioState.VIDEO_QA_STATUS.BLOCKED, 'QA result gravado com status BLOCKED');

    let renderAttemptFailed = false;
    try {
        StudioState.createVideoRenderJob({
            videoProjectId: 'video-praia-01',
            format: '16:9',
            resolution: '1080p',
            fps: 30
        });
    } catch (e) {
        renderAttemptFailed = true;
        assert(e.message.includes('Exportação bloqueada') || e.message.includes('BLOCKED'), 'createVideoRenderJob impediu render devido a status BLOCKED');
    }
    assert(renderAttemptFailed === true, 'Render queue rejeitou criação de job bloqueado por QA');

    // 6. Geração de Relatório de QA
    console.log('\n--- 6. Relatório Formal de QA ---');
    const report = StudioState.generateVideoQAReport(blockedQA.id);
    assert(report.markdown.includes('RELATÓRIO DE CONTROLE DE QUALIDADE AUDIOVISUAL'), 'Relatório gerado com cabeçalho oficial');
    assert(report.markdown.includes('Residência de Praia'), 'Relatório cita o projeto real');
    assert(report.markdown.includes('Distorção de perspectiva'), 'Relatório detalha o problema');
    assert(report.isExportAllowed === false, 'isExportAllowed reflete bloqueio');

} catch (err) {
    console.error('Erro na execução dos testes:', err);
    failedTests++;
}

console.log('\n================================================================');
console.log(`TOTAL DE TESTES: ${passedTests + failedTests}`);
console.log(`PASSOU:         ${passedTests}`);
console.log(`FALHOU:         ${failedTests}`);
console.log('================================================================');

if (failedTests === 0) {
    console.log('✔ TODOS OS TESTES DE VIDEO QA PASSARAM COM SUCESSO!\n');
    process.exit(0);
} else {
    console.error('✖ HOUVE FALHAS NOS TESTES DE VIDEO QA.\n');
    process.exit(1);
}
