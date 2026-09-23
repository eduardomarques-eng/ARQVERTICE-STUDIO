# MATRIZ ESTRATÉGICA: PRESERVAR, MELHORAR, SUBSTITUIR
## ARQVERTICE STUDIO — DIRETRIZES DE TRANSIÇÃO E GOVERNANÇA
**Data:** 21 de Setembro de 2026  
**Documento:** MATRIZ_PRESERVAR_MELHORAR_SUBSTITUIR.md  

---

### 1. PRINCÍPIO NORTEADOR

Conforme estabelecido no **Bloco 00 (Diretrizes Operacionais)**:
> *"NADA será descartado simplesmente porque parece antigo. Antes de substituir: 1. identifique; 2. documente; 3. confirme dependências; 4. implemente substituto; 5. teste; 6. compare; 7. só então arquive."*

Esta matriz define o destino de cada ativo de código, componente visual, regra de negócio e infraestrutura identificado na auditoria técnica.

---

### 2. MATRIZ DETALHADA POR ELEMENTO

| Elemento / Componente | Onde reside hoje | Classificação | Justificativa Técnica e Operacional |
| :--- | :--- | :--- | :--- |
| **Identidade Visual e Design Tokens** | `styles.css` (tokens `:root`, cores por disciplina) | **PRESERVAR** | A paleta de cores é extremamente elegante, funcional e perfeitamente alinhada com a imagem institucional da ArqVértice. Os tokens devem ser transportados diretamente para o novo design system. |
| **Faixa de Fases ("Estamos Aqui")** | `painel-cliente.js` (`renderPhaseStrip`) | **PRESERVAR** | A lógica que identifica o gargalo real da obra (fase atual = primeira fase com progresso pendente) é o coração da transparência do escritório para o cliente. |
| **Resumo Executivo em Linguagem Natural** | `painel-cliente.js` (`buildResumoExecutivo`) | **PRESERVAR** | A capacidade de sintetizar o andamento em 2 frases para o cliente economiza tempo de reunião e transmite autoridade técnica. |
| **Critérios de Cores e Prazos do PDF** | `app.js` (`getProgressColor`, `getDaysRemaining`) | **PRESERVAR** | As faixas de alerta (≥99% dourado, 40-98% verde, 0-39% azul; alerta para entregas em ≤7 dias) traduzem fielmente os padrões de controle executivo da ArqVértice. |
| **Modo Offline com Failover Automático** | `api-cliente.js` (`Remoto.detectar`) | **PRESERVAR** | A capacidade de operar mesmo sem internet ou sem banco de dados configurado evita que o profissional fique travado em canteiro de obra. |
| **Alternador de Tema (Claro / Escuro)** | `app.js` (`initTheme`, `toggleTheme`) | **PRESERVAR** | Oferece conforto visual para longas horas de trabalho no escritório e deve permanecer acessível no topo da aplicação. |
| **Tabela de Controle com Edição In-line** | `app.js` (`renderDataGrid`, inputs diretos) | **MELHORAR** | A rapidez de editar datas e percentuais diretamente na tabela deve ser mantida, adicionando feedback visual de salvamento e debounce de digitação. |
| **CRUD e Modal de Tarefas** | `app.js` (`openEditModal`, `saveTaskFromModal`) | **MELHORAR** | Manter o slider sincronizado de porcentagem e o preview de status, expandindo o formulário para permitir vincular a etapa a um **Ambiente específico**. |
| **Exportação de Dados em JSON** | `app.js` (`exportTasksJSON`) | **MELHORAR** | Evoluir de um simples dump do array local para um sistema formal de backup e portabilidade de dados do projeto. |
| **Painel de Filtros e Busca** | `app.js` (`getFilteredTasks`) | **MELHORAR** | A lógica de filtragem combinada (slider de dias + disciplina + projetista + busca) deve ser encapsulada em hooks reativos para resposta instantânea sem re-renderizar todo o DOM. |
| **Quadro Kanban Disciplinar** | `app.js` (`renderKanban`, Drag and Drop nativo) | **REESTRUTURAR** | O conceito de agrupar as tarefas por disciplina dentro de cada coluna é excelente, mas o código precisa ser reescrito com uma biblioteca moderna de drag-and-drop (`@dnd-kit`), eliminando a destruição de nós DOM. |
| **Relatório Executivo em PDF** | `app.js` (`downloadPDFReport`), `html2pdf.js` | **REESTRUTURAR** | A estrutura de apresentação, tabelas e assinaturas deve ser rigorosamente mantida, mas o motor deve migrar para geração server-side ou componente nativo (`@react-pdf/renderer`), garantindo fidelidade em qualquer dispositivo. |
| **Ficha Técnica e Dossiê da Obra** | `index.html` (master card), `api/projeto.js` | **REESTRUTURAR** | O formulário e a apresentação visual devem ser preservados, mas a persistência deve deixar de ser um singleton (`id=1`) e passar a suportar múltiplos projetos e clientes. |
| **Equipe Técnica** | `painel-cliente.js` (`TEAM_ROSTER`) | **REESTRUTURAR** | Os cartões visuais com cálculo de carga de trabalho são ótimos, mas a lista de colaboradores deve vir do banco de dados para suportar diferentes equipes por obra. |
| **Módulo de Briefing de Clientes** | `briefing-arqvertice` (roteiro de 32 perguntas) | **INTEGRAR** | As perguntas, categorias e ilustrações SVG devem ser integradas ao sistema central através de rotas públicas seguras (`/briefing/[token]`), gravando direto no PostgreSQL. |
| **Site Institucional / Portfólio** | `arqvertice-site` | **INTEGRAR** | O portfólio de obras concluídas e a página de contato devem compartilhar a mesma infraestrutura ou linkar diretamente para as áreas de briefing do sistema. |
| **Autenticação via Header `x-chave-admin`** | `api/_db.js` (`escritaAutorizada`) | **SUBSTITUIR** | Deve ser substituída por autenticação moderna multiusuário (NextAuth / Supabase Auth) com controle de acesso baseado em papéis (Admin, Engenheiro, Arquiteto, Cliente). |
| **Manipulação Manual de DOM via `innerHTML`** | `app.js` (`renderApp`) | **SUBSTITUIR** | Deve ser substituída por reconciliação declarativa com React/TSX. |
| **Dependências em CDNs Externas (`unpkg`, `cdnjs`)** | `index.html` (`<script src="...">`) | **SUBSTITUIR** | Devem ser substituídas por pacotes versionados instalados localmente via npm. |
| **Carga de Dados de Seed Estático** | `app.js` (`SEED_TASKS`, `resetToSeedData`) | **ARQUIVAR** | O array fixo de 14 tarefas deve ser arquivado como arquivo de migration/seed inicial do banco de dados, deixando o frontend limpo. |
| **Servidor em PowerShell Local** | `scripts/servidor-local.ps1` | **ARQUIVAR** | Substituído pelo comando nativo de desenvolvimento `npm run dev`. |

---

### 3. RESUMO QUANTITATIVO DA TRANSIÇÃO

```
┌────────────────────────────────────────────────────────┐
│ TOTAL DE ITENS AUDITADOS: 21                           │
├─────────────────────────┬──────────────────────────────┤
│ PRESERVAR               │ 6 itens (28,6%)              │
│ MELHORAR                │ 4 itens (19,0%)              │
│ REESTRUTURAR            │ 4 itens (19,0%)              │
│ INTEGRAR                │ 2 itens ( 9,5%)              │
│ SUBSTITUIR              │ 3 itens (14,3%)              │
│ ARQUIVAR                │ 2 itens ( 9,5%)              │
└─────────────────────────┴──────────────────────────────┘
```

**Conclusão Estratégica:** Mais de 76% do valor funcional, visual e de regras de negócio do sistema atual será **PRESERVADO, MELHORADO OU REESTRUTURADO**, garantindo que nenhum conhecimento técnico ou esforço anterior seja desperdiçado na evolução para o **ARQVERTICE STUDIO**.
