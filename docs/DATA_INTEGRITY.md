# GARANTIA DE INTEGRIDADE, CONCORRÊNCIA E SEGURANÇA DE DADOS
## ARQVERTICE STUDIO — POLÍTICAS DE CONSTRAINTS, ÍNDICES E TRANSAÇÕES
**Versão:** 1.0.0  
**Data:** 21 de Setembro de 2026  
**Documento:** DATA_INTEGRITY.md  

---

### 1. POLÍTICA DE INTEGRIDADE REFERENCIAL (FOREIGN KEYS)

Toda tabela dependente possui chaves estrangeiras explicitamente declaradas com ações de integridade proporcionais ao impacto no negócio:

1. **Exclusão em Cascata Controlada (`ON DELETE CASCADE`):**
   - Aplicada exclusivamente a entidades filhas que perdem totalmente o sentido de existir sem o seu pai (ex.: `environments` $\rightarrow$ `locks`, `projects` $\rightarrow$ `schedule_tasks`, `briefings` $\rightarrow$ `briefing_sections`).
2. **Bloqueio de Exclusão Destrutiva (`ON DELETE RESTRICT`):**
   - Aplicada em entidades mestras de negócio:
     - `clients` possui `ON DELETE RESTRICT` em `projects`. É tecnicamente impossível deletar acidentalmente um cliente enquanto houver um projeto cadastrado para ele.
     - `products`, `materials` e `furniture_items` possuem `ON DELETE RESTRICT` nas tabelas de especificação do ambiente. Não é permitido apagar um piso ou móvel do catálogo se ele estiver vinculado a uma prancha ou ambiente ativo.
3. **Preservação de Trilha de Autoria (`ON DELETE SET NULL`):**
   - Utilizada em campos de auditoria (`created_by_user_id`, `uploaded_by`, `reviewed_by_user_id`). Se um colaborador for inativado ou removido, o histórico de aprovações e uploads é preservado com integridade.

---

### 2. CONSTRAINTS DE DOMÍNIO E SANITIZAÇÃO

Nenhum dado inválido pode atingir o estado persistido do PostgreSQL, mesmo que a camada de frontend seja contornada:

| Campo / Tabela | Regra CHECK | Objetivo de Negócio |
| :--- | :--- | :--- |
| `schedule_tasks.porcentagem` | `>= 0 AND <= 100` | Impede números negativos ou porcentagens maiores que 100%. |
| `schedule_tasks.disciplina_projeto` | `IN ('Arquitetura', '3D', 'Estrutura', 'Complementares', 'Obras')` | Assegura que apenas as 5 disciplinas canônicas oficiais da ArqVértice sejam aceitas. |
| `schedule_tasks.descricao_etapa` | `length(trim(descricao_etapa)) > 0` | Impede tarefas com nomes vazios ou compostos apenas por espaços. |
| `projects.built_area_m2` | `> 0` | Garante que áreas cadastradas sejam grandezas positivas. |
| `files.file_size_bytes` | `> 0` | Impede registro de arquivos corrompidos ou vazios de 0 bytes. |
| `files.hash_sha256` | `length(hash_sha256) = 64` | Valida que o checksum do arquivo é um hash SHA-256 hexadecimal rigoroso. |
| `environment_materials.provenance_type` | `IN ('DADO_REAL', 'CALCULADO', 'ESTIMADO', 'INFORMADO_USUARIO', 'SUGERIDO_IA')` | Garante rastreabilidade estrita entre o que veio do Revit/medido in loco e o que é estimativa paramétrica de IA. |

---

### 3. ESTRATÉGIA DE ÍNDICES E PERFORMANCE

Os índices foram desenhados para atender às consultas mais frequentes do escritório:

1. **Visualização do Cronograma e Relatórios:**
   - Índice composto `idx_st_proj_ordem ON schedule_tasks (project_id, ordem, data_conclusao)`. Otimiza a ordenação padrão do Kanban e Datagrid em uma única operação de índice (*Index Only Scan*).
2. **Cálculo de Prazos Críticos:**
   - Índice `idx_st_data ON schedule_tasks (data_conclusao)`. Acelera o filtro de tarefas que vencem em ≤ 7 dias.
3. **Navegação por Ambientes:**
   - Índice composto `idx_environments_order ON environments (project_id, order_index)`.
4. **Deduplicação de Arquivos:**
   - Índice `idx_files_hash ON files (hash_sha256)`. Permite identificar instantaneamente se um bloco 3D ou imagem de render já existe no storage antes de duplicar o armazenamento.

---

### 4. CONTROLE DE CONCORRÊNCIA E LOCKING OTIMISTA

Para solucionar a vulnerabilidade de **concorrência cega (lost updates)** diagnosticada no Prompt A01 (`RISCOS_ATUAIS.md` - `CONC-01`):

#### Versionamento Otimista em Tabelas Críticas:
Nas tabelas de alta frequência de edição (`schedule_tasks`, `locks`, `briefing_confirmations`), as atualizações concorrentes são protegidas pelo timestamp imutável `updated_at`:
```sql
-- Exemplo de mutação com verificação de colisão
UPDATE schedule_tasks 
SET porcentagem = 80, updated_at = now()
WHERE id = $1 AND updated_at = $versao_lida_pelo_front;

-- Se rowCount == 0, a API retorna HTTP 409 Conflict:
-- "Outro usuário alterou esta etapa enquanto você a editava. A tela foi atualizada com o valor mais recente."
```

---

### 5. POLÍTICA DE SOFT DELETE (EXCLUSÃO SUAVE)

Para evitar perdas acidentais de dados de clientes ou projetos que possuam histórico contratual:
- As tabelas `clients` e `projects` possuem as colunas `deleted_at` e `archived_at`.
- Ao "excluir" um cliente, o sistema simplesmente preenche `deleted_at = now()`.
- Todas as queries padrão filtram automaticamente `WHERE deleted_at IS NULL`.
- Somente o perfil `ADMINISTRADOR` possui privilégio de purgar definitivamente registros do banco após confirmação dupla.
