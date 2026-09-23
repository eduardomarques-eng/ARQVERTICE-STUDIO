# ARQVERTICE STUDIO — POLÍTICA E ARQUITETURA DE SEGURANÇA (I17)
## Governança da Camada de IA, Sandbox de Arquivos e Proteção de Frontend

---

## 1. Princípio de Autoridade

> **"Nenhum modelo de IA deve possuir autoridade implicitamente maior do que o software que o executa."**

No ArqVértice Studio, todas as decisões de acesso ao sistema de arquivos, despacho de ferramentas, mutações de estado em banco de dados e ações com efeito externo são governadas de forma determinística por código compilado/interpretado no runtime do cliente e servidor (`server.js`), nunca delegadas à autonomia cega de prompts probabilísticos.

---

## 2. Pilares de Segurança Implementados

### 2.1 Zero Secrets no Frontend
- Todas as credenciais de provedores externos (OpenAI, Anthropic, Google Cloud) residem exclusivamente em variáveis de ambiente protegidas no backend.
- O auditor estático `SecretsAuditor` em `js/security-governance.js` varre requisições e objetos de estado em busca de assinaturas de chaves privadas e API keys (`sk-*`), gerando alerta e bloqueio imediato se detectadas no bundle web.

### 2.2 Defesa contra Prompt Injection
Todo conteúdo proveniente do ambiente externo (documentos técnicos, uploads de clientes, metadados IFC, imagens de referência e texto livre digitado) é classificado categoricamente como **não confiável** (`UntrustedContent`).

A arquitetura estabelece containers estruturados separados:
```text
┌────────────────────────────────────────────────────────┐
│ [TRUSTED_SYSTEM_INSTRUCTIONS]                          │
│ Prompts de sistema homologados e regras NBR estritas  │
└────────────────────────────────────────────────────────┘
                          ▼
┌────────────────────────────────────────────────────────┐
│ [UNTRUSTED_USER_AND_EXTERNAL_DATA]                     │
│ <external_source name="documento_cliente">             │
│   Conteúdo externo sanitizado (tags perigosas stripped)│
│ </external_source>                                     │
└────────────────────────────────────────────────────────┘
```
Padrões maliciosos conhecidos (`ignore previous instructions`, `developer mode`, `system override`, `reveal system prompt`) são filtrados e sinalizados via telemetria antes de atingir qualquer modelo.

### 2.3 Matriz de Autoridade e Controle de Ferramentas
Cada agente orquestrado (`planner`, `decision`, `specialist`, `executor`, `validator`) opera sob uma matriz de ferramentas estrita:

| Papel | Ferramentas Permitidas | Proibições Explícitas |
| :--- | :--- | :--- |
| **`planner`** | `decompose_task`, `estimate_latency`, `draft_plan` | Mutação de estado, queries destrutivas |
| **`decision`** | `jev_evaluate`, `check_nbr_rules`, `resolve_conflict` | Escrita direta no banco, publicação |
| **`specialist`** | `bim_query`, `video_narrative_draft`, `render_analysis` | Execução de comandos de sistema |
| **`executor`** | `state_mutate_draft`, `cache_write`, `export_preview` | Ações destrutivas sem aprovação |
| **`validator`** | `nbr_audit`, `design_token_audit`, `accessibility_audit` | Mutação de arquivos ou dados |

### 2.4 Sandbox do Sistema de Arquivos
- **Diretórios Permitidos:** Apenas `projects/`, `cache/`, `exports/`, `database/`, `video/`.
- **Extensões Válidas:** `.json`, `.ifc`, `.png`, `.jpg`, `.jpeg`, `.svg`, `.mp4`, `.webm`, `.csv`, `.txt`.
- **Vetores Bloqueados:** Path traversal (`..`), caminhos absolutos de sistema (`C:\`, `/etc/passwd`, `/system32`), arquivos `.env` e repositórios `.git`.
- **Teto de Arquivo:** Máximo de 50 MB por operação de carregamento/leitura.

### 2.5 Guarda de Ações Destrutivas (Two-Phase Commit)
Ações irreversíveis exigem confirmação explícita em dois passos:
1. `delete_project`
2. `overwrite_model`
3. `publish_client_portal`
4. `export_production_package`
5. `permanent_state_wipe`

O sistema emite um token efêmero (`act_<timestamp>_<hash>`) com validade de 120 segundos. A ação só é despachada após validação desse token pelo operador humano.

### 2.6 Sanitização de Logs e Telemetria
O `TelemetrySanitizer` aplica máscaras regex contínuas em todos os logs de console e eventos de observabilidade:
- Chaves de API mascaradas como `[REDACTED_API_KEY]`.
- Tokens Bearer mascarados como `Bearer [REDACTED_TOKEN]`.
- CPFs, senhas e e-mails pessoais anonimizados antes do envio ou gravação em log.
