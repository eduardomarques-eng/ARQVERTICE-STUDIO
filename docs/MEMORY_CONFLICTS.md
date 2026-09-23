# Detecção e Resolução de Conflitos de Memória

## 1. Princípio de Não-Arbitrariedade (Prompt Item 26)

Se coexistirem duas memórias vigentes e ativas apontando para direções divergentes sobre o mesmo elemento (exemplo: `Decisão A: "Usar madeira clara"` vs `Decisão B: "Usar madeira escura"`):

- **O sistema não escolhe aleatoriamente ou pela data mais recente de forma silenciosa.**
- O status de ambas é alterado para **`CONFLICT`**.
- Um registro é gerado na coleção `project_memory_conflicts` com status **`OPEN`**.
- O sistema bloqueia a compilação automática para aquele elemento até que o arquiteto intervenha.

---

## 2. Fluxo de Homologação e Resolução

1. **Notificação Visual**: O painel administrativo da Memória exibe o banner de alerta e a contagem de conflitos abertos na sub-aba **Conflitos**.
2. **Comparativo Lado a Lado**: O arquiteto examina as declarações conflitantes, suas justificativas e seus responsáveis.
3. **Ação de Homologação**: O arquiteto clica em *"Homologar Esta Opção"* e insere a justificativa técnica.
4. **Desfecho**:
   - A memória escolhida retorna ao status **`CURRENT`**.
   - A memória preterida passa a **`SUPERSEDED`**.
   - O conflito passa ao status **`RESOLVED`**, registrando `resolvedBy` e `resolvedAt`.
   - Um registro de auditoria é gravado de forma perene.
