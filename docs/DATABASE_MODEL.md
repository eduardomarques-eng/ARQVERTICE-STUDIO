# MODELO DE DADOS DEFINITIVO (POSTGRESQL)
## ARQVERTICE STUDIO — ESQUEMA RELACIONAL COMPLETO
**Versão:** 1.0.0  
**Data:** 21 de Setembro de 2026  
**Documento:** DATABASE_MODEL.md  

---

### 1. VISÃO GERAL DO MODELO

O banco de dados do **ARQVERTICE STUDIO** foi estruturado em **PostgreSQL 16** para superar definitivamente a limitação do projeto único (`CHECK id = 1`) identificada no A01, sem perder nenhuma das informações ou regras de negócio existentes.

O modelo é 100% relacional, auditável, preparado para versionamento contínuo e concebido para suportar de forma consistente os 22 domínios essenciais da plataforma.

---

### 2. DICIONÁRIO DE TABELAS POR MÓDULO

#### 2.1. Módulo Core (Usuários, Clientes, Projetos e Equipe)

| Tabela | Chave Primária | Chaves Estrangeiras (FK) | Finalidade e Regras Invariantes |
| :--- | :--- | :--- | :--- |
| `users` | `id UUID` | — | Cadastro da equipe técnica da ArqVértice. Papéis restritos via CHECK (`ADMINISTRADOR`, `ARQUITETO`, `ENGENHEIRO`, `CLIENTE_READONLY`). |
| `clients` | `id UUID` | — | Cadastro de pessoas físicas ou jurídicas contratantes. Suporta soft delete (`deleted_at`). **1 Cliente pode possuir N Projetos**. |
| `projects` | `id UUID` | `client_id -> clients(id)` | Entidade central de cada empreendimento. Normaliza áreas em `NUMERIC(10,2)` e datas em `DATE` reais. Elimina o singleton antigo. |
| `project_members` | `id UUID` | `project_id -> projects`, `user_id -> users` | Alocação de profissionais por projeto com papel específico (`role_in_project`) e indicador de liderança técnica (`is_lead`). |
| `project_stages` | `id UUID` | `project_id -> projects` | Estágios macro do ciclo de vida da obra (briefing, estudo preliminar, executivo, obra). |

---

#### 2.2. Módulo Espacial (Ambientes e Câmeras)

| Tabela | Chave Primária | Chaves Estrangeiras (FK) | Finalidade e Regras Invariantes |
| :--- | :--- | :--- | :--- |
| `environments` | `id UUID` | `project_id -> projects(id)` | **Unidade espacial central.** Categorizado por `environment_type` (SALA, COZINHA, SUITE, DECK...). Possui área útil, pé-direito e ordenação visual. |
| `cameras` | `id UUID` | `environment_id -> environments(id)` | Pontos de observação tridimensionais vinculados ao Revit. Parâmetros de lente (`focal_length_mm`), altura e coordenadas de alvo. |

---

#### 2.3. Módulo de Ativos e Arquivos (Storage Desacoplado)

| Tabela | Chave Primária | Chaves Estrangeiras (FK) | Finalidade e Regras Invariantes |
| :--- | :--- | :--- | :--- |
| `files` | `id UUID` | `project_id -> projects`, `environment_id -> environments` | **Metadados de ativos.** O binário físico reside no bucket S3/R2. Guarda `hash_sha256` para integridade, tamanho em bytes, MIME type e versão. |
| `reference_groups`| `id UUID` | `project_id -> projects`, `environment_id -> environments` | Agrupadores temáticos de referências (ex: "Iluminação Indireta", "Marcenaria"). |
| `environment_references`| `id UUID`| `environment_id -> environments`, `file_id -> files` | Vínculo de referências visuais com o ambiente (painel Pinterest/Instagram). |

---

#### 2.4. Módulo de Briefing (Separação Rigorosa de Fala do Cliente vs. ArqVértice)

| Tabela | Chave Primária | Chaves Estrangeiras (FK) | Finalidade e Regras Invariantes |
| :--- | :--- | :--- | :--- |
| `briefings` | `id UUID` | `project_id -> projects(id)` | Sessão de briefing versionada com token público seguro (`access_token`) para acesso anônimo sem login. |
| `briefing_sections` | `id UUID` | `briefing_id -> briefings(id)` | As 10 seções do questionário (Parte 1 Aberta e Parte 2 Objetiva). |
| `briefing_questions`| `id UUID` | `section_id -> briefing_sections(id)` | Catálogo das 32 perguntas dinâmicas com suporte a tipos, cartões ilustrados SVG e regras condicionais. |
| `briefing_submissions`| `id UUID`| `briefing_id -> briefings(id)` | Registro de envio formal do cliente com timestamp, IP e dados de contato. |
| **`briefing_answers`** | `id UUID` | `submission_id -> briefing_submissions`, `question_id -> briefing_questions` | **A RESPOSTA ORIGINAL E INTACTA DO CLIENTE.** Guarda texto livre e opções marcadas. Inviolável após envio. |
| **`briefing_confirmations`**| `id UUID`| `briefing_id -> briefings`, `answer_id -> briefing_answers` | **A INTERPRETAÇÃO TÉCNICA DA ARQVÉRTICE.** Traduz a fala do cliente em impacto arquitetural, estimativa de custo e nível de prioridade. |

---

#### 2.5. Módulo de Materiais, Móveis e Fornecedores

| Tabela | Chave Primária | Chaves Estrangeiras (FK) | Finalidade e Regras Invariantes |
| :--- | :--- | :--- | :--- |
| `suppliers` | `id UUID` | — | Parceiros e lojas homologadas (marmoraria, marcenaria, iluminação). |
| `products` | `id UUID` | `supplier_id -> suppliers` | Catálogo de produtos com SKU, unidade e preço estimado. |
| `materials` | `id UUID` | `supplier_id -> suppliers`, `image_file_id -> files` | Especificações de pisos, revestimentos, pedras, tintas, tecidos e acabamentos. |
| `furniture_items`| `id UUID` | `supplier_id -> suppliers`, `image_file_id -> files` | Itens de mobiliário com medidas (LxPxA), fabricante e modelo. |
| **`environment_materials`**| `id UUID`| `environment_id -> environments`, `material_id -> materials` | **Vínculo Material <-> Ambiente.** Aplicação de superfície (Piso, Bancada). **Proveniência obrigatória:** `DADO_REAL`, `CALCULADO`, `ESTIMADO`, `INFORMADO_USUARIO`, `SUGERIDO_IA`. |
| **`environment_furniture`**| `id UUID`| `environment_id -> environments`, `furniture_item_id -> furniture_items` | **Vínculo Móvel <-> Ambiente.** Quantidade e proveniência obrigatória. |

---

#### 2.6. Módulo de Memória Estruturada, Locks e IA Engine

| Tabela | Chave Primária | Chaves Estrangeiras (FK) | Finalidade e Regras Invariantes |
| :--- | :--- | :--- | :--- |
| `styles` / `project_styles` | `id UUID` | `project_id -> projects`, `style_id -> styles` | Estilos arquitetônicos (Minimalista, Rústico, Contemporâneo...) vinculados à obra. |
| **`design_decisions`** | `id UUID` | `project_id -> projects`, `environment_id -> environments` | **Memória Estruturada.** Classifica o conhecimento em: `FATO_CONFIRMADO`, `DECISAO_PROJETO`, `PREFERENCIA_CLIENTE`, `RESTRICAO_TECNICA`, `REFERENCIA_ESTETICA`, `HIPOTESE_ESTUDO`, `OBSERVACAO_GERAL`, `VERSAO_APROVADA`. |
| **`locks`** | `id UUID` | `environment_id -> environments(id)` (UNIQUE) | **Bloqueios Granulares para IA.** 9 flags independentes: `geometry_locked`, `layout_locked`, `camera_locked`, `openings_locked`, `materials_locked`, `lighting_locked`, `furniture_locked`, `decor_locked`, `landscape_locked`. |
| `prompt_versions` | `id UUID` | `environment_id -> environments` | Histórico dos prompts compilados e parâmetros de geração (seed, temperatura). |
| `ai_executions` | `id UUID` | `prompt_version_id -> prompt_versions` | Registro de chamada a modelos (Gemini 3.8 Pro/Flash), tempo em ms, tokens e custo estimado. |
| `render_jobs` | `id UUID` | `project_id -> projects`, `environment_id -> environments` | Fila de renderização assíncrona. |
| `render_versions` | `id UUID` | `render_job_id -> render_jobs`, `output_file_id -> files` | Versões de render geradas (V01, V02...). Ponteiro para versão ancestral (`parent_version_id`) e status de aprovação. |
| `render_assets` | `id UUID` | `render_version_id -> render_versions`, `file_id -> files` | Insumos do render (máscaras de profundidade, referências Revit). |

---

#### 2.7. Módulo de Apresentação, Pranchas e Entregas

| Tabela | Chave Primária | Chaves Estrangeiras (FK) | Finalidade e Regras Invariantes |
| :--- | :--- | :--- | :--- |
| `moodboards` / `items`| `id UUID` | `environment_id -> environments` | Painel conceitual com posicionamento livre de imagens e materiais. |
| `presentations` | `id UUID` | `project_id -> projects` | Decks de reunião com cliente (Estudo Preliminar, Conceito, Executivo). |
| `sheets` / `sheet_items`| `id UUID` | `project_id -> projects` | **Pranchas técnicas formais.** Suporte a formatos A4, A3, A2 e A1, escalas técnicas e carimbo oficial ArqVértice. |
| `revisions` / `items` | `id UUID` | `project_id -> projects` | Ciclo formal de revisões contratuais (R00, R01...). |
| `reports` | `id UUID` | `project_id -> projects`, `file_id -> files` | Histórico de relatórios executivos em PDF emitidos. |
| `deliveries` | `id UUID` | `project_id -> projects` | Marco de finalização. Storyboard de cenas para ferramentas externas de vídeo e pacote ZIP. |
| `project_snapshots` | `id UUID` | `project_id -> projects` | Backup em ponto no tempo (JSONB) do estado completo do projeto. |

---

#### 2.8. Módulo de Cronograma e Auditoria

| Tabela | Chave Primária | Chaves Estrangeiras (FK) | Finalidade e Regras Invariantes |
| :--- | :--- | :--- | :--- |
| **`schedule_tasks`** | `id UUID` | `project_id -> projects(id)`, `environment_id -> environments` | **Tabela canônica de etapas.** Mantém os mesmos campos da tabela legada `tarefas`. Status gerado por STORED COLUMN via porcentagem. |
| **`audit_logs`** | `id UUID` | `project_id -> projects`, `user_id -> users` | **Trilha de auditoria imutável.** Registra quem alterou, quando, qual entidade e o diff (`old_values` e `new_values` em JSONB). |
| **`tarefas` (VIEW)** | — | — | **View de compatibilidade.** Permite que qualquer código antigo leia `SELECT * FROM tarefas` sem quebras. |
