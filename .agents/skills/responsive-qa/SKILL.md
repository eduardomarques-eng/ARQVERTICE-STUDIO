---
name: responsive-qa
description: Auditoria de responsividade, viewport dinâmica, safe-areas de mobile e touch targets táteis (375px a 1440px).
---

# Responsive QA Skill

## Name
`responsive-qa`

## Purpose
Validar o comportamento fluido e robusto da aplicação em todos os tamanhos de tela (desktop amplo, laptop, tablet e smartphones compactos), garantindo ausência de overflow horizontal, botões confortáveis ao toque ($\ge 44\text{px}$) e compatibilidade com safe areas de iOS/Android.

## Trigger
- Criação ou modificação de layouts de tela ou grids.
- Comando: "testar responsividade", "verificar telas mobile", "auditar touch targets".
- Suíte automatizada de testes de layout.

## Inputs
- Regras de `@media` query em `styles.css` e `css/responsive-a11y.css`.
- Dimensões de viewport canônicas: 1440, 1280, 1024, 834, 768, 640, 480, 390 e 375px.
- DOM renderizado da aplicação.

## Context
Carrega a tabela de breakpoints canônicos do `DESIGN.md`.

## Workflow
```text
INPUT (Viewports de teste e folhas de estilo)
  ↓
OVERFLOW CHECK (Inspeção de scroll-x acidental em body e containers principais)
  ↓
DRAWER & NAVIGATION AUDIT (Sidebar oculta com drawer e backdrop em <= 1024px)
  ↓
TOUCH TARGET EVALUATION (Garantia de altura e largura mínima de 44px em coarse pointer)
  ↓
SAFE AREA ADJUSTMENT (Padding top e bottom para notch e barra de gestos móveis)
  ↓
RESPONSIVE REPORT (Lista de violações e correções aplicadas)
```

## Tools
- `tests/visual-responsive-qa.test.js`
- `css/responsive-a11y.css`

## Constraints
- Mobile nunca é uma miniatura do desktop: tabelas viram cards ou ganham wrapper com scroll horizontal explícito; sidebars viram drawers.
- Vetado qualquer elemento que force a barra de rolagem horizontal no body da página.

## Output
Diagnóstico `ResponsiveQAReport`:
- `testedBreakpoints`: lista dos 9 breakpoints validados.
- `overflowViolations`: contagem de elementos transbordantes (meta: 0).
- `touchTargetDeficiencies`: elementos clicáveis com área menor que 44px.

## Validation
- Verificação de presença obrigatória da regra `overflow-x: clip` no root da aplicação.

## Failure Modes
- Se algum modal abrir além da altura da tela (`100dvh`), forçar `max-height: 90dvh` com `overflow-y: auto`.
