---
name: visual-qa
description: Auditoria visual de interfaces, validação de conformidade com DESIGN.md e verificação anti-AI slop.
---

# Visual QA Skill

## Name
`visual-qa`

## Purpose
Garantir a integridade estética e visual do estúdio, auditando contraste de cores, hierarquia tipográfica, ritmo de espaçamentos, elevação e aderência aos princípios Apple HIG do `DESIGN.md`, eliminando qualquer traço de AI Slop.

## Trigger
- Alteração em estilos CSS ou inclusão de novos componentes HTML.
- Comando: "auditar visual", "verificar conformidade visual", "auditar design".
- Execução da suíte de testes de layout.

## Inputs
- Folhas de estilo da aplicação (`styles.css`, `css/responsive-a11y.css`, `css/client-portal.css`).
- Árvore DOM dos arquivos HTML do estúdio (`index.html`, `portal.html`, `briefing.html`).
- Contrato canônico `DESIGN.md`.

## Context
Carrega tokens semânticos e regras do design system.

## Workflow
```text
INPUT (Arquivos CSS e marcação HTML)
  ↓
TOKEN AUDIT (Verificar uso estrito de variáveis CSS em vez de valores arbitrários)
  ↓
TYPOGRAPHY CHECK (Escala modular SF Pro / Montserrat e tracking)
  ↓
CONTRAST EVALUATION (Texto vs fundo com razão >= 7:1)
  ↓
ANTI-SLOP SCREENING (Eliminar gradientes neon, cards excessivos e glass indevido)
  ↓
QUALITY SCORECARD (Emissão de conformidade objetiva)
```

## Tools
- `tests/audit-design.js`
- `tests/visual-responsive-qa.test.js`
- `DESIGN.md`

## Constraints
- Vetados inline-styles com cores hexadecimais soltas ou tamanhos de fonte sem token.
- Glassmorphism restrito exclusivamente a superfícies que sobrepõem conteúdo dinâmico.

## Output
Relatório `VisualQAScorecard`:
- `tokenComplianceRate`: percentual de adesão aos tokens.
- `contrastViolations`: contagem de elementos abaixo do padrão WCAG AA/AAA.
- `slopDetections`: padrões genéricos detectados e corrigidos.

## Validation
- Falha imediata de build se forem detectados botões com cantos arbitrários fora da especificação pill (`radius-pill`).

## Failure Modes
- Se uma classe CSS contiver `!important` desnecessário que quebre o cascade global, sinalizar `SPECIFICITY_HAZARD`.
