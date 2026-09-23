# ================================================================
# ARQVERTICE STUDIO — AUDITORIA VISUAL COMPLETA (BLOCO I04)
# docs/design/ARQVERTICE-DESIGN-AUDIT.md
# ================================================================

**Data:** 22/09/2026  
**Versão:** 1.0.0  
**Referência Estrutural:** Apple Human Interface & Editorial Principles (`awesome-design-md/apple/DESIGN.md`)  
**Identidade:** ArqVértice Studio — Plataforma de Arquitetura, Interiores, Modelagem 3D e Cronograma  

---

## 1. RESUMO EXECUTIVO

Esta auditoria inspecionou o código real do frontend do **ArqVértice Studio** (`index.html`, `portal.html`, `briefing.html`, `styles.css`, `css/client-portal.css`, e módulos em `js/`). O objetivo foi diagnosticar inconsistências visuais, componentes fora de um sistema formal, hardcoding de valores, proliferação de classes utilitárias sem escala e redundâncias que comprometem a percepção de precisão e sofisticação de uma plataforma arquitetônica de alto padrão.

### Diagnóstico Geral
O ArqVértice Studio possui uma base funcional robusta e completa (cobrindo os blocos A ao H), mas seu stylesheet principal (`styles.css`, ~17.450 linhas) e estilos auxiliares cresceram organicamente através de entregas modulares sucessivas. Como resultado:
- **Tipografia:** 45 tamanhos arbitrários de fonte coexistem sem escala modular nem relação proporcional de entrelinha (`line-height`) e entrelinhamento (`letter-spacing`).
- **Cores:** 151 cores hexadecimais distintas hardcoded diretamente em seletores, frequentemente duplicando ou contornando as variáveis de CSS root.
- **Raios de Borda:** 26 variações de `border-radius` (desde `1px`, `2px`, `3px`, `4px`, `6px`, `8px`, `10px`, `12px`, `14px`, `16px`, `18px`, `20px`, `24px`, até `999px` e `9999px`), quebrando a coesão de contorno de cartões e botões.
- **Profundidade e Sombras:** 59 declarações díspares de `box-shadow`, misturando sombras pretas ultra-densas (`rgba(0,0,0,0.8)`) com neons intensos (`rgba(99, 102, 241, 0.4)`), criando poluição visual ("ruído") em vez de elevação espacial funcional.
- **Movimento e Acessibilidade:** **Zero** suporte a `@media (prefers-reduced-motion: reduce)` em todo o sistema. Transições com durações e curvas de aceleração conflitantes.
- **Responsividade:** Breakpoints fragmentados (apenas 4 regras isoladas para `1024px`, `900px`, `800px`, `768px`), sem adaptação sistemática para os padrões atuais de telas (desktop ultra-wide `1440px`, laptop `1280px`, tablet horizontal `1024px`, tablet vertical `834px`, mobile large `768px`, mobile standard `640px` e compact `390px`).
- **Inline Styles:** 52 declarações de estilos em linha (`style="..."`) em `index.html` em áreas vitais de cabeçalho, modais e relatórios.

---

## 2. PILARES AUDITADOS

### 2.1. Tipografia

| Aspecto | Estado Atual Encontrado | Problema Técnico / Visual | Diretriz de Correção |
|---|---|---|---|
| **Famílias Tipográficas** | Mistura de `Montserrat`, `JetBrains Mono`, `Inter`, `Fira Code`, `Playfair Display`, `Segoe UI`, `monospace`. | Falta de unidade: classes secundárias importam famílias soltas gerando carregamento ou renderização imprevisível. | Adotar pilha de sistema unificada de alta performance com Montserrat como base de marca: `-apple-system, BlinkMacSystemFont, "Segoe UI", "Montserrat", system-ui, sans-serif` e monospace para códigos/dimensões: `'JetBrains Mono', monospace`. |
| **Escala de Tamanhos** | 45 valores arbitrários (`0.68rem`, `0.7rem`, `0.72rem`, `0.75rem`, `0.78rem`, `0.8rem`, `0.82rem`, `0.85rem`, `0.88rem`, `0.95rem`, `1.1rem`, `1.25rem`, `1.75rem`, `1.85rem`...). | Ausência de proporção modular. Textos secundários competem com legendas de forma confusa. | Consolidar em escala de 10 níveis semânticos: `display-xl`, `display-lg`, `display-md`, `heading`, `subheading`, `body-lg`, `body`, `body-sm`, `caption`, `fine-print`. |
| **Line-Height** | Valores soltos de `1`, `1.2`, `1.3`, `1.35`, `1.4`, `1.45`, `1.5`, `1.55`, `1.6`, `1.7`. | Títulos com entrelinha frouxa e textos longos com entrelinha apertada. | Títulos grandes com entrelinha justa (1.05 a 1.2); corpo de texto com 1.45 a 1.55 para conforto visual. |
| **Letter-Spacing (Tracking)** | Inconsistente (de `-0.3px` até `2px`, além de `0.02em` a `0.2em`). | Falta de contraste editorial e legibilidade em caixas altas. | Negativo sutil em títulos grandes (`-0.02em` a `-0.01em`) e positivo expandido em labels de caixa alta (`0.06em` a `0.1em`). |
| **Pesos** | Uso disperso de `400`, `500`, `600`, `700`, `800`, `900`, `bold`. | Excesso de negrito ("bold clutter") gerando peso visual desnecessário. | Restringir pesos: `400` (corpo), `500` (subtítulo/interativo), `600` (títulos/destaque), `700` (marcas e métricas). Eliminar `800` e `900` supérfluos. |

### 2.2. Cores e Superfícies

| Aspecto | Estado Atual Encontrado | Problema Técnico / Visual | Diretriz de Correção |
|---|---|---|---|
| **Cores Hardcoded** | 151 valores hexadecimais espalhados por seletores de CSS. | Dificulta manutenção de temas (dark/light), quebra consistência cromática. | Substituir cores hardcoded por tokens semânticos: `--color-accent`, `--color-surface`, `--color-text-*`, `--color-status-*`. |
| **Tema Dark vs. Light** | Tokens definidos em `:root`, `[data-theme="dark"]` e `[data-theme="light"]`, mas seletores internos usam cores estáticas. | Certos cards e painéis ficam escuros mesmo no modo claro ou com texto ilegível. | Fazer todos os componentes consumirem estritamente as variáveis de superfície e texto do tema ativo. |
| **Accent Color** | Roxo (`#6366f1` / `#8b5cf6`) misturado com azul (`#3b82f6`), rosa (`#ec4899`) e verde sem hierarquia. | Arco-íris de destaques que concorre com as imagens de arquitetura e pranchas. | Um único acento principal (`#6366f1` dark / `#4f46e5` light) para ações primárias e links. Cores de disciplina restritas a tags de identificação técnica. |
| **Glassmorphism** | Cards comuns estilizados com `backdrop-filter: blur(16px)` e fundos translúcidos pesados. | Custo computacional excessivo de renderização de GPU e aparência "SaaS genérico". | Conter glass exclusivamente em elementos suspensos (header, sidebar, floating toolbar, drawers, overlays). Superfícies normais devem ser sólidas e limpas. |

### 2.3. Espaçamento e Ritmo Espacial

| Aspecto | Estado Atual Encontrado | Problema Técnico / Visual | Diretriz de Correção |
|---|---|---|---|
| **Paddings e Margens** | Gaps de `6px`, `8px`, `10px`, `12px`, `14px`, `16px`, `18px`, `20px`, `24px` sem regra uniforme. | Falta de alinhamento visual e ritmo de leitura. | Escala base de 4px/8px: `--space-xxs: 4px`, `--space-xs: 8px`, `--space-sm: 12px`, `--space-md: 16px`, `--space-lg: 24px`, `--space-xl: 32px`, `--space-2xl: 48px`, `--space-section: 64px`. |
| **Aninhamento de Caixas** | Estruturas com `card` dentro de `card` dentro de `card` (`border` dentro de `border`). | "Caixas empilhadas" que poluem a tela e reduzem a área útil de visualização. | Substituir bordas aninhadas por hierarquia tipográfica e contraste de superfície limpa. |

### 2.4. Raios de Borda (Border-Radius)

| Aspecto | Estado Atual Encontrado | Problema Técnico / Visual | Diretriz de Correção |
|---|---|---|---|
| **Dispersão de Raios** | 26 formas (`1px`, `2px`, `3px`, `4px`, `6px`, `8px`, `10px`, `12px`, `14px`, `16px`, `18px`, `20px`, `24px`, `30px`, `999px`, `9999px`). | Botões de mesma hierarquia com cantos arredondados desiguais; inputs não conversam com botões. | Sistema de 5 raios canônicos: `--radius-xs: 4px` (tags/badges), `--radius-sm: 6px` (botões compactos/inputs), `--radius-md: 10px` (cards/painéis), `--radius-lg: 16px` (modais/grandes superfícies), `--radius-pill: 9999px` (chips/status). |

### 2.5. Profundidade, Elevação e Sombras

| Aspecto | Estado Atual Encontrado | Problema Técnico / Visual | Diretriz de Correção |
|---|---|---|---|
| **Sombras Hardcoded** | 59 variações com `rgba(0,0,0,0.8)` e halos pesados de cor primária. | Interface pesada, excesso de profundidade falsa sem luz direcional consistente. | Escala semântica de 4 níveis: `--elevation-none`, `--elevation-soft` (cards), `--elevation-floating` (menus/drawers), `--elevation-modal` (modais de tela cheia). Eliminar halos de cor decorativa. |

### 2.6. Movimento e Interações

| Aspecto | Estado Atual Encontrado | Problema Técnico / Visual | Diretriz de Correção |
|---|---|---|---|
| **Transições Dispersas** | Durações variando entre `0.15s`, `0.2s`, `0.25s`, `0.3s`, `0.4s` com curvas de aceleração ad-hoc. | Sensação de lentidão ou micro-travamentos em elementos adjacentes. | Unificar tokens de movimento: `--motion-fast: 150ms`, `--motion-normal: 240ms`, `--motion-slow: 350ms`, com curva refinada `cubic-bezier(0.16, 1, 0.3, 1)`. |
| **Acessibilidade de Movimento** | Zero declarações de `@media (prefers-reduced-motion: reduce)`. | Descumprimento de padrões WCAG para usuários sensíveis a movimento. | Implementar regra global suprimindo animações contínuas quando o usuário tiver a preferência ativa no sistema operacional. |

### 2.7. Responsividade e Breakpoints

| Aspecto | Estado Atual Encontrado | Problema Técnico / Visual | Diretriz de Correção |
|---|---|---|---|
| **Breakpoints Ad-hoc** | Apenas `1024px`, `900px`, `800px`, `768px`. | Telas em 1280px ou tablets verticais (834px) e celulares (390px) sofrem com elementos espremidos ou barras de rolagem horizontais inesperadas. | Padronizar a grade de breakpoints: `1440px` (desktop amplo), `1280px` (laptop), `1024px` (tablet landscape), `834px` (tablet portrait), `768px` (mobile horizontal), `640px` (mobile standard), `390px` (mobile compacto). |

---

## 3. MATRIZ DE COMPONENTES: PRESERVAR, MELHORAR E CONSOLIDAR

| Componente | Ação | Justificativa e Ajuste |
|---|---|---|
| **Sidebar Principal** | **MELHORAR** | Preservar estrutura e navegação existente; refinar padding, espaçamento entre itens, tipografia de rótulos e transição de recolhimento. Aplicar superfície sutil com hairline border. |
| **Header / Topbar** | **MELHORAR** | Tornar a barra ultrafina e translúcida (glass controlado), centralizar alinhamento dos breadcrumbs e padronizar botão de alternância de tema e ações de novo projeto. |
| **Botões (`.btn`)** | **CONSOLIDAR** | Eliminar 14 variações independentes de estilos de botão. Consolidar em 5 variantes canônicas: `primary`, `secondary`, `outline`, `ghost`, `danger`, e variantes de tamanho `sm`, `md`, `lg`, mais `.btn-icon`. Adicionar microinterações sóbrias (`:active scale(0.98)`). |
| **Campos de Formulário (`.form-input`, `.form-select`)** | **CONSOLIDAR** | Padronizar altura, raio (`--radius-sm`), padding interno (`8px 12px`), cores de borda, cor do placeholder e anel de foco refinado sem glow exagerado. |
| **Modais do Sistema (`.modal-card`)** | **MELHORAR** | Preservar formulários e IDs funcionais; refinar cabeçalhos, botões de fechar, elevação com `--elevation-modal` e cantos arredondados consistentes (`--radius-lg`). |
| **Cards de Projeto e Ambiente** | **MELHORAR** | Reduzir peso das bordas e sombras. Priorizar a imagem da fachada/ambiente com aspect ratio estrito (16:9 ou 4:3), tipografia de título limpa e badges de status discretos. |
| **Visualizador de Documentos & Modo Apresentação** | **PRESERVAR** | Mecânica de zoom, pan, miniaturas e controles em tela cheia já funcionam de forma exemplar; unificar apenas tipografia dos controles e elevação dos botões flutuantes. |
| **Visualizadores de Renders & Moodboards** | **PRESERVAR** | Grid, Masonry e Carrossel consolidados com precisão; garantir contraste semântico das tags *"Apresentação"*, *"Estudo"* e *"Referência"*. |
| **Drawer de Comentários e Alterações** | **MELHORAR** | Refinar cabeçalho do drawer, lista de respostas encadeadas (`parentId`), estados de status (`open`, `resolved`, etc.) e formulário de novo comentário. |
| **Tabelas de Dados e Relatórios** | **MELHORAR** | Substituir estilos inline de `index.html` na tabela de relatório executivo por classes estruturadas, mantendo compatibilidade com `html2pdf.js`. |
