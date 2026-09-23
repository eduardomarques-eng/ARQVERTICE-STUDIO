# K05 — ArqVértice Studio: Proxy Reverso, SSL & Política de Cache

## 1. Visão Geral
Este documento estabelece a política de borda (CDN / Reverse Proxy), terminação TLS/SSL automática e a hierarquia de controle de cache (`Cache-Control`) para garantir máxima fluidez na entrega de modelos 3D volumosos e metadados no **ArqVértice Studio** e **Client Viewer**.

---

## 2. Matriz de Políticas de Cache por Tipo de Recurso

| Categoria de Recurso | Padrão de Rota / Extensões | Cabeçalho `Cache-Control` | TTL Máximo | Estratégia de Revalidação / Invalidação |
| :--- | :--- | :--- | :---: | :--- |
| **Assets 3D Imutáveis** | `*.glb`, `*.gltf`, `*.bin`, `*.ktx2`, `*.sog`, `*.spz`, `*.ksplat`, `/storage/web/*` | `public, max-age=31536000, immutable` | **1 ano** | **Cache Imutável**: Invalidação ocorre via hash no nome do arquivo ou `versionId`. |
| **Manifestos de Projeto** | `/api/projects/*/manifest`, `project.manifest.json` | `public, max-age=60, stale-while-revalidate=300` | **60 seg** | **Stale-While-Revalidate**: Serve versão recente da borda enquanto revalida em background. |
| **Páginas HTML & App Shell** | `/`, `/index.html`, `/viewer.html`, `/portal.html` | `no-cache, no-store, must-revalidate` | **0 seg** | **Zero Cache de Disco**: Força busca da versão mais nova dos bundles JS e CSS. |
| **Assets Estáticos de UI** | `*.css`, `*.js`, `*.woff2`, `*.png`, `*.webp`, `*.svg` | `public, max-age=86400, stale-while-revalidate=604800` | **24 horas** | Cache de 1 dia na borda com fallback de 7 dias durante revalidação assíncrona. |

---

## 3. Cabeçalhos de Segurança (OWASP Compliant)

Para proteger a integridade dos dados e prevenir ataques (XSS, Clickjacking, MIME-Sniffing):

```http
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://unpkg.com https://cdnjs.cloudflare.com blob:; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://images.unsplash.com https://*.arqvertice.com; media-src 'self' blob:; connect-src 'self' https://unpkg.com https://api.omniroute.ai http://127.0.0.1:11434 http://127.0.0.1:48080 wss:; frame-ancestors 'self' https://*.arqvertice.com;
```

---

## 4. Regras de Invalidação de Cache

1. **Invalidação por Hash de Conteúdo**:
   - Todo modelo 3D processado pelo pipeline K06 recebe sufixo de hash SHA-256 (ex: `sofa_living@a8f3c2.glb`).
   - Alterações no projeto nunca sobrescrevem a URL de um asset antigo, eliminando a necessidade de purge manual na CDN.
2. **Atualização do Manifesto**:
   - Ao alterar materiais ou mobiliário, o `project.manifest.json` é regerado com novo `manifestHash`. O Client Viewer detecta a divergência de hash a cada 60 segundos e carrega os novos deltas sob demanda.
