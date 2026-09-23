---
name: remotion
description: Motor de composição audiovisual programática determinística em React/Vanilla JS com suporte a física de molas e renderização frame-a-frame.
---

# Remotion Video Engine Skill

## Name
`remotion`

## Purpose
Renderizar deterministicamente cada frame do vídeo arquitetônico como uma função matemática do tempo (`currentFrame`), aplicando interpolações suaves (`interpolate`), física de amortecimento (`spring`) e composições de alta fidelidade sem depender de editores manuais.

## Trigger
- Solicitação de renderização ou pré-visualização de vídeo do projeto.
- Comando: "renderizar vídeo", "compilar frames", "testar composição Remotion".
- Exportação audiovisual para entrega ao cliente.

## Inputs
- Dados puros do projeto (`projectId`, ambientes, imagens em alta resolução, textos de tipografia).
- Configurações da composição (`width`, `height`, `fps`, `durationInFrames`).
- Parâmetros de física e movimento de câmera (curvas de bezier, amortecimento).

## Context
Carrega `MEDIA_CONTEXT` e timeline ativa do projeto.

## Workflow
```text
INPUT (Dados arquitetônicos estruturados e assets)
  ↓
ADAPTATION (Conversão em props puras via ProjectDataAdapter)
  ↓
SCENE COMPOSITION (Montagem das cenas em Sequências React / Canvas)
  ↓
FRAME INTERPOLATION (Cálculo de opacidade, escala e translação no frame N)
  ↓
DETERMINISTIC RENDER (Compilação em buffer de vídeo ou exportação MP4)
```

## Tools
- `video/render/remotion-engine.js`
- `video/adapters/project-data-adapter.js`
- `video/compositions/architectural-cinematic.js`
- `video/components/architectural-components.js`

## Constraints
- Determinismo absoluto: o mesmo frame $N$ sempre deve produzir a imagem idêntica.
- Ausência de operações assíncronas imprevisíveis dentro do loop de renderização do frame.
- Textos devem respeitar a escala tipográfica modular do `DESIGN.md`.

## Output
Vídeo renderizado `VideoRenderOutput` com:
- `totalFrames`: quantidade de quadros compilados.
- `resolution`: formato (`1920x1080` horizontal ou `1080x1920` vertical/Reels).
- `renderTimeMs`: tempo de processamento.
- `status`: `'COMPLETED' | 'FAILED'`.

## Validation
- Verificação de ausência de frames vazios ou pretos na transição de cenas.
- Taxa de quadros constante a 30fps ou 60fps.

## Failure Modes
- Caso uma imagem de cena falhe no carregamento, utilizar o asset de fallback institucional (`logo.png` com fundo escuro) e emitir aviso de asset ausente.
