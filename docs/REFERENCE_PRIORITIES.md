# ARQVERTICE STUDIO — HIERARQUIA E PRIORIDADE DE REFERÊNCIAS (C02)
## Níveis de Prioridade, Tratamento de Itens Rejeitados e Governança de IA

---

### 1. Níveis Oficiais de Prioridade

Para evitar ambiguidade na fase de modelagem e orientar futuras engines de renderização e IA generativa, cada referência possui um nível de prioridade rigorosamente definido:

| Nível | Significado Técnico | Comportamento no Sistema |
|---|---|---|
| **PRIMARY** | **Referência Decisiva e Central** | Tem peso máximo na definição de paleta, estilo e proporções. Aparece no topo do dossier e no `ENVIRONMENT_CONTEXT`. |
| **SECONDARY** | **Referência Complementar** | Auxilia em detalhes específicos (ex: rodapés, puxadores, textura secundária) sem definir a volumetria principal. |
| **OPTIONAL** | **Inspiração Livre / Alternativa** | Ideias de estudo que podem ou não ser incorporadas conforme a viabilidade orçamentária ou espacial. |
| **REJECTED** | **Referência Rejeitada Formalmente** | O cliente ou arquiteto reprovou a referência. **Nunca é apagada silenciosamente**; permanece com tarja de recusa e motivo gravado. |

---

### 2. Protocolo de Referência Rejeitada (`REJECTED`)

#### Por que preservar referências rejeitadas?
1. **Evitar retrabalho:** Impede que outro membro da equipe volte a sugerir o mesmo acabamento reprovado.
2. **Histórico e Alinhamento:** Comprova o direcionamento do cliente em caso de dúvidas futuras.
3. **Restrição para a IA:** A engine de IA lê os itens `REJECTED` como restrições negativas estritas (ex: *"Proibido sugerir piso brilhante neste ambiente"*).

#### Requisito Mandatório:
Toda referência classificada como `REJECTED` deve possuir obrigatoriamente um **Motivo da Rejeição** (`rejection_reason`).
- Exemplo: *"Cliente tem aversão expressa a pisos de alto brilho ou polidos com cão em casa."*
- Exemplo: *"Madeira cumaru rejeitada para o forro interno devido ao peso estrutural."*

---

### 3. Versionamento de Plantas e Imagens

Caso uma planta ou perspectiva receba alterações:
- A versão atual (ex: `V01`) é marcada como `SUPERSEDED`.
- A nova versão (`V02`) é criada como `CURRENT`.
- O histórico de evolução é preservado via chave estrangeira `parent_asset_id`.
