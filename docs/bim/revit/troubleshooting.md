# Revit Connector & MCP Troubleshooting Guide

## 1. Diagnóstico de Problemas Comuns

### 1. Conexão Recusada (`ECONNREFUSED 127.0.0.1:4848`)
* **Causa**: O Revit não está aberto ou o Add-In `ArqVerticeRevitConnector` não foi carregado.
* **Solução**:
  1. Verifique se o Revit (2024, 2025 ou 2026) está em execução.
  2. Confirme que o arquivo `ArqVertice.addin` está na pasta `%APPDATA%\Autodesk\Revit\Addins\<Versão>\`.
  3. No Revit, verifique se a aba **ArqVértice** ou o Dockable Pane está visível.
  4. Cheque o log do conector em `%TEMP%\ArqVerticeBridge.log`.

### 2. Elemento Não Editável (`ELEMENT_NOT_EDITABLE`)
* **Causa**: O modelo possui Worksharing ativado e o elemento está sob controle de outro projetista ou workset bloqueado.
* **Solução**:
  1. Solicite a liberação do elemento no Revit pelo usuário proprietário (`Relinquish Borrowed Elements`).
  2. Execute `Synchronize with Central` no Revit local antes de disparar automações de escrita.
  3. O agente do ArqVértice nunca força a apropriação para evitar corrupção de trabalho compartilhado.

### 3. Falha de Transação e Rollback (`TransactionStatus.RolledBack`)
* **Causa**: Uma operação de escrita violou restrições paramétricas do Revit (ex: cota negativa, porta fora do hospedeiro, parede sobreposta).
* **Solução**:
  1. Inspecione o `FailureReport` emitido no console do ArqVértice.
  2. Ajuste os parâmetros de entrada para respeitar os limites físicos da família.
  3. Certifique-se de que a parede hospedeira suporta a profundidade e largura da nova esquadria.

### 4. Erro de Permissão MCP (`UNAUTHORIZED_ACCESS`)
* **Causa**: Uma ferramenta com nível de risco `WRITE_SENSITIVE` ou `DELETE` foi chamada sem token de autorização humana.
* **Solução**:
  1. Revise o Changeset no painel de aprovação do ArqVértice.
  2. Clique em "Aprovar Transação" para gerar o token criptográfico de execução.
  3. Repasse o token na chamada `executeAction(planId, authToken)`.

### 5. Lentidão ou Timeout em Modelos Gigantes (> 100.000 elementos)
* **Causa**: Consulta irrestrita sem filtros ou paginação adequada.
* **Solução**:
  1. Utilize sempre filtros de categoria (`category: "Doors"`) ou nível (`level: "Nível 01"`).
  2. Habilite paginação com `limit: 100` e `offset: 0` nas opções de consulta.
  3. Evite carregar parâmetros de geometria completa em lote a menos que estritamente necessário.
