# Sistema de Permissões, Riscos e Auditoria

No **ArqVértice Studio**, agentes de IA e módulos automatizados operam sob o princípio do menor privilégio. Nenhuma ferramenta com potencial de dano ao projeto pode ser acionada unilateralmente por um modelo.

---

## 1. Classificação Formal de Risco

| Nível de Risco | Comportamento de Execução | Exemplos Típicos |
| :--- | :--- | :--- |
| **`READ_ONLY`** | Execução totalmente autônoma e imediata. | Inspeção visual de imagens, leitura de propriedades IFC, parsing de arquivos DXF, consulta de quantitativos. |
| **`REVERSIBLE`** | Execução automática quando a confiança do Jev for suficiente (`>= 0.75`). Gera ponto de restauração instantâneo (Undo). | Inpainting com máscara em render, decimação de malha com backup do GLB original, alteração paramétrica em feature CAD com versionamento. |
| **`SENSITIVE`** | Execução permitida com aviso discreto na interface e registro em log auditável. | Exportação de pacotes completos de projeto em ZIP, download de pranchas finais para clientes. |
| **`DESTRUCTIVE`** | **Exige confirmação humana obrigatória.** A execução é bloqueada e pausada até clique explícito do usuário em modal. | Exclusão definitiva de sólidos da árvore CAD, descarte permanente de pranchas executivas aprovadas, substituição em massa de arquivos sem backup. |

---

## 2. O Gate de Confirmação Humana

Quando uma ferramenta marcada como `DESTRUCTIVE` é acionada:
1. A ferramenta é retida no registry.
2. O sistema emite um evento de confirmação contendo a descrição exata da alteração e o impacto no projeto.
3. Se o usuário confirmar via modal: a ferramenta é executada e o resultado é carimbado no audit log.
4. Se o usuário cancelar: a operação é abortada, o histórico permanece intacto e o agente é notificado da recusa.

---

## 3. Trilha de Auditoria Imutável (Audit Trail)

Cada disparo de ferramenta gera um registro imutável com os seguintes dados:
- `id`: Identificador único do evento de auditoria.
- `agent`: Nome do agente que originou o pedido (`MultimodalAgentCore`, `JevRouter`).
- `tool`: Nome formal da ferramenta.
- `inputSummary`: Resumo dos parâmetros recebidos.
- `decision`: Decisão de segurança tomada (`POLICY_APPROVED`, `REQUIRES_HUMAN_APPROVAL`, `DESTRUCTIVE_REJECTED`).
- `result`: Status de sucesso, erro ou cancelamento.
- `durationMs`: Duração exata da execução.
- `timestamp`: Timestamp ISO 8601 canônico.
