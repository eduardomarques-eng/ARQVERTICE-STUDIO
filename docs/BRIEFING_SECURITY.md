# ARQVERTICE STUDIO — SEGURANÇA E MODELO DE TOKENS (BLOCO B)
## PROTEÇÃO DE ACESSO, PRIVACIDADE E VALIDAÇÃO

**Documento:** docs/BRIEFING_SECURITY.md  
**Status:** Implementado em `js/state.js` e `js/briefing-engine.js`  

---

### 1. DIRETRIZES DE SEGURANÇA DE LINKS PÚBLICOS

1. **Tokens Criptográficos Seguros**:
   - Os tokens são gerados via `window.crypto.getRandomValues(new Uint8Array(32))` convertidos para 64 caracteres hexadecimais aleatórios.
   - É estritamente proibido utilizar IDs sequenciais, CPFs, e-mails, nomes ou slugs previsíveis.
2. **Revogação e Renovação Instantâneas**:
   - A qualquer momento, a administração da ArqVértice pode acionar "Renovar Token" (invalidando o anterior imediatamente) ou "Revogar Link" (bloqueando qualquer novo acesso).
3. **Isolamento de Domínio**:
   - O portal do cliente (`briefing.html`) não instancia controladores administrativos e não expõe identificadores internos do banco de dados na URL.
