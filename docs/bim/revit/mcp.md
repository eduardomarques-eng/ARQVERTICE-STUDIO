# Revit Model Context Protocol (MCP) Bridge

## 1. Arquitetura e Referência LuDattilo/revit-mcp-server

O ArqVértice Studio adota o padrão **Model Context Protocol (MCP)** para expor o Autodesk Revit como um servidor de contexto e ferramentas para agentes de IA. A arquitetura foi inspirada na auditoria de `LuDattilo/revit-mcp-server`, incorporando melhorias cruciais de segurança:

1. **Separação de Camadas**: Nenhum socket raw ou assembly do Revit é embutido no client web; a ponte ocorre através do `RevitMCPAdapter` e `RevitLocalConnector`.
2. **Governança Estrita de Permissões**: Classificação de cada ferramenta em 5 níveis hierárquicos (`READ_ONLY`, `PROPOSE`, `WRITE_REVERSIBLE`, `WRITE_SENSITIVE`, `DELETE`).
3. **Imutabilidade e Idempotência**: Ferramentas de leitura e análise são puras e sem efeitos colaterais no modelo.

```text
┌────────────────┐      MCP Protocol       ┌─────────────────────┐
│  AI Router /   │ ◄─────────────────────► │   RevitMCPAdapter   │
│  BIM Agent     │       JSON-RPC          │  (Schema & Policy)  │
└────────────────┘                         └──────────┬──────────┘
                                                      │ TCP Loopback
                                                      ▼
                                           ┌─────────────────────┐
                                           │  Revit C# Connector │
                                           │  (In-Process AddIn) │
                                           └─────────────────────┘
```

---

## 2. Catálogo Oficial de Ferramentas MCP

O `RevitMCPAdapter` registra e expõe 12 ferramentas padronizadas com schema JSON Schema v7:

### Ferramentas de Leitura & Análise (READ / QUERY / ANALYZE)
* **`revit.get_project_info`**: Retorna metadados gerais do documento ativo.
* **`revit.get_selected_elements`**: Obtém os elementos sob foco/seleção do arquiteto.
* **`revit.get_element_parameters`**: Inspeciona parâmetros de instância e tipo para um ElementId.
* **`revit.query_elements`**: Filtra elementos por categoria, nível, parâmetros ou bounding box.
* **`revit.get_rooms`**: Consulta espacial de ambientes, áreas, perímetros e números.
* **`revit.get_materials`**: Extrai catálogo de materiais e propriedades de render/físicas.
* **`revit.validate`**: Roda testes de auditoria geométrica, integridade de vãos e conformidade NBR.

### Ferramentas de Proposição & Exportação (PROPOSE / EXPORT)
* **`revit.export`**: Gera propostas de exportação (DWG, IFC 4x3, PDF de pranchas).

### Ferramentas de Escrita & Modificação (WRITE / TRANSACTION)
* **`revit.create_view`**: Gera vistas de planta, corte ou elevação (`WRITE_REVERSIBLE`).
* **`revit.create_sheet`**: Cria e diagrama pranchas com viewport e carimbo (`WRITE_REVERSIBLE`).
* **`revit.set_parameter`**: Atualiza valores de parâmetros com conversão de unidades (`WRITE_REVERSIBLE`).
* **`revit.modify_element`**: Altera tipo de família ou geometria (`WRITE_SENSITIVE`, requer aprovação).

---

## 3. Matriz de Autorização e Níveis de Permissão

| Permissão | Acesso Direto pela IA | Requer Confirmação Humana | Exemplo de Ferramenta |
| :--- | :---: | :---: | :--- |
| `READ_ONLY` | Sim | Não | `revit.query_elements`, `revit.get_rooms` |
| `PROPOSE` | Sim (Cria Draft) | Não (Gera Preview) | `revit.export`, `preview_sheet` |
| `WRITE_REVERSIBLE` | Sim (se L3 autorizado) | Opcional | `revit.set_parameter`, `revit.create_view` |
| `WRITE_SENSITIVE` | Não | **Obrigatória** | `revit.modify_element` (troca de família) |
| `DELETE` | **Bloqueada** | **Token de Autorização** | `revit.delete_elements` |

---

## 4. Tratamento de Respostas MCP

Todas as invocações de ferramentas retornam o formato padrão MCP `content`:

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"success\": true,\n  \"elementsFound\": 12,\n  \"category\": \"Doors\"\n}"
    }
  ],
  "isError": false
}
```
Caso ocorra uma falha ou bloqueio de permissão, `isError: true` é retornado acompanhado da mensagem explicativa no payload.
