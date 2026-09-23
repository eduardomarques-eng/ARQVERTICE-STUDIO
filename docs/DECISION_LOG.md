# Registro de Decisões e Fluxo de Supersession

## 1. Estrutura de uma Decisão Homologada
Toda decisão registrada na memória possui:
- `projectId`: Identificador do projeto.
- `environmentId`: Identificador do ambiente (ou `null` para diretriz global).
- `elementKey`: Chave padronizada do elemento arquitetônico (ex: `painel_tv`, `bancada_ilha`, `sofa`).
- `subject`: Título sintetizado da decisão.
- `statement`: Declaração formal e inequívoca do que foi decidido.
- `reason`: Justificativa técnica, estética ou exigência do cliente.
- `source`: Origem da decisão (`CLIENT`, `ARQVERTICE`, `REVIT_EXPORT`...).
- `responsible`: Nome do profissional ou cliente responsável pela decisão.
- `version`: Número sequencial da versão (V01, V02...).
- `status`: Status atual (`CURRENT`, `SUPERSEDED`, `CONFLICT`).
- `isLock`: Se ativa trava rígida contra alteração involuntária pelo motor generativo.

---

## 2. Fluxo Não-Destrutivo de Supersession (Prompt Itens 9 e 24)

Quando uma decisão previamente aprovada precisa ser modificada (exemplo: "Trocar painel de carvalho ripado por pedra natural Moledo"):

1. **A versão anterior (V01) não é apagada**:
   - `status` passa de `CURRENT` para `SUPERSEDED`.
   - `supersededById` aponta para o ID da nova versão.
   - Um evento de auditoria é registrado (`actionType: 'SUPERSEDED'`).

2. **A nova versão (V02) é criada**:
   - `version` = 2.
   - `status` = `CURRENT`.
   - `supersedesId` aponta para o ID da versão V01.
   - `reason` descreve a solicitação ou justificativa da nova escolha.
   - Um evento de auditoria é registrado (`actionType: 'CREATED_SUPERSEDING'`).

3. **Garantia de Não-Regressão**:
   - A IA sempre lê a versão `CURRENT`.
   - O histórico de decisões anteriores permanece integralmente consultável para laudos, contestações e memória técnica do projeto.
