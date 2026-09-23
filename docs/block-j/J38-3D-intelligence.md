# J38 — ARQVERTICE 3D INTELLIGENCE & SEMANTIC INDEX

## 1. Visão Geral

O módulo **J38 3D Intelligence** capacita a IA a identificar, compreender, consultar e explicar o modelo arquitetônico tridimensional sem alucinações e sem relying apenas em nomes genéricos de malhas.

```
USER ➔ MULTIMODAL AI ➔ VISUAL GROUNDING ➔ 3D SEMANTIC INDEX (BVH) ➔ SCENE UNDERSTANDING
```

---

## 2. 3D Semantic Index (`Semantic3DObject`)

Cada elemento relevante da cena arquitetônica possui um registro semântico estruturado contendo:
- **`id` e `name`**: Identificadores únicos canônicos.
- **`category` e `subcategory`**: Taxonomia arquitetônica (Furniture, Structure, Lighting, Opening, etc.).
- **`material` e `dimensions`**: Propriedades físicas (Largura, Profundidade, Altura, Área, Volume).
- **`transform` e `bbox`**: Bounding Box AABB/OBB e coordenadas mundiais.
- **`room` e `level`**: Vinculação espacial ao ambiente e pavimento.
- **`bimReference`**: Vínculo com Revit (`ElementId`) e IFC (`GlobalId` / `IfcType`).
- **`visualEmbedding`**: Hash/vetor de representação visual.
- **`tags` e `confidence`**: Rótulos descritivos para busca em linguagem natural.

---

## 3. Consultas Espaciais (BVH & Proximidade)

A IA pode realizar consultas relacionais espaciais baseadas em geometria:
- `"próximo a"` (distância euclidiana tridimensional).
- `"sobre / acima de"` ($Y_2 > Y_1$).
- `"dentro do mesmo ambiente"` (`room === targetRoom`).
- `"adjacente / alinhado"`.

---

## 4. Grounding de Visão Multimodal

O pipeline de visão permite que a IA analise a imagem renderizada do modelo em conjunto com os metadados vetoriais:
- **Combinação de Sinais**: `Metadata` + `Geometry` + `Material` + `Bounding Box` + `Rendered Frame` + `AI Vision`.
- **Provedores Suportados (Agnóstico)**: Google Gemini, OpenAI, Anthropic, Ollama (Local) e Mock Offline.
