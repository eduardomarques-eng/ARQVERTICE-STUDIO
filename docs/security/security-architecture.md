# ARQVERTICE STUDIO — ARQUITETURA GERAL DE SEGURANÇA DA INFORMAÇÃO (I19)
## Modelo de Ameaças, Segregação de Privilégios e Políticas de Integridade

---

## 1. Modelo de Ameaças (Threat Model)

O ArqVértice Studio opera em um modelo híbrido com três superfícies potenciais de risco:
1. **Frontend do Cliente (Browser):** Exposição acidental de credenciais em bundles estáticos ou console logs; ataques de Cross-Site Scripting (XSS).
2. **Camada de IA e Agentes:** Tentativas de injeção indireta de prompt via anexos ou comentários de clientes, levando o modelo a emitir instruções destrutivas ou vazar dados confidenciais.
3. **Servidor Local / Gateway (`server.js`):** Tentativas de escalonamento de privilégios via path traversal (`../`) ou requisições malformadas para acesso a arquivos do sistema operacional.

---

## 2. Controles de Mitigação Implementados

```text
┌────────────────────────────────────────────────────────┐
│ 1. Frontend Web:                                       │
│    - Zero secrets em bundles e código cliente          │
│    - Sanitização de logs via TelemetrySanitizer        │
│    - CSP e bloqueio de inline scripts perigosos        │
├────────────────────────────────────────────────────────┤
│ 2. Camada de Agentes & IA:                             │
│    - Separação estrita em containers XML seguros       │
│    - Matriz de permissão de ferramentas por papel     │
│    - Guarda de ações destrutivas (Two-Phase Commit)    │
├────────────────────────────────────────────────────────┤
│ 3. Servidor Local & File System:                       │
│    - Path normalization com whitelist de diretórios    │
│    - Limitação de tamanho de upload (máximo 50MB)      │
│    - Rate limiting em 60 req/min por cliente          │
└────────────────────────────────────────────────────────┘
```

---

## 3. Conformidade e Auditoria Contínua

Qualquer nova alteração na base de código deve ser submetida aos testes em `tests/security-governance.test.js` para certificar que nenhum vetor de escape ou secret vazado tenha sido introduzido.
