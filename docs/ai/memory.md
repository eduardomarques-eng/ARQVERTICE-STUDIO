# ARQVERTICE STUDIO — ARQUITETURA DE MEMÓRIA DO PROJETO (I19)
## As 4 Camadas de Memória, Precedência e Resolução de Conflitos

---

## 1. As 4 Camadas Canônicas de Memória

Para garantir coerência de longo prazo sem alucinações cumulativas, a memória do ArqVértice Studio divide-se em 4 camadas com tempos de vida e precedências distintas:

| Camada | Escopo | Tempo de Vida | Localização | Precedência |
| :--- | :--- | :--- | :--- | :--- |
| **`WorkingMemory`** | Sessão ativa / tarefa corrente | Volátil (reseta ao trocar de tela) | Runtime RAM | Baixa |
| **`ProjectMemory`** | Projeto arquitetônico ativo | Persistente durante a vida do projeto | `state.projects` | Média |
| **`StudioMemory`** | Padrões do escritório e regras NBR | Global / Permanente | `database/rules.json` | Alta |
| **`ClientMemory`** | Preferências expressas do cliente | Permanente por cliente | `state.briefing` | Altíssima |

---

## 2. Ordem de Precedência em Caso de Conflito

Quando duas fontes de verdade divergem (exemplo: uma sugestão estética gerada por IA versus uma restrição estipulada pelo cliente no briefing), o sistema aplica a seguinte regra determinística:

```text
NBR / Normas de Segurança (Inviolável)
         ↓
Travas Visuais Confirmadas (VisualLocks)
         ↓
Preferências Expressas do Cliente (ClientMemory)
         ↓
Diretrizes do Estúdio (StudioMemory)
         ↓
Decisão Ponderada Jev (JevDecisionEngine)
         ↓
Sugestão Generativa de LLM (Último nível)
```

Nenhum modelo de linguagem tem permissão para sobrescrever uma trava de material ou restrição dimensional aprovada pelo cliente.
