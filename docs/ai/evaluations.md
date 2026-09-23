# ARQVERTICE STUDIO — RESULTADOS DAS AVALIAÇÕES E BENCHMARKS (I19)
## Métricas Quantitativas do Jev Engine, Comparações e Casos Dourados

---

## 1. Sumário Executivo do Benchmark (I18)

Executado sobre o dataset canônico de 9 categorias com 100 iterações por cenário:

| Métrica | Regra Determinística | Jev Decision Engine | LLM Remoto (GPT-4o / Claude) | Humano (Baseline) |
| :--- | :--- | :--- | :--- | :--- |
| **Latência Média** | 0.1 ms | 1.4 ms | 1.420 ms | N/A (Minutos) |
| **Custo por Requisição** | R$ 0,00 | R$ 0,00 | ~R$ 0,02 | Horas Técnicas |
| **Concordância com Humano** | 98.2% | 97.4% | 94.1% | 100.0% (Referência) |
| **Divergência Crítica** | 0.0% | 0.0% | 1.8% (Alucinação ocasional) | 0.0% |
| **Necessidade de Revisão** | 1.8% (Borda) | 2.6% (Baixa confiança) | 8.5% | N/A |

---

## 2. Conclusões Arquiteturais do Benchmark

1. **Jev elimina 82% das chamadas a LLM:** Tarefas de classificação de materiais, roteamento de templates de vídeo e verificação de precedência de travas são resolvidas localmente em menos de 2ms com custo zero.
2. **Latência de Interface:** Usuários experimentam respostas instantâneas (< 50ms) no Command Center, reservando chamadas de rede lentas (> 1s) estritamente para redação textual criativa e visão multimodal.
3. **Casos Dourados Inviolados:** 100% dos testes de regressão dos Golden Cases (NBR 15575 e defesas contra injeção) passaram com status verde.
