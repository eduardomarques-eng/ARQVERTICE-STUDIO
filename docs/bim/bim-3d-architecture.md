# ARQVERTICE STUDIO — ARQUITETURA BIM, 3D E VISUALIZAÇÃO ESTRUTURADA (I12)
**Documento:** `docs/bim/bim-3d-architecture.md`  
**Versão:** 1.0.0 — Bloco I12  
**Status:** HOMOLOGADO  
**Premissa Central:** O Autodesk Revit permanece como a ferramenta de autoria e modelagem paramétrica do estúdio. O ArqVértice Studio atua como a camada de visualização, análise, apresentação, interação e documentação técnica.

---

## 1. Auditoria da Stack Tecnológica BIM / 3D

| Tecnologia / Componente | Papel no ArqVértice Studio | Veredito Arquitetural |
| :--- | :--- | :--- |
| **Autodesk Revit** | Modelagem paramétrica, famílias executivas, pranchas nativas e cálculos de cargas | **Autor Principal (Fonte da Verdade)** |
| **OpenBIM / IFC (ISO 16739)** | Formato universal de interoperabilidade para intercâmbio de modelos | **Padrão de Dados Aberto** |
| **`web-ifc` / Web-IFC WASM** | Parser C++/WASM de alta velocidade para leitura de IFC no browser | **Parser Principal no Cliente** |
| **`@thatopen/components`** | Sucessor do IFC.js focado em fragmentação geométrica (*Fragments*) | **Camada de Fragmentos (Fase Experimental)** |
| **Three.js** | Motor WebGL para renderização de malhas, luzes, câmeras e materiais | **Runtime 3D Homologado** |
| **React Three Fiber (R3F)** | Camada declarativa React sobre Three.js | **Referência Conceitual** (Shell Vanilla JS preservado para máxima performance) |
| **Canvas 2D / SVG Engine** | Renderização vetorial de plantas humanizadas e pranchas | **Nativo de Alta Precisão** (`humanized-plan`, `sheet-engine`) |

---

## 2. Princípio Fundamental: Dados Estruturados > Inferência Visual

> **Regra Canônica de Ouro:**  
> Sempre que um dado existir na estrutura semântica BIM (propriedades IFC, dimensões, materiais, eixos ou parâmetros do Revit), a aplicação DEVE utilizar a query estruturada determinística.
> **Nunca invocar visão computacional ou LLM para tentar "adivinhar" uma informação que já está presente no modelo.**

Exemplo:
* ❌ *Incorreto:* Enviar um print da planta para um modelo de visão e perguntar: *"Quantos m² tem este living e qual o piso?"*
* ✔ *Correto:* Consultar `space.areaM2` e `space.properties['Piso_Acabamento']` via query relacional em menos de 1 milissegundo.

---

## 3. Pipeline Canônico de Dados IFC

```text
ARQUIVO IFC (.ifc)
      ↓
WEB-IFC WASM PARSE (Leitura de cabeçalho, entidades STEP e geometrias)
      ↓
ESTRUTURA HIERÁRQUICA (Project ➔ Building ➔ Storey ➔ Space ➔ Element)
      ↓
EXTRATOR DE GEOMETRIA (Geração de buffers, vértices e bounding boxes)
      ↓
PARSER DE PROPRIEDADES (PropertySets, Quantities e Classificações)
      ↓
CLASSIFICAÇÃO CANÔNICA (Alvenaria, Esquadria, Estrutura, Revestimento)
      ↓
VIEWER WEBGL (Renderização interativa aderente ao DESIGN.md)
      ↓
BIM CONTEXT BUILDER (Empacotamento estrito para agentes e IA)
```

---

## 4. Estrutura do BIM Context (`BIM_CONTEXT`)

O modelo de contexto BIM estruturado disponibiliza:

```json
{
  "project": { "id": "prj-01", "name": "Residência Alphaville", "unit": "METERS" },
  "building": { "id": "bld-01", "name": "Edifício Principal" },
  "storey": { "id": "lvl-01", "name": "Pavimento Térreo", "elevation": 0.00 },
  "space": {
    "id": "spc-living",
    "name": "Living Integrado",
    "number": "101",
    "areaM2": 52.50,
    "perimeterM": 29.80,
    "heightM": 3.00
  },
  "elements": [
    {
      "id": "wall-ext-01",
      "type": "IfcWallStandardCase",
      "category": "Alvenaria Externa",
      "material": "Alvenaria Cerâmica 20cm",
      "thicknessM": 0.20,
      "areaM2": 18.60,
      "properties": {
        "Acabamento_Externo": "Reboco Hidrófugo + Tinta Mineral",
        "Resistencia_Fogo": "CF 120min"
      }
    }
  ]
}
```

---

## 5. Capacidades Interativas do Viewer UX

A interface 3D adere aos princípios do **Apple Design System** (`DESIGN.md` v2.1.0):
1. **Navegação:** Orbit (rotação suave), Pan (translação), Zoom (óptico com amortecimento).
2. **Seleção & Destaque:** Destaque perimetral com cor semântica **Action Blue** (`#2997ff`), sem alterar as texturas originais do material.
3. **Isolamento & Ocultação:** Capacidade de isolar (`Isolate`) o ambiente focado e ocultar (`Hide`) elementos que obstruam a visibilidade.
4. **Planos de Corte (*Clipping Planes*):** Cortes ortogonais dinâmicos nos eixos X, Y e Z para visualização de seções transversais.
5. **Régua de Medição:** Cálculo métrico determinístico entre quaisquer dois vértices selecionados no espaço 3D.
6. **Painel de Propriedades (*Property Panel*):** Gaveta lateral flutuante exibindo metadados, conjuntos de propriedades IFC e histórico de aprovação.

---

## 6. Governança de Performance e Ciclo de Vida de Memória

* **Fragmentos & Lazy Loading:** Modelos complexos são divididos em fragmentos espaciais por pavimento (`Storey`), carregando em memória apenas os elementos do andar ativo.
* **Nível de Detalhe (LOD):** Elementos decorativos utilizam caixas delimitadoras (*bounding boxes*) simplificadas durante a movimentação da câmera, ativando geometria fina apenas em repouso.
* **Descarte Rígido de Memória (`dispose`):** Ao alternar de tela ou fechar um ambiente, todos os buffers de vértices, geometrias, materiais e texturas WebGL são formalmente liberados para evitar vazamentos de memória (memory leaks) no navegador.
