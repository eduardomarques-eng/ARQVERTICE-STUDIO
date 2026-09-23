/**
 * ============================================================================
 * ARQVERTICE STUDIO — VIDEO ENGINE: TIPOS E CONTRATOS CANÔNICOS
 * ============================================================================
 * Definições e contratos de dados para composições React + Remotion.
 * Separação estrita: DADOS -> COMPOSIÇÃO -> RENDER.
 * ============================================================================
 */

(function (global) {
  'use strict';

  // 10 Formatos Canônicos do ArqVertice Studio (Família de Composições)
  const ARCHITECTURAL_VIDEO_TEMPLATES = {
    ARCHITECTURAL_CINEMATIC: {
      id: 'ARCHITECTURAL_CINEMATIC',
      name: 'Apresentação Cinematográfica do Projeto',
      description: 'Introdução imersiva, identidade do projeto, conceito espacial, imagens principais e encerramento institucional.',
      defaultDurationSeconds: 45,
      aspectRatios: ['16:9', '9:16'],
      sceneSequence: ['INTRO', 'REVEAL', 'CONCEPT', 'MAIN_ENVIRONMENTS', 'DETAILS', 'OUTRO']
    },
    ARCHITECTURAL_WALKTHROUGH: {
      id: 'ARCHITECTURAL_WALKTHROUGH',
      name: 'Walkthrough Arquitetônico',
      description: 'Percurso contínuo guiado: entrada, circulação, áreas sociais, suítes e área de lazer externa.',
      defaultDurationSeconds: 60,
      aspectRatios: ['16:9', '9:16'],
      sceneSequence: ['INTRO', 'ENTRANCE', 'CIRCULATION', 'ENVIRONMENTS', 'OUTDOOR', 'OUTRO']
    },
    INTERIOR_PRESENTATION: {
      id: 'INTERIOR_PRESENTATION',
      name: 'Apresentação de Interiores',
      description: 'Foco no ambiente interno: composição espacial, mobiliário homologado, iluminação e texturas.',
      defaultDurationSeconds: 30,
      aspectRatios: ['16:9', '9:16', '1:1', '4:5'],
      sceneSequence: ['INTRO', 'GENERAL_VIEW', 'FURNITURE', 'LIGHTING', 'MATERIALS', 'OUTRO']
    },
    FACADE_PRESENTATION: {
      id: 'FACADE_PRESENTATION',
      name: 'Fachada / Volumetria',
      description: 'Implantação no terreno, volumetria arquitetônica, iluminação solar, materiais de fachada e enquadramento final.',
      defaultDurationSeconds: 30,
      aspectRatios: ['16:9', '9:16', '1:1'],
      sceneSequence: ['INTRO', 'SITE_PLAN', 'MASSING', 'FACADE_DAY', 'DETAILS', 'OUTRO']
    },
    PLAN_TO_RENDER: {
      id: 'PLAN_TO_RENDER',
      name: 'Planta → 3D → Resultado',
      description: 'Transição suave da planta humanizada/Revit destacando o cômodo até a perspectiva tridimensional renderizada.',
      defaultDurationSeconds: 25,
      aspectRatios: ['16:9', '9:16', '1:1'],
      sceneSequence: ['INTRO', 'PLAN_VIEW', 'ZONE_HIGHLIGHT', '3D_TRANSITION', 'FINAL_RENDER', 'OUTRO']
    },
    MATERIALITY_PRESENTATION: {
      id: 'MATERIALITY_PRESENTATION',
      name: 'Materialidade & Texturas',
      description: 'Enquadramentos macro destacando madeiras, pedras naturais, mármores, tecidos e revestimentos homologados.',
      defaultDurationSeconds: 25,
      aspectRatios: ['16:9', '9:16', '1:1', '4:5'],
      sceneSequence: ['INTRO', 'GENERAL_VIEW', 'MACRO_TEXTURE', 'MATERIAL_SPECS', 'COMPOSITION', 'OUTRO']
    },
    DAY_NIGHT: {
      id: 'DAY_NIGHT',
      name: 'Diurno → Noturno',
      description: 'Mesmo enquadramento de perspectiva com transição gradual de luz natural diurna para iluminação cênica noturna.',
      defaultDurationSeconds: 20,
      aspectRatios: ['16:9', '9:16', '1:1'],
      sceneSequence: ['INTRO', 'DAYLIGHT_VIEW', 'GOLDEN_HOUR', 'NIGHT_REVEAL', 'LIGHTING_SPECS', 'OUTRO']
    },
    BEFORE_AFTER: {
      id: 'BEFORE_AFTER',
      name: 'Antes → Proposta',
      description: 'Comparativo arquitetônico de reforma ou terreno original contra a proposta de intervenção projetada.',
      defaultDurationSeconds: 25,
      aspectRatios: ['16:9', '9:16', '1:1'],
      sceneSequence: ['INTRO', 'EXISTING_SURVEY', 'INTERVENTION_SPLIT', 'PROPOSED_RENDER', 'BENEFITS', 'OUTRO']
    },
    ARCHITECTURAL_DETAIL: {
      id: 'ARCHITECTURAL_DETAIL',
      name: 'Detalhe Arquitetônico & Construtivo',
      description: 'Aproximação em elementos construtivos específicos, marcenaria sob medida, iluminação indireta e acabamento.',
      defaultDurationSeconds: 20,
      aspectRatios: ['16:9', '9:16', '1:1', '4:5'],
      sceneSequence: ['INTRO', 'CONTEXT', 'ZOOM_DETAIL', 'SPECIFICATIONS', 'OUTRO']
    },
    PROJECT_COMMERCIAL: {
      id: 'PROJECT_COMMERCIAL',
      name: 'Apresentação Comercial & Lançamento',
      description: 'Vídeo dinâmico de alto impacto para clientes e investidores com destaques de valorização, localização e contato.',
      defaultDurationSeconds: 45,
      aspectRatios: ['16:9', '9:16', '4:5'],
      sceneSequence: ['TEASER', 'LOCATION_HIGHLIGHT', 'HIGHLIGHTS', 'ARCHITECTURE', 'GALLERY', 'CALL_TO_ACTION']
    }
  };

  // Movimentos de Câmera Arquitetônica Permitidos
  const CAMERA_MOTIONS = {
    PUSH_IN: { id: 'push_in', name: 'Push-in Lento', scaleStart: 1.0, scaleEnd: 1.07 },
    PULL_OUT: { id: 'pull_out', name: 'Pull-out Suave', scaleStart: 1.07, scaleEnd: 1.0 },
    PAN_LEFT: { id: 'pan_left', name: 'Pan Horizontal Esquerda', translateXStart: 25, translateXEnd: -25 },
    PAN_RIGHT: { id: 'pan_right', name: 'Pan Horizontal Direita', translateXStart: -25, translateXEnd: 25 },
    TILT_UP: { id: 'tilt_up', name: 'Tilt Vertical Cima', translateYStart: 20, translateYEnd: -20 },
    PARALLAX_SUBTLE: { id: 'parallax_subtle', name: 'Parallax Arquitetônico', foregroundFactor: 1.2, backgroundFactor: 0.8 },
    STATIC_STEADY: { id: 'static_steady', name: 'Câmera Estática', scaleStart: 1.0, scaleEnd: 1.0 }
  };

  // Safe Areas e Diretrizes Gráficas
  const SAFE_AREA_CONFIG = {
    horizontal: { topPercent: 8, bottomPercent: 8, leftPercent: 8, rightPercent: 8 },
    vertical: { topPercent: 12, bottomPercent: 15, leftPercent: 7, rightPercent: 7 }
  };

  const VideoEngineContracts = {
    ARCHITECTURAL_VIDEO_TEMPLATES,
    CAMERA_MOTIONS,
    SAFE_AREA_CONFIG
  };

  if (typeof window !== 'undefined') {
    window.VideoEngineContracts = VideoEngineContracts;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = VideoEngineContracts;
  }
})(typeof window !== 'undefined' ? window : global);
