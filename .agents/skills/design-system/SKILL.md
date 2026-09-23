---
name: design-system
description: Governança do sistema de design, catálogo de tokens e componentes padronizados do ArqVértice Studio.
---

# Design System Skill

## Name
`design-system`

## Purpose
Manter a coerência dos tokens semânticos (cores minerais, tipografia SF Pro / Montserrat, espaçamentos modulares de 4px/8px, raios de borda e níveis de elevação) em todos os componentes e telas do ArqVértice Studio.

## Trigger
- Criação de novos componentes, botões, modais ou painéis.
- Comando: "verificar tokens de design", "padronizar componente", "consultar design system".
- Refatoração de classes legadas no CSS.

## Inputs
- Contrato mestre `DESIGN.md` (v2.1.0).
- Folhas de estilo da aplicação (`styles.css`, `css/responsive-a11y.css`, `css/client-portal.css`).

## Context
Carrega a especificação canônica de design tokens do estúdio.

## Workflow
```text
INPUT (Componente ou estilo proposto)
  ↓
TOKEN MAPPING (Associar propriedades CSS às variáveis canônicas: --bg-surface, --accent, etc.)
  ↓
TYPOGRAPHY SCALE (Ajustar font-size, line-height e tracking conforme a tabela modular)
  ↓
INTERACTION HARDENING (Adicionar hover, active scale(0.98), focus-visible e disabled)
  ↓
DESIGN SYSTEM COMPLIANT COMPONENT
```

## Tools
- `DESIGN.md`
- `tests/audit-design.js`

## Constraints
- Cores de destaque: estritamente Apple Action Blue (`#2997ff` Dark, `#0066cc` Light) para elementos interativos.
- Raios de borda: botões primários e status pills obrigatoriamente utilizam `--radius-pill` (`9999px`).
- Proibido inventar tamanhos de fonte fora da escala canônica (Display XL a Fine Print).

## Output
Componente ou trecho de código formatado e homologado para o ecossistema ArqVértice.

## Validation
- Ausência de valores "mágicos" (`px` soltos em cores, fontes e paddings) não mapeados na raiz `:root`.

## Failure Modes
- Se uma nova cor for necessária para um módulo específico, ela deve ser registrada formalmente em `DESIGN.md` com justificativa semântica.
