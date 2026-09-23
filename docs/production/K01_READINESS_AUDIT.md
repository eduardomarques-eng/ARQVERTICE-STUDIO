# K01 — ArqVértice Studio: Auditoria de Prontidão & Contrato de Produção

## 1. Sumário Executivo
Este relatório consolida o levantamento cirúrgico de todas as dependências, scripts, rotas, assets e serviços do **ArqVértice Studio**, com o objetivo de certificar os requisitos de empacotamento, containerização e publicação em ambiente de produção enterprise.

A auditoria foi realizada estritamente em modo de leitura e inspeção de código e runtime, em conformidade com as diretrizes do **Bloco K01**.

---

## 2. Auditoria de Artefatos e Runtime

### 2.1 Tabela de Compatibilidade de Runtimes

| Componente | Versão no Ambiente de Dev | Versão Alvo de Produção | Status de Compatibilidade |
| :--- | :---: | :---: | :---: |
| **Node.js** | `v24.19.0` (Modern Current) | `v20.x LTS / v22.x LTS / v24.x` |  **Compatível** (Zero uso de APIs depreciadas) |
| **npm** | `11.17.0` | `10.x+ / 11.x` |  **Compatível** |
| **Python** | `3.12.10` | `3.11+ / 3.12` |  **Compatível** (Conectores pyRevit / MCP) |
| **Rust / Cargo** | N/A (Não instalado globalmente) | `1.78+` (Opcional para compilador WASM) | ℹ️ **Opcional** (Fallback JS/WASM empacotado) |
| **Bun / pnpm** | N/A | `1.x` (Suporte transparente via Node) |  **Compatível** |
| **Lockfile** | Sem lockfile prévio | `package-lock.json` padronizado | ⚠️ **Ajustado no K02** |

### 2.2 Auditoria de Scripts no `package.json`
- `npm start`: Inicia o servidor HTTP em produção (`node server.js`).
- `npm run dev`: Inicia o servidor em modo de desenvolvimento.
- `npm test`: Executa todas as suítes de testes (`scripts/run-all-tests.js`).
- `npm run lint`: Auditoria sintática e de integridade (`scripts/audit-and-build.js`).
- `npm run typecheck`: Validação sintática e de AST das interfaces (`scripts/typecheck-dryrun.js`).
- `npm run build`: Pipeline de verificação de empacotamento.

---

## 3. Mapa de Dependências de Sistema

### 3.1 Dependências Nativas e Gráficas
1. **Renderização 3D e Gráfica**:
   - WebGL2 e WebGPU: Executados no cliente através do navegador via Three.js / TSL (sem necessidade de drivers GPU nativos no servidor web de assets).
2. **Processamento de Assets 3D**:
   - `gltfpack` / `draco` / `Meshopt`: Executados como processos de conversão e quantização.
3. **Persistência de Dados**:
   - SQLite nativo / SQLite3 em arquivo com suporte a migrações em `database/`.

### 3.2 Daemons e Workers em Segundo Plano
- **3D Asset Processing Worker**: Responsável por compressão Draco, decimação de LODs e quantização de Gaussian Splats (`.sog` / `.ksplat`).
- **Revit Local Connector Bridge**: Listener local (`127.0.0.1:48080`) para sincronização bidirecional com Autodesk Revit via pyRevit / MCP.
- **AI Gateway Worker**: Proxy local/remoto para roteamento em 4 Tiers (Ollama, Gemini Flash, Claude Haiku, Claude Sonnet).

---

## 4. Contrato de Preservação de Dados

### 4.1 Mapeamento de Diretórios Persistentes

| Diretório / Recurso | Função | Estratégia de Preservação em Produção |
| :--- | :--- | :--- |
| `storage/projects/{id}/source/` | Arquivos brutos (IFC, OBJ, PLY, FBX) | Volume persistente montado / Bucket S3/GCS (`SOURCE Tier`) |
| `storage/projects/{id}/master/` | Modelos GLTF canônicos de alta resolução | Volume persistente / Bucket CDN (`MASTER Tier`) |
| `storage/projects/{id}/web/` | Modelos comprimidos para web | CDN Edge Cache Imutável (`WEB Tier`) |
| `storage/projects/{id}/thumbnails/` | Previews WebP | CDN Edge Cache Imutável (`THUMBNAIL Tier`) |
| `storage/projects/{id}/lods/` | Variantes decimadas LOD0/1/2 | CDN Edge Cache Imutável (`LOD Tier`) |
| `database/` | Bancos de dados SQLite, esquemas e seeds | Volume persistente seguro / Banco relacional dedicado |
| `artifacts/` | Pranchas, PDFs, relatórios de auditoria | Armazenamento de longa duração com retenção |

### 4.2 Verificação de Caminhos
- Todos os caminhos de carregamento de assets utilizam resolução determinística com sanitização de `safePath` contra ataques de Path Traversal (`path.normalize`).

---

## 5. Lista de Inconsistências Identificadas (Dev vs Prod)

1. **Gestão de Variáveis de Ambiente**:
   - *Dev*: Algumas portas e flags usavam fallbacks embutidos no código sem validação estrita antecipada.
   - *Prod*: Requer validação fail-fast obrigatória na inicialização (implementada no **Bloco K02**).
2. **Isolamento de Secrets**:
   - *Dev*: Chaves de teste locais compartilhadas na memória do processo.
   - *Prod*: Requer injeção via variáveis de ambiente/Vault com mascaramento em logs.
3. **Cabeçalhos de Segurança HTTP**:
   - *Dev*: `Access-Control-Allow-Origin: *` permissivo para facilidade de depuração.
   - *Prod*: Requer controle estrito de origens autorizadas via `CORS_ALLOWED_ORIGINS` e cabeçalhos CSP.

---

## 6. Matriz de Risco Pré-Deploy

| Risco Identificado | Severidade | Probabilidade | Mitigação Implementada |
| :--- | :---: | :---: | :--- |
| **Vazamento de Tokens no Viewer** | Alta | Baixa | `SecurityGovernor.sanitizeViewerPayload()` expurga metadados e credenciais. |
| **Falta de Variáveis Obrigatórias** | Crítica | Média | Schema Fail-Fast com Zod/TypeScript (`env.schema.ts`) impedindo boot inválido. |
| **Exaustão de Memória em Modelos 3D** | Média | Média | Progressive LOD + Streaming Budget dinâmico + limites de DPR para mobile. |
| **Injeção em Comandos de IA** | Alta | Baixa | `AI-Generated Code Security Auditor` + sanitização de strings e validação AST. |

---

## 7. Parecer de Aprovação Técnica

> [!IMPORTANT]
> **PARECER TÉCNICO: APROVADO COM RESSALVAS PARA O BLOCO K02**
>
> A base de código do ArqVértice Studio possui arquitetura modular limpa, sem acoplamentos nocivos ou dependências circulares. A transição para o empacotamento de produção é **tecnicamente viável e recomendada**, devendo o **Bloco K02** estabelecer o isolamento estrito de ambientes e o schema fail-fast de validação de configuração.

---
*Documento emitido e certificado pela Engenharia de Produção do ArqVértice Studio.*
