# Sistema de Memória Estruturada do Projeto

## 1. Princípio Fundamental
O ArqVertice Studio adota o princípio de que modelos generativos e motores de renderização não podem depender exclusivamente de prompts pontuais, imagens avulsas ou do histórico volátil de um chat linear.

Para garantir consistência compositiva, respeito a normas técnicas e conformidade com as aprovações do cliente, o sistema implementa uma camada de **memória estruturada multicamada** que alimenta pacotes de contexto determinísticos (`PROJECT_CONTEXT_PACKAGE`, `ENVIRONMENT_CONTEXT_PACKAGE`, `IMAGE_CONTEXT_PACKAGE`).

---

## 2. Hierarquia de 5 Níveis

| Nível | Escopo | Descrição | Exemplo |
| :--- | :--- | :--- | :--- |
| **NÍVEL 1** | **ORGANIZAÇÃO** | Diretrizes corporativas, padrões de entrega e biblioteca da ArqVértice. | Normas de representação gráfica ArqVértice. |
| **NÍVEL 2** | **PROJETO** | Diretrizes globais, paleta geral, briefing técnico e conceito homologado. | "Paleta mineral em tons neutros em toda a residência." |
| **NÍVEL 3** | **AMBIENTE** | Regras funcionais, zoneamento, pé-direito, layout e estilo do cômodo. | Sala de Estar: Estilo Rústico Praiano Contemporâneo. |
| **NÍVEL 4** | **ELEMENTO** | Definições específicas de objetos, marcenarias, rochas ou revestimentos. | Painel da TV, Bancada da Ilha Gourmet, Sofá Modular. |
| **NÍVEL 5** | **IMAGEM / VERSÃO** | Metadados de câmeras, renders homologados, vistas e seeds de geração. | Render V12 da Sala homologado pelo cliente. |

---

## 3. Preservação Histórica e Imutabilidade
- Memórias homologadas pelo cliente ou arquiteto titular **não são alteradas silenciosamente nem apagadas**.
- Qualquer mudança em uma decisão vigente exige o fluxo de **Supersession**, onde a versão anterior passa para o status `SUPERSEDED` e uma nova versão `CURRENT` é criada com histórico auditável.
- Elementos rejeitados pelo cliente são preservados como `REJECTED_OUTPUT` para prevenir que futuros prompts ou sugestões automáticas reintroduzam soluções indesejadas.
