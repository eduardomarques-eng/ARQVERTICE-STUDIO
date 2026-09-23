# Contratos Estáveis de Pacotes de Contexto (Context Packages)

Para garantir estabilidade e desacoplamento de provedores de IA, o sistema disponibiliza três contratos canônicos de extração de contexto (Prompt Itens 15, 16, 17 e 29):

---

## 1. `getProjectContext(projectId)` &rarr; `PROJECT_CONTEXT_PACKAGE`
Utilizado para tarefas globais, sínteses executivas e diretrizes conceituais do projeto inteiro.
- **Identificação**: Projeto, cliente e status geral.
- **Briefing Técnico**: Necessidades do programa, área construída e perfil de investimento.
- **Conceito Consolidado**: Atmosfera, estilo principal, palavras-chave e narrativa.
- **Decisões Globais**: Decisões com escopo `environmentId = null`.
- **Restrições Globais**: Diretrizes obrigatórias e elementos vetados em todo o projeto.
- **Marcos**: Percentual de avanço dos marcos oficiais.

---

## 2. `getEnvironmentContext(environmentId)` &rarr; `ENVIRONMENT_CONTEXT_PACKAGE`
Utilizado prioritariamente para geração de renders e desenvolvimento detalhado de um cômodo.
- **Dados do Cômodo**: Nome, tipo, pavimento, área m² e pé-direito.
- **Locks Rígidos**: Travamento de volumetria, layout, câmera, aberturas, materiais e iluminação.
- **Elementos Travados (`lockedElements`)**: Lista de elementos com `isLock = true`.
- **Decisões Homologadas (`approvedDecisions`)**: Decisões ativas do ambiente e globais.
- **Restrições & Proibições (`restrictions`, `rejectedElements`)**: Normas e proibições do cliente.
- **Outputs Aprovados (`approvedOutputs`)**: Links e versões de renders homologados como referência visual.
- **Materiais & Mobiliário**: Especificações técnicas vigentes.

---

## 3. `getImageContext(renderId)` &rarr; `IMAGE_CONTEXT_PACKAGE`
Utilizado para iterações sobre renders existentes ou comparações de variantes.
- **Ambiente**: Contexto completo do cômodo correspondente.
- **Câmera**: Ângulo de visão, lente, altura e origem da vista (`REVIT_EXPORT`).
- **Imagem Base**: URL da perspectiva aprovada ou em revisão.
- **Decisões Relevantes**: Decisões que impactam o ângulo da câmera em questão.
