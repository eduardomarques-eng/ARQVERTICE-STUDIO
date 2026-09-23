---
name: architecture-brief
description: Estruturação, extração e validação do programa de necessidades e briefing arquitetônico.
---

# Architecture Brief Skill

## Name
`architecture-brief`

## Purpose
Transformar entrevistas, respostas brutas de clientes e questionários de estilo de vida em um programa arquitetônico de necessidades estruturado, zoneado por funções e validado contra restrições de orçamento e terreno.

## Trigger
- Conclusão do formulário de 32 perguntas pelo cliente no Portal.
- Comando: "analise o briefing", "extraia o programa de necessidades", "resuma as diretrizes do cliente".
- Entrada na aba de Briefing no Workspace do Projeto.

## Inputs
- Respostas do questionário (`briefingData`).
- Metadados do projeto (área do terreno, tipologia, ocupantes, orçamento estimado).
- Fotos e imagens de referência enviadas pelo contratante.

## Context
Carrega `PROJECT_CONTEXT` e memórias ativas de decisões do cliente via `ContextBuilder`.

## Workflow
```text
INPUT (Respostas brutas e anexos)
  ↓
EXTRACT (Separar programa, estilo, áreas e restrições)
  ↓
CLASSIFY (Zoneamento: Social, Íntimo, Serviços, Lazer)
  ↓
NORMALIZE (Converter em áreas úteis m² e exigências técnicas)
  ↓
VALIDATE (Checar viabilidade: área construída vs taxa de ocupação)
  ↓
STRUCTURED BRIEF (Documento com aprovação do arquiteto)
```

## Tools
- `js/briefing-schema.js` (validação de schema)
- `js/briefing-admin.js`
- Provedor generativo de texto para síntese de linguagem natural.

## Constraints
- Nunca alterar preferências explicitamente marcadas como "inegociáveis" pelo cliente.
- Respeitar a taxa de ocupação máxima e recuos legais do loteamento.

## Output
Objeto JSON `TechnicalBrief` contendo:
- `clientProfile`: estilo de vida, prioridades e dores.
- `functionalZones`: relação de ambientes com m² mínimos.
- `aestheticDirectives`: paleta, acabamentos vedados e referências.
- `feasibilityScore`: índice numérico de viabilidade técnica.

## Validation
- Soma das áreas dos ambientes $\le$ área máxima contratada + margem de circulação (15%).
- Presença de todos os campos obrigatórios segundo o schema do estúdio.

## Failure Modes
- Se dados forem contraditórios (ex: orçamento baixo com área gigante), acionar o flag `INCONSISTENCY_DETECTED` e sugerir reunião de alinhamento.
