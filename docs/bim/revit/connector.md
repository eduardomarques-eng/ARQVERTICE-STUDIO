# Conector Local e Protocolo de Transporte

O conector local (`js/revit-local-connector.js`) realiza a ponte segura entre a interface web e o serviço do Revit rodando na máquina do arquiteto.

---

## 1. Transporte TCP em Loopback

- **Host**: `127.0.0.1` (localhost).
- **Porta Padrão**: `4848`.
- **Protocolo**: mensagens JSON delimitadas por linha.
- **Segurança**: token de sessão e lista branca de operações.

---

## 2. Envelopes de Comunicação

### Envelope de Solicitação (Request)
```json
{
  "requestId": "req_17112001_abcde",
  "projectId": "PRJ_ACTIVE",
  "documentId": "Residencia_Alphaville.rvt",
  "operation": "QUERY_ELEMENTS",
  "input": { "category": "Walls" },
  "mode": "read",
  "userApproved": false
}
```

### Envelope de Resposta (Response)
```json
{
  "requestId": "req_17112001_abcde",
  "status": "success",
  "result": { "totalFound": 18, "elements": [] },
  "warnings": [],
  "errors": [],
  "changes": []
}
```
