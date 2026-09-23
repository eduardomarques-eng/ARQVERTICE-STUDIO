# Catálogo de Regras do Visual QA — ArqVértice Studio (D09)

## 1. Tabela Canônica de Regras de Inspeção

| Código da Regra | Categoria | Condição de Acionamento | Classificação | Ação do Sistema |
|---|---|---|---|---|
| `RULE-QA-CAM-01` | `CAMERA` | `CAMERA_LOCK = true` e imagem apresenta enquadramento ou ângulo divergente | `POTENTIAL_LOCK_VIOLATION` | Marca `REVIEW_REQUIRED` |
| `RULE-QA-GEO-01` | `GEOMETRY` | `GEOMETRY_LOCK = true` e há alteração em alvenarias ou proporção | `POTENTIAL_LOCK_VIOLATION` | Marca `REVIEW_REQUIRED` |
| `RULE-QA-OPE-01` | `OPENINGS` | `OPENINGS_LOCK = true` e vãos de esquadrias ou portas sofreram mutação | `POTENTIAL_LOCK_VIOLATION` | Marca `REVIEW_REQUIRED` |
| `RULE-QA-ELM-01` | `ELEMENT` | Elemento específico com lock ativo diverge da homologação anterior | `POTENTIAL_LOCK_VIOLATION` | Marca `REVIEW_REQUIRED` |
| `RULE-QA-MAT-01` | `MATERIALS` | `MATERIALS_LOCK = true` e acabamento diverge da diretriz global/local | `WARNING` | Alerta de conformidade |
| `RULE-QA-LIT-01` | `LIGHTING` | Temperatura de cor aparente diverge da faixa aprovada (ex: >3500K) | `WARNING` | Alerta luminotécnico |
| `RULE-QA-ART-01` | `AI_ARTIFACTS` | Detecção de geometria visualmente impossível ou membros duplicados | `WARNING` / `REVIEW_REQUIRED` | Registra artefato de IA |
| `RULE-QA-PRF-01` | `PERFORMANCE` | Versão idêntica submetida à análise | `CACHE_HIT` | Retorna relatório em cache |

---

## 2. Padrão de Nomenclatura das Violações

Toda violação de lock é identificada expressamente como:
```
POTENTIAL_LOCK_VIOLATION: [NOME_DO_LOCK] — Descrição técnica da divergência
```

Nunca é afirmada certeza matemática absoluta, reconhecendo que a visão computacional e a interpretação humana de perspectiva e iluminação possuem nuances subjetivas.
