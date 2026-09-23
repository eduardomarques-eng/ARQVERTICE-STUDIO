# MAPA DE FUNCIONALIDADES E MATRIZ OPERACIONAL
## ARQVERTICE STUDIO — INVENTÁRIO DO SISTEMA ATUAL
**Data:** 21 de Setembro de 2026  
**Documento:** MAPA_FUNCIONALIDADES.md  

---

### 1. VISÃO GERAL DAS FUNCIONALIDADES EXISTENTES

O ecossistema atual é composto principalmente pela aplicação de **Cronograma e Acompanhamento Físico de Obras** (`cronograma-residencia-praia`) e pelo **Módulo de Briefing de Clientes** (`briefing-arqvertice`), com apoio institucional do site (`arqvertice-site`).

Abaixo está o inventário de todas as funcionalidades mapeadas no código, classificadas conforme sua utilidade para o fluxo de valor real da **ArqVértice Arquitetura e Interiores**.

---

### 2. CLASSIFICAÇÃO DETALHADA POR FUNCIONALIDADE

#### 2.1. Gestão Cadastral e Ficha Técnica da Obra
- **Descrição:** Cadastro dos dados fundamentais da obra (Nome da Obra, Cliente, Localização, Identificação Cadastral Lote/Quadra, Zona de Uso, Tipologia, Área Construída, Área do Lote, Data de Início, Previsão de Término, Prazo Total em dias).
- **Onde vive:** `app.js` (linhas 16-30, 258-318, 1312-1390), `index.html` (linhas 87-185), `api/projeto.js`, `database/schema.sql` (tabela `projeto`).
- **Estado atual:** Operacional em modal e cabeçalho, com suporte a preenchimento de exemplo e reset de campos. Persistido no PostgreSQL (`id=1`) ou `localStorage`.
- **Classificação:** **REESTRUTURAR**
- **Justificativa Técnica:** A estrutura precisa deixar de ser um singleton fixo e passar a pertencer a uma tabela `projetos` com chave estrangeira para `clientes`. Os campos em texto livre (`data_inicio`, `previsao_conclusao`, `area_construida`) devem ser tipados apropriadamente (`DATE`, `NUMERIC`).

---

#### 2.2. Indicador de Origem dos Dados (Nuvem vs. Local)
- **Descrição:** Selo dinâmico no cabeçalho informando se a aplicação está conectada à nuvem (`is-nuvem` ou `is-nuvem-admin`) ou rodando em modo offline/isolado (`is-local`). Ao clicar, permite inserir a chave de administrador (`x-chave-admin`) ou sair do modo de edição.
- **Onde vive:** `api-cliente.js` (linhas 16-45, 164-220), `index.html` (linhas 50-52).
- **Estado atual:** Extremamente engenhoso e robusto para o modelo atual.
- **Classificação:** **SUBSTITUIR**
- **Justificativa Técnica:** Na arquitetura final com múltiplos usuários, este mecanismo de "chave de admin global no prompt do navegador" será substituído por um sistema de autenticação formal (NextAuth / Supabase Auth) com RBAC (Role-Based Access Control: Administrador, Arquiteto, Engenheiro, Cliente).

---

#### 2.3. Painel de Fases do Empreendimento ("Estamos Aqui")
- **Descrição:** Faixa visual horizontal de 5 fases sequenciais (Arquitetura, Projeto 3D, Estrutural, Complementares e Execução da Obra). Identifica a fase atual em tempo real baseando-se na primeira etapa com progresso < 100%. Exibe barra de avanço percentual, total de etapas concluídas e um box de detalhamento com "Em execução nesta fase", "Próximas entregas" e "Resumo executivo".
- **Onde vive:** `painel-cliente.js` (linhas 15-193), `index.html` (linhas 188-245).
- **Estado atual:** Altamente sofisticado, com UX voltada para comunicação executiva de alto nível com o cliente.
- **Classificação:** **PRESERVAR** (e **MELHORAR**)
- **Justificativa Técnica:** É um dos maiores diferenciais de produto da ArqVértice. A lógica de "gargalo real" (se a fase 1 não fechou 100%, ela continua sendo a fase atual mesmo que a fase 2 tenha começado) deve ser integralmente preservada e modularizada em componente React/TSX.

---

#### 2.4. Resumo Executivo em Linguagem Natural
- **Descrição:** Algoritmo que gera um parágrafo dinâmico sintetizando o avanço geral do projeto, a fase em curso, o percentual executado e a quantidade de entregas atrasadas/em recuperação.
- **Onde vive:** `painel-cliente.js` (linhas 84-104, `buildResumoExecutivo()`).
- **Estado atual:** Perfeitamente funcional, alimenta tanto o painel quanto o relatório PDF.
- **Classificação:** **PRESERVAR** (e **INTEGRAR** com IA)
- **Justificativa Técnica:** Excelente regra de negócio. Futuramente, além do texto baseado em regras fixas, o motor de IA poderá enriquecer o resumo com destaques de decisões de projeto tomadas nos ambientes.

---

#### 2.5. Bloco de Equipe Técnica Multidisciplinar
- **Descrição:** Exibição dos responsáveis técnicos fixos do escritório (Eduardo Marques - Arquiteto Projetista; Luan Almeida - Engenheiro Calculista; Erick Santiago - Engenheiro de Obra), calculando em tempo real a carga de entregas atribuídas, percentual médio de conclusão e tarefa atualmente em execução.
- **Onde vive:** `painel-cliente.js` (linhas 33-37, 198-247), `index.html` (linhas 247-285).
- **Estado atual:** Totalmente atrelado aos nomes fixos via array estático no código.
- **Classificação:** **REESTRUTURAR**
- **Justificativa Técnica:** A apresentação visual e a métrica de carga devem ser preservadas, mas a lista de colaboradores deve vir do banco de dados (tabela `usuarios` / `equipe_projeto`), permitindo alocar profissionais diferentes conforme o projeto.

---

#### 2.6. Quadro Kanban com Agrupamento por Disciplina
- **Descrição:** Quadro ágil com 3 colunas de status (Não Iniciado, Em Andamento, Finalizado). Dentro de cada coluna, os cards são agrupados e ordenados automaticamente pelas disciplinas de projeto (Arquitetura, 3D, Estrutura, Complementares, Obra). Suporta arrastar e soltar (HTML5 Drag and Drop) com recálculo imediato de porcentagem (mover para Em Andamento define 50%, Finalizado define 100%, Não Iniciado define 0%).
- **Onde vive:** `app.js` (linhas 474-616, 911-952), `index.html` (linhas 365-420).
- **Estado atual:** Altamente funcional e visualmente refinado, mas destrói e recria o DOM completo em cada interação.
- **Classificação:** **PRESERVAR** (regras de UX) e **REESTRUTURAR** (camada de renderização)
- **Justificativa Técnica:** A organização visual e o agrupamento por disciplina são excelentes para a ArqVértice. No entanto, o código deve ser reescrito com estado reativo imutável e biblioteca moderna de drag-and-drop (`@dnd-kit` ou similar).

---

#### 2.7. Tabela de Controle Multidisciplinar (Datagrid com Edição In-Line)
- **Descrição:** Visão tabular com listagem completa das etapas, contendo badges de disciplina, avatar do responsável, input editável in-line para data (DD-MM-YYYY) e input numérico editável in-line para porcentagem (0-100%), com barra de progresso colorida e status calculado.
- **Onde vive:** `app.js` (linhas 620-776), `index.html` (linhas 422-480).
- **Estado atual:** Extremamente prático para edição rápida pela equipe técnica em reuniões de alinhamento.
- **Classificação:** **PRESERVAR** e **MELHORAR**
- **Justificativa Técnica:** O comportamento de digitação imediata e recálculo automático deve ser mantido, com adição de debounce, feedback visual de salvamento e ordenação por coluna clicável.

---

#### 2.8. Filtragem Multidimensional Dinâmica
- **Descrição:** Filtros combinados em tempo real:
  - Vencimento em até X dias (slider numérico de 1 a 180 dias ou presets em chips: 7d, 15d, 30d, 60d, Todas);
  - Dropdown por Disciplina;
  - Dropdown por Projetista;
  - Dropdown por Status;
  - Campo de busca textual livre (filtra descrição, disciplina e projetista simultaneamente).
- **Onde vive:** `app.js` (linhas 431-469, 1135-1204), `index.html` (linhas 290-362).
- **Estado atual:** Processamento síncrono in-memory de alta performance.
- **Classificação:** **PRESERVAR**
- **Justificativa Técnica:** A experiência de filtragem é fluida e resolve perfeitamente a busca de prazos pelo gestor. Deve ser mantida e abstraída em hooks de estado.

---

#### 2.9. Gerenciador de Tarefas (CRUD Completo)
- **Descrição:** Criação, edição, exclusão e alteração rápida de tarefas. Modal com slider interativo sincronizado com input numérico e visualização em tempo real do status resultante.
- **Onde vive:** `app.js` (linhas 813-906, 957-1011), `index.html` (linhas 485-580), `api/tarefas.js`.
- **Estado atual:** Operacional em nuvem e local, com sanitização e validação de schema.
- **Classificação:** **MELHORAR**
- **Justificativa Técnica:** Preservar a facilidade de criação rápida, adicionando vínculos futuros: vincular etapa a um Ambiente, a uma Aprovação de Render ou a um Marco de Briefing.

---

#### 2.10. Relatório Executivo em PDF com Formatação Contratual
- **Descrição:** Geração de documento em layout formal para folha A4 com marca d'água/logo da ArqVértice, metadados cadastrais da obra, faixa de fases impressa, parecer técnico descritivo, tabela de entregas com destaques de alerta e bloco de 4 assinaturas formais. Utiliza `html2pdf.js` com tratamento específico de quebra de página (`avoid: pagebreak`).
- **Onde vive:** `app.js` (linhas 1394-1617), `painel-cliente.js` (linhas 315-427), `index.html` (linhas 720-1011).
- **Estado atual:** Gera um PDF executivo de alta fidelidade visual.
- **Classificação:** **PRESERVAR** (e **REESTRUTURAR** motor de geração)
- **Justificativa Técnica:** O layout e o teor formal do documento são vitais para o relacionamento da ArqVértice com o cliente. O motor, porém, deve migrar de clonagem de DOM no cliente (`html2pdf.js`) para geração no servidor (`@react-pdf/renderer` ou Puppeteer), garantindo uniformidade entre sistemas operacionais e dispositivos móveis.

---

#### 2.11. Aplicação de Briefing Guiado (32 Perguntas + SVG + PDF)
- **Descrição:** Roteiro completo de alinhamento com o cliente dividido em 2 partes (Parte 1: Entrevista aberta com 5 seções; Parte 2: Questionário objetivo com 5 seções), com perguntas do tipo textarea, radio, checkbox, campo livre "outro" e cartões ilustrados por SVG próprios. Conta com barra de progresso geral, persistência em `localStorage` e exportação do briefing em PDF diagramado (4 páginas) e JSON.
- **Onde vive:** `C:\Users\erick\briefing-arqvertice` (`briefing.js`, `roteiro.js`, `exportar.js`, `index.html`, `styles.css`).
- **Estado atual:** Muito bem estruturado funcionalmente, mas opera em silo isolado, sem banco de dados e sem vínculo direto com os projetos da ArqVértice.
- **Classificação:** **INTEGRAR** e **REESTRUTURAR**
- **Justificativa Técnica:** Deve ser integrado ao sistema central: o escritório gera um link público com hash único (`/briefing/[token]`), o cliente preenche sem precisar de login, as respostas gravam na tabela `briefings` e os dados alimentam automaticamente o programa de necessidades e os ambientes do projeto.

---

#### 2.12. Alternador de Tema (Claro / Escuro)
- **Descrição:** Troca de paleta em tempo real via atributo `data-theme` no `<html>`, com persistência no `localStorage`.
- **Onde vive:** `app.js` (linhas 1068-1080), `styles.css`.
- **Estado atual:** Totalmente implementado com tokens em variáveis CSS.
- **Classificação:** **PRESERVAR**
- **Justificativa Técnica:** Os tokens de cores e a identidade estética em tons escuros e claros já estão prontos e devem ser integrados à nova arquitetura de design system.

---

#### 2.13. Exportação e Restauração de Dados (JSON e Seed)
- **Descrição:** Botão para download instantâneo das tarefas em formato JSON e botão para restaurar o estado padrão do seed ("Residência de Praia").
- **Onde vive:** `app.js` (linhas 1034-1064), `index.html` (linhas 69-77).
- **Estado atual:** Funciona localmente. No modo nuvem, o reset alerta que o banco deve ser restaurado via SQL.
- **Classificação:** **MELHORAR** (Backup & Auditoria)
- **Justificativa Técnica:** Manter como recurso administrativo de exportação/backup dos projetos.

---

### 3. RESUMO CONSOLIDADO DA CLASSIFICAÇÃO

| Funcionalidade | Classificação | Destino na Arquitetura ArqVertice Studio |
| :--- | :--- | :--- |
| **Faixa de Fases ("Estamos Aqui")** | **PRESERVAR** | Componente visual central no Dashboard do Projeto e Painel do Cliente. |
| **Resumo Executivo Dinâmico** | **PRESERVAR** | Motor de síntese de status, enriquecido com dados da IA. |
| **Filtragem Multidimensional** | **PRESERVAR** | Preservar experiência ágil, encapsulada em hooks de filtragem. |
| **Alternador de Tema (Dark/Light)** | **PRESERVAR** | Adotar tokens do CSS atual no tema base da aplicação. |
| **Tabela de Controle In-Line** | **MELHORAR** | Manter edição direta com debounce e sincronização transacional. |
| **CRUD de Tarefas** | **MELHORAR** | Vincular tarefas a Ambientes, Renders e Marcos Contratuais. |
| **Exportação e Backup JSON** | **MELHORAR** | Evoluir para módulo formal de importação/exportação de projetos. |
| **Quadro Kanban Disciplinar** | **REESTRUTURAR** | Manter agrupamento e regras de negócio; modernizar para `@dnd-kit`. |
| **Relatório Executivo em PDF** | **REESTRUTURAR** | Manter layout e conteúdo; migrar motor para `@react-pdf/renderer`. |
| **Ficha Técnica da Obra** | **REESTRUTURAR** | Desacoplar do modelo singleton; criar tabela relacional `projetos`. |
| **Equipe Técnica** | **REESTRUTURAR** | Deixar de ser array estático; ler membros e alocações do banco. |
| **Briefing do Cliente** | **INTEGRAR** | Migrar para módulo com link público seguro e preenchimento integrado. |
| **Chave de Admin via Prompt** | **SUBSTITUIR** | Substituir por autenticação formal multiusuário com papéis (RBAC). |
| **Carga de Seed Estático** | **ARQUIVAR** | Substituir por migrations/seeds formais gerenciados por ORM. |
