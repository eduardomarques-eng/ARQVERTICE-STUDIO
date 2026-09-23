# ARQVERTICE STUDIO — OBSERVABILIDADE & MONITORAMENTO DE ERROS (K12)

> **Documento Oficial de Monitoramento, Diagnóstico de Incidentes & Logs Estruturados**  
> **Versão:** 1.0.0 | **Padrão:** JSON Estruturado com Correlation ID

---

## 1. Estrutura Canônica de Erro e Correlation ID

Todas as falhas em produção são empacotadas com o padrão:

```json
{
  "errorCode": "ERR_BIM_PARSER_CORRUPTED_IFC",
  "userMessage": "O arquivo IFC selecionado possui formato corrompido ou incompatível.",
  "technicalCause": "STEP Parser SyntaxError at line 4820: Unexpected EOF",
  "correlationId": "req_1790201092841_f8b2a1",
  "timestamp": "2026-09-23T19:10:00.000Z",
  "service": "bim-viewer-module",
  "level": "ERROR"
}
```

---

## 2. Categorias de Logging Estruturado

- `INFO`: Operações normais do ciclo de vida (deploy concluído, snapshot criado, usuário autenticado).
- `WARN`: Condições que exigem atenção sem interrupção de serviço (queda temporária de FPS, fallback de WebGPU para WebGL2).
- `ERROR`: Falhas funcionais rastreáveis (erro de parsing, falha em query de banco, timeout de API).
- `AUDIT`: Registros regulatórios e de governança (deploy, rollback, aprovação de versão de projeto).
- `SECURITY`: Eventos de defesa (bloqueio de IDOR, tentativa de path traversal, rejeição de métodos HTTP não autorizados).

---

## 3. Captura de Erros no Frontend

Implementado via interceptores globais:
1. `window.onerror`: Captura falhas de runtime e compilação de shaders Three.js.
2. `window.onunhandledrejection`: Intercepta promessas rejeitadas e requisições de rede abortadas.
3. `StructuredLogger`: Sanitiza mensagens antes do envio, removendo senhas e tokens com `[REDACTED]`.
