---
name: architectural-documentation
description: Geração, formatação e validação de pranchas técnicas executivas (A0–A3) segundo NBR 6492.
---

# Architectural Documentation Skill

## Name
`architectural-documentation`

## Purpose
Gerar e diagramar pranchas técnicas executivas, carimbos oficiais, cotas determinísticas, notas de especificação e legendas, garantindo rigor normativo (NBR 6492) e clareza visual para a obra.

## Trigger
- Abertura da aba de Pranchas no Workspace.
- Comando: "gere a prancha executiva", "valide o carimbo da folha", "diagramar cortes".
- Solicitação de exportação de pranchas em PDF/SVG.

## Inputs
- Vetores de plantas, cortes e fachadas do projeto.
- Metadados do projeto (código, prancha nº, escala, autor, RT do CAU/CREA).
- Formato de folha selecionado (`A0`, `A1`, `A2`, `A3`).

## Context
Carrega `DOCUMENT_CONTEXT`, `PROJECT_CONTEXT` e dados de carimbo institucional.

## Workflow
```text
INPUT (Desenhos vetorizados e metadados)
  ↓
SHEET SIZING (Definição de margens e dobras NBR)
  ↓
VIEWPORT PLACEMENT (Alocação com base na escala 1:50, 1:100, 1:25)
  ↓
TITLEBLOCK GENERATION (Carimbo com campos mandatórios e revisões)
  ↓
DIMENSIONING & CALLOUTS (Cotas, níveis, títulos de desenho e norte)
  ↓
TECHNICAL EXPORT (Geração de SVG/PDF de alta fidelidade)
```

## Tools
- `js/sheet-engine-module.js`
- `js/export-engine-module.js`
- `docs/brand-and-titleblock.md`

## Constraints
- Margem esquerda sempre com 25mm para fixação em pasta (NBR 6492).
- Proibido misturar escalas sem indicação gráfica clara abaixo de cada desenho.
- Carimbo posicionado impreterivelmente no canto inferior direito.

## Output
Pacote `SheetPackage` com:
- `sheetId`: identificador único da folha (`ARQ-01/04`).
- `svgData`: conteúdo vetorial exato para renderização.
- `titleblock`: dados validados do carimbo e notas de revisão.

## Validation
- Checagem de colisão entre desenhos e limites úteis da folha.
- Validação de legibilidade de fontes técnicas (mínimo 2mm na escala impressa).

## Failure Modes
- Se o desenho estourar os limites da prancha, recomendar automaticamente o upgrade de formato (ex: de A2 para A1) ou redução de escala (de 1:50 para 1:75).
