# ARQVERTICE STUDIO — GOVERNANÇA DE PERFORMANCE, LATÊNCIA E CUSTO DE IA (I16)
**Documento:** `docs/ai/performance-latency-cost.md`  
**Versão:** 1.0.0 — Bloco I16  
**Status:** HOMOLOGADO  
**Premissa Central:** Nenhum modelo de IA generativo de alto custo deve ser acionado quando uma regra determinística ou decisor heurístico leve puder resolver a tarefa com precisão matemática.

---

## 1. Roteamento Progressivo e Econômico (Tiered Routing)

A seleção do motor de execução segue o princípio do menor custo computacional suficiente:

```text
1. DETERMINISTIC RULE (Código puro, matemática, cálculos NBR e queries BIM)
      ↓ (Se exigir heurística estruturada)
2. JEV DECISION ENGINE (Decisões booleanas, escolhas de template e thresholds)
      ↓ (Se exigir síntese textual simples)
3. SMALL FAST MODEL (Resumos rápidos, classificação de tags e extração)
      ↓ (Se exigir raciocínio arquitetônico profundo)
4. LARGE ADVANCED MODEL (Narrativas poéticas, compatibilização complexa)
      ↓ (Se exigir interpretação visual de imagem)
5. VISION MULTIMODAL PROVIDER (Análise de iluminação, fotos e renders)
      ↓ (Se exigir processamento de mídia pesado)
6. SPECIALIZED ENGINE / TOOLS (Remotion, Web-IFC WASM, FFmpeg)
```

> **Atenção:** Esta ordem não é uma hierarquia rígida, mas um critério de precedência eficiente: tarefas matemáticas nunca descem para LLMs.

---

## 2. Orçamentos de Latência (*Latency Budgets*)

Cada categoria de interação no ArqVértice Studio possui um teto rigoroso de tempo de resposta:

| Classe de Latência | Teto de Duração | Casos de Uso Típicos | Feedback de UI |
| :--- | :--- | :--- | :--- |
| **`instant`** | $< 50\text{ ms}$ | Queries BIM, busca de memórias, checagem de travas, navegação | Síncrono / Imediato |
| **`fast`** | $< 300\text{ ms}$ | Avaliações do Jev, validação de schemas, auto-complete de comandos | Micro-transição de foco |
| **`interactive`** | $< 1.500\text{ ms}$ | Síntese de resumos, diagnóstico de ambiente, formatação de prancha | Spinner discreto inline |
| **`background`** | $< 15.000\text{ ms}$ | Geração de roteiro completo de vídeo, auditoria de 32 perguntas | Barra de progresso discreta |
| **`long-running`** | $> 15.000\text{ ms}$ | Renderização de vídeo em alta resolução, compilação de pranchas A0 | Notificação assíncrona / Toast |

---

## 3. Cache Inteligente e Idempotência

O estúdio implementa cache em memória LRU (*Least Recently Used*) com tempo de vida útil (*TTL*) para:
* Consultas estáticas ao modelo BIM.
* Cálculos repetidos de áreas e perímetros.
* Resultados de análises idênticas para a mesma versão do ambiente.
* Metadados de templates e fichas técnicas de materiais.

Consultas em cache retornam em tempo recorde ($< 2\text{ ms}$) com **custo zero** de API.

---

## 4. Minimização de Requisições (*Request Minimization*)

* **Poda de Contexto:** Antes de despachar para um provedor externo, dados não essenciais (ex: logs históricos antigos, arquivos descartados) são purgados.
* **Compactação de Imagens:** Fotos enviadas para análise multimodal de visão são convertidas para dimensões adequadas (máximo 1600px de lado maior), evitando tráfego de buffers brutos de 20MB.

---

## 5. Telemetria e Observabilidade Transparente

O sistema fornece resposta imediata e auditável para a pergunta mandatória:

> *"Qual ferramenta executou esta tarefa, quanto demorou e por que ela foi escolhida?"*

### Exemplo de Registro de Telemetria:
```json
{
  "executionId": "exec-1727042000-88",
  "task": "Consultar materiais do living",
  "tierSelected": "DETERMINISTIC_BIM_QUERY",
  "engine": "BIMQueryEngine",
  "reason": "Consulta relacional puramente determinística sem necessidade de modelo de linguagem.",
  "durationMs": 3,
  "costUsd": 0.0000,
  "cached": false,
  "status": "SUCCESS"
}
```
