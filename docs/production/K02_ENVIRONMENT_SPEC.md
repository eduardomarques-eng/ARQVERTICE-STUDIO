# K02 — ArqVértice Studio: Especificação de Ambientes & Gestão Estrita de Secrets

## 1. Visão Geral
Este documento define a hierarquia de configurações, a matriz de variáveis de ambiente e as políticas de segurança de credenciais para o **ArqVértice Studio** nos ambientes de **Desenvolvimento (Dev)**, **Homologação (Staging)** e **Produção (Prod)**.

---

## 2. Regra de Ouro da Gestão de Secrets
> [!CAUTION]
> **NUNCA** comitar credenciais, chaves de API, senhas ou certificados em arquivos rastreados pelo Git, templates ou prompts.
> Todas as chaves devem ser injetadas exclusivamente via variáveis de ambiente fornecidas por vaults de produção (Kubernetes Secrets, AWS Secrets Manager, Vault, GCP Secret Manager).

---

## 3. Matriz de Variáveis de Ambiente

| Variável | Tipo / Formato | Obrigatória em Prod? | Classificação | Propósito e Valores Permitidos |
| :--- | :---: | :---: | :---: | :--- |
| **`NODE_ENV`** | String | **Sim** | Operacional | `development`, `staging`, `production`, `test`. Define o modo de execução e rigor das validações. |
| **`PORT`** | Inteiro | **Sim** | Rede | Porta TCP do servidor HTTP (ex: `3000` em dev, `8080` em prod). |
| **`HOST`** | String | Não | Rede | Interface de bind (padrão: `0.0.0.0`). |
| **`DATABASE_URL`** | URI | **Sim** | **Crítico** | URI de conexão com o banco de dados (`postgresql://...` em prod, `sqlite://...` em dev). |
| **`SQLITE_PATH`** | Caminho | Não | Persistência | Caminho local do arquivo SQLite (apenas em dev/test). |
| **`STORAGE_ROOT`** | Caminho | Não | Armazenamento | Raiz do sistema de arquivos local para assets temporários (`/var/arqvertice/storage`). |
| **`S3_ENDPOINT`** | URL | **Sim** | Infraestrutura | Endpoint da API compatível com S3 / Cloudflare R2 / MinIO. |
| **`S3_BUCKET_NAME`** | String | **Sim** | Infraestrutura | Nome do bucket principal de assets 3D do projeto. |
| **`S3_ACCESS_KEY_ID`** | String | **Sim** | **Secret** | ID da chave de acesso S3 (injetado via Secret Manager). |
| **`S3_SECRET_ACCESS_KEY`**| String | **Sim** | **Secret** | Segredo da chave de acesso S3 (injetado via Secret Manager). |
| **`S3_REGION`** | String | Não | Infraestrutura | Região S3 (padrão: `sa-east-1` ou `us-east-1`). |
| **`CORS_ALLOWED_ORIGINS`**| CSV de URLs | **Sim** | **Segurança** | Lista explícita de origens permitidas (wildcard `*` é **proibido** em produção). |
| **`JWT_SECRET`** | String | **Sim** | **Crítico** | Chave de assinatura HMAC/JWT com $\ge 32$ caracteres (recomendado $\ge 64$). |
| **`SESSION_SECRET`** | String | **Sim** | **Crítico** | Segredo de criptografia de sessão de cookies com $\ge 32$ caracteres. |
| **`COOKIE_SECURE`** | Boolean | Não | Segurança | Força flag `Secure; SameSite=Strict; HttpOnly` em cookies (padrão `true` em prod). |
| **`OLLAMA_HOST`** | URL | Não | IA (Local) | Endpoint do daemon local Ollama (ex: `http://127.0.0.1:11434`). |
| **`AI_GATEWAY_URL`** | URL | **Sim** | IA (Gateway) | Endpoint do OmniRoute / Astra Gateway para tarefas avançadas de IA. |
| **`OPENAI_API_KEY`** | String | Não | **Secret** | Chave de API OpenAI (lida apenas pelo backend do servidor). |
| **`ANTHROPIC_API_KEY`** | String | Não | **Secret** | Chave de API Anthropic (lida apenas pelo backend do servidor). |
| **`GEMINI_API_KEY`** | String | Não | **Secret** | Chave de API Google Gemini (lida apenas pelo backend do servidor). |
| **`REVIT_MCP_PORT`** | Inteiro | Não | Integração | Porta do listener local do conector Revit (padrão: `48080`). |
| **`REVIT_SYNC_ENABLED`** | Boolean | Não | Integração | Habilita/desabilita conector com Revit em runtime. |

---

## 4. Esquema de Validação Fail-Fast

A aplicação implementa o módulo [`src/config/env.schema.ts`](file:///c:/Users/erick/ARQVERTICE-STUDIO/src/config/env.schema.ts) e [`js/config/env-schema.js`](file:///c:/Users/erick/ARQVERTICE-STUDIO/js/config/env-schema.js).

### Comportamento Fail-Fast:
1. **Ambiente de Desenvolvimento**: Valores ausentes recebem defaults seguros locais (SQLite local, porta 3000, segredos de teste).
2. **Ambiente de Produção / Staging**: Se qualquer variável obrigatória estiver ausente ou inválida (ex: `JWT_SECRET` com menos de 32 caracteres, `CORS_ALLOWED_ORIGINS="*"` ou `DATABASE_URL` vazia), o validador lança um `EnvValidationError` e o processo é abortado imediatamente antes de abrir portas TCP ou aceitar conexões.
3. **Isolamento do Client Viewer**: Nenhuma chave de API (`OPENAI_API_KEY`, etc.) é injetada em scripts estáticos entregues ao navegador do cliente.

---

## 5. Hierarquia de Arquivos de Configuração

- `.env.example` — Modelo canônico versionado no Git com placeholders.
- `.env.development` — Configuração pronta para desenvolvedores locais com banco SQLite.
- `.env.staging.example` — Template para ambiente de homologação.
- `.env.production.example` — Template para ambiente de produção com injeção via Vault.
- `.gitignore` — Regra estrita bloqueando qualquer comit de `.env*` reais, certificados e bancos `*.db`.
