# Governança de Aprovação, Rejeição e Versionamento de Materiais (MATERIAL_APPROVAL.md)

## 1. Ciclo de Vida do Material

O fluxo de maturação de um acabamento segue o padrão:

```text
DRAFT ──► IN_REVIEW ──► APPROVED
  ▲           │            │
  │           ▼            ▼
  └── SUGGESTED ◄── REJECTED (Preserva motivo / Restrição)
              │
              └──► SUPERSEDED (ao gerar nova versão V02, V03...)
```

- **`DRAFT`:** Material conceitual em fase de estudo ou pesquisa preliminar.
- **`SUGGESTED`:** Sugerido por visão computacional (IA) ou fornecedor parceiro.
- **`IN_REVIEW`:** Em análise conjunta pelo arquiteto e cliente.
- **`APPROVED`:** Homologado para compra e inserido nos locks visuais do ambiente (`MATERIALS_LOCK`).
- **`REJECTED`:** Rejeitado. Nunca é deletado; mantém justificativa obrigatória e transforma-se em restrição técnica para que a IA não volte a sugerir o acabamento reprovado.
- **`SUPERSEDED`:** Versão anterior congelada após geração de revisão (`V01` &rarr; `V02`).

---

## 2. Rejeição como Restrição Futura

> [!IMPORTANT]
> Ao rejeitar um material, o arquiteto ou cliente deve registrar o **motivo da rejeição** (`rejectionReason`).

Exemplos:
- *"Material X rejeitado pelo cliente: excesso de brilho não desejado para a área íntima."*
- *"Porcelanato polido reprovado para o deck da piscina devido ao risco de escorregamento (exige acabamento EXT com coeficiente de atrito > 0.4)."*
- *"Mármore natural reprovado para bancada de cozinha devido à alta porosidade e suscetibilidade a manchas de ácidos."*

Essa informação fica arquivada na trilha de auditoria e auxilia o motor de IA em novas propostas para evitar reincidência de materiais rejeitados.

---

## 3. Versionamento Não-Destrutivo (V01 -> V02 -> V03)

Se a especificação de um piso ou revestimento mudar (ex: troca de dimensões de 60x60 para 120x120, ou mudança de cor):
- O registro original não é sobreposto silenciosamente.
- O método `versionMaterial(materialId, changeData)`:
  1. Converte o material vigente para `SUPERSEDED`.
  2. Gera uma nova versão com código incrementado (`V02`, `V03`), herdando os dados e aplicando as alterações.
  3. Registra logs simultâneos em `project_material_history` para rastreabilidade de orçamentos e revisões.
