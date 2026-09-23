# ARQVERTICE STUDIO — AUDITORIA DE SEGURANÇA DA APLICAÇÃO (K04)

> **Documento Oficial de Engenharia de Segurança & Análise de Vulnerabilidades**  
> **Versão:** 1.0.0 | **Conformidade:** OWASP Top 10 / SANS Top 25

---

## 1. Segurança no Frontend

- **Prevenção de XSS e Injeção de DOM:**
  - Manipulação de texto dinâmica feita via `textContent` ou templates sanitizados com `SecurityGovernance.escapeHtml`.
  - Ausência de `eval()` dinâmico não seguro; uso restrito de `'wasm-unsafe-eval'` no CSP exclusivamente para WebAssembly/WebGPU.
- **Proteção de Dados Sensíveis e Tokens:**
  - Chaves de API de terceiros nunca são salvas em `localStorage` ou expostas no bundle do cliente.
  - Acesso ao Client Viewer usa tokens de curta duração ou links autenticados com UUIDv4.

---

## 2. Segurança no Backend & Camada de API

- **Validação de Entrada:** Todas as rotas de escrita validam o corpo da requisição e tamanho máximo de payload.
- **Bloqueio de Métodos HTTP:** Métodos perigosos (`TRACE`, `TRACK`, `CONNECT`) bloqueados com resposta `405`.
- **Prevenção de Directory Traversal:** Todos os caminhos de arquivos são normalizados via `path.normalize` e validados com `safePath.startsWith(BASE_DIR)`.
- **Controle de CORS:** Origens restritas a domínios autorizados (`https://app.arqvertice.com`, `https://viewer.arqvertice.com`).

---

## 3. Cabeçalhos de Segurança (HTTP Security Headers)

Configurados em Caddy e Nginx:
- **Content-Security-Policy (CSP):** `default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://unpkg.com blob:; worker-src 'self' blob:;`
- **Strict-Transport-Security (HSTS):** `max-age=63072000; includeSubDomains; preload` (2 anos).
- **X-Content-Type-Options:** `nosniff`.
- **X-Frame-Options:** `SAMEORIGIN`.
- **Referrer-Policy:** `strict-origin-when-cross-origin`.
- **Permissions-Policy:** `camera=(), microphone=(), geolocation=(), payment=()`.

---

## 4. Sanitização de Upload de Arquivos 3D & BIM

Implementada no módulo [`js/security/upload-sanitizer.js`](file:///c:/Users/erick/ARQVERTICE-STUDIO/js/security/upload-sanitizer.js):
- Validação obrigatória de **Magic Bytes** (`.glb`, `.ifc`, `.ply`, `.ktx2`, imagens).
- Rejeição imediata de arquivos forjados (ex: executáveis renomeados para `.glb`).
- Limite estrito de 500MB com proteção contra descompressão infinita (Zip-Bombs).

---

## 5. Salvaguardas para Motores de Inteligência Artificial

- **Prevenção de Prompt Injection:** Comandos de linguagem natural passam pelo parser determinístico (`AI3DCommandEngine`) com lista fechada de ações (`select`, `hide`, `move`, etc.).
- **Travas Estruturais:** Modificações em pilares, vigas ou elementos com `isStructural: true` são bloqueadas sem confirmação explícita de engenharia.
- **Nenhum Dado Privado Exposto:** Prompts não enviam tokens ou dados confidenciais para gateways externos sem anonimização prévia.

---

## 6. Governança de Segredos (Zero Secrets in Repo)

- Varredura periódica de commits com **Gitleaks**.
- Mascaramento automático no logger estruturado de variáveis como `JWT_SECRET`, `SESSION_SECRET` e `APS_CLIENT_SECRET`.
