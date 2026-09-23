# Intelligent Multimodal Design Engine — Arquitetura Global

O **ArqVértice Studio** evoluiu de um assistente de inteligência artificial pontual para um **Intelligent Design Engine** multimodal completo, capaz de compreender, gerar, editar e validar as múltiplas representações canônicas de um projeto de arquitetura: **Texto, Imagem, Desenho Técnico (2D), Modelagem Paramétrica (CAD), Malha Poligonal (3D), Modelo da Informação da Construção (BIM/IFC) e Vídeo Cinematográfico**.

---

## 1. Princípio de Separação de Responsabilidades

O motor arquitetural separa estritamente o ciclo cognitivo e executivo em seis camadas desacopladas:

```text
       ┌────────────────────────┐
       │       PERCEPTION       │  (Qwen3-VL, OCR, Segmentação Espacial, Parsers DXF/IFC)
       └───────────┬────────────┘
                   │
       ┌───────────▼────────────┐
       │     UNDERSTANDING      │  (Cross-Modal Project Scene Graph, Grounding, Resolução de Identidade)
       └───────────┬────────────┘
                   │
       ┌───────────▼────────────┐
       │    DECISION (JEV)      │  (Classificação delimitada, confiança, políticas de segurança)
       └───────────┬────────────┘
                   │
       ┌───────────▼────────────┐
       │       AI ROUTER        │  (Despacho para modelos especializados, GPU services, MCP)
       └───────────┬────────────┘
                   │
       ┌───────────▼────────────┐
       │     TOOL EXECUTION     │  (Sandboxed Tool Registry, Permissões, Auditoria, Reversibilidade)
       └───────────┬────────────┘
                   │
       ┌───────────▼────────────┐
       │  VALIDATION & APPROVAL │  (NBR 6492, NBR 16636, Manifold Check, Preview-First, Aprovação Humana)
       └────────────────────────┘
```

---

## 2. Topologia do Sistema

```text
                                  ARQVERTICE STUDIO
                                         │
                                  PROJECT CONTEXT
                                         │
                             ┌───────────▼───────────┐
                             │ MULTIMODAL PERCEPTION │
                             └───────────┬───────────┘
                                         │
                      ┌──────────────────┼──────────────────┐
                      │                  │                  │
                   Vision             Spatial            Documents
                      │                  │                  │
                      └──────────────────┼──────────────────┘
                                         │
                                  UNDERSTANDING
                                         │
                                     PLANNING
                                         │
                                  ┌──────▼──────┐
                                  │     JEV     │
                                  └──────┬──────┘
                                         │
                                     AI ROUTER
                                         │
                  ┌───────────┬──────────┼───────────┬───────────┐
                  │           │          │           │           │
                IMAGE       3D         CAD         BIM        VIDEO
                  │           │          │           │           │
               Qwen        TRELLIS    FreeCAD     ThatOpen   Remotion
                Image                    │
                  │                   CADAgent
                  │
                SAM3
                  │
                  └──────────────┬─────────────────────────────┘
                                 │
                            TOOL EXECUTION
                                 │
                              OBSERVE
                                 │
                             VALIDATE
                                 │
                           REPAIR / RETRY
                                 │
                          HUMAN APPROVAL
                                 │
                               RESULT
```

---

## 3. Diretrizes de Infraestrutura e Isolamento

1. **Frontend Leve**: Nenhuma biblioteca monolítica (Python/C++ CAD runtimes, pesos de modelos de dezenas de gigabytes) é injetada no bundle do navegador.
2. **Serviços Especializados**: Modelos pesados residem em adapters isolados (`server.js`, MCP Servers locais, serviços de GPU remotos via HTTP/WebSocket).
3. **Cadeia de Fallback Universal**: Cada capacidade crítica opera segundo a tríade:
   - **PRIMARY**: Modelo/serviço neural ou paramétrico de alta precisão.
   - **FALLBACK**: Algoritmo heurístico local, OpenCV/WASM ou biblioteca secundária.
   - **MANUAL**: Interface para inspeção, ajuste e sobreposição manual pelo arquiteto.
4. **Governança Estrita**: Nenhuma ação destrutiva ocorre sem autorização humana expressa.
