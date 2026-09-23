---
name: presentation-direction
description: Direção de arte editorial, narrativa arquitetônica e diagramação de pranchas conceituais para clientes.
---

# Presentation Direction Skill

## Name
`presentation-direction`

## Purpose
Estruturar a narrativa de apresentação do projeto para o cliente, organizando renders hero, plantas conceituais, diagramas de ventilação/sol e textos poéticos em um fluxo de alta sofisticação visual.

## Trigger
- Abertura do Motor de Apresentação (`presentation-engine-module.js`).
- Comando: "gere uma narrativa para esta apresentação", "estruture os slides do projeto", "preparar reunião com cliente".

## Inputs
- Renders finalizados e aprovados dos ambientes.
- Conceito arquitetônico do projeto (`concept-module.js`).
- Perfil e tom de comunicação do cliente (formal, jovem, investidor).

## Context
Carrega `PROJECT_CONTEXT`, `MEDIA_CONTEXT` e memórias cognitivas de conceito formal.

## Workflow
```text
INPUT (Assets de mídia e conceito arquitetônico)
  ↓
STORY ARC DEFINITION (Ato 1: O Lugar e a Fachada ➔ Ato 2: Convivência e Luz ➔ Ato 3: Íntimo)
  ↓
IMAGE CURATION (Seleção dos melhores ângulos sem repetição)
  ↓
TYPOGRAPHIC COMPOSITION (Títulos discretos SF Pro, escala de leitura)
  ↓
SLIDE DECK GENERATION (Slides diagramados com paleta mineral)
```

## Tools
- `js/presentation-engine-module.js`
- `js/concept-module.js`
- `js/render-presentation-module.js`

## Constraints
- Estética sóbria (receded chrome): o render é o centro das atenções, sem caixas coloridas decorativas.
- Proibido excesso de texto sobre imagens que prejudique a leitura da arquitetura.

## Output
Pacote `PresentationDeck`:
- `deckTitle`: nome do projeto e cliente.
- `slides`: lista ordenada de pranchas com layouts (Hero Full, Split 50/50, Galeria 3 Quadros).
- `narrativeNotes`: notas de fala sugeridas para o arquiteto na reunião.

## Validation
- Resolução mínima de renders de 1920x1080px para evitar perda de nitidez em telas grandes.

## Failure Modes
- Caso faltem imagens para algum ambiente chave do programa, sinalizar `MISSING_VISUAL_ASSET` e sugerir render conceitual rápido.
