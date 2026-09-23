# ARQVERTICE STUDIO — AI MODELS CATALOG

> **Versão:** 1.0.0  
> **Status:** Ativo  
> **Camada:** Model Mapping & Capabilities

---

## 1. Visão Geral

Este documento detalha os modelos de Inteligência Artificial suportados pelo ArqVértice Studio, mapeando seus parâmetros de entrada, saídas esperadas, limites de contexto, custos estimados e papéis no ecossistema de arquitetura e design.

---

## 2. Catálogo Detalhado de Modelos

### 2.1. Modelos de Geração de Imagem & Renderização Visual

#### `imagen-3.0-generate-002`
* **Provedor:** Google Cloud Vertex AI (`gemini-imagen`)
* **Capacidade:** `AICapability.VISUAL_RENDER_GENERATION`
* **Nível de Execução:** `AIExecutionLevel.GENERATIVE`
* **Resoluções Suportadas:** 1024x1024 (1:1), 1792x1024 (16:9), 1024x1792 (9:16)
* **Entrada:** Prompt arquitetônico detalhado (materiais, iluminação solar, lente de câmera, entorno geográfico), aspect ratio, negative prompt.
* **Saída:** Base64 de imagem JPEG/PNG de alta resolução ou URL assinada do GCS.
* **Custo Estimado:** ~$0.03 por imagem gerada.
* **Política Padrão:** `AIRoutingPolicy.QUALITY`

#### `imagen-3.0-fast-generate-001`
* **Provedor:** Google Cloud Vertex AI (`gemini-imagen`)
* **Capacidade:** `AICapability.VISUAL_RENDER_GENERATION`
* **Nível de Execução:** `AIExecutionLevel.GENERATIVE`
* **Custo Estimado:** ~$0.015 por imagem gerada.
* **Política Padrão:** `AIRoutingPolicy.FAST`, `AIRoutingPolicy.LOW_COST`

#### `mock-architectural-preview-v1`
* **Provedor:** Mock Engine Local (`mock-visual`)
* **Capacidade:** `AICapability.VISUAL_RENDER_GENERATION`
* **Nível de Execução:** `AIExecutionLevel.DETERMINISTIC`
* **Custo Estimado:** R$ 0,00 (0 tokens, execução local instantânea).
* **Finalidade:** Modo offline, testes automatizados e fallback sem dependência de rede.

---

### 2.2. Modelos de Direção Audiovisual e Prompting

#### `gemini-2.0-flash`
* **Provedor:** Google Gemini (`gemini-video-prompt`)
* **Capacidade:** `AICapability.VIDEO_PROMPT_GENERATION`
* **Nível de Execução:** `AIExecutionLevel.GENERATIVE`
* **Janela de Contexto:** 1.048.576 tokens
* **Entrada:** Contexto do projeto (`buildProjectDesignContext`), briefing consolidado, dados de ambientes e iluminação.
* **Saída:** JSON com prompts cinematográficos segmentados por cena, instruções de câmera (pan, tilt, zoom) e materiais em destaque.
* **Custo Estimado:** ~$0.0001 por 1k tokens de entrada / $0.0004 por 1k tokens de saída.
* **Política Padrão:** `AIRoutingPolicy.BALANCED`

#### `veo-2.0`
* **Provedor:** Google Veo (`veo-director`)
* **Capacidade:** `AICapability.VIDEO_PROMPT_GENERATION`
* **Nível de Execução:** `AIExecutionLevel.GENERATIVE`
* **Especialidade:** Vídeos de visualização arquitetônica em 60fps com estabilidade física de iluminação solar e reflexos de materiais vítreos.

#### `wan-2.1-t2v-14b`
* **Provedor:** Local Engine (`wan-director`)
* **Capacidade:** `AICapability.VIDEO_PROMPT_GENERATION`
* **Nível de Execução:** `AIExecutionLevel.GENERATIVE`
* **Especialidade:** Geração local de vídeo em GPUs de workstation sem custos variáveis de nuvem.

---

### 2.3. Modelos Heurísticos e Decisores Estruturais

#### `jev-decision-foundation-v1`
* **Provedor:** Jev Engine (`jev-decision-foundation`)
* **Capacidade:** `AICapability.ARCHITECTURAL_DECISION`
* **Nível de Execução:** `AIExecutionLevel.DECISION`
* **Entrada:** `ProjectContext`, status de aprovação de briefing, pendências de compatibilização.
* **Saída:** Plano de ação estruturado com pontuação de confiança, necessidade de revisão humana e recomendações de workflow.
* **Custo Estimado:** Zero tokens externos (executado localmente por regras heurísticas estritas).

---

## 3. Matriz de Recomendações de Modelos por Política

| Capacidade | Política QUALITY | Política BALANCED | Política LOW_COST / FAST | Política LOCAL |
| :--- | :--- | :--- | :--- | :--- |
| `VISUAL_RENDER_GENERATION` | `imagen-3.0-generate-002` | `imagen-3.0-generate-002` | `imagen-3.0-fast-generate-001` | `mock-architectural-preview-v1` |
| `VIDEO_PROMPT_GENERATION` | `veo-2.0` / `gemini-2.0-flash` | `gemini-2.0-flash` | `gemini-2.0-flash` | `wan-2.1-t2v-14b` |
| `ARCHITECTURAL_DECISION` | `jev-decision-foundation-v1` | `jev-decision-foundation-v1` | `jev-decision-foundation-v1` | `jev-decision-foundation-v1` |
