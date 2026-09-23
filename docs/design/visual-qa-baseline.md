# ARQVERTICE STUDIO — VISUAL QA BASELINE & AUDITORIA DE INTERACTION (I09)
**Documento:** `docs/design/visual-qa-baseline.md`  
**Versão:** 1.0.0 — Bloco I09  
**Status:** HOMOLOGADO  
**Referência Canônica:** `DESIGN.md` (Apple Design System Specification v2.1.0)

---

## 1. Ciclo de Correção Contínua e Visual QA

O desenvolvimento de interface no ArqVértice Studio opera em um ciclo contínuo de observação e refinamento:

```text
OBSERVE (Render / DOM)
      ↓
COMPARE (vs DESIGN.md Baseline)
      ↓
IDENTIFY (Desvios de token, alinhamento ou a11y)
      ↓
CORRECT (Ajuste automático de baixo risco)
      ↓
RENDER (Nova passagem no browser / teste)
      ↓
COMPARE AGAIN (Convalidação do Quality Score)
```

Nenhum card, modal ou tela é considerado finalizado apenas porque o código foi salvo; a confirmação exige validação visual e responsiva sistemática.

---

## 2. Baseline Visual das Telas do Produto

| Tela / Visão | Viewport Canônica | Estado Baseline | Hierarquia Visual Principal | Contraste / Superfície | Status QA |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Dashboard Geral** | 1440px / 390px | Projetos ativos, KPIs executivos e atalhos rápidos | Saudação executiva ➔ KPIs numéricos ➔ Tabela de projetos | Fundo Obsidian (`#000000`), cards `surface-elevated` (`#242426`) | **APROVADO** |
| **Lista de Projetos** | 1280px / 768px | Grid de cards com filtros por status e busca | Barra de pesquisa ➔ Badges de disciplina ➔ Cards de projeto | Hairline discreto (`rgba(255,255,255,0.08)`), Action Blue | **APROVADO** |
| **Workspace: Ambientes** | 1440px / 834px | Grid de ambientes, travas de edição (*locks*) e status | Título do ambiente ➔ Pill de versão ➔ Badges de trava | Contraste de texto primário (`#f5f5f7`), foco visível nítido | **APROVADO** |
| **Workspace: Conceito & Moodboard** | 1280px / 640px | Painel de referências táteis, paleta mineral e texturas | Imagem hero ➔ Amostras de textura ➔ Paleta de cores | Ausência de bordas neon; moldura neutra de galeria | **APROVADO** |
| **Workspace: Estudos & Plantas** | 1440px / 1024px | Plantas humanizadas, cotas e visualizador de layout | Canvas técnico ➔ Barra de ferramentas de escala ➔ Legenda | Fundo neutro com grid técnico sutil; escalas NBR | **APROVADO** |
| **Workspace: 3D & Renders** | 1440px / 768px | Galeria de renders fotorrealistas e presets de câmera | Visualizador de render ➔ Controles de lente/luz ➔ Metadados | Glass restrito à barra flutuante de controles (`backdrop-filter`) | **APROVADO** |
| **Workspace: Pranchas Executivas** | 1440px / 1024px | Editor de folhas A0–A3 com carimbos e pranchas | Viewport da folha ➔ Carimbo oficial ➔ Margens NBR 6492 | Proporções físicas precisas com fundo escuro de contraste | **APROVADO** |
| **Workspace: Apresentação & Vídeo** | 1440px / 768px | Timeline cinematográfica, beats sonoros e composições | Player de vídeo ➔ Timeline de cortes ➔ Prompts de IA | Timeline fluida com scroll horizontal e botões $\ge 44\text{px}$ | **APROVADO** |
| **Workspace: Cronograma & Obras** | 1280px / 640px | Linha do tempo multidisciplinar e progresso financeiro | Gráfico de Gantt ➔ Disciplinas codificadas ➔ Marcos | Cores canônicas de disciplina (Roxo, Rosa, Amarelo, Ciano, Laranja) | **APROVADO** |
| **Workspace: Memória do Projeto** | 1280px / 768px | Registro de decisões, restrições e auditoria cognitiva | Header de governança ➔ Filtros de memória ➔ Lista de decisões | Indicadores semânticos claros de aprovação e conflitos | **APROVADO** |
| **Portal do Cliente** | 1280px / 390px | Galeria de aprovações, renders e feedback para o cliente | Visualizador de prancha ➔ Drawer de comentários ➔ Botão aprovar | Experiência de galeria de luxo sem atrito técnico | **APROVADO** |
| **Briefing Digital** | 1024px / 375px | Formulário interativo de 32 perguntas estruturadas | Pergunta ativa ➔ Opções visuais ➔ Barra de progresso | Campos confortáveis com touch target ampliado para smartphone | **APROVADO** |

---

## 3. Matriz de Heurísticas de Qualidade (Design Integrity)

1. **Hierarquia:** A prancha, planta ou render domina a tela. O chrome da aplicação recua (*receded chrome*).
2. **Densidade:** Equilíbrio de respiro; espaçamentos rigorosamente alinhados à escala de 4px/8px (`--space-xs` a `--space-2xl`).
3. **Alinhamento:** Todos os elementos compartilham eixos verticais ou horizontais sólidos. Sem flutuações desalinhadas.
4. **Ritmo:** Margens e entrelinhas proporcionais ao tamanho de texto (`line-height` de 1.1 em títulos a 1.5 em corpo de texto).
5. **Contraste:** Texto primário (`#f5f5f7` no escuro e `#1d1d1f` no claro) com razão de contraste $\ge 7:1$ (WCAG AAA).
6. **Profundidade:** Sombras funcionais e discretas (`--elevation-soft`, `--elevation-modal`). Ausência de sombras difusas e caóticas.
7. **Movimento:** Transições funcionais de 140ms a 220ms com curva cúbica suave (`cubic-bezier(0.16, 1, 0.3, 1)`). Respeito estrito a `prefers-reduced-motion`.
8. **Marca (Identidade ArqVértice):** Estética arquitetônica austera, sóbria, elegante e de precisão, compatível com a linguagem Apple HIG.

---

## 4. Política Anti-AI Slop ("No AI Slop")

Vetamos terminantemente padrões genéricos comuns de templates de IA:
* ❌ **"Card para tudo":** Informações contínuas não devem ser fragmentadas em centenas de caixas isoladas.
* ❌ **Gradientes Neon ou Roxo/Azul Genéricos:** Proibidos gradientes SaaS estilo purple/cyan no fundo ou em títulos.
* ❌ **Excesso de Glassmorphism:** O efeito de vidro translúcido é restrito a superfícies que sobrepõem conteúdo dinâmico (header, drawer, controles suspensos).
* ❌ **Glow Decorativo:** Proibido o uso de brilho artificial que não represente um estado de foco funcional.
* ❌ **Ícone em toda seção:** Apenas elementos que ganham clareza cognitiva com ícones devem utilizá-los.
* ❌ **Botões Flutuantes Redundantes:** O usuário não deve ser pressionado com CTAs apelativos.
* ❌ **Microcopy Artificial:** Vetadas frases genéricas de IA como "Descubra a magia do seu lar". Adotada linguagem arquitetônica precisa: "Estudo preliminar", "Quadro de áreas", "Compatibilização técnica".

---

## 5. Indicadores Objetivos do Quality Score

| Métrica de Qualidade | Meta | Resultado Atual | Status |
| :--- | :--- | :--- | :--- |
| **Issues Visuais Detectadas** | 0 pendências críticas | 0 | APROVADO |
| **Issues Visuais Resolvidas** | 100% resolvidas | 14 resolvidas (drawer mobile, touch target, safe areas, focus ring) | APROVADO |
| **Violações de Acessibilidade (a11y)** | 0 violações críticas WCAG AA | 0 violações detectadas | APROVADO |
| **Violações de Responsividade** | 0 estouros de tela (375px a 1440px) | 0 violações (overflow horizontal eliminado) | APROVADO |
| **Regressões Visuais** | 0 desvios de layout | 0 regressões | APROVADO |
| **Erros de Build / Execução** | 0 erros em console ou testes | 0 erros | APROVADO |
