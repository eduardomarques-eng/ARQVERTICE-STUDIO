# Percepção Visual e Grounding Espacial

O subsistema de percepção visual do ArqVértice (`js/visual-perception-engine.js`) é responsável por analisar dados raster (fotografias, renders, croquis e plantas escaneadas) e convertê-los em representações canônicas estruturadas e semanticamente tipadas.

---

## 1. Pipeline de Percepção em 8 Estágios

```text
IMAGE
  ↓ (1) Preprocessamento (Normalização de gamma, contraste, resize 1024px)
PREPROCESS
  ↓ (2) OCR Técnico (Extração de textos de cotas, notas e legendas)
OCR
  ↓ (3) Detecção de Objetos (Qwen3-VL / YOLOv8-Architectural)
OBJECT_DETECTION
  ↓ (4) Segmentação Fina (SAM3 / Polígonos de contorno)
SEGMENTATION
  ↓ (5) Grafo de Relações Espaciais (Acima, Abaixo, Conectado, Adjacente)
SPATIAL_RELATIONSHIP
  ↓ (6) Compreensão Semântica (Tipologia do ambiente, materialidade)
SEMANTIC_UNDERSTANDING
  ↓ (7) Validação Geométrica (Verificação de proporções e escala)
VALIDATION
  ↓ (8) Cena Estruturada
STRUCTURED_SCENE
```

---

## 2. Estruturas Canônicas de Dados

- **VisualObject**: Identificador único, categoria semântica (ex: `mobiliario_sofa`, `parede_alvenaria`), bounding box normalizado `[ymin, xmin, ymax, xmax]` no intervalo `[0..1000]`, estimativa de profundidade e polígono de máscara.
- **VisualRegion**: Agrupamento lógico funcional de múltiplos objetos (ex: `zona_estar`, `circulação`, `área_molhada`).
- **VisualRelationship**: Tripla direcional `(Origem, TipoDeRelação, Destino)` com tipos formais: `ABOVE`, `BELOW`, `ADJACENT_TO`, `SUPPORTED_BY`, `CONTAINS`, `PART_OF`.
- **VisualMeasurement**: Cota técnica aferida ou lida, contendo valor numérico, unidade de medida (`mm`, `cm`, `m`) e nível de incerteza.

---

## 3. Grounding Espacial Bidirecional

Permite consultar a imagem em linguagem natural e obter respostas precisas com coordenadas:
- *"Onde está o balcão da ilha gourmet?"* ➔ Retorna polígono e coordenadas normalizadas.
- *"O que está posicionado à esquerda da esquadria E-02?"* ➔ Consulta o grafo de adjacências espaciais.
