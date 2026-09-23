# ARQVERTICE STUDIO — AI ROUTING & COST POLICIES

> **Versão:** 1.0.0  
> **Status:** Ativo  
> **Implementação:** `AIRoutingPolicy` em `js/ai-foundation.js`

---

## 1. Visão Geral

As Políticas de Roteamento de Inteligência Artificial (`AIRoutingPolicy`) permitem que o ArqVértice Studio equilibre dinamicamente a qualidade artística/técnica dos resultados, a latência de resposta, o consumo de cota financeira de APIs de nuvem e a privacidade dos dados do projeto.

Em vez de codificar "use o modelo X no componente Y", o desenvolvedor informa a **intenção operacional** através da política correspondente.

---

## 2. Catálogo de Políticas

### 2.1. `AIRoutingPolicy.QUALITY` (Máxima Fidelidade)
* **Objetivo:** Produção de material para entrega formal ao cliente final, apresentações de concurso ou imagens institucionais.
* **Comportamento do Router:**
  * Prioriza os modelos de maior fidelidade gráfica e resolução disponível (`imagen-3.0-generate-002`, `veo-2.0`, `gemini-1.5-pro`).
  * Utiliza prompts analíticos densos com todos os detalhes de iluminação, materiais e vegetação.
  * Permite tempos de processamento mais longos (até 45 segundos).
* **Impacto Financeiro:** Custo moderado a alto por operação.

### 2.2. `AIRoutingPolicy.BALANCED` (Modo Padrão)
* **Objetivo:** Operação diária do estúdio durante as fases de anteprojeto e estudo preliminar.
* **Comportamento do Router:**
  * Equilibra tempo de resposta ágil com qualidade visual adequada para revisões de equipe interna.
  * Seleciona modelos com bom custo-benefício (`gemini-2.0-flash`, `imagen-3.0-generate-002`).
  * Timeout padrão de 20 a 30 segundos.
* **Impacto Financeiro:** Custo controlado.

### 2.3. `AIRoutingPolicy.LOW_COST` (Econômico)
* **Objetivo:** Brainstorming rápido, geração massiva de variações conceituais ou clientes em planos de entrada.
* **Comportamento do Router:**
  * Seleciona variantes otimizadas de baixo custo (`imagen-3.0-fast-generate-001`).
  * Reduz a quantidade de tokens contextuais desnecessários.
* **Impacto Financeiro:** Mínimo custo por chamada.

### 2.4. `AIRoutingPolicy.FAST` (Baixa Latência)
* **Objetivo:** Feedback interativo em tempo real durante digitação no formulário de briefing ou ajustes rápidos de layout.
* **Comportamento do Router:**
  * Prioriza modelos com TTFT (Time to First Token) ultrarrápido ou engines locais.
  * Timeout reduzido (10 segundos).
* **Impacto Financeiro:** Baixo a nulo.

### 2.5. `AIRoutingPolicy.LOCAL` (Zero Custo / Offline)
* **Objetivo:** Desenvolvimento de novos recursos, testes contínuos de integração (CI/CD), modo avião/offline ou clientes com exigência estrita de soberania de dados.
* **Comportamento do Router:**
  * Roteia exclusivamente para provedores locais ou simuladores determinísticos (`mock-visual`, `wan-director`, `jev-decision-foundation`).
  * Nenhuma chamada externa à internet é disparada.
* **Impacto Financeiro:** R$ 0,00 de consumo de nuvem.

---

## 3. Matriz de Decisão de Políticas

| Caso de Uso no ArqVértice | Política Recomendada | Provedor Selecionado |
| :--- | :--- | :--- |
| Render de Fachada para Pasta do Cliente | `QUALITY` | Vertex AI Imagen 3 (`imagen-3.0-generate-002`) |
| Preview de Iluminação na Timeline de Vídeo | `BALANCED` | Gemini Director (`gemini-2.0-flash`) |
| Geração de 10 Variações de Briefing | `LOW_COST` | Gemini Flash / Fast Generate |
| Validação de Regras e Compatibilização | `LOCAL` / `BALANCED` | Jev Decision Foundation (`jev-decision-foundation-v1`) |
| Testes Automatizados no Jest / Node | `LOCAL` | Mock Visual Engine (`mock-architectural-preview-v1`) |
