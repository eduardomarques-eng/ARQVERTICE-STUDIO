# Governança de Aprovação, Rejeição e Versionamento (FURNITURE_APPROVAL.md)

## 1. Ciclo de Vida e Estados Canônicos

Cada item de mobiliário ou marcenaria navega pelos seguintes estados formais:

```text
DRAFT ──► IN_REVIEW ──► APPROVED
  ▲           │            │
  │           ▼            ▼
  └── SUGGESTED ◄── REJECTED (c/ Motivo)
              │
              └──► SUPERSEDED (ao gerar nova versão V02, V03...)
```

- **`DRAFT` (Rascunho):** Cadastro inicial de estudo ou levantamento preliminar.
- **`SUGGESTED` (Sugerido):** Item proposto por IA visual ou parceiro, pendente de decisão técnica.
- **`IN_REVIEW` (Em Revisão):** Item sendo analisado por especificador, arquiteto líder ou cliente.
- **`APPROVED` (Aprovado):** Homologado para compra, fabricação e incorporado ao contexto visual de consistência do ambiente.
- **`REJECTED` (Rejeitado):** Reprovado tecnicamente ou comercialmente. **Nunca é excluído silenciosamente**; mantém registro de justificativa técnica.
- **`SUPERSEDED` (Substituído):** Versão anterior desativada em decorrência de uma revisão versionada (ex: `V01` vira `SUPERSEDED` quando `V02` é criada).

---

## 2. Política de Não Exclusão e Justificativa Obrigatória

> [!IMPORTANT]
> Ao rejeitar um item de mobiliário, o arquiteto deve registrar expressamente o **motivo da rejeição** (`rejectionReason`).

Exemplos de motivos válidos:
- *"Dimensão incompatível com a circulação mínima de 80cm da sala."*
- *"Acabamento em couro não aprovado pelo cliente (prefere tecido hidrorrepelente)."*
- *"Prazo de fabricação de 120 dias inviabiliza o cronograma da obra."*
- *"Custo unitário excede o teto orçamentário previsto para o living."*

---

## 3. Versionamento Não Destrutivo (V01 -> V02 -> V03)

Se um sofá ou marcenaria mudar de especificação:
- **Não substituir silenciosamente o registro original.**
- O sistema executa o método `versionFurnitureItem(itemId, changeData)`:
  1. O item atual mantém seu identificador e dados históricos, mudando seu status para `SUPERSEDED`.
  2. Um novo registro é gerado com código de versão incrementado: `Sofá Living (V01)` &rarr; `Sofá Living (V02)` &rarr; `Sofá Living (V03)`.
  3. Ambos os itens ficam vinculados na tabela `project_furniture_history`, permitindo auditoria reversa e comparação de memoriais descritivos.
