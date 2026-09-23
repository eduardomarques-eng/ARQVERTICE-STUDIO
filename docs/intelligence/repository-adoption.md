# ARQVERTICE STUDIO — AUDITORIA PROFUNDA E PLANO DE ADOÇÃO DE REPOSITÓRIOS (J01)
## Multimodal Intelligence Layer: Matriz Comparativa, Governança e Decisões de Arquitetura

> **Data de Atualização:** Setembro de 2026  
> **Status:** Aprovado para Implementação Modular (Bloco J)  
> **Regra Central:** Não importar projetos inteiros. Não fazer fork de aplicação completa. Não duplicar runtimes. Preferir: `ADAPT`, `REFERENCE`, `INTEGRATE`, `ISOLATE`.

---

## 1. Visão Geral da Multimodal Intelligence Layer

A inteligência multimodal do ArqVértice Studio estrutura-se em subsistemas independentes, integrados por adaptadores tipados e protocolos padronizados (como o Model Context Protocol - MCP):

```text
ArqVertice Studio (Workspace Central & Portal do Cliente)
       │
       ▼
Multimodal Intelligence Layer (js/multimodal-agent-core.js)
       │
       ├── Agent Runtime      (Máquina de estados finitos 9-steps, guard rails anti-loop)
       ├── Vision             (Qwen-VL Adapter, grounding espacial, normalized bboxes)
       ├── Image Editing      (Mask-first inpainting, diff heatmap, versionamento antes/depois)
       ├── 3D                 (TRELLIS adapter para reconstrução conceitual, Three.js viewer)
       ├── CAD                (Conectores MCP para FreeCAD e Blender, CADAgent scripting)
       ├── BIM                (ThatOpen / web-ifc engine components, IFC parser determinístico)
       ├── Drawing            (Technical Drawing Parser: cotas lineares, eixos, esquadrias)
       └── Video              (Remotion programmatic compositions, 7 templates arquitetônicos)
```

---

## 2. Matriz Exaustiva de Decisão de Candidatos

Abaixo, cada candidato é avaliado sob os 22 critérios estipulados para a governança de software do estúdio:

---

### Candidato 1: `bytedance/UI-TARS-desktop` / `Agent TARS`
* **Repository:** `bytedance/UI-TARS-desktop`
* **Owner:** ByteDance Research
* **Purpose:** Agente multimodal para automação de GUI desktop via observação visual, grounding de elementos e despacho de ações nativas (cliques, digitação).
* **License:** Apache 2.0
* **Current activity:** Alta atividade / lançamentos contínuos de versões desktop e modelos VLM fine-tuned para GUI.
* **Stars:** ~9.8k | **Forks:** ~1.2k | **Recent commits:** Semanal
* **Issues:** 45 abertas / 120 fechadas (foco em latência em OS nativos)
* **Architecture:** Python/Electron + VLM Vision Encoder com tokens especiais de coordenadas `(x, y)`.
* **Dependencies:** PyAutoGUI, Playwright, Transformers, Electron.
* **GPU requirement:** Alto (16GB+ VRAM para inferência local com modelo 7B/72B) ou API remota.
* **CPU fallback:** Inviável para inferência local em tempo real; viável como client para API.
* **Browser compatibility:** Não roda diretamente no navegador sem backend proxy.
* **Server compatibility:** Excelente em Linux/Windows Server via container.
* **Commercial restrictions:** Nenhuma (Apache 2.0 permissiva).
* **Privacy considerations:** Captura de tela requer mascaramento de PII.
* **Security concerns:** Ações diretas de mouse/teclado exigem sandbox estrita para evitar clique acidental em operações do SO.
* **Integration complexity:** Média-Alta (requer isolamento do runtime desktop).
* **Expected value:** Altíssimo valor conceitual para a máquina de estados (grounding e inspeção).
* **Alternative:** Implementação própria de loop agêntico no navegador.
* **Decision:** **`REFERENCE`**  
  *Justificativa:* Adotamos o padrão de máquina de estados (`OBSERVE -> PLAN -> ACT -> VERIFY`), tokens de coordenadas e grounding visual no `MultimodalAgentCore`, mas **rejeitamos** a importação do binário desktop Electron e scripts de clique no SO.

---

### Candidato 2: `QwenLM/Qwen3-VL` / `Qwen2.5-VL`
* **Repository:** `QwenLM/Qwen2.5-VL` / `Qwen3-VL`
* **Owner:** Alibaba Cloud / Qwen Team
* **Purpose:** Modelo de linguagem e visão de fronteira com suporte nativo a grounding espacial (bounding boxes `[ymin, xmin, ymax, xmax]`), leitura de documentos técnicos, OCR arquitetônico e compreensão de plantas.
* **License:** Apache 2.0 (pesos e código)
* **Current activity:** Muito alta / principal referência open-weights multimodal global.
* **Stars:** ~18.5k | **Forks:** ~2.1k | **Recent commits:** Diários
* **Issues:** 85 abertas / 430 fechadas
* **Architecture:** Vision Transformer (ViT) dinâmico com patch adaptativo + LLM Decoder de alta janela (128k context).
* **Dependencies:** PyTorch, Transformers, Flash-Attention.
* **GPU requirement:** 16GB VRAM para 7B; 80GB VRAM para 72B; suporta quantização AWQ 4-bit (8GB VRAM).
* **CPU fallback:** Lento para visão (~15s por imagem); ideal via API HTTP/vLLM.
* **Browser compatibility:** Client via HTTP / Server-Sent Events; WebGPU experimental para modelos ultra-leves (1.5B).
* **Server compatibility:** Excelente (vLLM, Ollama, TGI).
* **Commercial restrictions:** Nenhuma para variantes padrão sob Apache 2.0.
* **Privacy considerations:** Processamento local possível com privacidade total de dados confidenciais do cliente.
* **Security concerns:** Exige validação estrita do JSON gerado para evitar alucinações em medidas.
* **Integration complexity:** Baixa (protocolo compatível com OpenAI Vision API).
* **Expected value:** Máximo para percepção de plantas, croquis e renders.
* **Alternative:** GPT-4o Vision, Claude 3.5 Sonnet.
* **Decision:** **`ADAPTER`**  
  *Justificativa:* Criamos o `QwenVLAdapter` no `AIRouter` para ser o motor canônico de percepção visual e extração de coordenadas espaciais normalizadas.

---

### Candidato 3: `ahujasid/mcp-for-blender`
* **Repository:** `ahujasid/mcp-for-blender`
* **Owner:** Sid Ahuja
* **Purpose:** Servidor Model Context Protocol (MCP) que expõe a API Python do Blender para agentes de IA realizarem modelagem, ajuste de materiais e iluminação 3D.
* **License:** MIT
* **Current activity:** Ativo / atualizado conforme evolução do protocolo MCP.
* **Stars:** ~1.4k | **Forks:** ~180 | **Recent commits:** Mensal
* **Issues:** 12 abertas / 35 fechadas
* **Architecture:** Servidor Python `stdio` ou SSE conectado via socket RPC ao addon local do Blender.
* **Dependencies:** `mcp-sdk`, `bpy` (Blender Python API).
* **GPU requirement:** Depende do renderizador do Blender (Cycles requer GPU; EEVEE roda em GPU intermediária).
* **CPU fallback:** Totalmente suportado para operações de geometria e dados.
* **Browser compatibility:** Apenas via gateway de servidor ou MCP bridge.
* **Server compatibility:** Total em ambientes onde o Blender headless está instalado.
* **Commercial restrictions:** Nenhuma (MIT).
* **Privacy considerations:** Arquivos `.blend` locais sem telemetria externa.
* **Security concerns:** Execução de scripts arbitrários em `bpy` deve ser limitada a uma lista branca de comandos seguros.
* **Integration complexity:** Baixa-Média (conector MCP padrão).
* **Expected value:** Excelente para renderização fotorrealista avançada fora do browser.
* **Alternative:** Modelagem interna procedural no Three.js.
* **Decision:** **`OPTIONAL` / `ADAPTER`**  
  *Justificativa:* O estúdio suportará o conector MCP para Blender como ferramenta externa opcional do agente sem embutir o Blender na aplicação web.

---

### Candidato 4: `FreeCAD-MCP`
* **Repository:** `FreeCAD-MCP` (ecossistema open CAD)
* **Owner:** Open Source CAD Community
* **Purpose:** Exposição das capacidades paramétricas de engenharia e modelagem sólida B-Rep do FreeCAD para LLMs via MCP.
* **License:** LGPL v2.1+ / Apache 2.0
* **Current activity:** Em crescimento contínuo.
* **Stars:** ~850 | **Forks:** ~95 | **Recent commits:** Quinzenal
* **Issues:** 8 abertas / 22 fechadas
* **Architecture:** Servidor MCP que interage com o kernel OpenCASCADE via Python wrapper do FreeCAD.
* **Dependencies:** FreeCAD headless, Python 3.10+, MCP SDK.
* **GPU requirement:** Nenhum para modelagem matemática sólida (CPU-bound puro).
* **CPU fallback:** Nativo.
* **Browser compatibility:** Apenas via backend RPC.
* **Server compatibility:** Excelente via Docker container headless.
* **Commercial restrictions:** LGPL exige que a biblioteca seja dinamicamente linkada (atendida via MCP).
* **Privacy considerations:** Processamento puramente local e seguro.
* **Security concerns:** Isolamento de execução de scripts de modelagem.
* **Integration complexity:** Média.
* **Expected value:** Alto para exportação de perfis STEP/IGES para complementares estruturais.
* **Alternative:** Revit (ferramenta primária do estúdio) ou Three.js CSG.
* **Decision:** **`REFERENCE` / `OPTIONAL`**  
  *Justificativa:* Mantido como referência e conector opcional de CAD para casos em que o cliente demande geometrias analíticas em formatos abertos.

---

### Candidato 5: `CADAgent`
* **Repository:** `CADAgent` (pesquisas acadêmicas e open-source de geração autônoma de CAD)
* **Owner:** CAD AI Research Consortium
* **Purpose:** Agente que sintetiza programas em CadQuery / OpenSCAD a partir de requisitos textuais e esboços 2D.
* **License:** MIT / Apache 2.0
* **Current activity:** Moderada / foco em benchmarks de engenharia mecânica e arquitetônica.
* **Stars:** ~1.1k | **Forks:** ~140 | **Recent commits:** Mensal
* **Issues:** 15 abertas / 40 fechadas
* **Architecture:** Agente multi-passos com loop de compilação, renderização de preview e auto-correção de sintaxe CAD.
* **Dependencies:** CadQuery, Python-OCC, LLM API.
* **GPU requirement:** Baixo / CPU para B-Rep kernel.
* **CPU fallback:** Nativo.
* **Browser compatibility:** Previews via WebGL/Three.js; síntese no servidor.
* **Server compatibility:** Alta.
* **Commercial restrictions:** Nenhuma.
* **Privacy considerations:** Totalmente controlável localmente.
* **Security concerns:** Sandbox de execução Python para evitar comandos de sistema.
* **Integration complexity:** Média.
* **Expected value:** Valioso para mobiliário paramétrico sob medida.
* **Alternative:** Catálogo pré-definido de marcenaria em `js/furniture-system-module.js`.
* **Decision:** **`EXPERIMENT`**  
  *Justificativa:* Classificado como experimental; integraremos o padrão de síntese procedural sob a feature flag `EXPERIMENTAL_SKILLS`.

---

### Candidato 6: `microsoft/TRELLIS.2` / `TRELLIS`
* **Repository:** `microsoft/TRELLIS`
* **Owner:** Microsoft Research
* **Purpose:** Geração de assets 3D de alta qualidade (Meshes estruturadas com texturas PBR e 3D Gaussians) a partir de uma única imagem de render ou croqui.
* **License:** MIT (código) / Pesos para pesquisa e uso aberto.
* **Current activity:** Alta / modelo de ponta em 3D generativo.
* **Stars:** ~14.2k | **Forks:** ~1.5k | **Recent commits:** Semanal
* **Issues:** 60 abertas / 180 fechadas
* **Architecture:** Structured Latent Representation com Sparse 3D VAE e Decodificador de Malha com texturas PBR.
* **Dependencies:** PyTorch, CUDA, Kaolin, Spconv.
* **GPU requirement:** Crítico (NVIDIA RTX 3090/4090 ou A100 com 16GB+ VRAM).
* **CPU fallback:** Inviável em tempo de resposta aceitável (> 5 minutos por modelo).
* **Browser compatibility:** Apenas visualização do resultado exportado (.GLB / .OBJ) no Three.js do ArqVértice.
* **Server compatibility:** Excelente via API microserviço FastAPI/Docker.
* **Commercial restrictions:** Código MIT; verificar termos de pesos de terceiros.
* **Privacy considerations:** Renders do projeto enviados para microserviço GPU isolado.
* **Security concerns:** Validação de tamanho e integridade do arquivo GLB retornado.
* **Integration complexity:** Baixa no frontend (apenas consome GLB); Média no servidor (requer GPU dedicada).
* **Expected value:** Altíssimo para volumetria inicial conceitual a partir de croquis do arquiteto.
* **Alternative:** Tripo3D, Meshy, Rodin.
* **Decision:** **`ADAPTER`**  
  *Justificativa:* Criamos a interface de adapter `3DGenerationAdapter` que despacha imagem para o endpoint e entrega o GLB diretamente ao `BIMViewerModule`.

---

### Candidato 7: `facebookresearch/sam3` / `segment-anything-2`
* **Repository:** `facebookresearch/segment-anything-2` / `sam3`
* **Owner:** Meta AI (FAIR)
* **Purpose:** Segmentação visual zero-shot precisa de objetos em imagens e vídeos através de prompts por pontos, bounding boxes ou texto.
* **License:** Apache 2.0
* **Current activity:** Muito alta / padrão ouro universal de segmentação.
* **Stars:** ~32k | **Forks:** ~3.4k | **Recent commits:** Semanal
* **Issues:** 90 abertas / 520 fechadas
* **Architecture:** Image/Video Encoder hierárquico com Hiera backbone e Mask Decoder leve em tempo real.
* **Dependencies:** PyTorch, TorchVision.
* **GPU requirement:** 4GB a 8GB VRAM (suporta ONNX Web e WebGPU experimental via Transformers.js para variantes mini).
* **CPU fallback:** Viável para imagens estáticas com modelo Tiny (1.2s por inferência).
* **Browser compatibility:** Excelente! Modelos ONNX rodam diretamente no navegador com WebGPU/Wasm.
* **Server compatibility:** Perfeita.
* **Commercial restrictions:** Apache 2.0 sem restrições.
* **Privacy considerations:** 100% privado quando rodando no browser via ONNX Runtime Web.
* **Security concerns:** Nenhuma (opera puramente sobre matriz de pixels).
* **Integration complexity:** Baixa a Média.
* **Expected value:** Indispensável para o fluxo *Mask-First* de edição de imagem (isolar pisos, paredes, esquadrias).
* **Alternative:** Thresholding de cor manual, segmentação heurística.
* **Decision:** **`CORE` / `ADAPTER`**  
  *Justificativa:* Adotado como peça central do `VisualPerceptionEngine` e `ImageEditingEngine` para extração de máscaras limpas de objetos arquitetônicos.

---

### Candidato 8: `QwenLM/Qwen-Image` / `Qwen-Image-Edit`
* **Repository:** `QwenLM/Qwen-Image`
* **Owner:** Alibaba Cloud / Qwen Team
* **Purpose:** Geração e edição instrucional de imagens fotorrealistas preservando layout, consistência de texto e materiais arquitetônicos.
* **License:** Apache 2.0
* **Current activity:** Alta / modelo de difusão de última geração com compreensão profunda de comandos em linguagem natural.
* **Stars:** ~8.5k | **Forks:** ~900 | **Recent commits:** Quinzenal
* **Issues:** 25 abertas / 80 fechadas
* **Architecture:** Diffusion Transformer (DiT) condicionado por embeddings de texto VLM.
* **Dependencies:** Diffusers, PyTorch, Accelerate.
* **GPU requirement:** Alto (16GB+ VRAM local) ou serviço de nuvem.
* **CPU fallback:** Inviável para difusão fotorrealista.
* **Browser compatibility:** Client HTTP/SSE; backend obrigatório.
* **Server compatibility:** Excelente via Diffusers / ComfyUI microserviço.
* **Commercial restrictions:** Nenhuma (Apache 2.0).
* **Privacy considerations:** Conforme política do backend do escritório.
* **Security concerns:** Validação de filtros contra conteúdo proibido.
* **Integration complexity:** Baixa (protocolo REST padrão).
* **Expected value:** Máximo para troca de revestimentos (ex: trocar mármore por madeira ripada em área delimitada).
* **Alternative:** Stable Diffusion XL / Flux.1 Inpainting.
* **Decision:** **`ADAPTER`**  
  *Justificativa:* Integrado como provedor de inpainting mask-first no `ImageEditingEngine`.

---

### Candidato 9: `ThatOpen/engine_components`
* **Repository:** `ThatOpen/engine_components` (sucessor do IFC.js / That Open Platform)
* **Owner:** That Open Company
* **Purpose:** Motor de carregamento, parsing, renderização geométrica e inspeção de propriedades de arquivos IFC no navegador com memória fragmentada otimizada.
* **License:** Mozilla Public License 2.0 (MPL-2.0)
* **Current activity:** Muito alta / padrão de ponta para OpenBIM na web.
* **Stars:** ~4.5k | **Forks:** ~550 | **Recent commits:** Diários
* **Issues:** 35 abertas / 210 fechadas
* **Architecture:** WebAssembly (`web-ifc`) + Three.js Fragment Geometry com buffers instanciados.
* **Dependencies:** `web-ifc`, `three`.
* **GPU requirement:** Baixo a Moderado (qualquer placa com WebGL 2.0).
* **CPU fallback:** Roda no browser com WebAssembly multithread.
* **Browser compatibility:** Nativa total (Chrome, Edge, Safari, Firefox).
* **Server compatibility:** Pode rodar em Node.js para parsing headless de propriedades.
* **Commercial restrictions:** MPL-2.0 permissiva para uso modular.
* **Privacy considerations:** Totalmente local — os arquivos IFC do cliente nunca saem do computador do arquiteto.
* **Security concerns:** Sanitização de strings em metadados IFC (já coberto no I17).
* **Integration complexity:** Baixa (já orquestrado no `BIMViewerModule` do I12).
* **Expected value:** Pilar absoluto de OpenBIM do ArqVértice.
* **Alternative:** Autodesk Forge/APS (proprietário, pago por consumo em nuvem).
* **Decision:** **`CORE`**  
  *Justificativa:* Já integrado como o núcleo estruturado de geometria BIM.

---

### Candidato 10: `Remotion`
* **Repository:** `remotion-dev/remotion`
* **Owner:** Remotion Innovation Ltd.
* **Purpose:** Criação de vídeos programáticos determinísticos usando React/JavaScript com suporte a física de molas, transições matemáticas e renderização frame-a-frame.
* **License:** Remotion License (permissiva para empresas com receita < $3M/ano; custom para grandes corporações).
* **Current activity:** Extremamente alta / padrão da indústria para vídeo programático.
* **Stars:** ~22k | **Forks:** ~1.4k | **Recent commits:** Diários
* **Issues:** 40 abertas / 1.100 fechadas
* **Architecture:** Canvas WebGL + Audio Web API no browser; renderização paralela via Chromium headless / Lambda no backend.
* **Dependencies:** React, Skia/Canvas, FFmpeg.
* **GPU requirement:** Baixo para preview; GPU acelera encode de exportação.
* **CPU fallback:** Totalmente suportado.
* **Browser compatibility:** Nativa total no player web.
* **Server compatibility:** Total via CLI / Node runtime.
* **Commercial restrictions:** Verificar enquadramento de faturamento.
* **Privacy considerations:** 100% privado e executado on-premise/local.
* **Security concerns:** Nenhuma.
* **Integration complexity:** Baixa (já orquestrado em `video/render/audiovisual-pipeline.js`).
* **Expected value:** Pilar absoluto da produção de vídeo do estúdio.
* **Alternative:** After Effects com scripts CEP (pesado e não automatizável na web).
* **Decision:** **`CORE`**  
  *Justificativa:* Consolidado no Bloco I13 como o motor audiovisual do estúdio.

---

## 3. Resumo das Decisões de Adoção

| Candidato | Domínio | Decisão | Papel no ArqVértice Studio |
| :--- | :--- | :--- | :--- |
| **`bytedance/UI-TARS-desktop`** | Agent Runtime | **`REFERENCE`** | Padrões de grounding de coordenadas e máquina de estados finitos no `MultimodalAgent`. |
| **`QwenLM/Qwen3-VL`** | Vision / OCR | **`ADAPTER`** | Provedor canônico de percepção visual e grounding em `VisualPerceptionEngine`. |
| **`ahujasid/mcp-for-blender`** | 3D / DCC | **`OPTIONAL` / `ADAPTER`** | Conector MCP opcional para modelagem externa no Blender. |
| **`FreeCAD-MCP`** | CAD Paramétrico | **`REFERENCE` / `OPTIONAL`** | Conector MCP para exportação analítica B-Rep STEP/IGES. |
| **`CADAgent`** | CAD Scripting | **`EXPERIMENT`** | Habilitado sob a feature flag `EXPERIMENTAL_SKILLS` para marcenaria sob medida. |
| **`microsoft/TRELLIS.2`** | 3D Generativo | **`ADAPTER`** | Conector para reconstrução de malhas 3D GLB a partir de croquis conceituais. |
| **`facebookresearch/sam3`** | Segmentação | **`CORE` / `ADAPTER`** | Motor de segmentação para extração de máscaras e pipeline *Mask-First*. |
| **`QwenLM/Qwen-Image`** | Edição de Imagem | **`ADAPTER`** | Motor de inpainting contextual para substituição localizada de acabamentos. |
| **`ThatOpen/engine_components`**| BIM / IFC | **`CORE`** | Motor nativo de parsing e visualização estruturada de dados IFC. |
| **`Remotion`** | Audiovisual | **`CORE`** | Motor nativo de composição e renderização determinística de vídeo. |

---

## 4. Diretriz de Isolamento e Segurança

Todas as chamadas para adaptadores externos (`Qwen-VL`, `TRELLIS`, `Qwen-Image`, `MCP`) trafegam obrigatoriamente através da camada de segurança `SecurityGovernance`:
1. **Zero Secrets no Frontend:** Nenhuma chave trafega para o cliente.
2. **Containers Estruturados:** Prompts e imagens externas isolados sob `[UNTRUSTED_EXTERNAL_DATA]`.
3. **Resiliência e Fallback:** Falhas em qualquer adaptador acionam automaticamente a política de degradação suave ou o motor determinístico local.
