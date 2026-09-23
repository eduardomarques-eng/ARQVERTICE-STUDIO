# Governança de Confiança e Princípios Anti-Alucinação (Bloco E03)

O gerenciamento de quantitativos técnicos em arquitetura de alto padrão exige garantias severas contra alucinações de inteligência artificial e erros de interpretação dimensional.

---

## 1. Princípio da Não-Equivalência (Item 2)

O sistema rejeita categoricamente o tratamento indiferenciado de dados medidos e estimativas aproximadas:

* **Caso 1:** Piso da Sala = $42{,}30\text{ m}^2$ (Origem: `PROJECT_DATA` / `MEASURED`)
* **Caso 2:** Piso da Sala = $42{,}30\text{ m}^2$ (Origem: `MANUAL`)
* **Caso 3:** Piso da Sala = aproximadamente $42\text{ m}^2$ (Origem: `ESTIMATED_BY_AI`)

**Regra do ArqVértice Studio:** Estes três casos **NÃO PODEM SER TRATADOS COMO EQUIVALENTES**. O Caso 1 é apto para emissão executiva; o Caso 2 exige conferência de autoria; o Caso 3 exige obrigatoriamente validação humana presencial antes de qualquer decisão de compra ou corte.

---

## 2. Diretrizes Anti-Alucinação para a IA (Itens 13 e 14)

1. **Vedação de Falsa Precisão:**
   A IA **NUNCA DEVE DECLARAR** *"Quantidade exata = X"* quando não dispuser de dados de geometria comprovada. Ela deve rotular como:
   * *"Estimativa preliminar"*
   * *"Dados insuficientes para quantificação executiva"*
2. **Nível de Aprovação Obrigatório:**
   Toda quantidade gerada por IA recebe automaticamente:
   * `status = ESTIMATED`
   * `approvalLevel = QUANTITY_ESTIMATED`
   * `isAiEstimate = true`
   * `aiDisclaimer = "ESTIMATIVA VISUAL: Não representa quantidade executiva exata. Sujeita a conferência in loco."`
3. **Conversão para Homologado:**
   A única forma de uma estimativa de IA se tornar `QUANTITY_APPROVED` é através da ação deliberada e auditada do arquiteto titular no botão **`Confirmar / Homologar`**.

---

## 3. Política de Rejeição e Restrição Futura

Ao rejeitar um quantitativo:
- O usuário deve preencher obrigatoriamente a justificativa técnica (`rejectionReason`).
- O registro **nunca é excluído fisicamente da base de dados**; seu status é alterado para `REJECTED`.
- O registro rejeitado permanece visível e documentado no histórico de auditoria (`project_quantity_history`), servindo de parâmetro de restrição para futuras revisões do projeto.
