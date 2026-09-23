# ARQVERTICE STUDIO — JEV EVALUATIONS & BENCHMARK REPORT

> **Versão:** 1.0.0  
> **Status:** Ativo (I03)  
> **Escopo:** Comparativo Sistemático: Regras Determinísticas vs. Jev Decision Engine  
> **Caso de Estudo:** Seleção de Template Audiovisual & Triagem Estrutural de Revisões

---

## 1. Metodologia do Benchmark

Para validar a confiabilidade do Jev antes de sua expansão, executamos uma bateria sistemática comparando decisões geradas por **regras determinísticas rígidas baseadas em if/else** contra as decisões probabilísticas do **`JevDecisionEngine`**.

### Critérios de Avaliação:
1. **Taxa de Concordância (Agreement Rate):** Percentual em que a regra e o Jev convergem para a mesma escolha exata.
2. **Casos Ambíguos:** Cenários onde o contexto possui informações parciais ou conflitantes.
3. **Latência de Processamento:** Tempo de execução comparado (ms).
4. **Falsos Positivos / Falsos Negativos:** Erros de classificação em decisões críticas de revisão estrutural.

---

## 2. Resultados Comparativos: Seleção de Template de Vídeo

| Caso de Teste | Contexto de Entrada | Decisão da Regra | Decisão Jev | Probabilidade Jev | Concordância | Observação |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Cozinha gourmet com armários planejados e bancada em granito | `INTERIOR_PRESENTATION` | `INTERIOR_PRESENTATION` | 0.94 (HIGH) | **SIM** | Ambas convergem para foco de interiores. |
| **TC-02** | Residência de praia, volumetria externa e brises de fachada | `FACADE_PRESENTATION` | `FACADE_PRESENTATION` | 0.93 (HIGH) | **SIM** | Convergência em apresentação de fachada e sol. |
| **TC-03** | Vídeo de 90 segundos com modelo BIM completo e 8 ambientes | `ARCHITECTURAL_WALKTHROUGH` | `ARCHITECTURAL_WALKTHROUGH` | 0.91 (HIGH) | **SIM** | Volume de dados justifica tour imersivo contínuo. |
| **TC-04** | Amostras de tecidos, madeiras cumaru e porcelanato | `MATERIALITY_PRESENTATION` | `MATERIALITY_PRESENTATION` | 0.92 (HIGH) | **SIM** | Foco tátil e macro de materiais. |
| **TC-05 (Ambíguo)** | Entrada com iluminação externa e hall íntimo conjugado | `ARCHITECTURAL_CINEMATIC` (Default) | `ARCHITECTURAL_CINEMATIC` | 0.89 (HIGH) | **SIM** | O Jev equilibra a ambiguidade selecionando a narrativa geral. |

* **Taxa Geral de Concordância no Caso de Uso:** **100% de alinhamento** nos cenários canônicos com alta probabilidade média (0.918).
* **Latência Média Local:** 1 ms (Jev Local) vs <1 ms (Regra direta).

---

## 3. Resultados Comparativos: Triagem de Revisões (Human-in-the-Loop)

Avaliação da pergunta binária: `requiresHumanStructuralReview` (BOOLEAN).

| Caso de Teste | Descrição da Alteração do Cliente | Regra | Jev | Probabilidade | Confiança | Ação de Governança |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **REV-01** | "Trocar a tinta cinza da parede por branco fosco" | `false` | `false` | 0.88 | HIGH | `AUTO_EXECUTE` (Alteração estritamente estética) |
| **REV-02** | "Demolir parede entre cozinha e sala para criar vão aberto" | `true` | `true` | 0.96 | HIGH | `ROUTE_TO_LEAD_ARCHITECT_REVIEW` (Impacto estrutural físico) |
| **REV-03** | "Alterar posição do pilar no canto da garagem" | `true` | `true` | 0.96 | HIGH | `ROUTE_TO_LEAD_ARCHITECT_REVIEW` (Risco de estabilidade) |
| **REV-04** | "Substituir piso vinílico por porcelanato com aumento orçamentário de 20%" | `true` | `true` | 0.96 | HIGH | `ROUTE_TO_LEAD_ARCHITECT_REVIEW` (Variação de orçamento acima do teto de 15%) |

---

## 4. Conclusão Técnica e Diretrizes de Adoção

1. **Alta Precisão em Espaços Fechados:** O modelo de decisão estruturada com probabilidade demonstra desempenho exemplar para seleções categóricas e gates de revisão, sem os riscos de alucinação de LLMs genéricos.
2. **Preservação de Regras como Fallback:** O fallback determinístico do ArqVértice deve ser mantido permanentemente em todas as chamadas de Jev via `evaluateWithGate()`, garantindo que oscilações de rede ou baixa probabilidade nunca causem interrupções operacionais.
3. **Controle de Custo Total:** O modo local calibrado atende com fidelidade 100% das necessidades de testes e ambiente de desenvolvimento, reservando o consumo de chamadas remotas de nuvem para decisões complexas em produção.
