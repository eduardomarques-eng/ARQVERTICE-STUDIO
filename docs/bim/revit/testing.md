# Revit BIM QA & Testing Strategy

## 1. Estratégia de Testes Automatizados

A integração Revit-ArqVértice é validada por uma suíte completa de testes unitários e de integração simulada em Node.js (`tests/revit-mcp-agent-qa.test.js` e `tests/revit-bim-platform.test.js`).

A metodologia apoia-se em 3 pilares de verificação:
1. **Mock Driver Determinístico**: Simulação de alta fidelidade do comportamento da API Revit sem necessidade de licença ativa em pipelines de CI.
2. **Teste de Carga e Escala**: Simulação de projetos de grande porte (> 50.000 instâncias) avaliando paginação, limitação de payload e tempo de resposta.
3. **Injeção de Falhas**: Simulação de desconexão abrupta de socket, bloqueio por worksharing, parâmetros read-only e rollback de transação.

---

## 2. Cenários Obrigatórios de Teste

| Cenário | Descrição do Teste | Critério de Sucesso |
| :--- | :--- | :--- |
| **Connection Test** | Conexão socket loopback com handshake de protocolo | Retorno de `RevitBridgeInfo` e versão do Revit |
| **Read Test** | Consulta de elementos, ambientes, parâmetros e seleção | Retorno estruturado de propriedades tipadas |
| **Write Test** | Proposta de alteração de parâmetros e substituição de tipos | Geração de changeset e commit com validação |
| **Failure Test** | Tentativa de escrita em elemento bloqueado por outro usuário | Rejeição com código `ELEMENT_NOT_EDITABLE` |
| **Rollback Test** | Transação que gera erro de integridade geométrica | Rollback automático sem corrupção e log de advertência |
| **MCP Discovery** | Descoberta de catálogo e schemas das ferramentas MCP | 100% de conformidade com JSON Schema v7 |
| **Security Gate** | Tentativa de exclusão ou alteração L4/L5 sem aprovação | Bloqueio preventivo pelo Sandbox |
| **Pagination Test** | Consulta com mais de 10.000 elementos | Execução paginada respeitando limites de memória |

---

## 3. Como Executar os Testes

Para executar a validação de QA da integração Revit MCP e Agente BIM:

```bash
# Execução da suíte completa de QA Revit
node tests/revit-mcp-agent-qa.test.js

# Execução da suíte de conectividade e motores de leitura/escrita
node tests/revit-bim-platform.test.js

# Execução de workflows avançados e inteligência
node tests/revit-advanced-bim.test.js
```
