# ARQVERTICE STUDIO — AI ROUTER SPECIFICATION

> **Versão:** 1.0.0  
> **Status:** Ativo  
> **Implementação:** `AIRouter` em `js/ai-foundation.js`

---

## 1. Visão Geral

O **`AIRouter`** é o componente central de despacho, orquestração e resiliência da arquitetura de IA do ArqVértice Studio. Ele garante que qualquer solicitação de inteligência artificial formulada pela aplicação seja:
1. Validada contra a política de roteamento ativa (`AIRoutingPolicy`);
2. Encaminhada ao provedor e modelo mais adequados para a capacidade requerida (`AICapability`);
3. Executada com controle rigoroso de timeout;
4. Protegida por mecanismos transparentes de fallback caso o provedor primário falhe ou rejeite a requisição;
5. Validada estruturalmente via schema antes de ser entregue à camada de aplicação;
6. Integralmente auditada e registrada no barramento de observabilidade (`AIObservability`).

---

## 2. Interface de Execução

```javascript
const router = window.aiFoundation.router;

// Exemplo de despacho de tarefa via AIRouter
const result = await router.execute({
  capability: window.aiFoundation.AICapability.VISUAL_RENDER_GENERATION,
  policy: window.aiFoundation.AIRoutingPolicy.BALANCED,
  payload: {
    prompt: 'Fachada residencial contemporânea com brises de madeira cumaru e iluminação de poente',
    aspectRatio: '16:9',
    projectName: 'Residência Terras Altas'
  },
  timeoutMs: 15000
});

if (result.success) {
  console.log('Resultado validado:', result.data);
  console.log('Metadados:', result.metadata);
} else {
  console.error('Falha de execução:', result.error, 'Fallback acionado:', result.fallbackOccurred);
}
```

---

## 3. Resolução de Provedores e Modelos

O router mantém uma tabela interna de mapeamento de capacidades para provedores prioritários e fallbacks:

```text
┌────────────────────────────────┐
│   Tarefa com AICapability      │
└───────────────┬────────────────┘
                ▼
┌────────────────────────────────┐
│  Resolve Provedor Primário     │
│  (com base na AIRoutingPolicy) │
└───────────────┬────────────────┘
                ▼
        ┌───────────────┐
        │ Executa com   │
        │ Timeout Guard │
        └───────┬───────┘
                │
         Sucesso?
        ├── Sim ──► Valida Schema de Saída ──► Retorna Sucesso com Metadados
        └── Não
             ▼
    ┌────────────────────────┐
    │ Fallback configurado?  │
    └────────┬───────────────┘
             ├── Sim ──► Executa Provedor Fallback ──► Valida Schema ──► Retorna Sucesso (com fallback flag)
             └── Não ──► Retorna INVALID_RESULT com log detalhado de erro
```

---

## 4. Tratamento de Timeouts e Falhas de Rede

* **Timeout Padrão:** O `AIRouter` aplica um timeout padrão de 30.000 ms (30 segundos), customizável por tarefa.
* **Garantia contra Travamento:** Chamadas assíncronas são encapsuladas em `Promise.race` com rejeição controlada.
* **Fallback Transparente:** Em caso de erro 4xx/5xx de API externa ou timeout de rede, o router registra a ocorrência e aciona imediatamente o fallback configurado (ex: o provedor mock local ou um modelo de menor custo).

---

## 5. Validação de Schemas e Integridade

Nenhum resultado de IA é entregue como "verdade absoluta" à aplicação:
* Quando uma tarefa define um `outputValidator` ou `schema`, a resposta bruta é submetida à verificação.
* Se a resposta não contiver os campos obrigatórios esperados pela UI ou pelo modelo de dados de arquitetura, o router classifica o status como `INVALID_RESULT`.
* Isso impede que textos corrompidos, JSON incompleto ou alucinações quebrem a renderização do frontend ou corrompam o estado do projeto no `LocalStorage` / banco de dados.
