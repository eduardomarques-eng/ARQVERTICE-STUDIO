# K07 — ArqVértice Studio: Guia de Observabilidade, Monitoramento & Telemetria

## 1. Visão Geral
Este documento estabelece as diretrizes de observabilidade, monitoramento de integridade e telemetria de performance gráfica para o **ArqVértice Studio** e o **Client Viewer** em produção.

---

## 2. Endpoints de Healthcheck Padronizados

| Endpoint | Método | Descrição | Código Esperado |
| :--- | :---: | :--- | :---: |
| **`/healthz/live`** | `GET` | **Liveness Probe**: Indica se o processo Node.js está ativo e responsivo. | `200 OK` |
| **`/healthz/ready`** | `GET` | **Readiness Probe**: Verifica conectividade com banco de dados, storage de assets e workers. | `200 OK` / `503 Service Unavailable` |
| **`/healthz/gpu`** | `GET` | **GPU Capability Probe**: Retorna o estado do pipeline WebGPU e fallback WebGL2. | `200 OK` |

### Exemplos de Consulta via `curl`:
```bash
curl -i http://localhost:3000/healthz/live
curl -i http://localhost:3000/healthz/ready
curl -i http://localhost:3000/healthz/gpu
```

---

## 3. Formato dos Logs Estruturados em JSON

Todos os serviços de backend e workers gravam logs estruturados contendo `correlationId` para rastreamento distribuído e sanitização automática de tokens/senhas:

```json
{
  "timestamp": "2026-09-23T21:45:00.000Z",
  "level": "INFO",
  "service": "arqvertice-web",
  "correlationId": "cid_8f93a1b2",
  "action": "RENDER_PIPELINE_LOAD",
  "durationMs": 42.5,
  "message": "Modelo 3D carregado com sucesso no viewer.",
  "metadata": {
    "projectId": "prj-praia-01",
    "assetCount": 14,
    "apiKey": "[REDACTED]"
  }
}
```

---

## 4. Telemetria do Client Viewer & Política de Opt-Out

- **Beacon de Performance**: `POST /api/telemetry/render-performance`
- **Métricas Registradas (100% Anônimas)**:
  - `fps`: Taxa média de quadros por segundo.
  - `frameTimeMs`: Tempo de renderização de cada frame em milissegundos.
  - `timeToFirstPixelMs`: Tempo decorrido até o primeiro pixel do modelo 3D aparecer no canvas.
  - `gpuContextLost`: Registro de falha/recuperação do contexto WebGL/WebGPU.
  - `deviceCapabilities`: Memória do dispositivo e suporte a WebGPU.
- **Opt-Out do Usuário**:
  - O usuário pode desabilitar o envio de telemetria a qualquer momento definindo `localStorage.setItem('arqvertice_telemetry_optout', 'true')`.

---

## 5. Catálogo Canônico de Códigos de Erro

| Código | Categoria | Descrição / Causa | Ação Recomendada |
| :--- | :--- | :--- | :--- |
| **`ERR_3D_ASSET_CORRUPT`** | Assets 3D | Arquivo GLB/SOG com checksum inválido ou corrupção de malha. | Reexecutar `scripts/optimize-3d-assets.sh`. |
| **`ERR_GPU_CONTEXT_LOST`** | Renderização | Falha na GPU cliente (superaquecimento ou driver reset). | Reativar contexto e reduzir tier gráfico via `AdaptiveRenderer`. |
| **`ERR_BIM_SCHEMA_MISMATCH`** | BIM / IFC | Express ID ou entidade IFC incompatível com o modelo semântico. | Revalidar vínculo relacional via `UniversalBIMPipeline`. |
| **`ERR_ENV_VALIDATION_FAIL`** | Configuração | Falha no schema fail-fast de variáveis de ambiente. | Checar `.env.production` conforme `K02_ENVIRONMENT_SPEC.md`. |
| **`ERR_RESTORE_SECURITY_LOCKED`** | Disaster Recovery | Tentativa de restore sem fornecer `'CONFIRMO_RESTORE'`. | Fornecer a confirmação explicitamente no comando de restore. |
