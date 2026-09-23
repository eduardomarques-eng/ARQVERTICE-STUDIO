# ARQVERTICE STUDIO — WORKSPACE CENTRAL DE PROJETOS E AMBIENTES
## DOCUMENTAÇÃO TÉCNICA E MANUAL DE OPERAÇÃO (PROMPT A04)

**Data de Implementação:** 21 de Setembro de 2026  
**Versão:** v2.4.0  
**Status:** Implementado e Operacional  

---

### 1. VISÃO GERAL DA ARQUITETURA

O **ArqVértice Studio** evoluiu formalmente de uma ferramenta isolada de cronograma de obra única para uma **plataforma completa de gestão multi-projeto, ambientes 3D, controle de revisões e cronograma integrado**.

A plataforma mantém preservada a inteligência de negócios de arquitetura e engenharia desenvolvida no projeto original (`cronograma-residencia-praia`), unificando-a em uma arquitetura de camadas com:
1. **Estado Central Reativo com Autosave (`js/state.js`)**: Entidades relacionais de Clientes, Projetos, Ambientes, Tarefas, Notificações e Sessão ativa salvas em tempo real com indicador visual de estado.
2. **Executive Dashboard (`js/dashboard.js`)**: Painel de comando com indicadores consolidados (Projetos Ativos, Obras em Andamento, Entregas Pendentes, Ambientes Aprovados), lista de projetos prioritários, próximas entregas e feed de notificações.
3. **Catálogo & Gestão Multi-Projeto (`js/projects.js`)**: Filtros por status de ciclo de vida (Planejamento, Briefing, Estudos, Projeto, Visualização, Finalizado), pesquisa full-text, ordenação e cartões executivos com ficha cadastral e percentual de avanço físico.
4. **Workspace Contextual do Projeto com 15 Etapas (`js/projects.js`)**: Barra de navegação contextual horizontal para as 15 etapas canônicas:
   - `CLIENTE`: Ficha completa do cliente, contatos, dados de faturamento e endereço.
   - `BRIEFING`: Integração com o questionário estruturado de 32 perguntas e links de preenchimento.
   - `LEVANTAMENTO`: Vistorias técnicas, arquivos de topografia e nuvens de pontos.
   - `ESTUDOS`: Estudos volumétricos e anteprojeto.
   - `PROJETO`: Dossiê cadastral, dados do lote, quadra, zoneamento, memoriais e documentação legal.
   - `AMBIENTES`: Grade e atalhos para os setores e cômodos da edificação.
   - `VISUALIZAÇÃO`: Modelagem 3D, renders panorâmicos e tour virtual.
   - `MATERIAIS`: Paletas de acabamento e amostras físicas.
   - `MÓVEIS`: Mobiliário solto e marcenaria sob medida.
   - `MOODBOARDS`: Painéis conceituais de estilo e iluminação.
   - `APRESENTAÇÃO`: Pranchas finais de venda e aprovação com o cliente.
   - `REVISÕES`: Protocolos formais de controle de alterações.
   - `RELATÓRIOS`: Histórico de emissões e atas técnicas.
   - `ENTREGA`: Termos de homologação final e as-built.
   - `CRONOGRAMA`: Cronograma multidisciplinar integrado completo.
5. **Workspace do Ambiente com 11 Abas Técnicas (`js/environments.js`)**:
   - Cabeçalho com versão ativa (`V01`, `V02`, `V03 APROVADA`), metadados espaciais e atalho de upload.
   - 11 Abas Técnicas: `RESUMO`, `REFERÊNCIAS`, `PLANTA`, `PERSPECTIVAS`, `CÂMERAS`, `RENDERS`, `MÓVEIS`, `MATERIAIS`, `MOODBOARD`, `REVISÕES`, `MEMÓRIA`.
   - **Aba Resumo**: Destaque para o render homologado em alta definição, ficha técnica (área líquida, pé-direito, pavimento, estilo), objetivos, última decisão tomada, gerenciador interativo de pendências e **Travas de Consistência por IA** (9 travas independentes: Geometria, Layout, Câmera, Aberturas, Materiais, Iluminação, Mobiliário, Decoração, Paisagismo).
   - **Uploads Classificados**: Mapeamento unívoco de arquivos vinculados a: `projeto` + `ambiente` + `categoria` (planta, perspectiva, elevação, corte, foto, referência, material, mobiliário, render, documento, outro) + `versão`.
6. **Módulo de Cronograma Integrado (`js/cronograma-module.js`)**:
   - Preservação de 100% da inteligência prévia:
     - Faixa de fases executivas com destaque dinâmico para a fase atual ("ESTAMOS AQUI").
     - Roster da equipe técnica com cálculo dinâmico de carga e avanço físico médio (Eduardo Marques, Luan Almeida, Erick Santiago).
     - Visualização dual instantânea: **Kanban Board** (com 3 raias e suporte drag-and-drop) e **DataGrid / Tabela** com edição inline de progresso e datas.
     - Modal de Relatório Executivo formal A4 com indicadores, tabela completa e bloco quádruplo de assinaturas via `html2pdf.js`.

---

### 2. ESTRUTURA DE ARQUIVOS IMPLEMENTADA

```
ARQVERTICE-STUDIO/
├── index.html                    # Shell mestre da aplicação com modais e print wrapper
├── styles.css                    # Design System definitivo (Dark/Light, tokens, responsividade)
├── logo.png                      # Identidade visual oficial da ArqVértice
├── js/
│   ├── state.js                  # Central de Estado reativo (StudioState) e persistência
│   ├── dashboard.js              # Dashboard executivo principal
│   ├── projects.js               # Catálogo de projetos e Workspace com 15 etapas
│   ├── environments.js           # Gestão de ambientes, 11 abas e Travas de Consistência
│   ├── cronograma-module.js      # Módulo integrado de cronograma (Kanban, Tabela, Relatório PDF)
│   └── app.js                    # Roteador central (StudioApp), modais e uploads
└── docs/
    └── WORKSPACE_CENTRAL.md      # Este documento técnico
```

---

### 3. PROTOCOLO DE PERSISTÊNCIA E SEGURANÇA DE DADOS

- **Autosave Transparente**: Qualquer operação de alteração (criação de projeto, edição de dados do cliente, alteração de status de ambiente, progresso de entrega no cronograma, inclusão de pendência ou acionamento de trava IA) persiste imediatamente no armazenamento local e aciona o indicador `#studio-save-indicator` na barra superior.
- **Estrutura Relacional de IDs**: Utilização de identificadores canônicos e únicos (`prj-...`, `cli-...`, `amb-...`, `tsk-...`), garantindo compatibilidade direta com a camada de persistência PostgreSQL modelada no Bloco A03 (`database/migrations/`).
