# ================================================================
# ARQVERTICE STUDIO — CONTRATOS DE DESIGN (BLOCO I04)
# docs/design/DESIGN-CONTRACTS.md
# ================================================================

**Data:** 22/09/2026  
**Status dos Contratos:** RESOLVED (Todos os 16 contratos implementados e validados)  
**Governança:** Executado e Concluído (`AUTO_APPLY` e `SAFE_REVIEW`).  

---

## ÍNDICE DE CONTRATOS

| ID | Categoria | Severidade | Ação | Status | Descrição Resumida |
|---|---|---|---|---|---|
| **DC-001** | Tokens / Tipografia | P1 | AUTO_APPLY | RESOLVED | Centralizar escala tipográfica modular e pilha de fontes de sistema |
| **DC-002** | Tokens / Cores | P1 | AUTO_APPLY | RESOLVED | Substituir cores hexadecimais hardcoded por tokens semânticos |
| **DC-003** | Tokens / Espaçamento | P2 | AUTO_APPLY | RESOLVED | Padronizar escala de espaçamento matemática (base 4px/8px) |
| **DC-004** | Tokens / Raios | P2 | AUTO_APPLY | RESOLVED | Consolidar os 26 raios de borda em 5 tokens canônicos |
| **DC-005** | Tokens / Elevação | P1 | AUTO_APPLY | RESOLVED | Substituir sombras dispersas por 4 níveis semânticos de elevação |
| **DC-006** | Tokens / Movimento | P1 | AUTO_APPLY | RESOLVED | Unificar tokens de transição e adicionar `@media (prefers-reduced-motion)` |
| **DC-007** | Responsividade | P1 | SAFE_REVIEW | RESOLVED | Estabelecer grade canônica de breakpoints (390px a 1440px) |
| **DC-008** | Z-Index | P2 | AUTO_APPLY | RESOLVED | Normalizar z-index disperso em escala semântica controlada |
| **DC-009** | Superfícies / Glass | P1 | AUTO_APPLY | RESOLVED | Conter glassmorphism estritamente a superfícies flutuantes |
| **DC-010** | Componentes / Botões | P1 | AUTO_APPLY | RESOLVED | Consolidar variantes de botão e adicionar microinterações de feedback |
| **DC-011** | Componentes / Inputs | P2 | AUTO_APPLY | RESOLVED | Padronizar inputs, selects e textareas com anel de foco refinado |
| **DC-012** | Componentes / Modais | P2 | AUTO_APPLY | RESOLVED | Harmonizar modais com raio `--radius-lg`, elevação e fecho acessível |
| **DC-013** | Componentes / Sidebar | P2 | AUTO_APPLY | RESOLVED | Refinar padding, ritmo de ícones e tipografia da barra lateral |
| **DC-014** | Componentes / Header | P2 | AUTO_APPLY | RESOLVED | Tornar o header translúcido (glass sutil) com altura compacta de 52px |
| **DC-015** | Código / Inline Styles | P2 | AUTO_APPLY | RESOLVED | Eliminar estilos em linha em `index.html` e substituir por classes utilitárias |
| **DC-016** | Portal do Cliente | P1 | SAFE_REVIEW | RESOLVED | Harmonizar `css/client-portal.css` com o novo sistema de tokens |

---

## DETALHAMENTO DOS CONTRATOS

### DESIGN CONTRACT: DC-001
- **Categoria:** Tokens / Tipografia
- **Severidade:** P1
- **Localização:** `styles.css:8-55`, `css/client-portal.css:1-50`
- **Evidência:** 45 tamanhos arbitrários (`0.68rem`, `0.72rem`, `0.85rem`, `1.85rem`...) e 12 famílias tipográficas soltas.
- **Problema atual:** Textos secundários, legendas e títulos não mantêm uma hierarquia proporcional, gerando ruído visual.
- **Impacto:** Perda de sensação editorial e clareza de leitura na navegação e nos painéis técnicos.
- **Diretriz:** Estabelecer uma escala tipográfica centralizada com entrelinhas e tracking controlados, priorizando pilha de sistema com base Montserrat.
- **Estado desejado:** Tokens `--type-display-xl`, `--type-display-lg`, `--type-display-md`, `--type-heading`, `--type-subheading`, `--type-body-lg`, `--type-body`, `--type-body-sm`, `--type-caption`, `--type-fine`, `--type-label`.
- **Correção exata:** Declarar a escala tipográfica modular no `:root` de `styles.css` e utilizá-la em títulos, botões e corpo.
- **Arquivos afetados:** `styles.css`, `css/client-portal.css`
- **Componentes afetados:** Headings, Badges, Botões, Tabelas, Menus.
- **Risco:** Baixo (`AUTO_APPLY`).
- **Critério de aceite:** Todo texto estrutural consome tokens semânticos ou herança proporcional; ausência de famílias soltas não documentadas.

---

### DESIGN CONTRACT: DC-002
- **Categoria:** Tokens / Cores
- **Severidade:** P1
- **Localização:** `styles.css:56-116`, seletores gerais
- **Evidência:** 151 ocorrências de códigos hexadecimais soltos (`#10b981`, `#6366f1`, `#3b82f6`...) sem consumir variáveis CSS.
- **Problema atual:** Quebra da coesão do tema (Dark e Light) e dificuldade de recalibrar a paleta.
- **Impacto:** Certos componentes perdem contraste ou mantêm fundo escuro em modo claro.
- **Diretriz:** Todo seletor de componente deve consumir tokens semânticos: `--color-canvas-app`, `--color-surface`, `--color-surface-elevated`, `--color-border-subtle`, `--color-text-*`, `--color-accent`.
- **Correção exata:** Centralizar paleta nos seletores `:root`, `[data-theme="dark"]` e `[data-theme="light"]`.
- **Arquivos afetados:** `styles.css`, `css/client-portal.css`
- **Componentes afetados:** Cards, Inputs, Modais, Sidebar, Tabelas.
- **Risco:** Baixo (`AUTO_APPLY`).
- **Critério de aceite:** Inspecionar que nenhum componente vital utilize hex estático fora do mapeamento de tokens.

---

### DESIGN CONTRACT: DC-003
- **Categoria:** Tokens / Espaçamento
- **Severidade:** P2
- **Localização:** `styles.css:382-634`
- **Evidência:** Declarações de `padding: 10px 14px`, `11px 22px`, `padding: 6px 12px`, `gap: 10px`.
- **Problema atual:** Ausência de ritmo espacial constante (base 4px/8px).
- **Impacto:** Alinhamentos imprecisos em grids e listas de tarefas/ambientes.
- **Diretriz:** Adotar escala padronizada: `--space-xxs: 4px`, `--space-xs: 8px`, `--space-sm: 12px`, `--space-md: 16px`, `--space-lg: 24px`, `--space-xl: 32px`, `--space-2xl: 48px`, `--space-section: 64px`.
- **Correção exata:** Adicionar variáveis de espaçamento em `:root` e alinhar paddings de botões, cards e cabeçalhos.
- **Arquivos afetados:** `styles.css`
- **Componentes afetados:** Cards, Painéis, Botões, Containers de visualização.
- **Risco:** Baixo (`AUTO_APPLY`).
- **Critério de aceite:** Paddings e gaps respeitam a escala formal de 4px/8px.

---

### DESIGN CONTRACT: DC-004
- **Categoria:** Tokens / Raios de Borda
- **Severidade:** P2
- **Localização:** `styles.css`, `css/client-portal.css`
- **Evidência:** 26 raios de borda identificados (`1px` a `30px`, `999px`, `9999px`).
- **Problema atual:** Desarmonia visual com cantos arredondados díspares entre botões, tags e cards vizinhos.
- **Impacto:** Sensação de montagem amadora ("template de startup").
- **Diretriz:** Limitar raios a 5 níveis canônicos: `--radius-xs: 4px`, `--radius-sm: 6px`, `--radius-md: 10px`, `--radius-lg: 16px`, `--radius-pill: 9999px`.
- **Correção exata:** Mapear classes e seletores para usar os novos tokens de raio.
- **Arquivos afetados:** `styles.css`, `css/client-portal.css`
- **Componentes afetados:** Buttons, Cards, Inputs, Modais, Badges, Imagens.
- **Risco:** Baixo (`AUTO_APPLY`).
- **Critério de aceite:** Todo contorno arredondado adere a um dos 5 tokens canônicos.

---

### DESIGN CONTRACT: DC-005
- **Categoria:** Tokens / Elevação e Sombras
- **Severidade:** P1
- **Localização:** `styles.css:80-85`, `112-116`
- **Evidência:** 59 sombras soltas com valores opacos de até `rgba(0,0,0,0.8)` e halos neon.
- **Problema atual:** Poluição visual de sombra sem função arquitetônica de iluminação suave.
- **Impacto:** Superfícies pesadas que disputam a atenção com renders e pranchas.
- **Diretriz:** Definir 4 níveis semânticos: `--elevation-none`, `--elevation-soft`, `--elevation-floating`, `--elevation-modal`.
- **Correção exata:** Substituir declarações de `box-shadow` ad-hoc pelos tokens de elevação.
- **Arquivos afetados:** `styles.css`, `css/client-portal.css`
- **Componentes afetados:** Cards, Menus, Modais, Lightbox, Botões flutuantes.
- **Risco:** Baixo (`AUTO_APPLY`).
- **Critério de aceite:** Eliminar halos brilhantes artificiais e sombras pretas agressivas.

---

### DESIGN CONTRACT: DC-006
- **Categoria:** Tokens / Movimento e Acessibilidade
- **Severidade:** P1
- **Localização:** `styles.css:50-54`, final de `styles.css`
- **Evidência:** Ausência absoluta de `@media (prefers-reduced-motion: reduce)` e tempos arbitrários de transição.
- **Problema atual:** Não conformidade com acessibilidade visual e transições discordantes.
- **Impacto:** Risco de desconforto vestibular para usuários sensíveis a movimento.
- **Diretriz:** Adotar tokens de movimento com curva refinada e regra universal de `prefers-reduced-motion`.
- **Correção exata:** Inserir `--motion-duration-fast: 150ms`, `--motion-duration-normal: 240ms`, `--motion-duration-slow: 350ms`, `--motion-ease-default: cubic-bezier(0.16, 1, 0.3, 1)` e `@media (prefers-reduced-motion: reduce)`.
- **Arquivos afetados:** `styles.css`, `css/client-portal.css`
- **Componentes afetados:** Todas as animações e transições.
- **Risco:** Baixo (`AUTO_APPLY`).
- **Critério de aceite:** Ao ativar `prefers-reduced-motion`, todas as transições de deslocamento e opacidade reduzem para duração instantânea (`0.01ms`).

---

### DESIGN CONTRACT: DC-007
- **Categoria:** Responsividade
- **Severidade:** P1
- **Localização:** `styles.css:1980-2010`, `css/client-portal.css:830-853`
- **Evidência:** Existência de apenas 4 regras esparsas para `1024px`, `900px`, `800px` e `768px`.
- **Problema atual:** Em resoluções móveis menores (ex: iPhone 390px) ou tablets (834px), componentes sofrem com compressão e rolagem horizontal.
- **Impacto:** Degradação de experiência em dispositivos móveis e tablets.
- **Diretriz:** Implementar a grade canônica: `1440px`, `1280px`, `1024px`, `834px`, `768px`, `640px`, `390px`.
- **Correção exata:** Adicionar bloco sistemático de media queries responsivas ao final de `styles.css` e `css/client-portal.css`.
- **Arquivos afetados:** `styles.css`, `css/client-portal.css`
- **Componentes afetados:** App Shell, Sidebar, View Container, Grids de Ambientes, Galerias.
- **Risco:** Médio (`SAFE_REVIEW`).
- **Critério de aceite:** Visualização limpa sem overflow horizontal indesejado em 390px, 640px, 768px, 834px, 1024px, 1280px e 1440px.

---

### DESIGN CONTRACT: DC-008
- **Categoria:** Tokens / Z-Index
- **Severidade:** P2
- **Localização:** `styles.css` (15 valores arbitrários entre 1 e 10000)
- **Evidência:** Uso de `z-index: 9999`, `z-index: 10000`, `z-index: 120`.
- **Problema atual:** Modais ou dropdowns podem ficar ocultos atrás de outros elementos sobrepostos.
- **Impacto:** Bugs de sobreposição e clique inacessível em modais.
- **Diretriz:** Escala semântica de z-index: `--z-base: 1`, `--z-elevated: 10`, `--z-dropdown: 50`, `--z-sticky: 100`, `--z-drawer: 200`, `--z-modal: 1000`, `--z-toast: 2000`.
- **Correção exata:** Declarar tokens e atribuir aos elementos de layout, overlays e modais.
- **Arquivos afetados:** `styles.css`
- **Componentes afetados:** Header, Sidebar, Dropdown, Modal, Toast, Lightbox.
- **Risco:** Baixo (`AUTO_APPLY`).
- **Critério de aceite:** Modais e toasts sempre renderizam com previsibilidade no plano visual correto.

---

### DESIGN CONTRACT: DC-009
- **Categoria:** Superfícies / Glassmorphism
- **Severidade:** P1
- **Localização:** `styles.css:65-67`, `client-portal.css`
- **Evidência:** Efeito glass aplicado indistintamente em cards estáticos de conteúdo.
- **Problema atual:** Excesso de transparência causa ruído de leitura e penaliza performance de renderização.
- **Impacto:** Visual "SaaS genérico" em oposição à estética limpa arquitetônica.
- **Diretriz:** Limitar glass para superfícies flutuantes e de sobreposição (navbar, sidebar recolhida, drawers, modais). Cards comuns devem possuir superfície opaca ou semi-opaca refinada com hairline border (`rgba(255,255,255,0.08)`).
- **Correção exata:** Refatorar `.card`, `.stat-card` e `.env-card` para usar superfícies limpas com contraste adequado.
- **Arquivos afetados:** `styles.css`
- **Componentes afetados:** Cards, Painéis, Sidebar, Header.
- **Risco:** Baixo (`AUTO_APPLY`).
- **Critério de aceite:** Cartões de conteúdo não exibem blur pesado competindo com imagens; contraste WCAG AA preservado.

---

### DESIGN CONTRACT: DC-010
- **Categoria:** Componentes / Botões
- **Severidade:** P1
- **Localização:** `styles.css:382-450`
- **Evidência:** Variações de estilo, sombras neon em hover, ausência de microinteração ativa consistente.
- **Problema atual:** Ações secundárias competem com primárias; clique não gera feedback tátil refinado.
- **Impacto:** Incerteza de interação do usuário.
- **Diretriz:** Sistema de botões consistente: `.btn-primary` (accent sólido), `.btn-secondary` (superfície sutil), `.btn-outline` (hairline border), `.btn-ghost` (transparente), `.btn-danger` (vermelho semântico). Adicionar `:active { transform: scale(0.98); }` e foco com anel sem ofuscar.
- **Correção exata:** Consolidar estilos base de `.btn`, `.btn-sm`, `.btn-lg` e estados (`:hover`, `:active`, `:focus-visible`, `:disabled`).
- **Arquivos afetados:** `styles.css`, `css/client-portal.css`
- **Componentes afetados:** Todos os botões do Studio e Portal.
- **Risco:** Baixo (`AUTO_APPLY`).
- **Critério de aceite:** Todos os botões reagem com microinteração suave e clara distinção entre ação primária e secundária.

---

### DESIGN CONTRACT: DC-011
- **Categoria:** Componentes / Inputs
- **Severidade:** P2
- **Localização:** `styles.css:451-520`
- **Evidência:** `.form-input`, `.form-select`, `.form-textarea` com alturas e bordas heterogêneas.
- **Problema atual:** Formulários com espaçamento interno desigual e anel de foco agressivo.
- **Impacto:** Preenchimento cansativo e sensação de desalinhamento.
- **Diretriz:** Padronizar altura (38px para standard), padding (`8px 12px`), border-radius (`--radius-sm`), borda sutil e anel de foco refinado (`box-shadow: 0 0 0 2px var(--accent-subtle)`).
- **Correção exata:** Unificar classes de formulário em `styles.css`.
- **Arquivos afetados:** `styles.css`
- **Componentes afetados:** Todos os inputs de modais e painéis de configuração.
- **Risco:** Baixo (`AUTO_APPLY`).
- **Critério de aceite:** Alinhamento milimétrico de labels e inputs com foco consistente e acessível.

---

### DESIGN CONTRACT: DC-012
- **Categoria:** Componentes / Modais
- **Severidade:** P2
- **Localização:** `styles.css:1829-1950`
- **Evidência:** Modais com sombras dispersas e bordas grossas.
- **Problema atual:** Modais pesados visualmente que cobrem a tela sem transição suave de entrada.
- **Impacto:** Quebra de fluxo de trabalho.
- **Diretriz:** Aplicar `--elevation-modal`, `--radius-lg`, hairline border e transição suave de `opacity` e `scale(0.98)` para `scale(1)`.
- **Correção exata:** Atualizar `.modal-overlay` e `.modal-card` com o novo padrão de elevação e transição.
- **Arquivos afetados:** `styles.css`
- **Componentes afetados:** Modal de Projeto, Modal de Ambiente, Modal de Entrega, Modal de Upload, Modal de Relatório.
- **Risco:** Baixo (`AUTO_APPLY`).
- **Critério de aceite:** Modais abrem com animação sutil e contorno refinado.

---

### DESIGN CONTRACT: DC-013
- **Categoria:** Componentes / Sidebar
- **Severidade:** P2
- **Localização:** `styles.css:180-260`
- **Evidência:** Sidebar com borda espessa e padding de itens descalibrado.
- **Problema atual:** A sidebar compete visualmente com a área de trabalho central.
- **Impacto:** Redução da sensação de amplitude da interface.
- **Diretriz:** Sidebar silenciosa: fundo sóbrio (`--color-surface`), hairline border à direita (`--color-border-subtle`), itens com raio `--radius-sm`, hover discreto e item ativo com indicador limpo.
- **Correção exata:** Refatorar `.app-sidebar`, `.sidebar-nav-item`, `.sidebar-brand` e `.sidebar-footer`.
- **Arquivos afetados:** `styles.css`
- **Componentes afetados:** Navegação lateral do ArqVértice Studio.
- **Risco:** Baixo (`AUTO_APPLY`).
- **Critério de aceite:** Navegação elegante, discreta e com contraste perfeito.

---

### DESIGN CONTRACT: DC-014
- **Categoria:** Componentes / Header
- **Severidade:** P2
- **Localização:** `styles.css:261-340`
- **Evidência:** Topbar com altura variável e botões de cabeçalho desalinhados dos breadcrumbs.
- **Problema atual:** Cabeçalho ocupa espaço vertical desnecessário.
- **Impacto:** Perda de área útil em monitores menores.
- **Diretriz:** Header compacto (altura fixa de 52px), glass sutil com blur de 12px, alinhamento flexível entre breadcrumbs e ações rápidas (autosave, tema, criar projeto).
- **Correção exata:** Ajustar `.app-header`, `.header-breadcrumbs` e `.header-right`.
- **Arquivos afetados:** `styles.css`
- **Componentes afetados:** Topbar de todas as telas do Studio.
- **Risco:** Baixo (`AUTO_APPLY`).
- **Critério de aceite:** Header refinado, sem concorrer com o conteúdo da área principal.

---

### DESIGN CONTRACT: DC-015
- **Categoria:** Código / Inline Styles
- **Severidade:** P2
- **Localização:** `index.html` (52 instâncias de `style="..."`)
- **Evidência:** Estilos inline aplicados diretamente em tags de layout, ícones, modal de relatório e lightbox.
- **Problema atual:** Dificuldade de sobrescrita em temas e falta de centralização.
- **Impacto:** Inconsistência de manutenção e violação de boas práticas de separação de estilo.
- **Diretriz:** Substituir estilos inline repetitivos por classes semânticas e utilitárias de CSS (`.report-table`, `.report-kpi-grid`, etc.).
- **Correção exata:** Criar as classes correspondentes em `styles.css` e atualizar as marcações em `index.html`.
- **Arquivos afetados:** `index.html`, `styles.css`
- **Componentes afetados:** Modal de Relatório Executivo, Lightbox, Cabeçalho.
- **Risco:** Baixo (`AUTO_APPLY`).
- **Critério de aceite:** `index.html` limpo de inline styles estruturais; fidelidade de impressão do `html2pdf.js` 100% preservada.

---

### DESIGN CONTRACT: DC-016
- **Categoria:** Portal do Cliente / Harmonização
- **Severidade:** P1
- **Localização:** `css/client-portal.css`
- **Evidência:** `client-portal.css` possui 11 cores hexadecimais próprias e 15 tamanhos de fonte isolados sem herdar as variáveis mestre.
- **Problema atual:** O Portal do Cliente aparenta ser um produto visualmente desconectado do Studio mestre.
- **Impacto:** Quebra da experiência contínua do cliente e do arquiteto.
- **Diretriz:** Harmonizar o Portal com os mesmos tokens semânticos de tipografia, raios, elevação, glass controlado e movimento acessível.
- **Correção exata:** Atualizar `css/client-portal.css` para herdar os tokens semânticos de `:root` e aplicar os breakpoints canônicos.
- **Arquivos afetados:** `css/client-portal.css`
- **Componentes afetados:** Navegação do Portal, Cards de Entrega, Visualizador de Documentos, Galeria de Renders, Especificações, Comentários.
- **Risco:** Médio (`SAFE_REVIEW`).
- **Critério de aceite:** Portal do Cliente com estética unificada, preservando todas as funções de H01 a H12 e testes 100% aprovados.
