# Modelo de Dados: Sistema de Mobiliário e Marcenaria (FURNITURE_DATA_MODEL.md)

## 1. Esquema Relacional

O sistema é suportado pelas tabelas PostgreSQL em `database/schema/23_furniture_and_millwork_system.sql` e gerenciado pelo singleton `StudioState` em `js/state.js`.

### 1.1. `project_furniture_groups`
Conjuntos ou agrupamentos lógicos de mobiliário (ex: Conjunto de Jantar Florença).

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | VARCHAR(64) PK | Identificador único (`grp-...`) |
| `project_id` | VARCHAR(64) FK | Vínculo com projeto |
| `environment_id` | VARCHAR(64) FK | Vínculo com ambiente |
| `name` | VARCHAR(255) | Nome do conjunto |
| `description` | TEXT | Descrição e composição do grupo |
| `created_at` | TIMESTAMPTZ | Data de criação |
| `updated_at` | TIMESTAMPTZ | Data da última atualização |

### 1.2. `project_furniture_items`
Cadastro e ciclo de vida técnico de cada peça de mobiliário, marcenaria ou equipamento.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | VARCHAR(64) PK | Identificador único (`furn-...`) |
| `project_id` | VARCHAR(64) FK | Projeto associado |
| `environment_id` | VARCHAR(64) FK | Ambiente associado |
| `category` | ENUM | 13 categorias canônicas |
| `name` | VARCHAR(255) | Nome da peça |
| `description` | TEXT | Memorial descritivo detalhado |
| `item_type` | ENUM | `EXISTING`, `NEW`, `CUSTOM_MILLWORK` |
| `requirement_type` | ENUM | `REQUIRED` ou `OPTIONAL` |
| `quantity_value` | NUMERIC(10,2) | Valor numérico da quantidade |
| `quantity_unit` | ENUM | `UN`, `PAR`, `CONJUNTO`, `M`, `M2`, `M3`, `OUTRA` |
| `quantity_origin` | ENUM | Origem da contagem/medição |
| `width` | NUMERIC(10,2) | Largura (L) |
| `depth` | NUMERIC(10,2) | Profundidade (P) |
| `height` | NUMERIC(10,2) | Altura (A) |
| `dimension_unit` | ENUM | `CM`, `M`, `MM` (Unidade explícita obrigatória) |
| `material` | VARCHAR(255) | Material primário |
| `finish` | VARCHAR(255) | Acabamento e selador/verniz |
| `color` | VARCHAR(128) | Cor / tonalidade |
| `status` | ENUM | `DRAFT`, `SUGGESTED`, `IN_REVIEW`, `APPROVED`, `REJECTED`, `SUPERSEDED` |
| `origin` | ENUM | Origem do dado |
| `rejection_reason` | TEXT | Justificativa técnica quando `REJECTED` |
| `reference_text` | TEXT | Referência conceitual ou de catálogo |
| `image_url` | TEXT | Foto ou render da peça |
| `notes` | TEXT | Observações de montagem ou instalações |
| `group_id` | VARCHAR(64) FK | Vínculo com `project_furniture_groups` |
| `group_name` | VARCHAR(255) | Nome desnormalizado do grupo |
| `is_custom_millwork` | BOOLEAN | Flag para marcenaria técnica |
| `technical_drawing_ref` | VARCHAR(255) | Referência de prancha (ex: `DET-MARC-01`) |
| `associated_file_url` | TEXT | Caminho para DWG/PDF executivo |
| `is_ai_suggestion` | BOOLEAN | Flag de detecção assistida por IA |
| `ai_confidence` | NUMERIC(4,3) | Grau de confiança visual da IA |
| `ai_label` | VARCHAR(255) | `SUGESTÃO`, `REFERÊNCIA VISUAL` ou `NÃO IDENTIFICADO` |
| `version_code` | VARCHAR(16) | Código de versão: `V01`, `V02`, `V03`... |
| `version_sequence` | INTEGER | Sequencial numérico da versão |
| `parent_item_id` | VARCHAR(64) FK | Item ancestral versionado ou duplicado |
| `manufacturer` | VARCHAR(255) | Fabricante / Designer |
| `supplier` | VARCHAR(255) | Fornecedor / Lojista |
| `model` | VARCHAR(255) | Modelo |
| `code` | VARCHAR(128) | Código de referência / SKU |
| `price` | NUMERIC(12,2) | Preço unitário |
| `currency` | VARCHAR(8) | Moeda (Padrão: `BRL`) |

### 1.3. `project_furniture_history`
Trilha de auditoria e versionamento não destrutivo.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | VARCHAR(64) PK | Identificador de histórico (`fhist-...`) |
| `item_id` | VARCHAR(64) FK | Item associado |
| `action` | VARCHAR(64) | `CREATED`, `UPDATED`, `APPROVED`, `REJECTED`, `SUPERSEDED`, `VERSIONED` |
| `from_status` | ENUM | Status anterior |
| `to_status` | ENUM | Novo status |
| `from_version` | VARCHAR(16) | Versão de origem |
| `to_version` | VARCHAR(16) | Nova versão |
| `changed_fields` | JSONB | Lista de campos alterados |
| `change_summary` | TEXT | Descrição textual da mudança |
| `rejection_reason` | TEXT | Motivo de reprovação se aplicável |
| `changed_by` | VARCHAR(128) | Autor da modificação |
| `created_at` | TIMESTAMPTZ | Timestamp da alteração |

---

## 2. Categorias Canônicas (13)

1. `MOVEL_SOLTO`: Sofás, poltronas, mesas de centro, mesas de jantar, cadeiras, bancos.
2. `MARCENARIA`: Armários embutidos, painéis ripados, nichos, estantes e móveis planejados.
3. `EQUIPAMENTO`: Aparelhos de ar-condicionado, bombas de piscina, automação, home theater.
4. `ILUMINACAO`: Lustres, pendentes, plafons, perfis de LED, arandelas, abajures.
5. `DECORACAO`: Vasos decorativos, esculturas, adornos, almofadas, mantas.
6. `TAPETE`: Tapetes sob medida, esteiras, passadeiras.
7. `CORTINA_PERSIANA`: Cortinas de linho, persianas motorizadas, rolos blackout.
8. `ARTE`: Telas, gravuras, instalações, fotografias fine art.
9. `ACESSORIO`: Puxadores especiais, suportes, organizadores.
10. `LOUCA`: Cubas de semi-encaixe, bacias sanitárias, bidês.
11. `METAIS`: Torneiras monocomando, chuveiros de teto, toalheiros térmicos.
12. `ELETRODOMESTICO`: Geladeiras, fornos embutidos, cooktops, coifas, micro-ondas, adegas.
13. `OUTRO`: Demais itens especiais de especificação.

---

## 3. Estrutura de Medidas Técnicas Rigorosas

As medidas no ArqVértice Studio possuem obrigatoriamente 3 eixos e unidade explícita:
- **L** (`width`): Largura
- **P** (`depth`): Profundidade
- **A** (`height`): Altura
- **Unidade** (`dimensionUnit`): `CM`, `M` ou `MM`.

> [!CAUTION]
> O sistema **nunca assume centímetros se o dado estiver em metros**. Se a unidade informada for `M`, o valor 2.20 representa 2,20 metros, e não 2,20 centímetros. A conversão e exibição preservam a integridade da unidade configurada.
