# ArqVértice Studio — Modelo de Dados RENDER_JOB

## 0. Visão Geral

O `RENDER_JOB` representa uma unidade de processamento de imagem renderizada no ArqVértice Studio. Cada render gerado, em andamento, cancelado ou rejeitado possui um registro imutável em histórico.

---

## 1. Estrutura Canônica do `RENDER_JOB`

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `VARCHAR(64)` | Identificador universal único do job (`job-rnd-...`) |
| `projectId` | `VARCHAR(64)` | Identificador do projeto ao qual pertence |
| `environmentId` | `VARCHAR(64)` | Identificador do ambiente arquitetônico |
| `cameraId` | `VARCHAR(64)` | Câmera mestre selecionada (D05) |
| `userIntent` | `TEXT` | Intenção informada pelo usuário (ex: *"Troque o sofá por um modelo mais leve."*) |
| `contextVersion` | `VARCHAR(32)` | Versão do ambiente no momento do disparo (`V01`, `V02`, `V03`) |
| `promptVersion` | `VARCHAR(32)` | Versão incremental do compilador de prompt (`PV01`, `PV02`) |
| `compiledPrompt` | `OBJECT / JSONB` | Pacote multidimensional de contexto com prompt e negativos |
| `inputAssets` | `ARRAY` | Referências de entrada pertinentes selecionadas |
| `provider` | `VARCHAR(64)` | Nome do provedor executante (`gemini`, `mock`, etc.) |
| `model` | `VARCHAR(128)` | Modelo específico (`imagen-3.0-generate-002`, etc.) |
| `parameters` | `OBJECT / JSONB` | Resolução, aspect ratio, seed, guidance scale e pesos |
| `status` | `VARCHAR(32)` | Estado do ciclo de vida |
| `progress` | `INTEGER` | Progresso numérico da geração (0 a 100) |
| `output` | `OBJECT / JSONB` | Imagem gerada, miniatura, semente e custos |
| `errorMessage` | `TEXT` | Mensagem descritiva em caso de falha |
| `retryCount` | `INTEGER` | Número de tentativas executadas |
| `approvedBy` | `VARCHAR(128)` | Usuário humano que homologou a imagem |
| `approvedAt` | `TIMESTAMP` | Timestamp da homologação humana |
| `rejectionReason`| `TEXT` | Motivo de rejeição informado pelo arquiteto |
| `createdAt` | `TIMESTAMP` | Momento da criação e enfileiramento |
| `startedAt` | `TIMESTAMP` | Início do processamento no provider |
| `completedAt` | `TIMESTAMP` | Conclusão da geração |

---

## 2. Ciclo de Estados (`RENDER_JOB_STATUSES`)

```
   [createRenderJob]
          │
          ▼
       QUEUED ──────────────► CANCELLED (pelo usuário)
          │
          ▼ [startRenderJob]
      GENERATING ───────────► CANCELLED (pelo usuário)
       │      │
       │      └─────────────► FAILED ──► [retryRenderJob] ──► QUEUED
       ▼
   SUCCEEDED
    │     │
    │     └─────────────────► REJECTED (humano)
    ▼
 APPROVED (humano)
```

1. **`QUEUED`**: Job registrado no sistema, aguardando início de comunicação com o provider.
2. **`GENERATING`**: Em execução na GPU do provider (trava anti-duplicação ativa).
3. **`SUCCEEDED`**: Imagem produzida e armazenada com sucesso. Disponível para visualização e avaliação.
4. **`FAILED`**: Erro técnico de conexão, timeout ou sobrecarga. Permite retry seguro.
5. **`CANCELLED`**: Cancelamento solicitado pelo usuário antes da conclusão.
6. **`REJECTED`**: Render recusado formalmente pelo arquiteto por motivo estético ou técnico.
7. **`APPROVED`**: Homologado pelo arquiteto titular como referência visual oficial do ambiente.

---

## 3. Imutabilidade e Não-Destrutividade

Nenhum arquivo ou render gerado anteriormente é sobrescrito ou apagado. Todo novo render recebe um identificador único, preserva o histórico de versões e permite auditoria completa de parâmetros, custos e intenções ao longo de todo o ciclo de projeto.
