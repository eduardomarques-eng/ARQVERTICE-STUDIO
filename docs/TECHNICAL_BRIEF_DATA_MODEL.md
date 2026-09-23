# ARQVERTICE STUDIO — MODELO DE DADOS DO BRIEFING TÉCNICO (BLOCO C01)
## DICIONÁRIO DE DADOS, ENTIDADES, ENUMS E REGRAS DE INTEGRIDADE

**Documento:** docs/TECHNICAL_BRIEF_DATA_MODEL.md  
**Alinhamento:** `database/schema/08_technical_brief.sql` e `js/state.js`  
**Versão:** C01  

---

### 1. DIAGRAMA CONCEITUAL DAS ENTIDADES

```
projects (1) ──── (1) briefings (Bloco B)
   │                       │
   │ (1)                   │ (origem das respostas brutas)
   ▼                       ▼
technical_briefs (1) ──────────────────────────────────────────┐
   ├── (N) technical_brief_directives                          │
   ├── (N) technical_brief_restrictions                        │
   ├── (N) technical_brief_environments ── (1:1 opt) environments
   ├── (N) technical_brief_pendencies                          │
   └── (N) technical_brief_snapshots ──────────────────────────┘
```

---

### 2. ENUMS CANÔNICOS

#### 2.1 Status do Briefing Técnico (`technical_brief_status`)
- `DRAFT`: Rascunho inicial criado ou derivado do briefing do cliente.
- `IN_REVIEW`: Em análise técnica detalhada pela equipe de arquitetura e engenharia.
- `READY`: Todas as pendências preliminares resolvidas e pronto para homologação.
- `APPROVED`: Homologado internamente com snapshot congelado (gera `TECHNICAL_BRIEF_V01`).
- `SUPERSEDED`: Versão histórica superada por nova revisão homologada.

#### 2.2 Origem da Informação (`source_type`)
- `CLIENTE`: Resposta extraída diretamente do questionário preenchido pelo cliente.
- `ARQVERTICE`: Diretriz técnica, interpretação ou cálculo do escritório.
- `ARQUIVO`: Dado proveniente de arquivo anexado (ex: certidão de ônus, DWG da prefeitura).
- `REFERENCIA`: Referência visual anexada ou aprovada em moodboard.
- `LEVANTAMENTO`: Informação vinda de vistoria física em canteiro ou medição com trena laser.
- `MODELO_REVIT`: Coordenada, cota de nível ou seção estrutural extraída do Revit/BIM.
- `DECISAO`: Decisão formal registrada em ata de reunião técnica.
- `IA_SUGESTAO`: Apontamento analítico do motor de IA assistiva (não validado).
- `OUTRO`: Fontes complementares externas.

#### 2.3 Categorias de Diretrizes (`directive_category`)
- `FUNCIONAL`: Fluxos operacionais, acessibilidade, ergonomia e dimensionamento.
- `ESPACIAL`: Relação entre ambientes, integrações, vãos livres e pé-direito.
- `ESTETICA`: Linguagem visual, proporções, simetria e ritmo de fachada.
- `MATERIAL`: Especificações de pisos, acabamentos, texturas e bancadas.
- `ILUMINACAO`: Luminotécnica, temperatura de cor, automação de cenas e luz natural.
- `MOBILIARIO`: Marcenaria sob medida e especificações de mobiliário solto.
- `TECNOLOGIA`: Automação, climatização, áudio/vídeo e rede cabeada.
- `CONFORTO`: Conforto térmico, acústico e ventilação cruzada.
- `EXTERIOR`: Paisagismo, piscinas, decks e sombreamento externo.
- `APRESENTACAO`: Pranchas conceituais, 3D e renderizações para cliente.
- `OUTRA`: Diretrizes complementares não categorizadas acima.

#### 2.4 Categorias de Restrições (`restriction_category`)
- `PRESERVAR_EXISTENTE`: Árvores, edificações pré-existentes ou elementos do terreno a manter.
- `INALTERAVEL`: Elementos estruturais rígidos que não podem ser perfurados ou removidos.
- `LIMITACAO_INFORMADA`: Limitações físicas, familiares (ex: cães, alergias) ou contratuais.
- `PREFERENCIA_NEGATIVA`: O que o cliente expressamente rejeita ou detesta.
- `ORCAMENTO`: Limites financeiros e tetos de investimento.
- `PRAZO`: Datas rígidas de entrega e marcos contratuais inegociáveis.
- `OBRA`: Dificuldades de acesso de caminhões, marés, solo arenoso ou horários de barulho.
- `IMOVEL`: Recuos obrigatórios da prefeitura, taxa de ocupação e normas de condomínio.

#### 2.5 Escala de Prioridades Técnicas (`technical_priority`)
- `CRITICO`: Condição sine qua non que inviabiliza o projeto se desrespeitada.
- `ALTO`: Requisito de altíssimo impacto na funcionalidade ou estética principal.
- `MEDIO`: Diretriz padrão de bom dimensionamento arquitetônico.
- `BAIXO`: Detalhe estético ou de conforto secundário.
- `INFORMATIVO`: Nota de referência contextual sem caráter vinculativo.

---

### 3. ESPECIFICAÇÃO DAS TABELAS (POSTGRESQL & JSON)

#### 3.1 Tabela `technical_briefs`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID (PK) | Identificador único da sessão técnica. |
| `project_id` | UUID (FK) | Vínculo obrigatório com o projeto correspondente. |
| `client_briefing_id` | UUID (FK) | Vínculo com a sessão de briefing do cliente original (Bloco B). |
| `version` | INTEGER | Versão do documento técnico (inicia em 1). |
| `status` | VARCHAR(50) | Status de aprovação interna (`DRAFT`, `IN_REVIEW`, `READY`, `APPROVED`, `SUPERSEDED`). |
| `executive_summary` | JSONB / TEXT | Objeto do resumo com 10 campos síntese. |
| `is_summary_derived` | BOOLEAN | Flag que atesta que o resumo foi sintetizado a partir das fontes. |
| `approved_by_name` | VARCHAR(150) | Nome do profissional da ArqVértice que homologou o documento. |
| `approved_at` | TIMESTAMPTZ | Timestamp exato da aprovação. |
| `approval_notes` | TEXT | Parecer técnico e justificativa da homologação. |

#### 3.2 Tabela `technical_brief_directives`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID (PK) | Identificador da diretriz. |
| `technical_brief_id` | UUID (FK) | Vínculo com o briefing técnico. |
| `title` | VARCHAR(200) | Título claro e inequívoco da diretriz. |
| `description` | TEXT | Detalhamento técnico executivo. |
| `category` | VARCHAR(50) | Uma das 11 categorias formais de diretrizes. |
| `priority` | VARCHAR(30) | Nível na escala de prioridade técnica. |
| `source_type` | VARCHAR(50) | Origem rastreável da diretriz. |
| `source_id` | VARCHAR(100) | Identificador da questão ou ata de origem. |
| `status` | VARCHAR(30) | `ATIVA`, `EM_ANALISE`, `APROVADA` ou `DESCARTADA`. |
| `responsible` | VARCHAR(150) | Nome do arquiteto ou engenheiro encarregado. |
| `date_registered` | DATE | Data de cadastro da diretriz. |

#### 3.3 Tabela `technical_brief_environments` (16 Atributos)
| Atributo | Tipo | Descrição |
|---|---|---|
| `name` | VARCHAR(150) | Nome do ambiente (ex: Sala de Estar e Jantar Integrada). |
| `type` | VARCHAR(50) | Setor / tipologia espacial (SALA, COZINHA, SUITE, DECK...). |
| `area_m2` | NUMERIC(8,2) | Área líquida estimada em metros quadrados. |
| `users` | VARCHAR(200) | Perfil dos usuários e ocupação simultânea máxima. |
| `function_desc` | TEXT | Finalidade primária e secundária do ambiente. |
| `frequency` | VARCHAR(50) | Frequência de utilização (Diária, Fins de semana, Eventual). |
| `needs` | TEXT[] | Array de tags de necessidades específicas do cômodo. |
| `style` | VARCHAR(100) | Linguagem de interiores pretendida. |
| `desired_materials` | TEXT | Acabamentos e revestimentos homologados. |
| `rejected_materials` | TEXT | Materiais vedados para este cômodo. |
| `furniture` | TEXT | Diretrizes de mobiliário solto e marcenaria sob medida. |
| `equipment` | TEXT | Eletrodomésticos, TVs e instalações especiais. |
| `lighting` | TEXT | Conceito de iluminação natural e artificial. |
| `references_notes` | TEXT | Vínculos com pranchas de moodboard ou fotos. |
| `observations` | TEXT | Observações técnicas e de engenharia. |
| `status` | VARCHAR(50) | `ESTUDO`, `EM_DESENVOLVIMENTO`, `APROVADO`. |

#### 3.4 Tabela `technical_brief_snapshots`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID (PK) | Identificador do snapshot. |
| `technical_brief_id` | UUID (FK) | Vínculo com o briefing técnico pai. |
| `version_code` | VARCHAR(50) | Código legível imutável (`TECHNICAL_BRIEF_V01`, `V02`...). |
| `version_number` | INTEGER | Número ordinal sequencial da versão. |
| `approved_by_name` | VARCHAR(150) | Responsável pela homologação. |
| `approved_at` | TIMESTAMPTZ | Timestamp de congelamento. |
| `snapshot_payload` | JSONB | Cópia estática e completa de todas as 22 seções, diretrizes e matriz. |

---

### 4. REGRAS DE INTEGRIDADE E CONTRATOS DE DADOS

1. **Invariância de Fato do Cliente:** Nenhum método do `TechnicalBriefModule` possui permissão para modificar campos em `briefing_answers` ou no `submissionSnapshot` do cliente.
2. **Imutabilidade de Snapshots:** Registros na tabela `technical_brief_snapshots` nunca sofrem `UPDATE` ou `DELETE`. Novas aprovações geram novos registros de snapshots com incremento de versão.
3. **Restrição de IA:** Nenhuma saída gerada pela função analítica de IA pode possuir `source_type = 'CONFIRMED_FACT'`. Toda inserção gerada pela IA recebe compulsoriamente `source_type = 'IA_SUGESTAO'`, necessitando de intervenção do usuário para transitar para `ARQVERTICE` ou `DECISAO`.
