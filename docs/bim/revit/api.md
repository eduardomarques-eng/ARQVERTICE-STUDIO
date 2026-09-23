# Revit REST & TCP Bridge API Specification

## 1. Visão Geral da API

A camada de comunicação entre o ArqVértice Studio e o Autodesk Revit opera primariamente via canal bidirecional TCP loopback (`127.0.0.1:4848`) ou via proxy HTTP local (`http://127.0.0.1:4849/api/revit`), com fallback para Autodesk Platform Services (APS) quando operando em nuvem.

```text
ArqVértice Client (Browser / Node)
        │  JSON Envelopes
        ▼
RevitLocalConnector (TCP:4848 / HTTP:4849)
        │  IExternalEventHandler (ExternalEvent.Raise())
        ▼
Revit C# Connector Add-In (.NET 8 / Revit API UI Thread)
        │
Document / ActiveUIDocument Execution
```

---

## 2. Envelope de Comando Unificado

Toda requisição segue o contrato estrito `RevitBridgeCommand`:

```json
{
  "id": "cmd_1727050000000_abc123",
  "action": "query_elements",
  "category": "Doors",
  "level": "Nível 02",
  "parameters": ["Height", "Width", "Comments"],
  "options": {
    "includeParameters": true,
    "limit": 50,
    "offset": 0
  },
  "authToken": "sandbox_approved_token_xyz"
}
```

### Resposta Padrão do Add-In:

```json
{
  "id": "cmd_1727050000000_abc123",
  "success": true,
  "action": "query_elements",
  "data": {
    "totalCount": 14,
    "items": [
      {
        "elementId": 412890,
        "name": "Porta Pivotante Madeira",
        "category": "Doors",
        "level": "Nível 02",
        "parameters": {
          "Height": "2.10 m",
          "Width": "0.90 m"
        }
      }
    ]
  },
  "warnings": [],
  "executionTimeMs": 28
}
```

---

## 3. Endpoints e Ações Suportadas

| Ação | Categoria | Descrição | Permissão Mínima |
| :--- | :--- | :--- | :--- |
| `ping` | System | Healthcheck do socket e conexão Revit | `READ_ONLY` |
| `get_project_info` | Metadata | Retorna título, número, cliente, coordenadas e unidades | `READ_ONLY` |
| `get_selected_elements` | Selection | Elementos atualmente selecionados no `UIDocument` | `READ_ONLY` |
| `query_elements` | Filtering | Filtro por categoria, nível, fase e parâmetros | `READ_ONLY` |
| `get_element_parameters` | Parameters | Leitura exaustiva de parâmetros de tipo e instância | `READ_ONLY` |
| `get_rooms` | Spatial | Lista de ambientes, áreas, perímetros e acabamentos | `READ_ONLY` |
| `get_materials` | Assets | Lista de materiais, cores, hachuras e propriedades térmicas | `READ_ONLY` |
| `create_view` | Views | Criação de planta, corte, 3D axonométrica | `WRITE_REVERSIBLE` |
| `create_sheet` | Sheets | Criação de pranchas com carimbo e posicionamento | `WRITE_REVERSIBLE` |
| `set_parameter` | Parameters | Edição de valor de parâmetro com conversão de unidades | `WRITE_REVERSIBLE` |
| `modify_element` | Geometry | Substituição de família, tipo ou movimentação | `WRITE_SENSITIVE` |
| `export_dwg_ifc_pdf` | Export | Exportação em lote de pranchas e modelos | `PROPOSE` |
| `delete_elements` | Destructive | Exclusão de instâncias (requer token explícito) | `DELETE` |

---

## 4. Gestão de Falhas e Erros

Se o Revit emitir erros ou falhas de transação, o retorno encapsulará o código nativo:

```json
{
  "id": "cmd_1727050000000_err",
  "success": false,
  "error": "ELEMENT_NOT_EDITABLE",
  "message": "Elemento 583921 está bloqueado ou tomado pelo usuário 'marcelo.arq'.",
  "failureSeverity": "DocumentError",
  "transactionStatus": "RolledBack"
}
```
