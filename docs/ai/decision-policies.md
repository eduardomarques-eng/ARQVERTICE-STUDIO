# ARQVERTICE STUDIO — JEV DECISION POLICIES & CONFIDENCE GATING

> **Versão:** 1.0.0  
> **Status:** Ativo (I03)  
> **Camada:** Decision Governance (`js/jev-decision-engine.js`, `js/ai-foundation.js`)

---

## 1. Visão Geral

As Políticas de Decisão do ArqVértice Studio governam como a aplicação consome os resultados probabilísticos do **Jev**. Nenhuma probabilidade é considerada "infalível", e todo resultado passa por um **Gate de Confiança** antes que qualquer ação seja permitida.

---

## 2. Limiares de Confiança Calibrados

O ArqVértice Studio adota três zonas canônicas de probabilidade calculadas empiricamente:

| Nível de Confiança | Intervalo de Probabilidade | Ação da Política | Comportamento da Aplicação |
| :--- | :--- | :--- | :--- |
| **`HIGH`** | $P \ge 0.85$ | `AUTO_EXECUTE` / `REQUIRE_VALIDATION` | A aplicação adota a recomendação automaticamente. Se a operação for marcada como crítica (`isCriticalOperation: true`), ainda requer validação prévia de regras. |
| **`MEDIUM`** | $0.65 \le P < 0.85$ | `REQUIRE_VALIDATION` | A recomendação é apresentada com aviso de checagem. O sistema confere regras determinísticas antes de avançar. |
| **`LOW`** | $P < 0.65$ | `FALLBACK_TRIGGERED` / `REQUIRE_HUMAN_REVIEW` | O resultado do Jev é rejeitado como insuficiente. O sistema aciona o fallback determinístico configurado ou encaminha o caso para a fila de revisão do arquiteto líder. |

---

## 3. Matriz de Resultados da Política (`JevActionOutcome`)

```text
┌──────────────────────────────────────┐
│  Avaliação Jev: Decisão + Probabilidade
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│       Classifica Confiança:          │
│       HIGH  /  MEDIUM  /  LOW        │
└──────────────────┬───────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
   [HIGH / MEDIUM]         [LOW]
         │                   │
         ▼                   ▼
 Operação Crítica?    Existe Fallback de Regra?
   ├── Sim ──► REQUIRE_VALIDATION       ├── Sim ──► FALLBACK_TRIGGERED
   └── Não ──► AUTO_EXECUTE             └── Não ──► REQUIRE_HUMAN_REVIEW
```

---

## 4. Human-in-the-Loop (Revisão Humana Estruturada)

Quando uma decisão resulta em `REQUIRE_HUMAN_REVIEW`, o sistema emite um registro estruturado com:

* `decisionId`: Identificador único da avaliação para rastreabilidade;
* `decision`: A opção com maior probabilidade identificada pelo Jev;
* `probability`: A certeza calculada (ex: `0.58`);
* `confidenceLevel`: Classificado como `LOW`;
* `suggestedAction`: Sugestão de ação (`ROUTE_TO_LEAD_ARCHITECT_REVIEW`);
* `rationale`: Motivo técnico explícito da incerteza (ex: "Contexto ambíguo entre reforma de fachada e ampliação de sala").

O arquiteto líder visualiza essa pendência no Dashboard e confirma ou altera a decisão com apenas um clique.

---

## 5. Resolução com Fallback Determinístico (`evaluateWithGate`)

A função canônica `evaluateWithGate(request, ruleFallbackFn)` garante que a aplicação nunca trave por incerteza de IA:

```javascript
const decision = await JevDecisionEngine.evaluateWithGate({
  type: JevDecisionType.CHOICE,
  question: 'Qual template de apresentação utilizar?',
  choices: ['ARCHITECTURAL_CINEMATIC', 'INTERIOR_PRESENTATION', 'FACADE_PRESENTATION'],
  state: { focus: 'ambíguo', hasBIMData: false }
}, async (state) => {
  // Regra determinística segura de fallback
  return { decision: 'ARCHITECTURAL_CINEMATIC', rationale: 'Fallback conservador da empresa.' };
});

if (decision.outcome === JevActionOutcome.FALLBACK_TRIGGERED) {
  console.log('Fallback seguro acionado:', decision.rationale);
}
```
