# J40 — ARQVERTICE GAUSSIAN SPLAT PIPELINE & REALITY CAPTURE

## 1. Visão Geral e Papel no Ecossistema

O **Gaussian Splatting (3DGS)** é incorporado no ArqVértice Studio como uma **representação volumétrica complementar**, e **NÃO** como substituto do BIM, IFC, GLB ou modelagem paramétrica do Revit.

```
REALIDADE CAPTURADA (Drone / LiDAR / Fotogrametria)
  ➔ GAUSSIAN SPLAT (PLY / SOG / KSPLAT)
  ➔ COMPLEMENTO DE ENTORNO E TERRENO
  +
PROJETO ARQUITETÔNICO (Revit / BIM / IFC / GLB PBR)
  =
CENA HÍBRIDA FOTORREALISTA COMPLETA (Client Viewer & Studio)
```

---

## 2. Casos de Uso Oficiais

1. **Entorno Existente e Topografia**: Contexto real do lote vizinho, vegetação exuberante e desníveis naturais de terreno.
2. **Estudos de Reforma e As-Built**: Escaneamento de edificação pré-existente antes da intervenção arquitetônica.
3. **Apresentações Fotográficas e Imersão**: Proporcionar ao cliente a sensação exata da vista real da sacada ou deck.
4. **Cenas Naturais Complexas**: Elementos orgânicos difíceis de modelar em malhas poligonais tradicionais (folhagens densas, pedras rústicas).

---

## 3. Ecossistema PlayCanvas & Formatos Suportados

O pipeline adota as melhores práticas do ecossistema **PlayCanvas (SuperSplat / SplatTransform)**:

| Formato | Descrição | Compressão | Caso de Uso |
| :--- | :--- | :--- | :--- |
| **PLY** | Standard 3D Gaussian Splat PLY | Descomprimido | Formato de saída padrão de scanners e softwares de fotogrametria (ex: Postshot, Nerfstudio). |
| **SOG** | Splat Octree Geometry (SuperSplat) | Alta (~85% redução) | Formato web padrão para streaming em octree por distância. |
| **SPZ** | Scan Splat Zip | Média | Troca rápida de arquivos comprimidos. |
| **SPLAT** | Raw Binary Buffer | Bruto | Processamento rápido na GPU sem parsing de cabeçalhos. |
| **KSPLAT** | K-D Tree Spatial Sorted | Alta | Renderização com ordenação espacial pré-calculada. |

---

## 4. Operações Permitidas no Editor e no Visualizador

### O que é permitido no Editor / Viewer:
- **Transformação Global**: Translação (`position`), Rotação (`rotation`) e Escala (`scale`) para alinhar o escaneamento ao projeto BIM.
- **Controle de Visibilidade**: Ligar/desligar camada de escaneamento.
- **Ajuste de Opacidade e Densidade**: Fade progressivo entre o modelo BIM e a fotogrametria.
- **Caixas de Corte (Clipping Box)**: Ocultar partes do escaneamento que colidem com a nova edificação projetada.
- **Streaming Progressivo (LODs)**: Ajuste dinâmico do orçamento de splats (LOD 0 a LOD 2) conforme distância da câmera.

### Diretriz Estrita de Edição:
> **NÃO inventar ferramentas de modelagem tradicional de malha poligonal para Gaussian Splats.** Splats são nuvens de radiância gaussiana volumétrica. A modelagem precisa e dimensional pertence ao Revit / BIM / CAD.
