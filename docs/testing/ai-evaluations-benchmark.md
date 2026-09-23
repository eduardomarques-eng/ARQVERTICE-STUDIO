# ARQVERTICE STUDIO — TESTES, EVALUATIONS E BENCHMARKS (I18)
## Metodologia de Avaliação Contínua, Casos Dourados e Matriz Jev vs LLM

---

## 1. Pirâmide e Camadas de Testes

O ArqVértice Studio adota uma estratégia de testes em 8 camadas integradas:

```text
┌────────────────────────────────────────────────────────┐
│ 1. Unit Tests            (Funções puras e parsers)     │
│ 2. Integration Tests     (Comunicação entre módulos)   │
│ 3. E2E Tests             (Fluxo ponta a ponta no web)  │
│ 4. Visual Regression     (Snapshots de layouts/pranchas│
│ 5. Accessibility (a11y)  (WCAG 2.1 AA, touch targets)  │
│ 6. AI Evaluations        (Dataset controlado de 9 áreas│
│ 7. Performance & Latency (Orçamentos <50ms a <1.5s)    │
│ 8. Security & Sandbox    (Zero secrets e prompt guard) │
└────────────────────────────────────────────────────────┘
```

---

## 2. Dataset Canônico de Avaliação de IA (9 Categorias)

O dataset é mantido em formato JSON estruturado com casos de teste controlados nas 9 disciplinas centrais da arquitetura do estúdio:

1. **`briefing`**: Extração de programa de necessidades, dimensionamento de suítes e áreas sociais.
2. **`architecture`**: Validação de vãos mínimos de ventilação e pé-direito segundo NBR 15575.
3. **`classification`**: Classificação de materiais (porcelanato, mármore, madeira ripada, concreto aparente).
4. **`BIM`**: Consulta de quantitativos determinísticos de alvenaria e cubagem de concreto via IFC.
5. **`presentation`**: Diagramação de prancha executiva A1 com carimbo técnico NBR 6492.
6. **`video`**: Seleção automática de template audiovisual e classe de duração para teaser imobiliário.
7. **`vision`**: Inspeção de consistência de atmosfera e iluminação dourada (*golden hour*) em render 3D.
8. **`routing`**: Escolha econômica entre regra determinística local vs modelo remoto.
9. **`decision`**: Resolução de conflito de materiais entre especificação do memorial e preferência do cliente.

---

## 3. Benchmarking Jev: Medições Quantitativas Objetivas

> **Regra Mandatória:** Vetado o uso de "notas subjetivas globais de 0 a 10".

Cada decisão é submetida a 4 mecanismos concorrentes para mensuração de métricas concretas:

| Mecanismo | Papel | Latência Típica | Custo Médio |
| :--- | :--- | :--- | :--- |
| **`Rule`** | Regra estática em código JavaScript | < 2 ms | R$ 0,00 |
| **`Jev`** | Motor de decisão delimitada com pesos multi-critério | 5 – 25 ms | R$ 0,00 |
| **`LLM`** | Chamada probabilística a modelo de linguagem | 800 – 2500 ms | R$ 0,02 / req |
| **`Human`** | Julgamento do arquiteto titular (ground truth) | Assíncrono | Horas técnicas |

### Métricas Computadas:
- **Taxa de Concordância (Agreement %):** Proporção de decisões onde Jev ou LLM coincidem com a baseline humana.
- **Taxa de Divergência Crítica:** Decisões que violam normas técnicas ou travas visuais invioláveis.
- **Índice de Confiança:** Valor numérico normalizado de 0.00 a 1.00 calculado pelo motor Jev.
- **Taxa de Revisão Humana:** Percentual de saídas que demandaram intervenção do operador.

---

## 4. Casos Dourados (*Golden Cases*)

Casos fundamentais que jamais podem regredir após atualizações de código ou novos prompts:
- **GOLDEN-01 (NBR 15575):** Quarto de casal com pé-direito inferior a 2,50m deve ser rejeitado com advertência grave.
- **GOLDEN-02 (Conflito de Material):** Uma trava de material confirmada pelo cliente tem precedência absoluta sobre sugestão estética de IA.
- **GOLDEN-03 (BIM Query):** Listagem de ambientes e áreas deve ser 100% determinística sem alucinações numéricas.
- **GOLDEN-04 (Segurança):** Comandos com instruções de evasão de prompt injection devem ser neutralizados sem exceção.

---

## 5. Testes de Falha e Resiliência (9 Cenários Críticos)

O sistema deve degradar suavemente perante falhas externas, testadas contra:
1. `provider_unavailable`: Alternância transparente para modelo de contingência ou regra local.
2. `timeout`: Cancelamento limpo pelo `AbortController` sem congelamento da tela.
3. `invalid_json`: Parser tolerante com extração de bloco de código e fallback seguro.
4. `malformed_output`: Rejeição pelo validador de schema com notificação compreensível.
5. `low_confidence`: Despacho automático para revisão pelo operador humano.
6. `tool_failure`: Captura do erro sem contaminação do restante do workflow.
7. `missing_asset`: Uso de fallback de placeholder neutro ou suspensão da etapa.
8. `bim_corruption`: Rejeição do arquivo corrompido com log de integridade.
9. `network_error`: Ativação do modo offline com dados salvos em cache local.

---

## 6. Critério de Aceite Final

Um recurso de IA só é considerado **"Pronto para Produção"** quando satisfaz cumulativamente:
1. **Caso Normal (Happy Path):** Execução fluida dentro do orçamento de latência.
2. **Caso Extremo (Edge Case):** Dados limítrofes (ex: área zero, caracteres especiais, imagens de baixa luz).
3. **Caso de Falha (Failure Case):** Tratamento recuperável com fallback transparente.
4. **Validação Técnica:** Aprovação no validador de schema ou auditor de conformidade NBR.
