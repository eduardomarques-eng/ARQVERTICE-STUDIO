# Ciclo de Vida e Status de Conhecimento

Cada registro de memória possui um status de conhecimento estritamente controlado (Prompt C06 Item 4):

| Status | Significado | Comportamento na Compilação de IA |
| :--- | :--- | :--- |
| **`CURRENT`** | Conhecimento ativo e vigente para o projeto ou ambiente. | **Incluído** como regra prioritária. |
| **`HISTORICAL`** | Versão anterior mantida para registro e linha do tempo. | **Ignorado** na geração ativa, consultável em auditoria. |
| **`SUPERSEDED`** | Decisão superada por uma nova versão homologada (V02, V03...). | **Ignorado** na geração ativa, preservado no histórico. |
| **`HYPOTHESIS`** | Hipótese em fase de estudo preliminar. | **Opcional**, etiquetado como não-homologado. |
| **`UNDER_REVIEW`** | Item sob análise ou aguardando resposta do cliente. | **Alertado** como pendência de definição. |
| **`OBSOLETE`** | Informação revogada por alteração de escopo. | **Arquivado**. |
| **`CONFLICT`** | Conflito detectado entre duas decisões ativas divergentes. | **Bloqueia geração** até homologação do arquiteto. |

---

## Fontes de Registro (Sources)
- **`CLIENT`**: Requisitos e escolhas declaradas pelo contratante.
- **`ARQVERTICE`**: Decisões técnicas e conceituais dos arquitetos do escritório.
- **`REVIT_EXPORT`**: Metadados de pranchas, vistas e imagens exportadas do Autodesk Revit.
- **`FILE`**: Documentos técnicos, laudos e memoriais complementares.
- **`REFERENCE`**: Moodboards e referências arquitetônicas consolidadas.
- **`DECISION`**: Atos formais de homologação em atas de reunião.
- **`AI`**: Propostas oriundas de assistentes cognitivos.
- **`SYSTEM`**: Regras automáticas do motor da plataforma.
