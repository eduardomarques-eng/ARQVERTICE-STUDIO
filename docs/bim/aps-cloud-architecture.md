# Autodesk Platform Services (APS) e Cloud BIM

O **ArqVértice Studio** disponibiliza um caminho duplo (*Dual Path*) para integração com modelos Autodesk Revit:
1. **LIVE DESKTOP**: Comunicação local em tempo real via porta 4848 para o arquiteto trabalhando ativamente na interface do Revit.
2. **CLOUD AUTOMATION**: Processamento assíncrono em lote na nuvem via **Autodesk Platform Services (APS)** para operações pesadas que dispensam um computador com o Revit Desktop aberto.

---

## 1. Topologia da Arquitetura Cloud

```text
                        ARQVERTICE STUDIO (Frontend Web)
                                       │
                                PROJECT CONTEXT
                                       │
                             BIM ABSTRACTION LAYER
                                       │
                 ┌─────────────────────┴─────────────────────┐
                 │                                           │
          LIVE DESKTOP                                 CLOUD AUTOMATION
                 │                                           │
       LOCAL REVIT CONNECTOR                       ARQVERTICE BACKEND
      (TCP 127.0.0.1:4848)                            (server.js)
                 │                                           │ (OAuth 2.0 / Tokens Seguros)
           REVIT ADD-IN                                      ▼
                 │                             AUTODESK PLATFORM SERVICES (APS)
            REVIT API                          ├── Data Management API
                 │                             ├── Model Derivative (SVF2)
            DOCUMENT (.RVT)                    ├── Design Automation Engine
                                               │   (Revit 2025/2026.5 / .NET 10)
                                               └── Webhooks (Job Events)
```

---

## 2. Princípio "Zero Secrets" no Frontend

- **Nenhuma credencial APS** (Client ID, Client Secret, Refresh Tokens) reside no código JavaScript do cliente.
- O frontend solicita tokens de visualização públicos de curta duração (*2-legged viewer scope*) através de endpoints seguros no backend (`/api/aps/token`).
- Operações de escrita ou execução de automação na nuvem exigem autenticação do usuário com autorização explícita via OAuth.

---

## 3. Serviços APS Utilizados

1. **Data Management API**: Armazenamento, versionamento de buckets seguros de projeto e upload multipart de arquivos `.rvt`.
2. **Model Derivative API**: Conversão de arquivos RVT em formatos leves de visualização web (**SVF2**) com extração da árvore de metadados e propriedades IFC.
3. **Design Automation for Revit**: Execução de scripts e AppBundles compilados em contêineres de nuvem headless da Autodesk (suportando os runtimes mais recentes até Revit 2026.5 em .NET moderno).
4. **Webhooks**: Notificações automáticas via HTTP POST emitidas pela Autodesk quando a conversão do modelo ou a execução do Design Automation for finalizada.

## 5. J42 - RevitCloudJob

Operacoes que nao dependem do Revit Desktop usam `RevitCloudJob`, sem substituir o caminho local. O contrato contem `jobId`, `projectId`, `input`, `engine`, `appBundle`, `status`, `progress`, `output` e `errors`.

Estados canonicos: `QUEUED`, `RUNNING`, `SUCCESS`, `FAILED` e `CANCELLED`.

Etapas de progresso: `upload`, `processing`, `extracting`, `validating` e `complete`.

Workflows preparados: `batch_extraction`, `quantity_generation`, `validation`, `documentation`, `export` e `model_processing`.

O AppBundle precisa ser validado especificamente contra `Revit_2026.5` e `.NET 10`. Antes do envio, `getLocalDebugConfiguration()` produz a configuracao para o fluxo de debugging local da Autodesk. Client secrets, refresh tokens e access tokens sao rejeitados no input do frontend e permanecem no backend.
