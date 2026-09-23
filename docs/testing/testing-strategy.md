# ARQVERTICE STUDIO — ESTRATÉGIA DE TESTES E QUALIDADE (I19)
## Diretrizes de Cobertura, Automação Headless e Regressão Contínua

---

## 1. Visão Geral da Estratégia de Testes

A qualidade do ArqVértice Studio repousa sobre uma estratégia de testes automatizados headless executáveis instantaneamente com `node tests/<suite>.test.js`. Todas as suítes rodam em menos de 2 segundos no total e não exigem emuladores pesados ou browsers reais para a validação lógica e sintática básica.

---

## 2. Inventário de Suítes de Testes Principais do Bloco I

| Suíte de Testes | Escopo / Bloco | Foco de Validação |
| :--- | :--- | :--- |
| **`tests/ai-foundation.test.js`** | I01 – I02 | Router agnóstico, observabilidade, fallback de providers e schemas. |
| **`tests/jev-decision-engine.test.js`** | I03 – I06 | Matriz de decisão multi-critério, pesos determinísticos e conflitos. |
| **`tests/visual-responsive-qa.test.js`** | I08 – I09 | Viewport mobile, touch targets (≥44px), acessibilidade e safe areas. |
| **`tests/contextual-ai-skills.test.js`** | I10 – I11 | Roteador NLP, ContextBuilder, ciclo Propose-Preview e 13 Skills. |
| **`tests/bim-viewer-pipeline.test.js`** | I12 | Queries determinísticas no IFC, clipping planes e propriedades. |
| **`tests/audiovisual-remotion.test.js`** | I13 | VideoBrief, 7 templates, síntese de roteiro e Video QA. |
| **`tests/agent-orchestration-workflow.test.js`** | I14 – I15 | Contratos dos 5 agentes, ExecutionPlan, dry-run e rollback. |
| **`tests/performance-telemetry.test.js`** | I16 | Orçamentos de latência, cache LRU e telemetria de custos. |
| **`tests/security-governance.test.js`** | I17 | Zero secrets, prompt injection defense, file sandbox e guards. |
| **`tests/ai-evaluations.test.js`** | I18 | Dataset de 9 categorias, benchmark Jev, Golden Cases e 9 falhas. |

---

## 3. Diretriz de Preservação Headless

Qualquer acesso a APIs de DOM de navegador (`document`, `window`, `localStorage`, `HTMLElement`) nos módulos de frontend deve ser encapsulado sob guarda defensiva:
```javascript
if (typeof document !== 'undefined') {
  // manipulações de DOM seguras
}
```
Isso assegura que 100% dos testes unitários possam ser executados de forma nativa e ultra-rápida no ambiente Node.js.
