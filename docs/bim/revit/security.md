# Revit Integration Security & Transaction Governance

## 1. Princípios de Segurança e Hardening

A integração do ArqVértice Studio com o Autodesk Revit foi concebida sob o paradigma de **Zero-Trust**:

1. **Nenhum Segredo no Frontend**: Todas as credenciais de nuvem (APS Client ID, Client Secret, Refresh Tokens) residem exclusivamente em variáveis de ambiente seguras no backend Node.js (`server.js`) ou no cofre de credenciais local do Revit.
2. **Loopback Estrito**: A comunicação TCP do Revit Add-In escuta exclusivamente em `127.0.0.1` (localhost). Nenhuma porta externa é aberta na interface de rede pública sem túnel criptografado.
3. **Imutabilidade por Padrão**: O agente e as ferramentas iniciam no nível `L0 (READ_ONLY)`. Qualquer escalação para escrita requer transição explícita.

---

## 2. Níveis Operacionais de Risco (L0 → L5)

O subsistema `RevitTransactionSandbox` governa as operações do Revit através de 6 níveis bem definidos:

```text
Nível 0: L0_READ
  └─ Consultas idempotentes de projeto, níveis, ambientes, parâmetros e seleção.
Nível 1: L1_ANALYZE
  └─ Cálculos de conformidade NBR, auditoria de vãos e relatórios térmicos/geométricos.
Nível 2: L2_PROPOSE
  └─ Geração de propostas de alteração, drafts de pranchas, orçamentos e estimativas.
Nível 3: L3_REVERSIBLE_WRITE
  └─ Edição de parâmetros não estruturais, adição de comentários e criação de vistas temporárias.
Nível 4: L4_SENSITIVE_WRITE
  └─ Modificação geométrica, troca de famílias/tipos, criação de pranchas e alteração de cotas.
  └─ REQUER APROVAÇÃO HUMANA (Changeset Preview com Diff).
Nível 5: L5_DESTRUCTIVE
  └─ Exclusão de elementos, expurgo de famílias (Purge Unused) e alteração de fases de demolição.
  └─ REQUER TOKEN DE APROVAÇÃO EXPLÍCITO COM CONFIRMAÇÃO DE DUPLO FATOR.
```

---

## 3. Gestão de Transações e Tratamento de Falhas

No Autodesk Revit, o término de uma transação via `Transaction.Commit()` **não** garante que as mudanças foram persistidas com sucesso. O Revit API Failure Handling System pode intervir, resultando em 3 estados possíveis:
- `TransactionStatus.Committed`: Sucesso pleno.
- `TransactionStatus.RolledBack`: Transação desfeita devido a conflito de geometria, elementos desconectados ou veto de plugin.
- `TransactionStatus.Pending`: Transação aguardando intervenção manual do usuário em diálogo modal.

### Garantia do Sandbox ArqVértice:
- O ArqVértice **sempre** inspeciona o retorno exato do status da transação.
- Avisos críticos de geometria (ex: "Paredes se sobrepõem", "Porta cortada incorretamente") nunca são mascarados.
- Se uma transação resultar em `RolledBack`, o sandbox gera um relatório completo de falha (`FailureReport`) e limpa qualquer estado parcial, garantindo a integridade referencial do modelo.
