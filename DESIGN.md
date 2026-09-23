# ================================================================
# ARQVERTICE STUDIO — SISTEMA DE DESIGN & DIRETRIZES TÉCNICAS
# DESIGN.md
# ================================================================

**Versão:** 2.1.0 (Apple Design System Specification — Canonical Alignment)  
**Status:** IMPLEMENTADO & ATIVO  
**Escopo:** ArqVértice Studio (Workspace Central & Portal do Cliente)  
**Referência:** `VoltAgent/awesome-design-md/design-md/apple/DESIGN.md`

---

## 1. PRINCÍPIO E IDENTIDADE VISUAL

O **ArqVértice Studio** adota a filosofia de design da Apple: **receded chrome** (a interface se afasta para o conteúdo brilhar), estética museum-gallery, precisão geométrica e ausência de elementos puramente decorativos. O sistema atua como uma moldura de precisão para pranchas, plantas técnicas, modelos 3D, renders e orçamentos arquitetônicos.

### Pilares Fundamentais (Apple HIG)
1. **Content First:** Plantas, renders e dados executivos são o herói; a interface é neutra e discreta.
2. **Action Blue Semântico:** Cores vibrantes são reservadas para elementos clicáveis e interativos (`#2997ff` no Dark, `#0066cc` no Light).
3. **Pill-Shaped CTAs:** Botões e call-to-actions em formato de pílula (`border-radius: 9999px`) com compressão tátil (`scale(0.98)`).
4. **Receded Chrome & Profundidade:** Ausência de gradientes decorativos; profundidade transmitida por iluminação ambiente e sombras discretas.

---

## 2. PILHA E REGRAS DE TIPOGRAFIA

A tipografia utiliza o padrão Apple com fallback arquitetônico de alto desempenho:

### Pilhas de Fontes
- **Interface & Textos (Sans):**  
  `var(--font-sans)` = `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", 'Montserrat', system-ui, sans-serif`
- **Títulos e Marcas (Display):**  
  `var(--font-display)` = `-apple-system, BlinkMacSystemFont, "SF Pro Display", 'Montserrat', system-ui, sans-serif`
- **Código, Dimensões & Escalas (Mono):**  
  `var(--font-mono)` = `'JetBrains Mono', 'SF Mono', Menlo, monospace`

### Escala Tipográfica Modular

| Nível | Token de Tamanho | Tamanho Real | Entrelinha (`line-height`) | Tracking (`letter-spacing`) | Peso (`font-weight`) | Uso Principal |
|---|---|---|---|---|---|---|
| **Display XL** | `--type-display-xl-size` | `2.5rem` (40px) | `1.1` | `-0.025em` | `600` | Título hero e números de destaque macro |
| **Display LG** | `--type-display-lg-size` | `2.0rem` (32px) | `1.15` | `-0.02em` | `600` | Cabeçalhos principais de telas |
| **Display MD** | `--type-display-md-size` | `1.5rem` (24px) | `1.2` | `-0.015em` | `600` | Título de seções e modais grandes |
| **Heading** | `--type-heading-size` | `1.25rem` (20px) | `1.25` | `-0.01em` | `600` | Títulos de cards e painéis |
| **Subheading** | `--type-subheading-size` | `1.0625rem` (17px) | `1.35` | `0` | `500` | Subtítulos e breadcrumb ativo |
| **Body Large** | `--type-body-lg-size` | `1.0rem` (16px) | `1.5` | `0` | `400` | Parágrafos de leitura e notas técnicas |
| **Body** | `--type-body-size` | `0.875rem` (14px) | `1.5` | `0` | `400` | Texto base de conteúdo e tabelas |
| **Body Small** | `--type-body-sm-size` | `0.8125rem` (13px) | `1.45` | `0.005em` | `400 / 500` | Botões, itens de menu e inputs |
| **Caption** | `--type-caption-size` | `0.75rem` (12px) | `1.4` | `0.01em` | `400` | Metadados, datas e status pills |
| **Fine Print** | `--type-fine-size` | `0.6875rem` (11px) | `1.3` | `0.02em` | `400` | Rodapés legais e hashes técnicos |
| **Label / Tag** | `--type-label-size` | `0.6875rem` (11px) | `1.2` | `0.06em` | `600` (UPPERCASE) | Badges de disciplina e tags |

---

## 3. PALETA DE CORES & SUPERFÍCIES (APPLE SYSTEM TOKENS)

### Acento Principal (Apple Action Blue)
- **Dark Mode:** `--accent: #2997ff` (Apple Electric Blue) | `--accent-hover: #147ce5` | `--accent-subtle: rgba(41, 151, 255, 0.12)`
- **Light Mode:** `--accent: #0066cc` (Apple Classic Blue) | `--accent-hover: #0077ed` | `--accent-subtle: rgba(0, 102, 204, 0.08)`
- **Foco de Acessibilidade:** `--accent-focus: #0071e3`

### Neutros & Superfícies (Canvas Obsidian & Pure Parchment)

| Papel Semântico | Dark Mode (`[data-theme="dark"]`) | Light Mode (`[data-theme="light"]`) | Função |
|---|---|---|---|
| `--color-canvas-app` | `#000000` (Pure Jet Black) | `#f5f5f7` (Apple Parchment) | Fundo principal da viewport |
| `--bg-sidebar` | `#161617` (Obsidian Deep) | `#ffffff` (Pure White) | Superfície da barra lateral fixa |
| `--color-surface` | `#1d1d1f` (Surface Tile) | `#ffffff` (Pure White) | Fundo de painéis e modais |
| `--color-surface-elevated` | `#242426` (Elevated Tile) | `#fafafc` (Pearl Surface) | Cards, inputs e elementos elevados |
| `--color-surface-hover` | `#2d2d30` (Surface Hover) | `#f0f0f2` (Light Hover) | Estado interativo sobreposto |
| `--color-surface-glass` | `rgba(29, 29, 31, 0.85)` | `rgba(255, 255, 255, 0.85)` | Superfície flutuante translúcida |
| `--color-border-subtle` | `rgba(255, 255, 255, 0.08)` | `rgba(0, 0, 0, 0.08)` | Hairline de divisão |
| `--color-border-medium` | `rgba(255, 255, 255, 0.15)` | `rgba(0, 0, 0, 0.12)` | Contorno de cards e botões |
| `--color-border-active` | `#2997ff` | `#0066cc` | Foco e borda selecionada |
| `--color-text-primary` | `#f5f5f7` | `#1d1d1f` | Texto de máxima ênfase |
| `--color-text-secondary` | `#86868b` | `#6e6e73` | Textos de apoio e rótulos |
| `--color-text-muted` | `#6e6e73` | `#86868b` | Metadados e placeholders |

### Cores Canônicas das Disciplinas
- **Arquitetura (`--color-arq`):** `#8b5cf6` | Fundo: `rgba(139, 92, 246, 0.12)`
- **Projeto 3D (`--color-3d`):** `#ec4899` | Fundo: `rgba(236, 72, 153, 0.12)`
- **Estrutura (`--color-est`):** `#f59e0b` | Fundo: `rgba(245, 158, 11, 0.12)`
- **Complementares (`--color-comp`):** `#06b6d4` | Fundo: `rgba(6, 182, 212, 0.12)`
- **Obras (`--color-obras`):** `#f97316` | Fundo: `rgba(249, 115, 22, 0.12)`

### Status Canônicos
- **Concluído (`--color-completed`):** `#34c759` (Apple Green)
- **Em Andamento (`--color-in-progress`):** `#007aff` (Apple Blue)
- **Em Revisão (`--color-review`):** `#af52de` (Apple Purple)
- **Não Iniciado (`--color-not-started`):** `#8e8e93` (Apple Gray)
- **Perigo / Erro (`--color-danger`):** `#ff3b30` (Apple Red)
- **Destaque / Ouro (`--color-gold`):** `#ffcc00` (Apple Yellow)

---

## 4. ESCALA DE ESPAÇAMENTO (BASE 4PX / 8PX)

O ritmo visual adere a múltiplos estritos da unidade base de 4px / 8px:

```css
--space-xxs: 4px;       /* Micro-gaps e ícones compactos */
--space-xs: 8px;        /* Espaçamento interno entre ícone e texto */
--space-sm: 12px;       /* Margens internas de inputs e tags */
--space-md: 16px;       /* Padding padrão de cartões e itens de lista */
--space-lg: 24px;       /* Gaps entre cartões em grids */
--space-xl: 32px;       /* Padding de viewports e modais */
--space-2xl: 48px;      /* Separação macro de blocos */
--space-section: 64px;  /* Ritmo editorial entre grandes seções */
```

---

## 5. FORMAS & RAIOS DE BORDA (APPLE BORDER-RADIUS)

O sistema proíbe cantos arbitrários:

- `--radius-none: 0px` — Pranchas técnicas e plantas brutas
- `--radius-xs: 5px` — Badges compactos
- `--radius-sm: 8px` — Controles secundários e campos de entrada
- `--radius-md: 11px` — Cards de projetos e painéis
- `--radius-lg: 18px` — Modais e containers de destaque
- `--radius-pill: 9999px` — **Botões primários (.btn), pills de status e tags** (Padrão canônico Apple)

---

## 6. PROFUNDIDADE, ELEVAÇÃO & SOMBRAS

Sombras existem para explicar posição espacial, não para decorar:

- **`--elevation-none`:** `none`
- **`--elevation-soft`:** Cartões de conteúdo e botões secundários (`0 1px 3px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.24)` no Dark).
- **`--elevation-floating`:** Menus dropdown, barras de ferramentas suspensas e drawers (`0 8px 24px -4px rgba(0,0,0,0.5), 0 2px 6px -1px rgba(0,0,0,0.3)`).
- **`--elevation-modal`:** Modais e lightbox de alta resolução (`0 24px 48px -12px rgba(0,0,0,0.75)` com hairline perimetral).

---

## 7. USO FUNCIONAL DE GLASS (TRANSLUCIDEZ)

- **Regra:** O efeito glass (`backdrop-filter: blur(12px)`) é reservado para **elementos que sobrepõem conteúdo**:
  - Topbar (`.app-header`);
  - Sidebar fixa ao retrair;
  - Drawer de comentários do Portal;
  - Controles flutuantes do Visualizador de Documentos (`.viewer-controls`).
- **Proibição:** Cards comuns de dados ou galerias de fotos nunca devem utilizar glass sem necessidade funcional.

---

## 8. SISTEMA DE MOVIMENTO & MICROINTERAÇÕES

### Tokens de Movimento
```css
--motion-duration-fast: 140ms;
--motion-duration-normal: 220ms;
--motion-duration-slow: 320ms;
--motion-ease-default: cubic-bezier(0.16, 1, 0.3, 1);
```

### Gramática de Estados em Botões
- **Hover:** Transição suave de superfície (`--bg-surface-hover`) e leve elevação (`translateY(-1px)`).
- **Active:** Compressão háptica tátil visual com `transform: scale(0.98);`.
- **Focus-visible:** Anel de foco nítido sem ofuscar: `box-shadow: 0 0 0 2px var(--bg-surface), 0 0 0 4px var(--accent);`.
- **Disabled:** `opacity: 0.45; cursor: not-allowed; pointer-events: none; transform: none;`.

### Acessibilidade Universal (Reduced Motion)
Quando ativado pelo sistema do usuário:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 9. GRADE DE RESPONSIVIDADE CANÔNICA

A interface responde sistematicamente nos seguintes breakpoints:

1. **`1440px` (Desktop Amplo):** Máxima amplitude (`max-width: 1320px`, padding 24px).
2. **`1280px` (Laptop Padrão):** Contração confortável do grid (`max-width: 1180px`, kpi em 2 colunas).
3. **`1024px` (Tablet Paisagem / Desktop Compacto):** Sidebar recolhível com overlay e elevação modal; área principal em largura total.
4. **`834px` (Tablet Retrato):** Redução do campo de busca global (240px) e padding de 16px no header.
5. **`768px` (Mobile Grande / Phablet):** Kanban e summaries em coluna única; breadcrumbs simplificados.
6. **`640px` (Mobile Padrão):** Modais ocupam tela cheia com padding compacto e scroll vertical otimizado.
7. **`390px` (Mobile Compacto):** Botões e controles com tamanho mínimo de toque de 40px para conforto ergonômico.

---

## 10. DIRETRIZES DO / DON'T

| DO (Práticas Recomendadas) | DON'T (Práticas Vetadas) |
|---|---|
| Usar neutros minerais como base e um único acento cromático. | Usar gradientes neon ou arco-íris decorativo de cores. |
| Utilizar a escala tipográfica modular com tracking rigoroso. | Usar tamanhos arbitrários de fonte como `0.72rem` ou `19px`. |
| Limitar o efeito glass a superfícies que flutuam sobre conteúdo. | Transformar todos os cards em vidro fosco. |
| Dar feedback tátil no clique com compressão sutil (`scale(0.98)`). | Usar animações elásticas ou bounce exagerado. |
| Deixar o conteúdo arquitetônico (plantas, renders) respirar. | Preencher vazios com caixas, contornos ou linhas desnecessárias. |
| Respeitar rigorosamente a preferência de movimento reduzido. | Executar animações em loop infinito sem controle do usuário. |
