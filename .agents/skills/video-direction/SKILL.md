---
name: video-direction
description: Direção cinematográfica, roteirização audiovisual, prompts de movimento de câmera e storyboards arquitetônicos.
---

# Video Direction Skill

## Name
`video-direction`

## Purpose
Traduzir o projeto arquitetônico em uma experiência em movimento, especificando roteiro, enquadramentos de lente (24mm, 35mm, 50mm), iluminação solar (Golden Hour, Meio-Dia, Noturna) e movimentos de câmera (Dolly-in, Pan suave, Orbit) para o Remotion ou geradores de vídeo.

## Trigger
- Acesso ao estúdio de vídeo (`video-studio-module.js`).
- Comando: "prepare o roteiro do vídeo", "gerar prompts de vídeo", "direção de câmera para a sala".

## Inputs
- Ambientes selecionados para o teaser ou filme do projeto.
- Renders estáticos de base.
- Duração total desejada (15s, 30s ou 60s).

## Context
Carrega `MEDIA_CONTEXT`, `PROJECT_CONTEXT` e perfil de transições da timeline.

## Workflow
```text
INPUT (Ambientes e duração total)
  ↓
SCENE SEGMENTATION (Divisão em tomadas de 3 a 5 segundos)
  ↓
CAMERA MOTION ASSIGNMENT (Definição de curvas de velocidade e enquadramento)
  ↓
PROMPT GENERATION (Prompts de câmera e física para modelos de vídeo)
  ↓
STORYBOARD SYNC (Sincronização de legendas, trilha sonora e títulos de abertura)
```

## Tools
- `js/video-narrative-engine-module.js`
- `js/video-prompt-engine-module.js`
- `js/video-camera-motion-module.js`
- `js/video-timeline-module.js`

## Constraints
- Movimentos de câmera devem ser lentos e elegantes; vetados movimentos bruscos, rotações rápidas ou zoom acelerado.
- Duração total das tomadas deve somar exatamente a duração da composição.

## Output
Roteiro estruturado `VideoProductionScript`:
- `scenes`: lista de cenas com ambiente, duração em frames (30fps), lente, movimento e prompt descritivo.
- `audioTrackRecommendation`: ritmo e mood musical sugerido (ex: Neo-clássico acústico contemporâneo).

## Validation
- Consistência temporal: soma dos frames de cada cena igual a `durationInFrames`.

## Failure Modes
- Se a duração de alguma cena for inferior a 2 segundos (60 frames a 30fps), alertar `SHOT_TOO_BRIEF` e fundir com a tomada adjacente.
