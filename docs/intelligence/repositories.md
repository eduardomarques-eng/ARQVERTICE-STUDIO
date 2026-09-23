# Repositórios e Adoção Tecnológica — Resumo Executivo

O ArqVértice Studio realizou uma auditoria profunda de 10 ecossistemas de código aberto para fundamentar o **Intelligent Multimodal Design Engine** (Bloco J). Para a matriz detalhada completa de 22 campos de auditoria técnica, consulte [repository-adoption.md](file:///c:/Users/erick/ARQVERTICE-STUDIO/docs/intelligence/repository-adoption.md).

---

## 1. Tabela Síntese de Decisões de Adoção

| Candidato | Repositório Oficial | Decisão | Papel no ArqVértice |
| :--- | :--- | :--- | :--- |
| **Agent TARS** | `bytedance/UI-TARS-desktop` | **ADOTAR (Padrão)** | Máquina de estados de 9 estágios e travas anti-loop no agente central. |
| **Qwen3-VL** | `QwenLM/Qwen3-VL` | **ADOTAR (Adapter)** | Pipeline de percepção visual, OCR de pranchas e bounding boxes [0..1000]. |
| **Blender MCP** | `ahujasid/mcp-for-blender` | **ADOTAR (Bridge)** | Ponte localhost com verificação closed-loop e render Cycles/EEVEE. |
| **FreeCAD-MCP** | `FreeCAD-MCP` | **ADOTAR (MCP Service)** | Modelagem paramétrica sólida, restrições no Sketcher e exportação STEP. |
| **CADAgent** | `CADAgent` | **ADOTAR (Heurística)** | Recomputação inteligente de parâmetros de sólidos com tolerância a falhas. |
| **TRELLIS.2** | `microsoft/TRELLIS.2` | **ADOTAR (Service)** | Síntese 3D de imagens de referência com checagem manifold e 5 perfis de malha. |
| **SAM3** | `facebookresearch/sam3` | **ADOTAR (Pipeline)** | Segmentação precisa de objetos e superfícies para inpainting Mask-First. |
| **Qwen-Image** | `QwenLM/Qwen-Image` | **ADOTAR (Adapter)** | Inpainting arquitetônico fotorrealista e substituição de materiais PBR. |
| **That Open Engine**| `ThatOpen/engine_components`| **ADOTAR (WASM)** | Leitura nativa e visualização leve de modelos BIM IFC4 no navegador. |
| **Remotion** | `remotion-dev/remotion` | **ADOTAR (Service)** | Composição determinística de vídeos, flythroughs e storyboards de apresentação. |

---

## 2. Princípio de Não-Monolitismo

Nenhum repositório acima foi importado em sua totalidade como um fork desnecessário. Todas as integrações utilizam conectores de baixo acoplamento:
1. **MCP (Model Context Protocol)** para ferramentas locais de desktop (Blender e FreeCAD).
2. **Adapters HTTP/WebSocket REST** para serviços GPU remotos ou locais (TRELLIS.2, Qwen-Image, Qwen3-VL).
3. **WebAssembly / Módulos ES6 puros** para o navegador (That Open Engine, Parsers vetoriais).
