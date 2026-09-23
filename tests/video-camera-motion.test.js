/**
 * ============================================================================
 * ARQVERTICE STUDIO — SUÍTE DE TESTES: BLOCO G08 — CÂMERA E MOVIMENTO
 * ============================================================================
 * Validação rigorosa dos requisitos de G08:
 * 1. Os 12 tipos de movimento canônicos
 * 2. Parametrização cinética (direção, velocidade, intensidade, duração, início, fim)
 * 3. Parametrização de câmera (enquadramento, distância, altura, lente conceitual, direção, ponto de interesse)
 * 4. Salvaguarda contra distorção automática em ambientes vulneráveis
 * 5. Proteção absoluta de câmeras bloqueadas (não alterar)
 * 6. Criação e atualização de CameraMotionProfile
 * 7. Sistema de Presets (nativos e criação de novos presets customizados)
 * 8. Aplicação de Preset a um perfil existente
 * 9. Renderização da Interface VideoCameraMotionModule
 * ============================================================================
 */

global.window = {
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
  }
};
global.localStorage = global.window.localStorage;
global.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => []
};

const assert = require('assert');
const StudioState = require('../js/state.js');
const VideoCameraMotionModule = require('../js/video-camera-motion-module.js');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✔ [PASS] ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(err);
  }
}

console.log('================================================================');
console.log('SUÍTE DE TESTES: BLOCO G08 — CÂMERA E MOVIMENTO DO VÍDEO');
console.log('================================================================\n');

StudioState.init();

// 1. Os 12 Tipos Canônicos de Movimento
runTest('Deve catalogar exatamente os 12 tipos canônicos de movimento com classificação de risco', () => {
  const types = StudioState.CAMERA_MOTION_TYPES;
  assert.strictEqual(types.length, 12, 'Deve conter exatamente 12 tipos de movimento');

  const expectedIds = [
    'push in',
    'pull out',
    'pan',
    'tilt',
    'orbit',
    'dolly',
    'tracking',
    'reveal',
    'parallax',
    'static',
    'handheld controlado',
    'cinematic slow movement'
  ];

  expectedIds.forEach(id => {
    const found = types.find(t => t.id === id);
    assert.ok(found, `Tipo de movimento "${id}" deve existir no catálogo`);
    assert.ok(found.name, `Tipo "${id}" deve ter nome legível`);
    assert.ok(found.distortionRisk, `Tipo "${id}" deve declarar nível de risco de distorção`);
  });
});

// 2. Criação de CameraMotionProfile com Configurações e Câmera
runTest('Deve criar CameraMotionProfile com todos os parâmetros cinéticos e ópticos', () => {
  const video = StudioState.createVideoProject({
    projectId: 'prj-praia-01',
    title: 'Vídeo Camera Profile Test'
  });

  const profile = StudioState.createCameraMotionProfile({
    videoProjectId: video.id,
    name: 'Tomada Living Gourmet',
    motionType: 'dolly',
    settings: {
      direção: 'forward',
      velocidade: 'slow',
      intensidade: 4,
      duração: 5.5,
      início: '0%',
      fim: '100%'
    },
    cameraConfig: {
      enquadramento: 'Wide Shot (Plano Geral do Cômodo)',
      distância: '4.5m',
      altura: '1.50m (olho humano)',
      lenteConceitual: '35mm Visão Natural / Documental',
      direção: 'frontal',
      pontoDeInteresse: 'Bancada em Travertino Navona'
    }
  });

  assert.ok(profile.id, 'Perfil deve ter id');
  assert.strictEqual(profile.videoProjectId, video.id);
  assert.strictEqual(profile.motionType, 'dolly');
  assert.strictEqual(profile.settings.direção, 'forward');
  assert.strictEqual(profile.settings.velocidade, 'slow');
  assert.strictEqual(profile.settings.intensidade, 4);
  assert.strictEqual(profile.settings.duração, 5.5);
  assert.strictEqual(profile.settings.início, '0%');
  assert.strictEqual(profile.settings.fim, '100%');

  assert.strictEqual(profile.cameraConfig.enquadramento, 'Wide Shot (Plano Geral do Cômodo)');
  assert.strictEqual(profile.cameraConfig.distância, '4.5m');
  assert.strictEqual(profile.cameraConfig.altura, '1.50m (olho humano)');
  assert.strictEqual(profile.cameraConfig.lenteConceitual, '35mm Visão Natural / Documental');
  assert.strictEqual(profile.cameraConfig.direção, 'frontal');
  assert.strictEqual(profile.cameraConfig.pontoDeInteresse, 'Bancada em Travertino Navona');
});

// 3. Edição de Perfil de Movimento
runTest('Deve permitir atualizar configurações cinéticas de um perfil livre de bloqueio', () => {
  const video = StudioState.createVideoProject({
    projectId: 'prj-praia-01',
    title: 'Vídeo Edit Profile Test'
  });

  const profile = StudioState.createCameraMotionProfile({
    videoProjectId: video.id,
    motionType: 'pan'
  });

  const updated = StudioState.updateCameraMotionProfile(profile.id, {
    motionType: 'cinematic slow movement',
    settings: {
      velocidade: 'slow',
      intensidade: 2,
      duração: 8.0
    }
  });

  assert.strictEqual(updated.motionType, 'cinematic slow movement');
  assert.strictEqual(updated.settings.velocidade, 'slow');
  assert.strictEqual(updated.settings.intensidade, 2);
  assert.strictEqual(updated.settings.duração, 8.0);
  assert.strictEqual(updated.distortionRisk, 'none');
});

// 4. Salvaguarda contra Distorção Espacial
runTest('Salvaguarda: Não utilizar movimento automaticamente quando ele puder distorcer o ambiente', () => {
  const video = StudioState.createVideoProject({
    projectId: 'prj-praia-01',
    title: 'Vídeo Distortion Test'
  });

  // Em ambiente estreito/compacto (<12m²), tentativa de aplicar 'orbit' de alto risco automaticamente
  const autoProfile = StudioState.createCameraMotionProfile({
    videoProjectId: video.id,
    motionType: 'orbit',
    isAutomatic: true,
    environmentArea: 8.0 // Lavabo / Corredor estreito
  });

  // Motor deve aplicar fallback seguro para 'cinematic slow movement' evitando distorção de paredes
  assert.strictEqual(
    autoProfile.motionType,
    'cinematic slow movement',
    'Criação automática em espaço compacto deve substituir orbit por movimento cinemático sem distorção'
  );

  const safety = StudioState.validateCameraMotionSafety('orbit', { area: 8.0 });
  assert.strictEqual(safety.isSafe, false, 'Orbit em área compacta deve ser classificado como inseguro');
  assert.ok(safety.recommendation.includes('risco'), 'Deve emitir recomendação clara de salvaguarda');
});

// 5. Proteção de Câmera Bloqueada
runTest('Regra de Ouro: Se a câmera original de um render estiver bloqueada, NÃO alterá-la', () => {
  const video = StudioState.createVideoProject({
    projectId: 'prj-praia-01',
    title: 'Vídeo Camera Lock Test'
  });

  // Cria perfil com câmera original bloqueada
  const lockedProfile = StudioState.createCameraMotionProfile({
    videoProjectId: video.id,
    name: 'Tomada Fixa Homologada',
    motionType: 'static',
    isLocked: true,
    cameraConfig: {
      enquadramento: 'Eye-level (Nível do Olho Humano - 1.50m)',
      lenteConceitual: '50mm Olho Humano Estrito',
      altura: '1.50m'
    }
  });

  // Tentativa de alterar parâmetros ópticos da câmera bloqueada deve ser rejeitada categoricamente
  assert.throws(() => {
    StudioState.updateCameraMotionProfile(lockedProfile.id, {
      cameraConfig: {
        enquadramento: 'Close-up (Detalhe de Material)',
        altura: '0.80m'
      }
    });
  }, /bloqueada/i, 'Deve lançar erro impedindo alteração de câmera bloqueada');

  // Verifica que os parâmetros originais permanecem 100% preservados
  const preserved = StudioState.getCameraMotionProfile(lockedProfile.id);
  assert.strictEqual(preserved.cameraConfig.enquadramento, 'Eye-level (Nível do Olho Humano - 1.50m)');
  assert.strictEqual(preserved.cameraConfig.altura, '1.50m');
});

// 6. Biblioteca de Presets e Salvar Novos Presets
runTest('Deve disponibilizar presets nativos e permitir salvar novos presets personalizados', () => {
  const initialPresets = StudioState.getCameraMotionPresets();
  assert.ok(initialPresets.length >= 5, 'Deve conter pelo menos 5 presets nativos pré-configurados');

  const slowPreset = initialPresets.find(p => p.id === 'preset-imersao-lenta');
  assert.ok(slowPreset, 'Deve conter preset Imersão Espacial Lenta');
  assert.strictEqual(slowPreset.motionType, 'cinematic slow movement');

  const staticPreset = initialPresets.find(p => p.id === 'preset-contemplacao-estatica');
  assert.ok(staticPreset, 'Deve conter preset Contemplação Estática');
  assert.strictEqual(staticPreset.motionType, 'static');

  // Salva um novo preset personalizado
  const customPreset = StudioState.saveCameraMotionPreset({
    name: 'Avanço Diagonal 45° Piscina',
    motionType: 'push in',
    settings: {
      direção: 'diagonal',
      velocidade: 'slow',
      intensidade: 3,
      duração: 5.0
    },
    cameraConfig: {
      enquadramento: 'Wide Shot (Plano Geral do Cômodo)',
      lenteConceitual: '24mm Grande Angular Arquitetônica'
    }
  }, 'Avanço Diagonal 45° Piscina', 'Área Externa', 'Arquiteto Líder');

  assert.ok(customPreset.id, 'Novo preset deve ter id gerado');
  assert.strictEqual(customPreset.name, 'Avanço Diagonal 45° Piscina');
  assert.strictEqual(customPreset.category, 'Área Externa');

  // Garante que o preset foi incluído na lista geral
  const updatedPresets = StudioState.getCameraMotionPresets();
  assert.ok(updatedPresets.some(p => p.id === customPreset.id), 'Novo preset deve estar listado');
});

// 7. Aplicação de Preset a um Perfil
runTest('applyCameraMotionPreset deve carregar configurações cinéticas e ópticas do preset no perfil', () => {
  const video = StudioState.createVideoProject({
    projectId: 'prj-praia-01',
    title: 'Vídeo Apply Preset Test'
  });

  const profile = StudioState.createCameraMotionProfile({
    videoProjectId: video.id,
    motionType: 'pan'
  });

  StudioState.applyCameraMotionPreset(profile.id, 'preset-imersao-lenta');

  const afterApply = StudioState.getCameraMotionProfile(profile.id);
  assert.strictEqual(afterApply.motionType, 'cinematic slow movement');
  assert.strictEqual(afterApply.settings.velocidade, 'slow');
  assert.strictEqual(afterApply.cameraConfig.enquadramento, 'Wide Shot (Plano Geral do Cômodo)');
});

// 8. Renderização da Interface
runTest('VideoCameraMotionModule deve renderizar interface com 12 tipos, parâmetros cinéticos e presets', () => {
  const video = StudioState.createVideoProject({
    projectId: 'prj-praia-01',
    title: 'Vídeo UI Test G08'
  });

  const html = VideoCameraMotionModule.render(video.id);

  assert.ok(html.includes('Câmera e Cinética Espacial do Vídeo'), 'Deve conter título principal');
  assert.ok(html.includes('12 Tipos de Movimento'), 'Deve exibir catálogo dos 12 tipos');
  assert.ok(html.includes('Push In'), 'Deve conter opção Push In');
  assert.ok(html.includes('Cinematic Slow Movement'), 'Deve conter Cinematic Slow Movement');
  assert.ok(html.includes('Configurações Cinéticas de Movimento'), 'Deve conter seção de configurações cinéticas');
  assert.ok(html.includes('Parâmetros Ópticos e Enquadramento da Câmera'), 'Deve conter seção de câmera');
  assert.ok(html.includes('Carregar Preset'), 'Deve conter botão de carregar preset');
  assert.ok(html.includes('Salvar como Preset'), 'Deve conter botão de salvar preset');
  assert.ok(html.includes('G08 — Definição de Câmera e Movimento'), 'Deve identificar Bloco G08');
});

console.log('\n================================================================');
console.log('RESULTADO DOS TESTES G08:');
console.log(`  Sucessos: ${passedTests}`);
console.log(`  Falhas:   ${failedTests}`);
console.log('================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('Todos os testes do Bloco G08 passaram com 100% de conformidade!\n');
}
