---
name: bim-analysis
description: Auditoria geométrica, conformidade de vãos NBR e verificação de alvenarias em modelos arquitetônicos.
---

# BIM Analysis Skill

## Name
`bim-analysis`

## Purpose
Analisar a consistência dimensional, eixos de circulação, vãos de portas/janelas segundo NBR 9050 / NBR 15220 e compatibilidade espacial de paredes e aberturas em dados BIM e plantas baixas.

## Trigger
- Upload de arquivo IFC ou vetor de planta baixa.
- Alteração no layout de paredes ou portas no Workspace.
- Comando: "audite a geometria", "verifique circulações", "mostre problemas nesta planta".

## Inputs
- Dados geométricos do ambiente ou planta (`surveyData`, `environments.dimensions`).
- Espessuras de parede (15cm alvenaria interna, 20cm geminada/externa).
- Posição e dimensões de portas e janelas.

## Context
Carrega `BIM_CONTEXT` e `SELECTION_CONTEXT` do ambiente inspecionado.

## Workflow
```text
INPUT (Coordenadas de paredes, vãos e eixos)
  ↓
INTERFERENCE CHECK (Cruzamento de eixos e pilares)
  ↓
CIRCULATION AUDIT (Folgas mínimas: corredores >= 0.90m, portas >= 0.80m)
  ↓
LIGHTING & VENTILATION (Área de abertura >= 1/6 da área do piso)
  ↓
COMPLIANCE REPORT (Lista de inconformidades e sugestões)
```

## Tools
- `js/survey-module.js`
- `js/humanized-plan-module.js`
- `js/quantity-system-module.js`

## Constraints
- Jamais reduzir vãos de portas acessíveis para menos de 0.80m (NBR 9050).
- Paredes hidráulicas devem manter no mínimo 15cm de espessura.

## Output
Relatório `BIMAnalysisReport` contendo:
- `complianceStatus`: `'PASS' | 'WARNING' | 'FAIL'`
- `circulationScore`: índice percentual de eficiência.
- `inconsistencies`: lista de pontos de atrito dimensional.
- `recommendedOffsets`: sugestões de reposicionamento em milímetros.

## Validation
- Verificação matemática exata de distâncias euclidianas entre polígonos.

## Failure Modes
- Se geometrias contiverem polígonos abertos ou auto-intersectantes, retornar `INVALID_GEOMETRY` com coordenadas do erro.
