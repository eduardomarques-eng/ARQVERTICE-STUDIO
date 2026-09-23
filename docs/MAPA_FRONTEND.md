# MAPA DO FRONTEND E ANÁLISE DE CÓDIGO
## ARQVERTICE STUDIO — FOTOGRAFIA ESTRUTURAL DA INTERFACE
**Data:** 21 de Setembro de 2026  
**Documento:** MAPA_FRONTEND.md  

---

### 1. ESTRUTURA DE ARQUIVOS E COMPONENTES

O frontend da aplicação principal de cronograma está contido em 5 arquivos no diretório `C:\Users\erick\cronograma-residencia-praia`:

```
cronograma-residencia-praia/
├── index.html          (58.6 KB, 1.027 linhas) — Casca HTML, marcação dos modais, relatórios e templates
├── styles.css          (70.3 KB, 1.637 linhas) — Design tokens, temas escuro/claro, Kanban, tabelas e media print
├── app.js              (58.4 KB, 1.649 linhas) — Monolito de controle, eventos, CRUD, Kanban, datagrid e PDF
├── painel-cliente.js   (17.9 KB,   428 linhas) — Faixa de fases "Estamos Aqui", equipe técnica e parecer
└── api-cliente.js      ( 7.8 KB,   246 linhas) — Cliente HTTP, failover local/nuvem, gestão da chave admin
```

Além disso, a aplicação de briefing (`C:\Users\erick\briefing-arqvertice`) possui:
```
briefing-arqvertice/
├── index.html          (15.3 KB, 320 linhas) — Estrutura e biblioteca de 10 símbolos SVG customizados
├── styles.css          (15.5 KB, 480 linhas) — Estilos próprios alinhados com a identidade ArqVértice
├── briefing.js         (11.1 KB, 340 linhas) — Motor de renderização, progresso e persistência em localStorage
├── roteiro.js          (13.1 KB, 193 linhas) — Dicionário de 32 perguntas e opções de resposta
└── exportar.js         ( 7.2 KB, 210 linhas) — Motor de diagramação de PDF (4 páginas) e exportador JSON
```

---

### 2. MAPEAMENTO DE COMPONENTES VISUAIS E ELEMENTOS DE UI

| Componente | Elemento DOM | Arquivo de Origem | Responsabilidade |
| :--- | :--- | :--- | :--- |
| **Master Header** | `<header class="app-master-header">` | `index.html` (27-85) | Identidade visual, logotipo, status de sincronização, botões de ação global e seletor de tema. |
| **Dossiê da Obra** | `<div class="master-info-card">` | `index.html` (87-185) | Grid com especificações técnicas (área, terreno, datas, zoneamento, tipologia, localização). |
| **Faixa de Fases** | `<div id="fase-track">` | `painel-cliente.js` (109-193) | Linha do tempo interativa das 5 etapas com destaque "Estamos Aqui" e detalhamento de gargalos. |
| **Equipe Técnica** | `<div id="team-grid">` | `painel-cliente.js` (198-247) | Cards com fotos/avatares, percentual de conclusão e entregas sob responsabilidade de cada projetista. |
| **Barra de Filtros** | `<section class="filter-dashboard-card">` | `index.html` (290-362) | Slider de dias restantes, botões de atalho rápido (chips), dropdowns e busca textual. |
| **Quadro Kanban** | `<div id="view-kanban">` | `app.js` (474-616) | 3 colunas de status divididas em grupos por disciplina (`PHASE_MODEL`), com suporte a drag-and-drop. |
| **Tabela Datagrid** | `<div id="view-datagrid">` | `app.js` (620-776) | Tabela densa com edição in-line de porcentagens (`<input type="number">`) e datas (`<input type="text">`). |
| **Modal de Tarefa** | `<div id="task-modal">` | `index.html` (485-580) | Formulário de criação/edição com slider interativo sincronizado com input numérico e preview. |
| **Modal de Obra** | `<div id="project-modal">` | `index.html` (585-715) | Formulário com 10 campos cadastrais, botão para preencher dados de exemplo e botão de limpeza. |
| **Modal de Relatório**| `<div id="report-modal">` | `index.html` (720-1011) | Área de impressão A4 com dados da obra, parecer técnico, tabela formatada e 4 assinaturas. |
| **Toast Flutuante** | `<div id="toast">` | `app.js` (1016-1029) | Notificação temporária de feedback de ações do usuário (salvo, erro, tema alterado). |

---

### 3. GESTÃO DE ESTADO DA APLICAÇÃO (STATE MANAGEMENT)

O estado da aplicação é gerido globalmente através de um objeto estático em memória (`AppState`), declarado no escopo global de `app.js`:

```javascript
const AppState = {
  tasks: [],
  projectInfo: { ...DEFAULT_PROJECT_INFO },
  filters: {
    daysLimit: 30,
    disciplina: 'all',
    projetista: 'all',
    status: 'all',
    search: ''
  },
  sort: {
    column: 'data_conclusao',
    direction: 'asc'
  },
  currentView: 'kanban',
  draggedTaskId: null
};
```

#### Ciclo de Vida e Fluxo de Dados:
1. **Carregamento Inicial (`DOMContentLoaded`)**:
   - `loadProjectInfo()` lê de `localStorage('cronograma_residencia_praia_project_info_v1')`.
   - `loadTasks()` lê de `localStorage('cronograma_residencia_praia_tasks_v1')`. Se vazio, faz o fallback para o `SEED_TASKS`.
   - `renderApp()` renderiza o DOM com os dados locais imediatos (zero delay perceptível).
   - `iniciarSincronizacao()` (`api-cliente.js`) é invocado em background: testa `/api/status`; se a nuvem estiver ativa, faz `GET /api/tarefas` e `GET /api/projeto`, sobrescreve o `AppState`, salva no `localStorage` como cache e dispara novo `renderApp()`.
2. **Mutações de Tarefas**:
   - Qualquer edição (drag-and-drop, edição in-line, modal) executa mutação in-place no array `AppState.tasks`.
   - Imediatamente chama `saveTasks()` (`localStorage`) e `renderApp()`.
   - Em seguida, chama assincronamente `Remoto.atualizarTarefa()`, `Remoto.criarTarefa()` ou `Remoto.removerTarefa()`, enviando um HTTP PUT/POST/DELETE com `x-chave-admin`.

---

### 4. IDENTIFICAÇÃO DE DÍVIDAS TÉCNICAS E PONTOS CRÍTICOS

#### 4.1. Funções Monolíticas e Renderização Destrutiva do DOM
- **Problema:** A função `renderApp()` é acionada a cada tecla digitada na busca ou clique em filtros. Ela chama `renderKanban()` ou `renderDataGrid()`, que utilizam `element.innerHTML = ''` e reconstroem centenas de nós do DOM via strings concatenadas.
- **Impacto:** 
  - Perda de foco ao digitar em inputs caso a renderização ocorra durante o input;
  - Desperdício de ciclos de CPU do navegador com recálculos frequentes de layout e reflow;
  - Risco de memory leaks com event listeners órfãos em nós destruídos (ex.: drag listeners recriados continuamente).

#### 4.2. Acoplamento no Escopo Global (`window`)
- **Problema:** Múltiplas funções dependem de estarem anexadas ao objeto global `window` para funcionar com atributos inline no HTML (ex.: `onclick="openEditModal('${task.id}')"` e `onclick="deleteTask('${task.id}')"`).
- **Impacto:** Ausência total de encapsulamento; impede a utilização de empacotadores de módulos (Vite, Rollup, Webpack) sem refatoração prévia dos manipuladores de evento.

#### 4.3. Estado Espalhado e Duplicação de Regras de Negócio
- **Problema:**
  - A lista de disciplinas canônicas está definida em `painel-cliente.js` (`PHASE_MODEL`), mas também é validada separadamente em `api/tarefas.js` (`const DISCIPLINAS = [...]`) e no HTML `<select id="form-disciplina">`.
  - A regra de status (`0% = Não Iniciado`, `100% = Finalizado`, `outro = Em Andamento`) existe em `app.js` (`calculateStatus`), é duplicada como coluna gerada no PostgreSQL (`schema.sql`) e repetida na lógica do relatório.
  - A equipe técnica está fixada com strings em `painel-cliente.js` (`TEAM_ROSTER`), no relatório (`app.js`), no seed SQL e no rodapé do HTML de impressão.

#### 4.4. Dependência Frágil de CDNs Não Versionadas no Repositório
- **Problema:** O frontend depende de CDNs externas diretamente no `<head>`:
  - `https://unpkg.com/lucide@latest` (carrega sempre a versão mais recente, sujeito a quebra súbita de API);
  - `https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js`;
  - Fontes do Google Fonts.
- **Impacto:** Se o unpkg sofrer instabilidade ou atualizar com breaking change, os ícones da aplicação quebram imediatamente; em ambientes com restrição de rede ou offline completo, ícones e geração de PDF tornam-se inoperantes.

#### 4.5. Limitação do Motor de Geração de PDF (`html2pdf.js`)
- **Problema:** `html2pdf.js` funciona clonando o DOM visível e renderizando em canvas via `html2canvas` antes de converter para PDF (`jsPDF`).
- **Armadilha Identificada no Código:** O elemento de impressão não pode ter `position: absolute` (documentado no README do briefing), pois o container colapsa para altura zero. Além disso, em dispositivos móveis a quebra de página frequentemente corta tabelas e assinaturas no meio da folha.

---

### 5. SISTEMA DE DESIGN E FOLHA DE ESTILOS (`styles.css`)

O arquivo `styles.css` possui 1.637 linhas e é extremamente bem trabalhado em termos de identidade visual:
- **Tokens CSS em `:root` e `[data-theme="dark"]`**:
  - Paleta com variáveis semânticas: `--bg-primary`, `--bg-card`, `--text-primary`, `--text-secondary`, `--accent-primary`, `--border-color`.
  - Cores dedicadas para cada disciplina: `--c-arq` (roxo), `--c-3d` (rosa), `--c-est` (dourado/âmbar), `--c-comp` (ciano), `--c-obr` (laranja).
  - Cores oficiais do PDF: `--pdf-gold`, `--pdf-green`, `--pdf-blue`, `--pdf-red`.
- **Tipografia:** Montserrat (corpo e títulos) e JetBrains Mono (datas, porcentagens e códigos técnicos).
- **Estilos de Impressão (`@media print`)**:
  - Estilos específicos que forçam fundo branco, ocultam a interface do sistema e formatam a área de impressão para formato A4 portrait.

---

### 6. OPORTUNIDADES DE MODULARIZAÇÃO IMEDIATA

A arquitetura do frontend é uma candidata ideal para transição orientada a componentes React com TypeScript:

```
src/
├── components/
│   ├── layout/
│   │   ├── MasterHeader.tsx
│   │   ├── ProjectDossier.tsx
│   │   └── ThemeToggle.tsx
│   ├── phases/
│   │   ├── PhaseStrip.tsx          (antigo renderPhaseStrip)
│   │   └── PhaseDetail.tsx
│   ├── team/
│   │   ├── TeamGrid.tsx            (antigo renderTeamBlock)
│   │   └── TeamCard.tsx
│   ├── kanban/
│   │   ├── KanbanBoard.tsx         (antigo renderKanban)
│   │   ├── KanbanColumn.tsx
│   │   ├── KanbanGroup.tsx
│   │   └── KanbanCard.tsx
│   ├── datagrid/
│   │   ├── TaskDataGrid.tsx        (antigo renderDataGrid)
│   │   └── InlinePercentInput.tsx
│   ├── filters/
│   │   ├── FilterBar.tsx
│   │   └── DaysLimitSlider.tsx
│   ├── modals/
│   │   ├── TaskModal.tsx
│   │   └── ProjectModal.tsx
│   └── report/
│       ├── ReportModal.tsx
│       └── ExecutiveReportDocument.tsx (geração nativa)
├── hooks/
│   ├── useTasks.ts
│   ├── useProject.ts
│   ├── useFilters.ts
│   └── useSyncState.ts
└── types/
    ├── task.ts
    ├── project.ts
    └── phase.ts
```
