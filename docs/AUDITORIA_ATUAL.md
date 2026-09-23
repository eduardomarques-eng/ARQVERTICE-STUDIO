# AUDITORIA TÉCNICA, FUNCIONAL E ESTRUTURAL
## ARQVERTICE STUDIO — FOTOGRAFIA DO ESTADO ATUAL
**Data da Auditoria:** 21 de Setembro de 2026  
**Documento:** AUDITORIA_ATUAL.md  
**Status:** Concluído / Sem alterações de código destrutivas  

---

### 1. INTRODUÇÃO E OBJETIVO

Esta auditoria técnica foi realizada conforme as diretrizes do **Bloco 00** e do **Prompt A01** do projeto **ARQVERTICE STUDIO**. O objetivo primário é realizar uma fotografia completa, rigorosa e minuciosa do ecossistema de software atual da **ArqVértice Arquitetura e Interiores**, mapeando o que existe, como funciona, suas limitações, riscos técnicos e pontos fortes antes de qualquer iniciativa de modernização.

Em conformidade estrita com o **Princípio de Não-Perda (Preservação Ativa)**:
- Nenhuma linha de código foi apagada ou modificada;
- Nenhuma dependência foi adicionada aos projetos existentes;
- O esquema de produção no banco de dados permanece intacto;
- Nenhuma migração automática de framework foi realizada.

---

### 2. FONTES PRIMÁRIAS ANALISADAS

A auditoria cobriu três ecossistemas de código fonte locais e remotos, além das referências documentais do projeto:

1. **Aplicação Principal de Cronograma Multidisciplinar (`cronograma-residencia-praia`)**:
   - **Repositório GitHub:** `https://github.com/eduardomarques-eng/cronograma-residencia-praia.git`
   - **Deploy de Produção:** `https://cronograma-residencia-praia-mlym.vercel.app/`
   - **Diretório Local Inspecionado:** `C:\Users\erick\cronograma-residencia-praia`
   - **Escopo:** Frontend Vanilla (`index.html`, `app.js`, `painel-cliente.js`, `api-cliente.js`, `styles.css`), Serverless Backend (`api/_db.js`, `api/projeto.js`, `api/status.js`, `api/tarefas.js`), Schema SQL (`database/schema.sql`), deploy Vercel (`vercel.json`) e submódulo interno de briefing.

2. **Aplicação Autônoma de Briefing de Clientes (`briefing-arqvertice`)**:
   - **Diretório Local Inspecionado:** `C:\Users\erick\briefing-arqvertice`
   - **Escopo:** Interface guiada de entrevista presencial e online (`index.html`, `briefing.js`, `roteiro.js`, `exportar.js`, `styles.css`, `vercel.json`).

3. **Site Institucional Restaurado (`arqvertice-site`)**:
   - **Diretório Local Inspecionado:** `C:\Users\erick\arqvertice-site`
   - **Escopo:** Recuperação do conteúdo institucional e identidade visual da ArqVértice via snapshot da Wayback Machine (`index.html`, `main.js`, `styles.css`, páginas legais).

4. **Diretrizes e Contexto Institucional (`ARQVERTICE-STUDIO`)**:
   - `00_CONTEXTO/01_LINKS-DAS-APLICACOES.md`
   - `00_CONTEXTO/02_DIRETRIZES-ARQVERTICE.md`
   - `00_CONTEXTO/03_DECISOES-PROJETO.md`
   - `01_PROMPTS/00_INTRODUCAO.md`
   - `99_REFERENCIAS/logos/logo-arqvertice.png`

---

### 3. SÍNTESE DO DIAGNÓSTICO DO ESTADO ATUAL

| Dimensão | Estado Atual | Classificação Geral | Diagnóstico Resumido |
| :--- | :--- | :--- | :--- |
| **Frontend** | Vanilla HTML5 / CSS3 / ES6 (sem build) | Funcional, porém monolítico | Interface rica, responsiva, com excelente paleta visual e UX adaptada, mas com renderização não reativa, acoplamento no DOM e manipulação de estado global. |
| **Backend** | Vercel Serverless Functions (Node.js) | Enxuto e eficiente | 4 funções bem isoladas em `api/`, com sanitização de SQL parametrizado, mas sem autenticação de usuários, autorização baseada em chave estática e modelo restrito a obra única. |
| **Banco de Dados** | PostgreSQL gerenciado (Neon / Supabase) | Singleton (Projeto Único) | Estrutura relacional com triggers e colunas geradas funcionais, mas com constraint restritiva `CHECK (id = 1)` e sem chave estrangeira entre tarefas e projetos. |
| **Deploy & Infra** | Vercel Serverless (Zero Config) | Estável para uso atual | Configurado com headers de segurança e cache adequados, porém dependente de CDNs externas não empacotadas para bibliotecas críticas (`lucide`, `html2pdf`). |
| **Briefing** | Vanilla JS com Roteiro em Objeto | Rico em regras de negócio | Contém 32 perguntas estruturadas e ilustrações SVG arquitetônicas, mas opera 100% desconectado do banco de dados (apenas `localStorage`). |
| **Integração Global** | Inexistente (Aplicações em silos) | Silos independentes | Cronograma, briefing e site institucional operam como sistemas totalmente isolados sem comunicação entre si. |

---

### 4. PRINCIPAIS PONTOS FORTES ENCONTRADOS

1. **Robustez do Failover Híbrido (Local vs Nuvem)**:
   - A camada `api-cliente.js` possui uma estratégia exemplar de detecção automática do estado da infraestrutura. Se o banco PostgreSQL estiver configurado e saudável, o sistema sincroniza via nuvem; se não houver rede ou banco, opera sem falhas em modo offline/local usando `localStorage`.

2. **Riqueza e Fidelidade das Regras de Negócio de Arquitetura & Obra**:
   - As 5 disciplinas canônicas (`Arquitetura`, `3D`, `Estrutura`, `Complementares`, `Obras`) refletem exatamente o fluxo real do escritório ArqVértice.
   - O cálculo do status das tarefas é automatizado via coluna gerada no banco e espelhado no front: 0% = "Não Iniciado", 1-99% = "Em Andamento", 100% = "Finalizado".
   - A "Faixa de Fases" implementa o conceito "Estamos Aqui" baseado na primeira fase com progresso pendente, revelando gargalos reais em vez de seguir ordenação cega.

3. **Geração de Relatórios Executivos em PDF de Alto Nível**:
   - A aplicação de cronograma gera um relatório executivo formatado para impressão A4 com parecer técnico contextualizado, estatísticas consolidadas, tabela de entregas e bloco quádruplo de assinaturas formais (incluindo o cliente).
   - A aplicação de briefing gera relatório em 4 páginas com diagramação técnica e ilustrações vetoriais exclusivas.

4. **Zero Vulnerabilidade a SQL Injection**:
   - O backend em `api/` utiliza exclusivamente consultas preparadas/parametrizadas do driver `pg` (`$1`, `$2`, etc.), eliminando riscos de injeção SQL nas operações CRUD.

---

### 5. LIMITAÇÕES ESTRUTURAIS CRÍTICAS PARA O ARQVERTICE STUDIO

1. **Modelo de Dados Limitado a Obra Única (Singleton `id = 1`)**:
   - A tabela `projeto` possui a constraint `id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1)`.
   - A tabela `tarefas` **não** possui coluna `projeto_id` nem chave estrangeira.
   - O sistema foi concebido para gerenciar apenas a "Residência de Praia (Pedro)". A expansão para suporte a múltiplos clientes, múltiplos projetos e múltiplos ambientes exige refatoração do modelo de dados.

2. **Ausência de Autenticação de Usuários e Permissões**:
   - Não há cadastro de usuários, login, JWT ou sessões.
   - O controle de escrita atual depende unicamente do cabeçalho `x-chave-admin` comparado com a variável `ADMIN_KEY`. Quem possui a chave pode alterar tudo; quem não possui, opera em modo somente leitura.
   - O cliente e a equipe técnica acessam a mesma aplicação.

3. **Inexistência de Módulos de Ambientes, Memória, Imagens e Revit**:
   - O sistema atual não possui suporte a upload de arquivos, visualização de pranchas, perspectivas, renderizações, controle de versão de imagens ou memória multicamada (Projeto, Ambiente, Imagem, Versão, Locks e Decisões).

4. **Acoplamento Extremo no Frontend Vanilla**:
   - O arquivo `app.js` possui 1.649 linhas e concentra renderização de Kanban, DataGrid, modais, listeners de teclado/mouse, filtros, cálculos estatísticos e geração de PDF.
   - A cada alteração (filtro, digitação ou drag-and-drop), o DOM inteiro das listas e tabelas é destruído e reconstruído via concatenação de strings HTML (`innerHTML`), o que impede escalabilidade e compromete o estado de foco e seleção.

---

### 6. ESTRUTURA DA DOCUMENTAÇÃO GERADA

Para cumprir todos os requisitos do Prompt A01, a auditoria gerou os seguintes documentos detalhados:

1. [`docs/MAPA_FUNCIONALIDADES.md`](file:///c:/Users/erick/ARQVERTICE-STUDIO/docs/MAPA_FUNCIONALIDADES.md) — Inventário completo de recursos e classificação técnica.
2. [`docs/MAPA_FRONTEND.md`](file:///c:/Users/erick/ARQVERTICE-STUDIO/docs/MAPA_FRONTEND.md) — Análise minuciosa de index.html, scripts, CSS, estado e DOM.
3. [`docs/MAPA_BACKEND.md`](file:///c:/Users/erick/ARQVERTICE-STUDIO/docs/MAPA_BACKEND.md) — Análise dos endpoints serverless, conexão pg, validação e auth.
4. [`docs/MAPA_BANCO.md`](file:///c:/Users/erick/ARQVERTICE-STUDIO/docs/MAPA_BANCO.md) — Análise do schema.sql, tabelas, índices, triggers e plano de migração.
5. [`docs/MAPA_DEPLOY.md`](file:///c:/Users/erick/ARQVERTICE-STUDIO/docs/MAPA_DEPLOY.md) — Infraestrutura Vercel, variáveis de ambiente, headers e cold starts.
6. [`docs/MAPA_DEPENDENCIAS.md`](file:///c:/Users/erick/ARQVERTICE-STUDIO/docs/MAPA_DEPENDENCIAS.md) — Mapeamento de bibliotecas locais, CDNs e dependências sistêmicas.
7. [`docs/RISCOS_ATUAIS.md`](file:///c:/Users/erick/ARQVERTICE-STUDIO/docs/RISCOS_ATUAIS.md) — Matriz de riscos de segurança, integridade, escalabilidade e negócio.
8. [`docs/MATRIZ_PRESERVAR_MELHORAR_SUBSTITUIR.md`](file:///c:/Users/erick/ARQVERTICE-STUDIO/docs/MATRIZ_PRESERVAR_MELHORAR_SUBSTITUIR.md) — Decisões granulares item a item.
9. [`docs/RECOMENDACAO_ARQUITETURA.md`](file:///c:/Users/erick/ARQVERTICE-STUDIO/docs/RECOMENDACAO_ARQUITETURA.md) — Análise comparativa entre 5 abordagens técnicas e proposta de evolução.
10. [`docs/ARQVERTICE_CURRENT_STATE.json`](file:///c:/Users/erick/ARQVERTICE-STUDIO/docs/ARQVERTICE_CURRENT_STATE.json) — Retrato do sistema em formato estruturado machine-readable.
