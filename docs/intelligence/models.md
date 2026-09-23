# Matriz de Modelos e Papéis Cognitivos

No **ArqVértice Studio**, nenhum modelo de inteligência artificial é tratado como solução monolítica universal. Cada tecnologia é rigorosamente selecionada e delimitada para sua especialidade intrínseca de domínio.

---

## 1. Mapeamento de Modelos por Responsabilidade

| Modelo / Sistema | Papel Arquitetural | Tipo de Execução | Justificativa Técnica |
| :--- | :--- | :--- | :--- |
| **Astra / Fable-Class** | Raciocínio Geral & Planejamento Agêntico | Nuvem / API Segura | Formulação de planos multi-etapas, decomposição de programas de necessidades e synthesis conceitual. |
| **Qwen3-VL** | Visão, Análise Espacial & OCR | Servidor GPU Local / Nuvem | Extração de bounding boxes normalizados [0..1000], leitura de pranchas escaneadas e interpretação de fachadas. |
| **Jev** | Decisão Rápida Delimitada | Local / Memória Web | Roteamento determinístico em <15ms entre ferramentas, formatos e modelos com matriz de confiança. |
| **Qwen-Image** | Geração e Edição de Imagem | Servidor GPU Dedicado | Troca de materiais fotorrealistas, inpainting arquitetônico condicional a máscaras. |
| **SAM3 (Segment Anything)** | Segmentação Fina & Grounding | Local / GPU Server | Geração precisa de polígonos e máscaras binárias para isolamento de mobiliário, esquadrias e superfícies. |
| **TRELLIS.2 (Microsoft)** | Conversão Imagem-para-3D | Servidor GPU Isolado | Síntese de malhas GLB manifold estruturadas a partir de imagens de referência com PBR. |
| **Blender (MCP Bridge)** | Edição e Composição 3D Interativa | Localhost MCP (Headless) | Iluminação Cycles, unwrap UV, conferência de normais e renderização foto-realista fechada. |
| **FreeCAD / CADAgent** | Modelagem Paramétrica Exata | Servidor Local / Docker MCP | Árvore de features (pad, pocket, fillet), restrições geométricas exatas e exportação STEP/IGES. |
| **That Open Engine** | BIM / IFC e 3D Leve no Navegador | WebAssembly / WebGL | Parsing nativo de arquivos IFC4, extração de tabelas de quantidades NBR e visualização de fragmentos. |
| **Remotion** | Vídeo e Animação Determinística | Node.js Server / Worker | Composição programática de flythroughs, storyboards e transições frame-a-frame em React. |

---

## 2. Configuração e Substituibilidade

Todas as implementações operam através de interfaces desacopladas. Caso surja um modelo de segmentação mais leve e preciso que o SAM3, ele pode ser plugado no `ImageEditingEngine` alterando apenas a rota de execução correspondente, sem impacto no grafo de cena ou no fluxo de interface do usuário.
