# ArqVértice Studio — Motor de Geração de Renders (D06)

## 0. Visão Geral e Princípio

O **Motor de Geração de Renders** é o módulo do ArqVértice Studio responsável por orquestrar a produção de imagens renderizadas fotorrealistas dos ambientes arquitetônicos.

### Princípio Fundamental
O usuário **nunca conversa diretamente com o modelo de IA através de prompts isolados ou brutos**. Toda solicitação é processada através de uma esteira rigorosa de compilação contextual:

```
USUÁRIO
  → INTENÇÃO
  → PROJETO
  → AMBIENTE
  → MEMÓRIA
  → REFERÊNCIAS
  → CÂMERA
  → DECISÕES
  → RESTRIÇÕES
  → LOCKS
  → PROMPT COMPILADO
  → PROVIDER
  → IMAGEM
  → QA
  → VERSÃO
```

---

## 1. Arquitetura Provider-Agnostic

O domínio `ArqVertice` não é acoplado a nenhuma API de fornecedor específico. A camada de integração baseia-se na classe abstrata `VisualGenerationProvider`, que padroniza os métodos:
- `generateImage(job, compiledContext, options)`
- `editImage(job, compiledContext, baseImageUrl, options)`
- `createVariation(job, compiledContext, baseImageUrl, options)`
- `getCapabilities()`

### Provedores Nativos
1. **`MockVisualGenerationProvider`**:
   - Provider determinístico com latência simulada ajustável e disparo de falha controlada;
   - Usado em testes automatizados, desenvolvimento offline e validação de fluxo sem consumo de tokens ou créditos reais.
2. **`GeminiVisualGenerationProvider`**:
   - Integração com Google Gemini / Imagen 3 (`imagen-3.0-generate-002`, `imagen-3.0-fast-generate-001`, `gemini-2.5-flash-image`);
   - Comunica-se exclusivamente via backend proxy seguro.

---

## 2. Compilação de Múltiplos Contextos (Zero Prompt Bruto)

O compilador agrega 6 camadas complementares antes de acionar o provider:
1. `CURRENT_INTENT`: Intenção higienizada do usuário (ex: *"Troque o sofá por um modelo mais leve."* ou *"Quero uma iluminação mais aconchegante."*);
2. `PROJECT_CONTEXT`: Diretrizes globais de conceito, paleta e identidade visual;
3. `ENVIRONMENT_CONTEXT`: Tipo de ambiente, pé-direito, área em m², materiais homologados e restrições;
4. `VISUAL_CONTEXT`: Iluminação cênica, acabamentos foscos/minerais e paleta cromática;
5. `CAMERA_CONTEXT`: Ponto de vista mestre selecionado (D05), distância focal, altura do olho e enquadramento;
6. `LOCK_CONTEXT`: Elementos estruturais e vãos de esquadrias imutáveis marcados com trava rígida.

---

## 3. Seleção Inteligente de Referências Pertinentes

Em conformidade com a diretriz de não sobrecarregar o modelo com todas as referências do projeto:
- Apenas a imagem-base da câmera ativa e sua referência de enquadramento são anexadas;
- Apenas as referências visuais curadas do ambiente com prioridade `PRIMARY` ou `APPROVED` são enviadas;
- Referências de outros ambientes são estritamente excluídas.

---

## 4. Governança e Aprovação Estritamente Humana

> [!IMPORTANT]
> **O modelo de IA não aprova sua própria imagem.**
> Apenas um usuário humano (arquiteto titular ou projetista responsável) pode emitir a homologação `APPROVED` ou rejeição `REJECTED`. Imagens geradas com sucesso entram no sistema como candidatos (`SUCCEEDED` / `DRAFT`) até a avaliação humana.

---

## 5. Segurança Absoluta de Credenciais

As chaves de API nunca são expostas no código frontend, `localStorage`, tags HTML ou logs públicos. O frontend comunica-se via contratos desacoplados, garantindo conformidade com padrões corporativos de segurança.
